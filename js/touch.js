// Stackbound touch controls: the on-screen pad, swipe gestures on the board, and press-and-hold tooltips.
// Works for real Stacks and for the tutorial's practice board. Keyboard play is untouched.
'use strict';
(function (SB) {
  const UI = SB.UI;
  const $ = (s, el) => (el || document).querySelector(s);

  // a phone or tablet: touch is the main input (a touchscreen laptop with a mouse stays on the desktop layout)
  const mq = (q) => !!(window.matchMedia && matchMedia(q).matches);
  UI.touch = mq('(pointer: coarse)') || (navigator.maxTouchPoints > 0 && !mq('(any-pointer: fine)'));
  document.documentElement.classList.toggle('touch', !!UI.touch);
  // what the last press came from, so touch taps can skip mouse-only behaviour (hover leaving, etc.)
  document.addEventListener('pointerdown', (e) => { UI.lastPointer = e.pointerType; }, true);

  // ---------- pad icons ----------
  const P = {
    left: 'M15 5 8 12l7 7',
    right: 'M9 5l7 7-7 7',
    soft: 'M6 9l6 6 6-6',
    hard: 'M6 5l6 6 6-6M6 12l6 6 6-6M5 21h14',
    cw: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
    ccw: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5',
    hold: 'M7 7h10v10H7zM4 4h4M4 4v4M20 20h-4M20 20v-4',
    pause: 'M9 6v12M15 6v12',
    pad: 'M7 8h10a5 5 0 0 1 4.6 7l-1.2 2.6a2.6 2.6 0 0 1-4.3.6L14.3 16H9.7l-1.8 2.2a2.6 2.6 0 0 1-4.3-.6L2.4 15A5 5 0 0 1 7 8zM8 10.5v3M6.5 12h3M15.5 11.5h.01M17.5 13h.01',
  };
  UI.padIco = (k) => `<svg class="pad-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[k]}"/></svg>`;
  UI.padHtml = function (extra) {
    const b = (k, label, cls) => `<button class="pad pad-${k} ${cls || ''}" data-pad="${k}" aria-label="${label}">${UI.padIco(k)}<span>${label}</span></button>`;
    return `<div class="m-pad ${extra || ''}" id="mPad">
      <div class="pad-move">${b('left', 'Left')}${b('soft', 'Down')}${b('right', 'Right')}${b('hold', 'Hold', 'wide')}</div>
      <div class="pad-act">${b('ccw', 'Turn left')}${b('cw', 'Turn right')}${b('hard', 'Drop', 'wide')}</div>
    </div>`;
  };

  // the game the controls drive right now: the practice board in the tutorial, else the live Stack
  function target() {
    const tg = UI.screen === 'tutorial' && UI.tut && UI.tut.game;
    if (tg) return { g: tg, tut: true };
    if (UI.screen === 'play' && UI.game && !UI.modal) return { g: UI.game, tut: false };
    return null;
  }
  const canAct = (t) => t && t.g.status === 'playing' && (t.tut || !(UI.countdown > 0));
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* no haptics */ } };

  function act(name, down, el) {
    if (name === 'pause') { if (down && UI.screen === 'play') UI.pause(); return; }
    if (name === 'live') { if (down && UI.screen === 'play' && UI.game && !UI.modal) UI.useLive(+el.dataset.i); return; }
    const t = target();
    if (name === 'left' || name === 'right') {
      const dir = name === 'left' ? -1 : 1;
      UI.input[name] = down;
      if (down) {
        UI.input.lastDir = dir;
        if (canAct(t)) { t.g.move(dir); t.g.das = { dir, t: 0, arrAcc: 0 }; }
      }
      return;
    }
    if (name === 'soft') { UI.input.down = down; return; }
    if (!down || !canAct(t)) return;
    if (name === 'hard') { t.g.hardDrop(); buzz(12); }
    else if (name === 'cw') t.g.rotate(1);
    else if (name === 'ccw') t.g.rotate(-1);
    else if (name === 'hold') t.g.hold();
  }

  // ---------- pad buttons ----------
  const held = new Map();
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-pad]');
    if (!b) return;
    e.preventDefault();
    SB.audio.init();
    held.set(e.pointerId, b);
    b.classList.add('on');
    try { b.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    act(b.dataset.pad, true, b);
  });
  const release = (e) => {
    const b = held.get(e.pointerId);
    if (!b) return;
    held.delete(e.pointerId);
    b.classList.remove('on');
    act(b.dataset.pad, false, b);
  };
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);

  // ---------- gestures ----------
  // The whole play area is a touch surface (everything but the info strip and buttons):
  //  swipe left/right .......... move a column per finger step; a quick swipe held still keeps sliding
  //  tap ....................... turn: right of the board's middle clockwise, left of it the other way (taps never drop)
  //  press and hold ............ Hold / swap
  //  slow swipe down ........... fast drop (soft drop) while the finger moves down and stays on the screen
  //  fast swipe down ........... quick drop (hard drop) the moment the finger lifts; a fast swipe up holds
  // A gesture locks to one axis once it moves, so a flick down never nudges the piece sideways.
  // Finger travel per column is a fixed physical distance (Settings > Swipe sensitivity) rather than a share of
  // the cell size, so small screens get the same precision as big ones. A column is entered past 0.7 of a step and
  // only left again 0.4 of a step back, so a finger resting on a boundary or rolling as it lifts never jitters.
  const SLIDE_REST = 250, LONG_PRESS = 360, TAP_SLOP = 12, ENTER = 0.7, SLIDE_SPEED = 0.4;
  // a down swipe is fast (quick drop) when the finger is still moving at least this many px/ms as it lifts
  const FLICK_SPEED = 0.45;
  const STEP_PX = [40, 34, 29, 25, 21];
  UI.SWIPE_NAMES = ['Most precise', 'Precise', 'Balanced', 'Quick', 'Quickest'];
  const sens = () => Math.min(5, Math.max(1, Math.round(SB.meta.data.settings.swipeSens || 3)));
  UI.swipeStep = (cs) => Math.max(STEP_PX[sens() - 1], cs * 0.85);
  UI.dragStep = (cs) => Math.max(20, cs * 0.85);
  let G = null;
  const boardRect = () => { const cv = document.getElementById(UI.screen === 'tutorial' ? 'tutBoard' : 'board'); return cv ? cv.getBoundingClientRect() : null; };
  // a ring that fills under the finger while a press is becoming a Hold
  let ring = null;
  const ringOff = (done) => { if (!ring) return; const el = ring; ring = null; if (done) { el.classList.add('done'); setTimeout(() => el.remove(), 260); } else el.remove(); };
  const ringAt = (x, y) => { ringOff(); ring = document.createElement('div'); ring.className = 'touch-ring'; ring.style.left = x + 'px'; ring.style.top = y + 'px'; ring.style.setProperty('--lp', LONG_PRESS + 'ms'); document.body.appendChild(ring); };
  const ripple = (x, y, cls) => { const el = document.createElement('div'); el.className = 'touch-tap ' + (cls || ''); el.style.left = x + 'px'; el.style.top = y + 'px'; document.body.appendChild(el); setTimeout(() => el.remove(), 420); };
  const stopRepeat = (g0) => {
    if (!g0 || !g0.repeat) return;
    UI.input[g0.repeat < 0 ? 'left' : 'right'] = false;
    g0.repeat = 0;
  };
  // swipe and hold: when a quick swipe of two or more columns stops with the finger still down, the piece keeps
  // sliding using the game's own auto-shift. Slow, careful drags never slide, however long the finger rests.
  const armRepeat = (g0, d) => {
    clearTimeout(g0.repeatTimer);
    if (SB.meta.data.settings.swipeSlide === false || g0.fast !== d || g0.run < 2) return;
    g0.repeatTimer = setTimeout(() => {
      const t = target();
      if (G !== g0 || g0.axis !== 'h' || !canAct(t)) return;
      g0.repeat = d;
      UI.input[d < 0 ? 'left' : 'right'] = true;
      UI.input.lastDir = d;
      t.g.das = { dir: d, t: SB.meta.data.settings.das, arrAcc: 0 };
    }, SLIDE_REST);
  };
  // finger speed (px/ms, signed) over the last 40ms or more of the trail
  const speed = (tr, i) => {
    const last = tr[tr.length - 1];
    let ref = tr[0];
    for (let k = tr.length - 2; k >= 0; k--) if (last[0] - tr[k][0] >= 40) { ref = tr[k]; break; }
    return (last[i] - ref[i]) / Math.max(16, last[0] - ref[0]);
  };
  document.addEventListener('pointerdown', (e) => {
    const area = e.target.closest('[data-gesture]');
    if (!area || G || e.target.closest('[data-pad], button, [data-act], .m-top, [data-tip], .tut-side')) return;
    const t = target();
    if (!t) return;
    e.preventDefault();
    SB.audio.init();
    const br = boardRect();
    const cs = UI.screen === 'tutorial' ? (UI.tut.cs || 24) : (UI.cs || 24);
    G = { id: e.pointerId, x0: e.clientX, y0: e.clientY, hx0: e.clientX, t0: e.timeStamp, mx: 0, axis: null, moved: false, soft: false, done: false, repeat: 0, run: 0, lastD: 0, fast: 0,
      mid: br ? br.left + br.width / 2 : window.innerWidth / 2, step: UI.swipeStep(cs), vstep: UI.dragStep(cs), trail: [[e.timeStamp, e.clientY, e.clientX]] };
    const g0 = G;
    setTimeout(() => { if (G === g0 && !g0.moved && !g0.done) ringAt(g0.x0, g0.y0); }, 110);
    g0.lpTimer = setTimeout(() => {
      const tt = target();
      if (G !== g0 || g0.moved || g0.done || !canAct(tt)) return;
      g0.done = true;
      tt.g.hold();
      ringOff(true);
      buzz(15);
    }, LONG_PRESS);
    try { area.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  });
  document.addEventListener('pointermove', (e) => {
    if (!G || e.pointerId !== G.id) return;
    const t = target();
    if (!t) return;
    const dx = e.clientX - G.x0, dy = e.clientY - G.y0;
    G.trail.push([e.timeStamp, e.clientY, e.clientX]);
    if (G.trail.length > 12) G.trail.shift();
    if (!G.moved && Math.hypot(dx, dy) > TAP_SLOP) { G.moved = true; clearTimeout(G.lpTimer); ringOff(); }
    if (G.done) return;
    if (!G.axis && G.moved) { G.axis = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v'; G.ax = dx; G.ay = dy; }
    // a drag that started sideways can turn into a soft drop, and the other way round
    if (G.axis === 'h' && dy - G.ay > G.vstep * 2.2 && Math.abs(dx - G.ax) < G.step) { stopRepeat(G); clearTimeout(G.repeatTimer); G.axis = 'v'; G.ax = dx; G.ay = dy; }
    else if (G.axis === 'v' && Math.abs(dx - G.ax) > G.step * 1.6) {
      const d = dx - G.ax > 0 ? 1 : -1;
      G.axis = 'h'; G.soft = false; UI.input.down = false;
      G.hx0 = e.clientX - d * G.step; G.mx = 0; G.run = 0; G.ax = dx; G.ay = dy;
    }
    if (G.axis === 'h') {
      const pos = (e.clientX - G.hx0) / G.step;
      for (let guard = 0; guard < 20; guard++) {
        const d = pos >= G.mx + ENTER ? 1 : pos <= G.mx - ENTER ? -1 : 0;
        if (!d) break;
        G.mx += d;
        G.ax = dx; G.ay = dy;
        if (G.repeat === d) continue; // already sliding that way
        let reanchor = false;
        // the finger turned back during a slide: stop it and step back once from here
        if (G.repeat) { stopRepeat(G); G.hx0 = e.clientX; G.mx = 0; G.run = 0; reanchor = true; }
        G.run = G.lastD === d ? G.run + 1 : 1;
        G.lastD = d;
        const vx = speed(G.trail, 2);
        G.fast = Math.abs(vx) >= SLIDE_SPEED && Math.sign(vx) === d ? d : 0;
        UI.lastSwipe = { d, run: G.run, vx };
        if (canAct(t)) t.g.move(d);
        armRepeat(G, d);
        if (reanchor) break;
      }
    } else if (G.axis === 'v') {
      if (!G.soft && dy > G.vstep * 1.2) { G.soft = true; UI.input.down = true; G.ax = dx; }
      if (G.soft && dy < G.vstep * 0.6) { G.soft = false; UI.input.down = false; }
    }
  });
  const endGesture = (e) => {
    if (!G || e.pointerId !== G.id) return;
    const g0 = G;
    G = null;
    clearTimeout(g0.lpTimer); clearTimeout(g0.repeatTimer);
    ringOff();
    stopRepeat(g0);
    if (g0.soft) UI.input.down = false;
    if (e.type === 'pointercancel' || g0.done) return;
    const t = target();
    if (!canAct(t)) return;
    const dx = e.clientX - g0.x0, dy = e.clientY - g0.y0, dt = e.timeStamp - g0.t0;
    if (g0.moved) {
      if (g0.axis !== 'v') return;
      // fast or slow is judged by how fast the finger was moving at its last movement (over 40ms or more),
      // and only counts as fast if it lifted off soon after rather than stopping first. A whole swipe done in a
      // blink also counts, so a short sharp flick drops even when the browser reports few moves.
      const tr = g0.trail, last = tr[tr.length - 1];
      const vy = speed(tr, 1), avg = dy / Math.max(16, dt);
      const lifted = e.timeStamp - last[0] < 200;
      const fast = (d) => lifted && dy * d > g0.vstep * 1.5 && (vy * d >= FLICK_SPEED || (dt < 250 && avg * d >= FLICK_SPEED));
      UI.lastGesture = { dx, dy, dt, vy, avg };
      if (fast(1)) { t.g.hardDrop(); ripple(e.clientX, e.clientY, 'drop'); buzz(12); }
      else if (fast(-1)) t.g.hold();
      return;
    }
    // a tap always turns, however quickly it follows the last one
    t.g.rotate(e.clientX >= g0.mid ? 1 : -1);
    ripple(e.clientX, e.clientY);
  };
  document.addEventListener('pointerup', endGesture);
  document.addEventListener('pointercancel', endGesture);

  // ---------- details on touch ----------
  // there is no hover on a phone: tap something with details to read them, or press and hold anything.
  // Shop cards and map consumables take two taps: the first shows what it is, the second buys or uses it.
  if (UI.touch) {
    const tt = $('#tooltip');
    const hide = () => { if (tt) tt.style.display = 'none'; };
    UI.touchTip = function (el, x, y, extra) {
      if (!tt) return;
      tt.innerHTML = el.getAttribute('data-tip') + (extra || '');
      tt.style.display = 'block';
      const r = tt.getBoundingClientRect();
      tt.style.left = Math.max(8, Math.min(window.innerWidth - r.width - 8, x - r.width / 2)) + 'px';
      const top = y - r.height - 24;
      tt.style.top = Math.max(8, top < 8 ? Math.min(window.innerHeight - r.height - 8, y + 28) : top) + 'px';
    };
    let lp = null;
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      if (lp) clearTimeout(lp.timer);
      lp = null;
      const el = e.target.closest('[data-tip]');
      if (!el) { if (!e.target.closest('#tooltip')) hide(); return; }
      const x = e.clientX, y = e.clientY;
      if (!el.closest('[data-act], [data-pad]')) { UI.touchTip(el, x, y); return; }
      hide();
      lp = { el, x, y, shown: false };
      lp.timer = setTimeout(() => { UI.touchTip(el, x, y); lp.shown = true; buzz(8); }, 420);
    }, true);
    document.addEventListener('pointermove', (e) => {
      if (lp && !lp.shown && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) { clearTimeout(lp.timer); lp = null; }
    }, true);
    document.addEventListener('pointerup', () => { if (lp && !lp.shown) clearTimeout(lp.timer); }, true);

    const CONFIRM = '.shop-card, .cons-slot';
    let armed = null, armedSell = null;
    const disarm = () => { if (armed) armed.classList.remove('armed'); armed = null; };
    const disarmSell = () => { if (armedSell && armedSell.isConnected) { armedSell.innerHTML = armedSell.dataset.label; armedSell.classList.remove('armed'); } armedSell = null; };
    document.addEventListener('click', (e) => {
      if (UI.lastPointer === 'mouse') return;
      // selling a relic is one small button next to it, so a stray tap asks first
      const sell = e.target.closest('button.sell');
      if (sell && armedSell !== sell) {
        e.stopPropagation(); e.preventDefault();
        disarmSell();
        armedSell = sell; sell.dataset.label = sell.innerHTML; sell.innerHTML = 'Tap to sell'; sell.classList.add('armed');
        return;
      }
      if (sell) { armedSell = null; return; }
      disarmSell();
      // a long press that showed details should not also buy or use the thing under the finger
      if (lp && lp.shown && e.target.closest('[data-tip]') === lp.el) {
        const el = lp.el;
        lp = null;
        e.stopPropagation(); e.preventDefault();
        if (el.matches(CONFIRM)) { disarm(); armed = el; el.classList.add('armed'); }
        return;
      }
      const el = e.target.closest(CONFIRM);
      if (armed && armed !== el) disarm();
      if (!el || !el.matches('[data-act][data-tip]') || el.classList.contains('sold')) return;
      if (armed === el) { disarm(); hide(); return; } // second tap: let it through
      e.stopPropagation(); e.preventDefault();
      armed = el; el.classList.add('armed');
      UI.touchTip(el, e.clientX, e.clientY, `<div class="tip-sub tap-again">Tap again to ${el.classList.contains('cons-slot') ? 'use' : 'buy'}</div>`);
      SB.audio.play('click');
    }, true);
    document.addEventListener('contextmenu', (e) => { if (e.target.closest('[data-tip], [data-pad], [data-gesture], canvas')) e.preventDefault(); });
    window.addEventListener('scroll', hide, true);
  }
})(window.SB);
