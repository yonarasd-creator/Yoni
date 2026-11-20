// Arayüz ile ana süreç arasındaki güvenli köprü: yalnızca güncelleme bilgisi ve "kur" komutu
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('yoniApp', {
  guncelleme: cb => { ipcRenderer.on('guncelleme', (_e, d) => cb(d)); ipcRenderer.invoke('guncelleme-durum').then(d => d && cb(d)).catch(() => {}); },
  kur: () => ipcRenderer.invoke('guncelleme-kur'),
  denetle: () => ipcRenderer.invoke('guncelleme-denetle')
});
