import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import TasksApp from './TasksApp'
import { tasksApi } from './api/tasks.api'
import type { AssignableUser, Task } from './tasks.types'

vi.mock('./api/tasks.api', () => ({
  tasksApi: {
    list: vi.fn(),
    create: vi.fn(),
    toggle: vi.fn(),
    assign: vi.fn(),
    remove: vi.fn(),
    listUsers: vi.fn(),
  },
}))

const api = vi.mocked(tasksApi)

const task = (over: Partial<Task> = {}): Task => ({
  id: '1',
  title: 'Aprender Hono',
  done: false,
  createdAt: '2026-10-08T00:00:00.000Z',
  assignees: [],
  ...over,
})

const users: AssignableUser[] = [
  { id: 'ana', name: 'Ana Torres', email: 'ana@example.com' },
  { id: 'luis', name: 'Luis Pérez', email: 'luis@example.com' },
]

const renderApp = (route = '/tasks') =>
  renderWithProviders(<TasksApp />, { route, mountAt: '/tasks/*' })

beforeEach(() => {
  vi.resetAllMocks()
  api.list.mockResolvedValue([task()])
  api.listUsers.mockResolvedValue(users)
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

  it('muestra un estado vacío cuando no hay tareas', async () => {
    api.list.mockResolvedValue([])
    renderApp()
    expect(await screen.findByText(/No hay tareas todavía/)).toBeInTheDocument()
  })

  it('reintenta la carga desde el estado de error', async () => {
    api.list.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValue([task()])
    renderApp()
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar las tareas')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Aprender Hono')).toBeInTheDocument()
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

  describe('usuarios asignados', () => {
    const openPicker = async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Asignar usuarios a Aprender Hono' }))
      return screen.findByRole('listbox', { name: 'Usuarios para Aprender Hono' })
    }

    it('muestra los asignados de cada tarea', async () => {
      api.list.mockResolvedValue([task({ assignees: [{ id: 'ana', name: 'Ana Torres' }] })])
      renderApp()
      const list = await screen.findByRole('list', { name: 'Asignados a Aprender Hono' })
      expect(within(list).getByText('Ana Torres')).toBeInTheDocument()
    })

    it('no pide los usuarios hasta abrir el selector', async () => {
      renderApp()
      await screen.findByText('Aprender Hono')
      expect(api.listUsers).not.toHaveBeenCalled()
      await openPicker()
      expect(api.listUsers).toHaveBeenCalledTimes(1)
    })

    it('asignar un usuario lo muestra al instante y lo guarda', async () => {
      const assigned = task({ assignees: [{ id: 'ana', name: 'Ana Torres' }] })
      const response = deferred<Task>()
      api.assign.mockReturnValue(response.promise)
      renderApp()
      const listbox = await openPicker()

      await userEvent.click(await within(listbox).findByRole('option', { name: 'Ana Torres' }))

      // Optimista: el badge y la marca aparecen antes de que responda la API.
      expect(api.assign).toHaveBeenCalledWith('1', ['ana'])
      expect(within(listbox).getByRole('option', { name: 'Ana Torres' })).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByRole('list', { name: 'Asignados a Aprender Hono' })).toHaveTextContent('Ana Torres')

      api.list.mockResolvedValue([assigned])
      response.resolve(assigned)
      await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2))
    })

    it('quitar un usuario envía la lista sin él', async () => {
      api.list.mockResolvedValue([
        task({ assignees: [{ id: 'ana', name: 'Ana Torres' }, { id: 'luis', name: 'Luis Pérez' }] }),
      ])
      api.assign.mockResolvedValue(task())
      renderApp()
      const listbox = await openPicker()
      await userEvent.click(await within(listbox).findByRole('option', { name: 'Ana Torres' }))
      expect(api.assign).toHaveBeenCalledWith('1', ['luis'])
    })

    it('revierte la asignación y muestra el error si la API falla', async () => {
      api.assign.mockRejectedValue(new Error('Network Error'))
      renderApp()
      const listbox = await openPicker()
      await userEvent.click(await within(listbox).findByRole('option', { name: 'Ana Torres' }))

      expect(await screen.findByText(/No se pudo completar la acción/)).toBeInTheDocument()
      expect(screen.queryByRole('list', { name: 'Asignados a Aprender Hono' })).not.toBeInTheDocument()
    })

    it('filtra los usuarios por nombre o correo', async () => {
      renderApp()
      const listbox = await openPicker()
      await within(listbox).findByRole('option', { name: 'Ana Torres' })
      await userEvent.type(screen.getByRole('combobox', { name: 'Buscar usuario' }), 'luis@')
      await waitFor(() => expect(within(listbox).queryByRole('option', { name: 'Ana Torres' })).not.toBeInTheDocument())
      expect(within(listbox).getByRole('option', { name: 'Luis Pérez' })).toBeInTheDocument()
    })

    it('muestra el error si no se pueden cargar los usuarios', async () => {
      api.listUsers.mockRejectedValue(new Error('Network Error'))
      renderApp()
      const listbox = await openPicker()
      expect(await within(listbox).findByRole('alert')).toHaveTextContent('No se pudieron cargar los usuarios')
    })
  })
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}
