import { beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, jsonRequest } from './test-utils.js'
import type { Task } from './tasks.js'

let app: ReturnType<typeof createTestApp>
beforeEach(() => {
  app = createTestApp()
})

const json = (body: unknown) => jsonRequest('POST', body)

const createTask = async (body: unknown = { title: 'Tarea de prueba' }) =>
  (await (await app.request('/tasks', json(body))).json()) as Task

describe('GET /', () => {
  it('responde con el estado de la API', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ name: 'hono-api', status: 'ok' })
  })
})

describe('tareas', () => {
  it('crea una tarea con valores por defecto', async () => {
    const res = await app.request('/tasks', json({ title: 'Aprender Hono' }))
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ title: 'Aprender Hono', done: false })
  })

  it('rechaza un título vacío con 400', async () => {
    const res = await app.request('/tasks', json({ title: '' }))
    expect(res.status).toBe(400)
  })

  it('lista las tareas creadas', async () => {
    const task = await createTask({ title: 'Listada' })
    const tasks = (await (await app.request('/tasks')).json()) as Task[]
    expect(tasks.map((t) => t.id)).toContain(task.id)
  })

  it('obtiene una tarea por id y devuelve 404 si no existe', async () => {
    const task = await createTask()
    expect((await app.request(`/tasks/${task.id}`)).status).toBe(200)
    expect((await app.request('/tasks/no-existe')).status).toBe(404)
  })

  it('actualiza parcialmente una tarea', async () => {
    const task = await createTask()
    const res = await app.request(`/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ done: true }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: task.id, title: task.title, done: true })
  })

  it('devuelve 404 al actualizar una tarea inexistente', async () => {
    const res = await app.request('/tasks/no-existe', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ done: true }),
    })
    expect(res.status).toBe(404)
  })

  it('elimina una tarea (204) y luego da 404', async () => {
    const task = await createTask()
    expect((await app.request(`/tasks/${task.id}`, { method: 'DELETE' })).status).toBe(204)
    expect((await app.request(`/tasks/${task.id}`, { method: 'DELETE' })).status).toBe(404)
  })
})

describe('rutas desconocidas', () => {
  it('responde 404 con un mensaje JSON', async () => {
    const res = await app.request('/nada')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Ruta no encontrada' })
  })
})
