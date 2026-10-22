import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
function samples(wav: Buffer) {
  let offset = 12;
  while (offset + 8 < wav.length) {
    const size = wav.readUInt32LE(offset + 4);
    if (wav.toString('ascii', offset, offset + 4) === 'data') {
      const data = new Float32Array(size / 2);
      for (let i = 0; i < data.length; i++) data[i] = wav.readInt16LE(offset + 8 + i * 2) / 32768;
      return { data, offset: offset + 8 };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error('No PCM data');
}
function rms(data: Float32Array, start: number, end: number) {
  let sum = 0;
  const a = Math.round(start * 48000),
    b = Math.min(data.length, Math.round(end * 48000));
  for (let i = a; i < b; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / (b - a));
}
test('neural speech cleanup reduces measured background noise while preserving voice; zero strength preserves audio', async ({
  page,
}, testInfo) => {
  const clean = await readFile('tests/fixtures/synthetic-speech.wav');
  const noisy = Buffer.from(clean),
    source = samples(clean);
  let seed = 17;
  for (let i = 0; i < source.data.length; i++) {
    seed = (seed * 16807) % 2147483647;
    const noise = (seed / 2147483647 - 0.5) * 0.045;
    noisy.writeInt16LE(
      Math.round(Math.max(-0.99, Math.min(0.99, source.data[i] + noise)) * 32767),
      source.offset + i * 2,
    );
  }
  await page.goto('/studio');
  await page
    .getByLabel('Importar arquivo de áudio', { exact: true })
    .setInputFiles({ name: 'fala-com-ruido.wav', mimeType: 'audio/wav', buffer: noisy });
  await expect(page.getByRole('heading', { name: 'fala-com-ruido', exact: true })).toBeVisible({
    timeout: 90000,
  });
  const slider = page.getByRole('slider', { name: 'Intensidade do tratamento', exact: true });
  await slider.fill('0');
  await page.getByRole('button', { name: 'Aplicar tratamento', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Reduzir ruído · V1', exact: true })).toBeVisible({
    timeout: 90000,
  });
  const dryPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar WAV', exact: true }).click();
  const dry = samples(await readFile((await (await dryPromise).path())!)).data;
  const original = samples(noisy).data;
  expect(dry.length).toBe(original.length);
  let maxError = 0;
  for (let i = 0; i < dry.length; i++)
    maxError = Math.max(maxError, Math.abs(dry[i] - original[i]));
  expect(maxError).toBeLessThanOrEqual(2 / 32768);
  await slider.fill('100');
  await page.getByRole('button', { name: 'Aplicar tratamento', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Reduzir ruído · V2', exact: true })).toBeVisible({
    timeout: 90000,
  });
  const wetPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar WAV', exact: true }).click();
  const wet = samples(await readFile((await (await wetPromise).path())!)).data;
  expect(Math.abs(wet.length - original.length)).toBeLessThanOrEqual(1);
  const reductionDb =
    20 * Math.log10(rms(original, 0.25, 0.85) / Math.max(1e-9, rms(wet, 0.25, 0.85)));
  const voiceRetention = rms(wet, 2, 5) / rms(source.data, 2, 5);
  expect(reductionDb).toBeGreaterThan(12);
  expect(voiceRetention).toBeGreaterThan(0.35);
  expect(voiceRetention).toBeLessThan(1.6);
  await testInfo.attach('noise-measurement.json', {
    body: JSON.stringify({
      fixture: 'Flite synthetic speech + seeded white noise; not an Adobe comparison',
      reductionDb,
      voiceRetention,
      maxDryError: maxError,
    }),
    contentType: 'application/json',
  });
  console.log('Noise validation:', JSON.stringify({ reductionDb, voiceRetention }));
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole('button', { name: 'Áudio geral', exact: false }).click();
  await expect(page.getByRole('slider', { name: 'Piso de ruído', exact: true })).toBeVisible();
  await page.getByRole('slider', { name: 'Redução máxima de ruído', exact: true }).fill('42');
  await page.getByRole('button', { name: 'Estimar pelo áudio', exact: true }).click();
  await expect(page.getByText(/Piso estimado|Não encontrei uma pausa clara/)).toBeVisible();
});
