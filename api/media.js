import { get } from '@vercel/blob';

function isExpired(id) {
  return !/^[a-f0-9]{24}$/.test(id || '') || Date.now() >= Number.parseInt(id.slice(0, 8), 16) * 1000 + 24 * 60 * 60 * 1000;
}

export default async function handler(req, res) {
  const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
  const id = req.query?.id || url.searchParams.get('id') || '';
  const pathname = req.query?.path || url.searchParams.get('path') || '';
  if (!/^[a-f0-9]{24}$/.test(id) || typeof pathname !== 'string' || !pathname.startsWith(`wishloom/media/${id}/`) || pathname.includes('..')) {
    return res.status(404).send('Birthday media not found.');
  }
  if (isExpired(id)) {
    return res.status(410).send('This birthday surprise has vanished after 24 hours.');
  }
  try {
    const result = await get(pathname, { access: 'private' });
    if (!result?.stream || result.statusCode !== 200) return res.status(404).send('Birthday media not found.');
    const type = result.blob.contentType || 'application/octet-stream';
    if (!/^(image|audio|video)\//i.test(type)) return res.status(415).send('Unsupported media.');
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    for await (const chunk of result.stream) res.write(chunk);
    return res.end();
  } catch (error) {
    console.error('Wishloom media read failed:', error?.message || error);
    return res.status(404).send('Birthday media not found.');
  }
}
