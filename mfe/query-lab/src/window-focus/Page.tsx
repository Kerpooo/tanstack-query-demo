import { DocPage } from '@/shared/docs/DocPage'
import doc from './docs.md?raw'
import { Demo } from './Demo'

export function Page() {
  return (
    <DocPage title="Foco de ventana y reconexión" doc={doc}>
      <Demo />
    </DocPage>
  )
}
