import {
  aiConfigured,
  allowRequest,
  authorized,
  issueSession,
  privateHeaders,
  sameOrigin,
} from '@/lib/server/ai-access';
import { verifyClaude } from '@/lib/server/claude';
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: 'Origem não autorizada.' },
      { status: 403, headers: privateHeaders },
    );
  if (!aiConfigured())
    return Response.json(
      { error: 'Configure a chave Anthropic e o código de acesso no servidor.' },
      { status: 503, headers: privateHeaders },
    );
  if (!allowRequest('login:' + (request.headers.get('x-forwarded-for') ?? 'local'), 5, 900000))
    return Response.json(
      { error: 'Muitas tentativas. Aguarde 15 minutos.' },
      { status: 429, headers: privateHeaders },
    );
  const raw = await request.text();
  if (raw.length > 1000) return Response.json({ error: 'Código inválido.' }, { status: 400 });
  try {
    const body = JSON.parse(raw);
    const cookie = typeof body.code === 'string' ? issueSession(body.code) : null;
    if (!cookie)
      return Response.json(
        { error: 'Código de acesso inválido.' },
        { status: 401, headers: privateHeaders },
      );
    const model = await verifyClaude(AbortSignal.any([request.signal, AbortSignal.timeout(15000)]));
    return Response.json(
      { connected: true, model: model.id, effort: 'high' },
      { headers: { ...privateHeaders, 'Set-Cookie': cookie } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Não foi possível conectar.' },
      { status: 502, headers: privateHeaders },
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request) || !authorized(request))
    return Response.json({ error: 'Acesso negado.' }, { status: 403 });
  return Response.json(
    { connected: false },
    {
      headers: {
        ...privateHeaders,
        'Set-Cookie': `nossom-ai=; HttpOnly; SameSite=Strict; Path=/api/ai; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
      },
    },
  );
}
