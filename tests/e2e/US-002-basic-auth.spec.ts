// tests/e2e/US-002-basic-auth.spec.ts
import { test, expect } from '@playwright/test';

test('US-002 Root without Basic Auth returns 401', async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3001';

  // No Authorization header → should be 401 due to Basic Auth middleware
  const res = await fetch(baseURL, { method: 'GET' });

  expect(res.status).toBe(401);
  const www = res.headers.get('www-authenticate') || '';
  expect(www).toMatch(/Basic/i);
});
