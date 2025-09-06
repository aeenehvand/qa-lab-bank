// tests/e2e/US-001.spec.ts
import { test, expect } from '@playwright/test';

test('US-001 Login succeeds with valid credentials', async ({ page }) => {
  // baseURL + basic-auth are configured in playwright config
  await page.goto('/');

  // Fill and login
  await page.fill('#email', 'demo@bank.test');
  await page.fill('#password', 'demo123');

  // Click Login (robust fallbacks)
  if (await page.locator('#login-btn').isVisible()) {
    await page.click('#login-btn');
  } else if (await page.getByRole('button', { name: /login/i }).isVisible()) {
    await page.getByRole('button', { name: /login/i }).click();
  } else {
    await page.locator('text=Login, #login').first().click();
  }

  // Token should appear
  await expect(page.locator('#token')).toHaveText('demo-token', { timeout: 5000 });

  // Load accounts and wait for the network + DOM update
  const accountsResp = page.waitForResponse(r => r.url().endsWith('/accounts') && r.ok());
  await page.click('#loadAccounts');
  await accountsResp;

  // Assert the rendered JSON contains both account IDs
  const pre = page.locator('pre.accounts');
  await expect(pre).toBeVisible({ timeout: 5000 });
  await expect(pre).toContainText('ACC-001', { timeout: 5000 });
  await expect(pre).toContainText('ACC-002', { timeout: 5000 });
});
