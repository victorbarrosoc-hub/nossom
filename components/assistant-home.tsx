'use client';
import AIMotion from './ai-motion';
import { useEffect, useState } from 'react';
import { AudioLines, ArrowRight, Check, Sparkles } from 'lucide-react';
export default function AssistantHome({ onOpen }: { onOpen: () => void }) {
  const [ready, setReady] = useState<boolean | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/ai/status', { cache: 'no-store', signal: controller.signal })
      .then((r) => r.json())
      .then((s) => setReady(s.authorized && s.configured))
      .catch(() => setReady(false));
    return () => controller.abort();
  }, []);
  return (
    <section className="assistant-home">
      <span className="eyebrow">ASSISTENTE NOSSOM</span>
      <AIMotion />
      <h1>
        Uma IA para
        <br />
        <span className="text-gradient">o seu próximo som.</span>
      </h1>
      <p>
        Conte o que você quer criar ou melhorar. O assistente da NOSSOM ajuda a encontrar o
        tratamento e os ajustes para o seu projeto.
      </p>
      <div className="assistant-ready" role="status">
        {ready === null ? (
          'Preparando seu assistente…'
        ) : ready ? (
          <>
            <Check size={16} /> Conectado à sua conta
          </>
        ) : (
          'O assistente está temporariamente indisponível. A ajuda básica continua disponível.'
        )}
      </div>
      <button className="button primary" onClick={onOpen}>
        <Sparkles size={17} /> Conversar com a IA <ArrowRight size={16} />
      </button>
      <small>
        O assistente já faz parte da plataforma. Suas conversas são individuais e seu áudio
        permanece no dispositivo.
      </small>
    </section>
  );
}
