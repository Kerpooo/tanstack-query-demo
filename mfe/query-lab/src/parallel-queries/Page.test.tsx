import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi, tasksApi, usersApi } from '@/shared/api/endpoints'
import { demo, deferred, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const card = (label: string) => demo().getByText(label).closest('div')!

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(tasksApi.list).mockResolvedValue([
    { id: '1', title: 'a', done: false, createdAt: '' },
    { id: '2', title: 'b', done: false, createdAt: '' },
  ])
  vi.mocked(usersApi.list).mockResolvedValue([{ id: '1', name: 'Ana', email: 'a@x.com' }])
})

describe('useQueries', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    vi.mocked(demoApi.slow).mockResolvedValue({ waited: 1500 })
    renderWithQuery(<Page />)
    await demo().findByText('1500')
    expectDocsAboveDemo()
  })

  it('las consultas rápidas no esperan a la lenta (corren en paralelo)', async () => {
    const slow = deferred<{ waited: number }>()
    vi.mocked(demoApi.slow).mockReturnValue(slow.promise)
    renderWithQuery(<Page />)

    // Las tres se lanzaron a la vez...
    expect(tasksApi.list).toHaveBeenCalledTimes(1)
    expect(usersApi.list).toHaveBeenCalledTimes(1)
    expect(demoApi.slow).toHaveBeenCalledTimes(1)

    // ...y las rápidas ya muestran su valor con la lenta aún pendiente.
    await vi.waitFor(() => expect(card('Tareas')).toHaveTextContent('2'))
    expect(card('Usuarios')).toHaveTextContent('1')
    expect(card('Endpoint lento (1,5 s)')).toHaveTextContent('Cargando…')

    slow.resolve({ waited: 1500 })
    await vi.waitFor(() => expect(card('Endpoint lento (1,5 s)')).toHaveTextContent('1500'))
  })

  it('repetir la consulta lenta no vuelve a pedir las otras', async () => {
    vi.mocked(demoApi.slow).mockResolvedValue({ waited: 1500 })
    renderWithQuery(<Page />)
    await demo().findByText('1500')

    await userEvent.click(screen.getByRole('button', { name: 'Repetir solo la consulta lenta' }))
    await vi.waitFor(() => expect(demoApi.slow).toHaveBeenCalledTimes(2))
    expect(tasksApi.list).toHaveBeenCalledTimes(1)
    expect(usersApi.list).toHaveBeenCalledTimes(1)
  })
})
