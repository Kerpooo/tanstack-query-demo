### ¿Qué es?

A veces hay que saber **si la aplicación está ocupada** sin tener acceso a cada consulta: una barra de progreso en la cabecera, un aviso «hay cambios sin guardar» o bloquear un botón mientras algo se guarda.

TanStack Query ofrece tres hooks para leer ese estado global:

- **`useIsFetching`**: cuántas consultas están pidiendo datos.
- **`useIsMutating`**: cuántas mutaciones están en curso.
- **`useMutationState`**: la lista de mutaciones (y sus variables) filtradas por estado.

Todos aceptan **filtros**: la misma lógica de prefijos de `queryKey` / `mutationKey` que `invalidateQueries`.

### Código

```ts
// mutationKey identifica la mutación para poder contarla y listarla desde fuera.
const save = useMutation({
  mutationKey: ['lab', 'global-save'],
  mutationFn: (name: string) => api.save(name),
})

// En CUALQUIER otro componente (sin props):

// Cuántas consultas con esa clave de prefijo están pidiendo datos ahora.
const fetching = useIsFetching({ queryKey: ['lab', 'global'] })

// Cuántas mutaciones están en curso.
const mutating = useIsMutating({ mutationKey: ['lab', 'global-save'] })

// Las variables de cada mutación pendiente: «Guardando: Informe A, Informe B».
const saving = useMutationState({
  filters: { mutationKey: ['lab', 'global-save'], status: 'pending' },
  select: (mutation) => mutation.state.variables as string,
})
```

### Qué observar en la demo

1. Pulse **Refrescar todo**: «Consultas en curso» sube a 3 y baja de uno en uno según terminan (1 s, 2 s y 3 s).
2. Pulse **Guardar «Informe A»** y **Guardar «Informe B»**: «Mutaciones en curso» sube a 2 y la lista muestra los dos nombres.
3. La barra superior no recibe nada de los paneles: solo lee los contadores.

### Errores comunes

- No filtrar `useIsFetching`: cuenta **todas** las consultas de la aplicación (incluidas las de otros microfrontends, porque el `QueryClient` es único).
- Olvidar `mutationKey`: sin ella no se puede filtrar una mutación concreta.
- Usar el indicador global para decidir qué mostrar en un componente concreto: para eso es mejor el `isFetching` de su propia consulta.
