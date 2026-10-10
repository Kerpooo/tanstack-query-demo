import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { Db } from './db.js'
import { demoRoutes } from './demo.js'
import { tasksRoutes } from './tasks.js'
import { usersRoutes } from './users.js'

export function createApp(db: Db) {
  const app = new Hono()

  app.use(logger())
  app.use(cors())

  app.get('/', (c) => c.json({ name: 'hono-api', status: 'ok' }))
  app.route('/tasks', tasksRoutes(db))
  app.route('/users', usersRoutes(db))
  app.route('/demo', demoRoutes())

  app.notFound((c) => c.json({ error: 'Ruta no encontrada' }, 404))
  app.onError((err, c) => {
    console.error(err)
    return c.json({ error: 'Error interno del servidor' }, 500)
  })

  return app
}
