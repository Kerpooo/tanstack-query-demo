### ¿Qué es?

Si una pantalla necesita varias consultas independientes, conviene lanzarlas **a la vez** y no una tras otra. Con `useQuery` esto ocurre solo cuando hay un número fijo de hooks. **`useQueries`** permite lanzarlas en paralelo con un número **dinámico** de consultas (por ejemplo, una por cada elemento de una lista) y combinar los resultados.

### Código

```ts
export const useDashboard = () =>
  useQueries({
    // Un objeto de configuración por consulta. Todas arrancan al mismo tiempo.
    queries: [
      { queryKey: ['lab', 'tasks'], queryFn: tasksApi.list },
      { queryKey: ['users'], queryFn: usersApi.list },
      { queryKey: ['lab', 'slow', 1500], queryFn: () => demoApi.slow(1500) },
    ],

    // Resume los resultados en la forma que necesita el componente.
    // Se vuelve a calcular solo cuando cambia algún resultado.
    combine: (results) => [
      { label: 'Tareas', status: results[0].status, value: results[0].data?.length },
      { label: 'Usuarios', status: results[1].status, value: results[1].data?.length },
      { label: 'Endpoint lento', status: results[2].status, value: results[2].data?.waited },
    ],
  })

// Caso dinámico: una consulta por id
const detailQueries = useQueries({
  queries: userIds.map((id) => ({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id),
  })),
})
```

### Qué observar en la demo

1. Las tarjetas de **Tareas** y **Usuarios** se llenan enseguida; la del endpoint lento sigue en `pending` ~1,5 s. Ninguna espera a la otra.
2. Si fueran `await` encadenados, el total sería la **suma** de los tiempos; en paralelo es el del más lento.
3. **Repetir solo la consulta lenta** invalida únicamente esa clave; las otras dos no se tocan.

### Errores comunes

- Encadenar `await` en una sola `queryFn` para obtener varias cosas: se pierde el paralelismo y la caché independiente.
- No usar `combine`: el componente recibe un arreglo nuevo en cada render y puede re-renderizar de más.
- Usar `useQueries` cuando una consulta **depende** de otra: ahí corresponde `enabled`.
