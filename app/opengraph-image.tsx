import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BrandMark } from '@/lib/server/brand-art';
export const alt = 'NOSSOM — Seu som, em outra escala. Trate áudios, isole vocais e crie.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default async function SocialImage() {
  const artwork = await readFile(path.join(process.cwd(), 'public/brand/chrome-wave-og.png'));
  const atmosphere = await readFile(
    path.join(process.cwd(), 'public/brand/blue-atmosphere-og.png'),
  );
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
        src={`data:image/png;base64,${atmosphere.toString('base64')}`}
        width={1200}
        height={675}
        alt=""
        style={{ position: 'absolute', left: 0, top: 0 }}
      />
      <svg
        width={1200}
        height={630}
        viewBox="0 0 1200 630"
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <path
            key={i}
            d={`M-20 ${28 + i * 8} C250 ${210 + i * 8},380 ${-70 + i * 8},660 ${160 + i * 8} S930 ${360 + i * 8},1240 ${260 + i * 8}`}
            fill="none"
            stroke="#9bddff"
            strokeOpacity=".32"
            strokeWidth=".8"
          />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={`M-20 ${400 + i * 8} C250 ${590 + i * 8},380 ${300 + i * 8},660 ${440 + i * 8} S930 ${650 + i * 8},1240 ${540 + i * 8}`}
            fill="none"
            stroke="#8bd3ff"
            strokeOpacity=".25"
            strokeWidth=".8"
          />
        ))}
      </svg>
      <img
        src={`data:image/png;base64,${artwork.toString('base64')}`}
        width={660}
        height={248}
        alt=""
        style={{ position: 'absolute', right: -10, top: 190 }}
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
            'linear-gradient(90deg, rgba(3,15,31,.8), rgba(3,15,31,.65) 38%, rgba(3,15,31,0) 72%)',
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
            fontSize: 70,
            lineHeight: 1.08,
            letterSpacing: -4,
            marginTop: 95,
          }}
        >
          <span>Seu som,</span>
          <span style={{ color: '#a3dcff' }}>em outra escala.</span>
        </div>
        <div style={{ display: 'flex', gap: 26, marginTop: 50, fontSize: 22 }}>
          <span style={{ color: '#bcd9ff' }}>Limpe sua voz.</span>
          <span style={{ color: '#a3dcff' }}>Isole vocais.</span>
          <span style={{ color: '#a3dcff' }}>Crie.</span>
        </div>
      </div>
    </div>,
    size,
  );
}
