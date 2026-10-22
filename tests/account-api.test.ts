import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/account/route';
import { authEnvironment } from './helpers/auth';
test('anonymous activation health checks Supabase and migration without credentials, email or paid generation', async () => {
  const restore = authEnvironment(),
    old = globalThis.fetch;
  let migrated = false;
  const calls: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push(url);
    assert.equal(new Headers(init?.headers).get('authorization'), null);
    if (url.endsWith('/auth/v1/settings')) return Response.json({ external: { email: true } });
    assert.match(url, /\/rpc\/nossom_audio_usage$/);
    assert.deepEqual(JSON.parse(String(init?.body)), { p_request_id: null, p_operation: null });
    return Response.json(
      { code: migrated ? '42501' : 'PGRST202' },
      { status: migrated ? 401 : 404 },
    );
  };
  try {
    const health = () => GET(new Request('https://nossom.test/api/account?verify=1'));
    assert.deepEqual(await (await health()).json(), {
      configured: true,
      reachable: true,
      quotaReady: false,
    });
    migrated = true;
    assert.deepEqual(await (await health()).json(), {
      configured: true,
      reachable: true,
      quotaReady: true,
    });
    assert.equal(calls.length, 4);
    assert.ok(calls.every((c) => c.includes('supabase.example.test')));
    const status = await GET(new Request('https://nossom.test/api/account'));
    assert.equal(status.status, 401);
  } finally {
    globalThis.fetch = old;
    restore();
  }
});
