// Vercel Edge Middleware: AIジョニー本体ページへのアクセスを、リクエストの時点でブロックする。
// lovequest-mastersのmiddleware.jsと同じ仕組みだが、Edge Middlewareは常にESMで動くため、
// このプロジェクト(CommonJS)のlib/session.js・lib/membership.jsをimportせず、自己完結で実装している。

export const config = {
  matcher: ['/', '/index.html'],
};

const encoder = new TextEncoder();

function fromBase64Url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function getKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
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

function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { cells.push(cur); cur = ''; }
      else cur += c;
    }
  }
  cells.push(cur);
  return cells;
}

async function isActiveMember(email) {
  const sheetId = process.env.MEMBERSHIP_SHEET_ID;
  if (!sheetId || !email) return false;
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  const res = await fetch(url);
  if (!res.ok) return false;
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const normalized = email.trim().toLowerCase();
  for (const line of lines.slice(1)) {
    const [emailRaw, statusRaw] = parseCsvLine(line);
    if ((emailRaw || '').trim().toLowerCase() === normalized) {
      return (statusRaw || '').trim().toLowerCase() === 'active';
    }
  }
  return false;
}

function getCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  const match = raw.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const sessionSecret = process.env.SESSION_SECRET;

  const token = getCookie(request, 'lqm_session');
  const payload = sessionSecret ? await verifySessionToken(token, sessionSecret) : null;

  if (!payload || !payload.email) {
    const loginUrl = new URL('/api/auth/start', url.origin);
    loginUrl.searchParams.set('next', url.pathname);
    return Response.redirect(loginUrl, 302);
  }

  const active = await isActiveMember(payload.email);
  if (!active) {
    return Response.redirect('https://lovequest-masters.com/?login=inactive', 302);
  }

  return undefined;
}
