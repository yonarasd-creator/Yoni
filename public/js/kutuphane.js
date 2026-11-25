// Çevrimdışı kütüphane yönetimi: kaplanan alan, eksik/yetim dosyalar, kütüphane yedeği (dışa/içe aktarma). Aktar sayfasında görünür.
const kutMB=b=>b>=1073741824?(b/1073741824).toFixed(2)+' GB':b>=1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
const KUT_DIŞ=new Set(['bg:media']); // şarkı olmayan, tema arka planı gibi blob kayıtları
async function kutDurum(){
 const [bl,tr,ls]=await Promise.all([all('blobs'),all('tracks'),all('lists')]);
 const meta=new Map(tr.map(t=>[t.id,t])),inList=new Set(ls.flatMap(l=>l.ids||[])),has=new Set(bl.map(b=>b.id));
 const dosyalar=bl.filter(b=>!KUT_DIŞ.has(b.id)).map(b=>({id:b.id,boyut:b.blob?.size||0,t:meta.get(b.id)}));
 const bg=bl.filter(b=>KUT_DIŞ.has(b.id)).reduce((s,b)=>s+(b.blob?.size||0),0);
 // Listede olup dosyası silinmiş cihaz şarkıları ("Cihazım"): yeniden çalınamaz
 const eksik=[...inList].filter(id=>!has.has(id)&&meta.get(id)&&!meta.get(id).aid&&!meta.get(id).url&&!meta.get(id).yid).map(id=>meta.get(id));
 // Hiçbir listede olmayan indirilmiş dosyalar: temizlenebilir
 const yetim=dosyalar.filter(d=>!inList.has(d.id));
 const kayitsiz=[...inList].filter(id=>!meta.get(id)); // listede kimliği var ama şarkı bilgisi yok
 let kota=null;try{const e=await navigator.storage.estimate();kota={kul:e.usage||0,kap:e.quota||0}}catch{}
 return{dosyalar,toplam:dosyalar.reduce((s,d)=>s+d.boyut,0),bg,eksik,yetim,kayitsiz,kota,liste:ls.length,sarki:tr.length};
}
async function kutRender(){
 const box=$('#kut');if(!box)return;
 let d;try{d=await kutDurum()}catch(e){box.innerHTML='<div class="card muted">Depolama bilgisi okunamadı.</div>';return}
 const en=[...d.dosyalar].sort((a,b)=>b.boyut-a.boyut).slice(0,5);
 box.innerHTML=`<div class="card"><b>Çevrimdışı depolama</b>
  <p class="muted" style="margin:6px 0">${d.dosyalar.length} indirilmiş şarkı · <b>${kutMB(d.toplam)}</b>${d.bg?` · arka plan ${kutMB(d.bg)}`:''}${d.kota&&d.kota.kap?`<br>Tarayıcı kotası: ${kutMB(d.kota.kul)} / ${kutMB(d.kota.kap)} kullanılıyor`:''}</p>
  ${en.length?`<small class="muted">En çok yer kaplayanlar</small>${en.map(x=>`<div class="row" style="border:0"><div class="i"><b>${esc(x.t?.title||'Bilinmeyen dosya')}</b><small>${esc(x.t?.artist||x.id)} · ${kutMB(x.boyut)}</small></div></div>`).join('')}`:'<p class="muted">Henüz indirilmiş şarkı yok.</p>'}
  ${d.eksik.length?`<p style="color:#ff8a7a;margin:10px 0 4px"><b>${d.eksik.length} şarkının dosyası eksik</b></p><small class="muted">Cihazdan eklenmişti, dosyası silinmiş; çalınamaz. Listeden kaldırıp yeniden ekle:</small>${d.eksik.slice(0,8).map(t=>`<div class="row" style="border:0"><div class="i"><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></div></div>`).join('')}${d.eksik.length>8?`<small class="muted">… ve ${d.eksik.length-8} tane daha</small>`:''}`:''}
  ${d.kayitsiz.length?`<p class="muted" style="margin:8px 0">${d.kayitsiz.length} liste kaydının şarkı bilgisi yok (silinmiş olabilir).</p>`:''}
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${d.yetim.length?`<button class="btn g" id="kt">Listede olmayan ${d.yetim.length} dosyayı sil (${kutMB(d.yetim.reduce((s,x)=>s+x.boyut,0))})</button>`:''}${d.dosyalar.length?'<button class="btn g" id="kh">Tüm indirilenleri sil</button>':''}</div></div>
  <div class="card"><b>Kütüphane yedeği</b><p class="muted" style="margin:6px 0">${d.liste} liste, ${d.sarki} şarkı kaydı. Yedek dosyası liste ve şarkı bilgilerini içerir; indirilen ses dosyaları dahil değildir (yeniden indirebilirsin).</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn g" id="ke">Dışa aktar (.json)</button><button class="btn g" id="ki">İçe aktar</button><input type="file" id="kf" accept=".json" hidden></div></div>`;
 const kt=$('#kt');if(kt)kt.onclick=async()=>{if(!confirm(`${d.yetim.length} dosya silinecek. Emin misin?`))return;for(const x of d.yetim)await del('blobs',x.id);toast('Temizlendi');kutRender()};
 const kh=$('#kh');if(kh)kh.onclick=async()=>{if(!confirm('İndirilen tüm şarkı dosyaları silinecek (listelerin kalır). Emin misin?'))return;for(const x of d.dosyalar)await del('blobs',x.id);toast('Silindi');kutRender()};
 $('#ke').onclick=async()=>{
  const [ls,tr]=await Promise.all([all('lists'),all('tracks')]);
  saveJson('yoni-kutuphane-'+new Date().toISOString().slice(0,10)+'.json',{yoni:1,tarih:new Date().toISOString(),lists:ls,tracks:tr});toast('Yedek indirildi')};
 $('#ki').onclick=()=>$('#kf').click();
 $('#kf').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const j=JSON.parse(await f.text());if(!j||j.yoni!==1||!Array.isArray(j.lists)||!Array.isArray(j.tracks))throw 0;
   const mevcut=new Set((await keys('lists')).concat(await keys('tracks')));let yl=0,ys=0;
   for(const t of j.tracks)if(t&&typeof t.id=='string'&&!mevcut.has(t.id)){await put('tracks',t);ys++}
   for(const l of j.lists)if(l&&typeof l.id=='string'&&Array.isArray(l.ids)&&!mevcut.has(l.id)){await put('lists',l);yl++}
   toast(`İçe aktarıldı: ${yl} liste, ${ys} şarkı`);if(typeof renderSbx=='function')renderSbx();kutRender()}
  catch{toast('Geçerli bir Yoni yedeği değil')}};
}
