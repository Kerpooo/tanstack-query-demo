import axios from 'axios'
import type { AssignableUser, Task } from '../tasks.types'

const http = axios.create({
  baseURL: process.env.API_URL ?? 'http://localhost:3000',
})

export const tasksApi = {
  list: () => http.get<Task[]>('/tasks').then((r) => r.data),
  create: (title: string) => http.post<Task>('/tasks', { title }).then((r) => r.data),
  toggle: (task: Task) =>
    http.patch<Task>(`/tasks/${task.id}`, { done: !task.done }).then((r) => r.data),
  /** Reemplaza la lista completa de usuarios asignados. */
  assign: (id: string, assigneeIds: string[]) =>
    http.patch<Task>(`/tasks/${id}`, { assigneeIds }).then((r) => r.data),
  remove: (id: string) => http.delete(`/tasks/${id}`).then(() => undefined),
  listUsers: () => http.get<AssignableUser[]>('/users').then((r) => r.data),
}
