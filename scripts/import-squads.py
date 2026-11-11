#!/usr/bin/env python3
"""Bring fetched squads into the game data.

Input   <sources>/<key>.json                 written by scripts/fetch-wikidata-squads.py (branch `squad-sources`, folder squads/)
Output  data/euro/<key>.json                 the schema the game reads ({key, name_he, source, fetched, rescaled, players:[…]})
        data/visuals/euro-players.json       every imported player is listed as unresolved ("portrait not fetched yet") until
                                             scripts/import-commons-portraits.py registers his face

The fetcher's value_m is only an estimate, so each squad is rescaled by one factor: the mean rating of its best 14
(the game's euroRating(value, age)) lands on the club's strength + 1, which is where rawSquad() in 04-euro-clubs.js puts a
real squad with no shift. Only the spread inside the squad comes from the estimate.

Usage: python3 scripts/import-squads.py --sources /path/to/squad-sources/squads --clubs brann,nycfc
       python3 scripts/import-squads.py --clubs all --rescale      (re-apply the rule to imported squads) · --check (report only)
       python3 scripts/import-squads.py --sources … --clubs all --merge [--added added.json]   (add players a newer fetch lists)
       python3 scripts/import-squads.py --clubs all --sync-identities   (after --merge, when no portrait import is running)
"""
import argparse, json, math, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOT_YET = 'portrait not fetched yet (squad imported from Wikipedia)'


def euro_rating(v, age, exact=False):
    o = 64 + 3.75 * math.log2(max(v, .05))
    if age is not None:
        o += -4 if age <= 19 else -2 if age <= 21 else -1 if age <= 23 else 1.5 if age >= 33 else .5 if age >= 31 else 0
    return o if exact else max(46, min(93, round(o)))


def club_strength(name_he):
    src = open(os.path.join(ROOT, 'src', 'js', '11-market.js'), encoding='utf8').read()
    m = re.search(r"\['%s','(?:[^'\\]|\\.)*','#[0-9a-fA-F]{6}','#[0-9a-fA-F]{6}',(\d+)[,\]]" % re.escape(name_he.replace("'", "\\'")), src)
    if m:
        return int(m.group(1))
    src2 = open(os.path.join(ROOT, 'src', 'js', '16-leumit-toto-nt.js'), encoding='utf8').read()
    m = re.search(r"name:'%s'[^}]*?str:(\d+)" % re.escape(name_he.replace("'", "\\'")), src2)
    return int(m.group(1)) if m else None


def top14(players, exact=False):
    r = sorted((euro_rating(p['value_m'], p.get('age'), exact) for p in players), reverse=True)[:14]
    return sum(r) / len(r)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--sources'); ap.add_argument('--clubs', required=True); ap.add_argument('--check', action='store_true'); ap.add_argument('--rescale', action='store_true', help='re-apply the strength rule to squads already in data/euro')
    ap.add_argument('--merge', action='store_true', help='add the players a newer fetch lists and the squad in data/euro lacks; nobody is removed')
    ap.add_argument('--sync-identities', action='store_true', help='list every data/euro player that euro-players.json does not know as unresolved')
    ap.add_argument('--added', help='with --merge: write {key: [English names added]} here')
    a = ap.parse_args()
    ep = os.path.join(ROOT, 'data', 'visuals', 'euro-players.json')
    E = json.load(open(ep, encoding='utf8'))
    keys = sorted(f[:-5] for f in os.listdir(os.path.join(ROOT, 'data', 'euro'))) if a.clubs == 'all' else a.clubs.split(',')
    if a.sync_identities:
        known = {(p['key'], p['en']) for p in E['players']} | {(p['key'], p['en']) for p in E['unresolved']}
        n = 0
        for key in keys:
            d = json.load(open(os.path.join(ROOT, 'data', 'euro', key + '.json'), encoding='utf8'))
            for p in d['players']:
                if (key, p.get('en')) not in known:
                    E['unresolved'].append({'key': key, 'club': d['name_he'], 'en': p.get('en'), 'he': p.get('he'), 'qid': p.get('qid'), 'reason': NOT_YET}); n += 1
        # and nobody is listed who left the data
        live = {(k, p.get('en')) for k in keys for p in json.load(open(os.path.join(ROOT, 'data', 'euro', k + '.json'), encoding='utf8'))['players']}
        gone = [p for p in E['unresolved'] if p['key'] in set(keys) and (p['key'], p['en']) not in live]
        E['unresolved'] = [p for p in E['unresolved'] if not (p['key'] in set(keys) and (p['key'], p['en']) not in live)]
        with open(ep, 'w', encoding='utf8') as fh:
            json.dump(E, fh, ensure_ascii=False, indent=1, sort_keys=True)
        print('identities: %d added as unresolved, %d stale entries removed' % (n, len(gone))); return
    if a.merge:
        added = {}
        for key in keys:
            dst, srcp = os.path.join(ROOT, 'data', 'euro', key + '.json'), os.path.join(a.sources, key + '.json')
            if not os.path.isfile(srcp):
                continue
            cur, new = json.load(open(dst, encoding='utf8')), json.load(open(srcp, encoding='utf8'))
            if not cur.get('rescaled'):
                continue   # squads with real market values are maintained by hand
            byname = {p['en']: p for p in cur['players']}
            ratios = sorted(byname[p['en']]['value_m'] / p['value_m'] for p in new['players'] if p['en'] in byname and p['value_m'] > 0)
            if len(ratios) < max(8, len(cur['players']) // 2):
                print(key, 'the new fetch shares only %d of %d players: left alone' % (len(ratios), len(cur['players']))); continue
            f = ratios[len(ratios) // 2]   # the club's rescale factor, read back from the players both lists share
            extra = [p for p in new['players'] if p['en'] not in byname][:max(0, 34 - len(cur['players']))]
            if not extra:
                continue
            for p in extra:
                v = max(.01, p['value_m'] * f)
                cur['players'].append({**{k: p.get(k) for k in ('he', 'en', 'pos', 'age', 'nat', 'qid', 'no')}, 'value_m': round(v, 3 if v < 1 else 2)})
            cur['players'] = [{k: p.get(k) for k in ('he', 'en', 'pos', 'age', 'nat', 'value_m', 'qid', 'no')} for p in cur['players']]
            cur['players'].sort(key=lambda p: (p['pos'] != 'GK', -p['value_m']))
            cur['merged'] = new['fetched']
            with open(dst, 'w', encoding='utf8') as fh:
                json.dump(cur, fh, ensure_ascii=False, indent=0)
            added[key] = [p['en'] for p in extra]
            print(key, '+%d' % len(extra), ', '.join(p['en'] for p in extra))
        if a.added:
            with open(a.added, 'w', encoding='utf8') as fh:
                json.dump(added, fh, ensure_ascii=False, indent=1)
        print('%d players added to %d squads' % (sum(len(v) for v in added.values()), len(added))); return
    for key in keys:
        dst = os.path.join(ROOT, 'data', 'euro', key + '.json')
        if a.check:   # report how far an existing file is from its club's strength
            d = json.load(open(dst, encoding='utf8')); cs = club_strength(d['name_he'])
            print(key, 'strength', cs, 'top-14 mean', round(top14(d['players']), 2)); continue
        d = json.load(open(dst if a.rescale else os.path.join(a.sources, key + '.json'), encoding='utf8'))
        if a.rescale and not d.get('rescaled'):
            continue   # squads with real market values are left alone
        cs = club_strength(d['name_he'])
        if cs is None:
            print(key, 'club not found in the game:', d['name_he']); continue
        for _ in range(3):   # the clamp and the rounding move the mean a little: a few passes settle it
            f = 2 ** ((cs + 1 - top14(d['players'], exact=True)) / 3.75)
            for p in d['players']:
                p['value_m'] = round(max(.01, p['value_m'] * f), 3 if p['value_m'] * f < 1 else 2)
        players = [{k: p.get(k) for k in ('he', 'en', 'pos', 'age', 'nat', 'value_m', 'qid', 'no')} for p in d['players']]
        out = {'key': key, 'name_he': d['name_he'], 'source': d['source'], 'fetched': d['fetched'], 'rescaled': 1, 'players': players}
        with open(dst, 'w', encoding='utf8') as fh:
            json.dump(out, fh, ensure_ascii=False, indent=0)
        if a.rescale:
            print(key, 'strength', cs, 'top-14 mean', round(top14(players), 2)); continue
        # identities: the squad changed, so earlier faces of this key are dropped until the portrait import runs again
        pack = 'eu-' + key
        E['players'] = [p for p in E['players'] if p['key'] != key]
        E['unresolved'] = [p for p in E['unresolved'] if p['key'] != key]
        E['faces'] = {k: v for k, v in E['faces'].items() if v['pack'] != pack}
        E['unresolved'] += [{'key': key, 'club': d['name_he'], 'en': p['en'], 'he': p['he'], 'qid': p['qid'], 'reason': NOT_YET} for p in players]
        print(key, d['name_he'], len(players), 'players · strength', cs, '· top-14 mean', round(top14(players), 2), '· with Wikidata id', sum(1 for p in players if p['qid']))
    if not a.check and not a.rescale:
        with open(ep, 'w', encoding='utf8') as fh:
            json.dump(E, fh, ensure_ascii=False, indent=1, sort_keys=True)


if __name__ == '__main__':
    main()
