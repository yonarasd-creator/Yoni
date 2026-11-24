// Canlı durum: çevrimiçi bağlantılar, herkese açık kullanıcı görünümü, WebSocket (anlık mesaj, çevrimiçi durumu, "şu an dinliyor").
const { WebSocketServer } = require('ws');
const { db } = require('./depo');
const { pk, S } = require('./yardimci');
const { userOf } = require('./oturum');
const { isAdmin } = require('./dogrula');
const conns = new Map();
const push = (u, o) => conns.get(u)?.forEach(w => w.readyState == 1 && w.send(JSON.stringify(o)));
const pub = u => ({ username: u.username, display: u.display, bio: u.bio, status: u.status, color: u.color,
  avatar: u.avatar ? `/uploads/${u.avatar}?v=${u.av}` : '', banner: u.banner ? `/uploads/${u.banner}?v=${u.bv}` : '',
  afit: u.afit || null, bfit: u.bfit || null, kz: u.kz || '', dsn: Math.floor(u.dsn || 0), created: u.created, online: conns.has(u.username), np: conns.has(u.username) ? u.np || null : null });
const me = u => ({ ...pub(u), theme: u.theme || null, kzs: u.kzs || [], hrc: Math.floor(u.hrc || 0), adm: isAdmin(u) });
const isFriend = (a, b) => db.friends[pk(a, b)]?.status == 'friends';
const notify = un => { for (const r of Object.values(db.friends)) if (r.status == 'friends' && r.u.includes(un)) push(r.u.find(x => x != un), { type: 'presence', u: pub(db.users[un]) }); };

function attach(server) {
  const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (q, sock, head) => {
  const u = q.url == '/ws' && userOf(q), o = q.headers.origin;
  if (!u || (o && new URL(o).host != q.headers.host)) return sock.destroy();
  wss.handleUpgrade(q, sock, head, w => {
    const un = u.username, first = !conns.has(un); if (first) conns.set(un, new Set());
    conns.get(un).add(w); w.alive = true; if (first) notify(un);
    w.on('pong', () => w.alive = true);
    w.on('message', d => { try { const m = JSON.parse(d); if (m.type == 'np') { u.np = m.np && m.np.title ? { title: S(m.np.title, 100), artist: S(m.np.artist, 80) } : null; notify(un); } } catch {} });
    w.on('close', () => { const set = conns.get(un); set.delete(w); if (!set.size) { conns.delete(un); u.np = null; notify(un); } });
  });
});
setInterval(() => wss.clients.forEach(w => { if (!w.alive) return w.terminate(); w.alive = false; w.ping(); }), 30000).unref();
}

module.exports = { conns, push, pub, me, isFriend, notify, attach };
