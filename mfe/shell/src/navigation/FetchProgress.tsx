import { useIsFetching } from '@tanstack/react-query'
import { cn } from '@/shared/lib/utils'

/**
 * Línea fina en el borde superior que se enciende mientras CUALQUIER consulta
 * pide datos (del shell o de un microfrontend: el QueryClient es único).
 */
export function FetchProgress() {
  const fetching = useIsFetching() > 0
  return (
    <div
      aria-hidden
      data-fetching={fetching}
      className={cn(
        'bg-state-fetching pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 opacity-0 transition-opacity duration-150',
        fetching && 'opacity-100 motion-safe:animate-pulse',
      )}
    />
  )
}
