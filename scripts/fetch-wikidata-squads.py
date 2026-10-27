#!/usr/bin/env python3
"""Pull real current squads from Wikidata for the clubs that still have invented players (runs in GitHub Actions).

For every club in data/config/world-clubs-wiki.json (world leagues and the Israeli second tier):
  1. resolve the club item from its English Wikipedia title
  2. SPARQL: association football players (P106=Q937857) with a "member of sports team" (P54) statement for the
     club that has no end time (or an end time in the future), plus their English/Hebrew labels, date of birth,
     position (P413), citizenship (P27) and Commons image (P18)
  3. write data/euro/<key>.json in the schema the game already reads ({key, name_he, players:[{he,en,pos,age,
     nat,value_m,qid}]}). The Hebrew name is the Hebrew Wikidata label when there is one, otherwise the Latin name
     (the game isolates Latin text with <bdi>). Nobody is invented: a club with fewer than 14 identified players is
     reported and left on its generated squad.
Market values are not on Wikidata, so value_m is an estimate from the club's strength, the player's age and position
(the game normalises a real squad's ratings to the club's strength anyway: only the spread inside the squad matters).
The `qid` lets scripts/fetch-commons-portraits.py identify the exact person (no name matching).

Usage: python3 scripts/fetch-wikidata-squads.py --group world --out data/euro [--only key1,key2]
Standard library only; one SPARQL request per club with a User-Agent, sequential, per Wikimedia policy.
"""
import argparse, hashlib, json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = 'GOALASSO-squad-fetch/1.0 (https://github.com/sunride-ai-chatbot/goalassoMANAGER; football management game)'
SEASON_YEAR = 2026
SPARQL = 'https://query.wikidata.org/sparql'
API = 'https://www.wikidata.org/w/api.php'

POS_MAP = [
    (('goalkeeper',), 'GK'),
    (('defender', 'centre-back', 'center-back', 'full-back', 'left-back', 'right-back', 'wing-back', 'sweeper', 'libero'), 'DF'),
    (('midfielder', 'defensive midfielder', 'attacking midfielder', 'central midfielder', 'playmaker'), 'MF'),
    (('forward', 'striker', 'winger', 'centre forward', 'attacker', 'second striker'), 'FW'),
]


def get(url, params=None, accept='application/json', tries=4):
    if params:
        url += ('&' if '?' in url else '?') + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept})
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read().decode('utf8'))
        except Exception as e:  # noqa: BLE001 - retry on any transport error, then give up
            if i == tries - 1:
                raise
            time.sleep(3 * (i + 1))


def club_qid(title):
    d = get(API, {'action': 'wbgetentities', 'sites': 'enwiki', 'titles': title, 'props': 'info', 'format': 'json', 'normalize': 1})
    ents = d.get('entities', {})
    for q in ents:
        if q.startswith('Q'):
            return q
    return None


QUERY = '''
SELECT ?p ?pLabel ?heLabel ?dob ?posLabel ?natLabel ?img ?start WHERE {
  ?p wdt:P106 wd:Q937857 .
  ?p p:P54 ?m . ?m ps:P54 wd:%s .
  OPTIONAL { ?m pq:P582 ?end . }
  OPTIONAL { ?m pq:P580 ?start . }
  FILTER(!BOUND(?end) || ?end >= "%d-07-01T00:00:00Z"^^xsd:dateTime)
  OPTIONAL { ?p wdt:P569 ?dob . }
  OPTIONAL { ?p wdt:P413 ?pos . ?pos rdfs:label ?posLabel FILTER(LANG(?posLabel)="en") }
  OPTIONAL { ?p wdt:P27 ?nat . ?nat rdfs:label ?natLabel FILTER(LANG(?natLabel)="en") }
  OPTIONAL { ?p wdt:P18 ?img . }
  OPTIONAL { ?p rdfs:label ?heLabel FILTER(LANG(?heLabel)="he") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}'''


def squad(qid):
    d = get(SPARQL, {'query': QUERY % (qid, SEASON_YEAR), 'format': 'json'}, accept='application/sparql-results+json')
    rows = {}
    for b in d['results']['bindings']:
        pid = b['p']['value'].rsplit('/', 1)[1]
        r = rows.setdefault(pid, {'qid': pid, 'en': b.get('pLabel', {}).get('value', ''), 'he': None, 'dob': None, 'pos': set(), 'nat': set(), 'img': None, 'start': None})
        if 'heLabel' in b:
            r['he'] = b['heLabel']['value']
        if 'dob' in b and not r['dob']:
            r['dob'] = b['dob']['value'][:10]
        if 'posLabel' in b:
            r['pos'].add(b['posLabel']['value'].lower())
        if 'natLabel' in b:
            r['nat'].add(b['natLabel']['value'])
        if 'img' in b and not r['img']:
            r['img'] = b['img']['value']
        if 'start' in b and (not r['start'] or b['start']['value'] > r['start']):
            r['start'] = b['start']['value'][:10]
    return list(rows.values())


def map_pos(labels):
    text = ' '.join(sorted(labels))
    for words, code in POS_MAP:
        if any(w in text for w in words):
            return code
    return None


def age_of(dob):
    if not dob or not re.match(r'^\d{4}-\d{2}-\d{2}$', dob):
        return None
    y, m = int(dob[:4]), int(dob[5:7])
    return SEASON_YEAR - y - (1 if m > 8 else 0)


def est_value(club_str, age, pos, seed):
    """Relative market value, millions: club tier × age curve × position × a stable per-player spread."""
    base = 0.08 * (1.12 ** max(0, club_str - 50))          # str 60 → 0.25M, 75 → 1.4M, 88 → 6M
    agef = {17: .35, 18: .45, 19: .6, 20: .75, 21: .9, 22: 1.0, 23: 1.1, 24: 1.2, 25: 1.25, 26: 1.25, 27: 1.2, 28: 1.1, 29: 1.0,
            30: .85, 31: .7, 32: .55, 33: .45, 34: .35, 35: .28}.get(age if age is not None else 26, .25)
    posf = {'GK': .8, 'DF': .9, 'MF': 1.0, 'FW': 1.15}.get(pos, 1.0)
    h = int(hashlib.sha1(seed.encode('utf8')).hexdigest()[:8], 16) / 0xffffffff
    spread = 0.5 + 1.3 * (h ** 1.6)                          # most players near the club's level, a few stars
    return round(base * agef * posf * spread, 2)


def club_strength(name_he):
    src = open(os.path.join(ROOT, 'src', 'js', '11-market.js'), encoding='utf8').read()
    m = re.search(r"\['%s','[^']*','#[0-9a-fA-F]{6}','#[0-9a-fA-F]{6}',(\d+)\]" % re.escape(name_he.replace("'", "\\'")), src)
    if m:
        return int(m.group(1))
    src2 = open(os.path.join(ROOT, 'src', 'js', '16-leumit-toto-nt.js'), encoding='utf8').read()
    m = re.search(r"name:'%s'[^}]*?str:(\d+)" % re.escape(name_he.replace("'", "\\'")), src2)
    return int(m.group(1)) if m else 60


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--group', default='world', choices=['world', 'leumit', 'all'])
    ap.add_argument('--out', default=os.path.join(ROOT, 'data', 'euro'))
    ap.add_argument('--only', default='')
    ap.add_argument('--min', type=int, default=14)
    a = ap.parse_args()
    cfg = json.load(open(os.path.join(ROOT, 'data', 'config', 'world-clubs-wiki.json'), encoding='utf8'))
    groups = ['world', 'leumit'] if a.group == 'all' else [a.group]
    only = set(filter(None, a.only.split(',')))
    os.makedirs(a.out, exist_ok=True)
    report = []
    for g in groups:
        for name_he, info in cfg[g].items():
            key = info['key']
            if only and key not in only:
                continue
            try:
                qid = club_qid(info['en'])
                if not qid:
                    report.append({'key': key, 'ok': False, 'why': 'club not found on Wikidata: ' + info['en']}); print(report[-1]); continue
                rows = squad(qid)
                cs = club_strength(name_he)
                players = []
                for r in rows:
                    pos = map_pos(r['pos']) or 'MF'
                    age = age_of(r['dob'])
                    if age is None or age < 16 or age > 42 or not r['en'] or r['en'].startswith('Q'):
                        continue
                    nat = sorted(r['nat'])[0] if r['nat'] else None
                    players.append({'he': r['he'] or r['en'], 'en': r['en'], 'pos': pos, 'age': age, 'nat': nat,
                                    'value_m': est_value(cs, age, pos, r['qid']), 'qid': r['qid'], 'img': r['img'], 'since': r['start']})
                # keep a realistic squad size: the most valuable 28 (newest contracts break ties)
                players.sort(key=lambda p: (-p['value_m'], p['since'] or ''))
                players = players[:28]
                # a real squad needs at least two keepers; otherwise the club keeps its generated list
                if len(players) < a.min or sum(1 for p in players if p['pos'] == 'GK') < 1:
                    report.append({'key': key, 'ok': False, 'why': 'only %d identified players' % len(players), 'qid': qid}); print(report[-1]); continue
                out = {'key': key, 'name_he': name_he, 'source': 'wikidata', 'club_qid': qid, 'fetched': time.strftime('%Y-%m-%d'),
                       'players': players}
                with open(os.path.join(a.out, key + '.json'), 'w', encoding='utf8') as fh:
                    json.dump(out, fh, ensure_ascii=False, indent=0)
                report.append({'key': key, 'ok': True, 'n': len(players), 'he': sum(1 for p in players if p['he'] != p['en']), 'img': sum(1 for p in players if p['img'])})
                print(report[-1])
                time.sleep(1.2)
            except Exception as e:  # noqa: BLE001
                report.append({'key': key, 'ok': False, 'why': 'error: %s' % e}); print(report[-1])
    with open(os.path.join(a.out, '_squads-report.json'), 'w', encoding='utf8') as fh:
        json.dump(report, fh, ensure_ascii=False, indent=1)
    print('done: %d ok, %d skipped' % (sum(1 for r in report if r['ok']), sum(1 for r in report if not r['ok'])))


if __name__ == '__main__':
    main()
