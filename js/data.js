// Stackbound content data: pieces, clear types, modifiers, relics, consumables, bosses, stages, upgrades
'use strict';
(function (SB) {
  // ---------- Piece shapes ----------
  // cells: [x,y] inside a box (y down). Tetrominoes use SRS spawn states.
  const S = (name, group, rarity, price, color, box, cells) => ({ name, group, rarity, price, color, box, cells });
  SB.SHAPES = {
    I: S('I', 'Tetromino', 'Starter', 3, '#35e6ff', 4, [[0, 1], [1, 1], [2, 1], [3, 1]]),
    O: S('O', 'Tetromino', 'Starter', 3, '#ffd83b', 2, [[0, 0], [1, 0], [0, 1], [1, 1]]),
    T: S('T', 'Tetromino', 'Starter', 3, '#b25cff', 3, [[1, 0], [0, 1], [1, 1], [2, 1]]),
    S: S('S', 'Tetromino', 'Starter', 3, '#4dff7c', 3, [[1, 0], [2, 0], [0, 1], [1, 1]]),
    Z: S('Z', 'Tetromino', 'Starter', 3, '#ff4d6a', 3, [[0, 0], [1, 0], [1, 1], [2, 1]]),
    L: S('L', 'Tetromino', 'Starter', 3, '#ff9a3b', 3, [[2, 0], [0, 1], [1, 1], [2, 1]]),
    J: S('J', 'Tetromino', 'Starter', 3, '#4f7bff', 3, [[0, 0], [0, 1], [1, 1], [2, 1]]),
    M1: S('Monomino', 'Small', 'Common', 2, '#ff7ad9', 1, [[0, 0]]),
    D2: S('Domino', 'Small', 'Common', 2, '#ff7ad9', 2, [[0, 0], [1, 0]]),
    I3: S('I-Tromino', 'Small', 'Common', 3, '#7af7ff', 3, [[0, 1], [1, 1], [2, 1]]),
    L3: S('L-Tromino', 'Small', 'Common', 3, '#ffb27a', 2, [[0, 0], [0, 1], [1, 1]]),
    I5: S('I5', 'Pentomino', 'Uncommon', 5, '#00c8ff', 5, [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]]),
    L5: S('L5', 'Pentomino', 'Uncommon', 4, '#ff8040', 4, [[3, 0], [0, 1], [1, 1], [2, 1], [3, 1]]),
    P: S('P', 'Pentomino', 'Common', 4, '#e0a0ff', 3, [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]]),
    T5: S('T5', 'Pentomino', 'Uncommon', 4, '#9d6bff', 3, [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]]),
    U: S('U', 'Pentomino', 'Uncommon', 4, '#ffe066', 3, [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]]),
    V: S('V', 'Pentomino', 'Uncommon', 4, '#66ffd1', 3, [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]]),
    N: S('N', 'Pentomino', 'Uncommon', 4, '#ff6699', 4, [[2, 0], [3, 0], [0, 1], [1, 1], [2, 1]]),
    Y: S('Y', 'Pentomino', 'Uncommon', 4, '#b3ff66', 4, [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1]]),
    F: S('F', 'Pentomino', 'Rare', 5, '#ff5ce1', 3, [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]]),
    W: S('W', 'Pentomino', 'Rare', 5, '#5cffb0', 3, [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]]),
    X: S('X (plus)', 'Pentomino', 'Rare', 5, '#ffffff', 3, [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]),
    Z5: S('Z5', 'Pentomino', 'Rare', 5, '#ff7070', 3, [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]]),
    ROD: S('Rod', 'Oddity', 'Rare', 7, '#00fff0', 6, [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2]]),
    STAIR: S('Staircase', 'Oddity', 'Rare', 6, '#ffc94d', 3, [[0, 0], [0, 1], [1, 1], [0, 2], [1, 2], [2, 2]]),
    BOLT: S('Lightning', 'Oddity', 'Rare', 6, '#fff35c', 4, [[2, 0], [3, 0], [1, 1], [2, 1], [0, 2], [1, 2]]),
    ARCH: S('Arch', 'Oddity', 'Rare', 7, '#c0c0ff', 3, [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]]),
    RING: S('Hollow Square', 'Oddity', 'Legendary', 9, '#ffd700', 3, [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]]),
    BIGO: S('Big O', 'Oddity', 'Legendary', 9, '#ffe680', 3, [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]]),
    CROSS: S('Great Cross', 'Oddity', 'Legendary', 10, '#ff3cff', 5, [[2, 0], [2, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [2, 3], [2, 4]]),
  };
  SB.TETROMINOES = ['I', 'O', 'T', 'S', 'Z', 'L', 'J'];

  // Precompute 4 rotation states (CW) for each shape
  for (const k in SB.SHAPES) {
    const sh = SB.SHAPES[k];
    const rots = [sh.cells.map((c) => c.slice())];
    for (let r = 1; r < 4; r++) rots.push(rots[r - 1].map(([x, y]) => [sh.box - 1 - y, x]));
    sh.rots = rots;
    sh.n = sh.cells.length;
    sh.key = k;
  }
  // Piece levels run 1-15 with a bonus at Lv5, Lv10 and Lv15. Every piece has the same base weight;
  // levels never change how often a piece shows up. Levels are kept for the run, except the temporary ones
  // (p.forged) from the Forge special and Gilded bag cells, which wear off when the Floor ends.
  SB.MAX_LEVEL = 15;
  SB.BASE_WEIGHT = 10;
  SB.pieceLv = (p) => Math.max(1, Math.min(SB.MAX_LEVEL, (p.level || 1) + (p.forged || 0)));
  SB.lvTier = (lv) => Math.min(3, Math.floor(lv / 5));
  SB.LV_COLORS = ['#fff', '#7fd4ff', '#ffd23b', '#ff8af3'];

  // SRS kick tables (converted to screen coords: +y is down)
  const flip = (t) => t.map(([x, y]) => [x, -y]);
  SB.KICKS_JLSTZ = {
    '0>1': flip([[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]),
    '1>0': flip([[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]),
    '1>2': flip([[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]),
    '2>1': flip([[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]),
    '2>3': flip([[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]),
    '3>2': flip([[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]),
    '3>0': flip([[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]),
    '0>3': flip([[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]),
  };
  SB.KICKS_I = {
    '0>1': flip([[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]]),
    '1>0': flip([[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]]),
    '1>2': flip([[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]),
    '2>1': flip([[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]),
    '2>3': flip([[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]]),
    '3>2': flip([[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]]),
    '3>0': flip([[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]),
    '0>3': flip([[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]),
  };
  SB.KICKS_GENERIC = [[0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [-2, 0], [2, 0], [0, 1], [0, -2]];
  SB.KICKS_180 = [[0, 0], [0, -1], [1, 0], [-1, 0], [1, -1], [-1, -1], [0, 1]];

  // ---------- Clear types ----------
  SB.CLEARS = {
    single: { name: 'Single', chips: 10, mult: 1, pc: 10, pm: 1, pattern: 'spark' },
    double: { name: 'Double', chips: 30, mult: 2, pc: 20, pm: 1, pattern: 'pair' },
    triple: { name: 'Triple', chips: 60, mult: 3, pc: 25, pm: 2, pattern: 'trine' },
    tetris: { name: 'Tetris', chips: 100, mult: 5, pc: 40, pm: 2, pattern: 'pillar' },
    tspin: { name: 'T-Spin', chips: 80, mult: 4, pc: 35, pm: 3, pattern: 'vortex' },
    allclear: { name: 'All Clear', chips: 150, mult: 8, pc: 60, pm: 4, pattern: 'zenith' },
    penta: { name: 'Penta', chips: 200, mult: 8, pc: 60, pm: 3, pattern: 'pentacle' },
  };
  SB.CLEAR_ORDER = ['single', 'double', 'triple', 'tetris', 'tspin', 'allclear', 'penta'];

  // ---------- Piece modifiers ----------
  SB.MATERIALS = {
    gold: { name: 'Gold', color: '#ffd23b', desc: '+$1 for every 4 Gold blocks cleared' },
    glass: { name: 'Glass', color: '#bfefff', desc: 'x1.5 Charge per Glass piece in a clear; 1 in 4 chance per clear to lose a level (shatters at Level 0)' },
    steel: { name: 'Steel', color: '#9fb3c8', desc: 'x1.2 Charge per Steel block still on the board when a line clears' },
    stone: { name: 'Stone', color: '#7d7466', desc: '+50 Mass per block, but the piece can\'t rotate' },
    lucky: { name: 'Clover', color: '#5dff8a', desc: '1 in 5: +20 Charge. 1 in 15: +$10 (per piece in the clear)' },
    holo: { name: 'Opal', color: '#ff8af3', desc: '+2 Charge per block cleared' },
    crystal: { name: 'Crystal', color: '#8ef0ff', desc: '+15 Mass per block cleared' },
    // only from The Egg hatching: never rolled, never offered
    yolk: { name: 'Yolk', color: '#ffc93c', secret: true, desc: 'Counts as every material at once (Gold, Glass, Steel, Stone, Clover, Opal and Crystal) with none of their downsides: it never loses levels and it still rotates' },
  };
  // materials that can be rolled or offered (Yolk only comes from The Egg)
  SB.MAT_KEYS = Object.keys(SB.MATERIALS).filter((k) => !SB.MATERIALS[k].secret);
  SB.pickMat = () => SB.weighted(SB.MAT_KEYS, (k) => SB.offerWeight(SB.MATERIALS, k));
  SB.matIs = (m, want) => m === want || (m === 'yolk' && want !== 'yolk');
  SB.BEHAVIORS = {
    sand: { name: 'Sand', icon: '', desc: 'After locking, its blocks fall individually into gaps below' },
    bomb: { name: 'Bomb', icon: '', desc: 'When one of its blocks clears, destroys a 3x3 area around it. Blocks left hanging fall into the crater' },
    anchor: { name: 'Anchor', icon: '', desc: "Can't hard drop, but clears it makes score x2" },
    floaty: { name: 'Floaty', icon: '', desc: 'Falls at half speed' },
  };
  // Special modifiers. lv scaling: v[0] at Lv1-4, v[1] at Lv5-9, v[2] at Lv10-14, v[3] at Lv15
  SB.SPECIALS = {
    coin: { name: 'Coin', icon: '', scope: 'Global', v: [1, 2, 3, 5], desc: (v) => `+$${v} when it locks` },
    catalyst: { name: 'Catalyst', icon: '', scope: 'Global', v: [2, 2.5, 3, 4], desc: (v) => `The next clear scores x${v}` },
    echo: { name: 'Echo', icon: '', scope: 'Global', v: [1, 1, 2, 3], desc: (v) => `The next ${v > 1 ? v + ' pieces are copies' : 'piece is a copy'} of this one` },
    herald: { name: 'Herald', icon: '', scope: 'Global', v: [5, 8, 12, 18], desc: (v) => `+${v} weight to a random piece type for the rest of the Stack` },
    hourglass: { name: 'Hourglass', icon: '', scope: 'Global', v: [10, 15, 20, 30], desc: (v) => `Gravity is halved for ${v} seconds and ${v} seconds go back on the clock` },
    scholar: { name: 'Tutor', icon: '', scope: 'Global', v: [1, 1, 2, 3], desc: (v) => `Levels up the clear type it's part of by ${v}` },
    forge: { name: 'Bellows', icon: '', scope: 'Global', v: [1, 1, 2, 3], desc: (v) => `+${v} level${v > 1 ? 's' : ''} to the next piece you place, until this Floor ends` },
    pact: { name: 'Pact', icon: '', scope: 'Global', v: [2, 2.5, 3, 4], desc: (v) => `x${v} Charge on every clear while it sits on the board; -$5 if it is still there when the Stack ends` },
    drill: { name: 'Drill', icon: '', scope: 'Area', v: [3, 5, 99, 99], desc: (v) => `On landing, the whole piece bores straight down ${v >= 99 ? 'to the floor' : v + ' rows'}, destroying every block in its path` },
    vacuum: { name: 'Vacuum', icon: '', scope: 'Area', v: [1, 2, 3, 4], desc: (v) => `On landing, deletes every block touching its underside${v > 1 ? ` (${v} deep)` : ''}, then settles into the gap` },
    mender: { name: 'Mender', icon: '', scope: 'Area', v: [1, 2, 3, 5], desc: (v) => `Fills ${v} nearby hole(s) with plain blocks` },
    prism: { name: 'Prism Shard', icon: '', scope: 'Area', v: [1, 1, 2, 3], desc: () => 'Cells it lands on become Prism cells (x1.5 Charge) for the rest of the Stack' },
    earthquake: { name: 'Earthquake', icon: '', scope: 'Board', v: [1, 1, 1, 1], desc: () => 'On lock, every block on the board falls as far as it can' },
    painter: { name: 'Painter', icon: '', scope: 'Board', v: [3, 5, 8, 12], desc: (v) => `Paints ${v} random cells Gold for the rest of the Stack` },
    lantern: { name: 'Lantern', icon: '', scope: 'Board', v: [2, 3, 4, 5], desc: (v) => `+${v} piece previews while on the board` },
    anchorstone: { name: 'Anchor Stone', icon: '', scope: 'Board', v: [2, 3, 4, 5], desc: (v) => `Speed level is ${v} lower while on the board` },
    temporal: { name: 'Stasis', icon: '', scope: 'Area', v: [2, 4, 6, 9], desc: (v) => `Lines holding its blocks wait in time until another line clears, then clear along with it and count toward that clear (+${v} Charge per held line)` },
  };
  SB.specialVal = (spec, level) => { const v = SB.SPECIALS[spec].v; return v[Math.min(v.length - 1, SB.lvTier(level || 1))]; };
  // Anything that levels pieces up turns up a third as often as its neighbours
  SB.LEVELERS = ['forge', 'ascend', 'gilded'];
  // Anything that multiplies (x Charge or x Mass) turns up half as often; entries carry .multi (set at the end of this file)
  SB.MULTI_WEIGHT = 0.5;
  SB.offerWeight = (table, k) => (SB.LEVELERS.includes(k) ? 1 / 3 : 1) * (table[k] && table[k].multi ? SB.MULTI_WEIGHT : 1);
  SB.pickKey = (table) => SB.weighted(Object.keys(table), (k) => SB.offerWeight(table, k));

  // ---------- Board cells ----------
  SB.CELLS = {
    gold: { name: 'Gold Cell', color: '#ffd23b', glyph: '$', desc: '+$2 when a line clears through it (once per Stack)' },
    prism: { name: 'Prism Cell', color: '#7cf8ff', desc: 'x1.5 Charge when a line clears through it' },
    furnace: { name: 'Furnace Cell', color: '#ff7a2e', desc: '+60 Mass, then burns out for the rest of this Stack and the next' },
    echo: { name: 'Echo Cell', color: '#c78bff', desc: "Retriggers the clear type's base Mass and Charge" },
    cracked: { name: 'Cracked Cell', color: '#d9c7a3', desc: 'The line above also clears' },
    lucky: { name: 'Clover Cell', color: '#5dff8a', desc: '1 in 3: +15 Charge' },
    ember: { name: 'Ember Cell', color: '#ff5a3c', desc: '+3 Charge, rising by 1 each time it triggers this run' },
    lens: { name: 'Lens Cell', color: '#a3e4ff', desc: 'x1.5 Mass when a line clears through it' },
    totem: { name: 'Totem Cell', color: '#e0b070', desc: '+2 Charge per curio you own (min +2)' },
    library: { name: 'Library Cell', color: '#ffe9a8', desc: 'Levels up the clear type that cleared it (once per Stack)' },
    frozen: { name: 'Frozen (curse)', color: '#9ad7ff', curse: true, desc: 'The line needs two clears to break' },
    void: { name: 'Void (curse)', color: '#30183f', curse: true, desc: 'The block on it scores 0' },
    thorn: { name: 'Thorn (curse)', color: '#8a3b3b', curse: true, desc: '-$1 when cleared' },
  };
  SB.BOARD_PACK_CELLS = ['gold', 'prism', 'furnace', 'echo', 'cracked', 'lucky', 'ember', 'lens', 'totem', 'library'];
  // how often each cell is offered (Board Packs, Brush); Prism is the strongest, so it comes up half as often (and multipliers half as often again)
  SB.CELL_WEIGHT = { prism: 0.5 };
  SB.rollCell = () => SB.weighted(SB.BOARD_PACK_CELLS, (k) => (SB.CELL_WEIGHT[k] || 1) * SB.offerWeight(SB.CELLS, k));
  SB.BOARD_UPGRADES = {
    well: { name: 'Well Column', desc: 'Pick a column: blocks in it score double mass', rare: false },
    overflow: { name: 'Overflow Lip', desc: 'Once per Stack, a top-out is forgiven by clearing the top of your stack', rare: true },
    wide: { name: 'Wide Board', desc: 'Board becomes 12 wide. +2 block mass per line, harder to fill', rare: true },
    narrow: { name: 'Narrow Board', desc: 'Board becomes 8 wide. Easy clears, base clear mass halved', rare: true },
    tall: { name: 'Tall Board', desc: 'Board becomes 24 rows tall. More room to stack', rare: true },
  };

  // ---------- Relics ----------
  // score(ctx): called on every clear, left to right. ctx.chips/mult/xmult/money add effects.
  // stat: passive numbers summed across relics. Other hooks: onStackEnd(run,res)->money, onStackStart(game), onClear(game,info)
  const R = (id, name, icon, rarity, tag, desc, hooks) => Object.assign({ id, name, icon, rarity, tag, desc }, hooks || {});
  const RL = [
    // ----- Common -----
    R('tetromancer', 'Tetromancer', '', 'Common', 'Clear', '+4 Charge on Tetris clears', { score: (c) => c.info.isTetris && c.mult(4) }),
    R('single_minded', 'Single Minded', '', 'Common', 'Clear', '+4 Charge on Singles', { score: (c) => c.info.lines === 1 && c.mult(4) }),
    R('double_trouble', 'Double Trouble', '', 'Common', 'Clear', '+40 Mass on Doubles', { score: (c) => c.info.lines === 2 && c.chips(40) }),
    R('third_time', 'Third Time', '', 'Common', 'Clear', '+6 Charge on Triples', { score: (c) => c.info.lines === 3 && c.mult(6) }),
    R('spinner', 'Whirligig', '', 'Common', 'Clear', '+5 Charge on T-Spins', { score: (c) => c.info.tspin && c.mult(5) }),
    R('clean_sheet', 'Clean Sheet', '', 'Common', 'Board', '+50 Mass if the board has no holes after the clear', { score: (c) => c.info.holes === 0 && c.chips(50) }),
    R('combo_breaker', 'Combo Breaker', '', 'Common', 'Clear', '+2 Charge per combo step', { score: (c) => c.info.combo > 0 && c.mult(2 * c.info.combo) }),
    R('back_to_back', 'Back to Back', '', 'Common', 'Clear', '+40 Mass on back-to-back Tetris or T-Spin', { score: (c) => c.info.b2b && c.chips(40) }),
    R('low_rider', 'Low Rider', '', 'Common', 'Board', '+4 Charge if the clear includes a line in the bottom 4 rows', { score: (c) => c.info.lowestYb < 4 && c.mult(4) }),
    R('high_wire', 'High Wire', '', 'Common', 'Board', '+8 Charge if the clear includes a line in the top 8 rows', { score: (c) => c.info.topFromTop < 8 && c.mult(8) }),
    R('speed_reader', 'Speed Reader', '', 'Common', 'Speed', '+1 Charge per speed level', { score: (c) => c.mult(c.info.level) }),
    R('quick_hands', 'Quick Hands', '', 'Common', 'Speed', '+2 Mass per hard drop this Stack', { score: (c) => c.chips(2 * c.game.hardDrops) }),
    R('left_hand', 'Portside', '', 'Common', 'Board', '+1 Charge per block cleared in the left 3 columns', { score: (c) => c.mult(c.info.cells.filter((k) => k.x < 3).length) }),
    R('right_hand', 'Starboard', '', 'Common', 'Board', '+1 Charge per block cleared in the right 3 columns', { score: (c) => c.mult(c.info.cells.filter((k) => k.x >= c.game.W - 3).length) }),
    R('centrist', 'Bullseye', '', 'Common', 'Board', '+5 Charge if the clearing piece lands in the middle 4 columns', { score: (c) => Math.abs(c.info.pieceCenterX - (c.game.W - 1) / 2) <= 1.5 && c.mult(5) }),
    R('collector', 'Menagerie', '', 'Common', 'Bag', '+1 Charge per distinct piece type in the Bag', { score: (c) => c.mult(new Set(c.run.pieces.map((p) => p.shape)).size) }),
    R('packrat', 'Packrat', '', 'Common', 'Bag', '+2 Mass per filled Bag cell', { score: (c) => c.chips(2 * c.run.pieces.reduce((a, p) => a + SB.SHAPES[p.shape].n, 0)) }),
    R('i_love_i', 'I Love I', '', 'Common', 'Bag', '+60 Mass when an I piece clears a line', { score: (c) => c.info.shape === 'I' && c.chips(60) }),
    R('square_deal', 'Square Deal', '', 'Common', 'Gold', '+$1 when an O piece clears a line', { score: (c) => c.info.shape === 'O' && c.money(1) }),
    R('t_time', 'T Time', '', 'Common', 'Bag', 'Clears with T pieces get +50 Mass', { score: (c) => c.info.shape === 'T' && c.chips(50) }),
    R('snake_charmer', 'Snake Charmer', '', 'Common', 'Bag', 'Clears with S and Z pieces get +4 Charge', { score: (c) => (c.info.shape === 'S' || c.info.shape === 'Z') && c.mult(4) }),
    R('elbow_grease', 'Elbow Grease', '', 'Common', 'Bag', 'Clears with L and J pieces get +4 Charge', { score: (c) => (c.info.shape === 'L' || c.info.shape === 'J') && c.mult(4) }),
    R('small_wonder', 'Small Wonder', '', 'Common', 'Bag', 'Clears with pieces of 3 or fewer cells get x1.5 Mass', { score: (c) => c.info.cellsN <= 3 && c.xchips(1.5) }),
    R('big_game', 'Big Game', '', 'Common', 'Bag', 'Clears with pieces of 5 or more cells get +6 Charge', { score: (c) => c.info.cellsN >= 5 && c.mult(6) }),
    R('gold_digger', 'Gold Digger', '', 'Common', 'Gold', 'Gold cells pay $3 instead of $2'),
    R('piggy_bank', 'Piggy Bank', '', 'Common', 'Gold', '+$2 savings cap', { stat: { interestCap: 2 } }),
    R('coupon', 'Punch Card', '', 'Common', 'Gold', 'Workshop restocks cost $1 less', { stat: { rerollDiscount: 1 } }),
    R('reroller', 'First Dibs', '', 'Common', 'Gold', 'First restock each Workshop is free', { stat: { freeReroll: 1 } }),
    R('garbage_man', 'Garbage Man', '', 'Common', 'Garbage', '+8 Mass per garbage block cleared', { score: (c) => c.chips(8 * c.info.garbageBlocks) }),
    R('recycler', 'Recycler', '', 'Common', 'Garbage', '+$1 per garbage row cleared', { score: (c) => c.money(c.info.garbageRows) }),
    R('shiny', 'Greenhouse', '', 'Common', 'Glass', '+2 Charge per Glass block on the board', { score: (c) => c.mult(2 * c.game.countBlocks((b) => SB.matIs(c.game.matOf(b), 'glass'))) }),
    R('early_bird', 'Early Bird', '', 'Common', 'Speed', '+50 Mass on clears in the first 30 seconds', { score: (c) => c.info.elapsed < 30 && c.chips(50) }),
    R('night_owl', 'Night Owl', '', 'Common', 'Speed', '+8 Charge on clears at speed level 8 or higher', { score: (c) => c.info.level >= 8 && c.mult(8) }),
    R('second_look', 'Second Look', '', 'Common', 'Bag', '+1 preview', { stat: { previews: 1 } }),
    R('stacker', 'High Rise', '', 'Common', 'Board', '+1 Charge per row of stack height when clearing', { score: (c) => c.mult(c.info.height) }),
    R('flat_earth', 'Flat Earth', '', 'Common', 'Board', '+50 Mass if the surface is level (within 1 row) after a clear', { score: (c) => c.info.flat && c.chips(50) }),
    R('perfectionist', 'Perfectionist', '', 'Common', 'Clear', 'All Clears give +$5', { score: (c) => c.info.allclear && c.money(5) }),
    R('counter', 'Odometer', '', 'Common', 'Clear', 'Every clear that crosses a multiple of 10 lines scores x2', { score: (c) => c.info.crossed10 && c.xmult(2) }),
    R('encore', 'Encore', '', 'Common', 'Clear', 'The first clear of each Stack scores x3', { score: (c) => c.game.clears === 0 && c.xmult(3) }),
    R('bird_in_hand', 'Bird in Hand', '', 'Common', 'Speed', '+$3 if you Bank without pushing', { onStackEnd: (run, res) => (res.pushAttempts === 0 ? 3 : 0) }),
    R('daredevil', 'Daredevil', '', 'Common', 'Speed', '+$2 per Push On attempted', { onStackEnd: (run, res) => 2 * res.pushAttempts }),
    R('alarm_clock', 'Alarm Clock', '', 'Common', 'Speed', '+45 seconds on every Stack clock', { stat: { clock: 45 } }),
    R('tip_jar', 'Tip Jar', '', 'Common', 'Gold', '+$1 per Push On completed', { onStackEnd: (run, res) => res.pushesDone }),
    R('penny_jar', 'Penny Jar', '', 'Common', 'Gold', '+$1 at the end of each Stack per $10 held', { onStackEnd: (run) => Math.floor(run.money / 10) }),
    R('fortune_cookie', 'Fortune Cookie', '', 'Common', 'Gold', '1 in 3 chance of a free Glyph after each Stack', { onStackEnd: (run, res, api) => { if (SB.chance(1 / 3)) api.giveRandomGlyph(); return 0; } }),
    R('tally', 'Tally', '', 'Common', 'Clear', '+1 Charge per 10 lines cleared this run', { score: (c) => c.mult(Math.floor(c.run.stats.lines / 10)) }),
    R('hoarder', 'Hoarder', '', 'Common', 'Bag', '+1 Charge per second your Hold piece has waited (max +25)', { score: (c) => c.mult(Math.min(25, Math.floor(c.game.holdAge()))) }),
    R('painters_kit', "Painter's Kit", '', 'Common', 'Board', 'Board Packs offer 4 choices instead of 3', { stat: { boardChoices: 1 } }),
    R('honeycomb', 'Honeycomb', '', 'Common', 'Board', '+2 Charge per hole left in your stack after the clear', { score: (c) => c.mult(2 * c.info.holes) }),
    R('hot_potato', 'Hot Potato', '', 'Common', 'Bag', '+8 Charge when the clearing piece came out of Hold', { score: (c) => c.info.fromHold && c.mult(8) }),
    // pass 29
    R('loupe', 'Loupe', '', 'Common', 'Board', 'Lens cells give x2 Mass instead of x1.5'),
    R('graffiti', 'Graffiti', '', 'Common', 'Board', '+2 Charge for every inscribed cell on your board', { score: (c) => c.mult(2 * Object.keys(c.run.board.cells).length) }),
    R('ledger', 'Ledger', '', 'Common', 'Gold', '+1 Charge for every $4 you hold', { score: (c) => c.mult(Math.floor(Math.max(0, c.run.money) / 4)) }),
    R('landfill', 'Landfill', '', 'Common', 'Garbage', '+1 Charge per garbage block on the board when you clear', { score: (c) => c.mult(c.game.countBlocks((b) => b.garbage)) }),
    // ----- Uncommon -----
    R('borrowed_time', 'Borrowed Time', '', 'Uncommon', 'Speed', 'Every Tetris puts 10 seconds back on the clock'),
    R('time_is_money', 'Time is Money', '', 'Uncommon', 'Speed', 'When you Bank, +$1 for every 30 seconds left on the clock (max $5)', { onStackEnd: (run, res) => (res.outcome === 'cash' ? Math.min(5, Math.floor((res.timeLeft || 0) / 30)) : 0) }),
    R('gravedigger', 'Gravedigger', '', 'Uncommon', 'Garbage', 'Garbage blocks score triple block mass'),
    R('lighthouse', 'The Lighthouse', '', 'Uncommon', 'Bag', '+1 preview; x1.5 Charge when the clearing piece matches the next piece', { stat: { previews: 1 }, score: (c) => c.info.shape === c.info.nextShape && c.xmult(1.5) }),
    R('speed_demon', 'Speed Demon', '', 'Uncommon', 'Speed', 'Up to x2.5 Charge: x0.15 more for each of your last 10 pieces placed in under 1.5 seconds', { score: (c) => c.xmult(1 + 0.15 * c.game.fastPieces()) }),
    R('glassworks', 'Glassworks', '', 'Uncommon', 'Glass', 'Glass blocks also give +10 Mass'),
    R('midas', 'Gilt Edge', '', 'Uncommon', 'Gold', 'Gold blocks also give +3 Charge each'),
    R('chain_reaction', 'Chain Reaction', '', 'Uncommon', 'Clear', 'Each combo step adds x0.2 Charge', { score: (c) => c.info.combo > 0 && c.xmult(1 + 0.2 * c.info.combo) }),
    R('overtime', 'Overtime', '', 'Uncommon', 'Speed', 'Score above the target, and everything scored while pushing, counts double'),
    R('brinkmanship', 'Brinkmanship', '', 'Uncommon', 'Speed', 'x2 Charge while the stack is within 5 rows of the top', { score: (c) => c.info.height >= c.game.H - 5 && c.xmult(2) }),
    R('heirloom', 'Heirloom', '', 'Uncommon', 'Bag', 'Your highest-level piece gains +8 weight'),
    R('underdog', 'Underdog', '', 'Uncommon', 'Bag', 'Clears with your lowest-level piece get x2 Mass', { score: (c) => { const min = Math.min(...c.run.pieces.map(SB.pieceLv)); return SB.pieceLv(c.info.piece) <= min && c.xchips(2); } }),
    R('mosaic', 'Mosaic', '', 'Uncommon', 'Board', 'x1.5 Charge if a cleared line holds 4 or more piece types', { score: (c) => Math.max(...c.info.lineTypes) >= 4 && c.xmult(1.5) }),
    R('rainbow_line', 'Rainbow Line', '', 'Uncommon', 'Board', 'x3 Charge if a cleared line holds 6 or more piece types', { score: (c) => Math.max(...c.info.lineTypes) >= 6 && c.xmult(3) }),
    R('spin_doctor', 'Spin Doctor', '', 'Uncommon', 'Clear', 'Any piece can spin: wedged rotations of any piece count as T-Spins', { stat: { allSpin: 1 } }),
    R('all_in', 'Blank Canvas', '', 'Uncommon', 'Clear', 'All Clears give x3 Charge', { score: (c) => c.info.allclear && c.xmult(3) }),
    R('quartermaster', 'Quartermaster', '', 'Uncommon', 'Bag', '+1 Hold slot', { stat: { holdSlots: 1 } }),
    R('vault', 'Vault', '', 'Uncommon', 'Gold', 'Savings pay $1 per $5 instead of $7', { stat: { vault: 1 } }),
    R('auctioneer', 'Auctioneer', '', 'Uncommon', 'Gold', 'Curios sell for full price', { stat: { sellFull: 1 } }),
    R('ripcord', 'Ripcord', '', 'Uncommon', 'Speed', 'Each Push On goal is 15% lower', { stat: { pushDiscount: 0.15 } }),
    R('juggernaut', 'Juggernaut', '', 'Uncommon', 'Speed', '+2 Charge per Push On completed this run', { score: (c) => c.mult(2 * c.run.stats.pushes) }),
    R('molten_core', 'Molten Core', '', 'Uncommon', 'Board', 'Furnace cells never turn to Ash'),
    R('echo_chamber', 'Echo Chamber', '', 'Uncommon', 'Board', 'Echo cells retrigger twice'),
    R('fault_line', 'Fault Line', '', 'Uncommon', 'Board', 'Cracked cells also clear the line below'),
    R('frost_heart', 'Frost Heart', '', 'Uncommon', 'Board', '+5 Charge per Frozen cell still frozen on the board', { score: (c) => c.mult(5 * c.game.frozenCount()) }),
    R('compost', 'Compost', '', 'Uncommon', 'Garbage', 'Each garbage row cleared gives +3 permanent Mass to all clears', { score: (c) => c.chips(c.run.compost) }),
    R('tight_fit', 'Half Dozen', '', 'Uncommon', 'Bag', 'x2 Charge if your Bag holds exactly 6 pieces', { score: (c) => c.run.pieces.length === 6 && c.xmult(2) }),
    R('pied_piper', 'Pied Piper', '', 'Uncommon', 'Bag', 'Pieces with a special modifier get +5 weight'),
    R('monoculture', 'Monoculture', '', 'Uncommon', 'Bag', 'x1.5 Charge per piece banned to 0%', { score: (c) => { const n = c.run.pieces.filter((p) => p.banned).length; return n && c.xmult(Math.pow(1.5, n)); } }),
    R('well_digger', 'Well Digger', '', 'Uncommon', 'Board', 'Clears through a Well column get x1.5 Charge', { score: (c) => c.info.wellHits > 0 && c.xmult(1.5) }),
    R('demolition', 'Demolition', '', 'Uncommon', 'Board', 'Bomb blasts score the blocks they destroy (+5 Mass each)', { score: (c) => c.chips(5 * c.info.bombed) }),
    R('steel_nerves', 'Steel Nerves', '', 'Uncommon', 'Board', 'Steel bonus rises to x1.3 per block'),
    R('feather', 'Feather', '', 'Uncommon', 'Gravity', 'Speed rises every 14 lines instead of 10', { stat: { linesPerLevel: 4 } }),
    R('pocket_watch', 'Snooze Button', '', 'Uncommon', 'Gravity', 'Each Stack starts 2 speed levels lower', { stat: { startLevel: -2 } }),
    R('overachiever', 'Overachiever', '', 'Uncommon', 'Clear', '+1 Charge for every 2 achievements earned', { score: (c) => c.mult(Math.floor((SB.Ach ? SB.Ach.count() : 0) / 2)) }),
    R('starting_gun', 'Starting Gun', '', 'Uncommon', 'Speed', 'x2 Charge on clears in the first 45 seconds', { score: (c) => c.info.elapsed < 45 && c.xmult(2) }),
    R('bedrock', 'Bedrock', '', 'Uncommon', 'Board', '+60 Mass when the clear includes the bottom row', { score: (c) => c.info.lowestYb === 0 && c.chips(60) }),
    R('amplifier', 'Amplifier', '', 'Uncommon', 'Clear', 'Triples the +Charge from the curio to its left'),
    R('scrap_metal', 'Scrap Metal', '', 'Uncommon', 'Gold', '+3 Charge for every curio you have sold this run', { score: (c) => c.mult(3 * (c.run.stats.sold || 0)) }),
    R('time_capsule', 'Time Capsule', '', 'Uncommon', 'Speed', 'Gains x0.5 Charge each time you Bank without pushing; a Push On empties it', { score: (c) => c.relic && c.relic.n > 0 && c.xmult(1 + 0.5 * c.relic.n) }),
    R('metronome', 'Metronome', '', 'Uncommon', 'Speed', 'x3 Charge on a clear made exactly 3 pieces after your last one', { score: (c) => c.info.gap === 3 && c.xmult(3) }),
    R('fools_gold', "Fool's Gold", '', 'Uncommon', 'Garbage', 'Garbage blocks count as Gold blocks'),
    R('slow_hand', 'Slow Hand', '', 'Uncommon', 'Gravity', "You can't hard drop; x2 Charge on every clear", { score: (c) => c.xmult(2) }),
    R('lodestone', 'Lodestone', '', 'Uncommon', 'Garbage', 'Garbage gaps line up under your first Well (or the left column); +5 Charge per garbage row cleared', { score: (c) => c.mult(5 * c.info.garbageRows) }),
    R('pinata', 'Pinata', '', 'Uncommon', 'Clear', 'Every 12th line you clear this run drops a free Glyph into your Pocket'),
    R('domino', 'Domino', '', 'Uncommon', 'Bag', '+3 Charge per clear in a row made with a different shape from the one before', { score: (c) => c.mult(3 * c.info.domino) }),
    R('last_stand', 'Last Stand', '', 'Uncommon', 'Speed', 'x3 Charge while 20 seconds or less are left on the clock', { score: (c) => c.game.timeLeft() <= 20 && c.xmult(3) }),
    // pass 29
    R('five_alarm', 'Five Alarm', '', 'Uncommon', 'Clear', 'x2 Charge on clears of 5 or more lines', { score: (c) => c.info.lines >= 5 && c.xmult(2) }),
    R('kaleidoscope', 'Kaleidoscope', '', 'Uncommon', 'Board', 'Prism cells give x2 Charge instead of x1.5'),
    R('hot_streak', 'Hot Streak', '', 'Uncommon', 'Clear', '+2 Charge for each clear of 2 or more lines in a row, this one included. A Single resets it', {
      score: (c) => c.info.lines >= 2 && c.relic && c.mult(2 * ((c.relic.n || 0) + 1)),
      afterClear: (g, info, r) => { r.n = info.lines >= 2 ? (r.n || 0) + 1 : 0; },
    }),
    R('chorus', 'Chorus', '', 'Uncommon', 'Clear', '+3 Charge for each curio that scored before it on this clear, repeats included', { score: (c) => c.fired > 0 && c.mult(3 * c.fired) }),
    R('jackpot', 'Jackpot', '', 'Uncommon', 'Gold', '1 in 4 chance on each clear: x4 Charge', { score: (c) => SB.chance(1 / 4) && c.xmult(4) }),
    // pass 27: one curio for winning each Hazard (achievements open them), and Paper Plane from Flutter
    R('still_water', 'Still Water', '', 'Uncommon', 'Speed', 'x2 Charge while the speed level is 3 or lower', { score: (c) => c.info.level <= 3 && c.xmult(2) }),
    R('lean_season', 'Lean Season', '', 'Uncommon', 'Gold', "Skipping a Stack also pays its base reward, plus $2"),
    R('tension_spring', 'Tension Spring', '', 'Uncommon', 'Clear', '+3 Charge for every clear since your last Tetris, paid out on your next Tetris', {
      score: (c) => c.info.isTetris && c.relic && c.relic.n > 0 && c.mult(3 * c.relic.n),
      afterClear: (g, info, r) => { r.n = info.isTetris ? 0 : (r.n || 0) + 1; },
    }),
    R('receipt', 'Receipt', '', 'Uncommon', 'Gold', '+1 Charge for every $2 you spent in the last Workshop', { score: (c) => c.run.lastSpent >= 2 && c.mult(Math.floor(c.run.lastSpent / 2)) }),
    R('paper_plane', 'Paper Plane', '', 'Uncommon', 'Gravity', '+1 Charge per row the clearing piece fell when hard dropped (max +20)', { score: (c) => c.info.fell > 0 && c.mult(Math.min(20, c.info.fell)) }),
    // ----- Rare -----
    R('chronoshard', 'Chronoshard', '', 'Rare', 'Speed', 'Every line cleared puts 2 seconds back on the clock'),
    R('safety_net', 'Safety Net', '', 'Rare', 'Speed', 'Once per run, a failed Push On pays the original target and base reward instead of ending the run'),
    R('event_horizon', 'Event Horizon', '', 'Rare', 'Gravity', 'Lines clear when all but 1 cell are filled', { stat: { eventHorizon: 1 } }),
    R('glass_cannon', 'Glass Cannon', '', 'Rare', 'Glass', 'x3 Charge on clears with Glass; Glass loses a level 1 in 2', { score: (c) => c.info.glassPieces > 0 && c.xmult(3) }),
    R('king_midas', 'King Midas', '', 'Rare', 'Gold', "Every clear gives +$1; you can't hold more than $30", { score: (c) => c.money(1) }),
    R('hedge_fund', 'Hedge Fund', '', 'Rare', 'Gold', 'Savings cap removed', { stat: { noInterestCap: 1 } }),
    R('tetris_tax', 'Tetris Tax', '', 'Rare', 'Gold', '+$3 per Tetris', { score: (c) => c.info.isTetris && c.money(3) }),
    R('living_board', 'Living Board', '', 'Rare', 'Board', 'Each Stack, one random empty cell becomes a Prism cell permanently', { onStackStart: (g) => g.run && SB.Run.livingBoard(g.run) }),
    R('stratosphere', 'Stratosphere', '', 'Rare', 'Gravity', 'The board is 4 rows taller', { stat: { extraRows: 4 } }),
    R('hall_of_fame', 'Hall of Fame', '', 'Rare', 'Clear', 'Your most-used clear type gets x2 Charge', { score: (c) => c.info.type === SB.Run.mostUsedClear(c.run) && c.xmult(2) }),
    R('tetris_supreme', 'Standing Ovation', '', 'Rare', 'Clear', 'Tetrises retrigger all curios once'),
    R('perfect_storm', 'Perfect Storm', '', 'Rare', 'Clear', 'All Clears level up every clear type by 1'),
    R('adrenaline', 'Adrenaline', '', 'Rare', 'Speed', 'Above speed level 5, x1.5 Charge, plus x0.5 more for each level after', { score: (c) => c.info.level > 5 && c.xmult(1 + 0.5 * (c.info.level - 5)) }),
    R('bullet_time', 'Bullet Time', '', 'Rare', 'Gravity', 'Gravity pauses for 3 seconds after every Tetris'),
    R('phoenix_feather', 'Phoenix Feather', '', 'Rare', 'Speed', 'Survive one top-out per run: the top 10 rows of your stack burn away'),
    R('cartographer', 'Cartographer', '', 'Rare', 'Board', 'Each Well column in a cleared line also counts as a Prism cell'),
    R('bribe', 'Bribe', '', 'Uncommon', 'Gold', "On the map, pay $5 to swap the Floor's Warden for a different one (once per Floor)"),
    R('windsock', 'Windsock', '', 'Rare', 'Board', 'You pick the weather: on the map, choose the modifier for Stack I and Stack II yourself (any this Floor allows, or none)'),
    R('ouroboros', 'Ouroboros', '', 'Rare', 'Clear', 'Combos never reset while you keep clearing within 3 pieces', { stat: { comboGrace: 2 } }),
    R('carry_on', 'Carry-On', '', 'Rare', 'Bag', 'Pieces in your Hold slots stay there for the next Stack'),
    R('mortar', 'Mortar', '', 'Rare', 'Board', 'Every clear fills the lowest hole in your stack'),
    R('trophy_case', 'Trophy Case', '', 'Rare', 'Gold', '+$1 at the end of each Stack for every 5 achievements earned (max $6)', { onStackEnd: () => Math.min(6, Math.floor((SB.Ach ? SB.Ach.count() : 0) / 5)) }),
    R('penthouse', 'Penthouse', '', 'Rare', 'Board', 'x4 Charge if the clear includes a line above the 16th row', { score: (c) => c.game.H - 1 - c.info.topFromTop >= 16 && c.xmult(4) }),
    R('groundswell', 'Groundswell', '', 'Rare', 'Garbage', 'A garbage row rises under your stack every 2 pieces; clears with garbage get x3 Charge', { score: (c) => c.info.garbageRows > 0 && c.xmult(3) }),
    R('bookends', 'Bookends', '', 'Rare', 'Clear', 'Your leftmost and rightmost curios score twice'),
    R('blindfold', 'Blindfold', '', 'Rare', 'Board', 'No ghost piece and no next-piece preview; x3 Charge', { score: (c) => c.xmult(3) }),
    R('kintsugi', 'Kintsugi', '', 'Rare', 'Glass', 'Each time Glass cracks: +$2, and this gains x0.25 Charge', { score: (c) => c.relic && c.relic.n > 0 && c.xmult(1 + 0.25 * c.relic.n) }),
    R('small_print', 'Small Print', '', 'Rare', 'Clear', 'Singles count as Tetrises'),
    R('matching_set', 'Matching Set', '', 'Rare', 'Clear', 'x3 Charge if all your other curios (3 or more) share one tag', { score: (c) => { const o = c.run.relics.filter((r) => r.id !== 'matching_set'); return o.length >= 3 && new Set(o.map((r) => SB.RELICS[r.id].tag)).size === 1 && c.xmult(3); } }),
    R('chameleon', 'Chameleon', '', 'Rare', 'Bag', "Each Stack it takes on the scoring effect of a random curio you don't own", { onStackStart: (g) => SB.Run.chameleon(g.run) }),
    R('hex_ward', 'Hex Ward', '', 'Rare', 'Board', 'Void cells give x2 Charge instead of scoring 0'),
    R('minimalist', 'Minimalist', '', 'Rare', 'Clear', 'x1.5 Charge for each empty curio slot', { score: (c) => { const n = SB.Run.relicSlots(c.run) - c.run.relics.length; return n > 0 && c.xmult(Math.pow(1.5, n)); } }),
    R('rush_order', 'Rush Order', '', 'Rare', 'Speed', 'Speed rises twice as fast; +3 Charge per speed level', { score: (c) => c.mult(3 * c.info.level) }),
    R('double_down', 'Double Down', '', 'Rare', 'Speed', 'x1.5 Charge for each Push On completed this Stack', { score: (c) => c.game.pushesDone > 0 && c.xmult(Math.pow(1.5, c.game.pushesDone)) }),
    R('empty_pockets', 'Empty Pockets', '', 'Rare', 'Gold', 'x2 Charge while you hold less than $5', { score: (c) => c.run.money < 5 && c.xmult(2) }),
    // pass 29: curios that make other curios score again
    R('tailwind', 'Tailwind', '', 'Rare', 'Clear', 'The curio to its right scores twice'),
    R('hindsight', 'Hindsight', '', 'Rare', 'Clear', 'The curio to its left scores twice'),
    R('curtain_call', 'Curtain Call', '', 'Rare', 'Clear', 'Clears of 5 or more lines retrigger all curios once'),
    R('keystone', 'Keystone', '', 'Rare', 'Clear', 'x3 Charge when it sits with as many curios on its left as on its right', { score: (c) => c.idx >= 0 && c.idx * 2 === c.run.relics.length - 1 && c.xmult(3) }),
    // ----- Legendary -----
    R('blueprint_ghost', 'Schematic Ghost', '', 'Legendary', 'Bag', 'Copies the scoring effect of the curio to its right, twice'),
    R('infinite_well', 'The Infinite Well', '', 'Legendary', 'Clear', 'Tetris clears level up Tetris by 1'),
    R('atlas', 'Atlas', '', 'Legendary', 'Board', 'Multiplies Charge by the number of curios you own (x5 with five)', { score: (c) => c.xmult(c.run.relics.length) }),
    R('clockmaker', 'The Clockmaker', '', 'Legendary', 'Gravity', 'Speed never rises above level 6', { stat: { maxLevel: 6 } }),
    R('omega', 'The Maw', '', 'Legendary', 'Clear', 'x5 Charge; one random other curio is destroyed each Floor', { score: (c) => c.xmult(5) }),
    R('the_crown', 'The Crown', '', 'Legendary', 'Gold', 'Warden Stacks pay double and give a Rare curio'),
    R('egg', 'The Egg', '', 'Legendary', 'Bag', '???'),
    R('philosophers_stone', 'Electrum', '', 'Legendary', 'Glass', 'All pieces count as Gold, Glass and Steel at once (Glass never shatters)'),
    R('devils_bargain', "Devil's Bargain", '', 'Legendary', 'Clear', "x8 Charge, but every clear's Mass is halved", { score: (c) => c.xchips(0.5) && c.xmult(8) }),
    // ----- Mythic: only ever offered in Endless -----
    R('devilled_egg', 'Devilled Egg', '', 'Mythic', 'Bag', 'Every 6 pieces, a random piece on your board turns to Yolk, and Yolk in a clear has triple the effect. Only found in Endless'),
  ];
  SB.RELICS = {};
  for (const r of RL) SB.RELICS[r.id] = r;
  SB.RELIC_PRICE = { Common: 5, Uncommon: 7, Rare: 9, Legendary: 14, Mythic: 20 };
  SB.RARITIES = ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythic'];
  // the chance that an Endless curio roll (Workshop shelf, Curio Cabinet) turns up a Mythic
  SB.MYTHIC_CHANCE = 0.03;
  // Workshop shelf packs. Weight decides how often each kind turns up.
  SB.PACKS = {
    piece: { name: 'Piece Pack', icon: '', price: 4, n: 3, desc: 'Pick 1 of 3 new pieces or upgrades', tip: 'Pick 1 of 3: a new special piece (must fit in your Bag) or an upgrade for a piece you own' },
    board: { name: 'Board Pack', icon: '', price: 4, n: 3, desc: 'Pick 1 of 3 cells or terrain', tip: 'Pick 1 of 3 cell enchantments, terrain or board upgrades, then place it on your board. The board keeps them for the whole run.' },
    jumbo_piece: { name: 'Crate of Pieces', icon: '', price: 6, n: 5, desc: 'Pick 1 of 5 pieces or upgrades', tip: 'A bigger Piece Pack: pick 1 of 5 new pieces or upgrades' },
    jumbo_board: { name: 'Terrain Crate', icon: '', price: 6, n: 5, desc: 'Pick 1 of 5 cells or terrain', tip: 'A bigger Board Pack: pick 1 of 5 cells, terrain or board upgrades' },
    pattern: { name: 'Pattern Scroll', icon: '', price: 4, n: 3, desc: 'Pick 1 of 3 Patterns, learned now', tip: 'Pick 1 of 3 Patterns. The one you pick levels up its clear type right away, no slot needed.' },
    relic: { name: 'Curio Cabinet', icon: '', price: 8, n: 3, desc: 'Pick 1 of 3 curios', tip: 'Pick 1 of 3 curios, with better odds of Uncommon and Rare. Needs a free curio slot.' },
    trophy: { name: 'Trophy Pack', icon: '', price: 7, n: 3, desc: 'Pick 1 of 3 trophy curios', tip: 'Pick 1 of 3 curios that achievements unlock. Needs a free curio slot.' },
  };
  // A Workshop visit sometimes has something going on.
  SB.SHOP_EVENTS = {
    sale: { icon: '', name: 'Sale day', desc: 'Everything on the shelves is 25% off this visit' },
    overstock: { icon: '', name: 'Delivery day', desc: 'An extra curio and an extra Pocket item on the shelves' },
    shipment: { icon: '', name: 'Rare shipment', desc: 'The first curio on the shelf is Uncommon or better' },
    surplus: { icon: '', name: 'Pack surplus', desc: 'An extra pack on the shelf' },
    tinker: { icon: '', name: 'Tinker day', desc: 'Forging a piece costs $2 less this visit' },
  };
  SB.TRANSFORMATIONS = {
    Clear: { name: 'Encore Master', desc: 'Your highest-level clear type scores x2' },
    Board: { name: 'Terraformer', desc: 'One free Board Pack every Workshop' },
    Bag: { name: 'Pack Mule', desc: '+2 previews and +1 Hold slot' },
    Gold: { name: 'Tycoon', desc: 'Savings double' },
    Speed: { name: 'Overclock', desc: 'x1.5 Charge on every clear, speed +2 levels' },
    Glass: { name: 'Stained Glass', desc: 'Glass never loses levels' },
    Garbage: { name: 'Scavenger', desc: 'Garbage blocks give +10 Mass each' },
    Gravity: { name: 'Shockwave', desc: 'Every 8th hard drop clears your highest partial line' },
  };

  // ---------- Consumables ----------
  SB.PATTERNS = {
    spark: { name: 'Spark', clear: 'single', icon: '' },
    pair: { name: 'Pair', clear: 'double', icon: '' },
    trine: { name: 'Trine', clear: 'triple', icon: '' },
    pillar: { name: 'Pillar', clear: 'tetris', icon: '' },
    vortex: { name: 'Vortex', clear: 'tspin', icon: '' },
    zenith: { name: 'Zenith', clear: 'allclear', icon: '' },
    pentacle: { name: 'Pentacle', clear: 'penta', icon: '' },
    chain: { name: 'Chain', clear: 'combo', icon: '' },
  };
  SB.GLYPHS = {
    gild: { name: 'Gild', icon: '', target: 'piece', mat: 'gold', desc: 'Make one piece Gold' },
    glaze: { name: 'Glaze', icon: '', target: 'piece', mat: 'glass', desc: 'Make one piece Glass' },
    temper: { name: 'Temper', icon: '', target: 'piece', mat: 'steel', desc: 'Make one piece Steel' },
    petrify: { name: 'Petrify', icon: '', target: 'piece', mat: 'stone', desc: 'Make one piece Stone' },
    fortune: { name: 'Sprout', icon: '', target: 'piece', mat: 'lucky', desc: 'Make one piece Clover' },
    shine: { name: 'Shine', icon: '', target: 'piece', mat: 'holo', desc: 'Make one piece Opal' },
    facet: { name: 'Facet', icon: '', target: 'piece', mat: 'crystal', desc: 'Make one piece Crystal' },
    forge: { name: 'Forge', icon: '', target: 'piece', desc: '+1 level to a piece' },
    ban: { name: 'Ban', icon: '', target: 'piece', desc: 'Toggle a piece to 0% (needs 6 playable pieces)' },
    brush: { name: 'Daub', icon: '', target: 'cell', desc: 'Paint one board cell with a random enchantment' },
    cleanse: { name: 'Cleanse', icon: '', target: null, desc: 'Remove every curse cell from the board' },
    expand: { name: 'Expand', icon: '', target: 'patch', desc: 'Add a free 2-cell patch to the Bag' },
    wealth: { name: 'Wealth', icon: '', target: null, desc: 'Double your money (max +$20)' },
    sweep: { name: 'Sweep', icon: '', target: null, live: true, desc: 'LIVE: clear the bottom row (scores nothing)' },
    swap: { name: 'Swap', icon: '', target: null, live: true, desc: 'LIVE: replace the falling piece with the next one' },
    freeze: { name: 'Freeze', icon: '', target: null, live: true, desc: 'LIVE: stop gravity and the clock for 6 seconds' },
    lift: { name: 'Lift', icon: '', target: null, live: true, desc: 'LIVE: remove the top 3 rows of your stack' },
  };
  // secret Pocket items: they never come from a shop or pack, and stay in the Pocket after use
  SB.SECRET_ITEMS = {
    love_letter: { name: 'Love Letter', icon: '', desc: 'Open it to play Falling for You. It stays in your Pocket.' },
  };
  SB.RIFTS = {
    widen: { name: 'Widen', icon: '', desc: 'Board +1 column permanently; destroy a random curio' },
    ascend: { name: 'Ascend', icon: '', desc: 'One random piece gets +5 levels for good; ban two others' },
    transmute: { name: 'Transmute', icon: '', desc: 'Give every piece the same random material' },
    summon: { name: 'Summon', icon: '', desc: 'Create a Legendary curio; -1 curio slot' },
    collapse: { name: 'Collapse', icon: '', desc: 'Board -1 column permanently; every clear type +2 levels' },
    rebirth: { name: 'Rebirth', icon: '', desc: 'Reforge all your curios into new ones of the same rarity' },
    hollow: { name: 'Hollow', icon: '', desc: 'Remove all empty Bag cells; +$2 per cell removed' },
    overload: { name: 'Overload', icon: '', desc: 'Gain a random Legendary oddity piece (if it fits); speed +1 level for the rest of the run' },
  };

  // ---------- Bosses ----------
  SB.BOSSES = {
    fog: { name: 'The Fog', icon: '', minAnte: 1, desc: 'No ghost piece and no next-piece preview' },
    tide: { name: 'The Tide', icon: '', minAnte: 1, desc: 'A garbage row rises every 8 pieces' },
    miser: { name: 'The Miser', icon: '', minAnte: 2, desc: 'Singles and Doubles score 0' },
    hunger: { name: 'The Hunger', icon: '', minAnte: 1, desc: 'I pieces have a 0% rate' },
    pillar: { name: 'The Divide', icon: '', minAnte: 2, desc: 'A wall splits the board. It counts as filled for line clears and never breaks. Pieces drop on either side' },
    mirror: { name: 'The Mirror', icon: '', minAnte: 2, desc: 'Left and right are swapped' },
    thief: { name: 'The Thief', icon: '', minAnte: 2, desc: 'Your leftmost curio is disabled' },
    glutton: { name: 'The Glutton', icon: '', minAnte: 3, desc: 'Your most upgraded piece has a 0% rate' },
    collector: { name: 'The Collector', icon: '', minAnte: 3, desc: 'Each Tetris costs $1' },
    ghost: { name: 'The Ghost', icon: '', minAnte: 4, desc: 'Locked blocks turn invisible after 4 seconds' },
    weaver: { name: 'The Weaver', icon: '', minAnte: 4, desc: 'Each clear leaves a random hole in the row below it' },
    taxman: { name: 'The Tax Man', icon: '', minAnte: 5, desc: 'Score above the target is halved; Push On is disabled' },
    shatter: { name: 'The Glazier', icon: '', minAnte: 5, desc: 'All your pieces count as Glass (and can shatter)' },
    hourglass: { name: 'The Deadline', icon: '', minAnte: 6, desc: 'Only 2 minutes on the clock' },
    monolith: { name: 'The Monolith', icon: '', finale: true, desc: 'FINALE: the board shrinks one column every 12 pieces' },
    clockwork: { name: 'The Clockwork', icon: '', finale: true, desc: 'FINALE: pieces lock instantly on landing' },
  };

  // ---------- Stage modifiers ----------
  SB.STAGE_MODS = {
    calm: { name: 'Calm Skies', tier: 1, desc: 'Start 1 speed level lower', money: -1 },
    rain: { name: 'Heavy Rain', tier: 1, desc: 'Pieces fall 25% faster', money: 3 },
    foggy: { name: 'Foggy', tier: 1, desc: 'Only 1 preview', money: 2 },
    goldrush: { name: 'Gold Rush', tier: 1, desc: '5 random cells are Gold for this Stack', money: 0 },
    windy: { name: 'Windy', tier: 1, desc: 'Every 12 seconds, the falling piece is blown one column', money: 2 },
    clutter: { name: 'Clutter', tier: 1, desc: 'The board starts with 3 garbage rows', money: 3 },
    squeeze: { name: 'Tight Squeeze', tier: 1, desc: 'The board is 1 column narrower', money: 3 },
    luckyday: { name: 'Lucky Day', tier: 1, desc: 'Every clear has a 1 in 3 chance of +10 Charge', money: 0 },
    rush: { name: 'Rush Hour', tier: 1, desc: 'Target 20% lower, but speed starts 3 levels higher', money: 2 },
    nohold: { name: 'No Hold', tier: 2, desc: 'Hold is disabled', money: 3 },
    iceage: { name: 'Ice Age', tier: 2, desc: 'Every line needs two clears to break', money: 4 },
    fastforward: { name: 'Fast Forward', tier: 2, desc: 'Start 5 speed levels higher', xmoney: 2 },
    risingfloor: { name: 'Rising Floor', tier: 2, desc: 'A garbage row rises every 12 pieces', money: 4 },
    risingfog: { name: 'Rising Fog', tier: 2, desc: 'Fog rises one row every 3 pieces and hides what it covers. Every scoring clear pushes it back down 2 rows', money: 4 },
    dryspell: { name: 'Dry Spell', tier: 2, desc: 'I pieces have half weight', money: 3 },
    inflation: { name: 'Inflation', tier: 2, desc: 'Target is 50% higher', money: 5, tag: true },
    shuffle: { name: 'Shuffle', tier: 2, desc: 'Piece rates are randomized for this Stack', money: 3 },
    singles: { name: 'Singles Night', tier: 2, desc: 'Only Singles score Charge; everything else scores Charge 1', money: 4 },
    doubletime: { name: 'Double Time', tier: 3, desc: 'Speed rises every 5 lines', money: 6 },
    lockdown: { name: 'Lockdown', tier: 3, desc: 'Pieces lock instantly when they touch the stack', money: 7 },
    cursed: { name: 'Cursed Ground', tier: 3, desc: '6 random cells become Void for this Stack', money: 6 },
    silent: { name: 'Silent Curios', tier: 3, desc: 'Your two rightmost curios are disabled', money: 7 },
    mirrorworld: { name: 'Mirror World', tier: 3, desc: 'Left and right are swapped', money: 6 },
    quake: { name: 'Earthquake Zone', tier: 3, desc: 'Every 30 seconds, all blocks fall as far as they can', money: 5 },
    jackpot: { name: 'Jackpot', tier: 3, desc: 'Target is doubled', xmoney: 3, rare: true },
    // the Stack clock
    extratime: { name: 'Extra Time', tier: 1, desc: '+1:30 on the clock', money: -1 },
    shortfuse: { name: 'Short Fuse', tier: 1, desc: 'Only 3 minutes on the clock', money: 3 },
    beattheclock: { name: 'Beat the Clock', tier: 2, desc: 'Only 2 minutes on the clock, but every line cleared adds 5 seconds', money: 3 },
    suddendeath: { name: 'Sudden Death', tier: 3, desc: 'Only 90 seconds on the clock, but the target is 40% lower', money: 5 },
  };

  // ---------- Blueprints ----------
  SB.BLUEPRINTS = {
    second_hold: { name: 'Second Hold', icon: '', desc: '+1 Hold slot' },
    third_hold: { name: 'Third Hold', icon: '', desc: '+1 more Hold slot', req: 'second_hold' },
    long_sight: { name: 'Long Sight', icon: '', desc: '+2 piece previews' },
    clairvoyance: { name: 'Clairvoyance', icon: '', desc: '+2 more previews', req: 'long_sight' },
    extra_socket: { name: 'Extra Socket', icon: '', desc: '+1 curio slot' },
    twin_socket: { name: 'Twin Socket', icon: '', desc: '+1 more curio slot', req: 'extra_socket' },
    satchel: { name: 'Satchel', icon: '', desc: '+1 Pocket slot' },
    backpack: { name: 'Backpack', icon: '', desc: '+1 more Pocket slot', req: 'satchel' },
    head_start: { name: 'Head Start', icon: '', desc: 'Every Stack starts at speed level 1' },
    slow_burn: { name: 'Slow Burn', icon: '', desc: 'Speed rises every 15 lines', req: 'head_start' },
    momentum: { name: 'Momentum', icon: '', desc: '25% of score above the target carries into the next Stack' },
    inertia: { name: 'Inertia', icon: '', desc: '50% carries over instead', req: 'momentum' },
    bargain_bin: { name: 'Bargain Bin', icon: '', desc: 'Workshop prices -25%' },
    wholesale: { name: 'Wholesale', icon: '', desc: 'Workshop prices -50%', req: 'bargain_bin' },
    tailors_shop: { name: "Tailor's Workshop", icon: '', desc: 'Bag Patches cost $2 less' },
    seed_money: { name: 'Rainy Day Fund', icon: '', desc: '+$2 savings cap' },
    long_fuse: { name: 'Long Fuse', icon: '', desc: '+30 seconds on every Stack clock' },
    scout: { name: "Scout's Report", icon: '', desc: 'On the map, Restock the modifier on Stack I or Stack II for $2' },
    trophy_shelf: { name: 'Trophy Shelf', icon: '', desc: '+1 curio on every Workshop shelf' },
    shift_change: { name: 'Shift Change', icon: '', price: 20, desc: "On the map, swap the Floor's Warden for a different one for $10 (once per Floor)" },
  };

  // ---------- Tags (skip rewards) ----------
  SB.TAGS = {
    coupon: { name: 'Gift Token', icon: '', desc: "Next Workshop's first curio is free" },
    double: { name: 'Payday Token', icon: '', desc: 'Double money from the next Stack' },
    rare: { name: 'Treasure Token', icon: '', desc: 'Next Workshop stocks a Rare curio' },
    pack: { name: 'Pack Token', icon: '', desc: 'A free Piece Pack in the next Workshop' },
    board: { name: 'Board Token', icon: '', desc: 'A free Board Pack in the next Workshop' },
    forge: { name: 'Forge Token', icon: '', desc: '+1 level to a random piece now' },
    pattern: { name: 'Pattern Token', icon: '', desc: 'Level up 2 random clear types now' },
    glyph: { name: 'Glyph Token', icon: '', desc: '2 free Glyphs (if you have room)' },
    safe: { name: 'Safe Token', icon: '', desc: "The next Stack's target is 25% lower" },
    investment: { name: 'Bounty Token', icon: '', desc: '+$15 after the next Warden' },
    economy: { name: 'Windfall Token', icon: '', desc: 'Double your money now (max +$15)' },
  };

  // ---------- Starters ----------
  SB.STARTERS = {
    architect: { name: 'The Architect', icon: '', desc: 'The 7 standard tetrominoes at Level 2. Classic Tetris, the tutorial build.', unlock: 'Unlocked' },
    miner: { name: 'The Miner', icon: '', desc: 'Gold cells in the bottom 3 rows and +$2 starting money. Dig down, get rich.', unlock: 'Unlocked' },
    glassblower: { name: 'The Glassblower', icon: '', desc: 'Every piece is Glass and Level 3. Huge Charge, shrinking Bag.', unlock: 'Reach Floor 3', check: (m) => m.bestAnte >= 3 },
    purist: { name: 'The Purist', icon: '', desc: 'Two each of I, O and T at Level 3, plus 2 Pattern levels on Tetris. Narrow and predictable.', unlock: 'Score 25 Tetrises (all runs)', check: (m) => m.tetrises >= 25 },
    alchemist: { name: 'The Alchemist', icon: '', desc: 'Sand behaviour on S and Z, and a free Glyph to start. Self-filling holes.', unlock: 'Use 12 Pocket items (all runs)', check: (m) => m.consumablesUsed >= 12 },
    giant: { name: 'The Giant', icon: '', desc: '12-wide board, 7x7 Bag with 4 pentominoes. Big mass, awkward clears.', unlock: 'Reach Floor 5', check: (m) => m.bestAnte >= 5 },
    gambler: { name: 'The Gambler', icon: '', desc: 'A random curio each Floor and a random board shape each Floor. Chaos.', unlock: 'Complete 10 Push Ons (all runs)', check: (m) => m.pushes >= 10 },
  };

  SB.STAKES = [
    null,
    { name: 'Hazard 1 · Calm', desc: 'Base game' },
    { name: 'Hazard 2 · Lean', desc: 'Stack I pays no base reward' },
    { name: 'Hazard 3 · Tense', desc: 'Targets +15%' },
    { name: 'Hazard 4 · Cursed', desc: 'One random cell is Void each Stack' },
    { name: 'Hazard 5 · Taxed', desc: 'Removal fees +$1' },
    { name: 'Hazard 6 · Sparse', desc: 'Workshops stock one fewer curio' },
    { name: 'Hazard 7 · Rushed', desc: 'Speed rises twice as fast' },
    { name: 'Hazard 8 · Greedy', desc: 'Push On goals 25% higher' },
    { name: 'Hazard 9 · Broke', desc: 'Savings cap is $3' },
    // the secret 10th: open once Hazards 1 to 9 have each been won (the Nine Circles achievement)
    { name: 'Hellscape', desc: 'Speed starts at 8, clears are worth half, and every Warden Stack has two Warden rules', secret: true },
  ];

  // ---------- Bag patches ----------
  SB.PATCHES = [
    { name: '1-cell nub', cells: [[0, 0]], price: 2 },
    { name: '2-cell bar', cells: [[0, 0], [1, 0]], price: 3 },
    { name: '3-cell L', cells: [[0, 0], [0, 1], [1, 1]], price: 4 },
    { name: '3-cell line', cells: [[0, 0], [1, 0], [2, 0]], price: 4 },
    { name: '4-cell square', cells: [[0, 0], [1, 0], [0, 1], [1, 1]], price: 5 },
    { name: '4-cell T', cells: [[0, 0], [1, 0], [2, 0], [1, 1]], price: 5 },
    { name: '5-cell plus', cells: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], price: 6 },
    { name: '5-cell U', cells: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]], price: 6 },
    { name: '6-cell slab', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], price: 7 },
  ];
  SB.BAG_BONUS = {
    gilded: { name: 'Gilded', color: '#ffd23b', desc: 'A piece packed on it gets +1 level until this Floor ends' },
    luckybag: { name: 'Clover', color: '#5dff8a', desc: 'A piece packed on it gets +3 weight' },
  };

  SB.ANTE_TARGETS = [0, 300, 1200, 3500, 9800, 25000, 60000, 130000, 270000];
  // Endless: each Floor past 8 multiplies the target by a growth that itself climbs (x3.3, x3.685, x4.07, ...)
  SB.ENDLESS_GROWTH = { start: 3.3, step: 0.385 };
  SB.STACK_KINDS = [
    { key: 'small', name: 'Stack I', mult: 1, reward: 3, par: 75 },
    { key: 'big', name: 'Stack II', mult: 1.5, reward: 4, par: 100 },
    { key: 'boss', name: 'Warden Stack', mult: 2, reward: 4, par: 120 },
  ];
  // Push On: the score resets and the clock gets +1:00; goal = this share of the Stack's target
  SB.PUSH_TIERS = [
    { name: 'I', goal: 0.6, money: 2 },
    { name: 'II', goal: 0.9, money: 6 },
    { name: 'III', goal: 1.3, money: 10, tag: true },
  ];
  // The Egg lifts the cap: past III every push asks for another quarter of the target and pays $3
  SB.EGG_HATCH = 15;
  // Rising Fog: one row per this many pieces, pushed back this many rows per scoring clear, never above this height
  SB.FOG = { every: 3, clear: 2, max: 15 };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  SB.pushTier = (i) => SB.PUSH_TIERS[i] || { name: ROMAN[i] || String(i + 1), goal: 1.3 + 0.25 * (i - 2), money: 3 };
  SB.STACK_CLOCK = 300;
  // Rival: an Endless Warden Stack modifier (see rival.js). pace = how much faster than your best it plays
  SB.RIVAL = { name: 'Rival', chance: 0.5, pace: 1.06, dig: 0.08, reward: 3,
    desc: 'A rival stacker plays beside you, a little faster than your best this run. You score nothing until you top it out: doubles and up, T-spins, back-to-backs and combos send it garbage. Its clears send garbage back. The clock keeps running.' };
  // Payout tuning: time bonus is $1 per `timeStep` seconds under par (max `timeCap`); Savings is $1 per `savePer` held (max `saveCap`)
  SB.ECON = { timeStep: 18, timeCap: 4, savePer: 7, vaultPer: 5, saveCap: 5 };

  // Which offers multiply (x Charge or x Mass): relics whose score hook multiplies, plus the listed specials, materials, behaviors and cells
  for (const id in SB.RELICS) { const d = SB.RELICS[id]; if (d.score && /\.x(mult|chips)\(/.test(String(d.score))) d.multi = true; }
  for (const id of ['cartographer', 'steel_nerves', 'tailwind', 'hindsight', 'curtain_call', 'kaleidoscope', 'loupe']) SB.RELICS[id].multi = true;
  for (const [t, ids] of [['SPECIALS', ['catalyst', 'pact', 'prism']], ['MATERIALS', ['glass', 'steel']], ['BEHAVIORS', ['anchor']], ['CELLS', ['prism', 'lens']]]) for (const id of ids) SB[t][id].multi = true;
})(window.SB);
