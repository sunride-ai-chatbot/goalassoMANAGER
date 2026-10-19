# GOALASSO · מאמן כדורגל

Hebrew (RTL), mobile-first football management game. Single-file web build.

## Layout
- `src/game.html` — the whole game (HTML + CSS + JS). Placeholders `__CLUBS_JSON__`, `__EURO_JSON__`, `__DATA_META__`, `__SPLASH_IMG__`, `__LOGO_IMG__` are filled by the build.
- `src/build.py` — `python3 -I src/build.py` → writes `ligat-haal-manager.html` at the repo root (embeds data, splash and logo).
- `data/*.json` — Israeli club squads; `data/euro/*.json` — European squads.
- `assets/` — media loaded at runtime by relative path (intro/signing videos, lineup stadium, newspaper photos, trophy moments). They must sit next to the built HTML.
- `tests/*.test.js` — jsdom suites (`npm install`, `npm run build`, `npm test`). A suite passes when its last line shows `errors []` / `errs []`.
- `supabase/migrations/` — Phase 2 schema (not applied yet). `.env.example` lists the only public values the client may use.

## Rules
- Keep saves backward compatible: `SAVE_VERSION` + `MIGRATIONS` in `game.html`.
- UI text in natural Hebrew; isolate numbers/Latin with `<bdi>`.
- Never put a Supabase service_role/secret key in the repo or the client.
- Multiplayer is a future phase — do not build it.
- Tests use `window.__ilmNoSplash=1` (skip intro) and `window.__ilmUnlock=1` (all clubs selectable).

## Deploy
- Claude artifact: publish `ligat-haal-manager.html` with every file in `assets/` as supporting files.
- GitHub Pages: `.github/workflows/pages.yml` builds and deploys on push to `main` (enable Pages → Source: GitHub Actions).
