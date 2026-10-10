### ¿Qué es?

TanStack Query **refresca los datos solos** en dos momentos en los que es probable que se hayan quedado viejos:

- **`refetchOnWindowFocus`**: cuando el usuario vuelve a la pestaña del navegador.
- **`refetchOnReconnect`**: cuando la conexión a internet se recupera.

Ambos están activados por defecto, pero solo afectan a las consultas **obsoletas** (`staleTime` vencido). Si los datos siguen frescos, no se pide nada.

Detrás hay dos «gestores» globales, `focusManager` y `onlineManager`, que se pueden controlar a mano (útil en pruebas, en React Native o para demostrarlo).

### Código

```ts
useQuery({
  queryKey: ['lab', 'focus-clock'],
  queryFn: fetchClock,

  // Solo se refresca si los datos están obsoletos: con 0 siempre lo están.
  staleTime: 0,

  // Al volver a la pestaña se refrescan los datos obsoletos (true por defecto).
  refetchOnWindowFocus: true,

  // Al recuperar la conexión también (true por defecto).
  refetchOnReconnect: true,
})

// Simular que la ventana pierde y recupera el foco, sin cambiar de pestaña.
focusManager.setFocused(false)
focusManager.setFocused(true)

// Simular que se pierde la conexión: las peticiones nuevas quedan en `paused`
// y se reanudan solas cuando la conexión vuelve.
onlineManager.setOnline(false)
onlineManager.setOnline(true)
```

### Qué observar en la demo

1. Pulse **Simular que la ventana pierde y recupera el foco**: sube el «petición n.º» porque la consulta está obsoleta.
2. Desactive **refetchOnWindowFocus** y repita: ya no se pide nada.
3. Pulse **Simular desconexión** y luego **Volver a pedir**: `fetchStatus` pasa a **paused**; la petición espera.
4. Pulse **Restaurar conexión**: la petición pausada se ejecuta sola.

### Errores comunes

- Creer que el refetch por foco «no funciona» cuando hay un `staleTime` alto: los datos siguen frescos y no se pide nada.
- Dejar activado el refetch por foco en datos costosos o que cambian poco: desactívelo por consulta o con valores globales en el `QueryClient`.
- Olvidar restaurar `focusManager`/`onlineManager` tras simularlos en pruebas: son globales y afectan a todo lo demás.
