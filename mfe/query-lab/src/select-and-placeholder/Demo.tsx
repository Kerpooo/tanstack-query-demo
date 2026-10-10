import { useState } from 'react'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useUsersCount, useUsersMatching, useUsersPage } from './hooks'

export function Demo() {
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(0)
  const count = useUsersCount()
  const matching = useUsersMatching(term)
  const pageQuery = useUsersPage(page)

  return (
    <>
      <section className="space-y-2">
        <h3 className="text-sm font-medium">select: derivar datos de la misma caché</h3>
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Filtrar por nombre"
          aria-label="Filtrar por nombre"
        />
        <StatusBadges items={{ 'total de usuarios': count.data, coincidencias: matching.data?.length }} />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">placeholderData: paginar sin parpadeos</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pageQuery.isPlaceholderData || !pageQuery.data?.nextCursor}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
          <span className="text-muted-foreground text-sm">Página {page + 1}</span>
        </div>
        <StatusBadges items={{ isPlaceholderData: pageQuery.isPlaceholderData, isFetching: pageQuery.isFetching }} />
        <ul className="space-y-1 text-sm">
          {pageQuery.data?.items.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      </section>
    </>
  )
}
