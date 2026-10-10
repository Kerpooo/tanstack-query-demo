import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi, type Task } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

interface CountedTasks {
  tasks: Task[]
  /** Cuántas veces se pidió la lista al servidor (solo para la demo). */
  request: number
}

let listRequests = 0

export const useCountedTasks = () =>
  useQuery({
    queryKey: queryKeys.tasksCounted,
    queryFn: async (): Promise<CountedTasks> => ({ tasks: await tasksApi.list(), request: ++listRequests }),
  })

// Opción A: setQueryData. Se escribe la respuesta de la mutación en la caché.
// No hay petición extra: la lista cambia al instante.
export function useAddTaskSetQueryData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => tasksApi.create(title),
    onSuccess: (created) =>
      queryClient.setQueryData<CountedTasks>(queryKeys.tasksCounted, (old) =>
        old ? { ...old, tasks: [...old.tasks, created] } : old,
      ),
  })
}

// Opción B: invalidateQueries. Se marca como obsoleta y se vuelve a pedir la lista.
// Una petición extra, pero los datos vienen siempre del servidor.
export function useAddTaskInvalidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => tasksApi.create(title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasksCounted }),
  })
}
