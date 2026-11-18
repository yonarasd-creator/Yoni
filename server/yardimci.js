// Saf yardımcılar: doğrulama, parola türetme, istek sınırlama, çerez ayrıştırma.
const crypto = require('crypto');
const HEX = /^#[0-9a-fA-F]{6}$/, pk = (a, b) => [a, b].sort().join('|');
const S = (v, n) => typeof v == 'string' ? v.slice(0, n) : '';
const num = (v, a, b, d) => Number.isFinite(+v) ? Math.min(b, Math.max(a, +v)) : d;
const fit = v => Array.isArray(v) && v.length == 3 ? [num(v[0], 0, 100, 50), num(v[1], 0, 100, 50), num(v[2], 1, 4, 1)] : null;
const hash = (pw, salt) => new Promise((ok, no) => crypto.scrypt(pw, salt, 64, (e, k) => e ? no(e) : ok(k.toString('hex'))));
const hits = new Map();
const limit = (k, max, ms) => { const n = Date.now(), h = (hits.get(k) || []).filter(t => n - t < ms); h.push(n); hits.set(k, h); return h.length > max; };
setInterval(() => hits.clear(), 600000).unref();
const cookie = r => Object.fromEntries((r.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(x => x[0]).map(([k, ...v]) => [k, v.join('=')]));

module.exports = { HEX, pk, S, num, fit, hash, limit, cookie };
