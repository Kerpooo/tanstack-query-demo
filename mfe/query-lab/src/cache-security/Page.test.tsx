import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { badge, demo, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { scanCache } from './hooks'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }))

beforeEach(() => vi.resetAllMocks())

describe('scanCache', () => {
  it('no encuentra nada en una caché sin datos sensibles', () => {
    const client = new QueryClient()
    client.setQueryData(['tareas'], [{ id: 1, title: 'Comprar pan' }])
    expect(scanCache(client)).toEqual([])
  })

  it('detecta correos en los datos y secretos en la clave', () => {
    const client = new QueryClient()
    client.setQueryData(['users'], [{ name: 'Ana', email: 'ana@example.com' }])
    client.setQueryData(['api', 'token'], 'x')

    const reasons = scanCache(client).map((f) => `${f.key}: ${f.reason}`)

    expect(reasons).toContain('["users"]: los datos incluyen correos (datos personales)')
    expect(reasons).toContain('["api","token"]: el nombre de la clave sugiere un secreto')
  })

  it('detecta campos sensibles dentro de los datos', () => {
    const client = new QueryClient()
    client.setQueryData(['sesion'], { password: '1234' })
    expect(scanCache(client)[0]!.reason).toMatch(/token o password/)
  })
})

describe('Seguridad de la caché', () => {
  it('muestra la documentación arriba y la demo debajo', () => {
    renderWithQuery(<Page />)
    expectDocsAboveDemo()
  })

  it('con la caché vacía el escaneo no tiene hallazgos', async () => {
    renderWithQuery(<Page />)
    await click('Escanear la caché')
    expect(demo().getByText(/Sin hallazgos/)).toBeInTheDocument()
  })

  it('sembrar una sesión provoca hallazgos y cerrar sesión deja la caché limpia', async () => {
    renderWithQuery(<Page />)

    await click('Sembrar una sesión de ejemplo en la caché')
    await click('Escanear la caché')
    const findings = await demo().findByRole('list', { name: 'Hallazgos' })
    expect(findings).toHaveTextContent('token o password')
    expect(findings).toHaveTextContent('correos')
    expect(badge('consultas en caché')).toHaveTextContent('1')

    await click('Cerrar sesión (clear)')
    await vi.waitFor(() => expect(badge('consultas en caché')).toHaveTextContent('0'))
    await click('Escanear la caché')
    expect(demo().getByText(/Sin hallazgos/)).toBeInTheDocument()
  })

  it('detecta datos que otro microfrontend dejó en la caché', async () => {
    const { client } = renderWithQuery(<Page />)
    act(() => client.setQueryData(['users'], [{ name: 'Ana', email: 'ana@example.com' }]))

    await click('Escanear la caché')

    expect(await demo().findByRole('list', { name: 'Hallazgos' })).toHaveTextContent('["users"]')
  })
})
