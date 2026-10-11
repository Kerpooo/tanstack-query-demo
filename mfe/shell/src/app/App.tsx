import '../styles.css'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource-variable/spline-sans-mono'
import { QueryClientProvider } from '@tanstack/react-query'
// Entrada `/production`: la normal se reemplaza por `null` cuando NODE_ENV es production.
import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '../navigation/AppLayout'
import { RemoteBoundary } from '../remotes/RemoteBoundary'
import { QueryLabApp, TasksApp, UsersApp } from '../remotes/loaders'
import { Button } from '../shared/ui/button'
import { queryClient } from '../shared/query/queryClient'

// Los prefijos (/tasks, /users) deben coincidir con los `paths.ts` de cada remote.
export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route
              path="/tasks/*"
              element={
                <RemoteBoundary name="tasks">
                  <TasksApp />
                </RemoteBoundary>
              }
            />
            <Route
              path="/users/*"
              element={
                <RemoteBoundary name="users">
                  <UsersApp />
                </RemoteBoundary>
              }
            />
            <Route
              path="/query/*"
              element={
                <RemoteBoundary name="query-lab">
                  <QueryLabApp />
                </RemoteBoundary>
              }
            />
            <Route
              path="*"
              element={
                <div className="space-y-3 text-sm">
                  <p>Página no encontrada.</p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/tasks">Ir a Tareas</Link>
                  </Button>
                </div>
              }
            />
          </Routes>
        </AppLayout>
        {/* Panel para ver la caché; se mantiene también en producción porque es parte de la demo. */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  )
}
