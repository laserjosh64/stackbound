// Falling for You: the script. One plain-text script per part, parsed by dating.js.
//   # label            a place to jump to
//   @bg scene [tint]   change the scene (tints: dusk, night)
//   @show who mood pos @hide who   @clear   (pos: l, c, r)
//   @music id  @shake  @flash  @glitch  @title text  @name  @unlock
//   @aff n  @set flag  @goto label  @if flag label  @ifnot flag label  @ifaff n label (love >= n)
//   @ending good|normal|bad|finale   @pick (the route choice at the end of the prologue)
//   who mood: line      who: line (keeps the mood)      : narration      me: your line
//   - choice text | label | +n | flag      (a run of these lines is one choice)
// {me} is the player's name.
'use strict';
(function (SB) {
  const S = (SB.DATE_STORY = {});

  S.prologue = `
# start
@bg black
@music date
: You were the last piece added to the Bag.
: Just one block. A monomino. The smallest thing in the whole Tower.
@name
@bg room
: The first morning, you wake up in the Well's little dormitory, already late.
@bg town
@show jay happy c
jay: THERE you are! {me}! New block! Roomie!
jay: I'm Jay. J-piece. Your official best friend, starting now. No take-backs.
me: We just met.
jay laugh: And look how well it's going!
jay: Okay, listen. Every piece in the Bag joins a club. You can't just fall around all day with nothing to do.
jay smug: And I happen to know a club that's one member short.
@bg school
jay: The Line Club. We put on a play every Clear Day. Lines, get it? Like clearing lines? But also, like, saying them?
me: I get it.
jay happy: Elle came up with the name. Don't tell her it's a pun. She thinks it's deep.
@hide jay
@bg club
@show elle happy c
elle: A NEW MEMBER! Jay, you beautiful blue disaster, you actually did it!
@show jay laugh r
jay: Told you I would.
@hide jay
elle: Welcome to the Line Club! I'm Elle. President, director, and keeper of the clipboard.
elle: Clear Day is in one week. The whole Tower comes to the festival, and we're putting on "The Last Line".
elle think: It's about a lighthouse, a stranger who falls into the well, and the power of friendship. Also there's a feast.
elle happy: Let me introduce the cast!
@hide elle
@show isla neutral c
: The tall one in the corner, half hidden behind a book, is Isla.
isla: ...Hi.
@hide isla
@show tessa laugh c
: Then a purple blur resolves into a T-piece, mid-spin.
tessa: Hi hi HI! I'm Tessa! I'm the lead! You're so small! Can you spin?
me: I'm one block. Spinning doesn't really do anything.
tessa smug: Oh, that's sad. Don't worry, I'll spin for both of us!
@hide tessa
@show otto happy c
: A yellow square shuffles over with a tray.
otto: Welcome. I'm Otto. I made scones. They're square. Sorry.
me: Why are you sorry?
otto blush: I don't know. Habit.
@hide otto
@show elle sweat l
elle: And there's Zed, who builds our sets, who is... not here. Again.
@show zed angry r
zed: I'm here. I'm leaving. I came to get my hammer.
elle: Zed! Meet our new member!
zed pout: Hi, crumb. Bye, crumb.
@hide zed
@show elle gloom c
elle: ...He's nicer than he looks. Somewhere. Deep down.
elle happy: Anyway! Everyone rehearses with a partner this week. {me}, since you're new, you get to choose!
elle: Who do you want to spend the week with?
@pick
`;

  // ---------- Isla: the I-piece everybody waits for ----------
  S.isla = `
# start
@route isla
@title Monday
@bg library
@music date
: After club, you find Isla in the library, folded into the corner between two shelves like she's been put away.
@show isla neutral c
isla: Oh. The new block.
isla: Elle said you'd come find me. I said you wouldn't.
me: Why wouldn't I?
isla think: Nobody looks for me until they need four lines cleared at once.
isla: It's fine. That's what I'm for.
: She's holding a notebook. The page is full of crossed-out lines.
- "So what are you actually for?" | a1 | +1
- "Four lines at once is amazing, though." | a2
- "Is that the play script?" | a3 | +1

# a1
isla confused: ...
isla: That's a strange question.
isla: Most pieces ask how fast I can get to the bottom of the well.
me: I'm asking what you like.
isla blush: I. Um.
isla blush: I like the quiet bit before a piece locks. When it could still go anywhere.
isla: And words. I like words.
@goto b

# a2
isla sad: It is. Everybody says so.
isla: They wait and wait with a gap down the side of the board, and when I finally come, they cheer.
isla gloom: Then they forget about me until the next gap.
me: That sounds lonely.
isla: You get used to being a long wait.
@goto b

# a3
isla shock: You can't read that!
@shake
isla flustered: It's not done. It's barely started. It's... it's the play, yes.
me: You're writing the play? Elle didn't say.
isla nervous: Elle doesn't know it's me. I leave the pages on her desk.
isla: If they knew it was mine they'd say it was good because they like me. Or bad because they don't.
isla blush: You're the only one who knows. So... don't.
@goto b

# b
isla: Elle wants us rehearsing together. Scene three. The two leads meet on a rooftop.
isla: Wednesday, after class. Bring the script. Don't be late.
isla smug: I'll know. I'm very tall. I can see the whole hallway.
@hide isla
@title Wednesday
@bg roof
: The roof is all wind and sky. Isla is already there, scarf snapping like a flag.
@show isla neutral c
isla: You came.
me: You said you'd see me if I didn't.
isla happy: I did say that.
isla: Okay. Scene three. You're the stranger who fell into the well. I'm the lighthouse.
me: The play has a lighthouse in it?
isla: The play has a lighthouse. Read your line.
me: "I've been falling for so long, I forgot which way is up."
isla warm: "Then look for the light. I'll keep it on."
: She says it like she means it. Then she clears her throat, very loudly.
isla flustered: That's... how the line goes. In the script.
- "You wrote that line, didn't you?" | c1 | +1
- "Can we run it again? I want to get it right." | c2 | +1
- "Kind of cheesy, honestly." | c3

# c1
isla blush: ...Maybe.
isla: I wrote it the night after the big clear in the Tower. Everyone went home happy and I just stayed down in the well.
isla: I thought: somebody should leave a light on for the pieces that come after.
me: That's beautiful, Isla.
isla love: Don't. I'll fall over. I'm very tall. It's a long way down.
@goto d

# c2
isla happy: You want to practise? Most pieces want to get it over with.
: You run it again. And again. Each time she says the light line a little softer.
isla warm: You're good at this. You listen.
isla: Being listened to is... new.
@goto d

# c3
isla pout: Cheesy.
isla angry: I spent three nights on that line.
me: Wait. YOU wrote it?
isla shock: I didn't say that.
isla gloom: Forget it. Let's just do scene four.
@aff -1
@goto d

# d
: The bell rings below you. Isla looks down at the yard, at the pieces rushing to the Next box.
isla think: Clear Day is Saturday. The whole Tower will be watching the play.
isla sad: And the whole Tower will be playing. Somebody always leaves a gap.
me: What happens if the Next box calls you in the middle of the show?
isla: Then I go. I always go.
@hide isla
@title Friday
@bg club dusk
: Dress rehearsal. Elle runs it like a general. Jay works the lights, mostly by accident.
@show elle happy l
@show jay laugh r
elle: Places! Lighthouse, stage left! New block, you're falling, so... fall!
jay: Fall with STYLE, {me}.
@hide elle
@hide jay
@show isla nervous c
: Isla isn't on her mark. She's reading a crumpled slip of paper from the Next box.
isla sad: It's a call. Clear Day afternoon. Right in the middle of the last scene.
isla: A player has a gap four rows deep. They've been waiting all game.
me: So say no.
isla gloom: I can't say no. I'm an I-piece. It's the one thing everyone needs from me.
- "Then go. I'll do the last scene without you." | e1
- "They need a long piece. That's not all you are." | e2 | +2 | stay
- "What do YOU want to do?" | e3 | +1 | stay

# e1
isla sad: ...Right. Of course.
isla: The show goes on. It always does.
: She folds the paper very small. You get the feeling you said the wrong thing in a kind voice.
@goto f

# e2
isla shock: ...
isla: Say that again.
me: They need a long piece. You're a whole person who happens to be long.
isla flustered: That's... you can't just... that's MY kind of line!
isla warm: Okay. Okay. I'll think about it.
@goto f

# e3
isla think: Nobody's asked me that.
isla: I want... to finish the play. I want to see the lights come up on a thing I made.
isla blush: And I want to say the lighthouse line to you one more time. Properly.
@goto f

# f
@hide isla
@title Clear Day
@bg festival
@music dusk
: Lanterns all down the street. Somewhere above, the Tower is playing its biggest game of the year.
@bg stage
: The hall is packed. Your heart is a soft drop that won't stop.
@show isla nervous c
isla: Last scene.
@ifnot stay gone
isla determined: I sent the call to my cousin. The long one, the five-block. He'll be thrilled.
isla laugh: He's never been needed for anything in his life.
@goto scene

# gone
isla sad: The call's in an hour. I'll be gone before the end.
me: Isla...
isla: Let's just make this one count.
@goto scene

# scene
: The lights come up. You fall onto the stage the way you rehearsed, and the audience laughs in the good way.
@ifnot stay leaving
isla warm: "Then look for the light."
: She stops. The script says "I'll keep it on." She doesn't say that.
isla love: "I'm right here. You don't have to look."
: Nobody in the audience knows that isn't the line. In the wings, Elle drops her clipboard.
- Take her hand. You only have one block, but it's enough. | enda | +1
- Say your next line exactly as written. | normal

# enda
@ifaff 4 good
@goto normal

# leaving
isla: "Then look for the light. I'll keep it on."
: She says it fast. Halfway through the bows, the Next box chimes, and she's gone before the curtain falls.
@ifaff 3 normal
@goto bad

# good
@clear
@bg stars
@music dusk
@show isla love c
: Afterwards, on the roof, the whole Tower glitters below you. Isla's scarf is around both of you, which is a lot of scarf.
isla blush: I changed the line.
me: I noticed.
isla love: I'm going to write a sequel. The lighthouse and the new block.
isla: It's a long story. I hope you're okay with long.
me: I'm a single block. I'm okay with a lot.
isla laugh: Then stay. I'll keep the light on.
@ending good

# normal
@clear
@bg roof dusk
@show isla warm c
: The play was a hit. Isla stands next to you on the roof, and the space between you is exactly one block wide.
isla: Thank you. For listening this week.
isla: Maybe next Clear Day I'll put my name on the script.
me: I'll be in the front row.
isla happy: Front row. Don't be late. I'll know.
@ending normal

# bad
@clear
@bg roof night
: The roof is empty. Somewhere below, a player cheers for a Quad.
: Her scarf is on the railing where she left it. You keep it for her, just in case.
@ending bad
`;

  // ---------- Tessa: the T-piece who never stops spinning ----------
  S.tessa = `
# start
@route tessa
@title Monday
@bg studio
@music date
: The dance studio echoes with a sound like a spinning top. Tessa is in the middle of the floor, going faster and faster.
@show tessa laugh c
tessa: Ta-DAAA! Triple Twist! Did you see? Tell me you saw!
me: I saw. I'm dizzy just from watching.
tessa happy: Everybody says that! I'm the spinniest piece in the Tower. Ask anyone.
tessa smug: Elle says you're my scene partner. Lucky you, newbie!
- "That was incredible. Do it again!" | a1
- "Doesn't spinning that much get tiring?" | a2 | +1 | seen
- "It's {me}, not newbie." | a3 | +1

# a1
tessa laugh: Your wish!
: She spins. And spins. On the fifth spin she wobbles, catches herself, and laughs too loudly.
tessa sweat: Hah! Meant to do that.
@goto b

# a2
tessa confused: Tiring? I'm a T! Spinning is my whole... thing.
tessa sweat: I mean. Sometimes my bow goes crooked.
tessa: But nobody wants to watch a T that just drops straight down, right?
@goto b

# a3
tessa shock: Oh! Sorry! {me}. {me}. Got it.
tessa blush: That's a cute name. It's very... one block.
tessa happy: I'll remember it. I'm good at remembering things that only happen once.
@goto b

# b
tessa: So! The play! I'm the lead, obviously. Big entrance, big spin, big finish.
tessa: Your job is to look amazed. Can you do amazed?
me: I can do amazed.
tessa laugh: Great! Same time tomorrow!
@hide tessa
@title Tuesday night
@bg hall night
: You left your script in the studio. The hall lights are off, but the studio door is open a crack.
@bg studio night
@show tessa sad c
: Tessa is alone. She tries a spin, stops halfway, and stands there with her arms out.
tessa gloom: Come on. Come on. Just one clean one.
: She hasn't seen you.
- Knock, so she knows you're there. | c1 | +2 | seen
- Quietly leave. She'd hate being seen like this. | c2
- Walk in and clap like it was perfect. | c3

# c1
tessa shock: {me}?! How long were you...
@shake
tessa flustered: Forget what you saw. I was just. Stretching.
me: You looked like you were having a hard time.
tessa sad: ...Every spin's a hard time lately.
tessa: When I spin, everyone claps. When I don't, they look right through me. What if one day I can't anymore?
me: Then you'd still be Tessa.
tessa blush: That's a weird thing to say.
tessa warm: ...Say it again sometime. Not now. Sometime.
@goto d

# c2
: You back away. The floor creaks. Inside, the spinning starts again, angrier.
: The next day she's all smiles, like nothing happened. Maybe nothing did.
@goto d

# c3
tessa shock: Wh... you were watching?
tessa angry: That was NOT perfect! Don't clap for that!
tessa pout: Ugh. Everybody claps for everything I do. It doesn't mean anything.
@aff -1
@goto d

# d
@hide tessa
@title Wednesday
@bg roof
@show jay happy l
@show tessa happy r
: At lunch, Jay drags you up to the roof. Tessa is already there, sharing a bag of line-shaped crackers with nobody.
jay: Tessa! Teach {me} a spin. I bet you ten crackers they can't do one.
tessa laugh: Easy money! A monomino can't spin. It just sort of... sits there.
me: Hey. I can sit with a lot of style.
tessa smug: Prove it. Arms out. Well. Block out.
- Try your very best spin. | tw1 | +1
- "Only if you do one with me." | tw2 | +1
- "Nah. I'll just watch." | tw3

# tw1
: You spin. Being one block, you look exactly the same the whole way round.
jay laugh: That was either the best spin ever or nothing happened.
tessa laugh: I can't tell! I genuinely can't tell!
tessa warm: ...That's the most fun I've had spinning in ages.
@goto tw

# tw2
tessa confused: With you?
: You both spin. She does three. You do something. Jay counts it as four.
tessa laugh: You're a terrible spinner and a great partner.
@goto tw

# tw3
tessa pout: Booo. Spectator.
tessa: Fine. Watch THIS.
: She spins perfectly. Jay claps. Afterwards Tessa looks over at you, like she's checking whether you clapped too.
@goto tw

# tw
@hide jay
@show tessa think c
tessa: Hey, {me}. Can I ask something weird?
tessa: When you look at me, what do you see first? The spin, or... me?
me: Right now? A purple T with a crooked bow.
tessa flustered: My bow is NOT crooked!
: It is. She fixes it. She's smiling.
@hide tessa
@title Thursday
@bg club
@show elle happy l
@show tessa happy r
elle: Big news! The Tower is broadcasting the play live on Clear Day!
tessa shock: LIVE?
elle: Every piece in every Bag will be watching! Isn't that wonderful?
tessa nervous: Wonderful. Totally. Haha. Wonderful.
@hide elle
@show tessa gloom c
: After Elle leaves, Tessa sits on the edge of the stage. Her bow has gone flat.
tessa: What if I wobble? Live? Forever?
- "Then we wobble together. I'll be right next to you." | e1 | +1 | promise
- "You won't wobble. You're the best spinner in the Tower." | e2
- "Let's change the ending. No spin. Just you." | e3 | +1 | nospin

# e1
tessa confused: Together? You can't even spin. You're a square. A tiny square.
me: Then I'll be the tiniest wobble on stage. Nobody will be looking at you.
tessa laugh: That's the worst plan I've ever heard!
tessa warm: ...I kind of love it.
@goto f

# e2
tessa sweat: Right. Right! The best. Everyone says so.
: She smiles, but her side blocks are shaking.
@goto f

# e3
tessa shock: No spin? But that's my thing!
me: The play is about a piece who's scared of not being enough. You don't need a trick for that part.
tessa think: ...You've been reading that script very closely.
tessa blush: Okay. Maybe. Let's try it.
@goto f

# f
@hide tessa
@title Clear Day
@bg festival
@music dusk
: The broadcast cameras are everywhere, little red lights blinking. Backstage, Tessa holds your one block in both of her side blocks.
@bg stage
@show tessa nervous c
tessa: My entrance is next.
tessa: Hey, {me}. Whatever happens, look amazed. Okay?
: The music swells. She steps into the spotlight.
@ifnot seen wobble
@if nospin still
@if promise together
@goto wobble

# still
: She doesn't spin. She stands in the light, perfectly still, and says her line to the whole Tower.
tessa warm: "I was scared that if I stopped moving, you'd stop seeing me."
: The hall goes quiet. Then, slowly, it fills with the loudest applause you've heard all week.
@goto bows

# together
: Halfway through the spin she wobbles. You shuffle on stage and wobble right next to her, as badly as you can.
: The audience thinks it's choreography. They go wild.
tessa laugh: You're TERRIBLE at this!
@goto bows

# wobble
: Halfway through the spin she wobbles, catches the edge of the stage, and freezes.
: The red lights blink. Somebody at the back laughs.
@show tessa gloom c
tessa: ...
: She finishes the scene. She doesn't look at you once.
@ifaff 3 normal
@goto bad

# bows
@show tessa love c
: At the bows she grabs you and pulls you to the front of the stage.
- Bow together, then turn her once, slowly. Your way. | endt | +1
- Step back and let her have the spotlight. | normal

# endt
@ifaff 4 good
@goto normal

# good
@clear
@bg stars
@show tessa love c
: Later, under the stars, the broadcast is still replaying somewhere. Tessa isn't watching it. She's watching you.
tessa blush: You know what the best part was?
me: The applause?
tessa laugh: No, silly. The part where I wasn't spinning and you were still looking at me.
tessa love: Hey, {me}. Say it again. That weird thing.
me: You'd still be Tessa.
tessa love: Yeah. I would.
@ending good

# normal
@clear
@bg festival
@show tessa happy c
: The festival carries on around you two. Tessa buys you a lantern-shaped candy.
tessa: You were a good partner, newb... {me}.
tessa happy: Next year I'll land the quadruple. You'll see.
@ending normal

# bad
@clear
@bg hall night
: Tessa skips the after-party. The studio light stays on very late.
: Through the door you can hear it. Spin after spin after spin.
@ending bad
`;

  // ---------- Otto: the O-piece who can't rotate ----------
  S.otto = `
# start
@route otto
@title Monday
@bg kitchen
@music date
: The home economics room smells like warm bread. Otto is kneading dough with both bottom blocks.
@show otto happy c
otto: Oh! Hello. Elle said you'd help with props.
otto: I'm making the props. Well. Some of the props are bread.
me: Why is the bread a prop?
otto think: The play has a feast scene. And I thought, if the bread's real, then afterwards everyone gets a snack.
otto blush: Is that silly?
- "That's the best idea anyone's had all week." | a1 | +1
- "Can I help knead?" | a2 | +1
- "A little silly, yeah." | a3

# a1
otto flustered: Oh! Oh, no, it's just bread.
otto warm: ...Thank you, though. Nobody ever says my ideas back to me out loud.
@goto b

# a2
otto happy: You want to? Here. The trick is you push and fold, push and fold.
: You push and fold. Your single block turns out to be very good at this.
otto laugh: A natural! You've got lovely corners.
@goto b

# a3
otto sad: Yes. I suppose it is.
otto: I'm a silly sort of piece.
@goto b

# b
otto: Did you know I'm the only piece that looks the same whichever way you turn me?
otto gloom: Players try to rotate me anyway. They press the button and nothing happens. They always look so disappointed.
otto: Everyone else in the club changes all the time. Tessa spins. Isla can be a wall or a bridge. Zed flips about.
otto sad: I'm just... a box. I'm the same box I was yesterday.
me: Boxes are nice. You can keep things in boxes.
otto confused: ...Huh.
otto happy: I never thought of it like that.
@hide otto
@title Wednesday
@bg park
: Otto asked you to meet him in the park. He's sitting by a little garden plot with a sign that just says OTTO'S.
@show otto nervous c
otto: I have a favour to ask. It's a bit embarrassing.
otto: At the end of the play there's a dance. Everyone turns around together.
otto gloom: And I can't. So Elle put me at the back, holding a lamp.
otto nervous: I want to learn to turn. Even once. Would you teach me?
- "Of course. Let's try right now." | c1 | +1 | lesson
- "You don't need to turn. The lamp is important." | c2
- "Why does it matter so much to you?" | c3 | +1

# c1
otto determined: Right now? Okay. Okay!
: You show him. Step, lean, push. Otto leans. Otto pushes. Otto stays exactly where he is.
@shake
otto sweat: Nothing.
: You try again. And again. On the ninth try he slips on the grass and sits down in his own lettuce.
otto laugh: Oh no. Oh no, my lettuce.
: He's laughing so hard his sprout is shaking. You're laughing too.
me: Hey. What if you don't have to turn? What if the dance turns around you?
otto think: ...Around me?
otto warm: Can we ask Elle? This is the most fun I've ever had failing at something.
@goto d

# c2
otto: The lamp. Yes.
otto sad: I know. I'll just... hold it very well.
@goto d

# c3
otto think: ...Because everyone changes, and then they leave me behind.
otto: Last Clear Day, my best friend got upgraded into a pentomino. Different Bag now.
otto sad: She never came back to the garden.
otto: I thought, maybe if I could change too, people would stay.
me: Otto, I'd stay for the garden. And the bread. And you.
otto flustered: Oh! I. Gosh.
@goto d

# d
@hide otto
@title Thursday
@bg club
@show elle think l
@show otto nervous r
elle: Otto! The feast props. Status report!
otto: Eleven loaves, a cake shaped like the Tower, and a soup.
elle shock: A SOUP? On stage?
otto sweat: It's a very sturdy soup.
elle laugh: Fine! Fine. Genius is genius.
@hide elle
@show otto think c
: When Elle has gone, Otto lowers his voice.
otto: Can I tell you something? Isla wrote me a line in the play. Just one.
otto: "Some things are worth keeping exactly as they are."
otto blush: I've been saying it to my tomatoes all week. For practice.
- "Say it to me." | dw1 | +1
- "The tomatoes must be thrilled." | dw2
- "Isla writes good lines." | dw3

# dw1
otto flustered: To YOU?
otto blush: ...Some things are worth keeping exactly as they are.
: He says it to the floor first. Then, very bravely, to you.
@goto dw

# dw2
otto laugh: They've never looked better!
@goto dw

# dw3
otto: She does. I think she wrote it for me on purpose.
otto happy: People are kinder than I expect, sometimes.
@goto dw

# dw
@hide otto
@title Friday
@bg kitchen dusk
@show otto happy c
: The day before Clear Day. The kitchen is piled with feast bread: twelve loaves, each one a four-block piece.
otto: I made one more. Just for you.
: He slides over a tiny square bun. It's exactly your size.
otto blush: It's a monomino roll. It's the same whichever way you turn it.
otto: Like me.
- "Then it's my favourite shape." | e1 | +2
- "Thanks! I'll save it for after the show." | e2
- Eat it in one bite. | e3 | +1

# e1
otto love: ...
otto flustered: I need to go and check on. The oven. Which is off.
@goto f

# e2
otto happy: Okay! Good idea. It'll keep.
@goto f

# e3
otto shock: You ATE it?
otto laugh: In one bite! Of course in one bite, you're one block!
otto warm: I'll make you another. I'll make you a hundred.
@goto f

# f
@hide otto
@title Clear Day
@bg festival
@music dusk
: The feast scene is a hit. The audience can smell the bread from the back row.
@bg stage
@show otto nervous c
: Then it's the final dance. Everyone turns together. Otto stands at the back with his lamp.
@ifnot lesson still
: You catch his eye. He nods, very slowly, the way you practised.
: Otto does not turn. Instead the whole cast turns around him, so he ends up in the middle, glowing with the lamp.
otto shock: ...
otto warm: Oh. Oh, that's better. That's much better than turning.
- Walk to the middle and stand next to him. | endo | +1
- Wave from your spot in the line. | normal

# still
: The cast turns. Otto stays still at the back, holding his lamp very well. Nobody looks at him.
@ifaff 3 normal
@goto bad

# endo
@ifaff 4 good
@goto normal

# good
@clear
@bg park dusk
@show otto love c
: The next morning there's a new sign in the garden. It says OTTO & {me}.
otto blush: I made the letters out of bread first. The birds ate them.
otto love: I don't want to turn into something else any more. I just want to stay here. With you, if that's okay.
me: That's more than okay.
otto laugh: Good. Because I can't rotate, and I'm not going anywhere.
@ending good

# normal
@clear
@bg kitchen
@show otto happy c
: After the festival, Otto gives everyone a loaf to take home. Yours is shaped like a heart. Probably an accident.
otto: Come by the garden sometime! The tomatoes will be ready soon.
@ending normal

# bad
@clear
@bg kitchen night
: The leftover bread sits on the counter, going stale. Otto went home early.
: In the dark, the oven ticks as it cools, the same as it always has.
@ending bad
`;

  // ---------- Zed: the Z-piece nobody wants in their stack ----------
  S.zed = `
# start
@route zed
@title Monday
@bg hall
@music date
: Zed was supposed to be at club. He wasn't. You find him in the hallway, kicking a locker.
@show zed angry c
zed: What.
me: Elle sent me to find you. I'm your partner for set building.
zed angry: Great. Partnered with a crumb.
zed: Tell Elle I quit. Tell her I quit last week, too.
- "Okay. See you around." | a1
- "You can't quit if you never showed up." | a2 | +1
- "Did that locker do something to you?" | a3 | +1

# a1
zed confused: ...That's it? You're not gonna nag?
zed pout: Tch. Whatever. Go.
: He watches you walk away. You can feel it.
@goto b

# a2
zed shock: ...
zed smug: Ha. Okay. Okay, crumb, you got me there.
@goto b

# a3
zed pout: It's MY locker. It won't open. It's never opened.
: You open it. It opens.
zed flustered: ...You lifted the latch. Who lifts the latch?!
@goto b

# b
zed: Look. Nobody wants a Z in their stack.
zed angry: I land, I leave a hole. Every time. Players groan when they see me in the Next box. I can HEAR them.
zed: So I stay out of the way. Everybody's happier.
: For a second his bandana droops. Then he turns on his heel and stalks off.
@hide zed
@title Tuesday
@bg hall
@show jay nervous l
jay: I saw you talking to Zed yesterday. Are you okay? Did he bite?
me: He's not that bad.
jay: He made the vending machine cry. Allegedly.
@show sasha happy r
sasha: He did not! It was already broken! Hi. I'm Sasha, Zed's sister. The nice one.
jay shock: Oh. Hi. Sorry. About the... allegedly.
sasha laugh: Don't be. He'd love that rumour. He works very hard on being scary.
sasha warm: He's been different since you showed up, you know. He said a whole sentence at dinner.
- "What was the sentence?" | tz1 | +1
- "Different good, or different bad?" | tz2 | +1
- "I don't think I did anything." | tz3

# tz1
sasha smug: "The new crumb isn't completely useless." That's practically a poem, for him.
@goto tz

# tz2
sasha think: Good. Definitely good. He fixed my bike without being asked. He's never done that.
@goto tz

# tz3
sasha: Maybe not. But he noticed you. That's rare.
@goto tz

# tz
sasha: If you want to find him, don't look in the daytime.
: She's gone before you can ask what that means.
@clear
@title Wednesday night
@bg school night
: You stayed late to finish homework. On the way out, there's a light on in the hall. Hammering.
@bg stage
@show zed neutral c
: Zed is up a ladder, fixing the set. It's the lighthouse tower from the play. It's beautiful, and it's almost done.
zed shock: WH...!
@shake
zed angry: Why are you here?! It's nine o'clock!
- "You've been building the whole set? Alone?" | c1 | +1
- "I'm telling Elle you're here. She'll be so happy." | c2
- Pick up a hammer. | c3 | +2 | helped

# c1
zed pout: Somebody had to. Last year's set fell over in the second act.
zed: If I show up in the daytime, everyone gets weird. If I come at night, the set just... gets done.
me: Like a little helper elf.
zed angry: Do NOT call me an elf.
zed blush: ...It is a bit like an elf.
@goto d

# c2
zed angry: Don't you DARE.
zed: If they know it's me, they'll all be nice about it. Fake nice. I'd rather they think it's magic.
@aff -1
@goto d

# c3
zed confused: ...What are you doing.
me: Helping. Where do you want this nail?
zed: You're a monomino. You're shorter than the nail.
: You hammer the nail in. It goes in crooked. Zed stares at it for a long time.
zed laugh: Pfft. HAHA. That's the worst nail I've ever seen.
zed warm: ...Fine. You can hold the boards. Don't touch the hammer.
@goto d

# d
: You work until midnight. Zed talks more with a hammer in his hand than he ever does without one.
zed think: My sister's an S. Sasha. Same shape as me, just flipped.
zed: Players don't groan when they see her. Funny, right? Same exact problem, but she's the nice one.
@hide zed
@title Friday
@bg club
@show sasha happy l
@show zed pout r
sasha: There's the crumb! Did he tell you he won't stop talking about you?
zed angry: I mentioned you ONCE...
sasha laugh: Four times. Over breakfast.
@hide sasha
@show zed flustered c
: Sasha winks and leaves. Zed is redder than usual, which is very red.
zed: She's a liar.
zed nervous: ...Look. After the show on Clear Day, the set gets taken down.
zed: Nobody'll ever know who built it. And that's fine. That's what I want.
- "It's not fine. You should take a bow." | e1 | +1 | bow
- "Then I'll know. That's enough." | e2 | +1
- "If that's what you want." | e3

# e1
zed angry: Take a BOW? In front of everyone? So they can groan?
me: So they can see what you made.
zed think: ...
zed pout: I'll think about it. Don't look at me like that.
@goto f

# e2
zed shock: ...
zed blush: That's so cheesy I'm gonna be sick.
zed warm: ...Okay. That's enough.
@goto f

# e3
zed: Yeah. It is.
: He doesn't sound sure.
@goto f

# f
@hide zed
@title Clear Day
@bg festival
@music dusk
: The lanterns are lit. The whole Tower is watching. Backstage, a rope creaks.
@bg stage
: In the last scene, the lighthouse starts to tip.
@shake
: Everyone freezes. Except you. You know exactly where Zed is.
@if helped save
- Run to the wings and get Zed. | fetch
- Grab the rope yourself. | alone | -1

# save
@show zed shock c
: You're at the rope before anyone else moves, holding the boards just like he taught you. Zed is right behind you with the hammer.
zed determined: Hold it! HOLD IT, crumb!
: Three hits, and the lighthouse stands up straight. In full view of the audience.
@aff 1
@goto after

# fetch
@show zed shock c
: Zed is out of the wings before you reach them. He catches the tower with his whole body and holds it up, in front of everyone.
@goto after

# alone
: You grab the rope. You're one block. The rope wins.
: Zed bursts out of the wings and catches the tower before it falls, but the whole scene's a mess.
@goto after

# after
: The hall is silent. Then somebody says it: "Wait. Did HE build that?"
@show zed nervous c
zed: ...
@ifnot bow hide
: Zed looks at you. You nod. He steps into the spotlight and bows, a very stiff, very awkward, Z-shaped bow.
: The audience roars. Nobody groans. Not one.
- Go out and bow next to him. | endz | +1
- Stay in the wings and let him have it. | normal

# hide
: Zed slips back into the wings before the lights find him. By the bows, he's gone.
@ifaff 3 normal
@goto bad

# endz
@ifaff 4 good
@goto normal

# good
@clear
@bg hall
@show zed blush c
: The next day, Zed is waiting at your locker. He opens it for you. He lifts the latch.
zed pout: Don't make it a thing.
zed blush: The club wants me at practice. In the DAYTIME. Can you believe that?
me: I can.
zed warm: ...Whatever. I'm only going if you're going. You hold the boards. I hold the hammer.
zed love: And maybe after. You and me. Somewhere without a hole in it.
@ending good

# normal
@clear
@bg club
@show zed neutral c
: On Monday there's a note on Elle's desk. It says SET: ZED. Underneath, smaller: AND THE CRUMB.
zed pout: Don't read into it.
@ending normal

# bad
@clear
@bg stage night
: After Clear Day, the set comes down. Nobody ever finds out who built it.
: Sometimes, late at night, you think you hear hammering. But when you look, the hall is dark.
@ending bad
`;

  // ---------- after all four true endings ----------
  S.finale = `
# start
@bg stars
@music dusk
: Four Clear Days. Four endings, every one of them happy.
: You've rehearsed every line with every piece in the club.
@show elle warm c
elle: {me}. Got a minute? I wanted to say thank you.
elle: Four plays, four casts, and you showed up for every single one.
elle think: Most pieces pick one crowd and stick to it. You picked all of us.
elle happy: Everyone in the club adores you. Even Zed, and he'd never say it.
elle: So we made you something. A club should have a style. Something that's ours.
elle love: Here. It makes everything in your Tower a bit more... us.
@unlock
elle: Wear it on your next climb. We'll be cheering from the wings.
elle happy: See you at club!
@ending finale
`;
})(window.SB);
