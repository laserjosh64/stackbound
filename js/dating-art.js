// Falling for You (the secret dating game): character art, emotion marks, scenes and the little UI glyphs.
// Everything is drawn as SVG here. The pieces have no faces, so feelings show as manga marks around the
// head block (blush, an anger vein, sweat, tears, sparkles...) plus a pose the stylesheet animates.
'use strict';
(function (SB) {
  const Art = (SB.DateArt = {});
  const U = 84, INK = '#2b1830';
  let uid = 0;

  // ---------- the cast ----------
  // cells are [col, row] with the piece standing up; head is the block the feelings sit on
  const CAST = {
    isla: { name: 'Isla', color: '#35e6ff', plate: '#1fa7c4', cells: [[0, 0], [0, 1], [0, 2], [0, 3]], head: [0, 0] },
    tessa: { name: 'Tessa', color: '#b25cff', plate: '#8a38d6', cells: [[0, 0], [1, 0], [2, 0], [1, 1]], head: [1, 0] },
    otto: { name: 'Otto', color: '#ffd23b', plate: '#c99a10', cells: [[0, 0], [1, 0], [0, 1], [1, 1]], head: [0, 0], headW: 2 },
    zed: { name: 'Zed', color: '#ff4d6a', plate: '#d02c4a', cells: [[1, 0], [1, 1], [0, 1], [0, 2]], head: [1, 0] },
    elle: { name: 'Elle', color: '#ff9a3b', plate: '#d9731a', cells: [[0, 0], [0, 1], [0, 2], [1, 2]], head: [0, 0] },
    jay: { name: 'Jay', color: '#4f7bff', plate: '#2f56d6', cells: [[1, 0], [1, 1], [1, 2], [0, 2]], head: [1, 0] },
    sasha: { name: 'Sasha', color: '#4dff7c', plate: '#20b84e', cells: [[0, 0], [0, 1], [1, 1], [1, 2]], head: [0, 0] },
    mono: { name: 'You', color: '#ff7ad9', plate: '#e0489f', cells: [[0, 0]], head: [0, 0] },
  };
  Art.CAST = CAST;

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const shade = (h, t) => {
    const c = hex(h).map((v) => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t)));
    return '#' + c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  };
  Art.shade = shade;

  // a piece as a solid toy: front faces cel-shaded like an anime figure, a lit top and a shaded side
  // set back up and to the right for depth, coloured line art (a deep tone of the piece, not black)
  const DEPTH = 0.2;
  function blocks(cells, color, ox, oy, s, gid) {
    const set = new Set(cells.map(([a, b]) => a + ',' + b)), has = (a, b) => set.has(a + ',' + b);
    const d = s * DEPTH, lw = Math.max(2, s * 0.045), line = shade(color, -0.66);
    const top = shade(color, 0.45), side = shade(color, -0.3), cel = shade(color, -0.17), lite = shade(color, 0.3);
    const pt = (p) => p.map((v) => v.toFixed(1)).join(' ');
    const face = (ps, fill) => `<path d="M${ps.map(pt).join(' L')}Z" fill="${fill}" stroke="${line}" stroke-width="${lw}" stroke-linejoin="round"/>`;
    let back = '', outl = '', front = '';
    for (const [cx, cy] of cells) {
      const x = ox + cx * s, y = oy + cy * s;
      if (!has(cx, cy - 1)) back += face([[x, y], [x + d, y - d], [x + s + d, y - d], [x + s, y]], `url(#${gid}t)`);
      if (!has(cx + 1, cy)) back += face([[x + s, y], [x + s + d, y - d], [x + s + d, y + s - d], [x + s, y + s]], `url(#${gid}r)`);
    }
    for (const [cx, cy] of cells) outl += `<rect x="${(ox + cx * s - lw / 2).toFixed(1)}" y="${(oy + cy * s - lw / 2).toFixed(1)}" width="${(s + lw).toFixed(1)}" height="${(s + lw).toFixed(1)}" fill="${line}"/>`;
    for (const [cx, cy] of cells) {
      const x = ox + cx * s, y = oy + cy * s, head = !front;
      front += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="url(#${gid}f)"/>`
        // hard cel shadow down the right and along the bottom, with a soft curve where it turns
        + `<path d="M${x + s * 0.8} ${y} H${x + s} V${y + s} H${x} V${y + s * 0.8} H${x + s * 0.62} Q${x + s * 0.8} ${y + s * 0.8} ${x + s * 0.8} ${y + s * 0.62}Z" fill="${cel}"/>`
        + `<path d="M${x + s} ${y + s * 0.9} V${y + s} H${x + s * 0.1}" stroke="${shade(color, -0.3)}" stroke-width="${s * 0.07}" fill="none" opacity=".6"/>`
        // bevel light on the top and left inner edges
        + `<path d="M${x + s * 0.06} ${y + s * 0.74} V${y + s * 0.06} H${x + s * 0.74}" stroke="${lite}" stroke-width="${s * 0.05}" fill="none" stroke-linecap="round"/>`
        + (has(cx - 1, cy) ? '' : `<rect x="${x + 1}" y="${y + s * 0.1}" width="${s * 0.035}" height="${s * 0.8}" fill="#fff" opacity=".45"/>`)
        + (head
          // the head block catches the light: a glossy crescent and a four-point glint
          ? `<path d="M${x + s * 0.16} ${y + s * 0.42} Q${x + s * 0.16} ${y + s * 0.16} ${x + s * 0.44} ${y + s * 0.15}" stroke="#fff" stroke-width="${s * 0.075}" fill="none" stroke-linecap="round" opacity=".85"/>`
            + `<path d="M${x + s * 0.58} ${y + s * 0.13} q ${s * 0.018} ${s * 0.07} ${s * 0.085} ${s * 0.085} q ${-s * 0.067} ${s * 0.015} ${-s * 0.085} ${s * 0.085} q ${-s * 0.018} ${-s * 0.07} ${-s * 0.085} ${-s * 0.085} q ${s * 0.067} ${-s * 0.015} ${s * 0.085} ${-s * 0.085}Z" fill="#fff" opacity=".9"/>`
          : `<path d="M${x + s * 0.17} ${y + s * 0.34} Q${x + s * 0.17} ${y + s * 0.17} ${x + s * 0.34} ${y + s * 0.17}" stroke="#fff" stroke-width="${s * 0.06}" fill="none" stroke-linecap="round" opacity=".55"/>`);
      if (has(cx + 1, cy)) front += `<path d="M${x + s} ${y + s * 0.04} V${y + s * 0.96}" stroke="${line}" stroke-width="${lw * 0.55}" opacity=".55"/>`;
      if (has(cx, cy + 1)) front += `<path d="M${x + s * 0.04} ${y + s} H${x + s * 0.96}" stroke="${line}" stroke-width="${lw * 0.55}" opacity=".55"/>`;
    }
    const defs = `<linearGradient id="${gid}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(color, 0.14)}"/><stop offset="1" stop-color="${color}"/></linearGradient>`
      + `<linearGradient id="${gid}t" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${shade(color, 0.25)}"/></linearGradient>`
      + `<linearGradient id="${gid}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${side}"/><stop offset="1" stop-color="${shade(color, -0.45)}"/></linearGradient>`;
    return { defs, body: back + outl + front, d };
  }

  // ---------- hair ----------
  // anime hair on the head block: a crown over the top, a fringe that hides where a face would be,
  // the glossy ring of highlight across it, and each character's own cut
  const HAIR = {
    isla: { col: '#24406e', cut: 'long' },
    tessa: { col: '#ffd66b', cut: 'twin', span: [0, 3] },
    otto: { col: '#8a5634', cut: 'fluff' },
    zed: { col: '#2b2838', cut: 'spike' },
    elle: { col: '#8e2f22', cut: 'bob' },
    jay: { col: '#d9ddf2', cut: 'messy' },
    sasha: { col: '#1d4a36', cut: 'pony' },
    mono: { col: '#ff6fae', cut: 'tuft' },
  };
  function hair(id, x, y, w, s, d) {
    const H = HAIR[id];
    if (!H) return '';
    const col = H.col, dark = shade(col, -0.45), lw = Math.max(2, s * 0.045), gid = 'hr' + ++uid;
    const f = (v) => v.toFixed(1);
    const L = (pts) => pts.map((p) => f(p[0]) + ' ' + f(p[1])).join(' L');
    const st = `stroke="${dark}" stroke-width="${lw}" stroke-linejoin="round" stroke-linecap="round"`;
    const tipsN = Math.max(3, Math.round((w / s) * 4)), fringe = y + s * (H.cut === 'tuft' ? 0.3 : 0.44);
    // fringe tips from right to left, uneven like real bangs
    const tips = [];
    for (let i = tipsN; i >= 0; i--) {
      const tx = x + (w * i) / tipsN;
      tips.push([tx, fringe - s * 0.16 + ((i * 37) % 5) * 1.2]);
      if (i) tips.push([tx - (w / tipsN) * 0.55, fringe + ((i * 13) % 3) * s * 0.03]);
    }
    let behind = '', extra = '';
    const sideL = H.cut === 'long' ? s * 1.25 : H.cut === 'bob' ? s * 0.78 : s * 0.5;
    // locks hanging down both sides
    const lock = (sx, dir, len) => `<path d="M${f(sx)} ${f(y + s * 0.1)} q ${f(dir * s * 0.16)} ${f(len * 0.5)} ${f(dir * s * 0.02)} ${f(len)} q ${f(-dir * s * 0.12)} ${f(-len * 0.18)} ${f(-dir * s * 0.14)} ${f(-len * 0.55)} Z" fill="url(#${gid})" ${st}/>`;
    if (H.cut === 'long' || H.cut === 'bob') extra += lock(x - 2, -1, sideL) + lock(x + w + d * 0.4, 1, sideL * 0.92);
    if (H.cut === 'twin') {
      const tail = (sx, dd0) => {
        const dir = dd0 * 0.62;
        const y0 = y + s * 0.08;
        return `<path d="M${f(sx)} ${f(y0)} C ${f(sx + dir * s * 0.95)} ${f(y0 - s * 0.25)}, ${f(sx + dir * s * 1.05)} ${f(y0 + s * 0.95)}, ${f(sx + dir * s * 0.5)} ${f(y0 + s * 1.55)} C ${f(sx + dir * s * 0.66)} ${f(y0 + s * 0.95)}, ${f(sx + dir * s * 0.36)} ${f(y0 + s * 0.42)}, ${f(sx)} ${f(y0 + s * 0.32)} Z" fill="url(#${gid})" ${st}/>`
          + `<path d="M${f(sx + dir * s * 0.2)} ${f(y0 + s * 0.12)} C ${f(sx + dir * s * 0.75)} ${f(y0 + s * 0.1)}, ${f(sx + dir * s * 0.8)} ${f(y0 + s * 0.8)}, ${f(sx + dir * s * 0.56)} ${f(y0 + s * 1.3)}" stroke="${dark}" stroke-width="${f(lw * 0.6)}" fill="none" opacity=".5"/>`
          + `<path d="M${f(sx + dir * s * 0.3)} ${f(y0 + s * 0.02)} q ${f(dir * s * 0.3)} ${f(s * 0.05)} ${f(dir * s * 0.42)} ${f(s * 0.32)}" stroke="#fff" stroke-width="${f(s * 0.05)}" fill="none" opacity=".6" stroke-linecap="round"/>`
          + `<circle cx="${f(sx)}" cy="${f(y0 + s * 0.12)}" r="${f(s * 0.11)}" fill="#ff5fb3" ${st}/>`;
      };
      behind += tail(x - 2, -1) + tail(x + w + d * 0.5, 1);
    }
    if (H.cut === 'pony') behind += `<path d="M${f(x + w + d * 0.6)} ${f(y - d * 0.4)} c ${f(s * 0.55)} ${f(-s * 0.1)} ${f(s * 0.7)} ${f(s * 0.55)} ${f(s * 0.5)} ${f(s * 1.05)} c ${f(-s * 0.02)} ${f(-s * 0.4)} ${f(-s * 0.18)} ${f(-s * 0.7)} ${f(-s * 0.5)} ${f(-s * 0.78)} Z" fill="url(#${gid})" ${st}/>`;
    // the crown sits over the top face and spills down the front to the fringe
    const top = y - d - s * 0.12;
    let crown = `M${f(x - s * 0.06)} ${f(fringe - s * 0.12)} C ${f(x - s * 0.1)} ${f(y - s * 0.05)}, ${f(x + d * 0.1)} ${f(top)}, ${f(x + d + w * 0.35)} ${f(top)}`
      + ` C ${f(x + w + d + s * 0.14)} ${f(top + s * 0.02)}, ${f(x + w + d + s * 0.08)} ${f(y - d * 0.4)}, ${f(x + w + d + s * 0.04)} ${f(y + s * 0.1)}`
      + ` Q ${f(x + w + d * 0.5)} ${f(fringe - s * 0.2)}, ${f(x + w + s * 0.06)} ${f(fringe - s * 0.1)} L${L(tips)} Z`;
    if (H.cut === 'spike') {
      let sp = '';
      for (let i = 0; i < 5; i++) { const bx = x + d * 0.4 + (w * (i + 0.5)) / 5; sp += `<path d="M${f(bx - s * 0.12)} ${f(top + s * 0.1)} L${f(bx + s * 0.02)} ${f(top - s * (0.2 + (i % 2) * 0.12))} L${f(bx + s * 0.14)} ${f(top + s * 0.1)}Z" fill="url(#${gid})" ${st}/>`; }
      behind += sp;
    }
    if (H.cut === 'fluff') {
      let pf = '';
      for (let i = 0; i < 6; i++) { const bx = x + d * 0.3 + (w * (i + 0.5)) / 6; pf += `<circle cx="${f(bx)}" cy="${f(top + s * 0.08)}" r="${f(s * 0.17)}" fill="url(#${gid})" ${st}/>`; }
      behind += pf;
    }
    if (H.cut === 'messy' || H.cut === 'tuft' || H.cut === 'fluff') {
      // the ahoge: one stubborn strand
      const ax = x + d * 0.5 + w * 0.45;
      extra += `<path d="M${f(ax)} ${f(top + s * 0.06)} c ${f(-s * 0.06)} ${f(-s * 0.3)} ${f(s * 0.26)} ${f(-s * 0.36)} ${f(s * 0.18)} ${f(-s * 0.12)} c ${f(-s * 0.06)} ${f(-s * 0.12)} ${f(-s * 0.14)} ${f(-s * 0.04)} ${f(-s * 0.12)} ${f(s * 0.12)}Z" fill="url(#${gid})" ${st}/>`;
    }
    // the ring of shine, broken into slanted dashes
    let shine = '';
    const ry = y - d * 0.35;
    for (let i = 0; i < 5; i++) {
      const sx = x + d * 0.35 + (w + d * 0.2) * (0.1 + i * 0.18), sy = ry + Math.abs(i - 2) * s * 0.035;
      shine += `<path d="M${f(sx)} ${f(sy)} l ${f(s * 0.07)} ${f(-s * 0.05)} l ${f(s * 0.05)} ${f(s * 0.02)} l ${f(-s * 0.07)} ${f(s * 0.06)}Z" fill="#fff" opacity="${i === 1 || i === 2 ? 0.9 : 0.6}"/>`;
    }
    // a few strands down into the fringe
    let strands = '';
    for (let i = 1; i < tipsN; i += 2) { const tx = x + (w * i) / tipsN; strands += `<path d="M${f(tx + d * 0.4)} ${f(y - d * 0.3)} Q ${f(tx + s * 0.02)} ${f(y + s * 0.08)} ${f(tx - (w / tipsN) * 0.4)} ${f(fringe - s * 0.04)}" stroke="${dark}" stroke-width="${f(lw * 0.6)}" fill="none" opacity=".55" stroke-linecap="round"/>`; }
    const defs = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${shade(col, 0.22)}"/><stop offset=".55" stop-color="${col}"/><stop offset="1" stop-color="${shade(col, -0.22)}"/></linearGradient></defs>`;
    // a soft shadow the fringe casts on the block below it
    const cast = `<path d="M${f(x)} ${f(fringe - s * 0.04)} L${L(tips.slice().reverse().map((p) => [p[0], p[1] + s * 0.07]))} L${f(x + w)} ${f(fringe - s * 0.04)}Z" fill="#000" opacity=".14"/>`;
    return { behind: defs + behind, front: cast + `<path d="${crown}" fill="url(#${gid})" ${st}/>` + strands + shine + extra };
  }

  // ---------- accessories (drawn in block units so they fit any size) ----------
  const ACC = {
    // a long striped scarf round the neck, tail over the shoulder, and a star clip
    isla(x, y, s) {
      const n = y + s - 6;
      let st = '';
      for (let i = 0; i < 6; i++) st += `<rect x="${x - 8 + i * (s + 16) / 6}" y="${n - 13}" width="${(s + 16) / 12}" height="26" fill="#fff" opacity=".85"/>`;
      return `<g><path d="M${x + s * 0.62} ${n} q 18 26 6 ${s * 1.2} l 26 6 q 10 -${s * 0.7} -10 -${s * 1.2}z" fill="#3fd6a8" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M${x + s * 0.68 + 6} ${n + s * 1.2 + 4} l 4 14 M${x + s * 0.68 + 16} ${n + s * 1.2 + 7} l 3 13 M${x + s * 0.68 + 26} ${n + s * 1.2 + 9} l 2 12" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
        <rect x="${x - 10}" y="${n - 15}" width="${s + 20}" height="30" rx="13" fill="#3fd6a8" stroke="${INK}" stroke-width="4"/>
        <clipPath id="sc${uid}"><rect x="${x - 10}" y="${n - 15}" width="${s + 20}" height="30" rx="13"/></clipPath><g clip-path="url(#sc${uid})" opacity=".55">${st}</g>
        <rect x="${x - 10}" y="${n - 15}" width="${s + 20}" height="30" rx="13" fill="none" stroke="${INK}" stroke-width="4"/>
        ${star(x + s - 14, y + 14, 13, '#ffe066')}</g>`;
    },
    // a big ribbon bow on top and a sash on the stem
    tessa(x, y, s) {
      const cx = x + s * 1.5, t = y - 4;
      return `<g><path d="M${x + s} ${y + s * 1.25} L${x + s * 2} ${y + s * 1.55}" stroke="#ff7ad9" stroke-width="15" stroke-linecap="round"/><path d="M${x + s} ${y + s * 1.25} L${x + s * 2} ${y + s * 1.55}" stroke="${INK}" stroke-width="3" opacity=".25"/>
        <path d="M${cx} ${t} C ${cx - 26} ${t - 40}, ${cx - 62} ${t - 22}, ${cx - 52} ${t + 6} C ${cx - 44} ${t + 22}, ${cx - 18} ${t + 10}, ${cx} ${t}Z" fill="#ff5fb3" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M${cx} ${t} C ${cx + 26} ${t - 40}, ${cx + 62} ${t - 22}, ${cx + 52} ${t + 6} C ${cx + 44} ${t + 22}, ${cx + 18} ${t + 10}, ${cx} ${t}Z" fill="#ff5fb3" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M${cx - 40} ${t - 8} q 14 -6 28 4 M${cx + 40} ${t - 8} q -14 -6 -28 4" stroke="#fff" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/>
        <path d="M${cx - 6} ${t + 6} l -16 30 l 10 -2 l 4 9 z M${cx + 6} ${t + 6} l 16 30 l -10 -2 l -4 9z" fill="#e03f97" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
        <rect x="${cx - 11}" y="${t - 11}" width="22" height="22" rx="7" fill="#ff8ccb" stroke="${INK}" stroke-width="4"/></g>`;
    },
    // a sprout growing out of the top and a baker's apron
    otto(x, y, s) {
      const cx = x + s;
      return `<g><path d="M${cx} ${y - 2} q -4 -26 4 -40" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${cx} ${y - 2} q -4 -26 4 -40" stroke="#5fc04a" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M${cx + 3} ${y - 36} c -10 -22 -38 -24 -46 -10 c 14 12 34 16 46 10z" fill="#7be05f" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M${cx + 4} ${y - 30} c 10 -24 40 -24 46 -8 c -14 12 -36 14 -46 8z" fill="#5fc04a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M${x + 22} ${y + s * 0.92} h ${s * 2 - 44} v ${s * 1.0} q 0 10 -10 10 h ${-(s * 2 - 64)} q -10 0 -10 -10z" fill="#fffaf0" stroke="${INK}" stroke-width="4"/>
        <path d="M${x + 22} ${y + s * 0.98} q -30 -16 -26 -${s * 0.6} M${x + s * 2 - 22} ${y + s * 0.98} q 30 -16 26 -${s * 0.6}" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <rect x="${cx - 22}" y="${y + s * 1.3}" width="44" height="30" rx="6" fill="#ffe7b0" stroke="${INK}" stroke-width="3.5"/>
        <path d="M${cx - 8} ${y + s * 1.3 + 13} q 8 -9 16 0 q -8 10 -16 0z" fill="#ff8a5c" opacity=".8"/></g>`;
    },
    // a knotted bandana with tails and a plaster on the lower block
    zed(x, y, s) {
      const hx = x + s, hy = y;
      return `<g><path d="M${hx - 8} ${hy + 16} q ${s / 2 + 8} -14 ${s + 16} 0 v 22 q -${s / 2 + 8} -12 -${s + 16} 0z" fill="#2a2a3a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M${hx + 2} ${hy + 24} h ${s - 6}" stroke="#ff4d6a" stroke-width="3" stroke-dasharray="6 6" opacity=".9"/>
        <path d="M${hx + s + 6} ${hy + 22} l 30 -14 l -4 18 z M${hx + s + 6} ${hy + 28} l 34 10 l -16 10 z" fill="#2a2a3a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <g transform="rotate(-28 ${x + s * 0.5} ${y + s * 2.45})"><rect x="${x + s * 0.5 - 26}" y="${y + s * 2.45 - 10}" width="52" height="20" rx="7" fill="#ffd9b0" stroke="${INK}" stroke-width="3.5"/><rect x="${x + s * 0.5 - 8}" y="${y + s * 2.45 - 10}" width="16" height="20" fill="#f2c08e"/>
        <circle cx="${x + s * 0.5 - 4}" cy="${y + s * 2.45 - 3}" r="1.6" fill="${INK}" opacity=".4"/><circle cx="${x + s * 0.5 + 4}" cy="${y + s * 2.45 + 3}" r="1.6" fill="${INK}" opacity=".4"/></g></g>`;
    },
    // a beret and a club armband
    elle(x, y, s) {
      const by = y - s * 0.3;
      return `<g><ellipse cx="${x + s * 0.6}" cy="${by}" rx="${s * 0.66}" ry="19" fill="#b0213f" stroke="${INK}" stroke-width="4" transform="rotate(-10 ${x + s / 2} ${by})"/>
        <rect x="${x + s * 0.56}" y="${by - 28}" width="9" height="14" rx="3" fill="#b0213f" stroke="${INK}" stroke-width="3.5"/>
        <path d="M${x + 8} ${by - 4} q ${s * 0.4} -16 ${s * 0.86} -10" stroke="#fff" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/>
        <rect x="${x - 8}" y="${y + s * 1.3}" width="${s + 16}" height="24" rx="6" fill="#ffd23b" stroke="${INK}" stroke-width="4"/>
        <path d="M${x + s / 2 - 10} ${y + s * 1.3 + 12} l 6 6 l 14 -12" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    },
    // headphones round the head block
    jay(x, y, s) {
      const hx = x + s;
      return `<g><path d="M${hx - 4} ${y + s * 0.55} C ${hx - 6} ${y - 30}, ${hx + s + 6} ${y - 30}, ${hx + s + 4} ${y + s * 0.55}" stroke="${INK}" stroke-width="13" fill="none" stroke-linecap="round"/>
        <path d="M${hx - 4} ${y + s * 0.55} C ${hx - 6} ${y - 30}, ${hx + s + 6} ${y - 30}, ${hx + s + 4} ${y + s * 0.55}" stroke="#ffe066" stroke-width="6" fill="none" stroke-linecap="round"/>
        <rect x="${hx - 18}" y="${y + s * 0.34}" width="24" height="36" rx="10" fill="#ffe066" stroke="${INK}" stroke-width="4"/>
        <rect x="${hx + s - 6}" y="${y + s * 0.34}" width="24" height="36" rx="10" fill="#ffe066" stroke="${INK}" stroke-width="4"/></g>`;
    },
    // a sweatband
    sasha(x, y, s) {
      return `<g><rect x="${x - 7}" y="${y + 12}" width="${s + 14}" height="20" rx="8" fill="#fff" stroke="${INK}" stroke-width="4"/><rect x="${x - 4}" y="${y + 19}" width="${s + 8}" height="6" fill="#2ccf5e"/></g>`;
    },
    mono(x, y, s) {
      return `<g>${heart(x + s - 14, y + 10, 13, '#ff4f8b')}</g>`;
    },
  };

  // ---------- small drawn shapes ----------
  function star(cx, cy, r, col, sw) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.46 : r; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); }
    return `<path d="${d}Z" fill="${col}" stroke="${INK}" stroke-width="${sw || 3.5}" stroke-linejoin="round"/>`;
  }
  function heart(cx, cy, r, col, sw) {
    return `<path d="M${cx} ${cy + r * 0.9} C ${cx - r * 1.6} ${cy - r * 0.1}, ${cx - r * 0.9} ${cy - r * 1.3}, ${cx} ${cy - r * 0.45} C ${cx + r * 0.9} ${cy - r * 1.3}, ${cx + r * 1.6} ${cy - r * 0.1}, ${cx} ${cy + r * 0.9}Z" fill="${col}" stroke="${INK}" stroke-width="${sw === undefined ? 3.5 : sw}" stroke-linejoin="round"/>`;
  }
  const twinkle = (cx, cy, r, col) => `<path d="M${cx} ${cy - r} Q ${cx + r * 0.18} ${cy - r * 0.18} ${cx + r} ${cy} Q ${cx + r * 0.18} ${cy + r * 0.18} ${cx} ${cy + r} Q ${cx - r * 0.18} ${cy + r * 0.18} ${cx - r} ${cy} Q ${cx - r * 0.18} ${cy - r * 0.18} ${cx} ${cy - r}Z" fill="${col || '#fff6b0'}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  Art.star = star; Art.heart = heart; Art.twinkle = twinkle;

  // ---------- feelings ----------
  // each mark is placed from the head block's box (x, y, w, h); classes are animated by dating.css
  const MARK = {
    blush(x, y, w, h, gid) {
      const one = (cx) => `<ellipse cx="${cx}" cy="${y + h * 0.68}" rx="${Math.min(19, w * 0.2)}" ry="10" fill="${gid ? `url(#${gid}b)` : '#ff4f86'}" opacity="${gid ? 1 : 0.5}"/>`
        + [-7, 0, 7].map((d) => `<path d="M${cx + d - 3} ${y + h * 0.68 + 5} l 6 -10" stroke="#e8326a" stroke-width="2.6" stroke-linecap="round"/>`).join('');
      return `<g class="em-blush">${one(x + w * 0.25)}${one(x + w * 0.75)}</g>`;
    },
    anger(x, y, w) {
      const cx = x + w - 4, cy = y + 2, arm = `<path d="M4 -17 Q 4 -4 17 -4" stroke="#ff2d4a" stroke-width="6.5" fill="none" stroke-linecap="round"/>`;
      return `<g class="em-pop" style="transform-origin:${cx}px ${cy}px"><g transform="translate(${cx} ${cy})"><circle r="22" fill="#fff" opacity=".9" stroke="${INK}" stroke-width="3"/>${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a})">${arm}</g>`).join('')}</g></g>`;
    },
    sweat(x, y, w) {
      const cx = x + w + 8, cy = y + 18;
      return `<g class="em-drip"><path d="M${cx} ${cy - 20} C ${cx + 11} ${cy - 4}, ${cx + 13} ${cy + 6}, ${cx} ${cy + 12} C ${cx - 13} ${cy + 6}, ${cx - 11} ${cy - 4}, ${cx} ${cy - 20}Z" fill="#8fdcff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M${cx - 4} ${cy - 2} q -2 6 2 9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
    },
    tear(x, y, w, h) {
      const d = (cx, dl) => `<g class="em-fall" style="animation-delay:${dl}s"><path d="M${cx} ${y + h * 0.62} C ${cx + 6} ${y + h * 0.72}, ${cx + 7} ${y + h * 0.78}, ${cx} ${y + h * 0.82} C ${cx - 7} ${y + h * 0.78}, ${cx - 6} ${y + h * 0.72}, ${cx} ${y + h * 0.62}Z" fill="#8fdcff" stroke="${INK}" stroke-width="2.5"/></g>`;
      return `<g>${d(x + w * 0.22, 0)}${d(x + w * 0.78, 0.5)}</g>`;
    },
    sparkle(x, y, w) {
      return `<g class="em-twinkle">${twinkle(x - 12, y + 6, 13)}${twinkle(x + w + 14, y - 8, 10, '#fff')}${twinkle(x + w + 4, y + 34, 7)}</g>`;
    },
    hearts(x, y, w) {
      return `<g>${[[x + w * 0.2, 0, 13], [x + w * 0.85, 0.7, 10], [x + w * 0.5, 1.3, 8]].map(([cx, dl, r]) => `<g class="em-rise" style="animation-delay:${dl}s">${heart(cx, y - 14, r, '#ff4f8b', 3)}</g>`).join('')}</g>`;
    },
    question(x, y, w) {
      const cx = x + w + 10, cy = y - 18;
      return `<g class="em-pop" style="transform-origin:${cx}px ${cy}px"><path d="M${cx - 12} ${cy - 8} q 0 -18 14 -18 q 16 0 14 16 q -2 10 -12 14 q -4 2 -4 10" stroke="${INK}" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${cx - 12} ${cy - 8} q 0 -18 14 -18 q 16 0 14 16 q -2 10 -12 14 q -4 2 -4 10" stroke="#ffe066" stroke-width="6.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${cx - 2}" cy="${cy + 28}" r="7" fill="#ffe066" stroke="${INK}" stroke-width="3.5"/></g>`;
    },
    exclaim(x, y, w) {
      const cx = x + w + 8, cy = y - 20;
      return `<g class="em-pop" style="transform-origin:${cx}px ${cy}px">${[-50, -20, 10].map((a) => `<path d="M${cx + 30 * Math.cos((a * Math.PI) / 180) * 0.9} ${cy + 30 * Math.sin((a * Math.PI) / 180)} l ${14 * Math.cos((a * Math.PI) / 180)} ${14 * Math.sin((a * Math.PI) / 180)}" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`).join('')}<path d="M${cx - 8} ${cy - 26} h 16 l -4 34 h -8z" fill="#ff5c5c" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy + 20}" r="7" fill="#ff5c5c" stroke="${INK}" stroke-width="3.5"/></g>`;
    },
    gloom(x, y, w, h) {
      let l = '';
      for (let i = 0; i < 4; i++) { const lx = x + w * (0.15 + i * 0.23); l += `<path d="M${lx} ${y + 6} q 5 ${h * 0.12} 0 ${h * 0.24} q -5 ${h * 0.12} 0 ${h * 0.24}" stroke="#4a3a8a" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".75"/>`; }
      return `<g class="em-gloom"><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h * 0.55}" rx="10" fill="#3a2a70" opacity=".28"/>${l}</g>`;
    },
    steam(x, y, w) {
      const puff = (cx, cy, r, dl) => `<g class="em-steam" style="animation-delay:${dl}s"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="${cx + r * 0.8}" cy="${cy + 2}" r="${r * 0.75}" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="${cx + r * 0.3}" cy="${cy + 3}" r="${r * 0.7}" fill="#fff"/></g>`;
      return `<g>${puff(x + 6, y - 14, 11, 0)}${puff(x + w - 18, y - 22, 9, 0.5)}</g>`;
    },
    note(x, y, w) {
      const cx = x + w + 12, cy = y - 6;
      return `<g class="em-rise"><path d="M${cx} ${cy} v -34 l 18 6 v 8 l -14 -4 v 24" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><ellipse cx="${cx - 7}" cy="${cy + 2}" rx="10" ry="7" fill="#b25cff" stroke="${INK}" stroke-width="3.5" transform="rotate(-20 ${cx - 7} ${cy + 2})"/></g>`;
    },
    zzz(x, y, w) {
      const z = (cx, cy, s, dl) => `<path class="em-rise" style="animation-delay:${dl}s" d="M${cx} ${cy} h ${s} l ${-s} ${s} h ${s}" stroke="#7a8cff" stroke-width="${s / 4}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      return `<g>${z(x + w + 2, y + 6, 16, 0)}${z(x + w + 20, y - 18, 12, 0.6)}${z(x + w + 34, y - 36, 9, 1.2)}</g>`;
    },
    dots(x, y, w) {
      const cx = x + w + 16, cy = y - 22;
      return `<g class="em-pop" style="transform-origin:${cx}px ${cy}px"><path d="M${cx - 34} ${cy - 18} h 68 q 10 0 10 10 v 20 q 0 10 -10 10 h -44 l -14 12 l 2 -12 h -12 q -10 0 -10 -10 v -20 q 0 -10 10 -10z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>${[-16, 0, 16].map((d, i) => `<circle class="em-blink" style="animation-delay:${i * 0.2}s" cx="${cx + d}" cy="${cy + 2}" r="5" fill="${INK}"/>`).join('')}</g>`;
    },
    burst(x, y, w, h) {
      const cx = x + w / 2, cy = y + h / 2;
      let l = '';
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.2, r0 = Math.max(w, h) * 0.75, r1 = r0 + 20; l += `<path d="M${cx + r0 * Math.cos(a)} ${cy + r0 * Math.sin(a)} L ${cx + r1 * Math.cos(a)} ${cy + r1 * Math.sin(a)}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`; }
      return `<g class="em-pop" style="transform-origin:${cx}px ${cy}px">${l}</g>`;
    },
    flowers(x, y, w) {
      const fl = (cx, cy, r, c) => `<g>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${cx + r * Math.cos((a * Math.PI) / 180)}" cy="${cy + r * Math.sin((a * Math.PI) / 180)}" r="${r * 0.75}" fill="${c}" stroke="${INK}" stroke-width="2.5"/>`).join('')}<circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="#ffe066" stroke="${INK}" stroke-width="2.5"/></g>`;
      return `<g class="em-twinkle">${fl(x - 16, y + 10, 9, '#ffb3d6')}${fl(x + w + 16, y - 4, 7, '#fff')}${fl(x + w + 6, y + 40, 6, '#ffb3d6')}</g>`;
    },
  };
  // mood -> marks and the pose the stylesheet plays
  const MOODS = {
    neutral: [[], ''], happy: [['sparkle'], 'bounce'], laugh: [['sparkle', 'note'], 'bounce'], blush: [['blush'], 'sway'],
    love: [['blush', 'hearts'], 'sway'], angry: [['anger'], 'shake'], pout: [['anger', 'blush'], 'tilt'], sweat: [['sweat'], ''],
    nervous: [['sweat', 'blush'], 'jitter'], sad: [['tear'], 'droop'], gloom: [['gloom'], 'droop'], shock: [['exclaim', 'burst'], 'jump'],
    confused: [['question'], 'tilt'], smug: [['sparkle'], 'tiltr'], sleepy: [['zzz'], 'droop'], think: [['dots'], ''],
    flustered: [['blush', 'steam', 'sweat'], 'jitter'], warm: [['blush', 'flowers'], 'sway'], determined: [['sparkle', 'burst'], 'jump'],
  };
  Art.MOODS = MOODS;
  Art.pose = (mood) => (MOODS[mood] || MOODS.neutral)[1];

  // the full character: a piece standing in a 380 x 480 frame, bottom centred
  Art.W = 380; Art.H = 480;
  Art.char = function (id, mood, opts) {
    const c = CAST[id], o = opts || {}, s = o.size || U;
    const cols = Math.max(...c.cells.map((p) => p[0])) + 1, rows = Math.max(...c.cells.map((p) => p[1])) + 1;
    const dd = s * DEPTH, ox = (Art.W - cols * s - dd) / 2, oy = Art.H - 16 - rows * s;
    const gid = 'dg' + ++uid;
    const b = blocks(c.cells, c.color, ox, oy, s, gid);
    const hx = ox + c.head[0] * s, hy = oy + c.head[1] * s, hw = s * (c.headW || 1);
    const marks = (MOODS[mood] || MOODS.neutral)[0].map((k) => MARK[k](hx, hy, hw, s, gid)).join('');
    const acc = ACC[id] ? ACC[id](ox, oy, s) : '';
    const sp = HAIR[id] && HAIR[id].span, hr = (sp ? hair(id, ox + sp[0] * s, hy, sp[1] * s, s, dd) : hair(id, hx, hy, hw, s, dd)) || { behind: '', front: '' };
    const shadow = `<ellipse cx="${ox + (cols * s + dd) / 2}" cy="${Art.H - 14}" rx="${(cols * s + dd) * 0.62}" ry="13" fill="url(#${gid}g)"/>`;
    const defs = b.defs + `<radialGradient id="${gid}g"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".6" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`
      + `<radialGradient id="${gid}b"><stop offset="0" stop-color="#ff3d7a" stop-opacity=".75"/><stop offset=".7" stop-color="#ff5c8f" stop-opacity=".35"/><stop offset="1" stop-color="#ff7aa5" stop-opacity="0"/></radialGradient>`;
    // fit: crop to the piece with room for its marks (cards and badges), so small pieces aren't lost in the frame
    const vb = o.fit ? `${ox - 70} ${oy - 80 - dd} ${cols * s + dd + 140} ${rows * s + dd + 98}` : `0 0 ${Art.W} ${Art.H}`;
    return `<svg class="dg-char-svg" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>${shadow}<g class="dg-body">${hr.behind}${b.body}${hr.front}${acc}</g><g class="dg-marks">${marks}</g></svg>`;
  };
  // a small badge of the whole piece for name plates, the route picker and the ending card
  Art.badge = function (id) {
    const c = CAST[id], s = 40;
    const cols = Math.max(...c.cells.map((p) => p[0])) + 1, rows = Math.max(...c.cells.map((p) => p[1])) + 1;
    const dd = s * DEPTH, W = Math.max(cols, rows) * s + dd + 24, gid = 'db' + ++uid;
    const bx = (W - cols * s - dd) / 2, by = (W - rows * s + dd) / 2;
    const b = blocks(c.cells, c.color, bx, by, s, gid), sp = HAIR[id] && HAIR[id].span, hr = hair(id, bx + (sp ? sp[0] : c.head[0]) * s, by + c.head[1] * s, s * (sp ? sp[1] : c.headW || 1), s, dd) || { behind: '', front: '' };
    return `<svg viewBox="0 0 ${W} ${W}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${b.defs}</defs>${hr.behind}${b.body}${hr.front}</svg>`;
  };

  // ---------- UI glyphs (no emoji anywhere) ----------
  const G = (inner, vb) => `<svg viewBox="${vb || '0 0 24 24'}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="dg-ico">${inner}</svg>`;
  const SW = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
  Art.ICONS = {
    close: G(`<path d="M6 6l12 12M18 6L6 18" ${SW}/>`),
    log: G(`<path d="M5 4h11l3 3v13H5z" ${SW}/><path d="M8 10h8M8 14h8M8 18h5" ${SW}/>`),
    auto: G(`<path d="M7 5l11 7-11 7z" fill="currentColor"/>`),
    autoOn: G(`<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>`),
    skip: G(`<path d="M4 5l8 7-8 7zM12 5l8 7-8 7z" fill="currentColor"/>`),
    back: G(`<path d="M15 5l-7 7 7 7" ${SW}/>`),
    next: G(`<path d="M9 5l7 7-7 7" ${SW}/>`),
    home: G(`<path d="M4 11l8-7 8 7M6 10v10h12V10" ${SW}/>`),
    heart: G(`<path d="M12 20C5 15 3 11.5 3 8.5 3 6 5 4 7.5 4c1.8 0 3.3 1 4.5 2.6C13.2 5 14.7 4 16.5 4 19 4 21 6 21 8.5c0 3-2 6.5-9 11.5z" fill="currentColor"/>`),
    heartOff: G(`<path d="M12 20C5 15 3 11.5 3 8.5 3 6 5 4 7.5 4c1.8 0 3.3 1 4.5 2.6C13.2 5 14.7 4 16.5 4 19 4 21 6 21 8.5c0 3-2 6.5-9 11.5z" ${SW}/>`),
    lock: G(`<rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 018 0v3" ${SW}/>`),
    star: G(`<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z" fill="currentColor"/>`),
    style: G(`<path d="M12 20C5 15 3 11.5 3 8.5 3 6 5 4 7.5 4c1.8 0 3.3 1 4.5 2.6C13.2 5 14.7 4 16.5 4 19 4 21 6 21 8.5c0 3-2 6.5-9 11.5z" ${SW}/><path d="M9 10.5l2 2 4-4" ${SW}/>`),
    caret: G(`<path d="M5 9l7 7 7-7z" fill="currentColor"/>`),
  };

  // ---------- scenes (1600 x 1000, cropped to fit the screen) ----------
  // Painted like an anime background: real one-point perspective, towering clouds lit from one side,
  // haze in the distance, light falling through windows. Each scene is drawn for day, dusk or night;
  // at dusk and night the world's colours are pulled toward the hour, while lamps and windows stay bright.
  const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const f1 = (v) => (+v).toFixed(1);
  const TIMES = {
    day: { sky: ['#2f7ad8', '#6fb2f0', '#b9dcfa', '#f6efe0'], lit: '#ffffff', cshade: '#a9bde4', crim: '#fffdf4', haze: '#cfe2f6', light: '#fff3cc', shadow: '#4c5f9c', tone: null, k: 0, glow: 0 },
    dusk: { sky: ['#283a88', '#7d58a8', '#ec8577', '#ffcd8a'], lit: '#ffd2a2', cshade: '#93598f', crim: '#fff0c4', haze: '#eeae9a', light: '#ffb070', shadow: '#4a2f6a', tone: '#d77468', k: 0.22, glow: 0.55 },
    night: { sky: ['#050920', '#0e1646', '#1f2566', '#36377a'], lit: '#4a5894', cshade: '#1e2352', crim: '#7f90d0', haze: '#232a5e', light: '#a9b8ff', shadow: '#0a0e2c', tone: '#161c4c', k: 0.64, glow: 1 },
  };
  function timeOf(t) {
    const T = Object.assign({ id: TIMES[t] ? t : 'day' }, TIMES[t] || TIMES.day);
    T.c = T.tone ? (col) => mix(col, T.tone, T.k) : (col) => col;
    return T;
  }
  const lg = (id, cols, x2, y2) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2 === undefined ? 0 : x2}" y2="${y2 === undefined ? 1 : y2}">${cols.map((c, i) => (Array.isArray(c) ? `<stop offset="${c[0]}" stop-color="${c[1]}" stop-opacity="${c[2] === undefined ? 1 : c[2]}"/>` : `<stop offset="${(i / (cols.length - 1)).toFixed(3)}" stop-color="${c}"/>`)).join('')}</linearGradient>`;
  const rg = (id, stops) => `<radialGradient id="${id}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a === undefined ? 1 : a}"/>`).join('')}</radialGradient>`;
  const glow = (q, x, y, r, col, a, ry) => { const id = q + 'g' + ++uid; return `<defs>${rg(id, [[0, col, a], [0.3, col, a * 0.5], [1, col, 0]])}</defs><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(ry || r)}" fill="url(#${id})"/>`; };
  const skyFill = (q, T, h, cols) => `<defs>${lg(q + 'sky', cols || T.sky)}</defs><rect width="1600" height="${h || 1000}" fill="url(#${q}sky)"/>`;
  function starField(n, seed, h, x0, w) {
    const r = rnd(seed);
    let o = '';
    for (let i = 0; i < n; i++) { const x = (x0 || 0) + r() * (w || 1600), y = r() * (h || 600), s = r() * 2 + 0.5; o += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${s.toFixed(1)}" fill="#fff" opacity="${(0.35 + r() * 0.65).toFixed(2)}"/>`; }
    return o;
  }
  // sun with rays by day, a low swollen sun at dusk, the moon and stars at night
  function heavens(q, T, x, y, hz) {
    if (T.id === 'night') return starField(160, 31, hz || 600) + glow(q, x, y, 260, '#9fb2ff', 0.32) + `<circle cx="${x}" cy="${y}" r="40" fill="#fff6dc"/><circle cx="${x - 12}" cy="${y - 8}" r="8" fill="#ebe0c0"/><circle cx="${x + 14}" cy="${y + 10}" r="6" fill="#ebe0c0"/><circle cx="${x + 6}" cy="${y - 18}" r="4" fill="#ebe0c0"/>`;
    if (T.id === 'dusk') return glow(q, x, (hz || 600) - 40, 520, '#ffcf8a', 0.75, 300) + `<circle cx="${x}" cy="${(hz || 600) - 50}" r="70" fill="#fff0c8"/>`;
    let rays = '';
    for (let i = 0; i < 9; i++) { const a = 0.15 + i * 0.17, a2 = a + 0.045; rays += `<path d="M${x} ${y} L${f1(x + Math.cos(a) * 1500)} ${f1(y + Math.sin(a) * 1500)} L${f1(x + Math.cos(a2) * 1500)} ${f1(y + Math.sin(a2) * 1500)}Z" fill="#fffbe6" opacity=".07"/>`; }
    return rays + glow(q, x, y, 380, '#fffbe6', 0.85) + `<circle cx="${x}" cy="${y}" r="46" fill="#fffef6"/>`;
  }
  // a cumulus heap: shaded underside, sunlit dome, bright rims; tiers stack into a summer thunderhead
  function cumulus(x, y, w, T, seed, tiers) {
    const r = rnd(seed), pts = [];
    for (let t = 0; t < (tiers || 1); t++) {
      const tw = w * (1 - t * 0.3), ty = y - t * w * 0.2, n = 6 + Math.floor(tw / 70);
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1), cx = x + (u - 0.5) * tw + (r() - 0.5) * tw * 0.05, dome = Math.sin(u * Math.PI);
        const rr = tw * (0.07 + 0.09 * dome) * (0.8 + r() * 0.4);
        pts.push([cx, ty - dome * tw * 0.1 - rr * 0.25, rr]);
      }
    }
    let sh = '', lt = '', hl = '';
    for (const [cx, cy, rr] of pts) sh += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}"/>`;
    for (const [cx, cy, rr] of pts) lt += `<circle cx="${f1(cx - rr * 0.14)}" cy="${f1(cy - rr * 0.22)}" r="${f1(rr * 0.84)}"/>`;
    for (const [cx, cy, rr] of pts) hl += `<circle cx="${f1(cx - rr * 0.32)}" cy="${f1(cy - rr * 0.46)}" r="${f1(rr * 0.4)}"/>`;
    return `<g><g fill="${T.cshade}">${sh}<rect x="${f1(x - w * 0.52)}" y="${f1(y - 8)}" width="${f1(w * 1.04)}" height="16" rx="8"/></g><g fill="${T.lit}">${lt}</g><g fill="${T.crim}" opacity=".75">${hl}</g></g>`;
  }
  // thin streaks of high cloud
  const streaks = (T, y, seed) => { const r = rnd(seed); let o = ''; for (let i = 0; i < 6; i++) o += `<rect x="${f1(r() * 1400 - 100)}" y="${f1(y + r() * 120)}" width="${f1(200 + r() * 400)}" height="${f1(4 + r() * 6)}" rx="5" fill="${T.lit}" opacity="${(0.25 + r() * 0.3).toFixed(2)}"/>`; return o; };
  // a city far off: pale blocks under the haze, windows lit after dark
  function skyline(T, y, seed, col, hMul) {
    const r = rnd(seed);
    let o = '', lights = '', x = -20;
    while (x < 1620) {
      const w = 26 + r() * 70, hh = (hMul || 1) * (18 + r() * 85 + (r() < 0.1 ? 80 : 0));
      o += `<rect x="${f1(x)}" y="${f1(y - hh)}" width="${f1(w)}" height="${f1(hh + 2)}"/>`;
      if (T.glow) for (let k = 0; k < hh / 9; k++) if (r() < 0.35 * T.glow) lights += `<rect x="${f1(x + 3 + r() * (w - 8))}" y="${f1(y - hh + 4 + k * 9)}" width="3" height="3" fill="#ffe7a0" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
      x += w + r() * 5;
    }
    return `<g fill="${col}">${o}</g>${lights}`;
  }
  const hazeBand = (q, T, y, h, a) => `<defs>${lg(q + 'hz' + y, [[0, T.haze, 0], [0.6, T.haze, a || 0.75], [1, T.haze, 0]])}</defs><rect x="0" y="${y - h / 2}" width="1600" height="${h}" fill="url(#${q}hz${y})"/>`;
  // one-point projection: X across, Y up, Z away from the viewer (metres); h is the eye height
  function cam(cx, hy, fl, h) {
    const P = (X, Y, Z) => [cx + (X * fl) / Z, hy + ((h - Y) * fl) / Z];
    const pts = (arr) => arr.map(([X, Y, Z]) => P(X, Y, Z).map(f1).join(',')).join(' ');
    const poly = (arr, fill, extra) => `<polygon points="${pts(arr)}" fill="${fill}" ${extra || ''}/>`;
    const floor = (X0, X1, Z0, Z1, fill, Y) => poly([[X0, Y || 0, Z0], [X1, Y || 0, Z0], [X1, Y || 0, Z1], [X0, Y || 0, Z1]], fill);
    const wallX = (X, Y0, Y1, Z0, Z1, fill, extra) => poly([[X, Y0, Z0], [X, Y1, Z0], [X, Y1, Z1], [X, Y0, Z1]], fill, extra);
    const wallZ = (Z, X0, X1, Y0, Y1, fill, extra) => poly([[X0, Y0, Z], [X1, Y0, Z], [X1, Y1, Z], [X0, Y1, Z]], fill, extra);
    // a box: the near face, the side facing the middle, and the top or underside when it shows
    const box = (X0, X1, Y0, Y1, Z0, Z1, col, lit) => {
      let o = '';
      if (X1 < 0) o += wallX(X1, Y0, Y1, Z0, Z1, shade(col, lit === 'r' ? 0.1 : -0.18));
      if (X0 > 0) o += wallX(X0, Y0, Y1, Z0, Z1, shade(col, lit === 'r' ? -0.22 : -0.08));
      if (Y1 < h) o += floor(X0, X1, Z0, Z1, shade(col, 0.16), Y1);
      if (Y0 > h) o += floor(X0, X1, Z0, Z1, shade(col, -0.3), Y0);
      return o + wallZ(Z0, X0, X1, Y0, Y1, col);
    };
    const line = (a, b, col, w, extra) => { const A = P(...a), B = P(...b); return `<path d="M${f1(A[0])} ${f1(A[1])} L${f1(B[0])} ${f1(B[1])}" stroke="${col}" stroke-width="${w}" ${extra || ''}/>`; };
    return { P, pts, poly, floor, wallX, wallZ, box, line, h, fl, cx, hy };
  }
  // leaf masses, dark below and sunlit on top, with a scatter of bright leaves at the edge
  function foliage(x, y, r, T, seed, base) {
    const R = rnd(seed), g = T.c(base || '#3f8f4e');
    let d = '', m = '', l = '';
    for (let i = 0; i < 9; i++) {
      const a = R() * Math.PI * 2, dd = R() * r * 0.6, cx = x + Math.cos(a) * dd, cy = y + Math.sin(a) * dd * 0.7, rr = r * (0.38 + R() * 0.25);
      d += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}"/>`;
      m += `<circle cx="${f1(cx - rr * 0.15)}" cy="${f1(cy - rr * 0.25)}" r="${f1(rr * 0.78)}"/>`;
      l += `<circle cx="${f1(cx - rr * 0.35)}" cy="${f1(cy - rr * 0.45)}" r="${f1(rr * 0.36)}"/>`;
    }
    let sp = '';
    for (let i = 0; i < 14; i++) { const a = R() * Math.PI * 2; sp += `<ellipse cx="${f1(x + Math.cos(a) * r * 0.95)}" cy="${f1(y + Math.sin(a) * r * 0.75)}" rx="${f1(r * 0.06)}" ry="${f1(r * 0.035)}" transform="rotate(${(a * 57).toFixed(0)} ${f1(x + Math.cos(a) * r * 0.95)} ${f1(y + Math.sin(a) * r * 0.75)})"/>`; }
    return `<g fill="${shade(g, -0.35)}">${d}${sp}</g><g fill="${g}">${m}</g><g fill="${shade(g, 0.28)}" opacity=".85">${l}</g>`;
  }
  // a branch reaching in from a corner of the frame, the classic anime framing
  function branch(T, corner, seed, base) {
    const g = T.c(base || '#2f7a44'), R = rnd(seed), right = corner === 'tr';
    const sx = right ? 1640 : -40;
    let o = `<path d="M${sx} -20 Q ${right ? 1420 : 180} 90 ${right ? 1230 : 370} 70" stroke="${T.c('#4a3426')}" stroke-width="18" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < 3; i++) o += foliage(right ? 1560 - i * 130 - R() * 30 : 40 + i * 130 + R() * 30, 20 + R() * 60 + i * 15, 140 - i * 22, T, seed + i, base);
    return `<g>${o}</g>`;
  }
  const petals = (n, seed, col, x0, y0, w, h) => { const r = rnd(seed); let o = ''; for (let i = 0; i < n; i++) { const x = x0 + r() * w, y = y0 + r() * h, a = r() * 180, s = 4 + r() * 5; o += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(s)}" ry="${f1(s * 0.55)}" fill="${col}" opacity="${(0.65 + r() * 0.35).toFixed(2)}" transform="rotate(${a.toFixed(0)} ${f1(x)} ${f1(y)})"/>`; } return o; };
  const motes = (n, seed, x0, y0, w, h, col) => { const r = rnd(seed); let o = ''; for (let i = 0; i < n; i++) o += `<circle cx="${f1(x0 + r() * w)}" cy="${f1(y0 + r() * h)}" r="${f1(1 + r() * 2.2)}" fill="${col || '#fff8dc'}" opacity="${(0.3 + r() * 0.5).toFixed(2)}"/>`; return o; };
  const bokeh = (n, seed, cols, x0, y0, w, h, rmax) => { const r = rnd(seed); let o = ''; for (let i = 0; i < n; i++) { const c = cols[i % cols.length], rr = 8 + r() * (rmax || 30); o += `<circle cx="${f1(x0 + r() * w)}" cy="${f1(y0 + r() * h)}" r="${f1(rr)}" fill="${c}" opacity="${(0.12 + r() * 0.25).toFixed(2)}"/><circle cx="${f1(x0 + r() * w)}" cy="${f1(y0 + r() * h)}" r="${f1(rr * 0.5)}" fill="${c}" opacity=".08"/>`; } return o; };
  // a soft light layer over the whole scene (warm sun, dusk glow or blue moonlight)
  function wash(q, T, from) {
    const col = T.id === 'night' ? '#6f7fd8' : T.id === 'dusk' ? '#ff9a5a' : '#fff1c0', a = T.id === 'night' ? 0.12 : T.id === 'dusk' ? 0.28 : 0.2;
    const x2 = from === 'right' ? 0 : 1, x1 = 1 - x2;
    return `<defs><linearGradient id="${q}wash" x1="${x1}" y1="0" x2="${x2}" y2="1"><stop offset="0" stop-color="${col}" stop-opacity="${a}"/><stop offset=".6" stop-color="${col}" stop-opacity="0"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#${q}wash)"/>`;
  }
  // the sky as seen through a window (clouds by day, the moon at night), clipped to the pane
  function windowSky(q, T, x, y, w, h, seed) {
    const id = q + 'wc' + ++uid;
    const inner = `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="url(#${q}sky)"/>`
      + (T.id === 'night' ? starField(14, seed, h, x, w).replace(/cy="(\d+)"/g, (m0, v) => `cy="${f1(y + (+v % Math.max(1, h)))}"`) : cumulus(x + w * 0.5, y + h * 0.75, w * 0.9, T, seed, 1));
    return `<defs><clipPath id="${id}"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}"/></clipPath></defs><g clip-path="url(#${id})">${inner}</g>`;
  }

  const BG = {
    black: () => `<rect width="1600" height="1000" fill="#0b0710"/>`,
    white: () => `<rect width="1600" height="1000" fill="#fff8fc"/>`,

    // a quiet residential street in the morning: block walls, tiled roofs, power lines overhead
    town(T, q) {
      const C = cam(820, 560, 700, 1.6), c = T.c;
      let o = skyFill(q, T, 640) + heavens(q, T, 250, 150) + streaks(T, 120, 4)
        + cumulus(1200, 520, 760, T, 3, 3) + cumulus(330, 470, 420, T, 8, 2)
        + skyline(T, 568, 4, mix(c('#87a6cf'), T.haze, 0.45)) + hazeBand(q, T, 562, 70);
      o += C.floor(-60, 60, 1.5, 400, c('#9aa99a'));
      o += `<defs>${lg(q + 'road', [c('#a7abbb'), c('#80859a'), c('#666b80')])}</defs>` + C.floor(-3, 3, 1.2, 400, `url(#${q}road)`);
      o += C.floor(2.6, 2.75, 1.2, 400, c('#f2f2f2')) + C.floor(-2.75, -2.6, 1.2, 400, c('#f2f2f2'));
      o += C.floor(3, 4.4, 1.2, 400, c('#c8c0b2')) + C.floor(-4, -3, 1.2, 400, c('#c8c0b2'));
      // houses on the left, far to near
      const houses = [[62, 74, '#e9e1d2', '#5d6f8f'], [48, 58, '#f2e6d6', '#8f4a42'], [35, 44, '#e4e8ec', '#4a5a72'], [23, 31, '#f4ead8', '#6a5a4a'], [13, 20, '#efe3d0', '#4f617f']];
      for (const [z0, z1, wall, roof] of houses) {
        o += C.box(-12, -5, 0, 6, z0, z1, c(wall));
        o += C.poly([[-5, 6, z0], [-8.5, 8.3, z0], [-8.5, 8.3, z1], [-5, 6, z1]], c(roof)) + C.poly([[-4.6, 5.8, z0 - 0.3], [-5, 6, z0 - 0.3], [-5, 6, z1 + 0.3], [-4.6, 5.8, z1 + 0.3]], c(shade(roof, -0.25)));
        o += C.poly([[-5, 6, z0], [-8.5, 8.3, z0], [-12, 6, z0]], c(shade(wall, -0.05)));
        for (let k = 1; k < 6; k++) { const zz = z0 + ((z1 - z0) * k) / 6; o += C.line([-5, 6, zz], [-8.5, 8.3, zz], c(shade(roof, -0.2)), Math.max(1, 30 / zz)); }
        for (const [wx, wy] of [[-10.6, 1.6], [-7.6, 1.6], [-9.1, 4.1]]) { const lit = T.glow && (z0 + wx) % 2 < 1.4 * T.glow; o += C.wallZ(z0 - 0.01, wx, wx + 1.3, wy, wy + 1.2, lit ? '#ffd98a' : c('#9cc1e4')) + C.wallZ(z0 - 0.02, wx + 0.62, wx + 0.68, wy, wy + 1.2, c('#ffffff')); }
        o += C.wallZ(z0 - 0.01, -6.6, -5.5, 0, 2.1, c('#8a6a52'));
        for (const wz of [z0 + 1.2, z0 + (z1 - z0) / 2 + 0.6]) for (const wy of [1.8, 4.2]) {
          const lit = T.glow && (wz * 7 + wy) % 3 < 2 * T.glow;
          o += C.wallX(-4.98, wy, wy + 1.2, wz, wz + 1.6, lit ? '#ffd98a' : c('#9cc1e4')) + C.line([-4.97, wy + 0.6, wz], [-4.97, wy + 0.6, wz + 1.6], c('#ffffff'), 1.5, 'opacity=".7"');
          if (lit) { const p = C.P(-4.98, wy + 0.6, wz + 0.8); o += glow(q, p[0], p[1], 2200 / wz, '#ffcf6a', 0.5); }
        }
      }
      // concrete block wall along the left pavement
      o += C.wallX(-4, 0, 1.5, 1.2, 80, c('#d4cec2')) + C.floor(-4.15, -4, 1.2, 80, c('#e6e0d4'), 1.5);
      for (let z = 1.6; z < 22; z += 0.8) o += C.line([-3.99, 0, z], [-3.99, 1.5, z], c('#b4ad9f'), 1.2);
      for (let yy = 0.3; yy < 1.5; yy += 0.3) o += C.line([-3.99, yy, 1.2], [-3.99, yy, 80], c('#b4ad9f'), 1.2);
      // a lit vending machine against the wall
      o += C.box(-3.95, -3.2, 0, 1.9, 8, 8.8, c('#d8e4f0'));
      { const p = C.P(-3.2, 1.2, 8); o += glow(q, p[0] - 10, p[1], 120, '#e9f6ff', 0.35 + 0.4 * T.glow); }
      o += C.wallZ(8, -3.85, -3.3, 0.9, 1.75, T.glow ? '#e9f6ff' : c('#9fd0f0'));
      // the right side: a hedge and gardens with trees
      o += C.wallX(4.4, 0, 1.1, 1.2, 120, c('#4f8f52'));
      for (const z of [40, 26, 15]) { const p = C.P(6, 3.2, z); o += foliage(p[0], p[1], 2200 / z, T, z, '#4c9a56'); }
      // poles and the wires between them
      const zs = [5.5, 11, 17, 23, 30, 38, 48, 62, 80], tops = [];
      for (const z of zs.slice().reverse()) {
        o += C.wallZ(z, 4.55, 4.85, 0, 9, c('#9b9a94'));
        o += C.line([3.7, 8.2, z], [5.7, 8.2, z], c('#6f6c66'), Math.max(1.5, 60 / z)) + C.line([4.1, 7.4, z], [5.3, 7.4, z], c('#6f6c66'), Math.max(1, 40 / z));
        if (T.glow) { const p = C.P(4.2, 6.6, z); o += glow(q, p[0], p[1], 900 / z, '#ffe9b0', 0.8) + `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(60 / z)}" fill="#fffbe6"/>`; }
      }
      for (const z of zs) tops.push([C.P(3.8, 8.2, z), C.P(5.6, 8.2, z), C.P(4.2, 7.4, z)]);
      for (let k = 0; k < 3; k++) {
        let d = `M-40 ${k * 40 - 30}`;
        for (const t of tops) { const [px, py] = t[k]; d += ` Q ${f1(px - 30)} ${f1(py + 26)} ${f1(px)} ${f1(py)}`; }
        o += `<path d="${d}" stroke="${c('#3a3a44')}" stroke-width="2" fill="none" opacity=".8"/>`;
      }
      // dappled shade across the road
      if (T.id !== 'night') { const r = rnd(9); for (let i = 0; i < 9; i++) { const z = 3 + r() * 10, X = 0.5 + r() * 3, p = C.P(X, 0, z); o += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(500 / z)}" ry="${f1(90 / z)}" fill="${T.shadow}" opacity=".18"/>`; } }
      else { const p = C.P(3.2, 0, 11); o += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="140" ry="22" fill="#ffe9b0" opacity=".25"/>`; }
      return o + branch(T, 'tr', 12) + wash(q, T);
    },

    // the school from the front gate: blossom trees, the clock, three floors of windows
    school(T, q) {
      const C = cam(800, 600, 760, 1.6), c = T.c;
      let o = skyFill(q, T, 640) + heavens(q, T, 1320, 130) + cumulus(330, 420, 560, T, 21, 2) + cumulus(1320, 470, 420, T, 5, 1) + hazeBand(q, T, 600, 60);
      o += C.floor(-80, 80, 2, 200, c('#c9b99c'));
      // the main building
      o += C.box(-26, 26, 0, 13, 40, 52, c('#f3ece0'));
      for (let fl = 0; fl < 3; fl++) {
        o += C.wallZ(39.98, -26, 26, 3.6 + fl * 4, 3.9 + fl * 4, c('#d8cdb8'));
        for (let i = -11; i <= 10; i++) {
          if (Math.abs(i + 0.5) < 1.5 && fl === 0) continue;
          const x0 = i * 2.3 + 0.35, lit = T.glow && ((i * 5 + fl * 3) & 3) < 2 * T.glow;
          o += C.wallZ(39.97, x0, x0 + 1.6, 1.2 + fl * 4, 3.2 + fl * 4, lit ? '#ffd98a' : c(fl === 2 ? '#b8dcf6' : '#8fbfe6')) + C.wallZ(39.96, x0 + 0.78, x0 + 0.84, 1.2 + fl * 4, 3.2 + fl * 4, c('#e9e2d4'));
        }
      }
      o += C.wallZ(39.97, -1.6, 1.6, 0, 2.8, c('#6d5b4c')) + C.wallZ(39.96, -1.55, 1.55, 0, 2.7, T.glow ? '#ffcf7a' : c('#8aa6c2'));
      // clock tower
      o += C.box(-3, 3, 13, 18, 41, 46, c('#f3ece0')) + C.poly([[-3.4, 18, 41], [0, 20.5, 41], [3.4, 18, 41]], c('#c45a52'));
      { const p = C.P(0, 15.6, 40.9); o += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="34" fill="#fffaf0" stroke="${c('#5a4a50')}" stroke-width="5"/><path d="M${f1(p[0])} ${f1(p[1])} v -24 M${f1(p[0])} ${f1(p[1])} l 16 8" stroke="${c('#3a2a30')}" stroke-width="5" stroke-linecap="round"/>`; }
      o += C.floor(-1.6, 1.6, 2, 40, c('#e2d6c0'));
      for (let z = 3; z < 40; z += 1.2) o += C.line([-1.6, 0, z], [1.6, 0, z], c('#cfc0a6'), Math.max(1, 8 / z));
      // gate pillars and the open gate rails
      o += C.box(-5.2, -4.2, 0, 2.6, 9, 10, c('#bdb1a0')) + C.box(4.2, 5.2, 0, 2.6, 9, 10, c('#bdb1a0'));
      o += C.wallZ(9.5, -14, -5.2, 0, 1.6, c('#9a958e')) + C.wallZ(9.5, 5.2, 14, 0, 1.6, c('#9a958e'));
      for (let x = -13.6; x < -5.2; x += 0.5) o += C.line([x, 0.2, 9.4], [x, 1.5, 9.4], c('#7a756e'), 2);
      for (let x = 5.6; x < 14; x += 0.5) o += C.line([x, 0.2, 9.4], [x, 1.5, 9.4], c('#7a756e'), 2);
      // the blossom trees, the near ones overhanging the frame
      for (const [X, Z, sz] of [[-9, 20, 1], [9, 22, 1], [-7.5, 8, 1.05], [8, 8.5, 1.05]]) {
        const base = C.P(X, 0, Z), top = C.P(X, 5.2, Z);
        o += `<path d="M${f1(base[0])} ${f1(base[1])} L${f1(top[0])} ${f1(top[1])}" stroke="${c('#5a3e34')}" stroke-width="${f1(600 / Z)}" stroke-linecap="round"/>`;
        o += foliage(top[0], top[1], (2600 / Z) * sz * 0.6, T, Z * 3, '#f2a9c4');
      }
      return o + petals(70, 7, T.id === 'night' ? '#d9b4d2' : '#ffd1e3', 0, 0, 1600, 1000) + wash(q, T);
    },

    // the club room after class: sun through tall windows, light pooling across desks and floor
    club(T, q) {
      const C = cam(940, 470, 640, 1.3), c = T.c, Zb = 9;
      let o = skyFill(q, T, 1000);
      o += C.wallZ(Zb, -5, 5, 0, 3.2, c('#efe1c8')) + C.floor(-5, 5, 0.8, Zb, c('#d6a774')) + C.floor(-5, 5, 0.8, Zb, c('#f6efe2'), 3.2);
      o += C.wallX(5, 0, 3.2, 0.8, Zb, c('#e6d6bc'));
      // the window wall on the left: frames, sky, sill
      o += C.wallX(-5, 0, 3.2, 0.8, Zb, c('#eadcc2'));
      const wins = [[1.2, 3.2], [3.7, 5.7], [6.2, 8.2]];
      for (const [z0, z1] of wins) {
        const a = C.P(-5, 2.8, z0), b = C.P(-5, 0.9, z1);
        o += C.wallX(-5, 0.9, 2.8, z0, z1, `url(#${q}sky)`);
        if (T.id !== 'night') o += `<g opacity=".9">${cumulus((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 30, Math.abs(b[0] - a[0]) * 1.2, T, z0 * 9, 1)}</g>`.replace('<g>', `<g clip-path="url(#${q}clip${z0})">`);
        o += `<defs><clipPath id="${q}clip${z0}"><polygon points="${C.pts([[-5, 0.9, z0], [-5, 2.8, z0], [-5, 2.8, z1], [-5, 0.9, z1]])}"/></clipPath></defs>`;
        o += C.line([-4.99, 1.85, z0], [-4.99, 1.85, z1], c('#f7f0e2'), 6) + C.line([-4.99, 0.9, (z0 + z1) / 2], [-4.99, 2.8, (z0 + z1) / 2], c('#f7f0e2'), 6);
      }
      o += C.floor(-5, -4.7, 0.8, Zb, c('#c9b495'), 0.9);
      // shafts of light landing on the floor (the sun is low on the left)
      const sun = T.id === 'night' ? '#b9c6ff' : T.light, sa = T.id === 'night' ? 0.18 : 0.42;
      for (const [z0, z1] of wins) {
        const k = 1.25, fl = (Y, Z) => [-5 + Y * k, 0, Z + Y * 0.35];
        const pts = [fl(0.9, z0), fl(2.8, z0), fl(2.8, z1), fl(0.9, z1)];
        o += C.poly(pts, sun, `opacity="${sa}"`);
        o += C.poly([[-5, 2.8, z0], [-5, 2.8, z1], fl(2.8, z1), fl(2.8, z0)], sun, `opacity="${sa * 0.22}"`) + C.poly([[-5, 2.8, z0], fl(2.8, z0), fl(0.9, z0), [-5, 0.9, z0]], sun, `opacity="${sa * 0.15}"`);
      }
      // chalkboard, a clock and the notice board
      o += C.wallZ(Zb - 0.02, -2.8, 2.6, 1, 2.3, c('#8a6a48')) + C.wallZ(Zb - 0.03, -2.7, 2.5, 1.06, 2.24, c('#2e5446'));
      o += C.line([-2.2, 1.9, Zb - 0.04], [-0.6, 1.9, Zb - 0.04], '#e8efe8', 3, 'opacity=".75"') + C.line([-2.2, 1.6, Zb - 0.04], [0.2, 1.6, Zb - 0.04], '#e8efe8', 3, 'opacity=".6"') + C.line([0.8, 1.4, Zb - 0.04], [1.9, 1.9, Zb - 0.04], '#ffd0e0', 3, 'opacity=".7"');
      { const p = C.P(0, 2.75, Zb - 0.02); o += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="20" fill="#fff" stroke="${c('#6a5a50')}" stroke-width="4"/><path d="M${f1(p[0])} ${f1(p[1])} v-13 M${f1(p[0])} ${f1(p[1])} l9 5" stroke="${c('#3a2a30')}" stroke-width="3"/>`; }
      o += C.wallX(4.98, 1.2, 2.4, 3, 6, c('#c9a06a'));
      { const r = rnd(4); for (let i = 0; i < 9; i++) { const z = 3.2 + r() * 2.4, y = 1.3 + r() * 0.8; o += C.wallX(4.97, y, y + 0.28, z, z + 0.3, c(['#ffffff', '#ffe7a8', '#ffd0e0', '#cfe8ff'][i % 4])); } }
      o += C.wallX(4.98, 0, 2.1, 6.8, 8.2, c('#b98a5c'));
      // ceiling lights
      for (const z of [2.5, 5, 7.5]) for (const X of [-2, 2]) o += C.floor(X - 0.7, X + 0.7, z, z + 0.25, T.glow ? '#fffbe6' : c('#fbf6ea'), 3.18);
      // desks pushed together, far to near
      for (const z of [7, 5.4, 3.8]) for (const X of [-3.1, -1.6, 0.6, 2.1]) {
        o += C.box(X, X + 1, 0.68, 0.74, z, z + 0.7, c('#c88d55')) + C.wallZ(z + 0.05, X + 0.08, X + 0.14, 0, 0.68, c('#8c8c94')) + C.wallZ(z + 0.05, X + 0.86, X + 0.92, 0, 0.68, c('#8c8c94'));
        o += C.box(X + 0.25, X + 0.75, 0.42, 0.46, z + 0.85, z + 1.25, c('#b47c4a')) + C.wallZ(z + 1.25, X + 0.25, X + 0.75, 0.46, 0.9, c('#b47c4a'));
      }
      // curtains drawn back at the window ends
      for (const z of [0.9, 8.3]) o += C.wallX(-4.9, 0.6, 3.1, z, z + 0.45, c('#fff3dc')) + C.line([-4.89, 0.6, z + 0.15], [-4.89, 3.1, z + 0.15], c('#e5d5b8'), 3) + C.line([-4.89, 0.6, z + 0.3], [-4.89, 3.1, z + 0.3], c('#e5d5b8'), 3);
      if (T.id === 'night') { const p = C.P(0, 3.1, 6); o += glow(q, p[0], p[1] + 60, 520, '#fff2c8', 0.22); }
      return o + motes(50, 3, 200, 250, 900, 600) + wash(q, T);
    },

    // the long corridor: windows on one side, classroom doors on the other, sun pooled on the floor
    hall(T, q) {
      const C = cam(800, 480, 620, 1.4), c = T.c, Zf = 46;
      let o = skyFill(q, T, 1000);
      o += C.floor(-1.8, 1.8, 0.7, Zf, c('#c8b8a0')) + C.floor(-1.8, 1.8, 0.7, Zf, c('#f4efe4'), 3) + C.wallZ(Zf, -1.8, 1.8, 0, 3, c('#e9dfcc'));
      o += C.wallZ(Zf - 0.01, -1.2, 1.2, 0.8, 2.6, `url(#${q}sky)`);
      o += C.wallX(-1.8, 0, 3, 0.7, Zf, c('#ede3d0')) + C.wallX(1.8, 0, 3, 0.7, Zf, c('#e3d6c0'));
      o += C.wallX(-1.79, 0, 0.9, 0.7, Zf, c('#b9a88e')) + C.wallX(1.79, 0, 0.12, 0.7, Zf, c('#a08e74'));
      const sun = T.id === 'night' ? '#b9c6ff' : T.light, sa = T.id === 'night' ? 0.2 : 0.45;
      for (let z = 1.2; z < Zf - 2; z += 3.2) {
        o += C.wallX(-1.79, 1.05, 2.7, z, z + 2.4, `url(#${q}sky)`) + C.line([-1.78, 1.88, z], [-1.78, 1.88, z + 2.4], c('#f7f0e2'), Math.max(1.5, 14 / z)) + C.line([-1.78, 1.05, z + 1.2], [-1.78, 2.7, z + 1.2], c('#f7f0e2'), Math.max(1.5, 14 / z));
        o += C.poly([[-1.8 + 1.05 * 1.1, 0, z + 0.4], [-1.8 + 2.7 * 0.9, 0, z + 0.9], [-1.8 + 2.7 * 0.9, 0, z + 3.1], [-1.8 + 1.05 * 1.1, 0, z + 2.6]], sun, `opacity="${sa}"`);
      }
      for (let z = 2; z < Zf - 3; z += 6.4) {
        o += C.wallX(1.78, 0, 2.1, z, z + 1.8, c('#c9a77a')) + C.wallX(1.77, 1.2, 1.8, z + 0.25, z + 0.8, T.glow ? '#ffe2a0' : c('#b6d4ec')) + C.wallX(1.77, 1.2, 1.8, z + 1, z + 1.55, T.glow ? '#ffe2a0' : c('#b6d4ec'));
        o += C.poly([[1.78, 2.35, z + 0.4], [1.3, 2.35, z + 0.4], [1.3, 2.6, z + 0.4], [1.78, 2.6, z + 0.4]], c('#fbfaf6'));
      }
      for (let z = 2; z < Zf; z += 4) o += C.floor(-0.5, 0.5, z, z + 0.3, T.glow ? '#fffbe6' : c('#fbf6ea'), 2.98);
      // the shine of the polished floor
      o += `<defs>${lg(q + 'sh', [[0, '#fff', 0], [1, '#fff', 0.25]])}</defs>` + C.floor(-0.6, 0.6, 0.7, Zf, `url(#${q}sh)`);
      if (T.id === 'night') for (let z = 2; z < 30; z += 8) { const p = C.P(0, 2.9, z); o += glow(q, p[0], p[1] + 20, 900 / z + 40, '#fff2c8', 0.25); }
      return o + motes(30, 6, 300, 200, 900, 600) + wash(q, T);
    },

    // the old library: tall shelves running back to a bright window, a reading lamp, dust in the light
    library(T, q) {
      const C = cam(800, 470, 600, 1.3), c = T.c, Zb = 14;
      let o = skyFill(q, T, 1000);
      o += C.floor(-4, 4, 0.8, Zb, c('#7a4e33')) + C.floor(-4, 4, 0.8, Zb, c('#5c3a28'), 4) + C.wallZ(Zb, -4, 4, 0, 4, c('#6a4430'));
      o += C.wallZ(Zb - 0.01, -1.4, 1.4, 0.9, 3.5, `url(#${q}sky)`) + C.line([0, 0.9, Zb - 0.02], [0, 3.5, Zb - 0.02], c('#4a2e20'), 6) + C.line([-1.4, 2.2, Zb - 0.02], [1.4, 2.2, Zb - 0.02], c('#4a2e20'), 6);
      { const p = C.P(0, 2.2, Zb); o += glow(q, p[0], p[1], 340, T.id === 'night' ? '#9fb2ff' : '#fff1c8', 0.45); }
      const r = rnd(42), books = ['#b8463e', '#3e6ab8', '#c99a3a', '#4f9a6a', '#8a5ab8', '#e8e0cc', '#2f4a6a', '#a8603a'];
      for (const side of [-1, 1]) {
        const X = side * 3.2;
        o += C.wallX(X, 0, 3.6, 0.8, Zb - 0.6, c('#5a3624'));
        for (let row = 0; row < 6; row++) {
          const y0 = 0.15 + row * 0.58;
          o += C.wallX(X + side * 0.01, y0 - 0.06, y0, 0.8, Zb - 0.6, c('#8a5a3a'));
          let z = 0.9;
          while (z < Zb - 0.8) {
            const w = 0.06 + r() * 0.07, hgt = 0.34 + r() * 0.16;
            o += C.wallX(X + side * 0.02, y0, y0 + hgt, z, z + w, c(books[Math.floor(r() * books.length)]));
            z += w + 0.004 + (r() < 0.04 ? 0.25 : 0);
          }
        }
        o += C.wallX(X + side * 0.02, 3.5, 3.6, 0.8, Zb - 0.6, c('#8a5a3a'));
      }
      // light from the window across the floor, and the reading table
      o += C.poly([[-1.4, 0, Zb], [1.4, 0, Zb], [2.2, 0, 6], [-2.2, 0, 6]], T.id === 'night' ? '#9fb2ff' : T.light, 'opacity=".22"');
      o += C.box(-1.6, 1.6, 0.74, 0.8, 3.2, 4.6, c('#a8703f'), 'r') + C.wallZ(3.25, -1.5, -1.4, 0, 0.74, c('#5c3a28')) + C.wallZ(3.25, 1.4, 1.5, 0, 0.74, c('#5c3a28'));
      { const p = C.P(0.9, 1.15, 3.8), b = C.P(0.9, 0.8, 3.8); o += glow(q, p[0], p[1] + 30, 260, '#ffcf7a', 0.35 + 0.35 * T.glow) + `<path d="M${f1(b[0])} ${f1(b[1])} V${f1(p[1] + 20)}" stroke="#3a2a20" stroke-width="6"/><path d="M${f1(p[0] - 38)} ${f1(p[1] + 22)} L${f1(p[0] - 20)} ${f1(p[1] - 12)} H${f1(p[0] + 20)} L${f1(p[0] + 38)} ${f1(p[1] + 22)}Z" fill="#2f6a4a" stroke="#1f3a2a" stroke-width="4"/>`; }
      { const a = C.P(-0.8, 0.8, 3.6); o += `<rect x="${f1(a[0])}" y="${f1(a[1] - 16)}" width="110" height="16" rx="3" fill="${c('#e8e0cc')}" transform="rotate(-6 ${f1(a[0])} ${f1(a[1])})"/><rect x="${f1(a[0] + 6)}" y="${f1(a[1] - 30)}" width="96" height="14" rx="3" fill="${c('#b8463e')}" transform="rotate(-4 ${f1(a[0])} ${f1(a[1])})"/>`; }
      return o + motes(70, 8, 500, 150, 600, 650, '#fff4cc') + wash(q, T, 'right');
    },

    // the rooftop: a wall of summer cloud over the city, the chain-link fence, the water tank
    roof(T, q) {
      const C = cam(800, 600, 700, 1.6), c = T.c;
      let o = skyFill(q, T, 700) + heavens(q, T, 1360, 120) + streaks(T, 90, 2) + cumulus(700, 600, 1100, T, 41, 4) + cumulus(1450, 560, 360, T, 9, 1);
      o += skyline(T, 612, 11, mix(c('#7f9cc8'), T.haze, 0.35), 0.8) + skyline(T, 622, 17, mix(c('#6d86b3'), T.haze, 0.2), 0.6) + hazeBand(q, T, 600, 60, 0.6);
      o += C.floor(-40, 40, 1.4, 14, c('#bfc3c9'));
      for (let z = 2; z < 14; z += 1.5) o += C.line([-40, 0, z], [40, 0, z], c('#a2a7af'), Math.max(1, 6 / z));
      for (let X = -20; X <= 20; X += 2) o += C.line([X, 0, 1.4], [X, 0, 14], c('#a2a7af'), 1.5);
      o += C.wallZ(14, -40, 40, 0, 0.5, c('#a9aeb6'));
      // water tank on legs
      o += C.box(6, 6.2, 0, 2, 11, 11.2, c('#8a8f98')) + C.box(9, 9.2, 0, 2, 11, 11.2, c('#8a8f98'));
      o += C.box(5.6, 9.6, 2, 5, 10.6, 13, c('#d6dce4'));
      for (let yy = 2.6; yy < 5; yy += 0.6) o += C.line([5.6, yy, 10.59], [9.6, yy, 10.59], c('#b4bcc8'), 2);
      // stairwell housing with its door
      o += C.box(-12, -6, 0, 3.4, 6, 11, c('#dfe2e6')) + C.wallZ(5.99, -8.4, -7, 0, 2.2, c('#7c8a9a')) + C.poly([[-6, 3.4, 6], [-12, 3.4, 6], [-12, 3.6, 5.8], [-5.8, 3.6, 5.8]], c('#9aa2ac'));
      if (T.glow) { const p = C.P(-7.7, 2.4, 5.98); o += glow(q, p[0], p[1], 90, '#ffe9b0', 0.8) + `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="6" fill="#fffbe6"/>`; }
      // chain-link fence and posts
      o += `<defs><pattern id="${q}mesh" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 H22 M0 0 V22" stroke="${c('#7d8794')}" stroke-width="2" fill="none"/></pattern></defs>`;
      o += C.wallZ(13.5, -40, 40, 0.5, 3.4, `url(#${q}mesh)`);
      for (let X = -24; X <= 24; X += 3) o += C.line([X, 0, 13.5], [X, 3.5, 13.5], c('#6c7684'), 4);
      o += C.line([-40, 3.4, 13.5], [40, 3.4, 13.5], c('#6c7684'), 5) + C.line([-40, 1.9, 13.5], [40, 1.9, 13.5], c('#6c7684'), 3);
      return o + (T.id === 'day' ? glow(q, 1360, 120, 900, '#fffbe6', 0.12) : '') + wash(q, T, 'right');
    },

    // the park path under the trees, a pond with the sky in it, a bench in the shade
    park(T, q) {
      const C = cam(800, 560, 680, 1.6), c = T.c;
      let o = skyFill(q, T, 620) + heavens(q, T, 280, 140) + cumulus(1150, 520, 640, T, 17, 2) + cumulus(420, 500, 360, T, 23, 1);
      o += skyline(T, 568, 21, mix(c('#8aa8d0'), T.haze, 0.5), 0.9) + hazeBand(q, T, 562, 60);
      o += `<defs>${lg(q + 'gr', [c('#9fd28c'), c('#6fb86a'), c('#4f9a52')])}</defs>` + C.floor(-80, 80, 1.2, 300, `url(#${q}gr)`);
      // the pond reflects the sky
      o += `<defs>${lg(q + 'pd', [mix(T.sky[2], '#7ab8e0', 0.4), mix(T.sky[1], '#4a8ac0', 0.4)])}</defs>`;
      o += `<ellipse cx="1180" cy="700" rx="380" ry="62" fill="url(#${q}pd)" stroke="${c('#5a9a62')}" stroke-width="6"/><ellipse cx="1120" cy="690" rx="180" ry="10" fill="#fff" opacity=".35"/><ellipse cx="1300" cy="712" rx="90" ry="6" fill="#fff" opacity=".25"/>`;
      o += `<defs>${lg(q + 'pt', [c('#efe1c2'), c('#dcc8a2')])}</defs>` + C.poly([[-1.6, 0, 1.2], [1.6, 0, 1.2], [1.4, 0, 60], [-0.2, 0, 300], [-1.2, 0, 60]], `url(#${q}pt)`);
      // trees, far to near
      for (const [X, Z, s] of [[-14, 60, 1], [12, 70, 1], [-8, 30, 1.1], [9, 34, 1], [-5, 12, 1.3], [6, 14, 1.2]]) {
        const b = C.P(X, 0, Z), t = C.P(X, 4.5, Z);
        o += `<path d="M${f1(b[0])} ${f1(b[1])} L${f1(t[0])} ${f1(t[1])}" stroke="${c('#5a4030')}" stroke-width="${f1(380 / Z)}" stroke-linecap="round"/>` + foliage(t[0], t[1] - 20 / Z, (2400 / Z) * s, T, Z, '#4f9c55');
        if (T.id !== 'night') o += `<ellipse cx="${f1(b[0] + 400 / Z)}" cy="${f1(b[1])}" rx="${f1(1500 / Z)}" ry="${f1(260 / Z)}" fill="${T.shadow}" opacity=".2"/>`;
      }
      // the bench and a lamp post
      { const p = C.P(-3.4, 0, 6), w = 230, s0 = 1; o += `<g transform="translate(${f1(p[0])} ${f1(p[1])}) scale(${s0})"><rect x="${-w / 2}" y="-70" width="${w}" height="12" rx="4" fill="${c('#b0703f')}"/><rect x="${-w / 2}" y="-52" width="${w}" height="12" rx="4" fill="${c('#a0643a')}"/><rect x="${-w / 2}" y="-34" width="${w}" height="12" rx="4" fill="${c('#b0703f')}"/><rect x="${-w / 2 + 10}" y="-22" width="10" height="22" fill="${c('#3a3a4a')}"/><rect x="${w / 2 - 20}" y="-22" width="10" height="22" fill="${c('#3a3a4a')}"/></g>`; }
      { const b = C.P(2.4, 0, 9), t = C.P(2.4, 3.6, 9); o += `<path d="M${f1(b[0])} ${f1(b[1])} V${f1(t[1])}" stroke="${c('#3a3a4a')}" stroke-width="8"/><rect x="${f1(t[0] - 14)}" y="${f1(t[1] - 26)}" width="28" height="30" rx="6" fill="${T.glow ? '#fff3c8' : c('#e8eef2')}" stroke="${c('#3a3a4a')}" stroke-width="5"/>` + (T.glow ? glow(q, t[0], t[1] - 10, 200, '#ffe9b0', 0.7) + `<ellipse cx="${f1(b[0])}" cy="${f1(b[1])}" rx="160" ry="26" fill="#ffe9b0" opacity=".25"/>` : ''); }
      return o + (T.id === 'night' ? motes(26, 4, 0, 500, 1600, 400, '#d8ff8a') : petals(24, 5, c('#9ad27a'), 0, 0, 1600, 900)) + branch(T, 'tl', 33) + wash(q, T);
    },

    // the bakery kitchen: bread on the racks, the brick oven's glow, pans on the rail, warm lamps
    kitchen(T, q) {
      const C = cam(820, 440, 640, 1.55), c = T.c, Zb = 5.2, H = 3;
      let o = skyFill(q, T, 1000);
      o += C.wallZ(Zb, -3.6, 3.6, 0, H, c('#f6ead6')) + C.floor(-3.6, 3.6, 0.8, Zb, c('#d9c2a0')) + C.floor(-3.6, 3.6, 0.8, Zb, c('#efe2cc'), H);
      for (let z = 1; z < Zb; z += 0.45) o += C.line([-3.6, 0, z], [3.6, 0, z], c('#c4aa84'), Math.max(1, 6 / z));
      for (let X = -3.6; X <= 3.6; X += 0.45) o += C.line([X, 0, 0.8], [X, 0, Zb], c('#c4aa84'), 1.5);
      o += C.wallX(-3.6, 0, H, 0.8, Zb, c('#f0e2cc')) + C.wallX(3.6, 0, H, 0.8, Zb, c('#ead8be'));
      o += `<defs><pattern id="${q}tile" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="${c('#e8dccb')}"/><rect x="1" y="1" width="24" height="24" rx="3" fill="${c('#fffaf2')}"/></pattern></defs>`;
      o += C.wallZ(Zb - 0.01, -3.6, 3.6, 0.9, 1.7, `url(#${q}tile)`);
      // back counter, the shelves of loaves, the window
      o += C.box(-3.6, 3.6, 0, 0.9, Zb - 0.6, Zb, c('#c99a6a')) + C.wallZ(Zb - 0.6, -3.6, 3.6, 0.9, 0.95, c('#efe4d2'));
      o += C.wallZ(Zb - 0.02, 0.9, 2.9, 1.25, 2.55, c('#e2ceb0')) + C.wallZ(Zb - 0.03, 1.02, 2.78, 1.37, 2.43, `url(#${q}sky)`) + C.line([1.9, 1.37, Zb - 0.04], [1.9, 2.43, Zb - 0.04], c('#e2ceb0'), 5);
      const loaf = (x, y, w, col) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(w)}" ry="${f1(w * 0.5)}" fill="${c(shade(col, -0.15))}"/><ellipse cx="${f1(x - w * 0.1)}" cy="${f1(y - w * 0.1)}" rx="${f1(w * 0.85)}" ry="${f1(w * 0.36)}" fill="${c(col)}"/><ellipse cx="${f1(x - w * 0.3)}" cy="${f1(y - w * 0.22)}" rx="${f1(w * 0.4)}" ry="${f1(w * 0.12)}" fill="${c(shade(col, 0.35))}"/>` + [-0.4, 0, 0.4].map((d) => `<path d="M${f1(x + d * w - w * 0.12)} ${f1(y - w * 0.28)} l ${f1(w * 0.22)} ${f1(w * 0.18)}" stroke="${c(shade(col, 0.5))}" stroke-width="${f1(w * 0.08)}" stroke-linecap="round"/>`).join('');
      for (const yy of [1.95, 2.5]) {
        o += C.wallZ(Zb - 0.05, -3.4, 0.5, yy - 0.05, yy, c('#a8703f'));
        for (let i = 0; i < 6; i++) { const p = C.P(-3.1 + i * 0.62, yy + 0.09, Zb - 0.2); o += loaf(p[0], p[1], 34, ['#d08a44', '#b8692e', '#e0a456'][i % 3]); }
      }
      // the brick oven in the right wall
      o += `<defs><pattern id="${q}brick" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="${c('#a8543a')}"/><path d="M0 0 H40 M0 10 H40 M20 0 V10 M0 10 V20 M40 10 V20" stroke="${c('#7a3a28')}" stroke-width="2"/></pattern></defs>`;
      o += C.wallX(3.59, 0, 2.4, 1.6, 4.2, `url(#${q}brick)`);
      { const a = C.P(3.58, 1.5, 2.3), b = C.P(3.58, 0.6, 3.6); o += `<path d="M${f1(a[0])} ${f1(b[1] + 20)} L${f1(a[0])} ${f1(a[1] + 40)} Q ${f1((a[0] + b[0]) / 2)} ${f1(a[1] - 50)} ${f1(b[0])} ${f1(a[1] + 30)} L${f1(b[0])} ${f1(b[1] + 10)}Z" fill="#2a1410"/><path d="M${f1(a[0] + 12)} ${f1(b[1] + 14)} L${f1(a[0] + 12)} ${f1(a[1] + 54)} Q ${f1((a[0] + b[0]) / 2)} ${f1(a[1] - 20)} ${f1(b[0] - 10)} ${f1(a[1] + 44)} L${f1(b[0] - 10)} ${f1(b[1] + 8)}Z" fill="#ff8a3a" opacity=".85"/>` + glow(q, (a[0] + b[0]) / 2, b[1], 300, '#ff9a4a', 0.5); }
      // pans hanging on a rail on the left wall
      o += C.line([-3.58, 2.3, 1.4], [-3.58, 2.3, 4.4], c('#8a8f98'), 5);
      for (let i = 0; i < 4; i++) { const p = C.P(-3.56, 1.9, 1.8 + i * 0.7), r0 = 260 / (1.8 + i * 0.7); o += `<path d="M${f1(p[0])} ${f1(p[1] - r0 * 1.3)} V${f1(p[1] - r0 * 0.9)}" stroke="${c('#5a5f68')}" stroke-width="3"/><ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(r0 * 0.4)}" ry="${f1(r0 * 0.9)}" fill="${c(i % 2 ? '#c87a4a' : '#9aa2ac')}"/><ellipse cx="${f1(p[0] + r0 * 0.08)}" cy="${f1(p[1] - r0 * 0.1)}" rx="${f1(r0 * 0.24)}" ry="${f1(r0 * 0.66)}" fill="#fff" opacity=".22"/>`; }
      // the work counter in front: flour, dough and a rolling pin
      o += C.box(-3.6, 3.6, 0, 0.95, 1.1, 1.8, c('#d7b48a')) + C.floor(-3.6, 3.6, 1.1, 1.8, c('#f2e8d8'), 0.95);
      { const p = C.P(-0.9, 0.95, 1.4); o += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="150" ry="34" fill="#fffaf2" opacity=".85"/><ellipse cx="${f1(p[0] - 10)}" cy="${f1(p[1] - 8)}" rx="80" ry="24" fill="${c('#f7e2c0')}"/><rect x="${f1(p[0] + 180)}" y="${f1(p[1] - 20)}" width="260" height="28" rx="14" fill="${c('#d9a46a')}" transform="rotate(-6 ${f1(p[0] + 180)} ${f1(p[1])})"/>`; }
      // lamps hanging from the ceiling
      for (const X of [-1.6, 1.4]) { const t = C.P(X, H, 3), b = C.P(X, 2.3, 3); o += `<path d="M${f1(t[0])} ${f1(t[1])} V${f1(b[1])}" stroke="${c('#5a4a40')}" stroke-width="3"/><path d="M${f1(b[0] - 40)} ${f1(b[1] + 30)} Q ${f1(b[0])} ${f1(b[1] - 30)} ${f1(b[0] + 40)} ${f1(b[1] + 30)}Z" fill="${c('#3e6a5a')}"/>` + glow(q, b[0], b[1] + 40, 240, '#ffd08a', 0.3 + 0.35 * T.glow) + `<ellipse cx="${f1(b[0])}" cy="${f1(b[1] + 30)}" rx="18" ry="7" fill="#fff6d8"/>`; }
      o += C.poly([[1.02, 0.95, Zb - 0.6], [2.78, 0.95, Zb - 0.6], [3.4, 0, 2.2], [0.2, 0, 2.2]], T.id === 'night' ? '#9fb2ff' : T.light, 'opacity=".18"');
      return o + motes(30, 13, 400, 200, 700, 400) + wash(q, T, 'right');
    },

    // the art room: easels and half-done canvases, tall windows, stacked paintings, a beam of light
    studio(T, q) {
      const C = cam(800, 480, 620, 1.5), c = T.c, Zb = 8, H = 3.3;
      let o = skyFill(q, T, 1000);
      o += C.wallZ(Zb, -4.6, 4.6, 0, H, c('#ece6da')) + C.floor(-4.6, 4.6, 0.8, Zb, c('#c39566')) + C.floor(-4.6, 4.6, 0.8, Zb, c('#f3efe6'), H);
      for (let X = -4.6; X <= 4.6; X += 0.5) o += C.line([X, 0, 0.8], [X, 0, Zb], c('#b08456'), 1.5);
      o += C.wallX(-4.6, 0, H, 0.8, Zb, c('#e4ddcf')) + C.wallX(4.6, 0, H, 0.8, Zb, c('#dcd3c2'));
      for (const x0 of [-4.1, -1.3, 1.5]) o += C.wallZ(Zb - 0.01, x0, x0 + 2.6, 0.9, 3, `url(#${q}sky)`) + C.line([x0 + 1.3, 0.9, Zb - 0.02], [x0 + 1.3, 3, Zb - 0.02], c('#bdb4a2'), 5) + C.line([x0, 2, Zb - 0.02], [x0 + 2.6, 2, Zb - 0.02], c('#bdb4a2'), 5);
      if (T.id !== 'night') o += `<defs><clipPath id="${q}wcl"><polygon points="${C.pts([[-4.1, 0.9, Zb], [4.1, 0.9, Zb], [4.1, 3, Zb], [-4.1, 3, Zb]])}"/></clipPath></defs><g opacity=".85" clip-path="url(#${q}wcl)">${cumulus(800, 380, 760, T, 14, 1)}</g>`;
      const sun = T.id === 'night' ? '#b9c6ff' : T.light;
      o += C.poly([[-4.1, 0.9, Zb], [4.1, 0.9, Zb], [4.4, 0, 4], [-4.4, 0, 4]], sun, `opacity="${T.id === 'night' ? 0.1 : 0.22}"`);
      // framed paintings on the right wall, canvases stacked against the left
      const pal = ['#ff8fb3', '#7ab8ff', '#ffd66b', '#8ad89a', '#b58aff', '#ff9a5a'];
      for (const [z0, z1, y0, y1, k] of [[1.6, 2.8, 1.4, 2.4, 0], [3.4, 4.2, 1.6, 2.5, 1], [4.8, 6.2, 1.3, 2.2, 2]]) {
        o += C.wallX(4.58, y0 - 0.06, y1 + 0.06, z0 - 0.06, z1 + 0.06, c('#8a5a3a')) + C.wallX(4.57, y0, y1, z0, z1, c(shade(pal[k], 0.55)));
        o += C.wallX(4.56, y0, y0 + (y1 - y0) * 0.45, z0, z1, c(pal[k + 1]), 'opacity=".7"') + C.wallX(4.555, y0 + 0.2, y1 - 0.2, z0 + 0.2, z0 + (z1 - z0) * 0.5, c(pal[k + 2]), 'opacity=".8"');
      }
      for (let i = 0; i < 4; i++) { const z = 2 + i * 0.12; o += C.poly([[-4.55 + i * 0.03, 0, z], [-4.55 + i * 0.03, 0, z + 1.1], [-4.4 + i * 0.03, 1.1, z + 1.1], [-4.4 + i * 0.03, 1.1, z]], c(i % 2 ? '#fbf8f0' : '#e8e0d0')); }
      // a still life on a stand: a plaster ball and a block
      o += C.box(-3.4, -2.6, 0, 0.9, 5.4, 6.2, c('#e8e2d8'));
      { const p = C.P(-3.0, 1.12, 5.8); o += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="26" fill="${c('#fbf8f2')}"/><path d="M${f1(p[0] + 4)} ${f1(p[1] - 22)} A 26 26 0 0 1 ${f1(p[0] + 4)} ${f1(p[1] + 26)} A 20 26 0 0 0 ${f1(p[0] + 4)} ${f1(p[1] - 22)}" fill="${c('#d8d0c4')}"/>`; }
      const easel = (X, Z, art) => {
        const w = 900 / Z / 10;
        let e = C.line([X - 0.4, 0, Z], [X, 2.1, Z + 0.2], c('#8a5a3a'), w) + C.line([X + 0.4, 0, Z], [X, 2.1, Z + 0.2], c('#8a5a3a'), w) + C.line([X, 0, Z + 0.6], [X, 2.1, Z + 0.2], c('#7a4e30'), w * 0.8);
        e += C.wallZ(Z - 0.02, X - 0.55, X + 0.55, 0.9, 0.96, c('#8a5a3a')) + C.wallZ(Z - 0.05, X - 0.5, X + 0.5, 0.96, 1.95, c('#fbf8f0'));
        const r = rnd(art);
        for (let i = 0; i < 5; i++) { const x0 = X - 0.42 + r() * 0.6, y0 = 1.05 + r() * 0.6; e += C.wallZ(Z - 0.06, x0, x0 + 0.1 + r() * 0.25, y0, y0 + 0.1 + r() * 0.25, c(pal[i]), 'opacity=".8"'); }
        return e;
      };
      o += easel(-0.4, 6.4, 5) + easel(-2.4, 4.6, 3) + easel(2.3, 4.2, 8);
      { const r = rnd(29); for (let i = 0; i < 18; i++) { const p = C.P(-3 + r() * 6, 0, 1.4 + r() * 5); o += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(4 + r() * 10)}" ry="${f1(2 + r() * 3)}" fill="${c(pal[i % 6])}" opacity=".55"/>`; } }
      if (T.id === 'night') { const p = C.P(0, 3.2, 4); o += glow(q, p[0], p[1] + 100, 520, '#ffe2a8', 0.24); }
      return o + motes(40, 21, 350, 200, 900, 600) + wash(q, T);
    },

    // the auditorium from the seats: velvet curtains, spotlights, the boards gleaming
    stage(T, q) {
      const C = cam(800, 380, 620, 2.2), c = (x) => x;
      let o = `<rect width="1600" height="1000" fill="#140b11"/>`;
      o += `<defs>${lg(q + 'cur', ['#5a0f1e', '#a3223a', '#6a1424', '#b82c44', '#5a0f1e', '#9a1e36', '#601222'], 1, 0)}</defs>`;
      o += C.wallZ(11, -9, 9, 1.2, 8, '#24142a');
      o += `<defs>${lg(q + 'bd', ['#c48a52', '#8a5a32'])}</defs>` + C.floor(-9, 9, 4, 11, `url(#${q}bd)`, 1.2) + C.wallZ(4, -9, 9, 0, 1.2, '#3a1e14');
      for (let X = -8; X <= 8; X += 0.9) o += C.line([X, 1.2, 4], [X, 1.2, 11], '#7a4a2a', 2, 'opacity=".5"');
      // back curtain closed at the middle, side curtains swept open
      o += C.wallZ(10.9, -9, 9, 1.2, 8, `url(#${q}cur)`, 'opacity=".55"');
      o += C.wallZ(4.1, -6.4, -4.2, 1.2, 9, `url(#${q}cur)`) + C.wallZ(4.1, 4.2, 6.4, 1.2, 9, `url(#${q}cur)`) + C.wallZ(4.12, -9, -6.4, 0, 9, '#1a0d1c') + C.wallZ(4.12, 6.4, 9, 0, 9, '#1a0d1c');
      o += C.wallZ(4.05, -9, 9, 4.5, 9, `url(#${q}cur)`);
      { let sc = ''; for (let i = 0; i < 18; i++) { const X = -9 + i + 0.5, a = C.P(X - 0.5, 4.5, 4.04), b = C.P(X + 0.5, 4.5, 4.04); sc += `<path d="M${f1(a[0])} ${f1(a[1])} Q ${f1((a[0] + b[0]) / 2)} ${f1(a[1] + 40)} ${f1(b[0])} ${f1(b[1])}" fill="#7a1a2c"/>`; } o += sc; }
      o += C.wallZ(4.03, -7, -6.4, 0, 9.4, '#c49a48') + C.wallZ(4.03, 6.4, 7, 0, 9.4, '#c49a48') + C.wallZ(4.03, -7, 7, 4.9, 9.4, '#c49a48');
      // the spotlights
      const lite = T.id === 'night' ? '#cdd6ff' : '#fff1c0';
      for (const [X, Z] of [[-3, 7.5], [2.6, 6.5]]) {
        const top = C.P(X * 0.4, 9, 5), p1 = C.P(X - 1.6, 1.2, Z), p2 = C.P(X + 1.6, 1.2, Z);
        o += `<path d="M${f1(top[0] - 8)} ${f1(top[1])} L${f1(p1[0])} ${f1(p1[1])} L${f1(p2[0])} ${f1(p2[1])} L${f1(top[0] + 8)} ${f1(top[1])}Z" fill="${lite}" opacity=".13"/>`;
        const pc = C.P(X, 1.2, Z); o += `<ellipse cx="${f1(pc[0])}" cy="${f1(pc[1])}" rx="${f1((p2[0] - p1[0]) / 2)}" ry="26" fill="${lite}" opacity=".3"/>`;
      }
      o += motes(60, 2, 300, 120, 1000, 480, '#fff4d0');
      // the seat backs in the dark, nearest at the bottom
      for (let row = 0; row < 3; row++) for (let i = -1; i < 14; i++) o += `<rect x="${i * 124 - 30 + row * 40}" y="${850 + row * 55}" width="104" height="${110 - row * 10}" rx="26" fill="${shade('#5a1126', -row * 0.25)}"/><rect x="${i * 124 - 22 + row * 40}" y="${836 + row * 60}" width="88" height="10" rx="5" fill="#fff" opacity=".07"/>`;
      return o;
    },

    // the summer festival after dark: stalls down both sides, strings of lanterns, fireworks
    festival(T, q) {
      const C = cam(800, 560, 680, 1.6), N = TIMES.night;
      const NT = Object.assign({}, T, { sky: T.id === 'day' ? ['#1b1d5a', '#3b2a72', '#7a3f7a', '#d77468'] : N.sky, c: (col) => mix(col, '#1a1446', 0.45), glow: 1, id: 'night' });
      let o = skyFill(q, NT, 640) + starField(80, 3, 420);
      // fireworks
      for (const [x, y, col, rr] of [[320, 180, '#ff8ad9', 110], [1250, 140, '#ffe27a', 130], [820, 90, '#8af3ff', 80]]) {
        o += glow(q, x, y, rr * 1.8, col, 0.25);
        for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; o += `<path d="M${f1(x + Math.cos(a) * rr * 0.25)} ${f1(y + Math.sin(a) * rr * 0.25)} Q ${f1(x + Math.cos(a + 0.1) * rr * 0.7)} ${f1(y + Math.sin(a + 0.1) * rr * 0.7)} ${f1(x + Math.cos(a) * rr)} ${f1(y + Math.sin(a) * rr + 10)}" stroke="${col}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/><circle cx="${f1(x + Math.cos(a) * rr)}" cy="${f1(y + Math.sin(a) * rr + 10)}" r="3.5" fill="#fff"/>`; }
      }
      o += skyline(NT, 572, 8, '#1c1840', 0.8) + C.floor(-60, 60, 1.2, 300, '#2a2238');
      o += `<defs>${lg(q + 'st', ['#4a3a50', '#2c2234'])}</defs>` + C.floor(-3.2, 3.2, 1.2, 300, `url(#${q}st)`);
      // stalls, far to near, both sides
      const awn = ['#e04a5e', '#3a8ad9', '#f2a03a', '#d94aa8', '#4ab89a'];
      for (let i = 9; i >= 0; i--) {
        const z0 = 3 + i * 3.4, z1 = z0 + 2.8;
        for (const side of [-1, 1]) {
          const X0 = side * 3.4, X1 = side * 6, col = awn[(i + (side > 0 ? 2 : 0)) % awn.length];
          o += C.wallX(X0, 0, 2.1, z0, z1, '#7a4430') + C.wallX(X0 + side * 0.005, 0.9, 2.1, z0 + 0.1, z1 - 0.1, '#ffb866', 'opacity=".55"');
          const gr = rnd(i * 7 + side + 9);
          for (let k = 0; k < 7; k++) { const za = z0 + 0.25 + k * 0.33, yy = 1.25 + gr() * 0.5; o += C.wallX(X0 + side * 0.01, yy, yy + 0.22, za, za + 0.22, ['#ffe066', '#ff7ad9', '#8af3ff', '#ffffff', '#ff8a5a'][Math.floor(gr() * 5)]); }
          o += C.wallX(X0 + side * 0.01, 0, 0.9, z0, z1, '#5a3426') + C.wallX(X0 + side * 0.012, 0.86, 0.94, z0, z1, '#d9a46a');
          o += C.box(Math.min(X0, X1), Math.max(X0, X1), 2.1, 2.5, z0, z1, mix(col, '#1a1446', 0.25));
          for (let k = 0; k < 4; k++) { const za = z0 + (k * (z1 - z0)) / 4; o += C.wallX(X0 + side * 0.02, 2.1, 2.5, za, za + (z1 - z0) / 8, '#ffffff', 'opacity=".35"'); }
          const p = C.P(X0, 1.4, (z0 + z1) / 2); o += glow(q, p[0], p[1], 2400 / z0, '#ffb85a', 0.35);
        }
      }
      // lantern strings converging into the distance
      const lc = ['#ff6b6b', '#ffb84d', '#ff7ad9', '#ffe066'];
      for (const yy of [3.6, 4.4]) for (const side of [-1, 1]) {
        let d = '', lan = '';
        for (let z = 1.8; z < 40; z += 1.6) {
          const p = C.P(side * 3.3, yy - 0.3 * Math.sin(z * 2), z), sz = 220 / z;
          d += (d ? ' L' : 'M') + f1(p[0]) + ' ' + f1(p[1]);
          lan += glow(q, p[0], p[1] + sz, sz * 2.4, lc[Math.floor(z) % 4], 0.45) + `<rect x="${f1(p[0] - sz * 0.45)}" y="${f1(p[1])}" width="${f1(sz * 0.9)}" height="${f1(sz * 1.2)}" rx="${f1(sz * 0.4)}" fill="${lc[Math.floor(z) % 4]}"/><rect x="${f1(p[0] - sz * 0.3)}" y="${f1(p[1] + sz * 0.15)}" width="${f1(sz * 0.2)}" height="${f1(sz * 0.8)}" rx="${f1(sz * 0.1)}" fill="#fff" opacity=".5"/>`;
        }
        o += `<path d="${d}" stroke="#1a1020" stroke-width="2" fill="none"/>` + lan;
      }
      return o + bokeh(40, 7, ['#ffb85a', '#ff7ad9', '#ffe066', '#8af3ff'], 0, 300, 1600, 700, 36);
    },

    // a bedroom at night: moonlight through the window, the city glittering, a desk lamp still on
    room(T, q) {
      const C = cam(760, 470, 620, 1.3), N = TIMES.night, Zb = 5.5;
      const NT = Object.assign({}, T, T.id === 'day' ? { sky: N.sky, haze: N.haze, glow: 1, id: 'night', c: (col) => mix(col, '#1a2050', 0.55) } : {});
      const c = NT.c;
      let o = skyFill(q, NT, 1000);
      o += C.wallZ(Zb, -3.5, 3.5, 0, 2.8, c('#b8b0d8')) + C.floor(-3.5, 3.5, 0.8, Zb, c('#a88a70')) + C.floor(-3.5, 3.5, 0.8, Zb, c('#d0c8e8'), 2.8);
      o += C.wallX(-3.5, 0, 2.8, 0.8, Zb, c('#c4bce0')) + C.wallX(3.5, 0, 2.8, 0.8, Zb, c('#aca2cc'));
      // the window on the back wall with the city below the moon
      const a = C.P(0.2, 2.5, Zb), b = C.P(3, 0.9, Zb);
      o += C.wallZ(Zb - 0.01, 0.1, 3.1, 0.8, 2.6, c('#e8e0f0')) + C.wallZ(Zb - 0.02, 0.2, 3, 0.9, 2.5, `url(#${q}sky)`);
      o += `<defs><clipPath id="${q}wn"><rect x="${f1(a[0])}" y="${f1(a[1])}" width="${f1(b[0] - a[0])}" height="${f1(b[1] - a[1])}"/></clipPath></defs><g clip-path="url(#${q}wn)">${NT.id === 'night' ? starField(30, 5, 300, a[0], b[0] - a[0]).replace(/cy="(\d+)"/g, (m0, v) => `cy="${f1(a[1] + (+v % 200))}"`) + glow(q, a[0] + 230, a[1] + 70, 140, '#9fb2ff', 0.4) + `<circle cx="${f1(a[0] + 230)}" cy="${f1(a[1] + 70)}" r="26" fill="#fff6dc"/>` : heavens(q, NT, a[0] + 230, a[1] + 70, b[1])}${skyline(NT, b[1], 31, mix('#1a1a40', NT.sky[1], 0.3), 0.7)}</g>`;
      o += C.line([1.6, 0.9, Zb - 0.03], [1.6, 2.5, Zb - 0.03], c('#e8e0f0'), 6) + C.line([0.2, 1.7, Zb - 0.03], [3, 1.7, Zb - 0.03], c('#e8e0f0'), 6);
      o += C.wallZ(Zb - 0.04, -0.1, 0.5, 0.6, 2.7, c('#9aa6e8')) + C.wallZ(Zb - 0.04, 2.8, 3.4, 0.6, 2.7, c('#9aa6e8'));
      // moonlight across the floor
      o += C.poly([[0.2, 0, Zb], [3, 0, Zb], [2.2, 0, 2.4], [-0.8, 0, 2.4]], '#b9c8ff', `opacity="${NT.id === 'night' ? 0.22 : 0.3}"`);
      // the bed against the left wall, a poster, the desk with its lamp
      o += C.box(-3.5, -1.5, 0, 0.5, 2.4, 5.3, c('#e88aa8')) + C.box(-3.4, -2.6, 0.5, 0.75, 4.6, 5.2, c('#ffffff')) + C.box(-3.5, -1.5, 0.5, 0.62, 2.4, 4.2, c('#f2a6c0'));
      o += C.wallX(-3.49, 1.3, 2.2, 3, 4.2, c('#7a8ae8')) + C.wallX(-3.48, 1.45, 2.05, 3.15, 4.05, c('#ffd27a'));
      o += C.box(-1, 0.6, 0.72, 0.76, 4.6, 5.4, c('#c48a5a'), 'r') + C.wallZ(4.65, -0.95, -0.85, 0, 0.72, c('#7a5a3a')) + C.wallZ(4.65, 0.45, 0.55, 0, 0.72, c('#7a5a3a'));
      { const p = C.P(0.2, 1.05, 5); o += glow(q, p[0], p[1] + 30, 360, '#ffcf7a', 0.5) + `<path d="M${f1(p[0])} ${f1(p[1] + 60)} V${f1(p[1] + 10)}" stroke="#3a2a30" stroke-width="5"/><path d="M${f1(p[0] - 30)} ${f1(p[1] + 14)} L${f1(p[0] - 16)} ${f1(p[1] - 14)} H${f1(p[0] + 16)} L${f1(p[0] + 30)} ${f1(p[1] + 14)}Z" fill="#ffd27a" stroke="#6a4a3a" stroke-width="4"/>`; }
      return o + motes(16, 9, 900, 300, 500, 500, '#cfd8ff') + wash(q, NT, 'right');
    },

    // a hill under the whole sky: the Milky Way, falling stars made of blocks, fireflies in the grass
    stars(T, q) {
      let o = skyFill(q, T, 1000, ['#03051a', '#0b1240', '#231c5c', '#3b2a6a']) + starField(320, 17, 1000);
      o += `<defs>${lg(q + 'mw', [[0, '#b8a8ff', 0], [0.5, '#e8d8ff', 0.28], [1, '#b8a8ff', 0]], 1, 0.4)}</defs><filter id="${q}bl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="40"/></filter><g filter="url(#${q}bl)"><path d="M-100 700 Q 600 300 1700 80 L1700 330 Q 700 520 -100 900Z" fill="url(#${q}mw)"/><ellipse cx="900" cy="420" rx="320" ry="90" fill="#f0c8ff" opacity=".18" transform="rotate(-24 900 420)"/><ellipse cx="600" cy="560" rx="200" ry="50" fill="#1a1040" opacity=".5" transform="rotate(-22 600 560)"/></g>`;
      o += starField(260, 23, 900).replace(/r="([\d.]+)"/g, (m0, v) => `r="${(v * 0.6).toFixed(1)}"`);
      const r = rnd(5), cols = ['#35e6ff', '#b25cff', '#ffd23b', '#ff4d6a', '#ff7ad9'];
      for (let i = 0; i < 6; i++) {
        const x = 200 + r() * 1200, y = 80 + r() * 380, col = cols[i % 5];
        o += `<defs>${lg(q + 'tr' + i, [[0, col, 0], [1, col, 0.7]], 1, 0.5)}</defs><path d="M${f1(x - 220)} ${f1(y - 110)} L${f1(x)} ${f1(y - 5)} L${f1(x)} ${f1(y + 5)}Z" fill="url(#${q}tr${i})"/>` + glow(q, x, y, 40, col, 0.6) + `<rect x="${f1(x - 8)}" y="${f1(y - 8)}" width="16" height="16" rx="3" fill="#fff"/>`;
      }
      o += `<path d="M0 800 Q 380 700 760 760 T 1600 720 V1000 H0Z" fill="#0c0a24"/><path d="M0 860 Q 500 800 900 850 T 1600 840 V1000 H0Z" fill="#070616"/>`;
      { let g = ''; const R = rnd(8); for (let i = 0; i < 160; i++) { const x = R() * 1600, y = 850 + R() * 40; g += `<path d="M${f1(x)} ${f1(y + 40)} q ${f1(-4 + R() * 8)} -20 ${f1(-6 + R() * 12)} ${f1(-20 - R() * 30)}" stroke="#070616" stroke-width="3" fill="none"/>`; } o += g; }
      return o + bokeh(26, 3, ['#d8ff8a'], 0, 700, 1600, 300, 8) + motes(30, 3, 0, 720, 1600, 280, '#e8ff9a');
    },
  };
  Art.BG = BG;
  const bgCache = {};
  // time: 'day' (default), 'dusk' or 'night', drawn properly rather than tinted
  Art.bg = function (id, time) {
    if (!BG[id]) id = 'black';
    const key = id + ':' + (time || 'day');
    if (!bgCache[key]) {
      const q = 'bg' + ++uid + '_';
      bgCache[key] = `<svg class="timed" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${BG[id](timeOf(time), q)}</svg>`;
    }
    return bgCache[key];
  };
})(window.SB);
