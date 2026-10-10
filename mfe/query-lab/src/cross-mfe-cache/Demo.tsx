import { StatusBadges } from '@/shared/docs/StatusBadges'
import { Button } from '@/shared/ui/button'
import { useCacheInventory, useTamperUsers, useUsersFromOtherMfe } from './hooks'

export function Demo() {
  const { data, status } = useUsersFromOtherMfe()
  const inventory = useCacheInventory()
  const { tamper, restore } = useTamperUsers()

  return (
    <>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">
          Lo que lee este componente de la clave <code>[&quot;users&quot;]</code>
        </h3>
        <StatusBadges items={{ status, 'datos en caché': data ? 'sí' : 'no', usuarios: data?.length }} />
        {data ? (
          <ul className="space-y-1 text-sm">
            {data.slice(0, 5).map((user) => (
              <li key={user.id}>
                {user.name} <span className="text-muted-foreground">— {user.email}</span>
              </li>
            ))}
            {data.length > 5 && <li className="text-muted-foreground">… y {data.length - 5} más</li>}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Todavía no hay datos bajo esa clave: nadie los ha cargado. Abra «Usuarios» en el menú y vuelva
            aquí; este componente no hace ninguna petición por su cuenta.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Todo lo que hay en la caché compartida</h3>
        <ul aria-label="Claves en la caché" className="bg-card space-y-1 rounded-md border p-3 font-mono text-xs">
          {inventory.length === 0 && <li className="text-muted-foreground">La caché está vacía.</li>}
          {inventory.map((entry) => (
            <li key={JSON.stringify(entry.key)}>
              {JSON.stringify(entry.key)} — {entry.status}, {entry.observers} observador(es)
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" size="sm" disabled={!data} onClick={tamper}>
            Alterar los datos de ese microfrontend
          </Button>
          <Button variant="outline" size="sm" onClick={() => restore()}>
            Restaurar desde el servidor
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Alterar no toca la base de datos, solo la caché del navegador. Después de alterar, abra «Usuarios» en el
          menú: verá los nombres modificados hasta que esos datos se vuelvan a pedir.
        </p>
      </div>
    </>
  )
}
