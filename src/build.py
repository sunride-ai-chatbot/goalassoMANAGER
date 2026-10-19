#!/usr/bin/env python3
"""Build ligat-haal-manager.html from src/game.html + data/*.json + data/euro/*.json"""
import json, glob, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
clubs = []
for f in sorted(glob.glob(os.path.join(ROOT, 'data', '*.json'))):
    with open(f, encoding='utf8') as fh:
        clubs.append(json.load(fh))
euro = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'data', 'euro', '*.json'))):
    try:
        with open(f, encoding='utf8') as fh:
            d = json.load(fh)
        if d.get('players'):
            euro[d['name_he']] = [{k: p.get(k) for k in ('he','en','pos','age','nat','value_m')} for p in d['players'] if p.get('he')]
    except Exception as e:
        print('skip', f, e)
src = open(os.path.join(ROOT, 'src', 'game.html'), encoding='utf8').read()
def enc(o):
    return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</script', '<\\/script')
import datetime
def mdate(pattern):
    fs=glob.glob(os.path.join(ROOT,'data',pattern))
    return datetime.date.fromtimestamp(max(os.path.getmtime(f) for f in fs)).strftime('%d.%m.%Y') if fs else None
meta={'israel':{'clubs':len(clubs),'players':sum(len(c['players']) for c in clubs),'date':mdate('*.json')},'euro':{'clubs':len(euro),'players':sum(len(v) for v in euro.values()),'date':mdate('euro/*.json')}}
import base64
splash='data:image/webp;base64,'+base64.b64encode(open(os.path.join(ROOT,'src','splash.webp'),'rb').read()).decode()
src = src.replace('__SPLASH_IMG__', splash)
logo='data:image/webp;base64,'+base64.b64encode(open(os.path.join(ROOT,'src','logo.webp'),'rb').read()).decode()
src = src.replace('__LOGO_IMG__', logo)
out = src.replace('__CLUBS_JSON__', enc(clubs)).replace('__EURO_JSON__', enc(euro)).replace('__DATA_META__', enc(meta))
open(os.path.join(ROOT, 'ligat-haal-manager.html'), 'w', encoding='utf8').write(out)
print('clubs:', len(clubs), 'players:', sum(len(c['players']) for c in clubs), 'euro clubs:', len(euro), 'euro players:', sum(len(v) for v in euro.values()), 'size KB:', len(out.encode('utf8'))//1024)
