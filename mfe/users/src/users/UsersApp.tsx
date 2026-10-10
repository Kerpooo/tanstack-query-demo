import '../styles.css'
import { Navigate, Route, Routes } from 'react-router'
import { UserCreatePage } from './pages/UserCreatePage'
import { UserEditPage } from './pages/UserEditPage'
import { UsersListPage } from './pages/UsersListPage'
import { usersPaths } from './paths'

/** Módulo expuesto por Module Federation: se monta bajo `/users/*`. */
export default function UsersApp() {
  return (
    <Routes>
      <Route index element={<UsersListPage />} />
      <Route path="new" element={<UserCreatePage />} />
      <Route path=":id/edit" element={<UserEditPage />} />
      <Route path="*" element={<Navigate to={usersPaths.list} replace />} />
    </Routes>
  )
}
