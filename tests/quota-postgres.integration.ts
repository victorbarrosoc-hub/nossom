import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const container = process.env.NOSSOM_TEST_POSTGRES_CONTAINER;
if (!container)
  throw new Error(
    'Set NOSSOM_TEST_POSTGRES_CONTAINER to an isolated PostgreSQL 17 test container.',
  );
const sql = (value: string) => {
  const result = spawnSync(
    'docker',
    ['exec', '-i', container, 'psql', '-U', 'postgres', '-tA', '-v', 'ON_ERROR_STOP=1'],
    { input: value, encoding: 'utf8' },
  );
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
};
const alice = '11111111-1111-4111-8111-111111111111',
  bob = '22222222-2222-4222-8222-222222222222',
  admin = '33333333-3333-4333-8333-333333333333',
  unconfirmed = '44444444-4444-4444-8444-444444444444';
function query(user: string, id?: string, op = 'auto') {
  return `begin; set local role authenticated; set local "request.jwt.claim.sub"='${user}'; select public.nossom_audio_usage(${id ? `'${id}'::uuid, '${op}'` : ''}); commit;`;
}
function usage(user: string, id?: string, op = 'auto') {
  return JSON.parse(
    sql(query(user, id, op))
      .split('\n')
      .find((x) => x.startsWith('{'))!,
  );
}
// Isolated container only: minimal GoTrue tables/roles, never a production project.
sql(
  `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; insert into auth.users values ('${alice}','alice@example.test',now()),('${bob}','bob@example.test',now()),('${admin}','victorbarrosoc@gmail.com',now()),('${unconfirmed}','victorbarrosoc@gmail.com',null);`,
);
sql(readFileSync('supabase/migrations/202610220001_accounts_and_weekly_usage.sql', 'utf8'));
test('real PostgreSQL authorizes exactly 10 concurrent treatments per user across connections', async () => {
  const requests = Array.from(
    { length: 18 },
    () =>
      new Promise<any>((resolve, reject) => {
        const child = spawn('docker', [
          'exec',
          '-i',
          container,
          'psql',
          '-U',
          'postgres',
          '-tA',
          '-v',
          'ON_ERROR_STOP=1',
        ]);
        let out = '',
          err = '';
        child.stdout.on('data', (d) => (out += d));
        child.stderr.on('data', (d) => (err += d));
        child.on('close', (code) =>
          code
            ? reject(new Error(err))
            : resolve(JSON.parse(out.split('\n').find((x) => x.startsWith('{'))!)),
        );
        child.stdin.end(query(alice, randomUUID()));
      }),
  );
  const results = await Promise.all(requests);
  assert.equal(results.filter((x) => x.allowed).length, 10);
  assert.equal(results.filter((x) => !x.allowed).length, 8);
  assert.equal(usage(alice).used, 10);
  assert.equal(usage(bob).used, 0);
  assert.equal(usage(alice, randomUUID()).allowed, false);
});
test('verified admin exceeds 10 while an unconfirmed matching email has the normal quota', () => {
  for (let i = 0; i < 13; i++) assert.equal(usage(admin, randomUUID()).allowed, true);
  assert.equal(usage(admin).unlimited, true);
  assert.equal(usage(admin).remaining, null);
  for (let i = 0; i < 10; i++) assert.equal(usage(unconfirmed, randomUUID()).allowed, true);
  assert.equal(usage(unconfirmed, randomUUID()).allowed, false);
  assert.equal(usage(unconfirmed).unlimited, false);
});
test('weekly reset uses Monday midnight in Fortaleza and an old authorization cannot be reused', () => {
  const oldId = randomUUID();
  sql(
    `insert into nossom_private.audio_treatments(user_id,request_id,week_start,operation) values('${bob}','${oldId}',(date_trunc('week',now() at time zone 'America/Fortaleza') - interval '7 days') at time zone 'America/Fortaleza','auto');`,
  );
  assert.equal(usage(bob).used, 0);
  assert.throws(() => usage(bob, oldId), /already used/);
  const reset = usage(bob).resetAt;
  assert.equal(new Date(reset).getUTCDay(), 1);
  assert.equal(new Date(reset).getUTCHours(), 3);
  const id = randomUUID();
  assert.equal(usage(bob, id).used, 1);
  assert.equal(usage(bob, id).used, 1);
  assert.throws(() => usage(bob, id, 'eq'), /already used/);
});
test('anonymous calls, direct ledger edits and missing identities are rejected by database permissions', () => {
  assert.throws(
    () => sql('set role anon; select public.nossom_audio_usage();'),
    /permission denied/,
  );
  assert.throws(
    () => sql(`set role authenticated; select * from nossom_private.audio_treatments;`),
    /permission denied/,
  );
  assert.throws(
    () => sql(`set role authenticated; delete from nossom_private.audio_treatments;`),
    /permission denied/,
  );
  assert.throws(
    () => sql(`set role authenticated; select public.nossom_audio_usage();`),
    /Authentication required/,
  );
});
