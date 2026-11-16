// Tıklama dalgası ve uygulamanın başlatılması
// Not: klasik betik; tüm dosyalar aynı genel kapsamı paylaşır, yükleme sırası index.html'deki sıradır.
// Tıklama dalgası (hareketsiz mod / "hareketi azalt" açıksa çalışmaz)
document.addEventListener('pointerdown',e=>{
 const b=e.target.closest&&e.target.closest('.btn,.chip,.ic,.pl');
 if(!b||b.disabled)return;
 let calmOn;try{calmOn=calm()}catch{calmOn=matchMedia('(prefers-reduced-motion: reduce)').matches}
 if(calmOn)return;
 const r=b.getBoundingClientRect(),z=Math.max(r.width,r.height)*2,o=document.createElement('span');
 o.className='rip';o.style.cssText='width:'+z+'px;height:'+z+'px;left:'+(e.clientX-r.left-z/2)+'px;top:'+(e.clientY-r.top-z/2)+'px';
 const st=getComputedStyle(b).position==='static',ov=b.style.overflow;
 if(st)b.style.position='relative';b.style.overflow='hidden';
 b.appendChild(o);
 setTimeout(()=>{o.remove();if(st)b.style.position='';b.style.overflow=ov},560);
},{passive:true});
