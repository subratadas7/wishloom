import { clearCookie } from '../../lib/auth-utils.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  clearCookie(res, 'wishvilo_session');
  return res.status(200).json({ ok: true });
}
