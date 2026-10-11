import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { createDb } from './db.js'

const port = Number(process.env.PORT ?? 3000)
// Producción: TURSO_DATABASE_URL (libsql://...) + TURSO_AUTH_TOKEN. Local: archivo SQLite.
const dbTarget = process.env.TURSO_DATABASE_URL || process.env.DB_PATH || 'data/app.db'

const app = createApp(await createDb(dbTarget, { seed: true, authToken: process.env.TURSO_AUTH_TOKEN }))

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Servidor escuchando en http://localhost:${info.port} (base: ${dbTarget})`)
})
