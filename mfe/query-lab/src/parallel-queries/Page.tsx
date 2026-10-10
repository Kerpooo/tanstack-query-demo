import { DocPage } from '@/shared/docs/DocPage'
import doc from './docs.md?raw'
import { Demo } from './Demo'

export function Page() {
  return (
    <DocPage title="useQueries (consultas en paralelo)" doc={doc}>
      <Demo />
    </DocPage>
  )
}
