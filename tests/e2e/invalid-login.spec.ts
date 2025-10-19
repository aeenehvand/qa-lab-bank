import { test, expect } from '@playwright/test';

test('invalid login should not show a token', async ({ page }) => {
  // Go to the running local app (with basic auth)
  await page.goto('http://demo:secret@localhost:3001');

  // Try wrong credentials
  await page.fill('#email', 'wrong@bank.test');
  await page.fill('#password', 'wrongpass');
  await page.click('button:has-text("Login")');

  // Wait a little to simulate the login attempt
  await page.waitForTimeout(1000);

  // The token should remain empty
  const tokenText = (await page.locator('#token').textContent())?.trim() || '';
  expect(tokenText).toBe('');
});
