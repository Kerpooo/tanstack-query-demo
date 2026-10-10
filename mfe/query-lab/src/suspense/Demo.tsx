import { Suspense, useState } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorBoundary } from '@/shared/lib/ErrorBoundary'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import { useReport } from './hooks'

function Report({ nonce, fail }: { nonce: number; fail: boolean }) {
  // Aquí no hay isPending ni isError: el componente solo se ocupa del caso feliz.
  const { data } = useReport({ nonce, fail })
  return (
    <p className="text-sm">
      Informe generado a las <span className="font-mono">{data.now}</span>
    </p>
  )
}

export function Demo() {
  const [nonce, setNonce] = useState(0)
  const [fail, setFail] = useState(false)

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox id="suspense-fail" checked={fail} onCheckedChange={(v) => setFail(v === true)} />
          <Label htmlFor="suspense-fail">Forzar error del servidor</Label>
        </div>
        <Button variant="outline" size="sm" onClick={() => setNonce((n) => n + 1)}>
          Volver a cargar
        </Button>
      </div>

      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallback={(error, retry) => (
              <div role="alert" className="space-y-2 text-sm">
                <p className="text-destructive">El informe falló: {getErrorMessage(error)}</p>
                <Button size="sm" onClick={retry}>
                  Reintentar
                </Button>
              </div>
            )}
          >
            <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando informe (Suspense)…</p>}>
              <Report nonce={nonce} fail={fail} />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
      <p className="text-muted-foreground text-sm">
        Active el error y pulse «Volver a cargar»: el límite de errores muestra el fallo. Desactívelo y pulse
        «Reintentar».
      </p>
    </>
  )
}
