import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersApi } from '@/shared/api/endpoints'
import { badge, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const users = Array.from({ length: 7 }, (_, i) => ({ id: String(i), name: `Usuario ${i}`, email: `u${i}@x.com` }))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(usersApi.list).mockResolvedValue(users)
})

describe('useQuery básico', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Usuario 0')
    expectDocsAboveDemo()
  })

  it('pasa de pending a success y lista los usuarios', async () => {
    renderWithQuery(<Page />)
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
    expect(await screen.findByText('Usuario 0')).toBeInTheDocument()
    expect(screen.getByText(/y 2 más/)).toBeInTheDocument()
    expect(badge('status')).toHaveTextContent('success')
  })

  it('refetch vuelve a pedir sin perder los datos', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Usuario 0')
    await userEvent.click(screen.getByRole('button', { name: /refetch/ }))
    await vi.waitFor(() => expect(usersApi.list).toHaveBeenCalledTimes(2))
    expect(screen.getByText('Usuario 0')).toBeInTheDocument()
  })

  it('muestra el error cuando falla la queryFn', async () => {
    vi.mocked(usersApi.list).mockRejectedValue(new Error('Network Error'))
    renderWithQuery(<Page />)
    expect(await screen.findByText(/Network Error/)).toBeInTheDocument()
    expect(badge('status')).toHaveTextContent('error')
  })
})
