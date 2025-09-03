import { test, expect } from '@playwright/test';

test('login, list accounts, transfer €5', async ({ page }) => {
  // 1. Open local app (with Basic Auth)
  await page.goto('http://demo:secret@localhost:3001');

  // 2. Login
  await page.fill('#email', 'demo@bank.test');
  await page.fill('#password', 'demo123');
  await page.click('button:has-text("Login")');

  // ✅ Wait until token appears
  await expect(page.locator('#token')).toHaveText(/demo-token/);

  // 3. List accounts
  await page.click('#loadAccounts');
  const accountsBefore = await page.locator('#accountsResult').textContent();
  console.log('Accounts before transfer:', accountsBefore);

  // 4. Transfer €5
  await page.click('#transfer5');
  const accountsAfter = await page.locator('#accountsResult').textContent();
  console.log('Accounts after transfer:', accountsAfter);

  // Ensure accounts changed
  expect(accountsAfter).not.toEqual(accountsBefore);
});
