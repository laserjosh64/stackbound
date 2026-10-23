// Stackbound procedural music, played like a band rather than a step sequencer: written melodies with phrasing,
// loose human timing and dynamics, swing, voice-led and strummed chords, bass approach notes, drum fills and an
// arrangement that moves through sections (verse, verse with ornaments, bridge, last chorus with a harmony line).
// The seven layers (pad, bass, arp, kick, snare, hat, lead) still glide between areas (menu, play, boss, shop...)
// so transitions never cut. Songs (Prize Counter) are recipes for those layers; a new song takes over on the next bar.
'use strict';
(function (SB) {
  const M = (SB.Music = {
    started: false, area: 'menu', paused: false, intensity: 0, bpm: 100,
    step: 0, nextTime: 0, prog: 'main', pendingProg: null, volume: 0.45, songId: 'neon', pendingSong: null, songBar: 0,
    ctx: null, out: null, filter: null, layers: {}, noise: null, timer: null,
  });
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const MINOR = [0, 2, 3, 5, 7, 8, 10], MAJOR = [0, 2, 4, 5, 7, 9, 11], DORIAN = [0, 2, 3, 5, 7, 9, 10], PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];

  // Each song: tempo and feel (swing, timing looseness), chords (first note is the root the bass plays) and the boss
  // chords that take over on Warden Stacks, the key the melody is written in, and the parts.
  // Melodies are 8 bars of "degree/length" (scale steps from the key note, lengths in sixteenths, r = rest);
  // `alt` is the bridge line. Patterns are 16 steps: digits are how hard a hit is, letters say what a part plays.
  const SONGS = {
    // A minor: Am - F - C - G, boss Am - Bb - Am - E. Electric piano, harp-like plucks, a soft flute
    neon: {
      bpm: 100, swing: 0.06, feel: 0.009,
      main: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]],
      boss: [[57, 60, 64, 67], [58, 62, 65, 69], [57, 60, 64, 67], [52, 56, 59, 62]],
      key: 69, mode: MINOR,
      mel: ['4/3 2/1 4/2 7/4 6/2 4/4', '5/6 4/2 2/4 0/4', 'r/2 2/2 4/2 6/2 9/4 7/4', '8/4 6/2 4/2 6/8',
        '4/3 2/1 4/2 7/4 9/2 8/2 7/2', '5/4 7/2 5/2 4/4 2/4', '2/2 4/2 6/4 4/2 2/2 1/4', '1/4 -1/4 0/8'],
      alt: ['7/6 6/2 7/8', '5/8 r/4 4/4', '6/6 7/2 9/8', '8/12 r/4', '7/4 9/4 11/4 9/4', '10/8 9/4 7/4', '9/6 8/2 6/8', '8/8 r/8'], altOct: -12,
      lead: { voice: 'flute', vol: 0.12, glide: 0.35 },
      keys: { voice: 'epiano', hits: '9.....6...7.....', len: 6, strings: 0.55 },
      bass: { voice: 'finger', pat: 'r..r..r.5..5..a.', vel: '9..6..7.8..6..7.', boss: 'r.gr..r.5.g5..a.', len: 1.8 },
      arp: { voice: 'pluck', vol: 0.85, every: 2, pat: [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 3, 1, 2], oct: 12, bright: 0.45 },
      drums: { kick: '9.......8.4.....', kickHot: '9...6...8.4...6.', snare: '....9..2....9..3', hat: '6353635363536353', open: '..............5.', fill: 'toms' },
    },
    // F# minor synthwave: F#m - D - A - E, boss F#m - G - F#m - C#. Warm saw pad, plucks through the echo, saw lead
    drive: {
      bpm: 92, swing: 0, feel: 0.006,
      main: [[54, 57, 61, 64], [50, 54, 57, 61], [57, 61, 64, 68], [52, 56, 59, 64]],
      boss: [[54, 57, 61, 64], [55, 59, 62, 66], [54, 57, 61, 64], [49, 53, 56, 59]],
      key: 66, mode: MINOR,
      mel: ['4/6 2/2 0/8', '2/4 4/4 5/4 4/4', '4/6 6/2 7/4 6/4', '6/8 5/4 4/4',
        '4/6 2/2 0/4 2/4', '5/8 7/4 9/4', '8/6 7/2 6/4 4/4', '6/12 r/4'],
      alt: ['7/16', '9/8 7/8', '6/16', '4/8 r/8', '7/12 9/4', '10/8 9/8', '8/16', '6/8 r/8'], altOct: -12,
      lead: { voice: 'saw', vol: 0.1, glide: 0.6 },
      keys: { voice: 'synth', hits: '9...............', len: 16 },
      bass: { voice: 'synth', pat: 'r.o.r.o.r.o.r.o.', vel: '9.5.7.5.8.5.7.6.', boss: 'rgo.rgo.rgo.r.oa', len: 1.4 },
      arp: { voice: 'pluck', vol: 0.75, every: 2, pat: [0, 2, 3, 2, 1, 2, 3, 2, 0, 2, 3, 2, 1, 3, 2, 3], oct: 12, bright: 0.85, ring: 2 },
      drums: { kick: '9.......9.......', kickHot: '9...7...9...7...', snare: '....9.......9...', hat: '..5...5...5...5.', gated: 1, fill: 'snare' },
    },
    // C major chiptune: C - G - Am - F, boss Cm - Ab - Bb - G. Square waves, but phrased by a player
    chip: {
      bpm: 140, swing: 0.05, feel: 0.005,
      main: [[48, 60, 64, 67], [43, 59, 62, 67], [45, 60, 64, 69], [41, 60, 65, 69]],
      boss: [[48, 60, 63, 67], [44, 60, 63, 68], [46, 58, 62, 65], [43, 59, 62, 67]],
      key: 72, mode: MAJOR,
      mel: ['0/2 2/2 4/2 7/2 4/2 2/2 4/4', '6/2 4/2 1/2 4/2 6/4 4/4', '5/2 4/2 2/2 0/2 2/4 5/4', '3/3 2/1 3/2 5/2 7/4 5/4',
        '7/2 9/2 7/2 4/2 7/2 9/2 11/4', '8/3 6/1 8/2 11/2 8/4 r/4', '9/2 7/2 5/2 4/2 2/2 4/2 5/4', '3/4 1/4 0/8'],
      alt: ['4/4 7/4 4/4 2/4', '1/4 4/4 6/4 4/4', '2/4 5/4 7/4 5/4', '3/4 5/4 7/4 r/4', '4/4 7/4 9/4 7/4', '6/4 8/4 6/4 4/4', '5/4 7/4 9/4 7/4', '7/8 r/8'],
      lead: { voice: 'chip', vol: 0.075, glide: 0.5 },
      keys: { voice: 'square', hits: '9.....7.....7...', len: 2 },
      bass: { voice: 'chip', pat: 'r.o.r.o.r.o.r.oa', vel: '9.6.8.6.9.6.8.67', boss: 'rgo.rgorrgo.rgoa', len: 1.2 },
      arp: { voice: 'square', vol: 0.8, every: 1, pat: [1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 3], oct: 12 },
      drums: { kit: 'chip', kick: '9.......9.....6.', kickHot: '9.....6.9.....6.', snare: '....9.......9.5.', hat: '5.3.5.3.5.3.5.3.', fill: 'chip' },
    },
    // D minor lo-fi: Dm9 - G13 - Cmaj9 - A7. Rhodes, upright bass, brushes, a whistled tune, heavy swing, vinyl crackle
    lofi: {
      bpm: 78, swing: 0.3, feel: 0.014,
      main: [[50, 53, 57, 60, 64], [43, 53, 57, 59, 64], [48, 52, 55, 59, 62], [45, 55, 58, 61, 64]],
      boss: [[50, 53, 56, 60, 63], [46, 53, 57, 60, 62], [45, 55, 58, 61, 64], [45, 53, 56, 60, 63]],
      key: 62, mode: DORIAN,
      mel: ['r/2 4/2 5/2 4/2 2/6 r/2', '6/3 5/1 4/4 r/8', 'r/4 6/2 7/2 8/4 6/4', '4/6 r/2 3/2 4/2 2/4',
        'r/2 4/2 5/2 7/2 9/4 7/4', '8/4 7/2 6/2 5/8', '6/2 4/2 2/2 4/2 6/8', '4/8 r/8'],
      alt: ['r/8 2/4 1/4', '0/8 r/8', 'r/8 4/4 2/4', '1/12 r/4', 'r/8 7/4 6/4', '4/8 r/8', 'r/4 2/4 1/4 0/4', '-1/8 r/8'],
      lead: { voice: 'whistle', vol: 0.1, glide: 0.5, lay: 0.012 },
      keys: { voice: 'epiano', hits: '8......6..7.....', len: 9 },
      bass: { voice: 'upright', pat: 'r......5..r...a.', vel: '9......6..7...6.', boss: 'r..g...5..r.g.a.', len: 3 },
      arp: null,
      drums: { kick: '9......5..7.....', kickHot: '9......5..7...5.', snare: '....8.......8...', ghost: '..2.....3......2', hat: '4242424242424242', open: '.......4........', soft: 1, lay: 0.014, crackle: 1, fill: 'brush' },
    },
    // D phrygian: Dm - Eb - Dm - C, boss Dm - Eb - Ddim - C. Dark strings, a plucked guitar, a cello line, toms
    deep: {
      bpm: 110, swing: 0.04, feel: 0.008,
      main: [[38, 50, 53, 57], [39, 51, 55, 58], [38, 50, 53, 57], [36, 48, 52, 55]],
      boss: [[38, 50, 53, 57], [39, 51, 54, 58], [38, 50, 53, 56], [36, 48, 51, 55]],
      key: 62, mode: PHRYGIAN,
      mel: ['0/8 1/4 0/4', '1/8 3/4 1/4', '0/4 2/4 4/4 5/4', '-1/12 r/4', '4/6 5/2 4/4 2/4', '5/8 3/4 1/4', '2/4 1/4 0/4 2/4', '-1/8 r/8'],
      alt: ['7/8 8/8', '9/16', '7/8 6/8', '6/12 r/4', '11/8 9/8', '10/16', '9/8 8/8', '7/8 r/8'], altOct: -12,
      lead: { voice: 'cello', vol: 0.12, glide: 0.5, oct: -12 },
      keys: { voice: 'strings', hits: '9...............', len: 16 },
      bass: { voice: 'synth', pat: 'r..r..r...5..a..', vel: '9..6..8...7..7..', boss: 'r.gr..r.g.5.ga..', len: 2.2 },
      arp: { voice: 'pluck', vol: 0.9, every: 2, pat: [3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 0], oct: 0, bright: 0.3, ring: 4 },
      drums: { kick: '9.....7...8.....', kickHot: '9..5..7...8..5..', snare: '........9.......', hat: '5.3.5.3.5.3.5.3.', open: '......4.......4.', fill: 'toms' },
    },
    // D major pop: D - A - Bm - G, boss Dm - Bb - C - A. Strummed acoustic guitar, glockenspiel, flute, claps
    sunbeam: {
      bpm: 120, swing: 0.1, feel: 0.008,
      main: [[50, 62, 66, 69], [45, 61, 64, 69], [47, 62, 66, 71], [43, 62, 67, 71]],
      boss: [[50, 62, 65, 69], [46, 62, 65, 70], [48, 60, 64, 67], [45, 61, 64, 69]],
      key: 74, mode: MAJOR,
      mel: ['4/2 4/2 5/2 4/2 2/4 0/4', '1/3 2/1 1/2 -1/2 1/8', '2/2 2/2 4/2 2/2 1/2 0/2 1/4', '0/4 -2/2 -3/2 -2/8',
        '4/2 4/2 5/2 4/2 7/4 6/4', '6/3 5/1 4/2 2/2 4/8', '5/2 4/2 2/2 4/2 5/4 7/4', '5/4 4/4 3/2 5/2 7/4'],
      alt: ['7/8 9/8', '8/16', '9/8 11/8', '7/16', '7/4 9/4 11/8', '12/16', '11/8 9/8', '7/16'], altOct: -12,
      lead: { voice: 'flute', vol: 0.11, glide: 0.3 },
      keys: { voice: 'guitar', hits: 'D...D.U...U.D.U.', len: 4 },
      bass: { voice: 'finger', pat: 'r..r..5.r.o...a.', vel: '9..6..7.8.6...7.', boss: 'r.gr..5.r.og..a.', len: 1.6 },
      arp: { voice: 'bell', vol: 0.7, every: 4, pat: [3, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 3, 1, 1, 1, 1], oct: 24 },
      drums: { kick: '9.....7.9.......', kickHot: '9.....7.9.5...5.', snare: '....9.......9...', hat: '6.4.6.4.6.4.6.4.', open: '......5.......5.', clap: 1, fill: 'snare' },
    },
    // E phrygian (Hellscape looks): Em - F - Em - D, boss Em - F - Bb - B. Driving synth bass, a saw lead through the echo,
    // low strings and pounding toms
    furnace: {
      bpm: 132, swing: 0, feel: 0.006,
      main: [[40, 52, 55, 59], [41, 53, 57, 60], [40, 52, 55, 59], [38, 50, 54, 57]],
      boss: [[40, 52, 55, 59], [41, 53, 57, 60], [46, 58, 62, 65], [47, 59, 63, 66]],
      key: 64, mode: PHRYGIAN,
      mel: ['7/4 6/2 5/2 4/4 5/2 4/2', '5/6 4/2 3/4 1/4', '4/2 4/2 5/2 4/2 2/4 1/2 0/2', '1/8 -1/8',
        '7/4 8/2 7/2 6/4 5/4', '8/6 7/2 5/4 4/4', '4/2 5/2 4/2 2/2 1/4 2/4', '1/4 0/12'],
      alt: ['4/16', '5/8 3/8', '4/8 2/8', '3/16', '4/8 5/8', '5/16', '4/8 2/8', '1/8 r/8'], altOct: -12,
      lead: { voice: 'saw', vol: 0.09, glide: 0.4 },
      keys: { voice: 'strings', hits: '9.......7.......', len: 8 },
      bass: { voice: 'synth', pat: 'r.r.o.r.r.r.5.oa', vel: '9.6.7.6.8.6.7.67', boss: 'rgr.o.rgr.r.5goa', len: 1.1 },
      arp: { voice: 'pluck', vol: 0.65, every: 1, pat: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 3, 2, 1, 2], oct: 12, bright: 0.6, ring: 2 },
      drums: { kick: '9.9.....9.9.....', kickHot: '9.9.6.9.9.9.6.9.', snare: '....9.......9...', hat: '5.5.5.5.5.5.5.5.', open: '..............6.', fill: 'toms' },
    },
  };
  const parseLine = (bars) => bars.map((bar) => {
    let s = 0;
    const out = [];
    for (const tok of bar.trim().split(/\s+/)) { const [a, b] = tok.split('/'); if (a !== 'r') out.push({ s, d: +b, deg: +a }); s += +b; }
    return out;
  });
  for (const id in SONGS) { const S = SONGS[id]; S._mel = parseLine(S.mel); S._alt = parseLine(S.alt); }
  M.SONGS = SONGS;
  const song = () => SONGS[M.songId] || SONGS.neon;
  // switch songs on the next bar (instantly if the music hasn't started); now skips straight to a new bar (previews)
  M.setSong = function (id, now) {
    if (!SONGS[id]) id = 'neon';
    if (!M.started) { M.songId = id; M.bpm = SONGS[id].bpm; return; }
    if (id === M.songId && !M.pendingSong) return;
    M.pendingSong = id === M.songId ? null : id;
    if (now && M.pendingSong) {
      // previews switch at once: the next sixteenth starts bar one of the new song
      M.step = Math.ceil(M.step / 16) * 16;
      M.songId = M.pendingSong; M.pendingSong = null; M.songBar = M.step / 16; M.leadPrev = null; M.bpm = SONGS[id].bpm;
      if (M.delay && M.ctx) M.delay.delayTime.setTargetAtTime((60 / M.bpm) * 0.75, M.ctx.currentTime, 0.1);
    }
  };
  const MIXES = {
    menu: { pad: 0.85, bass: 0.55, arp: 0.5, kick: 0, snare: 0, hat: 0.15, lead: 0.5, cut: 2600, q: 1 },
    map: { pad: 0.8, bass: 0.75, arp: 0.6, kick: 0.55, snare: 0, hat: 0.3, lead: 0.4, cut: 4000, q: 1 },
    play: { pad: 0.5, bass: 1, arp: 0.75, kick: 1, snare: 0.8, hat: 0.65, lead: 0.55, cut: 10000, q: 0.7 },
    boss: { pad: 0.6, bass: 1, arp: 0.85, kick: 1, snare: 1, hat: 0.85, lead: 0.65, cut: 10000, q: 0.7 },
    shop: { pad: 0.95, bass: 0.65, arp: 0.35, kick: 0.4, snare: 0, hat: 0.3, lead: 0.3, cut: 1150, q: 2 },
    gameover: { pad: 0.9, bass: 0.25, arp: 0, kick: 0, snare: 0, hat: 0, lead: 0.25, cut: 1300, q: 1 },
    victory: { pad: 0.8, bass: 0.9, arp: 0.9, kick: 0.9, snare: 0.7, hat: 0.6, lead: 0.9, cut: 8000, q: 0.7 },
  };
  const LAYERS = ['pad', 'bass', 'arp', 'kick', 'snare', 'hat', 'lead'];
  // how much of each layer goes to the room, and where it sits left to right
  const SEND = { pad: 0.32, bass: 0.03, arp: 0.38, kick: 0.04, snare: 0.22, hat: 0.1, lead: 0.3 };
  const PAN = { pad: -0.08, bass: 0, arp: -0.22, kick: 0, snare: 0.04, hat: 0.24, lead: 0.06 };

  // a room: decaying noise that darkens as it fades, with a short pre-delay
  function impulse(ctx, secs) {
    const sr = ctx.sampleRate, len = Math.floor(sr * secs), b = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const k = i / len;
        lp += (Math.random() * 2 - 1 - lp) * (0.85 - 0.7 * k);
        d[i] = lp * Math.pow(1 - k, 2.4) * Math.min(1, i / (sr * 0.012));
      }
    }
    return b;
  }
  // the whole signal chain, into any audio context (the live one, or an offline one for tests)
  function build(ctx, dest) {
    M.ctx = ctx;
    ks.clear();
    M.out = ctx.createGain();
    M.out.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 3; comp.attack.value = 0.008; comp.release.value = 0.25;
    comp.connect(M.out);
    M.out.connect(dest);
    M.filter = ctx.createBiquadFilter();
    M.filter.type = 'lowpass';
    M.filter.frequency.value = 2600;
    M.filter.connect(comp);
    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, 2.1);
    const verbOut = ctx.createGain();
    verbOut.gain.value = 0.85;
    verb.connect(verbOut); verbOut.connect(M.filter);
    // tempo echo with a darkening feedback path, like tape
    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = (60 / M.bpm) * 0.75;
    const fbf = ctx.createBiquadFilter(); fbf.type = 'lowpass'; fbf.frequency.value = 2600;
    const fb = ctx.createGain(); fb.gain.value = 0.3;
    const wet = ctx.createGain(); wet.gain.value = 0.2;
    delay.connect(fbf); fbf.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(M.filter);
    M.delay = delay;
    for (const l of LAYERS) {
      const g = ctx.createGain();
      g.gain.value = 0;
      let node = g;
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = PAN[l]; g.connect(p); node = p; }
      node.connect(M.filter);
      const send = ctx.createGain(); send.gain.value = SEND[l]; node.connect(send); send.connect(verb);
      if (l === 'arp' || l === 'lead') node.connect(delay);
      M.layers[l] = g;
    }
    const len = ctx.sampleRate;
    M.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = M.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  M.start = function () {
    if (M.started || !SB.audio.ctx) return;
    M.started = true;
    M.bpm = song().bpm;
    build(SB.audio.ctx, SB.audio.ctx.destination);
    M.nextTime = M.ctx.currentTime + 0.1;
    M.applyMix(true);
    M.applyVolume();
    M.timer = setInterval(M.tick, 25);
  };

  M.applyVolume = function () {
    if (!M.started) return;
    const v = SB.audio.muted ? 0 : M.volume;
    M.out.gain.setTargetAtTime(v * 0.9, M.ctx.currentTime, 0.4);
  };
  M.applyMix = function (instant) {
    if (!M.ctx) return;
    const mix = MIXES[M.area] || MIXES.menu;
    const now = M.ctx.currentTime;
    const tc = instant ? 0.05 : 0.9;
    for (const l of LAYERS) {
      let v = mix[l];
      if (l === 'hat' && (M.area === 'play' || M.area === 'boss')) v = Math.min(1, v + M.intensity * 0.4);
      M.layers[l].gain.setTargetAtTime(v, now, tc);
    }
    const cut = M.paused ? 520 : mix.cut;
    M.filter.frequency.setTargetAtTime(cut, now, M.paused ? 0.15 : tc * 0.8);
    M.filter.Q.setTargetAtTime(mix.q, now, tc);
  };
  M.setArea = function (area) {
    if (area === M.area) return;
    M.area = area;
    M.pendingProg = area === 'boss' ? 'boss' : 'main';
    M.applyMix(false);
    if (M.started) M.whoosh();
  };
  M.setPaused = function (p) { if (p === M.paused) return; M.paused = p; M.applyMix(false); };
  M.setIntensity = function (v) {
    v = SB.clamp(v, 0, 1);
    if (Math.abs(v - M.intensity) < 0.05) return;
    M.intensity = v;
    M.applyMix(false);
  };

  // ---------- feel: nobody plays exactly on the grid or at the same strength twice ----------
  let spare = null;
  const gauss = () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0;
    while (!u) u = Math.random();
    const r = Math.sqrt(-2 * Math.log(u)), a = 2 * Math.PI * Math.random();
    spare = r * Math.sin(a);
    return r * Math.cos(a);
  };
  const human = (sd) => SB.clamp(gauss(), -2.5, 2.5) * sd;
  const vary = (v, amt) => SB.clamp(v * (1 + human(amt === undefined ? 0.07 : amt)), 0.05, 1.25);
  const hit = (str, s) => { const c = str && str[s]; return c && c >= '0' && c <= '9' ? +c / 9 : 0; };

  // ---------- instruments ----------
  function env(g, t, att, peak, dur, rel) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + att);
    g.gain.setValueAtTime(peak, t + Math.max(att, dur));
    g.gain.setTargetAtTime(0.0001, t + Math.max(att, dur), rel);
  }
  function osc(type, f, t, stop, det) {
    const o = M.ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (det) o.detune.value = det;
    o.start(t); o.stop(stop);
    return o;
  }
  function noiseHit(dest, t, dur, vol, type, freq, q) {
    const ctx = M.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = M.noise;
    f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    return g;
  }
  // simple tone (chip parts, stabs)
  function blip(dest, type, f, t, dur, vol) {
    const g = M.ctx.createGain();
    env(g, t, 0.004, vol, Math.max(0.01, dur - 0.03), 0.02);
    osc(type, f, t, t + dur + 0.2).connect(g);
    g.connect(dest);
  }
  // electric piano: two-operator FM with a short metallic tine on the attack, softer when played softly
  function epiano(dest, n, t, dur, v) {
    const f = midi(n), stop = t + dur + 1;
    const car = osc('sine', f, t, stop, human(4)), mod = osc('sine', f, t, stop), tine = osc('sine', f * 14, t, stop);
    const mi = M.ctx.createGain(), ti = M.ctx.createGain(), g = M.ctx.createGain();
    mi.gain.setValueAtTime(f * (0.5 + 1.5 * v), t); mi.gain.setTargetAtTime(f * 0.15, t, 0.2);
    ti.gain.setValueAtTime(f * 0.8 * v, t); ti.gain.setTargetAtTime(0, t, 0.025);
    mod.connect(mi); mi.connect(car.frequency); tine.connect(ti); ti.connect(car.frequency);
    const lvl = 0.075 * v * (n < 55 ? 1.15 : n > 72 ? 0.8 : 1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(lvl, t + 0.004);
    g.gain.setTargetAtTime(lvl * 0.3, t + 0.004, 0.6);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.15);
    car.connect(g); g.connect(dest);
  }
  // bowed or synth pad: three detuned saws through a soft filter, swelling in
  function padNote(dest, n, t, dur, v, kind) {
    const ctx = M.ctx, f = midi(n), synth = kind === 'synth';
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(synth ? 1400 : 900, t); lp.frequency.linearRampToValueAtTime(synth ? 2600 : 1700, t + dur * 0.5);
    const g = ctx.createGain(), lvl = (synth ? 0.026 : 0.026) * v, att = synth ? 0.45 : 0.4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(lvl, t + att);
    g.gain.setValueAtTime(lvl, t + Math.max(att, dur - 0.1));
    g.gain.setTargetAtTime(0.0001, t + Math.max(att, dur - 0.1), synth ? 0.45 : 0.35);
    for (const det of [-10, 0, 10]) osc('sawtooth', f, t, t + dur + 2.5, det + human(3)).connect(lp);
    lp.connect(g); g.connect(dest);
  }
  // plucked string (Karplus-Strong): a burst of noise in a short feedback loop, one buffer per note
  const ks = new Map();
  function ksBuf(n, bright) {
    const key = n + ':' + bright;
    let k = ks.get(key);
    if (k) return k;
    const ctx = M.ctx, sr = ctx.sampleRate, f = midi(n), N = Math.max(2, Math.floor(sr / f - 0.5));
    const dur = n < 52 ? 2.4 : n < 70 ? 1.8 : 1.2, len = Math.floor(sr * dur);
    const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    let lp = 0, mean = 0, peak = 0;
    for (let i = 0; i < N; i++) { lp += (Math.random() * 2 - 1 - lp) * bright; d[i] = lp; mean += lp / N; }
    for (let i = 0; i < N; i++) { d[i] -= mean; peak = Math.max(peak, Math.abs(d[i])); }
    for (let i = 0; i < N; i++) d[i] /= peak || 1;
    for (let i = N; i < len; i++) d[i] = 0.4985 * (d[i - N] + (i > N ? d[i - N - 1] : 0));
    k = { buf, rate: (f * (N + 0.5)) / sr, dur };
    ks.set(key, k);
    return k;
  }
  function pluck(dest, n, t, v, bright, mute) {
    const k = ksBuf(n, bright), s = M.ctx.createBufferSource(), g = M.ctx.createGain();
    s.buffer = k.buf; s.playbackRate.value = k.rate;
    g.gain.setValueAtTime(0.2 * v, t);
    if (mute) g.gain.setTargetAtTime(0.0001, t + mute, 0.06);
    s.connect(g); g.connect(dest);
    s.start(t); s.stop(t + k.dur);
  }
  // a strum across a guitar voicing: downstrokes low to high, upstrokes catch the top strings, a hair apart
  function strum(dest, notes, t, v, dir, ring) {
    const up = dir === 'U', order = up ? notes.slice().reverse().slice(0, 4) : notes, gap = (up ? 0.011 : 0.017) * (1 + human(0.25));
    order.forEach((n, i) => pluck(dest, n, t + i * gap, v * (up ? 0.7 : 1) * (1 - i * 0.05), 0.5 + v * 0.35, ring));
  }
  // glockenspiel: FM bell with a bright, fast-fading strike
  function bell(dest, n, t, v) {
    const f = midi(n), stop = t + 1.4;
    const car = osc('sine', f, t, stop), mod = osc('sine', f * 3.5, t, stop), mi = M.ctx.createGain(), g = M.ctx.createGain();
    mi.gain.setValueAtTime(f * 2.2 * v, t); mi.gain.setTargetAtTime(f * 0.2, t, 0.08);
    mod.connect(mi); mi.connect(car.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045 * v, t + 0.003); g.gain.setTargetAtTime(0.0001, t + 0.003, 0.35);
    car.connect(g); g.connect(dest);
  }
  // bass: a fingered note with a plucky filter, an upright with a thump and the odd slide, a synth, or a chip triangle
  function bassNote(S, n, t, dur, v) {
    const ctx = M.ctx, f = midi(n), kind = S.bass.voice, stop = t + dur + 0.4;
    const g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    if (kind === 'chip') lp.frequency.value = 9000;
    else {
      const open = kind === 'synth' ? 380 + v * 1900 : kind === 'upright' ? 520 + v * 300 : 280 + v * 1100;
      lp.frequency.setValueAtTime(open, t); lp.frequency.setTargetAtTime(kind === 'synth' ? 280 : 230, t + 0.01, kind === 'synth' ? 0.13 : 0.2);
      lp.Q.value = kind === 'synth' ? 5 : 1.2;
    }
    const lvl = (kind === 'synth' ? 0.15 : kind === 'chip' ? 0.21 : 0.2) * v;
    env(g, t, kind === 'upright' ? 0.014 : 0.005, lvl, Math.max(0.02, dur - 0.04), kind === 'upright' ? 0.09 : 0.045);
    // a scoop or slide into the note, now and then
    const from = kind === 'upright' && Math.random() < 0.3 ? midi(n - 1) : kind === 'finger' && Math.random() < 0.15 ? f * 0.978 : 0;
    const parts = kind === 'synth' ? [['sawtooth', 1, 1], ['sine', 1, 0.7]] : kind === 'chip' ? [['triangle', 1, 1]] : [['triangle', 1, 0.8], ['sine', 1, 0.6]];
    for (const [type, mult, lv] of parts) {
      const o = osc(type, (from || f) * mult, t, stop);
      if (from) o.frequency.exponentialRampToValueAtTime(f * mult, t + (kind === 'upright' ? 0.07 : 0.03));
      const og = ctx.createGain(); og.gain.value = lv;
      o.connect(og); og.connect(lp);
    }
    if (kind === 'upright') noiseHit(g, t, 0.03, 0.25 * v, 'lowpass', 900);
    lp.connect(g); g.connect(M.layers.bass);
  }
  // lead voices: breath and a vibrato that blooms once the note settles; legato notes glide from the last one
  function leadNote(S, n, t, dur, v, from, gainMul) {
    const ctx = M.ctx, f = midi(n), kind = S.lead.voice, end = t + dur, dest = M.layers.lead;
    const out = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = { saw: 2600, cello: 1500, chip: 9000 }[kind] || 6500; lp.Q.value = 0.7;
    lp.connect(out); out.connect(dest);
    const peak = S.lead.vol * v * (gainMul || 1);
    const att = { flute: 0.05, whistle: 0.04, saw: 0.03, chip: 0.006, cello: 0.12 }[kind] || 0.04;
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(peak, t + att);
    // long notes are shaped: a bowed swell, or a wind player easing off
    if (dur > 0.35) out.gain.linearRampToValueAtTime(peak * (kind === 'cello' ? 1.12 : kind === 'chip' ? 0.9 : 0.8), end - 0.05);
    out.gain.setTargetAtTime(0.0001, end - 0.03, kind === 'chip' ? 0.015 : 0.06);
    const lfo = osc('sine', (kind === 'chip' ? 6.2 : 5.1) + Math.random() * 0.6, t, end + 0.3), depth = ctx.createGain();
    const cents = { chip: 24, whistle: 16, cello: 14, saw: 12 }[kind] || 11, vs = t + Math.min(0.22, dur * 0.4);
    depth.gain.setValueAtTime(0, t); depth.gain.setValueAtTime(0, vs); depth.gain.linearRampToValueAtTime(f * (Math.pow(2, cents / 1200) - 1), vs + 0.3);
    lfo.connect(depth);
    const parts = kind === 'saw' ? [['sawtooth', 1, -7, 0.5], ['sawtooth', 1, 7, 0.5]]
      : kind === 'cello' ? [['sawtooth', 1, 0, 0.7], ['triangle', 0.5, 3, 0.3]]
        : kind === 'chip' ? [['square', 1, 0, 0.6]] : [['sine', 1, 0, 0.85], ['triangle', 2, 2, 0.07]];
    const fromF = from ? midi(from) : 0;
    for (const [type, mult, det, lvl] of parts) {
      const o = osc(type, (fromF || f) * mult, t, end + 0.3, det);
      if (fromF) o.frequency.exponentialRampToValueAtTime(f * mult, t + 0.07);
      depth.connect(o.frequency);
      const g = ctx.createGain(); g.gain.value = lvl;
      o.connect(g); g.connect(lp);
    }
    if (kind === 'flute' || kind === 'whistle') {
      const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = M.noise; bp.type = 'bandpass'; bp.frequency.value = Math.min(9000, f * 2); bp.Q.value = 1.2;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak * 0.55, t + 0.02);
      g.gain.setTargetAtTime(peak * 0.07, t + 0.03, 0.05); g.gain.setTargetAtTime(0.0001, end - 0.03, 0.04);
      s.connect(bp); bp.connect(g); g.connect(dest);
      s.start(t, Math.random() * 0.4); s.stop(end + 0.2);
    }
  }
  // ---------- drums ----------
  function kick(t, v, chip) {
    const ctx = M.ctx, o = osc(chip ? 'triangle' : 'sine', 150, t, t + 0.4), g = ctx.createGain();
    o.frequency.exponentialRampToValueAtTime(chip ? 55 : 44, t + (chip ? 0.08 : 0.13));
    g.gain.setValueAtTime(0.8 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(g); g.connect(M.layers.kick);
    noiseHit(M.layers.kick, t, 0.012, 0.2 * v, chip ? 'lowpass' : 'highpass', chip ? 1200 : 2600);
  }
  function snare(t, v, D, kit) {
    const L = M.layers.snare;
    if (kit === 'chip') { noiseHit(L, t, 0.12, 0.32 * v, 'bandpass', 2400, 0.8); blip(L, 'square', 220, t, 0.04, 0.05 * v); return; }
    if (D.soft) { noiseHit(L, t, 0.22, 0.2 * v, 'bandpass', 3200, 0.6); return; } // brushes
    const body = osc('triangle', 200, t, t + 0.2), bg = M.ctx.createGain();
    body.frequency.exponentialRampToValueAtTime(165, t + 0.08);
    bg.gain.setValueAtTime(0.2 * v, t); bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    body.connect(bg); bg.connect(L);
    if (D.gated) {
      // big gated snare: a long burst that gets cut off
      const g = noiseHit(L, t, 0.5, 0.36 * v, 'highpass', 1200);
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.36 * v, t); g.gain.linearRampToValueAtTime(0.22 * v, t + 0.22); g.gain.linearRampToValueAtTime(0.0001, t + 0.26);
    } else noiseHit(L, t, 0.12 + 0.08 * v, 0.38 * v, 'highpass', 1500);
    if (D.clap) for (const d of [0.008, 0.019, 0.031]) noiseHit(L, t + d, 0.11, 0.16 * v, 'bandpass', 1500, 1.1);
  }
  function hat(t, v, open, kit) {
    const L = M.layers.hat;
    if (open) { M.openHat = noiseHit(L, t, 0.32, 0.11 * v, 'highpass', 7000); return; }
    // a closed hat chokes the open one, like a real pedal
    if (M.openHat) { M.openHat.gain.cancelScheduledValues(t); M.openHat.gain.setTargetAtTime(0.0001, t, 0.01); M.openHat = null; }
    noiseHit(L, t, kit === 'chip' ? 0.02 : 0.025 + 0.025 * v, 0.15 * v, 'highpass', kit === 'chip' ? 9000 : 7400);
  }
  function tom(t, f, v) {
    const o = osc('sine', f * 1.5, t, t + 0.4), g = M.ctx.createGain();
    o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    g.gain.setValueAtTime(0.45 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g); g.connect(M.layers.kick);
    noiseHit(M.layers.snare, t, 0.04, 0.06 * v, 'lowpass', 2500);
  }
  function crash(t, v) {
    noiseHit(M.layers.hat, t, 1.6, 0.13 * v, 'highpass', 4200);
    noiseHit(M.layers.hat, t, 0.6, 0.07 * v, 'bandpass', 6500, 0.7);
  }
  // the last four sixteenths of a phrase: toms rolling down, a snare build, a chip run, or a brush drag
  function fillHit(D, kit, s, t, six) {
    const k = (s - 12) / 3, v = 0.6 + 0.35 * k;
    if (D.fill === 'toms') tom(t, [210, 175, 140, 110][s - 12], vary(v, 0.06));
    else if (D.fill === 'chip') { noiseHit(M.layers.snare, t, 0.06, 0.28 * v, 'bandpass', 3000 - k * 1600, 0.8); if (s >= 14) noiseHit(M.layers.snare, t + six / 2, 0.05, 0.24 * v, 'bandpass', 1400, 0.8); }
    else if (D.fill === 'brush') { if (s >= 14) snare(t, 0.35 + 0.2 * k, D, kit); if (s === 14) hat(t, 0.5, true, kit); }
    else { snare(t, vary(0.35 + 0.45 * k, 0.05), D, kit); if (s >= 14) snare(t + six / 2, vary(0.45 + 0.4 * k, 0.05), D, kit); }
  }
  function crackle(t, dur) {
    for (let i = 0; i < 3; i++) if (Math.random() < 0.5) noiseHit(M.layers.hat, t + Math.random() * dur, 0.008, 0.05 + Math.random() * 0.05, 'highpass', 3000 + Math.random() * 4000);
  }
  M.whoosh = function () {
    const t = M.ctx.currentTime, s = M.ctx.createBufferSource(), f = M.ctx.createBiquadFilter(), g = M.ctx.createGain();
    s.buffer = M.noise;
    f.type = 'bandpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3000, t + 0.45);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    s.connect(f); f.connect(g); g.connect(M.out);
    s.start(t); s.stop(t + 0.7);
  };

  // ---------- harmony helpers ----------
  const degMidi = (S, deg, oct) => S.key + Math.floor(deg / 7) * 12 + S.mode[((deg % 7) + 7) % 7] + (oct || 0);
  // on the boss chords a written note that rubs a semitone against the harmony moves onto the chord tone
  function fitChord(n, chord) {
    const pcs = chord.map((c) => c % 12), pc = ((n % 12) + 12) % 12;
    if (pcs.includes(pc)) return n;
    for (const d of [1, -1]) if (pcs.includes((pc + d + 12) % 12)) return n + d;
    return n;
  }
  // keyboard voicing: the chord's upper tones placed as close as they can to the last chord, so the hands barely move
  function voiceLead(chord) {
    const tones = chord.length > 4 ? chord.slice(1) : chord.slice(1).concat(chord[0]);
    const pcs = [...new Set(tones.map((c) => ((c % 12) + 12) % 12))];
    const prev = M.voicing || [60, 64, 67, 71];
    const target = SB.clamp(prev.reduce((a, b) => a + b, 0) / prev.length, 59, 67);
    M.voicing = pcs.map((pc) => pc + 12 * Math.round((target - pc) / 12)).sort((a, b) => a - b);
    return M.voicing;
  }
  // an open guitar shape: root, fifth, octave, third and fifth on top
  function guitarShape(chord) {
    let r = chord[0];
    while (r > 52) r -= 12;
    while (r < 40) r += 12;
    const iv = chord.map((c) => (((c - chord[0]) % 12) + 12) % 12), third = iv.includes(4) ? 4 : iv.includes(3) ? 3 : 4;
    return [r, r + 7, r + 12, r + 12 + third, r + 19];
  }
  const KEYHIT = { D: [0.85, 'D'], U: [0.6, 'U'], d: [0.55, 'D'], u: [0.4, 'U'] };

  // ---------- one sixteenth of the band ----------
  function schedule(step, t0) {
    const s = step % 16;
    const bar = Math.floor(step / 16);
    if (s === 0 && M.pendingSong) {
      M.songId = M.pendingSong; M.pendingSong = null; M.songBar = bar; M.leadPrev = null;
      M.bpm = song().bpm;
      if (M.delay) M.delay.delayTime.setTargetAtTime((60 / M.bpm) * 0.75, t0, 0.1);
    }
    if (s === 0 && M.pendingProg) { M.prog = M.pendingProg; M.pendingProg = null; }
    const S = song(), boss = M.prog === 'boss', chords = boss ? S.boss : S.main;
    // the arrangement: verse, verse with ornaments, bridge (the drums drop to half time), last chorus with harmony
    const rel = Math.max(0, bar - (M.songBar || 0)), sec = Math.floor(rel / 8) % 4, pb = rel % 8;
    const chord = chords[rel % chords.length], next = chords[(rel + 1) % chords.length];
    const six = 60 / M.bpm / 4, I = M.intensity, L = M.layers, D = S.drums, kit = D.kit;
    const t = t0 + (s % 2 ? six * (S.swing || 0) : 0);
    const now = M.ctx.currentTime, feel = S.feel || 0.008;
    const at = (sd) => Math.max(now, t + human(sd === undefined ? feel : sd));
    const breakdown = sec === 2 && !boss && I < 0.6;
    const fill = pb === 7 && s >= 12;

    // keys: voice-led chords, a pianist's tiny roll, strums, stabs or a held pad
    const K = S.keys;
    if (s === 0 || !M.bv) M.bv = voiceLead(chord);
    if (K.strings && s === 0) { const tt = at(0.01); for (const n of M.bv) padNote(L.pad, n, tt, six * 16, K.strings, 'strings'); }
    const kc = K.hits[s], kh = kc && kc !== '.' ? KEYHIT[kc] || [+kc / 9, 'D'] : null;
    if (kh && !(breakdown && s !== 0 && K.voice !== 'synth' && K.voice !== 'strings' && Math.random() < 0.5)) {
      const v = vary(kh[0]), tt = at();
      if (K.voice === 'epiano') M.bv.forEach((n, i) => epiano(L.pad, n, tt + i * 0.007 + Math.abs(human(0.003)), six * K.len, v * (i === M.bv.length - 1 ? 1.05 : 0.88)));
      else if (K.voice === 'guitar') strum(L.pad, guitarShape(chord), tt, v, kh[1], six * K.len);
      else if (K.voice === 'square') M.bv.forEach((n) => blip(L.pad, 'square', midi(n), at(0.003), six * K.len, 0.024 * v));
      else for (const n of M.bv) padNote(L.pad, n, tt, six * K.len, v, K.voice);
    }

    // bass: roots, fifths and octaves, ghost notes, and an approach note into the next chord
    const B = S.bass, bpat = boss && B.boss ? B.boss : B.pat, role = bpat[s];
    if (role && role !== '.' && !(breakdown && s % 8 !== 0 && role !== 'a')) {
      let root = chord[0], nx = next[0];
      while (root > 40) root -= 12;
      while (nx > 40) nx -= 12;
      const n = role === '5' ? root + 7 : role === 'o' ? root + 12 : role === 'a' ? (nx === root ? root + 7 : pb % 2 ? nx + 2 : nx - 1) : role === 'g' ? root + 12 : root;
      const ghost = role === 'g';
      bassNote(S, n, at(feel * 0.7), six * (ghost ? 0.5 : B.len), ghost ? vary(0.32) : vary(hit(B.vel, s) || 0.7));
    }

    // arpeggio: plucked strings, chip runs or a glockenspiel
    const A = S.arp;
    if (A && A.vol > 0) {
      const every = I > 0.35 ? Math.max(1, A.every >> 1) : A.every;
      if (s % every === 0 && !(breakdown && s % 4 !== 0)) {
        const n = M.bv[A.pat[s] % M.bv.length] + A.oct + (I > 0.7 && s % 4 === 3 ? 12 : 0);
        const v = vary(s % 4 === 0 ? 1 : 0.65, 0.1) * A.vol, tt = at(feel * 0.6);
        if (A.voice === 'pluck') pluck(L.arp, n, tt, v, A.bright, six * (A.ring || 3));
        else if (A.voice === 'bell') bell(L.arp, n, tt, v);
        else blip(L.arp, 'square', midi(n), tt, six * 0.9, 0.028 * v);
      }
    }

    // drums
    if (s === 0 && pb === 0 && rel > 0) crash(at(0.004), 0.8);
    let kv = hit(D.kick, s);
    if (I > 0.55) kv = Math.max(kv, hit(D.kickHot, s));
    if (boss && s === 10) kv = Math.max(kv, 0.7);
    if (breakdown && s % 8 !== 0) kv = 0;
    if (kv) kick(at(0.003), vary(kv, 0.05), kit === 'chip');
    if (fill && !breakdown) fillHit(D, kit, s, at(0.004), six);
    else {
      let sv = hit(D.snare, s);
      if (breakdown) sv = s === 12 ? Math.max(sv, 0.8) : 0;
      if (sv) snare(at(0.004) + (D.lay || 0), vary(sv, 0.08), D, kit);
      else if (!breakdown && hit(D.ghost, s)) snare(at(0.006) + (D.lay || 0), vary(hit(D.ghost, s), 0.15), D, kit);
      let hv = hit(D.hat, s);
      if (I > 0.45 && !hv) hv = 0.28;
      if (breakdown && s % 4 !== 0) hv = 0;
      const ov = breakdown ? 0 : hit(D.open, s);
      if (ov) hat(at(0.003), vary(ov), true, kit);
      else if (hv) hat(at(0.003), vary(hv, 0.12), false, kit);
    }
    if (D.crackle) crackle(t, six);

    // lead: the written melody (the bridge plays the alt line), ornamented the second time, harmonised the last
    const line = sec === 2 ? S._alt : S._mel, oct = (sec === 2 ? S.altOct || 0 : 0) + (S.lead.oct || 0);
    for (const nt of line[pb]) {
      if (nt.s !== s) continue;
      let n = degMidi(S, nt.deg, oct);
      if (boss) n = fitChord(n, chord);
      const dur = nt.d * six - 0.012, pos = (pb % 2) * 16 + nt.s;
      const v = vary((0.82 + 0.18 * Math.sin((Math.PI * pos) / 32)) * (nt.s === 0 ? 1.06 : nt.s % 4 === 0 ? 1 : 0.9), 0.06);
      const tt = Math.max(now, t + human(feel * 1.2) + (S.lead.lay || 0));
      const prev = M.leadPrev, legato = prev && tt - prev.end < 0.06 && Math.abs(n - prev.n) <= 7 && Math.random() < (S.lead.glide || 0.4);
      if (sec === 1 && nt.d >= 4 && !legato && Math.random() < 0.6) leadNote(S, degMidi(S, nt.deg + 1, oct), Math.max(now, tt - 0.05), 0.06, v * 0.55);
      leadNote(S, n, tt, dur, v, legato ? prev.n : 0);
      if (sec === 3) { let h = degMidi(S, nt.deg - 2, oct); if (boss) h = fitChord(h, chord); leadNote(S, h, tt + 0.01, dur, v, 0, 0.42); }
      if (sec === 1 && I > 0.5) leadNote(S, n + 12, tt + 0.004, dur, v, 0, 0.22);
      M.leadPrev = { n, end: tt + dur };
    }
  }

  M.tick = function () {
    if (!M.started) return;
    const ctx = M.ctx;
    if (ctx.state === 'suspended') return;
    if (M.nextTime < ctx.currentTime - 0.5) M.nextTime = ctx.currentTime + 0.05; // tab was asleep
    while (M.nextTime < ctx.currentTime + 0.16) {
      schedule(M.step, M.nextTime);
      M.nextTime += 60 / M.bpm / 4;
      M.step++;
    }
  };

  // render a song into an offline buffer (the test suite measures levels with it), leaving the live music untouched
  M.offline = async function (id, secs, area, solo) {
    const keep = Object.assign({}, M), keepLayers = M.layers;
    const ctx = new OfflineAudioContext(2, Math.ceil(44100 * secs), 44100);
    M.layers = {};
    M.songId = id; M.bpm = SONGS[id].bpm; M.songBar = 0; M.pendingSong = null; M.pendingProg = null;
    M.prog = area === 'boss' ? 'boss' : 'main'; M.area = area || 'play'; M.paused = false; M.voicing = null; M.bv = null; M.leadPrev = null; M.openHat = null;
    M.started = false; // the live scheduler must not write into the offline context
    build(ctx, ctx.destination);
    M.out.gain.value = 0.8;
    M.applyMix(true);
    if (solo) for (const l of LAYERS) if (!solo.includes(l)) M.layers[l].gain.cancelScheduledValues(0), M.layers[l].gain.value = 0;
    let t = 0.05, step = 0;
    while (t < secs - 0.4) { schedule(step, t); t += 60 / M.bpm / 4; step++; }
    const buf = await ctx.startRendering();
    Object.assign(M, keep); M.layers = keepLayers;
    ks.clear();
    return buf;
  };
})(window.SB);
