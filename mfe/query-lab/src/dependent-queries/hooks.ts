import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

export const useUserDetail = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.user(userId ?? ''),
    queryFn: () => usersApi.get(userId!),
    // enabled: la consulta NO se ejecuta hasta que la condición sea verdadera.
    // Mientras tanto queda en status 'pending' y fetchStatus 'idle'.
    enabled: userId !== null,
  })
