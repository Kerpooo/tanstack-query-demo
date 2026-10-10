import { useNavigate } from 'react-router'
import { getErrorMessage } from '@/shared/lib/errors'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { UserForm } from '../components/UserForm'
import { useCreateUser } from '../hooks/useUsers'
import { usersPaths } from '../paths'

export function UserCreatePage() {
  const navigate = useNavigate()
  const create = useCreateUser()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <UserForm
          submitLabel="Crear usuario"
          pending={create.isPending}
          serverError={create.error ? getErrorMessage(create.error) : undefined}
          onSubmit={(values) => create.mutate(values, { onSuccess: () => navigate(usersPaths.list) })}
        />
      </CardContent>
    </Card>
  )
}
