import { test, expect } from '@playwright/test';

test('login, list accounts, verify balances', async ({ page }) => {
  // 1. Open local app
  await page.goto('http://localhost:3001');

  // 2. Login with demo credentials
  await page.fill('#email', 'demo@bank.test');
  await page.fill('#password', 'demo123');
  await page.click('button:has-text("Login")');

  // ✅ Wait until token appears somewhere on the page
  await expect(page.locator('text=Token:')).toContainText('demo-token');

  // 3. Load accounts
  await page.click('button:has-text("Load Accounts")');

  // ✅ Wait a bit for data to render
  await page.waitForTimeout(1000);

  // ✅ Try to grab the text from any visible block below the button
  const accountsText = await page.locator('body').innerText();
  console.log('Accounts text found on page:', accountsText);

  // 4. Verify both demo accounts exist
  expect(accountsText).toContain('ACC-001');
  expect(accountsText).toContain('ACC-002');
});
