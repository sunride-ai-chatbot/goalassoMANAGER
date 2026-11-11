#!/usr/bin/env python3
"""Generate the first-person clips of data/config/video-prompts.json with the xAI video API (GitHub Actions).

  POST https://api.x.ai/v1/videos/generations   {model, prompt, duration, aspect_ratio, resolution, generate_audio}
  GET  https://api.x.ai/v1/videos/{request_id}  until status is "done" (→ video.url, a temporary link) or "failed"
The key comes from $XAI_API_KEY (a repository secret); it is never printed. Each clip is saved as <out>/<id>.mp4 with a
manifest (prompt, model, date), so the review can see exactly what produced it. Nothing here touches the game: the clips
are reviewed on the `video-sources` branch and only then copied to assets/fpv/.

Usage: python3 scripts/grok-video.py --out DIR [--only id1,id2] [--model grok-imagine-video-1.5] [--resolution 720p] [--audio]
Standard library only.
"""
import argparse, json, os, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = 'https://api.x.ai/v1/videos'


def call(method, url, key, body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'User-Agent': 'GOALASSO-video/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read().decode('utf8'))
    except urllib.error.HTTPError as e:
        raise RuntimeError('HTTP %s: %s' % (e.code, e.read().decode('utf8', 'replace')[:400]))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', required=True); ap.add_argument('--only', default=''); ap.add_argument('--model', default='grok-imagine-video-1.5')
    ap.add_argument('--resolution', default='720p'); ap.add_argument('--audio', action='store_true'); ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    cfg = json.load(open(os.path.join(ROOT, 'data', 'config', 'video-prompts.json'), encoding='utf8'))
    only = set(filter(None, a.only.split(',')))
    clips = [c for c in cfg['clips'] if not only or c['id'] in only]
    if a.dry_run:
        for c in clips:
            print(c['id'], c['seconds'], 's ·', (cfg['style'] + ' ' + c['prompt'])[:110], '…')
        print(len(clips), 'clips,', sum(c['seconds'] for c in clips), 'seconds in total'); return
    key = os.environ.get('XAI_API_KEY', '').strip()
    if not key:
        sys.exit('XAI_API_KEY is not set (add it as a repository secret)')
    os.makedirs(a.out, exist_ok=True)
    mp = os.path.join(a.out, 'manifest.json'); manifest = json.load(open(mp, encoding='utf8')) if os.path.isfile(mp) else {}
    failed = 0
    for c in clips:
        prompt = cfg['style'] + ' ' + c['prompt']
        try:
            start = call('POST', API + '/generations', key, {'model': a.model, 'prompt': prompt, 'duration': c['seconds'], 'aspect_ratio': '9:16',
                                                             'resolution': a.resolution, 'generate_audio': bool(a.audio)})
            rid = start.get('request_id') or start.get('id')
            if not rid:
                raise RuntimeError('no request id in %s' % json.dumps(start)[:300])
            t0 = time.time(); res = {}
            while time.time() - t0 < 900:
                time.sleep(6)
                res = call('GET', API + '/' + rid, key)
                if res.get('status') in ('done', 'failed') or res.get('video', {}).get('url'):
                    break
            url = (res.get('video') or {}).get('url')
            if not url:
                raise RuntimeError('not finished: %s' % json.dumps(res)[:300])
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'GOALASSO-video/1.0'}), timeout=300) as r:
                data = r.read()
            with open(os.path.join(a.out, c['id'] + '.mp4'), 'wb') as fh:
                fh.write(data)
            manifest[c['id']] = {'model': a.model, 'seconds': c['seconds'], 'resolution': a.resolution, 'audio': bool(a.audio), 'prompt': prompt,
                                 'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'bytes': len(data), 'use': c.get('use', '')}
            print(c['id'], 'ok', len(data), 'bytes', flush=True)
        except Exception as e:  # noqa: BLE001
            failed += 1; print(c['id'], 'FAILED:', str(e)[:400], flush=True)
        with open(mp, 'w', encoding='utf8') as fh:
            json.dump(manifest, fh, ensure_ascii=False, indent=1, sort_keys=True)
    print('%d clips written, %d failed' % (len(clips) - failed, failed))


if __name__ == '__main__':
    main()
