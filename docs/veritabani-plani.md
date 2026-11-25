# Veritabanı: JSON'dan SQLite'a geçiş planı

## Şu an (v2.18)
`server/depo.js` tüm veriyi bellekte tutar ve `db.json` dosyasına yazar. Koruma: fsync'li atomik yazma, `.bak` + günlük yedek (son 7), bozuk dosyada yedekten kurtarma, geçerli yedek yoksa açılmayı reddetme, tek işlem kilidi. Testler: `npm run test:db`.

## Ne zaman geçilmeli
- `db.json` ~50 MB'ı geçerse (her yazma tüm dosyayı yeniden yazar, mesajlar en hızlı büyüyen kısımdır),
- ya da aynı anda birden çok sunucu işlemi gerekirse.
Bu uygulamanın ölçeği (arkadaş grubu) için JSON yeterlidir; erken geçiş gerekmez.

## Hedef şema (better-sqlite3, WAL kipi)
`users(username PK, json)`, `sessions(token PK, username, exp)`, `friends(a, b, status)`,
`msgs(id PK, a, b, ts, json)` + `(a,b,ts)` indeksi, `reads(user, peer, last_id)`, `kodlar(kod PK, json)`, `meta(key, value)` (seq vb.).
Kullanıcı alanları (tema, kz, kzs, dsn, hrc…) değişken olduğu için `json` sütununda tutulur; sorgulanan alanlar ayrı sütun olur.

## Adımlar
1. `depo.js` arayüzünü (`db`, `save`, `flush`) koruyan bir `depo-sqlite.js` yaz; route'lar değişmesin.
2. İlk açılışta `db.json` varsa tek işlemde içe aktar, `db.json`'u `db.json.migrated` olarak sakla (silme).
3. Mesajları sayfalı oku (`LIMIT 50`), tüm geçmişi belleğe yükleme.
4. Electron paketi için `better-sqlite3` yerel modülünü `electron-builder` ile yeniden derle (`npmRebuild`), üç işletim sistemi için CI'da denen.
5. Yedek: `VACUUM INTO 'yedek/db-<tarih>.sqlite'` günde bir.
6. `test:db` testlerini SQLite için de çalıştır (bozuk dosya, kilit, yedekten dönüş).
