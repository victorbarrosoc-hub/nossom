'use client';
import { useState, useEffect } from 'react';
import { useDialog } from '@/lib/use-dialog';
import { useConversation } from '@elevenlabs/react';
import { ArrowUp, AudioLines, Mic, PhoneOff, X, Sparkles, ArrowRight } from 'lucide-react';
import { inferPlan, operations, type Operation } from '@/lib/presets';
export default function Assistant({
  onClose,
  onPlan,
}: {
  onClose: () => void;
  onPlan?: (operation: Operation) => void;
}) {
  const [text, setText] = useState(''),
    [reply, setReply] = useState(''),
    [plan, setPlan] = useState<Operation | null>(null),
    [error, setError] = useState('');
  useDialog(true);
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const conversation = useConversation({
    onError: () =>
      setError('Não foi possível conectar a voz. Confira a conexão e tente novamente.'),
    onMessage: (message) => {
      if (message.source === 'ai') setReply(message.message);
    },
  });
  useEffect(
    () => () => {
      void conversation.endSession();
    },
    [conversation.endSession],
  );
  const connected = conversation.status === 'connected';
  function suggest(value: string) {
    setText(value);
    const selected = inferPlan(value);
    setPlan(selected);
    setReply(
      selected
        ? `${operations.find((o) => o.id === selected)?.description} Você poderá revisar a intensidade antes de aplicar. Nenhum áudio foi alterado.`
        : 'Esse pedido ainda não tem um tratamento disponível. Posso ajudar com ruído contínuo, clareza da voz, vento, volume, mixagem ou preparação para entrega.',
    );
  }
  async function voice() {
    setError('');
    try {
      if (connected) await conversation.endSession();
      else if (agentId) await conversation.startSession({ agentId, connectionType: 'websocket' });
    } catch {
      setError(
        'Permita o microfone para conversar. Se o problema continuar, verifique o agente ElevenLabs.',
      );
    }
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="assistant-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <span className="eyebrow">UMA NOVA FORMA DE CRIAR</span>
          <button className="icon-button" aria-label="Fechar assistente" onClick={onClose}>
            <X size={19} />
          </button>
        </header>
        <div className={`voice-orb ${conversation.isSpeaking ? 'speaking' : ''}`}>
          <div />
          <AudioLines size={48} />
        </div>
        <h2 id="assistant-title">
          O que vamos ouvir
          <br />
          <span className="text-gradient">de diferente hoje?</span>
        </h2>
        <p>
          Descreva o que quer melhorar.
          <br />
          Eu encontro um ponto de partida para o seu som.
        </p>
        <div className="assistant-mode">
          <Sparkles size={13} /> Sugestões locais por intenção · sem IA generativa
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            suggest(text);
          }}
        >
          <label className="sr-only" htmlFor="assistant-text">
            Descreva seu objetivo
          </label>
          <input
            id="assistant-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Quero reduzir o ruído do meu áudio…"
            maxLength={500}
            required
          />
          <button aria-label="Encontrar tratamento" className="icon-button solid">
            <ArrowUp size={18} />
          </button>
        </form>
        <div className="suggestion-chips">
          {['Melhorar minha voz', 'Nivelar volumes', 'Preparar para publicar'].map((s) => (
            <button key={s} onClick={() => suggest(s)}>
              {s}
            </button>
          ))}
        </div>
        {reply && (
          <div className="assistant-reply" aria-live="polite">
            <p>{reply}</p>
            {plan && (
              <button
                className="button small primary"
                onClick={() => {
                  if (onPlan) {
                    onPlan(plan);
                    onClose();
                  } else location.href = `/studio?tool=${plan}`;
                }}
              >
                Revisar tratamento <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
        <div className="voice-connect">
          <button
            className={`button ${connected ? 'primary' : 'secondary'}`}
            disabled={!agentId || conversation.status === 'connecting'}
            onClick={voice}
          >
            {connected ? <PhoneOff size={16} /> : <Mic size={16} />}{' '}
            {connected
              ? 'Encerrar conversa'
              : conversation.status === 'connecting'
                ? 'Conectando…'
                : 'Conversar por voz'}
          </button>
          <span>
            {agentId
              ? 'Voz por ElevenLabs · o microfone é enviado ao provedor durante a conversa.'
              : 'Voz ElevenLabs disponível após conectar um agente.'}
          </span>
        </div>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
