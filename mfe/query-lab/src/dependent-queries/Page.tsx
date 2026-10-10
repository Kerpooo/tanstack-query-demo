import { DocPage } from '@/shared/docs/DocPage'
import doc from './docs.md?raw'
import { Demo } from './Demo'

export function Page() {
  return (
    <DocPage title="Consultas dependientes (enabled)" doc={doc}>
      <Demo />
    </DocPage>
  )
}
