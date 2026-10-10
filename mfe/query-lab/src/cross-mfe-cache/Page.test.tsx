import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersApi } from '@/shared/api/endpoints'
import { demo, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const ana = { id: '1', name: 'Ana', email: 'ana@x.com' }
const inventory = () => demo().getByRole('list', { name: 'Claves en la caché' })

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(usersApi.list).mockResolvedValue([ana])
})

describe('Leer la caché de otro microfrontend', () => {
  it('muestra la documentación arriba y la demo debajo', () => {
    renderWithQuery(<Page />)
    expectDocsAboveDemo()
  })

  it('sin datos bajo la clave no pide nada al servidor', () => {
    renderWithQuery(<Page />)

    expect(demo().getByText(/Todavía no hay datos bajo esa clave/)).toBeInTheDocument()
    expect(usersApi.list).not.toHaveBeenCalled()
  })

  it('muestra lo que otro microfrontend puso en la caché y se actualiza cuando cambia', async () => {
    const { client } = renderWithQuery(<Page />)

    // Otro microfrontend (que esta página no conoce) llena la clave:
    act(() => client.setQueryData(['users'], [ana]))
    expect(await demo().findByText('Ana')).toBeInTheDocument()

    act(() => client.setQueryData(['users'], [{ ...ana, name: 'Ana María' }]))
    expect(await demo().findByText('Ana María')).toBeInTheDocument()
    expect(usersApi.list).not.toHaveBeenCalled() // nunca pidió nada
  })

  it('el inventario enumera todas las claves de la caché, también las ajenas', async () => {
    const { client } = renderWithQuery(<Page />)

    act(() => {
      client.setQueryData(['users'], [ana])
      client.setQueryData(['otro-mfe', 'secreto'], { token: 'x' })
    })

    expect(await demo().findByText(/\["otro-mfe","secreto"\]/)).toBeInTheDocument()
    expect(inventory()).toHaveTextContent('["users"]')
  })

  it('alterar cambia los datos de la clave ajena y restaurar los repara desde el servidor', async () => {
    const { client } = renderWithQuery(<Page />)
    act(() => client.setQueryData(['users'], [ana]))
    await demo().findByText('Ana')

    await userEvent.click(screen.getByRole('button', { name: 'Alterar los datos de ese microfrontend' }))
    expect(await demo().findByText('Ana (alterado)')).toBeInTheDocument()
    expect(client.getQueryData<(typeof ana)[]>(['users'])![0]!.name).toBe('Ana (alterado)')

    await userEvent.click(screen.getByRole('button', { name: 'Restaurar desde el servidor' }))
    expect(await demo().findByText('Ana')).toBeInTheDocument()
    expect(usersApi.list).toHaveBeenCalledTimes(1)
  })
})
