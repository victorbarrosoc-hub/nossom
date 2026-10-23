'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  Play,
  AudioLines,
  Sparkles,
  SlidersHorizontal,
  ShieldCheck,
  History,
  Mic,
  Download,
  Monitor,
  Smartphone,
  Check,
  Menu,
  X,
  Plus,
  Minus,
  Headphones,
  FileAudio,
  Lock,
  Layers,
  Send,
  Paperclip,
} from 'lucide-react';
import { Brand, SoundRibbon } from './brand';
import AIMotion from './ai-motion';
import Assistant from './assistant';
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
    [assistant, setAssistant] = useState(false),
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
              <span className="home-eyebrow">
                <i /> INTELIGÊNCIA ARTIFICIAL PARA O SEU ÁUDIO
              </span>
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
              <span className="ns-kicker">MENOS RUÍDO. MAIS PRESENÇA.</span>
              <h2>
                A diferença
                <br />
                <span>se ouve.</span>
              </h2>
            </div>
            <p>
              Uma gravação de voz, antes e depois.
              <br />
              Dê play e alterne entre as versões
              <br className="home-desktop-break" /> sem perder o ponto da conversa.
            </p>
          </Reveal>
          <Reveal>
            <DemoPlayer />
          </Reveal>
          <div className="home-process-strip">
            <span>
              <Sparkles size={16} /> Limpeza neural
            </span>
            <span>
              <SlidersHorizontal size={16} /> EQ e dinâmica
            </span>
            <span>
              <AudioLines size={16} /> Finalização automática
            </span>
            <span>
              <History size={16} /> Original preservado
            </span>
          </div>
        </section>
        <section className="home-product ns-wrap" id="produto">
          <Reveal className="home-section-heading">
            <span className="ns-kicker">INTUIÇÃO PARA COMEÇAR. CONTROLE PARA IR ALÉM.</span>
            <h2>
              Da primeira ideia
              <br />
              ao seu <span>melhor som.</span>
            </h2>
            <p>O assistente encontra um caminho. Você tem espaço para explorar cada detalhe.</p>
          </Reveal>
          <div className="home-features">
            <Reveal className="home-feature home-feature-main">
              <div className="home-feature-top">
                <span className="home-feature-icon">
                  <Sparkles size={23} />
                </span>
                <span>01 / RESTAURAÇÃO</span>
              </div>
              <h3>
                A voz que importa.
                <br />O ruído, bem menos.
              </h3>
              <p>
                Restaure a fala com NOSSOM Restore D. Ouça o antes e depois e, depois da IA, escolha
                quanto corpo, presença e textura quer acrescentar.
              </p>
              <div className="home-restoration-art" aria-hidden="true">
                <AIMotion state="speaking" compact />
                <div>
                  <span>Ruído</span>
                  <i />
                  <strong>Voz</strong>
                </div>
              </div>
              <Link href="/studio/automatico">
                Encontrar meu tratamento <ArrowUpRight size={17} />
              </Link>
            </Reveal>
            <Reveal className="home-feature home-feature-master" delay={0.06}>
              <div className="home-feature-top">
                <span className="home-feature-icon">
                  <SlidersHorizontal size={23} />
                </span>
                <span>02 / FINALIZAÇÃO</span>
              </div>
              <h3>
                Seu áudio sabe
                <br />
                aonde vai.
              </h3>
              <p>
                Abra seu EQ, encorpe com o preset de multibanda e limitador inspirado na cadeia do
                Premiere ou escolha um perfil para o lugar onde você vai publicar.
              </p>
              <div className="home-destination-art">
                <div>
                  <span>PERFIL DE ENTREGA</span>
                  <strong>
                    YouTube <ArrowUpRight size={20} />
                  </strong>
                </div>
                <span>Podcast</span>
                <span>Redes sociais</span>
                <span>TV · EBU / ATSC</span>
                <span>Netflix · diálogo</span>
              </div>
              <Link href="/studio/masterizacao">
                Explorar a finalização <ArrowUpRight size={17} />
              </Link>
            </Reveal>
            {[
              {
                icon: Mic,
                title: 'Grave enquanto é ideia.',
                text: 'Capture pelo microfone ou importe áudio e vídeo. Comece pelo que você já tem.',
                href: '/studio',
              },
              {
                icon: Layers,
                title: 'Mais textura. Mais intenção.',
                text: 'Rádio, telefone, capela e igreja. Experimente efeitos e escolha a intensidade.',
                href: '/studio/efeitos',
              },
              {
                icon: History,
                title: 'Liberdade para voltar.',
                text: 'Compare versões, desfaça e remova efeitos. O original permanece preservado.',
                href: '/studio/projetos',
              },
              {
                icon: Download,
                title: 'Pronto para o próximo play.',
                text: 'Exporte em WAV ou MP3. Leve seu áudio para o vídeo, podcast ou próximo projeto.',
                href: '/studio',
              },
            ].map((item, i) => (
              <Reveal className="home-feature home-feature-small" delay={i * 0.04} key={item.title}>
                <item.icon size={23} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link aria-label={item.title} href={item.href}>
                  <ArrowUpRight size={19} />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="home-workflow ns-wrap" id="como-funciona">
          <Reveal className="home-section-heading">
            <span className="ns-kicker">DO SEU JEITO, DESDE O COMEÇO</span>
            <h2>
              Você conta a ideia.
              <br />
              <span>A NOSSOM acompanha.</span>
            </h2>
          </Reveal>
          <div className="home-steps">
            {[
              {
                icon: Paperclip,
                n: '01',
                title: 'Envie. Conte.',
                text: 'Anexe sua gravação ao assistente e diga o que quer melhorar. Não precisa escolher parâmetros para começar.',
              },
              {
                icon: Sparkles,
                n: '02',
                title: 'Restaure. Escute.',
                text: 'O motor restaura a fala com o preset D. Compare com o original e revise a pronúncia antes de seguir.',
              },
              {
                icon: Headphones,
                n: '03',
                title: 'Ajuste. Compartilhe.',
                text: 'Abra os botões de acabamento: encorpar, equalizar, adicionar efeitos ou preparar para publicar. Cada ajuste cria uma nova versão.',
              },
            ].map((step) => (
              <Reveal key={step.n} className="home-step">
                <div>
                  <span>{step.n}</span>
                  <step.icon size={23} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="home-workflow-cta">
            <button className="button secondary" onClick={() => setAssistant(true)}>
              Vamos conversar <AudioLines size={17} />
            </button>
            <span>Conheça o assistente. Entre na sua conta para usar a IA da plataforma.</span>
          </Reveal>
        </section>
        <section className="home-access ns-wrap" id="acesso">
          <Reveal>
            <span className="ns-kicker">SEU ESPAÇO, ABERTO PARA CRIAR</span>
            <h2>
              Onde estiver.
              <br />
              <span>No seu fluxo.</span>
            </h2>
            <p>
              No computador, mais espaço para finalizar.
              <br />
              No celular, uma ideia a um toque de distância.
            </p>
            <div className="home-access-actions">
              <Link className="button primary" href="/studio">
                Abrir meu estúdio <ArrowRight size={16} />
              </Link>
              <Link href="/apps" className="button secondary">
                <Monitor size={17} /> Aplicativos
              </Link>
            </div>
            <div className="home-device-labels">
              <span>
                <Monitor size={17} /> Mac e Windows
              </span>
              <span>
                <Smartphone size={17} /> iPhone e Android
              </span>
            </div>
            <small>Projetos locais, sem sincronização de áudio entre dispositivos.</small>
          </Reveal>
          <Reveal className="home-plan-card">
            <span>SEU PLANO PARA COMEÇAR</span>
            <h3>
              NOSSOM <span>Gratuito</span>
            </h3>
            <div className="home-plan-count">
              <strong>5</strong>
              <span>
                minutos de IA
                <br />
                por mês
              </span>
            </div>
            <ul>
              {[
                'Assistente de IA da plataforma',
                'Tratamentos, efeitos e presets',
                'Histórico e comparação A/B',
                'Exportação WAV e MP3',
              ].map((item) => (
                <li key={item}>
                  <Check size={16} />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/entrar?modo=criar" className="button primary">
              Criar minha conta <ArrowUpRight size={16} />
            </Link>
            <p>Sem chave de API para configurar.</p>
          </Reveal>
        </section>
        <section className="ns-wrap" id="planos">
          <PlanCards />
        </section>
        <section className="ns-faq ns-wrap">
          <Reveal>
            <span className="ns-kicker">ANTES DO PRIMEIRO PLAY</span>
            <h2>
              Algumas respostas.
              <br />
              <span>Mais possibilidades.</span>
            </h2>
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
        <section className="home-finale">
          <div aria-hidden="true">
            <AIMotion state="idle" compact />
          </div>
          <Reveal>
            <span className="home-eyebrow">TUDO ACONTECE NO SOM.</span>
            <h2>
              Vamos ouvir
              <br />
              <span>o que vem agora?</span>
            </h2>
            <Link href="/studio" className="button primary">
              Criar com a NOSSOM <ArrowUpRight size={17} />
            </Link>
            <p>
              <Lock size={14} /> Seu áudio com você. Sua próxima ideia, aqui.
            </p>
          </Reveal>
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
      {assistant && <Assistant onClose={() => setAssistant(false)} />}
    </div>
  );
}
