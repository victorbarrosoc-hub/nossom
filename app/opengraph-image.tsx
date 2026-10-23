import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export const alt = 'NOSSOM — Seu som, em outra escala. Trate áudios, isole vocais e crie.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default async function SocialImage() {
  const artwork = await readFile(path.join(process.cwd(), 'public/brand/silver-wave.png'));
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#060e24',
        position: 'relative',
        overflow: 'hidden',
        color: '#f3f7ff',
      }}
    >
      <img
        src={`data:image/png;base64,${artwork.toString('base64')}`}
        width={750}
        height={750}
        alt=""
        style={{ position: 'absolute', right: -70, top: -70 }}
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
            'linear-gradient(90deg, #060e24 5%, rgba(6,14,36,.95) 35%, rgba(6,14,36,0) 80%)',
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
        <span style={{ fontSize: 25, letterSpacing: 10 }}>NOSSOM</span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 84,
            lineHeight: 1.08,
            letterSpacing: -4,
            marginTop: 95,
          }}
        >
          <span>Seu som,</span>
          <span style={{ color: '#b8cefa' }}>em outra escala.</span>
        </div>
        <div style={{ display: 'flex', gap: 26, marginTop: 50, fontSize: 22 }}>
          <span style={{ color: '#bcd9ff' }}>Trate áudios.</span>
          <span style={{ color: '#d3b9ff' }}>Isole vocais.</span>
          <span style={{ color: '#ffbda8' }}>Crie.</span>
        </div>
      </div>
    </div>,
    size,
  );
}
