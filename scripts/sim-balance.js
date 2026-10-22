// Engine balance harness: plays every Israeli Premier League pairing N times through the real match engine (no week
// flow, no UI) and prints the numbers that decide whether the game feels like football: goals per match, home/draw/away
// split, and how often the weaker side wins, bucketed by the strength gap. Usage: node scripts/sim-balance.js [rounds]
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const rounds=+process.argv[2]||4;
const vc=new VirtualConsole();
const w=new JSDOM(fs.readFileSync(path.join(root,'ligat-haal-manager.html'),'utf8'),{url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true})}}).window;
w.eval("newGame('hbs','בדיקת איזון');G.pressMode='off';G.motion='off';G.paperPop=[]");
const out=w.eval(`(()=>{
  const clubs=G.clubs.slice();const res=[];const gaps={};
  const bucket=d=>d<2?'0-2':d<4?'2-4':d<6?'4-6':d<9?'6-9':'9+';
  for(let r=0;r<${rounds};r++)for(const h of clubs)for(const a of clubs){if(h===a)continue;
    for(const c of [h,a])for(const p of c.players){p.fit=100;p.inj=0;p.susp=0;p.form=0}
    const M=createMatch(h,a,{kind:'league',round:1,label:'x'});const sh=xiStrength(M,h),sa=xiStrength(M,a);runInstant(M);
    const d=sh-sa,b=bucket(Math.abs(d));const g=gaps[b]||(gaps[b]={n:0,strongWin:0,weakWin:0,draw:0,gd:0});g.n++;
    const strongIsHome=d>=0;const sw=strongIsHome?M.gh>M.ga:M.ga>M.gh,ww=strongIsHome?M.ga>M.gh:M.gh>M.ga;if(sw)g.strongWin++;else if(ww)g.weakWin++;else g.draw++;g.gd+=Math.abs(d);
    res.push({gh:M.gh,ga:M.ga,sh:M.shots[h.id],sa:M.shots[a.id],hw:M.gh>M.ga,dr:M.gh===M.ga});
    for(const c of [h,a])for(const p of c.players){p.fit=100;p.inj=0;p.susp=0;p.form=0}
  }
  const n=res.length;const goals=res.reduce((t,x)=>t+x.gh+x.ga,0)/n;const shots=res.reduce((t,x)=>t+x.sh+x.sa,0)/n;
  const dist={};for(const x of res){const k=Math.min(7,x.gh+x.ga);dist[k]=(dist[k]||0)+1}
  const strengths=clubs.map(c=>[c.short,+strength(c).toFixed(1)]).sort((a,b)=>b[1]-a[1]);
  return JSON.stringify({matches:n,goalsPerMatch:+goals.toFixed(2),shotsPerMatch:+shots.toFixed(1),home:+(res.filter(x=>x.hw).length/n*100).toFixed(1),draw:+(res.filter(x=>x.dr).length/n*100).toFixed(1),away:+(res.filter(x=>!x.hw&&!x.dr).length/n*100).toFixed(1),
    totalGoalsDist:Object.fromEntries(Object.entries(dist).map(([k,v])=>[k,+(v/n*100).toFixed(1)])),
    byGap:Object.fromEntries(Object.entries(gaps).sort().map(([k,g])=>[k,{matches:g.n,avgGap:+(g.gd/g.n).toFixed(1),strongerWins:+(g.strongWin/g.n*100).toFixed(1),draws:+(g.draw/g.n*100).toFixed(1),weakerWins:+(g.weakWin/g.n*100).toFixed(1)}])),strengths})})()`);
console.log(JSON.stringify(JSON.parse(out),null,1));
w.close();
