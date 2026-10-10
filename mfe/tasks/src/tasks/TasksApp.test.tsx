import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import TasksApp from './TasksApp'
import { tasksApi } from './api/tasks.api'
import type { Task } from './tasks.types'

vi.mock('./api/tasks.api', () => ({
  tasksApi: { list: vi.fn(), create: vi.fn(), toggle: vi.fn(), remove: vi.fn() },
}))

const api = vi.mocked(tasksApi)

const task = (over: Partial<Task> = {}): Task => ({
  id: '1',
  title: 'Aprender Hono',
  done: false,
  createdAt: '2026-10-08T00:00:00.000Z',
  ...over,
})

const renderApp = (route = '/tasks') =>
  renderWithProviders(<TasksApp />, { route, mountAt: '/tasks/*' })

beforeEach(() => {
  vi.resetAllMocks()
  api.list.mockResolvedValue([task()])
})

describe('TasksApp', () => {
  it('muestra las tareas que devuelve la API', async () => {
    renderApp()
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
    expect(await screen.findByText('Aprender Hono')).toBeInTheDocument()
  })

  it('redirige las rutas desconocidas a la lista', async () => {
    renderApp('/tasks/otra-cosa')
    expect(await screen.findByText('Aprender Hono')).toBeInTheDocument()
  })

  it('muestra el error cuando falla la carga', async () => {
    api.list.mockRejectedValue(new Error('Network Error'))
    renderApp()
    expect(await screen.findByText(/Network Error/)).toBeInTheDocument()
  })

  it('crea una tarea, limpia el campo y vuelve a cargar la lista', async () => {
    api.create.mockResolvedValue(task({ id: '2', title: 'Nueva' }))
    renderApp()
    await screen.findByText('Aprender Hono')

    const input = screen.getByLabelText('Nueva tarea')
    await userEvent.type(input, '  Nueva  ')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }))

    await waitFor(() => expect(api.create).toHaveBeenCalledWith('Nueva'))
    await waitFor(() => expect(input).toHaveValue(''))
    await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2))
  })

  it('no crea una tarea con título vacío', async () => {
    renderApp()
    await screen.findByText('Aprender Hono')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }))
    expect(api.create).not.toHaveBeenCalled()
  })

  it('alterna el estado de una tarea', async () => {
    api.toggle.mockResolvedValue(task({ done: true }))
    renderApp()
    await userEvent.click(await screen.findByRole('checkbox'))
    await waitFor(() => expect(api.toggle).toHaveBeenCalled())
    expect(api.toggle.mock.calls[0]?.[0]).toMatchObject({ id: '1', done: false })
  })

  it('elimina una tarea', async () => {
    api.remove.mockResolvedValue(undefined)
    renderApp()
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Aprender Hono' }))
    await waitFor(() => expect(api.remove).toHaveBeenCalled())
    expect(api.remove.mock.calls[0]?.[0]).toBe('1')
  })
})
