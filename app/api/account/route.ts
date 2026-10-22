import {
  accountConfigured,
  accountToken,
  accessToken,
  authenticate,
  currentAccount,
  sessionCookie,
} from '@/lib/server/account';
import { allowRequest, privateHeaders, sameOrigin, requestOrigin } from '@/lib/server/ai-access';
import { supabase, SupabaseError } from '@/lib/server/supabase';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get('verify') === '1') {
    const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0];
    if (!allowRequest('supabase-health:' + ip, 3, 60000))
      return Response.json(
        { error: 'Aguarde um minuto.' },
        { status: 429, headers: privateHeaders },
      );
    if (!accountConfigured())
      return Response.json(
        { configured: false, reachable: false, quotaReady: false },
        { status: 503, headers: privateHeaders },
      );
    try {
      await supabase('/auth/v1/settings');
      let quotaReady = false;
      try {
        await supabase('/rest/v1/rpc/nossom_audio_usage', {
          method: 'POST',
          body: { p_request_id: null, p_operation: null },
        });
      } catch (error) {
        quotaReady = error instanceof SupabaseError && ['42501', '28000'].includes(error.code);
      }
      return Response.json(
        { configured: true, reachable: true, quotaReady },
        { headers: privateHeaders },
      );
    } catch {
      return Response.json(
        { configured: true, reachable: false, quotaReady: false },
        { status: 503, headers: privateHeaders },
      );
    }
  }
  const account = await currentAccount(request);
  return Response.json(
    { account, configured: accountConfigured() },
    { status: account ? 200 : 401, headers: privateHeaders },
  );
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: 'Origem não autorizada.' },
      { status: 403, headers: privateHeaders },
    );
  if (!accountConfigured())
    return Response.json(
      { error: 'O acesso ao Supabase está sendo preparado. Tente novamente em breve.' },
      { status: 503, headers: privateHeaders },
    );
  const raw = await request.text();
  if (raw.length > 6000)
    return Response.json({ error: 'Dados inválidos.' }, { status: 413, headers: privateHeaders });
  try {
    const body = JSON.parse(raw),
      ip = (request.headers.get('x-forwarded-for') ?? 'local').split(',')[0];
    if (!['register', 'login'].includes(body.action))
      return Response.json({ error: 'Ação inválida.' }, { status: 400, headers: privateHeaders });
    if (
      !allowRequest(
        'account:' + body.action + ':' + ip,
        body.action === 'register' ? 60 : 30,
        900000,
      )
    )
      return Response.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos.' },
        { status: 429, headers: privateHeaders },
      );
    const result = await authenticate(
      body.action,
      body.email,
      body.password,
      body.name,
      requestOrigin(request),
    );
    const headers = new Headers(privateHeaders);
    if ('token' in result && result.token)
      headers.append('Set-Cookie', sessionCookie(result.token));
    return Response.json(
      { account: result.account, confirmationRequired: result.confirmationRequired || false },
      { headers },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Não foi possível entrar.' },
      { status: 400, headers: privateHeaders },
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: 'Origem não autorizada.' },
      { status: 403, headers: privateHeaders },
    );
  // Clear even an expired local cookie. Logout in Supabase revokes this refresh session.
  if (accountToken(request) && accessToken(request))
    try {
      await supabase('/auth/v1/logout?scope=local', {
        method: 'POST',
        token: accessToken(request),
      });
    } catch {
      /* Local logout still succeeds when the provider is unavailable. */
    }
  return Response.json(
    { signedOut: true },
    { headers: { ...privateHeaders, 'Set-Cookie': sessionCookie(null) } },
  );
}
