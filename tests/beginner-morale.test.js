// Beginner career: fitness and morale. The substitution window showed a name, a place and a rating, so nothing said who was
// tired; and the career had no morale at all (every player kept the number he was made with). Covers the two meters on every
// row of the window (the energy of the match for whoever is on the pitch, a fresh 100 for the bench), the bar that holds the
// change and its button, and the rule: whoever plays takes the result, whoever is fit and left out loses heart according to
// what he may expect, down to a floor, and gets it back with minutes.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://morale.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__ilmNoSplash=1;w.__noBids=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));
const quiet=()=>w.eval("(()=>{Bstate().paperPop=[];try{closeFrontPage(true)}catch(e){}try{closeReveal(true)}catch(e){}document.querySelector('.bdialog')?.remove()})()");
try{
  w.eval("Bcreate('mta',{name:'דני',league:'il1'})");quiet();w.eval("G.penGame=false;Bstate().cl=null;for(const p of me().players){p.morale=66;p.bOut=0;p.inj=0;p.susp=0}");
  // ---- the rule, on a match made by hand: eleven played and won, everybody else was fit and sat out
  const after=(gh,ga,extra='')=>run(`(()=>{const c=me();BensureXI(c);const xi=c.lineup.slice();${extra};const M={h:c.id,a:Bstate().league.find(id=>id!==c.id),gh:${gh},ga:${ga},xi:{[c.id]:xi.map(pid=>({pid}))},used:{[c.id]:[]}};
    const before=Object.fromEntries(c.players.map(p=>[p.id,p.morale]));BmoraleAfter(M);BmoraleAfter(M);const k=BmoraleRank(c);
    return c.players.map(p=>({id:p.id,d:p.morale-before[p.id],m:p.morale,out:p.bOut||0,played:xi.includes(p.id),kind:BmoraleKind(p,k),inj:p.inj||0}))})()`);
  let r=after(2,0);
  assert.ok(r.filter(x=>x.played).length===11&&r.filter(x=>x.played).every(x=>x.d===3&&x.out===0),'whoever played a win gains 3 (and the same match counts once)');
  const left=r.filter(x=>!x.played);assert.ok(left.length>=8);assert.ok(left.every(x=>x.d===-[3,2,1][x.kind]&&x.out===1),'left out: 3, 2 or 1 by what he may expect');
  assert.ok(left.some(x=>x.kind===2)&&left.some(x=>x.kind===1),'reserves of both kinds');
  r=after(0,1);assert.ok(r.filter(x=>x.played).every(x=>x.d===-1),'a defeat costs whoever played 1');r=after(1,1);assert.ok(r.filter(x=>x.played).every(x=>x.d===1));
  // an injured player is left alone, and nobody falls under his floor
  r=after(1,0,"c.players.find(p=>!xi.includes(p.id)).inj=3");assert.equal(r.find(x=>x.inj).d,0);w.eval("for(const p of me().players)p.inj=0");
  for(let i=0;i<40;i++)r=after(1,0);
  assert.ok(r.filter(x=>!x.played).every(x=>x.m===[15,30,42][x.kind]),'floors: 15, 30, 42');assert.ok(r.filter(x=>x.played).every(x=>x.m===100));
  // minutes give it back: three more than the result when the wait was three matches or longer
  const back=run(`(()=>{const c=me();BensureXI(c);const p=c.players.find(p=>!c.lineup.includes(p.id)&&p.pos!=='GK'),was=p.morale,out=p.bOut;const xi=c.lineup.slice();xi[xi.length-1]=p.id;
    BmoraleAfter({h:c.id,a:Bstate().league.find(id=>id!==c.id),gh:1,ga:0,xi:{[c.id]:xi.map(pid=>({pid}))},used:{[c.id]:[]}});return {d:p.morale-was,out,now:p.bOut}})()`);
  assert.ok(back.out>=3);assert.deepEqual([back.d,back.now],[6,0],'a win after a long wait: 3 + 3');
  // the daily challenge and somebody else's match change nothing
  assert.equal(run(`(()=>{const c=me(),s=JSON.stringify(c.players.map(p=>[p.morale,p.bOut]));const o=Bstate().league.filter(id=>id!==c.id);BmoraleAfter({h:o[0],a:o[1],gh:1,ga:0,xi:{},used:{}});
    Bstate().daily=1;BmoraleAfter({h:c.id,a:o[0],gh:1,ga:0,xi:{[c.id]:[]},used:{[c.id]:[]}});delete Bstate().daily;return s===JSON.stringify(c.players.map(p=>[p.morale,p.bOut]))})()`),true);
  // ---- a real round moves it, and a summer lifts whoever lost heart
  w.eval("for(const p of me().players){p.morale=66;p.bOut=0}");w.eval('BfinishRound()');quiet();
  const real=run("me().players.map(p=>[p.morale,p.bOut||0])");assert.ok(real.filter(x=>x[1]===0&&x[0]!==66).length>=11,'the eleven took the result');assert.ok(real.filter(x=>x[1]===1&&x[0]<66).length>=6,'the unused lost some');
  w.eval("me().players[0].morale=44;me().players[0].bOut=9;me().players[1].morale=58;Bseason()");assert.deepEqual(run("me().players.slice(0,2).map(p=>[p.morale,p.bOut])"),[[54,0],[60,0]]);
  // ---- drawing a screen changes nothing
  {const snap=()=>run("me().players.map(p=>[p.id,p.morale,p.bOut||0])");const a=JSON.stringify(snap());w.eval("Btab='squad';Brender();Btab='home';Brender();Bdetail(me().players[3].id)");quiet();assert.equal(JSON.stringify(snap()),a)}
  // ---- the substitution window: two meters on every row, the pitch tired and the bench fresh
  w.eval("me().players.forEach((p,i)=>{p.morale=i%2?40:80;p.bOut=i%3?0:4});BensureXI(me());Bplay();BstopBroadcast();for(let i=0;i<70;i++)Btick(true);Bstate().live.paused=true;Brender()");
  $('[data-blive="subs"]').click();
  const outs=$$('[data-bsub-out]:not([data-bsub-out="0"])');assert.ok(outs.length>=10);
  assert.ok(outs.every(b=>b.querySelector('.bmeter[data-fit]')&&b.querySelector('.bmeter[data-morale]')),'fitness and morale on every player of the eleven');
  const fits=outs.map(b=>+b.querySelector('[data-fit]').dataset.fit);assert.ok(fits.every(f=>f<100&&f>=15)&&fits.some(f=>f<90),'seventy minutes cost energy: '+fits.join(','));
  assert.equal(fits[0],run("(()=>{const M=Bstate().live.M,c=me(),x=xiPlayers(M,c)[0];return liveEnergy(M,c,x.p,x.e,M.m)})()"),'the number is the one the engine plays with');
  assert.match($('.bdialog').textContent,/מורל נמוך משחק פחות טוב/);
  outs[3].click();const ins=$$('[data-bsub-in]');assert.ok(ins.length>=5);
  assert.ok(ins.every(b=>+b.querySelector('[data-fit]').dataset.fit===100&&b.querySelector('[data-morale]')),'the bench is fresh');
  const words=new Set(ins.map(b=>b.querySelector('.bmeter[data-morale] em').textContent));assert.ok(words.has('נמוך')&&words.has('טוב'),[...words].join(','));
  assert.ok(ins.some(b=>/לא שיחק 4 משחקים/.test(b.textContent)),'how long he has waited');
  assert.ok($('.bdialog').lastElementChild.classList.contains('bsub-dock'));
  // the page of one of his own players says it too, in a note that is not a beginner's tip (those are put away after two rounds)
  w.eval("document.querySelector('.bdialog').remove();BstopBroadcast();Bdetail(me().players.find(p=>p.bOut>=3).id)");
  assert.match($('.bdialog .bclub-summary').textContent,/מורל (נמוך|טוב)/);assert.match($('.bdialog .bnote').textContent,/לא שיחק 4 משחקים ברצף/);assert.equal($('.bdialog .bnote').classList.contains('blearn'),false);
  console.log('beginner morale: the rule (played, left out by expectation, floors, the way back, injured, summer), a real round, screens only read, two meters on every row of the substitution window, the player page; errors',JSON.stringify(errors));
  if(errors.length)process.exitCode=1;
}catch(e){console.error(e);errors.push(String(e&&e.message||e));console.log('beginner morale errors',JSON.stringify(errors.slice(0,3)));process.exitCode=1}
finally{w.close()}
