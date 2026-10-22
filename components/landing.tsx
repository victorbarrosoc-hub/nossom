'use client';
import Link from 'next/link';
import { useState, useRef, type ReactNode, type CSSProperties } from 'react';
import { motion, useInView } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
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
  Waves,
} from 'lucide-react';
import { Brand, SoundRibbon } from './brand';
import Assistant from './assistant';
import DemoPlayer from './demo-player';
import { operations } from '@/lib/presets';
import InstallApp from './install-app';
import AccountMenu from './account-menu';

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`ns-reveal ${className}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.9, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
function AnimatedDemo({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.15 });
  return (
    <div
      ref={ref}
      className={`ns-animation ${visible ? 'is-visible' : ''} ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
function Wave({ clean = false }: { clean?: boolean }) {
  return (
    <div className={`ns-wave ${clean ? 'clean' : ''}`}>
      {Array.from({ length: 64 }, (_, i) => (
        <i
          key={i}
          style={
            {
              '--h': `${(10 + Math.abs(Math.sin(i * 0.63) * Math.sin(i * 0.17)) * 78).toFixed(2)}%`,
              '--i': i,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
function CleanupDemo() {
  return (
    <AnimatedDemo className="ns-cleanup-demo">
      <div className="ns-demo-label">
        <span>
          <i className="ns-dot blue" /> Original
        </span>
        <span>entrevista.wav</span>
      </div>
      <Wave />
      <div className="ns-signal-path">
        <span />
        <Sparkles size={18} />
        <span />
      </div>
      <div className="ns-demo-label">
        <span>
          <i className="ns-dot purple" /> Tratado
        </span>
        <span>Menos ruído. A mesma voz.</span>
      </div>
      <Wave clean />
    </AnimatedDemo>
  );
}
const faqs = [
  [
    'Preciso entender de áudio para começar?',
    'Comece pelo que quer resolver: ruído, clareza, volume ou mixagem. Cada ferramenta explica o que faz. Os detalhes técnicos ficam disponíveis quando você precisar.',
  ],
  [
    'Meu áudio vai para algum servidor?',
    'No estúdio local, importação, tratamento e exportação acontecem no seu navegador. Os projetos ficam neste dispositivo. A conversa por voz, quando configurada e iniciada por você, usa o microfone com o ElevenLabs.',
  ],
  [
    'Quais arquivos posso usar?',
    'WAV, MP3, M4A, FLAC, OGG e áudio de MP4 ou MOV, conforme o codec. Até 100 MB e 10 minutos, mono ou estéreo. Exporte WAV de 16 bits ou MP3 a 320 kbps, em 48 kHz.',
  ],
  [
    'Posso voltar ao original?',
    'Sim. O arquivo enviado fica preservado e cada tratamento cria uma versão. Você pode ouvir, baixar ou retomar uma versão anterior. Exporte seus projetos antes de limpar os dados do navegador.',
  ],
  [
    'Quais recursos de IA estão disponíveis?',
    'A limpeza de fala usa RNNoise, um modelo neural que roda localmente. Há também redução espectral, equalização e dinâmica ajustáveis. O assistente sugere tratamentos por regras de intenção. Conversa por voz depende da configuração do ElevenLabs; separação por IA e colaboração em nuvem estão em desenvolvimento.',
  ],
];
export default function Landing() {
  const [menu, setMenu] = useState(false),
    [assistant, setAssistant] = useState(false),
    [faq, setFaq] = useState<number | null>(null);
  return (
    <div className="ns-site">
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
              ['Como funciona', 'como-funciona'],
              ['Possibilidades', 'possibilidades'],
              ['Acesso', 'acesso'],
            ].map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="ns-nav-actions">
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
        <section className="ns-hero ns-wrap">
          <Reveal className="ns-hero-copy">
            <h1>
              O som em
              <br />
              outra <span>escala.</span>
            </h1>
            <p>
              Grave, limpe e dê o toque final.
              <br />
              Seu áudio pronto para ser ouvido,
              <br />
              em um só lugar.
            </p>
            <div className="ns-actions">
              <Link className="button primary" href="/studio">
                Começar a criar <ArrowRight size={16} />
              </Link>
              <a className="button secondary" href="#experimente">
                <Play size={13} /> Ouça a diferença
              </a>
            </div>
            <span className="ns-fine">
              <ShieldCheck size={14} /> Sua conta, seu espaço. Seu áudio fica com você.
            </span>
          </Reveal>
          <Reveal className="ns-hero-stage" delay={0.1}>
            <AnimatedDemo className="ns-hero-ribbon">
              <SoundRibbon />
            </AnimatedDemo>
            <div className="ns-ribbon-caption">
              <span>UMA NOVA FREQUÊNCIA</span>
              <span>∿</span>
            </div>
          </Reveal>
        </section>
        <section className="ns-listen" id="experimente">
          <div className="ns-wrap">
            <Reveal className="ns-section-heading">
              <span className="ns-kicker">APERTE O PLAY</span>
              <h2>O ouvido decide.</h2>
              <p>Alterne entre o original e o filtro. Sinta o que muda.</p>
            </Reveal>
            <Reveal className="ns-listen-panel">
              <DemoPlayer />
              <p className="ns-demo-note">
                Demonstração com sinal sintetizado. O filtro atenua as frequências altas.
              </p>
            </Reveal>
          </div>
        </section>
        <div className="ns-stats ns-wrap">
          {[
            [String(operations.length), 'ferramentas de áudio'],
            ['A / B', 'compare cada detalhe'],
            ['2', 'formatos de exportação'],
            ['100%', 'processamento local'],
          ].map(([n, label]) => (
            <div key={n}>
              <strong>{n}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <section className="ns-section ns-wrap" id="produto">
          <Reveal className="ns-section-heading">
            <span className="ns-kicker">FERRAMENTAS PARA O SEU SOM</span>
            <h2>
              Um bom áudio.
              <br />
              Sem complicar.
            </h2>
            <p>Do primeiro ajuste à versão que você quer compartilhar.</p>
          </Reveal>
          <div className="ns-feature-grid">
            <Reveal className="ns-feature large">
              <div className="ns-card-heading">
                <span className="ns-tag blue">Tratamento</span>
                <span className="ns-mini-pill">
                  <Sparkles size={12} /> Menos distração
                </span>
              </div>
              <h3>Deixe a sua voz aparecer.</h3>
              <p>Reduza ruído e vento. Traga clareza sem perder a sua essência.</p>
              <CleanupDemo />
              <div className="ns-card-foot">
                <span>Ilustração do tratamento</span>
                <Link href="/studio?tool=denoise">
                  Tratar meu áudio <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
            <Reveal className="ns-feature large" delay={0.06}>
              <div className="ns-card-heading">
                <span className="ns-tag purple">Masterização</span>
                <span className="ns-mini-pill">
                  <Download size={12} /> Pronto para sair
                </span>
              </div>
              <h3>O volume certo. Para cada destino.</h3>
              <p>Escolha o perfil, confira as medições e finalize com confiança.</p>
              <AnimatedDemo className="ns-master-demo">
                <div className="ns-demo-label">
                  <span>Perfil de entrega</span>
                  <span>Podcast estéreo</span>
                </div>
                <div className="ns-target">
                  <strong>
                    −16 <small>LUFS</small>
                  </strong>
                  <span>Alvo de volume</span>
                </div>
                <div className="ns-meter">
                  {Array.from({ length: 32 }, (_, i) => (
                    <i key={i} style={{ '--i': i } as CSSProperties} />
                  ))}
                </div>
                <div className="ns-master-values">
                  <span>
                    <Check size={13} /> Volume consistente
                  </span>
                  <span>WAV / MP3</span>
                </div>
              </AnimatedDemo>
              <div className="ns-card-foot">
                <span>Prévia do perfil, sem áudio carregado</span>
                <Link href="/studio?tool=master">
                  Preparar entrega <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
            {[
              {
                icon: Mic,
                title: 'Uma ideia, gravada.',
                text: 'Abra o microfone e capture o que acabou de imaginar.',
                tool: 'denoise',
                color: 'blue',
              },
              {
                icon: SlidersHorizontal,
                title: 'Tudo em equilíbrio.',
                text: 'Nivele a voz e misture uma trilha sem encobrir a conversa.',
                tool: 'mix',
                color: 'purple',
              },
              {
                icon: History,
                title: 'Pode experimentar.',
                text: 'Cada ajuste vira uma versão. O original continua seu.',
                tool: 'clarity',
                color: 'green',
              },
              {
                icon: Download,
                title: 'Do play para o mundo.',
                text: 'Exporte em WAV ou MP3, direto do seu navegador.',
                tool: 'master',
                color: 'blue',
              },
            ].map((f, i) => (
              <Reveal className="ns-feature compact" delay={i * 0.06} key={f.title}>
                <span className={`ns-icon ${f.color}`}>
                  <f.icon size={19} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <Link
                  aria-label={`Explorar: ${f.title}`}
                  href={`/studio?tool=${f.tool}`}
                  className="ns-card-arrow"
                >
                  <ArrowUpRight size={17} />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="ns-section ns-wrap" id="como-funciona">
          <Reveal className="ns-section-heading">
            <span className="ns-kicker">NO SEU RITMO</span>
            <h2>
              Do bruto ao pronto.
              <br />
              Em três passos.
            </h2>
          </Reveal>
          <div className="ns-workflow">
            {[
              {
                n: '01',
                icon: FileAudio,
                title: 'Traga o seu som.',
                text: 'Arraste um arquivo ou grave uma ideia. Crie sua conta e comece, sem instalar nada.',
                label: 'Importar ou gravar',
              },
              {
                n: '02',
                icon: SlidersHorizontal,
                title: 'Encontre o ponto.',
                text: 'Escolha o tratamento. Ajuste, ouça e compare com o original.',
                label: 'Ouvir e comparar',
              },
              {
                n: '03',
                icon: Headphones,
                title: 'Dê o próximo play.',
                text: 'Confira o resultado e baixe. Seu áudio pronto para o próximo capítulo.',
                label: 'Exportar WAV ou MP3',
              },
            ].map((s, i) => (
              <Reveal key={s.n} className="ns-step" delay={i * 0.06}>
                <div>
                  <span className="ns-step-number">{s.n}</span>
                  <s.icon size={24} strokeWidth={1.5} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <span className="ns-step-label">
                  {s.label}
                  <ArrowRight size={14} />
                </span>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="ns-wrap" id="possibilidades">
          <Reveal className="ns-conversation">
            <div>
              <span className="ns-kicker">UMA IDEIA PUXA OUTRA</span>
              <h2>
                Conte o que você
                <br />
                quer ouvir.
              </h2>
              <p>
                “Quero minha voz mais presente.”
                <br />O assistente ajuda a encontrar um tratamento.
                <br />
                Você ouve e decide o próximo passo.
              </p>
              <button className="button primary" onClick={() => setAssistant(true)}>
                Vamos conversar <AudioLines size={17} />
              </button>
              <small>
                Sugestões por texto disponíveis.
                <br />
                Conversa por voz depende da configuração do ElevenLabs.
              </small>
            </div>
            <AnimatedDemo className="ns-conversation-art">
              <div className="ns-speech">Quero menos ruído na minha entrevista.</div>
              <div className="ns-audio-orb">
                <AudioLines size={48} strokeWidth={1} />
              </div>
              <div className="ns-reply">
                <span className="ns-icon purple">
                  <Sparkles size={16} />
                </span>
                <div>
                  <strong>Vamos começar com um ajuste leve.</strong>
                  <span>Reduzir ruído · intensidade suave</span>
                </div>
                <ArrowRight size={16} />
              </div>
              <span className="ns-art-caption">Prévia de uma sugestão</span>
            </AnimatedDemo>
          </Reveal>
        </section>
        <section className="ns-section ns-platforms" id="acesso">
          <div className="ns-wrap">
            <Reveal className="ns-section-heading">
              <span className="ns-kicker">SEU ESPAÇO PARA CRIAR</span>
              <h2>Onde a ideia acontecer.</h2>
              <p>Abra no navegador. Comece no seu tempo.</p>
            </Reveal>
            <div className="ns-platform-grid">
              {[
                {
                  icon: Monitor,
                  title: 'No computador',
                  text: 'Mais espaço para ouvir, comparar e finalizar.',
                  action: 'Abrir estúdio',
                },
                {
                  icon: Smartphone,
                  title: 'No celular',
                  text: 'Grave uma ideia e cuide do som onde estiver.',
                  action: 'Começar a gravar',
                },
                {
                  icon: Waves,
                  title: 'Do seu jeito',
                  text: 'Sua conta inclui 10 tratamentos de áudio por semana.',
                  action: 'Experimentar grátis',
                },
              ].map((c) => (
                <Reveal className="ns-platform" key={c.title}>
                  <c.icon size={25} strokeWidth={1.5} />
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                  <Link href="/studio" className="button secondary">
                    {c.action}
                    <ArrowRight size={14} />
                  </Link>
                </Reveal>
              ))}
            </div>
            <p className="ns-platform-note">
              Até 100 MB e 10 minutos por arquivo. Projetos salvos neste navegador, sem
              sincronização entre aparelhos.
            </p>
          </div>
        </section>
        <section className="ns-faq ns-wrap">
          <Reveal>
            <span className="ns-kicker">ANTES DO PRIMEIRO PLAY</span>
            <h2>
              Vamos tirar
              <br />
              as dúvidas.
            </h2>
          </Reveal>
          <div>
            {faqs.map(([q, a], i) => (
              <div className="ns-faq-item" key={q}>
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  aria-expanded={faq === i}
                  aria-controls={`faq-${i}`}
                >
                  {q}
                  {faq === i ? <Minus size={17} /> : <Plus size={17} />}
                </button>
                <div id={`faq-${i}`} hidden={faq !== i}>
                  <p>{a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="ns-close">
          <Reveal>
            <span className="ns-private-pill">
              <Lock size={12} /> Do seu áudio para o seu próximo projeto
            </span>
            <h2>
              Seu som é seu.
              <br />
              Do início ao fim.
            </h2>
            <p>
              O tratamento acontece no seu dispositivo.
              <br />
              Você cria. O original fica com você.
            </p>
            <Link href="/studio" className="button primary">
              Começar a criar <ArrowRight size={16} />
            </Link>
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
