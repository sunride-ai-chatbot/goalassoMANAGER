/* ====================== REALISM SYSTEMS: derbies, fans & attendance, fitness, morale, training, newspaper ====================== */
const DERBIES=[['mta','hta','דרבי תל אביב'],['mhf','hhf','דרבי חיפה'],['bje','hje','דרבי ירושלים'],['mpt','hpt','דרבי פתח תקווה'],['mta','mhf','הקלאסיקו הישראלי'],['bje','mta','יריבות גדולה'],['hbs','bje','יריבות גדולה'],['hta','mhf','יריבות ותיקה']];
function derbyLabel(a,b){const d=DERBIES.find(([x,y])=>(x===a&&y===b)||(x===b&&y===a));return d?d[2]:null}
function isDerby(a,b){return !!derbyLabel(a,b)}
const FOCUS_HE={bal:'מאוזן',fit:'כושר גופני',att:'התקפה',def:'הגנה',youth:'נוער',rec:'התאוששות'};
const FOCUS_DESC={bal:'התפתחות רגילה לכל הסגל.',fit:'המשחקים שוחקים פחות (-15%) ופציעות נדירות יותר, התפתחות איטית יותר.',att:'חלוצים וקשרים מתפתחים מהר (x1.4), מגנים ושוערים לאט.',def:'מגנים ושוערים מתפתחים מהר (x1.4), התקפה לאט.',youth:'הנוער מתפתח x1.6, הבוגרים קצת לאט יותר.',rec:'התאוששות מהירה (+6 כושר גופני בשבוע) ופצועים חוזרים מהר יותר, התפתחות איטית.'};
const INT_HE={low:'קל',mid:'רגיל',high:'אינטנסיבי'};
const INT_DESC={low:'פחות פציעות, התאוששות טובה, התפתחות איטית.',mid:'האיזון הרגיל.',high:'התפתחות מהירה (+25%), אבל יותר פציעות אימון ועייפות.'};
const baseTicket=c=>c.tier===1?90:c.tier===2?70:55;
const baseFans=c=>c.tier===1?70:c.tier===2?55:42;
function effOvr(p){const mor=p.morale??65,fit=p.fit??100;return p.ovr+p.form+(mor-65)/20+Math.min(0,(fit-85)/6)+sharpAdj(p)-(p.adapt!=null&&p.adapt<100?(100-p.adapt)/40:0)}
function sharpAdj(p){const sh=p.sharp??70;return clamp((sh-70)/15,-2,.7)}
const byEff=(a,b)=>effOvr(b)-effOvr(a);
function fitClass(f){return f>=80?'good':f>=60?'warn':'bad'}
function moraleWord(m){return m>=85?'מצוין':m>=70?'טוב':m>=50?'סביר':m>=35?'נמוך':'במשבר'}

/* ---- attendance & fans ---- */
function attendanceFor(h,a,kind,stage){
  if(!h.league||h.pseudo)return 0;
  const pos=standings().findIndex(x=>x.id===h.id);
  let fill=.18+(h.fans??baseFans(h))/100*.62;
  if(a.tier===1||(a.prestige&&a.prestige<=4))fill+=.12;
  if(isDerby(h.id,a.id))fill+=.1;
  if(kind==='cup')fill+=stage==='R16'?-.06:stage==='QF'?.04:.1;if(kind==='toto')fill-=.15;
  if(kind==='euro')fill+=['Q2','Q3','PO'].includes(stage)?.12:stage==='LP'?.22:.32;
  if(pos>=0&&pos<3)fill+=.05;if(pos>=11)fill-=.04;
  fill+=rnd(-.05,.05);
  const base=baseTicket(h);const price=h.ticket||base;fill*=clamp(1-(price-base)/base*.55,.3,1.25);
  return Math.round(clamp(fill,.1,1)*effectiveCap(h));
}
function fansUpdate(c,gf,ga,opp,kind,stage,home){
  if(!c.league||c.pseudo)return;let d=gf>ga?2:gf===ga?0:-2;
  if(gf>ga&&(opp.tier===1||isDerby(c.id,opp.id)))d+=1;if(gf<ga&&home)d-=1;
  if(kind==='euro')d+=gf>ga?2:1;if(kind==='cup'&&gf>ga&&['QF','SF','F'].includes(stage))d+=1;if(gf-ga>=3)d+=1;
  c.fans=clamp((c.fans??baseFans(c))+d,10,100);
}
function fansDecay(){for(const c of G.clubs){const b=baseFans(c);const f=c.fans??b;c.fans=f>b?Math.max(b,f-.5):Math.min(b,f+.5)}}

/* ---- training & recovery ---- */
function trainCfg(c){return {focus:c.focus||'bal',intensity:c.intensity||'mid'}}
function devFactor(c,p){if(c._fx){const x=c._fx;const fwd=p.pos==='FW'||p.pos==='MF';return x.dev*(fwd?1+.12*x.att-.05*x.def:1+.12*x.def-.05*x.att)}const {focus,intensity}=trainCfg(c);let f=1;
  if(focus==='att')f*=(p.pos==='FW'||p.pos==='MF')?1.4:.7;else if(focus==='def')f*=(p.pos==='DF'||p.pos==='GK')?1.4:.7;else if(focus==='youth')f*=.8;else if(focus==='fit'||focus==='rec')f*=.8;
  if(intensity==='high')f*=1.25;else if(intensity==='low')f*=.8;return f}
function recoverWeekly(c){const {focus,intensity}=trainCfg(c);const base=c._fx?22+3*((c.training||1)-1)+2*staffD('fit')+c._fx.rec+((c.cond??60)-60)/10:22+3*((c.training||1)-1)+(c.id===G.me?2*staffD('fit'):0)+(intensity==='low'?5:intensity==='high'?-4:0)+(focus==='rec'?6:0);
  for(const p of c.players){if(p.inj){if(p.inj<=1)p.fit=Math.max(p.fit??100,70);continue}const f=p.fit??100;p.fit=clamp(f+base+(100-f)*.15,0,100)}}
function trainingInjuries(c){const {intensity}=trainCfg(c);const prob=(c._fx?.006*c._fx.inj*(1-((c.cond??60)-60)/200):intensity==='high'?.012:intensity==='low'?.003:.006)*(1-.1*((c.training||1)-1))*(c.id===G.me?1-.08*staffD('fit'):1);
  for(const p of c.players){if(p.inj||p.fit==null)continue;const tired=p.fit<60?1.8:1;if(Math.random()<prob*tired*(p.fragile>0?1.5:1)){setInjury(p,ri(1,3));if(c.id===G.me)news(`${fullName(p)} נפצע באימון: ${p.injT} (${p.inj} שבועות).`)}}}
function matchFatigue(M){for(const id of [M.h,M.a]){const c=club(id);if(!c||c.pseudo)continue;const cost=((c.focus==='fit')?.85:1)*(M.tadj?(id===M.h?M.tadj.fatH:M.tadj.fatA):1);
  for(const e of M.xi[id]){const p=c.players.find(x=>x.id===e.pid);if(p)p.fit=clamp((p.fit??100)-Math.round((90-e.since)/90*28*cost),0,100)}
  for(const pid of M.used[id]){const p=c.players.find(x=>x.id===pid);const mins=(M.mins&&M.mins[id]&&M.mins[id][pid])??60;if(p)p.fit=clamp((p.fit??100)-Math.round(mins/90*28*cost),0,100)}}}

/* ---- morale ---- */
function moraleAfterMatch(M,c,gf,ga){
  if(c.id!==G.me)return;const played=new Set([...M.xi[c.id].map(e=>e.pid),...M.used[c.id]]);
  const top11=c.players.slice().sort(byOvr).slice(0,11).map(p=>p.id);
  for(const p of c.players){let d=0;if(played.has(p.id))d=gf>ga?3:gf===ga?1:(mentalActive()?-1:-2);else if(!p.inj&&!p.susp&&(p.fit??100)>=80)d=top11.includes(p.id)?-2:-1;
    p.morale=clamp((p.morale??65)+d*persMoraleMult(p),10,100)}
  const leaders=c.players.filter(p=>p.pers==='leader'&&played.has(p.id)).length;if(leaders&&gf<ga)c.players.forEach(p=>p.morale=clamp(p.morale+1,10,100));
  const last3=G.results.filter(r=>(r.h===c.id||r.a===c.id)&&r.kind!=='friendly').slice(-3);
  if(last3.length===3&&last3.every(r=>(r.h===c.id?r.gh<r.ga:r.ga<r.gh)))c.players.forEach(p=>p.morale=clamp(p.morale-2,10,100));
}
function moraleWeekly(c){for(const p of c.players){const m=p.morale??65;const back=p.pers==='loyal'||p.pers==='professional'?2:1;p.morale=m>65?Math.max(65,m-1):Math.min(65,m+back);
  if(c.id===G.me){if(p.pers==='ambitious'&&c.prestige>4&&!(c.euro&&c.euro.stage!=='out')&&G.wk%2===0)p.morale=clamp(p.morale-1,10,100);if(p.pers==='mercenary'&&p.wage<playerWage(p)*1.05&&G.wk%3===0)p.morale=clamp(p.morale-1,10,100);if(p.listed&&G.wk%2===0)p.morale=clamp(p.morale-1,10,100)}
  if(c.id===G.me&&p.morale<35&&!p.unhappy&&p.ovr>=60){p.unhappy=true;const t=`${fullName(p)} לא מרוצה ומבקש לבדוק אפשרויות`;news(t+'.');paper('מועדון',`${fullName(p)} רוצה לעזוב את ${c.name}`,'השחקן הודיע לסוכן שלו שהוא לא מרוצה מהמעמד שלו',`${fullName(p)} (${p.age}, ${POSHE[p.pos]}) נמצא בתקופה קשה: מעט דקות משחק ומורל נמוך. בסביבת השחקן אומרים שאם המצב לא ישתנה בחודשים הקרובים, הוא יבקש העברה. במועדון מקווים שחזרה להרכב תרגיע את הרוחות.`)}
  if(p.unhappy&&p.morale>=55)p.unhappy=false}}

/* ---- man of the match ---- */
function manOfMatch(M,h,a){
  const R=M.ratings||matchRatings(M,h,a);let best=null,bs=-1;
  for(const c of [h,a]){for(const pid in R){const p=c.players.find(x=>x.id==pid);if(!p)continue;const s=R[pid];const sc=s.r+(s.min>=60?.3:0)+Math.random()*.1;if(sc>bs){bs=sc;best={pid:p.id,name:fullName(p),team:c.id,short:c.short,r:s.r}}}}
  return best;
}

/* ---- newspaper ---- */
const PAPER_NAME='הספורט היומי';
function paperMajor(kind,h,sub,body,team,ev){paper(kind,h,sub,body,team,ev);const mine=(team&&team===G.me)||(G.manager&&h.includes(G.manager.name))||(me()&&h.includes(me().name))||(me()&&h.includes(me().short));if(!mine||G.paperPopOff)return;G.paperPop=G.paperPop||[];G.paperPop.push({...G.paper[0],pop:1});G.paperPop=G.paperPop.slice(-3)}
function paper(kind,h,sub,body,team,ev){if(!G.paper)G.paper=[];G.paper.unshift({wk:G.wk,s:G.season,kind,h,sub,body,team:team||G.me,...(ev?{ev}:{})});G.paper=G.paper.slice(0,80)}
const OPENERS=['במועדון מרוצים מהמהלך.','בסביבת המועדון מספרים שהעסקה נסגרה אחרי משא ומתן קצר.','מקורבים לעסקה אומרים שההנהלה סימנה את השחקן כבר בתחילת החלון.','הסוכן של השחקן אישר את הפרטים.','האוהדים ברשת כבר הגיבו בהתלהבות.'];
function signingStory(p,c,from,fee){const open=pick(OPENERS);
  paperMajor('העברות',`${fullName(p)} חתם ב${c.name}`,fee?`${c.short} שילמה ${NIS(fee)} ל${from.short}; חוזה ל-${p.contract} ${p.contract>1?'עונות':'עונה'}`:`הצטרף כשחקן חופשי, חוזה ל-${p.contract} ${p.contract>1?'עונות':'עונה'}`,
  `${fullName(p)}, ${POSHE[p.pos]} בן ${p.age}${p.foreign?' מ'+p.nat:''}${p.fromLeague?' שהגיע מ'+p.fromLeague:''}, הוא הרכש ${fee?'היקר':'החדש'} של ${c.name}. ${open} הוא צפוי להתחרות על מקום בהרכב כבר במחזור הקרוב, ובמועדון מאמינים שהוא ${p.age<=23?'יהפוך לאחד הנכסים הגדולים של הקבוצה':'יביא איתו ניסיון וביטחון'}.`,c.id,{type:'sign',pid:p.id,player:fullName(p),pos:p.pos,age:p.age,no:p.no||null,club:c.name,clubId:c.id,from:from?from.short:null,fee:fee||null,free:!from,years:p.contract||null})}
function saleStory(p,c,to,fee){paperMajor('העברות',`${fullName(p)} עוזב את ${c.name}`,`${to.short} שילמה ${NIS(fee)}`,`${c.name} נפרדת מ${fullName(p)} (${p.age}). ${pick(['ההנהלה רואה בעסקה הזדמנות לרענן את הסגל.','המכירה תאפשר למועדון לחזק עמדות אחרות.','האוהדים חלוקים: יש שמצטערים על הפרידה ויש שמברכים על הסכום.'])} ב${to.short} מקווים שהוא ישתלב מהר.`,c.id,{type:'sale',pid:p.id,player:fullName(p),pos:p.pos,age:p.age,club:c.name,clubId:c.id,buyer:to.short,buyerId:to.id,fee})}
function sponsorStory(c,o){paperMajor('כספים',`${c.name} חתמה עם ${o.name}`,`חסות חולצה של ${NIS(o.annual)} לעונה ל-${o.years} ${o.years>1?'עונות':'עונה'}`,`הלוגו של ${o.name} יופיע על חולצת ${c.name} כבר במשחק הבא. ${o.bonusTitle?`החוזה כולל בונוסים על אליפות (${NIS(o.bonusTitle)}) ועל יציאה לאירופה (${NIS(o.bonusEuro)}).`:'מדובר בחוזה קבוע בלי בונוסים.'} במועדון מסבירים שהכסף יופנה לשכר השחקנים ולתשתיות.`,c.id,{type:'sponsor',sponsor:o.name,club:c.name,clubId:c.id,annual:o.annual,years:o.years})}
function resultStory(M,h,a){
  const mineHome=h.id===G.me;const my=mineHome?h:a,opp=mineHome?a:h;const gf=mineHome?M.gh:M.ga,ga=mineHome?M.ga:M.gh;
  const score=`${M.gh}:${M.ga}`;const derby=derbyLabel(h.id,a.id);const stronger=strength(opp)>strength(my)+3;
  const scorers=M.ev.filter(e=>(e.t==='goal'||e.t==='pen')&&e.team===my.id).map(e=>e.name);const motm=M.motm&&M.motm.team===my.id?M.motm.name:null;
  if(M.ctx.kind==='friendly'||(M.ctx.kind==='toto'&&M.ctx.stage!=='F'))return;
  if(gf-ga>=3)paper('ליגה',`${my.name} ${pick(['ריסקה','פירקה','הביסה','השפילה','מחצה'])} את ${opp.short} ${gf}:${ga}`,derby?`${derby} הסתיים בפסטיבל`:`${M.ctx.label}: ערב גדול ל${my.short}`,`${scorers.length?`השערים: ${scorers.join(', ')}. `:''}${motm?`שחקן המשחק: ${motm}. `:''}${pick(['הקהל חגג עד השריקה.','המנג\'ר יצא מהמשחק מרוצה מאוד.','זו תוצאה שתיזכר לאורך העונה.'])}`,my.id);
  else if(gf>ga&&(stronger||derby))paper('ליגה',derby?`${derby}: ${my.name} חוגגת`:`${my.name} הפתיעה את ${opp.short}`,`${score} ב${M.ctx.label}`,`${my.name} ניצחה ${gf}:${ga}${scorers.length?`, עם שערים של ${scorers.join(' ו')}`:''}. ${motm?`${motm} נבחר לשחקן המשחק. `:''}${pick(['האוהדים יצאו עם חיוך.','בהנהלה שבעי רצון.','המנג\'ר שיבח את הרוח הקבוצתית.'])}`,my.id);
  else if(ga-gf>=3)paperMajor('ליגה',`ערב שחור ל${my.name}`,`הפסד ${ga}:${gf} ל${opp.short} ב${M.ctx.label}`,`${my.name} ספגה ${ga} שערים${mineHome?' מול הקהל הביתי':''} ובסביבת המועדון מדברים על ${pick(['לחץ על המנג\'ר','חוסר ריכוז בהגנה','צורך ברכש בחלון הקרוב'])}. ${G.board.conf<35?'אמון ההנהלה בירידה.':'ההנהלה מבקשת תגובה כבר במשחק הבא.'}`,my.id);
  else if(M.ctx.kind==='cup'&&gf<ga&&opp.tier>my.tier)paperMajor('גביע',`הדחה מביכה: ${my.name} בחוץ`,`${opp.short} ניצחה ${ga}:${gf} ב${M.ctx.label}`,`הגביע נגמר מוקדם ל${my.name}. ${pick(['ההנהלה דורשת הסברים.','המנג\'ר לקח אחריות.','האוהדים זועמים ברשתות.'])}`,my.id);
  else if(M.ctx.kind==='cup'&&gf>ga&&['SF','F'].includes(M.ctx.stage))(M.ctx.stage==='F'?paperMajor:paper)('גביע',M.ctx.stage==='F'?`${my.name} זכתה בגביע המדינה!`:`${my.name} בגמר גביע המדינה`,`${score}${M.pens?' (פנדלים)':''} מול ${opp.short}`,`${motm?`${motm} היה שחקן המשחק. `:''}${M.ctx.stage==='F'?'חגיגות ענק בעיר אחרי השריקה.':'הגמר ייערך בטדי בסוף העונה.'}`,my.id,M.ctx.stage==='F'?{type:'cup',comp:'גביע המדינה',club:my.name,clubId:my.id,score,opp:opp.short,pens:!!M.pens}:null);
  else if(M.ctx.kind==='euro'&&gf>ga)paper('אירופה',`לילה אירופי: ${my.name} ניצחה ${gf}:${ga}`,`${M.ctx.label} מול ${opp.short}`,`${scorers.length?`השערים: ${scorers.join(', ')}. `:''}${M.att?`${M.att.toLocaleString('he')} צופים הגיעו ל${(mineHome?my:opp).stadium}. `:''}${pick(['זה הערב שהאוהדים חיכו לו.','הכסף של אופ"א כבר בדרך לקופה.'])}`,my.id);
}
function potm(){const recent=G.results.filter(r=>r.kind==='league'&&G.wk-r.wk<=5);const tally={};for(const r of recent){for(const e of (r.ev||[])){if((e.t==='goal'||e.t==='pen')&&e.pid){tally[e.pid]=(tally[e.pid]||0)+3}}if(r.motm&&r.motm.pid)tally[r.motm.pid]=(tally[r.motm.pid]||0)+4}
  const all=[...G.clubs,...G.leumit].flatMap(c=>c.players.map(p=>({p,c})));const scored=all.map(x=>({...x,s:(tally[x.p.id]||0)+(x.p.goals||0)*.4+(x.p.motm||0)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s);const w=scored[0];if(!w)return;
  w.p.morale=clamp((w.p.morale??65)+5,10,100);w.p.potm=(w.p.potm||0)+1;if(w.c.id===G.me){news(`${fullName(w.p)} נבחר לשחקן החודש של הליגה!`);paper('ליגה',`${fullName(w.p)} שחקן החודש`,`${esc(w.c.name)} חוגגת את הפרס`,`${pick(['השחקן קיבל את הפרס לפני המשחק הביתי.','הסוכן שלו כבר רומז על חוזה חדש.','המנג\'ר: "מגיע לו, הוא עובד קשה".'])}`,w.c.id)}else news(`שחקן החודש: ${fullName(w.p)} (${w.c.short}).`)}
function awardsStory(){
  const all=G.clubs.flatMap(c=>c.players.map(p=>({p,c})));if(!all.length)return;
  const top=all.slice().sort((a,b)=>b.p.goals-a.p.goals)[0];
  const poty=all.slice().sort((a,b)=>(b.p.ovr*.6+b.p.goals*1.5+b.p.apps*.1+(b.p.motm||0)*2)-(a.p.ovr*.6+a.p.goals*1.5+a.p.apps*.1+(a.p.motm||0)*2))[0];
  const young=all.filter(x=>x.p.age<=21).sort((a,b)=>(b.p.ovr+b.p.goals+b.p.apps*.2)-(a.p.ovr+a.p.goals+a.p.apps*.2))[0];
  G.awards={top:top&&{name:fullName(top.p),club:top.c.short,goals:top.p.goals},poty:poty&&{name:fullName(poty.p),club:poty.c.short},young:young&&{name:fullName(young.p),club:young.c.short}};
  [top,poty,young].forEach(x=>{if(x&&x.c.id===G.me)x.p.morale=clamp((x.p.morale??65)+6,10,100)});
  paper('ליגה',`פרסי העונה: ${poty?fullName(poty.p):'—'} שחקן העונה`,`${top?`מלך השערים: ${fullName(top.p)} (${top.c.short}, ${top.p.goals})`:''}${young?` · השחקן הצעיר: ${fullName(young.p)} (${young.c.short})`:''}`,`בטקס סיום העונה חולקו הפרסים. ${poty?`${fullName(poty.p)} מ${poty.c.short} נבחר לשחקן העונה. `:''}${top?`${fullName(top.p)} סיים כמלך השערים עם ${top.p.goals} שערים. `:''}${young?`${fullName(young.p)} הוכתר לשחקן הצעיר.`:''}`,poty?poty.c.id:G.me);
}
function paperHTML(stories,opts){
  opts=opts||{};if(!stories.length)return '';
  const lead=stories[0],rest=stories.slice(1,opts.max||3);
  const tm=club(lead.team)||me();
  const date=`שבוע ${lead.wk+1} · עונת ${(()=>{const y=2026+lead.s-1;return `${y}/${String(y+1).slice(2)}`})()}`;
  return `<div class="paper"><div class="masthead"><span class="ph-date">${date}</span><span class="ph-name">${PAPER_NAME}</span><span class="ph-price">₪5 · מהדורת הבוקר</span></div><div class="ph-rule"></div>
  <article class="lead" data-npopen="${(G.paper||[]).indexOf(lead)}" tabindex="0" role="button"><span class="kicker">${esc(lead.kind)}</span><h3 class="hl">${esc(lead.h)}</h3>${lead.sub?`<p class="sub">${esc(lead.sub)}</p>`:''}<div class="ph-cols"><div class="photo">${kitSVG(tm,'lg')}<span>${esc(tm.name)}</span></div><p class="body">${esc(lead.body)}</p></div></article>
  ${opts.noAd?'':adBox('paper')}${rest.length?`<div class="ph-grid">${rest.map(s=>`<article class="small-story" data-npopen="${(G.paper||[]).indexOf(s)}" tabindex="0" role="button"><span class="kicker">${esc(s.kind)}</span><h4>${esc(s.h)}</h4><p>${esc(s.sub||s.body.slice(0,110)+'…')}</p></article>`).join('')}</div>`:''}</div>`;
}

