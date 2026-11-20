// Güncelleme bildirimi (yalnızca masaüstü uygulamasında): sağ üstte şık bir şimşek rozeti; tıklayınca kurar ve yeniden başlatır.
// Kedi de haber verebilir. Köprü: electron/onyukle.js → window.yoniApp
(()=>{
 if(!window.yoniApp)return;
 let el=null,told='';
 const kur=()=>window.yoniApp.kur();
 const show=(txt,sub,ready)=>{
  if(!el){el=document.createElement('button');el.id='upd';el.setAttribute('aria-live','polite');document.body.appendChild(el)}
  el.className=ready?'ready':'';el.innerHTML=ic('bolt')+'<span><b>'+txt+'</b><small>'+sub+'</small></span>';el.onclick=ready?kur:null;el.style.cursor=ready?'pointer':'default'};
 window.yoniApp.guncelleme(d=>{
  if(!d)return;
  if(d.durum=='iniyor')show('Yeni sürüm '+esc(d.surum||''),'İndiriliyor…',false);
  else if(d.durum=='hazir'){
   show('Yoni '+esc(d.surum||'')+' hazır','Tıkla: yeniden başlat ve güncelle',true);
   if(told!=d.surum){told=d.surum;try{window.Kedi&&Kedi.say('⚡ Yeni güncelleme geldi!<small>Yoni '+esc(d.surum||'')+' hazır</small>','Güncelle',kur,40)}catch{}}}
 });
})();
