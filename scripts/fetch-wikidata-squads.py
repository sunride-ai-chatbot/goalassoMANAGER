#!/usr/bin/env python3
"""Pull real current squads from Wikipedia + Wikidata for the clubs that still have invented players (GitHub Actions).

For every club in data/config/world-clubs-wiki.json:
  1. read the club's English Wikipedia article and parse the maintained "current squad" templates
     ({{Fs player|no=|nat=|pos=|name=[[...]]}} and the football squad variants) in the first-team sections only
     (sections about loans, reserves, youth, academy, women, staff or former players are skipped)
  2. resolve every linked player on Wikidata (one batch request per 50 titles): item id, Hebrew label, date of
     birth, Commons image (P18) and the number of Wikipedia articles (fame proxy)
  3. write data/euro/<key>.json in the schema the game already reads ({key, name_he, players:[{he,en,pos,age,
     nat,value_m,qid,no}]}). The Hebrew name is the Hebrew Wikidata label when there is one, otherwise the Latin
     name (the game isolates Latin text with <bdi>). Nobody is invented: a club with fewer than 14 parsed players
     is reported and keeps its generated squad.
Market values are not public data here, so value_m is an estimate from the club's strength, the player's age,
position and fame (the game normalises a real squad's ratings to the club's strength: only the spread matters).
The `qid` lets scripts/fetch-commons-portraits.py identify the exact person (no name matching).

Usage: python3 scripts/fetch-wikidata-squads.py --group world --out data/euro [--only key1,key2]
Standard library only; sequential requests with a User-Agent, per Wikimedia policy.
"""
import argparse, hashlib, html, json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = 'GOALASSO-squad-fetch/2.0 (https://github.com/sunride-ai-chatbot/goalassoMANAGER; football management game)'
SEASON_YEAR = 2026
WP_API = 'https://en.wikipedia.org/w/api.php'
WD_API = 'https://www.wikidata.org/w/api.php'

# FIFA / IOC style codes used by the squad templates → country names as the game's data already spells them
NAT = {'ENG': 'England', 'SCO': 'Scotland', 'WAL': 'Wales', 'NIR': 'Northern Ireland', 'IRL': 'Ireland', 'ESP': 'Spain', 'POR': 'Portugal',
       'FRA': 'France', 'GER': 'Germany', 'ITA': 'Italy', 'NED': 'Netherlands', 'BEL': 'Belgium', 'SUI': 'Switzerland', 'AUT': 'Austria',
       'DEN': 'Denmark', 'SWE': 'Sweden', 'NOR': 'Norway', 'FIN': 'Finland', 'ISL': 'Iceland', 'POL': 'Poland', 'CZE': 'Czech Republic',
       'SVK': 'Slovakia', 'HUN': 'Hungary', 'ROU': 'Romania', 'BUL': 'Bulgaria', 'GRE': 'Greece', 'TUR': 'Turkey', 'CRO': 'Croatia',
       'SRB': 'Serbia', 'BIH': 'Bosnia-Herzegovina', 'SVN': 'Slovenia', 'MKD': 'North Macedonia', 'MNE': 'Montenegro', 'ALB': 'Albania',
       'KOS': 'Kosovo', 'UKR': 'Ukraine', 'RUS': 'Russia', 'BLR': 'Belarus', 'LTU': 'Lithuania', 'LVA': 'Latvia', 'EST': 'Estonia',
       'GEO': 'Georgia', 'ARM': 'Armenia', 'AZE': 'Azerbaijan', 'ISR': 'Israel', 'CYP': 'Cyprus', 'MLT': 'Malta', 'LUX': 'Luxembourg',
       'BRA': 'Brazil', 'ARG': 'Argentina', 'URU': 'Uruguay', 'COL': 'Colombia', 'CHI': 'Chile', 'PER': 'Peru', 'ECU': 'Ecuador',
       'PAR': 'Paraguay', 'BOL': 'Bolivia', 'VEN': 'Venezuela', 'MEX': 'Mexico', 'USA': 'United States', 'CAN': 'Canada', 'CRC': 'Costa Rica',
       'PAN': 'Panama', 'HON': 'Honduras', 'GUA': 'Guatemala', 'SLV': 'El Salvador', 'JAM': 'Jamaica', 'TRI': 'Trinidad and Tobago',
       'HAI': 'Haiti', 'DOM': 'Dominican Republic', 'CUB': 'Cuba', 'MAR': 'Morocco', 'ALG': 'Algeria', 'TUN': 'Tunisia', 'EGY': 'Egypt',
       'LBY': 'Libya', 'SEN': 'Senegal', 'CIV': "Côte d'Ivoire", 'GHA': 'Ghana', 'NGA': 'Nigeria', 'CMR': 'Cameroon', 'MLI': 'Mali',
       'BFA': 'Burkina Faso', 'GUI': 'Guinea', 'GNB': 'Guinea-Bissau', 'CPV': 'Cape Verde', 'GAB': 'Gabon', 'CGO': 'Congo', 'COD': 'DR Congo',
       'ANG': 'Angola', 'ZAM': 'Zambia', 'ZIM': 'Zimbabwe', 'RSA': 'South Africa', 'MOZ': 'Mozambique', 'TAN': 'Tanzania', 'KEN': 'Kenya',
       'UGA': 'Uganda', 'ETH': 'Ethiopia', 'SUD': 'Sudan', 'BEN': 'Benin', 'TOG': 'Togo', 'NIG': 'Niger', 'GAM': 'Gambia', 'SLE': 'Sierra Leone',
       'LBR': 'Liberia', 'MTN': 'Mauritania', 'MAD': 'Madagascar', 'COM': 'Comoros', 'BDI': 'Burundi', 'RWA': 'Rwanda', 'EQG': 'Equatorial Guinea',
       'CTA': 'Central African Republic', 'CHA': 'Chad', 'NAM': 'Namibia', 'BOT': 'Botswana', 'MWI': 'Malawi', 'ESW': 'Eswatini', 'LES': 'Lesotho',
       'JPN': 'Japan', 'KOR': 'South Korea', 'CHN': 'China', 'AUS': 'Australia', 'NZL': 'New Zealand', 'IRN': 'Iran', 'IRQ': 'Iraq', 'KSA': 'Saudi Arabia',
       'UAE': 'United Arab Emirates', 'QAT': 'Qatar', 'JOR': 'Jordan', 'SYR': 'Syria', 'LBN': 'Lebanon', 'UZB': 'Uzbekistan', 'KAZ': 'Kazakhstan',
       'IND': 'India', 'THA': 'Thailand', 'VIE': 'Vietnam', 'IDN': 'Indonesia', 'PHI': 'Philippines', 'MAS': 'Malaysia', 'PRK': 'North Korea',
       'CUW': 'Curaçao', 'SUR': 'Suriname', 'GUY': 'Guyana', 'PUR': 'Puerto Rico', 'MTQ': 'Martinique', 'GLP': 'Guadeloupe', 'GUF': 'French Guiana',
       'FRO': 'Faroe Islands', 'AND': 'Andorra', 'LIE': 'Liechtenstein', 'MDA': 'Moldova', 'GIB': 'Gibraltar', 'SMR': 'San Marino', 'TJK': 'Tajikistan',
       'KGZ': 'Kyrgyzstan', 'TKM': 'Turkmenistan', 'PLE': 'Palestine', 'BHR': 'Bahrain', 'OMA': 'Oman', 'KUW': 'Kuwait', 'YEM': 'Yemen'}
POS = {'GK': 'GK', 'DF': 'DF', 'MF': 'MF', 'FW': 'FW', 'G': 'GK', 'D': 'DF', 'M': 'MF', 'F': 'FW'}
SKIP_HEAD = re.compile(r'loan|reserve|youth|academy|women|former|notable|\bb\s*team|under[- ]?\d|\bu-?\d|retired|captain|coach|manage|board|honour|kit|stadium|record|rival|support|legend|hall of fame', re.I)
SQUAD_HEAD = re.compile(r'squad|players|roster|team', re.I)


def get(url, params, tries=4):
    url += '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode('utf8'))
        except Exception:  # noqa: BLE001
            if i == tries - 1:
                raise
            time.sleep(3 * (i + 1))


def wikitext(title):
    d = get(WP_API, {'action': 'parse', 'page': title, 'prop': 'wikitext', 'redirects': 1, 'format': 'json', 'formatversion': 2})
    return d['parse']['wikitext'], d['parse']['title']


FS = re.compile(r'\{\{\s*(?:fs player|fs player2|football squad player|football squad player2|fs2 player)\s*\|(.*?)\}\}', re.I | re.S)
LINK = re.compile(r'\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]')


def parse_squad(text):
    """Players from the first-team squad sections, in article order, with number / nat / pos / name / title."""
    out, seen = [], set()
    parts = re.split(r'\n(={2,4})\s*(.*?)\s*\1\s*\n', '\n' + text)
    sections = [(parts[i + 1], parts[i + 2]) for i in range(1, len(parts) - 2, 3)]   # the lead never holds a squad
    for head, body in sections:
        if SKIP_HEAD.search(head) and not (SQUAD_HEAD.search(head) and re.search(r'current|first', head, re.I)):
            continue
        if not SQUAD_HEAD.search(head) and not FS.search(body):
            continue
        if 'staff' in head.lower() and not FS.search(body):
            continue
        for m in FS.finditer(body):
            f = {}
            for part in re.split(r'\|(?=\s*\w+\s*=)', m.group(1)):
                if '=' in part:
                    k, v = part.split('=', 1)
                    f[k.strip().lower()] = v.strip()
            name = f.get('name', '')
            lm = LINK.search(name)
            title = lm.group(1).strip() if lm else None
            disp = (lm.group(2) or lm.group(1)).strip() if lm else re.sub(r'<[^>]+>|\{\{[^}]*\}\}', '', name).strip()
            disp = html.unescape(re.sub(r"''+", '', disp))
            if not disp or disp in seen:
                continue
            seen.add(disp)
            out.append({'no': f.get('no', '').strip() or None, 'pos': POS.get(f.get('pos', '').strip().upper()), 'nat': NAT.get(f.get('nat', '').strip().upper()),
                        'en': disp, 'title': title, 'loan': bool(re.search(r'loan', f.get('other', ''), re.I))})
    return out


FS_HE = re.compile(r'\{\{\s*שחקן סגל\s*\|(.*?)\}\}', re.S)
POS_HE = {'שוער': 'GK', 'בלם': 'DF', 'מגן': 'DF', 'הגנה': 'DF', 'מגן שמאלי': 'DF', 'מגן ימני': 'DF', 'קשר': 'MF', 'קישור': 'MF', 'קשר הגנתי': 'MF',
          'קשר התקפי': 'MF', 'חלוץ': 'FW', 'כנף': 'FW', 'התקפה': 'FW', 'מקשר': 'MF'}
NAT_HE2EN = {'ישראל': 'Israel', 'גאנה': 'Ghana', 'חוף השנהב': "Côte d'Ivoire", 'ניגריה': 'Nigeria', 'ברזיל': 'Brazil', 'ארגנטינה': 'Argentina',
             'סרביה': 'Serbia', 'קרואטיה': 'Croatia', 'סלובניה': 'Slovenia', 'בוסניה והרצגובינה': 'Bosnia-Herzegovina', 'צרפת': 'France',
             'ספרד': 'Spain', 'פורטוגל': 'Portugal', 'אוקראינה': 'Ukraine', 'רוסיה': 'Russia', 'גאורגיה': 'Georgia', 'קמרון': 'Cameroon',
             'סנגל': 'Senegal', 'מאלי': 'Mali', 'גינאה': 'Guinea', 'קונגו': 'Congo', 'הרפובליקה הדמוקרטית של קונגו': 'DR Congo', 'אורוגוואי': 'Uruguay',
             'קולומביה': 'Colombia', 'צ\'ילה': 'Chile', 'מולדובה': 'Moldova', 'רומניה': 'Romania', 'בולגריה': 'Bulgaria', 'יוון': 'Greece', 'קפריסין': 'Cyprus',
             'הולנד': 'Netherlands', 'בלגיה': 'Belgium', 'גרמניה': 'Germany', 'איטליה': 'Italy', 'אנגליה': 'England', 'ארצות הברית': 'United States',
             'קנדה': 'Canada', 'אוסטרליה': 'Australia', 'ליטא': 'Lithuania', 'לטביה': 'Latvia', 'אסטוניה': 'Estonia', 'פולין': 'Poland', 'הונגריה': 'Hungary',
             'צ\'כיה': 'Czech Republic', 'סלובקיה': 'Slovakia', 'אלבניה': 'Albania', 'קוסובו': 'Kosovo', 'מקדוניה הצפונית': 'North Macedonia',
             'מונטנגרו': 'Montenegro', 'ארמניה': 'Armenia', 'אזרבייג\'ן': 'Azerbaijan', 'קזחסטן': 'Kazakhstan', 'אוזבקיסטן': 'Uzbekistan', 'יפן': 'Japan',
             'דרום קוריאה': 'South Korea', 'ניו זילנד': 'New Zealand', 'טוגו': 'Togo', 'בנין': 'Benin', 'בורקינה פאסו': 'Burkina Faso', 'אנגולה': 'Angola',
             'זימבבואה': 'Zimbabwe', 'דרום אפריקה': 'South Africa', 'אתיופיה': 'Ethiopia', 'מרוקו': 'Morocco', 'טוניסיה': 'Tunisia', 'מצרים': 'Egypt',
             'גמביה': 'Gambia', 'סיירה לאון': 'Sierra Leone', 'ליבריה': 'Liberia', 'גבון': 'Gabon', 'זמביה': 'Zambia', 'מוזמביק': 'Mozambique',
             'כף ורדה': 'Cape Verde', 'אלג\'יריה': 'Algeria', 'סקוטלנד': 'Scotland', 'אירלנד': 'Ireland', 'שוודיה': 'Sweden', 'נורווגיה': 'Norway',
             'דנמרק': 'Denmark', 'פינלנד': 'Finland', 'אוסטריה': 'Austria', 'שווייץ': 'Switzerland', 'טורקיה': 'Turkey', 'מקסיקו': 'Mexico', 'פרו': 'Peru',
             'פרגוואי': 'Paraguay', 'ונצואלה': 'Venezuela', 'אקוודור': 'Ecuador', 'בוליביה': 'Bolivia'}


def parse_squad_he(text):
    """Players from the Hebrew Wikipedia squad template ({{שחקן סגל|מס=|ארץ=|עמדה=|שם=[[...]]}})."""
    out, seen = [], set()
    for m in FS_HE.finditer(text):
        f = {}
        for part in re.split(r'\|(?=\s*[א-ת]+\s*=)', m.group(1)):
            if '=' in part:
                k, v = part.split('=', 1)
                f[k.strip()] = v.strip()
        name = f.get('שם', '')
        lm = LINK.search(name)
        title = lm.group(1).strip() if lm else None
        disp = (lm.group(2) or lm.group(1)).strip() if lm else re.sub(r'<[^>]+>|\{\{[^}]*\}\}', '', name).strip()
        disp = html.unescape(re.sub(r"''+", '', disp))
        if not disp or disp in seen:
            continue
        seen.add(disp)
        pos_he = re.sub(r'[\[\]]', '', f.get('עמדה', '')).split('|')[-1].strip()
        nat_he = re.sub(r'[\[\]]', '', f.get('ארץ', '')).split('|')[-1].strip()
        out.append({'no': f.get('מס', '').strip() or None, 'pos': POS_HE.get(pos_he), 'nat': NAT_HE2EN.get(nat_he, nat_he or None),
                    'he': disp, 'title': title, 'loan': 'השאלה' in f.get('הערות', '') + f.get('אחר', '')})
    return out


def wd_lookup(titles, site='enwiki'):
    """enwiki title → {qid, he, dob, img, sl} (batches of 50)."""
    res = {}
    titles = [t for t in titles if t]
    for i in range(0, len(titles), 50):
        chunk = titles[i:i + 50]
        chunk = [t[0].upper() + t[1:] for t in chunk]   # link titles may start lower-case; `normalize` only works for one title
        d = get(WD_API, {'action': 'wbgetentities', 'sites': site, 'titles': '|'.join(chunk), 'props': 'labels|claims|sitelinks', 'languages': 'he|en',
                         'format': 'json', 'redirects': 'yes'})
        if 'error' in d:
            raise RuntimeError('wikidata: ' + d['error'].get('info', '?'))
        norm = {}
        by_title = {}
        for q, e in d.get('entities', {}).items():
            if not q.startswith('Q'):
                continue
            t = e.get('sitelinks', {}).get(site, {}).get('title')
            if t:
                by_title[t] = (q, e)
        for t in chunk:
            hit = by_title.get(t) or by_title.get(t.replace('_', ' '))
            if not hit:
                continue
            q, e = hit
            cl = e.get('claims', {})
            if 'P106' in cl and not any(c.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id') == 'Q937857' for c in cl['P106']):
                continue   # the linked article is not a footballer (disambiguation, namesake)
            dob = None
            for c in cl.get('P569', []):
                v = c.get('mainsnak', {}).get('datavalue', {}).get('value', {})
                if v.get('time') and v.get('precision', 0) >= 9:
                    dob = v['time'][1:11]; break
            img = None
            for c in cl.get('P18', []):
                v = c.get('mainsnak', {}).get('datavalue', {}).get('value')
                if isinstance(v, str):
                    img = v; break
            res[t] = {'qid': q, 'he': e.get('labels', {}).get('he', {}).get('value'), 'en': e.get('labels', {}).get('en', {}).get('value'), 'dob': dob, 'img': img, 'sl': len(e.get('sitelinks', {}))}
        time.sleep(.6)
    return res


def age_of(dob):
    if not dob or not re.match(r'^\d{4}-\d{2}-\d{2}$', dob) or dob[5:7] == '00':
        return None
    y, m = int(dob[:4]), int(dob[5:7])
    return SEASON_YEAR - y - (1 if m > 8 else 0)


def est_value(club_str, age, pos, seed, sitelinks=0):
    base = 2 ** ((club_str - 64) / 3.75)          # the game's euroRating(value) lands on the club's strength
    agef = {17: .35, 18: .45, 19: .6, 20: .75, 21: .9, 22: 1.0, 23: 1.1, 24: 1.2, 25: 1.25, 26: 1.25, 27: 1.2, 28: 1.1, 29: 1.0,
            30: .85, 31: .7, 32: .55, 33: .45, 34: .35, 35: .28}.get(age if age is not None else 26, .25)
    posf = {'GK': .8, 'DF': .9, 'MF': 1.0, 'FW': 1.15}.get(pos, 1.0)
    h = int(hashlib.sha1(seed.encode('utf8')).hexdigest()[:8], 16) / 0xffffffff
    fame = 0.45 + 0.55 * min(1.0, (sitelinks / 25.0) ** 0.6)
    return round(base * agef * posf * (0.8 + 0.4 * h) * fame, 2)


def club_strength(name_he):
    src = open(os.path.join(ROOT, 'src', 'js', '11-market.js'), encoding='utf8').read()
    m = re.search(r"\['%s','[^']*','#[0-9a-fA-F]{6}','#[0-9a-fA-F]{6}',(\d+)\]" % re.escape(name_he.replace("'", "\\'")), src)
    if m:
        return int(m.group(1))
    src2 = open(os.path.join(ROOT, 'src', 'js', '16-leumit-toto-nt.js'), encoding='utf8').read()
    m = re.search(r"name:'%s'[^}]*?str:(\d+)" % re.escape(name_he.replace("'", "\\'")), src2)
    return int(m.group(1)) if m else 60


def leumit_squad(info, name_he, a):
    """Israeli second tier: the Hebrew Wikipedia article carries the squad with Hebrew names; Wikidata adds the Latin name, age, face."""
    try:
        hd = get('https://he.wikipedia.org/w/api.php', {'action': 'parse', 'page': info['he_title'], 'prop': 'wikitext', 'redirects': 1, 'format': 'json', 'formatversion': 2})
    except Exception as e:  # noqa: BLE001
        print('hewiki', info['he_title'], e); return None
    text = hd['parse']['wikitext']
    rows = [r for r in parse_squad_he(text) if not r['loan'] and r['he']]
    if not rows:
        return None
    wd = wd_lookup([r['title'] for r in rows], site='hewiki')
    cs = club_strength(name_he)
    players = []
    for r in rows:
        w = wd.get(r['title']) if r['title'] else None
        age = age_of(w['dob']) if w else None
        pos = r['pos'] or 'MF'
        if age is None:
            age = 25
        en = (w and w['en']) or r['he']
        players.append({'he': r['he'], 'en': en, 'pos': pos, 'age': age, 'nat': r['nat'] or 'Israel',
                        'value_m': est_value(cs, age, pos, (w and w['qid']) or r['he'], (w and w['sl']) or 0),
                        'qid': w['qid'] if w else None, 'img': w['img'] if w else None, 'no': r['no'], 'sl': (w and w['sl']) or 0})
    if not any(p['pos'] == 'GK' for p in players):
        return None
    players.sort(key=lambda p: (p['pos'] != 'GK', -p['value_m']))
    return players


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--group', default='world', choices=['world', 'leumit', 'all'])
    ap.add_argument('--out', default=os.path.join(ROOT, 'data', 'euro'))
    ap.add_argument('--only', default='')
    ap.add_argument('--min', type=int, default=14)
    ap.add_argument('--debug', action='store_true')
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
                if g == 'leumit' and info.get('he_title'):
                    players = leumit_squad(info, name_he, a)
                    if players is None or len(players) < a.min:
                        print('hewiki squad thin for', key, '- trying enwiki')
                    else:
                        out = {'key': key, 'name_he': name_he, 'source': 'hewiki:' + info['he_title'], 'fetched': time.strftime('%Y-%m-%d'), 'players': players[:30]}
                        with open(os.path.join(a.out, key + '.json'), 'w', encoding='utf8') as fh:
                            json.dump(out, fh, ensure_ascii=False, indent=0)
                        report.append({'key': key, 'ok': True, 'n': len(out['players']), 'qid': sum(1 for p in out['players'] if p['qid']),
                                       'he': len(out['players']), 'img': sum(1 for p in out['players'] if p['img']), 'src': 'hewiki'})
                        print(report[-1]); time.sleep(.8); continue
                text, title = wikitext(info['en'])
                if a.debug and info.get('he_title'):   # Hebrew Wikipedia squad lists use their own templates: dump them for a parser
                    try:
                        hd = get('https://he.wikipedia.org/w/api.php', {'action': 'parse', 'page': info['he_title'], 'prop': 'wikitext', 'redirects': 1, 'format': 'json', 'formatversion': 2})
                        os.makedirs(os.path.join(a.out, '_debug'), exist_ok=True)
                        with open(os.path.join(a.out, '_debug', key + '-he.txt'), 'w', encoding='utf8') as fh:
                            fh.write(hd['parse']['wikitext'])
                    except Exception as e:  # noqa: BLE001
                        print('hewiki', key, e)
                rows = [r for r in parse_squad(text) if not r['loan']]
                if a.debug:
                    os.makedirs(os.path.join(a.out, '_debug'), exist_ok=True)
                    heads = re.findall(r'\n(={2,4})\s*(.*?)\s*\1\s*\n', '\n' + text)
                    with open(os.path.join(a.out, '_debug', key + '.txt'), 'w', encoding='utf8') as fh:
                        fh.write('\n'.join('%s %s' % (h[0], h[1]) for h in heads) + '\n\nTEMPLATES %d\n' % len(FS.findall(text)) + '\n'.join(m.group(0)[:200] for m in FS.finditer(text)))
                wd = wd_lookup([r['title'] for r in rows])
                cs = club_strength(name_he)
                players = []
                for r in rows:
                    w = (wd.get(r['title'][0].upper() + r['title'][1:]) or wd.get(r['title'])) if r['title'] else None
                    age = age_of(w['dob']) if w else None
                    pos = r['pos'] or 'MF'
                    if age is None:
                        age = 25   # real player without an article / birth date: a typical age, no portrait
                    players.append({'he': (w and w['he']) or r['en'], 'en': r['en'], 'pos': pos, 'age': age, 'nat': r['nat'],
                                    'value_m': est_value(cs, age, pos, (w and w['qid']) or r['en'], (w and w['sl']) or 0),
                                    'qid': w['qid'] if w else None, 'img': w['img'] if w else None, 'no': r['no'], 'sl': (w and w['sl']) or 0})
                if len(players) < a.min or not any(p['pos'] == 'GK' for p in players):
                    report.append({'key': key, 'ok': False, 'why': 'only %d parsed players (%s)' % (len(players), title)}); print(report[-1]); continue
                players.sort(key=lambda p: (p['pos'] != 'GK', -p['value_m']))
                out = {'key': key, 'name_he': name_he, 'source': 'enwiki:' + title, 'fetched': time.strftime('%Y-%m-%d'), 'players': players[:30]}
                with open(os.path.join(a.out, key + '.json'), 'w', encoding='utf8') as fh:
                    json.dump(out, fh, ensure_ascii=False, indent=0)
                report.append({'key': key, 'ok': True, 'n': len(out['players']), 'qid': sum(1 for p in out['players'] if p['qid']),
                               'he': sum(1 for p in out['players'] if p['he'] != p['en']), 'img': sum(1 for p in out['players'] if p['img'])})
                print(report[-1])
                time.sleep(.8)
            except Exception as e:  # noqa: BLE001
                report.append({'key': key, 'ok': False, 'why': 'error: %s' % e}); print(report[-1])
    with open(os.path.join(a.out, '_squads-report.json'), 'w', encoding='utf8') as fh:
        json.dump(report, fh, ensure_ascii=False, indent=1)
    print('done: %d ok, %d skipped' % (sum(1 for r in report if r['ok']), sum(1 for r in report if not r['ok'])))


if __name__ == '__main__':
    main()
