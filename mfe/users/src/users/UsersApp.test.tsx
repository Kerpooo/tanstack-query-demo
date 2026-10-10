import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import UsersApp from './UsersApp'
import { usersApi } from './api/users.api'
import type { User } from './users.types'

vi.mock('./api/users.api', () => ({
  usersApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))

const api = vi.mocked(usersApi)

const ana: User = { id: '1', name: 'Ana Torres', email: 'ana@example.com' }
const luis: User = { id: '2', name: 'Luis Pérez', email: 'luis@example.com' }

const renderApp = (route = '/users') =>
  renderWithProviders(<UsersApp />, { route, mountAt: '/users/*' })

// CardTitle de shadcn es un <div data-slot="card-title">, no un heading.
const titleOptions = { selector: '[data-slot="card-title"]' }
const findTitle = (text: string) => screen.findByText(text, titleOptions)
const getTitle = (text: string) => screen.getByText(text, titleOptions)

/** Error como el que lanza axios cuando la API responde `{ error }`. */
const apiError = (status: number, message: string) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: { error: message },
  } as never)

beforeEach(() => {
  vi.resetAllMocks()
  api.list.mockResolvedValue([ana, luis])
  api.get.mockResolvedValue(ana)
})

describe('listado de usuarios', () => {
  it('muestra los usuarios en una tabla', async () => {
    renderApp()
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('luis@example.com')).toBeInTheDocument()
  })

  it('muestra un mensaje si no hay usuarios', async () => {
    api.list.mockResolvedValue([])
    renderApp()
    expect(await screen.findByText('No hay usuarios todavía.')).toBeInTheDocument()
  })

  it('muestra el error cuando falla la carga', async () => {
    api.list.mockRejectedValue(apiError(500, 'Error interno del servidor'))
    renderApp()
    expect(await screen.findByText(/Error interno del servidor/)).toBeInTheDocument()
  })

  it('redirige las rutas desconocidas al listado', async () => {
    renderApp('/users/no/existe/aqui')
    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
  })

  it('pide confirmación antes de eliminar y luego elimina', async () => {
    api.remove.mockResolvedValue(undefined)
    renderApp()
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Ana Torres' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('¿Eliminar a Ana Torres?')).toBeInTheDocument()
    expect(api.remove).not.toHaveBeenCalled()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(api.remove).toHaveBeenCalled())
    expect(api.remove.mock.calls[0]?.[0]).toBe('1')
  })

  it('cancelar la confirmación no elimina', async () => {
    renderApp()
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Ana Torres' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }))
    expect(api.remove).not.toHaveBeenCalled()
  })
})

describe('crear usuario', () => {
  const openForm = async () => {
    renderApp()
    await userEvent.click(await screen.findByRole('link', { name: 'Nuevo usuario' }))
    return findTitle('Nuevo usuario')
  }

  it('navega al formulario y vuelve al listado tras crear', async () => {
    api.create.mockResolvedValue({ id: '3', name: 'Marta', email: 'marta@example.com' })
    await openForm()

    await userEvent.type(screen.getByLabelText('Nombre'), 'Marta')
    await userEvent.type(screen.getByLabelText('Correo'), 'marta@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({ name: 'Marta', email: 'marta@example.com' }),
    )
    expect(await findTitle('Usuarios')).toBeInTheDocument()
  })

  it('valida los campos en el cliente y no llama a la API', async () => {
    await openForm()
    await userEvent.type(screen.getByLabelText('Correo'), 'no-es-correo')
    await userEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('Ingrese un correo válido')).toBeInTheDocument()
    expect(api.create).not.toHaveBeenCalled()
  })

  it('muestra el error de la API (correo duplicado) y permanece en el formulario', async () => {
    api.create.mockRejectedValue(apiError(409, 'Ya existe un usuario con ese correo'))
    await openForm()
    await userEvent.type(screen.getByLabelText('Nombre'), 'Otra Ana')
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))

    expect(await screen.findByText('Ya existe un usuario con ese correo')).toBeInTheDocument()
    expect(getTitle('Nuevo usuario')).toBeInTheDocument()
  })

  it('cancelar vuelve al listado', async () => {
    await openForm()
    await userEvent.click(screen.getByRole('link', { name: 'Cancelar' }))
    expect(await findTitle('Usuarios')).toBeInTheDocument()
  })
})

describe('editar usuario', () => {
  it('precarga el usuario, guarda los cambios y vuelve al listado', async () => {
    api.update.mockResolvedValue({ ...ana, name: 'Ana María' })
    renderApp('/users/1/edit')

    const name = await screen.findByLabelText('Nombre')
    await waitFor(() => expect(name).toHaveValue('Ana Torres'))
    expect(screen.getByLabelText('Correo')).toHaveValue('ana@example.com')

    await userEvent.clear(name)
    await userEvent.type(name, 'Ana María')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(api.update).toHaveBeenCalled())
    expect(api.update).toHaveBeenCalledWith('1', { name: 'Ana María', email: 'ana@example.com' })
    expect(await findTitle('Usuarios')).toBeInTheDocument()
  })

  it('llega desde el botón Editar del listado', async () => {
    renderApp()
    await userEvent.click(await screen.findByRole('link', { name: 'Editar Luis Pérez' }))
    expect(await findTitle('Editar usuario')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('2')
  })

  it('muestra el error si el usuario no existe', async () => {
    api.get.mockRejectedValue(apiError(404, 'Usuario no encontrado'))
    renderApp('/users/999/edit')
    expect(await screen.findByText(/Usuario no encontrado/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument()
  })
})
