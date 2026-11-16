// Hesap, giriş, arkadaşlar, sohbet, profil, kırpma penceresi
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
// ================= Hesap, sosyal, profil =================
let ME=null,ws=null,offline=false,chatWith=null,FR={friends:[],incoming:[],outgoing:[]},UNR={},ctr=[];
const api=async(m,u,b)=>{const r=await fetch('/api'+u,{method:m,headers:b?{'Content-Type':'application/json'}:{},body:b?JSON.stringify(b):undefined});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Hata');return j};
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}},lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v))}catch{}};
const AV=u=>u.avatar||PH;
const isVid=u=>/\.(mp4|webm)(\?|$)/i.test(u||''),fitSt=f=>Array.isArray(f)?`object-position:${f[0]}% ${f[1]}%;transform:scale(${f[2]});transform-origin:${f[0]}% ${f[1]}%`:'',
banStyle=u=>u.banner&&!isVid(u.banner)&&!u.bfit?`background-image:url(${esc(cssUrl(u.banner))})`:`background:${esc(u.color)}`,
banIn=u=>!u.banner?'':isVid(u.banner)?`<video src="${esc(u.banner)}" autoplay muted loop playsinline style="${fitSt(u.bfit)}"></video>`:u.bfit?`<img src="${esc(u.banner)}" alt="" style="${fitSt(u.bfit)}">`:'',
avLg=(u,id)=>u.afit?`<div class="av lg avf"${id?` id="${id}"`:''}><img src="${esc(AV(u))}" alt="" style="${fitSt(u.afit)}"></div>`:`<img class="av lg"${id?` id="${id}"`:''} src="${esc(AV(u))}" alt="">`;
async function boot(){
 loadTheme();
 try{ME=(await api('GET','/me')).user;lsSet('me',ME);if(ME.theme&&!lsGet('theme')){Object.assign(TH,ME.theme);lsSet('theme',TH);applyVars(TH);setBg(TH)}}
 catch(e){if(e instanceof TypeError){ME=lsGet('me');offline=true}else ME=null}
 if(ME||offline)start();else showAuth()}
function start(){$('#auth').hidden=true;if(ME&&!offline){connectWS();loadFR()}renderTop();show('home')}
function showAuth(){
 const a=$('#auth');a.hidden=false;let reg=false;
 const draw=()=>{a.innerHTML=`<div class="card" style="width:min(92vw,360px)"><h2 style="margin:0 0 4px">🎵 Yoni</h2><p class="muted" style="margin:0 0 12px">${reg?'Hesap oluştur':'Giriş yap'}</p>
 <input type="text" id="lu" placeholder="Kullanıcı adı" autocapitalize="off" autocomplete="username"><input type="password" id="lp" placeholder="Şifre" autocomplete="${reg?'new-password':'current-password'}">
 <button class="btn" id="go" style="width:100%">${reg?'Kayıt ol':'Giriş yap'}</button><p id="er" style="color:#f66;min-height:1.2em;margin:8px 0"></p>
 <a href="#" id="sw" style="color:var(--a)">${reg?'Zaten hesabım var':'Hesap oluştur'}</a><br><br><button class="btn g" id="of" style="width:100%">Hesapsız devam et</button></div>`;
  $('#sw').onclick=e=>{e.preventDefault();reg=!reg;draw()};
  $('#of').onclick=()=>{ME=null;offline=true;start()};
  const go=async()=>{try{ME=(await api('POST',reg?'/register':'/login',{username:$("#lu").value,password:$("#lp").value})).user;offline=false;lsSet('me',ME);if(ME.theme){Object.assign(TH,ME.theme);lsSet('theme',TH);applyVars(TH);setBg(TH)}start()}catch(e){$('#er').textContent=e instanceof TypeError?'Sunucuya ulaşılamıyor':e.message}};
  $('#go').onclick=go;$("#lp").onkeydown=e=>{if(e.key=='Enter')go()}};
 draw()}
function connectWS(){
 if(!ME||offline||ws)return;
 ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host+'/ws');
 ws.onopen=()=>{if(queue[idx])try{ws.send(JSON.stringify({type:'np',np:{title:queue[idx].title,artist:queue[idx].artist}}))}catch{}};
 ws.onmessage=e=>{const d=JSON.parse(e.data);
  if(d.type=='msg'){const o=d.m.from==ME.username?d.m.to:d.m.from;
   if(chatWith==o){addMsg(d.m);if(d.m.from==o)api('GET','/messages/'+o).catch(()=>{})}
   else if(d.m.from!=ME.username){UNR[o]=(UNR[o]||0)+1;badge();toast('💬 '+o+': '+(d.m.text||'🎵 şarkı gönderdi'))}}
  else loadFR()};
 ws.onclose=()=>{ws=null;if(ME&&!offline)setTimeout(connectWS,3000)}}
const badge=()=>{const n=Object.values(UNR).reduce((a,b)=>a+b,0);document.querySelector('[data-v=soc]').innerHTML='💬 Sosyal'+(n?`<span class="bd">${n}</span>`:'')};
async function loadFR(){try{FR=await api('GET','/friends');UNR=await api('GET','/unread');badge();if(view=='soc'&&!chatWith)vSoc()}catch{}}
async function vSoc(){
 if(!ME)return M.innerHTML='<p class="muted">Sosyal özellikler için hesapla giriş yapmalısın. Profil sekmesinden giriş yapabilirsin.</p>';
 if(chatWith)return vChat();
 const row=(u,extra,chat)=>`<div class="row" data-u="${esc(u.username)}"><img class="av" src="${esc(AV(u))}"><div class="i" data-a="${chat?'chat':'prof'}"><b>${esc(u.display)} <span class="dot ${u.online?'on':''}"></span>${UNR[u.username]?`<span class="bd">${UNR[u.username]}</span>`:''}</b><small>${u.np?'🎧 '+esc(u.np.title)+' — '+esc(u.np.artist):esc(u.status||'@'+u.username)}</small></div>${extra}</div>`;
 M.innerHTML=`<div id="sc"><input type="text" id="fs" placeholder="Kullanıcı adı yaz, arkadaş ekle…" autocapitalize="off"><div id="fres"></div>
 ${FR.incoming.length?'<h4>Arkadaşlık istekleri</h4>'+FR.incoming.map(u=>row(u,'<button class="btn" data-a="add">Kabul</button><button class="ic" data-a="del">✕</button>')).join(''):''}
 <h4>Arkadaşlar (${FR.friends.length})</h4>${FR.friends.map(u=>row(u,'<button class="ic" data-a="del">✕</button>',1)).join('')||'<p class="muted">Henüz arkadaşın yok. Yukarıdan kullanıcı adıyla ara.</p>'}
 ${FR.outgoing.length?'<h4>Gönderilen istekler</h4>'+FR.outgoing.map(u=>row(u,'<span class="muted">bekliyor</span>')).join(''):''}</div>`;
 let tm;$('#fs').oninput=e=>{clearTimeout(tm);tm=setTimeout(async()=>{const q=e.target.value.trim();try{const r=q?(await api('GET','/users?q='+encodeURIComponent(q))).users:[];$('#fres').innerHTML=r.map(u=>row(u,'<button class="btn" data-a="add">＋ Ekle</button>')).join('')}catch{}},300)};
 $('#sc').onclick=async e=>{const r=e.target.closest('.row'),a=e.target.closest('[data-a]')?.dataset.a;if(!r||!a)return;const u=r.dataset.u;
  try{if(a=='chat'){chatWith=u;vChat()}if(a=='prof')showProfile(u);
   if(a=='add'){await api('POST','/friends',{username:u});toast('Tamam ✓');loadFR()}
   if(a=='del'&&confirm('Kaldırılsın mı?')){await api('DELETE','/friends/'+u);loadFR()}}catch(x){toast(x.message)}}}
async function vChat(){
 const o=FR.friends.find(x=>x.username==chatWith)||{username:chatWith,display:chatWith};ctr=[];
 M.innerHTML=`<button class="btn g" id="bk">←</button> <b>${esc(o.display)}</b> <span class="dot ${o.online?'on':''}"></span>
 <div class="msgs" id="ms" style="margin:10px 0"></div><div style="display:flex;gap:6px"><input type="text" id="mi" placeholder="Mesaj yaz… (şarkı göndermek için ↗)" style="margin:0"><button class="btn" id="sd">Gönder</button></div>`;
 $('#bk').onclick=()=>{chatWith=null;vSoc()};
 $('#ms').onclick=async e=>{const r=e.target.closest('[data-ct]'),a=e.target.closest('[data-a]')?.dataset.a;if(!r)return;const t=ctr[r.dataset.ct];
  if(a=='cp')play([t],0);if(a=='ca'){const l=await pick();if(l){await addTo(l,[t]);toast('Eklendi: '+l.name)}}};
 const send=async()=>{const t=$('#mi').value.trim();if(!t)return;$('#mi').value='';try{await api('POST','/messages/'+o.username,{text:t})}catch(e){toast(e.message)}};
 $('#sd').onclick=send;$('#mi').onkeydown=e=>{if(e.key=='Enter')send()};
 try{const{messages}=await api('GET','/messages/'+o.username);UNR[o.username]=0;badge();messages.forEach(addMsg)}catch(e){toast(e.message)}}
function addMsg(m){
 const ms=$('#ms');if(!ms||ms.querySelector('[data-id="'+m.id+'"]'))return;
 const d=document.createElement('div');d.className='msg'+(m.from==ME.username?' me':'');d.dataset.id=m.id;let h=esc(m.text);
 if(m.att){const t=m.att.track,i=ctr.push(t)-1;h+=`<div class="row" data-ct="${i}" style="border:0"><img class="av" style="border-radius:6px" src="${esc(t.art||PH)}"><div class="i" data-a="cp"><b>${esc(t.title)}</b><small style="color:inherit;opacity:.7">${esc(t.artist)}</small></div><button class="ic" data-a="ca" style="color:inherit">＋</button></div>`}
 d.innerHTML=h;ms.appendChild(d);d.scrollIntoView({block:'end'})}
async function shareTrack(t){
 if(!ME||offline)return toast('Şarkı göndermek için giriş yapmalısın');
 if(String(t.id).startsWith('l'))return toast('Cihazındaki dosyalar paylaşılamaz');
 if(!FR.friends.length)return toast('Önce Sosyal sekmesinden arkadaş ekle');
 const d=$('#dlg');d.innerHTML=`<b>Kime gönderilsin?</b><div style="margin:10px 0">${FR.friends.map(u=>`<button class="btn g" style="margin:3px" data-u="${esc(u.username)}">${esc(u.display)}</button>`).join('')}</div><button class="btn g" id="x">İptal</button>`;d.showModal();
 $('#x').onclick=()=>d.close();
 d.querySelectorAll('[data-u]').forEach(b=>b.onclick=async()=>{d.close();try{await api('POST','/messages/'+b.dataset.u,{text:'',att:{type:'track',track:{id:t.id,title:t.title,artist:t.artist,art:t.art||'',url:t.url||'',aid:t.aid||'',src:t.src||''}}});toast('Gönderildi ✓')}catch(e){toast(e.message)}})}
async function showProfile(un){
 try{const u=un==ME.username?ME:(await api('GET','/users/'+un)).user,d=$('#dlg');
  d.innerHTML=`<div class="pcd"><div class="ban" style="${banStyle(u)}">${banIn(u)}</div>${avLg(u)}<div class="pnm"><h3>${esc(u.display)}</h3><small class="muted">@${esc(u.username)} · ${u.online?'🟢 çevrimiçi':'çevrimdışı'}</small>${u.status?`<div class="pst">${esc(u.status)}</div>`:''}<div class="pbx"><b>Hakkımda</b>${u.bio?esc(u.bio):'<span class="muted">Henüz bir şey yazılmamış.</span>'}</div>${u.created?`<div class="pbx"><b>Üyelik</b>${new Date(u.created).toLocaleDateString('tr',{day:'numeric',month:'long',year:'numeric'})}</div>`:''}</div></div><button class="btn g" id="x" style="margin-top:10px">Kapat</button>`;
  d.showModal();$('#x').onclick=()=>d.close()}catch(e){toast(e.message)}}
async function shrink(f,w,h){const b=await createImageBitmap(f),c=document.createElement('canvas');c.width=w;c.height=h;const k=Math.max(w/b.width,h/b.height),sw=w/k,sh=h/k;c.getContext('2d').drawImage(b,(b.width-sw)/2,(b.height-sh)/2,sw,sh,0,0,w,h);return c.toDataURL('image/jpeg',.82)}
async function bake(f,fit,w,h){const b=await createImageBitmap(f),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),k=Math.max(w/b.width,h/b.height),cw=b.width*k,ch=b.height*k,px=w*fit[0]/100,py=h*fit[1]/100;x.fillStyle='#111';x.fillRect(0,0,w,h);x.translate(px,py);x.scale(fit[2],fit[2]);x.translate(-px,-py);x.drawImage(b,(w-cw)*fit[0]/100,(h-ch)*fit[1]/100,cw,ch);let q=.9,r=c.toDataURL('image/jpeg',q);while(r.length*.75>285e3&&q>.4){q-=.08;r=c.toDataURL('image/jpeg',q)}return r}
function cropper(f,o){return new Promise(res=>{
 const d=$('#dlg'),u=URL.createObjectURL(f),v=/^video\//.test(f.type),W=o.round?240:330,H=o.round?240:110;let X=50,Y=50,Z=1,nw=0,nh=0,done=0;
 d.innerHTML=`<b>${o.title}</b><div id="cv" style="position:relative;overflow:hidden;width:${W}px;height:${H}px;margin:14px auto 10px;background:#000;touch-action:none;cursor:grab;border-radius:${o.round?'50%':'10px'}">${v?`<video src="${u}" autoplay muted loop playsinline></video>`:`<img src="${u}" alt="">`}</div>
 <label class="f">Yakınlaştır<input type="range" id="cz" min="1" max="4" step="0.01" value="1" style="width:100%"></label>
 <small class="muted" style="display:block;margin:4px 0 10px">Sürükleyerek konumlandır, kaydırıcı veya fare tekerleğiyle yakınlaştır.</small>
 <button class="btn" id="cok">Tamam</button> <button class="btn g" id="crs">Sıfırla</button> <button class="btn g" id="cno">İptal</button>`;
 const cv=$('#cv'),m=cv.firstElementChild;
 const paint=()=>{m.style.objectPosition=X+'% '+Y+'%';m.style.transform='scale('+Z+')';m.style.transformOrigin=X+'% '+Y+'%';$('#cz').value=Z};
 m.addEventListener(v?'loadedmetadata':'load',()=>{nw=m.naturalWidth||m.videoWidth;nh=m.naturalHeight||m.videoHeight});
 const rng=()=>{const k=nw?Math.max(W/nw,H/nh):1,ox=nw?Math.max(0,nw*k-W):0,oy=nh?Math.max(0,nh*k-H):0;return[Math.max(20,ox+W*(Z-1)),Math.max(20,oy+H*(Z-1))]};
 let st=null;cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);st={x:e.clientX,y:e.clientY};cv.style.cursor='grabbing'};
 cv.onpointermove=e=>{if(!st)return;const[rx,ry]=rng();X=Math.min(100,Math.max(0,X-(e.clientX-st.x)/rx*100));Y=Math.min(100,Math.max(0,Y-(e.clientY-st.y)/ry*100));st={x:e.clientX,y:e.clientY};paint()};
 cv.onpointerup=cv.onpointercancel=()=>{st=null;cv.style.cursor='grab'};
 cv.onwheel=e=>{e.preventDefault();Z=Math.min(4,Math.max(1,Z-e.deltaY/600));paint()};
 $('#cz').oninput=e=>{Z=+e.target.value;paint()};
 $('#crs').onclick=()=>{X=Y=50;Z=1;paint()};
 const fin=r=>{if(done)return;done=1;URL.revokeObjectURL(u);d.close();res(r)};
 $('#cok').onclick=()=>fin({fit:[Math.round(X*10)/10,Math.round(Y*10)/10,Math.round(Z*100)/100]});$('#cno').onclick=()=>fin(null);d.addEventListener('close',()=>fin(null),{once:true});
 d.showModal();paint()})}
function vMe(){
 if(!ME){M.innerHTML='<p class="muted">Hesapsız / çevrimdışı moddasın.</p><button class="btn" id="li">Giriş yap veya hesap oluştur</button>';return $('#li').onclick=()=>{offline=false;showAuth()}}
 const pend={};
 M.innerHTML=`<div id="pc2"><div class="pcd" style="margin-bottom:12px"><div class="ban" id="pb" style="${banStyle(ME)}">${banIn(ME)}</div>${avLg(ME,'pa')}<div class="pnm"><h3>${esc(ME.display)}</h3><small class="muted">@${esc(ME.username)}</small></div></div>
 <div><button class="btn g" id="ua">Fotoğraf</button> <button class="btn g" id="ub">Kapak</button> <button class="btn g" id="ra">Fotoğrafı kaldır</button> <button class="btn g" id="rb">Kapağı kaldır</button></div>
 <small class="muted" style="display:block;margin:4px 0 8px">Fotoğraf: JPG, PNG veya hareketli GIF/WebP (en fazla 120 MB). Kapak: görsel, GIF veya video (MP4/WebM, en fazla 40 MB; video sessiz ve döngüde oynar).</small>
 <input type="file" id="fa" accept="image/*" hidden><input type="file" id="fb" accept="image/*,video/mp4,video/webm" hidden>
 <label class="f">Görünen ad<input type="text" id="pd" maxlength="30" value="${esc(ME.display)}" style="width:60%;margin:0"></label>
 <label class="f">Durum<input type="text" id="ps" maxlength="60" value="${esc(ME.status)}" style="width:60%;margin:0"></label>
 <label class="f">Profil rengi<input type="color" id="pcl" value="${esc(ME.color)}"></label>
 <textarea id="pbio" rows="3" maxlength="300" placeholder="Biyografi">${esc(ME.bio)}</textarea>
 <button class="btn" id="sv">Kaydet</button> <button class="btn g" id="vw2">Önizle</button> <button class="btn g" id="lo">Çıkış yap</button></div>`;
 $('#ua').onclick=()=>$('#fa').click();$('#ub').onclick=()=>$('#fb').click();
 const raw={},anim=async f=>f.type=='image/gif'||(f.type=='image/webp'&&new TextDecoder('latin1').decode(await f.slice(0,160).arrayBuffer()).includes('ANIM')),vid=f=>/^video\/(mp4|webm)$/.test(f.type);
 const nf=c=>c.fit[0]==50&&c.fit[1]==50&&c.fit[2]==1?null:c.fit,
 setA=(src,ft)=>{$('#pa').outerHTML=avLg({avatar:src,afit:ft},'pa')},
 setB=(src,ft,isv)=>{const pb=$('#pb');pb.style.background=ME.color;pb.innerHTML=isv?`<video src="${src}" autoplay muted loop playsinline style="${fitSt(ft)}"></video>`:`<img src="${src}" alt="" style="${fitSt(ft)}">`};
 $('#fa').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(!/^image\//.test(f.type))return toast('Bir görsel seç');
  const a=await anim(f);if(a&&f.size>120e6)return toast('Hareketli fotoğraf en fazla 120 MB olabilir');
  const c=await cropper(f,{round:1,title:'Profil fotoğrafını ayarla'});if(!c)return;
  if(a){raw.avatar=f;delete pend.avatar;pend.afit=nf(c);setA(URL.createObjectURL(f),pend.afit)}
  else{try{pend.avatar=await bake(f,c.fit,320,320)}catch{return toast('Görsel okunamadı')}delete raw.avatar;pend.afit=null;setA(pend.avatar,null)}};
 $('#fb').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const v=vid(f),a=!v&&/^image\//.test(f.type)&&await anim(f);
  if(!v&&!/^image\//.test(f.type))return toast('Görsel veya video seç');
  if((v||a)&&f.size>40e6)return toast('Kapak en fazla 40 MB olabilir');
  const c=await cropper(f,{title:'Kapağı ayarla'});if(!c)return;
  if(v||a){raw.banner=f;delete pend.banner;pend.bfit=nf(c);setB(URL.createObjectURL(f),pend.bfit,v)}
  else{try{pend.banner=await bake(f,c.fit,1200,400)}catch{return toast('Görsel okunamadı')}delete raw.banner;pend.bfit=null;$('#pb').innerHTML='';$('#pb').style.background=`url(${pend.banner}) center/cover`}};
 $('#rb').onclick=()=>{pend.banner='';pend.bfit=null;delete raw.banner;$('#pb').innerHTML='';$('#pb').style.background=ME.color};
 $('#ra').onclick=()=>{pend.avatar='';pend.afit=null;delete raw.avatar;setA(PH,null)};
 $('#vw2').onclick=()=>showProfile(ME.username);
 $('#sv').onclick=async()=>{try{for(const k in raw){const r=await fetch('/api/me/media/'+k,{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:raw[k]}),j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Yükleme başarısız')}ME=(await api('PATCH','/me',{display:$('#pd').value,status:$('#ps').value,color:$('#pcl').value,bio:$('#pbio').value,...pend})).user;lsSet('me',ME);toast('Profil kaydedildi ✓');vMe()}catch(e){toast(e.message)}};
 $('#lo').onclick=async()=>{try{await api('POST','/logout')}catch{}ws&&ws.close();ws=null;ME=null;lsSet('me',null);lsSet('theme',null);FR={friends:[],incoming:[],outgoing:[]};UNR={};badge();showAuth()}}

