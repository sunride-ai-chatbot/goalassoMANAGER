/* ---- training: a session is done, not chosen (BEGINNER_JS, after bids.js) ----
   Training used to be one tap: a direction for the team was picked once and every round after it moved the players of
   that line a step by itself. Nobody spent a second there. A session is now something the coach does: he presses on the
   picture — a line of the team, or one player — and keeps his finger there for BTRAIN_MS while the ring around it closes
   and turns green; the change is made when the ring is whole and not before (a finger lifted early, or one that slid away
   to scroll, cancels it and nothing happened).
     team   one session between two matches: every player of the line (DF / MF / FW) moves one step
     solo   BTRAIN_SOLO sessions between two matches, one a player: he moves BTRAIN_GAIN steps and his morale rises by 3,
            which is also the one way to lift a reserve who is not getting minutes
   BTRAIN_STEP steps are a rating point, up to the player's potential (the same count the training-camp pack feeds:
   p.bTraining). What was done since the last match is b.tr = {k: season:round, team, solo:[ids]}; a new round is simply a
   new key, so nothing has to be reset and nothing runs while a screen is drawn. b.focus only remembers the last line. */
const BTRAIN_MS=7000,BTRAIN_SOLO=2,BTRAIN_GAIN=2,BTRAIN_STEP=8,BTRAIN_MOOD=70;
const BTRAIN_UNITS=[['DF','הגנה','shield'],['MF','קישור','tactics'],['FW','התקפה','ball']];
let BTRAIN_HOLD=null,BTRAIN_LAST=null;
const BtrainKey=()=>{const b=Bstate();return b.season+':'+b.round};
function BtrainNow(){const t=Bstate().tr;return t&&t.k===BtrainKey()?t:{k:BtrainKey(),team:null,solo:[]}}
function BtrainLeft(){const t=BtrainNow();return {team:t.team?0:1,solo:Math.max(0,BTRAIN_SOLO-t.solo.length)}}
/* What an individual session can still give him: 'rate' — steps toward a rating point; 'mood' — he stands at his ceiling, so only his
   spirits, and only while they are under "good" (BTRAIN_MOOD); '' — nothing. The tile says which, and a session that would give nothing
   cannot be started: seven seconds and one of the round's two sessions were being spent on a player the screen itself called "at his peak". */
const BtrainCapped=p=>p.ovr>=(p.pot||99);
function BtrainUse(p){return !BtrainCapped(p)?'rate':(p.morale??65)<BTRAIN_MOOD?'mood':''}
/* steps for one player; returns the rating points they made */
function BtrainGain(p,n){const was=p.bTraining||0;p.bTraining=was+n;const up=Math.floor(p.bTraining/BTRAIN_STEP)-Math.floor(was/BTRAIN_STEP);if(up<=0||p.ovr>=(p.pot||99))return 0;return BrateUp(p,up)}
function BtrainTeam(unit){const b=Bstate(),c=me(),t=BtrainNow(),u=BTRAIN_UNITS.find(x=>x[0]===unit);if(!b||b.live||b.out||t.team||!u)return null;
  const line=c.players.filter(p=>p.pos===unit),ps=line.filter(p=>!BtrainCapped(p)),cap=line.length-ps.length;if(!ps.length)return null;   /* a line that is all at its ceiling has nothing to train */
  const ups=ps.filter(p=>BtrainGain(p,1)>0);b.tr={k:t.k,team:unit,solo:t.solo.slice()};b.focus=unit;
  BTRAIN_LAST={k:t.k,text:`אימון ${u[1]} הושלם: <bdi>${ps.length}</bdi> שחקנים התקדמו צעד${cap?` (<bdi>${cap}</bdi> כבר בשיא הדירוג שלהם)`:''}.${ups.length?' '+ups.map(p=>`${esc(fullName(p))} עלה לדירוג <bdi>${p.ovr}</bdi>`).join(', ')+'.':''}`};
  try{Bcount('train')}catch(e){}Bwrite();return {n:ps.length,ups}}
function BtrainSolo(pid){const b=Bstate(),c=me(),t=BtrainNow(),p=c.players.find(x=>x.id===pid);if(!b||b.live||b.out||!p||t.solo.includes(pid)||t.solo.length>=BTRAIN_SOLO)return null;
  const use=BtrainUse(p);if(!use)return null;const up=use==='rate'?BtrainGain(p,BTRAIN_GAIN):0,was=p.morale??65;p.morale=clamp(was+3,10,100);b.tr={k:t.k,team:t.team,solo:t.solo.concat(pid)};
  BTRAIN_LAST={k:t.k,text:use==='mood'?`אימון אישי עם ${esc(fullName(p))} הושלם: הוא כבר בשיא הדירוג שלו, אז האימון העלה רק את המורל שלו (עכשיו ${moraleWord(p.morale)}).`:`אימון אישי עם ${esc(fullName(p))} הושלם: ${up?`הדירוג עלה ל־<bdi>${p.ovr}</bdi>`:`<bdi>${BTRAIN_GAIN}</bdi> צעדים קדימה`}${p.morale>was?', והמורל עלה':''}.`};
  try{Bcount('train')}catch(e){}Bwrite();return {p,up}}
/* ---- the screen ---- */
const BtrainRing=()=>'<svg class="btr-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="46"/><circle class="arc" cx="50" cy="50" r="46" pathLength="100"/></svg>';
const BtrainSecs=()=>Math.round((window.__trainMs||BTRAIN_MS)/1000);
function BtrainStepsHTML(p){if(BtrainCapped(p))return '<span class="btr-cap">בשיא הדירוג שלו</span>';const n=(p.bTraining||0)%BTRAIN_STEP;return `<span class="btr-steps" role="img" aria-label="${n} מתוך ${BTRAIN_STEP} צעדים לנקודת הדירוג הבאה">${Array.from({length:BTRAIN_STEP},(_,i)=>`<i${i<n?' class="on"':''}></i>`).join('')}</span>`}
function Btraining(){const b=Bstate(),c=me(),t=BtrainNow(),left=BtrainLeft(),busy=!!b.live,secs=BtrainSecs(),ord={GK:0,DF:1,MF:2,FW:3};
  const later=busy?'אחרי המשחק':'אחרי המשחק הבא',hint=(done,off,what,go)=>done?'<em class="btr-hint ok">בוצע ✓</em>':off?`<em class="btr-hint">${what}</em>`:`<em class="btr-hint">${go||'לחץ והחזק'}</em>`;
  const units=BTRAIN_UNITS.map(([k,name,ic])=>{const line=c.players.filter(p=>p.pos===k),n=line.length,cap=line.filter(BtrainCapped).length,none=n===cap,done=t.team===k,off=busy||none||(!!t.team&&!done);
    return `<button type="button" class="btr-hold btr-unit${done?' done':''}${none&&!done?' capped':''}" data-btrain="team" data-unit="${k}"${done||off?' disabled':''} aria-label="אימון ${name}: ${none?'כל השחקנים בשיא הדירוג שלהם':'לחץ והחזק '+secs+' שניות'}"><span class="btr-pic">${BtrainRing()}<span class="btr-face ic">${Bui(ic)}</span></span><strong>${name}</strong><small><bdi>${n}</bdi> שחקנים${cap&&!none?` · <bdi>${cap}</bdi> בשיא`:''}</small>${hint(done,off,none?'כולם בשיא':later)}</button>`}).join('');
  const players=c.players.slice().sort((x,y)=>(ord[x.pos]-ord[y.pos])||(y.ovr-x.ovr)).map(p=>{const use=BtrainUse(p),done=t.solo.includes(p.id),off=busy||(!done&&(!use||left.solo<=0));
    return `<button type="button" class="btr-hold btr-player${done?' done':''}${!use&&!done?' capped':''}" data-btrain="solo" data-pid="${p.id}"${done||off?' disabled':''} aria-label="אימון אישי עם ${esc(fullName(p))}: ${!use?'בשיא הדירוג שלו, אין מה לשפר':use==='mood'?'בשיא הדירוג שלו, האימון מעלה רק מורל. לחץ והחזק '+secs+' שניות':'לחץ והחזק '+secs+' שניות'}"><span class="btr-pic">${BtrainRing()}<span class="btr-face">${Bportrait(p,c)}</span></span><strong>${esc(p.last||p.first||fullName(p))}</strong><small>${POSHE[p.pos]} · <bdi>${p.ovr}</bdi>${(p.morale??65)<50?' · <span class="bp-mor low">מורל '+moraleWord(p.morale??65)+'</span>':''}</small>${BtrainStepsHTML(p)}${hint(done,off,!use?'אין מה לשפר':later,use==='mood'?'החזק: מעלה רק מורל':'')}</button>`}).join('');
  const dots=(n,of)=>Array.from({length:of},(_,i)=>`<i${i<n?' class="on"':''}></i>`).join('');
  return `${Bheader('אימון','מגרש האימונים',`לוחצים על התמונה ומחזיקים <bdi>${secs}</bdi> שניות, עד שהעיגול נסגר ונצבע בירוק. רק אז האימון נכנס לתוקף.`)}
  ${BTRAIN_LAST&&BTRAIN_LAST.k===t.k?`<p class="btr-result" role="status">${BTRAIN_LAST.text}</p>`:''}
  <section class="bpanel btr-left" aria-label="האימונים שנשארו עד המשחק הבא"><span>${busy?'אי אפשר להתאמן בזמן משחק.':'נשארו לך עד המשחק הבא'}</span><div><b>אימון קבוצתי</b><span class="btr-dots">${dots(left.team,1)}</span></div><div><b>אימונים אישיים</b><span class="btr-dots">${dots(left.solo,BTRAIN_SOLO)}</span></div></section>
  <h2 class="btr-h">אימון קבוצתי</h2><p class="bmuted">כל השחקנים בקו שבחרת מתקדמים צעד אחד. אימון אחד בין משחק למשחק.</p><div class="btr-units">${units}</div>
  <h2 class="btr-h">אימון אישי</h2><p class="bmuted">השחקן מתקדם <bdi>${BTRAIN_GAIN}</bdi> צעדים והמורל שלו עולה. <bdi>${BTRAIN_SOLO}</bdi> אימונים בין משחק למשחק, לכל שחקן אחד.</p><div class="btr-players">${players}</div>
  <section class="bpanel"><h2>מה נותן אימון?</h2><p>כל <bdi>${BTRAIN_STEP}</bdi> צעדים מוסיפים נקודת דירוג לשחקן, עד השיא שהוא יכול להגיע אליו. הנקודות הקטנות מתחת לכל שחקן מראות כמה צעדים הוא כבר עשה.</p><p>שחקן שכתוב עליו "בשיא הדירוג שלו" כבר לא מתקדם. אימון אישי איתו מעלה רק מורל, ולכן הוא פתוח רק כשהמורל שלו נמוך או סביר. כשגם המורל טוב אין מה לשפר, והתמונה שלו נעולה כדי שלא תבזבז עליו אימון.</p></section>`}
/* how many sessions wait: the dot on the home tile */
function BtrainWaiting(){const b=Bstate();if(!b||b.live||b.out)return 0;const l=BtrainLeft(),c=me(),t=BtrainNow();   /* only sessions somebody can still use: a squad at its ceiling is not nagged from the home tile */
  return (l.team&&c.players.some(p=>p.pos!=='GK'&&!BtrainCapped(p))?1:0)+Math.min(l.solo,c.players.filter(p=>!t.solo.includes(p.id)&&BtrainUse(p)).length)}
/* ---- the hold ---- */
function BtrainHoldStart(el,e){if(BTRAIN_HOLD||!el||el.disabled||Btab!=='training')return;const ms=window.__trainMs||BTRAIN_MS,h={el,x:e&&e.clientX,y:e&&e.clientY,id:e&&e.pointerId,kind:el.dataset.btrain,unit:el.dataset.unit,pid:+el.dataset.pid};
  h.t=setTimeout(()=>BtrainHoldDone(h),ms);BTRAIN_HOLD=h;el.style.setProperty('--hold',ms+'ms');el.classList.remove('let-go');el.classList.add('holding');const hint=el.querySelector('.btr-hint');if(hint)hint.textContent='ממשיכים להחזיק…';try{buzz('tap')}catch(_){}}
function BtrainHoldCancel(){const h=BTRAIN_HOLD;if(!h)return;clearTimeout(h.t);BTRAIN_HOLD=null;const el=h.el;el.classList.remove('holding');el.classList.add('let-go');const hint=el.querySelector('.btr-hint');if(hint)hint.textContent='שחררת מוקדם';setTimeout(()=>el.classList.remove('let-go'),700)}
function BtrainHoldDone(h){if(BTRAIN_HOLD!==h)return;BTRAIN_HOLD=null;const el=h.el,r=h.kind==='team'?BtrainTeam(h.unit):BtrainSolo(h.pid);el.classList.remove('holding');
  const redraw=()=>{if(Btab!=='training'||Bstate().live)return;const y=window.scrollY||0;Brender();try{window.scrollTo(0,y)}catch(e){}};if(!r)return redraw();
  el.classList.add('done');el.disabled=true;const hint=el.querySelector('.btr-hint');if(hint){hint.textContent='בוצע ✓';hint.classList.add('ok')}try{buzz('win')}catch(_){}try{SFX&&SFX.tap&&SFX.tap()}catch(_){}
  setTimeout(redraw,window.__trainMs?0:900)}
document.addEventListener('pointerdown',e=>{const el=e.target.closest&&e.target.closest('.btr-hold');if(!el||(e.button!=null&&e.button>0))return;if(e.pointerType==='mouse')e.preventDefault();BtrainHoldStart(el,e)});
document.addEventListener('pointermove',e=>{const h=BTRAIN_HOLD;if(!h||(h.id!=null&&e.pointerId!==h.id)||h.x==null)return;if(Math.hypot(e.clientX-h.x,e.clientY-h.y)>22)BtrainHoldCancel()});   /* the finger went away: to scroll, or off the picture */
for(const n of ['pointerup','pointercancel'])document.addEventListener(n,e=>{const h=BTRAIN_HOLD;if(h&&(h.id==null||e.pointerId==null||e.pointerId===h.id))BtrainHoldCancel()});
document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest('.btr-hold'))e.preventDefault()});   /* a long press must not open a menu over the ring */
document.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){const el=e.target.closest&&e.target.closest('.btr-hold');if(el){e.preventDefault();BtrainHoldStart(el,null)}}});
document.addEventListener('keyup',e=>{if((e.key===' '||e.key==='Enter')&&BTRAIN_HOLD&&BTRAIN_HOLD.id==null)BtrainHoldCancel()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)BtrainHoldCancel()});window.addEventListener('blur',()=>BtrainHoldCancel());
