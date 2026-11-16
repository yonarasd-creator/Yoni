// Tema sistemi, logo seçimi, arka plan
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
// ================= Tema sistemi =================
const PRE=[{n:'Gece',t:{a:'#1db6a0',c:'#111111',s:'#1c1c1e',x:'#f2f2f2'}},{n:'Mor',t:{a:'#a78bfa',c:'#14101f',s:'#211a33',x:'#f1ecff'}},{n:'Okyanus',t:{a:'#38bdf8',c:'#0b1622',s:'#12263a',x:'#e8f4ff'}},{n:'Gün batımı',t:{a:'#fb923c',c:'#1a1210',s:'#2a1c18',x:'#fff1e8'}},{n:'Açık',t:{a:'#0d9488',c:'#f4f4f5',s:'#ffffff',x:'#18181b'}},{n:'Siyah',t:{a:'#ffffff',c:'#000000',s:'#141414',x:'#ffffff'}},{n:'Muify',t:{a:'#f59e0b',c:'#150c24',s:'#2a1a44',x:'#f6efff'}}];
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
const DT={...PRE[0].t,r:12,fs:15,dim:30,op:80,bl:0,m:'',p:false,lg:'varsayilan',kd:true,kl:['zencefil']};let TH={...DT},bgUrl=null,raf=0,sy=0;
const HEXR=/^#[0-9a-f]{6}$/i;
function applyVars(th){
 const R=document.documentElement,st=R.style,op=th.m?th.op:100;
 st.setProperty('--a',th.a);st.setProperty('--bg',th.c);st.setProperty('--bgs',th.c);st.setProperty('--t',th.x);
 st.setProperty('--s',`color-mix(in srgb, ${th.s} ${op}%, transparent)`);st.setProperty('--m',`color-mix(in srgb, ${th.x} 55%, ${th.c})`);
 st.setProperty('--r',th.r+'px');st.setProperty('--fs',th.fs+'px');st.setProperty('--dim',th.dim/100);st.setProperty('--bl',th.bl+'px');
 R.classList.toggle('bl',th.bl>0);document.querySelector('meta[name=theme-color]').content=th.c;applyLogo(th);window.Kedi&&Kedi.sync(th)}
async function setBg(th){
 const bg=$('#bg');bg.innerHTML='<i></i>';if(bgUrl){URL.revokeObjectURL(bgUrl);bgUrl=null}
 if(!th.m)return;const b=await get('blobs','bg:media');if(!b){TH.m='';applyVars(TH);return}
 bgUrl=URL.createObjectURL(b.blob);const e=document.createElement(th.m=='video'?'video':'img');e.src=bgUrl;
 if(th.m=='video'){e.muted=e.loop=e.playsInline=true;e.disablePictureInPicture=true;e.preload='auto';vidPlay(e)}
 bg.prepend(e)}
const calm=()=>TH.p||matchMedia('(prefers-reduced-motion: reduce)').matches;
const vidPlay=v=>{if(!calm()&&!document.hidden)v.play().catch(()=>{});else v.pause()};
document.addEventListener('visibilitychange',()=>{const v=$('#bg video');v&&vidPlay(v)});
function loadTheme(){TH={...DT,...(lsGet('theme')||{})};applyVars(TH);setBg(TH)}
function saveTheme(){lsSet('theme',TH);clearTimeout(sy);sy=setTimeout(()=>ME&&!offline&&api('PATCH','/me',{theme:TH}).catch(()=>{}),1000)}
async function toBlob(f,max){const b=await createImageBitmap(f),k=Math.min(1,max/Math.max(b.width,b.height)),c=document.createElement('canvas');c.width=Math.round(b.width*k);c.height=Math.round(b.height*k);c.getContext('2d').drawImage(b,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,'image/webp',.85))}
function vTheme(){
 const c=(k,l)=>`<label class="f">${l}<input type="color" data-k="${k}" value="${TH[k]}"></label>`,r=(k,l,a,b)=>`<label class="f">${l}<input type="range" data-k="${k}" min="${a}" max="${b}" value="${TH[k]}"></label>`;
 M.innerHTML=`<div id="tc"><h4 style="margin-top:0">Hazır temalar</h4><div class="chips">${PRE.map((p,i)=>`<button class="chip" data-p="${i}" style="border-left:14px solid ${p.t.a}">${p.n}</button>`).join('')}</div>
 <h4>Logo</h4><div class="chips">${LOGOS.map(l=>`<button class="chip" data-lg="${l.id}" aria-label="Logo" style="padding:4px;display:inline-flex${TH.lg==l.id?';outline:2px solid var(--a)':''}"><img src="${l.f}" alt="" style="width:64px;height:64px;border-radius:10px;display:block"></button>`).join('')}</div>
 <h4>YouTube hesabı ▶</h4><div id="ytb" style="margin-bottom:6px"></div>
 <h4>Kediler 🐱</h4><label class="f">Kedileri göster<input type="checkbox" data-k="kd" ${TH.kd!==false?'checked':''}></label>
 <div class="chips">${(()=>{const KL=TH.kl&&TH.kl.length?TH.kl:['zencefil'];return Kedi.types.map(([id,n])=>`<button class="chip" data-cat="${id}" aria-pressed="${KL.includes(id)}" title="${n}" style="padding:6px 8px;display:inline-flex;flex-direction:column;align-items:center;gap:2px${KL.includes(id)?';outline:2px solid var(--a)':''}"><img src="${KediArt.thumb(id)}" alt="" width="96" height="84" style="display:block;image-rendering:pixelated"><small>${n}</small></button>`).join('')})()}</div>
 <p class="muted" style="font-size:13px">En fazla 3 kedi seçebilirsin. Üzerine gelince sevebilirsin 💗 Kediler tıklamanı engellemez. <button class="btn g" id="kfare" style="margin-left:4px">🐭 Fare çıkar</button></p>
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
 tc.onclick=e=>{if(e.target.closest('#kfare')){Kedi.mouse();return}const ct=e.target.closest('[data-cat]');if(ct){const id=ct.dataset.cat;let l=TH.kl&&TH.kl.length?[...TH.kl]:['zencefil'];if(l.includes(id)){if(l.length>1)l=l.filter(x=>x!=id)}else{if(l.length>=Kedi.max)l.shift();l.push(id)}TH.kl=l;if(TH.kd===false)TH.kd=true;Kedi.sync(TH);saveTheme();vTheme();return}const lg=e.target.closest('[data-lg]');if(lg){openLogo(lg.dataset.lg);return}const p=e.target.closest('[data-p]');if(p){Object.assign(TH,PRE[p.dataset.p].t);applyVars(TH);saveTheme();vTheme()}};
 $('#bu').onclick=()=>$('#bf').click();
 $('#bf').onchange=async e=>{const f=e.target.files[0];if(!f)return;
  try{let blob=f,m='image';if(f.type.startsWith('video')){m='video';if(f.size>40e6)return toast('Video en fazla 40 MB olmalı (akıcılık için)')}else blob=await toBlob(f,1920);
   await put('blobs',{id:'bg:media',blob});TH.m=m;await setBg(TH);applyVars(TH);saveTheme();toast('Arka plan ayarlandı ✓')}catch{toast('Dosya okunamadı')}};
 $('#br').onclick=async()=>{await del('blobs','bg:media');TH.m='';await setBg(TH);applyVars(TH);saveTheme()};
 $('#ex').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({...TH,m:''})],{type:'application/json'}));a.download='yoni-tema.json';a.click()};
 $('#im').onclick=()=>$('#tf').click();
 $('#tf').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text());for(const k of Object.keys(DT)){if(k=='m'||!(k in j))continue;if(['a','c','s','x'].includes(k)?HEXR.test(j[k]):typeof j[k]==typeof DT[k])TH[k]=j[k]}applyVars(TH);saveTheme();vTheme();toast('Tema yüklendi ✓')}catch{toast('Geçersiz tema dosyası')}}}

