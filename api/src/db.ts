import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export type Db = DatabaseSync

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
}

/** Abre (o crea) la base SQLite. Usa `:memory:` para una base efímera. */
export function createDb(path = ':memory:', { seed = false }: Options = {}): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })

  const db = new DatabaseSync(path)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      done       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id    TEXT PRIMARY KEY,
      name  TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    );
  `)

  if (seed) {
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM users').get() as { total: number }
    if (total === 0) {
      const insert = db.prepare('INSERT INTO users (id, name, email) VALUES (?, ?, ?)')
      for (const u of SEED_USERS) insert.run(randomUUID(), u.name, u.email)
    }
  }
  return db
}

/** SQLITE_CONSTRAINT_UNIQUE */
export const isUniqueViolation = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { errcode?: number }).errcode === 2067
