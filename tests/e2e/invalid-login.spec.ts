import { test, expect } from '@playwright/test';

test('invalid login should not show a token', async ({ page }) => {
  await page.goto('file:///Users/faeenehvand/Desktop/qa-lab-bank/app/web/index.html');

  // Try wrong credentials
  await page.fill('#email', 'wrong@bank.test');
  await page.fill('#password', 'badpass');
  await page.click('button:has-text("Login")');

  // Expect token to remain (none)
  await expect(page.locator('#token')).toHaveText('(none)');
});
