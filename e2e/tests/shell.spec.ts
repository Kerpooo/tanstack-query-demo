import { expect, test } from '@playwright/test'

const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
const cardTitle = (text: string) => `[data-slot="card-title"]:text-is("${text}")`

test.describe('Shell y navegación', () => {
  test('redirige / a tareas y muestra el menú', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/tasks$/)
    await expect(page.getByRole('heading', { name: 'poc-rq' })).toBeVisible()
    await expect(page.locator(cardTitle('Tareas'))).toBeVisible()
  })

  test('navega entre microfrontends sin recargar la página', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Usuarios' }).click()
    await expect(page).toHaveURL(/\/users$/)
    await expect(page.locator(cardTitle('Usuarios'))).toBeVisible()

    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Tareas' }).click()
    await expect(page.locator(cardTitle('Tareas'))).toBeVisible()
  })

  test('una URL profunda carga el microfrontend correcto', async ({ page }) => {
    await page.goto('/users/new')
    await expect(page.locator(cardTitle('Nuevo usuario'))).toBeVisible()
  })
})

test.describe('Microfrontend de tareas', () => {
  test('crear, completar y eliminar una tarea', async ({ page }) => {
    const title = unique('Tarea e2e')
    await page.goto('/tasks')

    await page.getByLabel('Nueva tarea').fill(title)
    await page.getByRole('button', { name: 'Agregar' }).click()

    const row = page.getByRole('listitem').filter({ hasText: title })
    await expect(row).toBeVisible()

    const checkbox = row.getByRole('checkbox')
    await checkbox.click()
    await expect(checkbox).toBeChecked()

    await page.getByRole('button', { name: `Eliminar ${title}` }).click()
    await expect(row).toHaveCount(0)
  })

  test('las tareas persisten al recargar (SQLite)', async ({ page }) => {
    const title = unique('Persistente')
    await page.goto('/tasks')
    await page.getByLabel('Nueva tarea').fill(title)
    await page.getByRole('button', { name: 'Agregar' }).click()
    await expect(page.getByText(title)).toBeVisible()

    await page.reload()
    await expect(page.getByText(title)).toBeVisible()

    await page.getByRole('button', { name: `Eliminar ${title}` }).click()
    await expect(page.getByText(title)).toHaveCount(0)
  })
})

test.describe('Microfrontend de usuarios (CRUD en páginas)', () => {
  test('lista los usuarios de ejemplo', async ({ page }) => {
    await page.goto('/users')
    await expect(page.getByRole('cell', { name: 'Ana Torres', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'luis@example.com' })).toBeVisible()
  })

  test('crear, editar y eliminar un usuario recorriendo las páginas', async ({ page }) => {
    const name = unique('Usuario')
    const email = `${unique('u')}@example.com`

    // Crear
    await page.goto('/users')
    await page.getByRole('link', { name: 'Nuevo usuario', exact: true }).click()
    await expect(page).toHaveURL(/\/users\/new$/)
    await page.getByLabel('Nombre').fill(name)
    await page.getByLabel('Correo').fill(email)
    await page.getByRole('button', { name: 'Crear usuario' }).click()

    await expect(page).toHaveURL(/\/users$/)
    const row = page.getByRole('row').filter({ hasText: email })
    await expect(row).toContainText(name)

    // Editar
    await row.getByRole('link', { name: `Editar ${name}` }).click()
    await expect(page).toHaveURL(/\/users\/[^/]+\/edit$/)
    await expect(page.getByLabel('Nombre')).toHaveValue(name)
    const renamed = `${name} editado`
    await page.getByLabel('Nombre').fill(renamed)
    await page.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(page).toHaveURL(/\/users$/)
    await expect(page.getByRole('row').filter({ hasText: email })).toContainText(renamed)

    // Eliminar (con confirmación)
    await page.getByRole('button', { name: `Eliminar ${renamed}` }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toContainText(`¿Eliminar a ${renamed}?`)
    await dialog.getByRole('button', { name: 'Eliminar' }).click()
    await expect(page.getByRole('row').filter({ hasText: email })).toHaveCount(0)
  })

  test('valida el formulario antes de enviarlo', async ({ page }) => {
    await page.goto('/users/new')
    await page.getByLabel('Correo').fill('no-es-correo')
    await page.getByRole('button', { name: 'Crear usuario' }).click()
    await expect(page.getByText('El nombre es obligatorio')).toBeVisible()
    await expect(page.getByText('Ingrese un correo válido')).toBeVisible()
    await expect(page).toHaveURL(/\/users\/new$/)
  })

  test('muestra el error de la API si el correo ya existe', async ({ page }) => {
    await page.goto('/users/new')
    await page.getByLabel('Nombre').fill('Otra Ana')
    await page.getByLabel('Correo').fill('ana@example.com')
    await page.getByRole('button', { name: 'Crear usuario' }).click()
    await expect(page.getByText('Ya existe un usuario con ese correo')).toBeVisible()
  })

  test('cancelar la eliminación conserva al usuario', async ({ page }) => {
    await page.goto('/users')
    await page.getByRole('button', { name: 'Eliminar Marta Gómez' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByRole('cell', { name: 'Marta Gómez', exact: true })).toBeVisible()
  })

  test('muestra un error si la API no responde', async ({ page }) => {
    await page.route('http://localhost:3000/users', (route) => route.abort())
    await page.goto('/users')
    await expect(page.getByText(/Error:/)).toBeVisible()
  })
})

test.describe('Microfrontends en modo standalone', () => {
  test('tasks en :4001', async ({ page }) => {
    await page.goto('http://localhost:4001')
    await expect(page).toHaveURL(/:4001\/tasks$/)
    await expect(page.getByLabel('Nueva tarea')).toBeVisible()
  })

  test('users en :4002 (incluye rutas profundas)', async ({ page }) => {
    await page.goto('http://localhost:4002')
    await expect(page.getByRole('cell', { name: 'Ana Torres', exact: true })).toBeVisible()
    await page.goto('http://localhost:4002/users/new')
    await expect(page.locator(cardTitle('Nuevo usuario'))).toBeVisible()
  })
})
