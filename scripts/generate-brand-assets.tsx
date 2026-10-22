import { mkdir, writeFile } from 'node:fs/promises';
import { appIcon } from '../lib/server/brand-art';
async function main() {
  await mkdir('public/pwa', { recursive: true });
  for (const size of [180, 192, 512]) {
    const response = appIcon(size);
    await writeFile(`public/pwa/icon-${size}.png`, new Uint8Array(await response.arrayBuffer()));
    console.log(`Generated NOSSOM icon ${size}×${size}`);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
