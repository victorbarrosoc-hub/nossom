'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { Check, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { accountPlan, type Account } from '@/lib/accounts';
import PlanCards from './plan-cards';
import Link from 'next/link';
import { usageLabel, type AudioUsage } from '@/lib/usage';
export default function AccountSettings({
  account,
  usage,
  theme,
  onTheme,
}: {
  account: Account;
  usage: AudioUsage | null;
  theme: 'system' | 'light' | 'dark';
  onTheme: (theme: 'system' | 'light' | 'dark') => void;
}) {
  const router = useRouter(),
    reduced = useReducedMotion();
  const [name, setName] = useState(account.name),
    [email, setEmail] = useState(account.email),
    [password, setPassword] = useState(''),
    [currentPassword, setCurrentPassword] = useState(''),
    [emailPassword, setEmailPassword] = useState(''),
    [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  async function update(action: 'profile' | 'email' | 'password') {
    if (busy) return;
    setBusy(action);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          name,
          email,
          password,
          currentPassword: action === 'email' ? emailPassword : currentPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar.');
      setPassword('');
      setCurrentPassword('');
      setEmailPassword('');
      setSuccess(
        action === 'email'
          ? 'Confira os e-mails de confirmação enviados pelo Supabase. O endereço atual continua válido até a mudança ser confirmada.'
          : action === 'password'
            ? 'Sua senha foi atualizada.'
            : 'Seu perfil foi atualizado.',
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setBusy('');
    }
  }
  const button = (action: 'profile' | 'email' | 'password', label: string) => (
    <button className="button primary" disabled={!!busy}>
      {busy === action ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />} {label}
    </button>
  );
  return (
    <motion.section
      className="account-settings"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="eyebrow">DO SEU JEITO</span>
      <h1>Minha conta.</h1>
      <p>Seu perfil, sua segurança e suas preferências.</p>
      <div className="account-settings-summary">
        <span className="account-profile-avatar">{account.name[0].toUpperCase()}</span>
        <div>
          <strong>{account.name}</strong>
          <span className="account-plan">{accountPlan(account, usage)}</span>
          <p>{account.email}</p>
        </div>
        <span>{account.isAdmin ? 'Administrador' : 'Conta NOSSOM'}</span>
      </div>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="account-settings-success" role="status">
          {success}
        </p>
      )}
      {account.isAdmin && (
        <Link className="button secondary" href="/studio/admin">
          Abrir painel de administração
        </Link>
      )}
      <div className="account-settings-grid">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void update('profile');
          }}
        >
          <UserRound size={23} />
          <h2>Perfil</h2>
          <label>
            Nome de exibição
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={60}
              autoComplete="nickname"
              required
              disabled={!!busy}
            />
          </label>
          {button('profile', 'Salvar perfil')}
        </form>
        <section>
          <h2>Aparência e uso</h2>
          <label>
            Tema da plataforma
            <select
              aria-label="Tema da plataforma"
              value={theme}
              onChange={(e) => onTheme(e.target.value as typeof theme)}
            >
              <option value="system">Tema do aparelho</option>
              <option value="dark">Escuro</option>
              <option value="light">Claro</option>
            </select>
          </label>
          <p>
            {usage?.unlimited
              ? 'Sua conta ADM não tem limite de minutos de restauração.'
              : usage
                ? usageLabel(usage)
                : 'Consulte seu saldo na navegação.'}
          </p>
          <p>A IA já está incluída na sua conta.</p>
        </section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void update('email');
          }}
        >
          <Mail size={23} />
          <h2>E-mail</h2>
          <label>
            Novo e-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={254}
              required
              disabled={!!busy}
            />
          </label>
          <label>
            Senha atual para alterar e-mail
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={!!busy}
            />
          </label>
          <p>
            A mudança exige confirmação. O acesso ADM depende do endereço administrativo confirmado.
          </p>
          {button('email', 'Alterar e-mail')}
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void update('password');
          }}
        >
          <LockKeyhole size={23} />
          <h2>Senha</h2>
          <label>
            Senha atual
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={!!busy}
            />
          </label>
          <label>
            Nova senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={!!busy}
            />
          </label>
          {button('password', 'Atualizar senha')}
        </form>
      </div>
      {!account.isAdmin && <PlanCards current={usage?.planId} />}
    </motion.section>
  );
}
