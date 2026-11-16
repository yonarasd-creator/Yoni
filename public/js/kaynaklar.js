// Müzik kaynakları: Audius, Jamendo, Archive, YouTube giriş yardımcısı (YTA), arama
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
// ---- Audius
const stream=t=>`${API}/tracks/${t.aid}/stream?app_name=${APP}`;
const srcUrl=t=>t.url||(t.aid?stream(t):'');
const mapA=t=>({id:'a'+t.id,aid:t.id,title:t.title,artist:t.user.name,art:t.artwork?.['150x150']||'',src:'Audius'});
let genre='';const jkey=()=>{try{return localStorage.getItem('jk')||''}catch{return ''}};
const GJ={'Hip-Hop/Rap':'hiphop','Lo-Fi':'lofi','Electronic':'electronic'};
const S={
 audius:async(q,p,n=30)=>{const u=q?`${API}/tracks/search?query=${encodeURIComponent(q)}&limit=${n}&offset=${p*n}&app_name=${APP}`:`${API}/tracks/trending?limit=${n}&offset=${p*n}&time=week${genre?'&genre='+encodeURIComponent(genre):''}&app_name=${APP}`;
  const r=await fetch(u);if(!r.ok)throw 0;return (await r.json()).data.map(mapA)},
 jamendo:async(q,p,n=30)=>{const k=jkey();if(!k)return[];
  const sp=new URLSearchParams({client_id:k,format:'json',limit:n,offset:p*n,audioformat:'mp32',imagesize:200});
  if(q)sp.set('search',q);else{sp.set('order','popularity_week');if(genre)sp.set('tags',GJ[genre]||genre.toLowerCase())}
  const r=await fetch('https://api.jamendo.com/v3.0/tracks/?'+sp);if(!r.ok)throw 0;
  return ((await r.json()).results||[]).filter(t=>t.audio).map(t=>({id:'j'+t.id,title:t.name,artist:t.artist_name,art:t.image||'',url:t.audio,src:'Jamendo'}))},
 archive:async(q,p)=>{if(!q)return[];
  const sp=new URLSearchParams({q:`(${q}) AND mediatype:audio`,rows:6,page:p+1,output:'json'});
  ['identifier','creator','title'].forEach(x=>sp.append('fl[]',x));sp.append('sort[]','downloads desc');
  const r=await fetch('https://archive.org/advancedsearch.php?'+sp);if(!r.ok)throw 0;
  const docs=(await r.json()).response.docs;
  const ms=await Promise.allSettled(docs.map(d=>fetch('https://archive.org/metadata/'+d.identifier).then(x=>x.json())));
  const out=[];ms.forEach((m,i)=>{if(m.status!='fulfilled')return;const d=docs[i];
   const fs=(m.value.files||[]).filter(f=>/mp3/i.test(f.format||'')),og=fs.filter(f=>f.source=='original');
   (og.length?og:fs).slice(0,5).forEach(f=>out.push({id:'i:'+d.identifier+':'+f.name,title:f.title||f.name.replace(/\.[^.]+$/,''),artist:[].concat(d.creator||'Arşiv').join(', '),art:'https://archive.org/services/img/'+d.identifier,url:`https://archive.org/download/${d.identifier}/${encodeURIComponent(f.name)}`,src:'Arşiv'}))});
  return out}};
const ykey=()=>{try{return localStorage.getItem('yk')||''}catch{return ''}},dec=x=>new DOMParser().parseFromString(x,'text/html').body.textContent;
const YTA={get(){try{return JSON.parse(localStorage.getItem('ytt')||'null')}catch{return null}},set(v){try{v?localStorage.setItem('ytt',JSON.stringify(v)):localStorage.removeItem('ytt')}catch{}},
 cfg(){try{return JSON.parse(localStorage.getItem('ytc')||'{}')}catch{return{}}},ru:()=>location.origin+'/api/yt/callback',
 async tok(){const t=YTA.get();if(!t)return'';if(Date.now()<t.exp-6e4)return t.at;if(!t.rt)return'';const c=YTA.cfg();
  try{const r=await fetch('/api/yt/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cid:c.cid,sec:c.sec,rt:t.rt})}),j=await r.json();if(!r.ok)throw 0;t.at=j.access_token;t.exp=Date.now()+j.expires_in*1e3;YTA.set(t);return t.at}catch{return''}},
 async api(p){const k=await YTA.tok();if(!k)throw new Error('YouTube hesabı bağlı değil');const r=await fetch('https://www.googleapis.com/youtube/v3/'+p,{headers:{Authorization:'Bearer '+k}});if(!r.ok){let m='YouTube hatası';try{m=(await r.json()).error.message}catch{}throw new Error(m)}return r.json()}};
const ytTrack=(id,sn)=>({id:'y'+id,yid:id,title:dec(sn.title),artist:dec(sn.videoOwnerChannelTitle||sn.channelTitle||'').replace(/ - Topic$/,''),art:sn.thumbnails?.medium?.url||sn.thumbnails?.default?.url||'',src:'YouTube'});
S.youtube=async(q,p)=>{const k=ykey(),tk=k?'':await YTA.tok();if(!(k||tk)||p>0)return[];
 const r=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=15&q=${encodeURIComponent(q)}${k?`&key=${encodeURIComponent(k)}`:''}`,{headers:tk?{Authorization:'Bearer '+tk}:{}});if(!r.ok)throw 0;
 return(await r.json()).items.map(v=>ytTrack(v.id.videoId,v.snippet))};
async function search(q,n=15){const r=await fetch(`${API}/tracks/search?query=${encodeURIComponent(q)}&limit=${n}&app_name=${APP}`);if(!r.ok)throw 0;const j=await r.json();
 return j.data.map(t=>({id:'a'+t.id,aid:t.id,title:t.title,artist:t.user.name,art:t.artwork?.['150x150']||''}))}
