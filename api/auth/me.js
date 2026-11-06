import { readSession } from '../../lib/auth-utils.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  res.setHeader('Cache-Control', 'no-store, private');
  const user = readSession(req);
  if (!user) return res.status(401).json({ user: null });
  return res.status(200).json({ user: { name: user.name, email: user.email, picture: user.picture } });
}
