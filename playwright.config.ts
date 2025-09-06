import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,

  retries: 0,
  forbidOnly: !!process.env.CI,
  fullyParallel: false,

  use: {
    baseURL: BASE_URL,
    httpCredentials: { username: 'demo', password: 'secret' },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  webServer: {
    command: 'node server.cjs',     // <-- use the root server
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
