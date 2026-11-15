#!/usr/bin/env python3
"""Bring a senior squad up to date from the federation's registered list: real ages, and the players the game lacks.

    python3 -I scripts/merge-registered-squad.py --club l_kfar_saba --pdf <sheet.pdf> [--alias "FED NAME=GAME NAME"] [--dry]
    python3 -I scripts/merge-registered-squad.py --club l_kfar_saba --list <names.txt>     # one "name|MM/YYYY|nationality" per line

The squads of the second tier come from Wikipedia (import-squads.py), which seldom knows a player's age — a whole
squad stood at 25 — and lags behind the registrations. The federation's page for a club lists every registered
player with his month and year of birth and his nationality. This reads such a list (the text of a sheet somebody
made of that page, or a plain list) and:

  * gives each player the game already has his real age (and his nationality where the list says otherwise);
  * adds the registered players the game does not have. The list has no positions and no values, so for the added
    players those two are the game's own — positions dealt toward a normal squad shape, values under the squad's
    weakest so the club's strength does not move — and the file says so (`registered.generated`);
  * removes nobody (the same rule as `import-squads.py --merge`): a player the list no longer has may be in
    somebody's career or squad.

Only the text is read. **Photographs on such a sheet are never used**: they are the federation's registration
pictures — not freely licensed, taken for a player card and not for a game — which is the rule for every squad
that comes from there (see "Federation photos are not used" in CLAUDE.md). Only the age is kept, not the date.

A name is matched exactly, then without middle names, then by a surname only one player of the squad carries;
spellings differ between the two sources (matres lectionis, a transliterated first name), and anything else needs
--alias. The report lists every match so a wrong one can be seen. Afterwards: scripts/build-league-pool.py.
"""
import argparse
import datetime
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAT = {'ישראל': 'Israel', 'חוף השנהב': "Côte d'Ivoire", 'גאנה': 'Ghana', 'ניגריה': 'Nigeria', 'קמרון': 'Cameroon', 'סנגל': 'Senegal',
       'מאלי': 'Mali', 'גינאה': 'Guinea', 'גמביה': 'Gambia', 'ליבריה': 'Liberia', 'זמביה': 'Zambia', 'קונגו': 'Congo', 'ברזיל': 'Brazil',
       'ארגנטינה': 'Argentina', 'קולומביה': 'Colombia', 'צרפת': 'France', 'פורטוגל': 'Portugal', 'ספרד': 'Spain', 'סרביה': 'Serbia',
       'קרואטיה': 'Croatia', 'אוקראינה': 'Ukraine', 'רוסיה': 'Russia', 'גאורגיה': 'Georgia', 'ארצות הברית': 'United States'}
SHAPE = (('GK', .12), ('DF', .32), ('MF', .32), ('FW', .24))      # the squad shape import-ifa-rosters.py deals to


def h(*parts):
    return int(hashlib.sha256('|'.join(str(p) for p in parts).encode('utf8')).hexdigest()[:12], 16)


def norm(tok):
    """A name token as both sources would spell it: no geresh or hyphen, no matres lectionis."""
    return re.sub('[אויה]', '', re.sub(r"['׳\"״\-־]", '', tok)) or tok


def tokens(name):
    return [norm(t) for t in name.split()]


def from_pdf(path):
    try:
        from pypdf import PdfReader
    except ImportError:
        sys.exit('pypdf is needed to read a PDF (pip install pypdf), or pass --list')
    text = '\n'.join((p.extract_text() or '') for p in PdfReader(path).pages)
    return re.findall(r'^([^\n:]+)\nתאריך לידה:\s*(\d{2})/(\d{4})\s*\nאזרחות\s+([^\n]+)$', text, re.M)


def from_list(path):
    out = []
    for line in open(path, encoding='utf8'):
        if line.strip():
            name, born, nat = [x.strip() for x in line.split('|')]
            out.append((name, born.split('/')[0], born.split('/')[1], nat))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--club', required=True, help='file key in data/euro, e.g. l_kfar_saba')
    ap.add_argument('--pdf')
    ap.add_argument('--list')
    ap.add_argument('--alias', action='append', default=[], help='"name on the list=name in the game"')
    ap.add_argument('--date', default=datetime.date.today().isoformat())
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()
    rows = from_pdf(a.pdf) if a.pdf else from_list(a.list)
    if not rows:
        sys.exit('no players read')
    today = datetime.date.fromisoformat(a.date)
    path = os.path.join(ROOT, 'data', 'euro', a.club + '.json')
    d = json.loads(open(path, encoding='utf8').read())
    players = d['players']
    alias = dict(x.split('=', 1) for x in a.alias)
    by_name = {p['he']: p for p in players}
    last = {}
    for p in players:
        last.setdefault(tokens(p['he'])[-1], []).append(p)
    taken, added, report = set(), [], []
    for name, mm, yyyy, nat_he in rows:
        name, nat_he = name.strip(), nat_he.strip()
        age = today.year - int(yyyy) - (1 if int(mm) > today.month else 0)
        assert 14 <= age <= 45, 'impossible age for %s: %s' % (name, age)
        t = tokens(name)
        hit = by_name.get(alias.get(name, name))
        how = 'alias' if name in alias else 'same'
        if not hit:                                                   # without middle names
            c = [p for p in players if tokens(p['he'])[0] == t[0] and tokens(p['he'])[-1] == t[-1]]
            hit, how = (c[0], 'first + last') if len(c) == 1 else (None, how)
        if not hit:                                                   # a surname only one player here carries, in either word order
            c = [ps[0] for k, ps in last.items() if len(ps) == 1 and k in t and len(k) > 2]
            hit, how = (c[0], 'surname') if len(c) == 1 else (None, how)
        nat = NAT.get(nat_he)
        if hit:
            assert id(hit) not in taken, 'two players of the list match %s' % hit['he']
            taken.add(id(hit))
            report.append('  %-22s = %-18s (%s)  age %s -> %s%s' % (name, hit['he'], how, hit.get('age'), age,
                                                                   '' if not nat or nat == hit.get('nat') else '  nat %s -> %s' % (hit.get('nat'), nat)))
            hit['age'] = age
            if nat:
                hit['nat'] = nat
        else:
            assert nat, 'unknown nationality "%s" for %s: add it to NAT (the foreign-player limit depends on it)' % (nat_he, name)
            added.append({'he': name, 'en': name, 'pos': None, 'age': age, 'nat': nat, 'value_m': None, 'qid': None, 'no': None})
    # positions for the added players: toward the normal shape of a squad of the final size, largest gap first
    have = {k: sum(1 for p in players if p['pos'] == k) for k, _ in SHAPE}
    total = len(players) + len(added)
    floor = min(p['value_m'] for p in players)
    for p in sorted(added, key=lambda p: h('pos', a.club, p['he'])):
        p['pos'] = max(SHAPE, key=lambda s: s[1] * total - have[s[0]])[0]
        have[p['pos']] += 1
        p['value_m'] = round(floor * (.62 + .3 * (h('val', a.club, p['he']) % 1000) / 1000), 3)
    print('%s: %d on the list, %d matched, %d added, %d of the game not on the list' % (d['name_he'], len(rows), len(taken), len(added), len(players) - len(taken)))
    print('\n'.join(report))
    for p in added:
        print('  + %-22s %s  age %s  %s  value %s' % (p['he'], p['pos'], p['age'], p['nat'], p['value_m']))
    for p in players:
        if id(p) not in taken:
            print('  ? %-22s not on the list, kept' % p['he'])
    if a.dry:
        return
    reg = d.get('registered') or {}
    d['registered'] = {'source': 'football.org.il registered squad, season 2026/27', 'date': a.date,
                       'added': sorted(set(reg.get('added', [])) | {p['he'] for p in added}), 'generated': ['pos', 'value_m']}
    d['players'] = players + added
    with open(path, 'w', encoding='utf8') as fh:
        json.dump(d, fh, ensure_ascii=False, indent=0)
    print('wrote', os.path.relpath(path, ROOT), len(d['players']), 'players')


if __name__ == '__main__':
    main()
