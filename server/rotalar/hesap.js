// Hesap: kayıt, giriş, çıkış, profil ve hareketli profil fotoğrafı / videolu kapak yükleme.
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const { db, save, UP } = require('../depo');
const { HEX, pk, S, num, fit, hash, limit, cookie } = require('../yardimci');
const { conns, push, pub, me, isFriend, notify } = require('../canli');
const { userOf, auth, startSession } = require('../oturum');
const { theme, img, att, kind, MAXB, kozm, KZ, isAdmin, rozet } = require('../dogrula');
const kodlar = require('../kodlar');

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
    if ('kz' in b) u.kz = kozm(b.kz, u);
    if ('rz' in b) u.rz = rozet(b.rz, u);
    if ('avatar' in b) img(u, 'avatar', b.avatar);
    if ('banner' in b) img(u, 'banner', b.banner);
    if ('afit' in b) u.afit = fit(b.afit);
    if ('bfit' in b) u.bfit = fit(b.bfit);
    save(); notify(u.username); s.json({ user: me(u) });
  } catch (e) { s.status(400).json({ error: e.message }); }
});
// Dinleme süresi: istemci biriktirdiği saniyeyi gönderir; sunucu, son güncellemeden geçen süreden fazlasını kabul etmez
app.post('/api/me/dinleme', auth, (q, s) => {
  const u = q.me, now = Date.now(), gecen = u.dts ? (now - u.dts) / 1000 : 600, ek = Math.max(0, Math.min(+q.body.s || 0, gecen + 20, 3600));
  u.dsn = (u.dsn || 0) + ek; u.dts = now; save(); s.json({ dsn: Math.floor(u.dsn) });
});
// Bakiye = toplam dinleme - harcanan. Toplam hiç düşmez (rozetler ona bağlı); kozmetik alınca yalnızca harcanan artar.
app.post('/api/me/kozmetik/al', auth, (q, s) => {
  const u = q.me, id = q.body.id;
  if (typeof id != 'string' || !Object.hasOwn(KZ, id)) return s.status(400).json({ error: 'Geçersiz kozmetik' });
  if ((u.kzs || []).includes(id)) return s.status(409).json({ error: 'Bu kozmetiğe zaten sahipsin' });
  const bedel = KZ[id] * 3600;
  if ((u.dsn || 0) - (u.hrc || 0) < bedel) return s.status(402).json({ error: `Yetmiyor: ${KZ[id]} saat gerekiyor` });
  u.hrc = (u.hrc || 0) + bedel; (u.kzs ||= []).push(id); save(); s.json({ user: me(u) });
});
// Kodlar imzalıdır (server/kodlar.js): yönetici üretir, her kurulum kendi veritabanıyla doğrular; her kod bir sunucuda bir kez kullanılır.
app.post('/api/admin/kod', auth, (q, s) => {
  if (!isAdmin(q.me)) return s.status(403).json({ error: 'Yalnızca yönetici' });
  if (!q.me.ask) return s.status(403).json({ error: 'Kod üretmek için yönetici kodunu "Kod gir" alanına bir kez yaz' });
  const { kz, saat } = q.body, gun = Math.min(Math.max(+q.body.gun || 7, 1), 365), o = { gun };
  if (kz) { if (!Object.hasOwn(KZ, kz)) return s.status(400).json({ error: 'Geçersiz kozmetik' }); o.kz = kz; }
  else if (+saat > 0 && +saat <= 10000) o.saat = Math.floor(+saat);
  else return s.status(400).json({ error: 'Kozmetik ya da saat ver' });
  s.json({ kod: kodlar.uret(Buffer.from(q.me.ask, 'hex'), o), gun });
});
app.post('/api/me/kod', auth, (q, s) => {
  if (limit('k' + q.ip, 10, 6e4)) return s.status(429).json({ error: 'Çok fazla deneme, biraz bekle' });
  const u = q.me, ham = String(q.body.kod || '').trim(), uyg = k => {
    if (k.kz) { if (!(u.kzs ||= []).includes(k.kz)) u.kzs.push(k.kz); } else u.dsn = (u.dsn || 0) + k.saat * 3600;
    save(); s.json({ user: me(u), mesaj: k.kz ? 'Kozmetik açıldı' : `${k.saat} saat eklendi` });
  };
  const imzali = kodlar.coz(ham);
  if (imzali) {
    if (imzali.exp < Date.now()) return s.status(410).json({ error: 'Kodun süresi dolmuş' });
    if ((db.kullanilan ||= {})[imzali.n]) return s.status(409).json({ error: 'Bu kod zaten kullanılmış' });
    db.kullanilan[imzali.n] = Date.now(); return uyg(imzali);
  }
  const eski = (db.kodlar || {})[ham.toUpperCase()]; // eski sürümde üretilmiş, bu sunucuya özel kodlar
  if (eski) { delete db.kodlar[ham.toUpperCase()]; return uyg(eski); }
  // Yönetici kodu: doğruysa hesap yönetici olur ve kod üretmek için özel anahtar bu hesaba kaydedilir (dışarı verilmez)
  if (ham.length >= 8 && ham.length <= 64) {
    const seed = kodlar.tohum(ham), eslesen = kodlar.genelDen(ham).export({ format: 'der', type: 'spki' });
    if (kodlar.eslesir(eslesen)) { u.admin = true; u.ask = seed.toString('hex'); save(); return s.json({ user: me(u), mesaj: 'Yönetici oldun' }); }
  }
  s.status(404).json({ error: ham.startsWith('YK1-') ? 'Kod geçersiz (eksik ya da değiştirilmiş kopyalanmış olabilir)' : 'Kod geçersiz ya da kullanılmış' });
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
