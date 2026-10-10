import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { isUniqueViolation, type Db } from './db.js'

export interface User {
  id: string
  name: string
  email: string
}

export const usersRepository = (db: Db) => ({
  list: (): User[] => db.prepare('SELECT id, name, email FROM users ORDER BY name').all() as unknown as User[],

  /** Página ordenada por nombre. `nextCursor` es el offset siguiente o `null` si no hay más. */
  page(limit: number, offset: number): { items: User[]; nextCursor: string | null } {
    const rows = db
      .prepare('SELECT id, name, email FROM users ORDER BY name LIMIT ? OFFSET ?')
      .all(limit + 1, offset) as unknown as User[]
    return {
      items: rows.slice(0, limit),
      nextCursor: rows.length > limit ? String(offset + limit) : null,
    }
  },

  get: (id: string): User | undefined =>
    db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id) as User | undefined,

  create(input: Omit<User, 'id'>): User {
    const user: User = { id: randomUUID(), ...input }
    db.prepare('INSERT INTO users (id, name, email) VALUES (?, ?, ?)').run(user.id, user.name, user.email)
    return user
  },

  update(id: string, changes: Partial<Omit<User, 'id'>>): User | undefined {
    const current = this.get(id)
    if (!current) return undefined
    const next = { ...current, ...changes }
    db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(next.name, next.email, id)
    return next
  },

  remove: (id: string): boolean => Number(db.prepare('DELETE FROM users WHERE id = ?').run(id).changes) > 0,
})

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
})
const updateSchema = createSchema.partial()

// Paginación opt-in: sin `limit` ni `cursor` se devuelve el arreglo completo.
const pageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.coerce.number().int().min(0).optional(),
})

const notFound = { error: 'Usuario no encontrado' }
const duplicated = { error: 'Ya existe un usuario con ese correo' }

export const usersRoutes = (db: Db) => {
  const repo = usersRepository(db)
  return new Hono()
    .get('/', zValidator('query', pageQuerySchema), (c) => {
      const { limit, cursor } = c.req.valid('query')
      if (limit === undefined && cursor === undefined) return c.json(repo.list())
      return c.json(repo.page(limit ?? 10, cursor ?? 0))
    })
    .get('/:id', (c) => {
      const user = repo.get(c.req.param('id'))
      return user ? c.json(user) : c.json(notFound, 404)
    })
    .post('/', zValidator('json', createSchema), (c) => {
      try {
        return c.json(repo.create(c.req.valid('json')), 201)
      } catch (err) {
        if (isUniqueViolation(err)) return c.json(duplicated, 409)
        throw err
      }
    })
    .patch('/:id', zValidator('json', updateSchema), (c) => {
      try {
        const user = repo.update(c.req.param('id'), c.req.valid('json'))
        return user ? c.json(user) : c.json(notFound, 404)
      } catch (err) {
        if (isUniqueViolation(err)) return c.json(duplicated, 409)
        throw err
      }
    })
    .delete('/:id', (c) => (repo.remove(c.req.param('id')) ? c.body(null, 204) : c.json(notFound, 404)))
}
