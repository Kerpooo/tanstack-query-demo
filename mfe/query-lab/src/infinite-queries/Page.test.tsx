import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersApi } from '@/shared/api/endpoints'
import { badge, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const u = (id: string) => ({ id, name: `Nombre ${id}`, email: `${id}@x.com` })

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(usersApi.page).mockImplementation(async (_limit, cursor = '0') =>
    cursor === '0' ? { items: [u('a'), u('b')], nextCursor: '8' } : { items: [u('c')], nextCursor: null },
  )
})

describe('useInfiniteQuery', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Nombre a')
    expectDocsAboveDemo()
  })

  it('carga la primera página con el cursor inicial', async () => {
    renderWithQuery(<Page />)
    expect(await screen.findByText('Nombre a')).toBeInTheDocument()
    expect(usersApi.page).toHaveBeenCalledWith(8, '0')
    expect(badge('páginas cargadas')).toHaveTextContent('1')
  })

  it('«Cargar más» agrega la siguiente página usando nextCursor', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Nombre a')
    await userEvent.click(screen.getByRole('button', { name: 'Cargar más' }))

    expect(await screen.findByText('Nombre c')).toBeInTheDocument()
    expect(usersApi.page).toHaveBeenLastCalledWith(8, '8')
    expect(screen.getByText('Nombre a')).toBeInTheDocument() // las anteriores se conservan
    expect(badge('páginas cargadas')).toHaveTextContent('2')
  })

  it('al llegar a la última página deshabilita el botón', async () => {
    renderWithQuery(<Page />)
    await screen.findByText('Nombre a')
    await userEvent.click(screen.getByRole('button', { name: 'Cargar más' }))
    await screen.findByText('Nombre c')
    expect(screen.getByRole('button', { name: 'Cargar más' })).toBeDisabled()
    expect(screen.getByText('No hay más usuarios.')).toBeInTheDocument()
    expect(badge('hasNextPage')).toHaveTextContent('false')
  })
})
