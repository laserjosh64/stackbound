// Stackbound Tetris engine: one Stack of play
'use strict';
(function (SB) {
  const HID = 4; // hidden rows above the visible board

  class Game {
    constructor(run, stack) {
      this.run = run;
      this.stack = stack;
      const st = (k) => SB.Run.stat(run, k);
      this.boss = stack.boss || null;
      // Hellscape: a second Warden rule at the same time
      this.boss2 = stack.boss2 || null;
      this.mod = stack.mod || null;
      this.W = run.board.w - (this.mod === 'squeeze' ? 1 : 0);
      this.H = run.board.h + st('extraRows');
      this.HID = HID;
      this.R = this.H + HID;
      this.grid = [];
      for (let r = 0; r < this.R; r++) this.grid.push(new Array(this.W).fill(null));
      this.blocked = new Set();
      if (this.isBoss('pillar')) this.blocked.add(Math.floor(this.W / 2));
      this.monolithSide = 0;

      // enchant layers
      this.tcells = {}; // temporary (this Stack only), key "x,yb"
      this.thawed = new Set();
      this.goldPaid = new Set();
      this.libraryUsed = false;
      this.frozenAll = this.mod === 'iceage';

      // scoring state
      this.target = stack.target;
      this.goal = this.target;
      this.score = stack.carry || 0;
      this.banked = 0; // score from rounds before the latest Push On
      this.pushTier = 0;
      this.pushesDone = 0;
      this.targetTime = null;
      // the Stack clock: run out before the goal and the Stack is lost
      this.timeLimit = stack.clock || SB.Run.stackClock(run, stack);
      this.clockUsed = 0;
      this.endReason = null;
      this.heldN = 0;
      this.combo = -1;
      this.noClearStreak = 0;
      this.lastDifficult = false;
      this.catalyst = 1;
      this.forgeNext = 0;
      this.clears = 0;
      this.lines = 0;
      this.hardDrops = 0;
      this.piecesPlaced = 0;
      this.money = 0;
      this.tally = null; // last score breakdown for UI
      this.events = []; // UI events (popups)
      this.particles = [];
      this.rings = []; // expanding shockwaves and ripples (board units)
      this.clearStyle = SB.Cosmetic ? SB.Cosmetic.clearStyle() : 'classic';
      this.fxq = []; // effects waiting their turn: chained blasts, drill dust row by row
      this.fxClock = 0;
      this.shake = 0;
      this.flashRows = [];
      this.cellPops = [];
      this.lockFlash = null;

      // timing
      this.time = 0;
      this.status = 'playing';
      this.outcome = null;
      this.gravAcc = 0;
      this.lockTimer = 0;
      this.lockResets = 0;
      this.softDropping = false;
      this.sdHeld = 0; this.sdRows = 0; this.sdLandP = null; this.sdLandY = null;
      this.slamFx = null;
      this.das = { dir: 0, t: 0, charged: false, arrAcc: 0 };
      this.held = { left: false, right: false };
      this.hourglassUntil = -1;
      this.freezeUntil = -1;
      this.bulletUntil = -1;
      this.windT = 0;
      this.quakeT = 0;
      this.overflowUsed = false;
      this.lockTimes = [];
      this.spawnTime = 0;
      this.ghostHidden = this.isBoss('fog') || this.has('blindfold');
      // Rival (Endless Warden modifier): garbage it sends waits in `incoming` until you lock a piece without clearing
      this.incoming = 0;
      this.rival = stack.rival && SB.Rival ? new SB.Rival(this, SB.rivalStyle(run)) : null;

      // piece generation
      this.tempWeight = {};
      this.credit = {};
      this.shuffleMul = {};
      if (this.mod === 'shuffle') for (const p of run.pieces) this.shuffleMul[p.uid] = 0.25 + SB.rand() * 2.5;
      this.queue = [];
      this.holds = []; // one entry per hold slot (empty slots are undefined); holdSel is the slot Hold swaps with
      this.holdSel = 0;
      this.holdUsed = false;
      // Carry-On: last Stack's held pieces are already waiting in their slots
      if (!this.sandbox && this.has('carry_on') && run.keptHolds) {
        run.keptHolds.slice(0, this.holdSlots()).forEach((uid, i) => { const p = uid === null ? null : run.pieces.find((q) => q.uid === uid); if (p) this.holds[i] = { inst: p, heldAt: 0 }; });
      }
      // Rising Fog: rows from the bottom hidden under fog (fogVis eases toward fogRows for drawing)
      this.fogRows = 0;
      this.fogVis = 0;

      // start level
      let start = SB.Run.startLevel(run, stack);
      this.startLevel = start;
      this.level = start;

      this.setupBoard();
      SB.Run.forEachRelic(run, (r) => r.onStackStart && r.onStackStart(this));
      this.spawn();
    }

    // ---------- helpers ----------
    stat(k) { return SB.Run.stat(this.run, k); }
    has(id) { return SB.Run.hasRelic(this.run, id); }
    yb(r) { return this.R - 1 - r; }
    key(x, r) { return x + ',' + (this.R - 1 - r); }
    cellAt(x, r) {
      const k = this.key(x, r);
      if (this.tcells[k]) return this.tcells[k];
      const c = this.run.board.cells[k];
      if (c === 'furnace' && this.run.board.ash[k] >= this.run.stackCount && !this.has('molten_core')) return 'ash';
      return c || null;
    }
    isFrozen(x, r) {
      const k = this.key(x, r);
      if (this.thawed.has(k)) return false;
      return this.frozenAll || this.cellAt(x, r) === 'frozen';
    }
    frozenCount() {
      let n = 0;
      for (let r = HID; r < this.R; r++) for (let x = 0; x < this.W; x++) if (this.cellAt(x, r) === 'frozen' && !this.thawed.has(this.key(x, r))) n++;
      return n;
    }
    isWell(x) { return this.run.board.wells.includes(x); }
    isBoss(id) { return this.boss === id || this.boss2 === id; }
    // Devilled Egg: one random piece already on the board turns to Yolk (all of its blocks)
    yolkify() {
      const pids = new Map();
      for (let r = 0; r < this.R; r++) for (let x = 0; x < this.W; x++) {
        const b = this.grid[r][x];
        if (b && !b.garbage && !b.plain && b.mat !== 'yolk' && b.pid !== undefined) { if (!pids.has(b.pid)) pids.set(b.pid, []); pids.get(b.pid).push([x, r, b]); }
      }
      if (!pids.size) return false;
      const blocks = SB.pick([...pids.values()]);
      for (const [x, r, b] of blocks) { b.mat = 'yolk'; this.burst(x, r, 'rainbow', 3); }
      SB.audio.play('glyph');
      this.emit('toast', { ico: SB.RELICS.devilled_egg.iconKey, text: 'Devilled Egg: a piece turned to Yolk' });
      return true;
    }
    matOf(b) {
      if (!b || b.garbage) return null;
      if (this.isBoss('shatter')) return 'glass';
      return b.mat || null;
    }
    instOf(b) { return b && this.run.pieces.find((p) => p.uid === b.uid); }
    countBlocks(fn) {
      let n = 0;
      for (let r = 0; r < this.R; r++) for (let x = 0; x < this.W; x++) { const b = this.grid[r][x]; if (b && fn(b)) n++; }
      return n;
    }
    boardHas(fn) {
      for (let r = 0; r < this.R; r++) for (let x = 0; x < this.W; x++) { const b = this.grid[r][x]; if (b && fn(b)) return true; }
      return false;
    }
    stackHeight() {
      for (let r = 0; r < this.R; r++) if (this.grid[r].some((b) => b)) return this.R - r;
      return 0;
    }
    holdAge() { const hs = this.holds.filter(Boolean); return hs.length ? this.time - Math.min(...hs.map((h) => h.heldAt)) : 0; }
    fastPieces() { return this.lockTimes.slice(-10).filter((t) => t < 1.5).length; }
    emit(type, data) { this.events.push(Object.assign({ type }, data || {})); }
    // themed particle bursts (board units). kinds: square, coin, shard, spark, chunk, clover, rainbow, star, dust, fire
    burst(x, r, kind, n, color) {
      if (this.particles.length > 900) return;
      const RB = ['#ff5ce1', '#5cf0ff', '#fff35c', '#5cff8a', '#ff9a3b', '#8a7bff'];
      for (let i = 0; i < n; i++) {
        const q = { x: x + Math.random(), y: r + Math.random(), vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 14 - 2, life: 0.5 + Math.random() * 0.6, color: color || '#fff', glow: true, size: 3 + Math.random() * 3, kind };
        switch (kind) {
          case 'coin': q.color = Math.random() < 0.5 ? '#ffd23b' : '#fff1a8'; q.vy = -Math.random() * 18 - 6; q.grav = 45; q.size = 5 + Math.random() * 3; q.rot = Math.random() * 6; q.vr = 12; q.life = 0.8 + Math.random() * 0.5; break;
          case 'shard': q.color = Math.random() < 0.5 ? '#e8fbff' : color || '#bfefff'; q.grav = 50; q.size = 5 + Math.random() * 5; q.rot = Math.random() * 6; q.vr = (Math.random() - 0.5) * 20; q.glow = false; q.life = 0.7 + Math.random() * 0.4; break;
          case 'spark': q.color = Math.random() < 0.5 ? '#ffd9a0' : '#ffffff'; q.vx *= 1.8; q.vy = -Math.random() * 10; q.grav = 25; q.size = 2 + Math.random() * 2; q.life = 0.3 + Math.random() * 0.3; q.streak = true; break;
          case 'chunk': q.color = Math.random() < 0.5 ? '#8a8072' : '#5e574d'; q.grav = 60; q.size = 4 + Math.random() * 4; q.glow = false; q.rot = Math.random() * 6; q.vr = (Math.random() - 0.5) * 10; break;
          case 'clover': q.color = Math.random() < 0.6 ? '#5dff8a' : '#d8ffe4'; q.grav = 8; q.drag = 0.3; q.life = 0.9 + Math.random() * 0.5; q.star = true; break;
          case 'rainbow': q.color = RB[(i + Math.floor(Math.random() * 6)) % 6]; q.size = 3 + Math.random() * 4; break;
          case 'star': q.color = Math.random() < 0.5 ? '#c8fbff' : '#ffffff'; q.grav = 4; q.drag = 0.25; q.star = true; q.size = 4 + Math.random() * 4; q.life = 0.6 + Math.random() * 0.6; break;
          case 'slam': { const side = Math.random() < 0.5 ? -1 : 1; q.y = r - Math.random() * 0.2; q.vx = side * (5 + Math.random() * 12); q.vy = -Math.random() * 3.5; q.grav = -1; q.drag = 0.06; q.size = 5 + Math.random() * 6; q.life = 0.35 + Math.random() * 0.35; q.color = 'rgba(225,235,255,0.75)'; q.glow = false; q.puff = true; break; }
          case 'skid': q.y = r - 0.05; q.vx = (Math.random() - 0.5) * 5; q.vy = -Math.random() * 2; q.grav = 0; q.drag = 0.2; q.size = 2 + Math.random() * 2; q.life = 0.2 + Math.random() * 0.15; q.color = 'rgba(200,225,255,0.7)'; break;
          case 'dust': q.color = 'rgba(200,210,230,0.6)'; q.grav = -2; q.drag = 0.2; q.vy = -Math.random() * 4; q.vx *= 0.5; q.size = 4 + Math.random() * 5; q.glow = false; q.puff = true; break;
          case 'fire': q.color = ['#ff4d2e', '#ff9a3b', '#ffd23b', '#ffffff'][Math.floor(Math.random() * 4)]; q.vx *= 2; q.vy = (Math.random() - 0.7) * 26; q.grav = 10; q.drag = 0.2; q.size = 4 + Math.random() * 5; q.life = 0.4 + Math.random() * 0.4; break;
          // v16 kinds
          case 'smoke': q.x = x + 0.5 + (Math.random() - 0.5) * 0.8; q.y = r + 0.5 + (Math.random() - 0.5) * 0.8; q.vx = (Math.random() - 0.5) * 3; q.vy = -1 - Math.random() * 2.5; q.grav = -1.5; q.drag = 0.35; q.size = 5 + Math.random() * 5; q.life = 0.7 + Math.random() * 0.6; q.color = color || (Math.random() < 0.5 ? 'rgba(70,64,80,0.75)' : 'rgba(110,100,115,0.65)'); q.glow = false; q.puff = true; break;
          case 'ember': q.x = x + 0.5; q.y = r + 0.5; { const a = Math.random() * Math.PI * 2, sp = 6 + Math.random() * 16; q.vx = Math.cos(a) * sp; q.vy = Math.sin(a) * sp - 6; } q.grav = 28; q.drag = 0.5; q.size = 1.5 + Math.random() * 1.8; q.life = 0.4 + Math.random() * 0.5; q.color = Math.random() < 0.5 ? '#ffb347' : '#fff1a8'; q.streak = true; break;
          case 'debris': q.color = color || '#8a8072'; q.vx = (Math.random() - 0.5) * 20; q.vy = -Math.random() * 16 - 3; q.grav = 55; q.size = 3 + Math.random() * 4; q.glow = false; q.rot = Math.random() * 6; q.vr = (Math.random() - 0.5) * 18; q.life = 0.6 + Math.random() * 0.4; break;
          case 'grit': q.x = x + Math.random(); q.y = r + Math.random() * 0.3; q.vx = (Math.random() - 0.5) * 9; q.vy = -Math.random() * 6 - 1; q.grav = 40; q.drag = 0.4; q.size = 1.2 + Math.random() * 1.6; q.glow = false; q.life = 0.35 + Math.random() * 0.35; q.color = Math.random() < 0.5 ? '#c9b89a' : '#8f826c'; break;
          case 'splat': q.vx = (Math.random() - 0.5) * 10; q.vy = -Math.random() * 9 - 2; q.grav = 40; q.drag = 0.3; q.size = 3 + Math.random() * 3; q.glow = false; q.life = 0.5 + Math.random() * 0.4; q.color = color || '#ffd23b'; break;
          case 'heal': q.vx = (Math.random() - 0.5) * 3; q.vy = -2 - Math.random() * 3; q.grav = -2; q.drag = 0.4; q.size = 4 + Math.random() * 3; q.life = 0.6 + Math.random() * 0.4; q.color = Math.random() < 0.6 ? '#7dffb0' : '#e6fff0'; break;
          case 'sand': q.vx = (Math.random() - 0.5) * 2; q.vy = Math.random() * 2; q.grav = 35; q.drag = 0.6; q.size = 1.2 + Math.random() * 1.4; q.glow = false; q.life = 0.4 + Math.random() * 0.4; q.color = Math.random() < 0.5 ? '#f2d68a' : '#c9a85a'; break;
          // clear effect kinds (Prize Counter)
          case 'confetti': q.color = RB[Math.floor(Math.random() * 6)]; q.vx *= 1.3; q.vy = -Math.random() * 18 - 6; q.grav = 18; q.drag = 0.45; q.size = 4 + Math.random() * 3.5; q.rot = Math.random() * 6; q.vr = (Math.random() - 0.5) * 26; q.glow = false; q.life = 1 + Math.random() * 0.7; break;
          case 'pixel': q.vx = (Math.random() - 0.5) * 3; q.vy = -1 - Math.random() * 3; q.grav = -3; q.drag = 0.5; q.size = 3 + Math.random() * 3; q.glow = false; q.life = 0.6 + Math.random() * 0.8; q.color = Math.random() < 0.2 ? '#ffffff' : color || '#fff'; break;
          case 'rocket': q.x = x; q.y = r + 0.5; q.vx = (Math.random() - 0.5) * 1.5; q.vy = -22; q.grav = 12; q.drag = 0.6; q.size = 2.5; q.life = 0.26; q.streak = true; q.color = color || '#ffe7a0'; break;
          case 'fw': { const a = (i / n) * Math.PI * 2 + Math.random() * 0.3, sp = 10 + Math.random() * 6; q.x = x; q.y = r; q.vx = Math.cos(a) * sp; q.vy = Math.sin(a) * sp; q.grav = 7; q.drag = 0.22; q.size = 3 + Math.random() * 2; q.life = 0.75 + Math.random() * 0.4; q.color = color; q.streak = true; break; }
          // v17 clear effect kinds (Prize Counter); size is in cells for the big ones
          case 'bigshard': { q.cell = true; q.size = 0.32 + Math.random() * 0.4; q.vx = (Math.random() - 0.5) * 14; q.vy = -Math.random() * 13 - 4; q.grav = 42; q.rot = Math.random() * 6; q.vr = (Math.random() - 0.5) * 16; q.glow = false; q.life = 0.8 + Math.random() * 0.5; q.pts = [0, 1, 2, 3].map((k) => { const a = (k / 4) * Math.PI * 2 + (Math.random() - 0.5) * 1.1; const d = 0.35 + Math.random() * 0.65; return [Math.cos(a) * d, Math.sin(a) * d]; }); q.color = color || '#e8fbff'; break; }
          case 'glitter': q.vx = (Math.random() - 0.5) * 6; q.vy = -Math.random() * 7 - 1; q.grav = 6; q.drag = 0.3; q.size = 2 + Math.random() * 2.5; q.life = 0.8 + Math.random() * 0.8; q.color = color || (Math.random() < 0.5 ? '#ffffff' : '#c8fbff'); q.tw = Math.random() * 20; break;
          case 'streamer': q.vx = (Math.random() - 0.5) * 12; q.vy = -Math.random() * 16 - 8; q.grav = 14; q.drag = 0.35; q.size = 2.4; q.len = 0.9 + Math.random() * 0.8; q.ph = Math.random() * 6; q.life = 1.2 + Math.random() * 0.6; q.color = RB[Math.floor(Math.random() * 6)]; q.glow = false; break;
          case 'popper': { const dir = x < this.W / 2 ? 1 : -1, a = -Math.PI / 2 + dir * (0.2 + Math.random() * 0.55), sp = 18 + Math.random() * 16; q.x = x + 0.5; q.y = r + 0.6; q.vx = Math.cos(a) * sp; q.vy = Math.sin(a) * sp; q.grav = 20; q.drag = 0.3; q.size = 5 + Math.random() * 4; q.rot = Math.random() * 6; q.vr = (Math.random() - 0.5) * 30; q.glow = false; q.life = 1.1 + Math.random() * 0.7; q.color = RB[Math.floor(Math.random() * 6)]; q.kind = 'confetti'; break; }
          case 'rain': q.x = x + Math.random() * 2; q.y = r - Math.random(); q.vx = (Math.random() - 0.5) * 3; q.vy = 2 + Math.random() * 5; q.grav = 6; q.drag = 0.6; q.size = 5 + Math.random() * 3; q.rot = Math.random() * 6; q.vr = (Math.random() - 0.5) * 20; q.glow = false; q.life = 1.4 + Math.random() * 0.6; q.color = RB[Math.floor(Math.random() * 6)]; q.kind = 'confetti'; break;
          case 'cinder': q.vx = (Math.random() - 0.5) * 10; q.vy = -Math.random() * 10 - 3; q.grav = 30; q.drag = 0.4; q.size = 3 + Math.random() * 3; q.life = 0.5 + Math.random() * 0.4; q.color = color || '#9fd8ff'; q.emit = 'spark'; q.glow = true; q.kind = 'square'; break;
          case 'crackle': q.x = x + (Math.random() - 0.5) * 4.5; q.y = r + (Math.random() - 0.5) * 4; q.vx = 0; q.vy = 0.5; q.grav = 0; q.size = 4 + Math.random() * 4; q.life = 0.12 + Math.random() * 0.12; q.color = '#ffffff'; q.kind = 'star'; break;
          case 'willow': { const a = Math.random() * Math.PI * 2, sp = 6 + Math.random() * 7; q.x = x; q.y = r; q.vx = Math.cos(a) * sp; q.vy = Math.sin(a) * sp - 2; q.grav = 6; q.drag = 0.18; q.size = 2.6 + Math.random() * 1.2; q.life = 1.1 + Math.random() * 0.6; q.color = color || '#ffd27a'; q.streak = true; q.emit = 'ash'; q.kind = 'fw'; break; }
          case 'fwring': { const a = (i / n) * Math.PI * 2, sp = 13; q.x = x; q.y = r; q.vx = Math.cos(a) * sp; q.vy = Math.sin(a) * sp * 0.75; q.grav = 4; q.drag = 0.2; q.size = 3.5; q.life = 0.85; q.color = color; q.streak = true; q.kind = 'fw'; break; }
          case 'swirl': {
            // pixels drawn into a rising vortex round the middle of the row
            const cx = this.W / 2, cy = r + 0.5, dx = q.x - cx, dy = (q.y - cy) / 0.45 + (Math.random() - 0.5) * 0.4;
            q.swirl = true; q.cx = cx; q.cy = cy; q.ang = Math.atan2(dy, dx); q.rad = Math.hypot(dx, dy); q.w = (r % 2 ? 1 : -1) * (3.5 + Math.random() * 2.5);
            q.dr = -q.rad * (0.7 + Math.random() * 0.4); q.rise = -(2.2 + Math.random() * 2.4); q.size = 3 + Math.random() * 3.5; q.glow = Math.random() < 0.4;
            q.life = 0.8 + Math.random() * 0.5; q.color = Math.random() < 0.18 ? (Math.random() < 0.5 ? '#5cf0ff' : '#ff5ce1') : color || '#fff'; q.kind = 'pixel'; break;
          }
          case 'suck': { const a = Math.random() * Math.PI * 2, d = 0.8 + Math.random() * 1.2; q.x = x + 0.5 + Math.cos(a) * d; q.y = r + 0.5 + Math.sin(a) * d; q.tx = x + 0.5; q.ty = r + 0.5; q.vx = 0; q.vy = 0; q.grav = 0; q.size = 2 + Math.random() * 2; q.life = 0.35 + Math.random() * 0.25; q.color = color || '#c9d6ff'; q.streak = true; break; }
        }
        this.particles.push(q);
      }
    }

    // an expanding ring: blasts, ripples, shockwaves (board units; r = final radius in cells)
    // mode 'fill' is a bright flash disc, 'in' collapses inward (suction)
    ring(x, y, r, color, dur, width, mode) { if (this.rings.length < 120) this.rings.push({ x, y, r, color: color || '#fff', t: 0, max: dur || 0.35, w: width || 3, mode }); }
    later(delay, fn) { this.fxq.push({ at: this.fxClock + delay, fn }); }
    // one blast of a bomb: flash ring, fire, embers, smoke and the blocks it breaks flying as debris
    blast(x, r, power, color) {
      this.ring(x + 0.5, r + 0.5, 1.1 * power, '#ffcf6a', 0.22, 0, 'fill');
      this.ring(x + 0.5, r + 0.5, 1.6 * power, '#ffd27a', 0.32, 4);
      this.ring(x + 0.5, r + 0.5, 0.9 * power, '#ffffff', 0.18, 6);
      this.burst(x, r, 'fire', Math.round(8 * power));
      this.burst(x, r, 'ember', Math.round(7 * power));
      this.burst(x, r, 'smoke', Math.round(4 * power));
      if (color) this.burst(x, r, 'debris', 3, color);
    }
    // a rocket that climbs from (x, r) to row ty in `dur` seconds, leaving a sparkling trail
    rocket(x, r, ty, dur) {
      this.particles.push({ kind: 'rocket', x, y: r + 0.5, vx: (Math.random() - 0.5) * 1.2, vy: (ty - r - 0.5) / dur, grav: 0, life: dur, size: 3, streak: true, glow: true, emit: 'glint', color: '#ffe7a0' });
    }
    // a firework shell. Patterns: peony, glitter chrysanthemum that crackles, gold willow, ring
    firework(x, y, pat) {
      const FW = ['#ff5ce1', '#5cf0ff', '#fff35c', '#5cff8a', '#ff9a3b', '#b8a8ff', '#ff5c6a'];
      const a = FW[Math.floor(Math.random() * FW.length)], b = FW[Math.floor(Math.random() * FW.length)];
      pat = pat === undefined ? Math.floor(Math.random() * 4) : pat % 4;
      this.ring(x, y, 1.1, '#fff6d8', 0.14, 0, 'fill');
      this.ring(x, y, 3.2, a, 0.45, 2);
      if (pat === 0) { this.burst(x, y, 'fw', 30, a); this.burst(x, y, 'fw', 14, b); }
      else if (pat === 1) {
        this.burst(x, y, 'fw', 30, a);
        for (const q of this.particles.slice(-30)) q.emit = 'glint';
        for (let k = 0; k < 3; k++) this.later(0.42 + k * 0.08, () => this.burst(x - 0.5, y - 0.5, 'crackle', 6));
      } else if (pat === 2) this.burst(x, y, 'willow', 34, '#ffd27a');
      else { this.burst(x, y, 'fwring', 26, a); this.burst(x, y, 'fw', 8, '#ffffff'); }
      this.burst(x - 0.5, y - 0.5, 'star', 3);
    }
    // the look of a line clear, set by the clear effect equipped at the Prize Counter.
    // Material and garbage blocks keep their own bursts so the board still says what broke.
    // Bigger clears get more of everything; four lines or more add a finale.
    clearFx(rows, cells, style) {
      style = style || this.clearStyle || 'classic';
      const n = rows.length, big = n >= 4, W = this.W;
      const dur = { shatter: 0.45, confetti: 0.5, lightning: 0.45, fireworks: 0.4, dissolve: 0.65, hellfire: 0.6 }[style] || 0.25;
      for (const r of rows) this.flashRows.push({ r, t: dur, max: dur, color: '#ffffff', style, seed: Math.random() * 1000, n });
      const top = Math.min(...rows), mid = (top + Math.max(...rows)) / 2 + 0.5;
      for (const c of cells) {
        const m = this.matOf(c.b);
        if (c.b.garbage || m) {
          const kind = c.b.garbage ? 'chunk' : ({ gold: 'coin', glass: 'shard', steel: 'spark', stone: 'chunk', lucky: 'clover', holo: 'rainbow', crystal: 'star', yolk: 'rainbow' })[m] || 'square';
          this.burst(c.x, c.r, kind, 5, c.b.color);
          continue;
        }
        if (style === 'shatter') { this.burst(c.x, c.r, 'bigshard', 2, c.b.color); this.burst(c.x, c.r, 'bigshard', 1, '#e8fbff'); this.burst(c.x, c.r, 'glitter', 2); }
        else if (style === 'confetti') { this.burst(c.x, c.r, 'confetti', 4); if (Math.random() < 0.35) this.burst(c.x, c.r, 'streamer', 1); }
        else if (style === 'lightning') { this.burst(c.x, c.r, 'spark', 4); this.burst(c.x, c.r, 'cinder', 3, c.b.color); }
        else if (style === 'fireworks') { this.burst(c.x, c.r, 'square', 2, c.b.color); this.burst(c.x, c.r, 'glitter', 2, '#ffe7a0'); }
        else if (style === 'dissolve') this.burst(c.x, c.r, 'swirl', 9, c.b.color);
        else if (style === 'hellfire') { this.burst(c.x, c.r, 'fire', 4); this.burst(c.x, c.r, 'cinder', 2, c.b.color); if (Math.random() < 0.4) this.burst(c.x, c.r, 'smoke', 1); }
        else this.burst(c.x, c.r, 'square', 4, c.b.color);
      }
      if (style === 'shatter') {
        rows.forEach((r) => { const x = 1 + Math.random() * (W - 2); this.ring(x, r + 0.5, 0.9, '#ffffff', 0.16, 0, 'fill'); this.ring(x, r + 0.5, 1.8 + n * 0.4, '#dff6ff', 0.34, 3); });
        if (big) {
          this.flashRows.push({ r: mid - 0.5, t: 0.25, max: 0.25, style: 'boardflash', color: '#e6fbff' });
          this.ring(W / 2, mid, W * 0.75, '#bff3ff', 0.5, 5);
          this.later(0.1, () => rows.forEach((r) => this.burst(Math.random() * (W - 1), r, 'bigshard', 4, '#dff6ff')));
        }
        this.shake = Math.max(this.shake, 2 + n);
      } else if (style === 'confetti') {
        // party poppers fire up and inward from both bottom corners of the board
        const pops = Math.min(6, n + (big ? 2 : 0));
        for (let i = 0; i < pops; i++) this.later(i * 0.1, () => { this.burst(0, this.R - 1, 'popper', 9 + n * 2); this.burst(W - 1, this.R - 1, 'popper', 9 + n * 2); this.burst(0, this.R - 1, 'streamer', 2); this.burst(W - 1, this.R - 1, 'streamer', 2); });
        this.ring(W / 2, mid, W * 0.45, '#fff35c', 0.3, 0, 'fill');
        if (big) this.later(0.35, () => { for (let k = 0; k < 5; k++) this.burst(W * (0.1 + k * 0.2), this.HID, 'rain', 12); });
      } else if (style === 'lightning') {
        // a bolt strikes each cleared row from the top of the board, then the whole board flashes
        rows.slice(0, 4).forEach((r, i) => {
          const x = 0.8 + Math.random() * (W - 1.6);
          this.flashRows.push({ r, t: dur, max: dur, style: 'strike', x, seed: Math.random() * 1000, delay: i * 0.05 });
          this.later(i * 0.05, () => { this.burst(x - 0.5, r, 'spark', 12); this.ring(x, r + 0.5, 1.5, '#bfe6ff', 0.24, 0, 'fill'); this.ring(x, r + 0.5, 2.4, '#8fd3ff', 0.32, 2); });
        });
        this.flashRows.push({ r: mid - 0.5, t: 0.3, max: 0.3, style: 'boardflash', color: '#bfe2ff' });
        if (big) this.later(0.17, () => { this.flashRows.push({ r: mid - 0.5, t: 0.24, max: 0.24, style: 'boardflash', color: '#ffffff' }); this.shake = Math.max(this.shake, 10); });
        this.shake = Math.max(this.shake, 5 + n * 1.5);
      } else if (style === 'fireworks') {
        const shells = Math.min(9, 2 * n + (big ? 2 : 0));
        for (let i = 0; i < shells; i++) {
          const r = rows[i % n], x = 1.2 + Math.random() * (W - 2.4), y = Math.max(this.HID + 1.2, r - 2.5 - Math.random() * 4);
          this.later(i * 0.12, () => this.rocket(x, r, y, 0.32));
          this.later(i * 0.12 + 0.32, () => this.firework(x, y, i));
        }
        if (big) this.later(shells * 0.12 + 0.4, () => {
          this.flashRows.push({ r: mid - 0.5, t: 0.3, max: 0.3, style: 'boardflash', color: '#ffd98a' });
          for (let k = 0; k < 4; k++) this.firework(W * (0.15 + k * 0.23), this.HID + 1.5 + Math.random() * 3, k);
        });
      } else if (style === 'hellfire') {
        // the rows burn: flames lick up from each one, embers rise after, and the board shakes
        rows.forEach((r, i) => this.later(i * 0.04, () => { for (let x = 0; x < W; x += 2) this.burst(x, r, 'ember', 2); }));
        this.later(0.18, () => rows.forEach((r) => { for (let k = 0; k < 3; k++) this.burst(Math.random() * (W - 1), r - 1, 'fire', 3); }));
        this.ring(W / 2, mid, W * 0.55, '#ff7a1c', 0.36, 0, 'fill');
        if (big) {
          this.flashRows.push({ r: mid - 0.5, t: 0.35, max: 0.35, style: 'boardflash', color: '#ff6a2a' });
          this.later(0.12, () => { for (let k = 0; k < 6; k++) this.burst(W * (0.08 + k * 0.17), this.R - 1, 'fire', 6); });
        }
        this.shake = Math.max(this.shake, 3 + n * 1.5);
      } else if (style === 'dissolve') {
        this.ring(W / 2, mid, W * 0.6, '#7af7ff', 0.5, 2, 'in');
        this.later(0.45, () => rows.forEach((r) => this.burst(W / 2 - 0.5, r - 1.5, 'glitter', 6, '#aef9ff')));
        if (big) this.flashRows.push({ r: mid - 0.5, t: 0.4, max: 0.4, style: 'glitch', seed: Math.random() * 1000 });
      }
    }

    setupBoard() {
      const run = this.run;
      const visRows = [];
      for (let r = HID; r < this.R; r++) visRows.push(r);
      const randCells = (n, fromRow) => {
        const out = [];
        let guard = 0;
        while (out.length < n && guard++ < 500) {
          const x = SB.randInt(0, this.W - 1);
          const r = SB.randInt(Math.max(HID, fromRow || HID), this.R - 1);
          const k = this.key(x, r);
          if (this.blocked.has(x) || out.includes(k) || this.run.board.cells[k] || this.tcells[k]) continue;
          out.push(k);
        }
        return out;
      };
      if (this.mod === 'goldrush') for (const k of randCells(5, this.R - 10)) this.tcells[k] = 'gold';
      if (this.mod === 'cursed') for (const k of randCells(6, this.R - 12)) this.tcells[k] = 'void';
      if (run.stake >= 4) for (const k of randCells(1, this.R - 10)) this.tcells[k] = 'void';
      if (this.mod === 'clutter') this.addGarbage(3, true);
    }

    // ---------- piece pool ----------
    poolWeights() {
      const run = this.run;
      let pieces = run.pieces.filter((p) => !p.banned);
      if (this.isBoss('hunger')) pieces = pieces.filter((p) => p.shape !== 'I');
      if (this.isBoss('glutton') && pieces.length > 1) {
        const maxL = Math.max(...pieces.map(SB.pieceLv));
        const top = pieces.find((p) => SB.pieceLv(p) === maxL);
        pieces = pieces.filter((p) => p !== top);
      }
      if (!pieces.length) pieces = run.pieces.slice();
      const heirloomTarget = this.has('heirloom') ? run.pieces.reduce((a, p) => (!a || SB.pieceLv(p) > SB.pieceLv(a) ? p : a), null) : null;
      const out = pieces.map((p) => {
        let w = SB.BASE_WEIGHT;
        w += SB.Run.bagBonusWeight(run, p);
        if (p === heirloomTarget) w += 8;
        if (this.has('pied_piper') && (p.special || p.behavior)) w += 5;
        w += this.tempWeight[p.shape] || 0;
        if (this.mod === 'dryspell' && p.shape === 'I') w *= 0.5;
        if (this.shuffleMul[p.uid]) w *= this.shuffleMul[p.uid];
        return { p, w };
      });
      return out;
    }
    // Every piece earns its share (the % the Bag shows) each roll and pays 1 when it comes up, and the roll leans
    // toward pieces that are owed. Over a Stack each piece comes up at its shown rate, with fewer floods and droughts.
    rollPiece() {
      const ws = this.poolWeights();
      const total = ws.reduce((a, o) => a + o.w, 0);
      if (!ws.length || total <= 0) return ws.length ? SB.pick(ws).p : { uid: -1, shape: 'T', level: 1 };
      const cr = this.credit;
      for (const o of ws) cr[o.p.uid] = (cr[o.p.uid] || 0) + o.w / total;
      const o = SB.weighted(ws, (o) => (o.w > 0 ? Math.max(0.02, cr[o.p.uid]) : 0));
      cr[o.p.uid] -= 1;
      return o.p;
    }
    previewCount() {
      if (this.ghostHidden) return 0;
      if (this.mod === 'foggy') return 1;
      let n = 3 + this.stat('previews');
      n += 2 * this.boardSpecialCount('lantern', true);
      return SB.clamp(n, 0, 8);
    }
    holdSlots() { return this.mod === 'nohold' ? 0 : 1 + this.stat('holdSlots'); }
    fillQueue() { while (this.queue.length < 9) this.queue.push(this.rollPiece()); }
    boardSpecialCount(spec, valueSum) {
      const seen = new Set();
      let v = 0;
      for (let r = 0; r < this.R; r++) for (let x = 0; x < this.W; x++) {
        const b = this.grid[r][x];
        if (b && b.spec === spec && !seen.has(b.pid)) { seen.add(b.pid); v += valueSum ? SB.specialVal(spec, b.lvl) / (spec === 'lantern' ? 2 : 1) : 1; }
      }
      return v;
    }

    // ---------- spawning & movement ----------
    spawn(inst) {
      this.sdHeld = 0; this.sdRows = 0; // each new piece starts its soft drop from a creep
      this.fillQueue();
      if (!inst) inst = this.queue.shift();
      this.fillQueue();
      const sh = SB.SHAPES[inst.shape];
      const spot = this.spawnSpot(sh);
      const rot0 = spot ? spot.rot : 0;
      const maxCy = Math.max(...sh.rots[rot0].map((c) => c[1]));
      const p = { inst, sh, rot: rot0, x: spot ? spot.x : Math.floor((this.W - sh.box) / 2), y: HID - 1 - maxCy, lastRotate: false, kick: 0 };
      // when a wall splits the board, a blocked spawn only shuffles within its own side
      const inSide = () => !spot || this.cellsOf(p).every(([x]) => x >= spot.a && x <= spot.b);
      if (this.collides(p)) {
        let ok = false;
        for (const dx of [-1, 1, -2, 2, -3, 3]) { p.x += dx; if (!this.collides(p) && inSide()) { ok = true; break; } p.x -= dx; }
        if (!ok) { p.y -= 1; if (this.collides(p)) { this.active = p; return this.topOut('blockout'); } }
      }
      p.y += 1;
      if (this.collides(p)) p.y -= 1;
      this.active = p;
      this.holdUsed = false;
      this.lockTimer = 0;
      this.lockResets = 0;
      this.gravAcc = 0;
      this.spawnTime = this.time;
      return true;
    }
    // runs of open columns; a wall (The Pillar) splits the board into two
    sides() {
      const out = [];
      let a = -1;
      for (let x = 0; x <= this.W; x++) {
        const open = x < this.W && !this.blocked.has(x);
        if (open && a < 0) a = x;
        if (!open && a >= 0) { out.push([a, x - 1]); a = -1; }
      }
      return out;
    }
    // fewest holes the piece would leave anywhere on one side of the wall
    sideHoles(shape, a, b) {
      if (!shape) return 0;
      const sh = SB.SHAPES[shape];
      let best = 99;
      for (let rot = 0; rot < sh.rots.length; rot++) {
        const cells = sh.rots[rot];
        const minX = Math.min(...cells.map((c) => c[0])), maxX = Math.max(...cells.map((c) => c[0]));
        for (let x = a - minX; x + maxX <= b; x++) {
          const t = { sh, rot, x, y: 0 };
          if (this.collides(t)) continue;
          while (!this.collides(t, 0, 1)) t.y++;
          const got = this.cellsOf(t), mine = new Set(got.map(([cx, cy]) => cx + ',' + cy));
          let holes = 0;
          for (const [cx, cy] of got) if (cy + 1 < this.R && !mine.has(cx + ',' + (cy + 1)) && !this.grid[cy + 1][cx]) holes++;
          best = Math.min(best, holes);
        }
      }
      return best === 99 ? 4 : best;
    }
    rollDropSide(sides) {
      // random, weighted by width; a side that stands taller than the other, or where the coming piece
      // can only fit by leaving a hole, gets picked less, so both halves keep finishing lines
      const hts = sides.map(([a, b]) => {
        let t = 0;
        for (let x = a; x <= b; x++) { let r = 0; while (r < this.R && !this.grid[r][x]) r++; t += this.R - r; }
        return t / (b - a + 1);
      });
      const lo = Math.min(...hts);
      const next = this.queue[0] && this.queue[0].shape;
      const ws = sides.map(([a, b], i) => (b - a + 1) * Math.pow(0.5, hts[i] - lo) * Math.pow(0.35, this.sideHoles(next, a, b)));
      let r = SB.rng() * ws.reduce((t, w) => t + w, 0);
      for (let i = 0; i < sides.length; i++) { r -= ws[i]; if (r < 0) return (sides[i][0] + sides[i][1]) >> 1; }
      return (sides[0][0] + sides[0][1]) >> 1;
    }
    // where a new piece appears: on a random side of the wall, centred in it
    spawnSpot(sh) {
      if (!this.blocked.size) return null;
      const sides = this.sides();
      if (sides.length < 2) return null;
      if (this.dropSide === undefined) this.dropSide = this.rollDropSide(sides);
      const want = this.dropSide;
      this.dropSide = this.rollDropSide(sides);
      for (const rot of [0, 1]) {
        const cells = sh.rots[rot];
        if (!cells) continue;
        const minX = Math.min(...cells.map((c) => c[0])), w = Math.max(...cells.map((c) => c[0])) - minX + 1;
        const fit = sides.filter(([a, b]) => b - a + 1 >= w);
        if (!fit.length) continue;
        // the chosen side first; if the piece has no room to appear there, the other side takes it
        fit.sort((p, q) => (want >= q[0] && want <= q[1]) - (want >= p[0] && want <= p[1]));
        const spots = fit.map(([a, b]) => ({ rot, x: a + Math.floor((b - a + 1 - w) / 2) - minX, a, b }));
        const maxCy = Math.max(...cells.map((c) => c[1]));
        const room = (sp) => [0, -1, 1, -2, 2, -3, 3].some((dx) => {
          const t = { sh, rot, x: sp.x + dx, y: HID - 1 - maxCy };
          return !this.collides(t) && this.cellsOf(t).every(([x]) => x >= sp.a && x <= sp.b);
        });
        return spots.find(room) || spots[0];
      }
      return null;
    }
    cellsOf(p, dx, dy, rot) {
      const rr = rot === undefined ? p.rot : rot;
      const x = p.x + (dx || 0), y = p.y + (dy || 0);
      return p.sh.rots[rr].map(([cx, cy]) => [x + cx, y + cy]);
    }
    collides(p, dx, dy, rot) {
      for (const [x, y] of this.cellsOf(p, dx, dy, rot)) {
        if (x < 0 || x >= this.W || y >= this.R) return true;
        if (this.blocked.has(x)) return true;
        if (y >= 0 && this.grid[y][x]) return true;
      }
      return false;
    }
    onGround() { return this.active && this.collides(this.active, 0, 1); }
    resetLock() {
      if (this.onGround() && this.lockResets < 15) { this.lockTimer = 0; this.lockResets++; }
    }
    move(dx) {
      if (this.status !== 'playing' || !this.active) return false;
      this.input(dx < 0 ? 'left' : 'right');
      if (this.isBoss('mirror') || this.mod === 'mirrorworld') dx = -dx;
      if (!this.collides(this.active, dx, 0)) {
        this.active.x += dx;
        this.active.lastRotate = false;
        this.active.touched = true;
        this.resetLock();
        SB.audio.play('move');
        return true;
      }
      return false;
    }
    rotate(dir) {
      if (this.status !== 'playing' || !this.active) return false;
      this.input(dir === 2 ? 'r180' : dir > 0 ? 'cw' : 'ccw');
      const p = this.active;
      if (p.inst.mat === 'stone' && !this.has('philosophers_stone')) { SB.audio.play('deny'); return false; }
      if (p.sh.key === 'O') return false;
      const from = p.rot;
      const to = (p.rot + dir + 4) % 4;
      let kicks;
      if (dir === 2) kicks = SB.KICKS_180;
      else if (p.sh.key === 'I') kicks = SB.KICKS_I[from + '>' + to];
      else if ('JLSTZ'.includes(p.sh.key) && p.sh.box === 3) kicks = SB.KICKS_JLSTZ[from + '>' + to];
      else kicks = SB.KICKS_GENERIC;
      for (let i = 0; i < kicks.length; i++) {
        const [kx, ky] = kicks[i];
        if (!this.collides(p, kx, ky, to)) {
          p.x += kx; p.y += ky; p.rot = to;
          p.lastRotate = true; p.kick = i; p.touched = true;
          this.resetLock();
          SB.audio.play('rotate');
          return true;
        }
      }
      return false;
    }
    // every move, turn, drop and hold the player asks for (the secret code listens here)
    input(name) { if (!this.sandbox && SB.UI && SB.UI.secretKey) SB.UI.secretKey(name, this); }
    softDropStep() {
      if (!this.collides(this.active, 0, 1)) { this.active.y++; this.active.lastRotate = false; return true; }
      return false;
    }
    // Soft drop eases from a careful creep into its top speed (the sdf setting) the longer Down is held.
    softDropInterval() {
      const top = Math.max(0.01, SB.meta.data.settings.sdf / 1000);
      const start = Math.max(top * 2.5, 0.12);
      const k = Math.min(1, this.sdHeld / 0.45);
      return start + (top - start) * k * k;
    }
    softLand() {
      if (this.sdLandP === this.active && this.sdLandY === this.active.y) return;
      this.sdLandP = this.active; this.sdLandY = this.active.y;
      SB.audio.play('softland');
      for (const [x, y] of this.bottomCells(this.active)) if (y >= HID) this.burst(x, y + 1, 'skid', 2);
    }
    bottomCells(p) {
      const low = {};
      for (const [x, y] of this.cellsOf(p)) if (low[x] === undefined || y > low[x]) low[x] = y;
      return Object.keys(low).map((x) => [+x, low[x]]);
    }
    // Hard drop is a slam: instant, locks on impact, kicks dust out sideways and jolts the board.
    hardDrop() {
      if (this.status !== 'playing' || !this.active) return;
      this.input('hard');
      if (this.active.inst.behavior === 'anchor') { SB.audio.play('deny'); this.emit('toast', { text: "Anchor pieces can't hard drop" }); return; }
      if (this.has('slow_hand')) { SB.audio.play('deny'); if (!this.slowToast) { this.slowToast = true; this.emit('toast', { ico: SB.RELICS.slow_hand.iconKey, text: 'Slow Hand: no hard drops' }); } return; }
      let n = 0;
      const startCells = this.cellsOf(this.active);
      while (!this.collides(this.active, 0, 1)) { this.active.y++; n++; }
      const color = this.active.sh.color;
      this.active.fell = n;
      if (n > 1) this.trail = { cells: startCells, n, color, life: 0.3, max: 0.3 };
      if (n > 0) this.active.lastRotate = false;
      this.hardDrops++;
      const power = Math.min(1, 0.25 + n / 16);
      const bottoms = this.bottomCells(this.active);
      for (const [x, y] of bottoms) if (y >= HID) this.burst(x, y + 1, 'slam', 2 + Math.round(power * 4));
      this.slamFx = { cells: bottoms, t: 0.28, max: 0.28, power, color };
      SB.audio.play('harddrop', power);
      this.shake = Math.max(this.shake, 3 + power * 4);
      this.emit('slam', { power });
      this.lock(true);
    }
    hold() {
      if (this.status !== 'playing' || !this.active) return;
      this.input('hold');
      if (this.holdUsed) return;
      const slots = this.holdSlots();
      if (slots <= 0) { SB.audio.play('deny'); return; }
      // Hold always works on the selected slot: an empty slot stores the piece, a full one swaps with it
      const i = Math.min(this.holdSel, slots - 1), cur = this.active.inst, out = this.holds[i];
      this.holdUsed = true;
      SB.audio.play('hold');
      this.holds[i] = { inst: cur, heldAt: this.time };
      this.spawn(out ? out.inst : undefined);
      if (out && this.active) this.active.heldFor = this.time - out.heldAt;
      this.holdUsed = true;
    }
    // pick the hold slot Hold uses (cycle keys, scroll wheel, or a tap on the slot); free, any time
    selectHold(i) {
      const n = this.holdSlots();
      if (n < 2 || this.status !== 'playing') return false;
      i = ((i % n) + n) % n;
      if (i === this.holdSel) return false;
      this.holdSel = i;
      SB.audio.play('move');
      return true;
    }
    cycleHold(dir) { return this.selectHold(this.holdSel + dir); }
    ghostY() {
      const p = this.active;
      let d = 0;
      while (!this.collides(p, 0, d + 1)) d++;
      return p.y + d;
    }

    // ---------- timing ----------
    levelFor(lines) {
      let lpl = 10 + this.stat('linesPerLevel');
      if (SB.Run.hasBlueprint(this.run, 'slow_burn')) lpl = 15;
      if (this.mod === 'doubletime') lpl = 5;
      if (this.run.stake >= 7) lpl = Math.max(3, Math.floor(lpl / 2));
      if (this.has('rush_order')) lpl = Math.max(3, Math.floor(lpl / 2));
      const maxL = this.stat('maxLevel') ? Math.min(20, this.stat('maxLevel')) : 20;
      return SB.clamp(this.startLevel + Math.floor(lines / lpl), 1, Math.max(maxL, Math.min(this.startLevel, 20)));
    }
    gravityInterval() {
      let L = this.level;
      if (SB.Run.transformed(this.run, 'Speed')) L += 2;
      L -= this.boardSpecialCount('anchorstone', true);
      L = SB.clamp(L, 1, 20);
      let t = Math.pow(0.8 - (L - 1) * 0.007, L - 1);
      if (this.mod === 'rain') t *= 0.75;
      if (this.active && this.active.inst.behavior === 'floaty') t *= 2;
      if (this.time < this.hourglassUntil) t *= 2;
      return t;
    }
    lockDelay() {
      if (this.isBoss('clockwork') || this.mod === 'lockdown') return 0;
      return 0.5;
    }
    gravityPaused() { return this.time < this.freezeUntil || this.time < this.bulletUntil; }

    update(dt, input) {
      if (this.status !== 'playing') { this.updateFx(dt); return; }
      this.time += dt;
      this.updateFx(dt);
      if (!this.sandbox && this.time >= this.freezeUntil) {
        this.clockUsed += dt;
        if (this.clockUsed >= this.timeLimit) { this.clockUsed = this.timeLimit; return this.topOut('timeout'); }
      }
      if (this.rival) this.rival.update(dt);
      if (!this.active) return;

      // stage / boss timers
      if (this.mod === 'windy') {
        this.windT += dt;
        if (this.windT >= 12) { this.windT = 0; const d = SB.chance(0.5) ? 1 : -1; if (!this.collides(this.active, d, 0)) this.active.x += d; this.emit('toast', { text: 'A gust of wind!' }); }
      }
      if (this.mod === 'quake') {
        this.quakeT += dt;
        if (this.quakeT >= 30) { this.quakeT = 0; this.compactAll(); this.emit('toast', { text: 'Earthquake!' }); this.shake = 8; this.resolveAfterBoardChange(); if (this.status !== 'playing') return; }
      }

      // DAS / ARR
      if (input) {
        const s = SB.meta.data.settings;
        const dir = input.left && input.right ? input.lastDir : input.left ? -1 : input.right ? 1 : 0;
        if (dir !== this.das.dir) this.das = { dir, t: 0, arrAcc: 0 };
        else if (dir) {
          this.das.t += dt * 1000;
          if (this.das.t >= s.das) {
            if (s.arr <= 0) { while (this.move(dir)) { /* slide to wall */ } }
            else {
              this.das.arrAcc += dt * 1000;
              while (this.das.arrAcc >= s.arr) { this.das.arrAcc -= s.arr; if (!this.move(dir)) break; }
            }
          }
        }
        this.softDropping = !!input.down;
      }
      if (this.softDropping) this.sdHeld += dt;
      else { this.sdHeld = 0; this.sdRows = 0; }

      // gravity
      if (!this.gravityPaused()) {
        let interval = this.gravityInterval();
        const soft = this.softDropping && this.softDropInterval() < interval;
        if (soft) interval = this.softDropInterval();
        this.gravAcc += dt;
        let guard = 0;
        while (this.gravAcc >= interval && guard++ < 40) {
          this.gravAcc -= interval;
          if (!this.softDropStep()) { this.gravAcc = 0; if (soft) this.softLand(); break; }
          if (soft) SB.audio.play('softtick', this.sdRows++);
          if (this.lockDelay() === 0 && this.onGround()) break;
        }
      }
      if (this.onGround()) {
        this.lockTimer += dt;
        if (this.lockTimer >= this.lockDelay()) this.lock(false);
      } else {
        this.lockTimer = 0;
      }
    }

    // particles, rings, flashes and queued effects only; the Prize Counter's clear preview runs just this
    stepParticles(dt) {
      this.fxClock += dt;
      if (this.fxq.length) {
        const due = this.fxq.filter((e) => e.at <= this.fxClock);
        if (due.length) { this.fxq = this.fxq.filter((e) => e.at > this.fxClock); for (const e of due) e.fn(); }
      }
      if (this.rings.length) this.rings = this.rings.filter((g) => (g.t += dt) < g.max);
      const spawned = [];
      for (const p of this.particles) {
        if (p.swirl) { p.ang += p.w * dt; p.rad = Math.max(0, p.rad + p.dr * dt); p.cy += p.rise * dt; p.x = p.cx + Math.cos(p.ang) * p.rad; p.y = p.cy + Math.sin(p.ang) * p.rad * 0.45; p.life -= dt; continue; }
        // trails: rockets, glitter shells and willows drop sparks as they go
        if (p.emit && this.particles.length + spawned.length < 900 && Math.random() < dt * (p.emit === 'ash' ? 22 : 40)) {
          spawned.push(p.emit === 'spark'
            ? { kind: 'spark', x: p.x, y: p.y, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 2, grav: 20, size: 1.5, life: 0.18, color: '#ffffff', glow: true, streak: true }
            : { kind: 'glint', x: p.x, y: p.y, vx: (Math.random() - 0.5) * 0.8, vy: 0.5 + Math.random(), grav: p.emit === 'ash' ? 3 : 1, drag: 0.4, size: p.emit === 'ash' ? 1.6 : 2, life: p.emit === 'ash' ? 0.6 : 0.3, color: p.emit === 'ash' ? '#ffcf7a' : '#fff3c4', glow: true });
        }
        if (p.tx !== undefined) { const k = Math.min(1, dt * 9); p.vx = (p.tx - p.x) * 9; p.vy = (p.ty - p.y) * 9; p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; p.life -= dt; continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav === undefined ? 30 : p.grav) * dt;
        if (p.drag) { p.vx *= Math.pow(p.drag, dt); p.vy *= Math.pow(p.drag, dt); }
        if (p.rot !== undefined) p.rot += p.vr * dt;
        p.life -= dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0);
      if (spawned.length) this.particles.push(...spawned);
      this.flashRows = this.flashRows.filter((f) => (f.t -= dt) > 0);
    }

    updateFx(dt) {
      this.stepParticles(dt);
      if (this.lockFlash) { this.lockFlash.t -= dt; if (this.lockFlash.t <= 0) this.lockFlash = null; }
      if (this.slamFx) { this.slamFx.t -= dt; if (this.slamFx.t <= 0) this.slamFx = null; }
      this.shake = Math.max(0, this.shake - dt * 30);
      if (this.fogVis !== this.fogRows) { const d = this.fogRows - this.fogVis; this.fogVis = Math.abs(d) < 0.01 ? this.fogRows : this.fogVis + d * Math.min(1, dt * 5); }
      if (this.trail) { this.trail.life -= dt; if (this.trail.life <= 0) this.trail = null; }
      // blocks that dropped (bomb craters, drills, sand, quakes) ease down into place
      if (this.falling) {
        let any = false;
        for (const row of this.grid) for (const b of row) {
          if (!b || !b.fy) continue;
          b.fv = (b.fv || 4) + 70 * dt;
          b.fy = Math.max(0, b.fy - b.fv * dt);
          if (b.fy > 0) any = true; else b.fv = 0;
        }
        this.falling = any;
      }
    }
    // visual only: draw block b this many rows above where it now sits, then let it fall
    fall(b, rows) {
      if (!b || rows <= 0) return;
      b.fy = (b.fy || 0) + rows;
      this.falling = true;
    }

    // ---------- locking ----------
    lock(hard) {
      const p = this.active;
      if (!p) return;
      const inst = p.inst;
      if (this.forgeNext > 0 && inst.uid >= 0) {
        if (SB.Run.forgeLevels(this.run, inst, this.forgeNext)) this.emit('toast', { text: `${SB.SHAPES[inst.shape].name} forged to Level ${SB.pieceLv(inst)} for this Floor` });
        this.forgeNext = 0;
      }
      const cells = this.cellsOf(p);
      const tspin = this.detectSpin(p);
      const pid = ++this.piecesPlaced;
      this.sinceClear = (this.sinceClear || 0) + 1;
      let lowest = 0;
      const mat = this.has('philosophers_stone') ? 'gold' : inst.mat;
      for (const [x, y] of cells) {
        if (y < 0) continue;
        this.grid[y][x] = { shape: inst.shape, color: p.sh.color, uid: inst.uid, pid, mat, spec: inst.special || null, beh: inst.behavior || null, lvl: SB.pieceLv(inst), t: this.time };
        lowest = Math.max(lowest, y);
      }
      // the top-most block carries one-per-piece details (a bomb's fuse, a lantern's flame)
      const lead = cells.filter(([, y]) => y >= 0).sort((a, b) => a[1] - b[1] || a[0] - b[0])[0];
      if (lead) this.grid[lead[1]][lead[0]].lead = true;
      for (const [x, y] of cells) {
        if (y < 0 || (y + 1 < this.R && this.grid[y + 1][x] && this.grid[y + 1][x].pid === pid)) continue;
        for (let i = 0; i < 2; i++) this.particles.push({ x: x + Math.random(), y: y + 1, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 3, life: 0.3 + Math.random() * 0.2, color: 'rgba(200,220,255,0.7)', size: 2 });
      }
      this.lockFlash = { cells: cells.filter(([, y]) => y >= 0), t: 0.16 };
      this.lockTimes.push(this.time - this.spawnTime);
      if (this.lockTimes.length > 20) this.lockTimes.shift();
      this.active = null;
      SB.audio.play('lock', { mat: this.isBoss('shatter') ? 'glass' : mat, hard });

      if (cells.every(([, y]) => y < HID)) return this.topOut('lockout');

      // on-lock effects
      this.applyLockEffects(p, cells, pid);
      const cleared = this.processClears(p, tspin, cells);
      if (this.status !== 'playing' && this.status !== 'choice') return;
      // the Rival's garbage lands when a piece locks without clearing (up to 8 rows at a time, one hole per batch)
      if (!cleared && this.incoming > 0) {
        const n = Math.min(8, this.incoming);
        this.incoming -= n;
        this.addGarbage(n, false, SB.randInt(0, this.W - 1));
        if (this.status === 'over') return;
      }

      // Gravity transformation: shockwave
      if (hard && SB.Run.transformed(this.run, 'Gravity') && this.hardDrops % 8 === 0) {
        this.shockwave();
      }
      // timed board events per piece
      if (this.isBoss('tide') && this.piecesPlaced % 8 === 0) { this.addGarbage(1); if (this.status === 'over') return; }
      if (this.mod === 'risingfloor' && this.piecesPlaced % 12 === 0) { this.addGarbage(1); if (this.status === 'over') return; }
      if (this.has('groundswell') && this.piecesPlaced % 2 === 0) { this.swell(); if (this.status === 'over') return; }
      if (this.mod === 'risingfog' && this.piecesPlaced % SB.FOG.every === 0 && this.fogRows < Math.min(SB.FOG.max, this.H - 4)) this.fogRows++;
      if (this.isBoss('monolith') && this.piecesPlaced % 12 === 0) this.monolithShrink();
      if (this.has('devilled_egg') && this.piecesPlaced % 6 === 0) this.yolkify();
      this.level = this.levelFor(this.lines);
      if (this.status === 'playing' && !this.active) this.spawn();
      else if (this.status === 'choice') this.pendingSpawn = true;
      return cleared;
    }

    detectSpin(p) {
      if (!p.lastRotate) return false;
      if (p.sh.key === 'T') {
        let corners = 0;
        for (const [cx, cy] of [[0, 0], [2, 0], [0, 2], [2, 2]]) {
          const x = p.x + cx, y = p.y + cy;
          if (x < 0 || x >= this.W || y >= this.R || this.blocked.has(x) || (y >= 0 && this.grid[y][x])) corners++;
        }
        return corners >= 3;
      }
      if (this.stat('allSpin')) {
        return this.collides(p, -1, 0) && this.collides(p, 1, 0) && this.collides(p, 0, -1);
      }
      return false;
    }

    applyLockEffects(p, cells, pid) {
      const inst = p.inst;
      const lvl = SB.pieceLv(inst);
      const beh = inst.behavior;
      const spec = inst.special;
      if (beh === 'sand') this.sandify(pid);
      if (!spec) return;
      const v = SB.specialVal(spec, lvl);
      const ico = SB.SPECIALS[spec].iconKey;
      const vis = cells.filter(([, y]) => y >= 0);
      const mx = vis.reduce((a, c) => a + c[0], 0) / Math.max(1, vis.length) + 0.5, my = vis.reduce((a, c) => a + c[1], 0) / Math.max(1, vis.length) + 0.5;
      switch (spec) {
        case 'coin': this.addMoney(v, 'Coin'); for (const [x, y] of cells) this.burst(x, y, 'coin', 2); this.ring(mx, my, 1.8, '#ffd23b', 0.3, 2); break;
        case 'catalyst': this.catalyst = Math.max(this.catalyst, v); this.emit('toast', { ico, text: `Next clear x${v}` }); for (const [x, y] of cells) this.burst(x, y, 'star', 3, '#d8b4ff'); this.ring(mx, my, 2.2, '#c08bff', 0.4, 2.5); break;
        case 'echo':
          for (let i = 0; i < v; i++) this.queue.unshift(inst);
          this.emit('toast', { ico, text: `Echo!` });
          for (let i = 0; i < 3; i++) this.later(i * 0.12, () => this.ring(mx, my, 1.4 + i * 0.9, '#c78bff', 0.45, 2));
          break;
        case 'herald': {
          const shapes = [...new Set(this.run.pieces.map((q) => q.shape))];
          const s = SB.pick(shapes);
          this.tempWeight[s] = (this.tempWeight[s] || 0) + v;
          this.emit('toast', { ico, text: `${SB.SHAPES[s].name} +${v} weight` });
          break;
        }
        case 'hourglass': this.hourglassUntil = this.time + v; this.addTime(v); this.emit('toast', { ico, text: `Gravity halved for ${v}s, +${v}s on the clock` }); for (const [x, y] of cells) this.burst(x, y, 'sand', 6); break;
        case 'forge': this.forgeNext += v; for (const [x, y] of cells) this.burst(x, y, 'ember', 4); this.ring(mx, my, 1.6, '#ff9a3b', 0.25, 3); break;
        case 'drill': this.drill(pid, v); break;
        case 'vacuum': this.vacuum(pid, v); break;
        case 'mender': this.mend(v); break;
        case 'prism':
          for (const [x, y] of cells) if (y >= HID) { this.tcells[this.key(x, y)] = 'prism'; this.burst(x, y, 'star', 4); this.ring(x + 0.5, y + 0.5, 0.9, '#7cf8ff', 0.3, 2); }
          this.emit('toast', { ico, text: `Prism cells formed` });
          break;
        case 'earthquake': this.quakeFx(); this.compactAll(); this.shake = 12; this.emit('toast', { ico, text: `Earthquake!` }); break;
        case 'painter': {
          let n = 0, guard = 0;
          while (n < v && guard++ < 200) {
            const x = SB.randInt(0, this.W - 1), r = SB.randInt(Math.max(HID, this.R - 10), this.R - 1);
            const k = this.key(x, r);
            if (!this.tcells[k] && !this.run.board.cells[k]) { this.tcells[k] = 'gold'; n++; this.burst(x, r, 'coin', 3); this.burst(x, r, 'splat', 6, '#ffd23b'); }
          }
          if (n) this.emit('toast', { ico, text: `Painted ${n} Gold cell${n > 1 ? 's' : ''}` });
          break;
        }
      }
    }
    blocksOfPid(pid) {
      const out = [];
      for (let r = 0; r < this.R; r++) for (let x = 0; x < this.W; x++) if (this.grid[r][x] && this.grid[r][x].pid === pid) out.push([x, r]);
      return out;
    }
    sandify(pid) {
      const bl = this.blocksOfPid(pid).sort((a, b) => b[1] - a[1]);
      for (const [x, r] of bl) {
        let y = r;
        while (y + 1 < this.R && !this.grid[y + 1][x]) y++;
        if (y !== r) { this.grid[y][x] = this.grid[r][x]; this.grid[r][x] = null; this.fall(this.grid[y][x], y - r); this.burst(x, r, 'sand', 3); this.later(Math.sqrt((y - r) / 35), () => this.burst(x, y + 0.7, 'sand', 4)); }
      }
    }
    dropPieceUnit(pid) {
      const bl = this.blocksOfPid(pid);
      const blocks = bl.map(([x, r]) => [x, r, this.grid[r][x]]);
      for (const [x, r] of bl) this.grid[r][x] = null;
      let d = 0;
      const free = (dd) => blocks.every(([x, r]) => r + dd < this.R && !this.grid[r + dd][x]);
      while (free(d + 1)) d++;
      for (const [x, r, b] of blocks) { this.grid[r + d][x] = b; this.fall(b, d); }
    }
    // Drill: the whole piece bores straight down n rows (or to the floor), destroying every block in its path.
    drill(pid, n) {
      const bl = this.blocksOfPid(pid);
      const blocks = bl.map(([x, r]) => [x, r, this.grid[r][x]]);
      for (const [x, r] of bl) this.grid[r][x] = null;
      let removed = 0, d = 0;
      // the piece eases down (see fall); dust and grit kick up at each row as the bit passes it
      const passAt = (k) => (-4 + Math.sqrt(16 + 140 * k)) / 70;
      while (d < n && blocks.every(([, r]) => r + d + 1 < this.R)) {
        d++;
        for (const [x, r] of blocks) {
          const rr = r + d, hit = this.grid[rr][x];
          if (hit) {
            const col = hit.garbage ? '#5b5b6b' : hit.color;
            this.grid[rr][x] = null; removed++;
            this.later(passAt(d), () => { this.burst(x, rr, 'grit', 7); this.burst(x, rr, 'smoke', 2, 'rgba(206,188,156,0.7)'); this.burst(x, rr, 'debris', 3, col); this.burst(x, rr + 0.8, 'spark', 3); });
          }
        }
      }
      const lows = {};
      for (const [x, r] of blocks) lows[x] = Math.max(lows[x] === undefined ? -1 : lows[x], r);
      this.later(passAt(Math.max(1, d)), () => { for (const x in lows) { this.burst(+x, lows[x] + d + 0.9, 'smoke', 3, 'rgba(206,188,156,0.6)'); this.burst(+x, lows[x] + d + 0.9, 'grit', 4); } this.shake = Math.max(this.shake, 3); });
      for (const [x, r, b] of blocks) { this.grid[r + d][x] = b; this.fall(b, d); }
      // settle: if it bored into open space it keeps falling until it rests
      this.dropPieceUnit(pid);
      if (removed) { this.emit('toast', { text: `Drilled through ${removed} block${removed > 1 ? 's' : ''}` }); SB.audio.play('bomb'); this.shake = Math.max(this.shake, 5); }
    }
    // Vacuum: deletes every block touching the underside of the piece (n deep), then the piece settles into the gap.
    vacuum(pid, n) {
      const bl = this.blocksOfPid(pid);
      const low = {};
      for (const [x, r] of bl) low[x] = Math.max(low[x] === undefined ? -1 : low[x], r);
      let removed = 0;
      for (const x in low) {
        for (let k = 1; k <= n; k++) {
          const r = low[x] + k;
          if (r >= this.R) break;
          if (this.grid[r][x]) { const col = this.grid[r][x].garbage ? '#8a8a9a' : this.grid[r][x].color; this.burst(+x, r, 'dust', 3); this.burst(+x, r, 'suck', 9, col); this.burst(+x, low[x], 'suck', 7, '#dfe6ff'); this.ring(+x + 0.5, r + 0.5, 1.3, col, 0.3, 2.5, 'in'); this.grid[r][x] = null; removed++; }
        }
      }
      this.dropPieceUnit(pid);
      if (removed) { this.emit('toast', { text: `Vacuumed ${removed} block${removed > 1 ? 's' : ''}` }); SB.audio.play('glyph'); }
    }
    holesList() {
      const out = [];
      for (let x = 0; x < this.W; x++) {
        let seen = false;
        for (let r = 0; r < this.R; r++) {
          if (this.grid[r][x]) seen = true;
          else if (seen && !this.blocked.has(x)) out.push([x, r]);
        }
      }
      return out;
    }
    // fill the n lowest holes; Mortar does it quietly after every clear, in grey stone
    mend(n, quiet) {
      const holes = this.holesList().sort((a, b) => a[1] - b[1]).reverse();
      let k = 0;
      for (const [x, r] of holes) {
        if (k >= n) break;
        this.grid[r][x] = { shape: 'M1', color: quiet ? '#9a8f84' : '#8a8a9a', uid: -2, pid: -1, mat: null, t: this.time, plain: true };
        if (quiet) { this.burst(x, r, 'dust', 4); this.ring(x + 0.5, r + 0.5, 0.7, '#e8d9c4', 0.25, 2); } else { this.burst(x, r, 'heal', 4); this.ring(x + 0.5, r + 0.5, 0.8, '#7dffb0', 0.3, 2); }
        k++;
      }
      if (k && !quiet) this.emit('toast', { ico: SB.SPECIALS.mender.iconKey, text: `Mended ${k} hole${k > 1 ? 's' : ''}` });
      return k;
    }
    // a quake rolls across the floor: grit and dust column by column, debris shaken off the stack
    quakeFx() {
      for (let x = 0; x < this.W; x++) this.later(x * 0.025, () => { this.burst(x, this.R - 1, 'grit', 4); this.burst(x, this.R - 1, 'dust', 2); });
      const tops = [];
      for (let x = 0; x < this.W; x++) for (let r = HID; r < this.R; r++) if (this.grid[r][x]) { tops.push([x, r, this.grid[r][x].color]); break; }
      for (const [x, r, c] of tops) if (Math.random() < 0.6) this.burst(x, r, 'debris', 2, c);
      this.ring(this.W / 2, this.R - 0.5, this.W * 0.6, '#d9c8a0', 0.45, 3);
    }
    compactAll() {
      for (let x = 0; x < this.W; x++) {
        if (this.blocked.has(x)) continue;
        const col = [];
        for (let r = this.R - 1; r >= 0; r--) if (this.grid[r][x]) col.push([this.grid[r][x], r]);
        for (let r = this.R - 1, i = 0; r >= 0; r--, i++) { const c = col[i]; this.grid[r][x] = c ? c[0] : null; if (c) this.fall(c[0], r - c[1]); }
      }
    }
    resolveAfterBoardChange() {
      // clear any lines completed by a board event (no score, keeps the board sane)
      const full = this.fullRows();
      if (full.length) this.processClears(null, false, []);
    }

    // ---------- line clears ----------
    rowComplete(r) {
      let missing = 0, filled = 0;
      for (let x = 0; x < this.W; x++) {
        if (this.blocked.has(x)) continue;
        if (this.grid[r][x]) filled++; else missing++;
      }
      if (filled === 0) return false;
      if (missing === 0) return true;
      return missing === 1 && this.stat('eventHorizon') && filled >= 3;
    }
    fullRows() {
      const out = [];
      for (let r = 0; r < this.R; r++) if (this.rowComplete(r)) out.push(r);
      return out;
    }
    // Temporal: a full line holding a Temporal block waits in time until some other line clears
    isTemporalRow(r) { return this.grid[r].some((b) => b && b.spec === 'temporal'); }
    heldRows() { const full = this.fullRows(); return full.length && full.every((r) => this.isTemporalRow(r)) ? full : []; }

    processClears(p, tspin, lockedCells) {
      let full = this.fullRows();
      const grace = this.stat('comboGrace');
      if (!full.length) {
        if (p) { this.noClearStreak++; if (this.noClearStreak > grace) this.combo = -1; }
        return 0;
      }
      // Temporal lines: if every full line is held in time, nothing clears yet (the combo is held too)
      if (full.every((r) => this.isTemporalRow(r))) {
        if (full.length > this.heldN) {
          const ico = SB.SPECIALS.temporal.iconKey;
          this.emit('toast', { ico, text: `Held in time: ${full.length} line${full.length > 1 ? 's wait' : ' waits'} for your next clear` });
          for (const r of full) this.flashRows.push({ r, t: 0.3, color: '#7c8cff' });
          SB.audio.play('timehold');
        }
        this.heldN = full.length;
        return 0;
      }
      const released = this.heldN;
      this.heldN = 0;
      // Frozen lines: first clear only thaws
      const thawRows = full.filter((r) => { for (let x = 0; x < this.W; x++) if (this.grid[r][x] && this.isFrozen(x, r)) return true; return false; });
      if (thawRows.length) {
        for (const r of thawRows) for (let x = 0; x < this.W; x++) { if (this.grid[r][x] && this.isFrozen(x, r)) { this.burst(x, r, 'shard', 3, '#bfe9ff'); if (this.cellAt(x, r) === 'frozen') this.cellPops.push({ x, r, cell: 'frozen', text: 'THAW' }); } this.thawed.add(this.key(x, r)); }
        full = full.filter((r) => !thawRows.includes(r));
        SB.audio.play('thaw');
        this.emit('toast', { ico: SB.CELLS.frozen.iconKey, text: 'Thawed! Clear it again' });
        for (const r of thawRows) this.flashRows.push({ r, t: 0.3, color: '#9ad7ff' });
        if (!full.length) { if (p) { this.noClearStreak++; if (this.noClearStreak > grace) this.combo = -1; } return 0; }
      }
      const rows = new Set(full);
      for (const r of full) {
        for (let x = 0; x < this.W; x++) {
          if (this.cellAt(x, r) === 'cracked' && this.grid[r][x]) {
            this.cellPops.push({ x, r, cell: 'cracked', text: 'CRACK!' });
            if (r - 1 >= 0 && this.grid[r - 1].some((b) => b)) rows.add(r - 1);
            if (this.has('fault_line') && r + 1 < this.R && this.grid[r + 1].some((b) => b)) rows.add(r + 1);
          }
        }
      }
      const rowList = [...rows].sort((a, b) => a - b);
      const heightBefore = this.stackHeight();
      const cells = [];
      for (const r of rowList) for (let x = 0; x < this.W; x++) { const b = this.grid[r][x]; if (b) cells.push({ x, r, b }); }

      // bombs
      const bombed = [], blastSet = new Set();
      for (const c of cells) {
        if (c.b.beh !== 'bomb') continue;
        for (let dx = -1; dx <= 1; dx++) if (c.x + dx >= 0 && c.x + dx < this.W) blastSet.add(c.x + dx);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const rr = c.r + dy, xx = c.x + dx;
          if (rr < 0 || rr >= this.R || xx < 0 || xx >= this.W || rows.has(rr)) continue;
          if (this.grid[rr][xx] && !bombed.some((q) => q[0] === xx && q[1] === rr)) bombed.push([xx, rr]);
        }
      }
      if (bombed.length) SB.audio.play('bomb');
      const bombCols = bombed.map(([x, r]) => { const b = this.grid[r][x]; return b ? (b.garbage ? '#5b5b6b' : b.color) : null; });
      const bombAt = cells.filter((c) => c.b.beh === 'bomb').map((c) => [c.x, c.r]);

      // build the post-clear grid
      const g2 = this.grid.map((row) => row.slice());
      for (const [x, r] of bombed) g2[r][x] = null;
      const kept = g2.filter((_, r) => !rows.has(r));
      while (kept.length < this.R) kept.unshift(new Array(this.W).fill(null));
      // after a blast, everything left hanging in the blasted columns falls to fill the crater
      const blastCols = [...blastSet].filter((x) => !this.blocked.has(x));
      for (const x of blastCols) {
        const col = [];
        for (let r = this.R - 1; r >= 0; r--) if (kept[r][x]) col.push([kept[r][x], r]);
        for (let r = this.R - 1, i = 0; r >= 0; r--, i++) { const c = col[i]; kept[r][x] = c ? c[0] : null; if (c) this.fall(c[0], r - c[1]); }
      }
      const allclear = kept.every((row) => row.every((b) => !b));
      let holes = 0;
      const heights = [];
      for (let x = 0; x < this.W; x++) {
        if (this.blocked.has(x)) continue;
        let seen = false, h = 0;
        for (let r = 0; r < this.R; r++) {
          if (kept[r][x]) { if (!seen) h = this.R - r; seen = true; } else if (seen) holes++;
        }
        heights.push(h);
      }
      const flat = Math.max(...heights) - Math.min(...heights) <= 1;

      // classify
      const lines = rowList.length;
      this.combo++;
      this.noClearStreak = 0;
      const difficult = lines >= 4 || (tspin && lines > 0);
      const b2b = difficult && this.lastDifficult;
      this.lastDifficult = difficult;
      const shape = p ? p.inst.shape : null;
      let type = allclear ? 'allclear' : lines >= 5 ? 'penta' : tspin ? 'tspin' : ['single', 'single', 'double', 'triple', 'tetris'][lines];
      const inst = p ? p.inst : null;
      const isTetris = lines >= 4 || (tspin && lines >= 3 && inst && inst.shape === 'T' && SB.pieceLv(inst) >= 10) || (lines === 1 && this.has('small_print'));
      // Domino: clears in a row, each made with a different shape from the one before
      if (shape) { this.domChain = shape !== this.domLast ? (this.domChain || 0) + 1 : 1; this.domLast = shape; }
      const lineTypes = rowList.map((r) => new Set(this.grid[r].filter((b) => b && !b.garbage && !b.plain).map((b) => b.shape)).size);
      const garbageRows = rowList.filter((r) => this.grid[r].some((b) => b && b.garbage)).length;
      const glassUids = new Set(cells.filter((c) => this.matOf(c.b) === 'glass' && c.b.uid >= 0).map((c) => c.b.uid));
      let wellHits = 0;
      for (const r of rowList) for (const w of this.run.board.wells) if (w < this.W && this.grid[r][w]) wellHits++;
      const lowestYb = Math.min(...rowList.map((r) => this.yb(r)));
      const topFromTop = Math.min(...rowList.map((r) => r - HID));
      const linesBefore = this.lines;
      this.lines += lines;
      const info = {
        rows: rowList, lines, type, tspin: !!tspin && lines > 0, allclear, isTetris, combo: Math.max(0, this.combo), b2b,
        piece: inst || { level: 1, shape: '?' }, shape, cellsN: inst ? SB.SHAPES[inst.shape].n : 4,
        cells, bombed: bombed.length, garbageRows, garbageBlocks: cells.filter((c) => c.b.garbage).length,
        holes, flat, height: Math.min(this.H, heightBefore), level: this.level, elapsed: this.time,
        lowestYb, topFromTop, lineTypes, glassPieces: glassUids.size, glassUids, wellHits,
        pieceCenterX: lockedCells.length ? lockedCells.reduce((a, c) => a + c[0], 0) / lockedCells.length : this.W / 2,
        nextShape: this.queue[0] ? this.queue[0].shape : null,
        crossed10: Math.floor(this.lines / 10) > Math.floor(linesBefore / 10),
        scorable: !!p,
        temporal: rowList.filter((r) => this.isTemporalRow(r)).length,
        room: this.H - heightBefore,
        gap: p ? this.sinceClear || 0 : 0, domino: this.domChain || 0,
        fromHold: p ? p.heldFor !== undefined : false, heldFor: p && p.heldFor !== undefined ? p.heldFor : -1,
        untouched: !!p && !p.touched, fell: p ? p.fell || 0 : 0,
        specialCells: rowList.reduce((a, r) => { for (let x = 0; x < this.W; x++) if (this.grid[r][x] && this.cellAt(x, r)) a++; return a; }, 0),
      };
      if (p) this.sinceClear = 0;
      if (p && this.has('demolition')) for (const [x, r] of bombed) cells.push({ x, r, b: this.grid[r][x], bomb: true });

      const res = p ? SB.scoreClear(this, info) : { score: 0, chips: 0, mult: 0, log: [], money: 0 };
      if (p && this.rival) info.sent = this.rival.hit(info);
      this.grid = kept;
      this.clears++;

      // particles / fx
      this.clearFx(rowList, cells);
      // the bomb goes off, then every block it breaks pops in a little explosion of its own, nearest first
      for (const [bx, br] of bombAt) { this.blast(bx, br, 1.5); this.burst(bx, br, 'fire', 8); }
      if (bombed.length) {
        const order = bombed.map(([x, r], i) => ({ x, r, col: bombCols[i], d: Math.min(...bombAt.map(([bx, br]) => Math.hypot(bx - x, br - r))) })).sort((a, b) => a.d - b.d);
        order.forEach((o, i) => this.later(0.06 + i * 0.045 + Math.random() * 0.03, () => { this.blast(o.x, o.r, 0.6, o.col); if (i % 3 === 0) this.shake = Math.max(this.shake, 5); }));
        this.shake = Math.max(this.shake, 9);
      }
      if (isTetris || allclear) { SB.audio.play('tetris'); this.shake = 10; } else SB.audio.play('clear', lines);

      // post-clear effects
      if (p) this.postClear(info, res, inst);

      if (p) {
        let label = '';
        if (allclear) label = 'ALL CLEAR!';
        else if (lines >= 5) label = 'PENTA!';
        else if (info.tspin) label = 'T-SPIN ' + ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'][Math.min(4, lines)];
        else if (lines >= 4) label = 'TETRIS!';
        else if (lines === 3) label = 'TRIPLE';
        this.emit('clearfx', { rows: rowList, label, score: res.score, lines, big: isTetris || allclear || info.tspin, b2b, combo: info.combo, xm: res.log.some((l) => l.k === 'x') });
        if (released) this.emit('toast', { ico: SB.SPECIALS.temporal.iconKey, text: `Time catches up: ${released} held line${released > 1 ? 's' : ''} clear${released > 1 ? '' : 's'} too` });
      }
      if (this.cellPops.length) { this.emit('cellpops', { pops: this.cellPops }); this.cellPops = []; }
      if (res.score > 0 || p) {
        this.addScore(res);
      }
      if (blastCols.length && this.status === 'playing' && this.fullRows().length) {
        this.emit('toast', { text: 'Cascade!' });
        return lines + this.processClears(p, false, []);
      }
      return lines;
    }

    postClear(info, res, inst) {
      const run = this.run;
      if (this.fogRows > 0) {
        const top = this.R - this.fogRows;
        this.fogRows = Math.max(0, this.fogRows - SB.FOG.clear);
        for (let x = 0; x < this.W; x += 2) this.burst(x, top, 'smoke', 1, null);
      }
      run.stats.lines += info.lines;
      run.clearCounts[info.type] = (run.clearCounts[info.type] || 0) + 1;
      if (info.isTetris) { run.stats.tetrises++; if (!this.sandbox) SB.meta.data.tetrises++; }
      if (!this.sandbox && SB.Ach) SB.Ach.onClear(info, res, this);
      // Pinata: every 12th line of the run drops a Glyph
      if (this.has('pinata') && Math.floor(run.stats.lines / 12) > Math.floor((run.stats.lines - info.lines) / 12) && SB.Run.giveRandomGlyph(run)) {
        this.emit('toast', { ico: SB.RELICS.pinata.iconKey, text: 'Pinata: a free Glyph dropped into your Pocket' });
        if (SB.UI && SB.UI.renderPlayCons) SB.UI.renderPlayCons();
      }
      if (this.has('mortar')) this.mend(1, true);
      // curios that keep count of clears (Tension Spring)
      for (const r of run.relics) { const d = SB.RELICS[r.id]; if (d && d.afterClear) d.afterClear(this, info, r); }
      if (info.garbageRows && this.has('compost')) run.compost += 3 * info.garbageRows;
      if (info.isTetris && this.has('infinite_well')) { SB.Run.levelClear(run, 'tetris', 1); this.emit('toast', { ico: SB.RELICS.infinite_well.iconKey, text: 'Tetris leveled up!' }); }
      if (info.allclear && this.has('perfect_storm')) { for (const k of SB.CLEAR_ORDER) SB.Run.levelClear(run, k, 1); this.emit('toast', { ico: SB.RELICS.perfect_storm.iconKey, text: 'Every clear type leveled up!' }); }
      if (info.isTetris && this.has('bullet_time')) this.bulletUntil = this.time + 3;
      // time back on the clock
      let gain = 0;
      if (info.isTetris && this.has('borrowed_time')) gain += 10;
      if (this.has('chronoshard')) gain += 2 * info.lines;
      if (this.mod === 'beattheclock') gain += 5 * info.lines;
      if (gain && this.status === 'playing') this.addTime(gain);
      if (inst && inst.special === 'scholar') {
        const v = SB.specialVal('scholar', SB.pieceLv(inst));
        SB.Run.levelClear(run, info.type, v);
        this.emit('toast', { ico: SB.SPECIALS.scholar.iconKey, text: `${SB.CLEARS[info.type].name} +${v} level` });
      }
      // Library cells
      if (!this.libraryUsed && info.cells.some((c) => this.cellAtRowKey(c) === 'library')) {
        this.libraryUsed = true;
        const lc = info.cells.find((c) => this.cellAtRowKey(c) === 'library');
        this.cellPops.push({ x: lc.x, r: lc.r, cell: 'library', text: 'LV UP' });
        SB.Run.levelClear(run, info.type, 1);
        this.emit('toast', { ico: SB.CELLS.library.iconKey, text: `Library: ${SB.CLEARS[info.type].name} +1 level` });
      }
      // Glass shatter
      if (info.glassUids.size && !SB.Run.transformed(run, 'Glass') && !this.has('philosophers_stone')) {
        const p = this.has('glass_cannon') ? 0.5 : 0.25;
        for (const uid of info.glassUids) {
          const piece = run.pieces.find((q) => q.uid === uid);
          if (!piece || !SB.chance(p)) continue;
          if (SB.Run.bagVault(run, piece)) continue;
          piece.level--;
          SB.audio.play('shatter');
          // Kintsugi: every crack pays and makes the curio stronger
          const kin = run.relics.find((r) => r.id === 'kintsugi');
          if (kin) { kin.n = (kin.n || 0) + 1; this.addMoney(2, 'Kintsugi'); }
          if (piece.level <= 0) {
            if (run.pieces.length > 4) {
              SB.Run.destroyPiece(run, piece);
              this.queue = this.queue.filter((q) => q !== piece);
              this.fillQueue();
              this.emit('toast', { ico: SB.MATERIALS.glass.iconKey, text: `${SB.SHAPES[piece.shape].name} shattered and is gone!`, bad: true });
            } else { piece.level = 1; }
          } else this.emit('toast', { ico: SB.MATERIALS.glass.iconKey, text: `${SB.SHAPES[piece.shape].name} cracked: Level ${SB.pieceLv(piece)}`, bad: true });
        }
      }
      // Weaver boss: random hole in the row below the lowest clear
      if (this.isBoss('weaver')) {
        if (info.lowestYb > 0) {
          const row = this.grid[this.R - info.lowestYb];
          const filled = row.map((b, x) => (b ? x : -1)).filter((x) => x >= 0);
          if (filled.length) row[SB.pick(filled)] = null;
        }
      }
      if (this.isBoss('collector') && info.isTetris) this.addMoney(-1, 'The Collector');
      this.catalyst = 1;
    }
    cellAtRowKey(c) { return this.cellAt(c.x, c.r); }

    addMoney(v, label) {
      if (!v) return;
      if (v > 0 && this.has('king_midas')) v = Math.min(v, Math.max(0, 30 - this.run.money));
      if (!v) return;
      this.run.money += v;
      this.money += v;
      this.emit('money', { v, label });
      if (v > 0) SB.audio.play('money');
    }

    addScore(res) {
      let add = res.score;
      const before = this.score;
      // what changed the clear's score after Mass x Charge, for the score breakdown
      const adj = [];
      // no score until the Rival tops out (money and other effects still happen)
      const locked = !!(this.rival && !this.rival.ko && add > 0);
      if (locked) add = 0;
      if (this.pushTier > 0) {
        if (this.has('overtime')) { add *= 2; adj.push({ label: SB.RELICS.overtime.name, v: 'x2' }); }
      } else if (this.has('overtime') || this.isBoss('taxman')) {
        const excessStart = Math.max(before, this.target);
        const below = Math.max(0, Math.min(add, this.target - before));
        let above = add - below;
        if (above > 0) {
          if (this.has('overtime')) above *= 2;
          if (this.isBoss('taxman')) above = Math.floor(above / 2);
        }
        const diff = below + above - add;
        if (diff) adj.push({ label: [this.has('overtime') && SB.RELICS.overtime.name, this.isBoss('taxman') && SB.BOSSES.taxman.name].filter(Boolean).join(' + '), v: (diff > 0 ? '+' : '-') + SB.fmt(Math.abs(diff)) });
        add = below + above;
        void excessStart;
      }
      this.score += add;
      this.tally = Object.assign({}, res, { score: add, raw: res.score, adj, locked, id: (this.tally ? this.tally.id : 0) + 1 });
      this.emit('score', { v: add });
      if (res.money) this.addMoney(res.money, 'Clear');
      this.checkGoal();
    }

    checkGoal() {
      if (this.score < this.goal || this.status !== 'playing') return;
      if (this.targetTime === null) { this.targetTime = this.time; if (!this.sandbox && SB.Ach) { SB.Ach.least('fastTarget', this.time); if (this.timeLeft() <= 5) SB.Ach.bump('closeShaves'); } }
      if (this.pushTier > this.pushesDone) {
        this.pushesDone = this.pushTier;
        this.run.stats.pushes++;
        SB.meta.data.pushes++;
        if (!this.sandbox && SB.Ach) { SB.Ach.best('bestPushes', this.pushesDone); SB.Ach.check(); }
      }
      SB.audio.play('target');
      // The Egg stirs as you push on a Warden, and hatches once the Stack is banked after the 15th push
      if (this.boss && this.has('egg') && this.pushesDone > 0 && this.pushesDone % 5 === 0 && this.pushesDone <= SB.EGG_HATCH) {
        const msg = { 5: 'The Egg twitches...', 10: 'The Egg is cracking!', 15: 'The Egg is hatching! Bank this Stack to see what it holds' }[this.pushesDone];
        this.emit('toast', { ico: SB.RELICS.egg.iconKey, text: msg });
      }
      if ((this.pushesDone >= SB.PUSH_TIERS.length && !this.has('egg')) || this.isBoss('taxman')) return this.finish('cash');
      this.status = 'choice';
      this.emit('choice');
    }

    // Push On goals are fresh scores, a share of the Stack's target
    nextGoal() {
      const tier = SB.pushTier(this.pushTier);
      if (!tier || (this.pushTier >= SB.PUSH_TIERS.length && !this.has('egg'))) return null;
      let g = tier.goal * (1 - this.stat('pushDiscount'));
      if (this.run.stake >= 8) g *= 1.25;
      return Math.max(10, Math.ceil(this.target * g / 10) * 10);
    }
    timeLeft() { return Math.max(0, this.timeLimit - this.clockUsed); }
    addTime(sec, why) {
      if (!sec || this.sandbox) return;
      this.timeLimit += sec;
      this.emit('time', { v: sec, why });
    }
    // a Push On starts a fresh round: the score goes back to 0 and the clock gets a minute
    pushOn() {
      if (this.status !== 'choice') return;
      const g = this.nextGoal();
      if (!g) return this.finish('cash');
      this.pushTier++;
      this.banked += this.score;
      this.score = 0;
      this.tally = null;
      this.goal = g;
      this.addTime(60, 'Push On');
      this.status = 'playing';
      if (this.pendingSpawn || !this.active) { this.pendingSpawn = false; this.spawn(); }
      this.checkGoal();
    }
    cashOut() {
      if (this.status !== 'choice') return;
      this.finish('cash');
    }
    finish(outcome) {
      if (!this.sandbox && this.status !== 'over') SB.Run.recordStyle(this.run, this);
      // Carry-On keeps what's held (by piece) for the next Stack; a Stack with no Hold leaves the last set alone
      if (!this.sandbox && this.status !== 'over') {
        if (!this.has('carry_on')) this.run.keptHolds = null;
        else if (this.holdSlots() > 0) this.run.keptHolds = this.holds.map((h) => (h && h.inst.uid >= 0 ? h.inst.uid : null));
      }
      this.status = 'over';
      this.outcome = outcome;
      this.active = null;
      this.emit('finish', { outcome });
    }
    result() {
      return {
        outcome: this.outcome, score: this.banked + this.score, target: this.target, pushesDone: this.outcome === 'net' ? 0 : this.pushesDone,
        timeLeft: this.timeLeft(), endReason: this.endReason,
        pushAttempts: this.pushTier, targetTime: this.targetTime === null ? this.time : this.targetTime, elapsed: this.time,
        lines: this.lines, pactLeft: this.boardSpecialCount('pact'), money: this.money,
      };
    }

    topOut(reason) {
      this.endReason = reason;
      // Overflow lip: once per Stack
      if (reason !== 'timeout' && this.run.board.overflow && !this.overflowUsed) {
        this.overflowUsed = true;
        this.burnTop(6);
        this.emit('toast', { ico: SB.BOARD_UPGRADES.overflow.iconKey, text: 'Overflow Lip saved you!' });
        if (!this.active || reason === 'blockout') this.spawn();
        return;
      }
      if (reason !== 'timeout' && this.has('phoenix_feather') && !this.run.flags.phoenixUsed) {
        this.run.flags.phoenixUsed = true;
        this.burnTop(10);
        this.emit('toast', { ico: SB.RELICS.phoenix_feather.iconKey, text: 'Phoenix Feather: rising from the ashes!' });
        this.shake = 14;
        if (!this.active || reason === 'blockout') this.spawn();
        return;
      }
      SB.audio.play('topout');
      if (reason !== 'timeout' && !this.sandbox && SB.Ach && this.time <= 20) SB.Ach.bump('quickTopouts');
      if (this.pushTier > this.pushesDone) {
        if (this.has('safety_net') && !this.run.flags.netUsed) {
          this.run.flags.netUsed = true;
          this.emit('toast', { ico: SB.RELICS.safety_net.iconKey, text: 'Safety Net caught you!' });
          return this.finish('net');
        }
        return this.finish('lose');
      }
      if (this.targetTime !== null) return this.finish('cash');
      return this.finish('lose');
    }
    burnTop(n) {
      let r0 = 0;
      while (r0 < this.R && !this.grid[r0].some((b) => b)) r0++;
      for (let r = r0; r < Math.min(this.R, r0 + n); r++) this.grid[r] = new Array(this.W).fill(null);
      this.compactAll();
      this.shake = 10;
    }

    addGarbage(n, silent, hole) {
      for (let i = 0; i < n; i++) {
        if (this.grid[0].some((b) => b)) { this.topOut('garbage'); return; }
        this.grid.shift();
        let gap = hole === undefined ? SB.randInt(0, this.W - 1) : hole;
        if (this.has('lodestone')) gap = this.lodeCol();
        let guard = 0;
        while (this.blocked.has(gap) && guard++ < 20) gap = SB.randInt(0, this.W - 1);
        const row = new Array(this.W).fill(null).map((_, x) => (x === gap || this.blocked.has(x) ? null : { shape: 'G', color: '#5b5b6b', uid: -3, pid: -2, garbage: true, t: this.time }));
        this.grid.push(row);
        if (this.active && this.collides(this.active)) this.active.y--;
      }
      if (!silent) { SB.audio.play('garbage'); this.shake = Math.max(this.shake, 4); }
    }
    lodeCol() {
      const w = this.run.board.wells.find((x) => x < this.W && !this.blocked.has(x));
      if (w !== undefined) return w;
      for (let x = 0; x < this.W; x++) if (!this.blocked.has(x)) return x;
      return 0;
    }
    // Groundswell: a garbage row slides in under the stack, its hole in the same column all Stack so it can be dug out
    swell() {
      if (this.has('lodestone')) this.swellHole = this.lodeCol();
      if (this.swellHole === undefined || this.blocked.has(this.swellHole) || this.swellHole >= this.W) {
        const free = [];
        for (let x = 0; x < this.W; x++) if (!this.blocked.has(x)) free.push(x);
        this.swellHole = SB.pick(free);
      }
      this.addGarbage(1, true, this.swellHole);
      if (this.status === 'over') return;
      for (let x = 0; x < this.W; x += 2) if (x !== this.swellHole) this.burst(x, this.R - 1, 'dust', 1, '#8a8a9a');
      SB.audio.play('garbage');
      this.shake = Math.max(this.shake, 2);
    }
    monolithShrink() {
      const free = [];
      for (let x = 0; x < this.W; x++) if (!this.blocked.has(x)) free.push(x);
      if (free.length <= 6) return;
      const x = this.monolithSide++ % 2 === 0 ? free[0] : free[free.length - 1];
      this.blocked.add(x);
      for (let r = 0; r < this.R; r++) this.grid[r][x] = null;
      this.emit('toast', { ico: SB.BOSSES.monolith.iconKey, text: 'The Monolith closes in...', bad: true });
      this.shake = 8;
      this.resolveAfterBoardChange();
    }
    shockwave() {
      let best = -1;
      for (let r = 0; r < this.R; r++) if (this.grid[r].some((b) => b)) { best = r; break; }
      if (best >= 0) {
        this.grid.splice(best, 1);
        this.grid.unshift(new Array(this.W).fill(null));
        this.emit('toast', { ico: SB.SPECIALS.earthquake.iconKey, text: 'Shockwave!' });
        this.shake = 8;
      }
    }

    // ---------- live glyphs ----------
    useLive(id) {
      if (this.status !== 'playing') return false;
      switch (id) {
        case 'sweep': {
          let r = this.R - 1;
          while (r >= 0 && !this.grid[r].some((b) => b)) r--;
          if (r < 0) return false;
          this.grid.splice(this.R - 1, 1);
          this.grid.unshift(new Array(this.W).fill(null));
          this.flashRows.push({ r: this.R - 1, t: 0.3, color: '#7cf8ff' });
          break;
        }
        case 'swap': {
          this.fillQueue();
          const next = this.queue.shift();
          this.spawn(next);
          break;
        }
        case 'freeze': this.freezeUntil = this.time + 6; break;
        case 'lift': {
          let r0 = 0;
          while (r0 < this.R && !this.grid[r0].some((b) => b)) r0++;
          for (let r = r0; r < Math.min(this.R, r0 + 3); r++) this.grid[r] = new Array(this.W).fill(null);
          this.compactAll();
          break;
        }
        default: return false;
      }
      SB.audio.play('glyph');
      return true;
    }
  }
  SB.Game = Game;
})(window.SB);
