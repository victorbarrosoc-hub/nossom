export type Account = {
  id: string;
  name: string;
  username: string;
  email: string;
  kind: 'supabase';
  isAdmin: boolean;
};
export function accountPlan(
  account: Pick<Account, 'isAdmin'>,
  usage?: { planName?: string } | null,
) {
  return account.isAdmin
    ? 'ADM · Ilimitado'
    : usage?.planName
      ? 'Plano ' + usage.planName
      : 'Plano Gratuito';
}
export function safeReturnPath(value: unknown) {
  if (typeof value !== 'string' || !/^\/studio(?:\/|\?|$)/.test(value)) return '/studio';
  return value.length < 2000 && !/[\\\r\n]/.test(value) ? value : '/studio';
}
