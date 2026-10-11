import { createApp } from './app.js'
import { createDb } from './db.js'

/** App con una base SQLite en memoria, aislada por test. */
export async function createTestApp(options: { seed?: boolean } = {}) {
  return createApp(await createDb(':memory:', options))
}

export const jsonRequest = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})
