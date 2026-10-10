import { useQuery } from '@tanstack/react-query'
import { demoApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

// Contador de peticiones reales al servidor, para verlas en pantalla.
let requests = 0

export const useClock = (staleTime: number) =>
  useQuery({
    queryKey: queryKeys.clock,
    queryFn: async () => ({ ...(await demoApi.clock()), request: ++requests }),
    // staleTime: cuánto tiempo los datos se consideran "frescos".
    // Mientras estén frescos, al montar el componente NO se vuelve a pedir.
    staleTime,
    // gcTime: cuánto se conserva en memoria una consulta sin observadores (5 min por defecto).
    // gcTime: 5 * 60 * 1000,
  })
