import { get } from '@vercel/blob';

function isExpired(id) {
  return !/^[a-f0-9]{24}$/.test(id || '') || Date.now() >= Number.parseInt(id.slice(0, 8), 16) * 1000 + 24 * 60 * 60 * 1000;
}

export default async function handler(req, res) {
  const id = req.query?.id || new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`).searchParams.get('id') || '';
  if (isExpired(id)) return res.status(410).send('This birthday surprise has vanished after 24 hours.');
  try {
    const result = await get(`wishloom/gifts/${id}.html`, { access: 'private' });
    if (!result?.stream || result.statusCode !== 200) return res.status(404).send('This birthday page could not be found.');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    for await (const chunk of result.stream) res.write(chunk);
    return res.end();
  } catch (error) {
    console.error('Wishloom gift read failed:', error?.message || error);
    return res.status(503).send('Birthday storage is not ready. Please try again later.');
  }
}
