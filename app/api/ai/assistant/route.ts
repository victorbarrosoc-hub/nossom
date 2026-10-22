import { allowRequest, authorized, privateHeaders, sameOrigin } from '@/lib/server/ai-access';
import { askClaude } from '@/lib/server/claude';
export const maxDuration = 120;
export async function POST(request: Request) {
  if (!sameOrigin(request) || !authorized(request))
    return Response.json(
      { error: 'Conecte o Claude na página de IA do estúdio.' },
      { status: 401, headers: privateHeaders },
    );
  if (!allowRequest('assistant:' + (request.headers.get('cookie') ?? '')))
    return Response.json(
      { error: 'Limite desta sessão atingido. Tente novamente mais tarde.' },
      { status: 429, headers: privateHeaders },
    );
  const raw = await request.text();
  if (raw.length > 5000) return Response.json({ error: 'Pedido muito longo.' }, { status: 413 });
  try {
    const body = JSON.parse(raw);
    if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 1500)
      return Response.json(
        { error: 'Escreva um pedido de até 1.500 caracteres.' },
        { status: 400 },
      );
    const context: Record<string, unknown> = {};
    for (const key of ['lufs', 'truePeak', 'lra', 'duration', 'channels'])
      if (typeof body.context?.[key] === 'number' && Number.isFinite(body.context[key]))
        context[key] = body.context[key];
    return Response.json(
      await askClaude(
        body.text,
        context,
        AbortSignal.any([request.signal, AbortSignal.timeout(100000)]),
      ),
      { headers: privateHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Não foi possível obter a sugestão.' },
      { status: 502, headers: privateHeaders },
    );
  }
}
