### ¿Qué es?

A veces una consulta necesita un dato que todavía no existe: el `id` que el usuario aún no ha elegido, el resultado de otra consulta, etc. La opción **`enabled`** permite **retrasar** la consulta hasta que se cumpla una condición.

Mientras `enabled` es `false`, la consulta **no hace ninguna petición**: queda con `status: 'pending'` y `fetchStatus: 'idle'` (lista, pero sin trabajar).

### Código

```ts
export const useUserDetail = (userId: string | null) =>
  useQuery({
    // El id forma parte de la clave: cada usuario tiene su propia entrada en caché.
    queryKey: ['lab', 'user', userId ?? ''],

    // El "!" es seguro porque la consulta solo corre cuando userId no es null.
    queryFn: () => usersApi.get(userId!),

    // Solo se ejecuta cuando ya hay un usuario elegido.
    enabled: userId !== null,
  })

// En el componente:
const [selectedId, setSelectedId] = useState<string | null>(null)
const detail = useUserDetail(selectedId)

// Antes de elegir: detail.status === 'pending' y detail.fetchStatus === 'idle'
// Al elegir:       detail.fetchStatus pasa a 'fetching' y luego llegan los datos
```

### Cadena de consultas

También sirve para encadenar: la segunda consulta espera el resultado de la primera.

```ts
const user = useQuery({ queryKey: ['user', id], queryFn: () => getUser(id) })

const projects = useQuery({
  queryKey: ['projects', user.data?.id],
  queryFn: () => getProjects(user.data!.id),
  enabled: !!user.data, // espera a que exista el usuario
})
```

### Qué observar en la demo

1. Al entrar, `enabled` es `false` y `fetchStatus` es `idle`: no hay ninguna petición al servidor (compruébelo en la pestaña **Red** del navegador).
2. Elija un usuario: `enabled` pasa a `true`, hay una petición y aparecen los datos.
3. Elija otro y vuelva al primero: el primero sale **al instante** desde la caché (y se revalida en segundo plano), porque su clave incluye el `id`.

### Errores comunes

- Usar `isLoading` para el estado inicial de una consulta deshabilitada: usted verá «cargando» para siempre. Mire `fetchStatus`, o use `isPending && isFetching`.
- Olvidar el valor en la `queryKey`: todos los usuarios compartirían la misma entrada.
