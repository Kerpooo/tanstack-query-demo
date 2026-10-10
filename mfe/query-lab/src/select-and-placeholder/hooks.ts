import { useCallback } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { sleep, usersApi, type User } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

export const PAGE_SIZE = 5

// select: transforma los datos DESPUÉS de la caché. No hay otra petición:
// varios componentes pueden derivar cosas distintas de la misma consulta.
export const useUsersCount = () =>
  useQuery({
    queryKey: queryKeys.users,
    queryFn: usersApi.list,
    select: (users) => users.length,
  })

export const useUsersMatching = (term: string) => {
  // useCallback mantiene estable la función para que select no se recalcule de más.
  const select = useCallback(
    (users: User[]) => users.filter((u) => u.name.toLowerCase().includes(term.toLowerCase())),
    [term],
  )
  return useQuery({ queryKey: queryKeys.users, queryFn: usersApi.list, select })
}

export const useUsersPage = (page: number) =>
  useQuery({
    queryKey: queryKeys.usersPage(page),
    queryFn: async () => {
      await sleep(600) // latencia simulada
      return usersApi.page(PAGE_SIZE, String(page * PAGE_SIZE))
    },
    // placeholderData: mientras llega la página nueva se muestra la anterior,
    // sin parpadeos. `isPlaceholderData` indica que lo mostrado es provisional.
    placeholderData: keepPreviousData,
  })
