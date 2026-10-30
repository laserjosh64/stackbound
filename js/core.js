// Stackbound core: namespace, RNG, helpers, audio, persistence
'use strict';
window.SB = window.SB || {};

(function (SB) {
  // ---------- Seeded RNG (mulberry32) ----------
  SB.makeRng = function (seed) {
    let s = seed >>> 0;
    const r = function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.getState = () => s;
    r.setState = (v) => { s = v >>> 0; };
    return r;
  };
  SB.rng = SB.makeRng(Date.now());

  SB.rand = () => SB.rng();
  SB.randInt = (a, b) => a + Math.floor(SB.rng() * (b - a + 1));
  SB.chance = (p) => SB.rng() < p;
  SB.pick = (arr) => arr[Math.floor(SB.rng() * arr.length)];
  SB.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(SB.rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  SB.weighted = (items, wfn) => {
    let total = 0;
    for (const it of items) total += Math.max(0, wfn(it));
    if (total <= 0) return items.length ? SB.pick(items) : null;
    let r = SB.rng() * total;
    for (const it of items) {
      r -= Math.max(0, wfn(it));
      if (r < 0) return it;
    }
    return items[items.length - 1];
  };
  SB.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  SB.fmt = function (n) {
    n = Math.floor(n);
    if (!isFinite(n)) return '∞';
    if (Math.abs(n) >= 1e12) return n.toExponential(2).replace('+', '');
    return n.toLocaleString('en-US');
  };
  SB.fmtX = function (x) {
    if (x >= 1000) return SB.fmt(x);
    return (Math.round(x * 100) / 100).toString();
  };
  SB.seedFromString = function (str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  };
  SB.randomSeedString = function () {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };
  SB.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Audio (tiny WebAudio synth, no files) ----------
  const A = (SB.audio = {
    ctx: null,
    master: null,
    muted: false,
    volume: 0.6,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
        // every effect goes through a small room so the sounds share one space instead of beeping in a void
        this.out = this.ctx.createGain();
        this.out.connect(this.master);
        const room = this.ctx.createConvolver(), wet = this.ctx.createGain(), sr = this.ctx.sampleRate, len = Math.floor(sr * 0.7);
        const ir = this.ctx.createBuffer(2, len, sr);
        for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
        room.buffer = ir; wet.gain.value = 0.16;
        this.out.connect(room); room.connect(wet); wet.connect(this.master);
      } catch (e) { this.ctx = null; }
      if (this.ctx && SB.Music) SB.Music.start();
    },
    tone(freq, dur, type, vol, slideTo, delay) {
      if (this.muted || !this.ctx) return;
      const t0 = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(vol || 0.05, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.out || this.master);
      o.start(t0); o.stop(t0 + dur + 0.02);
    },
    noise(dur, vol, delay) {
      if (this.muted || !this.ctx) return;
      const t0 = this.ctx.currentTime + (delay || 0);
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      const g = this.ctx.createGain();
      g.gain.value = vol || 0.08;
      src.buffer = buf; src.connect(g); g.connect(this.out || this.master);
      src.start(t0);
    },
    // band-passed noise with a moving centre: whooshes, crackles, thunder
    hiss(dur, vol, delay, f0, f1, q) {
      if (this.muted || !this.ctx) return;
      const t0 = this.ctx.currentTime + (delay || 0);
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      f.type = 'bandpass'; f.Q.value = q || 1;
      f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1 || f0, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.buffer = buf; src.connect(f); f.connect(g); g.connect(this.out || this.master);
      src.start(t0); src.stop(t0 + dur + 0.02);
    },
    // a struck tone: fast attack, natural decay, optional inharmonic partials [[ratio, level]] (mallets, bells, metal)
    ping(freq, dur, vol, delay, partials) {
      if (this.muted || !this.ctx) return;
      const t0 = this.ctx.currentTime + (delay || 0);
      for (const [r, lv] of [[1, 1]].concat(partials || [])) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq * r;
        const d = dur / Math.sqrt(r);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol * lv, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.connect(g); g.connect(this.out || this.master); o.start(t0); o.stop(t0 + d + 0.02);
      }
    },
    // a thud: a sine whose pitch falls quickly, like something landing
    knock(f0, f1, dur, vol, delay) {
      if (this.muted || !this.ctx) return;
      const t0 = this.ctx.currentTime + (delay || 0), o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur * 0.7);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.out || this.master); o.start(t0); o.stop(t0 + dur + 0.02);
    },
    // small random wobble so repeated sounds never come out identical
    vary(x, amt) { return x * (1 + (Math.random() * 2 - 1) * (amt || 0.03)); },
    // each skin lands with its own sound; hard drops already have a slam, so they get a quieter layer
    skinLand(skin, k) {
      const v = (x) => this.vary(x);
      switch (skin) {
        case 'pixel': this.tone(v(330), 0.04, 'square', 0.03 * k); this.tone(v(247), 0.05, 'square', 0.026 * k, null, 0.035); break;
        case 'toy': this.hiss(0.03, 0.12 * k, 0, 2600, 2400, 4); this.ping(v(1750), 0.05, 0.03 * k); this.knock(v(240), 170, 0.05, 0.05 * k); break;
        case 'neon': this.tone(v(118), 0.11, 'sawtooth', 0.022 * k, 112); this.ping(v(1480), 0.06, 0.012 * k); this.hiss(0.06, 0.04 * k, 0, 5200, 5000, 6); break;
        case 'bakery': this.knock(v(210), 120, 0.14, 0.07 * k); this.hiss(0.1, 0.05 * k, 0, 520, 300, 0.8); break;
        case 'skyline': this.knock(v(110), 58, 0.16, 0.1 * k); this.ping(v(392), 0.12, 0.022 * k, 0.005, [[2.01, 0.4]]); break;
        case 'steampunk': this.ping(v(523), 0.26, 0.026 * k, 0, [[2.43, 0.6], [4.27, 0.35], [6.1, 0.2]]); this.hiss(0.3, 0.045 * k, 0.04, 5200, 3600, 2); break;
        case 'brimstone': this.knock(v(80), 42, 0.18, 0.09 * k); this.hiss(0.16, 0.04 * k, 0.03, 5200, 3000, 2); break;
        case 'castle': this.knock(v(92), 45, 0.2, 0.11 * k); for (const d of [0.05, 0.09, 0.14]) this.hiss(0.03, 0.04 * k, d + Math.random() * 0.02, 900, 700, 1.5); break;
        default: this.knock(v(170), 80, 0.09, 0.08 * k); this.noise(0.03, 0.025 * k); break;
      }
    },
    // materials add their own ring on top
    matLand(mat) {
      const v = (x) => this.vary(x, 0.02);
      switch (mat) {
        case 'gold': this.ping(v(2093), 0.25, 0.026, 0, [[1.5, 0.5]]); this.ping(v(3136), 0.2, 0.018, 0.06); break;
        case 'glass': this.ping(v(2637), 0.18, 0.028, 0, [[2.7, 0.4]]); break;
        case 'steel': this.ping(v(740), 0.3, 0.026, 0, [[2.76, 0.5], [5.4, 0.25]]); break;
        case 'stone': this.knock(v(72), 40, 0.22, 0.09); this.noise(0.05, 0.03); break;
        case 'crystal': this.ping(v(1760), 0.4, 0.022, 0, [[3, 0.3]]); this.ping(v(2637), 0.35, 0.016, 0.05); break;
        case 'lucky': [1568, 1976, 2349].forEach((f, i) => this.ping(v(f), 0.12, 0.016, i * 0.045)); break;
        case 'holo': this.ping(v(1200), 0.3, 0.015); this.ping(v(1214), 0.3, 0.015, 0.01); this.hiss(0.25, 0.025, 0, 6000, 9000, 3); break;
        case 'yolk': this.matLand('gold'); this.matLand('holo'); break;
      }
    },
    play(name, arg) {
      if (this.muted || !this.ctx) return;
      // the equipped sound pack (sfx.js) plays the names it has; the rest fall through to these
      const pk = SB.SFX && SB.SFX.current();
      if (pk && pk.play[name]) {
        pk.play[name](this, arg);
        if (name === 'lock' && arg && arg.mat) this.matLand(arg.mat);
        return;
      }
      switch (name) {
        case 'move': this.hiss(0.025, 0.05, 0, 2400, 1800, 1.5); this.ping(this.vary(330), 0.03, 0.012); break;
        case 'rotate': this.hiss(0.05, 0.05, 0, 1800, 3200, 1.4); this.ping(this.vary(660), 0.05, 0.02, 0, [[2, 0.3]]); break;
        case 'hold': this.hiss(0.12, 0.06, 0, 900, 2600, 1.2); this.ping(520, 0.12, 0.03); this.ping(780, 0.1, 0.025, 0.05); break;
        case 'lock': { const o = arg || {}; this.skinLand(SB.Cosmetic ? SB.Cosmetic.skin() : 'puffy', o.hard ? 0.55 : 1); if (o.mat) this.matLand(o.mat); break; }
        case 'harddrop': { const p = arg || 0.5; this.noise(0.09 + p * 0.06, 0.07 + p * 0.05); this.tone(150, 0.2, 'sine', 0.13, 38); this.tone(70, 0.16, 'square', 0.02 + p * 0.03, 34); break; }
        case 'softtick': this.tone(1100 + Math.min(12, arg || 0) * 45, 0.016, 'triangle', 0.01); break;
        case 'softland': this.tone(260, 0.07, 'triangle', 0.035, 190); break;
        case 'clear': {
          // a mallet run up a pentatonic scale, one note more per line, with a soft swell under it
          const n = Math.min(4, arg || 1), scale = [523, 587, 659, 784, 880, 1046];
          for (let i = 0; i <= n; i++) this.ping(this.vary(scale[i + (n > 2 ? 1 : 0)], 0.008), 0.35, 0.045, i * 0.055 + Math.random() * 0.01, [[2, 0.35], [3, 0.12]]);
          this.hiss(0.25, 0.04, 0, 800, 4000, 0.9);
          break;
        }
        case 'quad':
          [523, 659, 784, 1046, 1318].forEach((f, i) => this.ping(f, 0.5, 0.05, i * 0.06, [[2, 0.4], [3, 0.15]]));
          this.knock(140, 55, 0.3, 0.1); this.hiss(0.6, 0.06, 0.05, 1200, 8000, 0.8); this.ping(2093, 0.8, 0.02, 0.32, [[1.5, 0.5]]);
          break;
        case 'tick': this.tone(700 + (arg || 0) * 30, 0.04, 'square', 0.02); break;
        case 'mult': this.tone(180 + (arg || 0) * 20, 0.09, 'sawtooth', 0.035); break;
        case 'xmult': this.tone(140, 0.18, 'sawtooth', 0.05, 420); break;
        case 'money': this.ping(2093, 0.08, 0.03); this.ping(2637, 0.2, 0.03, 0.06, [[1.5, 0.3]]); break;
        case 'buy': this.ping(1318, 0.1, 0.04); this.ping(1760, 0.25, 0.04, 0.07, [[2, 0.3]]); this.hiss(0.05, 0.04, 0, 3000, 5000, 2); break;
        case 'unlock': [523, 659, 784, 1046].forEach((f, i) => { this.tone(f, 0.22, 'triangle', 0.05, null, i * 0.07); this.tone(f * 2, 0.12, 'sine', 0.015, null, i * 0.07 + 0.01); }); this.tone(1568, 0.5, 'sine', 0.03, null, 0.3); break;
        case 'deny': this.knock(190, 120, 0.12, 0.06); this.tone(150, 0.12, 'triangle', 0.035, 120, 0.06); break;
        case 'target': [392, 523, 659, 784, 1046].forEach((f, i) => this.ping(f, 0.45, 0.055, i * 0.08, [[2, 0.35], [3, 0.1]])); this.hiss(0.5, 0.05, 0.1, 1000, 6000, 0.8); break;
        case 'topout': this.tone(300, 0.9, 'sawtooth', 0.06, 40); this.noise(0.5, 0.08, 0.1); break;
        case 'levelup': [523, 784, 1046].forEach((f, i) => this.ping(f, 0.22, 0.04, i * 0.06, [[2, 0.3]])); break;
        case 'thaw': this.tone(1200, 0.12, 'sine', 0.04, 600); break;
        case 'shatter': this.noise(0.25, 0.08); this.tone(2000, 0.15, 'sine', 0.02, 900); break;
        case 'bomb': this.noise(0.35, 0.14); this.tone(70, 0.3, 'sine', 0.1, 30); break;
        case 'click': this.ping(this.vary(880), 0.04, 0.024); this.hiss(0.015, 0.03, 0, 3000, 3000, 2); break;
        case 'tap': this.ping(this.vary(1046, 0.04), 0.025, 0.012); break;
        case 'hover': this.ping(this.vary(1760, 0.03), 0.018, 0.005); break;
        case 'coin': this.ping(this.vary(2349, 0.02) * (1 + Math.min(8, arg || 0) * 0.03), 0.07, 0.016, 0, [[1.5, 0.25]]); break;
        case 'tab': this.ping(660, 0.05, 0.022); this.ping(990, 0.07, 0.02, 0.04); break;
        case 'equip': this.ping(784, 0.14, 0.035, 0, [[2, 0.3]]); this.ping(1175, 0.22, 0.03, 0.07, [[2, 0.25]]); this.hiss(0.18, 0.03, 0.05, 4000, 8000, 2); break;
        case 'open': this.hiss(0.14, 0.05, 0, 600, 2400, 1.2); this.ping(523, 0.08, 0.014, 0.06); break;
        case 'close': this.hiss(0.12, 0.045, 0, 2200, 600, 1.2); break;
        case 'garbage': this.tone(90, 0.1, 'square', 0.04); break;
        case 'glyph': this.tone(880, 0.2, 'sine', 0.04, 1760); break;
        case 'timehold': this.tone(1500, 0.28, 'sine', 0.04, 480); this.tone(750, 0.34, 'triangle', 0.03, 240, 0.06); this.tone(1900, 0.06, 'sine', 0.02, null, 0.3); break;
        // accents for the clear effects bought at the Prize Counter (arg = lines cleared)
        case 'fx_shatter': {
          const n = arg || 1;
          this.hiss(0.18, 0.14, 0, 5200, 2600, 0.8);
          for (let i = 0; i < 4 + n * 2; i++) this.tone(2400 + Math.random() * 3200, 0.08 + Math.random() * 0.1, 'sine', 0.025, null, 0.02 + i * 0.025 + Math.random() * 0.02);
          break;
        }
        case 'fx_confetti': {
          const n = Math.min(4, arg || 1);
          for (let i = 0; i < n + 1; i++) { this.hiss(0.09, 0.16, i * 0.1, 1800, 600, 1.2); this.tone(420 + i * 90, 0.07, 'triangle', 0.04, 900 + i * 120, i * 0.1); }
          this.hiss(0.5, 0.05, 0.08, 6000, 3000, 0.5);
          break;
        }
        case 'fx_lightning': {
          const n = arg || 1;
          this.hiss(0.08, 0.22, 0, 3800, 1200, 0.7);
          this.hiss(0.9 + n * 0.15, 0.2, 0.04, 260, 60, 0.6);
          this.tone(55, 0.7, 'sine', 0.12, 32, 0.03);
          break;
        }
        case 'fx_fireworks': {
          const n = Math.min(5, (arg || 1) * 2);
          for (let i = 0; i < n; i++) {
            this.hiss(0.32, 0.05, i * 0.12, 700, 3200, 2);
            this.hiss(0.22, 0.2, i * 0.12 + 0.32, 900, 140, 0.7);
            this.tone(90, 0.22, 'sine', 0.06, 40, i * 0.12 + 0.32);
            for (let j = 0; j < 5; j++) this.hiss(0.025, 0.06, i * 0.12 + 0.55 + j * 0.05 + Math.random() * 0.04, 4800, 4800, 3);
          }
          break;
        }
        case 'fx_dissolve': {
          const n = arg || 1;
          [1568, 1175, 880, 659, 494, 392].slice(0, 3 + n).forEach((f, i) => this.tone(f, 0.07, 'square', 0.022, null, i * 0.045));
          this.hiss(0.45, 0.07, 0, 3000, 400, 2.5);
          break;
        }
        case 'fx_hellfire': {
          const n = Math.min(4, arg || 1);
          this.hiss(0.5 + n * 0.1, 0.16, 0, 300, 2600, 0.7);
          this.hiss(0.7, 0.07, 0.15, 2400, 500, 1.2);
          this.tone(62, 0.6, 'sawtooth', 0.035, 38);
          for (let i = 0; i < 6 + n * 2; i++) this.hiss(0.02, 0.05, 0.1 + Math.random() * 0.6, 4200, 4200, 3);
          break;
        }
        case 'cell': { const f = 660 * Math.pow(1.122, Math.min(8, arg || 0)); this.tone(f, 0.14, 'triangle', 0.045, f * 1.5); this.tone(f * 2, 0.08, 'sine', 0.02, null, 0.03); break; }
      }
    },
  });

  // ---------- Persistent meta progression ----------
  const META_KEY = 'stackbound_meta_v1';
  const RUN_KEY = 'stackbound_run_v1';
  // saves from before pass 35 used older names for some clear types, stats, curios, achievements and the
  // dating-game style; rename those keys and ids so old saves load into the new names
  const OLD_IDS = { tetrises: 'quads', tetris: 'quad', tspin: 'twist', tspins: 'twists', tspinDoubles: 'twistDoubles', first_tetris: 'first_quad',
    tetris25: 'quad25', tetris_tax: 'quad_tax', tetris_supreme: 'standing_ovation', tetromancer: 'fourcaster', doki: 'sweet' };
  const OLD_RE = new RegExp('"(' + Object.keys(OLD_IDS).join('|') + ')"', 'g');
  const migrate = (raw) => (raw ? raw.replace(OLD_RE, (m, k) => '"' + OLD_IDS[k] + '"') : raw);
  SB.meta = {
    data: null,
    defaults() {
      return {
        runs: 0, wins: 0, bestAnte: 0, bestScore: 0,
        quads: 0, consumablesUsed: 0, lines: 0, pushes: 0,
        discovered: {}, stakeWon: {}, unlocked: { architect: true, miner: true },
        settings: { das: 150, arr: 33, sdf: 40, muted: false, volume: 0.6, music: 0.45, shake: true, scorePops: true, touchButtons: false, swipeSens: 3, swipeSlide: true, ver: 4 },
      };
    },
    load() {
      try {
        const raw = migrate(localStorage.getItem(META_KEY));
        this.data = Object.assign(this.defaults(), raw ? JSON.parse(raw) : {});
        const saved = this.data.settings || {};
        this.data.settings = Object.assign(this.defaults().settings, saved);
        // v4 changed soft drop to ease into its top speed; move the old 25ms default to the new 40ms one
        if (!saved.ver || saved.ver < 4) { if (saved.sdf === 25) this.data.settings.sdf = 40; this.data.settings.ver = 4; }
      } catch (e) { this.data = this.defaults(); }
      return this.data;
    },
    save() {
      try { localStorage.setItem(META_KEY, JSON.stringify(this.data)); } catch (e) { /* storage unavailable */ }
    },
    discover(id) {
      if (!this.data.discovered[id]) { this.data.discovered[id] = true; this.save(); }
    },
    // the Collection shows every curio while SB.FREE_BUILD is on
    seen(id) {
      return SB.FREE_BUILD || !!this.data.discovered[id];
    },
  };
  SB.saveRun = function (run) {
    try {
      if (!run) { localStorage.removeItem(RUN_KEY); return; }
      run.rngState = SB.rng.getState();
      localStorage.setItem(RUN_KEY, JSON.stringify(run));
    } catch (e) { /* ignore */ }
  };
  SB.loadRun = function () {
    try {
      const raw = migrate(localStorage.getItem(RUN_KEY));
      if (!raw) return null;
      const run = JSON.parse(raw);
      if (!run || run.version !== SB.RUN_VERSION) return null;
      return run;
    } catch (e) { return null; }
  };
  SB.RUN_VERSION = 3;
})(window.SB);
