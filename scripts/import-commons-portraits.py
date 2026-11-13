#!/usr/bin/env python3
"""Choose one Commons portrait per European player from the fetched candidates and register it.

Input   <sources>/euro/<club>/manifest.json + candidate images  (branch `portrait-sources`, written by
        scripts/fetch-commons-portraits.py in GitHub Actions)
Output  data/visuals/source-photos/eu-<club>.json      the chosen original per player (schema 1, like the Israeli packs)
        data/visuals/euro-players.json                 identities (club Hebrew name + English name → visualId "wd-Q…"),
                                                       per-face source, author, licence and credit, and the reason for
                                                       every player left on the fallback
        assets/facepacks/eu-<club>.json                the canonical cut-outs (the accepted candidate is processed once, here)
        data/visuals/portrait-audit.json               measurements per face
A club whose decisions came from an older cache prints a note: run scripts/build-portraits.py --only eu-<club> for it.

Selection: candidates are tried in order (Wikidata P18 image first, then the player's Commons category); the first one
that the portrait pipeline accepts in strict mode (single frontal face, whole head, clean background) wins.
Usage: python3 scripts/import-commons-portraits.py --sources /path/to/portrait-sources --clubs real_madrid,barcelona
"""
import argparse, base64, hashlib, importlib.util, io, json, os
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

# Cosine similarity of two SFace features. Measured on 3,781 named single-face pictures of 2,787 players: two thirds of
# the pairs of one player reach 0.55; of 7.1 million pairs of different players 31 did (0.0004%), of 39,000 pairs of
# club-mates 3 (one pair of brothers). A file of the player's own Commons category needs FM_MIN; a file that only a
# name search found has no such prior and needs FM_MIN_SEARCH. Every face accepted this way is still looked at.
FM_MIN = 0.55
FM_MIN_SEARCH = 0.60

def two_names(title, surnames):
    """Does the file name name somebody else as well? "Hamad Al Qallaf, Vladimír Coufal CZE-KUW (cropped)" shows either
    of them. Somebody named right before the player, or "A and B": yes. "Daniel Holzer, Baník Ostrava-Zlín" (his club after
    his name): no."""
    import re, unicodedata
    t = re.sub(r'^File:|\.\w+$', '', title)
    low = ''.join(ch for ch in unicodedata.normalize('NFKD', t) if not unicodedata.combining(ch)).lower()
    at = min([low.find(sn) for sn in surnames if sn and low.find(sn) >= 0] or [-1])
    if at > 0 and re.search(r'[a-z]{3,}\s+[a-z].*?(,| and | & | und | et )\s*(?:[\w.-]+\s+){0,2}$', low[:at]):   # the other name ends right before his
        return True
    return bool(re.search(r"[A-Z\u00c0-\u017f][\w'\u2019-]+ (and|&|und) [A-Z\u00c0-\u017f][\w'\u2019-]+ [A-Z\u00c0-\u017f]", t))

class FaceMatch:
    """Is the face in an unnamed picture the face in the player's own, named pictures? (OpenCV YuNet + SFace; the SFace
    model is opencv_zoo's face_recognition_sface_2021dec.onnx at $SFACE or ~/.u2net/sface.onnx. Without it nothing is
    matched and the import behaves as before.)"""
    def __init__(self, yunet):
        import cv2
        self.cv2 = cv2; self.yunet = yunet
        sp = os.environ.get('SFACE') or os.path.join(os.path.expanduser('~'), '.u2net', 'sface.onnx')
        self.rec = cv2.FaceRecognizerSF.create(sp, '') if os.path.isfile(sp) else None

    def feature(self, pil):
        import numpy as np
        if not self.rec:
            return None
        img = np.array(pil)[:, :, ::-1].copy()
        h, w = img.shape[:2]
        det = self.cv2.FaceDetectorYN.create(self.yunet, '', (w, h), 0.7, 0.3, 50)
        _, faces = det.detect(img)
        if faces is None or not len(faces):
            return None
        faces = sorted(faces, key=lambda f: -f[2] * f[3])
        # one subject: a face of 60 px or more, and no second face of comparable size (as the portrait checks ask)
        if faces[0][2] < 60 or (len(faces) > 1 and faces[1][2] * faces[1][3] >= 0.55 * faces[0][2] * faces[0][3]):
            return None
        return self.rec.feature(self.rec.alignCrop(img, faces[0]))

    def cos(self, a, b):
        return float(self.rec.match(a, b, self.cv2.FaceRecognizerSF_FR_COSINE))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--sources', required=True); ap.add_argument('--clubs', required=True)
    ap.add_argument('--fresh', action='store_true', help='decide every player again (by default a player keeps the face he has, and recorded refusals are not measured again)')
    ap.add_argument('--review', default='', help='directory for side-by-side pictures of every identity confirmed by face match')
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
    fm = FaceMatch(t.yunet_path)
    # decisions per candidate file (size + pipeline version), so retries only process new files. The version is the
    # pipeline's content, not its date: a fresh checkout must not throw the decisions away
    cache_p = os.path.join(a.sources, '.import-cache.json'); cache = load(cache_p, {})
    with open(os.path.join(ROOT, 'scripts', 'build-portraits.py'), 'rb') as fh:
        pv = hashlib.sha1(fh.read()).hexdigest()[:12]
    PIPE = {'no_face_detected', 'multiple_faces', 'face_turned', 'face_tilted', 'face_unclear', 'face_not_upright', 'face_too_small', 'blurry',
            'background_not_separable', 'source_cuts_head', 'unreadable'}
    import re as _re0
    def refused(prev, title):
        """The refusal the last import recorded for this file ('' = none): the pipeline is the same, so is its answer."""
        m = _re0.search(_re0.escape(title) + r': ([a-z_/]+)(?:;|\)|$)', prev or '')
        return m.group(1) if m and not a.fresh and set(m.group(1).split('/')) <= PIPE else ''
    # the accepted cut-out is kept beside the decision, so the pack is written here and the photo is not processed twice
    built_dir = os.path.join(a.sources, '.import-built'); os.makedirs(built_dir, exist_ok=True)
    built_path = lambda ck: os.path.join(built_dir, hashlib.sha1(ck.encode('utf8')).hexdigest() + '.json')   # noqa: E731
    overrides = load(os.path.join(ROOT, 'data', 'visuals', 'portrait-overrides.json'), {})
    auditp = os.path.join(ROOT, 'data', 'visuals', 'portrait-audit.json')
    def run_file(key, c, lenient, known=''):
        """All renditions of one Commons file through the portrait pipeline: ((candidate, image, cache key) | None, reasons)."""
        if known and not lenient:
            return None, known.split('/')
        # the same Commons file may exist in several renditions (640 px first, wider retries later); a wider
        # rendition can reveal a second face the detector rejects, so every rendition on disk is tried
        import glob as _g, re as _re
        stem = _re.sub(r'(-w\d+)?\.jpg$', '', c['file'])
        paths = sorted(_g.glob(os.path.join(a.sources, 'euro', key, stem + '.jpg')) + _g.glob(os.path.join(a.sources, 'euro', key, stem + '-w*.jpg')), key=os.path.getsize, reverse=True)
        if not paths:
            return None, ['unreadable']
        reasons = []
        for path in paths:
            try:
                img = Image.open(path).convert('RGB')
            except Exception:
                reasons.append('unreadable'); continue
            ck = f"{key}/{os.path.basename(path)}|{os.path.getsize(path)}|{pv}" + ('|reviewed' if lenient else '')
            if ck not in cache:
                im, meas = bp.process(t, img, key=os.path.basename(path), strict=not lenient)
                cache[ck] = 'ok' if im is not None else meas.get('reason')
                if im is not None:
                    uri, sha, n = bp.webp_uri(im)
                    meas.update(sha256=sha, bytes=n, skin=bp.skin_tone(im))
                    save(built_path(ck), {'uri': uri, 'meas': meas}, compact=True)
                save(cache_p, cache, compact=True)
            if cache[ck] == 'ok':
                return (c, img, ck), reasons
            reasons.append(cache[ck])
        return None, reasons

    def any_image(key, c):
        import glob as _g, re as _re
        stem = _re.sub(r'(-w\d+)?\.jpg$', '', c['file'])
        for path in sorted(_g.glob(os.path.join(a.sources, 'euro', key, stem + '.jpg')) + _g.glob(os.path.join(a.sources, 'euro', key, stem + '-w*.jpg')), key=os.path.getsize, reverse=True):
            try:
                return Image.open(path).convert('RGB')
            except Exception:
                pass
        return None

    for key in a.clubs.split(','):
        man = load(os.path.join(a.sources, 'euro', key, 'manifest.json'))
        if not man:
            print('no manifest for', key); continue
        squad = load(os.path.join(ROOT, 'data', 'euro', key + '.json'))
        club_he = squad['name_he']; pack = 'eu-' + key
        was = {p['visualId']: E['faces'].get(p['visualId']) for p in E['players'] if p['key'] == key}
        was_un = {p['en']: p.get('reason', '') for p in E['unresolved'] if p['key'] == key}
        had0 = (load(os.path.join(ROOT, 'assets', 'facepacks', pack + '.json')) or {}).get('images', {}); audit0 = load(auditp, {})
        E['players'] = [p for p in E['players'] if p['key'] != key]
        E['unresolved'] = [p for p in E['unresolved'] if p['key'] != key]
        E['faces'] = {k: v for k, v in E['faces'].items() if v['pack'] != pack}
        photos, club_built = {}, {}
        squad_en = {p.get('en') for p in squad['players']}
        listed = {pl['en'] for pl in man['players']}
        # squad members the candidates were not fetched for (the squad changed after the fetch) stay on the fallback
        E['unresolved'] += [{'key': key, 'club': club_he, 'en': p['en'], 'he': p['he'], 'qid': p.get('qid'), 'reason': 'portrait not fetched yet (joined the squad after the last fetch)'}
                            for p in squad['players'] if p.get('en') not in listed]
        for pl in man['players']:
            if pl['en'] not in squad_en:
                print(key, 'skipped (no longer in the squad):', pl['en']); continue
            base = {'key': key, 'club': club_he, 'en': pl['en'], 'he': pl['he']}
            if not pl.get('qid'):
                E['unresolved'].append({**base, 'reason': 'not identified on Wikidata: ' + (pl.get('match') or pl.get('error') or 'unknown')}); continue
            # a player keeps the face he has: the same file, still not rejected on review, its cut-out in the pack
            vid0 = 'wd-' + pl['qid']; pf = None if a.fresh else was.get(vid0)
            c0 = pf and next((c for c in pl.get('candidates', []) if c['title'] == pf['source']['title']), None)
            if c0 and c0['title'] not in REJECT and vid0 in had0 and audit0.get(vid0, {}).get('status') == 'ok' and overrides.get(vid0, {}).get('status') != 'unresolved':
                im0 = any_image(key, c0)
                if im0 is not None:
                    buf = io.BytesIO(); im0.save(buf, 'JPEG', quality=92)
                    photos[vid0] = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
                    E['players'].append({**base, 'visualId': vid0, 'qid': pl['qid'], 'wikidata': pl.get('wikidata'), 'match': pl.get('match')})
                    E['faces'][vid0] = pf
                    continue
            chosen, tried, pending, named, matched = None, [], [], [], None
            prev = was_un.get(pl['en'], '')
            surname = bp_norm(pl.get('label') or pl['en']).split()[-1:] + bp_norm(pl['en']).split()[-1:]
            for c in pl.get('candidates', []):
                # files from the player's Commons category must name him: a category can be shared with, or polluted
                # by, other subjects; the Wikidata main image (P18) is trusted as the person's own picture
                if not (c.get('author') or '').strip() and not str(c.get('license', '')).upper().startswith(('CC0', 'PUBLIC DOMAIN', 'PD')):
                    tried.append(c['title'] + ': no author recorded, so the required attribution cannot be given'); continue
                if c['title'] in REJECT:
                    tried.append(f"{c['title']}: rejected on review ({REJECT[c['title']]['reason']})")
                    if not c.get('fromP18') and 'different person' not in REJECT[c['title']]['reason'] and (c.get('via') in ('category', 'subcat') and any(sn and sn in bp_norm(c['title']) for sn in surname)):
                        named.append(c)   # a poor portrait of the right man still shows his face
                    elif c.get('fromP18'):
                        named.append(c)
                    continue
                acc = ACCEPT.get(c['title'])
                if acc and acc['player'] != pl['en']:
                    acc = None
                # Commons' structured data names who a file shows: "depicts" this player and nobody else is as good as his
                # Wikidata image for knowing whose face it is (the portrait checks still have to pass)
                shown = bool(pl.get('qid')) and c.get('depicts') == [pl.get('qid')]
                if not acc and not shown and not c.get('fromP18') and c.get('via') not in ('category', 'subcat') and c['title'] not in trusted.get(key + '|' + pl['en'], []):
                    tried.append(c['title'] + ': found by name search only, not yet confirmed on review'); pending.append(c); continue
                if not acc and not shown and not c.get('fromP18') and not any(sn and sn in bp_norm(c['title']) for sn in surname):
                    tried.append(c['title'] + ': file name does not name the player'); pending.append(c); continue
                # "Hamad Al Qallaf, Vladimír Coufal CZE-KUW (cropped)": a file named after two people shows either of them
                if not acc and not shown and not c.get('fromP18') and two_names(c['title'], surname):
                    tried.append(c['title'] + ': the file name names more than one person'); pending.append(c); continue
                named.append(c)
                got, reasons = run_file(key, c, bool(acc) and not acc.get('strict'), refused(prev, c['title']))   # identity-only confirmations keep the strict quality checks
                if got:
                    chosen = got; break
                tried.append(f"{c['title']}: {'/'.join(dict.fromkeys(reasons))}")
            if not chosen and pending and fm.rec:
                # nobody named him in these files, but his face can: compare with the pictures that are known to be his
                refs = []
                for c in named:
                    if 'different person' in (REJECT.get(c['title']) or {}).get('reason', ''):
                        continue
                    im0 = any_image(key, c); f = fm.feature(im0) if im0 is not None else None
                    if f is not None:
                        refs.append((c, im0, f))
                for c in pending if refs else []:
                    if c.get('depicts') and pl['qid'] not in c['depicts']:
                        continue   # Commons says who the file shows, and it is somebody else
                    im1 = any_image(key, c); f = fm.feature(im1) if im1 is not None else None
                    if f is None:
                        continue
                    best = max(refs, key=lambda r: fm.cos(f, r[2])); score = fm.cos(f, best[2])
                    if score < (FM_MIN if c.get('via') in ('category', 'subcat') else FM_MIN_SEARCH):
                        continue
                    got, reasons = run_file(key, c, False)
                    if not got:
                        tried.append(f"{c['title']}: his face (similarity {score:.2f}), refused as a portrait: {'/'.join(dict.fromkeys(reasons))}"); continue
                    chosen = got; matched = (best[0]['title'], score)
                    if a.review:
                        os.makedirs(a.review, exist_ok=True)
                        l, r = best[1].copy(), got[1].copy(); l.thumbnail((300, 300)); r.thumbnail((300, 300))
                        sheet = Image.new('RGB', (620, 300), '#202020'); sheet.paste(l, (0, 0)); sheet.paste(r, (320, 0))
                        sheet.save(os.path.join(a.review, f"{key}--{bp_norm(pl['en']).replace(' ', '_')}--{score:.2f}.jpg"), quality=85)
                    break
            if not chosen:
                why = 'no freely licensed image on Commons' if not pl.get('candidates') else 'no usable image (' + '; '.join(tried) + ')'
                if pl.get('rejectedFiles'):
                    why += ' · non-free/unsupported files skipped: ' + ', '.join(f"{r['title']} ({r['license']})" for r in pl['rejectedFiles'][:3])
                E['unresolved'].append({**base, 'qid': pl['qid'], 'reason': why}); continue
            c, img, ck = chosen
            vid = 'wd-' + pl['qid']
            club_built[vid] = load(built_path(ck))
            buf = io.BytesIO(); img.save(buf, 'JPEG', quality=92)
            photos[vid] = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
            E['players'].append({**base, 'visualId': vid, 'qid': pl['qid'], 'wikidata': pl.get('wikidata'), 'match': pl.get('match')})
            E['faces'][vid] = {'pack': pack, 'source': {k: c.get(k) for k in SRC_KEYS}, 'fromP18': c.get('fromP18')}
            if c['title'] in ACCEPT:
                E['faces'][vid]['reviewed'] = ACCEPT[c['title']]['reason']
            if matched:
                E['faces'][vid]['reviewed'] = f"the file does not name him; the face is the one in {matched[0]} (similarity {matched[1]:.2f})"
            print(key, pl['en'], '→', c['title'], c.get('license'), flush=True)
        save(os.path.join(ROOT, 'data', 'visuals', 'source-photos', pack + '.json'), {'schema': 1, 'images': photos}, compact=True)
        save(ep, E)
        if photos:
            # faces processed by this pipeline are written now; faces decided by an older cache keep the cut-out the
            # pack already holds, and only the ones it lacks are left for build-portraits.py
            packp = os.path.join(ROOT, 'assets', 'facepacks', pack + '.json')
            had = (load(packp) or {}).get('images', {})
            audit, images, todo = load(auditp, {}), {}, []
            for vid in photos:
                b = club_built.get(vid)
                if overrides.get(vid, {}).get('status') == 'unresolved':
                    audit[vid] = {'pack': pack, 'status': 'unresolved', 'reason': overrides[vid].get('reason', 'manual')}
                elif b:
                    images[vid] = b['uri']; audit[vid] = {**b['meas'], 'pack': pack}
                elif vid in had and audit.get(vid, {}).get('status') == 'ok':
                    images[vid] = had[vid]
                else:
                    todo.append(vid)
            with open(packp, 'w', encoding='utf8') as fh:
                json.dump({'schema': 2, 'frame': [bp.W, bp.H], 'images': images, 'credits': bp.pack_credits({'faces': E['faces']}, images)}, fh, separators=(',', ':'))
            save(auditp, audit)
            print(key, 'pack written:', len(images), 'portraits')
            if todo:
                print(key, 'run: build-portraits.py --only', pack, '--keys', ','.join(todo))
        print(key, 'portraits', sum(1 for p in E['players'] if p['key'] == key), 'unresolved', sum(1 for p in E['unresolved'] if p['key'] == key))

if __name__ == '__main__':
    main()
