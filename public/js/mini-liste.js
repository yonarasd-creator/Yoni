// Mini oynatıcı; liste ekranları ve liste düzenleme
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
// ---- Mini oynatıcı: sol üstte küçük, her zaman üstte duran pencere (Electron'da). Tarayıcıda Document Picture-in-Picture.
let mw=null;
const MINI_CSS=`:root{color-scheme:dark}*{box-sizing:border-box}html,body{margin:0;height:100%}body{font:12px system-ui,sans-serif;color:var(--t,#f2f2f2);background:linear-gradient(150deg,color-mix(in srgb,var(--a,#1db6a0) 30%,#17171a),#17171a 75%);display:flex;flex-direction:column;padding:9px 10px 8px;gap:6px;user-select:none;overflow:hidden;border-radius:12px;border:1px solid #ffffff1a}
.si{width:16px;height:16px;display:block;pointer-events:none}button,input{-webkit-app-region:no-drag}.top{display:flex;align-items:center;gap:9px;-webkit-app-region:drag}
#ma{width:44px;height:44px;border-radius:8px;object-fit:cover;flex:none;background:#0004}.nm{flex:1;min-width:0}.nm b,.nm small,.r b,.r small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nm b{font-size:13px}.nm small,.r small,.tm{color:var(--m,#a0a0a8)}
button{background:none;border:0;color:inherit;padding:5px;border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;opacity:.85;transition:transform .12s,background-color .15s,opacity .15s}button:hover{background:#ffffff1c;opacity:1}button:active{transform:scale(.88)}button.on{color:var(--a,#1db6a0);opacity:1}
.top button{padding:4px}#mpp{background:#fff;color:#111;width:34px;height:34px;opacity:1}#mpp .si{width:16px;height:16px}#ml.lkd{color:#ff4d6d;opacity:1}
.bar{display:flex;align-items:center;gap:7px}.tm{font-size:10px;font-variant-numeric:tabular-nums;min-width:28px}.tm:last-child{text-align:right}
input[type=range]{-webkit-appearance:none;appearance:none;height:14px;background:transparent;margin:0;flex:1;min-width:0;cursor:pointer}input[type=range]::-webkit-slider-runnable-track{height:3px;border-radius:2px;background:linear-gradient(to right,var(--a,#1db6a0) var(--p,0%),#ffffff2e var(--p,0%))}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:10px;border-radius:50%;background:#fff;margin-top:-3.5px;opacity:0;transition:opacity .15s}input[type=range]:hover::-webkit-slider-thumb,input[type=range]:active::-webkit-slider-thumb{opacity:1}
.ct{display:flex;align-items:center;justify-content:space-between;gap:2px}.ct .g{display:flex;align-items:center;gap:2px}#mv2{width:54px;flex:none}
#mq{display:none;flex:1;overflow:auto;border-top:1px solid #ffffff1f;padding-top:5px;margin-top:2px}.x #mq{display:block}.r{padding:5px 7px;border-radius:7px;cursor:pointer}.r:hover{background:#ffffff14}.r.c b{color:var(--a,#1db6a0)}.r b{font-size:12px}.r small{font-size:10.5px}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#ffffff30;border-radius:3px}`;
const MW=360,MH=132,MHX=430;
async function openMini(){
 if(mw){mw.close();return}
 const pop=()=>window.open('','muzigim-mini',`popup,width=${MW},height=${MH},left=12,top=12`);
 try{mw=window.documentPictureInPicture&&!/Electron/.test(navigator.userAgent)?await documentPictureInPicture.requestWindow({width:MW,height:MH}):pop()}catch{try{mw=pop()}catch{mw=null}}
 if(!mw){toast('Mini oynatıcı açılamadı (açılır pencere engelli olabilir)');return}
 const d=mw.document,cs=getComputedStyle(document.documentElement),q=id=>d.getElementById(id);d.title='Yoni';
 d.head.innerHTML='<meta charset="utf-8"><style>'+MINI_CSS+'</style>';
 d.body.innerHTML=`<div class="top"><img id="ma" alt=""><div class="nm"><b id="mt">—</b><small id="mr"></small></div><button id="mx" title="Sırayı göster / gizle (E)">${ic('queue')}</button><button id="mo" title="Ana pencereyi aç">${ic('ext')}</button><button id="mz" title="Kapat">${ic('close')}</button></div>
<div class="bar"><span class="tm" id="mc">0:00</span><input type="range" id="mk" min="0" max="1000" value="0"><span class="tm" id="md">0:00</span></div>
<div class="ct"><div class="g"><button id="ms" title="Karışık">${ic('shuf')}</button><button id="mr2" title="Tekrar">${ic('rep')}</button></div><div class="g"><button id="mv" title="Önceki">${ic('prev')}</button><button id="mpp" title="Oynat / duraklat">${ic('play')}</button><button id="mn" title="Sonraki">${ic('next')}</button></div><div class="g"><button id="ml" title="Beğen">${ic('heart')}</button><button id="mm" title="Sesi kapat">${ic('vol2')}</button><input type="range" id="mv2" min="0" max="100" value="100" title="Ses"></div></div><div id="mq"></div>`;
 for(const k of['--a','--s','--t','--m'])d.documentElement.style.setProperty(k,cs.getPropertyValue(k).trim());
 const fill=r=>r.style.setProperty('--p',(r.max?r.value/r.max*100:0)+'%');
 const ex=()=>{const x=d.body.classList.toggle('x');q('mx').classList.toggle('on',x);try{mw.resizeTo(MW,x?MHX:MH)}catch{}};
 q('mpp').onclick=()=>$('#pp').click();q('mn').onclick=()=>$('#nx').click();q('mv').onclick=()=>$('#pv').click();q('ml').onclick=()=>$('#lk').click();q('ms').onclick=()=>$('#sh').click();q('mr2').onclick=()=>$('#rp').click();
 q('mm').onclick=()=>$('#mute').click();q('mx').onclick=ex;q('mz').onclick=()=>mw&&mw.close();q('mo').onclick=()=>{try{window.focus()}catch{}};
 const v=q('mv2');v.value=vol.value;fill(v);v.oninput=()=>{vol.value=v.value;vol.oninput();fill(v)};
 const k=q('mk');k.oninput=()=>{k.dragging=1;fill(k);if(yt)yp.seekTo(k.value/1000*yp.getDuration(),true);else if(au.duration)au.currentTime=k.value/1000*au.duration};k.onchange=()=>k.dragging=0;
 q('mq').onclick=e=>{const r=e.target.closest('.r');r&&play(queue,+r.dataset.i)};
 d.addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault()});
 d.addEventListener('keydown',e=>{const m={' ':'#pp',ArrowRight:'#nx',ArrowLeft:'#pv',l:'#lk',L:'#lk',m:'#mute',M:'#mute'}[e.key];
  if(m){e.preventDefault();$(m).click()}else if(e.key=='e'||e.key=='E'){e.preventDefault();ex()}
  else if(e.key=='ArrowUp'||e.key=='ArrowDown'){e.preventDefault();vol.value=Math.min(100,Math.max(0,+vol.value+(e.key=='ArrowUp'?10:-10)));vol.oninput();v.value=vol.value;fill(v)}});
 mw.addEventListener('pagehide',()=>{mw=null;mini.k=''});mini.k='';mini()}
function mini(){if(!mw)return;const t=cT();if(!t)return;const d=mw.document,q=id=>d.getElementById(id);if(!q('mt'))return;
 const k=t.id+'|'+queue.length+'|'+idx;if(mini.k!=k){mini.k=k;q('ma').src=t.art||PH;q('mt').textContent=t.title;q('mr').textContent=t.artist;q('mt').title=t.title;
  const a=Math.max(0,idx-1);q('mq').innerHTML=queue.slice(a,idx+40).map((x,j)=>`<div class="r${a+j==idx?' c':''}" data-i="${a+j}"><b>${esc(x.title)}</b><small>${esc(x.artist)}</small></div>`).join('')}
 const set=(id,n)=>{const e=q(id);if(e&&e.dataset.n!==n){e.dataset.n=n;e.innerHTML=ic(n)}};
 set('mpp',$('#pp').dataset.i=='pause'?'pause':'play');const lk=$('#lk').dataset.i=='heartf';set('ml',lk?'heartf':'heart');q('ml').classList.toggle('lkd',lk);
 set('mr2',$('#rp').dataset.i||'rep');q('mr2').classList.toggle('on',$('#rp').style.opacity==1);q('ms').classList.toggle('on',$('#sh').style.opacity==1);set('mm',$('#mute').dataset.i||'vol2');
 const vv=q('mv2');if(vv&&vv.value!=vol.value){vv.value=vol.value;vv.style.setProperty('--p',vol.value+'%')}}
function mProg(c,d){if(!mw)return;const k=mw.document.getElementById('mk');if(!k)return;if(!k.dragging){k.value=d?c/d*1000:0;k.style.setProperty('--p',(k.value/10)+'%')}
 const a=fmt(c),b=fmt(d);if(mProg.s!=a+b){mProg.s=a+b;mw.document.getElementById('mc').textContent=a;mw.document.getElementById('md').textContent=b}}
au.addEventListener('timeupdate',()=>{if(mw&&!yt)mProg(au.currentTime,au.duration)});au.addEventListener('play',mini);au.addEventListener('pause',mini);au.addEventListener('volumechange',mini);
$('#tm').onclick=openMini;addEventListener('keydown',e=>{if(e.altKey&&e.code=='KeyM'){e.preventDefault();openMini()}});addEventListener('pagehide',()=>{try{mw&&mw.close()}catch{}});
function renderSide(){renderSbx();const t=cT();if(!t)return;$('#sa').src=t.art||PH;$('#st').textContent=t.title;$('#sar').textContent=t.artist;
 $('#sq').innerHTML=queue.slice(idx+1,idx+6).map((x,i)=>`<div class="row" data-i="${idx+1+i}">${x.art?`<img src="${esc(x.art)}">`:'<div class="ph"></div>'}<div class="i"><b>${esc(x.title)}</b><small>${esc(x.artist)}</small></div></div>`).join('')||'<p class="muted">Sırada başka şarkı yok</p>'}
$('#sq').onclick=e=>{const r=e.target.closest('.row');r&&play(queue,+r.dataset.i)};
async function coverOf(l){return l.cover||(l.ids[0]&&(await get('tracks',l.ids[0]))?.art)||''}
async function vList(){
 if(cur)return vOne();
 const ls=await all('lists'),cv=await Promise.all(ls.map(coverOf));
 M.innerHTML=`<div class="tb"><b style="font-size:18px">Kitaplığın</b><span><button class="btn sm" id="nl">＋ Yeni liste</button> <button class="btn g sm" id="lf">${ic('folder')} Dosya ekle</button></span></div>`+
  (ls.map((l,i)=>`<div class="row lrow" data-id="${esc(l.id)}"><img src="${esc(cv[i]||PH)}"><div class="i"><b>${esc(l.name)}</b><small>Liste · ${l.ids.length} şarkı${l.bio?' · '+esc(l.bio):''}</small></div></div>`).join('')||'<p class="muted">Henüz liste yok. Arama’dan ＋ ile ekle veya İçe Aktar’ı kullan.</p>')+
  `<input type="file" id="fi" accept="audio/*" multiple hidden>`;
 M.querySelectorAll('.lrow').forEach(c=>c.onclick=()=>{cur=c.dataset.id;vOne()});
 $('#nl').onclick=async()=>{const n=(prompt('Yeni liste adı')||'').trim();if(!n)return;const l={id:'p'+Date.now(),name:n,ids:[]};await put('lists',l);renderSbx();cur=l.id;vOne()};
 $('#lf').onclick=()=>$('#fi').click();
 $('#fi').onchange=async e=>{const l=await pick();if(!l)return;const ts=[];let n=0;
  for(const f of e.target.files){const id='l'+Date.now()+(n++);await put('blobs',{id,blob:f});ts.push({id,title:f.name.replace(/\.[^.]+$/,''),artist:'Cihazım',art:''})}
  await addTo(l,ts);toast(ts.length+' dosya eklendi');vList()};
}
function editList(l){
 const d=$('#dlg');let cover=l.cover||'';
 d.innerHTML=`<b>Listeyi düzenle</b>
 <div style="display:flex;gap:12px;align-items:center;margin:12px 0"><img id="lec" class="lc" style="width:96px;height:96px" src="${esc(cover||PH)}"><div><button class="btn g sm" id="lep">${ic('img')} Kapak seç</button> <button class="btn g sm" id="ler">Kaldır</button></div></div>
 <input type="text" id="len" maxlength="60" placeholder="Liste adı" value="${esc(l.name)}"><textarea id="leb" rows="3" maxlength="300" placeholder="Liste hakkında kısa bir yazı (bio)">${esc(l.bio||'')}</textarea>
 <input type="file" id="lef" accept="image/*" hidden><button class="btn" id="les">Kaydet</button> <button class="btn g" id="lex">İptal</button>`;
 d.showModal();
 $('#lep').onclick=()=>$('#lef').click();
 $('#lef').onchange=async e=>{const f=e.target.files[0];if(!f)return;
  try{const b=await toBlob(f,480);cover=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(b)});$('#lec').src=cover}catch{toast('Görsel okunamadı')}};
 $('#ler').onclick=()=>{cover='';$('#lec').src=PH};
 $('#lex').onclick=()=>d.close();
 $('#les').onclick=async()=>{const n=$('#len').value.trim();if(n)l.name=n;l.bio=$('#leb').value.trim();if(cover)l.cover=cover;else delete l.cover;
  await put('lists',l);d.close();renderSbx();vOne()};
}
async function vOne(){
 const l=await get('lists',cur),off=new Set(await keys('blobs'));
 curList=(await Promise.all(l.ids.map(id=>get('tracks',id)))).filter(Boolean);
 const nOff=curList.filter(t=>off.has(t.id)).length,cv=await coverOf(l);
 M.innerHTML=`<button class="ic" id="bk" title="Geri">←</button>
 <div class="lh"><img class="lc" src="${esc(cv||PH)}"><div class="lt"><small>LİSTE</small><h2>${esc(l.name)}</h2>${l.bio?`<p class="lb">${esc(l.bio)}</p>`:''}<small>${curList.length} şarkı · ${nOff} çevrimdışı hazır</small></div></div>
 <div class="la"><button class="pl2" id="pa" title="Çal">${ic('play')}</button><button class="ic" id="da" title="Hepsini indir">${ic('dl')}</button><button class="ic" id="rn" title="Kapak, ad ve bio düzenle">${ic('edit')}</button><button class="ic" id="dl" title="Listeyi sil">${ic('trash')}</button></div>
 <div id="r" class="cpt">${curList.map((t,i)=>rowHTML(t,i,off.has(t.id),'<button class="ic" data-a="up" title="Yukarı">'+ic('up')+'</button><button class="ic" data-a="dn" title="Aşağı">'+ic('down')+'</button><button class="ic" data-a="sh">'+ic('ext')+'</button><button class="ic" data-a="rm">'+ic('close')+'</button>')).join('')}</div>`;
 const mv=async(i,j)=>{if(j<0||j>=curList.length)return;const ids=curList.map(x=>x.id),[x]=ids.splice(i,1);ids.splice(j,0,x);l.ids=[...ids,...l.ids.filter(z=>!ids.includes(z))];await put('lists',l);vOne()};
 let dg=-1;$('#r').querySelectorAll('.row').forEach(r=>{r.draggable=true;r.ondragstart=e=>{dg=+r.dataset.i;e.dataTransfer.effectAllowed='move';r.style.opacity=.4};r.ondragend=()=>{r.style.opacity=''};r.ondragover=e=>{e.preventDefault();r.style.outline='2px solid var(--a)'};r.ondragleave=()=>{r.style.outline=''};r.ondrop=e=>{e.preventDefault();r.style.outline='';const j=+r.dataset.i;if(dg>=0&&dg!=j)mv(dg,j);dg=-1}});
 $('#bk').onclick=()=>{cur=null;vList()};
 $('#rn').onclick=()=>editList(l);
 $('#pa').onclick=()=>curList.length&&play(curList,0);
 $('#da').onclick=async()=>{for(const t of curList)if((t.aid||t.url)&&!off.has(t.id))await download(t);vOne()};
 $('#dl').onclick=async()=>{if(confirm('Liste silinsin mi? (indirilen dosyalar kalır)')){await del('lists',cur);cur=null;renderSbx();vList()}};
 $('#r').onclick=async e=>{const row=e.target.closest('.row');if(!row)return;const t=curList[row.dataset.i],a=e.target.closest('[data-a]')?.dataset.a;
  if(a=='play')play(curList,+row.dataset.i);
  if(a=='up')return mv(+row.dataset.i,+row.dataset.i-1);if(a=='dn')return mv(+row.dataset.i,+row.dataset.i+1);
  if(a=='sh')shareTrack(t);if(a=='dl'){await download(t);vOne()}
  if(a=='rm'){l.ids=l.ids.filter(x=>x!=t.id);await put('lists',l);vOne()}}
}

