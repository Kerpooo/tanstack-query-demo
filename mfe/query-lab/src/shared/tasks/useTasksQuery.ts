import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

/** Lista de tareas; la comparten varias demos (misma clave = misma caché). */
export const useTasksQuery = () => useQuery({ queryKey: queryKeys.tasks, queryFn: tasksApi.list })
