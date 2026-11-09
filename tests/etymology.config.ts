import { defineConfig } from '@playwright/test'
import path from 'node:path'

export default defineConfig({
  testDir: './e2e',
  testMatch: [
    'etymology.spec.ts',
    'word-support.spec.ts',
    'learning-dictionaries.spec.ts',
    'unfamiliar-words.spec.ts',
    'dictionary-settings.spec.ts',
    'anki-dictation.spec.ts',
  ],
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
    cwd: path.resolve(__dirname, '..'),
    command: 'node_modules/.bin/vite --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
})
