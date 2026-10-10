import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { createDb } from './db.js'

const port = Number(process.env.PORT ?? 3000)
const dbPath = process.env.DB_PATH ?? 'data/app.db'

const app = createApp(createDb(dbPath, { seed: true }))

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Servidor escuchando en http://localhost:${info.port} (SQLite: ${dbPath})`)
})
