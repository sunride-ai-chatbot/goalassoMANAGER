/* ====================== PERSISTENCE ====================== */
/* ---- save slots, versioned migrations (guest play = local only; cloud is optional) ---- */
const SAVE_VERSION=7;const SLOTS=3;
function curSlot(){try{return clamp(parseInt(localStorage.getItem('ilm2_cur'))||1,1,SLOTS)}catch(e){return 1}}
function setCurSlot(n){try{localStorage.setItem('ilm2_cur',String(n))}catch(e){}}
function slotKey(n){return n===1?'ilm2':'ilm2_s'+n}
function slotMeta(n){try{const m=localStorage.getItem('ilm2_meta_'+n);if(m)return JSON.parse(m);if(n===1&&localStorage.getItem('ilm2'))return {club:'קריירה שמורה',season:'',wk:0,t:0}}catch(e){}return null}
let persistenceError='';
function storageNotice(message){
  persistenceError=message||'';let box=$('saveWarning');
  if(!message){if(box)box.remove();return}
  if(!box){box=document.createElement('div');box.id='saveWarning';box.setAttribute('role','alert');box.style.cssText='position:fixed;top:0;left:0;right:0;z-index:100000;background:#702a23;color:white;padding:12px;text-align:center;font-size:15px';document.body.appendChild(box)}
  box.textContent=message;const retry=document.createElement('button');retry.textContent='שמור שוב';retry.onclick=()=>save();box.append(' ',retry);const recovery=document.createElement('button');recovery.textContent='שחזר גיבוי';recovery.onclick=()=>openModal('<h3>לשחזר את הגיבוי הקודם?</h3><p>ההתקדמות הנוכחית תוחלף בגיבוי.</p><button class="btn" id="restoreWarningBackup">שחזר</button><button class="btn sec" data-close>ביטול</button>',e=>{if(e.target.closest('#restoreWarningBackup'))recoverBackup()});box.append(' ',recovery);
}
function save(){if(!G)return false;try{
  const slot=G.slot||curSlot(),key=slotKey(slot),previous=localStorage.getItem(key),stamp=Date.now();
  const json=JSON.stringify({...G,slot,v:SAVE_VERSION,savedAt:stamp});
  // Keep the previous recoverable snapshot before replacing the primary save.
  if(previous&&previous!==json){let recoverable=false;try{validateCareer(JSON.parse(previous));recoverable=true}catch(e){}if(recoverable)localStorage.setItem(key+'_backup',previous);}
  localStorage.setItem(key,json);G.slot=slot;G.v=SAVE_VERSION;G.savedAt=stamp;
  const c=me();try{localStorage.setItem('ilm2_meta_'+slot,JSON.stringify({club:c?c.name:'',season:seasonLabel(),wk:G.wk,mgr:G.manager&&G.manager.name,t:stamp,phase:G.phase}))}catch(e){/* metadata is derived; the full career is already durable */}
  storageNotice('');return true;
}catch(e){storageNotice('השמירה נכשלה. ההתקדמות נמצאת בזיכרון בלבד — פנו מקום ונסו לשמור שוב, או ייצאו גיבוי.');return false}}
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
function restoreCareer(json,slot){const old=G,oldUid=uid;try{G=validateCareer(JSON.parse(json));G.slot=slot;hydrateCareer();return G}catch(e){G=old;uid=oldUid;throw e}}
function installCareer(json,slot){const old=G,oldUid=uid;try{restoreCareer(json,slot);if(!save()){G=old;uid=oldUid;return false}return true}catch(e){G=old;uid=oldUid;toast('השמירה לא תקינה או אינה נתמכת. הקריירה הקיימת לא הוחלפה.');return false}}

const MIGRATIONS=[[5,'נתוני משחק מפורטים',()=>{}],[6,'רפואה, יועץ מנטלי, פרסום',()=>migrateM2()],[7,'צוות, כימיה, מוניטין',()=>{ensureStaff();seedChem();ensureRep()}]];
function runMigrations(){const from=G.v||4;for(const [v,,fn] of MIGRATIONS){if(from<v){fn()}}G.v=SAVE_VERSION;if(from<SAVE_VERSION)G.migratedFrom=from}
function deleteSlot(n){try{localStorage.removeItem(slotKey(n));localStorage.removeItem(slotKey(n)+'_backup');localStorage.removeItem('ilm2_meta_'+n)}catch(e){}}
async function deleteAllData(){for(let n=1;n<=SLOTS;n++)deleteSlot(n);try{localStorage.removeItem('ilm2_cur')}catch(e){}let cloudOk=true;if(cloud.ready){try{for(let n=1;n<=SLOTS;n++){const base=cloud.db.doc(cloudPath(n));const snap=await base.get();if(snap.exists){const m=snap.data();for(let i=0;i<(m.n||0);i++)await base.collection('chunks').doc('c'+i).delete();await base.delete()}}cloud.meta=null}catch(e){cloudOk=false}}G=null;render();toast(cloudOk?'כל הנתונים נמחקו (מקומי וענן)':'הנתונים המקומיים נמחקו. המחיקה בענן נכשלה, נסה שוב.')}
function hydrateCareer(){const all=[...G.clubs,...G.leumit,...Object.values(G.pseudo)];const wall=G.world?Object.values(G.world).flatMap(l=>l.clubs):[];uid=Math.max(uid,...all.concat(wall).flatMap(c=>[...c.players,...(c.youth||[])].map(p=>p.id)),...(G.scouts||[]).map(s=>s.id),...(G.scoutMarket||[]).map(s=>s.id),...(G.negs||[]).map(n=>n.id))+1;if(!G.paper)G.paper=[];if(!G.world)G.world={};if(!G.scouts)G.scouts=[];if(!G.scoutMarket)G.scoutMarket=[];if(!G.reports)G.reports=[];if(!G.negs)G.negs=[];if(!G.payables)G.payables=[];if(G.manager&&G.manager.trust==null)G.manager.trust=60;G.clubs.forEach(c=>{if(!c.div)c.div='top'});G.leumit.forEach(c=>{if(!c.div)c.div='leumit';if(c.tier==null)c.tier=4});if(G.leumit.length<16){const have=new Set(G.leumit.map(c=>c.name));for(const d of LEUMIT16){if(G.leumit.length>=16)break;if(!have.has(d.name)&&!G.clubs.some(c=>c.name===d.name))G.leumit.push(buildLeumitClub(d))}}if(!G.lfx||!G.lsched){buildLeumitSeason();G.leumit.forEach(c=>Object.assign(c,{P:0,W:0,D:0,L:0,GF:0,GA:0,pts:0}))}if(!G.toto)buildToto();if(!G.hist)G.hist=[];computeLeumitPrestige();for(const c of all){if(c.scouting==null)c.scouting=1;for(const p of [...c.players,...(c.youth||[])])assignPers(p);if(c.fans==null)c.fans=baseFans(c);if(!c.focus)c.focus='bal';if(!c.intensity)c.intensity='mid';for(const p of [...c.players,...(c.youth||[])]){if(p.morale==null)p.morale=65;if(p.fit==null)p.fit=100}}migrateM2();ensureStaff();seedChem();runMigrations();if(G.phase==='play'&&G.cal&&G.wk<G.cal.length)ensureDraws();}
function load(slot){const sl=slot||curSlot();try{const json=localStorage.getItem(slotKey(sl));if(!json)return false;restoreCareer(json,sl);return true}catch(e){storageNotice('לא ניתן לטעון את הקריירה. הקובץ המקורי נשמר; אפשר לשחזר את הגיבוי מההגדרות.');return false}}
function recoverBackup(){try{const json=localStorage.getItem(slotKey(curSlot())+'_backup');if(!json)return toast('לא נמצא גיבוי קודם');const old=G,oldUid=uid;restoreCareer(json,curSlot());try{localStorage.setItem(slotKey(curSlot()),JSON.stringify(G))}catch(e){G=old;uid=oldUid;throw e}storageNotice('');render();toast('הגיבוי הקודם שוחזר')}catch(e){storageNotice('שחזור הגיבוי נכשל. הקבצים הקיימים לא נמחקו.')}}

let toastT;function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2200)}


