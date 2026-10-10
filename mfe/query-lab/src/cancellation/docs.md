### ¿Qué es?

Cuando el usuario cambia de filtro, de página o se va de la pantalla, la petición anterior **ya no sirve**. Si sigue en vuelo desperdicia ancho de banda y puede llegar tarde y pisar datos nuevos.

TanStack Query entrega a cada `queryFn` un **`signal`** (un `AbortSignal` estándar). Si usted lo pasa a `fetch` o `axios`, la petición HTTP se **cancela de verdad**. La librería la cancela sola cuando la consulta pierde a todos sus observadores, y también se puede cancelar a mano con `cancelQueries`.

### Código

```ts
useQuery({
  queryKey: ['lab', 'cancel', ms],
  // TanStack Query entrega un `signal` a cada queryFn.
  // Si se lo pasa a axios/fetch, la petición HTTP se cancela de verdad.
  queryFn: async ({ signal }) => {
    try {
      return await axios.get('/demo/slow', { params: { ms }, signal })
    } catch (error) {
      // signal.aborted indica que la cancelaron (no es un fallo del servidor).
      if (signal.aborted) console.log('cancelada')
      throw error
    }
  },
})

// Cancelación manual: la consulta vuelve al estado anterior (sin error).
queryClient.cancelQueries({ queryKey: ['lab', 'cancel', ms] })

// Cancelación automática: al cambiar la clave (ms) la consulta anterior
// se queda sin observadores y, si ya se usó el signal, se cancela sola.
```

### Qué observar en la demo

1. Pulse **Pedir 3 s**: el registro muestra «inicia la petición de 3000 ms».
2. Antes de que termine, pulse **Pedir 5 s**: aparece «se canceló la petición de 3000 ms».
3. Pulse **Pedir 3 s** y luego **Cancelar**: `fetchStatus` vuelve a **idle** y no hay error.
4. En DevTools → Network se ve la petición cancelada.

### Errores comunes

- No pasar el `signal` a la petición: la consulta se «cancela» en pantalla, pero la petición HTTP sigue su curso.
- Tratar la cancelación como un error y mostrar un mensaje al usuario: una cancelación no es un fallo.
- Esperar cancelación automática sin haber leído el `signal`: solo se cancela si el `queryFn` lo usó.
