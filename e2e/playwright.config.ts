import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

// Base SQLite propia de los e2e: no toca los datos de desarrollo (api/data).
const E2E_DB = fileURLToPath(new URL('.data/e2e.db', import.meta.url))

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  // Levanta la API y los microfrontends si no están corriendo ya.
  webServer: [
    {
      // Parte siempre de una base limpia (con los usuarios de ejemplo).
      command: `rm -f "${E2E_DB}" "${E2E_DB}-wal" "${E2E_DB}-shm"; pnpm dev`,
      cwd: '../api',
      // TURSO_DATABASE_URL vacío: evita que un api/.env apunte los e2e a la base remota.
      env: { DB_PATH: E2E_DB, TURSO_DATABASE_URL: '' },
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm dev',
      cwd: '../mfe',
      url: 'http://localhost:4000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
