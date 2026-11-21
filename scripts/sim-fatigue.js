#!/usr/bin/env node
/* What do tired legs cost in the beginner career? Run on the built beginner.html (npm run build first).

   node scripts/sim-fatigue.js match  [club] [matches] [levels]   the coach's eleven starts every match at each fitness level against a
                                                                  fresh opponent: points a match, wins, goals (2,400 matches ≈ ±.03)
   node scripts/sim-fatigue.js rating [club] [matches] [points]   the same eleven fresh but D rating points lower: what a point is worth
   node scripts/sim-fatigue.js season [club] [policy]             one season, one line of JSON; policy = off (no fatigue) | none (nobody
                                                                  is ever rested) | fresh (the rest button before every match).
                                                                  One season a process (a jsdom window does not give its memory back):
                                                                  for i in $(seq 40); do node scripts/sim-fatigue.js season mta none; done
   clubs are catalogue keys of the Israeli top division (mta, hbs, mhf, hta, mnt …). */
const fs=require('fs'),path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const [mode='match',key='hta',a3,a4]=process.argv.slice(2),html=fs.readFileSync(path.join(__dirname,'..','beginner.html'),'utf8');
const open=off=>{const w=new JSDOM(html,{url:'https://sim.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:new VirtualConsole(),
  beforeParse(w){Object.assign(w,{__ilmNoSplash:1,__noEnv:1,__noBook:1,__noHalf:1,__noBids:1,__noInjStop:1,__noWindow:1,__noFatigue:off?1:0});if(mode!=='season')w.__noExtras=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
  w.eval(`Bcreate(${JSON.stringify(key)},{name:'בדיקה',league:'il1'});G.penGame=false;Bstate().paperPop=[]`);return w};
if(mode==='season'){const pol=a3||'none',w=open(pol==='off');w.eval('window.__kf=[];window.__lg=[]');
  const step=`(()=>{const b=Bstate(),c=me();b.board=60;b.paperPop=[];BensureXI(c);${pol==='fresh'?'try{BfitFreshen(c)}catch(e){}':''}
    const x=Bextra(),xi=c.lineup.map(id=>c.players.find(p=>p.id===id)).filter(p=>p&&p.pos!=='GK'),kf=xi.reduce((s,p)=>s+(p.fit??100),0)/Math.max(1,xi.length);
    if(x){Bplay();try{BstopBroadcast()}catch(e){}const L=Bstate().live;if(L){L.skip=true;let k=0;while(Bstate().live&&k++<300)Btick(true)}}
    else{window.__kf.push(Math.round(kf));const p0=c.pts;BfinishRound();window.__lg.push(c.pts-p0)}
    document.querySelector('.bdialog')?.remove();document.getElementById('bpack')?.remove();try{closeFrontPage(true)}catch(e){}try{document.getElementById('moClose')?.click()}catch(e){}return x&&x.kind!=='pre'?1:0})()`;
  let mid=0,g=0;while(w.eval('Bstate().round<Bstate().schedule.length&&!Bstate().out')&&g++<90)mid+=w.eval(step);
  const r=JSON.parse(w.eval(`(()=>{const c=me();return JSON.stringify({pts:c.pts,place:Bstandings().findIndex(x=>x.id===c.id)+1,kf:window.__kf,lg:window.__lg})})()`)),sum=f=>r.kf.reduce((s,v,i)=>f(v)?[s[0]+1,s[1]+r.lg[i]]:s,[0,0]),T=sum(v=>v<85),F=sum(v=>v>=85);
  console.log(JSON.stringify({key,pol,pts:r.pts,place:r.place,midweek:mid,tired:T[0],ptsTired:T[1],fresh:F[0],ptsFresh:F[1],kickoff:r.kf.join(' ')}));w.close()}
else{const N=+a3||400,levels=(a4||(mode==='rating'?'0,1.5,3,4.5,6':'100,90,85,80,75,70,65,60')).split(',').map(Number),w=open(false);
  w.eval(`window.__run=function(X,N,rating){const c=me(),ops=G.clubs.filter(x=>x.id!==c.id&&x.league===c.league);let pts=0,gf=0,ga=0,wn=0;
    for(let i=0;i<N;i++){const o=ops[i%ops.length],home=(i/ops.length|0)%2===0;for(const k of [c,o])for(const p of k.players){p.fit=100;p.inj=0;p.susp=0;p.form=0;p.morale=65}
      BensureXI(c);const ids=new Set(c.lineup),xi=c.players.filter(p=>ids.has(p.id));for(const p of xi){if(rating){if(p.pos!=='GK')p.ovr-=X}else p.fit=p.pos==='GK'?Math.round(100-(100-X)*.4):X}
      const M=createMatch(home?c:o,home?o:c,{kind:'friendly',neutral:false});while(!M.done)stepMinute(M);if(rating)for(const p of xi)if(p.pos!=='GK')p.ovr+=X;
      const f=home?M.gh:M.ga,a=home?M.ga:M.gh;gf+=f;ga+=a;if(f>a){pts+=3;wn++}else if(f===a)pts++}
    for(const k of G.clubs)for(const p of k.players){p.fit=100;p.inj=0;p.susp=0}
    return JSON.stringify({[rating?'ratingDown':'fitness']:X,pointsPerMatch:+(pts/N).toFixed(3),winPct:+(wn/N*100).toFixed(1),goalsFor:+(gf/N).toFixed(2),goalsAgainst:+(ga/N).toFixed(2)})}`);
  for(const X of levels)console.log(w.eval(`__run(${X},${N},${mode==='rating'?1:0})`));w.close()}
