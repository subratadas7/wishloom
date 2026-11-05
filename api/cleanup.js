import { del, list } from '@vercel/blob';

function giftIdFromPath(pathname) {
  const match = pathname.match(/^wishloom\/(?:gifts\/([a-f0-9]{24})\.html|media\/([a-f0-9]{24})\/|comments\/([a-f0-9]{24})\/)/);
  return match?.[1] || match?.[2] || match?.[3] || '';
}

export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).send('Unauthorized.');
  }
  try {
    let cursor;
    let removed = 0;
    do {
      const page = await list({ prefix: 'wishloom/', limit: 1000, cursor, access: 'private' });
      const expired = page.blobs.filter(blob => {
        const id = giftIdFromPath(blob.pathname);
        if (!id) return false;
        const expiresAt = Number.parseInt(id.slice(0, 8), 16) * 1000 + 24 * 60 * 60 * 1000;
        return Date.now() >= expiresAt;
      });
      for (let i = 0; i < expired.length; i += 100) {
        await del(expired.slice(i, i + 100).map(blob => blob.pathname), { access: 'private' });
        removed += Math.min(100, expired.length - i);
      }
      cursor = page.cursor;
    } while (cursor);
    return res.status(200).json({ removed });
  } catch (error) {
    console.error('Wishloom cleanup failed:', error?.message || error);
    return res.status(500).json({ error: 'Birthday cleanup failed.' });
  }
}
