// Statik denetimler (harici paket gerekmez): npm run test:static
const fs = require('fs'), path = require('path');
const R = p => path.join(__dirname, '..', p), rd = p => fs.readFileSync(R(p), 'utf8');
let ok = 0, bad = 0; const t = (n, c, d) => { c ? ok++ : bad++; console.log((c ? '✓ ' : '✗ ') + n + (!c && d ? '\n    ' + d : '')); };

// 1) Güncelleme kaynağı doğru depo
const pk = JSON.parse(rd('package.json')), pub = pk.build.publish;
t('güncelleme deposu yonarasd-creator/Yoni', pub.provider == 'github' && pub.owner == 'yonarasd-creator' && pub.repo == 'Yoni', JSON.stringify(pub));
t('depoda eski "Muzium" adı kalmadı (yapılandırma dosyaları)', !/muzium/i.test(rd('package.json') + rd('electron/main.js') + rd('public/js/guncelleme.js') + rd('.github/workflows/build.yml')));

// 2) Çevrimdışı önbellek: index.html'deki her betik/stil sw.js FILES içinde
const idx = rd('public/index.html'), sw = rd('public/sw.js');
const refs = [...idx.matchAll(/(?:src|href)="([^"#?]+\.(?:js|css|webmanifest|png))"/g)].map(m => m[1]).filter(x => !/^https?:/.test(x));
const eksik = refs.filter(x => !sw.includes(`'${x}'`));
t('index.html dosyalarının tümü service worker listesinde', !eksik.length, 'eksik: ' + eksik.join(', '));
t('service worker listesindeki yerel dosyalar diskte var', (() => { const m = sw.match(/FILES=\[([^\]]*)\]/s)[1].match(/'([^']+)'/g).map(x => x.slice(1, -1)).filter(x => x != './'); return m.every(f => fs.existsSync(R('public/' + f))); })());

// 3) XSS taraması: kullanıcıdan gelebilecek alanlar şablon içinde esc() olmadan basılmasın
const RISK = /\b(?:\w+)\.(title|artist|name|display|bio|status|text|username|src|album)\b/;
const IZIN = [/^o\.title$/]; // koddan gelen sabit başlık
const dosyalar = [...fs.readdirSync(R('public/js')).map(f => 'public/js/' + f), 'public/kedi.js', 'public/anma.js'];
const bulgu = [];
for (const f of dosyalar) rd(f).split('\n').forEach((l, i) => {
  if (!/\$\{/.test(l) || /textContent|\.log\(|toast\(|log&&log|log\(`|console\.|const qq=/.test(l) || /^\s*\/\//.test(l)) return;
  for (const m of l.matchAll(/\$\{((?:[^{}]|\{[^{}]*\})*)\}/g)) {
    const e = m[1].trim(); if (IZIN.some(r => r.test(e))) continue;
    const koru = e.replace(/esc\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/[\w.?]+\s*\?(?=[^.?])/g, m => RISK.test(m) ? '' : m); // koşul testleri ve dizin okumaları değer basmaz
    if (RISK.test(koru) && !/^(?:[\w.]+\.length|encodeURIComponent)/.test(e)) bulgu.push(`${f}:${i + 1}: \${${e.slice(0, 70)}}`);
  }
});
t('kullanıcı metinleri HTML şablonlarında kaçışlanıyor', !bulgu.length, bulgu.join('\n    '));

console.log(`\n${ok} başarılı, ${bad} başarısız`); process.exit(bad ? 1 : 0);
