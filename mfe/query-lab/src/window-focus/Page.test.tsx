import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi } from '@/shared/api/endpoints'
import { badge, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const settle = () => new Promise((resolve) => setTimeout(resolve, 50))
const click = (name: string) => userEvent.click(screen.getByRole('button', { name }))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(demoApi.clock).mockResolvedValue({ now: 'HORA' })
})

describe('Foco de ventana y reconexión', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('HORA')
    expectDocsAboveDemo()
  })

  it('al recuperar el foco vuelve a pedir los datos obsoletos', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('HORA')
    expect(demoApi.clock).toHaveBeenCalledTimes(1)

    await click('Simular que la ventana pierde y recupera el foco')

    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(2))
  })

  it('con refetchOnWindowFocus desactivado no vuelve a pedir', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('HORA')
    await userEvent.click(screen.getByLabelText('refetchOnWindowFocus activado'))

    await click('Simular que la ventana pierde y recupera el foco')
    await settle()

    expect(demoApi.clock).toHaveBeenCalledTimes(1)
  })

  it('sin conexión la petición queda en paused y se reanuda al reconectar', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('HORA')

    await click('Simular desconexión')
    await click('Volver a pedir (refetch)')
    await vi.waitFor(() => expect(badge('fetchStatus')).toHaveTextContent('paused'))
    expect(demoApi.clock).toHaveBeenCalledTimes(1)

    await click('Restaurar conexión')
    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(2))
    await vi.waitFor(() => expect(badge('fetchStatus')).toHaveTextContent('idle'))
  })
})
