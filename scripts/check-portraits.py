#!/usr/bin/env python3
"""Check every shipped portrait (assets/facepacks/*.json) the way a player sees it: whole head, right size, no cuts.

For each cut-out (canonical 240×300 frame, see build-portraits.py) it measures, on the final image itself:
  frame        the image is exactly 240×300 with an alpha channel
  face         exactly one face is found; the eye line sits at 36% of the height and the eye-to-mouth distance is 12.5%
               of the height (same face size everywhere), head upright - i.e. the face is not stretched, shrunk or tilted
  top          the hair does not touch the top edge, and its top is not a straight horizontal cut
  sides        nothing above the shoulders touches the left / right edge (hair or an ear cut by the frame), and there is
               no straight vertical cut where the source photo ended
  body         the cut-out is one piece and covers a sensible share of the frame (not a sliver, not a full rectangle)
Anything outside the tolerances is listed with its measurement. With --sheets DIR it also writes contact sheets
(every portrait on the game's dark background, inside the same round mask the lineup uses) for a visual review.

Usage: python3 scripts/check-portraits.py [--only eu-ajax,bje] [--sheets DIR] [--json report.json]
Needs: opencv-python-headless pillow numpy and the YuNet model ($YUNET or ~/.u2net/yunet.onnx).
"""
import argparse, base64, io, json, os
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 240, 300
EYE_Y, EYE_MOUTH = 0.36, 0.125


def decode(uri):
    return Image.open(io.BytesIO(base64.b64decode(uri.split(',', 1)[1])))


def longest_run(mask):
    best = cur = 0
    for v in mask:
        cur = cur + 1 if v else 0
        best = max(best, cur)
    return best


def check(im, det):
    """→ (problems, measurements) for one final cut-out."""
    out, m = [], {}
    if im.size != (W, H) or im.mode != 'RGBA':
        return ['frame %sx%s %s' % (im.size[0], im.size[1], im.mode)], m
    px = np.asarray(im); a = px[..., 3].astype(np.float32) / 255
    solid = a > 0.5
    m['cover'] = round(float(solid.mean()), 3)
    if m['cover'] < 0.16:
        out.append('sliver: only %.0f%% of the frame is filled' % (m['cover'] * 100))
    if m['cover'] > 0.80:
        out.append('background kept: %.0f%% of the frame is filled' % (m['cover'] * 100))
    # the face, measured on the image composited over the game's dark panel
    comp = (px[..., :3].astype(np.float32) * a[..., None] + np.array([11, 21, 32], np.float32) * (1 - a[..., None])).astype(np.uint8)
    det.setInputSize((W, H))
    _, faces = det.detect(cv2.cvtColor(comp, cv2.COLOR_RGB2BGR))
    faces = [] if faces is None else sorted(faces.tolist(), key=lambda r: -r[2] * r[3])
    big = [f for f in faces if f[2] * f[3] >= 0.4 * faces[0][2] * faces[0][3]]
    if not faces:
        out.append('no face found in the final image')
        eye_y, chin_y = EYE_Y * H, (EYE_Y + 2 * EYE_MOUTH) * H
    else:
        if len(big) > 1:
            out.append('%d faces in the frame' % len(big))
        f = faces[0]
        re_, le_, mr, ml = np.array(f[4:6]), np.array(f[6:8]), np.array(f[10:12]), np.array(f[12:14])
        eye = (re_ + le_) / 2; mouth = (mr + ml) / 2
        d = float(np.linalg.norm(mouth - eye)); roll = float(np.degrees(np.arctan2(le_[1] - re_[1], le_[0] - re_[0])))
        nose = np.array(f[8:10]); ed = float(np.linalg.norm(le_ - re_)) or 1.0
        # head pose from the five landmarks: where the nose tip sits between the eye line and the mouth (a bowed head
        # pushes it down, a raised chin up), and how far it is from the middle of the eyes (a turned head)
        m.update(pitch=round(float((nose[1] - eye[1]) / max(d, 1e-3)), 3), yaw=round(float(abs(nose[0] - eye[0]) / ed), 3), eyeDist=round(ed / max(d, 1e-3), 3))
        fx, fy, fw, fh = [int(round(v)) for v in f[:4]]
        box = a[max(0, fy):fy + fh, max(0, fx):fx + fw]
        grey = cv2.cvtColor(comp[max(0, fy):fy + fh, max(0, fx):fx + fw], cv2.COLOR_RGB2GRAY).astype(np.float32)
        m.update(eyeY=round(float(eye[1]) / H, 3), eyeMouth=round(d / H, 3), eyeX=round(float(eye[0]) / W, 3), roll=round(roll, 1), score=round(float(f[14]), 2),
                 faceW=round(f[2] / W, 3), faceH=round(f[3] / H, 3), faceAlpha=round(float(box.mean()) if box.size else 0, 3),
                 sharp=round(float(cv2.Laplacian(grey, cv2.CV_32F).var()) if grey.size else 0, 1))
        if m['faceAlpha'] < 0.88:
            out.append('face partly transparent (%.0f%% opaque)' % (m['faceAlpha'] * 100))
        if m['faceH'] < 0.29:
            out.append('small head: face %.0f%% of the height (about 36%% expected)' % (m['faceH'] * 100))
        if m['faceH'] > 0.45:
            out.append('large head: face %.0f%% of the height (about 36%% expected)' % (m['faceH'] * 100))
        if abs(eye[1] / H - EYE_Y) > 0.035:
            out.append('eye line at %.0f%% of the height (36%% expected)' % (eye[1] / H * 100))
        if abs(d / H - EYE_MOUTH) > 0.022:
            out.append('face size: eye-mouth %.1f%% of the height (12.5%% expected)' % (d / H * 100))
        if abs(eye[0] / W - .5) > 0.05:
            out.append('face off centre: eyes at %.0f%% of the width' % (eye[0] / W * 100))
        if abs(roll) > 9:
            out.append('head tilted %.0f°' % roll)
        eye_y, chin_y = float(eye[1]), float(eye[1] + 1.1 * d)   # hair / ears: down to the mouth line (shoulders may reach the sides)
    # top edge: hair touching it, or a straight horizontal cut across the top of the head
    band = solid[:, int(W * .25):int(W * .75)]
    rows = np.where(band.any(axis=1))[0]
    top = int(rows.min()) if len(rows) else H
    m['hairTop'] = round(top / H, 3)
    if top <= 1:
        out.append('hair touches the top edge')
    elif top < 0.03 * H:
        out.append('hair only %d px from the top edge' % top)
    if len(rows):
        flat = longest_run(solid[top + 1] & ~solid[max(0, top - 1)])
        m['flatTop'] = int(flat)
        if flat >= 46:
            out.append('straight cut across the top of the head (%d px)' % flat)
    # side edges above the shoulders
    head_rows = slice(0, int(min(H, chin_y)))
    for name, col in (('left', 0), ('right', W - 1)):
        t = int(solid[head_rows, col].sum() + solid[head_rows, col + (1 if col == 0 else -1)].sum())
        if t >= 4:
            out.append('head or hair touches the %s edge (%d px)' % (name, t))
    # straight vertical cut (the source photo ended beside the head)
    edge = solid[head_rows, 1:] != solid[head_rows, :-1]
    for x in range(4, W - 5):
        run = longest_run(edge[:, x])
        if run >= 42:
            out.append('straight vertical cut at x=%d (%d px)' % (x, run)); break
    # one piece
    n, lab, stats, _ = cv2.connectedComponentsWithStats(solid.astype(np.uint8), 8)
    if n > 2:
        areas = sorted(stats[1:, cv2.CC_STAT_AREA].tolist(), reverse=True)
        if areas[1] > 0.035 * W * H:
            out.append('detached piece in the frame (%d px)' % areas[1])
    return out, m


def sheet(items, path, title, cols=12, tw=120):
    """Contact sheet: each portrait as the lineup shows it (round mask, top 240 px of the frame) with its id."""
    th = tw; pad = 6; lab = 22
    rows = (len(items) + cols - 1) // cols
    img = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + lab + pad) + pad + 26), (16, 26, 38))
    dr = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11); fb = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
    except Exception:  # noqa: BLE001
        font = fb = ImageFont.load_default()
    dr.text((pad, 5), title, fill=(230, 236, 244), font=fb)
    mask = Image.new('L', (tw, th), 0); ImageDraw.Draw(mask).ellipse((0, 0, tw - 1, th - 1), fill=255)
    for i, (key, im, bad) in enumerate(items):
        x = pad + (i % cols) * (tw + pad); y = 26 + pad + (i // cols) * (th + lab + pad)
        tile = Image.new('RGB', (tw, th), (38, 56, 74))
        face = im.convert('RGBA').crop((0, 0, W, W)).resize((tw, th), Image.LANCZOS)
        tile.paste(face, (0, 0), face)
        cell = Image.new('RGB', (tw, th), (16, 26, 38)); cell.paste(tile, (0, 0), mask)
        img.paste(cell, (x, y))
        dr.ellipse((x, y, x + tw - 1, y + th - 1), outline=(255, 90, 90) if bad else (255, 255, 255), width=3 if bad else 1)
        dr.text((x + 2, y + th + 3), ('%d %s' % (i + 1, key))[:19], fill=(255, 140, 140) if bad else (170, 184, 200), font=font)
    img.save(path, quality=88)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--only'); ap.add_argument('--sheets'); ap.add_argument('--json'); ap.add_argument('--stats'); ap.add_argument('--per-sheet', type=int, default=72)
    a = ap.parse_args()
    y = os.environ.get('YUNET') or os.path.join(os.path.expanduser('~'), '.u2net', 'yunet.onnx')
    det = cv2.FaceDetectorYN.create(y, '', (W, H), 0.6, 0.3, 20)
    d = os.path.join(ROOT, 'assets', 'facepacks')
    only = set(a.only.split(',')) if a.only else None
    report, items, total, stats = {}, [], 0, {}
    for fn in sorted(os.listdir(d)):
        pack = fn[:-5]
        if not fn.endswith('.json') or (only and pack not in only):
            continue
        data = json.load(open(os.path.join(d, fn), encoding='utf8'))
        for key, uri in data.get('images', {}).items():
            im = decode(uri); im.load()
            probs, meas = check(im, det)
            total += 1
            stats[key] = {'pack': pack, **meas}
            if probs:
                report[key] = {'pack': pack, 'problems': probs, **meas}
            if a.sheets:
                items.append((key.replace('wd-', '').replace('ifa-', ''), im, bool(probs), pack))
    if a.sheets:
        os.makedirs(a.sheets, exist_ok=True)
        n = a.per_sheet
        for i in range(0, len(items), n):
            chunk = items[i:i + n]
            sheet([(k, im, bad) for k, im, bad, _ in chunk], os.path.join(a.sheets, 'sheet-%03d.jpg' % (i // n)),
                  '%d-%d of %d · %s … %s' % (i + 1, i + len(chunk), len(items), chunk[0][3], chunk[-1][3]))
    if a.json:
        with open(a.json, 'w', encoding='utf8') as fh:
            json.dump(report, fh, ensure_ascii=False, indent=1, sort_keys=True)
    if a.stats:
        with open(a.stats, 'w', encoding='utf8') as fh:
            json.dump(stats, fh, ensure_ascii=False, separators=(',', ':'))
    print('%d portraits checked, %d with findings' % (total, len(report)))
    for key, r in sorted(report.items(), key=lambda kv: kv[1]['pack']):
        print(' ', r['pack'], key, '·', '; '.join(r['problems']))


if __name__ == '__main__':
    main()
