// Sosyal: kullanıcı arama, arkadaşlar, mesajlar, okunmamış sayacı.
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const { db, save, UP } = require('../depo');
const { HEX, pk, S, num, fit, hash, limit, cookie } = require('../yardimci');
const { conns, push, pub, me, isFriend, notify } = require('../canli');
const { userOf, auth, startSession } = require('../oturum');
const { theme, img, att, kind, MAXB } = require('../dogrula');

module.exports = (app, express) => {
app.get('/api/users', auth, (q, s) => {
  const t = S(q.query.q, 20).toLowerCase(); if (!t) return s.json({ users: [] });
  s.json({ users: Object.values(db.users).filter(u => u.username.startsWith(t) && u != q.me).slice(0, 8).map(pub) });
});
app.get('/api/users/:u', auth, (q, s) => { const u = db.users[q.params.u.toLowerCase()]; u ? s.json({ user: pub(u) }) : s.status(404).json({ error: 'Kullanıcı bulunamadı' }); });

app.get('/api/friends', auth, (q, s) => {
  const m = q.me.username, f = [], inc = [], out = [];
  for (const r of Object.values(db.friends)) {
    if (!r.u.includes(m)) continue; const o = db.users[r.u.find(x => x != m)]; if (!o) continue;
    r.status == 'friends' ? f.push(pub(o)) : (r.from == m ? out : inc).push(pub(o));
  }
  s.json({ friends: f, incoming: inc, outgoing: out });
});
app.post('/api/friends', auth, (q, s) => { // istek gönder; karşı taraf zaten istemişse kabul et
  const m = q.me.username, o = S(q.body.username, 20).toLowerCase();
  if (!db.users[o] || o == m) return s.status(404).json({ error: 'Kullanıcı bulunamadı' });
  const k = pk(m, o), r = db.friends[k];
  if (!r) db.friends[k] = { u: [m, o], from: m, status: 'pending' }; else if (r.status == 'pending' && r.from == o) r.status = 'friends';
  save(); push(o, { type: 'friend' }); push(m, { type: 'friend' }); s.json({ ok: 1 });
});
app.delete('/api/friends/:u', auth, (q, s) => { const o = q.params.u.toLowerCase(); delete db.friends[pk(q.me.username, o)]; save(); push(o, { type: 'friend' }); push(q.me.username, { type: 'friend' }); s.json({ ok: 1 }); });

app.get('/api/messages/:u', auth, (q, s) => {
  const m = q.me.username, o = q.params.u.toLowerCase();
  if (!isFriend(m, o)) return s.status(403).json({ error: 'Yalnızca arkadaşlarınla yazışabilirsin' });
  const l = db.msgs[pk(m, o)] || [], b = +q.query.before || Infinity;
  if (l.length) { db.reads[m + '|' + o] = l[l.length - 1].id; save(); }
  s.json({ messages: l.filter(x => x.id < b).slice(-50) });
});
app.post('/api/messages/:u', auth, (q, s) => {
  const m = q.me.username, o = q.params.u.toLowerCase();
  if (!isFriend(m, o)) return s.status(403).json({ error: 'Yalnızca arkadaşlarınla yazışabilirsin' });
  if (limit('m' + m, 60, 6e4)) return s.status(429).json({ error: 'Çok hızlı yazıyorsun' });
  const text = S(q.body.text, 2000).trim(), a = att(q.body.att);
  if (!text && !a) return s.status(400).json({ error: 'Boş mesaj veya geçersiz ek' });
  const msg = { id: db.seq++, from: m, to: o, text, att: a, ts: Date.now() }, k = pk(m, o);
  const l = db.msgs[k] || (db.msgs[k] = []); l.push(msg); if (l.length > 2000) l.splice(0, 200);
  save(); push(o, { type: 'msg', m: msg }); push(m, { type: 'msg', m: msg }); s.json({ m: msg });
});
app.get('/api/unread', auth, (q, s) => {
  const m = q.me.username, r = {};
  for (const [k, l] of Object.entries(db.msgs)) {
    const [a, b] = k.split('|'); if (a != m && b != m) continue;
    const o = a == m ? b : a, rd = db.reads[m + '|' + o] || 0, n = l.filter(x => x.from == o && x.id > rd).length; if (n) r[o] = n;
  }
  s.json(r);
});
};
