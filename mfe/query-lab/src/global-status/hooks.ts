import { useIsFetching, useIsMutating, useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import { demoApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

export const useGlobalSlow = (ms: number) =>
  useQuery({ queryKey: queryKeys.globalSlow(ms), queryFn: () => demoApi.slow(ms) })

export function useRefreshAll() {
  const queryClient = useQueryClient()
  // Todas las consultas cuya clave empiece por ['lab','global'].
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.global })
}

// mutationKey identifica la mutación para poder contarla y listarla desde fuera.
export const useSave = () =>
  useMutation({
    mutationKey: queryKeys.globalSave,
    mutationFn: (name: string) => demoApi.slow(1500).then(() => name),
  })

// Estado GLOBAL, sin necesidad de recibir props ni los hooks originales:
export function useGlobalActivity() {
  // Cuántas consultas están pidiendo datos ahora mismo (con ese prefijo de clave).
  const fetching = useIsFetching({ queryKey: queryKeys.global })
  // Cuántas mutaciones están en curso.
  const mutating = useIsMutating({ mutationKey: queryKeys.globalSave })
  // Las variables de cada mutación pendiente (p. ej. para listar «Guardando: A, B»).
  const saving = useMutationState({
    filters: { mutationKey: queryKeys.globalSave, status: 'pending' },
    select: (mutation) => mutation.state.variables as string,
  })
  return { fetching, mutating, saving }
}
