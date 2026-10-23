import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
async function main() {
  await mkdir('public/pwa', { recursive: true });
  const artwork = await sharp('public/brand/silver-wave.png')
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile('public/brand/silver-wave.png', artwork);
  // Extra inset keeps the ribbon inside the safe area of mobile/desktop masks.
  const icon = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: '#040c2b' },
  })
    .composite([{ input: await sharp(artwork).resize(820, 820).toBuffer(), gravity: 'centre' }])
    .png()
    .toBuffer();
  for (const size of [64, 180, 192, 512, 1024]) {
    await writeFile(
      `public/pwa/icon-${size}.png`,
      await sharp(icon).resize(size, size).png({ compressionLevel: 9 }).toBuffer(),
    );
    console.log(`Generated NOSSOM icon ${size}×${size}`);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
