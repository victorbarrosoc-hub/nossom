'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { allowance, initialPlans, price, type Plan } from '@/lib/plans';
export default function PlanCards({ current }: { current?: string }) {
  const [plans, setPlans] = useState(initialPlans);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/plans', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.plans) && data.plans.length === 3) setPlans(data.plans);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <section className="plans-section" aria-label="Planos da NOSSOM">
      <div className="plans-intro">
        <h2>Um plano para o seu ritmo.</h2>
        <p>
          A franquia é para restauração com IA. Equalização, efeitos e masterização local não
          descontam minutos.
        </p>
      </div>
      <div className="plans-grid">
        {plans.map((plan: Plan) => (
          <article
            className={`plan-choice ${plan.id === 'essential' ? 'featured' : ''}`}
            key={plan.id}
          >
            <div className="plan-choice-head">
              <h3>{plan.name}</h3>
              {current === plan.id && <span>Seu plano</span>}
            </div>
            <div className="plan-price">
              <strong>{plan.price_cents === 0 ? 'Grátis' : price(plan.price_cents)}</strong>
              {plan.price_cents > 0 && <span>/mês</span>}
            </div>
            <p className="plan-time">
              <strong>{allowance(plan.monthly_seconds)}</strong> de restauração por mês
            </p>
            <ul>
              {[
                'Restauração NOSSOM Restore D',
                'Assistente da plataforma incluído',
                'EQ, multibanda e efeitos locais',
                'Histórico, comparação e exportação',
              ].map((item) => (
                <li key={item}>
                  <Check size={16} />
                  {item}
                </li>
              ))}
            </ul>
            {plan.id === 'free' ? (
              <Link className="button secondary" href="/entrar?modo=criar">
                Começar grátis <ArrowUpRight size={16} />
              </Link>
            ) : (
              <a
                className="button primary"
                href={`mailto:victorbarrosoc@gmail.com?subject=${encodeURIComponent('Ativação NOSSOM · ' + plan.name)}`}
              >
                Solicitar ativação <ArrowUpRight size={16} />
              </a>
            )}
          </article>
        ))}
      </div>
      <p className="plans-terms">
        Franquia renovada no dia 1, à 0h de Brasília, sem acumular saldo. Cada restauração desconta
        no mínimo 1 minuto; áudios maiores usam a duração em segundos. Até 100 MB e 10 minutos por
        arquivo. Planos pagos são ativados pelo administrador após contato; não há cobrança
        automática de cartão nesta etapa.
      </p>
    </section>
  );
}
