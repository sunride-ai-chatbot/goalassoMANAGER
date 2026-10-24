// Optional real WebGL smoke/performance check. Requires Playwright externally.
// CHROMIUM=/path/to/chrome node scripts/check-match3d.js http://127.0.0.1:8765 /tmp/match3d-check
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.argv[2]||'http://127.0.0.1:8765',out=process.argv[3]||'/tmp/match3d-check';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const report={environment:'Headless Chromium / software WebGL; not physical iPhone performance',checks:[],errors:[],limitations:['Physical iPhone FPS and Safari behaviour unverified.','Same-tab reload after sustained software WebGL timed out in this environment; save restoration is checked in a fresh browser context.']};
 const check=text=>{report.checks.push(text);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log('PASS '+text);};
 const watchdog=setTimeout(()=>{report.failure='Browser smoke exceeded 180 seconds';fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.error(report.failure);void browser.close();setTimeout(()=>process.exit(1),1000);},180000);
 try{
 let context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,locale:'he-IL'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 let p=await context.newPage();p.setDefaultTimeout(30000);p.on('pageerror',e=>report.errors.push(e.message));
 await p.addInitScript(()=>{window.__ilmNoSplash=1;window.__ilmUnlock=1;});
 await p.goto(base+'/beginner.html');
 await p.evaluate(()=>{Bcreate(Bdefs().find(d=>d.name==='ברצלונה').key);Bplay();clearInterval(BmatchTimer);Bstate().live.paused=true;BpaintBroadcast();});
 assert.equal(await p.locator('.m3-stage canvas').count(),0);
 await p.locator('[data-m3-toggle]').click();await p.waitForFunction(()=>Match3D.active?.enabled);
 assert.equal(await p.locator('.m3-stage canvas').count(),1);assert.equal(await p.locator('#arena').isVisible(),false);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 check('lazy opt-in, 390px portrait, no horizontal overflow');
 await p.locator('#match3d').screenshot({path:out+'/portrait.png'});
 await context.close();
 context=await browser.newContext({viewport:{width:844,height:390},screen:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'he-IL'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 p=await context.newPage();p.setDefaultTimeout(30000);p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript(()=>{window.__ilmNoSplash=1;window.__ilmUnlock=1;});
 await p.goto(base+'/beginner.html');await p.evaluate(()=>{Bcreate(Bdefs().find(d=>d.name==='ברצלונה').key);Bplay();clearInterval(BmatchTimer);Bstate().live.paused=true;BpaintBroadcast();});
 await p.locator('[data-m3-toggle]').click();await p.waitForFunction(()=>Match3D.active?.enabled);
 // Exercise native context loss before the stress run: this software driver can hang
 // inside WEBGL_lose_context itself after many frames (outside the JS fallback).
 await p.evaluate(()=>document.querySelector('.m3-stage canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await p.waitForFunction(()=>!Match3D.active?.enabled);assert.equal(await p.locator('#arena').isVisible(),true);assert.equal(await p.evaluate(()=>Match3D.active.busy),false);
 check('WebGL context loss restores existing renderer and releases hold');
 await p.locator('[data-m3-toggle]').click();await p.waitForFunction(()=>Match3D.active?.enabled);
 await p.evaluate(()=>{
   const M=Bstate().live.M,h=club(M.h),a=club(M.a),shooter=xiPlayers(M,h).find(x=>x.p.pos==='FW').p;
   B3d.beforeStep();M.m=12;M.gh++;M.ev.push(goalEvent(M,h,shooter,'goal'));B3d.update();BpaintBroadcast();Bwrite();
   window.beforeRender=JSON.stringify(M);Bstate().live.paused=false;BpaintBroadcast();
 });
 await p.waitForFunction(()=>Match3D.active?.diagnostics?.time>.5);
 await p.locator('#bpause').click();const stopped=await p.evaluate(()=>Match3D.active.diagnostics.time);await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>Match3D.active.diagnostics.time),stopped);
 await p.locator('[data-action="camera"]').click();
 assert.equal(await p.evaluate(()=>JSON.stringify(Bstate().live.M)),await p.evaluate(()=>window.beforeRender));
 await p.locator('#bpause').click();await p.waitForFunction(()=>!Match3D.active?.busy,null,{timeout:25000});
 const score=await p.locator('#bscore').textContent();
 await p.locator('[data-action="replay"]').click();await p.waitForFunction(()=>Match3D.active?.diagnostics?.time>1);
 report.performance=await p.evaluate(()=>Match3D.active.diagnostics);console.log('Performance '+JSON.stringify(report.performance));
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));report.landscape=await p.evaluate(()=>({width:innerWidth,height:innerHeight,canvas:document.querySelector('.m3-stage canvas').getBoundingClientRect().toJSON()}));
 await p.locator('[data-action="skip"]').click();assert.equal(await p.locator('#bscore').textContent(),score);
 assert.equal(await p.evaluate(()=>JSON.stringify(Bstate().live.M)),await p.evaluate(()=>window.beforeRender));
 check('real goal event DTO, pause, camera, replay and skip do not mutate authoritative match');
 // Preserve all chances from a minute, including quiet misses, and drain in event order.
 await p.evaluate(()=>{const M=Bstate().live.M,h=club(M.h),a=club(M.a),shooter=xiPlayers(M,a).find(x=>x.p.pos==='FW').p;B3d.beforeStep();M.m=70;M.ev.push(shotEvent(M,a,h,'save',shooter),shotEvent(M,a,h,'off',shooter));B3d.update();});
 assert.equal(await p.evaluate(()=>Match3D.active.diagnostics.queued),1);
 await p.waitForFunction(()=>Match3D.active?.diagnostics?.queued===0&&Match3D.active?.busy,null,{timeout:25000});
 assert.ok((await p.locator('.m3-caption').textContent()).includes('מחוץ למסגרת'));
 await p.locator('[data-action="skip"]').click();check('save/miss queue, away attack and second-half orientation');
 // A real red card leaves 21 actors; no phantom replacement.
 await p.evaluate(()=>{const M=Bstate().live.M;M.xi[M.h].splice(1,1);B3d.update();});
 assert.equal(await p.evaluate(()=>Match3D.active.diagnostics.players),21);
 // Actual UI substitution writes through the engine, then updates the same view with the new XI.
 await p.locator('[data-blive="subs"]').click();await p.locator('[data-bsub-out]').first().click();await p.locator('[data-bsub-in]').first().click();await p.locator('[data-blive="sub-confirm"]').click();
 await p.evaluate(()=>clearInterval(BmatchTimer));
 assert.equal(await p.evaluate(()=>Bstate().live.M.subs[G.me]),1);
 assert.equal(await p.evaluate(()=>Match3D.active.enabled),true);assert.equal(await p.evaluate(()=>Match3D.active.diagnostics.players),21);
 check('red card and actual substitution UI update roster');
 await p.evaluate(()=>{Bstate().live.paused=true;Bwrite();});const beforeReload=await p.evaluate(()=>JSON.stringify(Bstate().live.M));
 const storageState=await context.storageState();await context.close();
 context=await browser.newContext({storageState,viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 p=await context.newPage();p.setDefaultTimeout(30000);p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript(()=>{window.__ilmNoSplash=1;window.__ilmUnlock=1;});
 await p.goto(base+'/beginner.html');await p.evaluate(()=>clearInterval(BmatchTimer));assert.equal(await p.evaluate(()=>JSON.stringify(Bstate().live.M)),beforeReload);
 await p.locator('[data-m3-toggle]').click();await p.waitForFunction(()=>Match3D.active?.enabled);assert.equal(await p.evaluate(()=>Match3D.active.busy),false);
 check('reopening saved career retains match, no historical replay');
 // Pro surface uses the same adapter, including when regular animation is disabled.
 await p.goto(base+'/ligat-haal-manager.html');await p.evaluate(()=>window.ILM.ready);
 for(const s of ['[data-pick="mnt"]','#signBtn','[data-sponsor="0"]','[data-board="none"]'])await p.locator(s).click();
 await p.evaluate(()=>{G.motion='off';G.sound=false;G.pressMode='off';G.paperPop=[];G.live=createMatch(me(),G.clubs.find(c=>c.id!==G.me),{kind:'friendly',label:'בדיקת שילוב'});G.live.live=true;startLive(G.live);clearInterval(liveTimer);});
 await p.locator('[data-m3-toggle]').click();await p.waitForFunction(()=>Match3D.active?.enabled);
 assert.equal(await p.locator('#subBtn').isVisible(),true);
 await p.locator('[data-action="fullscreen"]').click();assert.equal(await p.locator('#ctrlBtn').isVisible(),true);assert.equal(await p.locator('#subBtn').isVisible(),true);
 await p.evaluate(()=>document.fullscreenElement&&document.exitFullscreen());
 await p.locator('[data-m3-toggle]').click();assert.equal(await p.locator('.m3-stage canvas').count(),0);
 check('Pro opt-in with motion off, fullscreen management controls, teardown');
 assert.deepEqual(report.errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }catch(error){report.failure=String(error);throw error;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();clearTimeout(watchdog);}
})().catch(e=>{console.error(e);process.exitCode=1;});
