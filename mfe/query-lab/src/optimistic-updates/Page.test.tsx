import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi, tasksApi, type Task } from '@/shared/api/endpoints'
import { deferred, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const task: Task = { id: '1', title: 'Pendiente', done: false, createdAt: '' }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(tasksApi.list).mockResolvedValue([task])
})

describe('actualizaciones optimistas', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Pendiente')
    expectDocsAboveDemo()
  })

  it('marca la casilla al instante, antes de que responda el servidor', async () => {
    const server = deferred<Task>()
    vi.mocked(tasksApi.toggle).mockReturnValue(server.promise)
    renderWithQuery(<Page />)

    const checkbox = await screen.findByRole('checkbox', { name: 'Pendiente' })
    await userEvent.click(checkbox)

    // El servidor todavía no respondió y el cambio ya se ve.
    await waitFor(() => expect(checkbox).toBeChecked())
    expect(screen.getByText(/Guardando/)).toBeInTheDocument()

    server.resolve({ ...task, done: true })
  })

  it('si el servidor falla, revierte el cambio y avisa', async () => {
    const failure = deferred<never>()
    vi.mocked(demoApi.fail).mockReturnValue(failure.promise)
    renderWithQuery(<Page />)

    await userEvent.click(await screen.findByLabelText('Forzar fallo del servidor'))
    const checkbox = screen.getByRole('checkbox', { name: 'Pendiente' })
    await userEvent.click(checkbox)
    await waitFor(() => expect(checkbox).toBeChecked()) // optimista

    failure.reject(new Error('500'))

    expect(await screen.findByText(/se revirtió el cambio/)).toBeInTheDocument()
    await waitFor(() => expect(checkbox).not.toBeChecked()) // rollback
    expect(tasksApi.toggle).not.toHaveBeenCalled()
  })

  it('sin tareas, ofrece crear una de ejemplo', async () => {
    vi.mocked(tasksApi.list).mockResolvedValue([])
    vi.mocked(tasksApi.create).mockResolvedValue(task)
    renderWithQuery(<Page />)
    expect(await screen.findByText(/No hay tareas/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Crear tarea de ejemplo' }))
    await waitFor(() => expect(tasksApi.create).toHaveBeenCalled())
  })
})
