// Beginner career: the matches of a season that are not league rounds. A season was a league and, for a few clubs, Europe; a real
// one also has friendlies before it begins, the Toto Cup and the national cup. Covers the draw (who is in, who sits the first
// evening out, when the evenings are, that only the coach's opponent is built), friendlies (nothing counts, they can be skipped),
// a tie played before the league round of its evening (knockout, the gate, the prize, penalties when level), evenings played
// without the coach, a cup won (the final on neutral ground, the trophy, the honour), the next season's draw, a career saved
// before all this, another country's cup, and that drawing a screen changes nothing.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://cups.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__ilmNoSplash=1;w.__noBids=1;w.__noInjStop=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));
const quiet=()=>w.eval("(()=>{Bstate().paperPop=[];try{closeFrontPage(true)}catch(e){}try{closeReveal(true)}catch(e){}document.querySelector('.bdialog')?.remove()})()");
const fresh=(key,lg)=>{w.eval(`(()=>{document.querySelector('.bdialog')?.remove();localStorage.removeItem(BK);localStorage.removeItem(BK+'.backup');G=null;BsaveRev=0;Bcreate(${JSON.stringify(key)},{name:'דני',league:${JSON.stringify(lg)}});G.penGame=false})()`);quiet()};
// the match that is next, ended at a given score for the coach's club
const play=res=>w.eval(`(()=>{document.querySelector('.bdialog')?.remove();Bplay();const M=Bstate().live.M,home=M.h===G.me,r=${JSON.stringify(res)};window.__M=M;M.m=90;M.done=true;M.gh=home?r[0]:r[1];M.ga=home?r[1]:r[0];Btick(true)})()`);
// league rounds up to a round; a match that is not a league round and comes first is played and won
const advance=n=>{let g=0;while(run('Bstate().round')<n&&g++<80){if(run('!!Bextra()')){play([2,0]);if($('#moClose'))$('#moClose').click()}else w.eval('BfinishRound()');quiet()}};
try{
  fresh('hrg','il1');   // the weakest club of the top division: it sits no evening out and plays no European night
  const b0=run('({pre:Bstate().pre,toto:Bstate().cups.toto,state:Bstate().cups.state,mine:me().bkey,n:Bstate().schedule.length,lg:Bstate().league.map(id=>club(id).bkey),season:Bstate().season})');
  // ---- friendlies: two, from abroad, one at home and one away
  assert.equal(b0.pre.list.length,2);assert.deepEqual(b0.pre.list.map(x=>x.home),[true,false]);assert.ok(run('Bstate().pre.list.every(x=>club(x.id)&&club(x.id).country!==me().country&&!Bstate().league.includes(x.id))'),'clubs from abroad, not of his league');
  // ---- the Toto Cup: the fourteen of his league, the two strongest sit the first evening out, the first evening before the league
  {const K=b0.toto;assert.equal(K.name,'גביע הטוטו');assert.deepEqual(K.alive.slice().sort(),b0.lg.slice().sort());assert.equal(K.bye.length,2);assert.equal(K.ties.length,6);assert.deepEqual(K.names,['שמינית הגמר','רבע הגמר','חצי הגמר','הגמר']);assert.equal(K.at[0],0);assert.ok(K.at.every((x,i)=>!i||x>K.at[i-1]));
   assert.deepEqual(K.bye.slice().sort(),run("Bstate().league.map(id=>club(id)).sort((x,y)=>strength(y)-strength(x)).slice(0,2).map(c=>c.bkey).sort()"),'the two strongest');assert.ok(K.ties.some(t=>t.includes(b0.mine)),'he plays the first evening');assert.equal(K.prize.length,4)}
  // ---- the State Cup: thirty-two — the top division, the second and the two best of the third — and only his opponent is built
  {const K=b0.state,tiers=run("Bstate().cups.state.alive.map(k=>{for(const l of Bcat().find(c=>c.id==='il').leagues)if(l.clubs.some(c=>c.key===k))return l.tier})"),cnt=tiers.reduce((m,t)=>(m[t]=(m[t]||0)+1,m),{});
   assert.equal(K.name,'גביע המדינה');assert.equal(K.alive.length,32);assert.equal(new Set(K.alive).size,32);assert.deepEqual(cnt,{1:14,2:16,3:2});assert.equal(K.ties.length,16);assert.equal(K.bye.length,0);assert.equal(K.names.length,5);assert.equal(K.names[4],'הגמר');
   assert.ok(K.at[0]>=6&&K.at[4]<=b0.n-1&&K.at.every((x,i)=>!i||x>K.at[i-1]),'from a third of the season to its last weeks: '+K.at);assert.ok(K.alive.includes(b0.mine));
   const t=K.ties.find(t=>t.includes(b0.mine));assert.ok(run(`!!BclubByKey(${JSON.stringify(t[0])})&&!!BclubByKey(${JSON.stringify(t[1])})`),'his opponent exists');
   const built=run("Bstate().cups.state.alive.filter(k=>BclubByKey(k)).length");assert.ok(built<=15,'the other clubs of the draw are not built: '+built)}
  // ---- drawing the screens changes nothing
  {const snap=()=>w.eval("JSON.stringify([Bstate().pre,Bstate().cups,G.clubs.length,me().money])"),a=snap();w.eval("Btab='home';Brender();Btab='league';Brender();Btab='home';Brender();Bprematch()");quiet();assert.equal(snap(),a)}
  // ---- a friendly is next: the home panel says so, and it can be skipped
  assert.equal(run('Bextra().kind'),'pre');assert.equal(run('BnextAction()'),'prematch');assert.match($('.amatch-head').textContent,/משחק הכנה/);assert.ok($('.apre-skip'));assert.match($('.astakes').textContent,/התוצאה לא נספרת/);
  assert.equal($$('.bcups .bcups-row').length,3,'friendlies, the Toto Cup, the State Cup');assert.match($('.bcups').textContent,/גביע הטוטו/);assert.match($('.bcups').textContent,/גביע המדינה/);assert.match($('.bcups').textContent,/לפני פתיחת הליגה|שמינית הגמר/);
  $('[data-action="prematch"]').click();assert.match($('.bdialog .beyebrow').textContent,/משחק הכנה · התוצאה לא נספרת/);quiet();
  {const before=run('({money:me().money,xp:Bstate().xpAll,played:Bstate().ct.played||0,board:Bstate().board,P:me().P,led:Bstate().ledger.length})');w.eval("for(const p of me().players)p.bOut=4");
   play([1,1]);assert.deepEqual(run('__M.bX'),{kind:'pre',stage:0});assert.equal(run('__M.pens||null'),null,'a level friendly is a draw');assert.match($('.bdialog .beyebrow').textContent,/משחק הכנה · התוצאה לא נספרת/);assert.match($('.bdialog').textContent,/נשאר עוד משחק הכנה אחד/);
   assert.deepEqual(run('({money:me().money,xp:Bstate().xpAll,played:Bstate().ct.played||0,board:Bstate().board,P:me().P,led:Bstate().ledger.length})'),before,'nothing counts');assert.equal(run('Bstate().round'),0);assert.deepEqual(run('Bstate().pre.list[0].res'),{gf:1,ga:1});
   assert.equal(run('me().players.filter(p=>p.bOut===0).length'),11,'whoever played has had his minutes');assert.equal(run('me().players.filter(p=>p.bOut===4).length'),run('me().players.length')-11,'and nobody is counted as left out');quiet()}
  assert.equal(run('Bextra().kind'),'pre','the second one');$('.apre-skip').click();assert.equal(run('Bstate().pre.skip'),true);
  // ---- the Toto Cup's first evening comes before the league begins
  assert.equal(run('Bextra().kind'),'toto');assert.match($('.amatch-head').textContent,/גביע הטוטו, שמינית הגמר/);assert.match($('.astakes').textContent,/נוקאאוט/);assert.equal($('.apre-skip'),null);
  $('[data-action="prematch"]').click();assert.match($('.bdialog .beyebrow').textContent,/גביע הטוטו · שמינית הגמר · משחק אחד, בתיקו פנדלים/);quiet();
  {const m0=run('me().money'),bd=run('Bstate().board'),home=run('Bextra().pair[0]===G.me');play([2,0]);const K=run('Bstate().cups.toto');
   assert.deepEqual(run('[__M.bX.kind,__M.ctx.ko,!!__M.ctx.neutral]'),['toto',true,false]);assert.equal(K.stage,1);assert.equal(K.alive.length,8);assert.equal(K.res[0].length,6);assert.ok(K.bye.every(k=>K.alive.includes(k)),'who sat out is through');assert.equal(K.ties.length,4);assert.equal(K.out,false);
   assert.equal(run('Bstate().round'),0,'an evening is not a league round');assert.equal(run('me().P'),0);assert.match($('.bdialog').textContent,/עליתם לרבע הגמר/);
   const led=run("Bstate().ledger.filter(x=>/גביע הטוטו/.test(x.label)).map(x=>[x.label,x.amount])");assert.ok(led.some(x=>/פרס גביע הטוטו · עלייה לרבע הגמר/.test(x[0])&&x[1]===100000));assert.equal(led.some(x=>/כרטיסים/.test(x[0])),home,'a gate only at home');
   assert.equal(run('me().money')-m0,led.reduce((s,x)=>s+x[1],0));assert.equal($$('.bdialog .bcl-cash li').length,led.length);assert.equal(run('Bstate().board'),Math.min(100,bd+2));assert.equal(run('Bstate().ct.played'),1,'a cup tie is a match that counts');quiet()}
  assert.equal(run('Bextra()'),null,'now the league');assert.match($('.amatch-head').textContent,/מחזור/);assert.match($('.bcups').textContent,/רבע הגמר: .* מול .* · אחרי מחזור/);
  // ---- knocked out of the quarter-final; the cup goes on and gets its winner
  {const at=run('Bstate().cups.toto.at');advance(at[1]);assert.equal(run('Bextra().kind'),'toto');play([0,1]);const K=run('Bstate().cups.toto');assert.ok(K.out);assert.equal(K.stage,2);assert.match($('.bdialog').textContent,/המסע בגביע הטוטו הסתיים/);quiet();
   w.eval("Btab='home';Brender()");assert.match($('.bcups').textContent,/הודחתם ברבע הגמר/);assert.equal(run('Bextra()'),null);
   // level after ninety minutes: penalties decide a tie
   advance(run('Bstate().cups.state.at[0]'));assert.equal(run('Bextra().kind'),'state');assert.match($('.amatch-head').textContent,/גביע המדינה, שלב 32 האחרונות/);
   const mineKey=b0.mine;w.eval("(()=>{const real=penAutoShootout;window.__pa=real;penAutoShootout=(M,h,a)=>({win:M.h===G.me?'h':'a',score:[5,4]})})()");play([1,1]);w.eval('penAutoShootout=window.__pa');
   assert.match($('.bdialog').textContent,/ניצחון בפנדלים/);assert.match($('.bdialog').textContent,/עליתם לשמינית הגמר/);const S=run('Bstate().cups.state');assert.equal(S.stage,1);assert.equal(S.alive.length,16);assert.ok(S.alive.includes(mineKey));const mr=S.res[0].find(r=>r.h===mineKey||r.a===mineKey);assert.ok(mr.pens&&mr.w===mineKey&&mr.gh===1&&mr.ga===1);quiet();
   assert.equal(run('Bstate().cups.toto.stage'),run('Bstate().round')>=at[2]?(run('Bstate().round')>=at[3]?4:3):2,'the Toto Cup is played on without him')}
  // ---- all the way: the final is on neutral ground and the cup is lifted before anybody reads a score
  {const S0=run('Bstate().cups.state');for(const st of [1,2,3]){advance(S0.at[st]);assert.equal(run('Bextra().kind'),'state','evening '+st);play([2,0]);quiet();assert.equal(run('Bstate().cups.state.stage'),st+1)}
   advance(S0.at[4]);const x=run('({k:Bextra().kind,n:Bextra().neutral,f:Bextra().final})');assert.deepEqual(x,{k:'state',n:true,f:true});w.eval("Btab='home';Brender()");assert.match($('.amatch .atag').textContent,/מגרש ניטרלי/);assert.match($('.astakes').textContent,/הגמר: תשעים דקות מהגביע/);
   $('[data-action="prematch"]').click();assert.doesNotMatch($('.bdialog .beyebrow').textContent,/בתיקו פנדלים/);quiet();const m0=run('me().money');play([3,1]);
   assert.ok($('#reveal.mo'),'the trophy first');assert.match($('#reveal .mo-plate').textContent,/גביע המדינה/);$('#moClose').click();assert.match($('.bdialog').textContent,/גביע המדינה שלכם!/);
   const S=run('Bstate().cups.state');assert.ok(S.won&&!S.out);assert.equal(S.champion,b0.mine);assert.equal(S.stage,5);assert.deepEqual(S.res.map(r=>r.length),[16,8,4,2,1]);assert.equal(run('__M.ctx.neutral'),true);
   assert.equal(run('me().money')-m0,3000000,'the prize, and no gate on neutral ground');assert.ok(run("Bstate().ledger.some(x=>x.label==='פרס הזכייה בגביע המדינה')"));assert.deepEqual(run('Bstate().honours.map(h=>h.what)'),['גביע המדינה']);quiet();
   w.eval("Btab='home';Brender()");assert.match($('.bcups').textContent,/הגביע שלכם!/);assert.equal(run('Bextra()'),null);
   w.eval("Btab='league';Brender()");assert.ok($$('.bcl-ties li').length>=2,'the cups under the table');assert.match($('main').textContent,/הזוכה: /);w.eval("Btab='home';Brender()");
   assert.ok(run("(G.paper||[]).some(s=>/זכתה בגביע המדינה/.test(s.h))"),'and the paper has it')}
  // ---- the season ends with both cups decided; the next one draws them again
  advance(b0.n);assert.equal(run('Bstate().cups.toto.stage'),4);assert.ok(run('!!Bstate().cups.toto.champion'));assert.equal(run('Bextra()'),null);
  w.eval("(()=>{const b=Bstate();b.season++;G.season=b.season;Bseason()})()");{const b1=run('({pre:Bstate().pre,t:Bstate().cups.toto,s:Bstate().cups.state,season:Bstate().season})');
   assert.equal(b1.pre.season,b1.season);assert.equal(b1.pre.list.filter(x=>!x.res).length,2);assert.equal(b1.t.season,b1.season);assert.equal(b1.t.stage,0);assert.equal(b1.s.stage,0);assert.equal(b1.s.won,false);assert.equal(run('Bextra().kind'),'pre')}
  // ---- a career saved before all this gets the cups whose first evening is still ahead
  {const r=run("(()=>{const b=Bstate();b.round=3;delete b.cups;b.pre=null;BcupsEnsure();const a={t:!!b.cups.toto,s:!!b.cups.state,pre:b.pre};delete b.cups;b.round=b.schedule.length-2;BcupsEnsure();return {a,late:{t:!!b.cups.toto,s:!!b.cups.state}}})()");
   assert.deepEqual(r.a,{t:false,s:true,pre:null},'the State Cup has not begun yet, the Toto Cup has');assert.deepEqual(r.late,{t:false,s:false})}
  // ---- a tie nobody watches follows the strengths
  {const q=run("(()=>{const ks=Bcat().find(c=>c.id==='il').leagues,top=ks[0].clubs.slice().sort((x,y)=>y.str-x.str)[0].key,low=ks[2].clubs.slice().sort((x,y)=>x.str-y.str)[0].key;let n=0,ok=true;for(let i=0;i<300;i++){const r=BcupQuick(top,low,false);if(r.w===top)n++;if(r.w!==r.h&&r.w!==r.a)ok=false;if((r.gh===r.ga)!==!!r.pens)ok=false;if((r.gh>r.ga&&r.w!==r.h)||(r.ga>r.gh&&r.w!==r.a))ok=false}return {n,ok,d:BcupStr(top)-BcupStr(low)}})()");
   assert.ok(q.ok);assert.ok(q.n>=200,'the stronger side at home wins most of the time: '+q.n+' of 300 at a gap of '+q.d)}
  // ---- another country: its own cup, no Toto Cup
  {const key=run("Bcat().find(c=>c.id==='en').leagues[0].clubs.slice().sort((x,y)=>x.str-y.str)[0].key");fresh(key,'en1');const c=run('({t:Bstate().cups.toto,s:Bstate().cups.state,pre:Bstate().pre})');
   assert.equal(c.t,null);assert.equal(c.s.name,'הגביע האנגלי');assert.equal(c.s.alive.length,16);assert.equal(c.s.names.length,4);assert.ok(c.pre&&c.pre.list.length===2)}
  console.log('beginner cups: the draw, friendlies (nothing counts, skipped), a Toto Cup tie before the league, knocked out, penalties, the State Cup won on neutral ground, the next season, older careers, the dice, another country; errors',JSON.stringify(errors));
  if(errors.length)process.exitCode=1;
}catch(e){console.error(e);errors.push(String(e&&e.message||e));console.log('beginner cups errors',JSON.stringify(errors.slice(0,3)));process.exitCode=1}
finally{w.close()}
