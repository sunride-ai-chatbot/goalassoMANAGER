/* ---- promotion and relegation ----
   A career used to stay in the league it began in: the champion of the second division started the next season in the
   second division. Now the leagues of one country are a ladder. At the end of a season the last places of every league go
   down and the first places of the league under it come up — two between two leagues; where the lower tier has two
   districts (Liga Alef north and south under Leumit) the champion of each comes up and the two that go down are sent to
   the district they belong to, so a district may be a club larger or smaller than it was.

   The catalogue (BcatBase) is the world as it starts. A career keeps what changed since in b.moves {club key: league id},
   and Bcat() lays it over the base, so everything that reads the catalogue — the table, the market's leagues, job offers,
   contract goals, Europe — sees the leagues as this career has them.

   Only the coach's league is played. The league he is in is decided by its real table; the others of his country by a
   table that was never played: each club's strength and some luck, from a generator seeded by the career and the season,
   so the same season always ends the same way.

   b.pr is the plan of the season that just ended (made when its summary opens, so the summary can say what is coming);
   it becomes b.moves when the season turns (BprApply), and BprSettle then puts the coach's club in the league it is in now.
   b.prV is the last season whose start went through this code: a career whose champion was left where he was (b.prV
   missing) is put right when it loads (BprRepair). */
const BNORTH=/קריית ים|קריית שמונה|קריית אתא|קריית ביאליק|קריית מוצקין|עפולה|ריינה|נצרת|עכו|נוף הגליל|טבריה|חיפה|סכנין|כרמיאל|נשר|טמרה|שפרעם|אום אל|חדרה|צפת|נהריה|מגדל העמק|טירת כרמל|בית שאן|יקנעם|עראבה|כפר כנא|טורעאן|דלית|עוספיא|אכסאל|כאבול|מעלות|קצרין|גליל|כרמל|זכרון|פרדס חנה|אור עקיבא|באקה|ג׳ת|טייבה|כפר קרע|עין מאהל/;

/* the base catalogue with a career's moves laid over it. A club that changed tier takes a strength its new league can
   believe: a promoted one is no weaker than a notch under the league's weakest, a relegated one no stronger than a notch
   over the strongest — the number is what contract goals, job offers and the unplayed tables read. */
function BcatMoved(base,mv){const at={};for(const c of base)if(!c.cup)for(const l of c.leagues)for(const x of l.clubs)at[x.key]={l,c};
  const go={};let any=false;for(const k in mv){const w=at[k];if(w&&mv[k]!==w.l.id&&w.c.leagues.some(l=>l.id===mv[k])){go[k]=mv[k];any=true}}
  if(!any)return base;
  return base.map(c=>{if(c.cup||!c.leagues.some(l=>l.clubs.some(x=>go[x.key])))return c;
    return Object.assign({},c,{leagues:c.leagues.map(l=>{const strs=l.clubs.map(x=>x.str),lo=Math.min(...strs),hi=Math.max(...strs);
      const come=c.leagues.filter(o=>o!==l).flatMap(o=>o.clubs.filter(x=>go[x.key]===l.id).map(x=>Object.assign({},x,{str:o.tier>l.tier?Math.max(x.str,lo-1):Math.min(x.str,hi+1),was:o.id})));
      return Object.assign({},l,{clubs:[...l.clubs.filter(x=>!go[x.key]),...come]})})})})}
function BcatBaseLeague(key){for(const c of BcatBase())if(!c.cup)for(const l of c.leagues)if(l.clubs.some(x=>x.key===key))return l.id;return null}

/* how many leave a league at each end, and where to: {up, upTo: league, down, downTo: [leagues]} */
function BprZones(l){const z={up:0,down:0,upTo:null,downTo:null};if(!l||l.cup)return z;const c=Bcat().find(c=>!c.cup&&c.leagues.some(x=>x.id===l.id));if(!c)return z;
  const at=t=>c.leagues.filter(x=>x.tier===t),above=at(l.tier-1),same=at(l.tier),below=at(l.tier+1);
  if(above.length===1){z.up=same.length>1?1:2;z.upTo=above[0]}
  if(same.length===1&&below.length){z.down=below.length>1?below.length:2;z.downTo=below}
  return z}
function BprCity(key){if(key.startsWith('l:')){const d=LEUMIT16.find(d=>d.id===key.slice(2));return d?d.city:''}return ''}

/* what the season that is ending does to the coach's country: [{key,name,from,to,up}] */
function BprPlan(){const b=Bstate(),home=Bcat().find(c=>!c.cup&&c.leagues.some(l=>l.id===b.leagueId));if(!home)return null;
  const done=b.round>=b.schedule.length,rnd=lgRng(lgHashN('goalasso-moves:'+(b.coach||'')+':'+b.season+':'+b.leagueId)),tab={},moves=[];
  const T=l=>tab[l.id]||(tab[l.id]=l.id===b.leagueId&&done?Bstandings().map(c=>c.bkey).filter(k=>l.clubs.some(x=>x.key===k)):l.clubs.map(x=>[x.key,x.str+(rnd()*2-1)*4]).sort((p,q)=>q[1]-p[1]).map(x=>x[0]));
  const put=(l,k,to,up)=>{const x=l.clubs.find(x=>x.key===k);if(x)moves.push({key:k,name:x.name,from:l.id,to:to.id,up})};
  for(const U of home.leagues.slice().sort((p,q)=>p.tier-q.tier)){const z=BprZones(U);if(!z.down)continue;const L=z.downTo,tU=T(U);if(tU.length<z.down+2)continue;const downs=tU.slice(-z.down);
    if(L.length===1){if(T(L[0]).length<z.down)continue;for(const k of downs)put(U,k,L[0],false);for(const k of T(L[0]).slice(0,z.down))put(L[0],k,U,true)}
    else{/* a club goes back to the district it came from, otherwise to the one it plays in; a district that grew to twenty or shrank to fourteen is the exception */
      const size={};for(const l of L)size[l.id]=T(l).length-1;
      for(const k of downs){const x=U.clubs.find(x=>x.key===k),base=L.find(l=>l.id===BcatBaseLeague(k)),north=BNORTH.test(x.name+' '+(x.city||BprCity(k)));
        let l=base||L.find(l=>/צפון/.test(l.name)===north)||L[0];const small=L.slice().sort((p,q)=>size[p.id]-size[q.id])[0];if(small!==l&&(size[l.id]>=20||size[small.id]<14))l=small;
        size[l.id]++;put(U,k,l,false)}
      for(const l of L){const k=T(l)[0];if(k)put(l,k,U,true)}}}
  return {season:b.season,league:b.leagueId,moves}}
/* the plan of a finished season. It is a function of the final table and of nothing drawn twice, so it is kept only to
   be read again; a table that is not the one it was made from (sig) makes a new plan. */
function BprEnsure(){const b=Bstate();if(!b||!b.schedule||b.round<b.schedule.length)return null;const sig=b.leagueId+':'+Bstandings().map(c=>c.id).join();
  if(!b.pr||b.pr.season!==b.season||b.pr.sig!==sig){try{b.pr=BprPlan();if(b.pr)b.pr.sig=sig}catch(e){console.warn('moves',e);b.pr=null}}return b.pr}
function BprMineOf(p){const k=me()&&me().bkey;return p&&k?p.moves.find(m=>m.key===k)||null:null}
/* the season turns: the plan becomes the career's leagues */
function BprApply(plan){const b=Bstate(),p=plan||BprEnsure()||BprPlan();b.pr=null;b.prV=b.season+1;if(!p||!p.moves||!p.moves.length)return null;
  const mv=Object.assign({},b.moves||{});for(const m of p.moves){if(BcatBaseLeague(m.key)===m.to)delete mv[m.key];else mv[m.key]=m.to}
  b.moves=mv;b.prLast={season:p.season,moves:p.moves};return p}
/* after the moves: the coach's club plays in the league it is in now, with the clubs that are in it now */
function BprSettle(p){const b=Bstate(),c=me(),old=BcatLeague(b.leagueId);if(!p||!c||!old||old.cup)return null;const f=BcatFind(c.bkey);if(!f||f.l.cup)return null;
  const mine=p.moves.find(m=>m.key===c.bkey)||null;b.leagueId=f.l.id;b.league=BensureLeague(f.l);if(mine)BprMine(mine,f,old);return mine}
/* what going up or down does to the coach's own club: the board's goal for the new league, the stands, a grant, the paper */
function BprMine(m,f,old){const b=Bstate(),c=me(),k=b.contract,l=f.l;
  if(k){const n=BcontractFor(f.x,l);k.goal=n.goal;k.rank=n.rank;k.n=n.n;k.zone=n.zone;if(m.up)k.wage=Math.max(k.wage||0,n.wage)}
  c.fans=clamp((c.fans==null?50:c.fans)+(m.up?8:-6),5,100);c.baseDemand=Math.round(c.cap*(.48+c.fans/200));
  b.board=clamp((b.board==null?55:b.board)+(m.up?12:-8),0,100);
  if(m.up){Bledger('מענק עלייה ל'+l.name,l.tier===1?2000000:600000);try{BxpAdd(60)}catch(e){}(b.ups=b.ups||[]).push({season:b.season,to:l.name,club:c.name})}
  try{BpaperMove(m.up,l,old)}catch(e){console.warn('paper',e)}
  Bnotice=m.up?`${c.name} עלתה ל${l.name}`:`${c.name} ירדה ל${l.name}`}
function BpaperMove(up,l,old){const b=Bstate(),c=me(),coach=b.coach||'המאמן',k=b.contract,goal=k?BgoalPlain(k):'';
  if(up)Bpaper('ליגה',`${c.name} עולה ל${l.name}`,`נפרדים מ${old.name}: העונה הבאה כבר בליגה שמעל`,`${c.name} של ${coach} סיימה את העונה במקום שמעלה ליגה, ובעונה הבאה תשחק ב${l.name}. היריבות חזקות יותר, האצטדיונים גדולים יותר, וגם הקופה מתמלאת: מענק עלייה כבר בדרך למועדון. ${goal?`היעד של ההנהלה לעונה הראשונה: ${goal}.`:''}`,{type:'promo',club:c.name,clubId:c.id,to:l.name,from:old.name,goal},true);
  else Bpaper('ליגה',`${c.name} יורדת ל${l.name}`,`עונה קשה ב${old.name} מסתיימת מתחת לקו האדום`,`${c.name} סיימה את העונה במקומות האחרונים ותשחק בעונה הבאה ב${l.name}. ${coach} נשאר על הקווים. ${goal?`היעד של ההנהלה: ${goal}.`:''} האוהדים מצפים לחזרה מהירה.`,{type:'releg',club:c.name,clubId:c.id,to:l.name,from:old.name,goal},true)}

/* ---- on the screens ---- */
/* the summary of a finished season: what it means for next year */
function BprSummaryHTML(){const p=BprEnsure();if(!p||!p.moves.length)return '';const b=Bstate(),mine=BprMineOf(p),l=BcatLeague(b.leagueId),nm=id=>{const x=BcatLeague(id);return x?x.name:''};
  const here=p.moves.filter(m=>m.from===b.leagueId&&m.key!==(me().bkey)),ups=here.filter(m=>m.up).map(m=>m.name),downs=here.filter(m=>!m.up).map(m=>m.name);
  const others=`${ups.length?`<span>${mine&&mine.up?'עולות גם':'עולות'}: ${ups.map(esc).join(', ')}</span>`:''}${downs.length?`<span>${mine&&!mine.up?'יורדות גם':'יורדות'}: ${downs.map(esc).join(', ')}</span>`:''}`;
  return `${mine?`<div class="bpr ${mine.up?'up':'down'}" role="status"><b aria-hidden="true">${mine.up?'▲':'▼'}</b><p><strong>${mine.up?'עולים ליגה!':'יורדים ליגה'}</strong>בעונה הבאה ${esc(me().name)} ב${esc(nm(mine.to))}.</p></div>`:''}${others&&l?`<p class="bpr-others">${others}</p>`:''}`}
function BprZoneOf(i,n,z){return z.up&&i<z.up?'up':z.down&&i>=n-z.down?'down':''}
/* under the table: which places move, and who came up or down this summer */
function BprLegendHTML(){const b=Bstate(),l=BcatLeague(b.leagueId),z=BprZones(l),cl=l&&l.tier===1&&!l.cup?BclPlaces(l):0;if(!z.up&&!z.down&&!cl)return '';const last=b.prLast&&b.prLast.season===b.season-1?b.prLast.moves.filter(m=>m.to===b.leagueId):[];
  const cnt=n=>n===1?'המקום הראשון עולה':n===2?'שני המקומות הראשונים עולים':`<bdi>${n}</bdi> המקומות הראשונים עולים`,dn=n=>n===1?'המקום האחרון יורד':n===2?'שני המקומות האחרונים יורדים':`<bdi>${n}</bdi> המקומות האחרונים יורדים`;
  return `<ul class="bzones">${cl?`<li class="cl"><i aria-hidden="true"></i><bdi>${cl}</bdi> המקומות הראשונים משחקים בעונה הבאה בליגת האלופות</li>`:''}${z.up?`<li class="up"><i aria-hidden="true"></i>${cnt(z.up)} ל${esc(z.upTo.name)}</li>`:''}${z.down?`<li class="down"><i aria-hidden="true"></i>${dn(z.down)} ל${esc(z.downTo[0].name.replace(z.downTo.length>1?/\s+(צפון|דרום)$/:/^$/,''))}</li>`:''}</ul>${last.length?`<p class="bmuted bzones-new">חדשות בליגה העונה: ${last.map(m=>`${esc(m.name)} (${m.up?'עלתה':'ירדה'})`).join(', ')}.</p>`:''}`}

/* ---- a career that was left behind ----
   Before this existed a champion started the next season in the league he had just won. When such a career loads, the
   coach's club is owed its promotion: before the first round of the new season it simply goes up; once he has played, he
   is asked, because going up now starts the season again. */
function BprWasTop(){const b=Bstate(),c=me(),l=BcatLeague(b.leagueId),z=BprZones(l);if(!z.up)return null;
  const job=(b.jobs||[]).slice(-1)[0];if(job&&job.season>=b.season)return null;   /* he came to this club this season: last year's table was somebody else's */
  const st=(G.paper||[]).find(s=>s.ev&&s.ev.type==='champ'&&s.s===b.season-1&&(s.h||'').includes(l.name));
  const champ=st?st.ev.clubId===c.id:b.feted===b.season-1,second=!!(st&&st.ev.second===c.name&&z.up>=2);if(!champ&&!second)return null;
  /* the club that went up with him, when the paper still says who it was */
  let mate=null;if(st){const other=champ?l.clubs.find(x=>x.name===st.ev.second):l.clubs.find(x=>BclubByKey(x.key)&&BclubByKey(x.key).id===st.ev.clubId);if(other&&other.key!==c.bkey)mate=other.key}
  return {l,z,mate,champ}}
function BprOwedPlan(){const b=Bstate(),c=me(),w=BprWasTop();if(!w)return null;const {l,z,mate}=w,U=z.upTo,rnd=lgRng(lgHashN('goalasso-owed:'+(b.coach||'')+':'+b.season)),moves=[];
  const order=x=>x.clubs.map(y=>[y,y.str+(rnd()*2-1)*4]).sort((p,q)=>q[1]-p[1]).map(y=>y[0]);
  const ups=[l.clubs.find(x=>x.key===c.bkey)];if(z.up>1){const m=(mate&&l.clubs.find(x=>x.key===mate))||order(l).find(x=>x.key!==c.bkey);if(m)ups.push(m)}
  const downs=order(U).slice(-ups.length);if(downs.length<ups.length||!ups[0])return null;
  for(const x of ups)moves.push({key:x.key,name:x.name,from:l.id,to:U.id,up:true});for(const x of downs)moves.push({key:x.key,name:x.name,from:U.id,to:l.id,up:false});
  return {season:b.season-1,league:l.id,moves}}
function BprRepair(){const b=Bstate();if(!b||b.daily||b.live)return;if((b.prV||0)>=b.season)return;b.prV=b.season;b.prOwed=null;if(b.out||!b.leagueId||b.season<2||!b.schedule)return;
  let p=null;try{const w=BprWasTop();if(w&&w.champ&&!(b.honours||[]).some(h=>h.season===b.season-1&&/^אליפות/.test(h.what)))(b.honours=b.honours||[]).push({season:b.season-1,what:'אליפות '+w.l.name,club:me().name});   /* the title itself was never written down either */
    p=BprOwedPlan()}catch(e){console.warn('moves',e)}if(!p)return;
  if(b.round>0){b.prOwed={season:b.season};return}
  return BprTakeOwed(p)?Bnotice:''}
/* the promotion that was owed, taken now: the new season starts in the league above */
function BprTakeOwed(plan){const b=Bstate(),p=plan||BprOwedPlan();b.prOwed=null;if(!p)return false;const old=BcatLeague(b.leagueId);
  const mv=Object.assign({},b.moves||{});for(const m of p.moves){if(BcatBaseLeague(m.key)===m.to)delete mv[m.key];else mv[m.key]=m.to}b.moves=mv;b.prLast={season:p.season,moves:p.moves};
  const c=me(),f=BcatFind(c.bkey);if(!f||f.l.cup)return false;b.leagueId=f.l.id;b.league=BensureLeague(f.l);b.clq=null;Bseason();BprMine(p.moves[0],f,old);try{BmsFill()}catch(e){}
  Bnotice=`${c.name} עלתה ל${f.l.name}: העונה נפתחת שם`;return true}
function BprOwedHTML(){const b=Bstate();if(!b||!b.prOwed||b.prOwed.season!==b.season||b.out)return '';const w=BprWasTop();if(!w)return '';
  return `<section class="bpanel bpr-owed" aria-label="עלייה לליגה"><div class="bpr up"><b aria-hidden="true">▲</b><p><strong>מגיעה לכם עלייה ל${esc(w.z.upTo.name)}</strong>סיימתם את העונה שעברה במקום שמעלה ליגה, והעונה הזאת נפתחה בטעות ב${esc(w.l.name)}.</p></div>
   <p class="bmuted">אם עולים עכשיו, העונה מתחילה מחדש ב${esc(w.z.upTo.name)}: <bdi>${b.round}</bdi> המחזורים ששוחקו העונה לא ייספרו. הסגל, הכסף והרמה נשארים.</p>
   <div class="bpr-acts">${Bbutton('עולים ל'+esc(w.z.upTo.name),'data-action="pr-up"')}${Bbutton('נשארים עד סוף העונה','data-action="pr-keep"','secondary')}</div></section>`}
document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('[data-action="pr-up"],[data-action="pr-keep"]');if(!el||!G||!G.beginner)return;const b=Bstate();if(!b.prOwed||b.live)return;
  if(el.dataset.action==='pr-keep'){b.prOwed=null;Bwrite();Brender();return}
  if(!el.hasAttribute('data-sure')){const w=BprWasTop();if(!w)return;Bdialog(`<h2>עולים ל${esc(w.z.upTo.name)} עכשיו?</h2><p>העונה תתחיל מחדש ב${esc(w.z.upTo.name)}. <bdi>${b.round}</bdi> המחזורים ששוחקו העונה ב${esc(w.l.name)} לא ייספרו, ואי אפשר לחזור אליהם.</p>${Bbutton('כן, עולים ליגה','data-action="pr-up" data-sure')}<button type="button" class="blink" data-bclose>עוד לא</button>`);return}
  el.closest('dialog')?.remove();if(BprTakeOwed()){Btab='home';Bwrite();Brender();window.scrollTo&&window.scrollTo(0,0)}else{Bwrite();Brender()}});
