import axios from 'axios'
import type { User, UserInput } from '../users.types'

const http = axios.create({
  baseURL: process.env.API_URL ?? 'http://localhost:3000',
})

export const usersApi = {
  list: () => http.get<User[]>('/users').then((r) => r.data),
  get: (id: string) => http.get<User>(`/users/${id}`).then((r) => r.data),
  create: (input: UserInput) => http.post<User>('/users', input).then((r) => r.data),
  update: (id: string, input: UserInput) => http.patch<User>(`/users/${id}`, input).then((r) => r.data),
  remove: (id: string) => http.delete(`/users/${id}`).then(() => undefined),
}
