import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BrandMark } from '@/lib/server/brand-art';
export const alt = 'NOSSOM — Seu som, em outra escala. Trate áudios, isole vocais e crie.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default async function SocialImage() {
  const artwork = await readFile(path.join(process.cwd(), 'public/brand/chrome-wave-og.png'));
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at 75% 25%, #365d7a, #101d2c 55%, #080f18)',
        position: 'relative',
        overflow: 'hidden',
        color: '#f3f7ff',
      }}
    >
      <img
        src={`data:image/png;base64,${artwork.toString('base64')}`}
        width={760}
        height={380}
        alt=""
        style={{ position: 'absolute', right: -90, top: 115 }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(90deg, #101d2c 0%, rgba(16,29,44,.8) 40%, rgba(16,29,44,0) 75%)',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '58px 64px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <BrandMark width={64} height={34} />
          <span style={{ fontSize: 25, letterSpacing: 10 }}>NOSSOM</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 76,
            lineHeight: 1.08,
            letterSpacing: -4,
            marginTop: 95,
          }}
        >
          <span>Seu som,</span>
          <span style={{ color: '#d3e1ed' }}>em outra escala.</span>
        </div>
        <div style={{ display: 'flex', gap: 26, marginTop: 50, fontSize: 22 }}>
          <span style={{ color: '#bcd9ff' }}>Limpe sua voz.</span>
          <span style={{ color: '#d3e1ed' }}>Isole vocais.</span>
          <span style={{ color: '#d3e1ed' }}>Crie.</span>
        </div>
      </div>
    </div>,
    size,
  );
}
