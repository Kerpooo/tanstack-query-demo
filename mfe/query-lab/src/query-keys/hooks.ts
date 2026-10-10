import { useQuery, useQueryClient } from '@tanstack/react-query'
import { demoApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

// Contador de peticiones reales por panel, para verlas en pantalla.
const requests: Record<string, number> = {}

// Las claves son jerárquicas: ['lab','keys'] > ['lab','keys','usuarios'] > ['lab','keys','usuarios','1'].
// Cada nivel agrega precisión, y la fábrica queryKeys evita escribirlas a mano en cada sitio.
export const useScopedClock = (group: string, id: string) =>
  useQuery({
    queryKey: queryKeys.scoped(group, id),
    queryFn: async () => {
      const name = `${group}/${id}`
      requests[name] = (requests[name] ?? 0) + 1
      return { ...(await demoApi.clock()), request: requests[name] }
    },
  })

export function useInvalidate() {
  const queryClient = useQueryClient()
  // Sin `exact`, la clave actúa como PREFIJO: coincide con todas las que empiezan igual.
  // Con `exact: true` solo coincide con una clave idéntica.
  return (queryKey: readonly unknown[], exact = false) => queryClient.invalidateQueries({ queryKey, exact })
}
