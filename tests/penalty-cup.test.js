// אלוף הפנדלים (36j-penalty-cup.js): the rules of a duel kick, the throw-away state around a career, a shoot-out against
// the computer, two people on one phone, two phones over an injected channel (lost messages, a second guest, a forged
// reveal), and the beginner page: the entry, its own career untouched, the highlights speed and the shout bar.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];
const open=(file,url,extra)=>{const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
  return new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url,runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
    beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{};if(extra)extra(w)}}).window};
const tick=(ms=0)=>new Promise(r=>setTimeout(r,ms));
const until=async(test,what,ms=15000)=>{const t0=Date.now();while(!test()){if(Date.now()-t0>ms)throw new Error('timed out waiting for '+what);await tick(10)}};
const tools=w=>({$:s=>w.document.querySelector(s),$$:s=>[...w.document.querySelectorAll(s)],run:code=>JSON.parse(w.eval(`JSON.stringify(${code})`))});
/* an in-memory room: every message goes to everybody else in the room, a little later; drop(p) loses it */
function makeBus(){const rooms={};const bus={drop:null,sent:[],factory:()=>(code,onMsg)=>{const room=rooms[code]||(rooms[code]=[]);const me={onMsg,closed:false};room.push(me);
  return Promise.resolve({send:p=>{const copy=JSON.parse(JSON.stringify(p));bus.sent.push(copy);if(bus.drop&&bus.drop(copy))return;for(const x of room)if(x!==me&&!x.closed)setTimeout(()=>{if(!x.closed)x.onMsg(JSON.parse(JSON.stringify(copy)))},3)},close:()=>{me.closed=true}})}};return bus}
(async()=>{
 const wins=[];
 try{
  const w=open('ligat-haal-manager.html','https://pcup.test/');wins.push(w);const {$,$$,run}=tools(w);await w.ILM.ready;

  // ---- rules: pure, the same on every phone
  assert.equal(w.eval("pcupHash('UL:abc')"),w.eval("pcupHash('UL:abc')"));assert.notEqual(w.eval("pcupHash('UL:abc')"),w.eval("pcupHash('UR:abc')"));assert.equal(w.eval("pcupHash('x').length"),16);
  assert.deepEqual(run("(()=>{const a=pcupRng(7),b=pcupRng(7);return [a(),a(),a()].join()===[b(),b(),b()].join()})()"),true);
  assert.deepEqual(run("pcupResolve('UL','DR',80,75,pcupRng(99))"),run("pcupResolve('UL','DR',80,75,pcupRng(99))"),'one seed, one result');
  const stat=run(`(()=>{const N=6000,o={};const rate=(kd,gd,sk,gk)=>{let g=0,off=0,sv=0;for(let i=0;i<N;i++){const r=pcupResolve(kd,gd,sk,gk,pcupRng(i*7919+13));if(r.out==='goal')g++;else if(r.how==='save')sv++;else off++}return {g:g/N,off:off/N,sv:sv/N}};
    o.wrong=rate('DL','DR',75,75);o.right=rate('DL','DL',75,75);o.near=rate('DL','UL',75,75);o.star=rate('UR','L',92,70);o.weak=rate('UR','L',55,70);o.starSame=rate('DL','DL',92,60);o.weakSame=rate('DL','DL',55,88);return o})()`);
  assert.equal(stat.wrong.sv,0,'a keeper who goes the other way saves nothing');assert.ok(stat.wrong.g>.8,'wrong side: a goal unless the kick misses the frame, got '+stat.wrong.g);
  assert.ok(stat.right.sv>.55,'the right corner at the right height is saved most of the time, got '+stat.right.sv);assert.ok(stat.near.g>stat.right.g+.2,'the right side at the wrong height saves fewer');
  assert.ok(stat.star.off<stat.weak.off-.04,'a better finisher misses the frame less: '+stat.star.off+' / '+stat.weak.off);assert.ok(stat.starSame.g>stat.weakSame.g+.15,'quality of finisher and keeper shifts the save');

  // ---- the entry on the first screen; it opens without a career
  assert.ok($('[data-pcup-open]'),'entry on the start screen');$('[data-pcup-open]').click();await until(()=>$('#pcup'),'the lobby');
  assert.equal(w.eval('G.pcup'),true);assert.equal(w.eval('SANDBOX'),true);assert.ok($$('[data-pc-team]').length>=30,'Israeli and European clubs to choose from');
  $('#pcup [data-pc-x]').click();assert.equal($('#pcup'),null);assert.equal(w.eval('G'),null,'no career was invented');assert.equal(w.eval('SANDBOX'),false);

  // ---- with a career: untouched while we play, back afterwards
  for(const s of ['[data-pick="mhf"]','#signBtn','[data-sponsor="0"]','[data-board="none"]'])$(s).click();
  w.eval("G.pressMode='off';G.motion='off';G.sound=false;G.paperPopOff=true;G.paperPop=[];");
  await w.ILM.whenSaved();const before=run("({me:G.me,wk:G.wk,money:me().money,uid,n:me().players.length})");
  assert.ok($('[data-pcup-open]'),'entry on the home screen');$('[data-pcup-open]').click();await until(()=>$('#pcup'),'the lobby over a career');
  assert.equal(w.eval('G.pcup'),true);assert.notEqual(w.eval('G.me'),null);await w.ILM.whenSaved();const disk=w.eval("Object.keys(localStorage).filter(k=>/^ilm2/.test(k)).sort().map(k=>k+':'+localStorage.getItem(k).length).join()+'|'+localStorage.getItem('ilm2').slice(0,4000)");
  const euro=$$('[data-pc-team]').find(b=>b.dataset.pcTeam.startsWith('e:'));assert.ok(euro,'a European club in the list');euro.click();
  assert.equal($$('[data-pc-mode]').length,3,'computer, one phone, online');assert.match($('#pcup').textContent,/בלוטות/,'says plainly what a browser cannot do');

  // against the computer: the shoot-out of the full game, with a way out
  $('[data-pc-mode="cpu"]').click();assert.equal($('#penGame'),null);assert.ok($$('[data-pc-cpuopp]').length>=30,'against the computer the opponent is chosen too');const rival=$$('[data-pc-cpuopp]').find(b=>b.dataset.pcCpuopp==='i:mta');rival.click();assert.ok($('#penGame'),'the penalty overlay');assert.match($('#penGame .pg-meta').textContent,/מכבי ת"א|מכבי תל אביב/,'the chosen opponent');assert.ok($('#penGame .pc-quit'),'a way out of the overlay');
  assert.equal(w.eval('G.me'),w.eval('PCUP.clubs[PCUP.my.key].id'),'the chosen club is ours');assert.match($('#penGame .pg-meta').textContent,new RegExp(w.eval('PCUP.my.name').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  $('#pgGo').click();await until(()=>w.eval('!!(PG&&(PG.fire||PG.strike||PG.pick))'),'the first kick');
  // the stand: three swaying bands of spectators and a few camera flashes, and it answers the kick
  assert.equal($$('#penGame .pg-crowd').length,3,'three bands in the stand');assert.ok($$('#penGame .pg-crowd circle').length>60,'a full front row');assert.ok($$('#penGame .pg-spark').length>=8,'camera flashes');assert.ok($('#penGame image[href*="stand-crowd"]'),'the photographed stand behind it');
  w.eval("penCheer('goal',true)");assert.ok($('#pgStage').classList.contains('pg-cheer')&&$('#pgStage').classList.contains('pg-cheer-big'),'our goal makes the stand leap');
  w.eval("penCheer('save',true)");assert.ok($('#pgStage').classList.contains('pg-cheer')&&!$('#pgStage').classList.contains('pg-cheer-big'),'a miss of ours is only a murmur');
  // play it out: we always aim at a top corner; in goal we always go low right
  let guard=0;while(!$('#pgDone')){if(++guard>4000)throw new Error('the shoot-out never ended');w.eval("if(PG){try{PG.fire&&PG.fire(3.2,2.1)}catch(e){}try{PG.go&&PG.go('DR')}catch(e){}}");await tick(5)}
  const endOK=(D,gh,ga,what)=>{const e=D.querySelector('.pg-endsc'),n=[...e.children];assert.equal(e.querySelector('[dir="ltr"]'),null,what+': never one left-to-right "4:5" between two names');assert.equal(n.length,3);assert.ok(n[1].classList.contains('sides'));assert.equal(n[1].querySelector('.sd-h').textContent,String(gh),what+': the first club\'s number is the first (right-hand) one');assert.equal(n[1].querySelector('.sd-a').textContent,String(ga),what)};
  {const sc=run('G&&PG?[... (PG.root.querySelectorAll("#pgSo .pg-so-row strong"))].map(x=>+x.textContent):null')||[];if(sc.length===2)endOK(w.document,sc[0],sc[1],'against the computer');else assert.ok($('.pg-endsc .sides'),'against the computer')}
  const rec0=run('pcupRec()');$('#pgDone').click();const rec1=run('pcupRec()');assert.equal(rec1.played,rec0.played+1,'the result is recorded once');assert.equal($('#penGame'),null);assert.ok($('[data-pc-mode="cpu"]'),'back at the modes');
  // leaving in the middle records nothing
  $('[data-pc-mode="cpu"]').click();$('[data-pc-cpuopp="?"]').click();assert.ok($('#penGame'),'or drawn by lot');$('#penGame .pc-quit').click();assert.equal($('#penGame'),null);assert.equal(run('pcupRec()').played,rec1.played);

  // ---- two people on one phone, both at once, facing each other: a strip each, a slide of the finger chooses
  assert.deepEqual(run("[[30,0],[30,-30],[0,-30],[-30,-30],[-30,0],[-30,30],[0,30],[30,30],[5,5],[0,0]].map(v=>pcupSwipeDir(v[0],v[1]))"),['R','UR','U','UL','L','DL','D','DR',null,null],'eight directions on the screen; a touch that does not travel chooses nothing');
  $('[data-pc-mode="seat"]').click();const same=w.eval('PCUP.my.key');$$('[data-pc-opp]').find(b=>b.dataset.pcOpp===same).click();assert.ok($('#penGame'),'the duel');
  assert.notEqual(w.eval("PCUP.clubs[PCUP.my.key].id"),w.eval("PCUP.clubs[PCUP.my.key+'#2'].id"),'the twin has its own id');
  w.eval("window.__seat=[];(()=>{const real=pcupResolve;pcupResolve=function(kd,gd){window.__seat.push([kd,gd]);return real.apply(this,arguments)}})()");
  const slide=(el,dx,dy,pid)=>{const mk=(t,x,y)=>{const e=new w.MouseEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y});if(pid!=null)Object.defineProperty(e,'pointerId',{value:pid});return e};el.dispatchEvent(mk('pointerdown',100,100));el.dispatchEvent(mk('pointermove',100+dx/2,100+dy/2));el.dispatchEvent(mk('pointerup',100+dx,100+dy))};
  let kicks=0;const roles=[],expect=[];guard=0;const TURN={U:'D',D:'U',L:'R',R:'L',UL:'DR',UR:'DL',DL:'UR',DR:'UL'};
  while(!$('#pgDone')){if(++guard>6000)throw new Error('the one-phone duel never ended');
    if(w.eval('!!(PCUP&&PCUP.asking)')){const zs=$$('.pc-zone');assert.equal(zs.length,2,'a strip for each player');assert.ok($('.pc-zone[data-zone="b"]').classList.contains('far')&&$('.pc-zone[data-zone="a"]').classList.contains('near'),'the second club at the far edge and turned to its player, the first at the near edge');
      assert.equal($$('.pc-zone button,.pc-pad,.pg-dirs').length,0,'no buttons and no arrows: the finger slides');assert.deepEqual(zs.map(z=>z.dataset.role).sort(),['keep','kick'],'one kicks, one keeps goal');assert.equal($('#pcReady'),null,'the phone never changes hands');
      const kick=$('.pc-zone[data-role="kick"]'),keep=$('.pc-zone[data-role="keep"]');roles.push(kick.dataset.zone);assert.ok($('#penGame').classList.contains('pc-face'),'the picture takes the whole screen');
      // the pitch turns to the kicker: when the far player kicks, the picture is turned and a slide is read in the turned picture
      const flip=$('#pgStage').classList.contains('pc-flip');assert.equal(flip,kick.dataset.zone==='b','the taker\'s back is at the kicker\'s own edge');assert.ok($('#pgStage #pgView'));const see=d=>flip?TURN[d]:d;
      // nothing runs until one press; it starts the count of three seconds
      assert.ok($('.pc-go'),'one button in the middle');assert.ok($('.pc-turn').hidden,'no count before the press');if(kicks===2){await tick(900);assert.ok(w.eval('PCUP.asking'),'it waits as long as nobody presses');}
      if(kicks>=1){$('.pc-go').click();assert.equal($('.pc-go'),null);assert.ok(!$('.pc-turn').hidden);assert.equal($('.pc-turn').textContent,'3')}
      if(kicks===0){   // nobody slid a finger: the kick still happens, the keeper stays in the middle
       }else if(kicks===1){   // the last slide before the whistle counts; two fingers at the same moment are both heard; a tap is nothing
        slide(keep,-40,40,1);assert.ok(keep.classList.contains('set'));assert.ok(!kick.classList.contains('set'),'only the one who chose is marked');
        const d1=(t,x,y,pid)=>{const e=new w.MouseEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y});Object.defineProperty(e,'pointerId',{value:pid});return e};
        keep.dispatchEvent(d1('pointerdown',50,50,7));kick.dispatchEvent(d1('pointerdown',200,300,8));keep.dispatchEvent(d1('pointerup',10,10,7));kick.dispatchEvent(d1('pointerup',260,300,8));slide(kick,3,2,9);
        assert.equal($$('.pc-zone [data-dir],.pc-zone .on').length,0,'a strip never shows which way');assert.doesNotMatch(keep.textContent+kick.textContent,/UL|שמאל|ימין|למעלה|למטה/);assert.deepEqual(run('PCUP.pads()'),kick.dataset.zone==='a'?{a:'R',b:'UL'}:{a:see('UL'),b:see('R')});expect[1]=[see('R'),see('UL')];
       }else{slide(kick,40,-40);slide(keep,-40,40);expect[kicks]=[see('UR'),see('DL')]}
      const want=run('PCUP.pads()');kicks++;w.eval('PCUP.whistle()');assert.equal(w.eval('PCUP.asking'),false);assert.equal($$('.pc-zone,.pc-go').length,0,'the strips leave at the whistle and the picture is clear');
      const chips=$$('.pc-chose');assert.equal(chips.length,2,'each choice is shown at its own edge once the kick is on');const near=chips.find(c=>c.classList.contains('near')),far=chips.find(c=>c.classList.contains('far'));
      if(want.a)assert.equal(near.dataset.dir,want.a);if(want.b)assert.equal(far.dataset.dir,want.b);if(kicks===1)assert.ok(chips.some(c=>c.dataset.dir===''),'the keeper who did not slide is shown standing')}
    await tick(5)}
  assert.ok(kicks>=6,'at least six kicks decide a shoot-out, got '+kicks);assert.ok(roles.every((r,i)=>i===0||r!==roles[i-1]),'kicker and keeper swap with every kick: '+roles.join(''));
  const seat=run('window.__seat');assert.equal(seat.length,kicks);assert.ok(seat[0][0]&&seat[0][1]===null,'no slide: the ball goes somewhere, the keeper stays');assert.deepEqual(seat[1],expect[1],'the last slide of each player, read in the picture as it lay');for(let i=2;i<kicks;i++)assert.deepEqual(seat[i],expect[i],'kick '+i);assert.ok(expect.slice(1).some(e=>e[0]==='UR')&&expect.slice(1).some(e=>e[0]==='DL'||e[0]==='L'),'both orientations were played');assert.equal($('#pgStage').classList.contains('pc-flip'),false,'the picture is upright again at the end');
  const sc=run('({a:PCUP.duel.S.a,b:PCUP.duel.S.b})');assert.ok(w.eval(`penShootoutDone(${JSON.stringify(sc.a)},${JSON.stringify(sc.b)})`),'ended by the shoot-out rule');
  {const sum=x=>x.reduce((t,v)=>t+v,0);endOK(w.document,sum(sc.a),sum(sc.b),'one phone');assert.match($('.pg-endsc').children[0].textContent+$('.pg-endsc').children[2].textContent,/./)}
  $('#pgDone').click();assert.equal(run('pcupRec()').duels,(rec1.duels||0)+1);assert.equal(run('pcupRec()').played,rec1.played,'a duel between two people is not a win of mine');

  // ---- close: the career is exactly as it was, nothing was written
  w.eval('save()');await w.ILM.whenSaved();assert.equal(w.eval("Object.keys(localStorage).filter(k=>/^ilm2/.test(k)).sort().map(k=>k+':'+localStorage.getItem(k).length).join()+'|'+localStorage.getItem('ilm2').slice(0,4000)"),disk,'nothing is written while the lobby is open, not even by save()');
  $('#pcup [data-pc-x]').click();await w.ILM.whenSaved();
  const after=run("({me:G.me,wk:G.wk,money:me().money,uid,n:me().players.length})");
  assert.deepEqual(after,before,'career and id counter as before');assert.equal(w.eval('SANDBOX'),false);assert.equal(w.eval('!!G.pcup'),false);assert.ok($('[data-pcup-open]'),'the home screen is back');

  // ---- two phones. The channel loses the first start, the first commit of kick 0 and the first reveal of kick 1.
  const bus=makeBus();const lost={};bus.drop=p=>{const key=p.t==='start'?'start':p.t==='c'&&p.k===0?'c0:'+p.f:p.t==='r'&&p.k===1?'r1:'+p.f:null;if(!key||lost[key])return false;lost[key]=true;return true};
  const g=open('beginner.html','https://pcup.test/beginner.html?pen=QQ77ZZ',x=>{x.__pcupNet=bus.factory()});wins.push(g);const G2=tools(g);
  w.__pcupNet=bus.factory();$('[data-pcup-open]').click();await until(()=>$('#pcup'),'host lobby');$$('[data-pc-team]').find(b=>b.dataset.pcTeam==='i:mhf').click();$('[data-pc-mode="net"]').click();
  w.eval("pcupNewCode=()=>'QQ77ZZ'");$('[data-pc-net="host"]').click();await until(()=>$('.pc-code'),'the room code');assert.equal($('.pc-code').textContent,'QQ77ZZ');assert.ok($('[data-pc-share]'));
  // the guest came through the link: the lobby opens by itself and goes straight into the room after the team choice
  await until(()=>G2.$('#pcup'),'guest lobby from the link',8000);assert.match(G2.$('#pcup').textContent,/QQ77ZZ/);G2.$$('[data-pc-team]').find(b=>b.dataset.pcTeam==='i:mhf').click();
  await until(()=>$('#penGame')&&G2.$('#penGame'),'both phones in the duel');assert.ok(lost.start,'the first start was lost and sent again');
  assert.equal(w.eval('PCUP.net.duel.mine'),'a');assert.equal(g.eval('PCUP.net.duel.mine'),'b');
  assert.deepEqual(G2.run('PCUP.net.duel.A.ord.map(p=>fullName(p)).concat(PCUP.net.duel.B.sk,PCUP.net.duel.A.gkS)'),run('PCUP.net.duel.A.ord.map(p=>fullName(p)).concat(PCUP.net.duel.B.sk,PCUP.net.duel.A.gkS)'),'both phones use the host\'s takers and skills');
  // a third phone with the code is told the room is full and never disturbs the duel
  const third=[];const ch3=await bus.factory()('QQ77ZZ',m=>third.push(m));ch3.send({v:1,f:'intruder01',t:'hi',team:'i:mta'});await until(()=>third.some(m=>m.t==='full'&&m.to==='intruder01'),'the full answer');
  ch3.send({v:1,f:'intruder01',t:'c',k:0,h:'0000000000000000'});ch3.send({v:1,f:'intruder01',t:'bye'});
  guard=0;const dirs=['UL','UR','DL','DR','L','R','U','D'];
  while(!($('#pgDone')&&G2.$('#pgDone'))){if(++guard>9000)throw new Error('the online duel never ended');
    for(const T of [{$,w},{$:G2.$,w:g}])if(T.$('.pg-dirs')){const d=dirs[(guard*7+(T.w===g?3:0))%8];T.$(`.pg-dirs [data-dir="${d}"]`).click()}
    await tick(5)}
  assert.ok(lost['c0:'+w.eval('PCUP.net.id')]||lost['c0:'+g.eval('PCUP.net.id')],'a commit was lost and sent again');
  const sa=run('PCUP.duel.S'),sb=G2.run('PCUP.duel.S');assert.deepEqual(sb,sa,'both phones saw the same kicks');{const sum=x=>x.reduce((t,v)=>t+v,0);endOK(w.document,sum(sa.a),sum(sa.b),'online, host');endOK(g.document,sum(sa.a),sum(sa.b),'online, guest')}assert.ok(sa.a.length+sa.b.length>=6);
  assert.notEqual($('.pg-end').classList.contains('good'),G2.$('.pg-end').classList.contains('good'),'one won, one lost');
  // a reveal never travels before the other side's commit arrived
  for(const id of [w.eval('PCUP.net.id'),g.eval('PCUP.net.id')]){const other=bus.sent.findIndex(m=>m.t==='c'&&m.k===0&&m.f!==id),mine=bus.sent.findIndex(m=>m.t==='r'&&m.k===0&&m.f===id);assert.ok(other>=0&&mine>other,'reveal after the other commit')}
  const hostRec=run('pcupRec()');$('#pgDone').click();G2.$('#pgDone').click();assert.equal(run('pcupRec()').played,hostRec.played+1);assert.equal(G2.run('pcupRec()').played,1);
  // the room outlives the duel: a second one needs no new code, and either phone may change club first
  await until(()=>$('[data-pc-again]')&&G2.$('[data-pc-again]'),'the rematch screen on both phones');
  assert.equal(w.eval("PCUP.net.state"),'over','the host keeps the room open');
  $('[data-pc-newteam]').click();await until(()=>$('[data-pc-team]'),'the club grid inside the room');
  assert.ok(w.eval('!!PCUP.net'),'changing club does not close the room');
  $('[data-pc-team="i:hbs"]').click();await until(()=>$('[data-pc-again]'),'back to the rematch screen');
  assert.equal(w.eval('PCUP.my.key'),'i:hbs');
  $('[data-pc-again]').click();await tick(5);assert.ok(w.eval('PCUP.net.wantAgain'),'the host asked');
  assert.ok(!$('.pg-dirs'),'one side alone does not start it');
  G2.$('[data-pc-again]').click();
  await until(()=>$('.pg-dirs')&&G2.$('.pg-dirs'),'the second duel on both phones');
  assert.equal(w.eval('PCUP.net.code'),'QQ77ZZ','the same room, no new code');
  const meta=q=>{const el=q('.pg-meta');return el?el.textContent:''};
  assert.match(meta($),/הפועל ב/,'the host plays his new club');assert.match(meta(G2.$),/הפועל ב/,'and the guest sees it too');
  w.eval("pcupNetStop();PCUP.stage='mode';pcupPaint()");g.eval("pcupNetStop();PCUP.stage='mode';pcupPaint()");await tick(5);
  ch3.close();

  // ---- a forged reveal (not the committed direction) stops the match on the phone that sees it
  const bus2=makeBus();w.__pcupNet=bus2.factory();$('[data-pc-mode="net"]').click();w.eval("pcupNewCode=()=>'FAKE22'");$('[data-pc-net="host"]').click();await until(()=>$('.pc-code'),'second room');
  const got=[];const cheat=await bus2.factory()('FAKE22',m=>got.push(m));cheat.send({v:1,f:'cheater001',t:'hi',team:'i:mta'});await until(()=>got.some(m=>m.t==='start')&&$('.pg-dirs'),'the duel against the cheat');
  cheat.send({v:1,f:'cheater001',t:'c',k:0,h:w.eval("pcupHash('UL:n1')")});$('.pg-dirs [data-dir="UL"]').click();await until(()=>got.some(m=>m.t==='r'&&m.k===0),'the honest reveal');
  cheat.send({v:1,f:'cheater001',t:'r',k:0,d:'DR',n:'n1'});await until(()=>$('#pgDone'),'the match is stopped');assert.match($('.pg-end h2').textContent,/לא תואמים/);
  const pl=run('pcupRec()').played;$('#pgDone').click();assert.equal(run('pcupRec()').played,pl,'a stopped match is nobody\'s win');cheat.close();
  // the other side leaving ends it too
  const bus3=makeBus();w.__pcupNet=bus3.factory();$('[data-pc-mode="net"]').click();w.eval("pcupNewCode=()=>'BYE333'");$('[data-pc-net="host"]').click();await until(()=>$('.pc-code'),'third room');
  const got3=[];const leaver=await bus3.factory()('BYE333',m=>got3.push(m));leaver.send({v:1,f:'leaver0001',t:'hi',team:'i:mta'});await until(()=>$('.pg-dirs'),'the duel against the leaver');leaver.send({v:1,f:'leaver0001',t:'bye'});
  await until(()=>$('#pgDone'),'the match ends when the other side leaves');assert.match($('.pg-end h2').textContent,/עזב/);$('#pgDone').click();
  // no network configured: a clear message, not a dead screen
  w.__pcupNet=()=>Promise.reject(new Error('offline'));$('[data-pc-mode="net"]').click();$('[data-pc-net="host"]').click();await until(()=>$('.pc-err'),'the error line');assert.match($('.pc-err').textContent,/לא זמין כרגע/);assert.ok($('[data-pc-go="mode"]'),'and a way back to the other modes');
  $('#pcup [data-pc-x]').click();assert.deepEqual(run("({me:G.me,wk:G.wk,uid})"),{me:before.me,wk:before.wk,uid:before.uid});

  // ---- beginner page: its own career is not touched by the lobby; highlights speed and shouts in its live match
  G2.$('#pcup [data-pc-x]').click();assert.equal(G2.$('#pcup'),null);assert.ok(G2.$('.pc-entry [data-pcup-open]'),'entry on the beginner start screen');
  g.eval("Bcreate('mta')");const bk=g.eval("localStorage.getItem(BK)");assert.ok(bk,'a beginner career is stored');assert.ok(G2.$('.pc-entry [data-pcup-open]'),'entry on the beginner home');
  G2.$('[data-pcup-open]').click();await until(()=>G2.$('#pcup'),'beginner lobby');assert.equal(g.eval('!!G.beginner'),false);g.document.dispatchEvent(new g.Event('visibilitychange'));g.dispatchEvent(new g.Event('pagehide'));
  G2.$$('[data-pc-team]')[0].click();G2.$('#pcup [data-pc-x]').click();assert.equal(g.eval("localStorage.getItem(BK)"),bk,'the beginner career on disk is the same bytes');assert.equal(g.eval('!!G.beginner'),true);assert.ok(G2.$('.bnav'),'the beginner screen is back');
  g.eval("Bplay()");assert.ok(G2.$('[data-bspeed="hl"]'),'the highlights speed');assert.equal(G2.$$('#shoutBar [data-shout]').length,4,'the shout bar');assert.ok(G2.$$('[data-shout]').every(b=>b.disabled),'no voice at kick-off');
  g.eval("Bstate().live.paused=false;Bstate().live.M.voice=100;Btick()");assert.ok(G2.$$('[data-shout]').every(b=>!b.disabled),'the voice is ready');
  const stored=g.eval("Object.keys(localStorage).filter(k=>/^ilm2/.test(k)).sort().map(k=>k+':'+localStorage.getItem(k).length).join()");G2.$('[data-shout="press"]').click();assert.equal(g.eval("Bstate().live.M.shout[G.me].k"),'press');assert.equal(g.eval("Bstate().live.M.voice"),0);
  assert.equal(g.eval("Object.keys(localStorage).filter(k=>/^ilm2/.test(k)).sort().map(k=>k+':'+localStorage.getItem(k).length).join()"),stored,'a shout in the beginner match never writes the full game\'s career');
  G2.$('[data-bspeed="hl"]').click();assert.equal(g.eval("Bstate().live.speed"),'hl');assert.ok(G2.$('[data-bspeed="hl"]').classList.contains('active')||G2.$('[data-bspeed="hl"]').getAttribute('aria-pressed')==='true','highlights is the chosen speed');
  assert.ok(g.eval("hlHoldMs([{t:'goal'}])")>g.eval("hlHoldMs([])"),'a minute with a goal holds the clock');
  g.eval("BstopBroadcast&&BstopBroadcast()");

  assert.deepEqual(errors,[]);console.log('penalty cup: rules, sandbox, computer, one phone, two phones (loss, a rematch in the same room with a new club, third phone, forged reveal, leaver), beginner entry + highlights + shouts; errors',errors);
 }catch(e){console.error(e);console.log('errors',[String(e&&e.message||e)].concat(errors));process.exitCode=1}
 finally{for(const x of wins){try{x.close()}catch(e){}}}
})();
