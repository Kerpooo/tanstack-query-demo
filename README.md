# TanStack Query + Module Federation

Prueba de concepto de **microfrontends con Module Federation** que comparten un único **TanStack Query (React Query)**, con una API REST en Hono sobre SQLite (Turso/libSQL) y una documentación interactiva de TanStack Query con 21 conceptos explicados y demos en vivo.

**Demo:** https://tanstack-query-demo-shell.kevvek.workers.dev

## ¿Qué demuestra?

- **Microfrontends independientes** (`tasks`, `users`, `query-lab`) que se compilan y despliegan por separado y un **shell** que los carga en tiempo de ejecución.
- **Una sola caché para todos**: React, React Router y TanStack Query se comparten como `singleton`, así que los remotes usan el mismo `QueryClient` del shell. Lo que un microfrontend guarda en caché lo puede leer otro (por ejemplo, la lista de usuarios).
- **Documentación interactiva** (`query-lab`): cada concepto tiene su explicación con código comentado arriba y una demo funcionando debajo, conectada a la API real.

## Arquitectura

```
                    ┌──────────────── shell (host, :4000) ────────────────┐
                    │  BrowserRouter · QueryClient único · Devtools        │
                    │                                                      │
 remoteEntry.js ──▶ │  /tasks/*  ──▶  tasks      (:4001)                   │
 remoteEntry.js ──▶ │  /users/*  ──▶  users      (:4002)                   │
 remoteEntry.js ──▶ │  /query/*  ──▶  query-lab  (:4003)                   │
                    └──────────────────────────┬───────────────────────────┘
                                               │ axios (API_URL)
                                               ▼
                                 API Hono (:3000) ──▶ SQLite (libSQL / Turso)
```

El repositorio tiene **tres proyectos independientes**, cada uno con su propio `package.json`, lockfile y `node_modules`:

| Carpeta | Qué es | Tecnologías |
|---|---|---|
| [`api/`](api) | API REST: `/tasks`, `/users` (con paginación opcional) y `/demo/*` para las demos | Hono, Zod, `@libsql/client` |
| [`mfe/`](mfe) | Workspace de pnpm con `shell`, `tasks`, `users` y `query-lab` | React 19, webpack 5 + Module Federation, TanStack Query 5, React Router, shadcn/ui, Tailwind 4 |
| [`e2e/`](e2e) | Tests end-to-end | Playwright (Chrome) |

Cada microfrontend organiza `src/` por dominio (*screaming architecture*): `users/`, `tasks/`… y dentro, `api/`, `hooks/`, `components/` y `pages/`. Lo transversal vive en `shared/`.

## Requisitos

- **Node.js** 22 o superior (probado con 26)
- **pnpm** (la versión exacta está fijada en `packageManager`). Usa `pnpm exec` / `pnpm dlx` en lugar de `npx`.
- **Google Chrome**, solo para los tests e2e

## Puesta en marcha local

```bash
cd api && pnpm install
cd ../mfe && pnpm install
```

Levanta la API (puerto 3000; crea `api/data/app.db` con usuarios de ejemplo):

```bash
cd api && pnpm dev
```

En otra terminal, levanta los cuatro microfrontends:

```bash
cd mfe && pnpm dev
```

Abre **http://localhost:4000**. Cada remote también funciona solo (`:4001`, `:4002`, `:4003`).

> `pnpm install` puede mostrar `ERR_PNPM_IGNORED_BUILDS` por `esbuild`; es inofensivo.

### Variables de entorno

| Dónde | Archivo | Variables |
|---|---|---|
| API | `api/.env` (no se versiona) | `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` para usar Turso; si no existen, usa `DB_PATH` (por defecto `data/app.db`). `PORT` cambia el puerto. |
| Microfrontends | `mfe/.env.development` / `mfe/.env.production` | `API_URL`, `TASKS_URL`, `USERS_URL`, `QUERY_LAB_URL` |

`pnpm dev` usa `.env.development` y `pnpm build` usa `.env.production`. Las variables definidas en el entorno tienen prioridad sobre los archivos, y el build falla si falta alguna. Las URLs se fijan al compilar: si cambias una, vuelve a compilar el paquete que la usa.

## Tests

```bash
cd api && pnpm test
```

```bash
cd mfe && pnpm test
```

```bash
cd e2e && pnpm test
```

- **Unitarios** (Vitest): la API usa una base `:memory:` por test; los microfrontends usan jsdom + Testing Library con la capa `api` simulada.
- **E2E** (Playwright con Chrome): levantan la API y los microfrontends si no están corriendo, con una base propia (`e2e/.data/e2e.db`). Si ya tienes una API corriendo, se reutiliza; ciérrala antes para una ejecución limpia.
- **Tipos**: webpack no verifica tipos al compilar; usa `pnpm typecheck` en `api/` y `mfe/`.

## Documentación interactiva de TanStack Query

En `/query` (microfrontend `query-lab`) hay una página por concepto, en este orden:

1. useQuery: lo básico
2. Caché: staleTime y gcTime
3. useMutation e invalidateQueries
4. Actualizaciones optimistas
5. Consultas dependientes (enabled)
6. select y placeholderData
7. useInfiniteQuery
8. useQueries (consultas en paralelo)
9. prefetchQuery (precarga)
10. Polling (refetchInterval) y retry
11. setQueryData
12. Claves de consulta e invalidación
13. Foco de ventana y reconexión
14. Cancelación de peticiones (AbortSignal)
15. initialData frente a placeholderData
16. useSuspenseQuery y Suspense
17. Estado global: useIsFetching y useIsMutating
18. Ciclo de vida de una mutación
19. QueryClient imperativo: fetchQuery y ensureQueryData
20. Leer la caché de otro microfrontend
21. Seguridad de la caché

Cada concepto vive en `mfe/query-lab/src/<concepto>/` con `docs.md` (la explicación), `hooks.ts` (el código real), `Demo.tsx` y `Page.tsx`. Las React Query Devtools están montadas en el shell para ver la caché mientras se explica.

## Despliegue (Cloudflare Workers)

Todo se publica en Cloudflare Workers con wrangler, que ya está instalado como dependencia de desarrollo:

| Proyecto | URL |
|---|---|
| shell (la app) | https://tanstack-query-demo-shell.kevvek.workers.dev |
| tasks | https://tanstack-query-demo-tasks.kevvek.workers.dev |
| users | https://tanstack-query-demo-users.kevvek.workers.dev |
| query-lab | https://tanstack-query-demo-query-lab.kevvek.workers.dev |
| API | https://tanstack-query-demo-api.kevvek.workers.dev |

La primera vez, inicia sesión y carga los secretos de Turso de la API:

```bash
cd api && pnpm exec wrangler login
```

```bash
cd api && pnpm exec wrangler secret bulk .env
```

Para desplegar después de cada cambio:

```bash
cd api && pnpm run deploy
```

```bash
cd mfe && pnpm run deploy
```

- La API corre como Worker con [`api/src/worker.ts`](api/src/worker.ts); en local se sigue usando [`api/src/index.ts`](api/src/index.ts) con Node.
- Los microfrontends son Workers de solo archivos estáticos. `not_found_handling: "single-page-application"` en cada `wrangler.jsonc` hace que funcionen los enlaces directos como `/users/1/edit`.
- En producción la API necesita Turso: en Workers no hay un disco donde guardar un archivo SQLite.
- La demo `/demo/flaky` guarda su contador en memoria; en Workers cada instancia tiene el suyo, así que puede comportarse de forma irregular.

## Agregar un microfrontend nuevo

1. Crea el paquete en `mfe/` y agrégalo a `pnpm-workspace.yaml`.
2. Expón su componente raíz con `ModuleFederationPlugin` y declara los mismos módulos `shared` que el resto.
3. En el shell: agrega la entrada en `remotes` (`shell/webpack.config.js`), su URL en `mfe/env.js` y en los `.env.*`, la declaración de tipos en `remotes/remotes.d.ts`, el `lazy` en `remotes/loaders.ts`, la `Route` en `app/App.tsx` y el enlace en `MainNav`.
4. Agrega su `wrangler.jsonc` y el script `deploy` para publicarlo.
