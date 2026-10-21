/* ====================== SIGNING REVEAL + TROPHY MOMENTS ======================
   Presentation only: these never move money or players. A transaction is recorded (and saved) by the code that
   completed it; the reveal reads that record. Each record has a unique id and a `shown` flag, so a refresh never
   replays it and a record is never created twice.                                                             */
const REVEAL_ASSETS={video:'signing.mp4',webm:'signing.webm',poster:'signing-poster.jpg',cup:'moment-cup.webp',champ:'moment-champ.webp'};
const SIGN_HEAD={perm:'חתום. עכשיו הוא משלנו.',loan:'מצטרף למשימה — בהשאלה',free:'פרק חדש מתחיל כאן'};
const SIGN_KIND={perm:'העברה קבועה',loan:'השאלה',free:'שחקן חופשי'};
function recordSigning(p,c,kind,x){x=x||{};if(!G||!p||!c)return null;G.signings=G.signings||[];
  const id=`tx-${G.season}-${G.wk}-${p.id}-${kind}`;if(G.signings.some(t=>t.id===id))return null;
  try{ensureNumbers(c)}catch(e){}
  const tx={id,kind,pid:p.id,club:c.id,clubName:c.name,season:G.season,seasonLabel:seasonLabel(),wk:G.wk,
    name:fullName(p),pos:p.pos||null,age:p.age!=null?p.age:null,ovr:isKnown(p)?p.ovr:null,no:p.no||null,
    from:x.from||null,fee:x.fee!=null?x.fee:null,inst:x.inst||1,years:kind==='loan'?null:(p.contract||null),buy:x.buy||null,shown:false,t:Date.now()};
  G.signings.push(tx);if(G.signings.length>40)G.signings=G.signings.slice(-40);save();return tx}
function recordMoment(kind,comp){if(!G)return;G.moments=G.moments||[];const id=`m-${kind}-${G.season}-${comp}`;if(G.moments.some(m=>m.id===id))return;
  G.moments.push({id,kind,comp,club:G.me,clubName:me().name,season:seasonLabel(),shown:false});save()}
let revealOpen=false;
function maybeShowQueued(){if(!G||G.live||revealOpen||(typeof splashOpen==='function'&&splashOpen()))return;
  const tx=(G.signings||[]).find(t=>!t.shown);if(tx){tx.shown=true;save();return openReveal(tx)}
  const m=(G.moments||[]).find(t=>!t.shown);if(m){m.shown=true;save();return openMoment(m)}}
function revealReduced(){return (window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)||(G&&G.motion==='off')}
function inkFor(hex){const [r,g,b]=hexRGB(hex);return (r*299+g*587+b*114)/1000>150?'#0b1020':'#ffffff'}
function shirtSVG(c,no,k){const id='rv'+(k||'');return `<svg class="rv-shirt" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="kg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient></defs>${kitInner(c).replace('url(#kg)',`url(#kg${id})`)}${no?`<text x="20" y="${sponsorName(c)?31.5:27.5}" text-anchor="middle" font-size="${sponsorName(c)?8.5:11}" font-weight="800" font-family="Heebo, Arial, sans-serif" fill="${inkFor(c.c1)}" stroke="rgba(0,0,0,.25)" stroke-width=".3">${no}</text>`:''}</svg>`}
function txFacts(tx){const f=[];if(tx.pos)f.push(['עמדה',POSHE[tx.pos]||tx.pos]);if(tx.age!=null)f.push(['גיל',String(tx.age)]);if(tx.ovr!=null)f.push(['דירוג',String(tx.ovr)]);return f}
function txTerms(tx){const t=[];
  if(tx.kind==='perm'){if(tx.from)t.push(`מ<bdi>${esc(tx.from)}</bdi>`);if(tx.fee!=null)t.push(`דמי העברה <bdi dir="ltr">${NIS(tx.fee)}</bdi>${tx.inst>1?` ב-${tx.inst} תשלומים`:''}`);if(tx.years)t.push(`חוזה ל-${tx.years} ${tx.years>1?'עונות':'עונה'}`)}
  else if(tx.kind==='loan'){if(tx.from)t.push(`בהשאלה מ<bdi>${esc(tx.from)}</bdi>`);t.push(`עד סוף עונת <bdi dir="ltr">${esc(tx.seasonLabel)}</bdi>`);if(tx.buy)t.push(`אופציית רכישה <bdi dir="ltr">${NIS(tx.buy)}</bdi>`)}
  else{t.push('ללא דמי העברה');if(tx.years)t.push(`חוזה ל-${tx.years} ${tx.years>1?'עונות':'עונה'}`)}
  return t}
function openReveal(tx){const c=club(tx.club)||me();if(!c)return;closeReveal(true);revealOpen=true;
  const reduced=revealReduced();const root=document.createElement('div');root.id='reveal';root.className='rv'+(reduced?' rv-final':' rv-p0');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',`חתימה: ${tx.name}`);
  root.style.setProperty('--k1',c.c1);root.style.setProperty('--k2',c.c2||'#ffffff');
  const facts=txFacts(tx).map(([l,v])=>`<div class="rv-fact"><small>${l}</small><b>${esc(v)}</b></div>`).join('');const terms=txTerms(tx).map(s=>`<li>${s}</li>`).join('');
  root.innerHTML=`<div class="rv-bg" style="background-image:url(${REVEAL_ASSETS.poster})"></div>
  <div class="rv-stage"><div class="rv-media" style="background-image:url(${REVEAL_ASSETS.poster})"></div><div class="rv-shade"></div>
    ${tx.demo?'<div class="rv-demo">הדגמה · לא בוצעה העברה</div>':''}
    <button class="rv-skip" id="rvSkip" type="button">דלג</button>
    <div class="rv-layer rv-l0"><div class="rv-brand">GOALASSO</div><div class="rv-club"><span class="rv-bar"></span><b>${esc(tx.clubName)}</b><span class="rv-bar"></span></div></div>
    <div class="rv-layer rv-l1"><div class="rv-name">${esc(tx.name)}</div><div class="rv-shirtwrap">${shirtSVG(c,tx.no,'a')}</div></div>
    <div class="rv-layer rv-l2"><div class="rv-kind rv-${tx.kind}">${SIGN_KIND[tx.kind]}</div><div class="rv-facts">${facts}</div><ul class="rv-terms">${terms}</ul></div>
    <div class="rv-layer rv-l3"><div class="rv-official">רשמי</div><div class="rv-head">${SIGN_HEAD[tx.kind]}</div><div class="rv-sub"><bdi>${esc(tx.name)}</bdi> · <bdi>${esc(tx.clubName)}</bdi></div></div>
    <div class="rv-card" id="rvCard" aria-live="polite"><div class="rv-official sm">רשמי</div><div class="rv-cardtop"><div class="rv-shirtwrap sm">${shirtSVG(c,tx.no,'b')}</div><div><div class="rv-cardhead">${SIGN_HEAD[tx.kind]}</div><div class="rv-cardname">${esc(tx.name)}</div><div class="rv-cardclub">${esc(tx.clubName)} · ${SIGN_KIND[tx.kind]}</div></div></div>
      ${facts?`<div class="rv-facts">${facts}</div>`:''}${terms?`<ul class="rv-terms">${terms}</ul>`:''}
      <div class="rv-actions"><button class="btn" id="rvCardBtn" type="button">לכרטיס השחקן</button><button class="btn sec" id="rvLineup" type="button">שבץ בהרכב</button><button class="btn sec" id="rvClose" type="button">סגור</button></div></div>
  </div>`;
  document.body.appendChild(root);document.body.style.overflow='hidden';
  const R={root,tx,raf:0,video:null,mode:reduced?'static':'video',t0:performance.now(),phase:-1,done:reduced,listeners:[]};PX_REVEAL=R;
  const on=(el,ev,fn,o)=>{el.addEventListener(ev,fn,o);R.listeners.push([el,ev,fn,o])};
  const finish=()=>{if(R.done&&root.classList.contains('rv-final'))return;R.done=true;root.className='rv rv-final';if(R.video){try{R.video.pause()}catch(e){}}cancelAnimationFrame(R.raf);setTimeout(()=>{const b=$('rvCardBtn');try{b&&b.focus({preventScroll:true})}catch(e){}},50)};
  R.finish=finish;
  on(root,'click',e=>{const t=e.target;if(t.closest('#rvSkip'))return finish();if(t.closest('#rvClose'))return closeReveal();
    if(t.closest('#rvCardBtn')){const pid=tx.pid,demo=tx.demo;closeReveal();if(me()&&me().players.some(p=>p.id===pid))playerModal(pid);else if(demo)toast('בהדגמה השחקן לא בסגל שלך');return}
    if(t.closest('#rvLineup')){const pid=tx.pid;closeReveal();if(tx.demo)return toast('בהדגמה אין שיבוץ, השחקן לא הצטרף לסגל');const p=me().players.find(x=>x.id===pid);if(!p)return;if(G.phase!=='play')return toast('אפשר לשבץ כשהעונה פעילה');G.view='lineup';const inXI=(me().lineup||[]).includes(pid);lineupSel=(inXI||p.inj||p.susp)?null:{pid};render();toast(inXI?`${tx.name} כבר בהרכב`:p.inj||p.susp?'השחקן לא זמין כרגע':`בחר משבצת בהרכב עבור ${tx.name}`);return}});
  on(document,'keydown',e=>{if(e.key==='Escape'){if(!R.done)finish();else closeReveal()}});
  if(reduced){setTimeout(()=>{const b=$('rvCardBtn');try{b&&b.focus({preventScroll:true})}catch(e){}},50);return}
  // video: created only now (load on demand); the browser HTTP cache keeps it for later signings
  const media=root.querySelector('.rv-media');const v=document.createElement('video');R.video=v;
  v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.preload='auto';v.loop=false;v.poster=REVEAL_ASSETS.poster;v.disablePictureInPicture=true;v.setAttribute('aria-hidden','true');const s1=document.createElement('source');s1.src=REVEAL_ASSETS.video;s1.type='video/mp4';const s2=document.createElement('source');s2.src=REVEAL_ASSETS.webm;s2.type='video/webm';v.appendChild(s1);v.appendChild(s2);media.appendChild(v);
  const toTimer=()=>{if(R.mode!=='video')return;R.mode='timer';R.t0=performance.now()-((v.currentTime||0)*1000);root.classList.add('rv-novideo')};
  on(v,'error',toTimer);on(s2,'error',toTimer);on(v,'ended',finish);on(v,'playing',()=>root.classList.add('rv-playing'));
  try{const pr=v.play();if(pr&&pr.catch)pr.catch(toTimer)}catch(e){toTimer()}
  const stallT=setTimeout(()=>{if(R.mode==='video'&&!(v.currentTime>0))toTimer()},2500);R.listeners.push([{removeEventListener(){clearTimeout(stallT)}},'x',null]);
  const tick=()=>{if(!root.isConnected)return;const t=R.mode==='video'?(v.currentTime||0):(performance.now()-R.t0)/1000;const ph=t<2?0:t<5?1:t<8?2:3;
    if(ph!==R.phase){R.phase=ph;root.classList.remove('rv-p0','rv-p1','rv-p2','rv-p3');root.classList.add('rv-p'+ph)}
    if(t>=10||(R.mode==='video'&&v.ended))return finish();R.raf=requestAnimationFrame(tick)};
  R.raf=requestAnimationFrame(tick)}
let PX_REVEAL=null;
function closeReveal(silent){const R=PX_REVEAL;PX_REVEAL=null;const root=$('reveal');if(R){cancelAnimationFrame(R.raf);for(const [el,ev,fn,o] of R.listeners){try{el.removeEventListener(ev,fn,o)}catch(e){}}R.listeners=[];if(R.video){try{R.video.pause();R.video.querySelectorAll('source').forEach(x=>x.remove());R.video.removeAttribute('src');R.video.load()}catch(e){}R.video.remove();R.video=null}}
  if(root)root.remove();revealOpen=false;document.body.style.overflow='';if(!silent)setTimeout(maybeShowQueued,300)}
/* ---- trophy moments ---- */
const MOMENT_TXT={cup:{btn:'חוגגים עם האוהדים',label:t=>`מחזיקת ${t}`},champ:{btn:'ממשיכים לעשות היסטוריה',label:()=>'עונה בלתי נשכחת'}};
function laurel(side){return `<svg class="ml-laurel ${side}" viewBox="0 0 24 48" aria-hidden="true"><path d="M18 46C8 38 5 24 9 4" fill="none" stroke="currentColor" stroke-width="1.6"/>${[8,15,22,29,36].map((y,i)=>`<ellipse cx="${side==='l'?6+i*.6:6+i*.6}" cy="${y}" rx="4.2" ry="2" transform="rotate(${-40+i*6} ${6+i*.6} ${y})" fill="currentColor"/><ellipse cx="${13+i*.5}" cy="${y+3}" rx="4" ry="1.9" transform="rotate(${35-i*4} ${13+i*.5} ${y+3})" fill="currentColor"/>`).join('')}</svg>`}
function openMoment(m){closeReveal(true);revealOpen=true;const c=club(m.club)||me();const T=MOMENT_TXT[m.kind]||MOMENT_TXT.cup;const img=m.kind==='champ'?REVEAL_ASSETS.champ:REVEAL_ASSETS.cup;
  const root=document.createElement('div');root.id='reveal';root.className='mo';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',m.kind==='champ'?'אליפות':'זכייה בגביע');if(c){root.style.setProperty('--k1',c.c1);root.style.setProperty('--k2',c.c2||'#fff')}
  root.innerHTML=`<div class="rv-bg" style="background-image:url(${img})"></div><div class="mo-card" style="background-image:url(${img})">${m.demo?'<div class="rv-demo">הדגמה</div>':''}
   <div class="mo-ui"><div class="mo-plate">${laurel('l')}<div><small>${esc(T.label(m.comp))}</small><b>${esc(m.clubName)}</b><span>${m.kind==='champ'?'אלופת המדינה':esc(m.comp)} · <bdi dir="ltr">${esc(m.season)}</bdi></span></div>${laurel('r')}</div>
   <button class="mo-btn" id="moClose" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>${T.btn}</button></div></div>`;
  document.body.appendChild(root);document.body.style.overflow='hidden';const R={listeners:[],video:null,raf:0};PX_REVEAL=R;
  const fn=e=>{if(e.target.closest('#moClose'))closeReveal()};root.addEventListener('click',fn);R.listeners.push([root,'click',fn]);
  const kf=e=>{if(e.key==='Escape')closeReveal()};document.addEventListener('keydown',kf);R.listeners.push([document,'keydown',kf]);
  if(!revealReduced()){try{confetti(4500);SFX.win()}catch(e){}}setTimeout(()=>{try{$('moClose').focus({preventScroll:true})}catch(e){}},60)}
/* ---- demo previews: real squad/market data, nothing is recorded, charged or moved ---- */
function revealDemo(kind){if(!G)return;const c=me();
  if(kind==='cup'||kind==='champ')return openMoment({id:'demo',kind,comp:kind==='cup'?'גביע המדינה':'ליגת העל',club:c.id,clubName:c.name,season:seasonLabel(),demo:true});
  let p=null,from=null,x={};
  if(kind==='free'){p=(G.freeAgents||[]).slice().sort((a,b)=>b.ovr-a.ovr)[0];if(!p)return toast('אין כרגע שחקנים חופשיים להדגמה');x={}}
  else{const others=G.clubs.filter(o=>o.id!==G.me&&o.league);from=pick(others);p=from.players.slice().sort((a,b)=>b.ovr-a.ovr)[ri(0,5)];x=kind==='perm'?{from:from.short,fee:askingPrice(p)}:{from:from.short}}
  const tx={id:'demo-'+kind,kind,pid:p.id,club:c.id,clubName:c.name,season:G.season,seasonLabel:seasonLabel(),name:fullName(p),pos:p.pos,age:p.age,ovr:p.ovr,no:p.no||null,from:x.from||null,fee:x.fee!=null?x.fee:null,inst:1,years:kind==='loan'?null:(kind==='free'?Math.max(1,contractDemand(p).years):3),buy:null,demo:true};
  openReveal(tx)}

