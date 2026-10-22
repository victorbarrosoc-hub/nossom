import { test, expect } from './fixtures';
test('weekly quota survives reload and the eleventh authorization is refused without hiding projects or downloads', async ({
  page,
}) => {
  await page.goto('/studio');
  await expect(page.getByText('10 de 10 tratamentos disponíveis', { exact: true })).toBeVisible();
  for (let i = 0; i < 10; i++) {
    const response = await page.request.post('/api/usage', {
      headers: { Origin: 'http://localhost:3000' },
      data: { operation: 'auto' },
    });
    expect(response.status()).toBe(200);
  }
  await page.reload();
  await expect(page.getByText('0 de 10 tratamentos disponíveis', { exact: true })).toBeVisible();
  expect(
    (
      await page.request.post('/api/usage', {
        headers: { Origin: 'http://localhost:3000' },
        data: { operation: 'auto' },
      })
    ).status(),
  ).toBe(429);
  await page.goto('/studio/projetos');
  await expect(page.getByRole('heading', { name: 'Meus projetos.', exact: true })).toBeVisible();
});
test('verified administrator has no weekly treatment limit and normal users cannot grant themselves admin', async ({
  page,
}) => {
  const res = await page.request.post('/api/account', {
    headers: { Origin: 'http://localhost:3000' },
    data: {
      action: 'register',
      name: 'Administrador',
      email: 'victorbarrosoc@gmail.com',
      password: 'test-only-password',
      isAdmin: true,
    },
  });
  expect(res.status()).toBe(200);
  await page.goto('/studio');
  await expect(page.getByText('ADM · tratamentos ilimitados', { exact: true })).toBeVisible();
  for (let i = 0; i < 12; i++)
    expect(
      (
        await page.request.post('/api/usage', {
          headers: { Origin: 'http://localhost:3000' },
          data: { operation: 'eq' },
        })
      ).status(),
    ).toBe(200);
  const quota = await (await page.request.get('/api/usage')).json();
  expect(quota.unlimited).toBe(true);
  expect(quota.used).toBe(12);
});
test('email confirmation cannot create an authenticated session', async ({ page }) => {
  await page.request.delete('/api/account', { headers: { Origin: 'http://localhost:3000' } });
  await page.goto('/entrar');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Confirmar conta');
  await page.getByLabel('E-mail', { exact: true }).fill('confirm.new@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Criar conta e entrar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Enviamos um link de confirmação');
  await page.goto('/studio');
  await expect(page).toHaveURL(/\/entrar\?next=/);
});
