import { useQueries } from '@tanstack/react-query'
import { demoApi, tasksApi, usersApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

// useQueries: lanza N consultas EN PARALELO (no una detrás de otra).
// A diferencia de llamar varias veces a useQuery, el número de consultas puede ser dinámico.
export const useDashboard = () =>
  useQueries({
    queries: [
      { queryKey: queryKeys.tasks, queryFn: tasksApi.list },
      { queryKey: queryKeys.users, queryFn: usersApi.list },
      { queryKey: queryKeys.slow(1500), queryFn: () => demoApi.slow(1500) },
    ],
    // combine: resume todos los resultados en una sola estructura.
    combine: (results) => [
      { label: 'Tareas', status: results[0].status, value: results[0].data?.length },
      { label: 'Usuarios', status: results[1].status, value: results[1].data?.length },
      { label: 'Endpoint lento (1,5 s)', status: results[2].status, value: results[2].data?.waited },
    ],
  })
