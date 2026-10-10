import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

// queryKey: identifica la consulta en la caché. Misma clave = mismos datos compartidos.
// queryFn: función asíncrona que obtiene los datos (debe devolver una promesa).
export const useUsersQuery = () =>
  useQuery({
    queryKey: queryKeys.users,
    queryFn: usersApi.list,
  })
