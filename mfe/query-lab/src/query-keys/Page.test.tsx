import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoApi } from '@/shared/api/endpoints'
import { demo, expectDocsAboveDemo, renderWithQuery } from '@/test/helpers'
import { Page } from './Page'

vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)

const settle = () => new Promise((resolve) => setTimeout(resolve, 50))
const click = (name: string) => userEvent.click(screen.getByRole('button', { name }))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(demoApi.clock).mockResolvedValue({ now: 'HORA' })
})

describe('Claves de consulta e invalidación', () => {
  it('muestra la documentación arriba y la demo debajo', async () => {
    renderWithQuery(<Page />)
    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(3))
    expectDocsAboveDemo()
  })

  it('invalidar todo vuelve a pedir las tres consultas', async () => {
    renderWithQuery(<Page />)
    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(3))

    await click('Invalidar todo')

    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(6))
  })

  it('invalidar el grupo usa la clave como prefijo: solo las dos de usuarios', async () => {
    renderWithQuery(<Page />)
    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(3))

    await click('Invalidar el grupo usuarios')

    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(5))
  })

  it('con exact solo coincide la clave idéntica', async () => {
    renderWithQuery(<Page />)
    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(3))

    await click('Invalidar solo usuarios/1')
    await vi.waitFor(() => expect(demoApi.clock).toHaveBeenCalledTimes(4))

    await click('Grupo usuarios con exact')
    await settle()
    expect(demoApi.clock).toHaveBeenCalledTimes(4) // el prefijo con exact no coincide con nada
    expect(demo().getByRole('group', { name: 'tareas/1' })).toBeInTheDocument()
  })
})
