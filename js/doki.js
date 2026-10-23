// The Doki Doki style: unlocked by the true end on all four routes of Falling for You (dating.js). When it's on, the
// whole game dresses up as a pastel club-room romance: pink paper UI and rounded lettering (html.doki in dating.css),
// plush pastel pieces with stitched seams (the 'doki' skin), a bouncy piano-and-bells song, and soft cute sounds
// (a heartbeat on hard drops). It sits over the Prize Counter picks without changing them; switch it off and they're back.
'use strict';
(function (SB) {
  const K = (SB.Doki = {});
  const settings = () => (SB.meta && SB.meta.data && SB.meta.data.settings) || {};
  K.unlocked = () => !!(SB.Dating && SB.Dating.styleUnlocked());
  K.on = () => K.unlocked() && !!settings().doki;
  // what the style puts over the Prize Counter picks
  const OVER = { skin: 'doki', song: 'doki', clear: 'confetti' };

  K.set = function (on) {
    const s = settings();
    s.doki = !!on && K.unlocked();
    if (SB.meta && SB.meta.save) SB.meta.save();
    K.apply();
    if (SB.audio && SB.audio.play) SB.audio.play(s.doki ? 'equip' : 'tab');
  };
  K.apply = function () {
    const on = K.on();
    document.documentElement.classList.toggle('doki', on);
    // the board well goes plum with soft pink lines; render.js falls back to its own colours when these are unset
    const Rn = SB.Render;
    if (Rn) {
      Rn.theme = Rn.theme || {};
      if (on) { Rn.theme.board = '#2e1733'; Rn.theme.grid = 'rgba(255,170,215,0.10)'; }
      else { delete Rn.theme.board; delete Rn.theme.grid; }
    }
    if (SB.UI && SB.UI.applyFont) SB.UI.applyFont();
    if (SB.Cosmetic && SB.Cosmetic.apply && !(SB.Dating && SB.Dating.isOpen)) SB.Cosmetic.apply('song');
    if (SB.UI && SB.UI.game && SB.Cosmetic) SB.UI.game.clearStyle = SB.Cosmetic.clearStyle();
  };

  // ---------- the Prize Counter picks, seen through the style ----------
  if (SB.Cosmetic) {
    const C = SB.Cosmetic, orig = C.equipped;
    C.equipped = (cat) => (OVER[cat] && K.on() && !(SB.UI && SB.UI.screen === 'prizes') ? OVER[cat] : orig(cat));
  }

  // ---------- plush pastel pieces ----------
  const Rn = SB.Render;
  const T = 1, R = 2, B = 4, L = 8;
  const mix = (a, b, t) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), Bc = p(b);
    return '#' + A.map((v, i) => Math.round(v + (Bc[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  function shape(c, x0, y0, x1, y1, r, e) {
    const tl = e & T && e & L ? r : 0, tr = e & T && e & R ? r : 0, br = e & B && e & R ? r : 0, bl = e & B && e & L ? r : 0;
    c.beginPath();
    c.moveTo(x0 + tl, y0);
    c.lineTo(x1 - tr, y0); if (tr) c.arcTo(x1, y0, x1, y0 + tr, tr);
    c.lineTo(x1, y1 - br); if (br) c.arcTo(x1, y1, x1 - br, y1, br);
    c.lineTo(x0 + bl, y1); if (bl) c.arcTo(x0, y1, x0, y1 - bl, bl);
    c.lineTo(x0, y0 + tl); if (tl) c.arcTo(x0, y0, x0 + tl, y0, tl);
    c.closePath();
  }
  function heartPath(c, cx, cy, r) {
    c.beginPath();
    c.moveTo(cx, cy + r * 0.9);
    c.bezierCurveTo(cx - r * 1.6, cy - r * 0.1, cx - r * 0.9, cy - r * 1.3, cx, cy - r * 0.45);
    c.bezierCurveTo(cx + r * 0.9, cy - r * 1.3, cx + r * 1.6, cy - r * 0.1, cx, cy + r * 0.9);
    c.closePath();
  }
  if (Rn && Rn.SKINS) {
    Rn.SKINS.doki = {
      edgy: true,
      paint(c, S, base, e, lead) {
        const pastel = mix(mix(base, '#ffffff', 0.42), '#ffd3ea', 0.18), edge = mix(base, '#5a1f4f', 0.55);
        const p = Math.max(1, Math.round(S * 0.05)), r = S * 0.26;
        const x0 = e & L ? p : 0, y0 = e & T ? p : 0, x1 = e & R ? S - p : S, y1 = e & B ? S - p : S;
        c.fillStyle = pastel; shape(c, x0, y0, x1, y1, r, e); c.fill();
        c.save(); shape(c, x0, y0, x1, y1, r, e); c.clip();
        // soft fabric shading and a satin shine on top
        const g = c.createLinearGradient(0, 0, 0, S);
        g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,20,90,0.14)');
        c.fillStyle = g; c.fillRect(0, 0, S, S);
        if (e & T) { c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(S * 0.42, y0 + S * 0.16, S * 0.26, S * 0.06, 0, 0, Math.PI * 2); c.fill(); }
        // little polka dots
        c.fillStyle = 'rgba(255,255,255,0.45)';
        for (const [dx, dy] of [[0.72, 0.68], [0.3, 0.8], [0.82, 0.3]]) { c.beginPath(); c.arc(S * dx, S * dy, Math.max(0.8, S * 0.045), 0, Math.PI * 2); c.fill(); }
        // stitched seams where blocks meet
        if (S >= 14) {
          c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = Math.max(1, S * 0.04); c.setLineDash([S * 0.09, S * 0.07]);
          c.beginPath();
          if (!(e & L)) { c.moveTo(S * 0.06, S * 0.1); c.lineTo(S * 0.06, S * 0.9); }
          if (!(e & T)) { c.moveTo(S * 0.1, S * 0.06); c.lineTo(S * 0.9, S * 0.06); }
          c.stroke(); c.setLineDash([]);
        }
        c.restore();
        // outline only round the outside of the piece
        c.strokeStyle = edge; c.lineWidth = Math.max(1, S * 0.06);
        c.save(); c.beginPath(); c.rect(e & L ? -2 : 1, e & T ? -2 : 1, (e & R ? S + 2 : S - 1) - (e & L ? -2 : 1), (e & B ? S + 2 : S - 1) - (e & T ? -2 : 1)); c.clip();
        shape(c, x0 + c.lineWidth / 2, y0 + c.lineWidth / 2, x1 - c.lineWidth / 2, y1 - c.lineWidth / 2, Math.max(0, r - c.lineWidth / 2), e); c.stroke(); c.restore();
        // the top block wears a heart
        if (lead && S >= 10) {
          heartPath(c, S / 2, S * 0.52, S * 0.2);
          c.fillStyle = '#fff'; c.fill(); c.lineWidth = Math.max(1, S * 0.05); c.strokeStyle = edge; c.stroke();
          heartPath(c, S / 2, S * 0.53, S * 0.1); c.fillStyle = '#ff5fa2'; c.fill();
        }
        return { p, w: S - 2 * p, r, i: S * 0.16, own: true };
      },
    };
  }

  // ---------- the song: bright piano, music box and claps (original, in C major) ----------
  if (SB.Dating && SB.Dating.addSong) {
    SB.Dating.addSong('doki', {
      bpm: 128, swing: 0.08, feel: 0.006,
      main: [[48, 60, 64, 67], [45, 60, 64, 69], [41, 60, 65, 69], [43, 59, 62, 67]],
      boss: [[48, 60, 63, 67], [44, 60, 63, 68], [46, 58, 62, 65], [43, 59, 62, 67]],
      key: 72, mode: [0, 2, 4, 5, 7, 9, 11],
      mel: ['0/2 2/2 4/2 7/2 6/2 4/2 2/4', '4/4 2/2 0/2 -2/8', '0/2 2/2 3/2 5/2 7/4 5/4', '4/6 2/2 4/8',
        '7/2 7/2 9/2 7/2 6/2 4/2 2/4', '4/4 5/4 7/8', '5/2 4/2 3/2 4/2 5/4 1/4', '0/12 r/4'],
      alt: ['4/8 5/8', '4/16', '5/8 7/8', '6/16', '7/8 9/8', '9/16', '8/8 7/8', '6/16'], altOct: -12,
      lead: { voice: 'flute', vol: 0.1, glide: 0.25 },
      keys: { voice: 'epiano', hits: '9...7.6...7.6...', len: 3 },
      bass: { voice: 'finger', pat: 'r...o...r...o.a.', vel: '9...6...8...6.7.', boss: 'r.g.o...r.g.o.a.', len: 1.4 },
      arp: { voice: 'bell', vol: 0.75, every: 2, pat: [3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 3, 2, 1], oct: 24 },
      drums: { kick: '9.......9.......', kickHot: '9.....6.9.......', snare: '....9.......9...', hat: '5.3.5.3.5.3.5.3.', clap: 1, fill: 'snare' },
    });
  }

  // ---------- soft, cute sounds ----------
  const A = SB.audio;
  if (A) {
    const play = A.play.bind(A), land = A.skinLand.bind(A);
    const beat = (vol, d) => { A.knock(A.vary(78), 46, 0.16, vol, d); A.knock(A.vary(70), 42, 0.2, vol * 0.8, d + 0.17); };
    const DOKI = {
      move: () => A.ping(A.vary(1568, 0.02), 0.04, 0.014),
      rotate: () => { A.ping(A.vary(1175, 0.01), 0.07, 0.02); A.ping(A.vary(1568, 0.01), 0.08, 0.016, 0.035); },
      hold: () => { A.hiss(0.16, 0.05, 0, 3000, 1200, 1.2); A.ping(784, 0.12, 0.03, 0.04, [[2, 0.3]]); A.ping(1046, 0.16, 0.026, 0.1); },
      harddrop: () => { beat(0.16, 0); A.hiss(0.06, 0.04, 0, 4000, 2000, 2); },
      softland: () => A.ping(660, 0.07, 0.02),
      clear: (n) => { const sc = [1046, 1175, 1318, 1568, 1760, 2093]; for (let i = 0; i <= Math.min(4, n || 1); i++) A.ping(sc[i], 0.45, 0.04, i * 0.07, [[2, 0.3], [3.01, 0.12]]); A.hiss(0.3, 0.03, 0.05, 6000, 9000, 1.5); },
      tetris: () => { [1046, 1318, 1568, 2093, 2637, 2093, 2637, 3136].forEach((f, i) => A.ping(f, 0.6, 0.04, i * 0.075, [[2, 0.25]])); beat(0.12, 0.62); },
      click: () => { A.ping(A.vary(1318, 0.02), 0.05, 0.026); A.ping(1976, 0.04, 0.012, 0.02); },
      tap: () => A.ping(A.vary(1760, 0.03), 0.035, 0.014),
      hover: () => A.ping(A.vary(2349, 0.02), 0.02, 0.006),
      tab: () => { A.ping(1046, 0.06, 0.02); A.ping(1568, 0.08, 0.02, 0.05); },
      open: () => { A.hiss(0.14, 0.04, 0, 1200, 4000, 1.2); A.ping(1318, 0.1, 0.018, 0.06); },
      close: () => { A.hiss(0.12, 0.035, 0, 3000, 900, 1.2); A.ping(988, 0.08, 0.014, 0.03); },
      deny: () => { A.ping(392, 0.12, 0.03); A.ping(370, 0.16, 0.026, 0.08); },
      topout: () => { [784, 659, 523, 392].forEach((f, i) => A.ping(f, 0.5, 0.04, i * 0.16, [[2, 0.2]])); beat(0.12, 0.7); beat(0.08, 1.2); },
    };
    A.play = function (name, arg) {
      if (K.on() && DOKI[name] && !this.muted && this.ctx) { DOKI[name](arg); return; }
      return play(name, arg);
    };
    // also offered as a sound pack in the Prize Counter
    if (SB.SFX && SB.SFX.register) {
      const pack = {};
      Object.keys(DOKI).forEach((n) => { pack[n] = (a, x) => DOKI[n](x); });
      pack.lock = () => A.skinLand('doki', 1);
      SB.SFX.register('doki', { name: 'Doki Doki', price: 0, desc: 'Bell pings, a heartbeat on every slam and a sparkle run for Tetrises', art: () => K.art(), ach: 'four_hearts', play: pack });
    }
    A.skinLand = function (skin, k) {
      if (skin !== 'doki') return land(skin, k);
      A.knock(A.vary(300), 180, 0.07, 0.06 * k); A.ping(A.vary(1568, 0.03), 0.06, 0.018 * k); A.hiss(0.04, 0.03 * k, 0, 2400, 1800, 1.5);
    };
  }

  // the badge on the unlock card: a pink heart with a ribbon, made of four plush blocks
  K.art = function () {
    const blk = (x, y, c) => `<rect x="${x}" y="${y}" width="40" height="40" rx="11" fill="${c}" stroke="#7a2a64" stroke-width="4"/><rect x="${x + 7}" y="${y + 6}" width="20" height="6" rx="3" fill="#fff" opacity=".6"/>`;
    return `<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M100 150 C 20 100, 10 50, 50 28 C 74 16, 94 30, 100 46 C 106 30, 126 16, 150 28 C 190 50, 180 100, 100 150Z" fill="#ffd3ea" stroke="#7a2a64" stroke-width="5"/>
      ${blk(58, 56, '#ffb3d6')}${blk(102, 56, '#d9b8ff')}${blk(80, 96, '#b8f0ff')}
      <path d="M100 30 c -12 -20 -40 -18 -34 0 c 4 10 24 8 34 0z M100 30 c 12 -20 40 -18 34 0 c -4 10 -24 8 -34 0z" fill="#ff5fa2" stroke="#7a2a64" stroke-width="4"/><circle cx="100" cy="30" r="7" fill="#ff8cc0" stroke="#7a2a64" stroke-width="4"/></svg>`;
  };

  // put the style back on when the game starts
  if (SB.UI && SB.UI.init) {
    const init = SB.UI.init;
    SB.UI.init = function () { const r = init.apply(this, arguments); K.apply(); return r; };
  }
})(window.SB);
