import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi } from '@/shared/api/endpoints'
import { deferred, demo, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }))
const bar = () => demo().getByRole('status', { name: 'Actividad global' })

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(demoApi.slow).mockImplementation((ms) => Promise.resolve({ waited: ms }))
})

describe('Estado global', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await demo().findByText('1000 ms')
    expectDocsAboveDemo()
  })

  it('en reposo, la barra no cuenta nada', async () => {
    renderWithQuery(<Page />)
    await demo().findByText('3000 ms')
    await vi.waitFor(() => expect(bar()).toHaveTextContent('En reposo'))
    expect(bar()).toHaveTextContent('Consultas en curso: 0')
  })

  it('refrescar todo hace que useIsFetching cuente las tres consultas', async () => {
    renderWithQuery(<Page />)
    await demo().findByText('3000 ms')
    const pending = [deferred<{ waited: number }>(), deferred<{ waited: number }>(), deferred<{ waited: number }>()]
    let call = 0
    vi.mocked(demoApi.slow).mockImplementation(() => pending[call++]!.promise)

    await click('Refrescar todo')

    await vi.waitFor(() => expect(bar()).toHaveTextContent('Consultas en curso: 3'))
    expect(bar()).toHaveTextContent('Trabajando')
    pending.forEach((p) => p.resolve({ waited: 1 }))
    await vi.waitFor(() => expect(bar()).toHaveTextContent('Consultas en curso: 0'))
  })

  it('useIsMutating y useMutationState listan los guardados en curso', async () => {
    renderWithQuery(<Page />)
    await demo().findByText('3000 ms')
    const saveA = deferred<{ waited: number }>()
    const saveB = deferred<{ waited: number }>()
    vi.mocked(demoApi.slow).mockReturnValueOnce(saveA.promise).mockReturnValueOnce(saveB.promise)

    await click('Guardar «Informe A»')
    await click('Guardar «Informe B»')

    await vi.waitFor(() => expect(bar()).toHaveTextContent('Mutaciones en curso: 2'))
    expect(bar()).toHaveTextContent('Guardando: Informe A, Informe B')

    saveA.resolve({ waited: 1500 })
    saveB.resolve({ waited: 1500 })
    await vi.waitFor(() => expect(bar()).toHaveTextContent('Mutaciones en curso: 0'))
  })
})
