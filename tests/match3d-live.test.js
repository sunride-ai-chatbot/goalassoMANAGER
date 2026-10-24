// Test the real live-loop boundaries with a renderer double, including final-minute events.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
function boot(file){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message);});
 const html=fs.readFileSync(file,'utf8').replace("await import('./assets/demo3d/live.js')",'await window.rendererModule');
 const w=new JSDOM(html,{url:'https://game.test/'+file,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};}}).window;
 w.rendererModule={createLiveView(){const view={busy:false,clips:[],sync(s){this.snapshot=s;},enqueue(cs){this.clips.push(...cs);this.busy=this.busy||cs.length>0;},setPaused(v){this.paused=v;},dispose(){this.busy=false;this.disposed=true;}};w.testRenderer=view;return view;}};
 return {w,errors};
}
const enable=async w=>{await w.document.querySelector('[data-m3-toggle]').onclick();assert.ok(w.eval('Match3D.active.enabled'));};
(async()=>{
 const {w,errors}=boot('beginner.html');
 try{
  w.eval("Bcreate(Bdefs().find(d=>d.name==='ברצלונה').key);Bplay();clearInterval(BmatchTimer);");await enable(w);
  const mounted=w.testRenderer;
  w.eval(`BsubOut=xiPlayers(Bstate().live.M,me()).find(x=>x.p.pos==='DF').p.id;BsubIn=bench(Bstate().live.M,me())[0].id;window.incoming3D=BsubIn;BconfirmSub();`);
  assert.equal(w.testRenderer,mounted,'substitution must keep the active 3D view');assert.ok(!mounted.disposed);assert.ok(mounted.snapshot.players.some(p=>p.pid===w.incoming3D));
  w.document.querySelector('#bpause').click();
  // Deterministic event producer at the engine boundary; the real UI/settlement code runs.
  w.eval(`window.originalStep=stepMinute;stepMinute=M=>{M.m++;const h=club(M.h),p=xiPlayers(M,h).find(x=>x.p.pos==='FW').p;M.gh++;M.ev.push(goalEvent(M,h,p,'goal'));if(M.m>=90)M.done=true;};Bstate().live.M.m=44;Btick();`);
  assert.equal(w.eval('Bstate().live.M.m'),45);assert.equal(w.eval('Bstate().live.paused'),true);assert.ok(w.testRenderer.paused);assert.equal(w.testRenderer.clips.length,1);
  w.document.querySelector('#bpause').click();assert.equal(w.testRenderer.paused,false);
  w.eval('Btick();');assert.equal(w.eval('Bstate().live.M.m'),45,'clock waits for clip');
  w.testRenderer.busy=false;w.eval('Btick()');assert.equal(w.eval('Bstate().live.M.m'),46);
  w.testRenderer.busy=false;w.eval('Bstate().live.M.m=89;Btick()');assert.ok(w.eval('Bstate().live.M.done'));assert.equal(w.eval('Bstate().round'),0,'last goal must be presented before settlement');
  w.eval('Btick()');assert.equal(w.eval('Bstate().live.M.m'),90,'never step completed match to 91');
  w.testRenderer.busy=false;w.eval('stepMinute=window.originalStep;Btick()');assert.equal(w.eval('Bstate().live'),undefined);assert.equal(w.eval('Bstate().round'),1);assert.ok(w.testRenderer.disposed);w.eval('Btick()');assert.equal(w.eval('Bstate().round'),1,'settle once');
  assert.deepEqual(errors,[]);
 }finally{w.close();}
 const pro=boot('ligat-haal-manager.html'),p=pro.w;
 try{
  await p.ILM.ready;for(const s of ['[data-pick="mnt"]','#signBtn','[data-sponsor="0"]','[data-board="none"]'])p.document.querySelector(s).click();
  p.eval(`G.motion='off';G.sound=false;G.pressMode='off';G.paperPop=[];window.realInterval=setInterval;window.setInterval=fn=>{window.matchTick=fn;return 991;};G.live=createMatch(me(),G.clubs.find(c=>c.id!==G.me),{kind:'friendly',label:'3D test'});G.live.live=true;G.live.m=89;startLive(G.live);`);
  await enable(p);p.document.querySelector('#ctrlBtn').click();
  p.eval(`window.oldStep=stepMinute;stepMinute=M=>{M.m=90;M.done=true;M.gh++;const c=club(M.h);M.ev.push(goalEvent(M,c,xiPlayers(M,c).find(x=>x.p.pos==='FW').p,'goal'));};window.matchTick();`);
  assert.equal(p.eval('G.live.m'),90);assert.equal(p.eval('G.live.finishPrepared'),undefined);assert.ok(p.testRenderer.busy);assert.equal(p.document.querySelector('#gh').textContent,String(p.eval('G.live.gh')));
  p.eval('window.matchTick()');assert.equal(p.eval('G.live.m'),90);assert.equal(p.testRenderer.clips.length,1);
  p.testRenderer.busy=false;p.eval('window.matchTick()');assert.equal(p.eval('G.live.finishPrepared'),true);assert.equal(p.document.querySelector('#ctrlBtn').textContent,'סיכום המשחק');
  p.eval(`stepMinute=window.oldStep;
    window.resultsBefore=JSON.stringify(G.results);window.finishedView=testRenderer;
    const h=club(G.live.h),a=club(G.live.a),ev=goalEvent(G.live,h,xiPlayers(G.live,h).find(x=>x.p.pos==='FW').p,'goal');ev.m=90;
    window.recorded=mpPlayback({h:h.id,a:a.id,gh:1,ga:0,wk:G.week,ev:[ev],ctx:{kind:'friendly'},label:'Recorded match'});
    G.live=null;recorded.m=89;MP.watching=recorded;startLive(recorded);
    afterMyMatch=()=>{throw Error('Playback must never settle again');};
    decidePens=()=>{throw Error('Playback must never calculate a result');};
  `);
  assert.ok(p.finishedView.disposed);assert.equal(p.eval('Match3D.active'),null);
  assert.ok(p.document.querySelector('[data-m3-toggle]').disabled,'network recording lacks an authoritative XI');
  p.eval('window.matchTick()');assert.equal(p.eval('recorded.m'),90);assert.equal(p.eval('recorded.gh'),1);assert.equal(p.eval('recorded.ga'),0);
  assert.equal(p.document.querySelector('#ctrlBtn').textContent,'סיכום המשחק');
  p.eval('window.watchedNext=false;mpWatchNext=()=>{window.watchedNext=true;};');p.document.querySelector('#ctrlBtn').click();
  assert.ok(p.watchedNext);assert.equal(p.eval('JSON.stringify(G.results)'),p.resultsBefore);
  p.eval('window.setInterval=window.realInterval;');assert.deepEqual(pro.errors,[]);
 }finally{p.close();}
 console.log('match3d live loops: halftime, presentation hold, final goals, one settlement, Pro summary and unchanged network playback passed; errors []');
})().catch(e=>{console.error(e);process.exitCode=1;});
