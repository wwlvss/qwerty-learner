import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'etymology.spec.ts',
  outputDir: '../test-results/etymology',
  timeout: 30000,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  webServer: {
    command: 'node_modules/.bin/vite --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
})
