// IndexedDB migration regressions: identity checks on emergency/legacy snapshots, backup migration failures,
// and visibility of a failed main migration.
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
 const f0=new fidb.IDBFactory();const w0=boot(f0);await w0.ILM.ready;await newCareer(w0,'hpt');
 const legacy=JSON.parse(JSON.stringify(w0.ILM.G));delete legacy.careerId;delete legacy.rev;legacy.v=7;legacy.savedAt=1700000000000;const backup=JSON.parse(JSON.stringify(legacy));backup.wk=0;w0.close();let rec;const origPut=fidb.IDBObjectStore.prototype.put;
 // 10. (regression) an emergency snapshot of a DIFFERENT career never replaces the slot, whatever its rev
 const f10=new fidb.IDBFactory();const w10=boot(f10);await w10.ILM.ready;await newCareer(w10,'hpt');const own=w10.ILM.G.careerId;
 const other=JSON.parse(JSON.stringify(w10.ILM.G));other.careerId='other-career';other.rev=9999;other.clubs.find(x=>x.id==='hpt').money=-1;
 const w10b=boot(f10,{ilm2_em_1:JSON.stringify(other)});await w10b.ILM.ready;
 assert.equal(w10b.ILM.G.careerId,own,'own career kept');assert.notEqual(w10b.ILM.me().money,-1);
 assert.equal(JSON.parse(w10b.localStorage.getItem('ilm2_em_1')).careerId,'other-career','foreign snapshot kept, not deleted');
 assert.ok(w10b.ILM.storage.migration.some(r=>r.src==='emergency'&&r.err==='identity_mismatch'));
 rec=await stored(f10,'slot:1');assert.equal(rec.careerId,own);
 // same for a legacy v7 save (no identity) when the slot already holds a career
 const w10c=boot(f10,{ilm2:JSON.stringify(legacy)});await w10c.ILM.ready;assert.equal(w10c.ILM.G.careerId,own);assert.ok(w10c.localStorage.getItem('ilm2'),'legacy copy kept');
 assert.ok(w10c.document.getElementById('modal')===null);
 // a snapshot of the SAME career with a higher rev does apply
 const same=JSON.parse(JSON.stringify(w10c.ILM.G));same.rev=(same.rev||0)+7;same.clubs.find(x=>x.id==='hpt').money=4242;
 const w10d=boot(f10,{ilm2_em_1:JSON.stringify(same)});await w10d.ILM.ready;assert.equal(w10d.ILM.me().money,4242);assert.equal(w10d.localStorage.getItem('ilm2_em_1'),null);
 console.log('identity-checked migration ok');w10.close();w10b.close();w10c.close();w10d.close();

 // 11. (regression) a failed backup migration keeps the legacy backup; the main copy still moves
 const f11=new fidb.IDBFactory();fidb.IDBObjectStore.prototype.put=function(rec){if(rec&&rec.key==='backup:1')throw Object.assign(new Error('disk full'),{name:'QuotaExceededError'});return origPut.call(this,rec)};
 const w11=boot(f11,{ilm2:JSON.stringify(legacy),ilm2_backup:JSON.stringify(backup)});await w11.ILM.ready;fidb.IDBObjectStore.prototype.put=origPut;
 assert.ok(w11.ILM.G,'main career migrated');assert.equal(w11.localStorage.getItem('ilm2'),null);assert.equal(w11.localStorage.getItem('ilm2_backup'),JSON.stringify(backup),'legacy backup kept after its write failed');
 assert.equal(await stored(f11,'backup:1'),undefined);assert.ok(w11.ILM.storage.migration.some(r=>r.src==='backup'&&!r.ok));
 const w11b=boot(f11,{ilm2_backup:w11.localStorage.getItem('ilm2_backup')});await w11b.ILM.ready;assert.equal(w11b.localStorage.getItem('ilm2_backup'),null,'backup migrated on the next boot');assert.ok(await stored(f11,'backup:1'));
 console.log('backup migration failure keeps the source ok');w11.close();w11b.close();

 // 12. (regression) a failed main migration is never silent: the legacy copy is still loaded, the first failed save shows the
 // banner with export, and a later successful write cleans the legacy copy up. A corrupt legacy copy is shown on the cards.
 const f12=new fidb.IDBFactory();fidb.IDBObjectStore.prototype.put=function(){throw Object.assign(new Error('disk full'),{name:'QuotaExceededError'})};
 const w12=boot(f12,{ilm2:JSON.stringify(legacy)});await w12.ILM.ready;
 assert.ok(w12.ILM.G&&w12.ILM.me().id==='hpt','legacy career loaded straight from localStorage');assert.ok(w12.ILM.storage.migration.some(r=>!r.ok&&r.kept));
 assert.equal(w12.localStorage.getItem('ilm2'),JSON.stringify(legacy),'source untouched');assert.ok(w12.eval('slotMeta(1)')&&w12.eval('slotMeta(1).legacy'),'slot card shows the legacy career');
 assert.equal(await w12.eval('save()'),false);const warn12=w12.document.getElementById('saveWarning');assert.ok(warn12&&/ייצא גיבוי/.test(warn12.textContent),'failure banner with export');
 fidb.IDBObjectStore.prototype.put=origPut;assert.equal(await w12.eval('save()'),true);assert.equal(w12.localStorage.getItem('ilm2'),null,'legacy copy removed only after a verified write');
 rec=await stored(f12,'slot:1');assert.equal(rec.careerId,w12.ILM.G.careerId);assert.equal(w12.document.getElementById('saveWarning'),null);w12.close();
 const f12b=new fidb.IDBFactory();const w12b=boot(f12b,{ilm2:'{broken'});await w12b.ILM.ready;
 assert.equal(w12b.ILM.G,null);assert.ok(w12b.document.getElementById('migrationNotice'),'notice card for the corrupt legacy copy');assert.ok(w12b.eval('slotMeta(1)&&slotMeta(1).legacy'),'slot not shown as free');
 assert.ok(w12b.document.querySelector('[data-legacyexport="1"]'));assert.equal(w12b.localStorage.getItem('ilm2'),'{broken','corrupt copy kept for export');w12b.close();
 console.log('failed migration is visible and recoverable ok');

 console.log('idb migration assertions passed; errors',JSON.stringify(errors));
}catch(e){console.log('errors',JSON.stringify(errors));console.error(e);process.exitCode=1}finally{for(const w of windows)try{w.close()}catch(e){}}})();
