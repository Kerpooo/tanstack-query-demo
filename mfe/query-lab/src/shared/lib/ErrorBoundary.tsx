import { Component, type ReactNode } from 'react'

interface Props {
  /** Se muestra cuando un hijo lanza un error; `retry` vuelve a intentar el render. */
  fallback: (error: Error, retry: () => void) => ReactNode
  /** Se llama al reintentar (p. ej. el `reset` de QueryErrorResetBoundary). */
  onReset?: () => void
  children: ReactNode
}

/** Límite de errores mínimo (React solo permite hacerlo con una clase). */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  private retry = () => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error, this.retry) : this.props.children
  }
}
