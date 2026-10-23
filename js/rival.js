// Stackbound rival: an Endless Warden modifier. A rival stacker plays beside you at a pace taken from your own best
// this run (pieces per second, time between clears, lines per clear), a little faster. Lines you clear send it
// garbage, lines it clears send garbage to you, and you score nothing until it tops out. The clock keeps running.
'use strict';
(function (SB) {
  const H = 20, W = 10, COLORS = ['#35e6ff', '#ffd23b', '#b06bff', '#4dff9a', '#ff4d6a', '#ff9a3b', '#4a7aff'];
  // garbage sent per clear, guideline style: singles send nothing, a Tetris sends 4
  const ATTACK = [0, 0, 1, 2, 4, 5];
  const TSPIN = [0, 2, 4, 6, 8];
  const COMBO = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5];
  // the Rival is fast but blunt: a single sends half a line, a double or triple 1, a Tetris 2, and it never chains
  const RIVAL_ATTACK = [0, 0.5, 1, 1, 2];

  // what the rival plays like, from the run's play style (Run.recordStyle)
  SB.rivalStyle = (run) => {
    const s = run.style || {};
    const lpc = s.clears ? s.lines / s.clears : 1.8;
    return {
      pps: Math.max(0.8, s.bestPPS || 1) * SB.RIVAL.pace,
      clearEvery: Math.max(2.2, (s.bestClear || 6) / SB.RIVAL.pace),
      lines: SB.clamp(Math.round(lpc), 1, 4),
    };
  };
  // what your clear sends: guideline attack plus T-spin, back-to-back and combo bonuses
  SB.clearAttack = (info) => {
    if (info.allclear) return 10;
    let a = info.tspin ? TSPIN[Math.min(4, info.lines)] : ATTACK[Math.min(5, info.lines)];
    if (info.b2b) a += 1;
    a += COMBO[Math.min(COMBO.length - 1, info.combo || 0)];
    return a;
  };

  class Rival {
    constructor(game, style) {
      this.g = game;
      this.style = style;
      this.garb = []; // garbage rows from the bottom up: the hole's column
      this.own = []; // its own rows above the garbage, bottom up: arrays of colors (null = empty)
      this.pending = 0; // garbage you sent that lands on its next piece
      this.pieceT = 0;
      this.clearT = 0;
      this.nextClear = style.clearEvery;
      this.atkAcc = 0;
      this.sent = 0; // garbage it has sent you
      this.taken = 0; // garbage it has taken from you
      this.ko = false;
      this.flash = 0;
      for (let i = 0; i < 3; i++) this.place();
    }
    height() { return this.garb.length + this.own.length; }
    update(dt) {
      if (this.ko) return;
      this.flash = Math.max(0, this.flash - dt);
      this.pieceT += dt;
      const every = 1 / this.style.pps;
      while (this.pieceT >= every && !this.ko) { this.pieceT -= every; this.place(); }
      this.clearT += dt;
      const full = this.own.filter((r) => r.every(Boolean)).length;
      const want = Math.min(this.style.lines, 4);
      // it clears on its own rhythm, or early if its stack gets tall
      if (full && ((this.clearT >= this.nextClear && full >= want) || this.own.length >= 9)) this.clear(Math.min(full, want));
    }
    // one piece: either digs a garbage row or adds four blocks to its own stack
    place() {
      if (this.pending > 0) {
        const n = Math.min(8, this.pending);
        this.pending -= n;
        const hole = SB.randInt(0, W - 1);
        for (let i = 0; i < n; i++) this.garb.unshift(hole);
        this.taken += n;
        this.flash = 0.35;
        if (this.height() >= H) return this.knockOut();
      }
      if (this.garb.length && SB.chance(SB.RIVAL.dig)) { this.garb.pop(); return; }
      const color = SB.pick(COLORS);
      for (let k = 0; k < 4; k++) {
        let row = this.own.find((r) => r.some((c) => !c));
        if (!row) { row = new Array(W).fill(null); this.own.push(row); }
        const free = row.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
        row[SB.pick(free)] = color;
      }
      if (this.height() >= H) this.knockOut();
    }
    clear(n) {
      let left = n;
      this.own = this.own.filter((r) => !(left > 0 && r.every(Boolean) && left--));
      this.clearT = 0;
      this.nextClear = this.style.clearEvery * (0.8 + SB.rand() * 0.4);
      this.atkAcc += RIVAL_ATTACK[n] || 0;
      let atk = Math.floor(this.atkAcc);
      this.atkAcc -= atk;
      // its attack cancels what you sent it first
      const c = Math.min(atk, this.pending);
      this.pending -= c; atk -= c;
      if (atk > 0) {
        this.g.incoming += atk;
        this.sent += atk;
        SB.audio.play('garbage');
        this.g.emit('rival', { kind: 'attack', n: atk });
      }
    }
    // your clear: cancels garbage headed for you, the rest goes to the rival
    hit(info) {
      if (this.ko) return 0;
      let a = SB.clearAttack(info);
      const c = Math.min(a, this.g.incoming);
      this.g.incoming -= c; a -= c;
      if (a > 0) { this.pending += a; this.g.emit('rival', { kind: 'send', n: a }); }
      return a;
    }
    knockOut() {
      if (this.ko) return;
      this.ko = true;
      this.pending = 0;
      this.g.incoming = 0;
      SB.audio.play('levelup');
      this.g.addMoney(SB.RIVAL.reward, 'Rival');
      this.g.emit('toast', { ico: 'devil-mask', text: 'Rival topped out! Your clears score again' });
      this.g.emit('rival', { kind: 'ko' });
      this.g.shake = Math.max(this.g.shake, 8);
    }
  }
  SB.Rival = Rival;

  // the rival's board, drawn small: garbage at the bottom, its own blocks above, what you've sent it as a red bar
  SB.drawRival = (cv, rv) => {
    if (!cv || !rv) return;
    const ctx = cv.getContext('2d'), cw = cv.width, ch = cv.height, s = Math.min(cw / (W + 1), ch / H);
    const ox = s, oy = ch - H * s;
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#0b0b1a';
    ctx.fillRect(ox, oy, W * s, H * s);
    const rowAt = (i) => oy + (H - 1 - i) * s;
    rv.garb.forEach((hole, i) => {
      if (i >= H) return;
      for (let x = 0; x < W; x++) if (x !== hole) { ctx.fillStyle = rv.flash > 0 ? '#9a8aa0' : '#5b5b6b'; ctx.fillRect(ox + x * s + 0.5, rowAt(i) + 0.5, s - 1, s - 1); }
    });
    rv.own.forEach((row, j) => {
      const i = rv.garb.length + j;
      if (i >= H) return;
      row.forEach((c, x) => { if (c) { ctx.fillStyle = c; ctx.fillRect(ox + x * s + 0.5, rowAt(i) + 0.5, s - 1, s - 1); } });
    });
    // danger line near the top
    ctx.fillStyle = 'rgba(255, 77, 106, .35)';
    ctx.fillRect(ox, oy + 3 * s, W * s, 1);
    if (rv.pending > 0) { const h = Math.min(H, rv.pending) * s; ctx.fillStyle = '#ff4d6a'; ctx.fillRect(0, ch - h, Math.max(2, s * 0.6), h); }
    if (rv.ko) {
      ctx.fillStyle = 'rgba(10, 8, 24, .7)';
      ctx.fillRect(ox, oy, W * s, H * s);
      ctx.fillStyle = '#ffd23b';
      ctx.font = `900 ${Math.round(s * 2.4)}px ${SB.fontDisp}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('K.O.', ox + (W * s) / 2, oy + (H * s) / 2);
    }
  };
})(window.SB);
