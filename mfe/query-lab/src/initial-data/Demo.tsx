import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, type User } from '@/shared/api/endpoints'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { queryKeys } from '@/shared/query/keys'
import { Button } from '@/shared/ui/button'
import { useUserWithInitialData, useUserWithPlaceholder } from './hooks'

interface PanelProps {
  title: string
  id: string | null
  result: { data: User | undefined; status: string; fetchStatus: string; isPlaceholderData: boolean }
  cacheKey: readonly unknown[]
}

function Panel({ title, id, result, cacheKey }: PanelProps) {
  const queryClient = useQueryClient()
  const inCache = id !== null && queryClient.getQueryData(cacheKey) !== undefined
  return (
    <div role="group" aria-label={title} className="space-y-2 rounded-md border p-3 text-sm">
      <h3 className="font-medium">{title}</h3>
      <StatusBadges
        items={{
          status: result.status,
          fetchStatus: result.fetchStatus,
          isPlaceholderData: result.isPlaceholderData,
          'en caché': inCache ? 'sí' : 'no',
        }}
      />
      <p>{result.data ? `${result.data.name} — ${result.data.email}` : '—'}</p>
    </div>
  )
}

export function Demo() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const users = useQuery({ queryKey: queryKeys.users, queryFn: usersApi.list })
  const initial = useUserWithInitialData(selectedId)
  const placeholder = useUserWithPlaceholder(selectedId)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {users.data?.slice(0, 5).map((user) => (
          <Button
            key={user.id}
            size="sm"
            variant={selectedId === user.id ? 'default' : 'outline'}
            onClick={() => setSelectedId(user.id)}
          >
            {user.name}
          </Button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel title="initialData" id={selectedId} result={initial} cacheKey={queryKeys.userInitial(selectedId ?? '')} />
        <Panel
          title="placeholderData"
          id={selectedId}
          result={placeholder}
          cacheKey={queryKeys.userPlaceholder(selectedId ?? '')}
        />
      </div>
      <p className="text-muted-foreground text-sm">
        Elija un usuario: ambos paneles muestran sus datos al instante (salen de la lista), pero mientras llega
        la petición real (1,5 s) solo <code>initialData</code> ya está en la caché.
      </p>
    </>
  )
}
