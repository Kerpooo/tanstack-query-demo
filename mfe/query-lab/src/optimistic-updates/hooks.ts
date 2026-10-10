import { useMutation, useQueryClient } from '@tanstack/react-query'
import { demoApi, sleep, tasksApi, type Task } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

export function useToggleTaskOptimistic({ forceFail }: { forceFail: boolean }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: Task) => {
      await sleep(1000) // latencia simulada, para que se note el efecto optimista
      if (forceFail) await demoApi.fail() // el servidor responde 500
      return tasksApi.toggle(task)
    },

    // 1) ANTES de enviar: se actualiza la caché como si ya hubiera funcionado.
    onMutate: async (task) => {
      // Se cancelan refetch en curso para que no pisen el cambio optimista.
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks })
      // Se guarda una copia para poder deshacer.
      const previous = queryClient.getQueryData<Task[]>(queryKeys.tasks)
      queryClient.setQueryData<Task[]>(queryKeys.tasks, (old) =>
        old?.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
      )
      return { previous } // llega como `context` a onError
    },

    // 2) Si falla: se restaura la copia (rollback).
    onError: (_error, _task, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.tasks, context.previous)
    },

    // 3) Pase lo que pase: se vuelve a pedir la verdad al servidor.
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
  })
}
