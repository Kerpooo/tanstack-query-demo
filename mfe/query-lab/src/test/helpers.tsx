import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { expect } from 'vitest'

export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) }
}

/** Promesa que se resuelve/rechaza a mano, para observar estados intermedios. */
export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const cardTitle = (name: string) => screen.getByText(name, { selector: '[data-slot="card-title"]' })

/** Comprueba la estructura común: documentación (con código) arriba y demo debajo. */
export function expectDocsAboveDemo() {
  const docs = cardTitle('Documentación')
  const demo = cardTitle('Demo en vivo')
  // DOCUMENT_POSITION_FOLLOWING: la demo viene DESPUÉS de la documentación.
  expect(docs.compareDocumentPosition(demo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(document.querySelector('article pre code')).not.toBeNull()
}

export const badge = (label: string) => screen.getByText(`${label}:`).parentElement!

/** Limita las consultas a la sección «Demo en vivo» (la documentación repite palabras de la demo). */
export const demo = () => within(screen.getByLabelText('Demo en vivo'))
