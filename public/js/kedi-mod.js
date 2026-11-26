// Kedi köprüsü ve mod önerileri (sağ tık menüsünün veri tarafı)
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
function bumpPlay(t){try{const m=JSON.parse(localStorage.getItem('pc')||'{}');m[t.id]=(m[t.id]||0)+1;localStorage.setItem('pc',JSON.stringify(m))}catch{}}
window.kediPick=async()=>{try{const m=JSON.parse(localStorage.getItem('pc')||'{}'),cur=queue&&queue[idx]&&queue[idx].id,ids=Object.keys(m).filter(i=>m[i]>=2&&i!=cur).sort((a,b)=>m[b]-m[a]).slice(0,8);
 for(let k=0;k<ids.length;k++){const id=ids[Math.random()*ids.length|0],t=await get('tracks',id);if(t)return{t,n:m[id]}}
 const yl=await get('lists','yt-liked'),yi=yl?yl.ids.filter(i=>i!=cur):[];if(yi.length){const t=await get('tracks',yi[Math.random()*yi.length|0]);if(t)return{t,n:0}}}catch{}return null};
window.kediPlay=t=>play([t],0);
const MODES=[{k:'sakin',e:'😌',n:'Sakin',q:['calm acoustic','chill ambient','soft piano'],kw:/calm|sakin|chill|ambient|piano|acoustic|akustik|soft|slow|sleep|relax/i},
 {k:'enerjik',e:'⚡',n:'Enerjik',q:['workout music','upbeat dance','energy rock'],kw:/workout|energy|dance|remix|edm|rock|pump|party|upbeat|hype|power/i},
 {k:'odak',e:'🎯',n:'Odak',q:['lofi focus','instrumental study','deep focus'],kw:/lofi|lo-fi|focus|study|instrumental|piano|ambient|beats/i},
 {k:'huzun',e:'😢',n:'Hüzünlü',q:['sad songs','melancholy','heartbreak'],kw:/sad|hüzün|melanchol|heartbreak|cry|lonely|miss|hurt|acı|ayrılık|gözyaşı/i},
 {k:'eglence',e:'🎉',n:'Eğlenceli',q:['party hits','happy songs','feel good'],kw:/party|happy|fun|dance|disco|summer|eğlen|feel good|hit/i},
 {k:'gece',e:'🌙',n:'Gece',q:['night drive','synthwave','late night chill'],kw:/night|gece|midnight|moon|dark|synthwave|dream|late/i},
 {k:'yuruyus',e:'🚶',n:'Yürüyüş',q:['walking playlist','indie pop','road trip'],kw:/walk|road|indie|journey|run|yol|sun|morning/i}];
window.kediModes=MODES.map(({k,e,n})=>({k,e,n}));
const kmGet=n=>{try{return JSON.parse(localStorage.getItem(n)||'{}')||{}}catch{return{}}},kmSet=(n,v)=>{try{localStorage.setItem(n,JSON.stringify(v))}catch{}};
window.kediMoodSet=k=>kmSet('km',{k,t:Date.now()});
window.kediMoodNo=(k,t)=>{const f=kmGet('mf');(f[k]=f[k]||{})[t.id]=-1;kmSet('mf',f)};
function moodLearn(t){const a=kmGet('km');if(!a.k||Date.now()-a.t>6*36e5)return;const h=kmGet('mh');const o=h[a.k]=h[a.k]||{};o[t.id]=(o[t.id]||0)+1;kmSet('mh',h)}
const moodCache={};
async function moodPool(k){const c=moodCache[k];if(c&&Date.now()-c.t<3e5)return c.l;
 const M=MODES.find(m=>m.k==k),h=kmGet('mh')[k]||{};let ts=[];try{ts=await all('tracks')}catch{}
 const sc=t=>(h[t.id]||0)*3+(M.kw.test((t.title||'')+' '+(t.artist||''))?2:0),loc=ts.filter(t=>t&&t.id&&sc(t)>=2).map(t=>[sc(t)+Math.random(),t]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
 let ext=[];if(loc.length<18){const qs=[...M.q].sort(()=>Math.random()-.5).slice(0,2);
  const rs=await Promise.allSettled(qs.flatMap(q=>[S.youtube(q,0)]));
  ext=rs.flatMap(r=>r.status=='fulfilled'?r.value:[]).sort(()=>Math.random()-.5)}
 const seen=new Set(),l=[...loc,...ext].filter(t=>t&&t.id&&!seen.has(t.id)&&seen.add(t.id));moodCache[k]={t:Date.now(),l};return l}
const okMap=new Map();
const probe=t=>new Promise(ok=>{const u=srcUrl(t);if(!u)return ok(false);const a=new Audio();a.preload='metadata';let d=0;const f=v=>{if(d)return;d=1;clearTimeout(tm);a.removeAttribute('src');a.load();ok(v)},tm=setTimeout(()=>f(false),6000);a.onloadedmetadata=()=>f(true);a.onerror=()=>f(false);a.src=u});
async function usable(list,n){const out=[];
 for(let i=0;i<list.length&&out.length<n;i+=10){const ch=list.slice(i,i+10).filter(t=>!okMap.has(t.id)||okMap.get(t.id));
  const yv=ch.filter(t=>t.yid&&!okMap.has(t.id)),yok=yv.length?await ytEmbeddableSet(yv):null;
  const rs=await Promise.all(ch.map(async t=>{if(okMap.has(t.id))return okMap.get(t.id);let v;
   if(t.yid)v=yok?yok.has(t.yid):true;else{const b=await get('blobs',t.id).catch(()=>0);v=b?true:(navigator.onLine?await probe(t):false)}
   okMap.set(t.id,v);return v}));
  ch.forEach((t,j)=>{if(rs[j]&&out.length<n)out.push(t)})}
 return out}
window.kediMood=async(k,skip=[])=>{const f=kmGet('mf')[k]||{},cur=queue&&queue[idx]&&queue[idx].id,pool=(await moodPool(k)).filter(t=>!(f[t.id]<0)&&!skip.includes(t.id)&&t.id!=cur);
 if(!pool.length)return null;const top=pool.slice(0,8).sort(()=>Math.random()-.5),[t]=await usable([...top,...pool.slice(8,30)],1);
 return t?{t,pool:pool.filter(x=>x.id!=t.id)}:null};
window.kediMoodList=async(k,r)=>{const M=MODES.find(m=>m.k==k);toast(`${M.e} ${M.n} listesi hazırlanıyor…`);
 const tr=[r.t,...await usable(r.pool,17)],l={id:'mood-'+k,name:`${M.e} Bugünün listesi – ${M.n}`,ids:[]};
 await addTo(l,tr);toast(`${M.e} ${M.n} listesi hazır (${tr.length} şarkı)`);play(tr,0)};

