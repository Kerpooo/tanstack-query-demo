import type { ReactNode } from 'react'
import { FetchProgress } from './FetchProgress'
import { MainNav } from './MainNav'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <FetchProgress />
      <header className="bg-card border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 px-6">
          <h1 className="py-4 text-lg font-bold tracking-tight">poc-rq</h1>
          <MainNav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
