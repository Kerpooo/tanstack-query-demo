import { useState, type FormEvent } from 'react'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { getErrorMessage } from '@/shared/lib/errors'
import { useTasksQuery } from '@/shared/tasks/useTasksQuery'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useAddTask } from './hooks'

export function Demo() {
  const [title, setTitle] = useState('')
  const tasks = useTasksQuery()
  const addTask = useAddTask()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask.mutate(title.trim(), { onSuccess: () => setTitle('') })
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la tarea"
          aria-label="Título de la tarea"
        />
        <Button type="submit" disabled={addTask.isPending}>
          Agregar tarea
        </Button>
      </form>

      <StatusBadges
        items={{ 'mutación (status)': addTask.status, 'lista (isFetching)': tasks.isFetching }}
      />
      {addTask.isError && <p className="text-destructive text-sm">Error: {getErrorMessage(addTask.error)}</p>}

      <ul className="space-y-1 text-sm">
        {tasks.data?.slice(-8).map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
        {tasks.data?.length === 0 && <li className="text-muted-foreground">Todavía no hay tareas.</li>}
      </ul>
    </>
  )
}
