import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersApi, type User } from '@/shared/api/endpoints'
import { badge, deferred, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const user = (n: number, name: string): User => ({ id: String(n), name, email: `${name}@x.com` })
const all = [user(1, 'Ana'), user(2, 'Luis'), user(3, 'Anabel')]

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(usersApi.list).mockResolvedValue(all)
  vi.mocked(usersApi.page).mockResolvedValue({ items: [user(1, 'Pagina uno')], nextCursor: '5' })
})

describe('select y placeholderData', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Pagina uno')
    expectDocsAboveDemo()
  })

  it('select deriva el conteo y el filtro de la MISMA petición', async () => {
    renderWithQuery(<Page />)
    await waitFor(() => expect(badge('total de usuarios')).toHaveTextContent('3'))
    await userEvent.type(screen.getByLabelText('Filtrar por nombre'), 'ana')
    await waitFor(() => expect(badge('coincidencias')).toHaveTextContent('2'))
    expect(usersApi.list).toHaveBeenCalledTimes(1)
  })

  it('mantiene la página anterior como placeholder mientras llega la siguiente', async () => {
    const next = deferred<{ items: User[]; nextCursor: string | null }>()
    vi.mocked(usersApi.page).mockResolvedValueOnce({ items: [user(1, 'Pagina uno')], nextCursor: '5' })
    vi.mocked(usersApi.page).mockReturnValueOnce(next.promise)
    renderWithQuery(<Page />)

    await screen.findByText('Pagina uno')
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    // La nueva página aún no llegó: se sigue viendo la anterior y está marcada como provisional.
    await waitFor(() => expect(badge('isPlaceholderData')).toHaveTextContent('true'))
    expect(screen.getByText('Pagina uno')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()

    next.resolve({ items: [user(2, 'Pagina dos')], nextCursor: null })
    expect(await screen.findByText('Pagina dos')).toBeInTheDocument()
    expect(usersApi.page).toHaveBeenLastCalledWith(5, '5')
    expect(badge('isPlaceholderData')).toHaveTextContent('false')
  })

  it('no permite retroceder desde la primera página', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Pagina uno')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
  })
})
