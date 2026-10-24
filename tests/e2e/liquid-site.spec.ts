// Public homepage only: no account is needed.
import { test, expect } from '@playwright/test';

test('glass navigation follows the pointer and the section, shrinks on scroll and keeps interface sounds optional', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const created: string[] = [];
    (window as unknown as { uiSounds: string[] }).uiSounds = created;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      created.push('osc');
      return original.call(this);
    };
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });
  await nav.getByRole('link', { name: 'Planos', exact: true }).hover();
  await expect(nav.locator('a', { hasText: 'Planos' }).locator('.nav-lens')).toHaveCount(1);
  await expect(page.locator('.ns-header')).not.toHaveClass(/is-scrolled/);
  await page.evaluate(() => scrollTo({ top: document.getElementById('planos')!.offsetTop }));
  await expect(page.locator('.ns-header')).toHaveClass(/is-scrolled/);
  await page.mouse.move(5, 500);
  await expect(nav.locator('a[aria-current="true"]')).toHaveText('Planos');

  // Sounds are synthesized after a click and stop once the person turns them off.
  const sounds = () =>
    page.evaluate(() => (window as unknown as { uiSounds: string[] }).uiSounds.length);
  await nav.getByRole('link', { name: 'Como funciona', exact: true }).click();
  await nav.getByRole('link', { name: 'Planos', exact: true }).click();
  await expect.poll(sounds).toBeGreaterThan(0);
  const toggle = page.getByRole('button', { name: 'Sons da interface' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  const before = await sounds();
  await nav.getByRole('link', { name: 'Como funciona', exact: true }).click();
  await page.waitForTimeout(200);
  expect(await sounds()).toBe(before);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sons da interface' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('mobile plans swipe sideways without widening the page and step art rests under reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const grid = page.locator('.plans-grid');
  await grid.scrollIntoViewIfNeeded();
  expect(await grid.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await page
      .locator('.step-art .bar')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  const link = page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('link', { name: 'Planos', exact: true });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.getByRole('button', { name: 'Abrir menu', exact: true })).toBeVisible();
});
test('the floating capsule stays below the iPhone status bar safe area, at rest and while scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  // Chromium reports no safe area; emulate an iPhone status bar of 59 px.
  await page.addStyleTag({ content: '.chrome-site .ns-header{--safe-top:59px}' });
  const top = () => page.locator('.ns-nav').evaluate((el) => el.getBoundingClientRect().top);
  expect(await top()).toBeGreaterThanOrEqual(59 + 8);
  await page.evaluate(() => scrollTo({ top: 1600, behavior: 'instant' }));
  await expect(page.locator('.ns-header')).toHaveClass(/is-scrolled/);
  expect(await top()).toBeGreaterThanOrEqual(59 + 8);
});
