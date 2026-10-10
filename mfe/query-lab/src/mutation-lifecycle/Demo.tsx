import { useState } from 'react'
import { EventLog } from '@/shared/docs/EventLog'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { useEventLog } from '@/shared/lib/useEventLog'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import { useSaveDraft } from './hooks'

export function Demo() {
  const [fail, setFail] = useState(false)
  const { events, push, clear } = useEventLog()
  const { mutate, mutateAsync, reset, status, isIdle, variables } = useSaveDraft({ fail, onEvent: push })

  const withCallbacks = () =>
    // Callbacks del LLAMADO: se ejecutan después de los del hook y solo si el componente sigue montado.
    mutate('Borrador 1', {
      onSuccess: () => push('mutate → onSuccess del llamado'),
      onError: () => push('mutate → onError del llamado'),
    })

  const withAwait = async () => {
    try {
      // mutateAsync devuelve una promesa: sirve para encadenar con await.
      const result = await mutateAsync('Borrador 2')
      push(`await terminó: ${result.saved}`)
    } catch {
      // Con mutateAsync hay que atrapar el error; con mutate no hace falta.
      push('catch — el await falló')
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Checkbox id="lifecycle-fail" checked={fail} onCheckedChange={(v) => setFail(v === true)} />
          <Label htmlFor="lifecycle-fail">Forzar fallo del servidor</Label>
        </div>
        <Button variant="outline" size="sm" onClick={withCallbacks}>
          Guardar con mutate
        </Button>
        <Button variant="outline" size="sm" onClick={withAwait}>
          Guardar con mutateAsync
        </Button>
        <Button variant="secondary" size="sm" onClick={() => reset()}>
          reset()
        </Button>
        <Button variant="secondary" size="sm" onClick={clear}>
          Limpiar registro
        </Button>
      </div>

      <StatusBadges items={{ status, isIdle, variables: variables ?? '—' }} />
      <EventLog events={events} empty="Pulse un botón para ver el orden de los callbacks." />
    </>
  )
}
