import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { tasksApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'
import { useTasksQuery } from '@/shared/tasks/useTasksQuery'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import { useToggleTaskOptimistic } from './hooks'

export function Demo() {
  const [forceFail, setForceFail] = useState(false)
  const queryClient = useQueryClient()
  const tasks = useTasksQuery()
  const toggle = useToggleTaskOptimistic({ forceFail })
  const seed = useMutation({
    mutationFn: () => tasksApi.create(`Tarea de ejemplo ${new Date().toLocaleTimeString()}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
  })

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox id="force-fail" checked={forceFail} onCheckedChange={(v) => setForceFail(v === true)} />
          <Label htmlFor="force-fail">Forzar fallo del servidor</Label>
        </div>
        <Button variant="outline" size="sm" onClick={() => seed.mutate()}>
          Crear tarea de ejemplo
        </Button>
      </div>

      <StatusBadges items={{ 'mutación (status)': toggle.status }} />
      {toggle.isPending && <p className="text-muted-foreground text-sm">Guardando… (el cambio ya se ve)</p>}
      {toggle.isError && (
        <p className="text-destructive text-sm">El servidor falló: se revirtió el cambio.</p>
      )}

      <ul className="space-y-2">
        {tasks.data?.slice(-6).map((task) => (
          <li key={task.id} className="flex items-center gap-3">
            <Checkbox
              id={`opt-${task.id}`}
              checked={task.done}
              onCheckedChange={() => toggle.mutate(task)}
            />
            <Label htmlFor={`opt-${task.id}`}>{task.title}</Label>
          </li>
        ))}
        {tasks.data?.length === 0 && (
          <li className="text-muted-foreground text-sm">No hay tareas: cree una de ejemplo.</li>
        )}
      </ul>
    </>
  )
}
