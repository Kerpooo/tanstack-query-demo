/**
 * Claves de caché de todas las demos, en un solo lugar.
 *
 * - `['users']` es la MISMA clave que usa el microfrontend `users`: como el
 *   QueryClient es único (lo crea el shell), ambos comparten esa caché.
 * - Las demás llevan el prefijo `'lab'` para no mezclarse con otras pantallas.
 */
export const queryKeys = {
  users: ['users'] as const,
  user: (id: string) => ['lab', 'user', id] as const,
  userPrefetch: (id: string) => ['lab', 'user-prefetch', id] as const,
  usersPage: (page: number) => ['lab', 'users-page', page] as const,
  usersInfinite: ['lab', 'users-infinite'] as const,
  tasks: ['lab', 'tasks'] as const,
  clock: ['lab', 'clock'] as const,
  clockPolling: ['lab', 'clock-polling'] as const,
  tasksCounted: ['lab', 'tasks-counted'] as const,
  slow: (ms: number) => ['lab', 'slow', ms] as const,
  flaky: (nonce: number, retry: number) => ['lab', 'flaky', nonce, retry] as const,
  scopedAll: ['lab', 'keys'] as const,
  scopedGroup: (group: string) => ['lab', 'keys', group] as const,
  scoped: (group: string, id: string) => ['lab', 'keys', group, id] as const,
  focusClock: ['lab', 'focus-clock'] as const,
  cancellable: (ms: number) => ['lab', 'cancel', ms] as const,
  userInitial: (id: string) => ['lab', 'user-initial', id] as const,
  userPlaceholder: (id: string) => ['lab', 'user-placeholder', id] as const,
  suspense: (nonce: number, fail: boolean) => ['lab', 'suspense', nonce, fail] as const,
  global: ['lab', 'global'] as const,
  globalSlow: (ms: number) => ['lab', 'global', 'slow', ms] as const,
  globalSave: ['lab', 'global-save'] as const,
  lifecycle: ['lab', 'lifecycle'] as const,
  imperativeClock: ['lab', 'imperative-clock'] as const,
  securitySession: ['lab', 'security', 'session'] as const,
}
