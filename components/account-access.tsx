'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, LoaderCircle, ShieldCheck, UserRound } from 'lucide-react';
import { Brand, SoundRibbon } from './brand';
export default function AccountAccess({ next }: { next: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login'),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [confirmation, setConfirmation] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, name, email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível entrar.');
      if (result.confirmationRequired) {
        setConfirmation(true);
        setBusy(false);
        return;
      }
      // A full navigation clears the previous user's client state and any active workers.
      location.assign(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.');
      setBusy(false);
    }
  }
  return (
    <main className="account-page">
      <section className="account-story" aria-label="NOSSOM">
        <Link href="/" aria-label="NOSSOM página inicial">
          <Brand />
        </Link>
        <SoundRibbon />
        <div>
          <span className="eyebrow">SEU ESPAÇO PARA CRIAR</span>
          <h2>
            O seu som.
            <br />
            <span>O seu lugar.</span>
          </h2>
          <p>Trate, crie e entregue. O assistente NOSSOM já está pronto para acompanhar você.</p>
        </div>
        <small>
          <ShieldCheck size={15} /> Seus arquivos continuam no seu dispositivo.
        </small>
      </section>
      <section className="account-form-panel">
        <div className="account-form-wrap">
          <span className="account-avatar">
            <UserRound size={24} />
          </span>
          <h1>{mode === 'register' ? 'Crie sua conta.' : 'Que bom ter você aqui.'}</h1>
          <p>
            {mode === 'register'
              ? 'Seu assistente já vem conectado. Comece com 10 tratamentos de áudio por semana.'
              : 'Entre para continuar seus projetos e conversar com a IA da NOSSOM.'}
          </p>
          <div className="account-mode" role="group" aria-label="Acesso à conta">
            {(['login', 'register'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                className={mode === value ? 'active' : ''}
                disabled={busy}
                onClick={() => {
                  setMode(value);
                  setPassword('');
                  setError('');
                  setConfirmation(false);
                }}
              >
                {value === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            {mode === 'register' && (
              <label>
                Nome
                <input
                  name="name"
                  autoComplete="nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={60}
                  required
                  disabled={busy}
                  placeholder="Como podemos chamar você?"
                />
              </label>
            )}
            <label>
              E-mail
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                required
                disabled={busy}
                autoCapitalize="none"
                spellCheck={false}
                placeholder="voce@exemplo.com"
              />
            </label>
            <label>
              Senha
              <input
                name="password"
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === 'register' ? 8 : 1}
                maxLength={128}
                required
                disabled={busy}
                placeholder={mode === 'register' ? 'Pelo menos 8 caracteres' : 'Sua senha'}
              />
            </label>
            {confirmation && (
              <p className="account-confirmation" role="status">
                Enviamos um link de confirmação para o seu e-mail. Abra o link e depois entre com
                sua senha.
              </p>
            )}
            {error && (
              <p className="account-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy ? (
                <LoaderCircle size={18} className="spin" />
              ) : (
                <>
                  {mode === 'register' ? 'Criar conta e entrar' : 'Entrar no estúdio'}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <p className="account-local-note">
            Sua conta é protegida pelo Supabase. Os arquivos de áudio ficam neste dispositivo; o
            limite semanal acompanha sua conta.
          </p>
          <Link className="text-link" href="/privacidade">
            Privacidade e armazenamento
          </Link>
        </div>
      </section>
    </main>
  );
}
