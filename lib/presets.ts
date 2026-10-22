export type Operation = 'denoise' | 'clarity' | 'wind' | 'level' | 'master' | 'mix';
export type Intensity = 'light' | 'balanced' | 'strong';
export const operations: { id: Operation; label: string; description: string }[] = [
  {
    id: 'denoise',
    label: 'Reduzir ruído',
    description: 'Atenue ruído contínuo, como ventilação e ar-condicionado.',
  },
  {
    id: 'clarity',
    label: 'Melhorar voz',
    description: 'Realce a presença da voz com equalização e dinâmica.',
  },
  {
    id: 'wind',
    label: 'Atenuar vento',
    description: 'Reduza graves excessivos. Rajadas fortes podem permanecer.',
  },
  {
    id: 'level',
    label: 'Nivelar volumes',
    description: 'Controle a diferença entre os trechos altos e baixos.',
  },
  {
    id: 'master',
    label: 'Preparar entrega',
    description: 'Ajuste o volume percebido e meça o resultado renderizado.',
  },
  {
    id: 'mix',
    label: 'Mixar com música',
    description: 'Adicione uma trilha e reduza seu volume durante a fala.',
  },
];
export const deliveryPresets = [
  {
    id: 'podcast',
    label: 'Podcast estéreo',
    lufs: -16,
    peak: -1,
    version: 'nossom-guidance-1',
    note: 'Orientação editorial, não uma exigência universal.',
  },
  {
    id: 'social',
    label: 'Vídeo e redes sociais',
    lufs: -14,
    peak: -1,
    version: 'nossom-guidance-1',
    note: 'Ponto de partida; cada plataforma normaliza de forma diferente.',
  },
  {
    id: 'ebu',
    label: 'TV · referência EBU R128',
    lufs: -23,
    peak: -1,
    version: 'nossom-ebu-reference-1',
    note: 'Referência de loudness. Confirme tolerâncias e true peak com o cliente; não constitui certificação.',
  },
] as const;
export function treatmentFilter(
  operation: Operation,
  intensity: Intensity,
  target = -16,
  peak = -1,
) {
  const amount = { light: 0, balanced: 1, strong: 2 }[intensity];
  switch (operation) {
    case 'denoise':
      return `afftdn=nr=${[6, 12, 18][amount]}:nf=-40:tn=1`;
    case 'clarity':
      return `highpass=f=75,equalizer=f=2800:t=q:w=0.8:g=${[2, 3.5, 5][amount]},acompressor=threshold=0.15:ratio=${[1.5, 2, 3][amount]}:attack=15:release=180:makeup=1.2`;
    case 'wind':
      return `highpass=f=${[80, 120, 180][amount]}:p=2`;
    case 'level':
      return `acompressor=threshold=0.12:ratio=${[2, 3, 4][amount]}:attack=10:release=220:makeup=1.5,alimiter=limit=0.8913:level=0`;
    case 'master':
      return `loudnorm=I=${target}:TP=${peak}:LRA=11:print_format=json`;
    default:
      throw new Error('Mixagem requer duas faixas.');
  }
}
export function inferPlan(text: string): Operation | null {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (/separ|stem|eco|reverb|transcrev|clon/.test(normalized)) return null;
  if (/ruid|ar.condicionado|chiado|limp/.test(normalized)) return 'denoise';
  if (/vento|grave/.test(normalized)) return 'wind';
  if (/music|trilha|duck|mix/.test(normalized)) return 'mix';
  if (/entreg|master|lufs|public/.test(normalized)) return 'master';
  if (/nivel|volume/.test(normalized)) return 'level';
  if (/voz|clareza|presenca/.test(normalized)) return 'clarity';
  return null;
}
