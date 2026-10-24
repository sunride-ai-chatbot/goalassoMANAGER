const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync('src/js/16-match3d.js','utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const clubs=[0,1].map(side=>({id:side?'away':'home',players:Array.from({length:12},(_,i)=>({id:side*100+i,first:'Player',last:String(side*100+i),pos:i===0?'GK':i<5?'DF':i<8?'MF':'FW',no:i+1}))}));
const match=()=>({h:'home',a:'away',m:0,gh:0,ga:0,ev:[],xi:Object.fromEntries(clubs.map(c=>[c.id,c.players.slice(0,11).map(p=>({pid:p.id,slot:p.pos}))]))});
const event=(overrides={})=>({m:10,t:'goal',team:'home',pid:9,name:'Player 9',path:[[40,30],[65,22],[91,33],[105.5,35]],...overrides});
async function main(){
 const dom=new JSDOM('<div id="arena"></div>',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window;
 w.fullName=p=>p.first+' '+p.last;w.matchColors=()=>({h:{fill:'#ff0000',stroke:'#fff'},a:{fill:'#0000ff',stroke:'#fff'}});
 w.eval(source.replace("await import('./assets/demo3d/live.js')",'await window.loader()')+'\nwindow.api=Match3D;');const A=w.api;
 const timeline=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('assets/demo3d/event-timeline.js','utf8')).toString('base64'));
 const M=match(),initial=clone(M),snap=A.snapshot(M,...clubs);
 assert.equal(snap.players.length,22);assert.deepEqual(M,initial);assert.ok(Object.isFrozen(snap.players[0]));
 for(const outcome of ['goal','save','off','post'])for(const team of ['home','away'])for(const minute of [10,70]){
   const e=event({m:minute,team,pid:team==='home'?9:109,t:outcome==='goal'?'goal':'shot',sub:outcome,gk:team==='home'?100:0});
   e.path[e.path.length-1]=outcome==='off'?[106,43]:outcome==='save'?[104.3,35]:outcome==='post'?[105,37.6]:[105.5,35];
   const original=clone(e),c=A.adapt(e,0,snap,snap);assert.ok(c);assert.ok(Object.isFrozen(c.path[0]));assert.equal(c.shooter,e.pid);assert.deepEqual(e,original);
   const direction=(team==='home'?1:-1)*(minute>45?-1:1);assert.equal(c.direction,direction);assert.equal(c.path.at(-1).x,(e.path.at(-1)[0]-52.5)*direction);
   let prev=timeline.eventFrame(c,0).ball;
   for(let t=0;t<=timeline.CLIP_DURATION;t+=.01){const f=timeline.eventFrame(c,t);for(const p of f.players)for(const k of ['x','z','angle','speed'])assert.ok(Number.isFinite(p[k]));assert.ok(Math.hypot(f.ball.x-prev.x,f.ball.z-prev.z,f.ball.y-prev.y)<1,'continuous trajectory');prev=f.ball;}
   assert.deepEqual(timeline.eventFrame(c,3),timeline.eventFrame(c,3));
   const end=timeline.eventFrame(c,5.6);assert.ok(end.ended);assert.equal(end.players.some(p=>p.celebrate>0),outcome==='goal');
   if(outcome==='save')assert.ok(end.ball.x*direction<c.path.at(-1).x*direction);
 }
 for(const e of [event({t:'var',ok:false}),event({t:'own'}),event({t:'penmiss'}),event({path:null}),event({path:[[NaN,2],[105,34]]}),event({pid:999}),null])assert.equal(A.adapt(e,1,snap,snap),null);
 assert.equal(A.adapt(event({t:'pen'}),1,snap,snap).outcome,'goal');
 // A scorer dismissed/substituted later in the minute remains the right actor for that event.
 M.xi.home=M.xi.home.filter(p=>p.pid!==9);M.xi.home.push({pid:11,slot:'FW'});M.xi.away=M.xi.away.filter(p=>p.pid!==104);
 const after=A.snapshot(M,...clubs),clip=A.adapt(event(),2,snap,after);
 assert.ok(clip.players.some(p=>p.pid===9));assert.ok(!after.players.some(p=>p.pid===9));assert.ok(after.players.some(p=>p.pid===11));assert.equal(after.players.length,21);
 // Exercise cursor, lazy loading, restore, failures, pause and cancellation with a renderer double.
 let created=0,views=[];w.loader=async()=>({createLiveView(host,options){created++;const v={clips:[],busy:false,disposed:false,sync(s){this.snapshot=s;},enqueue(cs){this.clips.push(...cs);this.busy=this.busy||!!cs.length;},setPaused(p){this.paused=p;},dispose(){this.disposed=true;this.busy=false;},options};views.push(v);return v;}});
 const mount=(m)=>{w.document.body.innerHTML='<div id="arena"></div>'+A.html();return A.mount(m,...clubs);};
 const R=match();R.ev.push(event());const c=mount(R);assert.equal(created,0,'opt in only');await w.document.querySelector('[data-m3-toggle]').onclick();assert.equal(created,1);c.update();assert.equal(views[0].clips.length,0,'restored history must not replay');
 c.beforeStep();R.m=11;R.gh=1;R.ev.push(event({m:11}));const frozenState=JSON.stringify(R);c.update();c.update();assert.equal(views[0].clips.length,1,'one event once');assert.ok(c.busy);c.setPaused(true);assert.ok(views[0].paused);assert.equal(JSON.stringify(R),frozenState,'presentation cannot mutate match');
 views[0].options.onError();assert.equal(c.busy,false);assert.equal(c.enabled,false);assert.equal(w.document.getElementById('arena').hidden,false);assert.equal(JSON.stringify(R),frozenState);
 await w.document.querySelector('[data-m3-toggle]').onclick();assert.equal(created,2);assert.equal(views[1].clips.length,0);c.dispose();assert.ok(views[1].disposed);assert.equal(A.active,null);
 let resolve;w.loader=()=>new Promise(r=>resolve=r);const pending=mount(R);const loading=w.document.querySelector('[data-m3-toggle]').onclick();pending.dispose();resolve({createLiveView(){throw Error('late mount should not run');}});await loading;assert.equal(created,2);
 w.loader=async()=>{throw Error('network unavailable');};const failed=mount(R);await w.document.querySelector('[data-m3-toggle]').onclick();assert.equal(failed.enabled,false);assert.equal(failed.busy,false);failed.dispose();w.close();
 // Exact same seeded engine inputs produce exact same engine output with/without sampling.
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message);});
 const game=new JSDOM(fs.readFileSync('beginner.html','utf8'),{url:'https://test.invalid/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};}}).window;
 try{
   game.eval("Bcreate(Bdefs().find(d=>d.name==='ברצלונה').key);window.baseCareer=JSON.stringify(G);");
   const run=enabled=>game.eval(`(()=>{G=JSON.parse(window.baseCareer);let seed=921;const old=Math.random;Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};try{const h=me(),a=G.clubs.find(c=>c.id!==h.id);const M=createMatch(h,a,{kind:'friendly'});let cursor=0;while(!M.done){const before=${enabled}&&Match3D.snapshot(M,h,a);stepMinute(M);if(${enabled}){const after=Match3D.snapshot(M,h,a);while(cursor<M.ev.length){Match3D.adapt(M.ev[cursor],cursor,before,after);cursor++;}}}return JSON.stringify({M,G});}finally{Math.random=old;}})()`);
   assert.equal(run(false),run(true),'results, player stats, RNG state use and career state must agree');
   game.eval('Bwrite();G=null;Bload();');assert.equal(game.eval('me().name'),'ברצלונה');assert.deepEqual(errors,[]);
 }finally{game.close();}
 console.log('match3d: readonly adapter, goal/miss/save/post geometry, halftime direction, active XI, deduplication, restore, fallback, disposal and seeded engine parity passed; errors []');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
