import { broadcastFilter, type BroadcastSettings } from './broadcast';
import { equalizerFilter, type EqGains } from './equalizer';
export type Operation = 'denoise' | 'clarity' | 'eq' | 'wind' | 'level' | 'master' | 'mix';
export type Intensity = number | 'light' | 'balanced' | 'strong';
export type DenoiseMode = 'studio' | 'voice' | 'general';
export function strengthValue(value: Intensity): number {
  const n = typeof value === 'number' ? value : { light: 30, balanced: 65, strong: 100 }[value];
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 65;
}
export type FilterSettings = {
  noiseFloor?: number;
  noiseReduction?: number;
  presence?: number;
  compression?: number;
  highpass?: number;
  deess?: number;
  hum?: number;
  neuralAttenuation?: number;
  neural?: boolean;
  eq?: EqGains;
  masterPreset?: string;
  broadcast?: BroadcastSettings;
};
export const operations: { id: Operation; label: string; description: string }[] = [
  {
    id: 'denoise',
    label: 'Reduzir ruído',
    description: 'Limpeza neural para fala ou redução espectral para áudio geral.',
  },
  {
    id: 'clarity',
    label: 'Melhorar voz',
    description: 'Combine limpeza, presença e compressão, com controles independentes.',
  },
  {
    id: 'eq',
    label: 'Equalização',
    description: 'Escolha uma assinatura de voz ou desenhe a sua curva em cinco bandas.',
  },
  {
    id: 'wind',
    label: 'Atenuar vento',
    description: 'Combine corte de graves com redução espectral. Ajuste a frequência de corte.',
  },
  {
    id: 'level',
    label: 'Nivelar volumes',
    description: 'Equilibre trechos baixos e altos com ganho adaptativo e compressão.',
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
  settings: FilterSettings = {},
) {
  if (operation === 'mix') throw new Error('Mixagem requer duas faixas.');
  const strength = strengthValue(intensity) / 100;
  if (operation === 'master' && settings.masterPreset === 'broadcast')
    return broadcastFilter(settings.broadcast, strength * 100);
  if (strength === 0 && operation !== 'master') return 'anull';
  const finite = (n: number | undefined, fallback: number, min: number, max: number) =>
    Number.isFinite(n) ? Math.min(max, Math.max(min, n!)) : fallback;
  const floor = finite(settings.noiseFloor, -50, -80, -20);
  const reduction = finite(settings.noiseReduction, 36, 0, 48) * strength;
  const spectral =
    reduction === 0
      ? 'anull'
      : `afftdn=nr=${Math.max(0.01, reduction)}:nf=${floor}:tn=1:gs=12:ad=0.6`;
  const ratio = 1 + (finite(settings.compression, 6, 1, 8) - 1) * strength;
  const presence = finite(settings.presence, 6, 0, 9) * strength;
  switch (operation) {
    case 'denoise':
      return settings.neural ? 'anull' : spectral;
    case 'clarity':
      return `${settings.hum === 50 || settings.hum === 60 ? [1, 2, 3, 4].map((n) => `equalizer=f=${settings.hum! * n}:t=q:w=8:g=-18`).join(',') + ',' : ''}${settings.deess ? `deesser=i=${(Math.min(1, Math.max(0, settings.deess / 100)) * strength).toFixed(3)}:m=0.5:f=0.5,` : ''}${settings.neural ? 'anull' : spectral},highpass=f=70:p=2,equalizer=f=280:t=q:w=0.7:g=${(-strength * 3).toFixed(2)},equalizer=f=3000:t=q:w=0.7:g=${presence},acompressor=threshold=0.09:ratio=${ratio}:attack=12:release=180:makeup=${(1 + strength * 0.8).toFixed(2)},alimiter=limit=0.8913:level=0:latency=1`;
    case 'eq':
      return equalizerFilter(settings.eq, settings.highpass, strength);
    case 'wind':
      return `highpass=f=${finite(settings.highpass, Math.round(40 + strength * 220), 30, 300)}:p=2,${spectral}`;
    case 'level':
      return `dynaudnorm=f=250:g=15:p=0.8:m=${(1 + strength * 7).toFixed(2)}:s=5,acompressor=threshold=0.12:ratio=${ratio}:attack=10:release=220:makeup=1,alimiter=limit=0.8913:level=0:latency=1`;
    case 'master':
      return `${settings.eq ? equalizerFilter(settings.eq, settings.highpass, strength) + ',' : ''}${settings.compression ? `acompressor=threshold=0.12:ratio=${ratio}:attack=15:release=160:makeup=1,` : ''}loudnorm=I=${finite(target, -16, -30, -10)}:TP=${finite(peak, -1, -6, -1)}:LRA=${Math.round(14 - strength * 10)}:print_format=json`;
  }
}
export function inferPlan(text: string): Operation | null {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (/separ|stem|eco|reverb|transcrev|clon/.test(normalized)) return null;
  if (/ruid|ar.condicionado|chiado|limp|restaur|isol/.test(normalized)) return 'denoise';
  if (/equaliz|eq\b|timbre/.test(normalized)) return 'eq';
  if (/vento|grave/.test(normalized)) return 'wind';
  if (/music|trilha|duck|mix/.test(normalized)) return 'mix';
  if (/entreg|master|lufs|public|transmiss|limitador|broadcast/.test(normalized)) return 'master';
  if (/nivel|volume/.test(normalized)) return 'level';
  if (/voz|clareza|presenca|sibil|deess|dialogo|hum/.test(normalized)) return 'clarity';
  return null;
}
