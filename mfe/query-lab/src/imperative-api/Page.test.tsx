import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi } from '@/shared/api/endpoints'
import { demo, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(demoApi.clock).mockResolvedValue({ now: 'HORA' })
})

describe('QueryClient imperativo', () => {
  it('muestra la documentación arriba y la demo debajo', () => {
    renderWithQuery(<Page />)
    expectDocsAboveDemo()
  })

  it('getQueryData no pide nada y devuelve undefined si la caché está vacía', async () => {
    renderWithQuery(<Page />)

    await click('getQueryData')

    expect(await demo().findByText(/getQueryData → undefined/)).toBeInTheDocument()
    expect(demoApi.clock).not.toHaveBeenCalled()
  })

  it('fetchQuery respeta el staleTime: la segunda llamada reutiliza la caché', async () => {
    renderWithQuery(<Page />)

    await click('fetchQuery')
    await demo().findByText(/fetchQuery → petición n\.º/)
    await click('fetchQuery')
    await vi.waitFor(() => expect(demo().getAllByText(/fetchQuery → petición/)).toHaveLength(2))

    expect(demoApi.clock).toHaveBeenCalledTimes(1)
  })

  it('tras marcar como obsoleto, fetchQuery vuelve a pedir pero ensureQueryData no', async () => {
    renderWithQuery(<Page />)
    await click('fetchQuery')
    await demo().findByText(/fetchQuery → petición n\.º/)

    await click('Marcar como obsoleto')
    await click('ensureQueryData')
    await demo().findByText(/ensureQueryData → petición/)
    expect(demoApi.clock).toHaveBeenCalledTimes(1) // devuelve la caché obsoleta sin pedir

    await click('fetchQuery')
    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(2))
  })

  it('después de vaciar la caché, ensureQueryData sí pide', async () => {
    renderWithQuery(<Page />)
    await click('fetchQuery')
    await demo().findByText(/fetchQuery → petición n\.º/)

    await click('Vaciar la caché')
    await click('ensureQueryData')

    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(2))
  })
})
