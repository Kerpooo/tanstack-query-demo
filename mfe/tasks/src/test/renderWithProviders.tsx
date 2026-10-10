import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'

interface Options {
  /** URL inicial. */
  route: string
  /** Patrón bajo el que el shell monta el microfrontend, p. ej. `/users/*`. */
  mountAt: string
}

export function renderWithProviders(ui: ReactElement, { route, mountAt }: Options) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={mountAt} element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
