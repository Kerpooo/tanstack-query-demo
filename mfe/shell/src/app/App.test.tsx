import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

beforeEach(() => window.history.pushState({}, '', '/'))

describe('App (shell)', () => {
  it('redirige / a tareas y muestra el título y la navegación', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'poc-rq' })).toBeInTheDocument()
    expect(await screen.findByText('Tasks remoto')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/tasks')
  })

  it('navega entre microfrontends con el menú', async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole('link', { name: 'Usuarios' }))
    expect(await screen.findByText('Users remoto')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/users')
    expect(screen.queryByText('Tasks remoto')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Tareas' }))
    expect(await screen.findByText('Tasks remoto')).toBeInTheDocument()
  })

  it('navega al laboratorio de TanStack Query', async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole('link', { name: 'TanStack Query' }))
    expect(await screen.findByText('Query Lab remoto')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/query')
  })

  it('carga el remote directamente desde una URL profunda', async () => {
    window.history.pushState({}, '', '/users/abc/edit')
    render(<App />)
    expect(await screen.findByText('Users remoto')).toBeInTheDocument()
  })

  it('muestra un mensaje en rutas desconocidas', () => {
    window.history.pushState({}, '', '/nada')
    render(<App />)
    expect(screen.getByText('Página no encontrada.')).toBeInTheDocument()
  })
})

describe('App (shell) con un remote caído', () => {
  it('muestra el error del microfrontend sin romper el resto', async () => {
    vi.resetModules()
    vi.doMock('tasks/TasksApp', () => {
      throw new Error('remote caído')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    window.history.pushState({}, '', '/tasks')
    const { default: FreshApp } = await import('./App')
    render(<FreshApp />)
    expect(await screen.findByText(/No se pudo cargar el microfrontend «tasks»/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Usuarios' }))
    expect(await screen.findByText('Users remoto')).toBeInTheDocument()
  })
})
