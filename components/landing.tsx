'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  Play,
  Sparkles,
  ShieldCheck,
  Download,
  Check,
  Menu,
  X,
  Plus,
  Minus,
  FileAudio,
  Send,
  Paperclip,
} from 'lucide-react';
import { Brand, SoundRibbon } from './brand';
import AIMotion from './ai-motion';
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
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduced ? 0 : 0.75, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
const examples = [
  {
    label: 'Limpar minha voz',
    request: 'Quero tirar o ruído sem perder minha voz.',
    reply: 'Vamos restaurar a fala. Depois você escolhe o corpo e o acabamento.',
    tags: ['NOSSOM Restore D', 'EQ depois da IA'],
  },
  {
    label: 'Preparar pro YouTube',
    request: 'Deixa este áudio pronto para meu vídeo.',
    reply: 'Vamos tratar a fala e finalizar com o perfil de entrega YouTube.',
    tags: ['Tratamento completo', 'YouTube'],
  },
  {
    label: 'Som de rádio',
    request: 'Quero dar um som de rádio à minha voz.',
    reply: 'Podemos aplicar a textura de rádio. Você controla a intensidade.',
    tags: ['Efeito Rádio', 'Intensidade ajustável'],
  },
];
function AIPreview() {
  const [selected, setSelected] = useState(0),
    reduced = useReducedMotion();
  return (
    <div className="home-ai-preview">
      <div className="home-ai-preview-top">
        <span>
          <i /> ASSISTENTE NOSSOM
        </span>
        <span>Prévia interativa</span>
      </div>
      <div className="home-ai-presence">
        <AIMotion state="thinking" compact />
        <span>O próximo passo começa com uma conversa.</span>
      </div>
      <div className="home-ai-example" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            <div className="home-ai-user">
              <span>
                <FileAudio size={15} /> minha_gravacao.wav
              </span>
              <p>{examples[selected].request}</p>
            </div>
            <div className="home-ai-answer">
              <Sparkles size={19} />
              <div>
                <p>{examples[selected].reply}</p>
                <div>
                  {examples[selected].tags.map((tag) => (
                    <span key={tag}>
                      <Check size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="home-ai-prompts" role="group" aria-label="Explorar sugestões da IA">
        {examples.map((example, i) => (
          <button key={example.label} aria-pressed={selected === i} onClick={() => setSelected(i)}>
            {example.label}
          </button>
        ))}
      </div>
      <Link href="/studio" className="home-ai-compose">
        <Paperclip size={18} />
        <span>Envie seu áudio. Conte sua ideia.</span>
        <span className="home-ai-send">
          <Send size={15} />
        </span>
      </Link>
    </div>
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
    'WAV, MP3, M4A, FLAC, OGG e áudio de MP4 ou MOV, conforme o codec. Até 100 MB e 10 minutos. A restauração de fala gera mono em WAV float32 a 44,1 kHz. A finalização local permite WAV ou MP3 a 48 kHz.',
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
    <div className="ns-site home-v2">
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
              ['Produto', 'produto'],
              ['Ouça a diferença', 'experimente'],
              ['Como funciona', 'como-funciona'],
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
        <section className="home-hero">
          <div className="home-hero-atmosphere" aria-hidden="true">
            <SoundRibbon />
          </div>
          <div className="ns-wrap home-hero-grid">
            <Reveal className="home-hero-copy">
              <h1>
                Seu som tem
                <br />
                <span>mais a dizer.</span>
              </h1>
              <p>
                Uma IA para entender o que você quer ouvir.
                <br className="home-desktop-break" /> Um estúdio para fazer acontecer.
              </p>
              <div className="ns-actions">
                <Link href="/studio" className="button primary">
                  Criar com a NOSSOM <ArrowUpRight size={17} />
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
                <span>5 minutos grátis de restauração por mês. Seu original preservado.</span>
              </div>
            </Reveal>
            <Reveal className="home-hero-interface" delay={0.12}>
              <AIPreview />
            </Reveal>
          </div>
          <div className="ns-wrap home-hero-bottom">
            <span>DA SUA IDEIA AO PRÓXIMO PLAY</span>
            <a href="#experimente" aria-label="Explorar a demonstração de voz">
              <ArrowDown size={18} />
            </a>
            <span>GRAVE · TRATE · FINALIZE</span>
          </div>
        </section>
        <section className="home-listen ns-wrap" id="experimente">
          <Reveal className="home-listen-heading">
            <div>
              <h2>
                A diferença
                <br />
                <span>se ouve.</span>
              </h2>
            </div>
            <p>Dê play e compare o antes e depois.</p>
          </Reveal>
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
