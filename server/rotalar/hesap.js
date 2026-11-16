// Hesap: kayıt, giriş, çıkış, profil ve hareketli profil fotoğrafı / videolu kapak yükleme.
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const { db, save, UP } = require('../depo');
const { HEX, pk, S, num, fit, hash, limit, cookie } = require('../yardimci');
const { conns, push, pub, me, isFriend, notify } = require('../canli');
const { userOf, auth, startSession } = require('../oturum');
const { theme, img, att, kind, MAXB } = require('../dogrula');

module.exports = (app, express) => {
app.post('/api/register', async (q, s) => {
  if (limit('r' + q.ip, 10, 6e4)) return s.status(429).json({ error: 'Çok fazla deneme, biraz bekle' });
  const un = S(q.body.username, 20).toLowerCase(), pw = S(q.body.password, 100);
  if (!/^[a-z0-9_]{3,20}$/.test(un)) return s.status(400).json({ error: 'Kullanıcı adı: 3-20 karakter; harf, rakam veya _' });
  if (pw.length < 6) return s.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
  if (db.users[un]) return s.status(409).json({ error: 'Bu kullanıcı adı alınmış' });
  const salt = crypto.randomBytes(16).toString('hex'), h = await hash(pw, salt);
  if (db.users[un]) return s.status(409).json({ error: 'Bu kullanıcı adı alınmış' });
  const u = db.users[un] = { username: un, display: un, hash: h, salt, bio: '', status: '', color: '#1db6a0', avatar: '', banner: '', av: 0, bv: 0, theme: null, created: Date.now() };
  startSession(q, s, u); s.json({ user: me(u) });
});
app.post('/api/login', async (q, s) => {
  if (limit('l' + q.ip, 10, 6e4)) return s.status(429).json({ error: 'Çok fazla deneme, biraz bekle' });
  const u = db.users[S(q.body.username, 20).toLowerCase()], h = await hash(S(q.body.password, 100), u ? u.salt : '0'.repeat(32));
  if (!u || !crypto.timingSafeEqual(Buffer.from(h), Buffer.from(u.hash))) return s.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  startSession(q, s, u); s.json({ user: me(u) });
});
app.post('/api/logout', (q, s) => { delete db.sessions[cookie(q).sid]; save(); s.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0'); s.json({ ok: 1 }); });
app.get('/api/me', auth, (q, s) => s.json({ user: me(q.me) }));
app.patch('/api/me', auth, (q, s) => {
  try {
    const u = q.me, b = q.body;
    if ('display' in b) { const d = S(b.display, 30).trim(); if (!d) throw new Error('Görünen ad boş olamaz'); u.display = d; }
    if ('bio' in b) u.bio = S(b.bio, 300);
    if ('status' in b) u.status = S(b.status, 60);
    if ('color' in b) { if (!HEX.test(b.color)) throw new Error('Geçersiz renk'); u.color = b.color; }
    if ('theme' in b) u.theme = theme(b.theme);
    if ('avatar' in b) img(u, 'avatar', b.avatar);
    if ('banner' in b) img(u, 'banner', b.banner);
    if ('afit' in b) u.afit = fit(b.afit);
    if ('bfit' in b) u.bfit = fit(b.bfit);
    save(); notify(u.username); s.json({ user: me(u) });
  } catch (e) { s.status(400).json({ error: e.message }); }
});
app.put('/api/me/media/:kind', auth, (q, s, n) => {
  if (!MAXB[q.params.kind]) return s.status(404).json({ error: 'Bulunamadı' });
  if (limit('u' + q.ip, 12, 6e4)) return s.status(429).json({ error: 'Çok fazla yükleme, biraz bekle' });
  n();
}, express.raw({ type: () => true, limit: '121mb' }), (q, s) => {
  try {
    const k = q.params.kind, u = q.me, b = Buffer.isBuffer(q.body) ? q.body : Buffer.alloc(0), t = kind(b);
    if (!t) throw new Error('Desteklenmeyen dosya (JPG, PNG, GIF, WebP' + (k == 'banner' ? ', MP4, WebM' : '') + ')');
    const max = MAXB[k][t[1]]; if (!max) throw new Error('Profil fotoğrafı için video yerine GIF veya hareketli WebP kullan');
    if (b.length > max) throw new Error(`Dosya çok büyük (en fazla ${(max / 1e6).toFixed(1).replace('.', ',')} MB)`);
    const f = `${k}-${u.username}.${t[0]}`, v = k == 'avatar' ? 'av' : 'bv';
    if (u[k] && u[k] != f) fs.rmSync(path.join(UP, u[k]), { force: true });
    fs.writeFileSync(path.join(UP, f), b); u[k] = f; u[v] = Date.now();
    save(); notify(u.username); s.json({ user: me(u) });
  } catch (e) { s.status(400).json({ error: e.message }); }
});
};
