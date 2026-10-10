import { beforeEach, describe, expect, it } from 'vitest'
import { SEED_USER_COUNT } from './db.js'
import { createTestApp, jsonRequest } from './test-utils.js'
import type { User } from './users.js'

let app: ReturnType<typeof createTestApp>
beforeEach(() => {
  app = createTestApp({ seed: true })
})

const create = (body: unknown) => app.request('/users', jsonRequest('POST', body))
const update = (id: string, body: unknown) => app.request(`/users/${id}`, jsonRequest('PATCH', body))
const list = async () => (await (await app.request('/users')).json()) as User[]

describe('usuarios', () => {
  it('lista los usuarios de ejemplo', async () => {
    const users = await list()
    expect(users).toHaveLength(SEED_USER_COUNT)
    expect(users[0]).toHaveProperty('email')
  })

  it('arranca vacío si no se pide semilla', async () => {
    const empty = createTestApp()
    expect(await (await empty.request('/users')).json()).toEqual([])
  })

  it('obtiene un usuario por id y da 404 si no existe', async () => {
    const [first] = await list()
    const res = await app.request(`/users/${first!.id}`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(first)
    expect((await app.request('/users/no-existe')).status).toBe(404)
  })

  it('crea un usuario válido y lo persiste', async () => {
    const res = await create({ name: 'Nuevo', email: 'nuevo@example.com' })
    expect(res.status).toBe(201)
    const created = (await res.json()) as User
    expect(await list()).toContainEqual(created)
  })

  it('rechaza un correo inválido o un nombre vacío con 400', async () => {
    expect((await create({ name: 'X', email: 'nope' })).status).toBe(400)
    expect((await create({ name: '   ', email: 'x@example.com' })).status).toBe(400)
  })

  it('rechaza un correo duplicado con 409', async () => {
    const res = await create({ name: 'Otra Ana', email: 'ana@example.com' })
    expect(res.status).toBe(409)
  })

  it('actualiza parcialmente un usuario', async () => {
    const [first] = await list()
    const res = await update(first!.id, { name: 'Renombrado' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ...first, name: 'Renombrado' })
  })

  it('devuelve 404 al actualizar un usuario inexistente', async () => {
    expect((await update('no-existe', { name: 'X' })).status).toBe(404)
  })

  it('devuelve 409 si el nuevo correo ya lo usa otro usuario', async () => {
    const [first, second] = await list()
    expect((await update(first!.id, { email: second!.email })).status).toBe(409)
  })

  it('elimina un usuario (204) y luego da 404', async () => {
    const [first] = await list()
    expect((await app.request(`/users/${first!.id}`, { method: 'DELETE' })).status).toBe(204)
    expect((await app.request(`/users/${first!.id}`, { method: 'DELETE' })).status).toBe(404)
    expect(await list()).toHaveLength(SEED_USER_COUNT - 1)
  })

  describe('paginación opt-in', () => {
    type Page = { items: User[]; nextCursor: string | null }
    const page = async (query: string) => (await (await app.request(`/users?${query}`)).json()) as Page

    it('devuelve { items, nextCursor } cuando se pide limit', async () => {
      const first = await page('limit=10')
      expect(first.items).toHaveLength(10)
      expect(first.nextCursor).toBe('10')
    })

    it('encadena páginas con el cursor hasta agotar los usuarios', async () => {
      const seen: string[] = []
      let cursor: string | null = '0'
      while (cursor !== null) {
        const res: Page = await page(`limit=12&cursor=${cursor}`)
        seen.push(...res.items.map((u) => u.id))
        cursor = res.nextCursor
      }
      expect(seen).toHaveLength(SEED_USER_COUNT)
      expect(new Set(seen).size).toBe(SEED_USER_COUNT)
    })

    it('la última página no tiene nextCursor', async () => {
      const last = await page(`limit=10&cursor=${SEED_USER_COUNT - 5}`)
      expect(last.items).toHaveLength(5)
      expect(last.nextCursor).toBeNull()
    })

    it('rechaza parámetros inválidos con 400', async () => {
      expect((await app.request('/users?limit=0')).status).toBe(400)
      expect((await app.request('/users?limit=abc')).status).toBe(400)
      expect((await app.request('/users?cursor=-1')).status).toBe(400)
    })
  })
})
