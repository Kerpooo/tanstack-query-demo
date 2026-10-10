import { queryOptions, useQueryClient } from '@tanstack/react-query'
import { demoApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

// Contador de peticiones reales al servidor, para verlas en pantalla.
let requests = 0

export const clockOptions = queryOptions({
  queryKey: queryKeys.imperativeClock,
  queryFn: async () => ({ ...(await demoApi.clock()), request: ++requests }),
  staleTime: 10_000, // durante 10 s se considera fresco
})

// El QueryClient también se puede usar SIN hooks: en eventos, loaders de rutas o utilidades.
export function useImperativeClient() {
  const queryClient = useQueryClient()
  return {
    // fetchQuery: devuelve los datos de la caché si están FRESCOS; si no, los pide.
    fetch: () => queryClient.fetchQuery(clockOptions),
    // ensureQueryData: devuelve lo que haya en caché (aunque esté obsoleto); solo pide si NO hay nada.
    ensure: () => queryClient.ensureQueryData(clockOptions),
    // getQueryData: lectura síncrona de la caché. Devuelve undefined si no hay nada. Nunca pide.
    read: () => queryClient.getQueryData(clockOptions.queryKey),
    // invalidateQueries: marca como obsoleto (el siguiente fetchQuery volverá a pedir).
    markStale: () => queryClient.invalidateQueries({ queryKey: clockOptions.queryKey }),
    // removeQueries: borra la entrada de la caché.
    clear: () => queryClient.removeQueries({ queryKey: clockOptions.queryKey }),
  }
}
