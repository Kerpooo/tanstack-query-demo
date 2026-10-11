import { Trash2 } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import type { Assignee, Task } from '../tasks.types'
import { AssigneePicker } from './AssigneePicker'

interface Props {
  task: Task
  onToggle: (task: Task) => void
  onAssign: (task: Task, assignees: Assignee[]) => void
  onDelete: (id: string) => void
}

export function TaskItem({ task, onToggle, onAssign, onDelete }: Props) {
  return (
    <li className="flex items-center gap-3 py-1.5">
      <Checkbox id={`task-${task.id}`} checked={task.done} onCheckedChange={() => onToggle(task)} />
      <div className="min-w-0 flex-1 space-y-1">
        <label
          htmlFor={`task-${task.id}`}
          className={task.done ? 'text-muted-foreground block break-words line-through' : 'block break-words'}
        >
          {task.title}
        </label>
        {task.assignees.length > 0 && (
          <ul aria-label={`Asignados a ${task.title}`} className="flex flex-wrap gap-1">
            {task.assignees.map((a) => (
              <li key={a.id}>
                <Badge variant="secondary">{a.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
      <AssigneePicker task={task} onChange={(assignees) => onAssign(task, assignees)} />
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Eliminar ${task.title}`}
        onClick={() => onDelete(task.id)}
      >
        <Trash2 />
      </Button>
    </li>
  )
}
