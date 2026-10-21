# GOALASSO · מאמן כדורגל

Hebrew (RTL), mobile-first football management game. Single-file web build.

## Layout
- `src/index.html` — document shell (doctype, meta, manifest/icons, markup) with `__CSS__` / `__JS__` placeholders.
- `src/styles/NN-*.css` — stylesheets, concatenated in file-name order. Later files override earlier ones: `07-theme-direction-a.css` is the current theme, `08-cinematic-lineup.css` the lineup screen, `09-phone-readability.css` the mobile overrides.
- `src/js/NN-*.js` — the game, one shared script scope (no ES modules). Load order = numeric prefix: `01-data` → `02-util` → `03-players` → … → `36-views` → `37-live` → `38-boot`. Function declarations are hoisted, so views may call engine code; `const`/`let` must be declared in an earlier file than their first top-level use. Put new code in the file that owns the subject (engine in `07-engine.js`, money in `18-week-flow.js`, screens in `36-views.js`, persistence in `22-save.js`).
- `src/build.py` — `python3 -I src/build.py` → writes `ligat-haal-manager.html` at the repo root (concatenates the modules, embeds data, splash, logo and the portrait manifest). Placeholders `__CLUBS_JSON__`, `__EURO_JSON__`, `__DATA_META__`, `__SPLASH_IMG__`, `__LOGO_IMG__`, `__PLAYER_VISUALS__` are filled by the build.
- `data/*.json` — Israeli club squads; `data/euro/*.json` — European squads.
- `assets/` — media loaded at runtime by relative path (intro/signing videos, lineup stadium, newspaper photos, trophy moments). They must sit next to the built HTML.
- `tests/*.test.js` — jsdom suites (`npm install`, `npm run build`, `npm test`). A suite passes when its last line shows `errors []` / `errs []`.
- `supabase/migrations/` — Phase 2 schema (not applied yet). `.env.example` lists the only public values the client may use.

## Rules
- Keep saves backward compatible: `SAVE_VERSION` + `MIGRATIONS` in `src/js/22-save.js`.
- UI text in natural Hebrew; isolate numbers/Latin with `<bdi>`.
- Never put a Supabase service_role/secret key in the repo or the client.
- Multiplayer is a future phase — do not build it.
- Tests use `window.__ilmNoSplash=1` (skip intro) and `window.__ilmUnlock=1` (all clubs selectable).

## Deploy
- Claude artifact: publish `ligat-haal-manager.html` with every file in `assets/` as supporting files.
- GitHub Pages: `.github/workflows/pages.yml` builds and deploys on push to `main` (enable Pages → Source: GitHub Actions).
