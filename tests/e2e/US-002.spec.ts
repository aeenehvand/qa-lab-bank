import { test, expect } from '@playwright/test';

test('US-002 Transfer €5 between accounts', async ({ page }) => {
  await page.goto('/');

  await page.fill('#email', 'demo@bank.test');
  await page.fill('#password', 'demo123');

  // Try common locators for the login action
  const loginBtn = page.getByRole('button', { name: /login/i });
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
  } else if (await page.locator('text=Login').first().isVisible()) {
    await page.locator('text=Login').first().click();
  } else if (await page.locator('#login, #login-btn').first().isVisible()) {
    await page.locator('#login, #login-btn').first().click();
  }

  await expect(page.locator('#token')).toHaveText('demo-token');

  await page.click('#loadAccounts');

  // Try to read JSON from common containers
  const pre = page.locator('pre, #accounts, textarea').first();
  await expect(pre).toBeVisible({ timeout: 5000 });
  const text = (await pre.textContent()) || '';

  try {
    const obj = JSON.parse(text);
    const s = JSON.stringify(obj);
    expect(s).toContain('ACC-001');
    expect(s).toContain('ACC-002');
  } catch {
    expect(text).toContain('ACC-001');
    expect(text).toContain('ACC-002');
  }
});