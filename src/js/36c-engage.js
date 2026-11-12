/* ====================== AFTER THE MATCH: what waits next week, the envelope ======================
   Three small things that sit between one match and the next. All of them read the real state of the career:
     nextHooks()      why the coming week matters (a derby, the top of the table, a running streak, a player one goal from
                      a round number, an achievement almost done). Shown on the home card and after a live match.
     the envelope     now and then something arrives after a match: a scout's tip, an academy player who jumped, a bonus
                      from the sponsor, a word from the stands. The effect is applied when it is rolled (surpriseRoll) and
                      written to the news; the envelope only reveals it, like the signing reveal does.
     postMatchFlow()  after the report and the press conference of a live match: the envelope if there is one, then the
                      next-week card with one button that leads to the next match. */
const HOOK_TAG={derby:'דרבי',top:'צמרת',six:'שש נקודות',rel:'תחתית',cup:'גביע',euro:'אירופה',under:'אנדרדוג',streak:'רצף',goal:'שחקן',ach:'הישג',board:'הנהלה',back:'חוזר'};
function nextHooks(max){const out=[];if(!G||G.phase!=='play')return out;const c=me();const nm=myNextMatch();const C=carEnsure();
  const add=(k,html)=>{if(!out.some(x=>x.k===k))out.push({k,html})};
  if(nm&&nm.a&&nm.h){const opp=nm.h.id===G.me?nm.a:nm.h;const dl=derbyLabel(nm.h.id,nm.a.id);
    if(dl)add('derby',`${esc(dl)} מול ${esc(opp.name)}, ${nm.neutral?'במגרש ניטרלי':nm.h.id===G.me?'אצלך בבית':'בחוץ'}`);
    if(nm.kind==='league'){const tab=standings();const i=tab.findIndex(x=>x.id===G.me),j=tab.findIndex(x=>x.id===opp.id);
      if(i>=0&&j>=0&&tab[i].P>=3){const pts=tab[i].pts,top=tab[0];
        if(i>0&&(pts+3>top.pts||(pts+3===top.pts&&top.id===opp.id)))add('top','ניצחון יכול להעלות אותך למקום הראשון');
        else if(i===0&&tab[1])add('top',tab[1].id===opp.id?`אתה ראשון, והיריבה היא הרודפת שלך`:`אתה ראשון, <bdi>${pts-tab[1].pts}</bdi> נקודות מעל ${esc(tab[1].short)}`);
        else if(Math.abs(i-j)<=2)add('six',`${esc(opp.short)} במקום <bdi>${j+1}</bdi>, אתה במקום <bdi>${i+1}</bdi>: משחק על שש נקודות`);
        if(i>=tab.length-3&&tab[i].P>=5)add('rel',`מקום <bdi>${i+1}</bdi> מתוך <bdi>${tab.length}</bdi>: כל נקודה חשובה במאבק ההישרדות`)}}
    else if(nm.kind==='cup')add('cup',`${esc(nm.label)}: משחק אחד, המפסידה בחוץ`);
    else if(nm.kind==='toto'&&/גמר/.test(nm.label))add('cup',esc(nm.label));
    else if(nm.kind==='euro')add('euro',`${esc(nm.label)}${nm.firstLeg?` · המשחק הראשון <bdi dir="ltr">${nm.firstLeg[0]}:${nm.firstLeg[1]}</bdi>`:''}`);
    const d=Math.round(strength(opp)-strength(c));if(d>=5&&nm.kind!=='friendly')add('under',`${esc(opp.short)} חזקה ממך ב־<bdi>${d}</bdi> נקודות דירוג: ניצחון כאן נרשם`)}
  if(C.st.w>=2){const best=C.rec.bestW||0;add('streak',C.st.w>=best?`<bdi>${C.st.w}</bdi> ניצחונות רצופים, השיא שלך. המשחק הבא יכול לשבור אותו`:`<bdi>${C.st.w}</bdi> ניצחונות רצופים. השיא שלך: <bdi>${best}</bdi>`)}
  else if(C.st.unb>=5)add('streak',`<bdi>${C.st.unb}</bdi> משחקים בלי הפסד${(C.rec.bestUnb||0)>C.st.unb?`. השיא שלך: <bdi>${C.rec.bestUnb}</bdi>`:''}`);
  const sc=c.players.filter(p=>!p.inj&&!p.susp&&[4,9,14,19,24,29].includes(p.goals||0)).sort((a,b)=>b.goals-a.goals)[0];if(sc)add('goal',`${esc(fullName(sc))} במרחק שער אחד מ־<bdi>${sc.goals+1}</bdi> העונה`);
  const back=c.players.filter(p=>p.inj===1&&(p.injTot||0)>=3).sort(byOvr)[0];if(back)add('back',`${esc(fullName(back))} חוזר מפציעה בשבוע הבא`);
  const near=achNear(1)[0];if(near&&near.left<=2)add('ach',`עוד <bdi>${near.left}</bdi> להישג "${esc(near.he)}"`);
  try{if(G.board&&G.wk>10&&G.board.conf<fireThreshold()+8)add('board',`אמון ההנהלה <bdi>${Math.round(G.board.conf)}</bdi>: תוצאה טובה תוריד את הלחץ`)}catch(e){}
  return out.slice(0,max||3)}
function nextHooksHTML(max){const hs=nextHooks(max);return hs.length?`<ul class="hooks">${hs.map(h=>`<li><span class="tag info">${HOOK_TAG[h.k]||''}</span><span>${h.html}</span></li>`).join('')}</ul>`:''}

/* ---- the next-week card (after a live match) ---- */
function nextUpModal(M,done){const go=view=>{closeModal();if(view&&G&&G.phase==='play')G.view=view;done&&done()};
  if(!G||G.phase!=='play'||!currentEvent())return done&&done();
  const C=carEnsure();const defs=achDefs();const got=C.fresh.map(id=>defs.find(d=>d.id===id)).filter(Boolean);C.fresh=[];
  const nm=myNextMatch();const ev=currentEvent();let head;
  if(nm&&nm.a&&nm.h){const h=nm.h,a=nm.a;const home=h.id===G.me;
    head=`<div class="nx-vs"><div class="nx-t">${kitSVG(h,'lg')}<b>${esc(h.short||h.name)}</b></div><div class="nx-mid"><span>${nm.neutral?'ניטרלי':home?'בית':'חוץ'}</span></div><div class="nx-t">${kitSVG(a,'lg')}<b>${esc(a.short||a.name)}</b></div></div><div class="nx-label">${esc(nm.label)}</div>`}
  else head=`<div class="nx-free"><b>${ev.t==='break'?'פגרת נבחרות':nm?esc(nm.label):'שבוע בלי משחק'}</b><small>${ev.t==='break'?'פצועים מחלימים והצעירים מתאמנים':nm?'ההגרלה תיערך בתחילת השבוע':'שבוע אימונים: זמן לסגל, לשוק ולאקדמיה'}</small></div>`;
  const d=openModal(`<div class="nx"><div class="nx-kick">השבוע הבא</div>${head}${nextHooksHTML(3)}
    ${got.length?`<div class="nx-got"><div class="muted tiny">הישגים חדשים</div><div class="achlist">${got.map(achRowHTML).join('')}</div></div>`:''}
    <div class="actions" style="margin-top:12px"><button class="btn big" id="nxGo">${nm&&nm.a?'למשחק הבא':'המשך'}</button><button class="btn sec" id="nxHome" style="flex:0 0 auto">למסך הבית</button></div></div>`,
    e=>{if(e.target.closest('#nxGo')){if(nm&&nm.a){lineupSel=null;return go('lineup')}return go('home')}if(e.target.closest('#nxHome'))return go('home')});
  d.dataset.lock='1';d.classList.add('nx-modal');if(got.length)buzz('open');save()}
function postMatchFlow(M,done){if(!G||G.blitz||G.phase!=='play'||mpIsOn()||G.live)return done&&done();
  const next=()=>nextUpModal(M,done);const env=G.env&&!G.env.shown?G.env:null;
  if(env){env.shown=true;save();return envelopeOpen(env,next)}
  next()}

/* ---- the envelope ---- */
function envRecord(o){G.envSeq=(G.envSeq||0)+1;G.env={id:G.envSeq,wk:G.wk,s:G.season,shown:false,...o};try{news(`✉️ ${o.from}: ${o.title}${o.fx&&o.fx.length?' ('+o.fx.join(', ').replace(/[⁦-⁩‎]/g,'')+')':''}.`)}catch(e){}return G.env}
/* Rolled once after each competitive match of the user's club. Roughly one match in three brings something; never two
   in a row, and never more than four matches without one. What can arrive depends on what just happened. */
function surpriseRoll(M){if(!G||G.blitz||G.phase!=='play'||mpIsOn()||!M||M.ctx.kind==='friendly')return null;
  const S=G.envS||(G.envS={dry:1});const p=S.dry>=4?1:S.dry<=0?0:.2+S.dry*.1;if(Math.random()>=p){S.dry++;return null}
  const c=me();const meH=M.h===G.me;const gf=meH?M.gh:M.ga,ga=meH?M.ga:M.gh;const win=gf>ga,loss=gf<ga;const opp=club(meH?M.a:M.h);const opts=[];
  const ys=(c.youth||[]).filter(y=>y.pot-y.ovr>=4);
  if(ys.length)opts.push([3,()=>{const y=ys.slice().sort((a,b)=>b.pot-a.pot)[ri(0,Math.min(2,ys.length-1))];const d=ri(2,3);y.ovr=Math.min(y.pot,y.ovr+d);finalize(y);
    return {k:'youth',from:'מנהל האקדמיה',title:`${fullName(y)} קפץ מדרגה`,body:`${POSHE[y.pos]} בן ${y.age}. באימוני השבוע הוא נראה שחקן אחר, והמאמנים מבקשים שתבוא לראות.`,fx:[`דירוג ‎+${d}, עכשיו ${y.ovr}`,`פוטנציאל ${y.pot}`],go:'youth'}}]);
  const tip=surpriseScoutPick(c);if(tip)opts.push([WINDOW(G.wk)?4:2,()=>{const {p:sp,cl}=tip;sp.kn=2;sp.rep=sp.rep||{by:'סקאוט אורח',q:4,wk:G.wk,s:G.season,txt:`${sp.ovr>=effOvrTop(c,sp.pos)?'יכול להיכנס להרכב מיד':'תוספת עומק טובה'}. ${sp.pot-sp.ovr>=6?'יש לו עוד לאן לגדול.':'שחקן בשל.'}`};G.reports=G.reports||[];G.reports.unshift({pid:sp.id,club:cl.id,by:sp.rep.by,wk:G.wk,s:G.season});G.reports=G.reports.slice(0,40);
    return {k:'scout',from:'סקאוט שישב ביציע',title:`שווה לבדוק: ${fullName(sp)}`,body:`${POSHE[sp.pos]} בן ${sp.age} מ${cl.name}. ${sp.rep.txt}`,fx:[`דירוג ${sp.ovr} · פוטנציאל ${sp.pot}`,`שווי ${NIS(marketValue(sp))}`],wpid:sp.id}}]);
  if(win&&c.sponsor)opts.push([2,()=>{const amt=Math.round((c.tier===1?420000:c.tier===2?260000:c.tier===3?160000:70000)*rnd(.8,1.3)/1e4)*1e4;c.money+=amt;addLog(`בונוס ניצחון מ${c.sponsor.name}`,amt);
    return {k:'cash',from:c.sponsor.name,title:'בונוס על הניצחון',body:`נציגי הספונסר ישבו ביציע הכבוד ונהנו מכל רגע. ההעברה כבר בחשבון המועדון.`,fx:[`‎+${NIS(amt)} לקופה`]}}]);
  if(win&&(isDerby(M.h,M.a)||gf-ga>=3||strength(opp)>=strength(c)+4))opts.push([3,()=>{c.fans=clamp((c.fans||50)+2,10,100);c.players.forEach(p=>p.morale=clamp((p.morale??65)+3,10,100));
    return {k:'fans',from:'מכתב מהיציע',title:'האוהדים חיכו לשחקנים בחוץ',body:`מאות נשארו אחרי השריקה ושרו עד שהאוטובוס יצא. בחדר ההלבשה עוד מדברים על זה.`,fx:['אוהדים ‎+2','מורל הסגל ‎+3']}}]);
  const mm=M.motm||M.motmLive;const star=mm&&mm.team===G.me?c.players.find(p=>p.id===mm.pid):null;
  if(star)opts.push([2,()=>{star.form=clamp((star.form||0)+1.2,-4,4);star.morale=clamp((star.morale??65)+6,10,100);
    return {k:'form',from:'המאמן האישי',title:`${fullName(star)} בכושר שיא`,body:`שחקן המשחק ביקש להישאר לאימון נוסף גם למחרת. ככה נראה שחקן שמרגיש שהכול הולך לו.`,fx:['כושר משחק ‎+1.2','מורל ‎+6']}}]);
  const tired=c.players.filter(p=>(p.fit??100)<82).length;
  if(tired>=5)opts.push([2,()=>{c.players.forEach(p=>p.fit=clamp((p.fit??100)+8,0,100));return {k:'rest',from:'המחלקה הרפואית',title:'יום התאוששות מלא',body:`הפיזיותרפיסטים פינו יום שלם לאמבטיות קרח, עיסויים ושינה. הרגליים ירגישו את זה.`,fx:['כושר גופני ‎+8 לכל הסגל']}}]);
  if(loss)opts.push([3,()=>{const low=c.players.slice().sort((a,b)=>(a.morale??65)-(b.morale??65)).slice(0,6);low.forEach(p=>p.morale=clamp((p.morale??65)+6,10,100));
    return {k:'talk',from:'הקפטן',title:'החדר איתך',body:`אחרי ההפסד הקפטן אסף את השחקנים בלי הצוות. הם יצאו משם עם מסר אחד: ממשיכים יחד.`,fx:['מורל ‎+6 לשישה שחקנים']}}]);
  if(win&&strength(opp)>=strength(c)+3&&G.board)opts.push([2,()=>{G.board.conf=clamp(G.board.conf+3,0,100);return {k:'board',from:'הבעלים',title:'טלפון אחרי המשחק',body:`"ראיתי כל דקה. ככה אני רוצה לראות את הקבוצה שלי." השיחה נמשכה פחות מדקה, אבל היא נרשמה.`,fx:['אמון ההנהלה ‎+3']}}]);
  if(!opts.length){S.dry++;return null}
  let r=Math.random()*opts.reduce((t,o)=>t+o[0],0);let fn=opts[0][1];for(const o of opts){r-=o[0];if(r<=0){fn=o[1];break}}
  S.dry=0;return envRecord(fn())}
/* a real player abroad who would improve the squad and whom the club can afford; nobody the scouts already reported on */
function surpriseScoutPick(c){try{if(!G.world||typeof WORLD_LEAGUES==='undefined')return null;const keys=Object.keys(G.world).filter(k=>G.world[k]&&G.world[k].clubs);if(!keys.length)return null;
  const weak=['GK','DF','MF','FW'].map(pos=>({pos,v:effOvrTop(c,pos)})).sort((a,b)=>a.v-b.v)[0];let pool=[];
  for(const k of keys)for(const cl of G.world[k].clubs)for(const p of cl.players){if(p.rep||p.nfs||!p.en||p.age>30||p.pos!==weak.pos)continue;if(p.ovr<weak.v-1||p.ovr>weak.v+7)continue;if(marketValue(p)*1.2>c.money)continue;pool.push({p,cl})}
  if(!pool.length)return null;pool.sort((a,b)=>(b.p.ovr+(b.p.pot-b.p.ovr)*.3)-(a.p.ovr+(a.p.pot-a.p.ovr)*.3));return pool[ri(0,Math.min(4,pool.length-1))]}catch(e){return null}}
let envOpen=false;
function envelopeOpen(env,done){if(typeof document==='undefined'||!document.body)return done&&done();envelopeClose();envOpen=true;
  const root=document.createElement('div');root.id='envelope';root.className='env';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','מעטפה: '+env.from);
  root.innerHTML=`<div class="env-box"><div class="env-from">הגיעה מעטפה</div><button type="button" class="env-seal" id="envSeal" aria-label="פתח את המעטפה"><span class="env-flap"></span><span class="env-wax">G</span><span class="env-to">${esc(env.from)}</span></button><div class="env-tap">הקש לפתיחה</div>
    <div class="env-letter" id="envLetter" hidden><div class="env-who">${esc(env.from)}</div><h3>${esc(env.title)}</h3><p>${esc(env.body)}</p>${env.fx&&env.fx.length?`<ul class="env-fx">${env.fx.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:''}
    <div class="actions">${env.wpid?'<button type="button" class="btn sec" id="envPlayer">לכרטיס השחקן</button>':env.go==='youth'?'<button type="button" class="btn sec" id="envYouth">לאקדמיה</button>':''}<button type="button" class="btn" id="envOk">יפה</button></div></div></div>`;
  document.body.appendChild(root);const open=()=>{if(root.classList.contains('open'))return;root.classList.add('open');root.querySelector('#envLetter').hidden=false;buzz('open');try{SFX.click()}catch(e){}setTimeout(()=>{try{root.querySelector('#envOk').focus({preventScroll:true})}catch(e){}},60)};
  const close=after=>{envelopeClose();if(after)after();else done&&done()};
  root.onclick=e=>{const t=e.target;if(t.closest('#envSeal'))return open();if(t.closest('#envOk'))return close();
    if(t.closest('#envPlayer'))return close(()=>{done&&done();setTimeout(()=>{try{playerModalAny(env.wpid)}catch(e2){}},80)});
    if(t.closest('#envYouth'))return close(()=>{squadTab='youth';G.view='squad';closeModal();render()})};
  if(revealReduced())open();else setTimeout(()=>{try{root.querySelector('#envSeal').focus({preventScroll:true})}catch(e){}},60)}
function envelopeClose(){const r=$('envelope');if(r)r.remove();envOpen=false}

/* ---- the budget in the top bar counts to its new value instead of jumping ---- */
let moneyShown=null;
function topCountUp(c){const el=$('topMoney');if(!el||!c)return;const key=(G.careerId||'')+'|'+c.id;const to=c.money;const prev=moneyShown;moneyShown={key,v:to};
  if(!prev||prev.key!==key||prev.v===to||revealReduced()||typeof requestAnimationFrame==='undefined')return;
  const from=prev.v,t0=performance.now(),dur=700;el.classList.remove('up','down');void el.offsetWidth;el.classList.add(to>from?'up':'down');const my=moneyShown;
  (function fr(){if(moneyShown!==my||!el.isConnected)return;const u=Math.min(1,(performance.now()-t0)/dur);const e=1-Math.pow(1-u,3);el.textContent=NIS(from+(to-from)*e);if(u<1)requestAnimationFrame(fr);else el.textContent=NIS(to)})()}

/* ---- clicks of the screens in 36c–36h (called first by bind() in 36-views.js; true = handled) ---- */
function engageClick(e){const t=e.target;
  const gv=t.closest('[data-goview]');if(gv){G.view=gv.dataset.goview;render();const m=$('main');if(m)m.scrollTop=0;return true}
  if(t.closest('[data-blitz-open]')){blitzEnter();return true}
  const pg=t.closest('[data-pengame]');if(pg){G.penGame=pg.dataset.pengame==='1';save();render();return true}
  const hp=t.closest('[data-hap]');if(hp){G.haptic=hp.dataset.hap==='1';if(G.haptic)buzz('goal');save();render();return true}
  const nt=t.closest('[data-notif]');if(nt){notifySet(nt.dataset.notif==='1');return true}
  return false}
function engageSettingsHTML(){const vib=typeof navigator!=='undefined'&&!!navigator.vibrate;const ns=notifyState();
  return `<div class="row between wrap" style="margin-top:8px"><span class="small">פנדלים ודו־קרב פנדלים</span><div class="mt" style="flex:0 0 200px"><button data-pengame="1" class="${G.penGame!==false?'on':''}">אני בועט</button><button data-pengame="0" class="${G.penGame===false?'on':''}">אוטומטי</button></div></div>
  <div class="row between wrap" style="margin-top:8px"><span class="small">רטט ברגעים גדולים ${vib?'':'<span class="muted">(לא נתמך בדפדפן הזה)</span>'}</span><div class="mt" style="flex:0 0 160px"><button data-hap="1" class="${G.haptic!==false?'on':''}">פעיל</button><button data-hap="0" class="${G.haptic===false?'on':''}">כבוי</button></div></div>
  <div class="row between wrap" style="margin-top:8px"><span class="small">התראות כשהמשחק ברקע <span class="muted">${ns==='unsupported'?'(לא נתמך בדפדפן הזה)':ns==='denied'?'(חסום בהגדרות הדפדפן)':'(משחק רשת)'}</span></span><div class="mt" style="flex:0 0 160px"><button data-notif="1" class="${ns==='on'?'on':''}" ${ns==='unsupported'||ns==='denied'?'disabled':''}>פעיל</button><button data-notif="0" class="${ns!=='on'?'on':''}">כבוי</button></div></div>`}
