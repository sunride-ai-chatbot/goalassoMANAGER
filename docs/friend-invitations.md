# Existing-career invitations — first networking phase

Implemented: beginner invitation UI, WhatsApp link, authenticated private room, 7-day invitation, atomic join with a chosen capacity of 2–16 clubs, server-side duplicate-club rejection, independent overlapping-player copies, existing roster/budget snapshot preservation. Public preview reveals club and country only. A member can read room summaries; snapshots are not exposed to nonmembers. No secrets in invitation URLs.

Not activated: assets/network-config.json is disabled. The invitation migration is applied to project vllkxhavwcdyceqakvwe (goalasso-manager). Anonymous sign-in remains disabled, so frontend activation is still blocked. This is an invitation/lobby implementation, not a network match or a transfer engine.

Activation on the owner's Supabase project:
1. Migration applied; database grants verified. Project organization: GoalassoManager.
2. Enable anonymous sign-ins for the device-based lobby pilot. Configure abuse protection before public activation. This pilot cannot recover a device session after browser storage is erased; durable account login must precede financial trading.
3. Set assets/network-config.json to enabled:true with the project HTTPS URL and public publishable/anon key. Never include a service-role key.
4. Verify using two browser profiles with different saved clubs: create, share, join, refresh; verify same-club denial and a third guest denial. Test expired invitations and successful joining with overlapping player identities. Check the local career save is unchanged byte-for-byte.

Import boundaries:
- Snapshot is limited to the selected club (including its players and budget), season, round and career ID. It does not reset the career or upload the whole offline world.
- Joining does not yet replace an AI club, transfer ownership of the offline career to the server, start a shared match, or move money/players.
- Legacy local numeric player IDs are not globally unique. networkIdentity is a conservative import-conflict aid; canonical player IDs are required before trades. Different clubs may retain independent copies of the same real player; player instances must be scoped by member and career. Neither copy changes the other. Future trades must reject acquisition or loan of a real identity already in the receiving roster, without blocking room entry.
- Existing independent timelines must remain intact until a deliberate shared-world migration. Offline client snapshots must never be accepted as authoritative money during later trading.

Next phase: durable account/career linking; backup + authoritative shared-world import; deterministic player identity reconciliation; server-owned balances and roster revisions; bilateral offers/counteroffers; atomic acceptance with idempotency; loan wage share and return date on a shared calendar. Both seller and buyer must confirm terms. No bot acceptance for a human-controlled club. Network matches then run from server-owned rosters.


## Completion target requested by the owner
- Private league of 2–16 human clubs, each joining from an existing career.
- Unique club per league; independent copies of the same real player allowed across clubs.
- Shared schedule, results, standings, goals/assists leaders and season progression.
- Server-authoritative matches, lineups and substitutions; reconnect handling.
- Human offers, counteroffers, purchases, sales and loans, with atomic money/roster updates.
- Durable account recovery and a safe transition from offline snapshots before trading.
- WhatsApp links that enter the correct league without resetting saves.

Current scope is lobby only. Increasing capacity is not an implemented league simulation.

Database advisor review: table RLS without policies is intentional deny-all because clients have no direct table privileges. Explicitly exposed SECURITY DEFINER endpoints are narrowly scoped RPCs: create/join/get check auth.uid and membership, preview exposes only club/capacity/expiry to an unguessable invitation holder. Notices reviewed: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy and https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable and https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable .
