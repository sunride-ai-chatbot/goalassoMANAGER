#!/usr/bin/env python3
"""Collect public, explicitly named IFA roster portraits; never guess image IDs.
Source snapshots are cached outside the repo. No facial recognition is used.
"""
import concurrent.futures as cf, subprocess, json, re, html, difflib
from pathlib import Path
from urllib.parse import urljoin, urlparse, parse_qs
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
CACHE=Path('/tmp/goalasso-faces');CACHE.mkdir(exist_ok=True)
BASE='https://www.football.org.il'
TEAMS={'mhf':1005,'mta':1061,'hta':2176,'hbs':2171,'bje':3595,'mnt':1068,'hhf':2170,'bsk':4823,'hje':5981,'mpt':1064,'hrg':2175,'hpt':2173,'iks':2182,'itb':5455}
ROSTER='/?catid=2cf66391-238f-4199-aa04-4c61c7b892a9&itemid=2ae09ded-5019-4c49-bfd5-4458c66f9d24&team_id='
def fetch(url,path):
 if path.exists() and path.stat().st_size>100:return path.read_bytes()
 r=subprocess.run(['curl','-fL','--max-time','35','--retry','1','-sS',url,'-o',str(path)],capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr.decode()[:150])
 return path.read_bytes()
def roster(kv):
 cid,tid=kv;url=BASE+ROSTER+str(tid);s=BeautifulSoup(fetch(url,CACHE/(cid+'.html')),'html.parser');out=[]
 for a in s.select('a[href*="/players/player/"]'):
  im=a.select_one('img');pid=parse_qs(urlparse(a['href']).query).get('player_id',[''])[0]
  if not im or not pid:continue
  out.append({'ifaId':pid,'name':a.get_text(' ',strip=True),'image':urljoin(BASE,im['src']),'profile':urljoin(BASE,a['href']),'club':cid,'roster':url})
 print(cid,len(out),flush=True);return out
if __name__=='__main__':
 out=[]
 with cf.ThreadPoolExecutor(max_workers=4) as ex:
  for rows in ex.map(roster,TEAMS.items()):out+=rows
 (ROOT/'data/visuals/ifa-catalog.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 print('TOTAL',len(out),flush=True)
