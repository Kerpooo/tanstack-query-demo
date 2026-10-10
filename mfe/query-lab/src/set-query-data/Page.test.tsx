import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tasksApi, type Task } from '@/shared/api/endpoints'
import { badge, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const task = (id: string, title: string): Task => ({ id, title, done: false, createdAt: '' })

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(tasksApi.list).mockResolvedValue([task('1', 'Existente')])
  vi.mocked(tasksApi.create).mockImplementation(async (title) => task(`n-${title}`, title))
})

describe('setQueryData', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Existente')
    expectDocsAboveDemo()
  })

  it('setQueryData agrega la tarea sin volver a pedir la lista', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Existente')
    const before = Number(badge('peticiones de la lista').textContent!.replace(/\D/g, ''))

    await userEvent.click(screen.getByRole('button', { name: 'Crear con setQueryData' }))

    expect(await screen.findByText(/Con setQueryData/)).toBeInTheDocument()
    expect(tasksApi.list).toHaveBeenCalledTimes(1)
    expect(badge('peticiones de la lista')).toHaveTextContent(String(before))
    expect(badge('tareas en caché')).toHaveTextContent('2')
  })

  it('invalidateQueries vuelve a pedir la lista al servidor', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Existente')

    await userEvent.click(screen.getByRole('button', { name: 'Crear con invalidateQueries' }))

    await vi.waitFor(() => expect(tasksApi.list).toHaveBeenCalledTimes(2))
  })
})
