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
