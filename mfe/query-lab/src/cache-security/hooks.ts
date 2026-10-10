import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/query/keys'

export interface Finding {
  key: string
  reason: string
}

const SECRET_NAME = /token|password|secret|apikey|authorization/i
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/

// Lo mismo que haría un pentester desde cualquier microfrontend:
// recorrer TODA la caché compartida y buscar datos que no deberían estar ahí.
export function scanCache(queryClient: QueryClient): Finding[] {
  const findings: Finding[] = []
  for (const query of queryClient.getQueryCache().findAll()) {
    const key = JSON.stringify(query.queryKey)
    const data = JSON.stringify(query.state.data ?? null)

    // Las claves aparecen en Devtools, logs y errores: no deben llevar secretos ni datos personales.
    if (SECRET_NAME.test(key)) findings.push({ key, reason: 'el nombre de la clave sugiere un secreto' })
    if (EMAIL.test(key)) findings.push({ key, reason: 'la clave contiene un correo' })

    // Los datos son legibles por cualquier código de la página.
    if (SECRET_NAME.test(data)) findings.push({ key, reason: 'los datos incluyen campos como token o password' })
    if (EMAIL.test(data)) findings.push({ key, reason: 'los datos incluyen correos (datos personales)' })
  }
  return findings
}

export function useCacheSecurity() {
  const queryClient = useQueryClient()
  return {
    scan: () => scanCache(queryClient),
    // Simula lo que NO debe hacerse: dejar una sesión dentro de la caché.
    plantSession: () =>
      queryClient.setQueryData(queryKeys.securitySession, { token: 'eyJhbGciOi…(falso)', user: 'ana@example.com' }),
    // Al cerrar sesión se borra TODO, para que el siguiente usuario no vea datos del anterior.
    logout: () => queryClient.clear(),
  }
}
