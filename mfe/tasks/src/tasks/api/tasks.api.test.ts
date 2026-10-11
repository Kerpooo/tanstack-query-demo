import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Task } from '../tasks.types'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('axios', () => ({ default: { create: () => http } }))

import { tasksApi } from './tasks.api'

const task: Task = { id: 'a', title: 'T', done: false, createdAt: '', assignees: [] }

beforeEach(() => vi.resetAllMocks())

describe('tasksApi', () => {
  it('list pide GET /tasks y devuelve los datos', async () => {
    http.get.mockResolvedValue({ data: [task] })
    expect(await tasksApi.list()).toEqual([task])
    expect(http.get).toHaveBeenCalledWith('/tasks')
  })

  it('create envía el título por POST', async () => {
    http.post.mockResolvedValue({ data: task })
    await tasksApi.create('T')
    expect(http.post).toHaveBeenCalledWith('/tasks', { title: 'T' })
  })

  it('toggle invierte done con PATCH', async () => {
    http.patch.mockResolvedValue({ data: task })
    await tasksApi.toggle(task)
    expect(http.patch).toHaveBeenCalledWith('/tasks/a', { done: true })
  })

  it('assign reemplaza los asignados con PATCH', async () => {
    http.patch.mockResolvedValue({ data: task })
    await tasksApi.assign('a', ['u1', 'u2'])
    expect(http.patch).toHaveBeenCalledWith('/tasks/a', { assigneeIds: ['u1', 'u2'] })
  })

  it('listUsers pide GET /users', async () => {
    http.get.mockResolvedValue({ data: [] })
    expect(await tasksApi.listUsers()).toEqual([])
    expect(http.get).toHaveBeenCalledWith('/users')
  })

  it('remove llama DELETE', async () => {
    http.delete.mockResolvedValue({})
    await tasksApi.remove('a')
    expect(http.delete).toHaveBeenCalledWith('/tasks/a')
  })
})
