import { DocPage } from '@/shared/docs/DocPage'
import doc from './docs.md?raw'
import { Demo } from './Demo'

export function Page() {
  return (
    <DocPage title="Ciclo de vida de una mutación" doc={doc}>
      <Demo />
    </DocPage>
  )
}
