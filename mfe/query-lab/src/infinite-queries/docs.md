### ¿Qué es?

`useInfiniteQuery` sirve para listas que crecen por partes: «Cargar más», *scroll* infinito, *feeds*. En lugar de una sola respuesta, guarda un **arreglo de páginas** y sabe cuál pedir a continuación.

### Código

```ts
export const useInfiniteUsers = () =>
  useInfiniteQuery({
    queryKey: ['lab', 'users-infinite'],

    // pageParam es el "cursor" de la página que se pide AHORA.
    queryFn: ({ pageParam }) => usersApi.page(8, pageParam),

    // Cursor de la primera página.
    initialPageParam: '0',

    // Recibe la última página y devuelve el cursor de la SIGUIENTE.
    // Si devuelve undefined, ya no hay más: hasNextPage pasa a false.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

// En el componente:
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteUsers()

// data.pages = [ página1, página2, ... ]  -> se aplana para pintar una sola lista
const users = data?.pages.flatMap((page) => page.items) ?? []

<button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
  Cargar más
</button>
```

### Cómo responde la API

```text
GET /users?limit=8&cursor=0   ->  { items: [...8], nextCursor: "8" }
GET /users?limit=8&cursor=8   ->  { items: [...8], nextCursor: "16" }
GET /users?limit=8&cursor=24  ->  { items: [...6], nextCursor: null }   <- fin
```

### Qué observar en la demo

1. Se cargan 8 usuarios y **páginas cargadas: 1**.
2. Cada clic en **Cargar más** agrega una página; durante la petición `isFetchingNextPage` es `true`.
3. Al llegar a la última página, `hasNextPage` pasa a `false` y el botón se deshabilita.

### Errores comunes

- Olvidar `initialPageParam` (es obligatorio en la versión 5).
- Usar `data.items` en lugar de `data.pages`: la forma de los datos es distinta a la de `useQuery`.
- Invalidar una consulta infinita larga: vuelve a pedir **todas** las páginas cargadas, en orden.
