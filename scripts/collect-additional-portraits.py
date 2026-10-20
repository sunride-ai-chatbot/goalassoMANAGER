#!/usr/bin/env python3
"""Resolve historical / academy names against explicitly linked official profiles."""
import importlib.util, json, concurrent.futures as cf
from pathlib import Path
from urllib.parse import urljoin, urlparse, parse_qs
from bs4 import BeautifulSoup
spec=importlib.util.spec_from_file_location('collector',Path(__file__).with_name('collect-player-visuals.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def historical(task):
 cid,tid,season=task;url=m.BASE+m.ROSTER+str(tid)+'&season_id='+str(season)
 s=BeautifulSoup(m.fetch(url,m.CACHE/(cid+'-'+str(season)+'.html')),'html.parser');out=[]
 for a in s.select('a[href*="/players/player/"]'):
  im=a.select_one('img');pid=parse_qs(urlparse(a['href']).query).get('player_id',[''])[0]
  if im is not None and pid:
   out.append({'ifaId':pid,'name':a.get_text(' ',strip=True),'image':urljoin(m.BASE,im['src']),'profile':urljoin(m.BASE,a['href']),'club':cid,'roster':url})
 return out
if __name__=='__main__':
 out=[]
 with cf.ThreadPoolExecutor(max_workers=4) as ex:
  for r in ex.map(historical,[(c,t,s) for c,t in m.TEAMS.items() for s in [27,26]]):out+=r
 (m.ROOT/'data/visuals/ifa-historical.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 print('Historical records:',len(out),flush=True)
