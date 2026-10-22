import { accessToken, currentAccount } from './account';
import { supabase } from './supabase';
import type { AudioUsage } from '../usage';
export async function audioUsage(
  request: Request,
  requestId?: string,
  operation?: string,
): Promise<AudioUsage> {
  if (!(await currentAccount(request))) throw new Error('Entre novamente para continuar.');
  return supabase<AudioUsage>('/rest/v1/rpc/nossom_audio_usage', {
    method: 'POST',
    token: accessToken(request),
    body: { p_request_id: requestId || null, p_operation: operation || null },
  });
}
