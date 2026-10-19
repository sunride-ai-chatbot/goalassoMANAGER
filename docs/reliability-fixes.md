# Career reliability fixes

This patch preserves the existing single-player game and does not activate email authentication or Supabase.

## Persistence

- Save failures show a persistent Hebrew warning with retry and recovery actions.
- Each slot retains one previous valid snapshot (`<slot-key>_backup`). Keeping backups increases local storage usage; quota failures preserve the primary save and report failure.
- Imports require confirmation and pass schema/version checks and migration before replacing disk state. Failed validation/migration restores the prior in-memory career and ID counter.
- Migration errors stop loading rather than marking incomplete migrations as current.
- Cloud imports use the same validation and persistence path. The legacy Claude cloud adapter remains Claude-only.

## Matches and transfers

- Live state is saved at simulation-minute boundaries, tactical changes, substitutions, pause, and page backgrounding. Restored matches open paused, retaining scores, squads, events, halftime choices, and penalty decisions.
- Fixtures are not rerun when restoring a match. Full-time presentation does not reroll already prepared penalties or repeat cup awards.
- Substitution commands reject unavailable, already-used, or already-playing substitutes and nonexistent outgoing players.
- Incoming bids revalidate expiry, transfer window, ownership, squad limits, and domestic buyer funds immediately before mutation.
- Quick sales select only solvent domestic buyers; unavailable buyers do not remove players.

## Validation and deployment

`npm run build && npm test` runs the existing smoke suites plus assertion-based reliability regressions. Cloud round-trip and duplicate settlement tests now assert their intended results. The runner checks error reports throughout output and unhandled jsdom exceptions, and propagates nonzero exits.

PRs run tests. Pages deployment also requires passing tests before uploading the site artifact.

These are headless regression tests, not proof of visual rendering or real iPhone performance. Supabase SQL has not been applied and real email delivery has not been configured or tested.
