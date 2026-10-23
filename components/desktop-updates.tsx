'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bell, Download, Check, LoaderCircle, RefreshCw, X } from 'lucide-react';
import type { UpdateState } from '@/lib/desktop';
const headings: Record<UpdateState['status'], string> = {
  unavailable: 'Atualizações do aplicativo',
  idle: 'Seu aplicativo NOSSOM',
  checking: 'Buscando novidades…',
  current: 'Você está em dia.',
  available: 'Uma nova NOSSOM chegou.',
  downloading: 'Sua atualização está chegando.',
  downloaded: 'Tudo pronto para atualizar.',
  installing: 'Reiniciando a NOSSOM…',
  error: 'Vamos tentar de novo.',
};
export default function DesktopUpdates({
  blocked = false,
  floating = false,
}: {
  blocked?: boolean;
  floating?: boolean;
}) {
  const [state, setState] = useState<UpdateState | null>(null),
    [open, setOpen] = useState(false),
    [requested, setRequested] = useState(false),
    installing = useRef(false),
    reduced = useReducedMotion();
  useEffect(() => {
    const bridge = window.nossomDesktop;
    if (!bridge) return;
    let alive = true;
    const receive = (next: UpdateState) => {
      if (!alive || !next) return;
      setState(next);
      if (['available', 'downloaded', 'error'].includes(next.status)) setOpen(true);
    };
    const unsubscribe = bridge.onUpdate(receive);
    bridge
      .getUpdateState()
      .then(receive)
      .catch(() => {});
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (state?.status !== 'downloaded' || !requested || blocked || installing.current) return;
    const timer = setTimeout(() => {
      installing.current = true;
      window.nossomDesktop
        ?.update('install')
        .then((next) => {
          if (next) setState(next);
        })
        .catch(() => {
          installing.current = false;
          setRequested(false);
          setState((s) => s && { ...s, status: 'error' });
        });
    }, 3000);
    return () => clearTimeout(timer);
  }, [state?.status, requested, blocked]);
  async function act(action: 'check' | 'download' | 'install') {
    if (action === 'download') setRequested(true);
    try {
      const next = await window.nossomDesktop?.update(action);
      if (next) setState(next);
    } catch {
      setState((s) => s && { ...s, status: 'error' });
    }
  }
  if (!state) return null;
  const active = ['available', 'downloading', 'downloaded'].includes(state.status),
    busy = ['checking', 'downloading', 'installing'].includes(state.status);
  return (
    <>
      <button
        className={`icon-button desktop-update-trigger ${active ? 'has-update' : ''} ${floating ? 'floating' : ''}`}
        aria-label="Atualizações do aplicativo"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Bell size={18} />
        {active && <i />}
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.section
              className="desktop-update-notice"
              role="region"
              aria-label="Atualização NOSSOM"
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <button
                className="icon-button desktop-update-close"
                aria-label="Fechar aviso de atualização"
                onClick={() => setOpen(false)}
              >
                <X size={17} />
              </button>
              <span className="desktop-update-icon">
                {busy ? (
                  <LoaderCircle size={24} className="spin" />
                ) : state.status === 'current' ? (
                  <Check size={24} />
                ) : (
                  <Download size={24} />
                )}
              </span>
              <h2>{headings[state.status]}</h2>
              <p>
                Versão atual {state.version}
                {state.nextVersion ? ` · Nova versão ${state.nextVersion}` : ''}
              </p>
              {state.status === 'available' && (
                <>
                  <p>Baixe por aqui. Ao terminar, o aplicativo reinicia e instala a nova versão.</p>
                  <button className="button primary" onClick={() => act('download')}>
                    Atualizar agora <Download size={16} />
                  </button>
                </>
              )}
              {state.status === 'downloading' && (
                <>
                  <progress max="100" value={state.progress} aria-label="Download da atualização" />
                  <span aria-live="polite">{state.progress}% baixado</span>
                </>
              )}
              {state.status === 'downloaded' &&
                (blocked ? (
                  <p role="status">
                    Aguardando sua gravação ou tratamento terminar antes de reiniciar.
                  </p>
                ) : requested ? (
                  <p role="status">O download terminou. Reiniciando para instalar…</p>
                ) : (
                  <button className="button primary" onClick={() => setRequested(true)}>
                    Reiniciar e atualizar <RefreshCw size={16} />
                  </button>
                ))}
              {['idle', 'current', 'error'].includes(state.status) && (
                <>
                  {state.status === 'error' && (
                    <p role="status">
                      {state.error ||
                        'Não foi possível atualizar agora. Você pode continuar usando a plataforma.'}
                    </p>
                  )}
                  <button className="button secondary" onClick={() => act('check')}>
                    Buscar atualização <RefreshCw size={16} />
                  </button>
                </>
              )}
              {state.status === 'unavailable' && (
                <p>
                  As atualizações automáticas serão ativadas na distribuição assinada do aplicativo.
                  O estúdio pelo navegador recebe as novas versões ao abrir.
                </p>
              )}
            </motion.section>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
