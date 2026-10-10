/** Prefijo bajo el que el shell monta este microfrontend (`/query/*`). */
export const queryLabPaths = {
  base: '/query',
  concept: (slug: string) => `/query/${slug}`,
} as const
