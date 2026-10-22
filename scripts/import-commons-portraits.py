#!/usr/bin/env python3
"""Choose one Commons portrait per European player from the fetched candidates and register it.

Input   <sources>/euro/<club>/manifest.json + candidate images  (branch `portrait-sources`, written by
        scripts/fetch-commons-portraits.py in GitHub Actions)
Output  data/visuals/source-photos/eu-<club>.json      the chosen original per player (schema 1, like the Israeli packs)
        data/visuals/euro-players.json                 identities (club Hebrew name + English name → visualId "wd-Q…"),
                                                       per-face source, author, licence and credit, and the reason for
                                                       every player left on the fallback
Then run scripts/build-portraits.py --only eu-<club>,… to produce the canonical cut-outs.

Selection: candidates are tried in order (Wikidata P18 image first, then the player's Commons category); the first one
that the portrait pipeline accepts in strict mode (single frontal face, whole head, clean background) wins.
Usage: python3 scripts/import-commons-portraits.py --sources /path/to/portrait-sources --clubs real_madrid,barcelona
"""
import argparse, base64, importlib.util, io, json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('bp', os.path.join(ROOT, 'scripts', 'build-portraits.py'))
bp = importlib.util.module_from_spec(spec); spec.loader.exec_module(bp)
def bp_norm(x):
    import re, unicodedata
    x = unicodedata.normalize('NFKD', x or '')
    return re.sub(r'[^a-z ]', ' ', ''.join(ch for ch in x if not unicodedata.combining(ch)).lower())

REJECT = {}
ACCEPT = {}   # files accepted on visual review that the automatic strict checks refuse (title → player, reason)
SRC_KEYS = ('title', 'page', 'author', 'license', 'licenseUrl', 'credit', 'attributionRequired', 'usageTerms', 'restrictions', 'date')

def load(p, default=None):
    if not os.path.isfile(p):
        return default
    with open(p, encoding='utf8') as fh:
        return json.load(fh)

def save(p, obj, compact=False):
    with open(p, 'w', encoding='utf8') as fh:
        json.dump(obj, fh, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 1, 'sort_keys': True}))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--sources', required=True); ap.add_argument('--clubs', required=True)
    a = ap.parse_args()
    ep = os.path.join(ROOT, 'data', 'visuals', 'euro-players.json')
    E = load(ep, {'schema': 1, 'players': [], 'faces': {}, 'unresolved': []})
    global REJECT, ACCEPT
    REJECT = load(os.path.join(ROOT, 'data', 'visuals', 'portrait-reject-files.json'), {})   # files rejected on visual review
    ACCEPT = load(os.path.join(ROOT, 'data', 'visuals', 'portrait-accept-files.json'), {})   # files accepted on visual review
    # files found by the player's Wikidata image or his own Commons category (before full-text search was added); a file
    # found only by full-text search can be another person with the same name, so it needs a visual review (ACCEPT)
    trusted = load(os.path.join(ROOT, 'data', 'visuals', 'portrait-trusted-files.json'), {})
    t = bp.Tools()
    # decisions per candidate file (size+mtime+pipeline version), so retries only process new files
    cache_p = os.path.join(a.sources, '.import-cache.json'); cache = load(cache_p, {})
    pv = os.path.getmtime(os.path.join(ROOT, 'scripts', 'build-portraits.py'))
    for key in a.clubs.split(','):
        man = load(os.path.join(a.sources, 'euro', key, 'manifest.json'))
        if not man:
            print('no manifest for', key); continue
        squad = load(os.path.join(ROOT, 'data', 'euro', key + '.json'))
        club_he = squad['name_he']; pack = 'eu-' + key
        E['players'] = [p for p in E['players'] if p['key'] != key]
        E['unresolved'] = [p for p in E['unresolved'] if p['key'] != key]
        E['faces'] = {k: v for k, v in E['faces'].items() if v['pack'] != pack}
        photos = {}
        squad_en = {p.get('en') for p in squad['players']}
        for pl in man['players']:
            assert pl['en'] in squad_en, ('manifest player not in squad', pl['en'])
            base = {'key': key, 'club': club_he, 'en': pl['en'], 'he': pl['he']}
            if not pl.get('qid'):
                E['unresolved'].append({**base, 'reason': 'not identified on Wikidata: ' + (pl.get('match') or pl.get('error') or 'unknown')}); continue
            chosen, tried = None, []
            surname = bp_norm(pl.get('label') or pl['en']).split()[-1:] + bp_norm(pl['en']).split()[-1:]
            for c in pl.get('candidates', []):
                # files from the player's Commons category must name him: a category can be shared with, or polluted
                # by, other subjects; the Wikidata main image (P18) is trusted as the person's own picture
                if not (c.get('author') or '').strip() and not str(c.get('license', '')).upper().startswith(('CC0', 'PUBLIC DOMAIN', 'PD')):
                    tried.append(c['title'] + ': no author recorded, so the required attribution cannot be given'); continue
                if c['title'] in REJECT:
                    tried.append(f"{c['title']}: rejected on review ({REJECT[c['title']]['reason']})"); continue
                acc = ACCEPT.get(c['title'])
                if acc and acc['player'] != pl['en']:
                    acc = None
                if not acc and not c.get('fromP18') and c.get('via') not in ('category', 'subcat') and c['title'] not in trusted.get(key + '|' + pl['en'], []):
                    tried.append(c['title'] + ': found by name search only, not yet confirmed on review'); continue
                if not acc and not c.get('fromP18') and not any(sn and sn in bp_norm(c['title']) for sn in surname):
                    tried.append(c['title'] + ': file name does not name the player'); continue
                # the same Commons file may exist in several renditions (640 px first, wider retries later); a wider
                # rendition can reveal a second face the detector rejects, so every rendition on disk is tried
                import glob as _g, re as _re
                stem = _re.sub(r'(-w\d+)?\.jpg$', '', c['file'])
                paths = sorted(_g.glob(os.path.join(a.sources, 'euro', key, stem + '.jpg')) + _g.glob(os.path.join(a.sources, 'euro', key, stem + '-w*.jpg')), key=os.path.getsize, reverse=True)
                if not paths:
                    tried.append(c['title'] + ': unreadable'); continue
                reasons = []
                for path in paths:
                    try:
                        img = Image.open(path).convert('RGB')
                    except Exception:
                        reasons.append('unreadable'); continue
                    lenient = bool(acc) and not acc.get('strict')   # identity-only confirmations keep the strict quality checks
                    ck = f"{key}/{os.path.basename(path)}|{os.path.getsize(path)}|{os.path.getmtime(path)}|{pv}" + ('|reviewed' if lenient else '')
                    if ck not in cache:
                        im, meas = bp.process(t, img, key=os.path.basename(path), strict=not lenient)
                        cache[ck] = 'ok' if im is not None else meas.get('reason')
                        save(cache_p, cache, compact=True)
                    if cache[ck] == 'ok':
                        chosen = (c, img); break
                    reasons.append(cache[ck])
                if chosen:
                    break
                tried.append(f"{c['title']}: {'/'.join(dict.fromkeys(reasons))}")
            if not chosen:
                why = 'no freely licensed image on Commons' if not pl.get('candidates') else 'no usable image (' + '; '.join(tried) + ')'
                if pl.get('rejectedFiles'):
                    why += ' · non-free/unsupported files skipped: ' + ', '.join(f"{r['title']} ({r['license']})" for r in pl['rejectedFiles'][:3])
                E['unresolved'].append({**base, 'qid': pl['qid'], 'reason': why}); continue
            c, img = chosen
            vid = 'wd-' + pl['qid']
            buf = io.BytesIO(); img.save(buf, 'JPEG', quality=92)
            photos[vid] = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
            E['players'].append({**base, 'visualId': vid, 'qid': pl['qid'], 'wikidata': pl.get('wikidata'), 'match': pl.get('match')})
            E['faces'][vid] = {'pack': pack, 'source': {k: c.get(k) for k in SRC_KEYS}, 'fromP18': c.get('fromP18')}
            if c['title'] in ACCEPT:
                E['faces'][vid]['reviewed'] = ACCEPT[c['title']]['reason']
            print(key, pl['en'], '→', c['title'], c.get('license'), flush=True)
        save(os.path.join(ROOT, 'data', 'visuals', 'source-photos', pack + '.json'), {'schema': 1, 'images': photos}, compact=True)
        save(ep, E)
        print(key, 'portraits', sum(1 for p in E['players'] if p['key'] == key), 'unresolved', sum(1 for p in E['unresolved'] if p['key'] == key))

if __name__ == '__main__':
    main()
