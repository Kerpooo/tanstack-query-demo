import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { EventLog } from '@/shared/docs/EventLog'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { useEventLog } from '@/shared/lib/useEventLog'
import { queryKeys } from '@/shared/query/keys'
import { Button } from '@/shared/ui/button'
import { useCancellableSlow } from './hooks'

export function Demo() {
  const [ms, setMs] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const { events, push, clear } = useEventLog()
  const { status, fetchStatus, data } = useCancellableSlow(ms, push)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setMs(3000)}>
          Pedir 3 s
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMs(5000)}>
          Pedir 5 s
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={ms === null}
          onClick={() => ms !== null && queryClient.cancelQueries({ queryKey: queryKeys.cancellable(ms) })}
        >
          Cancelar
        </Button>
        <Button variant="secondary" size="sm" onClick={clear}>
          Limpiar registro
        </Button>
      </div>

      <StatusBadges items={{ status, fetchStatus, resultado: data ? `${data.waited} ms` : '—' }} />
      <EventLog events={events} />
      <p className="text-muted-foreground text-sm">
        Pida 3 s y, antes de que termine, pida 5 s (o pulse Cancelar): la petición anterior se cancela de verdad.
        Abra la pestaña Network de DevTools para verla en rojo.
      </p>
    </>
  )
}
