import { clearCookie, requestOrigin, setCookie, signSession } from '../../lib/auth-utils.js';

function readCookie(req, name) {
  return (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) || '';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.');
  const params = new URL(req.url || '/', requestOrigin(req)).searchParams;
  if (params.has('error')) return res.redirect(302, '/?signin=cancelled');
  const suppliedState = params.get('state') || '';
  const savedState = decodeURIComponent(readCookie(req, 'wishvilo_oauth_state'));
  clearCookie(res, 'wishvilo_oauth_state', '/api/auth/callback');
  if (!suppliedState || suppliedState !== savedState) return res.status(400).send('Google sign-in could not be verified. Please try again.');
  if (!params.get('code') || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.SESSION_SECRET) return res.status(503).send('Google sign-in is not configured yet.');
  try {
    const redirectUri = `${requestOrigin(req)}/api/auth/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: params.get('code'), client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) throw new Error('Google did not approve the sign-in.');
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` } });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub || profile.email_verified !== true) throw new Error('Google could not verify this account.');
    setCookie(res, 'wishvilo_session', signSession({ sub: profile.sub, name: String(profile.name || profile.given_name || 'Wishvilo user').slice(0, 80), email: String(profile.email || '').slice(0, 160), picture: String(profile.picture || '').slice(0, 1000) }), 30 * 24 * 60 * 60);
    return res.redirect(302, '/?account=1');
  } catch (error) {
    console.error('Wishvilo Google sign-in failed:', error?.message || error);
    return res.status(502).send('Google sign-in could not be completed. Please go back and try again.');
  }
}
