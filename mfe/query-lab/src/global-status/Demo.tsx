import { StatusBadges } from '@/shared/docs/StatusBadges'
import { Button } from '@/shared/ui/button'
import { useGlobalActivity, useGlobalSlow, useRefreshAll, useSave } from './hooks'

function SlowPanel({ ms }: { ms: number }) {
  const { isFetching, data } = useGlobalSlow(ms)
  return (
    <div className="space-y-2 rounded-md border p-3 text-sm">
      <p className="font-medium">Consulta de {ms / 1000} s</p>
      <StatusBadges items={{ isFetching, resultado: data ? `${data.waited} ms` : '—' }} />
    </div>
  )
}

/** Indicador global: no sabe nada de las consultas concretas, solo lee los contadores. */
function GlobalBar() {
  const { fetching, mutating, saving } = useGlobalActivity()
  const busy = fetching > 0 || mutating > 0
  return (
    <div role="status" aria-label="Actividad global" className="bg-muted flex flex-wrap gap-4 rounded-md px-3 py-2 text-sm">
      <span className={busy ? 'font-medium' : 'text-muted-foreground'}>{busy ? 'Trabajando…' : 'En reposo'}</span>
      <span>
        Consultas en curso: <strong>{fetching}</strong>
      </span>
      <span>
        Mutaciones en curso: <strong>{mutating}</strong>
      </span>
      <span>Guardando: {saving.length > 0 ? saving.join(', ') : '—'}</span>
    </div>
  )
}

export function Demo() {
  const refreshAll = useRefreshAll()
  const save = useSave()

  return (
    <>
      <GlobalBar />
      <div className="grid gap-3 sm:grid-cols-3">
        <SlowPanel ms={1000} />
        <SlowPanel ms={2000} />
        <SlowPanel ms={3000} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={refreshAll}>
          Refrescar todo
        </Button>
        <Button variant="outline" size="sm" onClick={() => save.mutate('Informe A')}>
          Guardar «Informe A»
        </Button>
        <Button variant="outline" size="sm" onClick={() => save.mutate('Informe B')}>
          Guardar «Informe B»
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        La barra superior no recibe datos de los paneles: lee contadores globales. Es el patrón típico de una
        barra de progreso o un spinner en la cabecera de la aplicación.
      </p>
    </>
  )
}
