### ¿Qué es?

Una **actualización optimista** muestra el resultado de una acción **antes** de que el servidor confirme. La interfaz se siente instantánea; si el servidor falla, se **deshace** el cambio (*rollback*).

Se implementa con los tres callbacks de `useMutation`: `onMutate`, `onError` y `onSettled`.

### Código

```ts
export function useToggleTaskOptimistic({ forceFail }: { forceFail: boolean }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: Task) => {
      await sleep(1000)                       // latencia simulada para ver el efecto
      if (forceFail) await demoApi.fail()     // el servidor responde 500
      return tasksApi.toggle(task)
    },

    // 1) ANTES de enviar: se cambia la caché como si ya hubiera funcionado.
    onMutate: async (task) => {
      // Cancela refetch en curso: si llegara uno, pisaría el cambio optimista.
      await queryClient.cancelQueries({ queryKey: ['lab', 'tasks'] })

      // Guarda una copia del estado actual para poder deshacer.
      const previous = queryClient.getQueryData<Task[]>(['lab', 'tasks'])

      // Escribe el cambio en la caché (la UI se actualiza al instante).
      queryClient.setQueryData<Task[]>(['lab', 'tasks'], (old) =>
        old?.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
      )

      return { previous } // lo que se devuelve llega como `context` a onError
    },

    // 2) Si la petición falla: se restaura la copia.
    onError: (_error, _task, context) => {
      if (context?.previous) queryClient.setQueryData(['lab', 'tasks'], context.previous)
    },

    // 3) Pase lo que pase: se pide la lista real para quedar sincronizados.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['lab', 'tasks'] }),
  })
}
```

### Qué observar en la demo

1. Cree una tarea de ejemplo y marque su casilla: el cambio se ve **de inmediato**, aunque la mutación sigue en `pending` durante 1 segundo.
2. Active **Forzar fallo del servidor** y marque otra: la casilla cambia y, al responder el servidor con 500, **vuelve a su estado anterior** y aparece el aviso.
3. Sin esas dos ideas (`previous` en el contexto y `onSettled`), la pantalla podría quedar mostrando algo que el servidor nunca aceptó.

### Cuándo conviene

- Acciones muy frecuentes y que casi siempre funcionan: marcar, dar *me gusta*, reordenar.
- **No** conviene en operaciones donde un fallo es normal o costoso (pagos): ahí es mejor esperar la confirmación.

### Errores comunes

- No llamar a `cancelQueries`: un refetch tardío sobrescribe el cambio optimista y la UI «parpadea».
- Olvidar el rollback en `onError`.
- No invalidar en `onSettled`: la caché podría quedar distinta del servidor.
