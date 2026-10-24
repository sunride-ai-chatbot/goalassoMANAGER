// Multiplayer v1: two jsdom windows (host + guest) share one in-memory fake of the Supabase backend (the SQL functions of
// supabase/migrations/20261023120000_multiplayer.sql re-implemented in JS). Create → join → start → both ready → the host
// simulates the week and commits → the guest loads the revision → both watch the recorded match → next week.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'ligat-haal-manager.html'),'utf8');
const errors=[];

/* ---- fake backend ---- */
const DB={leagues:new Map(),members:[],subs:[]};
const notify=()=>{for(const s of DB.subs)setTimeout(()=>{try{s()}catch(e){errors.push('sub:'+e.message)}},0)};
const member=(lid,uid)=>DB.members.find(m=>m.league_id===lid&&m.uid===uid);
function rpc(uid,fn,a){
  if(fn==='mp_create_league'){const id='L'+(DB.leagues.size+1);const code='ABC'+String(DB.leagues.size+1).padStart(3,'0');DB.leagues.set(id,{id,code,host_uid:uid,status:'lobby',revision:0,week:0,season:1,turn_min:a.p_turn_min||1440,turn_due:null,state_gz:a.p_state_gz});DB.members.push({league_id:id,uid,club_id:a.p_club,display_name:a.p_display||"מנג'ר",is_host:true,ready_rev:-1,commands:{},last_seen:new Date().toISOString()});notify();return [{league_id:id,code}]}
  if(fn==='mp_join'){const L=[...DB.leagues.values()].find(l=>l.code===a.p_code);if(!L)throw new Error('league not found');const ex=member(L.id,uid);if(ex)return [{league_id:L.id,club_id:ex.club_id,is_host:ex.is_host,status:L.status}];if(L.status!=='lobby')throw new Error('league already started');if(DB.members.filter(m=>m.league_id===L.id).length>=2)throw new Error('league is full');if(DB.members.some(m=>m.league_id===L.id&&m.club_id===a.p_club))throw new Error('club taken');DB.members.push({league_id:L.id,uid,club_id:a.p_club,display_name:a.p_display||"מנג'ר",is_host:false,ready_rev:-1,commands:{},last_seen:new Date().toISOString()});notify();return [{league_id:L.id,club_id:a.p_club,is_host:false,status:L.status}]}
  if(fn==='mp_start'){const L=DB.leagues.get(a.p_league);if(!L||L.host_uid!==uid)throw new Error('host only');if(DB.members.filter(m=>m.league_id===L.id).length<2)throw new Error('need two managers');L.status='play';L.turn_due=new Date(Date.now()+L.turn_min*60000).toISOString();notify();return null}
  if(fn==='mp_ready'){const m=member(a.p_league,uid);if(!m)throw new Error('not a member');m.ready_rev=a.p_rev;m.commands=a.p_commands||{};notify();return null}
  if(fn==='mp_commit'){const L=DB.leagues.get(a.p_league);if(!L||L.host_uid!==uid)throw new Error('host only');if(L.revision!==a.p_from_rev)throw new Error(`stale revision ${a.p_from_rev}, league is at ${L.revision}`);L.revision++;L.state_gz=a.p_state_gz;L.week=a.p_week;L.season=a.p_season;if(a.p_done)L.status='done';L.turn_due=new Date(Date.now()+L.turn_min*60000).toISOString();DB.commits=(DB.commits||0)+1;notify();return L.revision}
  if(fn==='mp_seen'){const m=member(a.p_league,uid);if(m)m.last_seen=new Date().toISOString();return null}
  throw new Error('unknown rpc '+fn)}
function fakeClient(uid){
  const q=table=>{const f={};const run=()=>{if(table==='mp_leagues'){const L=DB.leagues.get(f.id);return L?[Object.assign({},L)]:[]}return DB.members.filter(m=>m.league_id===f.league_id).map(m=>Object.assign({},m))};
    const b={select(){return b},eq(k,v){f[k]=v;return b},single(){const r=run();return Promise.resolve(r.length?{data:r[0],error:null}:{data:null,error:{message:'not found'}})},then(res,rej){return Promise.resolve({data:run(),error:null}).then(res,rej)}};return b};
  return {auth:{getSession:async()=>({data:{session:{user:{id:uid}}}}),signInAnonymously:async()=>({data:{session:{user:{id:uid}}},error:null})},
    rpc:async(fn,a)=>{try{return {data:rpc(uid,fn,a),error:null}}catch(e){return {data:null,error:{message:e.message}}}},
    from:q,channel(){const ch={on(){return ch},subscribe(){ch.cb=()=>{};return ch}};return ch},removeChannel(){},__push(cb){DB.subs.push(cb)}}}

function openWindow(uid){const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(uid+': '+e.message)});
  const w=new JSDOM(html,{url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true});const c=fakeClient(uid);w.__mpClientFactory=async()=>c;w.__fake=c;w.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16);w.cancelAnimationFrame=clearTimeout}}).window;
  w.__fake.__push(()=>{if(w.eval('typeof G!=="undefined"&&G&&G.mp'))w.eval('mpRefresh().catch(e=>console.error(e))')});return w}
const S=w=>w.eval('G');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,what,ms=8000){const t=Date.now();while(Date.now()-t<ms){try{if(fn())return}catch(e){}await sleep(25)}throw new Error('timeout: '+what)}

async function main(){try{
 const H=openWindow('uid-host'),Gst=openWindow('uid-guest');
 await until(()=>H.document.querySelector('[data-mpa="create"]'),'start screen');
 assert.ok(H.document.querySelector('.card.mp').textContent.includes('זמין'),'multiplayer card advertises availability through the injected client');
 // host creates
 H.document.getElementById('mpName').value='אהרון';H.document.getElementById('mpClub').value='hbs';H.document.getElementById('mpTurn').value='60';H.document.querySelector('[data-mpa="create"]').click();
 await until(()=>S(H)&&S(H).mp&&S(H).mp.code,'league created');
 const code=S(H).mp.code;assert.equal(S(H).mp.host,true);assert.equal(S(H).phase,'play','no contract/sponsor/board ceremony in multiplayer');
 assert.ok(H.document.querySelector('.card.mp').textContent.includes(code),'lobby shows the invite code');
 assert.ok(!H.document.getElementById('playBtn'),'no single-player play button');
 // Both clubs enter Q2, guaranteeing matches in each of the two observed weeks.
 // A Q3 guest (mta) may have a random Toto bye in week one, so waiting for its
 // playback is not a valid fixture and intermittently timed out in deployment CI.
 assert.equal(S(H).clubs.find(c=>c.id==='bje').euro.stage,S(H).cal[0].stage);
 // guest joins
 await until(()=>Gst.document.querySelector('[data-mpa="join"]'),'guest start screen');
 Gst.document.getElementById('mpName').value='דני';Gst.document.getElementById('mpClub').value='bje';Gst.document.getElementById('mpCode').value=code;Gst.document.querySelector('[data-mpa="join"]').click();
 await until(()=>S(Gst)&&S(Gst).mp&&S(Gst).mp.league,'guest joined');
 assert.equal(S(Gst).me,'bje');assert.equal(S(Gst).mp.host,false);assert.equal(S(Gst).phase,'play');
 assert.equal(JSON.stringify(S(Gst).clubs.map(c=>c.id).sort()),JSON.stringify(S(H).clubs.map(c=>c.id).sort()),'guest holds the host\'s league');
 // a second guest picking the same club is refused
 const dup=await Gst.eval("mpRpc('mp_join',{p_code:'"+code+"',p_club:'hbs',p_display:'x'}).then(()=>'ok',e=>e.message)");assert.equal(dup,'ok','re-join by the same uid returns the existing row');
 await until(()=>S(H).mp.members.length===2,'host sees two members');
 // host starts
 H.document.querySelector('[data-mpa="start"]').click();
 await until(()=>S(H).mp.status==='play'&&S(Gst).mp.status==='play','league started on both');
 assert.ok(H.document.querySelector('[data-mpa="ready"]'),'ready button on host');
 // guest sets a distinctive formation and mentality, then both press ready
 Gst.eval("me().formation='3-5-2';me().lineup=null;ensureLineup(me());me().mentality='att'");
 Gst.document.querySelector('[data-mpa="ready"]').click();
 await until(()=>S(H).mp.members.find(m=>!m.me&&m.ready),'host sees the guest ready');
 const wk0=S(H).wk;
 S(H).pressMode='off';S(H).motion='off';S(H).speed=1;S(Gst).pressMode='off';S(Gst).motion='off';S(Gst).speed=1;
 H.document.querySelector('[data-mpa="ready"]').click();
 await until(()=>S(H).mp.rev===1&&S(Gst).mp.rev===1,'week committed and loaded');
 assert.equal(DB.commits,1);
 assert.equal(S(H).wk,wk0+1);assert.equal(S(Gst).wk,wk0+1,'guest advanced with the host');
 assert.equal(S(Gst).me,'bje','guest keeps his club after loading the host state');
 assert.equal(S(H).clubs.find(c=>c.id==='bje').formation,'3-5-2','host applied the guest\'s formation');
 assert.equal(S(H).clubs.find(c=>c.id==='bje').mentality,'att');
 const resH=S(H).results.filter(r=>r.wk===wk0).map(r=>[r.h,r.a,r.gh,r.ga]);const resG=S(Gst).results.filter(r=>r.wk===wk0).map(r=>[r.h,r.a,r.gh,r.ga]);
 assert.equal(JSON.stringify(resG),JSON.stringify(resH),'both phones hold the same results');
 const lw=S(H).mp.lastWeek;assert.ok(lw&&lw.matches.length>=1,'human matches recorded');
 for(const r of lw.matches){assert.ok(r.h==='hbs'||r.a==='hbs'||r.h==='bje'||r.a==='bje');assert.ok(Array.isArray(r.ev));const real=resH.find(x=>x[0]===r.h&&x[1]===r.a);assert.ok(real,'recorded match is in the results');assert.equal(real[2],r.gh);assert.equal(real[3],r.ga)}
 for(const cid of ['hbs','bje'])assert.ok(lw.matches.some(r=>r.h===cid||r.a===cid),'fixture supplies a recorded match for '+cid);
 // both watch their recorded match: live screen in playback mode, no subs, final score equals the record
 await until(()=>H.document.querySelector('.live-view')&&Gst.document.querySelector('.live-view'),'playback started on both');
 assert.ok(H.document.getElementById('subBtn').disabled,'no substitutions during playback');
 const recH=lw.matches.find(r=>r.h==='hbs'||r.a==='hbs');
 await until(()=>H.document.getElementById('ctrlBtn').textContent==='סיכום המשחק','host playback finished',20000);
 assert.equal(H.document.getElementById('gh').textContent+':'+H.document.getElementById('ga').textContent,recH.gh+':'+recH.ga,'playback shows the recorded score');
 assert.equal(S(H).live,null,'a playback is never a pending live match');
 assert.equal(S(H).wk,wk0+1,'playback did not settle anything');
 // every recorded match of the manager is shown in turn (summary → next); then home
 const finishAll=async(w,who)=>{let n=0;while(w.document.querySelector('.live-view')){await until(()=>w.document.getElementById('ctrlBtn').textContent==='סיכום המשחק',who+' playback '+n,25000);w.document.getElementById('ctrlBtn').click();const nx=w.document.getElementById('reportNext');assert.ok(nx,who+': match report after playback');nx.click();await sleep(50);n++}return n};
 const nH=await finishAll(H,'host');assert.equal(nH,lw.matches.filter(r=>r.h==='hbs'||r.a==='hbs').length,'host watched each of his matches once');
 assert.ok(H.document.querySelector('[data-mpa="ready"]'),'home again with the ready button');
 const nG=await finishAll(Gst,'guest');assert.equal(nG,lw.matches.filter(r=>r.h==='bje'||r.a==='bje').length);
 // second week: host alone presses ready before the guest → nothing happens until the guest is ready
 H.document.querySelector('[data-mpa="ready"]').click();
 await sleep(300);assert.equal(DB.commits,1,'host waits for the guest');
 Gst.document.querySelector('[data-mpa="ready"]').click();
 await until(()=>S(H).mp.rev===2&&S(Gst).mp.rev===2,'second week');
 assert.equal(S(H).wk,wk0+2);assert.equal(S(Gst).wk,wk0+2);
 await until(()=>H.document.querySelector('.live-view'),'second week playback');await finishAll(H,'host wk2');
 // market is closed in multiplayer on both sides
 S(H).view='market';H.eval('render()');assert.ok(H.document.querySelector('#main').textContent.includes('בלי העברות'));
 }catch(e){errors.push(e.stack||String(e))}
 console.log('multiplayer errors',JSON.stringify(errors,null,1));process.exit(errors.length?1:0)}
main();
