// İmzalı kod testi: npm run test:kod (harici paket gerekmez)
process.env.YONI_ADMIN_KODU = 'TEST-KODU-1';
const k = require('../server/kodlar'), crypto = require('crypto');
let ok = 0, bad = 0; const t = (n, c) => { c ? ok++ : bad++; console.log((c ? '✓ ' : '✗ ') + n); };
const seed = k.tohum('test-kodu-1');
const a = k.uret(seed, { kz: 'galaksi' }), b = k.uret(seed, { saat: 25, gun: 3 });
t('kozmetik kodu çözülür', k.coz(a)?.kz == 'galaksi');
t('saat kodu çözülür', k.coz(b)?.saat == 25);
t('kod sunucudan bağımsız doğrulanır (aynı çağrı tekrar)', !!k.coz(a));
t('süre bilgisi gelecekte', k.coz(b).exp > Date.now() + 2 * 864e5 && k.coz(b).exp < Date.now() + 4 * 864e5);
t('her kodun nonce\'u farklı', k.coz(a).n != k.coz(k.uret(seed, { kz: 'galaksi' })).n);
const boz = a.slice(0, 20) + (a[20] == 'A' ? 'B' : 'A') + a.slice(21);
t('değiştirilmiş kod reddedilir', k.coz(boz) === null);
t('kesik kod reddedilir', k.coz(a.slice(0, -5)) === null);
t('başka anahtarla imzalı kod reddedilir', k.coz(k.uret(k.tohum('BASKA-KOD-99'), { saat: 500 })) === null);
t('rastgele metin reddedilir', k.coz('YK1-' + 'A'.repeat(103)) === null && k.coz('ABC') === null);
t('yönetici kodu eşleşir, yanlışı eşleşmez', k.eslesir(k.genelDen('TEST-KODU-1').export({ format: 'der', type: 'spki' })) && !k.eslesir(k.genelDen('YANLIS-KOD-1').export({ format: 'der', type: 'spki' })));
console.log(`\n${ok} başarılı, ${bad} başarısız`); process.exit(bad ? 1 : 0);
