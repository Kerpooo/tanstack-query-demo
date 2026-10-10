import { StatusBadges } from '@/shared/docs/StatusBadges'
import { queryKeys } from '@/shared/query/keys'
import { Button } from '@/shared/ui/button'
import { useInvalidate, useScopedClock } from './hooks'

function Panel({ group, id }: { group: string; id: string }) {
  const { data, isFetching } = useScopedClock(group, id)
  return (
    <div role="group" aria-label={`${group}/${id}`} className="space-y-2 rounded-md border p-3 text-sm">
      <p className="font-mono text-xs">{JSON.stringify(queryKeys.scoped(group, id))}</p>
      <StatusBadges items={{ isFetching, 'petición n.º': data?.request }} />
    </div>
  )
}

export function Demo() {
  const invalidate = useInvalidate()

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel group="usuarios" id="1" />
        <Panel group="usuarios" id="2" />
        <Panel group="tareas" id="1" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => invalidate(queryKeys.scopedAll)}>
          Invalidar todo
        </Button>
        <Button variant="outline" size="sm" onClick={() => invalidate(queryKeys.scopedGroup('usuarios'))}>
          Invalidar el grupo usuarios
        </Button>
        <Button variant="outline" size="sm" onClick={() => invalidate(queryKeys.scoped('usuarios', '1'), true)}>
          Invalidar solo usuarios/1
        </Button>
        <Button variant="outline" size="sm" onClick={() => invalidate(queryKeys.scopedGroup('usuarios'), true)}>
          Grupo usuarios con exact
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Fíjese en qué paneles suben su «petición n.º» con cada botón. El último no hace nada: con{' '}
        <code>exact: true</code> la clave <code>[&quot;lab&quot;,&quot;keys&quot;,&quot;usuarios&quot;]</code> no
        coincide con ninguna consulta completa.
      </p>
    </>
  )
}
