STACKBOUND - a falling-block roguelike
================================

HOW TO PLAY
  1. Unzip this folder anywhere.
  2. Double-click "Play Stackbound.html". It opens in your browser (Chrome, Edge or Firefox).
  No install, no internet needed. Progress and your current run save automatically in the browser.
  New to it? Press TUTORIAL on the title screen. Twelve short lessons: the hands-on ones give you a
  practice board to try each move (soft vs hard drop, line clears, hold, bombs, drills, vacuums),
  the rest walk through scoring, the Tower, the Workshop, your Bag and board cells. Replay any
  lesson from the list on the left. Practice clears never count toward your stats.

CONTROLS (every game key can be changed in Settings > Keys, two keys per action)
  Left / Right ....... move (hold to auto-shift)
  Down ............... soft drop: starts as a slow creep and speeds up the longer you hold it.
                       The piece can still slide and rotate when it lands, then locks.
  Space .............. hard drop: slams straight down and locks instantly
  Up or X ............ rotate clockwise
  Z or Ctrl .......... rotate counter-clockwise
  A .................. rotate 180
  C or Shift ......... hold: swaps with the highlighted hold slot, or stores the piece if that slot is empty
  V / F, scroll wheel  pick the next / previous hold slot (when you have more than one). Clicking a slot
                       picks it too. Hold never fills an empty slot on its own any more: pick the empty
                       slot first if you want to keep both pieces.
  1 - 4 .............. fire a LIVE Glyph mid-Stack (Sweep, Swap, Freeze, Lift)
  R .................. reset the practice board (Tutorial only)
  Esc or P ........... pause (view your Bag and piece rates, or go to the main menu; Continue
                       on the title screen replays that Stack). Esc also backs out of menus.
  Arrows + Enter ..... drive every menu, shop and pop-up without the mouse.
  M .................. mute sound and music
  Q / E .............. Bank / Push On when you hit the target
  In the Bag: R, right-click or double-click rotates the piece or patch you are placing.
  DAS, ARR and soft drop top speed are adjustable in Settings.

PLAYING ON A PHONE OR TABLET
  On a touch screen the game plays with swipes. The score and clock sit on top and the board fills
  the rest, with Hold and Next beside it. The whole area below the top strip takes touches:
    Swipe left / right ..... move a column per step of your finger (about 29px, the same on any screen)
    Quick swipe, then hold . the piece keeps sliding that way until you lift or slide back.
                             Slow, careful drags never slide, so you can creep to the exact column.
    Tap .................... turn: right of the board's middle turns clockwise, left of it the other way.
                             Taps only ever turn, however quickly you tap.
    Slow swipe down ........ fast drop (soft drop) while your finger moves down and stays on the screen
    Fast swipe down ........ quick drop (hard drop): the piece lands and locks when your finger lifts
    Press and hold ......... Hold, or swap the held piece back in (a ring fills under your finger).
                             A fast swipe up does the same.
  Pieces overshooting, or swipes feel slow? Swipe sensitivity (pause menu or Settings) sets how far
  your finger travels per column, from Most precise (40px) to Quickest (21px); Balanced is 29px.
  A column only changes once your finger is clearly past it, so a wobble or the roll of lifting
  your finger never nudges the piece. Settings can also turn the quick-swipe slide off.
  Prefer buttons? Tap the gamepad button at the top of the play screen (or use the pause menu or
  Settings) to show Left, Down, Right, Hold, Turn left, Turn right and Drop. Swipes keep working too.
  There is no hover on a phone, so tap anything to read what it does, or press and hold it.
  In the Workshop the first tap on a card shows its details and the second tap buys it. Cards sit two
  to a row, cards you can't afford show a red price, and Restock, Forge and Next Stack stay in a bar
  at the bottom with your money. Tap one of your curios to move it left or right or sell it.
  Buying or selling keeps your place on the page. Nothing on screen can be highlighted or selected by
  taps, double-taps or long presses.
  In the Bag and the board, tap a spot to preview and tap it again to place. Double-tap to turn the
  piece (keep tapping quickly to keep turning it); the Rotate button works too. Pack choices sit one per
  row, and every pop-up keeps its Done, Skip or Cancel button pinned to the bottom of the screen.
  Tap a live Glyph at the top of the screen to use it. The pause button is top left.
  With more than one hold slot, tap a slot beside the board to make it the one Hold uses.
  Hold sits to the left of the board and Next to the right, on the phone and on desktop.

MUSIC AND EFFECTS
  The soundtrack is generated live in the browser, so there are no audio files. Since pass 17 it is
  played like a band: written melodies, loose human timing and dynamics, swing, strummed and
  voice-led chords, drum fills and sections (verse, bridge, last chorus with a harmony). It's one continuous
  song that blends between areas: calm on the menu, drums come in on the map, full band in a Stack,
  a darker progression for Warden Stacks, and muffled "behind the door" in the Workshop. It gets busier
  as your stack climbs. Music starts on your first click or keypress (browsers require that).
  Sound and music volume are separate sliders in Settings. Screen shake can be turned off there too.
  The background is a WebGL neon tower city that shifts colour per area (blue on the map,
  amber in the Workshop, red for Wardens). If your browser has no WebGL it
  falls back to a plain dark background.

READING A PIECE
  Pieces show their powers in how they look, not with stickers:
  Drill has steel teeth along its underside, Vacuum has a grille and a swirl, Bomb is dark iron
  with a lit fuse, Coin is stamped with coins, Lantern glows, Echo trails afterimages,
  Hourglass has falling sand, Earthquake is cracked, Prism Shard shimmers, Stasis wears a
  clock face whose hands run backwards, and so on.
  Gold is shiny and sparkles, Glass is see-through, Stone is rough. Hover any piece in a menu
  for its exact effect, or see the whole set in the Tutorial's "Reading a piece" lesson.
  Board cells are drawn faint on empty squares so you can always tell a space is open; once a
  block covers a cell, a small badge in its corner shows it is still there.

INSTALL IT AS A PHONE APP
  This folder is also a web app. Put it on any static web host (GitHub Pages, Netlify, Cloudflare
  Pages) and open the address on your phone:
    iPhone / iPad (Safari) .... Share, then Add to Home Screen
    Android (Chrome) .......... the menu, then Install app (or Add to Home screen)
  It gets the Stackbound icon, opens full screen, and plays with no connection once it has been
  opened once. When a new build goes up, the app fetches it in the background and switches over
  the next time you are on the title screen (or the next launch).
  The installed app keeps its own save, separate from the browser and from the zip version.
  Opening "Play Stackbound.html" from the zip works exactly as before; the app parts only switch
  on when the game is served from a web address. Files for this: index.html (sends visitors to
  the game), manifest.webmanifest, sw.js (the offline copy; rebuilt with every release), icons/
  and .nojekyll (lets GitHub Pages serve the folder as it is).

THE LOOP
  Climb the Tower: 8 Floors, each one Stack I, Stack II and a Warden Stack. Every Stack is endless
  falling-block play with a score target and a 5:00 clock. Every line clear scores MASS x CHARGE. Hit the target
  before the clock runs out, then Bank or Push On for more money. A Push On resets your score to
  0, adds 1:00 to the clock and sets a fresh goal: 60%, then 90%, then 130% of the target.
  Topping out or running out of time while pushing ends the run. Beat the Floor 8 Warden to reach
  the Summit and win, then keep climbing in Endless.

THE CLOCK
  Every Stack starts with 5:00. It turns amber under 30 seconds and red, with a tick, under 10.
  Stack modifiers that change it: Extra Time (+1:30), Short Fuse (3:00), Beat the Clock (2:00, but
  every line cleared adds 5 seconds) and Sudden Death (1:30, target 40% lower). The Deadline
  (a Warden) gives you only 2:00.
  Ways to get time back: Alarm Clock curio (+45 seconds every Stack), Borrowed Time (+10 seconds
  per Quad), Chronoshard (+2 seconds per line), Time is Money (unused time pays when you Bank),
  the Long Fuse Schematic (+30 seconds every Stack), Hourglass pieces (their seconds go back on
  the clock) and the Freeze Glyph (stops gravity and the clock for 6 seconds).
  Between Stacks you visit the Workshop for Curios (scored left to right), Patterns, Glyphs, Rifts,
  packs, Bag Patches and Schematics.

THE WORKSHOP
  Every visit is stocked differently:
  - 2 to 4 curios and 2 to 4 Pocket items (Patterns, Glyphs and Rifts), never two the same.
  - Your Bag holds at most 2 pieces of the same shape, so packs never offer a third.
  - 2 to 4 packs from six kinds: Piece Pack, Board Pack, Crate of Pieces (pick 1 of 5),
    Terrain Crate (pick 1 of 5), Pattern Scroll (pick 1 of 3 Patterns, learned on the spot) and
    Curio Cabinet (pick 1 of 3 curios, better odds of Uncommon and Rare).
  - A Bag Patch and a Schematic show up most visits, not every one.
  - Sometimes one item is on SALE at half price.
  - Some visits have an event: Sale day (25% off everything), Delivery day (an extra curio and
    an extra Pocket item), Rare shipment (first curio is Uncommon or better), Pack surplus (an extra pack)
    or Tinker day (Forge costs $2 less).
  - Forge: +1 level to a piece for the rest of the run. It costs $5, then $10, $20, $40...
    doubling each time within one visit, and starts over at $5 at the next visit.
  - Map restocks (pass 15): restocking a Stack I or II modifier ($2) needs the Scout's Report
    Schematic. The Warden can be swapped with the Bribe curio ($5) or the Shift Change Schematic
    ($10), each once per Floor.

THE RIVAL (Endless only)
  From Floor 9 on, about half of the Warden Stacks also bring a Rival, shown on the map and beside
  your board under Next. It is a second stacker modelled on how you played this run: it places
  pieces about 6% faster than your best pieces-per-second over any Stack, clears on the rhythm of
  your quickest Stack (time between clears) and goes for the clear size you use most.
  While it stands, your clears score nothing (money and other effects still happen) and the clock
  keeps running. Your clears send it garbage, by a fixed table: a Double 1, Triple 2, Quad 4,
  Twists 2/4/6, +1 for a Repeat and more for combos, an All Clear 10. Its clears send you
  garbage (half a line for a Single, 1 for a Double or Triple, 2 for a Quad); it waits in the
  red bar beside your board and rises from the bottom when you lock a piece without clearing,
  with one hole per batch. Your clears cancel garbage headed for you before any reaches the Rival.
  Fill its board to the top and it is knocked out: +$3, and every clear scores again.

WORDS STACKBOUND USES
  Mass x Charge ...... the two halves of every score (Mass from the clear and its blocks,
                       Charge from how hard the clear hits)
  Floor .............. one level of the Tower (3 Stacks)
  Warden ............. the boss Stack that ends each Floor and breaks a rule of the game
  Bank / Push On ..... take the reward now, or raise the target for more money
  Workshop ........... where you spend money between Stacks; Restock rerolls its shelves
  Hazard ............. difficulty level, 1 to 9, plus the secret Hellscape
  Token .............. reward for skipping Stack I or II
  Curio .............. a passive item; up to 5, scored left to right
  Pocket ............. holds Patterns, Glyphs and Rifts until you use them
  Schematic .......... a permanent upgrade for the rest of the run
  Savings ............ $1 for every $7 you hold at the end of a Stack (max $5)
  Quad ............... clearing four lines at once
  Twist .............. a clear made by turning a T piece into a tight slot
  Repeat ............. a Quad or Twist straight after another one, for +2 Charge

WHAT'S IN THIS BUILD
  7 Builders (2 unlocked, 5 unlockable), 9 Hazard levels and the secret Hellscape
  8 Floors + Endless, 14 Wardens + 2 Summit Wardens, 29 Stack modifiers, 11 skip Tokens
  160 curios (54 Common, 58 Uncommon, 38 Rare, 9 Legendary, 1 Mythic), each with its own emblem, and 8 tag Transformations
  30 piece shapes, 7 materials, 4 behaviors, 17 special modifiers, piece levels 1-15 with a bonus at Lv5, Lv10 and Lv15
  The Bag inventory grid (packing, patches, Gilded/Clover bag cells, removal fees)
  13 board cells, Well columns, Overflow Lip, Wide/Narrow/Tall boards
  8 Patterns, 17 Glyphs (4 live), 8 Rifts, 20 Schematics, 6 pack kinds, 5 Workshop events
  The Rival (an Endless Warden modifier) and rebindable keys
  The Prize Counter: Tickets earned across runs buy 6 piece skins, 6 clear effects, 6 songs, 4 backdrops
  Daily seed and custom seeds, Collection screen, stats

PRIZE COUNTER (pass 16, outside runs)
  Tickets are earned across runs and kept between them. A run pays 1 Ticket when it ends, as long
  as it won at least one Stack (so quitting a run straight away pays nothing). In Endless, every 30
  Stacks cleared pays another Ticket on the spot. The title screen's Prize Counter spends them.
  Everything there is looks only and changes nothing about scoring:
  - Piece skins (pass 17 themes, each piece drawn as one object): Slab (free, the house look),
    Gloss (free), Pixel 1,
    Toy Brick 2, Neon Sign 2, Bakery 2, Skyline 3, Steampunk 3, Castle 3. Material blocks (Gold,
    Glass, Steel and the rest) keep their own look so they still read at a glance.
  - Clear effects: Classic (free), Shatter 1, Confetti 1, Lightning 2, Fireworks 3, Dissolve 2.
    Material and garbage blocks still burst in their own way. Bigger clears get more of everything.
  - Music: Neon Ascent (free), Chip Rush 1, Night Drive 2, Lo-Fi Loft 2, Sunbeam 2, Deep Tower 3.
    Each card has Listen to try it first.
  - Backdrops: Neon City (free), Retro Sunset 2, Night Peaks 2, Deep Space 3. Try it shows it live.
  Buying something equips it. Leaving the screen puts back whatever you have equipped.
  The currency is called Tickets because Tokens are already the skip rewards inside a run.

NEW IN PASS 35 (own identity for the App Store)
  - New names: the four-line clear is a Quad, a T-piece spin clear is a Twist, and a Quad or Twist
    right after another is a Repeat. Curios, achievements, stats and sounds use the new names
    (Tetromancer is now Fourcaster, Tetris Tax is Quad Tax, Back to Back is Double Feature).
  - The seven starting pieces have new colours: I rose, O teal, T amber, S violet, Z lime, L sky
    blue, J bone.
  - The board starts 11 wide and 22 tall (same shape on screen). Wide, Narrow, Tall and the Giant
    follow it: 13 wide, 9 wide, 26 tall and 13 wide.
  - Slab is the new house look for pieces: matte, one ink outline round each piece. The old glossy
    blocks are still in the Prize Counter as Gloss.
  - The landing guide is a dotted chalk outline with a faint wash instead of a see-through copy.
  - The dating game's style is now the Sweetheart style, and the finale is a thank-you from Elle.
  - Saves carry over: old stats, curios, achievements and settings are renamed on load.

NEW IN PASS 34
  - Workshop: a Last Stack button opens the score breakdown of every clear from the Stack you just
    finished (it is saved with the run, so it is still there after Continue).
  - Phone Bag: the pieces are listed on the left; tap one and its details open on the right with Move
    and Remove. With nothing picked, that side shows the Bag's numbers. On phones, Glyphs and the
    Forge show the piece first and do it from a button there. Short landscape screens get the same
    columns beside the Bag.
  - Materials, Specials and Behaviours are tagged with their kind wherever they are described. A piece
    holds one of each.
  - Before a Material replaces one a piece already has (Gild and the other material Glyphs, The Egg,
    Transmute), the game asks first and shows what goes and what takes its place. While choosing, each
    piece is marked Adds, Replaces or Already.

NEW IN PASS 33
  - Bag fixes on PC: right-clicking to turn a new piece no longer places it too, and a click places
    the piece where you clicked, even if the mouse moves on straight away.

NEW IN PASS 32
  - Stackbound installs as a phone app from any web host: app icon (the title's S, built from its
    pieces), full screen, offline play, and updates that arrive on their own. See INSTALL IT AS A
    PHONE APP above. The zip and the Claude phone link play exactly as before.

NEW IN PASS 31
  - Curio pictures are centred by how they look, not just by their outline: each one is pulled toward
    its visual weight, so lopsided pictures (Clean Sheet's broom, Loupe, Graffiti, Low Rider) sit in
    the middle. Curios with a corner badge (Fourcaster, Single Minded, Low Rider...) no longer push
    their picture up and to the left; it stays centred and the badge sits over the corner.
  - The Workshop keeper is back in his apron with the pencil in the pocket and the wrench in hand,
    now without the hard hat.
  - He has 74 lines now (was 24). Pokes and hellos mix in hints (a lightbulb pops up for those): curio
    order, the score breakdown, Savings, Restock and Forge prices, Push On, Wardens, Freeze and more.
    Event days get their own greeting, lines are dealt out without repeats, and long lines wrap.

NEW IN PASS 30
  - Every curio's picture now sits dead centre in its frame and fills it the same, whatever its shape
    (Clean Sheet, Garbage Man, High Rise and Lean Season were the worst). Glyphs, Patterns, Rifts and
    Schematics get the same treatment.
  - 27 curio pictures that read oddly are new: Low Rider (a tide gauge), Portside (Starboard's hand,
    mirrored), Snake Charmer (snake in a basket), Flat Earth (a flat slab), Perfectionist (laurels),
    Menagerie (paw print), Loupe (magnifying glass), Graffiti (paint roller), Landfill (brick pile),
    Brinkmanship (leaning tower), Molten Core (fire bowl), Overachiever (ribbon), Scrap Metal (hex nut),
    Chorus (microphone), Receipt (a till slip), Event Horizon (swirl), Safety Net (life ring),
    Penthouse (skyline), Groundswell (wave), Perfect Storm (lightning), Minimalist (an empty slot),
    Hindsight (turn-back arrow), Kaleidoscope (flower pattern), Gold Digger (mine cart),
    Fool's Gold (ore), Slow Hand (snail), Atlas (globe).
  - The Workshop keeper was redrawn with a flat cap and a small apron (pass 31 put his old outfit back).

NEW IN PASS 29
  - 13 new curios (160 in all):
      Retriggers: Tailwind (the curio to its right scores twice), Hindsight (the curio to its left
        scores twice), Curtain Call (clears of 5 or more lines retrigger all curios once). All Rare.
      Rare: Keystone (x3 Charge when it has as many curios on its left as on its right).
      Uncommon: Five Alarm (x2 Charge on clears of 5+ lines), Kaleidoscope (Prism cells give x2),
        Hot Streak (+2 Charge per clear of 2+ lines in a row, a Single resets it), Chorus (+3 Charge
        per curio that scored before it on this clear, repeats included), Jackpot (1 in 4: x4 Charge).
      Common: Loupe (Lens cells give x2 Mass), Graffiti (+2 Charge per inscribed board cell),
        Ledger (+1 Charge per $4 held), Landfill (+1 Charge per garbage block on the board).
  - Curio review: Schematic Ghost now copies the curio to its right twice (Tailwind does it once).
    Devil's Bargain x5 -> x8 Charge (Mass still halved). I Love I +30 -> +60 Mass, T Time +25 -> +50,
    Clean Sheet and Flat Earth +30 -> +50. Overachiever +1 Charge per 2 achievements (was per 1).
    Trophy Case $1 per 5 achievements, max $6 (was per 3, no max). Clearer text for Speed Demon,
    Adrenaline and Atlas.
  - Endless targets grow 10% faster: each Floor past 8 multiplies the target by x3.3, then x3.685,
    x4.07 and so on (was x3, x3.35, x3.7).
  - The score breakdown names what made a curio score again, e.g. "Fourcaster (Tailwind)" or
    "Fourcaster (Standing Ovation)".
  - The Collection shows all 160 curios, Yolk included, while this build has everything open.
    Tap or hover one to read what it does.
  - Tutorial > Scoring order (the last lesson): the order every clear adds up in, and a worked
    Quad you can swap two curios in to see why +Charge belongs left of xCharge. How to play
    section 2 lists the order too.

NEW IN PASS 28
  - Score breakdown: tap or click the Mass x Charge box during a Stack (or Last score in the pause
    menu) to pause and see every step of your last clear: each Mass and Charge source in order with
    the running Mass x Charge, the final sum, and anything that changed it after (Overtime, The Tax
    Man, a standing Rival). The arrows step back through this Stack's earlier clears.
  - Settings > Score pop-ups: turn off the clear name, combo and score that pop up on the board,
    and the badges on board cells. Clear effects, sounds and the score panel stay.

NEW IN PASS 27
  - Hazards 1 to 9 are now nine tiles on the New Run screen, each one pickable on its own. Each
    Hazard still includes every rule below it. Winning a run on a Hazard earns its achievement and
    opens a new curio:
      1 Calm: Smooth Sailing, Still Water (Uncommon): x2 Charge at speed level 3 or lower.
      2 Lean: Belt Tightener, Lean Season (Uncommon): skipping a Stack also pays its base reward +$2.
      3 Tense: Nerves of Steel, Tension Spring (Uncommon): +3 Charge per clear since your last
        Quad, paid out on the next Quad.
      4 Cursed: Curse Breaker, Hex Ward (Rare): Void cells give x2 Charge instead of scoring 0.
      5 Taxed: Tax Return, Receipt (Uncommon): +1 Charge per $2 spent in the last Workshop.
      6 Sparse: Slim Pickings, Minimalist (Rare): x1.5 Charge per empty curio slot.
      7 Rushed: Rush Hour, Rush Order (Rare): speed rises twice as fast, +3 Charge per speed level.
      8 Greedy: Greed Is Good, Double Down (Rare): x1.5 Charge per Push On done this Stack.
      9 Broke: Rags to Riches, Empty Pockets (Rare): x2 Charge while you hold less than $5.
  - Nine Circles (hidden): win on all nine Hazards. Opens Hellscape and the Legendary curio
    Devil's Bargain (x5 Charge, but every clear's Mass is halved).
  - Hellscape, the secret 10th Hazard: speed starts at 8, clears are worth half, and every Warden
    Stack has two Warden rules at once. It includes Hazards 1 to 9.
  - Hell's Survivor (hidden): win a run on Hellscape. Gives the only Mythic curio, the Devilled Egg
    ($20): every 6 pieces a random piece on the board turns to Yolk, and Yolk in a clear counts three
    times. It only turns up in Endless (3% of curio rolls there). It also opens the Hellscape looks,
    which stay hidden on the Prize Counter until you have it: Brimstone skin, Hellfire clear,
    Furnace song, Hellscape backdrop and Inferno sounds.
  - Flutter: tap the Ticket on the Prize Counter five times quickly. Flap a winged block through
    the gaps. Bronze at 5, silver at 10, gold at 15. Scoring 15 earns Frequent Flyer (hidden) and
    opens the Paper Plane curio (+1 Charge per row the clearing piece fell when hard dropped, max 20).
    Any rotate or hard drop key, Space or a tap flaps; P pauses; Esc leaves.
  - The Workshop has a hanging sign, a shopkeeper behind the counter, pegboard shelves with price
    tags, SOLD stamps, coins that fly to your money, and a shuffle when you Restock. Tap the
    shopkeeper to say hello.
  - The dating game's backdrops and pieces were redrawn.
  - Curio rarity Mythic: red-orange rim with a flame mark.

NEW IN PASS 26
  - A new Schematic, Shift Change ($20): on the map, swap the Floor's Warden for a different one for
    $10, once per Floor. It works alongside the Bribe curio, so with both you can swap twice.

NEW IN PASS 25
  - 14 new achievements (38 in all). Eight are hidden: they show as ??? until earned, with a
    Hidden badge, in their own section of the Achievements page. For testing, everyone counts as
    having every achievement, so everything they open is open. Doing the thing still shows its
    banner and pays its Ticket.
      Dumpster Diver: clear 50 garbage rows. Opens Scrap Metal.
      Held Breath: clear a line with a piece that waited 30 seconds in Hold. Opens Time Capsule.
      Bookworm: own a Common, Uncommon, Rare and Legendary curio at once. Opens Bookends.
      Cranked: score a clear with 100 Charge or more. Opens Amplifier.
      Close Shave: reach a Stack's target with 5 seconds or less left. Opens the Clockwork sounds.
      Big Spender: spend $40 in one Workshop visit. Opens the Till sounds.
      Spin Class: clear 25 Twists. Opens the Arcade sounds.
      Cell Block: clear 3 Board Pack cells in one clear. Opens the Chimes sounds.
      Hidden: Hatchling (now hidden), Trust Fall (opens Blindfold), Pacifist (Felt sounds),
      Butterfingers (Squeaky Toy sounds), Night Shift (Laser sounds), Secret Admirer (the Love
      Letter), Four Hearts (the Sweetheart style) and Credits Roll.
  - 18 new curios built to combine with other curios or reward odd ways of playing. Five of them
    (28%) are opened by achievements.
      Common: Honeycomb (+2 Charge per hole in your stack), Hot Potato (+8 Charge when the piece
        came out of Hold).
      Uncommon: Amplifier (triples +Charge from the curio on its left), Scrap Metal (+3 Charge per
        curio sold this run), Time Capsule (x0.5 Charge per Stack banked without pushing; a Push On
        empties it), Metronome (x3 Charge on a clear exactly 3 pieces after the last), Fool's Gold
        (garbage counts as Gold), Slow Hand (no hard drops; x2 Charge), Lodestone (garbage gaps line
        up under your first Well; +5 Charge per garbage row cleared), Pinata (every 12th line drops a
        Glyph), Domino (+3 Charge per clear in a row with a new shape), Last Stand (x3 Charge with 20
        seconds or less left).
      Rare: Bookends (your leftmost and rightmost curios score twice), Blindfold (no ghost, no
        preview; x3 Charge), Kintsugi (each Glass crack pays $2 and adds x0.25 Charge), Small Print
        (Singles count as Quads), Matching Set (x3 Charge when all your other curios share a tag),
        Chameleon (copies a random curio you don't own, new each Stack).
  - Sounds: a new Prize Counter tab with 12 sound packs that change the sounds of moving, turning,
    holding, landing, hard drops, clears, Quads and menu clicks. Classic, Woodshop, Drum Kit and
    Typewriter are bought with Tickets; Arcade, Chimes, Clockwork, Felt, Till, Laser, Squeaky Toy
    and Sweetheart are opened by achievements. Listen plays a short demo of each.
  - A secret code entered during a Stack earns Secret Admirer and puts a Love Letter in your Pocket
    for the rest of the run (in a slot of its own). Use it to open Falling for You, the dating game.
    Mid-Stack, the Stack waits until you close it. The Sweetheart style it unlocks is switched on and
    off in Settings or the pause menu.
  - No emoji anywhere: arrows, keys, ticks and buttons are drawn marks now, and the Workshop pack art
    (Crate of Pieces and the rest) is redrawn flat and inked.

NEW IN PASS 24
  - Two new achievements, each unlocking a new Rare curio:
      Skies the Limit: clear 16 lines at once. Lines holding Stasis blocks wait in time, so hold 15
        of them and then clear one more.
        Unlocks Penthouse: x4 Charge if the clear includes a line above the 16th row. While you own
        it, a faint gold seam on the board marks the 16th row.
      Tight Fit: clear a line with only 3 rows of space left above your stack.
        Unlocks Groundswell: a garbage row rises under your stack every 2 pieces, with its gap in the
        same column all Stack so it can be dug out; clears with garbage get x3 Charge.
  - The old Tight Fit curio (x2 Charge with exactly 6 pieces in the Bag) is now called Half Dozen.

NEW IN PASS 23
  - A new title. STACKBOUND is built from falling pieces in the middle of the screen, then rises to
    the top while the menu opens out from under it. Tap or press a key to skip. Click the logo once
    it has settled and something happens.
  - Achievements (22, one of them secret), on their own screen from the title menu. Each pays a
    Ticket for the Prize Counter, and most unlock something: the five Builders that used to unlock on
    their own, existing curios (The Egg, The Crown, Spin Doctor, Ouroboros, The Infinite Well,
    The Clockmaker, Phoenix Feather), and new things:
      Mortar (Rare, the secret): every clear fills the lowest hole in your stack.
      Trophy Case (Rare): +$1 at the end of each Stack per 3 achievements earned.
      Overachiever (Uncommon): +1 Charge per achievement earned.
      Starting Gun (Uncommon): x2 Charge on clears in the first 45 seconds.
      Bedrock (Uncommon): +60 Mass when the clear includes the bottom row.
      Trophy Pack (Workshop pack): pick 1 of 3 curios that achievements unlock.
      Trophy Shelf (schematic): +1 curio on every Workshop shelf.
    Until earned they stay out of the Workshop and every other pool. This test build still opens
    everything for everyone. A banner drops in when you earn one, never in the middle of a Stack.
  - A new look for every panel, button, card and pop-up, built like the logo's letters: an ink
    outline, a rim lit from the top, a slab of depth under anything you press. Big panels are held by
    brass studs, headings start with a block, bars fill in cells, the menu cursor is two T pieces,
    and rarity shows as a growing piece (1 block for Common up to a T for Legendary).

NEW IN PASS 22
  - One lettering for everyone: Slab (Alfa Slab One for titles and numbers, Kreon for reading).
    The Lettering choice is gone from Settings.
  - Less text on screen. Controls live in Settings and How to play, so the reminders elsewhere are
    gone: the key strip and tagline on the title screen, the swipe chips in the pause menu and under
    the board, the Live Glyph line, the "tap a card to buy" lines in the Workshop, the key hints by
    Hold and "Clear a line to score". Pop-ups now just say "Pick one", the Bank and Push On buttons
    keep only the numbers, the Workshop sign is just WORKSHOP, and the Bag no longer shows its fee
    formula. Placing a piece in the Bag has a Rotate button on PC too.
  - Settings labels are shorter (Auto-shift delay, Auto-repeat rate, Soft drop speed, Mute all).

NEW IN PASS 21
  - Menus that feel like a game, not a web page.
      Title and pause menus are one list in a panel. A gold cursor slides to the entry under your
      mouse or keys, with a soft tick. Continue (or New run) is the big entry; Tutorial is marked
      "Start here" until you have played a run or a lesson.
      Every screen and pop-up can be driven with the arrow keys and Enter (Esc backs out). Lists
      wrap top to bottom; cards and buttons are picked by direction. Hovering a card with the keys
      shows its tooltip, just like the mouse.
      The Bank payout counts up: your Stack score climbs, each line drops in with a coin sound and
      the total rolls up to its final number. Tap or click the panel to skip straight to the end.
      Game over drops its stats in one by one and marks a New best when you beat your best Floor
      or your biggest Stack.
  - Smaller fixes: discounted items show a red Sale tag on the price instead of a ribbon over the
    card, volume sliders read in percent, and the desktop side panel says POCKET (it still said
    CONSUMABLES).

NEW IN PASS 20
  - New names, so Stackbound sounds like itself. Names that were lifted from other games, or too
    plain to remember, were changed; everything that already worked was kept. Effects are unchanged.
      Relics -> Curios (Relic Vault -> Curio Cabinet, Silent Relics -> Silent Curios)
      Consumables -> Pocket items (their Workshop shelf is now "For your Pocket")
      Materials: Lucky -> Clover, Holo -> Opal (Lucky Cell -> Clover Cell, Lucky bag cell -> Clover)
      Specials: Scholar -> Tutor, Forge -> Bellows, Temporal -> Stasis
      Glyphs: Fortune -> Sprout, Brush -> Daub
      Tokens: Coupon -> Gift, Double -> Payday, Rare -> Treasure, Investment -> Bounty,
        Economy -> Windfall
      Wardens: The Pillar -> The Divide, The Shatter -> The Glazier, The Hourglass -> The Deadline
      Workshop events: Clearance -> Sale day, Overstock -> Delivery day
      Schematic: Seed Money -> Rainy Day Fund.   Transformation: Packer -> Pack Mule
      Curios: Coupon -> Punch Card, Reroller -> First Dibs, Midas -> Gilt Edge, Counter -> Odometer,
        Spinner -> Whirligig, Left Hand -> Portside, Right Hand -> Starboard, Centrist -> Bullseye,
        Collector -> Menagerie, Shiny -> Greenhouse, Stacker -> High Rise, All In -> Blank Canvas,
        Omega -> The Maw, the four-line Supreme -> Standing Ovation, Philosopher's Stone -> Electrum,
        Pocket Watch -> Snooze Button

NEW IN PASS 19
  - New lettering, and you can pick it: Settings > Lettering has four sets, each shown in its own
    letters so you can compare them. The whole game (titles, numbers, buttons, card text and the
    Workshop sign) switches at once, and your choice is saved.
      Brush (default) .. Recursive in its casual style, lettered as if with a sign-painter's brush
      Slab ............. Alfa Slab One titles over Kreon, like a printed board game
      Round ............ Baloo 2, soft and rounded throughout
      Doodle ........... Grandstander, chunky hand-drawn letters
    The Bungee and Barlow fonts from pass 18 are gone.

NEW IN PASS 18
  - TEST BUILD: everything is free for now. Every Builder and all 10 Hazards are open, and every
    skin, clear effect, song and backdrop at the Prize Counter can be equipped without Tickets.
    Nothing is marked as owned in your save and your Tickets are kept, so switching the free build
    off later (SB.FREE_BUILD in js/cosmetics.js) puts the normal unlocks back exactly as they were.
  - Materials work on every skin: a Gold, Glass, Steel, Stone or Crystal piece keeps its skin's
    shape and detail (the building, the brass machine, the castle keep) and takes the material's
    finish on top: gold leaf, see-through glass, brushed steel, speckled stone, cut facets.
    Opal, Clover and the cell enchantments keep their shine and icons on every skin too.
  - The ghost piece (where the piece will land) and the piece you are placing in the Bag are drawn
    in your skin and material, traced round the outside so you can still read the spot.
  - Sound effects were redone. Every skin lands with its own sound (a brick click, a neon buzz,
    a stone thud, a brass clank with steam, a soft cake bump...), every material adds its own
    accent (gold chime, glass tink, steel ring, stone knock, crystal shimmer), and menus, tabs,
    equipping and pop-ups have quiet taps and swishes. Effects play through a small room echo.
  - New fonts: Bungee for the titles and numbers (signage letters made for stacking) and Barlow
    for reading, with Barlow Semi Condensed on buttons and labels. The Workshop sign is painted in
    Bungee Shade. The title is now STACK over BOUND built from blocks in your equipped skin, which
    drop in and land when the title opens, with a gold O.
  - The menus were calmed down: flat panels with one edge, buttons that sit on a dark lip and press
    down when tapped, gold for the main action on each screen, and no glows, blur or bobbing.

NEW IN PASS 17
  - Piece skins are themes that know the shape of the piece: Skyline (buildings with lit windows,
    shopfronts and a spire with a beacon), Steampunk (brass frames, copper pipes between blocks,
    a gauge and valve wheels), Neon Sign (one glowing tube traces the piece), Bakery (layer cake,
    dripping icing, a cherry on top), Castle (battlements, gates, a banner), Toy Brick (studs on
    top) and Pixel (one outlined sprite). Jelly, Origami and Minimal were retired and refunded.
  - Clear effects are much bigger: Shatter cracks the rows and throws spinning glass, Confetti
    fires party poppers and streamers, Lightning strikes from the top of the board with a screen
    flash, Fireworks launches rockets into peony, glitter, willow and ring shells, and Dissolve
    glitches the row and pulls it into a rising pixel vortex. Four-line clears add a finale.
    Each has its own sound. Buying a prize now gets a little celebration.
  - The music was rewritten to sound performed (see MUSIC AND EFFECTS): electric piano, plucked
    and strummed strings, upright and fingered bass, flute, whistle and cello voices, a room
    reverb, ghost notes and fills.

NEW IN PASS 16
  - Rising Fog (Stack modifier, Floor 3 and up): fog rises one row every 3 pieces and hides what
    it covers (never the falling piece). Every scoring clear pushes it back down 2 rows.
  - Carry-On (Rare curio, Bag): pieces in your Hold slots stay there for the next Stack.
  - Curio emblems were redrawn: a metal rim for rarity, an enamel face, and an outlined picture,
    with 14 curios given clearer pictures. Glyphs, Patterns, Rifts and Schematics got framed
    icons of their own, and every pack has its own art (gift box, crate, slab, scroll, chest).
  - Effects: a bomb goes off and every block it breaks pops in a small explosion of its own,
    nearest first. Drills kick up dust, Vacuum pulls debris in, Earthquake rolls grit along the
    floor, Mender sparkles and Sand trickles.

TUNING NOTES (changes from the concept doc numbers, made so runs stay playable)
  - Glass: x1.5 Charge per Glass piece in a clear (not x2 per block); at Level 0 a Glass piece shatters.
  - Gold material pays $1 per 4 Gold blocks cleared; Gold cells pay once per Stack each.
  - Coin special pays $1/$2/$3/$5 at Lv1/Lv5/Lv10/Lv15. The Miner starts with 3 Gold cells and +$2.
  - The Miser appears from Floor 2. Targets (pass 15, steeper): 300 / 1.2k / 3.5k / 9.8k / 25k /
    60k / 130k / 270k (Stack I; Stack II x1.5, Warden x2). In Endless each Floor multiplies the
    target again, and the multiplier itself climbs: x3.3, then x3.685, x4.07 and so on (pass 29,
    10% faster; Floor 10 is about 3.3M, Floor 12 about 59M).
  - Piece order (pass 15): every piece comes up at exactly the % the Bag shows. Each roll, every piece
    earns its share and the piece that comes up pays 1, and the roll leans toward pieces that are
    owed. Over a Stack the counts match the shown rates, with short droughts and few repeats.
    (The old repeat rules made boosted pieces show up less often than the Bag said.)
  - Rarer power (pass 15): Rare curios are offered about a quarter less often (4.5% of curio rolls,
    9% from Floor 3; a Curio Cabinet's first card is Rare 22% of the time, was 30%). Anything that
    multiplies (21 curios with x Charge or x Mass, the Catalyst, Pact and Prism Shard specials, Glass
    and Steel, the Anchor behaviour, Prism and Lens cells) is offered half as often as before.
  - Board cells were buffed so each one is felt: Lens x1.5 Mass, Echo retriggers the clear's
    base Mass and Charge, Furnace +60 Mass, Totem +2 Charge per curio, Clover 1 in 3 for +15 Charge.
    When a cell fires, a badge pops off it on the board showing what it added.
  - Vacuum: on landing it deletes every block touching its underside (the cells right below
    each of its bottom faces), then drops down into the space it cleared. Higher levels reach
    further: Lv5 also eats the row below that, Lv10 a third row, Lv15 a fourth.
  - Drill: on landing the whole piece bores straight down, destroying every block in its path:
    3 rows at Lv1, 5 at Lv5, all the way to the floor at Lv10.
  - The Divide (Warden): the wall down the middle counts as a filled block in every row, so lines
    clear straight through it, and it never breaks. Pieces drop on a random side of the wall
    (a small NEXT marker at the top shows where the next one lands). The side that is lower, or
    where the coming piece fits without leaving a hole, gets picked more often.
  - Bomb: when a line containing it clears, it destroys the 3x3 area around it. Anything left
    floating over the crater then falls down to fill the gap, and any lines that completes
    clear too and score as a cascade.
  - Stasis: a full line holding a Stasis block does not clear. It stays on the board, shimmering
    blue, until some other line clears; then every held line clears together with it and counts
    toward that clear (a held Double plus a Double is a Quad). Each held line adds +2/+4/+6/+9
    Charge at Lv1/Lv5/Lv10/Lv15. Waiting lines don't break your combo, but they do take up room.
  - Money (pass 8, about 16% less per Floor): Warden reward $4 (was $5), Push On pays $2/$6/$10
    (was $3/$7/$12), the time bonus is $1 per 18s under par up to $4 (was 15s, up to $5), Savings
    are $1 per $7 held up to $5 (was $6, up to $6; Vault $1 per $5), and every tier 2 and 3 Stack
    modifier pays $1 less.
  - Windsock (Rare curio): on the map, a "Choose modifier" button on Stack I and Stack II lets you
    pick any modifier the current Floor allows (except Jackpot), or none. You can change it as often
    as you like until you play that Stack. Warden rules can't be changed.
  - Piece levels (pass 14): levels run 1 to 15 and no longer change how often a piece shows up;
    every piece has the same base weight. Each piece unlocks a bonus at Lv5, Lv10 and Lv15 (the
    old Lv3 bonuses moved to Lv5 with their Mass and Charge numbers doubled, the old Lv5 ones moved
    to Lv10, and Lv15 adds x2 Charge on clears with that piece). Specials step up at the same levels.
    Levels are kept for the whole run (Workshop Forge, Forge Glyph, Forge Token, Piece Pack upgrades,
    the Ascend Rift's +5). Only the Bellows special and Gilded bag cells give temporary levels, which
    wear off when the Floor's Warden is beaten. Everything that levels pieces turns up a third as often as before,
    and Piece Packs offer an upgrade 10% of the time (was 25%).
  - The Egg (Legendary curio, "???"): removes the 3-push limit (Push On IV and up each ask for another
    quarter of the target and pay $3). Bank a Warden Stack after 15 pushes in it and the Egg hatches:
    it leaves its slot, you get +1 curio slot and two random Legendary curios, and you pick one piece
    to turn to Yolk, a material that counts as every other material with none of their downsides.
  - Prism cells are offered half as often as other cells in Board Packs and by the Daub Glyph
    (about 5% of cell offers instead of 10%).
  - The Collection screen lists every board cell and material with what it does.
  - Not in this build yet: Twins, seals, Splitter/Ghost/Phase pieces, events between Floors,
    Secret Stacks, Mirror King and Void finales.

CREDITS
  Icons from game-icons.net by Lorc, Delapouite and contributors, licensed CC BY 3.0
  (https://creativecommons.org/licenses/by/3.0/). Some icons were recoloured, and the curio
  emblems are drawn around them.
  Fonts: Alfa Slab One (JM Sole) and Kreon (Julia Petretta), under the SIL Open Font License 1.1;
  the licences are in css/fonts.
  Everything else (code, music, art, effects) was made for this game.
