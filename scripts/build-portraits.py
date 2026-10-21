#!/usr/bin/env python3
"""Rebuild every player portrait from its verified source photo into one canonical cut-out.

Input   data/visuals/source-photos/<pack>.json   original photos (schema 1: {"images": {visualId: data-uri}})
        data/visuals/players.json                identities (players[].visualId → faces[visualId].pack)
        data/visuals/portrait-overrides.json     manual decisions: {"<visualId>": {"status": "unresolved", "reason": "..."}}
Output  assets/facepacks/<pack>.json             schema 2: {"schema":2,"frame":[W,H],"images":{visualId: "data:image/webp;base64,…"}}
        data/visuals/portrait-audit.json         per-player status, measurements and flags

Canonical frame (every league, every club): W×H = 240×300, transparent background.
  · eye line at y = 36% of H, centred horizontally on the eyes, head upright (roll corrected)
  · eye-to-mouth distance = 12.5% of H, so faces are the same size everywhere
  · the top of the hair never closer than 4.5% of H to the top edge (the head shrinks to fit, it is never cut)
  · the torso fades out over the bottom 18%, so photos that end at different heights look the same
A portrait is rejected (status "unresolved", the game then shows the designed fallback) when the source itself cuts
the head, no single frontal face is found, the face is too small to upscale cleanly, or an override says so.

Needs: pip install "rembg[cpu]" pymatting opencv-python-headless pillow numpy; model files:
  ~/.u2net/isnet-general-use.onnx (rembg downloads it), YuNet face detector path in $YUNET (opencv_zoo
  face_detection_yunet_2023mar.onnx).
Usage:  python3 scripts/build-portraits.py [--only bje,mta] [--debug DIR]
"""
import argparse, base64, io, json, os, sys, hashlib
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 240, 300
EYE_Y, EYE_MOUTH, TOP_MARGIN, FADE_FROM = 0.36, 0.125, 0.045, 0.82
UP = 2                     # processing upscale of the (small) source photos
MAX_UPSCALE = 2.7          # source px → canvas px; beyond this the face is too soft
FADE_EDGE = 10             # px fade where the source photo ends inside the canvas (sides/bottom)

def load_json(p):
    with open(p, encoding='utf8') as fh:
        return json.load(fh)

def decode(uri):
    return Image.open(io.BytesIO(base64.b64decode(uri.split(',', 1)[1]))).convert('RGB')

class Tools:
    def __init__(self):
        from rembg import new_session
        self.seg = new_session('isnet-general-use')
        y = os.environ.get('YUNET') or os.path.join(os.path.expanduser('~'), '.u2net', 'yunet.onnx')
        if not os.path.isfile(y):
            raise SystemExit('YuNet model not found: set $YUNET')
        self.yunet_path = y

    def faces(self, rgb):
        h, w = rgb.shape[:2]
        det = cv2.FaceDetectorYN.create(self.yunet_path, '', (w, h), 0.6, 0.3, 50)
        _, f = det.detect(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
        return [] if f is None else sorted(f.tolist(), key=lambda r: -r[2] * r[3])

    def matte(self, img, model='both'):
        """Background removal: the intersection of a general (ISNet) and a human (U2Net-human) segmentation keeps hair
        detail while dropping posters and props that only one model mistakes for the person; a contrast curve turns the
        soft mask into a clean edge, and foreground estimation removes the studio colour from edge pixels (no halos).
        Closed-form matting was tried and dropped: on skin-coloured studio walls it bled the wall into cheeks and jaw."""
        from rembg import remove, new_session
        from pymatting import estimate_foreground_ml
        if not hasattr(self, 'seg2'):
            self.seg2 = new_session('u2net_human_seg')
        m1 = np.asarray(remove(img, session=self.seg, only_mask=True), np.float64) / 255.0
        m2 = np.asarray(remove(img, session=self.seg2, only_mask=True), np.float64) / 255.0
        coarse = np.minimum(m1, m2) if model == 'both' else (m2 if model == 'u2net' else m1)
        alpha = smooth((coarse - 0.25) / 0.5)
        n, lab, stats, _ = cv2.connectedComponentsWithStats((alpha > 0.5).astype(np.uint8))
        if n > 1:
            keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
            alpha = alpha * cv2.dilate((lab == keep).astype(np.uint8), np.ones((9, 9), np.uint8))
        alpha[alpha < 0.04] = 0
        im = np.asarray(img, np.float64) / 255.0
        return np.clip(estimate_foreground_ml(im, alpha), 0, 1), alpha

def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)

def process(t, src, debug=None, key='', strict=False):
    flags = []
    w0, h0 = src.size
    # small federation photos (~240px) are processed at 2x; larger Commons renditions at their own size
    UP = 2 if max(w0, h0) < 420 else 1
    img = src.resize((w0 * UP, h0 * UP), Image.LANCZOS) if UP != 1 else src
    rgb = np.asarray(img)
    sat = np.asarray(src.convert('HSV'))[..., 1].mean()
    if sat < 18:
        flags.append('greyscale_source')
    faces = t.faces(rgb)
    if not faces:
        return None, {'status': 'unresolved', 'reason': 'no_face_detected', 'flags': flags}
    big = [f for f in faces if f[2] * f[3] >= 0.25 * faces[0][2] * faces[0][3]]
    if len(big) > 1:
        flags.append('multiple_faces')
    # a second face nearly as large as the first makes the subject ambiguous (strict mode rejects it); smaller faces
    # are background people, removed by the person matte
    rival = len(faces) > 1 and faces[1][2] * faces[1][3] >= 0.55 * faces[0][2] * faces[0][3]
    f = faces[0]
    re_, le_, nose, mr, ml = (np.array(f[4:6]), np.array(f[6:8]), np.array(f[8:10]), np.array(f[10:12]), np.array(f[12:14]))
    eye = (re_ + le_) / 2; mouth = (mr + ml) / 2
    d = float(np.linalg.norm(mouth - eye))
    roll = float(np.degrees(np.arctan2(le_[1] - re_[1], le_[0] - re_[0])))
    if abs(roll) > 32:
        return None, {'status': 'unresolved', 'reason': 'face_not_upright', 'flags': flags}
    if strict:
        # candid photos (Commons): one dominant, roughly frontal face only. A second sizeable face could be the
        # wrong person; a turned head (eyes close together relative to eye-mouth distance) is not a portrait.
        if rival:
            return None, {'status': 'unresolved', 'reason': 'multiple_faces', 'flags': flags}
        ed = float(np.linalg.norm(le_ - re_))
        if ed < 0.6 * d:
            return None, {'status': 'unresolved', 'reason': 'face_turned', 'flags': flags}
        if ed > 1.55 * d:   # eyes far apart relative to eye-mouth: head bowed or tilted back
            return None, {'status': 'unresolved', 'reason': 'face_tilted', 'flags': flags}
        if float(f[14]) < 0.8:
            return None, {'status': 'unresolved', 'reason': 'face_unclear', 'flags': flags}
    def background_kept(al):
        # the photo's corners beside/above the head must be empty once the background is removed
        hh_, ww_ = al.shape; yb = int(max(4, eye[1] - 0.6 * d))
        l = al[:yb, :int(0.14 * ww_)]; r = al[:yb, int(0.86 * ww_):]
        return max(float(l.mean()) if l.size else 0, float(r.mean()) if r.size else 0)
    fgc, alpha = t.matte(img)
    if background_kept(alpha) > 0.25:
        return None, {'status': 'unresolved', 'reason': 'background_not_separable', 'flags': flags}
    # upright the head around the eye centre
    R = cv2.getRotationMatrix2D((float(eye[0]), float(eye[1])), roll, 1.0)
    hh, ww = alpha.shape
    rot = lambda a, interp=cv2.INTER_LINEAR: cv2.warpAffine(a, R, (ww, hh), flags=interp, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    alpha_r = rot(alpha.astype(np.float32)); fg_r = np.dstack([rot(fgc[..., i].astype(np.float32)) for i in range(3)])
    cover_r = rot(np.ones((hh, ww), np.float32), cv2.INTER_NEAREST)
    # head top within the face column band
    band = slice(max(0, int(eye[0] - 1.25 * d)), min(ww, int(eye[0] + 1.25 * d)))
    rows = np.where((alpha_r[:, band] > 0.5).any(axis=1))[0]
    top = int(rows.min()) if len(rows) else int(eye[1] - 2 * d)
    # does the source photo itself cut the head? (hair touching the photo's top edge inside the band)
    edge_rows = np.where(cover_r[:, band].sum(axis=1) > 0)[0]
    first = int(edge_rows.min()) if len(edge_rows) else 0
    touch = (alpha_r[first:first + 3, band] > 0.5).mean() if len(edge_rows) else 0
    head_above_eye = float(eye[1] - top)
    hair_tips = False
    if top <= first + 2 and touch > 0.12:
        # The head reaches the photo's top edge. Complete heads in this set measure 1.2-2.2x (median 1.7) the eye-mouth distance above the
        # eyes; at >=1.5x only hair tips can be missing and they are feathered below. Less may hide a clipped
        # skull: rejected.
        if head_above_eye >= 1.5 * d and touch < 0.65:
            hair_tips = True; flags.append('hair_tips_feathered')
        else:
            return None, {'status': 'unresolved', 'reason': 'source_cuts_head', 'flags': flags, 'touch': round(float(touch), 2), 'headAbove': round(head_above_eye / d, 2)}
    S = EYE_MOUTH * H / d
    if EYE_Y * H - S * head_above_eye < TOP_MARGIN * H:
        S = (EYE_Y - TOP_MARGIN) * H / head_above_eye
        flags.append('scaled_for_hair')
    up = S * UP                     # canvas px per original source px
    if up > (1.25 if strict else MAX_UPSCALE):
        return None, {'status': 'unresolved', 'reason': 'face_too_small', 'flags': flags, 'upscale': round(up, 2)}
    A = np.array([[S, 0, W / 2 - S * eye[0]], [0, S, EYE_Y * H - S * eye[1]]], np.float32)
    warp = lambda a, interp=cv2.INTER_AREA if S < 1 else cv2.INTER_CUBIC: cv2.warpAffine(a, A, (W, H), flags=interp, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    a = np.clip(warp(alpha_r), 0, 1); fg = np.clip(np.dstack([warp(fg_r[..., i]) for i in range(3)]), 0, 1)
    cov = warp(cover_r, cv2.INTER_NEAREST)
    # consistent bottom fade + soft fade where the photo ends at the sides/bottom
    y = np.arange(H, dtype=np.float32)[:, None] / H
    a *= 1 - smooth((y - FADE_FROM) / (0.985 - FADE_FROM))
    dist = cv2.distanceTransform((cov > 0.5).astype(np.uint8), cv2.DIST_L2, 3)
    top_band = (np.arange(H)[:, None] < (EYE_Y * H)).repeat(W, 1)
    edge = np.where(top_band, 1.0, smooth(dist / FADE_EDGE))
    a *= edge
    if hair_tips:
        # soft hair edge instead of the photo's straight cut: fade the topmost 7% of the head height
        y0 = EYE_Y * H - S * head_above_eye; span = 0.07 * S * head_above_eye
        a *= smooth((np.arange(H, dtype=np.float32)[:, None] - y0) / max(span, 1.0))
    # photos that end above the torso fade out over the last 16% of what they cover, like every other portrait
    col = cov[:, W // 2] > 0.5
    if col.any():
        cb = int(np.where(col)[0].max())
        if cb < 0.97 * H:
            flags.append('short_source')
            a *= smooth((cb - np.arange(H, dtype=np.float32)[:, None]) / (0.16 * H))
    hair_top = float((EYE_Y * H - S * head_above_eye) / H)
    face_w = float(f[2] * S / W)
    out = np.dstack([fg * 255, a * 255]).round().astype(np.uint8)
    img_out = Image.fromarray(out, 'RGBA')
    if debug:
        img_out.save(os.path.join(debug, key + '.png'))
    meas = {'status': 'ok', 'flags': flags, 'hairTop': round(hair_top, 3), 'faceW': round(face_w, 3), 'upscale': round(up, 2),
            'roll': round(roll, 1), 'score': round(float(f[14]), 2)}
    return img_out, meas

def skin_tone(im):
    """median colour of the cheeks (between the eye line and the mouth), used to tint the illustrated arms in the lineup"""
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    y0, y1 = int((EYE_Y + 0.04) * H), int((EYE_Y + EYE_MOUTH * 0.8) * H)
    patch = np.concatenate([a[y0:y1, int(W * 0.36):int(W * 0.44)].reshape(-1, 4), a[y0:y1, int(W * 0.56):int(W * 0.64)].reshape(-1, 4)])
    patch = patch[patch[:, 3] > 230]
    if not len(patch):
        return None
    r, g, b = np.median(patch[:, :3], axis=0).astype(int)
    return '#%02x%02x%02x' % (r, g, b)

def webp_uri(im):
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=86, method=6, alpha_quality=90)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode(), hashlib.sha256(buf.getvalue()).hexdigest(), len(buf.getvalue())

def pack_credits(V, images):
    """attribution shown in the game for Commons photos: {visualId: {a: author, l: licence, u: file page}}"""
    out = {}
    for k in images:
        src = (V['faces'].get(k) or {}).get('source')
        if src:
            out[k] = {'a': (src.get('author') or src.get('credit') or 'Unknown')[:120], 'l': src.get('license') or '', 'u': src.get('page') or ''}
    return out

def load_identities():
    """Israeli identities (players.json) plus European ones (euro-players.json), as one {faces: {visualId: {pack}}} map"""
    V = load_json(os.path.join(ROOT, 'data', 'visuals', 'players.json'))
    ep = os.path.join(ROOT, 'data', 'visuals', 'euro-players.json')
    if os.path.isfile(ep):
        V['faces'] = {**V['faces'], **load_json(ep)['faces']}
    return V

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--only'); ap.add_argument('--keys'); ap.add_argument('--debug'); ap.add_argument('--skin-only', action='store_true'); ap.add_argument('--apply-overrides', action='store_true')
    a = ap.parse_args()
    V = load_identities()
    ovp = os.path.join(ROOT, 'data', 'visuals', 'portrait-overrides.json')
    overrides = load_json(ovp) if os.path.isfile(ovp) else {}
    if a.apply_overrides:
        # re-apply manual decisions without reprocessing: unresolved faces leave the packs, flags are recorded
        auditp = os.path.join(ROOT, 'data', 'visuals', 'portrait-audit.json'); audit = load_json(auditp)
        for key, ov in overrides.items():
            f = V['faces'].get(key)
            if not f:
                continue
            pp = os.path.join(ROOT, 'assets', 'facepacks', f['pack'] + '.json'); pack = load_json(pp)
            if ov.get('status') == 'unresolved':
                pack['images'].pop(key, None); audit[key] = {'pack': f['pack'], 'status': 'unresolved', 'reason': ov.get('reason', 'manual')}
            elif ov.get('flag') and audit.get(key, {}).get('status') == 'ok':
                fl = audit[key].setdefault('flags', [])
                if ov['flag'] not in fl:
                    fl.append(ov['flag'])
                audit[key]['note'] = ov.get('note', '')
            with open(pp, 'w', encoding='utf8') as fh:
                json.dump(pack, fh, separators=(',', ':'))
        with open(auditp, 'w', encoding='utf8') as fh:
            json.dump(audit, fh, ensure_ascii=False, indent=1, sort_keys=True)
        return
    if a.skin_only:
        auditp = os.path.join(ROOT, 'data', 'visuals', 'portrait-audit.json'); audit = load_json(auditp)
        for f in sorted(os.listdir(os.path.join(ROOT, 'assets', 'facepacks'))):
            for key, uri in load_json(os.path.join(ROOT, 'assets', 'facepacks', f))['images'].items():
                audit.setdefault(key, {})['skin'] = skin_tone(Image.open(io.BytesIO(base64.b64decode(uri.split(',', 1)[1]))))
        with open(auditp, 'w', encoding='utf8') as fh:
            json.dump(audit, fh, ensure_ascii=False, indent=1, sort_keys=True)
        return
    V = load_identities()
    ovp = os.path.join(ROOT, 'data', 'visuals', 'portrait-overrides.json')
    overrides = load_json(ovp) if os.path.isfile(ovp) else {}
    auditp = os.path.join(ROOT, 'data', 'visuals', 'portrait-audit.json')
    audit = load_json(auditp) if os.path.isfile(auditp) else {}
    packs = sorted({f['pack'] for f in V['faces'].values()})
    if a.only:
        packs = [p for p in packs if p in a.only.split(',')]
    if a.debug:
        os.makedirs(a.debug, exist_ok=True)
    t = Tools()
    for pack in packs:
        src = load_json(os.path.join(ROOT, 'data', 'visuals', 'source-photos', pack + '.json'))['images']
        keep_only = set(a.keys.split(',')) if a.keys else None
        out = load_json(os.path.join(ROOT, 'assets', 'facepacks', pack + '.json'))['images'] if keep_only else {}
        for key in sorted(k for k, f in V['faces'].items() if f['pack'] == pack):
            if keep_only is not None and key not in keep_only:
                continue
            out.pop(key, None)
            ov = overrides.get(key, {})
            if key not in src:
                audit[key] = {'pack': pack, 'status': 'unresolved', 'reason': 'no_source_photo'}
                continue
            if ov.get('status') == 'unresolved':
                audit[key] = {'pack': pack, 'status': 'unresolved', 'reason': ov.get('reason', 'manual')}
                continue
            im, meas = process(t, decode(src[key]), a.debug, key)
            meas['pack'] = pack
            if im is not None:
                uri, sha, n = webp_uri(im)
                out[key] = uri; meas['sha256'] = sha; meas['bytes'] = n; meas['skin'] = skin_tone(im)
            audit[key] = meas
            print(pack, key, meas['status'], meas.get('reason', ''), ','.join(meas.get('flags', [])), flush=True)
        with open(os.path.join(ROOT, 'assets', 'facepacks', pack + '.json'), 'w', encoding='utf8') as fh:
            json.dump({'schema': 2, 'frame': [W, H], 'images': out, 'credits': pack_credits(V, out)}, fh, separators=(',', ':'))
        with open(auditp, 'w', encoding='utf8') as fh:
            json.dump(audit, fh, ensure_ascii=False, indent=1, sort_keys=True)

if __name__ == '__main__':
    main()
