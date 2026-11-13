# Invitation friendlies (beginner and Pro)

The top bar and career chooser expose “משחק רשת · הזמן חבר” in both entry points. Sign in with email/password, create an invitation, and share it with another manager. Both managers use their existing career and current squad. Two different clubs are required. Confirm new email accounts before signing in. Email delivery and physical iPhone performance have not been verified in this environment.

This is an invitation friendly, not a shared league, player-transfer market, or 3D network match. Squads are frozen when joining. Both managers mark ready; the host runs the existing engine on isolated copies. The result is committed once to the room and both clients can replay the same text broadcast. Local standings, injuries, budgets, and squad ownership are unchanged. Host-generated scores are suitable for friendlies, not competitive rankings.

## Backend prerequisites

The connected deployment uses the existing `mp_rooms` / `mp_members` invitation service and `mp_create_room`, `mp_join_room`, `mp_preview_invitation`, `mp_get_room`, and `mp_validate_snapshot` RPCs. The new `20261024055611_room_friendlies.sql` migration extends that service. It is **not** a clean-install replacement for the historical `20261023120000_multiplayer.sql` league schema: do not apply the old league migration to the live room deployment. A fresh project must provision the invitation-service baseline first. Public configuration lives in `data/config/multiplayer-public.json`; only a publishable key is shipped.

Room members alone can retrieve squad snapshots. Only the host can commit a result, after both members are ready. Results are immutable. Tables have RLS and no direct client access. Authenticated public invoker wrappers call private definer functions with fixed empty search paths. Existing invitation expiration and room capacity rules remain in force.

### A fresh project (2026-11-13)

The first deployment's project no longer exists, and its base room objects (`mp_rooms`, the room `mp_members`, `mp_create_room`, `mp_join_room`, `mp_preview_invitation`, `mp_get_room`, `mp_validate_snapshot`) had lived only in its database. They are restored as `supabase/migrations/20261024000000_rooms.sql`, written from what the client calls and what the friendlies migration and its SQL regression expect. For a new project:

1. Paste `supabase/install-rooms.sql` (the base rooms and the friendlies migrations in order, nothing else) into the SQL Editor and run it once. Do not run `20261023120000_multiplayer.sql` there: the historical league schema defines another `public.mp_members`.
2. Authentication → Sign In / Providers: Email enabled (the dialog signs up and signs in with email + password; with "Confirm email" on, a new manager must open the confirmation email first, and the built-in mail sender allows only a few emails an hour).
3. Authentication → URL Configuration: Site URL = the address the game is played at, and that address with `/**` under Redirect URLs (the confirmation link returns to the game, `emailRedirectTo`), for every address the game is served from.
4. The Project URL and the publishable key go into `data/config/multiplayer-public.json` (or the Pages secrets `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`). Never the secret key.

אלוף הפנדלים online needs none of this: it uses Realtime broadcast channels only, so it works as soon as the URL and the publishable key are in the build.

Rooms: an invitation is a random uuid of its own (not the room id) and lives seven days; a manager joins once and his squad stays as he joined with it (a second call with the same career returns the room, another career is `different_career`); one club name per room (`club_taken`); `room_full` beyond the capacity; a host keeps at most twenty rooms, expired ones are removed when he creates the next. `mp_preview_invitation` is the only function a visitor without an account may call, and it returns the inviting club's name and whether the room is full.

## Validation

- `tests/rooms-sql.test.js`: both room migrations applied to an empty Postgres in the test process (PGlite, dressed with Supabase's roles, `auth.uid()` and default privileges), then `tests/sql/rooms-base.sql` and `tests/sql/room-friendlies.sql`; also checks that `supabase/install-rooms.sql` is exactly the two migrations.

- `tests/network-rooms.test.js`: two client windows, create/join/ready, real engine simulation, identical result, exact preservation of career state and player ID counter.
- `tests/sql/room-friendlies.sql`: transactional test on the connected backend; duplicate club, membership, ready gate, host authority, immutable result, guest visibility, anonymous denial and table privileges. Rolls back synthetic users and rooms.
- `tests/beginner-persistence.test.js`: win and reopen, optional-backup quota failure, primary write failure/retry, corrupted-primary backup recovery, isolation from Pro storage.
- Mobile browser QA at 390×844 for both lineups, 11 operable positions and visible network entry. This is emulation, not a physical iPhone test.

## Beginner saves

Backup failure no longer blocks the primary save. On storage quota exhaustion only the beginner backup is dropped before retrying. Save revisions advance only after successful writes. Failed writes remain retryable with “שמור שוב”. Loading uses a valid backup if the primary is corrupt. Page hide/visibility events save the career even outside a live match. Already missing results cannot be reconstructed if neither stored copy contains them.

## Invitation arrival and recovery (2026-10-24)

Opening `?invite=<uuid>` now opens the invitation dialog after local career loading, without a splash or a new-career action. The dialog previews the inviting club and shows the loaded club, league points and games before authentication. It checks the other mode's stored career metadata and offers a link carrying the invitation to that mode. These reads do not load the host's squad into the guest's career. Legacy `?join=` links no longer clear an already-loaded Pro career.

No email is sent by opening an invitation. The signup UI translates `over_email_send_rate_limit`, retains the invitation and career, and prevents repeated signup submissions for a local one-minute cooldown while keeping sign-in available. This is not a server quota reset: actual email registration still requires a working mail service / custom SMTP configuration in Supabase. Do not disable email verification or auto-confirm real users to bypass that configuration.

Career data is local to each browser and mode; network authentication is not cloud career synchronization. If an invitation opens inside another app's browser, copy it and open it in the browser containing the existing career. The app cannot inspect or recover another browser's local storage.

`tests/network-arrival.test.js` covers both modes with saved careers, a wrong-mode invitation, fresh-browser handling, legacy-link preservation, no automatic signup, and rate-limit behavior across reopening.
