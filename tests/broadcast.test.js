// Broadcast package on the live screen: plates per event, score-bug state, half-time and full-time slates.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
 const w=new JSDOM(fs.readFileSync('ligat-haal-manager.html','utf8'),{url:'https://game.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:false});w.scrollTo=()=>{}}}).window;
 const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];
 try{
  await w.ILM.ready;for(const s of ['[data-pick="mnt"]','#signBtn','[data-sponsor="0"]','[data-board="none"]'])$(s).click();
  for(const motion of ['low','off']){
   w.eval(`G.motion='${motion}';G.sound=false;G.pressMode='off';G.replay=false;G.paperPop=[];window.realInterval=window.realInterval||setInterval;window.setInterval=fn=>{window.matchTick=fn;return 991};
     G.live=createMatch(me(),G.clubs.find(c=>c.id!==G.me),{kind:'friendly',label:'Broadcast test'});G.live.live=true;startLive(G.live);`);
   const layer=$('#bcLayer');assert.ok(layer,'layer mounted ('+motion+')');assert.equal(layer.classList.contains('flat'),motion==='off');
   assert.equal(layer.parentElement.id==='arena',motion!=='off','the layer sits on the pitch when there is one');
   assert.ok($('#top').classList.contains('hide'),'the app header leaves the broadcast');
   $('#ctrlBtn').click();   // a restored match starts paused
   // a goal with an assist by the home side
   w.eval(`window.oldStep=stepMinute;stepMinute=M=>{M.m++;if(M.m===10){const c=club(M.h),xs=xiPlayers(M,c);const p=xs.find(x=>x.p.pos==='FW').p;M.gh++;const ev=goalEvent(M,c,p,'goal');const as=xs.find(x=>x.p.id!==p.id).p;ev.asst=as.id;ev.asstName=fullName(as);M.ev.push(ev);window.scorer=fullName(p);window.assist=fullName(as)}
       if(M.m===12){const c=club(M.a),x=xiPlayers(M,c).find(x=>x.p.pos==='DF');M.xi[c.id]=M.xi[c.id].filter(e=>e!==x.e);M.ev.push({m:M.m,t:'red',team:c.id,pid:x.p.id,name:fullName(x.p)});window.sentOff=fullName(x.p)}
       if(M.m===13){const c=club(M.h),x=xiPlayers(M,c).find(x=>x.p.pos==='MF');M.ev.push({m:M.m,t:'yellow',team:c.id,pid:x.p.id,name:fullName(x.p)})}
       if(M.m>=90)M.done=true};G.live.m=9;matchTick();`);
   let plate=$('.bc-l3');
   if(motion==='off'){assert.equal(plate,null,'no plates without match graphics (the ticker carries the events)');assert.equal($('.live-view .bug').dataset.sc,'1:0');w.eval('matchTick();matchTick();matchTick()');assert.equal($$('.bug .bt.a .rc em').length,1)}
   else{
   assert.ok(plate&&plate.classList.contains('goal'),'goal plate');assert.equal(plate.querySelector('.bc-name').textContent,w.scorer);
   assert.ok(plate.querySelector('.bc-sub').textContent.includes(w.assist),'the assist is credited');assert.ok(plate.querySelector('.bc-face .player-portrait'),'the scorer\'s portrait');
   assert.equal(plate.querySelector('.bc-min').textContent,"10'");assert.equal($$('.bc-l3').length,1);
   const bug=$('.live-view .bug');assert.equal(bug.dataset.sc,'1:0');assert.ok(bug.classList.contains('pulse-h'),'home side pulses');assert.equal($('#gh').textContent,'1');
   w.eval('matchTick();matchTick();matchTick()');   // 11, 12 (red), 13 (yellow)
   assert.equal($$('.bug .bt.a .rc em').length,1,'sent-off marker beside the away club');assert.equal($$('.bug .bt.h .rc em').length,0);
   assert.equal($$('.bc-l3').length,1,'plates never overlap');
   assert.equal(w.eval('BC.q.map(p=>p.cls).join()'),'red,yel','later events wait their turn behind the goal');
   w.eval('bcNext()');plate=$('.bc-l3');assert.ok(plate.classList.contains('red'));assert.equal(plate.querySelector('.bc-name').textContent,w.sentOff);assert.match(plate.querySelector('.bc-sub').textContent,/10/);
   }
   // half-time slate
   w.eval('G.live.m=44;matchTick()');
   let slate=$('.bc-slate');assert.ok(slate&&slate.classList.contains('half'),'half-time slate');assert.equal($$('.bc-l3').length,0,'the slate replaces the plate');
   assert.equal(slate.querySelector('.bc-s-title').textContent,'מחצית');assert.deepEqual([...slate.querySelectorAll('.bc-s-score bdi')].map(b=>b.textContent),['1','0']);
   assert.ok(slate.querySelector('.bc-s-scorers .h').textContent.includes("10'"),'scorer with the minute');assert.equal(slate.querySelectorAll('.bc-row').length,4);
   const mom=$('#bcMom');assert.equal(mom.querySelectorAll('rect').length,45,'one momentum bar per minute played');assert.equal(mom.querySelectorAll('i.h').length,1,'the goal is marked on the home side of the strip');
   assert.equal($('#ctrlBtn').textContent,'מחצית שנייה');$('#ctrlBtn').click();assert.equal($('.bc-slate'),null,'the slate leaves when play resumes');
   // full time
   w.eval('G.live.m=89;matchTick();matchTick()');
   slate=$('.bc-slate');assert.ok(slate&&slate.classList.contains('full'),'full-time slate');assert.equal(slate.querySelector('.bc-s-title').textContent,'סיום');
   assert.ok(slate.querySelector('.bc-motm strong').textContent.length>1,'man of the match');assert.equal($('#ctrlBtn').textContent,'סיכום המשחק');
   w.eval('stepMinute=window.oldStep;window.setInterval=window.realInterval;bcReset();G.live=null;G.view="home";render()');
   assert.ok(!$('#top').classList.contains('hide'),'the header returns with the next screen');assert.equal($('#bcLayer'),null);
  }
  // a substitution shows the player coming on and the player going off
  assert.equal(w.eval(`(()=>{const c=me(),ps=c.players;const M={h:G.me,a:'x',ev:[],xi:{},ctx:{kind:'league'},gh:0,ga:0};const h=bcPlateHTML(bcPlateFor(M,{t:'sub',team:G.me,m:60,inPid:ps[0].id,name:fullName(ps[0]),out:fullName(ps[1]),outPid:ps[1].id}));const d=document.createElement('div');d.innerHTML=h;return d.querySelectorAll('.bc-face').length+':'+d.querySelectorAll('.bc-face.off').length+':'+d.querySelector('.bc-name').textContent===('2:1:'+fullName(ps[0]))})()`),true);
  // events without a graphic, and a recorded (network) event whose player is unknown
  assert.equal(w.eval(`bcPlateFor({h:G.me,a:'x',ev:[],xi:{},ctx:{kind:'league'},gh:0,ga:0},{t:'corner',team:G.me,m:3})`),null);
  assert.equal(w.eval(`bcPlateFor({h:G.me,a:'x',ev:[],xi:{},ctx:{kind:'league'},gh:0,ga:0},{t:'shot',sub:'save',team:G.me,m:3,xg:.05,name:'x'})`),null,'routine saves get no plate');
  assert.ok(/bc-mono/.test(w.eval(`bcPlateHTML(bcPlateFor({h:G.me,a:'x',ev:[],xi:{},ctx:{kind:'league'},gh:0,ga:0},{t:'yellow',team:G.me,m:3,pid:-5,name:'שחקן לא ידוע'}))`)),'unknown player: club monogram, never a wrong face');
  assert.deepEqual(errors,[]);
  console.log('broadcast package: plates, score bug, half-time and full-time slates, with and without match graphics; errors []');
 }finally{w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
