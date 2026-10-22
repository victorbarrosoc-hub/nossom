'use client';
import { useEffect, useState } from 'react';
import { AudioLines, Check, KeyRound, ExternalLink, LoaderCircle } from 'lucide-react';
export default function ClaudeSettings() {
  const [status, setStatus] = useState<{
      configured: boolean;
      authorized: boolean;
      model: string;
      missing: string[];
    } | null>(null),
    [code, setCode] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const refresh = () =>
    fetch('/api/ai/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setError('Não foi possível ler a conexão.'));
  useEffect(() => {
    void refresh();
  }, []);
  async function connect(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/ai/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCode('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao conectar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="claude-settings">
      <div className="studio-welcome">
        <div>
          <span className="eyebrow">DIREÇÃO CRIATIVA E TÉCNICA</span>
          <h1>Inteligência NOSSOM</h1>
          <p>Claude orienta os tratamentos. O motor de áudio transforma a gravação.</p>
        </div>
        <AudioLines size={35} />
      </div>
      <div className="ai-connection-card">
        <div>
          <span className="ns-icon purple">
            <AudioLines size={24} />
          </span>
          <h2>Claude Sonnet 5.5</h2>
          <p>Pensamento adaptativo · esforço alto</p>
        </div>
        <span className={`connection-status ${status?.authorized ? 'connected' : ''}`}>
          {status?.authorized ? (
            <>
              <Check size={15} /> Conectado nesta sessão
            </>
          ) : status?.configured ? (
            'Pronto para conectar'
          ) : (
            'Aguardando configuração'
          )}
        </span>
      </div>
      <div className="ai-setup-grid">
        <section className="ai-guide">
          <h2>Conectar a sua conta</h2>
          <ol>
            <li>
              <strong>Crie uma chave no Console Anthropic</strong>
              <p>
                A conta da API precisa ter acesso ao modelo e créditos. A assinatura do aplicativo
                Claude é separada.
              </p>
              <a
                className="text-link"
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
              >
                Abrir Console Anthropic <ExternalLink size={13} />
              </a>
            </li>
            <li>
              <strong>Configure as variáveis privadas no Vercel</strong>
              <p>No projeto NOSSOM, abra Settings → Environment Variables e adicione:</p>
              <dl>
                <dt>ANTHROPIC_API_KEY</dt>
                <dd>A chave da API, somente no servidor.</dd>
                <dt>ANTHROPIC_MODEL</dt>
                <dd>claude-sonnet-5-5</dd>
                <dt>NOSSOM_AI_ACCESS_CODE</dt>
                <dd>Um código privado com ao menos 16 caracteres para liberar esta área.</dd>
              </dl>
            </li>
            <li>
              <strong>Faça um novo deploy e conecte</strong>
              <p>
                Depois, digite o código ao lado. O servidor confirma o acesso ao modelo. A sessão
                dura uma hora.
              </p>
            </li>
          </ol>
        </section>
        <section className="ai-login">
          <KeyRound size={25} />
          <h2>{status?.authorized ? 'Seu assistente está conectado.' : 'Liberar o assistente'}</h2>
          <p>
            As chaves da API ficam no servidor. Aqui você usa somente o código de acesso criado para
            a NOSSOM.
          </p>
          {status?.authorized ? (
            <>
              <p className="ai-model-detail">
                Modelo: {status.model}
                <br />
                Esforço: high
              </p>
              <button
                className="button secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await fetch('/api/ai/session', { method: 'DELETE' });
                  await refresh();
                  setBusy(false);
                }}
              >
                Encerrar sessão
              </button>
            </>
          ) : (
            <form onSubmit={connect}>
              <label htmlFor="ai-access">Código de acesso da NOSSOM</label>
              <input
                id="ai-access"
                type="password"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={!status?.configured || busy}
                minLength={16}
                maxLength={256}
                required
              />
              <button className="button primary" disabled={!status?.configured || busy}>
                {busy ? <LoaderCircle className="spin" size={17} /> : <AudioLines size={17} />}
                Conectar Claude
              </button>
            </form>
          )}
          {status?.missing?.length ? (
            <p className="field-hint">Falta configurar no servidor: {status.missing.join(', ')}.</p>
          ) : null}
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <p className="field-hint">
            O Claude recebe seu pedido e as medições de áudio. A gravação não é enviada para ele.
            Cada conversa consome créditos da sua API; nenhuma sugestão aplica efeitos sozinha.
          </p>
        </section>
      </div>
    </section>
  );
}
