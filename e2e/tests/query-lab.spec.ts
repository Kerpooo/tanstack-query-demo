import { expect, test, type Page } from '@playwright/test'

const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

// Mismo orden que mfe/query-lab/src/concepts.ts
const SLUGS = [
  'use-query-basics',
  'cache-timing',
  'mutations',
  'optimistic-updates',
  'dependent-queries',
  'select-and-placeholder',
  'infinite-queries',
  'parallel-queries',
  'prefetching',
  'polling-and-retry',
  'set-query-data',
  'query-keys',
  'window-focus',
  'cancellation',
  'initial-data',
  'suspense',
  'global-status',
  'mutation-lifecycle',
  'imperative-api',
  'cross-mfe-cache',
  'cache-security',
]

const docs = (page: Page) => page.getByLabel('Documentación')
const demo = (page: Page) => page.getByLabel('Demo en vivo')

test.describe('Laboratorio de TanStack Query', () => {
  test('el menú del shell abre el laboratorio y redirige al primer concepto', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'TanStack Query' }).click()
    await expect(page).toHaveURL(/\/query\/use-query-basics$/)
    await expect(page.getByRole('navigation', { name: 'Conceptos de TanStack Query' }).getByRole('link')).toHaveCount(SLUGS.length)
  })

  for (const slug of SLUGS) {
    test(`${slug}: documentación en markdown arriba y demo debajo`, async ({ page }) => {
      await page.goto(`/query/${slug}`)

      // Cuadro de documentación con código resaltado...
      await expect(docs(page).locator('article pre code').first()).toBeVisible()
      // ...y la demo en vivo DEBAJO de él.
      await expect(demo(page)).toBeVisible()
      const docsBox = await docs(page).boundingBox()
      const demoBox = await demo(page).boundingBox()
      expect(docsBox!.y + docsBox!.height).toBeLessThanOrEqual(demoBox!.y + 1)
    })
  }

  test('use-query-basics: lista usuarios y refetch conserva los datos', async ({ page }) => {
    await page.goto('/query/use-query-basics')
    await expect(demo(page).getByText('Ana Torres')).toBeVisible()
    await demo(page).getByRole('button', { name: /refetch/ }).click()
    await expect(demo(page).getByText('Ana Torres')).toBeVisible()
  })

  test('mutations: agregar una tarea la muestra en la lista', async ({ page }) => {
    const title = unique('Lab')
    await page.goto('/query/mutations')
    await demo(page).getByLabel('Título de la tarea').fill(title)
    await demo(page).getByRole('button', { name: 'Agregar tarea' }).click()
    await expect(demo(page).getByText(title)).toBeVisible()
  })

  test('optimistic-updates: el cambio se revierte si el servidor falla', async ({ page }) => {
    const title = unique('Optimista')
    await page.goto('/query/mutations')
    await demo(page).getByLabel('Título de la tarea').fill(title)
    await demo(page).getByRole('button', { name: 'Agregar tarea' }).click()
    await expect(demo(page).getByText(title)).toBeVisible()

    await page.goto('/query/optimistic-updates')
    await demo(page).getByLabel('Forzar fallo del servidor').click()
    const checkbox = demo(page).getByRole('checkbox', { name: title })
    await checkbox.click()
    await expect(checkbox).toBeChecked() // optimista
    await expect(demo(page).getByText(/se revirtió el cambio/)).toBeVisible({ timeout: 10_000 })
    await expect(checkbox).not.toBeChecked() // rollback
  })

  test('dependent-queries: no hay petición hasta elegir un usuario', async ({ page }) => {
    const detailRequests: string[] = []
    page.on('request', (r) => /\/users\/[^/?]+$/.test(new URL(r.url()).pathname) && detailRequests.push(r.url()))

    await page.goto('/query/dependent-queries')
    await expect(demo(page).getByRole('button', { name: 'Ana Torres' })).toBeVisible()
    expect(detailRequests).toHaveLength(0)

    await demo(page).getByRole('button', { name: 'Ana Torres' }).click()
    await expect(demo(page).getByText(/ana@example.com/)).toBeVisible()
    expect(detailRequests.length).toBeGreaterThan(0)
  })

  test('infinite-queries: «Cargar más» agrega páginas hasta agotar los usuarios', async ({ page }) => {
    await page.goto('/query/infinite-queries')
    const items = demo(page).getByRole('listitem')
    const more = demo(page).getByRole('button', { name: 'Cargar más' })
    await expect(items.first()).toBeVisible()

    for (let i = 0; i < 8 && (await more.isEnabled()); i++) {
      const before = await items.count()
      await more.click()
      await expect(items).not.toHaveCount(before)
    }
    await expect(demo(page).getByText('No hay más usuarios.')).toBeVisible()
    await expect(more).toBeDisabled()
  })

  test('prefetching: pasar el mouse precarga el detalle', async ({ page }) => {
    await page.goto('/query/prefetching')
    const ana = demo(page).getByRole('button', { name: 'Ana Torres' })
    await ana.hover()
    await expect(demo(page).getByText('precargado').first()).toBeVisible()
    await ana.click()
    await expect(demo(page).getByText(/ana@example.com/)).toBeVisible()
  })

  test('polling-and-retry: con retry: 3 la consulta termina con éxito', async ({ page }) => {
    await page.goto('/query/polling-and-retry')
    await demo(page).getByRole('button', { name: 'Ejecutar con retry: 3' }).click()
    await expect(demo(page).getByText(/Éxito en el intento 3/)).toBeVisible({ timeout: 10_000 })

    await demo(page).getByRole('button', { name: 'Ejecutar con retry: 0' }).click()
    await expect(demo(page).getByText(/Falló:/)).toBeVisible()
  })

  test('set-query-data: no hace una petición extra de la lista', async ({ page }) => {
    await page.goto('/query/set-query-data')
    const requests = demo(page).getByText('peticiones de la lista:').locator('xpath=..')
    await expect(requests).toContainText(/\d+/)
    const before = await requests.textContent()

    await demo(page).getByRole('button', { name: 'Crear con setQueryData' }).click()
    await expect(demo(page).getByText(/Con setQueryData/).first()).toBeVisible()
    expect(await requests.textContent()).toBe(before)
  })

  test('cancellation: pedir otra cosa cancela la petición anterior en el navegador', async ({ page }) => {
    await page.goto('/query/cancellation')
    await demo(page).getByRole('button', { name: 'Pedir 3 s' }).click()
    await expect(demo(page).getByText(/inicia la petición de 3000 ms/)).toBeVisible()

    await demo(page).getByRole('button', { name: 'Pedir 5 s' }).click()
    await expect(demo(page).getByText(/se canceló la petición de 3000 ms/)).toBeVisible()

    await demo(page).getByRole('button', { name: 'Cancelar' }).click()
    await expect(demo(page).getByText(/se canceló la petición de 5000 ms/)).toBeVisible()
  })

  test('suspense: fallback, error en el ErrorBoundary y reintento', async ({ page }) => {
    await page.goto('/query/suspense')
    await expect(demo(page).getByText(/Informe generado a las/)).toBeVisible({ timeout: 10_000 })

    await demo(page).getByLabel('Forzar error del servidor').click()
    await expect(demo(page).getByRole('alert')).toContainText('El informe falló', { timeout: 10_000 })

    await demo(page).getByLabel('Forzar error del servidor').click()
    await demo(page).getByRole('button', { name: 'Reintentar' }).click()
    await expect(demo(page).getByText(/Informe generado a las/)).toBeVisible({ timeout: 10_000 })
  })

  test('window-focus: simular el foco vuelve a pedir y sin conexión queda en paused', async ({ page }) => {
    await page.goto('/query/window-focus')
    const requests = demo(page).getByText('petición n.º:').locator('xpath=..')
    await expect(requests).toContainText(/\d+/)
    const before = await requests.textContent()

    await demo(page).getByRole('button', { name: /pierde y recupera el foco/ }).click()
    await expect(requests).not.toHaveText(before!)

    await demo(page).getByRole('button', { name: 'Simular desconexión' }).click()
    await demo(page).getByRole('button', { name: /Volver a pedir/ }).click()
    await expect(demo(page).getByText('fetchStatus:').locator('xpath=..')).toContainText('paused')
    await demo(page).getByRole('button', { name: 'Restaurar conexión' }).click()
    await expect(demo(page).getByText('fetchStatus:').locator('xpath=..')).toContainText('idle')
  })

  test('query-keys: invalidar por prefijo solo refresca el grupo', async ({ page }) => {
    await page.goto('/query/query-keys')
    const counter = (name: string) => demo(page).getByRole('group', { name }).getByText('petición n.º:').locator('xpath=..')
    await expect(counter('tareas/1')).toContainText(/\d+/)
    const tareas = await counter('tareas/1').textContent()
    const usuarios = await counter('usuarios/1').textContent()

    await demo(page).getByRole('button', { name: 'Invalidar el grupo usuarios' }).click()

    await expect(counter('usuarios/1')).not.toHaveText(usuarios!)
    expect(await counter('tareas/1').textContent()).toBe(tareas)
  })

  test('imperative-api: fetchQuery reutiliza la caché fresca', async ({ page }) => {
    await page.goto('/query/imperative-api')
    const lines = demo(page).getByRole('list', { name: 'Registro de eventos' }).getByRole('listitem')
    await demo(page).getByRole('button', { name: 'fetchQuery' }).click()
    await expect(lines).toHaveCount(1)
    await demo(page).getByRole('button', { name: 'fetchQuery' }).click()
    await expect(lines).toHaveCount(2)
    const [first, second] = await lines.allTextContents()
    expect(first!.replace(/^\d+\. /, '')).toBe(second!.replace(/^\d+\. /, '')) // misma petición n.º y misma hora
  })

  test('cross-mfe-cache: lee la caché que llenó el microfrontend users y puede alterarla', async ({ page }) => {
    // Navegación interna (sin recargar): la caché del shell sobrevive entre microfrontends.
    const goTo = (path: string) =>
      page.evaluate((p) => {
        history.pushState({}, '', p)
        dispatchEvent(new PopStateEvent('popstate'))
      }, path)

    await page.goto('/users')
    await expect(page.getByRole('cell', { name: 'Ana Torres', exact: true })).toBeVisible()

    const userRequests: string[] = []
    page.on('request', (r) => new URL(r.url()).pathname === '/users' && userRequests.push(r.url()))
    await goTo('/query/cross-mfe-cache')

    // El lector no conoce a `users`, pero ve sus datos... sin hacer ninguna petición.
    await expect(demo(page).getByText('Ana Torres')).toBeVisible()
    await expect(demo(page).getByRole('list', { name: 'Claves en la caché' })).toContainText('["users"]')
    expect(userRequests).toHaveLength(0)

    // Envenenamiento: el microfrontend users muestra datos que el servidor nunca devolvió.
    await demo(page).getByRole('button', { name: 'Alterar los datos de ese microfrontend' }).click()
    await expect(demo(page).getByText('Ana Torres (alterado)')).toBeVisible()
    await goTo('/users')
    await expect(page.getByRole('cell', { name: 'Ana Torres (alterado)', exact: true })).toBeVisible()
  })

  test('cache-security: el escáner encuentra datos sensibles y cerrar sesión limpia la caché', async ({ page }) => {
    await page.goto('/query/cache-security')
    await demo(page).getByRole('button', { name: 'Sembrar una sesión de ejemplo en la caché' }).click()
    await demo(page).getByRole('button', { name: 'Escanear la caché' }).click()
    await expect(demo(page).getByRole('list', { name: 'Hallazgos' })).toContainText('token o password')

    await demo(page).getByRole('button', { name: 'Cerrar sesión (clear)' }).click()
    await expect(demo(page).getByText('consultas en caché:').locator('xpath=..')).toContainText('0')
    await demo(page).getByRole('button', { name: 'Escanear la caché' }).click()
    await expect(demo(page).getByText(/Sin hallazgos/)).toBeVisible()
  })

  test('una URL profunda recarga el concepto correcto', async ({ page }) => {
    await page.goto('/query/set-query-data')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'setQueryData' })).toBeVisible()
  })

  test('standalone en :4003', async ({ page }) => {
    await page.goto('http://localhost:4003')
    await expect(page).toHaveURL(/:4003\/query\/use-query-basics$/)
    await expect(docs(page).locator('article pre code').first()).toBeVisible()
  })
})
