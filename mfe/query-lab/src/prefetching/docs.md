### ¿Qué es?

**Precargar** es pedir datos *antes* de que el usuario los necesite, para que aparezcan al instante. Un caso típico: al pasar el mouse sobre un enlace se precarga la página de destino.

`prefetchQuery` llena la caché **sin suscribir ningún componente** y sin lanzar errores si falla.

### Código

```ts
// queryOptions define una sola vez la clave y la función.
// Se reutiliza para precargar y para leer, así nunca se desincronizan.
export const userDetailOptions = (id: string) =>
  queryOptions({
    queryKey: ['lab', 'user-prefetch', id],
    queryFn: () => usersApi.get(id),

    // IMPORTANTE: sin staleTime los datos precargados se consideran obsoletos
    // al instante y el componente los volvería a pedir al montarse.
    staleTime: 30_000,
  })

export function usePrefetchUser() {
  const queryClient = useQueryClient()
  return (id: string) => queryClient.prefetchQuery(userDetailOptions(id))
}

// En la lista:
const prefetch = usePrefetchUser()

<button
  onMouseEnter={() => prefetch(user.id)}  // al pasar el mouse
  onFocus={() => prefetch(user.id)}       // y al navegar con teclado
  onClick={() => setSelectedId(user.id)}
>
  {user.name}
</button>

// En el detalle, el mismo hook de siempre: si está en caché, sale al instante.
const detail = useQuery({ ...userDetailOptions(id), enabled: id !== null })
```

### Qué observar en la demo

1. Pase el mouse sobre un nombre y espere un instante: aparece la marca **precargado**.
2. Haga clic: el detalle se muestra **al instante**, sin pasar por «Cargando detalle…».
3. Pulse **Vaciar lo precargado** y haga clic en un nombre sin pasar antes el mouse: ahora sí tarda ~0,8 s.

### Errores comunes

- No definir `staleTime`: lo precargado se vuelve a pedir inmediatamente y la precarga no sirve.
- Precargar demasiado (todas las filas de una tabla): se desperdicia ancho de banda. Precargue lo que el usuario probablemente abrirá.
- Usar claves distintas para precargar y para leer: la caché no coincide y no hay efecto.
