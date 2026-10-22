import { ImageResponse } from 'next/og';
import { BrandMark } from '@/lib/server/brand-art';
export const alt = 'NOSSOM — O som em outra escala. Crie, trate e entregue seu áudio.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function SocialImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        color: '#f4f7fc',
        background: 'radial-gradient(ellipse at 65% 25%, #2b4264, #080e16 90%)',
        padding: '48px 60px',
      }}
    >
      <svg
        width="1440"
        height="820"
        viewBox="0 0 1200 630"
        style={{ position: 'absolute', left: -120, top: -80 }}
      >
        <defs>
          <linearGradient id="wave" x1="0" y1="0.2" x2="1" y2="0.8">
            <stop stopColor="#405b7c" stopOpacity="0.15" />
            <stop offset=".35" stopColor="#dcecff" />
            <stop offset=".65" stopColor="#9ebcfa" />
            <stop offset="1" stopColor="#333c68" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="ridge" x1="0.1" y1="0" x2="0.8" y2="1">
            <stop stopColor="#172a43" />
            <stop offset=".32" stopColor="#9db8dc" />
            <stop offset=".43" stopColor="#d9e7f8" />
            <stop offset=".48" stopColor="#355575" />
            <stop offset=".8" stopColor="#0a1627" />
            <stop offset="1" stopColor="#12213a" />
          </linearGradient>
          <linearGradient id="front" x1="0" y1="0" x2="0.3" y2="1">
            <stop stopColor="#93abd1" />
            <stop offset=".3" stopColor="#344d72" />
            <stop offset=".65" stopColor="#142339" />
            <stop offset="1" stopColor="#080f1c" />
          </linearGradient>
        </defs>
        <path
          d="M-100 390C160 590 210-80 455 135S700 650 920 260S1160 80 1310 275L1310 740H-100Z"
          fill="url(#ridge)"
        />
        <path
          d="M-100 550C140 690 290 120 530 350S820 580 1060 340S1240 220 1320 410L1320 740H-100Z"
          fill="url(#front)"
        />
        {Array.from({ length: 70 }, (_, i) => (
          <path
            key={i}
            d={`M-90 ${310 + i * 2.6}C130 ${560 - i * 3.7},205 ${35 + i * 4.2},420 ${200 + i * 0.9}S645 ${570 - i * 2.8},780 ${265 - i * 0.8}S990 ${110 + i * 4.2},1320 ${190 + i * 3}`}
            fill="none"
            stroke="url(#wave)"
            strokeWidth={i === 0 ? 3 : 1}
            opacity={0.08 + Math.sin((i / 69) * Math.PI) * 0.22}
          />
        ))}
      </svg>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(90deg, rgba(5,11,19,0.87) 0%, rgba(5,11,19,0.75) 45%, rgba(5,11,19,0.12) 82%)',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
        <BrandMark width={70} height={37} />
        <span style={{ fontSize: 25, letterSpacing: 9 }}>NOSSOM</span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 112,
          fontSize: 88,
          lineHeight: 1.06,
          letterSpacing: -5,
          position: 'relative',
        }}
      >
        <span>O som em</span>
        <span style={{ color: '#a5bdfa' }}>outra escala.</span>
      </div>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: 60,
          bottom: 49,
          right: 60,
          justifyContent: 'space-between',
          fontSize: 21,
          color: '#a6b5c9',
        }}
      >
        <span>Crie. Trate. Entregue.</span>
      </div>
    </div>,
    size,
  );
}
