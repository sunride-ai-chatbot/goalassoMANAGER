# Shared league (designed 2026-11-14, not yet built)

Several friends in one league of their own: equal money, a team each — name, crest, kit — a squad bought
from the real players, trades between them, a table, and a penalty played manager against manager.

This document is the plan agreed with the owner, the numbers to start from, and the order of the build.
Nothing here is implemented yet.

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
2. **Lobby and identity**: create and join by invitation (the anonymous session already works), name,
   crest generator, kit. No match yet.
3. **The market**: buy from the pool, sell back, offer a trade, accept. All server-side.
4. **The round**: fixtures, both phones simulate from the server's seed and both submit the result; the
   server accepts it only if the two agree. This blocks a manager cheating on his own; two friends could
   still agree on a score between themselves, which an Edge Function running the engine would close
   later if it ever matters.
5. **The penalty duel inside a league match**, on the existing channel.
6. **Training**, three a round, and the table.
7. **The season's end**: champion, trophy, prize money, a new season with the same managers.

Steps 1–3 are a league you can build a team in. Step 4 is the first evening that counts.
