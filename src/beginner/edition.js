/* ====================== BEGINNER: the paper of the round ======================
   The newspaper used to speak only when something happened to the coach himself (a signing, a sponsor, a job) and about
   a match only after a rout. Now every round has an edition:

   - **The match report** (BeditionStory) is written from what happened in the match, not from the score alone: a derby,
     a hat-trick, a comeback, a winner in the last minutes, a lead thrown away, a rout, an upset, a goalless draw. It
     names the scorers with their minutes and the man of the match, says where the result leaves the club in the table,
     and is kept in the archive (G.paper, `ev.type:'match'`) — it does not open by itself, a result dialog is enough.
   - **The edition** (BeditionOpen) is that report as a front page with the rest of the round under it: every result
     (the surprise of the round marked), the table with who moved up and down, the top scorers, and what the next match
     is about (Bstakes). It opens from the result dialog and from the home screen's tile.
   - b.rnd keeps what the edition needs and nothing else: the round's results and the places before it.

   A round the coach's club sat out still has an edition; its lead is the round's biggest result. */
function BeditionScorers(M,id){const by=new Map();for(const e of M.ev)if((e.t==='goal'||e.t==='pen')&&e.team===id&&e.name){const k=e.pid!=null?e.pid:e.name,x=by.get(k)||{name:e.name,pid:e.pid,m:[]};x.m.push(e.m);by.set(k,x)}return [...by.values()]}   /* by the player, not by his name: two team-mates may share one */
function BeditionFacts(M){const c=me(),home=M.h===c.id,opp=club(home?M.a:M.h),gf=home?M.gh:M.ga,ga=home?M.ga:M.gh,goals=M.ev.filter(e=>e.t==='goal'||e.t==='pen'||e.t==='own').slice().sort((a,b)=>a.m-b.m);
  let f=0,a=0,trailed=false,led=false;const isMine=e=>e.t==='own'?e.team!==c.id:e.team===c.id;   /* an own goal counts for the other side */
  for(const e of goals){if(isMine(e))f++;else a++;if(f<a)trailed=true;if(f>a)led=true}
  const last=goals[goals.length-1]||null,mineSc=BeditionScorers(M,c.id),hat=mineSc.filter(s=>s.m.length>=3).sort((x,y)=>y.m.length-x.m.length)[0]||null;   /* the man with the most, when two scored three */
  let star=null;try{if(!M.ratings)matchRatings(M,club(M.h),club(M.a));for(const id of [M.h,M.a])for(const [pid,s] of Object.entries((M.ps&&M.ps[id])||{}))if(s.r!=null&&(!star||s.r>star.r)){const p=club(id).players.find(p=>p.id===+pid);if(p)star={pid:p.id,name:fullName(p),r:s.r,team:id,vid:playerVisualId(p)||null}}}catch(e){}
  return {c,opp,home,gf,ga,res:gf>ga?'W':gf<ga?'L':'D',goals,trailed,led,last,lastMine:last?isMine(last):false,mineSc,oppSc:BeditionScorers(M,opp.id),hat,star,derby:typeof derbyWords==='function'&&derbyWords(M.h,M.a),gap:Math.round(strength(opp)-strength(c)),reds:M.ev.filter(e=>e.t==='red'&&e.team===c.id).length}}
function BeditionStory(M,wk){const F=BeditionFacts(M),{c,opp,home,gf,ga,res}=F,b=Bstate(),sc=`${Math.max(gf,ga)}:${Math.min(gf,ga)}`,late=F.last&&F.last.m>=84;let h,ribbon;
  const D=F.derby,named=D&&D.kind!=='rival';   /* a derby and the classic carry a name of their own; a rivalry between two cities is told with the rival's name */
  if(res==='W'){ribbon=!D?'ניצחון':D.kind==='city'?'הדרבי שלנו':D.kind==='classic'?'הקלאסיקו שלנו':'ניצחון על היריבה';
    h=named?`${D.label}: ${c.name} חוגגת ${sc}`:D?`${c.name} גברה על היריבה הגדולה ${opp.name} ${sc}`:F.hat?`${goalsWord(F.hat.m.length)} ל${F.hat.name}: ${c.name} ניצחה ${sc}`:F.trailed?`מהפך! ${c.name} חזרה מפיגור וניצחה ${sc}`:late&&F.lastMine&&gf-ga===1?`דקה ${F.last.m}: ${F.last.name||c.name} מכריע את ${opp.name}`:gf-ga>=3?`${c.name} ${pick(['ריסקה','פירקה','הביסה','מחצה'])} את ${opp.name} ${sc}`:F.gap>=4?`${c.name} הפתיעה את ${opp.name}`:pick([`${c.name} ניצחה את ${opp.name} ${sc}`,`שלוש נקודות ל${c.name}: ${sc} על ${opp.name}`,`${c.name} גברה על ${opp.name} ${sc}`])}
  else if(res==='D'){ribbon='חלוקת נקודות';
    h=gf===0?`תיקו מאופס בין ${c.name} ל${opp.name}`:late&&F.lastMine?`דקה ${F.last.m}: ${F.last.name||c.name} מציל נקודה ל${c.name}`:late&&!F.lastMine?`${c.name} איבדה ניצחון בדקות הסיום`:pick([`${c.name} ו${opp.name} נפרדו בתיקו ${sc}`,`נקודה אחת ל${c.name} מול ${opp.name}`])}
  else{ribbon=!D?'הפסד':D.kind==='city'?'הדרבי שלהם':D.kind==='classic'?'הקלאסיקו שלהם':'הפסד ליריבה';
    h=named?`${D.label}: ערב קשה ל${c.name}`:D?`ערב קשה ל${c.name} מול היריבה הגדולה ${opp.name}`:ga-gf>=3?`ערב שחור ל${c.name}`:F.led?`${c.name} הובילה, ונשארה בלי נקודות`:late&&!F.lastMine&&ga-gf===1?`שער בדקה ${F.last.m} שבר את ${c.name}`:pick([`${opp.name} גברה על ${c.name} ${sc}`,`${c.name} נכנעה ל${opp.name} ${sc}`])}
  const list=s=>s.map(x=>`${x.name} (דק׳ ${x.m.join(', ')})`).join(', ')   /* plain text in a right-to-left line: a prime after the digits would land on their wrong side */,place=Bplace(),prev=b.rnd&&b.rnd.prev?b.rnd.prev[c.id]:null,stadium=(home?c:opp).stadium||'';
  const body=[F.mineSc.length?`הכובשים של ${c.name}: ${list(F.mineSc)}.`:gf?'':`${c.name} לא מצאה את הרשת.`,F.oppSc.length?`ל${opp.name} כבשו ${list(F.oppSc)}.`:'',
    F.star?(F.star.team===c.id?`${F.star.name} נבחר לשחקן המשחק עם ציון ${F.star.r.toFixed(1)}.`:`שחקן המשחק היה ${F.star.name} מ${opp.name}, עם ציון ${F.star.r.toFixed(1)}.`):'',F.reds?`${c.name} סיימה את המשחק בחיסרון מספרי.`:'',
    prev&&place<prev?`עם ${res==='W'?'הניצחון':'הנקודה'} עלתה ${c.name} למקום ${place} בטבלה.`:prev&&place>prev?`${c.name} ירדה למקום ${place} בטבלה.`:`${c.name} במקום ${place} בטבלה.`,
    res==='W'?pick(['האוהדים יצאו מהאצטדיון עם חיוך.','בהנהלה שבעי רצון.','המאמן שיבח את הרוח הקבוצתית.']):res==='D'?pick(['במועדון חלוקים אם זו נקודה שהושגה או שתיים שאבדו.','המאמן: "נקודה היא נקודה, ממשיכים לעבוד".']):pick(['ההנהלה מצפה לתגובה כבר במשחק הבא.','האוהדים דורשים תשובה על המגרש.','המאמן לקח אחריות על התוצאה.'])].filter(Boolean).join(' ');
  return {wk,s:b.season,kind:'ליגה',h,sub:`מחזור ${wk+1} · ${home?'משחק בית':'משחק חוץ'}${stadium?' ב'+stadium:''}`,body,team:c.id,
    ev:{type:'match',ribbon,h:M.h,a:M.a,gh:M.gh,ga:M.ga,hName:club(M.h).name,aName:club(M.a).name,stadium,pid:F.star&&F.star.team===c.id?F.star.pid:null,vid:F.star&&F.star.team===c.id?F.star.vid:null,star:F.star?{name:F.star.name,r:+F.star.r.toFixed(1)}:null,place,res}}}
/* a round the coach sat out: the lead is the round's widest result */
function BeditionRestStory(wk){const b=Bstate(),r=b.rnd,top=(r.res||[]).slice().sort((x,y)=>Math.abs(y[2]-y[3])-Math.abs(x[2]-x[3])||(y[2]+y[3])-(x[2]+x[3]))[0];if(!top)return null;const h=club(top[0]),a=club(top[1]);if(!h||!a)return null;const draw=top[2]===top[3],w=top[2]>top[3]?h:a,l=w===h?a:h,sc=`${Math.max(top[2],top[3])}:${Math.min(top[2],top[3])}`;
  return {wk,s:b.season,kind:'ליגה',h:draw?`${h.name} ו${a.name} נפרדו בתיקו ${sc}`:`${w.name} ניצחה את ${l.name} ${sc}`,sub:`מחזור ${wk+1} · ${me().name} נחה במחזור הזה`,body:`המחזור נמשך בלי ${me().name}, שנחה לפי לוח המשחקים. ${draw?'המשחק המרכזי הסתיים בחלוקת נקודות.':`${w.name} רשמה את התוצאה הבולטת של המחזור.`} ${me().name} במקום ${Bplace()} בטבלה.`,team:w.id,
    ev:{type:'match',ribbon:'סביב הליגה',h:top[0],a:top[1],gh:top[2],ga:top[3],hName:h.name,aName:a.name,stadium:h.stadium||'',place:Bplace()}}}
/* called once a round, after the table and the counters are final */
function BeditionRound(mine){const b=Bstate();if(!b||!b.rnd)return;const wk=b.rnd.r;let st=null;try{st=mine?BeditionStory(mine,wk):BeditionRestStory(wk)}catch(e){console.warn('edition',e)}
  if(st){G.paper=[st,...(G.paper||[])].slice(0,40);b.rnd.h=st.h}b.rnd.seen=false}
function BeditionLead(){const b=Bstate(),r=b&&b.rnd;if(!r)return null;return (G.paper||[]).find(s=>s.ev&&s.ev.type==='match'&&s.s===r.s&&s.wk===r.r)||null}
function BeditionExtraHTML(){const b=Bstate(),r=b.rnd,c=me(),tab=Bstandings(),res=r.res||[],cur=r.s===b.season;   /* once the season has turned, the table and the scorers on screen are the new season's (and maybe another league's): the old round keeps its results only */
  /* the surprise of the round: the winner that was weaker by the most */
  let upset=null;for(const x of res){if(x[2]===x[3])continue;const w=club(x[2]>x[3]?x[0]:x[1]),l=club(x[2]>x[3]?x[1]:x[0]);if(!w||!l)continue;const d=strength(l)-strength(w);if(d>=3&&(!upset||d>upset.d))upset={x,d}}
  const results=res.map(x=>{const h=club(x[0]),a=club(x[1]);if(!h||!a)return '';const mine=x[0]===c.id||x[1]===c.id;return `<li class="${mine?'me':''}"><span>${esc(h.name)}</span><b>${scoreSides(x[2],x[3],{label:h.name+' '+x[2]+', '+a.name+' '+x[3]})}</b><span>${esc(a.name)}</span>${upset&&upset.x===x?'<em>הפתעת המחזור</em>':''}</li>`}).join('');
  const i=tab.findIndex(x=>x.id===c.id),rows=new Set([0,1,2,3,4,i-1,i,i+1].filter(k=>k>=0&&k<tab.length)),mark=(id,now)=>{const was=r.prev&&r.prev[id];return !was||was===now?'<i class="eq" aria-hidden="true">•</i>':was>now?'<i class="up" aria-label="עלתה">▲</i>':'<i class="dn" aria-label="ירדה">▼</i>'};
  let last=-1;const table=[...rows].sort((x,y)=>x-y).map(k=>{const t=tab[k],gap=last>=0&&k>last+1?'<tr class="gap"><td colspan="5">⋯</td></tr>':'';last=k;return `${gap}<tr class="${t.id===c.id?'me':''}"><td><bdi>${k+1}</bdi>${mark(t.id,k+1)}</td><th>${esc(t.name)}</th><td><bdi>${t.P}</bdi></td><td><bdi dir="ltr">${t.GF-t.GA>0?'+':''}${t.GF-t.GA}</bdi></td><td><strong><bdi>${t.pts}</bdi></strong></td></tr>`}).join('');
  const sc=Bleaders('goals').slice(0,3).map((s,k)=>`<li><b><bdi>${k+1}</bdi></b><span><strong>${esc(s.name)}</strong><small>${esc(club(s.clubId)?.name||'')}</small></span><em><bdi>${s.goals}</bdi></em></li>`).join('');
  const pair=(Bextra()||{}).pair||Bnext(),op=pair?club(pair.find(id=>id!==c.id)):null,stakes=Bstakes(),more=(G.paper||[]).map((s,k)=>({s,k})).filter(({s})=>s.s===r.s&&s.wk>=r.r&&(!s.ev||s.ev.type!=='match')).slice(0,3);
  return `<div class="np-ed"><section class="np-box"><h3>תוצאות המחזור</h3><ul class="np-res">${results}</ul></section>
   ${cur?`<section class="np-box"><h3>הטבלה</h3><table class="np-tab"><thead><tr><th scope="col">#</th><th scope="col">קבוצה</th><th scope="col">מש׳</th><th scope="col">הפרש</th><th scope="col">נק׳</th></tr></thead><tbody>${table}</tbody></table></section>`:''}
   ${sc&&cur?`<section class="np-box"><h3>מלך השערים</h3><ol class="np-sc">${sc}</ol></section>`:''}
   ${op?`<section class="np-box np-next"><h3>המחזור הבא</h3><p><strong>${pair[0]===c.id?`${esc(c.name)} מארחת את ${esc(op.name)}`:`${esc(c.name)} מתארחת אצל ${esc(op.name)}`}</strong></p>${stakes.length?`<ul>${stakes.map(x=>`<li><b>${x.t}:</b> ${x.h}</li>`).join('')}</ul>`:''}</section>`:''}
   ${more.length?`<section class="np-box"><h3>עוד בעיתון</h3><ul class="np-more">${more.map(({s,k})=>`<li><button type="button" data-bpaper="${k}"><small>${esc(s.kind)}</small>${esc(s.h)}</button></li>`).join('')}</ul></section>`:''}</div>`}
function BeditionOpen(){const b=Bstate(),lead=BeditionLead();if(!b||!b.rnd||!lead)return BpaperArchive();document.querySelector('.bdialog')?.remove();if(!b.rnd.seen){b.rnd.seen=true;Bwrite()}
  openFrontPage(lead,{live:false,label:'מהדורת המחזור',extra:BeditionExtraHTML(),onClose:()=>{Brender()}})}
function BeditionFresh(){const b=Bstate();return !!(b&&b.rnd&&b.rnd.seen===false&&BeditionLead())}
/* the buttons under a result: a pack when one waits, then the paper of the round */
function BresultFoot(){const b=Bstate(),packs=b&&!b.out&&((b.packs&&b.packs.length)||b.packOpen);return `${packs?Bbutton('פתח את החבילה','data-action="pack"'):Bbutton('ממשיכים','data-bclose')}${b&&b.rnd&&BeditionLead()?Bbutton('לעיתון המחזור','data-action="edition"','secondary'):''}${packs?'<button type="button" class="blink" data-bclose>אחר כך</button>':''}`}
/* the archive behind the home tile: the round's edition first, then everything that was written */
function BpaperArchive(){const ps=G.paper||[],b=Bstate(),lead=BeditionLead();
  Bdialog(`<span class="beyebrow">${PAPER_NAME}</span><h2>העיתון</h2>${lead?`<button type="button" class="bedition-card" data-action="edition"><small>מהדורת מחזור <bdi>${b.rnd.r+1}</bdi>${BeditionFresh()?' · חדש':''}</small><strong>${esc(lead.h)}</strong><span>כל התוצאות, הטבלה, מלך השערים והמחזור הבא</span></button>`:''}${ps.length?`<div class="bpapers">${ps.map((s,i)=>`<button type="button" class="bpaper-row" data-bpaper="${i}"><small>${esc(s.kind)} · עונה <bdi>${s.s}</bdi>, מחזור <bdi>${s.wk+1}</bdi></small><strong>${esc(s.h)}</strong>${s.sub?`<span>${esc(s.sub)}</span>`:''}</button>`).join('')}</div>`:'<p>עוד לא יצאה כתבה. חתימות, פרידות, משחקים ותארים יופיעו כאן.</p>'}`)}
document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el||!G||!G.beginner||el.dataset.action!=='edition')return;el.closest('dialog')?.remove();BeditionOpen()});
