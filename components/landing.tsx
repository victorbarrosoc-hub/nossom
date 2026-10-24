'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AudioLines,
  Mic2,
  SlidersHorizontal,
  ArrowRight,
  ArrowUpRight,
  Play,
  Sparkles,
  ShieldCheck,
  Download,
  Menu,
  X,
  Plus,
  Minus,
  Paperclip,
} from 'lucide-react';
import CinematicRibbon from './cinematic-ribbon';
import SignalField from './signal-field';
import { Brand } from './brand';
import DemoPlayer from './demo-player';
import PlanCards from './plan-cards';
import InstallApp from './install-app';
import AccountMenu from './account-menu';
import DesktopUpdates from './desktop-updates';
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={`ns-reveal ${className}`}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduced ? 0 : 0.45, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
const faqs = [
  [
    'Preciso saber tratar áudio?',
    'Comece pelo assistente: anexe sua gravação e conte o que quer melhorar. A IA usa seu objetivo e as medições do áudio para sugerir o tratamento. Você revisa a proposta, ouve e pode ajustar os controles no estúdio.',
  ],
  [
    'O que está incluído na minha conta?',
    'O Grátis inclui 5 minutos de restauração por mês. Essencial: 2 horas por R$39/mês; Studio: 6 horas por R$99/mês. Cada restauração usa no mínimo 1 minuto; EQ, efeitos e masterização local não descontam minutos. A franquia renova no dia 1. Planos pagos são ativados pelo administrador após contato, sem cobrança automática nesta etapa.',
  ],
  [
    'Meu áudio é enviado à IA?',
    'Ao restaurar com IA, uma cópia temporária do arquivo vai para armazenamento privado e uma GPU da plataforma. Os projetos e originais ficam neste navegador. EQ, masterização e efeitos continuam locais. O assistente Claude recebe texto e medições, sem o arquivo de áudio.',
  ],
  [
    'Quais arquivos posso usar?',
    'WAV, MP3, M4A, FLAC, OGG e áudio de MP4 ou MOV. Até 100 MB e 10 minutos. Limpeza de fala em mono e separação musical em estéreo. Exporte o resultado em WAV ou MP3.',
  ],
  [
    'Posso desfazer um tratamento?',
    'Sim. O original é preservado e os tratamentos criam versões. Compare antes e depois, desfaça, refaça ou retome uma versão anterior. Os efeitos também podem ser removidos. Exporte seus projetos antes de limpar os dados do navegador.',
  ],
];
export default function Landing() {
  const [menu, setMenu] = useState(false),
    [faq, setFaq] = useState<number | null>(null);
  return (
    <div className="ns-site home-v2 chrome-site">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="ns-header">
        <div className="ns-wrap ns-nav">
          <Link href="/" aria-label="NOSSOM início">
            <Brand />
          </Link>
          <nav className={menu ? 'open' : ''} aria-label="Navegação principal">
            {[
              ['Ouça a diferença', 'experimente'],
              ['Planos', 'planos'],
            ].map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="ns-nav-actions">
            <DesktopUpdates />
            <AccountMenu />
            <Link href="/studio" className="button primary small">
              Começar grátis <ArrowRight size={14} />
            </Link>
            <button
              className="icon-button ns-menu"
              onClick={() => setMenu(!menu)}
              aria-label={menu ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menu}
            >
              {menu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>
      <main id="conteudo">
        <SignalField />
        <section className="home-hero">
          <div className="home-hero-atmosphere" aria-hidden="true" />
          <div className="ns-wrap home-hero-grid">
            <Reveal className="home-hero-copy">
              <h1>
                Seu som,
                <span>em outra escala.</span>
              </h1>
              <p>Limpe sua voz. Isole vocais. Crie do seu jeito.</p>
              <div className="ns-actions">
                <Link href="/studio" className="button primary">
                  Começar grátis <ArrowUpRight size={17} />
                </Link>
                <a href="#experimente" className="home-listen-link">
                  <span>
                    <Play size={13} fill="currentColor" />
                  </span>
                  Ouça a diferença
                </a>
              </div>
              <div className="home-hero-proof">
                <ShieldCheck size={15} />
                <span>5 minutos grátis de IA por mês. Seu original preservado.</span>
              </div>
            </Reveal>
            <div className="home-hero-interface chrome-hero-art">
              <CinematicRibbon priority />
            </div>
          </div>
          <nav
            className="home-intents chrome-intents ns-wrap"
            aria-label="Escolha o que fazer com seu áudio"
          >
            <Link href="/studio/automatico" data-intent="auto" aria-label="Limpar fala">
              <AudioLines size={32} />
              <span>
                <strong>Limpar fala</strong>
                <small>Reduza ruídos da gravação</small>
              </span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/studio/isolar-voz" data-intent="vocals" aria-label="Isolar cantor">
              <Mic2 size={32} />
              <span>
                <strong>Isolar cantor</strong>
                <small>Separe a voz dos instrumentos</small>
              </span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/studio/efeitos" data-intent="effects" aria-label="Criar efeitos">
              <SlidersHorizontal size={32} />
              <span>
                <strong>Criar efeitos</strong>
                <small>Transforme seu som</small>
              </span>
              <ArrowRight size={18} />
            </Link>
          </nav>
        </section>
        <section className="home-listen ns-wrap" id="experimente">
          <div className="chrome-listen-heading">
            <h2>Ouça a diferença.</h2>
            <p>Uma gravação real, antes e depois.</p>
          </div>
          <Reveal>
            <DemoPlayer />
          </Reveal>
        </section>
        <section className="home-quick ns-wrap" id="produto">
          <h2>Do áudio ao resultado.</h2>
          <div id="como-funciona" className="home-quick-steps">
            <p>
              <Paperclip size={22} />
              <strong>1. Envie</strong> Sua voz, do celular ou computador.
            </p>
            <p>
              <Sparkles size={22} />
              <strong>2. Melhore</strong> Limpe a voz e ajuste seu som.
            </p>
            <p>
              <Download size={22} />
              <strong>3. Baixe</strong> Compare e exporte em WAV ou MP3.
            </p>
          </div>
          <Link href="/studio" className="button primary">
            Experimentar grátis <ArrowRight size={16} />
          </Link>
        </section>
        <section className="ns-wrap" id="planos">
          <PlanCards />
        </section>
        <section className="ns-faq ns-wrap">
          <Reveal>
            <h2>Dúvidas?</h2>
          </Reveal>
          <div>
            {faqs.map(([question, answer], i) => (
              <div className="ns-faq-item" key={question}>
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  aria-expanded={faq === i}
                  aria-controls={`faq-${i}`}
                >
                  {question}
                  {faq === i ? <Minus size={18} /> : <Plus size={18} />}
                </button>
                <div id={`faq-${i}`} hidden={faq !== i}>
                  <p>{answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="ns-footer ns-wrap">
        <div>
          <Link href="/" aria-label="NOSSOM início">
            <Brand />
          </Link>
          <p>Tudo acontece no som.</p>
        </div>
        <nav aria-label="Rodapé">
          <InstallApp />
          <Link href="/apps">Aplicativos para Mac e Windows</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/studio">
            Abrir estúdio <ArrowUpRight size={13} />
          </Link>
          <span>© {new Date().getFullYear()} NOSSOM</span>
        </nav>
      </footer>
    </div>
  );
}
