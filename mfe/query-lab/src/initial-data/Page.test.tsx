import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersApi } from '@/shared/api/endpoints'
import { deferred, demo, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const ana = { id: '1', name: 'Ana', email: 'ana@x.com' }
const panel = (name: string) => within(demo().getByRole('group', { name }))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(usersApi.list).mockResolvedValue([ana])
})

describe('initialData frente a placeholderData', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await screen.findByRole('button', { name: 'Ana' })
    expectDocsAboveDemo()
  })

  it('ambos paneles muestran los datos de la lista al instante', async () => {
    const detail = deferred<typeof ana>()
    vi.mocked(usersApi.get).mockReturnValue(detail.promise)
    renderWithQuery(<Page />)

    await userEvent.click(await screen.findByRole('button', { name: 'Ana' }))

    expect(panel('initialData').getByText('Ana — ana@x.com')).toBeInTheDocument()
    expect(panel('placeholderData').getByText('Ana — ana@x.com')).toBeInTheDocument()
  })

  it('initialData entra en la caché; placeholderData no, y se marca como placeholder', async () => {
    const detail = deferred<typeof ana>()
    vi.mocked(usersApi.get).mockReturnValue(detail.promise)
    renderWithQuery(<Page />)

    await userEvent.click(await screen.findByRole('button', { name: 'Ana' }))

    const initial = panel('initialData')
    const placeholder = panel('placeholderData')
    expect(initial.getByText('en caché:').parentElement).toHaveTextContent('sí')
    expect(initial.getByText('isPlaceholderData:').parentElement).toHaveTextContent('false')
    expect(placeholder.getByText('en caché:').parentElement).toHaveTextContent('no')
    expect(placeholder.getByText('isPlaceholderData:').parentElement).toHaveTextContent('true')

    detail.resolve(ana)
    await vi.waitFor(() =>
      expect(placeholder.getByText('en caché:').parentElement).toHaveTextContent('sí'),
    )
    expect(placeholder.getByText('isPlaceholderData:').parentElement).toHaveTextContent('false')
  })
})
