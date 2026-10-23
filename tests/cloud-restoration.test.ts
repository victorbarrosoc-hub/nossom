import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../app/api/audio/jobs/route';
import { CLOUD_PART_BYTES, restorationD, validCloudReport } from '../lib/restoration';
import { authEnvironment, testCookie, testUser } from './helpers/auth';

const report = {
  preset: restorationD.id,
  chunks: [{ index: 0, bytes: 44100 * 4 + 44 }],
  totalBytes: 44100 * 4 + 44,
  frames: 44100,
  sampleRate: 44100,
  channels: 1,
  gainDb: 0,
};
test('cloud result contract rejects truncated, unbounded and wrong-preset output', () => {
  assert.equal(validCloudReport(report), true);
  for (const bad of [
    { ...report, totalBytes: 4 },
    { ...report, frames: 44100 * 601 },
    { ...report, channels: 2 },
    { ...report, preset: 'other' },
    { ...report, gainDb: 6 },
    { ...report, chunks: [{ index: 1, bytes: report.totalBytes }] },
    { ...report, chunks: [{ index: 0, bytes: CLOUD_PART_BYTES + 1 }] },
  ])
    assert.equal(validCloudReport(bad), false);
});
test('restoration verifies identity, owns jobs, fixes D server-side, dispatches once and privately releases parts', async () => {
  const restore = authEnvironment(),
    before = globalThis.fetch;
  const keys = ['RUNPOD_API_KEY', 'RUNPOD_ENDPOINT_ID', 'SUPABASE_SERVICE_ROLE_KEY'];
  const old = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  process.env.RUNPOD_API_KEY = 'private-runpod-test';
  process.env.RUNPOD_ENDPOINT_ID = 'endpoint-test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'private-storage-test';
  let job: any = null,
    dispatches = 0,
    providerPayload: any = null,
    removed: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input),
      body = init?.body ? JSON.parse(String(init.body)) : {};
    if (url.endsWith('/auth/v1/user')) return Response.json(testUser);
    if (url.endsWith('/rpc/nossom_plan_usage'))
      return Response.json({ allowed: true, used: body.p_request_id ? 1 : 0, remaining: 9 });
    if (url.endsWith('/rpc/nossom_restoration_job')) {
      assert.equal(new Headers(init?.headers).get('apikey'), 'private-storage-test');
      if (body.p_action === 'prepare')
        job = { id: body.p_id, user_id: body.p_user, status: 'uploading', ...body.p_data };
      if (job && body.p_user !== job.user_id) return Response.json({ job: null });
      let claimed = false;
      if (body.p_action === 'claim' && job.status === 'uploading') {
        job.status = 'submitting';
        claimed = true;
      }
      if (body.p_action === 'update') Object.assign(job, body.p_data);
      if (body.p_action === 'fail') job.status = 'failed';
      if (body.p_action === 'release') job.status = 'released';
      return Response.json({ job, claimed });
    }
    if (url.includes('/storage/v1/object/upload/sign/'))
      return Response.json({
        url: new URL(url).pathname.replace('/storage/v1', '') + '?token=write-test',
      });
    if (url.includes('/storage/v1/object/sign/'))
      return Response.json({
        signedURL: new URL(url).pathname.replace('/storage/v1', '') + '?token=read-test',
      });
    if (url.endsWith('/storage/v1/object/nossom-restoration')) {
      removed = body.prefixes;
      return Response.json({});
    }
    if (url.endsWith('/run')) {
      assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer private-runpod-test');
      dispatches++;
      providerPayload = body;
      return Response.json({ id: 'provider-job-test' });
    }
    if (url.includes('/status/')) return Response.json({ status: 'COMPLETED', output: report });
    throw new Error('Unexpected network call: ' + new URL(url).pathname);
  };
  const request = (body?: unknown, cookie = testCookie(), origin = 'http://localhost') =>
    new Request('http://localhost/api/audio/jobs', {
      method: body ? 'POST' : 'GET',
      headers: { cookie, origin, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  try {
    assert.equal((await POST(request({ action: 'prepare' }, ''))).status, 401);
    assert.equal(
      (await POST(request({ action: 'prepare' }, testCookie(), 'https://evil.test'))).status,
      403,
    );
    assert.equal(
      (await POST(request({ action: 'prepare', bytes: 50, duration: 601 }))).status,
      400,
    );
    const prepared = await (
      await POST(request({ action: 'prepare', bytes: 30 * 1024 * 1024, duration: 1 }))
    ).json();
    assert.equal(prepared.uploadUrls.length, 2);
    assert.equal(prepared.partBytes, CLOUD_PART_BYTES);
    const id = prepared.id;
    const first = await POST(
      request({ action: 'submit', id, tau: 1, nfe: 128, preset: 'untrusted' }),
    );
    assert.equal(first.status, 200);
    assert.equal((await POST(request({ action: 'submit', id }))).status, 200);
    assert.equal(dispatches, 1);
    assert.equal(providerPayload.input.preset, 'resemble-d-v1');
    assert.equal(providerPayload.input.tau, undefined);
    assert.equal(providerPayload.input.output_urls.length, 6);
    assert.equal(providerPayload.policy.executionTimeout, 900000);
    const own = await GET(
      new Request(`http://localhost/api/audio/jobs?id=${id}`, {
        headers: { cookie: testCookie() },
      }),
    );
    const data = await own.json();
    assert.equal(data.status, 'completed');
    assert.equal(data.downloadUrls.length, 1);
    assert.equal(JSON.stringify(data).includes('private-runpod-test'), false);
    const source = await GET(
      new Request(`http://localhost/api/audio/jobs?id=${id}&source=1`, {
        headers: { cookie: testCookie() },
      }),
    );
    const recovered = await source.json();
    assert.equal(source.status, 200);
    assert.equal(recovered.bytes, 30 * 1024 * 1024);
    assert.equal(recovered.downloadUrls.length, 2);
    assert.ok(recovered.downloadUrls.every((url: string) => url.includes(`/source-`)));

    const other = testCookie({ ...testUser, id: '22222222-2222-4222-8222-222222222222' });
    // Auth provider validates the actual identity, not the encrypted-cookie metadata.
    const previousFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) =>
      String(input).endsWith('/auth/v1/user')
        ? Response.json({ ...testUser, id: '22222222-2222-4222-8222-222222222222' })
        : previousFetch(input, init);
    assert.equal((await POST(request({ action: 'release', id }, other))).status, 404);
    assert.equal(
      (
        await GET(
          new Request(`http://localhost/api/audio/jobs?id=${id}&source=1`, {
            headers: { cookie: other },
          }),
        )
      ).status,
      404,
    );

    globalThis.fetch = previousFetch;
    assert.equal((await POST(request({ action: 'release', id }))).status, 200);
    assert.equal(removed.length, 8);
    assert.ok(removed.every((p) => p.startsWith(`${testUser.id}/${id}/`)));
  } finally {
    globalThis.fetch = before;
    restore();
    for (const k of keys)
      if (old[k] === undefined) delete process.env[k];
      else process.env[k] = old[k];
  }
});

test('RunPod owner diagnostics hide secrets and explicit provider rejection releases the reservation', async () => {
  const restore = authEnvironment(),
    previous = globalThis.fetch;
  const keys = ['RUNPOD_API_KEY', 'RUNPOD_ENDPOINT_ID', 'SUPABASE_SERVICE_ROLE_KEY'];
  const old = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  process.env.RUNPOD_API_KEY = 'private-diagnostic-placeholder';
  process.env.RUNPOD_ENDPOINT_ID = 'endpoint-diagnostic';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'private-storage-placeholder';
  let owner = false,
    code = 404,
    failed = 0,
    providerRuns = 0;
  const job = {
    id: '33333333-3333-4333-8333-333333333333',
    user_id: testUser.id,
    input_parts: 1,
    input_bytes: 5000,
    duration: 1,
    status: 'submitting',
  };
  globalThis.fetch = async (input, init) => {
    const url = String(input),
      body = init?.body ? JSON.parse(String(init.body)) : {};
    if (url.endsWith('/auth/v1/user'))
      return Response.json(owner ? { ...testUser, email: 'victorbarrosoc@gmail.com' } : testUser);
    if (url.endsWith('/health'))
      return code === 200
        ? Response.json({
            workers: { ready: 0, running: 0, unhealthy: 0 },
            ignored: 'private-diagnostic-placeholder',
          })
        : Response.json({ error: 'private-diagnostic-placeholder' }, { status: code });
    if (url.endsWith('/rpc/nossom_restoration_job')) {
      if (body.p_action === 'fail') failed++;
      return Response.json({ job, claimed: true });
    }
    if (url.endsWith('/rpc/nossom_plan_usage')) return Response.json({ allowed: true });
    if (url.includes('/storage/v1/object/upload/sign/'))
      return Response.json({ url: new URL(url).pathname + '?token=placeholder' });
    if (url.includes('/storage/v1/object/sign/'))
      return Response.json({ signedURL: new URL(url).pathname + '?token=placeholder' });
    if (url.endsWith('/run')) {
      providerRuns++;
      return Response.json({}, { status: code });
    }
    throw new Error('Unexpected mocked request');
  };
  const req = () =>
    new Request('http://localhost/api/audio/jobs?diagnostic=1', {
      headers: { cookie: testCookie() },
    });
  try {
    assert.equal((await GET(req())).status, 403);
    owner = true;
    const unavailable = await (await GET(req())).json();
    assert.equal(unavailable.providerStatus, 404);
    assert.match(unavailable.hint, /RUNPOD_ENDPOINT_ID/);
    assert.equal(JSON.stringify(unavailable).includes('private-diagnostic-placeholder'), false);
    code = 200;
    const healthy = await (await GET(req())).json();
    assert.equal(healthy.reachable, true);
    assert.deepEqual(healthy.workers, { ready: 0, running: 0, unhealthy: 0 });
    assert.equal(JSON.stringify(healthy).includes('private-diagnostic-placeholder'), false);
    for (const status of [401, 403, 404, 429, 500]) {
      code = status;
      const before = failed;
      const response = await POST(
        new Request('http://localhost/api/audio/jobs', {
          method: 'POST',
          headers: {
            cookie: testCookie(),
            Origin: 'http://localhost',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'submit', id: job.id }),
        }),
      );
      assert.equal(response.status, 503);
      assert.equal(failed - before, status < 500 ? 1 : 0);
      assert.equal(JSON.stringify(await response.json()).includes('RUNPOD_API_KEY'), false);
    }
    assert.equal(providerRuns, 5);
  } finally {
    globalThis.fetch = previous;
    restore();
    for (const key of keys)
      if (old[key] === undefined) delete process.env[key];
      else process.env[key] = old[key];
  }
});
