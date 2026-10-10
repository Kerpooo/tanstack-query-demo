import { useSyncExternalStore } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, type User } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

// Este microfrontend NO importa nada del microfrontend `users`.
// Solo conoce el "contrato": la clave ['users'] y la forma de los datos (User[]).
export const useUsersFromOtherMfe = () =>
  useQuery<User[]>({
    queryKey: queryKeys.users,
    // Sin queryFn y con enabled: false este hook NUNCA pide nada al servidor:
    // solo observa la caché y se actualiza cuando otro la llena o la cambia.
    enabled: false,
  })

export interface CacheEntry {
  key: readonly unknown[]
  status: string
  fetchStatus: string
  observers: number
}

// Inventario de TODA la caché compartida: cualquier código de la página puede hacerlo.
export function useCacheInventory(): CacheEntry[] {
  const cache = useQueryClient().getQueryCache()
  // useSyncExternalStore pide una "foto" estable: se devuelve un texto (igual = sin render).
  const snapshot = useSyncExternalStore(
    (onChange) => cache.subscribe(onChange),
    () =>
      JSON.stringify(
        cache.findAll().map((query) => ({
          key: query.queryKey,
          status: query.state.status,
          fetchStatus: query.state.fetchStatus,
          observers: query.getObserversCount(),
        })),
      ),
  )
  return JSON.parse(snapshot)
}

export function useTamperUsers() {
  const queryClient = useQueryClient()
  return {
    // setQueryData sobre la clave de otro: sus componentes mostrarán estos datos.
    tamper: () =>
      queryClient.setQueryData<User[]>(queryKeys.users, (old) =>
        old?.map((user) => ({ ...user, name: `${user.name} (alterado)` })),
      ),
    // Para repararlo hay que volver a pedir la verdad al servidor.
    restore: () => queryClient.fetchQuery({ queryKey: queryKeys.users, queryFn: usersApi.list, staleTime: 0 }),
  }
}
