import { useCallback, useState } from 'react'

/** Registro de eventos de las demos (conserva los últimos `max`). */
export function useEventLog(max = 12) {
  const [events, setEvents] = useState<string[]>([])
  const push = useCallback((event: string) => setEvents((old) => [...old.slice(-(max - 1)), event]), [max])
  const clear = useCallback(() => setEvents([]), [])
  return { events, push, clear }
}
