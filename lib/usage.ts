export type AudioUsage = {
  allowed: boolean;
  used: number;
  remaining: number | null;
  limit: number | null;
  unlimited: boolean;
  resetAt: string;
  requestId?: string;
};
export function usageLabel(usage: AudioUsage) {
  return usage.unlimited
    ? 'ADM · tratamentos ilimitados'
    : `${usage.remaining} de 10 tratamentos disponíveis`;
}
