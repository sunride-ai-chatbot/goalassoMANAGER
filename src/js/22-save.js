/* ====================== PERSISTENCE ====================== */
/* Careers live in IndexedDB (database "goalasso", store "careers"), gzip-compressed when the browser can, one record per
   slot plus one rolling backup per slot:
     slot:N   {key,slot,careerId,rev,v,t,meta,gz,data,writer}   the career (data = gzip bytes, or the JSON string)
     backup:N the previous slot:N record, replaced in the same transaction that writes the new one
   Every save carries a career id and a revision counter. A write only succeeds when the stored record is the one this
   tab last read or wrote (compare-and-set), so an older tab can never overwrite a newer save; a conflict asks the player.
   Browsers without IndexedDB (and the jsdom test suites) use the legacy localStorage layout unchanged: key ilm2 / ilm2_sN,
   ilm2_*_backup and ilm2_meta_N, written synchronously. Legacy localStorage careers are migrated into IndexedDB at boot
   and deleted only after the new record was read back and compared. */
const SAVE_VERSION=9;const SLOTS=3;
const DB_NAME='goalasso',DB_STORE='careers';
function curSlot(){try{return clamp(parseInt(localStorage.getItem('ilm2_cur'))||1,1,SLOTS)}catch(e){return 1}}
function setCurSlot(n){try{localStorage.setItem('ilm2_cur',String(n))}catch(e){}}
function slotKey(n){return n===1?'ilm2':'ilm2_s'+n}
function newCareerId(){try{if(crypto&&crypto.randomUUID)return crypto.randomUUID()}catch(e){}return 'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,10)}
function ensureCareerIdentity(g){if(!g)return g;if(!g.careerId)g.careerId=newCareerId();if(!Number.isInteger(g.rev)||g.rev<0)g.rev=0;return g}

/* ---- storage driver: IndexedDB when available, otherwise the legacy localStorage layout ---- */
const STORE={kind:(typeof indexedDB!=='undefined'&&indexedDB)?'idb':'ls',db:null,ready:null,err:null};
function idbOpen(){if(STORE.ready)return STORE.ready;STORE.ready=new Promise((res,rej)=>{let req;try{req=indexedDB.open(DB_NAME,1)}catch(e){return rej(e)}
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE,{keyPath:'key'})};
  req.onsuccess=()=>{STORE.db=req.result;STORE.db.onversionchange=()=>{try{STORE.db.close()}catch(e){}STORE.db=null;STORE.ready=null};res(STORE.db)};
  req.onerror=()=>rej(req.error||new Error('idb_open'));req.onblocked=()=>rej(new Error('idb_blocked'))});return STORE.ready}
function idbReq(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error||new Error('idb_request'))})}
async function idbGet(key){const db=await idbOpen();return idbReq(db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).get(key))}
async function idbGetAll(){const db=await idbOpen();return idbReq(db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).getAll())}
async function idbDel(keys){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(DB_STORE,'readwrite');const st=tx.objectStore(DB_STORE);for(const k of keys)st.delete(k);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error||new Error('idb_delete'));tx.onabort=()=>rej(tx.error||new Error('idb_delete'))})}
/* compare-and-set write: `accept(stored)` decides whether the record may replace what is on disk; the previous record moves
   to backup:N inside the same transaction, so a crash can never leave the slot without a readable career. */
async function idbPutCAS(rec,accept,keepBackup){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(DB_STORE,'readwrite');const st=tx.objectStore(DB_STORE);let conflict=null;
  let thrown=null;const g=st.get(rec.key);g.onsuccess=()=>{try{const stored=g.result||null;if(!accept(stored)){conflict=stored;try{tx.abort()}catch(e){}return}
    if(stored&&keepBackup!==false&&stored.data!=null)st.put({...stored,key:'backup:'+rec.slot});st.put(rec)}catch(e){thrown=e;try{tx.abort()}catch(e2){}}};
  tx.oncomplete=()=>res(true);tx.onerror=()=>rej(thrown||tx.error||new Error('idb_write'));tx.onabort=()=>{if(conflict!==null){const e=new Error('save_conflict');e.conflict=true;e.stored=conflict;rej(e)}else rej(thrown||tx.error||new Error('idb_abort'))}})}

/* ---- compression (gzip via CompressionStream; raw JSON when unavailable) ---- */
const canGzip=typeof CompressionStream!=='undefined'&&typeof DecompressionStream!=='undefined'&&typeof Response!=='undefined';
async function packState(json){if(!canGzip)return {gz:false,data:json};try{const cs=new CompressionStream('gzip');const w=cs.writable.getWriter();w.write(new TextEncoder().encode(json));w.close();return {gz:true,data:new Uint8Array(await new Response(cs.readable).arrayBuffer())}}catch(e){return {gz:false,data:json}}}
async function unpackState(rec){if(!rec)return null;if(!rec.gz)return typeof rec.data==='string'?rec.data:new TextDecoder().decode(rec.data);const ds=new DecompressionStream('gzip');const w=ds.writable.getWriter();w.write(rec.data);w.close();return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer())}

/* ---- slot metadata (the career cards on the title screen) ---- */
let SLOT_META={};
function slotMeta(n){if(STORE.kind==='idb'){if(SLOT_META[n])return SLOT_META[n];const L=legacyLeftover(n);if(L){const g=L.g;return g&&g.clubs?Object.assign(metaOf(g,g.savedAt||0),{legacy:true,club:(metaOf(g,0).club||'')+' (שמירה ישנה)'}):{club:'שמירה ישנה לא תקינה',season:'',wk:0,t:0,legacy:true}}return null}try{const m=localStorage.getItem('ilm2_meta_'+n);if(m)return JSON.parse(m);if(n===1&&localStorage.getItem('ilm2'))return {club:'קריירה שמורה',season:'',wk:0,t:0}}catch(e){}return null}
function metaOf(g,stamp){const c=g.clubs&&[...g.clubs,...(g.leumit||[])].find(x=>x.id===g.me);return {club:c?c.name:'',season:(()=>{const y=2026+g.season-1;return `${y}/${String(y+1).slice(2)}`})(),wk:g.wk,mgr:g.manager&&g.manager.name,t:stamp,phase:g.phase,careerId:g.careerId,rev:g.rev}}
async function refreshMeta(){SLOT_META={};try{for(const r of await idbGetAll()){if(/^slot:\d$/.test(r.key)&&r.meta)SLOT_META[r.slot]=r.meta}}catch(e){}}

/* ---- user-facing status: banner for failures (with export), small indicator for the save cycle ---- */
let persistenceError='';
function storageNotice(message){
  persistenceError=message||'';let box=$('saveWarning');
  if(!message){if(box)box.remove();return}
  if(!box){box=document.createElement('div');box.id='saveWarning';box.setAttribute('role','alert');box.style.cssText='position:fixed;top:0;left:0;right:0;z-index:100000;background:#702a23;color:white;padding:12px;text-align:center;font-size:15px;line-height:1.5';document.body.appendChild(box)}
  box.textContent=message;const mk=(t,fn)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText='margin:0 4px;padding:4px 10px;border-radius:8px;background:#fff;color:#702a23;font-weight:700';b.onclick=fn;box.append(' ',b)};
  mk('שמור שוב',()=>save());mk('ייצא גיבוי',()=>exportSave());mk('שחזר גיבוי',()=>openModal('<h3>לשחזר את הגיבוי הקודם?</h3><p>ההתקדמות הנוכחית תוחלף בגיבוי.</p><button class="btn" id="restoreWarningBackup">שחזר</button><button class="btn sec" data-close>ביטול</button>',e=>{if(e.target.closest('#restoreWarningBackup'))recoverBackup()}));
}
let saveIndT=null;
function saveIndicator(state){const el=$('saveInd');if(!el)return;clearTimeout(saveIndT);el.className='saveind '+state;
  el.textContent=state==='saving'?'שומר…':state==='saved'?'נשמר ✓':state==='error'?'לא נשמר':state==='stale'?'עודכן במקום אחר':'';
  if(state==='saved')saveIndT=setTimeout(()=>{if(el.className==='saveind saved'){el.textContent='';el.className='saveind'}},2500)}

/* ---- save ---- */
const SV={q:null,busy:false,promise:null,known:null,blocked:null,lastOk:0,writer:Math.random().toString(36).slice(2,10),retry:null,persistAsked:false,legacySource:null,
  epoch:{},deleted:new Set()};
/* Deletion fences. Every queued write records the slot's epoch; deleteSlot() bumps it, drops queued writes for the slot,
   waits for the in-flight write to settle, then deletes. A write whose epoch is stale is discarded inside its own
   transaction, so nothing that started before a deletion can recreate the slot afterwards. Careers that were deleted are
   remembered by id and never saved again (a new career has a new id and saves normally). */
function slotEpoch(n){return SV.epoch[n]||0}
function isDeletedCareer(id){return !!id&&SV.deleted.has(id)}
function reportStorageConflict(slot,src,err){STORE.migration=STORE.migration||[];if(!STORE.migration.some(r=>r.slot===slot&&r.src===src&&!r.ok))STORE.migration.push({slot,src,ok:false,err:err||'identity_mismatch',kept:true})}
/* remove the emergency snapshot of `slot` only when it belongs to `careerId`, is not newer than `rev`, and the IndexedDB
   record for exactly that career+rev has been read back. A snapshot of another career is kept and reported. */
async function clearEmergencyIfOurs(slot,careerId,rev){let text=null;try{text=localStorage.getItem('ilm2_em_'+slot)}catch(e){return}if(!text)return;
  let em=null;try{em=JSON.parse(text)}catch(e){reportStorageConflict(slot,'emergency','unreadable_snapshot');return}
  if(!em||em.careerId!==careerId){reportStorageConflict(slot,'emergency','identity_mismatch');return}
  if((em.rev||0)>rev)return;
  try{const back=await idbGet('slot:'+slot);if(!back||back.careerId!==careerId||back.rev!==rev)return;validateCareer(JSON.parse(await unpackState(back)))}catch(e){return}
  try{localStorage.removeItem('ilm2_em_'+slot)}catch(e){}}
let saveBC=null;try{if(typeof BroadcastChannel!=='undefined'){saveBC=new BroadcastChannel('goalasso-save');saveBC.onmessage=e=>{const m=e.data||{};if(m.deleted){SV.epoch[m.slot]=Math.max(slotEpoch(m.slot),m.epoch||0)+0;for(const id of (m.careerIds||[]))SV.deleted.add(id);if(SV.q&&SV.q.slot===m.slot)SV.q=null;delete SLOT_META[m.slot];return}if(!G||m.writer===SV.writer||m.slot!==(G.slot||curSlot()))return;if(m.careerId!==G.careerId||(m.rev||0)>(G.rev||0)){SV.blocked={stored:{careerId:m.careerId,rev:m.rev,meta:m.meta},remote:true};saveIndicator('stale');showConflict()}}}}catch(e){}
function broadcastSave(rec){try{if(saveBC)saveBC.postMessage({writer:SV.writer,slot:rec.slot,careerId:rec.careerId,rev:rec.rev,meta:rec.meta})}catch(e){}}
/* Returns true/false synchronously in localStorage mode, a Promise<boolean> in IndexedDB mode. Callers that need the
   outcome use Promise.resolve(save()).then(ok=>…). */
function save(opts){if(!G)return false;if(isDeletedCareer(G.careerId))return STORE.kind==='idb'?Promise.resolve(false):false;if(STORE.kind!=='idb')return saveSync();
  if(SV.blocked&&!(opts&&opts.force)){showConflict();return Promise.resolve(false)}
  try{validateCareer(G)}catch(e){storageNotice('המשחק במצב לא תקין ולא נשמר. ייצא גיבוי ופנה לתמיכה.');saveIndicator('error');return Promise.resolve(false)}
  ensureCareerIdentity(G);const slot=G.slot||curSlot();const stamp=Date.now();G.rev=(G.rev||0)+1;G.slot=slot;G.v=SAVE_VERSION;G.savedAt=stamp;
  const json=JSON.stringify(G);
  // coalescing keeps a pending force flag: a newer snapshot of the same career must not lose the overwrite it was queued with
  const keepForce=!!(SV.q&&SV.q.force&&SV.q.slot===slot&&SV.q.careerId===G.careerId);
  SV.q={json,slot,rev:G.rev,careerId:G.careerId,meta:metaOf(G,stamp),t:stamp,force:!!(opts&&opts.force)||keepForce,epoch:slotEpoch(slot)};
  saveIndicator('saving');return pumpSaves()}
function pumpSaves(){if(SV.busy)return SV.promise;SV.busy=true;SV.promise=(async()=>{let ok=false;while(SV.q){const job=SV.q;SV.q=null;ok=await writeJob(job)}return ok})().finally(()=>{SV.busy=false;SV.promise=null});return SV.promise}
function jobFenced(job){return job.epoch!==slotEpoch(job.slot)||isDeletedCareer(job.careerId)}
async function writeJob(job){if(jobFenced(job))return false;try{const packed=await packState(job.json);if(jobFenced(job))return false;const rec={key:'slot:'+job.slot,slot:job.slot,careerId:job.careerId,rev:job.rev,v:SAVE_VERSION,t:job.t,meta:job.meta,gz:packed.gz,data:packed.data,writer:SV.writer};
    await idbPutCAS(rec,stored=>{if(jobFenced(job))return false;if(!stored||job.force)return true;const k=SV.known;return !!k&&k.slot===job.slot&&stored.careerId===k.careerId&&stored.rev===k.rev});
    SV.known={slot:job.slot,careerId:job.careerId,rev:job.rev};SV.blocked=null;SV.retry=null;SV.lastOk=job.t;SLOT_META[job.slot]=job.meta;await clearEmergencyIfOurs(job.slot,job.careerId,job.rev);
    if(SV.legacySource&&SV.legacySource.slot===job.slot&&SV.legacySource.careerId===job.careerId){try{const back=await idbGet('slot:'+job.slot);if(back&&back.careerId===job.careerId&&back.rev===job.rev){const K=legacyKeysOf(job.slot);localStorage.removeItem(K.main);localStorage.removeItem(K.meta);SV.legacySource=null;if(STORE.migration)STORE.migration=STORE.migration.filter(r=>r.slot!==job.slot||r.src==='backup')}}catch(e){}}
    storageNotice('');saveIndicator('saved');broadcastSave(rec);askPersistence();return true}
  catch(e){if(jobFenced(job))return false;if(e&&e.conflict){SV.blocked={stored:e.stored};SV.retry=job;saveIndicator('stale');showConflict();return false}
    SV.retry=job;saveIndicator('error');const quota=e&&(e.name==='QuotaExceededError'||/quota/i.test(String(e.message||e)));
    storageNotice(quota?'אין מקום באחסון של הדפדפן. ההתקדמות נמצאת בזיכרון בלבד — ייצא גיבוי עכשיו, פנה מקום (מחק קריירה ישנה) ונסה לשמור שוב.':'השמירה נכשלה ('+(e&&e.name||'שגיאה')+'). ההתקדמות נמצאת בזיכרון בלבד — ייצא גיבוי ונסה לשמור שוב.');return false}}
function askPersistence(){if(SV.persistAsked)return;SV.persistAsked=true;try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{})}catch(e){}}
function showConflict(){if($('modal')||!SV.blocked)return;const st=SV.blocked.stored||{};const m=st.meta||{};
  openModal(`<h3 class="sec">הקריירה נשמרה ממקום אחר</h3><p class="small">${SV.blocked.remote?'לשונית או חלון אחר של המשחק שמרו גרסה חדשה יותר של הקריירה הזאת.':'באחסון יש גרסה חדשה יותר של הקריירה (כנראה מלשונית אחרת).'}<br>שם: ${esc(m.club||'')} · ${esc(m.season||'')} · שבוע ${(m.wk||0)+1} · גרסה ${st.rev||'?'}<br>כאן: ${esc(me()?me().name:'')} · ${seasonLabel()} · שבוע ${G.wk+1} · גרסה ${G.rev||0}</p><p class="muted tiny">כדי לא לאבד התקדמות, המשחק הזה לא ישמור עד שתבחר.</p><div class="actions"><button class="btn" id="conflictLoad">טען את הגרסה החדשה</button><button class="btn danger" id="conflictForce">דרוס אותה בגרסה שכאן</button></div>`,
   e=>{if(e.target.closest('#conflictLoad')){closeModal();const n=G.slot||curSlot();SV.blocked=null;G=null;Promise.resolve(load(n)).then(ok=>{if(!ok)toast('הטעינה נכשלה');render()})}
       else if(e.target.closest('#conflictForce')){closeModal();G.rev=Math.max(G.rev||0,(SV.blocked.stored&&SV.blocked.stored.rev)||0)+1;SV.blocked=null;save({force:true})}})}
/* legacy synchronous path (no IndexedDB) */
function saveSync(){try{
  const slot=G.slot||curSlot(),key=slotKey(slot),previous=localStorage.getItem(key),stamp=Date.now();ensureCareerIdentity(G);
  const json=JSON.stringify({...G,slot,v:SAVE_VERSION,savedAt:stamp,rev:(G.rev||0)+1});
  if(previous&&previous!==json){let recoverable=false;try{validateCareer(JSON.parse(previous));recoverable=true}catch(e){}if(recoverable)localStorage.setItem(key+'_backup',previous);}
  localStorage.setItem(key,json);G.slot=slot;G.v=SAVE_VERSION;G.savedAt=stamp;G.rev=(G.rev||0)+1;
  try{localStorage.setItem('ilm2_meta_'+slot,JSON.stringify(metaOf(G,stamp)))}catch(e){}
  storageNotice('');saveIndicator('saved');return true;
}catch(e){saveIndicator('error');storageNotice('השמירה נכשלה. ההתקדמות נמצאת בזיכרון בלבד — פנו מקום ונסו לשמור שוב, או ייצאו גיבוי.');return false}}
/* the tab is closing while a write is still in flight: park the newest snapshot in localStorage, restored at next boot */
function emergencyFlush(){if(STORE.kind!=='idb'||!G||isDeletedCareer(G.careerId))return;const job=SV.q||(SV.busy?SV.retry:null);if(!job&&!SV.busy)return;try{localStorage.setItem('ilm2_em_'+(G.slot||curSlot()),JSON.stringify(G))}catch(e){}}
try{window.addEventListener('pagehide',emergencyFlush);window.addEventListener('beforeunload',emergencyFlush)}catch(e){}

/* ---- validation, restore, migrations ---- */
function validateCareer(g){
  if(!g||typeof g!=='object'||Array.isArray(g)||!Array.isArray(g.clubs)||!g.clubs.length||!Array.isArray(g.leumit)||!g.pseudo||typeof g.pseudo!=='object'||!Array.isArray(g.cal)||!Number.isInteger(g.wk)||g.wk<0||!Number.isInteger(g.season)||g.season<1)throw new Error('invalid_career');
  if(!['contract','sponsor','board','play','seasonEnd','fired'].includes(g.phase)||!g.manager||!g.board||!Array.isArray(g.results)||!Array.isArray(g.news)||!Array.isArray(g.offers))throw new Error('incomplete_career');
  if(g.v!=null&&(!Number.isInteger(g.v)||g.v>SAVE_VERSION))throw new Error('unsupported_save_version');
  const clubs=[...g.clubs,...g.leumit,...Object.values(g.pseudo),...Object.values(g.world||{}).flatMap(l=>l.clubs||[])];
  if(!clubs.some(c=>c.id===g.me))throw new Error('missing_managed_club');
  for(const c of clubs){if(!c||!c.id||!Array.isArray(c.players)||!Array.isArray(c.youth||[])||!Number.isFinite(c.money))throw new Error('invalid_club');
    const ids=new Set();for(const p of [...c.players,...(c.youth||[])]){if(!p||!Number.isFinite(p.id)||ids.has(p.id)||!['GK','DF','MF','FW'].includes(p.pos))throw new Error('invalid_player');ids.add(p.id)}}
  if(g.live){const m=g.live;if(!clubs.some(c=>c.id===m.h)||!clubs.some(c=>c.id===m.a)||!Number.isFinite(m.m)||m.m<0||m.m>130||!m.ctx||!m.xi||!m.subs||!m.used||!Array.isArray(m.ev))throw new Error('invalid_live_match')}
  return g;
}
function restoreCareer(json,slot){const old=G,oldUid=uid;try{G=validateCareer(JSON.parse(json));G.slot=slot;hydrateCareer();ensureCareerIdentity(G);return G}catch(e){G=old;uid=oldUid;throw e}}
/* install a career the player chose explicitly (import, cloud, backup): always overwrites the slot */
function installCareer(json,slot){const old=G,oldUid=uid;const fail=()=>{G=old;uid=oldUid;toast('השמירה לא תקינה או אינה נתמכת. הקריירה הקיימת לא הוחלפה.');return false};
  try{restoreCareer(json,slot)}catch(e){return fail()}
  if(STORE.kind!=='idb'){if(!save()){G=old;uid=oldUid;return false}return true}
  // an explicit install (import, cloud, backup) brings a deleted career back on purpose
  if(G&&G.careerId)SV.deleted.delete(G.careerId);SV.blocked=null;return Promise.resolve(save({force:true})).then(ok=>{if(!ok){G=old;uid=oldUid;return false}return true})}

const MIGRATIONS=[[5,'נתוני משחק מפורטים',()=>{}],[6,'רפואה, יועץ מנטלי, פרסום',()=>migrateM2()],[7,'צוות, כימיה, מוניטין',()=>{ensureStaff();seedChem();ensureRep()}],[8,'מזהה קריירה ומונה גרסאות',()=>ensureCareerIdentity(G)],[9,'סגלים מלאים בשוק העולמי ופנים אירופיות',()=>migrateWorldSquads()]];
function runMigrations(){const from=G.v||4;for(const [v,,fn] of MIGRATIONS){if(from<v){fn()}}G.v=SAVE_VERSION;if(from<SAVE_VERSION)G.migratedFrom=from}
function hydrateCareer(){const all=[...G.clubs,...G.leumit,...Object.values(G.pseudo)];const wall=G.world?Object.values(G.world).flatMap(l=>l.clubs):[];uid=Math.max(uid,...all.concat(wall).flatMap(c=>[...c.players,...(c.youth||[])].map(p=>p.id)),...(G.scouts||[]).map(s=>s.id),...(G.scoutMarket||[]).map(s=>s.id),...(G.negs||[]).map(n=>n.id))+1;if(!G.paper)G.paper=[];if(!G.world)G.world={};if(!G.scouts)G.scouts=[];if(!G.scoutMarket)G.scoutMarket=[];if(!G.reports)G.reports=[];if(!G.negs)G.negs=[];if(!G.payables)G.payables=[];if(G.manager&&G.manager.trust==null)G.manager.trust=60;G.clubs.forEach(c=>{if(!c.div)c.div='top'});G.leumit.forEach(c=>{if(!c.div)c.div='leumit';if(c.tier==null)c.tier=4});if(G.leumit.length<16){const have=new Set(G.leumit.map(c=>c.name));for(const d of LEUMIT16){if(G.leumit.length>=16)break;if(!have.has(d.name)&&!G.clubs.some(c=>c.name===d.name))G.leumit.push(buildLeumitClub(d))}}if(!G.lfx||!G.lsched){buildLeumitSeason();G.leumit.forEach(c=>Object.assign(c,{P:0,W:0,D:0,L:0,GF:0,GA:0,pts:0}))}if(!G.toto)buildToto();if(!G.hist)G.hist=[];computeLeumitPrestige();for(const c of all){if(c.scouting==null)c.scouting=1;for(const p of [...c.players,...(c.youth||[])])assignPers(p);if(c.fans==null)c.fans=baseFans(c);if(!c.focus)c.focus='bal';if(!c.intensity)c.intensity='mid';for(const p of [...c.players,...(c.youth||[])]){if(p.morale==null)p.morale=65;if(p.fit==null)p.fit=100}}migrateM2();ensureStaff();seedChem();runMigrations();if(G.phase==='play'&&G.cal&&G.wk<G.cal.length)ensureDraws();}

/* ---- load ---- */
/* localStorage mode returns true/false synchronously; IndexedDB mode returns Promise<boolean>. */
function load(slot){const sl=slot||curSlot();if(STORE.kind!=='idb'){try{const json=localStorage.getItem(slotKey(sl));if(!json)return false;restoreCareer(json,sl);SV.known={slot:sl,careerId:G.careerId,rev:G.rev||0};return true}catch(e){storageNotice('לא ניתן לטעון את הקריירה. הקובץ המקורי נשמר; אפשר לשחזר את הגיבוי מההגדרות.');return false}}
  return (async()=>{let rec;try{rec=await idbGet('slot:'+sl)}catch(e){storageNotice('האחסון של הדפדפן לא זמין כרגע. נסה לרענן, או ייבא גיבוי.');return false}
    if(!rec){const L=legacyLeftover(sl);if(!L)return false;try{restoreCareer(L.text,sl);SV.known=null;SV.blocked=null;SV.legacySource={slot:sl,key:L.key,careerId:G.careerId};return true}catch(e){storageNotice('השמירה הישנה במשבצת הזאת לא תקינה. אפשר לייצא אותה מההגדרות.');return false}}
    try{const json=await unpackState(rec);restoreCareer(json,sl);SV.known={slot:sl,careerId:rec.careerId,rev:rec.rev};SV.blocked=null;if(G.careerId!==rec.careerId||G.rev!==rec.rev){G.careerId=rec.careerId;G.rev=rec.rev}return true}
    catch(e){storageNotice('לא ניתן לטעון את הקריירה. הקובץ המקורי נשמר; אפשר לשחזר את הגיבוי מההגדרות.');return false}})()}
function recoverBackup(){const n=curSlot();if(STORE.kind!=='idb'){try{const json=localStorage.getItem(slotKey(n)+'_backup');if(!json)return toast('לא נמצא גיבוי קודם');const old=G,oldUid=uid;restoreCareer(json,n);try{localStorage.setItem(slotKey(n),JSON.stringify(G))}catch(e){G=old;uid=oldUid;throw e}storageNotice('');render();toast('הגיבוי הקודם שוחזר')}catch(e){storageNotice('שחזור הגיבוי נכשל. הקבצים הקיימים לא נמחקו.')}return}
  return (async()=>{try{const rec=await idbGet('backup:'+n);if(!rec)return toast('לא נמצא גיבוי קודם');const json=await unpackState(rec);const ok=await installCareer(json,n);if(!ok)throw new Error('restore_failed');render();toast('הגיבוי הקודם שוחזר')}catch(e){storageNotice('שחזור הגיבוי נכשל. הקבצים הקיימים לא נמחקו.')}})()}
function deleteSlot(n){
  // fence first (synchronously), so any save() issued from here on for the old career, or queued earlier, is discarded
  SV.epoch[n]=slotEpoch(n)+1;const ids=new Set();if(SV.known&&SV.known.slot===n&&SV.known.careerId)ids.add(SV.known.careerId);if(G&&(G.slot||curSlot())===n&&G.careerId)ids.add(G.careerId);if(SLOT_META[n]&&SLOT_META[n].careerId)ids.add(SLOT_META[n].careerId);
  for(const id of ids)SV.deleted.add(id);if(SV.q&&SV.q.slot===n)SV.q=null;if(SV.retry&&SV.retry.slot===n)SV.retry=null;if(SV.legacySource&&SV.legacySource.slot===n)SV.legacySource=null;
  try{localStorage.removeItem(slotKey(n));localStorage.removeItem(slotKey(n)+'_backup');localStorage.removeItem('ilm2_meta_'+n);localStorage.removeItem('ilm2_em_'+n)}catch(e){}
  delete SLOT_META[n];if(SV.known&&SV.known.slot===n)SV.known=null;
  try{if(saveBC)saveBC.postMessage({deleted:true,slot:n,epoch:SV.epoch[n],careerIds:[...ids],writer:SV.writer})}catch(e){}
  if(STORE.kind!=='idb')return true;
  // the in-flight write (if any) either committed before the fence — then it is deleted below — or aborts on the fence
  const inflight=SV.busy&&SV.promise?SV.promise.catch(()=>false):Promise.resolve();
  return inflight.then(async()=>{
    // records written by this tab or another before the fence: remember their ids too, then delete
    try{for(const k of ['slot:'+n,'backup:'+n]){const r=await idbGet(k);if(r&&r.careerId)SV.deleted.add(r.careerId)}}catch(e){}
    await idbDel(['slot:'+n,'backup:'+n]);delete SLOT_META[n];
    // nothing may have slipped in between: verify the slot is empty
    const left=await idbGet('slot:'+n);if(left&&isDeletedCareer(left.careerId)){await idbDel(['slot:'+n]);}
    return true}).catch(()=>false)}
async function deleteAllData(){if(G&&G.careerId)SV.deleted.add(G.careerId);for(let n=1;n<=SLOTS;n++)await deleteSlot(n);try{localStorage.removeItem('ilm2_cur')}catch(e){}let cloudOk=true;if(cloud.ready){try{for(let n=1;n<=SLOTS;n++){const base=cloud.db.doc(cloudPath(n));const snap=await base.get();if(snap.exists){const m=snap.data();for(let i=0;i<(m.n||0);i++)await base.collection('chunks').doc('c'+i).delete();await base.delete()}}cloud.meta=null}catch(e){cloudOk=false}}G=null;render();toast(cloudOk?'כל הנתונים נמחקו (מקומי וענן)':'הנתונים המקומיים נמחקו. המחיקה בענן נכשלה, נסה שוב.')}

/* ---- boot: open the database, move legacy localStorage careers over (verified before anything is deleted) ---- */
/* Identity rules: a snapshot may replace a stored record only when it is the same career (careerId) and newer (rev);
   a snapshot with no identity (pre-v8) may only fill an empty slot. Anything else stays where it is and is reported. */
function legacyKeysOf(n){const key=slotKey(n);return {main:key,backup:key+'_backup',meta:'ilm2_meta_'+n,em:'ilm2_em_'+n}}
async function writeVerified(rec,accept,keepBackup){await idbPutCAS(rec,accept,keepBackup);const back=await idbGet(rec.key);if(!back||back.careerId!==rec.careerId||back.rev!==rec.rev)throw new Error('verify_missing');const roundtrip=await unpackState(back);if(roundtrip!==rec.json)throw new Error('verify_mismatch');return back}
async function recordFrom(g,n,key,writer){const stamp=g.savedAt||Date.now();const json=JSON.stringify(g);const packed=await packState(json);return {key,slot:n,careerId:g.careerId,rev:g.rev||0,v:g.v||SAVE_VERSION,t:stamp,meta:metaOf(g,stamp),gz:packed.gz,data:packed.data,writer:writer||'migration',json}}
async function migrateLegacyCareers(){const report=[];
  for(let n=1;n<=SLOTS;n++){const K=legacyKeysOf(n);let json=null,em=null;try{json=localStorage.getItem(K.main);em=localStorage.getItem(K.em)}catch(e){}
    for(const [src,text] of [['legacy',json],['emergency',em]]){if(!text)continue;const srcKey=src==='legacy'?K.main:K.em;
      try{const g=validateCareer(JSON.parse(text));const hadId=!!g.careerId;ensureCareerIdentity(g);const stored=await idbGet('slot:'+n);
        let action;
        if(!stored)action='write';
        else if(hadId&&stored.careerId===g.careerId)action=((g.rev||0)>(stored.rev||0)||((g.rev||0)===(stored.rev||0)&&(g.savedAt||0)>(stored.t||0)))?'write':'superseded';
        else action='mismatch';
        if(action==='mismatch'){report.push({slot:n,src,ok:false,err:'identity_mismatch',kept:true});continue}
        if(action==='write'){const rec=await recordFrom(g,n,'slot:'+n);const expect=stored?{careerId:stored.careerId,rev:stored.rev}:null;
          await writeVerified(rec,s2=>expect?(!!s2&&s2.careerId===expect.careerId&&s2.rev===expect.rev):!s2,true)}
        // the main copy is verified in IndexedDB (or an older revision of the same career): the source may go
        try{localStorage.removeItem(srcKey);if(src==='legacy')localStorage.removeItem(K.meta)}catch(e){}
        report.push({slot:n,src,ok:true,action});
      }catch(e){report.push({slot:n,src,ok:false,err:String(e&&e.message||e),kept:true})}}
    // the legacy backup moves on its own terms: deleted only after its own verified write, or when a newer backup already exists
    let bk=null;try{bk=localStorage.getItem(K.backup)}catch(e){}if(bk){try{const b=validateCareer(JSON.parse(bk));ensureCareerIdentity(b);const have=await idbGet('backup:'+n);
        // a pre-v8 backup has no career id of its own: it can only move into an empty backup:N
        const hadId=!!JSON.parse(bk).careerId;
        if(have&&(!hadId||have.careerId!==b.careerId)){report.push({slot:n,src:'backup',ok:false,err:'identity_mismatch',kept:true})}
        else if(have&&((have.rev||0)>(b.rev||0)||((have.rev||0)===(b.rev||0)&&(have.t||0)>=(b.savedAt||0)))){
          // same career and the stored backup is at least as new: remove the legacy copy only if the stored one is readable
          validateCareer(JSON.parse(await unpackState(have)));localStorage.removeItem(K.backup);report.push({slot:n,src:'backup',ok:true,action:'superseded'})}
        else{const brec=await recordFrom(b,n,'backup:'+n);const expect=have?{careerId:have.careerId,rev:have.rev}:null;
          await writeVerified(brec,s2=>expect?(!!s2&&s2.careerId===expect.careerId&&s2.rev===expect.rev):!s2,false);localStorage.removeItem(K.backup);report.push({slot:n,src:'backup',ok:true,action:'write'})}}
      catch(e){report.push({slot:n,src:'backup',ok:false,err:String(e&&e.message||e),kept:true})}}}
  return report}
/* a slot whose legacy copy could not be moved is still a career: shown on the cards, loadable, exportable */
function legacyLeftover(n){if(STORE.kind!=='idb')return null;const K=legacyKeysOf(n);try{const t=localStorage.getItem(K.main)||localStorage.getItem(K.em);if(!t)return null;let g=null;try{g=JSON.parse(t)}catch(e){}return {text:t,g,key:localStorage.getItem(K.main)?K.main:K.em}}catch(e){return null}}
function migrationNoticeHTML(){const rep=(STORE.migration||[]).filter(r=>!r.ok);if(!rep.length)return '';
  return `<div class="card" id="migrationNotice" style="border-color:var(--warn)"><h3 class="sec">שמירות ישנות שלא הועברו</h3><div class="small" style="margin-top:6px">${rep.map(r=>`משבצת ${r.slot} (${r.src==='legacy'?'שמירה':r.src==='backup'?'גיבוי':'צילום חירום'}): ${r.err==='identity_mismatch'?'באחסון החדש כבר יש קריירה אחרת במשבצת הזאת':'שגיאה: '+esc(r.err||'')}`).join('<br>')}</div><div class="muted tiny" style="margin-top:4px">השמירה הישנה נשארה בדפדפן ולא נמחקה. אפשר לייצא אותה לקובץ, לנסות שוב, או לטעון אותה ולהמשיך ממנה (היא תישמר באחסון החדש בשמירה הבאה ותחליף את מה שיש במשבצת).</div><div class="actions" style="margin-top:8px">${rep.filter(r=>r.src!=='backup').map(r=>`<button class="btn sec sm" data-legacyexport="${r.slot}">ייצא משבצת ${r.slot}</button><button class="btn sec sm" data-legacyload="${r.slot}">טען משבצת ${r.slot}</button>`).join('')}<button class="btn sec sm" id="migrationRetry">נסה שוב</button></div></div>`}
function exportLegacy(n){const L=legacyLeftover(n);if(!L)return toast('לא נמצאה שמירה ישנה');downloadText(L.text,`goalasso-legacy-slot${n}.json`)}
function loadLegacy(n){const L=legacyLeftover(n);if(!L)return toast('לא נמצאה שמירה ישנה');setCurSlot(n);const old=G,oldUid=uid;try{restoreCareer(L.text,n)}catch(e){G=old;uid=oldUid;return toast('השמירה הישנה לא תקינה')}SV.known=null;SV.blocked=null;if(G.careerId)SV.deleted.delete(G.careerId);SV.legacySource={slot:n,key:L.key,careerId:G.careerId};Promise.resolve(save({force:true})).then(ok=>{render();toast(ok?'הקריירה הישנה נטענה ונשמרה באחסון החדש':'הקריירה נטענה, אבל השמירה נכשלה')})}
async function retryMigration(){try{STORE.migration=await migrateLegacyCareers();await refreshMeta()}catch(e){}render();const left=(STORE.migration||[]).filter(r=>!r.ok).length;toast(left?'עדיין יש שמירות שלא הועברו':'כל השמירות הועברו')}
let storageBootP=null;
function storageBoot(){if(storageBootP)return storageBootP;storageBootP=(async()=>{if(STORE.kind!=='idb')return;try{await idbOpen()}catch(e){STORE.kind='ls';STORE.err=e;return}
  try{STORE.migration=await migrateLegacyCareers()}catch(e){STORE.err=e}await refreshMeta()})();return storageBootP}
function storageStatusHTML(){const kind=STORE.kind==='idb'?'IndexedDB (דחוס)':'localStorage';const last=SV.lastOk||(G&&G.savedAt)||0;
  const el=`<div class="muted tiny" id="storageStatus" style="margin-top:6px">אחסון: ${kind}${G&&G.careerId?` · קריירה <bdi>${esc(String(G.careerId).slice(0,8))}</bdi> · גרסה <bdi>${G.rev||0}</bdi>`:''}${last?` · נשמר לאחרונה ${new Date(last).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}`:''}<span id="storageQuota"></span></div>`;
  try{if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(q=>{const s=$('storageQuota');if(s&&q&&q.quota)s.textContent=` · בשימוש ${(q.usage/1048576).toFixed(1)}MB מתוך ${q.quota>=1073741824?(q.quota/1073741824).toFixed(1)+'GB':(q.quota/1048576).toFixed(0)+'MB'}`}).catch(()=>{})}catch(e){}
  return el}

let toastT;function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2200)}
