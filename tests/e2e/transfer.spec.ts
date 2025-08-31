import { test, expect } from '@playwright/test';

test('login, list accounts, transfer €5', async ({ page }) => {
  // 1. Open the local UI (update the path if your username is different)
  await page.goto('file:///Users/faeenehvand/Desktop/qa-lab-bank/app/web/index.html');

  // 2. Login
  await page.fill('#email', 'demo@bank.test');
  await page.fill('#password', 'demo123');
  await page.click('button:has-text("Login")');
  await expect(page.locator('#token')).not.toHaveText('(none)');

  // 3. List accounts
  await page.click('#loadAccounts');
  const accountsBefore = await page.locator('#accountsResult').textContent();
  console.log('Accounts before transfer:', accountsBefore);

  // 4. Transfer €5
  await page.click('#transfer5');
  const transferResult = await page.locator('#transferResult').textContent();
  console.log('Transfer result:', transferResult);

  // 5. Verify accounts updated
  const accountsAfter = await page.locator('#accountsResult').textContent();
  console.log('Accounts after transfer:', accountsAfter);
  expect(accountsAfter).not.toEqual(accountsBefore);
});
