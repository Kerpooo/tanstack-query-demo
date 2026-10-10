import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersApi } from '@/shared/api/endpoints'
import { badge, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const ana = { id: '1', name: 'Ana', email: 'ana@x.com' }
const luis = { id: '2', name: 'Luis', email: 'luis@x.com' }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(usersApi.list).mockResolvedValue([ana, luis])
  vi.mocked(usersApi.get).mockImplementation(async (id) => (id === '1' ? ana : luis))
})

describe('consultas dependientes (enabled)', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await screen.findByRole('button', { name: 'Ana' })
    expectDocsAboveDemo()
  })

  it('no pide el detalle hasta elegir un usuario', async () => {
    renderWithQuery(<Page />)
    await screen.findByRole('button', { name: 'Ana' })
    expect(usersApi.get).not.toHaveBeenCalled()
    expect(badge('enabled')).toHaveTextContent('false')
    expect(badge('fetchStatus')).toHaveTextContent('idle')
  })

  it('al elegir, habilita la consulta y muestra el detalle', async () => {
    renderWithQuery(<Page />)
    await userEvent.click(await screen.findByRole('button', { name: 'Ana' }))
    expect(await screen.findByText('ana@x.com', { exact: false })).toBeInTheDocument()
    expect(usersApi.get).toHaveBeenCalledWith('1')
    expect(badge('enabled')).toHaveTextContent('true')
  })

  it('volver a un usuario ya visto se muestra al instante desde la caché', async () => {
    renderWithQuery(<Page />)
    await userEvent.click(await screen.findByRole('button', { name: 'Ana' }))
    await screen.findByText(/ana@x.com/)
    await userEvent.click(screen.getByRole('button', { name: 'Luis' }))
    await screen.findByText(/luis@x.com/)
    await userEvent.click(screen.getByRole('button', { name: 'Ana' }))
    // Sin esperar: el dato ya estaba en caché (se revalida en segundo plano porque staleTime es 0).
    expect(screen.getByText(/ana@x.com/)).toBeInTheDocument()
  })
})
