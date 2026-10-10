import { StatusBadges } from '@/shared/docs/StatusBadges'
import { Button } from '@/shared/ui/button'
import { useAddTaskInvalidate, useAddTaskSetQueryData, useCountedTasks } from './hooks'

export function Demo() {
  const list = useCountedTasks()
  const withSetQueryData = useAddTaskSetQueryData()
  const withInvalidate = useAddTaskInvalidate()

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => withSetQueryData.mutate(`Con setQueryData ${Date.now() % 10000}`)}>
          Crear con setQueryData
        </Button>
        <Button size="sm" variant="outline" onClick={() => withInvalidate.mutate(`Con invalidate ${Date.now() % 10000}`)}>
          Crear con invalidateQueries
        </Button>
      </div>

      <StatusBadges
        items={{ 'peticiones de la lista': list.data?.request, 'tareas en caché': list.data?.tasks.length }}
      />
      <p className="text-muted-foreground text-sm">
        Con <code>setQueryData</code> el número de peticiones no cambia; con <code>invalidateQueries</code> sube
        en uno.
      </p>
      <ul className="space-y-1 text-sm">
        {list.data?.tasks.slice(-6).map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </>
  )
}
