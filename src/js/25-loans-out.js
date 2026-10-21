/* ====================== LOANS OUT · players leave on loan, play, develop or get hurt, and come back ====================== */
const LOAN_MAX=6;
function loanOutCandidates(p){const mine=me();const all=[...G.clubs,...G.leumit].filter(c=>c.id!==G.me&&c.players.length<28);
  return all.map(c=>{const xi=c.players.slice().sort(byOvr).slice(0,11);const worst=xi.filter(x=>x.pos===p.pos).sort(byOvr).slice(-1)[0];const gap=p.ovr-(worst?worst.ovr:50);
    const role=gap>=3?'starter':gap>=-2?'rotation':'bench';const share=role==='starter'?.8:role==='rotation'?.55:.3;const fee=role==='starter'?Math.round(p.value*.04/1e4)*1e4:0;
    return {c,role,share,fee,score:gap+(c.league?2:0)+(c.tier?(5-c.tier):0)}}).sort((a,b)=>b.score-a.score).slice(0,6)}
const LOAN_ROLE_HE={starter:'שחקן הרכב',rotation:'רוטציה',bench:'ספסל'};
function loanOutModal(pid){const c=me();const p=c.players.find(x=>x.id===pid);if(!p)return;
  const why=!WINDOW(G.wk)?'אפשר להשאיל רק כשחלון ההעברות פתוח.':p.loan?'שחקן שנמצא אצלנו בהשאלה לא יכול לצאת להשאלה נוספת.':c.players.length<=17?'לא אפשרי: הסגל ירד מתחת ל-17 שחקנים.':(G.loansOut||[]).length>=LOAN_MAX?`אפשר להשאיל עד ${LOAN_MAX} שחקנים בו זמנית.`:p.inj?'שחקן פצוע לא יוצא להשאלה.':(p.pos==='GK'&&c.players.filter(x=>x.pos==='GK').length<=2)?'חייבים להשאיר לפחות 2 שוערים בסגל.':'';
  if(why){closeModal();return toast(why)}
  const opts=loanOutCandidates(p);
  openModal(`<h3 class="sec">השאלה של ${esc(fullName(p))}</h3><p class="small muted">ההשאלה עד סוף עונת <bdi dir="ltr">${seasonLabel()}</bdi>. השחקן ישחק במועדון המקבל: דקות משחק מפתחות אותו, ישיבה על הספסל פוגעת במורל, ויש סיכון לפציעה. המועדון המקבל משלם חלק מהשכר לפי מעמד השחקן אצלו.</p>
   <div class="list" style="margin-top:8px">${opts.map(o=>`<button class="pl" style="width:100%;text-align:right" data-loanto="${o.c.id}"><span class="ovr num">${Math.round(strength(o.c))}</span><div class="name"><b>${esc(o.c.name)}</b><small><span class="it">${LOAN_ROLE_HE[o.role]}</span><span class="it">משלמת ${Math.round(o.share*100)}% מהשכר</span>${o.fee?`<span class="it">דמי השאלה ${NIS(o.fee)}</span>`:''}</small></div></button>`).join('')}</div>
   <div class="actions" style="margin-top:10px"><button class="btn sec" data-close>ביטול</button></div>`,e=>{const b=e.target.closest('[data-loanto]');if(b){const o=opts.find(x=>x.c.id===b.dataset.loanto);if(o){closeModal();doLoanOut(p.id,o)}}})}
function doLoanOut(pid,o){const c=me();const p=c.players.find(x=>x.id===pid);if(!p||!WINDOW(G.wk))return;
  c.players=c.players.filter(x=>x!==p);if(c.lineup)c.lineup=c.lineup.map(id=>id===p.id?null:id);if(c.captain===p.id)c.captain=null;
  p.loanOut={from:G.me,to:o.c.id,toName:o.c.short||o.c.name,until:G.season,share:o.share,role:o.role,ovr0:p.ovr,apps0:p.apps||0,goals0:p.goals||0,inj0:p.injSeqSeen||0,wk:G.wk};
  o.c.players.push(p);if(o.fee){c.money+=o.fee;addLog(`דמי השאלה: ${fullName(p)} ל${o.c.short||o.c.name}`,o.fee)}
  G.loansOut=G.loansOut||[];G.loansOut.push({pid:p.id,to:o.c.id});
  news(`${fullName(p)} יצא בהשאלה ל${o.c.name} עד סוף העונה (${LOAN_ROLE_HE[o.role]}).`);paper('העברות',`${fullName(p)} בהשאלה ל${o.c.name}`,`עד סוף עונת ${seasonLabel()}`,`${me().name} השאילה את ${fullName(p)} (${POSHE[p.pos]}, ${p.age}) ל${o.c.name}. המטרה: דקות משחק והתפתחות.`,G.me,{type:'loanOut',player:fullName(p),pos:p.pos,age:p.age,club:me().name,clubId:G.me,to:o.c.name,toId:o.c.id,until:seasonLabel()});
  autoLineups();save();render()}
function loanedOut(){return (G.loansOut||[]).map(l=>{const c=club(l.to);const p=c&&c.players.find(x=>x.id===l.pid);return p?{p,c}:null}).filter(Boolean)}
function loansOutWeekly(){const mine=me();if(!G.loansOut||!G.loansOut.length)return;let cost=0;
  for(const {p,c} of loanedOut()){const L=p.loanOut;cost+=Math.round(p.wage*(1-L.share));
    const xi=new Set(bestXI(c).map(x=>x.id));const plays=xi.has(p.id)&&!p.inj;
    if(plays){p.morale=clamp((p.morale??65)+2,0,100);if(p.age<=26&&p.ovr<p.pot&&Math.random()<.06){p.ovr++;finalize(p);news(`דיווח השאלה: ${fullName(p)} משתפר ב${c.short} (${p.ovr}).`)}}
    else{p.morale=clamp((p.morale??65)-1,0,100);if(p.age>=29&&Math.random()<.03){p.ovr--;finalize(p)}}
    if(p.inj&&p.injId&&p.injId!==L.injSeen){L.injSeen=p.injId;news(`דיווח השאלה: ${fullName(p)} נפצע ב${c.short} (${p.injT||'פציעה'}, ${p.inj} שבועות).`)}}
  if(cost){mine.money-=cost;addLog('חלק השכר של שחקנים בהשאלה',-cost)}}
function recallLoan(pid,silent){const f=loanedOut().find(x=>x.p.id===pid);if(!f)return;const {p,c}=f;const L=p.loanOut;const mine=me();
  c.players=c.players.filter(x=>x!==p);if(c.lineup)c.lineup=c.lineup.map(id=>id===p.id?null:id);if(c.captain===p.id)c.captain=null;
  const apps=(p.apps||0)-L.apps0,goals=(p.goals||0)-L.goals0,d=p.ovr-L.ovr0;delete p.loanOut;mine.players.push(p);
  G.loansOut=(G.loansOut||[]).filter(l=>l.pid!==pid);p.fit=Math.max(p.fit??80,80);
  news(`${fullName(p)} חזר מהשאלה ב${c.short}: ${apps} הופעות, ${goals} שערים, דירוג ${L.ovr0}→${p.ovr}${d>0?' (השתפר)':d<0?' (ירד)':''}${p.inj?`, פצוע עוד ${p.inj} שבועות`:''}.`);
  if(!silent){autoLineups();save();render()}}
function returnLoansOut(){for(const {p} of loanedOut())recallLoan(p.id,true);G.loansOut=[]}
function loansOutCardHTML(){const L=loanedOut();if(!L.length)return '';
  return `<div class="card"><div class="row between"><h3 class="sec">בהשאלה · ${L.length}</h3><span class="muted tiny">חוזרים בסוף העונה</span></div><div class="list" style="margin-top:6px">${L.map(({p,c})=>{const o=p.loanOut;const d=p.ovr-o.ovr0;return `<div class="pl ${tierClass(p.ovr)}"><span class="ovr num">${p.ovr}</span><span class="pos ${p.pos}">${POSB[p.pos]}</span><div class="name"><b>${esc(fullName(p))}</b><small>ב${esc(c.short||c.name)} · ${(p.apps||0)-o.apps0} הופעות · ${(p.goals||0)-o.goals0} שערים${d?` · דירוג <bdi dir="ltr">${d>0?'+':''}${d}</bdi>`:''}${p.inj?` · <span style="color:var(--bad)">פצוע ${p.inj} ש'</span>`:''}</small></div>${WINDOW(G.wk)?`<button class="btn sm sec" data-recall="${p.id}">החזר</button>`:''}</div>`}).join('')}</div></div>`}

