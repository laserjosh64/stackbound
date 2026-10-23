// Stackbound sound packs: themed sounds for pieces, drops, clears and menu clicks, bought or earned at the Prize
// Counter (Sounds tab). A pack only replaces the sounds it lists; everything else keeps the Classic sound.
// SB.audio.play(name, arg) stays the one entry point: it asks SB.SFX for the equipped pack first.
'use strict';
(function (SB) {
  const S = (SB.SFX = { packs: {}, override: null });
  SB.COSMETICS.sound = { label: 'Sounds', icon: 'sound', items: {} };
  SB.COSMETIC_CATS.push('sound');

  // register(id, { name, price, desc, art, ach, play: { lock, harddrop, move, rotate, hold, softland, clear, tetris, ... } })
  // play functions get (audio, arg); art is an icon name; ach is the achievement that opens it instead of Tickets
  S.register = function (id, def) {
    S.packs[id] = def;
    SB.COSMETICS.sound.items[id] = { name: def.name, price: def.price || 0, desc: def.desc || '', art: def.art || 'speaker', ach: def.ach, secret: def.secret };
  };
  // a pack's picture: an icon name, or a function returning SVG markup
  S.art = (id) => { const it = SB.COSMETICS.sound.items[id]; return !it ? '' : typeof it.art === 'function' ? it.art() : SB.ico(it.art); };
  // the pack playing right now: a Listen preview, else the equipped one
  S.current = () => S.override || (SB.Cosmetic ? S.packs[SB.Cosmetic.equipped('sound')] : null);

  // Listen: a short run through the pack (moves, turns, hold, a slam, a double, a Tetris, two clicks)
  const DEMO = [['move', 0, 0], ['move', 0, 0.16], ['rotate', 0, 0.34], ['rotate', 0, 0.5], ['hold', 0, 0.72], ['harddrop', 0.8, 1.02], ['lock', { hard: true }, 1.02],
    ['clear', 2, 1.5], ['move', 0, 2.25], ['rotate', 0, 2.42], ['harddrop', 1, 2.66], ['lock', { hard: true }, 2.66], ['tetris', 0, 2.95], ['click', 0, 4.2], ['buy', 0, 4.45]];
  S.demoLength = 5.2;
  let timers = [];
  S.stopDemo = () => { timers.forEach(clearTimeout); timers = []; };
  S.demo = function (id) {
    S.stopDemo();
    const A = SB.audio, pk = S.packs[id];
    if (!pk) return;
    A.init();
    for (const [name, arg, t] of DEMO) {
      timers.push(setTimeout(() => { S.override = pk; try { A.play(name, arg); } finally { S.override = null; } }, t * 1000));
    }
  };

  // ---------- building blocks ----------
  const v = (A, x, amt) => A.vary(x, amt);
  const wood = (A, f, vol, d) => { A.ping(v(A, f), 0.07, vol, d, [[2.57, 0.45], [4.1, 0.18]]); A.hiss(0.012, vol * 1.4, d, f * 3, f * 3, 3); };
  const bell = (A, f, dur, vol, d) => A.ping(f, dur, vol, d, [[2.0, 0.55], [3.0, 0.3], [4.16, 0.22], [5.43, 0.1]]);
  const chime = (A, f, dur, vol, d) => A.ping(f, dur, vol, d, [[2.76, 0.4], [5.4, 0.18]]);
  const kick = (A, vol, d) => A.knock(150, 45, 0.28, vol, d);
  const snare = (A, vol, d) => { A.hiss(0.15, vol, d, 2200, 1700, 0.7); A.tone(185, 0.09, 'triangle', vol * 0.5, 160, d); };
  const hat = (A, vol, d, open) => A.hiss(open ? 0.22 : 0.035, vol, d, 9000, 8500, 2.5);
  const tom = (A, f, vol, d) => A.knock(f, f * 0.62, 0.24, vol, d);
  const crash = (A, vol, d) => A.hiss(1.1, vol, d, 6500, 3800, 0.6);
  const key = (A, vol, d) => { A.hiss(0.018, vol, d, v(A, 3200, 0.1), 2400, 1.2); A.knock(v(A, 900, 0.08), 300, 0.03, vol * 0.45, d); };
  const tick = (A, vol, d) => { A.hiss(0.01, vol, d, 6500, 6500, 5); A.ping(3200, 0.02, vol * 0.3, d); };
  const tock = (A, vol, d) => { A.hiss(0.014, vol, d, 2600, 2600, 5); A.knock(700, 500, 0.03, vol * 0.5, d); };
  const thump = (A, f, vol, d) => { A.knock(f, f * 0.6, 0.15, vol, d); A.hiss(0.06, vol * 0.45, d, 320, 200, 0.8); };
  const coin = (A, f, vol, d) => A.ping(v(A, f, 0.02), 0.14, vol, d, [[1.5, 0.4], [2.7, 0.15]]);
  const pew = (A, f, to, dur, vol, d) => { A.tone(f, dur, 'sawtooth', vol, to, d); A.tone(f * 1.01, dur, 'square', vol * 0.4, to * 1.02, d); };
  const squeak = (A, f, vol, d) => { A.tone(v(A, f), 0.06, 'triangle', vol, f * 1.6, d); A.tone(f * 1.6, 0.05, 'triangle', vol * 0.8, f * 1.1, (d || 0) + 0.06); };
  const boing = (A, f, vol, d) => { A.tone(f, 0.07, 'triangle', vol, f * 3.4, d); for (let i = 0; i < 4; i++) A.tone(f * (3.4 - i * 0.5), 0.07, 'sine', vol * (1 - i * 0.2), f * (2.9 - i * 0.5), (d || 0) + 0.07 + i * 0.07); };
  const PENTA = [523, 587, 659, 784, 880, 1046, 1175, 1318];

  S.register('classic', { name: 'Classic', price: 0, art: 'speaker', desc: 'Soft mallets, swishes and a deep slam', play: {} });

  S.register('woodshop', {
    name: 'Woodshop', price: 2, art: 'hand-saw', desc: 'Wood blocks, a ratchet, a hammer and a saw',
    play: {
      move: (A) => wood(A, 1250, 0.03),
      rotate: (A) => { for (let i = 0; i < 3; i++) A.hiss(0.012, 0.08, i * 0.022, 2800, 2800, 4); wood(A, 1600, 0.02, 0.07); },
      hold: (A) => { A.hiss(0.16, 0.06, 0, 700, 300, 1.4); wood(A, 700, 0.03, 0.14); },
      lock: (A, o) => { const k = o && o.hard ? 0.55 : 1; A.knock(v(A, 190), 95, 0.11, 0.12 * k); wood(A, 430, 0.04 * k); },
      harddrop: (A, p) => { const q = p || 0.5; A.knock(240, 60, 0.13, 0.16 + q * 0.06); A.noise(0.04, 0.06 + q * 0.04); A.ping(1900, 0.05, 0.02, 0, [[2.3, 0.4]]); },
      softland: (A) => A.knock(260, 160, 0.06, 0.06),
      clear: (A, n) => { const k = Math.min(4, n || 1); for (let i = 0; i < k; i++) { A.hiss(0.09, 0.08, i * 0.12, 1400, 2600, 2); A.hiss(0.09, 0.07, i * 0.12 + 0.06, 2600, 1400, 2); } for (let i = 0; i <= k; i++) wood(A, 600 + i * 150, 0.035, 0.05 + i * 0.06); },
      tetris: (A) => { [0, 0.14, 0.28, 0.42].forEach((d, i) => { A.knock(260 - i * 20, 60, 0.13, 0.15, d); A.noise(0.03, 0.05, d); }); for (let i = 0; i < 4; i++) A.hiss(0.08, 0.09, 0.6 + i * 0.1, i % 2 ? 2600 : 1400, i % 2 ? 1400 : 2600, 2); wood(A, 1400, 0.05, 1.05); wood(A, 1870, 0.05, 1.15); },
      click: (A) => wood(A, 1500, 0.026),
      tap: (A) => wood(A, 1900, 0.014),
      hover: (A) => A.hiss(0.01, 0.025, 0, 3500, 3500, 4),
      tab: (A) => { wood(A, 1000, 0.025); wood(A, 1330, 0.025, 0.05); },
      open: (A) => A.hiss(0.14, 0.05, 0, 500, 1400, 1.4),
      close: (A) => A.hiss(0.12, 0.05, 0, 1400, 500, 1.4),
      buy: (A) => { wood(A, 1000, 0.04); wood(A, 1500, 0.04, 0.08); wood(A, 2000, 0.04, 0.16); },
      deny: (A) => { A.knock(160, 110, 0.12, 0.08); A.knock(150, 100, 0.12, 0.06, 0.1); },
    },
  });

  S.register('drums', {
    name: 'Drum Kit', price: 2, art: 'drum-kit', desc: 'Hi-hats, rimshots, toms, a kick on every slam and a crash for Tetrises',
    play: {
      move: (A) => hat(A, 0.06),
      rotate: (A) => { A.ping(v(A, 1700), 0.03, 0.03, 0, [[2.2, 0.5]]); A.hiss(0.02, 0.08, 0, 3000, 3000, 2); },
      hold: (A) => hat(A, 0.05, 0, true),
      lock: (A, o) => tom(A, v(A, 170), (o && o.hard ? 0.06 : 0.11)),
      harddrop: (A, p) => { kick(A, 0.2 + (p || 0.5) * 0.08); snare(A, 0.06); },
      softland: (A) => kick(A, 0.08),
      clear: (A, n) => { const k = Math.min(4, n || 1); for (let i = 0; i <= k; i++) tom(A, 300 - i * 40, 0.12, i * 0.08); hat(A, 0.07, (k + 1) * 0.08, true); },
      tetris: (A) => { [0, 0.07, 0.14, 0.21, 0.28, 0.35].forEach((d, i) => (i < 3 ? snare(A, 0.08, d) : tom(A, 260 - (i - 3) * 50, 0.13, d))); kick(A, 0.24, 0.45); crash(A, 0.12, 0.45); },
      click: (A) => A.ping(v(A, 1700), 0.03, 0.026, 0, [[2.2, 0.5]]),
      tap: (A) => hat(A, 0.04),
      hover: (A) => hat(A, 0.015),
      tab: (A) => { tom(A, 320, 0.06); tom(A, 380, 0.05, 0.06); },
      open: (A) => hat(A, 0.05, 0, true),
      close: (A) => hat(A, 0.05),
      buy: (A) => { A.ping(560, 0.25, 0.04, 0, [[1.49, 0.8]]); A.ping(560, 0.25, 0.04, 0.14, [[1.49, 0.8]]); },
      deny: (A) => { tom(A, 120, 0.1); tom(A, 110, 0.08, 0.1); },
    },
  });

  S.register('typewriter', {
    name: 'Typewriter', price: 3, art: 'quill-ink', desc: 'Key clacks, the space bar, the carriage return and its bell',
    play: {
      move: (A) => key(A, 0.07),
      rotate: (A) => { key(A, 0.08); A.knock(300, 150, 0.05, 0.04, 0.02); },
      hold: (A) => { key(A, 0.06); A.knock(220, 110, 0.07, 0.06, 0.01); },
      lock: (A, o) => { const k = o && o.hard ? 0.55 : 1; A.knock(v(A, 260), 120, 0.07, 0.1 * k); key(A, 0.1 * k); },
      harddrop: (A, p) => { A.noise(0.06, 0.08 + (p || 0.5) * 0.04); A.knock(180, 60, 0.12, 0.15); A.hiss(0.05, 0.08, 0.03, 1800, 900, 2); },
      softland: (A) => key(A, 0.06),
      clear: (A, n) => { const k = Math.min(4, n || 1); for (let i = 0; i < 3 * k; i++) key(A, 0.07, i * 0.045 + Math.random() * 0.015); },
      tetris: (A) => { for (let i = 0; i < 8; i++) key(A, 0.07, i * 0.04); A.hiss(0.34, 0.07, 0.36, 1200, 3200, 4); for (let i = 0; i < 6; i++) A.hiss(0.008, 0.06, 0.38 + i * 0.05, 5000, 5000, 4); bell(A, 2700, 1.1, 0.05, 0.72); },
      click: (A) => key(A, 0.08),
      tap: (A) => key(A, 0.05),
      hover: (A) => A.hiss(0.008, 0.03, 0, 4200, 4200, 4),
      tab: (A) => { key(A, 0.06); key(A, 0.06, 0.06); },
      open: (A) => A.hiss(0.18, 0.05, 0, 1000, 2600, 3),
      close: (A) => A.hiss(0.16, 0.05, 0, 2600, 1000, 3),
      buy: (A) => bell(A, 2700, 0.8, 0.045),
      deny: (A) => { A.knock(200, 140, 0.08, 0.08); A.noise(0.03, 0.03, 0.02); },
    },
  });

  S.register('chimes', {
    name: 'Chimes', price: 0, art: 'ringing-bell', desc: 'Glass and brass: every piece rings', ach: true,
    play: {
      move: (A) => chime(A, v(A, PENTA[5 + Math.floor(Math.random() * 3)], 0.005), 0.25, 0.012),
      rotate: (A) => { chime(A, 1318, 0.3, 0.016); chime(A, 1760, 0.3, 0.012, 0.04); },
      hold: (A) => { for (let i = 0; i < 4; i++) chime(A, PENTA[3 + Math.floor(Math.random() * 5)] * 2, 0.5, 0.01, i * 0.05 + Math.random() * 0.03); },
      lock: (A, o) => bell(A, v(A, 392, 0.01), 0.6, (o && o.hard ? 0.02 : 0.034)),
      harddrop: (A, p) => { A.ping(98, 1.4, 0.06 + (p || 0.5) * 0.03, 0, [[1.48, 0.6], [2.1, 0.4], [2.94, 0.25], [4.1, 0.12]]); A.knock(120, 60, 0.12, 0.08); },
      softland: (A) => bell(A, 523, 0.4, 0.02),
      clear: (A, n) => { const k = Math.min(4, n || 1); for (let i = 0; i <= k + 1; i++) bell(A, PENTA[i + 1], 0.9, 0.03, i * 0.07); },
      tetris: (A) => { for (let i = 0; i < 8; i++) bell(A, PENTA[i], 1.3, 0.032, i * 0.06); A.ping(131, 2, 0.05, 0.1, [[1.48, 0.5], [2.1, 0.35]]); for (let i = 0; i < 6; i++) chime(A, PENTA[2 + (i % 6)] * 2, 0.8, 0.012, 0.6 + i * 0.07); },
      click: (A) => chime(A, 1760, 0.18, 0.018),
      tap: (A) => chime(A, 2093, 0.12, 0.01),
      hover: (A) => chime(A, 2637, 0.08, 0.004),
      tab: (A) => { chime(A, 1318, 0.2, 0.016); chime(A, 1760, 0.2, 0.016, 0.05); },
      open: (A) => { chime(A, 1046, 0.3, 0.014); chime(A, 1568, 0.3, 0.012, 0.06); },
      close: (A) => { chime(A, 1568, 0.3, 0.012); chime(A, 1046, 0.3, 0.012, 0.06); },
      buy: (A) => { bell(A, 1318, 0.6, 0.035); bell(A, 1760, 0.8, 0.035, 0.09); },
      deny: (A) => A.ping(220, 0.3, 0.05, 0, [[2.31, 0.5], [3.7, 0.2]]),
    },
  });

  S.register('clockwork', {
    name: 'Clockwork', price: 0, art: 'clockwork', desc: 'Ticks, ratchets, a wound spring and a cuckoo', ach: true,
    play: {
      move: (A) => tick(A, 0.08),
      rotate: (A) => { for (let i = 0; i < 3; i++) tick(A, 0.07, i * 0.025); },
      hold: (A) => { for (let i = 0; i < 5; i++) tick(A, 0.06 + i * 0.01, i * 0.04); },
      lock: (A, o) => tock(A, o && o.hard ? 0.06 : 0.1),
      harddrop: (A, p) => { tock(A, 0.14); A.knock(160, 70, 0.12, 0.1 + (p || 0.5) * 0.05); A.tone(140, 0.1, 'triangle', 0.04, 420, 0.03); A.tone(420, 0.28, 'triangle', 0.03, 260, 0.13); },
      softland: (A) => tock(A, 0.06),
      clear: (A, n) => { const k = Math.min(4, n || 1); A.hiss(0.3 + k * 0.06, 0.05, 0, 900, 1600, 6); for (let i = 0; i < 4 + k * 2; i++) tick(A, 0.06, i * 0.045); A.ping(1568, 0.3, 0.025, 0.2 + k * 0.08); },
      tetris: (A) => { for (let i = 0; i < 10; i++) tick(A, 0.07, i * 0.04); A.ping(784, 0.32, 0.06, 0.45, [[2, 0.3]]); A.ping(622, 0.45, 0.06, 0.72, [[2, 0.3]]); A.ping(784, 0.32, 0.05, 1.1, [[2, 0.3]]); A.ping(622, 0.45, 0.05, 1.37, [[2, 0.3]]); },
      click: (A) => tick(A, 0.1),
      tap: (A) => tick(A, 0.06),
      hover: (A) => tick(A, 0.025),
      tab: (A) => { tick(A, 0.08); tock(A, 0.06, 0.07); },
      open: (A) => { for (let i = 0; i < 3; i++) tick(A, 0.05, i * 0.03); },
      close: (A) => tock(A, 0.07),
      buy: (A) => { for (let i = 0; i < 6; i++) A.ping(2093, 0.04, 0.025, i * 0.035); },
      deny: (A) => { A.knock(180, 120, 0.1, 0.08); tock(A, 0.08, 0.06); },
    },
  });

  S.register('felt', {
    name: 'Felt', price: 0, art: 'wool', desc: 'Everything muffled: soft thumps and quiet marimba', ach: true,
    play: {
      move: (A) => A.hiss(0.03, 0.035, 0, 500, 400, 1),
      rotate: (A) => A.hiss(0.05, 0.035, 0, 600, 900, 1),
      hold: (A) => { A.hiss(0.12, 0.035, 0, 400, 800, 1); A.ping(392, 0.15, 0.015, 0.05); },
      lock: (A, o) => thump(A, v(A, 120), o && o.hard ? 0.05 : 0.08),
      harddrop: (A, p) => thump(A, 85, 0.1 + (p || 0.5) * 0.04),
      softland: (A) => thump(A, 140, 0.04),
      clear: (A, n) => { const k = Math.min(4, n || 1); for (let i = 0; i <= k; i++) A.ping(262 * Math.pow(1.125, i), 0.35, 0.03, i * 0.08, [[4, 0.1]]); },
      tetris: (A) => { [262, 330, 392, 523].forEach((f, i) => A.ping(f, 0.9, 0.035, i * 0.05, [[4, 0.1]])); thump(A, 90, 0.08); },
      click: (A) => thump(A, 220, 0.03),
      tap: (A) => thump(A, 260, 0.018),
      hover: (A) => A.hiss(0.015, 0.01, 0, 600, 600, 1),
      tab: (A) => { A.ping(330, 0.12, 0.018); A.ping(392, 0.12, 0.018, 0.05); },
      open: (A) => A.hiss(0.14, 0.03, 0, 300, 700, 1),
      close: (A) => A.hiss(0.12, 0.03, 0, 700, 300, 1),
      buy: (A) => { A.ping(392, 0.25, 0.03, 0, [[4, 0.1]]); A.ping(523, 0.3, 0.03, 0.08, [[4, 0.1]]); },
      deny: (A) => thump(A, 100, 0.05),
    },
  });

  S.register('till', {
    name: 'Till', price: 0, art: 'cash', desc: 'Coins, drawer bells and a ka-ching for every Tetris', ach: true,
    play: {
      move: (A) => coin(A, 2600, 0.012),
      rotate: (A) => { A.hiss(0.014, 0.07, 0, 3600, 3600, 3); coin(A, 3100, 0.01, 0.01); },
      hold: (A) => { A.hiss(0.16, 0.05, 0, 900, 400, 1.6); A.knock(200, 120, 0.06, 0.05, 0.14); },
      lock: (A, o) => { const k = o && o.hard ? 0.55 : 1; coin(A, 1900, 0.022 * k); coin(A, 2300, 0.016 * k, 0.04); A.knock(v(A, 220), 140, 0.06, 0.05 * k); },
      harddrop: (A, p) => { A.knock(300, 150, 0.06, 0.12); A.noise(0.05, 0.06 + (p || 0.5) * 0.04); A.hiss(0.18, 0.05, 0.04, 800, 300, 1.5); },
      softland: (A) => coin(A, 1800, 0.02),
      clear: (A, n) => { const k = Math.min(4, n || 1); for (let i = 0; i < 3 + k * 2; i++) coin(A, 1800 + Math.random() * 1600, 0.022, i * 0.04 + Math.random() * 0.02); },
      tetris: (A) => { A.knock(300, 150, 0.05, 0.12); bell(A, 2349, 1.1, 0.05, 0.05); bell(A, 1760, 1.2, 0.04, 0.12); A.hiss(0.2, 0.06, 0.2, 900, 300, 1.5); for (let i = 0; i < 10; i++) coin(A, 1700 + Math.random() * 1800, 0.02, 0.3 + i * 0.04 + Math.random() * 0.02); },
      click: (A) => { A.hiss(0.014, 0.08, 0, 3600, 3600, 3); A.knock(400, 250, 0.03, 0.03); },
      tap: (A) => coin(A, 2800, 0.01),
      hover: (A) => coin(A, 3400, 0.004),
      tab: (A) => { coin(A, 2000, 0.016); coin(A, 2600, 0.016, 0.05); },
      open: (A) => A.hiss(0.16, 0.05, 0, 400, 900, 1.6),
      close: (A) => { A.hiss(0.12, 0.05, 0, 900, 400, 1.6); A.knock(200, 120, 0.05, 0.05, 0.1); },
      buy: (A) => { A.knock(300, 150, 0.05, 0.1); bell(A, 2349, 0.9, 0.045, 0.04); },
      deny: (A) => { A.tone(120, 0.22, 'square', 0.03); A.tone(127, 0.22, 'square', 0.02); },
    },
  });

  S.register('arcade', {
    name: 'Arcade', price: 0, art: 'joystick', desc: 'Square-wave bleeps and chiptune fanfares', ach: true,
    play: {
      move: (A) => A.tone(v(A, 220), 0.03, 'square', 0.018),
      rotate: (A) => A.tone(440, 0.05, 'square', 0.022, 660),
      hold: (A) => { A.tone(330, 0.06, 'square', 0.022); A.tone(495, 0.06, 'square', 0.022, null, 0.05); },
      lock: (A, o) => A.tone(147, 0.07, 'square', o && o.hard ? 0.02 : 0.035, 110),
      harddrop: (A, p) => { A.tone(600, 0.14, 'square', 0.035 + (p || 0.5) * 0.015, 70); A.noise(0.06, 0.05); },
      softland: (A) => A.tone(196, 0.04, 'triangle', 0.04),
      clear: (A, n) => { const k = Math.min(4, n || 1); [523, 659, 784, 1046, 1318].slice(0, k + 1).forEach((f, i) => A.tone(f, 0.08, 'square', 0.03, null, i * 0.055)); },
      tetris: (A) => { [523, 659, 784, 1046, 784, 1046, 1318, 1568].forEach((f, i) => A.tone(f, 0.09, 'square', 0.03, null, i * 0.07)); A.tone(2093, 0.4, 'square', 0.02, null, 0.6); A.tone(262, 0.6, 'triangle', 0.06, null, 0); },
      click: (A) => A.tone(988, 0.03, 'square', 0.018),
      tap: (A) => A.tone(1318, 0.02, 'square', 0.01),
      hover: (A) => A.tone(1760, 0.012, 'square', 0.004),
      tab: (A) => { A.tone(660, 0.04, 'square', 0.018); A.tone(990, 0.05, 'square', 0.018, null, 0.04); },
      open: (A) => A.tone(330, 0.12, 'square', 0.02, 990),
      close: (A) => A.tone(990, 0.12, 'square', 0.02, 330),
      buy: (A) => { A.tone(988, 0.07, 'square', 0.025); A.tone(1318, 0.18, 'square', 0.025, null, 0.07); },
      deny: (A) => A.tone(110, 0.18, 'square', 0.03, 90),
    },
  });

  S.register('laser', {
    name: 'Laser', price: 0, art: 'ray-gun', desc: 'Pew, zap and a big blast for every slam', ach: true,
    play: {
      move: (A) => A.tone(v(A, 1200), 0.035, 'sine', 0.02, 700),
      rotate: (A) => A.tone(400, 0.06, 'square', 0.016, 1600),
      hold: (A) => { A.tone(300, 0.15, 'sine', 0.03, 900); A.tone(303, 0.15, 'sawtooth', 0.01, 905); },
      lock: (A, o) => pew(A, 900, 300, 0.06, o && o.hard ? 0.012 : 0.02),
      harddrop: (A, p) => { pew(A, 2400, 60, 0.3, 0.025 + (p || 0.5) * 0.01); A.noise(0.12, 0.05); },
      softland: (A) => A.tone(500, 0.05, 'sine', 0.03, 300),
      clear: (A, n) => { const k = Math.min(4, n || 1); for (let i = 0; i <= k; i++) pew(A, 1800 + i * 300, 200, 0.14, 0.018, i * 0.07); },
      tetris: (A) => { A.tone(200, 0.5, 'sawtooth', 0.02, 2400); A.tone(203, 0.5, 'square', 0.01, 2420); pew(A, 3000, 50, 0.5, 0.03, 0.5); A.noise(0.3, 0.06, 0.5); },
      click: (A) => A.tone(1500, 0.03, 'sine', 0.02, 2200),
      tap: (A) => A.tone(2000, 0.02, 'sine', 0.012, 2600),
      hover: (A) => A.tone(2600, 0.015, 'sine', 0.004),
      tab: (A) => { A.tone(900, 0.04, 'square', 0.012, 1400); A.tone(1400, 0.05, 'square', 0.012, 2000, 0.04); },
      open: (A) => A.tone(200, 0.18, 'sine', 0.025, 1200),
      close: (A) => A.tone(1200, 0.18, 'sine', 0.025, 200),
      buy: (A) => [660, 880, 1100, 1320, 1760].forEach((f, i) => A.tone(f, 0.06, 'square', 0.016, f * 1.2, i * 0.04)),
      deny: (A) => { A.tone(140, 0.2, 'square', 0.025); A.tone(146, 0.2, 'sawtooth', 0.015); },
    },
  });

  // Hellscape looks: fire, stone and a gong
  S.register('inferno', {
    name: 'Inferno', price: 0, art: 'flame', desc: 'Crackling fire, stone thuds, roaring clears and a gong for every Tetris', ach: 'hell', secret: true,
    play: {
      move: (A) => { A.hiss(0.03, 0.05, 0, 3200, 1600, 2); A.knock(v(A, 180), 120, 0.03, 0.016); },
      rotate: (A) => A.hiss(0.09, 0.07, 0, 600, 2800, 1.2),
      hold: (A) => { A.hiss(0.22, 0.06, 0, 400, 1900, 1); A.tone(110, 0.25, 'sawtooth', 0.014, 82); },
      lock: (A, o) => { A.knock(v(A, 92), 48, 0.12, o && o.hard ? 0.04 : 0.06); A.hiss(0.18, 0.035, 0.03, 5200, 3000, 2); },
      harddrop: (A, p) => { A.knock(70, 34, 0.3, 0.09 + (p || 0.5) * 0.03); A.noise(0.25, 0.07); A.hiss(0.42, 0.06, 0.05, 900, 200, 0.8); A.tone(55, 0.4, 'sine', 0.09, 30); },
      softland: (A) => A.knock(140, 80, 0.06, 0.03),
      clear: (A, n) => { const k = Math.min(4, n || 1); for (let i = 0; i < k; i++) A.hiss(0.26, 0.07, i * 0.07, 400, 2600, 0.9); A.ping(98, 0.6, 0.03, 0, [[2.76, 0.5], [5.4, 0.3]]); },
      tetris: (A) => { A.ping(65, 1.4, 0.06, 0, [[2.76, 0.6], [5.4, 0.35], [8.9, 0.2]]); A.hiss(0.9, 0.09, 0, 300, 3200, 0.7); A.tone(55, 1.0, 'sawtooth', 0.022, 41); },
      click: (A) => { A.knock(v(A, 600), 300, 0.03, 0.02); A.hiss(0.02, 0.03, 0, 4000, 4000, 3); },
      tap: (A) => A.knock(900, 500, 0.02, 0.012),
      hover: (A) => A.hiss(0.02, 0.01, 0, 5000, 5000, 4),
      tab: (A) => A.hiss(0.06, 0.04, 0, 800, 2400, 1.5),
      open: (A) => A.hiss(0.2, 0.06, 0, 300, 1800, 1),
      close: (A) => A.hiss(0.2, 0.05, 0, 1800, 300, 1),
      buy: (A) => { A.ping(1568, 0.12, 0.03); A.ping(2093, 0.2, 0.03, 0.06); A.hiss(0.15, 0.04, 0, 5000, 3000, 2); },
      deny: (A) => { A.tone(80, 0.3, 'sawtooth', 0.03, 60); A.knock(120, 60, 0.15, 0.05); },
    },
  });

  S.register('rubber', {
    name: 'Squeaky Toy', price: 0, art: 'plastic-duck', desc: 'Squeaks, boings and a bicycle horn', ach: true,
    play: {
      move: (A) => squeak(A, 1100, 0.012),
      rotate: (A) => squeak(A, 800, 0.02),
      hold: (A) => { squeak(A, 900, 0.018); squeak(A, 1200, 0.016, 0.12); },
      lock: (A, o) => boing(A, v(A, 160), o && o.hard ? 0.02 : 0.035),
      harddrop: (A, p) => { boing(A, 90, 0.05 + (p || 0.5) * 0.02); A.knock(140, 70, 0.1, 0.08); },
      softland: (A) => boing(A, 200, 0.025),
      clear: (A, n) => { const k = Math.min(4, n || 1); for (let i = 0; i <= k; i++) squeak(A, 700 + i * 160, 0.022, i * 0.09); },
      tetris: (A) => { A.tone(330, 0.24, 'sawtooth', 0.03, 300); A.tone(415, 0.24, 'square', 0.015, 390); A.tone(330, 0.3, 'sawtooth', 0.03, 300, 0.3); A.tone(415, 0.3, 'square', 0.015, 390, 0.3); for (let i = 0; i < 5; i++) squeak(A, 800 + i * 150, 0.02, 0.65 + i * 0.08); },
      click: (A) => squeak(A, 1300, 0.014),
      tap: (A) => squeak(A, 1600, 0.008),
      hover: (A) => A.tone(2200, 0.02, 'triangle', 0.004, 2600),
      tab: (A) => { squeak(A, 1000, 0.014); squeak(A, 1300, 0.012, 0.08); },
      open: (A) => boing(A, 220, 0.02),
      close: (A) => A.tone(700, 0.18, 'triangle', 0.02, 300),
      buy: (A) => { squeak(A, 1000, 0.02); squeak(A, 1400, 0.02, 0.1); },
      deny: (A) => { A.tone(600, 0.4, 'triangle', 0.03, 150); A.hiss(0.35, 0.03, 0, 1200, 400, 1.5); },
    },
  });
})(window.SB);
