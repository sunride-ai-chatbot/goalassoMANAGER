/* ====================== BEGINNER: the daily challenge ======================
   One challenge a day, the same for everybody: a formation, three real players to choose from for each of its eleven
   places, and four knockout opponents that get stronger. One attempt. What differs between two people is what they chose
   and how their matches went, which is what makes it worth comparing ("how did you get past them?") and worth coming
   back for tomorrow.

   - **The plan is a function of the date and nothing else** (BdailyPlan): a generator seeded by the day's date in Israel
     deals the formation, the 33 offers (a headline name, a solid one and a cheaper one for every place, nobody twice),
     the five substitutes and the four opponents. The pool is the quick tournament's — real players rated 73 and up from
     the squads in data/euro — read in a fixed order, so two phones on the same build get the same day.
   - **The choice is rating against links** (blitzLinks: team-mates of one club or one country play better together, up
     to +3). The best name on offer is not always the best pick, and that is the whole puzzle.
   - **The matches are real matches** on the beginner live screen (highlights by default, shouts, substitutions, the
     penalty picture, a shoot-out when level): `M.bDaily` is the round, Btick hands the finished match to BdailyFinish.
   - **It never touches a career.** Like the quick tournament and the penalty cup it runs on a throw-away state: G is a
     newGame() state with a small G.beginner flagged `daily`, SANDBOX is on, and Bwrite writes nothing while either
     holds. The career waits in BDAILY.keep and comes back in BdailyClose, which is also where a finished challenge
     pays the coach his experience (once a day).
   - What is stored is the day's own progress and a small record, in localStorage (BDAILY_KEY): picks as pool keys, the
     round, the results. A page closed in the middle resumes there; a match that was running is played again.
   - Sharing is text (navigator.share, else WhatsApp, else the clipboard): the date, four squares, how far, and the link
     `?daily`, which opens the challenge directly (BdailyFromLink; the domain's root sends it on to this page).

   Days played in a row are counted and shown, and nothing is lost when the count ends. */
const BDAILY_KEY='goalasso.daily.v1';
const BDAILY_ROUNDS=['שמינית הגמר','רבע הגמר','חצי הגמר','הגמר'];
/* the four opponents against the day's average offer: the first is there to be beaten, the final is stronger than a careless
   eleven. Rating alone gets a good draft to the last two rounds; the links are what wins them. */
const BDAILY_OFF=[-4,-1.5,1,3.5];
const BDAILY_URL='https://goal-m.com/?daily';
let BDAILY=null,BdailyClock=0;
function BdailyDate(t){if(!t&&typeof window!=='undefined'&&window.__dailyDate)return window.__dailyDate;const d=t||new Date();try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}catch(e){return d.toISOString().slice(0,10)}}
function BdailyDayBefore(s){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)}
function BdailyDateHe(s){const p=String(s).split('-');return `${+p[2]}.${+p[1]}`}
function BdailyStore(){const rec={played:0,cups:0,best:-1,streak:0,bestStreak:0,last:null},base={d:null,picks:[],round:0,res:[],stage:null,xp:false,rec};
  try{const s=JSON.parse(localStorage.getItem(BDAILY_KEY)||'null');if(s&&typeof s==='object'){Object.assign(base,s);base.rec=Object.assign(rec,s.rec||{})}}catch(e){}
  const today=BdailyDate();if(base.d!==today)Object.assign(base,{d:today,picks:[],round:0,res:[],stage:null,xp:false});if(!Array.isArray(base.picks))base.picks=[];if(!Array.isArray(base.res))base.res=[];return base}
function BdailySave(s){try{localStorage.setItem(BDAILY_KEY,JSON.stringify(s))}catch(e){}}
function BdailyDoneToday(){const s=BdailyStore();return s.stage==='won'||s.stage==='out'}
/* every real player good enough for the draft, in a fixed order (the quick tournament's rule for a rating) */
function BdailyPool(){if(BdailyPool.c)return BdailyPool.c;const S=blitzStrengths(),out=[];
  for(const name of Object.keys(S).sort()){const raw=typeof RAW_EURO!=='undefined'&&RAW_EURO[name];if(!raw||raw.length<14)continue;const rated=raw.map(r=>({r,o:euroRating(r.value_m,r.age)})).filter(x=>x.o!=null&&x.r.he&&x.r.en);
    const top=rated.map(x=>x.o).sort((a,b)=>b-a).slice(0,14);if(!top.length)continue;const shift=clamp(Math.round(S[name].str+1-top.reduce((a,b)=>a+b,0)/top.length),-7,7);
    for(const x of rated){const ovr=clamp(x.o+shift,46,94);if(ovr>=73)out.push({key:name+'|'+x.r.en,club:name,str:S[name].str,c1:S[name].c1,c2:S[name].c2,r:x.r,ovr,pos:x.r.pos||'MF',nat:NAT_HE[x.r.nat]||x.r.nat||'',he:x.r.he})}}
  out.sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);BdailyPool.c=out;return out}
function BdailyPlan(date){if(BdailyPlan.c&&BdailyPlan.c.date===date)return BdailyPlan.c;const rnd=lgRng(lgHashN('goalasso-daily:'+date)),pk=a=>a[Math.floor(rnd()*a.length)],pool=BdailyPool();
  const form=pk(Object.keys(FORMATIONS).sort()),slots=slotsFor(form),used=new Set(),offers=[];
  const take=(pos,lo,hi)=>{let c=pool.filter(x=>x.pos===pos&&!used.has(x.key)&&x.ovr>=lo&&x.ovr<=hi);if(!c.length)c=pool.filter(x=>x.pos===pos&&!used.has(x.key));if(!c.length)return null;const x=pk(c);used.add(x.key);return x};
  for(const pos of slots){const trio=[rnd()<.3?take(pos,87,94):take(pos,83,87),take(pos,79,83),take(pos,75,79)].filter(Boolean);for(let i=trio.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[trio[i],trio[j]]=[trio[j],trio[i]]}offers.push(trio)}
  const bench=['GK','DF','MF','MF','FW'].map(pos=>take(pos,74,77)).filter(Boolean);
  const base=offers.reduce((s,t)=>s+t.reduce((a,x)=>a+x.ovr,0)/Math.max(1,t.length),0)/Math.max(1,offers.length),defs=blitzClubDefs().slice().sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0),taken=new Set(),opps=[];
  for(const off of BDAILY_OFF){const T=base+off,free=defs.filter(d=>!taken.has(d[0])),near=free.filter(d=>Math.abs(d[6]-T)<=1.5),d=near.length?pk(near):free.slice().sort((a,b)=>Math.abs(a[6]-T)-Math.abs(b[6]-T))[0];if(!d)break;taken.add(d[0]);opps.push(d)}
  return BdailyPlan.c={date,form,slots,offers,bench,opps,base}}
function BdailyRating(){const D=BDAILY;return D&&D.picks.length?D.picks.reduce((t,p)=>t+p.ovr,0)/D.picks.length:0}
function BdailySquad(){const D=BDAILY,c=me();c.formation=D.plan.form;c.players=[...D.picks,...D.bench];c.lineup=D.picks.map(p=>p.id);c.captain=D.picks.slice().sort((a,b)=>(b.ovr+b.age*.4)-(a.ovr+a.age*.4))[0].id;try{ensureNumbers(c)}catch(e){}}
function BdailyDraw(){const D=BDAILY,def=D.plan.opps[D.st.round];for(const k of Object.keys(G.pseudo||{}))if(/^b\d/.test(k))delete G.pseudo[k];D.opp=def?clubFromDef(def,'b'):null;return D.opp}
function BdailyOpen(){if(BDAILY)return;if(G&&G.beginner&&G.beginner.live)return Bflash('סיים קודם את המשחק הפעיל');if(typeof PCUP!=='undefined'&&PCUP)return;
  if(G&&G.beginner)Bwrite();try{closeFrontPage(true)}catch(e){}document.querySelector('.bdialog')?.remove();
  const keep={G,uid,sandbox:SANDBOX,tab:Btab};SANDBOX=true;
  try{newGame(Object.keys(META)[0],(keep.G&&keep.G.beginner&&keep.G.beginner.coach)||'')}catch(e){G=keep.G;uid=keep.uid;SANDBOX=keep.sandbox;console.warn('daily',e);return Bflash('לא הצלחנו לפתוח את האתגר היומי')}
  const src=keep.G||{};Object.assign(G,{daily:true,phase:'play',view:'home',pressMode:'off',paperPopOff:true,paper:[],paperPop:[],sound:src.sound,vol:src.vol,motion:src.motion,renderer:src.renderer,speed:src.speed,replay:src.replay,haptic:src.haptic,penGame:src.penGame,pen3d:src.pen3d});
  G.beginner={v:1,daily:true,league:[],focus:'MF',round:0,season:1,ledger:[],schedule:[],loans:[],sponsorOffers:[],playerStats:{},recordedMatches:{},coach:''};
  Object.assign(me(),{name:'נבחרת היום',short:'נבחרת היום',c1:'#00FF9D',c2:'#0b1026',stadium:'אצטדיון האתגר',players:[],youth:[],chem:null,tacFam:null,sponsor:null,lineup:null,captain:null,naming:null,ads:[]});
  const st=BdailyStore(),plan=BdailyPlan(st.d),byKey=new Map(plan.offers.flat().map(x=>[x.key,x]));BDAILY={keep,plan,st,picks:[],bench:[],opp:null,made:{}};
  let picks=st.picks.map(k=>byKey.get(k));if(picks.some(x=>!x)||picks.length>plan.slots.length){picks=[];Object.assign(st,{picks:[],round:0,res:[],stage:st.stage==='won'||st.stage==='out'?st.stage:null})}
  BDAILY.picks=picks.map(blitzMake);if(st.stage==='draft'&&BDAILY.picks.length>=plan.slots.length)st.stage='cup';
  if(BDAILY.picks.length>=plan.slots.length){BDAILY.bench=plan.bench.map(blitzMake);BdailySquad();if(st.stage==='cup')BdailyDraw()}
  try{hideSplash()}catch(e){}Brender();window.scrollTo?.(0,0)}
function BdailyClose(){const D=BDAILY;if(!D)return;if(G&&G.beginner&&G.beginner.live)return;clearInterval(BdailyClock);BdailyClock=0;try{BstopBroadcast()}catch(e){}
  G=D.keep.G;uid=D.keep.uid;SANDBOX=D.keep.sandbox;BDAILY=null;Btab=D.keep.tab||'home';const st=D.st,done=st.stage==='won'||st.stage==='out';
  /* a finished challenge pays the career, once: for coming, for every round won, and for the cup */
  if(done&&!st.xp&&G&&G.beginner&&!G.beginner.out){const xp=20+st.res.filter(r=>r.won).length*20+(st.stage==='won'?60:0),ups=BxpAdd(xp);st.xp=true;BdailySave(st);Bcount('daily');Bwrite();Brender();Bflash(ups.length?`רמה <bdi>${G.beginner.lvl}</bdi>! ${BPK_HE[ups[ups.length-1].pack]} מחכה לך`:`האתגר היומי: <bdi>+${xp}</bdi> נקודות ניסיון`)}
  else Brender();window.scrollTo?.(0,0)}
function BdailyStart(){const D=BDAILY;if(!D||D.st.stage)return;D.st.stage='draft';BdailySave(D.st);Brender();window.scrollTo?.(0,0)}
function BdailyPick(i){const D=BDAILY;if(!D||D.st.stage!=='draft')return;const n=D.picks.length,rec=(D.plan.offers[n]||[])[i];if(!rec)return;D.picks.push(BdailyMade(rec));D.st.picks.push(rec.key);try{buzz('tap')}catch(e){}
  if(D.picks.length>=D.plan.slots.length){D.bench=D.plan.bench.map(blitzMake);BdailySquad();D.st.stage='cup';D.st.round=0;BdailyDraw()}BdailySave(D.st);Brender();window.scrollTo?.(0,0)}
function BdailyMade(rec){const D=BDAILY;return D.made[rec.key]||(D.made[rec.key]=blitzMake(rec))}
function BdailyPlay(){const D=BDAILY;if(!D||D.st.stage!=='cup'||!D.opp||G.beginner.live)return;const c=me();BdailySquad();c.players.forEach(p=>{p.inj=0;p.susp=0;p.fit=100});G.mentalBoost=blitzBonus(D.picks);
  const M=createMatch(c,D.opp,{kind:'friendly',neutral:true,ko:true});M.bDaily=D.st.round;M.liveMent={[G.me]:'bal'};G.beginner.live={M,speed:'hl',paused:false,half:false};BbroadcastView();window.scrollTo?.(0,0)}
function BdailyFinish(M){const D=BDAILY;if(!D)return;const st=D.st,home=M.h===G.me,gf=home?M.gh:M.ga,ga=home?M.ga:M.gh,won=gf>ga||(gf===ga&&!!M.pens&&((M.pens==='h')===home));
  st.res.push({r:st.round,opp:D.opp.name,gf,ga,pens:gf===ga&&!!M.pens,won});
  if(won&&st.round>=BDAILY_ROUNDS.length-1)st.stage='won';else if(won){st.round++;BdailyDraw()}else st.stage='out';
  if(st.stage==='won'||st.stage==='out'){const r=st.rec;r.played++;if(st.stage==='won')r.cups++;r.best=Math.max(r.best,st.res.filter(x=>x.won).length);r.streak=r.last===BdailyDayBefore(st.d)?r.streak+1:1;r.bestStreak=Math.max(r.bestStreak,r.streak);r.last=st.d}
  BdailySave(st);Brender();window.scrollTo?.(0,0);if(st.stage==='won'){try{SFX.win()}catch(e){}try{confetti(4000)}catch(e){}try{buzz('win')}catch(e){}}}
/* ---- words ---- */
function BdailyReached(st){const w=st.res.filter(r=>r.won).length;return st.stage==='won'?'זכיתי בגביע':w?'נעצרתי ב'+BDAILY_ROUNDS[Math.min(w,BDAILY_ROUNDS.length-1)]:'נעצרתי כבר ב'+BDAILY_ROUNDS[0]}
function BdailyMarks(st){return BDAILY_ROUNDS.map((_,i)=>{const r=st.res.find(x=>x.r===i);return r?(r.won?'🟩':'🟥'):'⬜'}).join('')}
function BdailyShareText(st){const D=BDAILY,avg=D&&D.picks.length?BdailyRating():0,bonus=D&&D.picks.length?blitzBonus(D.picks):0;
  return `GOALASSO · האתגר היומי ${BdailyDateHe(st.d)}\n${BdailyMarks(st)} ${BdailyReached(st)}${avg?`\nהקבוצה שלי: ${avg.toFixed(1)}${bonus?` (+${bonus} קישורים)`:''}`:''}\nנראה אותך: ${BDAILY_URL}`}
function BdailyShare(copyOnly){const st=BDAILY?BDAILY.st:BdailyStore(),text=BdailyShareText(st);
  const copy=()=>{const ok=()=>Bflash('הועתק. אפשר להדביק בכל שיחה');try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text).then(ok,()=>Bflash('לא הצלחנו להעתיק'))}catch(e){}Bflash('לא הצלחנו להעתיק')};
  if(copyOnly)return copy();try{if(navigator.share){const p=navigator.share({text});if(p&&p.catch)p.catch(()=>{});return}}catch(e){}
  try{window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener')}catch(e){copy()}}
function BdailyLeft(){try{const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jerusalem',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,+x.value])),m=24*60-(p.hour*60+p.minute);return `${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`}catch(e){return ''}}
/* ---- screens ---- */
function BdailyHexHTML(c1,c2,cls){return `<span class="ahex ${cls||''}" style="--c:${esc(c1||'#00FF9D')};--c2:${esc(c2||'#00b871')}"><i></i><b>${kitSVG({c1:c1||'#00FF9D',c2:c2||'#0b1026',id:'x'},'')}</b></span>`}
function BdailyPathHTML(){const D=BDAILY,st=D.st;return `<ol class="adl-path" aria-label="המסלול">${D.plan.opps.map((d,i)=>{const r=st.res.find(x=>x.r===i),cur=st.stage==='cup'&&st.round===i;
    return `<li class="${r?(r.won?'won':'lost'):cur?'cur':''}">${BdailyHexHTML(d[4],d[5],'sm')}<span><small>${BDAILY_ROUNDS[i]}</small><strong>${esc(d[0])}</strong></span><b>${r?`<bdi dir="ltr">${r.gf}:${r.ga}</bdi>${r.pens?'<small>פנדלים</small>':''}`:`כוח <bdi>${Math.round(d[6])}</bdi>`}</b></li>`}).join('')}</ol>`}
function BdailyPitchHTML(){const D=BDAILY,lay=slotLayout(D.plan.form),n=D.picks.length;return `<div class="adl-pitch" aria-label="האחת־עשרה שנבחרה">${D.plan.slots.map((pos,i)=>{const p=D.picks[i],L=lay[i]||{x:50,y:50};
    return `<div class="adl-tok${p?' in':''}${i===n&&D.st.stage==='draft'?' cur':''}" style="left:${L.x}%;top:${10+L.y*.8}%">${p?`<b><bdi>${p.ovr}</bdi></b><small>${esc(p.last||p.first)}</small>`:`<b>${POSHE[pos].slice(0,1)}</b>`}</div>`}).join('')}</div>`}
function BdailyCardHTML(x,i){const D=BDAILY,p=BdailyMade(x),c={c1:x.c1,c2:x.c2,players:[]},a=attrs(p),names=ATTR_HE[p.pos==='GK'?'GK':'OUT'],top=a.map((v,k)=>[v,names[k]]).sort((m,n)=>n[0]-m[0]).slice(0,3),tier=x.ovr>=86?' sp':x.ovr>=80?'':x.ovr>=76?' sv':' bz';
  const same=D.picks.filter(q=>q.from===x.club).length,nat=x.nat&&x.nat!=='זר'?D.picks.filter(q=>q.nat===x.nat&&q.from!==x.club).length:0,link=same?`קישור למועדון ×${same}`:nat?`קישור למדינה ×${nat}`:'בלי קישור',name=x.he.length<=12?x.he:(p.last||p.first||x.he);
  return `<button type="button" class="adl-offer" data-bdaily-pick="${i}" aria-label="${esc(x.he)}, ${esc(x.club)}, דירוג ${x.ovr}. ${link}"><span class="afut${tier}"><span class="f1"></span><span class="f2"></span><span class="pl">${Bportrait(p,c)}</span><bdi class="rt">${x.ovr}</bdi><span class="ps">${POSHE[x.pos]}</span><span class="nm">${esc(name)}</span><span class="at">${top.map(([v,n])=>`<span><b>${v}</b><i>${esc(n)}</i></span>`).join('')}</span></span><span class="adl-meta"><strong>${esc(x.club)}</strong><small>${esc(x.nat||'')}</small><em class="${same||nat?'on':''}">${link}</em></span></button>`}
function BdailyView(){const D=BDAILY,st=D.st,plan=D.plan,avg=BdailyRating(),bonus=D.picks.length?blitzBonus(D.picks):0,rec=st.rec;
  if(!st.stage)return `<section class="bhero adl-hero"><span class="atag"><span>${BdailyDateHe(st.d)} · המערך של היום <bdi dir="ltr">${plan.form}</bdi></span></span><h1>האתגר היומי</h1><p>היום כולם מקבלים את אותן בחירות ואת אותן יריבות. בנה אחת־עשרה משחקנים אמיתיים וצא לארבעה משחקי נוקאאוט. יש ניסיון אחד ביום.</p>${Bbutton('בונים קבוצה','data-bdaily="start"')}</section>
    <section class="bpanel"><h2>המסלול של היום</h2>${BdailyPathHTML()}</section>${rec.played?`<div class="bmetrics adl-rec"><article><span>אתגרים ששיחקת</span><strong><bdi>${rec.played}</bdi></strong></article><article><span>גביעים</span><strong><bdi>${rec.cups}</bdi></strong></article><article><span>ימים ברצף</span><strong><bdi>${rec.streak}</bdi></strong></article></div>`:''}`;
  if(st.stage==='draft'){const n=D.picks.length,pos=plan.slots[n];return `<div class="adl-head"><span class="atag"><span>בחירה <bdi>${n+1}</bdi> מתוך <bdi>${plan.slots.length}</bdi></span></span><h1>${POSHE[pos]}</h1><p>דירוג הקבוצה <bdi>${n?avg.toFixed(1):'—'}</bdi> · קישורים <bdi dir="ltr">+${bonus}</bdi></p></div>
    <div class="adl-offers">${(plan.offers[n]||[]).map((x,i)=>BdailyCardHTML(x,i)).join('')}</div><section class="bpanel"><p class="bmuted">שחקנים מאותו מועדון או מאותה מדינה משחקים טוב יותר יחד, עד <bdi dir="ltr">+3</bdi> לדירוג הקבוצה. השם הגדול הוא לא תמיד הבחירה הנכונה.</p>${BdailyPitchHTML()}</section>`}
  if(st.stage==='cup'){const o=D.opp,os=o?Math.round(strength(o)):0,mine=Math.round((avg+bonus)*10)/10,share=clamp(Math.round(50+(mine-os)*2.2),8,92);
    return `<section class="bhero amatch"><div class="amatch-head"><span>האתגר היומי · ${BDAILY_ROUNDS[st.round]}</span><span class="atag">נוקאאוט</span></div><div class="ateams"><div class="ateam">${BdailyHexHTML(me().c1,me().c2,'lg')}<strong>נבחרת היום</strong></div><div class="avs" aria-hidden="true"><b>VS</b></div><div class="ateam">${o?Bhex(o,'lg'):''}<strong>${esc(o?o.name:'')}</strong></div></div>
     <div class="apower" role="img" aria-label="יחסי הכוחות: ${mine} מול ${os}"><i style="width:${share}%"></i></div><div class="apower-l"><span class="mine">הכוח שלך <bdi>${avg.toFixed(1)}</bdi> <bdi dir="ltr">+${bonus}</bdi></span><span>הכוח שלהם <bdi>${os}</bdi></span></div><ul class="astakes"><li><b>נוקאאוט</b><span>תיקו אחרי תשעים דקות הולך לפנדלים. הפסד אחד והאתגר נגמר</span></li></ul>${Bbutton('לשריקת הפתיחה','data-bdaily="play"')}</section>
     <section class="bpanel"><h2>המסלול</h2>${BdailyPathHTML()}</section><section class="bpanel"><h2>האחת־עשרה שלך</h2>${BdailyPitchHTML()}<p class="bmuted">ספסל: ${D.bench.map(p=>`${esc(p.last||p.first)} <bdi>${p.ovr}</bdi>`).join(' · ')}</p></section>`}
  const won=st.stage==='won',last=st.res[st.res.length-1];
  return `<section class="bhero adl-hero ${won?'won':'out'}"><span class="atag">${BdailyDateHe(st.d)}</span><h1>${won?'הגביע שלך!':'האתגר נגמר'}</h1><p>${won?'ארבעה ניצחונות עם אחת־עשרה שבחרת בעצמך.':last?`${esc(BDAILY_ROUNDS[last.r])}: ${esc(last.opp)} <bdi dir="ltr">${last.gf}:${last.ga}</bdi>${last.pens?' בפנדלים':''}. מחר יש אתגר חדש.`:''}</p><p class="adl-marks" role="img" aria-label="${esc(BdailyReached(st))}">${BdailyMarks(st)}</p>
     <div class="adl-share">${Bbutton('שתף עם חברים','data-bdaily="share"')}${Bbutton('העתק','data-bdaily="copy"','secondary')}</div><p class="adl-next">האתגר הבא בעוד <bdi id="bdaily-left">${BdailyLeft()}</bdi> שעות</p></section>
   <section class="bpanel"><h2>המסלול שלך</h2>${BdailyPathHTML()}</section>${D.picks.length?`<section class="bpanel"><h2>האחת־עשרה שלך</h2><p class="bmuted">דירוג <bdi>${avg.toFixed(1)}</bdi> · קישורים <bdi dir="ltr">+${bonus}</bdi></p>${BdailyPitchHTML()}</section>`:''}
   <div class="bmetrics adl-rec"><article><span>אתגרים ששיחקת</span><strong><bdi>${rec.played}</bdi></strong></article><article><span>גביעים</span><strong><bdi>${rec.cups}</bdi></strong></article><article><span>ימים ברצף</span><strong><bdi>${rec.streak}</bdi></strong></article></div>`}
function BdailyRender(){document.getElementById('top')?.classList.add('hide');document.getElementById('nav')?.classList.add('hide');document.body.dataset.btab='daily';const D=BDAILY,done=D.st.stage==='won'||D.st.stage==='out';
  document.getElementById('main').innerHTML=`<div class="bapp adaily"><header class="btop"><button type="button" class="adl-back" data-bdaily="exit"><span aria-hidden="true">›</span> ${D.keep.G&&D.keep.G.beginner?'חזרה לקריירה':'חזרה'}</button><span class="bbrand">GOALASSO<span>DAILY</span></span></header>${BdailyView()}<footer class="bfooter"><span>${done?'התוצאה נשמרה במכשיר הזה.':'ההתקדמות נשמרת במכשיר הזה. אפשר לצאת ולהמשיך אחר כך היום.'}</span></footer></div>`;
  clearInterval(BdailyClock);BdailyClock=0;if(done)BdailyClock=setInterval(()=>{const el=document.getElementById('bdaily-left');if(!el||!BDAILY){clearInterval(BdailyClock);BdailyClock=0;return}if(BdailyDate()!==BDAILY.st.d){clearInterval(BdailyClock);BdailyClock=0;return}el.textContent=BdailyLeft()},30000)}
/* the card on the home and start screens: what today is, and where the coach stands in it */
function BdailyEntryHTML(){let st,plan;try{st=BdailyStore();plan=BdailyPlan(st.d)}catch(e){return ''}const done=st.stage==='won'||st.stage==='out',going=st.stage==='draft'||st.stage==='cup';
  const line=done?`${BdailyMarks(st)} ${BdailyReached(st)}. האתגר הבא בעוד <bdi>${BdailyLeft()}</bdi> שעות.`:going?(st.stage==='draft'?`בחרת <bdi>${st.picks.length}</bdi> מתוך <bdi>${plan.slots.length}</bdi> שחקנים.`:`${BDAILY_ROUNDS[st.round]} מחכה לך.`):`מערך <bdi dir="ltr">${plan.form}</bdi>, ארבעה משחקי נוקאאוט, ניסיון אחד. זהה לכולם היום.`;
  return `<section class="bpanel adl-entry${done?' done':''}"><span class="adl-ic">${Bui('trophy')}</span><div><h2>האתגר היומי <small><bdi>${BdailyDateHe(st.d)}</bdi></small></h2><p>${line}</p></div><button type="button" class="bbtn ${done?'secondary':'primary'}" data-bdaily-open>${done?'לתוצאה':going?'המשך':'שחק'}</button></section>`}
function BdailyLink(){try{return new URLSearchParams(location.search).has('daily')}catch(e){return false}}
function BdailyFromLink(){if(!BdailyLink()||BDAILY)return;setTimeout(()=>{try{if(!BDAILY&&!(G&&G.beginner&&G.beginner.live))BdailyOpen()}catch(e){console.warn(e)}},400)}
document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;if(el.hasAttribute('data-bdaily-open')){e.preventDefault();return BdailyOpen()}if(!BDAILY)return;
  if(el.dataset.bdailyPick!=null)return BdailyPick(+el.dataset.bdailyPick);const a=el.dataset.bdaily;if(a==='start')return BdailyStart();if(a==='play')return BdailyPlay();if(a==='exit')return BdailyClose();if(a==='share')return BdailyShare(false);if(a==='copy')return BdailyShare(true)});
