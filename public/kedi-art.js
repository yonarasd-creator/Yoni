// Yoni kedileri: pixel art çizim motoru. Kediyi kare kare PNG'den değil, her karede iskeletten (gövde, kafa, bacaklar, kuyruk) çizer.
// KediArt.draw(tür, poz) → 48x48 canvas. Zemin çizgisi (ayak hizası) y=38'dedir; altındaki 10 satır sarkan kuyruk içindir.
(() => {
  const N = 48, H = 60, B = 38; // N genişlik, H yükseklik (altta sarkan kuyruk için fazladan satırlar)
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const pack = (r, g, b, a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  const C = h => pack(...hex(h));
  const unpack = c => [c & 255, (c >> 8) & 255, (c >> 16) & 255];
  const dark = (c, f) => { const [r, g, b] = unpack(c); return pack(r * f | 0, g * f | 0, b * f | 0); };
  const lite = (c, t) => { const [r, g, b] = unpack(c); return pack(r + (255 - r) * t | 0, g + (255 - g) * t | 0, b + (255 - b) * t | 0); };
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177 | 0; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };

  // tür: base gövde, stripe desen rengi, light açık bölge (karın/ağız/pati), eye göz, inner kulak içi, pat desen
  const T = {
    zencefil: { name: 'Zencefil', base: '#e99a45', light: '#f8dcae', out: '#4e2a12', eye: '#6bbf4b', inner: '#f0a0a8', pat: 'tabby', stripe: '#b0601c', belly: 1 },
    kahve: { name: 'Kahve', base: '#a67c52', light: '#d8bf96', out: '#35221a', eye: '#d9a82a', inner: '#e0a0a0', pat: 'tabby', stripe: '#5d3f26', belly: 1 },
    gece: { name: 'Gece', base: '#3d3d4b', light: '#3d3d4b', out: '#0b0b11', eye: '#e8d13a', inner: '#8a5a78', pat: 'solid' },
    pamuk: { name: 'Pamuk', base: '#f7f3ea', light: '#ffffff', out: '#5e5348', eye: '#59a6e0', inner: '#f4a6b4', pat: 'solid' },
    kalico: { name: 'Alaca', base: '#f6f1e8', light: '#ffffff', out: '#4a3b30', eye: '#d9a82a', inner: '#f0a8b0', pat: 'calico', o: '#e6902f', k: '#34343c' },
    smokin: { name: 'Smokin', base: '#35353f', light: '#fafafa', out: '#0b0b10', eye: '#e6cf3a', inner: '#f0a0a8', pat: 'tux' },
    tuylu: { name: 'Tüylü', base: '#8d857a', light: '#bdb4a5', out: '#2f2a24', eye: '#e0b82a', inner: '#d9a0a8', pat: 'solid', fluff: 1, belly: 1 },
    sutlu: { name: 'Sütlü', base: '#f1e3cc', light: '#f9f1e2', out: '#3d2a20', eye: '#4a9be8', inner: '#6b4a3c', pat: 'siamese', pts: '#5b4032' },
    tekir: { name: 'Tekir', base: '#9c9791', light: '#d2cbbe', out: '#2c2a27', eye: '#7fbf5a', inner: '#dba3a8', pat: 'tabby', stripe: '#5e5a55', belly: 1 },
    // ---- kurtlar (sp:'kurt'): saddle deseni = koyu sırt, açık karın
    kurtgri: { name: 'Gri Kurt', sp: 'kurt', base: '#8e9399', light: '#d9dde0', out: '#15181c', eye: '#e0b13a', inner: '#3a3d44', pat: 'saddle', stripe: '#565b63', fluff: 1 },
    kurtbeyaz: { name: 'Beyaz Kurt', sp: 'kurt', base: '#e8edf2', light: '#ffffff', out: '#3c4652', eye: '#5fb0e8', inner: '#9aa7b4', pat: 'saddle', stripe: '#c3ccd6', fluff: 1 },
    kurtkara: { name: 'Kara Kurt', sp: 'kurt', base: '#3b3f48', light: '#7f858f', out: '#0a0b0e', eye: '#e8a23a', inner: '#15171b', pat: 'saddle', stripe: '#24272d', fluff: 1 },
    kurtboz: { name: 'Boz Kurt', sp: 'kurt', base: '#8b6b4e', light: '#cdb394', out: '#261a12', eye: '#e6b63a', inner: '#3a2a1e', pat: 'saddle', stripe: '#5a4330', fluff: 1 },
    // ---- ejderhalar (sp:'ejder'): scale deseni = pullu gövde, altın karın; wing kanat zarı, horn boynuz
    ejderkizil: { name: 'Kızıl Ejderha', sp: 'ejder', base: '#b8322c', light: '#e8b25a', out: '#2a0b0b', eye: '#ffc83a', inner: '#7a1c1c', pat: 'scale', stripe: '#7a1c1c', wing: '#8f2420', horn: '#ecdcb2' },
    ejderkara: { name: 'Kara Ejderha', sp: 'ejder', base: '#2e2e38', light: '#8a3a3a', out: '#08080b', eye: '#ff5a2a', inner: '#14141a', pat: 'scale', stripe: '#16161c', wing: '#3d1e24', horn: '#c2baa8' },
    ejderaltin: { name: 'Altın Ejderha', sp: 'ejder', base: '#c28a2e', light: '#f3dd90', out: '#3a2608', eye: '#ff7a2a', inner: '#7c5517', pat: 'scale', stripe: '#7c5517', wing: '#9a6a1f', horn: '#f8eecb' },
    ejderzumrut: { name: 'Zümrüt Ejderha', sp: 'ejder', base: '#2f8a58', light: '#d6c98a', out: '#0b2216', eye: '#ffd43a', inner: '#1d5a3a', pat: 'scale', stripe: '#1d5a3a', wing: '#236b45', horn: '#e6e0b4' },
  };
  for (const k in T) { const t = T[k]; t.b = C(t.base); t.l = C(t.light); t.o_ = C(t.out); t.e = C(t.eye); t.i = C(t.inner); t.s = t.stripe ? C(t.stripe) : 0; t.p = t.pts ? C(t.pts) : 0; if (t.o) { t.oc = C(t.o); t.kc = C(t.k); } }
  for (const k in T) { const t = T[k]; t.w = t.wing ? C(t.wing) : 0; t.h = t.horn ? C(t.horn) : 0; }

  function ctx() {
    const b = new Uint32Array(N * H);
    const px = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < H) b[y * N + x] = c; };
    const ell = (cx, cy, rx, ry, c, rot = 0) => {
      const cs = Math.cos(rot), sn = Math.sin(rot), m = Math.ceil(Math.max(rx, ry)) + 1;
      for (let y = Math.floor(cy - m); y <= cy + m; y++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
        const dx = x + .5 - cx, dy = y + .5 - cy, u = (dx * cs + dy * sn) / rx, v = (-dx * sn + dy * cs) / ry;
        if (u * u + v * v <= 1) { const k = typeof c == 'function' ? c(x, y, u, v) : c; if (k) px(x, y, k); }
      }
    };
    const poly = (pts, c) => {
      let x0 = 99, x1 = -99, y0 = 99, y1 = -99; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) {
        const X = x + .5, Y = y + .5; let ins = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > Y) != (yj > Y) && X < (xj - xi) * (Y - yi) / (yj - yi) + xi) ins = !ins;
        }
        if (ins) { const k = typeof c == 'function' ? c(x, y) : c; if (k) px(x, y, k); }
      }
    };
    const line = (x0, y0, x1, y1, w, c) => {
      const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d * 2));
      for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; if (w <= 1) px(x, y, typeof c == 'function' ? c(x, y) : c); else ell(x, y, w / 2, w / 2, c); }
    };
    return { b, px, ell, poly, line };
  }

  // gövde renklendirme: desen + gölge (alt kısım koyu, geçiş taramalı)
  function bodyCol(t, shadeFrom = .42) {
    return (x, y, u, v) => {
      let c = t.b;
      if (t.pat == 'tabby') { const s = ((u + 1) * 2.6) % 1; if (v < .55 && v > -.85 && s < .36) c = t.s; else if (t.belly && v > .5) c = t.l; }
      else if (t.pat == 'tux') { if (v > .3 && u > -.2) c = t.l; }
      else if (t.pat == 'calico') {
        if ((u + .4) ** 2 + (v + .25) ** 2 * 1.5 < .33) c = t.oc; else if ((u - .55) ** 2 + (v - .1) ** 2 * 1.3 < .2) c = t.kc;
      } else if (t.pat == 'siamese') { if (v < -.35) c = lite(t.b, -0); c = v < -.2 ? dark(t.b, .94) : c; }
      else if (t.pat == 'saddle') { if (v < -.1) c = t.s; else if (v > .45) c = t.l; }
      else if (t.pat == 'scale') { if (v > .45) c = t.l; else if (((x >> 1) + y) % 3 == 0) c = dark(c, .88); }
      else if (t.belly && v > .5) c = t.l;
      if (v > shadeFrom + .25) return dark(c, .78);
      if (v > shadeFrom && (x + y & 1) == 0) return dark(c, .78);
      return c;
    };
  }

  function tail(r, t, P, bx, by) {
    const o = P.tail || {}, a0 = (o.a ?? 200) * Math.PI / 180, curl = (o.curl ?? 10) * Math.PI / 180, sw = (o.sway ?? 14) * Math.PI / 180, ph = o.ph || 0;
    const n = o.n || (t.sp == 'ejder' ? 11 : 9), seg = o.seg || 2.9, wide = t.sp == 'kurt' ? 2 : t.fluff ? 1 : 0;
    let x = bx, y = by, a = a0;
    const pts = [];
    for (let i = 0; i < n; i++) {
      a = a0 + curl * i + sw * Math.sin(ph - i * .55) * (.25 + i / n);
      const w = t.sp == 'ejder' ? Math.max(1.6, 3.8 - i * .24) : (i < 2 ? 3.4 : i < n - 2 ? 3 : 2.4) + wide;
      let c = t.b;
      if (t.pat == 'tabby' && i % 3 == 2) c = t.s;
      if (t.pat == 'tux' && i >= n - 2) c = t.l;
      if (t.pat == 'saddle' && i >= n - 3) c = t.s;
      if (t.pat == 'siamese') c = t.p;
      if (t.pat == 'calico') c = i >= n - 2 ? t.kc : t.oc;
      if (i > 3 && t.pat == 'solid' && t.fluff) c = dark(t.b, .9);
      const nx = x + Math.cos(a) * seg, ny = y + Math.sin(a) * seg;
      r.line(x, y, nx, ny, w, c); x = nx; y = ny; pts.push([x, y]);
      if (t.sp == 'ejder' && i % 2 == 0 && i < n - 1) r.poly([[x - 1, y - w / 2], [x, y - w / 2 - 2.6], [x + 1, y - w / 2]], t.s); // sırt dikenleri
    }
    if (t.sp == 'ejder') { const [lx, ly] = pts[pts.length - 1]; r.poly([[lx - 1, ly - 3], [lx + 4 * Math.cos(a), ly + 4 * Math.sin(a)], [lx - 1, ly + 3]], t.s); } // kuyruk ucu
    return pts;
  }

  function leg(r, t, hx, hy, fx, fy, far) {
    fy = Math.min(fy, B);
    let c = t.b; if (t.pat == 'siamese') c = t.p; else if (t.pat == 'calico') c = t.l; else if (t.pat == 'tabby' && t.belly) c = t.b;
    if (far) c = dark(c, .8);
    r.line(hx, hy, fx, fy - 1, 3, c);
    let pc = c; if (t.pat == 'tux') pc = far ? dark(t.l, .85) : t.l; else if (t.pat == 'tabby' && t.belly) pc = far ? dark(t.l, .85) : t.l; else if (t.pat == 'solid' && t.fluff) pc = far ? dark(t.l, .85) : t.l;
    r.ell(fx + 1, fy - .6, 2.7, 1.5, pc);
  }

  function foot(hipX, hipY, ph, amp, lift) { // yürüyüş: dayanma evresinde geri kayar, savurma evresinde ileri yay çizer
    ph = ((ph % 1) + 1) % 1; let x, l;
    if (ph < .6) { x = hipX + amp * (1 - 2 * ph / .6); l = 0; } else { const u = (ph - .6) / .4; x = hipX + amp * (-1 + 2 * u); l = lift * Math.sin(Math.PI * u); }
    return [x, B - l];
  }

  function head(r, t, P, cx, cy) {
    if (t.sp == 'kurt') return headWolf(r, t, P, cx, cy);
    if (t.sp == 'ejder') return headDragon(r, t, P, cx, cy);
    const H = P.head || {}, look = P.look || { x: 0, y: 0 }, ear = P.ear || 0, ang = H.tilt || 0;
    cx += H.dx || 0; cy += H.dy || 0;
    const ec = (t.pat == 'siamese') ? t.p : (t.pat == 'solid' || t.pat == 'tabby' || t.pat == 'tux' || t.pat == 'calico') ? (t.pat == 'calico' ? t.kc : t.b) : t.b;
    const back = P.flat ? 3 : 0;
    // kulaklar
    r.poly([[cx - 6.6, cy - 2 + back], [cx - 5.4 - back * .4, cy - 10.5 + back * 1.3], [cx - 1.2, cy - 5 + back]], ec);
    r.poly([[cx + .6, cy - 5.2 + back], [cx + 4.6 + ear - back * .3, cy - 10.7 + back * 1.3], [cx + 6.8, cy - 2.4 + back]], t.pat == 'calico' ? t.oc : ec);
    if (!P.flat) {
      r.poly([[cx - 5.4, cy - 3.2], [cx - 4.8, cy - 8], [cx - 2.4, cy - 5.2]], t.i);
      r.poly([[cx + 1.6, cy - 5.4], [cx + 4.2 + ear, cy - 8.2], [cx + 5.8, cy - 3.4]], t.i);
    }
    // yüz
    r.ell(cx, cy, 7.4, 6.3, (x, y, u, v) => {
      let c = t.b;
      if (t.pat == 'calico') c = (u < -.1) ? t.kc : (v < -.3 && u > .2) ? t.oc : t.b;
      if (t.pat == 'siamese' && u > .15 && v > -.5) c = t.p;
      if (t.pat == 'tux' && u > .25 && u < .85 && v < -.1) c = t.l;
      return c;
    });
    if (t.pat == 'tux' || t.pat == 'tabby' && t.belly || t.pat == 'solid' && t.fluff || t.pat == 'calico') r.ell(cx + 4.2, cy + 2.7, 3.7, 2.8, t.l);
    if (t.pat == 'siamese') r.ell(cx + 4.4, cy + 2.8, 3.4, 2.6, dark(t.p, 1.12));
    if (t.pat == 'tabby') { for (const [dx, dy] of [[1, -5], [1, -4], [3, -5.6], [3, -4.4], [-1.5, -5.3], [-1.5, -4.4]]) r.px(cx + dx, cy + dy, t.s); for (const dx of [-1.5, -.5]) r.px(cx + dx, cy + 2.2, t.s); }
    if (t.fluff) for (let i = 0; i < 9; i++) { const a = i * .7 + 1.2; r.px(cx + Math.cos(a) * 7.8, cy + 1.5 + Math.sin(a) * 6.8, t.b); }
    // gözler
    const E = P.eyes || 'open';
    const eye = (x, y) => {
      if (E == 'closed') { r.px(x, y + 1, t.o_); r.px(x + 1, y + 1, t.o_); }
      else if (E == 'happy') { r.px(x - 1, y + 2, t.o_); r.px(x, y + 1, t.o_); r.px(x + 1, y + 1, t.o_); r.px(x + 2, y + 2, t.o_); }
      else {
        const half = E == 'half';
        for (let j = half ? 0 : -1; j <= 1; j++) for (let i = 0; i < 2; i++) r.px(x + i, y + j, t.e);
        if (!half) { const lx = look.x > .35 ? 1 : 0, ly = look.y < -.35 ? -1 : 0; r.px(x + lx, y + ly + 0, C('#101018')); r.px(x + lx, y + ly + 1, C('#101018')); r.px(x, y - 1, C('#ffffff')); }
        else { r.px(x, y, C('#101018')); r.px(x + 1, y - 1, t.o_); r.px(x, y - 1, t.o_); }
        r.px(x, y - 2 + (half ? 1 : 0), t.o_); r.px(x + 1, y - 2 + (half ? 1 : 0), t.o_);
      }
    };
    eye(cx + .5, cy - .3); eye(cx + 4.9, cy - .3);
    r.px(cx + 7, cy + 1.8, C('#f08aa0')); // burun
    if (P.mouth == 'open') { r.ell(cx + 5.8, cy + 4.2, 1.8, 1.5, C('#5a1f2a')); r.px(cx + 5.8, cy + 4.6, C('#f08aa0')); }
    else if (P.mouth == 'lick') { r.px(cx + 6, cy + 3.6, C('#f08aa0')); r.px(cx + 6, cy + 4.6, C('#f08aa0')); }
    else { r.px(cx + 5.5, cy + 3.5, t.o_); r.px(cx + 6.5, cy + 3.5, t.o_); }
    if (E == 'happy') for (const dx of [1.5, 2.5, 7, 8]) r.px(cx + dx - (dx > 6 ? 2 : 0), cy + 3, C('#f08aa0'));
    return { whisk: [cx + 7, cy + 2.6] };
  }

  // kurt ve ejderha için ortak göz: slit=true ise dikey bebek (ejderha)
  function crEye(r, t, P, x, y, slit) {
    const E = P.eyes || 'open', look = P.look || { x: 0, y: 0 }, d = C('#101018'), lx = look.x > .35 ? 1 : 0;
    if (E == 'closed') { r.px(x, y + 1, t.o_); r.px(x + 1, y + 1, t.o_); }
    else if (E == 'happy') { r.px(x - 1, y + 2, t.o_); r.px(x, y + 1, t.o_); r.px(x + 1, y + 1, t.o_); r.px(x + 2, y + 2, t.o_); }
    else {
      const half = E == 'half';
      for (let j = half ? 0 : -1; j <= 1; j++) for (let i = 0; i < 2; i++) r.px(x + i, y + j, t.e);
      if (slit) { for (let j = half ? 0 : -1; j <= 1; j++) r.px(x + lx, y + j, d); } else { r.px(x + lx, y, d); r.px(x + lx, y + 1, d); }
      r.px(x, y - 2 + (half ? 1 : 0), t.o_); r.px(x + 1, y - 2 + (half ? 1 : 0), t.o_);
    }
  }

  function headWolf(r, t, P, cx, cy) {
    const H = P.head || {}, ear = P.ear || 0, back = P.flat ? 3 : 0;
    cx += H.dx || 0; cy += H.dy || 0;
    r.poly([[cx - 6.6, cy - .5 + back], [cx - 5.2 - back * .4, cy - 9 + back * 1.4], [cx - .6, cy - 4.4 + back]], t.b);
    r.poly([[cx + .2, cy - 4.6 + back], [cx + 3.6 + ear - back * .3, cy - 9.4 + back * 1.4], [cx + 6.4, cy - 1.2 + back]], t.b);
    if (!P.flat) {
      r.poly([[cx - 5, cy - 1.8], [cx - 4.7, cy - 7], [cx - 2, cy - 4.2]], t.i);
      r.poly([[cx + 1.2, cy - 4.4], [cx + 3.4 + ear, cy - 7.2], [cx + 5.2, cy - 1.8]], t.i);
    }
    r.ell(cx, cy, 6.8, 5.9, (x, y, u, v) => v > .45 ? t.l : t.b);
    r.ell(cx - 1.5, cy + 4.4, 5.2, 2.4, t.l); // yanak tüyü
    r.ell(cx + 7, cy + 2.4, 5.4, 3, (x, y, u, v) => v > .05 ? t.l : t.b);
    for (let i = 0; i < 7; i++) { const a = i * .9 + .6; r.px(cx - 1 + Math.cos(a) * 7.4, cy + 1.5 + Math.sin(a) * 6.4, t.b); } // tüylü yüz hattı
    const dk = C('#0c0c10'); r.px(cx + 11.8, cy + 1.4, dk); r.px(cx + 11.8, cy + 2.4, dk); r.px(cx + 10.8, cy + 1.4, dk);
    crEye(r, t, P, cx + .8, cy - .8); crEye(r, t, P, cx + 5, cy - 1.2);
    if (P.mouth == 'open') { r.ell(cx + 8, cy + 5, 3, 1.5, C('#5a1f2a')); r.px(cx + 8, cy + 5.4, C('#f08aa0')); }
    else if (P.mouth == 'lick') { r.px(cx + 9, cy + 4.6, C('#f08aa0')); r.px(cx + 9, cy + 5.6, C('#f08aa0')); }
    else { for (const dx of [7, 8, 9, 10]) r.px(cx + dx, cy + 4.4, t.o_); }
    return { whisk: null };
  }

  function headDragon(r, t, P, cx, cy) {
    const H = P.head || {}, back = P.flat ? 3 : 0;
    cx += H.dx || 0; cy += H.dy || 0;
    r.poly([[cx - 5, cy + 1], [cx - 10.5, cy + 3], [cx - 5, cy + 4.6]], t.s); // yanak yelesi
    r.poly([[cx - 5, cy - 2.2], [cx - 10.5, cy - 1], [cx - 5, cy + 1]], t.s);
    r.poly([[cx - 3, cy - 4 + back], [cx - 10, cy - 10.5 + back * 1.3], [cx - .8, cy - 6 + back]], t.h); // arka boynuz
    r.poly([[cx + 1.2, cy - 5 + back], [cx - 2.6, cy - 12 + back * 1.3], [cx + 3.4, cy - 6 + back]], t.h); // ön boynuz
    r.ell(cx, cy, 6.6, 5.6, (x, y, u, v) => v > .5 ? dark(t.b, .9) : (((x >> 1) + y) % 3 == 0 ? dark(t.b, .9) : t.b));
    r.ell(cx + 6, cy + 2.2, 4.4, 2.6, (x, y, u, v) => v > .25 ? t.l : t.b);
    r.px(cx + 9.6, cy + 1.2, C('#2a0c0c')); r.px(cx + 9.6, cy + 2.2, C('#2a0c0c'));
    for (const dx of [.6, 1.6, 4.6, 5.6]) r.px(cx + dx, cy - 3.2, t.s); // kaş çıkıntısı
    crEye(r, t, P, cx + .8, cy - .8, true); crEye(r, t, P, cx + 4.8, cy - .8, true);
    if (P.mouth == 'open') {
      r.ell(cx + 6.8, cy + 4.6, 2.8, 1.4, C('#5a1f2a'));
      r.ell(cx + 11.5, cy + 4.6, 2.8, 1.8, C('#ff8a1e')); r.ell(cx + 10.8, cy + 4.6, 1.5, 1, C('#fff1a8')); // alev
    } else if (P.mouth == 'lick') { r.px(cx + 8, cy + 4.4, C('#e0506a')); r.px(cx + 9, cy + 5.2, C('#e0506a')); }
    else { for (const dx of [6.5, 7.5, 8.5]) r.px(cx + dx, cy + 4, t.o_); }
    return { whisk: null };
  }

  // ejderha kanadı: gövdenin arkasına (önce) çizilir; yürürken/tırmanırken çırpar, otururken yarı kapalı durur
  const WING = { stand: [22, 21], sit: [20, 21], loaf: [19, 29], curl: [20, 28], climb: [23, 21] };
  function wings(r, t, P) {
    const pose = P.pose || 'stand', a = WING[pose] || WING.stand, bob = Math.round(P.bob || 0) + (pose == 'climb' ? 5 : 0);
    const moving = pose == 'stand' || pose == 'climb', f = moving ? Math.sin((P.ph || 0) * Math.PI * 2) * 2.6 : (P.breath || 0) * 1.5, k = moving ? 1 : .7;
    const sx = a[0], sy = a[1] + bob, q = (dx, dy, w) => [sx + dx * k, sy + dy * k - f * w];
    const m = [[0, 0, 0], [-2, -11, .6], [-8, -15, 1], [-10, -9, .8], [-15, -11, 1], [-14, -3, .7], [-8, 2, .2]].map(v => q(...v));
    r.poly(m, t.w);
    r.line(...q(0, 0, 0), ...q(-8, -15, 1), 1, t.b); r.line(...q(0, 0, 0), ...q(-15, -11, 1), 1, t.b); r.line(...q(0, 0, 0), ...q(-14, -3, .7), 1, dark(t.b, .85));
  }

  function whiskers(r, w) {
    const c = C('#f4efe6');
    if (!w) return;
    for (const [dx, dy] of [[1, -1], [2, 0], [1, 1]]) { r.px(w[0] + dx, w[1] + dy, c); r.px(w[0] + dx + 1, w[1] + dy * 1.6, c); r.px(w[0] + dx + 2, w[1] + dy * 2.2, c); }
  }

  function finish(r, t, withShadow) {
    const b = r.b, src = Uint32Array.from(b);
    const solid = i => (src[i] >>> 24) == 255;
    for (let y = 0; y < H; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x; if (src[i] >>> 24) continue;
      if ((x > 0 && solid(i - 1)) || (x < N - 1 && solid(i + 1)) || (y > 0 && solid(i - N)) || (y < H - 1 && solid(i + N))) b[i] = t.o_;
    }
  }

  const POSES = {};

  // ---- pozlar ----
  POSES.stand = (r, t, P) => {
    const bob = Math.round(P.bob || 0), ph = P.ph || 0, amp = P.amp ?? 5, lift = P.lift ?? 3.2, pitch = P.pitch || 0;
    const hips = [[17.5, 28 + bob], [32, 28 + bob], [13, 28 + bob], [27.5, 28 + bob]];
    const phs = [0, .5, .5, 0]; // çapraz yürüyüş: far arka+near ön / near arka+far ön
    const F = P.feet || hips.map((h, i) => foot(h[0], h[1], ph + phs[i], amp, lift));
    const fh = (i) => P.feet ? P.feet[i] : F[i];
    leg(r, t, hips[0][0], hips[0][1], ...fh(0), true); leg(r, t, hips[1][0], hips[1][1], ...fh(1), true);
    tail(r, t, { ...P, tail: { a: t.sp == 'kurt' ? 168 : 226, curl: t.sp == 'kurt' ? -3 : 7, sway: 14, ...(t.sp == 'kurt' ? { n: 5, seg: 2.4 } : {}), ...(P.tail || {}) } }, 11.5, 24.5 + bob);
    r.ell(14, 26 + bob, 6.4, 6.6, bodyCol(t));
    r.ell(22.5, 26 + bob + pitch, 10, 6, bodyCol(t), pitch * .05);
    r.ell(28.5, 26.5 + bob + pitch * 1.4, 5.6, 6.3, bodyCol(t));
    r.ell(31.5, 22.5 + bob + pitch, 4.6, 5.5, bodyCol(t, .9));
    leg(r, t, hips[2][0], hips[2][1], ...fh(2), false); leg(r, t, hips[3][0], hips[3][1], ...fh(3), false);
    if (t.pat == 'tux') r.ell(30.5, 27 + bob + pitch, 3.4, 4.6, t.l);
    return head(r, t, P, 35.5, 17.5 + bob + pitch * 1.6);
  };

  POSES.sit = (r, t, P) => {
    const br = P.breath || 0;
    r.ell(15.5, 31, 8, 7, bodyCol(t, .5));
    const tp = tail(r, t, { ...P, tail: { a: 175, curl: -9, sway: 16, n: 9, ...(P.tail || {}) } }, 9.5, 34.5);
    r.ell(15.5, 31, 8, 7, bodyCol(t, .5));
    r.ell(22, 24, 9.8 + br * .3, 6.2, bodyCol(t, .6), -.95);
    r.ell(22.5, 37, 5, 1.8, t.pat == 'siamese' ? t.p : (t.pat == 'tux' || t.belly || t.fluff) ? t.l : t.b); // arka pati
    if (t.pat == 'tux' || t.belly) r.ell(27.5, 20.5, 3.6, 6, t.l, -.25);
    const legc = t.pat == 'siamese' ? t.p : t.b, pc = (t.pat == 'tux' || t.belly || t.fluff) ? t.l : legc;
    r.line(32.5, 22, 33.5, 36, 3, dark(legc, .85)); r.ell(34.5, 37, 2.8, 1.5, dark(pc, .9));
    const hd = P.head || {}, hx = 31.5 + (hd.dx || 0), hy = 11.5 + (hd.dy || 0);
    if (P.paw != null) { r.line(29.5, 21, hx + 3.5, hy + 5 + P.paw, 3, legc); r.ell(hx + 4.5, hy + 5 + P.paw, 2.3, 1.7, pc); }
    else { r.line(29.5, 21, 30.5, 36, 3, legc); r.ell(31.5, 37, 2.8, 1.6, pc); }
    return head(r, t, P, 31.5, 11.5);
  };

  // ---- önden bakan oturuş (kurt ve ejderha): simetrik, iri kafa, açık göğüs/karın çizgileri ----
  const mir = (pts, c = 24) => pts.map(([x, y]) => [2 * c - x, y]);
  function frontWolf(r, t, P) {
    const br = P.breath || 0, hd = P.head || {}, hy = 12 + br * .4 + (hd.dy || 0), sw = Math.sin((P.tail && P.tail.ph) || 0) * 1.2;
    // kuyruk: sağ yanda kıvrılır, ucu koyu
    const tp = [[31, 36], [35.5, 37], [39, 34.5 + sw], [40.5, 30 + sw]];
    for (let i = 0; i < tp.length - 1; i++) r.line(...tp[i], ...tp[i + 1], 4.4, i == tp.length - 2 ? t.s : t.b);
    r.ell(16.5, 32, 6.2, 6, bodyCol(t, .55)); r.ell(31.5, 32, 6.2, 6, bodyCol(t, .55)); // kalçalar
    r.ell(15.5, 37.4, 3.8, 1.6, t.l); r.ell(32.5, 37.4, 3.8, 1.6, t.l);
    r.poly([[19, 18], [29, 18], [32.5, 37.5], [15.5, 37.5]], (x, y) => { const d = Math.abs(x + .5 - 24); if (d < 3.6) return (y % 3 == 0 && y > 22) ? dark(t.l, .84) : t.l; return y > 30 ? dark(t.b, .82) : t.b; });
    for (const lx of [20.6, 27.4]) { r.line(lx, 27, lx, 36.5, 3, t.l); r.ell(lx, 37.5, 2.8, 1.4, dark(t.l, .96)); r.px(lx - .5, 37, dark(t.l, .75)); r.px(lx + .5, 37, dark(t.l, .75)); }
    r.ell(24, 19.5, 8.2, 3.6, t.l); for (const dx of [-5, -3, 3, 5]) r.px(24 + dx, 21, dark(t.l, .86)); // boyun tüyü
    // kulaklar
    r.poly([[15.8, 9.6 + br * .3], [17, .6 + br * .3 + (hd.dy || 0)], [22.4, 6.2 + br * .3]], t.b); r.poly(mir([[15.8, 9.6 + br * .3], [17, .6 + br * .3 + (hd.dy || 0)], [22.4, 6.2 + br * .3]]), t.b);
    r.poly([[17.4, 8], [17.8, 3.6 + br * .3], [20.8, 6.6]], t.i); r.poly(mir([[17.4, 8], [17.8, 3.6 + br * .3], [20.8, 6.6]]), t.i);
    // kafa
    r.ell(24, hy, 8.4, 6.8, (x, y, u, v) => (v < -.45 && Math.abs(u) < .55) ? t.s : (v > .5 ? t.l : t.b));
    r.ell(17, hy + 4, 2.8, 2.6, t.l); r.ell(31, hy + 4, 2.8, 2.6, t.l); // yanak tüyü
    r.ell(24, hy + 3.6, 4.6, 3.4, t.l); // ağız bölgesi
    const dk = C('#0c0c10'); r.px(23, hy + 2.1, dk); r.px(24, hy + 2.1, dk); r.px(23, hy + 3, dk); r.px(24, hy + 3, dk);
    crEye(r, t, P, 19, hy - 1.4); crEye(r, t, P, 27, hy - 1.4);
    if (P.mouth == 'open') { r.ell(24, hy + 6, 2.2, 1.4, C('#5a1f2a')); r.px(24, hy + 6.6, C('#f08aa0')); }
    else { r.px(22, hy + 5.4, t.o_); r.px(23, hy + 5.9, t.o_); r.px(24, hy + 5.9, t.o_); r.px(25, hy + 5.4, t.o_); }
  }
  function frontDragon(r, t, P) {
    const br = P.breath || 0, hd = P.head || {}, hy = 13.5 + br * .4 + (hd.dy || 0), f = br * 1.6;
    // kanatlar (arkada): iki yana açık, kemik çizgili
    const W = [[18, 26], [12.5, 16.5], [6, 11.5 - f], [1.2, 7.5 - f], [1.6, 17], [4.6, 22.5], [8.4, 24.5], [10, 29.5], [14.6, 30.5]];
    r.poly(W, t.w); r.poly(mir(W), t.w);
    for (const [a, b] of [[[18, 26], [12.5, 16.5]], [[12.5, 16.5], [1.2, 7.5 - f]], [[12.5, 16.5], [1.6, 17]], [[12.5, 16.5], [5, 23]], [[12.5, 16.5], [10, 28]]]) { r.line(...a, ...b, 1, t.b); r.line(48 - a[0], a[1], 48 - b[0], b[1], 1, t.b); }
    // kuyruk: sağ altta kıvrık, ucu uçlu
    const tp = [[30, 36], [35, 37.5], [39.5, 35.5], [41, 31.5], [39.5, 28.5]];
    for (let i = 0; i < tp.length - 1; i++) r.line(...tp[i], ...tp[i + 1], Math.max(1.8, 3.8 - i * .6), t.b);
    r.poly([[38, 29], [39.6, 25], [41.4, 29]], t.s);
    // gövde + karın plakaları
    r.ell(24, 29, 7.8, 8.6, (x, y, u, v) => { if (Math.abs(u) < .55 && v > -.55) return (y % 2 == 0) ? dark(t.l, .86) : t.l; return v > .45 ? dark(t.b, .82) : (((x >> 1) + y) % 3 == 0 ? dark(t.b, .9) : t.b); });
    for (const lx of [16.8, 31.2]) { r.line(lx + (lx < 24 ? 2.4 : -2.4), 28, lx, 36.5, 3, t.b); r.ell(lx - (lx < 24 ? .6 : -.6), 37.5, 3, 1.4, dark(t.b, .9)); for (const d of [-1.4, 0, 1.4]) r.px(lx - (lx < 24 ? .6 : -.6) + d, 38.3, t.h); }
    // boynuzlar ve yele
    const hn = [[18.4, hy - 5.5], [14, 1 + (hd.dy || 0)], [21, hy - 7]];
    r.poly(hn, t.h); r.poly(mir(hn), t.h);
    r.poly([[22.4, hy - 6.4], [24, 3.2 + (hd.dy || 0)], [25.6, hy - 6.4]], t.s);
    const fr = [[16.6, hy - .5], [10.6, hy - 1.5], [11.6, hy + 2], [16.8, hy + 3.6]]; r.poly(fr, t.s); r.poly(mir(fr), t.s);
    // kafa
    r.ell(24, hy, 8.2, 6.8, (x, y, u, v) => v > .5 ? dark(t.b, .9) : (((x >> 1) + y) % 3 == 0 ? dark(t.b, .9) : t.b));
    r.ell(24, hy + 4, 4.6, 2.9, t.l);
    r.px(22.6, hy + 3.4, C('#2a0c0c')); r.px(25.4, hy + 3.4, C('#2a0c0c'));
    for (const dx of [-7, -6, -5, 5, 6, 7]) r.px(24 + dx, hy - 4 + Math.abs(dx) * .3, t.s); // kaş
    crEye(r, t, P, 19, hy - .6, true); crEye(r, t, P, 27, hy - .6, true);
    if (P.mouth == 'open') { r.ell(24, hy + 6.2, 2.4, 1.4, C('#5a1f2a')); r.ell(24, hy + 8.4, 1.6, 1.8, C('#ff8a1e')); r.px(24, hy + 8, C('#fff1a8')); }
    else { for (const [dx, dy] of [[-3, 5.2], [-2, 5.9], [-1, 6.2], [0, 6.2], [1, 6.2], [2, 5.9], [3, 5.2]]) r.px(24 + dx, hy + dy, t.o_); }
  }
  POSES.front = (r, t, P) => { if (t.sp == 'kurt') frontWolf(r, t, P); else frontDragon(r, t, P); return { whisk: null }; };
  const sitCat = POSES.sit; POSES.sit = (r, t, P) => t.sp ? POSES.front(r, t, P) : sitCat(r, t, P);

  POSES.loaf = (r, t, P) => {
    const br = P.breath || 0;
    tail(r, t, { ...P, tail: { a: 160, curl: -6, sway: 6, n: 9, ...(P.tail || {}) } }, 8.5, 33.5);
    r.ell(21, 33, 12.5, 5.5 + br * .3, bodyCol(t, .5));
    r.ell(12.5, 33.5, 6.5, 5, bodyCol(t, .5));
    r.ell(30, 34, 5, 4.4, bodyCol(t, .5));
    r.ell(35.5, 37, 3.6, 1.7, (t.pat == 'siamese') ? t.p : (t.pat == 'tux' || t.belly || t.fluff) ? t.l : t.b);
    r.ell(31, 37, 3.2, 1.6, (t.pat == 'siamese') ? t.p : (t.pat == 'tux' || t.belly || t.fluff) ? dark(t.l, .9) : dark(t.b, .9));
    return head(r, t, P, 34.5, 28.5 + (P.head && P.head.base || 0));
  };

  POSES.curl = (r, t, P) => {
    const br = P.breath || 0;
    r.ell(22, 32.5, 13.5, 6.4 + br * .35, bodyCol(t, .45));
    r.ell(31, 32.5, 6, 5.5, bodyCol(t, .5));
    // kuyruk gövdeyi önden sarar
    const cp = [[9, 35], [13, 37.5], [19, 38], [25, 38], [31, 37.8], [35, 36.5]];
    let tc = t.b; if (t.pat == 'siamese') tc = t.p;
    for (let i = 0; i < cp.length - 1; i++) { let c = tc; if (t.pat == 'tabby' && i % 2) c = t.s; if (t.pat == 'calico') c = t.oc; if (t.pat == 'tux' && i == cp.length - 2) c = t.l; r.line(cp[i][0], cp[i][1], cp[i + 1][0], cp[i + 1][1], 3 - (t.fluff ? -1 : 0), c); }
    return head(r, t, { ...P, flat: 1, eyes: P.eyes || 'closed' }, 33.5, 30.5 + (P.head && P.head.dy || 0));
  };

  // ---- yeni pozlar (kediler): gerinme, pati uzatma, yumakla oyun ----
  const pawCol = t => (t.pat == 'tux' || t.belly || t.fluff) ? t.l : (t.pat == 'siamese' ? t.p : t.b);
  const legCol = t => t.pat == 'siamese' ? t.p : t.b;
  // gerinme: kalça havada, göğüs ve ön patiler öne uzanmış yerde, kuyruk dik
  POSES.bow = (r, t, P) => {
    const br = P.breath || 0, lc = legCol(t), pc = pawCol(t), sw = P.tail && P.tail.sway != null ? P.tail.sway : 6;
    leg(r, t, 12.5, 27, 10, 38, true); leg(r, t, 16.5, 28, 17, 38, true);
    tail(r, t, { ...P, tail: { a: 258, curl: 3, sway: sw, n: 8, ...(P.tail || {}) } }, 10.5, 24.5);
    r.ell(21, 30.5 + br * .2, 11.5, 5.6, bodyCol(t, .6), .3);
    r.ell(14, 27.5, 5.8, 5.6, bodyCol(t, .55));
    r.line(26, 33, 38, 37, 3, dark(lc, .85)); r.ell(40, 37.4, 3, 1.5, dark(pc, .9));
    r.line(28, 32.5, 40, 36, 3, lc); r.ell(42, 36.6, 3, 1.6, pc);
    leg(r, t, 13.5, 28.5, 12, 38, false); leg(r, t, 17.5, 29, 19.5, 38, false);
    return head(r, t, { ...P, eyes: P.eyes || 'half', head: { dy: 1, ...(P.head || {}) } }, 35, 29.5);
  };
  // pati uzatma: oturur, bir ön pati havaya kalkar (sallanabilir)
  POSES.reach = (r, t, P) => {
    const w = sitCat(r, t, { ...P, paw: undefined }), lc = legCol(t), pc = pawCol(t), up = P.up || 0;
    const tx = 42 + Math.max(-4, Math.min(0, P.wave || 0)), ty = 5 - up;
    r.line(30, 22, 40.5, 17.5, 3, lc); r.line(40.5, 17.5, tx, ty + 3, 3, lc); r.ell(tx, ty + 1.5, 2.5, 2.2, pc);
    return w;
  };
  // yumakla oyun: yerdeki yumağa pati uzatır, yumak sağa sola yuvarlanır
  POSES.play = (r, t, P) => {
    const bx = 40 + (P.ball || 0), by = 34.5, pc = pawCol(t), lc = legCol(t), red = C('#d6453d'), red2 = C('#9c2d28'), rl = C('#ef7a6f');
    // yumak ve ipi
    const s = P.ph || 0;
    r.line(bx + 1, by + 3, bx + 4 + Math.sin(s) * 1.2, 37.4, 1, red2); r.line(bx + 4, 37.4, 46, 36.4 - Math.cos(s), 1, red2);
    r.ell(bx, by, 3.7, 3.7, red); r.line(bx - 2.4, by - .8, bx + 1.8, by + 2.4, 1, red2); r.line(bx - 1.4, by - 2.2, bx + 2.6, by + .6, 1, red2); r.px(bx - 1.2, by - 1.6, rl);
    const w = sitCat(r, t, { ...P, paw: undefined, head: { dx: 1, dy: 3 + (P.nod || 0), ...(P.head || {}) }, eyes: P.eyes || 'open', look: { x: 1, y: 1 } });
    const px = 36.2 + (P.hit || 0), py = 34.2 + (P.hit ? -1 : 0);
    r.line(30, 22, 34, 30, 3, lc); r.line(34, 30, px, py, 3, lc); r.ell(px + 1.4, py + .8, 2.4, 1.7, pc);
    return w;
  };
  for (const k of ['bow', 'reach', 'play']) { const f = POSES[k]; POSES[k] = (r, t, P) => t.sp ? POSES.sit(r, t, P) : f(r, t, P); }

  // duvara tırmanma: kafa yukarıda, ön patiler duvara (x≈41) uzanır, kuyruk aşağı sarkar
  POSES.climb = (r, t, P) => {
    const ph = P.ph || 0, s1 = Math.sin(ph * Math.PI * 2), s2 = Math.sin(ph * Math.PI * 2 + Math.PI), bob = (P.bob || 0) + 5;
    const legc = t.pat == 'siamese' ? t.p : t.b, pc = (t.pat == 'tux' || t.belly || t.fluff) ? t.l : legc;
    r.line(20, 32 + bob, 28, 36 + bob, 3, dark(legc, .8)); r.line(28, 36 + bob, 37, 33 + bob + s2 * 2.2, 3, dark(legc, .8)); r.ell(38.5, 33 + bob + s2 * 2.2, 2.2, 1.7, dark(pc, .85));
    tail(r, t, { ...P, tail: { a: 98, curl: 3, sway: 9, n: 8, ...(P.tail || {}) } }, 15.5, 33 + bob);
    r.line(30, 17 + bob, 40, 11 + bob + s2 * 2.5, 3, dark(legc, .8)); r.ell(41, 11 + bob + s2 * 2.5, 2.2, 1.8, dark(pc, .85));
    r.ell(24, 26 + bob, 11, 6.2, bodyCol(t, .75), -.98);
    if (t.pat == 'tux' || t.belly) r.ell(28.5, 20 + bob, 3, 5.5, t.l, -.5);
    r.line(21, 31 + bob, 29, 37 + bob, 3, legc); r.line(29, 37 + bob, 38, 36 + bob + s1 * 2.2, 3, legc); r.ell(39.5, 36 + bob + s1 * 2.2, 2.3, 1.7, pc);
    r.line(31, 19 + bob, 40, 14 + bob + s1 * 2.5, 3, legc); r.ell(41, 14 + bob + s1 * 2.5, 2.3, 1.8, pc);
    return head(r, t, { ...P, ear: 0 }, 34, 9 + bob + (P.head && P.head.dy || 0));
  };

  // ---- ana çizim ----
  // kullanıcının kendi görselleri (yalnızca o cihazda saklanır): tüm pozlarda aynı resim, yürürken sekme, yatarken basık
  const custom = new Map();
  function drawCustom(cu, P) {
    const cv = document.createElement('canvas'); cv.width = N; cv.height = H; const x = cv.getContext('2d');
    x.fillStyle = 'rgba(0,0,0,.24)'; x.beginPath(); x.ellipse(24, B + 1, Math.min(14, cu.width / 2 + 2), 1.7, 0, 0, 6.3); x.fill();
    const pose = P.pose || 'stand', sq = pose == 'loaf' || pose == 'curl' ? .72 : 1, bob = pose == 'stand' ? Math.abs(Math.sin((P.ph || 0) * Math.PI * 2)) * -1.5 : (P.breath || 0) * -.4;
    const w = cu.width, h = cu.height * sq, dx = Math.round((N - w) / 2 + (pose == 'climb' ? 3 : 0));
    x.imageSmoothingEnabled = false; x.drawImage(cu, 0, 0, cu.width, cu.height, dx, Math.round(B + 1 - h + bob), w, h);
    return cv;
  }
  function addCustom(id, name, bmp) { // bmp: ImageBitmap/canvas; 46x38 kutuya sığacak şekilde küçültülür
    const k = Math.min(46 / bmp.width, 38 / bmp.height, 1), w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(bmp, 0, 0, w, h);
    custom.set(id, c); if (!api.types.some(t => t[0] == id)) api.types.push([id, name]);
  }
  const cache = new Map();
  function draw(id, P) {
    if (custom.has(id)) return drawCustom(custom.get(id), P);
    const t = T[id] || T.zencefil, r = ctx();
    if (P.shadow !== false) { const k = pack(0, 0, 0, 60); for (let x = 9; x <= 38; x++) { const d = Math.abs(x - 23.5) / 15; if (d < 1) { r.px(x, B + 1, k); if (d < .7) r.px(x, B + 2, k); } } }
    if (t.sp == 'ejder' && !['sit', 'bow', 'reach', 'play'].includes(P.pose || 'stand')) wings(r, t, P);
    const f = POSES[P.pose || 'stand']; const w = f(r, t, P);
    finish(r, t);
    if (w && !P.noWhisk) whiskers(r, w.whisk);
    const cv = document.createElement('canvas'); cv.width = N; cv.height = H;
    const c2 = cv.getContext('2d'), im = c2.createImageData(N, H); new Uint32Array(im.data.buffer).set(r.b); c2.putImageData(im, 0, 0);
    return cv;
  }

  const api = window.KediArt = { addCustom, hasCustom: id => custom.has(id), removeCustom(id) { custom.delete(id); const i = api.types.findIndex(t => t[0] == id); if (i >= 0) api.types.splice(i, 1); }, draw, N, H, B, types: Object.keys(T).map(k => [k, T[k].name]), thumb(id) { try { const c = draw(id, { pose: 'sit', tail: { sway: 0 }, shadow: false }), o = document.createElement('canvas'); o.width = N; o.height = 42; o.getContext('2d').drawImage(c, 0, 0); return o.toDataURL(); } catch { return ''; } } };
})();
