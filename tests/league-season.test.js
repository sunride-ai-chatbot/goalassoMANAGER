// A whole season of a shared league, played by two browser windows against the REAL server code: the two
// migrations run on an in-process Postgres (PGlite) with the real price list, and each window's client calls the
// same functions the deployed game calls. Nothing here is a model of the server — what passes here is what the
// SQL Editor installs.
//
// What it is guarding, in the order a league meets it: the market charges the server's price; "build me a squad"
// and the start leave nobody without a team; two phones simulate the same match from the same lock and seed (one
// window is the full game, the other the beginner page, and neither has a career); a penalty is a duel whose
// choices cross only when both are in, and is taken for a manager who is not there; a result counts when both
// phones send the same one; training, a trade, the table, the prize money and a second season.
process.env.TZ='UTC';   // the appointment is checked against time zones: this phone's is a known one
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
let PGlite;try{({PGlite}=require('@electric-sql/pglite'))}catch(e){console.log('league season: @electric-sql/pglite is not installed, skipped; errors []');process.exit(0)}
const errors=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,what,ms=20000){const t=Date.now();let last;while(Date.now()-t<ms){try{const v=await fn();if(v)return v}catch(e){last=e}await sleep(20)}throw new Error('timeout: '+what+(last?' ('+last.message+')':''))}

(async()=>{
 const db=new PGlite();
 await db.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin;
  create schema auth;create table auth.users(id uuid primary key,aud text,role text);
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
  grant usage on schema public to anon,authenticated,service_role;
  alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
  alter default privileges in schema public grant all on functions to anon,authenticated,service_role;`);
 // exactly the three files the owner pastes into the SQL Editor, in that order
 await db.exec(read('supabase/install-league.sql'));
 await db.exec(read('supabase/install-league-2.sql'));
 await db.exec(read('supabase/install-league-pool.sql'));
 const U={h:'11111111-1111-4111-8111-111111111111',b:'22222222-2222-4222-8222-222222222222'};
 await db.exec(`insert into auth.users(id,aud,role) values('${U.h}','authenticated','authenticated'),('${U.b}','authenticated','authenticated')`);
 const lit=v=>v==null?'null':typeof v==='number'||typeof v==='boolean'?String(v):Array.isArray(v)?(v.length?`array[${v.map(lit).join(',')}]::text[]`:`'{}'::text[]`):`'${String(typeof v==='object'?JSON.stringify(v):v).replace(/'/g,"''")}'`;
 let chain=Promise.resolve();
 const rpc=(uid,fn,args)=>{const run=()=>db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query(`select set_config('request.jwt.claim.sub',$1,true)`,[uid]);
   const r=await tx.query(`select public.${fn}(${Object.entries(args||{}).map(([k,v])=>`${k}=>${lit(v)}`).join(',')}) as r`);return r.rows[0].r});
  const p=chain.then(run,run);chain=p.catch(()=>{});return p};
 const client=uid=>({auth:{getSession:async()=>({data:{session:{user:{id:uid}}},error:null}),signInAnonymously:async()=>({data:{session:{user:{id:uid}}},error:null})},
  rpc:async(fn,a)=>{try{return {data:await rpc(uid,fn,a),error:null}}catch(e){return {data:null,error:{message:String(e.message||e)}}}},
  channel(){const ch={on(){return ch},subscribe(){return ch}};return ch},removeChannel(){}});
 const sqlOne=async q=>(await db.query(q)).rows[0];

 function openWindow(uid,file,url){const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(uid.slice(0,4)+': '+e.message)});
  const w=new JSDOM(read(file),{url:url||'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
   beforeParse(w){w.__noExtras=1;w.__ilmNoSplash=1;w.__noWindow=1;w.__noEnv=1;w.__noBook=1;w.__noHalf=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true});const c=client(uid);w.__lgClientFactory=async()=>c;w.__mpClientFactory=async()=>c;
    w.requestAnimationFrame=cb=>setTimeout(()=>cb(Date.now()),16);w.cancelAnimationFrame=clearTimeout}}).window;
  w.addEventListener('unhandledrejection',e=>errors.push(uid.slice(0,4)+' rejection: '+(e.reason&&e.reason.message||e.reason)));return w}
 const B=w=>w.document.getElementById('lg-body'),S=w=>w.document.getElementById('lg-status').textContent,$=(w,q)=>w.document.querySelector(q),$$=(w,q)=>[...w.document.querySelectorAll(q)];
 const tab=async(w,k)=>{$(w,`[data-lg="tab"][data-v="${k}"]`).click();await sleep(10)};
 const idle=w=>until(()=>!w.eval('LG.busy'),'idle');

 try{
  // ---- the full game and the beginner page, neither with a career ----
  const H=openWindow(U.h,'ligat-haal-manager.html');
  await until(()=>H.eval('typeof League!=="undefined"&&typeof lgSimulate==="function"'),'the league loads');
  assert.equal(H.eval('G'),null,'no career on this phone');
  H.eval('LG.fast=true;League.open()');
  await until(()=>$(H,'[data-lg="create"]'),'lobby');
  $(H,'#lg-name').value='ליגת חמישי';$(H,'#lg-team2').value='הפועל הצפון';$(H,'#lg-cap').value='2';$(H,'[data-lg="create"]').click();
  await until(()=>$(H,'.lg-members')&&$(H,'#lg-tabs')&&!$(H,'#lg-tabs').hidden,'the board, with its tabs');
  const lid=(await sqlOne('select id, invitation from public.lg_leagues')).id,inv=(await sqlOne('select invitation from public.lg_leagues')).invitation;
  assert.ok($(H,'#lg-link').value.includes(inv));
  assert.equal($(H,'[data-lg="start"]').disabled,true,'a league of one cannot start');
  assert.match(B(H).textContent,/חסרים לך 14 שחקנים/);

  const Gs=openWindow(U.b,'beginner.html','https://goalasso.test/beginner.html?league='+inv);
  await until(()=>$(Gs,'[data-lg="join"]'),'the invitation opens the league by itself, over the title screen');
  Gs.eval('LG.fast=true');$(Gs,'#lg-team').value='מכבי הגבעה';$(Gs,'[data-lg="join"]').click();
  await until(()=>$(Gs,'.lg-members')&&$$(Gs,'.lg-members li').length===2,'two managers');

  // ---- the market: the catalogue is the game's, the price is the server's ----
  await tab(H,'market');
  assert.ok($$(H,'.lg-plist .lg-p').length===30,'thirty players a page');
  const q=$(H,'#lg-q');q.value='מסי';q.dispatchEvent(new H.Event('input',{bubbles:true}));
  await until(()=>$$(H,'#lg-mklist .lg-p').length>0&&$$(H,'#lg-mklist .lg-p').length<30,'the search narrows the list as it is typed');
  q.value='';q.dispatchEvent(new H.Event('input',{bubbles:true}));
  $(H,'[data-lg="mk-pos"][data-v="FW"]').click();$(H,'[data-lg="mk-sort"][data-v="c"]').click();
  const first=$(H,'#lg-mklist .lg-p');const key=first.dataset.v;first.click();
  await until(()=>$(H,'.lg-sheet [data-lg="buy"]'),'a player card with a price');
  const price=Number((await sqlOne(`select value from public.lg_pool where player='${key.replace(/'/g,"''")}'`)).value);
  assert.equal(H.eval(`lgEntry(${JSON.stringify(key)}).v`),price,'the price shown is the price the server will charge');
  $(H,'.lg-sheet [data-lg="buy"]').click();
  await until(()=>/חתם/.test(S(H)),'signed');
  assert.equal(Number((await sqlOne(`select money from public.lg_members where owner_id='${U.h}'`)).money),60000000-price);
  assert.ok(!$$(H,'#lg-mklist .lg-p').some(li=>li.dataset.v===key),'a signed player leaves the market');
  // the other phone cannot have him
  const taken=await client(U.b).rpc('lg_buy',{p_league:lid,p_player:key});assert.equal(taken.error.message,'player_taken');
  // a star nobody can afford is shown as out of reach, not hidden
  $(H,'[data-lg="mk-pos"][data-v=""]').click();$(H,'[data-lg="mk-sort"][data-v="v"]').click();
  assert.ok($(H,'#lg-mklist .p-price.far'),'out of reach is said, not hidden');
  $(H,'[data-lg="mk-mine"]').click();
  assert.equal($(H,'#lg-mklist .p-price.far'),null,'"only what I can pay for" is what it says');

  // ---- "build me a squad" ----
  $(H,'[data-lg="autofill"]').click();
  await until(()=>/נבנה סגל/.test(S(H)),'a squad built');
  assert.equal(H.eval('lgMe().squad'),16);assert.ok(H.eval('lgMe().money')>=0);
  assert.equal($$(H,'.lg-plist .lg-p:not(.empty)').length,16,'eleven and a bench of five');
  assert.equal(H.eval('lgMyClub().lineup.filter(Boolean).length'),11);
  // formation, mentality, a swap: all of it is what the server will lock
  $(H,'[data-lg="formation"][data-v="4-4-2"]').click();
  await until(()=>/נשמר/.test(S(H)),'setup saved');
  $(H,'[data-lg="ment"][data-v="att"]').click();await until(()=>/נשמר/.test(S(H)),'mentality saved');
  const benchKey=H.eval('(()=>{const c=lgMyClub();return c.players.find(p=>!c.lineup.includes(p.id)&&p.pos!=="GK").lgKey})()');
  $(H,`.lg-p[data-v="${benchKey.replace(/"/g,'\\"')}"]`).click();
  await until(()=>$(H,'.lg-sheet [data-lg="swap"]'),'the card offers the eleven to swap with');
  $(H,'.lg-sheet [data-lg="swap"]').click();
  await until(async()=>{const s=(await sqlOne(`select setup from public.lg_members where owner_id='${U.h}'`)).setup;return s.formation==='4-4-2'&&s.mentality==='att'&&Array.isArray(s.lineup)&&s.lineup.includes(benchKey)},'the line-up on the server is the one on the screen');

  // ---- the start: the guest has bought nobody and still gets a team ----
  await tab(H,'home');
  await until(async()=>{await H.eval('lgReload()');return !$(H,'[data-lg="start"]').disabled},'two managers: the host may start');
  $(H,'[data-lg="start"]').click();assert.match($(H,'[data-lg="start"]').textContent,/לחץ שוב/,'asked once more');
  $(H,'[data-lg="start"]').click();
  await until(()=>$(H,'.lg-hero [data-lg="play"]'),'the first evening');
  assert.ok(Number((await sqlOne(`select count(*)::int n from public.lg_squads where owner_id='${U.b}'`)).n)>=14,'nobody starts without a team');
  assert.equal($$(H,'.lg-table tbody tr').length,2);assert.equal($$(H,'.lg-card:not(.lg-all) .lg-fxs .lg-fx').length,1);
  await Gs.eval('lgReload()');await until(()=>$(Gs,'.lg-hero [data-lg="play"]'),'the guest sees the same evening');

  // ---- the appointment: the host's to set, never in anybody's night, a countdown and a reminder for all ----
  {assert.ok($(H,'[data-lg="kick-open"]'),'the host may give the round a time');assert.ok(!$(Gs,'.lg-kick'),'and nobody else');
   await until(async()=>(await sqlOne(`select count(*)::int n from public.lg_members where tz='UTC'`)).n===2,'each phone told the server its time zone');
   await db.exec(`update public.lg_members set tz='Asia/Tokyo' where owner_id='${U.b}'`);await H.eval('lgReload()');
   const day=Math.floor(Date.now()/864e5)*864e5+2*864e5,night=day+18*36e5,fine=day+11*36e5;   // 18:00 UTC is 03:00 in Tokyo, 11:00 UTC is 20:00
   $(H,'[data-lg="kick-open"]').click();assert.ok($$(H,'[data-lg="kick-chip"]').length>=4);
   H.eval(`LG.kick.t=${night};lgPaint()`);
   assert.equal($(H,'[data-lg="kick-set"]').disabled,true,'a time that is the night for somebody cannot be set');assert.match($(H,'#lg-kick-check').textContent,/מכבי הגבעה זה אמצע הלילה/);
   await assert.rejects(rpc(U.h,'lg_kickoff',{p_league:lid,p_at:new Date(night).toISOString()}),/night/,'nor by a changed page');
   await assert.rejects(rpc(U.b,'lg_kickoff',{p_league:lid,p_at:new Date(fine).toISOString()}),/host_only/);
   const inp=$(H,'[data-lg-input="kick"]');inp.value=H.eval(`lgLocalInput(${fine})`);inp.dispatchEvent(new H.Event('input',{bubbles:true}));
   assert.equal($(H,'[data-lg="kick-set"]').disabled,false);assert.match($(H,'.k-zones').textContent,/20:00/,'the host sees what it is on the other clock');
   $(H,'[data-lg="kick-set"]').click();await until(()=>$(H,'#lg-count'),'the countdown');await idle(H);
   assert.match($(H,'.lg-kick').textContent,/11:00/);assert.match($(H,'#lg-count').textContent,/בעוד/);
   await Gs.eval('lgReload()');await until(()=>$(Gs,'#lg-count'),'the guest sees it too');assert.ok($(Gs,'[data-lg="kick-remind"]')&&$(Gs,'[data-lg="kick-ics"]')&&!$(Gs,'[data-lg="kick-open"]'));
   const ics=Gs.eval('lgIcs()');assert.match(ics,/TRIGGER:-PT5M/);assert.ok(ics.includes('DTSTART:'+new Date(fine).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'')),'one instant, whatever the phone\'s zone');
   // five minutes before: one reminder, once
   await db.exec(`update public.lg_leagues set kickoff_at=now()+interval '4 minutes 30 seconds' where id='${lid}'`);
   Gs.eval('window.__n=[];notify=(t,b)=>{window.__n.push(t+" | "+b);return true}');await Gs.eval('lgReload()');Gs.eval('lgKickTick();lgKickTick()');
   const n=Gs.eval('window.__n');assert.equal(n.length,1,'reminded once');assert.match(n[0],/עוד 5 דקות משחקים \| ליגת חמישי · מחזור 1 · נגד הפועל הצפון/);
   $(H,'[data-lg="kick-open"]')||await H.eval('lgReload()');
   await idle(H);$(H,'[data-lg="kick-clear"]').click();await until(()=>!$(H,'#lg-count')&&$(H,'[data-lg="kick-open"]'),'the host takes the time back');await idle(H)}

  // ---- training: three a round ----
  await tab(H,'squad');
  const young=JSON.parse(H.eval('(()=>{const c=lgMyClub();const p=c.players.slice().sort((a,b)=>(a.age-b.age)||(b.pot-b.ovr)-(a.pot-a.ovr))[0];return JSON.stringify({key:p.lgKey,ovr:p.ovr,pot:p.pot,age:p.age})})()'));
  for(let i=0;i<3;i++){$(H,`.lg-p[data-v="${young.key.replace(/"/g,'\\"')}"]`).click();await until(()=>$(H,'.lg-sheet [data-lg="train"]')||$(H,'.lg-sheet .lg-note'),'card');const t=$(H,'.lg-sheet [data-lg="train"]');if(!t||t.disabled)break;t.click();await until(()=>/השתפר|התאמן/.test(S(H))&&!H.eval('LG.busy'),'trained');H.eval('lgMsg("")');$(H,'[data-lg="sheet-close"]')&&$(H,'[data-lg="sheet-close"]').click()}
  const trained=Number((await sqlOne(`select count(*)::int n from public.lg_training where owner_id='${U.h}'`)).n);
  assert.ok(trained>=1&&trained<=3,'sessions were spent: '+trained);
  const after=H.eval(`lgPlayer(${JSON.stringify(young.key)}).ovr`);
  assert.ok(after>=young.ovr&&after<=young.pot,`training never passes a player's ceiling (${young.ovr} → ${after}, ceiling ${young.pot})`);
  if(young.age<=21&&young.pot>young.ovr)assert.ok(after>young.ovr,'a young player with room to grow grows');
  assert.equal((await client(U.h).rpc('lg_train',{p_league:lid,p_player:young.key})).error&&trained===3?'no_sessions_left':'ok',trained===3?'no_sessions_left':'ok');

  // ---- evening one: the host plays alone, the guest confirms later ----
  const fx1=(await sqlOne(`select id, home_id from public.lg_fixtures where league_id='${lid}' and round=1`));
  // a seed whose match has a penalty, so the duel is part of what is tested
  const lock1=(await client(fx1.home_id).rpc('lg_fixture_lock',{p_fixture:fx1.id,p_sim:H.eval('lgSimId()')})).data;
  assert.equal(H.eval('lgSimId()'),Gs.eval('lgSimId()'),'both pages are the same build of the engine and the data');
  H.__lock=lock1.lock;
  const seedPen=H.eval(`(()=>{const lock=${JSON.stringify(lock1.lock)};for(let s=1;s<4000;s++){const r=lgSimulate({seed:s,lock,pens:[]});if(r.state==='pen')return s}return 0})()`);
  assert.ok(seedPen>0,'a match with a penalty exists');
  await db.exec(`update public.lg_fixtures set seed=${seedPen} where id='${fx1.id}'`);
  const hostIsHome=fx1.home_id===U.h;
  await tab(H,'home');$(H,'.lg-hero [data-lg="play"]').click();
  await until(()=>H.eval('LG.match&&LG.match.phase==="pen"&&typeof LG.penPick==="function"'),'the recording stops at the penalty and asks');
  assert.ok($(H,'#penGame'),'the penalty picture is open over the league');
  const pen0=JSON.parse(H.eval('JSON.stringify(LG.match.res.pen)'));
  $(H,'#penGame .pg-dirs [data-dir="UL"]').click();
  // every later penalty of that match is answered the same way: one left to the picture's own clock takes ten seconds of shown frames,
  // which on a loaded build server is longer than this suite waits (it timed out there once, when the match happened to hold a second one)
  const nextOrEnd=()=>H.eval('LG.match&&(LG.match.phase==="end"&&LG.match.result||LG.match.phase==="pen"&&typeof LG.penPick==="function")');
  await until(nextOrEnd,'full time or the next penalty',40000);
  for(let i=0;i<10&&H.eval('LG.match.phase')==='pen';i++){H.eval('LG.penPick("UL")');await sleep(30);await until(nextOrEnd,'the penalty after it',40000)}
  await until(()=>H.eval('LG.match&&LG.match.phase==="end"&&LG.match.result'),'full time',40000);
  assert.equal(H.eval('LG.match.result'),'waiting','one answer is not a result');
  const penRow=(await sqlOne(`select pens from public.lg_fixtures where id='${fx1.id}'`)).pens;
  assert.ok(penRow.length>=1&&penRow.every(p=>p.done),'every penalty was settled');
  assert.equal(penRow[0][pen0.side===(hostIsHome?'h':'a')?'k':'d'],'UL','his choice is the one the server kept');
  assert.equal(penRow[0][pen0.side===(hostIsHome?'h':'a')?'ad':'ak'],true,'and the absent manager\'s part was drawn by the server, not by anybody\'s phone');
  assert.ok(Number.isInteger(penRow[0].n),'with a number of the server\'s own for the kick itself');
  const recH=JSON.parse(H.eval('JSON.stringify({gh:LG.match.rec.gh,ga:LG.match.rec.ga,d:LG.match.rec.digest,n:LG.match.rec.ev.length})'));
  assert.match(B(H).textContent,/התוצאה נשמרה/);
  assert.equal((await sqlOne(`select played_at from public.lg_fixtures where id='${fx1.id}'`)).played_at,null);
  $(H,'[data-lg="match-back"]').click();await until(()=>$(H,'.lg-hero')&&/שיחקת את המשחק/.test($(H,'.lg-hero').textContent),'back on the board, which knows he has played');
  // the guest opens it hours later: the same match, no questions asked, and now it counts
  $(Gs,'.lg-hero [data-lg="play"]').click();
  await until(()=>Gs.eval('LG.match&&LG.match.phase==="end"&&LG.match.result'),'the guest watches the same match',40000);
  const recG=JSON.parse(Gs.eval('JSON.stringify({gh:LG.match.rec.gh,ga:LG.match.rec.ga,d:LG.match.rec.digest,n:LG.match.rec.ev.length})'));
  assert.deepEqual(recG,recH,'two phones, one match');
  assert.equal(Gs.eval('LG.match.result'),'final');
  assert.equal($(Gs,'#penGame'),null,'a penalty already settled is not asked again');
  const f1=await sqlOne(`select home_goals, away_goals, played_at from public.lg_fixtures where id='${fx1.id}'`);
  assert.ok(f1.played_at&&f1.home_goals===recH.gh&&f1.away_goals===recH.ga,'the table has the match both phones saw');
  $(Gs,'[data-lg="match-back"]').click();await until(()=>$(Gs,'.lg-table'),'board');
  assert.equal((await sqlOne(`select round from public.lg_leagues where id='${lid}'`)).round,2,'the evening is over when its matches are');
  const paid=(await db.query(`select owner_id, amount from public.lg_ledger where reason='result'`)).rows.map(r=>Number(r.amount)).sort((x,y)=>x-y);
  assert.deepEqual(paid,recH.gh===recH.ga?[1000000,1000000]:[300000,2500000],'win, draw and defeat pay what the rules say');

  // ---- a trade between the two ----
  await H.eval('lgReload()');await tab(H,'trades');
  $(H,'[data-lg="offer-to"]').click();await until(()=>$(H,'[data-lg="offer-want"]'),'the other squad is on the table');
  const want=$(H,'[data-lg="offer-want"]').dataset.v,give=$(H,'[data-lg="offer-give"]').dataset.v;
  $(H,'[data-lg="offer-want"]').click();$(H,'[data-lg="offer-give"]').click();
  const cashIn=$(H,'#lg-cashin');cashIn.value='0.5';cashIn.dispatchEvent(new H.Event('input',{bubbles:true}));
  $(H,'[data-lg="offer-send"]').click();await until(()=>/ההצעה נשלחה/.test(S(H)),'sent');
  await Gs.eval('lgReload()');
  assert.ok($(Gs,'.lg-dot'),'the tab says an offer is waiting');
  await tab(Gs,'trades');$(Gs,'[data-lg="offer-yes"]').click();await until(()=>/העסקה בוצעה/.test(S(Gs)),'done');
  assert.equal((await sqlOne(`select owner_id from public.lg_squads where player='${want.replace(/'/g,"''")}'`)).owner_id,U.h,'both sides moved');
  assert.equal((await sqlOne(`select owner_id from public.lg_squads where player='${give.replace(/'/g,"''")}'`)).owner_id,U.b);
  for(const u of [U.h,U.b]){const r=await sqlOne(`select m.money, (select sum(amount) from public.lg_ledger l where l.league_id=m.league_id and l.owner_id=m.owner_id) led from public.lg_members m where m.owner_id='${u}'`);assert.equal(Number(r.money),Number(r.led),'the ledger is the balance')}

  // ---- evening two: both at the match, the penalty is a duel ----
  const fx2=await sqlOne(`select id, home_id from public.lg_fixtures where league_id='${lid}' and round=2`);
  const lock2=(await client(fx2.home_id).rpc('lg_fixture_lock',{p_fixture:fx2.id,p_sim:H.eval('lgSimId()')})).data;
  assert.ok(lock2.lock.home.squad.some(x=>x.p===want||x.p===give)||lock2.lock.away.squad.some(x=>x.p===want||x.p===give),'the lock is the squads as they are now, the trade included');
  const seed2=H.eval(`(()=>{const lock=${JSON.stringify(lock2.lock)};for(let s=5000;s<9000;s++){const r=lgSimulate({seed:s,lock,pens:[]});if(r.state==='pen')return s}return 0})()`);
  await db.exec(`update public.lg_fixtures set seed=${seed2} where id='${fx2.id}'`);
  await H.eval('lgReload()');await Gs.eval('lgReload()');await tab(H,'home');await tab(Gs,'home');
  $(Gs,'.lg-hero [data-lg="play"]').click();$(H,'.lg-hero [data-lg="play"]').click();
  await until(()=>H.eval('LG.match&&LG.match.phase==="pen"&&typeof LG.penPick==="function"')&&Gs.eval('LG.match&&LG.match.phase==="pen"&&typeof LG.penPick==="function"'),'both stand over the same penalty');
  const p2=JSON.parse(H.eval('JSON.stringify(LG.match.res.pen)')),hKicks=p2.side===(fx2.home_id===U.h?'h':'a');
  assert.deepEqual(JSON.parse(Gs.eval('JSON.stringify(LG.match.res.pen)')),p2,'the same penalty, the same minute, the same taker');
  assert.match($(H,'#penGame .pc-turn').textContent,hKicks?/לאן לבעוט/:/לאן לזנק/);
  assert.match($(Gs,'#penGame .pc-turn').textContent,hKicks?/לאן לזנק/:/לאן לבעוט/);
  // the first choice does not come back alone
  (hKicks?H:Gs).eval('LG.penPick("DR")');
  await until(async()=>{const p=(await sqlOne(`select pens from public.lg_fixtures where id='${fx2.id}'`)).pens;return p.length===1&&p[0].k==='DR'&&!p[0].done},'the kick is with the server, and waits');
  const peek=(await client(hKicks?U.b:U.h).rpc('lg_fixture_state',{p_fixture:fx2.id})).data;
  assert.ok(peek.pens[0]&&!peek.pens[0].done&&peek.pens[0].k===undefined,'the keeper is not shown where the ball is going');
  (hKicks?Gs:H).eval('LG.penPick("DR")');
  await until(()=>H.eval('LG.match&&LG.match.phase==="end"&&LG.match.result')&&Gs.eval('LG.match&&LG.match.phase==="end"&&LG.match.result'),'full time on both phones',60000);
  const a2=JSON.parse(H.eval('JSON.stringify({gh:LG.match.rec.gh,ga:LG.match.rec.ga,d:LG.match.rec.digest,p:LG.match.rec.pens[0]})')),b2=JSON.parse(Gs.eval('JSON.stringify({gh:LG.match.rec.gh,ga:LG.match.rec.ga,d:LG.match.rec.digest,p:LG.match.rec.pens[0]})'));
  assert.deepEqual(a2,b2,'both saw the same kick and the same match');
  assert.equal(a2.p.kd,'DR');assert.equal(a2.p.gd,'DR');assert.ok(!a2.p.autoK&&!a2.p.autoD,'both choices were the managers\' own');
  await until(()=>H.eval('LG.match.result')==='final'||Gs.eval('LG.match.result')==='final','the match counts the moment the second answer arrives');
  assert.ok((await sqlOne(`select played_at from public.lg_fixtures where id='${fx2.id}'`)).played_at);

  // ---- the season's end ----
  $(H,'[data-lg="match-back"]').click();$(Gs,'[data-lg="match-back"]').click();
  await until(()=>$(H,'.lg-champ')&&$(Gs,'.lg-champ'),'the champion');
  const top=await sqlOne(`select owner_id from goalasso_private.lg_standings('${lid}',1) where pos=1`);
  assert.match($(H,'.lg-champ h3').textContent,top.owner_id===U.h?/הפועל הצפון/:/מכבי הגבעה/);
  assert.equal(Number((await sqlOne(`select sum(amount) s from public.lg_ledger where reason='prize'`)).s),36000000,'20M and 16M, paid once');
  assert.equal($(Gs,'[data-lg="next-season"]'),null,'only the host opens the next season');
  // a played match can be watched again, and is the match that counted
  $(H,'.lg-all summary').click();$(H,'.lg-fx [data-lg="play"]').click();
  await until(()=>H.eval('LG.match&&LG.match.phase==="end"'),'the replay');
  assert.equal(H.eval('LG.match.result'),'final');$(H,'[data-lg="match-back"]').click();
  await until(()=>$(H,'[data-lg="next-season"]'),'board');
  $(H,'[data-lg="next-season"]').click();
  await until(()=>$(H,'.lg-hero [data-lg="play"]')&&/עונה 2/.test($(H,'#lg-sub').textContent),'season two');
  assert.equal(Number((await sqlOne(`select count(*)::int n from public.lg_fixtures where league_id='${lid}' and season=2`)).n),2);
  assert.ok(H.eval(`lgPlayer(${JSON.stringify(young.key)})`)===null||H.eval(`lgT(${JSON.stringify(young.key)})`)===trained,'what a player learned stays with him');

  // ---- an evening nobody comes to, and a manager who lies ----
  $(H,'[data-lg="close-round"]').click();$(H,'[data-lg="close-round"]').click();
  await until(()=>/המחזור נסגר/.test(S(H)),'closed');
  const z=await sqlOne(`select home_goals, away_goals from public.lg_fixtures where league_id='${lid}' and season=2 and round=1`);
  assert.deepEqual([z.home_goals,z.away_goals],[0,0],'a match nobody played is a goalless draw');
  const fx4=await sqlOne(`select id from public.lg_fixtures where league_id='${lid}' and season=2 and round=2`);
  await client(U.b).rpc('lg_fixture_lock',{p_fixture:fx4.id,p_sim:H.eval('lgSimId()')});
  // settle any penalty of that match for the guest, then let him claim a score his phone never produced
  const lied=await (async()=>{for(let i=0;i<8;i++){const r=await client(U.b).rpc('lg_result',{p_fixture:fx4.id,p_home:9,p_away:9,p_digest:'made-up-result'});if(!r.error)return r.data;if(r.error.message!=='penalty_open')throw new Error(r.error.message)}return null})();
  assert.equal(lied.state,'waiting');
  await H.eval('lgReload()');$(H,'.lg-hero [data-lg="play"]').click();
  await until(()=>H.eval('LG.match&&(LG.match.phase==="end"&&LG.match.result||LG.match.phase==="pen"&&typeof LG.penPick==="function")'),'the honest phone plays the match');
  for(let i=0;i<8&&H.eval('LG.match.phase')==='pen';i++){H.eval('LG.penPick("U")');await until(()=>H.eval('LG.match.phase!=="pen"||typeof LG.penPick==="function"'),'next');await sleep(30)}
  await until(()=>H.eval('LG.match.phase==="end"&&LG.match.result'),'full time',40000);
  assert.equal(H.eval('LG.match.result'),'conflict','two answers that differ are both thrown away');
  assert.match(B(H).textContent,/המשחק בוטל/);
  const f4=await sqlOne(`select played_at, lock from public.lg_fixtures where id='${fx4.id}'`);
  assert.ok(!f4.played_at&&f4.lock===null,'and the match is dealt again: a lie wins nothing');
  H.close();Gs.close();
 }catch(e){const at=/league-season\.test\.js:(\d+)/.exec(e.stack||'');errors.push((at?'line '+at[1]+': ':'')+e.message)}
 await db.close();
 console.log('league season: two managers, the real server code, one whole season; errors',errors);
 process.exit(errors.length?1:0);
})();
