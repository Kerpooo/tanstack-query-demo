import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { MarkdownViewer } from './MarkdownViewer'

interface Props {
  title: string
  /** Texto markdown de la documentación (`import doc from './docs.md?raw'`). */
  doc: string
  /** La demo en vivo que ilustra lo explicado. */
  children: ReactNode
}

/** Estructura común de cada concepto: documentación arriba, demo en vivo debajo. */
export function DocPage({ title, doc, children }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>

      <Card aria-label="Documentación" className="shadow-none">
        <CardHeader>
          <CardTitle>Documentación</CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownViewer source={doc} />
        </CardContent>
      </Card>

      {/* La demo tiene otra superficie: es donde se interactúa, no donde se lee. */}
      <Card aria-label="Demo en vivo" className="bg-secondary/70 border-foreground/20 shadow-none">
        <CardHeader className="flex items-center gap-2">
          <span aria-hidden className="bg-state-fresh size-2 rounded-full" />
          <CardTitle>Demo en vivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  )
}
