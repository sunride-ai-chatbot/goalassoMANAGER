# Shared sponsorship catalog

`data/sponsors/catalog.json` contains 50 distinct sponsors used by primary shirt sponsorships, secondary commercial contracts and stadium naming. There is no difficulty gate. The future beginner mode uses these same shared functions.

Six preferred brands: Sunride, Friedrich Bauer, Friedrich Bauer HELMETS (a separate advertiser), FastShark, BlackDiamond and Schulz. The remaining 44 invented brands comprise 20 local businesses, 14 regional brands and 10 large brands. Small clubs receive local or preferred partners; preferred partners' prices scale to the club, including small clubs. Offers put preferred partners first, exclude active competing placements, and rotate recent proposals.

User-supplied logo mapping:

| Sponsor | Source |
|---|---|
| Friedrich Bauer | `MIBAG-LOGO.jpg` actually contains the white Friedrich Bauer mark, not a MIBAG mark |
| Friedrich Bauer HELMETS | `FIN LOGO BLACK 00001.jpg`; `HELMET NEW LOGO2x.jpg` is another helmets variant |
| Schulz | `4754A013-C679-4E5C-86EB-E38FCC5F5194.png` |
| FastShark | `FASTSHARK-LOGO.psd` |
| BlackDiamond | `blackdiamond-logo.jpg` |
| Sunride | Original transparent header logo: https://sunride.co.il/wp-content/uploads/2020/05/cropped-SUNRIDE_BIKES_LOGO_FIN.png |

Preferred raster logos were exported as transparent PNGs using background-extraction edits (built-in image tool), then resized for runtime. Sunride's original PNG already had alpha. `LOGO AUTHORISED (30x15cm).tif` is a Sunride reseller variant, not another advertiser. Fictional brands have project-native SVG wordmarks and sector marks. The 50 runtime files live under `assets/sponsors/`; build validates their presence and unique IDs. Logo backgrounds are presentation plates for contrast, not part of the transparent source.

Amounts shown in commercial screens are annual rates. New secondary contracts run 46 game weeks, matching the game's existing sponsor-year accounting; their guaranteed contract total includes the upfront payment, and performance bonuses are separate. Weekly accounting continues internally. Existing signed contracts keep their original amount, duration and payment history. Only old unsigned offers are refreshed. No save-version bump is needed: new fields are optional and missing logos fall back to the legacy name. The separate optional ad-server demo remains an independent feature; the catalog contains career sponsors, not external advertising or tracking.

Tests: `tests/sponsor-catalog.test.js` covers catalog completeness, distinct Bauer identities, preferred offer ordering, local-club eligibility, rotation, unchanged old contracts, once-only advances, annual installment totals and logo changes on contract changes.
