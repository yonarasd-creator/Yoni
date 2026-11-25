// İmzalı (Ed25519) kodlar: yönetici kodu üretir, HER kurulum (kendi veritabanıyla çalışan arkadaşların uygulaması dahil) doğrular.
// Genel anahtar depoda durur; özel anahtar yalnızca yönetici kodunu bilenin sunucusunda (kullanıcı kaydında) bulunur.
const crypto = require('crypto');
const PUB_GOMULU = 'MCowBQYDK2VwAyEAVLMfuOh47FuIiXxQFXAROtf7+2zORVwp6nrNkPoSBs4=';
const PKCS8 = Buffer.from('302e020100300506032b657004220420', 'hex');
const tohum = kod => crypto.scryptSync(String(kod).trim().toUpperCase(), 'yoni-admin-v1', 32);
const ozel = seed => crypto.createPrivateKey({ key: Buffer.concat([PKCS8, seed]), format: 'der', type: 'pkcs8' });
const genelDen = kod => crypto.createPublicKey(ozel(tohum(kod)));
const genel = () => process.env.YONI_ADMIN_KODU ? genelDen(process.env.YONI_ADMIN_KODU) : crypto.createPublicKey({ key: Buffer.from(PUB_GOMULU, 'base64'), format: 'der', type: 'spki' });
const KIMLIK = ['kis', 'kizil', 'gumus', 'ag', 'galaksi', 'boz', 'pence', 'golge', 'sivi']; // sıra değişmemeli
// yük: tip(1) + değer(2) + son kullanma(4, dakika) + rastgele(6); ardından 64 bayt imza
function uret(seed, { kz, saat, gun = 7 }) {
  const y = Buffer.alloc(13); crypto.randomFillSync(y, 7, 6);
  if (kz) { y[0] = 0; y.writeUInt16BE(KIMLIK.indexOf(kz), 1); } else { y[0] = 1; y.writeUInt16BE(saat, 1); }
  y.writeUInt32BE(Math.floor(Date.now() / 6e4 + gun * 1440), 3);
  return 'YK1-' + Buffer.concat([y, crypto.sign(null, y, ozel(seed))]).toString('base64url');
}
function coz(kod) {
  try {
    if (!/^YK1-[A-Za-z0-9_-]{100,110}$/.test(kod)) return null;
    const b = Buffer.from(kod.slice(4), 'base64url'); if (b.length != 77) return null;
    const y = b.subarray(0, 13); if (!crypto.verify(null, y, genel(), b.subarray(13))) return null;
    const exp = y.readUInt32BE(3) * 6e4, v = y.readUInt16BE(1), n = y.subarray(7).toString('hex');
    if (y[0] == 0 && KIMLIK[v]) return { kz: KIMLIK[v], exp, n };
    if (y[0] == 1 && v > 0) return { saat: v, exp, n };
  } catch {}
  return null;
}
const eslesir = der => { const g = genel().export({ format: 'der', type: 'spki' }); return g.length == der.length && crypto.timingSafeEqual(g, der); };
module.exports = { tohum, genelDen, uret, coz, eslesir };
