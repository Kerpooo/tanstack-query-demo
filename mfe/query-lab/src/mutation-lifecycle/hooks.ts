import { useMutation } from '@tanstack/react-query'
import { demoApi, sleep } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

export function useSaveDraft({ fail, onEvent }: { fail: boolean; onEvent: (event: string) => void }) {
  return useMutation({
    mutationKey: queryKeys.lifecycle,
    mutationFn: async (name: string) => {
      await sleep(800) // latencia simulada
      if (fail) await demoApi.fail() // el servidor responde 500
      return { saved: name }
    },

    // Callbacks del HOOK: se ejecutan siempre, aunque el componente se desmonte.
    // Orden: onMutate → (petición) → onSuccess o onError → onSettled.
    onMutate: (name) => onEvent(`onMutate («${name}») — antes de enviar`),
    onSuccess: (data) => onEvent(`onSuccess — guardó «${data.saved}»`),
    onError: () => onEvent('onError — el servidor falló'),
    onSettled: () => onEvent('onSettled — terminó (bien o mal)'),
  })
}
