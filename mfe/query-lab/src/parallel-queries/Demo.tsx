import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/ui/button'
import { queryKeys } from '@/shared/query/keys'
import { useDashboard } from './hooks'

export function Demo() {
  const queryClient = useQueryClient()
  const cards = useDashboard()

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-md border p-3 text-sm">
            <p className="text-muted-foreground">{card.label}</p>
            <p className="text-lg font-semibold">{card.status === 'pending' ? 'Cargando…' : card.value}</p>
            <p className="text-muted-foreground font-mono text-xs">status: {card.status}</p>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.slow(1500) })}
      >
        Repetir solo la consulta lenta
      </Button>
      <p className="text-muted-foreground text-sm">
        Las dos primeras aparecen enseguida; no esperan a la lenta porque corren en paralelo.
      </p>
    </>
  )
}
