'use client';
import CinematicRibbon from './cinematic-ribbon';
export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';
const labels: Record<AIState, string> = {
  idle: 'Pronta para criar com você',
  listening: 'Ouvindo você',
  thinking: 'Encontrando o melhor caminho para o seu som',
  speaking: 'Uma nova possibilidade para o seu som',
  error: 'Vamos tentar de novo',
};
export default function AIMotion({
  state = 'idle',
  compact = false,
}: {
  state?: AIState;
  compact?: boolean;
}) {
  return (
    <div className={`ai-motion ${compact ? 'compact' : ''} state-${state}`}>
      <CinematicRibbon energetic={['thinking', 'speaking', 'listening'].includes(state)} />
      {!compact && (
        <span className="ai-motion-label" role="status">
          {labels[state]}
        </span>
      )}
    </div>
  );
}
