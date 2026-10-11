import type { Hono } from 'hono'
import { createApp } from './app.js'
import { createDb } from './db.js'

// Entrada para Cloudflare Workers (wrangler.jsonc). En local se sigue usando index.ts.
interface Env {
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
}

// Una app por isolate: se crea en la primera petición porque los secretos solo
// llegan en `env`. Si falla la conexión, se descarta para reintentar en la siguiente.
let app: Promise<Hono> | undefined

const getApp = (env: Env) =>
  (app ??= createDb(env.TURSO_DATABASE_URL, { seed: true, authToken: env.TURSO_AUTH_TOKEN })
    .then(createApp)
    .catch((err: unknown) => {
      app = undefined
      throw err
    }))

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (await getApp(env)).fetch(request, env)
  },
}
