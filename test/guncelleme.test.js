// Güncelleme denetim sıklığı testi: npm run test:update (harici paket gerekmez)
const { makeDenetim } = require('../electron/denetim');
let ok = 0, bad = 0; const t = (n, c) => { c ? ok++ : bad++; console.log((c ? '✓ ' : '✗ ') + n); };
(async () => {
  let saat = 1e6, n = 0, elle = [];
  const d = makeDenetim(async e => { n++; elle.push(e); await new Promise(r => setTimeout(r, 20)); }, 120000, () => saat);
  t('ilk otomatik denetim çalışır', await d(false) === true && n == 1);
  t('2 dakikadan önce otomatik denetim atlanır', await d(false) === false && n == 1);
  saat += 119000; t('119 sn sonra hâlâ atlanır', await d(false) === false && n == 1);
  saat += 2000; t('121 sn sonra tekrar çalışır', await d(false) === true && n == 2);
  t('elle denetim sınıra takılmaz', await d(true) === true && n == 3 && elle[2] === true);
  const p = d(true), q = d(true); t('aynı anda ikinci denetim başlamaz', (await q) === false && (await p) === true && n == 4);
  const h = makeDenetim(async () => { throw new Error('ağ yok'); }, 1000, () => saat);
  let yakalandi = false; try { await h(true) } catch { yakalandi = true }
  t('hata sonrası kilit açılır', yakalandi && (await makeDenetim(async () => {}, 0, () => saat)(true)) === true);
  console.log(`\n${ok} başarılı, ${bad} başarısız`); process.exit(bad ? 1 : 0);
})();
