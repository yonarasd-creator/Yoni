// Küçük JSON veritabanı: bellekte tutulur, gecikmeli ve atomik (önce .tmp, sonra yeniden adlandırma) diske yazılır.
const path = require('path'), fs = require('fs');
const DATA = process.env.DATA_DIR || path.join(__dirname, '..', 'data'), UP = path.join(DATA, 'uploads');
fs.mkdirSync(UP, { recursive: true });

const DBF = path.join(DATA, 'db.json');
let db = { users: {}, sessions: {}, friends: {}, msgs: {}, reads: {}, seq: 1 };
try { db = { ...db, ...JSON.parse(fs.readFileSync(DBF, 'utf8')) }; } catch {}
for (const [t, s] of Object.entries(db.sessions)) if (s.exp < Date.now()) delete db.sessions[t];
let tm = null;
const flush = () => { clearTimeout(tm); tm = null; const f = DBF + '.tmp'; fs.writeFileSync(f, JSON.stringify(db)); fs.renameSync(f, DBF); };
const save = () => { if (!tm) tm = setTimeout(flush, 400); };
['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => { flush(); process.exit(0); }));

module.exports = { DATA, UP, db, save, flush };
