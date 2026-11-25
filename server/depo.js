// Küçük JSON veritabanı: bellekte tutulur, gecikmeli ve güvenli (önce .tmp + fsync, sonra yeniden adlandırma) diske yazılır.
// Koruma katmanları:
//  1) Yazmadan önce mevcut dosya db.json.bak olarak saklanır; günde en çok bir kez yedek/ klasörüne tarihli kopya alınır (son 7 tutulur).
//  2) db.json okunamazsa sırayla .bak ve yedek/ denenir. Hiçbiri okunamazsa bozuk dosya yedek/ içine kopyalanır
//     ve sunucu BAŞLAMAZ (boş veritabanıyla açılıp eski veriyi ezmek yerine açık bir hata verir).
//  3) Aynı veri klasörünü iki işlem birden kullanamaz (db.lock).
const path = require('path'), fs = require('fs');
const DATA = process.env.DATA_DIR || path.join(__dirname, '..', 'data'), UP = path.join(DATA, 'uploads'), YEDEK = path.join(DATA, 'yedek');
fs.mkdirSync(UP, { recursive: true }); fs.mkdirSync(YEDEK, { recursive: true });

const DBF = path.join(DATA, 'db.json'), BAK = DBF + '.bak', LOCK = path.join(DATA, 'db.lock'), KEEP = 7;
const bos = () => ({ users: {}, sessions: {}, friends: {}, msgs: {}, reads: {}, seq: 1 });

// --- Kilit: aynı klasöre ikinci bir sunucu yazmasın
const canli = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code == 'EPERM'; } };
let eski = 0; try { eski = +fs.readFileSync(LOCK, 'utf8'); } catch {}
if (eski && eski != process.pid && canli(eski)) throw new Error(`Veri klasörü başka bir Yoni işlemi (PID ${eski}) tarafından kullanılıyor: ${DATA}`);
fs.writeFileSync(LOCK, String(process.pid));
const unlock = () => { try { if (+fs.readFileSync(LOCK, 'utf8') == process.pid) fs.unlinkSync(LOCK); } catch {} };

// --- Okuma ve doğrulama
const gecerli = o => o && typeof o == 'object' && !Array.isArray(o) && o.users && typeof o.users == 'object' && !Array.isArray(o.users);
const oku = f => { const o = JSON.parse(fs.readFileSync(f, 'utf8')); if (!gecerli(o)) throw new Error('Beklenmeyen veritabanı yapısı'); return o; };
const yedekler = () => { try { return fs.readdirSync(YEDEK).filter(f => /^db-\d{4}-\d\d-\d\d\.json$/.test(f)).sort().reverse(); } catch { return []; } };

function yukle() {
  if (!fs.existsSync(DBF)) {
    // Dosya hiç yoksa: yedek varsa ondan kurtar (dosya silinmiş olabilir), yoksa ilk kurulum.
    for (const f of [BAK, ...yedekler().map(x => path.join(YEDEK, x))]) { try { const o = oku(f); console.warn('db.json yoktu, yedekten geri yüklendi: ' + path.basename(f)); return o; } catch {} }
    return bos();
  }
  const adaylar = [DBF, BAK, ...yedekler().map(x => path.join(YEDEK, x))], hatalar = [];
  for (const f of adaylar) {
    try { const o = oku(f); if (f != DBF) console.warn('db.json okunamadı, yedekten geri yüklendi: ' + path.basename(f)); return o; }
    catch (e) { hatalar.push(path.basename(f) + ': ' + e.message); }
  }
  const kopya = path.join(YEDEK, 'bozuk-' + Date.now() + '.json');
  try { fs.copyFileSync(DBF, kopya); } catch {}
  unlock();
  throw new Error('Veritabanı okunamadı ve geçerli yedek bulunamadı. Bozuk dosya ' + kopya + ' olarak saklandı; hiçbir veri silinmedi. Ayrıntı: ' + hatalar.join(' | '));
}

let db = { ...bos(), ...yukle() };
for (const [t, s] of Object.entries(db.sessions)) if (s.exp < Date.now()) delete db.sessions[t];

// --- Yazma
let tm = null, sonYedek = '';
const gunlukYedek = () => {
  const g = new Date().toISOString().slice(0, 10); if (g == sonYedek) return; sonYedek = g;
  try { fs.copyFileSync(DBF, path.join(YEDEK, `db-${g}.json`)); yedekler().slice(KEEP).forEach(f => fs.unlinkSync(path.join(YEDEK, f))); } catch {}
};
const flush = () => {
  clearTimeout(tm); tm = null;
  const f = DBF + '.tmp', veri = JSON.stringify(db);
  const fd = fs.openSync(f, 'w'); try { fs.writeSync(fd, veri); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  if (fs.existsSync(DBF)) { try { fs.copyFileSync(DBF, BAK); } catch {} gunlukYedek(); }
  fs.renameSync(f, DBF);
};
const save = () => { if (!tm) tm = setTimeout(() => { try { flush(); } catch (e) { console.error('Veritabanı yazılamadı:', e.message); tm = null; save(); } }, 400); };
const kapat = () => { try { flush(); } catch (e) { console.error('Son yazma başarısız:', e.message); } unlock(); };
['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => { kapat(); process.exit(0); }));
process.on('exit', unlock);
process.on('uncaughtException', e => { console.error(e); kapat(); process.exit(1); });

// Elle yedek almak için (ör. yönetici arayüzü / betik): şu anki hali tarihli dosyaya yazar
const yedekAl = () => { flush(); const f = path.join(YEDEK, 'elle-' + Date.now() + '.json'); fs.copyFileSync(DBF, f); return f; };

module.exports = { DATA, UP, YEDEK, db, save, flush, yedekAl };
