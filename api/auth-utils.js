import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

const COOKIE = 'wishvilo_session';

export function accountKey(subject) {
  return createHash('sha256').update(String(subject)).digest('hex');
}

function cookieValue(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return '';
}

export function setCookie(res, name, value, maxAge, path = '/') {
  appendCookie(res, `${name}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`);
}

export function clearCookie(res, name, path = '/') {
  appendCookie(res, `${name}=; Path=${path}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
}

function appendCookie(res, cookie) {
  const previous = res.getHeader?.('Set-Cookie');
  res.setHeader('Set-Cookie', previous ? [...(Array.isArray(previous) ? previous : [previous]), cookie] : cookie);
}

export function signSession(user) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured.');
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readSession(req) {
  const secret = process.env.SESSION_SECRET;
  const token = cookieValue(req, COOKIE);
  if (!secret || !token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!user.sub || user.exp <= Date.now()) return null;
    return user;
  } catch { return null; }
}

export function requestOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}`;
}

export function requestBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
}

export { COOKIE };
