import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { concepts } from './concepts'

// Se leen los .md desde disco (el catálogo no expone el texto, solo las páginas).
// (en jsdom `URL` es otra clase y node:fs la rechaza: por eso se usa una ruta de texto)
const docPath = (slug: string) => join(import.meta.dirname, slug, 'docs.md')
const docs = Object.fromEntries(
  concepts.filter((c) => existsSync(docPath(c.slug))).map((c) => [`./${c.slug}/docs.md`, readFileSync(docPath(c.slug), 'utf8')]),
)

describe('catálogo de conceptos', () => {
  it('tiene slugs únicos', () => {
    const slugs = concepts.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('cada concepto tiene su docs.md', () => {
    for (const { slug } of concepts) {
      expect(docs[`./${slug}/docs.md`], `falta ${slug}/docs.md`).toBeTypeOf('string')
    }
  })
})

describe.each(concepts.map((c) => [c.slug, docs[`./${c.slug}/docs.md`] ?? ''] as const))('docs de %s', (_slug, md) => {
  it('explica el concepto e incluye código comentado', () => {
    expect(md.length).toBeGreaterThan(500)
    expect(md).toMatch(/### ¿Qué es\?/)
    const code = md.match(/```ts\n([\s\S]*?)```/g) ?? []
    expect(code.length).toBeGreaterThan(0)
    // Código "con comentarios claros": al menos varias líneas de comentario.
    const comments = code.join('\n').split('\n').filter((l) => l.trim().startsWith('//'))
    expect(comments.length).toBeGreaterThanOrEqual(3)
  })

  it('indica qué observar en la demo', () => {
    expect(md).toMatch(/### Qué observar en la demo/)
  })

  it('usa español neutro (sin voseo)', () => {
    expect(md).not.toMatch(/\b(vos|tenés|podés|hacé|mirá|elegí|pulsá|escribí|fijate|andá|cliqueá)\b/i)
  })
})
