# GOALASSO · מאמן כדורגל

משחק ניהול כדורגל בעברית לליגת העל והליגה הלאומית.

```bash
npm install          # jsdom for the test suites
npm run build        # → ligat-haal-manager.html
npm test             # headless test suites
```

Open `ligat-haal-manager.html` from a folder that also contains the files from `assets/` (the GitHub Pages workflow does this automatically).

See `docs/supabase-setup.md` for the Phase 2 cloud setup.

Source layout: `src/index.html` (shell) + `src/styles/*.css` + `src/js/*.js`, concatenated by `src/build.py` in file-name order into the single output file. Edit the modules, never the built file.
# Penalty Hero standalone release

The dedicated game at `assets/penalties/` is built from
`sunride-ai-chatbot/penalty-hero` commit `b49e6f3e7e65fce82cef2cfb81d0b6898c7938b1`
(version 1.1.5), pinned in `data/config/penalty-hero-release.json` and the Pages workflow.
The workflow runs both games' tests and copies the standalone `dist/` into the final
Pages artifact using `scripts/stage-penalty-hero.mjs`. This replaces the old iframe
at the published URL; the manager's source checkout retains the legacy files for
its internal match/training lifecycle.

`assets/penalty-hero-entry.js`, included by the HTML template, sends the standalone
entry cards, beginner network penalty entry, and old `?pen=CODE` arrivals to the
same-origin game. Invite codes become `?room=CODE`. It saves a current career
before navigating and leaves in-career training and match penalties in their
existing lifecycle. New standalone rooms use protocol v2 and cannot join an
already-running legacy v1 room; create a new invite with the new game.

For local assembled-site QA after building both repositories:

```sh
node scripts/stage-penalty-hero.mjs ../penalty-hero-integration/dist _site
```

The package keeps its own manifest, icons, service worker, catalog, photographed
motion assets and network config within `assets/penalties/`. Change the pinned
commit and version together when adopting a later approved release.
