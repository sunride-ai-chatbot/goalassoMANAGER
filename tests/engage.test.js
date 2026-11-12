// Live play and the screens between matches: touchline shouts, highlights mode, penalties the manager takes himself,
// shoot-outs, the career book (trophies, records, achievements, v13 migration), the envelope, the next-week card and the
// quick draft tournament (which must never touch a stored career).
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
 const w=new JSDOM(fs.readFileSync(path.join(root,'ligat-haal-manager.html'),'utf8'),{url:'https://engage.test/',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
   beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
 const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));const tick=(ms=0)=>new Promise(r=>setTimeout(r,ms));
 // waits are conditions, never fixed sleeps: a garbage-collection pause must not fail the suite
 const until=async(test,what,ms=8000)=>{const t0=Date.now();while(!test()){if(Date.now()-t0>ms)throw new Error('timed out waiting for '+what);await tick(10)}};
 try{
  await w.ILM.ready;for(const s of ['[data-pick="mhf"]','#signBtn','[data-sponsor="0"]','[data-board="none"]'])$(s).click();
  w.eval("G.pressMode='off';G.motion='off';G.sound=false;G.paperPopOff=true;G.paperPop=[];G.replay=false;G.board.conf=99;autoLineups()");

  // ---- engine: shouts move the next six minutes and cost energy; without a shout nothing changes
  const sh=run(`(()=>{const h=me(),a=G.clubs.find(c=>c.id!==G.me);const M=createMatch(h,a,{kind:'league',round:1,label:'x'});M.live=true;stepMinute(M);const base=expGoals(0,0,false,h,a,M);
    const e0=xiPlayers(M,h).filter(x=>x.e.slot!=='GK').map(x=>liveEnergy(M,h,x.p,x.e,M.m));
    shoutStart(M,G.me,'all');const all=expGoals(0,0,false,h,a,M);shoutStart(M,G.me,'calm');const calm=expGoals(0,0,false,h,a,M);shoutStart(M,G.me,'hold');const hold=expGoals(0,0,false,h,a,M);
    shoutStart(M,G.me,'press');const press=expGoals(0,0,false,h,a,M);for(let i=0;i<6;i++)shoutTick(M,h,a);const burn=Object.values(M.burn);
    const e1=xiPlayers(M,h).filter(x=>x.e.slot!=='GK').map(x=>liveEnergy(M,h,x.p,x.e,M.m));const gk=xiPlayers(M,h).find(x=>x.e.slot==='GK');
    M.m+=7;return {base,all,calm,hold,press,after:expGoals(0,0,false,h,a,M),active:!!shoutOf(M,G.me),burn,drop:e0.map((v,i)=>v-e1[i]),gkBurn:M.burn[gk.p.id]||0}})()`);
  assert.ok(sh.all[0]>sh.base[0]+1.2&&sh.all[1]>sh.base[1]+.9,'all forward: chances at both ends');
  assert.ok(sh.calm[1]<sh.base[1]-.4&&sh.calm[0]<sh.base[0],'calm: fewer chances against, a few fewer for');
  assert.ok(sh.hold[0]<sh.base[0]-.4&&sh.hold[1]<sh.base[1]-.4,'hold: little happens at either end');
  assert.ok(sh.press[0]>sh.base[0]+.8&&sh.press[1]>sh.base[1],'press: more for us, a little space behind');
  assert.deepEqual(sh.after,sh.base,'a shout ends after six minutes');assert.equal(sh.active,false);
  assert.ok(sh.burn.length===10&&sh.burn.every(v=>v===3),'pressing burns the ten outfield players');assert.ok(sh.drop.every(v=>v>=2&&v<=4),'the energy bar shows it');assert.equal(sh.gkBurn,0);

  // ---- engine: a penalty of the user's club is parked for the screen, resolved by penResolve, and never lost
  const pen=run(`(()=>{const h=me(),a=G.clubs.find(c=>c.id!==G.me);const M=createMatch(h,a,{kind:'league',round:1,label:'x'});M.live=true;const p=penTaker(M,h);const out={};
    penAward(M,h,a,null);out.auto=M.ev.filter(e=>e.t==='pen'||e.t==='penmiss').length;out.parked0=!!M.pendingPen;
    penAward(M,h,a,{pen:()=>true});out.parked=M.pendingPen&&M.pendingPen.team===G.me&&M.pendingPen.pid===p.id;out.evAfterPark=M.ev.filter(e=>e.t==='pen'||e.t==='penmiss').length;
    const g0=M.gh;M.pendingPen=null;penResolve(M,h,p,'goal','goal');out.goal=M.gh-g0;out.last=M.ev[M.ev.length-1].t;
    penResolve(M,h,p,'miss','save');const e=M.ev[M.ev.length-1];out.miss=[e.t,e.how,e.gk!=null,M.gh-g0];
    const ai=G.clubs.filter(c=>c.id!==G.me);const M2=createMatch(ai[0],ai[1],{kind:'league',round:1,label:'x'});penAward(M2,ai[0],ai[1],{pen:()=>true});out.aiParked=!!M2.pendingPen;
    M.pendingPen={team:G.me,pid:p.id,m:M.m};const n=M.ev.filter(e=>e.t==='pen'||e.t==='penmiss').length;stepMinute(M);out.stale=[M.pendingPen,M.ev.filter(e=>e.t==='pen'||e.t==='penmiss').length-n];return out})()`);
  assert.equal(pen.auto,1);assert.equal(pen.parked0,false);assert.equal(pen.parked,true);assert.equal(pen.evAfterPark,1,'a parked penalty writes no event yet');
  assert.equal(pen.goal,1);assert.equal(pen.last,'pen');assert.deepEqual(pen.miss,['penmiss','save',true,1]);assert.equal(pen.aiParked,false,'AI against AI is never parked');assert.deepEqual(pen.stale,[null,1]);

  // ---- penalty rules: frame, keeper reach, shoot-out arithmetic, sensible odds
  assert.equal(w.eval("penFrame(0,1)"),'in');assert.equal(w.eval("penFrame(3.64,1)"),'post');assert.equal(w.eval("penFrame(3.9,1)"),'off');assert.equal(w.eval("penFrame(1,2.7)"),'off');
  assert.ok(w.eval("penSaveP(3.3,2.1,75)<.15&&penSaveP(0,1,75)>.85&&penSaveP(2,1,90)>penSaveP(2,1,60)"),'corners beat the keeper; a better keeper reaches more');
  assert.ok(w.eval("penWobble(90,100,false)<penWobble(60,100,false)&&penWobble(75,60,false)>penWobble(75,100,false)&&penWobble(75,100,true)>penWobble(75,100,false)"),'the sight sways less for a finisher, more on tired legs and under pressure');
  for(const [h,a,x] of [[[1,1,1],[0,0,0],'h'],[[1,1,0],[0,1],null],[[0,0,0],[1,1,1],'a'],[[1,1,1,1,1],[1,1,1,1,1],null],[[1,1,1,1,1,1],[1,1,1,1,1,0],'h'],[[1,1,1,1,1,1],[1,1,1,1,1],null],[[1,0,1,1,1],[1,1,1,1,0],null]])
   assert.equal(w.eval(`penShootoutDone(${JSON.stringify(h)},${JSON.stringify(a)})`),x,'shoot-out '+JSON.stringify([h,a]));
  const odds=run(`(()=>{const n=3000;let side=0,miss=0,read=0,stay=0;for(let i=0;i<n;i++){if(penKickOutcome(2.9,1.3,74).out==='goal')side++;const s=penAiShot(78);if(penFrame(s.x,s.y)!=='in')miss++;if(penKeepOutcome(-s.x,s.y,penSide(-s.x),'react',74).out==='goal')read++;if(penKeepOutcome(-s.x,s.y,'C','react',74).out==='goal')stay++}return {side:side/n,miss:miss/n,read:read/n,stay:stay/n}})()`);
  assert.ok(odds.side>.72&&odds.side<.93,'a well-placed kick scores about four times in five: '+odds.side);assert.ok(odds.miss>.02&&odds.miss<.14,'AI takers miss the frame now and then: '+odds.miss);
  assert.ok(odds.read<odds.stay-.25,'reading the taker saves far more than standing still');assert.equal(w.eval("penKeepOutcome(2.5,1,'R','late',99).out"),'goal','too late is a goal');
  // the picture wears the match colours: a clash moves the away side to its second kit, and the keeper stands out from both
  const kits=run(`(()=>{const y={id:'y',c1:'#f5d000',c2:'#0038a8'},y2={id:'y2',c1:'#ffd400',c2:'#111111'},r={id:'r',c1:'#d81e2c',c2:'#ffffff'};
    return {plain:penKits(y,r,'r'),clash:penKits(y2,y,'y'),clashHome:penKits(y,y2,'y'),solo:penKits(r,null),far:colDist(penKits(y,r,'r').gkKit,'#f5d000')}})()`);
  assert.deepEqual([kits.plain.kit,kits.plain.trim,kits.plain.oppKit],['#f5d000','#0038a8','#d81e2c'],'taker and defenders in their own colours');assert.ok(kits.far>120,'a yellow side never meets a yellow keeper');
  assert.equal(kits.clash.oppKit,'#f5d000','the home side keeps its shirt');assert.notEqual(kits.clash.kit,'#ffd400','the away side changes');assert.equal(kits.clashHome.kit,'#f5d000');assert.notEqual(kits.clashHome.oppKit,'#ffd400');
  assert.equal(kits.solo.kit,'#d81e2c');assert.ok(kits.solo.oppKit&&kits.solo.gkKit,'a kick without a known keeper still has colours');
  // the kick's clock counts shown frames only; a device that proved too slow for the 3D view gets the flat picture
  assert.deepEqual(run("(()=>{const c=penClock(1000);return [c.tick(1016),c.tick(1033),c.tick(6033),c.tick(6000),c.ms]})()"),[16,33,133,133,133],'a slow frame adds a tenth of a second at most and time never runs backwards');
  const slow=run(`(()=>{penOverlay({title:'x'});let gone=0;PG.view3d={kind:'3d',reset(){throw new Error('a slow view must not be reused')},dispose(){gone++}};const was=pen3dBad;pen3dBad=true;
    penMakeStage(PG.root.querySelector('#pgView'),'kick',{kit:'#cc0000',gkKit:'#f2b233',number:9}).then(st=>{window.__slowKind=st.kind});pen3dBad=was;return {gone,left:!!PG.view3d}})()`);
  assert.deepEqual(slow,{gone:1,left:false},'the slow 3D view is dropped');await until(()=>w.__slowKind,'the flat stage');assert.equal(w.__slowKind,'2d');w.eval('penClose()');assert.equal($('#penGame'),null);

  // ---- the live screen: shout bar, highlights mode, a penalty through the overlay, a knockout shoot-out
  w.eval(`window.realInterval=setInterval;window.setInterval=fn=>{window.matchTick=fn;return 991};G.penGame=true;G.live=createMatch(me(),G.clubs.find(c=>c.id!==G.me),{kind:'cup',stage:'QF',label:'גביע המדינה · רבע הגמר'});G.live.live=true;startLive(G.live)`);
  assert.equal($$('[data-shout]').length,4);assert.ok($$('[data-shout]').every(b=>b.disabled),'no voice at kick-off');assert.equal($('[data-spx="1"]').classList.contains('on'),true);
  $('#ctrlBtn').click();   // a match opened from a saved state starts paused
  w.eval("window.oldStep=stepMinute;stepMinute=M=>{M.m++;if(M.m>=90)M.done=true}");for(let i=0;i<5;i++)w.matchTick();
  assert.ok(w.eval('G.live.voice')>=100,'the voice fills during play');assert.ok($$('[data-shout]').every(b=>!b.disabled));assert.ok($('#shoutBar').classList.contains('ready'));
  $('[data-shout="press"]').click();assert.equal(w.eval("G.live.shout[G.me].k"),'press');assert.equal(w.eval('G.live.voice'),0);assert.ok($('[data-shout="press"]').classList.contains('on'));assert.ok($$('[data-shout]').every(b=>b.disabled));
  assert.ok($('#ticker').textContent.includes('לחץ!'),'the shout is written to the commentary');
  $('[data-spx="hl"]').click();assert.ok($('.live-view').classList.contains('hl'));assert.equal(w.eval('G.spx'),'hl');$('[data-spx="2"]').click();assert.equal($('.live-view').classList.contains('hl'),false);assert.equal(w.eval('G.spx'),2);
  // a penalty for us: the clock stops, the overlay opens, the result goes back into the match
  w.eval("stepMinute=(M,ui)=>{M.m++;if(!window.penDone&&ui&&ui.pen()){window.penDone=1;M.pendingPen={team:G.me,pid:penTaker(M,me()).id,m:M.m}}}");const m0=w.eval('G.live.m');w.matchTick();
  assert.ok($('#penGame'),'the penalty overlay is up');await until(()=>w.eval('!!(PG&&PG.stage&&PG.fire)'),'the penalty stage');assert.equal(w.eval('PG.stage.kind'),'2d');assert.ok($('.pg-aim'),'the sight');w.matchTick();w.matchTick();assert.equal(w.eval('G.live.m'),m0+1,'the match waits for the kick');
  w.eval("window.rnd0=Math.random;Math.random=()=>.99;PG.fire(2.6,1.2);Math.random=window.rnd0");await until(()=>!$('#penGame')&&w.eval('!G.live.pendingPen'),'the kick to be reported');
  assert.equal($('#penGame'),null);const pe=run("G.live.ev.filter(e=>e.t==='pen'||e.t==='penmiss').map(e=>[e.t,e.how,e.team===G.me])");assert.deepEqual(pe,[['pen','goal',true]]);assert.equal(w.eval('G.live.penMine'),1);assert.equal(w.eval('G.live.pendingPen'),null);
  assert.equal(w.eval('G.live.h===G.me?G.live.gh:G.live.ga'),1);
  // level after ninety minutes in a cup tie: the shoot-out is offered; letting the players decide ends it with a winner and a score
  w.eval("G.live.gh=G.live.ga=1;stepMinute=M=>{M.m=90;M.done=true}");await until(()=>{w.matchTick();return !!$('#pgGo')},'the shoot-out (the clock is released a moment after the penalty)');w.matchTick();
  assert.ok($('#pgGo')&&$('#pgLet'),'shoot-out choice');assert.equal($$('.pg-so-row').length,2);$('#pgLet').click();assert.ok($('#pgDone'),'result panel');
  const so=run("({pens:G.live.pens,dots:[...document.querySelectorAll('.pg-so-row i.in,.pg-so-row i.no')].length})");assert.ok(so.dots>=6,'kicks are shown');$('#pgDone').click();
  const fin=run("({pens:G.live.pens,score:G.live.penScore,btn:document.getElementById('ctrlBtn').textContent,prepared:G.live.finishPrepared})");
  assert.ok(fin.pens==='h'||fin.pens==='a');assert.ok(fin.score&&fin.score[0]!==fin.score[1]&&(fin.score[0]>fin.score[1])===(fin.pens==='h'),'the score matches the winner');assert.equal(fin.btn,'סיכום המשחק');assert.equal(fin.prepared,true);
  w.eval("stepMinute=window.oldStep;window.setInterval=window.realInterval;bcReset();penClose();G.live=null;G.penGame=false;G.view='home';render()");

  // ---- a real week through the live screen: report, the envelope, the next-week card, one button to the next match
  // (weeks without a competitive match of ours are played through first)
  w.eval("for(let g=0;g<16;g++){const nm=myNextMatch();if(nm&&nm.a&&nm.kind!=='friendly')break;G.view='home';render();const t=document.querySelector('#toLineupBtn');if(t){t.click();document.querySelector('#skipBtn').click()}else document.querySelector('#playBtn').click();closeModal();envelopeClose()}");
  assert.ok(w.eval("myNextMatch()&&myNextMatch().a&&myNextMatch().kind!=='friendly'"),'a competitive fixture this week');
  w.eval("G.env=null;G.envS={dry:4};window.setInterval=fn=>{window.matchTick=fn;return 991};G.view='lineup';render();startLive()");assert.ok(w.eval('G.live'),'a live match');
  for(let i=0;i<400&&$('#ctrlBtn').textContent!=='סיכום המשחק';i++){const sk=$('#modal [data-skip]');if(sk)sk.click();const b=$('#ctrlBtn').textContent;if(b==='מחצית שנייה'||b==='המשך')$('#ctrlBtn').click();w.matchTick()}
  assert.equal($('#ctrlBtn').textContent,'סיכום המשחק');const wk=w.eval('G.wk');$('#ctrlBtn').click();assert.equal(w.eval('G.wk'),wk+1,'the week advanced');
  assert.ok($('#reportNext'),'match report');$('#reportNext').click();
  assert.ok($('#envelope'),'after four dry matches an envelope always arrives');const env=run('G.env');assert.equal(env.shown,true);assert.ok(env.title&&env.from&&env.fx.length,'it says what changed');
  assert.ok(w.eval("G.news.some(n=>n.t.startsWith('✉️'))"),'the effect is in the news as well');assert.equal(w.eval('G.envS.dry'),0);
  $('#envSeal').click();assert.ok($('#envelope').classList.contains('open'));$('#envOk').click();assert.equal($('#envelope'),null);
  assert.ok($('.nx'),'next-week card');assert.ok($('#nxGo')&&$('#nxHome'));const hasMatch=w.eval('!!(myNextMatch()&&myNextMatch().a)');$('#nxGo').click();assert.equal($('#modal'),null);assert.equal(w.eval('G.view'),hasMatch?'lineup':'home');
  w.eval("window.setInterval=window.realInterval");
  // never two envelopes in a row
  assert.equal(w.eval("(()=>{let n=0;for(let i=0;i<200;i++){G.envS.dry=0;if(surpriseRoll({h:G.me,a:G.clubs.find(c=>c.id!==G.me).id,gh:2,ga:0,ev:[],ctx:{kind:'league'}}))n++}return n})()"),0);
  assert.equal(w.eval("surpriseRoll({h:G.me,a:G.clubs.find(c=>c.id!==G.me).id,gh:2,ga:0,ev:[],ctx:{kind:'friendly'}})"),null,'friendlies bring nothing');

  // ---- the career book
  w.eval("G.car=null;for(let i=0;i<10;i++){G.board.conf=99;G.view='home';render();const t=document.querySelector('#toLineupBtn');if(t){t.click();document.querySelector('#skipBtn').click()}else document.querySelector('#playBtn').click();closeModal();envelopeClose()}");
  const book=run("(()=>{const rs=G.results.filter(r=>(r.h===G.me||r.a===G.me)&&r.kind!=='friendly').slice(-G.car.n.mp);let w=0,d=0,l=0,gf=0,ga=0,cs=0;for(const r of rs){const f=r.h===G.me?r.gh:r.ga,a=r.h===G.me?r.ga:r.gh;gf+=f;ga+=a;if(f>a)w++;else if(f<a)l++;else d++;if(a===0)cs++}return {n:G.car.n,calc:{mp:rs.length,w,d,l,gf,ga,cs}}})()");
  assert.ok(book.n.mp>=2,'competitive matches were counted');for(const k of ['mp','gf','ga'])assert.equal(book.n[k]||0,book.calc[k],'counter '+k);for(const k of ['w','d','l','cs'])assert.equal(book.n[k]||0,book.calc[k],'counter '+k);
  // a derby win, a late winner and a comeback are read from the match itself
  const marks=run(`(()=>{const C=carEnsure();const b={...C.n};const opp=G.clubs.find(c=>c.id!==G.me&&isDerby(G.me,c.id))||G.clubs.find(c=>c.id!==G.me);const p=me().players.find(x=>x.pos==='FW');
    const M={h:G.me,a:opp.id,gh:2,ga:1,ctx:{kind:'league'},att:0,shoutGoals:1,penMine:1,penSaved:1,motm:{team:G.me,pid:p.id},ev:[{t:'goal',team:opp.id,m:20,pid:1},{t:'sub',team:G.me,m:60,inPid:p.id},{t:'goal',team:G.me,m:70,pid:p.id},{t:'pen',team:G.me,m:88,pid:p.id}]};
    carAfterMatch(M,{});const n=C.n;const d=k=>(n[k]||0)-(b[k]||0);return {w:d('w'),comeback:d('comeback'),late:d('lateW'),sub:d('subGoal'),shout:d('shoutGoal'),pen:d('penScored'),save:d('penSaved'),motm:d('motm'),derby:d('derbyW'),isDerby:isDerby(G.me,opp.id)}})()`);
  assert.deepEqual([marks.w,marks.comeback,marks.late,marks.sub,marks.shout,marks.pen,marks.save,marks.motm],[1,1,1,2,1,1,1,1]);assert.equal(marks.derby,marks.isDerby?1:0);
  const ach=run("(()=>{const defs=achDefs();return {n:defs.length,ids:new Set(defs.map(d=>d.id)).size,done:defs.filter(d=>d.done).map(d=>d.id),bad:defs.filter(d=>d.v>d.g||d.s<1||d.s>3||!d.he||!d.d).length,stars:carStars(),level:carLevel(carStars())}})()");
  assert.ok(ach.n>=50&&ach.ids===ach.n,'achievements have unique ids');assert.equal(ach.bad,0);for(const id of ['comeback','late','pen1','save1','shout','sub'])assert.ok(ach.done.includes(id),'unlocked '+id);
  assert.ok(ach.level.n>=2&&ach.stars>=ach.level.from);assert.ok(w.eval("G.news.some(n=>n.t.startsWith('🏅'))"),'an unlocked achievement is announced');
  // trophies arrive through recordMoment; the season end adds promotion
  const tr=run("(()=>{G.car.tr=[];G.car.n.double=0;recordMoment('cup','גביע המדינה');recordMoment('cup','גביע המדינה');recordMoment('champ','ליגת העל');recordMoment('cup','ליגת האלופות');G.moments.forEach(m=>m.shown=true);return {tr:G.car.tr.map(t=>t.k),double:G.car.n.double,done:achDefs().filter(d=>d.done).map(d=>d.id)}})()");
  assert.deepEqual(tr.tr,['cup','champ','euro']);assert.equal(tr.double,1);for(const id of ['cup','champ','double','euro'])assert.ok(tr.done.includes(id));
  w.eval("G.view='career';render()");assert.ok($('.car-lvn'));assert.equal($$('.shelf .tro').length,3);assert.ok($$('.ach').length>=50);assert.ok($$('.recrow').length>=4);assert.equal(w.eval('G.car.fresh.length'),0,'opening the cabinet clears the "new" mark');
  w.eval("G.view='home';render()");assert.ok($('.car-home'));assert.ok($('[data-goview="career"]'));$('[data-goview="career"]').click();assert.equal(w.eval('G.view'),'career');$('[data-view-home]').click();assert.equal(w.eval('G.view'),'home');
  // v13 migration: a career saved before the book gets its trophies from the manager's history and counters from this season
  const old=w.eval("(()=>{const g=JSON.parse(JSON.stringify(G));delete g.car;g.v=12;g.manager.history=[{season:'2026/27',club:'מכבי חיפה',pos:1,champ:true,cup:true,toto:false,div:'top'},{season:'2027/28',club:'מכבי חיפה',pos:3,champ:false,cup:false,toto:true,div:'top'}];g.moments=[];return JSON.stringify(g)})()");
  assert.equal(w.eval(`installCareer(${JSON.stringify(old)},2)`),true);const mig=run("({v:G.v,from:G.migratedFrom,tr:G.car.tr.map(t=>t.k+':'+t.season),seasons:G.car.n.seasons,mp:G.car.n.mp,best:G.car.rec.bestPos,done:Object.keys(G.car.ach),fresh:G.car.fresh.length,double:G.car.n.double})");
  assert.equal(mig.v,w.eval('SAVE_VERSION'));assert.equal(mig.from,12);assert.deepEqual(mig.tr,['champ:2026/27','cup:2026/27','toto:2027/28']);assert.equal(mig.seasons,2);assert.ok(mig.mp>=2);assert.equal(mig.best.pos,1);assert.equal(mig.double,1);
  for(const id of ['champ','cup','toto','double'])assert.ok(mig.done.includes(id),'backfilled '+id);assert.equal(mig.fresh,0,'old achievements are not announced as new');
  assert.equal(w.eval(`(()=>{const g=JSON.parse(${JSON.stringify(old)});g.v=13;g.car={n:{mp:3},st:{w:0,unb:0,cs:0},rec:{},tr:[],ach:{},fresh:[]};installCareer(JSON.stringify(g),2);return G.car.tr.length})()`),0,'a career that already has a book is left alone');

  // ---- next-week hooks are facts read from the table and the squad
  const hk=run(`(()=>{const C=carEnsure();C.st.w=3;C.rec.bestW=5;const nm=myNextMatch();const p=me().players.find(x=>!x.inj&&!x.susp);me().players.forEach(x=>x.goals=0);p.goals=9;const hs=nextHooks(8);return {keys:hs.map(h=>h.k),streak:(hs.find(h=>h.k==='streak')||{}).html,goal:(hs.find(h=>h.k==='goal')||{}).html,name:fullName(p),html:nextHooksHTML(3),hasMatch:!!(nm&&nm.a)}})()`);
  assert.ok(hk.keys.includes('streak')&&hk.streak.includes('<bdi>3</bdi>')&&hk.streak.includes('<bdi>5</bdi>'));assert.ok(hk.keys.includes('goal')&&hk.goal.includes('<bdi>10</bdi>'));assert.ok(hk.html.includes('class="hooks"'));

  // ---- the quick tournament: a sandbox that never reaches storage
  w.eval("G.view='home';render()");const club0=w.eval('me().name'),uid0=w.eval('uid');$('[data-blitz-open]').click();await until(()=>$('.bz-hero'),'the tournament lobby');
  assert.equal(w.eval('G.blitz'),true);assert.equal(w.eval('SANDBOX'),true);assert.ok($('.bz-hero'));assert.ok($('#top').classList.contains('hide')&&$('#nav').classList.contains('hide'));
  const stored=w.localStorage.getItem('ilm2_s2')||w.localStorage.getItem('ilm2');const keyOf=()=>Object.keys(w.localStorage).filter(k=>/^ilm2/.test(k)).sort().map(k=>k+':'+w.localStorage.getItem(k).length).join('|');const disk=keyOf();
  assert.ok(stored&&!JSON.parse(stored).blitz,'the career was saved before the sandbox opened');
  assert.equal(await w.eval('Promise.resolve(save())'),true);w.eval('emergencyFlush()');assert.equal(keyOf(),disk,'save() writes nothing while the sandbox is on');
  $('[data-bz-form="4-3-3"]').click();const seen=new Set();
  for(let i=0;i<11;i++){const cards=$$('[data-bz-pick]');assert.equal(cards.length,3,'three candidates at pick '+(i+1));const o=run('BLITZ.offer.map(x=>({key:x.key,pos:x.pos,ovr:x.ovr}))');const want=w.eval('BLITZ.slots[BLITZ.picks.length]');
   assert.ok(o.every(x=>x.pos===want&&x.ovr>=73&&!seen.has(x.key)),'candidates fit the slot and are new');assert.equal(new Set(o.map(x=>x.key)).size,3);cards[i%3].click();seen.add(o[i%3].key)}
  const sq=run("({n:me().players.length,fake:me().players.filter(inventedPlayer).length,xi:me().lineup.length,gk:me().players.filter(p=>p.pos==='GK').length,foreign:me().players.filter(p=>p.foreign).length,stage:BLITZ.stage,opp:BLITZ.opp&&BLITZ.opp.name,oppReal:!!(BLITZ.opp&&BLITZ.opp.realSquad),rating:blitzRating(BLITZ.picks),oppStr:strength(BLITZ.opp),bonus:blitzBonus(BLITZ.picks),run:JSON.parse(localStorage.getItem(BLITZ_RUN))})");
  assert.equal(sq.n,16);assert.equal(sq.fake,0,'real players only');assert.equal(sq.xi,11);assert.ok(sq.gk>=2);assert.equal(sq.foreign,0);assert.equal(sq.stage,'cup');assert.ok(sq.opp&&sq.oppReal,'a real club with a real squad');
  assert.ok(sq.oppStr<sq.rating,'the first round is the easiest');assert.ok(sq.bonus>=0&&sq.bonus<=3);assert.equal(sq.run.picks.length,11);assert.equal(sq.run.stage,'cup');
  assert.ok(w.eval("blitzLinks([{from:'א',nat:'x'},{from:'א',nat:'y'},{from:'ב',nat:'y'},{from:'ג',nat:'זר'}])")===3,'same club counts two, same country one');
  // a tie through the live screen: fresh kick-off, highlights by default, the tournament's own ending
  w.eval("window.setInterval=fn=>{window.matchTick=fn;return 991}");$('[data-bz="play"]').click();assert.ok($('.live-view'),'live screen');assert.ok($('.live-view').classList.contains('hl'),'highlights by default');assert.ok(w.eval('G.live.ctx.ko&&G.live.ctx.neutral'));
  w.eval("window.oldStep=stepMinute;stepMinute=M=>{M.m=90;M.done=true;const mine=M.h===G.me;if(mine)M.gh=2;else M.ga=2}");w.matchTick();w.matchTick();assert.equal($('#ctrlBtn').textContent,'המשך');$('#ctrlBtn').click();
  w.eval("stepMinute=window.oldStep;window.setInterval=window.realInterval");
  const r1=run("({stage:BLITZ.stage,round:BLITZ.round,res:BLITZ.res,rec:blitzRec(),live:G.live,results:G.results.length})");assert.equal(r1.stage,'cup');assert.equal(r1.round,1);assert.equal(r1.res[0].won,true);assert.equal(r1.rec.best,1);assert.equal(r1.live,null);
  // leave and come back: the run is offered again; then lose and win runs update the record
  w.eval('blitzExit()');assert.equal(w.eval('SANDBOX'),false);assert.equal(w.eval('me().name'),club0);assert.equal(w.eval('uid'),uid0,'the player-id counter is restored');assert.equal(keyOf(),disk,'the stored career is unchanged');assert.ok($('#nav')&&!$('#nav').classList.contains('hide'));
  $('[data-blitz-open]').click();await until(()=>$('.bz-hero'),'the tournament lobby');assert.ok($('[data-bz="resume"]'),'the saved run is offered');$('[data-bz="resume"]').click();assert.equal(w.eval('BLITZ.stage'),'cup');assert.equal(w.eval('BLITZ.round'),1);assert.equal(w.eval('BLITZ.picks.length'),11);assert.equal(w.eval('me().players.length'),16);
  const play=(won)=>w.eval(`(()=>{blitzSquad();const M=createMatch(me(),BLITZ.opp,{kind:'friendly',neutral:true,ko:true,label:'x'});const mine=M.h===G.me;M.gh=mine?${won?2:0}:${won?0:2};M.ga=mine?${won?0:2}:${won?2:0};M.done=true;G.live=M;blitzAfterMatch(M)})()`);
  play(true);play(true);assert.equal(w.eval('BLITZ.round'),3);play(true);const won=run('({stage:BLITZ.stage,rec:blitzRec(),run:localStorage.getItem(BLITZ_RUN)})');
  assert.equal(won.stage,'won');assert.deepEqual([won.rec.cups,won.rec.runs,won.rec.streak,won.rec.bestStreak,won.rec.finals,won.rec.best],[1,1,1,1,1,4]);assert.equal(won.run,null);assert.ok($('.bz-hero.won'));
  $('[data-bz="again"]').click();$('[data-bz-form="4-4-2"]').click();for(let i=0;i<11;i++)$('[data-bz-pick="0"]').click();play(false);
  const lost=run('({stage:BLITZ.stage,rec:blitzRec()})');assert.equal(lost.stage,'out');assert.deepEqual([lost.rec.cups,lost.rec.runs,lost.rec.streak,lost.rec.bestStreak],[1,2,0,1]);assert.ok($('.bz-hero.out'));
  $('[data-bz="exit"]').click();assert.equal(w.eval('me().name'),club0);assert.equal(keyOf(),disk);
  const bz=run("achDefs().filter(d=>d.cat==='blz').map(d=>[d.id,d.done])");assert.deepEqual(bz.filter(x=>x[1]).map(x=>x[0]).sort(),['blz1','blzfin'],'the tournament record feeds the achievements');
  // from the first screen, with no career at all
  w.eval('G=null;render()');assert.ok($('[data-blitz-open]'),'entry on the club-selection screen');$('[data-blitz-open]').click();await until(()=>$('.bz-hero'),'the tournament lobby');assert.equal(w.eval('BLITZ.career'),null);$('[data-bz="exit"]').click();assert.equal(w.eval('G'),null);assert.ok($('[data-pick]'),'back on the first screen');

  // ---- settings and notifications
  assert.equal(w.eval('notifyState()'),'unsupported','jsdom has no Notification');assert.equal(w.eval("notify('x','y')"),false);
  assert.deepEqual(errors,[]);console.log('engage: shouts, highlights, penalties, shoot-out, career book + v13, envelope, next week, quick tournament; errors',errors);
 }catch(e){console.error(e);console.log('errors',[String(e&&e.message||e)].concat(errors));process.exitCode=1}
 finally{w.close()}
})();
