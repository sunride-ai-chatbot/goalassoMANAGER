# GOALASSO START — first playable release

`beginner.html` is built separately from the Pro entry. The shared source provides club/player construction, verified portrait identities and packs, sponsor catalogue, lineups and minute-by-minute match simulation. `src/beginner/` owns the simplified interface and career orchestration; the Pro boot and weekly workflow do not run in this entry.

## Included
- All existing club definitions selectable, including large European clubs.
- Isolated `goalasso.beginner.v1` career with backup and stale-tab detection; no Pro save migration or overwrite.
- Full squads and the same portrait identities/credits as Pro, including after transfers.
- Simplified market: same-country clubs, five large European countries, explicitly fictional free agents. Seven suggested candidates per club, full squad name search.
- Offers, seller counteroffers, simple season-long loans, first-year costs and cash reserve checks.
- Three team-training focuses; no individual training, scouting or academy workflow/costs.
- Shared 50-brand catalogue; three fixed-income beginner offers and annual presentation.
- Stadium construction, operating costs and demand independent of capacity upgrades.
- Both lineups, shared match simulation, ledger and end-season summary.

## Deliberate initial limits
This is an explicitly labelled training competition using the country clubs present in the repository, not a complete official competition calendar. The beginner annual salary convention is 52 times the underlying weekly salary; the amount is distributed across the training season rounds. Existing Pro contracts are unchanged. Beginner signings renew automatically at the same salary; loans return at season end. No cloud saves, multiple career slots, live match animation, manual lineup editing, multiple-citizenship filter or highlighted suggestions in this first beginner entry. No Pro annual-display overhaul is included. Free agents are labelled fictional because the source does not supply verified real free agents.

## Validation
`tests/beginner.test.js` checks selectable large clubs, real portrait identity availability, isolated Pro storage, sponsor choice, shared match engine, ledger and save/reload. Mobile Chromium inspection checks layout width, image loading and runtime errors. Existing Pro test suites remain applicable.

The world-market test's core-price assertion was corrected: the existing formula discounts for contract length and cash need, so a universal 2.5x floor was not its actual contract. The test still checks a price premium, refusal of market value and acceptance of the requested price.
