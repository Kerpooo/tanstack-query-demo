import { useSyncExternalStore } from 'react'
import { focusManager, onlineManager, useQuery } from '@tanstack/react-query'
import { demoApi } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/query/keys'

// Contador de peticiones reales al servidor, para verlas en pantalla.
let requests = 0

export const useFocusClock = ({ refetchOnWindowFocus }: { refetchOnWindowFocus: boolean }) =>
  useQuery({
    queryKey: queryKeys.focusClock,
    queryFn: async () => ({ ...(await demoApi.clock()), request: ++requests }),
    // Para que el refetch al volver a la pestaña ocurra, los datos deben estar obsoletos.
    staleTime: 0,
    // Al volver a enfocar la ventana, se refrescan los datos obsoletos (true por defecto).
    refetchOnWindowFocus,
    // Al recuperar la conexión también se refrescan (true por defecto).
    refetchOnReconnect: true,
  })

// focusManager y onlineManager son los que avisan a TanStack Query de esos eventos.
// Aquí se simulan a mano para no tener que cambiar de pestaña ni apagar el wifi.
export const simulateFocusChange = () => {
  focusManager.setFocused(false) // la ventana pierde el foco...
  focusManager.setFocused(true) // ...y lo recupera
}

export const setOffline = (offline: boolean) => onlineManager.setOnline(!offline)

export const useIsOnline = () =>
  useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
  )

/** Devuelve ambos gestores a su comportamiento real (se llama al salir de la demo). */
export const resetManagers = () => {
  focusManager.setFocused(undefined)
  onlineManager.setOnline(true)
}
