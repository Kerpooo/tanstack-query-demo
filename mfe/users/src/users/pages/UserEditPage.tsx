import { useNavigate, useParams } from 'react-router'
import { getErrorMessage } from '@/shared/lib/errors'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { UserForm } from '../components/UserForm'
import { useUpdateUser, useUser } from '../hooks/useUsers'
import { usersPaths } from '../paths'

export function UserEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: user, isPending, error } = useUser(id)
  const update = useUpdateUser(id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar usuario</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending && <p className="text-muted-foreground text-sm">Cargando…</p>}
        {error && <p className="text-destructive text-sm">Error: {getErrorMessage(error)}</p>}
        {user && (
          <UserForm
            initialValues={{ name: user.name, email: user.email }}
            submitLabel="Guardar cambios"
            pending={update.isPending}
            serverError={update.error ? getErrorMessage(update.error) : undefined}
            onSubmit={(values) => update.mutate(values, { onSuccess: () => navigate(usersPaths.list) })}
          />
        )}
      </CardContent>
    </Card>
  )
}
