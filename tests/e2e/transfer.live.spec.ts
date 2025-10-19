import { test, expect } from '@playwright/test';

test('login, list accounts (live), verify balances', async ({ page }) => {
  // 1. Open local app (no Basic Auth needed locally)
  await page.goto('http://localhost:3001');

  // 2. Login
  await page.fill('#email', 'demo@bank.test');
  await page.fill('#password', 'demo123');
  await page.click('button:has-text("Login")');

  // ✅ Wait for token text
  await expect(page.locator('text=Token:')).toContainText('demo-token');

  // 3. Load accounts
  await page.click('button:has-text("Load Accounts")');

  // ✅ Give the UI a short moment to render the JSON
  await page.waitForTimeout(1000);

  // ✅ Capture all visible text
  const accountsText = await page.locator('body').innerText();
  console.log('Live accounts text:', accountsText);

  // 4. Verify both demo accounts exist
  expect(accountsText).toContain('ACC-001');
  expect(accountsText).toContain('ACC-002');
});
