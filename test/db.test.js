// Veritabanı dayanıklılık testi: npm run test:db  (harici paket gerektirmez)
const { spawnSync, spawn } = require('child_process'), path = require('path'), os = require('os'), fs = require('fs');
const DEPO = path.join(__dirname, '../server/depo.js');
let ok = 0, bad = 0; const t = (n, c) => { c ? ok++ : bad++; console.log((c ? '✓ ' : '✗ ') + n); };
const yeni = () => fs.mkdtempSync(path.join(os.tmpdir(), 'yoni-db-'));
const run = (dir, kod) => spawnSync(process.execPath, ['-e', `const d=require(${JSON.stringify(DEPO)});${kod}`], { env: { ...process.env, DATA_DIR: dir }, encoding: 'utf8' });
const oku = (dir, f = 'db.json') => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

// 1) Normal yazma + yedek zinciri
let d = yeni();
let r = run(d, `d.db.users.a={n:1};d.flush();d.db.users.b={n:2};d.flush();`);
t('yazma başarılı', r.status == 0 && oku(d).users.b.n == 2);
t('önceki hâl .bak olarak saklandı', oku(d, 'db.json.bak').users.a && !oku(d, 'db.json.bak').users.b);
t('günlük yedek alındı', fs.readdirSync(path.join(d, 'yedek')).some(f => /^db-\d{4}-\d\d-\d\d\.json$/.test(f)));
t('.tmp artığı kalmadı', !fs.existsSync(path.join(d, 'db.json.tmp')));

// 2) Çok sayıda hızlı save() çağrısı veri kaybettirmez
d = yeni();
r = run(d, `for(let i=0;i<2000;i++){d.db.users['u'+i]={i};d.save()} d.flush();`);
t('2000 ardışık yazma sonrası hepsi duruyor', Object.keys(oku(d).users).length == 2000);

// 3) db.json bozulursa .bak'tan kurtarılır
d = yeni(); run(d, `d.db.users.x={v:1};d.flush();d.db.users.y={v:2};d.flush();`);
fs.writeFileSync(path.join(d, 'db.json'), '{"users": {bozuk');
r = run(d, `console.log(Object.keys(d.db.users).sort().join())`);
t('bozuk db.json yedekten geri yüklendi', r.status == 0 && r.stdout.trim() == 'x' && /yedekten geri yüklendi/.test(r.stderr));

// 4) db.json silinirse yedekten döner
d = yeni(); run(d, `d.db.users.x={v:1};d.flush();d.db.users.y={v:2};d.flush();`);
fs.unlinkSync(path.join(d, 'db.json'));
r = run(d, `console.log(Object.keys(d.db.users).length)`);
t('silinen db.json yedekten geri geldi', r.status == 0 && r.stdout.trim() == '1');

// 5) Her şey bozuksa sessizce boş açılmaz: hata verir, bozuk dosya saklanır
d = yeni(); fs.writeFileSync(path.join(d, 'db.json'), 'çöp');
r = run(d, `console.log('acildi')`);
t('geçerli yedek yoksa sunucu başlamaz', r.status != 0 && !/acildi/.test(r.stdout) && /geçerli yedek bulunamadı/.test(r.stderr));
t('bozuk dosya yedek/ içine kopyalandı ve orijinal silinmedi', fs.readdirSync(path.join(d, 'yedek')).some(f => f.startsWith('bozuk-')) && fs.readFileSync(path.join(d, 'db.json'), 'utf8') == 'çöp');

// 6) Yanlış yapıdaki JSON da bozuk sayılır
d = yeni(); fs.writeFileSync(path.join(d, 'db.json'), '[1,2,3]');
t('dizi gibi yanlış yapı reddedilir', run(d, ``).status != 0);

// 7) İlk kurulum: dosya yoksa boş veritabanı normal
d = yeni(); r = run(d, `console.log(Object.keys(d.db.users).length, d.db.seq)`);
t('ilk kurulumda boş veritabanı açılır', r.status == 0 && r.stdout.trim() == '0 1');

// 8) Aynı klasörü ikinci işlem kullanamaz
d = yeni();
const a = spawn(process.execPath, ['-e', `require(${JSON.stringify(DEPO)});setTimeout(()=>{},4000)`], { env: { ...process.env, DATA_DIR: d } });
setTimeout(() => {
  const b = run(d, `console.log('acildi')`);
  t('ikinci işlem aynı veri klasörünü açamaz', b.status != 0 && /başka bir Yoni işlemi/.test(b.stderr));
  a.kill();
  setTimeout(() => {
    t('işlem kapanınca kilit bırakılır ve yeniden açılabilir', run(d, `console.log('acildi')`).stdout.includes('acildi'));
    console.log(`\n${ok} başarılı, ${bad} başarısız`); process.exit(bad ? 1 : 0);
  }, 500);
}, 700);
