import { accountKey, readSession, requestBody, requestOrigin, setCookie, signSession } from '../../lib/auth-utils.js';
import { getPasswordUser, hashPassword, normalizeEmail, savePasswordUser, sendEmailCode, verifyEmailCode, verifyPassword } from '../../lib/password-auth.js';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function sessionUser(user) {
  return { sub: user.sub, name: user.name || '', email: user.email, picture: user.picture || '', provider: user.provider || 'google' };
}

function startSession(res, user) {
  setCookie(res, 'wishvilo_session', signSession(sessionUser(user)), SESSION_MAX_AGE);
}

function cleanText(value, max = 80) { return String(value || '').trim().slice(0, max); }

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method === 'GET') {
    const user = readSession(req);
    if (!user) return res.status(401).json({ user: null });
    try {
      const credentials = await getPasswordUser(user.email);
      return res.status(200).json({ user: { name: user.name || '', email: user.email, picture: user.picture || '', provider: user.provider || 'google', hasPassword: Boolean(credentials?.hash && credentials.sub === user.sub) } });
    } catch (error) {
      console.error('Wishvilo auth status failed:', error?.message || error);
      return res.status(503).json({ error: 'Could not check account settings right now.' });
    }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const origin = req.headers.origin;
  if (origin && origin !== requestOrigin(req)) return res.status(403).json({ error: 'This request could not be verified.' });

  let body;
  try { body = requestBody(req); } catch { return res.status(400).json({ error: 'The request could not be read.' }); }
  const action = String(body.action || '');
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const confirmation = String(body.confirmPassword || '');

  try {
    if (action === 'register-send-code') {
      if (!email) return res.status(400).json({ error: 'Enter a valid email address.' });
      const name = cleanText(body.name);
      if (!name) return res.status(400).json({ error: 'Enter your name.' });
      if (password !== confirmation) return res.status(400).json({ error: 'The passwords do not match.' });
      const passwordHash = hashPassword(password);
      if (await getPasswordUser(email)) return res.status(409).json({ error: 'This email already has an account. Log in or use Forgot password.' });
      await sendEmailCode({ email, name, purpose: 'register', subject: 'Your Wishvilo account verification code', extra: { passwordHash, sub: `email:${accountKey(email)}` } });
      return res.status(200).json({ ok: true, email, message: 'Verification code sent. Check your email.' });
    }

    if (action === 'register-verify-code') {
      const code = cleanText(body.code, 12);
      const pending = await verifyEmailCode(email, code, 'register');
      if (await getPasswordUser(email)) return res.status(409).json({ error: 'This email already has an account. Log in instead.' });
      const user = await savePasswordUser(email, { ...pending.passwordHash, sub: pending.sub, name: pending.name, provider: 'email', emailVerified: true });
      startSession(res, user);
      return res.status(200).json({ ok: true, user: { name: user.name, email: user.email } });
    }

    if (action === 'login') {
      if (!email || !password) return res.status(400).json({ error: 'Enter your email and password.' });
      const user = await getPasswordUser(email);
      if (!user?.hash || !verifyPassword(password, user)) return res.status(401).json({ error: 'Email or password is incorrect. If you forgot it, use Forgot password.' });
      if (user.emailVerified !== true) return res.status(403).json({ error: 'Verify your email before logging in.' });
      startSession(res, user);
      return res.status(200).json({ ok: true, user: { name: user.name, email: user.email } });
    }

    if (action === 'forgot-send-code') {
      if (!email) return res.status(400).json({ error: 'Enter a valid email address.' });
      const user = await getPasswordUser(email);
      if (user?.hash) await sendEmailCode({ email, name: user.name, purpose: 'reset', subject: 'Reset your Wishvilo password' });
      return res.status(200).json({ ok: true, email, message: 'If this email has a Wishvilo password, a reset code is on its way.' });
    }

    if (action === 'forgot-reset-password') {
      if (password !== confirmation) return res.status(400).json({ error: 'The passwords do not match.' });
      const newPassword = hashPassword(password);
      const pending = await verifyEmailCode(email, cleanText(body.code, 12), 'reset');
      const user = await getPasswordUser(email);
      if (!user?.hash) return res.status(400).json({ error: 'This account does not have an email password.' });
      const updated = await savePasswordUser(email, { ...user, ...newPassword, updatedAt: new Date().toISOString() });
      startSession(res, updated);
      return res.status(200).json({ ok: true, message: 'Password reset. You are now signed in.' });
    }

    const signedIn = readSession(req);
    if (!signedIn) return res.status(401).json({ error: 'Sign in first to manage your password.' });

    if (action === 'set-password-send-code') {
      const existing = await getPasswordUser(signedIn.email);
      if (existing?.hash && existing.sub === signedIn.sub) return res.status(409).json({ error: 'A password is already set. Use the change-password form.' });
      if (existing && existing.sub !== signedIn.sub) return res.status(409).json({ error: 'This email is already linked to a different account.' });
      await sendEmailCode({ email: signedIn.email, name: signedIn.name, purpose: 'set-password', subject: 'Verify your email to set a Wishvilo password', extra: { sub: signedIn.sub } });
      return res.status(200).json({ ok: true, email: signedIn.email, message: 'A verification code was sent to your account email.' });
    }

    if (action === 'set-password') {
      if (password !== confirmation) return res.status(400).json({ error: 'The passwords do not match.' });
      const newPassword = hashPassword(password);
      const pending = await verifyEmailCode(signedIn.email, cleanText(body.code, 12), 'set-password');
      if (pending.sub !== signedIn.sub) return res.status(403).json({ error: 'This code belongs to another account.' });
      const existing = await getPasswordUser(signedIn.email);
      if (existing && existing.sub !== signedIn.sub) return res.status(409).json({ error: 'This email is already linked to a different account.' });
      const updated = await savePasswordUser(signedIn.email, { ...existing, ...newPassword, sub: signedIn.sub, name: existing?.name || signedIn.name, provider: existing?.provider || signedIn.provider || 'google', emailVerified: true });
      startSession(res, updated);
      return res.status(200).json({ ok: true, message: 'Password set. You can now also log in with email and password.' });
    }

    if (action === 'change-password') {
      const current = String(body.currentPassword || '');
      if (password !== confirmation) return res.status(400).json({ error: 'The new passwords do not match.' });
      const credentials = await getPasswordUser(signedIn.email);
      if (!credentials?.hash || credentials.sub !== signedIn.sub) return res.status(409).json({ error: 'Set a password first using the verified email code.' });
      if (!verifyPassword(current, credentials)) return res.status(401).json({ error: 'Current password is incorrect.' });
      const next = hashPassword(password);
      await savePasswordUser(signedIn.email, { ...credentials, ...next });
      return res.status(200).json({ ok: true, message: 'Your password was changed.' });
    }

    return res.status(400).json({ error: 'Unknown account action.' });
  } catch (error) {
    const message = error?.message || 'The account request could not be completed.';
    if (/verification email is not configured|SESSION_SECRET is not configured/.test(message)) return res.status(503).json({ error: message });
    if (/wait a minute/.test(message)) return res.status(429).json({ error: message });
    if (/invalid or expired|incorrect\. Check it/.test(message)) return res.status(400).json({ error: message });
    if (/password between|valid email address|Please add your name/.test(message)) return res.status(400).json({ error: message });
    console.error('Wishvilo account auth failed:', message);
    return res.status(500).json({ error: 'The account request could not be completed. Please try again.' });
  }
}
