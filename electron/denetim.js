// Güncelleme denetimi için sıklık sınırlayıcı: aynı anda tek denetim, en erken `minMs` sonra bir sonraki (elle denetim her zaman geçer).
function makeDenetim(fn, minMs, now = Date.now) {
  let son = 0, sürüyor = false;
  return async function tetikle(elle) {
    if (sürüyor || (!elle && now() - son < minMs)) return false;
    sürüyor = true; son = now();
    try { await fn(!!elle); } finally { sürüyor = false; }
    return true;
  };
}
module.exports = { makeDenetim };
