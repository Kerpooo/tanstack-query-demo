import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi, tasksApi, usersApi } from '@/shared/api/endpoints'
import { renderWithProviders } from '@/test/renderWithProviders'
import QueryLabApp from './QueryLabApp'
import { concepts } from './concepts'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const renderApp = (route = '/query') =>
  renderWithProviders(<QueryLabApp />, { route, mountAt: '/query/*' })

const title = (text: string) => screen.findByText(text, { selector: 'h2' })

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(usersApi.list).mockResolvedValue([])
  vi.mocked(usersApi.page).mockResolvedValue({ items: [], nextCursor: null })
  vi.mocked(tasksApi.list).mockResolvedValue([])
  vi.mocked(demoApi.clock).mockResolvedValue({ now: 'HORA' })
  vi.mocked(demoApi.slow).mockResolvedValue({ waited: 1 })
})

describe('QueryLabApp', () => {
  it('lista todos los conceptos en el índice lateral', () => {
    renderApp()
    const nav = screen.getByRole('navigation', { name: 'Conceptos de TanStack Query' })
    expect(within(nav).getAllByRole('link')).toHaveLength(concepts.length)
  })

  it('redirige /query al primer concepto', async () => {
    renderApp('/query')
    expect(await title(concepts[0]!.title)).toBeInTheDocument()
  })

  it('cada enlace del índice abre la página de su concepto', async () => {
    renderApp()
    for (const concept of concepts) {
      await userEvent.click(screen.getByRole('link', { name: new RegExp(concept.title.replace(/[()]/g, '\\$&')) }))
      expect(await title(concept.title)).toBeInTheDocument()
    }
  })

  it('abre un concepto directamente desde su URL', async () => {
    renderApp('/query/infinite-queries')
    expect(await title('useInfiniteQuery')).toBeInTheDocument()
  })

  it('una URL desconocida vuelve al primer concepto', async () => {
    renderApp('/query/no-existe')
    expect(await title(concepts[0]!.title)).toBeInTheDocument()
  })
})
