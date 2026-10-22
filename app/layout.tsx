import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'NOSSOM — O som em outra escala.', template: '%s · NOSSOM' },
  description:
    'Do áudio gravado ao áudio pronto para entregar. Trate, mixe e finalize seu som em um estúdio que acompanha o seu fluxo.',
  applicationName: 'NOSSOM',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <noscript>
          <style>{'.ns-reveal { opacity: 1 !important; transform: none !important; }'}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
