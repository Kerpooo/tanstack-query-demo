import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Db } from './db.js'

export interface Task {
  id: string
  title: string
  done: boolean
  createdAt: string
}

interface TaskRow {
  id: string
  title: string
  done: number
  created_at: string
}

const toTask = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  done: r.done === 1,
  createdAt: r.created_at,
})

export const tasksRepository = (db: Db) => ({
  list: (): Task[] =>
    (db.prepare('SELECT * FROM tasks ORDER BY created_at, rowid').all() as unknown as TaskRow[]).map(toTask),

  get: (id: string): Task | undefined => {
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined
    return row && toTask(row)
  },

  create: (input: { title: string; done?: boolean }): Task => {
    const task: Task = {
      id: randomUUID(),
      title: input.title,
      done: input.done ?? false,
      createdAt: new Date().toISOString(),
    }
    db.prepare('INSERT INTO tasks (id, title, done, created_at) VALUES (?, ?, ?, ?)').run(
      task.id,
      task.title,
      task.done ? 1 : 0,
      task.createdAt,
    )
    return task
  },

  update(id: string, changes: { title?: string; done?: boolean }): Task | undefined {
    const current = this.get(id)
    if (!current) return undefined
    const next = { ...current, ...changes }
    db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(next.title, next.done ? 1 : 0, id)
    return next
  },

  remove: (id: string): boolean => Number(db.prepare('DELETE FROM tasks WHERE id = ?').run(id).changes) > 0,
})

const createSchema = z.object({
  title: z.string().min(1).max(200),
  done: z.boolean().optional(),
})
const updateSchema = createSchema.partial()

export const tasksRoutes = (db: Db) => {
  const repo = tasksRepository(db)
  return new Hono()
    .get('/', (c) => c.json(repo.list()))
    .get('/:id', (c) => {
      const task = repo.get(c.req.param('id'))
      return task ? c.json(task) : c.json({ error: 'Tarea no encontrada' }, 404)
    })
    .post('/', zValidator('json', createSchema), (c) => c.json(repo.create(c.req.valid('json')), 201))
    .patch('/:id', zValidator('json', updateSchema), (c) => {
      const task = repo.update(c.req.param('id'), c.req.valid('json'))
      return task ? c.json(task) : c.json({ error: 'Tarea no encontrada' }, 404)
    })
    .delete('/:id', (c) =>
      repo.remove(c.req.param('id')) ? c.body(null, 204) : c.json({ error: 'Tarea no encontrada' }, 404),
    )
}
