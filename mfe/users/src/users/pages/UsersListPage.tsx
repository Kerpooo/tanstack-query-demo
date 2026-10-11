import { Loader2, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { UsersTable } from '../components/UsersTable'
import { useDeleteUser, useUsers } from '../hooks/useUsers'
import { usersPaths } from '../paths'

export function UsersListPage() {
  const { data: users, isPending, error, refetch, isRefetching } = useUsers()
  const remove = useDeleteUser()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios</CardTitle>
        <CardAction>
          <Button asChild>
            <Link to={usersPaths.create}>Nuevo usuario</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && (
          <p role="status" className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
            Cargando…
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="border-destructive/40 text-destructive flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-3 py-2 text-sm"
          >
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            <p className="min-w-0 flex-1">
              No se pudieron cargar los usuarios. {getErrorMessage(error)}
            </p>
            <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}
        {remove.error && (
          <p role="alert" className="text-destructive text-sm">
            No se pudo eliminar el usuario. {getErrorMessage(remove.error)}
          </p>
        )}
        {users && <UsersTable users={users} onDelete={(id) => remove.mutate(id)} />}
      </CardContent>
    </Card>
  )
}
