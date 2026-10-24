'use client';
import { useAmbientMotion } from './use-ambient-motion';
/** Animate composited layers only. No per-frame React updates, filters or path morphing. */
export default function CinematicRibbon({
  energetic = false,
  priority = false,
}: {
  energetic?: boolean;
  priority?: boolean;
}) {
  const { ref, running } = useAmbientMotion();
  return (
    <div
      ref={ref}
      className={`cinematic-ribbon ${running ? 'is-running' : ''} ${energetic ? 'is-energetic' : ''}`}
      aria-hidden="true"
    >
      <div className="ribbon-halo" />
      <svg className="ribbon-threads" viewBox="0 0 1000 500" preserveAspectRatio="none" fill="none">
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={`M-100 ${90 + i * 13} C180 ${350 - i * 7},290 ${-20 + i * 11},510 ${170 + i * 9} S790 ${480 - i * 7},1100 ${220 + i * 10}`}
            stroke="#9bdcff"
            strokeWidth=".7"
          />
        ))}
      </svg>
      <img
        className="ribbon-sculpture"
        src="/brand/chrome-wave.webp"
        width={1440}
        height={540}
        alt=""
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
      <div className="ribbon-ground" />
    </div>
  );
}
