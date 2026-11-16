// İçe aktarma ve YouTube hesabı (bağla, aktar, yenile)
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
// ---- Import
function parseCSV(s){const rows=[];let r=[],c='',q=0;for(let i=0;i<s.length;i++){const ch=s[i];
 if(q){if(ch=='"'){if(s[i+1]=='"'){c+='"';i++}else q=0}else c+=ch}
 else if(ch=='"')q=1;else if(ch==','||ch==';'){r.push(c);c=''}else if(ch=='\n'){r.push(c);rows.push(r);r=[];c=''}else if(ch!='\r')c+=ch}
 if(c||r.length){r.push(c);rows.push(r)}return rows}
function parseAny(txt,name){
 try{const j=JSON.parse(txt),a=Array.isArray(j)?j:(j.tracks||j.items||[]);
  return a.map(o=>{if(typeof o=='string')return split(o);o=o.track||o;return{title:o.title||o.name||o.trackName,artist:o.artist||o.artists?.[0]?.name||o.artistName||''}}).filter(x=>x.title)}catch{}
 if(/\.csv$/i.test(name)||txt.split('\n')[0].includes(',')){
  const rows=parseCSV(txt),h=rows[0].map(x=>x.toLowerCase());
  const ti=h.findIndex(x=>/track name|title|song|name/.test(x)),ai=h.findIndex(x=>/artist/.test(x));
  if(ti>=0)return rows.slice(1).map(r=>({title:r[ti],artist:(r[ai]||'').split(/[;,]/)[0]})).filter(x=>x.title)}
 return txt.split('\n').map(x=>x.trim()).filter(Boolean).map(split);
 function split(s){const p=s.split(/\s[-–]\s/);return p.length>1?{artist:p[0],title:p.slice(1).join(' - ')}:{title:s,artist:''}}}
let ytCache=null;
async function ytEmbeddableSet(tr){try{const ok=new Set();for(let i=0;i<tr.length;i+=50){const r=await YTA.api('videos?part=status&maxResults=50&id='+tr.slice(i,i+50).map(t=>t.yid).join(','));(r.items||[]).forEach(v=>{const st=v.status||{};if(st.embeddable&&st.privacyStatus!='private'&&st.uploadStatus!='rejected')ok.add(v.id)})}return ok}catch{return null}}
async function ytEmbeddable(tr){const ok=await ytEmbeddableSet(tr);return ok?tr.filter(t=>ok.has(t.yid)):tr}
async function ytLikedTracks(log,pages=6){let tr=[],pt='';for(let i=0;i<pages;i++){log&&log(`Beğenilenler okunuyor… ${tr.length}`);const r=await YTA.api('videos?part=snippet&myRating=like&maxResults=50'+(pt?'&pageToken='+pt:''));tr.push(...r.items.filter(v=>v.snippet.categoryId=='10').map(v=>ytTrack(v.id,v.snippet)));pt=r.nextPageToken;if(!pt)break}return tr}
async function ytPlTracks(id,name,log,pages=6){let tr=[],pt='';for(let i=0;i<pages;i++){log&&log(`“${name}” okunuyor… ${tr.length}`);const x=await YTA.api(`playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(id)}`+(pt?'&pageToken='+pt:''));tr.push(...x.items.filter(v=>v.snippet.resourceId&&v.snippet.title!='Private video'&&v.snippet.title!='Deleted video').map(v=>ytTrack(v.snippet.resourceId.videoId,v.snippet)));pt=x.nextPageToken;if(!pt)break}return tr}
async function ytSync(log){const ls=(await all('lists')).filter(l=>l.id.startsWith('yt-'));if(!ls.some(l=>l.id=='yt-liked'))ls.unshift({id:'yt-liked',name:'▶ YouTube Beğenilenler',ids:[]});
 const sk=new Set(lsGet('ytskip')||[]);let added=0,skipped=0;
 for(const l of ls){log(`“${l.name}” denetleniyor…`);let tr;
  try{tr=l.id=='yt-liked'?await ytLikedTracks(null,3):await ytPlTracks(l.id.slice(3),l.name,null,10)}catch(e){if(l.id=='yt-liked')throw e;continue}
  const have=new Set(l.ids),nw=tr.filter(t=>!have.has(t.id)&&!sk.has(t.id));if(!nw.length)continue;
  const ok=await ytEmbeddable(nw),okIds=new Set(ok.map(t=>t.id));nw.forEach(t=>{if(!okIds.has(t.id))sk.add(t.id)});skipped+=nw.length-ok.length;
  if(ok.length){for(const t of ok)await put('tracks',t);l.ids=[...ok.map(t=>t.id),...l.ids];await put('lists',l);added+=ok.length}}
 lsSet('ytskip',[...sk].slice(-2000));try{renderSbx()}catch{}return{added,skipped,lists:ls.length}}
async function ytCard(){
 const box=$('#ytb');if(!box)return;const t=YTA.get(),c=YTA.cfg();
 if(!t){
  let ready=false;try{ready=(await api('GET','/yt/config')).ready}catch{}
  if(!$('#ytb'))return;
  box.innerHTML=`<p class="muted" style="font-size:13px;margin:0 0 10px">Google hesabınla bağlan: beğendiğin müzikler ve playlistlerin listelerine gelir, aramalar hesabınla yapılır, kediler beğendiklerinden şarkı önerir.</p><button class="btn" id="yc">▶ YouTube hesabını bağla</button> <span id="yst" class="muted"></span>`;
  $('#yc').onclick=async()=>{if(!ready)return toast('Google girişi bu uygulamada henüz kurulmamış (yapımcı Client ID eklemeli)');
   try{const j=await api('POST','/yt/start',{ru:YTA.ru()});window.open(j.url,'_blank');$('#yst').textContent='Tarayıcıda izin ver, sonra buraya dön…';
    for(let i=0;i<300&&$('#yc');i++){await new Promise(r=>setTimeout(r,2000));const p=await api('POST','/yt/poll',{state:j.state});if(!p.wait){YTA.set({at:p.access_token,rt:p.refresh_token,exp:Date.now()+p.expires_in*1e3});ytCache=null;toast('YouTube bağlandı ✓');return ytCard()}}
   }catch(e){toast(e.message);const st=$('#yst');if(st)st.textContent=''}};return}
 try{if(!ytCache||Date.now()-ytCache.t>12e4){box.innerHTML='<p class="muted">Yükleniyor…</p>';await YTA.api('videos?part=id&myRating=like&maxResults=1');const ch=await YTA.api('channels?part=snippet&mine=true').catch(()=>null),pl=await YTA.api('playlists?part=snippet,contentDetails&mine=true&maxResults=50').catch(()=>null);ytCache={t:Date.now(),n:ch&&ch.items&&ch.items[0]?ch.items[0].snippet.title:'YouTube hesabın',pl:(pl&&pl.items)||[]}}
  if(!$('#ytb'))return;const n=ytCache.n,pl=ytCache.pl;
  box.innerHTML=`<p style="margin:0 0 10px">✅ <b>${esc(n)}</b> bağlı</p><button class="btn" id="yl">❤ Beğendiğim müzikleri aktar</button> <button class="btn" id="ys" title="Yeni beğendiğin ve playlistlere eklediğin müzikleri listelere ekler">🔄 Yenile</button> <button class="btn g" id="yd">Bağlantıyı kes</button><div id="ylog" class="muted" style="margin:8px 0"></div>
  ${pl.map(p=>`<div class="row" data-pl="${esc(p.id)}" data-n="${esc(p.snippet.title)}"><div class="i"><b>${esc(p.snippet.title)}</b><small>${p.contentDetails.itemCount} video</small></div><button class="btn g sm">Aktar</button></div>`).join('')||'<p class="muted">Playlist bulunamadı.</p>'}`;
  const log=m=>{const e=$('#ylog');if(e)e.textContent=m},done=async(l,tr,n0)=>{l.ids=[];await addTo(l,tr);log(`“${l.name}” güncellendi: ${tr.length} şarkı`+(n0>tr.length?` (${n0-tr.length} tanesi sahibi gömmeye izin vermediği için atlandı)`:''));toast('Aktarıldı ✓')};
  $('#yd').onclick=()=>{YTA.set(null);ytCache=null;ytCard()};
  $('#yl').onclick=async()=>{try{let tr=await ytLikedTracks(log);if(!tr.length)return log('Müzik kategorisinde beğenilen video bulunamadı');const n0=tr.length;log('Çalınabilirlik denetleniyor…');tr=await ytEmbeddable(tr);if(!tr.length)return log('Bu videoların hiçbiri uygulamada çalınamıyor (sahibi gömmeye izin vermiyor)');await done(await get('lists','yt-liked')||{id:'yt-liked',name:'▶ YouTube Beğenilenler',ids:[]},tr,n0)}catch(e){log(e.message)}};
  $('#ys').onclick=async()=>{const b=$('#ys');b.disabled=true;try{const r=await ytSync(log);ytCache=null;const sk=r.skipped?`, ${r.skipped} tanesi gömülemediği için atlandı`:'';log(r.added?`🔄 ${r.added} yeni şarkı eklendi (${r.lists} liste denetlendi)${sk}`:`🔄 Yeni şarkı yok (${r.lists} liste denetlendi)${sk}`);if(r.added)toast(`🔄 ${r.added} yeni şarkı eklendi`)}catch(e){log(e.message)}b.disabled=false};
  box.querySelectorAll('[data-pl]').forEach(r=>r.querySelector('button').onclick=async()=>{try{let tr=await ytPlTracks(r.dataset.pl,r.dataset.n,log);const n0=tr.length;log('Çalınabilirlik denetleniyor…');tr=await ytEmbeddable(tr);if(!tr.length)return log('Bu videoların hiçbiri uygulamada çalınamıyor (sahibi gömmeye izin vermiyor)');await done(await get('lists','yt-'+r.dataset.pl)||{id:'yt-'+r.dataset.pl,name:'▶ '+r.dataset.n,ids:[]},tr,n0)}catch(e){log(e.message)}})
 }catch(e){if(!$('#ytb'))return;box.innerHTML=`<p class="muted">${esc(e.message)}</p><button class="btn g" id="yd">Bağlantıyı kes</button>`;$('#yd').onclick=()=>{YTA.set(null);ytCache=null;ytCard()}}}
function vImp(){
 M.innerHTML=`<div class="card"><b>Dış listeleri içe aktar</b><p class="muted">Spotify / YT Music / Apple Music listeni önce dışa aktar:<br>
 • Spotify → <u>exportify.net</u> ile CSV indir<br>• YT Music / Apple Music → <u>tunemymusic.com</u> veya <u>soundiiz.com</u> ile CSV indir<br>
 • Ya da bir .txt dosyasına her satıra <i>Sanatçı - Şarkı</i> yaz.</p>
 <button class="btn" id="pf">Dosya seç (.csv .json .txt)</button><input type="file" id="fi" accept=".csv,.json,.txt" hidden></div>
 <div class="card muted" style="font-size:13px">Şarkılar Audius kataloğunda aranıp eşleştirilir. Bulunamayanlar listelenir; Audius'ta olmayan ticari şarkılar (Spotify/Apple DRM'li) çalınamaz.</div><div id="log"></div>`;
 $('#pf').onclick=()=>$('#fi').click();
 $('#fi').onchange=async e=>{const f=e.target.files[0];if(!f)return;
  const items=parseAny(await f.text(),f.name);if(!items.length)return toast('Dosyada şarkı bulunamadı');
  const l={id:'p'+Date.now(),name:f.name.replace(/\.[^.]+$/,''),ids:[]},miss=[],log=$('#log');let ok=0;
  for(let i=0;i<items.length;i++){log.innerHTML=`<div class="card">Eşleştiriliyor ${i+1}/${items.length}…</div>`;
   try{const qq=`${items[i].artist} ${items[i].title}`.trim();let r=await search(qq,1);if(!r[0]&&jkey())r=await S.jamendo(qq,0,1);if(r[0]){await addTo(l,[r[0]]);ok++}else miss.push(items[i])}catch{miss.push(items[i])}}
  await put('lists',l);
  log.innerHTML=`<div class="card"><b>“${esc(l.name)}” oluşturuldu</b><br>${ok} bulundu, ${miss.length} bulunamadı.${miss.length?`<details><summary>Bulunamayanlar</summary><small class="muted">${miss.map(x=>esc(x.artist+' - '+x.title)).join('<br>')}</small></details>`:''}</div>`}
}
boot();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
if(navigator.storage?.persist)navigator.storage.persist();
addEventListener('offline',()=>toast('Çevrimdışı: yalnızca indirilenler çalar'));
addEventListener('online',()=>toast('Tekrar çevrimiçi'));

