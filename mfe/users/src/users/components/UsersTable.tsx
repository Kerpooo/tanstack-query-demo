import { Link } from 'react-router'
import { Button } from '@/shared/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { usersPaths } from '../paths'
import type { User } from '../users.types'
import { DeleteUserDialog } from './DeleteUserDialog'

interface Props {
  users: User[]
  onDelete: (id: string) => void
}

export function UsersTable({ users, onDelete }: Props) {
  if (users.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <p>No hay usuarios todavía.</p>
        <Button asChild variant="outline" size="sm">
          <Link to={usersPaths.create}>Crear el primero</Link>
        </Button>
      </div>
    )
  }

  return (
    <Table aria-label="Usuarios">
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell className="space-x-2 text-right">
              <Button variant="outline" size="sm" asChild>
                <Link to={usersPaths.edit(user.id)} aria-label={`Editar ${user.name}`}>
                  Editar
                </Link>
              </Button>
              <DeleteUserDialog user={user} onConfirm={onDelete} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
