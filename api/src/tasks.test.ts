import { beforeEach, describe, expect, it } from 'vitest'
import { createDb, type Db } from './db.js'
import { tasksRepository } from './tasks.js'
import { usersRepository } from './users.js'

let db: Db
beforeEach(async () => {
  db = await createDb(':memory:')
})

const countAssignments = async () =>
  Number((await db.execute('SELECT COUNT(*) AS total FROM task_assignees')).rows[0]!.total)

describe('tasksRepository: asignaciones', () => {
  it('eliminar una tarea borra sus filas de task_assignees', async () => {
    const user = await usersRepository(db).create({ name: 'Ana', email: 'ana@example.com' })
    const task = await tasksRepository(db).create({ title: 'T', assigneeIds: [user.id] })
    expect(await countAssignments()).toBe(1)

    expect(await tasksRepository(db).remove(task.id)).toBe(true)
    expect(await countAssignments()).toBe(0)
  })

  it('eliminar un usuario borra sus filas de task_assignees', async () => {
    const users = usersRepository(db)
    const [ana, luis] = [
      await users.create({ name: 'Ana', email: 'ana@example.com' }),
      await users.create({ name: 'Luis', email: 'luis@example.com' }),
    ]
    await tasksRepository(db).create({ title: 'T', assigneeIds: [ana.id, luis.id] })

    expect(await users.remove(ana.id)).toBe(true)
    expect(await countAssignments()).toBe(1)
  })

  it('missingUsers devuelve solo los ids que no existen', async () => {
    const ana = await usersRepository(db).create({ name: 'Ana', email: 'ana@example.com' })
    expect(await tasksRepository(db).missingUsers([ana.id, 'x', 'y'])).toEqual(['x', 'y'])
    expect(await tasksRepository(db).missingUsers([])).toEqual([])
  })
})
