import { test as base, expect } from '@playwright/test';
export { expect };
export type { Page } from '@playwright/test';
export const test = base.extend({
  page: async ({ page }, use) => {
    const response = await page.request.post('/api/account', {
      headers: { Origin: 'http://localhost:3000' },
      data: {
        action: 'register',
        name: 'Pessoa de teste',
        email: 'test.' + crypto.randomUUID() + '@example.test',
        password: 'valid-test-password',
      },
    });
    expect(response.status()).toBe(200);
    await use(page);
  },
});
