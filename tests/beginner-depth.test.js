// Beginner career: what a match day was missing.
// The approach: three buttons (defensive, balanced, attacking) stood on the live screen from the first day and the engine has always
//   read them, but nothing showed which one was in force and no word said what it does — reported as "I press them and nothing happens".
// The captain: the engine gives a side whose captain is on the pitch a little more; the game chose one and never said who.
// A colour for each line of the team (goalkeeper, defence, midfield, attack) round every player, the same wherever he is shown.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://depth.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__noExtras=1;w.__noInjStop=1;w.__ilmNoSplash=1;w.__noEnv=1;w.__noHalf=1;w.__noBids=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));
const quiet=()=>w.eval("(()=>{Bstate().paperPop=[];try{closeFrontPage(true)}catch(e){}try{closeReveal(true)}catch(e){}document.querySelector('.bdialog')?.remove()})()");
const snap=()=>w.eval('JSON.stringify([G.clubs.find(c=>c.id===G.me),Bstate()])');
const pressed=sel=>$$(sel+'[aria-pressed="true"]').map(b=>b.dataset.bmentPre||b.dataset.bmentality);
try{
  w.eval("Bcreate('mta',{name:'דני',league:'il1'})");quiet();w.eval("G.penGame=false;Bstate().cl=null");
  // ---- the approach, before the whistle: the one the match starts with
  w.eval('Bprematch()');assert.equal($$('[data-bment-pre]').length,3);assert.deepEqual(pressed('[data-bment-pre]'),['bal'],'balanced until he says otherwise');assert.match($('.bpre-ment .bment-note').textContent,/מאוזן/);
  const s0=snap();w.eval('Bprematch();Bprematch()');assert.equal(snap(),s0,'drawing the window changes nothing');
  $('[data-bment-pre="att"]').click();assert.equal(run('me().mentality'),'att');assert.deepEqual(pressed('[data-bment-pre]'),['att'],'the window is drawn again with the new one lit');
  assert.match($('.bpre-ment .bment-note').textContent,/התקפי: יוצרים יותר מצבים/);assert.ok($('.bdialog .bdock [data-action="play"]'),'and the whistle is still there');
  // ---- during the match
  w.eval("(()=>{for(const p of me().players){p.inj=0;p.susp=0}Bplay();BstopBroadcast();Bstate().live.paused=true;Brender();window.__M=Bstate().live.M})()");
  assert.deepEqual(pressed('[data-bmentality]'),['att'],'the match starts as he chose, and the button says so');assert.match($('#bmentnote').textContent,/התקפי/);
  assert.deepEqual(run('mentalityAdj(me(),__M)'),[.14,.14]);
  const ev0=run('__M.ev.length');$('[data-bmentality="def"]').click();
  assert.equal(run('__M.liveMent[G.me]'),'def');assert.deepEqual(pressed('[data-bmentality]'),['def'],'a press lights the button');assert.match($('#bmentnote').textContent,/הגנתי: היריבה מגיעה לפחות מצבים/);
  assert.deepEqual(run('mentalityAdj(me(),__M)'),[-.1,-.15],'and the engine plays it');assert.equal(run('__M.ev.length'),ev0+1);assert.equal(run('__M.ev[__M.ev.length-1].txt'),'שינוי גישה: הגנתי');
  assert.match($('#bmatchfeed').textContent,/שינוי גישה: הגנתי/,'the change is a line of the match');
  $('[data-bmentality="def"]').click();assert.equal(run('__M.ev.length'),ev0+1,'the same one again is not a change');
  assert.equal(run('me().mentality'),'att','a change during a match is for that match');
  $('[data-bmentality="bal"]').click();assert.deepEqual(pressed('[data-bmentality]'),['bal']);assert.deepEqual(run('mentalityAdj(me(),__M)'),[0,0]);
  w.eval("delete Bstate().live;Btab='squad';Brender()");quiet();
  // ---- the captain
  const cap=run('me().captain');assert.ok(cap,'a club has a captain');assert.match($('.bcap-line').textContent,new RegExp('הקפטן: '+w.eval(`fullName(me().players.find(p=>p.id===${cap}))`)));
  assert.equal($$('.bformation-player .bcap').length,1,'he wears the band on the board');assert.equal($$('.bplayer .bcap').length,1,'and on his card');
  const next=run('me().players.find(p=>p.id!==me().captain&&me().lineup.includes(p.id)).id'),mor=run(`me().players.find(p=>p.id===${next}).morale??65`);
  w.eval(`Bdetail(${cap})`);assert.equal($('[data-captain]'),null);assert.match($('.bdialog .bcap-line').textContent,/קפטן הקבוצה/);quiet();
  w.eval(`Bdetail(${next})`);assert.ok($(`[data-captain="${next}"]`));$(`[data-captain="${next}"]`).click();
  assert.equal(run('me().captain'),next);assert.equal(run(`me().players.find(p=>p.id===${next}).morale`),Math.min(100,mor+5),'the band lifts him');assert.equal($('.bdialog'),null);
  assert.equal($$('.bformation-player .bcap').length,1);assert.ok($(`.bformation-player[data-lineup-slot="${run(`me().lineup.indexOf(${next})`)}"] .bcap`),'the band moved with it');
  // a captain who is not in the eleven gives the side nothing, and the screen says so
  const sub=run('available(me()).find(p=>!me().lineup.includes(p.id)).id');w.eval(`me().captain=${sub};Brender()`);assert.match($('.bcap-line').textContent,/לא בהרכב/);assert.equal($$('.bformation-player .bcap').length,0);
  w.eval(`me().captain=${next};Brender()`);
  // no captain is appointed in the middle of a match
  w.eval(`(()=>{Bplay();BstopBroadcast();Bstate().live.paused=true;Bdetail(${cap})})()`);assert.equal($('[data-captain]'),null);assert.equal(w.eval(`BsetCaptain(${cap})`),false);quiet();w.eval("delete Bstate().live;Btab='squad';Brender()");
  // ---- a colour for each line of the team
  const byPos=run("['GK','DF','MF','FW'].map(k=>me().players.filter(p=>p.pos===k).length)");
  assert.deepEqual(['GK','DF','MF','FW'].map(k=>$$('.bplayer.bpos-'+k).length),byPos,'every card wears the colour of its player');
  assert.deepEqual($$('.bpos-legend span').map(x=>x.textContent),['שוער','הגנה','קישור','התקפה'].map((t,i)=>w.eval(`POSHE['${['GK','DF','MF','FW'][i]}']`)));assert.equal($$('.bpos-legend span').length,4);
  for(const b of $$('.bformation-player')){const p=run(`(p=>p&&p.pos)(me().players.find(p=>p.id===me().lineup[${b.dataset.lineupSlot}]))`);assert.ok(b.classList.contains('bpos-'+p),'the ring on the board is the player\'s own colour')}
  w.eval('BchooseLineup(5)');assert.ok($$('.bsub-player>.bportrait').length>0&&$$('.bsub-player>.bportrait').every(x=>/\bbpos-(GK|DF|MF|FW)\b/.test(x.className)),'and in the lists');quiet();
  const css=fs.readFileSync(path.join(root,'beginner.html'),'utf8');for(const k of ['GK','DF','MF','FW'])assert.match(css,new RegExp('\\.bpos-'+k+'\\{--pos:#[0-9a-f]{6}\\}'));
  assert.equal(new Set(['GK','DF','MF','FW'].map(k=>css.match(new RegExp('\\.bpos-'+k+'\\{--pos:(#[0-9a-f]{6})'))[1])).size,4,'four different colours');
  // ---- the foreign-player limit refuses a change that adds a foreigner past it, and nothing else
  // reported: "an Israeli for an Israeli, six foreigners in the eleven, and it says מגבלת זרים". The game itself could put a seventh there.
  w.eval("(()=>{const c=me();for(const p of c.players){p.inj=0;p.susp=0;p.foreign=false}BensureXI(c);c.lineup.slice(1,8).forEach(id=>c.players.find(p=>p.id===id).foreign=true);Btab='squad'})()");
  assert.equal(run('BforeignXI(me())'),7,'seven in the eleven, as an older career can hold');
  w.eval('BensureXI(me())');assert.equal(run('BforeignXI(me())'),6,'the game does not keep an eleven over the limit: the weakest foreigner makes way');assert.equal(run('me().lineup.filter(Boolean).length'),11);
  w.eval('Brender()');assert.match($('.bfor-line').textContent,/זרים בהרכב: 6 מתוך 6/);assert.equal($$('.bplayer .bfor').length,7,'a foreigner is marked on his card');
  const isrSlot=run('me().lineup.findIndex((id,i)=>i>0&&!me().players.find(p=>p.id===id).foreign)'),isrIn=run(`available(me()).find(p=>!p.foreign&&p.pos!=='GK'&&!me().lineup.includes(p.id)).id`);
  w.eval(`BchooseLineup(${isrSlot})`);assert.match($('.bdialog .bfor-line').textContent,/זרים בהרכב: 6 מתוך 6 מותרים\. זר נוסף יכול להיכנס רק במקום זר/);
  assert.equal(w.eval(`BsetLineup(${isrIn})`),true,'an Israeli for an Israeli with six foreigners in the eleven');assert.equal(run(`me().lineup[${isrSlot}]`),isrIn);assert.equal($('.bdialog'),null);
  // a seventh is refused, with the reason and his name
  const spare=run(`(p=>{p.foreign=true;return p.id})(available(me()).find(p=>p.pos!=='GK'&&!me().lineup.includes(p.id)))`),isr2=run('me().lineup.findIndex((id,i)=>i>0&&!me().players.find(p=>p.id===id).foreign)');
  w.eval(`BchooseLineup(${isr2})`);assert.ok($(`[data-lineup-in="${spare}"] .bfor`),'and in the list he is chosen from');const keep=run(`me().lineup[${isr2}]`);
  assert.equal(w.eval(`BsetLineup(${spare})`),false);assert.match($('.bdialog').textContent,/מגבלת זרים/);assert.match($('.bdialog').textContent,/רק במקום זר אחר/);assert.equal(run(`me().lineup[${isr2}]`),keep);quiet();
  // a foreigner for a foreigner is always a change that may be made
  const forSlot=run('me().lineup.findIndex((id,i)=>i>0&&me().players.find(p=>p.id===id).foreign)');w.eval(`BchooseLineup(${forSlot})`);assert.equal(w.eval(`BsetLineup(${spare})`),true,'a foreigner in a foreigner\'s place');assert.equal(run('BforeignXI(me())'),6);
  // and with an eleven already over the limit and nobody to repair it with, a change that does not add one still goes through
  w.eval("(()=>{const c=me();for(const p of c.players)p.foreign=true;BensureXI(c)})()");assert.equal(run('BforeignXI(me())'),11);
  const any=run('available(me()).find(p=>p.pos!==\'GK\'&&!me().lineup.includes(p.id)).id');w.eval('BchooseLineup(4)');assert.equal(w.eval(`BsetLineup(${any})`),true);
  w.eval("(()=>{const c=me();for(const p of c.players)p.foreign=false;BensureXI(c);Brender()})()");quiet();
  // =====================================================================================================================
  // ---- fitness that carries from match to match
  const play=()=>w.eval("(()=>{for(const p of me().players){p.inj=0;p.susp=0}Bplay();BstopBroadcast();Bstate().live.skip=true;while(Bstate().live)Btick(true)})()");
  const calm=()=>{quiet();w.eval("document.getElementById('bpack')?.remove();document.getElementById('envelope')?.remove()")};
  const fake=(o,keep)=>JSON.parse(w.eval(`(()=>{const c=me(),ids=c.lineup.slice();if(!${!!keep})for(const p of c.players)p.fit=100;const M={h:c.id,a:-1,m:90,gh:1,ga:0,ev:[],xi:{[c.id]:[{pid:ids[1],since:0},{pid:ids[2],since:60},{pid:ids[0],since:0}]},used:{[c.id]:[ids[3]]},mins:{[c.id]:{[ids[3]]:60}}};Object.assign(M,${JSON.stringify(o||{})});BfitAfter(M);return JSON.stringify(ids.slice(0,5).map(id=>c.players.find(p=>p.id===id).fit))})()`));
  assert.equal(run("slotsFor(me().formation)[0]"),'GK');
  assert.deepEqual(fake(),[90,74,91,83,100],'ninety minutes cost 26, half an hour a third of it, a goalkeeper far less, the bench nothing');
  w.eval('BfitRest(BFIT_WEEK)');assert.deepEqual(run('me().lineup.slice(0,5).map(id=>me().players.find(p=>p.id===id).fit)'),[100,100,100,100,100],'a week gives it back: one match a week leaves nothing to manage');
  assert.deepEqual(fake({bX:{kind:'state',stage:0}}),[100,86,100,94,100],'a cup tie is midweek: only a few days until the league round');
  assert.deepEqual(fake({bCL:0}),[100,86,100,94,100],'and so is a European night');
  assert.deepEqual(fake({bX:{kind:'pre'}}),[100,100,100,100,100],'a friendly has a week after it');
  fake({bX:{kind:'state',stage:0}});assert.equal(fake({bX:{kind:'state',stage:1}},true)[1],74,'a second match in the same week starts lower and ends lower');assert.equal(fake({bX:{kind:'state',stage:2}},true)[1],64);
  w.eval('me().players.find(p=>p.id===me().lineup[1]).fit=40');assert.equal(fake({},true)[1],35,'never under the floor');
  w.eval('Bstate().daily=1');assert.deepEqual(fake(),[100,100,100,100,100],'the daily challenge is not a career');w.eval('delete Bstate().daily');
  assert.ok(run("(p=>{p.fit=66;const a=effOvr(p);p.fit=100;return effOvr(p)-a})(me().players.find(p=>p.id===me().lineup[1]))")>2,'the engine already plays a tired man below his rating');
  // a real round: back near the top by the next one, a line of the calendar, and the numbers under the result
  w.eval("for(const p of me().players)p.fit=100");play();assert.equal($('.bhalf'),null,'a match skipped to the end has no break window');
  assert.ok(run('me().players.every(p=>(p.fit??100)>=97)'),'after a round and its week');assert.equal(run('Bstate().round'),1);
  assert.ok($('.bresult .bstats'),'the numbers stand under the result');assert.ok($$('.bresult .bstat').length>=6);
  assert.match($$('.bresult .bstat')[0].textContent,/בעיטות לשער/);assert.match($('.bresult .bstats').textContent,/החזקת כדור/);
  calm();
  // who is tired is said where the eleven is chosen
  w.eval("(()=>{const c=me();for(const p of c.players)p.fit=100;[3,5,8].forEach((i,k)=>c.players.find(p=>p.id===c.lineup[i]).fit=[66,72,79][k]);Btab='squad';Brender()})()");
  assert.equal($$('.bout-strip.tired li').length,2,'under 75 is tired');assert.equal($$('.bformation-player .bfit-low').length,3,'under 82 is marked on the board');assert.equal($$('.bformation-player .bfit-low.bad').length,2);
  assert.equal($$('.bplayer .bp-mor.low').filter(x=>/עייף/.test(x.textContent)).length,2);
  const s1=snap();w.eval('Brender();Brender();Bprematch();Bprematch()');assert.equal(snap(),s1,'drawing these screens changes nothing');
  assert.equal($$('.blineup-player .bfit-chip').length,3);assert.match($('.bfit-note').textContent,/2 שחקנים בהרכב עייפים/);assert.equal($('.bbrief'),null,'nobody on the staff yet');quiet();
  // ---- the break: a window of its own
  w.__noHalf=0;w.eval("(()=>{for(const p of me().players){p.inj=0;p.susp=0;p.fit=100}Bplay();BstopBroadcast();const L=Bstate().live;while(L.M.m<44)Btick(true);window.__M=L.M;try{Bpitch.hold=0}catch(e){}Btick()})()");
  assert.equal(run('__M.m'),45);assert.ok($('.bdialog .bhalf'),'the break opens its window');assert.equal(run('Bstate().live.paused'),true);assert.ok($$('.bhalf .bstat').length>=6);assert.equal($$('.bhalf [data-bmentality]').length,3);
  assert.equal($$('.bhalf [data-bmentality][aria-pressed="true"]').length,1);const other=run("liveMentality(__M,me())==='def'?'att':'def'");$(`.bhalf [data-bmentality="${other}"]`).click();
  assert.equal(run('liveMentality(__M,me())'),other,'the approach for the second half is chosen there');assert.equal($(`.bhalf [data-bmentality="${other}"]`).getAttribute('aria-pressed'),'true');assert.equal($('.bhalf .bment-live').textContent,$('#bmentnote').textContent);
  assert.ok($('.bhalf .bdock [data-blive="subs"]'));$('[data-bhalf-go]').click();assert.equal($('.bdialog'),null);assert.equal(run('Bstate().live.paused'),false,'and the second half starts from it');
  w.eval("(()=>{Bstate().live.skip=true;while(Bstate().live)Btick(true)})()");w.__noHalf=1;calm();
  // ---- the season's calendar
  assert.deepEqual(run("Bstate().cal.map(x=>[x.k,x.r])"),[['lg',0],['lg',1]],'every match of the club is a line');
  assert.deepEqual(run("(x=>[x.gf,x.ga])(Bstate().cal[1])"),run("(l=>l.h===G.me?[l.gh,l.ga]:[l.ga,l.gh])(Bstate().last)"));
  w.eval("Btab='league';Brender()");assert.equal($$('.bleague-view [role="tab"]').length,2);assert.equal($('.bcal-list'),null);$('[data-leagueview="cal"]').click();
  assert.equal($$('.bcal-row').length,run('Bstate().schedule.length'),'a league round each, and nothing else in a season without cups');assert.equal($$('.bcal-row.past').length,2);
  assert.ok($$('.bcal-row.past .bcal-res b').every(x=>/^(ניצחון|תיקו|הפסד)$/.test(x.textContent)));assert.equal($$('.bcal-row.next').length,1);
  assert.equal($('.bcal-row.next .bcal-op b').textContent,w.eval("club(Bnext().find(id=>id!==G.me)).name"),'the next match is marked');
  const s2=snap();w.eval('Brender();Brender()');assert.equal(snap(),s2);
  $('.bnav [data-tab="league"]').click();assert.equal($('.bcal-list'),null,'the tab opens on the tables');w.eval("Btab='home';Brender()");$('[data-calendar]').click();assert.ok($('.bcal-list'),'the home tile leads to the calendar');
  w.__noExtras=0;w.eval('Bstate().cups=null;BcupsEnsure()');const xs=run("BcalRows().filter(x=>x.k!=='lg').map(x=>[x.k,!!x.maybe,!!(x.op||x.bye),x.at])");w.eval("Bstate().cups=null;Bstate().pre=null");w.__noExtras=1;
  assert.ok(xs.length>=2&&xs.every(x=>x[0]==='state'),'the national cup is in the list: '+JSON.stringify(xs));assert.equal(xs[0][1],false);assert.equal(xs[0][2],true,'the tie that is drawn names the opponent');assert.ok(xs.slice(1).every(x=>x[1]),'later stages are "if you go through"');
  assert.ok(xs.every((x,i)=>!i||x[3]>xs[i-1][3]),'each before the league round it is played ahead of');
  // ---- the people beside the coach
  w.eval("me().money=5e7;Btab='staff';Brender()");assert.equal($$('.bstaff-card').length,5);assert.equal($$('.bstaff-card.on').length,0);assert.equal(run('BstaffPay()'),0);
  const fee=run('BstaffFee(1)'),m0=run('me().money');$('[data-staff-up="asst"]').click();assert.match($('.bdialog').textContent,/להעסיק עוזר מאמן/);$('[data-staff-ok="asst"]').click();
  assert.equal(run("BstaffLv('asst')"),1);assert.equal(run('me().money'),m0-fee,'the signing fee is paid at once');assert.match(run('Bstate().ledger[Bstate().ledger.length-1].label'),/צוות מקצועי · עוזר מאמן/);
  assert.equal($$('.bstaff-card.on').length,1);assert.equal($$('.bstaff-card.on .bstaff-pips i.on').length,1);assert.ok(run('BstaffPay()')>0);
  assert.equal(run("Math.round((Bsum()+Boperating()+BstaffPay())*Bremaining())"),run('Bcommitment()'),'the salary is a running cost like every other');
  w.eval("me().money=0;Brender()");assert.ok($('[data-staff-up="fit"]').disabled);assert.match($('[data-staff-up="fit"]').textContent,/אין מספיק כסף/);assert.equal(w.eval("BstaffHire('fit')"),false);w.eval('me().money=5e7');
  w.eval('Bprematch()');assert.match($('.bbrief').textContent,/עוזר המאמן/);assert.match($('.bbrief').textContent,/התקפי|הגנתי|מאוזן/);quiet();
  w.eval("Bstate().staff={asst:3,fit:2,phys:2,anal:2,scout:1}");
  assert.equal(fake()[1],77,'a fitness coach: a match costs less');w.eval('BfitRest(BFIT_MID)');assert.equal(run('me().players.find(p=>p.id===me().lineup[1]).fit'),90,'and the days between give more');w.eval('for(const p of me().players)p.fit=100');
  const tp=run("me().players.find(p=>p.pos==='MF'&&p.ovr<(p.pot||99)).id"),t0=run(`me().players.find(p=>p.id===${tp}).bTraining||0`);assert.ok(w.eval(`BtrainSolo(${tp})`));assert.equal(run(`me().players.find(p=>p.id===${tp}).bTraining`),t0+3,'the assistant at his third level: an individual session is three steps');
  const dfs=run("me().players.filter(p=>p.pos==='DF'&&p.ovr<(p.pot||99)).map(p=>[p.id,p.bTraining||0])");assert.ok(w.eval("BtrainTeam('DF')"));assert.deepEqual(run("me().players.filter(p=>p.pos==='DF'&&"+JSON.stringify(dfs.map(x=>x[0]))+".includes(p.id)).map(p=>[p.id,p.bTraining])"),dfs.map(x=>[x[0],x[1]+2]),'and a team session two');
  w.eval('Bprematch()');assert.match($('.bbrief').textContent,/האנליסט/);assert.match($('.bbrief').textContent,/\+0\.6/);quiet();
  w.eval("(()=>{for(const p of me().players){p.inj=0;p.susp=0}Bplay();BstopBroadcast();window.__M=Bstate().live.M})()");assert.ok(Math.abs(run('__M.boost[G.me]')-.6)<1e-9,'the analyst: the side arrives prepared');w.eval("delete Bstate().live;Brender()");
  const phys=(lv,inj)=>run(`(()=>{const c=me(),p=c.players[5];Bstate().staff.phys=${lv};p.inj=${inj};const n=Bstate().cal.length;BdepthAfter({h:c.id,a:-1,m:90,gh:0,ga:0,bX:{kind:'pre'},ev:[{t:'inj',team:c.id,pid:p.id}],xi:{[c.id]:[]},used:{[c.id]:[]},mins:{[c.id]:{}}});Bstate().cal.length=n;const v=p.inj;p.inj=0;return v})()`);
  assert.deepEqual([phys(0,3),phys(1,2),phys(1,3),phys(2,2),phys(3,5),phys(3,1)],[3,2,2,1,3,1],'the doctor shortens a long injury, never to nothing');
  const far=run("G.clubs.find(c=>c.id!==G.me&&Bstate().league.includes(c.id)).players[4].id");w.eval(`Bdetail(${far})`);assert.ok($('.bdialog .bpot'),'a scout shows how far a player can go');quiet();
  w.eval("Bstate().staff.scout=0");w.eval(`Bdetail(${far})`);assert.equal($('.bdialog .bpot'),null);quiet();
  w.eval("Bstate().staff={asst:1,fit:1};Btab='staff';Brender()");$('[data-staff-out="fit"]').click();assert.match($('.bdialog').textContent,/לשחרר את מאמן כושר/);$('[data-staff-bye="fit"]').click();assert.equal(run("BstaffLv('fit')"),0);
  w.eval('Bstate().daily=1');assert.equal(run("BstaffLv('asst')"),0);w.eval('delete Bstate().daily');
  play();assert.ok(run("Bstate().ledger.some(l=>l.label==='שכר הצוות המקצועי'&&l.amount<0)"),'the salary is paid a little every round');calm();w.eval("Bstate().staff={}");
  // ---- the envelope
  assert.equal(run('Object.keys(BENV).length'),11);assert.equal(run('Bstate().env||null'),null,'none while the suite keeps them off');
  w.__noEnv=0;w.__envKind='cash';const m1=run('me().money');play();calm();assert.equal(run('Bstate().env.got.k'),'cash');assert.ok(run("Bstate().ledger.some(l=>l.label==='תרומה של אוהד ותיק'&&l.amount>0)"),'what is inside is applied when it arrives');
  w.eval("Btab='home';Brender()");assert.ok($('.benv-banner'),'and waits on the home page');const s3=snap();w.eval('Brender();Brender()');assert.equal(snap(),s3);
  $('[data-env-open]').click();assert.ok($('#envelope'));$('#envSeal').click();assert.equal($('#envLetter').hidden,false);assert.match($('#envLetter').textContent,/תרומה לקופה/);$('[data-env-ok]').click();
  assert.equal($('#envelope'),null);assert.equal(run('Bstate().env.got.read'),1);assert.equal($('.benv-banner'),null,'read once');
  w.__envKind='bonus';play();calm();assert.equal(run('Bstate().env.got.k'),'bonus');assert.ok(run('Bstate().env.bet.v')>0);w.eval("Btab='home';Brender()");assert.match($('.benv-live').textContent,/אתגר הבעלים/);
  w.__envKind='mood';play();calm();assert.equal(run('Bstate().env.got.k'),'bonus','no second envelope while one is unopened');assert.equal(run('Bstate().env.bet'),null,'but what was at stake is settled');assert.equal(run('Bstate().env.note.length'),1);
  const bet=(gh,ga)=>run(`(()=>{const e=Bstate().env,m=me().money;e.bet={v:500000,op:'x'};BenvSettle({h:me().id,a:-1,gh:${gh},ga:${ga},xi:{},used:{}});return [me().money-m,e.note[0],e.bet]})()`);
  assert.deepEqual(bet(2,0).slice(0,1).concat(bet(2,0)[2]),[500000,null]);assert.match(bet(1,0)[1],/עמדו במילה/);assert.equal(bet(0,1)[0],0);assert.match(bet(1,1)[1],/לא הושג/);
  const ask=run("(()=>{const c=me(),p=available(c).find(p=>!c.lineup.includes(p.id)&&p.pos!=='GK');p.morale=50;Bstate().env.got={k:'promise',from:fullName(p),title:'מבקש הזדמנות',body:'x',ask:{pid:p.id,name:fullName(p)},fx:[]};Bstate().env.pr=null;return p.id})()");
  w.eval("Btab='home';Brender()");$('[data-env-open]').click();$('#envSeal').click();assert.ok($('[data-env-yes]')&&$('[data-env-no]'),'a request is answered, not just read');$('[data-env-yes]').click();
  assert.equal(run('Bstate().env.pr.pid'),ask);assert.equal($('#envSaid').hidden,false);assert.equal($('[data-env-yes]'),null);$('[data-env-ok]').click();assert.match($('.benv-live').textContent,/הבטחת ל/);
  w.eval(`BenvSettle({h:me().id,a:-1,gh:0,ga:0,xi:{[me().id]:[{pid:${ask}}]},used:{}})`);assert.equal(run(`me().players.find(p=>p.id===${ask}).morale`),62,'a promise kept lifts him');assert.equal(run('Bstate().env.pr'),null);
  w.eval(`(()=>{Bstate().env.pr={pid:${ask},name:'x'};BenvSettle({h:me().id,a:-1,gh:0,ga:0,xi:{[me().id]:[]},used:{}})})()`);assert.equal(run(`me().players.find(p=>p.id===${ask}).morale`),52,'and one that was not kept hurts him');
  // every kind can arrive and says who it is from
  w.eval("(()=>{const c=me(),e=Bstate().env;e.bet=null;e.pr=null;delete (Bstate().boost||{}).rep;c.players[2].susp=1;[6,7,8].forEach(i=>c.players[i].fit=70);const r=available(c).find(p=>!c.lineup.includes(p.id)&&p.pos!=='GK');r.bOut=3;r.morale=50})()");
  for(const k of run('Object.keys(BENV)')){assert.ok(run(`(()=>{const x=BENV['${k}'];return !x.ok||!!x.ok(Bstate(),me())})()`),k+' is possible');const g=run(`BENV['${k}'].make(Bstate(),me())`);assert.ok(g.from&&g.title&&g.body&&g.fx.length,k+' has a sender, a title, a body and what it gives');w.eval("Bstate().env.bet=null")}
  assert.equal(run('me().players[2].susp'),0,'the appeal lifted the suspension');assert.ok(Math.abs(run('Bstate().boost.rep')-.6)<1e-9);
  // about one match in three, never two in a row, never more than four without
  w.__envKind=null;const gaps=run("(()=>{const e=Bstate().env,out=[];let n=0;e.got=null;e.n=0;for(let i=0;i<400;i++){e.due=1;n++;const g=BenvTurn();if(g){g.read=1;out.push(n);n=0;e.bet=null;e.pr=null}}return out})()");
  assert.ok(Math.min(...gaps)>=2&&Math.max(...gaps)<=4,'gaps '+Math.min(...gaps)+'..'+Math.max(...gaps));assert.ok(gaps.length>105&&gaps.length<170,'about one in three: '+gaps.length+' of 400');
  w.__noEnv=1;w.eval("(()=>{const c=me();for(const p of c.players){p.inj=0;p.susp=0;p.fit=100}Bstate().env={n:0,all:9,cnt:9};Bstate().boost={};BensureXI(c);me().money=8e7})()");
  // ---- the career book
  assert.equal(run('Bstate().book.n.m'),run('Bstate().round'),'every competitive match is counted');assert.equal(run('(n=>n.w+n.d+n.l)(Bstate().book.n)'),run('Bstate().book.n.m'));
  w.eval("Btab='book';Brender()");assert.equal($$('.bach').length,run('BACH.length'));assert.ok(run('BACH.length')>=20);const s4=snap();w.eval('Brender();Brender()');assert.equal(snap(),s4,'the book only reads');
  const x0=run('Bstate().xpAll');const got=run("(()=>{const k=Bstate().book;k.ach={};k.fresh=[];k.n.w=10;k.n.gf=0;k.rec={};k.n.up=0;k.n.riv=0;k.n.cs=0;return BbookCheck()})()");
  assert.ok(got.includes('ניצחון ראשון')&&got.includes('עשרה ניצחונות'),'reached: '+got.join(', '));assert.equal(run('Bstate().book.ach.w1'),run('Bstate().season'));assert.ok(run('Bstate().xpAll')-x0>=90,'an achievement pays experience');
  assert.deepEqual(run('BbookCheck()'),[],'once');w.eval("Btab='home';Brender()");assert.ok($('.atiles.three [data-tab="book"] .adot'),'the tile says something is new');
  $('.atiles.three [data-tab="book"]').click();assert.equal(run('Btab'),'book');assert.ok($$('.bach.fresh').length>=2);assert.equal(run('Bstate().book.fresh.length'),0,'seen');
  w.eval(`BbookAfter({h:me().id,a:Bstate().league.find(id=>id!==G.me),gh:5,ga:0,ev:[1,2,3].map(()=>({t:'goal',team:G.me,pid:${ask},name:'פלוני'}))})`);
  assert.equal(run('Bstate().book.rec.win.d'),5);assert.equal(run('Bstate().book.rec.hero.v'),3);assert.equal(run('Bstate().book.n.cs'),1);w.eval('Brender()');assert.match($('.bbook-rec').textContent,/הניצחון הגדול ביותר/);assert.match($('.bbook-rec').textContent,/5:0/);
  w.eval('BbookSeason();BbookSeason()');assert.equal(run('Bstate().book.hist.length'),1,'a season is one line');assert.equal(run('Bstate().book.hist[0].part'),1);assert.ok(run('Bstate().book.hist[0].place')>0);
  w.eval("Bstate().honours=[{season:1,what:'גביע המדינה',club:me().name}];Brender()");assert.equal($$('.bbook-cab li').length,1);assert.ok($('.bbook-tbl tbody tr'));
  // a career from before the book: what it had already reached is entered without a prize
  const x1=run("(()=>{const b=Bstate();delete b.book;b.ct.played=40;b.ct.wins=25;b.honours=[];const x=b.xpAll;BbookEnsure();const g=BbookCheck();return [b.book.ach.w1,b.book.ach.w10,b.book.fresh.length,b.xpAll-x,g.includes('ניצחון ראשון')]})()");
  assert.deepEqual(x1.slice(0,3),[0,0,0]);assert.equal(x1[4],false);
  // ---- the haggle
  const hp=run("(()=>{const o=G.clubs.find(c=>c.id!==G.me&&Bstate().league.includes(c.id)&&c.players.length>16),ps=o.players.slice().sort((a,b)=>a.ovr-b.ovr);return [ps[1].id,ps[2].id,ps[3].id]})()");
  const price=id=>run(`(()=>{const f=Bfind(${id}),ask=Math.round(Bvalue(f.p)*1.12/50000)*50000;return [ask,BnegFloor(f.p,ask,false)]})()`);const offer=v=>{$('#boffer').value=v;$('[data-action="offer"]').click()};
  w.eval(`Bdetail(${hp[0]})`);assert.match($('.bdialog').textContent,/אפשר להתמקח/);let [ask0,floor0]=price(hp[0]);assert.ok(floor0<ask0&&floor0>ask0*.75);
  offer(floor0-20000);assert.match($('#breply').textContent,/המחיר שלהם עכשיו/);assert.equal(run('Bneg.left'),2);assert.ok(run('Bneg.dem')<ask0&&run('Bneg.dem')>=floor0,'the price comes down a step, never under the floor');
  assert.equal($$('#breply .bneg-pips i.on').length,2);assert.equal($$('#breply [data-neg-cut]').length,3);$('[data-neg-cut="3"]').click();assert.equal(+$('#boffer').value,Math.round(run('Bneg.dem')*.97/10000)*10000);
  offer(Math.round(ask0*.3));assert.match($('#breply').textContent,/קמו מהשולחן/,'an offer that is not serious ends the talk');assert.equal(run(`BnegOffNow(Bfind(${hp[0]}).p)`),true);offer(ask0);assert.match($('#breply').textContent,/קמו מהשולחן/);quiet();
  w.eval(`Bdetail(${hp[0]})`);assert.match($('.bdialog .bnote.bad').textContent,/קמו מהשולחן/);quiet();assert.equal(run(`(()=>{const b=Bstate();b.round++;const v=BnegOffNow(Bfind(${hp[0]}).p);b.round--;return v})()`),false,'until the next match has been played');
  w.eval(`Bdetail(${hp[1]})`);const [ask1,floor1]=price(hp[1]),h0=run('Bstate().book.n.hag||0');offer(floor1);assert.match($('.bdialog').textContent,/המועדון הסכים להצעה/,'an offer the club can live with is taken');assert.equal(run('Bstate().book.n.hag'),h0+1);quiet();
  w.eval(`Bdetail(${hp[2]})`);const [ask2]=price(hp[2]);offer(ask2);assert.match($('.bdialog').textContent,/המועדון הסכים להצעה/);assert.equal(run('Bstate().book.n.hag'),h0+1,'the asking price is not a bargain');quiet();
  assert.ok(run(`(()=>{const f=Bfind(${hp[2]});Bstate().staff={scout:3};const a=BnegFloor(f.p,${ask2},false);Bstate().staff={};return BnegFloor(f.p,${ask2},false)-a})()`)>0,'a scout moves the floor');
  console.log('beginner depth: the approach before and during a match, the captain, a colour for each line, the foreign limit in the line-up, fitness between matches, the break and the numbers, the calendar, the staff, the envelope, the career book, the haggle; errors',JSON.stringify(errors));
  if(errors.length)process.exitCode=1;
}catch(e){console.error(e);errors.push(String(e&&e.message||e));console.log('beginner depth errors',JSON.stringify(errors.slice(0,3)));process.exitCode=1}
finally{w.close()}
