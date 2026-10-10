import { Link } from 'react-router'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { UsersTable } from '../components/UsersTable'
import { useDeleteUser, useUsers } from '../hooks/useUsers'
import { usersPaths } from '../paths'

export function UsersListPage() {
  const { data: users, isPending, error } = useUsers()
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
        {isPending && <p className="text-muted-foreground text-sm">Cargando…</p>}
        {error && <p className="text-destructive text-sm">Error: {getErrorMessage(error)}</p>}
        {remove.error && (
          <p className="text-destructive text-sm">Error: {getErrorMessage(remove.error)}</p>
        )}
        {users && <UsersTable users={users} onDelete={(id) => remove.mutate(id)} />}
      </CardContent>
    </Card>
  )
}
