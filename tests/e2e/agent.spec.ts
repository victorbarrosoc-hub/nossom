import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Console agent setup sends IDs with the private access code, continues the conversation and only selects a treatment after review', async ({
  page,
}) => {
  const config = { agentId: 'agent_test12345678', environmentId: 'env_test12345678' };
  let connected = false;
  let turns = 0;
  let closed = false;
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({
      json: {
        configured: true,
        authorized: connected,
        model: 'claude-sonnet-5-5',
        effort: 'high',
        missing: [],
        mode: connected ? 'managed' : 'messages',
        ...(connected ? config : {}),
      },
    }),
  );
  await page.route('**/api/ai/session', async (route) => {
    const body = route.request().postDataJSON();
    expect(body).toEqual({ code: 'test-access-not-a-real-code', mode: 'managed', ...config });
    connected = true;
    await route.fulfill({
      json: { connected: true, model: 'claude-sonnet-5-5', effort: 'high', mode: 'managed' },
    });
  });
  await page.route('**/api/ai/assistant', async (route) => {
    const body = route.request().postDataJSON();
    if (route.request().method() === 'DELETE') {
      expect(body.conversation).toBe('test-conversation-2');
      closed = true;
      return route.fulfill({ json: { closed: true } });
    }
    expect(body.conversation).toBe(turns ? 'test-conversation-1' : undefined);
    turns++;
    return route.fulfill({
      json: {
        reply: `Sugestão ${turns}: mais presença.`,
        operation: 'eq',
        intensity: 65,
        eqPreset: 'presence',
        conversation: `test-conversation-${turns}`,
      },
    });
  });
  await page.goto(`/studio/ia?${new URLSearchParams(config)}`);
  await expect(page.getByLabel('IA da plataforma', { exact: true })).toHaveValue('managed');
  await expect(page.getByLabel('Agent ID', { exact: true })).toHaveValue(config.agentId);
  await expect(page.getByLabel('Environment ID', { exact: true })).toHaveValue(
    config.environmentId,
  );
  await page.getByLabel('Código de acesso da NOSSOM').fill('test-access-not-a-real-code');
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Conectar meu agente', exact: true }).click();
  await expect(page.locator('.connection-status')).toContainText('Conectado nesta sessão');
  await expect(page.locator('.ai-model-detail')).toContainText(config.agentId);
  await page.goto('/studio');
  await page.locator('.assistant-top').click();
  await expect(page.getByText('Seu agente Claude · esforço alto', { exact: true })).toBeVisible();
  await page.getByLabel('Descreva seu objetivo').fill('Mais presença na voz.');
  await page.getByRole('button', { name: 'Encontrar tratamento', exact: true }).click();
  await expect(page.getByText('Sugestão 1: mais presença.', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/studio$/);
  await page.getByLabel('Descreva seu objetivo').fill('E a equalização?');
  await page.getByRole('button', { name: 'Encontrar tratamento', exact: true }).click();
  await expect(page.getByText('Sugestão 2: mais presença.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Revisar tratamento', exact: true }).click();
  await expect(page).toHaveURL(/\/studio\/equalizacao$/);
  await expect.poll(() => closed).toBe(true);
  await page.goto('/studio/ia');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});
