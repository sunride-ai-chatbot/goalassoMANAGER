/* ====================== BACKROOM STAFF ====================== */
const STAFF_ROLES={asst:{he:'עוזר מאמן',icon:'📋',base:26000,specs:[['tac','טקטיקה','‎+0.02 למצבים שהקבוצה מייצרת'],['mot','מוטיבציה','שחקנים במורל מתחת ל-60 עולים בנקודה כל שבוע'],['set','כדורים נייחים','‎+0.03 למצבים מכדורים נייחים']]},
  gk:{he:'מאמן שוערים',icon:'🧤',base:14000,specs:[['shot','עצירת בעיטות','שוערים מתפתחים מהר יותר ב-10% נוספים'],['dist','משחק רגל','‎+0.01 לחוזק ההרכב']]},
  fit:{he:'מאמן כושר',icon:'🏃',base:16000,specs:[['endu','סיבולת','עייפות במשחק יורדת ב-5%'],['prev','מניעת פציעות','סיכון פציעה באימון יורד ב-10% נוספים']]},
  youth:{he:'מאמן נוער',icon:'🌱',base:15000,specs:[['dev','פיתוח','שחקני נוער מתפתחים מהר יותר ב-10% נוספים'],['scout','איתור','פוטנציאל גבוה יותר בשנתון החדש']]},
  anl:{he:'אנליסט',icon:'📊',base:18000,specs:[['opp','ניתוח יריבות','‎+8 לביטחון בדוח האנליסט'],['data','נתונים','השפעת תוכנית המשחק גדלה ב-10%']]},
  phys:{he:'פיזיותרפיסט',icon:'🩺',base:17000,specs:[['rehab','שיקום','שיקום מואץ זול ב-10% נוספים'],['load','ניהול עומסים','‎+2 להתאוששות השבועית']]}};
const STAFF_FIRST=['אבי','יוסי','רוני','מיכל','דנה','שרון','עמית','גיל','אורי','טל','נועה','איתי','ליאור','מורן','אלון','שי','רז','יעל'],STAFF_LAST=['כהן','לוי','מזרחי','פרץ','ביטון','אזולאי','דהן','חדד','עמר','גבאי','אוחיון','שושן','בן דוד','סעדה','נחום','קורן','ברק','אדרי'];
const STAFF_BIO=['שחקן עבר בליגת העל','הגיע מאקדמיה באירופה','עבד בנבחרות הצעירות','בעל תואר במדעי הספורט','עבד שנים בליגה הלאומית','חזר מעבודה בחו"ל'];
function staffD(role){const st=G&&G.staff&&G.staff[role];return st?(st.q-2):0}
function staffSpec(role,k){const st=G&&G.staff&&G.staff[role];return !!(st&&st.spec===k)}
function tierOf(c){return c.tier||(myDiv()==='leumit'?4:3)}
function ensureStaff(){if(!G)return;if(!G.staff){G.staff={};for(const r in STAFF_ROLES)G.staff[r]={name:`${pick(STAFF_FIRST)} ${pick(STAFF_LAST)}`,q:2,wage:0,weeks:0,spec:null,base:true,bio:'צוות המועדון הקיים'}}if(!G.staffMarket)G.staffMarket={}}
function staffCandidate(role){const c=me();const t=tierOf(c);const R=STAFF_ROLES[role];const qMax=t===1?5:t===2?5:t===3?4:3;const q=clamp(ri(1,qMax)+(Math.random()<.3?1:0),1,qMax);const sp=pick(R.specs);
  const wage=Math.round(R.base*(.5+q*.35)*(t===1?1.3:t===2?1.1:t===3?.9:.6)*rnd(.92,1.08)/500)*500;return {id:(G.staffSeq=(G.staffSeq||0)+1),role,name:`${pick(STAFF_FIRST)} ${pick(STAFF_LAST)}`,q,wage,weeks:pick([46,92]),spec:sp[0],age:ri(31,62),bio:pick(STAFF_BIO)}}
function staffMarketFor(role){G.staffMarket=G.staffMarket||{};const m=G.staffMarket[role];if(!m||m.s!==G.season)G.staffMarket[role]={s:G.season,list:[0,1,2].map(()=>staffCandidate(role))};return G.staffMarket[role].list}
function staffFitText(role,cand){const c=me();const cur=G.staff[role];const lines=[];const d=cand.q-cur.q;lines.push(d>0?`רמה ${cand.q} מול ${cur.q} אצל ${cur.name} כיום: שדרוג ברור.`:d===0?'באותה רמה כמו הצוות הנוכחי. ההבדל הוא בהתמחות.':`חלש יותר מהצוות הנוכחי (${cur.q}).`);
  if(role==='phys'||role==='fit'){const inj=c.players.filter(p=>p.inj>0).length;if(inj>=3)lines.push(`יש כרגע ${inj} פצועים בסגל.`)}
  if(role==='gk'){const gk=c.players.filter(p=>p.pos==='GK').sort(byOvr)[0];if(gk)lines.push(gk.age<=23?`השוער הראשון (${gk.age}) צעיר וירוויח מפיתוח.`:gk.age>=32?`השוער הראשון בן ${gk.age}.`:`השוער הראשון בדירוג ${gk.ovr}.`)}
  if(role==='youth')lines.push(`האקדמיה ברמה ${c.academy}/5${c.academy>=4?': הנוער כבר איכותי, ומאמן טוב ימקסם אותו.':'.'}`);
  if(role==='anl'){const big=(G.cal||[]).slice(G.wk).filter(e=>e.t==='euro'||e.t==='cup').length;if(big)lines.push(`יש עוד ${big} שבועות גביע ואירופה העונה.`)}
  if(role==='asst'&&c.players.some(p=>(p.morale??65)<50)&&cand.spec==='mot')lines.push('יש שחקנים במורל נמוך, והתמחות במוטיבציה תעזור להם.');
  return lines.join(' ')}
function hireStaff(role,id){const c=me();const list=staffMarketFor(role);const cand=list.find(x=>x.id===id);if(!cand)return;const cur=G.staff[role];let comp=0;if(!cur.base&&cur.weeks>0)comp=Math.round(cur.wage*cur.weeks*.5/1000)*1000;
  if(c.money<comp+cand.wage*4)return toast('אין מספיק תקציב');if(comp){c.money-=comp;addLog(`פיצוי ל${cur.name} (${STAFF_ROLES[role].he})`,-comp)}
  G.staff[role]={name:cand.name,q:cand.q,wage:cand.wage,weeks:cand.weeks,spec:cand.spec,base:false,bio:cand.bio,age:cand.age,since:{s:G.season,wk:G.wk}};G.staffMarket[role].list=list.filter(x=>x!==cand);
  news(`${cand.name} מונה ל${STAFF_ROLES[role].he} של ${c.name} (רמה ${cand.q}, ${NIS(cand.wage)} לשבוע).`);if(cand.q>=4)paperMajor('מועדון',`${c.name} מחזקת את הצוות: ${cand.name} מונה ל${STAFF_ROLES[role].he}`,`חוזה ל-${cand.weeks===46?'עונה':'שתי עונות'}`,`${cand.name} (${cand.age}), ${cand.bio}, מגיע עם מוניטין טוב. ${G.manager.name}: "רציתי אותו כבר מזמן." (ציטוט בדיוני)`);save();render()}
function refreshStaffMarket(role){const c=me();if(c.money<50000)return toast('אין מספיק תקציב');c.money-=50000;addLog('חיפוש צוות מקצועי',-50000);G.staffMarket[role]={s:G.season,list:[0,1,2].map(()=>staffCandidate(role))};save();render()}
function renewStaff(role){const st=G.staff[role];if(st.base||st.weeks>6)return;st.wage=Math.round(st.wage*1.1/500)*500;st.weeks+=46;news(`החוזה של ${st.name} (${STAFF_ROLES[role].he}) הוארך בעונה.`);save();render()}
function weeklyStaff(){const c=me();if(!G.staff)return;for(const r in G.staff){const st=G.staff[r];if(st.base)continue;c.money-=st.wage;addLog(`שכר ${STAFF_ROLES[r].he}`,-st.wage);st.weeks--;if(st.weeks===4)news(`החוזה של ${st.name} (${STAFF_ROLES[r].he}) מסתיים בעוד 4 שבועות.`);if(st.weeks<=0){news(`${st.name} סיים את תפקידו כ${STAFF_ROLES[r].he}. הצוות הבסיסי חוזר לתפקיד.`);G.staff[r]={name:`${pick(STAFF_FIRST)} ${pick(STAFF_LAST)}`,q:2,wage:0,weeks:0,spec:null,base:true,bio:'צוות המועדון הקיים'}}}
  if(staffSpec('asst','mot'))for(const p of c.players)if((p.morale??65)<60)p.morale=clamp(p.morale+1,10,100)}
function staffOrg(M,h,a){const o={h:0,a:0};if(!G.staff)return o;const k=h.id===G.me?'h':a.id===G.me?'a':null;if(!k)return o;o[k]=.02*staffD('asst')+(staffSpec('asst','tac')?.02:0)+(staffSpec('asst','set')?.03:0)+(staffSpec('gk','dist')?.01:0);return o}
function staffEffectsText(role,st){const d=st.q-2;const f=(v,u)=>`${v>0?'‎+':v<0?'‎':''}${v}${u||''}`;
  const base={asst:`מצבים: ${f(Math.round(d*2),'%')} · ניתוח מחצית`,gk:`התפתחות שוערים: ${f(d*15,'%')}`,fit:`התאוששות שבועית: ${f(d*2)} · סיכון פציעה באימון: ${f(-d*8,'%')}`,youth:`התפתחות נוער: ${f(d*12,'%')} · פוטנציאל שנתון: ${f(Math.max(0,d)*2)}`,anl:`ביטחון הדוח: ${f(d*12)} · השפעת התוכנית: ${f(d*15,'%')}`,phys:`משך פציעה: ${f(-d*6,'%')} · שיקום מואץ: זול ב-${d*6}%, מקצר ב-${25+3*d}%`}[role];
  const sp=st.spec?STAFF_ROLES[role].specs.find(x=>x[0]===st.spec):null;return base+(sp?` · התמחות "${sp[1]}": ${sp[2]}`:'')}
function viewStaffRoles(){const c=me();ensureStaff();
  return Object.keys(STAFF_ROLES).map(role=>{const R=STAFF_ROLES[role],st=G.staff[role];const open=G.staffOpen===role;
    return `<div class="card staff"><div class="row between"><div class="row" style="gap:8px"><span class="sic">${R.icon}</span><div><b>${R.he}</b><div class="muted tiny">${esc(st.name)} · ${'★'.repeat(st.q)}${'☆'.repeat(5-st.q)}${st.base?' · צוות בסיסי, כלול בתקציב':` · ${NIS(st.wage)}/שבוע · עוד ${st.weeks} שבועות`}</div></div></div><button class="btn sm sec" data-staffopen="${role}">${open?'סגור':'החלף'}</button></div>
     <div class="small" style="margin-top:6px;color:#cfd8f3">${staffEffectsText(role,st)}</div>${!st.base&&st.weeks<=6?`<div class="actions" style="margin-top:6px"><button class="btn sm" data-staffrenew="${role}">הארך בעונה · ${NIS(Math.round(st.wage*1.1/500)*500)}/שבוע</button></div>`:''}
     ${open?`<div class="list" style="margin-top:8px">${staffMarketFor(role).map(cd=>`<div class="ment"><div class="row between"><b>${esc(cd.name)} (${cd.age})</b><span class="stars">${'★'.repeat(cd.q)}${'☆'.repeat(5-cd.q)}</span></div><div class="muted tiny">${esc(cd.bio)} · ${NIS(cd.wage)}/שבוע · ${cd.weeks===46?'עונה':'שתי עונות'}</div><div class="tiny">${staffEffectsText(role,cd)}</div><div class="tiny" style="color:var(--info)">למה הוא? ${esc(staffFitText(role,cd))}</div><button class="btn sm" data-staffhire="${role}:${cd.id}">מנה${!st.base&&st.weeks>0?` · פיצוי ${NIS(Math.round(st.wage*st.weeks*.5/1000)*1000)}`:''}</button></div>`).join('')||'<div class="muted small">אין מועמדים</div>'}</div><div class="actions" style="margin-top:6px"><button class="btn sm sec" data-staffrefresh="${role}">מועמדים חדשים · ₪50K</button></div>`:''}</div>`}).join('')}
/* ====================== ANALYST REPORT & GAME PLAN ====================== */
const PLAN_HE={none:'ללא תוכנית מיוחדת',press:'לחץ גבוה עליהם',block:'בלוק נמוך וקו עמוק',direct:'משחק ישיר מאחורי הקו',mark:'שמירה צמודה על הכוכב',wide:'התקפה דרך האגפים'};
function analystConf(c,opp){const met=(G.results||[]).some(r=>(r.h===opp.id||r.a===opp.id)&&(r.h===c.id||r.a===c.id));const domestic=G.clubs.includes(opp)||G.leumit.includes(opp);return clamp(Math.round(48+12*staffD('anl')+(staffSpec('anl','opp')?8:0)+(met?10:0)+(domestic?8:-6)+(opp.pseudo?-8:0)),30,95)}
function oppXI(opp){return bestXI(opp)}
function oppIntel(c,opp){const xi=oppXI(opp);const by=pos=>xi.filter(p=>p.pos===pos);const dang=xi.slice().sort((a,b)=>effOvr(b)+(b.goals||0)*.6-(effOvr(a)+(a.goals||0)*.6)).slice(0,3);
  const df=by('DF');const weakDF=df.slice().sort((a,b)=>a.ovr-b.ovr)[0];const dfPace=df.length?df.reduce((t,p)=>t+attrs(p)[0],0)/df.length:65;const gk=by('GK')[0];const avg=xi.reduce((t,p)=>t+p.ovr,0)/Math.max(1,xi.length);
  const fit=xi.reduce((t,p)=>t+(p.fit??100),0)/Math.max(1,xi.length);const absent=opp.players.filter(p=>(p.inj>0||p.susp>0)).sort(byOvr).slice(0,3);const setp=[...df,...by('FW')].map(p=>attrs(p)[5]).sort((a,b)=>b-a).slice(0,4);const setv=setp.length?setp.reduce((a,b)=>a+b,0)/setp.length:60;
  const fbWide=df.filter(p=>roleOf(p)==='wingback').length;const ga=opp.P?opp.GA/opp.P:null;return {xi,dang,weakDF,dfPace,gk,avg,fit,absent,setv,fbWide,ga}}
function planOptions(c,opp,I){const t=tacOf(opp);const star=I.dang[0];
  return [['none','—','בלי שינוי: הטקטיקה שלך כפי שהיא.'],
   ['press',t.style==='possession'||I.fit<80?'מתאים':'סיכון',`לחץ על המוסרים שלהם. משתלם מול קבוצה שבונה מאחור${I.fit<80?' ועייפה':''}. עולה באנרגיה: העייפות שלנו עולה ב-20%.`],
   ['block',t.style==='counter'?'סיכון':'מתאים','סוגרים את המרווחים ומחכים. היריבה תייצר פחות, אבל גם אנחנו, וההחזקה יורדת.'],
   ['direct',I.dfPace<64?'מתאים':'סיכון',`כדורים ארוכים לעומק${I.dfPace<64?' מול קו הגנה איטי':''}. מוותרים על החזקה בשביל מצבים מהירים.`],
   ['mark',star?'מתאים':'—',star?`שחקן שלנו מוצמד ל${fullName(star)}: הוא יבעט פחות, אבל אנחנו מאבדים קצת מהיכולת לבנות.`:''],
   ['wide',I.fbWide?'מתאים':'סיכון',`מעמיסים על האגפים${I.fbWide?': המגנים שלהם עולים ומשאירים שטח':''}. יותר קרנות והגבהות, ופחות כיסוי באמצע.`]]}
function analystReportHTML(c,opp,nm){if(!opp||!opp.players||!opp.players.length)return '';const conf=analystConf(c,opp);const I=oppIntel(c,opp);const t=tacOf(opp);const ev=currentEvent()||{};
  const plan=(G.plan&&G.plan.opp===opp.id&&G.plan.wk===G.wk&&G.plan.s===G.season)?G.plan:null;const pk=plan?plan.kind:'none';
  const form=G.results.filter(r=>(r.h===opp.id||r.a===opp.id)&&r.kind!=='friendly').slice(-5).map(r=>{const gf=r.h===opp.id?r.gh:r.ga,ga=r.h===opp.id?r.ga:r.gh;return `<i class="fm ${gf>ga?'w':gf===ga?'d':'l'}">${gf>ga?'נ':gf===ga?'ת':'ה'}</i>`}).join('');
  const lvl=conf>=75?['גבוה','good']:conf>=55?['בינוני','warn']:['נמוך','bad'];
  const weak=[];if(I.weakDF)weak.push(`הבלם/מגן החלש: ${fullName(I.weakDF)} (${I.weakDF.ovr})`);if(I.dfPace<64)weak.push(`קו הגנה איטי (קצב ממוצע ${Math.round(I.dfPace)}): כדורי עומק`);if(I.gk&&I.gk.ovr<I.avg-4)weak.push(`שוער חלש יחסית (${I.gk.ovr})`);if(I.ga!=null&&I.ga>=1.5)weak.push(`סופגים ${I.ga.toFixed(1)} שערים למשחק`);if(t.press==='high')weak.push('לחץ גבוה: שטח מאחורי הקישור');if(!weak.length)weak.push('אין חולשה בולטת. משחק של סבלנות');
  const fat=[];if(I.fit<85)fat.push(`כושר ממוצע בהרכב הצפוי: ${Math.round(I.fit)}%`);if(I.absent.length)fat.push('חסרים: '+I.absent.map(p=>`${fullName(p)} (${p.inj>0?(p.injT||'פציעה'):'הרחקה'})`).join(', '));if(!fat.length)fat.push('סגל מלא וטרי');
  return `<div class="analyst"><div class="row between"><b>📊 דוח אנליסט · ${esc(opp.short)}</b><span class="tag ${lvl[1]}">ביטחון ${lvl[0]} · ${conf}%</span></div>
   <div class="an-grid"><div><span class="muted tiny">מערך וסגנון צפויים</span><div class="small">${esc(opp.formation||'4-4-2')} · ${TAC.press[t.press]} · ${TAC.style[t.style]} · ${TAC.tempo[t.tempo]}</div></div><div><span class="muted tiny">כושר אחרון</span><div class="fmrow">${form||'<span class="tiny muted">אין משחקים</span>'}</div></div></div>
   <div class="an-sec"><span class="muted tiny">⚠️ שחקנים מסוכנים</span>${I.dang.map(p=>`<div class="an-pl"><span class="pos ${p.pos}">${POSB[p.pos]}</span><b>${esc(fullName(p))}</b><span class="num">${p.ovr}</span><span class="muted tiny">${p.goals||0} שערים${p.assists?` · ${p.assists} בישולים`:''}${p.rn?` · ציון ${(p.rsum/p.rn).toFixed(1)}`:''}</span></div>`).join('')}</div>
   <div class="an-sec"><span class="muted tiny">🎯 חולשות בהגנה</span><ul>${weak.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>
   <div class="an-sec"><span class="muted tiny">🩹 עייפות ופציעות</span><ul>${fat.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>
   <div class="an-sec"><span class="muted tiny">⛳ כדורים נייחים</span><div class="small">${I.setv>=70?`איום גבוה: שחקנים חזקים באוויר (ממוצע פיזי ${Math.round(I.setv)})`:I.setv>=62?'איום בינוני':'איום נמוך'}</div></div>
   ${conf<55?'<div class="tiny" style="color:var(--warn);margin-top:4px">ביטחון נמוך: ייתכן שהם יפתיעו בגישה אחרת. אנליסט טוב יותר (מועדון ← צוות) משפר את הדוח.</div>':''}
   <div class="an-sec"><span class="muted tiny">התוכנית שלך למשחק</span><div class="plans">${planOptions(c,opp,I).filter(o=>o[0]==='none'||o[2]).map(([k,fit,txt])=>`<button class="plan ${pk===k?'on':''}" data-plan="${k}:${opp.id}"><b>${PLAN_HE[k]}${k==='mark'&&I.dang[0]?': '+esc(I.dang[0].last||I.dang[0].first):''}</b>${fit&&fit!=='—'?`<span class="tag ${fit==='מתאים'?'good':'warn'}">${fit}</span>`:''}<small>${esc(txt)}</small></button>`).join('')}</div></div></div>`}
function setPlan(kind,oppId){const opp=club(oppId);if(!opp)return;const I=oppIntel(me(),opp);G.plan={kind,opp:oppId,wk:G.wk,s:G.season,target:kind==='mark'&&I.dang[0]?I.dang[0].id:null,targetName:kind==='mark'&&I.dang[0]?fullName(I.dang[0]):null,conf:analystConf(me(),opp)};save();render()}
function attachPlan(M,h,a){const mine=h.id===G.me?h:a,opp=h.id===G.me?a:h;const conf=analystConf(mine,opp);M.anConf=conf;
  if(Math.random()<(100-conf)/260){const t={...tacOf(opp)};const alt=['possession','direct','counter','balanced'].filter(x=>x!==t.style);t.style=pick(alt);M.tacOv={[opp.id]:t};M.oppSwitch=t.style}
  const pl=G.plan;if(pl&&pl.opp===opp.id&&pl.wk===G.wk&&pl.s===G.season&&pl.kind!=='none'){M.plan={kind:pl.kind,target:pl.target,targetName:pl.targetName,mult:(.7+.15*staffD('anl'))*(staffSpec('anl','data')?1.1:1),home:h.id===G.me}}
  if(M.oppSwitch)M.ev.push({m:1,t:'note',team:G.me,txt:`${opp.short} הפתיעו: הם משחקים ${TAC.style[M.oppSwitch]} במקום מה שהאנליסט צפה.`})}
function planEffect(M,h,a){const P=M&&M.plan;if(!P)return null;const mine=P.home?h:a,opp=P.home?a:h;const to=tacOfM(M,opp);const k=P.mult||1;const r={home:P.home,own:0,opp:0,ps:0,fat:1};
  const oppFit=avgFit(M,opp);const dfPace=avgAttr(M,opp,'DF',0);
  if(P.kind==='press'){r.own=(to.style==='possession'?.08:.03)+(oppFit<80?.04:0);r.opp=.02;r.ps=.05;r.fat=1.2}
  else if(P.kind==='block'){r.opp=to.style==='counter'?-.03:-.09;r.own=-.05;r.ps=-.06}
  else if(P.kind==='direct'){r.own=dfPace<64?.08:.02;r.ps=-.06}
  else if(P.kind==='mark'){r.own=-.02}
  else if(P.kind==='wide'){r.own=.05;r.opp=.02}
  r.own*=k;r.opp*=k;r.ps*=k;return r}
function planVerdict(r){const P=r.plan;if(!P||P.kind==='none'||!r.ps)return '';const meH=r.h===G.me;const my=meH?r.h:r.a,op=meH?r.a:r.h;const tp=(r.poss[r.h]+r.poss[r.a])||1;const mp=Math.round(r.poss[my]/tp*100);
  const xg=t=>+(r.ev||[]).filter(e=>e.team===t&&e.xg!=null&&(e.t==='shot'||e.t==='goal'||e.t==='pen'||e.t==='penmiss')).reduce((s,e)=>s+e.xg,0).toFixed(2);const mx=xg(my),ox=xg(op);const sh=r.shots[my],osh=r.shots[op];let ok=0;const lines=[];
  if(P.kind==='press'){lines.push(`ההחזקה שלנו: ${mp}%. בעיטות: ${sh} מול ${osh}.`);ok=mp>=52&&sh>=osh?2:mp>=48?1:0}
  else if(P.kind==='block'){lines.push(`היריבה: ${osh} בעיטות, xG ${ox}. אנחנו: ${sh} בעיטות, xG ${mx}.`);ok=ox<1.1?2:ox<1.6?1:0}
  else if(P.kind==='direct'){lines.push(`${sh} בעיטות ו-xG ${mx} עם ${mp}% החזקה בלבד.`);ok=mx>=1.4?2:mx>=.9?1:0}
  else if(P.kind==='mark'){const ps=r.ps[op]&&r.ps[op][P.target];if(ps){lines.push(`${P.targetName}: ${ps.sh} בעיטות, ${ps.g} שערים, ציון ${ps.r}.`);ok=ps.g===0&&ps.r<7?2:ps.g<=1&&ps.r<7.5?1:0}else{lines.push(`${P.targetName} לא שיחק.`);ok=1}}
  else if(P.kind==='wide'){const cr=(r.corners||{})[my]||0;lines.push(`${cr} קרנות, ${sh} בעיטות, xG ${mx}.`);ok=cr>=6&&mx>=1.2?2:cr>=4?1:0}
  if(r.oppSwitch)lines.push(`הם שינו גישה (${TAC.style[r.oppSwitch]}) בניגוד לדוח.`);
  return `<div class="card"><div class="row between"><h3 class="sec">התוכנית: ${PLAN_HE[P.kind]}</h3><span class="tag ${ok===2?'good':ok===1?'warn':'bad'}">${ok===2?'עבדה':ok===1?'עבדה חלקית':'לא עבדה'}</span></div>${lines.map(l=>`<div class="small" style="margin-top:4px">• ${esc(l)}</div>`).join('')}</div>`}
