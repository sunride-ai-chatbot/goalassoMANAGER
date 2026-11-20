// Beginner career: the substitution window. One change at a time, each with its own confirmation, was the only way; and a player
// who went off injured was on neither list, so the window offered "a substitute for an injured player" above eleven healthy men.
// Covers: several players marked to go off and several to come on with one confirmation, the pairing (each newcomer to the place
// that suits him), a mark taken off again, the changes that are left as the ceiling, the foreign-player limit across a whole set,
// the injured player by name (the note, his line, the bar, the button of the live screen), the match that stops when it happens,
// two empty places filled together with an ordinary change, and a skipped match that fills the place by itself.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://subs.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__noExtras=1;w.__ilmNoSplash=1;w.__noEnv=1;w.__noBook=1;w.__noHalf=1;w.__noBids=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));
const quiet=()=>w.eval("(()=>{Bstate().paperPop=[];try{closeFrontPage(true)}catch(e){}try{closeReveal(true)}catch(e){}document.querySelector('.bdialog')?.remove()})()");
// a match at a given minute in which nothing has happened yet: the engine's own minutes would bring injuries and cards of their own
const kickoff=min=>w.eval(`(()=>{delete Bstate().live;for(const p of me().players){p.inj=0;p.susp=0;p.foreign=false}BensureXI(me());Bplay();BstopBroadcast();const M=Bstate().live.M;M.m=${min};for(const e of M.xi[G.me])e.since=0;Bstate().live.paused=true;Brender();window.__M=M})()`);
const on=pos=>run(`xiPlayers(__M,me()).filter(x=>x.p.pos==='${pos}').map(x=>x.p.id)`),sitting=pos=>run(`bench(__M,me()).filter(p=>p.pos==='${pos}').sort((a,b)=>b.ovr-a.ovr).map(p=>p.id)`);
const out=id=>$(`[data-bsub-out="${id}"]`).click(),inn=id=>$(`[data-bsub-in="${id}"]`).click(),name=id=>w.eval(`fullName(me().players.find(p=>p.id===${id}))`);
const pairs=()=>$$('.bsub-dock .bsub-pair').map(x=>[x.querySelector('.out b').textContent,x.querySelector('.in b').textContent,!!x.querySelector('small')]);
try{
  w.eval("Bcreate('mta',{name:'דני',league:'il1'})");quiet();w.eval("G.penGame=false;Bstate().cl=null");kickoff(60);
  // ---- three go off, three come on, one confirmation
  $('[data-blive="subs"]').click();assert.match($('.bdialog').textContent,/אפשר לסמן כמה שחקנים ולאשר את כולם יחד/);assert.equal($('.bsub-dock'),null,'nothing is marked yet');assert.equal($('#bsub-bench'),null);
  const df=on('DF')[0],mf=on('MF')[0],fw=on('FW')[0],bdf=sitting('DF')[0],bmf=sitting('MF')[0],bfw=sitting('FW')[0];assert.ok(df&&mf&&fw&&bdf&&bmf&&bfw,'a defender, a midfielder and a forward on the pitch and on the bench');
  const before=w.eval('JSON.stringify([__M.xi[G.me],__M.subs[G.me],__M.ev.length])');
  out(df);assert.equal($$('[data-bsub-out][aria-pressed="true"]').length,1);assert.ok($('.bsub-dock')&&!$('.bsub-dock.multi'));assert.ok($('.bsub-dock [data-bsub-go]'),'until the bench is whole the button leads to it');assert.equal($('[data-blive="sub-confirm"]'),null);
  out(mf);out(fw);assert.equal($$('[data-bsub-out][aria-pressed="true"]').length,3,'a mark does not take the one before it off');assert.ok($('.bsub-dock.multi'));assert.equal(pairs().length,3);
  assert.ok(pairs().every(p=>p[1]==='בחר מהספסל'));assert.match($('#bsub-bench').textContent,/סמן 3 שחקנים/);
  assert.ok($('.bdialog').lastElementChild.classList.contains('bsub-dock'),'the bar is the foot of the window');$('.bsub-dock [data-bsub-go]').click();
  // marked in the opposite order: the forward first. Each still goes to the place that suits him
  inn(bfw);inn(bmf);assert.ok($('.bsub-dock [data-bsub-go]')&&!$('[data-blive="sub-confirm"]'),'two of three is not whole');
  inn(bdf);assert.deepEqual(pairs(),[[name(df),name(bdf),false],[name(mf),name(bmf),false],[name(fw),name(bfw),false]],'a defender for the defender, a forward for the forward');
  const ok=$('.bsub-dock [data-blive="sub-confirm"]');assert.ok(ok&&!ok.disabled);assert.match(ok.textContent,/אישור 3 חילופים/);assert.equal($$('[data-blive="sub-confirm"]').length,1,'one button for all of them');
  assert.equal(w.eval('JSON.stringify([__M.xi[G.me],__M.subs[G.me],__M.ev.length])'),before,'marking writes nothing to the match');
  const slots=run(`[${df},${mf},${fw}].map(id=>__M.xi[G.me].find(e=>e.pid===id).slot)`);ok.click();
  assert.equal($('.bdialog'),null);assert.equal(run('__M.subs[G.me]'),3);assert.equal(run('__M.xi[G.me].length'),11);
  assert.deepEqual(run(`[${bdf},${bmf},${bfw}].map(id=>(__M.xi[G.me].find(e=>e.pid===id)||{}).slot)`),slots,'each in the place of the man he replaced');
  assert.ok(run(`[${df},${mf},${fw}].every(id=>!__M.xi[G.me].some(e=>e.pid===id)&&__M.used[G.me].includes(id))`));assert.equal(run("__M.ev.filter(e=>e.t==='sub'&&e.team===G.me&&e.m===__M.m).length"),3);assert.deepEqual(run('[BsubOuts,BsubIns]'),[[],[]]);
  // ---- a mark comes off with a second tap, and the bench never holds more than go off
  $('[data-blive="subs"]').click();assert.match($('.bdialog').textContent,/נותרו 2 מתוך 5/);
  {const [a,b,c]=on('DF'),[x,y,z]=run('bench(__M,me()).map(p=>p.id)');out(a);out(b);out(a);assert.deepEqual(run('BsubOuts'),[b],'the second tap takes the mark off');
   inn(x);out(b);assert.deepEqual(run('[BsubOuts,BsubIns]'),[[],[]],'nobody comes on for nobody');assert.equal($('.bsub-dock'),null);
   // two changes are left: a third mark takes the place of the second
   out(a);out(b);out(c);assert.deepEqual(run('BsubOuts'),[a,c]);inn(x);inn(y);inn(z);assert.deepEqual(run('BsubIns'),[x,z],'and the same on the bench');
   w.eval('BsubOuts=[];BsubIns=[]');quiet()}
  // ---- out of position is said in the bar
  {const d=on('DF')[0],gk=sitting('GK')[0];w.eval(`BsubOuts=[${d}];BsubIns=[${gk}];BsubDialog()`);assert.deepEqual(pairs(),[[name(d),name(gk),true]]);assert.match($('.bsub-dock small').textContent,/לא בעמדה הטבעית שלו/);w.eval('BsubOuts=[];BsubIns=[]');quiet()}
  // ---- the foreign-player limit holds for the set as a whole: six on the pitch, a local and a foreigner go off
  {const f=run(`(()=>{const c=me(),M=__M,xi=M.xi[c.id].map(e=>c.players.find(p=>p.id===e.pid));xi.forEach((p,i)=>{p.foreign=i>0&&i<=MAX_FOREIGN_XI});const b=bench(M,c).filter(p=>p.pos!=='GK');b.forEach((p,i)=>{p.foreign=i<2});
     return {loc:xi.find(p=>!p.foreign&&p.pos!=='GK').id,fo:xi.find(p=>p.foreign).id,b:b.slice(0,3).map(p=>p.id),on:foreignOnPitch(M,c),alone:BsubPlan(M,c,[xi.find(p=>!p.foreign&&p.pos!=='GK').id],[b[0].id]).ok}})()`);
   assert.equal(f.on,6);assert.equal(f.alone,false,'a seventh foreigner for a local is refused');
   $('[data-blive="subs"]').click();out(f.loc);assert.ok($(`[data-bsub-in="${f.b[0]}"]`).disabled&&$(`[data-bsub-in="${f.b[1]}"]`).disabled&&!$(`[data-bsub-in="${f.b[2]}"]`).disabled,'for a local alone no foreigner may be marked');
   out(f.fo);assert.ok(!$(`[data-bsub-in="${f.b[0]}"]`).disabled,'a foreigner goes off too: one may come on');inn(f.b[0]);assert.ok($(`[data-bsub-in="${f.b[1]}"]`).disabled,'but not two');assert.ok(!$(`[data-bsub-in="${f.b[0]}"]`).disabled,'the marked one can still be taken off');
   inn(f.b[2]);const k=$('.bsub-dock [data-blive="sub-confirm"]');assert.ok(k&&!k.disabled);assert.match(k.textContent,/אישור 2 חילופים/);k.click();
   assert.equal(run('__M.subs[G.me]'),5);assert.equal(run('foreignOnPitch(__M,me())'),6,'six before, six after, never seven on the way');assert.equal(run('__M.xi[G.me].length'),11);
   $('[data-blive="subs"]').click();assert.match($('.bdialog .bnote').textContent,/נוצלו כל החילופים/);assert.equal($('[data-bsub-out]'),null);quiet()}
  // ---- a player goes off injured: the engine takes him off at once, so the window has to say who he was
  kickoff(20);
  const hurt=who=>run(`(()=>{const M=__M,c=me(),x=xiPlayers(M,c).find(x=>x.p.id===${who});setInjury(x.p,2);markOut(M,c,x.e);M.xi[c.id]=M.xi[c.id].filter(e=>e!==x.e);M.ev.push({m:M.m,t:'inj',team:c.id,pid:x.p.id,name:fullName(x.p),weeks:x.p.inj,injT:x.p.injT,needSub:true});return x.p.injT})()`);
  const im=on('MF')[0],injT=hurt(im);assert.deepEqual(run('BsubHurt(__M).map(e=>e.pid)'),[im]);
  w.eval('BpaintBroadcast()');assert.ok($('.bsubs-open').classList.contains('need'));assert.ok($('.bsubs-open').textContent.includes(name(im))&&/נפצע · הכנס מחליף/.test($('.bsubs-open').textContent),'the button of the live screen names him');
  // a forced minute (a test, or a match being skipped without the flag) opens nothing; a watched one stops the match and opens the window on him
  w.eval('BinjuryStop(__M,true)');assert.equal($('.bdialog'),null);assert.equal(run('__M.subs[G.me]'),0,'and nobody is sent on behind his back');
  w.eval('Bstate().live.paused=false;BinjuryStop(__M,false)');assert.ok($('.bdialog'),'the window opens when it happens');assert.equal(run('Bstate().live.paused'),true,'and the match waits');
  assert.match($('.bdialog .bnote.bad').textContent,new RegExp(name(im)+' נפצע וירד מהמגרש'));assert.match($('.bdialog .bnote.bad').textContent,/משחקת בחסר עד שייכנס מחליף/);
  {const r=$('.bsub-player.hurt');assert.ok(r&&r.hasAttribute('data-bsub-fill'));assert.equal(r.getAttribute('aria-pressed'),'true','his place is already marked');assert.ok(r.textContent.includes(name(im)));assert.match(r.textContent,/קישור · נפצע בדקה 20/);if(injT)assert.ok(r.textContent.includes(injT));assert.match(r.textContent,/הכנס מחליף במקומו/);
   assert.equal($$('[data-bsub-out]:not([data-bsub-fill])').length,10,'ten are left on the pitch');assert.equal($(`[data-bsub-out="${im}"]`),null,'and he is not one of them');
   assert.deepEqual(pairs(),[[name(im),'בחר מהספסל',false]]);assert.match($('.bsub-dock .out.hurt i').textContent,/נפצע/)}
  quiet();w.eval('BinjuryStop(__M,false)');assert.equal($('.bdialog'),null,'once: it does not open again every minute');
  // a second one is hurt, and an ordinary change beside the two empty places: three changes, one confirmation
  {const id2=on('DF')[0];hurt(id2);const d3=on('DF')[0],bm=sitting('MF')[0],bd=sitting('DF').slice(0,2);assert.deepEqual(run('BsubHurt(__M).map(e=>e.pid)'),[im,id2]);
   $('[data-blive="subs"]').click();assert.equal($$('.bsub-player.hurt').length,2);assert.match($('.bdialog .bnote.bad').textContent,/נפצעו וירדו מהמגרש/);
   out(-im);out(-id2);out(d3);inn(bd[0]);inn(bd[1]);inn(bm);const p=pairs();assert.equal(p[0][1],name(bm),'the midfielder is the one sent to the midfielder\'s place');assert.ok(p.every(x=>!x[2]));
   $('.bsub-dock [data-blive="sub-confirm"]').click();assert.equal(run('__M.xi[G.me].length'),11,'eleven again');assert.equal(run('__M.subs[G.me]'),3);assert.equal(run("__M.ev.filter(e=>e.t==='sub'&&e.team===G.me&&!e.outPid).length"),2);
   assert.deepEqual(run('BsubHurt(__M)'),[]);w.eval('BpaintBroadcast()');assert.ok(!$('.bsubs-open').classList.contains('need'));assert.equal($('.bsubs-open').textContent,'⇄ חילופים')}
  // ---- a match skipped to the end fills an empty place by itself (it used to be played a man short to the whistle)
  kickoff(10);{const d=on('DF')[0];hurt(d);$('[data-blive="skip"]').click();const fill=run("__M.ev.filter(e=>e.t==='sub'&&e.team===G.me&&!e.outPid)");assert.ok(fill.length>=1,'somebody was sent on');assert.equal(fill[0].m,10,'at once');
   assert.equal(run(`me().players.find(p=>p.id===${fill[0].inPid}).pos`),'DF','a man of his position');assert.equal(run('!!Bstate().live'),false,'and the match was played out')}
  quiet();
  console.log('beginner substitutions: several at once with one confirmation, the pairing, marks taken off, the ceiling, the foreign limit across a set, the injured player by name, the match stops for him, empty places filled together, a skipped match; errors',JSON.stringify(errors));
  if(errors.length)process.exitCode=1;
}catch(e){console.error(e);errors.push(String(e&&e.message||e));console.log('beginner substitutions errors',JSON.stringify(errors.slice(0,3)));process.exitCode=1}
finally{w.close()}
