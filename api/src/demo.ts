import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Endpoints de apoyo para las demos de TanStack Query (mfe/query-lab).
 * No guardan datos de negocio: solo permiten observar tiempo, latencia y fallos.
 */
export const demoRoutes = () => {
  // Contador de intentos por clave para /flaky (en memoria, por app).
  const attempts = new Map<string, number>()

  return new Hono()
    // Hora del servidor: sirve para ver cuándo se refresca la caché y para polling.
    .get('/clock', (c) => c.json({ now: new Date().toISOString() }))

    // Responde tras `ms` milisegundos: sirve para ver estados de carga.
    .get('/slow', zValidator('query', z.object({ ms: z.coerce.number().int().min(0).max(5000).default(1000) })), async (c) => {
      const { ms } = c.req.valid('query')
      await sleep(ms)
      return c.json({ waited: ms })
    })

    // Falla las primeras `failures` veces por `key` y luego responde bien (y reinicia la cuenta).
    .get(
      '/flaky',
      zValidator(
        'query',
        z.object({
          key: z.string().min(1).default('default'),
          failures: z.coerce.number().int().min(0).max(10).default(2),
        }),
      ),
      (c) => {
        const { key, failures } = c.req.valid('query')
        const attempt = (attempts.get(key) ?? 0) + 1
        if (attempt <= failures) {
          attempts.set(key, attempt)
          return c.json({ error: `Fallo simulado (intento ${attempt} de ${failures})` }, 500)
        }
        attempts.delete(key)
        return c.json({ ok: true, attempt })
      },
    )

    // Siempre falla: sirve para forzar el rollback de una actualización optimista.
    .all('/fail', (c) => c.json({ error: 'Fallo forzado' }, 500))
}
