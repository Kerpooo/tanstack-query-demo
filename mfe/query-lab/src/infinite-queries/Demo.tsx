import { StatusBadges } from '@/shared/docs/StatusBadges'
import { Button } from '@/shared/ui/button'
import { useInfiniteUsers } from './hooks'

export function Demo() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteUsers()
  // data.pages es un arreglo de páginas: se aplana para pintar una sola lista.
  const users = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <>
      <StatusBadges
        items={{ status, 'páginas cargadas': data?.pages.length ?? 0, hasNextPage, isFetchingNextPage }}
      />
      <ul className="space-y-1 text-sm">
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <Button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
        {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
      </Button>
      {!hasNextPage && users.length > 0 && (
        <p className="text-muted-foreground text-sm">No hay más usuarios.</p>
      )}
    </>
  )
}
