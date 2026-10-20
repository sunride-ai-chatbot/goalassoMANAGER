#!/usr/bin/env python3
"""Prepare reviewed portrait metadata (does not alter source photographs).

The checked-in manifest is the production input. This one-off authoring utility
reads a reviewed identity mapping and face rectangles, never matches identities
from appearance. Requires Pillow; production builds need only Python's stdlib.
"""
import argparse, json, hashlib, statistics
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
def main():
 ap=argparse.ArgumentParser();ap.add_argument('mapping');ap.add_argument('bounds');args=ap.parse_args()
 rows=json.loads(Path(args.mapping).read_text());bounds=json.loads(Path(args.bounds).read_text())
 bounds.update({'324307':[45,43,127,150],'305646':[88,63,104,130],'320741':[66,35,113,142],'149340':[35,7,27,29]})
 faces={};players=[]
 for r in rows:
  key='ifa-'+r['ifaId'];asset=r.get('asset','assets/faces/'+key+'.jpg');p=ROOT/asset
  im=Image.open(p);im.load();W,H=im.size;x,y,w,h=bounds[r['ifaId']]
  crop=[round(x-.02*w,1),round(y-.35*h,1),round(w*1.04,1),round(h*1.55,1)]
  cheek=im.convert('RGB').crop((x+w*.2,y+h*.45,x+w*.4,y+h*.66))
  pixels=list(cheek.getdata());skin='#'+''.join(f'{round(statistics.median(a[i] for a in pixels)):02x}' for i in range(3))
  faces[key]={'src':asset,'crop':crop,'size':[W,H],'skin':skin,'sourceName':r['name'],'sourcePage':r['profile'],'sourceImage':r['image'],'checked':'2026-10-20','sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
  players.append({'he':r['he'],'en':r.get('en',''),'visualId':key})
 out={'schema':1,'players':players,'faces':faces}
 (ROOT/'data/visuals/players.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 print(f'{len(players)} roster records / {len(faces)} distinct identities; every source file valid')
if __name__=='__main__':main()
