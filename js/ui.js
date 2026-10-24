// Stackbound UI: screens, modals, input, main loop
'use strict';
(function (SB) {
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = SB.esc;
  const fmt = SB.fmt;
  const Run = SB.Run;

  const UI = (SB.UI = {
    screen: 'title', run: null, game: null, stack: null,
    input: { left: false, right: false, down: false, lastDir: 0 },
    modal: null, bagMode: null, boardMode: null,
    lastTallyId: 0, selStarter: 'architect', selStake: 1, seedInput: '',
    lastFrame: 0,
  });

  // ---------- tooltips ----------
  // what a curio that grows or changes is doing right now in this run
  const relicLive = (id) => {
    const run = UI.run, r = run && run.relics && run.relics.find((q) => q.id === id);
    if (!r) return '';
    const n = r.n || 0;
    if (id === 'kintsugi') return `Now x${1 + 0.25 * n} Charge`;
    if (id === 'time_capsule') return `Now x${1 + 0.5 * n} Charge`;
    if (id === 'tension_spring') return `Next Tetris: +${3 * n} Charge`;
    if (id === 'receipt') return `Now +${Math.floor((run.lastSpent || 0) / 2)} Charge`;
    if (id === 'hot_streak') return `Next clear of 2+ lines: +${2 * (n + 1)} Charge`;
    if (id === 'ledger') return `Now +${Math.floor(Math.max(0, run.money) / 4)} Charge`;
    if (id === 'graffiti') return `Now +${2 * Object.keys(run.board.cells).length} Charge`;
    if (id === 'landfill' && UI.game) return `Now +${UI.game.countBlocks((b) => b.garbage)} Charge`;
    if (id === 'keystone') { const i = run.relics.indexOf(r); return i * 2 === run.relics.length - 1 ? 'Active' : 'Not active'; }
    if (id === 'minimalist') { const e = Math.max(0, SB.Run.relicSlots(run) - run.relics.length); return `Now x${+Math.pow(1.5, e).toFixed(2)} Charge`; }
    if (id === 'scrap_metal') return `Now +${3 * (run.stats.sold || 0)} Charge`;
    if (id === 'chameleon') { const as = SB.RELICS[r.as]; return as ? `This Stack: <b>${esc(as.name)}</b>, ${esc(as.desc)}` : 'Changes when the next Stack starts'; }
    return '';
  };
  const tipRelic = (id, extra) => {
    const d = SB.RELICS[id], live = relicLive(id);
    return `<b class="r-${d.rarity} tip-relic">${d.art || d.icon} ${esc(d.name)}</b><div class="tip-sub">${d.rarity} · ${d.tag} tag</div><div>${esc(d.desc)}</div>${live ? `<div class="tip-live">${live}</div>` : ''}${extra || ''}`;
  };
  const tipBlueprint = (id) => `<b>Schematic: ${SB.BLUEPRINTS[id].name}</b><div>${esc(SB.BLUEPRINTS[id].desc)}</div>`;
  const consTip = (c) => {
    const i = Run.consInfo(c);
    const m = consMat(c);
    return `<b>${i.icon} ${esc(i.name)}</b><div class="tip-sub">${i.family}${i.live ? ' · LIVE (use mid-Stack)' : ''}</div><div>${esc(i.desc)}</div>${m ? `<div class="tip-kind">${kindTag('mat')} ${m === 'all' ? 'Replaces every Material in your Bag' : 'Replaces a Material the piece already has'}</div>` : ''}`;
  };
  // A piece carries at most one of each kind: a new one replaces the old one of the same kind and sits
  // alongside the other kinds. Each is tagged with its kind wherever it is described.
  const KIND_NAME = { mat: 'Material', special: 'Special', behavior: 'Behaviour' };
  const kindTag = (k) => `<span class="mod-kind mk-${k}">${KIND_NAME[k]}</span>`;
  const matName = (m) => `<span class="mat" style="color:${SB.MATERIALS[m].color}">${SB.MATERIALS[m].name}</span>`;
  const pieceDesc = (p) => {
    const parts = [];
    if (p.special) { const s = SB.SPECIALS[p.special]; parts.push(`<div class="pd-line">${kindTag('special')} ${s.icon} <b>${s.name}</b> (${s.scope}): ${esc(s.desc(SB.specialVal(p.special, SB.pieceLv(p))))}</div>`); }
    if (p.behavior) { const b = SB.BEHAVIORS[p.behavior]; parts.push(`<div class="pd-line">${kindTag('behavior')} ${b.icon} <b>${b.name}</b>: ${esc(b.desc)}</div>`); }
    if (p.mat) parts.push(`<div class="pd-line">${kindTag('mat')} ${matName(p.mat)}: ${esc(SB.MATERIALS[p.mat].desc)}</div>`);
    return parts.join('');
  };
  // what a Pocket item does to a piece's Material, if anything: a Glyph that sets one, or Transmute
  const consMat = (c) => (c.kind === 'glyph' ? (SB.GLYPHS[c.id] && SB.GLYPHS[c.id].mat ? 'one' : null) : c.kind !== 'pattern' && c.kind !== 'secret' && c.id === 'transmute' ? 'all' : null);
  const trackText = (shape) => {
    switch (shape) {
      case 'I': return 'Lv5: +40 Mass on Tetrises. Lv10: Tetrises with it score x2. Lv15: x2 Charge';
      case 'T': return 'Lv5: T-Spins +6 Charge. Lv10: T-Spin Triples count as a Tetris. Lv15: x2 Charge';
      case 'O': return 'Lv5: +$1 when it clears. Lv10: O blocks score double Mass. Lv15: x2 Charge';
      case 'S': case 'Z': return 'Lv5: +4 Charge. Lv10: x1.5 Charge. Lv15: x2 Charge';
      case 'L': case 'J': return 'Lv5: +20 Mass. Lv10: x1.25 Charge. Lv15: x2 Charge';
      case 'I5': return 'Lv5: Penta clears +8 Charge. Lv10: Pentas level up Penta. Lv15: x2 Charge';
      default: return `Lv5: +${20 + 10 * SB.SHAPES[shape].n} Mass. Lv10: x1.5 Charge. Lv15: x2 Charge`;
    }
  };
  // "Level 7 · 3 to Lv10", plus how much of it is temporary
  const levelText = (p) => {
    const L = SB.pieceLv(p);
    return `Level ${L}${L >= SB.MAX_LEVEL ? ' (max)' : ` · ${5 - (L % 5)} to Lv${Math.floor(L / 5) * 5 + 5}`}`;
  };
  const forgedText = (p) => (p.forged ? `<div class="tip-sub forged-note">${SB.uiIco('hammer')} +${p.forged} level${p.forged > 1 ? 's' : ''} from the Forge special or a Gilded cell, gone when this Floor ends</div>` : '');
  UI.lvBadge = (p) => `<span class="lv t${SB.lvTier(SB.pieceLv(p))}${p.forged ? ' forged' : ''}">Lv${SB.pieceLv(p)}</span>`;
  const tipPiece = (p, rate) => {
    const sh = SB.SHAPES[p.shape];
    return `<b style="color:${sh.color}">${esc(sh.name)}</b> <span class="tip-sub">${levelText(p)}${p.banned ? ' · BANNED' : ''}${rate !== undefined ? ' · ' + (rate * 100).toFixed(1) + '%' : ''}</span><div class="tip-sub">${sh.group} · ${sh.n} cells</div>${forgedText(p)}${pieceDesc(p)}<div class="tip-sub">${esc(trackText(p.shape))}</div>`;
  };
  UI.tip = (html) => `data-tip="${esc(html)}"`;

  function initTooltip() {
    const tt = $('#tooltip');
    // a finger's tap also sends mouse events: those would leave a hover tooltip stuck, so touch has its own (touch.js)
    const fromTouch = () => UI.lastPointer && UI.lastPointer !== 'mouse';
    document.addEventListener('mouseover', (e) => {
      if (fromTouch()) return;
      const el = e.target.closest('[data-tip]');
      if (!el) { tt.style.display = 'none'; return; }
      tt.innerHTML = el.getAttribute('data-tip');
      tt.style.display = 'block';
    });
    document.addEventListener('mousemove', (e) => {
      if (tt.style.display !== 'block' || fromTouch()) return;
      const pad = 14;
      let x = e.clientX + pad, y = e.clientY + pad;
      const r = tt.getBoundingClientRect();
      if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - pad;
      if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - pad;
      tt.style.left = x + 'px'; tt.style.top = y + 'px';
    });
  }

  // ---------- toasts ----------
  UI.toast = function (text, kind) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = text;
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2200);
    setTimeout(() => el.remove(), 2700);
    while (box.children.length > 5) box.firstChild.remove();
  };

  // ---------- modal ----------
  UI.openModal = function (html, cls, onClose) {
    const m = $('#modal');
    if (m.hidden) SB.audio.play('open');
    m.className = 'modal-bg';
    m.innerHTML = `<div class="modal ${cls || ''}">${html}</div>`;
    m.hidden = false;
    UI.modal = { cls, onClose };
    UI.drawMinis(m);
    UI.mlist(m);
  };
  UI.closeModal = function () {
    const m = $('#modal');
    if (!m.hidden) SB.audio.play('close');
    m.hidden = true;
    m.innerHTML = '';
    const cb = UI.modal && UI.modal.onClose;
    UI.modal = null;
    UI.bagMode = null;
    UI.boardMode = null;
    if (cb) cb();
  };
  UI.drawMinis = function (root) {
    $$('canvas[data-mini]', root).forEach((cv) => {
      const p = JSON.parse(cv.getAttribute('data-mini'));
      SB.Render.mini(cv, p, +(cv.getAttribute('data-cs') || 16));
    });
    UI.drawCells(root);
  };
  UI.drawCells = function (root) {
    $$('canvas[data-cell]', root).forEach((cv) => {
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#0b0b1a'; SB.Render.rr(ctx, 0, 0, cv.width, cv.height, cv.width * 0.18); ctx.fill();
      SB.Render.cellOverlay(ctx, 0, 0, cv.width, cv.getAttribute('data-cell'), false, true);
    });
  };
  const miniCv = (p, w, h, cs) => `<canvas class="mini" width="${w}" height="${h}" data-cs="${cs || 16}" data-mini="${esc(JSON.stringify({ shape: p.shape, mat: p.mat, special: p.special, behavior: p.behavior }))}"></canvas>`;

  // ---------- HUD (run top bar) ----------
  function hud(mode) {
    const run = UI.run;
    const slots = Run.relicSlots(run);
    let relics = '';
    run.relics.forEach((r, i) => {
      const d = SB.RELICS[r.id];
      const sell = mode === 'shop' ? `<div class="relic-btns"><button class="tiny" data-act="relicLeft" data-i="${i}" title="Move left">${SB.glyph('back')}</button><button class="tiny sell" data-act="sellRelic" data-i="${i}">Sell $${Run.sellValue(run, r)}</button><button class="tiny" data-act="relicRight" data-i="${i}" title="Move right">${SB.glyph('next')}</button></div>` : '';
      relics += `<div class="relic-slot r-${d.rarity}" ${UI.tip(tipRelic(r.id))} ${mode === 'shop' ? `data-act="relicSheet" data-i="${i}"` : ''}><div class="relic-icon">${d.art}</div><div class="relic-name">${esc(d.name)}</div>${sell}</div>`;
    });
    for (let i = run.relics.length; i < slots; i++) relics += '<div class="relic-slot empty"></div>';
    let cons = '';
    run.consumables.forEach((c, i) => {
      const inf = Run.consInfo(c);
      cons += `<div class="cons-slot fam-${inf.family}" ${UI.tip(consTip(c))} data-act="useCons" data-i="${i}"><div class="cons-icon">${inf.art || inf.icon}</div><div class="cons-name">${esc(inf.name)}</div></div>`;
    });
    for (let i = run.consumables.length; i < Run.consSlots(run); i++) cons += '<div class="cons-slot empty"></div>';
    const tc = Run.tagCounts(run);
    const trans = Object.keys(SB.TRANSFORMATIONS).filter((t) => (tc[t] || 0) >= 3).map((t) => `<span class="trans" ${UI.tip(`<b>${SB.TRANSFORMATIONS[t].name}</b><div>${esc(SB.TRANSFORMATIONS[t].desc)}</div>`)}>${SB.uiIco('star')} ${SB.TRANSFORMATIONS[t].name}</span>`).join('');
    const last = mode === 'shop' && run.lastScores;
    return `<div class="hud">
      <div class="hud-left ${last ? 'n4' : ''}">
        <div class="money">$${run.money}</div>
        <div class="hud-meta">Floor <b>${run.ante}</b>${run.endless ? ' (Endless)' : '/8'} · ${SB.STARTERS[run.starter].name} · <span ${UI.tip(`<b>${SB.STAKES[run.stake].name}</b><div>${esc(SB.STAKES[run.stake].desc)}</div>`)}>${run.stake >= 10 ? 'Hellscape' : 'Hazard ' + run.stake}</span></div>
        <div class="hud-btns"><button data-act="openBag">${SB.uiIco('bag')} Bag</button><button data-act="openBoard">${SB.uiIco('board')} Board</button><button data-act="openLevels">${SB.uiIco('levels')} Run info</button>${last ? `<button data-act="lastStack">${SB.uiIco('papers')} Last Stack</button>` : ''}</div>
        ${trans ? '<div class="trans-row">' + trans + '</div>' : ''}
      </div>
      <div class="hud-loadout">
        <div class="hud-relics" style="--n:${slots}"><div class="hud-label">Curios ${run.relics.length}/${slots}</div><div class="relic-row">${relics}</div></div>
        <div class="hud-cons" style="--n:${Run.consSlots(run)}"><div class="hud-label">Pocket</div><div class="cons-row">${cons}</div></div>
      </div>
    </div>`;
  }

  // ---------- screens ----------
  // keep: re-rendering the same screen (after buying or selling) keeps its scroll position and skips the entrance
  const focusSig = (el) => {
    const d = el && el.dataset;
    if (!d || !d.act) return null;
    return `[data-act="${d.act}"]` + ['id', 'i', 'm', 'a', 'cat', 'uid', 'set', 'key'].map((k) => (d[k] != null ? `[data-${k}="${CSS.escape(d[k])}"]` : '')).join('');
  };
  UI.show = function (screen, data, keep) {
    if (UI.screen === 'prizes' && screen !== 'prizes') UI.prizeLeave();
    UI.screen = screen;
    const sc = $('#screen');
    $('#play').hidden = screen !== 'play';
    sc.hidden = screen === 'play';
    $('#tooltip').style.display = 'none';
    const fn = UI.screens[screen];
    // a refresh in place (keep) must not replay the screen's entrance on the new content
    if (keep) sc.classList.remove('enter');
    // keyboard focus survives a refresh in place: the same control is focused again
    const sig = keep && sc.contains(document.activeElement) ? focusSig(document.activeElement) : null;
    if (fn) { const top = sc.scrollTop; sc.innerHTML = fn(data); UI.drawMinis(sc); UI.syncKeys(sc); if (screen === 'prizes') UI.prizeDraw(sc); if (screen === 'shop') UI.shopAfter(sc); if (screen === 'title') UI.titleLogo(!keep); UI.mlist(sc); sc.scrollTop = keep ? top : 0; }
    // achievements earned during a Stack (or from money and curio slots just now) drop in once off the board
    if (screen !== 'play') { SB.Ach.check(UI.run && UI.run.relics ? UI.run : null); SB.Ach.flush(); }
    const back = sig && sc.querySelector(sig);
    if (back) { if (!/^(BUTTON|INPUT|A)$/.test(back.tagName)) back.tabIndex = -1; back.focus({ preventScroll: true }); }
    if (keep) return;
    const el = screen === 'play' ? $('#play') : sc;
    el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
    UI.setArea(screen, data);
    if (screen === 'title') UI.titleRain();
  };
  UI.setArea = function (screen, data) {
    let area = 'menu';
    if (screen === 'map') area = 'map';
    else if (screen === 'shop' || screen === 'payout') area = 'shop';
    else if (screen === 'play') area = UI.stack && UI.stack.boss ? 'boss' : 'play';
    else if (screen === 'gameover') area = data && data.victory ? 'victory' : 'gameover';
    SB.FX.setArea(area);
    SB.Music.setArea(area);
    if (screen !== 'play') { SB.FX.setDanger(0); SB.Music.setIntensity(0); SB.Music.setPaused(false); }
    if (screen === 'gameover' && data && data.victory) {
      for (let i = 0; i < 6; i++) setTimeout(() => SB.FX.confetti(Math.random() * window.innerWidth, -10, 50, { dir: Math.PI / 2, spread: 1.2, speed: 300 }), i * 350);
    }
    if (screen === 'payout') UI.payTally();
  };
  UI.refresh = function () { if (UI.screen !== 'play') UI.show(UI.screen, UI.screenData, true); };

  UI.screens = {};
  UI.screens.title = function () {
    const m = SB.meta.data;
    const saved = SB.loadRun();
    const fresh = m.runs === 0 && !Object.keys(m.tutorial || {}).length;
    // one column of entries and a cursor that slides between them (UI.mlist), the way Celeste and Hollow Knight do their menus
    const item = (act, ico, label, extra, cls) => `<button class="mitem ${cls || ''}" data-act="${act}"><span class="bi">${SB.uiIco(ico)}</span><span class="mi-label">${label}</span>${extra || ''}</button>`;
    const rec = (v, one, many) => `<span><b>${v}</b> ${v === 1 ? one : many}</span>`;
    return `<canvas id="titleRain"></canvas><div class="title-screen">
      <h1 class="logo"><canvas id="logoCv" aria-hidden="true"></canvas><span class="sr">Stackbound</span></h1>
      <div class="title-box panel"><nav class="mlist title-menu" aria-label="Main menu">
        ${saved ? item('continueRun', 'play', `Continue run<small>Floor ${saved.ante} · ${SB.STARTERS[saved.starter].name}</small>`, '', 'main') : ''}
        ${item('newRunScreen', 'tower', 'New run', '', saved ? '' : 'main')}
        ${item('tutorial', 'tutorial', 'Tutorial', fresh ? '<em class="mi-tag">Start here</em>' : '', fresh ? 'nudge' : '')}
        ${item('help', 'howto', 'How to play')}
        ${item('collection', 'trophy', 'Collection')}
        ${item('achievements', 'ach', 'Achievements', `<span class="ach-pill">${SB.Ach.count()}/${SB.ACHIEVEMENTS.length}</span>`)}
        ${item('prizes', 'prize', 'Prize Counter', `<span class="tix-pill">${SB.uiIco('ticket')} ${SB.Cosmetic.count()}</span>`, 'prize-open')}
        ${item('settings', 'settings', 'Settings')}
      </nav>
      ${m.runs ? `<div class="records">${rec(m.runs, 'run', 'runs')}${rec(m.wins, 'win', 'wins')}<span>best Floor <b>${m.bestAnte || 0}</b></span><span>best Stack <b>${fmt(m.bestScore || 0)}</b></span>${rec(m.tetrises, 'Tetris', 'Tetrises')}</div>` : ''}</div>
    </div>`;
  };

  // ---------- menu lists: a column of entries with one cursor that slides to the chosen entry ----------
  // Hover, focus and the arrow keys all move the same cursor, with a soft tick, so mouse, keys and touch feel alike.
  UI.mlist = function (root) {
    root.querySelectorAll('.mlist').forEach((nav) => {
      if (nav.dataset.ready) return;
      nav.dataset.ready = '1';
      const cur = document.createElement('i');
      cur.className = 'mcursor instant';
      cur.setAttribute('aria-hidden', 'true');
      nav.prepend(cur);
      const place = () => { const el = nav.sel; if (el && el.offsetHeight) { cur.style.transform = `translateY(${el.offsetTop}px)`; cur.style.height = el.offsetHeight + 'px'; } };
      nav.pick = (el, sound) => {
        if (!el || nav.sel === el) return;
        if (nav.sel) nav.sel.classList.remove('sel');
        nav.sel = el;
        el.classList.add('sel');
        place();
        if (sound) UI.hoverTick();
      };
      nav.addEventListener('pointerover', (e) => { const el = e.target.closest('.mitem'); if (el && !el.disabled) nav.pick(el, e.pointerType === 'mouse'); });
      nav.addEventListener('focusin', (e) => { const el = e.target.closest('.mitem'); if (el) nav.pick(el, false); });
      nav.pick(nav.querySelector('.mitem.main') || nav.querySelector('.mitem'), false);
      // fonts and the entrance can change sizes after the first placement: keep the cursor on its entry
      if (window.ResizeObserver) new ResizeObserver(place).observe(nav);
      requestAnimationFrame(() => requestAnimationFrame(() => { place(); cur.classList.remove('instant'); }));
    });
  };
  let tickT = 0;
  UI.hoverTick = function () { const t = performance.now(); if (t - tickT > 45) { tickT = t; SB.audio.play('hover'); } };

  // ---------- arrow keys and Enter on every menu screen and dialog ----------
  const NAV_DIRS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  const NAV_SEL = 'button, [data-act], input';
  const navVisible = (el) => !el.disabled && el.offsetParent !== null && el.getBoundingClientRect().width > 0;
  UI.navFocus = function (el) {
    if (!el.matches('button, input, a, [tabindex]')) el.tabIndex = -1;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    UI.hoverTick();
    // what a mouse would see on hover, keys see on focus
    const tt = $('#tooltip'), tipEl = el.closest('[data-tip]') || el.querySelector('[data-tip]');
    if (!tipEl || UI.touch) { tt.style.display = 'none'; return; }
    tt.innerHTML = tipEl.getAttribute('data-tip');
    tt.style.display = 'block';
    const r = el.getBoundingClientRect(), w = tt.offsetWidth, h = tt.offsetHeight;
    let x = r.right + 12, y = r.top;
    if (x + w > window.innerWidth - 8) x = Math.max(8, r.left - w - 12);
    if (y + h > window.innerHeight - 8) y = Math.max(8, window.innerHeight - h - 8);
    tt.style.left = x + 'px'; tt.style.top = y + 'px';
  };
  UI.navKey = function (e) {
    const t = document.activeElement;
    const inBody = !t || t === document.body;
    // Enter on a focused card that isn't a real button
    if (e.key === 'Enter' && !inBody && t.matches('[data-act]:not(button)')) { e.preventDefault(); t.click(); return true; }
    if (e.key === 'Enter' && inBody) {
      const root = UI.modal ? $('#modal') : $('#screen'), d = root.querySelector('.mitem.sel') || root.querySelector('button.primary:not(:disabled)');
      if (d && navVisible(d)) { e.preventDefault(); UI.navFocus(d); return true; }
      return false;
    }
    const dir = NAV_DIRS[e.key];
    if (!dir) return false;
    const sideways = dir === 'left' || dir === 'right';
    if (!inBody && t.tagName === 'INPUT' && (t.type === 'text' || t.type === 'range') && sideways) return false;
    const root = UI.modal ? $('#modal') : $('#screen');
    const cands = [...root.querySelectorAll(NAV_SEL)].filter(navVisible);
    e.preventDefault();
    if (!cands.length) return true;
    if (!cands.includes(t)) { UI.navFocus(root.querySelector('.mitem.sel') || cands.find((c) => c.matches('button.primary')) || cands[0]); return true; }
    // inside a menu list, up and down walk the entries in order and wrap around
    const list = t.closest('.mlist');
    if (list && !sideways) {
      const its = [...list.querySelectorAll('.mitem')].filter(navVisible);
      UI.navFocus(its[(its.indexOf(t) + (dir === 'down' ? 1 : its.length - 1)) % its.length]);
      return true;
    }
    // anywhere else: the nearest control in that direction, favouring ones in line with this one
    const a = t.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    let best = null, bs = Infinity;
    for (const c of cands) {
      if (c === t || c.contains(t) || t.contains(c)) continue;
      const r = c.getBoundingClientRect();
      const dx = r.left + r.width / 2 - ax, dy = r.top + r.height / 2 - ay;
      const along = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy;
      if (along <= 4) continue;
      const sc = along + (sideways ? Math.abs(dy) : Math.abs(dx)) * 2.2;
      if (sc < bs) { bs = sc; best = c; }
    }
    if (best) UI.navFocus(best);
    return true;
  };

  // ---------- the title logo (js/logo.js) ----------
  // On launch the logo builds itself from falling pieces in the middle of the screen, then rises to the top
  // while the menu opens out from under it. Any key, click or tap skips ahead. Later visits show it built.
  UI.titleLogo = function (fresh) {
    const cv = $('#logoCv'), scr = document.querySelector('.title-screen');
    if (!cv || !scr) return;
    const intro = fresh && !UI.titleIntroSeen && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    UI.titleIntroSeen = true;
    if (!intro) { SB.Logo.mount(cv, {}); scr.classList.add('ready'); return; }
    scr.classList.add('intro');
    const logo = scr.querySelector('.logo');
    const center = () => {
      if (!scr.classList.contains('intro')) return;
      logo.style.setProperty('--intro-dy', '0px');
      const r = logo.getBoundingClientRect();
      logo.style.setProperty('--intro-dy', Math.max(0, Math.round(window.innerHeight / 2 - (r.top + r.height / 2))) + 'px');
    };
    const drop = () => { window.removeEventListener('keydown', skip, true); window.removeEventListener('pointerdown', skip, true); };
    const skip = (e) => {
      // the title was replaced before the intro finished: stop listening
      if (!scr.isConnected) return drop();
      if (!scr.classList.contains('intro')) return;
      if (e.type === 'keydown') { e.preventDefault(); e.stopPropagation(); }
      if (SB.Logo.state) SB.Logo.state.skip();
    };
    const done = () => {
      drop();
      scr.classList.remove('intro');
      scr.classList.add('revealing', 'ready');
      setTimeout(() => scr.classList.remove('revealing'), 1400);
      SB.audio.play('equip');
      setTimeout(() => SB.Ach.flush(), 900);
    };
    window.addEventListener('keydown', skip, true);
    window.addEventListener('pointerdown', skip, true);
    SB.Logo.mount(cv, { intro: true, onIntroDone: done });
    center();
    requestAnimationFrame(center);
  };

  // falling-piece backdrop behind the title menu
  UI.titleRain = function () {
    const cv = $('#titleRain');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const keys = SB.TETROMINOES;
    const mats = [null, null, null, 'gold', 'glass', 'holo', 'crystal', 'steel', 'lucky'];
    const drops = [];
    const add = (y) => {
      const sh = SB.SHAPES[SB.pick ? keys[Math.floor(Math.random() * keys.length)] : 'T'];
      drops.push({ sh, x: Math.random(), y: y === undefined ? -0.2 : y, v: 0.025 + Math.random() * 0.05, rot: Math.floor(Math.random() * 4), s: 18 + Math.random() * 22, mat: mats[Math.floor(Math.random() * mats.length)], a: 0.14 + Math.random() * 0.2 });
    };
    for (let i = 0; i < 16; i++) add(Math.random());
    let last = performance.now();
    const loop = (now) => {
      if (!cv.isConnected) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (cv.width !== window.innerWidth || cv.height !== window.innerHeight) { cv.width = window.innerWidth; cv.height = window.innerHeight; }
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const d of drops) {
        d.y += d.v * dt;
        if (d.y > 1.15) { d.y = -0.15; d.x = Math.random(); d.rot = Math.floor(Math.random() * 4); }
        const cells = SB.Run.normCells(d.sh.rots[d.rot]), eg = SB.Looks.edges(cells);
        cells.forEach(([cx, cy], i) => SB.Render.block(ctx, d.x * cv.width + cx * d.s, d.y * cv.height + cy * d.s, d.s, d.sh.color, { mat: d.mat, alpha: d.a, edges: eg.flags[i], lead: i === eg.lead }));
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  const STARTER_BAG = {
    architect: { shapes: ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] },
    miner: { shapes: ['I', 'O', 'T', 'S', 'Z', 'J', 'L'], mat: 'gold' },
    glassblower: { shapes: ['I', 'O', 'T', 'S', 'Z', 'J', 'L'], mat: 'glass' },
    purist: { shapes: ['I', 'I', 'O', 'O', 'T', 'T'] },
    alchemist: { shapes: ['I', 'O', 'T', 'S', 'Z', 'J', 'L'], sand: ['S', 'Z'] },
    giant: { shapes: ['I', 'O', 'T', 'L', 'J', 'P', 'T5', 'U', 'I5'] },
    gambler: { shapes: ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] },
  };
  // Hazard ramp: teal (calm) through yellow and red to magenta, then Hellscape's fire
  const STAKE_COLORS = [null, '#35e6ff', '#3dffc0', '#7dff6a', '#c8ff4d', '#ffe14d', '#ffb03b', '#ff7a3b', '#ff4d4d', '#ff3b8a', '#ff4a1c'];
  const hzName = (i) => { const n = SB.STAKES[i].name; return n.includes(' · ') ? n.split(' · ')[1] : n; };
  // Hellscape (Hazard 10) stays a secret until Hazards 1 to 9 have each been won
  UI.hellOpen = () => SB.FREE_BUILD || SB.Ach.earned('nine');
  UI.screens.newRun = function () {
    const m = SB.meta.data;
    let cards = '';
    for (const k in SB.STARTERS) {
      const s = SB.STARTERS[k];
      const un = SB.FREE_BUILD || !!m.unlocked[k];
      cards += `<div class="starter tilt ${un ? '' : 'locked'} ${UI.selStarter === k ? 'sel' : ''}" ${un ? `data-act="pickStarter" data-id="${k}"` : ''} ${un ? '' : UI.tip(`<b>Locked</b><div>${esc(s.unlock)}</div>`)}>
        <div class="st-icon">${un ? s.icon : SB.uiIco('lock')}</div><div class="st-name">${un ? s.name.replace('Glassblower', 'Glass&shy;blower') : '???'}</div>
        ${un && m.stakeWon[k] ? `<div class="st-won" style="--sc:${STAKE_COLORS[m.stakeWon[k]]}">${SB.glyph('dot')} ${esc(SB.STAKES[m.stakeWon[k]].name)}</div>` : ''}
      </div>`;
    }
    // Hazards 1 to 9 are all open; each includes the rules of the ones below it
    const hell = UI.hellOpen(), won = m.hazardsWon || {};
    if (UI.selStake > 9 && !hell) UI.selStake = 9;
    const hzAch = (i) => SB.ACHIEVEMENTS.find((a) => a.id === (i === 10 ? 'hell' : 'hz' + i));
    let stakes = '';
    for (let i = 1; i <= 9; i++) {
      stakes += `<button class="hz ${UI.selStake === i ? 'sel' : ''} ${won[i] ? 'won' : ''}" style="--sc:${STAKE_COLORS[i]};--i:${i}" data-act="pickStake" data-i="${i}" ${UI.tip(`<b>${esc(SB.STAKES[i].name)}</b><div>${esc(SB.STAKES[i].desc)}</div>`)}><b>${i}</b><span>${hzName(i)}</span><u class="hz-meter">${'<s></s>'.repeat(i)}</u>${won[i] ? `<i class="hz-won">${SB.uiIco('check')}</i>` : ''}</button>`;
    }
    if (hell) stakes += `<button class="hz hz-hell ${UI.selStake === 10 ? 'sel' : ''} ${won[10] ? 'won' : ''}" style="--sc:${STAKE_COLORS[10]}" data-act="pickStake" data-i="10" ${UI.tip(`<b>Hellscape</b><div>${esc(SB.STAKES[10].desc)}</div>`)}>${SB.uiIco('fire')}<span>Hellscape</span>${won[10] ? `<i class="hz-won">${SB.uiIco('check')}</i>` : ''}</button>`;
    const sa = hzAch(UI.selStake), sr = sa && SB.Ach.rewardInfo(sa);
    const hzInfo = `<div class="hz-info" style="--sc:${STAKE_COLORS[UI.selStake]}">
      <div class="hz-rule"><b>${esc(SB.STAKES[UI.selStake].name)}</b><span>${esc(SB.STAKES[UI.selStake].desc)}</span>${UI.selStake > 1 ? `<small>+ Hazard${UI.selStake > 2 ? 's 1 to ' + (UI.selStake - 1) : ' 1'}</small>` : ''}</div>
      ${sr ? `<div class="hz-prize ${sr.rarity ? 'r-' + sr.rarity : ''} ${won[UI.selStake] ? 'got' : ''}" tabindex="0" ${UI.tip(`<b>${esc(sa.name)}</b><div>${esc(sa.desc)}</div><div class="tip-sub">Opens ${esc(sr.name)}</div>`)}><i>${sr.art}</i><span><small>Prize</small>${esc(sr.name)}</span>${won[UI.selStake] ? `<em class="hz-won">${SB.uiIco('check')}</em>` : ''}</div>` : ''}
    </div>`;
    const st = SB.STARTERS[UI.selStarter];
    const bag = STARTER_BAG[UI.selStarter] || STARTER_BAG.architect;
    const minis = bag.shapes.map((sh) => miniCv({ shape: sh, mat: bag.mat === 'glass' ? 'glass' : null, behavior: bag.sand && bag.sand.includes(sh) ? 'sand' : null }, 64, 46, 13)).join('');
    return `<div class="newrun">
      <h1 class="screen-title">New Run</h1>
      <div class="nr-body">
        <div class="nr-left panel">
          <div class="sec-label">Builder</div>
          <div class="starters">${cards}</div>
        </div>
        <div class="nr-right panel">
          <div class="nr-hero"><div class="nr-icon">${st.icon}</div><div><div class="nr-name">${st.name}</div><div class="nr-desc">${esc(st.desc)}</div></div></div>
          <div class="sec-label">Starting Bag</div>
          <div class="nr-bag">${minis}</div>
          <div class="sec-label">Hazard</div>
          <div class="hz-grid">${stakes}</div>
          ${hzInfo}
          <div class="sec-label">Seed</div>
          <div class="seed-row"><input id="seedIn" placeholder="RANDOM" maxlength="16" value="${esc(UI.seedInput)}"><button data-act="dailySeed">${SB.uiIco('calendar')} Daily</button></div>
          <div class="nr-go"><button data-act="title">Back</button><button class="big primary" data-act="startRun">Start run ${SB.glyph('next')}</button></div>
        </div>
      </div>
    </div>`;
  };

  UI.screens.map = function () {
    const run = UI.run;
    UI.screenData = null;
    let cards = '';
    for (let i = 0; i < 3; i++) {
      const s = Run.stackInfo(run, i);
      const state = i < run.stackIdx ? 'done' : i === run.stackIdx ? 'current' : 'upcoming';
      let rule = '';
      if (s.boss) rule = [s.boss, s.boss2].filter(Boolean).map((k) => { const b = SB.BOSSES[k]; return `<div class="rule boss-rule">${b.icon} <b>${b.name}</b><div>${esc(b.desc)}</div></div>`; }).join('');
      else if (s.mod) { const md = SB.STAGE_MODS[s.mod]; const rw = md.xmoney ? `x${md.xmoney} money` : md.money ? (md.money > 0 ? '+$' + md.money : '-$' + -md.money) : ''; rule = `<div class="rule"><b>${md.name}</b> <span class="reward">${rw}${md.tag ? ' + Token' : ''}${md.rare ? ' + Rare curio' : ''}</span><div>${esc(md.desc)}</div></div>`; }
      const tag = s.tag ? SB.TAGS[s.tag] : null;
      const startL = Run.startLevel(run, s);
      let btns = '';
      if (state === 'current') {
        btns += `<button class="primary big" data-act="playStack">Play ${SB.glyph('next')}</button>`;
        if (i < 2) {
          btns += `<button data-act="skipStack" ${UI.tip(`<b>Skip for ${tag.icon} ${tag.name}</b><div>${esc(tag.desc)}</div><div class="tip-sub">You skip the reward and the Workshop after this Stack</div>`)}>Skip: ${tag.icon} ${tag.name}</button>`;
          if (Run.canRerollMod(run)) btns += `<button data-act="rerollMod" data-i="${i}" ${run.money < 2 ? 'disabled' : ''} ${UI.tip(tipBlueprint('scout'))}>${SB.BLUEPRINTS.scout.icon} Restock modifier ($2)</button>`;
        }
      }
      if (s.boss && state !== 'done' && Run.canSwapBoss(run)) btns += `<button class="bribe-btn" data-act="swapBoss" ${run.money < Run.BRIBE_PRICE ? 'disabled' : ''} ${UI.tip(tipRelic('bribe'))}>${SB.RELICS.bribe.icon} Swap Warden ($${Run.BRIBE_PRICE})</button>`;
      if (s.boss && state !== 'done' && Run.canShiftBoss(run)) btns += `<button class="bribe-btn shift-btn" data-act="shiftBoss" ${run.money < Run.SHIFT_PRICE ? 'disabled' : ''} ${UI.tip(tipBlueprint('shift_change'))}>${SB.BLUEPRINTS.shift_change.icon} Swap Warden ($${Run.SHIFT_PRICE})</button>`;
      if (i < 2 && state !== 'done' && Run.hasRelic(run, 'windsock')) btns += `<button class="windsock-btn" data-act="openWindsock" data-i="${i}" ${UI.tip(tipRelic('windsock'))}>${SB.RELICS.windsock.icon} Choose modifier</button>`;
      if (!s.boss && !s.mod && i < 2) rule = `<div class="rule calm"><b>No modifier</b><div>Plain rules for this Stack</div></div>`;
      if (s.rival) rule += `<div class="rule boss-rule rival-rule">${SB.ico('devil-mask')} <b>+ ${SB.RIVAL.name}</b><div>${esc(SB.RIVAL.desc)}</div></div>`;
      const chip = s.boss ? SB.BOSSES[s.boss].icon : i === 0 ? 'I' : 'II';
      const ribbon = state === 'done' ? ((run.flags.skips || []).includes(run.ante * 3 + i) ? 'Skipped' : 'Cleared') : state === 'current' ? 'Up next' : 'Upcoming';
      cards += `<div class="stack-card ${state === 'current' ? 'tilt' : ''} ${state} ${s.boss ? 'is-boss' : ''} kind-${i}">
        <div class="sc-ribbon">${ribbon}</div>
        <div class="sc-chip"><span>${chip}</span></div>
        <div class="sc-head">${s.name}</div>
        <div class="sc-target"><span>Score at least</span><b>${fmt(s.target)}</b></div>
        <div class="sc-line"><span class="pill gold">Reward $${s.reward}</span><span class="pill clock ${s.clock < SB.STACK_CLOCK ? 'short' : s.clock > SB.STACK_CLOCK ? 'long' : ''}">${SB.uiIco('time')} ${Run.fmtClock(s.clock)}</span><span class="pill">Par ${s.par}s</span><span class="pill">Speed ${startL}</span></div>
        ${rule}
        ${tag && state !== 'done' ? `<div class="sc-tag">Skip reward: ${tag.icon} ${tag.name}</div>` : ''}
        <div class="sc-btns">${btns}</div>
      </div>`;
    }
    const notes = [];
    if (run.flags.gamblerGift) { notes.push(`${SB.STARTERS.gambler.icon} The Gambler deals you ${esc(SB.RELICS[run.flags.gamblerGift].name)} and a ${esc(run.board.shape)} board`); run.flags.gamblerGift = null; }
    if (run.flags.lastOmega) { notes.push(`${SB.RELICS.omega.icon} The Maw swallowed ${esc(run.flags.lastOmega)}`); run.flags.lastOmega = null; }
    if (run.carry) notes.push(`${SB.BLUEPRINTS.momentum.icon} Momentum: next Stack starts with ${fmt(run.carry)} points`);
    if (run.flags.safeNext) notes.push(`${SB.TAGS.safe.icon} Safe Token: the next target is 25% lower`);
    let track = '';
    if (!run.endless) for (let a = 1; a <= 8; a++) track += `<div class="pip ${a < run.ante ? 'done' : a === run.ante ? 'cur' : ''} ${a === 8 ? 'fin' : ''}">${a === 8 ? SB.uiIco('crown') : a < run.ante ? SB.glyph('tick') : a}</div>${a < 8 ? `<div class="pip-line ${a < run.ante ? 'done' : ''}"></div>` : ''}`;
    return `${hud('map')}
      <div class="map">
        <h1 class="screen-title">Floor ${run.ante} ${run.ante === 8 && !run.endless ? '<span class="finale">SUMMIT</span>' : run.endless ? '<span class="finale">ENDLESS</span>' : ''}</h1>
        ${track ? `<div class="ante-track">${track}</div>` : ''}
        ${notes.map((n) => `<div class="note">${n}</div>`).join('')}
        <div class="stack-cards">${cards}</div>
        <div class="menu-row"><button data-act="abandon" class="danger">Abandon run</button><button data-act="title">Main menu</button></div>
      </div>`;
  };

  UI.screens.payout = function (d) {
    UI.screenData = d;
    const { out, res, stack } = d;
    const rows = out.pay.lines.map((l) => `<div class="pay-line" data-v="${l.v}"><span>${l.icon || ''} ${esc(l.label)}</span><b class="${l.v < 0 ? 'neg' : 'gold'}">${l.v < 0 ? '-' : '+'}$${Math.abs(l.v)}</b></div>`).join('');
    const extras = out.extras.map((e) => `<div class="note">${e}</div>`).join('');
    return `<div class="payout panel">
      <h1 class="screen-title">${res.outcome === 'net' ? SB.RELICS.safety_net.icon + ' Saved by the net' : stack.boss ? SB.uiIco('skull') + ' Warden defeated!' : 'Stack cleared!'}</h1>
      <div class="pay-score"><span class="pay-num" data-v="${res.score}">${fmt(res.score)}</span> <span class="dim">/ ${fmt(stack.target)}</span></div>
      <div class="pay-sub">${res.lines} line${res.lines === 1 ? "" : "s"} · ${Math.round(res.elapsed)}s · ${res.pushesDone} push${res.pushesDone === 1 ? '' : 'es'}</div>
      <div class="pay-lines">${rows}<div class="pay-line total"><span>Total</span><b class="gold pay-total" data-v="${out.pay.total}">$${out.pay.total}</b></div></div>
      ${extras}
      <button class="big primary wide" data-act="toShop">${out.victory ? 'Claim victory&nbsp;' + SB.glyph('next') : 'Bank it &amp; visit the Workshop&nbsp;' + SB.glyph('next')}</button>
    </div>`;
  };

  // the payout counts itself up the way Balatro's cash-out does: the score climbs, then each line lands with a coin
  // and adds to the total. A tap anywhere (not on the button) skips to the end; the button works throughout.
  UI.payTally = function () {
    const box = $('#screen .payout');
    const num = box && box.querySelector('.pay-num'), tot = box && box.querySelector('.pay-total');
    const burst = () => SB.FX.burstAt($('.pay-score'), 40, { colors: ['#ffd23b', '#ffe680', '#fff3b0'] });
    if (!num || !tot || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setTimeout(burst, 150); return; }
    const rows = [...box.querySelectorAll('.pay-line:not(.total)')];
    const end = { score: +num.dataset.v, total: +tot.dataset.v };
    const timers = [];
    let done = false, raf = 0, sum = 0;
    box.classList.add('tallying');
    tot.textContent = '$0';
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout); cancelAnimationFrame(raf);
      num.textContent = fmt(end.score); tot.textContent = '$' + end.total;
      rows.forEach((r) => r.classList.add('in'));
      box.classList.remove('tallying');
    };
    box.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) finish(); });
    const lines = () => {
      burst();
      rows.forEach((r, i) => timers.push(setTimeout(() => {
        r.classList.add('in');
        sum += +r.dataset.v || 0;
        tot.textContent = '$' + Math.max(0, sum);
        SB.audio.play(+r.dataset.v < 0 ? 'tap' : 'coin', i);
      }, 170 * i)));
      timers.push(setTimeout(() => { if (done) return; finish(); tot.classList.add('pop'); SB.audio.play('money'); }, 170 * rows.length + 140));
    };
    const t0 = performance.now(), D = 550;
    const climb = (now) => {
      if (done) return;
      const k = Math.min(1, (now - t0) / D);
      num.textContent = fmt(Math.round(end.score * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(climb); else lines();
    };
    raf = requestAnimationFrame(climb);
  };

  // a sale is marked on the price itself, so nothing covers the card's heading
  const priceTag = (it, soldWord) => (it.sold ? soldWord || 'SOLD' : it.price === 0 || it.free ? 'FREE' : it.sale ? `<em class="sale-chip">Sale</em><s>$${it.full}</s>$${it.price}` : '$' + it.price);
  const saleTag = () => '';
  // What changed since the Workshop was last drawn: a new visit (cards drop onto the shelves), a Restock (cards flip),
  // or a card bought just now (it gets stamped and coins fly to your money)
  const shopItems = (s) => [...s.relics.map((it, i) => ['r' + i, it]), ...s.cons.map((it, i) => ['c' + i, it]), ...s.packs.map((it, i) => ['p' + i, it]), ['patch', s.patch], ['bp', s.blueprint]].filter(([, it]) => it);
  function shopMemo(run) {
    const s = run.shop, prev = UI.shopMemo, items = shopItems(s);
    const sig = JSON.stringify(items.map(([k, it]) => [k, it.id || it.type || it.name || '', it.kind || '', it.price, it.full || 0]));
    const same = prev && prev.shop === s;
    const mode = !same ? 'fresh' : prev.sig !== sig ? 'restocked' : '';
    const just = same && !mode ? items.filter(([k, it]) => it.sold && !prev.sold[k]).map(([k]) => k) : [];
    const sold = {}; for (const [k, it] of items) sold[k] = !!it.sold;
    UI.shopMemo = { shop: s, sig, sold, money: run.money };
    UI.shopFx = { mode, just, from: prev && prev.money != null ? prev.money : run.money, rare: just.some((k) => k[0] === 'r' && ['Legendary', 'Mythic'].includes(SB.RELICS[s.relics[+k.slice(1)].id].rarity)), left: items.some(([, it]) => !it.sold) };
    return UI.shopFx;
  }
  // the Workshop's keeper: a T piece in a work apron with a pencil in the pocket and a wrench in hand. No hat, no face,
  // just the marks that pop up over it
  const keeperHtml = () => {
    const c = (x, y) => `<g transform="translate(${x} ${y})"><rect width="20" height="20" fill="#07051a"/><rect x="2" y="2" width="16" height="16" fill="#b25cff"/><rect x="2" y="2" width="16" height="3" fill="#fff" fill-opacity=".42"/><rect x="2" y="5" width="3" height="10" fill="#fff" fill-opacity=".14"/><rect x="2" y="15" width="16" height="3" fill="#000" fill-opacity=".3"/></g>`;
    const INK = '#07051a';
    return `<div class="keeper" data-act="pokeKeeper" data-mood="note" aria-hidden="true"><div class="kp-say"></div><svg class="kp-art" viewBox="0 0 92 84">
      <ellipse class="kp-shadow" cx="40" cy="80" rx="22" ry="3.5" fill="#000" fill-opacity=".4"/>
      <g class="kp-body">${c(10, 32)}${c(30, 32)}${c(50, 32)}${c(30, 52)}
        <path d="M71 50L80 26" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M71 50L80 26" stroke="#c7d2e2" stroke-width="3" stroke-linecap="round"/>
        <path d="M76.5 26.5A5.6 5.6 0 1 1 86 24.5L82.6 23.8L81.2 27.6L84.4 28.8A5.6 5.6 0 0 1 76.5 26.5Z" fill="#c7d2e2" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <rect x="64" y="44" width="10" height="9" rx="3" fill="#b25cff" stroke="${INK}" stroke-width="2"/>
        <path d="M31 40L23 33M49 40L57 33" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/><path d="M31 40L23 33M49 40L57 33" stroke="#e8c48a" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M30 39H50V70Q40 74.5 30 70Z" fill="#e8c48a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M30 44H50" stroke="#c99a5a" stroke-width="1.6"/><circle cx="32.6" cy="41.5" r="1.5" fill="#ffd23b" stroke="${INK}" stroke-width="1"/><circle cx="47.4" cy="41.5" r="1.5" fill="#ffd23b" stroke="${INK}" stroke-width="1"/>
        <path d="M34 54H46V62Q40 64.5 34 62Z" fill="#c99a5a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M41.5 48.5L43.6 56" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M41.5 48.5L43.6 56" stroke="#ffd23b" stroke-width="2" stroke-linecap="round"/><circle cx="41.4" cy="48.2" r="1.3" fill="#ff7ab6"/>
      </g>
      <g class="kp-em em-note"><path d="M70 6V20" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M70 6Q76 8 78 13" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M70 6V20M70 6Q76 8 78 13" fill="none" stroke="#fff3d8" stroke-width="2" stroke-linecap="round"/><ellipse cx="66.5" cy="20.5" rx="4.6" ry="3.6" transform="rotate(-20 66.5 20.5)" fill="#fff3d8" stroke="${INK}" stroke-width="2"/></g>
      <g class="kp-em em-happy" stroke="${INK}" stroke-linecap="round"><path d="M64 14L58 8M70 10L70 2M76 14L82 8" stroke-width="5"/><path d="M64 14L58 8M70 10L70 2M76 14L82 8" stroke="#ffd23b" stroke-width="2.6"/><path d="M80 22L81.5 25.5L85 27L81.5 28.5L80 32L78.5 28.5L75 27L78.5 25.5Z" fill="#fff3d8" stroke-width="1.4" stroke-linejoin="round"/></g>
      <g class="kp-em em-heart"><path d="M70 26C58 18 61 8 66.5 8C69 8 70 10 70 11.5C70 10 71 8 73.5 8C79 8 82 18 70 26Z" fill="#ff5a8a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M64.5 12.5Q65 10.5 67 10.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g>
      <g class="kp-em em-bang"><rect x="66.5" y="2" width="7" height="16" rx="3" fill="#ff4d6a" stroke="${INK}" stroke-width="2"/><circle cx="70" cy="23.5" r="3.6" fill="#ff4d6a" stroke="${INK}" stroke-width="2"/></g>
      <g class="kp-em em-idea"><path d="M63 5A8.2 8.2 0 0 0 58.2 19.9C59.4 20.9 59.8 21.9 59.8 23.1H66.2C66.2 21.9 66.6 20.9 67.8 19.9A8.2 8.2 0 0 0 63 5Z" fill="#fff3a0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M59.6 23.1H66.4V26.9Q63 28.9 59.6 26.9Z" fill="#c7d2e2" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M60 25H66" stroke="${INK}" stroke-width="1.2"/><path d="M59.4 12.7Q59.8 9.3 62.6 8.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M51.5 9.5L54.5 11.2M74.5 9.5L71.5 11.2M63 0V2" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></g>
      <g class="kp-em em-sweat"><path d="M68 6C68 6 61 15 61 19.5A7 7 0 0 0 75 19.5C75 15 68 6 68 6Z" fill="#7fd6ff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M65 18.5Q65 15.5 67 13.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>
    </svg></div>`;
  };
  // what the keeper says: a line for each moment, event-day lines, and hints he mixes into hellos and pokes
  const KEEPER_LINES = {
    hello: ['Fresh off the line.', 'Mind the sawdust.', 'Have a look around.', 'Back again?', 'Shelves are full today.', 'Still in one piece? Good.',
      'Wipe your feet.', 'Open for business.', "Don't mind the mess.", 'Welcome back, stacker.', 'You look like you need a curio.'],
    buy: ['Good pick.', 'Pleasure doing business.', 'That one bites.', 'Sold!', 'Fits you nicely.', 'Treat it well.', 'Excellent taste.',
      'That one had your name on it.', 'Another happy customer.'],
    rare: ['Careful with that one.', 'Now that is a find.', 'I was saving that one.', 'Handle with care.', "Don't tell anyone where you got it."],
    restock: ['Fresh stock!', 'Found more out back.', 'Hot off the bench.', 'Shelves, round two.', "Let's see what's in the back."],
    poor: ['Bit short there.', 'Come back richer.', 'Cash first, friend.', 'Window shopping is free.', 'I take cash. Only cash.'],
    poke: ['Hm hm hm.', 'Need anything?', 'Every piece fits somewhere.', 'Careful, the wrench is load-bearing.', 'I rotate on weekends.',
      'Still waiting on a long piece? Me too.', 'T pieces make the best shopkeepers. Fact.', 'Yes, I sharpen my own pencils.',
      "I don't do refunds. I do Restocks.", 'Some days I miss being a T-Spin.', 'Ow.'],
    empty: ['Cleaned me out.', 'Shelves are bare.', 'Nothing left but sawdust.', 'Come back next Stack.'],
    hint: ['Curios score left to right. Put your + Charge ones before the x ones.', 'Press the Mass x Charge box mid-Stack to see how a clear added up.',
      'Hold $35 at the end of a Stack and Savings pays the full $5.', 'Each Restock costs a dollar more than the last.',
      'The Forge doubles its price each time you use it here. It resets next visit.', 'Your Bag holds two pieces of each shape, tops.',
      'One Tetris pays far better than four Singles.', 'Wardens break a rule of Tetris. Check the map before you walk in.',
      'Push On for more money, but topping out while pushing ends the run.', 'A Curio Cabinet has better odds of Uncommon and Rare.',
      'Freeze stops gravity and the clock for 6 seconds. Save it for a tight spot.', 'Skipping Stack I or II pays a Token.',
      'Schematics last the whole run.', 'Sell a curio that stopped pulling its weight. Slots are precious.'],
    ev_sale: ['Sale day. Everything is 25% off.', 'Prices slashed. My accountant is crying.'],
    ev_overstock: ['Delivery came in. Extra stock on the shelves.', 'Bit crowded in here today.'],
    ev_shipment: ['Rare shipment. Check the first curio.', 'Got something special in today.'],
    ev_surplus: ['Too many packs. Take one off my hands.', 'Extra pack on the shelf today.'],
    ev_tinker: ['Tinker day. The Forge is cheaper.', 'Forge is warm and cheap today.'],
  };
  const KEEPER_MOOD = { hello: 'note', buy: 'happy', rare: 'heart', restock: 'bang', poor: 'sweat', poke: 'note', empty: 'sweat', hint: 'idea' };
  const KEEPER_HINT = { hello: 0.3, poke: 0.5 };
  UI.keeperSay = function (kind) {
    const el = $$('.keeper').find((k) => k.offsetParent !== null);
    if (KEEPER_HINT[kind] && Math.random() < KEEPER_HINT[kind]) kind = 'hint';
    const lines = KEEPER_LINES[kind];
    if (!el || !lines) return;
    // each kind deals its lines out in a shuffled order, so nothing repeats until he has said them all
    // (Math.random, not SB.rng: chatter must not shift a seeded run)
    const bag = (UI.keeperBag = UI.keeperBag || {});
    if (!bag[kind] || !bag[kind].length) bag[kind] = lines.map((l) => [Math.random(), l]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
    let line = bag[kind].pop();
    if (line === UI.keeperLast && bag[kind].length) { bag[kind].unshift(line); line = bag[kind].pop(); }
    UI.keeperLast = line;
    el.querySelector('.kp-say').textContent = line;
    el.dataset.mood = KEEPER_MOOD[kind] || (kind.startsWith('ev_') ? 'bang' : 'note');
    el.classList.remove('talk', 'hop'); void el.offsetWidth;
    el.classList.add('talk');
    if (kind === 'buy' || kind === 'rare' || kind === 'restock') el.classList.add('hop');
    clearTimeout(UI.keeperT); UI.keeperT = setTimeout(() => el.classList.remove('talk'), Math.max(2600, 1400 + line.length * 55));
  };
  // after the Workshop is drawn: coins fly from a card just bought to your money, the money counts, the keeper reacts
  UI.shopAfter = function (sc) {
    const fx = UI.shopFx, run = UI.run;
    if (!fx || !run) return;
    const money = $$('.money', sc)[0];
    if (money && fx.from !== run.money) {
      const a = fx.from, b = run.money, t0 = performance.now();
      money.classList.remove('bump', 'down', 'up'); void money.offsetWidth; money.classList.add('bump', b < a ? 'down' : 'up');
      const tick = (now) => { const k = Math.min(1, (now - t0) / 420); money.textContent = '$' + Math.round(a + (b - a) * (1 - Math.pow(1 - k, 2))); if (k < 1 && money.isConnected) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = fx.just.length && sc.querySelector('.shop-card[data-just]');
    if (el && money && !reduce) {
      const r1 = el.getBoundingClientRect(), r2 = money.getBoundingClientRect();
      const n = Math.max(3, Math.min(9, Math.ceil((fx.from - run.money) / 2)));
      for (let i = 0; i < n; i++) {
        const c = document.createElement('i');
        c.className = 'fly-coin';
        document.body.appendChild(c);
        const x0 = r1.left + r1.width / 2 + (Math.random() - 0.5) * 40, y0 = r1.top + r1.height * 0.45, x1 = r2.left + 18 + Math.random() * 20, y1 = r2.top + r2.height / 2;
        const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * 120, my = Math.min(y0, y1) - 80 - Math.random() * 60;
        const anim = c.animate([
          { transform: `translate(${x0}px, ${y0}px) scale(.4)`, opacity: 0 },
          { transform: `translate(${mx}px, ${my}px) scale(1.1)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${x1}px, ${y1}px) scale(.7)`, opacity: 1 },
        ], { duration: 520 + i * 45, delay: i * 40, easing: 'cubic-bezier(.3,.1,.4,1)', fill: 'both' });
        anim.onfinish = () => { c.remove(); SB.audio.play('coin', i); };
      }
    }
    const ev = run.shop && run.shop.event;
    if (fx.mode === 'fresh') setTimeout(() => UI.screen === 'shop' && UI.keeperSay(ev && KEEPER_LINES['ev_' + ev] && Math.random() < 0.6 ? 'ev_' + ev : 'hello'), 650);
    else if (fx.mode === 'restocked') UI.keeperSay('restock');
    else if (fx.just.length) UI.keeperSay(fx.left ? (fx.rare ? 'rare' : 'buy') : 'empty');
    fx.mode = ''; fx.just = []; fx.from = run.money;
  };
  UI.screens.shop = function () {
    const run = UI.run;
    const s = run.shop;
    UI.screenData = null;
    if (run.flags.eggChoice) setTimeout(() => UI.eggChoice(), 0);
    const fx = shopMemo(run);
    let n = 0;
    // a card's place on the shelf (for the staggered drop), whether it was bought just now, and the stamp it gets
    const card = (it, key, stamp) => `style="--n:${n++}" data-stamp="${stamp || 'SOLD'}" ${fx.just.includes(key) ? 'data-just="1"' : ''}`;
    // cards you can't afford yet keep their place but show a red price
    const poor = (it) => (!it.sold && it.price > run.money ? 'poor' : '');
    const relicCards = s.relics.map((it, i) => {
      const d = SB.RELICS[it.id];
      return `<div class="shop-card tilt relic-card r-${d.rarity} ${it.sold ? 'sold' : ''} ${poor(it)}" ${card(it, 'r' + i)} ${UI.tip(tipRelic(it.id))} ${it.sold ? '' : `data-act="buyRelic" data-i="${i}"`}>
        ${saleTag(it)}<div class="sc-rar">${d.rarity}</div><div class="big-icon">${d.art || d.icon}</div><div class="sc-name">${esc(d.name)}</div><div class="sc-desc">${esc(d.desc)}</div>
        <div class="price">${priceTag(it)}</div></div>`;
    }).join('');
    const consCards = s.cons.map((it, i) => {
      const inf = Run.consInfo(it);
      return `<div class="shop-card tilt cons-card fam-${inf.family} ${it.sold ? 'sold' : ''} ${poor(it)}" ${card(it, 'c' + i)} ${UI.tip(consTip(it))} ${it.sold ? '' : `data-act="buyCons" data-i="${i}"`}>
        ${saleTag(it)}<div class="sc-rar">${inf.family}</div><div class="big-icon">${inf.art || inf.icon}</div><div class="sc-name">${esc(inf.name)}</div><div class="sc-desc">${consMat(it) ? kindTag('mat') + ' ' : ''}${esc(inf.desc)}</div>
        <div class="price">${priceTag(it)}</div></div>`;
    }).join('');
    const packCards = s.packs.map((it, i) => {
      const pk = SB.PACKS[it.type] || SB.PACKS.piece;
      const fam = it.type.includes('piece') ? 'piece-pack' : it.type.includes('board') ? 'board-pack' : '';
      return `<div class="shop-card tilt pack-card ${fam} pk-${it.type} ${it.sold ? 'sold' : ''} ${poor(it)}" ${card(it, 'p' + i, 'OPENED')} ${it.sold ? '' : `data-act="buyPack" data-i="${i}"`} ${UI.tip(`<b>${pk.name}</b><div>${esc(pk.tip)}</div>`)}>
        ${saleTag(it)}<div class="sc-rar">${it.type.startsWith('jumbo') ? 'Crate' : 'Pack'}</div><div class="big-icon">${pk.art || pk.icon}</div><div class="sc-name">${pk.name}</div><div class="sc-desc">${pk.desc}</div>
        <div class="price">${priceTag(it, 'OPENED')}</div></div>`;
    }).join('');
    const pt = s.patch;
    const patchCard = pt ? `<div class="shop-card tilt patch-card ${pt.sold ? 'sold' : ''} ${poor(pt)}" ${card(pt, 'patch')} ${pt.sold ? '' : 'data-act="buyPatch"'} ${UI.tip(`<b>Bag Patch: ${esc(pt.name)}</b><div>Attach to any outside edge of your Bag for more room (Bag max 10x10).</div>${pt.bonus ? `<div>Includes a <b style="color:${SB.BAG_BONUS[pt.bonus.type].color}">${SB.BAG_BONUS[pt.bonus.type].name}</b> cell: ${esc(SB.BAG_BONUS[pt.bonus.type].desc)}</div>` : ''}`)}>
        ${saleTag(pt)}<div class="sc-rar">Patch</div><div class="patch-shape">${patchHtml(pt)}</div><div class="sc-name">Bag Patch</div><div class="sc-desc">${esc(pt.name)}${pt.bonus ? ' + ' + SB.BAG_BONUS[pt.bonus.type].name : ''}</div>
        <div class="price">${priceTag(pt)}</div></div>` : '';
    const bp = s.blueprint;
    const bpCard = bp ? `<div class="shop-card tilt bp-card ${bp.sold ? 'sold' : ''} ${poor(bp)}" ${card(bp, 'bp')} ${bp.sold ? '' : 'data-act="buyBlueprint"'} ${UI.tip(`<b>Schematic: ${SB.BLUEPRINTS[bp.id].name}</b><div>${esc(SB.BLUEPRINTS[bp.id].desc)}</div><div class="tip-sub">Permanent for this run</div>`)}>
        ${saleTag(bp)}<div class="sc-rar">Schematic</div><div class="big-icon">${SB.BLUEPRINTS[bp.id].art || SB.BLUEPRINTS[bp.id].icon}</div><div class="sc-name">${SB.BLUEPRINTS[bp.id].name}</div><div class="sc-desc">${esc(SB.BLUEPRINTS[bp.id].desc)}</div>
        <div class="price">${priceTag(bp)}</div></div>` : '';
    const rc = Run.rerollCost(run);
    const ev = s.event && SB.SHOP_EVENTS[s.event];
    const sign = `<div class="shop-front"><div class="shop-sign"><i class="ss-chain"></i><i class="ss-chain"></i><div class="sign-main">WORKSHOP</div></div>${keeperHtml()}</div>`;
    const left = (list) => list.filter((it) => it && !it.sold).length;
    const count = (n) => `<span class="sec-count">${n ? n + ' left' : 'sold out'}</span>`;
    return `${hud('shop')}
      <div class="shop ${fx.mode}">
        <div class="shop-rail panel">
          ${sign}
          <div class="rail-btns">
            <button class="big primary rail-next" data-act="nextStack">Next Stack ${SB.glyph('next')}</button>
            <button class="big rail-reroll" data-act="reroll" ${run.money < rc ? 'disabled' : ''}>${SB.uiIco('dice')} Restock <b>${rc === 0 ? 'FREE' : '$' + rc}</b></button>
            <button class="rail-forge" data-act="forge" ${UI.tip('<b>Forge</b><div>+1 level to a piece for the rest of the run. Each forge doubles the price until you leave this Workshop. Bonuses unlock at Lv5, Lv10 and Lv15.</div>')}>${SB.uiIco('hammer')} Forge<span class="long"> a piece</span> <b class="${run.money < Run.forgePrice(run) ? 'neg' : 'gold'}">$${Run.forgePrice(run)}</b></button>
            ${run.lastScores ? `<button class="rail-last" data-act="lastStack">${SB.uiIco('papers')} Last Stack</button>` : ''}
          </div>
        </div>
        <div class="shop-main ${s.relics.length + s.cons.length >= 6 || s.packs.length + (pt ? 1 : 0) + (bp ? 1 : 0) >= 6 ? 'crowded' : ''}">
          <div class="shop-head-m">${sign}</div>
          ${ev ? `<div class="shop-event"><span class="ev-icon">${ev.icon}</span><div><b>${ev.name}</b> · ${esc(ev.desc)}</div></div>` : ''}
          <div class="shop-top">
            <div class="shop-section panel"><div class="sec-label"><span class="shelf-tag">Curios</span> ${count(left(s.relics))}</div><div class="shop-row">${relicCards || '<div class="dim">Sold out</div>'}</div></div>
            <div class="shop-section panel"><div class="sec-label"><span class="shelf-tag">For your Pocket</span> ${count(left(s.cons))}</div><div class="shop-row">${consCards}</div></div>
          </div>
          <div class="shop-section panel"><div class="sec-label"><span class="shelf-tag">Packs, patches & schematics</span> ${count(left([...s.packs, pt, bp]))}</div><div class="shop-row">${packCards}${patchCard}${bpCard}</div></div>
        </div>
      </div>`;
  };
  UI.relicSheet = function (i) {
    const run = UI.run, r = run.relics[i];
    if (!r) { if (UI.modal && UI.modal.cls === 'relic-sheet') UI.closeModal(); return; }
    const d = SB.RELICS[r.id], n = run.relics.length;
    const dis = UI.screen === 'shop' ? '' : 'disabled';
    UI.openModal(`<div class="rs-card r-${d.rarity}"><div class="rs-icon">${d.art}</div><div class="sc-rar">${d.rarity} · ${d.tag} tag</div><h2>${esc(d.name)}</h2><div class="rs-desc">${esc(d.desc)}</div></div>
      <div class="rs-pos">Slot ${i + 1} of ${n}. Curios fire from left to right.</div>
      <div class="rs-move"><button data-act="relicLeft" data-i="${i}" ${i === 0 || dis ? 'disabled' : ''}>${SB.glyph('back')} Move left</button><button data-act="relicRight" data-i="${i}" ${i === n - 1 || dis ? 'disabled' : ''}>Move right ${SB.glyph('next')}</button></div>
      <button class="big sell" data-act="sellRelic" data-i="${i}" ${dis}>Sell for $${Run.sellValue(run, r)}</button>
      <button class="big" data-act="closeModal">Done</button>`, 'relic-sheet');
  };
  function patchHtml(pt) {
    const w = Math.max(...pt.cells.map((c) => c[0])) + 1, h = Math.max(...pt.cells.map((c) => c[1])) + 1;
    let s = `<div class="pgrid" style="grid-template-columns:repeat(${w},14px)">`;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = pt.cells.findIndex((c) => c[0] === x && c[1] === y);
      const bonus = pt.bonus && pt.bonus.i === i ? SB.BAG_BONUS[pt.bonus.type].color : null;
      s += `<div class="pc ${i >= 0 ? 'on' : ''}" ${bonus ? `style="border-color:${bonus}"` : ''}></div>`;
    }
    return s + '</div>';
  }

  UI.screens.gameover = function (d) {
    UI.screenData = d;
    const run = d.run;
    const relics = run.relics.map((r, i) => `<div class="relic-slot r-${SB.RELICS[r.id].rarity}" style="--i:${i}" ${UI.tip(tipRelic(r.id))}><div class="relic-icon">${SB.RELICS[r.id].art}</div><div class="relic-name">${esc(SB.RELICS[r.id].name)}</div></div>`).join('');
    // records this run broke (prevBest is noted when the run starts; first-ever runs don't count as records)
    const pb = run.prevBest;
    const stats = [
      ['Reached', 'Floor ' + run.ante, pb && pb.ante > 0 && run.ante > pb.ante],
      ['Stacks won', run.stats.stacksWon],
      ['Best Stack', fmt(run.stats.bestStack), pb && pb.score > 0 && run.stats.bestStack > pb.score],
      ['Lines', run.stats.lines],
      ['Tetrises', run.stats.tetrises],
      ['Pushes', run.stats.pushes],
      ['Seed', esc(run.seedStr)],
    ];
    return `<div class="gameover panel ${d.victory ? 'victory' : ''}">
      <h1>${d.victory ? SB.uiIco('trophy') + ' VICTORY' : 'TOPPED OUT'}</h1>
      <div class="go-sub">${d.victory ? 'You beat Floor 8 with ' + SB.STARTERS[run.starter].name + ' on ' + SB.STAKES[run.stake].name + '!' : esc(d.reason || 'The stack reached the top.')}</div>
      <div class="go-stats">${stats.map(([label, v, best], i) => `<div class="${best ? 'best' : ''}" style="--i:${i}"><span>${label}</span><b>${v}</b>${best ? '<em>New best</em>' : ''}</div>`).join('')}</div>
      <div class="go-relics">${relics}</div>
      ${d.unlocks && d.unlocks.length ? `<div class="unlock">${SB.uiIco('unlock')} Unlocked: ${d.unlocks.map(esc).join(', ')}</div>` : ''}
      ${d.tickets ? `<div class="go-ticket">${SB.uiIco('ticket')} +${d.tickets} Ticket for the Prize Counter <span class="dim">(you have ${SB.Cosmetic.count()})</span></div>` : ''}
      <div class="menu-row">
        ${d.victory ? '<button class="big primary" data-act="endless">Keep going (Endless) ' + SB.glyph('next') + '</button>' : ''}
        <button class="big ${d.victory ? '' : 'primary'}" data-act="newRunScreen">New run</button>
        <button class="big" data-act="title">Main menu</button>
      </div>
    </div>`;
  };

  UI.screens.collection = function () {
    const m = SB.meta.data;
    const groups = SB.RARITIES;
    let html = '';
    let found = 0, total = 0;
    for (const g of groups) {
      const ids = Object.keys(SB.RELICS).filter((k) => SB.RELICS[k].rarity === g);
      html += `<h2 class="r-${g}">${g}</h2><div class="coll-grid">`;
      for (const id of ids) {
        total++;
        if (SB.meta.seen(id)) { found++; html += `<div class="coll-item r-${g}" ${UI.tip(tipRelic(id))}>${SB.RELICS[id].art}<span>${esc(SB.RELICS[id].name)}</span></div>`; }
        else if (!Run.relicOpen(id)) { const a = SB.Ach.byId[SB.RELICS[id].ach]; html += `<div class="coll-item unknown locked" ${UI.tip(`<b>???</b><div class="tip-sub">Achievement: ${a.hidden ? '???' : esc(a.name)}</div>`)}>${SB.uiIco('lock')}<span>???</span></div>`; }
        else html += '<div class="coll-item unknown">?<span>???</span></div>';
      }
      html += '</div>';
    }
    const bosses = Object.keys(SB.BOSSES).map((k) => `<div class="coll-item boss" ${UI.tip(`<b>${SB.BOSSES[k].name}</b><div>${esc(SB.BOSSES[k].desc)}</div>`)}>${SB.BOSSES[k].icon}<span>${SB.BOSSES[k].name}</span></div>`).join('');
    const cells = Object.keys(SB.CELLS).map((k) => `<div class="gloss-item"><canvas class="cell-cv" width="44" height="44" data-cell="${k}"></canvas><div><b>${esc(SB.CELLS[k].name)}</b><div class="dim small">${esc(SB.CELLS[k].desc)}</div></div></div>`).join('');
    const mats = SB.MAT_KEYS.concat(SB.FREE_BUILD || SB.meta.data.eggsHatched ? ['yolk'] : []).map((k) => `<div class="gloss-item">${miniCv({ shape: 'O', mat: k }, 44, 44, 20)}<div><b>${esc(SB.MATERIALS[k].name)}</b><div class="dim small">${esc(SB.MATERIALS[k].desc)}</div></div></div>`).join('');
    const pct = Math.round((found / total) * 100);
    return `<button class="back-top" data-act="title">${SB.glyph('back')} Back</button><div class="collection"><h1 class="screen-title">Collection</h1>
      <div class="panel coll-head"><div><b>${found}</b> / ${total} curios discovered</div><div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div></div>
      <div class="panel"><h2>Board cells</h2><div class="gloss">${cells}</div><h2>Materials</h2><div class="gloss">${mats}</div></div>
      <div class="panel"><h2>Curios</h2>${html}</div>
      <div class="panel"><h2>Wardens</h2><div class="coll-grid">${bosses}</div></div>
      <div class="credits">Icon shapes from game-icons.net by Lorc, Delapouite and contributors (CC BY 3.0), recoloured for Stackbound. Fonts (SIL Open Font License): Alfa Slab One by JM Solé and Kreon by Julia Petretta.</div>
      <div class="menu-row"><button class="primary" data-act="title">Back</button></div></div>`;
  };

  // ---------- Achievements: goals across runs; most open a builder, curio, pack or schematic (achieve.js) ----------
  UI.screens.achievements = function () {
    const A = SB.Ach, list = SB.ACHIEVEMENTS, got = A.count();
    const card = (a, i) => {
      const own = A.earned(a.id), hide = a.hidden && !own, p = own ? null : A.progress(a), r = hide ? null : A.rewardInfo(a);
      const tip = !r ? '' : a.rkind === 'curio' ? tipRelic(a.rid) : `<b>${esc(r.name)}</b><div class="tip-sub">${r.kind}</div><div>${esc(r.desc)}</div>`;
      return `<div class="ach-card ${own ? 'got' : ''} ${hide ? 'secret' : ''} ${a.hidden ? 'hidden-ach' : ''}" style="--i:${i}">
        <div class="ach-medal">${hide ? SB.uiIco('lock') : SB.ico(a.icon)}</div>
        <div class="ach-body"><b>${hide ? '???' : esc(a.name)}</b>${hide ? '' : `<span>${esc(a.desc)}</span>`}
          ${a.hidden ? `<span class="ach-hid">${SB.uiIco('hidden')}Hidden</span>` : ''}
          ${p ? `<div class="ach-prog"><div class="bar"><div class="bar-fill" style="width:${Math.round((p[0] / p[1]) * 100)}%"></div></div><small>${fmt(p[0])} / ${fmt(p[1])}</small></div>` : ''}</div>
        ${r ? `<div class="ach-rew ${r.rarity ? 'r-' + r.rarity : ''}" tabindex="0" ${UI.tip(tip + (a.also ? `<div class="tip-sub">Also opens ${esc(a.also)}</div>` : ''))}><i>${r.art}</i><span>${esc(r.name)}</span>${a.also ? `<small class="ach-also">+ ${esc(a.also)}</small>` : ''}</div>` : ''}
      </div>`;
    };
    const open = list.filter((a) => !a.hidden), hid = list.filter((a) => a.hidden);
    return `<button class="back-top" data-act="title">${SB.glyph('back')} Back</button><div class="achievements"><h1 class="screen-title">Achievements</h1>
      <div class="panel coll-head"><div><b>${got}</b> / ${list.length}</div><div class="bar"><div class="bar-fill" style="width:${Math.round((got / list.length) * 100)}%"></div></div></div>
      <div class="ach-list">${open.map(card).join('')}</div>
      <h2 class="ach-sub">${SB.uiIco('hidden')}Hidden <small>${hid.filter((a) => A.earned(a.id)).length} / ${hid.length}</small></h2>
      <div class="ach-list">${hid.map((a, i) => card(a, open.length + i)).join('')}</div>
      <div class="menu-row"><button class="primary" data-act="title">Back</button></div></div>`;
  };

  // ---------- Prize Counter: Tickets earned across runs buy looks (cosmetics.js) ----------
  UI.prizeTab = 'skin';
  // a little stack for skin previews and the clear demo; the bottom row is full
  const DEMO_ROWS = ['I..T...', 'I.TTT.J', 'IOO.SSJ', 'IOOSSJJ'];
  UI.screens.prizes = function () {
    const C = SB.Cosmetic, cat = UI.prizeTab, def = SB.COSMETICS[cat], n = C.count();
    const tabs = SB.COSMETIC_CATS.map((k) => `<button class="prize-tab ${k === cat ? 'on' : ''}" data-act="prizeTab" data-cat="${k}">${SB.uiIco(SB.COSMETICS[k].icon)}<span>${SB.COSMETICS[k].label}</span></button>`).join('');
    const cards = Object.keys(def.items).filter((id) => !def.items[id].secret || SB.Ach.earned(def.items[id].ach))
      .sort((a, b) => !!def.items[a].secret - !!def.items[b].secret).map((id) => {
      const it = def.items[id], own = C.owns(cat, id), on = C.equipped(cat) === id;
      let prev;
      if (cat === 'skin') prev = `<canvas class="prize-cv" data-skin="${id}"></canvas>`;
      else if (cat === 'clear') prev = `<canvas class="prize-cv" data-clear="${id}"></canvas>`;
      else if (cat === 'backdrop') prev = `<canvas class="prize-cv" data-scene="${it.scene}"></canvas>`;
      else if (cat === 'sound') prev = `<div class="prize-song prize-sfx ${UI.prizeSfx === id ? 'playing' : ''}">${SB.SFX.art(id)}<div class="eq"><i></i><i></i><i></i><i></i><i></i></div></div>`;
      else prev = `<div class="prize-song ${UI.prizeSong === id ? 'playing' : ''}">${SB.uiIco('music')}<div class="eq"><i></i><i></i><i></i><i></i><i></i></div><small>${SB.Music.SONGS[id].bpm} bpm</small></div>`;
      let btn;
      const ach = !own && typeof it.ach === 'string' && SB.Ach.byId[it.ach];
      if (on) btn = `<button class="prize-btn equipped" disabled>${SB.uiIco('check')} Equipped</button>`;
      else if (ach) btn = `<button class="prize-btn earn" disabled>${SB.uiIco('ach')} ${ach.hidden ? '???' : esc(ach.name)}</button>`;
      else if (own) btn = `<button class="prize-btn" data-act="prizeEquip" data-cat="${cat}" data-id="${id}">Equip</button>`;
      else btn = `<button class="prize-btn buy ${n >= it.price ? 'primary' : ''}" data-act="prizeBuy" data-cat="${cat}" data-id="${id}" ${n >= it.price ? '' : 'disabled'}>Buy ${SB.uiIco('ticket')} ${it.price}</button>`;
      const tryBtn = cat === 'song' ? `<button class="prize-try ${UI.prizeSong === id ? 'on' : ''}" data-act="prizeListen" data-id="${id}">${UI.prizeSong === id ? 'Stop' : 'Listen'}</button>`
        : cat === 'sound' ? `<button class="prize-try ${UI.prizeSfx === id ? 'on' : ''}" data-act="prizeSfx" data-id="${id}">${UI.prizeSfx === id ? 'Stop' : 'Listen'}</button>`
        : cat === 'backdrop' ? `<button class="prize-try ${UI.prizeView === id ? 'on' : ''}" data-act="prizeView" data-id="${id}">${UI.prizeView === id ? 'Showing' : 'Try it'}</button>` : '';
      return `<div class="prize-card ${on ? 'on' : own ? 'own' : 'locked'} ${it.secret ? 'secret' : ''}" data-pid="${cat}:${id}">
        <div class="prize-prev">${prev}${own || ach ? '' : `<span class="prize-price">${SB.uiIco('ticket')} ${it.price}</span>`}</div>
        <div class="prize-info"><b>${esc(it.name)}</b><div class="dim small">${esc(it.desc)}</div></div>
        <div class="prize-acts">${tryBtn}${btn}</div>
      </div>`;
    }).join('');
    return `<button class="back-top" data-act="title">${SB.glyph('back')} Back</button><div class="prizes"><h1 class="screen-title">Prize Counter</h1>
      <div class="panel prize-head"><div class="tix" data-act="tixTap">${SB.uiIco('ticket')}<b>${n}</b><span>Ticket${n === 1 ? '' : 's'}</span></div>
      ${SB.FREE_BUILD ? '' : `<div class="dim small">Win a Stack in a run to earn a Ticket. Endless pays one every ${SB.TICKETS.endlessEvery} Stacks.</div>`}</div>
      <div class="prize-tabs">${tabs}</div>
      <div class="prize-grid">${cards}</div>
      <div class="menu-row"><button class="primary" data-act="title">Back</button></div></div>`;
  };
  // try-outs end when you leave: the equipped song and backdrop come back
  UI.prizeLeave = function () {
    UI.prizeSong = null; UI.prizeView = null; UI.prizeSfx = null;
    clearTimeout(UI.prizeSfxT); SB.SFX.stopDemo();
    if (SB.Music.setSong) SB.Music.setSong(SB.Cosmetic.equipped('song'), true);
    SB.Cosmetic.apply('backdrop');
  };
  UI.prizeDraw = function (root) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    root.querySelectorAll('canvas.prize-cv').forEach((cv) => {
      cv.width = Math.max(40, Math.round(cv.clientWidth * dpr)); cv.height = Math.max(25, Math.round(cv.clientHeight * dpr));
      if (cv.dataset.skin) skinDemo(cv, cv.dataset.skin);
      else if (cv.dataset.clear) clearDemo(cv, cv.dataset.clear);
      else if (!SB.FX.snapshot(+cv.dataset.scene, cv)) { const c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, cv.height); g.addColorStop(0, '#1a1440'); g.addColorStop(1, '#05050f'); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height); }
    });
  };
  // each letter is one piece, so edge-aware skins see where its blocks join
  function demoBoard(ctx, cv, rows, skin, top) {
    const cs = cv.width / 7, at = (x, y) => (rows[y] || '')[x], seen = {};
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const edges = SB.Looks.flags((xx, yy) => at(xx, yy) === ch, x, y), lead = !seen[ch];
      seen[ch] = true;
      SB.Render.block(ctx, x * cs, (y - top) * cs, cs, SB.SHAPES[ch].color, { skin, edges, lead });
    }));
    return cs;
  }
  function skinDemo(cv, skin) {
    const ctx = cv.getContext('2d'), cs = cv.width / 7;
    demoBoard(ctx, cv, DEMO_ROWS, skin, -(cv.height / cs - 4) / 2);
  }
  // the clear effect on a loop: the full bottom row clears, then comes back
  // every other loop clears four lines at once to show the effect's finale
  const DEMO_FULL = ['LTTTOOI', 'LLTJOOI', 'SSZJJJI', 'ZSSZZSI'];
  function clearDemo(cv, style) {
    const ctx = cv.getContext('2d'), cs = cv.width / 7, top = -(cv.height / cs - 4);
    const d = Object.create(SB.Game.prototype);
    Object.assign(d, { W: 7, R: 4, H: 4, HID: 0, particles: [], rings: [], fxq: [], fxClock: 0, flashRows: [], shake: 0, clearStyle: style, boss: null });
    let wait = 0.6, cleared = false, loops = 0, shown = DEMO_ROWS, last = performance.now();
    const cellsOf = (rows, list) => list.flatMap((r) => [...rows[r]].map((ch, x) => ({ x, r, b: { color: SB.SHAPES[ch].color } })));
    const loop = (now) => {
      if (!cv.isConnected) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if ((wait -= dt) <= 0) {
        const four = loops % 2 === 1;
        if (!cleared) {
          d.clearFx(four ? [0, 1, 2, 3] : [3], cellsOf(four ? DEMO_FULL : DEMO_ROWS, four ? [0, 1, 2, 3] : [3]));
          shown = four ? ['.......'] : ['.......'].concat(DEMO_ROWS.slice(0, 3));
          wait = four ? 2.4 : 1.5; loops++;
        } else { shown = loops % 2 === 1 ? DEMO_FULL : DEMO_ROWS; wait = 0.8; }
        cleared = !cleared;
      }
      d.stepParticles(dt);
      ctx.clearRect(0, 0, cv.width, cv.height);
      demoBoard(ctx, cv, shown, null, top);
      for (const f of d.flashRows) SB.Render.clearFlash(ctx, f, 1 - SB.clamp(f.t / (f.max || 0.25), 0, 1), (f.r - top) * cs, cv.width, cs, 0, cv.height);
      SB.Render.rings(ctx, d.rings, cs, top);
      SB.Render.particles(ctx, d.particles, cs, top);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // the value shown beside a settings slider
  // ---------- key bindings (Settings > Keys), stored by KeyboardEvent.code, up to two keys per action ----------
  UI.KEY_ACTIONS = [
    ['left', 'Move left', ['ArrowLeft']],
    ['right', 'Move right', ['ArrowRight']],
    ['soft', 'Soft drop', ['ArrowDown']],
    ['hard', 'Hard drop', ['Space']],
    ['cw', 'Rotate clockwise', ['ArrowUp', 'KeyX']],
    ['ccw', 'Rotate counter-clockwise', ['KeyZ', 'ControlLeft']],
    ['r180', 'Rotate 180°', ['KeyA']],
    ['hold', 'Hold or swap', ['KeyC', 'ShiftLeft']],
    ['holdNext', 'Next hold slot', ['KeyV']],
    ['holdPrev', 'Previous hold slot', ['KeyF']],
    ['pause', 'Pause', ['KeyP']],
  ];
  UI.keyBinds = () => {
    const saved = (SB.meta.data && SB.meta.data.settings && SB.meta.data.settings.keys) || {};
    const out = {};
    for (const [a, , def] of UI.KEY_ACTIONS) out[a] = Array.isArray(saved[a]) ? saved[a].slice(0, 2) : def.slice();
    return out;
  };
  UI.keyMap = () => {
    const m = {}, b = UI.keyBinds();
    for (const a in b) for (const c of b[a]) if (c && !m[c]) m[c] = a;
    return m;
  };
  const KEY_NAMES = { ArrowLeft: 'Left', ArrowRight: 'Right', ArrowUp: 'Up', ArrowDown: 'Down', Space: 'Space', ShiftLeft: 'Shift', ShiftRight: 'R Shift', ControlLeft: 'Ctrl', ControlRight: 'R Ctrl', AltLeft: 'Alt', AltRight: 'R Alt', MetaLeft: 'Cmd', MetaRight: 'R Cmd', Enter: 'Enter', Tab: 'Tab', Backspace: 'Bksp', CapsLock: 'Caps', Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', IntlBackslash: '\\' };
  UI.keyName = (code) => KEY_NAMES[code] || (/^Key[A-Z]$/.test(code) ? code.slice(3) : /^Digit\d$/.test(code) ? code.slice(5) : /^Numpad/.test(code) ? 'Num ' + code.slice(6) : code || '-');
  // <kbd> for an action's first key; UI.syncKeys refreshes these after a rebind
  // a key cap's contents: the arrow keys get drawn arrows, everything else its name
  const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  UI.keyHtml = (code) => (ARROWS[code] ? SB.glyph(ARROWS[code], 'key-arrow') : esc(UI.keyName(code)));
  UI.kbd = (a) => `<kbd data-key="${a}">${UI.keyHtml(UI.keyBinds()[a][0])}</kbd>`;
  UI.syncKeys = (root) => { const b = UI.keyBinds(); (root || document).querySelectorAll('kbd[data-key]').forEach((el) => { const c = b[el.dataset.key]; if (c) el.innerHTML = UI.keyHtml(c[0]); }); };
  UI.keysPanel = () => {
    const b = UI.keyBinds(), L = UI.listenKey;
    const btn = (a, i) => { const c = b[a][i], on = L && L.a === a && L.i === i; return `<button class="keybtn ${on ? 'listen' : ''} ${c ? '' : 'empty'}" data-act="bindKey" data-a="${a}" data-i="${i}">${on ? 'Press a key…' : c ? UI.keyHtml(c) : '+'}</button>`; };
    return `<div class="keys-grid">${UI.KEY_ACTIONS.map(([a, label]) => `<div class="key-row"><span>${label}</span>${btn(a, 0)}${btn(a, 1)}</div>`).join('')}</div>
      <div class="dim small">Click a key, then press the new one. Esc cancels, Backspace clears.</div>
      <div class="menu-row"><button data-act="resetKeys">Reset keys</button></div>`;
  };
  UI.finishBind = function (code) {
    const L = UI.listenKey;
    UI.listenKey = null;
    if (L && code !== 'Escape') {
      const st = SB.meta.data.settings, b = UI.keyBinds();
      if (code === 'Backspace' || code === 'Delete') b[L.a][L.i] = null;
      else {
        for (const a in b) b[a] = b[a].map((c) => (c === code ? null : c));
        b[L.a][L.i] = code;
      }
      for (const a in b) b[a] = b[a].filter(Boolean);
      st.keys = b;
      SB.meta.save();
    }
    const el = document.getElementById('keysPanel');
    if (el) el.innerHTML = UI.keysPanel();
  };
  // one lettering set (Slab, in style.css); canvas text can't read CSS variables, so keep plain copies of the faces
  UI.applyFont = function () {
    const cs = getComputedStyle(document.documentElement);
    SB.fontUI = cs.getPropertyValue('--f-ui').trim() || 'sans-serif';
    SB.fontDisp = cs.getPropertyValue('--f-disp').trim() || 'sans-serif';
  };
  SB.fontUI = SB.fontDisp = 'sans-serif';
  UI.setLabel = (k, v) => k === 'swipeSens' ? UI.SWIPE_NAMES[v - 1] : k === 'volume' || k === 'music' ? Math.round(v * 100) + '%' : v + 'ms';
  UI.slider = (k, label, min, max, step, cls) => { const v = SB.meta.data.settings[k]; return `<label class="set-row ${cls || ''}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-set="${k}" style="--p:${((v - min) / (max - min)) * 100}%"><b id="set-${k}">${UI.setLabel(k, v)}</b></label>`; };
  UI.screens.settings = function () {
    const s = SB.meta.data.settings;
    const sl = (k, label, min, max, step) => UI.slider(k, label, min, max, step);
    const tg = (k, label) => `<label class="set-row"><span>${label}</span><span class="toggle"><input type="checkbox" data-set="${k}" ${s[k] ? 'checked' : ''}><i></i></span><b></b></label>`;
    return `<button class="back-top" data-act="title">${SB.glyph('back')} Back</button><div class="settings"><h1 class="screen-title">Settings</h1>
      <div class="panel"><h2>Audio</h2>
      ${sl('volume', 'Sound effects', 0, 1, 0.05, '')}
      ${sl('music', 'Music', 0, 1, 0.05, '')}
      ${tg('muted', 'Mute all')}
      </div>
      <div class="panel"><h2>Handling</h2>
      ${sl('das', 'Auto-shift delay', 50, 300, 5, 'ms')}
      ${sl('arr', 'Auto-repeat rate', 0, 100, 1, 'ms')}
      ${sl('sdf', 'Soft drop speed', 0, 100, 1, 'ms')}
      ${tg('shake', 'Screen shake')}
      ${tg('scorePops', 'Score pop-ups')}
      ${UI.touch ? `${sl('swipeSens', 'Swipe sensitivity', 1, 5, 1)}
      ${tg('swipeSlide', 'Hold a quick swipe to slide')}
      ${tg('touchButtons', 'On-screen buttons')}` : ''}
      </div>
      ${SB.Doki && SB.Doki.unlocked() ? `<div class="panel"><h2>Style</h2><label class="set-row"><span>Doki Doki style</span><span class="toggle"><input type="checkbox" data-set="doki" ${SB.Doki.on() ? 'checked' : ''}><i></i></span><b></b></label></div>` : ''}
      ${UI.touch ? '' : `<div class="panel"><h2>Keys</h2><div id="keysPanel">${UI.keysPanel()}</div></div>`}
      <div class="panel"><h2>Controls</h2>
      <div class="controls">
        <div>${UI.kbd('left')}${UI.kbd('right')} move</div><div>${UI.kbd('soft')} soft drop: speeds up as you hold, lets you slide before it locks</div><div>${UI.kbd('hard')} hard drop: slams down and locks instantly</div>
        <div>${UI.kbd('cw')} rotate clockwise</div><div>${UI.kbd('ccw')} rotate counter-clockwise</div><div>${UI.kbd('r180')} rotate 180°</div>
        <div>${UI.kbd('hold')} hold: swaps with the highlighted hold slot, or stores the piece if that slot is empty</div><div>${UI.kbd('holdNext')} ${UI.kbd('holdPrev')} or the scroll wheel: pick a hold slot (with more than one)</div>
        <div><kbd>1</kbd>-<kbd>4</kbd> use a live Glyph</div><div><kbd>Esc</kbd>/${UI.kbd('pause')} pause</div>
        <div><kbd>M</kbd> mute</div><div>Bag placement: <kbd>R</kbd>, right-click or double-click rotates</div>
      </div>
      <h2>Touch</h2>
      <div class="controls">
        <div><b>Swipe</b> left or right to move one column per finger step. Lower Swipe sensitivity if pieces overshoot.</div>
        <div><b>Swipe quickly and hold</b> to keep sliding to the wall. Slow, careful drags never slide.</div>
        <div><b>Tap</b> anywhere to turn: right of the board's middle turns clockwise, left of it turns the other way</div>
        <div><b>Swipe down slowly</b> for a fast drop that lasts while your finger stays down. <b>Swipe down fast</b> and let go for a quick drop that lands the piece at once.</div>
        <div><b>Press and hold</b> to put the piece in Hold or swap it back. A fast swipe up does the same. With more than one hold slot, <b>tap a slot</b> to pick the one Hold uses.</div>
        <div><b>Buttons</b> (optional): the gamepad button at the top of the play screen or the pause menu turns them on.</div>
        <div><b>Details:</b> tap or press and hold a curio, piece or card to read what it does. Tap a live Glyph at the top to use it.</div>
        <div><b>Bag and board:</b> tap a spot to preview, tap it again to place. Double-tap (or the Rotate button) turns the piece.</div>
      </div></div>
      <div class="menu-row"><button data-act="resetMeta" class="danger">Reset all progress</button><button class="primary" data-act="title">Back</button></div>
    </div>`;
  };

  UI.screens.help = function () {
    return `<button class="back-top" data-act="title">${SB.glyph('back')} Back</button><div class="help"><h1 class="screen-title">How to play</h1>
      <div class="help-grid">
        <div><h3>1. Real Tetris</h3><p>Move, rotate, hold, drop, clear lines. Pieces fall forever and speed climbs every 10 lines. If your stack hits the ceiling, the climb is over.</p></div>
        <div><h3>2. Mass × Charge</h3><p>Every clear scores <b class="chips">Mass</b> × <b class="mult">Charge</b>. Mass is how much you cleared: the clear type plus every block in the line. Charge is how hard it hits. Tetrises, T-Spins and All Clears carry far more of both. Cells, materials and curios pile on more, in a set order: the clear, blocks, board cells, materials, combos, piece levels, then curios left to right. A + adds to the Charge you have at that point and a × multiplies it, so a + that comes after a × is not multiplied. Tap the Mass × Charge box during a Stack to see where your last score came from.</p></div>
        <div><h3>3. Hit the target</h3><p>Each Stack has a score target. Every Stack has a 5:00 clock: reach the target before it runs out. Then play freezes: <b>Bank</b> your winnings, or <b>Push On</b>. A push resets your score to 0, adds 1:00 to the clock and sets a fresh goal (60%, then 90%, then 130% of the target) for bigger rewards. Top out or run out of time while pushing and the run ends.</p></div>
        <div><h3>4. Climb the Tower</h3><p>The Tower has 8 Floors. Each Floor is Stack I, Stack II and a Warden. Stacks roll a modifier; Wardens break one rule of Tetris. Clear Floor 8 to reach the Summit. You can skip Stack I or II for a Token. In Endless, some Wardens bring a <b>Rival</b>: a stacker that plays a little faster than your best this run. You score nothing until you bury it in garbage.</p></div>
        <div><h3>5. The Workshop</h3><p>Between Stacks, spend money on <b>Curios</b> (up to 5, they fire left to right), <b>Patterns</b> (level up a clear type), <b>Glyphs</b> (reshape pieces and the board; LIVE ones fire mid-Stack with keys 1-4), <b>Rifts</b> (power with a price), packs, Bag patches and Schematics. Stock changes every visit.</p></div>
        <div><h3>6. The Bag</h3><p>You only get pieces that fit in your Bag. Pieces level up to 15, with a bonus at Lv5, Lv10 and Lv15. Levels last the whole run, except the ones from the Forge special and Gilded Bag cells, which wear off when the Floor ends. Special pieces carry powers like Coin, Drill or Catalyst. A piece holds one Special, one Behaviour and one Material, so a new Material replaces the one it has (you are asked first). Throwing a piece out costs money, more each time.</p></div>
        <div><h3>7. The board remembers</h3><p>Board Packs inscribe cells (Gold, Prism, Echo, Cracked...) onto your board for the whole run. When a line clears through one, a badge pops off it showing what it added. Build where your lines clear.</p></div>
        <div><h3>8. Money</h3><p>You earn the Stack reward, a speed bonus for beating par, Push On bonuses, and Savings: $1 for every $${SB.ECON.savePer} you hold (max $${SB.ECON.saveCap}). Lean builds get rich; greedy ones get crushed.</p></div>
      </div>
      <div class="menu-row"><button class="primary" data-act="title">Got it</button></div></div>`;
  };

  // ---------- run flow ----------
  UI.startRun = function () {
    SB.audio.init();
    const inp = $('#seedIn');
    let seed = (inp && inp.value.trim().toUpperCase()) || SB.randomSeedString();
    UI.run = Run.newRun(UI.selStarter, UI.selStake, seed);
    SB.meta.data.runs++;
    SB.meta.save();
    SB.saveRun(UI.run);
    UI.show('map');
  };
  UI.continueRun = function () {
    const run = SB.loadRun();
    if (!run) return UI.show('title');
    SB.audio.init();
    UI.run = run;
    SB.rng = SB.makeRng(0);
    SB.rng.setState(run.rngState || 1);
    if (run.phase === 'shop' && run.shop) UI.show('shop'); else UI.show('map');
  };

  UI.playStack = function () {
    const run = UI.run;
    const stack = Run.stackInfo(run, run.stackIdx);
    run.carry = 0;
    UI.stack = stack;
    UI.game = new SB.Game(run, stack);
    UI.lastTallyId = 0;
    run.phase = 'play';
    SB.saveRun(Object.assign({}, run, { phase: 'map', carry: stack.carry }));
    UI.buildPlay();
    UI.show('play');
    UI.input = { left: false, right: false, down: false, lastDir: 0 };
    const intro = stack.rival ? `${SB.ico('devil-mask')} ${esc(SB.BOSSES[stack.boss].name)} and a Rival: top out the Rival before your clears score` : stack.boss2 ? `${SB.BOSSES[stack.boss].icon} ${esc(SB.BOSSES[stack.boss].name)} and ${esc(SB.BOSSES[stack.boss2].name)}` : stack.boss ? `${SB.BOSSES[stack.boss].icon} ${esc(SB.BOSSES[stack.boss].name)}: ${esc(SB.BOSSES[stack.boss].desc)}` : stack.mod ? `${esc(SB.STAGE_MODS[stack.mod].name)}: ${esc(SB.STAGE_MODS[stack.mod].desc)}` : '';
    if (intro) UI.toast(intro, 'big');
    UI.countdown = 1.2;
  };

  UI.buildPlay = function () {
    const g = UI.game, st = UI.stack;
    const slots = g.holdSlots();
    // with two or more slots, the highlighted one is where Hold stores or swaps; click/tap a slot to pick it
    const holdCvs = Array.from({ length: Math.max(1, slots) }, (_, i) => `<canvas class="hold-cv" id="hold${i}" width="96" height="72" ${slots > 1 ? `data-act="selHold" data-i="${i}"` : ''}></canvas>`).join('');
    const holdsCls = slots > 1 ? 'holds multi' : 'holds';
    const nextCvs = Array.from({ length: 8 }, (_, i) => `<canvas class="next-cv ${i === 0 ? 'first' : ''}" id="next${i}" width="${i === 0 ? 96 : 80}" height="${i === 0 ? 72 : 52}"></canvas>`).join('');
    let rule = '';
    if (st.boss) rule = [st.boss, st.boss2].filter(Boolean).map((k) => `<div class="pl-rule boss-rule">${SB.BOSSES[k].icon} <b>${SB.BOSSES[k].name}</b><br>${esc(SB.BOSSES[k].desc)}</div>`).join('');
    else if (st.mod) rule = `<div class="pl-rule"><b>${SB.STAGE_MODS[st.mod].name}</b><br>${esc(SB.STAGE_MODS[st.mod].desc)}</div>`;
    if (g.rival) rule += `<div class="pl-rule boss-rule rival-rule">${SB.ico('devil-mask')} <b>${SB.RIVAL.name}</b><br>${esc(SB.RIVAL.desc)}</div>`;
    // the Rival's board sits under the Next queue; garbage on its way to you shows as a red bar beside your board
    const rivalBox = g.rival ? `<div class="pl-label rival-label">${SB.ico('devil-mask')} RIVAL</div><div class="rival-box"><canvas id="rivalCv" width="${UI.layout ? 104 : 132}" height="${UI.layout ? 180 : 230}"></canvas><div class="rival-info" id="rivalInfo"></div></div>` : '';
    const garbMeter = g.rival ? '<div class="garb-meter" id="garbMeter"></div>' : '';
    const dis = Run.disabledRelics(UI.run, g);
    const relics = UI.run.relics.map((r, i) => `<div class="pl-relic r-${SB.RELICS[r.id].rarity} ${dis.has(i) ? 'disabled' : ''}" id="plr${i}" ${UI.tip(tipRelic(r.id, dis.has(i) ? '<div class="neg">Disabled this Stack</div>' : ''))}>${SB.RELICS[r.id].art}</div>`).join('');
    UI.layout = UI.playLayout();
    $('#play').className = UI.layout ? 'compact ' + UI.layout : '';
    // on a phone the whole play area below the info strip takes swipes and taps (touch.js)
    if (UI.layout) $('#play').setAttribute('data-gesture', '1'); else $('#play').removeAttribute('data-gesture');
    if (UI.layout) {
      // phone layout: info strip on top, board with hold/next beside it, optional buttons below (or beside, in landscape)
      const pad = !!SB.meta.data.settings.touchButtons;
      $('#play').classList.toggle('pad-on', pad);
      $('#play').innerHTML = `
      <div class="m-top">
        <div class="m-row">
          <button class="m-pause" data-pad="pause" aria-label="Pause">${UI.padIco('pause')}</button>
          <button class="m-padtoggle ${pad ? 'on' : ''}" data-act="togglePad" aria-label="${pad ? 'Hide' : 'Show'} buttons" ${UI.tip(pad ? 'Hide the buttons and play with swipes' : 'Show on-screen buttons')}>${UI.padIco('pad')}</button>
          <div class="m-stack">${st.boss ? SB.uiIco('skull') + ' ' : ''}${st.name} <span class="dim">F${UI.run.ante}</span></div>
          <div class="pl-clock m-clock" id="clockBox">${SB.uiIco('time')}<b id="clock">${Run.fmtClock(g.timeLeft())}</b><span class="clock-gain" id="clockGain"></span></div>
        </div>
        <div class="m-row m-scores">
          <div class="m-goal"><span id="goalLabel">Target</span><b id="goal">${fmt(g.goal)}</b></div>
          ${rule ? `<div class="m-rulechip" ${UI.tip(rule)}>${st.boss ? SB.uiIco('skull') + ' ' + SB.BOSSES[st.boss].name + (st.boss2 ? ' + ' + SB.BOSSES[st.boss2].name : '') + (g.rival ? ' + Rival' : '') : SB.STAGE_MODS[st.mod].name}</div>` : ''}
          <div class="m-score" id="score">0</div>
        </div>
        <div class="bar"><div class="bar-fill" id="bar"></div></div>
        <div class="m-row m-tally tally" id="tally" data-act="scoreLog" role="button" aria-label="Score breakdown"><div class="chips-box"><i>${SB.uiIco('mass')}</i><b id="tChips">0</b></div><span class="x">×</span><div class="mult-box"><i>${SB.uiIco('charge')}</i><b id="tMult">0</b></div><div class="tally-name" id="tName"></div><div class="tally-log" id="tLog" hidden></div><i class="tally-more">${SB.ico('papers')}</i></div>
        ${rule ? `<div class="m-rule" ${UI.tip(rule)}>${rule}</div>` : ''}
        <div class="m-row m-stats"><span>Spd <b id="lvl">1</b></span><span>Lines <b id="lines">0</b></span><span class="m-money"><b class="gold" id="money">$0</b></span><span>Combo <b id="combo">-</b></span><span hidden><b id="time">0</b><b id="push">-</b></span><span class="m-relics">${relics}</span></div>
        <div class="m-cons pl-cons" id="plCons"></div>
      </div>
      <div class="m-mid" id="mMid">
        <div class="m-side"><div class="pl-label">HOLD</div><div class="${holdsCls}">${slots ? holdCvs : '<div class="dim small">off</div>'}</div></div>
        <div class="pl-center m-board"><div class="board-wrap" id="boardWrap"><canvas id="board"></canvas><div class="board-fx" id="boardFx"></div><div id="countdown" class="countdown"></div>${garbMeter}</div></div>
        <div class="m-side"><div class="pl-label">NEXT</div><div class="nexts">${nextCvs}</div>${rivalBox}</div>
      </div>
      ${pad ? UI.padHtml() : ''}`;
      UI.renderPlayCons();
      UI.resize();
      requestAnimationFrame(() => UI.resize());
      return;
    }
    $('#play').innerHTML = `
      <div class="pl-left">
        <div class="pl-stack">${st.boss ? SB.uiIco('skull') + ' ' : ''}${st.name} <span class="dim">Floor ${UI.run.ante}</span></div>
        <div class="pl-clock" id="clockBox">${SB.uiIco('time')}<b id="clock">${Run.fmtClock(g.timeLeft())}</b><span class="clock-gain" id="clockGain"></span></div>
        ${rule}
        <div class="pl-goal-label" id="goalLabel">Target</div>
        <div class="pl-goal" id="goal">${fmt(g.goal)}</div>
        <div class="pl-score" id="score">0</div>
        <div class="bar"><div class="bar-fill" id="bar"></div></div>
        <div class="tally" id="tally" data-act="scoreLog" role="button" aria-label="Score breakdown"><i class="tally-more">${SB.ico('papers')}</i><div class="tally-head"><div class="chips-box"><i>${SB.uiIco('mass')} MASS</i><b id="tChips">0</b></div><span class="x">×</span><div class="mult-box"><i>${SB.uiIco('charge')} CHARGE</i><b id="tMult">0</b></div></div><div class="tally-name" id="tName"></div><div class="tally-log" id="tLog"></div></div>
        <div class="pl-stats">
          <div><span>Speed</span><b id="lvl">1</b></div><div><span>Lines</span><b id="lines">0</b></div>
          <div><span>Time</span><b id="time">0</b></div><div><span>Money</span><b class="gold" id="money">$0</b></div>
          <div><span>Combo</span><b id="combo">-</b></div><div><span>Push</span><b id="push">-</b></div>
        </div>
      </div>
      <div class="pl-center">
        <div class="pl-hold"><div class="pl-label">HOLD</div><div class="${holdsCls}">${slots ? holdCvs : '<div class="dim small">disabled</div>'}</div></div>
        <div class="board-wrap" id="boardWrap"><canvas id="board"></canvas><div class="board-fx" id="boardFx"></div><div id="countdown" class="countdown"></div>${garbMeter}</div>
      </div>
      <div class="pl-right">
        <div class="pl-label">NEXT</div><div class="nexts">${nextCvs}</div>
        ${rivalBox}
        <div class="pl-label">CURIOS</div><div class="pl-relics">${relics || '<div class="dim small">none yet</div>'}</div>
        <div class="pl-label">POCKET</div><div class="pl-cons" id="plCons"></div>
      </div>`;
    UI.renderPlayCons();
    UI.resize();
  };
  UI.renderPlayCons = function () {
    const el = $('#plCons');
    if (!el) return;
    el.innerHTML = UI.run.consumables.map((c, i) => {
      const inf = Run.consInfo(c);
      return `<div class="pl-cons-item ${inf.live || inf.secret ? 'live' : ''} ${inf.secret ? 'secret' : ''}" ${UI.layout || inf.secret ? `data-act="liveGlyph" data-i="${i}"` : ''} ${UI.tip(consTip(c))}><kbd>${i + 1}</kbd> ${inf.icon} ${esc(inf.name)}</div>`;
    }).join('') || (UI.layout ? '' : '<div class="dim small">none</div>');
  };

  // which play layout fits this screen: '' (desktop), 'port' or 'land' (phone)
  UI.playLayout = function () {
    const w = window.innerWidth, h = window.innerHeight;
    if (!UI.touch && w >= 900 && h >= 600) return '';
    return w > h * 1.2 ? 'land' : 'port';
  };
  UI.resize = function () {
    const g = UI.game;
    if (!g) return;
    if (UI.layout) {
      const mid = $('#mMid');
      if (!mid) return;
      const r = mid.getBoundingClientRect();
      const sides = Array.from(mid.querySelectorAll('.m-side')).reduce((a, el) => a + el.getBoundingClientRect().width, 0);
      // landscape: the middle column is sized by the board, so budget from the window instead of measuring it
      const availW = (UI.layout === 'land' ? window.innerWidth * 0.46 : r.width) - sides - 16, availH = r.height - 10;
      if (availW <= 0 || availH <= 0) { UI.cs = UI.cs || 18; return; }
      UI.cs = Math.max(8, Math.min(40, Math.floor(availH / (g.H + 2)), Math.floor(availW / g.W)));
      return;
    }
    const availH = window.innerHeight - 24;
    const availW = Math.max(200, window.innerWidth - 690);
    UI.cs = Math.max(14, Math.min(36, Math.floor(availH / (g.H + 2)), Math.floor(availW / g.W)));
  };

  UI.updatePlay = function () {
    const g = UI.game;
    if (!g) return;
    const bcv = $('#board');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    SB.Render.board(bcv, g, UI.cs * dpr);
    if (bcv) {
      const cw = g.W * UI.cs + 'px', ch = (g.H + 2) * UI.cs + 'px';
      if (bcv.style.width !== cw) bcv.style.width = cw;
      if (bcv.style.height !== ch) bcv.style.height = ch;
    }
    // holds & nexts
    const slots = g.holdSlots();
    for (let i = 0; i < slots; i++) {
      const cv = $('#hold' + i);
      if (!cv) continue;
      SB.Render.mini(cv, g.holds[i] ? g.holds[i].inst : null, 18, { alpha: g.holdUsed ? 0.4 : 1 });
      const sel = slots > 1 && i === g.holdSel;
      if (cv.classList.contains('sel') !== sel) cv.classList.toggle('sel', sel);
    }
    if (g.rival) {
      SB.drawRival($('#rivalCv'), g.rival);
      const info = $('#rivalInfo');
      const txt = g.rival.ko ? 'Topped out' : `${g.rival.style.pps.toFixed(2)} pieces/s · sent you ${g.rival.sent} · took ${g.rival.taken}`;
      if (info && info.textContent !== txt) info.textContent = txt;
      const gm = $('#garbMeter');
      if (gm) { const h = Math.min(g.H, g.incoming) * UI.cs + 'px'; if (gm.style.height !== h) gm.style.height = h; }
    }
    const n = g.previewCount();
    for (let i = 0; i < 8; i++) {
      const cv = $('#next' + i);
      if (!cv) continue;
      cv.style.display = i < Math.max(1, n) ? '' : 'none';
      SB.Render.mini(cv, i < n ? g.queue[i] : null, i === 0 ? 18 : 13);
    }
    const set = (id, v) => { const el = document.getElementById(id); if (el && el.textContent !== String(v)) el.textContent = v; };
    set('score', fmt(g.score));
    set('goal', fmt(g.goal));
    set('goalLabel', g.pushTier > g.pushesDone ? `Push On ${SB.pushTier(g.pushTier - 1).name} goal` : g.targetTime !== null ? 'Target reached' : 'Target');
    set('lvl', g.level);
    set('lines', g.lines);
    set('time', Math.floor(g.time) + 's');
    const left = g.timeLeft();
    set('clock', Run.fmtClock(left));
    const cb = $('#clockBox');
    if (cb) {
      cb.classList.toggle('warn', left <= 30 && left > 10);
      cb.classList.toggle('crit', left <= 10);
      cb.classList.toggle('frozen', g.time < g.freezeUntil);
      const sec = Math.ceil(left);
      if (left <= 10 && g.status === 'playing' && sec !== UI.lastTick) { UI.lastTick = sec; SB.audio.play('tick', 10 - sec); }
    }
    set('money', '$' + UI.run.money);
    set('combo', g.combo > 0 ? 'x' + g.combo : '-');
    set('push', g.pushTier ? `${g.pushesDone}/${g.pushTier}` : '-');
    const bar = $('#bar');
    if (bar) {
      const pct = SB.clamp(g.score / g.goal, 0, 1) * 100;
      bar.style.width = pct + '%';
      bar.classList.toggle('pushing', g.pushTier > g.pushesDone);
    }
    if (g.tally && g.tally.id !== UI.lastTallyId) { UI.lastTallyId = g.tally.id; UI.showTally(g.tally); }
    // events
    while (g.events.length) {
      const e = g.events.shift();
      if (e.type === 'toast') UI.toast((e.ico ? SB.ico(e.ico) + ' ' : '') + esc(e.text), e.bad ? 'bad' : '');
      else if (e.type === 'money') UI.floatMoney(e.v);
      else if (e.type === 'time') UI.clockGain(e.v, e.why);
      else if (e.type === 'choice') { SB.FX.burstAt($('#score'), 60); SB.FX.pulse(0.8); setTimeout(() => UI.showChoice(), 450); }
      else if (e.type === 'clearfx') UI.boardFx(e);
      else if (e.type === 'cellpops') UI.cellPops(e);
      else if (e.type === 'slam') UI.slam(e);
      else if (e.type === 'rival') UI.rivalFx(e);
      else if (e.type === 'finish') {
        if (g.endReason === 'timeout' && e.outcome !== 'cash') UI.timeUp();
        const gref = g;
        setTimeout(() => { if (UI.game === gref) UI.onFinish(e.outcome); }, e.outcome === 'lose' ? 1200 : 500);
      }
    }
    const hgt = SB.clamp((g.stackHeight() - g.HID) / g.H, 0, 1);
    SB.FX.setDanger(g.status === 'playing' ? SB.clamp((hgt - 0.6) / 0.4, 0, 1) : 0);
    SB.Music.setIntensity(Math.max(hgt * 0.9, (g.level - 1) / 12));
    SB.Music.setPaused(g.status === 'paused');
    const bw = $('#boardWrap');
    if (bw) bw.classList.toggle('danger', hgt > 0.7);
    const cd = $('#countdown');
    if (cd) {
      if (UI.countdown > 0) { cd.textContent = UI.countdown > 0.6 ? 'READY' : 'GO!'; cd.style.display = 'block'; }
      else cd.style.display = 'none';
    }
  };

  // floating badges where enchanted cells fired
  // hard drop jolts the whole board down a few pixels, harder the further the piece fell
  UI.slam = function (e) {
    if (!SB.meta.data.settings.shake) return;
    const bw = $('#boardWrap');
    const c = bw && bw.parentElement;
    if (!c) return;
    c.style.setProperty('--slam', (3 + e.power * 6).toFixed(1) + 'px');
    c.classList.remove('slam'); void c.offsetWidth; c.classList.add('slam');
  };
  UI.cellPops = function (e) {
    const g = UI.game, fx = $('#boardFx');
    if (!g || !fx) return;
    const pops = SB.meta.data.settings.scorePops !== false;
    const cs = UI.cs, top = g.HID - 2;
    e.pops.forEach((p, i) => {
      const def = SB.CELLS[p.cell] || { color: '#ffffff', icon: '' };
      setTimeout(() => {
        if (!fx.isConnected) return;
        const cx = p.x * cs + cs / 2, cy = (p.r - top) * cs + cs / 2;
        if (pops) {
          const el = document.createElement('div');
          el.className = 'fx-cell' + (p.dud ? ' dud' : '') + (p.k === 'x' ? ' xm' : '') + (/^-/.test(p.text) ? ' neg' : '');
          el.style.left = cx + 'px'; el.style.top = cy + 'px';
          el.style.setProperty('--cc', def.color);
          el.innerHTML = `<span class="g">${def.icon || ''}</span>${esc(p.text)}`;
          fx.appendChild(el);
          setTimeout(() => el.remove(), 1200);
        }
        if (!p.dud) {
          const ring = document.createElement('div');
          ring.className = 'fx-cellring';
          ring.style.left = cx + 'px'; ring.style.top = cy + 'px';
          ring.style.setProperty('--cc', def.color);
          fx.appendChild(ring);
          setTimeout(() => ring.remove(), 700);
          const r = $('#board').getBoundingClientRect();
          SB.FX.confetti(r.left + cx, r.top + cy, 10, { spark: true, speed: 260, spread: Math.PI * 2, colors: [def.color, '#ffffff'] });
          SB.audio.play('cell', i);
        }
      }, 90 + i * 130);
    });
  };

  UI.boardFx = function (e) {
    const g = UI.game, fx = $('#boardFx'), cv = $('#board');
    if (!g || !fx || !cv) return;
    const cs = UI.cs;
    const top = g.HID - 2;
    const ys = e.rows.map((r) => (r - top) * cs + cs / 2);
    const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const w = g.W * cs;
    const pops = SB.meta.data.settings.scorePops !== false;
    if (e.label && pops) {
      const el = document.createElement('div');
      el.className = 'fx-label' + (e.big ? ' big' : '');
      el.innerHTML = esc(e.label) + (e.b2b ? '<small>BACK-TO-BACK</small>' : '');
      el.style.top = Math.max(40, midY - 30) + 'px';
      fx.appendChild(el);
      setTimeout(() => el.remove(), 1400);
    }
    if (e.combo > 1 && pops) {
      const el = document.createElement('div');
      el.className = 'fx-combo';
      el.textContent = 'COMBO ×' + e.combo;
      el.style.top = Math.max(20, midY - 70) + 'px';
      fx.appendChild(el);
      setTimeout(() => el.remove(), 1100);
    }
    if (pops) {
      const sp = document.createElement('div');
      sp.className = 'fx-score' + (e.xm ? ' hot' : '');
      sp.textContent = '+' + fmt(e.score);
      sp.style.top = (midY + 4) + 'px';
      fx.appendChild(sp);
      setTimeout(() => sp.remove(), 1200);
    }
    if (e.big) {
      const ring = document.createElement('div');
      ring.className = 'fx-ring';
      ring.style.top = midY + 'px'; ring.style.left = w / 2 + 'px';
      fx.appendChild(ring);
      setTimeout(() => ring.remove(), 800);
    }
    const r = cv.getBoundingClientRect(), style = g.clearStyle || 'classic';
    if (style === 'classic') SB.FX.confetti(r.left + r.width / 2, r.top + midY, e.big ? 40 : 10 + 4 * e.lines, { spark: true, speed: e.big ? 700 : 400, spread: Math.PI * 2 });
    else UI.styleFx(style, e, r, midY);
    SB.FX.pulse(e.big ? 0.9 : 0.15 + 0.1 * e.lines);
    const wrap = $('#boardWrap');
    wrap.classList.remove('bump', 'bigbump'); void wrap.offsetWidth; wrap.classList.add(e.big ? 'bigbump' : 'bump');
    const sc = $('#score');
    if (sc) { sc.classList.remove('punch'); void sc.offsetWidth; sc.classList.add('punch'); }
  };

  // the screen-sized half of a bought clear effect (the board half is Game.clearFx)
  UI.styleFx = function (style, e, r, midY) {
    const n = e.lines || 1, big = !!e.big, y = r.top + midY, cx = r.left + r.width / 2;
    SB.audio.play('fx_' + style, n);
    const flash = (color, ms, delay) => setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'screen-flash';
      el.style.background = color; el.style.animationDuration = ms + 'ms';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), ms + 50);
    }, delay || 0);
    const kick = (cls, ms) => { const b = $('#board'); if (!b) return; b.classList.remove(cls); void b.offsetWidth; b.classList.add(cls); setTimeout(() => b.classList.remove(cls), ms); };
    if (style === 'confetti') {
      // cannons on both sides of the board, more of them for bigger clears
      const shots = big ? 4 : Math.min(3, n);
      for (let i = 0; i < shots; i++) setTimeout(() => {
        SB.FX.confetti(r.left - 6, y + 20, 16 + n * 6, { dir: -Math.PI / 2 + 0.55, spread: 0.7, speed: 900 });
        SB.FX.confetti(r.right + 6, y + 20, 16 + n * 6, { dir: -Math.PI / 2 - 0.55, spread: 0.7, speed: 900 });
      }, i * 110);
      if (big) setTimeout(() => SB.FX.confetti(cx, r.top - 10, 70, { dir: -Math.PI / 2, spread: Math.PI * 1.6, speed: 650 }), 420);
    } else if (style === 'lightning') {
      flash('radial-gradient(circle at 50% ' + Math.round((y / innerHeight) * 100) + '%, rgba(220,240,255,.85), rgba(120,190,255,.35) 45%, rgba(40,80,200,0) 80%)', 260);
      if (big) flash('rgba(235,246,255,.75)', 200, 170);
      SB.FX.confetti(cx, y, 14 + n * 6, { spark: true, colors: ['#bfe6ff', '#ffffff', '#5cc8ff'], speed: 820, spread: Math.PI * 2 });
    } else if (style === 'fireworks') {
      const shells = big ? 6 : n > 1 ? 2 : 0;
      for (let i = 0; i < shells; i++) setTimeout(() => {
        const px = r.left + r.width * (0.1 + Math.random() * 0.8), py = r.top + Math.random() * r.height * 0.35;
        SB.FX.confetti(px, py, 26, { spark: true, colors: [['#ff5ce1', '#fff35c'], ['#5cf0ff', '#ffffff'], ['#ffd27a', '#ff9a3b']][i % 3], speed: 520, spread: Math.PI * 2 });
      }, 380 + i * 170);
      if (big) flash('radial-gradient(circle at 50% 30%, rgba(255,220,150,.45), rgba(255,160,80,0) 70%)', 380, 300);
    } else if (style === 'shatter') {
      SB.FX.confetti(cx, y, 10 + n * 6, { spark: true, colors: ['#ffffff', '#c8fbff', '#9feaff'], speed: 700, spread: Math.PI * 2 });
      if (big) { flash('rgba(225,250,255,.6)', 180); kick('crack', 500); }
    } else if (style === 'hellfire') {
      flash('radial-gradient(ellipse at 50% ' + Math.round((y / innerHeight) * 100) + '%, rgba(255,150,60,.55), rgba(220,40,10,.25) 45%, rgba(120,0,0,0) 75%)', 360);
      SB.FX.confetti(cx, y, 14 + n * 6, { spark: true, colors: ['#ffd27a', '#ff9a3b', '#ff4d2e'], speed: 640, dir: -Math.PI / 2, spread: 1.6 });
      if (big) { flash('rgba(255,90,28,.45)', 260, 160); kick('crack', 500); }
    } else if (style === 'dissolve') {
      kick('glitch', 360);
      SB.FX.confetti(cx, y, 8 + n * 5, { spark: true, colors: ['#26f0ff', '#ff2bd6', '#ffffff'], speed: 380, dir: -Math.PI / 2, spread: 1.4 });
      if (big) flash('linear-gradient(90deg, rgba(38,240,255,.35), rgba(255,43,214,.35))', 240);
    }
  };

  UI.floatMoney = function (v) {
    const m = $('#money');
    if (!m) return;
    const el = document.createElement('div');
    el.className = 'float-money ' + (v < 0 ? 'neg' : '');
    el.textContent = (v < 0 ? '-$' : '+$') + Math.abs(v);
    m.parentElement.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  };

  // the clock hit zero: a big TIME label over the board
  UI.timeUp = function () {
    const fx = $('#boardFx');
    SB.audio.play('topout');
    if (!fx) return;
    const el = document.createElement('div');
    el.className = 'fx-label big time-up';
    el.textContent = "TIME'S UP";
    el.style.top = '40%';
    fx.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  };
  // time added to the Stack clock: a float on the clock, and a toast for big gains
  UI.clockGain = function (v, why) {
    const box = $('#clockBox');
    if (box) {
      const el = document.createElement('div');
      el.className = 'float-time';
      el.textContent = '+' + (v >= 60 ? Run.fmtClock(v) : v + 's');
      box.appendChild(el);
      setTimeout(() => el.remove(), 1300);
      box.classList.remove('gain'); void box.offsetWidth; box.classList.add('gain');
    }
    if (why) UI.toast(`${SB.uiIco('time')} ${esc(why)}: +${Run.fmtClock(v)} on the clock`);
  };

  UI.rivalFx = function (e) {
    const cv = $('#rivalCv');
    if (e.kind === 'ko') { if (cv) SB.FX.burstAt(cv, 60, { spark: true, colors: ['#ffd23b', '#fff'] }); SB.FX.pulse(0.6); return; }
    const el = document.createElement('div');
    el.className = 'rival-pop ' + e.kind;
    el.textContent = (e.kind === 'send' ? '+' : '-') + e.n;
    const host = e.kind === 'send' ? cv && cv.parentElement : $('#boardWrap');
    if (!host) return;
    host.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  };
  // one score log entry: Mass (c), +Charge (m), x Charge (x), Charge set (=), money ($)
  UI.logCls = (l) => (l.k === 'c' ? 'chips' : l.k === 'm' ? 'mult' : l.k === 'x' || l.k === '=' ? 'xmult' : 'cash');
  UI.logVal = (l) => (l.k === 'c' ? (l.v < 0 ? '-' : '+') + fmt(Math.abs(l.v)) : l.k === 'm' ? (l.v < 0 ? '-' : '+') + SB.fmtX(Math.abs(l.v)) : l.k === 'x' ? 'x' + SB.fmtX(l.v) : l.k === '=' ? '= ' + SB.fmtX(l.v) : (l.v < 0 ? '-$' : '+$') + Math.abs(l.v));
  UI.showTally = function (t) {
    // keep this Stack's clears for the score breakdown (newest last)
    if (UI.scoreHistGame !== UI.game) { UI.scoreHistGame = UI.game; UI.scoreHist = []; }
    UI.scoreHist.push(t);
    if (UI.scoreHist.length > 40) UI.scoreHist.shift();
    const chipsEl = $('#tChips'), multEl = $('#tMult'), nameEl = $('#tName'), logEl = $('#tLog');
    if (!chipsEl) return;
    const box = $('#tally');
    box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
    nameEl.innerHTML = `${esc(t.name)}${t.lines > 1 && t.type !== 'tetris' && t.type !== 'double' && t.type !== 'triple' ? ' (' + t.lines + ' lines)' : ''}${t.b2b ? ' <span class="b2b">B2B</span>' : ''}${t.combo > 0 ? ' <span class="combo">Combo ' + t.combo + '</span>' : ''} ${t.locked ? '<b class="tally-score locked">No score until the Rival tops out</b>' : `<b class="tally-score">+${fmt(t.score)}</b>`}`;
    const entries = t.log.slice(-9);
    logEl.innerHTML = entries.map((l, i) => {
      return `<div class="tl ${UI.logCls(l)}" style="animation-delay:${i * 0.055}s"><span>${l.icon || ''} ${esc(l.label)}</span><b>${UI.logVal(l)}</b></div>`;
    }).join('');
    // count up chips & mult in sequence
    let chips = 0, mult = 0;
    const token = (UI.tallyToken = (UI.tallyToken || 0) + 1);
    const steps = t.log;
    const total = Math.min(steps.length, 14);
    const dt = 300 / Math.max(1, total);
    steps.forEach((l, i) => {
      setTimeout(() => {
        if (token !== UI.tallyToken) return;
        if (l.k === 'c') chips += l.v; else if (l.k === 'm') mult += l.v; else if (l.k === 'x') mult *= l.v; else if (l.k === '=') mult = l.v;
        if (i === steps.length - 1) { chips = t.chips; mult = t.mult; }
        chipsEl.textContent = fmt(chips);
        multEl.textContent = SB.fmtX(mult);
        if (l.k === 'x') { const pl = multEl.parentElement; pl.classList.remove('slam'); void pl.offsetWidth; pl.classList.add('slam'); SB.audio.play('xmult'); }
        else if (i < 12) SB.audio.play(l.k === 'm' ? 'mult' : 'tick', i);
      }, Math.min(i, total) * dt);
    });
  };

  // the score breakdown: every step of a clear's Mass x Charge in order, with the running totals.
  // UI.scoreLogLast: the finished Stack's clears (from the Workshop) instead of this Stack's
  const scoreLogHist = () => (UI.scoreLogLast ? ((UI.run && UI.run.lastScores) || {}).clears || [] : UI.scoreHistGame === UI.game ? UI.scoreHist : []);
  UI.openScoreLog = function () {
    const hist = scoreLogHist(), L = UI.scoreLogLast && UI.run.lastScores;
    const n = hist.length, i = SB.clamp(UI.scoreLogAt || 0, 0, Math.max(0, n - 1)), t = hist[i];
    const done = '<div class="menu-row"><button class="primary" data-act="closeModal">Done</button></div>';
    const where = L ? `<div class="sl-stack">Floor ${L.ante} · ${esc(L.name)} · scored ${fmt(L.score)}</div>` : '';
    if (!t) return UI.openModal(`<h1>${L ? 'Last Stack' : 'Last score'}</h1>${where}<p class="sl-none">${L ? 'No clears that Stack' : 'No clears yet this Stack'}</p>${done}`, 'score-modal');
    const top = Math.max(...hist.map((h) => h.score || 0));
    const best = n > 1 && top > 0 && i === hist.findIndex((h) => (h.score || 0) === top) ? '<span class="sl-best">Best</span>' : '';
    const nav = n > 1 ? `<div class="sl-nav"><button data-act="scoreLogStep" data-step="-1" aria-label="Earlier clear" ${i ? '' : 'disabled'}>${SB.glyph('left')}</button><span>Clear ${i + 1} of ${n}${best}</span><button data-act="scoreLogStep" data-step="1" aria-label="Later clear" ${i < n - 1 ? '' : 'disabled'}>${SB.glyph('right')}</button></div>` : '';
    let c = 0, m = 0;
    const rows = t.log.map((l) => {
      if (l.k === 'c') c += l.v; else if (l.k === 'm') m += l.v; else if (l.k === 'x') m *= l.v; else if (l.k === '=') m = l.v;
      const run = l.k === '$' ? '' : `<i class="c">${fmt(c)}</i><i class="x">×</i><i class="m">${SB.fmtX(Math.max(0, m))}</i>`;
      return `<li class="sl-row ${UI.logCls(l)}"><span class="sl-src">${l.icon ? `<span class="sl-ico">${l.icon}</span>` : ''}<span>${esc(l.label)}</span></span><b class="sl-val">${UI.logVal(l)}</b><span class="sl-run">${run}</span></li>`;
    }).join('');
    const raw = t.raw === undefined ? t.score : t.raw;
    const adj = (t.adj || []).map((a) => `<li class="sl-row adj"><span class="sl-src"><span>${esc(a.label)}</span></span><b class="sl-val">${esc(a.v)}</b><span class="sl-run"></span></li>`).join('')
      + (t.locked ? '<li class="sl-row adj"><span class="sl-src"><span>No score until the Rival tops out</span></span><b class="sl-val">0</b><span class="sl-run"></span></li>' : '');
    const name = `${esc(t.name)}${t.lines > 1 && !['double', 'triple', 'tetris'].includes(t.type) ? ' (' + t.lines + ' lines)' : ''}`;
    UI.openModal(`<h1>${L ? 'Last Stack' : i === n - 1 ? 'Last score' : 'Earlier score'}</h1>${where}${nav}
      <div class="sl-head"><b class="sl-name">${name}</b>${t.b2b ? '<span class="b2b">B2B</span>' : ''}${t.combo > 0 ? `<span class="combo">Combo ${t.combo}</span>` : ''}<b class="sl-score">+${fmt(t.score)}</b></div>
      <ol class="sl-steps">${rows}</ol>
      <div class="sl-sum"><span class="c">${SB.uiIco('mass')}${fmt(t.chips)}</span><i>×</i><span class="m">${SB.uiIco('charge')}${SB.fmtX(t.mult)}</span><i>=</i><b>${fmt(raw)}</b></div>
      ${adj ? `<ol class="sl-steps sl-adj">${adj}</ol>` : ''}
      ${done}`, 'score-modal');
  };

  UI.showChoice = function () {
    const g = UI.game;
    if (!g || g.status !== 'choice') return;
    const ng = g.nextGoal();
    const tier = SB.pushTier(g.pushTier);
    const net = SB.Run.hasRelic(UI.run, 'safety_net') && !UI.run.flags.netUsed;
    const done = g.pushesDone;
    let banked = 0;
    for (let i = 0; i < done; i++) banked += SB.pushTier(i).money;
    UI.openModal(`<h1>${done ? 'Goal reached!' : 'Target reached!'}</h1>
      <div class="choice-score">${fmt(g.score)}</div>
      <div class="choice-clock">${SB.uiIco('time')} ${Run.fmtClock(g.timeLeft())} left on the clock</div>
      <div class="choice-sub">${done ? `Push bonuses so far: <b class="gold">+$${banked}</b>` : `Beat ${fmt(g.target)} in ${Math.round(g.targetTime)}s`}</div>
      <div class="choice-btns">
        <button class="big cash" data-act="cashOut"><div>${SB.uiIco('money')} Bank <kbd>Q</kbd></div></button>
        <button class="big push" data-act="pushOn"><div>${SB.uiIco('fire')} Push On ${tier.name} <kbd>E</kbd></div><small>Reach ${fmt(ng)} from zero · <b>+1:00</b> · <b>+$${tier.money}${tier.tag ? ' and a Token' : ''}</b><br>${net ? 'Safety Net catches one failure' : '<span class="neg">Fail and the run ends</span>'}</small></button>
      </div>`, 'choice-modal');
    UI.choiceOpenedAt = performance.now();
  };

  UI.onFinish = function (outcome) {
    const g = UI.game;
    if (!g || UI.screen !== 'play') return;
    const run = UI.run;
    if (outcome === 'lose') {
      const pushing = g.pushTier > g.pushesDone;
      const why = g.endReason === 'timeout'
        ? (pushing ? 'Time ran out while pushing. Greed is a gamble!' : 'The clock ran out before you reached the target.')
        : (pushing ? 'You topped out while pushing. Greed is a gamble!' : 'The stack reached the top before the target.');
      return UI.endRun(false, why);
    }
    const res = g.result();
    const stack = UI.stack;
    SB.meta.data.bestScore = Math.max(SB.meta.data.bestScore || 0, res.score);
    const out = Run.completeStack(run, stack, res);
    // the Stack's clears stay viewable from the Workshop (Last Stack), and are saved with the run
    const hist = UI.scoreHistGame === g ? UI.scoreHist : [];
    run.lastScores = {
      name: stack.boss ? SB.BOSSES[stack.boss].name : stack.name, ante: stack.ante, score: res.score,
      clears: hist.map((t) => ({ name: t.name, type: t.type, lines: t.lines, b2b: t.b2b, combo: t.combo, score: t.score, raw: t.raw, chips: t.chips, mult: t.mult, log: t.log, adj: t.adj, locked: t.locked })),
    };
    SB.Ach.bump('stacks');
    if (!g.hardDrops) SB.Ach.bump('softStacks');
    if (stack.boss) SB.Ach.bump('wardens');
    if (run.endless) SB.Ach.best('endlessBest', run.endlessStacks || 0);
    UI.game = null;
    if (!out.victory && run.ante > 8 && !run.endless) { /* unreachable */ }
    if (stack.idx === 2 && !out.victory) Run.startAnte(run);
    UI.pendingVictory = out.victory;
    SB.saveRun(run);
    SB.meta.save();
    UI.show('payout', { out, res, stack });
    SB.audio.play('money');
  };

  UI.endRun = function (victory, reason) {
    const run = UI.run;
    const m = SB.meta.data;
    m.bestAnte = Math.max(m.bestAnte, run.ante);
    if (victory) {
      m.wins++;
      m.stakeWon[run.starter] = Math.max(m.stakeWon[run.starter] || 0, run.stake);
      // each Hazard won by itself counts for its achievement (any Builder)
      m.hazardsWon = Object.assign({}, m.hazardsWon, { [run.stake]: Date.now() });
      SB.Ach.best('bestWinStake', run.stake);
    }
    const unlocks = Run.checkUnlocks();
    const tickets = SB.Cosmetic.runTicket(run);
    SB.meta.save();
    SB.saveRun(null);
    UI.game = null;
    UI.show('gameover', { run, victory, reason, unlocks, tickets });
  };

  // ---------- bag modal ----------
  // after The Egg hatches: pick a piece to turn to Yolk (every material, no downsides). It waits until you choose.
  UI.eggChoice = function (sel) {
    const run = UI.run;
    if (!run || !run.flags.eggChoice || UI.modal || UI.screen !== 'shop') return;
    UI.openBag({
      type: 'choose', noCancel: true, title: 'The Egg hatched: choose a piece', sel,
      hint: `${esc(SB.MATERIALS.yolk.desc)}.`,
      label: (p) => matLabel(p, 'yolk'), note: (p) => matLabel(p, 'yolk'), act: () => 'Make it Yolk',
      onPick: (p) => pickMat(p, 'yolk', () => {
        p.mat = 'yolk';
        run.flags.eggChoice = false;
        SB.audio.play('levelup');
        UI.toast(`${esc(SB.SHAPES[p.shape].name)} is now Yolk`);
        SB.saveRun(run);
        UI.closeModal();
      }, (uid) => UI.eggChoice(uid)),
    });
  };
  // how a Material would land on a piece: added, replacing the one it has, or already there
  const matLabel = (p, m) => (p.mat === m ? `<span class="ml same">Already ${SB.MATERIALS[m].name}</span>` : p.mat ? `<span class="ml rep">Replaces ${SB.MATERIALS[p.mat].name}</span>` : `<span class="ml add">Adds ${SB.MATERIALS[m].name}</span>`);
  // a Material picked for a piece: straight on if the piece has none, after a check if it would replace one
  const pickMat = (p, m, apply, reopen) => {
    if (p.mat === m) return deny(`Already ${SB.MATERIALS[m].name}`);
    if (!p.mat) return apply();
    if (UI.modal) { UI.modal.onClose = null; UI.closeModal(); }
    UI.confirmMat(p, m, apply, () => reopen(p.uid));
  };
  UI.confirmMat = function (p, m, onYes, onBack) {
    const old = p.mat;
    UI.repAsk = { onYes };
    UI.openModal(`<h1>Replace ${SB.MATERIALS[old].name} with ${SB.MATERIALS[m].name}?</h1>
      <div class="rep-pair">${miniCv(p, 96, 72, 18)}${SB.glyph('next')}${miniCv(Object.assign({}, p, { mat: m }), 96, 72, 18)}</div>
      <div class="rep-lines">
        <div class="rep-out"><div>${kindTag('mat')} ${matName(old)} <span class="rep-tag">goes</span></div><div class="dim small">${esc(SB.MATERIALS[old].desc)}</div></div>
        <div class="rep-in"><div>${kindTag('mat')} ${matName(m)} <span class="rep-tag">takes its place</span></div><div class="dim small">${esc(SB.MATERIALS[m].desc)}</div></div>
      </div>
      <div class="menu-row"><button data-act="closeModal">Back</button><button class="primary" data-act="repYes">Replace</button></div>`, 'confirm-modal rep-modal', onBack);
  };
  UI.openBag = function (mode) {
    UI.bagMode = mode || { type: 'view' };
    UI.bagSel = (mode && mode.sel) || null;
    UI.bagShown = null;
    UI.openModal('<div id="bagWrap"></div>', 'bag-modal', () => { if (UI.screen !== 'play') UI.refresh(); });
    UI.bagMode = mode || { type: 'view' };
    UI.renderBag();
  };
  UI.renderBag = function () {
    const run = UI.run;
    const mode = UI.bagMode;
    const wrap = $('#bagWrap');
    if (!wrap) return;
    const rates = Run.pieceRates(run);
    const titles = { view: 'Your Bag', place: 'Place your new piece', patch: 'Attach the Bag Patch', choose: mode.title || 'Choose a piece', move: 'Move the piece' };
    const hint = mode.type === 'choose' ? mode.hint || '' : '';
    const ghostMode = mode.type === 'place' || mode.type === 'patch' || mode.type === 'move';
    if (UI.lastPointer && UI.lastPointer !== 'mouse') UI.bagHover = null;
    const choose = mode.type === 'choose';
    const list = run.pieces.slice().sort((a, b) => (rates.get(b) || 0) - (rates.get(a) || 0)).map((p) => {
      const r = rates.get(p) || 0;
      return `<div class="bag-item ${UI.bagSel === p.uid ? 'sel' : ''} ${p.banned ? 'banned' : ''}" data-act="bagSelect" data-uid="${p.uid}" ${UI.tip(tipPiece(p, r))}>
        ${miniCv(p, 44, 34, 9)}<div class="bi-text"><div class="bi-name">${esc(SB.SHAPES[p.shape].name)} ${UI.lvBadge(p)}</div>
        <div class="bi-sub"><span class="bi-rate">${p.banned ? '0%' : (r * 100).toFixed(1) + '%'}</span>${choose && mode.label ? `<span class="bi-extra">${mode.label(p)}</span>` : ''}</div></div>
      </div>`;
    }).join('');
    // the picked piece's details. On a phone they sit in the column beside the list, and with nothing
    // picked that column shows the Bag's numbers instead
    let detail;
    const sel = run.pieces.find((p) => p.uid === UI.bagSel);
    if (sel) {
      let btns;
      if (choose) {
        btns = `${mode.note ? `<div class="bd-note">${mode.note(sel)}</div>` : ''}<div class="bd-btns"><button class="primary" data-act="bagChoose" data-uid="${sel.uid}">${mode.act ? mode.act(sel) : 'Choose'}</button></div>`;
      } else {
        const fee = Run.removalFee(run, sel);
        const lockRemove = run.pieces.length <= 6;
        btns = `<div class="bd-btns">
          <button data-act="bagMove" data-uid="${sel.uid}">Move</button>
          <button class="danger" data-act="bagRemove" data-uid="${sel.uid}" ${lockRemove || run.money < fee ? 'disabled' : ''}>Remove ($${fee})</button>
        </div>
        ${lockRemove ? '<div class="dim small">Keep at least 6 pieces.</div>' : ''}`;
      }
      const fresh = UI.bagShown !== sel.uid;
      detail = `<div class="bag-detail ${fresh ? 'pop' : ''}"><div class="bd-art">${miniCv(sel, 96, 72, 18)}</div><div class="bd-info">${tipPiece(sel, rates.get(sel))}</div>${btns}</div>`;
    } else {
      detail = `<div class="bag-detail empty"><div class="bd-stats"><div><b>${Run.bagCellsUsed(run)}</b><span>cells used</span></div><div><b>${Run.bagFree(run)}</b><span>free</span></div><div><b>${run.pieces.length}</b><span>pieces</span></div><div><b>${Run.playableCount(run)}</b><span>playable</span></div></div></div>`;
    }
    UI.bagShown = sel ? sel.uid : null;
    let pending = '';
    if (mode.type === 'place') pending = `<div class="pending">${miniCv(mode.piece, 80, 60, 16)}<div>${tipPiece(Object.assign({ level: 1 }, mode.piece))}</div></div>`;
    wrap.innerHTML = `<h1>${titles[mode.type]}</h1>
      <div class="bag-body">
        <div class="bag-left"><canvas id="bagcv"></canvas>${hint ? `<div class="hint">${hint}</div>` : ''}
          <div class="dim small bag-sum">Bag: ${Run.bagCellsUsed(run)} cells used, ${Run.bagFree(run)} free · ${run.pieces.length} pieces (${Run.playableCount(run)} playable)</div></div>
        <div class="bag-right">${pending}<div class="bag-list">${list}</div>${detail}</div>
      </div>
      <div class="menu-row">${ghostMode ? `<button data-act="bagRotate">${SB.glyph('rotate')} Rotate</button>` : ''}${mode.type === 'view' ? '<button class="primary" data-act="closeModal">Done</button>' : mode.noCancel ? '' : `<button data-act="bagCancel">${mode.cancelLabel || 'Cancel'}</button>`}</div>`;
    UI.drawMinis(wrap);
    // on a phone the details column can sit below the fold: bring a newly picked piece's details into view
    const det = wrap.querySelector('.bag-detail.pop');
    if (det && UI.touch && det.scrollIntoView) det.scrollIntoView({ block: 'nearest' });
    const cv = $('#bagcv');
    // and when Move (or placing) starts, bring the Bag itself back into view
    if (ghostMode && UI.touch && UI.bagModeShown !== mode && cv.scrollIntoView) cv.scrollIntoView({ block: 'nearest' });
    UI.bagModeShown = mode;
    UI.bagCs = 42;
    UI.bagRot = UI.bagRot || 0;
    const draw = () => {
      const m = UI.bagMode;
      if (!m) return;
      let ghost = null;
      if (UI.bagHover && (m.type === 'place' || m.type === 'patch' || m.type === 'move')) {
        const cells = UI.bagGhostCells();
        const ox = UI.bagHover.x - Math.floor(Math.max(...cells.map((c) => c[0])) / 2);
        const oy = UI.bagHover.y - Math.floor(Math.max(...cells.map((c) => c[1])) / 2);
        const ok = m.type === 'patch' ? Run.patchFits(run, cells, ox, oy) : Run.bagFits(run, cells, ox, oy, m.type === 'move' ? m.piece : null);
        ghost = { cells, x: ox, y: oy, ok, piece: m.type === 'patch' ? null : m.piece };
      }
      SB.Render.bag(cv, run, UI.bagCs, ghost, UI.bagSel, rates);
      UI.bagGhost = ghost;
    };
    UI.drawBagNow = draw;
    cv.onmousemove = (e) => {
      const r = cv.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * 10), y = Math.floor(((e.clientY - r.top) / r.height) * 10);
      if (!UI.bagHover || UI.bagHover.x !== x || UI.bagHover.y !== y) { UI.bagHover = { x, y }; draw(); }
    };
    // a finger leaving for the Rotate button should not wipe the preview
    cv.onmouseleave = () => { if (UI.lastPointer && UI.lastPointer !== 'mouse') return; UI.bagHover = null; draw(); };
    cv.oncontextmenu = (e) => { e.preventDefault(); UI.bagRotate(); };
    // Placing: a double-tap (or double-click) turns the piece, and every quick tap after that turns it again.
    // On touch the first tap on a new spot only previews it; a single tap on the preview places it once the
    // double-tap window has passed, so a double-tap never places by accident.
    let placeTimer = null, lastUp = null;
    cv.onpointerup = (e) => {
      // only the main button places: a right-click turns the piece and must not drop it too
      if (!ghostMode || e.button !== 0) return;
      const r = cv.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * 10), y = Math.floor(((e.clientY - r.top) / r.height) * 10);
      const turn = lastUp && e.timeStamp - lastUp.t < BAG_DOUBLE_TAP && Math.abs(lastUp.x - x) <= 1 && Math.abs(lastUp.y - y) <= 1;
      lastUp = { t: e.timeStamp, x: turn ? lastUp.x : x, y: turn ? lastUp.y : y };
      clearTimeout(placeTimer);
      if (turn) { UI.bagRotate(); return; }
      const fresh = !UI.bagHover || UI.bagHover.x !== x || UI.bagHover.y !== y;
      UI.bagHover = { x, y };
      if (fresh && e.pointerType !== 'mouse') { draw(); SB.audio.play('rotate'); return; }
      const m = UI.bagMode;
      // it lands where it was clicked, even if the mouse has moved on before the double-click window closes
      placeTimer = setTimeout(() => { if (UI.bagMode === m && $('#bagcv') === cv) { UI.bagHover = { x, y }; draw(); UI.bagClick(); } }, BAG_DOUBLE_TAP);
    };
    cv.onclick = () => { if (!ghostMode) UI.bagClick(); };
    draw();
  };
  const BAG_DOUBLE_TAP = 350;
  UI.bagGhostCells = function () {
    const m = UI.bagMode;
    if (m.type === 'patch') {
      let c = m.cells;
      for (let i = 0; i < (UI.bagRot || 0); i++) c = Run.rotCells(c);
      return Run.normCells(c);
    }
    const shape = m.type === 'move' ? m.piece.shape : m.piece.shape;
    return Run.normCells(SB.SHAPES[shape].rots[UI.bagRot % 4]);
  };
  UI.bagRotate = function () { UI.bagRot = ((UI.bagRot || 0) + 1) % 4; if (UI.drawBagNow) UI.drawBagNow(); SB.audio.play('rotate'); };
  UI.bagClick = function () {
    const m = UI.bagMode, run = UI.run;
    if (!m) return;
    if (m.type === 'view' || m.type === 'choose') {
      if (!UI.bagHover) return;
      const occ = Run.bagOccupancy(run);
      const p = occ[UI.bagHover.y * 10 + UI.bagHover.x];
      if (p) UI.act.bagSelect({ uid: p.uid });
      return;
    }
    const gh = UI.bagGhost;
    if (!gh || !gh.ok) { SB.audio.play('deny'); return; }
    if (m.type === 'place') {
      const p = Run.newPiece(run, m.piece.shape, m.piece.level || 1, { mat: m.piece.mat, special: m.piece.special, behavior: m.piece.behavior, bx: gh.x, by: gh.y, rot: UI.bagRot % 4 });
      run.pieces.push(p);
      const bon = Run.bagBonusAt(run, p);
      if (bon.includes('gilded') && Run.forgeLevels(run, p, 1)) UI.toast('Gilded cell: +1 level until this Floor ends');
      SB.audio.play('buy');
      const cb = m.onDone;
      UI.bagMode = { type: 'view' };
      UI.closeModal();
      if (cb) cb(p);
    } else if (m.type === 'move') {
      m.piece.bx = gh.x; m.piece.by = gh.y; m.piece.rot = UI.bagRot % 4;
      SB.audio.play('click');
      UI.bagMode = { type: 'view' };
      UI.renderBag();
    } else if (m.type === 'patch') {
      gh.cells.forEach(([cx, cy], i) => {
        const idx = (cy + gh.y) * 10 + cx + gh.x;
        run.bag.active[idx] = true;
        if (m.bonus && m.bonus.i === i) run.bag.bonus[idx] = m.bonus.type;
      });
      SB.audio.play('buy');
      const cb = m.onDone;
      UI.bagMode = { type: 'view' };
      if (cb) cb();
      UI.renderBag();
    }
  };

  // ---------- board modal ----------
  UI.openBoardView = function (mode) {
    UI.openModal('<div id="bpWrap"></div>', 'board-modal', () => { if (UI.screen !== 'play') UI.refresh(); });
    UI.boardMode = mode || { type: 'view' };
    UI.renderBoardModal();
  };
  UI.renderBoardModal = function () {
    const run = UI.run;
    const m = UI.boardMode;
    const wrap = $('#bpWrap');
    let legend = '';
    const counts = {};
    for (const k in run.board.cells) { const t = run.board.cells[k]; counts[t] = (counts[t] || 0) + 1; }
    for (const t in counts) legend += `<div class="leg"><canvas class="cell-cv" width="26" height="26" data-cell="${t}"></canvas><div><b>${SB.CELLS[t].name}</b> ×${counts[t]}<div class="dim small">${esc(SB.CELLS[t].desc)}</div></div></div>`;
    if (run.board.wells.length) legend += `<div class="leg"><span class="leg-cell" style="background:#4a7aff">${SB.BOARD_UPGRADES.well.icon}</span> Well column ×${run.board.wells.length}<div class="dim small">Blocks in it score double mass</div></div>`;
    if (run.board.overflow) legend += `<div class="leg">${SB.BOARD_UPGRADES.overflow.icon} Overflow Lip<div class="dim small">${esc(SB.BOARD_UPGRADES.overflow.desc)}</div></div>`;
    const title = m.type === 'cell' ? `Place: ${SB.CELLS[m.id].name}` : m.type === 'well' ? 'Pick a column for the Well' : m.type === 'brush' ? 'Pick a cell to paint' : 'Your Board';
    const hint = m.type === 'view' ? `Board ${run.board.w}×${run.board.h}` : m.type === 'cell' ? esc(SB.CELLS[m.id].desc) : m.type === 'well' ? esc(SB.BOARD_UPGRADES.well.desc) : 'Paints a random enchantment.';
    wrap.innerHTML = `<h1>${title}</h1><div class="board-body"><div class="bp-col"><canvas id="bpcv"></canvas><div id="bpInfo" class="dim small"></div></div><div class="board-legend"><div class="hint">${hint}</div>${legend || '<div class="dim">No enchantments yet.</div>'}</div></div>
      <div class="menu-row">${m.type === 'view' ? '<button class="primary" data-act="closeModal">Done</button>' : '<button data-act="boardCancel">Cancel</button>'}</div>`;
    const cv = $('#bpcv');
    const cs = Math.max(14, Math.min(28, Math.floor((window.innerHeight - 260) / run.board.h), Math.floor((window.innerWidth - 70) / run.board.w)));
    let hover = null;
    const draw = () => SB.Render.boardPreview(cv, run, cs, m.type !== 'view' ? hover : null, m.type);
    const at = (e) => {
      const r = cv.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * run.board.w);
      const y = Math.floor(((e.clientY - r.top) / r.height) * run.board.h);
      return { x: SB.clamp(x, 0, run.board.w - 1), yb: SB.clamp(run.board.h - 1 - y, 0, run.board.h - 1) };
    };
    const info = $('#bpInfo');
    cv.onmousemove = (e) => {
      hover = at(e);
      draw();
      if (info) {
        const cur = run.board.cells[hover.x + ',' + hover.yb];
        const row = hover.yb + 1;
        info.innerHTML = `Row ${row} from the bottom, column ${hover.x + 1}` + (cur && m.type !== 'view' && m.type !== 'well' ? ` <span class="warn">Replaces ${esc(SB.CELLS[cur].name)}</span>` : cur ? ` · ${esc(SB.CELLS[cur].name)}` : '');
      }
    };
    cv.onmouseleave = () => { if (UI.lastPointer && UI.lastPointer !== 'mouse') return; hover = null; draw(); };
    UI.drawCells(wrap);
    let armed = null;
    cv.onclick = (e) => {
      hover = at(e);
      if (m.type === 'view') { cv.onmousemove(e); return; }
      const key = hover.x + ',' + hover.yb;
      // touch: the first tap previews, a second tap on the same cell places
      if (UI.lastPointer && UI.lastPointer !== 'mouse' && armed !== key) {
        armed = key;
        cv.onmousemove(e);
        if (info) info.innerHTML += ' · <b>tap again to place</b>';
        return;
      }
      if (m.type === 'cell') { run.board.cells[key] = m.id; delete run.board.ash[key]; delete run.board.ember[key]; UI.toast(`${SB.CELLS[m.id].icon} ${esc(SB.CELLS[m.id].name)} placed`); SB.FX.burstAt(cv, 30, { spark: true, colors: [SB.CELLS[m.id].color, '#fff'] }); }
      else if (m.type === 'well') { if (run.board.wells.includes(hover.x)) { SB.audio.play('deny'); return; } run.board.wells.push(hover.x); }
      else if (m.type === 'brush') { m.onPick({ key }); return; }
      SB.audio.play('buy');
      const cb = m.onDone;
      UI.closeModal();
      if (cb) cb();
    };
    draw();
  };

  // ---------- packs ----------
  // Windsock: pick a Stack's modifier from every one this Floor allows (or none)
  UI.openWindsock = function (idx) {
    const run = UI.run;
    const cur = run.anteInfo.mods[idx] || null;
    const opt = (id) => {
      const md = id ? SB.STAGE_MODS[id] : null;
      const rw = !md ? '' : md.xmoney ? `x${md.xmoney} money` : md.money ? (md.money > 0 ? '+$' + md.money : '-$' + -md.money) : '';
      const clock = Run.stackClock(run, { boss: null, mod: id });
      return `<div class="pack-opt tilt vane-opt ${id === cur ? 'cur' : ''} ${md ? 'tier-' + md.tier : 'none'}" data-act="pickWindsock" data-i="${idx}" data-m="${id || ''}">
        <div class="po-name">${md ? md.name : 'No modifier'}</div>
        <div class="po-desc">${md ? esc(md.desc) : 'Plain rules, no extra money'}</div>
        <div class="vane-meta">${rw ? `<span class="pill gold">${rw}${md.tag ? ' + Token' : ''}</span>` : ''}${clock !== SB.STACK_CLOCK ? `<span class="pill clock">${SB.uiIco('time')} ${Run.fmtClock(clock)}</span>` : ''}${id === cur ? '<span class="pill cur">Current</span>' : ''}</div>
      </div>`;
    };
    const ids = [null].concat(Run.modChoices(run).sort((a, b) => SB.STAGE_MODS[a].tier - SB.STAGE_MODS[b].tier));
    UI.openModal(`<h1>${SB.RELICS.windsock.icon} Windsock</h1><div class="dim">Modifier for ${idx === 0 ? 'Stack I' : 'Stack II'}</div><div class="pack-opts vane-opts">${ids.map(opt).join('')}</div><div class="menu-row"><button data-act="closeModal">Keep ${cur ? esc(SB.STAGE_MODS[cur].name) : 'no modifier'}</button></div>`, 'pack-modal vane-modal');
  };
  const packClosed = () => { if (UI.screen !== 'play') UI.refresh(); };
  UI.openPiecePack = function (opts, title) {
    const run = UI.run;
    const cards = opts.map((o, i) => {
      if (o.type === 'upgrade') {
        const p = run.pieces.find((q) => q.uid === o.uid);
        if (!p) return '';
        return `<div class="pack-opt tilt" data-act="pickPiece" data-i="${i}" ${UI.tip(tipPiece(p))}>${miniCv(p, 90, 70, 16)}<div class="po-name">Upgrade ${esc(SB.SHAPES[p.shape].name)}</div><div class="po-desc">Level ${p.level} ${SB.glyph('to')} ${p.level + 1} for good<br>${(p.level + 1) % 5 === 0 ? `Unlocks its Lv${p.level + 1} bonus` : `${5 - ((p.level + 1) % 5)} more to its Lv${Math.floor((p.level + 1) / 5) * 5 + 5} bonus`}</div></div>`;
      }
      const fit = Run.canFitAnywhere(run, o.shape);
      const full = Run.shapeFull(run, o.shape);
      const have = Run.shapeCount(run, o.shape);
      const note = full ? `You already have ${have} (max ${Run.SHAPE_CAP})` : fit ? `Fits in your Bag${have ? ` · you have ${have}` : ''}` : 'No room: you must make space';
      return `<div class="pack-opt tilt ${full ? 'capped' : ''}" data-act="pickPiece" data-i="${i}" ${UI.tip(tipPiece(Object.assign({ level: 1 }, o)))}>${miniCv(o, 90, 70, 16)}<div class="po-name">${o.special ? SB.SPECIALS[o.special].name + ' ' : o.behavior ? SB.BEHAVIORS[o.behavior].name + ' ' : ''}${esc(SB.SHAPES[o.shape].name)}</div><div class="po-desc">${pieceDesc(Object.assign({ level: 1 }, o)) || 'A plain piece'}</div><div class="po-fit ${fit && !full ? '' : 'neg'}">${note}</div></div>`;
    }).join('');
    UI.openModal(`<h1>${title || 'Piece Pack'}</h1><div class="dim">Pick one</div><div class="pack-opts">${cards}</div><div class="menu-row"><button data-act="skipPack">Skip</button></div>`, 'pack-modal', packClosed);
    UI.packOpts = opts;
    UI.packTitle = title;
  };
  UI.openBoardPack = function (opts, title) {
    const cards = opts.map((o, i) => {
      if (o.type === 'cell') {
        const c = SB.CELLS[o.id];
        return `<div class="pack-opt tilt" data-act="pickBoard" data-i="${i}" style="--cc:${c.color}"><canvas class="cell-cv big" width="64" height="64" data-cell="${o.id}"></canvas><div class="po-name">${c.name}</div><div class="po-desc">${esc(c.desc)}</div></div>`;
      }
      const u = SB.BOARD_UPGRADES[o.id];
      return `<div class="pack-opt tilt ${u.rare ? 'rare' : ''}" data-act="pickBoard" data-i="${i}"><div class="po-cell up">${u.icon}</div><div class="po-name">${u.name}</div><div class="po-desc">${esc(u.desc)}</div></div>`;
    }).join('');
    UI.openModal(`<h1>${title || 'Board Pack'}</h1><div class="dim">Pick one</div><div class="pack-opts">${cards}</div><div class="menu-row"><button data-act="skipPack">Skip</button></div>`, 'pack-modal', packClosed);
    UI.packOpts = opts;
    UI.packTitle = title;
  };
  UI.openPatternPack = function (opts) {
    const run = UI.run;
    const cards = opts.map((o, i) => {
      const p = SB.PATTERNS[o.id];
      const L = run.levels[p.clear] || 1;
      const ct = p.clear === 'combo' ? null : SB.CLEARS[p.clear];
      const gain = ct ? `<span class="chips">+${ct.pc} Mass</span> <span class="mult">+${ct.pm} Charge</span>` : '<span class="mult">+1 Charge per combo step</span>';
      return `<div class="pack-opt tilt pat-opt" data-act="pickPattern" data-i="${i}"><div class="po-cell up">${p.art || p.icon}</div><div class="po-name">${p.name}</div><div class="po-desc">${ct ? ct.name : 'Combo'} Lv.${L} ${SB.glyph('to')} Lv.${L + 1}<br>${gain}</div></div>`;
    }).join('');
    UI.openModal(`<h1>Pattern Scroll</h1><div class="dim">Pick one</div><div class="pack-opts">${cards}</div><div class="menu-row"><button data-act="skipPack">Skip</button></div>`, 'pack-modal', packClosed);
    UI.packOpts = opts;
  };
  UI.openRelicPack = function (opts, title) {
    const cards = opts.map((o, i) => {
      const d = SB.RELICS[o.id];
      return `<div class="pack-opt tilt relic-opt r-${d.rarity}" data-act="pickRelic" data-i="${i}" ${UI.tip(tipRelic(o.id))}><div class="sc-rar">${d.rarity}</div><div class="po-cell up">${d.art}</div><div class="po-name">${esc(d.name)}</div><div class="po-desc">${esc(d.desc)}</div></div>`;
    }).join('');
    UI.openModal(`<h1>${esc(title || SB.PACKS.relic.name)}</h1><div class="dim">Pick one</div><div class="pack-opts">${cards}</div><div class="menu-row"><button data-act="skipPack">Skip</button></div>`, 'pack-modal', packClosed);
    UI.packOpts = opts;
  };

  UI.openLevels = function () {
    const run = UI.run;
    const rows = SB.CLEAR_ORDER.map((k) => {
      const c = SB.CLEARS[k], L = run.levels[k] || 1;
      return `<tr><td>${c.name}</td><td>Lv.${L}</td><td class="chips">${c.chips + c.pc * (L - 1)}</td><td class="mult">${c.mult + c.pm * (L - 1)}</td><td>${run.clearCounts[k] || 0}</td></tr>`;
    }).join('');
    const tc = Run.tagCounts(run);
    const trans = Object.keys(SB.TRANSFORMATIONS).map((t) => `<div class="${(tc[t] || 0) >= 3 ? 'on' : ''}"><b>${t}</b> ${tc[t] || 0}/3 ${SB.glyph('to')} ${SB.TRANSFORMATIONS[t].name}<div class="dim small">${esc(SB.TRANSFORMATIONS[t].desc)}</div></div>`).join('');
    const bps = run.blueprints.map((b) => `<span class="bp" ${UI.tip(`<b>${SB.BLUEPRINTS[b].name}</b><div>${esc(SB.BLUEPRINTS[b].desc)}</div>`)}>${SB.BLUEPRINTS[b].icon} ${SB.BLUEPRINTS[b].name}</span>`).join(' ') || '<span class="dim">none</span>';
    UI.openModal(`<h1>Run info</h1>
      <div class="levels-body">
        <div><h2>Clear types</h2><table class="lvl-table"><tr><th>Clear</th><th>Level</th><th>Mass</th><th>Charge</th><th>Used</th></tr>${rows}
          <tr><td>Combo step</td><td>Lv.${run.levels.combo}</td><td></td><td class="mult">+${run.levels.combo}/step</td><td></td></tr></table>
          <h2>Schematics</h2><div>${bps}</div>
          <h2>Seed</h2><div>${esc(run.seedStr)} · ${SB.STAKES[run.stake].name}</div></div>
        <div><h2>Transformations</h2><div class="dim small">Hold 3 curios with the same tag</div><div class="trans-list">${trans}</div></div>
      </div><div class="menu-row"><button class="primary" data-act="closeModal">Done</button></div>`, 'levels-modal');
  };

  UI.toggleMute = function () {
    SB.audio.muted = !SB.audio.muted;
    SB.meta.data.settings.muted = SB.audio.muted; SB.meta.save();
    SB.Music.applyVolume();
    UI.toast(SB.audio.muted ? SB.uiIco('mute') + ' Muted' : SB.uiIco('sound') + ' Sound on');
    const b = document.getElementById('muteBtn');
    if (b) (b.querySelector('.mi-label') || b).textContent = SB.audio.muted ? 'Sound: off' : 'Sound: on';
  };
  UI.pause = function () {
    const g = UI.game;
    if (!g || g.status !== 'playing') return;
    g.status = 'paused';
    const item = (act, label, cls, extra) => `<button class="mitem ${cls || ''}" data-act="${act}" ${extra || ''}><span class="mi-label">${label}</span></button>`;
    UI.openModal(`<h1>Paused</h1><nav class="mlist pause-menu" aria-label="Pause menu">
      ${item('resume', 'Resume', 'main')}
      ${item('pauseBag', 'View Bag &amp; rates')}
      ${item('pauseLevels', 'Run info')}
      ${item('scoreLog', 'Last score')}
      ${SB.Doki && SB.Doki.unlocked() ? `<button class="mitem" id="dokiBtn" data-act="toggleDoki"><span class="mi-label">Doki Doki style: ${SB.Doki.on() ? 'on' : 'off'}</span></button>` : ''}
      ${item('quitToMenu', 'Main menu', '', UI.tip('<b>Main menu</b><div>Your run is saved from the start of this Stack. Continue from the title screen to replay it.</div>'))}
      ${UI.touch ? `<button class="mitem" id="muteBtn" data-act="toggleMute"><span class="mi-label">${SB.audio.muted ? 'Sound: off' : 'Sound: on'}</span></button><button class="mitem" id="padBtn" data-act="togglePad"><span class="mi-label">${SB.meta.data.settings.touchButtons ? 'Buttons: on' : 'Buttons: off'}</span></button>` : ''}
      ${item('abandon', 'Abandon run', 'danger')}</nav>
      ${UI.touch ? UI.slider('swipeSens', 'Swipe sensitivity', 1, 5, 1, 'pause-sens') : ''}
      `, 'pause-modal', () => { if (UI.game && UI.game.status === 'paused') { UI.game.status = 'playing'; UI.countdown = 0.6; } });
    UI.secretKey('pause', g);
  };

  // ---------- actions ----------
  const deny = (msg) => { SB.audio.play('deny'); if (msg) UI.toast(esc(msg), 'bad'); if (UI.screen === 'shop' && /money/.test(msg || '')) UI.keeperSay('poor'); };
  UI.act = {
    title: () => { UI.closeModal(); UI.show('title'); },
    newRunScreen: () => { UI.closeModal(); UI.show('newRun'); },
    help: () => UI.show('help'),
    collection: () => UI.show('collection'),
    achievements: () => UI.show('achievements'),
    prizes: () => UI.show('prizes'),
    pokeKeeper: () => { UI.keeperSay('poke'); SB.audio.play('hover'); },
    // five quick taps on the Ticket open Flutter
    tixTap: () => {
      const now = Date.now();
      UI.tixTaps = now - (UI.tixLast || 0) < 900 ? (UI.tixTaps || 0) + 1 : 1; UI.tixLast = now;
      const el = document.querySelector('.prize-head .tix');
      if (el) { el.classList.remove('jig'); void el.offsetWidth; el.classList.add('jig'); }
      SB.audio.play('tick', UI.tixTaps * 2);
      if (UI.tixTaps >= 5 && SB.Flutter) { UI.tixTaps = 0; SB.Flutter.open({ onClose: () => { if (UI.screen === 'prizes') UI.show('prizes', null, true); } }); }
    },
    prizeTab: (d) => { UI.prizeTab = d.cat; SB.audio.play('tab'); UI.show('prizes', null, true); },
    prizeEquip: (d) => { SB.Cosmetic.equip(d.cat, d.id); if (d.cat === 'song') UI.prizeSong = null; if (d.cat === 'backdrop') UI.prizeView = null; SB.audio.play('equip'); if (d.cat === 'skin') SB.audio.skinLand(d.id, 1); UI.show('prizes', null, true); },
    prizeBuy: (d) => {
      if (!SB.Cosmetic.buy(d.cat, d.id)) return;
      SB.Cosmetic.equip(d.cat, d.id);
      if (d.cat === 'song') UI.prizeSong = null;
      if (d.cat === 'backdrop') UI.prizeView = null;
      SB.audio.play('unlock');
      if (d.cat === 'clear') SB.audio.play('fx_' + d.id, 2);
      UI.toast(`${SB.COSMETICS[d.cat].items[d.id].name} is yours and equipped`);
      UI.show('prizes', null, true);
      // the new prize gets its moment: the card pops and shines, confetti and sparks fly from it
      const card = document.querySelector(`.prize-card[data-pid="${d.cat}:${d.id}"]`);
      if (card) {
        card.classList.add('just-bought');
        setTimeout(() => card.classList.remove('just-bought'), 1400);
        SB.FX.burstAt(card, 46, { spread: Math.PI * 1.4, speed: 760 });
        setTimeout(() => SB.FX.burstAt(card, 30, { spark: true, spread: Math.PI * 2, speed: 480, colors: ['#ffd23b', '#fff4b0', '#ffffff'] }), 160);
      }
    },
    prizeListen: (d) => {
      UI.prizeSong = UI.prizeSong === d.id ? null : d.id;
      SB.Music.setSong(UI.prizeSong || SB.Cosmetic.equipped('song'), true);
      if (UI.prizeSong && (SB.audio.muted || !(SB.Music.volume > 0))) UI.toast('Music is muted. Turn it up in Settings to listen.');
      UI.show('prizes', null, true);
    },
    // Listen to a sound pack: a short run of moves, drops, clears and clicks in that pack
    prizeSfx: (d) => {
      clearTimeout(UI.prizeSfxT);
      SB.SFX.stopDemo();
      UI.prizeSfx = UI.prizeSfx === d.id ? null : d.id;
      if (UI.prizeSfx) {
        SB.SFX.demo(d.id);
        UI.prizeSfxT = setTimeout(() => { UI.prizeSfx = null; if (UI.screen === 'prizes') UI.show('prizes', null, true); }, SB.SFX.demoLength * 1000);
        if (SB.audio.muted) UI.toast('Sound is muted. Turn it on in Settings to listen.');
      }
      UI.show('prizes', null, true);
    },
    prizeView: (d) => {
      UI.prizeView = UI.prizeView === d.id ? null : d.id;
      SB.FX.setScene(SB.COSMETICS.backdrop.items[UI.prizeView || SB.Cosmetic.equipped('backdrop')].scene);
      UI.show('prizes', null, true);
    },
    settings: () => UI.show('settings'),
    pickStarter: (d) => { UI.seedInput = ($('#seedIn') || {}).value || ''; UI.selStarter = d.id; UI.show('newRun', null, true); },
    pickStake: (d) => { if (+d.i > 9 && !UI.hellOpen()) return; UI.seedInput = ($('#seedIn') || {}).value || ''; UI.selStake = +d.i; UI.show('newRun', null, true); },
    dailySeed: () => { const d = new Date(); $('#seedIn').value = `DAY${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`; },
    startRun: () => UI.startRun(),
    continueRun: () => UI.continueRun(),
    playStack: () => UI.playStack(),
    skipStack: () => { const msg = Run.skipStack(UI.run); if (msg) UI.toast(msg); SB.saveRun(UI.run); UI.show('map'); },
    openWindsock: (d) => UI.openWindsock(+d.i),
    pickWindsock: (d) => {
      const id = d.m || null;
      if (!Run.setMod(UI.run, +d.i, id)) return deny("Can't change that Stack");
      SB.audio.play('glyph');
      SB.saveRun(UI.run);
      UI.closeModal();
      UI.show('map');
      UI.toast(`${SB.RELICS.windsock.icon} ${+d.i === 0 ? 'Stack I' : 'Stack II'}: ${id ? esc(SB.STAGE_MODS[id].name) : 'no modifier'}`);
    },
    rerollMod: (d) => { if (!Run.rerollMod(UI.run, +d.i)) return deny('Not enough money'); SB.audio.play('click'); SB.saveRun(UI.run); UI.show('map'); },
    swapBoss: () => {
      const run = UI.run, was = run.anteInfo.boss;
      const id = Run.swapBoss(run);
      if (!id) return deny('Not enough money');
      SB.audio.play('buy');
      UI.toast(`${SB.RELICS.bribe.icon} ${esc(SB.BOSSES[was].name)} took the money. ${esc(SB.BOSSES[id].name)} guards this Floor instead`);
      SB.saveRun(run);
      UI.show('map');
    },
    shiftBoss: () => {
      const run = UI.run, was = run.anteInfo.boss;
      const id = Run.shiftBoss(run);
      if (!id) return deny('Not enough money');
      SB.audio.play('buy');
      UI.toast(`${SB.BLUEPRINTS.shift_change.icon} ${esc(SB.BOSSES[was].name)} is off duty. ${esc(SB.BOSSES[id].name)} guards this Floor instead`);
      SB.saveRun(run);
      UI.show('map');
    },
    abandon: () => {
      UI.openModal(`<h1>Abandon run?</h1><div>This run will be lost.</div><div class="menu-row"><button data-act="closeModal">Keep playing</button><button class="danger" data-act="confirmAbandon">Abandon</button></div>`, 'confirm-modal', () => { if (UI.game && UI.game.status === 'paused') UI.game.status = 'playing'; });
    },
    confirmAbandon: () => { UI.modal.onClose = null; UI.closeModal(); UI.endRun(false, 'Run abandoned.'); },
    resume: () => UI.closeModal(),
    // leave mid-Stack: the save from the start of the Stack is kept, so Continue replays it
    quitToMenu: () => { UI.modal.onClose = null; UI.closeModal(); UI.game = null; UI.show("title"); },
    pauseBag: () => { UI.modal.onClose = null; UI.closeModal(); UI.game.status = 'paused'; UI.openBag({ type: 'view', paused: true }); UI.modal.onClose = () => { if (UI.game) { UI.game.status = 'playing'; UI.countdown = 0.6; } }; },
    pauseLevels: () => { UI.modal.onClose = null; UI.closeModal(); UI.game.status = 'paused'; UI.openLevels(); UI.modal.onClose = () => { if (UI.game) { UI.game.status = 'playing'; UI.countdown = 0.6; } }; },
    // where the last clear's score came from; tapping the Mass x Charge box pauses the Stack to show it
    scoreLog: () => {
      const g = UI.game;
      if (!g || UI.screen !== 'play') return;
      if (UI.modal && !/pause-modal|score-modal/.test(UI.modal.cls || '')) return;
      if (UI.modal) { UI.modal.onClose = null; UI.closeModal(); }
      else if (g.status === 'playing') g.status = 'paused';
      else return;
      UI.scoreLogLast = false;
      UI.scoreLogAt = (UI.scoreHistGame === g && UI.scoreHist.length) ? UI.scoreHist.length - 1 : 0;
      UI.openScoreLog();
      UI.modal.onClose = () => { if (UI.game && UI.game.status === 'paused') { UI.game.status = 'playing'; UI.countdown = 0.6; } };
    },
    // the Workshop's Last Stack button: the finished Stack's clears, opening on its last one
    lastStack: () => {
      if (UI.screen !== 'shop' || UI.modal) return;
      UI.scoreLogLast = true;
      UI.scoreLogAt = Math.max(0, scoreLogHist().length - 1);
      UI.openScoreLog();
    },
    scoreLogStep: (d) => {
      const n = scoreLogHist().length;
      UI.scoreLogAt = SB.clamp((UI.scoreLogAt || 0) + (+d.step), 0, Math.max(0, n - 1));
      const close = UI.modal && UI.modal.onClose;
      UI.openScoreLog();
      UI.modal.onClose = close;
    },
    closeModal: () => UI.closeModal(),
    cashOut: () => { if (performance.now() - (UI.choiceOpenedAt || 0) < 300) return; UI.closeModal(); UI.game && UI.game.cashOut(); },
    pushOn: () => { if (performance.now() - (UI.choiceOpenedAt || 0) < 300) return; UI.closeModal(); if (UI.game) { UI.game.pushOn(); UI.countdown = 0.5; SB.audio.play('levelup'); } },
    toShop: () => {
      if (UI.pendingVictory) { UI.pendingVictory = false; UI.endRun(true); return; }
      UI.show('shop');
    },
    endless: () => {
      const run = UI.run;
      run.endless = true;
      Run.startAnte(run);
      SB.saveRun(run);
      UI.show('shop');
    },
    nextStack: () => { Run.leaveShop(UI.run); SB.saveRun(UI.run); UI.show('map'); },
    openBag: () => UI.openBag({ type: 'view' }),
    openBoard: () => UI.openBoardView({ type: 'view' }),
    openLevels: () => UI.openLevels(),
    sellRelic: (d) => { const sheet = UI.modal && UI.modal.cls === 'relic-sheet'; Run.sellRelic(UI.run, +d.i); SB.audio.play('money'); SB.saveRun(UI.run); if (sheet) UI.closeModal(); UI.refresh(); },
    relicLeft: (d) => { const i = +d.i, r = UI.run.relics; if (i > 0) { [r[i - 1], r[i]] = [r[i], r[i - 1]]; UI.refresh(); if (UI.modal && UI.modal.cls === 'relic-sheet') UI.relicSheet(i - 1); } },
    relicRight: (d) => { const i = +d.i, r = UI.run.relics; if (i < r.length - 1) { [r[i + 1], r[i]] = [r[i], r[i + 1]]; UI.refresh(); if (UI.modal && UI.modal.cls === 'relic-sheet') UI.relicSheet(i + 1); } },
    relicSheet: (d) => UI.relicSheet(+d.i),
    buyRelic: (d) => {
      const r = Run.buyRelic(UI.run, +d.i);
      if (r === 'money') return deny('Not enough money');
      if (r === 'slots') return deny('Curio slots full: sell one first');
      if (r === 'ok') { SB.audio.play('buy'); SB.FX.burstAt(UI.lastClickEl, 26, { spark: true, spread: Math.PI * 2, speed: 380 }); SB.saveRun(UI.run); UI.refresh(); }
    },
    buyCons: (d) => {
      const r = Run.buyCons(UI.run, +d.i);
      if (r === 'money') return deny('Not enough money');
      if (r === 'slots') return deny('Pocket full: use something first');
      if (r === 'ok') { SB.audio.play('buy'); SB.FX.burstAt(UI.lastClickEl, 26, { spark: true, spread: Math.PI * 2, speed: 380 }); SB.saveRun(UI.run); UI.refresh(); }
    },
    buyBlueprint: () => {
      const r = Run.buyBlueprint(UI.run);
      if (r === 'money') return deny('Not enough money');
      if (r === 'ok') { SB.audio.play('buy'); SB.FX.burstAt(UI.lastClickEl, 26, { spark: true, spread: Math.PI * 2, speed: 380 }); SB.saveRun(UI.run); UI.refresh(); }
    },
    reroll: () => { if (!Run.reroll(UI.run)) return deny('Not enough money'); SB.audio.play('click'); UI.refresh(); },
    buyPack: (d) => {
      const run = UI.run;
      const it = run.shop.packs[+d.i];
      if (!it || it.sold) return;
      if (run.money < it.price) return deny('Not enough money');
      if ((it.type === 'relic' || it.type === 'trophy') && run.relics.length >= Run.relicSlots(run)) return deny('Curio slots full: sell one first');
      Run.spend(run, it.price);
      it.sold = true;
      SB.audio.play('buy');
      SB.FX.burstAt(UI.lastClickEl, 30, { spread: Math.PI * 2, speed: 420 });
      SB.saveRun(run);
      UI.refresh();
      const pk = SB.PACKS[it.type] || SB.PACKS.piece;
      if (it.type === 'piece' || it.type === 'jumbo_piece') UI.openPiecePack(Run.genPiecePack(run, pk.n), pk.name);
      else if (it.type === 'board' || it.type === 'jumbo_board') UI.openBoardPack(Run.genBoardPack(run, pk.n), pk.name);
      else if (it.type === 'pattern') UI.openPatternPack(Run.genPatternPack(run));
      else if (it.type === 'trophy') UI.openRelicPack(Run.genTrophyPack(run), pk.name);
      else UI.openRelicPack(Run.genRelicPack(run));
    },
    pickPattern: (d) => {
      const run = UI.run;
      const o = UI.packOpts[+d.i];
      const p = SB.PATTERNS[o.id];
      Run.levelClear(run, p.clear, 1);
      UI.toast(`${p.icon} ${p.name}: ${p.clear === 'combo' ? 'Combo' : SB.CLEARS[p.clear].name} is now Level ${run.levels[p.clear]}`);
      SB.audio.play('levelup');
      SB.saveRun(run);
      UI.closeModal();
    },
    pickRelic: (d) => {
      const run = UI.run;
      const o = UI.packOpts[+d.i];
      if (run.relics.length >= Run.relicSlots(run)) return deny('Curio slots full: sell one first');
      run.relics.push({ id: o.id });
      UI.toast(`${SB.RELICS[o.id].icon} ${esc(SB.RELICS[o.id].name)} joins your curios`);
      SB.audio.play('levelup');
      SB.saveRun(run);
      UI.closeModal();
    },
    skipPack: () => { UI.closeModal(); },
    pickPiece: (d) => {
      const run = UI.run;
      const o = UI.packOpts[+d.i];
      if (o.type === 'upgrade') {
        const p = run.pieces.find((q) => q.uid === o.uid);
        Run.levelUp(run, p, 1);
        UI.toast(`${esc(SB.SHAPES[p.shape].name)} is now Level ${SB.pieceLv(p)}`);
        SB.audio.play('levelup');
        UI.closeModal();
        return;
      }
      if (Run.shapeFull(run, o.shape)) return deny(`Your Bag already holds ${Run.SHAPE_CAP} ${SB.SHAPES[o.shape].name} pieces`);
      const opts = UI.packOpts;
      UI.modal.onClose = null;
      UI.closeModal();
      UI.bagRot = 0;
      UI.openBag({ type: 'place', piece: o, cancelLabel: 'Back to pack', onDone: () => { SB.saveRun(run); UI.refresh(); }, onCancel: () => UI.openPiecePack(opts, UI.packTitle) });
    },
    pickBoard: (d) => {
      const run = UI.run;
      const o = UI.packOpts[+d.i];
      const opts = UI.packOpts, title = UI.packTitle;
      UI.modal.onClose = null;
      UI.closeModal();
      if (o.type === 'cell') UI.openBoardView({ type: 'cell', id: o.id, onCancel: () => UI.openBoardPack(opts, title), onDone: () => SB.saveRun(run) });
      else if (o.id === 'well') UI.openBoardView({ type: 'well', onCancel: () => UI.openBoardPack(opts, title), onDone: () => SB.saveRun(run) });
      else { Run.applyBoardUpgrade(run, o.id); UI.toast(`${SB.BOARD_UPGRADES[o.id].icon} ${SB.BOARD_UPGRADES[o.id].name} applied`); SB.audio.play('levelup'); SB.saveRun(run); UI.refresh(); }
    },
    boardCancel: () => { const m = UI.boardMode; UI.modal.onClose = null; UI.closeModal(); if (m && m.onCancel) m.onCancel(); else UI.refresh(); },
    bagRotate: () => UI.bagRotate(),
    toggleMute: () => UI.toggleMute(),
    toggleDoki: () => { if (!SB.Doki) return; SB.Doki.set(!SB.Doki.on()); const b = document.getElementById('dokiBtn'); if (b) b.innerHTML = `<span class="mi-label">Doki Doki style: ${SB.Doki.on() ? 'on' : 'off'}</span>`; },
    togglePad: () => {
      const st = SB.meta.data.settings;
      st.touchButtons = !st.touchButtons;
      SB.meta.save();
      if (UI.screen === 'play' && UI.game) { UI.buildPlay(); requestAnimationFrame(() => UI.resize()); }
      const b = document.getElementById('padBtn');
      if (b) (b.querySelector('.mi-label') || b).textContent = st.touchButtons ? 'Buttons: on' : 'Buttons: off';
      UI.toast(st.touchButtons ? 'Buttons on' : 'Buttons off');
    },
    liveGlyph: (d) => { if (UI.screen === 'play' && UI.game && !UI.modal) UI.useLive(+d.i); },
    bagCancel: () => {
      const m = UI.bagMode;
      if (m && m.noCancel) return;
      if (m && m.type === 'move') { UI.bagMode = m.prev || { type: 'view' }; UI.renderBag(); return; }
      UI.modal.onClose = null; UI.closeModal(); if (m && m.onCancel) m.onCancel(); else UI.refresh(); },
    buyPatch: () => {
      const run = UI.run;
      const pt = run.shop.patch;
      if (!pt || pt.sold) return;
      if (run.money < pt.price) return deny('Not enough money');
      UI.bagRot = 0;
      UI.openBag({ type: 'patch', cells: pt.cells, bonus: pt.bonus, onDone: () => { Run.spend(run, pt.price); pt.sold = true; SB.saveRun(run); } });
    },
    forge: () => {
      const run = UI.run;
      const maxed = (p) => SB.pieceLv(p) >= SB.MAX_LEVEL;
      UI.openBag({
        type: 'choose', title: 'Forge: +1 level to a piece',
        get hint() { return `This one costs $${Run.forgePrice(run)}, and each forge doubles the price until you leave. Levels are kept for the run. Bonuses at Lv5, Lv10 and Lv15.`; },
        label: (p) => (maxed(p) ? 'MAX' : '$' + Run.forgePrice(run)),
        act: (p) => (maxed(p) ? 'Max level' : `Forge $${Run.forgePrice(run)}`),
        onPick: (p) => {
          if (maxed(p)) return deny(`Already Level ${SB.MAX_LEVEL}`);
          const price = Run.forgePrice(run);
          if (run.money < price) return deny('Not enough money');
          Run.spend(run, price);
          Run.levelUp(run, p, 1);
          run.shop.forges = (run.shop.forges || 0) + 1;
          SB.audio.play('levelup');
          UI.toast(`${esc(SB.SHAPES[p.shape].name)} is now Level ${SB.pieceLv(p)}`);
          SB.saveRun(run);
          UI.renderBag();
        },
      });
    },
    bagSelect: (d) => {
      const m = UI.bagMode;
      const p = UI.run.pieces.find((q) => q.uid === +d.uid);
      if (!p) return;
      // with a mouse, a click picks it (hovering already shows what it is); a finger first opens its details,
      // and the button there does it
      if (m && m.type === 'choose') { if (UI.touch) { UI.bagSel = p.uid; UI.renderBag(); return; } m.onPick(p); return; }
      // picking another piece from the list while moving one cancels the move
      if (m && m.type === 'move') { UI.bagMode = m.prev || { type: 'view' }; UI.bagSel = p.uid; UI.renderBag(); return; }
      UI.bagSel = UI.bagSel === p.uid ? null : p.uid;
      UI.renderBag();
    },
    repYes: () => {
      const a = UI.repAsk;
      UI.repAsk = null;
      if (UI.modal) { UI.modal.onClose = null; UI.closeModal(); }
      if (!a) return;
      a.onYes();
      if (!UI.modal && UI.screen !== 'play') UI.refresh();
    },
    bagChoose: (d) => {
      const m = UI.bagMode;
      const p = UI.run.pieces.find((q) => q.uid === +d.uid);
      if (m && m.type === 'choose' && p) m.onPick(p);
    },
    bagRemove: (d) => {
      const run = UI.run;
      const p = run.pieces.find((q) => q.uid === +d.uid);
      if (!p) return;
      if (run.pieces.length <= 6) return deny('You need at least 6 pieces');
      const fee = Run.removalFee(run, p);
      if (run.money < fee) return deny('Not enough money');
      Run.spend(run, fee);
      run.removals++;
      Run.destroyPiece(run, p);
      UI.bagSel = null;
      SB.audio.play('shatter');
      SB.saveRun(run);
      UI.renderBag();
    },
    bagMove: (d) => {
      const p = UI.run.pieces.find((q) => q.uid === +d.uid);
      if (!p) return;
      const prev = UI.bagMode;
      UI.bagRot = p.rot || 0;
      UI.bagMode = { type: 'move', piece: p, onCancel: null };
      UI.bagMode.prev = prev;
      UI.renderBag();
    },
    useCons: (d) => UI.useConsumable(+d.i),
    resetMeta: () => {
      UI.openModal('<h1>Reset all progress?</h1><div>Unlocks, stats and your saved run will be erased.</div><div class="menu-row"><button data-act="closeModal">Cancel</button><button class="danger" data-act="confirmReset">Reset</button></div>', 'confirm-modal');
    },
    confirmReset: () => { SB.meta.data = SB.meta.defaults(); SB.Cosmetic.fix(); SB.meta.save(); SB.saveRun(null); UI.applyFont(); SB.Cosmetic.apply(); UI.closeModal(); UI.show('title'); },
    bindKey: (d) => {
      const L = UI.listenKey;
      UI.listenKey = L && L.a === d.a && L.i === +d.i ? null : { a: d.a, i: +d.i };
      const el = document.getElementById('keysPanel');
      if (el) el.innerHTML = UI.keysPanel();
    },
    resetKeys: () => { UI.listenKey = null; delete SB.meta.data.settings.keys; SB.meta.save(); UI.show('settings', null, true); },
    selHold: (d) => { const g = UI.screen === 'tutorial' && UI.tut && UI.tut.game ? UI.tut.game : UI.game; if (g) g.selectHold(+d.i); },
  };

  UI.useConsumable = function (i) {
    const run = UI.run;
    const c = run.consumables[i];
    if (!c) return;
    const inf = Run.consInfo(c);
    if (inf.secret) return UI.openSecret(c);
    if (UI.screen === 'play') return;
    const finish = (msg) => {
      if (msg && msg.error) return deny(msg.error);
      if (msg) UI.toast(esc(msg));
      SB.audio.play('glyph');
      SB.saveRun(run);
      UI.refresh();
    };
    if (inf.live) return deny(UI.touch ? 'Live Glyphs are used during a Stack: tap them at the top of the screen' : 'Live Glyphs are used during a Stack with keys 1-4');
    if (inf.target === 'piece') {
      const g = c.kind === 'glyph' ? SB.GLYPHS[c.id] : {};
      const use = (p) => { const msg = Run.useConsumable(run, i, { uid: p.uid }); if (msg && msg.error) return deny(msg.error); if (UI.modal) { UI.modal.onClose = null; UI.closeModal(); } finish(msg); };
      const open = (sel) => UI.openBag({
        type: 'choose', title: `${inf.icon} ${inf.name}: choose a piece`, hint: esc(inf.desc), sel,
        label: g.mat ? (p) => matLabel(p, g.mat) : null, note: g.mat ? (p) => matLabel(p, g.mat) : null,
        act: (p) => (g.mat ? `Make it ${SB.MATERIALS[g.mat].name}` : c.id === 'ban' ? (p.banned ? 'Unban' : 'Ban') : esc(inf.name)),
        onPick: (p) => (g.mat ? pickMat(p, g.mat, () => use(p), open) : use(p)),
      });
      open();
      return;
    }
    // Transmute: every piece's Material is replaced, so say which ones have one first
    const lose = consMat(c) === 'all' ? run.pieces.filter((p) => p.mat) : [];
    if (lose.length) {
      UI.repAsk = { onYes: () => finish(Run.useConsumable(run, i)) };
      UI.openModal(`<h1>Replace every Material?</h1>
        <div class="rep-sub">${esc(inf.desc)}. ${lose.length === 1 ? 'This piece loses its Material' : `These ${lose.length} pieces lose their Materials`}:</div>
        <div class="rep-list">${lose.map((p) => `<div class="rep-piece">${miniCv(p, 64, 48, 12)}<div><b>${esc(SB.SHAPES[p.shape].name)}</b> ${matName(p.mat)}</div></div>`).join('')}</div>
        <div class="menu-row"><button data-act="closeModal">Back</button><button class="primary" data-act="repYes">${esc(inf.name)}</button></div>`, 'confirm-modal rep-modal');
      return;
    }
    if (inf.target === 'cell') {
      UI.openBoardView({ type: 'brush', onPick: (t) => { const msg = Run.useConsumable(run, i, t); UI.modal.onClose = null; UI.closeModal(); finish(msg); } });
      return;
    }
    if (inf.target === 'patch') {
      UI.bagRot = 0;
      UI.openBag({ type: 'patch', cells: [[0, 0], [1, 0]], bonus: null, onDone: () => { Run.useConsumable(run, i, {}); UI.toast('Bag expanded'); SB.saveRun(run); } });
      return;
    }
    finish(Run.useConsumable(run, i));
  };

  UI.useLive = function (i) {
    const g = UI.game, run = UI.run;
    const c = run.consumables[i];
    if (!g || !c) return;
    const inf = Run.consInfo(c);
    if (inf.secret) return UI.openSecret(c);
    if (!inf.live) { deny(`${inf.name} can only be used between Stacks`); return; }
    if (g.useLive(c.id)) {
      run.consumables.splice(i, 1);
      SB.meta.data.consumablesUsed++;
      UI.toast(`${inf.icon} ${esc(inf.name)}!`);
      UI.renderPlayCons();
    }
  };

  // ---------- the secret code: hard, hard, turn left x2, turn right x2, left, right, pause (during a Stack) ----------
  // A slide that moves several cells counts as one left or right. Finding it pays the Secret Admirer achievement
  // and puts a Love Letter in the Pocket for the rest of the run (one per run).
  const CODE = ['hard', 'hard', 'ccw', 'ccw', 'cw', 'cw', 'left', 'right', 'pause'];
  let codeHist = [];
  UI.secretKey = function (name, g) {
    if (UI.screen !== 'play' || !UI.game || (g && g !== UI.game)) { codeHist = []; return; }
    if ((name === 'left' || name === 'right') && codeHist[codeHist.length - 1] === name) return;
    codeHist.push(name);
    if (codeHist.length > CODE.length) codeHist.shift();
    if (codeHist.join() === CODE.join()) { codeHist = []; UI.secretFound(); }
  };
  UI.secretFound = function () {
    const run = UI.run;
    SB.Ach.bump('secretCode');
    if (run && !run.consumables.some((c) => c.kind === 'secret' && c.id === 'love_letter')) {
      run.consumables.push({ kind: 'secret', id: 'love_letter' });
      SB.saveRun(run);
      UI.renderPlayCons();
      UI.toast(`${SB.SECRET_ITEMS.love_letter.icon} A Love Letter slipped into your Pocket`);
    }
    SB.audio.play('unlock');
    SB.Ach.check();
  };
  UI.openSecret = function (c) {
    if (c.id !== 'love_letter') return;
    if (!SB.Dating || !SB.Dating.open) return deny('Falling for You is not in this build');
    SB.Dating.open({ run: UI.run, onClose: () => { if (UI.screen !== 'play') UI.refresh(); else UI.renderPlayCons(); } });
  };

  // actions with a sound of their own (or none wanted) skip the soft tap every other button makes
  const QUIET_ACTS = new Set(['tixTap', 'pokeKeeper', 'prizeTab', 'prizeEquip', 'prizeBuy', 'prizeListen', 'prizeSfx', 'toggleMute', 'toggleDoki']);
  // ---------- input ----------
  function onKey(e, down) {
    if (down) SB.audio.init();
    const k = e.key;
    const code = e.code;
    // Settings > Keys is waiting for a key: this one becomes the binding
    if (UI.listenKey) { e.preventDefault(); if (down && !e.repeat) UI.finishBind(code); return; }
    const km = UI.keyMap(), act = km[code];
    if (down && code === 'KeyM' && !act && !(e.target && e.target.tagName === 'INPUT')) {
      UI.toggleMute();
      return;
    }
    // arrow keys and Enter move through menus and dialogs (not on the practice board or mid-Stack)
    if (down && (UI.modal || (UI.screen !== 'play' && UI.screen !== 'tutorial')) && UI.navKey(e)) return;
    // modal-level keys
    if (down && UI.modal) {
      if (UI.modal.cls === 'choice-modal') {
        if (k === 'q' || k === 'Q') UI.act.cashOut();
        if (k === 'e' || k === 'E') UI.act.pushOn();
        return;
      }
      if (k === 'Escape') { if (UI.bagMode && UI.bagMode.type !== 'view') UI.act.bagCancel(); else if (UI.boardMode && UI.boardMode.type !== 'view') UI.act.boardCancel(); else UI.closeModal(); return; }
      if ((k === 'r' || k === 'R') && UI.bagMode && UI.bagMode.type !== 'view') { UI.bagRotate(); return; }
      return;
    }
    // menu screens: Esc goes back to the title
    if (down && k === 'Escape' && ['collection', 'achievements', 'settings', 'help', 'newRun', 'tutorial', 'prizes'].includes(UI.screen)) { UI.act.title(); return; }
    // the tutorial's practice board takes the same controls as a real Stack
    const tg = UI.screen === 'tutorial' && UI.tut && UI.tut.game;
    if (!tg && (UI.screen !== 'play' || !UI.game)) return;
    const g = tg || UI.game;
    // game keys come from Settings > Keys (UI.keyMap: code -> action)
    if (act && act !== 'pause') { e.preventDefault(); if (tg && document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur(); }
    if (act === 'left') { UI.input.left = down; if (down) UI.input.lastDir = -1; }
    if (act === 'right') { UI.input.right = down; if (down) UI.input.lastDir = 1; }
    if (act === 'soft') UI.input.down = down;
    if (!down || e.repeat) return;
    if (tg && !act && code === 'KeyR') { UI.act.tutReset(); return; }
    if (k === 'Escape' || act === 'pause') { if (!tg) UI.pause(); return; }
    if (g.status !== 'playing' || (!tg && UI.countdown > 0)) return;
    if (act === 'left') { g.move(-1); g.das = { dir: -1, t: 0, arrAcc: 0 }; }
    else if (act === 'right') { g.move(1); g.das = { dir: 1, t: 0, arrAcc: 0 }; }
    else if (act === 'hard') g.hardDrop();
    else if (act === 'cw') g.rotate(1);
    else if (act === 'ccw') g.rotate(-1);
    else if (act === 'r180') g.rotate(2);
    else if (act === 'hold') g.hold();
    else if (act === 'holdNext') g.cycleHold(1);
    else if (act === 'holdPrev') g.cycleHold(-1);
    else if (!tg && !act && code && /^Digit[1-4]$/.test(code)) UI.useLive(+code.slice(5) - 1);
  }

  // ---------- main loop ----------
  function frame(t) {
    const dt = Math.min(0.05, (t - (UI.lastFrame || t)) / 1000);
    UI.lastFrame = t;
    if (UI.screen === 'play' && UI.game) {
      if (UI.countdown > 0) { UI.countdown -= dt; UI.game.updateFx(dt); }
      else UI.game.update(dt, UI.input);
      UI.updatePlay();
    } else if (UI.screen === 'tutorial' && UI.tutFrame) UI.tutFrame(dt);
    requestAnimationFrame(frame);
  }

  UI.init = function () {
    SB.meta.load();
    SB.Cosmetic.fix();
    UI.applyFont();
    const s = SB.meta.data.settings;
    SB.audio.muted = s.muted;
    SB.audio.volume = s.volume;
    SB.Music.volume = s.music === undefined ? 0.45 : s.music;
    SB.FX.init();
    SB.Cosmetic.apply();
    if (SB.Cosmetic.refunded) setTimeout(() => UI.toast(`${SB.uiIco('ticket')} Piece skins were redesigned: ${SB.Cosmetic.refunded} Ticket${SB.Cosmetic.refunded === 1 ? '' : 's'} back for the retired ones`), 900);
    Run.checkUnlocks();
    // an older save may already meet some goals: earn those quietly, with one banner for all of them
    SB.Ach.hold = true;
    SB.Ach.check(null, true);
    SB.Ach.hold = false;
    SB.Logo.onSecret = () => { SB.Ach.bump('titleSecret'); SB.Ach.check(); };
    initTooltip();
    document.addEventListener('keydown', (e) => onKey(e, true));
    document.addEventListener('keyup', (e) => onKey(e, false));
    document.addEventListener('click', (e) => {
      SB.audio.init();
      const el = e.target.closest('[data-act]');
      if (!el || el.disabled) return;
      UI.lastClickEl = el;
      const fn = UI.act[el.getAttribute('data-act')];
      if (fn) { e.preventDefault(); if (!QUIET_ACTS.has(el.getAttribute('data-act'))) SB.audio.play('tap'); fn(el.dataset); }
    });
    // nothing outside a text box can be selected: on iOS quick taps would otherwise highlight the board
    document.addEventListener('selectstart', (e) => { const t = e.target.nodeType === 1 ? e.target : e.target.parentElement; if (!t || !t.closest('input, textarea')) e.preventDefault(); });
    document.addEventListener('input', (e) => {
      const k = e.target.getAttribute && e.target.getAttribute('data-set');
      if (!k) return;
      const st = SB.meta.data.settings;
      if (e.target.type === 'checkbox') st[k] = e.target.checked;
      else { st[k] = parseFloat(e.target.value); e.target.style.setProperty('--p', ((st[k] - +e.target.min) / (+e.target.max - +e.target.min)) * 100 + '%'); }
      const lab = document.getElementById('set-' + k);
      if (lab) lab.textContent = UI.setLabel(k, st[k]);
      if (k === 'doki' && SB.Doki) SB.Doki.set(st.doki);
      SB.Music.volume = st.music;
      SB.audio.muted = st.muted;
      SB.audio.volume = st.volume;
      if (SB.audio.master) SB.audio.master.gain.value = st.volume;
      SB.Music.applyVolume();
      SB.meta.save();
    });
    window.addEventListener('resize', () => {
      if (UI.screen === 'play' && UI.game && UI.playLayout() !== (UI.layout || '')) UI.buildPlay();
      else UI.resize();
      if (UI.tutSize) UI.tutSize();
    });
    // the scroll wheel picks the hold slot during a Stack (one step per notch; trackpads add up small deltas)
    let wheelAcc = 0, wheelT = 0;
    document.addEventListener('wheel', (e) => {
      const g = UI.screen === 'play' ? UI.game : UI.screen === 'tutorial' && UI.tut ? UI.tut.game : null;
      if (!g || UI.modal || g.holdSlots() < 2 || !e.target.closest('#play, .tut-play')) return;
      e.preventDefault();
      if (performance.now() - wheelT > 250) wheelAcc = 0;
      wheelT = performance.now();
      wheelAcc += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
      if (Math.abs(wheelAcc) >= 40) { g.cycleHold(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; }
    }, { passive: false });
    document.addEventListener('visibilitychange', () => { if (document.hidden && UI.screen === 'play' && UI.game && UI.game.status === 'playing') UI.pause(); });
    window.addEventListener('blur', () => { UI.input.left = UI.input.right = UI.input.down = false; if (UI.screen === 'play' && UI.game && UI.game.status === 'playing') UI.pause(); });
    UI.show('title');
    requestAnimationFrame(frame);
  };
})(window.SB);
