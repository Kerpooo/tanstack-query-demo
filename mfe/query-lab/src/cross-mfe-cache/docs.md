### ¿Qué es?

El shell crea **un solo `QueryClient`** y todos los microfrontends lo reciben. Eso significa que **comparten la misma caché**: si el microfrontend `users` carga la clave `['users']`, cualquier otro puede leer esos datos **sin importar nada de `users`** y sin saber siquiera que existe.

Lo único que los une es un **contrato**: la clave (`['users']`) y la forma de los datos (`User[]`).

Es cómodo y desacopla el código, pero tiene una consecuencia que conviene tener clara: **la caché no tiene dueño ni permisos**. Cualquier código de la página puede leerla, enumerarla y **modificarla**.

### Código

```ts
// Este microfrontend NO importa nada del microfrontend `users`.
// Solo conoce el "contrato": la clave ['users'] y la forma de los datos (User[]).
export const useUsersFromOtherMfe = () =>
  useQuery<User[]>({
    queryKey: ['users'],
    // Sin queryFn y con enabled: false este hook NUNCA pide nada al servidor:
    // solo observa la caché y se actualiza cuando otro la llena o la cambia.
    enabled: false,
  })

// Lectura puntual, sin suscripción (devuelve undefined si nadie la cargó).
const users = queryClient.getQueryData<User[]>(['users'])

// Inventario de TODA la caché compartida: cualquier código de la página puede hacerlo.
const keys = queryClient.getQueryCache().findAll().map((query) => query.queryKey)

// Y también escribir en la clave de otro: sus componentes mostrarán estos datos.
queryClient.setQueryData<User[]>(['users'], (old) =>
  old?.map((user) => ({ ...user, name: `${user.name} (alterado)` })),
)

// Para repararlo hay que volver a pedir la verdad al servidor.
queryClient.fetchQuery({ queryKey: ['users'], queryFn: usersApi.list, staleTime: 0 })
```

### Qué observar en la demo

1. Entre directamente a esta página sin haber visitado «Usuarios»: la lectura dice «no hay datos» y no hace ninguna petición.
2. Abra «Usuarios» en el menú y vuelva a este concepto: ahora aparecen los usuarios, **leídos de la caché**, sin que este componente los haya pedido.
3. El inventario muestra **todas** las claves de la caché, incluidas las de otros microfrontends.
4. Pulse **Alterar los datos** y abra «Usuarios»: la lista aparece con los nombres modificados, aunque la base de datos no cambió. Pulse **Restaurar desde el servidor** para repararlo.

### Buenas prácticas

- Publique el **contrato** (claves y tipos) en un paquete compartido, no lo copie a mano en cada microfrontend.
- **Valide** con Zod lo que lea de una clave ajena: otro microfrontend (o código comprometido) pudo escribir cualquier cosa.
- No guarde en la caché datos que un microfrontend no deba ver (tokens, datos personales sensibles): la caché **no es un límite de seguridad**.
- Si necesita aislamiento real entre microfrontends, use un `QueryClient` distinto para cada uno.
- Al cerrar sesión llame a `queryClient.clear()`, para que el siguiente usuario no vea datos del anterior.
