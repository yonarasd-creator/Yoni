// Yoni masaüstü uygulaması: sunucuyu içinde başlatır, sistem tepsisinde yaşar, genel kısayollar sunar.
const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, nativeImage, shell, dialog, net, powerMonitor } = require('electron');
const { makeDenetim } = require('./denetim');
const path = require('path'), http = require('http'), fs = require('fs');
const PORT = +process.env.MUZIGIM_PORT || 38123, REMOTE = process.env.MUZIGIM_URL; // MUZIGIM_URL: başka bir sunucuya bağlan
const BASE = REMOTE || `http://localhost:${PORT}`, ICON = path.join(__dirname, 'icon.png');
let win, tray, quitting = false, manualCheck = false;
let autoUpdater = null; // yalnızca kurulu (paketlenmiş) uygulamada çalışır; geliştirmede (npm run app) devre dışı
if (app.isPackaged) { try { ({ autoUpdater } = require('electron-updater')); } catch (e) { console.error('Güncelleyici yüklenemedi:', e.message); } }
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.exit(0); // zaten açıksa ikinci kopya hemen kapanır (sunucuyu tekrar başlatmaz)

const run = js => win && !win.isDestroyed() && win.webContents.executeJavaScript(js, true).catch(() => {});
const showMain = () => { if (!win) return; win.show(); win.focus(); };

function startServer() {
  if (REMOTE) return Promise.resolve();
  process.env.PORT = String(PORT);
  process.env.DATA_DIR = path.join(app.getPath('userData'), 'data'); // veriler kullanıcı klasöründe kalır
  require('../server/index.js');
  return new Promise((ok, no) => {
    const t0 = Date.now(), ping = () => http.get(BASE + '/api/me', r => { r.resume(); ok(); })
      .on('error', () => Date.now() - t0 > 10000 ? no(new Error('Sunucu başlatılamadı (port ' + PORT + ' dolu olabilir)')) : setTimeout(ping, 200));
    ping();
  });
}

// Windows kısayolları (.lnk) .ico ister: PNG'yi 256px PNG-içeren ICO'ya çevirip masaüstü/başlat/görev çubuğu kısayollarını günceller
function makeIco(img) {
  const png = img.resize({ width: 256, height: 256, quality: 'best' }).toPNG(), h = Buffer.alloc(22);
  h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4); h.writeUInt16LE(1, 10); h.writeUInt16LE(32, 12); h.writeUInt32LE(png.length, 14); h.writeUInt32LE(22, 18);
  return Buffer.concat([h, png]);
}
function updateShortcuts(img) {
  if (process.platform !== 'win32') return;
  try {
    const dir = path.join(app.getPath('userData'), 'icons'); fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) try { fs.unlinkSync(path.join(dir, f)); } catch {}
    const ico = path.join(dir, 'app-' + Date.now() + '.ico'); fs.writeFileSync(ico, makeIco(img)); // her seferinde yeni ad: Windows önbelleği eskiyi tutmasın
    const ad = app.getPath('appData'), me = process.execPath.toLowerCase();
    const dirs = [app.getPath('desktop'), path.join(ad, 'Microsoft/Windows/Start Menu/Programs'),
      path.join(ad, 'Microsoft/Internet Explorer/Quick Launch/User Pinned/TaskBar')];
    for (const d of dirs) {
      let files = []; try { files = fs.readdirSync(d).filter(f => f.toLowerCase().endsWith('.lnk')); } catch {}
      for (const f of files) { // adına değil, bu uygulamayı açan kısayollara bakar (ad ne olursa olsun)
        const p = path.join(d, f);
        try { const t = shell.readShortcutLink(p); if (t.target && t.target.toLowerCase() === me) shell.writeShortcutLink(p, 'update', { icon: ico, iconIndex: 0 }); } catch {}
      }
    }
    require('child_process').execFile('ie4uinit.exe', ['-show'], () => {}); // simge önbelleğini yenile
  } catch (e) { console.error('Kısayol simgesi güncellenemedi:', e.message); }
}

// Uygulamada seçilen logo (sayfanın favicon'u) pencere/görev çubuğu ve tepsi simgesine de uygulanır
function applyAppIcon(url) {
  net.fetch(url).then(r => r.ok ? r.arrayBuffer() : null).then(b => {
    if (!b) return;
    const img = nativeImage.createFromBuffer(Buffer.from(b));
    if (img.isEmpty()) return;
    if (win && !win.isDestroyed()) win.setIcon(img);
    if (tray && !tray.isDestroyed()) tray.setImage(img.resize({ width: 18, height: 18 }));
    updateShortcuts(img);
  }).catch(() => {});
}

// Mini oynatıcının konumu: varsayılan sol üst; sürüklenince hatırlanır (ekran dışına taşmışsa sıfırlanır)
const MINI_FILE = () => path.join(app.getPath('userData'), 'mini-konum.json');
function miniPos() {
  const { screen } = require('electron'); let p = { x: 12, y: 12 };
  try { const j = JSON.parse(fs.readFileSync(MINI_FILE(), 'utf8')); if (Number.isFinite(j.x) && Number.isFinite(j.y) &&
    screen.getAllDisplays().some(d => j.x >= d.bounds.x - 100 && j.x < d.bounds.x + d.bounds.width - 100 && j.y >= d.bounds.y && j.y < d.bounds.y + d.bounds.height - 40)) p = { x: j.x, y: j.y }; } catch {}
  return p;
}
function saveMiniPos(b) { try { fs.writeFileSync(MINI_FILE(), JSON.stringify({ x: b.x, y: b.y })); } catch {} }

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 900, minHeight: 600, backgroundColor: '#111', autoHideMenuBar: true, icon: ICON,
    webPreferences: { backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required', contextIsolation: true, preload: path.join(__dirname, 'onyukle.js') }
  });
  win.webContents.on('page-favicon-updated', (_e, favs) => { if (favs && favs[0]) applyAppIcon(favs[0]); });
  win.loadURL(BASE);
  win.on('close', e => { if (!quitting) { e.preventDefault(); win.hide(); } }); // kapatınca tepsiye iner, müzik sürer
  win.webContents.setWindowOpenHandler(({ url, frameName }) => {
    if (frameName === 'muzigim-mini') { const pos = miniPos(); return { action: 'allow', overrideBrowserWindowOptions: {
      width: 360, height: 132, x: pos.x, y: pos.y, frame: false, resizable: false, transparent: false, alwaysOnTop: true, skipTaskbar: true,
      focusable: false, // oyun/uygulama odağını çalmaz, Alt+Tab'ı bozmaz; fare ve genel kısayollar çalışır
      show: false, autoHideMenuBar: true, backgroundColor: '#17171a', title: 'Yoni', roundedCorners: true } }; }
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('did-create-window', w => { // mini pencere oyunların/uygulamaların üstünde kalsın
    const top = () => { if (w.isDestroyed()) return; w.setAlwaysOnTop(true, 'screen-saver'); w.moveTop(); };
    w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); w.showInactive(); top();
    const keep = setInterval(top, 2500); // oyunlar üste çıkarsa tekrar öne al
    let t; w.on('moved', () => { clearTimeout(t); t = setTimeout(() => { if (!w.isDestroyed()) saveMiniPos(w.getBounds()); }, 400); });
    w.on('closed', () => clearInterval(keep));
  });
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 18, height: 18 }));
  tray.setToolTip('Yoni');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Yoni’yi göster', click: showMain },
    { label: 'Mini oynatıcı (Ctrl+Alt+M)', click: () => run('openMini()') },
    { label: 'Güncellemeleri denetle', click: () => checkUpdates(true) },
    { type: 'separator' }, { label: 'Çık', click: () => app.quit() }]));
  tray.on('click', showMain);
}

// --- Otomatik güncelleme: GitHub Releases'e bakar, yeni sürümü indirir, kullanıcıya sorar ---
function checkUpdates(manual) {
  if (!autoUpdater) { if (manual) dialog.showMessageBox({ message: 'Güncelleme yalnızca kurulu uygulamada çalışır.' }); return; }
  // Yeni sürüm zaten iniyor/hazırsa tekrar denetleme (otomatik denetimlerde)
  if (!manual && upState && (upState.durum == 'iniyor' || upState.durum == 'hazir')) return Promise.resolve();
  manualCheck = !!manual;
  return autoUpdater.checkForUpdates().catch(e => { if (manual) dialog.showErrorBox('Güncelleme denetlenemedi', String(e.message || e)); });
}
const denetle = makeDenetim(checkUpdates, 2 * 60 * 1000); // otomatik denetimler en sık 2 dakikada bir
let upState = null;
function send(d) { upState = d; try { if (win && !win.isDestroyed()) win.webContents.send('guncelleme', d); } catch {} }
ipcMain.handle('guncelleme-durum', () => upState);
ipcMain.handle('guncelleme-denetle', () => denetle(true));
ipcMain.handle('guncelleme-kur', () => { if (autoUpdater && upState && upState.durum == 'hazir') { quitting = true; autoUpdater.quitAndInstall(); } });
function setupUpdater() {
  if (!autoUpdater) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true; // sorulmasa bile çıkarken kurulur
  autoUpdater.on('update-available', i => { send({ durum: 'iniyor', surum: i.version }); if (manualCheck) dialog.showMessageBox({ message: `Yeni sürüm bulundu (${i.version}), indiriliyor…` }); });
  autoUpdater.on('update-not-available', () => { if (manualCheck) dialog.showMessageBox({ message: 'Yoni güncel (' + app.getVersion() + ').' }); manualCheck = false; });
  autoUpdater.on('error', e => { console.error('Güncelleme hatası:', e && e.message); });
  autoUpdater.on('update-downloaded', i => { send({ durum: 'hazir', surum: i.version }); }); // bildirim arayüzde (sağ üst + kedi); tıklayınca kurulur, tıklanmazsa çıkarken kurulur
  // Yeni sürüm yayınlanınca uygulama açıksa da fark etsin: açılışta, her 10 dakikada, pencere öne gelince ve bilgisayar uykudan dönünce denetle
  setTimeout(() => denetle(false), 5000);
  setInterval(() => denetle(false), 10 * 60 * 1000);
  if (win) ['focus', 'show', 'restore'].forEach(o => win.on(o, () => denetle(false)));
  try { powerMonitor.on('resume', () => setTimeout(() => denetle(false), 10000)); } catch {}
}

const SHORTCUTS = {
  'CommandOrControl+Alt+M': 'openMini()',                                // mini oynatıcıyı aç/kapat
  'CommandOrControl+Alt+Space': "document.querySelector('#pp').click()", // oynat/duraklat
  'CommandOrControl+Alt+Right': "document.querySelector('#nx').click()", // sonraki
  'CommandOrControl+Alt+Left': "document.querySelector('#pv').click()"   // önceki
};

app.on('second-instance', showMain);
app.on('before-quit', () => { quitting = true; });
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => {}); // tepsi sayesinde uygulama açık kalır
app.on('activate', showMain);
if (gotLock) app.whenReady().then(async () => {
  await startServer(); createWindow(); createTray(); setupUpdater();
  for (const [k, js] of Object.entries(SHORTCUTS)) globalShortcut.register(k, () => run(js));
}).catch(e => { dialog.showErrorBox('Yoni başlatılamadı', String(e.message || e)); app.quit(); });
