import { expect, test } from '../template/node_modules/@playwright/test/index.mjs'

test('a price selection reaches the submitted request', async ({ page }) => {
  let submitted
  await page.route('**/api/requests', async (route) => {
    submitted = route.request().postDataJSON()
    await route.fulfill({ json: { doc: { id: 1 } } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Solo lo imprescindible' }).click()
  await page.getByRole('link', { name: 'Me interesa' }).click()
  await expect(page).toHaveURL(/\?tarifa=42#contacto$/)
  await expect(page.getByRole('combobox', { name: 'Me interesa', exact: true })).toHaveValue('42')
  await expect(page.getByLabel('Ciudad', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Fecha', { exact: true })).toHaveCount(0)
  await page.getByLabel('Nombre*', { exact: true }).fill('María')
  await page.getByLabel('Email*', { exact: true }).fill('maria@example.test')
  await page.getByLabel('Cuéntanos').fill('Quiero información')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Recibido')
  expect(submitted).toMatchObject({ interest: 42, name: 'María', consent: true })
})

test('consent gates players and can be withdrawn', async ({ page }) => {
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ body: '<html>Player fixture</html>', contentType: 'text/html' }),
  )
  await page.goto('/')
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click()
  await expect(page.locator('iframe')).toHaveCount(1)
  await page.getByRole('button', { name: 'Retirar consentimiento' }).click()
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('iframe')).toHaveCount(0)
})

test('mobile navigation opens and closes after selecting a destination', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Solo lo imprescindible' }).click()
  if (testInfo.project.name === 'mobile')
    await page.getByRole('button', { name: 'Abrir menú' }).click()
  await page.getByRole('link', { name: 'Contacto', exact: true }).click()
  if (testInfo.project.name === 'mobile')
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  await expect(page).toHaveURL(/#contacto$/)
})

test('a refused submission explains the problem and keeps the message', async ({ page }) => {
  await page.route('**/api/requests', (route) =>
    route.fulfill({ status: 429, json: { errors: [{ message: 'Espera unos minutos.' }] } }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Solo lo imprescindible' }).click()
  await page.getByLabel('Nombre*', { exact: true }).fill('María')
  await page.getByLabel('Email*', { exact: true }).fill('maria@example.test')
  await page.getByLabel('Cuéntanos').fill('Quiero información')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Espera unos minutos.')
  await expect(page.getByLabel('Cuéntanos')).toHaveValue('Quiero información')
})
