// Oturum: çerezden kullanıcıyı bulma, giriş zorunluluğu, oturum başlatma.
const crypto = require('crypto');
const { db, save } = require('./depo');
const { cookie } = require('./yardimci');
const userOf = r => { const s = db.sessions[cookie(r).sid]; return s && s.exp > Date.now() ? db.users[s.u] : null; };
const auth = (q, s, n) => { q.me = userOf(q); q.me ? n() : s.status(401).json({ error: 'Giriş gerekli' }); };
const startSession = (q, s, u) => {
  const t = crypto.randomBytes(32).toString('hex');
  db.sessions[t] = { u: u.username, exp: Date.now() + 30 * 864e5 }; save();
  const sec = q.secure || q.headers['x-forwarded-proto'] == 'https' ? '; Secure' : '';
  s.setHeader('Set-Cookie', `sid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${30 * 86400}${sec}`);
};

module.exports = { userOf, auth, startSession };
