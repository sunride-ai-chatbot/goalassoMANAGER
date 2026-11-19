// The shared league stands on one promise: two phones play the same match. This suite holds the client to it
// without a server — the catalogue, the players and lgSimulate (src/js/35f-league-sim.js).
//
//  * the same lock and seed give the same match in the full game WITH a career and in the beginner page WITHOUT
//    one, event for event, and leave the career on the first phone exactly as it was;
//  * the catalogue the market shows is the server's price list: every key, every price, every photograph flag;
//  * a penalty stops the match until it is answered, and the answer — not the seed — decides it;
//  * a dearer squad wins more often, training is bounded by a player's ceiling, and a ground makes it worth more.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errs=[];
const open=file=>{const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errs.push(file+': '+e.message)});
 return new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__noExtras=1;w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true})}}).window};
const A=open('ligat-haal-manager.html'),B=open('beginner.html');
const J=(w,code)=>JSON.parse(w.eval(`JSON.stringify(${code})`));
/* two squads of real players by price band, chosen by a seeded generator so both windows pick the same men */
const SETUP=`(lo1,hi1,lo2,hi2)=>{const C=lgCatalog();const squad=(seed,lo,hi)=>{const r=lgRng(seed);const need={GK:2,DF:6,MF:6,FW:4};const sq=[];for(const pos in need){const pool=C.list.filter(e=>e.pos===pos&&e.v>=lo&&e.v<=hi);for(let i=0;i<need[pos];i++){let e,g=0;do{e=pool[Math.floor(r()*pool.length)]}while(sq.some(x=>x.p===e.key)&&g++<50);sq.push({p:e.key,t:0})}}return sq};
  return {home:{team:'אדומים',kit:{c1:'#c8102e',c2:'#ffffff'},ground:0,setup:{formation:'4-4-2',mentality:'att'},squad:squad(1,lo1,hi1)},away:{team:'כחולים',kit:{c1:'#0b3d91',c2:'#ffffff'},ground:0,setup:{},squad:squad(2,lo2,hi2)}}}`;
const PLAY=`(lock,seeds,ans)=>seeds.map(s=>{const fx={seed:s,lock,pens:[]};let r=lgSimulate(fx),g=0;while(r.state==='pen'&&g<8){fx.pens.push({t:r.pen.side,k:ans[g%ans.length][0],d:ans[g%ans.length][1],n:1000+g,done:true});g++;r=lgSimulate(fx)}
  return {s,st:r.state,gh:r.rec&&r.rec.gh,ga:r.rec&&r.rec.ga,d:r.rec&&r.rec.digest,pens:g,ev:r.rec?r.rec.ev.map(e=>e.m+e.t+e.team+e.name):[]}})`;

setTimeout(()=>{try{
 // a career on the first phone, none on the second
 const $=id=>A.document.getElementById(id),click=el=>el.dispatchEvent(new A.MouseEvent('click',{bubbles:true}));
 click(A.document.querySelector('[data-pick="hbs"]'));click($('signBtn'));click(A.document.querySelector('[data-sponsor="0"]'));click(A.document.querySelector('[data-board="none"]'));
 assert.ok(A.eval('G&&G.me')==='hbs','a career is running on the first phone');assert.equal(B.eval('G'),null,'and none on the second');
 const before=A.eval('JSON.stringify([G.me,G.wk,G.season,uid,G.clubs.length,me().players.map(p=>[p.id,p.ovr,p.inj,p.fit,p.goals]),me().lineup,G.injSeq||0])');

 // ---- one engine, one set of data ----
 assert.equal(A.eval('lgSimId()'),B.eval('lgSimId()'),'both pages carry the same engine and the same players');
 assert.match(A.eval('lgSimId()'),/^[0-9a-f]{12}\.[0-9a-f]{8}$/,'the fingerprint was filled in by the build');
 const seeds=Array.from({length:40},(_,i)=>1000+i*37),ans=[['UL','R'],['D','D'],['UR','UR']];
 const lockA=J(A,`(${SETUP})(2e6,5e6,2e6,5e6)`),lockB=J(B,`(${SETUP})(2e6,5e6,2e6,5e6)`);
 assert.deepEqual(lockA,lockB,'the same catalogue on both');
 const ra=J(A,`(${PLAY})(${JSON.stringify(lockA)},${JSON.stringify(seeds)},${JSON.stringify(ans)})`),rb=J(B,`(${PLAY})(${JSON.stringify(lockA)},${JSON.stringify(seeds)},${JSON.stringify(ans)})`);
 for(let i=0;i<ra.length;i++){assert.equal(ra[i].st,'done');let k=0;while(k<ra[i].ev.length&&ra[i].ev[k]===rb[i].ev[k])k++;
  assert.equal(ra[i].d,rb[i].d,`seed ${ra[i].s}: the two phones part at event ${k}: ${ra[i].ev[k]} / ${rb[i].ev[k]}`);assert.equal(ra[i].gh,rb[i].gh);assert.equal(ra[i].ga,rb[i].ga)}
 assert.ok(new Set(ra.map(x=>x.d)).size>=38,'a different seed is a different match');
 const again=J(A,`(${PLAY})(${JSON.stringify(lockA)},${JSON.stringify(seeds.slice(0,6))},${JSON.stringify(ans)})`);
 assert.deepEqual(again.map(x=>x.d),ra.slice(0,6).map(x=>x.d),'and the same seed is the same match, every time it is run');
 const goals=ra.reduce((t,x)=>t+x.gh+x.ga,0)/ra.length;assert.ok(goals>1.6&&goals<4.2,'a football score: '+goals.toFixed(2)+' goals a match');

 // ---- the career was not touched, and the page got its own state back ----
 assert.equal(A.eval('JSON.stringify([G.me,G.wk,G.season,uid,G.clubs.length,me().players.map(p=>[p.id,p.ovr,p.inj,p.fit,p.goals]),me().lineup,G.injSeq||0])'),before,'a league match leaves the career exactly as it was');
 assert.equal(B.eval('G'),null);
 assert.ok(/native code/.test(A.eval('String(Math.random)'))&&/native code/.test(B.eval('String(Math.random)')),'Math.random is the browser\'s own again');
 assert.equal(A.eval('SANDBOX'),false);assert.ok(!A.eval('MP.capture'),'nothing is left marked as a human club');

 // ---- a penalty waits for its answer, and the answer decides it ----
 const withPen=ra.find(x=>x.pens>0);assert.ok(withPen,'some of forty matches have a penalty');
 const stop=J(A,`lgSimulate({seed:${withPen.s},lock:${JSON.stringify(lockA)},pens:[]})`);
 assert.equal(stop.state,'pen');assert.equal(stop.pen.idx,0);assert.ok(stop.pen.m>=1&&stop.pen.m<=90&&stop.pen.taker,'who, when and for whom: '+JSON.stringify(stop.pen));
 assert.ok(stop.rec.ev.every(e=>e.m<=stop.pen.m),'the recording ends at the penalty');
 assert.equal(J(A,`lgSimulate({seed:${withPen.s},lock:${JSON.stringify(lockA)},pens:[{t:'${stop.pen.side}',k:'UL',d:null,done:false}]})`).state,'pen','half an answer is no answer');
 assert.equal(J(A,`lgSimulate({seed:${withPen.s},lock:${JSON.stringify(lockA)},pens:[{t:'${stop.pen.side==='h'?'a':'h'}',k:'UL',d:'R',n:1,done:true}]})`).state,'bad','a penalty for the other side does not fit this match');
 const outcome=(k,d,n)=>J(A,`(()=>{let fx={seed:${withPen.s},lock:${JSON.stringify(lockA)},pens:[{t:'${stop.pen.side}',k:'${k}',d:'${d}',n:${n},done:true}]};const r=lgSimulate(fx);return r.rec.pens[0]})()`);
 const wrongWay=outcome('DL','DR',5);assert.equal(wrongWay.kd,'DL');assert.equal(wrongWay.gd,'DR');
 assert.ok(wrongWay.out==='goal'||wrongWay.how==='post'||wrongWay.how==='off','a keeper sent the wrong way saves nothing: '+JSON.stringify(wrongWay));
 let saved=0,scored=0;for(let n=0;n<60;n++){const o=outcome('DL','DL',n);if(o.how==='save')saved++;if(o.out==='goal')scored++}
 assert.ok(saved>30,'a keeper who goes the right way at the right height usually saves ('+saved+'/60)');
 assert.notEqual(outcome('DL','DL',1).x+'/'+outcome('DL','DL',1).y,outcome('DL','DL',2).x+'/'+outcome('DL','DL',2).y,'the server\'s number, not the seed, places the ball');

 // ---- money buys a better side; training is bounded ----
 const uneven=J(A,`(${SETUP})(6e6,14e6,3e5,9e5)`);
 const ru=J(A,`(${PLAY})(${JSON.stringify(uneven)},${JSON.stringify(seeds)},${JSON.stringify(ans)})`);
 const hw=ru.filter(x=>x.gh>x.ga).length,aw=ru.filter(x=>x.gh<x.ga).length;
 assert.ok(hw>=ru.length*.6&&aw<=ru.length*.2,`the dearer squad wins: ${hw} wins, ${aw} defeats in ${ru.length}`);
 const young=J(A,`(()=>{const e=lgCatalog().list.find(e=>e.age!=null&&e.age<=20&&e.v>1e6&&lgStats(e,0,0).pot-lgStats(e,0,0).ovr>=6);return {key:e.key,s0:lgStats(e,0,0),s3:lgStats(e,3,0),s3g:lgStats(e,3,5),s99:lgStats(e,99,5)}})()`);
 assert.equal(young.s3.ovr,young.s0.ovr+3,'three sessions, three points for a teenager');
 assert.ok(young.s3g.ovr>young.s3.ovr,'a better ground makes the same sessions worth more');
 assert.equal(young.s99.ovr,young.s0.pot,'and nobody is trained past his ceiling');
 const old=J(A,`(()=>{const e=lgCatalog().list.find(e=>e.age>=31);return [lgStats(e,0,0),lgStats(e,12,0)]})()`);
 assert.equal(old[1].ovr,old[0].ovr,'a veteran has no ceiling left to reach');
 assert.equal(A.eval(`lgPlayerId(${JSON.stringify(young.key)})`),B.eval(`lgPlayerId(${JSON.stringify(young.key)})`),'a player is the same player, with the same attributes, on every phone');

 // ---- the catalogue is the server's price list ----
 const seed=fs.readFileSync(path.join(root,'supabase/seed-league-pool.sql'),'utf8');const pool=new Map();
 for(const m of seed.matchAll(/^ \('((?:[^']|'')*)','(?:[^']|'')*',(?:null|'[A-Z]+'),(?:null|\d+),(\d+),(true|false)\)[,;]$/gm))pool.set(m[1].replace(/''/g,"'"),[+m[2],m[3]==='true']);
 assert.ok(pool.size>8000,'the price list was read ('+pool.size+')');
 const cat=J(A,'lgCatalog().list.map(e=>[e.key,e.v,!!playerVisual(lgMakePlayer(e,0,0))])');
 assert.ok(cat.length>7500,'the catalogue is the whole game ('+cat.length+')');
 const noPrice=cat.filter(c=>!pool.has(c[0])),wrong=cat.filter(c=>pool.has(c[0])&&pool.get(c[0])[0]!==c[1]),face=cat.filter(c=>pool.has(c[0])&&pool.get(c[0])[1]!==c[2]);
 assert.deepEqual(noPrice.slice(0,3),[],'every player the market shows has a price on the server');
 assert.deepEqual(wrong.slice(0,3),[],'and it is the price the market shows');
 assert.ok(face.length<=cat.length*.01,'the server knows who has a photograph ('+face.length+' differ)');
 console.log(`league sim: ${ra.length} matches identical on two pages, ${goals.toFixed(2)} goals a match, ${cat.length} catalogue prices equal to the server's`);
}catch(e){errs.push(e.message)}
 console.log('errs',errs);process.exit(errs.length?1:0)},2500);
