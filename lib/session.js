// 署名付きセッションクッキー（HMAC-SHA256、Web Crypto APIのみ使用）。
// lovequest-mastersリポジトリのlib/session.jsと同一ロジック(CommonJS版)。

const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  const b64 = Buffer.from(str, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = Buffer.from(str, 'base64').toString('binary');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function getKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function createSessionToken(payload, secret) {
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sig));
  return `${payloadB64}.${sigB64}`;
}

async function verifySessionToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadB64, sigB64] = token.split('.');
  if (!payloadB64 || !sigB64) return null;
  try {
    const key = await getKey(secret);
    const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(sigB64), encoder.encode(payloadB64));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    if (typeof payload.exp === 'number' && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

const SESSION_COOKIE_NAME = 'lqm_session';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30日

module.exports = { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS };
