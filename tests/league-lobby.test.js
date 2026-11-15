// Shared league, step 2: the lobby and the club's identity. Two jsdom windows share one in-memory fake of the SQL
// functions of supabase/migrations/20261114210000_shared_league.sql. Create → invite → join → name, crest, kit.
// The point of the charging assertions is that the tier is priced by the server: the client sends a tier, never a price.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'ligat-haal-manager.html'),'utf8');
const errors=[];

/* ---- fake backend: the lg_* functions, same rules, in memory ---- */
const DB={leagues:[],members:[],squads:[]};
const BUDGET=120000000;
const crestCost=c=>({free:0,custom:1000000,premium:2000000})[(c&&c.tier)||'free'];
const kitCost=k=>({plain:0,pattern:500000,premium:2000000})[(k&&k.tier)||'plain'];
const league=id=>DB.leagues.find(l=>l.id===id);
const member=(lid,uid)=>DB.members.find(m=>m.league_id===lid&&m.owner===uid);
function rpc(uid,fn,a){
 if(!uid)throw new Error('login_required');
 if(fn==='lg_create'){
  if(!a.p_name||!a.p_name.trim()||a.p_name.trim().length>60)throw new Error('invalid_name');
  if(!a.p_team||!a.p_team.trim()||a.p_team.trim().length>40)throw new Error('invalid_team');
  if(!(a.p_capacity>=2&&a.p_capacity<=8))throw new Error('invalid_capacity');
  const l={id:'L'+(DB.leagues.length+1),invitation:'inv-'+(DB.leagues.length+1),host:uid,name:a.p_name.trim(),capacity:a.p_capacity,budget:BUDGET,season:1,round:0,phase:'build'};
  DB.leagues.push(l);DB.members.push({league_id:l.id,owner:uid,team:a.p_team.trim(),crest:null,kit:null,money:BUDGET,joined:DB.members.length});
  return {id:l.id,invitation:l.invitation}}
 if(fn==='lg_join'){
  const l=DB.leagues.find(x=>x.invitation===a.p_invitation);if(!l)throw new Error('invitation_expired');
  if(!a.p_team||!a.p_team.trim()||a.p_team.trim().length>40)throw new Error('invalid_team');
  const ex=member(l.id,uid);if(ex)return {id:l.id,invitation:l.invitation};
  if(l.phase!=='build')throw new Error('league_started');
  if(DB.members.some(m=>m.league_id===l.id&&m.team===a.p_team.trim()))throw new Error('team_taken');
  if(DB.members.filter(m=>m.league_id===l.id).length>=l.capacity)throw new Error('league_full');
  DB.members.push({league_id:l.id,owner:uid,team:a.p_team.trim(),crest:null,kit:null,money:BUDGET,joined:DB.members.length});
  return {id:l.id,invitation:l.invitation}}
 if(fn==='lg_get'){
  const l=league(a.p_league),m=l&&member(l.id,uid);if(!l||!m)throw new Error('not_a_member');
  return {id:l.id,name:l.name,invitation:l.host===uid?l.invitation:null,host:l.host===uid,capacity:l.capacity,budget:l.budget,season:l.season,round:l.round,phase:l.phase,
   members:DB.members.filter(x=>x.league_id===l.id).sort((x,y)=>x.joined-y.joined).map(x=>({mine:x.owner===uid,host:x.owner===l.host,team:x.team,crest:x.crest,kit:x.kit,money:x.money,squad:DB.squads.filter(s=>s.league_id===l.id&&s.owner===x.owner).length,seen:new Date().toISOString()})),
   squad:[],taken:[]}}
 if(fn==='lg_set_identity'){
  const l=league(a.p_league),m=l&&member(l.id,uid);if(!m)throw new Error('not_a_member');
  let add=0;
  if(a.p_team!=null){if(!a.p_team.trim()||a.p_team.trim().length>40)throw new Error('invalid_team');
   if(DB.members.some(x=>x.league_id===l.id&&x.team===a.p_team.trim()&&x.owner!==uid))throw new Error('team_taken')}
  if(a.p_crest!=null){if(crestCost(a.p_crest)==null)throw new Error('invalid_crest');add+=Math.max(0,crestCost(a.p_crest)-crestCost(m.crest))}
  if(a.p_kit!=null){if(kitCost(a.p_kit)==null)throw new Error('invalid_kit');add+=Math.max(0,kitCost(a.p_kit)-kitCost(m.kit))}
  if(add>m.money)throw new Error('no_money');
  m.money-=add;
  if(a.p_team!=null)m.team=a.p_team.trim();
  if(a.p_crest!=null)m.crest=a.p_crest;
  if(a.p_kit!=null)m.kit=a.p_kit;
  return {team:m.team,crest:m.crest,kit:m.kit,money:m.money,charged:add}}
 if(fn==='lg_preview_invitation'){
  const l=DB.leagues.find(x=>x.invitation===a.p_invitation);if(!l)throw new Error('invitation_expired');
  const n=DB.members.filter(m=>m.league_id===l.id).length;
  return {league:l.name,team:(DB.members.find(m=>m.league_id===l.id&&m.owner===l.host)||{}).team,members:n,capacity:l.capacity,full:n>=l.capacity||l.phase!=='build'}}
 throw new Error('unknown rpc '+fn)}
function fakeClient(uid){return {
 auth:{getSession:async()=>({data:{session:{user:{id:uid}}},error:null}),signInAnonymously:async()=>({data:{session:{user:{id:uid}}},error:null})},
 rpc:async(fn,a)=>{try{return {data:rpc(uid,fn,a),error:null}}catch(e){return {data:null,error:{message:e.message}}}},
 from(){const b={select(){return b},eq(){return b},single:async()=>({data:null,error:null}),then(r){return Promise.resolve({data:[],error:null}).then(r)}};return b},
 channel(){const ch={on(){return ch},subscribe(){return ch}};return ch},removeChannel(){}}}

function openWindow(uid,url){const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(uid+': '+e.message)});
 return new JSDOM(html,{url:url||'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true});const c=fakeClient(uid);w.__lgClientFactory=async()=>c;w.__mpClientFactory=async()=>c;
   w.requestAnimationFrame=cb=>setTimeout(()=>cb(Date.now()),16);w.cancelAnimationFrame=clearTimeout}}).window}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,what,ms=8000){const t=Date.now();while(Date.now()-t<ms){try{const v=fn();if(v)return v}catch(e){}await sleep(25)}throw new Error('timeout: '+what)}
const body=w=>w.document.getElementById('lg-body');
const status=w=>w.document.getElementById('lg-status').textContent;

async function main(){try{
 /* ---- the generator is pure and carries no lettering of its own ---- */
 const P=openWindow('uid-pure');
 await until(()=>P.eval('typeof crestSVG==="function"'),'crest generator loaded');
 const spec={shape:'shield',div:'half',c1:'#c8102e',c2:'#f4f1e8',ink:'#1b1b1f',emblem:'lion',tier:'free'};
 const a=P.eval(`crestSVG(${JSON.stringify(spec)},{id:'x'})`),b=P.eval(`crestSVG(${JSON.stringify(spec)},{id:'x'})`);
 assert.equal(a,b,'the same spec always draws the same crest, so a crest stores as a few fields and not as a file');
 assert.ok(!/<text/.test(a),'a crest with no name carries no lettering');
 const named=P.eval(`crestSVG(${JSON.stringify(spec)},{id:'x',name:'הפועל הצפון'})`);
 assert.ok(named.includes('הפועל הצפון')&&/textLength=/.test(named),'the name is SVG text squeezed to the band, never baked into an image');
 assert.equal(P.eval('CREST_EMBLEMS.length'),10);
 assert.equal(P.eval("crestTierCost('premium')"),2000000,'the client knows the tier prices only to show them; the server charges');
 assert.ok(P.eval("clubKitSVG({tier:'pattern',pattern:'stripes',c1:'#0b3d91',c2:'#fff'},{id:'k'})").includes('clipPath'),'a kit pattern is clipped to the shirt');
 P.close();

 /* ---- host creates a league ---- */
 const H=openWindow('uid-host');
 await until(()=>H.eval('typeof League!=="undefined"'),'league client loaded');
 H.eval('League.open()');
 await until(()=>body(H)&&body(H).querySelector('[data-lg="create"]'),'lobby');
 body(H).querySelector('#lg-name').value='ליגת החברים';
 body(H).querySelector('#lg-team2').value='הפועל הצפון';
 body(H).querySelector('#lg-cap').value='3';
 body(H).querySelector('[data-lg="create"]').click();
 await until(()=>body(H).querySelector('.lg-members'),'board');
 assert.equal(DB.leagues.length,1);
 assert.equal(DB.leagues[0].capacity,3);
 const invitation=DB.leagues[0].invitation;
 assert.ok(body(H).querySelector('#lg-link').value.includes('league='+invitation),'the host gets a link to share');
 assert.ok(body(H).textContent.includes('הפועל הצפון'));
 assert.equal(H.eval(`localStorage.getItem('goalasso.league.id')`),DB.leagues[0].id,'the league is remembered in this browser');

 /* ---- a guest arrives on the link ---- */
 const Gst=openWindow('uid-guest','https://goalasso.test/?league='+invitation);
 await until(()=>body(Gst)&&body(Gst).querySelector('[data-lg="join"]'),'invitation card');
 assert.ok(body(Gst).querySelector('.lg-invite').textContent.includes('ליגת החברים'),'the card says who is inviting before anybody joins');
 body(Gst).querySelector('#lg-team').value='הפועל הצפון';
 body(Gst).querySelector('[data-lg="join"]').click();
 await until(()=>status(Gst).includes('לקח את השם'),'a name somebody in the league already has is refused');
 body(Gst).querySelector('#lg-team').value='מכבי הגבעה';
 body(Gst).querySelector('[data-lg="join"]').click();
 await until(()=>body(Gst).querySelector('.lg-members'),'guest board');
 assert.equal(DB.members.filter(m=>m.league_id===DB.leagues[0].id).length,2);
 assert.equal(Gst.location.search,'','the invitation is cleared from the address once it is used');
 assert.equal(body(Gst).querySelector('#lg-link'),null,'only the host is shown the invitation link');

 /* ---- identity: the tier is charged once, and a step down is not refunded ---- */
 Gst.document.querySelector('[data-lg="identity"]').click();
 await until(()=>body(Gst).querySelector('.lg-preview'),'identity screen');
 assert.ok(body(Gst).querySelectorAll('.lg-opt').length===6,'the free tier offers ready-made crests');
 // one press opens the whole wall of crests at once, each of them once, and a pick is marked
 body(Gst).querySelector('[data-lg="croll"]').click();
 {const all=[...body(Gst).querySelectorAll('.lg-opt')];assert.equal(all.length,72,'every ready-made crest in one press');
  assert.equal(new Set(all.map(b=>b.innerHTML.replace(/id="[^"]*"|url\(#[^)]*\)|href="#[^"]*"/g,''))).size>=70,true,'and no crest twice');
  all[40].click();assert.equal(body(Gst).querySelectorAll('.lg-opt').length,72,'the wall stays open after a pick');
  assert.equal(body(Gst).querySelectorAll('.lg-opt.on').length,1);assert.ok(body(Gst).querySelectorAll('.lg-opt')[40].classList.contains('on'))}
 body(Gst).querySelector('[data-lg="ctier"][data-v="premium"]').click();
 await until(()=>body(Gst).querySelector('.lg-charge').textContent.includes('₪2'),'the price of the step up is shown before it is paid');
 body(Gst).querySelector('[data-lg="cset"][data-k="emblem"][data-v="lion"]').click();
 await until(()=>body(Gst).querySelector('[data-lg="cset"][data-v="lion"]').classList.contains('on'),'emblem chosen');
 body(Gst).querySelector('[data-lg="save"]').click();
 await until(()=>status(Gst).includes('חויבת'),'charged');
 const m=DB.members.find(x=>x.owner==='uid-guest');
 assert.equal(m.money,BUDGET-2000000);
 assert.equal(m.crest.tier,'premium');
 assert.equal(m.crest.emblem,'lion');
 Gst.document.querySelector('[data-lg="identity"]').click();
 await until(()=>body(Gst).querySelector('.lg-preview'),'identity again');
 body(Gst).querySelector('[data-lg="ctier"][data-v="free"]').click();
 await until(()=>body(Gst).querySelector('.lg-charge').textContent.includes('ללא עלות'),'a step down costs nothing');
 body(Gst).querySelector('[data-lg="save"]').click();
 await until(()=>status(Gst)==='נשמר.','saved');
 assert.equal(DB.members.find(x=>x.owner==='uid-guest').money,BUDGET-2000000,'a tier is bought once and a step down is never refunded');

 /* ---- the host sees the guest on the next poll ---- */
 H.eval('League.close();League.open()');
 await until(()=>body(H).querySelector('.lg-members')&&body(H).textContent.includes('מכבי הגבעה'),'the board shows every manager');
 assert.ok(body(H).querySelectorAll('.lg-members li').length===2);
 assert.ok(body(H).querySelector('.lg-members li.is-me').textContent.includes('הפועל הצפון'));
 H.close();Gst.close();
}catch(e){errors.push(e.message+'\n'+e.stack)}
 console.log('errors',errors);
 process.exit(errors.length?1:0)}
main();
