import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { sleep, usersApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

// queryOptions: define UNA vez la clave y la función, y se reutiliza
// tanto para precargar como para leer (así nunca se desincronizan).
export const userDetailOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.userPrefetch(id),
    queryFn: async () => {
      await sleep(800) // latencia simulada, para notar la diferencia
      return usersApi.get(id)
    },
    staleTime: 30_000, // si no hay staleTime, lo precargado se considera obsoleto al instante
  })

export function usePrefetchUser() {
  const queryClient = useQueryClient()
  // prefetchQuery llena la caché sin suscribir ningún componente y sin lanzar errores.
  return (id: string) => queryClient.prefetchQuery(userDetailOptions(id))
}

export const useUserDetail = (id: string | null) =>
  useQuery({ ...userDetailOptions(id ?? ''), enabled: id !== null })
