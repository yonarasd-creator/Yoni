// Ayarlar: tüm yapılandırma tek yerde, sekmelerle. Görünüm (tema, renkler, yoldaşlar, arka plan), Hesaplar (YouTube),
// Kütüphane (içe aktarma, depolama, yedek), Uygulama (güncelleme, mini oynatıcı).
const SET_SEK=[['gorunum','Görünüm'],['hesaplar','Hesaplar'],['kutuphane','Kütüphane'],['uygulama','Uygulama']];
function vSet(tab){
 tab=SET_SEK.some(s=>s[0]==tab)?tab:(vSet.tab||'gorunum');vSet.tab=tab;
 M.innerHTML=`<div class="chips stabs">${SET_SEK.map(([k,n])=>`<button class="chip${k==tab?' on':''}" data-t="${k}">${n}</button>`).join('')}</div><div id="sc"></div>`;
 M.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>vSet(b.dataset.t));
 ({gorunum:vTheme,hesaplar:vHesaplar,kutuphane:vImp,uygulama:vUygulama})[tab]();
}
function vHesaplar(){
 PN().innerHTML=`<div class="card"><b>YouTube hesabı</b><p class="muted" style="margin:6px 0">Müzik YouTube üzerinden çalınır. Hesabını bağlayınca arama, beğendiklerin ve listelerin kullanılır.</p><div id="ytb"></div></div>
 <div class="card"><b>YouTube API anahtarı (isteğe bağlı)</b><p class="muted" style="margin:6px 0;font-size:13px">Hesap bağlamak yerine kendi anahtarınla da arama yapabilirsin: console.cloud.google.com → YouTube Data API v3 → API anahtarı oluştur.</p>
 <div style="display:flex;gap:6px"><input type="text" id="yk" value="${esc(ykey())}" placeholder="API anahtarı" style="flex:1"><button class="btn g" id="yks">Kaydet</button></div></div>`;
 ytCard();
 $('#yks').onclick=()=>{try{localStorage.setItem('yk',$('#yk').value.trim())}catch{}toast('Kaydedildi')};
}
function vUygulama(){
 const el=!!window.yoniApp;
 PN().innerHTML=`<div class="card"><b>Güncelleme</b><p class="muted" style="margin:6px 0">${el?'Yeni sürüm açılışta, her 10 dakikada ve pencereyi açtığında otomatik aranır.':'Güncellemeler masaüstü uygulamasında otomatik gelir.'}</p>${el?'<button class="btn g" id="gd">Şimdi denetle</button>':''}</div>
 <div class="card"><b>Mini oynatıcı</b><p class="muted" style="margin:6px 0">Oyun veya başka uygulama açıkken küçük kontrol penceresi. Kısayol: Alt+M</p><button class="btn g" id="mo2">Aç</button></div>`;
 const gd=$('#gd');if(gd)gd.onclick=()=>{window.yoniApp.denetle();toast('Güncelleme denetleniyor…')};
 $('#mo2').onclick=()=>openMini();
}
