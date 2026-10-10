import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi } from '@/shared/api/endpoints'
import { deferred, demo, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(demoApi.clock).mockResolvedValue({ now: 'HORA' })
  // React escribe en consola los errores que atrapa un ErrorBoundary: se silencia.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => vi.restoreAllMocks())

describe('useSuspenseQuery', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await demo().findByText('HORA')
    expectDocsAboveDemo()
  })

  it('muestra el fallback de Suspense mientras carga y luego los datos', async () => {
    const clock = deferred<{ now: string }>()
    vi.mocked(demoApi.clock).mockReturnValue(clock.promise)
    renderWithQuery(<Page />)

    expect(await demo().findByText(/Cargando informe/)).toBeInTheDocument()

    clock.resolve({ now: 'HORA' })
    expect(await demo().findByText('HORA')).toBeInTheDocument()
    expect(demo().queryByText(/Cargando informe/)).not.toBeInTheDocument()
  })

  it('un error llega al ErrorBoundary y «Reintentar» vuelve a pedir', async () => {
    vi.mocked(demoApi.fail).mockRejectedValue(new Error('boom'))
    renderWithQuery(<Page />)
    await demo().findByText('HORA')

    await userEvent.click(screen.getByLabelText('Forzar error del servidor'))
    expect(await demo().findByText(/El informe falló: boom/)).toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('Forzar error del servidor')) // desactivar
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await demo().findByText('HORA')).toBeInTheDocument()
    expect(demo().queryByRole('alert')).not.toBeInTheDocument()
  })
})
