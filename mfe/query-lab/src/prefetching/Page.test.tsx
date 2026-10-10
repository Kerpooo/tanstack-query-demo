import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersApi } from '@/shared/api/endpoints'
import { demo, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const ana = { id: '1', name: 'Ana', email: 'ana@x.com' }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(usersApi.list).mockResolvedValue([ana])
  vi.mocked(usersApi.get).mockResolvedValue(ana)
})

describe('prefetchQuery', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await screen.findByRole('button', { name: 'Ana' })
    expectDocsAboveDemo()
  })

  it('al pasar el mouse precarga el detalle y lo marca como precargado', async () => {
    renderWithQuery(<Page />)
    const button = await screen.findByRole('button', { name: 'Ana' })
    expect(usersApi.get).not.toHaveBeenCalled()

    await userEvent.hover(button)

    expect(await demo().findByText('precargado')).toBeInTheDocument()
    expect(usersApi.get).toHaveBeenCalledWith('1')
  })

  it('al hacer clic usa lo precargado: no hay una segunda petición', async () => {
    renderWithQuery(<Page />)
    const button = await screen.findByRole('button', { name: 'Ana' })
    await userEvent.hover(button)
    await demo().findByText('precargado')

    await userEvent.click(button)

    expect(await demo().findByText(/ana@x.com/)).toBeInTheDocument()
    expect(usersApi.get).toHaveBeenCalledTimes(1) // staleTime evita volver a pedir
  })

  it('«Vaciar lo precargado» borra la marca', async () => {
    renderWithQuery(<Page />)
    await userEvent.hover(await screen.findByRole('button', { name: 'Ana' }))
    await demo().findByText('precargado')

    await userEvent.click(screen.getByRole('button', { name: 'Vaciar lo precargado' }))
    await vi.waitFor(() => expect(demo().queryByText('precargado')).not.toBeInTheDocument())
  })
})
