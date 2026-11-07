import { requestBody, requestOrigin, setCookie, signSession } from '../../lib/auth-utils.js';
import { verifyFirebaseIdToken } from '../../lib/firebase-token.js';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const origin = req.headers.origin;
  if (origin && origin !== requestOrigin(req)) return res.status(403).json({ error: 'This request could not be verified.' });
  if (!process.env.SESSION_SECRET || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_API_KEY) return res.status(503).json({ error: 'Firebase sign-in is not configured yet. Add the Firebase project settings and redeploy.' });
  let body;
  try { body = requestBody(req); } catch { return res.status(400).json({ error: 'The sign-in request could not be read.' }); }
  try {
    const claims = await verifyFirebaseIdToken(body.idToken, process.env.FIREBASE_PROJECT_ID);
    const providers = await linkedProviders(body.idToken, claims);
    const user = {
      // Reuse Google's stable subject when present so accounts made through the
      // previous Google OAuth flow keep seeing their existing saved activity.
      sub: claims.firebase?.identities?.['google.com']?.[0] || claims.sub,
      name: String(claims.name || body.name || '').trim().slice(0, 80),
      email: String(claims.email || '').trim().toLowerCase().slice(0, 160),
      picture: String(claims.picture || body.picture || '').slice(0, 1000),
      provider: claims.firebase?.sign_in_provider || 'firebase',
      providers,
    };
    setCookie(res, 'wishvilo_session', signSession(user), SESSION_MAX_AGE);
    return res.status(200).json({ ok: true, user: { name: user.name, email: user.email, picture: user.picture, provider: user.provider, hasPassword: providers.includes('password') } });
  } catch (error) {
    console.error('Wishvilo Firebase session exchange failed:', error?.message || error);
    return res.status(401).json({ error: error?.message || 'Firebase sign-in could not be verified. Please try again.' });
  }
}

async function linkedProviders(idToken, claims) {
  const identities = claims.firebase?.identities || {};
  const fallback = [...Object.keys(identities).map(provider => provider === 'email' ? 'password' : provider), claims.firebase?.sign_in_provider].filter(Boolean);
  if (!process.env.FIREBASE_API_KEY) return fallback;
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(process.env.FIREBASE_API_KEY)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
    });
    const result = await response.json();
    if (!response.ok) return fallback;
    return [...new Set((result.users?.[0]?.providerUserInfo || []).map(item => item.providerId).filter(Boolean).concat(fallback))];
  } catch { return fallback; }
}
