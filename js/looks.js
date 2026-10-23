// Stackbound piece looks: each special and behaviour changes how a piece is built instead of wearing an icon.
// bake() paints the still part into the cached block sprite; anim() layers the moving parts every frame.
// Edge flags say which sides of a block face outside its piece: 1 top, 2 right, 4 bottom, 8 left (higher bits: inside corners).
'use strict';
(function (SB) {
  const Rn = SB.Render;
  const { rr, rgba, star4, hash } = Rn;
  const L = (SB.Looks = {});
  const TOP = 1, RIGHT = 2, BOTTOM = 4, LEFT = 8;
  const frac = (v) => v - Math.floor(v);

  // accent colour per look: ghost outlines, glows, the tutorial swatches
  L.ACCENT = {
    coin: '#ffd23b', catalyst: '#7dff6a', echo: '#c78bff', herald: '#ffcf5c', hourglass: '#f3c37a', scholar: '#f6e7c1',
    forge: '#ff7a2e', pact: '#ff2d4a', drill: '#d6dde8', vacuum: '#7ad7ff', mender: '#ff9db0', prism: '#9ff6ff',
    earthquake: '#c08a4a', painter: '#ff5ce1', lantern: '#ffb84d', anchorstone: '#8d9bb0', temporal: '#8c9bff',
    sand: '#f0d08a', bomb: '#ff4d3a', anchor: '#9fb3c8', floaty: '#e6f4ff',
  };
  L.accent = (o) => (o && (L.ACCENT[o.spec] || L.ACCENT[o.beh])) || null;
  // powers that keep working after the piece lands stay animated on the board
  L.PERSIST = { pact: 1, lantern: 1, anchorstone: 1, temporal: 1, bomb: 1, anchor: 1 };
  L.isLive = (b) => !!(L.PERSIST[b.spec] || L.PERSIST[b.beh]);

  // which sides of each cell face outside the piece, plus the top-most ("lead") cell
  L.edges = function (cells) {
    const set = new Set(cells.map(([x, y]) => x + ',' + y));
    const has = (x, y) => set.has(x + ',' + y);
    let lead = 0;
    cells.forEach(([x, y], i) => { const [lx, ly] = cells[lead]; if (y < ly || (y === ly && x < lx)) lead = i; });
    return { flags: cells.map(([x, y]) => L.flags(has, x, y)), lead };
  };
  // side flags plus inside corners (16 top-left, 32 top-right, 64 bottom-right, 128 bottom-left):
  // both neighbours round a corner belong to the piece but the diagonal block does not
  L.flags = function (has, x, y) {
    const t = has(x, y - 1), r = has(x + 1, y), b = has(x, y + 1), l = has(x - 1, y);
    return (t ? 0 : TOP) | (r ? 0 : RIGHT) | (b ? 0 : BOTTOM) | (l ? 0 : LEFT) |
      (t && l && !has(x - 1, y - 1) ? 16 : 0) | (t && r && !has(x + 1, y - 1) ? 32 : 0) | (b && r && !has(x + 1, y + 1) ? 64 : 0) | (b && l && !has(x - 1, y + 1) ? 128 : 0);
  };
  // edge flags for a locked block from its neighbours on the board
  L.boardEdges = function (g, x, r) {
    const b = g.grid[r][x];
    const same = (xx, rr2) => rr2 >= 0 && rr2 < g.R && xx >= 0 && xx < g.W && g.grid[rr2][xx] && g.grid[rr2][xx].pid === b.pid;
    return L.flags(same, x, r);
  };

  const clipBody = (c, S, m) => { c.save(); rr(c, m.p, m.p, m.w, m.w, m.r); c.clip(); };
  const rivet = (c, x, y, r) => {
    c.fillStyle = 'rgba(20,24,32,0.85)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, 7); c.fill();
  };
  // a jagged seam across the block (forge embers, earthquake cracks)
  const seam = (c, S, seed, ox, oy) => {
    c.beginPath();
    c.moveTo(ox + S * 0.12, oy + S * (0.25 + hash(seed) * 0.2));
    c.lineTo(ox + S * 0.38, oy + S * (0.42 + hash(seed + 1) * 0.12));
    c.lineTo(ox + S * 0.5, oy + S * (0.3 + hash(seed + 2) * 0.1));
    c.lineTo(ox + S * 0.66, oy + S * (0.55 + hash(seed + 3) * 0.12));
    c.lineTo(ox + S * 0.88, oy + S * (0.48 + hash(seed + 4) * 0.2));
    c.moveTo(ox + S * 0.5, oy + S * (0.3 + hash(seed + 2) * 0.1));
    c.lineTo(ox + S * 0.44, oy + S * 0.12);
    c.moveTo(ox + S * 0.66, oy + S * (0.55 + hash(seed + 3) * 0.12));
    c.lineTo(ox + S * 0.6, oy + S * 0.88);
  };

  // ---------- still textures, baked into the block sprite ----------
  const BAKE = {
    coin(c, S, m) {
      c.strokeStyle = 'rgba(255,215,80,0.9)'; c.lineWidth = Math.max(1.2, S * 0.05);
      rr(c, m.i * 0.7, m.i * 0.7, S - m.i * 1.4, S - m.i * 1.4, m.r * 0.6); c.stroke();
    },
    catalyst(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(80,255,110,0.2)'; c.fillRect(0, 0, S, S);
      c.strokeStyle = 'rgba(170,255,150,0.6)'; c.lineWidth = Math.max(1, S * 0.04); c.lineCap = 'round';
      c.beginPath(); c.moveTo(S * 0.15, S * 0.9); c.bezierCurveTo(S * 0.4, S * 0.7, S * 0.3, S * 0.45, S * 0.55, S * 0.4); c.bezierCurveTo(S * 0.75, S * 0.35, S * 0.7, S * 0.15, S * 0.9, S * 0.1);
      c.moveTo(S * 0.33, S * 0.6); c.quadraticCurveTo(S * 0.2, S * 0.4, S * 0.12, S * 0.3); c.stroke();
      c.restore();
    },
    echo(c, S, m) {
      c.strokeStyle = 'rgba(205,150,255,0.85)'; c.lineWidth = Math.max(1, S * 0.04);
      rr(c, S * 0.2, S * 0.2, S * 0.6, S * 0.6, S * 0.1); c.stroke();
      c.strokeStyle = 'rgba(205,150,255,0.45)';
      rr(c, S * 0.32, S * 0.32, S * 0.36, S * 0.36, S * 0.06); c.stroke();
    },
    herald(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(255,207,92,0.32)';
      for (let k = -1; k < 3; k++) { const o = k * S * 0.5; c.beginPath(); c.moveTo(o, 0); c.lineTo(o + S * 0.22, 0); c.lineTo(o + S * 0.22 + S, S); c.lineTo(o + S, S); c.closePath(); c.fill(); }
      c.restore();
      c.strokeStyle = 'rgba(255,220,120,0.9)'; c.lineWidth = Math.max(1, S * 0.045); c.lineJoin = 'round';
      c.beginPath(); c.moveTo(S * 0.3, S * 0.62); c.lineTo(S * 0.5, S * 0.76); c.lineTo(S * 0.7, S * 0.62); c.stroke();
    },
    hourglass(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(243,195,122,0.22)'; c.fillRect(0, 0, S, S);
      for (let y = m.i; y < S - m.i; y += Math.max(2, S * 0.08)) { c.fillStyle = 'rgba(120,80,30,0.18)'; c.fillRect(0, y, S, Math.max(1, S * 0.025)); }
      c.restore();
    },
    scholar(c, S, m) {
      c.fillStyle = 'rgba(246,231,193,0.42)'; rr(c, S * 0.2, S * 0.22, S * 0.6, S * 0.56, S * 0.05); c.fill();
      c.strokeStyle = 'rgba(70,40,15,0.7)'; c.lineWidth = Math.max(1, S * 0.035); c.lineCap = 'round';
      c.beginPath();
      c.moveTo(S * 0.28, S * 0.35); c.lineTo(S * 0.72, S * 0.35);
      c.moveTo(S * 0.28, S * 0.48); c.lineTo(S * 0.72, S * 0.48);
      c.moveTo(S * 0.28, S * 0.61); c.lineTo(S * 0.55, S * 0.61); c.stroke();
      c.fillStyle = '#c0302a'; c.beginPath(); c.arc(S * 0.68, S * 0.66, S * 0.075, 0, 7); c.fill();
    },
    forge(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(25,10,4,0.45)'; c.fillRect(0, 0, S, S);
      c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = Math.max(1.5, S * 0.07); c.lineJoin = 'round'; seam(c, S, 11, 0, 0); c.stroke();
      c.strokeStyle = 'rgba(255,122,46,0.85)'; c.lineWidth = Math.max(1, S * 0.03); seam(c, S, 11, 0, 0); c.stroke();
      c.restore();
    },
    pact(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(110,0,24,0.5)'; c.fillRect(0, 0, S, S);
      c.restore();
      c.strokeStyle = 'rgba(255,60,90,0.85)'; c.lineWidth = Math.max(1, S * 0.035);
      c.beginPath(); c.arc(S / 2, S / 2, S * 0.26, 0, 7); c.stroke();
      c.beginPath();
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI * 2) / 5; const px = S / 2 + Math.cos(a) * S * 0.24, py = S / 2 + Math.sin(a) * S * 0.24; if (k) c.lineTo(px, py); else c.moveTo(px, py); }
      c.closePath(); c.stroke();
    },
    drill(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(210,220,235,0.18)'; c.fillRect(0, 0, S, S);
      const sp = S * 0.3;
      for (let k = -S; k < S * 2; k += sp) {
        c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.moveTo(k, 0); c.lineTo(k + sp * 0.4, 0); c.lineTo(k + sp * 0.4 - S * 0.5, S); c.lineTo(k - S * 0.5, S); c.closePath(); c.fill();
      }
      c.restore();
      c.strokeStyle = 'rgba(225,232,245,0.9)'; c.lineWidth = Math.max(1, S * 0.045);
      rr(c, m.i * 0.7, m.i * 0.7, S - m.i * 1.4, S - m.i * 1.4, m.r * 0.6); c.stroke();
    },
    vacuum(c, S, m) {
      for (const fy of [0.3, 0.47, 0.64]) {
        c.fillStyle = 'rgba(8,16,32,0.6)'; rr(c, S * 0.22, S * fy, S * 0.56, S * 0.09, S * 0.04); c.fill();
        c.fillStyle = 'rgba(160,230,255,0.35)'; c.fillRect(S * 0.24, S * (fy + 0.09), S * 0.52, Math.max(1, S * 0.02));
      }
      c.strokeStyle = 'rgba(122,215,255,0.85)'; c.lineWidth = Math.max(1, S * 0.045);
      rr(c, m.i * 0.7, m.i * 0.7, S - m.i * 1.4, S - m.i * 1.4, m.r * 0.6); c.stroke();
    },
    mender(c, S, m) {
      clipBody(c, S, m);
      c.translate(S / 2, S / 2); c.rotate(-Math.PI / 4);
      c.fillStyle = 'rgba(255,236,240,0.88)'; c.fillRect(-S, -S * 0.14, S * 2, S * 0.28);
      c.fillStyle = 'rgba(255,190,205,0.9)'; c.fillRect(-S * 0.14, -S * 0.1, S * 0.28, S * 0.2);
      c.strokeStyle = 'rgba(150,60,80,0.75)'; c.lineWidth = Math.max(1, S * 0.03);
      for (let k = -S * 0.6; k <= S * 0.6; k += S * 0.16) { if (Math.abs(k) < S * 0.18) continue; c.beginPath(); c.moveTo(k, -S * 0.09); c.lineTo(k, S * 0.09); c.stroke(); }
      c.restore();
    },
    prism(c, S, m) {
      clipBody(c, S, m);
      const cx = S * 0.5, cy = S * 0.5;
      const tints = ['rgba(255,122,217,0.35)', 'rgba(122,215,255,0.35)', 'rgba(255,242,122,0.35)', 'rgba(122,255,158,0.35)'];
      const pts = [[0, 0], [S, 0], [S, S], [0, S]];
      for (let k = 0; k < 4; k++) { const a = pts[k], b = pts[(k + 1) % 4]; c.fillStyle = tints[k]; c.beginPath(); c.moveTo(cx, cy); c.lineTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.closePath(); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(S, S); c.moveTo(S, 0); c.lineTo(0, S); c.stroke();
      c.restore();
    },
    earthquake(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(120,70,30,0.35)'; c.fillRect(0, 0, S, S);
      c.strokeStyle = 'rgba(30,15,5,0.75)'; c.lineWidth = Math.max(1.2, S * 0.05); c.lineJoin = 'round';
      c.save(); c.translate(S, 0); c.rotate(Math.PI / 2); seam(c, S, 23, 0, 0); c.restore(); c.stroke();
      c.restore();
    },
    painter(c, S, m) {
      const blob = (x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.arc(x + r * 0.7, y + r * 0.4, r * 0.6, 0, 7); c.arc(x - r * 0.5, y + r * 0.6, r * 0.45, 0, 7); c.fill(); };
      blob(S * 0.32, S * 0.32, S * 0.11, '#ff5ce1');
      blob(S * 0.64, S * 0.4, S * 0.1, '#35e6ff');
      blob(S * 0.42, S * 0.66, S * 0.1, '#ffe14d');
      c.fillStyle = 'rgba(255,255,255,0.7)';
      for (const [px, py] of [[0.29, 0.28], [0.61, 0.36], [0.39, 0.62]]) { c.beginPath(); c.arc(S * px, S * py, S * 0.03, 0, 7); c.fill(); }
    },
    lantern(c, S, m) {
      c.fillStyle = 'rgba(255,190,90,0.28)'; rr(c, m.i, m.i, S - 2 * m.i, S - 2 * m.i, m.r * 0.6); c.fill();
      c.strokeStyle = 'rgba(50,25,0,0.6)'; c.lineWidth = Math.max(1, S * 0.05);
      c.beginPath(); c.moveTo(S * 0.34, m.i); c.lineTo(S * 0.34, S - m.i); c.moveTo(S * 0.66, m.i); c.lineTo(S * 0.66, S - m.i); c.stroke();
      c.fillStyle = 'rgba(50,25,0,0.55)'; c.fillRect(m.p, m.p, m.w, S * 0.1); c.fillRect(m.p, S - m.p - S * 0.1, m.w, S * 0.1);
    },
    anchorstone(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(55,65,85,0.55)'; c.fillRect(0, 0, S, S);
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = Math.max(1, S * 0.05);
      c.beginPath(); c.moveTo(S * 0.2, S * 0.2); c.lineTo(S * 0.8, S * 0.8); c.moveTo(S * 0.8, S * 0.2); c.lineTo(S * 0.2, S * 0.8); c.stroke();
      c.restore();
      const r = Math.max(1.2, S * 0.06);
      for (const [px, py] of [[0.24, 0.24], [0.76, 0.24], [0.24, 0.76], [0.76, 0.76]]) rivet(c, S * px, S * py, r);
    },
    temporal(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(90,104,224,0.22)'; c.fillRect(0, 0, S, S);
      c.restore();
      c.strokeStyle = 'rgba(160,175,255,0.95)'; c.lineWidth = Math.max(1.2, S * 0.05);
      rr(c, m.i * 0.7, m.i * 0.7, S - m.i * 1.4, S - m.i * 1.4, m.r * 0.6); c.stroke();
      // a clock face with twelve ticks
      const cx = S / 2, cy = S / 2, R = S * 0.3;
      c.fillStyle = 'rgba(16,20,60,0.62)'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
      c.strokeStyle = 'rgba(170,185,255,0.95)'; c.lineWidth = Math.max(1, S * 0.04);
      c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
      c.lineWidth = Math.max(1, S * 0.03); c.lineCap = 'round';
      c.beginPath();
      for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6, r0 = k % 3 ? R * 0.8 : R * 0.66; c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92); }
      c.stroke();
    },
    // behaviours
    sand(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(240,208,138,0.22)'; c.fillRect(0, 0, S, S);
      c.restore();
      for (let k = 0; k < 34; k++) { c.fillStyle = hash(k * 11) > 0.5 ? 'rgba(255,235,180,0.5)' : 'rgba(80,50,10,0.38)'; c.fillRect(m.i + hash(k * 7 + 2) * (S - 2 * m.i), m.i + hash(k * 17 + 5) * (S - 2 * m.i), Math.max(1, S * 0.045), Math.max(1, S * 0.045)); }
    },
    bomb(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(16,16,26,0.6)'; c.fillRect(0, 0, S, S);
      const g = c.createRadialGradient(S * 0.35, S * 0.3, 0, S * 0.35, S * 0.3, S * 0.5);
      g.addColorStop(0, 'rgba(255,255,255,0.28)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, S, S);
      c.restore();
      c.strokeStyle = 'rgba(255,70,50,0.9)'; c.setLineDash([S * 0.12, S * 0.08]); c.lineWidth = Math.max(1, S * 0.05);
      rr(c, m.i * 0.5, m.i * 0.5, S - m.i, S - m.i, m.r * 0.6); c.stroke(); c.setLineDash([]);
    },
    anchor(c, S, m) {
      c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(m.p, S - m.p - S * 0.22, m.w, S * 0.22);
      c.fillStyle = 'rgba(160,180,200,0.5)'; c.fillRect(m.p, S - m.p - S * 0.22, m.w, Math.max(1, S * 0.03));
      const r = Math.max(1, S * 0.05);
      rivet(c, S * 0.28, S - m.p - S * 0.11, r); rivet(c, S * 0.72, S - m.p - S * 0.11, r);
    },
    floaty(c, S, m) {
      clipBody(c, S, m);
      c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(0, 0, S, S);
      c.restore();
      c.fillStyle = 'rgba(255,255,255,0.5)';
      for (const [px, py, pr] of [[0.3, 0.7, 0.07], [0.62, 0.6, 0.05], [0.45, 0.42, 0.04]]) { c.beginPath(); c.arc(S * px, S * py, S * pr, 0, 7); c.fill(); }
    },
  };
  L.bake = function (c, S, o, m) {
    if (o.beh && BAKE[o.beh]) BAKE[o.beh](c, S, m);
    if (o.spec && BAKE[o.spec]) BAKE[o.spec](c, S, m);
  };

  // ---------- whole-block motion (earthquake shudder, floaty bob) ----------
  L.offset = function (o, t, s) {
    if (!o.live) return null;
    if (o.spec === 'earthquake') { const k = Math.floor(t * 28); return { dx: (hash(k + 7) - 0.5) * s * 0.07, dy: (hash(k + 91) - 0.5) * s * 0.04 }; }
    if (o.beh === 'floaty') return { dx: 0, dy: Math.sin(t * 3 + (o.ph || 0)) * s * 0.045 };
    return null;
  };

  // ---------- moving parts, drawn every frame ----------
  const ANIM = {
    coin(ctx, x, y, s, o, t, ph) {
      // a spinning coin stamped into every block
      const w = Math.abs(Math.cos(t * 2.4 + ph * 0.6)), R = s * 0.2, cx = x + s / 2, cy = y + s / 2;
      ctx.fillStyle = '#9a6508'; ctx.beginPath(); ctx.ellipse(cx, cy + 1, Math.max(0.8, R * w), R, 0, 0, 7); ctx.fill();
      const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      g.addColorStop(0, '#fff4b0'); g.addColorStop(0.5, '#ffd23b'); g.addColorStop(1, '#c38a12');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(0.6, R * w * 0.92), R * 0.92, 0, 0, 7); ctx.fill();
      if (w > 0.35) { ctx.strokeStyle = 'rgba(120,75,0,0.7)'; ctx.lineWidth = Math.max(1, s * 0.03); ctx.beginPath(); ctx.moveTo(cx, cy - R * 0.5); ctx.lineTo(cx, cy + R * 0.5); ctx.stroke(); }
    },
    catalyst(ctx, x, y, s, o, t, ph) {
      if (!o.live) return;
      ctx.save(); rr(ctx, x + s * 0.08, y + s * 0.08, s * 0.84, s * 0.84, s * 0.14); ctx.clip();
      for (let k = 0; k < 3; k++) {
        const f = frac(t * 0.55 + hash(k * 13 + ph * 7) + k / 3);
        const bx = x + s * (0.2 + 0.6 * hash(k * 5 + Math.floor(t * 0.55 + k / 3) + ph)), by = y + s * (1 - f), r = s * (0.07 + 0.05 * hash(k + 3));
        ctx.globalAlpha = Math.min(1, f * 3);
        ctx.fillStyle = 'rgba(150,255,140,0.55)'; ctx.strokeStyle = 'rgba(235,255,225,1)'; ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    },
    echo(ctx, x, y, s, o, t, ph, e) {
      if (!o.live || !(e & TOP)) return;
      // afterimages of the block drift up off the top of the piece
      ctx.globalCompositeOperation = 'lighter';
      const a0 = ctx.globalAlpha;
      ctx.strokeStyle = '#d6a8ff'; ctx.lineWidth = Math.max(1.2, s * 0.06);
      for (let j = 0; j < 2; j++) {
        const k = frac(t * 0.8 + j * 0.5 + ph * 0.13);
        ctx.globalAlpha = a0 * (1 - k) * 0.85;
        const sz = s * (0.84 - 0.25 * k);
        rr(ctx, x + (s - sz) / 2, y - k * s * 0.7 + (s - sz) / 2, sz, sz, sz * 0.16); ctx.stroke();
      }
    },
    herald(ctx, x, y, s, o, t) {
      if (!o.live || !o.lead) return;
      // a little pennant flying from the top of the piece
      const px = x + s * 0.5, top = y + s * 0.05, h = s * 0.46;
      ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = Math.max(1, s * 0.05); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, top - h); ctx.stroke();
      const fl = Math.sin(t * 7) * s * 0.06;
      ctx.fillStyle = '#ff4d6a';
      ctx.beginPath(); ctx.moveTo(px, top - h); ctx.quadraticCurveTo(px + s * 0.2, top - h + fl, px + s * 0.4, top - h + s * 0.1 + fl); ctx.lineTo(px, top - h + s * 0.22); ctx.closePath(); ctx.fill();
    },
    hourglass(ctx, x, y, s, o, t, ph) {
      if (!o.live) return;
      const f = frac(t * 0.2 + ph * 0.05);
      const top = y + s * 0.85 - s * 0.68 * f;
      ctx.save(); rr(ctx, x + s * 0.12, y + s * 0.12, s * 0.76, s * 0.76, s * 0.1); ctx.clip();
      ctx.fillStyle = 'rgba(243,195,122,0.78)'; ctx.fillRect(x, top, s, y + s - top);
      ctx.fillStyle = 'rgba(255,240,200,0.6)'; ctx.fillRect(x, top, s, Math.max(1, s * 0.04));
      ctx.fillStyle = 'rgba(255,230,170,0.9)'; ctx.fillRect(x + s * 0.47, y, s * 0.06, top - y);
      ctx.restore();
    },
    scholar(ctx, x, y, s, o, t, ph) {
      if (!o.live) return;
      const k = frac(t * 0.6 + ph * 0.11), line = Math.floor(frac(t * 0.2 + ph) * 3);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.8;
      ctx.fillStyle = '#fff6d0'; star4(ctx, x + s * (0.28 + 0.44 * k), y + s * (0.35 + 0.13 * line), s * 0.09);
    },
    forge(ctx, x, y, s, o, t, ph, e) {
      if (!o.live) return;
      const pulse = 0.5 + 0.5 * Math.sin(t * 5 + ph);
      ctx.save(); rr(ctx, x + s * 0.05, y + s * 0.05, s * 0.9, s * 0.9, s * 0.15); ctx.clip();
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.25 + 0.5 * pulse;
      ctx.strokeStyle = '#ffb066'; ctx.lineWidth = Math.max(1.5, s * 0.07); ctx.lineJoin = 'round'; seam(ctx, s, 11, x, y); ctx.stroke();
      ctx.restore();
      if (e & TOP) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 2; k++) {
          const f = frac(t * 0.9 + k * 0.5 + ph * 0.3);
          ctx.globalAlpha = (1 - f) * 0.9; ctx.fillStyle = k ? '#ffd27a' : '#ff7a2e';
          ctx.beginPath(); ctx.arc(x + s * (0.3 + 0.4 * hash(k + Math.floor(t * 0.9 + k * 0.5 + ph * 0.3) * 3)), y - f * s * 0.55, s * 0.045 * (1 - f * 0.5), 0, 7); ctx.fill();
        }
        ctx.restore();
      }
    },
    pact(ctx, x, y, s, o, t) {
      // heartbeat: two quick pulses, then rest
      const c = frac(t * 0.8), beat = Math.max(Math.exp(-Math.pow((c - 0.1) * 18, 2)), Math.exp(-Math.pow((c - 0.3) * 18, 2)) * 0.8);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.2 + 0.7 * beat;
      ctx.strokeStyle = '#ff3355'; ctx.lineWidth = Math.max(1.5, s * 0.07);
      ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * 0.26, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,40,70,0.35)'; rr(ctx, x + s * 0.06, y + s * 0.06, s * 0.88, s * 0.88, s * 0.15); ctx.fill();
    },
    drill(ctx, x, y, s, o, t, ph, e) {
      if (!o.live) return;
      // grooves spin downward
      ctx.save(); rr(ctx, x + s * 0.06, y + s * 0.06, s * 0.88, s * 0.88, s * 0.15); ctx.clip();
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.22;
      const sp = s * 0.6, off = frac(t * 2.2) * sp;
      ctx.fillStyle = '#ffffff';
      for (let k = -s * 2; k < s * 2; k += sp) { const xx = x + k + off; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + s * 0.12, y); ctx.lineTo(xx + s * 0.12 - s * 0.5, y + s); ctx.lineTo(xx - s * 0.5, y + s); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      if (!(e & BOTTOM)) return;
      // steel teeth along the underside
      const n = 3, tw = s / n, by = y + s - s * 0.06;
      for (let k = 0; k < n; k++) {
        const jit = Math.sin(t * 34 + k * 2.1 + ph) * s * 0.025;
        const tx = x + tw * k + tw / 2, tip = by + s * 0.26 + jit;
        const g = ctx.createLinearGradient(tx - tw / 2, by, tx + tw / 2, tip);
        g.addColorStop(0, '#f5f8fc'); g.addColorStop(0.55, '#a8b6c8'); g.addColorStop(1, '#4f5c6e');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(tx - tw * 0.46, by); ctx.lineTo(tx + tw * 0.46, by); ctx.lineTo(tx + jit * 0.5, tip); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(20,26,36,0.8)'; ctx.lineWidth = 1; ctx.stroke();
      }
    },
    vacuum(ctx, x, y, s, o, t, ph, e) {
      if (!o.live) return;
      if (o.lead) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.55;
        ctx.strokeStyle = '#7ad7ff'; ctx.lineWidth = Math.max(1, s * 0.05); ctx.lineCap = 'round';
        const a = t * 6;
        for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * (0.14 + 0.1 * k), a + k * Math.PI, a + k * Math.PI + 2.2); ctx.stroke(); }
        ctx.restore();
      }
      if (!(e & BOTTOM)) return;
      // dust streaks pulled up into the underside
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) {
        const f = frac(t * 1.7 + k / 3 + ph * 0.21);
        const lx = x + s * (0.2 + 0.3 * k), ly = y + s + (1 - f) * s * 0.5;
        ctx.globalAlpha = f * 0.85; ctx.strokeStyle = '#bfefff'; ctx.lineWidth = Math.max(1, s * 0.04);
        ctx.beginPath(); ctx.moveTo(lx + (s / 2 + x - lx) * 0.1, ly); ctx.lineTo(lx + (x + s / 2 - lx) * 0.25, ly - s * 0.14); ctx.stroke();
      }
      ctx.restore();
    },
    mender(ctx, x, y, s, o, t, ph) {
      if (!o.live) return;
      const tw = Math.pow(Math.max(0, Math.sin(t * 2.5 + ph * 3)), 8);
      if (tw < 0.05) return;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= tw;
      ctx.fillStyle = '#ffd6e0';
      const cx = x + s * 0.72, cy = y + s * 0.28, a = s * 0.13, b = s * 0.04;
      ctx.fillRect(cx - a, cy - b, a * 2, b * 2); ctx.fillRect(cx - b, cy - a, b * 2, a * 2);
    },
    prism(ctx, x, y, s, o, t, ph) {
      if (!o.live) return;
      ctx.save(); rr(ctx, x + s * 0.05, y + s * 0.05, s * 0.9, s * 0.9, s * 0.15); ctx.clip();
      const k = frac(t * 0.45 + ph * 0.05) * 2.6 - 0.8, bx = x + k * s;
      const g = ctx.createLinearGradient(bx - s * 0.4, y, bx + s * 0.4, y + s * 0.3);
      ['rgba(255,80,120,0)', 'rgba(255,80,160,0.5)', 'rgba(255,230,90,0.55)', 'rgba(90,255,170,0.55)', 'rgba(90,170,255,0.5)', 'rgba(170,90,255,0)'].forEach((col, i) => g.addColorStop(i / 5, col));
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x, y, s, s);
      ctx.restore();
    },
    earthquake(ctx, x, y, s, o, t, ph, e) {
      if (!o.live || !(e & BOTTOM)) return;
      ctx.save();
      for (let k = 0; k < 2; k++) {
        const f = frac(t * 1.3 + k * 0.5 + ph * 0.17);
        ctx.globalAlpha = (1 - f) * 0.6; ctx.fillStyle = '#e2c49a';
        ctx.beginPath(); ctx.arc(x + s * (0.25 + 0.5 * k), y + s + s * 0.05, s * (0.08 + 0.16 * f), 0, 7); ctx.fill();
      }
      ctx.restore();
    },
    painter(ctx, x, y, s, o, t, ph, e) {
      if (!o.live || !(e & BOTTOM)) return;
      const cols = ['#ff5ce1', '#35e6ff', '#ffe14d'];
      for (let k = 0; k < 2; k++) {
        const f = frac(t * 0.5 + k * 0.45 + ph * 0.1);
        const dx = x + s * (0.3 + 0.4 * k), len = s * (0.06 + 0.34 * f);
        ctx.globalAlpha = f < 0.85 ? 1 : (1 - f) / 0.15;
        ctx.fillStyle = cols[(k + Math.floor(t * 0.5 + k * 0.45 + ph * 0.1)) % 3];
        ctx.fillRect(dx - s * 0.035, y + s * 0.9, s * 0.07, len);
        ctx.beginPath(); ctx.arc(dx, y + s * 0.9 + len, s * 0.06, 0, 7); ctx.fill();
      }
    },
    lantern(ctx, x, y, s, o, t, ph) {
      const fl = 0.75 + 0.15 * Math.sin(t * 9 + ph) + 0.1 * Math.sin(t * 23 + ph * 2);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x + s / 2, y + s / 2, 0, x + s / 2, y + s / 2, s * 0.85);
      g.addColorStop(0, `rgba(255,200,110,${0.45 * fl})`); g.addColorStop(1, 'rgba(255,160,60,0)');
      ctx.fillStyle = g; ctx.fillRect(x - s * 0.35, y - s * 0.35, s * 1.7, s * 1.7);
      if (o.lead) {
        // the flame
        const cx = x + s / 2, cy = y + s * 0.56, h = s * 0.34 * fl;
        ctx.fillStyle = '#ffb84d';
        ctx.beginPath(); ctx.moveTo(cx, cy - h); ctx.quadraticCurveTo(cx + s * 0.16, cy - h * 0.2, cx, cy + s * 0.1); ctx.quadraticCurveTo(cx - s * 0.16, cy - h * 0.2, cx, cy - h); ctx.fill();
        ctx.fillStyle = '#fff2c4';
        ctx.beginPath(); ctx.moveTo(cx, cy - h * 0.55); ctx.quadraticCurveTo(cx + s * 0.07, cy - h * 0.1, cx, cy + s * 0.06); ctx.quadraticCurveTo(cx - s * 0.07, cy - h * 0.1, cx, cy - h * 0.55); ctx.fill();
      }
      ctx.restore();
    },
    anchorstone(ctx, x, y, s, o, t, ph, e) {
      if (!(e & BOTTOM)) return;
      // a heavy shadow pressing down under it
      const g = ctx.createLinearGradient(0, y + s, 0, y + s + s * 0.3);
      g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x + s * 0.06, y + s, s * 0.88, s * 0.3);
    },
    temporal(ctx, x, y, s, o, t, ph) {
      // the hands run backwards; a faint afterimage trails the minute hand
      const cx = x + s / 2, cy = y + s / 2, R = s * 0.3;
      const am = -t * 2.2 + ph * 3, ah = am / 12 + ph;
      ctx.lineCap = 'round';
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 1; k <= 3; k++) {
        const a = am + k * 0.22;
        ctx.globalAlpha = 0.22 * (1 - k / 4); ctx.strokeStyle = '#8c9bff'; ctx.lineWidth = Math.max(1, s * 0.05);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 0.82, cy + Math.sin(a) * R * 0.82); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = '#e8ecff'; ctx.lineWidth = Math.max(1, s * 0.045);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(am) * R * 0.82, cy + Math.sin(am) * R * 0.82); ctx.stroke();
      ctx.lineWidth = Math.max(1.2, s * 0.06);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ah) * R * 0.5, cy + Math.sin(ah) * R * 0.5); ctx.stroke();
      ctx.fillStyle = '#e8ecff'; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, s * 0.045), 0, 7); ctx.fill();
    },
    sand(ctx, x, y, s, o, t, ph, e) {
      if (!o.live || !(e & BOTTOM)) return;
      for (let k = 0; k < 3; k++) {
        const f = frac(t * 1.1 + k / 3 + ph * 0.3);
        ctx.globalAlpha = (1 - f) * 0.9; ctx.fillStyle = k % 2 ? '#f0d08a' : '#c9a35a';
        const sz = Math.max(1.2, s * 0.06);
        ctx.fillRect(x + s * (0.25 + 0.25 * k) + Math.sin(f * 6 + k) * s * 0.03, y + s + f * s * 0.55, sz, sz);
      }
    },
    bomb(ctx, x, y, s, o, t, ph) {
      if (o.live) {
        const p = 0.5 + 0.5 * Math.sin(t * 6);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.1 + 0.12 * p;
        ctx.fillStyle = '#ff3b2a'; rr(ctx, x + s * 0.06, y + s * 0.06, s * 0.88, s * 0.88, s * 0.15); ctx.fill();
        ctx.restore();
      }
      if (!o.lead) return;
      // a lit fuse curling off the top
      const fx = x + s * 0.72, fy = y + s * 0.12, ex = x + s * 0.98, ey = y - s * 0.28;
      ctx.strokeStyle = '#d8c7a0'; ctx.lineWidth = Math.max(1.2, s * 0.06); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(x + s * 0.68, y - s * 0.18, ex, ey); ctx.stroke();
      const fl = 0.7 + 0.3 * Math.sin(t * 31) * Math.sin(t * 17);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ffcf4d'; star4(ctx, ex, ey, s * 0.2 * fl);
      ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.arc(ex, ey, s * 0.07, 0, 7); ctx.fill();
      for (let k = 0; k < 3; k++) {
        const f = frac(t * 2.5 + k / 3), a = hash(k + Math.floor(t * 2.5 + k / 3) * 5) * Math.PI * 2;
        ctx.globalAlpha = 1 - f; ctx.fillStyle = '#ffe08a';
        ctx.fillRect(ex + Math.cos(a) * f * s * 0.3, ey + Math.sin(a) * f * s * 0.3, 1.5, 1.5);
      }
      ctx.restore();
    },
    floaty(ctx, x, y, s, o, t, ph, e) {
      if (!o.live || !(e & BOTTOM)) return;
      ctx.fillStyle = 'rgba(240,248,255,0.72)';
      for (let k = 0; k < 2; k++) {
        const dx = Math.sin(t * 1.4 + k * 2 + ph) * s * 0.08;
        ctx.beginPath(); ctx.arc(x + s * (0.3 + 0.4 * k) + dx, y + s + s * 0.1, s * 0.12, 0, 7); ctx.arc(x + s * (0.42 + 0.4 * k) + dx, y + s + s * 0.13, s * 0.09, 0, 7); ctx.fill();
      }
    },
  };
  L.anim = function (ctx, x, y, s, o, t) {
    const ph = o.ph || 0, e = o.edges === undefined ? 15 : o.edges;
    const fns = [];
    if (o.beh && ANIM[o.beh]) fns.push(ANIM[o.beh]);
    if (o.spec && ANIM[o.spec]) fns.push(ANIM[o.spec]);
    for (const fn of fns) { ctx.save(); fn(ctx, x, y, s, o, t, ph, e); ctx.restore(); }
  };
})(window.SB);
