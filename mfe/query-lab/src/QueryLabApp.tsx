import './styles.css'
import { NavLink, Navigate, Route, Routes } from 'react-router'
import { concepts } from './concepts'
import { queryLabPaths } from './paths'
import { cn } from '@/shared/lib/utils'

/** Módulo expuesto por Module Federation: se monta bajo `/query/*`. */
export default function QueryLabApp() {
  const first = concepts[0]!

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[15rem_minmax(0,1fr)]">
      <nav
        aria-label="Conceptos de TanStack Query"
        className="md:sticky md:top-6 md:max-h-[calc(100vh-3rem)] md:self-start md:overflow-y-auto"
      >
        {/* En móvil el índice es una fila con desplazamiento horizontal, para no empujar el contenido. */}
        <ol className="flex overflow-x-auto md:block md:overflow-visible">
          {concepts.map((concept, index) => (
            <li key={concept.slug}>
              <NavLink
                to={queryLabPaths.concept(concept.slug)}
                className={({ isActive }) =>
                  cn(
                    'text-muted-foreground hover:text-foreground hover:bg-accent/60 focus-visible:ring-ring/50 flex items-baseline gap-2 border-b-2 border-transparent px-3 py-1.5 text-sm whitespace-nowrap outline-none focus-visible:ring-[3px] md:border-b-0 md:border-l-2 md:whitespace-normal',
                    isActive && 'border-state-fetching text-foreground bg-accent font-semibold',
                  )
                }
              >
                <span className="w-5 shrink-0 text-right font-mono text-xs tabular-nums">{index + 1}</span>
                <span>{concept.title}</span>
              </NavLink>
            </li>
          ))}
        </ol>
      </nav>

      <section className="min-w-0">
        <Routes>
          <Route index element={<Navigate to={queryLabPaths.concept(first.slug)} replace />} />
          {concepts.map(({ slug, Page }) => (
            <Route key={slug} path={slug} element={<Page />} />
          ))}
          <Route path="*" element={<Navigate to={queryLabPaths.base} replace />} />
        </Routes>
      </section>
    </div>
  )
}
