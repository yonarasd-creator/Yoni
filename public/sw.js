const C='muzigim-v23',FILES=['./','index.html','manifest.webmanifest','icon.png','logos/logo-1.png','logos/logo-2.png','logos/logo-3.png','logos/logo-4.png','logos/logo-5.png','logos/logo-6.png','logos/logo-7.png','anma.js','kedi-art.js','kedi.js','stil.css','js/cekirdek.js','js/kaynaklar.js','js/oynatici.js','js/kedi-mod.js','js/kuyruk-youtube.js','js/liste-gorunumleri.js','js/mini-liste.js','js/sosyal-profil.js','js/kozmetik.js','js/tema.js','js/aktar-youtube.js','js/guncelleme.js','js/baslat.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C&&x!='muzigim-kapak-v1').map(x=>caches.delete(x)))));self.clients.claim()});
const IMG='muzigim-kapak-v1',IMGH=/(^|\.)(ytimg\.com|ggpht\.com|googleusercontent\.com)$/;
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method=='GET'&&e.request.destination=='image'&&IMGH.test(u.hostname)){ // liste kapakları: ağdan al, kaydet; ağ yoksa kayıttan göster
  e.respondWith(caches.open(IMG).then(async c=>{try{const r=await fetch(e.request);if(r.ok||r.type=='opaque'){c.put(e.request,r.clone());c.keys().then(k=>{if(k.length>800)c.delete(k[0])})}return r}catch{const r=await c.match(e.request);return r||Response.error()}}));return}
 if(e.request.method!='GET'||u.origin!=location.origin||u.pathname.startsWith('/api')||u.pathname.endsWith('.mp4'))return; // müzik/API istekleri doğrudan ağa gider
 e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
});
