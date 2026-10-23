// Stackbound tutorial: a lesson list with live practice boards for the hands-on lessons
// and illustrated pages for the rest. Practice boards run a throwaway run that is never saved.
'use strict';
(function (SB) {
  const UI = SB.UI;
  const esc = SB.esc;
  const ico = (k) => SB.uiIco(k);
  const kbd = (k) => `<kbd>${k}</kbd>`;
  const K = (a) => SB.UI.kbd(a); // the player's own key for a game action (Settings > Keys)

  // ---------- practice board helpers ----------
  const PALETTE = ['#4f7bff', '#ff9a3b', '#b25cff', '#4dff7c', '#ff4d6a', '#ffd83b', '#35e6ff'];
  let pidSeq = 50000;
  const filler = (x, r) => ({ uid: -5, pid: pidSeq++, shape: 'T', color: PALETTE[(x * 3 + r) % PALETTE.length], t: 0 });
  // fill rows counted from the floor (0 = bottom row), leaving the listed columns open
  function fillRows(g, rowsFromBottom, gaps) {
    for (const rb of rowsFromBottom) {
      const r = g.R - 1 - rb;
      for (let x = 0; x < g.W; x++) g.grid[r][x] = gaps.includes(x) ? null : filler(x, r);
    }
  }
  function clearBoard(g) { for (let r = 0; r < g.R; r++) g.grid[r] = new Array(g.W).fill(null); }

  // ---------- lessons ----------
  const L = [];
  L.push({
    id: 'basics', ico: 'gamepad', title: 'Move and rotate', kind: 'play',
    lead: 'Pieces fall on their own. Steer them into place before they land.',
    touchHint: 'Swipe slowly to creep one column at a time; swipe quickly and keep your finger down to slide to the wall. Taps only ever turn; a fast swipe down drops.',
    seq: ['T', 'L', 'J', 'S', 'Z', 'I', 'T', 'O'],
    steps: [
      { text: `Move left with ${K('left')}`, touch: (pad) => `Move left: swipe left${pad ? ' or tap <b>Left</b>' : ''}`, done: (t) => t.left > 0 },
      { text: `Move right with ${K('right')}`, touch: (pad) => `Move right: swipe right${pad ? ' or tap <b>Right</b>' : ''}`, done: (t) => t.right > 0 },
      { text: `Rotate clockwise with ${K('cw')}`, touch: (pad) => `Turn clockwise: tap on the right side${pad ? ' or tap <b>Turn right</b>' : ''}`, done: (t) => t.cw > 0 },
      { text: `Rotate the other way with ${K('ccw')}`, touch: (pad) => `Turn the other way: tap on the left side${pad ? ' or tap <b>Turn left</b>' : ''}`, done: (t) => t.ccw > 0 },
      { text: `Drop it into place with ${K('hard')}`, touch: (pad) => `Drop it into place: swipe down fast and let go${pad ? ' or tap <b>Drop</b>' : ''}`, done: (t) => t.hard > 0 },
    ],
  });
  L.push({
    id: 'drops', ico: 'drop', title: 'Soft drop vs hard drop', kind: 'play',
    lead: 'There are two ways down. One is careful, one is instant.',
    touchHint: 'A slow swipe down is a fast drop that stops when you lift your finger. A fast swipe down is a quick drop that lands the piece at once.',
    seq: ['L', 'T', 'J', 'S', 'Z', 'I', 'O'],
    setup: (g) => fillRows(g, [0, 1], [2, 3, 6]),
    steps: [
      { text: `Hold ${K('soft')} to soft drop. It starts slow and speeds up the longer you hold.`, touch: (pad) => `Swipe down slowly and keep your finger on the screen for a fast drop${pad ? ' (or hold <b>Down</b>)' : ''}. It starts slow and speeds up the longer you hold.`, done: (t) => t.soft >= 0.6 },
      { text: `Soft drop a piece onto the stack, then slide it sideways with ${K('left')} ${K('right')} before it locks`, touch: 'Soft drop a piece onto the stack, then swipe sideways before it locks', done: (t) => t.slide > 0 },
      { text: `Hard drop with ${K('hard')}: the piece slams down and locks at once`, touch: (pad) => `Quick drop with a fast swipe down${pad ? ' or <b>Drop</b>' : ''}: the piece slams down and locks at once`, done: (t) => t.hard > 0 },
    ],
  });
  L.push({
    id: 'lines', ico: 'lines', title: 'Clearing lines', kind: 'play', tally: true,
    lead: 'Fill a row from wall to wall and it clears. Clear several at once for a much bigger score.',
    seq: ['I', 'T', 'L', 'O', 'J', 'I', 'S', 'Z', 'I'],
    setup: (g) => fillRows(g, [0, 1, 2, 3], [9]),
    steps: [
      { text: 'Clear a line', done: (t) => t.lines > 0 },
      { text: `Stand the I piece up (${K('cw')}) and drop it in the gap on the right to clear four lines at once: a <b>Tetris</b>`, touch: 'Stand the I piece up (tap the right side) and drop it in the gap on the right to clear four lines at once: a <b>Tetris</b>', done: (t) => t.tetris > 0 },
    ],
    hint: `Messed it up? Press ${kbd('R')} or Reset to rebuild the board.`,
    touchHint: 'Messed it up? Tap Reset to rebuild the board.',
  });
  L.push({
    id: 'hold', ico: 'hold', title: 'Hold', kind: 'play',
    lead: 'Hold keeps one piece in your pocket for later. You can use it once per piece.',
    seq: ['S', 'I', 'Z', 'T', 'L', 'J', 'O'],
    steps: [
      { text: `Press ${K('hold')} to put the falling piece in Hold`, touch: (pad) => `Press and hold on the board to put the falling piece in Hold${pad ? ' (or tap <b>Hold</b>)' : ''}`, done: (t) => t.hold >= 1 },
      { text: 'Place the piece that comes out next', done: (t) => t.hold >= 1 && t.locks > t.locksAtHold },
      { text: `Press ${K('hold')} again to swap the held piece back in`, touch: 'Press and hold again to swap the held piece back in', done: (t) => t.hold >= 2 },
    ],
  });
  L.push({
    id: 'score', ico: 'charge', title: 'Mass × Charge', kind: 'read',
    lead: 'Every clear scores Mass × Charge. Mass is how much you cleared. Charge is how hard it hits.',
    body: () => {
      const rows = SB.CLEAR_ORDER.map((k) => { const c = SB.CLEARS[k]; return `<tr><td>${SB.PATTERNS[c.pattern] ? SB.PATTERNS[c.pattern].icon : ''} ${c.name}</td><td class="chips">${c.chips}</td><td class="mult">${c.mult}</td><td>${c.chips * c.mult}</td></tr>`; }).join('');
      return `<div class="tut-grid2">
        <div>
          <div class="tut-tally-demo"><div class="chips-box"><i>${ico('mass')} MASS</i><b>140</b></div><span class="x">×</span><div class="mult-box"><i>${ico('charge')} CHARGE</i><b>5</b></div><span class="x">=</span><div class="tut-eq">700</div></div>
          <p>A Tetris starts at <b class="chips">100 Mass</b> and <b class="mult">5 Charge</b>. Every block in the cleared lines adds <b class="chips">+1 Mass</b>, so four full rows of 10 add 40 more.</p>
          <p><b>+</b> effects add to a number. <b>x</b> effects multiply it. Curios fire left to right, so a curio that multiplies Charge hits hardest when it sits at the end of the row.</p>
          <p>Board cells, materials, piece levels and curios all pile onto the same two numbers, in a set order. The last lesson, Scoring order, walks through it.</p>
        </div>
        <div><table class="lvl-table tut-table"><tr><th>Clear</th><th>Mass</th><th>Charge</th><th>Score</th></tr>${rows}</table>
          <p class="dim small">Base values at Level 1. Patterns from the Workshop level a clear type up for more of both.</p></div>
      </div>`;
    },
  });
  L.push({
    id: 'specials', ico: 'specials', title: 'Special pieces', kind: 'play', tally: true,
    lead: 'Some pieces carry powers. You can tell them apart by how they look.',
    seq: [{ shape: 'I', behavior: 'bomb' }, { shape: 'T', special: 'drill' }, { shape: 'O', special: 'vacuum', level: 3 }, 'L', 'J'],
    setup: (g) => {
      fillRows(g, [0, 1, 2, 3], [0]);
      const r0 = g.R - 5;
      const pile = [[1, 0], [2, 0], [3, 0], [5, 0], [6, 0], [8, 0], [9, 0], [1, 1], [2, 1], [6, 1], [9, 1], [1, 2], [6, 2]];
      for (const [x, d] of pile) g.grid[r0 - d][x] = filler(x, r0 - d);
    },
    steps: [
      { text: 'Drop the <b>Bomb</b> I piece (dark, with a lit fuse) into the gap on the left. Every line it clears explodes, and anything left hanging falls into the crater.', done: (t) => t.bomb > 0 },
      { text: 'Land the <b>Drill</b> T (steel teeth on its underside). It bores straight down through the stack.', done: (t) => t.drill > 0 },
      { text: 'Land the <b>Vacuum</b> O (the grille) on top of some blocks. It deletes what is under it and sinks into the gap.', done: (t) => t.vacuum > 0 },
    ],
    hint: `Press ${kbd('R')} or Reset to rebuild the board and get the pieces again.`,
    touchHint: 'Tap Reset to rebuild the board and get the pieces again.',
  });
  L.push({
    id: 'looks', ico: 'gem', title: 'Reading a piece', kind: 'read',
    lead: 'Specials, behaviours and materials each change how a piece is built. Here is the whole set.',
    gallery: true,
    body: () => {
      const item = (o, name, desc) => `<div class="tut-look"><canvas class="tut-look-cv" width="104" height="76" data-look="${esc(JSON.stringify(o))}"></canvas><div><b>${esc(name)}</b><div class="dim small">${esc(desc)}</div></div></div>`;
      const specs = Object.keys(SB.SPECIALS).map((k) => item({ spec: k }, SB.SPECIALS[k].name, SB.SPECIALS[k].desc(SB.specialVal(k, 1)))).join('');
      const behs = Object.keys(SB.BEHAVIORS).map((k) => item({ beh: k }, SB.BEHAVIORS[k].name, SB.BEHAVIORS[k].desc)).join('');
      const mats = SB.MAT_KEYS.map((k) => item({ mat: k }, SB.MATERIALS[k].name, SB.MATERIALS[k].desc)).join('');
      return `<h3 class="tut-h3">Specials <span class="dim small">one power per piece, stronger at Lv5, Lv10 and Lv15</span></h3><div class="tut-looks">${specs}</div>
        <h3 class="tut-h3">Behaviours <span class="dim small">change how the piece moves or what it does when cleared</span></h3><div class="tut-looks">${behs}</div>
        <h3 class="tut-h3">Materials <span class="dim small">pay out when their blocks are cleared</span></h3><div class="tut-looks">${mats}</div>`;
    },
  });
  L.push({
    id: 'goal', ico: 'target', title: 'Targets, the clock and Push On', kind: 'read',
    lead: 'Each Stack has a score target and a clock. Beat the target before time runs out.',
    body: () => `<div class="tut-grid2">
      <div>
        <div class="tut-clock">${ico('time')}<b>5:00</b><span class="dim small">Every Stack starts with 5 minutes</span></div>
        <div class="tut-bar"><div class="tut-bar-fill"></div><span>Target 1,000</span></div>
        <p>Your score fills the bar. Beat the target and the game freezes so you can choose:</p>
        <div class="tut-choice"><div class="tut-opt cash">${ico('money')} <b>Bank</b> ${kbd('Q')}<div class="dim small">End the Stack now and collect the reward.</div></div>
        <div class="tut-opt push">${ico('fire')} <b>Push On</b> ${kbd('E')}<div class="dim small">Your score resets to 0 and the clock gets <b>+1:00</b>. Hit a fresh goal (60%, then 90%, then 130% of the target) for more money and a Token.</div></div></div>
      </div>
      <div>
        <h3 class="tut-h3">The catch</h3>
        <p>If the clock runs out or you top out before the target, the run ends. Pushing is a gamble too: run out of time or top out during a push and the run ends. Banking is always safe.</p>
        <h3 class="tut-h3">Bending time</h3>
        <p>Some Stacks change the clock (<b>Short Fuse</b>, <b>Extra Time</b>, <b>Beat the Clock</b>, <b>Sudden Death</b>), and so does <b>The Deadline</b>, a Warden. Curios like <b>Alarm Clock</b> and <b>Borrowed Time</b>, Hourglass pieces and the <b>Freeze</b> Glyph give you more.</p>
        <h3 class="tut-h3">Getting paid</h3>
        <p>You earn the Stack reward, a time bonus for reaching the target before par, Push On bonuses, and <b>Savings</b>: $1 for every $${SB.ECON.savePer} you are holding (up to $${SB.ECON.saveCap}).</p>
      </div></div>`,
  });
  L.push({
    id: 'tower', ico: 'floors', title: 'The Tower', kind: 'read',
    lead: 'A run is a climb of 8 Floors. Clear Floor 8 to reach the Summit.',
    body: () => {
      const bosses = ['fog', 'mirror', 'pillar', 'ghost'].map((k) => `<div class="tut-boss">${SB.BOSSES[k].icon}<div><b>${SB.BOSSES[k].name}</b><div class="dim small">${esc(SB.BOSSES[k].desc)}</div></div></div>`).join('');
      return `<div class="tut-grid2">
        <div>
          <div class="tut-floor"><div class="tf-chip k0">I</div><div class="tf-chip k1">II</div><div class="tf-chip k2">${SB.uiIco('skull')}</div></div>
          <p>Every Floor has three Stacks: <b>Stack I</b>, <b>Stack II</b> and a <b>Warden Stack</b>. Targets grow each Floor.</p>
          <p>Stacks I and II roll a <b>modifier</b> that changes the rules a little and the pay a little. With the Scout's Report Schematic you can restock a modifier for $2. You can also <b>skip</b> the Stack to take its Token instead of its reward.</p>
          <p><b>Hazard</b> is the difficulty you pick before a run. Win a Hazard with a Builder to unlock the next one.</p>
        </div>
        <div><h3 class="tut-h3">Wardens break a rule of Tetris</h3><div class="tut-bosses">${bosses}</div><p class="dim small">There are ${Object.keys(SB.BOSSES).length} Wardens. You can see which one is coming on the Floor map.</p></div>
      </div>`;
    },
  });
  L.push({
    id: 'workshop', ico: 'workshop', title: 'The Workshop', kind: 'read',
    lead: 'Between Stacks you spend your money here. The stock changes every visit.',
    body: () => {
      const card = (icon, cls, name, text) => `<div class="tut-card ${cls}"><div class="tut-medal">${icon}</div><b>${name}</b><div class="dim small">${text}</div></div>`;
      return `<div class="tut-cards">
        ${card(SB.RELICS.tetromancer.art, 'r-Rare', 'Curios', 'Up to 5. They fire left to right on every clear. Sell them for money.')}
        ${card(SB.PATTERNS.pillar.icon, 'fam-Pattern', 'Patterns', 'Level up a clear type for more Mass and Charge.')}
        ${card(SB.GLYPHS.gild.icon, 'fam-Glyph', 'Glyphs', `Reshape pieces and the board. LIVE Glyphs fire mid-Stack ${UI.touch ? 'when you tap them' : `with ${kbd('1')}-${kbd('4')}`}.`)}
        ${card(SB.RIFTS.overload.icon, 'fam-Rift', 'Rifts', 'Big power with a price attached.')}
        ${card(SB.PACKS.piece.icon, 'piece-pack', 'Packs and crates', 'New pieces, board cells, Patterns or a curio. Pick one.')}
        ${card(SB.BLUEPRINTS.long_sight.icon, 'bp-card', 'Schematics', 'Permanent upgrades for the rest of the run.')}
      </div>
      <p>${ico('dice')} <b>Restock</b> rerolls the shelves. ${ico('hammer')} <b>Forge</b> gives a piece +1 level for the rest of the run. It costs $5, then doubles each time in the same visit. Some visits have an event like a sale or an extra pack.</p>`;
    },
  });
  L.push({
    id: 'bag', ico: 'bag', title: 'Your Bag', kind: 'read',
    lead: 'Only pieces that are in your Bag can fall. Building the Bag is building your deck.',
    bag: true,
    body: () => `<div class="tut-grid2">
      <div><canvas id="tutBagCv" class="tut-bag"></canvas></div>
      <div>
        <p>Your Bag is a grid. Pieces take up room in it, so a new piece needs space. Bag Patches from the Workshop add room. You can hold at most <b>2 pieces of the same shape</b>.</p>
        <p>Each piece has a <b>Level</b> from 1 to 15 and unlocks its own bonus at Lv5, Lv10 and Lv15. Levels don't change how often a piece shows up. Levels are kept for the whole run, except the ones from the Forge special and Gilded Bag cells, which wear off when the Floor ends.</p>
        <p>Throwing a piece out costs money, and more each time. You always keep at least 6.</p>
        <p>Open ${ico('bag')} <b>Bag</b> any time to see how likely each piece is to appear.</p>
      </div></div>`,
  });
  L.push({
    id: 'cells', ico: 'board', title: 'Board cells', kind: 'read',
    lead: 'Board Packs inscribe cells onto your board. They stay for the whole run.',
    cells: true,
    body: () => {
      const list = SB.BOARD_PACK_CELLS.map((k) => `<div class="gloss-item"><canvas class="cell-cv" width="40" height="40" data-cell="${k}"></canvas><div><b>${esc(SB.CELLS[k].name)}</b><div class="dim small">${esc(SB.CELLS[k].desc)}</div></div></div>`).join('');
      return `<div class="tut-grid2">
        <div><canvas id="tutCellsCv" class="tut-cells"></canvas>
          <p>An empty cell is a faint mark so you can always tell the space is open. Once a block covers it, a small badge in the block's corner shows it is still there.</p>
          <p>When a line clears through a cell, the cell fires and a badge pops off it showing what it added. Lower rows clear more often.</p></div>
        <div class="gloss tut-gloss">${list}</div>
      </div>`;
    },
  });
  // the worked example on the Scoring order page; Swap flips the two curios
  const orderDemo = () => {
    const t = SB.CLEARS.tetris, flip = !!UI.tutOrderFlip;
    const cur = {
      tetromancer: { n: 5, k: 'm', v: 4, label: SB.RELICS.tetromancer.name, icon: SB.RELICS.tetromancer.icon, cur: 1 },
      still_water: { n: 5, k: 'x', v: 2, label: SB.RELICS.still_water.name, icon: SB.RELICS.still_water.icon, cur: 1 },
    };
    const ids = flip ? ['tetromancer', 'still_water'] : ['still_water', 'tetromancer'];
    const steps = [
      { n: 1, k: 'c', v: t.chips, label: `${t.name} Lv.1` }, { n: 1, k: 'm', v: t.mult, label: `${t.name} Lv.1` },
      { n: 2, k: 'c', v: 40, label: 'Blocks (40)' },
      { n: 2, k: 'c', v: t.chips, label: SB.CELLS.echo.name }, { n: 2, k: 'm', v: t.mult, label: SB.CELLS.echo.name },
      { n: 3, k: 'x', v: 1.5, label: `${SB.MATERIALS.glass.name} piece` },
    ].concat(ids.map((id) => cur[id]));
    let c = 0, m = 0;
    const rows = steps.map((l) => {
      if (l.k === 'c') c += l.v; else if (l.k === 'm') m += l.v; else m *= l.v;
      return `<li class="sl-row ${UI.logCls(l)} ${l.cur && UI.tutOrderSwapped ? 'tod-new' : ''}"><span class="sl-src"><span class="tod-n">${l.n}</span>${l.icon ? `<span class="sl-ico">${l.icon}</span>` : ''}<span>${esc(l.label)}</span></span><b class="sl-val">${UI.logVal(l)}</b><span class="sl-run"><i class="c">${SB.fmt(c)}</i><i class="x">×</i><i class="m">${SB.fmtX(m)}</i></span></li>`;
    }).join('');
    const slot = (id, i) => `<div class="tod-slot r-${SB.RELICS[id].rarity}"><small>${i ? '2nd' : '1st'}</small><i>${SB.RELICS[id].art}</i><b>${esc(SB.RELICS[id].name)}</b><span class="dim small">${esc(SB.RELICS[id].desc)}</span></div>`;
    return `<div class="tod-curios">${slot(ids[0], 0)}<button class="tod-swap" data-act="tutOrderSwap" aria-label="Swap the two curios">${SB.glyph('left')}${SB.glyph('right')}<span>Swap</span></button>${slot(ids[1], 1)}</div>
      <div class="sl-head"><b class="sl-name">${esc(t.name)}</b><b class="sl-score ${flip ? 'tod-best' : ''}">+${SB.fmt(Math.floor(c * m))}</b></div>
      <ol class="sl-steps">${rows}</ol>
      <div class="sl-sum"><span class="c">${ico('mass')}${SB.fmt(c)}</span><i>×</i><span class="m">${ico('charge')}${SB.fmtX(m)}</span><i>=</i><b class="${flip ? 'tod-best' : ''}">${SB.fmt(Math.floor(c * m))}</b></div>`;
  };
  L.push({
    id: 'order', ico: 'papers', title: 'Scoring order', kind: 'read',
    lead: 'Every clear adds up in the same order. A bonus is worth more or less depending on where it lands.',
    body: () => `<div class="tut-grid2">
      <div>
        <ol class="tod-list">
          <li><b>The clear</b><span class="dim small">Its base Mass and Charge, from the table in Mass × Charge</span></li>
          <li><b>Blocks, then board cells</b><span class="dim small">+1 Mass per block. Cells like Echo go first, then Lens and Prism</span></li>
          <li><b>Materials, then combos</b><span class="dim small">Glass, Steel and Clover pieces, then Combo and Back-to-back</span></li>
          <li><b>Piece levels</b><span class="dim small">The Lv5, Lv10 and Lv15 bonuses of the piece you placed</span></li>
          <li><b>Curios, left to right</b><span class="dim small">In the order they sit in your curio row</span></li>
          <li><b>Warden rules</b><span class="dim small">A few Wardens change the total last</span></li>
        </ol>
        <p>A <b class="tod-v m">+4</b> adds to the Charge you have at that step. A <b class="tod-v x">x2</b> multiplies the Charge you have at that step, so anything added after it is not multiplied. Mass × Charge is worked out once, at the very end.</p>
        <p>That is why a curio that adds Charge belongs to the left of one that multiplies it.</p>
      </div>
      <div>
        <h3 class="tut-h3">A Tetris through an Echo cell with a Glass piece</h3>
        <div id="tutOrder" class="tod">${orderDemo()}</div>
        <p class="dim small">During a Stack, ${UI.touch ? 'tap' : 'click'} the Mass × Charge box to see this list for your last clear.</p>
      </div></div>`,
  });
  SB.TUTORIAL = L;

  const meta = () => { const m = SB.meta.data; if (!m.tutorial) m.tutorial = {}; return m.tutorial; };

  // ---------- screen ----------
  UI.tutIdx = 0;
  UI.screens.tutorial = function () {
    const done = meta();
    const i = UI.tutIdx;
    if (i >= L.length) return finishedHtml();
    const l = L[i];
    const nav = L.map((x, k) => `<button class="tut-lesson ${k === i ? 'cur' : ''} ${done[x.id] ? 'done' : ''}" data-act="tutGo" data-i="${k}"><span class="tl-ico">${ico(x.ico)}</span><span class="tl-t">${x.title}</span>${done[x.id] ? `<span class="tl-ck">${ico('check')}</span>` : ''}</button>`).join('');
    let main;
    if (l.kind === 'play') {
      main = `<div class="tut-play" ${UI.touch ? 'data-gesture="1"' : ''}>
        <div class="tut-col"><div class="pl-label">HOLD</div><canvas class="hold-cv" id="tutHold" width="96" height="72"></canvas></div>
        <div class="tut-boardwrap"><canvas id="tutBoard"></canvas><div class="tut-banner" id="tutBanner" hidden>${ico('check')} Lesson complete</div></div>
        <div class="tut-col"><div class="pl-label">NEXT</div><canvas class="next-cv first" id="tutNext0" width="96" height="72"></canvas><canvas class="next-cv" id="tutNext1" width="80" height="52"></canvas><canvas class="next-cv" id="tutNext2" width="80" height="52"></canvas></div>
        <div class="tut-side">
          <div class="sec-label">Try it</div>
          <ol class="tut-steps" id="tutSteps"></ol>
          ${l.tally ? '<div class="tut-tally" id="tutTally">Clear a line to see how it scores</div>' : ''}
          ${UI.touch && l.touchHint ? `<div class="dim small tut-hint">${l.touchHint}</div>` : l.hint ? `<div class="dim small tut-hint">${l.hint}</div>` : ''}
          <button data-act="tutReset">Reset board ${kbd('R')}</button>
        </div>
        ${UI.touch && SB.meta.data.settings.touchButtons ? UI.padHtml('tut-pad') : ''}
      </div>`;
    } else main = `<div class="tut-read">${l.body()}</div>`;
    return `<button class="back-top" data-act="title">${SB.glyph('back')} Back</button><div class="tutorial"><h1 class="screen-title">Tutorial</h1>
      <div class="tut-body">
        <div class="tut-nav panel"><div class="sec-label">Lessons</div>${nav}</div>
        <div class="tut-main panel">
          <div class="tut-head"><div class="tut-medal">${ico(l.ico)}</div><div><div class="tut-kicker">Lesson ${i + 1} of ${L.length} · ${l.kind === 'play' ? 'Hands on' : 'Read'}</div><h2>${l.title}</h2><div class="tut-lead">${l.lead}</div></div></div>
          ${main}
          <div class="tut-foot"><button data-act="tutPrev" ${i === 0 ? 'disabled' : ''}>${SB.glyph('back')} Previous</button><button class="primary" id="tutNextBtn" data-act="tutNext">${i === L.length - 1 ? 'Finish' : 'Next lesson'} ${SB.glyph('next')}</button></div>
        </div>
      </div></div>`;
  };
  function finishedHtml() {
    return `<button class="back-top" data-act="title">${SB.glyph('back')} Back</button><div class="tutorial tut-finished panel">
      <div class="tut-medal big">${ico('graduate')}</div>
      <h1>You're ready</h1>
      <p>That is everything you need for your first climb. The rest you will learn from the curios you find.</p>
      <div class="menu-row"><button class="big primary" data-act="newRunScreen">${ico('tower')} Start a run</button><button class="big" data-act="tutGo" data-i="0">Replay lessons</button><button class="big" data-act="title">Main menu</button></div>
    </div>`;
  }

  // ---------- practice board ----------
  function newTracker() { return { left: 0, right: 0, cw: 0, ccw: 0, hard: 0, soft: 0, slide: 0, hold: 0, locks: 0, locksAtHold: 0, lines: 0, tetris: 0, bomb: 0, drill: 0, vacuum: 0 }; }
  function buildGame(l) {
    const T = UI.tut;
    if (!T.prevRng) T.prevRng = SB.rng;
    const run = SB.Run.newRun('architect', 1, 'TUTORIAL');
    run.board.h = 16;
    const stack = { idx: 0, kind: 's1', name: 'Tutorial', target: 1e12, boss: null, mod: null, reward: 0, par: 999, tag: null, ante: 1, carry: 0 };
    const g = new SB.Game(run, stack);
    g.sandbox = true;
    let n = 0;
    g.rollPiece = () => { const s = l.seq[n++ % l.seq.length]; return Object.assign({ uid: -100 - n, level: 1 }, typeof s === 'string' ? { shape: s } : s); };
    const tk = T.tk;
    const wrap = (name, fn) => { const orig = g[name].bind(g); g[name] = (...a) => fn(orig, ...a); };
    wrap('move', (o, dx) => { const ground = g.onGround(); const r = o(dx); if (r) { if (dx < 0) tk.left++; else tk.right++; if (ground) tk.slide++; } return r; });
    wrap('rotate', (o, d) => { const r = o(d); if (r) { if (d === 1) tk.cw++; else if (d === -1) tk.ccw++; } return r; });
    wrap('hardDrop', (o) => { const was = g.active; o(); if (g.active !== was) tk.hard++; });
    wrap('hold', (o) => { const was = g.holdUsed; o(); if (!was && g.holdUsed) { tk.hold++; if (tk.hold === 1) tk.locksAtHold = tk.locks; } });
    wrap('lock', (o, hard) => { tk.locks++; return o(hard); });
    wrap('drill', (o, pid, v) => { tk.drill++; return o(pid, v); });
    wrap('vacuum', (o, pid, v) => { tk.vacuum++; return o(pid, v); });
    wrap('processClears', (o, p, ts, lc) => {
      const rows = g.fullRows();
      const bomb = rows.some((r) => g.grid[r].some((b) => b && b.beh === 'bomb'));
      const k = o(p, ts, lc);
      if (k > 0) { tk.lines += k; if (k >= 4) tk.tetris++; if (bomb) tk.bomb++; }
      return k;
    });
    // topping out in practice just rebuilds the board
    g.topOut = () => { resetBoard(g, l); UI.toast('Board reset'); };
    resetBoard(g, l);
    return g;
  }
  function resetBoard(g, l) {
    clearBoard(g);
    if (l.setup) l.setup(g);
    g.queue = []; g.holds = []; g.holdUsed = false;
    g.particles = []; g.flashRows = []; g.trail = null; g.slamFx = null;
    g.active = null;
    g.spawn();
  }

  UI.tutMount = function () {
    const l = L[UI.tutIdx];
    UI.tut = { tk: newTracker(), prevRng: UI.tut && UI.tut.prevRng, sig: '', lastTally: 0, complete: false };
    UI.input = { left: false, right: false, down: false, lastDir: 0 };
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const tb = document.getElementById('toasts'); if (tb) tb.innerHTML = '';
    if (!l) return;
    if (l.kind === 'play') {
      UI.tut.game = buildGame(l); UI.tutSize(); renderSteps(true);
      // on a phone, bring the steps, board and buttons into view together
      const tp = document.querySelector('.tut-play'), sc = document.getElementById('screen');
      if (tp && sc && UI.touch) {
        setTimeout(() => {
          if (!tp.isConnected) return;
          const top = tp.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 52;
          sc.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }, 480);
      }
    }
    if (l.bag) drawBag();
    if (l.kind === 'read' && !meta()[l.id]) { meta()[l.id] = true; SB.meta.save(); }
  };
  UI.tutSize = function () {
    const g = UI.tut && UI.tut.game;
    if (!g) return;
    const w = window.innerWidth, h = window.innerHeight;
    if (UI.touch || w < 760) {
      // phone: hold and next sit beside the board, the pad and the steps stack around it
      const land = w > h * 1.2;
      const byW = Math.floor((land ? (w - 40) * 0.45 - 130 : w - 200) / g.W);
      const byH = Math.floor((land ? h - 24 : h - (UI.touch ? (SB.meta.data.settings.touchButtons ? 330 : 230) : 60)) / (g.H + 2));
      UI.tut.cs = Math.max(10, Math.min(28, byW, byH));
    } else UI.tut.cs = Math.max(14, Math.min(28, Math.floor((h - 300) / (g.H + 2))));
  };
  function renderSteps(force) {
    const T = UI.tut, l = L[UI.tutIdx], el = document.getElementById('tutSteps');
    if (!el || !T) return;
    const states = [];
    let cur = -1;
    l.steps.forEach((s, i) => { const d = !!(T.doneSteps && T.doneSteps[i]) || s.done(T.tk); states.push(d); if (!d && cur < 0) cur = i; });
    T.doneSteps = states;
    const sig = states.join(',');
    if (!force && sig === T.sig) return;
    T.sig = sig;
    el.innerHTML = l.steps.map((s, i) => `<li class="${states[i] ? 'done' : ''} ${i === cur ? 'cur' : ''}"><span class="ck">${states[i] ? ico('check') : i + 1}</span><span>${UI.touch && s.touch ? (typeof s.touch === 'function' ? s.touch(!!SB.meta.data.settings.touchButtons) : s.touch) : s.text}</span></li>`).join('');
    SB.UI.syncKeys(el);
    if (!force) SB.audio.play(states.every(Boolean) ? 'levelup' : 'click');
    if (states.every(Boolean) && !T.complete) {
      T.complete = true;
      meta()[l.id] = true; SB.meta.save();
      const b = document.getElementById('tutBanner'); if (b) b.hidden = false;
      const nb = document.getElementById('tutNextBtn'); if (nb) nb.classList.add('ready');
      const lb = document.querySelector('.tut-lesson.cur'); if (lb) { lb.classList.add('done'); if (!lb.querySelector('.tl-ck')) lb.insertAdjacentHTML('beforeend', `<span class="tl-ck">${ico('check')}</span>`); }
      const cv = document.getElementById('tutBoard'); if (cv) SB.FX.burstAt(cv, 40, { spark: true, spread: Math.PI * 2, speed: 420 });
    }
  }
  function drawBag() {
    const cv = document.getElementById('tutBagCv');
    if (!cv) return;
    const prev = SB.rng;
    const run = SB.Run.newRun('architect', 1, 'TUTORIALBAG');
    SB.rng = prev;
    run.pieces[0].special = 'coin'; run.pieces[1].level = 3; run.pieces[2].mat = 'gold'; run.pieces[4].behavior = 'bomb';
    SB.Render.bag(cv, run, 30, null, null, SB.Run.pieceRates(run));
  }
  function drawLooks(t) {
    for (const cv of document.querySelectorAll('canvas.tut-look-cv')) {
      const o = JSON.parse(cv.getAttribute('data-look'));
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      const cells = SB.Run.normCells(SB.SHAPES.T.rots[2]);
      const eg = SB.Looks.edges(cells);
      const s = 24, ox = (cv.width - 3 * s) / 2, oy = 12;
      cells.forEach(([x, y], i) => SB.Render.block(ctx, ox + x * s, oy + y * s, s, SB.SHAPES.T.color, { mat: o.mat, spec: o.spec, beh: o.beh, edges: eg.flags[i], lead: i === eg.lead, live: true, ph: 1 }));
    }
    void t;
  }
  function drawCellsDemo() {
    const cv = document.getElementById('tutCellsCv');
    if (!cv) return;
    const s = 34, W = 7, H = 4;
    if (cv.width !== W * s) { cv.width = W * s; cv.height = H * s; }
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0b0b1a'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = 'rgba(120,120,200,0.08)';
    for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(x * s + 0.5, 0); ctx.lineTo(x * s + 0.5, H * s); ctx.stroke(); }
    for (let y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(0, y * s + 0.5); ctx.lineTo(W * s, y * s + 0.5); ctx.stroke(); }
    const cells = { '1,0': 'gold', '4,1': 'prism', '2,2': 'echo', '5,3': 'ember', '0,3': 'lens', '3,3': 'lucky' };
    const blocks = { '0,3': '#4f7bff', '1,3': '#4f7bff', '2,3': '#4f7bff', '3,3': '#ffd83b', '4,3': '#ffd83b', '3,2': '#ffd83b', '4,2': '#ffd83b' };
    for (const k in cells) { const [x, y] = k.split(',').map(Number); if (!blocks[k]) SB.Render.cellOverlay(ctx, x * s, y * s, s, cells[k], false); }
    const lead = {};
    for (const k in blocks) {
      const [x, y] = k.split(',').map(Number), col = blocks[k];
      const edges = SB.Looks.flags((xx, yy) => blocks[xx + ',' + yy] === col, x, y);
      SB.Render.block(ctx, x * s, y * s, s, col, { edges, lead: !(edges & 1) ? false : !lead[col] && (lead[col] = true) });
      if (cells[k]) SB.Render.cellOverlay(ctx, x * s, y * s, s, cells[k], true);
    }
  }

  UI.tutFrame = function (dt) {
    const T = UI.tut;
    if (!T) return;
    const t = performance.now() / 1000;
    if (document.querySelector('canvas.tut-look-cv')) drawLooks(t);
    if (document.getElementById('tutCellsCv')) drawCellsDemo();
    const g = T.game;
    if (!g) return;
    g.update(dt, UI.input);
    if (UI.input.down && g.active && g.status === 'playing') T.tk.soft += dt;
    while (g.events.length) {
      const e = g.events.shift();
      if (e.type === 'toast') UI.toast((e.ico ? SB.ico(e.ico) + ' ' : '') + esc(e.text), e.bad ? 'bad' : '');
    }
    const cv = document.getElementById('tutBoard');
    if (!cv) return;
    const cs = T.cs || 24, dpr = Math.min(2, window.devicePixelRatio || 1);
    SB.Render.board(cv, g, cs * dpr);
    const cw = g.W * cs + 'px', ch = (g.H + 2) * cs + 'px';
    if (cv.style.width !== cw) { cv.style.width = cw; cv.style.height = ch; }
    const hc = document.getElementById('tutHold');
    if (hc) SB.Render.mini(hc, g.holds[0] ? g.holds[0].inst : null, 18, { alpha: g.holdUsed ? 0.4 : 1 });
    for (let i = 0; i < 3; i++) { const nc = document.getElementById('tutNext' + i); if (nc) SB.Render.mini(nc, g.queue[i], i === 0 ? 18 : 13); }
    const tl = document.getElementById('tutTally');
    if (tl && g.tally && g.tally.id !== T.lastTally) {
      T.lastTally = g.tally.id;
      const tt = g.tally;
      tl.innerHTML = `<div class="tut-tally-name">${esc(tt.name)}${tt.lines > 1 ? ` · ${tt.lines} lines` : ''}</div><div class="tut-tally-row"><span class="chips">${SB.fmt(tt.chips)} Mass</span> × <span class="mult">${SB.fmtX(tt.mult)} Charge</span> = <b>${SB.fmt(tt.score)}</b></div>`;
      tl.classList.remove('pop'); void tl.offsetWidth; tl.classList.add('pop');
    }
    renderSteps(false);
  };

  // ---------- actions ----------
  Object.assign(UI.act, {
    tutorial: () => { UI.closeModal(); UI.tutIdx = UI.tutIdx >= L.length ? 0 : UI.tutIdx; UI.show('tutorial'); UI.tutMount(); },
    tutGo: (d) => { UI.tutIdx = +d.i; UI.show('tutorial'); UI.tutMount(); },
    tutNext: () => { const l = L[UI.tutIdx]; if (l && !meta()[l.id]) { meta()[l.id] = true; SB.meta.save(); } UI.tutIdx = Math.min(L.length, UI.tutIdx + 1); UI.show('tutorial'); UI.tutMount(); },
    tutPrev: () => { UI.tutIdx = Math.max(0, UI.tutIdx - 1); UI.show('tutorial'); UI.tutMount(); },
    tutOrderSwap: () => {
      UI.tutOrderFlip = !UI.tutOrderFlip; UI.tutOrderSwapped = true;
      const el = document.getElementById('tutOrder');
      if (el) el.innerHTML = orderDemo();
      SB.audio.play('click');
    },
    tutReset: () => { const T = UI.tut, l = L[UI.tutIdx]; if (T && T.game && l) { resetBoard(T.game, l); SB.audio.play('click'); } if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); },
  });

  // leaving the tutorial drops the practice game and hands the random stream back
  const show0 = UI.show;
  UI.show = function (screen, data, keep) {
    if (UI.screen === 'tutorial' && screen !== 'tutorial' && UI.tut) {
      UI.tut.game = null;
      if (UI.tut.prevRng) { SB.rng = UI.tut.prevRng; UI.tut.prevRng = null; }
      UI.input = { left: false, right: false, down: false, lastDir: 0 };
    }
    return show0.call(UI, screen, data, keep);
  };
  window.addEventListener('resize', () => UI.tutSize());
})(window.SB);
