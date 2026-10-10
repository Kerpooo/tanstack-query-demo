import { useState } from 'react'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { Button } from '@/shared/ui/button'
import { useClock } from './hooks'

const OPTIONS = [
  { label: '0 s (siempre obsoleto)', value: 0 },
  { label: '10 s', value: 10_000 },
  { label: 'Infinity (nunca obsoleto)', value: Infinity },
] as const

function ClockPanel({ staleTime }: { staleTime: number }) {
  const { data, isStale, isFetching } = useClock(staleTime)
  return (
    <div className="space-y-2 rounded-md border p-3 text-sm">
      <StatusBadges items={{ isStale, isFetching, 'petición n.º': data?.request }} />
      <p>
        Hora del servidor: <span className="font-mono">{data?.now ?? '…'}</span>
      </p>
    </div>
  )
}

export function Demo() {
  const [staleTime, setStaleTime] = useState<number>(10_000)
  const [visible, setVisible] = useState(true)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <Button
            key={o.label}
            size="sm"
            variant={staleTime === o.value ? 'default' : 'outline'}
            onClick={() => setStaleTime(o.value)}
          >
            staleTime: {o.label}
          </Button>
        ))}
      </div>
      <Button variant="secondary" size="sm" onClick={() => setVisible((v) => !v)}>
        {visible ? 'Desmontar el componente' : 'Montar el componente'}
      </Button>
      <p className="text-muted-foreground text-sm">
        Desmonte y vuelva a montar: con <code>staleTime</code> 0 se pide otra vez; con 10 s o Infinity se
        reutiliza la caché y el número de petición no cambia.
      </p>
      {visible && <ClockPanel staleTime={staleTime} />}
    </>
  )
}
