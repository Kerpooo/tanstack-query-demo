import '@fontsource-variable/hanken-grotesk'
import '@fontsource-variable/spline-sans-mono'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import QueryLabApp from './QueryLabApp'
import { queryLabPaths } from './paths'
import { queryClient } from './shared/query/queryClient'

// Arranque standalone (http://localhost:4003): aquí no hay shell, así que el
// remote crea su propio router y provider. Dentro del shell se usan los del shell.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <main className="mx-auto max-w-5xl p-6">
        <Routes>
          <Route path={`${queryLabPaths.base}/*`} element={<QueryLabApp />} />
          <Route path="*" element={<Navigate to={queryLabPaths.base} replace />} />
        </Routes>
      </main>
    </QueryClientProvider>
  </BrowserRouter>,
)
