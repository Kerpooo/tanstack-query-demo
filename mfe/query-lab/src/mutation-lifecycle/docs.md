### ¿Qué es?

Una mutación pasa por varias etapas y TanStack Query permite engancharse a cada una:

1. **`onMutate`**: justo antes de enviar (aquí se hacen las actualizaciones optimistas).
2. **`onSuccess`** u **`onError`**: según responda el servidor.
3. **`onSettled`**: al final, haya salido bien o mal.

Los callbacks se pueden poner en **dos sitios** con matices distintos, y hay **dos formas de lanzar** la mutación (`mutate` y `mutateAsync`).

### Código

```ts
const save = useMutation({
  mutationFn: (name: string) => api.save(name),

  // Callbacks del HOOK: se ejecutan siempre, aunque el componente se desmonte.
  // Orden: onMutate → (petición) → onSuccess o onError → onSettled.
  onMutate: (name) => console.log('antes de enviar', name),
  onSuccess: (data) => console.log('guardado', data),
  onError: () => console.log('falló'),
  onSettled: () => console.log('terminó, bien o mal'),
})

// mutate: "dispara y olvida". Nunca lanza errores; se reacciona con callbacks.
// Los callbacks del LLAMADO se ejecutan después de los del hook
// y solo si el componente sigue montado.
save.mutate('Borrador 1', {
  onSuccess: () => navigate('/listo'),
})

// mutateAsync: devuelve una promesa, útil para encadenar con await.
// OJO: si falla lanza el error, por eso hay que atraparlo.
try {
  const result = await save.mutateAsync('Borrador 2')
} catch (error) {
  // manejar el error
}

// reset() devuelve la mutación a su estado inicial (idle) y borra data/error.
save.reset()
```

### Qué observar en la demo

1. Pulse **Guardar con mutate**: el registro muestra `onMutate`, `onSuccess`, `onSettled` y, al final, el `onSuccess` **del llamado**.
2. Active **Forzar fallo del servidor** y repita: se ejecuta `onError` en lugar de `onSuccess`, pero `onSettled` aparece igual.
3. Pulse **Guardar con mutateAsync**: se registra «await terminó» o «catch», según haya salido.
4. Pulse **reset()**: `status` vuelve a **idle** y `variables` desaparece.

### Errores comunes

- Usar `mutateAsync` sin `try/catch`: un fallo de red termina en un error sin manejar.
- Poner la lógica imprescindible (invalidar la caché) en los callbacks del llamado: si el usuario cambia de pantalla no se ejecutan. Va en el hook.
- Olvidar que `onMutate` puede devolver un contexto que luego recibe `onError` (base de las actualizaciones optimistas).
