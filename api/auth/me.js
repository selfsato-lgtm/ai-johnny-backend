const { verifySessionToken, SESSION_COOKIE_NAME } = require('../../lib/session');

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  const match = raw.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

module.exports = async function handler(req, res) {
  const sessionSecret = process.env.SESSION_SECRET;
  const token = getCookie(req, SESSION_COOKIE_NAME);
  const payload = sessionSecret ? await verifySessionToken(token, sessionSecret) : null;
  res.setHeader('content-type', 'application/json');
  if (!payload || !payload.email) {
    res.status(200).send(JSON.stringify({ loggedIn: false }));
    return;
  }
  res.status(200).send(JSON.stringify({ loggedIn: true, email: payload.email }));
};
