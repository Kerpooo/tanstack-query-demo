import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/shared/api/endpoints'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { queryKeys } from '@/shared/query/keys'
import { Button } from '@/shared/ui/button'
import { userDetailOptions, usePrefetchUser, useUserDetail } from './hooks'

function UserRow({ id, name, selected, onSelect }: { id: string; name: string; selected: boolean; onSelect: () => void }) {
  const prefetch = usePrefetchUser()
  // enabled:false = solo observa la caché (sirve para saber si ya está precargado).
  const cached = useQuery({ ...userDetailOptions(id), enabled: false })

  return (
    <li className="flex items-center gap-2">
      <Button
        size="sm"
        variant={selected ? 'default' : 'outline'}
        onMouseEnter={() => prefetch(id)}
        onFocus={() => prefetch(id)}
        onClick={onSelect}
      >
        {name}
      </Button>
      {cached.data && <span className="text-xs text-green-700">precargado</span>}
    </li>
  )
}

export function Demo() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const users = useQuery({ queryKey: queryKeys.users, queryFn: usersApi.list })
  const detail = useUserDetail(selectedId)

  return (
    <>
      <ul className="space-y-2">
        {users.data?.slice(0, 5).map((user) => (
          <UserRow
            key={user.id}
            id={user.id}
            name={user.name}
            selected={selectedId === user.id}
            onSelect={() => setSelectedId(user.id)}
          />
        ))}
      </ul>

      <StatusBadges items={{ status: detail.status, isFetching: detail.isFetching }} />
      {detail.isPending && selectedId !== null && <p className="text-muted-foreground text-sm">Cargando detalle…</p>}
      {detail.data && (
        <p className="text-sm">
          <strong>{detail.data.name}</strong> — {detail.data.email}
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => queryClient.resetQueries({ queryKey: ['lab', 'user-prefetch'] })}
      >
        Vaciar lo precargado
      </Button>
      <p className="text-muted-foreground text-sm">
        Pase el mouse sobre un nombre, espere un instante y haga clic: el detalle aparece al instante. Sin
        precarga tarda unos 0,8 s.
      </p>
    </>
  )
}
