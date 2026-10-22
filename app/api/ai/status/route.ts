import { aiConfigured, authorized, privateHeaders } from '@/lib/server/ai-access';
import { claudeModel } from '@/lib/server/claude';
import { agentConnection } from '@/lib/server/managed-agent';
export async function GET(request: Request) {
  const connected = authorized(request);
  const agent = connected ? agentConnection(request) : null;
  return Response.json(
    {
      configured: aiConfigured(),
      authorized: connected,
      mode: agent ? 'managed' : 'messages',
      ...(agent ? { agentId: agent.agentId, environmentId: agent.environmentId } : {}),
      model: claudeModel(),
      effort: 'high',
      missing: [
        ...(!process.env.ANTHROPIC_API_KEY ? ['ANTHROPIC_API_KEY'] : []),
        ...((process.env.NOSSOM_AI_ACCESS_CODE ?? '').length < 16 ? ['NOSSOM_AI_ACCESS_CODE'] : []),
      ],
    },
    { headers: privateHeaders },
  );
}
