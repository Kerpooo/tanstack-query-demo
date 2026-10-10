import { StatusBadges } from '@/shared/docs/StatusBadges'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { useUsersQuery } from './hooks'

export function Demo() {
  const { data, status, fetchStatus, isFetching, error, refetch } = useUsersQuery()

  return (
    <>
      <StatusBadges items={{ status, fetchStatus, isFetching }} />
      <Button variant="outline" size="sm" onClick={() => refetch()}>
        Volver a pedir (refetch)
      </Button>

      {status === 'pending' && <p className="text-muted-foreground text-sm">Cargando…</p>}
      {status === 'error' && <p className="text-destructive text-sm">Error: {getErrorMessage(error)}</p>}
      {data && (
        <ul className="space-y-1 text-sm">
          {data.slice(0, 5).map((user) => (
            <li key={user.id}>
              {user.name} <span className="text-muted-foreground">— {user.email}</span>
            </li>
          ))}
          {data.length > 5 && <li className="text-muted-foreground">… y {data.length - 5} más</li>}
        </ul>
      )}
    </>
  )
}
