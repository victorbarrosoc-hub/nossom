import { accessToken, currentAccount } from './account';
import { supabase } from './supabase';
import type { AudioUsage } from '../usage';
export async function audioUsage(
  request: Request,
  requestId?: string,
  operation?: string,
): Promise<AudioUsage> {
  if (!(await currentAccount(request))) throw new Error('Entre novamente para continuar.');
  return supabase<AudioUsage>('/rest/v1/rpc/nossom_plan_usage', {
    method: 'POST',
    token: accessToken(request),
    // Local finishing does not consume GPU minutes. Only a server-claimed cloud
    // job can reserve its duration, read authoritatively from the database.
    body: { p_request_id: operation === 'auto' ? requestId || null : null },
  });
}
