'use client';
import Link from 'next/link';
import { useState, useRef, useEffect, useId } from 'react';
import { Headphones, Sparkles, Play, Pause, ArrowUpRight, Volume2 } from 'lucide-react';
import demo from '@/lib/demo-waveform.json';
function time(value: number) {
  return `${Math.floor(value / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(value % 60)
    .toString()
    .padStart(2, '0')}`;
}
export default function DemoPlayer() {
  const [playing, setPlaying] = useState(false),
    [version, setVersion] = useState<'original' | 'treated'>('original'),
    [position, setPosition] = useState(0),
    [volume, setVolume] = useState(0.8),
    [error, setError] = useState('');
  const tracks = useRef<{ original: HTMLAudioElement | null; treated: HTMLAudioElement | null }>({
      original: null,
      treated: null,
    }),
    active = useRef<'original' | 'treated'>('original'),
    switching = useRef(0),
    id = useId().replace(/:/g, '');
  const duration = demo.duration,
    progress = Math.min(100, (position / duration) * 100);
  useEffect(() => {
    const elements = Object.values(tracks.current);
    return () => {
      switching.current++;
      elements.forEach((audio) => audio?.pause());
    };
  }, []);
  function failure() {
    setPlaying(false);
    setError('Não foi possível tocar o exemplo. Tente novamente.');
  }
  async function toggle() {
    const audio = tracks.current[active.current];
    if (!audio) return;
    setError('');
    if (!audio.paused) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } catch {
      failure();
    }
  }
  async function choose(next: 'original' | 'treated') {
    if (next === active.current) return;
    const previous = tracks.current[active.current],
      target = tracks.current[next];
    if (!target) return;
    const request = ++switching.current,
      currentTime = previous?.ended ? 0 : previous?.currentTime || position,
      resume = previous ? !previous.paused : false;
    previous?.pause();
    active.current = next;
    setVersion(next);
    setPlaying(false);
    setError('');
    const seek = () => {
      if (request !== switching.current) return;
      target.currentTime = Math.min(currentTime, duration - 0.01);
    };
    if (target.readyState >= 1) seek();
    else target.addEventListener('loadedmetadata', seek, { once: true });
    if (resume) {
      try {
        await target.play();
        if (request !== switching.current && active.current !== next) target.pause();
      } catch {
        if (request === switching.current) failure();
      }
    }
  }
  function seek(value: number) {
    const audio = tracks.current[active.current];
    if (!audio) return;
    audio.currentTime = value;
    setPosition(value);
  }
  return (
    <div className={`voice-player ${playing ? 'is-playing' : ''}`} data-version={version}>
      {(['original', 'treated'] as const).map((key) => (
        <audio
          key={key}
          ref={(el) => {
            tracks.current[key] = el;
            if (el) el.volume = volume;
          }}
          src={`/demo/voice-${key}.mp3`}
          preload="metadata"
          onTimeUpdate={(event) => {
            if (active.current === key) setPosition(event.currentTarget.currentTime);
          }}
          onPlay={() => {
            if (active.current === key) setPlaying(true);
          }}
          onPause={() => {
            if (active.current === key) setPlaying(false);
          }}
          onEnded={() => {
            if (active.current === key) {
              setPlaying(false);
              setPosition(duration);
            }
          }}
          onError={failure}
        />
      ))}
      <div className="voice-player-head">
        <div className="voice-player-file">
          <span>
            <Headphones size={21} />
          </span>
          <div>
            <strong>Uma voz. Duas versões.</strong>
            <small>Voz real · Português brasileiro</small>
          </div>
        </div>
        <div className="voice-player-switch" role="group" aria-label="Comparar versões da voz">
          <button aria-pressed={version === 'original'} onClick={() => choose('original')}>
            Original
          </button>
          <button aria-pressed={version === 'treated'} onClick={() => choose('treated')}>
            <Sparkles size={14} /> NOSSOM
          </button>
        </div>
      </div>
      <div className="voice-player-visual">
        <div className="voice-player-grid" aria-hidden="true" />
        <svg viewBox="0 0 1000 170" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-wave`} x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#b9e3ff" />
              <stop offset=".5" stopColor="#8ca9ff" />
              <stop offset="1" stopColor="#c4acff" />
            </linearGradient>
            <clipPath id={`${id}-progress`}>
              <rect width={progress * 10} height="170" />
            </clipPath>
          </defs>
          {['base', 'progress'].map((layer) => (
            <g
              key={layer}
              clipPath={layer === 'progress' ? `url(#${id}-progress)` : undefined}
              fill={layer === 'progress' ? `url(#${id}-wave)` : '#617286'}
              opacity={layer === 'progress' ? 1 : 0.55}
            >
              {demo[version].map((peak, i) => {
                const height = Math.max(3, Math.sqrt(peak) * 146);
                return (
                  <rect
                    key={i}
                    x={i * (1000 / demo[version].length)}
                    y={(170 - height) / 2}
                    width={3.1}
                    height={height}
                    rx="1.55"
                  />
                );
              })}
            </g>
          ))}
        </svg>
        <div className="voice-player-playhead" style={{ left: `${progress}%` }} aria-hidden="true">
          <span />
        </div>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={position}
          aria-label="Posição da demonstração"
          aria-valuetext={`${time(position)} de ${time(duration)}`}
          onChange={(e) => seek(Number(e.target.value))}
        />
      </div>
      <div className="voice-player-timeline" aria-hidden="true">
        <span>{time(position)}</span>
        <span>00:02</span>
        <span>00:04</span>
        <span>{time(duration)}</span>
      </div>
      <div className="voice-player-controls">
        <button
          className="voice-player-play"
          aria-label={playing ? 'Pausar demonstração' : 'Ouvir demonstração'}
          onClick={toggle}
        >
          {playing ? (
            <Pause size={22} fill="currentColor" />
          ) : (
            <Play size={22} fill="currentColor" />
          )}
        </button>
        <div className="voice-player-status">
          <span className="voice-player-live" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <i key={i} />
            ))}
          </span>
          <div>
            <strong>{version === 'original' ? 'Antes do tratamento' : 'Tratamento NOSSOM'}</strong>
            <span>
              {version === 'original' ? 'Voz com ruído adicionado' : 'Limpeza neural + finalização'}
            </span>
          </div>
        </div>
        <label className="voice-player-volume">
          <Volume2 size={18} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            aria-label="Volume da demonstração"
            value={volume}
            onChange={(e) => {
              const value = Number(e.target.value);
              setVolume(value);
              Object.values(tracks.current).forEach((a) => {
                if (a) a.volume = value;
              });
            }}
          />
        </label>
        <Link href="/studio" className="voice-player-try">
          Tratar meu áudio <ArrowUpRight size={17} />
        </Link>
      </div>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <details className="voice-player-credit">
        <summary>Sobre esta demonstração</summary>
        <p>
          Gravação humana em português, do TTS-Portuguese Corpus, de Edresson Casanova e
          colaboradores (
          <a
            href="https://github.com/Edresson/TTS-Portuguese-Corpus"
            target="_blank"
            rel="noreferrer"
          >
            fonte · CC BY 4.0
          </a>
          ). Trechos unidos, com ruído adicionado para comparar; a versão NOSSOM foi renderizada
          pelo Tratamento completo da plataforma. O resultado varia conforme a gravação.
        </p>
      </details>
    </div>
  );
}
