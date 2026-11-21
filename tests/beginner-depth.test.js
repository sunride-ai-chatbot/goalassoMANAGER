// Beginner career: what a match day was missing.
// The approach: three buttons (defensive, balanced, attacking) stood on the live screen from the first day and the engine has always
//   read them, but nothing showed which one was in force and no word said what it does — reported as "I press them and nothing happens".
// The captain: the engine gives a side whose captain is on the pitch a little more; the game chose one and never said who.
// A colour for each line of the team (goalkeeper, defence, midfield, attack) round every player, the same wherever he is shown.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://depth.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__noExtras=1;w.__noInjStop=1;w.__ilmNoSplash=1;w.__noWindow=1;w.__noEnv=1;w.__noHalf=1;w.__noBids=1;w.__noStrain=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
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
  assert.deepEqual(fake(),[88,70,90,80,100],'ninety minutes cost 30, half an hour a third of it, a goalkeeper far less, the bench nothing');
  w.eval('BfitRest(BFIT_WEEK)');assert.deepEqual(run('me().lineup.slice(0,5).map(id=>me().players.find(p=>p.id===id).fit)'),[100,100,100,100,100],'a week gives it back: one match a week leaves nothing to manage');
  assert.equal(run('Bstate().round'),0);assert.deepEqual(fake({bX:{kind:'toto',stage:0}}),[100,100,100,100,100],'an evening before the first league round has a week after it: nobody opens a season on tired legs');
  w.eval('Bstate().round=3');
  assert.deepEqual(fake({bX:{kind:'state',stage:0}}),[94,79,96,87,100],'a cup tie is midweek: three days give next to nothing back, and Saturday begins at 79');
  assert.deepEqual(fake({bCL:0}),[94,79,96,87,100],'and so is a European night');
  assert.equal(run('BfitAfterMid()'),79,'which the window before a midweek match can say ahead of time');
  assert.deepEqual(fake({bX:{kind:'pre'}}),[100,100,100,100,100],'a friendly has a week after it');
  // the debt of a midweek match is paid slowly while he keeps playing, and at once by one match on the bench
  const seq=(steps)=>JSON.parse(w.eval(`(()=>{const c=me(),p=c.players.find(x=>x.id===c.lineup[1]),out=[];for(const x of c.players)x.fit=100;for(const k of ${JSON.stringify(steps)}){if(k!=='bench')BfitAfter({h:c.id,a:-1,m:90,gh:0,ga:0,ev:[],xi:{[c.id]:[{pid:p.id,since:0}]},used:{},mins:{},...(k==='mid'?{bCL:0}:{})});if(k!=='mid')BfitRest(BFIT_WEEK);out.push(p.fit)}return JSON.stringify(out)})()`));
  w.__noStrain=1;
  assert.deepEqual(seq(['lg','lg','lg']),[100,100,100],'one match a week: always fresh');
  assert.deepEqual(seq(['mid','lg','lg','lg','lg']),[79,87,93,99,100],'after a midweek match: 79 on Saturday, then 87, 93, 99');
  assert.deepEqual(seq(['mid','lg','mid']),[79,87,67],'a second midweek running: 67');
  assert.deepEqual(seq(['mid','lg','mid','lg','lg','lg']),[79,87,67,76,84,91],'and a long way back');
  assert.deepEqual(seq(['mid','lg','mid','bench']),[79,87,67,100],'one match on the bench pays all of it');
  w.__noStrain=0;w.eval('Bstate().round=0');
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
  assert.equal($$('.bout-strip.tired .bfit-row').length,3,'whoever is under 85 is on the strip');assert.equal($$('.bout-strip.tired .bfit-row.bad').length,2,'under 75 in red');assert.equal($$('.bformation-player .bfit-low').length,3,'and marked on the board');assert.equal($$('.bformation-player .bfit-low.bad').length,2);
  assert.equal($$('.bplayer .bp-mor.low').filter(x=>/עייף/.test(x.textContent)).length,2);
  const s1=snap();w.eval('Brender();Brender();Bprematch();Bprematch()');assert.equal(snap(),s1,'drawing these screens changes nothing');
  assert.equal($$('.blineup-player .bfit-chip').length,3);assert.match($('.bfit-note').textContent,/העייפות מורידה מההרכב שלך/);assert.equal($('.bbrief'),null,'nobody on the staff yet');quiet();
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
  const cands=run("BstaffCands('asst')");assert.equal(cands.length,3);assert.equal(new Set(cands.map(c=>c.name)).size,3,'three different people');assert.ok(cands.every(c=>c.lv>=1&&c.lv<=3&&c.fee>0&&c.wage>0&&c.tag));
  assert.ok(cands.some(c=>c.lv===1),'somebody a small club can afford');assert.deepEqual(run("BstaffCands('asst')"),cands,'drawing the list deals nothing');assert.equal($$('.bstaff-cands li').length,15);
  const pick=cands[0],m0=run('me().money');$('[data-staff-up="asst:0"]').click();assert.match($('.bdialog').textContent,/להעסיק עוזר מאמן/);assert.ok($('.bdialog').textContent.includes(pick.name));$('[data-staff-ok="asst:0"]').click();
  assert.equal(run("BstaffLv('asst')"),pick.lv);assert.equal(run("BstaffOf('asst').name"),pick.name,'the staff are people');assert.equal(run('me().money'),m0-pick.fee,'the signing fee is paid at once');assert.match(run('Bstate().ledger[Bstate().ledger.length-1].label'),/צוות מקצועי · עוזר מאמן · /);
  assert.equal($$('.bstaff-card.on').length,1);assert.ok($('.bstaff-card.on .bstaff-who').textContent.includes(pick.name));assert.equal($$('.bstaff-card.on .bstaff-who .bstaff-pips i.on').length,pick.lv);assert.equal(run('BstaffPay()'),pick.wage);
  const again=run("BstaffCands('asst')");assert.ok(!again.some(c=>c.name===pick.name),'three new candidates come, and he is not among them');assert.ok(pick.lv===3||again.some(c=>c.lv>pick.lv),'a better man is always on the list while there is one');
  $('[data-staff-up="asst:1"]').click();assert.match($('.bdialog').textContent,/להחליף את עוזר מאמן/);assert.match($('.bdialog').textContent,/יעזוב את המועדון/);quiet();
  assert.equal(run("Math.round((Bsum()+Boperating()+BstaffPay())*Bremaining())"),run('Bcommitment()'),'the salary is a running cost like every other');
  w.eval("me().money=0;Brender()");assert.ok($('[data-staff-up="fit:0"]').disabled);assert.match($('[data-staff-up="fit:0"]').textContent,/אין מספיק כסף/);assert.equal(w.eval("BstaffHire('fit',0)"),false);w.eval('me().money=5e7');
  assert.deepEqual(run("(()=>{const b=Bstate(),keep=b.staff;b.staff={asst:3,fit:0};BstaffMend();const v=b.staff.asst,r=[typeof v,v.lv,!!v.name,BstaffLv('fit')];b.staff=keep;return r})()"),['object',3,true,0],'a career saved with levels gets a man of that level');
  w.eval('Bprematch()');assert.match($('.bbrief').textContent,/עוזר המאמן/);assert.match($('.bbrief').textContent,/התקפי|הגנתי|מאוזן/);quiet();
  w.eval("Bstate().staff={asst:3,fit:2,phys:2,anal:2,scout:1}");
  assert.equal(fake()[1],74,'a fitness coach: a match costs less');w.eval('BfitRest(BFIT_MID)');assert.equal(run('me().players.find(p=>p.id===me().lineup[1]).fit'),84,'and the days between give more');assert.equal(run('BfitAfterMid()'),84,'79 without him');w.eval('for(const p of me().players)p.fit=100');
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
  w.eval("(()=>{const c=me(),e=Bstate().env;e.bet=null;e.pr=null;delete (Bstate().boost||{}).rep;for(const p of c.players)p.susp=0;c.players[2].susp=1;[6,7,8].forEach(i=>c.players[i].fit=70);const r=available(c).find(p=>!c.lineup.includes(p.id)&&p.pos!=='GK');r.bOut=3;r.morale=50})()");
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
  // a winning run is an unbeaten run: reported as "11 wins in a row" over "4 matches without defeat"
  const runs=run(`(()=>{const b=Bstate(),op=b.league.find(id=>id!==G.me),win=()=>BbookAfter({h:me().id,a:op,gh:1,ga:0,ev:[]});delete b.book;b.st={w:7};BbookEnsure();const a=[b.book.cur.w,b.book.cur.u];for(let i=0;i<4;i++)win();const R=b.book.rec;return [a,[R.run.v,R.unb.v]]})()`);
  assert.deepEqual(runs,[[7,7],[11,11]],'a book that opens in the middle of a run counts both from it');
  assert.deepEqual(run("(()=>{const k=Bstate().book;k.cur={w:11,u:4};k.rec.run={v:11,s:8};k.rec.unb={v:4,s:8};BbookEnsure();return [k.cur.u,k.rec.unb.v,k.rec.unb.s]})()"),[11,11,8],'and a book saved with the two apart is put right when the career loads');
  assert.deepEqual(run(`(()=>{const b=Bstate(),op=b.league.find(id=>id!==G.me);BbookAfter({h:me().id,a:op,gh:1,ga:1,ev:[]});BbookAfter({h:me().id,a:op,gh:2,ga:0,ev:[]});const k=b.book;return [k.cur.w,k.cur.u,k.rec.run.v,k.rec.unb.v]})()`),[1,13,11,13],'a draw ends the wins and not the unbeaten run');
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
  // =====================================================================================================================
  // ---- the transfer window: two of them, and outside them nothing is bought, borrowed or sold
  calm();w.__noWindow=0;const R0=run('Bstate().round'),at=r=>w.eval(`Bstate().round=${r}`),win=r=>run(`(()=>{const b=Bstate(),k=b.round;b.round=${r};const v=BwinInfo();b.round=k;return v})()`);
  const NR=run('Bstate().schedule.length'),S1=Math.max(3,Math.round(NR*.15)),W0=Math.round(NR*.46),W1=W0+Math.max(3,Math.round(NR*.12));
  assert.deepEqual([win(0).open,win(0).left,win(S1-1).left,win(S1).open,win(S1).next,win(W0).open,win(W0).first,win(W1-1).left,win(W1).open,win(W1).next],[true,S1,1,false,W0-S1,true,true,1,false,null]);
  w.eval("me().money=9e7");const oth=run("(()=>{const o=G.clubs.find(c=>c.id!==G.me&&Bstate().league.includes(c.id)&&c.players.length>18),ps=o.players.slice().sort((a,b)=>a.ovr-b.ovr);return {club:o.id,ids:ps.slice(0,6).map(p=>p.id)}})()");
  at(S1);w.eval("Btab='market';Brender()");assert.match($('.bwin.shut').textContent,/חלון ההעברות סגור/);assert.match($('.bwin.shut').textContent,new RegExp('נפתח בעוד '+(W0-S1===1?'מחזור אחד':(W0-S1)+' מחזורים')));assert.match($('.bwin.shut').textContent,/שחקנים חופשיים אפשר להחתים תמיד/);
  w.eval(`Bdetail(${oth.ids[0]})`);assert.match($('.bdialog .bnote.bad').textContent,/חלון ההעברות סגור/);$('#boffer').value=9e7;$('[data-action="offer"]').click();assert.match($('#breply').textContent,/סגור/);assert.doesNotMatch($('.bdialog').textContent,/המועדון הסכים/);
  $('[data-action="loan"]').click();assert.match($('#breply').textContent,/סגור/);assert.equal($('.bdeal'),null);quiet();w.eval(`Bsign(${oth.ids[0]},100000,false)`);assert.equal(run(`me().players.some(p=>p.id===${oth.ids[0]})`),false,'not through the back door either');quiet();
  const mineAny=run("me().players.filter(p=>!BsaleBlocked(p)).sort((a,b)=>a.ovr-b.ovr)[2].id");w.eval(`BsaleDialog(${mineAny})`);assert.match($('.bdialog').textContent,/אי אפשר גם למכור/);assert.equal(run('Bstate().saleOffer||null'),null);quiet();
  const free=run(`(()=>{const o=G.clubs.find(c=>c.id===${JSON.stringify(oth.club)}),p=o.players.find(x=>x.id===${oth.ids[5]});o.players=o.players.filter(x=>x!==p);G.freeAgents.push(p);return p.id})()`);w.eval(`Bsign(${free},0,false)`);assert.equal(run(`me().players.some(p=>p.id===${free})`),true,'a free agent has no club to release him');calm();w.eval("try{closeReveal(true)}catch(e){}");
  const banner=r=>{at(r);w.eval("Btab='home';Brender()");const el=$('.bwin-banner');return el?el.textContent:''};
  assert.match(banner(S1-2),/נסגר בעוד 2 מחזורים/);assert.ok($('.bwin-banner.warn'));assert.match(banner(S1-1),/נסגר אחרי המשחק הבא/);assert.equal(banner(S1),'','nothing to say while it is shut');assert.match(banner(W0),/חלון החורף נפתח/);
  if(S1>3)assert.equal(banner(0),'','and nothing while there is plenty of time');const s5=snap();w.eval("Brender();Btab='market';Brender();Brender()");assert.equal(snap(),s5,'the window is read from the round and nothing else');
  at(1);assert.deepEqual(run('BtipUntil()'),{until:S1-1,s:run('Bstate().season')},'a scout\'s tip lasts as long as the window');at(S1);assert.equal(run('BtipUntil().until'),W1-1,'one dealt while it is shut waits for the next');
  at(S1-1);assert.equal(run('BscoutPick(25)'),null,'no tip when the window closes after this match');at(W1);assert.equal(run('BscoutPick(25)'),null,'nor when no window is left this season');
  // ---- more than one way to agree
  at(1);const pid1=oth.ids[1],val1=run(`Bvalue(Bfind(${pid1}).p)`);
  const lens=run(`(()=>{const f=Bfind(${pid1}),L=[],B=[];for(let i=0;i<60;i++){L.push(BdealLoanList(f.p,f.c).map(d=>d.t));B.push(BdealBuyList(f.p,f.c,2000000).map(d=>d.t))}return [L,B]})()`);
  assert.ok(lens[0].every(l=>l.length>=1&&l.length<=3&&l[0]==='loan'),'one to three ways to borrow him, the ordinary one always');assert.ok(new Set(lens[0].map(l=>l.length)).size===3,'drawn: sometimes one, sometimes three');
  assert.ok(lens[1].every(l=>l.length>=1&&l.length<=3&&l[0]==='sellon'&&l.every(t=>['sellon','split','bonus','loanbuy'].includes(t))));assert.ok(new Set(lens[1].flat()).size>=4,'every shape turns up');
  assert.ok(run(`BdealBuyList(Bfind(${pid1}).p,Bfind(${pid1}).c,2000000)[0].fee`)<2000000,'a share of a future sale is a lower price now');
  w.__dealRnd=()=>.99;w.eval(`Bdetail(${pid1})`);$('[data-action="loan"]').click();assert.equal($$('#breply .bdeal').length,3);assert.equal(run('Bdeals.list.length'),3);assert.equal(run(`BdealsFor(Bfind(${pid1}).p,Bfind(${pid1}).c,'loan')===Bdeals`),true,'dealt once for a talk');
  const loanFee=run('Bdeals.list[0].fee');assert.ok(loanFee>=val1*.055&&loanFee<=val1*.095);$('[data-deal="0"]').click();assert.match($('.bdialog').textContent,/השאלה עד סוף העונה/);const lm=run('me().money');$('.bdialog [data-sign]').click();
  assert.equal(run(`me().players.some(p=>p.id===${pid1})`),true);assert.equal(run(`Bstate().loans.some(l=>l.pid===${pid1})`),true);assert.equal(run('me().money'),lm-loanFee);calm();w.eval("try{closeReveal(true)}catch(e){}");
  // a talk about a price lays oth shapes of the deal beside the club's price
  const pid2=oth.ids[2];w.eval(`Bdetail(${pid2})`);const [ask2b,floor2b]=price(pid2);offer(floor2b-20000);assert.ok($$('#breply .bdeal').length>=1,'the refusal comes with oth ways to do it');assert.match($('#breply .bdeal h4').textContent,/ממכירה עתידית/);
  w.eval(`(()=>{const f=Bfind(${pid2});Bdeals={key:'t',pid:${pid2},kind:'buy',dem:${ask2b},list:[{t:'sellon',pct:10,fee:${ask2b}*.9,title:'10% ממכירה עתידית',lines:['x']}]};Bselected=${pid2}})()`);assert.equal(w.eval('BdealPick(0)'),true);assert.match($('.bdialog').textContent,/סיכום העסקה/);$('.bdialog [data-sign]').click();calm();w.eval("try{closeReveal(true)}catch(e){}");
  assert.deepEqual(run(`(p=>[p.bSellOn.pct,p.bSellOn.to===G.clubs.find(c=>c.id===${JSON.stringify(oth.club)}).name])(me().players.find(p=>p.id===${pid2}))`),[10,true],'what was agreed stays on the player');
  w.eval(`Bdetail(${pid2})`);assert.match($('.bdialog .bdeal-notes').textContent,/10% ממכירה שלו/);quiet();
  assert.deepEqual(run(`(()=>{const p=me().players.find(p=>p.id===${pid2}),m=me().money,cut=BdealSold(p,2000000);return [cut,m-me().money,p.bSellOn||null,Bstate().ledger[Bstate().ledger.length-1].label.startsWith('10% ל')]})()`),[200000,200000,null,true],'and is paid when he is sold');
  // two payments, a bonus that depends on the season, a fine for a loan that was promised matches, a wage that is shared, a purchase agreed for the summer
  const dl=run(`(()=>{const b=Bstate(),c=me(),o=G.clubs.find(x=>x.id===${JSON.stringify(oth.club)}),p=c.players.find(x=>x.id===${pid2}),out={};b.owed=[];b.clauses=[];
    BdealApply(p,o,{t:'split',later:700000});out.owed=[b.owed.length,b.owed[0].v,b.owed[0].s-b.season];const m0=c.money;BdealSeasonStart();out.early=m0-c.money;b.season++;BdealSeasonStart();out.paid=m0-c.money;out.left=b.owed.length;b.season--;
    BdealApply(p,o,{t:'bonus',kind:'goals',need:2,amount:500000});BdealAfter({ev:[{t:'goal',team:c.id,pid:p.id},{t:'pen',team:c.id,pid:p.id},{t:'goal',team:-1,pid:p.id}],xi:{[c.id]:[{pid:p.id}]},used:{}});out.have=b.clauses[0].have;
    BdealApply(p,o,{t:'loanfree',kind:'apps',need:5,amount:300000,fine:true});BdealAfter({ev:[],xi:{[c.id]:[{pid:p.id}]},used:{}});out.apps=b.clauses[1].have;const m1=c.money,notes=BdealSeasonEnd();out.settled=m1-c.money;out.notes=notes.length;out.clauses=b.clauses.length;
    const y=Byear(p);p.bPay=.6;out.pay=Math.abs(Byear(p)-y*.6)<2;delete p.bPay;
    const l={pid:p.id,club:o.id,buy:1000000};out.buy=[BdealLoanBuy(l),m1-800000-c.money];c.money=10;out.poor=BdealLoanBuy(l);c.money=9e7;return out})()`);
  assert.deepEqual(dl,{owed:[1,700000,1],early:0,paid:700000,left:0,have:2,apps:1,settled:800000,notes:2,clauses:0,pay:true,buy:[true,1000000],poor:false});
  w.eval(`(()=>{const b=Bstate(),p=me().players.find(x=>x.id===${pid2});b.owed=[{t:'תשלום שני על '+fullName(p),v:700000,s:b.season+1}];b.clauses=[{pid:p.id,name:fullName(p),kind:'goals',need:6,have:1,amount:500000,to:'x',s:b.season}];Btab='finance';Brender()})()`);assert.equal($$('.bowed li').length,2,'what is owed from deals is listed with the money');w.eval("Bstate().owed=[];Bstate().clauses=[]");
  // a buyer can be pressed twice; the third time he walks away
  const sell=run("me().players.filter(p=>!BsaleBlocked(p)).sort((a,b)=>a.ovr-b.ovr)[1].id");w.eval(`BsaleDialog(${sell})`);const f0=run('Bstate().saleOffer.fee');assert.ok($('.bdialog [data-sale-more]'));$('.bdialog [data-sale-more]').click();const f1=run('Bstate().saleOffer.fee');assert.ok(f1>f0,'a first request raises the offer');
  assert.match($('.bdialog').textContent,/העלו את ההצעה|המילה האחרונה/);$('.bdialog [data-sale-more]').click();const f2=run('Bstate().saleOffer.fee');assert.ok(f2>=f1&&f2<=f0*1.14+10000);assert.equal(run('Bstate().saleOffer.last'),true);assert.match($('.bdialog').textContent,/המילה האחרונה שלהם/);
  $('.bdialog [data-sale-more]').click();assert.equal(run('Bstate().saleOffer||null'),null);assert.match($('.bdialog').textContent,/ירדה מהשולחן/);quiet();w.eval(`BsaleDialog(${sell})`);assert.match($('.bdialog').textContent,/משך את ההצעה/);quiet();
  w.__dealRnd=null;w.__noWindow=1;at(R0);
  // ---- fitness is every club's: both sides pay for a match, and a tie decided without one costs the same
  const opp=run("(()=>{const o=G.clubs.find(c=>c.id!==G.me&&Bstate().league.includes(c.id));for(const c of G.clubs)for(const p of c.players)p.fit=100;const xi=bestXI(o);return {id:o.id,gk:xi.find(p=>p.pos==='GK').id,out:xi.find(p=>p.pos!=='GK').id}})()");
  const both=run(`(()=>{const c=me(),o=G.clubs.find(x=>x.id===${JSON.stringify(opp.id)}),M={h:c.id,a:o.id,m:90,gh:0,ga:0,ev:[],xi:{[c.id]:[{pid:c.lineup[1],since:0}],[o.id]:[{pid:${opp.out},since:0},{pid:${opp.gk},since:0}]},used:{},mins:{}};BfitAfter(M);const f=id=>o.players.find(p=>p.id===id).fit,a=[c.players.find(p=>p.id===c.lineup[1]).fit,f(${opp.out}),f(${opp.gk})];BfitRest(BFIT_WEEK);return [a,[f(${opp.out}),f(${opp.gk})]]})()`);
  assert.deepEqual(both,[[70,70,88],[100,100]],'the opponent\'s legs are counted like the coach\'s own');
  assert.deepEqual(run(`(()=>{const o=G.clubs.find(x=>x.id===${JSON.stringify(opp.id)}),xi=bestXI(o);BfitQuick(o);const v=[...new Set(xi.filter(p=>p.pos!=='GK').map(p=>p.fit))];for(const p of o.players)p.fit=100;return v})()`),[79],'a tie decided without a match costs the eleven that would have played it');
  assert.equal(run(`(()=>{const o=G.clubs.find(x=>x.id===${JSON.stringify(opp.id)});for(const p of o.players)if(p.pos!=='GK')p.fit=70;const n=BfitTiredOp(o).length;for(const p of o.players)p.fit=100;return n})()`),10,'and the staff can say who is tired on the other side');
  play();assert.ok(run('G.clubs.filter(c=>Bstate().league.includes(c.id)).every(c=>c.players.every(p=>(p.fit??100)>=88))'),'a week rests every club (only a man just back from an injury is still short)');calm();
  // back from an injury he is not at once the player he was
  assert.deepEqual(run("(()=>{const c=me(),p=c.players.find(x=>!c.lineup.includes(x.id));p.inj=1;p.fit=100;const q=G.clubs.find(x=>x.id!==G.me).players[0];q.inj=1;q.fit=100;Bplay();BstopBroadcast();const r=[p.inj,p.fit,q.fit];delete Bstate().live;Bstate().staff={phys:2};p.fit=100;BfitBack(p,c);r.push(p.fit);Bstate().staff={};p.fit=100;q.fit=100;return r})()"),[0,80,80,88],'eighty, and a doctor brings him back nearer the top');w.eval('Brender()');
  // ---- what was played before the calendar and the book existed is read from what the game still holds
  assert.deepEqual(run("(()=>{const b=Bstate(),c=me(),keep=b.cal,kp=G.paper;b.cal=b.cal.filter(x=>x.r!==0);G.paper=[{wk:0,s:b.season,ev:{type:'match',h:-5,a:c.id,gh:1,ga:3}},...G.paper.filter(x=>!(x.wk===0&&x.s===b.season))];const r=BcalRows()[0],v=[r.past,!!r.unk,r.gf,r.ga];G.paper=G.paper.filter(x=>x.wk!==0||x.s!==b.season);const u=!!BcalRows()[0].unk;b.cal=keep;G.paper=kp;return [v,u]})()"),[[1,false,3,1],true],'a round the paper still reports has its score; one it does not is listed as played');
  const bf=run("(()=>{const b=Bstate(),c=me();delete b.book;b.ct.played=40;b.ct.wins=20;b.honours=[{season:2,what:'אליפות ליגת העל',club:'מועדון ישן'},{season:3,what:'גביע המדינה',club:'מועדון ישן'}];G.paper=[{s:b.season,wk:0,ev:{type:'match',hName:c.name,aName:'יריבה',gh:6,ga:1}},...G.paper];const k=BbookEnsure();return [k.hist.filter(h=>h.old).map(h=>[h.s,h.place,h.lg]),k.rec.win&&k.rec.win.d>=5,k.bf]})()");
  assert.deepEqual(bf,[[[2,1,'ליגת העל']],true,1],'a title is a line of the seasons\' table, and the paper gives the season\'s biggest win');w.eval("Btab='book';Brender()");assert.match($('.bbook-tbl').textContent,/ליגת העל/);
  // ---- playing tired costs: what the legs take off a man, what the engine takes, and who rests
  w.__noStrain=1;w.eval("(()=>{for(const c of G.clubs)for(const p of c.players){p.fit=100;p.inj=0;p.susp=0}Bstate().staff={};BensureXI(me())})()");
  const loss=run("[100,93,87,79,75,67,60].map(f=>+BfitLoss({fit:f,pos:'MF'}).toFixed(2))");
  assert.equal(loss[0],0);assert.ok(loss.every((v,i)=>!i||v>loss[i-1]),'the lower the legs, the more they cost');
  assert.ok(loss[1]<.5&&loss[2]<1,'above 85 next to nothing');assert.ok(loss[3]>2.2&&loss[3]<3.2,'at 79 about three rating points');assert.ok(loss[5]>5.5,'at 67 more than five');
  assert.ok(run("BfitLoss({fit:88,pos:'GK'})")<.2,'a goalkeeper hardly tires');
  // the number shown is the engine's own: effOvr at the whistle and minuteFatigue minute by minute, against the same man fresh
  const eng=run(`(()=>{const L=G.clubs.filter(x=>x.id!==G.me&&Bstate().league.includes(x.id)),c=L[0],o=L[1],M=createMatch(c,o,{kind:'friendly',neutral:false}),e=M.xi[c.id].find(e=>c.players.find(p=>p.id===e.pid).pos==='MF'),p=c.players.find(p=>p.id===e.pid);
    const at=f=>{p.fit=f;let s=0;for(let m=1;m<=90;m++){M.m=m;s+=minuteFatigue(M,p,e)}return effOvr(p)-s/90},full=at(100),v=[full-at(79),BfitLoss({fit:79,pos:'MF'}),full-at(67),BfitLoss({fit:67,pos:'MF'})];
    p.fit=100;M.m=60;const a=unitStrength(M,c);for(const x of M.xi[c.id]){const q=c.players.find(p=>p.id===x.pid);if(q.pos!=='GK')q.fit=79}const b=unitStrength(M,c);for(const q of c.players)q.fit=100;return v.concat([a.att-b.att,a.def-b.def,a.mid-b.mid])})()`);
  assert.ok(eng[0]>eng[1]*.7&&eng[0]<eng[1]*1.5,'79: '+eng[0]+' against '+eng[1]);assert.ok(eng[2]>eng[3]*.7&&eng[2]<eng[3]*1.5,'67: '+eng[2]+' against '+eng[3]);
  assert.ok(eng[4]>2&&eng[5]>1.8&&eng[6]>2,'an eleven at 79 attacks, defends and holds the middle two points and more under itself: '+eng.slice(4).map(v=>v.toFixed(1)));
  // the other clubs rest a tired man when the man behind him would play better today, which the engine's own choice does not see
  const rot=run(`(()=>{const o=G.clubs.find(x=>x.id===${JSON.stringify(opp.id)});for(const p of o.players){p.fit=100;p.inj=0;p.susp=0;p.form=0;p.morale=65}const xi=bestXI(o),pos='MF',st=xi.filter(p=>p.pos===pos).sort((a,b)=>a.ovr-b.ovr),P=st[0],Q=o.players.filter(p=>p.pos===pos&&!xi.includes(p)).sort((a,b)=>b.ovr-a.ovr)[0],rest=o.players.filter(p=>p.pos===pos&&!xi.includes(p)&&p!==Q),keep=[Q.ovr,Q.foreign,P.foreign,xi.map(p=>p.foreign),rest.map(p=>p.ovr)];
    Q.ovr=P.ovr-3;Q.foreign=false;P.foreign=false;rest.forEach(p=>p.ovr=Math.min(p.ovr,P.ovr-12));const r={};const has=()=>{const ids=bestXI(o).map(p=>p.id);return [ids.includes(P.id),ids.includes(Q.id),ids.length]};
    r.fresh=has();P.fit=84;r.f84=has();P.fit=70;r.f70=has();r.engine=bestXI0(o).map(p=>p.id).includes(P.id);
    Bstate().daily=1;r.daily=has();delete Bstate().daily;window.__noFatigue=1;r.off=has();window.__noFatigue=0;
    xi.forEach(p=>p.foreign=false);xi.filter(p=>p!==P&&p.pos!=='GK').slice(0,MAX_FOREIGN_XI).forEach(p=>p.foreign=true);Q.foreign=true;r.lim=[foreignLimited(o),bestXI(o).includes(Q),bestXI(o).filter(p=>p.foreign).length<=MAX_FOREIGN_XI];P.foreign=true;r.forfor=has();
    P.fit=100;Q.ovr=keep[0];Q.foreign=keep[1];P.foreign=keep[2];xi.forEach((p,i)=>p.foreign=keep[3][i]);rest.forEach((p,i)=>p.ovr=keep[4][i]);return r})()`);
  assert.deepEqual(rot.fresh,[true,false,11]);assert.deepEqual(rot.f84,[true,false,11],'a little tired and still the better man');
  assert.equal(rot.engine,true,'the engine by itself keeps a man at 70 in front of one three points under him');assert.deepEqual(rot.f70,[false,true,11],'he rests, and the man behind him plays');
  assert.deepEqual(rot.daily,[true,false,11],'not in the daily challenge');assert.deepEqual(rot.off,[true,false,11],'and not with fatigue off');
  assert.deepEqual(rot.lim,[true,false,true],'never a foreigner past the limit');assert.deepEqual(rot.forfor,[false,true,11],'a foreigner for a foreigner is no more foreigners');
  // the coach: the strip says what today costs, and one press rests whoever has a better man behind him
  const mineIds=run(`(()=>{const c=me();for(const p of c.players){p.fit=100;p.inj=0;p.susp=0;p.form=0;p.morale=65}Bstate().staff={};c.lineup=autoLineupFor(c);const sl=slotsFor(c.formation),at=pos=>c.lineup.map((id,i)=>({p:c.players.find(p=>p.id===id),i})).filter(x=>sl[x.i]===pos&&x.p.pos===pos).sort((a,b)=>a.p.ovr-b.p.ovr);
    const P=at('MF')[0],Q=c.players.filter(p=>p.pos==='MF'&&!c.lineup.includes(p.id)).sort((a,b)=>b.ovr-a.ovr)[0],R=at('DF').slice(-1)[0];window.__keep={Q:[Q.id,Q.ovr,Q.foreign],df:c.players.filter(p=>(p.pos==='DF'||p.pos==='MF')&&!c.lineup.includes(p.id)&&p!==Q).map(p=>[p.id,p.ovr])};
    Q.ovr=P.p.ovr-2;Q.foreign=!!P.p.foreign;for(const p of c.players)if(!c.lineup.includes(p.id)&&p!==Q){if(p.pos==='DF')p.ovr=Math.min(p.ovr,R.p.ovr-8);if(p.pos==='MF')p.ovr=Math.min(p.ovr,P.p.ovr-12)}P.p.fit=67;R.p.fit=79;Btab='squad';Brender();return {P:P.p.id,slot:P.i,Q:Q.id,R:R.p.id,Pn:P.p.last||P.p.first,Qn:Q.last||Q.first,ovr:P.p.ovr}})()`);
  assert.equal($$('.bout-strip.tired .bfit-row').length,2,'whoever is under 85');assert.equal($$('.bout-strip.tired .bfit-row.bad').length,1,'and under 75 in red');
  assert.match($('.bout-strip.tired strong').textContent,/ההרכב חלש היום בנקודת כוח אחת/);assert.match($('.bout-strip.tired .bfit-row.bad').textContent,new RegExp('כושר 67% · משחק כמו '+(mineIds.ovr-7)));
  assert.match($('.bout-strip.tired [data-action="freshen"]').textContent,/תן לעייף לנוח/);assert.match($('.bout-strip.tired .bfit-act').textContent,new RegExp(mineIds.Qn+' מהספסל ישחק היום טוב ממנו'));
  assert.equal($$('.bplayer .bp-mor.low').filter(x=>/עייף 67%/.test(x.textContent)).length,1);assert.equal($$('.bplayer .bp-mor.low').filter(x=>/כושר 79%/.test(x.textContent)).length,1);
  const pw=run('[Math.round(strength(me())),+BfitTeam(me()).toFixed(2)]');assert.ok(pw[1]>.7&&pw[1]<1,'two tired men of eleven: '+pw[1]);
  w.eval("Btab='home';Brender()");assert.match($('.amatch .apower-l .mine').textContent,new RegExp('הכוח שלך '+Math.round(run('strength(me())-BfitTeam(me())'))));assert.match($('.amatch .apow-tired').textContent,/עייפות\s*−1/,'the power bar is today\'s power');
  const sFit=snap();w.eval("Brender();Btab='squad';Brender();Bprematch();Bprematch()");assert.equal(snap(),sFit,'drawing these screens changes nothing');
  assert.match($('.bdialog .bfit-note').textContent,/העייפות מורידה מההרכב שלך נקודת כוח אחת/);assert.match($('.bdialog .bfit-note').textContent,/67%/);assert.ok($('.bdialog [data-action="freshen-pre"]'));
  $('.bdialog [data-action="freshen-pre"]').click();assert.equal(run(`me().lineup[${mineIds.slot}]`),mineIds.Q,'the fresher man takes the very place');assert.ok(run(`me().lineup.includes(${mineIds.R})`),'and whoever has nobody better behind him plays on');
  assert.ok($('.bdialog'),'the window before the whistle is still open');assert.equal($('.bdialog [data-action="freshen-pre"]'),null);quiet();
  w.eval("Btab='squad';Brender()");assert.equal($$('.bout-strip.tired .bfit-row').length,1);assert.equal($('.bout-strip.tired [data-action="freshen"]'),null);assert.match($('.bout-strip.tired .bfit-none').textContent,/אין כרגע בספסל/);
  w.eval(`(()=>{const c=me();c.lineup[${mineIds.slot}]=${mineIds.P};Brender()})()`);$('.bout-strip.tired [data-action="freshen"]').click();assert.equal(run(`me().lineup[${mineIds.slot}]`),mineIds.Q,'the same from the squad screen');
  w.eval(`(()=>{const c=me();c.lineup[${mineIds.slot}]=${mineIds.P};Brender()})()`);$('[data-action="auto"]').click();assert.ok(!run(`me().lineup.includes(${mineIds.P})`)&&run(`me().lineup.includes(${mineIds.Q})`),'and the recommended eleven rests him too');
  // whoever the button rested comes back by himself when the match he sat out is over and his legs are back; a place the coach changed since is the coach's
  w.eval(`(()=>{const c=me();c.lineup[c.lineup.indexOf(${mineIds.Q})]=${mineIds.P};Bstate().rest=[];c.players.find(p=>p.id===${mineIds.P}).fit=67;Btab='squad';Brender()})()`);$('.bout-strip.tired [data-action="freshen"]').click();
  assert.deepEqual(run('Bstate().rest'),[{i:mineIds.slot,out:mineIds.P,in:mineIds.Q}]);
  w.eval(`me().players.find(p=>p.id===${mineIds.P}).fit=76;BfitReturn()`);assert.equal(run(`me().lineup[${mineIds.slot}]`),mineIds.Q,'three days were not enough: he waits one match more');assert.equal(run('Bstate().rest.length'),1);
  w.eval('BfitRest(BFIT_WEEK);BfitReturn()');assert.equal(run(`me().lineup[${mineIds.slot}]`),mineIds.P,'a week later he has his place back');assert.deepEqual(run('Bstate().rest'),[]);
  w.eval(`(()=>{const c=me();c.players.find(p=>p.id===${mineIds.P}).fit=67;BfitFreshen(c);const o=c.players.find(p=>p.pos==='MF'&&!c.lineup.includes(p.id)&&p.id!==${mineIds.P});c.lineup[${mineIds.slot}]=o.id;window.__o=o.id;BfitRest(BFIT_WEEK);BfitReturn()})()`);
  assert.equal(run(`me().lineup[${mineIds.slot}]`),run('window.__o'),'the coach put somebody else there: his choice stands');assert.deepEqual(run('Bstate().rest'),[]);
  w.eval(`(()=>{const c=me();c.lineup[${mineIds.slot}]=${mineIds.P};c.players.find(p=>p.id===${mineIds.P}).fit=67;BfitFreshen(c)})()`);play();assert.equal(run(`me().lineup[${mineIds.slot}]`),mineIds.P,'and through a real round: rested for the match, back for the next');calm();
  w.eval(`(()=>{const c=me();for(const p of c.players){p.inj=0;p.susp=0;p.fit=100}c.players.find(p=>p.id===${mineIds.P}).fit=67;c.players.find(p=>p.id===${mineIds.R}).fit=79;c.lineup=autoLineupFor(c);c.lineup[${mineIds.slot}]=${mineIds.P};const q=c.lineup.indexOf(${mineIds.Q});if(q>=0&&q!==${mineIds.slot})c.lineup[q]=c.players.find(p=>p.pos==='MF'&&!c.lineup.includes(p.id)).id;Bstate().rest=[];Bstate().staff={}})()`);
  // the assistant names the change, and a player's page says what his legs are worth today
  w.eval(`(()=>{Bstate().staff={asst:{lv:1,name:'בדיקה',f:1}};Bprematch()})()`);
  assert.match($('.bbrief').textContent,new RegExp('הייתי נותן מנוחה: '+mineIds.Qn+' במקום '+mineIds.Pn+' \\(67%\\)'));assert.doesNotMatch($('.bdialog .bfit-note').textContent,new RegExp(mineIds.Pn+' 67%'),'the note does not repeat the names the assistant gave');quiet();
  w.eval(`Bstate().staff={};Bdetail(${mineIds.P})`);assert.match($('.bdialog .bnote.bad').textContent,new RegExp('כושר 67%: היום הוא משחק כמו '+(mineIds.ovr-7)+' ולא כמו '+mineIds.ovr));quiet();
  // before a midweek match the window says what it will leave for Saturday
  assert.match(w.eval("BfitPreHTML({kind:'state'})"),/בעוד שלושה ימים משחק ליגה מול .+ יגיע אליו בכושר של כ־<bdi>79%<\/bdi>/);assert.doesNotMatch(w.eval("BfitPreHTML({kind:'pre'})"),/שלושה ימים/);assert.doesNotMatch(w.eval('BfitPreHTML(null)'),/שלושה ימים/);
  assert.doesNotMatch(w.eval("(()=>{const b=Bstate(),k=b.round;b.round=0;const v=BfitPreHTML({kind:'toto'});b.round=k;return v})()"),/שלושה ימים/,'not before the first league round');
  assert.doesNotMatch(w.eval("(()=>{Bstate().staff={fit:{lv:3,name:'בדיקה',f:1}};const v=BfitPreHTML({kind:'state'});Bstate().staff={};return v})()"),/שלושה ימים/,'nor when the fitness coach brings them to Saturday fresh');
  w.eval(`(()=>{const c=me(),k=window.__keep;for(const p of c.players){p.fit=100;if(p.id===k.Q[0]){p.ovr=k.Q[1];p.foreign=k.Q[2]}const d=k.df.find(x=>x[0]===p.id);if(d)p.ovr=d[1]}c.lineup=autoLineupFor(c);Bstate().rest=[];Brender()})()`);
  // tired legs pull a muscle: under 75 only, a half or more only, never in a friendly
  const strain=(fit,since,extra)=>run(`(()=>{const c=me(),p=c.players.find(x=>x.id===c.lineup[1]);for(const x of c.players){x.fit=100;x.inj=0}p.fit=${fit};const M={h:c.id,a:-1,m:90,gh:0,ga:0,ev:[],xi:{[c.id]:[{pid:p.id,since:${since||0}}]},used:{},mins:{},...${JSON.stringify(extra||{})}};const r=Math.random;Math.random=()=>0;try{BfitAfter(M)}finally{Math.random=r}const v=[p.inj||0,p.inj?p.injT:'',(M.bStrain||[]).length,M.bStrain?BmatchFactsHTML(Object.assign(M,{a:c.id}),true):''];p.inj=0;p.fit=100;return v})()`);
  w.__noStrain=0;const st=strain(60);assert.deepEqual(st.slice(0,3),[2,'מתיחת שריר מעומס',1]);assert.match(st[3],/bfit-strain[^>]*>.*שיחק עייף \(<bdi>60%<\/bdi>\) ומתח שריר: <bdi>2<\/bdi> משחקים בחוץ/);
  assert.equal(strain(80)[0],0,'not at 80');assert.equal(strain(60,60)[0],0,'not for half an hour');assert.equal(strain(60,0,{bX:{kind:'pre'}})[0],0,'not in a friendly');w.__noStrain=1;assert.equal(strain(60)[0],0);
  console.log('beginner depth: the transfer window, deals in more than one shape, every club\'s legs, the approach before and during a match, the captain, a colour for each line, the foreign limit in the line-up, fitness between matches, the break and the numbers, the calendar, the staff, the envelope, the career book, the haggle; errors',JSON.stringify(errors));
  if(errors.length)process.exitCode=1;
}catch(e){console.error(e);errors.push(String(e&&e.message||e));console.log('beginner depth errors',JSON.stringify(errors.slice(0,3)));process.exitCode=1}
finally{w.close()}
