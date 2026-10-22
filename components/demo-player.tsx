'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Headphones, Sparkles, Play, Pause, ArrowUpRight } from 'lucide-react';
import { makeDemo } from '@/lib/audio';
export default function DemoPlayer() {
  const [playing, setPlaying] = useState(false),
    [filtered, setFiltered] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null),
    ctx = useRef<AudioContext | null>(null),
    filter = useRef<BiquadFilterNode | null>(null),
    url = useRef('');
  useEffect(
    () => () => {
      audio.current?.pause();
      ctx.current?.close();
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [],
  );
  async function toggle() {
    try {
      if (!audio.current) {
        url.current = URL.createObjectURL(makeDemo(12));
        audio.current = new Audio(url.current);
        ctx.current = new AudioContext();
        const source = ctx.current.createMediaElementSource(audio.current);
        filter.current = ctx.current.createBiquadFilter();
        filter.current.type = 'lowpass';
        filter.current.frequency.value = filtered ? 1800 : 22000;
        source.connect(filter.current).connect(ctx.current.destination);
        audio.current.ontimeupdate = () => setProgress((audio.current!.currentTime / 12) * 100);
        audio.current.onended = () => {
          setPlaying(false);
          setProgress(0);
        };
      }
      await ctx.current?.resume();
      if (playing) {
        audio.current.pause();
        setPlaying(false);
      } else {
        await audio.current.play();
        setPlaying(true);
      }
    } catch {
      setError('Abra o estúdio para experimentar o áudio neste navegador.');
    }
  }
  function mode(value: boolean) {
    setFiltered(value);
    if (filter.current && ctx.current)
      filter.current.frequency.setTargetAtTime(value ? 1800 : 22000, ctx.current.currentTime, 0.05);
  }
  return (
    <div className="ns-demo-player">
      <div className="ns-demo-top">
        <span>
          <Headphones size={15} /> Experimento sonoro <small>· demonstração sintetizada</small>
        </span>
        <div className="segmented">
          <button className={!filtered ? 'active' : ''} onClick={() => mode(false)}>
            Original
          </button>
          <button className={filtered ? 'active' : ''} onClick={() => mode(true)}>
            Com filtro <Sparkles size={11} />
          </button>
        </div>
      </div>
      <div className={`ns-demo-wave ${playing ? 'is-playing' : ''}`} aria-hidden="true">
        {Array.from({ length: 128 }, (_, i) => (
          <span
            key={i}
            style={{
              height: `${(8 + Math.abs(Math.sin(i * 2.7) * Math.sin(i * 0.13)) * 64).toFixed(2)}%`,
              background: (i / 128) * 100 < progress ? '#c2d7ff' : undefined,
              animationDelay: `${(i * -0.03).toFixed(2)}s`,
            }}
          />
        ))}
        <div className="playhead" style={{ left: `${progress}%` }}>
          <i />
        </div>
      </div>
      <div className="ns-demo-times">
        <span>
          00:
          {Math.floor(progress * 0.12)
            .toString()
            .padStart(2, '0')}
        </span>
        <span>00:12</span>
      </div>
      <div className="ns-demo-bottom">
        <button
          className="play-button"
          aria-label={playing ? 'Pausar demonstração' : 'Ouvir demonstração'}
          onClick={toggle}
        >
          {playing ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" />
          )}
        </button>
        <div className="ns-demo-tools">
          {[
            ['Reduzir ruído', 'denoise'],
            ['Melhorar voz', 'clarity'],
            ['Equilibrar', 'level'],
            ['Masterizar', 'master'],
          ].map(([label, tool]) => (
            <Link key={tool} href={`/studio?tool=${tool}`}>
              {label}
            </Link>
          ))}
        </div>
        <Link className="icon-button" href="/studio" aria-label="Abrir estúdio e exportar áudio">
          <ArrowUpRight size={19} />
        </Link>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
