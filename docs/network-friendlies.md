# Invitation friendlies (beginner and Pro)

The top bar and career chooser expose “משחק רשת · הזמן חבר” in both entry points. Sign in with email/password, create an invitation, and share it with another manager. Both managers use their existing career and current squad. Two different clubs are required. Confirm new email accounts before signing in. Email delivery and physical iPhone performance have not been verified in this environment.

This is an invitation friendly, not a shared league, player-transfer market, or 3D network match. Squads are frozen when joining. Both managers mark ready; the host runs the existing engine on isolated copies. The result is committed once to the room and both clients can replay the same text broadcast. Local standings, injuries, budgets, and squad ownership are unchanged. Host-generated scores are suitable for friendlies, not competitive rankings.

## Backend prerequisites

The connected deployment uses the existing `mp_rooms` / `mp_members` invitation service and `mp_create_room`, `mp_join_room`, `mp_preview_invitation`, `mp_get_room`, and `mp_validate_snapshot` RPCs. The new `20261024055611_room_friendlies.sql` migration extends that service. It is **not** a clean-install replacement for the historical `20261023120000_multiplayer.sql` league schema: do not apply the old league migration to the live room deployment. A fresh project must provision the invitation-service baseline first. Public configuration lives in `data/config/multiplayer-public.json`; only a publishable key is shipped.

Room members alone can retrieve squad snapshots. Only the host can commit a result, after both members are ready. Results are immutable. Tables have RLS and no direct client access. Authenticated public invoker wrappers call private definer functions with fixed empty search paths. Existing invitation expiration and room capacity rules remain in force.

## Validation

- `tests/network-rooms.test.js`: two client windows, create/join/ready, real engine simulation, identical result, exact preservation of career state and player ID counter.
- `tests/sql/room-friendlies.sql`: transactional test on the connected backend; duplicate club, membership, ready gate, host authority, immutable result, guest visibility, anonymous denial and table privileges. Rolls back synthetic users and rooms.
- `tests/beginner-persistence.test.js`: win and reopen, optional-backup quota failure, primary write failure/retry, corrupted-primary backup recovery, isolation from Pro storage.
- Mobile browser QA at 390×844 for both lineups, 11 operable positions and visible network entry. This is emulation, not a physical iPhone test.

## Beginner saves

Backup failure no longer blocks the primary save. On storage quota exhaustion only the beginner backup is dropped before retrying. Save revisions advance only after successful writes. Failed writes remain retryable with “שמור שוב”. Loading uses a valid backup if the primary is corrupt. Page hide/visibility events save the career even outside a live match. Already missing results cannot be reconstructed if neither stored copy contains them.
