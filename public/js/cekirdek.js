// Temel yardımcılar ve IndexedDB (şarkılar, listeler, indirilenler)
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
const API='https://api.audius.co/v1',APP='kisisel_muzik';
const $=s=>document.querySelector(s),au=$('#au'),M=$('#m');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cssUrl=u=>String(u??'').replace(/['"()\\\s]/g,c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')); // CSS url() içine güvenle koymak için
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove('on'),2500)};
// ---- IndexedDB
const db=new Promise((ok,no)=>{const r=indexedDB.open('muzigim',1);r.onupgradeneeded=()=>{const d=r.result;['tracks','lists','blobs'].forEach(s=>d.createObjectStore(s,{keyPath:'id'}))};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const tx=async(s,m,f)=>{const d=await db;return new Promise((ok,no)=>{const t=d.transaction(s,m),q=f(t.objectStore(s));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)})};
const put=(s,v)=>tx(s,'readwrite',o=>o.put(v)),get=(s,k)=>tx(s,'readonly',o=>o.get(k)),all=s=>tx(s,'readonly',o=>o.getAll()),keys=s=>tx(s,'readonly',o=>o.getAllKeys()),del=(s,k)=>tx(s,'readwrite',o=>o.delete(k));
