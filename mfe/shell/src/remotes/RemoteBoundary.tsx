import { Component, Suspense, type ReactNode } from 'react'

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
    return this.state.failed ? (
      <p className="text-destructive text-sm">
        No se pudo cargar el microfrontend «{this.props.name}».
      </p>
    ) : (
      this.props.children
    )
  }
}

/** Aísla un remote: muestra fallback mientras carga y un mensaje si falla. */
export function RemoteBoundary({ name, children }: Props) {
  return (
    <ErrorBoundary key={name} name={name}>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando {name}…</p>}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}
