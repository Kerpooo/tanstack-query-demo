import { useState } from 'react'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { useClockPolling, useFlaky } from './hooks'

function Polling() {
  const [running, setRunning] = useState(false)
  const clock = useClockPolling(running ? 2000 : false)

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">refetchInterval: actualizar cada 2 s</h3>
      <Button size="sm" variant="outline" onClick={() => setRunning((r) => !r)}>
        {running ? 'Detener polling' : 'Iniciar polling'}
      </Button>
      <StatusBadges items={{ polling: running, isFetching: clock.isFetching }} />
      <p className="font-mono text-sm">{clock.data?.now ?? '—'}</p>
    </section>
  )
}

function Retry() {
  const [run, setRun] = useState({ nonce: 0, retry: 0 })
  const flaky = useFlaky(run)

  const execute = (retry: number) => setRun((r) => ({ nonce: r.nonce + 1, retry }))

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">retry: el servidor falla las 2 primeras veces</h3>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => execute(0)}>
          Ejecutar con retry: 0
        </Button>
        <Button size="sm" variant="outline" onClick={() => execute(3)}>
          Ejecutar con retry: 3
        </Button>
      </div>
      <StatusBadges items={{ status: flaky.status, failureCount: flaky.failureCount }} />
      {flaky.failureReason && flaky.isFetching && (
        <p className="text-muted-foreground text-sm">
          Reintentando… último error: {getErrorMessage(flaky.failureReason)}
        </p>
      )}
      {flaky.isError && <p className="text-destructive text-sm">Falló: {getErrorMessage(flaky.error)}</p>}
      {flaky.isSuccess && <p className="text-sm">Éxito en el intento {flaky.data.attempt}.</p>}
    </section>
  )
}

export function Demo() {
  return (
    <>
      <Polling />
      <Retry />
    </>
  )
}
