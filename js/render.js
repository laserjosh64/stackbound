// Stackbound canvas rendering: board, pieces, previews, bag grid
'use strict';
(function (SB) {
  const Rn = (SB.Render = {});
  // board colours: a style (sweet.js) can set Rn.theme.board / .grid; without them these defaults show
  const BOARD_BG = '#0b0b1a', BOARD_GRID = 'rgba(120,120,200,0.08)';
  Rn.theme = {};

  function shade(hex, amt) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const n = parseInt(c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = SB.clamp(Math.round(r + amt * (amt > 0 ? 255 - r : r)), 0, 255);
    g = SB.clamp(Math.round(g + amt * (amt > 0 ? 255 - g : g)), 0, 255);
    b = SB.clamp(Math.round(b + amt * (amt > 0 ? 255 - b : b)), 0, 255);
    return `rgb(${r},${g},${b})`;
  }
  Rn.shade = shade;

  // ---------- block art ----------
  // Static look of each (colour, material, size) is painted once into a sprite;
  // animated touches (gold glint, holo shimmer, twinkles) are layered per frame.
  const rr = (c, x, y, w, h, r) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };
  Rn.rr = rr;
  const hash = (i) => { let h = (i * 374761393) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h & 0xffff) / 0xffff; };
  Rn.hash = hash;
  const rgba = (hex, a) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const n = parseInt(c, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  Rn.rgba = rgba;
  const PAL = {
    gold: ['#fff4b0', '#ffd23b', '#c38a12', '#6b4505'],
    steel: ['#f0f5fb', '#aebdcd', '#66768a', '#2e3742'],
    stone: ['#a39a8a', '#7c7366', '#544c42', '#2e2a24'],
  };
  const spriteCache = new Map();

  function paintBody(c, S, top, mid, bot, deep) {
    const p = Math.max(1, S * 0.045), w = S - 2 * p, r = Math.max(2, S * 0.16);
    let g = c.createLinearGradient(p, p, S - p, S - p);
    g.addColorStop(0, top); g.addColorStop(0.5, mid); g.addColorStop(1, deep);
    c.fillStyle = g; rr(c, p, p, w, w, r); c.fill();
    const i = S * 0.15;
    g = c.createLinearGradient(0, i, 0, S - i);
    g.addColorStop(0, mid); g.addColorStop(1, bot);
    c.fillStyle = g; rr(c, i, i, S - 2 * i, S - 2 * i, r * 0.6); c.fill();
    return { p, w, r, i };
  }
  function gloss(c, S, i, a) {
    const g = c.createLinearGradient(0, i, 0, S * 0.55);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; rr(c, i, i, S - 2 * i, (S - 2 * i) * 0.5, S * 0.08); c.fill();
  }
  function outline(c, S, p, w, r) { c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; rr(c, p + 0.5, p + 0.5, w - 1, w - 1, r); c.stroke(); }
  function star4(c, x, y, r) {
    c.beginPath();
    c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
    c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
  }
  Rn.star4 = star4;

  // ---------- piece skins (bought at the Prize Counter, painted in skins.js) ----------
  // A skin paints the plain block body and returns the metrics later layers (lucky, holo, Looks) draw against.
  // Edge-aware skins (edgy) get the block's place in its piece, so their sprites are cached per edge and lead.
  const SKINS = {};
  Rn.SKINS = SKINS;
  const curSkin = () => (SB.Cosmetic ? SB.Cosmetic.skin() : 'puffy');
  Rn.skinEdgy = (skin) => !!(SKINS[skin || curSkin()] && SKINS[skin || curSkin()].edgy);
  const seedOf = (str) => { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h % 997; };

  // Materials on a themed skin: the skin paints the piece in the material's colour, then a finish is laid over
  // only what the skin painted (source-atop), so a Gold building or a Glass castle still reads as both.
  const mix = (a, b, k) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
  };
  const FINISH = {
    gold: {
      base: (col) => mix('#f2bb22', col, 0.12),
      apply(c, S) {
        let g = c.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, 'rgba(255,250,205,0.55)'); g.addColorStop(0.45, 'rgba(255,230,120,0.08)'); g.addColorStop(1, 'rgba(120,64,0,0.42)');
        c.fillStyle = g; c.fillRect(0, 0, S, S);
        // a polished band across the block and a stamped diamond
        g = c.createLinearGradient(S * 0.1, 0, S * 0.6, S * 0.5);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,253,225,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, S, S);
        c.fillStyle = 'rgba(255,248,200,0.7)';
        c.beginPath(); c.moveTo(S * 0.5, S * 0.38); c.lineTo(S * 0.6, S * 0.5); c.lineTo(S * 0.5, S * 0.62); c.lineTo(S * 0.4, S * 0.5); c.closePath(); c.fill();
      },
    },
    glass: {
      base: (col) => col,
      apply(c, S) {
        // see-through: knock the whole sprite back, cool it, then draw the reflections over it
        c.globalCompositeOperation = 'destination-in'; c.fillStyle = 'rgba(0,0,0,0.62)'; c.fillRect(0, 0, S, S);
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = 'rgba(225,250,255,0.24)'; c.fillRect(0, 0, S, S);
        c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineCap = 'round'; c.lineWidth = Math.max(1.5, S * 0.07);
        c.beginPath(); c.moveTo(S * 0.2, S * 0.56); c.lineTo(S * 0.56, S * 0.2); c.stroke();
        c.lineWidth = Math.max(1, S * 0.035);
        c.beginPath(); c.moveTo(S * 0.32, S * 0.72); c.lineTo(S * 0.72, S * 0.32); c.stroke();
      },
    },
    steel: {
      base: (col) => mix('#a3b2c2', col, 0.18),
      apply(c, S) {
        for (let y = 0; y < S; y += 2) { c.fillStyle = `rgba(${hash(y * 7 + S) > 0.5 ? '255,255,255' : '0,0,0'},${0.05 + hash(y + 3) * 0.07})`; c.fillRect(0, y, S, 1); }
        const g = c.createLinearGradient(0, 0, 0, S);
        g.addColorStop(0, 'rgba(255,255,255,0.3)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(10,20,40,0.3)');
        c.fillStyle = g; c.fillRect(0, 0, S, S);
      },
    },
    stone: {
      base: (col) => mix('#857b6c', col, 0.1),
      apply(c, S) {
        c.fillStyle = 'rgba(40,32,24,0.18)'; c.fillRect(0, 0, S, S);
        for (let k = 0; k < 30; k++) {
          const x = hash(k * 13 + 1) * S, y = hash(k * 29 + 7) * S, rs = 0.5 + hash(k * 5) * S * 0.04;
          c.fillStyle = hash(k * 3) > 0.5 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.16)';
          c.beginPath(); c.arc(x, y, rs, 0, 7); c.fill();
        }
        c.strokeStyle = 'rgba(25,20,15,0.6)'; c.lineWidth = Math.max(1, S * 0.04);
        c.beginPath(); c.moveTo(S * 0.18, S * 0.35); c.lineTo(S * 0.38, S * 0.45); c.lineTo(S * 0.33, S * 0.62); c.lineTo(S * 0.55, S * 0.78); c.stroke();
      },
    },
    crystal: {
      base: (col) => mix(col, '#ffffff', 0.32),
      apply(c, S) {
        const a = S * 0.26, b = S * 0.74;
        const tri = (pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]); c.closePath(); c.fill(); };
        tri([0, 0, S, 0, b, a, a, a], 'rgba(255,255,255,0.42)');
        tri([S, 0, S, S, b, b, b, a], 'rgba(0,30,60,0.12)');
        tri([S, S, 0, S, a, b, b, b], 'rgba(0,20,50,0.38)');
        tri([0, S, 0, 0, a, a, a, b], 'rgba(255,255,255,0.14)');
        const g = c.createLinearGradient(a, a, b, b);
        g.addColorStop(0, 'rgba(240,253,255,0.55)'); g.addColorStop(1, 'rgba(240,253,255,0.05)');
        c.fillStyle = g; c.fillRect(a, a, b - a, b - a);
      },
    },
  };
  Rn.FINISH = FINISH;

  function paintSprite(S, color, mat, o, skin) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d');
    let base = o.garbage ? '#3a3c50' : o.plain ? '#7d7d90' : color;
    let m;
    const fin = !o.garbage && SKINS[skin] && FINISH[mat];
    if (fin) {
      m = SKINS[skin].paint(c, S, fin.base(base), o.edges === undefined ? 15 : o.edges, !!o.lead, seedOf(base));
      c.save(); c.globalCompositeOperation = 'source-atop'; fin.apply(c, S); c.restore();
    } else if (mat === 'gold') {
      const P = PAL.gold;
      m = paintBody(c, S, P[0], P[1], P[2], P[3]);
      // engraved diamond and rim
      c.strokeStyle = 'rgba(110,70,0,0.55)'; c.lineWidth = Math.max(1, S * 0.05);
      c.beginPath(); c.moveTo(S / 2, S * 0.3); c.lineTo(S * 0.7, S / 2); c.lineTo(S / 2, S * 0.7); c.lineTo(S * 0.3, S / 2); c.closePath(); c.stroke();
      c.fillStyle = 'rgba(255,250,210,0.55)';
      c.beginPath(); c.moveTo(S / 2, S * 0.36); c.lineTo(S * 0.6, S / 2); c.lineTo(S / 2, S * 0.5); c.lineTo(S * 0.4, S / 2); c.closePath(); c.fill();
      gloss(c, S, m.i, 0.45);
      c.strokeStyle = rgba(color, 0.9); c.lineWidth = Math.max(1, S * 0.05);
      rr(c, m.i * 0.6, m.i * 0.6, S - m.i * 1.2, S - m.i * 1.2, m.r * 0.7); c.stroke();
    } else if (mat === 'glass') {
      const p = Math.max(1, S * 0.045), w = S - 2 * p, r = Math.max(2, S * 0.16);
      let g = c.createLinearGradient(p, p, S, S);
      g.addColorStop(0, rgba(color, 0.42)); g.addColorStop(1, rgba(color, 0.14));
      c.fillStyle = g; rr(c, p, p, w, w, r); c.fill();
      c.strokeStyle = 'rgba(235,252,255,0.95)'; c.lineWidth = Math.max(1.2, S * 0.05);
      rr(c, p + 0.8, p + 0.8, w - 1.6, w - 1.6, r); c.stroke();
      c.strokeStyle = rgba(color, 0.9); c.lineWidth = 1;
      rr(c, p + S * 0.1, p + S * 0.1, w - S * 0.2, w - S * 0.2, r * 0.6); c.stroke();
      // reflections
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineCap = 'round'; c.lineWidth = Math.max(1.5, S * 0.07);
      c.beginPath(); c.moveTo(S * 0.24, S * 0.52); c.lineTo(S * 0.52, S * 0.24); c.stroke();
      c.lineWidth = Math.max(1, S * 0.035);
      c.beginPath(); c.moveTo(S * 0.3, S * 0.68); c.lineTo(S * 0.68, S * 0.3); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.9)'; star4(c, S * 0.74, S * 0.74, S * 0.08);
      m = { p, w, r, i: S * 0.15, own: true };
    } else if (mat === 'steel') {
      const P = PAL.steel;
      m = paintBody(c, S, P[0], P[1], P[2], P[3]);
      c.save(); rr(c, m.i, m.i, S - 2 * m.i, S - 2 * m.i, m.r * 0.6); c.clip();
      for (let y = 0; y < S; y += 2) { c.fillStyle = `rgba(${hash(y * 7 + S) > 0.5 ? '255,255,255' : '0,0,0'},${0.05 + hash(y + 3) * 0.06})`; c.fillRect(0, y, S, 1); }
      c.restore();
      c.strokeStyle = rgba(color, 0.95); c.lineWidth = Math.max(1.5, S * 0.07);
      rr(c, m.i * 0.75, m.i * 0.75, S - m.i * 1.5, S - m.i * 1.5, m.r * 0.6); c.stroke();
      for (const [px, py] of [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]]) {
        c.fillStyle = '#39424e'; c.beginPath(); c.arc(S * px, S * py, Math.max(1.3, S * 0.055), 0, 7); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(S * px - S * 0.015, S * py - S * 0.015, Math.max(0.6, S * 0.022), 0, 7); c.fill();
      }
      gloss(c, S, m.i, 0.3);
    } else if (mat === 'stone') {
      const P = PAL.stone;
      m = paintBody(c, S, P[0], P[1], P[2], P[3]);
      c.save(); rr(c, m.p, m.p, m.w, m.w, m.r); c.clip();
      for (let k = 0; k < 26; k++) {
        const x = hash(k * 13 + 1) * S, y = hash(k * 29 + 7) * S, rs = 0.5 + hash(k * 5) * S * 0.045;
        c.fillStyle = hash(k * 3) > 0.5 ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.13)';
        c.beginPath(); c.arc(x, y, rs, 0, 7); c.fill();
      }
      c.strokeStyle = 'rgba(25,20,15,0.65)'; c.lineWidth = Math.max(1, S * 0.04);
      c.beginPath(); c.moveTo(S * 0.18, S * 0.35); c.lineTo(S * 0.38, S * 0.45); c.lineTo(S * 0.33, S * 0.62); c.lineTo(S * 0.55, S * 0.78); c.stroke();
      c.restore();
      c.strokeStyle = rgba(color, 0.6); c.lineWidth = Math.max(1, S * 0.05);
      rr(c, m.i * 0.7, m.i * 0.7, S - m.i * 1.4, S - m.i * 1.4, m.r * 0.6); c.stroke();
    } else if (mat === 'crystal') {
      const p = Math.max(1, S * 0.045), w = S - 2 * p, r = Math.max(2, S * 0.12);
      c.save(); rr(c, p, p, w, w, r); c.clip();
      const cx = S / 2, cy = S / 2, a = S * 0.26, b = S * 0.74;
      const tri = (pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]); c.closePath(); c.fill(); };
      tri([0, 0, S, 0, b, a, a, a], shade(base, 0.55));
      tri([S, 0, S, S, b, b, b, a], shade(base, -0.1));
      tri([S, S, 0, S, a, b, b, b], shade(base, -0.45));
      tri([0, S, 0, 0, a, a, a, b], shade(base, 0.2));
      const g = c.createLinearGradient(a, a, b, b);
      g.addColorStop(0, '#e9fdff'); g.addColorStop(1, shade(base, 0.15));
      c.fillStyle = g; c.fillRect(a, a, b - a, b - a);
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(a, a); c.moveTo(S, 0); c.lineTo(b, a); c.moveTo(0, S); c.lineTo(a, b); c.moveTo(S, S); c.lineTo(b, b); c.stroke();
      c.strokeRect(a + 0.5, a + 0.5, b - a - 1, b - a - 1);
      c.restore();
      outline(c, S, p, w, r);
      m = { p, w, r, i: S * 0.15, own: true };
    } else if (SKINS[skin]) {
      m = SKINS[skin].paint(c, S, base, o.edges === undefined ? 15 : o.edges, !!o.lead, seedOf(base));
    } else {
      m = paintBody(c, S, shade(base, 0.38), shade(base, 0.05), shade(base, -0.22), shade(base, -0.5));
      if (o.garbage) {
        c.save(); rr(c, m.p, m.p, m.w, m.w, m.r); c.clip();
        c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = Math.max(1, S * 0.08);
        for (let k = -S; k < S * 2; k += S * 0.28) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k - S, S); c.stroke(); }
        c.restore();
      } else gloss(c, S, m.i, 0.32);
    }
    if (!o.garbage && (mat === 'lucky' || mat === 'holo')) {
      if (mat === 'lucky') {
        c.strokeStyle = '#5dff8a'; c.lineWidth = Math.max(1.5, S * 0.06);
        rr(c, m.i * 0.65, m.i * 0.65, S - m.i * 1.3, S - m.i * 1.3, m.r * 0.6); c.stroke();
        c.fillStyle = '#1f9e4a';
        const q = S * 0.11;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { c.beginPath(); c.arc(S / 2 + dx * q, S / 2 + dy * q, q * 1.05, 0, 7); c.fill(); }
        c.fillStyle = '#6dff98';
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { c.beginPath(); c.arc(S / 2 + dx * q - q * 0.25, S / 2 + dy * q - q * 0.25, q * 0.45, 0, 7); c.fill(); }
        c.strokeStyle = '#1f9e4a'; c.lineWidth = Math.max(1, S * 0.05);
        c.beginPath(); c.moveTo(S / 2, S / 2); c.quadraticCurveTo(S * 0.56, S * 0.7, S * 0.66, S * 0.76); c.stroke();
      } else if (mat === 'holo') {
        const g = c.createLinearGradient(0, 0, S, S);
        ['#ff5ce1', '#5cf0ff', '#fff35c', '#5cff8a', '#ff5ce1'].forEach((col, k) => g.addColorStop(k / 4, col));
        c.strokeStyle = g; c.lineWidth = Math.max(1.5, S * 0.08);
        rr(c, m.i * 0.6, m.i * 0.6, S - m.i * 1.2, S - m.i * 1.2, m.r * 0.6); c.stroke();
      }
    }
    // specials and behaviours reshape the look of every block of the piece (see looks.js)
    if ((o.beh || o.spec) && SB.Looks) SB.Looks.bake(c, S, o, m);
    if (!m.own) outline(c, S, m.p, m.w, m.r);
    return cv;
  }
  // one brick cell of a Warden wall: dark stone, mortar seams and a red edge glow
  const wallCache = new Map();
  function wallSprite(S) {
    let c = wallCache.get(S);
    if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, '#565071'); g.addColorStop(1, '#2d293f');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    const m = Math.max(1, Math.round(S * 0.05));
    // mortar: one course across the middle, staggered seams above and below
    x.fillStyle = 'rgba(10,8,20,.75)';
    x.fillRect(0, Math.round(S / 2) - m / 2, S, m);
    x.fillRect(Math.round(S * 0.62), 0, m, S / 2);
    x.fillRect(Math.round(S * 0.28), S / 2, m, S / 2);
    x.fillRect(0, S - m, S, m);
    x.fillStyle = 'rgba(255,255,255,.10)';
    x.fillRect(0, Math.round(S / 2) + m / 2, S, 1);
    x.fillRect(0, 0, S, 1);
    // chipped speckles
    x.fillStyle = 'rgba(0,0,0,.22)';
    for (let i = 0; i < 6; i++) x.fillRect(((i * 37) % 97) / 97 * S, ((i * 53) % 89) / 89 * S, Math.max(1, S * 0.05), Math.max(1, S * 0.05));
    // red Warden edges
    const e = x.createLinearGradient(0, 0, S, 0);
    e.addColorStop(0, 'rgba(255,77,106,.35)'); e.addColorStop(0.18, 'rgba(255,77,106,0)');
    e.addColorStop(0.82, 'rgba(255,77,106,0)'); e.addColorStop(1, 'rgba(255,77,106,.35)');
    x.fillStyle = e; x.fillRect(0, 0, S, S);
    wallCache.set(S, c);
    return c;
  }
  function sprite(S, color, mat, o) {
    const skin = o.garbage ? '' : o.skin || curSkin();
    let key = S + '|' + color + '|' + (mat || '') + '|' + (o.garbage ? 1 : 0) + (o.plain ? 1 : 0) + '|' + (o.beh || '') + '|' + (o.spec || '') + '|' + skin;
    if (SKINS[skin] && SKINS[skin].edgy) key += '|' + (o.edges === undefined ? 15 : o.edges) + (o.lead ? 'L' : '');
    let sp = spriteCache.get(key);
    if (!sp) { sp = paintSprite(S, color, mat, o, skin); if (spriteCache.size > 2400) spriteCache.clear(); spriteCache.set(key, sp); }
    return sp;
  }

  // strokes only the outside edge of a group of cells (a piece), inset a little so it sits inside the cells
  Rn.traceOutline = function (ctx, cells, cs, rowY, top, inset) {
    const has = new Set(cells.map(([x, y]) => x + ',' + y));
    const k = inset || 0;
    ctx.beginPath();
    for (const [x, y] of cells) {
      if (top !== undefined && y < top) continue;
      const x0 = x * cs + k, x1 = (x + 1) * cs - k, y0 = rowY(y) + k, y1 = rowY(y) + cs - k;
      const t = !has.has(x + ',' + (y - 1)), b = !has.has(x + ',' + (y + 1)), l = !has.has(x - 1 + ',' + y), r = !has.has(x + 1 + ',' + y);
      // extend joined edges to the cell border so neighbouring segments meet
      const xa = l ? x0 : x * cs, xb = r ? x1 : (x + 1) * cs, ya = t ? y0 : rowY(y), yb = b ? y1 : rowY(y) + cs;
      if (t) { ctx.moveTo(xa, y0); ctx.lineTo(xb, y0); }
      if (b) { ctx.moveTo(xa, y1); ctx.lineTo(xb, y1); }
      if (l) { ctx.moveTo(x0, ya); ctx.lineTo(x0, yb); }
      if (r) { ctx.moveTo(x1, ya); ctx.lineTo(x1, yb); }
    }
    ctx.stroke();
  };

  Rn.block = function (ctx, x, y, s, color, opts) {
    opts = opts || {};
    const a = opts.alpha === undefined ? 1 : opts.alpha;
    if (a <= 0) return;
    const S = Math.max(4, Math.round(s));
    // Yolk (every material at once) shows as Holo with Gold's sparkle
    const yolk = !opts.garbage && opts.mat === 'yolk';
    const mat = opts.garbage ? null : yolk ? 'holo' : opts.mat;
    const t = performance.now() / 1000;
    const look = (opts.spec || opts.beh) && SB.Looks;
    if (look) { const off = SB.Looks.offset(opts, t, s); if (off) { x += off.dx; y += off.dy; } }
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(sprite(S, color || '#888', mat, opts), x, y, s, s);
    const ph = x * 0.013 + y * 0.021;
    if (mat === 'gold' || mat === 'holo' || mat === 'steel') {
      ctx.save();
      rr(ctx, x + s * 0.05, y + s * 0.05, s * 0.9, s * 0.9, s * 0.15); ctx.clip();
      if (mat === 'holo') {
        const g = ctx.createLinearGradient(x, y, x + s, y + s);
        const h0 = (t * 80 + ph * 900) % 360;
        for (let k = 0; k <= 3; k++) g.addColorStop(k / 3, `hsla(${(h0 + k * 90) % 360},100%,65%,0.55)`);
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = g; ctx.fillRect(x, y, s, s);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * 0.18; ctx.fillRect(x, y, s, s);
      } else {
        const per = mat === 'gold' ? 2.6 : 4.5;
        const k = (((t + ph * 3) % per) / per) * 2.4 - 0.7;
        const bx = x + k * s;
        const g = ctx.createLinearGradient(bx - s * 0.3, y, bx + s * 0.3, y + s * 0.4);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${mat === 'gold' ? 0.75 : 0.4})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g; ctx.fillRect(x, y, s, s);
      }
      ctx.restore();
    }
    if (mat === 'crystal' || mat === 'lucky' || mat === 'glass' || mat === 'gold' || yolk) {
      // twinkles; gold (and yolk) sparkles twice as often
      const goldy = mat === 'gold' || yolk;
      const tw = Math.max(Math.pow(Math.max(0, Math.sin(t * 2.1 + ph * 40)), 12), goldy ? Math.pow(Math.max(0, Math.sin(t * 1.7 + ph * 23 + 2)), 14) : 0);
      if (tw > 0.05) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * tw;
        ctx.fillStyle = mat === 'lucky' ? '#c9ffd9' : goldy ? '#fff6c8' : '#ffffff';
        const k = goldy ? Math.floor(t * 0.4 + ph * 9) : 0;
        star4(ctx, x + s * (goldy ? 0.25 + 0.5 * hash(k * 3 + 1) : 0.72), y + s * (goldy ? 0.25 + 0.5 * hash(k * 7 + 2) : 0.28), s * 0.22 * (0.6 + tw * 0.4));
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = a;
      }
    }
    if (look) SB.Looks.anim(ctx, x, y, s, opts, t);
    if (opts.glow) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.3;
      ctx.shadowColor = color; ctx.shadowBlur = s * 0.5;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      rr(ctx, x + 2, y + 2, s - 4, s - 4, s * 0.15); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };

  // ---------- enchanted cells ----------
  // On the board an empty enchanted cell is only a faint tint, corner ticks and a ghost of its icon,
  // so it never reads as a block. strong=true draws it bolder for previews and pack cards.
  Rn.cellOverlay = function (ctx, x, y, s, type, covered, strong) {
    const d = SB.CELLS[type];
    if (!d) return;
    const t = performance.now() / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + x * 0.05 + y * 0.03);
    const col = d.curse && d.color === '#30183f' ? '#b58ad6' : d.color;
    ctx.save();
    if (covered) {
      // under a block: a thin rim plus a small badge in the corner
      ctx.strokeStyle = col; ctx.globalAlpha = 0.45 + 0.2 * pulse;
      ctx.lineWidth = Math.max(1.2, s * 0.05);
      if (d.curse) ctx.setLineDash([s * 0.15, s * 0.1]);
      rr(ctx, x + s * 0.1, y + s * 0.1, s * 0.8, s * 0.8, s * 0.14); ctx.stroke();
      ctx.setLineDash([]);
      const R = s * 0.19, bx = x + s - R * 0.95, by = y + R * 0.95;
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(bx, by, R, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.stroke();
      if (s >= 16 && d.iconKey) SB.drawIco(ctx, d.iconKey, bx, by, R * 1.45, '#120c1e');
    } else {
      const g = ctx.createRadialGradient(x + s / 2, y + s / 2, 0, x + s / 2, y + s / 2, s * 0.72);
      g.addColorStop(0, rgba(col, (strong ? 0.3 : 0.13) + (strong ? 0.12 : 0.05) * pulse)); g.addColorStop(1, rgba(col, strong ? 0.06 : 0.015));
      ctx.fillStyle = g;
      rr(ctx, x + 2, y + 2, s - 4, s - 4, s * 0.16); ctx.fill();
      // corner ticks instead of a full frame
      ctx.strokeStyle = rgba(col, (strong ? 0.75 : 0.32) + 0.15 * pulse); ctx.lineWidth = strong ? 1.5 : 1.2;
      const q = s * 0.24, i0 = 3.5, i1 = s - 3.5;
      ctx.beginPath();
      ctx.moveTo(x + i0, y + i0 + q); ctx.lineTo(x + i0, y + i0); ctx.lineTo(x + i0 + q, y + i0);
      ctx.moveTo(x + i1 - q, y + i0); ctx.lineTo(x + i1, y + i0); ctx.lineTo(x + i1, y + i0 + q);
      ctx.moveTo(x + i1, y + i1 - q); ctx.lineTo(x + i1, y + i1); ctx.lineTo(x + i1 - q, y + i1);
      ctx.moveTo(x + i0 + q, y + i1); ctx.lineTo(x + i0, y + i1); ctx.lineTo(x + i0, y + i1 - q);
      if (d.curse) ctx.setLineDash([2, 2]);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = (strong ? 0.9 : 0.34) + (strong ? 0.1 : 0.12) * pulse;
      if (strong) { ctx.shadowColor = col; ctx.shadowBlur = s * 0.3 * (0.6 + pulse * 0.4); }
      if (d.iconKey) SB.drawIco(ctx, d.iconKey, x + s / 2, y + s / 2, s * (strong ? 0.6 : 0.5), col);
    }
    ctx.restore();
  };

  // ---------- board particles ----------
  Rn.particles = function (ctx, list, cs, top) {
    ctx.save();
    // sizes are tuned for 30px cells and grow with the board, so phones (2x canvases) see them at full size
    const ps = SB.clamp(cs / 30, 0.6, 2.4);
    for (const q of list) {
      const px = q.x * cs, py = (q.y - top) * cs;
      const al = SB.clamp(q.life * 2, 0, 1);
      ctx.globalAlpha = al;
      ctx.globalCompositeOperation = q.glow ? 'lighter' : 'source-over';
      ctx.fillStyle = q.color;
      const sz = q.cell ? (q.size || 0.4) * cs : (q.size || 4) * ps;
      switch (q.kind) {
        case 'bigshard': {
          // a pane of glass tinted by its block, catching the light as it spins
          ctx.save(); ctx.translate(px, py); ctx.rotate(q.rot);
          ctx.beginPath(); q.pts.forEach(([a, b], i) => (i ? ctx.lineTo(a * sz, b * sz) : ctx.moveTo(a * sz, b * sz))); ctx.closePath();
          ctx.globalAlpha = al * 0.55; ctx.fill();
          const glint = Math.pow(Math.max(0, Math.sin(q.rot * 2.3)), 6);
          ctx.globalAlpha = al * (0.25 + 0.75 * glint); ctx.fillStyle = '#ffffff'; ctx.fill();
          ctx.globalAlpha = al; ctx.strokeStyle = 'rgba(240,252,255,0.95)'; ctx.lineWidth = Math.max(1, cs * 0.03); ctx.stroke();
          ctx.restore();
          break;
        }
        case 'glitter': case 'glint': {
          const tw = q.kind === 'glitter' ? 0.4 + 0.6 * Math.abs(Math.sin(q.life * 18 + (q.tw || 0))) : 1;
          ctx.globalAlpha = al * tw;
          star4(ctx, px, py, sz * (q.kind === 'glitter' ? 1 : 0.7) * tw);
          break;
        }
        case 'streamer': {
          // a curling ribbon trailing behind its direction of travel
          const sp = Math.hypot(q.vx, q.vy) || 1, ux = -q.vx / sp, uy = -q.vy / sp, L = q.len * cs, t = performance.now() / 1000;
          ctx.strokeStyle = q.color; ctx.lineWidth = Math.max(1.5, sz); ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(px, py);
          for (let k = 1; k <= 8; k++) { const d = (k / 8) * L, wv = Math.sin(k * 1.3 + q.ph + t * 9) * cs * 0.18 * (k / 8); ctx.lineTo(px + ux * d - uy * wv, py + uy * d + ux * wv); }
          ctx.stroke();
          break;
        }
        case 'coin': {
          const w = Math.abs(Math.cos(q.rot)) * sz;
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#b07a10'; ctx.beginPath(); ctx.ellipse(px, py, w / 2 + 1, sz / 2 + 1, 0, 0, 7); ctx.fill();
          ctx.fillStyle = q.color; ctx.beginPath(); ctx.ellipse(px, py, Math.max(0.5, w / 2), sz / 2, 0, 0, 7); ctx.fill();
          break;
        }
        case 'shard': case 'chunk': {
          ctx.save(); ctx.translate(px, py); ctx.rotate(q.rot);
          ctx.beginPath();
          if (q.kind === 'shard') { ctx.moveTo(0, -sz * 0.6); ctx.lineTo(sz * 0.45, sz * 0.5); ctx.lineTo(-sz * 0.35, sz * 0.3); }
          else { ctx.rect(-sz / 2, -sz / 2, sz, sz * 0.8); }
          ctx.closePath(); ctx.fill();
          if (q.kind === 'shard') { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.8; ctx.stroke(); }
          ctx.restore();
          break;
        }
        case 'confetti': {
          ctx.save(); ctx.translate(px, py); ctx.rotate(q.rot);
          ctx.fillRect(-sz / 2, -sz * 0.25 * Math.abs(Math.cos(q.rot * 1.7)) - 0.5, sz, sz * 0.5 * Math.abs(Math.cos(q.rot * 1.7)) + 1);
          ctx.restore();
          break;
        }
        case 'pixel': {
          const k = sz * Math.min(1, q.life * 1.6 + 0.2);
          ctx.fillRect(Math.round(px - k / 2), Math.round(py - k / 2), Math.max(1, Math.round(k)), Math.max(1, Math.round(k)));
          break;
        }
        case 'spark': case 'ember': case 'suck': case 'rocket': case 'fw':
          ctx.strokeStyle = q.color; ctx.lineWidth = sz * 0.6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - q.vx * cs * 0.025, py - q.vy * cs * 0.025); ctx.stroke();
          if (q.kind === 'rocket') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px, py, sz * 0.7, 0, 7); ctx.fill(); }
          break;
        case 'smoke':
          ctx.globalAlpha = al * 0.55;
          ctx.beginPath(); ctx.arc(px, py, sz * (2.2 - q.life), 0, 7); ctx.fill();
          break;
        case 'debris':
          ctx.save(); ctx.translate(px, py); ctx.rotate(q.rot);
          ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-sz / 2, -sz / 2, sz, sz * 0.3);
          ctx.restore();
          break;
        case 'grit': case 'sand':
          ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
          break;
        case 'splat':
          ctx.beginPath(); ctx.arc(px, py, sz * (0.6 + 0.4 * al), 0, 7); ctx.fill();
          break;
        case 'heal': {
          const k = sz * 0.5, t = Math.max(1, sz * 0.22);
          ctx.fillRect(px - k, py - t / 2, k * 2, t); ctx.fillRect(px - t / 2, py - k, t, k * 2);
          break;
        }
        case 'star': case 'clover':
          star4(ctx, px, py, sz * (0.6 + 0.4 * Math.sin(q.life * 20)));
          break;
        case 'dust':
          ctx.globalAlpha = al * 0.5;
          ctx.beginPath(); ctx.arc(px, py, sz * (1.6 - q.life), 0, 7); ctx.fill();
          break;
        case 'fire':
          ctx.beginPath(); ctx.arc(px, py, sz * (0.4 + q.life), 0, 7); ctx.fill();
          break;
        default:
          ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      }
    }
    ctx.restore();
  };

  // ---------- line clear flashes, one per clear effect (k runs 0 to 1 over the flash) ----------
  // y is the row's top; bt and bb are the top and bottom of the visible board for strikes and board-wide flashes
  Rn.clearFlash = function (ctx, f, k, y, w, cs, bt, bb) {
    const rnd = (i) => hash(Math.floor(f.seed || 0) * 31 + i);
    if (f.delay) { const el = k * f.max; if (el < f.delay) return; k = (el - f.delay) / (f.max - f.delay); }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const mid = y + cs / 2;
    switch (f.style) {
      case 'boardflash': {
        // light bursting out from the cleared rows across the whole board
        const R0 = Math.max(w, bb - bt) * (0.7 + 0.5 * k);
        const g = ctx.createRadialGradient(w / 2, mid, 0, w / 2, mid, R0);
        g.addColorStop(0, f.color || '#ffffff'); g.addColorStop(0.35, rgba(f.color || '#ffffff', 0.45)); g.addColorStop(1, rgba(f.color || '#ffffff', 0));
        ctx.fillStyle = g; ctx.globalAlpha = 0.75 * Math.pow(1 - k, 1.5);
        ctx.fillRect(-cs, bt - cs, w + cs * 2, bb - bt + cs * 2);
        break;
      }
      case 'strike': {
        // a forked bolt from the top of the board down onto the row, flickering as it fades
        if (k > 0.35 && Math.sin(k * 55) < -0.1) break;
        const x0 = f.x * cs, seg = 10, pts = [];
        const jig = Math.floor(k * 7);
        for (let i = 0; i <= seg; i++) {
          const yy = bt + ((mid - bt) * i) / seg, sway = i === 0 || i === seg ? 0 : (rnd(i * 7 + jig * 13) - 0.5) * cs * 1.3;
          pts.push([x0 + sway, yy]);
        }
        const line = (P) => { ctx.beginPath(); P.forEach(([x, yy], i) => (i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy))); ctx.stroke(); };
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.globalAlpha = 0.45 * (1 - k); ctx.strokeStyle = '#4fb8ff'; ctx.lineWidth = Math.max(4, cs * 0.55); line(pts);
        ctx.globalAlpha = 0.85 * (1 - k * 0.6); ctx.strokeStyle = '#bfe6ff'; ctx.lineWidth = Math.max(2, cs * 0.2); line(pts);
        ctx.globalAlpha = 1 - k * 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.2, cs * 0.08); line(pts);
        ctx.lineWidth = Math.max(1, cs * 0.05); ctx.strokeStyle = '#d6f1ff';
        for (let i = 2; i < seg - 1; i += 3) {
          const [x, yy] = pts[i], dir = rnd(i * 3 + 1) < 0.5 ? -1 : 1, fork = [[x, yy]];
          for (let j = 1; j <= 3; j++) fork.push([x + dir * cs * 0.45 * j, yy + cs * (0.35 + rnd(i * 5 + j) * 0.4) * j]);
          ctx.globalAlpha = 0.7 * (1 - k); line(fork);
        }
        const g = ctx.createRadialGradient(x0, mid, 0, x0, mid, cs * 2.2);
        g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.3, 'rgba(140,210,255,0.5)'); g.addColorStop(1, 'rgba(80,160,255,0)');
        ctx.globalAlpha = 1 - k; ctx.fillStyle = g; ctx.fillRect(x0 - cs * 2.2, mid - cs * 2.2, cs * 4.4, cs * 4.4);
        break;
      }
      case 'glitch': {
        // the whole board tears for a moment: offset colour bands and scanlines
        if (k > 0.6) break;
        const jig = Math.floor(k * 14);
        for (let i = 0; i < 7; i++) {
          const yy = bt + rnd(i * 3 + jig * 17) * (bb - bt), hh = cs * (0.15 + rnd(i * 5 + jig) * 0.5), off = (rnd(i * 7 + jig * 3) - 0.5) * cs * 1.6;
          ctx.globalAlpha = 0.35 * (1 - k / 0.6);
          ctx.fillStyle = i % 2 ? '#ff2bd6' : '#26f0ff';
          ctx.fillRect(off, yy, w, hh);
        }
        break;
      }
      case 'shatter': {
        ctx.fillStyle = '#dff6ff'; ctx.globalAlpha = 0.85 * Math.pow(1 - k, 2);
        ctx.fillRect(0, y, w, cs);
        // a sheen sweeps across the pane before it breaks
        const sx = -cs * 2 + (w + cs * 4) * Math.min(1, k * 2.4);
        const sg = ctx.createLinearGradient(sx - cs * 1.5, 0, sx + cs * 1.5, 0);
        sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.9)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 1 - k; ctx.fillStyle = sg; ctx.fillRect(sx - cs * 1.5, y - cs * 0.3, cs * 3, cs * 1.6);
        // cracks race out from impact points and split into the rows around
        ctx.globalAlpha = 1 - k * k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, cs * 0.07); ctx.lineJoin = 'round';
        for (let s2 = 0; s2 < 3; s2++) {
          const ox = w * (0.15 + 0.7 * rnd(s2)), reach = w * 0.7 * Math.min(1, k * 4 + 0.15);
          for (let dir = -1; dir <= 1; dir += 2) {
            ctx.beginPath(); ctx.moveTo(ox, mid);
            let x = ox, yy = mid;
            for (let i = 0; i < 7 && Math.abs(x - ox) < reach; i++) { x += dir * cs * (0.5 + rnd(s2 * 20 + i + dir * 7) * 0.9); yy = mid + (rnd(s2 * 40 + i + dir * 3) - 0.5) * cs * 1.1; ctx.lineTo(x, yy); }
            ctx.stroke();
          }
          ctx.lineWidth = Math.max(1, cs * 0.04);
          for (let j = 0; j < 4; j++) { const a = rnd(s2 * 9 + j) * Math.PI * 2, L = cs * (0.6 + rnd(s2 * 11 + j) * 0.9) * Math.min(1, k * 5); ctx.beginPath(); ctx.moveTo(ox, mid); ctx.lineTo(ox + Math.cos(a) * L, mid + Math.sin(a) * L); ctx.stroke(); }
          ctx.lineWidth = Math.max(1, cs * 0.07);
        }
        break;
      }
      case 'confetti': {
        const g = ctx.createLinearGradient(0, 0, w, 0);
        const h0 = rnd(1) * 360 + k * 240;
        for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsl(${(h0 + i * 60) % 360},100%,66%)`);
        ctx.fillStyle = g; ctx.globalAlpha = 0.9 * (1 - k);
        const hh = cs * (1.2 - 0.9 * k);
        ctx.fillRect(0, mid - hh / 2, w, hh);
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.8 * Math.max(0, 1 - k * 3);
        ctx.fillRect(0, mid - cs * 0.15, w, cs * 0.3);
        // pops of colour bursting along the row
        for (let i = 0; i < 5; i++) {
          const px = w * (0.1 + 0.8 * rnd(i + 20)), r0 = cs * (0.3 + 1.2 * k) * (0.7 + rnd(i + 30) * 0.6);
          ctx.globalAlpha = 0.8 * (1 - k); ctx.strokeStyle = `hsl(${(h0 + i * 70) % 360},100%,70%)`; ctx.lineWidth = Math.max(1.5, cs * 0.1 * (1 - k));
          ctx.beginPath(); ctx.arc(px, mid, r0, 0, 7); ctx.stroke();
        }
        break;
      }
      case 'lightning': {
        const on = k < 0.4 || Math.sin(k * 60) > -0.2;
        ctx.fillStyle = '#7cc6ff'; ctx.globalAlpha = 0.6 * (1 - k);
        ctx.fillRect(0, y, w, cs);
        if (on) {
          for (let b = 0; b < 2; b++) {
            const pts = [[-4, mid]];
            for (let i = 1; i < 14; i++) pts.push([(w * i) / 14, mid + (rnd(i + b * 50 + Math.floor(k * 8) * 13) - 0.5) * cs * 1.1]);
            pts.push([w + 4, mid]);
            const path = () => { ctx.beginPath(); pts.forEach(([x, yy], i) => (i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy))); ctx.stroke(); };
            ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            ctx.globalAlpha = 0.5 * (1 - k); ctx.strokeStyle = '#5cc8ff'; ctx.lineWidth = Math.max(3, cs * (b ? 0.25 : 0.45)); path();
            ctx.globalAlpha = (1 - k * 0.7) * (b ? 0.7 : 1); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.2, cs * (b ? 0.06 : 0.11)); path();
          }
        }
        break;
      }
      case 'fireworks': {
        ctx.fillStyle = '#ffe2a0'; ctx.globalAlpha = 0.85 * (1 - k);
        const hh = cs * (1.1 - 0.8 * k);
        ctx.fillRect(0, mid - hh / 2, w, hh);
        ctx.globalAlpha = 0.95 * (1 - k); ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 9; i++) star4(ctx, w * rnd(i + 3), mid + (rnd(i + 9) - 0.5) * cs * 0.8, cs * (0.25 + rnd(i + 15) * 0.25) * (1 - k) * (0.6 + 0.4 * Math.sin(k * 30 + i)));
        break;
      }
      case 'hellfire': {
        // white-hot core, then tongues of flame climb off the row and it chars to black
        const core = ctx.createLinearGradient(0, y, 0, y + cs);
        core.addColorStop(0, '#ff3a10'); core.addColorStop(0.5, '#fff1b0'); core.addColorStop(1, '#ff5a1c');
        ctx.globalAlpha = 0.9 * Math.max(0, 1 - k * 1.4); ctx.fillStyle = core; ctx.fillRect(0, y, w, cs);
        const tongues = Math.max(5, Math.round(w / (cs * 0.7))), tw = w / tongues;
        for (let i = 0; i < tongues; i++) {
          const hgt = cs * (0.8 + 1.6 * rnd(i + 7)) * Math.sin(Math.min(1, k * 1.6) * Math.PI) * (0.8 + 0.2 * Math.sin(k * 40 + i * 2));
          const x0 = i * tw, sway = Math.sin(k * 18 + i) * tw * 0.3;
          const fg = ctx.createLinearGradient(0, mid, 0, mid - hgt);
          fg.addColorStop(0, '#ffd27a'); fg.addColorStop(0.45, '#ff7a1c'); fg.addColorStop(1, 'rgba(200,20,10,0)');
          ctx.globalAlpha = 0.9 * (1 - k * 0.8); ctx.fillStyle = fg;
          ctx.beginPath(); ctx.moveTo(x0 - tw * 0.1, mid + cs * 0.3);
          ctx.quadraticCurveTo(x0 + tw * 0.1 + sway, mid - hgt * 0.5, x0 + tw * 0.5 + sway, mid - hgt);
          ctx.quadraticCurveTo(x0 + tw * 0.9 + sway, mid - hgt * 0.5, x0 + tw * 1.1, mid + cs * 0.3);
          ctx.closePath(); ctx.fill();
        }
        ctx.globalAlpha = 0.6 * Math.max(0, k - 0.4); ctx.fillStyle = '#140608'; ctx.fillRect(0, y + cs * 0.35, w, cs * 0.3 * (1 - k));
        break;
      }
      case 'dissolve': {
        // first the row glitches (colour split, scanlines), then it breaks into pixels that wink out
        if (k < 0.35) {
          const j = Math.floor(k * 30), a = 1 - k / 0.35;
          ctx.globalAlpha = 0.6 * a;
          ctx.fillStyle = '#26f0ff'; ctx.fillRect((rnd(j) - 0.5) * cs * 0.8 - cs * 0.15, y + cs * 0.1, w, cs * 0.8);
          ctx.fillStyle = '#ff2bd6'; ctx.fillRect((rnd(j + 5) - 0.5) * cs * 0.8 + cs * 0.15, y + cs * 0.1, w, cs * 0.8);
          ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.5 * a;
          for (let yy = y; yy < y + cs; yy += Math.max(2, cs / 8)) ctx.fillRect(0, yy, w, 1);
        }
        const n = Math.max(2, Math.round(cs / 6)), px = w / Math.round(w / (cs / n));
        ctx.fillStyle = '#ffffff';
        for (let x = 0, i = 0; x < w; x += px) for (let j = 0; j < n; j++, i++) if (rnd(i) > k * 1.15) { ctx.globalAlpha = 0.75 * (1 - k); ctx.fillRect(x, y + (j * cs) / n, px - 0.5, cs / n - 0.5); }
        break;
      }
      default: {
        ctx.fillStyle = f.color || '#ffffff'; ctx.globalAlpha = 0.85 * (1 - k);
        const hh = cs * (1 - 0.7 * k);
        ctx.fillRect(0, y + (cs - hh) / 2, w, hh);
        ctx.globalAlpha = 0.6 * (1 - k);
        ctx.fillRect(-w * k * 0.2, mid - 1, w * (1 + k * 0.4), 2);
      }
    }
    ctx.restore();
  };

  // rings: blast shockwaves and ripples ('fill' is a flash disc, 'in' collapses inward)
  Rn.rings = function (ctx, rings, cs, top) {
    if (!rings || !rings.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const o of rings) {
      const k = o.t / o.max, e = 1 - Math.pow(1 - k, 3), px = o.x * cs, py = (o.y - top) * cs;
      if (o.mode === 'fill') {
        const rad = Math.max(1, o.r * cs * (0.5 + 0.5 * e));
        const rg = ctx.createRadialGradient(px, py, 0, px, py, rad);
        rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(0.4, o.color); rg.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.globalAlpha = 1 - k; ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(px, py, rad, 0, 7); ctx.fill();
        continue;
      }
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.strokeStyle = o.color; ctx.lineWidth = Math.max(1, o.w * (1 - k * 0.6));
      ctx.beginPath(); ctx.arc(px, py, Math.max(0.5, o.r * cs * (o.mode === 'in' ? 1 - e : e)), 0, 7); ctx.stroke();
    }
    ctx.restore();
  };

  // ---------- Rising Fog ----------
  // a bank of fog over the bottom rows: opaque enough to hide the blocks, a rolling top edge and drifting wisps
  Rn.fog = function (ctx, g, cs, top, w, h) {
    if (!(g.fogVis > 0.02)) return;
    const t = performance.now() / 1000;
    const y0 = (g.R - g.fogVis - top) * cs;
    const edge = (x) => y0 + Math.sin(x / cs * 0.9 + t * 1.1) * cs * 0.16 + Math.sin(x / cs * 2.1 - t * 1.7) * cs * 0.08;
    ctx.save();
    // feathered haze above the edge
    const hz = ctx.createLinearGradient(0, y0 - cs * 1.4, 0, y0);
    hz.addColorStop(0, 'rgba(150,158,196,0)'); hz.addColorStop(1, 'rgba(150,158,196,0.35)');
    ctx.fillStyle = hz; ctx.fillRect(0, y0 - cs * 1.4, w, cs * 1.4);
    // the bank itself
    ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += Math.max(2, cs / 4)) ctx.lineTo(x, edge(x));
    ctx.lineTo(w, edge(w)); ctx.lineTo(w, h); ctx.closePath();
    const gr = ctx.createLinearGradient(0, y0, 0, h);
    gr.addColorStop(0, 'rgba(132,138,176,0.985)'); gr.addColorStop(0.3, 'rgba(98,103,140,0.99)'); gr.addColorStop(1, 'rgba(60,62,94,1)');
    ctx.fillStyle = gr; ctx.fill();
    ctx.clip();
    // wisps rolling through
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const sp = 0.25 + (i % 3) * 0.12, rx = cs * (1.6 + (i % 4) * 0.5);
      const x = ((i * 0.37 + t * sp * (i % 2 ? 1 : -1) * 0.2) % 1 + 1) % 1 * (w + rx * 2) - rx;
      const y = y0 + cs * 0.6 + ((i * 0.53) % 1) * Math.max(cs, h - y0 - cs);
      const rg = ctx.createRadialGradient(x, y, 0, x, y, rx);
      rg.addColorStop(0, 'rgba(190,198,235,0.16)'); rg.addColorStop(1, 'rgba(190,198,235,0)');
      ctx.fillStyle = rg; ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    // a bright rim along the top edge
    ctx.beginPath();
    for (let x = 0; x <= w; x += Math.max(2, cs / 4)) (x ? ctx.lineTo : ctx.moveTo).call(ctx, x, edge(x) + 1);
    ctx.strokeStyle = 'rgba(220,226,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  };

  // ---------- main board ----------
  Rn.board = function (cv, g, cs) {
    const ctx = cv.getContext('2d');
    const showHidden = 2;
    const W = g.W, H = g.H, HID = g.HID;
    const w = W * cs, h = (H + showHidden) * cs;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    if (g.shake > 0 && SB.meta.data.settings.shake) ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
    const top = HID - showHidden; // first grid row drawn
    const ry = (r) => (r - top) * cs;
    // background
    ctx.fillStyle = Rn.theme.board || BOARD_BG;
    ctx.fillRect(0, showHidden * cs, w, H * cs);
    // danger zone tint
    ctx.fillStyle = 'rgba(255,40,80,0.05)';
    ctx.fillRect(0, 0, w, showHidden * cs);
    // grid lines
    ctx.strokeStyle = Rn.theme.grid || BOARD_GRID;
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(x * cs + 0.5, showHidden * cs); ctx.lineTo(x * cs + 0.5, h); ctx.stroke(); }
    for (let r = 0; r <= H; r++) { ctx.beginPath(); ctx.moveTo(0, (r + showHidden) * cs + 0.5); ctx.lineTo(w, (r + showHidden) * cs + 0.5); ctx.stroke(); }
    // Penthouse: a faint gold seam over the 16th row; clears above it score x4
    if (g.has && H > 16 && g.has('penthouse')) {
      const y = (H - 16 + showHidden) * cs;
      ctx.fillStyle = 'rgba(255,210,59,0.035)';
      ctx.fillRect(0, showHidden * cs, w, y - showHidden * cs);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,210,59,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([cs * 0.35, cs * 0.25]);
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke();
      ctx.restore();
    }
    // wells
    for (const wx of g.run.board.wells) {
      if (wx >= W) continue;
      ctx.fillStyle = 'rgba(80,140,255,0.10)';
      ctx.fillRect(wx * cs, showHidden * cs, cs, H * cs);
      ctx.fillStyle = 'rgba(120,170,255,0.7)';
      const k = cs * 0.22, mx = wx * cs + cs / 2, my = h - 4 - k;
      ctx.beginPath(); ctx.moveTo(mx - k, my - k * 0.8); ctx.lineTo(mx + k, my - k * 0.8); ctx.lineTo(mx, my + k * 0.8); ctx.closePath(); ctx.fill();
    }
    // blocked columns: a wall of bricks that counts as filled in every row and never clears
    for (const bx of g.blocked) {
      const wc = wallSprite(Math.max(4, Math.round(cs)));
      for (let r = top; r < g.R; r++) ctx.drawImage(wc, bx * cs, ry(r), cs, cs);
    }
    // a wall splits the board: show which side the next piece drops on
    if (g.blocked.size && g.dropSide !== undefined && g.status === 'playing') {
      const side = g.sides().find(([a, b]) => g.dropSide >= a && g.dropSide <= b);
      if (side) {
        const t = performance.now() / 1000, x0 = side[0] * cs, x1 = (side[1] + 1) * cs, cx = (x0 + x1) / 2;
        ctx.save();
        ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 4);
        ctx.fillStyle = '#35e6ff';
        ctx.fillRect(x0 + 4, showHidden * cs - 3, x1 - x0 - 8, 2);
        const y = showHidden * cs - 10 + Math.sin(t * 4) * 1.5, k = cs * 0.22;
        ctx.beginPath(); ctx.moveTo(cx - k, y - k * 0.7); ctx.lineTo(cx, y); ctx.lineTo(cx + k, y - k * 0.7);
        ctx.strokeStyle = '#35e6ff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.font = `700 ${Math.max(9, Math.floor(cs * 0.32))}px ${SB.fontUI}`; ctx.textAlign = 'center';
        ctx.fillText('NEXT', cx, y - k * 0.95);
        ctx.restore();
      }
    }
    // cells (enchantments) under empty spaces
    for (let r = HID; r < g.R; r++) {
      for (let x = 0; x < W; x++) {
        const t = g.cellAt(x, r);
        const frozen = g.isFrozen(x, r);
        if (t && t !== 'ash' && !g.grid[r][x]) Rn.cellOverlay(ctx, x * cs, ry(r), cs, t, false);
        if (t === 'ash' && !g.grid[r][x]) { ctx.fillStyle = 'rgba(90,90,90,0.25)'; ctx.fillRect(x * cs + 2, ry(r) + 2, cs - 4, cs - 4); }
        if (frozen && g.frozenAll && !g.grid[r][x]) { ctx.fillStyle = 'rgba(150,210,255,0.06)'; ctx.fillRect(x * cs, ry(r), cs, cs); }
      }
    }
    // blocks
    const ghostBoss = g.isBoss('ghost'), edgy = Rn.skinEdgy();
    for (let r = top; r < g.R; r++) {
      for (let x = 0; x < W; x++) {
        const b = g.grid[r][x];
        if (!b) continue;
        let alpha = r < HID ? 0.6 : 1;
        if (ghostBoss && !b.garbage) alpha *= SB.clamp(1 - (g.time - b.t - 3) / 1, 0, 1);
        const fancy = b.spec || b.beh;
        Rn.block(ctx, x * cs, ry(r) - (b.fy || 0) * cs, cs, b.color, { mat: g.matOf(b), garbage: b.garbage, plain: b.plain, beh: b.beh, spec: b.spec, edges: fancy || edgy ? SB.Looks.boardEdges(g, x, r) : 15, lead: b.lead, live: fancy ? SB.Looks.isLive(b) : false, ph: (b.pid || 0) * 0.37, alpha });
        const t = r >= HID ? g.cellAt(x, r) : null;
        if (t && t !== 'ash') Rn.cellOverlay(ctx, x * cs, ry(r), cs, t, true);
        if (r >= HID && g.isFrozen(x, r)) { ctx.fillStyle = 'rgba(160,220,255,0.28)'; ctx.fillRect(x * cs + 1, ry(r) + 1, cs - 2, cs - 2); }
      }
    }
    // Temporal: full lines held in time are washed in clock-blue and wait for the next clear
    const held = g.heldRows ? g.heldRows() : [];
    if (held.length) {
      const t = performance.now() / 1000;
      ctx.save();
      for (const r of held) {
        if (r < top) continue;
        const y = ry(r);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.3 + 0.06 * Math.sin(t * 3 + r);
        ctx.fillStyle = '#5a68e0'; ctx.fillRect(0, y, w, cs);
        // a band of light sweeping right to left: time running backwards
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1;
        const sx = w - ((t * 0.45 + r * 0.17) % 1) * (w + cs * 4) + cs * 2;
        const gr = ctx.createLinearGradient(sx - cs * 2, 0, sx + cs * 2, 0);
        gr.addColorStop(0, 'rgba(160,175,255,0)'); gr.addColorStop(0.5, 'rgba(200,210,255,0.55)'); gr.addColorStop(1, 'rgba(160,175,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(sx - cs * 2, y, cs * 4, cs);
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#b8c2ff'; ctx.lineWidth = 2; ctx.shadowColor = '#7c8cff'; ctx.shadowBlur = 6;
        ctx.setLineDash([cs * 0.32, cs * 0.18]); ctx.lineDashOffset = t * cs * 1.2;
        ctx.beginPath(); ctx.moveTo(0, y + 1); ctx.lineTo(w, y + 1); ctx.moveTo(0, y + cs - 1); ctx.lineTo(w, y + cs - 1); ctx.stroke();
        ctx.setLineDash([]); ctx.shadowBlur = 0;
      }
      // a tag on the top held line
      const r0 = Math.min(...held);
      if (r0 >= top) {
        const label = `HELD ${held.length}`;
        ctx.font = `700 ${Math.max(9, Math.floor(cs * 0.38))}px ${SB.fontUI}`;
        const tw = ctx.measureText(label).width + cs * 0.4, th = cs * 0.5, tx = w - tw - 3, ty = ry(r0) - th * 0.55;
        ctx.globalAlpha = 0.95; ctx.fillStyle = '#2a2f7a'; rr(ctx, tx, ty, tw, th, th / 2); ctx.fill();
        ctx.strokeStyle = '#b8c2ff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#e8ecff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, tx + tw / 2, ty + th / 2 + 1);
      }
      ctx.restore();
    }
    // ghost & active (fog sits between them: it hides the ghost, never the falling piece)
    const p = g.active;
    let fogged = false;
    if (p && g.status === 'playing') {
      const accent = SB.Looks.accent({ spec: p.inst.special, beh: p.inst.behavior });
      if (!g.ghostHidden) {
        const gy = g.ghostY();
        // the landing mark: a flat wash of the piece colour inside a dotted chalk line round the shape
        const gcells = p.sh.rots[p.rot], at = gcells.map(([cx, cy]) => [p.x + cx, gy + cy]);
        ctx.save();
        ctx.fillStyle = rgba(accent || p.sh.color, 0.1);
        for (const [x, yy] of at) if (yy >= top) ctx.fillRect(x * cs, ry(yy), cs, cs);
        ctx.strokeStyle = accent || p.sh.color; ctx.globalAlpha = 0.85; ctx.lineWidth = Math.max(2, cs * 0.08); ctx.lineCap = 'round';
        ctx.setLineDash(accent ? [cs * 0.18, cs * 0.1] : [0.01, Math.max(4, cs * 0.17)]);
        Rn.traceOutline(ctx, at, cs, (yy) => ry(yy), top, Math.max(2, cs * 0.1));
        ctx.restore();
      }
      Rn.fog(ctx, g, cs, top, w, h); fogged = true;
      // soft drop: thin speed lines trailing above the piece, stronger as it accelerates
      if (g.softDropping && g.sdHeld > 0.04 && !g.onGround()) {
        const k = Math.min(1, g.sdHeld / 0.45);
        const tops = {};
        for (const [cx, cy] of p.sh.rots[p.rot]) { const yy = p.y + cy; const x = p.x + cx; if (tops[x] === undefined || yy < tops[x]) tops[x] = yy; }
        const now = performance.now() / 1000;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const x in tops) {
          const yy = tops[x];
          if (yy < top) continue;
          for (let j = 0; j < 2; j++) {
            const len = cs * (0.6 + 1.6 * k) * (0.7 + 0.3 * Math.sin(now * 40 + x * 3 + j * 2));
            const lx = x * cs + cs * (j ? 0.72 : 0.28);
            const y1 = ry(yy), y0 = y1 - len;
            const grad = ctx.createLinearGradient(0, y0, 0, y1);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(1, p.sh.color);
            ctx.globalAlpha = 0.25 + 0.35 * k;
            ctx.fillStyle = grad;
            ctx.fillRect(lx - 1, y0, 2, len);
          }
        }
        ctx.restore();
      }
      const cells = p.sh.rots[p.rot];
      const eg = SB.Looks.edges(cells);
      cells.forEach(([cx, cy], i) => {
        const yy = p.y + cy;
        if (yy < top) return;
        const lockFade = g.onGround() ? 0.75 + 0.25 * Math.cos(g.lockTimer * 20) : 1;
        Rn.block(ctx, (p.x + cx) * cs, ry(yy), cs, p.sh.color, { mat: g.isBoss('shatter') ? 'glass' : p.inst.mat, beh: p.inst.behavior, spec: p.inst.special, edges: eg.flags[i], lead: i === eg.lead, live: true, ph: (p.inst.uid || 0) * 0.37, alpha: lockFade, glow: true });
      });
    }
    if (!fogged) Rn.fog(ctx, g, cs, top, w, h);
    // hard drop trail
    if (g.trail) {
      const tr = g.trail;
      const cols = {};
      for (const [x, y] of tr.cells) cols[x] = Math.min(cols[x] === undefined ? 1e9 : cols[x], y);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const x in cols) {
        const y0 = Math.max(top, cols[x]);
        const y1 = cols[x] + tr.n;
        const grad = ctx.createLinearGradient(0, ry(y0), 0, ry(y1) + cs);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, tr.color);
        const k = tr.life / (tr.max || 0.22);
        ctx.globalAlpha = k * 0.6;
        ctx.fillStyle = grad;
        ctx.fillRect(x * cs + cs * (0.5 - 0.42 * k), ry(y0), cs * 0.84 * k, ry(y1) - ry(y0) + cs);
        // bright core streak
        const core = ctx.createLinearGradient(0, ry(y0), 0, ry(y1) + cs);
        core.addColorStop(0, 'rgba(255,255,255,0)');
        core.addColorStop(1, 'rgba(255,255,255,0.9)');
        ctx.globalAlpha = k * 0.7;
        ctx.fillStyle = core;
        ctx.fillRect(x * cs + cs * 0.44, ry(y0), cs * 0.12, ry(y1) - ry(y0) + cs);
      }
      ctx.restore();
    }
    // hard drop impact: a shockwave line under the piece that spreads sideways
    if (g.slamFx) {
      const s = g.slamFx;
      const k = s.t / s.max, e = 1 - k;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [x, y] of s.cells) {
        if (y < top) continue;
        const yy = ry(y) + cs;
        const spread = cs * (0.2 + e * (1.2 + s.power * 1.6));
        const grad = ctx.createLinearGradient(x * cs - spread, 0, (x + 1) * cs + spread, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, `rgba(255,255,255,${0.9 * k})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x * cs - spread, yy - 2 - 3 * k, cs + spread * 2, 4 + 6 * k);
        ctx.globalAlpha = 0.45 * k;
        ctx.fillStyle = s.color;
        ctx.fillRect(x * cs - spread * 0.6, yy - cs * 0.5 * k, cs + spread * 1.2, cs * 0.5 * k);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
    // danger glow near the top
    const sh = g.stackHeight() - HID;
    if (sh > H * 0.6) {
      const d = Math.min(1, (sh - H * 0.6) / (H * 0.4));
      const grad = ctx.createLinearGradient(0, showHidden * cs, 0, showHidden * cs + cs * 6);
      grad.addColorStop(0, `rgba(255,40,70,${0.35 * d * (0.7 + 0.3 * Math.sin(performance.now() / 150))})`);
      grad.addColorStop(1, 'rgba(255,40,70,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, showHidden * cs, w, cs * 6);
    }
    // flashes
    for (const f of g.flashRows) Rn.clearFlash(ctx, f, 1 - SB.clamp(f.t / (f.max || 0.25), 0, 1), ry(f.r), w, cs, ry(HID), ry(g.R));
    // lock flash
    if (g.lockFlash) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (g.lockFlash.t / 0.16) * 0.55;
      ctx.fillStyle = '#ffffff';
      for (const [x, y] of g.lockFlash.cells) if (y >= top) { rr(ctx, x * cs + 2, ry(y) + 2, cs - 4, cs - 4, cs * 0.15); ctx.fill(); }
      ctx.restore();
    }
    // rings: blast shockwaves and ripples
    Rn.rings(ctx, g.rings, cs, top);
    // particles
    Rn.particles(ctx, g.particles, cs, top);
    ctx.globalAlpha = 1;
    // top line
    ctx.strokeStyle = 'rgba(255,60,100,0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, showHidden * cs); ctx.lineTo(w, showHidden * cs); ctx.stroke();
    ctx.setLineDash([]);
    // gravity frozen indicator
    if (g.gravityPaused()) {
      ctx.fillStyle = 'rgba(120,200,255,0.10)';
      ctx.fillRect(0, showHidden * cs, w, H * cs);
    }
    ctx.restore();
  };

  // small piece preview
  Rn.mini = function (cv, inst, cs, opts) {
    opts = opts || {};
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (!inst) return;
    const sh = SB.SHAPES[inst.shape];
    const cells = SB.Run.normCells(sh.rots[0]);
    const mw = Math.max(...cells.map((c) => c[0])) + 1, mh = Math.max(...cells.map((c) => c[1])) + 1;
    const s = Math.min(cs, Math.floor((cv.width - 6) / mw), Math.floor((cv.height - 6) / mh));
    const ox = (cv.width - mw * s) / 2, oy = (cv.height - mh * s) / 2;
    const eg = SB.Looks.edges(cells);
    cells.forEach(([x, y], i) => Rn.block(ctx, ox + x * s, oy + y * s, s, sh.color, { mat: inst.mat, beh: inst.behavior, spec: inst.special, edges: eg.flags[i], lead: i === eg.lead, live: true, ph: (inst.uid || 0) * 0.37, alpha: opts.alpha }));
  };

  // ---------- bag grid ----------
  Rn.bag = function (cv, run, cs, ghost, selectedUid, rates) {
    const N = 10;
    const ctx = cv.getContext('2d');
    if (cv.width !== N * cs || cv.height !== N * cs) { cv.width = N * cs; cv.height = N * cs; }
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (run.bag.active[i]) {
        ctx.fillStyle = '#16162c';
        ctx.fillRect(x * cs + 1, y * cs + 1, cs - 2, cs - 2);
        const bonus = run.bag.bonus[i];
        if (bonus) {
          ctx.strokeStyle = SB.BAG_BONUS[bonus].color; ctx.lineWidth = 2;
          ctx.strokeRect(x * cs + 3, y * cs + 3, cs - 6, cs - 6);
        }
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.strokeRect(x * cs + 0.5, y * cs + 0.5, cs - 1, cs - 1);
      }
    }
    for (const p of run.pieces) {
      if (p.bx === null || p.bx === undefined) continue;
      const cells = SB.Run.pieceBagCells(p);
      const sh = SB.SHAPES[p.shape];
      const eg = SB.Looks.edges(cells);
      cells.forEach(([x, y], i) => Rn.block(ctx, x * cs, y * cs, cs, sh.color, { mat: p.mat, beh: p.behavior, spec: p.special, edges: eg.flags[i], lead: i === eg.lead, live: true, ph: p.uid * 0.37, alpha: p.banned ? 0.3 : 1 }));
      // outline
      ctx.strokeStyle = p.uid === selectedUid ? '#ffffff' : 'rgba(0,0,0,0.6)';
      ctx.lineWidth = p.uid === selectedUid ? 3 : 2;
      const set = new Set(cells.map(([x, y]) => x + ',' + y));
      for (const [x, y] of cells) {
        if (!set.has(x + ',' + (y - 1))) { ctx.beginPath(); ctx.moveTo(x * cs, y * cs); ctx.lineTo(x * cs + cs, y * cs); ctx.stroke(); }
        if (!set.has(x + ',' + (y + 1))) { ctx.beginPath(); ctx.moveTo(x * cs, y * cs + cs); ctx.lineTo(x * cs + cs, y * cs + cs); ctx.stroke(); }
        if (!set.has(x - 1 + ',' + y)) { ctx.beginPath(); ctx.moveTo(x * cs, y * cs); ctx.lineTo(x * cs, y * cs + cs); ctx.stroke(); }
        if (!set.has(x + 1 + ',' + y)) { ctx.beginPath(); ctx.moveTo(x * cs + cs, y * cs); ctx.lineTo(x * cs + cs, y * cs + cs); ctx.stroke(); }
      }
      // level badge
      const [lx, ly] = cells[cells.length - 1];
      const lv = SB.pieceLv(p), txt = p.banned ? '0' : String(lv), bw = txt.length > 1 ? 19 : 14;
      ctx.fillStyle = p.forged ? 'rgba(150,60,0,0.9)' : 'rgba(0,0,0,0.7)';
      ctx.fillRect(lx * cs + cs - 1 - bw, ly * cs + cs - 14, bw, 13);
      ctx.fillStyle = SB.LV_COLORS[SB.lvTier(lv)];
      ctx.font = `700 12px ${SB.fontUI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, lx * cs + cs - 1 - bw / 2, ly * cs + cs - 7);
    }
    if (ghost) {
      // the piece being placed, drawn in the skin, with a green or red edge for fits / doesn't fit
      const geg = SB.Looks.edges(ghost.cells), gp = ghost.piece;
      const col = gp && SB.SHAPES[gp.shape] ? SB.SHAPES[gp.shape].color : '#9a9ab0';
      if (gp) ghost.cells.forEach(([x, y], i) => Rn.block(ctx, (x + ghost.x) * cs, (y + ghost.y) * cs, cs, col, { mat: gp && gp.mat, beh: gp && gp.behavior, spec: gp && gp.special, edges: geg.flags[i], lead: i === geg.lead, alpha: ghost.ok ? 0.8 : 0.45 }));
      ctx.save();
      ghost.cells.forEach(([x, y]) => { ctx.fillStyle = ghost.ok ? `rgba(120,255,160,${gp ? 0.12 : 0.4})` : 'rgba(255,80,100,0.3)'; ctx.fillRect((x + ghost.x) * cs, (y + ghost.y) * cs, cs, cs); });
      ctx.strokeStyle = ghost.ok ? '#7dffa8' : '#ff5a70'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      Rn.traceOutline(ctx, ghost.cells.map(([x, y]) => [x + ghost.x, y + ghost.y]), cs, (y) => y * cs, undefined, 1.5);
      ctx.restore();
    }
  };

  // ---------- board preview (for packs / glyph targets) ----------
  Rn.boardPreview = function (cv, run, cs, hover, mode) {
    const W = run.board.w, H = run.board.h;
    const ctx = cv.getContext('2d');
    if (cv.width !== W * cs || cv.height !== H * cs) { cv.width = W * cs; cv.height = H * cs; }
    ctx.fillStyle = Rn.theme.board || BOARD_BG;
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = 'rgba(120,120,200,0.12)';
    for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(x * cs + 0.5, 0); ctx.lineTo(x * cs + 0.5, H * cs); ctx.stroke(); }
    for (let y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(0, y * cs + 0.5); ctx.lineTo(W * cs, y * cs + 0.5); ctx.stroke(); }
    for (const wx of run.board.wells) { ctx.fillStyle = 'rgba(80,140,255,0.18)'; ctx.fillRect(wx * cs, 0, cs, H * cs); }
    for (const k in run.board.cells) {
      const [x, yb] = k.split(',').map(Number);
      if (x >= W || yb >= H) continue;
      Rn.cellOverlay(ctx, x * cs, (H - 1 - yb) * cs, cs, run.board.cells[k], false, true);
    }
    if (hover) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      if (mode === 'well') ctx.fillRect(hover.x * cs, 0, cs, H * cs);
      else ctx.fillRect(hover.x * cs, (H - 1 - hover.yb) * cs, cs, cs);
    }
  };
})(window.SB);
