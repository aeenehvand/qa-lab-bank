import { test, expect } from './.auth';

test('login, list, transfer €5 (live)', async ({ page }) => {
  await page.goto('https://qa-lab-bank.onrender.com');

  // Login
  await page.fill('#email', 'demo@bank.test');
  await page.fill('#password', 'demo123');
  await page.click('button:has-text("Login")');
  await expect(page.locator('#token')).not.toHaveText('(none)');

  // First list of accounts
  await page.click('#loadAccounts');
  await expect(page.locator('#accountsResult')).toContainText('"ACC-001"');
  const before = (await page.locator('#accountsResult').textContent()) ?? '';

  // Transfer €5 and wait for API confirmation
  await page.click('#transfer5');
  await expect(page.locator('#transferResult')).toContainText('"ok": true');

  // Refresh accounts and compare
  await page.click('#loadAccounts');
  await expect(page.locator('#accountsResult')).toContainText('"ACC-002"'); // sanity check present
  const after = (await page.locator('#accountsResult').textContent()) ?? '';

  expect(after).not.toEqual(before);
});
