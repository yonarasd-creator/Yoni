// Yoni sunucusu: hesaplar, profiller, arkadaşlar, mesajlar (WebSocket ile anlık). Bağımlılık: express + ws. Modüller: depo, yardimci, oturum, dogrula, canli, rotalar/*
const express = require('express'), http = require('http'), path = require('path'), os = require('os');
const { UP } = require('./depo');
const { attach } = require('./canli');
const PORT = +process.env.PORT || 3000;

// ---- Uygulama
const app = express(); app.disable('x-powered-by'); if (process.env.TRUST_PROXY) app.set('trust proxy', 1);
app.use(express.json({ limit: '450kb' }));
app.use((q, s, n) => { s.setHeader('X-Content-Type-Options', 'nosniff'); n(); });

require('./rotalar/hesap')(app, express);
require('./rotalar/youtube')(app, express);
require('./rotalar/sosyal')(app, express);

app.use('/uploads', express.static(UP, { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use((e, q, s, n) => s.status(e.status || 500).json({ error: e.status == 413 ? 'İçerik çok büyük' : 'Sunucu hatası' }));

// ---- WebSocket
const server = http.createServer(app);
attach(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Yoni çalışıyor → http://localhost:${PORT}`);
  for (const l of Object.values(os.networkInterfaces()).flat()) if (l.family == 'IPv4' && !l.internal) console.log(`Aynı ağdaki telefon/bilgisayar için → http://${l.address}:${PORT}`);
});
