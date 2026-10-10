import { expect, test } from '@playwright/test'

const API = 'http://localhost:3000'
const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

test.describe('API REST', () => {
  test('GET / responde ok', async ({ request }) => {
    const res = await request.get(`${API}/`)
    expect(res.ok()).toBeTruthy()
    expect(await res.json()).toEqual({ name: 'hono-api', status: 'ok' })
  })

  test('ciclo completo de una tarea', async ({ request }) => {
    const created = await request.post(`${API}/tasks`, { data: { title: 'e2e api' } })
    expect(created.status()).toBe(201)
    const task = await created.json()

    const patched = await request.patch(`${API}/tasks/${task.id}`, { data: { done: true } })
    expect((await patched.json()).done).toBe(true)

    expect((await request.delete(`${API}/tasks/${task.id}`)).status()).toBe(204)
    expect((await request.get(`${API}/tasks/${task.id}`)).status()).toBe(404)
  })

  test('valida el cuerpo al crear una tarea', async ({ request }) => {
    const res = await request.post(`${API}/tasks`, { data: { title: '' } })
    expect(res.status()).toBe(400)
  })

  test('lista los usuarios de ejemplo', async ({ request }) => {
    const users = await (await request.get(`${API}/users`)).json()
    expect(users.length).toBeGreaterThanOrEqual(3)
  })

  test('CRUD completo de un usuario', async ({ request }) => {
    const email = `${unique('crud')}@example.com`
    const created = await request.post(`${API}/users`, { data: { name: 'Crud', email } })
    expect(created.status()).toBe(201)
    const user = await created.json()

    const patched = await request.patch(`${API}/users/${user.id}`, { data: { name: 'Crud 2' } })
    expect(await patched.json()).toMatchObject({ id: user.id, name: 'Crud 2', email })

    expect((await request.get(`${API}/users/${user.id}`)).status()).toBe(200)
    expect((await request.delete(`${API}/users/${user.id}`)).status()).toBe(204)
    expect((await request.get(`${API}/users/${user.id}`)).status()).toBe(404)
  })

  test('rechaza correos duplicados (409) e inválidos (400)', async ({ request }) => {
    const dup = await request.post(`${API}/users`, { data: { name: 'Dup', email: 'ana@example.com' } })
    expect(dup.status()).toBe(409)

    const invalid = await request.post(`${API}/users`, { data: { name: 'X', email: 'nope' } })
    expect(invalid.status()).toBe(400)
  })
})
