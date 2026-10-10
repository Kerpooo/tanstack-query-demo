### ¿Qué es?

`useQuery` es el hook para **leer datos del servidor**. TanStack Query se encarga de pedirlos, guardarlos en una **caché**, mantenerlos actualizados y avisar al componente de cada cambio de estado (cargando, error, listo).

### Las dos piezas obligatorias

| Pieza | Para qué sirve |
|---|---|
| `queryKey` | Identifica la consulta en la caché. **Misma clave = mismos datos compartidos** entre componentes (e incluso entre microfrontends, porque el `QueryClient` es único). |
| `queryFn` | Función que devuelve una promesa con los datos. Si lanza un error, la consulta pasa a `error`. |

### Código

```ts
import { useQuery } from '@tanstack/react-query'

export const useUsersQuery = () =>
  useQuery({
    // 1) Identidad de la consulta. Es un arreglo: puede incluir parámetros,
    //    por ejemplo ['users', { page: 2 }].
    queryKey: ['users'],

    // 2) Cómo se obtienen los datos. Debe devolver (o ser) una promesa.
    queryFn: usersApi.list,
  })

// En el componente:
const { data, status, fetchStatus, isFetching, error, refetch } = useUsersQuery()

if (status === 'pending') return <p>Cargando…</p>          // todavía no hay datos
if (status === 'error') return <p>Error: {error.message}</p> // la queryFn falló
return <UsersList users={data} />                            // aquí `data` ya existe
```

### Los estados: `status` y `fetchStatus` son cosas distintas

- **`status`** dice qué hay en la caché: `pending` (no hay datos), `error` o `success`.
- **`fetchStatus`** dice si hay una petición en curso: `fetching`, `paused` o `idle`.
- **`isFetching`** es `true` cada vez que se pide algo, incluso cuando ya hay datos (un refetch en segundo plano).

Así, una consulta puede estar en `success` **y** `fetching` a la vez: se muestran los datos que ya hay mientras se refrescan.

### Qué observar en la demo

1. Al cargar la página pasa de `pending / fetching` a `success / idle`.
2. Pulse **Volver a pedir**: `status` sigue en `success` y solo `isFetching` cambia. Los datos no desaparecen.
3. Abra la sección **Usuarios** del menú: usa la misma clave `['users']`, así que ya tiene los datos en caché.

### Errores comunes

- Usar una `queryKey` que no incluye una variable usada en la `queryFn`: dos consultas distintas terminarían compartiendo caché.
- Preguntar `if (!data)` en lugar de `status`: no distingue entre «cargando» y «falló».
- Guardar el resultado en `useState`: no hace falta, la caché ya es el estado.
