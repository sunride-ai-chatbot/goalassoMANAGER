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
CAT_LIMIT = 0
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

DEEP = False

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

def club_title(key):
    if key in CLUB_TITLES:
        return CLUB_TITLES[key]
    cfg = json.load(open(os.path.join(ROOT, 'data', 'config', 'world-clubs-wiki.json'), encoding='utf8'))
    for grp, clubs in cfg.items():
        if not isinstance(clubs, dict):
            continue
        for info in clubs.values():
            if info['key'] == key:
                return info['en']
    raise SystemExit('no Wikipedia title for club ' + key)

def club_qid(key):
    r = get('https://en.wikipedia.org/w/api.php', {'action': 'query', 'titles': club_title(key), 'prop': 'pageprops', 'redirects': 1, 'format': 'json'})
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
        r = wd({'action': 'wbgetentities', 'ids': '|'.join(ids[i:i + 50]), 'props': 'claims|labels|aliases|sitelinks', 'languages': 'en|mul'})
        ents.update(r.get('entities', {}))
    uniq = {e['id']: e for e in ents.values() if 'id' in e}   # ids that redirect to one item come back twice
    return [e for e in uniq.values() if FOOTBALLER in claim_ids(e, 'P106')]

def ent_names(ent):
    out = [ent.get('labels', {}).get(l, {}).get('value', '') for l in ('en', 'mul')]
    out += [a['value'] for l in ('en', 'mul') for a in ent.get('aliases', {}).get(l, [])]
    t = ent.get('sitelinks', {}).get('enwiki', {}).get('title', '')
    if t:
        out.append(re.sub(r'\s*\([^)]*\)$', '', t))   # "Rodrigo Mendoza (footballer)" → "Rodrigo Mendoza"
    return [n for n in out if n]

def label(ent):
    n = ent_names(ent)
    return n[0] if n else '?'

def name_matches(ent, name):
    want = norm(clean_name(name))
    names = ent_names(ent)
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
    # squads fetched from Wikipedia carry the exact Wikidata item: no name matching at all
    if player.get('qid'):
        r = wd({'action': 'wbgetentities', 'ids': player['qid'], 'props': 'claims|labels|aliases|sitelinks', 'languages': 'en|mul'})
        ent = (r.get('entities') or {}).get(player['qid'])
        if ent and 'missing' not in ent:
            return ent, 'squad_qid'
        return None, 'qid_missing'
    found = candidates_for(name)
    cands = [e for e in found if name_matches(e, name)]
    age = player.get('age')
    years = {SEASON_YEAR - age, SEASON_YEAR - age - 1} if age else set()
    if not cands:
        # nickname vs full name (Rodri/Rodrigo, Álex/Alejandro): same surname AND this club AND the birth year
        sur = norm(clean_name(name)).split()[-1:] 
        strong = [e for e in found if sur and any(norm(n).split()[-1:] == sur for n in ent_names(e))
                  and club_q in claim_ids(e, 'P54') and birth_year(e) in years]
        if len(strong) == 1:
            return strong[0], 'surname+club+birth_year'
        seen = ', '.join(f"{e['id']}:{label(e)}" for e in found[:6])
        return None, 'no_wikidata_footballer_with_this_name' + (f' (footballers found: {seen})' if seen else '')
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
        out[p['title']] = {'title': p['title'], 'pageid': p.get('pageid'), 'page': ii.get('descriptionurl'), 'thumb': ii.get('thumburl'), 'mime': ii.get('mime'),
                           'width': ii.get('width'), 'height': ii.get('height'), 'license': strip_html(g('LicenseShortName')),
                           'licenseUrl': g('LicenseUrl'), 'author': strip_html(g('Artist')), 'credit': strip_html(g('Credit')),
                           'attributionRequired': g('AttributionRequired'), 'usageTerms': strip_html(g('UsageTerms')),
                           'restrictions': g('Restrictions'), 'nonFree': g('NonFree'), 'date': strip_html(g('DateTimeOriginal'))[:40]}
    return out

def category_files(cat, limit=8):
    limit = CAT_LIMIT or limit
    r = commons({'action': 'query', 'list': 'categorymembers', 'cmtitle': 'Category:' + cat, 'cmtype': 'file', 'cmlimit': limit})
    return [m['title'] for m in r.get('query', {}).get('categorymembers', []) if re.search(r'\.(jpe?g|png|webp)$', m['title'], re.I)]

def subcat_files(cat, limit=4):
    # one level of sub-categories ("Hugo Ekitiké in 2025", "… with Liverpool F.C.")
    r = commons({'action': 'query', 'list': 'categorymembers', 'cmtitle': 'Category:' + cat, 'cmtype': 'subcat', 'cmlimit': limit})
    out = []
    for m in r.get('query', {}).get('categorymembers', []):
        out += category_files(m['title'].split(':', 1)[1], 10)
    return out

def search_files(name, limit=20):
    # full-text search of the File namespace; import keeps only files whose title names the player
    r = commons({'action': 'query', 'list': 'search', 'srsearch': '"' + name + '"', 'srnamespace': 6, 'srlimit': limit})
    return [m['title'] for m in r.get('query', {}).get('search', []) if re.search(r'\.(jpe?g|png|webp)$', m['title'], re.I)]

def depicts(pageids):
    """Structured data of Commons files: which Wikidata items each file is said to depict (P180)."""
    out = {}
    ids = [str(x) for x in pageids if x]
    for i in range(0, len(ids), 50):
        r = commons({'action': 'wbgetentities', 'ids': '|'.join('M' + x for x in ids[i:i + 50]), 'props': 'claims'})
        for mid, ent in (r.get('entities') or {}).items():
            st = ent.get('statements') or ent.get('claims') or {}
            if isinstance(st, list):
                st = {}
            out[mid[1:]] = [c['mainsnak']['datavalue']['value']['id'] for c in st.get('P180', [])
                            if c.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id')]
    return out

GROUP_WORDS = re.compile(r'\b(vs?\.?|versus|team|squad|celebrat\w*|line-?up|training|match|game|fans|stadium|trophy|parade|group|starting|bench|warm-?up)\b|[-–—] ?\d+ ?[-–—]| \d+[-:]\d+ ', re.I)
PORTRAIT_WORDS = re.compile(r'\b(portrait|headshot|head shot|cropped|crop|interview|press conference|presentation|presentaci[oó]n|mugshot|face|close-?up)\b', re.I)

def portrait_score(info, qid, names, dep):
    """How likely a file is a usable portrait of this one player; used to choose which files are worth downloading."""
    t = info['title']; sc = 0.0
    d = dep.get(str(info.get('pageid'))) or []
    if d == [qid]:
        sc += 6
    elif qid in d:
        sc += 2 if len(d) <= 2 else 0
    elif d:
        sc -= 3                                    # the file says it shows somebody else
    tn = norm(t)
    if any(n and n in tn for n in names):
        sc += 3
    if PORTRAIT_WORDS.search(t):
        sc += 2
    if GROUP_WORDS.search(t):
        sc -= 3
    w, h = info.get('width') or 0, info.get('height') or 0
    if w and h:
        r = w / h
        sc += 2 if r < .95 else 0 if r < 1.35 else -2
        if min(w, h) < 300:
            sc -= 4
    return sc

def he_norm(s):
    s = re.sub(r'\s*\([^)]*\)', '', s or '')
    return re.sub(r'\s+', ' ', re.sub(r'["\'׳״`־-]', ' ', s)).strip()

def identify_hebrew(player, club_q):
    """A squad that names its players in Hebrew (the second tier): the Hebrew label, alias or article title must be the
    name and the Wikidata item must list this club among the player's teams. The squad ages of these clubs are not
    reliable, so there is no birth-year fallback: no club on the item, no match."""
    name = he_norm(player.get('he') or player.get('en') or '')
    if not name:
        return None, 'no_name'
    ids = [x['id'] for x in wd({'action': 'wbsearchentities', 'search': name, 'language': 'he', 'uselang': 'he', 'type': 'item', 'limit': 12}).get('search', [])]
    r = get('https://he.wikipedia.org/w/api.php', {'action': 'query', 'list': 'search', 'srsearch': '"' + name + '" כדורגלן', 'srlimit': 5, 'format': 'json'})
    titles = [x['title'] for x in r.get('query', {}).get('search', [])]
    if titles:
        r = get('https://he.wikipedia.org/w/api.php', {'action': 'query', 'titles': '|'.join(titles), 'prop': 'pageprops', 'redirects': 1, 'format': 'json'})
        ids += [p['pageprops']['wikibase_item'] for p in r['query']['pages'].values() if p.get('pageprops', {}).get('wikibase_item')]
    ids = list(dict.fromkeys(ids))[:25]
    if not ids:
        return None, 'no_wikidata_footballer_with_this_name'
    ents = wd({'action': 'wbgetentities', 'ids': '|'.join(ids), 'props': 'claims|labels|aliases|sitelinks', 'languages': 'he|en|mul'}).get('entities', {})
    def he_names(e):
        out = [e.get('labels', {}).get('he', {}).get('value', '')] + [a['value'] for a in e.get('aliases', {}).get('he', [])]
        out.append(e.get('sitelinks', {}).get('hewiki', {}).get('title', ''))
        return {he_norm(n) for n in out if n}
    cands = [e for e in ents.values() if 'id' in e and FOOTBALLER in claim_ids(e, 'P106') and name in he_names(e)]
    team = [e for e in cands if club_q in claim_ids(e, 'P54')]
    if len(team) == 1:
        return team[0], 'hebrew_name+club'
    if not cands:
        return None, 'no_wikidata_footballer_with_this_name'
    return None, ('ambiguous_same_club: ' if team else 'hebrew name found, club not on the item: ') + ', '.join(e['id'] for e in (team or cands)[:6])

def more_pass(a, keys):
    """Second pass for players who still have no face: every file of the player's Commons category and its
    sub-categories, the full-text search, and the files' own "depicts" statements. Files already judged are not fetched
    again; the new ones are ranked by how likely they are a portrait of this one player and the best are downloaded and
    appended to the player's candidates."""
    E = json.load(open(os.path.join(ROOT, 'data', 'visuals', 'euro-players.json'), encoding='utf8'))
    want = {}
    for u in E.get('unresolved', []):
        want.setdefault(u.get('key'), {})[u.get('en')] = u
    for key in keys:
        todo = want.get(key) or {}
        if not todo:
            continue
        squad = json.load(open(os.path.join(ROOT, 'data', 'euro', key + '.json'), encoding='utf8'))
        outdir = os.path.join(a.out, key); os.makedirs(outdir, exist_ok=True)
        mp = os.path.join(outdir, 'manifest.json')
        old = json.load(open(mp, encoding='utf8')) if os.path.isfile(mp) else {'club': key, 'clubName': squad.get('name_he'), 'players': []}
        by = {e.get('en'): e for e in old['players']}
        cq = None
        for n, p in enumerate(squad.get('players', [])):
            u = todo.get(p.get('en'))
            if not u:
                continue
            entry = by.get(p.get('en')) or {'he': p.get('he'), 'en': p.get('en'), 'pos': p.get('pos'), 'age': p.get('age'), 'candidates': []}
            added = 0
            try:
                qid = entry.get('qid') or u.get('qid')
                ent = None
                if not qid and re.search('[\u0590-\u05ff]', p.get('en') or ''):
                    cq = cq or club_qid(key)
                    ent, why = identify_hebrew(p, cq)
                    entry['match'] = why
                    if ent:
                        qid = ent['id']; entry.update(qid=qid, wikidata='https://www.wikidata.org/wiki/' + qid, label=label(ent) or p.get('he'), birthYear=birth_year(ent))
                if qid and ent is None:
                    r = wd({'action': 'wbgetentities', 'ids': qid, 'props': 'claims|labels|aliases|sitelinks', 'languages': 'en|mul|he'})
                    ent = (r.get('entities') or {}).get(qid)
                if qid and ent and 'missing' not in ent:
                    p18 = ['File:' + t for t in images(ent)]
                    titles = list(p18); via = {t: 'p18' for t in titles}
                    def add(ts, how):
                        for t in ts:
                            if t not in via:
                                via[t] = how; titles.append(t)
                    for cat in claim_ids(ent, 'P373')[:1]:
                        add(category_files(cat, 200), 'category')
                        add(subcat_files(cat, 12), 'subcat')
                    for nm in {label(ent), p.get('en')}:
                        if nm and nm != '?':
                            add(search_files(nm, 30), 'search')
                    seen = {c.get('title') for c in entry.get('candidates', [])} | {r_.get('title') for r_ in entry.get('rejectedFiles', [])}
                    new = [t for t in titles if t not in seen][:150]
                    infos = {}
                    for i in range(0, len(new), 25):
                        infos.update(file_info(new[i:i + 25]))
                    ok = []
                    for t in new:
                        i = infos.get(t)
                        if not i:
                            continue
                        if not licence_ok(i):
                            entry.setdefault('rejectedFiles', []).append({'title': t, 'license': i.get('license')}); continue
                        if not (i.get('author') or '').strip() and not str(i.get('license', '')).upper().startswith(('CC0', 'PUBLIC DOMAIN', 'PD')):
                            entry.setdefault('rejectedFiles', []).append({'title': t, 'license': i.get('license'), 'why': 'no author recorded'}); continue
                        ok.append(i)
                    dep = depicts([i.get('pageid') for i in ok])
                    names = {x for x in (norm(label(ent)).split()[-1:] + norm(p.get('en') or '').split()[-1:]) if len(x) > 2}
                    ranked = sorted(ok, key=lambda i: -portrait_score(i, qid, names, dep))
                    base = len(entry.get('candidates', []))
                    for i in ranked:
                        sc = portrait_score(i, qid, names, dep)
                        if sc < 1 or added >= a.max_candidates:
                            break
                        fn = f'{n:02d}-{qid}-m{base + added}.jpg'
                        data = get(i['thumb'], raw=True)
                        with open(os.path.join(outdir, fn), 'wb') as fh:
                            fh.write(data)
                        entry.setdefault('candidates', []).append({**i, 'file': fn, 'fromP18': i['title'] in p18, 'via': via.get(i['title']),
                                                                   'depicts': dep.get(str(i.get('pageid'))) or [], 'score': round(sc, 1), 'pass': 'more'})
                        added += 1
            except Exception as e:
                entry['error'] = str(e)[:200]
            by[p.get('en')] = entry
            print(key, p.get('en'), entry.get('match'), entry.get('qid'), '+%d' % added, flush=True)
        order = [e.get('en') for e in old['players']]
        old['players'] = [by[x] for x in order] + [e for x, e in by.items() if x not in set(order)]
        with open(mp, 'w', encoding='utf8') as fh:
            json.dump(old, fh, ensure_ascii=False, indent=1)

def licence_ok(i):
    if i.get('nonFree') in ('true', True):
        return False
    if i.get('mime') not in ('image/jpeg', 'image/png', 'image/webp'):
        return False
    return bool(OK_LICENSE.match(i.get('license', '').strip()))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--clubs', required=True); ap.add_argument('--out', required=True); ap.add_argument('--max-candidates', type=int, default=5); ap.add_argument('--width', type=int, default=640); ap.add_argument('--players', default=''); ap.add_argument('--cat-limit', type=int, default=8); ap.add_argument('--more', action='store_true', help='second pass for the players listed as unresolved in data/visuals/euro-players.json'); ap.add_argument('--deep', action='store_true')
    a = ap.parse_args()
    global WIDTH, CAT_LIMIT, DEEP; WIDTH = a.width; CAT_LIMIT = a.cat_limit; DEEP = a.deep
    only = {x.strip() for x in a.players.split('|') if x.strip()}
    keys = sorted(os.path.splitext(f)[0] for f in os.listdir(os.path.join(ROOT, 'data', 'euro')) if f.endswith('.json') and not f.startswith('_') and not f.startswith('a_')) if a.clubs == 'all' else a.clubs.split(',')
    if a.more:
        CAT_LIMIT = 0
        return more_pass(a, keys)
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
                    entry['label'] = label(ent)
                    entry['birthYear'] = birth_year(ent)
                    titles = ['File:' + t for t in images(ent)]
                    via = {t: 'p18' for t in titles}
                    def add(ts, how):
                        for t in ts:
                            if t not in via:
                                via[t] = how; titles.append(t)
                    for cat in claim_ids(ent, 'P373')[:1]:
                        add(category_files(cat), 'category')
                        if DEEP:
                            add(subcat_files(cat), 'subcat')
                    if DEEP:
                        for nm in {label(ent), p.get('en')}:
                            if nm:
                                add(search_files(nm), 'search')
                    infos = {}
                    for i in range(0, min(len(titles), 100), 25):
                        infos.update(file_info(titles[i:i + 25]))
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
                        entry['candidates'].append({**i, 'file': fn, 'fromP18': t in ['File:' + x for x in images(ent)], 'via': via.get(t)})
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
            manifest['players'] = [new.get(e['en'], e) for e in old['players']] + [e for e in manifest['players'] if e['en'] not in {o['en'] for o in old['players']}]
        with open(mp, 'w', encoding='utf8') as fh:
            json.dump(manifest, fh, ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main()
