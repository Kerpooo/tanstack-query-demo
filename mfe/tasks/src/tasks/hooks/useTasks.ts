import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks.api'
import type { Task } from '../tasks.types'

const TASKS_KEY = ['tasks'] as const

export const useTasks = () => useQuery({ queryKey: TASKS_KEY, queryFn: tasksApi.list })

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
