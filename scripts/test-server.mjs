// Local-only GoTrue/PostgREST contract double. Never included in the application.
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
const users = new Map(),
  tokens = new Map(),
  refreshTokens = new Map(),
  uses = new Map();
const origin = 'http://127.0.0.1:55440';
function session(user) {
  const access_token = randomUUID(),
    refresh_token = randomUUID();
  tokens.set(access_token, user);
  refreshTokens.set(refresh_token, user);
  return { access_token, refresh_token, expires_in: 3600, user };
}
const server = createServer(async (req, res) => {
  const url = new URL(req.url, origin);
  let raw = '';
  for await (const c of req) raw += c;
  let body;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    res.writeHead(400);
    res.end('{}');
    return;
  }
  const send = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };
  const token = req.headers.authorization?.replace('Bearer ', ''),
    user = tokens.get(token);
  if (url.pathname === '/auth/v1/signup') {
    if (users.has(body.email)) return send({ error_code: 'user_already_exists' }, 400);
    const user = {
      id: randomUUID(),
      email: body.email,
      email_confirmed_at: body.email.startsWith('confirm.') ? null : new Date().toISOString(),
      user_metadata: body.data || {},
    };
    users.set(body.email, { user, password: body.password });
    if (!user.email_confirmed_at) return send({ user });
    return send(session(user));
  }
  if (url.pathname === '/auth/v1/token') {
    if (url.searchParams.get('grant_type') === 'refresh_token') {
      const u = refreshTokens.get(body.refresh_token);
      return u ? send(session(u)) : send({ error_code: 'invalid_grant' }, 401);
    }
    const saved = users.get(body.email);
    if (!saved || saved.password !== body.password)
      return send({ error_code: 'invalid_credentials' }, 400);
    if (!saved.user.email_confirmed_at) return send({ error_code: 'email_not_confirmed' }, 400);
    return send(session(saved.user));
  }
  if (url.pathname === '/auth/v1/user')
    return user ? send(user) : send({ error_code: 'session_not_found' }, 401);
  if (url.pathname === '/auth/v1/logout') {
    tokens.delete(token);
    if (user) for (const [t, u] of refreshTokens) if (u.id === user.id) refreshTokens.delete(t);
    return send({});
  }
  if (url.pathname === '/rest/v1/rpc/nossom_audio_usage') {
    if (!user) return send({ code: '28000' }, 401);
    const used = uses.get(user.id) || 0,
      unlimited = user.email === 'victorbarrosoc@gmail.com' && !!user.email_confirmed_at;
    const allowed = unlimited || used < 10;
    const count = body.p_request_id && allowed ? used + 1 : used;
    uses.set(user.id, count);
    return send({
      allowed: body.p_request_id ? allowed : unlimited || count < 10,
      used: count,
      remaining: unlimited ? null : Math.max(0, 10 - count),
      limit: unlimited ? null : 10,
      unlimited,
      resetAt: '2026-10-26T03:00:00Z',
    });
  }
  send({}, 404);
});
server.listen(55440, '127.0.0.1', () => {
  const next = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '--hostname', '0.0.0.0'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        SUPABASE_URL: origin,
        SUPABASE_ANON_KEY: 'public-e2e-placeholder',
        NOSSOM_AUTH_SECRET: 'local-e2e-session-key-placeholder',
        ANTHROPIC_API_KEY: '',
        NEXT_PUBLIC_ELEVENLABS_AGENT_ID: '',
      },
    },
  );
  const cleanup = () => {
    next.kill('SIGTERM');
    server.close();
  };
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
  next.on('exit', (code) => {
    server.close();
    process.exit(code || 0);
  });
});
