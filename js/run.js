// Stackbound run management: run state, antes, payouts, shop, bag, consumables
'use strict';
(function (SB) {
  const BAG = 10; // bag grid is 10x10 max
  const Run = (SB.Run = {});

  // ---------- queries ----------
  Run.hasRelic = (run, id) => run.relics.some((r) => r.id === id);
  Run.hasBlueprint = (run, id) => run.blueprints.includes(id);
  // achievements keep some curios, a pack and a schematic out of every pool until earned (achieve.js)
  // Mythic curios are only ever offered in Endless
  Run.relicOpen = (id, run) => (SB.RELICS[id].rarity !== 'Mythic' || !!(run && run.endless)) && (!SB.Ach || SB.Ach.open(SB.RELICS[id]));
  const TOP = (id) => SB.RELICS[id].rarity === 'Legendary' || SB.RELICS[id].rarity === 'Mythic';
  Run.forEachRelic = (run, fn) => run.relics.forEach((r) => fn(SB.RELICS[r.id], r));
  Run.tagCounts = (run) => {
    const c = {};
    for (const r of run.relics) { const t = SB.RELICS[r.id].tag; if (t) c[t] = (c[t] || 0) + 1; }
    return c;
  };
  Run.transformed = (run, tag) => (Run.tagCounts(run)[tag] || 0) >= 3;
  Run.stat = function (run, key) {
    let v = 0;
    for (const r of run.relics) { const d = SB.RELICS[r.id]; if (d.stat && d.stat[key]) v += d.stat[key]; }
    const bp = (id) => run.blueprints.includes(id);
    switch (key) {
      case 'holdSlots': v += (bp('second_hold') ? 1 : 0) + (bp('third_hold') ? 1 : 0) + (Run.transformed(run, 'Bag') ? 1 : 0); break;
      case 'previews': v += (bp('long_sight') ? 2 : 0) + (bp('clairvoyance') ? 2 : 0) + (Run.transformed(run, 'Bag') ? 2 : 0); break;
      case 'interestCap': v += bp('seed_money') ? 2 : 0; break;
      case 'clock': v += bp('long_fuse') ? 30 : 0; break;
    }
    return v;
  };
  Run.relicSlots = (run) => Math.max(1, 5 + (Run.hasBlueprint(run, 'extra_socket') ? 1 : 0) + (Run.hasBlueprint(run, 'twin_socket') ? 1 : 0) + (run.slotMod || 0));
  // a secret item brings its own slot
  Run.consSlots = (run) => 2 + (Run.hasBlueprint(run, 'satchel') ? 1 : 0) + (Run.hasBlueprint(run, 'backpack') ? 1 : 0) + (run.consumables.some((c) => c.kind === 'secret') ? 1 : 0);
  Run.disabledRelics = (run, g) => {
    const s = new Set();
    if (g && g.isBoss && g.isBoss('thief') && run.relics.length) s.add(0);
    if (g && g.mod === 'silent') { s.add(run.relics.length - 1); s.add(run.relics.length - 2); }
    return s;
  };
  Run.levelClear = (run, type, n) => { run.levels[type] = Math.max(1, (run.levels[type] || 1) + n); };
  Run.mostUsedClear = (run) => {
    let best = null, n = -1;
    for (const k in run.clearCounts) if (run.clearCounts[k] > n) { n = run.clearCounts[k]; best = k; }
    return best;
  };
  Run.livingBoard = (run) => {
    for (let i = 0; i < 50; i++) {
      const k = SB.randInt(0, run.board.w - 1) + ',' + SB.randInt(0, 11);
      if (!run.board.cells[k]) { run.board.cells[k] = 'prism'; return; }
    }
  };
  Run.startLevel = (run, stack) => {
    // Hellscape: every Stack starts at speed level 8 or higher (Snooze Button can still take 2 off)
    if (run.stake >= 10) return SB.clamp(Math.max(8, 1 + Math.floor((run.ante - 1) * 0.85) + (stack.mod === 'rush' ? 3 : 0) + (stack.mod === 'fastforward' ? 5 : 0)) + Run.stat(run, 'startLevel') + (run.overload || 0), 1, 20);
    if (Run.hasBlueprint(run, 'head_start')) return 1 + (stack.mod === 'fastforward' ? 5 : 0) + (stack.mod === 'rush' ? 3 : 0);
    let L = 1 + Math.floor((run.ante - 1) * 0.85);
    if (stack.mod === 'calm') L -= 1;
    if (stack.mod === 'rush') L += 3;
    if (stack.mod === 'fastforward') L += 5;
    L += Run.stat(run, 'startLevel');
    L += run.overload || 0;
    return SB.clamp(L, 1, 20);
  };

  // ---------- bag ----------
  Run.normCells = (cells) => {
    const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1]));
    return cells.map(([x, y]) => [x - mx, y - my]);
  };
  Run.rotCells = (cells) => Run.normCells(cells.map(([x, y]) => [-y, x]));
  Run.pieceBagCells = (p) => Run.normCells(SB.SHAPES[p.shape].rots[p.rot || 0]).map(([x, y]) => [x + p.bx, y + p.by]);
  Run.bagOccupancy = (run, except) => {
    const occ = new Array(BAG * BAG).fill(null);
    for (const p of run.pieces) {
      if (p === except || p.bx === undefined || p.bx === null) continue;
      for (const [x, y] of Run.pieceBagCells(p)) occ[y * BAG + x] = p;
    }
    return occ;
  };
  Run.bagFits = (run, cells, ox, oy, except) => {
    const occ = Run.bagOccupancy(run, except);
    for (const [cx, cy] of cells) {
      const x = cx + ox, y = cy + oy;
      if (x < 0 || y < 0 || x >= BAG || y >= BAG) return false;
      if (!run.bag.active[y * BAG + x] || occ[y * BAG + x]) return false;
    }
    return true;
  };
  Run.patchFits = (run, cells, ox, oy) => {
    let adj = false;
    for (const [cx, cy] of cells) {
      const x = cx + ox, y = cy + oy;
      if (x < 0 || y < 0 || x >= BAG || y >= BAG) return false;
      if (run.bag.active[y * BAG + x]) return false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < BAG && ny < BAG && run.bag.active[ny * BAG + nx]) adj = true;
      }
    }
    return adj;
  };
  Run.bagFree = (run) => {
    const occ = Run.bagOccupancy(run);
    let n = 0;
    for (let i = 0; i < BAG * BAG; i++) if (run.bag.active[i] && !occ[i]) n++;
    return n;
  };
  Run.bagCellsUsed = (run) => run.pieces.reduce((a, p) => a + SB.SHAPES[p.shape].n, 0);
  Run.canFitAnywhere = (run, shape) => {
    for (let rot = 0; rot < 4; rot++) {
      const cells = Run.normCells(SB.SHAPES[shape].rots[rot]);
      for (let y = 0; y < BAG; y++) for (let x = 0; x < BAG; x++) if (Run.bagFits(run, cells, x, y)) return { x, y, rot };
    }
    return null;
  };
  Run.bagBonusAt = (run, p) => {
    if (p.bx === undefined || p.bx === null) return [];
    return Run.pieceBagCells(p).map(([x, y]) => run.bag.bonus[y * BAG + x]).filter(Boolean);
  };
  Run.bagBonusWeight = (run, p) => Run.bagBonusAt(run, p).filter((b) => b === 'luckybag').length * 3;
  Run.bagVault = () => false;
  Run.effectiveLevel = (run, p) => SB.pieceLv(p);
  // Temporary levels (Forge special, Gilded bag cells) sit on top of a piece's own level and wear off when the
  // Floor ends. Returns levels added.
  Run.forgeLevels = (run, p, n) => {
    const add = Math.max(0, Math.min(n, SB.MAX_LEVEL - SB.pieceLv(p)));
    if (add) p.forged = (p.forged || 0) + add;
    return add;
  };
  // a lasting level-up (Workshop Forge, Forge Glyph, Forge Token, Piece Pack upgrade). Returns levels added.
  Run.levelUp = (run, p, n) => {
    const add = Math.max(0, Math.min(n, SB.MAX_LEVEL - SB.pieceLv(p)));
    p.level += add;
    return add;
  };
  Run.endFloorForging = (run) => {
    let n = 0;
    for (const p of run.pieces) if (p.forged) { n++; p.forged = 0; }
    return n;
  };
  Run.packStarting = function (run, shapes, size) {
    // backtracking packer: place shapes into a size x size square centered in the bag
    const off = Math.floor((BAG - size) / 2);
    run.bag.active = new Array(BAG * BAG).fill(false);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) run.bag.active[(y + off) * BAG + x + off] = true;
    // Fill cells in reading order so the free space ends up together at the bottom of the Bag.
    const occ = new Array(BAG * BAG).fill(false);
    const skipped = new Array(BAG * BAG).fill(false);
    const result = new Array(shapes.length);
    const used = new Array(shapes.length).fill(false);
    const totalCells = shapes.reduce((a, s) => a + SB.SHAPES[s].n, 0);
    let skips = size * size - totalCells;
    const variants = (sh) => {
      const out = [];
      const seen = new Set();
      for (let rot = 0; rot < 4; rot++) {
        const cells = Run.normCells(SB.SHAPES[sh].rots[rot]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
        const k = JSON.stringify(cells);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push({ rot, cells, ax: cells[0][0], ay: cells[0][1] });
      }
      return out;
    };
    let budget = 60000;
    let best = null;
    const evaluate = () => {
      const free = [];
      for (let y = off; y < off + size; y++) for (let x = off; x < off + size; x++) if (!occ[y * BAG + x]) free.push(y * BAG + x);
      const set = new Set(free);
      let bestComp = 0;
      const seen = new Set();
      for (const f of free) {
        if (seen.has(f)) continue;
        let n = 0;
        const st = [f];
        seen.add(f);
        while (st.length) {
          const c = st.pop(); n++;
          for (const d of [1, -1, BAG, -BAG]) { const q = c + d; if (set.has(q) && !seen.has(q) && Math.abs((q % BAG) - (c % BAG)) <= 1) { seen.add(q); st.push(q); } }
        }
        bestComp = Math.max(bestComp, n);
      }
      const low = free.reduce((a, f) => a + Math.floor(f / BAG), 0);
      const score = bestComp * 100 + low;
      if (!best || score > best.score) best = { score, result: result.map((r) => Object.assign({}, r)) };
      return bestComp === free.length;
    };
    const fill = (placed) => {
      if (placed === shapes.length) return evaluate();
      if (--budget < 0) return false;
      let target = -1;
      for (let y = off; y < off + size && target < 0; y++) for (let x = off; x < off + size; x++) {
        const i = y * BAG + x;
        if (!occ[i] && !skipped[i]) { target = i; break; }
      }
      if (target < 0) return false;
      const tx = target % BAG, ty = Math.floor(target / BAG);
      const tried = new Set();
      for (let k = 0; k < shapes.length; k++) {
        if (used[k] || tried.has(shapes[k])) continue;
        tried.add(shapes[k]);
        for (const v of variants(shapes[k])) {
          const ox = tx - v.ax, oy = ty - v.ay;
          let ok = true;
          for (const [cx, cy] of v.cells) {
            const xx = cx + ox, yy = cy + oy;
            if (xx < off || xx >= off + size || yy < off || yy >= off + size || occ[yy * BAG + xx] || skipped[yy * BAG + xx]) { ok = false; break; }
          }
          if (!ok) continue;
          for (const [cx, cy] of v.cells) occ[(cy + oy) * BAG + cx + ox] = true;
          used[k] = true;
          result[k] = { bx: ox, by: oy, rot: v.rot };
          if (fill(placed + 1)) return true;
          used[k] = false;
          for (const [cx, cy] of v.cells) occ[(cy + oy) * BAG + cx + ox] = false;
        }
      }
      if (skips > 0) {
        skips--; skipped[target] = true;
        if (fill(placed)) return true;
        skips++; skipped[target] = false;
      }
      return false;
    };
    fill(0);
    if (best) best.result.forEach((r, k) => { result[k] = r; });
    else {
      // fallback: greedy placement anywhere
      occ.fill(false);
      shapes.forEach((sh, k) => {
        for (let y = off; y < off + size && !result[k]; y++) for (let x = off; x < off + size && !result[k]; x++) for (const v of variants(sh)) {
          if (v.cells.every(([cx, cy]) => cx + x < off + size && cy + y < off + size && !occ[(cy + y) * BAG + cx + x])) {
            v.cells.forEach(([cx, cy]) => { occ[(cy + y) * BAG + cx + x] = true; });
            result[k] = { bx: x, by: y, rot: v.rot };
            break;
          }
        }
      });
    }
    return result;
  };
  // play style for the Rival: best pieces per second and quickest time between clears over this run's Stacks
  Run.recordStyle = (run, g) => {
    if (g.time < 20 || g.piecesPlaced < 10) return;
    const s = run.style || (run.style = { bestPPS: 0, bestClear: 0, lines: 0, clears: 0, stacks: 0 });
    s.bestPPS = Math.max(s.bestPPS, g.piecesPlaced / g.time);
    if (g.clears >= 3) { const ci = g.time / g.clears; s.bestClear = s.bestClear ? Math.min(s.bestClear, ci) : ci; }
    s.lines += g.lines; s.clears += g.clears; s.stacks++;
  };
  Run.newPiece = (run, shape, level, extra) => Object.assign({ uid: ++run.uidCounter, shape, level: level || 1, mat: null, special: null, behavior: null, banned: false, bx: null, by: null, rot: 0 }, extra || {});
  Run.removalFee = (run, p) => {
    let fee = Math.ceil(SB.SHAPES[p.shape].n / 2) + (p.level - 1) + ((p.special || p.behavior || p.mat) ? 2 : 0) + run.removals;
    if (run.stake >= 5) fee += 1;
    return fee;
  };
  Run.playableCount = (run) => run.pieces.filter((p) => !p.banned).length;
  Run.destroyPiece = (run, p) => { run.pieces = run.pieces.filter((q) => q !== p); };
  Run.pieceRates = (run) => {
    const pcs = run.pieces.filter((p) => !p.banned);
    const ws = pcs.map((p) => ({ p, w: SB.BASE_WEIGHT + Run.bagBonusWeight(run, p) + (Run.hasRelic(run, 'pied_piper') && (p.special || p.behavior) ? 5 : 0) }));
    if (Run.hasRelic(run, 'heirloom') && run.pieces.length) {
      const top = run.pieces.reduce((a, p) => (!a || SB.pieceLv(p) > SB.pieceLv(a) ? p : a), null);
      const o = ws.find((o) => o.p === top);
      if (o) o.w += 8;
    }
    const t = ws.reduce((a, o) => a + o.w, 0) || 1;
    const out = new Map();
    for (const o of ws) out.set(o.p, o.w / t);
    return out;
  };

  // ---------- new run ----------
  Run.newRun = function (starter, stake, seedStr) {
    const seed = SB.seedFromString(seedStr);
    SB.rng = SB.makeRng(seed);
    const run = {
      version: SB.RUN_VERSION, seedStr, starter, stake: stake || 1,
      ante: 1, stackIdx: 0, stackCount: 0, money: 4,
      relics: [], consumables: [], pieces: [], uidCounter: 0,
      prevBest: { ante: SB.meta.data.bestAnte || 0, score: SB.meta.data.bestScore || 0 },
      bag: { active: [], bonus: {} },
      board: { w: SB.BOARD_W, h: SB.BOARD_H, cells: {}, ash: {}, ember: {}, wells: [], overflow: false, shape: 'classic' },
      levels: { single: 1, double: 1, triple: 1, quad: 1, twist: 1, allclear: 1, penta: 1, combo: 1 },
      clearCounts: {}, blueprints: [], removals: 0, compost: 0, slotMod: 0, overload: 0,
      flags: {}, stats: { lines: 0, quads: 0, pushes: 0, stacksWon: 0, bestStack: 0, totalScore: 0 },
      nextShop: {}, carry: 0, phase: 'map', shop: null, endless: false, history: [],
    };
    let shapes = SB.CORE_SHAPES.slice();
    let level = 2, size = 6;
    let extras = {};
    switch (starter) {
      case 'miner': {
        run.money = 6;
        for (let yb = 0; yb < 3; yb++) run.board.cells[SB.randInt(0, run.board.w - 1) + ',' + yb] = 'gold';
        break;
      }
      case 'glassblower': level = 3; extras = { mat: 'glass' }; break;
      case 'purist': shapes = ['I', 'I', 'O', 'O', 'T', 'T']; level = 3; run.levels.quad = 3; break;
      case 'alchemist': break;
      case 'giant': run.board.w = SB.BOARD_W + 2; shapes = ['I', 'O', 'T', 'L', 'J', 'P', 'T5', 'U', 'I5']; size = 7; break;
      case 'gambler': break;
    }
    const placements = Run.packStarting(run, shapes, size);
    shapes.forEach((s, i) => {
      const lv = SB.SHAPES[s].group === 'Pentomino' ? 1 : level;
      const p = Run.newPiece(run, s, lv, extras);
      if (starter === 'alchemist' && (s === 'S' || s === 'Z')) p.behavior = 'sand';
      if (placements[i]) Object.assign(p, placements[i]);
      run.pieces.push(p);
    });
    if (starter === 'alchemist') run.consumables.push({ kind: 'glyph', id: SB.pick(['gild', 'forge', 'brush', 'facet']) });
    Run.startAnte(run);
    return run;
  };

  // ---------- antes & stacks ----------
  Run.bossPool = (run) => {
    const finale = run.ante % 8 === 0;
    return Object.keys(SB.BOSSES).filter((k) => {
      const b = SB.BOSSES[k];
      return finale ? b.finale : !b.finale && b.minAnte <= run.ante;
    });
  };
  // Hellscape's second Warden: any other this Floor allows (on a finale Floor, a regular one from up to here)
  Run.secondBoss = (run, first) => {
    let pool = Run.bossPool(run).filter((b) => b !== first);
    if (!pool.length || SB.BOSSES[first].finale) pool = Object.keys(SB.BOSSES).filter((k) => !SB.BOSSES[k].finale && SB.BOSSES[k].minAnte <= run.ante && k !== first);
    return pool.length ? SB.pick(pool) : null;
  };
  Run.rollBoss = (run, bosses) => {
    const recent = run.history.slice(-3);
    const fresh = bosses.filter((b) => !recent.includes(b));
    return SB.pick(fresh.length ? fresh : bosses);
  };
  Run.startAnte = function (run) {
    const ante = run.ante;
    const bosses = Run.bossPool(run);
    const boss = Run.rollBoss(run, bosses);
    run.history.push(boss);
    const maxTier = ante >= 5 ? 3 : ante >= 3 ? 2 : 1;
    const mods = Object.keys(SB.STAGE_MODS).filter((k) => SB.STAGE_MODS[k].tier <= maxTier);
    run.anteInfo = {
      boss,
      // Hellscape: a second Warden rule on top of the first
      boss2: run.stake >= 10 ? Run.secondBoss(run, boss) : null,
      mods: SB.shuffle(mods).slice(0, 2),
      tags: [SB.pickKey(SB.TAGS), SB.pickKey(SB.TAGS)],
      rerolled: [0, 0],
      // Endless only: the Warden Stack may bring a Rival
      rival: ante > 8 && SB.chance(SB.RIVAL.chance),
    };
    // Omega: destroy a random other relic each Ante (from Ante 2 on)
    if (ante > 1 && Run.hasRelic(run, 'omega')) {
      const others = run.relics.filter((r) => r.id !== 'omega');
      if (others.length) { const v = SB.pick(others); run.relics = run.relics.filter((r) => r !== v); run.flags.lastOmega = SB.RELICS[v.id].name; }
    }
    if (run.starter === 'gambler') {
      if (run.relics.length < Run.relicSlots(run)) {
        const pool = Object.keys(SB.RELICS).filter((id) => Run.relicOpen(id, run) && !TOP(id) && !Run.hasRelic(run, id));
        const id = SB.weighted(pool, (k) => SB.offerWeight(SB.RELICS, k));
        run.relics.push({ id });
        SB.meta.discover(id);
        run.flags.gamblerGift = id;
      }
      const shapes = ['classic', 'wide', 'narrow', 'tall'];
      Run.setBoardShape(run, SB.pick(shapes));
    }
  };
  Run.setBoardShape = function (run, shape) {
    run.board.shape = shape;
    const base = run.starter === 'giant' ? SB.BOARD_W + 2 : SB.BOARD_W;
    run.board.w = shape === 'wide' ? SB.BOARD_W + 2 : shape === 'narrow' ? SB.BOARD_W - 2 : base;
    run.board.h = shape === 'tall' ? SB.BOARD_H + 4 : SB.BOARD_H;
    for (const k of Object.keys(run.board.cells)) { const x = +k.split(',')[0]; if (x >= run.board.w) delete run.board.cells[k]; }
    run.board.wells = run.board.wells.filter((x) => x < run.board.w);
  };
  Run.anteTarget = (ante) => {
    if (ante <= 8) return SB.ANTE_TARGETS[ante];
    const E = SB.ENDLESS_GROWTH;
    let t = SB.ANTE_TARGETS[8];
    for (let a = 9; a <= ante; a++) t *= E.start + E.step * (a - 9);
    return Math.round(t / 1000) * 1000;
  };
  // seconds on a Stack's clock (5:00 unless a Warden, modifier, relic or Schematic says otherwise)
  Run.stackClock = function (run, s) {
    let t = SB.STACK_CLOCK;
    if (s.boss === 'hourglass' || s.boss2 === 'hourglass') t = 120;
    if (s.mod === 'extratime') t += 90;
    if (s.mod === 'shortfuse') t = 180;
    if (s.mod === 'beattheclock') t = 120;
    if (s.mod === 'suddendeath') t = 90;
    return t + Run.stat(run, 'clock');
  };
  Run.fmtClock = (sec) => { const t = Math.max(0, Math.ceil(sec)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  // the Bag holds at most this many pieces of any one shape
  Run.SHAPE_CAP = 2;
  Run.shapeCount = (run, shape) => run.pieces.filter((p) => p.shape === shape).length;
  Run.shapeFull = (run, shape) => Run.shapeCount(run, shape) >= Run.SHAPE_CAP;
  Run.stackInfo = function (run, idx) {
    const kind = SB.STACK_KINDS[idx];
    const isBoss = idx === 2;
    const mod = isBoss ? null : run.anteInfo.mods[idx];
    let target = Run.anteTarget(run.ante) * kind.mult;
    if (run.stake >= 3) target *= 1.15;
    if (mod === 'inflation') target *= 1.5;
    if (mod === 'jackpot') target *= 2;
    if (mod === 'rush') target *= 0.8;
    if (mod === 'suddendeath') target *= 0.6;
    if (run.flags.safeNext && idx === run.stackIdx) target *= 0.75;
    target = Math.round(target / 10) * 10;
    let reward = kind.reward;
    if (run.stake >= 2 && idx === 0) reward = 0;
    return {
      idx, kind: kind.key, name: kind.name, target, boss: isBoss ? run.anteInfo.boss : null, boss2: isBoss ? run.anteInfo.boss2 || null : null, mod, rival: isBoss && !!run.anteInfo.rival,
      reward, par: kind.par, tag: isBoss ? null : run.anteInfo.tags[idx], ante: run.ante,
      clock: Run.stackClock(run, { boss: isBoss ? run.anteInfo.boss : null, boss2: isBoss ? run.anteInfo.boss2 : null, mod }),
      carry: idx === run.stackIdx ? run.carry || 0 : 0,
    };
  };
  // Windsock: the modifiers you may pick for a Stack (what this Floor allows, minus Jackpot)
  Run.modChoices = function (run) {
    const maxTier = run.ante >= 5 ? 3 : run.ante >= 3 ? 2 : 1;
    return Object.keys(SB.STAGE_MODS).filter((k) => SB.STAGE_MODS[k].tier <= maxTier && !SB.STAGE_MODS[k].rare);
  };
  Run.setMod = function (run, idx, id) {
    if (!Run.hasRelic(run, 'windsock') || idx > 1 || idx < run.stackIdx) return false;
    if (id && !Run.modChoices(run).includes(id)) return false;
    run.anteInfo.mods[idx] = id || null;
    return true;
  };
  // Restocking a Stack modifier needs the Scout's Report Schematic; swapping the Warden needs the Bribe relic
  // or the Shift Change Schematic (each once per Floor, and both can be used on the same Floor)
  Run.canRerollMod = (run) => Run.hasBlueprint(run, 'scout');
  Run.rerollMod = function (run, idx) {
    if (!Run.canRerollMod(run) || run.money < 2 || idx > 1 || idx < run.stackIdx) return false;
    run.money -= 2;
    const maxTier = run.ante >= 5 ? 3 : run.ante >= 3 ? 2 : 1;
    const mods = Object.keys(SB.STAGE_MODS).filter((k) => SB.STAGE_MODS[k].tier <= maxTier && k !== run.anteInfo.mods[idx]);
    run.anteInfo.mods[idx] = SB.pick(mods);
    run.anteInfo.rerolled[idx]++;
    return true;
  };
  Run.BRIBE_PRICE = 5;
  Run.SHIFT_PRICE = 10;
  const newBoss = function (run) {
    const cur = run.anteInfo.boss;
    const next = Run.rollBoss(run, Run.bossPool(run).filter((b) => b !== cur));
    run.anteInfo.boss = next;
    if (run.history[run.history.length - 1] === cur) run.history[run.history.length - 1] = next;
    // Hellscape swaps the pair
    if (run.anteInfo.boss2) run.anteInfo.boss2 = Run.secondBoss(run, next);
    return next;
  };
  Run.canSwapBoss = (run) => Run.hasRelic(run, 'bribe') && !run.anteInfo.bossSwapped && Run.bossPool(run).length > 1;
  Run.swapBoss = function (run) {
    if (!Run.canSwapBoss(run) || run.money < Run.BRIBE_PRICE) return false;
    run.money -= Run.BRIBE_PRICE;
    run.anteInfo.bossSwapped = true;
    return newBoss(run);
  };
  Run.canShiftBoss = (run) => Run.hasBlueprint(run, 'shift_change') && !run.anteInfo.bossShifted && Run.bossPool(run).length > 1;
  Run.shiftBoss = function (run) {
    if (!Run.canShiftBoss(run) || run.money < Run.SHIFT_PRICE) return false;
    run.money -= Run.SHIFT_PRICE;
    run.anteInfo.bossShifted = true;
    return newBoss(run);
  };
  Run.skipStack = function (run) {
    if (run.stackIdx > 1) return null;
    const tag = run.anteInfo.tags[run.stackIdx];
    let msg = Run.applyTag(run, tag);
    if (Run.hasRelic(run, 'lean_season')) {
      const pay = Run.stackInfo(run, run.stackIdx).reward + 2;
      run.money += pay;
      msg = (msg ? msg + '. ' : '') + `Lean Season: +$${pay}`;
    }
    run.flags.skips = (run.flags.skips || []).concat(run.ante * 3 + run.stackIdx);
    run.stackIdx++;
    run.carry = 0;
    return msg;
  };
  Run.applyTag = function (run, tag) {
    const t = SB.TAGS[tag];
    switch (tag) {
      case 'coupon': run.nextShop.coupon = true; break;
      case 'double': run.flags.doubleNext = true; break;
      case 'rare': run.nextShop.rare = true; break;
      case 'pack': run.nextShop.pack = (run.nextShop.pack || 0) + 1; break;
      case 'board': run.nextShop.board = (run.nextShop.board || 0) + 1; break;
      case 'forge': { const p = SB.pick(run.pieces.filter((q) => SB.pieceLv(q) < SB.MAX_LEVEL)); if (p) { Run.levelUp(run, p, 1); return `${t.icon} ${t.name}: ${SB.SHAPES[p.shape].name} is now Level ${SB.pieceLv(p)}`; } break; }
      case 'pattern': { const a = SB.shuffle(SB.CLEAR_ORDER).slice(0, 2); a.forEach((k) => Run.levelClear(run, k, 1)); return `${t.icon} ${t.name}: ${a.map((k) => SB.CLEARS[k].name).join(' and ')} leveled up`; }
      case 'glyph': for (let i = 0; i < 2; i++) Run.giveRandomGlyph(run); break;
      case 'safe': run.flags.safeNext = true; break;
      case 'investment': run.flags.investment = (run.flags.investment || 0) + 1; break;
      case 'economy': run.money += Math.min(15, Math.max(0, run.money)); break;
    }
    return `${t.icon} ${t.name}: ${t.desc}`;
  };
  Run.giveRandomGlyph = function (run) {
    if (run.consumables.length >= Run.consSlots(run)) return false;
    run.consumables.push({ kind: 'glyph', id: SB.pickKey(SB.GLYPHS) });
    return true;
  };

  // ---------- payout ----------
  Run.interest = function (run) {
    const E = SB.ECON;
    const per = Run.stat(run, 'vault') ? E.vaultPer : E.savePer;
    let cap = E.saveCap + Run.stat(run, 'interestCap');
    if (run.stake >= 9) cap = 3;
    let v = Math.floor(Math.max(0, run.money) / per);
    if (!Run.stat(run, 'noInterestCap')) v = Math.min(v, cap);
    if (Run.transformed(run, 'Gold')) v *= 2;
    return v;
  };
  Run.payout = function (run, stack, res) {
    const lines = [];
    const net = res.outcome === 'net';
    lines.push({ label: `${stack.name} reward`, v: stack.reward, icon: stack.boss ? SB.BOSSES[stack.boss].icon : SB.uiIco('tower') });
    const mod = stack.mod ? SB.STAGE_MODS[stack.mod] : null;
    if (mod && mod.money) lines.push({ label: `${mod.name}`, v: mod.money });
    if (!net) {
      const tb = SB.clamp(Math.floor((stack.par - res.targetTime) / SB.ECON.timeStep), 0, SB.ECON.timeCap);
      if (tb > 0) lines.push({ label: `Time bonus (${Math.round(res.targetTime)}s, par ${stack.par}s)`, v: tb, icon: SB.uiIco('time') });
      for (let i = 0; i < res.pushesDone; i++) lines.push({ label: `Push On ${SB.pushTier(i).name}`, v: SB.pushTier(i).money, icon: SB.uiIco('fire') });
    } else lines.push({ label: 'Safety Net: push bonuses lost', v: 0, icon: SB.RELICS.safety_net.icon });
    let sub = lines.reduce((a, l) => a + l.v, 0);
    let xm = 1;
    if (mod && mod.xmoney) xm *= mod.xmoney;
    if (run.flags.doubleNext) { xm *= 2; run.flags.doubleNext = false; }
    if (stack.boss && Run.hasRelic(run, 'the_crown')) xm *= 2;
    if (xm > 1 && sub > 0) { lines.push({ label: `Multiplier x${xm}`, v: sub * (xm - 1), icon: SB.uiIco('star') }); sub *= xm; }
    if (stack.boss && run.flags.investment) { lines.push({ label: 'Bounty Token', v: 15 * run.flags.investment, icon: SB.TAGS.investment.icon }); run.flags.investment = 0; }
    // relic end-of-stack money
    const api = { giveRandomGlyph: () => Run.giveRandomGlyph(run) };
    Run.forEachRelic(run, (d) => { if (d.onStackEnd) { const v = d.onStackEnd(run, res, api); if (v) lines.push({ label: d.name, v, icon: d.icon }); } });
    if (res.pactLeft) lines.push({ label: 'Pact left on board', v: -5 * res.pactLeft, icon: SB.SPECIALS.pact.icon });
    const interest = Run.interest(run);
    if (interest) lines.push({ label: `Savings ($1 per $${Run.stat(run, 'vault') ? SB.ECON.vaultPer : SB.ECON.savePer} held)`, v: interest, icon: SB.uiIco('savings') });
    const total = lines.reduce((a, l) => a + l.v, 0);
    return { lines, total };
  };
  Run.completeStack = function (run, stack, res) {
    const pay = Run.payout(run, stack, res);
    run.money += Run.hasRelic(run, 'king_midas') && pay.total > 0 ? Math.min(pay.total, Math.max(0, 30 - run.money)) : pay.total;
    run.stats.stacksWon++;
    run.stats.bestStack = Math.max(run.stats.bestStack, res.score);
    run.stats.totalScore += res.score;
    run.stackCount++;
    run.flags.safeNext = false;
    // Time Capsule fills while you Bank without pushing and empties when you push
    const cap = run.relics.find((r) => r.id === 'time_capsule');
    if (cap) cap.n = res.pushAttempts ? 0 : (cap.n || 0) + 1;
    // Momentum carry
    const excess = Math.max(0, res.score - stack.target);
    run.carry = Run.hasBlueprint(run, 'inertia') ? Math.floor(excess * 0.5) : Run.hasBlueprint(run, 'momentum') ? Math.floor(excess * 0.25) : 0;
    const extras = [];
    // Endless pays a Prize Counter Ticket every 30 Stacks cleared
    if (run.endless && SB.Cosmetic) {
      run.endlessStacks = (run.endlessStacks || 0) + 1;
      if (run.endlessStacks % SB.TICKETS.endlessEvery === 0) extras.push(`${SB.uiIco('ticket')} ${run.endlessStacks} Endless Stacks cleared: +1 Ticket (you have ${SB.Cosmetic.award(1)})`);
    }
    // the Warden closes the Floor, so forged levels wear off before this Stack's rewards land
    if (stack.idx === 2 && Run.endFloorForging(run)) extras.push(`${SB.uiIco('hammer')} Temporary levels wore off with Floor ${run.ante}`);
    if (res.pushesDone >= 3) extras.push(Run.applyTag(run, SB.pickKey(SB.TAGS)));
    if (stack.boss && res.pushesDone >= SB.EGG_HATCH && Run.hasRelic(run, 'egg')) extras.push(Run.hatchEgg(run));
    if (stack.mod && SB.STAGE_MODS[stack.mod].tag) extras.push(Run.applyTag(run, SB.pickKey(SB.TAGS)));
    if (stack.mod && SB.STAGE_MODS[stack.mod].rare) { const r = Run.grantRelic(run, 'Rare'); if (r) extras.push(`Jackpot: gained ${SB.RELICS[r].name}`); }
    if (stack.boss) {
      if (Run.hasRelic(run, 'the_crown')) { const r = Run.grantRelic(run, 'Rare'); if (r) extras.push(`The Crown: gained ${SB.RELICS[r].name}`); }
      if (SB.chance(0.12)) { const r = Run.grantRelic(run, 'Legendary'); if (r) extras.push(`Warden drop: the Legendary ${SB.RELICS[r].name}!`); }
    }
    // advance
    let victory = false;
    if (stack.idx === 2) {
      if (run.ante === 8 && !run.endless) victory = true;
      run.ante++;
      run.stackIdx = 0;
      SB.meta.data.bestAnte = Math.max(SB.meta.data.bestAnte, run.ante);
    } else run.stackIdx++;
    Run.genShop(run);
    run.phase = 'shop';
    return { pay, extras, victory };
  };
  // The Egg hatches: it leaves its slot, adds one more, brings two Legendary relics, and lets you turn a piece to Yolk
  Run.hatchEgg = function (run) {
    run.relics = run.relics.filter((r) => r.id !== 'egg');
    run.slotMod = (run.slotMod || 0) + 1;
    const got = [];
    for (let i = 0; i < 2; i++) { const id = Run.grantRelic(run, 'Legendary', ['egg']); if (id) got.push(SB.RELICS[id].name); }
    run.flags.eggChoice = true;
    SB.meta.data.eggsHatched = (SB.meta.data.eggsHatched || 0) + 1;
    return `${SB.RELICS.egg.icon} The Egg hatched! +1 curio slot${got.length ? ', and ' + got.join(' and ') + ' joined you' : ''}. In the Workshop, choose a piece to turn to Yolk.`;
  };
  Run.grantRelic = function (run, rarity, exclude) {
    if (run.relics.length >= Run.relicSlots(run)) return null;
    const pool = Object.keys(SB.RELICS).filter((id) => Run.relicOpen(id, run) && SB.RELICS[id].rarity === rarity && !Run.hasRelic(run, id) && !(exclude || []).includes(id));
    if (!pool.length) return null;
    const id = SB.weighted(pool, (k) => SB.offerWeight(SB.RELICS, k));
    run.relics.push({ id });
    SB.meta.discover(id);
    return id;
  };

  // ---------- shop ----------
  Run.priceMult = (run) => (Run.hasBlueprint(run, 'wholesale') ? 0.5 : Run.hasBlueprint(run, 'bargain_bin') ? 0.75 : 1);
  Run.price = (run, base) => Math.max(1, Math.ceil(base * Run.priceMult(run)));
  Run.rollRelicId = function (run, exclude, forceRarity) {
    let rarity = forceRarity;
    if (!rarity) {
      const r = SB.rand();
      const rareP = run.ante >= 3 ? 0.09 : 0.045;
      const uncP = run.ante >= 2 ? 0.33 : 0.25;
      rarity = r < rareP ? 'Rare' : r < rareP + uncP ? 'Uncommon' : 'Common';
      // Endless: now and then a Mythic turns up instead
      if (run.endless && SB.chance(SB.MYTHIC_CHANCE)) rarity = 'Mythic';
    }
    let pool = Object.keys(SB.RELICS).filter((id) => Run.relicOpen(id, run) && SB.RELICS[id].rarity === rarity && !Run.hasRelic(run, id) && !exclude.includes(id));
    if (!pool.length) pool = Object.keys(SB.RELICS).filter((id) => Run.relicOpen(id, run) && !TOP(id) && !Run.hasRelic(run, id) && !exclude.includes(id));
    return pool.length ? SB.weighted(pool, (id) => SB.offerWeight(SB.RELICS, id)) : undefined;
  };
  Run.rollConsumable = function () {
    const r = SB.rand();
    if (r < 0.42) return { kind: 'pattern', id: SB.pick(Object.keys(SB.PATTERNS)) };
    if (r < 0.9) return { kind: 'glyph', id: SB.pickKey(SB.GLYPHS) };
    return { kind: 'rift', id: SB.pickKey(SB.RIFTS) };
  };
  Run.consPrice = (c) => (c.kind === 'rift' ? 5 : 3);
  // price after schematics and the visit's Clearance event
  Run.shopPrice = (run, shop, base) => {
    const p = Run.price(run, base);
    return shop && shop.event === 'sale' ? Math.max(1, Math.round(p * 0.75)) : p;
  };
  Run.packWeights = (run) => {
    const w = { piece: 10, board: 10, jumbo_piece: run.ante >= 2 ? 4 : 1, jumbo_board: run.ante >= 2 ? 4 : 1, pattern: 6, relic: run.ante >= 2 ? 3 : 1 };
    if (SB.Ach && SB.Ach.open(SB.PACKS.trophy) && Run.trophyPool(run).length) w.trophy = run.ante >= 2 ? 2 : 1;
    return w;
  };
  // curios that achievements unlock, open and not owned: what a Trophy Pack draws from
  Run.trophyPool = (run) => Object.keys(SB.RELICS).filter((id) => SB.RELICS[id].ach && Run.relicOpen(id, run) && !Run.hasRelic(run, id));
  Run.genShop = function (run) {
    const ns = run.nextShop || {};
    const shop = { relics: [], cons: [], packs: [], patch: null, blueprint: null, rerollCost: 5, freeRerollUsed: false, rolls: 0, event: null };
    if (SB.chance(0.4)) shop.event = SB.pick(Object.keys(SB.SHOP_EVENTS));
    const ev = shop.event;
    shop.nRelics = Math.max(1, 2 + (run.stake >= 6 ? -1 : 0) + (SB.chance(0.25) ? 1 : 0) + (ev === 'overstock' ? 1 : 0)) + (Run.hasBlueprint(run, 'trophy_shelf') ? 1 : 0);
    shop.nCons = 2 + (SB.chance(0.25) ? 1 : 0) + (ev === 'overstock' ? 1 : 0);
    Run.stockShop(run, shop, ns.rare ? 'Rare' : ev === 'shipment' ? (SB.chance(0.4) ? 'Rare' : 'Uncommon') : null);
    // packs: no two of a kind; the first slot is always a piece or board pack, the rest come from the whole pool
    const w = Run.packWeights(run);
    const nPacks = 2 + (SB.chance(0.3) ? 1 : 0) + (ev === 'surplus' ? 1 : 0);
    const count = {};
    for (let i = 0; i < nPacks; i++) {
      const pool = Object.keys(w).filter((k) => (i > 0 || ['piece', 'board', 'jumbo_piece', 'jumbo_board'].includes(k)) && !count[k]);
      const type = SB.weighted(pool, (k) => w[k]);
      count[type] = (count[type] || 0) + 1;
      shop.packs.push({ type, price: Run.shopPrice(run, shop, SB.PACKS[type].price) });
    }
    for (let i = 0; i < (ns.pack || 0); i++) shop.packs.push({ type: 'piece', price: 0, free: true });
    for (let i = 0; i < (ns.board || 0); i++) shop.packs.push({ type: 'board', price: 0, free: true });
    if (Run.transformed(run, 'Board')) shop.packs.push({ type: 'board', price: 0, free: true });
    if (SB.chance(0.75)) {
      const pt = SB.pick(SB.PATCHES.slice(0, 7));
      const patchCells = pt.cells.map((c) => c.slice());
      const bonus = SB.chance(0.3) ? { i: SB.randInt(0, patchCells.length - 1), type: SB.pickKey(SB.BAG_BONUS) } : null;
      shop.patch = { name: pt.name, cells: patchCells, bonus, price: Math.max(1, Run.shopPrice(run, shop, pt.price + (bonus ? 1 : 0)) - (Run.hasBlueprint(run, 'tailors_shop') ? 2 : 0)) };
    }
    const bps = Object.keys(SB.BLUEPRINTS).filter((k) => (!SB.Ach || SB.Ach.open(SB.BLUEPRINTS[k])) && !run.blueprints.includes(k) && (!SB.BLUEPRINTS[k].req || run.blueprints.includes(SB.BLUEPRINTS[k].req)));
    if (bps.length && SB.chance(0.75)) { const id = SB.pick(bps), base = SB.BLUEPRINTS[id].price || 10; shop.blueprint = { id, price: ev === 'sale' ? Math.round(base * 0.8) : base }; }
    if (ns.coupon && shop.relics[0]) shop.relics[0].price = 0;
    // one random item is sometimes on sale at half price
    if (SB.chance(0.35)) {
      const items = shop.relics.concat(shop.cons, shop.packs, shop.patch ? [shop.patch] : [], shop.blueprint ? [shop.blueprint] : []).filter((it) => it.price > 1 && !it.free);
      if (items.length) Run.putOnSale(SB.pick(items));
    }
    run.nextShop = {};
    run.shop = shop;
    return shop;
  };
  Run.putOnSale = (it) => { it.full = it.price; it.price = Math.max(1, Math.floor(it.price / 2)); it.sale = true; };
  Run.stockShop = function (run, shop, forceRarity) {
    shop.relics = [];
    const n = shop.nRelics || Math.max(1, 2 + (run.stake >= 6 ? -1 : 0));
    const ex = [];
    for (let i = 0; i < n; i++) {
      const id = Run.rollRelicId(run, ex, forceRarity && i === 0 ? forceRarity : null);
      if (!id) continue;
      ex.push(id);
      shop.relics.push({ id, price: Run.shopPrice(run, shop, SB.RELIC_PRICE[SB.RELICS[id].rarity]) });
      SB.meta.discover(id);
    }
    shop.cons = [];
    const nc = shop.nCons || 2;
    for (let i = 0; i < nc; i++) {
      let c = Run.rollConsumable();
      for (let t = 0; t < 30 && shop.cons.some((o) => o.kind === c.kind && o.id === c.id); t++) c = Run.rollConsumable();
      c.price = Run.shopPrice(run, shop, Run.consPrice(c));
      shop.cons.push(c);
    }
  };
  Run.rerollCost = (run) => {
    const s = run.shop;
    if (Run.stat(run, 'freeReroll') && !s.freeRerollUsed) return 0;
    return Math.max(0, s.rerollCost - Run.stat(run, 'rerollDiscount'));
  };
  Run.reroll = function (run) {
    const cost = Run.rerollCost(run);
    if (run.money < cost) return false;
    Run.spend(run, cost);
    if (cost === 0 && Run.stat(run, 'freeReroll')) run.shop.freeRerollUsed = true;
    else run.shop.rerollCost++;
    Run.stockShop(run, run.shop, null);
    if (SB.chance(0.2)) { const items = run.shop.relics.concat(run.shop.cons).filter((it) => it.price > 1); if (items.length) Run.putOnSale(SB.pick(items)); }
    return true;
  };
  Run.sellValue = (run, r) => {
    const base = SB.RELIC_PRICE[SB.RELICS[r.id].rarity];
    return Run.stat(run, 'sellFull') ? base : Math.floor(base / 2);
  };
  Run.sellRelic = function (run, i) {
    const r = run.relics[i];
    if (!r) return;
    run.money += Run.sellValue(run, r);
    run.relics.splice(i, 1);
    run.stats.sold = (run.stats.sold || 0) + 1;
  };
  // Chameleon: a new borrowed scoring effect every Stack (never a Legendary)
  Run.chameleon = function (run) {
    const me = run.relics.find((r) => r.id === 'chameleon');
    if (!me) return;
    const pool = Object.keys(SB.RELICS).filter((id) => { const d = SB.RELICS[id]; return d.score && !TOP(id) && id !== 'chameleon' && !Run.hasRelic(run, id) && Run.relicOpen(id, run); });
    me.as = pool.length ? SB.pick(pool.filter((id) => id !== me.as).length ? pool.filter((id) => id !== me.as) : pool) : null;
  };
  // leaving the Workshop: Receipt remembers what this visit cost
  Run.leaveShop = function (run) {
    run.lastSpent = (run.shop && run.shop.spent) || 0;
    run.phase = 'map';
  };
  // money paid out in the Workshop (Big Spender counts it per visit)
  Run.spend = function (run, v) {
    run.money -= v;
    if (run.shop) run.shop.spent = (run.shop.spent || 0) + v;
  };
  Run.buyRelic = function (run, i) {
    const it = run.shop.relics[i];
    if (!it || it.sold) return 'gone';
    if (run.money < it.price) return 'money';
    if (run.relics.length >= Run.relicSlots(run)) return 'slots';
    Run.spend(run, it.price);
    run.relics.push({ id: it.id });
    it.sold = true;
    return 'ok';
  };
  Run.buyCons = function (run, i) {
    const it = run.shop.cons[i];
    if (!it || it.sold) return 'gone';
    if (run.money < it.price) return 'money';
    if (run.consumables.length >= Run.consSlots(run)) return 'slots';
    Run.spend(run, it.price);
    run.consumables.push({ kind: it.kind, id: it.id });
    it.sold = true;
    return 'ok';
  };
  Run.buyBlueprint = function (run) {
    const it = run.shop.blueprint;
    if (!it || it.sold) return 'gone';
    if (run.money < it.price) return 'money';
    Run.spend(run, it.price);
    run.blueprints.push(it.id);
    it.sold = true;
    return 'ok';
  };
  // $5 for the first forge in a Workshop visit, doubling with each one after; a new visit starts over
  Run.forgePrice = (run) => Math.max(1, Run.price(run, 5 * Math.pow(2, (run.shop && run.shop.forges) || 0)) - (run.shop && run.shop.event === 'tinker' ? 2 : 0));

  // ---------- packs ----------
  Run.rollSpecialPiece = function (run) {
    let shapes = Object.keys(SB.SHAPES).filter((k) => !Run.shapeFull(run, k));
    if (!shapes.length) shapes = Object.keys(SB.SHAPES);
    const rw = { Starter: 6, Common: 10, Uncommon: 7, Rare: 3, Legendary: run.ante >= 3 ? 1 : 0 };
    const shape = SB.weighted(shapes, (k) => rw[SB.SHAPES[k].rarity] || 0);
    const p = { shape, level: 1, mat: null, special: null, behavior: null };
    const r = SB.rand();
    if (r < 0.55) p.special = SB.pickKey(SB.SPECIALS);
    else if (r < 0.75) p.behavior = SB.pickKey(SB.BEHAVIORS);
    else if (r < 0.92) p.mat = SB.pickMat();
    if (SB.chance(0.15)) p.mat = p.mat || SB.pickMat();
    return p;
  };
  Run.genPiecePack = function (run, n) {
    const opts = [];
    for (let i = 0; i < (n || 3); i++) {
      const upg = run.pieces.filter((p) => p.level < SB.MAX_LEVEL);
      if (SB.chance(0.1) && upg.length) {
        const p = SB.pick(upg);
        if (!opts.some((o) => o.type === 'upgrade' && o.uid === p.uid)) { opts.push({ type: 'upgrade', uid: p.uid }); continue; }
      }
      opts.push(Object.assign({ type: 'piece' }, Run.rollSpecialPiece(run)));
    }
    return opts;
  };
  Run.genBoardPack = function (run, base) {
    const n = (base || 3) + Run.stat(run, 'boardChoices');
    const opts = [];
    for (let i = 0; i < n; i++) {
      const r = SB.rand();
      if (r < 0.12) {
        const ups = ['overflow', 'wide', 'narrow', 'tall'].filter((u) => (u === 'overflow' ? !run.board.overflow : run.board.shape !== u));
        if (ups.length) { opts.push({ type: 'upgrade', id: SB.pick(ups) }); continue; }
      }
      if (r < 0.27 && run.board.wells.length < 3) { opts.push({ type: 'upgrade', id: 'well' }); continue; }
      opts.push({ type: 'cell', id: SB.rollCell() });
    }
    return opts;
  };
  Run.genPatternPack = function (run) {
    return SB.shuffle(Object.keys(SB.PATTERNS)).slice(0, 3).map((id) => ({ type: 'pattern', id }));
  };
  Run.genRelicPack = function (run) {
    const ex = [];
    const opts = [];
    for (let i = 0; i < 3; i++) {
      const r = SB.rand();
      const id = Run.rollRelicId(run, ex, i === 0 ? (r < 0.22 ? 'Rare' : 'Uncommon') : r < 0.08 ? 'Rare' : r < 0.5 ? 'Uncommon' : null);
      if (!id) continue;
      ex.push(id);
      SB.meta.discover(id);
      opts.push({ type: 'relic', id });
    }
    return opts;
  };
  // a Trophy Pack: up to 3 achievement curios, topped up from the Rare pool when fewer are left
  Run.genTrophyPack = function (run) {
    const ids = SB.shuffle(Run.trophyPool(run)).slice(0, 3);
    while (ids.length < 3) { const id = Run.rollRelicId(run, ids, 'Rare'); if (!id) break; ids.push(id); }
    ids.forEach((id) => SB.meta.discover(id));
    return ids.map((id) => ({ type: 'relic', id }));
  };
  Run.applyBoardUpgrade = function (run, id) {
    switch (id) {
      case 'overflow': run.board.overflow = true; break;
      case 'wide': case 'narrow': case 'tall': Run.setBoardShape(run, id); break;
    }
  };

  // ---------- consumables ----------
  Run.consInfo = function (c) {
    if (c.kind === 'pattern') {
      const p = SB.PATTERNS[c.id];
      const ct = p.clear === 'combo' ? null : SB.CLEARS[p.clear];
      return { name: p.name, icon: p.icon, art: p.art, family: 'Pattern', desc: ct ? `Level up ${ct.name}: +${ct.pc} Mass, +${ct.pm} Charge` : 'Level up Combo: +1 Charge per combo step', target: null };
    }
    if (c.kind === 'glyph') { const g = SB.GLYPHS[c.id]; return { name: g.name, icon: g.icon, art: g.art, family: 'Glyph', desc: g.desc, target: g.target, live: g.live }; }
    if (c.kind === 'secret') { const d = SB.SECRET_ITEMS[c.id]; return { name: d.name, icon: d.icon, art: d.art, family: 'Secret', desc: d.desc, target: null, secret: true }; }
    const r = SB.RIFTS[c.id];
    return { name: r.name, icon: r.icon, art: r.art, family: 'Rift', desc: r.desc, target: null };
  };
  // Apply a consumable outside of play. Returns message string, or {need:'piece'|'cell'|'patch'} if a target is needed.
  Run.useConsumable = function (run, idx, target) {
    const c = run.consumables[idx];
    if (!c) return null;
    const info = Run.consInfo(c);
    if (info.secret) return null;
    if (info.live) return { error: 'Use this during a Stack (keys 1-4)' };
    if (info.target && target === undefined) return { need: info.target };
    let msg = '';
    if (c.kind === 'pattern') {
      const p = SB.PATTERNS[c.id];
      Run.levelClear(run, p.clear, 1);
      msg = `${p.name}: ${p.clear === 'combo' ? 'Combo' : SB.CLEARS[p.clear].name} is now Level ${run.levels[p.clear]}`;
    } else if (c.kind === 'glyph') {
      const g = SB.GLYPHS[c.id];
      const piece = target && target.uid !== undefined ? run.pieces.find((p) => p.uid === target.uid) : null;
      if (g.mat) { piece.mat = g.mat; msg = `${SB.SHAPES[piece.shape].name} is now ${SB.MATERIALS[g.mat].name}`; }
      else if (c.id === 'forge') { if (!Run.levelUp(run, piece, 1)) return { error: `Already Level ${SB.MAX_LEVEL}` }; msg = `${SB.SHAPES[piece.shape].name} is now Level ${SB.pieceLv(piece)}`; }
      else if (c.id === 'ban') {
        if (!piece.banned && Run.playableCount(run) <= 6) return { error: 'You need at least 6 playable pieces' };
        piece.banned = !piece.banned;
        msg = `${SB.SHAPES[piece.shape].name} ${piece.banned ? 'banned (0%)' : 'unbanned'}`;
      } else if (c.id === 'brush') {
        const t = SB.rollCell();
        run.board.cells[target.key] = t;
        msg = `Painted a ${SB.CELLS[t].name}`;
      } else if (c.id === 'cleanse') {
        let n = 0;
        for (const k in run.board.cells) if (SB.CELLS[run.board.cells[k]] && SB.CELLS[run.board.cells[k]].curse) { delete run.board.cells[k]; n++; }
        msg = `Cleansed ${n} curse cell${n === 1 ? '' : 's'}`;
      } else if (c.id === 'expand') {
        msg = 'Bag expanded';
      } else if (c.id === 'wealth') {
        const v = Math.min(20, Math.max(0, run.money));
        run.money += v;
        msg = `+$${v}`;
      }
    } else {
      msg = Run.useRift(run, c.id);
      if (msg && msg.error) return msg;
    }
    run.consumables.splice(idx, 1);
    SB.meta.data.consumablesUsed++;
    SB.meta.save();
    return msg;
  };
  Run.useRift = function (run, id) {
    switch (id) {
      case 'widen': {
        if (run.board.w >= SB.BOARD_W + 4) return { error: 'The board is already as wide as it gets' };
        run.board.w++;
        let m = 'Board is now ' + run.board.w + ' wide';
        if (run.relics.length) { const v = SB.pick(run.relics); run.relics = run.relics.filter((r) => r !== v); m += `; lost ${SB.RELICS[v.id].name}`; }
        return m;
      }
      case 'ascend': {
        const p = SB.pick(run.pieces.filter((q) => q.level < SB.MAX_LEVEL)) || SB.pick(run.pieces);
        p.level = Math.min(SB.MAX_LEVEL, p.level + 5);
        const others = SB.shuffle(run.pieces.filter((q) => q !== p && !q.banned));
        let banned = 0;
        for (const q of others) { if (banned >= 2 || Run.playableCount(run) <= 6) break; q.banned = true; banned++; }
        return `${SB.SHAPES[p.shape].name} is now Level ${p.level}; ${banned} piece(s) banned`;
      }
      case 'transmute': { const m = SB.pickMat(); for (const p of run.pieces) p.mat = m; return `Every piece is now ${SB.MATERIALS[m].name}`; }
      case 'summon': {
        if (run.relics.length >= Run.relicSlots(run)) return { error: 'No free curio slot' };
        const id2 = Run.grantRelic(run, 'Legendary');
        run.slotMod = (run.slotMod || 0) - 1;
        return id2 ? `Summoned ${SB.RELICS[id2].name}!` : 'The rift was empty';
      }
      case 'collapse': {
        if (run.board.w <= 6) return { error: 'The board is too narrow already' };
        run.board.w--;
        for (const k of Object.keys(run.board.cells)) if (+k.split(',')[0] >= run.board.w) delete run.board.cells[k];
        run.board.wells = run.board.wells.filter((x) => x < run.board.w);
        for (const k of SB.CLEAR_ORDER) Run.levelClear(run, k, 2);
        return `Board is now ${run.board.w} wide; every clear type +2 levels`;
      }
      case 'rebirth': {
        run.relics = run.relics.map((r) => {
          const rar = SB.RELICS[r.id].rarity;
          const pool = Object.keys(SB.RELICS).filter((k) => Run.relicOpen(k, run) && SB.RELICS[k].rarity === rar && !Run.hasRelic(run, k));
          const id2 = pool.length ? SB.weighted(pool, (k) => SB.offerWeight(SB.RELICS, k)) : r.id;
          SB.meta.discover(id2);
          return { id: id2 };
        });
        return 'Your curios were reborn';
      }
      case 'hollow': {
        const occ = Run.bagOccupancy(run);
        let n = 0;
        for (let i = 0; i < BAG * BAG; i++) if (run.bag.active[i] && !occ[i]) { run.bag.active[i] = false; delete run.bag.bonus[i]; n++; }
        run.money += 2 * n;
        return `Removed ${n} empty Bag cells: +$${2 * n}`;
      }
      case 'overload': {
        const open = ['RING', 'BIGO', 'CROSS'].filter((k) => !Run.shapeFull(run, k));
        run.overload = (run.overload || 0) + 1;
        if (!open.length) return 'You already hold two of each giant piece; speed +1 anyway';
        const shape = SB.pick(open);
        const spot = Run.canFitAnywhere(run, shape);
        if (!spot) return `No room for the ${SB.SHAPES[shape].name}; speed +1 anyway`;
        const p = Run.newPiece(run, shape, 1, { bx: spot.x, by: spot.y, rot: spot.rot, special: SB.pickKey(SB.SPECIALS) });
        run.pieces.push(p);
        return `Gained a ${SB.SHAPES[shape].name}! Speed +1 for the rest of the run`;
      }
    }
    return '';
  };

  Run.checkUnlocks = function () {
    const m = SB.meta.data;
    const out = [];
    for (const k in SB.STARTERS) {
      const s = SB.STARTERS[k];
      if (!m.unlocked[k] && s.check && s.check(m)) { m.unlocked[k] = true; out.push(s.name); }
    }
    SB.meta.save();
    return out;
  };
})(window.SB);
