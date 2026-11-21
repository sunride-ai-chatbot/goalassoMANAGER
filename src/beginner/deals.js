/* GOALASSO START — deals: the transfer window, and more than one way to agree on a player.
   A career changes here from a button or from a match that ended, never while a screen is drawn. */

/* ---------- the transfer window ----------
   A player could be signed in any round of a season. There are now two windows, as in football: the summer one, open from the first day
   of a season for its first rounds, and the winter one around the middle. Outside them a club neither buys, borrows nor sells; a free
   agent has no club to release him and can be signed at any time. Everything follows from the round alone (BwinInfo only reads), and
   the game says how long is left: in the market, on the home page, and loudly when two rounds or fewer remain. */
function BwinInfo(){const b=Bstate();if(!b||!b.schedule||window.__noWindow)return {open:true,none:true};const n=b.schedule.length,r=b.round;
  const s1=Math.max(3,Math.round(n*.15)),w0=Math.round(n*.46),w1=w0+Math.max(3,Math.round(n*.12));
  if(r<s1)return {open:true,name:'חלון הקיץ',left:s1-r,close:s1};if(r>=w0&&r<w1)return {open:true,name:'חלון החורף',left:w1-r,close:w1,first:r===w0};
  if(r<w0)return {open:false,next:w0-r,nextName:'חלון החורף',close:w1};return {open:false,next:null,nextName:'חלון הקיץ'}}
const BwinOpen=()=>BwinInfo().open;
const BwinRounds=n=>n===1?'מחזור אחד':`<bdi>${n}</bdi> מחזורים`;
function BwinLineHTML(){const w=BwinInfo();if(w.none)return '';
  if(w.open)return `<div class="bwin${w.left<=2?' warn':''}" role="status"><strong>${w.name} פתוח</strong><span>${w.left===1?'נסגר אחרי המשחק הבא: זו ההזדמנות האחרונה להחתים':`נסגר בעוד ${BwinRounds(w.left)}`}</span></div>`;
  return `<div class="bwin shut" role="status"><strong>חלון ההעברות סגור</strong><span>${w.next?`${w.nextName} נפתח בעוד ${BwinRounds(w.next)}`:'החלון הבא נפתח בקיץ, עם פתיחת העונה'} · שחקנים חופשיים אפשר להחתים תמיד</span></div>`}
/* on the home page only when it matters: a window that has just opened, or one about to close */
function BwinBannerHTML(){const w=BwinInfo(),b=Bstate();if(w.none||!w.open||b.out)return '';
  if(w.left<=2)return `<button type="button" class="bwin-banner warn" data-tab="market"><strong>${w.left===1?'חלון ההעברות נסגר אחרי המשחק הבא':`חלון ההעברות נסגר בעוד ${BwinRounds(w.left)}`}</strong><span>אחר כך אי אפשר לקנות, להשאיל או למכור עד החלון הבא. לרכש ›</span></button>`;
  if(w.first)return `<button type="button" class="bwin-banner" data-tab="market"><strong>${w.name} נפתח</strong><span>פתוח ${BwinRounds(w.left)}. לרכש ›</span></button>`;return ''}
const BwinShutHTML=()=>{const w=BwinInfo();return `<p class="bnote bad">חלון ההעברות סגור${w.next?`: ${w.nextName} נפתח בעוד ${BwinRounds(w.next)}`:' עד הקיץ'}. עד אז אפשר להחתים רק שחקנים חופשיים.</p>`};
/* a scout's tip is a price for a window: one dealt while the window is shut waits for the next one instead of running out unused */
function BtipUntil(){const b=Bstate(),w=BwinInfo();if(w.none)return {until:b.round+4,s:b.season};if(w.open)return {until:w.close-1,s:b.season};
  if(w.next)return {until:w.close-1,s:b.season};const n=b.schedule.length;return {until:Math.max(3,Math.round(n*.15))-1,s:b.season+1}}

/* ---------- more than one way to agree ----------
   An offer was one number, and a loan was one fixed fee. A club now also lays other shapes of the same deal on the table — one to three of
   them, drawn when the talk about that player opens and kept for it (a new look does not deal again):
     buying   · a share of a future sale (pay less now, the seller gets 5–20% when you sell him on)
              · two payments (half now, half when the next season opens)
              · a bonus on success (less now, more only if he scores or plays enough this season)
              · a loan now with a purchase that is already agreed for the summer
     a loan   · the ordinary one · the parent club pays part of his wage for a higher fee
              · a free loan of a youngster who has to be given matches (a fine if he is not) · the loan with an agreed purchase
   What was agreed is kept where it is owed: on the player (p.bSellOn, p.bPay), in b.owed (a payment with a date), in b.clauses (a
   condition counted from the matches) and on the loan itself (buy). */
let Bdeals=null;
const BdealRnd=()=>(window.__dealRnd||Math.random)();
const BdealRound=v=>Math.max(0,Math.round(v/10000)*10000);
function BdealGoalNeed(p){const left=Math.max(1,Bstate().schedule.length-Bstate().round);return Math.max(2,Math.round(left*(p.pos==='FW'?.32:.16)*(p.ovr>=75?1.15:1)))}
function BdealAppsNeed(){const left=Math.max(1,Bstate().schedule.length-Bstate().round);return Math.max(2,Math.round(left*.6))}
function BdealBuyList(p,c,dem){const out=[],pcts=[5,10,15,20].sort(()=>BdealRnd()-.5);
  const so=pct=>({t:'sellon',pct,fee:BdealRound(dem*(1-pct*.9/100)),title:`<bdi>${pct}%</bdi> ממכירה עתידית`,lines:[`משלמים עכשיו ${Bmoney(BdealRound(dem*(1-pct*.9/100)))} במקום ${Bmoney(dem)}`,`כשתמכור אותו, ${esc(c.name)} תקבל <bdi>${pct}%</bdi> מהסכום`]});
  const half=BdealRound(dem*1.04/2);
  const split={t:'split',fee:half,later:half,title:'שני תשלומים',lines:[`${Bmoney(half)} עכשיו`,`${Bmoney(half)} בפתיחת העונה הבאה`]};
  const goals=p.pos==='FW'||p.pos==='MF',need=goals?BdealGoalNeed(p):BdealAppsNeed(),now=BdealRound(dem*.86),bon=BdealRound(dem*.24);
  const bonus={t:'bonus',fee:now,kind:goals?'goals':'apps',need,amount:bon,title:'בונוס הצלחה',lines:[`משלמים עכשיו ${Bmoney(now)}`,`ועוד ${Bmoney(bon)} רק אם ${goals?`יכבוש <bdi>${need}</bdi> שערים`:`ישחק <bdi>${need}</bdi> משחקים`} עד סוף העונה`]};
  const lf=BdealRound(Bvalue(p)*.06),buy=BdealRound(dem*.97);
  const lbuy={t:'loanbuy',loan:true,fee:lf,buy,title:'השאלה עכשיו, קנייה בקיץ',lines:[`${Bmoney(lf)} דמי השאלה עכשיו`,`${Bmoney(buy)} בקיץ, והוא נשאר שלך`,'אם לא יהיה כסף בקופה בקיץ, הוא יחזור למועדון שלו']};
  out.push(so(pcts[0]));const rest=[split,bonus,lbuy,so(pcts[1])].sort(()=>BdealRnd()-.5);const n=Math.floor(BdealRnd()*3);return out.concat(rest.slice(0,n))}
function BdealLoanList(p,c){const v=Bvalue(p),base=BdealRound(v*(.06+BdealRnd()*.03)),out=[{t:'loan',loan:true,fee:base,title:'השאלה רגילה',lines:[`${Bmoney(base)} דמי השאלה`,'השכר המלא עליך עד סוף העונה']}];
  const share=[30,40,50][Math.floor(BdealRnd()*3)],wf=BdealRound(v*.12),extra=[{t:'loanwage',loan:true,fee:wf,share,title:'השכר מתחלק',lines:[`${Bmoney(wf)} דמי השאלה`,`${esc(c.name)} ממשיכה לשלם <bdi>${share}%</bdi> מהשכר שלו`]}];
  if(p.age<=22){const need=BdealAppsNeed(),fine=BdealRound(v*.1);extra.push({t:'loanfree',loan:true,fee:0,kind:'apps',need,amount:fine,fine:true,title:'השאלה בלי דמי השאלה',lines:['בלי תשלום עכשיו: המועדון רוצה שהוא ישחק',`אם ישחק פחות מ־<bdi>${need}</bdi> משחקים, תשלם קנס של ${Bmoney(fine)}`]})}
  const core=c.players.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,11).includes(p),buy=BdealRound(Math.round(v*(core?1.5:1.12)/50000)*50000*.97),lf=BdealRound(v*.06);
  extra.push({t:'loanbuy',loan:true,fee:lf,buy,title:'השאלה עכשיו, קנייה בקיץ',lines:[`${Bmoney(lf)} דמי השאלה עכשיו`,`${Bmoney(buy)} בקיץ, והוא נשאר שלך`,'אם לא יהיה כסף בקופה בקיץ, הוא יחזור למועדון שלו']});
  extra.sort(()=>BdealRnd()-.5);return out.concat(extra.slice(0,Math.floor(BdealRnd()*3)))}
/* the deals on the table for this player: dealt once for a talk (a player, a kind, a price) and kept until it is over */
function BdealsFor(p,c,kind,dem){const key=p.id+':'+kind+':'+Bstate().season+':'+Bstate().round;if(Bdeals&&Bdeals.key===key&&(kind==='loan'||Bdeals.dem===dem))return Bdeals;
  Bdeals={key,pid:p.id,kind,dem,list:kind==='loan'?BdealLoanList(p,c):BdealBuyList(p,c,dem)};return Bdeals}
function BdealsHTML(D,head){return `<div class="bdeals"><p class="bdeals-h">${head}</p>${D.list.map((d,i)=>`<article class="bdeal"><h4>${d.title}</h4><ul>${d.lines.map(l=>`<li>${l}</li>`).join('')}</ul><button type="button" class="bbtn secondary" data-deal="${i}">בחר בעסקה הזאת</button></article>`).join('')}</div>`}
function BdealWage(p,d){return Math.round(Byear(p)*(d&&d.t==='loanwage'?1-d.share/100:1))}
function BdealPick(i){const f=Bfind(Bselected),d=Bdeals&&Bdeals.list[i],reply=document.getElementById('breply');if(!f||!f.c||!d||Bdeals.pid!==f.p.id||f.c.id===G.me)return false;const {p,c}=f;
  if(!BwinOpen()){if(reply)reply.innerHTML=BwinShutHTML();return false}
  if(c.players.length<=14){if(reply)reply.textContent='המועדון לא יכול לשחרר כרגע שחקן נוסף בלי לפגוע בסגל שלו.';return false}if(me().players.length>=35){if(reply)reply.textContent='הסגל מלא. כבר יש לך 35 שחקנים.';return false}
  const wage=BdealWage(p,d),salary=Math.round(wage*Bremaining());if(me().money<d.fee||Bbudget()-d.fee-salary<0){if(reply)reply.innerHTML=`<p class="bnegative">העסקה הזאת עולה עכשיו ${Bmoney(d.fee+salary)} (התשלום הראשון ושכר עד סוף העונה), והתקציב הפנוי לרכש הוא ${Bmoney(Math.max(0,Bbudget()))}.</p>`;return false}
  Bdialog(`<h2>${d.loan?'השאלה עד סוף העונה':'סיכום העסקה'}</h2><p>${esc(fullName(p))} · ${d.title}</p>${d.lines.map(l=>`<p class="bdeal-line">${l}</p>`).join('')}<div class="btransaction"><span>לתשלום עכשיו</span>${Bmoney(d.fee)}</div><div class="btransaction"><span>שכר לשנה${d.t==='loanwage'?' (החלק שלך)':''}</span>${Bmoney(wage)}</div><div class="btransaction"><span>יישאר בחשבון אחרי התשלום</span>${Bmoney(me().money-d.fee)}</div><div class="bdock">${Bbutton('אישור וחתימה',`data-sign="${p.id}" data-fee="${d.fee}" data-loan="${d.loan?'1':'0'}" data-dealno="${i}"`)}${Bbutton('ביטול','data-bclose','secondary')}</div>`);return true}
/* what was agreed, written where it is owed. Called by Bsign once the player is in the squad. */
function BdealApply(p,c,d){const b=Bstate();if(!d||!c)return;
  if(d.t==='sellon')p.bSellOn={pct:d.pct,to:c.name};
  if(d.t==='split')b.owed=[...(b.owed||[]),{t:'תשלום שני על '+fullName(p),v:d.later,s:b.season+1,to:c.name}];
  if(d.t==='bonus'||d.t==='loanfree')b.clauses=[...(b.clauses||[]),{pid:p.id,name:fullName(p),kind:d.kind,need:d.need,have:0,amount:d.amount,fine:!!d.fine,to:c.name,s:b.season}];
  if(d.t==='loanwage')p.bPay=1-d.share/100;
  if(d.t==='loanbuy'){const l=(b.loans||[]).find(x=>x.pid===p.id);if(l)l.buy=d.buy}}
/* a competitive match of the coach's club: the conditions that are counted from matches */
function BdealAfter(M){const b=Bstate(),c=me();if(!b)return;if(b.dealNotes&&b.dealNotes.length)b.dealNotes=[];if(!b.clauses||!b.clauses.length||(M.bX&&M.bX.kind==='pre'))return;const on=new Set([...((M.xi&&M.xi[c.id])||[]).map(x=>x.pid),...((M.used&&M.used[c.id])||[])]);
  for(const k of b.clauses){if(k.s!==b.season)continue;if(k.kind==='apps'){if(on.has(k.pid))k.have++}else k.have+=M.ev.filter(e=>(e.t==='goal'||e.t==='pen')&&e.team===c.id&&e.pid===k.pid).length}}
/* the season is over: bonuses that were earned and fines that were not avoided are paid; then what was owed for this summer */
function BdealSeasonEnd(){const b=Bstate(),c=me(),notes=[];if(!b||!c)return notes;
  for(const k of b.clauses||[]){if(k.s!==b.season)continue;const met=k.have>=k.need;if(k.fine?!met:met){Bledger(k.fine?`קנס ל${k.to}: ${k.name} לא שיחק מספיק`:`בונוס הצלחה ל${k.to} על ${k.name}`,-k.amount);notes.push(k.fine?`${k.name} שיחק <bdi>${k.have}</bdi> משחקים מתוך <bdi>${k.need}</bdi> שהובטחו: קנס של ${Bmoney(k.amount)}.`:`${k.name} עמד בתנאי (<bdi>${k.have}</bdi> מתוך <bdi>${k.need}</bdi>): בונוס של ${Bmoney(k.amount)} ל${esc(k.to)}.`)}}
  b.clauses=(b.clauses||[]).filter(k=>k.s>b.season);return notes}
/* a loan with a purchase agreed for the summer: he stays when the money is there, and goes back when it is not */
function BdealLoanBuy(l){const c=me(),p=c.players.find(x=>x.id===l.pid);if(!p||!l.buy)return false;if(c.money<l.buy)return false;Bledger('רכישת '+fullName(p)+' בתום ההשאלה',-l.buy);delete p.bPay;return true}
function BdealSeasonStart(){const b=Bstate();if(!b||!b.owed)return;const due=b.owed.filter(o=>o.s<=b.season);for(const o of due)Bledger(o.t,-o.v);b.owed=b.owed.filter(o=>o.s>b.season)}
const BdealOwed=()=>(Bstate().owed||[]).reduce((s,o)=>s+o.v,0);
/* a sale: the club he was bought from takes the share that was agreed */
function BdealSold(p,fee){if(!p||!p.bSellOn)return 0;const cut=Math.round(fee*p.bSellOn.pct/100);if(cut>0)Bledger(`${p.bSellOn.pct}% ל${p.bSellOn.to} ממכירת ${fullName(p)}`,-cut);delete p.bSellOn;return cut}
/* what the season's end settled, said once on the home page until the next match */
function BdealHomeHTML(){const n=Bstate().dealNotes;return n&&n.length?`<ul class="benv-live bdeal-home">${n.map(t=>`<li>${t}</li>`).join('')}</ul>`:''}
function BdealNotesHTML(p){const b=Bstate(),out=[];if(p.bSellOn)out.push(`${esc(p.bSellOn.to)} תקבל <bdi>${p.bSellOn.pct}%</bdi> ממכירה שלו`);if(p.bPay&&p.bPay<1)out.push(`המועדון שלו משלם <bdi>${Math.round((1-p.bPay)*100)}%</bdi> מהשכר`);
  const l=(b.loans||[]).find(x=>x.pid===p.id);if(l)out.push(l.buy?`מושאל; בקיץ הוא נקנה ב־${Bmoney(l.buy)}`:'מושאל עד סוף העונה');
  for(const k of b.clauses||[])if(k.pid===p.id&&k.s===b.season)out.push(k.fine?`צריך לשחק <bdi>${k.need}</bdi> משחקים (עד עכשיו <bdi>${k.have}</bdi>), אחרת קנס של ${Bmoney(k.amount)}`:`בונוס של ${Bmoney(k.amount)} ל${esc(k.to)} אם ${k.kind==='goals'?'יכבוש':'ישחק'} <bdi>${k.need}</bdi> (עד עכשיו <bdi>${k.have}</bdi>)`);
  return out.length?`<ul class="bdeal-notes">${out.map(t=>`<li>${t}</li>`).join('')}</ul>`:''}
function BdealBookHTML(){const b=Bstate(),rows=[];for(const o of b.owed||[])rows.push(`<li><span>${esc(o.t)}</span><b>${Bmoney(o.v)}</b><small>בפתיחת עונה <bdi>${o.s}</bdi></small></li>`);
  for(const k of b.clauses||[])if(k.s===b.season)rows.push(`<li><span>${k.fine?'קנס אפשרי':'בונוס אפשרי'} · ${esc(k.name)}</span><b>${Bmoney(k.amount)}</b><small>${k.kind==='goals'?'שערים':'משחקים'}: <bdi>${k.have}</bdi> מתוך <bdi>${k.need}</bdi></small></li>`);
  for(const l of b.loans||[])if(l.buy){const p=me().players.find(x=>x.id===l.pid);if(p)rows.push(`<li><span>רכישת ${esc(fullName(p))} בתום ההשאלה</span><b>${Bmoney(l.buy)}</b><small>בקיץ, אם יהיה כסף בקופה</small></li>`)}
  return rows.length?`<section class="bpanel"><h2>התחייבויות מעסקאות</h2><p class="bmuted">מה שסוכם בעסקאות ועוד לא שולם.</p><ul class="bbook-rec bowed">${rows.join('')}</ul></section>`:''}

/* ---------- selling: the buyer can be pressed too ----------
   A sale was one offer to take or leave. The buyer has a ceiling the coach cannot see and patience for two requests: a request under
   the ceiling raises the offer part of the way; one over it is met with "this is our last word", and a third request ends the talk. */
function BsaleCeil(p,fee){const h=((p.id*40503+(Bstate().season||1)*131)>>>0)%9;return Math.round(fee*(1.05+h/100)/10000)*10000}
function BsaleMore(){const b=Bstate(),o=b.saleOffer;if(!o)return null;const p=me().players.find(x=>x.id===o.pid);if(!p)return null;o.asks=(o.asks||0)+1;const ceil=o.ceil||(o.ceil=BsaleCeil(p,o.fee));
  if(o.asks>2){b.saleNo={[o.pid]:b.season+':'+b.round};delete b.saleOffer;Bwrite();return {gone:true}}
  if(o.fee>=ceil){o.last=true;Bwrite();return {last:true,fee:o.fee}}o.fee=Math.min(ceil,Math.round((o.fee+(ceil-o.fee)*(o.asks===1?.6:1))/10000)*10000);if(o.fee>=ceil)o.last=true;Bwrite();return {fee:o.fee,last:!!o.last}}

document.addEventListener('click',e=>{const t=e.target&&e.target.closest?e.target:null;if(!t||!G||!G.beginner)return;let el;
  if((el=t.closest('[data-deal]'))){BdealPick(+el.dataset.deal);return}
  if(t.closest('[data-action="deals"]')){const f=Bfind(Bselected),reply=document.getElementById('breply');if(!f||!f.c||!reply)return;if(!BwinOpen()){reply.innerHTML=BwinShutHTML();return}if(BtipFor(f.p)){reply.innerHTML='<p>על המחיר המיוחד מהסקאוט אין מבני עסקה אחרים: הוא כבר אחרי ההנחה.</p>';return}
    const core=f.c.players.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,11).includes(f.p),ask=Math.round(Bvalue(f.p)*(core?1.5:1.12)/50000)*50000,dem=Bneg&&Bneg.pid===f.p.id?Bneg.dem:ask;reply.innerHTML=BdealsHTML(BdealsFor(f.p,f.c,'buy',dem),`${esc(f.c.name)} מוכנה גם לעסקאות האלה, לפי מחיר של ${Bmoney(dem)}:`);return}
  if(t.closest('[data-sale-more]')){const r=BsaleMore(),d=document.querySelector('.bdialog');if(!r)return;if(r.gone){d?.remove();Bdialog(`<h2>ההצעה ירדה מהשולחן</h2><p>המועדון הקונה איבד סבלנות ומשך את ההצעה. אפשר לנסות שוב אחרי המשחק הבא.</p>${Bbutton('הבנתי','data-bclose','secondary')}`);return}
    d?.remove();BsaleDialog(Bstate().saleOffer.pid,true);return}});
