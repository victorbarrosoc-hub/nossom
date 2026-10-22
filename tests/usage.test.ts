import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../app/api/usage/route';
import { testCookie, testUser, authEnvironment } from './helpers/auth';
test('usage API requires verified identity, same origin and allowed operations; only server generates authorization IDs', async () => {
  const restore = authEnvironment(),
    old = globalThis.fetch;
  const ids: string[] = [];
  let exhausted = false;
  globalThis.fetch = async (input, init) => {
    if (String(input).endsWith('/auth/v1/user')) return Response.json(testUser);
    assert.match(String(input), /\/rest\/v1\/rpc\/nossom_audio_usage$/);
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-access-placeholder');
    const body = JSON.parse(String(init?.body));
    if (body.p_request_id) ids.push(body.p_request_id);
    return Response.json({
      allowed: !exhausted,
      used: exhausted ? 10 : 1,
      remaining: exhausted ? 0 : 9,
      limit: 10,
      unlimited: false,
      resetAt: '2026-10-26T03:00:00Z',
    });
  };
  try {
    const cookie = testCookie();
    const request = (body: unknown, origin = 'https://nossom.test', authenticated = true) =>
      new Request('https://nossom.test/api/usage', {
        method: 'POST',
        headers: {
          origin,
          ...(authenticated ? { cookie } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    assert.equal((await POST(request({ operation: 'auto' }, 'https://evil.test'))).status, 403);
    assert.equal(
      (await POST(request({ operation: 'auto' }, 'https://nossom.test', false))).status,
      401,
    );
    assert.equal((await POST(request({ operation: 'execute-code' }))).status, 400);
    assert.equal((await POST(request(null))).status, 400);
    assert.equal((await GET(new Request('https://nossom.test/api/usage'))).status, 401);
    for (let i = 0; i < 2; i++)
      assert.equal(
        (
          await POST(
            request({
              operation: 'auto',
              requestId: 'attacker-reused-id',
              userId: 'other',
              isAdmin: true,
            }),
          )
        ).status,
        200,
      );
    assert.equal(ids.length, 2);
    assert.notEqual(ids[0], ids[1]);
    assert.ok(ids.every((id) => id !== 'attacker-reused-id'));
    exhausted = true;
    assert.equal((await POST(request({ operation: 'auto' }))).status, 429);
    globalThis.fetch = async () =>
      Response.json({ error_code: 'session_revoked' }, { status: 401 });
    assert.equal((await POST(request({ operation: 'auto' }))).status, 401);
  } finally {
    globalThis.fetch = old;
    restore();
  }
});
