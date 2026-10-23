// Flutter: the hidden one-button game behind the Prize Counter's Ticket (tap it five times).
// A winged O piece flaps through the gaps in columns of blocks. A score of 15 earns Frequent Flyer, which opens Paper Plane.
(function (SB) {
  'use strict';
  const F = (SB.Flutter = { isOpen: false });
  const W = 360, CELL = 24, COL = 2 * CELL, GROUND_H = 56, SPACING = 214;
  const BX = 104, BS = 30, HIT = 10; // the piece's x, its size, and the half-size of its hitbox
  const GRAV = 1700, FLAP = -470, MAXFALL = 720;
  const COLORS = ['#35e6ff', '#ffd83b', '#b25cff', '#4dff7c', '#ff4d6a', '#4d8dff', '#ff9a3b'];
  const INK = '#07051a', GOAL = 15;
  const MEDALS = [[15, 'gold'], [10, 'silver'], [5, 'bronze']];
  let root = null, cv = null, ctx = null, raf = 0, last = 0, s = null, onClose = null;
  let H = 640, GROUND = 584, scale = 1, k = 1, sky = null, city = null;
  const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const best = () => (SB.Ach && SB.Ach.stat ? SB.Ach.stat('flutterBest') : 0);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const play = (n, a) => { if (SB.audio && SB.audio.play) SB.audio.play(n, a); };

  // ---------- drawing helpers ----------
  // one block: ink edge, colour face, lit top, shaded bottom
  function cell(c, x, y, w, h, col) {
    c.fillStyle = INK; c.fillRect(x, y, w, h);
    c.fillStyle = col; c.fillRect(x + 2, y + 2, w - 4, h - 4);
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 2, y + 2, w - 4, 3);
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x + 2, y + 5, 3, h - 10);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x + 2, y + h - 5, w - 4, 3);
  }
  function offscreen(w, h) { const o = document.createElement('canvas'); o.width = Math.ceil(w * k); o.height = Math.ceil(h * k); const c = o.getContext('2d'); c.scale(k, k); return [o, c]; }
  // the sky: a deep gradient, a faint block grid and a few stars
  function buildSky() {
    const [o, c] = offscreen(W, H);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0d0a24'); g.addColorStop(0.55, '#1d1650'); g.addColorStop(1, '#3a2a78');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(150,140,255,.05)';
    for (let x = 0; x < W; x += 18) c.fillRect(x, 0, 1, H);
    for (let y = 0; y < H; y += 18) c.fillRect(0, y, W, 1);
    let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 46; i++) { const sz = r() < 0.2 ? 3 : 2; c.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.5})`; c.fillRect(Math.floor(r() * W), Math.floor(r() * (GROUND - 160)), sz, sz); }
    sky = o;
  }
  // a far skyline of block towers that drifts slowly
  function buildCity() {
    const [o, c] = offscreen(W, 200);
    let seed = 31; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let x = 0;
    while (x < W) {
      const w = Math.min(W - x, 24 + Math.floor(r() * 3) * 12), h = 50 + Math.floor(r() * 9) * 14;
      c.fillStyle = '#1a1442'; c.fillRect(x, 200 - h, w, h);
      c.fillStyle = 'rgba(120,110,230,.22)'; c.fillRect(x, 200 - h, w, 3);
      for (let wy = 200 - h + 10; wy < 192; wy += 14) for (let wx = x + 5; wx < x + w - 6; wx += 10) if (r() < 0.35) { c.fillStyle = r() < 0.18 ? 'rgba(255,210,59,.55)' : 'rgba(110,100,220,.35)'; c.fillRect(wx, wy, 4, 5); }
      x += w + 2;
    }
    city = o;
  }
  // the wing: three feathers fanning back from the shoulder
  function wing(c, col) {
    c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 2; c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(1, 0);
    c.quadraticCurveTo(-4, -15, -19, -15);
    c.quadraticCurveTo(-13, -9, -23, -6);
    c.quadraticCurveTo(-14, -2, -21, 4);
    c.quadraticCurveTo(-8, 7, 1, 0);
    c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(7,5,26,.35)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-3, -3); c.lineTo(-15, -9); c.moveTo(-3, 0); c.lineTo(-16, -2); c.stroke();
  }
  function drawPiece(c, x, y, rot, flap) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.save(); c.translate(-3, -6); c.rotate(-flap * 0.8 - 0.15); wing(c, '#a99fe0'); c.restore();
    const h = BS / 2, q = BS / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) cell(c, -h + i * q, -h + j * q, q, q, '#ffd83b');
    c.save(); c.translate(-1, -2); c.rotate(flap); wing(c, '#fbf7ff'); c.restore();
    c.restore();
  }
  function text(str, x, y, size, fill, line) {
    ctx.font = `${size}px "Alfa Slab One", Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = line || Math.max(5, size / 6); ctx.strokeStyle = INK;
    ctx.strokeText(str, x, y + size * 0.08); ctx.strokeText(str, x, y); ctx.fillStyle = fill; ctx.fillText(str, x, y);
  }

  // ---------- state ----------
  function fresh() {
    return { mode: 'ready', t: 0, by: H * 0.42, vy: 0, rot: 0, flapT: 0, ph: 0, cols: [], score: 0, scroll: 0, shake: 0, flash: 0, deadT: 0, shards: [], sparks: [], best: best(), paused: false, shown: false, newBest: false };
  }
  const speed = () => Math.min(212, 150 + s.score * 3);
  const gapSize = () => Math.max(136, 170 - s.score * 2);
  function addCol(x) {
    const gap = gapSize(), prev = s.cols.length ? s.cols[s.cols.length - 1].mid : GROUND / 2;
    const lo = 86 + gap / 2, hi = GROUND - 64 - gap / 2;
    const mid = Math.max(lo, Math.min(hi, prev + rnd(-190, 190)));
    s.cols.push({ x, mid, gap, col: COLORS[Math.floor(Math.random() * COLORS.length)], passed: false });
  }
  function flap() {
    if (s.paused) s.paused = false;
    if (s.mode === 'dead') return;
    if (s.mode === 'ready') { s.mode = 'play'; s.cols = []; addCol(W + 90); }
    s.vy = FLAP; s.flapT = 0.2;
    play('rotate');
    for (let i = 0; i < 3; i++) s.sparks.push({ x: BX - 12, y: s.by + 6, vx: rnd(-90, -40), vy: rnd(20, 90), life: 0.4, col: '#fbf7ff', sz: 3 });
  }
  function die() {
    s.mode = 'dead'; s.deadT = 0; s.flash = 1; s.shake = reduce() ? 0 : 0.32;
    play('harddrop', 1);
    const q = BS / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) s.shards.push({ x: BX - q / 2 + i * q, y: s.by - q / 2 + j * q, vx: rnd(-120, 160) + (i ? 60 : -60), vy: rnd(-420, -220), r: s.rot, vr: rnd(-9, 9) });
    const was = s.best;
    if (SB.Ach) { SB.Ach.best('flutterBest', s.score); if (SB.meta && SB.meta.save) SB.meta.save(); SB.Ach.check(); }
    s.best = Math.max(was, s.score);
    s.newBest = s.score > was && s.score > 0;
  }
  function hits(c) {
    const top = c.mid - c.gap / 2, bot = c.mid + c.gap / 2;
    const x0 = BX - HIT, x1 = BX + HIT, y0 = s.by - HIT, y1 = s.by + HIT;
    const over = (ax, bx, ay, by) => x1 > ax && x0 < bx && y1 > ay && y0 < by;
    const lip = CELL / 2;
    return over(c.x, c.x + COL, -100, top - CELL) || over(c.x - lip, c.x + COL + lip, top - CELL, top)
      || over(c.x - lip, c.x + COL + lip, bot, bot + CELL) || over(c.x, c.x + COL, bot + CELL, GROUND);
  }
  function step(dt) {
    s.t += dt;
    s.flash = Math.max(0, s.flash - dt * 3); s.shake = Math.max(0, s.shake - dt);
    s.flapT = Math.max(0, s.flapT - dt); s.ph += dt * (s.flapT > 0 ? 34 : 7);
    for (const p of s.sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    s.sparks = s.sparks.filter((p) => p.life > 0);
    if (s.mode === 'ready') { s.by = H * 0.42 + Math.sin(s.t * 3.2) * 9; s.rot = 0; s.scroll += 90 * dt; return; }
    if (s.mode === 'dead') {
      s.deadT += dt;
      for (const p of s.shards) {
        p.vy += GRAV * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        if (p.y > GROUND - 7) { p.y = GROUND - 7; p.vy *= -0.35; p.vx *= 0.7; p.vr *= 0.6; }
      }
      if (s.deadT > 0.6 && !s.shown) showOver();
      return;
    }
    const v = speed();
    s.scroll += v * dt;
    s.vy = Math.min(MAXFALL, s.vy + GRAV * dt); s.by += s.vy * dt;
    if (s.by < HIT + 2) { s.by = HIT + 2; s.vy = 0; }
    const want = s.vy < 0 ? -0.42 : Math.min(1.25, s.vy / 560);
    s.rot += (want - s.rot) * Math.min(1, dt * (s.vy < 0 ? 18 : 6));
    for (const c of s.cols) {
      c.x -= v * dt;
      if (!c.passed && c.x + COL < BX - HIT) {
        c.passed = true; s.score++;
        play('coin', s.score % 8);
        for (let i = 0; i < 6; i++) s.sparks.push({ x: c.x + COL, y: c.mid + rnd(-20, 20), vx: rnd(-40, 80), vy: rnd(-120, 60), life: 0.5, col: s.score >= GOAL ? '#ffd23b' : c.col, sz: 4 });
        if (s.score === GOAL) { play('unlock'); s.flash = 0.6; }
      }
    }
    s.cols = s.cols.filter((c) => c.x > -COL - CELL);
    const lastC = s.cols[s.cols.length - 1];
    if (!lastC || lastC.x < W - SPACING) addCol((lastC ? lastC.x : W) + SPACING);
    if (s.by + HIT >= GROUND) { s.by = GROUND - HIT; return die(); }
    for (const c of s.cols) if (hits(c)) return die();
  }

  // ---------- drawing ----------
  function drawCol(c) {
    const top = c.mid - c.gap / 2, bot = c.mid + c.gap / 2, lip = CELL / 2;
    for (let y = top - 2 * CELL; y > -CELL; y -= CELL) { cell(ctx, c.x, y, CELL, CELL, c.col); cell(ctx, c.x + CELL, y, CELL, CELL, c.col); }
    for (let i = 0; i < 3; i++) cell(ctx, c.x - lip + i * CELL, top - CELL, CELL, CELL, c.col);
    for (let i = 0; i < 3; i++) cell(ctx, c.x - lip + i * CELL, bot, CELL, CELL, c.col);
    for (let y = bot + CELL; y < GROUND; y += CELL) { cell(ctx, c.x, y, CELL, CELL, c.col); cell(ctx, c.x + CELL, y, CELL, CELL, c.col); }
  }
  function drawGround() {
    const off = -(s.scroll % CELL);
    for (let x = off; x < W; x += CELL) cell(ctx, x, GROUND, CELL, CELL, '#5f55b8');
    for (let y = GROUND + CELL; y < H; y += CELL) for (let x = off - CELL / 2; x < W; x += CELL) cell(ctx, x, y, CELL, CELL, '#2b2557');
    ctx.fillStyle = INK; ctx.fillRect(0, GROUND - 2, W, 2);
  }
  function draw() {
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (s.shake > 0) ctx.translate(rnd(-1, 1) * s.shake * 22, rnd(-1, 1) * s.shake * 22);
    ctx.drawImage(sky, 0, 0, W, H);
    const cx = -((s.scroll * 0.22) % W);
    ctx.drawImage(city, cx, GROUND - 200, W, 200); ctx.drawImage(city, cx + W, GROUND - 200, W, 200);
    for (const c of s.cols) drawCol(c);
    drawGround();
    for (const p of s.sparks) { ctx.globalAlpha = Math.min(1, p.life * 3); cell(ctx, p.x, p.y, p.sz + 4, p.sz + 4, p.col); }
    ctx.globalAlpha = 1;
    if (s.mode === 'dead') for (const p of s.shards) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); cell(ctx, -BS / 4, -BS / 4, BS / 2, BS / 2, '#ffd83b'); ctx.restore(); }
    else drawPiece(ctx, BX, s.by, s.rot, Math.sin(s.ph) * (s.flapT > 0 ? 0.75 : 0.28) - 0.1);
    if (s.mode === 'ready') {
      text('FLUTTER', W / 2, H * 0.2, 50, '#ffd23b', 9);
      if (s.best > 0) text(`Best ${s.best}`, W / 2, H * 0.2 + 46, 20, '#fff3d8', 5);
      // a pulsing up-arrow under the piece: tap to flap
      const a = 0.55 + Math.sin(s.t * 6) * 0.45, y = s.by + 58;
      ctx.globalAlpha = a; ctx.fillStyle = '#fff3d8'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(BX, y - 14); ctx.lineTo(BX + 13, y + 1); ctx.lineTo(BX + 5, y + 1); ctx.lineTo(BX + 5, y + 13); ctx.lineTo(BX - 5, y + 13); ctx.lineTo(BX - 5, y + 1); ctx.lineTo(BX - 13, y + 1); ctx.closePath();
      ctx.stroke(); ctx.fill(); ctx.globalAlpha = 1;
    } else {
      text(String(s.score), W / 2, 74, 54, s.score >= GOAL ? '#ffd23b' : '#ffffff', 10);
    }
    if (s.paused) {
      ctx.fillStyle = 'rgba(7,5,26,.55)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff3d8'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      for (const x of [W / 2 - 16, W / 2 + 4]) { ctx.fillRect(x, H / 2 - 22, 12, 44); ctx.strokeRect(x, H / 2 - 22, 12, 44); }
    }
    if (s.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.55})`; ctx.fillRect(-30, -30, W + 60, H + 60); }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    let dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (!s.paused) while (dt > 0) { const h = Math.min(dt, 1 / 120); step(h); dt -= h; }
    draw();
  }

  // ---------- the score card ----------
  function medal(n) { const m = MEDALS.find(([v]) => n >= v); return m ? m[1] : ''; }
  function showOver() {
    s.shown = true;
    const md = medal(s.score), o = root.querySelector('.fl-over');
    o.innerHTML = `<div class="fl-card">
        <div class="fl-medal ${md || 'none'}">${md ? SB.ico('feathered-wing') : ''}</div>
        <dl><dt>Score</dt><dd>${s.score}</dd><dt>Best</dt><dd>${s.best}${s.newBest ? '<em>New</em>' : ''}</dd></dl>
      </div>
      <div class="fl-btns"><button class="big primary" data-fl="retry">Retry</button><button class="big" data-fl="leave">Leave</button></div>`;
    o.hidden = false;
    requestAnimationFrame(() => o.classList.add('in'));
    if (s.newBest) play('levelup');
  }
  function retry() {
    const o = root.querySelector('.fl-over'); o.classList.remove('in'); o.hidden = true; o.innerHTML = '';
    s = fresh();
  }

  // ---------- sizing ----------
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    if (!s || s.mode === 'ready') { H = Math.round(Math.max(560, Math.min(760, (W * vh) / vw))); GROUND = H - GROUND_H; }
    scale = Math.min(vw / W, vh / H);
    k = Math.min(4, scale * Math.min(2, window.devicePixelRatio || 1));
    cv.width = Math.round(W * k); cv.height = Math.round(H * k);
    cv.style.width = `${Math.round(W * scale)}px`; cv.style.height = `${Math.round(H * scale)}px`;
    buildSky(); buildCity();
    if (s && s.mode === 'ready') s.by = H * 0.42;
  }

  // ---------- input ----------
  function act(e) {
    if (s.mode === 'dead') { if (s.shown && s.deadT > 0.9) retry(); return; }
    flap();
  }
  function onKey(e) {
    if (!F.isOpen) return;
    e.stopPropagation();
    const code = e.code;
    if (e.target && e.target.tagName === 'BUTTON' && (code === 'Enter' || code === 'Space')) return;
    e.preventDefault();
    if (e.repeat) return;
    if (code === 'Escape' || code === 'Backspace') return F.close();
    const km = SB.UI && SB.UI.keyMap ? SB.UI.keyMap() : {};
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW' || code === 'Enter' || ['hard', 'cw', 'ccw'].includes(km[code])) act();
    else if (code === 'KeyP' || km[code] === 'pause') { if (s.mode === 'play') s.paused = !s.paused; }
  }
  function swallow(e) { if (!F.isOpen) return; e.stopPropagation(); if (!(e.target && e.target.tagName === 'BUTTON')) e.preventDefault(); }
  function onDown(e) {
    e.stopPropagation();
    const b = e.target.closest('button');
    if (b) return;
    e.preventDefault();
    act();
  }
  function onClick(e) {
    const b = e.target.closest('[data-fl]');
    if (!b) return;
    e.stopPropagation();
    play('tap');
    if (b.dataset.fl === 'retry') retry();
    else if (b.dataset.fl === 'leave') F.close();
  }
  function onVis() { if (document.hidden && s && s.mode === 'play') s.paused = true; }

  // ---------- opening and closing ----------
  F.open = function (opts) {
    if (F.isOpen) return;
    onClose = (opts && opts.onClose) || null;
    if (SB.audio && SB.audio.init) SB.audio.init();
    root = document.createElement('div');
    root.id = 'flutter';
    root.innerHTML = `<div class="fl-stage"><canvas class="fl-cv"></canvas><div class="fl-over" hidden></div></div>
      <button class="fl-x" data-fl="leave" aria-label="Leave">${SB.glyph('x')}</button>`;
    document.getElementById('app').appendChild(root);
    cv = root.querySelector('canvas'); ctx = cv.getContext('2d');
    s = null; fit(); s = fresh();
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('click', onClick);
    for (const ev of ['pointerup', 'pointermove', 'touchstart', 'touchend', 'touchmove', 'mousedown', 'wheel', 'contextmenu']) root.addEventListener(ev, (e) => e.stopPropagation());
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', swallow, true);
    window.addEventListener('resize', fit);
    document.addEventListener('visibilitychange', onVis);
    F.isOpen = true;
    document.body.classList.add('flutter-open');
    play('open');
    last = performance.now();
    raf = requestAnimationFrame(frame);
    requestAnimationFrame(() => root && root.classList.add('in'));
  };
  F.close = function () {
    if (!F.isOpen) return;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', swallow, true);
    window.removeEventListener('resize', fit);
    document.removeEventListener('visibilitychange', onVis);
    F.isOpen = false;
    document.body.classList.remove('flutter-open');
    root.remove(); root = cv = ctx = null; s = null;
    play('close');
    const cb = onClose; onClose = null;
    if (cb) cb();
  };
  // for tests: the live state
  F.state = () => s;
  F.flap = () => flap();
})(window.SB);
