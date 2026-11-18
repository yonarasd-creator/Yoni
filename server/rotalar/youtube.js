// YouTube hesabını bağlama (Google OAuth, PKCE).
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const { db, save, UP } = require('../depo');
const { HEX, pk, S, num, fit, hash, limit, cookie } = require('../yardimci');
const { conns, push, pub, me, isFriend, notify } = require('../canli');
const { userOf, auth, startSession } = require('../oturum');
const { theme, img, att, kind, MAXB } = require('../dogrula');

module.exports = (app, express) => {
// ---- YouTube hesabını bağlama (Google OAuth, PKCE). Jetonlar sunucuda saklanmaz; yalnızca isteyen cihaza bir kez teslim edilir.
const GCFG = (() => { let f = {}; try { f = require('../google.json'); } catch {} return { cid: process.env.GOOGLE_CLIENT_ID || f.cid || '', sec: process.env.GOOGLE_CLIENT_SECRET || f.sec || '' }; })();
const ytp = new Map();
app.get('/api/yt/config', (q, s) => s.json({ ready: !!GCFG.cid }));
setInterval(() => { const n = Date.now(); for (const [k, v] of ytp) if (v.exp < n) ytp.delete(k); }, 6e4).unref();
const ytPage = (s, ok, msg) => s.type('html').send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Yoni</title><body style="font:16px system-ui;background:#111;color:#f2f2f2;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><div style="font-size:48px">${ok ? '✅' : '⚠️'}</div><p>${msg}</p></div>`);
const gtoken = async o => { const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(o) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error_description || j.error || 'Google hatası'); return j; };
app.post('/api/yt/start', (q, s) => {
  if (limit('ys' + q.ip, 10, 6e4)) return s.status(429).json({ error: 'Çok fazla deneme, biraz bekle' });
  const own = S(q.body.cid, 200).trim(), cid = own || GCFG.cid, sec = own ? S(q.body.sec, 200).trim() : GCFG.sec, ru = S(q.body.ru, 300);
  if (!/^[\w.-]+\.apps\.googleusercontent\.com$/.test(cid)) return s.status(400).json({ error: 'Geçersiz Client ID' });
  if (!/^https?:\/\/[\w.-]+(:\d+)?\/api\/yt\/callback$/.test(ru)) return s.status(400).json({ error: 'Geçersiz yönlendirme adresi' });
  const state = crypto.randomBytes(24).toString('hex'), ver = crypto.randomBytes(32).toString('base64url');
  ytp.set(state, { cid, sec, ver, ru, exp: Date.now() + 6e5 });
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: cid, redirect_uri: ru, response_type: 'code', scope: 'https://www.googleapis.com/auth/youtube.readonly', access_type: 'offline', prompt: 'consent', state, code_challenge: crypto.createHash('sha256').update(ver).digest('base64url'), code_challenge_method: 'S256' });
  s.json({ url, state });
});
app.get('/api/yt/callback', async (q, s) => {
  const p = ytp.get(String(q.query.state || ''));
  if (!p) return ytPage(s, false, 'Bu bağlantının süresi dolmuş. Uygulamadan tekrar dene.');
  if (q.query.error || !q.query.code) { p.err = 'Google izni verilmedi'; return ytPage(s, false, 'İzin verilmedi. Uygulamaya dönüp tekrar deneyebilirsin.'); }
  try {
    const j = await gtoken({ code: String(q.query.code), client_id: p.cid, ...(p.sec ? { client_secret: p.sec } : {}), redirect_uri: p.ru, grant_type: 'authorization_code', code_verifier: p.ver });
    p.tokens = { access_token: j.access_token, refresh_token: j.refresh_token || '', expires_in: j.expires_in || 3600 };
    ytPage(s, true, 'YouTube hesabın bağlandı. Bu sekmeyi kapatıp Yoni\'ye dönebilirsin.');
  } catch (e) { p.err = e.message; ytPage(s, false, 'Bağlanamadı. Uygulamaya dönüp hata mesajına bak.'); }
});
app.post('/api/yt/poll', (q, s) => {
  const st = String(q.body.state || ''), p = ytp.get(st);
  if (!p) return s.status(404).json({ error: 'Süre doldu, tekrar dene' });
  if (p.err) { ytp.delete(st); return s.status(400).json({ error: p.err }); }
  if (!p.tokens) return s.json({ wait: true });
  ytp.delete(st); s.json(p.tokens);
});
app.post('/api/yt/refresh', async (q, s) => {
  if (limit('yr' + q.ip, 30, 6e4)) return s.status(429).json({ error: 'Çok fazla deneme' });
  try {
    const own = S(q.body.cid, 200), j = await gtoken({ client_id: own || GCFG.cid, ...((own ? q.body.sec : GCFG.sec) ? { client_secret: own ? S(q.body.sec, 200) : GCFG.sec } : {}), refresh_token: S(q.body.rt, 500), grant_type: 'refresh_token' });
    s.json({ access_token: j.access_token, expires_in: j.expires_in || 3600 });
  } catch (e) { s.status(400).json({ error: e.message }); }
});
};
