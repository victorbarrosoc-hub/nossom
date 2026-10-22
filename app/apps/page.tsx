import Link from 'next/link';
import { Apple, Monitor, Download, ArrowLeft, Smartphone } from 'lucide-react';
import { Brand } from '@/components/brand';
import InstallApp from '@/components/install-app';
export const metadata = {
  title: 'Aplicativos NOSSOM',
  description: 'NOSSOM no Mac, Windows e na tela de início do seu celular.',
};
function download(value: string | undefined) {
  try {
    if (!value) return null;
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
export default function Apps() {
  const builds = [
    {
      title: 'Mac · Apple Silicon',
      detail: 'Para Macs com chips M1, M2, M3, M4 ou mais recentes.',
      file: '.dmg',
      url: download(process.env.NOSSOM_DOWNLOAD_MAC_ARM64_URL),
      icon: Apple,
    },
    {
      title: 'Mac · Intel',
      detail: 'Para Macs com processador Intel.',
      file: '.dmg',
      url: download(process.env.NOSSOM_DOWNLOAD_MAC_X64_URL),
      icon: Apple,
    },
    {
      title: 'Windows',
      detail: 'Para Windows 10 e 11, em computadores de 64 bits.',
      file: '.exe',
      url: download(process.env.NOSSOM_DOWNLOAD_WINDOWS_URL),
      icon: Monitor,
    },
  ];
  return (
    <main className="apps-page container">
      <Link href="/" aria-label="NOSSOM página inicial">
        <Brand />
      </Link>
      <Link className="text-link" href="/studio">
        <ArrowLeft size={16} />
        Voltar ao estúdio
      </Link>
      <span className="eyebrow">SEU SOM, ONDE VOCÊ CRIA</span>
      <h1>NOSSOM no seu dispositivo.</h1>
      <p>Escolha como abrir seu espaço. Sua conta e a IA são as mesmas em todas as versões.</p>
      <div className="apps-grid">
        {builds.map((build) => (
          <section key={build.title}>
            <build.icon size={32} />
            <h2>{build.title}</h2>
            <p>{build.detail}</p>
            <span className="apps-format">Instalador {build.file}</span>
            {build.url ? (
              <a className="button primary" href={build.url}>
                <Download size={17} />
                Baixar para {build.title}
              </a>
            ) : (
              <>
                <button className="button secondary" disabled>
                  Instalador em preparação
                </button>
                <small>O download será liberado quando o arquivo estiver publicado.</small>
              </>
            )}
          </section>
        ))}
      </div>
      <section className="apps-browser">
        <Smartphone size={30} />
        <div>
          <h2>Use agora, pelo navegador.</h2>
          <p>
            No iPhone, adicione à Tela de Início. No Mac, Safari → Arquivo → Adicionar ao Dock. No
            Windows, use a opção de instalação do Edge ou Chrome.
          </p>
          <InstallApp />
        </div>
      </section>
      <p className="apps-note">
        Os arquivos de áudio ficam no dispositivo onde foram importados. A conta e o saldo semanal
        são compartilhados; os projetos de áudio não são sincronizados entre aparelhos.
      </p>
    </main>
  );
}
