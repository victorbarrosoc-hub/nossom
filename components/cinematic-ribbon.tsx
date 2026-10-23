'use client';
import { useEffect, useRef, useState } from 'react';

/** Animate composited layers only. No per-frame React updates, filters or path morphing. */
export default function CinematicRibbon({
  energetic = false,
  priority = false,
}: {
  energetic?: boolean;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () =>
      setRunning(visible && document.visibilityState === 'visible' && !reduced.matches);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0.05 },
    );
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update);
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`cinematic-ribbon ${running ? 'is-running' : ''} ${energetic ? 'is-energetic' : ''}`}
      aria-hidden="true"
    >
      <div className="ribbon-halo" />
      <img
        className="ribbon-sculpture"
        src="/brand/chrome-wave.webp"
        width={1440}
        height={720}
        alt=""
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
      <div className="ribbon-ground" />
    </div>
  );
}
