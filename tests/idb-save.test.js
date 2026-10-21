// IndexedDB persistence: migration from localStorage, round trips, compare-and-set between two tabs,
// coalesced consecutive writes, quota failure with recovery, live-match restore, emergency snapshot, backup and delete.
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
    w.indexedDB=factory;w.IDBKeyRange=fidb.IDBKeyRange;w.IDBRequest=fidb.IDBRequest;w.IDBTransaction=fidb.IDBTransaction;
    w.CompressionStream=CompressionStream;w.DecompressionStream=DecompressionStream;w.Response=Response;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;
    w.crypto={randomUUID:()=>require('node:crypto').randomUUID()};
    if(store)for(const [k,v] of Object.entries(store))w.localStorage.setItem(k,v);}});
  windows.push(d.window);return d.window;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const click=el=>{if(!el)throw new Error('missing element');el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent('click',{bubbles:true}))};
async function newCareer(w,club){click(w.document.querySelector(`[data-pick="${club||'hpt'}"]`));click(w.document.getElementById('signBtn'));click(w.document.querySelector('[data-sponsor="0"]'));click(w.document.querySelector('[data-board="none"]'));w.eval("G.pressMode='off';G.motion='off';G.renderer='svg';G.paperPop=[]");await w.ILM.whenSaved();await w.eval('save()');}
async function stored(factory,key){const db=await new Promise((res,rej)=>{const r=factory.open('goalasso',1);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});try{return await new Promise((res,rej)=>{const r=db.transaction('careers').objectStore('careers').get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}finally{db.close()}}
async function unpack(rec){if(!rec.gz)return rec.data;const ds=new DecompressionStream('gzip');const wr=ds.writable.getWriter();wr.write(rec.data);wr.close();return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer())}

(async()=>{try{
 // 1. fresh career saves compressed into slot:1 and comes back after a reboot
 const f1=new fidb.IDBFactory();
 const a=boot(f1);await a.ILM.ready;assert.equal(a.ILM.storage.kind,'idb');assert.equal(a.ILM.G,null);
 await newCareer(a);const G1=a.ILM.G;assert.ok(G1.careerId);assert.ok(G1.rev>=1);
 let rec=await stored(f1,'slot:1');assert.ok(rec&&rec.gz&&rec.data instanceof Uint8Array,'gzip record');assert.equal(rec.careerId,G1.careerId);assert.equal(rec.rev,G1.rev);assert.equal(rec.meta.club,a.ILM.me().name);
 const json1=await unpack(rec);assert.equal(JSON.parse(json1).careerId,G1.careerId);
 assert.ok(json1.length>rec.data.length*3,'compression ratio');
 assert.equal(a.eval("JSON.stringify(slotMeta(1)).includes(me().name)"),true);
 const b=boot(f1);await b.ILM.ready;assert.ok(b.ILM.G,'reloaded from IndexedDB');assert.equal(b.ILM.G.careerId,G1.careerId);assert.equal(b.ILM.G.rev,G1.rev);assert.equal(b.ILM.me().id,'hpt');assert.equal(b.ILM.G.v,b.eval('SAVE_VERSION'));
 console.log('round trip ok: bytes',json1.length,'→',rec.data.length);a.close();b.close();

 // 2. legacy localStorage careers (v7, three slots, with a backup) migrate and are deleted only after verification
 const f2=new fidb.IDBFactory();
 const legacy=JSON.parse(json1);delete legacy.careerId;delete legacy.rev;legacy.v=7;legacy.savedAt=1700000000000;
 const legacy2=JSON.parse(JSON.stringify(legacy));legacy2.me='mnt';legacy2.slot=2;const l2club=legacy2.clubs.find(c=>c.id==='mnt');assert.ok(l2club);
 const backup=JSON.parse(JSON.stringify(legacy));backup.wk=0;
 const ls={ilm2:JSON.stringify(legacy),ilm2_backup:JSON.stringify(backup),ilm2_meta_1:'{"club":"x"}',ilm2_s2:JSON.stringify(legacy2),ilm2_s3:'{broken',ilm2_cur:'1'};
 const c=boot(f2,ls);await c.ILM.ready;
 assert.ok(c.ILM.G,'legacy career loaded');assert.equal(c.ILM.G.v,c.eval('SAVE_VERSION'));assert.ok(c.ILM.G.careerId);assert.equal(c.ILM.G.migratedFrom,7);
 assert.equal(c.localStorage.getItem('ilm2'),null);assert.equal(c.localStorage.getItem('ilm2_backup'),null);assert.equal(c.localStorage.getItem('ilm2_meta_1'),null);
 assert.equal(c.localStorage.getItem('ilm2_s2'),null);assert.equal(c.localStorage.getItem('ilm2_s3'),'{broken','invalid legacy data is never deleted');
 assert.ok(await stored(f2,'slot:1'));assert.ok(await stored(f2,'slot:2'));assert.equal(await stored(f2,'slot:3'),undefined);
 const bk=await stored(f2,'backup:1');assert.ok(bk,'legacy backup migrated');assert.equal(JSON.parse(await unpack(bk)).wk,0);
 assert.equal(c.eval('slotMeta(2).club'),l2club.name);
 const rep=c.ILM.storage.migration;assert.equal(JSON.stringify(rep.filter(r=>!r.ok).map(r=>r.slot)),'[3]');
 console.log('legacy migration ok:',JSON.stringify(rep));c.close();

 // 3. migration must not delete the legacy copy when the IndexedDB write fails
 const f3=new fidb.IDBFactory();const origPut=fidb.IDBObjectStore.prototype.put;
 fidb.IDBObjectStore.prototype.put=function(){throw Object.assign(new Error('disk full'),{name:'QuotaExceededError'})};
 const c3=boot(f3,{ilm2:JSON.stringify(legacy)});await c3.ILM.ready;
 fidb.IDBObjectStore.prototype.put=origPut;
 assert.equal(c3.localStorage.getItem('ilm2'),JSON.stringify(legacy),'legacy copy kept after failed migration');assert.equal(await stored(f3,'slot:1'),undefined);
 console.log('failed migration keeps legacy copy ok');c3.close();

 // 4. two tabs: the stale one cannot overwrite the newer save, and can take it over explicitly
 const tabA=boot(f1);await tabA.ILM.ready;const tabB=boot(f1);await tabB.ILM.ready;assert.equal(tabA.ILM.G.rev,tabB.ILM.G.rev);
 tabB.eval('me().money=123456789');assert.equal(await tabB.eval('save()'),true);const revB=tabB.ILM.G.rev;
 tabA.eval('me().money=1');assert.equal(await tabA.eval('save()'),false,'stale tab rejected');
 rec=await stored(f1,'slot:1');assert.equal(rec.rev,revB);assert.equal(JSON.parse(await unpack(rec)).clubs.find(x=>x.id==='hpt').money,123456789);
 assert.ok(tabA.document.getElementById('modal')&&tabA.document.getElementById('conflictForce'),'conflict dialog shown');
 assert.equal(await tabA.eval('save()'),false,'blocked until the player decides');
 click(tabA.document.getElementById('conflictForce'));await tabA.ILM.whenSaved();
 rec=await stored(f1,'slot:1');assert.ok(rec.rev>revB);assert.equal(JSON.parse(await unpack(rec)).clubs.find(x=>x.id==='hpt').money,1);
 // the other tab now sees a conflict on its next save and can reload the newer version
 tabB.eval('me().money=5');assert.equal(await tabB.eval('save()'),false);assert.ok(tabB.document.getElementById('conflictLoad'));
 click(tabB.document.getElementById('conflictLoad'));await sleep(300);assert.equal(tabB.ILM.me().money,1);assert.equal(await tabB.eval('save()'),true);
 console.log('two-tab compare-and-set ok');tabA.close();tabB.close();

 // 5. consecutive writes coalesce and the last one wins
 const tabC=boot(f1);await tabC.ILM.ready;const before=tabC.ILM.G.rev;let last;for(let i=1;i<=25;i++){tabC.eval(`me().money=${1000*i}`);last=tabC.eval('save()')}assert.equal(await last,true);
 rec=await stored(f1,'slot:1');assert.equal(rec.rev,before+25);assert.equal(JSON.parse(await unpack(rec)).clubs.find(x=>x.id==='hpt').money,25000);
 const bk1=await stored(f1,'backup:1');assert.ok(bk1&&bk1.rev<rec.rev,'backup holds an earlier revision');
 console.log('coalesced writes ok: revs',before,'→',rec.rev);

 // 6. quota failure: no success report, banner with export, recovery after space is freed
 fidb.IDBObjectStore.prototype.put=function(){throw Object.assign(new Error('disk full'),{name:'QuotaExceededError'})};
 tabC.eval('me().money=777');assert.equal(await tabC.eval('save()'),false);
 const warn=tabC.document.getElementById('saveWarning');assert.ok(warn&&/מקום/.test(warn.textContent)&&/ייצא גיבוי/.test(warn.textContent));assert.equal(tabC.document.getElementById('saveInd').className,'saveind error');
 fidb.IDBObjectStore.prototype.put=origPut;
 assert.equal(await tabC.eval('save()'),true);assert.equal(tabC.document.getElementById('saveWarning'),null);assert.equal(tabC.document.getElementById('saveInd').className,'saveind saved');
 rec=await stored(f1,'slot:1');assert.equal(JSON.parse(await unpack(rec)).clubs.find(x=>x.id==='hpt').money,777);
 console.log('quota failure and recovery ok');

 // 7. live match survives a reload
 tabC.eval("G.view='home';render()");for(let i=0;i<8;i++){if(tabC.document.getElementById('toLineupBtn'))break;click(tabC.document.getElementById('playBtn'));await sleep(50);tabC.eval("G.paperPop=[];const m=document.getElementById('modal');m&&m.remove();document.getElementById('npModal')?.remove();G.view='home';render()")}
 click(tabC.document.getElementById('toLineupBtn'));click(tabC.document.getElementById('playBtn'));assert.ok(tabC.ILM.G.live,'live match running');tabC.eval('for(let i=0;i<30;i++)stepMinute(G.live)');const minute=tabC.ILM.G.live.m;assert.equal(await tabC.eval('save()'),true);
 const tabD=boot(f1);await tabD.ILM.ready;assert.ok(tabD.ILM.G.live,'live match restored');assert.equal(tabD.ILM.G.live.m,minute);
 tabD.eval('G.live=null;save()');await tabD.ILM.whenSaved();
 console.log('live match restore ok at minute',minute);tabC.close();tabD.close();

 // 8. an emergency snapshot parked in localStorage during unload is newer than the record and gets applied
 rec=await stored(f1,'slot:1');const em=JSON.parse(await unpack(rec));em.rev=rec.rev+5;em.clubs.find(x=>x.id==='hpt').money=42;
 const tabE=boot(f1,{ilm2_em_1:JSON.stringify(em)});await tabE.ILM.ready;assert.equal(tabE.ILM.me().money,42);assert.equal(tabE.localStorage.getItem('ilm2_em_1'),null);
 rec=await stored(f1,'slot:1');assert.equal(rec.rev,em.rev);
 console.log('emergency snapshot ok');

 // 9. delete removes the slot, its backup, and the meta
 await tabE.eval('deleteSlot(1)');assert.equal(await stored(f1,'slot:1'),undefined);assert.equal(await stored(f1,'backup:1'),undefined);assert.equal(tabE.eval('slotMeta(1)'),null);
 console.log('delete ok');tabE.close();
 console.log('idb persistence assertions passed; errors',JSON.stringify(errors));
}catch(e){console.log('errors',JSON.stringify(errors));console.error(e);process.exitCode=1}finally{for(const w of windows)try{w.close()}catch(e){}}})();
