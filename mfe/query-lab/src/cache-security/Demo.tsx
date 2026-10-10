import { useState } from 'react'
import { StatusBadges } from '@/shared/docs/StatusBadges'
import { Button } from '@/shared/ui/button'
import { useCacheInventory } from '../cross-mfe-cache/hooks'
import { useCacheSecurity, type Finding } from './hooks'

export function Demo() {
  const { scan, plantSession, logout } = useCacheSecurity()
  const queries = useCacheInventory().length
  const [findings, setFindings] = useState<Finding[] | null>(null)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={plantSession}>
          Sembrar una sesión de ejemplo en la caché
        </Button>
        <Button size="sm" onClick={() => setFindings(scan())}>
          Escanear la caché
        </Button>
        <Button variant="destructive" size="sm" onClick={() => (logout(), setFindings(null))}>
          Cerrar sesión (clear)
        </Button>
      </div>

      <StatusBadges items={{ 'consultas en caché': queries }} />

      {findings === null && (
        <p className="text-muted-foreground text-sm">
          Pulse «Escanear la caché». Si antes visitó «Usuarios» o siembra la sesión de ejemplo, verá hallazgos.
        </p>
      )}
      {findings?.length === 0 && <p className="text-sm">Sin hallazgos: la caché no contiene nada sospechoso.</p>}
      {findings && findings.length > 0 && (
        <ul aria-label="Hallazgos" className="bg-card space-y-1 rounded-md border p-3 text-sm">
          {findings.map((finding, index) => (
            <li key={index}>
              <code className="font-mono text-xs">{finding.key}</code> — {finding.reason}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
