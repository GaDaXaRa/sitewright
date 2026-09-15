import { defineConfig, devices } from '../template/node_modules/@playwright/test/index.mjs'
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.mjs',
  outputDir: '../test-results/browser',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command:
      'node ../template/node_modules/vite/bin/vite.js --config vite.config.mjs --configLoader native',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
})
