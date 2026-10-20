#!/usr/bin/env python3
"""Bundle original portrait bytes by roster for on-demand, one-request loading."""
import base64,json,mimetypes
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=ROOT/'data/visuals/players.json';m=json.loads(p.read_text());names={x['he']:x['visualId'] for x in m['players']};groups={}
 for file in sorted((ROOT/'data').glob('*.json')):
  club=json.loads(file.read_text());pack=club['id'];groups[pack]={'schema':1,'images':{}}
  for player in club['players']:
   f=m['faces'][names[player['he']]]
   if 'pack' in f:continue
   f['pack']=pack
   src=ROOT/f['src'];mime=mimetypes.guess_type(src)[0]
   groups[pack]['images'][names[player['he']]]='data:'+mime+';base64,'+base64.b64encode(src.read_bytes()).decode()
 dest=ROOT/'assets/facepacks';dest.mkdir(exist_ok=True)
 for pack,g in groups.items():
  if g['images']:(dest/(pack+'.json')).write_text(json.dumps(g,separators=(',',':'))+'\n')
 p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
 print('Portrait packs:',len(groups),'; total bytes:',sum(f.stat().st_size for f in dest.glob('*.json')))
if __name__=='__main__':main()
