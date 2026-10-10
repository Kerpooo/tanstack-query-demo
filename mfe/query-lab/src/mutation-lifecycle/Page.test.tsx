import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi } from '@/shared/api/endpoints'
import { badge, demo, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }))
const log = () => demo().getByRole('list', { name: 'Registro de eventos' })

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(demoApi.fail).mockRejectedValue(new Error('500'))
})

describe('Ciclo de vida de una mutación', () => {
  it('muestra la documentación arriba y la demo debajo', () => {
    renderWithQuery(<Page />)
    expectDocsAboveDemo()
  })

  it('con mutate: onMutate → onSuccess → onSettled → onSuccess del llamado, en ese orden', async () => {
    renderWithQuery(<Page />)

    await click('Guardar con mutate')

    await demo().findByText(/onSuccess del llamado/)
    const lines = Array.from(log().querySelectorAll('li')).map((li) => li.textContent ?? '')
    expect(lines).toHaveLength(4)
    expect(lines[0]).toMatch(/onMutate/)
    expect(lines[1]).toMatch(/onSuccess — guardó/)
    expect(lines[2]).toMatch(/onSettled/)
    expect(lines[3]).toMatch(/mutate → onSuccess del llamado/)
    expect(badge('status')).toHaveTextContent('success')
  })

  it('si el servidor falla se ejecuta onError y onSettled igualmente', async () => {
    renderWithQuery(<Page />)
    await userEvent.click(screen.getByLabelText('Forzar fallo del servidor'))

    await click('Guardar con mutate')

    await demo().findByText(/mutate → onError del llamado/)
    expect(log()).toHaveTextContent('onError — el servidor falló')
    expect(log()).toHaveTextContent('onSettled')
    expect(log()).not.toHaveTextContent('onSuccess — guardó')
    expect(badge('status')).toHaveTextContent('error')
  })

  it('mutateAsync se puede esperar con await y su error se atrapa con catch', async () => {
    renderWithQuery(<Page />)
    await click('Guardar con mutateAsync')
    expect(await demo().findByText(/await terminó: Borrador 2/)).toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('Forzar fallo del servidor'))
    await click('Guardar con mutateAsync')
    expect(await demo().findByText(/catch — el await falló/)).toBeInTheDocument()
  })

  it('reset() devuelve la mutación a idle', async () => {
    renderWithQuery(<Page />)
    await click('Guardar con mutate')
    await vi.waitFor(() => expect(badge('status')).toHaveTextContent('success'))

    await click('reset()')

    await vi.waitFor(() => expect(badge('status')).toHaveTextContent('idle'))
    expect(badge('isIdle')).toHaveTextContent('true')
  })
})
