/** Rutas del microfrontend; el shell lo monta bajo `/users/*`. */
export const usersPaths = {
  list: '/users',
  create: '/users/new',
  edit: (id: string) => `/users/${id}/edit`,
} as const
