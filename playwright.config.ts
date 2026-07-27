import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.E2E_PORT ?? '3100'
const BASE_URL = `http://localhost:${PORT}`
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/whathome_e2e'

// Ensure globalSetup (which runs in this same process) sees the same value
// used for the webServer's own DATABASE_URL below.
process.env.DATABASE_URL = DATABASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run db:migrate && npm run build && npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      DATABASE_URL,
      PORT
    }
  }
})
