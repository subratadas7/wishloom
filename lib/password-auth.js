import { createHash, createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import { del, get, put } from '@vercel/blob';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return EMAIL_RE.test(email) && email.length <= 160 ? email : '';
}

export function emailKey(email) {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

function userPath(email) { return `wishvilo/auth/users/${emailKey(email)}.json`; }
function codePath(email) { return `wishvilo/auth/codes/${emailKey(email)}.json`; }

async function readPrivate(pathname) {
  const result = await get(pathname, { access: 'private' });
  if (!result?.stream || result.statusCode !== 200) return null;
  try { return JSON.parse(await new Response(result.stream).text()); } catch { return null; }
}

async function writePrivate(pathname, value) {
  return put(pathname, JSON.stringify(value), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json; charset=utf-8', cacheControlMaxAge: 0 });
}

export async function getPasswordUser(email) {
  const normalized = normalizeEmail(email);
  return normalized ? readPrivate(userPath(normalized)) : null;
}

export function hashPassword(password) {
  const value = String(password || '');
  if (value.length < 8 || value.length > 128) throw new Error('Use a password between 8 and 128 characters.');
  const salt = randomBytes(16);
  const hash = scryptSync(value, salt, 64, { N: 16384, r: 8, p: 1 });
  return { salt: salt.toString('hex'), hash: hash.toString('hex') };
}

export function verifyPassword(password, credentials) {
  if (!credentials?.salt || !credentials?.hash) return false;
  try {
    const actual = scryptSync(String(password || ''), Buffer.from(credentials.salt, 'hex'), 64, { N: 16384, r: 8, p: 1 });
    const expected = Buffer.from(credentials.hash, 'hex');
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}

function codeDigest(code) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured.');
  return createHmac('sha256', secret).update(String(code)).digest('hex');
}

export async function sendEmailCode({ email, purpose, name = '', subject = '', extra = {} }) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('Enter a valid email address.');
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_FROM_EMAIL) throw new Error('Email verification is not configured yet. Add RESEND_API_KEY and AUTH_FROM_EMAIL in Vercel, then redeploy.');
  const prior = await readPrivate(codePath(normalized));
  if (prior?.lastSentAt && Date.now() - prior.lastSentAt < RESEND_WAIT_MS) throw new Error('Please wait a minute before requesting another code.');
  const code = String(randomInt(100000, 1000000));
  const record = { purpose, email: normalized, name: String(name).trim().slice(0, 80), codeHash: codeDigest(code), expiresAt: Date.now() + CODE_TTL_MS, attempts: 0, lastSentAt: Date.now(), ...extra };
  await writePrivate(codePath(normalized), record);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.AUTH_FROM_EMAIL,
      to: [normalized],
      subject,
      text: `Your Wishvilo verification code is ${code}. It expires in 10 minutes. If you did not request it, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;color:#35263b"><p style="color:#bd6683;font-weight:bold;letter-spacing:.12em">WISHVILO</p><h1 style="font-size:24px">Your verification code</h1><p>Use this code to continue:</p><div style="font-size:32px;letter-spacing:.3em;font-weight:bold;padding:16px 20px;background:#fff5f3;border-radius:14px;display:inline-block">${code}</div><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`
    })
  });
  if (!response.ok) {
    await del(codePath(normalized), { access: 'private' }).catch(() => {});
    const details = await response.json().catch(() => ({}));
    console.error('Wishvilo verification email failed:', details?.message || response.status);
    throw new Error('We could not send the email code. Check the verified sender address and try again.');
  }
  return { email: normalized, expiresAt: record.expiresAt };
}

export async function verifyEmailCode(email, code, purpose) {
  const normalized = normalizeEmail(email);
  const record = normalized ? await readPrivate(codePath(normalized)) : null;
  if (!record || record.purpose !== purpose || record.expiresAt < Date.now() || record.attempts >= MAX_CODE_ATTEMPTS) {
    if (record && record.expiresAt < Date.now()) await del(codePath(normalized), { access: 'private' }).catch(() => {});
    throw new Error('That code is invalid or expired. Request a new code.');
  }
  const supplied = codeDigest(String(code || '').trim());
  const expected = Buffer.from(record.codeHash, 'hex');
  const actual = Buffer.from(supplied, 'hex');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    record.attempts += 1;
    await writePrivate(codePath(normalized), record);
    throw new Error('That code is incorrect. Check it and try again.');
  }
  await del(codePath(normalized), { access: 'private' });
  return record;
}

export async function savePasswordUser(email, value) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('Enter a valid email address.');
  const user = { email: normalized, ...value, updatedAt: new Date().toISOString() };
  await writePrivate(userPath(normalized), user);
  return user;
}
