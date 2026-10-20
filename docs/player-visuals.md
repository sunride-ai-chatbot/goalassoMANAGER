# Player portraits

The 14 Israeli roster files contain 388 entries, mapped to 385 distinct public player profiles. Each entry has a reviewed identity; reused identities deliberately use the same photograph.

## Coverage

| Club | Roster records | Mapped |
| --- | ---: | ---: |
| בית"ר ירושלים | 30 | 30 |
| בני סכנין | 27 | 27 |
| הפועל באר שבע | 27 | 27 |
| הפועל חיפה | 26 | 26 |
| הפועל ירושלים | 27 | 27 |
| הפועל פתח תקווה | 27 | 27 |
| הפועל רמת גן | 27 | 27 |
| הפועל תל אביב | 25 | 25 |
| עירוני קריית שמונה | 28 | 28 |
| עירוני טבריה | 25 | 25 |
| מכבי חיפה | 32 | 32 |
| מכבי נתניה | 29 | 29 |
| מכבי פתח תקווה | 24 | 24 |
| מכבי תל אביב | 34 | 34 |

## Rendering

- Identity is `visualId`, independent of current club, rating, player ID, position, or sponsor.
- New source players receive it on creation. Existing saves resolve verified real names or the original roster ID/name pair. Generated players explicitly use `null`, preventing name collisions.
- Source photographs are preserved byte-for-byte in 14 on-demand JSON packs. Only the packs required by the visible players are loaded and cached; transfers can load a player’s original pack.
- The source manifest records the profile URL, image URL, original dimensions, face framing, and SHA-256. Production uses the smaller identity/frame map, not remote image servers.
- SVG composition supplies the current kit colours, goalkeeper kit, and active sponsorship contract. The same source face is reused in lineup, bench, squad, player cards, and live substitution controls.
- This is a photographic 2.5D presentation, not individual 3D head meshes. Source resolution varies; Ori Shnaper uses the public Sport5 player portrait because the IFA image was unavailable.
- No photo pack is stored in career saves. Loading failures preserve playable controls and allow retries.

## Asset maintenance

1. Verify any name/profile changes against the linked official profile, including transliteration and full names. Do not match people from image similarity.
2. `scripts/collect-player-visuals.py` and `collect-additional-portraits.py` collect explicitly linked official roster records (BeautifulSoup required only for collection).
3. `scripts/prepare-player-visuals.py MAPPING BOUNDS` records reviewed framing without changing the photographs; `pack-player-visuals.py` bundles their original bytes.
4. Run `npm run build` and `npm test`. `portraits.test.js` checks complete mapping, source-byte hashes, generated-name collisions, legacy recovery, actual transfers, save/load, lazy loading, caching, and offline handling.
5. Pages copies both legacy root media and the nested `assets/` tree. Keep both paths available.
