// Regressions for the review of 3ef15a2:
//  13. a successful save never removes an emergency snapshot that belongs to another career
//  14. a legacy backup is not discarded because an IndexedDB backup of a different career has a later timestamp
//  15. a write that started before "delete slot" / "delete all" cannot recreate the slot; a new career still saves
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const fidb=require('fake-indexeddb');
const html=fs.readFileSync(path.join(__dirname,'..','ligat-haal-manager.html'),'utf8').replace(/<link[^>]*>/g,'');
const windows=[];const errors=[];
function boot(factory,store){
  const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
  const d=new JSDOM(html,{url:'https://idb.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
    w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true});
    w.indexedDB=factory;w.IDBKeyRange=fidb.IDBKeyRange;
    w.CompressionStream=CompressionStream;w.DecompressionStream=DecompressionStream;w.Response=Response;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;
    w.crypto={randomUUID:()=>require('node:crypto').randomUUID()};
    if(store)for(const [k,v] of Object.entries(store))w.localStorage.setItem(k,v);}});
  windows.push(d.window);return d.window;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const click=el=>{if(!el)throw new Error('missing element');el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent('click',{bubbles:true}))};
async function newCareer(w,club){click(w.document.querySelector(`[data-pick="${club||'hpt'}"]`));click(w.document.getElementById('signBtn'));click(w.document.querySelector('[data-sponsor="0"]'));click(w.document.querySelector('[data-board="none"]'));w.eval("G.pressMode='off';G.motion='off';G.renderer='svg';G.paperPop=[]");await w.ILM.whenSaved();assert.equal(await w.eval('save()'),true)}
async function stored(factory,key){const db=await new Promise((res,rej)=>{const r=factory.open('goalasso',1);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});try{return await new Promise((res,rej)=>{const r=db.transaction('careers').objectStore('careers').get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}finally{db.close()}}
async function unpack(rec){if(!rec.gz)return rec.data;const ds=new DecompressionStream('gzip');const wr=ds.writable.getWriter();wr.write(rec.data);wr.close();return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer())}
/* hold every compression call until release(): a write is then "in flight" for as long as the test wants */
function gate(w){let open=false;const waiters=[];const Orig=w.CompressionStream;
  w.CompressionStream=function(f){const cs=new Orig(f);if(open)return cs;const ws=cs.writable;const held=new WritableStream({async write(ch){if(!open)await new Promise(r=>waiters.push(r));const wr=ws.getWriter();await wr.write(ch);wr.releaseLock()},async close(){if(!open)await new Promise(r=>waiters.push(r));await ws.close()}});return {readable:cs.readable,writable:held}};
  return {release(){open=true;waiters.splice(0).forEach(r=>r())},restore(){open=true;waiters.splice(0).forEach(r=>r());w.CompressionStream=Orig}}}

(async()=>{try{
 // 13. foreign emergency snapshot survives a successful save of the current career
 const f13=new fidb.IDBFactory();const w13=boot(f13);await w13.ILM.ready;await newCareer(w13,'hpt');const own=w13.ILM.G.careerId;
 const foreign=JSON.parse(JSON.stringify(w13.ILM.G));foreign.careerId='other-career';foreign.rev=1;w13.close();
 const w13b=boot(f13,{ilm2_em_1:JSON.stringify(foreign)});await w13b.ILM.ready;assert.equal(w13b.ILM.G.careerId,own);
 w13b.eval('me().money=13');assert.equal(await w13b.eval('save()'),true,'own career saved');
 assert.equal(JSON.parse(w13b.localStorage.getItem('ilm2_em_1')).careerId,'other-career','foreign snapshot kept after a successful save');
 assert.ok(w13b.ILM.storage.migration.some(r=>r.slot===1&&r.src==='emergency'&&r.err==='identity_mismatch'),'conflict reported');
 // a snapshot of the same career that is not newer than the saved record is cleaned up after the verified write
 const mine=JSON.parse(JSON.stringify(w13b.ILM.G));w13b.localStorage.setItem('ilm2_em_1',JSON.stringify(mine));
 assert.equal(await w13b.eval('save()'),true);assert.equal(w13b.localStorage.getItem('ilm2_em_1'),null,'own older snapshot removed after the verified write');
 // a snapshot of the same career that is NEWER than what was just written stays
 const ahead=JSON.parse(JSON.stringify(w13b.ILM.G));ahead.rev=w13b.ILM.G.rev+50;w13b.localStorage.setItem('ilm2_em_1',JSON.stringify(ahead));
 assert.equal(await w13b.eval('save()'),true);assert.equal(JSON.parse(w13b.localStorage.getItem('ilm2_em_1')).rev,ahead.rev,'newer own snapshot kept');
 w13b.localStorage.removeItem('ilm2_em_1');
 // unreadable snapshot is kept too
 w13b.localStorage.setItem('ilm2_em_1','{broken');assert.equal(await w13b.eval('save()'),true);assert.equal(w13b.localStorage.getItem('ilm2_em_1'),'{broken');w13b.close();
 console.log('13 emergency snapshot ownership ok');

 // 14. legacy backup vs an IndexedDB backup of a different career with a later timestamp
 const f14=new fidb.IDBFactory();const w14=boot(f14);await w14.ILM.ready;await newCareer(w14,'hpt');w14.eval('me().money=1');assert.equal(await w14.eval('save()'),true);
 const bk14=await stored(f14,'backup:1');assert.ok(bk14,'an IndexedDB backup exists');const bkId=bk14.careerId;
 const legacyBk=JSON.parse(await unpack(bk14));legacyBk.careerId='legacy-career';legacyBk.rev=3;legacyBk.savedAt=1;legacyBk.wk=0;
 const legacyMain=JSON.parse(JSON.stringify(legacyBk));legacyMain.rev=4;   // main save of the same (other) career; slot is taken → kept
 w14.close();
 const w14b=boot(f14,{ilm2:JSON.stringify(legacyMain),ilm2_backup:JSON.stringify(legacyBk)});await w14b.ILM.ready;
 assert.equal(w14b.localStorage.getItem('ilm2_backup'),JSON.stringify(legacyBk),'legacy backup of another career kept despite the older timestamp');
 assert.equal((await stored(f14,'backup:1')).careerId,bkId,'IndexedDB backup untouched');
 assert.ok(w14b.ILM.storage.migration.some(r=>r.slot===1&&r.src==='backup'&&r.err==='identity_mismatch'),'backup conflict reported');w14b.close();
 // pre-v8 backup (no id) never replaces / is never dropped in favour of an existing backup
 const v7bk=JSON.parse(JSON.stringify(legacyBk));delete v7bk.careerId;delete v7bk.rev;v7bk.v=7;
 const w14c=boot(f14,{ilm2_backup:JSON.stringify(v7bk)});await w14c.ILM.ready;
 assert.equal(w14c.localStorage.getItem('ilm2_backup'),JSON.stringify(v7bk),'id-less legacy backup kept');assert.equal((await stored(f14,'backup:1')).careerId,bkId);w14c.close();
 // same career and the IndexedDB backup is newer and readable → legacy backup removed
 const sameOld=JSON.parse(await unpack(await stored(f14,'backup:1')));sameOld.rev=0;sameOld.savedAt=1;
 const w14d=boot(f14,{ilm2_backup:JSON.stringify(sameOld)});await w14d.ILM.ready;
 assert.equal(w14d.localStorage.getItem('ilm2_backup'),null,'same-career older legacy backup removed');assert.ok(w14d.ILM.storage.migration.some(r=>r.src==='backup'&&r.action==='superseded'));w14d.close();
 // same career and the legacy backup is newer → written, read back, then removed
 const cur=await stored(f14,'backup:1');const sameNew=JSON.parse(await unpack(cur));sameNew.rev=(cur.rev||0)+10;sameNew.savedAt=Date.now()+1000;sameNew.wk=7;
 const w14e=boot(f14,{ilm2_backup:JSON.stringify(sameNew)});await w14e.ILM.ready;
 assert.equal(w14e.localStorage.getItem('ilm2_backup'),null);const after=await stored(f14,'backup:1');assert.equal(after.rev,sameNew.rev);assert.equal(JSON.parse(await unpack(after)).wk,7);w14e.close();
 console.log('14 legacy backup identity ok');

 // 15a. delete a single slot while a write for it is held in flight
 const f15=new fidb.IDBFactory();const w15=boot(f15);await w15.ILM.ready;await newCareer(w15,'hpt');const oldId=w15.ILM.G.careerId;
 const g=gate(w15);w15.eval('me().money=15');const pending=w15.eval('save()');await sleep(30);assert.equal(w15.eval('SV.busy'),true,'write is in flight');
 const del=w15.eval('deleteSlot(1)');w15.eval('me().money=16');const late=w15.eval('save()');   // a save issued after the delete started
 await sleep(30);g.release();assert.equal(await pending,false,'in-flight write discarded');assert.equal(await late,false,'post-delete save refused');assert.equal(await del,true);
 await sleep(50);assert.equal(await stored(f15,'slot:1'),undefined,'slot not recreated');assert.equal(await stored(f15,'backup:1'),undefined);assert.equal(w15.eval('slotMeta(1)'),null);
 w15.eval('window.dispatchEvent(new Event("pagehide"))');assert.equal(w15.localStorage.getItem('ilm2_em_1'),null,'no emergency snapshot of the deleted career');
 g.restore();
 // a brand-new career in the same slot saves normally
 w15.eval('G=null;render()');await newCareer(w15,'mnt');assert.notEqual(w15.ILM.G.careerId,oldId);const r15=await stored(f15,'slot:1');assert.equal(r15.careerId,w15.ILM.G.careerId);
 console.log('15a single-slot delete with a delayed write ok');

 // 15b. "delete all" while writes are queued and in flight; reload shows no career; a new career then saves
 const g2=gate(w15);w15.eval('me().money=21');const p1=w15.eval('save()');await sleep(20);w15.eval('me().money=22');const p2=w15.eval('save()');
 const delAll=w15.eval('deleteAllData()');await sleep(30);g2.release();await delAll;assert.equal(await p1,false);assert.equal(await p2,false);
 await sleep(80);for(const k of ['slot:1','backup:1','slot:2','slot:3'])assert.equal(await stored(f15,k),undefined,k+' empty after delete all');
 assert.equal(w15.ILM.G,null);g2.restore();
 const w15b=boot(f15);await w15b.ILM.ready;assert.equal(w15b.ILM.G,null,'reload after delete all has no career');
 await newCareer(w15b,'hpt');assert.ok((await stored(f15,'slot:1')).careerId===w15b.ILM.G.careerId,'new career saves after delete all');
 // and in the original tab, a new career saves too
 await newCareer(w15,'mnt');w15.eval('G.slot=2');assert.equal(await w15.eval('save({force:true})'),true);assert.equal((await stored(f15,'slot:2')).careerId,w15.ILM.G.careerId);
 w15.close();w15b.close();
 console.log('15b delete all with queued writes ok');

 // 15c. an explicit import of a deleted career brings it back
 const f15c=new fidb.IDBFactory();const w15c=boot(f15c);await w15c.ILM.ready;await newCareer(w15c,'hpt');const exported=w15c.eval('JSON.stringify(G)');
 await w15c.eval('deleteSlot(1)');w15c.eval("G=null");
 w15c.__exp=exported;assert.equal(await w15c.eval('installCareer(window.__exp,1)'),true,'import of a deleted career is allowed');assert.ok(await stored(f15c,'slot:1'));w15c.close();
 console.log('15c explicit import after delete ok');
 console.log('idb delete assertions passed; errors',JSON.stringify(errors));
}catch(e){console.log('errors',JSON.stringify(errors));console.error(e);process.exitCode=1}finally{for(const w of windows)try{w.close()}catch(e){}}})();
