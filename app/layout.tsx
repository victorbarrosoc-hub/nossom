import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://nossom-teal.vercel.app'),
  title: { default: 'NOSSOM — O som em outra escala.', template: '%s · NOSSOM' },
  description:
    'Do áudio gravado ao áudio pronto para entregar. Trate, mixe e finalize seu som em um estúdio que acompanha o seu fluxo.',
  applicationName: 'NOSSOM',
  other: { 'nossom-release': process.env.VERCEL_GIT_COMMIT_SHA || 'development' },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'NOSSOM', statusBarStyle: 'black-translucent' },
  icons: {
    icon: '/icon.svg',
    apple: [{ url: '/pwa/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'NOSSOM',
    title: 'NOSSOM — O som em outra escala.',
    description:
      'Crie, trate e entregue seu áudio. Seu estúdio com inteligência artificial, em um só lugar.',
    url: 'https://nossom-teal.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOSSOM — O som em outra escala.',
    description: 'Crie, trate e entregue seu áudio. Tudo acontece no som.',
    images: ['/opengraph-image'],
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#080e16',
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
