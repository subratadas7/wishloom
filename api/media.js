import { issueSignedToken, presignUrl } from '@vercel/blob';

const LINK_TTL_MS = 12 * 60 * 60 * 1000;

function giftExpiry(id) {
  if (!/^[a-f0-9]{24}$/.test(id || '')) return 0;
  return Number.parseInt(id.slice(0, 8), 16) * 1000 + LINK_TTL_MS;
}

export default async function handler(req, res) {
  const url = new URL(req.url || '/', 'https://wishloom-me.vercel.app');
  const id = req.query?.id || url.searchParams.get('id') || '';
  const pathname = req.query?.path || url.searchParams.get('path') || '';
  if (!/^[a-f0-9]{24}$/.test(id) || typeof pathname !== 'string' || !pathname.startsWith('wishloom/media/' + id + '/') || pathname.includes('..')) {
    return res.status(404).send('Birthday media not found.');
  }
  const expiresAt = giftExpiry(id);
  if (!expiresAt || Date.now() >= expiresAt) {
    return res.status(410).send('This birthday surprise has vanished after 12 hours.');
  }
  try {
    const token = await issueSignedToken({ pathname, operations: ['get'], validUntil: expiresAt });
    const { presignedUrl } = await presignUrl(token, {
      pathname,
      operation: 'get',
      access: 'private',
      validUntil: expiresAt,
    });
    res.writeHead(302, { Location: presignedUrl, 'Cache-Control': 'private, no-store' });
    return res.end();
  } catch (error) {
    console.error('Wishloom media signing failed:', error?.message || error);
    return res.status(404).send('Birthday media not found.');
  }
}
