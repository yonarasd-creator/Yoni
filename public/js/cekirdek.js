// Temel yardımcılar ve IndexedDB (şarkılar, listeler, indirilenler)
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
const API='https://api.audius.co/v1',APP='kisisel_muzik';
const $=s=>document.querySelector(s),au=$('#au'),M=$('#m');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cssUrl=u=>String(u??'').replace(/['"()\\\s]/g,c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')); // CSS url() içine güvenle koymak için
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove('on'),2500)};
// ---- Simge seti (çizgi tabanlı SVG; renk metinden gelir, boyut yazı boyutuna uyar)
const IC={
 home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 list:'<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',chat:'<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/>',
 imp:'<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/>',theme:'<path d="M12 3a9 9 0 100 18c1.3 0 2-.9 2-2 0-1.4-1-1.8-1-3s1-2 2.3-2H18a3 3 0 003-3c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
 mini:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><rect x="12" y="12" width="7" height="5" rx="1" fill="currentColor"/>',close:'<path d="M6 6l12 12M18 6L6 18"/>',down:'<path d="M6 9l6 6 6-6"/>',
 up:'<path d="M6 15l6-6 6 6"/>',shuf:'<path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
 prev:'<path d="M6 5v14" /><path d="M19 5L9 12l10 7z" fill="currentColor"/>',next:'<path d="M18 5v14"/><path d="M5 5l10 7-10 7z" fill="currentColor"/>',
 play:'<path d="M7 4.5v15l13-7.5z" fill="currentColor"/>',pause:'<rect x="6" y="4.5" width="4.2" height="15" rx="1" fill="currentColor"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1" fill="currentColor"/>',
 rep:'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 01-3 3H3"/>',
 rep1:'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 01-3 3H3"/><path d="M11 10l1.5-1v6" />',
 heart:'<path d="M12 20s-8-4.8-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6.2-8 11-8 11z"/>',heartf:'<path d="M12 20s-8-4.8-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6.2-8 11-8 11z" fill="currentColor"/>',
 queue:'<path d="M4 6h16M4 12h16M4 18h10"/>',lyr:'<path d="M5 4h14v16H5z"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4"/>',tv:'<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
 vol0:'<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/>',vol1:'<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 9.5a4 4 0 010 5"/>',
 vol2:'<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 9.5a4 4 0 010 5"/><path d="M19 6.5a8 8 0 010 11"/>',expand:'<path d="M14 4h6v6"/><path d="M10 20H4v-6"/><path d="M20 4l-7 7M4 20l7-7"/>',
 img:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/>',lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor"/>',plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',refresh:'<path d="M20 11a8 8 0 00-14-4L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0014 4l2-2"/><path d="M20 20v-5h-5"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',pin:'<path d="M9 3h6l-1 6 3 4H7l3-4z"/><path d="M12 13v8"/>',dl:'<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/>',
 ext:'<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',folder:'<path d="M3 6a1 1 0 011-1h5l2 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1z"/>'};
const ic=(n,s)=>`<svg class="si" viewBox="0 0 24 24" ${s?`width="${s}" height="${s}" `:''}fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||''}</svg>`;
const setIc=(el,n)=>{if(el&&el.dataset.i!==n){el.dataset.i=n;el.innerHTML=ic(n)}};
document.querySelectorAll('[data-i]').forEach(e=>{const n=e.dataset.i;e.dataset.i='';setIc(e,n)});
// ---- IndexedDB
const db=new Promise((ok,no)=>{const r=indexedDB.open('muzigim',1);r.onupgradeneeded=()=>{const d=r.result;['tracks','lists','blobs'].forEach(s=>d.createObjectStore(s,{keyPath:'id'}))};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const tx=async(s,m,f)=>{const d=await db;return new Promise((ok,no)=>{const t=d.transaction(s,m),q=f(t.objectStore(s));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)})};
const put=(s,v)=>tx(s,'readwrite',o=>o.put(v)),get=(s,k)=>tx(s,'readonly',o=>o.get(k)),all=s=>tx(s,'readonly',o=>o.getAll()),keys=s=>tx(s,'readonly',o=>o.getAllKeys()),del=(s,k)=>tx(s,'readwrite',o=>o.delete(k));
