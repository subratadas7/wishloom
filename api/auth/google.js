import { randomBytes } from 'node:crypto';
import { requestOrigin, setCookie } from '../auth-utils.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.');
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.SESSION_SECRET) {
    return res.status(503).send('Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and SESSION_SECRET to the Vercel Production environment.');
  }
  const state = randomBytes(24).toString('hex');
  setCookie(res, 'wishvilo_oauth_state', state, 600, '/api/auth/callback');
  const callback = `${requestOrigin(req)}/api/auth/callback`;
  const query = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: callback, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
  res.setHeader('Cache-Control', 'no-store');
  return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${query}`);
}
