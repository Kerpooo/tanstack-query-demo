import { vi } from 'vitest'

/**
 * Sustituto de `@/shared/api/endpoints` para los tests.
 * Uso: vi.mock('@/shared/api/endpoints', async () => (await import('@/test/mockEndpoints')).endpointsMock)
 */
export const endpointsMock = {
  // Sin esperas reales: los demos simulan latencia con sleep().
  sleep: () => Promise.resolve(),
  usersApi: { list: vi.fn(), get: vi.fn(), page: vi.fn() },
  tasksApi: { list: vi.fn(), create: vi.fn(), toggle: vi.fn() },
  demoApi: { clock: vi.fn(), slow: vi.fn(), flaky: vi.fn(), fail: vi.fn() },
}
