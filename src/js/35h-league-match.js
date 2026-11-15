/* ===================== SHARED LEAGUE — the match =====================
   What a manager watches is a recording of a match his phone has already played. Opening a fixture locks it on
   the server; lgSimulate (35f) then runs the whole match in a few milliseconds from the server's seed, and this
   file plays the recording back at a watchable pace: a clock, the score, the events as they come.

   A penalty is where the two managers actually meet. The recording stops at the minute it was given, the
   penalty picture opens, and each chooses one of eight directions — where to shoot, or where to dive. The
   choices go to the server and come back only when both are in (lg_pen); the match is run again with the answer
   and the recording carries on. If the other manager is not at the match, his part is taken for him at once.

   At the whistle the phone sends what it got. The result counts when the other phone, which ran the same match,
   sends the same thing. */
const LG_TICK=150,LG_HOLD=1150;
const lgIsGoal=e=>e.t==='goal'||e.t==='pen'||e.t==='own';
function lgMatchStop(){const M=LG.match;if(!M)return;clearTimeout(M.timer);clearTimeout(M.poll);if(M.penOpen){try{penClose()}catch(e){}}LG.match=null}
function lgMatchSim(){const M=LG.match;M.res=lgSimulate({seed:M.fx.seed,lock:M.fx.lock,pens:M.fx.pens||[]});
  if(M.res.state==='bad'){M.phase='broken';return false}
  M.rec=M.res.rec;M.stopAt=M.res.state==='pen'?M.res.pen.m:90;return true}
LG_ACT.play=async(btn,gen)=>{const id=btn.dataset.v;lgMatchStop();LG.view='match';LG.sheet=null;const M=LG.match={id,phase:'load',shown:0,penOpen:false};lgMsg('');lgPaint();
  const fx=await lgRpc('lg_fixture_lock',{p_fixture:id,p_sim:lgSimId()});if(gen!==LG.gen||LG.match!==M)return;
  M.fx=fx;M.replay=!!(fx.played||fx.answered);
  /* a match that was closed without being played has nothing to show but its score */
  if(!fx.lock){M.phase=fx.played?'norep':'broken';lgPaint();return}
  /* a phone built from other engine sources or other player data would play a different match */
  if(fx.lock.sim!==lgSimId()){M.phase=fx.played?'norep':'version';lgPaint();return}
  if(!lgMatchSim()){lgPaint();return}
  /* a recording is only shown if it is the match that counted */
  if(fx.played&&(M.res.state!=='done'||M.rec.gh!==fx.hg||M.rec.ga!==fx.ag)){M.phase='norep';lgPaint();return}
  M.phase='play';lgPaint();lgMatchTick();lgMatchPoll()};
LG_ACT['match-skip']=Object.assign(()=>{const M=LG.match;if(!M||M.phase!=='play')return;M.shown=M.stopAt;clearTimeout(M.timer);lgMatchReach()},{quick:true});
LG_ACT['match-back']=Object.assign(()=>{lgMatchStop();LG.view='home';lgPaint();lgReload().catch(()=>{})},{quick:true});
LG_ACT.reload=Object.assign(()=>{try{location.reload()}catch(e){}},{quick:true});
function lgMatchTick(){const M=LG.match;if(!M||M.phase!=='play')return;clearTimeout(M.timer);
  if(M.shown>=M.stopAt)return lgMatchReach();
  M.timer=setTimeout(()=>{if(LG.match!==M||M.phase!=='play')return;M.shown++;const key=M.rec.ev.some(e=>e.m===M.shown&&(lgIsGoal(e)||e.t==='red'||e.t==='penmiss'));
    lgMatchPaint();if(key){try{buzz('goal')}catch(e){}}
    M.timer=setTimeout(lgMatchTick,key&&!(typeof penQuick==='function'&&penQuick())?LG_HOLD:0)},LG.fast?0:LG_TICK)}
function lgMatchReach(){const M=LG.match;if(!M)return;if(M.res.state==='pen')return lgPenStart();return lgMatchEnd()}
/* "I am here": the other manager's penalty reaches me through this, and so does the news that the match counted */
function lgMatchPoll(){const M=LG.match;if(!M)return;clearTimeout(M.poll);M.poll=setTimeout(async()=>{if(LG.match!==M)return;
  try{const st=await lgRpc('lg_fixture_state',{p_fixture:M.id});if(LG.match!==M)return;
    M.fx.here=st.here;
    if(st.played&&!M.fx.played){M.fx.played=true;M.fx.hg=st.hg;M.fx.ag=st.ag;if(M.phase==='end'){M.result='final';lgPaint()}}
    /* he is standing over a penalty: stop the recording where it is and go to it */
    if(M.phase==='play'&&M.res.state==='pen'&&(st.pens||[]).length>M.res.pen.idx&&M.shown<M.stopAt){M.shown=M.stopAt;clearTimeout(M.timer);lgMatchPaint();lgMatchReach()}
    /* answers that arrived while this phone was away from the picture */
    if(M.phase==='play'&&(st.pens||[]).filter(p=>p.done).length>(M.fx.pens||[]).filter(p=>p.done).length&&!M.penOpen){M.fx.pens=st.pens;const at=M.shown;if(lgMatchSim()){M.shown=Math.min(at,M.stopAt);lgMatchTick()}}
  }catch(e){}
  lgMatchPoll()},M.phase==='pen'?1500:3000)}
async function lgMatchEnd(){const M=LG.match;if(!M||M.phase==='end')return;M.phase='end';M.shown=90;const rec=M.rec;lgPaint();
  if(M.replay){M.result=M.fx.played?'final':'waiting';lgPaint();return}
  try{const r=await lgRpc('lg_result',{p_fixture:M.id,p_home:rec.gh,p_away:rec.ga,p_digest:rec.digest});if(LG.match!==M)return;M.result=r.state;M.replay=true;
    if(r.state==='final'){try{SFX.win&&rec&&((M.fx.mine==='h')===(rec.gh>rec.ga))&&rec.gh!==rec.ga&&SFX.win()}catch(e){}}}
  catch(e){if(LG.match===M){M.result='error';M.error=lgErr(e)}}
  if(LG.match===M)lgPaint()}

/* ---- the picture ---- */
function lgEvHTML(e,rec){const side=e.team,k=rec[side==='h'?'home':'away'].kit,dot=`<i class="ev-dot" style="background:${esc(k.c1)};border-color:${esc(k.c2)}"></i>`;let cls='',txt='';
  if(e.t==='goal'){cls='goal';txt=`<b>שער!</b> <bdi>${esc(e.name)}</bdi>${e.asst?` <small>בישול: <bdi>${esc(e.asst)}</bdi></small>`:''}`}
  else if(e.t==='pen'){cls='goal';txt=`<b>שער בפנדל</b> <bdi>${esc(e.name)}</bdi>`}
  else if(e.t==='own'){cls='goal';txt=`<b>שער עצמי</b> <bdi>${esc(e.name)}</bdi>`}
  else if(e.t==='penmiss'){cls='miss';txt=`<b>פנדל ${e.how==='save'?'נהדף':'הוחמץ'}</b> <bdi>${esc(e.name)}</bdi>`}
  else if(e.t==='yellow'){cls='yel';txt=`כרטיס צהוב · <bdi>${esc(e.name)}</bdi>`}
  else if(e.t==='red'){cls='red';txt=`<b>כרטיס אדום</b> <bdi>${esc(e.name)}</bdi>`}
  else if(e.t==='sub'){cls='sub';txt=`חילוף · <bdi>${esc(e.name)}</bdi> נכנס${e.out?` במקום <bdi>${esc(e.out)}</bdi>`:''}`}
  else if(e.t==='inj'){cls='inj';txt=`פציעה · <bdi>${esc(e.name)}</bdi>`}
  else if(e.t==='var'&&e.ok===false){cls='miss';txt=`שער נפסל בבדיקת וידאו · <bdi>${esc(e.name)}</bdi>`}
  else if(e.t==='shot'&&!e.quiet&&e.sub==='save'){cls='shot';txt=`${e.shooter?'<bdi>'+esc(e.shooter)+'</bdi> בועט, ':''}<bdi>${esc(e.name)}</bdi> מציל`}
  else if(e.t==='shot'&&e.sub==='post'){cls='shot';txt=`קורה! <bdi>${esc(e.name)}</bdi>`}
  else return '';
  return `<li class="lg-ev ${cls} side-${side}"><span class="ev-m"><bdi>${e.m}'</bdi></span>${dot}<span class="ev-t">${txt}</span></li>`}
function lgScoreAt(rec,m){let h=0,a=0;for(const e of rec.ev)if(e.m<=m&&lgIsGoal(e)){if(e.team==='h')h++;else a++}return [h,a]}
function lgStatsHTML(rec){const row=(l,h,a)=>`<tr><td><bdi>${h}</bdi></td><th>${l}</th><td><bdi>${a}</bdi></td></tr>`;
  return `<table class="lg-mstats"><tbody>${row('בעיטות',rec.shots.h,rec.shots.a)}${row('למסגרת',rec.sot.h,rec.sot.a)}${row('החזקה',rec.poss.h+'%',rec.poss.a+'%')}${row('קרנות',rec.corners.h,rec.corners.a)}${rec.xg?row('xG',rec.xg.h.toFixed(2),rec.xg.a.toFixed(2)):''}</tbody></table>`}
function lgRatingsHTML(rec,side){const rows=(rec.ratings&&rec.ratings[side])||[];return `<ul class="lg-ratings">${rows.slice(0,14).map(r=>`<li><span>${esc(r.name)}${r.g?` <i class="r-g" title="שערים">${r.g}</i>`:''}</span><b class="${r.r>=7.5?'hi':r.r<6?'lo':''}"><bdi>${r.r.toFixed(1)}</bdi></b></li>`).join('')}</ul>`}
function lgMatchPaint(){const M=LG.match;if(!M||LG.view!=='match')return;lgChrome();
  if(M.phase==='load'){lgBody('<div class="lg-mload">מכין את המשחק…</div>');return}
  if(M.phase==='version'){lgBody(`<div class="lg-empty"><h3>שני הטלפונים לא על אותה גרסה</h3><p>המשחק הזה ננעל על גרסה אחרת של המשחק מזו שפתוחה כאן, ולכן שני הטלפונים היו מקבלים משחקים שונים. רענן את הדף כדי לקבל את הגרסה העדכנית, ובקש גם מהיריב לרענן.</p><div class="lg-actions"><button type="button" class="btn" data-lg="reload">רענן את הדף</button><button type="button" class="btn sec" data-lg="match-back">חזרה לליגה</button></div></div>`);return}
  if(M.phase==='norep'){const f=(LG.state.fixtures||[]).find(x=>x.id===M.id)||{},h=lgMember(f.home)||{team:'?'},a2=lgMember(f.away)||{team:'?'};
    lgBody(`<div class="lg-empty"><h3>${esc(h.team)} ${scoreSides(M.fx.hg,M.fx.ag)} ${esc(a2.team)}</h3><p>המשחק הזה נסגר בלי הקלטה שאפשר להציג כאן: או שהמארח סגר את המחזור לפני ששוחק, או שהוא שוחק בגרסה אחרת של המשחק.</p><div class="lg-actions"><button type="button" class="btn" data-lg="match-back">חזרה לליגה</button></div></div>`);return}
  if(M.phase==='broken'){lgBody(`<div class="lg-empty"><h3>המשחק הזה לא נפתח</h3><p>הנתונים של המשחק בשרת אינם תואמים למה שהטלפון הזה מחשב. חזור לליגה ונסה שוב.</p><div class="lg-actions"><button type="button" class="btn" data-lg="match-back">חזרה לליגה</button></div></div>`);return}
  const rec=M.rec,fx=M.fx,end=M.phase==='end',[gh,ga]=end?[rec.gh,rec.ga]:lgScoreAt(rec,M.shown);
  const side=(k,cls)=>`<div class="ms-t ${cls}"><span class="ms-crest">${crestSVG((rec[k].crest&&rec[k].crest.shape)?rec[k].crest:Object.assign(crestDefault(lgHashN(rec[k].team)),{tier:'free'}),{name:''})}</span><b>${esc(rec[k].team)}</b>${fx.mine===(k==='home'?'h':'a')?'<small>אתה</small>':''}</div>`;
  const feed=rec.ev.filter(e=>e.m<=M.shown).map(e=>lgEvHTML(e,rec)).filter(Boolean).reverse();
  const head=`<div class="lg-score">${side('home','h')}<div class="ms-mid">${scoreSides(gh,ga,{cls:'ms-sc',label:`${rec.home.team} ${gh}, ${rec.away.team} ${ga}`})}<span class="ms-clock">${end?'סיום':M.shown?`<bdi>${M.shown}'</bdi>`:'שריקת פתיחה'}</span></div>${side('away','a')}</div>
   <div class="ms-bar" aria-hidden="true"><i style="width:${Math.min(100,M.shown/90*100).toFixed(1)}%"></i></div>`;
  if(!end){const sh=k=>rec.ev.filter(e=>e.m<=M.shown&&e.team===k&&(e.t==='shot'||e.t==='goal'||e.t==='pen'||e.t==='penmiss')).length;
    const xi=k=>`<ul class="lg-xi">${rec.xi[k].map(p=>`<li><i class="pos-${p.pos}">${POSHE[p.pos]}</i><bdi>${esc(p.name)}</bdi><b><bdi>${p.ovr}</bdi></b></li>`).join('')}</ul>`;
    lgBody(`${head}<div class="ms-live"><span><bdi>${sh('h')}</bdi></span><em>בעיטות</em><span><bdi>${sh('a')}</bdi></span></div>
    <ul class="lg-feed" aria-live="polite">${feed.slice(0,40).join('')||'<li class="lg-ev quiet"><span class="ev-t">המשחק יצא לדרך.</span></li>'}</ul>
    <details class="lg-card lg-all lg-xis"${feed.length<4?' open':''}><summary>ההרכבים · <bdi dir="ltr">${esc(rec.home.formation)}</bdi> מול <bdi dir="ltr">${esc(rec.away.formation)}</bdi></summary><div class="lg-rat2"><div>${xi('h')}</div><div>${xi('a')}</div></div></details>
    <div class="lg-mfoot">${M.phase==='pen'?'<span>פנדל!</span>':`<button type="button" class="btn sec" data-lg="match-skip">${M.res.state==='pen'?'דלג לרגע הבא':'דלג לסיום'}</button>`}${fx.here?'<span class="ms-here">היריב צופה עכשיו</span>':''}</div>`);return}
  const mineH=fx.mine==='h',won=mineH?rec.gh>rec.ga:rec.ga>rec.gh,drew=rec.gh===rec.ga,st=M.result;
  const verdict=st==='final'?`התוצאה בטבלה. ${won?'ניצחון':drew?'תיקו':'הפסד'}: ${lgCash(won?2.5e6:drew?1e6:3e5)} לקופה.`
    :st==='waiting'?'התוצאה נשמרה. היא תיכנס לטבלה כשהיריב ישחק את המשחק אצלו — הוא יראה בדיוק את אותו משחק — או כשהמארח יסגור את המחזור.'
    :st==='conflict'?'שני הטלפונים קיבלו משחקים שונים, ולכן השרת ביטל את המשחק והוא יוגרל מחדש. ודאו ששניכם על אותה גרסה של המשחק ושחקו שוב.'
    :st==='error'?esc(M.error||''):'שולח את התוצאה…';
  const scorers=k=>rec.ev.filter(e=>lgIsGoal(e)&&e.team===k).map(e=>`<li><bdi>${esc(e.name)}</bdi> <bdi>${e.m}'</bdi>${e.t==='pen'?' <small>פנדל</small>':e.t==='own'?' <small>עצמי</small>':''}</li>`).join('');
  lgBody(`${head}<div class="lg-mend ${st==='conflict'||st==='error'?'bad':won?'won':drew?'':'lost'}"><h3>${st==='conflict'?'המשחק בוטל':won?'ניצחון':drew?'תיקו':'הפסד'}</h3><p>${verdict}</p></div>
   ${scorers('h')||scorers('a')?`<div class="lg-card lg-scorers"><ul>${scorers('h')}</ul><ul>${scorers('a')}</ul></div>`:''}
   <div class="lg-card">${lgStatsHTML(rec)}${rec.motm?`<p class="lg-motm">איש המשחק · <b>${esc(rec.motm.name)}</b> <bdi>${(+rec.motm.r).toFixed(1)}</bdi></p>`:''}</div>
   <div class="lg-card lg-rat2"><div><h4>${esc(rec.home.team)}</h4>${lgRatingsHTML(rec,'h')}</div><div><h4>${esc(rec.away.team)}</h4>${lgRatingsHTML(rec,'a')}</div></div>
   <details class="lg-card lg-all"><summary>מהלך המשחק</summary><ul class="lg-feed">${feed.join('')}</ul></details>
   <button type="button" class="btn big lg-wide" data-lg="match-back">חזרה לליגה</button>`)}

/* ---- the penalty ---- */
/* eight directions over the picture; resolves with the one chosen, or with fallback() when the time is up */
function lgPenAsk(ctx,o){return new Promise(res=>{const {host,st,root}=ctx;const hint=root.querySelector('#pgHint'),tEl=root.querySelector('#pgTime');if(hint)hint.textContent=o.label;
  const turn=document.createElement('div');turn.className='pc-turn';turn.setAttribute('role','status');turn.textContent=o.label;host.appendChild(turn);let done=false,raf=0;const ck=penClock(performance.now());
  const ARW={U:0,UR:45,R:90,DR:135,D:180,DL:225,L:270,UL:315};const pad=document.createElement('div');pad.className='pg-dirs';
  pad.innerHTML=Object.keys(PEN_ARROW).map(d=>`<button type="button" data-dir="${d}" aria-label="${d}"><svg viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(${ARW[d]}deg)"><path d="M12 5l7 8h-4.4v6h-5.2v-6H5z"/></svg></button>`).join('');host.appendChild(pad);
  let aim={remove(){},place(){}};try{aim=penAimPad(host,st,d=>{try{buzz('tap')}catch(e){}fin(d)})}catch(e){}
  const fin=d=>{if(done)return;done=true;cancelAnimationFrame(raf);pad.remove();try{aim.remove()}catch(e){}turn.textContent=o.after;if(tEl)tEl.style.transform='scaleX(0)';if(hint)hint.textContent=o.after;LG.penPick=null;res(d)};LG.penPick=fin;
  pad.addEventListener('click',e=>{const b=e.target.closest('[data-dir]');if(b){try{buzz('tap')}catch(x){}fin(b.dataset.dir)}});
  (function loop(){if(done)return;if(!ctx.alive()){done=true;pad.remove();try{aim.remove()}catch(e){}turn.remove();return res(null)}
    const left=1-ck.tick(performance.now())/(o.ms||12000);if(tEl)tEl.style.transform=`scaleX(${Math.max(0,left).toFixed(3)})`;
    try{aim.place();for(const b of pad.children){const c=PEN_ARROW[b.dataset.dir];const [px,py]=st.toScreen(c[0],c[1]);b.style.transform=`translate(${px.toFixed(1)}px,${py.toFixed(1)}px)`}}catch(e){}
    if(left<=0)return fin(o.fallback());raf=requestAnimationFrame(loop)})()})}
function lgPenStart(){const M=LG.match;if(!M||M.phase==='pen')return;const info=M.res.pen,fx=M.fx,rec=M.rec;M.phase='pen';M.penOpen=true;clearTimeout(M.timer);lgMatchPaint();lgMatchPoll();
  const kicking=info.side===fx.mine,mode=kicking?'kick':'keep';
  const club=k=>({id:k==='h'?'lgh':'lga',name:rec[k==='h'?'home':'away'].team,short:rec[k==='h'?'home':'away'].team,c1:rec[k==='h'?'home':'away'].kit.c1,c2:rec[k==='h'?'home':'away'].kit.c2});
  const T=club(info.side),O=club(info.side==='h'?'a':'h');
  const sideLock=fx.lock[info.side==='h'?'home':'away'],row=(sideLock.squad||[]).map(x=>lgEntry(x.p)).filter(Boolean).find(e=>lgPlayerId(e.key)===info.takerId)||null;
  const tk=row?lgMakePlayer(row,0,0):{id:1,first:info.taker,last:'',pos:'FW',visualId:null};
  const root=penOverlay({title:'פנדל',meta:`דקה <bdi>${info.m}</bdi> · <bdi>${esc(T.name)}</bdi> בועטת`});const pg=PG;
  const alive=()=>PG===pg&&LG.match===M;
  const host=penClear(),view=root.querySelector('#pgView'),bot=root.querySelector('#pgBot');
  host.insertAdjacentHTML('beforeend','<div class="pg-load">השופט מניח את הכדור על הנקודה…</div>');
  bot.innerHTML=`<div class="pg-who">${penFaceHTML(tk,T,'lgpen'+info.idx)}<div><b>${esc(info.taker)}</b><small>בועט עבור ${esc(T.name)} · בשער ${esc(info.keeper||'השוער')}</small></div></div><div class="pg-hint" id="pgHint"></div><div class="pg-timer" aria-hidden="true"><i id="pgTime"></i></div>`;
  const back=()=>{if(LG.match!==M)return;try{penClose()}catch(e){}M.penOpen=false;M.phase='play';lgMatchPaint();lgMatchTick()};
  penMakeStage(view,'kick',{...penKits(T,O,'lgh'),number:9}).then(async st=>{if(!alive()||!host.isConnected){try{st.kind==='2d'&&st.dispose()}catch(e){}return}
    PG.stage=st;const ld=host.querySelector('.pg-load');if(ld)ld.remove();
    const dir=await lgPenAsk({host,st,root,alive},{label:kicking?'לאן לבעוט? משוך באצבע או הקש על חץ':'לאן לזנק? משוך באצבע או הקש על חץ',after:'הבחירה נשלחה. מחכים ליריב…',ms:12000,fallback:()=>pick(LG_DIRS)});
    if(!alive()||!dir)return;
    /* the choice goes to the server and comes back only with the other one beside it */
    let r=null,tries=0;
    while(alive()){try{r=await lgRpc('lg_pen',{p_fixture:M.id,p_idx:info.idx,p_side:info.side,p_dir:tries?null:dir});tries++;if(r&&r.done)break}catch(e){tries++;if(/pen_mismatch|not_in_play|not_your_match/.test(String(e.message||e))||tries>40){lgMsg(lgErr(e));return back()}}
      await new Promise(ok=>setTimeout(ok,LG.fast?5:1200))}
    if(!alive()||!r||!r.done)return;
    const pens=(fx.pens||[]).slice();pens[info.idx]={t:info.side,k:r.k,d:r.d,n:r.n,ak:r.ak,ad:r.ad,done:true};fx.pens=pens;
    if(!lgMatchSim()){try{penClose()}catch(e){}M.penOpen=false;lgPaint();return}
    const shot=M.rec.pens[info.idx];if(!shot)return back();
    host.querySelectorAll('.pc-turn').forEach(x=>x.remove());try{SFX.whistle()}catch(e){}try{buzz('kick')}catch(e){}
    const quick=LG.fast||penQuick();
    st.shoot({x:shot.x,y:shot.y,how:shot.how,dive:shot.gd||'C'},penOnce(()=>{if(!alive())return;try{penCheer(shot.how,kicking)}catch(e){}const fl=penFlash(host,mode,shot.how);
      setTimeout(()=>{try{fl.remove()}catch(e){}back()},quick?0:1500)},quick?0:3400))})}
