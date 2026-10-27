const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM,VirtualConsole}=require('jsdom');
async function boot(mode,saved={},query=''){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
 const w=new JSDOM(fs.readFileSync(mode==='beginner'?'beginner.html':'ligat-haal-manager.html','utf8'),{url:'https://example.test/'+(mode==='beginner'?'beginner.html':'')+query,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmUnlock=1;w.scrollTo=()=>{};w.matchMedia=()=>({matches:true});w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.load=()=>{};for(const [k,v] of Object.entries(saved))w.localStorage.setItem(k,v);w.__roomClientFactory=async()=>({auth:{getSession:async()=>({data:{session:null}})}})}}).window;
 if(mode==='pro')await w.ILM.ready;return {w,errors};
}
(async()=>{for(const mode of ['beginner','pro']){
 let {w,errors}=await boot(mode);assert.equal(w.document.querySelectorAll('#spUI button').length,2);assert.equal(w.eval('splashOpen()'),true);w.document.querySelector('#spRegular').click();assert.equal(w.eval('splashOpen()'),false);
 w.eval(mode==='beginner'?"Bcreate('mta');me().pts=3;me().P=1;Bwrite()":"newGame('mta','בדיקה');G.phase='play';me().pts=3;me().P=1;save()");
 const saved=Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));assert.deepEqual(errors,[]);await new Promise(r=>setTimeout(r,50));w.eval('Rooms.close()');w.close();
 ({w,errors}=await boot(mode,saved));w.document.querySelector('#spRegular').click();assert.equal(w.eval('me().pts'),3);assert.equal(w.eval('me().P'),1);w.eval('showSplash()');w.document.querySelector('#spNetwork').click();assert.ok(w.document.querySelector('.room-dialog'));assert.equal(w.eval('splashOpen()'),false);assert.equal(w.eval('me().pts'),3);for(const [k,v] of Object.entries(saved))assert.equal(w.localStorage.getItem(k),v);assert.deepEqual(errors,[]);await new Promise(r=>setTimeout(r,50));w.eval('Rooms.close()');w.close();
 ({w}=await boot(mode,saved,'?network=1'));assert.equal(w.eval('splashOpen()'),false);assert.ok(w.document.querySelector('.room-dialog'));await new Promise(r=>setTimeout(r,50));w.eval('Rooms.close()');w.close();
}console.log('launch screen: both modes, regular resumes, network preserves careers, direct arrivals bypass splash; errors []')})().catch(e=>{console.error(e);process.exitCode=1});
