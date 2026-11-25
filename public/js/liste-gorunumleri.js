// Ortak yardımcılar; ara, ana sayfa ve kenar çubuğu görünümleri
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
// ---- Helpers
async function pick(){ // choose or create playlist
 const ls=await all('lists'),d=$('#dlg');
 d.innerHTML=`<b>Hangi listeye?</b><div style="margin:10px 0">${ls.map(l=>`<button class="btn g" style="margin:3px" data-id="${esc(l.id)}">${esc(l.name)}</button>`).join('')}</div>
 <input type="text" id="nn" placeholder="Yeni liste adı"><button class="btn" id="mk">Yeni liste oluştur</button> <button class="btn g" id="cl">İptal</button>`;
 d.showModal();
 return new Promise(ok=>{const end=v=>{d.close();ok(v)};
  d.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>end(ls.find(l=>l.id==b.dataset.id)));
  $('#mk').onclick=async()=>{const n=$('#nn').value.trim();if(!n)return;const l={id:'p'+Date.now(),name:n,ids:[]};await put('lists',l);end(l)};
  $('#cl').onclick=()=>end(null)})}
async function addTo(l,tracks){for(const t of tracks){await put('tracks',t);if(!l.ids.includes(t.id))l.ids.push(t.id)}await put('lists',l)}
async function download(t){
 if(!srcUrl(t))return;toast('İndiriliyor…');
 try{const r=await fetch(srcUrl(t));if(!r.ok)throw 0;await put('blobs',{id:t.id,blob:await r.blob()});toast('İndirildi ✓ Çevrimdışı dinlenebilir')}catch{toast('İndirme başarısız')}
}
const rowHTML=(t,i,off,extra)=>`<div class="row${t.id===queue[idx]?.id?' cur':''}" data-i="${i}" data-id="${esc(t.id)}">${artImg(t.art,1)}
<div class="i" data-a="play"><b>${esc(t.title)}</b><small>${esc(t.artist)}${t.src?' · '+esc(t.src):''}</small></div>
${extra||`<button class="ic" data-a="add">${ic('plus')}</button><button class="ic" data-a="sh">${ic('ext')}</button>`}${(t.aid||t.url)?`<button class="ic ${off?'ok':''}" data-a="dl">${ic(off?'check':'dl')}</button>`:''}</div>`;
// ---- Views
let view='ara',res=[],cur=null,curList=[];
async function show(v){view=v;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v==v));cur=show.keep||null;renderSbx();show.keep=null;chatWith=null;({home:vHome,ara:vAra,list:vList,imp:vImp,soc:vSoc,thm:vTheme,me:vMe})[v]()}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>show(b.dataset.v));
let src=(()=>{try{return localStorage.getItem('src')||'all'}catch{return 'all'}})(),page=0,lastQ='',more=false,loaded=false,busy=false;
async function run(q,p){const ks=src=='all'?Object.keys(S):[src];
 const rs=await Promise.allSettled(ks.map(k=>S[k](q,p))),ls=rs.map(r=>r.status=='fulfilled'?r.value:[]);
 const out=[],seen=new Set();for(let i=0;i<Math.max(0,...ls.map(l=>l.length));i++)ls.forEach(l=>{const t=l[i];if(t&&!seen.has(t.id)){seen.add(t.id);out.push(t)}});
 return{out,fail:rs.every(r=>r.status=='rejected')}}
async function load(reset=true){
 if(reset){page=0;res=[]}busy=true;
 if($('#r'))$('#r').innerHTML='<p class="muted">Yükleniyor…</p>';
 const{out,fail}=await run(lastQ,page);loaded=true;busy=false;
 res=reset?out:res.concat(out.filter(t=>!res.some(x=>x.id==t.id)));more=out.length>0;
 if(view=='ara')vAra();if(fail)toast('Arama yapılamadı (internet?)')}
async function vAra(){
 if(!loaded){loaded=true;load();}
 const off=new Set(await keys('blobs'));
 const chips=[['all','Hepsi'],['audius','Audius'],['jamendo','Jamendo'],['archive','Arşiv'],['youtube','YouTube']].map(([k,n])=>`<button class="chip${src==k?' on':''}" data-s="${k}">${n}</button>`).join('');
 const gen=['Electronic','Hip-Hop/Rap','Pop','Rock','Lo-Fi','Jazz','Ambient','Metal','Folk','Classical'];
 M.innerHTML=`<input type="text" id="q" value="${esc(lastQ)}" placeholder="Şarkı, sanatçı veya albüm ara…" enterkeyhint="search">
 <div class="chips">${chips}<button class="chip" id="gs">⚙</button></div>
 ${!jkey()&&src!='audius'&&src!='archive'?'<p class="muted" style="font-size:13px;margin:0 0 10px">Jamendo (yüzbinlerce ücretsiz şarkı) için ⚙ ile ücretsiz anahtar ekle.</p>':''}
 <div class="chips">${gen.map(g=>`<button class="chip${genre==g&&!lastQ?' on':''}" data-g="${esc(g)}">${esc(g)}</button>`).join('')}</div>
 <p class="muted" style="margin:4px 0">${lastQ?'“'+esc(lastQ)+'” sonuçları':'Şu an popüler'+(genre?' · '+genre:'')}</p>
 <div id="r">${res.map((t,i)=>rowHTML(t,i,off.has(t.id))).join('')||(busy?'<p class="muted">Yükleniyor…</p>':'<p class="muted">Sonuç bulunamadı.</p>')}</div>
 ${res.length&&more?'<button class="btn g" id="mo" style="width:100%;margin-top:10px">Daha fazla göster</button>':''}`;
 $('#q').onkeydown=e=>{if(e.key!='Enter')return;lastQ=e.target.value.trim();genre='';load()};
 M.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{src=b.dataset.s;try{localStorage.setItem('src',src)}catch{};load()});
 M.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{genre=genre==b.dataset.g?'':b.dataset.g;lastQ='';load()});
 if($('#mo'))$('#mo').onclick=()=>{page++;load(false)};
 $('#gs').onclick=()=>{const d=$('#dlg');d.innerHTML=`<b>Jamendo anahtarı</b><p class="muted" style="font-size:13px">devportal.jamendo.com adresinde ücretsiz hesap aç, "Create an application" de ve çıkan <b>Client ID</b>'yi buraya yapıştır.</p><input type="text" id="jk" value="${esc(jkey())}" placeholder="Client ID"><b>YouTube API anahtarı</b><p class="muted" style="font-size:13px">console.cloud.google.com → YouTube Data API v3 etkinleştir → API anahtarı oluştur.</p><input type="text" id="yk" value="${esc(ykey())}" placeholder="AIza…"><p class="muted" style="font-size:13px">İpucu: Ayarlar (⚙) → YouTube hesabı'ndan Google ile giriş yaparsan API anahtarı gerekmez.</p><button class="btn" id="sv">Kaydet</button> <button class="btn g" id="cl2">Kapat</button>`;d.showModal();
  $('#cl2').onclick=()=>d.close();$('#sv').onclick=()=>{try{localStorage.setItem('jk',$('#jk').value.trim());localStorage.setItem('yk',$('#yk').value.trim())}catch{};d.close();toast('Kaydedildi');load()}};
 $('#r').onclick=async e=>{const row=e.target.closest('.row');if(!row)return;const t=res[row.dataset.i],a=e.target.closest('[data-a]')?.dataset.a;
  if(a=='play')play(res,+row.dataset.i);
  if(a=='add'){const l=await pick();if(l){await addTo(l,[t]);toast('Eklendi: '+l.name)}}
  if(a=='sh')shareTrack(t);if(a=='dl'){await put('tracks',t);await download(t);vAra()}}
}
const getTs=async l=>(await Promise.all(l.ids.map(i=>get('tracks',i)))).filter(Boolean);
async function vHome(){
 const ls=(await all('lists')).filter(l=>l.ids.length&&l.id!='recent'),rec=await get('lists','recent'),lkd=await get('lists','liked'),hr=new Date().getHours(),
  g=hr<5?'İyi geceler':hr<12?'Günaydın':hr<18?'İyi günler':'İyi akşamlar',dl=ls.length?ls[new Date().getDate()%ls.length]:null,
  cov=async l=>l.cover||(l.ids[0]&&(await get('tracks',l.ids[0]))?.art)||'',tile=(l,c)=>`<div class="tile" data-id="${esc(l.id)}"><div class="cv"${c?` style="background-image:url(${esc(cssUrl(c))})"`:''}></div><b>${esc(l.name)}</b><small>${l.ids.length} şarkı</small></div>`;
 const wk=ls.filter(l=>l!==dl).slice(0,4),wc=await Promise.all(wk.map(cov)),dc=dl?await cov(dl):'',mix=(rec?await getTs(rec):[]).slice(0,7),
  pt=+lsGet('pt')||0,nt=(await keys('tracks')).length,tt=pt>=3600?(pt/3600).toFixed(1)+' sa':Math.round(pt/60)+' dk';
 M.innerHTML=`<h2 style="margin:0 0 14px">${g}${ME?', '+esc(ME.display):''} 👋</h2>
 <div class="hrow"><div class="aod" id="aod"${dc?` style="background-image:linear-gradient(to top,#000b,#0003),url(${esc(cssUrl(dc))})"`:''}><small>GÜNÜN LİSTESİ</small><button class="pl">▶</button><div><h2>${dl?esc(dl.name):'Henüz liste yok'}</h2><small>${dl?dl.ids.length+' şarkı':'Ara’dan şarkı bul, ＋ ile ekle'}</small></div></div>
 <div><h3 style="margin:0 0 10px">Listelerin</h3><div class="w4" id="hg">${wk.map((l,i)=>tile(l,wc[i])).join('')||'<p class="muted">Daha fazla liste oluşturunca burada görünür.</p>'}</div></div></div>
 <div class="hrow"><div class="pn mix"><h3 style="margin:0 0 6px">Günlük karışım</h3><div id="mx">${mix.map((t,i)=>`<div class="row" data-i="${i}">${artImg(t.art)}<div class="i"><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></div><small>${esc(t.src||'Cihaz')}</small><button class="ic" data-a="lk">${ic(lkd?.ids.includes(t.id)?'heartf':'heart')}</button></div>`).join('')||'<p class="muted">Şarkı dinledikçe burada görünür.</p>'}</div></div>
 <div><div class="pn" style="margin-bottom:14px"><h3 style="margin:0 0 6px">Kataloğu genişlet</h3><p class="muted" style="margin:0 0 10px">YouTube ve Jamendo anahtarı ekleyerek çok daha fazla şarkıya ulaş.</p><button class="btn pill" id="hk">Kaynakları ayarla</button></div>
 <div class="pn"><h4 style="margin:0 0 10px">İstatistikler</h4><div class="stats"><div><b>${tt}</b><small>Toplam süre</small></div><div><b>${lkd?lkd.ids.length:0}</b><small>Beğeni</small></div><div><b>${nt}</b><small>Şarkı</small></div></div></div></div></div>`;
 $('#aod').onclick=async()=>{if(dl){const t=await getTs(dl);t.length&&play(t,0)}};
 $('#hg').onclick=e=>{const c=e.target.closest('.tile');if(c){show.keep=c.dataset.id;show('list')}};
 $('#hk').onclick=()=>{show('ara');setTimeout(()=>$('#gs')&&$('#gs').click(),300)};
 $('#mx').onclick=async e=>{const r=e.target.closest('.row');if(!r)return;const t=mix[+r.dataset.i];
  if(e.target.closest('[data-a=lk]')){const l=lkd||{id:'liked',name:'❤ Beğenilenler',ids:[]};if(l.ids.includes(t.id)){l.ids=l.ids.filter(x=>x!=t.id);await put('lists',l)}else await addTo(l,[t]);vHome()}else play(mix,+r.dataset.i)}}
async function renderSbx(){const el=$('#sbx');if(!el)return;const op=lsGet('sbr')=='1';const ls=(await all('lists')).filter(l=>l.id!='recent'),rec=await get('lists','recent'),lkd=await get('lists','liked'),rt=rec?(await getTs(rec)).slice(0,6):[],sc=await Promise.all(ls.slice(0,6).map(coverOf));
 el.innerHTML=`<h4>Listelerim</h4><div class="sbl">${ls.slice(0,6).map((l,i)=>`<a data-l="${esc(l.id)}"><img src="${esc(sc[i]||PH)}"><span>${esc(l.name)}</span></a>`).join('')||'<small class="muted" style="padding:0 10px">Henüz liste yok</small>'}</div><h4 class="tg" id="rtg">Son çalınanlar<span class="cv">${ic(op?'up':'down')}</span></h4><div id="rtl" ${op?'':'hidden'}>${rt.map((t,i)=>`<div class="row" data-r="${i}">${artImg(t.art)}<div class="i"><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></div><small>${lkd?.ids.includes(t.id)?'❤️':''}</small></div>`).join('')||'<small class="muted" style="padding:0 10px">Henüz yok</small>'}</div>`;
 el.onclick=e=>{const g=e.target.closest('#rtg');if(g){const o=$('#rtl').hidden;$('#rtl').hidden=!o;g.querySelector('.cv').innerHTML=ic(o?'up':'down');lsSet('sbr',o?'1':'0');return}const a=e.target.closest('[data-l]');if(a){show.keep=a.dataset.l;return show('list')}const r=e.target.closest('[data-r]');if(r)play(rt,+r.dataset.r)}}
const renderTop=()=>{$('#tav').src=(ME&&ME.avatar)||PH;renderSbx()};
$('#tq').onkeydown=e=>{if(e.key!='Enter')return;lastQ=e.target.value.trim();genre='';e.target.value='';show('ara');setTimeout(()=>{const q=$('#q');if(q){q.value=lastQ;q.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}))}},250)};
$('#tg').onclick=()=>show('thm');$('#tav').onclick=()=>show('me');
setInterval(()=>{try{if(yt?(yp&&yp.getPlayerState&&yp.getPlayerState()==1):(!au.paused&&au.src))lsSet('pt',(+lsGet('pt')||0)+5)}catch{}},5000);

