import { readSession } from '../../lib/auth-utils.js';
import { getPasswordUser } from '../../lib/password-auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method === 'GET') {
    const user = readSession(req);
    if (!user) return res.status(401).json({ user: null });
    try {
      const credentials = user.providers ? null : await getPasswordUser(user.email);
      const hasPassword = Array.isArray(user.providers)
        ? user.providers.includes('password')
        : Boolean((user.provider === 'email' || (credentials?.hash && credentials.sub === user.sub)) && (!credentials || credentials.sub === user.sub));
      return res.status(200).json({ user: { name: user.name || '', email: user.email, picture: user.picture || '', provider: user.provider || 'google', providers: user.providers || [], hasPassword } });
    } catch (error) {
      console.error('Wishvilo auth status failed:', error?.message || error);
      return res.status(503).json({ error: 'Could not check account settings right now.' });
    }
  }
  return res.status(405).json({ error: 'Use Firebase sign-in to manage your account.' });
}
