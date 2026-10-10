### ¿Qué es?

Dos herramientas distintas para trabajar mejor con los datos que ya están en caché.

**`select`** transforma el resultado **sin hacer otra petición**. Varios componentes pueden leer la misma consulta y derivar cada uno lo que necesita (un conteo, una lista filtrada, un solo campo).

**`placeholderData`** muestra datos *provisionales* mientras llegan los reales. Con `keepPreviousData` se enseña la página anterior durante la carga de la siguiente, evitando parpadeos al paginar.

### Código

```ts
// --- select: derivar datos de la caché -----------------------------------
// Misma queryKey que la lista de usuarios => una sola petición para todos.
export const useUsersCount = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    select: (users) => users.length, // el componente recibe solo el número
  })

export const useUsersMatching = (term: string) => {
  // useCallback mantiene estable la función; si cambia en cada render,
  // select se vuelve a ejecutar siempre.
  const select = useCallback(
    (users: User[]) => users.filter((u) => u.name.toLowerCase().includes(term.toLowerCase())),
    [term],
  )
  return useQuery({ queryKey: ['users'], queryFn: usersApi.list, select })
}

// --- placeholderData: paginar sin parpadeos --------------------------------
export const useUsersPage = (page: number) =>
  useQuery({
    queryKey: ['lab', 'users-page', page], // la página forma parte de la clave
    queryFn: () => usersApi.page(5, String(page * 5)),

    // Mientras llega la página nueva se muestra la anterior.
    placeholderData: keepPreviousData,
  })

// isPlaceholderData === true  ->  lo que se ve todavía es la página anterior
```

### Qué observar en la demo

1. Escriba en el filtro: cambian las **coincidencias**, pero no hay ninguna petición nueva; todo sale de la misma caché.
2. Pulse **Siguiente**: la lista no se vacía; sigue mostrando la página anterior hasta que llega la nueva, y `isPlaceholderData` está en `true` unos instantes.
3. El botón **Siguiente** se deshabilita mientras los datos son provisionales para evitar saltarse páginas.

### Errores comunes

- Pasar una función nueva en cada render a `select` sin necesidad: se recalcula siempre.
- Usar `select` para algo costoso sin memorizar: se ejecuta en cada render que cambie la referencia.
- Olvidar poner la página en la `queryKey`: todas las páginas compartirían el mismo resultado.
