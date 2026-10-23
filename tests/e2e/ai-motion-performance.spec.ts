import { test, expect } from './fixtures';
test('wave uses fixed geometry, pauses outside the viewport and stops in a hidden tab', async ({
  page,
}) => {
  await page.goto('/');
  const wave = page.locator('.home-ai-presence .ai-motion');
  await wave.scrollIntoViewIfNeeded();
  await expect(wave).toHaveClass(/is-running/);
  const mutations = await wave.evaluate(async (el) => {
    let changes = 0;
    const o = new MutationObserver((records) => {
      changes += records.filter((r) => r.attributeName === 'd').length;
    });
    o.observe(el, { subtree: true, attributes: true, attributeFilter: ['d'] });
    await new Promise((r) => setTimeout(r, 1000));
    o.disconnect();
    return changes;
  });
  expect(mutations).toBe(0);
  await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await expect(wave).not.toHaveClass(/is-running/);
  await expect(wave.locator('svg')).toHaveCSS('animation-play-state', 'paused');
  await wave.scrollIntoViewIfNeeded();
  await expect(wave).toHaveClass(/is-running/);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(wave).not.toHaveClass(/is-running/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(wave.locator('svg')).toHaveCSS('animation-name', 'none');
});
