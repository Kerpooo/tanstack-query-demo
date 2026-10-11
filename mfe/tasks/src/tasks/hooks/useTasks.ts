import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks.api'
import type { Assignee, Task } from '../tasks.types'

const TASKS_KEY = ['tasks'] as const
// Misma clave que el microfrontend `users`: dentro del shell ambos leen y
// escriben la misma entrada de caché, así que la lista no se pide dos veces.
const USERS_KEY = ['users'] as const
const ASSIGN_KEY = ['tasks', 'assign'] as const

export const useTasks = () => useQuery({ queryKey: TASKS_KEY, queryFn: tasksApi.list })

/** `enabled` permite pedir los usuarios solo cuando se abre el selector. */
export const useAssignableUsers = (enabled = true) =>
  useQuery({ queryKey: USERS_KEY, queryFn: tasksApi.listUsers, enabled })

const useInvalidatingMutation = <TVars>(fn: (vars: TVars) => Promise<unknown>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

export const useCreateTask = () => useInvalidatingMutation((title: string) => tasksApi.create(title))
export const useToggleTask = () => useInvalidatingMutation((task: Task) => tasksApi.toggle(task))
export const useDeleteTask = () => useInvalidatingMutation((id: string) => tasksApi.remove(id))

/**
 * Asigna usuarios con actualización optimista: el selector se marca al instante
 * y varios clics seguidos parten siempre de la última selección, no de la que
 * había antes de que respondiera el servidor.
 */
export const useAssignTask = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ASSIGN_KEY,
    mutationFn: ({ taskId, assignees }: { taskId: string; assignees: Assignee[] }) =>
      tasksApi.assign(taskId, assignees.map((a) => a.id)),
    onMutate: async ({ taskId, assignees }) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY })
      const previous = qc.getQueryData<Task[]>(TASKS_KEY)
      qc.setQueryData<Task[]>(TASKS_KEY, (tasks) =>
        tasks?.map((t) => (t.id === taskId ? { ...t, assignees } : t)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => qc.setQueryData(TASKS_KEY, context?.previous),
    // Con varias asignaciones en vuelo, solo la última refresca la lista: si no,
    // la respuesta de la primera pisaría el estado optimista de las siguientes.
    onSettled: () =>
      qc.isMutating({ mutationKey: ASSIGN_KEY }) === 1
        ? qc.invalidateQueries({ queryKey: TASKS_KEY })
        : undefined,
  })
}
