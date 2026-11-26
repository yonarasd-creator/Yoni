// Müzik kaynağı: yalnızca YouTube (arama + hesap girişi yardımcısı YTA)
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
// Müzik kaynağı: yalnızca YouTube (hesap bağlayarak veya API anahtarıyla). Cihazdan eklenen dosyalar ayrıca çalınır.
const srcUrl=t=>t.url||'';
const S={};
const ykey=()=>{try{return localStorage.getItem('yk')||''}catch{return ''}},dec=x=>new DOMParser().parseFromString(x,'text/html').body.textContent;
const YTA={get(){try{return JSON.parse(localStorage.getItem('ytt')||'null')}catch{return null}},set(v){try{v?localStorage.setItem('ytt',JSON.stringify(v)):localStorage.removeItem('ytt')}catch{}},
 cfg(){try{return JSON.parse(localStorage.getItem('ytc')||'{}')}catch{return{}}},ru:()=>location.origin+'/api/yt/callback',
 async tok(){const t=YTA.get();if(!t)return'';if(Date.now()<t.exp-6e4)return t.at;if(!t.rt)return'';const c=YTA.cfg();
  try{const r=await fetch('/api/yt/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cid:c.cid,sec:c.sec,rt:t.rt})}),j=await r.json();if(!r.ok)throw 0;t.at=j.access_token;t.exp=Date.now()+j.expires_in*1e3;YTA.set(t);return t.at}catch{return''}},
 async api(p){const k=await YTA.tok();if(!k)throw new Error('YouTube hesabı bağlı değil');const r=await fetch('https://www.googleapis.com/youtube/v3/'+p,{headers:{Authorization:'Bearer '+k}});if(!r.ok){let m='YouTube hatası';try{m=(await r.json()).error.message}catch{}throw new Error(m)}return r.json()}};
const ytTrack=(id,sn)=>({id:'y'+id,yid:id,title:dec(sn.title),artist:dec(sn.videoOwnerChannelTitle||sn.channelTitle||'').replace(/ - Topic$/,''),art:sn.thumbnails?.medium?.url||sn.thumbnails?.default?.url||'',src:'YouTube'});
const ytHazir=()=>!!(ykey()||YTA.get());
S.youtube=async(q,p)=>{if(!q||p>0)return[];const k=ykey(),tk=k?'':await YTA.tok();if(!(k||tk))return[];
 const r=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=15&q=${encodeURIComponent(q)}${k?`&key=${encodeURIComponent(k)}`:''}`,{headers:tk?{Authorization:'Bearer '+tk}:{}});if(!r.ok){let m='YouTube araması başarısız';try{m=(await r.json()).error.message}catch{}throw new Error(m)}
 return(await r.json()).items.map(v=>ytTrack(v.id.videoId,v.snippet))};
