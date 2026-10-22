'use client';
import { motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';
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
  const reduced = useReducedMotion(),
    id = useId().replace(/:/g, ''),
    [hover, setHover] = useState(false);
  const active = state === 'thinking' || state === 'speaking' || state === 'listening';
  return (
    <div
      className={`ai-motion ${compact ? 'compact' : ''} state-${state}`}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <svg
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
            <stop stopColor="#8bafff" stopOpacity=".3" />
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
        <motion.ellipse
          cx="360"
          cy="110"
          rx="340"
          ry="100"
          fill={`url(#${id}-glow)`}
          animate={
            reduced
              ? undefined
              : { opacity: active ? [0.45, 1, 0.45] : [0.4, 0.65, 0.4], scale: hover ? 1.08 : 1 }
          }
          transition={{ duration: active ? 1.5 : 5, repeat: Infinity }}
        />
        <g mask={`url(#${id}-mask)`}>
          {Array.from({ length: 13 }, (_, i) => {
            const y = 86 + i * 3.5,
              amplitude = (active ? 38 : hover ? 31 : 24) + i * 1.6;
            const a = `M -40 ${y} C 126 ${y - amplitude}, 212 ${y - amplitude}, 350 ${y} S 590 ${y + amplitude}, 760 ${y - 10}`;
            const b = `M -40 ${y + 6} C 116 ${y + amplitude}, 228 ${y + amplitude}, 360 ${y} S 610 ${y - amplitude}, 760 ${y + 3}`;
            return (
              <motion.path
                key={i}
                d={a}
                fill="none"
                stroke={`url(#${id})`}
                strokeWidth={i === 6 ? 2.5 : 0.8}
                opacity={0.22 + (1 - Math.abs(i - 6) / 7) * 0.65}
                animate={reduced ? undefined : { d: [a, b, a] }}
                transition={{
                  duration: state === 'thinking' ? 1.8 : state === 'speaking' ? 1.2 : 5.5,
                  delay: i * 0.035,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
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
