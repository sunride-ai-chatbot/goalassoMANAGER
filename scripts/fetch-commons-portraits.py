#!/usr/bin/env python3
"""Find freely licensed portraits of the real European squads on Wikimedia Commons (runs in GitHub Actions).

For every player in data/euro/<club>.json:
  1. identify the person on Wikidata: an association football player (P106=Q937857) whose name matches and who
     either played for this club (P54 contains the club item) or, when no candidate has that, whose birth year
     matches the squad age; ambiguous results are rejected, never guessed
  2. collect candidate images: the item's P18 image first, then files from its Commons category (P373)
  3. keep only files hosted on Commons whose licence is CC0, public domain, CC BY or CC BY-SA (any version);
     record author, licence, licence URL, attribution text and restrictions (e.g. personality rights)
  4. download a 640px-wide rendition of each kept candidate
Output: <out>/<club>/<n>-<qid>-<k>.jpg and <out>/<club>/manifest.json (one entry per player, with all candidates
and the identification evidence). The offline pipeline (scripts/build-portraits.py) then picks the first candidate
that yields a clean, complete head.

Usage: python3 scripts/fetch-commons-portraits.py --clubs liverpool,arsenal --out portrait-sources/euro
--width sets the rendition width (640 default; use a larger one to retry players whose face was too small).
Only the Python standard library is used. Requests are sequential and identified by a User-Agent, per Wikimedia policy.
"""
import argparse, html, json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = 'GOALASSO-portrait-fetch/1.0 (https://github.com/sunride-ai-chatbot/goalassoMANAGER; football management game)'
FOOTBALLER = 'Q937857'
SEASON_YEAR = 2026
WIDTH = 640
CLUB_TITLES = {
    'ajax': 'AFC Ajax', 'arsenal': 'Arsenal F.C.', 'atletico': 'Atlético Madrid', 'barcelona': 'FC Barcelona',
    'bayern': 'FC Bayern Munich', 'benfica': 'S.L. Benfica', 'bodo_glimt': 'FK Bodø/Glimt', 'brugge': 'Club Brugge KV',
    'celtic': 'Celtic F.C.', 'chelsea': 'Chelsea F.C.', 'copenhagen': 'F.C. Copenhagen', 'dinamo_zagreb': 'GNK Dinamo Zagreb',
    'dortmund': 'Borussia Dortmund', 'fenerbahce': 'Fenerbahçe S.K. (football)', 'ferencvaros': 'Ferencvárosi TC',
    'feyenoord': 'Feyenoord', 'galatasaray': 'Galatasaray S.K. (football)', 'inter': 'Inter Milan', 'juventus': 'Juventus FC',
    'leverkusen': 'Bayer 04 Leverkusen', 'liverpool': 'Liverpool F.C.', 'ludogorets': 'PFC Ludogorets Razgrad',
    'man_city': 'Manchester City F.C.', 'man_utd': 'Manchester United F.C.', 'milan': 'AC Milan', 'monaco': 'AS Monaco FC',
    'napoli': 'SSC Napoli', 'olympiacos': 'Olympiacos F.C.', 'porto': 'FC Porto', 'psg': 'Paris Saint-Germain FC',
    'psv': 'PSV Eindhoven', 'rangers': 'Rangers F.C.', 'real_madrid': 'Real Madrid CF', 'red_star': 'Red Star Belgrade',
    'salzburg': 'FC Red Bull Salzburg', 'shakhtar': 'FC Shakhtar Donetsk', 'slavia_prague': 'SK Slavia Prague',
    'sparta_prague': 'AC Sparta Prague', 'sporting': 'Sporting CP', 'tottenham': 'Tottenham Hotspur F.C.', 'young_boys': 'BSC Young Boys',
}
OK_LICENSE = re.compile(r'^(cc0|cc[- ]zero|public domain|pd\b|pd-|cc[- ]by(-sa)?[- ]\d(\.\d)?|cc[- ]by(-sa)?$|attribution$)', re.I)

def get(url, params=None, raw=False, tries=4):
    if params:
        url += '?' + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            time.sleep(0.15)
            return data if raw else json.loads(data)
        except Exception as e:
            if i == tries - 1:
                raise
            time.sleep(2 * (i + 1))

def wd(params):
    return get('https://www.wikidata.org/w/api.php', {**params, 'format': 'json'})

def commons(params):
    return get('https://commons.wikimedia.org/w/api.php', {**params, 'format': 'json'})

def club_qid(key):
    r = get('https://en.wikipedia.org/w/api.php', {'action': 'query', 'titles': CLUB_TITLES[key], 'prop': 'pageprops', 'redirects': 1, 'format': 'json'})
    for p in r['query']['pages'].values():
        if 'pageprops' in p and 'wikibase_item' in p['pageprops']:
            return p['pageprops']['wikibase_item']
    raise SystemExit('club not found on Wikipedia: ' + key)

def clean_name(n):
    n = re.sub(r'\s*\([^)]*\)', '', n or '').strip()
    return re.sub(r'\s+', ' ', n)

def norm(s):
    import unicodedata
    s = unicodedata.normalize('NFKD', s or '')
    return re.sub(r'[^a-z ]', '', ''.join(c for c in s if not unicodedata.combining(c)).lower()).strip()

def claim_ids(ent, prop):
    out = []
    for c in ent.get('claims', {}).get(prop, []):
        v = c.get('mainsnak', {}).get('datavalue', {}).get('value')
        if isinstance(v, dict) and 'id' in v:
            out.append(v['id'])
        elif isinstance(v, str):
            out.append(v)
    return out

def birth_year(ent):
    for c in ent.get('claims', {}).get('P569', []):
        v = c.get('mainsnak', {}).get('datavalue', {}).get('value', {})
        m = re.match(r'[+-](\d{4})', v.get('time', ''))
        if m:
            return int(m.group(1))
    return None

def images(ent):
    cl = ent.get('claims', {}).get('P18', [])
    cl = sorted(cl, key=lambda c: {'preferred': 0, 'normal': 1}.get(c.get('rank'), 2))
    return [c['mainsnak']['datavalue']['value'] for c in cl if c.get('rank') != 'deprecated' and c.get('mainsnak', {}).get('datavalue')]

def candidates_for(name):
    ids = []
    for q in dict.fromkeys([name, clean_name(name)]):
        r = wd({'action': 'wbsearchentities', 'search': q, 'language': 'en', 'type': 'item', 'limit': 12})
        ids += [x['id'] for x in r.get('search', [])]
    # Wikipedia full-text search finds players whose label differs (e.g. nicknames)
    r = get('https://en.wikipedia.org/w/api.php', {'action': 'query', 'list': 'search', 'srsearch': clean_name(name) + ' footballer', 'srlimit': 5, 'format': 'json'})
    titles = [x['title'] for x in r.get('query', {}).get('search', [])]
    if titles:
        r = get('https://en.wikipedia.org/w/api.php', {'action': 'query', 'titles': '|'.join(titles), 'prop': 'pageprops', 'redirects': 1, 'format': 'json'})
        ids += [p['pageprops']['wikibase_item'] for p in r['query']['pages'].values() if p.get('pageprops', {}).get('wikibase_item')]
    ids = list(dict.fromkeys(ids))[:25]
    if not ids:
        return []
    ents = {}
    for i in range(0, len(ids), 50):
        r = wd({'action': 'wbgetentities', 'ids': '|'.join(ids[i:i + 50]), 'props': 'claims|labels|aliases|sitelinks', 'languages': 'en'})
        ents.update(r.get('entities', {}))
    return [e for e in ents.values() if FOOTBALLER in claim_ids(e, 'P106')]

def name_matches(ent, name):
    want = norm(clean_name(name))
    names = [ent.get('labels', {}).get('en', {}).get('value', '')] + [a['value'] for a in ent.get('aliases', {}).get('en', [])]
    have = {norm(n) for n in names if n}
    if want in have:
        return True
    # "Alisson" vs "Alisson Becker": every word of the squad name present in a label/alias
    w = set(want.split())
    return any(w and w <= set(h.split()) for h in have)

def identify(player, club_q):
    name = player.get('en') or ''
    if not name:
        return None, 'no_english_name'
    found = candidates_for(name)
    cands = [e for e in found if name_matches(e, name)]
    if not cands:
        seen = ', '.join(f"{e['id']}:{e.get('labels', {}).get('en', {}).get('value', '?')}" for e in found[:6])
        return None, 'no_wikidata_footballer_with_this_name' + (f' (footballers found: {seen})' if seen else '')
    age = player.get('age')
    years = {SEASON_YEAR - age, SEASON_YEAR - age - 1} if age else set()
    team = [e for e in cands if club_q in claim_ids(e, 'P54')]
    if len(team) == 1:
        return team[0], 'name+club'
    if len(team) > 1:
        both = [e for e in team if birth_year(e) in years]
        if len(both) == 1:
            return both[0], 'name+club+birth_year'
        return None, 'ambiguous_same_club: ' + ', '.join(e['id'] for e in team)
    born = [e for e in cands if birth_year(e) in years]
    if len(born) == 1:
        return born[0], 'name+birth_year (club not yet on Wikidata)'
    return None, 'ambiguous: ' + ', '.join(f"{e['id']}:{birth_year(e)}" for e in cands[:6])

def strip_html(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s or '')).strip()

def file_info(titles):
    r = commons({'action': 'query', 'titles': '|'.join(titles), 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata|mime', 'iiurlwidth': WIDTH})
    out = {}
    norm_map = {n['to']: n['from'] for n in r.get('query', {}).get('normalized', [])}
    for p in r.get('query', {}).get('pages', {}).values():
        if 'imageinfo' not in p:
            continue
        ii = p['imageinfo'][0]; md = ii.get('extmetadata', {})
        g = lambda k: (md.get(k) or {}).get('value', '')
        out[p['title']] = {'title': p['title'], 'page': ii.get('descriptionurl'), 'thumb': ii.get('thumburl'), 'mime': ii.get('mime'),
                           'width': ii.get('width'), 'height': ii.get('height'), 'license': strip_html(g('LicenseShortName')),
                           'licenseUrl': g('LicenseUrl'), 'author': strip_html(g('Artist')), 'credit': strip_html(g('Credit')),
                           'attributionRequired': g('AttributionRequired'), 'usageTerms': strip_html(g('UsageTerms')),
                           'restrictions': g('Restrictions'), 'nonFree': g('NonFree'), 'date': strip_html(g('DateTimeOriginal'))[:40]}
    return out

def category_files(cat, limit=8):
    r = commons({'action': 'query', 'list': 'categorymembers', 'cmtitle': 'Category:' + cat, 'cmtype': 'file', 'cmlimit': limit})
    return [m['title'] for m in r.get('query', {}).get('categorymembers', []) if re.search(r'\.(jpe?g|png|webp)$', m['title'], re.I)]

def licence_ok(i):
    if i.get('nonFree') in ('true', True):
        return False
    if i.get('mime') not in ('image/jpeg', 'image/png', 'image/webp'):
        return False
    return bool(OK_LICENSE.match(i.get('license', '').strip()))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--clubs', required=True); ap.add_argument('--out', required=True); ap.add_argument('--max-candidates', type=int, default=5); ap.add_argument('--width', type=int, default=640); ap.add_argument('--players', default='')
    a = ap.parse_args()
    global WIDTH; WIDTH = a.width
    only = {x.strip() for x in a.players.split('|') if x.strip()}
    keys = list(CLUB_TITLES) if a.clubs == 'all' else a.clubs.split(',')
    for key in keys:
        with open(os.path.join(ROOT, 'data', 'euro', key + '.json'), encoding='utf8') as fh:
            squad = json.load(fh)
        cq = club_qid(key)
        outdir = os.path.join(a.out, key); os.makedirs(outdir, exist_ok=True)
        manifest = {'club': key, 'clubName': squad.get('name_he'), 'clubQid': cq, 'players': []}
        for n, p in enumerate(squad.get('players', [])):
            if only and p.get('en') not in only:
                continue
            entry = {'he': p.get('he'), 'en': p.get('en'), 'pos': p.get('pos'), 'age': p.get('age'), 'candidates': []}
            try:
                ent, why = identify(p, cq)
                entry['match'] = why
                if ent:
                    qid = ent['id']; entry['qid'] = qid
                    entry['wikidata'] = 'https://www.wikidata.org/wiki/' + qid
                    entry['label'] = ent.get('labels', {}).get('en', {}).get('value')
                    entry['birthYear'] = birth_year(ent)
                    titles = ['File:' + t for t in images(ent)]
                    for cat in claim_ids(ent, 'P373')[:1]:
                        titles += [t for t in category_files(cat) if t not in titles]
                    infos = file_info(titles[:12]) if titles else {}
                    k = 0
                    for t in titles:
                        i = infos.get(t)
                        if not i:
                            continue
                        if not licence_ok(i):
                            entry.setdefault('rejectedFiles', []).append({'title': t, 'license': i.get('license')})
                            continue
                        fn = f'{n:02d}-{qid}-{k}' + ('' if WIDTH == 640 else f'-w{WIDTH}') + '.jpg'
                        data = get(i['thumb'], raw=True)
                        with open(os.path.join(outdir, fn), 'wb') as fh:
                            fh.write(data)
                        entry['candidates'].append({**i, 'file': fn, 'fromP18': t in ['File:' + x for x in images(ent)]})
                        k += 1
                        if k >= a.max_candidates:
                            break
            except Exception as e:
                entry['error'] = str(e)[:200]
            manifest['players'].append(entry)
            print(key, p.get('en'), entry.get('match'), entry.get('qid'), len(entry['candidates']), flush=True)
        mp = os.path.join(outdir, 'manifest.json')
        if only and os.path.isfile(mp):
            # partial run: merge into the existing manifest (players not listed keep their entries)
            with open(mp, encoding='utf8') as fh:
                old = json.load(fh)
            new = {e['en']: e for e in manifest['players']}
            manifest['players'] = [new.get(e['en'], e) for e in old['players']]
        with open(mp, 'w', encoding='utf8') as fh:
            json.dump(manifest, fh, ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main()
