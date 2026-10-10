import path from 'node:path'
import { defineConfig } from 'vitest/config'

const src = path.resolve(import.meta.dirname, 'src')

export default defineConfig({
  resolve: {
    alias: {
      '@': src,
      // Los remotes no existen en tiempo de test: se sustituyen por stubs.
      'tasks/TasksApp': path.join(src, 'test/TasksStub.tsx'),
      'users/UsersApp': path.join(src, 'test/UsersStub.tsx'),
      'queryLab/QueryLabApp': path.join(src, 'test/QueryLabStub.tsx'),
    },
  },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], css: false },
})
