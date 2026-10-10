import { EventLog } from '@/shared/docs/EventLog'
import { useEventLog } from '@/shared/lib/useEventLog'
import { Button } from '@/shared/ui/button'
import { useImperativeClient } from './hooks'

export function Demo() {
  const client = useImperativeClient()
  const { events, push, clear } = useEventLog()

  const describe = (data: { now: string; request: number }) => `petición n.º ${data.request} (${data.now})`

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={async () => push(`fetchQuery → ${describe(await client.fetch())}`)}>
          fetchQuery
        </Button>
        <Button variant="outline" size="sm" onClick={async () => push(`ensureQueryData → ${describe(await client.ensure())}`)}>
          ensureQueryData
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const data = client.read()
            push(`getQueryData → ${data ? describe(data) : 'undefined (no hay nada en caché)'}`)
          }}
        >
          getQueryData
        </Button>
        <Button variant="secondary" size="sm" onClick={() => client.markStale()}>
          Marcar como obsoleto
        </Button>
        <Button variant="secondary" size="sm" onClick={() => client.clear()}>
          Vaciar la caché
        </Button>
        <Button variant="secondary" size="sm" onClick={clear}>
          Limpiar registro
        </Button>
      </div>
      <EventLog events={events} empty="Pulse un botón: aquí no hay ningún useQuery, solo llamadas directas." />
    </>
  )
}
