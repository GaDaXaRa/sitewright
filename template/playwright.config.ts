import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    // npm, no pnpm: el proyecto se instala con `package-lock.json`, y `pnpm dev` no
    // arranca el servidor sino una instalación entera de pnpm que sustituye `node_modules`
    // por su esquema de enlaces. Eso dejaba el proyecto a medias (paquetes convertidos en
    // enlaces rotos, binarios sin permiso de ejecución) y los e2e sin poder arrancar.
    command: 'npm run dev',
    reuseExistingServer: true,
    url: 'http://localhost:3000',
    // Que un e2e no pueda mandar correo real si algún día envía el formulario.
    // Ojo: con reuseExistingServer, si ya hay un servidor levantado manda el suyo.
    env: { EMAIL_DESACTIVADO: '1' },
  },
})
