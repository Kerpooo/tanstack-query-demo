import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi } from '@/shared/api/endpoints'
import { badge, demo, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }))

beforeEach(() => {
  vi.resetAllMocks()
  // Petición que nunca termina sola y se rechaza si la cancelan.
  vi.mocked(demoApi.slow).mockImplementation(
    (_ms, signal) =>
      new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('cancelada')))
      }),
  )
})

describe('Cancelación de peticiones', () => {
  it('muestra la documentación arriba y la demo debajo', () => {
    renderWithQuery(<Page />)
    expectDocsAboveDemo()
  })

  it('pasa un AbortSignal a la petición', async () => {
    renderWithQuery(<Page />)
    await click('Pedir 3 s')

    await demo().findByText(/inicia la petición de 3000 ms/)
    expect(demoApi.slow).toHaveBeenCalledWith(3000, expect.any(AbortSignal))
  })

  it('cambiar de petición cancela la anterior', async () => {
    renderWithQuery(<Page />)
    await click('Pedir 3 s')
    await demo().findByText(/inicia la petición de 3000 ms/)

    await click('Pedir 5 s')

    expect(await demo().findByText(/se canceló la petición de 3000 ms/)).toBeInTheDocument()
    expect(await demo().findByText(/inicia la petición de 5000 ms/)).toBeInTheDocument()
  })

  it('el botón Cancelar detiene la petición actual sin dejar un error', async () => {
    renderWithQuery(<Page />)
    await click('Pedir 3 s')
    await demo().findByText(/inicia la petición de 3000 ms/)

    await click('Cancelar')

    expect(await demo().findByText(/se canceló la petición de 3000 ms/)).toBeInTheDocument()
    await vi.waitFor(() => expect(badge('fetchStatus')).toHaveTextContent('idle'))
    expect(badge('status')).not.toHaveTextContent('error')
  })
})
