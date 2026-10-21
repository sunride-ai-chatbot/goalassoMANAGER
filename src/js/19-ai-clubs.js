/* ====================== AUTONOMOUS RIVAL CLUBS ======================
   Rivals keep a squad plan and use the same money as everyone else (TV, sponsor, gate, merchandise, sales minus wages and
   running costs). They buy only what they can afford, from a real seller, and the seller is paid. */
const DEPTH_TARGET={GK:3,DF:8,MF:8,FW:5};
function aiNeed(c){const top14=c.players.slice().sort(byOvr).slice(0,14);const avg=top14.reduce((t,p)=>t+p.ovr,0)/Math.max(1,top14.length);let best=null;
  for(const pos of POS){const g=c.players.filter(p=>p.pos===pos&&!(p.inj>4)).sort(byOvr);const k=pos==='GK'?1:pos==='FW'?2:4;const st=g.slice(0,k);const sAvg=st.length?st.reduce((t,p)=>t+p.ovr,0)/st.length:avg-12;const deficit=Math.max(0,DEPTH_TARGET[pos]-g.length);const score=deficit*3+(avg-sAvg)+(g.length?0:10);if(!best||score>best.score)best={pos,score,starter:st[st.length-1]?st[st.length-1].ovr:avg-10,count:g.length}}return best}
function tlog(txt,big){G.tlog=G.tlog||[];G.tlog.unshift({s:G.season,wk:G.wk,txt,big:!!big});G.tlog=G.tlog.slice(0,60)}
function moveToAI(p,from,to,fee){if(from){from.players=from.players.filter(x=>x!==p);if(from.lineup)from.lineup=from.lineup.map(id=>id===p.id?null:id);if(from.league||G.leumit.includes(from))from.money+=fee}to.money-=fee;
  delete p.lg;delete p.vmult;delete p.wmult;delete p.key;delete p.est;delete p.listed;delete p.dplan;p.kn=Math.max(p.kn||0,1);p.contract=ri(2,4);p.form=0;p.morale=72;finalize(p);p.wage=playerWage(p);to.players.push(p)}
function aiBuy(c){const need=aiNeed(c);if(!need||need.score<2)return;const wages=c.players.reduce((t,p)=>t+p.wage,0);const budget=c.money-wages*6;if(budget<500000||c.players.length>=28)return;
  const tierStr=c.tier===1?70:c.tier===2?65:c.tier===3?61:57;const cand=[];
  for(const s of [...G.clubs,...G.leumit]){if(s===c||s.id===G.me||s.players.length<=20)continue;const top11=new Set(s.players.slice().sort(byOvr).slice(0,11).map(p=>p.id));for(const p of s.players){if(p.pos!==need.pos||p.inj||p.loanOut||(top11.has(p.id)&&s.money>0))continue;cand.push({p,from:s,fee:Math.round(marketValue(p)*(s.money<0?.9:1.15)/5e4)*5e4})}}
  for(const s of worldClubs()){for(const p of s.players){if(p.pos!==need.pos||p.key||p.inj)continue;cand.push({p,from:s,fee:Math.round(marketValue(p)*1.1/5e4)*5e4})}}
  for(const p of (G.freeAgents||[])){if(p.pos===need.pos)cand.push({p,from:null,fee:Math.round(contractDemand(p).bonus/1e4)*1e4,free:true})}
  const ok=cand.filter(x=>x.p.ovr>=Math.max(need.starter-1,tierStr-8)&&x.p.ovr<=tierStr+8&&x.fee<=budget*.55&&playerWage(x.p)*46<budget*.5);if(!ok.length)return;
  ok.forEach(x=>x.sc=x.p.ovr-need.starter-Math.log2(Math.max(1,x.fee/1e6))*1.4+(x.p.age<=24?1:x.p.age>=32?-2:0)+rnd(-1,1));ok.sort((a,b)=>b.sc-a.sc);const pickd=ok[0];const p=pickd.p;
  if(pickd.free){G.freeAgents=G.freeAgents.filter(x=>x!==p);moveToAI(p,null,c,pickd.fee)}else moveToAI(p,pickd.from,c,pickd.fee);
  const big=pickd.fee>=3e6||p.ovr>=68;tlog(`${c.short} ${pickd.free?'החתימה את השחקן החופשי':'רכשה את'} ${fullName(p)} (${POSHE[p.pos]}, ${p.ovr})${pickd.from?' מ'+pickd.from.short:''}${pickd.fee&&!pickd.free?' תמורת '+NIS(pickd.fee):''}. הסיבה: חיזוק ${POSHE[need.pos]}.`,big);if(big)news(`העברה: ${fullName(p)} עבר ל${c.short}${pickd.fee&&!pickd.free?' תמורת '+NIS(pickd.fee):''}.`)}
function aiSell(c){const over=c.players.length-27;if(over<=0&&c.money>=0)return;const top14=new Set(c.players.slice().sort(byOvr).slice(0,14).map(p=>p.id));
  const surplus=c.players.filter(p=>!top14.has(p.id)&&!p.loanOut).sort((a,b)=>(a.ovr-a.age*.3)-(b.ovr-b.age*.3));const p=c.money<0?c.players.filter(x=>(!top14.has(x.id)||c.money<-3e6)&&!x.loanOut).sort((a,b)=>b.value-a.value)[0]:surplus[0];if(!p)return;
  const buyers=[...G.clubs,...G.leumit].filter(x=>x!==c&&x.id!==G.me&&x.players.length<26&&x.money>marketValue(p)*1.4&&aiNeed(x)&&aiNeed(x).pos===p.pos);const fee=Math.round(marketValue(p)*.85/5e4)*5e4;
  if(buyers.length){const to=pick(buyers);c.players=c.players.filter(x=>x!==p);c.money+=fee;to.money-=fee;delete p.listed;p.contract=ri(1,3);p.morale=70;finalize(p);to.players.push(p);tlog(`${c.short} מכרה את ${fullName(p)} ל${to.short} תמורת ${NIS(fee)}${c.money<0?' (לחץ כלכלי)':''}.`,fee>=3e6)}
  else if(p.ovr>=62&&marketValue(p)>8e5){const ab=Math.round(marketValue(p)*.7/5e4)*5e4;c.players=c.players.filter(x=>x!==p);c.money+=ab;tlog(`${c.short} מכרה את ${fullName(p)} לחו"ל תמורת ${NIS(ab)}${c.money<0?' כדי לאזן את התקציב':''}.`,ab>=3e6)}
  else if(over>0){c.players=c.players.filter(x=>x!==p);if(p.age<34){p.contract=0;G.freeAgents.push(p)}tlog(`${c.short} שחררה את ${fullName(p)}.`)}}
function aiRenew(c){if(G.wk<8||G.wk%5)return;const top11=c.players.slice().sort(byOvr).slice(0,11);for(const p of top11){if(p.contract!==1||p.renewTried===G.season||p.loanOut)continue;p.renewTried=G.season;const w=Math.round(playerWage(p)*1.12/500)*500;if(c.money>w*46*.5&&Math.random()<.75){p.contract=ri(2,4);p.wage=w;if(p.ovr>=68)tlog(`${c.short} האריכה את החוזה של ${fullName(p)} (${p.ovr}).`)}}}
function aiYouth(c){if(c.players.length>=26||!c.youth||!c.youth.length)return;const cut=c.players.slice().sort(byOvr)[Math.min(19,c.players.length-1)];const y=c.youth.slice().sort((a,b)=>(b.ovr+b.pot*.3)-(a.ovr+a.pot*.3))[0];if(!y||!cut)return;if(y.ovr>=cut.ovr-1||(y.pot>=76&&y.ovr>=cut.ovr-5)){c.youth=c.youth.filter(x=>x!==y);y.contract=3;finalize(y);y.wage=playerWage(y);c.players.push(y);tlog(`${c.short} העלתה לבוגרים את ${fullName(y)} (${y.age}, פוטנציאל ${y.pot>=76?'גבוה':'טוב'}).`)}}
const TAC_IDS=[{press:'high',width:'wide',tempo:'fast',style:'possession'},{press:'mid',width:'normal',tempo:'normal',style:'balanced'},{press:'low',width:'narrow',tempo:'slow',style:'counter'},{press:'mid',width:'wide',tempo:'fast',style:'direct'},{press:'high',width:'normal',tempo:'fast',style:'counter'}];
function aiManager(c,ev){if(!ev||ev.t!=='league'||!(ev.n>=8))return;if(c.sackS===G.season&&(G.wk-c.sackWk<16||(c.sacks||0)>=2))return;
  const rs=G.results.filter(r=>r.kind==='league'&&(r.h===c.id||r.a===c.id)).slice(-6);if(rs.length<6)return;const pts=rs.reduce((t,r)=>{const gf=r.h===c.id?r.gh:r.ga,ga=r.h===c.id?r.ga:r.gh;return t+(gf>ga?3:gf===ga?1:0)},0);
  const div=G.leumit.includes(c)?'leumit':'top';const st=standingsOf(div);const pos=st.findIndex(x=>x.id===c.id)+1;if(pts>3||pos<st.length-2||Math.random()>.25)return;
  const old=c.coach||'המאמן';const nc=`${pick(STAFF_FIRST)} ${pick(STAFF_LAST)}`;const prevTac=tacOf(c);const nt={...pick(TAC_IDS.filter(t=>t.style!==prevTac.style))};c.coach=nc;c.tac=nt;c.sacks=c.sackS===G.season?(c.sacks||0)+1:1;c.sackWk=G.wk;c.sackS=G.season;c.coachHist=(c.coachHist||[]).concat([{name:old,until:seasonLabel()}]);c.players.forEach(p=>p.morale=clamp((p.morale??65)+4,10,100));
  news(`${c.name} פיטרה את ${old} אחרי ${pts} נקודות ב-6 משחקים. המאמן החדש: ${nc} (מאמן בדיוני).`);paper('ליגה',`${c.short} מחליפה מאמן`,`${old} פוטר, ${nc} נכנס לתפקיד`,`אחרי רצף של ${pts} נקודות ב-6 משחקים והמקום ה-${pos}, בהנהלה החליטו שאי אפשר לחכות. המאמן החדש מגיע עם גישה אחרת: ${TAC.press[nt.press]}, ${TAC.style[nt.style]}.`,c.id);tlog(`${c.short}: ${old} פוטר. ${nc} מונה, סגנון חדש: ${TAC.style[nt.style]}.`,true)}
function weeklyTransfersAI(){const ev=currentEvent();const open=WINDOW(G.wk);
  for(const c of [...G.clubs,...G.leumit]){if(c.id===G.me)continue;
    if(open){const pr=G.clubs.includes(c)?.14:.08;if(Math.random()<pr)aiBuy(c);if(Math.random()<.12||c.money<0)aiSell(c);if(Math.random()<.06)aiYouth(c)}
    aiRenew(c);try{aiManager(c,ev)}catch(e){}}
  rivalBids()}
/* rivals compete for the players you are negotiating for */
function rivalBids(){if(!WINDOW(G.wk))return;for(const n of (G.negs||[])){if(n.stage!=='club'&&n.stage!=='player')continue;const f=sellerClub(n.pid);if(!f)continue;const {p,c:sc}=f;
    if(n.rival){const r=club(n.rival.club);if(!r){n.rival=null;continue}if(G.wk-n.rival.wk>=2&&n.stage==='club'&&r.money>=n.rival.fee){moveToAI(p,sc,r,n.rival.fee);n.stage='dead';n.log.push(`${r.short} סגרה את העסקה ראשונה: ${NIS(n.rival.fee)}.`);news(`${r.short} הקדימה אותך: ${fullName(p)} חתם שם תמורת ${NIS(n.rival.fee)}.`);tlog(`${r.short} רכשה את ${fullName(p)} מ${sc.short} תמורת ${NIS(n.rival.fee)} (גברה על ${me().short}).`,true)}continue}
    if(Math.random()>.12)continue;const val=marketValue(p);const rivals=[...G.clubs,...G.leumit].filter(x=>x!==sc&&x.id!==G.me&&x.money>val*1.5&&x.players.length<27&&(aiNeed(x)||{}).pos===p.pos);if(!rivals.length)continue;
    const r=pick(rivals);const fee=Math.round(Math.max(n.ask,val*1.15)*rnd(1,1.12)/5e4)*5e4;n.rival={club:r.id,fee,wk:G.wk};n.ask=Math.max(n.ask,fee);n.patience=Math.max(n.patience,2);n.log.push(`⚠️ ${r.short} הגישה הצעה מתחרה של ${NIS(fee)}. ${sc.short} דורשת עכשיו לפחות את הסכום הזה.`);news(`${r.short} מתחרה על ${fullName(p)}: הצעה של ${NIS(fee)}. יש לך כשבועיים לסגור.`)}}
function weeklyOffers(){
  G.offers=G.offers.filter(o=>G.wk-o.wk<2);
  if(!WINDOW(G.wk)||Math.random()>(me().players.some(x=>x.listed)?.55:.3))return;
  const c=me();const listed=c.players.filter(x=>x.listed);const tops=c.players.slice().sort(byOvr).slice(0,8);const p=listed.length&&Math.random()<.6?pick(listed):pick(tops);
  if(Math.random()<.4&&p.ovr>=66){const from=foreignBuyerFor(p);const fee=Math.round(p.value*rnd(1.3,2.4)/1e5)*1e5;G.offers.push({pid:p.id,from:from.id,fee,wk:G.wk});news(`${from.name} (${WORLD_LEAGUES[from.lg].name}) הגישה הצעה של ${NIS(fee)} עבור ${fullName(p)}.`);return}
  const from=pick(G.clubs.filter(x=>x.id!==G.me&&x.money>p.value));if(!from)return;
  const fee=Math.round(p.value*rnd(1.05,1.6)/1e5)*1e5;if(fee>from.money*.6)return;
  G.offers.push({pid:p.id,from:from.id,fee,wk:G.wk});news(`${from.name} הגישה הצעה של ${NIS(fee)} עבור ${fullName(p)}.`);
}
function acceptOffer(i){const o=G.offers[i];if(!o)return;const c=me(),from=club(o.from);const p=c.players.find(x=>x.id===o.pid);if(!p){G.offers.splice(i,1);return render()}
  if(!from||from===c||!Number.isFinite(o.fee)||o.fee<=0||p.loan||G.wk-o.wk>=2||!WINDOW(G.wk))return toast('ההצעה כבר אינה תקפה');
  if(!from.pseudo&&(!Number.isFinite(from.money)||from.money<o.fee))return toast('לקבוצה הקונה אין מספיק תקציב');
  if(from.players.length>=30)return toast('הסגל של הקבוצה הקונה מלא');
  if(c.players.length<=16)return toast('אי אפשר לרדת מתחת ל-16 שחקנים');
  c.players=c.players.filter(x=>x!==p);if(c.lineup)c.lineup=c.lineup.map(id=>id===p.id?null:id);if(c.captain===p.id)c.captain=null;let net=o.fee;if(p.sellon){const cut=Math.round(o.fee*p.sellon.pct/100);net-=cut;addLog(`${p.sellon.pct}% ל${p.sellon.to} ממכירת ${fullName(p)}`,-cut);p.sellon=null}c.money+=net;if(!from.pseudo)from.money-=o.fee;from.players.push(p);G.offers.splice(i,1);addLog(`מכירת ${fullName(p)}`,o.fee);news(`${fullName(p)} נמכר ל${from.short} תמורת ${NIS(o.fee)}.`);saleStory(p,c,from,o.fee);G.board.conf=clamp(G.board.conf+(o.fee>p.value*1.3?1:-2),0,100);autoLineups();save();render()}
function counterOffer(i){const o=G.offers[i];if(!o)return;const from=club(o.from);const p=me().players.find(x=>x.id===o.pid);if(!p)return;if(o.countered)return toast('הם כבר שיפרו פעם אחת');
  if(Math.random()<.5&&(from.world||from.money*.6>=o.fee*1.15)){o.fee=Math.round(o.fee*1.15/1e5)*1e5;o.countered=true;news(`${from.short} שיפרה את ההצעה עבור ${fullName(p)} ל-${NIS(o.fee)}.`);toast('ההצעה שופרה')}else{G.offers.splice(i,1);news(`${from.short} משכה את ההצעה עבור ${fullName(p)}.`);if(p.unhappy)p.morale=clamp(p.morale-5,10,100);toast('ההצעה נמשכה')}save();render()}
function rejectOffer(i){const o=G.offers[i];if(o){const p=me().players.find(x=>x.id===o.pid);if(p&&o.fee>p.value*1.3)p.morale=clamp((p.morale??65)-3,10,100)}G.offers.splice(i,1);save();render()}

function seasonLabel(){const y=2026+G.season-1;return `${y}/${String(y+1).slice(2)}`}
function news(t){G.news.unshift({wk:G.wk,s:G.season,t});G.news=G.news.slice(0,60)}

