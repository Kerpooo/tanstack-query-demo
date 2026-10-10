import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/shared/api/endpoints'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { queryKeys } from '@/shared/query/keys'
import { Button } from '@/shared/ui/button'
import { useUserDetail } from './hooks'

export function Demo() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const users = useQuery({ queryKey: queryKeys.users, queryFn: usersApi.list })
  const detail = useUserDetail(selectedId)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {users.data?.slice(0, 6).map((user) => (
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

      <StatusBadges
        items={{ enabled: selectedId !== null, status: detail.status, fetchStatus: detail.fetchStatus }}
      />
      {selectedId === null && (
        <p className="text-muted-foreground text-sm">Elija un usuario: hasta entonces no hay petición.</p>
      )}
      {detail.data && (
        <p className="text-sm">
          <strong>{detail.data.name}</strong> — {detail.data.email}
        </p>
      )}
    </>
  )
}
