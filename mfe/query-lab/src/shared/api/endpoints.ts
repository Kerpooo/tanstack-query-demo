import axios from 'axios'

export interface User {
  id: string
  name: string
  email: string
}

export interface Task {
  id: string
  title: string
  done: boolean
  createdAt: string
}

export interface UsersPage {
  items: User[]
  nextCursor: string | null
}

const http = axios.create({
  baseURL: process.env.API_URL ?? 'http://localhost:3000',
})

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const usersApi = {
  list: () => http.get<User[]>('/users').then((r) => r.data),
  get: (id: string) => http.get<User>(`/users/${id}`).then((r) => r.data),
  /** Página de `limit` usuarios a partir de `cursor` (offset en texto). */
  page: (limit: number, cursor = '0') =>
    http.get<UsersPage>('/users', { params: { limit, cursor } }).then((r) => r.data),
}

export const tasksApi = {
  list: () => http.get<Task[]>('/tasks').then((r) => r.data),
  create: (title: string) => http.post<Task>('/tasks', { title }).then((r) => r.data),
  toggle: (task: Task) =>
    http.patch<Task>(`/tasks/${task.id}`, { done: !task.done }).then((r) => r.data),
}

export const demoApi = {
  clock: () => http.get<{ now: string }>('/demo/clock').then((r) => r.data),
  /** `signal` permite cancelar la petición (AbortController). */
  slow: (ms: number, signal?: AbortSignal) =>
    http.get<{ waited: number }>('/demo/slow', { params: { ms }, signal }).then((r) => r.data),
  flaky: (key: string, failures: number) =>
    http.get<{ ok: boolean; attempt: number }>('/demo/flaky', { params: { key, failures } }).then((r) => r.data),
  /** Siempre responde 500: sirve para forzar el rollback optimista. */
  fail: () => http.get('/demo/fail').then((r) => r.data),
}
