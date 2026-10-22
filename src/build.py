#!/usr/bin/env python3
"""Build ligat-haal-manager.html (one self-contained file) from:
  src/index.html          the document shell (__CSS__ and __JS__ placeholders)
  src/styles/NN-*.css     stylesheets, concatenated in file-name order
  src/js/NN-*.js          scripts, concatenated in file-name order into one <script> (shared scope, no modules)
  data/*.json             Israeli club squads;  data/euro/*.json  European squads
  src/splash.webp, src/logo.webp  embedded as data URIs
  data/visuals/players.json       portrait identities (packs stay in assets/facepacks and load at runtime)
The numeric prefix is the load order: a file may use anything declared in files before it, and function declarations
are hoisted, so views may call engine code declared later. Keep new code in the file that owns the subject.
"""
import json, glob, os, base64, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')

def read(p):
    with open(p, encoding='utf8') as fh:
        return fh.read()

def concat(folder, ext):
    files = sorted(glob.glob(os.path.join(SRC, folder, '*' + ext)))
    if not files:
        raise SystemExit('no ' + ext + ' files in src/' + folder)
    return ''.join(read(f) for f in files)

clubs = []
for f in sorted(glob.glob(os.path.join(ROOT, 'data', '*.json'))):
    clubs.append(json.loads(read(f)))
euro = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'data', 'euro', '*.json'))):
    try:
        d = json.loads(read(f))
        if d.get('players'):
            euro[d['name_he']] = [{k: p.get(k) for k in ('he', 'en', 'pos', 'age', 'nat', 'value_m')} for p in d['players'] if p.get('he')]
    except Exception as e:
        print('skip', f, e)

def enc(o):
    return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</script', '<\\/script')

def mdate(pattern):
    fs = glob.glob(os.path.join(ROOT, 'data', pattern))
    return datetime.date.fromtimestamp(max(os.path.getmtime(f) for f in fs)).strftime('%d.%m.%Y') if fs else None

meta = {'israel': {'clubs': len(clubs), 'players': sum(len(c['players']) for c in clubs), 'date': mdate('*.json')},
        'euro': {'clubs': len(euro), 'players': sum(len(v) for v in euro.values()), 'date': mdate('euro/*.json')}}

def data_uri(name):
    with open(os.path.join(SRC, name), 'rb') as fh:
        return 'data:image/webp;base64,' + base64.b64encode(fh.read()).decode()

shell = read(os.path.join(SRC, 'index.html'))
assert '__CSS__' in shell and '__JS__' in shell, 'src/index.html must contain __CSS__ and __JS__'
page = shell.replace('__CSS__', concat('styles', '.css')).replace('__JS__', concat('js', '.js'))
page = page.replace('__SPLASH_IMG__', data_uri('splash.webp')).replace('__LOGO_IMG__', data_uri('logo.webp'))

# player portraits: identity manifest (data/visuals/players.json) + per-club packs in assets/facepacks (loaded at runtime)
visuals = json.loads(read(os.path.join(ROOT, 'data', 'visuals', 'players.json')))
face_names = {p['he']: p['visualId'] for p in visuals['players']}
for c in clubs:
    for p in c['players']:
        if p['he'] not in face_names:
            raise ValueError('Missing portrait identity: ' + p['he'])
for face in visuals['faces'].values():
    if not os.path.isfile(os.path.join(ROOT, 'assets', 'facepacks', face['pack'] + '.json')):
        raise ValueError('Missing portrait pack: ' + face['pack'])
# portrait status and skin tone come from the offline rebuild (scripts/build-portraits.py → data/visuals/portrait-audit.json);
# anything not marked ok there renders the designed fallback in the game
audit_path = os.path.join(ROOT, 'data', 'visuals', 'portrait-audit.json')
audit = json.loads(read(audit_path)) if os.path.isfile(audit_path) else {}
runtime_faces = {k: {'pack': v['pack'], 'status': 'ok' if audit.get(k, {}).get('status') == 'ok' else 'unresolved',
                     'skin': audit.get(k, {}).get('skin') or v.get('skin'), 'bust': 1 if audit.get(k, {}).get('shoulders', 1) >= 0.3 else 0}
                 for k, v in visuals['faces'].items()}
# European real squads (data/visuals/euro-players.json, written by scripts/import-commons-portraits.py): keyed by the
# club's Hebrew name + the player's English name exactly as in data/euro; `euroEn` covers saves made before identities
# existed and only lists English names that are unique across all European squads
euro_path = os.path.join(ROOT, 'data', 'visuals', 'euro-players.json')
euro_v = json.loads(read(euro_path)) if os.path.isfile(euro_path) else {'players': [], 'faces': {}}
euro_ids, en_count, en_id = {}, {}, {}
for p in euro_v['players']:
    euro_ids[p['club'] + '|' + p['en']] = p['visualId']
    en_count[p['en']] = en_count.get(p['en'], 0) + 1; en_id[p['en']] = p['visualId']
for sq in euro.values():
    for r in sq:
        en_count[r.get('en')] = en_count.get(r.get('en'), 0) + (0 if r.get('en') in en_id else 1)
for k, v in euro_v['faces'].items():
    if not os.path.isfile(os.path.join(ROOT, 'assets', 'facepacks', v['pack'] + '.json')):
        raise ValueError('Missing portrait pack: ' + v['pack'])
    runtime_faces[k] = {'pack': v['pack'], 'status': 'ok' if audit.get(k, {}).get('status') == 'ok' else 'unresolved', 'skin': audit.get(k, {}).get('skin'),
                        'bust': 1 if audit.get(k, {}).get('shoulders', 1) >= 0.3 else 0}
page = page.replace('__PLAYER_VISUALS__', enc({'names': face_names, 'faces': runtime_faces, 'euro': euro_ids,
                                               'euroEn': {n: i for n, i in en_id.items() if en_count.get(n) == 1}}))
out = page.replace('__CLUBS_JSON__', enc(clubs)).replace('__EURO_JSON__', enc(euro)).replace('__DATA_META__', enc(meta))
for ph in ('__CSS__', '__JS__', '__SPLASH_IMG__', '__LOGO_IMG__', '__PLAYER_VISUALS__', '__CLUBS_JSON__', '__EURO_JSON__', '__DATA_META__'):
    assert ph not in out, 'unfilled placeholder ' + ph
# build stamp: a hash of the page content, so a live check can tell which build a server is actually serving
import hashlib
out = out.replace('<head>', '<head>\n<meta name="goalasso-build" content="%s">' % hashlib.sha256(out.encode('utf8')).hexdigest()[:12], 1)
with open(os.path.join(ROOT, 'ligat-haal-manager.html'), 'w', encoding='utf8') as fh:
    fh.write(out)
print('clubs:', len(clubs), 'players:', sum(len(c['players']) for c in clubs), 'euro clubs:', len(euro),
      'euro players:', sum(len(v) for v in euro.values()), 'size KB:', len(out.encode('utf8')) // 1024)
