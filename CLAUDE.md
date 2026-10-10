# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visión general

POC de microfrontends con Module Federation y React Query. Son **tres proyectos independientes** (cada uno con su propio lockfile y `node_modules`):

- `api/` — API REST con Hono y persistencia en **SQLite** (sin autenticación).
- `mfe/` — workspace de pnpm con cuatro paquetes: `shell` (host) y los remotes `tasks`, `users` y `query-lab` (documentación interactiva de TanStack Query).
- `e2e/` — tests end-to-end con Playwright (Chrome).

Se usa **pnpm** (nunca `npx`: el `package.json` fija pnpm vía `devEngines`/`packageManager` y `npx` falla con `EBADDEVENGINES`). TypeScript es obligatorio en todo.

## Requisitos permanentes

Aplican a todo el ciclo de vida del proyecto: al agregar o cambiar funcionalidad hay que actualizar también sus tests y seguir estas convenciones.

- **Tests unitarios con Vitest** en `api/` y en los paquetes de `mfe/`.
- **Tests e2e con Playwright usando Chrome**, en la carpeta `e2e/`, separada de `api/` y `mfe/`.
- **UI con componentes de shadcn** en los microfrontends, no HTML plano.
- **Screaming architecture en cada MFE**: las carpetas de primer nivel de `src/` nombran el dominio (`users/`, `tasks/`), no el tipo técnico. Ver "Microfrontends".
- **Documentación interactiva de TanStack Query** en `mfe/query-lab`: cada concepto nuevo lleva su `docs.md` (markdown con código comentado, en español neutro) **arriba** y la demo funcionando **debajo**.
- **Base de datos SQLite** (`node:sqlite`, sin dependencias nativas).
- Todo con **pnpm** (ejecutar herramientas con `pnpm exec` / `pnpm dlx`) y en **TypeScript**.

Pendiente: los tests e2e de **navegador** no se han ejecutado nunca (Chrome no está instalado en este WSL; instalarlo requiere sudo y contraseña interactiva): `cd e2e && pnpm exec playwright install --with-deps chrome`. Los e2e de API sí pasan.

## Comandos

Todo se ejecuta desde la carpeta de cada proyecto; no hay linter configurado.

```bash
# API (puerto 3000, o PORT=...)
cd api && pnpm dev          # tsx watch; SQLite en api/data/app.db (o DB_PATH=...)
pnpm typecheck              # tsc --noEmit
pnpm test                   # vitest run (pnpm exec vitest run src/users.test.ts para un archivo)
pnpm build && pnpm start    # compila a dist/ (sin tests) y ejecuta

# Microfrontends (desde mfe/)
cd mfe && pnpm dev          # levanta shell + tasks + users en paralelo
pnpm build                  # webpack production en los tres paquetes
pnpm typecheck              # tsc --noEmit en los tres
pnpm test                   # vitest en los tres paquetes (jsdom + Testing Library)
pnpm --filter users dev     # un solo paquete
pnpm --filter users exec vitest run src/users/UsersApp.test.tsx   # un solo archivo
pnpm --filter query-lab test    # una página por concepto + chequeo de los docs.md

# E2E (desde e2e/, Playwright con Chrome)
cd e2e && pnpm test         # levanta api y mfe solos si no están corriendo
pnpm exec playwright test tests/api.spec.ts   # solo los de API (no necesitan navegador)
```

Puertos: API 3000, shell 4000, tasks 4001, users 4002, query-lab 4003. Para ver la app hay que levantar la API y `mfe`, y abrir `http://localhost:4000`.

`pnpm install` muestra `ERR_PNPM_IGNORED_BUILDS` por `esbuild` (scripts de build bloqueados por pnpm). Es inofensivo; `pnpm approve-builds` lo silencia.

## Arquitectura

### API (`api/src`)
- `db.ts`: `createDb(path, { seed })` abre SQLite con `node:sqlite` (`DatabaseSync`), crea las tablas `tasks` y `users` si no existen y, con `seed`, inserta tres usuarios si la tabla está vacía. `:memory:` da una base efímera (tests). También exporta `isUniqueViolation` (errcode 2067).
- `tasks.ts` y `users.ts`: cada uno contiene su repositorio (SQL) y una fábrica de rutas Hono (`tasksRoutes(db)`, `usersRoutes(db)`). Los correos de usuario son `UNIQUE`: un duplicado devuelve **409**.
- `app.ts`: `createApp(db)` ensambla middleware (logger, CORS abierto), rutas, `notFound` y `onError`. No hay singleton: cada test crea su propia app con `createTestApp()` de `test-utils.ts`.
- `index.ts` abre `DB_PATH` (por defecto `data/app.db`, ignorado por git) y arranca el servidor.
- Endpoints: `/tasks` (CRUD) y `/users` (CRUD con `PATCH` parcial). `GET /users` devuelve el arreglo completo, pero con `?limit=&cursor=` (paginación **opt-in**) devuelve `{ items, nextCursor }`; la semilla crea 30 usuarios (`SEED_USER_COUNT`).
- `demo.ts` (`/demo/*`) solo existe para las demos de `query-lab`: `/clock` (hora), `/slow?ms=` (retardo), `/flaky?key=&failures=` (falla N veces y reinicia) y `/fail` (siempre 500). Validación con Zod vía `@hono/zod-validator`; los errores devuelven `{ error: string }`.
- ESM con `module: NodeNext`: los imports relativos llevan extensión `.js` (`./db.js`) aunque el archivo sea `.ts`.

### Microfrontends (`mfe/`)
- **Screaming architecture**: cada paquete organiza `src/` por dominio, y dentro de cada dominio por rol técnico:
  ```
  users/src/
    users/            # el dominio
      api/  hooks/  components/  pages/  paths.ts  users.types.ts  UsersApp.tsx
    shared/           # solo lo transversal: ui/ (shadcn), lib/, query/
    bootstrap.tsx  index.ts  styles.css
  ```
  `tasks` sigue el mismo patrón (`tasks/`); el `shell` usa `app/`, `navigation/`, `remotes/` y `shared/`. Los tests van junto al código que prueban.
- **Rutas**: el shell es dueño del `BrowserRouter` y monta cada remote bajo un prefijo (`/tasks/*`, `/users/*`). Cada remote declara sus rutas relativas en su `*App.tsx` y usa rutas **absolutas** desde `paths.ts` para enlazar; por eso el prefijo debe coincidir entre `shell/src/app/App.tsx` y `paths.ts` del remote. `users` tiene tres páginas: listado (`/users`), crear (`/users/new`) y editar (`/users/:id/edit`); eliminar es un `AlertDialog` en el listado.
- **Shell** (`shell/webpack.config.js`) declara `remotes` (`tasks@http://localhost:4001/remoteEntry.js`, `users@http://localhost:4002/...`, `queryLab@http://localhost:4003/...`; el nombre del contenedor debe ser un identificador válido, por eso `queryLab` y no `query-lab`), los carga con `lazy` en `remotes/loaders.ts`, los envuelve con `RemoteBoundary` (Suspense + error boundary) y declara sus tipos en `remotes/remotes.d.ts`. Un remote nuevo requiere: carpeta en `pnpm-workspace.yaml`, entrada en `remotes`, declaración de módulo, `lazy` en `loaders.ts`, `Route` en `App.tsx` y enlace en `MainNav`.
- **Remotes** exponen su `*App` (`./TasksApp`, `./UsersApp`) por `remoteEntry.js` y hablan con la API con axios (`<dominio>/api/*.api.ts`). La URL base sale de `process.env.API_URL` (inyectada con `DefinePlugin`; webpack 5 no define `process` en el navegador), por defecto `http://localhost:3000`.
- **Bootstrap asíncrono**: `src/index.ts` solo hace `import('./bootstrap')`; es requisito de Module Federation. En los remotes, `bootstrap.tsx` solo corre en modo standalone (`:4001`/`:4002`) y crea su propio router y `QueryClientProvider`; dentro del shell se usan los del shell.
- **Módulos compartidos** (`singleton` en los tres `webpack.config.js`): `react`, `react-dom`, `react-router` y `@tanstack/react-query`. Si se agrega una dependencia compartida, declararla en `shared` de todos los paquetes que la usen. El `QueryClient` único vive en `shell/src/shared/query/queryClient.ts`.
- **Deep links**: los `devServer` usan `historyApiFallback` y `HtmlWebpackPlugin` con `publicPath: '/'` (con `output.publicPath: 'auto'` los scripts se romperían en rutas como `/users/1/edit`).
- **shadcn**: estilo new-york, Tailwind 4, paquete `radix-ui`; cada paquete tiene su `components.json`, alias `@/` y `src/styles.css`. Se agregan con `pnpm dlx shadcn@latest add <componente>` dentro del paquete, pero la CLI genera `import { cn } from "cn"` con los alias actuales **y además instala el paquete npm `cn` (basura)**: hay que corregir el import a `@/shared/lib/utils` y ejecutar `pnpm remove cn` en el paquete. `CardTitle` es un `div`, no un heading (afecta a los selectores de tests).
- **Estilos**: `styles.css` se importa desde el `*App.tsx` expuesto, no desde `bootstrap.tsx` (dentro del shell `bootstrap` no se ejecuta). Se inyectan con `style-loader`.
- **Tests de mfe**: la capa `api` se mockea con `vi.mock`; `src/test/renderWithProviders.tsx` monta `MemoryRouter` + `QueryClientProvider`. El shell sustituye los remotes (`tasks/TasksApp`, `users/UsersApp`) por stubs con alias en `vitest.config.mts`.
- Webpack usa `ts-loader` con `transpileOnly: true`, así que los errores de tipos no rompen el build: hay que correr `pnpm typecheck` aparte. TypeScript está fijado en 5.x en `mfe/` y `e2e/` (por compatibilidad con `ts-loader`); `api/` usa TS 7.

### `query-lab` (documentación interactiva de TanStack Query)
- Una carpeta por concepto (`use-query-basics/`, `cache-timing/`, `mutations/`, `optimistic-updates/`, `dependent-queries/`, `select-and-placeholder/`, `infinite-queries/`, `parallel-queries/`, `prefetching/`, `polling-and-retry/`, `set-query-data/`, `query-keys/`, `window-focus/`, `cancellation/`, `initial-data/`, `suspense/`, `global-status/`, `mutation-lifecycle/`, `imperative-api/`, `cross-mfe-cache/`, `cache-security/`), cada una con `docs.md`, `hooks.ts`, `Demo.tsx` y `Page.tsx`. `src/concepts.ts` es el catálogo (orden, título, `Page`) que alimenta las rutas `/query/<slug>` y el índice lateral de `QueryLabApp.tsx`.
- `shared/docs/DocPage.tsx` da la estructura común: tarjeta «Documentación» (markdown renderizado) **arriba** y tarjeta «Demo en vivo» **debajo**. `MarkdownViewer` usa `react-markdown` + `remark-gfm` + `rehype-highlight` con solo TypeScript/JSON/Bash registrados.
- Los `.md` se importan con `import doc from './docs.md?raw'`: webpack los entrega como texto (regla `resourceQuery: /raw/` + `asset/source`), Vite/Vitest lo soportan de forma nativa, y `env.d.ts` declara `*.md?raw`.
- `shared/query/keys.ts` centraliza las claves de caché. `['users']` es la misma que usa el mfe `users` (caché compartida por el `QueryClient` único del shell); el resto lleva prefijo `'lab'`.
- El código que se muestra en cada `docs.md` se copia a mano de `hooks.ts`: si se cambia el hook, hay que actualizar el markdown. `src/docs.test.ts` exige por concepto: `### ¿Qué es?`, `### Qué observar en la demo`, al menos un bloque ```ts con 3+ líneas de comentario y ausencia de voseo.
- Los tests mockean `@/shared/api/endpoints` con `src/test/mockEndpoints.ts` (el `sleep` de las demos se vuelve inmediato) y comparten `src/test/helpers.tsx` (`deferred`, `expectDocsAboveDemo`, `demo()`). Las consultas deben acotarse con `demo()`: la documentación repite palabras de la demo.
- `ReactQueryDevtools` está montado en el shell (`app/App.tsx`) para ver la caché mientras se explica.
- `removeQueries` no avisa a los componentes que ya observan esa consulta; las demos usan `resetQueries` cuando hay que vaciar la caché de forma visible.

### E2E (`e2e/`)
- `playwright.config.ts` define un único proyecto `chrome` (`channel: 'chrome'`) y levanta la API y `mfe` con `webServer` (reutiliza servidores ya corriendo si no hay `CI`).
- La API de los e2e usa su **propia** base `e2e/.data/e2e.db`, que se borra al arrancar el servidor; no toca `api/data/app.db`. Si ya hay una API corriendo, Playwright la reutiliza y la base de los e2e **no** se usa: cerrarla antes para una ejecución limpia.
- `tests/query-lab.spec.ts` recorre los 21 conceptos (documentación arriba, demo debajo) y ejecuta las demos clave.
- Los specs de navegador crean sus propios datos con nombres/correos únicos; los usuarios de ejemplo (Ana, Luis, Marta) se asumen presentes y sin modificar.

## Diseño visual

- **Tema por tokens** en el `src/styles.css` de cada paquete (shell, tasks, users, query-lab; se mantienen iguales): base fría clara u oscura según `prefers-color-scheme`, y cuatro colores de estado de consulta (`--state-fresh`, `--state-fetching`, `--state-stale`, `--state-idle`) que usan los mismos significados que las Devtools de TanStack Query. Úselos como `bg-state-fresh`, `text-state-fetching`, etc.
- **Tipografía autoalojada** con `@fontsource-variable` (Hanken Grotesk y Spline Sans Mono): el shell las importa en `App.tsx` y cada remote en su `bootstrap.tsx` (solo standalone). Las reglas `asset/resource` para `.woff2` están en cada `webpack.config.js`.
- `StatusBadges` colorea cada indicador según su significado; la demo de cada concepto tiene otra superficie que la documentación; el shell muestra una línea fina arriba (`FetchProgress`) mientras cualquier consulta pide datos.
- Los colores del plugin de tipografía (`.doc-prose`) y del resaltado de código (`.hljs-*`) están enlazados al tema en `query-lab/src/styles.css`: no usar temas de highlight.js con fondo propio.
- El índice de conceptos es una lista plana (decisión del usuario, no agrupar); en móvil se vuelve una fila con desplazamiento horizontal.
