// Oynatıcı çekirdeği: çal, sıradaki/önceki, ilerleme, beğeni
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
// ---- Player
let queue=[],idx=-1,url=null;
async function play(list,i){
 queue=list.slice();idx=i;const t=list[i];if(!t)return;
 const b=await get('blobs',t.id);
 if(url){URL.revokeObjectURL(url);url=null}
 if(b){url=URL.createObjectURL(b.blob);au.src=url}
 else if(t.yid)au.pause();
 else if(srcUrl(t)&&navigator.onLine)au.src=srcUrl(t);
 else{toast('İnternet yok, bu şarkı indirilmemiş');if(i+1<list.length)return play(list,i+1);return}
 if(t.yid)ytPlay(t);else{ytStop();au.play().catch(()=>{})}
 $('#art').src=t.art||PH;try{ws&&ws.readyState==1&&ws.send(JSON.stringify({type:'np',np:{title:t.title,artist:t.artist}}))}catch{}document.querySelectorAll('.row').forEach(r=>r.classList.toggle('cur',r.dataset.id==t.id));
 $('#np').innerHTML=`<b>${esc(t.title)}</b><small>${esc(t.artist)}</small>`;paintLike();addRecent(t);renderSide();mini();
 if('mediaSession'in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist,artwork:t.art?[{src:t.art,sizes:'150x150'}]:[]});
  navigator.mediaSession.setActionHandler('nexttrack',()=>nx());navigator.mediaSession.setActionHandler('previoustrack',()=>pv())}
}
let shuf=0,rpt=0;
function nx(auto){
 if(auto===true&&rpt==2)return play(queue,idx);
 if(shuf&&queue.length>1){let j;do{j=Math.floor(Math.random()*queue.length)}while(j==idx);return play(queue,j)}
 if(idx+1<queue.length)return play(queue,idx+1);
 if(rpt==1&&queue.length)return play(queue,0)}
const pv=()=>{if((yt?yp.getCurrentTime():au.currentTime)>3){yt?yp.seekTo(0,true):au.currentTime=0}else if(idx>0)play(queue,idx-1)};
$('#nx').onclick=()=>nx();$('#pv').onclick=pv;
$('#pp').onclick=()=>{if(yt)yp.getPlayerState()==1?yp.pauseVideo():yp.playVideo();else au.src&&(au.paused?au.play():au.pause())};
au.onplay=()=>setIc($('#pp'),'pause');au.onpause=()=>setIc($('#pp'),'play');au.onended=()=>nx(true);
au.onerror=()=>{if(au.src)toast('Çalınamadı, sıradakine geçiliyor');setTimeout(()=>nx(),800)};
const fmt=s=>isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
au.ontimeupdate=()=>{if(!sk.dragging)$('#sk').value=au.duration?au.currentTime/au.duration*1000:0;$('#t1').textContent=fmt(au.currentTime);$('#t2').textContent=fmt(au.duration);$('#pg i').style.width=(au.duration?au.currentTime/au.duration*100:0)+'%'};
const sk=$('#sk');sk.oninput=()=>{sk.dragging=1;if(yt)yp.seekTo(sk.value/1000*yp.getDuration(),true);else au.currentTime=sk.value/1000*au.duration};sk.onchange=()=>sk.dragging=0;
$('#sh').onclick=e=>{shuf=!shuf;e.currentTarget.style.opacity=shuf?1:.4;toast(shuf?'Karışık açık':'Karışık kapalı')};
$('#rp').onclick=e=>{rpt=(rpt+1)%3;const b=e.currentTarget;setIc(b,rpt==2?'rep1':'rep');b.style.opacity=rpt?1:.4;toast(['Tekrar kapalı','Listeyi tekrarla','Şarkıyı tekrarla'][rpt])};
$('#sh').style.opacity=$('#rp').style.opacity=.4;
// ---- Beğeni, sıra paneli, son dinlenenler, kilit ekranı
const cT=()=>queue[idx];
async function paintLike(){const t=cT(),l=t&&await get('lists','liked');setIc($('#lk'),l&&l.ids.includes(t.id)?'heartf':'heart');$('#lk').classList.toggle('lkd',!!(l&&l.ids.includes(t.id)));mini()}
$('#lk').onclick=async()=>{const t=cT();if(!t)return;const l=await get('lists','liked')||{id:'liked',name:'❤ Beğenilenler',ids:[]};
 if(l.ids.includes(t.id)){l.ids=l.ids.filter(x=>x!=t.id);await put('lists',l);toast('Beğenilenlerden çıkarıldı')}else{await addTo(l,[t]);toast('Beğenildi ❤')}paintLike()};
