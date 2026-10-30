// Stackbound title logo: STACK over BOUND, every letter built from real falling pieces.
// Each letter is an exact tiling (four-block pieces, plus one domino where the count needs it), solved so the
// pieces can drop straight down in order. Drawn as one wordmark: dark outline, slab depth, a lit face
// with faint seams between pieces, and a sheen that sweeps across now and then.
// Clicking the finished logo fills every gap with fast pieces until the rows are full, clears them,
// and pays the secret (SB.Ach 'credits').
'use strict';
(function (SB) {
  // per letter: pieces in drop order, "shape:xyxy..." with cells on a 6x8 letter grid
  const GLYPHS = {
    S: 'J:06071727 J:16263637 Z:46475556 T:43444554 S:02031314 O:23243334 T:01111221 L:31415051 I:10203040',
    T: 'L:25262737 L:24343536 J:23313233 J:01112122 O:40415051 I:00102030',
    A: 'D2:0717 L:35454647 I:54555657 Z:15162425 J:04050614 S:34434453 L:01020313 T:10111221 O:41425152 T:20303140',
    C: 'O:16172627 J:36374757 Z:05061415 D2:4656 T:02030413 T:01111221 L:31415051 I:10203040',
    K: 'O:06071617 O:46475657 J:05131415 Z:24343545 I:01020304 S:23323342 L:00101112 O:40415051',
    B: 'T:07161727 Z:26363747 T:04050615 O:45465556 L:14243334 J:42434452 J:02031323 S:00011112 I:21314151 I:10203040',
    O: 'J:16172737 J:26364647 Z:05061415 S:44455556 I:01020304 T:43525354 I:10111213 T:31414251 L:20213040',
    U: 'Z:06161727 S:37464756 D2:2636 J:05131415 O:44455455 I:01020304 I:40414243 I:50515253 L:00101112',
    N: 'O:06071617 Z:36464757 T:45545556 S:05141524 T:33343544 L:03041323 I:40414243 I:50515253 J:01021222 Z:00101121',
    D: 'J:06071727 O:36374647 Z:05151626 S:44455556 L:02030414 T:43525354 D2:1213 T:31414251 J:00011121 I:10203040',
  };
  const WORDS = ['STACK', 'BOUND'];
  // a cool word over a warm one: the same cyan and gold the menus use
  const HUES = [['#45e3ff', '#3cbcff', '#5b93ff', '#8a72ff', '#b462ff'], ['#ffd43d', '#ffb63a', '#ff9541', '#ff7651', '#ff5a72']];
  const LW = 6, LH = 8, GAP = 1, ROWGAP = 2;
  const GW = WORDS[0].length * (LW + GAP) - GAP; // 34
  const GH = LH * 2 + ROWGAP; // 18
  const HEAD = 3; // rows of headroom above the logo, so pieces are seen falling in
  const PAD = 0.6; // cells of margin for the outline and depth

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const css = (c, a) => (a === undefined ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`);
  const WHITE = [255, 255, 255], INK = [13, 11, 31];

  // the logo's pieces in grid coordinates (x across 0..GW, y down 0..GH)
  function build() {
    const pieces = [], letters = [];
    WORDS.forEach((word, row) => {
      [...word].forEach((ch, li) => {
        const ox = li * (LW + GAP), oy = row * (LH + ROWGAP);
        const base = hex(HUES[row][li]);
        const L = { ch, row, li, ox, oy, top: hex(HUES[row][li]), face: [mix(base, WHITE, 0.32), base, mix(base, INK, 0.12)], side: mix(base, INK, 0.58) };
        letters.push(L);
        GLYPHS[ch].split(' ').forEach((tok, order) => {
          const [shape, xy] = tok.split(':');
          const cells = [];
          for (let i = 0; i < xy.length; i += 2) cells.push([ox + +xy[i], oy + +xy[i + 1]]);
          pieces.push({ shape, cells, L, order, set: new Set(cells.map((c) => c[0] + ',' + c[1])) });
        });
      });
    });
    return { pieces, letters };
  }

  // tile the empty cells of each word's band with random pieces, bottom up, so the rows can fill and clear
  const FILL_SHAPES = (() => {
    const out = [];
    const add = (k, cells) => {
      let cur = cells;
      const seen = new Set();
      for (let r = 0; r < 4; r++) {
        cur = cur.map(([x, y]) => [-y, x]);
        const mx = Math.min(...cur.map((c) => c[0])), my = Math.min(...cur.map((c) => c[1]));
        const n = cur.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
        const key = JSON.stringify(n);
        if (!seen.has(key)) { seen.add(key); out.push({ k, cells: n }); }
      }
    };
    for (const k of SB.CORE_SHAPES) add(k, SB.SHAPES[k].cells);
    for (const k of ['I3', 'L3', 'D2', 'M1']) add(k, SB.SHAPES[k].cells);
    return out;
  })();
  function fillers(filled) {
    const out = [];
    const taken = new Set(filled);
    for (let row = 0; row < 2; row++) {
      const y0 = row * (LH + ROWGAP), y1 = y0 + LH - 1;
      for (let y = y1; y >= y0; y--) {
        for (let x = 0; x < GW; x++) {
          if (taken.has(x + ',' + y)) continue;
          // bigger pieces first, in a shuffled order, anchored on this cell (the lowest, leftmost cell of the piece)
          const opts = FILL_SHAPES.slice().sort((a, b) => b.cells.length - a.cells.length || Math.random() - 0.5);
          for (const o of opts) {
            const ay = Math.max(...o.cells.map((c) => c[1]));
            const ax = Math.min(...o.cells.filter((c) => c[1] === ay).map((c) => c[0]));
            const cells = o.cells.map(([cx, cy]) => [x + cx - ax, y + cy - ay]);
            if (cells.every(([cx, cy]) => cx >= 0 && cx < GW && cy >= y0 && cy <= y1 && !taken.has(cx + ',' + cy))) {
              cells.forEach(([cx, cy]) => taken.add(cx + ',' + cy));
              out.push({ shape: o.k, cells, set: new Set(cells.map((c) => c[0] + ',' + c[1])), color: hex(SB.SHAPES[o.k].color), bottom: y });
              break;
            }
          }
        }
      }
    }
    return out;
  }

  const Logo = (SB.Logo = { state: null });

  // falls with gravity from above the logo; returns the y offset in cells (0 once landed)
  const FALL = 0.26;
  const fallOff = (t, h) => (t >= FALL ? 0 : -h * (1 - (t / FALL) * (t / FALL)));

  Logo.mount = function (cv, opts) {
    opts = opts || {};
    const ctx = cv.getContext('2d');
    const { pieces, letters } = build();
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const st = (Logo.state = { phase: 'idle', t0: performance.now(), pieces, letters, fill: [], parts: [], cleared: false, cv, onIntroDone: opts.onIntroDone || null });
    let cs = 0, dpr = 1;

    // the intro: every letter builds at once, a piece every 0.15s, bottom piece first
    const schedule = (speed) => {
      pieces.forEach((p) => { p.start = (p.L.li * 0.07 + p.L.row * 0.05 + p.order * 0.15) * speed; p.h = HEAD + p.L.oy + 4 + Math.random() * 2; p.flash = 0; });
      st.introEnd = Math.max(...pieces.map((p) => p.start)) + FALL + 0.15;
    };
    const intro = opts.intro && !reduce;
    if (intro) { schedule(1); st.phase = 'intro'; } else pieces.forEach((p) => { p.start = -10; p.h = 0; });

    const size = () => {
      const w = Math.min(cv.parentElement.clientWidth || 360, 620);
      const cap = window.innerHeight < 700 ? 11 : window.innerHeight < 820 ? 13 : 16;
      cs = Math.max(6, Math.min(cap, Math.floor(w / (GW + 2 * PAD))));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.round((GW + 2 * PAD) * cs), H = Math.round((GH + HEAD + 2 * PAD + 0.4) * cs);
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        cv.style.width = W + 'px'; cv.style.height = H + 'px';
        cv.style.marginTop = -Math.round(HEAD * cs) + 'px';
      }
    };
    // grid cell to canvas pixels
    // snapped to whole pixels so neighbouring cells meet without hairline seams
    const X = (x) => Math.round(x * cs) + Math.round(PAD * cs), Y = (y) => Math.round(y * cs) + Math.round((PAD + HEAD) * cs);
    const D = 0.36; // slab depth, in cells

    // draws a set of placed cells: pass 0 outline, 1 depth, 2 face, 3 bevel and seams
    const drawSet = (list, pass, el) => {
      const o = Math.max(1.5, cs * 0.16), d = cs * D;
      for (const p of list) {
        const dy = p.dy || 0;
        if (p.hidden) continue;
        const L = p.L;
        for (const [x, y] of p.cells) {
          const px = X(x), py = Y(y + dy);
          if (pass === 0) { ctx.fillStyle = css(INK); ctx.fillRect(px - o, py - o, cs + 2 * o, cs + d + 2 * o); }
          else if (pass === 1) { ctx.fillStyle = css(L ? L.side : mix(p.color, INK, 0.55)); ctx.fillRect(px, py + d * 0.5, cs, cs + d * 0.5); }
          else if (pass === 2) {
            let top, bot;
            if (L) {
              // one smooth gradient down the whole letter, light at the top
              const f0 = (y - L.oy) / LH, f1 = (y + 1 - L.oy) / LH;
              const at = (f) => (f < 0.5 ? mix(L.face[0], L.face[1], f * 2) : mix(L.face[1], L.face[2], (f - 0.5) * 2));
              top = at(f0); bot = at(f1);
            } else { top = mix(p.color, WHITE, 0.18); bot = mix(p.color, INK, 0.1); }
            if (p.flash > 0) { top = mix(top, WHITE, p.flash); bot = mix(bot, WHITE, p.flash); }
            const g = ctx.createLinearGradient(0, py, 0, py + cs);
            g.addColorStop(0, css(top)); g.addColorStop(1, css(bot));
            ctx.fillStyle = g; ctx.fillRect(px, py, cs, cs);
          } else {
            // bevel on each piece's own outline: light along the top and left, shade along the bottom and right
            const has = (a, b) => p.set.has(a + ',' + b);
            const w = Math.max(1, cs * 0.12);
            if (!has(x, y - 1)) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(px, py, cs, w); }
            if (!has(x - 1, y)) { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(px, py, w, cs); }
            if (!has(x, y + 1)) { ctx.fillStyle = 'rgba(10,8,30,0.34)'; ctx.fillRect(px, py + cs - w, cs, w); }
            if (!has(x + 1, y)) { ctx.fillStyle = 'rgba(10,8,30,0.22)'; ctx.fillRect(px + cs - w, py, w, cs); }
          }
        }
      }
    };

    const sheen = (el) => {
      // a soft band of light sweeps across the faces every few seconds
      const per = 6.5, t = (el % per) / 1.1;
      if (t > 1) return;
      const span = (GW + GH) * cs, cx = -0.3 * span + t * 1.6 * span;
      ctx.save();
      ctx.beginPath();
      for (const p of pieces) if (!p.hidden && !p.dy) for (const [x, y] of p.cells) ctx.rect(X(x), Y(y), cs, cs);
      ctx.clip();
      const g = ctx.createLinearGradient(cx - cs * 4, 0, cx + cs * 4, cs * 6);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.38)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.restore();
    };

    const draw = (now) => {
      size();
      const el = (now - st.t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cv.width / dpr, cv.height / dpr);
      // where every piece is right now
      for (const p of pieces) {
        const t = el - p.start;
        p.hidden = st.cleared || t < 0;
        p.dy = p.hidden ? 0 : fallOff(t, p.h);
        if (!p.landed && t >= FALL) { p.landed = true; p.flash = 0.55; }
        if (p.flash > 0) p.flash = Math.max(0, p.flash - 0.035);
      }
      for (const f of st.fill) {
        const t = el - f.start;
        f.hidden = t < 0 || f.gone;
        f.dy = f.hidden ? 0 : t >= f.fall ? 0 : -f.h * (1 - (t / f.fall) * (t / f.fall));
        if (f.flash > 0) f.flash = Math.max(0, f.flash - 0.05);
      }
      const all = st.fill.length ? pieces.concat(st.fill) : pieces;
      // soft drop shadow under the whole wordmark
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = cs * 1.1; ctx.shadowOffsetY = cs * 0.5;
      drawSet(all, 0, el);
      ctx.restore();
      for (let pass = 1; pass < 4; pass++) drawSet(all, pass, el);
      if (st.phase === 'idle' || st.phase === 'done') sheen(el);
      // the clear: rows go white, then burst
      for (const q of st.parts) {
        q.vy += 40 * q.dt0; q.x += q.vx * q.dt0; q.y += q.vy * q.dt0; q.life -= q.dt0;
        if (q.life <= 0) continue;
        ctx.globalAlpha = Math.min(1, q.life * 2.5);
        ctx.fillStyle = q.c; ctx.fillRect(X(q.x), Y(q.y), q.s * cs, q.s * cs);
      }
      ctx.globalAlpha = 1;
      st.parts = st.parts.filter((q) => q.life > 0);
      for (const r of st.rowFlash || []) {
        const a = r.a(el);
        if (a <= 0) continue;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(X(0) - cs * 0.15, Y(r.y) - cs * 0.15, GW * cs + cs * 0.3, cs * 1.3);
      }
    };

    let last = performance.now();
    const loop = (now) => {
      if (!cv.isConnected) { if (Logo.state === st) Logo.state = null; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      for (const q of st.parts) q.dt0 = dt;
      draw(now);
      const el = (now - st.t0) / 1000;
      if (st.phase === 'intro' && el >= st.introEnd) finishIntro();
      if (st.phase === 'secret') stepSecret(el);
      requestAnimationFrame(loop);
    };
    const finishIntro = () => {
      if (st.phase !== 'intro') return;
      st.phase = 'idle';
      st.endedAt = performance.now();
      st.t0 = st.endedAt - 6150; // the first sheen runs just after the last piece lands
      pieces.forEach((p) => { p.start = -10; p.landed = true; });
      if (st.onIntroDone) { const f = st.onIntroDone; st.onIntroDone = null; f(); }
    };
    st.skip = () => { if (st.phase === 'intro') { pieces.forEach((p) => { p.flash = 0; }); finishIntro(); } };

    // ---- the secret: fill every gap, clear the rows, then build again ----
    const startSecret = () => {
      if (st.phase !== 'idle') return false;
      const el0 = (performance.now() - st.t0) / 1000;
      const filled = [];
      for (const p of pieces) for (const [x, y] of p.cells) filled.push(x + ',' + y);
      st.fill = fillers(filled);
      // bottom rows first, both words at once, a new piece every 14ms
      st.fill.sort((a, b) => (b.bottom % (LH + ROWGAP)) - (a.bottom % (LH + ROWGAP)) || Math.random() - 0.5);
      st.fill.forEach((f, i) => { f.start = el0 + 0.05 + i * 0.014; f.fall = 0.11 + Math.random() * 0.05; f.h = HEAD + 3 + Math.random() * 4; f.flash = 0; });
      st.fillEnd = Math.max(...st.fill.map((f) => f.start + f.fall));
      st.phase = 'secret'; st.stage = 'fill';
      SB.audio.play('hard');
      Logo.secretRuns = (Logo.secretRuns || 0) + 1;
      return true;
    };
    let lastTick = 0;
    const stepSecret = (el) => {
      if (st.stage === 'fill') {
        // a click of sound as pieces land, not on every one
        const landed = st.fill.filter((f) => el >= f.start + f.fall).length;
        if (landed - lastTick >= 6) { lastTick = landed; SB.audio.play('tick', Math.min(11, landed / 8)); }
        if (el >= st.fillEnd + 0.12) {
          st.stage = 'clear';
          // every row of both words lights from the bottom up, then they all burst together
          st.rowFlash = [];
          for (let row = 0; row < 2; row++) for (let y = 0; y < LH; y++) {
            const gy = row * (LH + ROWGAP) + y, d = (LH - 1 - y) * 0.035;
            const t1 = el + d;
            st.rowFlash.push({ y: gy, a: (e) => (e < t1 ? 0 : e < t1 + 0.18 ? (e - t1) / 0.18 : Math.max(0, 1 - (e - t1 - 0.18) / 0.25)) });
          }
          st.burstAt = el + (LH - 1) * 0.035 + 0.2;
          SB.audio.play('quad');
        }
      } else if (st.stage === 'clear' && el >= st.burstAt) {
        st.stage = 'gone';
        st.cleared = true;
        for (const f of st.fill) f.gone = true;
        for (const p of pieces.concat(st.fill)) for (const [x, y] of p.cells) {
          const c = p.L ? css(p.L.face[1]) : css(p.color);
          for (let k = 0; k < 2; k++) st.parts.push({ x: x + Math.random(), y: y + Math.random(), vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 10, s: 0.25 + Math.random() * 0.3, life: 0.6 + Math.random() * 0.5, c, dt0: 0 });
        }
        if (SB.FX && SB.FX.burstAt) SB.FX.burstAt(cv, 60, { spark: true, colors: ['#ffd23b', '#45e3ff', '#ffffff'] });
        SB.audio.play('clear', 4);
        st.rebuildAt = el + 1.1;
        if (Logo.onSecret) Logo.onSecret();
      } else if (st.stage === 'gone' && el >= st.rebuildAt) {
        // the logo builds itself again, a little quicker than the first time
        st.fill = []; st.rowFlash = []; st.cleared = false;
        pieces.forEach((p) => { p.landed = false; });
        schedule(0.7);
        st.t0 = performance.now();
        pieces.forEach((p) => { p.h = HEAD + p.L.oy + 4 + Math.random() * 2; });
        st.phase = 'intro';
        lastTick = 0;
      }
    };
    st.secret = startSecret;
    // the tap that skipped the intro must not also set off the secret
    cv.addEventListener('click', () => { if (st.phase === 'intro' || performance.now() - (st.endedAt || 0) < 500) return; startSecret(); });

    draw(performance.now());
    requestAnimationFrame(loop);
    return st;
  };
})(window.SB);
