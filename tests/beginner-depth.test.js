// Beginner career: what a match day was missing.
// The approach: three buttons (defensive, balanced, attacking) stood on the live screen from the first day and the engine has always
//   read them, but nothing showed which one was in force and no word said what it does — reported as "I press them and nothing happens".
// The captain: the engine gives a side whose captain is on the pitch a little more; the game chose one and never said who.
// A colour for each line of the team (goalkeeper, defence, midfield, attack) round every player, the same wherever he is shown.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://depth.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__noExtras=1;w.__noInjStop=1;w.__ilmNoSplash=1;w.__noBids=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
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
  console.log('beginner depth: the approach before and during a match, the captain, a colour for each line; errors',JSON.stringify(errors));
  if(errors.length)process.exitCode=1;
}catch(e){console.error(e);errors.push(String(e&&e.message||e));console.log('beginner depth errors',JSON.stringify(errors.slice(0,3)));process.exitCode=1}
finally{w.close()}
