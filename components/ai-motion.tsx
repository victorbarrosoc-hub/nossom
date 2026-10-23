'use client';
import { useEffect, useId, useRef, useState } from 'react';
export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';
const labels: Record<AIState, string> = {
  idle: 'Pronta para criar com você',
  listening: 'Ouvindo você',
  thinking: 'Encontrando o melhor caminho para o seu som',
  speaking: 'Uma nova possibilidade para o seu som',
  error: 'Vamos tentar de novo',
};
export default function AIMotion({
  state = 'idle',
  compact = false,
}: {
  state?: AIState;
  compact?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    ref = useRef<HTMLDivElement>(null),
    surface = useRef<HTMLCanvasElement>(null),
    [visible, setVisible] = useState(false),
    [foreground, setForeground] = useState(true);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const visibility = () => setForeground(document.visibilityState === 'visible');
    visibility();
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.05,
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  const active = ['thinking', 'speaking', 'listening'].includes(state);
  useEffect(() => {
    const canvas = surface.current;
    const svg = ref.current?.querySelector('svg');
    if (!canvas || !svg) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0,
      last = 0,
      width = 720,
      height = 220;
    const render = (time: number) => {
      const phase = time * (active ? 0.0008 : 0.0004);
      context.clearRect(0, 0, width, height);
      const color = context.createLinearGradient(0, 0, width, 0);
      color.addColorStop(0, '#b7d8ff00');
      color.addColorStop(0.12, '#b7d8ff');
      color.addColorStop(0.48, '#9cbcff');
      color.addColorStop(0.8, '#b4a2f0');
      color.addColorStop(1, '#c4d9ff00');
      context.strokeStyle = color;
      for (let line = 0; line < 11; line++) {
        const spread = (line - 5) / 5;
        context.beginPath();
        for (let step = 0; step <= 80; step++) {
          const t = step / 80;
          const envelope = Math.sin(Math.PI * t) ** 0.8;
          const movement = Math.sin(t * Math.PI * 2.3 - phase + spread * 0.36);
          const y =
            height * 0.5 +
            envelope *
              height *
              (movement * (active ? 0.22 : 0.16) + spread * (0.13 + 0.035 * Math.cos(phase)));
          if (step === 0) context.moveTo(0, y);
          else context.lineTo(t * width, y);
        }
        context.globalAlpha = line === 5 ? 0.95 : 0.25 + 0.38 * (1 - Math.abs(spread));
        context.lineWidth = line === 5 ? 1.7 : 0.8;
        context.stroke();
      }
      context.globalAlpha = 1;
    };
    const resize = () => {
      const box = svg.getBoundingClientRect();
      width = Math.max(1, box.width);
      height = Math.max(1, box.height);
      const scale = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.style.height = `${height}px`;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      render(0);
    };
    const tick = (time: number) => {
      if (time - last >= 1000 / 30) {
        render(time);
        last = time;
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (visible && foreground && !reduced.matches) frame = requestAnimationFrame(tick);
      else render(0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(svg);
    resize();
    start();
    reduced.addEventListener('change', start);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      reduced.removeEventListener('change', start);
    };
  }, [active, visible, foreground]);
  return (
    <div
      ref={ref}
      className={`ai-motion ${compact ? 'compact' : ''} state-${state} ${visible && foreground ? 'is-running' : ''}`}
    >
      <svg
        className="ai-motion-signal"
        viewBox="0 0 720 220"
        preserveAspectRatio="none"
        role="img"
        aria-label={`IA NOSSOM: ${labels[state]}`}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#edf6ff" />
            <stop offset=".4" stopColor="#96c4ff" />
            <stop offset=".75" stopColor="#8c98ef" />
            <stop offset="1" stopColor="#e4edff" />
          </linearGradient>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor="#8bafff" stopOpacity=".24" />
            <stop offset="1" stopColor="#7f9fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset=".09" stopColor="white" />
            <stop offset=".91" stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="220">
            <rect width="720" height="220" fill={`url(#${id}-edge)`} />
          </mask>
        </defs>
        <ellipse cx="360" cy="110" rx="340" ry="100" fill={`url(#${id}-glow)`} />
        <g mask={`url(#${id}-mask)`}>
          {Array.from({ length: 9 }, (_, i) => {
            const y = 85 + i * 5,
              amplitude = (active ? 33 : 24) + i * 2;
            return (
              <path
                key={i}
                d={`M -40 ${y} C 126 ${y - amplitude}, 212 ${y - amplitude}, 350 ${y} S 590 ${y + amplitude}, 760 ${y - 10}`}
                fill="none"
                stroke={`url(#${id})`}
                strokeWidth={i === 4 ? 2.2 : 0.9}
                opacity={0.25 + (1 - Math.abs(i - 4) / 5) * 0.6}
              />
            );
          })}
        </g>
      </svg>
      <canvas ref={surface} className="ai-motion-canvas" aria-hidden="true" />
      {!compact && (
        <span className="ai-motion-label" role="status">
          {labels[state]}
        </span>
      )}
    </div>
  );
}
