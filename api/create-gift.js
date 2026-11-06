import { put } from '@vercel/blob';

function expirationFor(id) {
  if (!/^[a-f0-9]{24}$/.test(id || '')) return 0;
  return Number.parseInt(id.slice(0, 8), 16) * 1000 + 12 * 60 * 60 * 1000;
}

export default async function handler(req, res) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { html, id } = body || {};
    const expiresAt = expirationFor(id);
    if (!expiresAt || Date.now() >= expiresAt) {
      return res.status(400).json({ error: 'This birthday link has expired. Create a fresh link.' });
    }
    if (typeof html !== 'string' || html.length > 3_000_000 || !html.startsWith('<!doctype html>')) {
      return res.status(400).json({ error: 'The birthday page could not be prepared.' });
    }
    await put(`wishloom/gifts/${id}.html`, html, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: 'text/html; charset=utf-8',
      cacheControlMaxAge: 0,
    });
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    return res.status(200).json({
      id,
      expiresAt: new Date(expiresAt).toISOString(),
      url: `${protocol}://${host}/api/gift?id=${id}`,
    });
  } catch (error) {
    console.error('Wishloom gift publish failed:', error?.message || error);
    return res.status(500).json({ error: 'Could not publish the birthday link. Check that Vercel Blob is connected to this project.' });
  }
}
