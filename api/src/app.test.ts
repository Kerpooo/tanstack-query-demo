import { beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, jsonRequest } from './test-utils.js'
import type { Task } from './tasks.js'
import type { User } from './users.js'

let app: Awaited<ReturnType<typeof createTestApp>>
beforeEach(async () => {
  app = await createTestApp()
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

describe('usuarios asignados a tareas', () => {
  let users: User[]
  beforeEach(async () => {
    app = await createTestApp({ seed: true })
    users = (await (await app.request('/users')).json()) as User[]
  })

  const patch = (id: string, body: unknown) => app.request(`/tasks/${id}`, jsonRequest('PATCH', body))
  const byName = (name: string) => users.find((u) => u.name === name)!

  it('una tarea nueva no tiene asignados', async () => {
    expect((await createTask()).assignees).toEqual([])
  })

  it('crea una tarea con asignados ordenados por nombre', async () => {
    const [luis, ana] = [byName('Luis Pérez'), byName('Ana Torres')]
    const task = await createTask({ title: 'Con equipo', assigneeIds: [luis.id, ana.id] })
    expect(task.assignees).toEqual([
      { id: ana.id, name: 'Ana Torres' },
      { id: luis.id, name: 'Luis Pérez' },
    ])
  })

  it('PATCH reemplaza la lista completa y la lista de tareas la refleja', async () => {
    const [ana, marta] = [byName('Ana Torres'), byName('Marta Gómez')]
    const task = await createTask({ title: 'Reasignar', assigneeIds: [ana.id] })

    const res = await patch(task.id, { assigneeIds: [marta.id] })
    expect(res.status).toBe(200)
    expect(((await res.json()) as Task).assignees).toEqual([{ id: marta.id, name: 'Marta Gómez' }])

    const tasks = (await (await app.request('/tasks')).json()) as Task[]
    expect(tasks.find((t) => t.id === task.id)?.assignees.map((a) => a.name)).toEqual(['Marta Gómez'])
  })

  it('PATCH sin assigneeIds conserva los asignados', async () => {
    const ana = byName('Ana Torres')
    const task = await createTask({ title: 'Conservar', assigneeIds: [ana.id] })
    const res = await patch(task.id, { done: true })
    expect(await res.json()).toMatchObject({ done: true, assignees: [{ id: ana.id }] })
  })

  it('una lista vacía quita todos los asignados', async () => {
    const task = await createTask({ title: 'Vaciar', assigneeIds: [byName('Ana Torres').id] })
    expect(await (await patch(task.id, { assigneeIds: [] })).json()).toMatchObject({ assignees: [] })
  })

  it('ignora los ids repetidos', async () => {
    const ana = byName('Ana Torres')
    const task = await createTask({ title: 'Repetidos', assigneeIds: [ana.id, ana.id] })
    expect(task.assignees).toHaveLength(1)
  })

  it('rechaza usuarios inexistentes con 400 sin crear ni modificar la tarea', async () => {
    const res = await app.request('/tasks', json({ title: 'Fantasma', assigneeIds: ['no-existe'] }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Usuarios no encontrados: no-existe' })
    const tasks = (await (await app.request('/tasks')).json()) as Task[]
    expect(tasks.some((t) => t.title === 'Fantasma')).toBe(false)

    const ana = byName('Ana Torres')
    const task = await createTask({ title: 'Intacta', assigneeIds: [ana.id] })
    expect((await patch(task.id, { assigneeIds: [ana.id, 'no-existe'] })).status).toBe(400)
    expect(((await (await app.request(`/tasks/${task.id}`)).json()) as Task).assignees).toHaveLength(1)
  })

  it('al eliminar un usuario desaparece de las tareas', async () => {
    const [ana, luis] = [byName('Ana Torres'), byName('Luis Pérez')]
    const task = await createTask({ title: 'Sin Luis', assigneeIds: [ana.id, luis.id] })
    expect((await app.request(`/users/${luis.id}`, { method: 'DELETE' })).status).toBe(204)
    const updated = (await (await app.request(`/tasks/${task.id}`)).json()) as Task
    expect(updated.assignees.map((a) => a.name)).toEqual(['Ana Torres'])
  })

  it('al eliminar una tarea el usuario asignado sigue existiendo', async () => {
    const ana = byName('Ana Torres')
    const task = await createTask({ title: 'Borrar', assigneeIds: [ana.id] })
    expect((await app.request(`/tasks/${task.id}`, { method: 'DELETE' })).status).toBe(204)
    expect((await app.request(`/users/${ana.id}`)).status).toBe(200)
  })
})

describe('rutas desconocidas', () => {
  it('responde 404 con un mensaje JSON', async () => {
    const res = await app.request('/nada')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Ruta no encontrada' })
  })
})
