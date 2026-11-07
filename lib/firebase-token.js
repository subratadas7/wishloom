import { createPublicKey, createVerify } from 'node:crypto';

const CERTS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let cachedKeys = null;
let keysExpireAt = 0;

async function signingKeys() {
  if (cachedKeys && Date.now() < keysExpireAt) return cachedKeys;
  const response = await fetch(CERTS_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Firebase signing keys could not be reached.');
  const payload = await response.json();
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/i)?.[1] || 3600);
  cachedKeys = new Map((payload.keys || []).map(key => [key.kid, key]));
  keysExpireAt = Date.now() + Math.min(maxAge, 3600) * 1000;
  return cachedKeys;
}

export async function verifyFirebaseIdToken(token, projectId) {
  if (typeof token !== 'string' || token.length > 12000) throw new Error('Sign in again to continue.');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Firebase sign-in token is invalid.');
  let header;
  let claims;
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch { throw new Error('Firebase sign-in token is invalid.'); }
  if (header.alg !== 'RS256' || !header.kid || claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Firebase sign-in token is for a different project.');
  const keys = await signingKeys();
  const jwk = keys.get(header.kid);
  if (!jwk) {
    cachedKeys = null;
    const refreshed = await signingKeys();
    if (!refreshed.has(header.kid)) throw new Error('Firebase sign-in token has expired. Please sign in again.');
    return verifyWithKey(parts, claims, refreshed.get(header.kid), projectId);
  }
  return verifyWithKey(parts, claims, jwk, projectId);
}

function verifyWithKey(parts, claims, jwk, projectId) {
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();
  const validSignature = verifier.verify(createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'));
  const now = Math.floor(Date.now() / 1000);
  const clockSkewTolerance = 300; // 5 minutes grace period for server clock drift
  if (
    !validSignature ||
    !claims.sub ||
    claims.sub.length > 128 ||
    !claims.email ||
    claims.email_verified !== true ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= (now - clockSkewTolerance) ||
    !Number.isFinite(claims.iat) ||
    claims.iat > (now + clockSkewTolerance) ||
    !Number.isFinite(claims.auth_time) ||
    claims.auth_time > (now + clockSkewTolerance) ||
    claims.aud !== projectId
  ) {
    throw new Error('Firebase sign-in token is invalid or expired. Please sign in again.');
  }
  return claims;
}
