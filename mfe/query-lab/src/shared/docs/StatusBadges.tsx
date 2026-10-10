import { cn } from '@/shared/lib/utils'

type Value = string | number | boolean | undefined

/**
 * Color del indicador según el significado del valor: usa los mismos colores
 * que las Devtools de TanStack Query (fresco, cargando, obsoleto, inactivo, error).
 */
function dotColor(label: string, value: Value): string | null {
  const text = String(value)
  if (/status/i.test(label)) {
    if (text === 'success') return 'bg-state-fresh'
    if (text === 'pending' || text === 'fetching') return 'bg-state-fetching'
    if (text === 'paused') return 'bg-state-stale'
    if (text === 'error') return 'bg-destructive'
    if (text === 'idle') return 'bg-state-idle'
    return null
  }
  if (label === 'isFetching') return value ? 'bg-state-fetching' : 'bg-state-idle'
  if (label === 'isStale' || label === 'isPlaceholderData') return value ? 'bg-state-stale' : 'bg-state-fresh'
  return null
}

/** Muestra pares etiqueta/valor (estado de una query) como los indicadores de un panel. */
export function StatusBadges({ items }: { items: Record<string, Value> }) {
  return (
    <dl className="flex flex-wrap gap-2 font-mono text-xs">
      {Object.entries(items).map(([label, value]) => {
        const color = dotColor(label, value)
        return (
          <div key={label} className="bg-card flex items-center gap-1.5 rounded-md border px-2.5 py-1">
            {color && <span aria-hidden className={cn('size-2 rounded-full', color)} />}
            <dt className="text-muted-foreground">{label}:</dt>
            <dd className="font-semibold">{String(value)}</dd>
          </div>
        )
      })}
    </dl>
  )
}
