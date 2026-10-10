### ¿Qué es?

Dos opciones para datos que cambian o conexiones poco fiables.

**`refetchInterval`** vuelve a pedir los datos cada cierto tiempo (*polling*). Útil para tableros, estados de procesos o colas. Con `false` se apaga.

**`retry`** controla cuántas veces se **reintenta** automáticamente una consulta que falló antes de marcarla como `error`. Por defecto son 3 reintentos con espera exponencial.

### Código

```ts
// --- Polling ------------------------------------------------------------
export const useClockPolling = (intervalMs: number | false) =>
  useQuery({
    queryKey: ['lab', 'clock-polling'],
    queryFn: demoApi.clock,

    // Número = vuelve a pedir cada N ms. false = sin polling.
    // Se puede cambiar en cualquier momento (aquí, con un botón).
    refetchInterval: intervalMs,

    // Por defecto el polling se pausa si la pestaña está en segundo plano:
    // refetchIntervalInBackground: true  lo mantiene.
  })

// --- Reintentos ---------------------------------------------------------
export const useFlaky = ({ nonce, retry }: { nonce: number; retry: number }) =>
  useQuery({
    queryKey: ['lab', 'flaky', nonce, retry],

    // El servidor está programado para fallar las 2 primeras veces.
    queryFn: () => demoApi.flaky(`lab-${nonce}`, 2),

    enabled: nonce > 0,

    retry,          // 0 = no reintentar; 3 = hasta 3 reintentos tras el primer fallo
    retryDelay: 500, // espera entre intentos (puede ser una función del n.º de intento)
  })

// Mientras se reintenta:  failureCount sube y failureReason tiene el último error.
// status sigue en 'pending'; solo pasa a 'error' cuando se agotan los reintentos.
```

### Qué observar en la demo

1. **Iniciar polling**: la hora cambia cada 2 s e `isFetching` parpadea. **Detener** lo apaga.
2. **retry: 0**: la consulta falla al primer intento y termina en `error`.
3. **retry: 3**: falla dos veces (`failureCount` sube a 2) y al tercer intento tiene **éxito**; el usuario no ve el error.

### Errores comunes

- Dejar el polling encendido en pantallas que no están visibles: consume servidor y batería.
- Reintentar errores que **nunca** se van a arreglar (404, 400, 403): use una función en `retry` para no reintentar según el código.
- Contar con `retry` para operaciones que no son idempotentes (las mutaciones no reintentan por defecto, por algo).
