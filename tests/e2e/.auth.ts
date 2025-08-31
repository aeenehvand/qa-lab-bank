import { test as base } from '@playwright/test';
export const test = base.extend({
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      httpCredentials: { username: 'demo', password: 'secret' }
    });
    await use(context);
    await context.close();
  }
});
export { expect } from '@playwright/test';
