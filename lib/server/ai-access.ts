import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
const COOKIE = 'nossom-ai';
const attempts = new Map<string, { count: number; reset: number }>();
function code() {
  return process.env.NOSSOM_AI_ACCESS_CODE ?? '';
}
export function aiConfigured() {
  return !!process.env.ANTHROPIC_API_KEY && code().length >= 16;
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
function signature(value: string) {
  return createHmac('sha256', code()).update(value).digest('base64url');
}
export function authorized(request: Request) {
  if (!aiConfigured()) return false;
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(COOKIE + '='))
    ?.slice(COOKIE.length + 1);
  if (!token) return false;
  const [expires, nonce, sig] = token.split('.');
  if (
    !expires ||
    !nonce ||
    !sig ||
    Number(expires) < Date.now() ||
    Number(expires) > Date.now() + 3601000
  )
    return false;
  const expected = Buffer.from(signature(`${expires}.${nonce}`)),
    actual = Buffer.from(sig);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function issueSession(input: string) {
  if (!aiConfigured()) return null;
  const a = Buffer.from(input),
    b = Buffer.from(code());
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const value = `${Date.now() + 3600000}.${randomBytes(16).toString('base64url')}`;
  return `${COOKIE}=${value}.${signature(value)}; HttpOnly; SameSite=Strict; Path=/api/ai; Max-Age=3600${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export function allowRequest(key: string, limit = 20, period = 3600000) {
  const now = Date.now();
  if (attempts.size > 5000) for (const [k, v] of attempts) if (v.reset < now) attempts.delete(k);
  const entry = attempts.get(key);
  if (!entry || entry.reset < now) {
    attempts.set(key, { count: 1, reset: now + period });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}
export const privateHeaders = { 'Cache-Control': 'no-store' };
