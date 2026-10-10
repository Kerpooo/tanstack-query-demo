import type { ComponentType } from 'react'
import { Page as UseQueryBasicsPage } from './use-query-basics/Page'
import { Page as CacheTimingPage } from './cache-timing/Page'
import { Page as MutationsPage } from './mutations/Page'
import { Page as OptimisticUpdatesPage } from './optimistic-updates/Page'
import { Page as DependentQueriesPage } from './dependent-queries/Page'
import { Page as SelectAndPlaceholderPage } from './select-and-placeholder/Page'
import { Page as InfiniteQueriesPage } from './infinite-queries/Page'
import { Page as ParallelQueriesPage } from './parallel-queries/Page'
import { Page as PrefetchingPage } from './prefetching/Page'
import { Page as PollingAndRetryPage } from './polling-and-retry/Page'
import { Page as SetQueryDataPage } from './set-query-data/Page'
import { Page as QueryKeysPage } from './query-keys/Page'
import { Page as WindowFocusPage } from './window-focus/Page'
import { Page as CancellationPage } from './cancellation/Page'
import { Page as InitialDataPage } from './initial-data/Page'
import { Page as SuspensePage } from './suspense/Page'
import { Page as GlobalStatusPage } from './global-status/Page'
import { Page as MutationLifecyclePage } from './mutation-lifecycle/Page'
import { Page as ImperativeApiPage } from './imperative-api/Page'
import { Page as CrossMfeCachePage } from './cross-mfe-cache/Page'
import { Page as CacheSecurityPage } from './cache-security/Page'

export interface Concept {
  /** Segmento de URL: `/query/<slug>`. */
  slug: string
  title: string
  summary: string
  Page: ComponentType
}

/** Catálogo de conceptos, en el orden en que se explican. Alimenta rutas e índice. */
export const concepts: Concept[] = [
  { slug: 'use-query-basics', title: 'useQuery: lo básico', summary: 'queryKey, queryFn y los estados de una consulta.', Page: UseQueryBasicsPage },
  { slug: 'cache-timing', title: 'Caché: staleTime y gcTime', summary: 'Cuándo los datos se consideran frescos y cuánto vive la caché.', Page: CacheTimingPage },
  { slug: 'mutations', title: 'useMutation e invalidateQueries', summary: 'Escribir en el servidor y refrescar la lista.', Page: MutationsPage },
  { slug: 'optimistic-updates', title: 'Actualizaciones optimistas', summary: 'Mostrar el cambio antes de que responda el servidor, con rollback.', Page: OptimisticUpdatesPage },
  { slug: 'dependent-queries', title: 'Consultas dependientes (enabled)', summary: 'Esperar a tener un dato antes de lanzar otra consulta.', Page: DependentQueriesPage },
  { slug: 'select-and-placeholder', title: 'select y placeholderData', summary: 'Derivar datos de la caché y paginar sin parpadeos.', Page: SelectAndPlaceholderPage },
  { slug: 'infinite-queries', title: 'useInfiniteQuery', summary: '«Cargar más» con cursor.', Page: InfiniteQueriesPage },
  { slug: 'parallel-queries', title: 'useQueries (consultas en paralelo)', summary: 'Varias consultas a la vez con un solo hook.', Page: ParallelQueriesPage },
  { slug: 'prefetching', title: 'prefetchQuery (precarga)', summary: 'Precargar datos antes de que se necesiten.', Page: PrefetchingPage },
  { slug: 'polling-and-retry', title: 'Polling (refetchInterval) y retry', summary: 'Actualizar cada N segundos y reintentar al fallar.', Page: PollingAndRetryPage },
  { slug: 'set-query-data', title: 'setQueryData', summary: 'Escribir en la caché sin volver a pedir al servidor.', Page: SetQueryDataPage },
  { slug: 'query-keys', title: 'Claves de consulta e invalidación', summary: 'Claves jerárquicas y cómo invalidar por prefijo o con exact.', Page: QueryKeysPage },
  { slug: 'window-focus', title: 'Foco de ventana y reconexión', summary: 'Refrescar al volver a la pestaña o al recuperar la conexión.', Page: WindowFocusPage },
  { slug: 'cancellation', title: 'Cancelación de peticiones (AbortSignal)', summary: 'Cancelar peticiones obsoletas con el signal de la consulta.', Page: CancellationPage },
  { slug: 'initial-data', title: 'initialData frente a placeholderData', summary: 'Mostrar datos al instante: cuándo entran en la caché y cuándo no.', Page: InitialDataPage },
  { slug: 'suspense', title: 'useSuspenseQuery y Suspense', summary: 'Dejar la carga y los errores a Suspense y a un ErrorBoundary.', Page: SuspensePage },
  { slug: 'global-status', title: 'Estado global: useIsFetching y useIsMutating', summary: 'Saber si la aplicación está ocupada desde cualquier componente.', Page: GlobalStatusPage },
  { slug: 'mutation-lifecycle', title: 'Ciclo de vida de una mutación', summary: 'onMutate, onSuccess, onError, onSettled, mutate frente a mutateAsync.', Page: MutationLifecyclePage },
  { slug: 'imperative-api', title: 'QueryClient imperativo: fetchQuery y ensureQueryData', summary: 'Usar la caché sin hooks: fetchQuery, ensureQueryData y getQueryData.', Page: ImperativeApiPage },
  { slug: 'cross-mfe-cache', title: 'Leer la caché de otro microfrontend', summary: 'Usar datos de una clave que llenó otro microfrontend, sin conocerlo.', Page: CrossMfeCachePage },
  { slug: 'cache-security', title: 'Seguridad de la caché', summary: 'Qué puede leer o alterar cualquier código de la página y cómo mitigarlo.', Page: CacheSecurityPage },
]
