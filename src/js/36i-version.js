/* ---- which build is running, and is there a newer one --------------------------------------------------------------
   The page carries its build id (a content hash) and the time of the commit it was built from; the server publishes the
   same pair in version.json. A page that stays open for days (a home-screen app resumed from the background never
   reloads by itself) asks for that small file when it comes back to the front and offers the new build in a bar: the
   player decides when, his career is saved first and the address gets the build id so no cache can answer. Hosts
   without version.json simply never show the bar. The visible stamp tells a player (and support) which build he has. */
function buildInfo(){const g=n=>{const m=document.querySelector('meta[name="'+n+'"]');return m?m.content||'':''};return {id:g('goalasso-build'),at:g('goalasso-built')}}
function buildStampHTML(){const b=buildInfo();return b.id?`<span class="buildstamp">גרסה <bdi>${esc(b.at||'')}</bdi> · <bdi dir="ltr">${esc(b.id.slice(0,6))}</bdi></span>`:''}
let updLast=0;
function updateBar(v){if(document.getElementById('updBar'))return;const bar=document.createElement('div');bar.id='updBar';bar.setAttribute('role','status');
  bar.innerHTML=`<span>יש גרסה חדשה של המשחק${v&&v.built?` (<bdi>${esc(v.built)}</bdi>)`:''}. הקריירה נשמרת.</span><button type="button" id="updGo">עדכן עכשיו</button><button type="button" id="updNo" aria-label="לא עכשיו">×</button>`;
  document.body.appendChild(bar);bar.querySelector('#updNo').onclick=()=>bar.remove();
  bar.querySelector('#updGo').onclick=()=>{try{if(typeof Bwrite==='function'&&typeof G!=='undefined'&&G&&G.beginner)Bwrite();else if(typeof save==='function'&&typeof G!=='undefined'&&G)save()}catch(e){}
    setTimeout(()=>{const u=new URL(location.href);u.searchParams.set('v',(v&&v.build)||Date.now());location.replace(u.href)},250)}}
function updateCheck(){if(typeof fetch!=='function'||location.protocol==='file:'||!buildInfo().id)return Promise.resolve(false);const now=Date.now();if(now-updLast<120000)return Promise.resolve(false);updLast=now;
  return fetch(new URL('version.json?t='+now,location.href).href,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(v=>{if(v&&v.build&&v.build!==buildInfo().id){updateBar(v);return true}return false}).catch(()=>false)}
function updateWatch(){updateCheck();document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateCheck()});window.addEventListener('pageshow',()=>updateCheck())}
