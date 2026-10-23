// Stackbound unlocks outside a run: every finished run pays a Ticket (Endless pays another every 30 Stacks),
// and Tickets buy looks at the Prize Counter: piece skins, line clear effects, songs, backdrops and sound packs
// (sfx.js adds the Sounds tab).
// Nothing here changes how the game plays.
'use strict';
(function (SB) {
  SB.TICKETS = { perRun: 1, endlessEvery: 30 };
  // cat: skin | clear | song | backdrop. The first item of each category is free and owned from the start.
  // secret: only listed once its achievement is earned (the Hellscape looks, from Hell's Survivor)
  SB.COSMETICS = {
    skin: {
      label: 'Piece skins', icon: 'specials',
      items: {
        classic: { name: 'Classic', price: 0, desc: 'Glossy bevelled blocks' },
        pixel: { name: 'Pixel', price: 1, desc: 'Each piece is one 8-bit sprite with a hard outline' },
        toy: { name: 'Toy Brick', price: 2, desc: 'Moulded plastic with studs on top' },
        neon: { name: 'Neon Sign', price: 2, desc: 'A glowing tube traces every piece' },
        bakery: { name: 'Bakery', price: 2, desc: 'Layer cakes with dripping icing and a cherry on top' },
        skyline: { name: 'Skyline', price: 3, desc: 'Every piece is a building: lit windows, shopfronts and a beacon spire' },
        steampunk: { name: 'Steampunk', price: 3, desc: 'Brass frames, copper pipes, gauges and valve wheels' },
        castle: { name: 'Castle', price: 3, desc: 'Stone keeps with battlements, gates and a banner' },
        brimstone: { name: 'Brimstone', price: 0, desc: 'Cooled basalt with the piece colour burning through the cracks', ach: 'hell', secret: true },
      },
    },
    clear: {
      label: 'Clear effects', icon: 'clear',
      items: {
        classic: { name: 'Classic', price: 0, desc: 'A white flash and flying blocks' },
        shatter: { name: 'Shatter', price: 1, desc: 'Lines break like glass' },
        confetti: { name: 'Confetti', price: 1, desc: 'Every clear is a party' },
        lightning: { name: 'Lightning', price: 2, desc: 'A bolt rips through the row' },
        fireworks: { name: 'Fireworks', price: 3, desc: 'Rockets go up from every line' },
        dissolve: { name: 'Dissolve', price: 2, desc: 'Blocks crumble into pixels and drift away' },
        hellfire: { name: 'Hellfire', price: 0, desc: 'The row goes up in flames and the board shakes', ach: 'hell', secret: true },
      },
    },
    song: {
      label: 'Music', icon: 'music',
      items: {
        neon: { name: 'Neon Ascent', price: 0, desc: 'The Tower theme: electric piano, harp and a soft flute' },
        drive: { name: 'Night Drive', price: 2, desc: 'Slow synthwave: warm pads, echoing plucks and a singing lead' },
        chip: { name: 'Chip Rush', price: 1, desc: 'Fast square-wave chiptune with a bit of swing' },
        lofi: { name: 'Lo-Fi Loft', price: 2, desc: 'Rhodes, upright bass, brushes and a whistled tune on vinyl' },
        deep: { name: 'Deep Tower', price: 3, desc: 'Dark strings, plucked guitar and a cello line, for long runs' },
        sunbeam: { name: 'Sunbeam', price: 2, desc: 'Strummed guitar, glockenspiel and flute. Bright and bouncy' },
        furnace: { name: 'Furnace', price: 0, desc: 'Driving synth bass, a burning saw lead and low strings in a dark key', ach: 'hell', secret: true },
      },
    },
    backdrop: {
      label: 'Backdrops', icon: 'backdrop',
      items: {
        city: { name: 'Neon City', price: 0, desc: 'Block towers on a glowing grid', scene: 0 },
        sunset: { name: 'Retro Sunset', price: 2, desc: 'A striped sun sinking behind the hills', scene: 1 },
        peaks: { name: 'Night Peaks', price: 2, desc: 'Snowy ridges under the stars', scene: 2 },
        space: { name: 'Deep Space', price: 3, desc: 'Nebulae, stars and a ringed planet', scene: 3 },
        hellscape: { name: 'Hellscape', price: 0, desc: 'Black crags over a sea of lava, embers rising', scene: 4, ach: 'hell', secret: true },
      },
    },
  };
  SB.COSMETIC_CATS = Object.keys(SB.COSMETICS);

  // Free build: every look, Builder and Hazard is open without spending or unlocking anything.
  // Nothing is written to the save, so switching this off puts normal progress back as it was.
  SB.FREE_BUILD = true;

  const C = (SB.Cosmetic = {});
  // a save that never had looks (fresh, or just reset) gets them filled in before anything reads them
  const m = () => { const d = SB.meta.data; if (d && !d.equip) C.fix(); return d; };
  // retired items pay back what they cost
  const RETIRED = { 'skin:jelly': 2, 'skin:origami': 2, 'skin:minimal': 1 };
  C.fix = function () {
    const d = SB.meta.data;
    if (typeof d.tickets !== 'number') d.tickets = 0;
    d.owned = d.owned || {};
    for (const k in RETIRED) if (d.owned[k]) { delete d.owned[k]; d.tickets += RETIRED[k]; C.refunded = (C.refunded || 0) + RETIRED[k]; }
    if (C.refunded) SB.meta.save();
    d.equip = Object.assign({}, d.equip);
    for (const cat of SB.COSMETIC_CATS) {
      const first = Object.keys(SB.COSMETICS[cat].items)[0];
      if (!SB.COSMETICS[cat].items[d.equip[cat]] || !C.owns(cat, d.equip[cat])) d.equip[cat] = first;
    }
  };
  // items with an achievement (it.ach) are earned, never bought
  C.owns = (cat, id) => {
    const it = SB.COSMETICS[cat].items[id];
    if (!it) return false;
    if (SB.FREE_BUILD) return true;
    if (it.ach) return !!(SB.Ach && typeof it.ach === 'string' && SB.Ach.earned(it.ach));
    return it.price === 0 || !!(m().owned || {})[cat + ':' + id];
  };
  C.equipped = (cat) => { const d = m(); return (d && d.equip && d.equip[cat]) || Object.keys(SB.COSMETICS[cat].items)[0]; };
  C.skin = () => C.equipped('skin');
  C.clearStyle = () => C.equipped('clear');
  C.buy = function (cat, id) {
    const it = SB.COSMETICS[cat].items[id], d = m();
    if (!it || it.ach || C.owns(cat, id)) return false;
    if (d.tickets < it.price) return false;
    d.tickets -= it.price;
    d.owned[cat + ':' + id] = true;
    SB.meta.save();
    return true;
  };
  C.equip = function (cat, id) {
    if (!C.owns(cat, id)) return false;
    m().equip[cat] = id;
    SB.meta.save();
    C.apply(cat);
    return true;
  };
  // push the equipped look into the systems that draw and play it
  C.apply = function (cat) {
    if ((!cat || cat === 'song') && SB.Music && SB.Music.setSong) SB.Music.setSong(C.equipped('song'));
    if ((!cat || cat === 'backdrop') && SB.FX && SB.FX.setScene) SB.FX.setScene(SB.COSMETICS.backdrop.items[C.equipped('backdrop')].scene);
  };
  C.award = function (n) {
    const d = m();
    d.tickets = (d.tickets || 0) + n;
    d.ticketsEarned = (d.ticketsEarned || 0) + n;
    SB.meta.save();
    return d.tickets;
  };
  C.count = () => (m() ? m().tickets || 0 : 0);
  // a finished run pays one Ticket, once, if it won at least one Stack
  C.runTicket = function (run) {
    if (!run || run.ticketPaid || !(run.stats && run.stats.stacksWon >= 1)) return 0;
    run.ticketPaid = true;
    C.award(SB.TICKETS.perRun);
    return SB.TICKETS.perRun;
  };
})(window.SB);
