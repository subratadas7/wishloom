import { issueSignedToken } from '@vercel/blob';
import { handleUploadPresigned } from '@vercel/blob/client';

const LINK_TTL_MS = 12 * 60 * 60 * 1000;

function giftExpiry(id) {
  if (!/^[a-f0-9]{24}$/.test(id || '')) return 0;
  return Number.parseInt(id.slice(0, 8), 16) * 1000 + LINK_TTL_MS;
}

function makeWebRequest(req, body) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers || {})) {
    if (typeof value === 'string' && !['content-length', 'transfer-encoding', 'connection'].includes(name.toLowerCase())) {
      headers.set(name, value);
    }
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const method = req.method || 'POST';
  return new Request(`${protocol}://${host}${req.url || '/api/upload'}`, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(body || {}),
  });
}

function getOidcToken(req) {
  const headerToken = req.headers?.['x-vercel-oidc-token'];
  return (Array.isArray(headerToken) ? headerToken[0] : headerToken) || process.env.VERCEL_OIDC_TOKEN;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const missing = [];
    if (!process.env.BLOB_STORE_ID) missing.push('BLOB_STORE_ID');
    if (!process.env.BLOB_WEBHOOK_PUBLIC_KEY) missing.push('BLOB_WEBHOOK_PUBLIC_KEY');
    if (!getOidcToken(req) && !process.env.BLOB_READ_WRITE_TOKEN) missing.push('Vercel Blob authentication');
    return res.status(200).json({ ready: missing.length === 0, missing });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const request = makeWebRequest(req, body);
    const result = await handleUploadPresigned({
      body: body || {},
      request,
      getSignedToken: async (pathname, clientPayload) => {
        let payload;
        try {
          payload = typeof clientPayload === 'string' ? JSON.parse(clientPayload) : clientPayload;
        } catch {
          throw new Error('Invalid upload request.');
        }
        const expiresAt = giftExpiry(payload?.giftId);
        if (!expiresAt || Date.now() >= expiresAt || !pathname.startsWith(`wishloom/media/${payload.giftId}/`)) {
          throw new Error('This birthday upload session has expired. Start a new birthday link.');
        }
        const fileType = typeof payload?.fileType === 'string' ? payload.fileType.split(';', 1)[0].trim().toLowerCase() : '';
        if (!/^(image|audio|video)\/[a-z0-9.+-]+$/.test(fileType)) {
          throw new Error('This file type is not supported.');
        }
        // Browsers and messaging apps commonly label audio-only WebM voice
        // notes as video/webm. Permit both WebM labels for the same upload
        // so the blob client and signed token agree on the container type.
        // Video MIME families are accepted as a wildcard to cover WebM labels
        // emitted by mobile browsers and recorded clips.
        const allowedContentTypes = fileType.startsWith('video/')
          ? ['video/*']
          : fileType === 'audio/webm'
            ? ['audio/webm', 'video/webm']
            : [fileType];
        const maximumSizeInBytes = fileType.startsWith('video/') ? 150 * 1024 * 1024 : 100 * 1024 * 1024;
        const validUntil = Math.min(Date.now() + 30 * 60 * 1000, expiresAt);
        const token = await issueSignedToken({
          pathname,
          operations: ['put'],
          allowedContentTypes,
          maximumSizeInBytes,
          validUntil,
          oidcToken: getOidcToken(req),
          storeId: process.env.BLOB_STORE_ID,
        });
        return {
          token,
          urlOptions: {
            allowedContentTypes,
            maximumSizeInBytes,
            validUntil,
            addRandomSuffix: true,
            allowOverwrite: false,
            cacheControlMaxAge: 60,
          },
        };
      },
      onUploadCompleted: async () => {},
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('Wishloom presigned upload failed:', error?.message || error);
    res.status(400).json({ error: error?.message || 'Could not prepare a secure upload.' });
  }
}
