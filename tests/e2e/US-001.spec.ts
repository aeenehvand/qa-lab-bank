import { test, expect } from '@playwright/test';

test('US-001 Login succeeds with valid credentials (debug)', async ({ page }) => {
  await page.goto('http://localhost:3001');

  // 1️⃣ Wait for login form
  await page.waitForSelector('#login-btn', { state: 'visible', timeout: 10000 });
  console.log('✅ Login button found');

  // 2️⃣ Fill and click login
  await page.fill('#email', 'demo@bank.test');
  await page.fill('#password', 'demo123');
  await page.click('#login-btn');
  console.log('🖱️ Clicked login');

  // 3️⃣ Wait for token
  await page.waitForTimeout(1500);
  const tokenText = (await page.locator('#token').textContent())?.trim() || '';
  console.log('Token text after login:', tokenText);
  expect(tokenText).toContain('demo-token');

  // 4️⃣ Click Load Accounts
  await page.waitForSelector('#loadAccounts', { state: 'visible', timeout: 5000 });
  await page.click('#loadAccounts');
  console.log('📥 Clicked Load Accounts');

  // 5️⃣ Wait up to 5 seconds for accounts data to appear
  await page.waitForTimeout(2000);

  // Try all common containers where accounts may appear
  const possibleLocators = ['#accountsResult', 'pre', '#accounts', 'textarea'];
  let accountsText = '';
  for (const sel of possibleLocators) {
    if (await page.locator(sel).isVisible()) {
      accountsText = (await page.locator(sel).textContent())?.trim() || '';
      console.log(`🔍 Found accounts text in ${sel}:`, accountsText);
      break;
    }
  }

  // 6️⃣ Check we actually found something
  expect(accountsText.length).toBeGreaterThan(0);

  // 7️⃣ Validate account content
  expect(accountsText).toContain('ACC-001');
  expect(accountsText).toContain('ACC-002');
});
