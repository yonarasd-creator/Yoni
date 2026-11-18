// Son dinlenenler, kuyruk paneli, YouTube oynatıcı, sözler, ses ve tam ekran
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
async function addRecent(t){bumpPlay(t);moodLearn(t);try{await put('tracks',t);const l=await get('lists','recent')||{id:'recent',name:'🕘 Son dinlenenler',ids:[]};l.ids=[t.id,...l.ids.filter(x=>x!=t.id)].slice(0,30);await put('lists',l)}catch{}}
function showQueue(){const d=$('#dlg');
 d.innerHTML=`<b>Sıra (${queue.length})</b><div style="max-height:60vh;overflow:auto;margin:8px 0">${queue.map((t,i)=>`<div class="row${i==idx?' cur':''}" data-i="${i}"><div class="i" data-q="go"><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></div><button class="ic" data-q="rm">✕</button></div>`).join('')||'<p class="muted">Sıra boş</p>'}</div><button class="btn g" id="qc">Kapat</button>`;
 if(!d.open)d.showModal();$('#qc').onclick=()=>d.close();
 d.onclick=e=>{const r=e.target.closest('.row'),a=e.target.closest('[data-q]')?.dataset.q;if(!r||!a)return;const i=+r.dataset.i;
  if(a=='go'){d.close();play(queue,i)}if(a=='rm'&&i!=idx){queue.splice(i,1);if(i<idx)idx--;showQueue();renderSide()}}}
$('#qb').onclick=showQueue;
// ---- YouTube (resmi IFrame Player), sözler, sanatçı
let yp=null,yt=null;
const ytReady=()=>new Promise(ok=>{if(window.YT&&window.YT.Player)return ok();window.onYouTubeIframeAPIReady=ok;const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';document.head.appendChild(s)});
async function ytPlay(t){yt=t;$('#ytw').style.display='block';$('#bar').classList.add('yt');await ytReady();if(yt!==t)return;
 if(yp&&yp.loadVideoById)return yp.loadVideoById(t.yid);
 yp=new window.YT.Player('ytp',{width:'100%',height:'100%',videoId:t.yid,playerVars:{playsinline:1,autoplay:1,rel:0},events:{onReady:e=>{e.target.setVolume(+vol.value);e.target.playVideo()},
  onStateChange:e=>{if(e.data==1)setIc($('#pp'),'pause');else if(e.data==2)setIc($('#pp'),'play');else if(e.data==0)nx(true);mini()},
  onError:()=>{toast('Bu YouTube videosu gömülemiyor, sıradakine geçiliyor');nx()}}})}
const ytHide=h=>{document.documentElement.classList.toggle('yh',h);try{localStorage.setItem('yth',h?'1':'')}catch{}};
try{if(localStorage.getItem('yth'))document.documentElement.classList.add('yh')}catch{}
$('#yx').onclick=()=>ytHide(true);$('#yv').onclick=()=>ytHide(!document.documentElement.classList.contains('yh'));
function ytStop(){if(!yt)return;yt=null;try{yp.pauseVideo()}catch{}$('#ytw').style.display='none';$('#bar').classList.remove('yt')}
setInterval(()=>{if(!yt||!yp||!yp.getCurrentTime)return;try{const c=yp.getCurrentTime(),d=yp.getDuration();if(!sk.dragging)$('#sk').value=d?c/d*1000:0;$('#t1').textContent=fmt(c);$('#t2').textContent=fmt(d);$('#pg i').style.width=(d?c/d*100:0)+'%';mProg(c,d)}catch{}},500);
$('#ly').onclick=async()=>{const t=cT();if(!t)return;const d=$('#dlg');
 d.innerHTML=`<b>${esc(t.title)}</b><small class="muted"> · ${esc(t.artist)}</small><pre id="lyt" style="white-space:pre-wrap;font:inherit;max-height:60vh;overflow:auto;margin:10px 0">Aranıyor…</pre><small class="muted">Kaynak: lrclib.net</small><br><button class="btn g" id="lyc">Kapat</button>`;
 if(!d.open)d.showModal();$('#lyc').onclick=()=>d.close();let x='Söz bulunamadı.';
 try{const r=await fetch('https://lrclib.net/api/search?q='+encodeURIComponent(t.artist+' '+t.title));const j=r.ok?await r.json():[],h=j.find(v=>v.plainLyrics);if(h)x=h.plainLyrics}catch{x='Sözlere ulaşılamadı (internet?)'}
 const e=$('#lyt');if(e)e.textContent=x};
$('#ar').onclick=async()=>{const t=cT();if(!t)return;const d=$('#dlg');d.innerHTML=`<b>👤 ${esc(t.artist)}</b><div id="arl" style="max-height:60vh;overflow:auto;margin:8px 0"><p class="muted">Yükleniyor…</p></div><button class="btn g" id="arc">Kapat</button>`;
 if(!d.open)d.showModal();$('#arc').onclick=()=>d.close();let l=[];
 try{l=t.yid?await S.youtube(t.artist,0):(await search(t.artist,25)).filter(x=>x.artist==t.artist)}catch{}
 const e=$('#arl');if(!e)return;e.innerHTML=l.map((x,i)=>`<div class="row" data-i="${i}">${x.art?`<img src="${esc(x.art)}">`:'<div class="ph"></div>'}<div class="i"><b>${esc(x.title)}</b><small>${esc(x.artist)}</small></div></div>`).join('')||'<p class="muted">Başka şarkı bulunamadı.</p>';
 e.onclick=ev=>{const r=ev.target.closest('.row');if(r){d.close();play(l,+r.dataset.i)}}};
if('mediaSession'in navigator){const ms=navigator.mediaSession,H=(a,f)=>{try{ms.setActionHandler(a,f)}catch{}};
 H('enterpictureinpicture',()=>openMini());H('play',()=>yt?yp.playVideo():au.play());H('pause',()=>yt?yp.pauseVideo():au.pause());H('seekbackward',()=>{au.currentTime=Math.max(0,au.currentTime-10)});H('seekforward',()=>{au.currentTime+=10});H('seekto',e=>{au.currentTime=e.seekTime});
 const ps=()=>{try{au.duration&&isFinite(au.duration)&&ms.setPositionState({duration:au.duration,position:au.currentTime,playbackRate:au.playbackRate})}catch{}};
 au.addEventListener('loadedmetadata',ps);au.addEventListener('seeked',ps);au.addEventListener('play',()=>{ms.playbackState='playing';ps()});au.addEventListener('pause',()=>{ms.playbackState='paused'})}
// ---- Ses seviyesi + tam ekran oynatıcı
const PH="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2a2a2c"/><text x="50" y="66" font-size="48" text-anchor="middle">🎵</text></svg>');
$('#art').src=PH;
const vol=$('#vol');let v0=1;try{v0=+localStorage.getItem('vol')||1}catch{}
au.volume=v0;vol.value=v0*100;
const vic=()=>setIc($('#mute'),au.muted||au.volume==0?'vol0':au.volume<.5?'vol1':'vol2');
vol.oninput=()=>{au.muted=false;au.volume=vol.value/100;if(yp&&yp.setVolume)yp.setVolume(+vol.value);try{localStorage.setItem('vol',au.volume)}catch{};vic()};
$('#mute').onclick=()=>{au.muted=!au.muted;vic()};vic();
const bar=$('#bar'),openFull=()=>{if(matchMedia('(min-width:900px)').matches)return;if(!bar.classList.contains('full')){bar.classList.add('full');history.pushState({f:1},'')}};
$('#art').onclick=$('#np').onclick=openFull;
$('#cl').onclick=()=>history.back();
addEventListener('popstate',()=>bar.classList.remove('full'));
