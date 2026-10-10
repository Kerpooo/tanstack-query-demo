import { lazy } from 'react'

// Cada remote se carga bajo demanda desde su remoteEntry (ver webpack.config.js).
export const TasksApp = lazy(() => import('tasks/TasksApp'))
export const UsersApp = lazy(() => import('users/UsersApp'))
export const QueryLabApp = lazy(() => import('queryLab/QueryLabApp'))
