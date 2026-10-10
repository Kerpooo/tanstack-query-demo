import { useInfiniteQuery } from '@tanstack/react-query'
import { usersApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

export const PAGE_SIZE = 8

export const useInfiniteUsers = () =>
  useInfiniteQuery({
    queryKey: queryKeys.usersInfinite,
    // pageParam: el cursor de la página que se pide ahora.
    queryFn: ({ pageParam }) => usersApi.page(PAGE_SIZE, pageParam),
    initialPageParam: '0',
    // Devuelve el cursor de la SIGUIENTE página, o undefined si ya no hay más
    // (eso apaga hasNextPage).
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
