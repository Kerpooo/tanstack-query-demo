import { useEffect, useState } from 'react'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import { resetManagers, setOffline, simulateFocusChange, useFocusClock, useIsOnline } from './hooks'

export function Demo() {
  const [refetchOnFocus, setRefetchOnFocus] = useState(true)
  const online = useIsOnline()
  const { data, status, fetchStatus, isStale, refetch } = useFocusClock({ refetchOnWindowFocus: refetchOnFocus })

  // Los gestores son globales: al salir de la demo se restauran.
  useEffect(() => resetManagers, [])

  return (
    <>
      <div className="flex items-center gap-2">
        <Checkbox id="refetch-focus" checked={refetchOnFocus} onCheckedChange={(v) => setRefetchOnFocus(v === true)} />
        <Label htmlFor="refetch-focus">refetchOnWindowFocus activado</Label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={simulateFocusChange}>
          Simular que la ventana pierde y recupera el foco
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOffline(online)}>
          {online ? 'Simular desconexión' : 'Restaurar conexión'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Volver a pedir (refetch)
        </Button>
      </div>

      <StatusBadges
        items={{ status, fetchStatus, isStale, conexión: online ? 'en línea' : 'sin conexión', 'petición n.º': data?.request }}
      />
      <p className="text-sm">
        Hora del servidor: <span className="font-mono">{data?.now ?? '…'}</span>
      </p>
      <p className="text-muted-foreground text-sm">
        También puede probarlo de verdad: cambie de pestaña del navegador y regrese.
      </p>
    </>
  )
}
