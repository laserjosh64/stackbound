// Stackbound scoring: (clear chips + block chips) x mult, then relics left to right
'use strict';
(function (SB) {
  SB.scoreClear = function (g, info) {
    const run = g.run;
    const st = { chips: 0, mult: 0, log: [], money: 0 };
    const log = (k, v, label, icon) => st.log.push({ k, v, label, icon });
    const ctx = {
      game: g, run, info, src: '', icon: '', relic: null, amp: 1, idx: -1, fired: 0,
      chips(v, label) { if (!v) return true; st.chips += v; log('c', v, label || ctx.src, ctx.icon); return true; },
      mult(v, label) { if (!v) return true; v *= ctx.amp; st.mult += v; log('m', v, label || ctx.src, ctx.icon); return true; },
      xmult(v, label) { if (!v || v === 1) return true; st.mult *= v; log('x', v, label || ctx.src, ctx.icon); return true; },
      xchips(v, label) { if (!v || v === 1) return true; const add = Math.round(st.chips * (v - 1)); st.chips += add; log('c', add, (label || ctx.src) + ` (x${v})`, ctx.icon); return true; },
      money(v, label) { if (!v) return true; st.money += v; log('$', v, label || ctx.src, ctx.icon); return true; },
    };
    const has = (id) => SB.Run.hasRelic(run, id);
    // Kaleidoscope: Prism cells (and Cartographer's Well columns) give x2 instead of x1.5
    const prismX = has('kaleidoscope') ? 2 : 1.5;
    const philo = has('philosophers_stone'), fools = has('fools_gold');
    const isMat = (b, m) => {
      if (b && b.garbage && fools) return m === 'gold';
      if (!b || b.garbage || b.plain) return false;
      if (SB.matIs(g.matOf(b), m)) return true;
      return philo && (m === 'gold' || m === 'glass' || m === 'steel');
    };
    const instLevel = (b) => { const p = g.instOf(b); return p ? SB.pieceLv(p) : 1; };
    // Devilled Egg: Yolk in a clear counts three times
    const eggy = has('devilled_egg');
    const yk = (b) => (eggy && b && !b.garbage && g.matOf(b) === 'yolk' ? 3 : 1);

    // 1. Clear type
    const ct = SB.CLEARS[info.type];
    const lvl = run.levels[info.type] || 1;
    let baseChips = ct.chips + ct.pc * (lvl - 1);
    const baseMult = ct.mult + ct.pm * (lvl - 1);
    if (run.board.shape === 'narrow') baseChips = Math.ceil(baseChips / 2);
    ctx.chips(baseChips, `${ct.name} Lv.${lvl}`);
    ctx.mult(baseMult, `${ct.name} Lv.${lvl}`);

    // 2. Blocks
    const rowsSet = new Set(info.rows);
    let blockChips = 0, blockMult = 0, goldMoney = 0;
    const cellFx = [];
    for (const r of info.rows) {
      let rowChips = 0;
      for (let x = 0; x < g.W; x++) {
        const b = g.grid[r][x];
        if (!b) continue;
        const cell = g.cellAt(x, r);
        if (cell === 'void') { cellFx.push({ x, r, cell }); continue; }
        let c = 1;
        const k3 = yk(b);
        if (isMat(b, 'crystal')) c += 15 * k3;
        if (isMat(b, 'stone')) c += 50 * k3;
        if (isMat(b, 'glass') && has('glassworks')) c += 10 * k3;
        if (b.garbage && SB.Run.transformed(run, 'Garbage')) c += 10;
        if (b.garbage && has('gravedigger')) c *= 3;
        if (b.shape === 'O' && instLevel(b) >= 10) c *= 2;
        if (g.isWell(x)) c *= 2;
        rowChips += c;
        if (isMat(b, 'holo')) blockMult += 2 * k3;
        if (isMat(b, 'gold')) { goldMoney += k3; if (has('midas')) blockMult += 3 * k3; }
        if (cell) cellFx.push({ x, r, cell });
      }
      if (g.W >= 12) rowChips += 2;
      blockChips += rowChips;
    }
    ctx.chips(blockChips, `Blocks (${info.cells.length})`);
    if (blockMult) ctx.mult(blockMult, 'Opal / Gilt Edge blocks');
    if (goldMoney) {
      run.goldDust = (run.goldDust || 0) + goldMoney;
      const pay = Math.floor(run.goldDust / 4);
      run.goldDust -= pay * 4;
      if (pay) ctx.money(pay, 'Gold blocks');
    }

    // 3. Cells: flat effects first, then the multipliers (Lens, Prism)
    const order = { lens: 1, prism: 2 };
    cellFx.sort((a, b) => (order[a.cell] || 0) - (order[b.cell] || 0));
    const pops = [];
    for (const f of cellFx) {
      const k = g.key(f.x, f.r);
      const def = SB.CELLS[f.cell];
      ctx.icon = def ? def.icon : '';
      const n0 = st.log.length;
      switch (f.cell) {
        case 'prism': ctx.xmult(prismX, 'Prism cell'); break;
        case 'lens': ctx.xchips(has('loupe') ? 2 : 1.5, 'Lens cell'); break;
        case 'lucky': if (SB.chance(1 / 3)) ctx.mult(15, 'Clover cell'); else pops.push({ x: f.x, r: f.r, cell: f.cell, text: 'miss', dud: true }); break;
        case 'ember': {
          const e = (run.board.ember[k] = (run.board.ember[k] || 0) + 1);
          ctx.mult(2 + e, 'Ember cell');
          break;
        }
        case 'totem': ctx.mult(Math.max(2, 2 * run.relics.length), 'Totem cell'); break;
        case 'echo': {
          const times = has('echo_chamber') ? 2 : 1;
          for (let i = 0; i < times; i++) { ctx.chips(baseChips, 'Echo cell'); ctx.mult(baseMult, 'Echo cell'); }
          break;
        }
        case 'furnace':
          ctx.chips(60, 'Furnace cell');
          if (!has('molten_core')) run.board.ash[k] = run.stackCount + 1;
          break;
        case 'gold':
          if (!g.goldPaid.has(k)) { g.goldPaid.add(k); ctx.money(has('gold_digger') ? 3 : 2, 'Gold cell'); }
          else pops.push({ x: f.x, r: f.r, cell: f.cell, text: 'spent', dud: true });
          break;
        case 'thorn': ctx.money(-1, 'Thorn cell'); break;
        case 'void':
          if (has('hex_ward')) ctx.xmult(2, 'Hex Ward');
          else pops.push({ x: f.x, r: f.r, cell: f.cell, text: '0', dud: true });
          break;
      }
      const added = st.log.slice(n0);
      if (added.length) {
        const fmtE = (l) => (l.k === 'x' ? 'x' + l.v : l.k === '$' ? (l.v < 0 ? '-$' + -l.v : '+$' + l.v) : '+' + SB.fmt(l.v));
        const txt = f.cell === 'echo' ? 'ECHO' : added.map(fmtE)[added.length - 1];
        pops.push({ x: f.x, r: f.r, cell: f.cell, text: txt, k: added[added.length - 1].k });
      }
    }
    g.cellPops = (g.cellPops || []).concat(pops);
    ctx.icon = '';
    if (has('cartographer') && info.wellHits) ctx.xmult(Math.pow(prismX, info.wellHits), 'Cartographer');

    // 4. Materials (per piece)
    const glassUids = new Set(), luckyUids = new Set(), yolkUids = new Set();
    for (const c of info.cells) {
      if (c.b.uid < 0 || c.bomb) continue;
      if (isMat(c.b, 'glass')) glassUids.add(c.b.uid);
      if (isMat(c.b, 'lucky')) luckyUids.add(c.b.uid);
      if (yk(c.b) === 3) yolkUids.add(c.b.uid);
    }
    info.glassPieces = glassUids.size;
    // a Yolk piece counts three times with the Devilled Egg
    const glassN = glassUids.size + 2 * [...glassUids].filter((u) => yolkUids.has(u)).length;
    if (glassUids.size) ctx.xmult(Math.pow(1.5, glassN), `Glass x${glassN}`);
    for (const uid of luckyUids) {
      for (let t = 0, n = yolkUids.has(uid) ? 3 : 1; t < n; t++) {
        if (SB.chance(1 / 5)) ctx.mult(20, 'Clover piece');
        if (SB.chance(1 / 15)) ctx.money(10, 'Clover piece');
      }
    }
    let steel = 0;
    for (let r = 0; r < g.R; r++) {
      if (rowsSet.has(r)) continue;
      for (let x = 0; x < g.W; x++) if (isMat(g.grid[r][x], 'steel')) steel++;
    }
    if (steel) ctx.xmult(Math.pow(has('steel_nerves') ? 1.3 : 1.2, Math.min(steel, 40)), `Steel on board (${steel})`);
    if (g.mod === 'luckyday' && SB.chance(1 / 3)) ctx.mult(10, 'Lucky Day');

    // 5. Combo & back-to-back
    if (info.combo > 0) ctx.mult(info.combo * (run.levels.combo || 1), `Combo x${info.combo}`);
    if (info.b2b) ctx.mult(2, 'Back-to-back');

    // 6. Piece track
    const p = info.piece;
    const L = SB.pieceLv(p);
    const nm = SB.SHAPES[p.shape] ? SB.SHAPES[p.shape].name : '';
    ctx.icon = SB.uiIco('levels');
    // Lv5 and Lv10 bonuses depend on the shape; Lv15 is x2 Charge for every shape
    if (p.shape === 'I') {
      if (L >= 5 && info.isTetris) ctx.chips(40, 'I Lv.5');
      if (L >= 10 && info.isTetris) ctx.xmult(2, 'I Lv.10');
    } else if (p.shape === 'T') {
      if (L >= 5 && info.tspin) ctx.mult(6, 'T Lv.5');
    } else if (p.shape === 'O') {
      if (L >= 5) ctx.money(1, 'O Lv.5');
    } else if (p.shape === 'S' || p.shape === 'Z') {
      if (L >= 5) ctx.mult(4, `${nm} Lv.5`);
      if (L >= 10) ctx.xmult(1.5, `${nm} Lv.10`);
    } else if (p.shape === 'L' || p.shape === 'J') {
      if (L >= 5) ctx.chips(20, `${nm} Lv.5`);
      if (L >= 10) ctx.xmult(1.25, `${nm} Lv.10`);
    } else if (p.shape === 'I5') {
      if (L >= 5 && info.lines >= 5) ctx.mult(8, 'I5 Lv.5');
      if (L >= 10 && info.lines >= 5) SB.Run.levelClear(run, 'penta', 1);
    } else if (p.shape && p.shape !== '?') {
      if (L >= 5) ctx.chips(20 + 10 * SB.SHAPES[p.shape].n, `${nm} Lv.5`);
      if (L >= 10) ctx.xmult(1.5, `${nm} Lv.10`);
    }
    if (L >= 15 && p.shape && p.shape !== '?') ctx.xmult(2, `${nm} Lv.15`);
    ctx.icon = SB.BEHAVIORS.anchor.icon;
    if (p.behavior === 'anchor') ctx.xmult(2, 'Anchor');
    ctx.icon = SB.SPECIALS.catalyst.icon;
    if (g.catalyst > 1) ctx.xmult(g.catalyst, 'Catalyst');
    ctx.icon = SB.SPECIALS.pact.icon;
    // Pact pieces on the board
    const pacts = new Map();
    for (let r = 0; r < g.R; r++) for (let x = 0; x < g.W; x++) { const b = g.grid[r][x]; if (b && b.spec === 'pact') pacts.set(b.pid, b.lvl); }
    for (const lv of pacts.values()) ctx.xmult(SB.specialVal('pact', lv), 'Pact');
    // Temporal lines that waited in time and clear now
    if (info.temporal) {
      let lv = 1;
      for (const c of info.cells) if (c.b && c.b.spec === 'temporal') lv = Math.max(lv, c.b.lvl || 1);
      ctx.icon = SB.SPECIALS.temporal.icon;
      ctx.mult(SB.specialVal('temporal', lv) * info.temporal, `Stasis lines (${info.temporal})`);
    }
    ctx.icon = '';

    // 7. Relics, left to right
    const disabled = SB.Run.disabledRelics(run, g);
    const live = (id) => run.relics.some((r, i) => r.id === id && !disabled.has(i));
    const at = (i, id) => run.relics[i] && run.relics[i].id === id && !disabled.has(i);
    // Bookends: the first and last curios score twice. Tailwind: the curio to its right scores twice; Hindsight: the one to its left.
    // Amplifier: triples +Charge from the curio on its left. Chorus counts every curio that scored before it (ctx.fired).
    const bookends = live('bookends');
    ctx.fired = 0;
    const relicPass = (pass) => {
      const last = run.relics.length - 1;
      run.relics.forEach((r, i) => {
        if (disabled.has(i)) return;
        let def = SB.RELICS[r.id], src = def.name, self = r, copies = 1;
        if (r.id === 'blueprint_ghost') { const nb = run.relics[i + 1]; if (!nb || disabled.has(i + 1)) return; def = SB.RELICS[nb.id]; self = nb; src = 'Schematic Ghost (' + def.name + ')'; copies = 2; }
        if (def.id === 'chameleon') { const as = SB.RELICS[self.as]; if (!as) return; def = as; src = 'Chameleon (' + as.name + ')'; }
        if (!def.score) return;
        ctx.amp = at(i + 1, 'amplifier') ? 3 : 1;
        ctx.icon = def.icon; ctx.relic = self; ctx.idx = i;
        // who makes this curio score again
        const again = [];
        if (bookends && (i === 0 || i === last) && r.id !== 'bookends') again.push(SB.RELICS.bookends.name);
        if (at(i - 1, 'tailwind')) again.push(SB.RELICS.tailwind.name);
        if (at(i + 1, 'hindsight')) again.push(SB.RELICS.hindsight.name);
        const base = pass ? `${src} (${pass})` : src;
        for (let t = 0; t <= again.length; t++) {
          for (let k = 0; k < copies; k++) {
            ctx.src = t ? `${base} (${again[t - 1]})` : base;
            const n0 = st.log.length;
            def.score(ctx);
            if (st.log.length > n0) ctx.fired++;
          }
        }
        ctx.amp = 1; ctx.relic = null; ctx.idx = -1;
      });
    };
    relicPass('');
    if (info.isTetris && live('tetris_supreme')) relicPass(SB.RELICS.tetris_supreme.name);
    if (info.lines >= 5 && live('curtain_call')) relicPass(SB.RELICS.curtain_call.name);
    ctx.icon = SB.uiIco('star');
    ctx.src = '';
    if (SB.Run.transformed(run, 'Clear')) {
      const maxL = Math.max(...SB.CLEAR_ORDER.map((k) => run.levels[k] || 1));
      if (maxL > 1 && (run.levels[info.type] || 1) === maxL) ctx.xmult(2, 'Encore Master');
    }
    if (SB.Run.transformed(run, 'Speed')) ctx.xmult(1.5, 'Overclock');
    ctx.icon = '';

    // 8. Rule benders
    if (g.isBoss('miser') && (info.type === 'single' || info.type === 'double')) {
      log('c', -st.chips, 'The Miser', SB.BOSSES.miser.icon); st.chips = 0;
    }
    // '=' sets Charge outright
    if (g.mod === 'singles' && info.type !== 'single') { st.mult = 1; log('=', 1, 'Singles Night', ''); }

    // Hellscape: every clear is worth half
    if (run.stake >= 10) { st.mult *= 0.5; log('x', 0.5, 'Hellscape', SB.uiIco('fire')); }

    st.mult = Math.max(st.mult, 0);
    const score = Math.floor(st.chips * st.mult);
    return { score, chips: st.chips, mult: st.mult, log: st.log, money: st.money, name: ct.name, type: info.type, lines: info.lines, b2b: info.b2b, combo: info.combo, tspin: info.tspin };
  };
})(window.SB);
