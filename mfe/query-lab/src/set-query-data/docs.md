### ¿Qué es?

`setQueryData` **escribe directamente en la caché**. Es la alternativa a `invalidateQueries` cuando ya se tiene el dato nuevo (por ejemplo, la respuesta del servidor a una mutación) y no hace falta volver a pedir toda la lista.

| | `setQueryData` | `invalidateQueries` |
|---|---|---|
| Petición extra | No | Sí (vuelve a pedir la lista) |
| Velocidad | Inmediata | Espera la respuesta |
| Fuente de verdad | Lo que se escribe a mano | Siempre el servidor |
| Riesgo | Que la caché se desvíe del servidor | Peticiones de más |

### Código

```ts
// Opción A: setQueryData. Se inserta lo que respondió el servidor.
export function useAddTaskSetQueryData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (title: string) => tasksApi.create(title),

    // `created` es la respuesta del POST: la tarea ya con su id.
    onSuccess: (created) =>
      queryClient.setQueryData<CountedTasks>(
        ['lab', 'tasks-counted'],
        // El segundo argumento recibe el valor actual y devuelve el nuevo.
        // Se debe devolver un objeto NUEVO (inmutabilidad), nunca mutar `old`.
        (old) => (old ? { ...old, tasks: [...old.tasks, created] } : old),
      ),
  })
}

// Opción B: invalidateQueries. Se marca como obsoleta y se pide otra vez.
export function useAddTaskInvalidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (title: string) => tasksApi.create(title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab', 'tasks-counted'] }),
  })
}
```

### Qué observar en la demo

1. Pulse **Crear con setQueryData** varias veces: aparecen tareas nuevas y **«peticiones de la lista» no cambia**.
2. Pulse **Crear con invalidateQueries**: aparece la tarea y el contador de peticiones **sube en uno**.
3. Abra las Devtools de React Query (botón flotante): la clave `['lab','tasks-counted']` muestra cuándo se actualizó cada dato.

### Cuándo usar cada una

- **`setQueryData`**: la respuesta de la mutación ya trae todo lo necesario (crear, editar un elemento), o en actualizaciones optimistas.
- **`invalidateQueries`**: la lista depende de reglas del servidor (orden, filtros, paginación) que no se pueden reproducir con seguridad en el cliente.
- En la práctica se combinan: `setQueryData` para respuesta rápida y `invalidateQueries` en `onSettled` para confirmar.

### Errores comunes

- Mutar el valor anterior (`old.push(...)`) en lugar de devolver uno nuevo: la UI no se entera del cambio.
- Escribir con `setQueryData` en una clave que nadie lee: no tiene efecto visible.
- Olvidar que el tipo del dato en caché debe coincidir con el que devuelve la `queryFn`.
