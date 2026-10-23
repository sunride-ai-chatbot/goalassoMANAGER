# Existing-career invitations — first networking phase

Implemented: beginner invitation UI, WhatsApp link, authenticated private room, 7-day invitation, atomic two-member join, server-side duplicate-club rejection, overlap rejection, existing roster/budget snapshot preservation. Public preview reveals club and country only. A member can read room summaries; snapshots are not exposed to nonmembers. No secrets in invitation URLs.

Not activated: assets/network-config.json is disabled. No remote database migration was applied. This is an invitation/lobby implementation, not a network match or a transfer engine.

Activation on the owner's Supabase project:
1. Apply supabase/migrations/20261023000000_friend_invitations.sql (auth.users/auth.uid are supplied by Supabase).
2. Enable anonymous sign-ins for the device-based lobby pilot. Configure abuse protection before public activation. This pilot cannot recover a device session after browser storage is erased; durable account login must precede financial trading.
3. Set assets/network-config.json to enabled:true with the project HTTPS URL and public publishable/anon key. Never include a service-role key.
4. Verify using two browser profiles with different saved clubs: create, share, join, refresh; verify same-club denial and a third guest denial. Test expired invitations and roster overlap. Check the local career save is unchanged byte-for-byte.

Import boundaries:
- Snapshot is limited to the selected club (including its players and budget), season, round and career ID. It does not reset the career or upload the whole offline world.
- Joining does not yet replace an AI club, transfer ownership of the offline career to the server, start a shared match, or move money/players.
- Legacy local numeric player IDs are not globally unique. networkIdentity is a conservative import-conflict aid; canonical player IDs are required before trades. Different clubs with the same real player cause a conflict, never automatic deletion.
- Existing independent timelines must remain intact until a deliberate shared-world migration. Offline client snapshots must never be accepted as authoritative money during later trading.

Next phase: durable account/career linking; backup + authoritative shared-world import; deterministic player identity reconciliation; server-owned balances and roster revisions; bilateral offers/counteroffers; atomic acceptance with idempotency; loan wage share and return date on a shared calendar. Both seller and buyer must confirm terms. No bot acceptance for a human-controlled club. Network matches then run from server-owned rosters.
