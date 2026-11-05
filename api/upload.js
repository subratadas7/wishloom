import { handleUpload } from '@vercel/blob/client';

function isUnexpiredGiftId(id) {
  if (!/^[a-f0-9]{24}$/.test(id || '')) return false;
  const createdAt = Number.parseInt(id.slice(0, 8), 16) * 1000;
  return Number.isFinite(createdAt) && Date.now() < createdAt + 24 * 60 * 60 * 1000;
}

export default async function handler(req, res) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload;
        try {
          payload = typeof clientPayload === 'string' ? JSON.parse(clientPayload) : clientPayload;
        } catch {
          throw new Error('Invalid upload request.');
        }
        if (!isUnexpiredGiftId(payload?.giftId) || !pathname.startsWith(`wishloom/media/${payload.giftId}/`)) {
          throw new Error('This birthday upload session has expired. Start a new birthday link.');
        }
        const fileType = payload?.fileType;
        if (typeof fileType !== 'string' || !/^(image|audio|video)\/[a-z0-9.+-]+$/i.test(fileType)) {
          throw new Error('This file type is not supported.');
        }
        return {
          allowedContentTypes: [fileType],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ kind: fileType.split('/')[0], giftId: payload.giftId }),
        };
      },
      onUploadCompleted: async () => {},
    });
    res.status(response.status).json(await response.json());
  } catch (error) {
    console.error('Wishloom upload token failed:', error?.message || error);
    res.status(400).json({ error: error?.message || 'Upload could not be started.' });
  }
}
