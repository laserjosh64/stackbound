// Stackbound achievements: goals kept across runs. Each one pays a Ticket, and most open something up: a builder,
// a curio, the Trophy Pack, the Trophy Shelf schematic, a sound pack, a Pocket item or a style. Nine Circles also
// opens Hellscape (Hazard 10), and Hell's Survivor the Hellscape looks at the Prize Counter. Locked things stay
// out of the Workshop and every other pool until earned (SB.FREE_BUILD opens them all). Hidden ones show as ???
// until earned. A banner drops in when one is earned, never while a piece is falling.
'use strict';
(function (SB) {
  // test(m, s, n): m is the save, s the achievement counters, n how many others are earned. prog gives [now, goal].
  const A = (id, name, icon, desc, test, extra) => Object.assign({ id, name, icon, desc, test }, extra || {});
  // Hazards won (any Builder), by number; 10 is Hellscape
  const won = (m, n) => !!(m.hazardsWon && m.hazardsWon[n]);
  SB.ACHIEVEMENTS = [
    A('first_stack', 'Ground Floor', 'stairs', 'Clear your first Stack', (m, s) => s.stacks >= 1),
    A('first_tetris', 'Four Across', 'i-brick', 'Clear a Tetris', (m) => m.tetrises >= 1),
    A('warden', 'Warden Breaker', 'medal-skull', 'Defeat a Warden', (m, s) => s.wardens >= 1),
    A('floor3', 'Third Floor', 'ladder', 'Reach Floor 3', (m) => m.bestAnte >= 3, { reward: { starter: 'glassblower' } }),
    A('floor5', 'Halfway Up', 'mountain-road', 'Reach Floor 5', (m) => m.bestAnte >= 5, { reward: { starter: 'giant' } }),
    A('tetris25', 'Tetris Habit', 'star-medal', 'Clear 25 Tetrises', (m) => m.tetrises >= 25, { prog: (m) => [m.tetrises, 25], reward: { starter: 'purist' } }),
    A('pocket12', 'Well Stocked', 'swap-bag', 'Use 12 Pocket items', (m) => m.consumablesUsed >= 12, { prog: (m) => [m.consumablesUsed, 12], reward: { starter: 'alchemist' } }),
    A('push10', 'Pushover', 'upgrade', 'Complete 10 Push Ons', (m) => m.pushes >= 10, { prog: (m) => [m.pushes, 10], reward: { starter: 'gambler' } }),
    A('push3', 'No Brakes', 'rolling-energy', 'Complete 3 Push Ons in one Stack', (m, s) => s.bestPushes >= 3, { prog: (m, s) => [s.bestPushes, 3], reward: { curio: 'egg' } }),
    A('sprint', 'Sprinter', 'sprint', "Reach a Stack's target within 45 seconds", (m, s) => s.fastTarget <= 45, { reward: { curio: 'starting_gun' } }),
    A('allclear', 'Clean Slate', 'sparkles', 'Clear the whole board', (m, s) => s.allClears >= 1, { reward: { curio: 'bedrock' } }),
    A('tspin', 'Twist Ending', 'whirlwind', 'Clear a T-Spin Double', (m, s) => s.tspinDoubles >= 1, { reward: { curio: 'spin_doctor' } }),
    A('combo', 'Chain Gang', 'linked-rings', 'Reach a x6 combo', (m, s) => s.bestCombo >= 6, { prog: (m, s) => [s.bestCombo, 6], reward: { curio: 'ouroboros' } }),
    A('rich', 'Deep Pockets', 'wallet', 'Hold $60 at once', (m, s) => s.bestMoney >= 60, { prog: (m, s) => [s.bestMoney, 60], reward: { pack: 'trophy' } }),
    A('fullhouse', 'Full House', 'open-treasure-chest', 'Fill every curio slot', (m, s) => s.fullCurios >= 1, { reward: { blueprint: 'trophy_shelf' } }),
    A('win', 'Top of the Tower', 'laurel-crown', 'Win a run', (m) => m.wins >= 1, { reward: { curio: 'trophy_case' } }),
    A('hazard5', 'Hazard Pay', 'hazard-sign', 'Win a run on Hazard 5 or higher', (m, s) => s.bestWinStake >= 5, { reward: { curio: 'the_crown' } }),
    // one for winning each Hazard by itself (pass 27); all nine open Hellscape
    A('hz1', 'Smooth Sailing', 'sailboat', 'Win a run on Hazard 1 (Calm)', (m) => won(m, 1), { reward: { curio: 'still_water' } }),
    A('hz2', 'Belt Tightener', 'belt-buckles', 'Win a run on Hazard 2 (Lean)', (m) => won(m, 2), { reward: { curio: 'lean_season' } }),
    A('hz3', 'Nerves of Steel', 'heart-beats', 'Win a run on Hazard 3 (Tense)', (m) => won(m, 3), { reward: { curio: 'tension_spring' } }),
    A('hz4', 'Curse Breaker', 'cursed-star', 'Win a run on Hazard 4 (Cursed)', (m) => won(m, 4), { reward: { curio: 'hex_ward' } }),
    A('hz5', 'Tax Return', 'abacus', 'Win a run on Hazard 5 (Taxed)', (m) => won(m, 5), { reward: { curio: 'receipt' } }),
    A('hz6', 'Slim Pickings', 'fishbone', 'Win a run on Hazard 6 (Sparse)', (m) => won(m, 6), { reward: { curio: 'minimalist' } }),
    A('hz7', 'Rush Hour', 'traffic-lights-red', 'Win a run on Hazard 7 (Rushed)', (m) => won(m, 7), { reward: { curio: 'rush_order' } }),
    A('hz8', 'Greed Is Good', 'coins-pile', 'Win a run on Hazard 8 (Greedy)', (m) => won(m, 8), { reward: { curio: 'double_down' } }),
    A('hz9', 'Rags to Riches', 'paper-bag-crumpled', 'Win a run on Hazard 9 (Broke)', (m) => won(m, 9), { reward: { curio: 'empty_pockets' } }),
    A('lines1000', 'Line Worker', 'brick-pile', 'Clear 1,000 lines', (m) => m.lines >= 1000, { prog: (m) => [m.lines, 1000], reward: { curio: 'infinite_well' } }),
    A('endless30', 'Long Haul', 'duration', 'Clear 30 Endless Stacks in one run', (m, s) => s.endlessBest >= 30, { prog: (m, s) => [s.endlessBest, 30], reward: { curio: 'clockmaker' } }),
    A('sky16', 'Skies the Limit', 'rocket-flight', 'Clear 16 lines at once', (m, s) => s.bestClear >= 16, { prog: (m, s) => [s.bestClear, 16], reward: { curio: 'penthouse' } }),
    A('tight', 'Tight Fit', 'crush', 'Clear a line with only 3 rows of space left', (m, s) => s.tightClears >= 1, { reward: { curio: 'groundswell' } }),
    A('dumpster', 'Dumpster Diver', 'trash-can', 'Clear 50 garbage rows', (m, s) => s.garbageRows >= 50, { prog: (m, s) => [s.garbageRows, 50], reward: { curio: 'scrap_metal' } }),
    A('held', 'Held Breath', 'lungs', 'Clear a line with a piece that waited 30 seconds in Hold', (m, s) => s.heldClears >= 1, { reward: { curio: 'time_capsule' } }),
    A('bookworm', 'Bookworm', 'bookmarklet', 'Own a Common, Uncommon, Rare and Legendary curio at once', (m, s) => s.allRarities >= 1, { reward: { curio: 'bookends' } }),
    A('cranked', 'Cranked', 'gear-stick', 'Score a clear with 100 Charge or more', (m, s) => s.bestCharge >= 100, { prog: (m, s) => [s.bestCharge, 100], reward: { curio: 'amplifier' } }),
    A('close', 'Close Shave', 'razor', "Reach a Stack's target with 5 seconds or less on the clock", (m, s) => s.closeShaves >= 1, { reward: { sound: 'clockwork' } }),
    A('spender', 'Big Spender', 'shopping-cart', 'Spend $40 in one Workshop visit', (m, s) => s.shopSpend >= 40, { prog: (m, s) => [s.shopSpend, 40], reward: { sound: 'till' } }),
    A('spin', 'Spin Class', 'cycling', 'Clear 25 T-Spins', (m, s) => s.tspins >= 25, { prog: (m, s) => [s.tspins, 25], reward: { sound: 'arcade' } }),
    A('cellblock', 'Cell Block', 'prisoner', 'Clear 3 Board Pack cells in one clear', (m, s) => s.cellClears >= 1, { reward: { sound: 'chimes' } }),
    A('over', 'Overachiever', 'achievement', 'Earn 12 other achievements', (m, s, n) => n >= 12, { prog: (m, s, n) => [n, 12], reward: { curio: 'overachiever' } }),
    // hidden: ??? until earned
    A('hatch', 'Hatchling', 'nest-eggs', 'Hatch The Egg', (m) => (m.eggsHatched || 0) >= 1, { hidden: true, reward: { curio: 'phoenix_feather' } }),
    A('trust', 'Trust Fall', 'falling', 'Clear a Tetris with a piece you never moved or rotated', (m, s) => s.trustFalls >= 1, { hidden: true, reward: { curio: 'blindfold' } }),
    A('pacifist', 'Pacifist', 'peace-dove', 'Clear a Stack without a single hard drop', (m, s) => s.softStacks >= 1, { hidden: true, reward: { sound: 'felt' } }),
    A('butter', 'Butterfingers', 'banana-peel', 'Top out in the first 20 seconds of a Stack', (m, s) => s.quickTopouts >= 1, { hidden: true, reward: { sound: 'rubber' } }),
    A('night', 'Night Shift', 'moon', 'Clear a line at speed level 15 or higher', (m, s) => s.bestLevel >= 15, { hidden: true, reward: { sound: 'laser' } }),
    A('admirer', 'Secret Admirer', 'heart-key', 'Enter the secret code during a Stack', (m, s) => s.secretCode >= 1, { hidden: true, reward: { item: 'love_letter' } }),
    A('four_hearts', 'Four Hearts', 'hearts', 'Reach the True End on all four routes of Falling for You', (m) => !!(SB.Dating && SB.Dating.clearedCount && SB.Dating.clearedCount(m) >= 4), { hidden: true, reward: { style: 'doki' } }),
    A('flyer', 'Frequent Flyer', 'feathered-wing', 'Score 15 in Flutter', (m, s) => s.flutterBest >= 15, { hidden: true, prog: (m, s) => [s.flutterBest, 15], reward: { curio: 'paper_plane' } }),
    A('nine', 'Nine Circles', 'fire-ring', 'Win a run on each of Hazards 1 to 9', (m) => [1, 2, 3, 4, 5, 6, 7, 8, 9].every((n) => won(m, n)), { hidden: true, prog: (m) => [[1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => won(m, n)).length, 9], reward: { curio: 'devils_bargain' }, also: 'Hellscape, Hazard 10' }),
    A('hell', "Hell's Survivor", 'burning-skull', 'Win a run on Hellscape', (m) => won(m, 10), { hidden: true, reward: { curio: 'devilled_egg' }, also: 'The Hellscape looks' }),
    A('credits', 'Credits Roll', 'clapperboard', 'Bring down the title', (m, s) => s.titleSecret >= 1, { hidden: true, reward: { curio: 'mortar' } }),
  ];
  // Testing: every achievement counts as earned for everyone (what they open, the count, the page). Real earns
  // are still recorded, so banners and Tickets still come when you do the thing. Set to false to lock them again.
  SB.ALL_ACH = true;
  const BY = {};
  for (const a of SB.ACHIEVEMENTS) BY[a.id] = a;
  // tag what each one opens, so the pools can ask SB.Ach.open(def)
  const TABLE = { curio: () => SB.RELICS, pack: () => SB.PACKS, blueprint: () => SB.BLUEPRINTS, starter: () => SB.STARTERS, sound: () => SB.COSMETICS.sound.items, item: () => SB.SECRET_ITEMS };
  for (const a of SB.ACHIEVEMENTS) {
    if (!a.reward) continue;
    const k = Object.keys(a.reward)[0];
    a.rkind = k; a.rid = a.reward[k];
    const tbl = TABLE[k] && TABLE[k]();
    if (tbl && tbl[a.rid]) tbl[a.rid].ach = a.id;
  }

  const COUNTERS = {
    stacks: 0, wardens: 0, bestPushes: 0, fastTarget: 9999, allClears: 0, tspinDoubles: 0, bestCombo: 0, bestMoney: 0, fullCurios: 0, bestWinStake: 0, endlessBest: 0, titleSecret: 0,
    bestClear: 0, tightClears: 0, garbageRows: 0, heldClears: 0, allRarities: 0, bestCharge: 0, closeShaves: 0, shopSpend: 0, tspins: 0, cellClears: 0,
    trustFalls: 0, softStacks: 0, quickTopouts: 0, bestLevel: 0, secretCode: 0, flutterBest: 0,
  };
  const store = () => {
    const m = SB.meta.data;
    if (!m.ach || typeof m.ach !== 'object') m.ach = {};
    if (!m.ach.earned) m.ach.earned = {};
    m.ach.s = Object.assign({}, COUNTERS, m.ach.s || {});
    return m.ach;
  };
  const st = () => store().s;

  const Ach = SB.Ach = { queue: [], byId: BY };
  // got: really earned in this save. earned: counts as earned (always, while SB.ALL_ACH is on)
  Ach.got = (id) => !!store().earned[id];
  Ach.earned = (id) => SB.ALL_ACH || Ach.got(id);
  Ach.count = () => SB.ACHIEVEMENTS.filter((a) => Ach.earned(a.id)).length;
  Ach.open = (def) => SB.FREE_BUILD || !def || !def.ach || Ach.earned(def.ach);
  Ach.progress = (a) => {
    const n = SB.ACHIEVEMENTS.filter((o) => o !== a && store().earned[o.id]).length;
    if (!a.prog) return null;
    const [v, goal] = a.prog(SB.meta.data, st(), n);
    return [Math.min(goal, Math.max(0, Math.floor(v || 0))), goal];
  };
  // counters: add, keep the highest, keep the lowest
  Ach.bump = (k, n) => { const s = st(); s[k] = (s[k] || 0) + (n || 1); };
  Ach.best = (k, v) => { const s = st(); if (v > (s[k] || 0)) s[k] = v; };
  Ach.stat = (k) => st()[k] || 0;
  Ach.least = (k, v) => { const s = st(); if (v < s[k]) s[k] = v; };

  // the name, art and tooltip of what an achievement opens
  Ach.rewardInfo = function (a) {
    if (!a.reward) return null;
    const id = a.rid;
    if (a.rkind === 'curio') { const d = SB.RELICS[id]; return { kind: 'Curio', name: d.name, art: d.art || d.icon, rarity: d.rarity }; }
    if (a.rkind === 'pack') { const d = SB.PACKS[id]; return { kind: 'Pack', name: d.name, art: d.art || d.icon, desc: d.tip }; }
    if (a.rkind === 'blueprint') { const d = SB.BLUEPRINTS[id]; return { kind: 'Schematic', name: d.name, art: d.art || d.icon, desc: d.desc }; }
    if (a.rkind === 'sound') { const d = SB.COSMETICS.sound.items[id]; return { kind: 'Sound pack', name: d.name, art: SB.SFX.art(id), desc: d.desc }; }
    if (a.rkind === 'item') { const d = SB.SECRET_ITEMS[id]; return { kind: 'Pocket item', name: d.name, art: d.icon, desc: d.desc }; }
    if (a.rkind === 'style') return { kind: 'Style', name: 'Doki Doki', art: SB.ico('hearts'), desc: 'A whole new look for the game, from Settings' };
    const d = SB.STARTERS[id];
    return { kind: 'Builder', name: d.name, art: d.icon, desc: d.desc };
  };

  // Look for newly earned achievements. run (optional) feeds the money and curio-slot counters first.
  // quiet: earn without banners (the catch-up when an older save first loads)
  Ach.check = function (run, quiet) {
    const m = SB.meta.data;
    if (!m) return [];
    const ach = store(), s = ach.s;
    if (run && run.relics) {
      Ach.best('bestMoney', run.money || 0);
      if (SB.Run && run.relics.length >= SB.Run.relicSlots(run)) s.fullCurios = 1;
      if (new Set(run.relics.map((r) => SB.RELICS[r.id].rarity)).size >= 4) s.allRarities = 1;
      if (run.shop) Ach.best('shopSpend', run.shop.spent || 0);
    }
    const got = [];
    for (let pass = 0; pass < 2; pass++) {
      for (const a of SB.ACHIEVEMENTS) {
        if (ach.earned[a.id]) continue;
        const n = SB.ACHIEVEMENTS.filter((o) => o !== a && ach.earned[o.id]).length;
        let ok = false;
        try { ok = !!a.test(m, s, n); } catch (e) { ok = false; }
        if (!ok) continue;
        ach.earned[a.id] = Date.now();
        if (a.rkind === 'starter') m.unlocked[a.rid] = true;
        if (SB.Cosmetic) SB.Cosmetic.award(1);
        got.push(a.id);
      }
    }
    if (!got.length) { Ach.flush(); return got; }
    SB.meta.save();
    if (quiet) Ach.queue.push({ summary: got.length });
    else for (const id of got) Ach.queue.push({ id });
    Ach.flush();
    return got;
  };
  // a cleared line: lifetime lines, All Clears, T-Spins, the best combo, the biggest clear, clears near the top,
  // garbage, Hold, untouched Tetrises, Board Pack cells, speed and the biggest Charge
  Ach.onClear = function (info, res) {
    const m = SB.meta.data;
    m.lines = (m.lines || 0) + info.lines;
    if (info.allclear) Ach.bump('allClears');
    if (info.tspin) Ach.bump('tspins');
    if (info.tspin && info.lines >= 2) Ach.bump('tspinDoubles');
    Ach.best('bestCombo', info.combo || 0);
    Ach.best('bestClear', info.lines);
    if (info.room <= 3) Ach.bump('tightClears');
    if (info.garbageRows) Ach.bump('garbageRows', info.garbageRows);
    if (info.heldFor >= 30) Ach.bump('heldClears');
    if (info.lines >= 4 && info.untouched) Ach.bump('trustFalls');
    if (info.specialCells >= 3) Ach.bump('cellClears');
    Ach.best('bestLevel', info.level || 0);
    if (res) Ach.best('bestCharge', Math.floor(res.mult || 0));
    Ach.check();
  };

  // ---------- the banner ----------
  // One plate at a time drops in from the top: medal, name, and what it opened. Waits while a piece is falling
  // (a paused Stack is fine) and while the dating game is open.
  let showing = false;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  Ach.flush = function () {
    if (showing || !Ach.queue.length || !document.body) return;
    const UI = SB.UI;
    if (!UI || Ach.hold) return;
    if (UI.screen === 'play' && UI.game && UI.game.status !== 'over' && UI.game.status !== 'paused') return;
    if (SB.Dating && SB.Dating.isOpen) return;
    if (document.querySelector('.title-screen.intro')) return;
    const it = Ach.queue.shift();
    let html;
    if (it.summary) {
      html = `<div class="ach-medal">${SB.ico('achievement')}</div><div class="ach-txt"><small>Achievements</small><b>${it.summary} earned</b></div>`;
    } else {
      const a = BY[it.id], r = Ach.rewardInfo(a);
      html = `<div class="ach-medal">${SB.ico(a.icon)}</div><div class="ach-txt"><small>Achievement</small><b>${esc(a.name)}</b>${r ? `<span class="ach-rew">${r.art}<span>${esc(r.name)}</span></span>` : ''}</div>`;
    }
    const el = document.createElement('div');
    el.className = 'ach-pop';
    el.setAttribute('role', 'status');
    el.innerHTML = html;
    (document.getElementById('app') || document.body).appendChild(el);
    showing = true;
    if (SB.audio) SB.audio.play('unlock');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    const out = () => {
      el.classList.remove('in');
      el.classList.add('out');
      setTimeout(() => { el.remove(); showing = false; Ach.flush(); }, 380);
    };
    setTimeout(out, it.summary ? 2600 : 3200);
  };
})(window.SB);
