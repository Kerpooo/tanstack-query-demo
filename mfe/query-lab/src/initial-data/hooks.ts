import { useQuery, useQueryClient } from '@tanstack/react-query'
import { sleep, usersApi, type User } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

// Busca al usuario en la lista que ya está en caché (si la hay).
const useUserFromList = () => {
  const queryClient = useQueryClient()
  return (id: string | null) => queryClient.getQueryData<User[]>(queryKeys.users)?.find((u) => u.id === id)
}

const fetchUser = async (id: string | null) => {
  await sleep(1500) // latencia simulada, para ver el refresco en segundo plano
  return usersApi.get(id!)
}

export function useUserWithInitialData(id: string | null) {
  const queryClient = useQueryClient()
  const fromList = useUserFromList()
  return useQuery({
    queryKey: queryKeys.userInitial(id ?? ''),
    queryFn: () => fetchUser(id),
    enabled: id !== null,
    // initialData: se ESCRIBE en la caché como si fuera un dato real (status success desde el inicio).
    initialData: () => fromList(id),
    // De cuándo es ese dato: con staleTime 0 igual se refresca en segundo plano.
    initialDataUpdatedAt: () => queryClient.getQueryState(queryKeys.users)?.dataUpdatedAt,
  })
}

export function useUserWithPlaceholder(id: string | null) {
  const fromList = useUserFromList()
  return useQuery({
    queryKey: queryKeys.userPlaceholder(id ?? ''),
    queryFn: () => fetchUser(id),
    enabled: id !== null,
    // placeholderData: solo se MUESTRA mientras llegan los datos reales. No entra en la caché.
    placeholderData: () => fromList(id),
  })
}
