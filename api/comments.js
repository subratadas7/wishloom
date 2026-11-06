import { randomBytes } from 'node:crypto';
import { get, list, put } from '@vercel/blob';

function isValidGiftId(id) {
  return /^[a-f0-9]{24}$/.test(id || '') && Date.now() < Number.parseInt(id.slice(0, 8), 16) * 1000 + 12 * 60 * 60 * 1000;
}

function requestId(req) {
  return req.query?.id || new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`).searchParams.get('id') || '';
}

async function readComment(pathname) {
  const result = await get(pathname, { access: 'private' });
  if (!result?.stream || result.statusCode !== 200) return null;
  return JSON.parse(await new Response(result.stream).text());
}

export default async function handler(req, res) {
  const id = requestId(req);
  if (!isValidGiftId(id)) return res.status(410).json({ error: 'Comments are closed because this birthday link has expired.' });
  const prefix = `wishloom/comments/${id}/`;
  try {
    if (req.method === 'GET') {
      const page = await list({ prefix, limit: 1000, access: 'private' });
      const paths = page.blobs.map(blob => blob.pathname).sort().reverse().slice(0, 100);
      const comments = (await Promise.all(paths.map(readComment))).filter(Boolean);
      return res.status(200).json({ comments: comments.reverse() });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 40) : '';
    const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 500) : '';
    if (!name || !text) return res.status(400).json({ error: 'Add your name and a comment first.' });
    const existing = await list({ prefix, limit: 100, access: 'private' });
    if (existing.blobs.length >= 100) return res.status(429).json({ error: 'This birthday page has reached its 100-comment limit.' });
    const comment = { name, text, createdAt: new Date().toISOString() };
    const filename = `${Date.now()}-${randomBytes(8).toString('hex')}.json`;
    await put(`${prefix}${filename}`, JSON.stringify(comment), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'application/json; charset=utf-8',
      cacheControlMaxAge: 0,
    });
    return res.status(201).json({ comment });
  } catch (error) {
    console.error('Wishloom comment request failed:', error?.message || error);
    return res.status(500).json({ error: 'Could not load or post comments right now.' });
  }
}
