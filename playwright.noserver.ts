import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,

  retries: 0,
  forbidOnly: !!process.env.CI,
  fullyParallel: false,

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
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
});
