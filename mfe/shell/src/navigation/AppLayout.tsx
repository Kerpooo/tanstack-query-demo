import type { ReactNode } from 'react'
import { FetchProgress } from './FetchProgress'
import { MainNav } from './MainNav'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <a
        href="#contenido"
        className="bg-background text-foreground focus-visible:ring-ring/50 sr-only rounded-md border px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus-visible:ring-[3px]"
      >
        Saltar al contenido
      </a>
      <FetchProgress />
      <header className="bg-card border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 px-4 sm:px-6">
          <h1 className="py-4 text-lg font-bold tracking-tight">poc-rq</h1>
          <MainNav />
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 outline-none sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
