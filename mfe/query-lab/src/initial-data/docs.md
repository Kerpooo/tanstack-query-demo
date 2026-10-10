### ¿Qué es?

Ambas opciones sirven para **mostrar algo al instante** mientras llegan los datos reales, pero se comportan distinto:

| | `initialData` | `placeholderData` |
|---|---|---|
| ¿Entra en la caché? | **Sí**, como si fuera un dato real | **No**, solo se muestra |
| `status` mientras carga | `success` | `success` (con `isPlaceholderData: true`) |
| Si el servidor falla | Queda el dato inicial en caché | Se pierde el placeholder |
| Caso típico | Ya tengo el dato en otra caché (lista → detalle) | Mostrar un esqueleto o datos previos |

Con `initialData` hay que decir **de cuándo es** el dato (`initialDataUpdatedAt`); si no, se considera recién obtenido y con `staleTime` alto no se refrescaría nunca.

### Código

```ts
// Lista → detalle: el usuario ya está en la caché de la lista.
const fromList = (id: string) =>
  queryClient.getQueryData<User[]>(['users'])?.find((u) => u.id === id)

// 1) initialData: se ESCRIBE en la caché como si fuera un dato real.
useQuery({
  queryKey: ['lab', 'user-initial', id],
  queryFn: () => fetchUser(id),
  initialData: () => fromList(id),
  // De cuándo es ese dato: así staleTime sabe si ya está viejo.
  initialDataUpdatedAt: () => queryClient.getQueryState(['users'])?.dataUpdatedAt,
})

// 2) placeholderData: solo se MUESTRA mientras llegan los datos reales.
// No entra en la caché y `isPlaceholderData` vale true hasta que llegan.
useQuery({
  queryKey: ['lab', 'user-placeholder', id],
  queryFn: () => fetchUser(id),
  placeholderData: () => fromList(id),
})
```

### Qué observar en la demo

1. Elija un usuario: ambos paneles muestran sus datos **de inmediato**.
2. En `initialData`, `isPlaceholderData` es **false** y «en caché» es **sí** desde el primer instante.
3. En `placeholderData`, `isPlaceholderData` es **true** y «en caché» es **no** hasta que llega la respuesta real (~1,5 s).
4. En ambos, `fetchStatus` es **fetching** durante ese tiempo: se refresca en segundo plano.

### Errores comunes

- Usar `initialData` con datos parciales (la lista trae menos campos que el detalle): la caché del detalle quedaría incompleta.
- Olvidar `initialDataUpdatedAt` y no entender por qué no se refresca.
- Usar `initialData` cuando solo se quiere un esqueleto temporal: ahí corresponde `placeholderData`.
