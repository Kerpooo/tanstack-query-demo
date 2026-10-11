import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createDb, SEED_USER_COUNT } from './db.js'
import { usersRepository } from './users.js'

describe('createDb', () => {
  it('no duplica la semilla al reabrir una base existente', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'poc-rq-'))
    try {
      const path = join(dir, 'sub', 'app.db')
      const first = await createDb(path, { seed: true })
      first.close()
      const second = await createDb(path, { seed: true })
      expect(await usersRepository(second).list()).toHaveLength(SEED_USER_COUNT)
      second.close()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
