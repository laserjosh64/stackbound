// Stackbound emblems: framed art for relics. Each relic tag has its own outline (shield, tile, hexagon, coin...),
// a bezel whose metal shows the rarity, an enamel field with a motif drawn for that tag, and the relic's glyph
// on top with a dark outline. Some relics carry a small chip (a piece, a number of lines, an arrow) that says
// what they care about at a glance. d.art holds the SVG; d.icon stays the plain glyph for text and tooltips.
'use strict';
(function (SB) {
  const P = SB.ICON_PATHS, MAP = SB.ICON_MAP;
  // each glyph's symbol is framed on its own bounds, so every glyph sits centred and fills its slot the same;
  // the ink outline scales with that frame so it reads the same weight on every emblem
  const BOX = SB.ICON_BOX || {};
  const frameOf = (k) => { const b = BOX[k]; if (!b) return [0, 0, 512]; const L = b[2] / 0.92; return [b[0] - L / 2, b[1] - L / 2, L]; };
  const sym = (k) => { const [x, y, L] = frameOf(k); return `<symbol id="eg-${k}" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${L.toFixed(1)} ${L.toFixed(1)}" overflow="visible"><path d="${P[k] || ''}"/></symbol>`; };
  const inkW = (k, w) => ((w * frameOf(k)[2]) / 512).toFixed(1);
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; };
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  // outline, the point the inner field shrinks toward, the field scale, enamel tints, glyph placement
  const FRAMES = {
    Clear: { d: 'M32 2L58 10V30C58 46 46 56 32 62C18 56 6 46 6 30V10Z', c: [32, 30], k: 0.8, mk: [55, 8], gy: 30, tints: [['#8fe9ff', '#164fa8'], ['#97ffe0', '#0e6e64'], ['#b8c3ff', '#2c389e']] },
    Board: { d: 'M13 3H51Q61 3 61 13V51Q61 61 51 61H13Q3 61 3 51V13Q3 3 13 3Z', c: [32, 32], k: 0.8, tints: [['#ffc08a', '#a3391a'], ['#ffa0a0', '#93203f'], ['#ffdc8f', '#8f4d10']] },
    Bag: { d: 'M32 1L59 16.5V47.5L32 63L5 47.5V16.5Z', c: [32, 32], k: 0.8, tints: [['#b4ff9a', '#1f7a33'], ['#dcff8f', '#4f7d10'], ['#8fffd0', '#126b50']] },
    Gold: { d: 'M32 2A30 30 0 1 1 31.99 2Z', c: [32, 32], k: 0.8, tints: [['#fff3b3', '#b8700a'], ['#ffe39a', '#9c4f0c'], ['#fff7d1', '#a88414']], coin: 1 },
    Speed: { d: 'M32 1L63 32L32 63L1 32Z', c: [32, 32], k: 0.76, mk: [49, 13], g: 29, tints: [['#ffec8f', '#c94c0c'], ['#ffd6f2', '#a51f70'], ['#c9f8ff', '#2370cc']] },
    Gravity: { d: 'M32 1C39 12 57 28 57 41A25 22 0 0 1 7 41C7 28 25 12 32 1Z', c: [32, 39], k: 0.8, mk: [47, 13], g: 30, gy: 39, tints: [['#d2b8ff', '#41229a'], ['#b5c0ff', '#212a80'], ['#e8b8ff', '#621a92']] },
    Garbage: { d: 'M19 2H45L62 19V45L45 62H19L2 45V19Z', c: [32, 32], k: 0.8, tints: [['#dce3cf', '#535c47'], ['#e3cfb5', '#634a2d'], ['#c8d6e0', '#3d4e61']] },
    Glass: { d: 'M15 4H49L62 23L32 62L2 23Z', c: [32, 27], k: 0.8, mk: [51, 5], g: 29, gy: 27, tints: [['#effdff', '#46a9cc'], ['#f6ecff', '#8c62d6'], ['#ecfff8', '#3cb394']] },
  };
  // the bezel: brushed metal in the rarity's colour
  const RIMS = {
    Common: ['#ffffff', '#cdd6e4', '#8b97ac', '#e9eef6', '#56607a'],
    Uncommon: ['#e9fff2', '#6cf2a8', '#1f9a5b', '#9dffc7', '#0f5a35'],
    Rare: ['#ffe8f8', '#ff86de', '#a43ccf', '#ffb6ef', '#5a1b85'],
    Legendary: ['#fffbe0', '#ffd75a', '#c27a0c', '#ffe9a0', '#6e3c02'],
    Mythic: ['#fff0e0', '#ff7a3b', '#b8170c', '#ffb38a', '#4a0703'],
  };
  const INK = '#1a1030';
  // relic -> chip: a piece (its letter), a count of lines, an arrow, or a short number
  const CHIPS = {
    single_minded: { lines: 1 }, double_trouble: { lines: 2 }, third_time: { lines: 3 }, tetromancer: { lines: 4 },
    i_love_i: { pc: 'I' }, t_time: { pc: 'T' }, square_deal: { pc: 'O' }, snake_charmer: { pc: 'S' }, elbow_grease: { pc: 'L' },
    spinner: { pc: 'T' }, small_wonder: { pc: 'L3' }, big_game: { pc: 'P5' },
    left_hand: { arrow: 'l' }, right_hand: { arrow: 'r' }, low_rider: { arrow: 'd' }, high_wire: { arrow: 'u' },
    tight_fit: { txt: '6' }, counter: { txt: '10' },
    tailwind: { arrow: 'r' }, hindsight: { arrow: 'l' }, five_alarm: { lines: 5 }, curtain_call: { txt: '5+' },
  };
  const MINI = {
    I: [[0, 0], [1, 0], [2, 0], [3, 0]], O: [[0, 0], [1, 0], [0, 1], [1, 1]], T: [[0, 0], [1, 0], [2, 0], [1, 1]],
    S: [[1, 0], [2, 0], [0, 1], [1, 1]], L: [[0, 0], [0, 1], [0, 2], [1, 2]], L3: [[0, 0], [0, 1], [1, 1]], P5: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]],
  };
  const MINI_COLOR = { I: '#35e6ff', O: '#ffd83b', T: '#b25cff', S: '#4dff7c', L: '#ff9a3b', L3: '#ffb27a', P5: '#ff7ad9' };
  const inset = (f) => `translate(${f.c[0]} ${f.c[1]}) scale(${f.k}) translate(${-f.c[0]} ${-f.c[1]})`;
  function defs() {
    let o = '';
    o += `<linearGradient id="eb-bevel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>`;
    o += `<linearGradient id="eb-gf"><stop stop-color="#f7f3ff"/></linearGradient>`;
    o += `<linearGradient id="eb-gfg"><stop stop-color="#66400a"/></linearGradient>`;
    for (const r in RIMS) {
      const c = RIMS[r];
      o += `<linearGradient id="eb-rim-${r}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".1" stop-color="${c[0]}"/><stop offset=".1" stop-color="${c[1]}"/><stop offset=".56" stop-color="${c[1]}"/><stop offset=".56" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>`;
    }
    for (const t in FRAMES) {
      const f = FRAMES[t];
      o += `<clipPath id="eb-clip-${t}"><path d="${f.d}" transform="${inset(f)}"/></clipPath>`;
      f.tints.forEach(([a, b], i) => {
        o += `<linearGradient id="eb-f-${t}-${i}"><stop stop-color="${mix(a, b, 0.42)}"/></linearGradient>`;
      });
    }
    const keys = new Set(Object.values(MAP.RELICS));
    for (const k of keys) o += sym(k);
    return o;
  }
  // the motif drawn into each tag's enamel, varied per relic by v (0..3)
  function motif(t, v, f) {
    const W = 'fill="#fff" fill-opacity=".13"', K = 'fill="#000" fill-opacity=".16"';
    switch (t) {
      case 'Clear': // heraldry: bend, chevron, pale or chief
        return [
          `<path d="M0 0L64 64V0Z" ${K}/>`,
          `<path d="M2 50L32 30L62 50V62L32 42L2 62Z" ${W}/>`,
          `<rect x="32" width="32" height="64" ${K}/>`,
          `<rect width="64" height="17" ${K}/><path d="M0 17H64" stroke="#fff" stroke-opacity=".25" stroke-width="1"/>`,
        ][v];
      case 'Board': { // a little board: a grid with one piece lit
        let s = '<path d="' + [16, 26, 38, 48].map((x) => `M${x} 0V64M0 ${x}H64`).join('') + '" stroke="#fff" stroke-opacity=".1" stroke-width="1"/>';
        const shapes = [[[0, 3], [1, 3], [2, 3], [1, 2]], [[0, 3], [1, 3], [1, 2], [2, 2]], [[0, 3], [1, 3], [2, 3], [3, 3]], [[2, 3], [3, 3], [3, 2], [3, 1]]];
        const xs = [6, 16, 26, 38, 48], cell = (i) => xs[i];
        for (const [x, y] of shapes[v]) s += `<rect x="${cell(x) + 0.5}" y="${cell(y) + 0.5}" width="${cell(x + 1) - cell(x) - 1}" height="${cell(y + 1) - cell(y) - 1}" ${W}/>`;
        return s;
      }
      case 'Bag': // stitched leather
        return `<path d="${f.d}" transform="translate(32 32) scale(.86) translate(-32 -32)" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1.3" stroke-dasharray="2.6 2.2"/>` +
          (v % 2 ? `<path d="M5 32H59" stroke="#000" stroke-opacity=".14" stroke-width="5"/>` : `<path d="M32 2V62" stroke="#000" stroke-opacity=".12" stroke-width="5"/>`);
      case 'Gold': // a minted coin: engraved ring and dots
        return `<circle cx="32" cy="32" r="21.5" fill="none" stroke="#6b3f00" stroke-opacity=".45" stroke-width="1.2"/><circle cx="32" cy="32.8" r="21.5" fill="none" stroke="#fff6cf" stroke-opacity=".45" stroke-width=".8"/>` +
          `<circle cx="32" cy="32" r="18" fill="none" stroke="#6b3f00" stroke-opacity=".3" stroke-width="1.6" stroke-dasharray=".1 3.6" stroke-linecap="round"/>`;
      case 'Speed': // streaks
        return `<path d="M-4 22L40 -6M8 50L62 14M30 66L70 40" stroke="#fff" stroke-opacity="${v % 2 ? '.16' : '.12'}" stroke-width="${3 + v}"/>`;
      case 'Gravity': // orbits
        return `<ellipse cx="32" cy="40" rx="${22 - v}" ry="7" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.2" transform="rotate(${-18 + v * 12} 32 40)"/><ellipse cx="32" cy="40" rx="13" ry="${17 - v}" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1"/>`;
      case 'Garbage': { // riveted plate
        const pts = [[16, 14], [48, 14], [16, 50], [48, 50]];
        let s = `<path d="M6 ${24 + v * 4}H58M6 ${40 + v * 2}H58" stroke="#000" stroke-opacity=".12" stroke-width="1"/>`;
        for (const [x, y] of pts) s += `<circle cx="${x}" cy="${y}" r="2" fill="#000" fill-opacity=".35"/><circle cx="${x - 0.5}" cy="${y - 0.6}" r="1.1" fill="#fff" fill-opacity=".55"/>`;
        return s;
      }
      case 'Glass': // facets
        return `<path d="M15 4L24 23L32 4L40 23L49 4M2 23H62M24 23L32 62L40 23" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1"/><path d="M24 23L32 4L40 23Z" fill="#fff" fill-opacity=".16"/><path d="M2 23L24 23L32 62Z" fill="#000" fill-opacity=".08"/>`;
    }
    return '';
  }
  function chip(c, rim) {
    let s = `<circle cx="51" cy="51" r="10" fill="${INK}"/><circle cx="51" cy="51" r="8.6" fill="#2b1f4a" stroke="url(#eb-rim-${rim})" stroke-width="1.8"/>`;
    if (c.pc) {
      const cells = MINI[c.pc], col = MINI_COLOR[c.pc];
      const w = Math.max(...cells.map((q) => q[0])) + 1, h = Math.max(...cells.map((q) => q[1])) + 1;
      const u = Math.min(11 / w, 11 / h, 4.2), ox = 51 - (w * u) / 2, oy = 51 - (h * u) / 2;
      for (const [x, y] of cells) s += `<rect x="${(ox + x * u + 0.3).toFixed(2)}" y="${(oy + y * u + 0.3).toFixed(2)}" width="${(u - 0.6).toFixed(2)}" height="${(u - 0.6).toFixed(2)}" rx=".6" fill="${col}" stroke="#000" stroke-opacity=".35" stroke-width=".4"/><rect x="${(ox + x * u + 0.8).toFixed(2)}" y="${(oy + y * u + 0.7).toFixed(2)}" width="${(u - 1.6).toFixed(2)}" height="${((u - 1.6) * 0.4).toFixed(2)}" fill="#fff" fill-opacity=".55"/>`;
    } else if (c.lines) {
      // n cleared rows, each a strip of little cells lit up like a line clear
      const n = c.lines, gap = n > 3 ? 2.7 : 3.1, h = n > 3 ? 2 : 2.3, y0 = 51 - ((n - 1) * gap) / 2;
      for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) s += `<rect x="${(45.1 + j * 3).toFixed(2)}" y="${(y0 + i * gap - h / 2).toFixed(2)}" width="2.5" height="${h}" rx=".4" fill="${j % 2 ? '#bff7ff' : '#ffffff'}"/>`;
    } else if (c.arrow) {
      const rot = { r: 0, d: 90, l: 180, u: 270 }[c.arrow];
      s += `<path d="M45.5 49.3H51.5V45.8L57.2 51L51.5 56.2V52.7H45.5Z" fill="#fff" transform="rotate(${rot} 51 51)"/>`;
    } else if (c.txt) {
      s += `<text x="51" y="54.6" text-anchor="middle" font-weight="900" style="font-family: var(--f-disp, sans-serif)" font-size="${c.txt.length > 1 ? 9 : 11}" fill="#fff">${c.txt}</text>`;
    }
    return s;
  }
  function relic(id, d) {
    const t = d.tag in FRAMES ? d.tag : 'Board', f = FRAMES[t], h = hash(id), rim = RIMS[d.rarity] ? d.rarity : 'Common';
    const tint = h % f.tints.length, v = (h >>> 5) % 4, k = d.iconKey, c = CHIPS[id];
    // the glyph stays in the middle of the frame; with a chip it shrinks a little and the chip sits over the corner
    const g = (f.g || 31) - (c ? 3 : 0), cx = 32, cy = f.gy || 32;
    const gx = cx - g / 2, gy = cy - g / 2;
    let s = '';
    // shadow, ink outline, bezel
    s += `<path d="${f.d}" transform="translate(0 2.2)" fill="#000" fill-opacity=".45"/>`;
    s += `<path d="${f.d}" fill="${INK}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>`;
    s += `<path d="${f.d}" fill="url(#eb-rim-${rim})"/>`;
    if (f.coin) s += `<path d="${f.d}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="2.4" stroke-dasharray=".9 1.5" transform="translate(32 32) scale(.93) translate(-32 -32)"/>`;
    // enamel field with its motif, glow and gloss
    s += `<path d="${f.d}" transform="${inset(f)}" fill="${INK}" stroke="${INK}" stroke-width="2.2"/>`;
    s += `<g clip-path="url(#eb-clip-${t})"><rect x="-2" y="-2" width="68" height="68" fill="url(#eb-f-${t}-${tint})"/>${motif(t, v, f)}`;
    s += '</g>';
    s += `<path d="${f.d}" transform="${inset(f)}" fill="none" stroke="url(#eb-bevel)" stroke-width="1.9"/>`;
    // glyph: drop shadow, ink outline, light fill
    const use = (extra) => `<use href="#eg-${k}" x="${gx.toFixed(2)}" y="${gy.toFixed(2)}" width="${g}" height="${g}" ${extra}/>`;
    const sw = inkW(k, 44);
    s += use(`transform="translate(.4 1.6)" fill="#000" fill-opacity=".4" stroke="#000" stroke-opacity=".4" stroke-width="${sw}" stroke-linejoin="round"`);
    s += use(`fill="${INK}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"`);
    s += use(`fill="url(#${f.coin ? 'eb-gfg' : 'eb-gf'})"`);
    if (f.coin) s += use(`fill="none" stroke="#ffe9a6" stroke-opacity=".5" stroke-width="${inkW(k, 10)}" transform="translate(0 .7)"`);
    if (c) s += chip(c, rim);
    // rarity mark
    const [mx, my] = f.mk || [54, 9];
    if (rim === 'Mythic') s += `<g transform="translate(${mx} ${my})"><path d="M0 -10C4 -5 8 -2 6 4C5 8 1 9 0 9C-1 9 -5 8 -6 4C-8 -2 -4 -5 -2 -7C-2 -3 0 -2 1 -3C2 -5 0 -8 0 -10Z" fill="#ff7a3b" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M0 0C2 2 3 4 1.6 6.2C.8 7 -.8 7 -1.6 6.2C-2.6 4.6 -1.6 2 0 0Z" fill="#ffe08a"/></g>`;
    else if (rim === 'Legendary') s += `<path d="M0 -9L2.4 -2.4L9 0L2.4 2.4L0 9L-2.4 2.4L-9 0L-2.4 -2.4Z" transform="translate(${mx} ${my})" fill="#fff6c2" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
    else if (rim === 'Rare') s += `<g transform="translate(${mx} ${my})"><path d="M0 -5.5L5 0L0 5.5L-5 0Z" fill="#ff86de" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M0 -4.2L2.5 0H-2.5Z" fill="#fff" fill-opacity=".7"/></g>`;
    return `<svg class="gi rb rb-${t}" viewBox="-4 -4 72 72" aria-hidden="true">${s}</svg>`;
  }
  // ---------- consumables and Schematics: their own outlines, same build ----------
  const seal = () => { // Pattern: a scalloped seal
    const n = 14, pts = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2, m = a + Math.PI / n;
      pts.push(i === 0 ? `M${(32 + 28.5 * Math.cos(a)).toFixed(2)} ${(32 + 28.5 * Math.sin(a)).toFixed(2)}` : '');
      if (i < n) { const b = a + (2 * Math.PI) / n; pts.push(`Q${(32 + 33.5 * Math.cos(m)).toFixed(2)} ${(32 + 33.5 * Math.sin(m)).toFixed(2)} ${(32 + 28.5 * Math.cos(b)).toFixed(2)} ${(32 + 28.5 * Math.sin(b)).toFixed(2)}`); }
    }
    return pts.join('') + 'Z';
  };
  const jag = () => { // Rift: a torn hole
    const r = [30, 25, 31, 26, 29, 23, 31, 27, 30, 24, 31, 26, 29, 24, 31, 25];
    return r.map((v, i) => { const a = (i / r.length) * Math.PI * 2 - Math.PI / 2; return `${i ? 'L' : 'M'}${(32 + v * Math.cos(a)).toFixed(2)} ${(32 + v * Math.sin(a)).toFixed(2)}`; }).join('') + 'Z';
  };
  const ITEM_FRAMES = {
    Glyph: { d: 'M18 3C30 1 46 2 54 7C61 12 62 24 61 36C60 49 56 58 44 61C32 63 18 62 10 56C3 50 2 38 3 26C4 13 8 5 18 3Z', c: [32, 32], k: 0.8, tints: [['#c9b2ff', '#34207a']], rim: ['#f4f0ff', '#c2b3f0', '#6c5aaa', '#ddd3fb', '#33265f'] },
    Pattern: { d: seal(), c: [32, 32], k: 0.78, g: 30, tints: [['#a8f3ff', '#0d4a94']], rim: ['#e9fdff', '#69eaff', '#1f80d2', '#b5f6ff', '#0b3b73'] },
    Rift: { d: jag(), c: [32, 32], k: 0.74, g: 29, tints: [['#ff9a6a', '#2d0313']], rim: ['#ffe3e6', '#ff6a78', '#a1143c', '#ffa8b2', '#45061a'] },
    Schematic: { d: 'M10 3H45L61 19V54Q61 61 54 61H10Q3 61 3 54V10Q3 3 10 3Z', c: [32, 32], k: 0.82, tints: [['#7cc0ff', '#103a86']], rim: ['#f2f7ff', '#bcd2ee', '#5e7799', '#dce8f8', '#2c3c55'], fold: 1 },
    Secret: { d: 'M32 60C21 51 3 40 3 22C3 11 11 4 20 4C25.5 4 29.5 7 32 11.5C34.5 7 38.5 4 44 4C53 4 61 11 61 22C61 40 43 51 32 60Z', c: [32, 30], k: 0.76, g: 27, tints: [['#ff9fd6', '#5a0f3d']], rim: ['#ffe6f4', '#ff7cc8', '#a3236d', '#ffc2e4', '#4d0a33'] },
  };
  function itemMotif(t) {
    switch (t) {
      case 'Glyph': return '<path d="M10 14L15 10M12 20L17 18M50 10L55 15M52 48L57 44M9 46L14 52M47 54L53 51" stroke="#fff" stroke-opacity=".22" stroke-width="1.4" stroke-linecap="round"/>';
      case 'Pattern': {
        let s = '<circle cx="32" cy="32" r="22" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1"/>';
        for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; s += `<path d="M${(32 + 20 * Math.cos(a)).toFixed(1)} ${(32 + 20 * Math.sin(a)).toFixed(1)}L${(32 + 22 * Math.cos(a)).toFixed(1)} ${(32 + 22 * Math.sin(a)).toFixed(1)}" stroke="#fff" stroke-opacity=".3" stroke-width="1"/>`; }
        return s;
      }
      case 'Rift': return '<path d="M32 32m-18 0a18 18 0 0 1 30 -10M32 32m14 6a14 14 0 0 1 -24 6M32 32m-8 -4a9 9 0 0 1 14 -2" fill="none" stroke="#ffb08a" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>';
      case 'Schematic': return '<path d="' + [12, 20, 28, 36, 44, 52].map((x) => `M${x} 0V64M0 ${x}H64`).join('') + '" stroke="#fff" stroke-opacity=".13" stroke-width=".8"/><path d="M8 56H24M8 54V58M24 54V58" stroke="#fff" stroke-opacity=".4" stroke-width="1"/>';
    }
    return '';
  }
  function item(t, k) {
    const f = ITEM_FRAMES[t], g = f.g || 31, gx = 32 - g / 2, gy = 32 - g / 2;
    let s = `<path d="${f.d}" transform="translate(0 2.2)" fill="#000" fill-opacity=".45"/>`;
    s += `<path d="${f.d}" fill="${INK}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/><path d="${f.d}" fill="url(#eb-rim-${t})"/>`;
    s += `<path d="${f.d}" transform="${inset(f)}" fill="${INK}" stroke="${INK}" stroke-width="2.2"/>`;
    s += `<g clip-path="url(#eb-clip-${t})"><rect x="-2" y="-2" width="68" height="68" fill="url(#eb-f-${t}-0)"/>${itemMotif(t)}</g>`;
    s += `<path d="${f.d}" transform="${inset(f)}" fill="none" stroke="url(#eb-bevel)" stroke-width="1.9"/>`;
    if (f.fold) s += `<path d="M45 3V13Q45 19 51 19H61Z" fill="#dce8f8" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M46.5 5V13Q46.5 17.5 51 17.5H59" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>`;
    const use = (extra) => `<use href="#eg-${k}" x="${gx}" y="${gy}" width="${g}" height="${g}" ${extra}/>`;
    const sw = inkW(k, 44);
    s += use(`transform="translate(.4 1.6)" fill="#000" fill-opacity=".4" stroke="#000" stroke-opacity=".4" stroke-width="${sw}" stroke-linejoin="round"`);
    s += use(`fill="${INK}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"`) + use('fill="url(#eb-gf)"');
    return `<svg class="gi rb rb-${t}" viewBox="-4 -4 72 72" aria-hidden="true">${s}</svg>`;
  }
  // ---------- Workshop packs: flat, inked objects ----------
  // Each pack is a real thing on a shelf, drawn like the blocks: an ink outline, flat colour, one hard shade and one
  // thin highlight. No glows or sparkles; a soft floor shadow grounds it. Boxes use one oblique angle (depth up-right).
  const O = `stroke="${INK}" stroke-width="2" stroke-linejoin="round"`;
  const O1 = `stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"`;
  const shadow = (cx, w) => `<ellipse cx="${cx}" cy="59.5" rx="${w}" ry="2.6" fill="#000" fill-opacity=".3"/>`;
  const poly = (pts, fill, extra) => `<path d="M${pts.map((p) => p.join(' ')).join('L')}Z" fill="${fill}" ${extra || O}/>`;
  // a box seen from the front-left: front face, top face and right side, d deep
  const box = (x, y, w, h, d, cf, ct, cs) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], cf) +
    poly([[x, y], [x + d, y - d], [x + w + d, y - d], [x + w, y]], ct) + poly([[x + w, y], [x + w + d, y - d], [x + w + d, y + h - d], [x + w, y + h]], cs);
  // one block of a piece: flat face, a light top-left lip and a dark bottom-right lip, hard edges
  const blk = (x, y, u, col, hi, lo) => {
    const k = Math.max(1.2, u * 0.16);
    return `<rect x="${x}" y="${y}" width="${u}" height="${u}" fill="${col}" ${O1}/>` +
      `<path d="M${x + 0.7} ${y + u - 0.7}V${y + 0.7}H${x + u - 0.7}L${x + u - k} ${y + k}H${x + k}V${y + u - k}Z" fill="${hi}"/>` +
      `<path d="M${x + u - 0.7} ${y + 0.7}V${y + u - 0.7}H${x + 0.7}L${x + k} ${y + u - k}H${x + u - k}V${y + k}Z" fill="${lo}"/>`;
  };
  const PC = { I: ['#35e6ff', '#b8f6ff', '#1b8fb0'], O: ['#ffd23b', '#fff0a6', '#c48a10'], T: ['#a46bff', '#dcc6ff', '#5e2fc0'], S: ['#4ee87c', '#c4fbd2', '#1d8f44'], Z: ['#ff5c6a', '#ffc4ca', '#a8243a'], L: ['#ff9a3b', '#ffd6ad', '#b35a12'], J: ['#5c7cff', '#c9d4ff', '#2c3fb0'] };
  const piece = (cells, x, y, u, k, rot) => {
    const c = PC[k];
    const s = cells.map(([cx, cy]) => blk(x + cx * u, y + cy * u, u, c[0], c[1], c[2])).join('');
    return rot ? `<g transform="rotate(${rot} ${x} ${y})">${s}</g>` : s;
  };
  // a crate: front planks with corner posts, a dark open top, slatted right side, nail heads
  const crate = (x, y, w, h, d) => {
    let s = poly([[x, y], [x + d, y - d], [x + w + d, y - d], [x + w, y]], '#2b1a10');
    s += poly([[x + w, y], [x + w + d, y - d], [x + w + d, y + h - d], [x + w, y + h]], '#8a5226');
    for (let i = 1; i < 3; i++) s += `<path d="M${x + w} ${y + (h * i) / 3}L${x + w + d} ${y + (h * i) / 3 - d}" stroke="${INK}" stroke-width="1.2" stroke-opacity=".7"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#c27d3e" ${O}/>`;
    for (let i = 1; i < 3; i++) s += `<path d="M${x} ${y + (h * i) / 3}H${x + w}" stroke="${INK}" stroke-width="1.3"/>`;
    // the grain: short strokes per plank
    for (let i = 0; i < 3; i++) { const py = y + (h * (i + 0.5)) / 3; s += `<path d="M${x + 9 + i * 4} ${py}h7M${x + w - 18 - i * 3} ${py + 1.5}h6" stroke="#8a4f22" stroke-width="1" stroke-linecap="round"/>`; }
    s += `<rect x="${x}" y="${y}" width="5" height="${h}" fill="#a96530" ${O}/><rect x="${x + w - 5}" y="${y}" width="5" height="${h}" fill="#a96530" ${O}/>`;
    s += `<path d="M${x + 1.2} ${y + 1.2}H${x + w - 1.2}" stroke="#f0b779" stroke-width="1.1"/>`;
    for (const [nx, ny] of [[x + 2.5, y + 3], [x + 2.5, y + h - 3], [x + w - 2.5, y + 3], [x + w - 2.5, y + h - 3]]) s += `<circle cx="${nx}" cy="${ny}" r="0.95" fill="${INK}"/>`;
    return s;
  };
  // spray-painted stencil marks on a crate front
  const stencil = (d) => `<path d="${d}" fill="#6e3d18" fill-opacity=".85"/>`;
  // a board cell tile with its mark
  const tile = (x, y, u, col, mark) => `<rect x="${x}" y="${y}" width="${u}" height="${u}" rx="1" fill="#1d1a3a" ${O1}/><rect x="${x + 1.8}" y="${y + 1.8}" width="${u - 3.6}" height="${u - 3.6}" fill="${col}" fill-opacity=".28" stroke="${col}" stroke-width="1"/>${mark || ''}`;
  const coin = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffd23b" ${O1}/><circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="none" stroke="#b37a0c" stroke-width="1"/>`;
  const gem = (cx, cy, r) => `<path d="M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z" fill="#7cf8ff" ${O1}/><path d="M${cx - r * 0.45} ${cy - r * 0.1}L${cx} ${cy - r * 0.55}" stroke="#fff" stroke-width="1"/>`;
  const flame = (cx, cy, r) => `<path d="M${cx} ${cy - r}C${cx + r} ${cy - r * 0.1} ${cx + r * 0.8} ${cy + r} ${cx} ${cy + r}C${cx - r * 0.8} ${cy + r} ${cx - r} ${cy - r * 0.1} ${cx} ${cy - r}Z" fill="#ff7a2e" ${O1}/>`;
  const note = (cx, cy, r) => `<path d="M${cx - r * 0.2} ${cy + r * 0.55}V${cy - r}L${cx + r * 0.85} ${cy - r * 0.65}" fill="none" stroke="#c78bff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="${cx - r * 0.55}" cy="${cy + r * 0.6}" rx="${r * 0.42}" ry="${r * 0.32}" fill="#c78bff"/>`;
  const PACK_ART = {
    // a kraft parcel tied with twine, a printed label with a T piece on the front
    piece: () => shadow(33, 25) + box(9, 27, 36, 30, 10, '#c99159', '#e3b47c', '#a06a37') +
      `<path d="M10.2 28.2H43.8" stroke="#f2cf9e" stroke-width="1.1"/>` +
      // twine over the lid and down the front, tied in a bow on top
      ['M38 27L48 17', 'M38 27V57'].map((d) => `<path d="${d}" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="${d}" stroke="#f1e6cf" stroke-width="1.5" stroke-linecap="round"/>`).join('') +
      `<path d="M43 22C39 17 35 18.5 37 21.5M43 22C47 17 51 18.5 49 21.5" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M43 22C39 17 35 18.5 37 21.5M43 22C47 17 51 18.5 49 21.5" fill="none" stroke="#f1e6cf" stroke-width="1.4" stroke-linecap="round"/>` +
      `<rect x="13" y="33" width="21" height="17" rx="1" fill="#f4ead6" ${O1} transform="rotate(-4 23 41)"/>` +
      piece([[0, 0], [1, 0], [2, 0], [1, 1]], 16.6, 36.4, 4.9, 'T', -4) +
      `<path d="M15.5 47.8H27" stroke="#c9b48c" stroke-width="1" transform="rotate(-4 23 41)"/>`,
    // a slatted crate packed with pieces, a stencilled block on the front
    jumbo_piece: () => shadow(33, 26) +
      piece([[0, 0], [1, 0], [2, 0], [3, 0]], 12, 21, 7.4, 'I', -18) + piece([[0, 0], [1, 0], [0, 1], [1, 1]], 33, 10, 7.4, 'O', 8) +
      piece([[1, 0], [2, 0], [0, 1], [1, 1]], 18, 9, 6.8, 'S', -6) + crate(7, 30, 41, 27, 8) +
      stencil('M19 37h15v5h-5v5h-5v-5h-5z'),
    // three thick board tiles stacked face on, the top one a 3x3 of cells; a leather strap and brass buckle
    board: () => {
      let s = shadow(33, 24);
      for (const [o, c] of [[8, '#1d1a3a'], [4, '#2a2450']]) s += `<rect x="${12 + o}" y="${8 + o}" width="38" height="38" rx="2" fill="${c}" ${O}/>`;
      s += `<rect x="12" y="8" width="38" height="38" rx="2" fill="#3a3468" ${O}/><path d="M14 10.2H48" stroke="#6a62b0" stroke-width="1.2"/>`;
      const marks = { '0,0': ['#ffd23b', (x, y) => coin(x, y, 3.4)], '2,0': ['#7cf8ff', (x, y) => gem(x, y, 3.8)], '0,2': ['#ff7a2e', (x, y) => flame(x, y, 3.8)], '2,2': ['#c78bff', (x, y) => note(x, y, 3.6)] };
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const x = 15 + c * 11, y = 11 + r * 11, m = marks[c + ',' + r];
        s += tile(x, y, 10, m ? m[0] : '#7c7ca8', m ? m[1](x + 5, y + 5) : '');
      }
      s += `<rect x="28.5" y="5" width="5" height="49" fill="#8a4520" ${O1}/><path d="M29.6 6V53" stroke="#b8642e" stroke-width="1"/>`;
      s += `<rect x="26.5" y="26" width="9" height="8" rx="1" fill="none" stroke="${INK}" stroke-width="3.6"/><rect x="26.5" y="26" width="9" height="8" rx="1" fill="none" stroke="#ffd23b" stroke-width="1.8"/><path d="M31 26.5V33.5" stroke="${INK}" stroke-width="1.2"/>`;
      return s;
    },
    // the crate again, with board tiles and a stencilled peak
    jumbo_board: () => shadow(33, 26) +
      `<g transform="rotate(-12 18 22)">${tile(11, 14, 12, '#ffd23b', coin(17, 20, 3.4))}</g>` + `<g transform="rotate(9 40 16)">${tile(33, 8, 12, '#7cf8ff', gem(39, 14, 3.6))}</g>` +
      `<g transform="rotate(-3 30 22)">${tile(23, 16, 12, '#ff7a2e', flame(29, 22, 3.6))}</g>` + crate(7, 30, 41, 27, 8) +
      stencil('M15 49L22 38L26 44L29 40L35 49Z'),
    // a parchment hung between two rods: three cleared rows printed on it, a wax seal on a ribbon
    pattern: () => shadow(32, 22) +
      `<path d="M14 11H50V52H14Z" fill="#efdcae" ${O}/><path d="M44 11H50V52H44Z" fill="#d6bb84"/><path d="M14 11H50V52H14Z" fill="none" ${O}/>` +
      [0, 1, 2].map((r) => [0, 1, 2, 3, 4, 5].map((c) => { const full = r !== 1 || c !== 4; const col = ['#35e6ff', '#a46bff', '#ffd23b'][r]; return `<rect x="${18 + c * 4.6}" y="${19 + r * 8}" width="4" height="4" fill="${full ? col : 'none'}" stroke="${INK}" stroke-width="0.9"/>`; }).join('')).join('') +
      `<path d="M18 44H34M18 47.5H28" stroke="#9c7d4a" stroke-width="1.2" stroke-linecap="round"/>` +
      ['M10 7.5H54V13.5H10Z', 'M10 49.5H54V55.5H10Z'].map((d) => `<path d="${d}" fill="#9a5a2a" ${O}/><path d="${d.replace(/H54V\d+\.5H10Z/, 'H54')}" stroke="#d99a5c" stroke-width="1.2" transform="translate(0 1.4)"/>`).join('') +
      `<circle cx="9" cy="10.5" r="3.4" fill="#6e3a16" ${O1}/><circle cx="55" cy="10.5" r="3.4" fill="#6e3a16" ${O1}/><circle cx="9" cy="52.5" r="3.4" fill="#6e3a16" ${O1}/><circle cx="55" cy="52.5" r="3.4" fill="#6e3a16" ${O1}/>` +
      `<path d="M40 41L37 53L40.5 51L42 54L44 42Z" fill="#c72a40" ${O1}/><circle cx="42" cy="40" r="5.2" fill="#d63a4e" ${O}/><path d="M39.6 40h4.8M42 37.6v4.8" stroke="#8a1424" stroke-width="1.4" stroke-linecap="round"/>`,
    // a small cabinet with a glass door: two curios on its shelves
    relic: () => shadow(32, 22) +
      `<path d="M12 12H52V55H12Z" fill="#7a2f22" ${O}/><path d="M46 12H52V55H46Z" fill="#5c2118"/><path d="M12 12H52V55H12Z" fill="none" ${O}/>` +
      `<path d="M9 7H55V12H9Z" fill="#9a3e2c" ${O}/><path d="M10.5 8.6H53.5" stroke="#c96a4e" stroke-width="1"/>` +
      `<rect x="13" y="55" width="6" height="4" fill="#5c2118" ${O1}/><rect x="45" y="55" width="6" height="4" fill="#5c2118" ${O1}/>` +
      `<rect x="16" y="16" width="27" height="35" fill="#1d1430" ${O1}/><path d="M16 33.5H43" stroke="#9a3e2c" stroke-width="2.4"/>` +
      // a shield on the top shelf, a coin and a little vase below
      `<path d="M23 20L28 22V26.5C28 29 25.5 30.5 23 31.5C20.5 30.5 18 29 18 26.5V22Z" fill="#7fe3ff" ${O1}/>` + coin(36, 27.5, 4) +
      `<path d="M21 49C18.5 46 19.5 42 21.5 41V39H25.5V41C27.5 42 28.5 46 26 49Z" fill="#4ee87c" ${O1}/>` + gem(36, 45, 4.4) +
      // the glass: a frame, a pale pane and one glint
      `<rect x="16" y="16" width="27" height="35" fill="#bfe8ff" fill-opacity=".14"/><path d="M19 47L38 18M24 48L39 25" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>` +
      `<rect x="15" y="15" width="29" height="37" fill="none" stroke="#c9a04a" stroke-width="1.6"/><circle cx="46.5" cy="34" r="1.8" fill="#ffd23b" ${O1}/>`,
    // a gold cup with a T piece on it, on a dark plinth with a name plate
    trophy: () => shadow(32, 20) +
      ['M19 13H11V18C11 24 15 28 21 28', 'M45 13H53V18C53 24 49 28 43 28'].map((d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="5.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#ffc933" stroke-width="2.4" stroke-linecap="round"/>`).join('') +
      `<path d="M17 8H47V21C47 30.5 40.5 37 32 37C23.5 37 17 30.5 17 21Z" fill="#ffc933" ${O}/><path d="M37 8.8H46.2V21C46.2 28.5 42.5 34 37 36Z" fill="#d99a1a"/><path d="M17 8H47V21C47 30.5 40.5 37 32 37C23.5 37 17 30.5 17 21Z" fill="none" ${O}/>` +
      `<path d="M21.5 12V21C21.5 25 23 28.5 26 30.5" fill="none" stroke="#fff3c2" stroke-width="1.6" stroke-linecap="round"/>` +
      piece([[0, 0], [1, 0], [2, 0], [1, 1]], 25.4, 15, 4.4, 'T') +
      `<rect x="28.5" y="36.5" width="7" height="6" fill="#d99a1a" ${O}/><rect x="21" y="42" width="22" height="5.5" rx="1" fill="#ffc933" ${O}/>` +
      `<path d="M15 47.5H49V58H15Z" fill="#2a2450" ${O}/><path d="M43 47.5H49V58H43Z" fill="#1d1a3a"/><path d="M15 47.5H49V58H15Z" fill="none" ${O}/><rect x="22" y="50.5" width="16" height="4.4" fill="#ffc933" ${O1}/>`,
  };
  const packDefs = () => '';
  const pack = (type) => `<svg class="gi rb rb-pack" viewBox="0 0 64 64" aria-hidden="true">${(PACK_ART[type] || PACK_ART.piece)()}</svg>`;
  const baseDefs = defs;
  const allDefs = () => {
    let o = baseDefs() + packDefs();
    for (const t in ITEM_FRAMES) {
      const f = ITEM_FRAMES[t], c = f.rim;
      o += `<linearGradient id="eb-rim-${t}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".1" stop-color="${c[0]}"/><stop offset=".1" stop-color="${c[1]}"/><stop offset=".56" stop-color="${c[1]}"/><stop offset=".56" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>`;
      o += `<clipPath id="eb-clip-${t}"><path d="${f.d}" transform="${inset(f)}"/></clipPath>`;
      o += `<linearGradient id="eb-f-${t}-0"><stop stop-color="${mix(f.tints[0][0], f.tints[0][1], 0.42)}"/></linearGradient>`;
    }
    const keys = new Set([...Object.values(MAP.GLYPHS), ...Object.values(MAP.PATTERNS), ...Object.values(MAP.RIFTS), ...Object.values(MAP.BLUEPRINTS), ...Object.values(MAP.SECRET_ITEMS || {})].filter((k) => !Object.values(MAP.RELICS).includes(k)));
    for (const k of keys) o += sym(k);
    return o;
  };
  SB.Emblem = { defs: allDefs, relic, item, pack, FRAMES, RIMS };
  for (const id in SB.RELICS) { const d = SB.RELICS[id]; if (d.iconKey) d.art = relic(id, d); }
  for (const [tbl, t] of [['GLYPHS', 'Glyph'], ['PATTERNS', 'Pattern'], ['RIFTS', 'Rift'], ['BLUEPRINTS', 'Schematic'], ['SECRET_ITEMS', 'Secret']]) for (const id in SB[tbl]) { const d = SB[tbl][id]; if (d.iconKey) d.art = item(t, d.iconKey); }
  for (const id in SB.PACKS) SB.PACKS[id].art = pack(id);
  const put = () => { if (!document.getElementById('ebDefs')) document.body.insertAdjacentHTML('afterbegin', `<svg id="ebDefs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${allDefs()}</defs></svg>`); };
  if (document.body) put(); else document.addEventListener('DOMContentLoaded', put);
})(window.SB);