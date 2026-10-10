import { useSuspenseQuery } from '@tanstack/react-query'
import { demoApi, sleep } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

// useSuspenseQuery: mientras carga "suspende" el componente (lo atrapa <Suspense>)
// y si falla lanza el error (lo atrapa un ErrorBoundary). Por eso `data` nunca es undefined.
export const useReport = ({ nonce, fail }: { nonce: number; fail: boolean }) =>
  useSuspenseQuery({
    queryKey: queryKeys.suspense(nonce, fail),
    queryFn: async () => {
      await sleep(1000) // latencia simulada, para ver el fallback
      if (fail) await demoApi.fail() // el servidor responde 500
      return demoApi.clock()
    },
    retry: false, // sin reintentos, para ver el error enseguida
  })
