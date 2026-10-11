import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createClient, type Client } from '@libsql/client'

export type Db = Client

const NAMED_USERS = [
  { name: 'Ana Torres', email: 'ana@example.com' },
  { name: 'Luis Pérez', email: 'luis@example.com' },
  { name: 'Marta Gómez', email: 'marta@example.com' },
]

// Usuarios extra para poder demostrar paginación (useInfiniteQuery).
export const SEED_USER_COUNT = 30
const SEED_USERS = [
  ...NAMED_USERS,
  ...Array.from({ length: SEED_USER_COUNT - NAMED_USERS.length }, (_, i) => {
    const n = String(i + NAMED_USERS.length + 1).padStart(2, '0')
    return { name: `Usuario ${n}`, email: `usuario${n}@example.com` }
  }),
]

interface Options {
  /** Inserta usuarios de ejemplo si la tabla está vacía. */
  seed?: boolean
  /** Token de Turso; solo hace falta con una URL remota (`libsql://...`). */
  authToken?: string
}

/** Convierte una ruta de archivo en URL; deja intactas las URL (`libsql://`, `file:`) y `:memory:`. */
const toUrl = (target: string): string =>
  target === ':memory:' || /^[a-z][a-z0-9+.-]*:/i.test(target) ? target : `file:${target}`

/**
 * Abre la base SQLite de Turso/libSQL. Acepta una URL remota (`libsql://...`),
 * una ruta de archivo local o `:memory:` para una base efímera.
 */
export async function createDb(target = ':memory:', { seed = false, authToken }: Options = {}): Promise<Db> {
  const url = toUrl(target)
  if (url.startsWith('file:') && !url.startsWith('file::memory:')) {
    mkdirSync(dirname(url.slice('file:'.length)), { recursive: true })
  }

  const db = createClient({ url, authToken })
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS tasks (
        id         TEXT PRIMARY KEY,
        title      TEXT NOT NULL,
        done       INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id    TEXT PRIMARY KEY,
        name  TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
      )`,
      // Usuarios asignados a cada tarea (N:M). Los repositorios borran las filas
      // a mano al eliminar una tarea o un usuario: libSQL no garantiza que
      // `PRAGMA foreign_keys` siga activo en todas las conexiones.
      `CREATE TABLE IF NOT EXISTS task_assignees (
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, user_id)
      )`,
    ],
    'write',
  )

  if (seed) {
    const { rows } = await db.execute('SELECT COUNT(*) AS total FROM users')
    if (Number(rows[0]!.total) === 0) {
      await db.batch(
        SEED_USERS.map((u) => ({
          sql: 'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
          args: [randomUUID(), u.name, u.email],
        })),
        'write',
      )
    }
  }
  return db
}

/** Violación de una restricción UNIQUE (SQLITE_CONSTRAINT_UNIQUE en local; en remoto llega como SQLITE_CONSTRAINT). */
export const isUniqueViolation = (err: unknown): boolean => {
  if (typeof err !== 'object' || err === null) return false
  const { code, message } = err as { code?: string; message?: string }
  return (
    code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    (typeof code === 'string' && code.startsWith('SQLITE_CONSTRAINT') && /UNIQUE constraint failed/i.test(message ?? ''))
  )
}
