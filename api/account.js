import { createHash } from 'node:crypto';
import { get, list, put } from '@vercel/blob';
import { accountKey, readSession, requestBody } from '../lib/auth-utils.js';
import { getPasswordUser } from '../lib/password-auth.js';

function giftExpiry(id) {
  return /^[a-f0-9]{24}$/.test(id || '') ? Number.parseInt(id.slice(0, 8), 16) * 1000 + 12 * 60 * 60 * 1000 : 0;
}

async function readJson(pathname) {
  const result = await get(pathname, { access: 'private' });
  if (!result?.stream || result.statusCode !== 200) return null;
  try { return JSON.parse(await new Response(result.stream).text()); } catch { return null; }
}

async function save(pathname, value) {
  return put(pathname, JSON.stringify(value), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json; charset=utf-8', cacheControlMaxAge: 0 });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  const user = readSession(req);
  if (!user) return res.status(401).json({ error: 'Sign in to open your Wishvilo account.' });
  const key = accountKey(user.sub);
  const profilePath = `wishvilo/profiles/${key}.json`;

  try {
    if (req.method === 'GET') {
      const profile = await readJson(profilePath);
      const page = await list({ prefix: `wishvilo/accounts/${key}/`, limit: 1000, access: 'private' });
      const records = (await Promise.all(page.blobs.map(blob => readJson(blob.pathname)))).filter(Boolean).filter(item => item.expiresAt && Date.now() < new Date(item.expiresAt).getTime());
      const gifts = records.filter(item => item.kind === 'gift').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const comments = records.filter(item => item.kind === 'comment').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const passwordAccount = await getPasswordUser(user.email);
      return res.status(200).json({ user: { name: profile?.name || user.name, email: user.email, picture: user.picture, birthYear: profile?.birthYear || '', provider: user.provider || 'google', hasPassword: Boolean(passwordAccount?.hash && passwordAccount.sub === user.sub) }, profileExists: Boolean(profile), gifts, comments });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    const body = requestBody(req);
    if (body.action === 'profile') {
      const name = String(body.name || user.name).trim().slice(0, 80);
      const birthYear = String(body.birthYear || '').trim();
      if (!name) return res.status(400).json({ error: 'Please add your name.' });
      if (birthYear && (!/^\d{4}$/.test(birthYear) || Number(birthYear) < 1900 || Number(birthYear) > new Date().getFullYear())) return res.status(400).json({ error: 'Enter a valid birth year.' });
      await save(profilePath, { name, birthYear, updatedAt: new Date().toISOString() });
      return res.status(200).json({ ok: true });
    }
    if (body.action === 'claim-comment') {
      const giftId = String(body.giftId || '');
      const commentId = String(body.commentId || '');
      const token = String(body.claimToken || '');
      if (!giftExpiry(giftId) || Date.now() >= giftExpiry(giftId) || !/^[a-f0-9]{16,64}\.json$/.test(commentId) || !/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ error: 'This guest comment cannot be linked.' });
      const commentPath = `wishloom/comments/${giftId}/${commentId}`;
      const comment = await readJson(commentPath);
      const expected = comment?.claimHash;
      const actual = createHash('sha256').update(token).digest('hex');
      if (!expected || expected !== actual) return res.status(403).json({ error: 'This comment could not be verified for your account.' });
      const record = { kind: 'comment', giftId, commentId, name: comment.name, text: comment.text, createdAt: comment.createdAt, expiresAt: new Date(giftExpiry(giftId)).toISOString() };
      await save(`wishvilo/accounts/${key}/comments/${giftId}-${commentId}`, record);
      delete comment.claimHash;
      comment.ownerKey = key;
      await save(commentPath, comment);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Unknown account action.' });
  } catch (error) {
    console.error('Wishvilo account request failed:', error?.message || error);
    return res.status(500).json({ error: 'Could not load your account right now.' });
  }
}
