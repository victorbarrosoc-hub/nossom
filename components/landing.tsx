'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  ArrowRight,
  Play,
  Pause,
  AudioLines,
  SlidersHorizontal,
  Layers,
  MoveUpRight,
  Check,
  Plus,
  Minus,
  Menu,
  X,
  Headphones,
  Sparkles,
  ShieldCheck,
  Monitor,
  Mic,
  Download,
  ChevronRight,
} from 'lucide-react';
import { Brand, SoundRibbon } from './brand';
import Assistant from './assistant';
import { makeDemo } from '@/lib/audio';
const features = [
  {
    icon: Sparkles,
    name: 'Um novo brilho para a voz.',
    tag: 'TRATAMENTO',
    text: 'Menos ruído. Mais presença. Preserve o que faz a sua voz ser sua.',
    tool: 'clarity',
    className: 'clarity-card',
  },
  {
    icon: SlidersHorizontal,
    name: 'Tudo no seu equilíbrio.',
    tag: 'MIXAGEM',
    text: 'Voz e música no mesmo ritmo. Dê espaço ao que precisa ser ouvido.',
    tool: 'mix',
    className: 'mix-card',
  },
  {
    icon: AudioLines,
    name: 'Pronto para ir além.',
    tag: 'MASTERIZAÇÃO',
    text: 'Ajuste o volume, confira os detalhes e entregue com confiança.',
    tool: 'master',
    className: 'master-card',
  },
];
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-35px' }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
function DemoPlayer() {
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
    <div className="demo-player glass">
      <div className="demo-top">
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
      <div className={`demo-wave ${playing ? 'is-playing' : ''}`} aria-hidden="true">
        {Array.from({ length: 128 }, (_, i) => (
          <span
            key={i}
            style={{
              height: `${8 + Math.abs(Math.sin(i * 2.7) * Math.sin(i * 0.13)) * 64}%`,
              background: (i / 128) * 100 < progress ? '#c2d7ff' : undefined,
              animationDelay: `${i * -0.03}s`,
            }}
          />
        ))}
        <div className="playhead" style={{ left: `${progress}%` }}>
          <i />
        </div>
      </div>
      <div className="demo-times">
        <span>
          00:
          {Math.floor(progress * 0.12)
            .toString()
            .padStart(2, '0')}
        </span>
        <span>00:12</span>
      </div>
      <div className="demo-bottom">
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
        <div className="demo-tools">
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
export default function Landing() {
  const [menu, setMenu] = useState(false),
    [assistant, setAssistant] = useState(false),
    [faq, setFaq] = useState<number | null>(0);
  useEffect(() => {
    if (!assistant) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAssistant(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [assistant]);
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <Link href="/" aria-label="NOSSOM início">
          <Brand />
        </Link>
        <nav className={menu ? 'open' : ''} aria-label="Navegação principal">
          <a href="#produto" onClick={() => setMenu(false)}>
            Produto
          </a>
          <a href="#como-funciona" onClick={() => setMenu(false)}>
            Como funciona
          </a>
          <a href="#possibilidades" onClick={() => setMenu(false)}>
            Possibilidades
          </a>
          <a href="#acesso" onClick={() => setMenu(false)}>
            Acesso
          </a>
        </nav>
        <div className="nav-actions">
          <Link className="nav-login" href="/studio">
            Abrir estúdio <ArrowUpRight size={13} />
          </Link>
          <Link href="/studio" className="button primary small">
            Começar grátis <ArrowRight size={14} />
          </Link>
          <button
            aria-label={menu ? 'Fechar menu' : 'Abrir menu'}
            className="icon-button mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="conteudo">
        <section className="hero">
          <div className="hero-ambient" />
          <div className="hero-art">
            <SoundRibbon />
          </div>
          <div className="hero-content">
            <Reveal>
              <div className="pill">
                <span className="status-light" /> SEU PRÓXIMO SOM COMEÇA AQUI{' '}
                <ChevronRight size={12} />
              </div>
              <h1>
                O som em
                <br />
                outra <span className="text-gradient">escala.</span>
              </h1>
              <p>
                Da primeira ideia ao último detalhe.
                <br />
                Um universo de possibilidades para criar,
                <br className="desktop-br" /> transformar e dar vida ao seu áudio.
              </p>
              <div className="hero-actions">
                <Link href="/studio" className="button primary">
                  Explore seu som <ArrowUpRight size={17} />
                </Link>
                <button
                  className="watch-button"
                  onClick={() =>
                    document
                      .getElementById('experimente')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                >
                  <span>
                    <Play size={11} fill="currentColor" />
                  </span>
                  Ouça a diferença
                </button>
              </div>
              <div className="hero-footnote">
                <ShieldCheck size={13} /> Sem cartão. Sem instalação. No seu ritmo.
              </div>
            </Reveal>
          </div>
          <div className="hero-art-label">
            <span>
              UMA NOVA FREQUÊNCIA.
              <br />A MESMA ESSÊNCIA.
            </span>
            <div className="label-line" />
          </div>
          <div className="hero-bottom">
            <span>CRIADO PARA QUEM TEM ALGO A DIZER.</span>
            <span>
              01 — INFINITAS POSSIBILIDADES <span className="tiny-wave">∿</span>
            </span>
          </div>
        </section>
        <section className="demo-section container" id="experimente">
          <Reveal>
            <div className="section-overline">
              <span>MENOS DISTRAÇÃO. MAIS SOM.</span>
              <span>
                APERTE O PLAY <ArrowRight size={12} />
              </span>
            </div>
            <DemoPlayer />
            <div className="demo-caption">
              <span>Um pequeno experimento. Uma grande diferença.</span>
              <span>O filtro atenua as frequências altas deste sinal de teste.</span>
            </div>
          </Reveal>
        </section>
        <section className="features-section container" id="produto">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow">DO BRUTO AO EXTRAORDINÁRIO</span>
              <h2>
                Seu som tem potencial.
                <br />
                <span className="muted">Deixe ele aparecer.</span>
              </h2>
            </div>
            <p>
              Ferramentas que entendem o seu fluxo.
              <br />
              Complexidade por dentro.
              <br />
              Simplicidade em cada toque.
            </p>
          </Reveal>
          <div className="feature-grid">
            {features.map((f, i) => (
              <Reveal className={`feature-card ${f.className}`} key={f.tag} delay={i * 0.08}>
                <div className="feature-top">
                  <f.icon size={20} />
                  <span>{f.tag}</span>
                  <ArrowUpRight size={16} />
                </div>
                <div className={`feature-visual visual-${i}`} aria-hidden="true">
                  {i === 0 ? (
                    <div className="voice-lines">
                      {Array.from({ length: 33 }, (_, j) => (
                        <i
                          key={j}
                          style={{
                            height: `${14 + Math.pow(Math.sin(j * 0.31), 2) * 90}px`,
                            animationDelay: `${j * -0.13}s`,
                          }}
                        />
                      ))}
                    </div>
                  ) : i === 1 ? (
                    <div className="mix-orbits">
                      <span />
                      <span />
                      <span />
                      <div className="orbit-dot" />
                    </div>
                  ) : (
                    <div className="master-meter">
                      <div>
                        {Array.from({ length: 24 }, (_, j) => (
                          <i key={j} style={{ opacity: j > 19 ? 0.18 : 1 }} />
                        ))}
                      </div>
                      <span>
                        −16 <small>LUFS</small>
                      </span>
                      <small>REFERÊNCIA PARA PODCAST</small>
                    </div>
                  )}
                </div>
                <h3>{f.name}</h3>
                <p>{f.text}</p>
                <Link href={`/studio?tool=${f.tool}`} className="text-link">
                  Explorar ferramenta <ArrowRight size={15} />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="workflow-section container" id="como-funciona">
          <Reveal className="workflow-intro">
            <span className="eyebrow">MENOS ETAPAS. MAIS FLUXO.</span>
            <h2>
              Da ideia ao play.
              <br />
              <span className="text-gradient">Naturalmente.</span>
            </h2>
            <p>
              Você cuida da história.
              <br />A NOSSOM cuida de como ela soa.
            </p>
            <Link href="/studio" className="button secondary">
              Entre no seu estúdio <ArrowUpRight size={16} />
            </Link>
          </Reveal>
          <div className="steps">
            {[
              {
                n: '01',
                title: 'Dê o primeiro play.',
                text: 'Envie seu áudio ou grave uma ideia. Seu original fica preservado, sempre.',
              },
              {
                n: '02',
                title: 'Encontre o seu som.',
                text: 'Escolha o que melhorar. Ajuste a intensidade, ouça e compare cada detalhe.',
              },
              {
                n: '03',
                title: 'Pronto para o mundo.',
                text: 'Confira as medições e baixe em WAV ou MP3. Do seu jeito, no seu tempo.',
              },
            ].map((step) => (
              <Reveal key={step.n} className="step">
                <span>{step.n}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
                <ArrowUpRight size={20} />
              </Reveal>
            ))}
          </div>
        </section>
        <section className="assistant-section container" id="possibilidades">
          <Reveal className="assistant-feature">
            <div className="assistant-copy">
              <span className="eyebrow">
                <span className="status-light" /> ENCONTRE SUA PRÓXIMA POSSIBILIDADE
              </span>
              <h2>
                Começa com uma ideia.
                <br />
                Ou uma <span className="text-gradient">conversa.</span>
              </h2>
              <p>
                “Quero minha voz mais presente.”
                <br />
                Descreva o que imagina e encontre o tratamento
                <br className="desktop-br" /> que combina com o seu áudio.
              </p>
              <button className="button primary" onClick={() => setAssistant(true)}>
                Vamos conversar <AudioLines size={17} />
              </button>
              <span className="feature-note">
                Sugestões locais disponíveis. Voz com integração ElevenLabs.
              </span>
            </div>
            <div className="assistant-art">
              <div className="orb-ring ring-one" />
              <div className="orb-ring ring-two" />
              <div className="big-orb">
                <div className="orb-shine" />
                <AudioLines size={64} strokeWidth={0.8} />
              </div>
              <div className="floating-prompt">
                <span className="status-light" /> Tudo acontece no som.
              </div>
            </div>
          </Reveal>
        </section>
        <section className="use-cases container">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow">O SEU UNIVERSO, AMPLIFICADO</span>
              <h2>
                Para quem cria.
                <br />
                <span className="muted">Para o que vem depois.</span>
              </h2>
            </div>
            <p>
              Uma entrevista. Um novo episódio.
              <br />A história que só você pode contar.
            </p>
          </Reveal>
          <div className="case-list">
            {[
              {
                icon: Mic,
                title: 'Podcasts e entrevistas',
                text: 'Conversas que merecem ser ouvidas.',
                tool: 'clarity',
              },
              {
                icon: Monitor,
                title: 'Vídeos e conteúdo',
                text: 'Um som à altura da sua imagem.',
                tool: 'master',
              },
              {
                icon: Headphones,
                title: 'Música e criação',
                text: 'Encontre o equilíbrio da sua próxima ideia.',
                tool: 'mix',
              },
            ].map((c) => (
              <Link href={`/studio?tool=${c.tool}`} key={c.title}>
                <c.icon size={24} strokeWidth={1.2} />
                <h3>{c.title}</h3>
                <span>{c.text}</span>
                <ArrowUpRight size={23} />
              </Link>
            ))}
          </div>
        </section>
        <section className="access-section container" id="acesso">
          <Reveal className="access-card">
            <div>
              <span className="eyebrow">ESPAÇO PARA EXPERIMENTAR</span>
              <h2>
                Seu estúdio.
                <br />
                <span className="text-gradient">Aberto a possibilidades.</span>
              </h2>
              <p>
                Comece com as ferramentas locais, gratuitamente.
                <br />
                Sem cadastro. Seus arquivos ficam neste navegador.
              </p>
              <div className="access-checks">
                <span>
                  <Check size={15} /> Tratamento e mixagem
                </span>
                <span>
                  <Check size={15} /> Exportação WAV e MP3
                </span>
                <span>
                  <Check size={15} /> Histórico de versões
                </span>
              </div>
            </div>
            <div className="access-action">
              <span>ESTÚDIO LOCAL</span>
              <strong>
                Grátis<span>para explorar</span>
              </strong>
              <Link className="button primary" href="/studio">
                Começar a criar <ArrowUpRight size={17} />
              </Link>
              <small>
                Até 100 MB e 10 minutos por arquivo.
                <br />
                Conta, nuvem e planos: em desenvolvimento.
              </small>
            </div>
          </Reveal>
        </section>
        <section className="faq-section container">
          <Reveal>
            <span className="eyebrow">ANTES DO PRIMEIRO PLAY</span>
            <h2>
              Uma boa conversa
              <br />
              resolve.
            </h2>
          </Reveal>
          <div className="faq-list">
            {[
              {
                q: 'Preciso entender de áudio para começar?',
                a: 'Você começa pelo que quer resolver: ruído, clareza, volume ou mixagem. Cada ferramenta explica o que faz. Os detalhes técnicos ficam disponíveis quando você precisar.',
              },
              {
                q: 'Meu áudio é enviado para algum servidor?',
                a: 'No estúdio local, importação, tratamento e exportação acontecem no seu navegador. Seus projetos são salvos neste dispositivo. A conversa por voz, quando configurada e iniciada por você, usa o microfone com o ElevenLabs.',
              },
              {
                q: 'Quais formatos posso usar?',
                a: 'Importe WAV, MP3, M4A, FLAC, OGG e áudio de MP4 ou MOV, conforme o codec. O estúdio aceita mono e estéreo, até 100 MB e 10 minutos. Exporte WAV PCM de 16 bits ou MP3 a 192 kbps, em 48 kHz.',
              },
              {
                q: 'Posso voltar ao áudio original?',
                a: 'Sim. O arquivo enviado fica preservado. Cada tratamento cria uma nova versão, e você pode ouvir, baixar ou retomar qualquer versão. Faça backup antes de limpar os dados do navegador.',
              },
              {
                q: 'A separação por IA já está disponível?',
                a: 'Ainda não. Separação de stems, restauração por IA e colaboração em nuvem estão no roteiro do produto. As ferramentas disponíveis hoje usam processamento de áudio real, localmente.',
              },
            ].map((item, i) => (
              <div className="faq-item" key={item.q}>
                <button onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i}>
                  {item.q}
                  {faq === i ? <Minus size={17} /> : <Plus size={17} />}
                </button>
                {faq === i && <p>{item.a}</p>}
              </div>
            ))}
          </div>
        </section>
        <section className="final-cta">
          <SoundRibbon small />
          <Reveal>
            <span className="eyebrow">TUDO ACONTECE NO SOM</span>
            <h2>
              O próximo som
              <br />é <em>seu.</em>
            </h2>
            <Link href="/studio" className="button primary">
              Dê vida à sua ideia <ArrowUpRight size={18} />
            </Link>
          </Reveal>
        </section>
      </main>
      <footer className="site-footer container">
        <div>
          <Link href="/" aria-label="NOSSOM início">
            <Brand />
          </Link>
          <span>Tudo acontece no som.</span>
        </div>
        <div>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/studio">
            Abrir estúdio <ArrowUpRight size={13} />
          </Link>
          <span>© {new Date().getFullYear()} NOSSOM</span>
        </div>
      </footer>
      <button
        className="floating-assistant"
        onClick={() => setAssistant(true)}
        aria-label="Abrir assistente NOSSOM"
      >
        <AudioLines size={23} />
      </button>
      {assistant && <Assistant onClose={() => setAssistant(false)} />}
    </>
  );
}
