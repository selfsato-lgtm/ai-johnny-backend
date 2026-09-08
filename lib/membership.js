// 会員ステータスの管理。lovequest-mastersと同じGoogle Sheet(MEMBERSHIP_SHEET_ID)を参照する。
// シートの想定フォーマット（1行目はヘッダーとして無視される）: A列=メールアドレス、B列=ステータス(active/inactive)

const SHEET_ID = process.env.MEMBERSHIP_SHEET_ID;
const CACHE_MS = 60 * 1000;

let cache = { at: 0, map: null };

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

async function fetchMembershipMap() {
  if (!SHEET_ID) return {};
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
  const res = await fetch(url);
  if (!res.ok) return {};
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const map = {};
  lines.slice(1).forEach((line) => {
    const [emailRaw, statusRaw] = parseCsvLine(line);
    const email = (emailRaw || '').trim().toLowerCase();
    const status = (statusRaw || '').trim().toLowerCase();
    if (email) map[email] = status === 'active';
  });
  return map;
}

async function isActiveMember(email) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const now = Date.now();
  if (!cache.map || now - cache.at > CACHE_MS) {
    cache = { at: now, map: await fetchMembershipMap() };
  }
  return cache.map[normalized] === true;
}

module.exports = { isActiveMember };
