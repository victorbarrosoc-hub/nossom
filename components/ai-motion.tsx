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
      {!compact && (
        <span className="ai-motion-label" role="status">
          {labels[state]}
        </span>
      )}
    </div>
  );
}
