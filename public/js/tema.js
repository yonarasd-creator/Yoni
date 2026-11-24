// Tema sistemi, logo seçimi, arka plan
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
// ================= Tema sistemi =================
const PRE=[{n:'Gece',t:{a:'#1db6a0',c:'#111111',s:'#1c1c1e',x:'#f2f2f2'}},{n:'Mor',t:{a:'#a78bfa',c:'#14101f',s:'#211a33',x:'#f1ecff'}},{n:'Okyanus',t:{a:'#38bdf8',c:'#0b1622',s:'#12263a',x:'#e8f4ff'}},{n:'Gün batımı',t:{a:'#fb923c',c:'#1a1210',s:'#2a1c18',x:'#fff1e8'}},{n:'Açık',t:{a:'#0d9488',c:'#f4f4f5',s:'#ffffff',x:'#18181b'}},{n:'Siyah',t:{a:'#ffffff',c:'#000000',s:'#141414',x:'#ffffff'}},{n:'Muify',t:{a:'#f59e0b',c:'#150c24',s:'#2a1a44',x:'#f6efff'}},{n:'Kuzeyin Kışı',t:{a:'#9cc7e8',c:'#0c1118',s:'#16202b',x:'#eaf2f8',r:10,op:58,fx:'kar',kd:true,kl:['kurtgri','kurtbeyaz','kurtkara']}},{n:'Kızıl Ejderhalar',t:{a:'#e0562e',c:'#120a09',s:'#241512',x:'#f7ece6',r:10,op:58,fx:'kor',kd:true,kl:['ejderkizil','ejderkara','ejderaltin']}}];
// Yeni logo eklemek için dosyayı public/logos/ klasörüne koy, buraya bir satır ekle: {id:'benim',f:'logos/dosya.png'}
const LOGOS=[{id:'varsayilan',f:'icon.png'},{id:'logo-1',f:'logos/logo-1.png'},{id:'logo-2',f:'logos/logo-2.png'},{id:'logo-3',f:'logos/logo-3.png'},{id:'logo-4',f:'logos/logo-4.png'},{id:'logo-5',f:'logos/logo-5.png'},{id:'logo-6',f:'logos/logo-6.png'},{id:'logo-7',f:'logos/logo-7.png'}];
function applyLogo(th){const L=LOGOS.find(l=>l.id==th.lg)||LOGOS[0];const ic=document.querySelector('link[rel=icon]'),ap=document.querySelector('link[rel=apple-touch-icon]'),b=document.getElementById('brand');ic&&(ic.href=L.f);ap&&(ap.href=L.f);b&&(b.src=L.f)}

// Logo önizleme: küçük resme tıklayınca büyür, ‹ › ile gezilir, "Bunu seç" ile uygulanır
function openLogo(id){
 if(document.getElementById('lgv'))return;
 let i=Math.max(0,LOGOS.findIndex(l=>l.id==id));
 const o=document.createElement('div');o.id='lgv';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Logo önizleme');
 o.innerHTML='<div class="lgbox"><button class="lgn" data-d="-1" aria-label="Önceki logo">‹</button><div class="lgc"><img alt=""><div class="lgt"></div></div><button class="lgn" data-d="1" aria-label="Sonraki logo">›</button><div class="lgb"><button class="lgx">Kapat</button><button class="lgs">Bunu seç</button></div></div>';
 document.body.appendChild(o);
 const im=o.querySelector('img'),tt=o.querySelector('.lgt'),sb=o.querySelector('.lgs');
 const name=l=>l.id=='varsayilan'?'Varsayılan':'Logo '+l.id.replace('logo-','');
 const show=()=>{const l=LOGOS[i];im.src=l.f;tt.textContent=name(l)+'  ·  '+(i+1)+' / '+LOGOS.length;const on=TH.lg==l.id||(!TH.lg&&i==0);sb.textContent=on?'Seçili ✓':'Bunu seç';sb.disabled=on};
 const close=()=>{document.removeEventListener('keydown',key,true);o.classList.add('out');setTimeout(()=>o.remove(),160)};
 const go=d=>{i=(i+d+LOGOS.length)%LOGOS.length;show()};
 const pick=()=>{if(sb.disabled)return;TH.lg=LOGOS[i].id;applyLogo(TH);saveTheme();document.getElementById('tc')&&vTheme();close()};
 const key=e=>{if(e.key=='Escape'){e.stopPropagation();close()}else if(e.key=='ArrowLeft'){e.preventDefault();go(-1)}else if(e.key=='ArrowRight'){e.preventDefault();go(1)}};
 document.addEventListener('keydown',key,true);
 o.onclick=e=>{if(e.target===o)return close();const n=e.target.closest('.lgn');if(n)return go(+n.dataset.d);if(e.target.closest('.lgx'))return close();if(e.target.closest('.lgs'))pick()};
 show();sb.focus();
}
const DT={...PRE[0].t,fx:'',r:12,fs:15,dim:30,op:80,bl:0,m:'',p:false,lg:'varsayilan',kd:true,kl:['zencefil']};let TH={...DT},bgUrl=null,raf=0,sy=0;
const HEXR=/^#[0-9a-f]{6}$/i;
function applyVars(th){
 const R=document.documentElement,st=R.style,op=(th.m||th.fx)?th.op:100;
 st.setProperty('--a',th.a);st.setProperty('--bg',th.c);st.setProperty('--bgs',th.c);st.setProperty('--t',th.x);
 st.setProperty('--s',`color-mix(in srgb, ${th.s} ${op}%, transparent)`);st.setProperty('--m',`color-mix(in srgb, ${th.x} 55%, ${th.c})`);
 st.setProperty('--r',th.r+'px');st.setProperty('--fs',th.fs+'px');st.setProperty('--dim',th.dim/100);st.setProperty('--bl',th.bl+'px');
 startFx(th.fx);R.classList.toggle('fx',!!th.fx);R.classList.toggle('bl',th.bl>0);document.querySelector('meta[name=theme-color]').content=th.c;applyLogo(th);window.Kedi&&Kedi.sync(th)}
async function setBg(th){
 const bg=$('#bg');bg.innerHTML='<i></i>';startFx(th.fx);if(bgUrl){URL.revokeObjectURL(bgUrl);bgUrl=null}
 if(!th.m)return;const b=await get('blobs','bg:media');if(!b){TH.m='';applyVars(TH);return}
 bgUrl=URL.createObjectURL(b.blob);const e=document.createElement(th.m=='video'?'video':'img');e.src=bgUrl;
 if(th.m=='video'){e.muted=e.loop=e.playsInline=true;e.disablePictureInPicture=true;e.preload='auto';vidPlay(e)}
 bg.prepend(e)}
const calm=()=>TH.p||matchMedia('(prefers-reduced-motion: reduce)').matches;
const vidPlay=v=>{if(!calm()&&!document.hidden)v.play().catch(()=>{});else v.pause()};
document.addEventListener('visibilitychange',()=>{const v=$('#bg video');v&&vidPlay(v)});
function loadTheme(){TH={...DT,...(lsGet('theme')||{})};applyVars(TH);setBg(TH);loadOzel()}
function saveTheme(){lsSet('theme',TH);clearTimeout(sy);sy=setTimeout(()=>ME&&!offline&&api('PATCH','/me',{theme:TH}).catch(()=>{}),1000)}
async function toBlob(f,max){const b=await createImageBitmap(f),k=Math.min(1,max/Math.max(b.width,b.height)),c=document.createElement('canvas');c.width=Math.round(b.width*k);c.height=Math.round(b.height*k);c.getContext('2d').drawImage(b,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,'image/webp',.85))}
function vTheme(){
 const c=(k,l)=>`<label class="f">${l}<input type="color" data-k="${k}" value="${TH[k]}"></label>`,r=(k,l,a,b)=>`<label class="f">${l}<input type="range" data-k="${k}" min="${a}" max="${b}" value="${TH[k]}"></label>`;
 M.innerHTML=`<div id="tc"><h4 style="margin-top:0">Hazır temalar</h4><div class="chips">${PRE.map((p,i)=>`<button class="chip" data-p="${i}" style="border-left:14px solid ${p.t.a}">${p.n}</button>`).join('')}</div>
 <h4>Logo</h4><div class="chips">${LOGOS.map(l=>`<button class="chip" data-lg="${l.id}" aria-label="Logo" style="padding:4px;display:inline-flex${TH.lg==l.id?';outline:2px solid var(--a)':''}"><img src="${l.f}" alt="" style="width:64px;height:64px;border-radius:10px;display:block"></button>`).join('')}</div>
 <h4>YouTube hesabı ▶</h4><div id="ytb" style="margin-bottom:6px"></div>
 <h4>Yoldaşlar: kedi, kurt, ejderha</h4><label class="f">Yoldaşları göster<input type="checkbox" data-k="kd" ${TH.kd!==false?'checked':''}></label>
 <div class="chips">${(()=>{const KL=TH.kl&&TH.kl.length?TH.kl:['zencefil'];return Kedi.types.map(([id,n])=>`<button class="chip" data-cat="${id}" aria-pressed="${KL.includes(id)}" title="${n}" style="padding:6px 8px;display:inline-flex;flex-direction:column;align-items:center;gap:2px${KL.includes(id)?';outline:2px solid var(--a)':''}"><img src="${KediArt.thumb(id)}" alt="" width="96" height="84" style="display:block;image-rendering:pixelated"><small>${n}</small></button>`).join('')})()}</div>
 <div style="margin:6px 0"><button class="btn g" id="oz">${ic('plus')} Kendi görselini ekle</button><input type="file" id="ozf" accept="image/*" hidden> ${(lsGet('ozel')||[]).map(o=>`<button class="chip" data-ozdel="${esc(o.id)}" title="Kaldır">${esc(o.name)} ${ic('close')}</button>`).join('')}</div>
 <p class="muted" style="font-size:12px">Eklediğin görsel yalnızca bu cihazda saklanır. Arka planı düz renkse kendiliğinden silinir; yazısız, tek bir figür içeren resim en iyisi.</p>
 <p class="muted" style="font-size:13px">En fazla 3 yoldaş seçebilirsin. Üzerine gelince sevebilirsin 💗 Kediler tıklamanı engellemez. <button class="btn g" id="kfare" style="margin-left:4px">🐭 Fare çıkar</button></p>
 <h4>Renkler</h4>${c('a','Vurgu rengi')}${c('c','Arka plan')}${c('s','Kart / panel')}${c('x','Yazı')}
 <h4>Görünüm</h4>${r('r','Köşe yuvarlaklığı',0,28)}${r('fs','Yazı boyutu',13,19)}
 <h4>Arka plan görseli / videosu</h4><button class="btn g" id="bu">📷 Görsel veya video seç</button> <button class="btn g" id="br">Kaldır</button><input type="file" id="bf" accept="image/*,video/mp4,video/webm" hidden>
 ${r('dim','Karartma',0,80)}${r('op','Panel opaklığı',30,100)}${r('bl','Bulanıklık (yavaşlatabilir)',0,20)}
 <label class="f">Video hareketsiz (pil tasarrufu)<input type="checkbox" data-k="p" ${TH.p?'checked':''}></label>
 <p class="muted" style="font-size:13px">Arka plan dosyası yalnızca bu cihazda saklanır; renkler ve ayarlar hesabına kaydedilir. Uygulama arka plana geçince video otomatik durur.</p>
 <button class="btn g" id="ex">⬇ Temayı dışa aktar</button> <button class="btn g" id="im">⬆ İçe aktar</button><input type="file" id="tf" accept=".json" hidden></div>`;
 const tc=$('#tc');
 tc.oninput=e=>{const k=e.target.dataset.k;if(!k)return;TH[k]=e.target.type=='checkbox'?e.target.checked:e.target.type=='range'?+e.target.value:e.target.value;
  cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{applyVars(TH);const v=$('#bg video');v&&vidPlay(v)})};
 tc.onchange=e=>{if(e.target.dataset.k)saveTheme()};
 ytCard();
 tc.onclick=e=>{if(e.target.closest('#kfare')){Kedi.mouse();return}const ct=e.target.closest('[data-cat]');if(ct){const id=ct.dataset.cat;let l=TH.kl&&TH.kl.length?[...TH.kl]:['zencefil'];if(l.includes(id)){if(l.length>1)l=l.filter(x=>x!=id)}else{if(l.length>=Kedi.max)l.shift();l.push(id)}TH.kl=l;if(TH.kd===false)TH.kd=true;Kedi.sync(TH);saveTheme();vTheme();return}const od=e.target.closest('[data-ozdel]');if(od){ozelSil(od.dataset.ozdel);return}const lg=e.target.closest('[data-lg]');if(lg){openLogo(lg.dataset.lg);return}const p=e.target.closest('[data-p]');if(p){Object.assign(TH,{fx:''},PRE[p.dataset.p].t);applyVars(TH);saveTheme();vTheme()}};
 $('#oz').onclick=()=>$('#ozf').click();
 $('#ozf').onchange=async e=>{const f=e.target.files[0];if(f)await ozelEkle(f)};
 $('#bu').onclick=()=>$('#bf').click();
 $('#bf').onchange=async e=>{const f=e.target.files[0];if(!f)return;
  try{let blob=f,m='image';if(f.type.startsWith('video')){m='video';if(f.size>40e6)return toast('Video en fazla 40 MB olmalı (akıcılık için)')}else blob=await toBlob(f,1920);
   await put('blobs',{id:'bg:media',blob});TH.m=m;await setBg(TH);applyVars(TH);saveTheme();toast('Arka plan ayarlandı ✓')}catch{toast('Dosya okunamadı')}};
 $('#br').onclick=async()=>{await del('blobs','bg:media');TH.m='';await setBg(TH);applyVars(TH);saveTheme()};
 $('#ex').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({...TH,m:''})],{type:'application/json'}));a.download='yoni-tema.json';a.click()};
 $('#im').onclick=()=>$('#tf').click();
 $('#tf').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text());for(const k of Object.keys(DT)){if(k=='m'||!(k in j))continue;if(['a','c','s','x'].includes(k)?HEXR.test(j[k]):typeof j[k]==typeof DT[k])TH[k]=j[k]}applyVars(TH);saveTheme();vTheme();toast('Tema yüklendi ✓')}catch{toast('Geçersiz tema dosyası')}}}


// ---- Tema arka plan efektleri (kod ile çizilir; dosya/telif yok): 'kar' = yağan kar + dağ siluetleri, 'kor' = yükselen kıvılcım + volkan silueti
let fxC=null,fxK='',fxRaf=0,fxP=[],fxR=null;
function stopFx(){cancelAnimationFrame(fxRaf);fxRaf=0;fxC&&fxC.remove();fxC=null;fxK='';fxP=[];fxR=null;window.removeEventListener('resize',fxSize)}
function fxSize(){if(!fxC)return;const d=Math.min(devicePixelRatio||1,1.5),w=innerWidth,h=innerHeight;fxC.width=Math.round(w*d);fxC.height=Math.round(h*d);fxC.dataset.d=d;fxR=ridges(fxK,fxC.width,fxC.height)}
function ridges(k,w,h){ // statik silüet katmanları: bir kez çizilir
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
 const layer=(base,amp,fr,col,seed)=>{x.fillStyle=col;x.beginPath();x.moveTo(0,h);for(let i=0;i<=w;i+=6){const t=i/w*fr;x.lineTo(i,h*base-amp*h*(Math.sin(t*6.28+seed)*.5+Math.sin(t*15.7+seed*2)*.28+Math.sin(t*37+seed*3)*.12+.4))}x.lineTo(w,h);x.fill()};
 if(k=='kar'){layer(.8,.16,1.3,'rgba(30,44,60,.55)',1);layer(.9,.12,1.8,'rgba(14,21,30,.8)',4);const g=x.createLinearGradient(0,h*.7,0,h);g.addColorStop(0,'rgba(170,200,230,0)');g.addColorStop(1,'rgba(170,200,230,.10)');x.fillStyle=g;x.fillRect(0,h*.7,w,h*.3)}
 else{layer(.82,.2,1.1,'rgba(40,16,12,.7)',2);layer(.92,.1,1.6,'rgba(18,8,6,.9)',5);const g=x.createRadialGradient(w*.5,h,0,w*.5,h,h*.8);g.addColorStop(0,'rgba(224,86,46,.22)');g.addColorStop(1,'rgba(224,86,46,0)');x.fillStyle=g;x.fillRect(0,0,w,h)}
 return c}
function startFx(kind){
 if(kind!='kar'&&kind!='kor'||calm()){stopFx();return}
 if(fxC&&fxC.isConnected&&fxK==kind)return;
 stopFx();const bg=$('#bg');if(!bg)return;
 fxK=kind;fxC=document.createElement('canvas');fxC.setAttribute('aria-hidden','true');fxC.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
 bg.insertBefore(fxC,bg.querySelector('i'));fxSize();window.addEventListener('resize',fxSize);
 const n=kind=='kar'?90:55,mk=()=>kind=='kar'?{x:Math.random(),y:Math.random(),r:.6+Math.random()*1.8,v:.0004+Math.random()*.0009,s:Math.random()*6.28,a:.35+Math.random()*.5}
  :{x:Math.random(),y:.6+Math.random()*.5,r:.7+Math.random()*1.6,v:.0003+Math.random()*.0008,s:Math.random()*6.28,a:.4+Math.random()*.6};
 fxP=Array.from({length:n},mk);let last=0;
 const loop=t=>{fxRaf=requestAnimationFrame(loop);if(document.hidden||t-last<33)return;const dt=Math.min(t-last,100);last=t;
  const x=fxC.getContext('2d'),w=fxC.width,h=fxC.height,d=+fxC.dataset.d||1;x.clearRect(0,0,w,h);fxR&&x.drawImage(fxR,0,0);
  for(const p of fxP){
   if(kind=='kar'){p.y+=p.v*dt;p.x+=Math.sin(t/1800+p.s)*.00018*dt;if(p.y>1.02){p.y=-.02;p.x=Math.random()}x.fillStyle='rgba(235,245,255,'+p.a+')'}
   else{p.y-=p.v*dt;p.x+=Math.sin(t/900+p.s)*.00022*dt;if(p.y<-.03){Object.assign(p,mk(),{y:1.02})}const f=.6+.4*Math.sin(t/220+p.s);x.fillStyle='rgba('+(255)+','+(140+90*f|0)+','+(40+30*f|0)+','+(p.a*(.5+.5*p.y)).toFixed(2)+')'}
   x.beginPath();x.arc((p.x%1)*w,p.y*h,p.r*d,0,6.283);x.fill()}};
 fxRaf=requestAnimationFrame(loop)}

// ---- Kullanıcının kendi yoldaş görselleri: seçilen resim cihazda saklanır (projeye/sürüme girmez)
async function ozelHazirla(file){
 const bm=await createImageBitmap(file),k=Math.min(1,256/Math.max(bm.width,bm.height)),w=Math.max(1,bm.width*k|0),h=Math.max(1,bm.height*k|0);
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(bm,0,0,w,h);
 const im=x.getImageData(0,0,w,h),d=im.data,P=(px,py)=>(py*w+px)*4,corners=[P(0,0),P(w-1,0),P(0,h-1),P(w-1,h-1)];
 if(corners.every(i=>d[i+3]>200)){ // arka planı sil: köşe rengine yakın ve kenardan ulaşılan pikseller
  const bg=[0,1,2].map(j=>corners.reduce((a,i)=>a+d[i+j],0)/4),near=i=>Math.hypot(d[i]-bg[0],d[i+1]-bg[1],d[i+2]-bg[2])<46,seen=new Uint8Array(w*h),st=[];
  for(let i=0;i<w;i++){st.push(i,w*(h-1)+i)}for(let j=0;j<h;j++){st.push(j*w,j*w+w-1)}
  while(st.length){const p=st.pop();if(seen[p])continue;const i=p*4;if(!near(i))continue;seen[p]=1;d[i+3]=0;const px=p%w,py=p/w|0;if(px>0)st.push(p-1);if(px<w-1)st.push(p+1);if(py>0)st.push(p-w);if(py<h-1)st.push(p+w)}
  x.putImageData(im,0,0)}
 let x0=w,y0=h,x1=-1,y1=-1;for(let py=0;py<h;py++)for(let px=0;px<w;px++)if(d[P(px,py)+3]>10){if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py}
 if(x1<0)throw new Error('bos');const o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1-y0+1;o.getContext('2d').drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height);return o}
async function ozelEkle(file){
 try{const cv=await ozelHazirla(file),blob=await new Promise(r=>cv.toBlob(r,'image/png')),L=lsGet('ozel')||[];if(L.length>=6)return toast('En fazla 6 kendi görsel ekleyebilirsin');
  const id='oz'+Array.from({length:6},()=>String.fromCharCode(97+Math.random()*26|0)).join(''),name=(file.name||'Görsel').replace(/\.[^.]+$/,'').slice(0,14)||'Görsel';
  await put('blobs',{id:'yol:'+id,blob});L.push({id,name});lsSet('ozel',L);KediArt.addCustom(id,name,cv);Kedi.addType(id);
  TH.kl=[...(TH.kl&&TH.kl.length?TH.kl:['zencefil']).slice(-(Kedi.max-1)),id];if(TH.kd===false)TH.kd=true;Kedi.sync(TH);saveTheme();vTheme();toast('Eklendi ✓')}
 catch{toast('Görsel okunamadı')}}
async function ozelSil(id){
 await del('blobs','yol:'+id).catch(()=>{});lsSet('ozel',(lsGet('ozel')||[]).filter(o=>o.id!=id));KediArt.removeCustom(id);Kedi.delType(id);
 TH.kl=(TH.kl||[]).filter(x=>x!=id);if(!TH.kl.length)TH.kl=['zencefil'];Kedi.sync(TH);saveTheme();vTheme()}
async function loadOzel(){
 try{for(const o of lsGet('ozel')||[]){const b=await get('blobs','yol:'+o.id);if(!b)continue;KediArt.addCustom(o.id,o.name,await createImageBitmap(b.blob));Kedi.addType(o.id)}
  if((lsGet('ozel')||[]).length)Kedi.sync(TH)}catch{}}
