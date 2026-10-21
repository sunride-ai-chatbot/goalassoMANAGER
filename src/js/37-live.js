/* ====================== LIVE MATCH (30s, subs, half-time) ====================== */
function playInstant(){const M=advanceWeek();if(M){M.live=false;runInstant(M);if(M.ctx.kind!=='league'&&M.gh===M.ga&&(M.ctx.kind==='cup'||M.ctx.stage==='F'))decidePens(M);const h=club(M.h),a=club(M.a);afterMyMatch(M);toast(`${h.short} ${M.gh}:${M.ga} ${a.short}`);if(isBigMatch(M)&&pressMode()!=='off'){render();return runPress('post',M,()=>render())}}render()}
let liveTimer=null;
function ensureNumbers(c){if(!c||!c.players)return;const used=new Set(c.players.filter(p=>p.no).map(p=>p.no));const order={GK:0,DF:1,MF:2,FW:3};const ps=c.players.filter(p=>!p.no).sort((x,y)=>(order[x.pos]-order[y.pos])||(y.ovr-x.ovr));let n=1;for(const p of ps){if(p.pos==='GK'&&!used.has(1)){p.no=1;used.add(1);continue}while(used.has(n)||n===1)n++;p.no=n;used.add(n)}}
function xiListHTML(M,c){return xiPlayers(M,c).map(({p,e})=>`<span><span>${p.no||''} ${esc(p.last||p.first)}${e.slot&&e.slot!==p.pos?' <small class="muted">('+e.slot+')</small>':''}</span><b>${p.ovr}</b></span>`).join('')}
function startLive(restored){
  try{localStorage.setItem('ilm2_livefl',String(G.slot||curSlot()))}catch(e){}
  const M=restored||advanceWeek();if(!M){try{localStorage.removeItem('ilm2_livefl')}catch(e){}render();return}
  save();const h=club(M.h),a=club(M.a);ensureNumbers(h);ensureNumbers(a);
  const ml=motionLevel();const base=(G.speed||90);
  $('nav').classList.add('hide');
  $('main').innerHTML=`<div class="view live-view">
  <div class="live-wrap"><div class="live-main">
  <div class="bug"><div class="bt h" style="--c:${h.c1};--c2:${h.c2||h.c1}"><i></i><b>${esc(h.name)}</b></div><div class="bs num"><span id="gh">0</span><span class="muted">:</span><span id="ga">0</span></div><div class="bt a" style="--c:${a.c1};--c2:${a.c2||a.c1}"><b>${esc(a.name)}</b><i></i></div>
    <div class="bc"><span class="clock num" id="clock">${fm(0)}</span><span class="tag live" id="livePill">LIVE</span><span class="lbl">${esc(M.ctx.label)}${M.ctx.neutral?' · מגרש ניטרלי':' · '+esc(h.stadium)}${M.att?` · ${M.att.toLocaleString('he')} צופים`:''}${derbyLabel(h.id,a.id)?' · '+esc(derbyLabel(h.id,a.id)):''}</span></div></div>
  <div class="progress"><i id="prog" style="width:0%"></i></div>
  ${ml==='off'?'':pitch2dHTML(h,a,M.att&&h.cap?M.att/h.cap:(M.ctx.kind==='friendly'?.3:.85))}
  <div class="xistrip" id="xiStrip"></div></div>
  <aside class="live-side"><div class="row between"><h3 class="sec">ניהול משחק</h3><span class="muted tiny num">${esc(me().formation||'4-3-3')}</span></div>
    <div class="minif" id="miniF"></div>
    <button class="lbtn primary" id="ctrlBtn">השהה</button>
    <button class="lbtn" id="subBtn"><span>חילופים</span><span class="num"><span id="subCount">0</span>/${MAX_SUBS}</span></button>
    <div class="livemt"><button data-lm="def">הגנתי</button><button data-lm="bal">מאוזן</button><button data-lm="att">התקפי</button></div>
    <div class="livectl"><div class="spd"><button data-spx="1" class="on">×1</button><button data-spx="2">×2</button><button data-spx="4">×4</button></div>
    <button class="ic ${G.sound===false?'':'on'}" id="muteBtn" title="צליל" aria-label="צליל">${G.sound===false?'🔇':'🔊'}</button>${ml==='off'?'':`<button class="ic" id="pathBtn" title="הצג מסלולי כדור">מסלולים</button><button class="ic ${G.replay===false?'':'on'}" id="rpBtn" title="שידור חוזר אחרי שער">חוזר</button>`}</div>
  </aside></div>
  <div class="live-lower"><div class="card" id="statsCard" style="--hc:${matchColors(h,a).h.fill};--ac:${matchColors(h,a).a.fill}"><div id="stats"></div></div>
  <div class="card"><div class="ticker" id="ticker"><div class="muted">${ml==='off'?'שריקת פתיחה':'הקבוצות בדרך למגרש'}</div></div></div></div></div>`;
  const tick=$('ticker');let paused=true,shown=0,mult=1;const p2d=ml==='off'?null:initPitch2d(M,h,a);if(p2d&&ml==='low'){p2d.snap=true;p2d.entrance=false;p2d.entranceDone=true;for(const d of [...p2d.h,...p2d.a]){d.x=d.bx;d.y=d.by}}let raf=null,running=true;const frame=()=>{if(!p2d||!p2d.ballEl.isConnected){running=false;raf=null;return}pitchFrame(p2d);raf=running?requestAnimationFrame(frame):null};
  if(p2d){p2d.onTap=(pid,team)=>{p2d.labels[pid]=performance.now()+2200;if(team===G.me&&!M.done&&M.subs[G.me]<MAX_SUBS){pause();openSubModal(pid)}}}
  M.liveMent=M.liveMent||{};M.liveMent[G.me]=M.liveMent[G.me]||me().mentality||'bal';const paintLM=()=>document.querySelectorAll('[data-lm]').forEach(b=>b.classList.toggle('on',b.dataset.lm===M.liveMent[G.me]));paintLM();
  document.querySelectorAll('[data-lm]').forEach(b=>b.onclick=()=>{M.liveMent[G.me]=b.dataset.lm;M.tadjDirty=true;save();paintLM();addLine('note',`${fm(M.m)} שינוי מנטליות: ${{def:'הגנתי',bal:'מאוזן',att:'התקפי'}[b.dataset.lm]}`)});
  const addLine=(cls,txt)=>{const prev=tick.querySelector('.latest');if(prev)prev.classList.remove('latest');const d=document.createElement('div');d.className=cls+' latest';d.textContent=txt;tick.appendChild(d);tick.scrollTop=tick.scrollHeight};
  let replayQ=null;let restoring=!!restored;
  const myC=me();const homeMe=M.h===G.me;
  const drawSide=()=>{const xs=xiPlayers(M,myC);const lay=slotLayout(myC.formation||'4-3-3');
    const chip=({p,e})=>{const en=liveEnergy(M,myC,p,e);const cls=en>=70?'good':en>=50?'warn':'bad';return `<button class="xc" data-xo="${p.id}" aria-label="${esc(fullName(p))}">${playerPortraitHTML(p,myC,'live'+p.id)}<span class="pos ${p.pos}">${POSB[p.pos]}</span><b class="num">${p.ovr}</b><span class="nm">${esc(p.last||p.first)}</span><i class="en ${cls}"><u style="width:${en}%"></u></i>${e.yel?'<em class="yc"></em>':''}</button>`};
    const st=$('xiStrip');if(st)st.innerHTML=xs.map(chip).join('')+`<button class="xc bench" id="benchBtn"><span>ספסל</span><b class="num">${bench(M,myC).length}</b></button>`;
    const mf=$('miniF');if(mf){mf.innerHTML=`<svg viewBox="0 0 68 90"><rect width="68" height="90" rx="3" fill="#1f5a30"/><g fill="none" stroke="rgba(255,255,255,.45)" stroke-width=".5"><rect x="2" y="2" width="64" height="86"/><line x1="2" y1="45" x2="66" y2="45"/><circle cx="34" cy="45" r="7"/><rect x="16" y="2" width="36" height="12"/><rect x="16" y="76" width="36" height="12"/></g>${xs.map(({p,e},i)=>{const li=Math.min(M.xi[myC.id].indexOf(e),lay.length-1);const L=lay[Math.max(0,li)];const x=6+L.x/100*56,y=8+L.y/100*74;const en=liveEnergy(M,myC,p,e);return `<g class="mfp" data-xo="${p.id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="4.2" fill="${myC.c1}" stroke="${en>=70?'#3ddc84':en>=50?'#ffb547':'#ff5c6c'}" stroke-width="1.1"/><text y="1.4" text-anchor="middle" font-size="3.8" fill="${myC.c2&&myC.c2!==myC.c1?myC.c2:'#111'}" font-weight="700">${p.no||''}</text></g>`}).join('')}</svg>`}};
  $('main').querySelector('.live-wrap').addEventListener('click',ev=>{const t=ev.target.closest('[data-xo]');if(t&&!M.done){if(M.subs[G.me]>=MAX_SUBS){toast('נגמרו החילופים');return}pause();openSubModal(+t.dataset.xo);return}if(ev.target.closest('#benchBtn')&&!M.done){pause();openSubModal()}});
  const flush=()=>{
    while(shown<M.ev.length){const e=M.ev[shown++];const who=club(e.team);const mine=e.team===G.me;
      if(!restoring&&(e.t==='goal'||e.t==='pen'||e.t==='own')){if(mine){SFX.goal(true);confetti(1200)}else SFX.groan();if(p2d&&e.path&&(e.t==='goal'||e.t==='pen'))replayQ=e}else if(!restoring&&(e.t==='yellow'||e.t==='red'))SFX.card();
      if(e.quiet)continue;
      if(e.t==='goal')addLine('goal '+(mine?'me':''),`⚽ ${fm(e.m)} שער! ${e.name} (${who.short})${e.asstName?' · בישול: '+e.asstName:''} · ${M.gh}:${M.ga}`);
      else if(e.t==='pen')addLine('goal '+(mine?'me':''),`⚽ ${fm(e.m)} שער מפנדל! ${e.name} (${who.short}) · ${M.gh}:${M.ga}`);
      else if(e.t==='penmiss')addLine('card',`❌ ${fm(e.m)} פנדל ל${who.short}: ${e.name} החמיץ!`);
      else if(e.t==='own')addLine('goal '+(mine?'me':''),`⚽ ${fm(e.m)} שער עצמי של ${e.name} (${club(e.ogteam).short}) · ${M.gh}:${M.ga}`);
      else if(e.t==='yellow')addLine('card',`🟨 ${fm(e.m)} צהוב ל${e.name} (${who.short})`);
      else if(e.t==='red')addLine('card',`🟥 ${fm(e.m)} אדום! ${e.name} (${who.short}) מורחק`);
      else if(e.t==='inj'){addLine('inj',`🩹 ${fm(e.m)} ${e.name} (${who.short}) נפצע${e.injT?' ('+e.injT+')':''}, ${e.weeks} שבועות`);if(!restoring&&mine&&e.needSub){e.needSub=false;pause();openSubModal(null,true)}}
      else if(e.t==='sub'){addLine('sub',`🔁 ${fm(e.m)} ${who.short}: ${e.name} נכנס${e.out?' במקום '+e.out:''}`);if(mine&&e.outPid&&e.outPid===me().captain)addLine('muted',`סרט הקפטן עובר לשחקן הוותיק על המגרש`)}
      else if(e.t==='shot'){if(e.sub==='save')addLine('muted',`🧤 ${fm(e.m)} הצלה גדולה של ${e.name}${e.shooter?' מול '+e.shooter:''}!`);else if(e.sub==='post')addLine('muted',`${fm(e.m)} קורה! ${e.name} (${who.short}) קרוב מאוד`)}
      else if(e.t==='corner')addLine('muted',`${fm(e.m)} קרן ל${who.short}`);
      else if(e.t==='var')addLine(e.ok?'muted':'card',e.ok?`📺 ${fm(e.m)} VAR בודק... השער של ${e.name} אושר`:`📺 ${fm(e.m)} VAR: השער של ${e.name} (${who.short}) נפסל, נבדל`);
      else if(e.t==='note')addLine('note',`🎧 העוזר: ${e.txt}`);
    }
    if(p2d){pitchMinute(p2d,M,h,a,M.ev.filter(e=>e.m===M.m));if(p2d.snap)pitchFrame(p2d)}
    drawSide();
    $('gh').textContent=M.gh;$('ga').textContent=M.ga;$('clock').textContent=fm(M.m);$('prog').style.width=(M.m/90*100)+'%';$('subCount').textContent=M.subs[G.me];
    const tp=M.poss[h.id]+M.poss[a.id]||1;const ph=Math.round(M.poss[h.id]/tp*100);const bar=(l,x,y)=>{const t=x+y||1;return `<div class="mstat"><span class="num">${x}</span><div class="bars"><i class="h" style="width:${x/t*100}%"></i><i class="a" style="width:${y/t*100}%"></i></div><span class="num">${y}</span><span class="muted tiny" style="grid-column:1/-1;text-align:center;margin-top:-4px">${l}</span></div>`};
    $('stats').innerHTML=bar('החזקת כדור %',ph,100-ph)+bar('בעיטות',M.shots[h.id],M.shots[a.id])+bar('למסגרת',(M.sot||{})[h.id]||0,(M.sot||{})[a.id]||0)+bar('קרנות',(M.corners||{})[h.id]||0,(M.corners||{})[a.id]||0)+bar('מסירות',(M.passes||{})[h.id]||0,(M.passes||{})[a.id]||0);
    if(replayQ&&!M.done){const e=replayQ;replayQ=null;const wasPaused=paused;paused=true;playReplay(p2d,e,h,()=>{if(!wasPaused&&!M.done&&$('ctrlBtn').textContent==='השהה')paused=false})}
  };
  const pause=()=>{paused=true;M.paused=true;$('ctrlBtn').textContent=M.awaitingHalf?'מחצית שנייה':'המשך';save()};
  const resume=()=>{paused=false;M.paused=false;M.awaitingHalf=false;$('ctrlBtn').textContent='השהה';save()};
  const finish=()=>{clearInterval(liveTimer);liveTimer=null;running=false;if(raf)cancelAnimationFrame(raf);raf=null;
    if(!M.finishPrepared){
    if(M.gh===M.ga&&(M.ctx.kind==='cup'||M.ctx.stage==='F'))decidePens(M);
    if(M.gh===M.ga&&M.ctx.kind==='euro'&&M.ctx.leg===2){const E=me().euro;if(E&&E.tie&&E.tie.g1&&E.tie.g1[0]+(M.h===G.me?M.gh:M.ga)===E.tie.g1[1]+(M.h===G.me?M.ga:M.gh))decidePens(M)}
    if(p2d)M.heat=p2d.heat;
    SFX.whistleEnd();const myG=M.h===G.me?M.gh:M.ga,opG=M.h===G.me?M.ga:M.gh;const wonIt=myG>opG||(M.pens&&((M.pens==='h')===(M.h===G.me)));if(wonIt&&(M.ctx.kind==='cup'&&M.ctx.stage==='F'||M.ctx.kind==='euro'&&M.ctx.stage==='F'||M.ctx.kind==='toto'&&M.ctx.stage==='F')){SFX.win();confetti(4000);recordMoment('cup',M.ctx.kind==='cup'?'גביע המדינה':M.ctx.kind==='toto'?'גביע הטוטו':(M.ctx.label||'').split('·')[0].trim()||'הגביע האירופי')}
    M.finishPrepared=true;}
    addLine('',`שריקת סיום · ${h.short} ${M.gh}:${M.ga} ${a.short}${M.pens?` · ${(M.pens==='h'?h:a).short} ניצחה בפנדלים`:''}`);
    const mm=M.motmLive||manOfMatch(M,h,a);M.motmLive=mm;if(mm)addLine('goal '+(mm.team===G.me?'me':''),`⭐ שחקן המשחק: ${mm.name} (${mm.short}) · ציון ${mm.r}`);
    save();$('subBtn').disabled=true;$('ctrlBtn').textContent='סיכום המשחק';$('livePill').textContent='סיום';$('livePill').classList.remove('live');$('livePill').classList.add('info');
    $('ctrlBtn').onclick=()=>{afterMyMatch(M);G.view='home';const rec=G.results[G.results.length-1];if(rec&&rec.h===M.h&&rec.a===M.a){matchReportModal(rec,()=>runPress('post',M,()=>render()))}else runPress('post',M,()=>render())};
  };
  const period=()=>Math.round(base*1000/90/mult);
  const startTimer=()=>{if(liveTimer)clearInterval(liveTimer);liveTimer=setInterval(()=>{
    if(paused||(p2d&&p2d.hold))return;
    stepMinute(M);flush();
    if(M.m===62||M.m===76){const my=M.h===G.me?M.gh:M.ga,op=M.h===G.me?M.ga:M.gh;const oppC=M.h===G.me?a:h;const of=avgFit(M,oppC);const tip=my<op?'אנחנו מאחור. שווה לעבור להתקפי ולהכניס חלוץ.':my===op&&of<72?'הם נראים עייפים. אפשר ללחוץ עכשיו.':my>op&&M.m>=76?'מובילים בסיום. מנטליות הגנתית תסגור את המשחק.':null;if(tip)addLine('note',`🎧 העוזר: ${tip}`)}
    if(M.m===45&&!M.half){M.half=true;M.awaitingHalf=true;addLine('muted','מחצית · לחץ "מחצית שנייה" כדי להמשיך');halfTimeTalk(M,tick);pause();$('ctrlBtn').textContent='מחצית שנייה';if(p2d){p2d.flip=true;pitchMinute(p2d,M,h,a,[]);for(const d of [...p2d.h,...p2d.a]){d.tx=52.5;d.ty=74}}}
    if(M.done)finish();else save();
  },period());if(p2d&&!p2d.snap&&!raf)raf=requestAnimationFrame(frame)};
  document.querySelectorAll('[data-spx]').forEach(b=>b.onclick=()=>{mult=+b.dataset.spx;document.querySelectorAll('[data-spx]').forEach(x=>x.classList.toggle('on',x===b));if(liveTimer)startTimer()});
  $('muteBtn').onclick=()=>{G.sound=G.sound===false?true:false;$('muteBtn').textContent=G.sound===false?'🔇':'🔊';$('muteBtn').classList.toggle('on',G.sound!==false);save()};
  const pb=$('pathBtn');if(pb)pb.onclick=()=>{p2d.showPaths=!p2d.showPaths;pb.classList.toggle('on',p2d.showPaths)};
  const rb=$('rpBtn');if(rb)rb.onclick=()=>{G.replay=G.replay===false?true:false;rb.classList.toggle('on',G.replay!==false);save()};
  $('ctrlBtn').onclick=()=>{if(M.done)return;paused?resume():pause()};
  $('subBtn').onclick=()=>{if(M.done)return;pause();openSubModal()};
  drawSide();$('subCount').textContent=M.subs[G.me];
  // pre-match presentation
  const kickoff=()=>{const ov=$('arenaOver');if(ov)ov.innerHTML='';SFX.whistle();tick.innerHTML='<div class="muted">שריקת פתיחה</div>';paused=false;$('ctrlBtn').textContent='השהה';startTimer()};
  const ov=$('arenaOver');
  if(restored){if(p2d){p2d.entrance=false;p2d.entranceDone=true;p2d.flip=M.m>=45}flush();restoring=false;replayQ=null;if(M.awaitingHalf&&!M.halfTalk)halfTimeTalk(M,tick);if(M.done)finish();else{pause();startTimer()}toast('המשחק שוחזר. לחצו המשך כשתהיו מוכנים.')}
  else if(ov&&ml==='full'){ov.innerHTML=`<div class="intro"><div class="comp">${esc(M.ctx.label)}${derbyLabel(h.id,a.id)?' · '+esc(derbyLabel(h.id,a.id)):''}</div><div class="venue">${M.ctx.neutral?'מגרש ניטרלי':esc(h.stadium)}${M.att?` · ${M.att.toLocaleString('he')} צופים`:''}${M.ctx.firstLeg?` · משחק ראשון ${M.ctx.firstLeg[0]}:${M.ctx.firstLeg[1]}`:''}</div>
    <div class="vs"><div class="side" style="--c:${h.c1}"><h4>${kitSVG(h,'sm')} ${esc(h.short)}</h4><div class="xi">${xiListHTML(M,h)}</div></div><div class="vsx">VS</div><div class="side" style="--c:${a.c1}"><h4>${kitSVG(a,'sm')} ${esc(a.short)}</h4><div class="xi">${xiListHTML(M,a)}</div></div></div>
    <button class="btn big" id="kickBtn">שריקת פתיחה ▶</button></div>`;
    if(p2d){raf=requestAnimationFrame(frame);p2d.entranceDone=false;setTimeout(()=>{p2d.entranceDone=true},1800)}
    $('kickBtn').onclick=()=>{if(p2d)p2d.entranceDone=true;kickoff()};
    $('ctrlBtn').textContent='לשריקת הפתיחה';$('ctrlBtn').onclick=()=>{if(M.done)return;if(!liveTimer){kickoff();$('ctrlBtn').onclick=()=>{if(M.done)return;paused?resume():pause()};return}paused?resume():pause()};
  }else{kickoff()}
  function openSubModal(preOut,forced){
    const c=me();if(M.subs[c.id]>=MAX_SUBS){toast('נגמרו החילופים');return}
    const xs=xiPlayers(M,c);const b=bench(M,c);let outId=preOut||null;
    const d=openModal('',e=>{
      const o=e.target.closest('[data-out]');if(o){outId=+o.dataset.out;draw();return}
      const i=e.target.closest('[data-in]');if(i){const inId=+i.dataset.in;if(M.xi[c.id].length>=11&&!outId){toast('בחר קודם מי יוצא');return}
        if(doSub(M,c,outId,inId)){save();closeModal();flush();if(!M.awaitingHalf)resume()}return}
      if(e.target.closest('[data-skip]')){closeModal();if(!M.awaitingHalf)resume()}
    });d.dataset.lock='1';
    function draw(){const need=M.xi[c.id].length<11;
      d.querySelector('.card').innerHTML=`<h3 class="sec">חילוף · ${fm(M.m)}</h3>${need?'<div class="small muted">יש לך פחות מ-11 שחקנים על המגרש, בחר מי נכנס.</div>':'<div class="small muted">בחר מי יוצא ואז מי נכנס.</div>'}
      ${need?'':`<div class="muted tiny" style="margin-top:8px">על המגרש</div><div class="list">${xs.map(({p,e})=>playerRow(p,'',outId===p.id?'sel':'',`${POSHE[p.pos]} · כושר ${p.form>0?'+':''}${p.form.toFixed(1)}${e.yel?' · 🟨':''}${M.m-e.since>60?' · עייף':''}`).replace('data-pid','data-out')).join('')}</div>`}
      <div class="muted tiny" style="margin-top:8px">ספסל</div><div class="list">${b.map(p=>playerRow(p,'','',`${POSHE[p.pos]} · ${p.age}`).replace('data-pid','data-in')).join('')||'<div class="muted small">אין שחקנים זמינים</div>'}</div>
      ${(()=>{const out=[...M.used[c.id].map(id=>{const p=c.players.find(x=>x.id===id);return p?`${esc(p.last||p.first)} (הוחלף)`:''}),...M.ev.filter(e=>e.team===c.id&&(e.t==='inj'||e.t==='red')).map(e=>`${esc(e.name)} (${e.t==='inj'?'נפצע':'הורחק'})`),...c.players.filter(p=>(p.inj>0||p.susp>0)&&!M.ev.some(e=>e.pid===p.id&&(e.t==='inj'||e.t==='red'))).map(p=>`${esc(p.last||p.first)} (${p.inj>0?'פצוע':'מורחק'})`)].filter(Boolean);return out.length?`<div class="muted tiny" style="margin-top:8px">לא זמינים: ${out.join(' · ')}</div>`:''})()}
      <div class="muted tiny" style="margin-top:4px">${M.subs[c.id]}/${MAX_SUBS} חילופים נוצלו · שחקן שהוחלף לא חוזר למגרש</div>
      <div class="actions" style="margin-top:10px"><button class="btn sec" data-skip>${need?(M.subs[c.id]>=MAX_SUBS||!b.length?'המשך בחוסר':'המשך בלי חילוף (בחוסר)'):'ביטול'}</button></div>`}
    draw();
  }
}

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&G)save()});
window.addEventListener('pagehide',()=>{if(G)save()});
