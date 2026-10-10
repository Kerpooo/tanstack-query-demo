### ¿Qué es?

`useQuery` sirve para **leer**; `useMutation` sirve para **escribir** (crear, editar, borrar). Una mutación no se ejecuta sola: se dispara a mano con `mutate()`.

Después de escribir, las listas que se muestran en pantalla quedan desactualizadas. La forma más simple de arreglarlo es **invalidar** las consultas relacionadas con `invalidateQueries`: TanStack Query las marca como obsoletas y vuelve a pedir las que están en uso.

### Código

```ts
export const useAddTask = () => {
  // El QueryClient permite hablar con la caché desde cualquier hook.
  const queryClient = useQueryClient()

  return useMutation({
    // Qué se envía al servidor (recibe lo que se pase a mutate()).
    mutationFn: (title: string) => tasksApi.create(title),

    // Se ejecuta SOLO si la petición salió bien.
    // Invalida todas las consultas cuya clave empiece por ['lab', 'tasks'],
    // y la lista se vuelve a pedir automáticamente.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab', 'tasks'] }),
  })
}

// En el componente:
const addTask = useAddTask()

addTask.mutate('Aprender TanStack Query', {
  // Callbacks por llamada (además de los del hook):
  onSuccess: () => setTitle(''),
})

addTask.isPending // true mientras la petición está en vuelo
addTask.isError   // true si falló
```

### Ciclo de vida de una mutación

```text
mutate(variables)
  └─ onMutate     (antes de enviar)
  └─ mutationFn   (la petición)
  └─ onSuccess / onError
  └─ onSettled    (siempre, al final)
```

### Qué observar en la demo

1. Escriba un título y pulse **Agregar tarea**: la mutación pasa por `pending` y termina en `success`.
2. Casi a la vez, `lista (isFetching)` se pone en `true`: es la invalidación pidiendo la lista de nuevo.
3. La tarea aparece sin que el componente haya tocado la lista a mano.

### Errores comunes

- Olvidar invalidar: la escritura funciona pero la pantalla sigue mostrando datos viejos.
- Invalidar con una clave demasiado amplia (`invalidateQueries()` sin argumentos) y provocar decenas de peticiones.
- Llamar `mutate` dentro del cuerpo del componente en lugar de en un evento (provoca un bucle).
