### ¿Qué es?

La **`queryKey`** es la identidad de una consulta en la caché. Es un arreglo, y funciona de forma **jerárquica**: `['usuarios']` es el «prefijo» de `['usuarios', 1]`.

Gracias a eso, una sola instrucción puede afectar a **varias consultas a la vez**: `invalidateQueries({ queryKey: ['usuarios'] })` marca como obsoletas tanto la lista como cada detalle, y las que estén en pantalla se vuelven a pedir.

### Código

```ts
// Fábrica de claves: un solo lugar donde se define cómo se arma cada clave.
// Así no se escriben a mano (y mal) en cada componente.
export const queryKeys = {
  scopedAll: ['lab', 'keys'] as const,
  scopedGroup: (group: string) => ['lab', 'keys', group] as const,
  scoped: (group: string, id: string) => ['lab', 'keys', group, id] as const,
}

// Cada consulta usa su clave completa: grupo + id.
useQuery({
  queryKey: queryKeys.scoped('usuarios', '1'),
  queryFn: fetchClock,
})

// Sin `exact`, la clave actúa como PREFIJO:
// invalida ['lab','keys','usuarios','1'] y ['lab','keys','usuarios','2'].
queryClient.invalidateQueries({ queryKey: queryKeys.scopedGroup('usuarios') })

// Con `exact: true` solo coincide una clave idéntica: únicamente usuarios/1.
queryClient.invalidateQueries({ queryKey: queryKeys.scoped('usuarios', '1'), exact: true })

// Para criterios más finos existe `predicate`: recibe cada consulta y decide.
queryClient.invalidateQueries({ predicate: (query) => query.queryKey[2] === 'tareas' })
```

### Qué observar en la demo

1. **Invalidar todo**: los tres paneles suben su número de petición.
2. **Invalidar el grupo usuarios**: solo suben los dos de usuarios; el de tareas no se toca.
3. **Invalidar solo usuarios/1**: sube únicamente ese panel.
4. **Grupo usuarios con exact**: no pasa nada, porque ninguna consulta tiene exactamente esa clave.

### Errores comunes

- Armar las claves a mano en cada componente: un error tipográfico crea una caché distinta y la invalidación «no funciona».
- Usar objetos mutables o valores cambiantes (fechas, funciones) dentro de la clave: cada render crearía una consulta nueva.
- Olvidar que las variables de las que depende `queryFn` deben estar **en la clave**; si no, dos pantallas distintas comparten datos por error.
