// Falling for You: the secret dating game. SB.Dating.open({ run, onClose }) puts it over whatever is on screen
// (the Stack is held while it's open). Four routes, each a week of rehearsals that ends on Clear Day; a true end on
// all four plays the finale, which unlocks the Doki Doki style (doki.js). Progress lives in meta.data.dating.
'use strict';
(function (SB) {
  const Art = SB.DateArt, esc = SB.esc;
  const D = (SB.Dating = { isOpen: false });
  const ROUTES = ['isla', 'tessa', 'otto', 'zed'];
  D.ROUTES = ROUTES;
  const ENDS = { good: 'True End', normal: 'Friends End', bad: 'Lonely End' };
  D.ENDS = ENDS;

  // ---------- script parsing ----------
  function parse(src) {
    const ops = [], labels = {};
    let pending = null;
    for (let raw of src.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      if (line[0] === '-' && line[1] === ' ') {
        const [text, label, a, flag] = line.slice(2).split('|').map((s) => s.trim());
        const opt = { text, label, aff: 0, flag: null };
        for (const x of [a, flag]) { if (!x) continue; if (/^[+-]\d+$/.test(x)) opt.aff = +x; else opt.flag = x; }
        if (!pending) { pending = { t: 'choice', opts: [] }; ops.push(pending); }
        pending.opts.push(opt);
        continue;
      }
      pending = null;
      if (line[0] === '#') { labels[line.slice(1).trim()] = ops.length; continue; }
      if (line[0] === '@') {
        const [cmd, ...a] = line.slice(1).split(/\s+/);
        const rest = line.slice(1 + cmd.length).trim();
        switch (cmd) {
          case 'bg': ops.push({ t: 'bg', id: a[0], tint: a[1] || '' }); break;
          case 'show': ops.push({ t: 'show', who: a[0], mood: a[1] || 'neutral', pos: a[2] || 'c' }); break;
          case 'hide': ops.push({ t: 'hide', who: a[0] }); break;
          case 'title': ops.push({ t: 'title', text: rest }); break;
          case 'aff': ops.push({ t: 'aff', n: +a[0] }); break;
          case 'set': ops.push({ t: 'set', flag: a[0] }); break;
          case 'goto': ops.push({ t: 'goto', label: a[0] }); break;
          case 'if': case 'ifnot': ops.push({ t: cmd, flag: a[0], label: a[1] }); break;
          case 'ifaff': ops.push({ t: 'ifaff', n: +a[0], label: a[1] }); break;
          case 'ending': ops.push({ t: 'ending', kind: a[0] }); break;
          case 'music': ops.push({ t: 'music', id: a[0] }); break;
          case 'route': ops.push({ t: 'route', id: a[0] }); break;
          default: ops.push({ t: cmd });
        }
        continue;
      }
      const m = /^([a-z]*)\s*([a-z]*)\s*:\s?(.*)$/.exec(line);
      if (!m) { ops.push({ t: 'nar', text: line }); continue; }
      const [, who, mood, text] = m;
      if (!who) ops.push({ t: 'nar', text });
      else if (who === 'me') ops.push({ t: 'me', text });
      else ops.push({ t: 'say', who, mood: mood || null, text });
    }
    return { ops, labels };
  }
  const SCRIPTS = {};
  const script = (id) => SCRIPTS[id] || (SCRIPTS[id] = parse(SB.DATE_STORY[id]));
  D.script = script;

  // ---------- save ----------
  const data = () => {
    const m = SB.meta.data;
    if (!m.dating || typeof m.dating !== 'object') m.dating = {};
    const d = m.dating;
    d.endings = d.endings || {};
    if (!d.name) d.name = 'Mono';
    return d;
  };
  const save = () => SB.meta.save();
  D.clearedCount = (m) => { const d = (m || SB.meta.data || {}).dating; return d && d.endings ? ROUTES.filter((r) => d.endings[r] && d.endings[r].good).length : 0; };
  D.styleUnlocked = () => SB.FREE_BUILD || !!data().style || (SB.Ach && SB.Ach.earned && SB.Ach.earned('four_hearts'));

  // ---------- music: two songs of its own, written for the club ----------
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const parseLine = (bars) => bars.map((bar) => {
    let s = 0;
    const out = [];
    for (const tok of bar.trim().split(/\s+/)) { const [a, b] = tok.split('/'); if (a !== 'r') out.push({ s, d: +b, deg: +a }); s += +b; }
    return out;
  });
  D.addSong = function (id, S) {
    if (!SB.Music || !SB.Music.SONGS) return;
    S._mel = parseLine(S.mel); S._alt = parseLine(S.alt);
    SB.Music.SONGS[id] = S;
  };
  // F major, Rhodes and glockenspiel, a flute, brushes: walking to club in the morning
  D.addSong('date', {
    bpm: 88, swing: 0.14, feel: 0.01,
    main: [[53, 57, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 58]],
    boss: [[53, 57, 60, 64], [50, 53, 57, 60], [46, 50, 53, 57], [48, 52, 55, 58]],
    key: 77, mode: MAJOR,
    mel: ['4/4 2/2 4/2 5/4 4/4', '2/6 1/2 0/8', '-1/2 0/2 2/4 4/4 2/4', '1/12 r/4', '4/4 2/2 4/2 7/4 6/4', '5/6 4/2 2/8', '3/2 2/2 1/4 2/4 -1/4', '0/12 r/4'],
    alt: ['7/8 6/8', '5/16', '6/8 5/4 4/4', '4/12 r/4', '2/8 4/8', '5/8 7/8', '6/6 5/2 4/8', '4/12 r/4'], altOct: -12,
    lead: { voice: 'flute', vol: 0.1, glide: 0.4 },
    keys: { voice: 'epiano', hits: '8.....6...7.....', len: 6 },
    bass: { voice: 'upright', pat: 'r......5..r...a.', vel: '9......6..7...6.', len: 3 },
    arp: { voice: 'bell', vol: 0.55, every: 4, pat: [3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2], oct: 24 },
    drums: { kick: '9.......7.......', kickHot: '9.......7.....5.', snare: '....7.......7...', hat: '4242424242424242', soft: 1, fill: 'brush' },
  });
  // C major, slow strings and a plucked guitar: Clear Day evening
  D.addSong('dusk', {
    bpm: 72, swing: 0.05, feel: 0.012,
    main: [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [43, 55, 59, 62]],
    boss: [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [43, 55, 59, 62]],
    key: 72, mode: MAJOR,
    mel: ['2/8 4/4 5/4', '4/12 r/4', '0/4 2/4 4/4 7/4', '6/16', '5/8 4/4 2/4', '4/12 r/4', '2/4 1/4 0/4 -1/4', '1/16'],
    alt: ['0/16', '1/8 0/8', '2/16', '4/8 r/8', '5/8 7/8', '6/16', '4/8 2/8', '4/16'],
    lead: { voice: 'flute', vol: 0.11, glide: 0.5 },
    keys: { voice: 'strings', hits: '9...............', len: 16 },
    bass: { voice: 'finger', pat: 'r.......5.......', vel: '8.......6.......', len: 6 },
    arp: { voice: 'pluck', vol: 0.8, every: 2, pat: [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 3, 1, 2], oct: 12, bright: 0.35, ring: 4 },
    drums: { kick: '9...............', kickHot: '9.......6.......', snare: '................', hat: '................', soft: 1, fill: 'brush' },
  });

  // ---------- the screen ----------
  let root, st, typing = null, autoT = null, skipT = null, prevMusic = null, heldGame = false, onClose = null;
  const $ = (sel) => root.querySelector(sel);
  const name = () => esc(data().name);
  const fill = (t) => esc(t).replace(/\{me\}/g, name()).replace(/&quot;/g, '"');
  const ico = (k) => Art.ICONS[k];
  const POS = { l: 22, c: 50, r: 78 };

  function build() {
    root = document.createElement('div');
    root.id = 'dating';
    root.className = 'dg';
    root.innerHTML = `
      <div class="dg-bg"><div class="dg-bgl a"></div><div class="dg-bgl b"></div><div class="dg-tint"></div></div>
      <div class="dg-stage"></div>
      <div class="dg-flash"></div>
      <div class="dg-tools">
        <button class="dg-tool" data-dg="log" aria-label="Log">${ico('log')}<span>Log</span></button>
        <button class="dg-tool" data-dg="auto" aria-label="Auto">${ico('auto')}<span>Auto</span></button>
        <button class="dg-tool" data-dg="skip" aria-label="Skip">${ico('skip')}<span>Skip</span></button>
        <button class="dg-tool" data-dg="menu" aria-label="Menu">${ico('home')}<span>Menu</span></button>
      </div>
      <div class="dg-box" data-dg="advance">
        <div class="dg-name"></div>
        <div class="dg-text"></div>
        <div class="dg-next">${ico('caret')}</div>
      </div>
      <div class="dg-choices"></div>
      <div class="dg-card"></div>
      <div class="dg-log"></div>
      <div class="dg-hub"></div>`;
    document.getElementById('app').appendChild(root);
    root.addEventListener('click', onClick);
    for (const ev of ['pointerdown', 'pointerup', 'pointermove', 'touchstart', 'touchend', 'touchmove', 'mousedown', 'wheel', 'contextmenu']) root.addEventListener(ev, (e) => e.stopPropagation());
  }

  // ---------- opening and closing ----------
  D.open = function (opts) {
    if (D.isOpen) return;
    const o = opts || {};
    onClose = o.onClose || null;
    data();
    if (SB.audio && SB.audio.init) SB.audio.init();
    const UI = SB.UI;
    heldGame = false;
    if (UI && UI.game && UI.game.status === 'playing') { UI.game.status = 'paused'; heldGame = true; }
    if (UI && UI.input) { UI.input.left = UI.input.right = UI.input.down = false; }
    if (SB.Music) { prevMusic = { song: SB.Music.pendingSong || SB.Music.songId, area: SB.Music.area }; SB.Music.setArea('menu'); SB.Music.setSong('date', true); }
    build();
    D.isOpen = true;
    document.body.classList.add('dating-open');
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', swallow, true);
    SB.audio.play && SB.audio.play('open');
    showHub();
    requestAnimationFrame(() => root.classList.add('in'));
  };
  D.close = function () {
    if (!D.isOpen) return;
    stopAuto(); stopSkip(); stopType();
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', swallow, true);
    D.isOpen = false;
    document.body.classList.remove('dating-open');
    root.remove(); root = null; st = null;
    if (SB.Music && prevMusic) {
      const song = SB.Doki && SB.Doki.on() ? 'doki' : SB.Cosmetic ? SB.Cosmetic.equipped('song') : prevMusic.song;
      SB.Music.setSong(song, true); SB.Music.setArea(prevMusic.area);
    }
    const UI = SB.UI;
    if (heldGame && UI && UI.game && UI.game.status === 'paused' && !UI.modal) { UI.game.status = 'playing'; UI.countdown = 0.6; }
    heldGame = false;
    SB.audio.play && SB.audio.play('close');
    if (SB.Ach && SB.Ach.check) SB.Ach.check();
    const cb = onClose; onClose = null;
    if (cb) cb();
  };

  // ---------- the hub: start, continue, pick a route, name, style ----------
  function showHub() {
    stopAuto(); stopSkip(); stopType();
    closeCard();
    const d = data();
    st = null;
    root.classList.add('at-hub');
    setBg('school', '');
    $('.dg-stage').innerHTML = '';
    const n = D.clearedCount();
    const routeCard = (r) => {
      const e = d.endings[r] || {}, c = Art.CAST[r];
      const pips = ['good', 'normal', 'bad'].map((k) => `<i class="dg-pip ${e[k] ? 'on' : ''}" title="${ENDS[k]}">${ico(k === 'good' ? 'heart' : k === 'normal' ? 'star' : 'heartOff')}</i>`).join('');
      return `<button class="dg-route ${e.good ? 'won' : ''}" data-dg="route" data-id="${r}" style="--cc:${c.color};--cp:${c.plate}">
        <span class="dg-route-art">${Art.char(r, e.good ? 'love' : 'neutral', { fit: true })}</span>
        <span class="dg-route-name">${c.name}</span><span class="dg-route-pips">${pips}</span></button>`;
    };
    const canCont = d.resume && SB.DATE_STORY[d.resume.script];
    $('.dg-hub').innerHTML = `
      <div class="dg-hub-in">
        <h1 class="dg-logo"><span>Falling</span><span class="for">for</span><span>You</span><i class="dg-logo-heart">${ico('heart')}</i></h1>
        <div class="dg-hearts">${ROUTES.map((r) => `<i class="${d.endings[r] && d.endings[r].good ? 'on' : ''}" style="--cc:${Art.CAST[r].color}">${ico(d.endings[r] && d.endings[r].good ? 'heart' : 'heartOff')}</i>`).join('')}</div>
        <nav class="dg-menu">
          ${canCont ? `<button class="dg-btn main" data-dg="continue">Continue</button>` : ''}
          <button class="dg-btn ${canCont ? '' : 'main'}" data-dg="new">${d.seenPrologue ? 'Start over' : 'Start'}</button>
          ${n >= 4 ? `<button class="dg-btn" data-dg="finale">Epilogue</button>` : ''}
          ${D.styleUnlocked() && SB.Doki ? `<button class="dg-btn style ${SB.Doki.on() ? 'on' : ''}" data-dg="style">${ico('style')} Doki Doki style: ${SB.Doki.on() ? 'on' : 'off'}</button>` : ''}
          <button class="dg-btn" data-dg="leave">Leave</button>
        </nav>
        ${d.seenPrologue || SB.FREE_BUILD ? `<div class="dg-routes">${ROUTES.map(routeCard).join('')}</div>` : ''}
      </div>`;
    $('.dg-hub').classList.add('show');
    for (const k of ['.dg-box', '.dg-tools', '.dg-choices', '.dg-card', '.dg-log']) $(k).classList.remove('show');
    focusFirst($('.dg-hub'));
  }
  const hideHub = () => { root.classList.remove('at-hub'); $('.dg-hub').classList.remove('show'); };

  // ---------- running a script ----------
  function begin(id, label, keep) {
    hideHub();
    closeCard();
    const s = keep || { script: id, pc: script(id).labels[label || 'start'] || 0, aff: 0, flags: {}, bg: 'black', tint: '', cast: {}, music: 'date', log: [] };
    st = s;
    st.log = st.log || [];
    if (keep) { setBg(st.bg, st.tint, true); renderCast(); if (SB.Music) SB.Music.setSong(st.music || 'date', true); }
    else { setBg('black', '', true); $('.dg-stage').innerHTML = ''; }
    $('.dg-tools').classList.add('show');
    run();
  }
  // run ops until one waits for the player
  function run() {
    const sc = script(st.script);
    for (let guard = 0; guard < 400; guard++) {
      const op = sc.ops[st.pc];
      if (!op) { showHub(); return; }
      st.pc++;
      switch (op.t) {
        case 'bg': setBg(op.id, op.tint); st.bg = op.id; st.tint = op.tint; break;
        case 'show': st.cast[op.who] = { mood: op.mood, pos: op.pos }; renderCast(op.who); break;
        case 'hide': delete st.cast[op.who]; renderCast(); break;
        case 'clear': st.cast = {}; renderCast(); break;
        case 'music': st.music = op.id; if (SB.Music) SB.Music.setSong(op.id); break;
        case 'route': st.route = op.id; break;
        case 'aff': bumpAff(op.n); break;
        case 'set': st.flags[op.flag] = true; break;
        case 'goto': st.pc = sc.labels[op.label]; break;
        case 'if': if (st.flags[op.flag]) st.pc = sc.labels[op.label]; break;
        case 'ifnot': if (!st.flags[op.flag]) st.pc = sc.labels[op.label]; break;
        case 'ifaff': if ((st.aff || 0) >= op.n) st.pc = sc.labels[op.label]; break;
        case 'shake': root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); SB.audio.knock && SB.audio.knock(120, 60, 0.18, 0.08); break;
        case 'flash': flash(); break;
        case 'glitch': glitch(); break;
        case 'say': case 'nar': case 'me': checkpoint(); say(op); return;
        case 'choice': checkpoint(); choose(op.opts); return;
        case 'title': titleCard(op.text); return;
        case 'name': nameCard(); return;
        case 'pick': checkpoint(); pickRoute(); return;
        case 'unlock': unlockCard(); return;
        case 'ending': ending(op.kind); return;
      }
    }
  }
  // remember where we are, so Continue lands on this line
  function checkpoint() {
    const d = data();
    d.resume = { script: st.script, pc: st.pc - 1, aff: st.aff, flags: Object.assign({}, st.flags), bg: st.bg, tint: st.tint, cast: JSON.parse(JSON.stringify(st.cast)), music: st.music, route: st.route };
    save();
  }
  function bumpAff(n) {
    st.aff = (st.aff || 0) + n;
    if (!n || !root) return;
    const h = document.createElement('div');
    h.className = 'dg-affpop ' + (n > 0 ? 'up' : 'down');
    h.innerHTML = ico(n > 0 ? 'heart' : 'heartOff');
    if (st.route) h.style.setProperty('--cc', Art.CAST[st.route].color);
    root.appendChild(h);
    setTimeout(() => h.remove(), 1400);
    if (n > 0) { SB.audio.ping && (SB.audio.ping(1318, 0.18, 0.03), SB.audio.ping(1760, 0.3, 0.025, 0.08)); }
    else SB.audio.ping && SB.audio.ping(392, 0.25, 0.03);
  }

  // ---------- scene and cast ----------
  let bgFlip = false;
  function setBg(id, tint, instant) {
    const a = $('.dg-bgl.a'), b = $('.dg-bgl.b');
    const [cur, nxt] = bgFlip ? [b, a] : [a, b];
    if (cur.dataset.id === id && cur.dataset.tint === (tint || '')) return;
    nxt.innerHTML = Art.bg(id, tint);
    nxt.dataset.id = id; nxt.dataset.tint = tint || '';
    nxt.className = 'dg-bgl ' + (bgFlip ? 'a' : 'b') + ' on' + (tint ? ' t-' + tint : '') + (nxt.querySelector('svg.timed') ? ' timed' : '') + (instant ? ' now' : '');
    cur.classList.remove('on');
    bgFlip = !bgFlip;
  }
  function renderCast(changed) {
    const stage = $('.dg-stage');
    const have = new Set(Object.keys(st.cast));
    // on a narrow screen two or three pieces share the width evenly, kept in their left-to-right order
    const order = [...have].sort((x, y) => POS[st.cast[x].pos] - POS[st.cast[y].pos]);
    const spread = root.clientWidth < 700 && order.length > 1 ? (order.length === 2 ? [28, 72] : [18, 50, 82]) : null;
    for (const el of [...stage.children]) if (!have.has(el.dataset.who)) { el.classList.add('out'); setTimeout(() => el.remove(), 320); delete el.dataset.who; }
    for (const who of have) {
      const c = st.cast[who];
      let el = stage.querySelector(`.dg-slot[data-who="${who}"]`);
      if (!el) {
        el = document.createElement('div');
        el.className = 'dg-slot enter';
        el.dataset.who = who;
        el.innerHTML = '<div class="dg-pose"></div>';
        stage.appendChild(el);
        setTimeout(() => el.classList.remove('enter'), 30);
      }
      el.style.setProperty('--x', (spread ? spread[order.indexOf(who)] : POS[c.pos]) + '%');
      el.dataset.pos = c.pos;
      if (el.dataset.mood !== c.mood || who === changed) setMood(el, who, c.mood);
    }
    stage.classList.toggle('crowd', have.size > 1);
  }
  function setMood(el, who, mood) {
    el.dataset.mood = mood;
    const p = el.querySelector('.dg-pose');
    p.innerHTML = Art.char(who, mood);
    p.className = 'dg-pose';
    const pose = Art.pose(mood);
    if (pose) { void p.offsetWidth; p.classList.add('p-' + pose); }
  }
  function speaking(who) {
    for (const el of $('.dg-stage').children) el.classList.toggle('talk', el.dataset.who === who);
    $('.dg-stage').classList.toggle('someone', !!who && !!st.cast[who]);
  }
  function flash() { const f = $('.dg-flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
  function glitch() {
    root.classList.add('glitch');
    if (SB.audio.hiss) { SB.audio.hiss(0.5, 0.08, 0, 6000, 400, 0.6); SB.audio.tone(55, 0.5, 'sawtooth', 0.03, 40); }
    setTimeout(() => root && root.classList.remove('glitch'), 1100);
  }

  // ---------- lines ----------
  function say(op) {
    const box = $('.dg-box');
    box.classList.add('show');
    $('.dg-choices').classList.remove('show');
    let who = '', color = '', plate = '';
    if (op.t === 'say') {
      const c = Art.CAST[op.who];
      if (op.mood && st.cast[op.who]) { st.cast[op.who].mood = op.mood; const el = $(`.dg-slot[data-who="${op.who}"]`); if (el) setMood(el, op.who, op.mood); }
      who = c.name; color = c.color; plate = c.plate;
      speaking(op.who);
    } else if (op.t === 'me') { who = data().name; color = Art.CAST.mono.color; plate = Art.CAST.mono.plate; speaking(null); }
    else speaking(null);
    box.classList.toggle('nar', op.t === 'nar');
    const nm = $('.dg-name');
    nm.textContent = who;
    nm.style.setProperty('--cc', color); nm.style.setProperty('--cp', plate);
    nm.classList.toggle('show', !!who);
    const text = fill(op.text);
    st.log.push({ who, color, text });
    if (st.log.length > 200) st.log.shift();
    type(text, op.t === 'say' ? op.who : op.t);
  }
  // typewriter: about 45 letters a second, a soft blip every few letters pitched to whoever is talking
  const VOICE = { isla: 520, tessa: 880, otto: 330, zed: 260, elle: 700, jay: 440, sasha: 780, me: 990, nar: 0 };
  function type(html, who) {
    stopType();
    const el = $('.dg-text'), nx = $('.dg-next');
    nx.classList.remove('show');
    // split into tags and characters so escaped entities stay whole
    const parts = html.match(/&[a-z#0-9]+;|./g) || [];
    let i = 0;
    const speed = skipT ? 0 : 22;
    const pitch = VOICE[who] || 0;
    const done = () => { el.innerHTML = html; nx.classList.add('show'); typing = null; if (autoOn) scheduleAuto(html.length); };
    if (!speed) { done(); return; }
    el.innerHTML = '';
    typing = { finish: () => { clearInterval(typing.timer); done(); } };
    typing.timer = setInterval(() => {
      i++;
      el.innerHTML = parts.slice(0, i).join('') + `<span class="dg-ghost">${parts.slice(i).join('')}</span>`;
      if (pitch && i % 3 === 0 && /\w/.test(parts[i - 1]) && SB.audio.ping) SB.audio.ping(SB.audio.vary(pitch, 0.04), 0.035, 0.006);
      if (i >= parts.length) typing.finish();
    }, speed);
  }
  function stopType() { if (typing) { clearInterval(typing.timer); typing = null; } }
  function advance() {
    if (!st) return;
    if (typing) { typing.finish(); return; }
    if ($('.dg-choices').classList.contains('show') || $('.dg-card').classList.contains('show')) return;
    stopAutoTimer();
    run();
  }

  // ---------- auto and skip ----------
  let autoOn = false, autoTimer = null;
  function scheduleAuto(len) { stopAutoTimer(); autoTimer = setTimeout(() => { if (autoOn && !typing) advance(); }, 1100 + len * 28); }
  function stopAutoTimer() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; } }
  function toggleAuto() { autoOn = !autoOn; if (autoOn) stopSkip(); paintTools(); if (autoOn && !typing && $('.dg-box').classList.contains('show')) scheduleAuto(0); else stopAutoTimer(); }
  function stopAuto() { autoOn = false; stopAutoTimer(); if (root) paintTools(); }
  function toggleSkip() { if (skipT) { stopSkip(); return; } stopAuto(); skipT = setInterval(() => { if (!st || $('.dg-choices').classList.contains('show') || $('.dg-card').classList.contains('show')) { stopSkip(); return; } advance(); }, 70); paintTools(); }
  function stopSkip() { if (skipT) { clearInterval(skipT); skipT = null; } if (root) paintTools(); }
  function paintTools() {
    const a = root.querySelector('[data-dg="auto"]'), s = root.querySelector('[data-dg="skip"]');
    if (a) { a.classList.toggle('on', autoOn); a.firstElementChild.outerHTML = ico(autoOn ? 'autoOn' : 'auto'); }
    if (s) s.classList.toggle('on', !!skipT);
  }

  // ---------- choices ----------
  function choose(opts) {
    stopSkip(); stopAutoTimer();
    speaking(null);
    const c = $('.dg-choices');
    c.innerHTML = opts.map((o, i) => `<button class="dg-choice" data-dg="pick" data-i="${i}"><span class="dg-choice-n">${i + 1}</span><span>${fill(o.text)}</span></button>`).join('');
    c.classList.add('show');
    c._opts = opts;
    focusFirst(c);
  }
  function picked(i) {
    const o = $('.dg-choices')._opts[i];
    if (!o) return;
    SB.audio.play && SB.audio.play('click');
    $('.dg-choices').classList.remove('show');
    st.log.push({ who: data().name, color: Art.CAST.mono.color, text: fill(o.text), choice: true });
    if (o.aff) bumpAff(o.aff);
    if (o.flag) st.flags[o.flag] = true;
    if (st.pickRoute) { const r = o.label; st.pickRoute = false; begin(r); return; }
    st.pc = script(st.script).labels[o.label];
    run();
  }
  function pickRoute() {
    const d = data();
    d.seenPrologue = true; save();
    st.pickRoute = true;
    choose(ROUTES.map((r) => ({ text: { isla: 'Isla, the quiet writer in the corner', tessa: 'Tessa, the spinning star', otto: 'Otto, the baker with the scones', zed: 'Zed, the one who just left' }[r], label: r })));
  }

  // ---------- cards ----------
  function card(html, cls) {
    const c = $('.dg-card');
    c.className = 'dg-card show ' + (cls || '');
    c.style.removeProperty('--cc');
    c.innerHTML = `<div class="dg-card-in">${html}</div>`;
    $('.dg-box').classList.remove('show');
    focusFirst(c);
    return c;
  }
  const closeCard = () => { const c = $('.dg-card'); c.classList.remove('show'); c.innerHTML = ''; };
  function titleCard(text) {
    speaking(null);
    const c = card(`<div class="dg-day">${esc(text)}</div>`, 'title');
    c._next = () => { closeCard(); run(); };
    setTimeout(() => { if (root && c._next && c.classList.contains('title')) c._next(); }, skipT ? 250 : 1500);
  }
  function nameCard() {
    const c = card(`<label class="dg-ask" for="dgName">Your name</label>
      <input id="dgName" class="dg-input" maxlength="12" autocomplete="off" spellcheck="false" value="${esc(data().name)}">
      <button class="dg-btn main" data-dg="nameok">OK</button>`, 'name');
    const inp = c.querySelector('input');
    setTimeout(() => { inp.focus(); inp.select(); }, 60);
    c._next = () => {
      const v = inp.value.replace(/[^\p{L}\p{N} '\-]/gu, '').trim().slice(0, 12);
      data().name = v || 'Mono'; save();
      closeCard(); run();
    };
  }
  function ending(kind) {
    stopAuto(); stopSkip(); stopType();
    const d = data();
    d.resume = null;
    if (kind === 'finale') { d.finale = true; save(); showHub(); return; }
    const r = st.route, c = Art.CAST[r];
    const before = D.clearedCount();
    d.endings[r] = d.endings[r] || {};
    const fresh = !d.endings[r][kind];
    d.endings[r][kind] = (d.endings[r][kind] || 0) + 1;
    save();
    const after = D.clearedCount();
    const finaleNow = kind === 'good' && before < 4 && after >= 4 && !d.finale;
    if (kind === 'good') { SB.audio.play && SB.audio.play('unlock'); } else if (kind === 'bad') SB.audio.ping && SB.audio.ping(262, 0.6, 0.03);
    if (after >= 4 && SB.Ach && SB.Ach.check) SB.Ach.check();
    const hearts = ROUTES.map((x) => `<i class="${d.endings[x] && d.endings[x].good ? 'on' : ''}" style="--cc:${Art.CAST[x].color}">${ico(d.endings[x] && d.endings[x].good ? 'heart' : 'heartOff')}</i>`).join('');
    const cc = card(`<div class="dg-end-art ${kind}">${Art.char(r, kind === 'good' ? 'love' : kind === 'normal' ? 'happy' : 'gloom', { fit: true })}${kind === 'good' ? `<span class="dg-end-mono">${Art.char('mono', 'love', { fit: true })}</span>` : ''}</div>
      <div class="dg-end-who" style="--cc:${c.color}">${c.name}</div>
      <div class="dg-end-kind ${kind}">${ENDS[kind]}${fresh ? '<span class="dg-new">New</span>' : ''}</div>
      <div class="dg-hearts">${hearts}</div>
      <nav class="dg-menu row">
        ${finaleNow ? `<button class="dg-btn main" data-dg="finale">Continue</button>` : `<button class="dg-btn main" data-dg="hub">Routes</button>`}
        ${kind !== 'good' ? `<button class="dg-btn" data-dg="route" data-id="${r}">Try again</button>` : ''}
      </nav>`, 'ending ' + kind);
    cc.style.setProperty('--cc', c.color);
    st = null;
  }
  function unlockCard() {
    const d = data();
    d.style = true; save();
    if (SB.Ach && SB.Ach.bump) { SB.Ach.bump('fourHearts'); }
    SB.audio.play && SB.audio.play('unlock');
    const c = card(`<div class="dg-unlock-art">${SB.Doki ? SB.Doki.art() : ''}</div>
      <div class="dg-end-who">Doki Doki</div><div class="dg-end-kind good">Style unlocked</div>
      <nav class="dg-menu row"><button class="dg-btn main" data-dg="styleon">Wear it</button><button class="dg-btn" data-dg="cardnext">Later</button></nav>`, 'unlock');
    c._next = () => { closeCard(); run(); };
  }

  // ---------- log ----------
  function showLog() {
    if (!st) return;
    const l = $('.dg-log');
    l.innerHTML = `<div class="dg-log-in"><div class="dg-log-head"><b>Log</b><button class="dg-x" data-dg="logclose" aria-label="Close">${ico('close')}</button></div>
      <div class="dg-log-list">${st.log.slice(-80).map((e) => `<p class="${e.choice ? 'ch' : ''}">${e.who ? `<b style="--cc:${e.color}">${esc(e.who)}</b>` : ''}<span>${e.text}</span></p>`).join('')}</div></div>`;
    l.classList.add('show');
    const list = l.querySelector('.dg-log-list');
    list.scrollTop = list.scrollHeight;
    stopAuto(); stopSkip();
  }
  const hideLog = () => $('.dg-log').classList.remove('show');

  // ---------- input ----------
  function focusFirst(el) { if (SB.UI && SB.UI.touch) return; const b = el.querySelector('button'); if (b) setTimeout(() => b.focus({ preventScroll: true }), 30); }
  const ACT = {
    advance: () => advance(),
    log: () => showLog(), logclose: () => hideLog(),
    auto: () => toggleAuto(), skip: () => toggleSkip(),
    menu: () => { if (st) checkpoint(); showHub(); },
    continue: () => { const r = data().resume; begin(r.script, null, { script: r.script, pc: r.pc, aff: r.aff, flags: r.flags, bg: r.bg, tint: r.tint, cast: r.cast, music: r.music, route: r.route, log: [] }); },
    new: () => { data().resume = null; begin('prologue'); },
    route: (b) => { closeCard(); data().resume = null; begin(b.dataset.id); },
    finale: () => { closeCard(); begin('finale'); },
    hub: () => { closeCard(); showHub(); },
    leave: () => D.close(),
    pick: (b) => picked(+b.dataset.i),
    nameok: () => { const c = $('.dg-card'); if (c._next) c._next(); },
    cardnext: () => { const c = $('.dg-card'); if (c._next) c._next(); },
    styleon: () => { if (SB.Doki) SB.Doki.set(true); const c = $('.dg-card'); if (c._next) c._next(); },
    style: () => { if (SB.Doki) SB.Doki.set(!SB.Doki.on()); showHub(); },
  };
  function onClick(e) {
    e.stopPropagation();
    if (e.target.closest('input')) return;
    const b = e.target.closest('[data-dg]');
    const card = e.target.closest('.dg-card.title');
    if (card && card._next) { const n = card._next; card._next = null; n(); return; }
    if (b && ACT[b.dataset.dg]) { if (b.tagName === 'BUTTON' && b.dataset.dg !== 'pick') SB.audio.play && SB.audio.play('tap'); ACT[b.dataset.dg](b); return; }
    // a tap anywhere on the scene moves the story on
    if (st && !e.target.closest('.dg-hub, .dg-log, .dg-card, .dg-choices, .dg-tools')) advance();
  }
  function swallow(e) { if (!D.isOpen) return; if (!(e.target && e.target.tagName === 'INPUT')) e.preventDefault(); e.stopPropagation(); }
  function onKey(e) {
    if (!D.isOpen) return;
    e.stopPropagation();
    const k = e.key, inInput = e.target && e.target.tagName === 'INPUT';
    if (inInput) { if (k === 'Enter') { e.preventDefault(); ACT.nameok(); } return; }
    e.preventDefault();
    if (e.repeat && k !== 'Control') return;
    const log = $('.dg-log').classList.contains('show');
    if (log) { if (k === 'Escape' || k === 'l' || k === 'L' || k === 'Enter') hideLog(); return; }
    const choices = $('.dg-choices').classList.contains('show') ? $('.dg-choices') : null;
    const cardEl = $('.dg-card').classList.contains('show') ? $('.dg-card') : null;
    const hub = $('.dg-hub').classList.contains('show') ? $('.dg-hub') : null;
    const menuEl = choices || cardEl || hub;
    if (/^[1-4]$/.test(k) && choices) { picked(+k - 1); return; }
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      if (!menuEl) return;
      const bs = [...menuEl.querySelectorAll('button')];
      if (!bs.length) return;
      const i = bs.indexOf(document.activeElement), d = k === 'ArrowUp' || k === 'ArrowLeft' ? -1 : 1;
      bs[(i + d + bs.length) % bs.length].focus();
      return;
    }
    if (k === 'Enter' || k === ' ') {
      if (cardEl && cardEl.classList.contains('title') && cardEl._next) { const n = cardEl._next; cardEl._next = null; n(); return; }
      if (menuEl && document.activeElement && menuEl.contains(document.activeElement)) { document.activeElement.click(); return; }
      if (!menuEl) advance();
      return;
    }
    if (k === 'Escape') { if (hub) D.close(); else ACT.menu(); return; }
    if (hub || cardEl) return;
    if (k === 'l' || k === 'L') showLog();
    else if (k === 'a' || k === 'A') toggleAuto();
    else if (k === 's' || k === 'S' || k === 'Tab') toggleSkip();
  }
})(window.SB);
