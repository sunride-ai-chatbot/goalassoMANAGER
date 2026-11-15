# Shared league (designed 2026-11-14, built 2026-11-15)

Several friends in one league of their own: equal money, a team each — name, crest, kit — a squad bought
from the real players, trades between them, a table, and a penalty played manager against manager.

This document is the plan agreed with the owner, the numbers it runs on, and what was built in which order.
All seven steps are built; "Installing it" at the end is what the owner of the Supabase project has to do.

## The rule everything else follows from

Today a network match is simulated on one manager's phone and the result is posted to the room. That is
safe for a friendly, where there is nothing to win. The moment there is money, a squad and a table, the
phone that simulates owns the game: a console is enough to grant yourself ten million or buy a striker
for nothing.

So in a shared league **the server owns the money, the squads and the results**. A phone asks and shows.
This is the opposite of `35b-multiplayer.js` and it is most of the work.

What makes it feasible: `src/js/07-engine.js` (223 lines) touches no DOM — it is arithmetic over two
squads. It runs unchanged wherever we put it.

## How a league runs

- **Size**: friends only, no computer clubs. Everyone plays everyone home and away, so N managers play
  N(N-1) matches over 2(N-1) rounds — four friends: 12 matches, 6 evenings. The room service already
  allows up to 8 members (`capacity between 2 and 8`).
- **A round is an evening.** Everyone connects, every pair plays its match, all matches of a round run at
  the same time (each manager is in exactly one of them). A manager who does not appear by the deadline
  has his match played out without him.
- **Home advantage** is the engine's own (`expGoals`), nothing new.

### A match, minute by minute

1. The server draws a seed nobody sees and runs the engine over the two squads.
2. It returns the minutes and their events. Both phones show them on the live screen — this is the
   playback mode that already exists (`mpPlayback`, `M.playback`, `mpPlaybackStep`).
3. When the engine reaches a penalty it **stops and returns what happened up to then**. Both phones enter
   the real duel — one kicks, one keeps goal — on the commit/reveal channel that אלוף הפנדלים already
   proves (`pcupResolve`, `pcupChannel`): neither can see where the other is going before committing.
4. The duel's outcome goes back to the server, which resumes from that minute.

## The money

Equal at the start, and never enough for a squad of stars — the compromise is the game.

| | |
|---|---|
| Starting budget | 60M |
| Squad | at least 14, at most 22 players |
| Win / draw / loss | 2.5M / 1M / 0.3M |
| Kit: plain / patterned / premium | free / 0.5M / 2M |
| Crest: drawn for you / built by you / premium finish | free / 1M / 2M |
| Training ground, levels 1–5 | 1M, 2M, 4M, 7M, 12M |
| Selling a player back to the pool | 70% of his value |

End of season, paid into the next one: **1st 20M, 2nd 16M, 3rd 12M**, then 40%, 20% of the first prize.

### Why the league does not end at round 4

Prize money is paid at the end, so it cannot snowball inside a season. Within the season the balance is
training: a player improves if his manager works on him.

The owner asked for this to reward time in the app. It is built instead as **three training sessions per
round, the same for everyone**. A manager who shows up gets all three; the skill is in *whom* he spends
them on — the 19-year-old with room to grow, or the midfielder he needs on Thursday. That keeps the
intent (training is what closes the gap) without turning the league into a contest over free time, which
would punish the friend who was at work.

Improvement is bounded: never past the player's potential, and an older player gains less.

## The market

One pool per league: every real player in the game (about 8,000) may belong to **exactly one manager in
that league**. The server keeps the ownership, so two managers cannot buy the same player.

A trade between friends is an offer and an acceptance; the server performs both sides **together or not
at all**, after checking both budgets and that both squads stay legal. Selling back to the pool is always
at a discount — otherwise it is a money printer.

No foreign-player limit here: these are invented clubs, not Israeli ones.

## The team: name, crest, kit, coach

- **Name** is free text, one per league.
- **Crest**: an original generator, drawn as SVG inside the game — four shield shapes, inner divisions
  (halves, quarters, stripes, a sash, a chevron), a colour pair, one emblem from a set drawn for this
  (ball, lion, star, anchor, crown, wing, flame, bridge, wave) and a text ring with the name and a year.
  Free gives a handful of generated options; paying lets the manager choose every part; premium adds
  metal, gold trim and a shine.
  **Real club badges are never downloaded or offered.** They are trademarks, and this is the same rule
  that keeps every real crest out of the game. An original generator is also the better product: endless
  combinations instead of a list, and "build your own" becomes a real choice rather than a longer list.
- **Kit**: a colour pair and a pattern; premium colours (metallics, two-tone) cost more. The engine does
  not care, `matchColors` already moves a clashing away side to its second kit.
- **The coach's face** is optional. It needs care: a photo kept on the phone is invisible to the others,
  and a photo on the server is a face in a database — possibly a young friend's face. The rules for it:
  a private bucket readable only by members of that league, an explicit consent from whoever uploads,
  16 and over only, and deleted with the league. Without that it is not built.

## The season's end

The champion is announced with his coach's picture, his squad with the trophy and confetti
(`recordMoment` already owns trophy moments), and the prize money is carried into the next season.

## Build order

1. **The server** — done, `supabase/migrations/20261114210000_shared_league.sql`. `lg_leagues`, `lg_members`
   (team, crest, kit, budget), `lg_squads` (ownership), `lg_ledger`, `lg_fixtures`, `lg_results`, `lg_offers`,
   `lg_training`, and `lg_pool`. Definer functions behind invoker wrappers, `auth.uid()` checked, every table
   with RLS and no privileges — the shape of `20261024000000_rooms.sql`, tested the same way on PGlite
   (`tests/sql/league-base.sql`, run by `tests/rooms-sql.test.js`).

   Live now: `lg_create`, `lg_join`, `lg_preview_invitation` (the invitation card, for a guest who has not
   signed in), `lg_get`, `lg_set_identity` (a tier is charged once on the way up and never refunded on the way
   down), `lg_buy`, `lg_sell`, `lg_offer`, `lg_respond`. The round, the training and the season's end are the
   later steps and add their own functions over these tables.

   **The price list is the server's.** `lg_pool` holds all 8,171 real players, keyed by the club's Hebrew name
   and the player's English name — the one identity the built game can also compute, since `src/build.py`
   strips `qid`. `scripts/build-league-pool.py` writes `supabase/seed-league-pool.sql` from `data/`; apply it
   with `supabase db push` or `psql -f`, not the SQL editor. An empty pool sells nothing rather than
   everything for free, which is the safe way round.
2. **Lobby and identity** — built (`src/js/35d-crest.js`, `src/js/35e-league.js`, `src/styles/18-league.css`,
   `tests/league-lobby.test.js`). The host opens a league for 2–8 managers and gets a `?league=<invitation>`
   link; the invitation card says who is inviting and whether there is room before anybody signs in. Each
   manager names his club and draws its crest and kit from a generator rather than choosing a real badge:
   real badges are trademarks, and a generator gives endless combinations where a list gives a list. Free
   offers six ready-made crests, custom opens shape, division, emblem and palette, premium adds the metal.
   The client shows the prices; the server charges them, only on a step up, and never refunds a step down,
   so a changed page cannot buy the gold for nothing. No match yet.
3. **The market** — built (`src/js/35g-league-squad.js`). The lists, the search and the faces come from the
   game's own data (`lgCatalog()` in `35f-league-sim.js`: every real player under the key the price list uses),
   so they are instant and in Hebrew; which players are still free is the server's news. Buying sends a key and
   the server answers with the price it charged. `tests/league-sim.test.js` checks that every one of the 8,171
   catalogue prices is the price in the server's list, so "the price shown is the price charged" is a test and
   not a hope. "Build me a squad" (`lg_autofill`) buys sixteen players in a 4-3-3 with weighted shares — a
   striker and a playmaker carry the most, the bench the least — leaves a sixth of the purse in the bank, and at
   the same price prefers a player the game has a photograph of. Trades are an offer and an acceptance.
4. **The round** — built. The server draws the fixtures (everyone plays everyone, home and away) and each
   fixture's seed. Opening a fixture **locks** it (`lg_fixture_lock`): both squads, both line-ups and every
   player's training are written into the fixture as they stand, and that is what both phones simulate — nothing
   bought, sold or trained afterwards reaches the match. The seed is not shown before the lock, or a manager
   could try line-ups against the match he is about to play. `lgSimulate` runs the engine in a throw-away state
   with the seeded generator installed as `Math.random` only while it runs; the recording is then played back on
   the league's own match screen (`35h-league-match.js`). Each phone sends `lg_result`; the match counts when the
   two answers are the same match, and two answers that differ are both thrown away and the fixture is dealt
   again from a new seed. The host closes an evening (or anybody, two days after it began): one answer stands, a
   match nobody opened is 0:0, and a match that was opened and never answered is a 0:3 forfeit for whoever opened
   it — once a fixture is locked its manager's phone knows how it ends, and "look, and leave it if it is a
   defeat" would otherwise turn every loss into a draw.
5. **The penalty duel** — built, and it does not need both managers at the same moment. The recording stops at
   the penalty, each manager chooses one of eight directions, and the choices go to the server (`lg_pen`) and
   come back only when both are in. A manager who is not at the match (not seen at the fixture for nine seconds,
   or silent for twenty) has his direction drawn by the server. When both are in, the server adds a number of its
   own that decides where the ball really goes, so nothing about a penalty can be worked out beforehand from the
   seed. The match is then simply run again from the first minute with one more answered penalty in its log —
   which is also why a match can be reopened on any phone at any time and come out the same.
6. **Training and the table** — built. Three sessions a round on your own players (`lg_train`); a session adds a
   whole rating point to a player of 21 or under, less with age, never past his ceiling, and each level of the
   training ground (`lg_ground`) makes every session worth 15% more. The table is the server's
   (`lg_standings`: points, goal difference, goals scored).
7. **The season's end** — built. When the last round is over the server pays the prizes into the purses and the
   league is `done`; the board shows the champion, the prize list and, for the host, "open a new season"
   (`lg_next_season`): the same managers, the same squads, what the players learned, a clean table.

## What a manager cannot do with a console

- State a price, a balance or a score: none of them is his to send.
- Pay himself or write a result: the helpers that move money and results (`lg_pay`, `lg_fill`, `lg_finalize`,
  `lg_advance`, `lg_make_fixtures`) cannot be executed by a signed-in user at all.
- See the seed before the match is locked, or the other manager's direction before he has chosen his own.
- Work out a penalty in advance: the absent side's direction and the kick's own randomness are drawn by the
  server when they are needed.
- Win by lying about the result: the other phone ran the same match. (Two friends who agree on a score between
  them still can, as the plan always said; an Edge Function running the engine would close that if it ever
  matters.)
- Turn a defeat into a draw by walking away from a match he opened.

## Installing it

Three files, pasted into the Supabase SQL Editor in this order, each with **Run**:

1. `supabase/install-league.sql` — the lobby (already installed on the live project).
2. `supabase/install-league-2.sql` — the season. It may be run again: it replaces the functions and adds only
   what is missing, so a later version is installed the same way.
3. `supabase/install-league-pool.sql` — the price list of all 8,171 real players (255 KB, packed one line of text
   per club so that it pastes). Running it again replaces the list, which is also how prices are refreshed.

`python3 -I scripts/build-league-install.py` and `python3 -I scripts/build-league-pool.py` regenerate 2 and 3.
`tests/rooms-sql.test.js` checks that each installer is its migration and that the packed list is the list;
`tests/league-season.test.js` plays a whole season in two browser windows against exactly these three files on
an in-process Postgres.
