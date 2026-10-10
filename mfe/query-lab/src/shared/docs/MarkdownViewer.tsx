import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

// Solo se registran los lenguajes que usan los docs: así el bundle no carga los ~37 por defecto.
const highlightOptions = {
  languages: { typescript, json, bash },
  plainText: ['text'], // ```text se muestra sin colores
  ignoreMissing: true, // un lenguaje no registrado no rompe la página
}

/** Renderiza un texto markdown (con tablas, listas y bloques de código resaltados). */
export function MarkdownViewer({ source }: { source: string }) {
  return (
    <article className="doc-prose prose prose-headings:tracking-tight prose-h3:text-base prose-h3:font-semibold prose-code:before:content-none prose-code:after:content-none max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, highlightOptions]]}>
        {source}
      </ReactMarkdown>
    </article>
  )
}
