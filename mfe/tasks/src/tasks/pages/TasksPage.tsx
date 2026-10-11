import { ListChecks, Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { getErrorMessage } from '@/shared/lib/errors'
import { NewTaskForm } from '../components/NewTaskForm'
import { TaskItem } from '../components/TaskItem'
import { useAssignTask, useCreateTask, useDeleteTask, useTasks, useToggleTask } from '../hooks/useTasks'

export function TasksPage() {
  const { data: tasks, isPending, error, refetch, isRefetching } = useTasks()
  const create = useCreateTask()
  const toggle = useToggleTask()
  const remove = useDeleteTask()
  const assign = useAssignTask()
  const actionError = create.error ?? toggle.error ?? assign.error ?? remove.error
  const pendingCount = tasks?.filter((t) => !t.done).length ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tareas</CardTitle>
        {tasks && tasks.length > 0 && (
          <CardDescription className="tabular-nums">
            {pendingCount} de {tasks.length} pendientes
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <NewTaskForm
          pending={create.isPending}
          onCreate={(title, onDone) => create.mutate(title, { onSuccess: onDone })}
        />
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
              No se pudieron cargar las tareas. {getErrorMessage(error)}
            </p>
            <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}
        {actionError && (
          <p role="alert" className="text-destructive text-sm">
            No se pudo completar la acción. {getErrorMessage(actionError)}
          </p>
        )}
        {tasks?.length === 0 && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <ListChecks className="size-4 shrink-0" aria-hidden />
            <p>No hay tareas todavía. Escribe una arriba para empezar.</p>
          </div>
        )}
        <ul className="divide-y">
          {tasks?.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={(t) => toggle.mutate(t)}
              onAssign={(t, assignees) => assign.mutate({ taskId: t.id, assignees })}
              onDelete={(id) => remove.mutate(id)}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
