import { aiConfigured, authorized, privateHeaders } from '@/lib/server/ai-access';
import { claudeModel } from '@/lib/server/claude';
export async function GET(request: Request) {
  return Response.json(
    {
      configured: aiConfigured(),
      authorized: authorized(request),
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
