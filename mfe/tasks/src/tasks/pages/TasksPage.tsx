import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { getErrorMessage } from '@/shared/lib/errors'
import { NewTaskForm } from '../components/NewTaskForm'
import { TaskItem } from '../components/TaskItem'
import { useCreateTask, useDeleteTask, useTasks, useToggleTask } from '../hooks/useTasks'

export function TasksPage() {
  const { data: tasks, isPending, error } = useTasks()
  const create = useCreateTask()
  const toggle = useToggleTask()
  const remove = useDeleteTask()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tareas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <NewTaskForm
          pending={create.isPending}
          onCreate={(title, onDone) => create.mutate(title, { onSuccess: onDone })}
        />

        {isPending && <p className="text-muted-foreground text-sm">Cargando…</p>}
        {error && <p className="text-destructive text-sm">Error: {getErrorMessage(error)}</p>}

        <ul className="space-y-2">
          {tasks?.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={(t) => toggle.mutate(t)}
              onDelete={(id) => remove.mutate(id)}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
