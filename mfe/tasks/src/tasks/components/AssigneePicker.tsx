import { useState } from 'react'
import { Check, Loader2, UserPlus } from 'lucide-react'
import { getErrorMessage } from '@/shared/lib/errors'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { useAssignableUsers } from '../hooks/useTasks'
import type { AssignableUser, Assignee, Task } from '../tasks.types'

interface Props {
  task: Task
  onChange: (assignees: Assignee[]) => void
}

const byName = (a: Assignee, b: Assignee) => a.name.localeCompare(b.name, 'es')

/** Selector múltiple de usuarios para una tarea; cada clic guarda al instante. */
export function AssigneePicker({ task, onChange }: Props) {
  const [open, setOpen] = useState(false)
  // Los usuarios se piden al abrir el selector, no al cargar la lista de tareas.
  const users = useAssignableUsers(open)
  const selected = new Set(task.assignees.map((a) => a.id))

  const toggle = (user: AssignableUser) =>
    onChange(
      selected.has(user.id)
        ? task.assignees.filter((a) => a.id !== user.id)
        : [...task.assignees, { id: user.id, name: user.name }].sort(byName),
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Asignar usuarios a ${task.title}`}>
          <UserPlus />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command label="Buscar usuario">
          <CommandInput placeholder="Buscar usuario…" />
          <CommandList label={`Usuarios para ${task.title}`}>
            {users.isPending && (
              <p role="status" className="text-muted-foreground flex items-center gap-2 px-3 py-4 text-sm">
                <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                Cargando usuarios…
              </p>
            )}
            {users.error && (
              <p role="alert" className="text-destructive px-3 py-4 text-sm">
                No se pudieron cargar los usuarios. {getErrorMessage(users.error)}
              </p>
            )}
            {users.data && (
              <>
                <CommandEmpty>Ningún usuario coincide.</CommandEmpty>
                <CommandGroup>
                  {users.data.map((user) => {
                    const isSelected = selected.has(user.id)
                    return (
                      <CommandItem
                        key={user.id}
                        // cmdk filtra por `value`: se busca por nombre y por correo.
                        value={`${user.name} ${user.email}`}
                        aria-checked={isSelected}
                        onSelect={() => toggle(user)}
                      >
                        <Check className={cn('size-4', isSelected ? 'opacity-100' : 'opacity-0')} aria-hidden />
                        <span className="min-w-0 truncate">{user.name}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
