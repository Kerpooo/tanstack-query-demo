/** Usuario asignado a una tarea, tal como lo devuelve la API dentro de cada tarea. */
export interface Assignee {
  id: string
  name: string
}

export interface Task {
  id: string
  title: string
  done: boolean
  createdAt: string
  assignees: Assignee[]
}

/**
 * Usuario que se puede asignar. Tiene la misma forma que el `User` del
 * microfrontend `users`, porque ambos comparten la caché `['users']`.
 */
export interface AssignableUser {
  id: string
  name: string
  email: string
}
