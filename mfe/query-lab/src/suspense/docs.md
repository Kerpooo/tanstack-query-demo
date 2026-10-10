### ¿Qué es?

Con `useQuery` cada componente decide qué mostrar según `isPending` e `isError`. Con **`useSuspenseQuery`** esa responsabilidad se traslada a React:

- Mientras carga, el componente **«suspende»** y lo atrapa el `<Suspense fallback>` más cercano.
- Si falla, **lanza el error** y lo atrapa un `ErrorBoundary`.
- `data` **nunca es `undefined`**: el componente solo escribe el caso feliz.

`QueryErrorResetBoundary` conecta ambos mundos: al pulsar «Reintentar» le dice a las consultas fallidas que vuelvan a pedir.

### Código

```ts
// useSuspenseQuery: mientras carga "suspende" el componente (lo atrapa <Suspense>)
// y si falla lanza el error (lo atrapa un ErrorBoundary). Por eso `data` nunca es undefined.
function Report() {
  const { data } = useSuspenseQuery({
    queryKey: ['lab', 'suspense'],
    queryFn: fetchReport,
    retry: false, // sin reintentos, para ver el error enseguida
  })
  return <p>Informe de las {data.now}</p>
}

// El componente que "espera" y el que "falla" se resuelven FUERA, en el padre:
<QueryErrorResetBoundary>
  {({ reset }) => (
    // onReset: al reintentar, las consultas fallidas se vuelven a pedir.
    <ErrorBoundary onReset={reset} fallback={(error, retry) => <Fallo onRetry={retry} />}>
      <Suspense fallback={<p>Cargando…</p>}>
        <Report />
      </Suspense>
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

### Qué observar en la demo

1. Pulse **Volver a cargar**: durante 1 s aparece «Cargando informe (Suspense)…» y luego el informe. `Report` no tiene ningún `if (isPending)`.
2. Active **Forzar error del servidor** y pulse **Volver a cargar**: el `ErrorBoundary` muestra el fallo.
3. Desactive el error y pulse **Reintentar**: el informe se carga.

### Errores comunes

- Poner `useSuspenseQuery` sin `<Suspense>` por encima: React lanza un error.
- Olvidar `QueryErrorResetBoundary`: «Reintentar» volvería a mostrar el mismo error sin pedir de nuevo.
- Usar `enabled` con `useSuspenseQuery`: no está soportado; para consultas condicionales use `useQuery`.
- Crear una cascada de «cargas»: dos `useSuspenseQuery` seguidos en el mismo componente se piden en serie, no en paralelo.
