# GOALASSO · מאמן כדורגל

Hebrew (RTL), mobile-first football management game. Single-file web build.

## Layout
- `src/index.html` — document shell (doctype, meta, manifest/icons, markup) with `__CSS__` / `__JS__` placeholders.
- `src/styles/NN-*.css` — stylesheets, concatenated in file-name order. Later files override earlier ones: `07-theme-direction-a.css` is the current theme, `08-cinematic-lineup.css` the lineup screen, `09-phone-readability.css` the mobile overrides.
- `src/js/NN-*.js` — the game, one shared script scope (no ES modules). Load order = numeric prefix: `01-data` → `02-util` → `03-players` → … → `36-views` → `37-live` → `38-boot`. Function declarations are hoisted, so views may call engine code; `const`/`let` must be declared in an earlier file than their first top-level use. Put new code in the file that owns the subject (engine in `07-engine.js`, money in `18-week-flow.js`, screens in `36-views.js`, persistence in `22-save.js`).
- `src/build.py` — `python3 -I src/build.py` → writes `ligat-haal-manager.html` at the repo root (concatenates the modules, embeds data, splash, logo and the portrait manifest). Placeholders `__CLUBS_JSON__`, `__EURO_JSON__`, `__DATA_META__`, `__SPLASH_IMG__`, `__LOGO_IMG__`, `__PLAYER_VISUALS__` are filled by the build.
- `data/*.json` — Israeli club squads; `data/euro/*.json` — European squads.
- `assets/` — media loaded at runtime by relative path (intro/signing videos, lineup stadium, newspaper photos, trophy moments). They must sit next to the built HTML.
- `tests/*.test.js` — jsdom suites (`npm install`, `npm run build`, `npm test`). A suite passes when its last line shows `errors []` / `errs []`. `idb-save.test.js` runs the IndexedDB path on `fake-indexeddb`; `window.ILM.ready` resolves after boot and `window.ILM.whenSaved()` after the pending write.
- Player portraits: `scripts/build-portraits.py` turns the verified source photos (`data/visuals/source-photos/`) into canonical 240×300 transparent WebP cut-outs in `assets/facepacks/` (schema 2) and records each result in `data/visuals/portrait-audit.json`; manual decisions live in `data/visuals/portrait-overrides.json`; `scripts/portrait-report.py` writes `docs/portrait-audit.md`. The game never crops faces at runtime (`portraitGroup` / `cinematicPlayerHTML` in `36-views.js`); anything not `ok` renders the designed club-kit monogram fallback. Never assign a face to a different player, and never match European players to Israeli faces by name.
- `supabase/migrations/` — Phase 2 schema (not applied yet). `.env.example` lists the only public values the client may use.

## Rules
- Keep saves backward compatible: `SAVE_VERSION` + `MIGRATIONS` in `src/js/22-save.js`. Careers persist in IndexedDB (gzip, one record per slot + `backup:N`, career id + revision with compare-and-set); browsers without IndexedDB and the jsdom suites use the legacy localStorage layout. `save()`/`load()`/`installCareer()` return a Promise in IndexedDB mode and a boolean otherwise — wrap with `Promise.resolve(...)` when the outcome matters.
- UI text in natural Hebrew; isolate numbers/Latin with `<bdi>`.
- Never put a Supabase service_role/secret key in the repo or the client.
- Multiplayer is a future phase — do not build it.
- Tests use `window.__ilmNoSplash=1` (skip intro) and `window.__ilmUnlock=1` (all clubs selectable).

## Deploy
- Claude artifact: publish `ligat-haal-manager.html` with every file in `assets/` as supporting files.
- GitHub Pages: `.github/workflows/pages.yml` builds and deploys on push to `main` (enable Pages → Source: GitHub Actions).
