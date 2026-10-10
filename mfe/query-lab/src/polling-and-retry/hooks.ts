import { useQuery } from '@tanstack/react-query'
import { demoApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

// refetchInterval: vuelve a pedir cada N ms. `false` lo apaga.
export const useClockPolling = (intervalMs: number | false) =>
  useQuery({
    queryKey: queryKeys.clockPolling,
    queryFn: demoApi.clock,
    refetchInterval: intervalMs,
  })

// retry: cuántas veces se reintenta antes de dar la consulta por fallida.
// `nonce` cambia en cada ejecución para tener una consulta nueva.
export const useFlaky = ({ nonce, retry }: { nonce: number; retry: number }) =>
  useQuery({
    queryKey: queryKeys.flaky(nonce, retry),
    // El servidor falla las 2 primeras veces con esta clave.
    queryFn: () => demoApi.flaky(`lab-${nonce}`, 2),
    enabled: nonce > 0,
    retry,
    retryDelay: 500,
  })
