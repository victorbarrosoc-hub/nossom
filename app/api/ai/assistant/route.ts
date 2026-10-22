import {
  allowRequest,
  authorized,
  cookieValue,
  privateHeaders,
  sameOrigin,
} from '@/lib/server/ai-access';
import { askClaude } from '@/lib/server/claude';
import {
  agentConnection,
  askManagedAgent,
  closeManagedConversation,
} from '@/lib/server/managed-agent';
export const maxDuration = 120;
export async function POST(request: Request) {
  if (!sameOrigin(request) || !authorized(request))
    return Response.json(
      { error: 'Conecte o Claude na página de IA do estúdio.' },
      { status: 401, headers: privateHeaders },
    );
  if (!allowRequest('assistant:' + (cookieValue(request, 'nossom-ai') ?? '')))
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
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(100000)]);
    const config = agentConnection(request);
    return Response.json(
      config
        ? await askManagedAgent(request, config, body.text, context, body.conversation, signal)
        : await askClaude(body.text, context, signal),
      { headers: privateHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Não foi possível obter a sugestão.' },
      { status: 502, headers: privateHeaders },
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request) || !authorized(request))
    return Response.json({ error: 'Acesso negado.' }, { status: 401, headers: privateHeaders });
  const config = agentConnection(request);
  if (!config) return Response.json({ closed: true }, { headers: privateHeaders });
  try {
    const raw = await request.text();
    if (raw.length > 5000) return Response.json({ error: 'Pedido inválido.' }, { status: 413 });
    const body = JSON.parse(raw);
    if (typeof body.conversation !== 'string')
      return Response.json({ error: 'Conversa inválida.' }, { status: 400 });
    await closeManagedConversation(request, config, body.conversation);
    return Response.json({ closed: true }, { headers: privateHeaders });
  } catch {
    return Response.json(
      { error: 'Não foi possível encerrar a conversa no provedor.' },
      { status: 502, headers: privateHeaders },
    );
  }
}
