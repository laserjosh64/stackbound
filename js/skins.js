// Stackbound piece skins, bought at the Prize Counter. Each skin is a theme that knows the shape of its piece:
// paint(c, S, base, e, lead, seed) gets the edge flags from looks.js (1 top, 2 right, 4 bottom, 8 left face
// outside the piece; 16/32/64/128 mark inside corners at top-left/top-right/bottom-right/bottom-left), so roofs
// go on top, pipes join neighbouring blocks, and the lead (top-most) block carries the landmark.
// Materials keep their own looks (render.js), so a Gold or Glass block always reads as Gold or Glass.
'use strict';
(function (SB) {
  const Rn = SB.Render;
  const { shade, rr, hash, rgba } = Rn;
  const T = 1, R = 2, B = 4, L = 8, TL = 16, TR = 32, BR = 64, BL = 128;
  const PI = Math.PI;

  // a rect rounded only where two outside edges meet, so joined blocks run together
  function body(c, x0, y0, x1, y1, r, e) {
    const tl = e & T && e & L ? r : 0, tr = e & T && e & R ? r : 0, br = e & B && e & R ? r : 0, bl = e & B && e & L ? r : 0;
    c.beginPath();
    c.moveTo(x0 + tl, y0);
    c.lineTo(x1 - tr, y0); if (tr) c.arcTo(x1, y0, x1, y0 + tr, tr);
    c.lineTo(x1, y1 - br); if (br) c.arcTo(x1, y1, x1 - br, y1, br);
    c.lineTo(x0 + bl, y1); if (bl) c.arcTo(x0, y1, x0, y1 - bl, bl);
    c.lineTo(x0, y0 + tl); if (tl) c.arcTo(x0, y0, x0 + tl, y0, tl);
    c.closePath();
  }
  // inset only on the sides that face outside the piece
  const inset = (S, e, p) => [e & L ? p : 0, e & T ? p : 0, e & R ? S - p : S, e & B ? S - p : S];
  // stroke the outline of the piece without drawing seams between its blocks
  function outlineOuter(c, S, e, x0, y0, x1, y1, r, col, lw) {
    c.save();
    c.beginPath();
    c.rect(e & L ? -1 : lw, e & T ? -1 : lw, (e & R ? S + 1 : S - lw) - (e & L ? -1 : lw), (e & B ? S + 1 : S - lw) - (e & T ? -1 : lw));
    c.clip();
    c.strokeStyle = col; c.lineWidth = lw;
    body(c, x0 + lw / 2, y0 + lw / 2, x1 - lw / 2, y1 - lw / 2, Math.max(0, r - lw / 2), e);
    c.stroke();
    c.restore();
  }
  const metrics = (S, p, r, i) => ({ p, w: S - 2 * p, r, i, own: true });

  const SKINS = {
    // a single sprite per piece: one dark outline round the whole shape, hard highlights, dithered shade
    pixel: {
      edgy: true,
      paint(c, S, base, e, lead) {
        const u = Math.max(1, Math.round(S / 10));
        c.fillStyle = shade(base, 0.04); c.fillRect(0, 0, S, S);
        c.fillStyle = shade(base, -0.18);
        for (let y = 0; y < S; y += u) for (let x = 0; x < S; x += u) {
          if ((Math.round(x / u) + Math.round(y / u)) % 2) continue;
          if ((e & B && y >= S - 4 * u) || (e & R && x >= S - 4 * u)) c.fillRect(x, y, u, u);
        }
        // faint seams keep the columns countable
        c.fillStyle = 'rgba(0,0,0,0.13)';
        if (!(e & L)) c.fillRect(0, 0, 1, S);
        if (!(e & T)) c.fillRect(0, 0, S, 1);
        const l = e & L ? u : 0, t = e & T ? u : 0, r = e & R ? u : 0, b = e & B ? u : 0;
        c.fillStyle = shade(base, 0.52);
        if (e & T) c.fillRect(l, u, S - l - r, u);
        if (e & L) c.fillRect(u, t, u, S - t - b);
        c.fillStyle = shade(base, -0.36);
        if (e & B) c.fillRect(l, S - 2 * u, S - l - r, u);
        if (e & R) c.fillRect(S - 2 * u, t, u, S - t - b);
        const ol = shade(base, -0.68);
        c.fillStyle = ol;
        if (e & T) c.fillRect(0, 0, S, u);
        if (e & B) c.fillRect(0, S - u, S, u);
        if (e & L) c.fillRect(0, 0, u, S);
        if (e & R) c.fillRect(S - u, 0, u, S);
        if (e & TL) c.fillRect(0, 0, u, u);
        if (e & TR) c.fillRect(S - u, 0, u, u);
        if (e & BR) c.fillRect(S - u, S - u, u, u);
        if (e & BL) c.fillRect(0, S - u, u, u);
        // knock the outside corners off by a pixel, like a hand-drawn sprite
        for (const [f, x, y, ix, iy] of [[T | L, 0, 0, u, u], [T | R, S - u, 0, S - 2 * u, u], [B | R, S - u, S - u, S - 2 * u, S - 2 * u], [B | L, 0, S - u, u, S - 2 * u]]) {
          if ((e & f) !== f) continue;
          c.clearRect(x, y, u, u);
          c.fillStyle = ol; c.fillRect(ix, iy, u, u);
        }
        if (lead) {
          c.fillStyle = '#ffffff'; c.fillRect(2 * u, 2 * u, u, u);
          c.fillStyle = shade(base, 0.75); c.fillRect(3 * u, 2 * u, u, u); c.fillRect(2 * u, 3 * u, u, u);
        }
        return metrics(S, 0, 0.01, u * 2);
      },
    },

    // moulded plastic seen from the side: studs stand up from every top-facing block
    toy: {
      edgy: true,
      paint(c, S, base, e) {
        const p = Math.max(1, Math.round(S * 0.03)), top = e & T ? Math.round(S * 0.19) : 0, r = Math.max(1, S * 0.07);
        const [x0, , x1, y1] = inset(S, e, p);
        if (e & T) {
          const sx = S * 0.22, sw = S * 0.56, sy = Math.max(p, S * 0.03), sh = top - sy + r;
          const g = c.createLinearGradient(sx, 0, sx + sw, 0);
          g.addColorStop(0, shade(base, 0.38)); g.addColorStop(0.3, shade(base, 0.12)); g.addColorStop(1, shade(base, -0.4));
          c.fillStyle = g; rr(c, sx, sy, sw, sh, Math.min(S * 0.05, sh / 2)); c.fill();
          c.fillStyle = shade(base, 0.62); c.fillRect(sx + sw * 0.14, sy + Math.max(0.5, S * 0.02), sw * 0.5, Math.max(1, S * 0.03));
          c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 1; rr(c, sx + 0.5, sy + 0.5, sw - 1, sh, Math.min(S * 0.05, sh / 2)); c.stroke();
        }
        c.fillStyle = shade(base, 0.05); body(c, x0, top, x1, y1, r, e); c.fill();
        c.save(); body(c, x0, top, x1, y1, r, e); c.clip();
        const k = Math.max(1, Math.round(S * 0.07));
        c.fillStyle = shade(base, 0.34);
        if (e & T) c.fillRect(0, top, S, k);
        if (e & L) c.fillRect(x0, top, k, S);
        c.fillStyle = shade(base, -0.36);
        if (e & B) c.fillRect(0, y1 - k, S, k);
        if (e & R) c.fillRect(x1 - k, top, k, S);
        // a soft shine across the plastic
        const g = c.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.08)');
        c.fillStyle = g; c.fillRect(0, 0, S, S);
        // the mould line between blocks, barely there
        c.fillStyle = 'rgba(0,0,0,0.1)';
        if (!(e & L)) c.fillRect(0, 0, 1, S);
        if (!(e & T)) c.fillRect(0, 0, S, 1);
        c.restore();
        outlineOuter(c, S, e, x0, top, x1, y1, r, 'rgba(0,0,0,0.55)', 1);
        return metrics(S, p, r, S * 0.15);
      },
    },

    // every piece is a building: lit windows, a cornice on the roofline, rooftop clutter,
    // shopfronts with awnings along the bottom and a spire with a beacon on the lead block
    skyline: {
      edgy: true,
      paint(c, S, base, e, lead, seed) {
        const roof = e & T ? Math.round(S * (lead ? 0.36 : 0.2)) : 0;
        if (e & T) rooftop(c, S, base, roof, lead, seed + e * 5);
        c.fillStyle = shade(base, -0.2); c.fillRect(0, roof, S, S - roof);
        // pilaster between the window columns and a floor band between storeys
        c.fillStyle = shade(base, -0.08);
        c.fillRect(S * 0.46, roof, S * 0.08, S - roof);
        if (!(e & T)) c.fillRect(0, S * 0.45, S, S * 0.06);
        c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(0, S - Math.max(1, S * 0.03), S, Math.max(1, S * 0.03));
        const win = (x, y, w, h, k) => {
          const lit = hash(seed * 13 + e * 7 + (lead ? 3 : 0) + k * 31) > 0.36;
          if (lit) {
            const g = c.createLinearGradient(0, y, 0, y + h);
            g.addColorStop(0, '#fff8de'); g.addColorStop(1, shade(base, 0.5));
            c.fillStyle = g;
          } else c.fillStyle = shade(base, -0.74);
          c.fillRect(x, y, w, h);
          if (!lit) { c.fillStyle = 'rgba(255,255,255,0.14)'; c.beginPath(); c.moveTo(x, y + h * 0.6); c.lineTo(x + w * 0.6, y); c.lineTo(x + w, y); c.lineTo(x, y + h); c.closePath(); c.fill(); }
          if (S >= 24) { c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(x + w / 2 - 0.5, y, 1, h); c.fillRect(x, y + h * 0.45, w, 1); }
          c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x, y + h, w, Math.max(1, S * 0.03));
        };
        const cols = [S * 0.13, S * 0.59], ww = S * 0.28;
        if (!(e & T)) cols.forEach((x, i) => win(x, S * 0.1, ww, S * 0.27, i));
        const shop = e & B && hash(seed * 5 + e * 11 + (lead ? 7 : 0)) > 0.45;
        if (!shop) cols.forEach((x, i) => win(x, S * 0.58, ww, S * 0.25, i + 2));
        if (e & B && !shop) { c.fillStyle = shade(base, -0.55); c.fillRect(0, S * 0.88, S, S * 0.12); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, S * 0.88, S, Math.max(1, S * 0.02)); }
        if (shop) {
          // shopfront: striped awning with a scalloped hem over a lit window, on a stone plinth
          const ay = S * 0.52, ah = S * 0.09, sw = S / 4;
          for (let k = 0; k < 4; k++) {
            c.fillStyle = k % 2 ? '#f6efe2' : shade(base, 0.3);
            c.fillRect(k * sw, ay, sw, ah);
            c.beginPath(); c.ellipse(k * sw + sw / 2, ay + ah, sw / 2, sw * 0.32, 0, 0, PI); c.fill();
          }
          c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, ay, S, Math.max(1, S * 0.03));
          const g = c.createLinearGradient(0, S * 0.68, 0, S * 0.9);
          g.addColorStop(0, '#ffe7a8'); g.addColorStop(1, '#ffb45c');
          c.fillStyle = g; c.fillRect(S * 0.1, S * 0.7, S * 0.8, S * 0.18);
          c.fillStyle = 'rgba(80,40,0,0.4)'; c.fillRect(S * 0.5 - 0.5, S * 0.7, 1, S * 0.18);
          c.fillStyle = shade(base, -0.62); c.fillRect(0, S * 0.9, S, S * 0.1);
        }
        if (e & T) {
          c.fillStyle = shade(base, 0.14); c.fillRect(0, roof, S, S * 0.08);
          c.fillStyle = shade(base, -0.6); c.fillRect(0, roof + S * 0.08, S, Math.max(1, S * 0.03));
          if (S >= 24) { c.fillStyle = shade(base, -0.05); for (let x = S * 0.06; x < S; x += S * 0.16) c.fillRect(x, roof + S * 0.08, S * 0.06, S * 0.04); }
        }
        // light catches the left face of the tower; the right face falls into shadow
        if (e & L) { c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(0, roof, Math.max(1, S * 0.07), S - roof); }
        if (e & R) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(S - Math.max(1, S * 0.08), roof, Math.max(1, S * 0.08), S - roof); }
        return metrics(S, 0, Math.max(1, S * 0.03), S * 0.15);
      },
    },

    // brass-framed panels in the piece colour, copper pipes running between blocks,
    // a pressure gauge on the lead block, valve wheels on the ends and gears on loose blocks
    steampunk: {
      edgy: true,
      paint(c, S, base, e, lead, seed) {
        const bw = Math.max(2, S * 0.15), r = S * 0.14;
        c.fillStyle = shade(base, -0.14); body(c, 0, 0, S, S, r, e); c.fill();
        c.save(); body(c, 0, 0, S, S, r, e); c.clip();
        const pg = c.createLinearGradient(0, 0, S, S);
        pg.addColorStop(0, 'rgba(255,255,255,0.12)'); pg.addColorStop(1, 'rgba(0,0,0,0.18)');
        c.fillStyle = pg; c.fillRect(0, 0, S, S);
        for (let k = 0; k < 12; k++) {
          c.fillStyle = hash(seed + k * 7) > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.13)';
          c.beginPath(); c.arc(hash(k * 13 + seed) * S, hash(k * 29 + 1 + seed) * S, S * (0.015 + hash(k * 3 + e) * 0.03), 0, 7); c.fill();
        }
        // copper pipes from the middle to every joined side, with a flange where blocks meet
        const pw = S * 0.22, joins = [!(e & T), !(e & R), !(e & B), !(e & L)];
        const copper = (x, y, w, h, vertical) => {
          const g = vertical ? c.createLinearGradient(x, 0, x + w, 0) : c.createLinearGradient(0, y, 0, y + h);
          g.addColorStop(0, '#ffc49a'); g.addColorStop(0.35, '#d27a45'); g.addColorStop(1, '#5e2810');
          c.fillStyle = g; c.fillRect(x, y, w, h);
        };
        const fl = Math.max(1.5, S * 0.07), fh = pw * 1.55;
        if (joins[0]) { copper(S / 2 - pw / 2, 0, pw, S / 2, true); brass(c, S / 2 - fh / 2, 0, fh, fl, false); }
        if (joins[2]) { copper(S / 2 - pw / 2, S / 2, pw, S / 2, true); brass(c, S / 2 - fh / 2, S - fl, fh, fl, false); }
        if (joins[3]) { copper(0, S / 2 - pw / 2, S / 2, pw, false); brass(c, 0, S / 2 - fh / 2, fl, fh, true); }
        if (joins[1]) { copper(S / 2, S / 2 - pw / 2, S / 2, pw, false); brass(c, S - fl, S / 2 - fh / 2, fl, fh, true); }
        // brass frame on the outside faces
        if (e & T) brass(c, 0, 0, S, bw, false);
        if (e & B) brass(c, 0, S - bw, S, bw, false);
        if (e & L) brass(c, 0, 0, bw, S, true);
        if (e & R) brass(c, S - bw, 0, bw, S, true);
        if (e & TL) brass(c, 0, 0, bw, bw, false);
        if (e & TR) brass(c, S - bw, 0, bw, bw, false);
        if (e & BR) brass(c, S - bw, S - bw, bw, bw, false);
        if (e & BL) brass(c, 0, S - bw, bw, bw, false);
        const rv = Math.max(0.9, S * 0.045), spots = S >= 26 ? [0.3, 0.7] : [0.5];
        for (const f of spots) {
          if (e & T) rivet(c, S * f, bw / 2, rv);
          if (e & B) rivet(c, S * f, S - bw / 2, rv);
          if (e & L) rivet(c, bw / 2, S * f, rv);
          if (e & R) rivet(c, S - bw / 2, S * f, rv);
        }
        c.restore();
        const n = joins.filter(Boolean).length;
        if (lead) gauge(c, S, seed);
        else if (n === 0) gear(c, S);
        else if (n === 1) valve(c, S, joins);
        else bolt(c, S);
        outlineOuter(c, S, e, 0, 0, S, S, r, '#24160a', Math.max(1, S * 0.03));
        return metrics(S, 0, r, S * 0.16);
      },
    },

    // smoked glass with one neon tube that traces the outline of the whole piece
    neon: {
      edgy: true,
      paint(c, S, base, e) {
        const p = Math.max(1, S * 0.04), r = S * 0.16;
        const [x0, y0, x1, y1] = inset(S, e, p);
        const g = c.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, shade(base, -0.7)); g.addColorStop(1, shade(base, -0.84));
        c.fillStyle = g; body(c, x0, y0, x1, y1, r, e); c.fill();
        c.fillStyle = rgba(base, 0.16);
        if (!(e & L)) c.fillRect(0, 0, 1, S);
        if (!(e & T)) c.fillRect(0, 0, S, 1);
        const d = S * 0.22, rc = S * 0.15;
        const path = () => {
          c.beginPath();
          if (e & T) { c.moveTo(e & L ? d + rc : 0, d); c.lineTo(e & R ? S - d - rc : S, d); }
          if (e & B) { c.moveTo(e & L ? d + rc : 0, S - d); c.lineTo(e & R ? S - d - rc : S, S - d); }
          if (e & L) { c.moveTo(d, e & T ? d + rc : 0); c.lineTo(d, e & B ? S - d - rc : S); }
          if (e & R) { c.moveTo(S - d, e & T ? d + rc : 0); c.lineTo(S - d, e & B ? S - d - rc : S); }
          if (e & T && e & L) { c.moveTo(d, d + rc); c.arcTo(d, d, d + rc, d, rc); }
          if (e & T && e & R) { c.moveTo(S - d - rc, d); c.arcTo(S - d, d, S - d, d + rc, rc); }
          if (e & B && e & R) { c.moveTo(S - d, S - d - rc); c.arcTo(S - d, S - d, S - d - rc, S - d, rc); }
          if (e & B && e & L) { c.moveTo(d + rc, S - d); c.arcTo(d, S - d, d, S - d - rc, rc); }
          // inside corners: the tube turns round the corner of the block
          if (e & TL) { c.moveTo(d, 0); c.arc(0, 0, d, 0, PI / 2); }
          if (e & TR) { c.moveTo(S - d, 0); c.arc(S, 0, d, PI, PI / 2, true); }
          if (e & BR) { c.moveTo(S, S - d); c.arc(S, S, d, PI * 1.5, PI, true); }
          if (e & BL) { c.moveTo(0, S - d); c.arc(0, S, d, -PI / 2, 0); }
        };
        // light from the tube washing over the glass
        c.save(); body(c, x0, y0, x1, y1, r, e); c.clip();
        c.globalAlpha = 0.5; c.strokeStyle = rgba(base, 0.35); c.lineWidth = S * 0.3; c.lineCap = 'round'; path(); c.stroke();
        c.restore();
        c.save();
        c.lineCap = 'round';
        c.shadowColor = base; c.shadowBlur = S * 0.16;
        c.strokeStyle = rgba(base, 0.6); c.lineWidth = S * 0.15; path(); c.stroke();
        c.shadowBlur = S * 0.1;
        c.strokeStyle = shade(base, 0.2); c.lineWidth = S * 0.09; path(); c.stroke();
        c.shadowBlur = 0;
        c.strokeStyle = shade(base, 0.72); c.lineWidth = Math.max(1, S * 0.04); path(); c.stroke();
        c.restore();
        return metrics(S, p, r, S * 0.18);
      },
    },

    // layer cake: sponge in the piece colour, a cream layer through every row,
    // dripping icing and sprinkles on top and a cherry on the lead block
    bakery: {
      edgy: true,
      paint(c, S, base, e, lead, seed) {
        const p = Math.max(1, S * 0.03), r = S * 0.22;
        const [x0, y0, x1, y1] = inset(S, e, p);
        c.save(); body(c, x0, y0, x1, y1, r, e); c.clip();
        c.fillStyle = shade(base, 0.1); c.fillRect(0, 0, S, S);
        for (let k = 0; k < 14; k++) {
          c.fillStyle = hash(seed + k * 5) > 0.45 ? shade(base, 0.38) : shade(base, -0.18);
          c.beginPath(); c.arc(hash(k * 17 + seed) * S, hash(k * 31 + 3 + seed) * S, S * (0.015 + hash(k * 7 + 1) * 0.022), 0, 7); c.fill();
        }
        c.fillStyle = '#fff3e6'; c.fillRect(0, S * 0.44, S, S * 0.11);
        c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(0, S * 0.44, S, Math.max(1, S * 0.025));
        c.fillStyle = shade(base, -0.32); c.fillRect(0, S * 0.55, S, Math.max(1, S * 0.045));
        c.fillStyle = 'rgba(90,40,10,0.22)';
        if (e & L) c.fillRect(0, 0, S * 0.07, S);
        if (e & R) c.fillRect(S - S * 0.07, 0, S * 0.07, S);
        if (e & B) c.fillRect(0, S - S * 0.09, S, S * 0.09);
        if (e & T) {
          const ice = shade(base, 0.82);
          c.fillStyle = ice;
          c.fillRect(0, 0, S, S * 0.2);
          for (let k = 0; k < 3; k++) {
            const cx = S * (0.18 + k * 0.32 + (hash(seed + e + k * 3) - 0.5) * 0.08), len = S * (0.26 + hash(seed * 3 + k + e) * 0.2), w = S * 0.13;
            c.beginPath(); c.moveTo(cx - w / 2, S * 0.15); c.lineTo(cx - w / 2, len); c.arc(cx, len, w / 2, PI, 0, true); c.lineTo(cx + w / 2, S * 0.15); c.closePath(); c.fill();
          }
          c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(0, S * 0.05, S, Math.max(1, S * 0.03));
          const SPR = ['#ff4f8b', '#4fd2ff', '#ffe04f', '#6dff8a', '#ffffff', '#b56bff'];
          for (let k = 0; k < 5; k++) {
            const x = hash(seed + k * 11 + e) * S, y = S * (0.07 + hash(k * 13 + seed + e) * 0.1), a = hash(k * 19 + e) * PI;
            c.save(); c.translate(x, y); c.rotate(a);
            c.fillStyle = SPR[(k + seed) % SPR.length]; c.fillRect(-S * 0.05, -S * 0.015, S * 0.1, Math.max(1, S * 0.03));
            c.restore();
          }
        }
        c.restore();
        outlineOuter(c, S, e, x0, y0, x1, y1, r, shade(base, -0.6), Math.max(1, S * 0.03));
        if (lead) {
          const cx = S * 0.56, cy = S * 0.2, cr = S * 0.14;
          c.strokeStyle = '#3f7d2a'; c.lineWidth = Math.max(1, S * 0.035); c.lineCap = 'round';
          c.beginPath(); c.moveTo(cx, cy - cr * 0.6); c.quadraticCurveTo(cx + S * 0.04, cy - cr * 1.4, cx + S * 0.14, S * 0.02); c.stroke();
          const g = c.createRadialGradient(cx - cr * 0.35, cy - cr * 0.35, cr * 0.1, cx, cy, cr);
          g.addColorStop(0, '#ff6b7d'); g.addColorStop(0.6, '#d3102e'); g.addColorStop(1, '#6e0014');
          c.fillStyle = g; c.beginPath(); c.arc(cx, cy, cr, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(cx - cr * 0.35, cy - cr * 0.38, cr * 0.28, cr * 0.16, -0.6, 0, 7); c.fill();
        }
        return metrics(S, p, r, S * 0.16);
      },
    },

    // stone keep: staggered bricks in the piece colour, battlements on top, arrow slits,
    // gates along the bottom and a hanging banner on the lead block
    castle: {
      edgy: true,
      paint(c, S, base, e, lead, seed) {
        const top = e & T ? Math.round(S * 0.22) : 0;
        const mort = shade(base, -0.66), mw = Math.max(1, S * 0.035);
        if (e & T) {
          const ms = [[0.11, 0.39], [0.61, 0.89]];
          if (e & L) ms[0][0] = 0;
          if (e & R) ms[1][1] = 1;
          for (const [a, b] of ms) {
            c.fillStyle = shade(base, -0.1); c.fillRect(S * a, S * 0.03, S * (b - a), top);
            c.fillStyle = shade(base, 0.18); c.fillRect(S * a, S * 0.03, S * (b - a), Math.max(1, S * 0.04));
            c.fillStyle = mort; c.fillRect(S * a, S * 0.03, mw, top); c.fillRect(S * b - mw, S * 0.03, mw, top);
            c.fillRect(S * a, S * 0.03, S * (b - a), mw * 0.7);
          }
        }
        c.fillStyle = mort; c.fillRect(0, top, S, S - top);
        // two staggered courses per block so the bond runs on across neighbours
        const ch = S / 2;
        for (let k = 0; k < 2; k++) {
          const seams = k ? [0, 0.5, 1] : [-0.25, 0.25, 0.75, 1.25];
          for (let j = 0; j < seams.length - 1; j++) {
            const xa = S * seams[j] + mw / 2, xb = S * seams[j + 1] - mw / 2, ya = Math.max(top, k * ch) + mw / 2, yb = (k + 1) * ch - mw / 2;
            if (yb <= ya) continue;
            c.fillStyle = shade(base, -0.06 - hash(seed + k * 7 + j * 3 + e) * 0.22);
            c.fillRect(xa, ya, xb - xa, yb - ya);
            c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(xa, ya, xb - xa, Math.max(1, S * 0.025));
          }
        }
        // corner quoins: paler stones up the outside edges
        c.fillStyle = 'rgba(255,240,220,0.18)';
        for (let k = 0; k < 2; k++) {
          const ya = Math.max(top, k * ch) + mw / 2, h = (k + 1) * ch - mw / 2 - ya;
          if (h <= 0) continue;
          if (e & L) c.fillRect(mw / 2, ya, S * (k ? 0.18 : 0.3), h);
          if (e & R) c.fillRect(S - S * (k ? 0.3 : 0.18) - mw / 2, ya, S * (k ? 0.3 : 0.18), h);
        }
        const h = hash(seed * 7 + e * 3);
        if (lead) {
          // hanging banner in the piece colour with a gold device
          const bx = S * 0.3, bw = S * 0.4, by = top + S * 0.05, bh = S * 0.78 - top;
          c.fillStyle = '#5a4a3a'; c.fillRect(bx - S * 0.04, by - S * 0.02, bw + S * 0.08, Math.max(1, S * 0.04));
          c.fillStyle = shade(base, 0.32);
          c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bw, by); c.lineTo(bx + bw, by + bh); c.lineTo(bx + bw / 2, by + bh - S * 0.12); c.lineTo(bx, by + bh); c.closePath(); c.fill();
          c.strokeStyle = '#ffd35c'; c.lineWidth = Math.max(1, S * 0.03); c.stroke();
          c.fillStyle = '#ffd35c';
          const cx = bx + bw / 2, cy = by + bh * 0.42, q = S * 0.1;
          c.beginPath(); c.moveTo(cx, cy - q); c.lineTo(cx + q * 0.7, cy); c.lineTo(cx, cy + q); c.lineTo(cx - q * 0.7, cy); c.closePath(); c.fill();
        } else if (e & B && h > 0.45) {
          // arched gate with a portcullis
          const gx = S * 0.26, gw = S * 0.48, gy = S * 0.46;
          c.fillStyle = '#1a120c';
          c.beginPath(); c.moveTo(gx, S); c.lineTo(gx, gy + gw / 2); c.arc(gx + gw / 2, gy + gw / 2, gw / 2, PI, 0); c.lineTo(gx + gw, S); c.closePath(); c.fill();
          c.save(); c.clip();
          c.strokeStyle = '#7d7a86'; c.lineWidth = Math.max(1, S * 0.03);
          c.beginPath();
          for (let x = gx + gw / 4; x < gx + gw; x += gw / 4) { c.moveTo(x, gy); c.lineTo(x, S); }
          for (let y = gy + S * 0.12; y < S; y += S * 0.12) { c.moveTo(gx, y); c.lineTo(gx + gw, y); }
          c.stroke();
          c.restore();
          c.strokeStyle = shade(base, 0.2); c.lineWidth = Math.max(1, S * 0.04);
          c.beginPath(); c.arc(gx + gw / 2, gy + gw / 2, gw / 2 + S * 0.02, PI, 0); c.stroke();
        } else if (!(e & T) && h > 0.5) {
          // arrow slit
          c.fillStyle = '#140d08';
          c.fillRect(S * 0.46, S * 0.2, S * 0.08, S * 0.5);
          c.fillRect(S * 0.38, S * 0.4, S * 0.24, S * 0.07);
        }
        outlineOuter(c, S, e, 0, top, S, S, 0, 'rgba(0,0,0,0.55)', 1);
        return metrics(S, 0, Math.max(1, S * 0.03), S * 0.15);
      },
    },

    // Hellscape looks: cooled basalt. Cracks glow in the piece colour and run from block to block,
    // the edges catch the heat from below, and the lead block smoulders
    brimstone: {
      edgy: true,
      paint(c, S, base, e, lead, seed) {
        const p = Math.max(1, S * 0.04), r = S * 0.12;
        const [x0, y0, x1, y1] = inset(S, e, p);
        const g = c.createLinearGradient(0, 0, 0, S);
        g.addColorStop(0, '#3d2f36'); g.addColorStop(0.55, '#251b21'); g.addColorStop(1, '#170f13');
        c.fillStyle = g; body(c, x0, y0, x1, y1, r, e); c.fill();
        c.save(); body(c, x0, y0, x1, y1, r, e); c.clip();
        // rough facets in the stone
        for (let k = 0; k < 3; k++) {
          const fx = S * (0.15 + hash(seed + k * 3) * 0.7), fy = S * (0.15 + hash(seed + k * 3 + 1) * 0.7), fr = S * (0.16 + hash(seed + k * 3 + 2) * 0.12);
          c.fillStyle = k % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.18)';
          c.beginPath(); c.moveTo(fx - fr, fy); c.lineTo(fx - fr * 0.2, fy - fr * 0.8); c.lineTo(fx + fr, fy - fr * 0.3); c.lineTo(fx + fr * 0.5, fy + fr * 0.7); c.closePath(); c.fill();
        }
        // heat rising from the bottom edge
        if (e & B) { const hg = c.createLinearGradient(0, S, 0, S * 0.55); hg.addColorStop(0, rgba(base, 0.45)); hg.addColorStop(1, rgba(base, 0)); c.fillStyle = hg; c.fillRect(0, S * 0.55, S, S * 0.45); }
        // cracks: from a point near the middle out to every side shared with another block, so they join up across the piece
        const cx = S * (0.38 + hash(seed + 11) * 0.24), cy = S * (0.38 + hash(seed + 12) * 0.24);
        const ends = [];
        if (!(e & T)) ends.push([S * 0.5, 0]);
        if (!(e & B)) ends.push([S * 0.5, S]);
        if (!(e & L)) ends.push([0, S * 0.5]);
        if (!(e & R)) ends.push([S, S * 0.5]);
        ends.push([S * (hash(seed + 13) < 0.5 ? 0.18 : 0.82), S * (0.2 + hash(seed + 14) * 0.6)]);
        const path = () => {
          c.beginPath();
          ends.forEach(([ex, ey], i) => {
            c.moveTo(cx, cy);
            const mx = (cx + ex) / 2 + (hash(seed + 20 + i) - 0.5) * S * 0.22, my = (cy + ey) / 2 + (hash(seed + 30 + i) - 0.5) * S * 0.22;
            c.lineTo(mx, my); c.lineTo(ex, ey);
          });
        };
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.shadowColor = base; c.shadowBlur = S * 0.22;
        c.strokeStyle = rgba(base, 0.75); c.lineWidth = S * 0.11; path(); c.stroke();
        c.shadowBlur = S * 0.08;
        c.strokeStyle = shade(base, 0.45); c.lineWidth = S * 0.055; path(); c.stroke();
        c.shadowBlur = 0;
        c.strokeStyle = '#fff4d6'; c.lineWidth = Math.max(0.8, S * 0.02); path(); c.stroke();
        c.restore();
        // the rim: lit by the glow on the outside edges
        if (e & T) { c.save(); c.globalAlpha = 0.35; c.fillStyle = shade(base, 0.2); c.fillRect(x0 + r, y0, x1 - x0 - 2 * r, Math.max(1, S * 0.035)); c.restore(); }
        // the lead block smoulders: two embers on top
        if (lead) {
          c.save(); c.shadowColor = '#ff7a1c'; c.shadowBlur = S * 0.2;
          c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(S * 0.3, S * 0.2, Math.max(1, S * 0.045), 0, 7); c.fill();
          c.fillStyle = '#ff9a3b'; c.beginPath(); c.arc(S * 0.66, S * 0.14, Math.max(1, S * 0.035), 0, 7); c.fill();
          c.restore();
        }
        outlineOuter(c, S, e, x0, y0, x1, y1, r, 'rgba(0,0,0,0.7)', Math.max(1, S * 0.04));
        return metrics(S, p, r, S * 0.16);
      },
    },
  };

  // ---------- small pieces shared by the themes ----------
  function brass(c, x, y, w, h, vertical) {
    const g = vertical ? c.createLinearGradient(x, 0, x + w, 0) : c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#fff0b8'); g.addColorStop(0.4, '#d9a441'); g.addColorStop(1, '#6e4514');
    c.fillStyle = g; c.fillRect(x, y, w, h);
  }
  function rivet(c, x, y, r) {
    c.fillStyle = '#3a2408'; c.beginPath(); c.arc(x + r * 0.25, y + r * 0.3, r, 0, 7); c.fill();
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#fff6d0'); g.addColorStop(1, '#a8741f');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
  function gauge(c, S, seed) {
    const cx = S / 2, cy = S / 2, R0 = S * 0.3;
    const g = c.createRadialGradient(cx - R0 * 0.4, cy - R0 * 0.4, R0 * 0.1, cx, cy, R0);
    g.addColorStop(0, '#fff0b8'); g.addColorStop(0.6, '#c8902f'); g.addColorStop(1, '#5e3a10');
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(cx + S * 0.03, cy + S * 0.04, R0, 0, 7); c.fill();
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R0, 0, 7); c.fill();
    c.fillStyle = '#f4ead2'; c.beginPath(); c.arc(cx, cy, R0 * 0.76, 0, 7); c.fill();
    c.strokeStyle = '#3a2a18'; c.lineWidth = Math.max(0.8, S * 0.02);
    c.beginPath();
    for (let k = 0; k <= 6; k++) {
      const a = PI * 0.75 + (k / 6) * PI * 1.5;
      c.moveTo(cx + Math.cos(a) * R0 * 0.72, cy + Math.sin(a) * R0 * 0.72);
      c.lineTo(cx + Math.cos(a) * R0 * (k % 3 ? 0.6 : 0.52), cy + Math.sin(a) * R0 * (k % 3 ? 0.6 : 0.52));
    }
    c.stroke();
    c.strokeStyle = '#d4202a'; c.lineWidth = Math.max(1, S * 0.03); c.beginPath(); c.arc(cx, cy, R0 * 0.66, PI * 1.95, PI * 2.25); c.stroke();
    const a = PI * 0.75 + (0.25 + hash(seed + 5) * 0.6) * PI * 1.5;
    c.strokeStyle = '#b3121c'; c.lineWidth = Math.max(1, S * 0.035); c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - Math.cos(a) * R0 * 0.15, cy - Math.sin(a) * R0 * 0.15); c.lineTo(cx + Math.cos(a) * R0 * 0.62, cy + Math.sin(a) * R0 * 0.62); c.stroke();
    c.fillStyle = '#2a1d10'; c.beginPath(); c.arc(cx, cy, R0 * 0.12, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = Math.max(1, S * 0.03);
    c.beginPath(); c.arc(cx, cy, R0 * 0.6, PI * 1.1, PI * 1.45); c.stroke();
  }
  function gear(c, S) {
    const cx = S / 2, cy = S / 2, ro = S * 0.32, ri = S * 0.24, n = 8;
    c.fillStyle = 'rgba(0,0,0,0.3)';
    const shape = (ox, oy) => {
      c.beginPath();
      for (let k = 0; k < n * 2; k++) {
        const a0 = (k / (n * 2)) * PI * 2, a1 = ((k + 1) / (n * 2)) * PI * 2, rad = k % 2 ? ri : ro;
        c.lineTo(ox + Math.cos(a0) * rad, oy + Math.sin(a0) * rad); c.lineTo(ox + Math.cos(a1) * rad, oy + Math.sin(a1) * rad);
      }
      c.closePath();
    };
    shape(cx + S * 0.03, cy + S * 0.04); c.fill();
    const g = c.createRadialGradient(cx - ro * 0.4, cy - ro * 0.4, ro * 0.1, cx, cy, ro);
    g.addColorStop(0, '#fff0b8'); g.addColorStop(0.6, '#c8902f'); g.addColorStop(1, '#6e4514');
    c.fillStyle = g; shape(cx, cy); c.fill();
    c.fillStyle = '#3a2408'; c.beginPath(); c.arc(cx, cy, S * 0.09, 0, 7); c.fill();
    c.strokeStyle = 'rgba(80,50,10,0.6)'; c.lineWidth = Math.max(1, S * 0.025); c.beginPath(); c.arc(cx, cy, ri * 0.7, 0, 7); c.stroke();
  }
  function valve(c, S, joins) {
    const cx = S / 2, cy = S / 2, rw = S * 0.22;
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = Math.max(1.2, S * 0.07);
    c.beginPath(); c.arc(cx + S * 0.03, cy + S * 0.04, rw, 0, 7); c.stroke();
    c.strokeStyle = '#c42a22'; c.lineWidth = Math.max(1, S * 0.05);
    c.beginPath();
    for (let k = 0; k < 4; k++) { const a = PI / 4 + (k * PI) / 2; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * rw, cy + Math.sin(a) * rw); }
    c.stroke();
    c.strokeStyle = '#e0453a'; c.lineWidth = Math.max(1.2, S * 0.07); c.beginPath(); c.arc(cx, cy, rw, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(255,200,190,0.8)'; c.lineWidth = Math.max(0.8, S * 0.025); c.beginPath(); c.arc(cx, cy, rw, PI * 1.1, PI * 1.5); c.stroke();
    bolt(c, S, 0.09);
  }
  function bolt(c, S, size) {
    const cx = S / 2, cy = S / 2, rb = S * (size || 0.13);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(cx + S * 0.02, cy + S * 0.03, rb * 1.1, 0, 7); c.fill();
    const g = c.createLinearGradient(cx - rb, cy - rb, cx + rb, cy + rb);
    g.addColorStop(0, '#fff0b8'); g.addColorStop(1, '#7a4f17');
    c.fillStyle = g;
    c.beginPath();
    for (let k = 0; k < 6; k++) { const a = PI / 6 + (k * PI) / 3; c.lineTo(cx + Math.cos(a) * rb, cy + Math.sin(a) * rb); }
    c.closePath(); c.fill();
    c.strokeStyle = '#4a2e0a'; c.lineWidth = Math.max(0.8, S * 0.02); c.stroke();
  }
  // rooftop clutter above a Skyline roofline: a spire and beacon on the lead block,
  // water towers, air-con boxes and railings elsewhere
  function rooftop(c, S, base, roof, lead, seed) {
    if (lead) {
      c.fillStyle = shade(base, -0.12);
      c.fillRect(S * 0.26, roof * 0.6, S * 0.48, roof * 0.4 + 1);
      c.fillRect(S * 0.36, roof * 0.3, S * 0.28, roof * 0.31 + 1);
      c.fillStyle = shade(base, 0.25);
      c.fillRect(S * 0.26, roof * 0.6, S * 0.48, Math.max(1, S * 0.025));
      c.fillRect(S * 0.36, roof * 0.3, S * 0.28, Math.max(1, S * 0.025));
      c.strokeStyle = '#c7cbd8'; c.lineWidth = Math.max(1, S * 0.03);
      c.beginPath(); c.moveTo(S * 0.5, roof * 0.3); c.lineTo(S * 0.5, S * 0.06); c.stroke();
      c.save(); c.shadowColor = '#ff4040'; c.shadowBlur = S * 0.15;
      c.fillStyle = '#ff5050'; c.beginPath(); c.arc(S * 0.5, S * 0.06, Math.max(1, S * 0.045), 0, 7); c.fill();
      c.restore();
      return;
    }
    const kind = Math.floor(hash(seed) * 4);
    if (kind === 0) {
      const x = S * (0.52 + hash(seed + 1) * 0.12), w = S * 0.22;
      c.strokeStyle = '#4b3a2c'; c.lineWidth = Math.max(1, S * 0.025);
      c.beginPath(); c.moveTo(x + w * 0.15, roof * 0.55); c.lineTo(x + w * 0.1, roof); c.moveTo(x + w * 0.85, roof * 0.55); c.lineTo(x + w * 0.9, roof); c.stroke();
      c.fillStyle = '#8a5a38'; c.fillRect(x, roof * 0.22, w, roof * 0.38);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, roof * 0.4, w, Math.max(1, S * 0.02));
      c.fillStyle = '#6b4329'; c.beginPath(); c.moveTo(x - 1, roof * 0.24); c.lineTo(x + w / 2, roof * 0.02); c.lineTo(x + w + 1, roof * 0.24); c.closePath(); c.fill();
    } else if (kind === 1) {
      const x = S * (0.14 + hash(seed + 2) * 0.2), w = S * 0.3, y = roof * 0.4;
      c.fillStyle = '#8e97aa'; c.fillRect(x, y, w, roof - y);
      c.fillStyle = '#5d6577'; c.beginPath(); c.arc(x + w * 0.35, y + (roof - y) / 2, (roof - y) * 0.32, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x, y, w, Math.max(1, S * 0.02));
    } else if (kind === 2) {
      c.strokeStyle = shade(base, -0.4); c.lineWidth = Math.max(1, S * 0.02);
      c.beginPath(); c.moveTo(0, roof * 0.45); c.lineTo(S, roof * 0.45);
      for (let x = S * 0.12; x < S; x += S * 0.25) { c.moveTo(x, roof * 0.45); c.lineTo(x, roof); }
      c.stroke();
    }
  }

  Object.assign(Rn.SKINS, SKINS);
})(window.SB);
