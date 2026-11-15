#!/usr/bin/env python3
"""Write supabase/install-league-2.sql: the season migration as one file for the SQL Editor.

The owner of the project installs the shared league by pasting files into Supabase's SQL Editor, so each
migration has a twin there with a header that says what it is and what comes next, and a schema reload at the
end so PostgREST answers for the new functions at once. tests/rooms-sql.test.js checks that the twin is the
migration, so what is pasted is what was tested.

    python3 -I scripts/build-league-install.py
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'supabase', 'migrations', '20261115120000_shared_league_season.sql')
OUT = os.path.join(ROOT, 'supabase', 'install-league-2.sql')
HEAD = '''-- GOALASSO · ליגה משותפת — the season: fixtures, matches, penalties, training, the table and the prizes.
-- Paste the whole file into the SQL Editor and press Run, AFTER install-league.sql.
-- It is supabase/migrations/20261115120000_shared_league_season.sql plus a schema reload at the end.
--
-- Then paste install-league-pool.sql the same way: that one is the price list of all the real players, and
-- without it nobody can buy anybody (an empty pool sells nothing — it does not sell everything for free).
--
-- This file may be run again: it replaces the functions and adds only what is missing, so a later version of
-- it is installed the same way.

'''
FOOT = "\n-- tell PostgREST to re-read the schema, so the new functions answer immediately\nnotify pgrst, 'reload schema';\n"

with open(SRC, encoding='utf8') as f:
    body = f.read()
with open(OUT, 'w', encoding='utf8') as f:
    f.write(HEAD + body + FOOT)
print(f'{os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT) // 1024} KB)')
