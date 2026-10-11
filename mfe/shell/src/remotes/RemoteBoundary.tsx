import { Component, Suspense, type ReactNode } from 'react'
import { Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface Props {
  name: string
  children: ReactNode
}

class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div
        role="alert"
        className="border-destructive/40 text-destructive flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-4 py-3 text-sm"
      >
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1">No se pudo cargar el microfrontend «{this.props.name}».</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Recargar página
        </Button>
      </div>
    )
  }
}

/** Aísla un remote: muestra fallback mientras carga y un mensaje con opción de recargar si falla. */
export function RemoteBoundary({ name, children }: Props) {
  return (
    <ErrorBoundary key={name} name={name}>
      <Suspense
        fallback={
          <p role="status" className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
            Cargando {name}…
          </p>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}
