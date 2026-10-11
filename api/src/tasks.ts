import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Db } from './db.js'

/** Usuario asignado a una tarea (solo lo necesario para mostrarlo). */
export interface Assignee {
  id: string
  name: string
}

export interface Task {
  id: string
  title: string
  done: boolean
  createdAt: string
  assignees: Assignee[]
}

const toTask = (r: Record<string, unknown>, assignees: Assignee[]): Task => ({
  id: String(r.id),
  title: String(r.title),
  done: Number(r.done) === 1,
  createdAt: String(r.created_at),
  assignees,
})

/** Agrupa las filas `task_id, id, name` por tarea, conservando el orden de la consulta. */
const groupByTask = (rows: Record<string, unknown>[]): Map<string, Assignee[]> => {
  const byTask = new Map<string, Assignee[]>()
  for (const r of rows) {
    const taskId = String(r.task_id)
    const list = byTask.get(taskId) ?? []
    list.push({ id: String(r.id), name: String(r.name) })
    byTask.set(taskId, list)
  }
  return byTask
}

const ASSIGNEES_SQL = `SELECT ta.task_id, u.id, u.name
  FROM task_assignees ta JOIN users u ON u.id = ta.user_id`

const insertAssignees = (taskId: string, userIds: string[]) =>
  userIds.map((userId) => ({
    sql: 'INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)',
    args: [taskId, userId],
  }))

export const tasksRepository = (db: Db) => ({
  async list(): Promise<Task[]> {
    const [tasks, assignees] = await db.batch(
      ['SELECT * FROM tasks ORDER BY created_at, rowid', `${ASSIGNEES_SQL} ORDER BY u.name`],
      'read',
    )
    const byTask = groupByTask(assignees!.rows)
    return tasks!.rows.map((r) => toTask(r, byTask.get(String(r.id)) ?? []))
  },

  async get(id: string): Promise<Task | undefined> {
    const [tasks, assignees] = await db.batch(
      [
        { sql: 'SELECT * FROM tasks WHERE id = ?', args: [id] },
        { sql: `${ASSIGNEES_SQL} WHERE ta.task_id = ? ORDER BY u.name`, args: [id] },
      ],
      'read',
    )
    const row = tasks!.rows[0]
    return row && toTask(row, groupByTask(assignees!.rows).get(id) ?? [])
  },

  /** Ids de `userIds` que no corresponden a ningún usuario. */
  async missingUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return []
    const { rows } = await db.execute({
      sql: `SELECT id FROM users WHERE id IN (${userIds.map(() => '?').join(', ')})`,
      args: userIds,
    })
    const found = new Set(rows.map((r) => String(r.id)))
    return userIds.filter((id) => !found.has(id))
  },

  async create(input: { title: string; done?: boolean; assigneeIds?: string[] }): Promise<Task> {
    const id = randomUUID()
    await db.batch(
      [
        {
          sql: 'INSERT INTO tasks (id, title, done, created_at) VALUES (?, ?, ?, ?)',
          args: [id, input.title, input.done ? 1 : 0, new Date().toISOString()],
        },
        ...insertAssignees(id, input.assigneeIds ?? []),
      ],
      'write',
    )
    return (await this.get(id))!
  },

  /** `assigneeIds`, si llega, reemplaza la lista completa de asignados. */
  async update(
    id: string,
    changes: { title?: string; done?: boolean; assigneeIds?: string[] },
  ): Promise<Task | undefined> {
    const current = await this.get(id)
    if (!current) return undefined
    const title = changes.title ?? current.title
    const done = changes.done ?? current.done
    await db.batch(
      [
        { sql: 'UPDATE tasks SET title = ?, done = ? WHERE id = ?', args: [title, done ? 1 : 0, id] },
        ...(changes.assigneeIds
          ? [
              { sql: 'DELETE FROM task_assignees WHERE task_id = ?', args: [id] },
              ...insertAssignees(id, changes.assigneeIds),
            ]
          : []),
      ],
      'write',
    )
    return this.get(id)
  },

  async remove(id: string): Promise<boolean> {
    const [, deleted] = await db.batch(
      [
        { sql: 'DELETE FROM task_assignees WHERE task_id = ?', args: [id] },
        { sql: 'DELETE FROM tasks WHERE id = ?', args: [id] },
      ],
      'write',
    )
    return deleted!.rowsAffected > 0
  },
})

// Los ids repetidos se descartan para no violar la clave primaria de `task_assignees`.
const assigneeIdsSchema = z
  .array(z.string().min(1))
  .max(50)
  .transform((ids) => [...new Set(ids)])

const createSchema = z.object({
  title: z.string().min(1).max(200),
  done: z.boolean().optional(),
  assigneeIds: assigneeIdsSchema.optional(),
})
const updateSchema = createSchema.partial()

export const tasksRoutes = (db: Db) => {
  const repo = tasksRepository(db)
  const notFound = { error: 'Tarea no encontrada' }
  const unknownUsers = (ids: string[]) => ({ error: `Usuarios no encontrados: ${ids.join(', ')}` })
  return new Hono()
    .get('/', async (c) => c.json(await repo.list()))
    .get('/:id', async (c) => {
      const task = await repo.get(c.req.param('id'))
      return task ? c.json(task) : c.json(notFound, 404)
    })
    .post('/', zValidator('json', createSchema), async (c) => {
      const input = c.req.valid('json')
      const missing = await repo.missingUsers(input.assigneeIds ?? [])
      if (missing.length > 0) return c.json(unknownUsers(missing), 400)
      return c.json(await repo.create(input), 201)
    })
    .patch('/:id', zValidator('json', updateSchema), async (c) => {
      const changes = c.req.valid('json')
      const missing = await repo.missingUsers(changes.assigneeIds ?? [])
      if (missing.length > 0) return c.json(unknownUsers(missing), 400)
      const task = await repo.update(c.req.param('id'), changes)
      return task ? c.json(task) : c.json(notFound, 404)
    })
    .delete('/:id', async (c) =>
      (await repo.remove(c.req.param('id'))) ? c.body(null, 204) : c.json(notFound, 404),
    )
}
