import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../api/users.api'
import type { UserInput } from '../users.types'

export const usersKeys = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
}

export const useUsers = () => useQuery({ queryKey: usersKeys.all, queryFn: usersApi.list })

export const useUser = (id: string) =>
  useQuery({ queryKey: usersKeys.detail(id), queryFn: () => usersApi.get(id) })

export const useCreateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UserInput) => usersApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all }),
  })
}

export const useUpdateUser = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UserInput) => usersApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all }),
  })
}

export const useDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all }),
  })
}
