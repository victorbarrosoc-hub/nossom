'use client';
import { useState, useEffect, useRef, useId } from 'react';
import AIMotion from './ai-motion';
import { useDialog } from '@/lib/use-dialog';
import { useConversation } from '@elevenlabs/react';
import {
  ArrowUp,
  Paperclip,
  FileAudio,
  AudioLines,
  Mic,
  PhoneOff,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { inferPlan, operations, type Operation } from '@/lib/presets';
export default function Assistant({
  onClose = () => {},
  onPlan,
  context,
  embedded = false,
  onUpload,
  fileName,
  disabled = false,
}: {
  onClose?: () => void;
  embedded?: boolean;
  onUpload?: () => void;
  fileName?: string;
  disabled?: boolean;
  onPlan?: (operation: Operation, intensity?: number, eqPreset?: string) => void;
  context?: Record<string, number | null>;
}) {
  const id = useId();
  const Title = embedded ? 'h1' : 'h2';
  const [cloud, setCloud] = useState(false),
    [authenticated, setAuthenticated] = useState(false),
    [loading, setLoading] = useState(true),
    [thinking, setThinking] = useState(false);
  const [recommended, setRecommended] = useState<{ intensity?: number; eqPreset?: string }>({});
  const pending = useRef<AbortController | null>(null);
  const managedConversation = useRef<string | undefined>(undefined);
  function endManagedConversation() {
    const token = managedConversation.current;
    managedConversation.current = undefined;
    if (token)
      void fetch('/api/ai/assistant', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: token }),
        keepalive: true,
      }).catch(() => {});
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/ai/status', { cache: 'no-store', signal: controller.signal })
      .then((r) => r.json())
      .then((s) => {
        setAuthenticated(s.authorized === true);
        setCloud(s.configured && s.authorized);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      pending.current?.abort();
      endManagedConversation();
    };
  }, []);
  const [text, setText] = useState(''),
    [reply, setReply] = useState(''),
    [plan, setPlan] = useState<Operation | null>(null),
    [error, setError] = useState('');
  useDialog(!embedded);
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
  useEffect(() => {
    pending.current?.abort();
    endManagedConversation();
    setReply('');
    setPlan(null);
    setThinking(false);
  }, [fileName]);
  const connected = conversation.status === 'connected';
  async function suggest(value: string) {
    if (loading || !authenticated || disabled) return;
    setText(value);
    setError('');
    setRecommended({});
    if (cloud) {
      setThinking(true);
      setPlan(null);
      pending.current?.abort();
      const controller = new AbortController();
      pending.current = controller;
      try {
        const response = await fetch('/api/ai/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: value, context, conversation: managedConversation.current }),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (typeof result.conversation === 'string')
          managedConversation.current = result.conversation;
        setReply(result.reply);
        setPlan(operations.some((o) => o.id === result.operation) ? result.operation : null);
        setRecommended({ intensity: result.intensity, eqPreset: result.eqPreset });
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'O Claude não concluiu a sugestão.');
      } finally {
        if (!controller.signal.aborted) setThinking(false);
      }
      return;
    }
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
    <div
      className={embedded ? 'assistant-embedded' : 'modal-backdrop'}
      onClick={embedded ? undefined : onClose}
    >
      <section
        className="assistant-panel"
        role={embedded ? undefined : 'dialog'}
        aria-modal={embedded ? undefined : true}
        aria-labelledby={id + '-title'}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <span className="eyebrow">UMA NOVA FORMA DE CRIAR</span>
          {!embedded && (
            <button className="icon-button" aria-label="Fechar assistente" onClick={onClose}>
              <X size={19} />
            </button>
          )}
        </header>
        <AIMotion
          state={
            error
              ? 'error'
              : conversation.isSpeaking
                ? 'speaking'
                : connected
                  ? 'listening'
                  : thinking
                    ? 'thinking'
                    : reply
                      ? 'speaking'
                      : 'idle'
          }
        />
        <Title id={id + '-title'}>
          O que vamos ouvir
          <br />
          <span className="text-gradient">de diferente hoje?</span>
        </Title>
        <p>
          {embedded ? (
            'Envie seu áudio e conte o que quer melhorar.'
          ) : (
            <>
              Descreva o que quer melhorar.
              <br />
              Eu encontro um ponto de partida para o seu som.
            </>
          )}
        </p>
        <div className="assistant-mode">
          <Sparkles size={13} />{' '}
          {loading
            ? 'Preparando seu assistente…'
            : cloud
              ? 'IA NOSSOM · pronta para conversar'
              : authenticated
                ? 'Ajuda básica · IA temporariamente indisponível'
                : 'Entre na sua conta para conversar'}
        </div>
        {cloud && (
          <p className="field-hint">
            Seu pedido e as medições são enviados à Anthropic. A restauração avançada envia uma
            cópia temporária do áudio à GPU; os projetos ficam neste dispositivo.
          </p>
        )}
        {!loading && !authenticated && (
          <a className="button primary" href="/entrar?next=%2Fstudio%2Fia">
            Entrar para conversar
          </a>
        )}
        {fileName && (
          <div className="assistant-attachment">
            <FileAudio size={20} />
            <span>
              <strong>{fileName}</strong>
              <small>Áudio anexado · pronto para análise</small>
            </span>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            suggest(text);
          }}
        >
          {onUpload && (
            <button
              type="button"
              className="assistant-attach"
              aria-label="Anexar áudio ao assistente"
              onClick={onUpload}
              disabled={disabled || thinking}
            >
              <Paperclip size={20} />
            </button>
          )}
          <label className="sr-only" htmlFor={id + '-text'}>
            Descreva seu objetivo
          </label>
          <input
            id={id + '-text'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="O que vamos fazer com o seu áudio?"
            maxLength={1500}
            disabled={thinking || loading || !authenticated || disabled}
            required
          />
          <button
            disabled={thinking || loading || !authenticated || disabled}
            aria-label="Encontrar tratamento"
            className="icon-button solid"
          >
            <ArrowUp size={18} />
          </button>
        </form>
        <div className="suggestion-chips">
          {['Melhorar minha voz', 'Nivelar volumes', 'Preparar para publicar'].map((s) => (
            <button
              key={s}
              disabled={thinking || loading || !authenticated || disabled}
              onClick={() => suggest(s)}
            >
              {s}
            </button>
          ))}
        </div>
        {thinking && (
          <p className="field-hint" role="status">
            A NOSSOM está analisando seu pedido e as medições…
          </p>
        )}
        {reply && (
          <div className="assistant-reply" aria-live="polite">
            <p>{reply}</p>
            {plan && (
              <button
                className="button small primary"
                onClick={() => {
                  if (onPlan) {
                    onPlan(plan, recommended.intensity, recommended.eqPreset);
                    onClose();
                  } else location.href = `/studio?tool=${plan}`;
                }}
              >
                Revisar tratamento <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
        {agentId && (
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
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
