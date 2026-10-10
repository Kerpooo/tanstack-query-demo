import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tasksApi } from '@/shared/api/endpoints'
import { expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const task = { id: '1', title: 'Existente', done: false, createdAt: '' }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(tasksApi.list).mockResolvedValue([task])
})

describe('useMutation + invalidateQueries', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Existente')
    expectDocsAboveDemo()
  })

  it('crea la tarea, limpia el campo e invalida la lista (la pide otra vez)', async () => {
    vi.mocked(tasksApi.create).mockResolvedValue({ ...task, id: '2', title: 'Nueva' })
    renderWithQuery(<Page />)
    await screen.findByText('Existente')

    const input = screen.getByLabelText('Título de la tarea')
    await userEvent.type(input, 'Nueva')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    await vi.waitFor(() => expect(tasksApi.create).toHaveBeenCalledWith('Nueva'))
    await vi.waitFor(() => expect(tasksApi.list).toHaveBeenCalledTimes(2))
    await vi.waitFor(() => expect(input).toHaveValue(''))
  })

  it('no envía un título vacío', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Existente')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar tarea' }))
    expect(tasksApi.create).not.toHaveBeenCalled()
  })

  it('muestra el error de la mutación', async () => {
    vi.mocked(tasksApi.create).mockRejectedValue(new Error('Servidor caído'))
    renderWithQuery(<Page />)
    await userEvent.type(await screen.findByLabelText('Título de la tarea'), 'X')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar tarea' }))
    expect(await screen.findByText(/Servidor caído/)).toBeInTheDocument()
  })
})
