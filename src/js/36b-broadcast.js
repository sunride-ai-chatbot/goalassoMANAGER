/* ====================== BROADCAST PACKAGE (presentation only) ======================
   TV graphics for the live match screen. Nothing here touches the simulation: it only reads the match (M) and its events.
   · lower third   a plate for every key event (goal, card, substitution, injury, big save) with the player's face,
                   queued so plates never overlap; a goal or a red card clears minor plates that are still waiting
   · score bug     goal pulse in the scoring club's colour and sent-off markers beside the club name (bcScore)
   · slate         the half-time / full-time board over the pitch: score, scorers, possession, shots, expected goals
   · momentum      the strip under the score bug: who is on top, minute by minute (bcMomentum)
   The layer is #bcLayer inside the arena. With match graphics switched off it is a flat strip under the score bug that
   only shows the slates (plates would make the page jump).
   The ticker below the pitch still carries every line as text, so the layer itself is aria-hidden. */
const BC={q:[],cur:null,timer:null,seq:0};
const BC_KIND={goal:['שער','goal',3],pen:['שער מפנדל','goal',3],own:['שער עצמי','own',3],red:['כרטיס אדום','red',2],penmiss:['פנדל הוחמץ','red',2],
  yellow:['כרטיס צהוב','yel',1],sub:['חילוף','sub',1],inj:['פציעה','inj',1],save:['הצלה','save',0],post:['קורה','save',0]};
function bcLayer(){return document.getElementById('bcLayer')}
function bcReset(){clearTimeout(BC.timer);BC.timer=null;BC.q=[];BC.cur=null}
function bcMount(){bcReset();const arena=document.getElementById('arena');
  if(arena){arena.insertAdjacentHTML('beforeend','<div class="bc-layer" id="bcLayer" aria-hidden="true"></div>');return}
  const pr=document.querySelector('.live-main .progress');if(pr)pr.insertAdjacentHTML('afterend','<div class="bc-layer flat" id="bcLayer" aria-hidden="true"></div>')}
function bcPlayer(cid,pid,name){const c=club(cid);if(!c)return null;return c.players.find(p=>p.id===pid)||(name?c.players.find(p=>fullName(p)===name):null)||null}
/* the plate for one event: {cls,pri,tag,m,c,p,name,sub} or null when the event gets no graphic */
function bcPlateFor(M,e){const key=e.t==='shot'?e.sub:e.t;const K=BC_KIND[key];if(!K)return null;
  if(key==='save'&&(e.xg||0)<.16)return null;   // only saves from real chances
  const other=id=>id===M.h?M.a:M.h;
  const cid=key==='own'?e.ogteam:key==='save'?other(e.team):e.team;const c=club(cid);if(!c)return null;
  const p=bcPlayer(cid,key==='save'?e.gk:key==='sub'?e.inPid:e.pid,e.name);
  let sub='';
  if(key==='goal'||key==='pen'){const mine=M.ev.filter(x=>(x.t==='goal'||x.t==='pen')&&x.team===e.team&&x.pid===e.pid&&M.ev.indexOf(x)<=M.ev.indexOf(e)).length;
    const season=p&&M.ctx.kind!=='friendly'?(p.goals||0)+mine:0;
    const parts=[];if(mine===2)parts.push('צמד');else if(mine>=3)parts.push('שלושער');
    if(season>0)parts.push(`שער <bdi>${season}</bdi> העונה`);if(e.asstName)parts.push('בישול: '+esc(e.asstName));sub=parts.join(' · ')}
  else if(key==='own')sub='לזכות '+esc(club(other(cid))?.short||'');
  else if(key==='red')sub=`נשארים ב-<bdi>${M.xi[cid]?M.xi[cid].length:10}</bdi> שחקנים`;
  else if(key==='penmiss')sub='נשאר '+`<bdi>${M.gh}:${M.ga}</bdi>`;
  else if(key==='sub')sub=e.out?'במקום '+esc(e.out):'נכנס למגרש';
  else if(key==='inj')sub=e.injT?esc(e.injT):'יורד מהמגרש';
  else if(key==='save')sub=e.shooter?'עצר את '+esc(e.shooter):'';
  else if(key==='post')sub='סנטימטרים מהשער';
  else if(key==='yellow')sub=p?esc(POSHE[p.pos]||''):'';
  return {cls:K[1],pri:K[2],tag:K[0],m:e.m,c,p,name:p?fullName(p):(e.name||''),sub,p2:key==='sub'&&e.outPid?bcPlayer(cid,e.outPid,e.out):null}}
function bcPlateHTML(pl){const c=pl.c;const face=pl.p?playerPortraitHTML(pl.p,c,'bc'+(++BC.seq)):`<span class="bc-mono">${esc(String(c.short||c.name||'').slice(0,2))}</span>`;
  /* a substitution shows both players: the one coming on in the club flag (green ring), the one going off at the far end (red ring) */
  const off=pl.p2?`<span class="bc-face off" style="${faceFrameStyle(pl.p2)}">${playerPortraitHTML(pl.p2,c,'bc'+(++BC.seq))}</span>`:'';
  return `<div class="bc-l3 ${pl.cls}${off?' two':''}" style="--c1:${c.c1};--c2:${c.c2&&c.c2!==c.c1?c.c2:inkFor(c.c1)};--ink:${inkFor(c.c1)}"><span class="bc-flag"></span><span class="bc-face" style="${faceFrameStyle(pl.p)}">${face}</span>${off}
    <span class="bc-tx"><span class="bc-top"><b class="bc-tag">${esc(pl.tag)}</b><bdi class="bc-min">${pl.m}'</bdi><span class="bc-club">${esc(c.short||c.name)}</span></span>
    <strong class="bc-name">${esc(pl.name)}</strong>${pl.sub?`<span class="bc-sub">${pl.sub}</span>`:''}</span></div>`}
function bcEvent(M,e){const L=bcLayer();if(!L||!e||e.quiet)return;if(L.classList.contains('flat'))return;   /* match graphics off: the ticker carries the events; only the slates show */
  let pl=null;try{pl=bcPlateFor(M,e)}catch(err){pl=null}if(!pl)return;
  if(pl.pri>=2)BC.q=BC.q.filter(x=>x.pri>=2);
  if(BC.q.length>=3){const i=BC.q.findIndex(x=>x.pri<=pl.pri);if(i<0)return;BC.q.splice(i,1)}
  BC.q.push(pl);if(!BC.cur)bcNext()}
function bcNext(){const L=bcLayer();clearTimeout(BC.timer);BC.timer=null;if(!L){bcReset();return}
  const old=L.querySelector('.bc-l3');if(old)old.remove();
  const pl=BC.q.shift();BC.cur=pl||null;if(!pl)return;
  L.insertAdjacentHTML('beforeend',bcPlateHTML(pl));
  const sp=+(document.querySelector('[data-spx].on')?.dataset.spx||1);
  const hold=Math.max(1300,(pl.pri>=2?3800:2700)/Math.sqrt(sp));
  BC.timer=setTimeout(()=>{const el=bcLayer()?.querySelector('.bc-l3');if(el)el.classList.add('out');BC.timer=setTimeout(bcNext,230)},hold)}
/* score bug: sent-off markers and a pulse on the side that just scored */
function bcScore(M,h,a){const bug=document.querySelector('.live-view .bug');if(!bug)return;
  for(const [c,sel] of [[h,'.bt.h'],[a,'.bt.a']]){const n=Math.min(3,M.ev.filter(e=>e.t==='red'&&e.team===c.id).length);const el=bug.querySelector(sel+' .rc');if(el&&el.dataset.n!==String(n)){el.dataset.n=String(n);el.innerHTML='<em></em>'.repeat(n)}}
  const prev=(bug.dataset.sc||'0:0').split(':').map(Number);const key=M.gh+':'+M.ga;
  if(bug.dataset.sc&&bug.dataset.sc!==key&&(M.gh>prev[0]||M.ga>prev[1])){bug.classList.remove('pulse-h','pulse-a');void bug.offsetWidth;bug.classList.add(M.gh>prev[0]?'pulse-h':'pulse-a')}
  bug.dataset.sc=key}
/* expected goals of a side so far (shots, goals and penalties; an own goal belongs to nobody's xG) */
function bcXG(M,cid){let x=0;for(const e of M.ev)if(e.team===cid&&e.xg!=null&&(e.t==='shot'||e.t==='goal'||e.t==='pen'||e.t==='penmiss'))x+=e.xg;return x}
function bcScorers(M,cid){const by=new Map();
  for(const e of M.ev){if(!(e.t==='goal'||e.t==='pen'||e.t==='own')||e.team!==cid)continue;
    const p=bcPlayer(e.t==='own'?e.ogteam:e.team,e.pid,e.name);const nm=(p?(p.last||p.first):String(e.name||'').split(' ').pop())+(e.t==='own'?' (עצמי)':'');
    if(!by.has(nm))by.set(nm,[]);by.get(nm).push(e.m+"'"+(e.t==='pen'?' פנדל':''))}
  return [...by].map(([nm,ms])=>`<span>${esc(nm)} <bdi>${esc(ms.join(', '))}</bdi></span>`).join('')}
function bcSlateHide(){const L=bcLayer();if(!L)return;const s=L.querySelector('.bc-slate');if(s)s.remove();L.classList.remove('has-slate')}
function bcSlate(M,h,a,kind){const L=bcLayer();if(!L)return;bcSlateHide();bcReset();const o=L.querySelector('.bc-l3');if(o)o.remove();
  const col=matchColors(h,a);const tp=M.poss[h.id]+M.poss[a.id]||1;const ph=Math.round(M.poss[h.id]/tp*100);
  const xh=bcXG(M,h.id),xa=bcXG(M,a.id);const sot=M.sot||{};
  const row=(l,vh,va,nh,na)=>{const t=nh+na;const wh=t?nh/t*100:50;return `<div class="bc-row"><bdi class="v">${vh}</bdi><span class="bc-mid"><span class="l">${l}</span><span class="bc-bars"><i class="h" style="width:${wh.toFixed(1)}%"></i><i class="a" style="width:${(100-wh).toFixed(1)}%"></i></span></span><bdi class="v">${va}</bdi></div>`};
  const mm=kind==='full'?M.motmLive:null;const mp=mm?bcPlayer(mm.team,mm.pid,mm.name):null;
  const title=kind==='half'?'מחצית':M.pens?`סיום · ${esc((M.pens==='h'?h:a).short)} בפנדלים`:'סיום';
  L.classList.add('has-slate');
  L.insertAdjacentHTML('beforeend',`<div class="bc-slate ${kind}" style="--hc:${col.h.fill};--ac:${col.a.fill}">
    <div class="bc-s-head"><strong class="bc-s-team h">${esc(h.short||h.name)}</strong><span class="bc-s-mid"><span class="bc-s-title">${title}</span><span class="bc-s-score"><bdi>${M.gh}</bdi><i></i><bdi>${M.ga}</bdi></span></span><strong class="bc-s-team a">${esc(a.short||a.name)}</strong></div>
    <div class="bc-s-scorers"><div class="h">${bcScorers(M,h.id)}</div><div class="a">${bcScorers(M,a.id)}</div></div>
    <div class="bc-rows">${row('אחזקת כדור',ph+'%',(100-ph)+'%',ph,100-ph)}${row('בעיטות',M.shots[h.id],M.shots[a.id],M.shots[h.id],M.shots[a.id])}${row('למסגרת',sot[h.id]||0,sot[a.id]||0,sot[h.id]||0,sot[a.id]||0)}${row('שערים צפויים',xh.toFixed(2),xa.toFixed(2),xh,xa)}</div>
    ${mm?`<div class="bc-motm"><span class="bc-face sm" style="${faceFrameStyle(mp)}">${mp?playerPortraitHTML(mp,club(mm.team),'bcm'+(++BC.seq)):''}</span><span>שחקן המשחק</span><strong>${esc(mm.name)}</strong><bdi>${esc(String(mm.r))}</bdi></div>`:''}</div>`)}
/* momentum strip under the score bug: one bar per minute, up for the home side and down for the away side. A minute's
   weight is who had the ball plus what happened (shots by their xG, corners, goals), smoothed over three minutes; dots
   mark the goals. Minute 0 is at the right, like the rest of the right-to-left screen. */
function bcMomentum(M,h,a){const el=document.getElementById('bcMom');if(!el)return;const n=Math.min(90,M.m);const v=new Array(92).fill(0);
  for(let i=1;i<=n;i++)if(M.pm&&M.pm[i-1]!=null)v[i]=(M.pm[i-1]?1:-1)*.3;
  const goals=[];
  for(const e of M.ev){if(!(e.m>=1&&e.m<=90))continue;const s=e.team===h.id?1:e.team===a.id?-1:0;if(!s)continue;
    if(e.t==='goal'||e.t==='pen'||e.t==='own'){v[e.m]+=s*1.5;goals.push(`<i class="${s>0?'h':'a'}" style="right:${(e.m/90*100).toFixed(1)}%"></i>`)}
    else if(e.t==='shot'||e.t==='penmiss')v[e.m]+=s*(.5+2*(e.xg||0));else if(e.t==='corner')v[e.m]+=s*.3}
  const col=matchColors(h,a);let bars='';
  for(let i=1;i<=n;i++){const s=clamp((v[i]*.5+v[i-1]*.3+(i>1?v[i-2]:0)*.2)/1.1,-1,1);const hh=Math.max(.5,Math.abs(s)*8.8);
    bars+=`<rect x="${90-i}" y="${s>=0?(10-hh).toFixed(2):10}" width=".74" height="${hh.toFixed(2)}" fill="${s>=0?col.h.fill:col.a.fill}"/>`}
  el.innerHTML=`<svg viewBox="0 0 90 20" preserveAspectRatio="none"><line x1="0" y1="10" x2="90" y2="10" stroke="#ffffff26" stroke-width=".25"/><line x1="45" y1="0" x2="45" y2="20" stroke="#ffffff3d" stroke-width=".3" stroke-dasharray="1.2 1.2"/>${bars}</svg>${goals.join('')}`}
