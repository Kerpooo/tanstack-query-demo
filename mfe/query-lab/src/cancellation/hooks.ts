import { useQuery } from '@tanstack/react-query'
import { demoApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

export const useCancellableSlow = (ms: number | null, onEvent: (event: string) => void) =>
  useQuery({
    queryKey: queryKeys.cancellable(ms ?? 0),
    enabled: ms !== null,
    // TanStack Query entrega un `signal` (AbortSignal) a cada queryFn.
    // Si se lo pasa a axios/fetch, la petición HTTP se cancela de verdad.
    queryFn: async ({ signal }) => {
      onEvent(`inicia la petición de ${ms} ms`)
      try {
        const result = await demoApi.slow(ms!, signal)
        onEvent(`terminó la petición de ${ms} ms`)
        return result
      } catch (error) {
        // signal.aborted indica que la cancelaron (no es un fallo del servidor).
        if (signal.aborted) onEvent(`se canceló la petición de ${ms} ms`)
        throw error
      }
    },
  })
