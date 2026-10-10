import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi } from '@/shared/api/endpoints'
import { expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const remount = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Desmontar el componente' }))
  await userEvent.click(screen.getByRole('button', { name: 'Montar el componente' }))
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(demoApi.clock).mockResolvedValue({ now: '2026-10-08T12:00:00.000Z' })
})

describe('caché: staleTime', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('2026-10-08T12:00:00.000Z')
    expectDocsAboveDemo()
  })

  it('con staleTime de 10 s, remontar reutiliza la caché (sin petición)', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('2026-10-08T12:00:00.000Z')
    await remount()
    expect(demoApi.clock).toHaveBeenCalledTimes(1)
  })

  it('con staleTime 0, remontar vuelve a pedir', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('2026-10-08T12:00:00.000Z')
    await userEvent.click(screen.getByRole('button', { name: /staleTime: 0 s/ }))
    await remount()
    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(2))
  })

  it('con Infinity nunca se considera obsoleto', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('2026-10-08T12:00:00.000Z')
    await userEvent.click(screen.getByRole('button', { name: /Infinity/ }))
    await remount()
    expect(demoApi.clock).toHaveBeenCalledTimes(1)
  })
})
