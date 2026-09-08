const { SESSION_COOKIE_NAME } = require('../../lib/session');

module.exports = async function handler(req, res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  res.writeHead(302, { Location: 'https://lovequest-masters.com/' });
  res.end();
};
