import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi } from '@/shared/api/endpoints'
import { badge, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(demoApi.clock).mockResolvedValue({ now: 'HORA' })
})

describe('polling y retry', () => {
  it('muestra la documentación arriba y la demo debajo', () => {
    renderWithQuery(<Page />)
    expectDocsAboveDemo()
  })

  it('el polling pide cada 2 s mientras está activo', async () => {
    renderWithQuery(<Page />)
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar polling' }))
    await vi.waitFor(() => expect(vi.mocked(demoApi.clock).mock.calls.length).toBeGreaterThanOrEqual(2), { timeout: 5000 })

    await userEvent.click(screen.getByRole('button', { name: 'Detener polling' }))
    const calls = vi.mocked(demoApi.clock).mock.calls.length
    await new Promise((resolve) => setTimeout(resolve, 2500))
    expect(demoApi.clock).toHaveBeenCalledTimes(calls) // al detenerlo ya no se pide
  }, 15_000)

  it('con retry: 0 la consulta falla al primer intento', async () => {
    vi.mocked(demoApi.flaky).mockRejectedValue(new Error('Fallo simulado (intento 1 de 2)'))
    renderWithQuery(<Page />)
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar con retry: 0' }))

    expect(await screen.findByText(/Falló: Fallo simulado/)).toBeInTheDocument()
    expect(demoApi.flaky).toHaveBeenCalledTimes(1)
  })

  it('con retry: 3 reintenta y termina con éxito', async () => {
    vi.mocked(demoApi.flaky)
      .mockRejectedValueOnce(new Error('Fallo simulado (intento 1 de 2)'))
      .mockRejectedValueOnce(new Error('Fallo simulado (intento 2 de 2)'))
      .mockResolvedValueOnce({ ok: true, attempt: 3 })
    renderWithQuery(<Page />)
    await userEvent.click(screen.getByRole('button', { name: 'Ejecutar con retry: 3' }))

    expect(await screen.findByText('Éxito en el intento 3.', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(demoApi.flaky).toHaveBeenCalledTimes(3)
    expect(badge('status')).toHaveTextContent('success')
  }, 15_000)
})
