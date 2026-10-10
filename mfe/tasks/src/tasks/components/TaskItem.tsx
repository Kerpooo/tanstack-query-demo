import { Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import type { Task } from '../tasks.types'

interface Props {
  task: Task
  onToggle: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
  return (
    <li className="flex items-center gap-3">
      <Checkbox id={`task-${task.id}`} checked={task.done} onCheckedChange={() => onToggle(task)} />
      <label
        htmlFor={`task-${task.id}`}
        className={task.done ? 'flex-1 line-through opacity-60' : 'flex-1'}
      >
        {task.title}
      </label>
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
