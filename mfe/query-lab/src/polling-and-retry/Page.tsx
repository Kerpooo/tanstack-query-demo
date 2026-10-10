import { DocPage } from '@/shared/docs/DocPage'
import doc from './docs.md?raw'
import { Demo } from './Demo'

export function Page() {
  return (
    <DocPage title="Polling (refetchInterval) y retry" doc={doc}>
      <Demo />
    </DocPage>
  )
}
