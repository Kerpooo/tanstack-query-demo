import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

export const useAddTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // mutationFn: la escritura contra el servidor (POST/PUT/PATCH/DELETE).
    mutationFn: (title: string) => tasksApi.create(title),
    // onSuccess: al terminar bien, se invalida la lista para que se vuelva a pedir.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
  })
}
