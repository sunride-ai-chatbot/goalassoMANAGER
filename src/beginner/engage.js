/* ====================== BEGINNER: a reason for one more match ======================
   The beginner career was: play, see the result, play again. Nothing was ever handed to the coach and nothing was ever
   one step away. Three things change that, and all three live in G.beginner, so a career keeps them:

   - **Experience and level** (b.lvl, b.xp inside the level, b.xpAll). Every match of the coach's club pays experience for
     what happened in it (BxpMatch: the result, goals, a clean sheet, beating a stronger side, a derby, a European night).
     A level costs BxpNeed(level): little at first, so the first match already ends with a level, then up to 300.
   - **A pack for every level** (b.packs, a queue of tiers b / s / g). Opening one (BpackOpen) shows three cards face up
     and the coach **chooses one**: nothing is hidden behind a blind draw and nothing is ever bought. Every card is a real
     thing in this career's own economy: money in the ledger, training sessions, a young player's rating, ticket income,
     the board, the treatment room, or a scout's tip — a real player of another club at a reduced asking price (b.tip,
     honoured by Boffer). The cards are dealt when the pack is opened and kept in b.packOpen, so closing the page in the
     middle neither loses the pack nor deals it again.
   - **Three missions** (b.ms, one per kind: the match, a player, the club). A mission counts from the day it was given
     (m.from against the running counters in b.ct, or its own m.p), is collected by hand, and is replaced by another of
     its kind. The club missions are also how a beginner finds the screens he has not opened yet.

   Bstakes() is the line under the next match: what is riding on it (derby, the top, a six-pointer, the bottom, a streak,
   a defeat to avenge, a scorer one goal from a round number, the board). It only reads.

   Nothing here runs while a screen is drawn: fields are added when a career is created or loaded (BxpEnsure, BmsFill)
   and changed by events. No clock, no streak that is lost, no purchase: children play this. */
const BXP_TITLES=[[1,'מאמן מתחיל'],[3,'מאמן נוער'],[5,'מאמן מוסמך'],[8,'מאמן בכיר'],[12,'מאמן פרו'],[16,'מאסטר טקטי'],[20,'אגדת הקווים']];
const BPK_HE={b:'חבילת ברונזה',s:'חבילת כסף',g:'חבילת זהב'};
function BxpNeed(l){return Math.min(300,40+40*(l-1))}
function BxpTitle(l){let t=BXP_TITLES[0][1];for(const [n,s] of BXP_TITLES)if(l>=n)t=s;return t}
function BpackTier(l){return l%5===0?'g':l%2===0?'s':'b'}
function BxpEnsure(){const b=G&&G.beginner;if(!b)return null;if(b.lvl==null){b.lvl=1;b.xp=0;b.xpAll=0}b.packs=b.packs||[];b.ct=b.ct||{};b.st=b.st||{w:0};b.hist=b.hist||[];b.boost=b.boost||{};b.ms=b.ms||[];b.vs=b.vs||{};return b}
function BxpAdd(n){const b=BxpEnsure();n=Math.max(0,Math.round(n));const ups=[];b.xp+=n;b.xpAll=(b.xpAll||0)+n;while(b.xp>=BxpNeed(b.lvl)){b.xp-=BxpNeed(b.lvl);b.lvl++;const t=BpackTier(b.lvl);b.packs.push(t);ups.push({lvl:b.lvl,pack:t})}return ups}
function Bcount(k,n){const b=BxpEnsure();if(!b)return;b.ct[k]=(b.ct[k]||0)+(n==null?1:n);BmsCheck();try{BbookCheck()}catch(e){}}

/* ---- a match of the coach's club: experience, the running counters, the missions that count matches ---- */
function BxpMatch(M){const b=BxpEnsure(),c=me();if(!b||!M||(M.h!==c.id&&M.a!==c.id))return null;const home=M.h===c.id,gf=home?M.gh:M.ga,ga=home?M.ga:M.gh,opp=club(home?M.a:M.h);
  const pens=M.pens?((M.pens==='h')===home?'W':'L'):null,res=gf>ga?'W':gf<ga?'L':(pens||'D'),rows=[],add=(t,x)=>{if(x>0)rows.push({t,x})},from={lvl:b.lvl,xp:b.xp};
  if(!b.ct.played)add('המשחק הראשון שלך',40);
  add(res==='W'?(pens?'ניצחון בפנדלים':'ניצחון'):res==='D'?'תיקו':'שיחקת עד השריקה',res==='W'?40:res==='D'?20:10);
  add(gf===1?'שער אחד':gf+' שערים',Math.min(15,gf*3));if(ga===0)add('שער נקי',10);
  const gap=opp?Math.round(strength(opp)-strength(c)):0,derby=typeof derbyWords==='function'&&derbyWords(M.h,M.a);
  if(res==='W'&&gap>=3)add('ניצחון על קבוצה חזקה ממך',15);else if(res==='D'&&gap>=5)add('נקודה מול קבוצה חזקה',8);
  if(res==='W'&&derby)add(derby.win,15);if(res==='W'&&M.bCL!=null)add('לילה אירופי',15);if(res==='W'&&M.bX)add('ניצחון בגביע',10);
  /* the counters the missions read */
  const ct=b.ct,bump=(k,n)=>{ct[k]=(ct[k]||0)+(n==null?1:n)};bump('played');bump('goals',gf);if(res==='W')bump('wins');if(ga===0)bump('clean');if(res==='W'&&!home&&M.bCL==null)bump('awayW');if(res==='W'&&gap>=3)bump('giant');
  const mine=M.ev.filter(e=>(e.t==='goal'||e.t==='pen')&&e.team===c.id);bump('young',mine.filter(e=>{const p=c.players.find(p=>p.id===e.pid);return p&&p.age<=21}).length);
  /* what the match itself was like: behind at some point and not beaten, a win by three, one man's three goals, three different scorers */
  {let f=0,a=0,behind=false;for(const e of M.ev.filter(e=>e.t==='goal'||e.t==='pen'||e.t==='own').slice().sort((x,y)=>x.m-y.m)){if(e.t==='own'?e.team!==c.id:e.team===c.id)f++;else a++;if(f<a)behind=true}
   const per={};for(const e of mine)if(e.pid!=null)per[e.pid]=(per[e.pid]||0)+1;const tally=Object.values(per);
   if(behind&&res!=='L')bump('comeback');if(gf-ga>=3)bump('big');if(tally.some(n=>n>=3))bump('hat');if(tally.length>=3)bump('spread')}
  try{if(!M.ratings)matchRatings(M,club(M.h),club(M.a));if(Object.values((M.ps&&M.ps[c.id])||{}).some(s=>s.r>=8))bump('star')}catch(e){}
  b.st.w=res==='W'?(b.st.w||0)+1:0;b.hist.push(res);if(b.hist.length>8)b.hist.shift();if(opp&&M.bCL==null&&!M.bX)b.vs[opp.id]={r:res,gf,ga,s:b.season};
  for(const m of b.ms){if(!m||m.done)continue;if(m.k==='streak')m.p=res==='W'?(m.p||0)+1:0;if(m.k==='scorer')m.p=(m.p||0)+mine.filter(e=>e.pid===m.d.pid).length}
  const total=rows.reduce((s,r)=>s+r.x,0),ups=BxpAdd(total),done=BmsCheck();
  b.gain={rows,total,from,to:{lvl:b.lvl,xp:b.xp},ups,done,res};return b.gain}

/* ---- missions ---- */
function BmsStriker(){const c=me(),top=BleaderOf(c),p=(top&&c.players.find(x=>x.id===top.pid))||c.players.filter(x=>(x.pos==='FW'||x.pos==='MF')&&!x.inj).sort((x,y)=>(y.pos==='FW')-(x.pos==='FW')||y.ovr-x.ovr)[0];return p||null}
function BmsTopHalf(){const s=(Bstate().league||[]).map(id=>club(id)).filter(Boolean).map(x=>strength(x)).sort((x,y)=>y-x);return !s.length||strength(me())>=s[Math.floor(s.length/2)]}
function BmsStrongerAhead(){const b=Bstate(),s=strength(me());for(let r=b.round;r<b.schedule.length;r++){const pr=b.schedule[r].find(p=>p.includes(G.me));if(!pr)continue;const o=club(pr.find(id=>id!==G.me));if(o&&strength(o)-s>=3)return true}return false}
const BMS_DEF={
  win:{role:'m',ic:'trophy',ct:'wins',make:()=>{const n=pick([2,3]);return {n,xp:30*n+10}},text:m=>m.n>1?`נצח <bdi>${m.n}</bdi> משחקים`:'נצח במשחק הבא שלך'},
  streak:{role:'m',ic:'ball',make:()=>{const n=pick([2,3]);return n>=3?{n,xp:140,pack:'s'}:{n,xp:90}},text:m=>`<bdi>${m.n}</bdi> ניצחונות ברצף`},
  goals:{role:'m',ic:'ball',ct:'goals',make:()=>{const n=pick([4,6,8]);return {n,xp:10*n+20}},text:m=>`כבוש <bdi>${m.n}</bdi> שערים`},
  clean:{role:'m',ic:'shield',ct:'clean',make:()=>{const n=pick([1,2]);return {n,xp:45*n+15}},text:m=>m.n>1?`שמור על שער נקי ב־<bdi>${m.n}</bdi> משחקים`:'סיים משחק בלי לספוג שער'},
  away:{role:'m',ic:'stadium',ct:'awayW',make:()=>({n:1,xp:70}),text:()=>'נצח במשחק חוץ'},
  giant:{role:'m',ic:'trophy',ct:'giant',ok:()=>BmsStrongerAhead(),make:()=>({n:1,xp:110,pack:'s'}),text:()=>'נצח קבוצה חזקה ממך'},
  /* the rare ones are for one season: what is not done by its end makes room for another (nothing can be swapped by hand, so a mission
     that waits for a hat-trick would hold its place for as long as it takes). The three that need goals are offered to the stronger half. */
  comeback:{role:'m',ic:'ball',ct:'comeback',alive:m=>!m.d||m.d.s===Bstate().season,make:()=>({n:1,xp:120,pack:'s',d:{s:Bstate().season}}),text:()=>'חזור מפיגור וסיים עם נקודה לפחות'},
  big:{role:'m',ic:'trophy',ct:'big',ok:()=>BmsTopHalf(),alive:m=>!m.d||m.d.s===Bstate().season,make:()=>({n:1,xp:100,d:{s:Bstate().season}}),text:()=>'נצח בהפרש של <bdi>3</bdi> שערים ומעלה'},
  scorer:{role:'p',ic:'boot',ok:()=>!!BmsStriker(),alive:m=>me().players.some(p=>p.id===m.d.pid),make:()=>{const p=BmsStriker(),n=pick([2,3]);return {n,xp:35*n,d:{pid:p.id,name:p.last||p.first}}},text:m=>m.n>1?`${esc(m.d.name)} יכבוש <bdi>${m.n}</bdi> שערים`:`${esc(m.d.name)} יכבוש שער`},
  young:{role:'p',ic:'shirt',ct:'young',ok:()=>me().players.some(p=>p.age<=21&&p.pos!=='GK'),make:()=>({n:1,xp:80}),text:()=>'שחקן עד גיל <bdi>21</bdi> יכבוש שער'},
  hat:{role:'p',ic:'boot',ct:'hat',ok:()=>BmsTopHalf(),alive:m=>!m.d||m.d.s===Bstate().season,make:()=>({n:1,xp:180,pack:'g',d:{s:Bstate().season}}),text:()=>'שלושער: שחקן שלך יכבוש <bdi>3</bdi> שערים במשחק אחד'},
  spread:{role:'p',ic:'shirt',ct:'spread',ok:()=>BmsTopHalf(),alive:m=>!m.d||m.d.s===Bstate().season,make:()=>({n:1,xp:90,d:{s:Bstate().season}}),text:()=>'<bdi>3</bdi> שחקנים שונים יכבשו באותו משחק'},
  star:{role:'p',ic:'bell',ct:'star',make:()=>{const n=pick([1,2]);return {n,xp:50*n+10}},text:m=>m.n>1?`<bdi>${m.n}</bdi> משחקים עם שחקן בציון <bdi>8</bdi> ומעלה`:'שחקן שלך יקבל ציון <bdi>8</bdi> ומעלה'},
  sponsor:{role:'c',ic:'coins',ct:'sponsors',go:'finance',ok:()=>!me().sponsor,make:()=>({n:1,xp:50}),text:()=>'בחר נותן חסות למועדון'},
  sign:{role:'c',ic:'transfer',ct:'signs',go:'market',make:()=>({n:1,xp:80}),text:()=>'החתם שחקן חדש'},
  grow:{role:'c',ic:'boot',ct:'grow',go:'training',ok:()=>me().players.some(p=>!BtrainCapped(p)),make:()=>({n:1,xp:90}),text:()=>'העלה שחקן בנקודת דירוג באימונים'},
  train:{role:'c',ic:'boot',ct:'train',go:'training',make:()=>{const n=pick([3,5]);return {n,xp:20*n}},text:m=>`השלם <bdi>${m.n}</bdi> אימונים`},
  staff:{role:'c',ic:'tactics',ct:'staff',go:'staff',ok:()=>{try{return !Object.values(Bstate().staff||{}).some(Boolean)&&Bstate().round>=2&&me().money>=BstaffFee(1)*3}catch(e){return false}},make:()=>({n:1,xp:80}),text:()=>'העסק איש צוות ראשון'},
  stadium:{role:'c',ic:'stadium',ct:'builds',go:'stadium',ok:()=>{const n=Blevels.find(l=>l.cap>me().cap);return !!n&&!Bstate().build&&me().money>=n.cost*.7},make:()=>({n:1,xp:120,pack:'s'}),text:()=>'התחל להרחיב את האצטדיון'},
  place:{role:'c',ic:'trophy',ok:()=>{const b=Bstate();return b.round>=2&&Bplace()>1&&b.schedule.length-b.round>=4},alive:m=>m.d.s===Bstate().season,make:()=>({n:1,xp:100,d:{place:Math.max(1,Bplace()-pick([1,2])),s:Bstate().season}}),text:m=>`עלה למקום <bdi>${m.d.place}</bdi> בטבלה`},
  daily:{role:'c',ic:'ball',ct:'daily',go:'daily',ok:()=>typeof BdailyDoneToday==='function'&&!BdailyDoneToday(),make:()=>({n:1,xp:60}),text:()=>'שחק באתגר היומי'}};
function BmsNew(role,avoid){const b=Bstate(),active=new Set(b.ms.filter(Boolean).map(m=>m.k)),ok=k=>!active.has(k)&&k!==avoid&&(!BMS_DEF[k].ok||BMS_DEF[k].ok());
  let ks=Object.keys(BMS_DEF).filter(k=>BMS_DEF[k].role===role&&ok(k));if(!ks.length)ks=Object.keys(BMS_DEF).filter(k=>BMS_DEF[k].role==='m'&&ok(k));if(!ks.length)ks=['goals'];
  const k=pick(ks),D=BMS_DEF[k],m=Object.assign({k,p:0,done:false},D.make());if(D.ct)m.from=b.ct[D.ct]||0;return m}
/* the first three are the same for every new coach: something the first match can finish, his striker, and the screen he must find */
function BmsFirst(){const b=Bstate(),s=BmsStriker();b.ms=[{k:'win',n:1,xp:40,p:0,done:false,from:b.ct.wins||0},s?{k:'scorer',n:1,xp:50,p:0,done:false,d:{pid:s.id,name:s.last||s.first}}:BmsNew('p'),me().sponsor?BmsNew('c'):{k:'sponsor',n:1,xp:50,p:0,done:false,from:b.ct.sponsors||0}]}
function BmsFill(){const b=BxpEnsure();if(!b)return [];if(!b.ms.length&&!b.ct.played)BmsFirst();const roles=['m','p','c'];for(let i=0;i<3;i++){const m=b.ms[i],D=m&&BMS_DEF[m.k];if(!m||!D||(!m.done&&D.alive&&!D.alive(m)))b.ms[i]=BmsNew(roles[i],m&&m.k)}return b.ms}
function BmsProg(m){const b=Bstate(),D=BMS_DEF[m.k];if(m.done)return m.n;if(m.k==='place')return Bplace()<=m.d.place&&b.round>=3?1:0;return clamp(D.ct?(b.ct[D.ct]||0)-(m.from||0):(m.p||0),0,m.n)}
function BmsCheck(){const b=BxpEnsure();if(!b)return [];const fresh=[];for(const m of b.ms)if(m&&!m.done&&BMS_DEF[m.k]&&BmsProg(m)>=m.n){m.done=true;fresh.push(m)}return fresh}
function BmsClaim(i){const b=BxpEnsure(),m=b&&b.ms[i];if(!m||!m.done)return;const ups=BxpAdd(m.xp);if(m.pack)b.packs.push(m.pack);b.ct.ms=(b.ct.ms||0)+1;b.ms[i]=null;b.ms[i]=BmsNew(['m','p','c'][i],m.k);BmsCheck();Bwrite();Brender();
  Bflash(ups.length?`רמה <bdi>${b.lvl}</bdi>! ${BPK_HE[ups[ups.length-1].pack]} מחכה לך`:`<bdi>+${m.xp}</bdi> נקודות ניסיון${m.pack?' ו'+BPK_HE[m.pack]:''}`);try{buzz('open')}catch(e){}}
function BmsHTML(){const b=Bstate();if(!b||!b.ms||!b.ms.length)return '';
  return `<section class="bpanel amis" aria-label="המשימות שלך"><div class="amis-head"><h2>המשימות שלך</h2><span>כל משימה שווה נקודות ניסיון</span></div><ul>${b.ms.map((m,i)=>{if(!m||!BMS_DEF[m.k])return '';const D=BMS_DEF[m.k],p=BmsProg(m),pct=Math.round(p/m.n*100),now=m.k==='place'&&!m.done?`כרגע מקום <bdi>${Bplace()}</bdi>`:`<bdi>${p}</bdi> מתוך <bdi>${m.n}</bdi>`;
    return `<li class="amis-row${m.done?' done':''}">${Bui(D.ic)}<div class="amis-body"><strong>${D.text(m)}</strong><div class="amis-bar" role="img" aria-label="${p} מתוך ${m.n}"><i style="width:${pct}%"></i></div><small>${m.done?'הושלמה':now}${m.pack&&!m.done?` · פרס: ${BPK_HE[m.pack]}`:''}</small></div>${m.done?`<button type="button" class="amis-claim" data-bms="${i}">אסוף <bdi>+${m.xp}</bdi> <small>XP</small></button>`:D.go?`<button type="button" class="amis-go" data-bms-go="${D.go}" aria-label="לשם"><bdi>+${m.xp}</bdi><small>XP</small><i aria-hidden="true">‹</i></button>`:`<span class="amis-xp"><bdi>+${m.xp}</bdi><small>XP</small></span>`}</li>`}).join('')}</ul></section>`}

/* ---- what the next match is about ---- */
function Bstakes(){const b=Bstate(),c=me();if(!b||!c)return [];const x=Bextra(),cup=!!x,pair=x?x.pair:Bnext();if(!pair)return [];const op=club(pair.find(id=>id!==c.id));if(!op)return [];const home=pair[0]===c.id,out=[],st=b.st||{},vs=b.vs||{};
  const add=(k,t,h)=>{if(out.length<2&&!out.some(x=>x.k===k))out.push({k,t,h})};
  if(x&&x.kind==='pre'){add('pre','הכנה','התוצאה לא נספרת. הזדמנות לנסות הרכב ולתת דקות לכולם');return out}
  if(x)add('cup',x.kind==='cl'?'אירופה':'גביע',x.final?'הגמר: תשעים דקות מהגביע':'נוקאאוט: מי שמפסידה נשארת בבית');
  const dw=typeof derbyWords==='function'&&derbyWords(pair[0],pair[1]);   /* only two clubs of one city are a derby, and only a derby is what a whole city waits for */
  if(dw)add('derby',dw.tag,dw.kind==='city'?`${esc(dw.label)}: המשחק שכל העיר מחכה לו`:`${esc(dw.label)} מול ${esc(op.name)}: משחק ששני המחנות מחכים לו כל העונה`);
  if(!cup){const tab=Bstandings(),i=tab.findIndex(x=>x.id===c.id),j=tab.findIndex(x=>x.id===op.id),left=b.schedule.length-b.round;
    if(i>=0&&j>=0&&b.round>=3){const top=tab[0];
      if(i>0&&(c.pts+3>top.pts||(c.pts+3===top.pts&&top.id===op.id)))add('top','צמרת','ניצחון יכול להעלות אותך למקום הראשון');
      else if(i===0&&tab[1])add('top','צמרת',tab[1].id===op.id?'אתה ראשון, והיריבה היא הרודפת שלך':`אתה ראשון, <bdi>${c.pts-tab[1].pts}</bdi> נקודות מעל ${esc(tab[1].name)}`);
      else if(Math.abs(i-j)<=2)add('six','שש נקודות',`${esc(op.name)} במקום <bdi>${j+1}</bdi>, אתה במקום <bdi>${i+1}</bdi>`);
      /* a league with a ladder: the places that go up, and the red line at the bottom */
      const z=BprZones(BcatLeague(b.leagueId)),n=tab.length;
      if(z.up&&i>0&&i<z.up)add('up','עלייה',`מקום <bdi>${i+1}</bdi>: כרגע במקום שמעלה ל${esc(z.upTo.name)}`);
      else if(z.up&&i>=z.up&&c.pts+3>=tab[z.up-1].pts)add('up','עלייה',`ניצחון יכול להכניס אותך למקום שמעלה ל${esc(z.upTo.name)}`);
      if(z.down&&b.round>=5&&i>=n-z.down)add('rel','הקו האדום',`מקום <bdi>${i+1}</bdi> מתוך <bdi>${n}</bdi>: כרגע במקום שמוריד ליגה`);
      else if(z.down&&b.round>=5&&i>=n-z.down-2)add('rel','הקו האדום',`רק <bdi>${c.pts-tab[n-z.down].pts}</bdi> נקודות מעל המקומות שיורדים`);
      else if(!z.down&&i>=n-3&&b.round>=5)add('rel','תחתית',`מקום <bdi>${i+1}</bdi> מתוך <bdi>${n}</bdi>: כל נקודה חשובה`);
      if(left<=3)add('end','ישורת אחרונה',left===1?'המחזור האחרון של העונה':`עוד <bdi>${left}</bdi> מחזורים לסיום העונה`)}}
  if((st.w||0)>=2)add('streak','רצף',`<bdi>${st.w}</bdi> ניצחונות רצופים. עוד אחד יאריך את הרצף`);
  const v=vs[op.id];if(v&&v.s===b.season&&v.r==='L'&&!cup)add('rev','נקמה',`בסיבוב הקודם הם ניצחו אותך <bdi dir="ltr">${v.ga}:${v.gf}</bdi>`);
  const d=Math.round(strength(op)-strength(c));if(d>=4)add('under','אנדרדוג',`${esc(op.name)} חזקה ממך ב־<bdi>${d}</bdi> נקודות. ניצחון כאן שווה יותר`);
  const s=BleaderOf(c);if(s&&s.goals>=4&&(s.goals+1)%5===0)add('mile','אבן דרך',`${esc(s.name)} במרחק שער אחד מ־<bdi>${s.goals+1}</bdi> שערים העונה`);
  if(b.contract&&b.board!=null&&b.board<30)add('board','לחץ','ההנהלה מאבדת סבלנות. ניצחון ירגיע את הרוחות');
  if(!out.length&&d<=-4)add('fav','פייבוריט',home?'אתה הפייבוריט, והקהל בבית מצפה לניצחון':'אתה הפייבוריט גם במשחק חוץ');
  return out}
function BstakesHTML(){const s=Bstakes();return s.length?`<ul class="astakes" aria-label="מה מונח על הכף">${s.map(x=>`<li><b>${x.t}</b><span>${x.h}</span></li>`).join('')}</ul>`:''}

/* ---- the level in the header, the strip under a result, the banner for an unopened pack ---- */
function BxpHudHTML(){const b=Bstate();if(!b||b.lvl==null)return '';const need=BxpNeed(b.lvl),pct=Math.round(b.xp/need*100);
  return `<span class="axp" role="img" aria-label="רמת מאמן ${b.lvl}, ${b.xp} מתוך ${need} נקודות ניסיון"><b>רמה <bdi>${b.lvl}</bdi></b><i><u style="width:${pct}%"></u></i></span>`}
function BxpStripHTML(g){const b=Bstate();if(!b||!g)return '';const need=BxpNeed(g.to.lvl),up=g.ups.length;
  return `<section class="axps" aria-label="נקודות ניסיון"><h3>נקודות ניסיון <bdi>+${g.total}</bdi></h3><ul>${g.rows.map(r=>`<li><bdi>+${r.x}</bdi><span>${esc(r.t)}</span></li>`).join('')}</ul>
   <div class="axps-line"><b>רמה <bdi>${g.to.lvl}</bdi> · ${BxpTitle(g.to.lvl)}</b><div class="axps-bar"><i style="width:${Math.round(g.to.xp/need*100)}%;--from:${up?0:Math.round(g.from.xp/need*100)}%"></i></div><small><bdi>${g.to.xp}</bdi> מתוך <bdi>${need}</bdi></small></div>
   ${up?`<p class="axps-up"><span aria-hidden="true">★</span> עלית לרמה <bdi>${g.to.lvl}</bdi>. ${BPK_HE[g.ups[up-1].pack]} מחכה לך</p>`:''}${g.done&&g.done.length?`<p class="axps-ms">משימה הושלמה: ${g.done.map(m=>BMS_DEF[m.k].text(m)).join(' · ')}</p>`:''}</section>`}
/* the coach's own numbers, under the board's confidence: the level and what the career has added up to */
function BcareerStatsHTML(){const b=Bstate();if(!b||b.lvl==null)return '';const ct=b.ct||{},hon=(b.honours||[]).length,cell=(v,t)=>`<div><b><bdi>${v}</bdi></b><small>${t}</small></div>`;
  return `<div class="acareer" aria-label="הקריירה במספרים"><p><strong>רמה <bdi>${b.lvl}</bdi> · ${BxpTitle(b.lvl)}</strong><span><bdi>${b.xpAll||0}</bdi> נקודות ניסיון</span></p><div class="acareer-grid">${cell(ct.played||0,'משחקים')}${cell(ct.wins||0,'ניצחונות')}${cell(ct.goals||0,'שערים')}${cell(ct.ms||0,'משימות')}${cell(ct.packs||0,'חבילות')}${cell(hon,'תארים')}</div></div>`}
function BpackArt(t){return `<span class="apk-art ${t}" aria-hidden="true"><i></i><b>${Bui('ball')}</b></span>`}
function BpackBannerHTML(){const b=Bstate(),n=b&&b.packs?b.packs.length+(b.packOpen?1:0):0;if(!n)return '';const t=b.packOpen?b.packOpen.tier:b.packs[0];
  return `<button type="button" class="apk-cta ${t}" data-action="pack">${BpackArt(t)}<span><strong>${n>1?`<bdi>${n}</bdi> חבילות מחכות לך`:BPK_HE[t]+' מחכה לך'}</strong><small>שלושה קלפים, אתה בוחר אחד</small></span><em>פתח</em></button>`}
let BflashT=0;function Bflash(html){let el=document.getElementById('aflash');if(!el){el=document.createElement('div');el.id='aflash';el.className='aflash';el.setAttribute('role','status');document.body.appendChild(el)}el.innerHTML=html;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(BflashT);BflashT=setTimeout(()=>el.classList.remove('on'),2600)}

/* ---- packs ---- */
function BtipAsk(p,c){const core=c&&c.players.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,11).includes(p);return c?Math.round(Bvalue(p)*(core?1.5:1.12)/50000)*50000:0}
function BtipFor(p){const b=Bstate(),t=b&&b.tip;return t&&p&&t.pid===p.id&&t.s===b.season&&b.round<=t.until?t:null}
function BtipPrice(p,c){const t=BtipFor(p),ask=BtipAsk(p,c);return t?Math.max(0,Math.round(ask*(1-t.pct/100)/10000)*10000):ask}
/* a real player of another club who would walk into this eleven and whom the club can pay for at the reduced price */
function BscoutPick(pct){const c=me(),xi=c.players.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,11),floor=xi.length?xi[xi.length-1].ovr:50,spare=Math.min(Bbudget(),c.money),ids=new Set(Bstate().league),out=[];
  if(c.players.length>=35)return null;
  for(const k of G.clubs){if(k.id===c.id||k.players.length<=14)continue;for(const p of k.players){if(inventedPlayer(p)||p.ovr<floor+1)continue;const fee=Math.round(BtipAsk(p,k)*(1-pct/100)/10000)*10000;if(fee+Byear(p)*Bremaining()<=spare)out.push({p,c:k,fee,near:ids.has(k.id)})}}
  if(!out.length)return null;out.sort((x,y)=>y.p.ovr-x.p.ovr||(y.near-x.near));return pick(out.slice(0,Math.min(6,out.length)))}
function BpackDeal(tier){const b=Bstate(),c=me(),T={b:0,s:1,g:2}[tier]||0,C=[];
  C.push({k:'cash',v:Math.max(50000,Math.round(Bsum()*[.03,.05,.08][T]/10000)*10000)});C.push({k:'camp',v:[2,3,5][T]});C.push({k:'gate',v:[2,3,5][T]});
  const yg=c.players.filter(p=>p.age<=23&&p.ovr<(p.pot||p.ovr)).sort((x,y)=>((y.pot||y.ovr)-y.ovr)-((x.pot||x.ovr)-x.ovr)||y.ovr-x.ovr)[0];if(yg)C.push({k:'talent',pid:yg.id,v:T===2?2:1,star:1});
  const tip=BscoutPick([25,35,50][T]);if(tip)C.push({k:'scout',pid:tip.p.id,v:[25,35,50][T],star:1});
  if(c.players.some(p=>p.inj>0))C.push({k:'physio'});if(b.contract&&(b.board==null?55:b.board)<85)C.push({k:'board',v:[6,9,14][T]});
  /* three different cards; when the pack can show a player it does, because a face is what makes a pack worth opening */
  const stars=shuffle(C.filter(x=>x.star)),rest=shuffle(C.filter(x=>!x.star)),out=[];if(stars.length)out.push(stars.shift());for(const x of shuffle([...stars,...rest])){if(out.length>=3)break;out.push(x)}
  return shuffle(out).map(x=>{delete x.star;return x})}
function BpackCardInfo(x){const c=me(),f=x.pid!=null?Bfind(x.pid):null;
  switch(x.k){
    case 'cash':return {ic:'coins',t:c.sponsor?'בונוס מנותן החסות':'מענק מההנהלה',v:NIS(x.v),d:'נכנס לקופת המועדון מיד'};
    case 'camp':return {ic:'boot',t:'מחנה אימון',v:`${x.v} אימונים`,d:'כל הסגל מתקדם, וכל שמונה אימונים מוסיפים נקודת דירוג'};
    case 'gate':return {ic:'stadium',t:'ערב אוהדים',v:`${x.v} משחקי בית`,d:'הכנסה גדולה ב־30% מכרטיסים במשחקי הבית הקרובים'};
    case 'talent':return {p:f&&f.p,c,t:'קפיצת כישרון',v:`דירוג +${x.v}`,d:f?`${fullName(f.p)} (${POSHE[f.p.pos]}) עולה ל־${Math.min(f.p.pot||99,f.p.ovr+x.v)}`:''};
    case 'scout':return {p:f&&f.p,c:f&&f.c,t:'טיפ מהסקאוט',v:`${x.v}% הנחה`,d:f?`${fullName(f.p)} · ${POSHE[f.p.pos]} · דירוג ${f.p.ovr} · ${f.c?f.c.name:'שחקן חופשי'}. המחיר המיוחד בתוקף לארבעה מחזורים`:''};
    case 'physio':return {ic:'shield',t:'הצוות הרפואי',v:'כולם כשירים',d:'כל הפצועים חוזרים לסגל כבר למשחק הבא'};
    case 'board':return {ic:'trophy',t:'ערב עם ההנהלה',v:`אמון +${x.v}`,d:'ההנהלה נרגעת ונותנת לך יותר זמן לעבוד'}}
  return {ic:'ball',t:'',v:'',d:''}}
function BpackApply(x){const b=Bstate(),c=me();let note='';
  if(x.k==='cash'){Bledger(c.sponsor?'בונוס מנותן החסות':'מענק מההנהלה',x.v);note=`${NIS(x.v)} נכנסו לקופה`}
  else if(x.k==='camp'){let up=0;for(const p of c.players){const was=p.bTraining||0;p.bTraining=was+x.v;const n=Math.floor(p.bTraining/8)-Math.floor(was/8);if(n>0&&p.ovr<(p.pot||99)){BrateUp(p,n);up++}}note=up?`${up} שחקנים עלו בדירוג`:'הסגל התקדם באימונים'}
  else if(x.k==='gate'){b.boost.gate=(b.boost.gate||0)+x.v;note=`${x.v} משחקי הבית הקרובים יכניסו יותר`}
  else if(x.k==='talent'){const p=c.players.find(p=>p.id===x.pid);if(p){BrateUp(p,x.v);note=`${fullName(p)} עלה ל־${p.ovr}`}}
  else if(x.k==='scout'){b.tip={pid:x.pid,pct:x.v,until:b.round+4,s:b.season};const f=Bfind(x.pid);note=f?`${fullName(f.p)} (${POSHE[f.p.pos]}) מחכה לך בשוק במחיר מיוחד`:''}
  else if(x.k==='physio'){for(const p of c.players){p.inj=0;p.fit=100}try{BensureXI(c)}catch(e){}note='כל הסגל כשיר'}
  else if(x.k==='board'){b.board=Math.min(100,(b.board==null?55:b.board)+x.v);note='אמון ההנהלה עלה'}
  b.ct.packs=(b.ct.packs||0)+1;return note}
function BpackCardHTML(x,i,o){const I=BpackCardInfo(x),chosen=o&&o.pick===i,off=o&&o.pick!=null&&!chosen;
  return `<button type="button" class="apk-card${chosen?' on':''}${off?' off':''}" data-bpk-pick="${i}" ${o&&o.pick!=null?'disabled':`aria-pressed="${o&&o.sel===i}"`} style="--i:${i}" aria-label="${esc(I.t)}: ${esc(I.v)}. ${esc(I.d)}"><span class="apk-face">${I.p?`<span class="apk-pl">${Bportrait(I.p,I.c||me())}</span>`:`<span class="apk-ic">${Bui(I.ic)}</span>`}<small>${esc(I.t)}</small><strong><bdi>${esc(I.v)}</bdi></strong></span><span class="apk-back" aria-hidden="true">${Bui('ball')}</span></button>`}
function BpackPaint(){const b=Bstate(),o=b&&b.packOpen,root=document.getElementById('bpack');if(!root)return;if(!o){root.remove();document.body.style.overflow='';return}
  const more=b.packs.length,picked=o.pick!=null,sel=picked?o.pick:o.sel,I=sel!=null&&o.cards?BpackCardInfo(o.cards[sel]):null;
  root.className='apk '+o.tier+(o.step==='sealed'?' sealed':' dealt')+(picked?' picked':'')+(o.fresh?'':' still');
  root.innerHTML=o.step==='sealed'?`<div class="apk-stage"><p class="apk-kick">רמת מאמן <bdi>${b.lvl}</bdi></p><h2 id="bpackH">${BPK_HE[o.tier]}</h2><button type="button" class="apk-pack" data-bpk="open" aria-label="פתח את החבילה">${BpackArt(o.tier)}</button><p class="apk-hint">בפנים שלושה קלפים. אתה בוחר אחד מהם.</p><button type="button" class="bbtn primary" data-bpk="open">פתח את החבילה</button><button type="button" class="blink" data-bpk="later">אחר כך</button></div>`
   :`<div class="apk-stage"><p class="apk-kick">${BPK_HE[o.tier]}</p><h2 id="bpackH">${picked?'הקלף שלך':'בחר קלף אחד'}</h2><div class="apk-cards">${o.cards.map((x,k)=>BpackCardHTML(x,k,o)).join('')}</div>
     ${picked?`<p class="apk-note" role="status"><strong>${esc(o.note||I.v)}</strong>${o.cards[o.pick].k==='scout'?'<span>תמצא אותו ברכש. המחיר המיוחד כבר מופיע בהצעה.</span>':''}</p><button type="button" class="bbtn primary" data-bpk="${more?'next':'done'}">${more?`לחבילה הבאה (<bdi>${more}</bdi>)`:'מעולה'}</button>${more?'<button type="button" class="blink" data-bpk="done">סגור</button>':''}`
      :I?`<p class="apk-note" role="status"><strong>${esc(I.t)} · <bdi>${esc(I.v)}</bdi></strong><span>${esc(I.d)}</span></p><button type="button" class="bbtn primary" data-bpk="take">קח את הקלף הזה</button>`
        :`<p class="apk-hint">הקש על קלף כדי לראות מה הוא נותן. לוקחים רק אחד.</p>`}</div>`;
  o.fresh=false;const f=root.querySelector('.bbtn')||root.querySelector('.apk-card');try{f&&f.focus({preventScroll:true})}catch(e){}}
function BpackOpen(){const b=BxpEnsure();if(!b||b.live||b.out)return;if(!b.packOpen){if(!b.packs.length)return;b.packOpen={tier:b.packs.shift(),step:'sealed',cards:null,pick:null};Bwrite()}
  document.querySelector('.bdialog')?.remove();let root=document.getElementById('bpack');if(!root){root=document.createElement('div');root.id='bpack';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','bpackH');document.body.appendChild(root);document.body.style.overflow='hidden'}BpackPaint()}
function BpackStep(a,i){const b=Bstate(),o=b&&b.packOpen;if(!o)return;
  if(a==='open'&&o.step==='sealed'){o.cards=BpackDeal(o.tier);o.step='dealt';o.sel=null;o.fresh=true;Bwrite();BpackPaint();try{buzz('open')}catch(e){}return}
  if(a==='sel'&&o.step==='dealt'&&o.pick==null&&o.cards[i]){o.sel=i;BpackPaint();try{buzz('tap')}catch(e){}return}
  if(a==='take'&&o.step==='dealt'&&o.pick==null&&o.sel!=null&&o.cards[o.sel]){o.pick=o.sel;o.note=BpackApply(o.cards[o.pick]);BmsCheck();Bwrite();BpackPaint();try{buzz('win')}catch(e){}return}
  if(a==='later'&&o.step==='sealed'){b.packs.unshift(o.tier);b.packOpen=null;Bwrite();BpackPaint();Brender();return}
  if((a==='done'||a==='next')&&o.pick!=null){b.packOpen=null;Bwrite();if(a==='next'&&b.packs.length){BpackOpen();return}BpackPaint();Brender()}}
document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el||!G||!G.beginner)return;
  if(el.dataset.bms!=null)return BmsClaim(+el.dataset.bms);
  if(el.dataset.bmsGo){const go=el.dataset.bmsGo;if(go==='daily'){try{BdailyOpen()}catch(err){console.warn(err)}return}Btab=go;Brender();window.scrollTo?.(0,0);return}
  if(el.dataset.action==='pack'){el.closest('dialog')?.remove();return BpackOpen()}
  if(el.dataset.bpk)return BpackStep(el.dataset.bpk);if(el.dataset.bpkPick!=null)return BpackStep('sel',+el.dataset.bpkPick)});
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||!document.getElementById('bpack'))return;const o=G&&G.beginner&&G.beginner.packOpen;if(!o)return;if(o.step==='sealed')BpackStep('later');else if(o.pick!=null)BpackStep('done')});
