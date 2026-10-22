import test from 'node:test';
import assert from 'node:assert/strict';
import { authorized, issueSession, sameOrigin } from '../lib/server/ai-access';
import { askClaude, validPlan } from '../lib/server/claude';
test('paid assistant requires a signed, expiring server session', () => {
  const old = process.env.NOSSOM_AI_ACCESS_CODE,
    oldKey = process.env.ANTHROPIC_API_KEY;
  process.env.NOSSOM_AI_ACCESS_CODE = 'test-access-code-not-real';
  process.env.ANTHROPIC_API_KEY = 'test-only-placeholder';
  try {
    assert.equal(issueSession('wrong'), null);
    const cookie = issueSession('test-access-code-not-real')!.split(';')[0];
    assert.equal(
      authorized(new Request('http://localhost/api/ai/assistant', { headers: { cookie } })),
      true,
    );
    assert.equal(
      authorized(
        new Request('http://localhost/api/ai/assistant', {
          headers: { cookie: cookie + 'modified' },
        }),
      ),
      false,
    );
    assert.equal(
      sameOrigin(
        new Request('http://localhost/api/ai/session', {
          headers: { origin: 'https://example.com' },
        }),
      ),
      false,
    );
  } finally {
    if (old === undefined) delete process.env.NOSSOM_AI_ACCESS_CODE;
    else process.env.NOSSOM_AI_ACCESS_CODE = old;
    if (oldKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = oldKey;
  }
});
test('Claude requests verified Sonnet 5.5 with high effort and adaptive thinking; returned operations are constrained', async () => {
  const fetchBefore = globalThis.fetch,
    key = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'test-only-placeholder';
  let payload: Record<string, unknown> | undefined;
  globalThis.fetch = async (input, init) => {
    if (String(input).includes('/v1/models/'))
      return Response.json({
        id: 'claude-sonnet-5-5',
        capabilities: {
          effort: { high: { supported: true } },
          thinking: { adaptive: { supported: true } },
        },
      });
    payload = JSON.parse(String(init?.body));
    return Response.json({
      stop_reason: 'end_turn',
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            reply: 'Sugiro revisar a curva de presença.',
            operation: 'eq',
            intensity: 65,
            eqPreset: 'presence',
          }),
        },
      ],
    });
  };
  try {
    const result = await askClaude('Deixe a voz mais clara.', { lufs: -20 });
    assert.equal(result.operation, 'eq');
    assert.equal(payload?.model, 'claude-sonnet-5-5');
    assert.deepEqual(payload?.thinking, { type: 'adaptive' });
    assert.equal((payload?.output_config as { effort: string }).effort, 'high');
    assert.equal(
      validPlan({ reply: 'teste', operation: 'execute code', intensity: 999 }).operation,
      null,
    );
    assert.equal(validPlan({ reply: 'teste', operation: 'eq', intensity: 999 }).intensity, 100);
  } finally {
    globalThis.fetch = fetchBefore;
    if (key === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = key;
  }
});
