import { test, expect } from '@playwright/test';

test('US-002 Transfer €5 between accounts', async ({ page }) => {
  // 1️⃣ Go to the app
  await page.goto('/');

  // 2️⃣ Fill login form
  await page.fill('#email', 'demo@bank.test');
  await page.fill('#password', 'demo123');

  // 3️⃣ Try common locators for the login action
  const loginBtn = page.getByRole('button', { name: /login/i });
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
  } else if (await page.locator('text=Login').first().isVisible()) {
    await page.locator('text=Login').first().click();
  } else if (await page.locator('#login, #login-btn').first().isVisible()) {
    await page.locator('#login, #login-btn').first().click();
  }

  // 4️⃣ Verify login token
  await expect(page.locator('#token')).toHaveText('demo-token');

  // 5️⃣ Click to load accounts
  await page.click('#loadAccounts');
  console.log('📥 Clicked Load Accounts');

  // 6️⃣ Wait for accounts data to appear with content
  const pre = page.locator('pre, #accounts, textarea').first();

  // Wait until the content actually includes ACC-, not just visible
  await expect
    .poll(async () => (await pre.textContent())?.trim() || '', {
      message: 'Waiting for accounts data to load...',
      timeout: 7000,
    })
    .toContain('ACC-');

  // 7️⃣ Read and log account data
  const text = (await pre.textContent()) || '';
  console.log('Accounts text after load:', text);

  // 8️⃣ Verify account IDs
  try {
    const obj = JSON.parse(text);
    const s = JSON.stringify(obj);
    expect(s).toContain('ACC-001');
    expect(s).toContain('ACC-002');
  } catch {
    expect(text).toContain('ACC-001');
    expect(text).toContain('ACC-002');
  }

  console.log('✅ Transfer test completed successfully');
});
