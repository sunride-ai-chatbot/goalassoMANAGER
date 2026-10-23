/* ====================== MULTIPLAYER v1 · two human managers in one league (Supabase) ======================
   The host's client simulates. Both phones hold the same league state (the usual career JSON); each manager runs his own
   club between weeks and presses "מוכן", which uploads his commands (formation, lineup, mentality, tactics, plan,
   roles, captain). When both are ready — or the host's turn timer has expired — the host applies the guest's commands,
   plays the whole week instantly, records the matches the humans are involved in (minute-by-minute events) and commits
   the state. Both phones then watch the recordings at the same pace. Nothing here changes single-player code paths:
   everything is gated on G.mp.
   Backend: supabase/migrations/20261023120000_multiplayer.sql (tables mp_leagues / mp_members, SECURITY DEFINER
   functions, Realtime). Only the public URL + anon key reach the client (__SUPABASE__ from .env or the Pages secrets;
   localStorage 'goalasso_supabase' = {"url","key"} overrides for testing). */
const SUPABASE_BUILD_CFG=__SUPABASE__;
const SUPABASE_CFG=(()=>{try{const o=JSON.parse(localStorage.getItem('goalasso_supabase')||'null');if(o&&o.url&&o.key)return o}catch(e){}return window.__SUPABASE__||SUPABASE_BUILD_CFG||null})();
const SUPABASE_JS_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
const MP={client:null,uid:null,state:'idle',chan:null,poll:null,busy:false,lastSeen:{},err:null,msg:''};
function mpAvailable(){return !!(SUPABASE_CFG&&SUPABASE_CFG.url&&SUPABASE_CFG.key)}
function mpLoadLib(){if(window.supabase&&window.supabase.createClient)return Promise.resolve(true);if(MP.libP)return MP.libP;
  MP.libP=new Promise(res=>{try{const s=document.createElement('script');s.src=SUPABASE_JS_URL;s.async=true;s.crossOrigin='anonymous';s.onload=()=>res(!!(window.supabase&&window.supabase.createClient));s.onerror=()=>res(false);document.head.appendChild(s)}catch(e){res(false)}});return MP.libP}
/* a client can be injected (tests, or a self-hosted backend) through window.__mpClientFactory */
async function mpClient(){if(MP.client)return MP.client;if(window.__mpClientFactory){MP.client=await window.__mpClientFactory();return MP.client}
  if(!mpAvailable()||!(await mpLoadLib()))throw new Error('משחק רשת לא מוגדר בגרסה הזו');
  MP.client=window.supabase.createClient(SUPABASE_CFG.url,SUPABASE_CFG.key,{auth:{persistSession:true,autoRefreshToken:true},realtime:{params:{eventsPerSecond:5}}});return MP.client}
async function mpSignIn(){const c=await mpClient();let {data}=await c.auth.getSession();if(!data||!data.session){const r=await c.auth.signInAnonymously();if(r.error)throw r.error;data=r.data}MP.uid=data.session?data.session.user.id:data.user.id;return MP.uid}
async function mpRpc(fn,args){const c=await mpClient();const {data,error}=await c.rpc(fn,args);if(error)throw new Error(mpErrHe(error.message));return data}
function mpErrHe(m){m=String(m||'');if(/league not found/.test(m))return 'קוד ההזמנה לא נמצא';if(/full/.test(m))return 'הליגה כבר מלאה';if(/club taken/.test(m))return 'המועדון הזה כבר תפוס';if(/already started/.test(m))return 'הליגה כבר התחילה';if(/stale revision/.test(m))return 'הליגה התקדמה בינתיים, מסנכרן…';if(/not signed in/.test(m))return 'לא מחובר';return m}
/* ---- state packing: gzip + base64 of the career JSON (same bytes as the local save) ---- */
async function mpPack(obj){const json=JSON.stringify(obj);const r=await packState(json);if(!r.gz)return 'J'+btoa(unescape(encodeURIComponent(r.data)));let s='';const b=new Uint8Array(r.data);for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return 'G'+btoa(s)}
async function mpUnpack(txt){if(!txt)return null;const kind=txt[0],body=txt.slice(1);if(kind==='J')return JSON.parse(decodeURIComponent(escape(atob(body))));const bin=atob(body);const u=new Uint8Array(bin.length);for(let i=0;i<u.length;i++)u[i]=bin.charCodeAt(i);return JSON.parse(await unpackState({gz:true,data:u}))}
/* ---- commands: what a manager may change between weeks (whitelisted, applied by the host to the member's club) ---- */
const MP_TAC_KEYS=['press','width','tempo','style'];
function mpCommandsFor(c){ensureLineup(c);return {formation:c.formation,lineup:c.lineup.slice(),captain:c.captain||null,mentality:c.mentality||'bal',tac:c.tac?Object.fromEntries(MP_TAC_KEYS.map(k=>[k,c.tac[k]])):null,plan:c.plan?c.plan.slice():null,focus:c.focus,intensity:c.intensity,roles:Object.fromEntries(c.players.filter(p=>p.roleT).map(p=>[p.id,p.roleT])),ticket:c.ticket||null}}
function mpApplyCommands(c,cmd){if(!c||!cmd)return;const ids=new Set(c.players.map(p=>p.id));
  if(cmd.formation&&FORMATIONS&&FORMATIONS[cmd.formation]!==undefined||cmd.formation&&typeof slotsFor==='function'&&slotsFor(cmd.formation).length===11)c.formation=cmd.formation;
  const slots=slotsFor(c.formation);if(Array.isArray(cmd.lineup)&&cmd.lineup.length===slots.length){const seen=new Set();c.lineup=cmd.lineup.map(id=>id!=null&&ids.has(id)&&!seen.has(id)?(seen.add(id),id):null)}else ensureLineup(c);
  if(cmd.captain&&ids.has(cmd.captain))c.captain=cmd.captain;
  if(['def','bal','att'].includes(cmd.mentality))c.mentality=cmd.mentality;
  if(cmd.tac&&typeof cmd.tac==='object'){const t=Object.assign({},tacOf(c));for(const k of MP_TAC_KEYS)if(cmd.tac[k]&&TAC[k]&&TAC[k][cmd.tac[k]])t[k]=cmd.tac[k];c.tac=t}
  if(Array.isArray(cmd.plan)&&cmd.plan.length===5)c.plan=cmd.plan.slice();if(cmd.focus)c.focus=cmd.focus;if(cmd.intensity)c.intensity=cmd.intensity;
  if(cmd.roles)for(const [pid,r] of Object.entries(cmd.roles)){const p=c.players.find(x=>x.id===+pid);if(p&&ROLES[p.pos]&&ROLES[p.pos][r])p.roleT=r}
  if(cmd.ticket)c.ticket=+cmd.ticket;ensureCaptain(c)}
/* a refresh that arrived while we were busy runs as soon as we are free */
function mpIdle(){MP.busy=false;if(MP.pending){MP.pending=false;setTimeout(()=>{if(mpIsOn())mpRefresh().catch(()=>{})},0)}}
/* ---- lifecycle ---- */
function mpPickSlot(){try{for(let n=1;n<=SLOTS;n++)if(!slotMeta(n)){setCurSlot(n);return n}}catch(e){}return curSlot()}
function mpIsOn(){return !!(G&&G.mp)}
function mpIsHost(){return !!(G&&G.mp&&G.mp.host)}
function mpOnboard(){/* no contract/sponsor/board ceremony in multiplayer: fair defaults for both clubs */
  for(const cid of [G.mp.clubId,G.mp.oppClub].filter(Boolean)){const c=club(cid);if(!c)continue;if(!c.sponsor&&G.sponsorOffers&&G.sponsorOffers.length){const o=G.sponsorOffers[0];c.sponsor={...o}}}
  G.phase='play';G.view='home'}
async function mpCreateLeague(clubId,managerName,leagueName,turnMin){MP.busy=true;try{await mpSignIn();newGame(clubId,managerName||'מנג\'ר');G.mp={clubId,host:true,rev:0,status:'lobby',turnMin:turnMin||1440,members:[]};mpOnboard();G.sponsorOffers=G.sponsorOffers||[];
    const gz=await mpPack(G);const rows=await mpRpc('mp_create_league',{p_name:leagueName||'',p_club:clubId,p_display:managerName||'',p_state_gz:gz,p_turn_min:turnMin||1440});const r=Array.isArray(rows)?rows[0]:rows;
    G.mp.league=r.league_id;G.mp.code=r.code;G.slot=mpPickSlot();ensureCareerIdentity(G);await Promise.resolve(save());await mpConnect();render()}catch(e){MP.err=e.message;toast(e.message);throw e}finally{mpIdle()}}
async function mpJoinLeague(code,clubId,managerName){MP.busy=true;try{await mpSignIn();const rows=await mpRpc('mp_join',{p_code:code,p_club:clubId,p_display:managerName||''});const r=Array.isArray(rows)?rows[0]:rows;
    const c=await mpClient();const {data:L,error}=await c.from('mp_leagues').select('id,code,status,revision,state_gz,turn_min').eq('id',r.league_id).single();if(error)throw new Error(mpErrHe(error.message));
    const st=await mpUnpack(L.state_gz);if(!st)throw new Error('אין עדיין מצב ליגה');G=st;hydrateCareer();G.me=r.club_id;G.mp={clubId:r.club_id,host:!!r.is_host,rev:L.revision,status:L.status,league:L.id,code:L.code,turnMin:L.turn_min,members:[]};G.manager=G.manager||{};G.manager.name=managerName||G.manager.name;mpOnboard();
    G.slot=mpPickSlot();ensureCareerIdentity(G);await Promise.resolve(save());await mpConnect();render()}catch(e){MP.err=e.message;toast(e.message);throw e}finally{mpIdle()}}
async function mpConnect(){if(!mpIsOn())return;const c=await mpClient();await mpSignIn();await mpRefresh();if(MP.chan){try{c.removeChannel(MP.chan)}catch(e){}}
  MP.chan=c.channel('mp:'+G.mp.league).on('postgres_changes',{event:'*',schema:'public',table:'mp_leagues',filter:'id=eq.'+G.mp.league},()=>mpRefresh()).on('postgres_changes',{event:'*',schema:'public',table:'mp_members',filter:'league_id=eq.'+G.mp.league},()=>mpRefresh()).subscribe();
  if(MP.poll)clearInterval(MP.poll);MP.poll=setInterval(()=>{if(mpIsOn())mpRefresh().catch(()=>{})},25000);MP.state='on'}
function mpDisconnect(){if(MP.chan&&MP.client){try{MP.client.removeChannel(MP.chan)}catch(e){}}MP.chan=null;if(MP.poll)clearInterval(MP.poll);MP.poll=null;MP.state='idle'}
/* pull league + members; react to a new revision (guest loads state) or to readiness (host simulates) */
async function mpRefresh(){if(!mpIsOn())return;if(MP.busy){MP.pending=true;return}const c=await mpClient();
  const [{data:L,error:e1},{data:M,error:e2}]=await Promise.all([c.from('mp_leagues').select('id,code,status,revision,week,season,turn_due,turn_min,state_gz').eq('id',G.mp.league).single(),c.from('mp_members').select('uid,club_id,display_name,is_host,ready_rev,commands,last_seen').eq('league_id',G.mp.league)]);
  if(e1||e2){MP.err=mpErrHe((e1||e2).message);return}
  const prevStatus=G.mp.status;G.mp.status=L.status;G.mp.turnDue=L.turn_due;G.mp.turnMin=L.turn_min;G.mp.members=M.map(m=>({uid:m.uid,club:m.club_id,name:m.display_name,host:m.is_host,ready:m.ready_rev>=L.revision,seen:m.last_seen,me:m.uid===MP.uid}));
  const other=G.mp.members.find(m=>!m.me);G.mp.oppClub=other?other.club:null;G.mp.oppName=other?other.name:null;G.mp.oppOnline=other?(Date.now()-new Date(other.seen).getTime()<90000):false;
  try{await mpRpc('mp_seen',{p_league:G.mp.league})}catch(e){}
  if(L.revision>G.mp.rev){await mpLoadRevision(L);return}
  if(mpIsHost()&&L.status==='play'){const allReady=G.mp.members.length===2&&G.mp.members.every(m=>m.ready);const expired=L.turn_due&&Date.now()>new Date(L.turn_due).getTime();const meReady=G.mp.members.some(m=>m.me&&m.ready);
    if(allReady||(expired&&meReady)){await mpHostSimulate(L,M);return}}
  if(MP.watching)return;if(prevStatus!==L.status||G.view==='home')render()}
async function mpLoadRevision(L){MP.busy=true;try{const st=await mpUnpack(L.state_gz);if(!st)return;const myClub=G.mp.clubId,keep={host:G.mp.host,league:G.mp.league,code:G.mp.code,clubId:myClub,members:G.mp.members,oppClub:G.mp.oppClub,oppName:G.mp.oppName,oppOnline:G.mp.oppOnline,turnMin:L.turn_min,turnDue:L.turn_due};
    const slot=G.slot,careerId=G.careerId,mgr=G.manager;G=st;hydrateCareer();G.me=myClub;G.mp=Object.assign({},st.mp||{},keep,{rev:L.revision,status:L.status});G.slot=slot;if(careerId)G.careerId=careerId;if(mgr)G.manager=Object.assign({},G.manager||{},{name:mgr.name});
    G.phase='play';G.view='home';G.live=null;await Promise.resolve(save());
    const w=G.mp.lastWeek;if(w&&w.rev===L.revision&&w.matches&&w.matches.length&&!G.mp.watched){G.mp.watched=true;mpWatchWeek();return}render()}finally{mpIdle()}}
/* ---- the host's turn: apply the guest's commands, play the week, record human matches, commit ---- */
async function mpHostSimulate(L,members){if(MP.busy)return;MP.busy=true;try{
    const guest=members.find(m=>m.uid!==MP.uid);if(guest){const gc=club(guest.club_id);if(gc){if(guest.ready_rev>=L.revision&&guest.commands&&Object.keys(guest.commands).length)mpApplyCommands(gc,guest.commands);else{ensureLineup(gc)}}}
    const mine=club(G.mp.clubId);if(mine)ensureLineup(mine);
    const humans=new Set([G.mp.clubId,guest?guest.club_id:null].filter(Boolean));const before=G.results.length;const wk=G.wk,season=G.season;
    // play everything instantly; matches with a human side are recorded (events, lineups) for both phones to watch
    const rec=[];MP.capture=humans;MP.captured=[];const M=advanceWeek();MP.capture=null;if(M){M.live=false;runInstant(M);if(M.ctx.kind!=='league'&&M.gh===M.ga&&(M.ctx.kind==='cup'||M.ctx.stage==='F'))decidePens(M);rec.push(mpRecord(M,wk));afterMyMatch(M)}
    for(const C of MP.captured)if(!rec.some(x=>x.h===C.h&&x.a===C.a))rec.push(mpRecord(C,wk));MP.captured=[];
    G.mp.lastWeek={rev:L.revision+1,wk,season,matches:rec};G.mp.watched=false;G.view='home';G.live=null;
    const done=G.phase!=='play';const gz=await mpPack(G);const rev=await mpRpc('mp_commit',{p_league:G.mp.league,p_from_rev:L.revision,p_state_gz:gz,p_week:G.wk,p_season:G.season,p_done:!!done});
    G.mp.rev=rev;await Promise.resolve(save());if(rec.length){G.mp.watched=true;mpWatchWeek()}else render()}catch(e){MP.err=e.message;toast(e.message);if(/stale/.test(e.message))await mpRefresh()}finally{mpIdle()}}
function mpRecord(M,wk){const h=club(M.h),a=club(M.a);let motm=null;try{motm=manOfMatch(M,h,a)}catch(e){}return {h:M.h,a:M.a,gh:M.gh,ga:M.ga,wk:wk==null?G.wk:wk,season:G.season,motm,label:M.ctx.label||'',ctx:{kind:M.ctx.kind,stage:M.ctx.stage,neutral:M.ctx.neutral,label:M.ctx.label},pens:M.pens||null,att:M.att,ev:M.ev.map(e=>Object.assign({},e)),xi:{[M.h]:M.xi0||null,[M.a]:null},subs:M.subs,shots:M.shots,sot:M.sot,poss:M.poss,ratings:M.ratings||null}}
/* ---- ready / commands ---- */
async function mpReady(){if(!mpIsOn()||MP.busy)return;const c=club(G.mp.clubId);const cmd=mpCommandsFor(c);MP.busy=true;try{await mpRpc('mp_ready',{p_league:G.mp.league,p_rev:G.mp.rev,p_commands:cmd});G.mp.readySent=G.mp.rev;await Promise.resolve(save());toast('נשלח · ממתינים ליריב')}catch(e){toast(e.message)}finally{mpIdle()}await mpRefresh()}
async function mpUnready(){if(!mpIsOn()||MP.busy)return;MP.busy=true;try{await mpRpc('mp_ready',{p_league:G.mp.league,p_rev:-1,p_commands:{}});G.mp.readySent=-1}catch(e){toast(e.message)}finally{mpIdle()}await mpRefresh()}
async function mpStart(){if(!mpIsHost())return;MP.busy=true;try{await mpRpc('mp_start',{p_league:G.mp.league});toast('הליגה התחילה')}catch(e){toast(e.message)}finally{mpIdle()}await mpRefresh()}
/* ---- watching the recorded matches of the week (both phones, same recording, same pace) ---- */
function mpPlayback(rec){const h=club(rec.h),a=club(rec.a);if(!h||!a)return null;const mk=c=>bestXI(c).map(p=>({pid:p.id,slot:p.pos,since:0,yel:0}));
  const M={h:rec.h,a:rec.a,ctx:Object.assign({kind:'league'},rec.ctx||{},{label:rec.label}),m:0,gh:0,ga:0,ev:[],xi:{[rec.h]:mk(h),[rec.a]:mk(a)},subs:{[rec.h]:0,[rec.a]:0},used:{[rec.h]:[],[rec.a]:[]},mins:{[rec.h]:{},[rec.a]:{}},shots:{[rec.h]:0,[rec.a]:0},poss:{[rec.h]:0,[rec.a]:0},passes:{[rec.h]:0,[rec.a]:0},pm:[],ps:{[rec.h]:{},[rec.a]:{}},seed:0,att:rec.att||0,boost:{},done:false,half:false,pens:rec.pens||null,live:true,playback:{ev:rec.ev||[],i:0,final:[rec.gh,rec.ga],shots:rec.shots,sot:rec.sot,poss:rec.poss,wk:rec.wk,motm:rec.motm||null},settled:true,mp:true};return M}
function mpPlaybackStep(M){const P=M.playback;M.m++;const src=P.ev;while(P.i<src.length&&src[P.i].m<=M.m){const e=src[P.i++];M.ev.push(e);if(e.t==='goal'||e.t==='pen'){if(e.team===M.h)M.gh++;else M.ga++}else if(e.t==='own'){if(e.team===M.h)M.gh++;else M.ga++}if(e.t==='sub'){const xi=M.xi[e.team];const i=xi.findIndex(x=>x.pid===e.outPid);if(i>=0)xi.splice(i,1);const c=club(e.team);const p=c.players.find(x=>fullName(x)===e.name);if(p)xi.push({pid:p.id,slot:p.pos,since:M.m,yel:0})}}
  if(P.shots){M.shots[M.h]=Math.round(P.shots[M.h]*M.m/90);M.shots[M.a]=Math.round(P.shots[M.a]*M.m/90)}if(P.poss){M.poss[M.h]=Math.round(P.poss[M.h]*M.m/90);M.poss[M.a]=Math.round(P.poss[M.a]*M.m/90)}
  if(M.m>=90){M.done=true;M.gh=P.final[0];M.ga=P.final[1]}}
function mpWatchWeek(){const w=G.mp&&G.mp.lastWeek;if(!w||!w.matches.length)return;G.mp.queue=w.matches.filter(r=>r.h===G.me||r.a===G.me);mpWatchNext()}
function mpWatchNext(){const q=G.mp&&G.mp.queue;if(!q||!q.length){if(G.mp)G.mp.queue=null;MP.watching=null;G.view='home';render();return}const rec=q.shift();const M=mpPlayback(rec);if(!M){mpWatchNext();return}MP.watching=M;startLive(M)}
/* ---- UI ---- */
function mpNoMarketHTML(){return `<div class="card"><h3 class="sec">שוק ההעברות · משחק רשת</h3><div class="muted small" style="margin-top:6px">בגרסה הראשונה של משחק הרשת שני המאמנים משחקים עם הסגלים הקיימים, בלי העברות. הרכב, טקטיקה, תפקידים, תוכנית אימונים ומחיר כרטיס נשלחים ליריב בכל "מוכן".</div></div>`}

function mpTurnLeft(){if(!G.mp||!G.mp.turnDue)return '';const ms=new Date(G.mp.turnDue).getTime()-Date.now();if(ms<=0)return 'הזמן נגמר';const m=Math.round(ms/60000);return m>=120?`${Math.round(m/60)} שעות`:`${m} דק'`}
function mpCardHTML(){if(!mpIsOn())return '';const mp=G.mp;const me0=mp.members.find(m=>m.me),opp=mp.members.find(m=>!m.me);
  const member=m=>m?`<div class="mpm ${m.ready?'ready':''}"><b>${esc(m.name)}</b><small>${esc(club(m.club)?club(m.club).name:m.club)} · ${m.host?'מזמין':'אורח'} · ${m.me?'אתה':(mp.oppOnline?'מחובר':'לא מחובר')}</small><span class="tag ${m.ready?'good':''}">${m.ready?'מוכן':'מנהל…'}</span></div>`:'<div class="mpm muted">ממתינים לשחקן שני…</div>';
  const link=location.origin+location.pathname+'?join='+mp.code;
  if(mp.status==='lobby')return `<div class="card mp"><div class="row between"><h3 class="sec">משחק רשת · לובי</h3><span class="tag info">קוד <bdi>${esc(mp.code)}</bdi></span></div>
    ${member(me0)}${member(opp)}
    <div class="muted small" style="margin-top:6px">שלח לחבר את הקוד או את הקישור. הוא נכנס כאורח, בוחר מועדון פנוי, ואתם באותה ליגה.</div>
    <div class="actions" style="margin-top:8px"><button class="btn sec" data-mpa="copy" data-link="${esc(link)}">העתק קישור</button>${navigator.share?`<button class="btn sec" data-mpa="share" data-link="${esc(link)}">שתף</button>`:''}${mp.host?`<button class="btn" data-mpa="start" ${mp.members.length<2?'disabled':''}>התחל ליגה</button>`:''}<button class="btn sec" data-mpa="leave">יציאה</button></div></div>`;
  const ready=mp.readySent===mp.rev;const waitMsg=ready?(opp&&opp.ready?'שניכם מוכנים · המזמין מריץ את השבוע':'ממתינים ליריב'):'';
  return `<div class="card mp"><div class="row between"><h3 class="sec">משחק רשת · שבוע ${G.wk+1}</h3><span class="tag ${mp.oppOnline?'good':''}">${opp?esc(opp.name):'—'} ${mp.oppOnline?'מחובר':'לא מחובר'}</span></div>
    ${member(me0)}${member(opp)}
    <div class="muted small" style="margin-top:6px">${mp.host?'כשאתה והיריב מוכנים (או כשהטיימר נגמר) הטלפון שלך מריץ את השבוע ושולח לשניכם.':'המזמין מריץ את השבוע כששניכם מוכנים.'} זמן לתור: <bdi>${mpTurnLeft()}</bdi>${!mp.oppOnline&&opp?' · היריב לא מחובר: אם הטיימר ייגמר, המחשב ינהל במקומו.':''}</div>
    ${MP.err?`<div class="small" style="color:var(--bad);margin-top:6px">${esc(MP.err)}</div>`:''}
    <div class="actions" style="margin-top:8px">${ready?`<button class="btn sec" data-mpa="unready">בטל "מוכן"</button><span class="small muted" style="align-self:center">${waitMsg}</span>`:`<button class="btn big" data-mpa="ready">מוכן לשבוע ${G.wk+1}</button>`}${mp.lastWeek&&mp.lastWeek.matches&&mp.lastWeek.matches.length?`<button class="btn sec" data-mpa="rewatch">צפה שוב במשחקי השבוע</button>`:''}</div></div>`}
function mpStartHTML(){const defs=Object.keys(META).map(id=>{const raw=RAW.find(r=>r.id===id);const fb=FALLBACK[id];return {id,name:raw?.name_he||fb.name,c1:raw?.colors?.[0]||fb.colors[0],c2:raw?.colors?.[1]||fb.colors[1]}});
  const joinCode=(new URLSearchParams(location.search).get('join')||'').toUpperCase();
  return `<div class="card mp"><div class="row between"><h3 class="sec">משחק רשת · 1 נגד 1</h3>${mpAvailable()||window.__mpClientFactory?'<span class="tag good">זמין</span>':'<span class="tag">לא מוגדר</span>'}</div>
    <div class="muted small" style="margin-top:4px">שני מאמנים באותה ליגת העל, 12 המועדונים האחרים מחשב. כל שבוע כל אחד מנהל בזמנו ולוחץ "מוכן"; המשחקים ביניכם נצפים יחד.</div>
    <div class="row wrap" style="gap:8px;margin-top:8px"><input id="mpName" placeholder="שם המנג'ר" maxlength="24" style="flex:1;min-width:140px"><select id="mpClub">${defs.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div>
    <div class="row wrap" style="gap:8px;margin-top:8px"><select id="mpTurn"><option value="10">תור של 10 דק'</option><option value="60">שעה</option><option value="1440" selected>24 שעות</option><option value="2880">48 שעות</option></select><button class="btn" data-mpa="create" ${mpAvailable()||window.__mpClientFactory?'':'disabled'}>צור ליגה וקבל קוד</button></div>
    <div class="row wrap" style="gap:8px;margin-top:10px;border-top:1px solid var(--line);padding-top:10px"><input id="mpCode" placeholder="קוד הזמנה" maxlength="6" value="${esc(joinCode)}" style="width:120px;text-transform:uppercase"><button class="btn sec" data-mpa="join" ${mpAvailable()||window.__mpClientFactory?'':'disabled'}>הצטרף לליגה</button></div>
    <div id="mpMsg" class="small muted" style="margin-top:6px">${esc(MP.msg||'')}</div></div>`}
async function mpUiAction(k,el){try{
  if(k==='create'){const name=$('mpName').value.trim(),clubId=$('mpClub').value,turn=+$('mpTurn').value;MP.msg='יוצר ליגה…';el.disabled=true;await mpCreateLeague(clubId,name,'',turn);return}
  if(k==='join'){const name=$('mpName').value.trim(),clubId=$('mpClub').value,code=$('mpCode').value.trim().toUpperCase();if(code.length<6){toast('הכנס קוד הזמנה');return}MP.msg='מצטרף…';el.disabled=true;await mpJoinLeague(code,clubId,name);return}
  if(k==='start')return mpStart();if(k==='ready')return mpReady();if(k==='unready')return mpUnready();
  if(k==='copy'){try{await navigator.clipboard.writeText(el.dataset.link);toast('הקישור הועתק')}catch(e){prompt('העתק את הקישור',el.dataset.link)}return}
  if(k==='share'){try{await navigator.share({title:'GOALASSO · משחק רשת',text:'בוא נשחק ליגה 1 נגד 1 ב-GOALASSO',url:el.dataset.link})}catch(e){}return}
  if(k==='rewatch'){G.mp.watched=true;mpWatchWeek();return}
  if(k==='leave'){if(!confirm('לצאת מהליגה? הקריירה המקומית תישמר, אבל הליגה תמשיך בלעדיך.'))return;mpDisconnect();G=null;render();return}
  }catch(e){MP.msg=e.message;toast(e.message);render()}}
