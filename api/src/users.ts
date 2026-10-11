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

const toUser = (r: Record<string, unknown>): User => ({
  id: String(r.id),
  name: String(r.name),
  email: String(r.email),
})

export const usersRepository = (db: Db) => ({
  async list(): Promise<User[]> {
    const { rows } = await db.execute('SELECT id, name, email FROM users ORDER BY name')
    return rows.map(toUser)
  },

  /** Página ordenada por nombre. `nextCursor` es el offset siguiente o `null` si no hay más. */
  async page(limit: number, offset: number): Promise<{ items: User[]; nextCursor: string | null }> {
    const { rows } = await db.execute({
      sql: 'SELECT id, name, email FROM users ORDER BY name LIMIT ? OFFSET ?',
      args: [limit + 1, offset],
    })
    return {
      items: rows.slice(0, limit).map(toUser),
      nextCursor: rows.length > limit ? String(offset + limit) : null,
    }
  },

  async get(id: string): Promise<User | undefined> {
    const { rows } = await db.execute({ sql: 'SELECT id, name, email FROM users WHERE id = ?', args: [id] })
    return rows[0] && toUser(rows[0])
  },

  async create(input: Omit<User, 'id'>): Promise<User> {
    const user: User = { id: randomUUID(), ...input }
    await db.execute({
      sql: 'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
      args: [user.id, user.name, user.email],
    })
    return user
  },

  async update(id: string, changes: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
    const current = await this.get(id)
    if (!current) return undefined
    const next = { ...current, ...changes }
    await db.execute({ sql: 'UPDATE users SET name = ?, email = ? WHERE id = ?', args: [next.name, next.email, id] })
    return next
  },

  async remove(id: string): Promise<boolean> {
    const [, deleted] = await db.batch(
      [
        { sql: 'DELETE FROM task_assignees WHERE user_id = ?', args: [id] },
        { sql: 'DELETE FROM users WHERE id = ?', args: [id] },
      ],
      'write',
    )
    return deleted!.rowsAffected > 0
  },
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
    .get('/', zValidator('query', pageQuerySchema), async (c) => {
      const { limit, cursor } = c.req.valid('query')
      if (limit === undefined && cursor === undefined) return c.json(await repo.list())
      return c.json(await repo.page(limit ?? 10, cursor ?? 0))
    })
    .get('/:id', async (c) => {
      const user = await repo.get(c.req.param('id'))
      return user ? c.json(user) : c.json(notFound, 404)
    })
    .post('/', zValidator('json', createSchema), async (c) => {
      try {
        return c.json(await repo.create(c.req.valid('json')), 201)
      } catch (err) {
        if (isUniqueViolation(err)) return c.json(duplicated, 409)
        throw err
      }
    })
    .patch('/:id', zValidator('json', updateSchema), async (c) => {
      try {
        const user = await repo.update(c.req.param('id'), c.req.valid('json'))
        return user ? c.json(user) : c.json(notFound, 404)
      } catch (err) {
        if (isUniqueViolation(err)) return c.json(duplicated, 409)
        throw err
      }
    })
    .delete('/:id', async (c) => ((await repo.remove(c.req.param('id'))) ? c.body(null, 204) : c.json(notFound, 404)))
}
