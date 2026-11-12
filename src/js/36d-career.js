/* ====================== CAREER BOOK: trophies, records, achievements ======================
   G.car belongs to the manager and survives a change of club:
     n     counters of competitive matches (wins, goals, clean sheets, derbies, penalties he took himself…)
     st    running streaks                rec   best marks (longest run, biggest win, best finish…)
     tr    trophies [{k,name,season,club}]     ach   unlocked achievements {id:{s,w}}     fresh  unlocked, not shown yet
   Everything is derived from matches the game already settles; nothing here changes results, money or squads.
   Friendlies never count. The quick tournament keeps its own record outside the career (blitzRec). */
function carEnsure(){if(!G)return null;const C=G.car||(G.car={});C.n=C.n||{};C.st=C.st||{w:0,unb:0,cs:0};C.rec=C.rec||{};C.tr=C.tr||[];C.ach=C.ach||{};C.fresh=C.fresh||[];return C}
function carInc(k,by){const C=carEnsure();if(!C)return;C.n[k]=(C.n[k]||0)+(by==null?1:by)}
function carTrophy(kind,comp){if(carOff())return;const C=carEnsure();if(!C)return;const k=kind==='champ'?'champ':comp==='גביע המדינה'?'cup':comp==='גביע הטוטו'?'toto':kind==='promo'?'promo':kind==='lchamp'?'lchamp':'euro';
  const season=seasonLabel();if(C.tr.some(t=>t.k===k&&t.season===season&&(k!=='euro'||t.name===comp)))return;
  C.tr.push({k,name:k==='champ'?'אליפות המדינה':k==='promo'?'עלייה לליגת העל':k==='lchamp'?'אליפות הליגה הלאומית':comp,season,club:me().name});
  if(C.tr.some(t=>t.k==='champ'&&t.season===season)&&C.tr.some(t=>t.k==='cup'&&t.season===season))C.n.double=Math.max(C.n.double||0,1);
  try{achCheck()}catch(e){}}
function carSigning(p,kind){if(!p||kind==='loan')return;carInc('signings');if(p.ovr>=80)carInc('starSign')}
/* one settled match of the user's club */
/* network leagues share one state between two managers, so the book (which belongs to one manager) stays out of them */
function carOff(){return !G||!!G.blitz||(typeof mpIsOn==='function'&&mpIsOn())}
function carAfterMatch(M,rec){if(carOff()||M.ctx.kind==='friendly')return;const C=carEnsure(),n=C.n,st=C.st,R=C.rec;
  const meH=M.h===G.me;const my=club(G.me),opp=club(meH?M.a:M.h);if(!my||!opp)return;const gf=meH?M.gh:M.ga,ga=meH?M.ga:M.gh;
  const wonPens=!!M.pens&&((M.pens==='h')===meH);const win=gf>ga,loss=gf<ga;
  n.mp=(n.mp||0)+1;n.gf=(n.gf||0)+gf;n.ga=(n.ga||0)+ga;if(win)n.w=(n.w||0)+1;else if(loss)n.l=(n.l||0)+1;else n.d=(n.d||0)+1;if(ga===0)n.cs=(n.cs||0)+1;
  st.w=win?st.w+1:0;st.unb=loss?0:st.unb+1;st.cs=ga===0?st.cs+1:0;R.bestW=Math.max(R.bestW||0,st.w);R.bestUnb=Math.max(R.bestUnb||0,st.unb);R.bestCs=Math.max(R.bestCs||0,st.cs);
  const goals=M.ev.filter(e=>e.t==='goal'||e.t==='pen'||e.t==='own');const mine=goals.filter(e=>e.team===G.me),theirs=goals.filter(e=>e.team!==G.me);
  if(win){if(isDerby(M.h,M.a))carInc('derbyW');if(strength(opp)>=strength(my)+5)carInc('giantW');if(gf-ga>=4)carInc('bigW');if(!meH&&!M.ctx.neutral)carInc('awayW');
    if(mine.filter(e=>e.m<=45).length<theirs.filter(e=>e.m<=45).length)carInc('comeback');
    const last=mine.length?Math.max(...mine.map(e=>e.m)):0;if(gf-ga===1&&last>=85&&!theirs.some(e=>e.m>last))carInc('lateW');
    if(!R.bigWin||gf-ga>R.bigWin.gf-R.bigWin.ga||(gf-ga===R.bigWin.gf-R.bigWin.ga&&gf>R.bigWin.gf))R.bigWin={gf,ga,opp:opp.short||opp.name,season:seasonLabel()}}
  if(!R.goals||gf>R.goals.n)R.goals={n:gf,opp:opp.short||opp.name,season:seasonLabel()};
  const by={};for(const e of mine)if(e.t!=='own'&&e.pid!=null)by[e.pid]=(by[e.pid]||0)+1;if(Object.values(by).some(v=>v>=3))carInc('hat');
  const subs=new Map(M.ev.filter(e=>e.t==='sub'&&e.team===G.me&&e.inPid!=null).map(e=>[e.inPid,e.m]));const sg=mine.filter(e=>e.t!=='own'&&subs.has(e.pid)&&e.m>=subs.get(e.pid)).length;if(sg)carInc('subGoal',sg);
  const yg=mine.filter(e=>{if(e.t==='own')return false;const p=my.players.find(x=>x.id===e.pid);return p&&p.acad}).length;if(yg)carInc('youthGoal',yg);
  if(M.shoutGoals)carInc('shoutGoal',M.shoutGoals);if(M.penMine)carInc('penScored',M.penMine);if(M.penSaved)carInc('penSaved',M.penSaved);if(wonPens)carInc('soWon');
  const mm=M.motm||M.motmLive;if(mm&&mm.team===G.me)carInc('motm');
  if(meH&&!M.ctx.neutral&&my.cap&&M.att>=my.cap*.97)carInc('fullHouse');
  achCheck()}
/* the season is over (called from endSeason while the table and the players' season goals are still there) */
function carSeasonEnd(o){if(carOff())return;const C=carEnsure();if(!C)return;const c=me();C.n.seasons=(C.n.seasons||0)+1;const R=C.rec;
  if(o.inTop&&(!R.bestPos||o.pos<R.bestPos.pos))R.bestPos={pos:o.pos,season:seasonLabel(),club:c.name};
  if(!R.pts||c.pts>R.pts.n)R.pts={n:c.pts,season:seasonLabel(),club:c.name};
  const top=c.players.slice().sort((a,b)=>(b.goals||0)-(a.goals||0))[0];if(top&&(top.goals||0)>0&&(!R.topScorer||top.goals>R.topScorer.g))R.topScorer={name:fullName(top),g:top.goals,season:seasonLabel()};
  if(o.promoted)carTrophy('promo','עלייה');if(G.lchampion===G.me&&!o.inTop)carTrophy('lchamp','ליגה לאומית');achCheck()}
/* careers that began before the book existed: trophies from the manager's history, counters from this season's results */
function carBackfill(){if(!G||!G.manager)return;const had=!!G.car;const C=carEnsure();if(had&&C.n.mp)return;
  for(const h of G.manager.history||[]){const add=(k,name)=>{if(!C.tr.some(t=>t.k===k&&t.season===h.season))C.tr.push({k,name,season:h.season,club:h.club})};
    if(h.champ)add('champ','אליפות המדינה');if(h.cup)add('cup','גביע המדינה');if(h.toto)add('toto','גביע הטוטו');if(h.up)add('promo','עלייה לליגת העל');if(h.champ&&h.cup)C.n.double=1;
    if(!h.left&&!h.resigned){if(h.div!=='leumit'&&(!C.rec.bestPos||h.pos<C.rec.bestPos.pos))C.rec.bestPos={pos:h.pos,season:h.season,club:h.club}}}
  for(const m of G.moments||[]){if(m.kind==='cup'&&m.comp!=='גביע המדינה'&&m.comp!=='גביע הטוטו'&&!C.tr.some(t=>t.k==='euro'&&t.season===m.season&&t.name===m.comp))C.tr.push({k:'euro',name:m.comp,season:m.season,club:m.clubName})}
  C.n.seasons=(G.manager.history||[]).filter(h=>!h.left&&!h.resigned).length;
  const n=C.n,st=C.st,R=C.rec;for(const r of G.results||[]){if(r.kind==='friendly'||(r.h!==G.me&&r.a!==G.me))continue;const meH=r.h===G.me;const gf=meH?r.gh:r.ga,ga=meH?r.ga:r.gh;
    n.mp=(n.mp||0)+1;n.gf=(n.gf||0)+gf;n.ga=(n.ga||0)+ga;if(gf>ga)n.w=(n.w||0)+1;else if(gf<ga)n.l=(n.l||0)+1;else n.d=(n.d||0)+1;if(ga===0)n.cs=(n.cs||0)+1;
    st.w=gf>ga?st.w+1:0;st.unb=gf<ga?0:st.unb+1;st.cs=ga===0?st.cs+1:0;R.bestW=Math.max(R.bestW||0,st.w);R.bestUnb=Math.max(R.bestUnb||0,st.unb);R.bestCs=Math.max(R.bestCs||0,st.cs);
    if(gf>ga&&(!R.bigWin||gf-ga>R.bigWin.gf-R.bigWin.ga))R.bigWin={gf,ga,opp:meH?r.an:r.hn,season:seasonLabel()};if(!R.goals||gf>R.goals.n)R.goals={n:gf,opp:meH?r.an:r.hn,season:seasonLabel()}}
  for(const d of achDefs())if(d.v>=d.g&&!C.ach[d.id])C.ach[d.id]={s:G.season,w:G.wk,old:1};C.fresh=[]}

/* ---- achievements: [id, name, what it takes, category, target, current value, stars] ---- */
const ACH_CATS=[['res','תוצאות'],['run','רצפים'],['tro','תארים וותק'],['pl','שחקנים'],['club','מועדון ושם'],['mom','רגעים שלך'],['blz','טורניר בזק']];
function achDefs(){const C=carEnsure();if(!C)return [];const n=C.n,R=C.rec,c=me()||{};const tr=k=>C.tr.filter(t=>t.k===k).length;const B=blitzRec();const v=x=>x||0;
  const rows=[
  ['w1','ניצחון ראשון','לנצח במשחק רשמי','res',1,v(n.w),1],['w10','עשרה ניצחונות','עשרה ניצחונות במשחקים רשמיים','res',10,v(n.w),1],['w50','חמישים ניצחונות','חמישים ניצחונות במשחקים רשמיים','res',50,v(n.w),2],['w150','מאה וחמישים ניצחונות','מאה וחמישים ניצחונות במשחקים רשמיים','res',150,v(n.w),3],
  ['g100','מאה שערים','הקבוצות שלך כבשו מאה שערים','res',100,v(n.gf),1],['g400','ארבע מאות שערים','הקבוצות שלך כבשו ארבע מאות שערים','res',400,v(n.gf),3],
  ['cs10','עשרה שערים נקיים','עשרה משחקים בלי לספוג','res',10,v(n.cs),1],['cs40','ארבעים שערים נקיים','ארבעים משחקים בלי לספוג','res',40,v(n.cs),2],
  ['big','תבוסה','לנצח בהפרש ארבעה שערים או יותר','res',1,v(n.bigW),1],['giant','קוטל ענקים','לנצח יריבה שחזקה ממך בחמש נקודות דירוג','res',1,v(n.giantW),2],['giant5','מומחה להפתעות','חמישה ניצחונות על יריבות חזקות בהרבה','res',5,v(n.giantW),3],
  ['comeback','מהפך','לנצח אחרי פיגור במחצית','res',1,v(n.comeback),2],['late','דקה תשעים','שער ניצחון מהדקה ה־85 והלאה','res',1,v(n.lateW),1],
  ['derby','מלך העיר','לנצח בדרבי','res',1,v(n.derbyW),1],['derby5','בעל הבית','חמישה ניצחונות בדרבי','res',5,v(n.derbyW),2],['away10','אורחים לא מנומסים','עשרה ניצחונות חוץ','res',10,v(n.awayW),1],
  ['st3','שלושה ברצף','שלושה ניצחונות רצופים','run',3,v(R.bestW),1],['st6','שישה ברצף','שישה ניצחונות רצופים','run',6,v(R.bestW),2],['st10','עשרה ברצף','עשרה ניצחונות רצופים','run',10,v(R.bestW),3],
  ['unb10','עשרה בלי הפסד','עשרה משחקים רצופים בלי הפסד','run',10,v(R.bestUnb),1],['unb20','עשרים בלי הפסד','עשרים משחקים רצופים בלי הפסד','run',20,v(R.bestUnb),3],['cs4','חומה','ארבעה שערים נקיים ברצף','run',4,v(R.bestCs),2],
  ['champ','אלוף המדינה','לזכות באליפות','tro',1,tr('champ'),3],['champ3','שושלת','שלוש אליפויות','tro',3,tr('champ'),3],['cup','מחזיק הגביע','לזכות בגביע המדינה','tro',1,tr('cup'),2],['toto','גביע הטוטו','לזכות בגביע הטוטו','tro',1,tr('toto'),1],
  ['double','דאבל','אליפות וגביע באותה עונה','tro',1,v(n.double),3],['promo','עולים','לעלות לליגת העל','tro',1,tr('promo'),2],['euro','לילה אירופי','לזכות בגביע אירופי','tro',1,tr('euro'),3],
  ['seasons5','ותיק','חמש עונות על הקווים','tro',5,v(n.seasons),1],['seasons12','מוסד','שתים־עשרה עונות על הקווים','tro',12,v(n.seasons),3],
  ['hat','שלושער','שחקן שלך כובש שלושה במשחק אחד','pl',1,v(n.hat),1],['scorer20','מלך שערים','שחקן שלך כובש עשרים שערים בעונה','pl',20,v(R.topScorer&&R.topScorer.g),2],['motm10','כוכבי המשחק','עשרה תוארי שחקן המשחק לשחקנים שלך','pl',10,v(n.motm),1],
  ['sub','חילוף זהב','מחליף שהכנסת כובש','pl',1,v(n.subGoal),1],['sub10','יד מכוונת','עשרה שערים של מחליפים שהכנסת','pl',10,v(n.subGoal),2],['youth','מהאקדמיה לרשת','בוגר אקדמיה שהעלית לבוגרים כובש','pl',1,v(n.youthGoal),2],['star','חתימת ענק','להחתים שחקן בדירוג 80 ומעלה','pl',1,v(n.starSign),2],
  ['house','אין כרטיסים','למלא את האצטדיון הביתי','club',1,v(n.fullHouse),1],['fans','אהבת הקהל','מדד האוהדים מגיע ל־90','club',90,Math.round(v(c.fans)),2],['bank','קופה מלאה','ארבעים מיליון שקל בקופת המועדון','club',40,Math.floor(Math.max(0,v(c.money))/1e6),2],
  ['rep70','שם בענף','מוניטין 70 כמאמן','club',70,v(G.manager&&G.manager.rep),2],['rep90','אגדה','מוניטין 90 כמאמן','club',90,v(G.manager&&G.manager.rep),3],
  ['pen1','עצבי ברזל','לכבוש פנדל שבעטת בעצמך','mom',1,v(n.penScored),1],['pen10','מומחה מהנקודה','עשרה פנדלים שבעטת וכבשת','mom',10,v(n.penScored),2],['save1','ידיים של זהב','להדוף פנדל בעצמך','mom',1,v(n.penSaved),2],['save5','חוסם פנדלים','חמש הדיפות פנדל','mom',5,v(n.penSaved),3],
  ['so','דו־קרב','לנצח בדו־קרב פנדלים','mom',1,v(n.soWon),2],['shout','הקול שלך נשמע','שער בזמן "לחץ!" או "כולם קדימה"','mom',1,v(n.shoutGoal),1],['shout15','מנצח מהקווים','חמישה־עשר שערים בזמן צעקה שלך','mom',15,v(n.shoutGoal),2],
  ['blzfin','עד הגמר','להגיע לגמר טורניר בזק','blz',1,v(B.finals),1],['blz1','גביע בזק','לזכות בטורניר בזק','blz',1,v(B.cups),2],['blz5','מלך הבזק','חמש זכיות בטורניר בזק','blz',5,v(B.cups),3],['blzrow','פעמיים ברצף','שתי זכיות רצופות בטורניר בזק','blz',2,v(B.bestStreak),3]];
  return rows.map(([id,he,d,cat,g,val,s])=>({id,he,d,cat,g,v:Math.min(g,val),raw:val,s,done:!!C.ach[id]}))}
function achCheck(){const C=carEnsure();if(!C)return [];const got=[];for(const d of achDefs()){if(!d.done&&d.raw>=d.g){C.ach[d.id]={s:G.season,w:G.wk};C.fresh.push(d.id);got.push(d);try{news(`🏅 הישג חדש: ${d.he} (${d.d}).`)}catch(e){}}}return got}
function carStars(){const C=carEnsure();if(!C)return 0;let s=0;for(const d of achDefs())if(C.ach[d.id])s+=d.s;return s}
const CAR_LEVELS=[[0,'מתאמן'],[2,'עוזר מאמן'],[5,'מאמן צעיר'],[9,'מאמן מבטיח'],[14,'מאמן מוכר'],[20,'מאמן בכיר'],[27,'מאמן צמרת'],[35,'מאמן על'],[45,'אגדה מקומית'],[58,'אגדה']];
function carLevel(stars){let i=0;while(i+1<CAR_LEVELS.length&&stars>=CAR_LEVELS[i+1][0])i++;const next=CAR_LEVELS[i+1];return {n:i+1,he:CAR_LEVELS[i][1],from:CAR_LEVELS[i][0],next:next?next[0]:null,stars}}
/* the achievements closest to done (never the finished ones), nearest first */
function achNear(k){return achDefs().filter(d=>!d.done&&d.raw>0&&d.cat!=='blz').map(d=>({...d,left:d.g-d.v,frac:d.v/d.g})).sort((a,b)=>(b.frac-a.frac)||(a.left-b.left)).slice(0,k||3)}
/* state that only moves between matches (fans, bank, reputation): checked once a week */
function carWeekly(){if(carOff())return;achCheck()}

/* ---- the cabinet ---- */
const TROPHY_SVG={
  champ:'<path d="M8 6h24v6c0 9-5 15-12 16-7-1-12-7-12-16z"/><path d="M8 9H3c0 6 3 9 7 10M32 9h5c0 6-3 9-7 10"/><path d="M17 28v5h-5v4h16v-4h-5v-5"/><path d="M20 11l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" class="in"/>',
  cup:'<path d="M11 5h18l-2 14c-.5 4-3.5 7-7 7s-6.5-3-7-7z"/><path d="M11 8H6c0 5 2 8 6 9M29 8h5c0 5-2 8-6 9"/><path d="M18 26v6h-5v5h14v-5h-5v-6"/>',
  toto:'<path d="M12 7h16v9c0 5-3.5 8-8 8s-8-3-8-8z"/><path d="M18 24v7h-4v5h12v-5h-4v-7"/>',
  euro:'<path d="M9 5h22v5c0 9-4 15-11 17C13 25 9 19 9 10z"/><path d="M9 8H3c0 7 3 10 8 11M31 8h6c0 7-3 10-8 11"/><path d="M16 27v6h-4v4h16v-4h-4v-6"/><circle cx="20" cy="13" r="4" class="in"/>',
  lchamp:'<path d="M20 4l5 9 10 1.5-7.5 7 2 10L20 26.5 10.500 31.500l2-10L5 14.500 15 13z"/>',
  promo:'<path d="M20 5l12 13h-7v16H15V18H8z"/>'};
function trophySVG(k){return `<svg class="tro-ic" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="trg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".5" stop-color="#e9c46a"/><stop offset="1" stop-color="#a97c22"/></linearGradient></defs><g fill="url(#trg)" stroke="#6d4d10" stroke-width="1" stroke-linejoin="round">${TROPHY_SVG[k]||TROPHY_SVG.cup}</g></svg>`}
function medalSVG(s,done){const col=done?['#c98b5a','#cfd6e3','#f3cf5a'][s-1]:'#3a3f4d';return `<svg class="ach-ic" viewBox="0 0 32 32" aria-hidden="true"><path d="M10 2h5l3 9h-5zM22 2h-5l-3 9h5z" fill="${done?'#b33a4a':'#2a2e39'}"/><circle cx="16" cy="19" r="10" fill="${col}" stroke="${done?'rgba(0,0,0,.35)':'#4a4f5e'}" stroke-width="1.2"/>${[0,1,2].map(i=>i<s?`<circle cx="${16+(i-(s-1)/2)*6}" cy="19" r="2" fill="${done?'rgba(0,0,0,.55)':'#4a4f5e'}"/>`:'').join('')}</svg>`}
function achBarHTML(d){return `<div class="ach-bar"><i style="width:${Math.round(d.v/d.g*100)}%"></i></div>`}
function achRowHTML(d){return `<div class="ach ${d.done?'done':''}">${medalSVG(d.s,d.done)}<div class="ach-tx"><b>${esc(d.he)}</b><small>${esc(d.d)}</small>${d.done?'':achBarHTML(d)}</div><span class="ach-n num">${d.done?'✓':`<bdi>${d.v}/${d.g}</bdi>`}</span></div>`}
function carRecordsHTML(){const C=carEnsure(),R=C.rec,n=C.n,c=me();const rows=[];const row=(l,v2)=>rows.push(`<div class="recrow"><span>${l}</span><b>${v2}</b></div>`);
  row('משחקים רשמיים',`<bdi>${n.mp||0}</bdi> · <bdi>${n.w||0}</bdi> נ׳ · <bdi>${n.d||0}</bdi> ת׳ · <bdi>${n.l||0}</bdi> ה׳`);row('שערים',`<bdi>${n.gf||0}</bdi> בעד · <bdi>${n.ga||0}</bdi> נגד`);
  if(R.bigWin)row('הניצחון הגדול',`<bdi dir="ltr">${R.bigWin.gf}:${R.bigWin.ga}</bdi> על ${esc(R.bigWin.opp)} <small class="muted">(${esc(R.bigWin.season)})</small>`);
  if(R.bestW)row('רצף הניצחונות הארוך',`<bdi>${R.bestW}</bdi>${C.st.w>=2?` <small class="muted">(עכשיו ${C.st.w})</small>`:''}`);if(R.bestUnb)row('רצף בלי הפסד',`<bdi>${R.bestUnb}</bdi>${C.st.unb>=3?` <small class="muted">(עכשיו ${C.st.unb})</small>`:''}`);
  if(R.topScorer)row('מלך השערים בעונה',`${esc(R.topScorer.name)} · <bdi>${R.topScorer.g}</bdi> <small class="muted">(${esc(R.topScorer.season)})</small>`);
  if(R.bestPos)row('המיקום הטוב ביותר',`מקום <bdi>${R.bestPos.pos}</bdi> בליגת העל <small class="muted">(${esc(R.bestPos.season)})</small>`);if(R.pts)row('שיא נקודות בעונה',`<bdi>${R.pts.n}</bdi> <small class="muted">(${esc(R.pts.season)})</small>`);
  if(c&&c.attRecord)row('שיא קהל בבית',`<bdi>${c.attRecord.n.toLocaleString('he')}</bdi> מול ${esc(c.attRecord.opp)}`);
  return rows.join('')}
function viewCareer(){const C=carEnsure();achCheck();const defs=achDefs();const stars=carStars();const L=carLevel(stars);const done=defs.filter(d=>d.done).length;C.fresh=[];
  const pct=L.next==null?100:Math.round((stars-L.from)/(L.next-L.from)*100);const near=achNear(3);
  const shelf=C.tr.length?C.tr.slice().reverse().map(t=>`<div class="tro">${trophySVG(t.k)}<b>${esc(t.name)}</b><small><bdi dir="ltr">${esc(t.season)}</bdi> · ${esc(t.club||'')}</small></div>`).join(''):`<div class="tro empty">${trophySVG('cup')}<b>המדף מחכה לגביע הראשון</b><small>אליפות, גביע המדינה, גביע הטוטו, אירופה ועלייה יוצגו כאן</small></div>`;
  return `<div class="card car-head"><button class="btn sm sec" data-view-home>חזרה</button><div class="car-lv"><span class="car-lvn num">${L.n}</span><div><h2>${esc(G.manager.name)}</h2><div class="muted small">${esc(L.he)} · <bdi>${done}</bdi> מתוך <bdi>${defs.length}</bdi> הישגים · <bdi>${stars}</bdi> כוכבים</div><div class="ach-bar lv"><i style="width:${pct}%"></i></div><div class="muted tiny">${L.next==null?'הרמה הגבוהה ביותר':`עוד <bdi>${L.next-stars}</bdi> כוכבים לרמה <bdi>${L.n+1}</bdi> (${esc(CAR_LEVELS[L.n][1])})`}</div></div></div></div>
  <div class="card"><h3 class="sec">ארון הגביעים</h3><div class="shelf">${shelf}</div></div>
  ${near.length?`<div class="card"><h3 class="sec">הכי קרוב</h3><div class="achlist">${near.map(achRowHTML).join('')}</div></div>`:''}
  <div class="card"><h3 class="sec">שיאים</h3><div class="recs">${carRecordsHTML()}</div></div>
  ${ACH_CATS.map(([k,l])=>{const ds=defs.filter(d=>d.cat===k);const n=ds.filter(d=>d.done).length;return `<details class="card achcat"><summary><h3 class="sec">${l}</h3><span class="muted small"><bdi>${n}/${ds.length}</bdi></span></summary><div class="achlist">${ds.map(achRowHTML).join('')}</div></details>`}).join('')}`}
/* the home screen: level and the two achievements nearest to done */
function careerCardHTML(){if(carOff()||G.phase!=='play')return '';const C=carEnsure();achCheck();const stars=carStars(),L=carLevel(stars);const near=achNear(2);const fresh=C.fresh.length;
  return `<div class="card car-home"><div class="row between"><h3 class="sec">הקריירה שלך</h3><button class="btn sm sec" data-goview="career">ארון הגביעים${fresh?` <span class="tag good">${fresh} חדש</span>`:''}</button></div>
  <div class="muted small">רמה <bdi>${L.n}</bdi> · ${esc(L.he)}${C.tr.length?` · <bdi>${C.tr.length}</bdi> תארים`:''}${C.st.w>=2?` · רצף של <bdi>${C.st.w}</bdi> ניצחונות`:''}</div>
  ${near.length?`<div class="achlist" style="margin-top:8px">${near.map(achRowHTML).join('')}</div>`:''}</div>`}
