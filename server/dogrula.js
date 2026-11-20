// Gelen verinin doğrulanması: tema, profil görseli, şarkı eki, yüklenen dosyanın türü (sihirli baytlar).
const path = require('path'), fs = require('fs');
const { UP } = require('./depo');
const { HEX, S, num } = require('./yardimci');
const theme = t => {
  if (t === null) return null; if (typeof t != 'object') throw new Error('Geçersiz tema');
  const o = {}; for (const k of ['a', 'c', 's', 'x']) if (HEX.test(t[k])) o[k] = t[k];
  o.r = num(t.r, 0, 28, 12); o.fs = num(t.fs, 13, 19, 15); o.dim = num(t.dim, 0, 80, 30); o.op = num(t.op, 30, 100, 80); o.bl = num(t.bl, 0, 20, 0);
  o.m = ['image', 'video'].includes(t.m) ? t.m : ''; o.p = !!t.p; o.lg = typeof t.lg == 'string' && /^[a-z0-9-]{1,30}$/.test(t.lg) ? t.lg : 'varsayilan';
  o.fx = ['kar', 'kor'].includes(t.fx) ? t.fx : '';
  o.kd = t.kd !== false; o.kl = Array.isArray(t.kl) ? [...new Set(t.kl.filter(x => typeof x == 'string' && /^[a-z]{2,12}$/.test(x)))].slice(0, 3) : ['zencefil']; return o;
};
const img = (u, k, d) => {
  const v = k == 'avatar' ? 'av' : 'bv';
  if (d === '') { if (u[k]) fs.rmSync(path.join(UP, u[k]), { force: true }); u[k] = ''; return; }
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(typeof d == 'string' ? d : '');
  if (!m) throw new Error('Geçersiz görsel');
  const b = Buffer.from(m[2], 'base64'); if (b.length > 300e3) throw new Error('Görsel çok büyük (en fazla 300 KB)');
  const f = `${k}-${u.username}.${m[1] == 'jpeg' ? 'jpg' : m[1]}`;
  if (u[k] && u[k] != f) fs.rmSync(path.join(UP, u[k]), { force: true });
  fs.writeFileSync(path.join(UP, f), b); u[k] = f; u[v] = Date.now();
};
const att = a => { // yalnızca doğrulanmış şarkı eki
  const t = a && a.type == 'track' && a.track; if (!t) return null;
  const ok = v => !v || /^https:\/\//.test(v), aid = String(t.aid || '');
  if (!ok(t.art) || !ok(t.url) || !/^[A-Za-z0-9]{0,40}$/.test(aid) || (!t.url && !aid)) return null;
  return { type: 'track', track: { id: S(t.id, 200), title: S(t.title, 150), artist: S(t.artist, 100), art: S(t.art, 400), url: S(t.url, 600), aid, src: S(t.src, 20) } };
};
// Hareketli profil fotoğrafı (GIF / hareketli WebP) ve videolu kapak (MP4 / WebM): ham dosya yüklenir, tür sihirli baytlardan doğrulanır
const kind = b => {
  if (b.length < 12) return null;
  if (b.toString('latin1', 0, 4) == 'GIF8') return ['gif', 'image'];
  if (b[0] == 0x89 && b.toString('latin1', 1, 4) == 'PNG') return ['png', 'image'];
  if (b[0] == 0xff && b[1] == 0xd8 && b[2] == 0xff) return ['jpg', 'image'];
  if (b.toString('latin1', 0, 4) == 'RIFF' && b.toString('latin1', 8, 12) == 'WEBP') return ['webp', 'image'];
  if (b.toString('latin1', 4, 8) == 'ftyp') return ['mp4', 'video'];
  if (b[0] == 0x1a && b[1] == 0x45 && b[2] == 0xdf && b[3] == 0xa3) return ['webm', 'video'];
  return null;
};
const MAXB = { avatar: { image: 120e6, video: 0 }, banner: { image: 40e6, video: 40e6 } };

module.exports = { theme, img, att, kind, MAXB };
