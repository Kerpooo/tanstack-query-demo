### ¿Qué es?

TanStack Query **no es un riesgo en sí mismo**: su historial de avisos de seguridad es corto (por ejemplo, el CVE-2024-24558, un XSS en el paquete experimental de Next.js con SSR, corregido en la 5.18.0). Lo que un pentester prueba en una aplicación real es **cómo se usa**, y sobre todo esto:

> **La caché es memoria del navegador sin dueño ni permisos.** Cualquier código que corra en la página (otro microfrontend, una dependencia comprometida, un XSS) puede leerla, enumerarla y modificarla.

En una aplicación con microfrontends que comparten un solo `QueryClient`, eso convierte a la caché en una **frontera de confianza** que conviene tener presente.

### Código

```ts
// Lo mismo que haría un pentester desde cualquier microfrontend:
// recorrer TODA la caché compartida y buscar datos que no deberían estar ahí.
for (const query of queryClient.getQueryCache().findAll()) {
  const key = JSON.stringify(query.queryKey)
  const data = JSON.stringify(query.state.data ?? null)

  // Las claves aparecen en Devtools, logs y errores: no deben llevar secretos ni datos personales.
  if (SECRET_NAME.test(key)) report(key, 'el nombre de la clave sugiere un secreto')

  // Los datos son legibles por cualquier código de la página.
  if (EMAIL.test(data)) report(key, 'los datos incluyen correos (datos personales)')
}

// Al cerrar sesión se borra TODO, para que el siguiente usuario no vea datos del anterior.
queryClient.clear()

// Aislamiento real: un QueryClient distinto por microfrontend (no comparten caché).
const isolatedClient = new QueryClient()

// Si persiste la caché, excluya lo sensible y limite la vida de lo guardado.
persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 30,
  dehydrateOptions: { shouldDehydrateQuery: (query) => query.meta?.persist === true },
})
```

### Qué observar en la demo

1. Pulse **Escanear la caché** tras visitar «Usuarios»: aparecen hallazgos, porque la lista de usuarios contiene correos.
2. Pulse **Sembrar una sesión de ejemplo** y escanee otra vez: ahora se detecta un `token` dentro de la caché.
3. Pulse **Cerrar sesión (clear)**: «consultas en caché» baja a cero y un nuevo escaneo no encuentra nada.

### Riesgos que un pentester probaría

| Riesgo | Severidad en una app como esta | Mitigación |
|---|---|---|
| Un microfrontend lee o envenena la caché de otro | Alta (es una decisión de diseño) | Un `QueryClient` por microfrontend, validar con Zod lo que se lea |
| `remoteEntry.js` comprometido: código con acceso total al `QueryClient` | Alta | URLs fijas por HTTPS, CSP `script-src`, tratar los remotes como código propio |
| Datos en claro al persistir en `localStorage` o IndexedDB | Media-alta, solo si se persiste | `shouldDehydrateQuery`, `maxAge` corto, no persistir datos personales ni tokens |
| Devtools incluidas en producción | Media | Comprobar `NODE_ENV=production` en el build |
| Secretos o correos dentro de la `queryKey` | Media | Identificadores opacos |
| Caché de una sesión visible tras cambiar de usuario | Media | `queryClient.clear()` al cerrar sesión |
| Reintentos, foco y reconexión que multiplican peticiones; mutaciones repetidas al volver la red | Media | Límite de peticiones en el servidor, claves de idempotencia, `retry` selectivo |
| Hidratación con SSR sin escapar el HTML | Alta, solo con SSR | Serializar con una librería que escape `<` |

### Errores comunes

- Creer que la caché protege algo: **no es control de acceso**. La autorización se valida siempre en el servidor.
- Mostrar `error.message` sin filtrar: puede revelar detalles internos de la API.
- Poner un token o un correo en la `queryKey` «por comodidad».
- Revisar solo la librería y olvidar que el riesgo mayor es el código que comparte la página con ella.
