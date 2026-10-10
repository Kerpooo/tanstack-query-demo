import '../styles.css'
import { Navigate, Route, Routes } from 'react-router'
import { TasksPage } from './pages/TasksPage'
import { tasksPaths } from './paths'

/** Módulo expuesto por Module Federation: se monta bajo `/tasks/*`. */
export default function TasksApp() {
  return (
    <Routes>
      <Route index element={<TasksPage />} />
      <Route path="*" element={<Navigate to={tasksPaths.list} replace />} />
    </Routes>
  )
}
