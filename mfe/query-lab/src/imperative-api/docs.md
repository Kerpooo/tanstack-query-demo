### ¿Qué es?

No todo ocurre dentro de un componente. A veces hay que leer o llenar la caché desde un **evento**, un **loader de rutas** o una función de utilidad. Para eso el `QueryClient` se puede usar **directamente, sin hooks**:

| Método | ¿Pide al servidor? | Devuelve |
|---|---|---|
| `getQueryData` | Nunca | Lo que haya en caché, o `undefined` (síncrono) |
| `ensureQueryData` | Solo si **no hay nada** en caché | La caché, aunque esté obsoleta |
| `fetchQuery` | Si no hay datos **o están obsoletos** | Datos frescos |

### Código

```ts
// queryOptions agrupa clave, función y staleTime: se reutiliza en hooks y en llamadas directas.
const clockOptions = queryOptions({
  queryKey: ['lab', 'imperative-clock'],
  queryFn: fetchClock,
  staleTime: 10_000, // durante 10 s se considera fresco
})

// fetchQuery: devuelve los datos de la caché si están FRESCOS; si no, los pide.
const fresh = await queryClient.fetchQuery(clockOptions)

// ensureQueryData: devuelve lo que haya en caché (aunque esté obsoleto);
// solo pide si NO hay nada. Ideal para loaders de rutas.
const cached = await queryClient.ensureQueryData(clockOptions)

// getQueryData: lectura síncrona. Devuelve undefined si no hay nada. Nunca pide.
const now = queryClient.getQueryData(clockOptions.queryKey)

// Marcar como obsoleto: el siguiente fetchQuery volverá a pedir.
queryClient.invalidateQueries({ queryKey: clockOptions.queryKey })
```

### Qué observar en la demo

1. Pulse **getQueryData** primero: «undefined», no hay nada en caché.
2. Pulse **fetchQuery** dos veces: la segunda **no pide** (mismo número de petición), porque el dato sigue fresco 10 s.
3. Pulse **Marcar como obsoleto** y luego **fetchQuery**: ahora sí hace una petición nueva.
4. Con datos obsoletos, **ensureQueryData** devuelve lo que hay **sin pedir**; solo pide si antes pulsó **Vaciar la caché**.

### Errores comunes

- Confundir `fetchQuery` con `ensureQueryData`: el primero respeta `staleTime` y refresca; el segundo nunca refresca.
- Leer con `getQueryData` y asumir que hay datos: puede devolver `undefined`.
- Llamar a `fetchQuery` sin `staleTime`: con el valor por defecto (0) los datos siempre están obsoletos y siempre se pide.
