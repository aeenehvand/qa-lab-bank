import { test, expect, request } from '@playwright/test';

test('US-003 Accounts API returns ACC-001 and ACC-002', async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3001';
  const auth = 'Basic ' + Buffer.from('demo:secret').toString('base64');

  const ctx = await request.newContext({
    baseURL,
    extraHTTPHeaders: { Authorization: auth },
  });

  const res = await ctx.get('/accounts');
  expect(res.status()).toBe(200);

  const data = await res.json();
  const s = JSON.stringify(data);
  expect(s).toContain('ACC-001');
  expect(s).toContain('ACC-002');

  await ctx.dispose();
});
