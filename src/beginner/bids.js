/* ---- bids for the coach's own players ----
   Nobody ever asked about a player of his: the league's top scorer could play five seasons in the second division and no
   club above would notice. Now a bigger club makes an offer for a player who stands out — one of the league's three
   leading scorers or two leading providers — twice in a season (after about 40% and 72% of the rounds) and once in the
   summer, for the season that has just ended.

   Who asks: a club of the league above; in a top division the bigger clubs of his own league; and when nobody at home is
   bigger, a club abroad. The offer is above the market value (a proven scorer costs more than his rating says), it stays
   on the table for BBID_LIFE rounds, and the coach decides: sell, ask for more (once: it is raised or it is their last
   word, it is never taken away for asking) or refuse — a refused player is not asked about again that season.

   b.bid {pid, buyer, fee, until, s, why, rank, n, last, asked}; b.bidAt = the window already used; b.bidNo {pid: season}.
   Bids are made by events (a round played, a season turned), never by drawing a screen. */
const BBID_LIFE=3;
/* the player of his that the league talks about, or null. final = the season is over (the summer window) */
function BbidStar(final){const b=Bstate(),c=me();if(!b||!c)return null;const loan=new Set((b.loans||[]).map(l=>l.pid)),no=b.bidNo||{},min=final?6:4;
  const ok=s=>s.clubId===c.id&&c.players.some(p=>p.id===s.pid)&&!loan.has(s.pid)&&(final||no[s.pid]!==b.season);
  const g=Bleaders('goals'),a=Bleaders('assists');
  for(let i=0;i<Math.min(3,g.length);i++)if(ok(g[i])&&g[i].goals>=min)return {pid:g[i].pid,why:'goals',rank:i+1,n:g[i].goals,last:!!final};
  for(let i=0;i<Math.min(2,a.length);i++)if(ok(a[i])&&a[i].assists>=min)return {pid:a[i].pid,why:'assists',rank:i+1,n:a[i].assists,last:!!final};
  return null}
function BbidBuyer(p){const b=Bstate(),c=me(),l=BcatLeague(b.leagueId),z=l?BprZones(l):{};let xs=[];
  if(z.upTo)xs=z.upTo.clubs.filter(x=>x.key!==c.bkey).sort((m,n)=>n.str-m.str).slice(0,8);                                   /* the league above */
  else if(l&&!l.cup)xs=l.clubs.filter(x=>x.key!==c.bkey&&x.str>=BmyStr()+1).sort((m,n)=>n.str-m.str).slice(0,5);              /* the bigger clubs of his own league */
  if(!xs.length)xs=Bcat().filter(k=>!k.cup).flatMap(k=>k.leagues.filter(y=>y.tier===1).flatMap(y=>y.clubs)).filter(x=>x.key!==c.bkey&&x.str>=Math.max(BmyStr()+1,p.ovr)&&x.str<=p.ovr+14).slice(0,14);   /* nobody at home is bigger: abroad */
  for(const x of shuffle(xs.slice())){const k=BaddClub(x);if(k&&k.id!==c.id&&k.players.length<35)return k}return null}
/* above the market value, and something for every goal: what a scorer has done is worth more than his rating says */
function BbidFee(p,star){const g=star.why==='goals',k=g?[1.6,1.45,1.3][star.rank-1]:[1.4,1.3][star.rank-1],v=Bvalue(p),per=clamp(v*.06,20000,120000)*(g?1:.6);return Math.max(300000,Math.round((v*(k||1.25)+per*(star.n||0))/50000)*50000)}
function BbidMake(star){const b=Bstate(),c=me(),p=star&&c.players.find(x=>x.id===star.pid);if(!p||b.out||BsaleBlocked(p))return null;const buyer=BbidBuyer(p);if(!buyer)return null;
  b.bid={pid:p.id,buyer:buyer.id,fee:BbidFee(p,star),until:b.round+BBID_LIFE,s:b.season,why:star.why,rank:star.rank,n:star.n,last:!!star.last,asked:false};
  try{BpaperBid(p,buyer,b.bid)}catch(e){console.warn('paper',e)}return b.bid}
/* an offer whose time has passed, or whose player is no longer his, is gone */
function BbidTidy(){const b=Bstate();if(b&&b.bid&&(b.out||b.bid.s!==b.season||b.round>=b.bid.until||!me().players.some(p=>p.id===b.bid.pid)))b.bid=null}
/* after a round: the two windows of a season */
function BbidRound(){const b=Bstate();if(!b||b.out||b.daily||!b.schedule)return;BbidTidy();if(b.bid)return;const n=b.schedule.length,slot=b.round===Math.round(n*.4)?1:b.round===Math.round(n*.72)?2:0;
  if(!slot||b.bidAt===b.season+':'+slot)return;b.bidAt=b.season+':'+slot;const star=BbidStar(false);if(star)BbidMake(star)}
function BbidWhy(o){const g=o.why==='goals',t=o.last?'בעונה שעברה':'העונה';
  return o.rank===1?(g?`מלך השערים של הליגה ${t}, עם <bdi>${o.n}</bdi> שערים`:`מלך הבישולים של הליגה ${t}, עם <bdi>${o.n}</bdi> בישולים`):(g?`מהכובשים המובילים בליגה ${t}: <bdi>${o.n}</bdi> שערים`:`מהמבשלים המובילים בליגה ${t}: <bdi>${o.n}</bdi> בישולים`)}
function BpaperBid(p,buyer,o){const c=me(),name=fullName(p),g=o.why==='goals',what=o.rank===1?(g?'מלך השערים':'מלך הבישולים'):(g?'אחד הכובשים המובילים בליגה':'אחד המבשלים המובילים בליגה');
  Bpaper('העברות',`${buyer.name} רוצה את ${name}`,`הצעה של ${NIS(o.fee)} על ${what}`,`${buyer.name} הגישה ל${c.name} הצעה רשמית על ${name}, ${what}${o.last?' של העונה שעברה':''} עם ${o.n} ${g?'שערים':'בישולים'}. הסכום, ${NIS(o.fee)}, גבוה משווי השוק שלו. ההחלטה בידי המאמן: למכור ולחזק את הקופה, לבקש יותר או להשאיר את השחקן. ההצעה בתוקף עד מחזור ${o.until+1}.`,{type:'bid',pid:p.id,player:name,pos:p.pos,vid:playerVisualId(p),clubId:c.id,club:c.name,buyer:buyer.name,buyerId:buyer.id,fee:o.fee,value:Bvalue(p)},true)}
/* on the home page, while an offer is on the table */
function BbidCardHTML(){const b=Bstate(),o=b&&b.bid;if(!o||b.out||o.s!==b.season||b.round>=o.until)return '';const c=me(),p=c.players.find(x=>x.id===o.pid),buyer=club(o.buyer);if(!p||!buyer)return '';const blocked=BsaleBlocked(p);
  return `<section class="bpanel bbid" aria-label="הצעה על שחקן"><span class="beyebrow">הצעה על השולחן · עד מחזור <bdi>${o.until+1}</bdi></span>
   <div class="bbid-row">${Bportrait(p,c)}<div><h2>${esc(buyer.name)} רוצה את ${esc(fullName(p))}</h2><p>${BbidWhy(o)}.</p></div></div>
   <div class="btransaction"><span>ההצעה</span><strong class="bpositive">${Bmoney(o.fee)}</strong></div><div class="btransaction"><span>שווי שוק</span>${Bmoney(Bvalue(p))}</div><div class="btransaction"><span>שכר שנתי שייחסך</span>${Bmoney(Byear(p))}</div>
   ${blocked?`<p class="bmuted">${esc(blocked)}</p>`:''}<div class="bbid-acts">${blocked?'':Bbutton('מוכר ב־'+Bmoney(o.fee),'data-action="bid-sell"')}${blocked||o.asked?'':Bbutton('לבקש יותר','data-action="bid-more"','secondary')}${Bbutton('דוחה, הוא נשאר','data-action="bid-no"','secondary')}</div></section>`}
function BbidAccept(){const b=Bstate(),o=b.bid,c=me();if(!o)return false;const p=c.players.find(x=>x.id===o.pid),buyer=club(o.buyer);if(!p||!buyer||BsaleBlocked(p)||b.round>=o.until){b.bid=null;Bwrite();Brender();return false}
  buyer.money=Math.max(0,(buyer.money||0)-o.fee);c.players=c.players.filter(x=>x.id!==p.id);buyer.players.push(p);Bledger('מכירת '+fullName(p)+' ל'+buyer.name,o.fee);try{BpaperSale(p,buyer,o.fee)}catch(e){console.warn('paper',e)}
  c.lineup=(c.lineup||[]).map(id=>id===p.id?null:id);BensureXI(c);ensureCaptain(c);b.bid=null;try{Bcount('sales');BmsFill()}catch(e){}Bwrite();Btab='home';Brender();
  Bdialog(`<h2>המכירה הושלמה</h2><p>${esc(fullName(p))} עבר ל${esc(buyer.name)} תמורת ${Bmoney(o.fee)}. הכסף כבר בקופה, ואפשר לחפש לו מחליף ברכש.</p>${Bbutton('לרכש','data-tab="market" data-bclose')}<button type="button" class="blink" data-bclose>אחר כך</button>`);return true}
document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('[data-action^="bid-"]');if(!el||!G||!G.beginner)return;const b=Bstate(),o=b.bid,a=el.dataset.action;if(!o||b.live)return;const c=me(),p=c.players.find(x=>x.id===o.pid),buyer=club(o.buyer);if(!p||!buyer){b.bid=null;Bwrite();Brender();return}
  if(a==='bid-no'){(b.bidNo=b.bidNo||{})[p.id]=b.season;b.bid=null;Bnotice=`${fullName(p)} נשאר ב${c.name}`;Bwrite();Brender();return}
  if(a==='bid-more'){if(o.asked)return;o.asked=true;if(o.rank===1||Math.random()<.6){o.fee=Math.round(o.fee*1.15/50000)*50000;try{Bflash(`<b>ההצעה שופרה</b><br>${esc(buyer.name)} מעלה ל־${Bmoney(o.fee)}`)}catch(x){}}else{try{Bflash(`<b>זו ההצעה האחרונה שלהם</b><br>${esc(buyer.name)} לא מעלה את הסכום`)}catch(x){}}Bwrite();Brender();return}
  if(a==='bid-sell'){if(!el.hasAttribute('data-sure')){Bdialog(`<div class="bprofile">${Bportrait(p,c)}<h2>למכור את ${esc(fullName(p))}?</h2></div><p>${esc(buyer.name)} משלמת ${Bmoney(o.fee)}.</p><div class="btransaction"><span>שווי שוק</span>${Bmoney(Bvalue(p))}</div><div class="btransaction"><span>שכר שנתי שייחסך</span>${Bmoney(Byear(p))}</div><div class="blearn">אחרי המכירה יהיו בחשבון ${Bmoney(c.money+o.fee)}. השחקן יעבור ל${esc(buyer.name)} ויֵצא מהסגל שלך.</div>${Bbutton('אישור מכירה','data-action="bid-sell" data-sure')}<button type="button" class="blink" data-bclose>עוד לא</button>`);return}
    el.closest('dialog')?.remove();BbidAccept()}});
