/* GOALASSO START — depth: what a season needs beyond the next match.
   Fitness that carries from one match to the next, the numbers of a match at the break and at the end, the season's calendar, and the
   people beside the coach. Everything here changes a career from an event (a match that ended, a button) and never while a screen is drawn. */

/* ---------- fitness between matches ----------
   A match costs whoever played it (BFIT_COST for ninety minutes, in proportion to minutes, a goalkeeper far less) and the days until the
   next one give it back: a week after a league round, three days after a cup tie or a European night. A week gives back one match, so
   whoever plays once a week is always at 100 and there is nothing to manage. Three days give back next to nothing: whoever played on
   Wednesday starts Saturday at about 79, and a second midweek running takes him to about 67. While he keeps playing the debt is paid
   slowly (79, 87, 93, 99); one match on the bench pays all of it.
   What tired legs cost is the engine's own: effOvr takes (85−fit)/6 at the whistle and minuteFatigue more as liveEnergy falls under
   82. Measured over 2,400 matches a level against a fresh opponent, a good side's eleven at 80 takes .30 of a point less from a match,
   at 75 .38, at 70 .53, at 65 .72 and at 60 .94 (of 1.85). The first numbers gave 8 back in midweek: the second match of a week began
   at 86, where the engine takes next to nothing, and a season in which nobody was ever rested ended with the same points. The owner
   was told so and answered that playing tired has to hurt the results, which is what these numbers are for. */
const BFIT_COST=30,BFIT_WEEK=30,BFIT_MID=4,BFIT_TIRED=75,BFIT_WARN=85,BFIT_FLOOR=35,BFIT_EDGE=.5;
const BfitOf=p=>Math.round(p.fit??100);
function BfitOn(){const b=typeof G!=='undefined'&&G?G.beginner:null;return !!b&&!b.daily&&!window.__noFatigue}
/* What tired legs cost a man over ninety minutes, in rating points, against himself fresh: the engine's two rules added up (liveEnergy's
   curve at an ordinary pace, minuteFatigue under 82, effOvr under 85). A table, because every card of a list asks. */
const BFIT_TAB={};
function BfitFade(fit,pos){const g=pos==='GK'?1:0,f=clamp(Math.round(fit),0,100),k=g*101+f;if(BFIT_TAB[k]==null){const r=g?.35:1;let s=0;for(let m=1;m<=90;m++){const en=clamp(f-m*.16*r-Math.max(0,m-60)*.35*r,15,100);if(en<82)s+=(82-en)/40*6}BFIT_TAB[k]=s/90}return BFIT_TAB[k]}
function BfitLoss(p){const f=p.fit??100;return f>=100?0:Math.max(0,(85-f)/6)+BfitFade(f,p.pos)-BfitFade(100,p.pos)}
const BfitToday=p=>effOvr(p)-BfitFade(p.fit??100,p.pos);   /* who plays better today: effOvr knows how a man starts, this adds how he fades */
const BfitAs=p=>Math.round(p.ovr-BfitLoss(p));           /* "plays like a 77" */
const BfitPts=n=>{const k=Math.max(1,Math.round(n));return k===1?'נקודת כוח אחת':`<bdi>${k}</bdi> נקודות כוח`};
/* where a man who is fresh now will stand at the next kick-off if he plays all of a midweek match */
function BfitAfterMid(){const f=100-BFIT_COST*(1-.06*BstaffLv('fit'));return Math.round(f+BFIT_MID+BstaffLv('fit')+(100-f)*.15)}
/* an evening before the first league round has a week after it, like a friendly: nobody opens a season on tired legs */
function BfitGap(){const b=Bstate();return b&&b.round>0?BFIT_MID:BFIT_WEEK}
/* Both sides of every match pay for it, and every club rests in the week between two rounds: the opponent who played a cup tie on
   Wednesday arrives with the legs of one. A tie that is decided without a match (the cups' other ties) costs its eleven the same.
   Whoever started under BFIT_TIRED and played a half or more may pull a muscle (a match or two out): the engine's own injuries only
   choose a tired man more often, they do not come more often, and the squad screen says a tired man is hurt easily. */
function BfitAfter(M){if(!BfitOn()||!M)return;const mid=M.bCL!=null||!!M.bX,pre=!!(M.bX&&M.bX.kind==='pre');
  for(const id of [M.h,M.a]){const c=club(id);if(!c)continue;const k=id===G.me?1-.06*BstaffLv('fit'):1;
    const pay=(pid,mins)=>{const p=c.players.find(x=>x.id===pid);if(!p)return;const f0=p.fit??100;p.fit=clamp(Math.round(f0-mins/90*BFIT_COST*(p.pos==='GK'?.4:1)*k),BFIT_FLOOR,100);
      if(f0<BFIT_TIRED&&mins>=45&&!p.inj&&p.pos!=='GK'&&!pre&&!window.__noStrain&&Math.random()<Math.min(.08,(BFIT_TIRED-f0)*.003)){setInjury(p,Math.random()<.35?2:1);p.injT='מתיחת שריר מעומס';if(id===G.me)(M.bStrain=M.bStrain||[]).push({name:fullName(p),fit:Math.round(f0),n:p.inj})}};
    for(const e of (M.xi&&M.xi[id])||[])pay(e.pid,Math.max(0,Math.min(M.m,90)-(e.since||0)));
    for(const pid of (M.used&&M.used[id])||[])pay(pid,Math.min(90,(M.mins&&M.mins[id]&&M.mins[id][pid])??60));
    if(mid)BfitRestClub(c,pre?BFIT_WEEK:BfitGap())}}   /* a cup tie or a European night is midweek; a friendly has a week after it */
function BfitRestClub(c,base){if(!c)return;const add=base+(c.id===G.me?(base>=BFIT_WEEK?3:1)*BstaffLv('fit'):0);for(const p of c.players){const f=p.fit??100;if(f<100)p.fit=clamp(Math.round(f+add+(100-f)*.15),0,100)}}
function BfitRest(base){if(!BfitOn())return;for(const c of G.clubs)BfitRestClub(c,base)}
function BfitQuick(c){if(!BfitOn()||!c||c.id===G.me)return;let xi=[];try{xi=bestXI(c)}catch(e){}for(const p of xi)p.fit=clamp(Math.round((p.fit??100)-BFIT_COST*(p.pos==='GK'?.4:1)),BFIT_FLOOR,100);BfitRestClub(c,BfitGap())}
function BfitSummer(){for(const c of G.clubs)for(const p of c.players)if(p.fit!=null&&p.fit<100)p.fit=100;const b=Bstate();if(b)b.rest=[]}
/* back from an injury he is not at once the player he was: BFIT_BACK, and a doctor on the staff brings him back nearer the top */
const BFIT_BACK=80;
function BfitBack(p,c){if(!BfitOn())return;p.fit=Math.min(p.fit??100,BFIT_BACK+(c&&c.id===G.me?4*BstaffLv('phys'):0))}
const BfitXI=c=>(c.lineup||[]).map(id=>c.players.find(p=>p.id===id)).filter(Boolean);
/* Who should rest: a man of the eleven under BFIT_WARN, when the best free man of his place would play better today by BFIT_EDGE.
   The foreign-player limit is kept and the goal is left alone. rows = [{p,slot}] in the eleven's order; returns [[index,out,in]]. */
function BfitSwaps(c,rows){const on=new Set(rows.filter(r=>r&&r.p).map(r=>r.p.id)),pool=available(c).filter(p=>!on.has(p.id)&&p.pos!=='GK'),lim=foreignLimited(c),out=[];let fo=rows.filter(r=>r&&r.p&&r.p.foreign).length;
  rows.map((r,i)=>({r,i})).filter(x=>x.r&&x.r.p&&x.r.slot!=='GK'&&x.r.p.pos!=='GK'&&BfitOf(x.r.p)<BFIT_WARN).sort((x,y)=>BfitOf(x.r.p)-BfitOf(y.r.p)).forEach(({r,i})=>{
    const q=pool.filter(q=>q.pos===r.slot&&!(lim&&q.foreign&&!r.p.foreign&&fo>=MAX_FOREIGN_XI)).sort((x,y)=>BfitToday(y)-BfitToday(x))[0];
    const cap=c.captain===r.p.id?(r.p.pers==='leader'?13.2:6.6):0;   /* a captain on the pitch is worth .6 to all eleven (a born leader 1.2): he rests only when his legs cost more than that */
    if(q&&BfitToday(q)>=BfitToday(r.p)+cap+BFIT_EDGE){out.push([i,r.p,q]);pool.splice(pool.indexOf(q),1);fo+=(q.foreign?1:0)-(r.p.foreign?1:0)}});
  return out}
/* The other clubs rest their tired men too. The engine picks an eleven by effOvr, which knows how a tired man starts and nothing of how
   he fades, so it kept a regular at 67 in front of a fresh man three points under him — and a league of clubs that all play tired is a
   league in which playing tired costs the coach nothing. One more look at the eleven the engine chose, in a beginner career with
   fatigue on and nowhere else: the shared league, the penalty cup and the daily challenge get the engine's eleven as it is. */
const bestXI0=bestXI;
bestXI=function(c,formation){const xi=bestXI0(c,formation);if(!c||!BfitOn())return xi;try{for(const [,o,q] of BfitSwaps(c,xi.map(p=>({p,slot:p.pos}))))xi[xi.indexOf(o)]=q}catch(e){}return xi};
/* the coach's own eleven: who the game would rest (read only), and the button that does it */
function BfitFreshList(c){if(!BfitOn()||!c||!c.lineup)return [];const slots=slotsFor(c.formation);return BfitSwaps(c,c.lineup.map((id,i)=>({p:c.players.find(p=>p.id===id&&!p.inj&&!p.susp),slot:slots[i]})))}
function BfitFreshen(c=me()){const sw=BfitFreshList(c),b=Bstate(),mine=b&&c.id===G.me;for(const [i,o,q] of sw){c.lineup[i]=q.id;if(mine){b.rest=(b.rest||[]).filter(x=>x.i!==i&&x.out!==q.id);b.rest.push({i,out:o.id,in:q.id})}}return sw}
/* A man the button rested comes back by himself. Without this the press was a trap: the regular sat on the bench at 100 for as long as
   the coach did not think of him, and a season in which the button was pressed before every match ended under one in which nobody was
   ever rested. Once the match he sat out is over and the days after it have passed, he takes his place back when his legs are back
   (BFIT_WARN) — unless the coach has done something else with that place since, which is his to decide. */
function BfitReturn(){const b=Bstate(),c=me();if(!b||!c||!b.rest||!b.rest.length)return;const keep=[],back=[];
  for(const r of b.rest){const P=c.players.find(p=>p.id===r.out);if(!P||!c.lineup||c.lineup[r.i]!==r.in||c.lineup.includes(P.id))continue;
    if(P.inj||P.susp||BfitOf(P)<BFIT_WARN){keep.push(r);continue}c.lineup[r.i]=P.id;back.push(P.id)}
  b.rest=keep;return back}
/* what tiredness takes off an eleven, in the points of the power bar: the coach's eleven as he set it, anybody else's as it will play */
function BfitTeam(c){if(!BfitOn()||!c)return 0;let xi=[];try{xi=c.id===G.me?BfitXI(c).filter(p=>!p.inj&&!p.susp):bestXI(c)}catch(e){}return xi.length?xi.reduce((s,p)=>s+BfitLoss(p),0)/xi.length:0}
const BfitTired=c=>BfitXI(c).filter(p=>!p.inj&&!p.susp&&BfitOf(p)<BFIT_WARN).sort((a,b)=>BfitOf(a)-BfitOf(b));
function BfitTiredOp(c){let xi=[];try{xi=bestXI(c)}catch(e){}return xi.filter(p=>BfitOf(p)<BFIT_WARN).sort((a,b)=>BfitOf(a)-BfitOf(b))}
function BfitChip(p){const f=BfitOf(p);return p.inj||p.susp||f>=BFIT_WARN?'':`<span class="bfit-chip ${f<BFIT_TIRED?'bad':'warn'}">כושר <bdi>${f}%</bdi></span>`}
function BfitStripHTML(c){const t=BfitOn()?BfitTired(c):[];if(!t.length)return '';const loss=BfitTeam(c),sw=BfitFreshList(c);
  return `<div class="bout-strip tired" role="status"><strong>עייפים בהרכב${loss>=.5?` · ההרכב חלש היום ב${loss<1.5?'':'־'}${BfitPts(loss)}`:''}</strong><ul>${t.map(p=>`<li class="bfit-row${BfitOf(p)<BFIT_TIRED?' bad':''}"><b>${esc(fullName(p))}</b><span>כושר <bdi>${BfitOf(p)}%</bdi>${BfitAs(p)<p.ovr?` · משחק כמו <bdi>${BfitAs(p)}</bdi>`:''}</span></li>`).join('')}</ul>${sw.length?`<div class="bfit-act">${Bbutton(sw.length>1?`תן ל־<bdi>${sw.length}</bdi> העייפים לנוח`:'תן לעייף לנוח','data-action="freshen"','secondary')}<span>${sw.length>1?'בספסל יש מי שישחקו היום טוב מהם':`${esc(sw[0][2].last||sw[0][2].first||fullName(sw[0][2]))} מהספסל ישחק היום טוב ממנו`}. מי שנח חוזר להרכב לבד אחרי המשחק, כשהוא רענן.</span></div>`:'<small class="bfit-none">אין כרגע בספסל מי שישחק טוב מהם באותן עמדות.</small>'}<small>שחקן עייף מתחיל את המשחק חלש יותר, דועך מוקדם ונפצע בקלות. משחק אחד על הספסל מחזיר אותו לכושר מלא.</small></div>`}
/* before the whistle: what tiredness takes off the eleven as it stands, and before a midweek match what it will leave for Saturday */
function BfitPreHTML(cup){if(!BfitOn())return '';const c=me(),t=BfitTired(c),loss=BfitTeam(c),b=Bstate(),out=[];
  if(t.length&&loss>=.5){const sw=BfitFreshList(c);out.push(`<p class="bnote bfit-note${loss>=2?' bad':''}">העייפות מורידה מההרכב שלך ${loss<1.5?'':'כ־'}${BfitPts(loss)}${BstaffLv('asst')&&sw.length?'':`: ${t.slice(0,6).map(p=>`${esc(p.last||p.first||fullName(p))} <bdi>${BfitOf(p)}%</bdi>`).join(' · ')}${t.length>6?' ועוד':''}`}.${sw.length?` ${sw.length>1?`ל־<bdi>${sw.length}</bdi> מהם יש בספסל מחליף שישחק היום טוב יותר`:'לאחד מהם יש בספסל מחליף שישחק היום טוב יותר'}: ${Bbutton(sw.length>1?'תן להם לנוח':'תן לו לנוח','data-action="freshen-pre"','secondary')}`:''}</p>`)}
  if(cup&&cup.kind!=='pre'&&b.round>0&&b.schedule[b.round]){const nx=Bnext(),op=nx?club(nx.find(id=>id!==c.id)):null,f=BfitAfterMid();if(f<BFIT_WARN)out.push(`<p class="bnote bfit-mid">בעוד שלושה ימים משחק ליגה${op?' מול '+esc(op.name):''}. מי שישחק הערב משחק מלא יגיע אליו בכושר של כ־<bdi>${f}%</bdi>, ושחקן שינוח הערב יגיע רענן.</p>`)}
  return out.join('')}
/* ---------- the numbers of a match ----------
   The live screen showed shots and possession; the break was a pause and the end was a score, scorers and ratings. The break is now a
   window of its own — the score, who scored, the numbers, the approach for the second half, who is running out of legs, and the way to
   the substitutions — and the same numbers stand under every result. */
function BstatRows(M){const h=M.h,a=M.a,tp=(M.poss[h]||0)+(M.poss[a]||0),ph=tp?Math.round((M.poss[h]||0)/tp*100):50,sot=M.sot||{},cnt=(t,id)=>M.ev.filter(e=>e.t===t&&e.team===id).length;
  let xh=0,xa=0;try{xh=bcXG(M,h)||0;xa=bcXG(M,a)||0}catch(e){}
  const rows=[['בעיטות לשער',M.shots[h]||0,M.shots[a]||0],['מהן למסגרת',sot[h]||0,sot[a]||0],['החזקת כדור',ph,100-ph,'%'],['שערים צפויים',+xh.toFixed(1),+xa.toFixed(1)],['קרנות',cnt('corner',h),cnt('corner',a)],['כרטיסים צהובים',cnt('yellow',h),cnt('yellow',a)]];
  if(cnt('red',h)+cnt('red',a))rows.push(['כרטיסים אדומים',cnt('red',h),cnt('red',a)]);return rows}
function BmatchStatsHTML(M){let rows,col={h:{fill:'#00FF9D'},a:{fill:'#8fa3c4'}};try{rows=BstatRows(M);col=matchColors(club(M.h),club(M.a))}catch(e){if(!rows)return ''}
  return `<section class="bstats" style="--hc:${esc(col.h.fill)};--ac:${esc(col.a.fill)}"><h3>המשחק במספרים</h3>${rows.map(([l,vh,va,u])=>{const t=vh+va,wh=t?vh/t*100:50;return `<div class="bstat"><bdi class="v">${vh}${u||''}</bdi><span class="m"><span class="l">${l}</span><span class="bars"><i class="h" style="width:${wh.toFixed(1)}%"></i><i class="a" style="width:${(100-wh).toFixed(1)}%"></i></span></span><bdi class="v">${va}${u||''}</bdi></div>`}).join('')}</section>`}
function BmatchFactsHTML(M,bare){return BmatchFacts0(M)+(M&&M.bStrain&&M.bStrain.length?`<p class="bnote bad bfit-strain">${M.bStrain.map(x=>`<strong>${esc(x.name)}</strong> שיחק עייף (<bdi>${x.fit}%</bdi>) ומתח שריר: ${x.n===1?'משחק אחד בחוץ':`<bdi>${x.n}</bdi> משחקים בחוץ`}`).join('. ')}.</p>`:'')+(bare?'':BmatchStatsHTML(M))}
function BhalfDialog(M){const c=me(),ment=liveMentality(M,c),left=MAX_SUBS-((M.subs&&M.subs[c.id])||0);
  const tired=xiPlayers(M,c).map(x=>({p:x.p,en:liveEnergy(M,c,x.p,x.e,M.m)})).filter(x=>x.p.pos!=='GK'&&x.en<BFIT_TIRED).sort((x,y)=>x.en-y.en).slice(0,3);
  Bdialog(`<div class="bresult bhalf"><span class="beyebrow">מחצית</span>${BresultBoard(M)}${BmatchFacts0(M)}${BmatchStatsHTML(M)}<section class="bmatch-tactics bhalf-ment"><span>איך נשחק במחצית השנייה?</span>${BMENT.map(([k,t])=>Bbutton(t,`data-bmentality="${k}" aria-pressed="${k===ment}"`,'secondary')).join('')}<p class="bment-note bment-live" data-k="${ment}">${BMENT_WHAT[ment]}</p></section>${tired.length?`<p class="bnote">הכי עייפים על המגרש: ${tired.map(x=>`${esc(fullName(x.p))} <bdi>${x.en}%</bdi>`).join(' · ')}.${left>0?' מחליף רענן ייתן יותר במחצית השנייה.':''}</p>`:''}<div class="bdock">${Bbutton('למחצית השנייה','data-bhalf-go')}${left>0?Bbutton('⇄ חילופים','data-blive="subs"','secondary'):''}</div></div>`)}

/* ---------- the season's calendar ----------
   The coach saw the next match and nothing after it. Every match of his club this season in one list: friendlies, league rounds, cup
   ties and European nights in the order they are played, the results of what was played and what is still ahead. What was played is kept
   in b.cal (one short record a match, this season only); a league round played before this existed is listed without its score. */
function BcalLog(M){const b=Bstate(),c=me();if(!b||b.daily||!c||!M)return;const home=M.h===c.id,op=club(home?M.a:M.h);if(!op)return;
  const k=M.bCL!=null?'cl':M.bX?M.bX.kind:'lg';b.cal=(b.cal||[]).filter(x=>x.s===b.season);
  b.cal.push({s:b.season,k,r:b.round,t:k==='lg'?'':k==='cl'?'ליגת האלופות · '+BCL_STAGES[M.bCL]:BextraLabel(M),op:op.name,home,nt:!!(M.ctx&&M.ctx.neutral),gf:home?M.gh:M.ga,ga:home?M.ga:M.gh,pk:M.pens?((M.pens==='h')===home?1:-1):0})}
function BcalRows(){const b=Bstate(),c=me(),n=b.schedule.length,log=(b.cal||[]).filter(x=>x.s===b.season),rows=[];
  const lg=r=>{const pair=b.schedule[r].find(p=>p.includes(c.id));if(!pair)return {k:'lg',r,rest:1};const op=club(pair.find(id=>id!==c.id));return {k:'lg',r,op:op?op.name:'',home:pair[0]===c.id}};
  for(let r=0;r<b.round;r++){for(const x of log)if(x.r===r&&x.k!=='lg')rows.push({...x,past:1});const L=log.find(x=>x.r===r&&x.k==='lg');if(L){rows.push({...L,past:1});continue}const base=lg(r),st=(G.paper||[]).find(x=>x.ev&&x.ev.type==='match'&&x.s===b.season&&x.wk===r&&(x.ev.h===c.id||x.ev.a===c.id));rows.push(st&&!base.rest?{...base,past:1,gf:st.ev.h===c.id?st.ev.gh:st.ev.ga,ga:st.ev.h===c.id?st.ev.ga:st.ev.gh,pk:0}:{...base,past:1,unk:1})}
  for(const x of log)if(x.r===b.round&&x.k!=='lg')rows.push({...x,past:1});
  /* ahead: the matches that are not league rounds, each before the league round it is played ahead of */
  const ahead=[];if(b.pre&&b.pre.season===b.season&&b.round===0&&!b.pre.skip)for(const f of b.pre.list)if(!f.res&&club(f.id))ahead.push({at:0,o:0,k:'pre',t:'משחק הכנה',op:club(f.id).name,home:!!f.home});
  for(const kind of BCUP_KINDS){const K=b.cups&&b.cups[kind];if(!K||K.out||K.won||K.season!==b.season)continue;for(let st=K.stage;st<K.names.length;st++){const fin=st===K.names.length-1,row={at:Math.max(K.at[st],b.round),o:kind==='toto'?1:2,k:kind,t:K.name+' · '+K.names[st],nt:fin};
      if(st===K.stage){const t=K.ties.find(t=>t.includes(c.bkey));if(!t){if(!(K.bye||[]).includes(c.bkey))break;row.bye=1}else{row.op=BcupName(t[0]===c.bkey?t[1]:t[0]);row.home=t[0]===c.bkey}}else row.maybe=1;ahead.push(row)}}
  const k=b.cl;if(k&&!k.out&&!k.won&&k.season===b.season&&k.alive.includes(c.id))for(let st=k.stage;st<4;st++){const row={at:Math.max(k.at[st],b.round),o:3,k:'cl',t:'ליגת האלופות · '+BCL_STAGES[st],nt:st===3};
      if(st===k.stage){const t=k.ties.find(t=>t.includes(c.id));if(!t)break;const op=club(t[0]===c.id?t[1]:t[0]);row.op=op?op.name:'';row.home=t[0]===c.id}else row.maybe=1;ahead.push(row)}
  for(let r=b.round;r<n;r++){for(const x of ahead.filter(x=>x.at===r).sort((p,q)=>p.o-q.o))rows.push(x);rows.push(lg(r))}
  const nx=rows.find(x=>!x.past&&!x.rest&&!x.bye&&!x.maybe);if(nx)nx.next=1;return rows}
function BcalRowHTML(x){const b=Bstate(),when=x.k==='lg'?`מחזור <bdi>${x.r+1}</bdi>`:esc(x.t),place=x.nt?'מגרש ניטרלי':x.home?'בית':'חוץ';
  if(x.rest)return `<li class="bcal-row rest${x.past?' past':''}"><span class="bcal-when">${when}</span><span class="bcal-op"><b>מנוחה</b><small>הקבוצה לא משחקת במחזור הזה</small></span></li>`;
  if(x.bye)return `<li class="bcal-row rest"><span class="bcal-when">${when}</span><span class="bcal-op"><b>עולים בלי משחק</b><small>הקבוצה פטורה מהשלב הזה</small></span></li>`;
  if(x.maybe)return `<li class="bcal-row maybe"><span class="bcal-when">${when}</span><span class="bcal-op"><b>אם תעלו</b><small>היריבה תיקבע בהגרלה</small></span></li>`;
  let res='';if(x.past&&!x.unk){const w=x.gf>x.ga||x.pk>0,l=x.gf<x.ga||x.pk<0,cls=w?'w':l?'l':'d';res=`<span class="bcal-res ${cls}"><b>${w?'ניצחון':l?'הפסד':'תיקו'}</b><bdi>${Math.max(x.gf,x.ga)}:${Math.min(x.gf,x.ga)}</bdi>${x.pk?'<small>בפנדלים</small>':''}</span>`}
  else if(x.past)res='<span class="bcal-res"><small>שוחק</small></span>';else if(x.next)res='<span class="bcal-res next"><b>המשחק הבא</b></span>';
  return `<li class="bcal-row ${x.k}${x.past?' past':''}${x.next?' next':''}"><span class="bcal-when">${when}</span><span class="bcal-op"><b>${esc(x.op||'')}</b><small>${place}</small></span>${res}</li>`}
function BcalendarHTML(){const b=Bstate(),rows=BcalRows(),played=rows.filter(x=>x.past&&!x.unk&&!x.rest&&x.k!=='pre'),w=played.filter(x=>x.gf>x.ga||x.pk>0).length,l=played.filter(x=>x.gf<x.ga||x.pk<0).length;
  return `<section class="bpanel bcal"><h2>לוח המשחקים · עונה <bdi>${b.season}</bdi></h2><p class="bmuted">כל המשחקים של ${esc(me().name)} העונה, לפי הסדר: ליגה, גביעים${b.cl&&b.cl.season===b.season?', אירופה':''} ומשחקי הכנה.${played.length?` עד עכשיו: <bdi>${w}</bdi> ניצחונות, <bdi>${played.length-w-l}</bdi> תיקו, <bdi>${l}</bdi> הפסדים.`:''}</p><ol class="bcal-list">${rows.map(BcalRowHTML).join('')}</ol></section>`}
function BtilesMoreHTML(){const book=typeof BbookView==='function',n=book&&typeof BbookFresh==='function'?BbookFresh():0;
  return `<div class="atiles three"><button type="button" class="atile" data-tab="staff">${Bui('tactics')}<span>צוות מקצועי</span></button><button type="button" class="atile" data-calendar>${Bui('ball')}<span>לוח משחקים</span></button>${book?`<button type="button" class="atile" data-tab="book">${Bui('trophy')}${n?`<b class="adot new"><bdi>${n}</bdi></b>`:''}<span>ספר הקריירה</span></button>`:''}</div>`}
let Bleagueview='table';
const BleagueSeg=()=>`<div class="bseg bleague-view" role="tablist"><button type="button" role="tab" data-leagueview="table" aria-selected="${Bleagueview!=='cal'}">טבלאות</button><button type="button" role="tab" data-leagueview="cal" aria-selected="${Bleagueview==='cal'}">לוח משחקים</button></div>`;

/* ---------- the people beside the coach ----------
   Five roles, three levels each, hired with the club's money: a signing fee and a yearly salary that is paid a little every round like
   every other running cost. Each gives something a match or a week can feel — nothing here is a number for its own sake. The staff is the
   coach's own and goes with him to his next club. */
const BSTAFF={
  asst:{name:'עוזר מאמן',ic:'tactics',lv:['לפני כל משחק הוא אומר איזו גישה מתאימה ומי עייף','כל אימון קבוצתי נותן צעד נוסף','כל אימון אישי נותן צעד נוסף']},
  fit:{name:'מאמן כושר',ic:'boot',lv:['השחקנים מתאוששים מהר יותר בין משחקים','התאוששות מהירה עוד יותר, ומשחק מעייף פחות','הסגל עומד גם בשבוע של שני משחקים']},
  phys:{name:'רופא הקבוצה',ic:'shield',lv:['פציעה של שלושה משחקים ומעלה מתקצרת במשחק','כל פציעה של שני משחקים ומעלה מתקצרת במשחק','פציעות ארוכות מתקצרות בשני משחקים']},
  anal:{name:'אנליסט',ic:'gear',lv:['דו״ח על היריבה לפני כל משחק, והקבוצה מגיעה מוכנה יותר','הדו״ח כולל גם את הכובש שלהם ואיך הם ישחקו, והיתרון גדל','היתרון הגדול ביותר שהכנה למשחק יכולה לתת']},
  scout:{name:'סקאוט',ic:'transfer',lv:['רואים את תקרת הדירוג של כל שחקן בשוק','מועדונים מוכנים לרדת יותר במחיר במיקוח','המחיר הטוב ביותר שאפשר להשיג במיקוח']}};
const BSTAFF_MAX=3;
/* The staff are people. Each role has three candidates at a time — a name, one to three stars, a word about him, and his own price
   (a good man can be a bargain and a famous one dear). Hiring one replaces whoever holds the role, and three new candidates come.
   The list is a function of the coach, the season, the role and how many he has hired for it, so drawing the screen deals nothing. */
const BSTAFF_FIRST=['אבי','יוסי','רוני','אלי','מוטי','שלומי','גיא','ניר','עומר','איתי','דני','רן','אורן','טל','עידו','יניב','ברק','אסף','נועם','שי','מיכאל','דוד','אלון','יובל'];
const BSTAFF_LAST=['לוי','כהן','מזרחי','פרץ','ביטון','אוחנה','דהן','אברהם','פרידמן','אזולאי','שפירא','גבאי','חדד','מלכה','סויסה','בן דוד','קליין','רוזן','נחום','טייב','זכאי','אשכנזי','עמר','וקנין'];
const BSTAFF_TAG=['ותיק עם שנים של ניסיון','צעיר, רעב ומעודכן','עבד שנים בחו״ל','גדל במחלקות הנוער','שחקן עבר שעבר לצוות','אוסף תעודות מכל קורס אפשרי','שקט, יסודי ולא מפספס פרט','אהוב על השחקנים'];
function BstaffOf(k){const b=Bstate(),v=b&&!b.daily&&b.staff?b.staff[k]:null;return typeof v==='number'?(v?{lv:v,name:'',f:1}:null):(v&&v.lv?v:null)}
function BstaffLv(k){const v=BstaffOf(k);return v?v.lv:0}
function BstaffFee(to){return Math.max(80000*to,Math.round(Bsum()*.008*to/10000)*10000)}
function BstaffWage(lv){return lv?Math.max(30000*lv,Math.round(Bsum()*.004*lv/10000)*10000):0}
function BstaffPay(){const b=Bstate();if(!b||!b.staff)return 0;return Object.keys(BSTAFF).reduce((t,k)=>{const v=BstaffOf(k);return t+(v?Math.round(BstaffWage(v.lv)*(v.f||1)/10000)*10000:0)},0)}
function BstaffCands(k){const b=Bstate(),rnd=lgRng(lgHashN('goalasso-staff:'+(b.coach||'')+':'+b.season+':'+k+':'+((b.staffN&&b.staffN[k])||0))),cur=BstaffOf(k),taken=new Set(Object.keys(BSTAFF).map(x=>(BstaffOf(x)||{}).name)),out=[];
  const lvs=[0,0,0].map(()=>{const r=rnd();return r<.4?1:r<.78?2:3});if(cur&&cur.lv<BSTAFF_MAX&&!lvs.some(l=>l>cur.lv))lvs[0]=cur.lv+1;if(!cur&&!lvs.includes(1))lvs[2]=1;
  for(let i=0;i<3;i++){let name='';for(let g=0;g<20&&(!name||taken.has(name));g++)name=BSTAFF_FIRST[Math.floor(rnd()*BSTAFF_FIRST.length)]+' '+BSTAFF_LAST[Math.floor(rnd()*BSTAFF_LAST.length)];taken.add(name);
    const f=Math.round((.8+rnd()*.5)*20)/20,lv=lvs[i];out.push({i,name,lv,f,tag:BSTAFF_TAG[Math.floor(rnd()*BSTAFF_TAG.length)],fee:Math.round(BstaffFee(lv)*f/10000)*10000,wage:Math.round(BstaffWage(lv)*f/10000)*10000})}
  return out}
function BstaffWhy(k,cand){const b=Bstate();if(!b||b.live||b.out)return 'לא עכשיו';if(!cand)return 'אין מועמד';if(me().money<cand.fee)return 'אין מספיק כסף';return ''}
function BstaffHire(k,i){const b=Bstate(),S=BSTAFF[k],cand=S&&BstaffCands(k)[i];if(!S||BstaffWhy(k,cand))return false;b.staff={...(b.staff||{}),[k]:{lv:cand.lv,name:cand.name,f:cand.f}};b.staffN={...(b.staffN||{}),[k]:((b.staffN&&b.staffN[k])||0)+1};Bledger('צוות מקצועי · '+S.name+' · '+cand.name,-cand.fee);try{Bcount('staff')}catch(e){}Bwrite();return true}
function BstaffOut(k){const b=Bstate();if(!b||b.live||!BstaffLv(k))return false;b.staff={...(b.staff||{}),[k]:0};Bwrite();return true}
/* a career saved while the staff were levels: each level becomes a man of that level */
function BstaffMend(){const b=Bstate();if(!b||b.daily||!b.staff)return;for(const k of Object.keys(BSTAFF)){const v=b.staff[k];if(typeof v==='number'&&v>0){const rnd=lgRng(lgHashN('goalasso-staff-was:'+(b.coach||'')+':'+k));b.staff={...b.staff,[k]:{lv:Math.min(BSTAFF_MAX,v),name:BSTAFF_FIRST[Math.floor(rnd()*BSTAFF_FIRST.length)]+' '+BSTAFF_LAST[Math.floor(rnd()*BSTAFF_LAST.length)],f:1}}}}}
const BstaffStars=lv=>`<span class="bstaff-pips" role="img" aria-label="${lv} כוכבים מתוך ${BSTAFF_MAX}">${[1,2,3].map(i=>`<i class="${i<=lv?'on':''}"></i>`).join('')}</span>`;
function BstaffCardHTML(k){const S=BSTAFF[k],cur=BstaffOf(k),lv=cur?cur.lv:0,cands=BstaffCands(k);
  return `<article class="bstaff-card${lv?' on':''}">${Bui(S.ic)}<div class="bstaff-head"><h3>${S.name}</h3>${cur?`<p class="bstaff-who"><strong>${esc(cur.name||'איש הצוות שלך')}</strong> ${BstaffStars(lv)}</p>`:'<p class="bmuted">התפקיד פנוי.</p>'}</div>
    ${lv?`<ul class="bstaff-has">${S.lv.slice(0,lv).map(t=>`<li>${t}</li>`).join('')}</ul><p class="bstaff-price">שכר <strong>${Bmoney(Math.round(BstaffWage(lv)*(cur.f||1)/10000)*10000)}</strong> לשנה <button type="button" class="blink" data-staff-out="${k}">שחרר</button></p>`:`<p class="bstaff-next"><b>מה התפקיד נותן:</b> ${S.lv[0]}</p>`}
    <h4 class="bstaff-ch">מועמדים</h4><ul class="bstaff-cands">${cands.map(c=>{const why=BstaffWhy(k,c),same=cur&&c.lv===lv;return `<li><div><strong>${esc(c.name)}</strong> ${BstaffStars(c.lv)}<small>${c.tag}${c.lv>lv?` · מוסיף: ${S.lv[c.lv-1]}`:same?' · אותה רמה כמו עכשיו':c.lv<lv?' · רמה נמוכה יותר, שכר נמוך יותר':''}</small><small class="bstaff-cost">חתימה ${Bmoney(c.fee)} · שכר ${Bmoney(c.wage)} לשנה</small></div><button type="button" class="bbtn${why||c.lv<=lv?' secondary':''}" data-staff-up="${k}:${c.i}"${why?' disabled':''}>${why==='אין מספיק כסף'?why:cur?'החלף':'העסק'}</button></li>`}).join('')}</ul></article>`}
function BstaffView(){const pay=BstaffPay();return `${Bheader('האנשים שלצדך','צוות מקצועי','לכל תפקיד יש שלושה מועמדים: שם, רמה (כוכבים) ומחיר משלו. מי שנבחר מחליף את מי שבתפקיד, ואחריו מגיעים מועמדים חדשים.')}<div class="bmetrics"><article><span>כסף זמין עכשיו</span><strong>${Bmoney(me().money)}</strong></article><article><span>שכר הצוות לשנה</span><strong>${Bmoney(pay)}</strong><small>${pay?'משולם בהדרגה בכל מחזור':'עוד לא העסקת אף אחד'}</small></article></div><div class="bstaff-grid">${Object.keys(BSTAFF).map(BstaffCardHTML).join('')}</div><p class="bnote">הצוות הוא שלך: אם תעבור למועדון אחר, הוא עובר איתך.</p>`}
function BstaffAsk(k,i){const S=BSTAFF[k],cand=S&&BstaffCands(k)[i],cur=BstaffOf(k);if(!cand||BstaffWhy(k,cand))return;Bdialog(`<h2>${cur?`להחליף את ${S.name}?`:`להעסיק ${S.name}?`}</h2><p><strong>${esc(cand.name)}</strong> · ${cand.tag}.</p><ul class="bstaff-has">${S.lv.slice(0,cand.lv).map(t=>`<li>${t}</li>`).join('')}</ul>${cur?`<p class="bnote">${esc(cur.name||'איש הצוות הנוכחי')} יעזוב את המועדון. דמי החתימה ששולמו עליו לא חוזרים.</p>`:''}<div class="btransaction"><span>דמי חתימה, עכשיו</span>${Bmoney(cand.fee)}</div><div class="btransaction"><span>שכר לשנה, בהדרגה</span>${Bmoney(cand.wage)}</div><div class="bdock">${Bbutton('אישור',`data-staff-ok="${k}:${i}"`)}${Bbutton('ביטול','data-bclose','secondary')}</div>`)}
/* what the staff says before a match: the assistant on the approach and on tired legs, the analyst on the opponent */
function BstaffBriefHTML(pair){const c=me(),op=pair?club(pair.find(id=>id!==c.id)):null;if(!op)return '';const out=[],as=BstaffLv('asst'),an=BstaffLv('anal');
  if(as){const d=strength(c)-strength(op)+(pair[0]===c.id?1.5:-1.5),k=d>=5?'att':d<=-5?'def':'bal',t=BfitTired(c),sw=BfitFreshList(c);
    out.push(`<li><b>עוזר המאמן:</b> ${k==='att'?'אתם חזקים מהם בבירור. הייתי משחק <strong>התקפי</strong>.':k==='def'?'הם חזקים יותר. הייתי משחק <strong>הגנתי</strong> ומחכה להזדמנות.':'הכוחות קרובים. <strong>מאוזן</strong> הוא הבחירה הבטוחה.'}${sw.length?` הייתי נותן מנוחה: ${sw.slice(0,4).map(([,o,q])=>`${esc(q.last||q.first||fullName(q))} במקום ${esc(o.last||o.first||fullName(o))} (<bdi>${BfitOf(o)}%</bdi>)`).join(', ')}.`:t.length?` ${t.slice(0,4).map(p=>esc(p.last||p.first||fullName(p))).join(', ')} ${t.length>1?'עייפים':'עייף'}, אבל אין בספסל מי שישחק היום טוב ${t.length>1?'מהם':'ממנו'}.`:''}</li>`)}
  if(an){const xi=bestXI(op),avg=pos=>{const ps=xi.filter(p=>p.pos===pos);return ps.length?ps.reduce((s,p)=>s+p.ovr,0)/ps.length:0},L=[['DF','ההגנה'],['MF','הקישור'],['FW','ההתקפה']].map(([k,t])=>({t,v:avg(k)})).filter(x=>x.v).sort((a,b)=>a.v-b.v);
    let txt=L.length>1?(Math.round(L[0].v)===Math.round(L[L.length-1].v)?`שלוש החוליות שלהם שקולות (<bdi>${Math.round(L[0].v)}</bdi>): אין להם נקודת תורפה ברורה.`:`החוליה החלשה שלהם היא ${L[0].t} (<bdi>${Math.round(L[0].v)}</bdi>), והחזקה היא ${L[L.length-1].t} (<bdi>${Math.round(L[L.length-1].v)}</bdi>).`):'';
    if(an>=2){let s=null;try{s=BleaderOf(op,'goals')}catch(e){}const d=strength(op)-strength(c)+(pair[0]===op.id?1.5:-1.5);txt+=`${s&&s.goals?` הכובש שלהם: ${esc(s.name)} (<bdi>${s.goals}</bdi>).`:''} צפויים לשחק ${d>=5?'התקפי':d<=-5?'הגנתי':'מאוזן'}.`}
    const tw=BfitTiredOp(op);if(tw.length)txt+=` עייפים אצלם: ${tw.slice(0,3).map(p=>esc(p.last||p.first||fullName(p))).join(', ')}.`;out.push(`<li><b>האנליסט:</b> ${txt} הקבוצה מגיעה מוכנה: <bdi>+${(.3*an).toFixed(1)}</bdi> לכוח.</li>`)}
  return out.length?`<ul class="bbrief">${out.join('')}</ul>`:''}
/* at the whistle: what preparation is worth in this match */
function BdepthKick(M){const b=Bstate();if(!b||b.daily||!M||M.bDaily!=null)return;let v=.3*BstaffLv('anal');
  if(b.boost&&b.boost.rep&&!(M.bX&&M.bX.kind==='pre')){v+=b.boost.rep;delete b.boost.rep}
  if(v){M.boost=M.boost||{};M.boost[G.me]=(M.boost[G.me]||0)+v}}

/* ---------- one hook after every match of the coach's own club ---------- */
function BdepthAfter(M){const b=Bstate(),c=me();if(!b||b.daily||!c||!M||M.bDep||M.bDaily!=null||(M.h!==c.id&&M.a!==c.id))return;M.bDep=1;
  try{const L=BstaffLv('phys');if(L)for(const e of M.ev)if(e.t==='inj'&&e.team===c.id){const p=c.players.find(x=>x.id===e.pid);if(!p||!p.inj)continue;const cut=L>=3&&p.inj>=4?2:(L>=2?p.inj>=2:p.inj>=3)?1:0;if(cut)p.inj=Math.max(1,p.inj-cut)}}catch(e){console.warn('staff',e)}
  try{BfitAfter(M);if(M.bCL!=null||M.bX)BfitReturn()}catch(e){console.warn('fit',e)}try{BcalLog(M)}catch(e){console.warn('cal',e)}
  try{BbookAfter(M)}catch(e){console.warn('book',e)}try{BdealAfter(M)}catch(e){console.warn('deal',e)}
  try{BenvSettle(M);if(M.bCL!=null||M.bX)BenvTurn()}catch(e){console.warn('env',e)}}

/* a new club: the calendar, the table he left and whatever named a player of the old squad go; the staff and the book are his and stay */
function BdepthMoved(){const b=Bstate();if(!b)return;b.cal=[];b.rest=[];b.negOff={};if(b.boost)delete b.boost.rep;if(b.env){b.env.bet=null;b.env.pr=null;b.env.note=[];if(b.env.got&&!b.env.got.read)b.env.got=null}for(const p of (me()?me().players:[]))if(p.fit==null)p.fit=100}
document.addEventListener('click',e=>{const t=e.target&&e.target.closest?e.target:null;if(!t||!G||!G.beginner)return;let el;
  if((el=t.closest('[data-bhalf-go]'))){const live=Bstate().live;document.querySelector('.bdialog')?.remove();if(live){live.paused=false;Bwrite();BpaintBroadcast()}return}
  if((el=t.closest('[data-leagueview]'))){Bleagueview=el.dataset.leagueview==='cal'?'cal':'table';Brender();return}
  if((el=t.closest('[data-calendar]'))){Btab='league';Bleagueview='cal';Brender();const nx=document.querySelector('.bcal-row.next');if(nx&&nx.scrollIntoView)nx.scrollIntoView({block:'center'});else window.scrollTo?.(0,0);return}
  if((el=t.closest('[data-staff-up]'))){const [k,i]=el.dataset.staffUp.split(':');BstaffAsk(k,+i);return}
  if((el=t.closest('[data-staff-ok]'))){const [k,i]=el.dataset.staffOk.split(':'),ok=BstaffHire(k,+i);document.querySelector('.bdialog')?.remove();if(ok)Brender();return}
  if((el=t.closest('[data-staff-out]'))){const k=el.dataset.staffOut,S=BSTAFF[k];if(!S||!BstaffLv(k))return;Bdialog(`<h2>לשחרר את ${S.name}?</h2><p>השכר שלו ייחסך מהמחזור הבא, והתפקיד יישאר פנוי. דמי החתימה לא חוזרים.</p><div class="bdock">${Bbutton('שחרר',`data-staff-bye="${k}"`)}${Bbutton('ביטול','data-bclose','secondary')}</div>`);return}
  if((el=t.closest('[data-staff-bye]'))){BstaffOut(el.dataset.staffBye);document.querySelector('.bdialog')?.remove();Brender();return}});
