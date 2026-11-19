// Beginner career: training is done, not chosen. It used to be one tap on a direction that then worked by itself every round.
// A session is now a press on the picture (a line of the team, or one player) that is held until the ring around it closes;
// the change is made only then. Covers the screen, a tap and an early release (nothing happens), a finger that slides away,
// a team session (one a round, every player of the line a step), individual sessions (two a round, one a player, two steps
// and morale), the rating point at the eighth step and the player at his ceiling, a new round, a live match, the dot on the
// home tile, and that drawing the screen writes nothing.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://train.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__ilmNoSplash=1;w.__noBids=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));
const tick=ms=>new Promise(r=>setTimeout(r,ms));
const quiet=()=>w.eval("(()=>{Bstate().paperPop=[];try{closeFrontPage(true)}catch(e){}try{closeReveal(true)}catch(e){}document.querySelector('.bdialog')?.remove()})()");
const ev=(el,type,x=100,y=100)=>el.dispatchEvent(new w.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y}));
const steps=()=>run("Object.fromEntries(me().players.map(p=>[p.id,[p.pos,p.bTraining||0,p.ovr,p.morale]]))");
(async()=>{
 try{
  w.eval("Bcreate('mta',{name:'דני',league:'il1'})");quiet();w.eval("G.penGame=false;Bstate().cl=null;for(const p of me().players){p.bTraining=0;p.morale=60;p.pot=Math.max(p.pot||0,p.ovr+5)}Btab='home';Brender()");
  assert.equal($('.atile[data-tab="training"] .adot').textContent,'3','three sessions wait: the dot on the home tile');
  // ---- the screen: three lines and the whole squad, each a picture with a ring, and it writes nothing
  const before=JSON.stringify(run('Bstate().tr||null'));$('.atile[data-tab="training"]').click();
  assert.deepEqual($$('.btr-unit').map(b=>b.dataset.unit),['DF','MF','FW']);assert.equal($$('.btr-player').length,run('me().players.length'));assert.ok($$('.btr-hold').every(b=>b.querySelector('.btr-ring .arc')&&b.querySelector('.btr-face')&&!b.disabled));
  assert.match($('.bheading').textContent,/מחזיקים 7 שניות/);assert.equal($$('.btr-left .btr-dots i.on').length,3);w.eval('Brender();Brender()');assert.equal(JSON.stringify(run('Bstate().tr||null')),before,'drawing the screen writes nothing');
  assert.equal($('[data-focus]'),null,'the old one-tap choice is gone');
  // ---- a tap is not a session, nor is a hold that ends early or a finger that slides away
  w.__trainMs=60;const s0=steps();let df=$('.btr-unit[data-unit="DF"]');
  ev(df,'pointerdown');assert.ok(df.classList.contains('holding'),'the ring starts');assert.equal(df.style.getPropertyValue('--hold'),'60ms');ev(df,'pointerup');assert.ok(!df.classList.contains('holding'));assert.match(df.querySelector('.btr-hint').textContent,/שחררת מוקדם/);
  ev(df,'pointerdown');await tick(20);ev(df,'pointermove',100,160);assert.ok(!df.classList.contains('holding'),'a finger that went away to scroll cancels it');await tick(90);
  assert.deepEqual(steps(),s0,'nothing happened');assert.equal(run('Bstate().tr||null'),null);
  // ---- a team session: held to the end, every player of the line moves a step, and it is the one of this round
  ev(df,'pointerdown');await tick(120);const s1=steps();
  for(const id in s0)assert.equal(s1[id][1],s0[id][1]+(s0[id][0]==='DF'?1:0),'a step for the defenders and for nobody else');
  assert.equal(run('Bstate().tr.team'),'DF');assert.equal(run('Bstate().focus'),'DF');assert.match($('.btr-result').textContent,/אימון הגנה הושלם/);
  assert.ok($('.btr-unit[data-unit="DF"]').classList.contains('done'));assert.ok($$('.btr-unit').every(b=>b.disabled),'one team session between two matches');assert.equal(w.eval("BtrainTeam('MF')"),null);
  assert.equal($$('.btr-left .btr-dots i.on').length,2);assert.equal(run('Bstate().ct.train'),1,'it counts for the missions');assert.ok(w.eval("!!BMS_DEF.train&&BMS_DEF.train.go==='training'"));
  // ---- individual sessions: two a round, one a player, two steps and some heart
  const ids=run("me().players.filter(p=>p.pos==='FW').map(p=>p.id)");let t1=$(`.btr-player[data-pid="${ids[0]}"]`);ev(t1,'pointerdown');await tick(120);
  let s2=steps();assert.equal(s2[ids[0]][1],s1[ids[0]][1]+2);assert.equal(s2[ids[0]][3],63,'morale rises by three');assert.match($('.btr-result').textContent,/אימון אישי עם/);
  assert.ok($(`.btr-player[data-pid="${ids[0]}"]`).disabled&&$(`.btr-player[data-pid="${ids[0]}"]`).classList.contains('done'));assert.equal(w.eval(`BtrainSolo(${ids[0]})`),null,'not the same player twice');
  // the eighth step is a rating point; a player at his ceiling keeps his rating
  w.eval(`(()=>{const p=me().players.find(x=>x.id===${ids[1]});p.bTraining=7;p.pot=p.ovr+3;Brender()})()`);const o1=s2[ids[1]][2];
  ev($(`.btr-player[data-pid="${ids[1]}"]`),'pointerdown');await tick(120);s2=steps();assert.equal(s2[ids[1]][2],o1+1,'the rating went up');assert.match($('.btr-result').textContent,new RegExp('הדירוג עלה ל־'+(o1+1)));
  assert.ok($$('.btr-player').every(b=>b.disabled),'two individual sessions between two matches');assert.equal(w.eval(`BtrainSolo(${ids[2]||ids[0]})`),null);assert.equal($$('.btr-left .btr-dots i.on').length,0);
  w.eval("Btab='home';Brender()");assert.equal($('.atile[data-tab="training"] .adot'),null,'nothing waits any more');
  // ---- a match later there is a new round of sessions, and a round by itself trains nobody
  const s3=steps();w.eval('BfinishRound()');quiet();const s4=steps();for(const id in s3)assert.equal(s4[id][1],s3[id][1],'no step without a session');
  assert.deepEqual(run('BtrainLeft()'),{team:1,solo:2});w.eval("Btab='training';Brender()");assert.ok($$('.btr-hold').every(b=>!b.disabled));assert.equal($('.btr-result'),null);
  w.eval("(()=>{const p=me().players.find(p=>p.pos==='MF');p.pot=p.ovr;p.bTraining=7;window.__cap=p.id;Brender()})()");const cap=w.__cap;assert.match($(`.btr-player[data-pid="${cap}"]`).textContent,/בשיא הדירוג/);
  const oc=run(`me().players.find(p=>p.id===${cap}).ovr`);ev($(`.btr-player[data-pid="${cap}"]`),'pointerdown');await tick(120);assert.equal(run(`me().players.find(p=>p.id===${cap}).ovr`),oc,'the ceiling holds');assert.equal(run('Bstate().tr.solo.length'),1);
  // ---- a rating that rises takes the price with it (a 60 who became a 70 used to keep the price of a 60)
  {const v=run("(()=>{const c=me();for(const p of c.players)p.pot=Math.max(p.pot||0,p.ovr+5);const a=c.players[4],b=c.players[5];a.rv=2e6;const was=[Bvalue(a),a.ovr,a.rv];const d=BrateUp(a,2);delete b.rv;b.value=playerValue(b);const wb=Bvalue(b);BrateUp(b,1);return {d,was,now:[Bvalue(a),a.ovr],wb,nb:Bvalue(b),pv:playerValue(b)}})()");
   assert.equal(v.d,2);assert.equal(v.now[1],v.was[1]+2);assert.ok(v.now[0]>v.was[0]*1.3&&v.now[0]<v.was[0]*1.6,'two points are about 45% more: '+v.was[0]+' → '+v.now[0]);assert.ok(v.nb>v.wb&&v.nb===v.pv,'and a player without a known market value follows the game\'s own curve')}
  // ---- a player the market does not know: priced by his rating, behind every team-mate it does know (an 18-year-old of Bayern was rated near 80 and sold for 450 thousand)
  {const u=run("(()=>{const out=[];for(const name in RAW_EURO){const raw=RAW_EURO[name],nul=raw.filter(r=>r.value_m==null);if(!nul.length)continue;let x=null;for(const co of Bcat())for(const l of co.leagues){const f=l.clubs.find(c=>c.name===name);if(f&&!x)x=f}if(!x)continue;const c=BaddClub(x);if(!c)continue;const kn=c.players.filter(p=>p.rv).map(p=>p.ovr);for(const r of nul){const p=c.players.find(p=>p.en===r.en);if(p)out.push({club:name,en:p.en,ovr:p.ovr,rv:p.rv||0,price:Bvalue(p),pv:playerValue(p),low:Math.min(...kn),unk:rawValueUnknown(p)})}}return out})()");
   assert.ok(u.length>=10,'the players without a value are in the catalogue: '+u.length);for(const p of u){assert.equal(p.rv,0,p.en+' carries no placeholder');assert.ok(p.price===p.pv||p.price===Math.round(p.pv*.65/1e4)*1e4,p.en+' costs what his rating costs (a contract in its last year takes a third off): '+p.price+' / '+p.pv);assert.ok(p.ovr<p.low||p.ovr===46,p.en+' '+p.ovr+' stands behind the squad\'s weakest known player '+p.low);assert.ok(p.unk)}
   assert.ok(u.every(p=>p.ovr<70||p.price>=4e6),'nobody good is cheap');
   // a career saved with the placeholder is put right when it loads; a player with a real value is left alone
   const fix=run("(()=>{const c=G.clubs.find(c=>c.players.some(rawValueUnknown)),p=c.players.find(rawValueUnknown),q=c.players.find(x=>x.rv);p.ovr=84;p.rv=450000;const rq=q.rv;Bwrite();Bload();const c2=G.clubs.find(x=>x.id===c.id),p2=c2.players.find(x=>x.en===p.en),q2=c2.players.find(x=>x.en===q.en);return {rv:p2.rv||0,price:Bvalue(p2),pv:playerValue(p2),same:q2.rv===rq,again:fixUnknownValue(p2),real:fixUnknownValue(q2)}})()");
   assert.equal(fix.rv,0);assert.equal(fix.price,fix.pv);assert.ok(fix.price>3e7,'an 84 at eighteen is worth tens of millions: '+fix.price);assert.ok(fix.same);assert.deepEqual([fix.again,fix.real],[false,false]);w.eval("Btab='training';Brender()")}
  // the keyboard holds too: a key kept down, released early and then held
  let mf=$('.btr-unit[data-unit="MF"]');const key=(el,t)=>el.dispatchEvent(new w.KeyboardEvent(t,{key:' ',bubbles:true,cancelable:true}));key(mf,'keydown');assert.ok(mf.classList.contains('holding'));key(mf,'keyup');assert.ok(!mf.classList.contains('holding'));
  key(mf,'keydown');await tick(120);assert.equal(run('Bstate().tr.team'),'MF');
  // ---- no training while a match is on
  w.eval("Bstate().tr=null;Bplay();BstopBroadcast();Bstate().live.paused=true");assert.equal(w.eval("BtrainTeam('FW')"),null);assert.equal(w.eval('BtrainWaiting()'),0);
  console.log('beginner training: the screen, a tap and an early release, a finger that slides away, a team session, individual sessions, the rating point and the ceiling, a new round, the keyboard, a live match; errors',JSON.stringify(errors));
  if(errors.length)process.exitCode=1;
 }catch(e){console.error(e);errors.push(String(e&&e.message||e));console.log('beginner training errors',JSON.stringify(errors.slice(0,3)));process.exitCode=1}
 finally{w.close()}
})();
