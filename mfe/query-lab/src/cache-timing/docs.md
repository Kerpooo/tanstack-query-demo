### ¿Qué es?

Dos tiempos controlan la caché de TanStack Query y se confunden con frecuencia:

| Opción | Pregunta que responde | Valor por defecto |
|---|---|---|
| `staleTime` | ¿Cuánto tiempo los datos se consideran **frescos**? | `0` (obsoletos al instante) |
| `gcTime` | ¿Cuánto se **conservan en memoria** si nadie los usa? | 5 minutos |

Los datos **frescos** se sirven desde la caché sin pedir nada. Los **obsoletos** (*stale*) también se muestran al instante, pero se vuelven a pedir en segundo plano cuando ocurre algo: el componente se monta, la ventana recupera el foco o vuelve la conexión.

### Código

```ts
export const useClock = (staleTime: number) =>
  useQuery({
    queryKey: ['lab', 'clock'],
    queryFn: () => demoApi.clock(),

    // Mientras no pasen estos milisegundos, los datos están "frescos":
    // montar el componente otra vez NO provoca una petición.
    //   0        -> siempre obsoletos (comportamiento por defecto)
    //   10_000   -> frescos durante 10 segundos
    //   Infinity -> frescos para siempre (solo se piden al invalidar)
    staleTime,

    // Tiempo que sobrevive la consulta SIN componentes que la observen.
    // Pasado ese tiempo se borra de la memoria. (5 min por defecto)
    // gcTime: 5 * 60 * 1000,
  })
```

### Línea de tiempo

```text
t=0     montar     -> no hay datos -> petición #1
t=3s    desmontar  -> la consulta queda en caché (gcTime corriendo)
t=5s    montar     -> staleTime 0: obsoleto  -> muestra caché y pide #2
                      staleTime 10s: fresco  -> muestra caché, SIN petición
```

### Qué observar en la demo

1. Con `staleTime: 0`, desmonte y vuelva a montar: el **n.º de petición** sube y `isStale` es `true`.
2. Con `staleTime: 10 s`, repita antes de que pasen 10 segundos: el número **no cambia**. Pasado ese tiempo, `isStale` pasa a `true`.
3. Con `Infinity`, nunca se vuelve a pedir por sí solo.

### Errores comunes

- Creer que `gcTime` controla la frescura: solo decide cuándo se **borra** de memoria.
- Dejar `staleTime: 0` en datos que casi no cambian (listas de países, catálogos): genera peticiones innecesarias.
- Poner `gcTime` menor que `staleTime`: la caché se borraría antes de que los datos dejen de ser frescos.
