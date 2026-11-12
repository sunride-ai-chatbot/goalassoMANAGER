/* ====================== BLITZ: the quick draft tournament ======================
   A separate mode outside the career: draft an eleven (one of three real players for every position), then four knockout
   rounds against real clubs that get stronger. Lose once and the run is over; a new draft starts from nothing.

   It never touches a career. While it runs, the global G is a throw-away sandbox built by newGame(), the career object
   waits untouched in BLITZ.career, and SANDBOX switches every write to storage off (save / saveSync / emergencyFlush in
   22-save.js). Leaving restores G and the player-id counter. The only thing the mode stores is its own small record and
   the current run, in localStorage (BLITZ_KEY / BLITZ_RUN); the achievements read the record through blitzRec(). */
const BLITZ_KEY='goalasso_blitz_v1',BLITZ_RUN='goalasso_blitz_run_v1';
const BLITZ_ROUNDS=[['R16','שמינית הגמר',-8],['QF','רבע הגמר',-5.5],['SF','חצי הגמר',-3.5],['F','הגמר',-1.5]];
let BLITZ=null,SANDBOX=false;
function blitzRec(){const base={runs:0,cups:0,finals:0,streak:0,bestStreak:0,best:-1};try{return Object.assign(base,JSON.parse(localStorage.getItem(BLITZ_KEY)||'{}'))}catch(e){return base}}
function blitzStore(key,val){try{if(val==null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(val))}catch(e){}}
/* every real player the game knows who is good enough for the draft: {club, str, r (raw row), ovr} or {club, p (Israeli league player)} */
function blitzStrengths(){const m={};for(const d of EURO_CLUBS)m[d[0]]={str:d[6],c1:d[4],c2:d[5],country:d[1],def:d};for(const L of Object.values(WORLD_LEAGUES))for(const c of L.clubs)if(!m[c[0]])m[c[0]]={str:c[4],c1:c[2],c2:c[3],country:c[6]||L.country,def:[c[0],c[6]||L.country,c[1],'',c[2],c[3],c[4]]};return m}
function blitzPool(){if(blitzPool.c)return blitzPool.c;const S=blitzStrengths();const out=[];
  for(const name in S){const raw=RAW_EURO&&RAW_EURO[name];if(!raw||raw.length<14)continue;const rated=raw.map(r=>({r,o:euroRating(r.value_m,r.age)})).filter(x=>x.o!=null&&x.r.he&&x.r.en);
    const top=rated.map(x=>x.o).sort((a,b)=>b-a).slice(0,14);if(!top.length)continue;const shift=clamp(Math.round(S[name].str+1-top.reduce((a,b)=>a+b,0)/top.length),-7,7);
    for(const x of rated){const ovr=clamp(x.o+shift,46,94);if(ovr>=73)out.push({key:name+'|'+x.r.en,club:name,str:S[name].str,r:x.r,ovr,pos:x.r.pos||'MF',nat:NAT_HE[x.r.nat]||x.r.nat||'',he:x.r.he})}}
  if(BLITZ&&G&&G.blitz)for(const c of G.clubs){if(c.id===G.me)continue;for(const p of c.players)if(p.real&&p.ovr>=73)out.push({key:c.name+'|'+fullName(p),club:c.name,p,ovr:p.ovr,pos:p.pos,nat:p.nat||'ישראל',he:fullName(p)})}
  blitzPool.c=out;return out}
function blitzClubDefs(){if(blitzClubDefs.c)return blitzClubDefs.c;const S=blitzStrengths();blitzClubDefs.c=Object.keys(S).filter(n=>RAW_EURO&&RAW_EURO[n]&&RAW_EURO[n].length>=14).map(n=>S[n].def);return blitzClubDefs.c}
function blitzMake(rec){let p;if(rec.p){p=JSON.parse(JSON.stringify(rec.p));p.id=uid++}else{p=fromRawEuro(rec.r,rec.str,rec.club);p.ovr=rec.ovr;p.pot=Math.max(p.pot,rec.ovr)}
  Object.assign(p,{foreign:false,inj:0,susp:0,fit:100,form:0,morale:72,goals:0,apps:0,yellow:0,contract:3,bkey:rec.key,from:p.from||rec.club});finalize(p);return p}
/* links: two picked players from the same club or the same country play better together */
function blitzLinks(ps){let n=0;for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const a=ps[i],b=ps[j];if(!a||!b)continue;if(a.from&&a.from===b.from)n+=2;else if(a.nat&&a.nat===b.nat&&a.nat!=='זר')n+=1}return n}
function blitzBonus(ps){return +Math.min(3,blitzLinks(ps)*.2).toFixed(1)}
function blitzRating(ps){const xs=ps.filter(Boolean);return xs.length?xs.reduce((t,p)=>t+p.ovr,0)/xs.length:0}
/* three different candidates for the next slot: a headline name, a solid one, and one who links with the squad when possible */
function blitzOffer(){const B=BLITZ;const pos=B.slots[B.picks.length];const taken=new Set([...B.picks.map(p=>p.bkey)]);const pool=blitzPool().filter(x=>x.pos===pos&&!taken.has(x.key));
  const band=(lo,hi)=>pool.filter(x=>x.ovr>=lo&&x.ovr<=hi);const take=(arr,used)=>{const a=arr.filter(x=>!used.includes(x));return a.length?pick(a):null};const out=[];
  const star=Math.random()<.3?band(86,94):band(82,86);const c1=take(star.length?star:band(80,94),out)||take(pool,out);if(c1)out.push(c1);
  const c2=take(band(78,83),out)||take(pool,out);if(c2)out.push(c2);
  const clubs=new Set(B.picks.map(p=>p.from)),nats=new Set(B.picks.map(p=>p.nat));const linked=band(75,84).filter(x=>clubs.has(x.club)||(x.nat&&x.nat!=='זר'&&nats.has(x.nat)));
  const c3=take(linked.length&&Math.random()<.8?linked:band(74,80),out)||take(pool,out);if(c3)out.push(c3);
  B.offer=shuffle(out);return B.offer}
function blitzSandbox(){const career=G,oldUid=uid;SANDBOX=true;
  try{newGame(Object.keys(META)[0],career&&career.manager?career.manager.name:'');}catch(e){G=career;uid=oldUid;SANDBOX=false;throw e}
  const src=career||{};Object.assign(G,{blitz:true,phase:'play',view:'home',pressMode:'off',paperPopOff:true,paperPop:[],sound:src.sound,vol:src.vol,motion:src.motion,renderer:src.renderer,speed:src.speed,replay:src.replay,haptic:src.haptic,penGame:src.penGame,spx:blitzRec().spx||'hl'});
  const c=me();Object.assign(c,{name:'נבחרת החלומות',short:'החלומות',c1:'#c6f24e',c2:'#10151d',stadium:'אצטדיון הבזק',players:[],youth:[],chem:null,tacFam:null,sponsor:null,lineup:null,captain:null,naming:null,ads:[]});
  blitzPool.c=null;return {career,uid:oldUid}}
function blitzEnter(){if(BLITZ)return render();if(G&&G.live&&!G.live.settled)return toast('סיים קודם את המשחק הפעיל');if(typeof mpIsOn==='function'&&G&&mpIsOn())return toast('טורניר בזק לא זמין בזמן משחק רשת');
  const go=()=>{let box;try{box=blitzSandbox()}catch(e){console.warn('blitz',e);return toast('לא הצלחנו לפתוח את הטורניר')}
    BLITZ={career:box.career,uid:box.uid,stage:'lobby',picks:[],slots:[],offer:[],round:0,opp:null,res:[],form:'4-3-3'};closeModal();try{hideSplash()}catch(e){}render();const m=$('main');if(m)m.scrollTop=0};
  if(G&&!G.blitz)return Promise.resolve(save()).then(go,go);go()}
function blitzExit(){if(!BLITZ)return;const B=BLITZ;try{Match3D.stop()}catch(e){}if(liveTimer){clearInterval(liveTimer);liveTimer=null}try{crowdStop(.4)}catch(e){}try{penClose()}catch(e){}
  G=B.career;uid=B.uid;BLITZ=null;SANDBOX=false;blitzPool.c=null;closeModal();
  if(G){try{const got=achCheck();if(got.length)toast('🏅 הישג חדש: '+got[0].he)}catch(e){}}render()}
function blitzRunSave(){const B=BLITZ;if(!B||B.stage==='lobby')return;blitzStore(BLITZ_RUN,{form:B.form,picks:B.picks.map(p=>p.bkey),bench:(B.bench||[]).map(p=>p.bkey),round:B.round,res:B.res,stage:B.stage==='draft'?'draft':'cup',used:B.used||[],opp:B.oppName||null})}
function blitzResume(){let R=null;try{R=JSON.parse(localStorage.getItem(BLITZ_RUN)||'null')}catch(e){}if(!R||!Array.isArray(R.picks))return false;const B=BLITZ;const byKey=new Map(blitzPool().map(x=>[x.key,x]));
  B.form=FORMATIONS[R.form]?R.form:'4-3-3';B.slots=slotsFor(B.form);B.picks=R.picks.map(k=>byKey.get(k)).filter(Boolean).map(blitzMake);if(B.picks.length!==R.picks.length)return false;
  if(R.stage==='draft'&&B.picks.length<11){B.stage='draft';blitzOffer();return true}if(B.picks.length<11)return false;
  B.bench=(R.bench||[]).map(k=>byKey.get(k)).filter(Boolean).map(blitzMake);B.round=clamp(R.round|0,0,3);B.res=Array.isArray(R.res)?R.res:[];B.used=R.used||[];blitzSquad();B.oppName=R.opp;blitzDraw(R.opp);B.stage='cup';return true}
function blitzStart(form){const B=BLITZ;B.form=FORMATIONS[form]?form:'4-3-3';B.slots=slotsFor(B.form);B.picks=[];B.bench=[];B.round=0;B.res=[];B.used=[];B.opp=null;B.oppName=null;B.stage='draft';blitzOffer();blitzRunSave();render()}
function blitzPick(i){const B=BLITZ;const rec=B.offer[i];if(!rec||B.stage!=='draft')return;B.picks.push(blitzMake(rec));buzz('tap');
  if(B.picks.length>=11){blitzBench();blitzSquad();blitzDraw();B.stage='cup'}else blitzOffer();blitzRunSave();render();const m=$('main');if(m)m.scrollTop=0}
/* five substitutes a little below the eleven, one goalkeeper among them */
function blitzBench(){const B=BLITZ;const avg=blitzRating(B.picks);const taken=new Set(B.picks.map(p=>p.bkey));B.bench=[];
  for(const pos of ['GK','DF','MF','MF','FW']){const c=blitzPool().filter(x=>x.pos===pos&&!taken.has(x.key)&&x.ovr<=avg-3&&x.ovr>=avg-8);const all=c.length?c:blitzPool().filter(x=>x.pos===pos&&!taken.has(x.key));if(!all.length)continue;const r=pick(all);taken.add(r.key);B.bench.push(blitzMake(r))}}
function blitzSquad(){const B=BLITZ,c=me();c.formation=B.form;c.players=[...B.picks,...B.bench];c.lineup=B.picks.map(p=>p.id);c.captain=B.picks.slice().sort((a,b)=>(b.ovr+b.age*.4)-(a.ovr+a.age*.4))[0].id;try{ensureNumbers(c)}catch(e){}}
/* the next opponent: a real club whose strength sits at the round's offset from the drafted eleven */
function blitzDraw(name){const B=BLITZ;const T=blitzRating(B.picks)+BLITZ_ROUNDS[B.round][2];const defs=blitzClubDefs();B.used=B.used||[];
  let def=name?defs.find(d=>d[0]===name):null;
  if(!def){const free=defs.filter(d=>!B.used.includes(d[0]));const near=free.filter(d=>Math.abs(d[6]-T)<=1.5);def=near.length?pick(near):free.slice().sort((a,b)=>Math.abs(a[6]-T)-Math.abs(b[6]-T))[0]}
  for(const k of Object.keys(G.pseudo))if(/^b\d/.test(k))delete G.pseudo[k];
  B.opp=clubFromDef(def,'b');B.oppName=def[0];if(!B.used.includes(def[0]))B.used.push(def[0]);return B.opp}
function blitzPlay(){const B=BLITZ;if(!B||B.stage!=='cup'||!B.opp)return;const c=me();blitzSquad();c.players.forEach(p=>{p.inj=0;p.susp=0;p.fit=100});
  G.mentalBoost=blitzBonus(B.picks);const M=createMatch(c,B.opp,{kind:'friendly',neutral:true,ko:true,blitz:true,stage:BLITZ_ROUNDS[B.round][0],label:'טורניר בזק · '+BLITZ_ROUNDS[B.round][1]});
  M.live=true;M.fresh=true;G.live=M;penPreload();startLive(M)}
function blitzAfterMatch(M){const B=BLITZ;if(!B)return render();const c=me();const meH=M.h===G.me;const gf=meH?M.gh:M.ga,ga=meH?M.ga:M.gh;const won=gf>ga||(gf===ga&&!!M.pens&&((M.pens==='h')===meH));
  G.live=null;try{crowdStop(.6)}catch(e){}const R=blitzRec();B.res.push({r:B.round,opp:B.opp.name,gf,ga,pens:M.pens?(M.penScore?(meH?M.penScore:[M.penScore[1],M.penScore[0]]):true):null,won});
  R.best=Math.max(R.best,B.round+(won?1:0));if(B.round===3&&B.res.length&&!B.finalCounted){B.finalCounted=true;R.finals++}
  if(won&&B.round===3){R.cups++;R.runs++;R.streak++;R.bestStreak=Math.max(R.bestStreak,R.streak);B.stage='won';blitzStore(BLITZ_RUN,null)}
  else if(won){B.round++;blitzDraw();B.stage='cup';blitzRunSave()}
  else{R.runs++;R.streak=0;B.stage='out';blitzStore(BLITZ_RUN,null)}
  if(G.spx!=null)R.spx=G.spx;blitzStore(BLITZ_KEY,R);render();const m=$('main');if(m)m.scrollTop=0;if(B.stage==='won'){try{SFX.win()}catch(e){}confetti(4000);buzz('win')}}
/* ---- screens ---- */
function blitzFaceHTML(p,key){return `<span class="bz-face" style="${faceFrameStyle(p)}">${playerPortraitHTML(p,{c1:'#1a2231',c2:'#c6f24e'},key)}</span>`}
function blitzPitchHTML(){const B=BLITZ;const lay=slotLayout(B.form);return `<div class="bz-pitch" aria-label="ההרכב שנבחר">${B.slots.map((pos,i)=>{const p=B.picks[i];const L=lay[i]||{x:50,y:50};const cur=i===B.picks.length&&B.stage==='draft';
    return `<div class="bz-tok${p?' in':''}${cur?' cur':''}" style="left:${L.x}%;top:${L.y}%">${p?`${blitzFaceHTML(p,'bzp'+p.id)}<b class="num">${p.ovr}</b><small>${esc(p.last||p.first)}</small>`:`<span class="bz-face empty">${POSB[pos]}</span>`}</div>`}).join('')}</div>`}
function blitzBracketHTML(){const B=BLITZ;return `<ol class="bz-rounds">${BLITZ_ROUNDS.map((r,i)=>{const res=B.res.find(x=>x.r===i);const cur=i===B.round&&B.stage==='cup';return `<li class="${res?(res.won?'won':'lost'):cur?'cur':''}"><span>${r[1]}</span><b>${res?`${esc(res.opp)} <bdi dir="ltr">${res.gf}:${res.ga}</bdi>${res.pens?' (פנדלים)':''}`:cur&&B.opp?esc(B.opp.name):'—'}</b></li>`}).join('')}</ol>`}
function blitzView(){const B=BLITZ,R=blitzRec();
  if(B.stage==='lobby'){let saved=null;try{saved=JSON.parse(localStorage.getItem(BLITZ_RUN)||'null')}catch(e){}
    return `<div class="bz-hero"><h1>טורניר בזק</h1><p>בחר אחד משלושה שחקנים אמיתיים לכל עמדה, בנה אחת־עשרה בשתי דקות וצא לארבעה משחקי נוקאאוט. הפסד אחד והטורניר נגמר.</p></div>
    <div class="card"><div class="bz-stats"><div><b class="num">${R.cups}</b><small>גביעים</small></div><div><b class="num">${R.runs}</b><small>טורנירים</small></div><div><b class="num">${R.bestStreak}</b><small>שיא זכיות רצופות</small></div><div><b>${R.best<0?'—':R.best>=4?'זכייה':esc(BLITZ_ROUNDS[R.best][1])}</b><small>הכי רחוק</small></div></div></div>
    <div class="card"><h3 class="sec">בחר מערך</h3><div class="bz-forms">${Object.keys(FORMATIONS).map(f=>`<button type="button" class="bz-form" data-bz-form="${f}"><b dir="ltr">${f}</b><small>${FORMATIONS[f][1]} בהגנה · ${FORMATIONS[f][2]} בקישור · ${FORMATIONS[f][3]} בהתקפה</small></button>`).join('')}</div>
    ${saved&&Array.isArray(saved.picks)&&saved.picks.length?'<div class="actions" style="margin-top:10px"><button class="btn" data-bz="resume">המשך את הטורניר השמור</button></div>':''}</div>
    <div class="actions"><button class="btn sec" data-bz="exit">${B.career?'חזרה לקריירה':'חזרה'}</button></div>`}
  if(B.stage==='draft'){const n=B.picks.length,pos=B.slots[n];const clubs=new Set(B.picks.map(p=>p.from)),nats=new Set(B.picks.map(p=>p.nat));
    return `<div class="bz-top"><button class="btn sm sec" data-bz="quit">יציאה</button><div><h2>בחירה <bdi>${n+1}</bdi> מתוך <bdi>11</bdi></h2><div class="muted small">${POSHE[pos]} · דירוג ממוצע <bdi>${n?blitzRating(B.picks).toFixed(1):'—'}</bdi> · בונוס קישורים <bdi dir="ltr">+${blitzBonus(B.picks)}</bdi></div></div></div>
    <div class="bz-offer">${B.offer.map((x,i)=>{const p=x.p||{first:x.he,last:'',visualId:euroVisualId(x.club,x.r.en),id:900000+i,pos:x.pos};const link=clubs.has(x.club)?'אותו מועדון':(x.nat&&x.nat!=='זר'&&nats.has(x.nat))?'אותה נבחרת':'';
      return `<button type="button" class="bz-card" data-bz-pick="${i}"><span class="bz-ovr num">${x.ovr}</span>${blitzFaceHTML(p,'bzo'+n+'_'+i)}<b>${esc(x.he)}</b><small>${esc(x.club)}</small><small class="muted">${esc(x.nat||'')}${x.r&&x.r.age?` · בן <bdi>${x.r.age}</bdi>`:x.p?` · בן <bdi>${x.p.age}</bdi>`:''}</small>${link?`<span class="tag good">קישור · ${link}</span>`:'<span class="tag">בלי קישור</span>'}</button>`}).join('')}</div>
    <div class="card"><div class="muted tiny" style="margin-bottom:6px">שחקנים מאותו מועדון או מאותה מדינה משחקים טוב יותר יחד (עד <bdi dir="ltr">+3</bdi> לדירוג הקבוצה)</div>${blitzPitchHTML()}</div>`}
  const avg=blitzRating(B.picks),bonus=blitzBonus(B.picks);
  if(B.stage==='cup'){const o=B.opp;const os=Math.round(strength(o));
    return `<div class="bz-top"><button class="btn sm sec" data-bz="quit">יציאה</button><div><h2>${BLITZ_ROUNDS[B.round][1]}</h2><div class="muted small">הקבוצה שלך <bdi>${avg.toFixed(1)}</bdi> <bdi dir="ltr">+${bonus}</bdi> קישורים · היריבה <bdi>${os}</bdi></div></div></div>
    <div class="card bz-match"><div class="nx-vs"><div class="nx-t">${kitSVG(me(),'lg')}<b>${esc(me().short)}</b></div><div class="nx-mid"><span>נוקאאוט</span></div><div class="nx-t">${kitSVG(o,'lg')}<b>${esc(o.name)}</b></div></div><div class="nx-label">${esc(o.country||'')} · תיקו אחרי 90 דקות הולך לפנדלים</div>
    <div class="actions" style="margin-top:12px"><button class="btn big" data-bz="play">לשריקת הפתיחה</button></div></div>
    <div class="card">${blitzBracketHTML()}</div><div class="card"><h3 class="sec">האחת־עשרה שלך</h3>${blitzPitchHTML()}<div class="muted tiny" style="margin-top:8px">ספסל: ${B.bench.map(p=>`${esc(p.last||p.first)} <bdi>${p.ovr}</bdi>`).join(' · ')}</div></div>`}
  const won=B.stage==='won';const last=B.res[B.res.length-1];
  return `<div class="bz-hero ${won?'won':'out'}"><h1>${won?'הגביע שלך!':'הודחת'}</h1><p>${won?`ארבעה ניצחונות, אחת־עשרה שבחרת בעצמך. זו הזכייה ה־<bdi>${R.cups}</bdi> שלך${R.streak>1?`, <bdi>${R.streak}</bdi> ברצף`:''}.`:`${esc(BLITZ_ROUNDS[last?last.r:0][1])}: ${last?`${esc(last.opp)} <bdi dir="ltr">${last.gf}:${last.ga}</bdi>${last.pens?' בפנדלים':''}`:''}. דראפט חדש מתחיל מאפס.`}</p></div>
  <div class="card">${blitzBracketHTML()}</div>
  <div class="actions"><button class="btn big" data-bz="again">דראפט חדש</button><button class="btn sec" data-bz="exit" style="flex:0 0 auto">${B.career?'חזרה לקריירה':'חזרה'}</button></div>`}
function blitzRender(){$('top').classList.add('hide');$('nav').classList.add('hide');try{envelopeClose()}catch(e){}const m=$('main');m.innerHTML=`<div class="view blitz">${blitzView()}</div>`;
  m.onsubmit=m.oninput=m.onchange=m.onkeydown=null;
  m.onclick=e=>{const t=e.target;const f=t.closest('[data-bz-form]');if(f)return blitzStart(f.dataset.bzForm);const pk=t.closest('[data-bz-pick]');if(pk)return blitzPick(+pk.dataset.bzPick);const b=t.closest('[data-bz]');if(!b)return;const a=b.dataset.bz;
    if(a==='exit')return blitzExit();if(a==='play')return blitzPlay();if(a==='again'){BLITZ.stage='lobby';BLITZ.picks=[];BLITZ.res=[];BLITZ.finalCounted=false;return render()}
    if(a==='resume'){if(blitzResume())return render();blitzStore(BLITZ_RUN,null);toast('הטורניר השמור כבר לא זמין');return render()}
    if(a==='quit')return openModal(`<h3 class="sec">לצאת מהטורניר?</h3><p class="small">הטורניר נשמר במכשיר הזה. אפשר להמשיך אותו בפעם הבאה שתיכנס לטורניר בזק.</p><div class="actions"><button class="btn" id="bzLeave">צא</button><button class="btn sec" data-close>הישאר</button></div>`,ev=>{if(ev.target.closest('#bzLeave')){closeModal();blitzRunSave();blitzExit()}})}}
/* the entry on the home screen and on the club-selection screen */
function blitzEntryHTML(){const R=blitzRec();return `<div class="card bz-entry"><div><h3 class="sec">טורניר בזק</h3><div class="muted small">דראפט של שחקנים אמיתיים וארבעה משחקי נוקאאוט. כעשר דקות.${R.runs?` <bdi>${R.cups}</bdi> גביעים ב־<bdi>${R.runs}</bdi> טורנירים.`:''}</div></div><button class="btn" data-blitz-open>שחק</button></div>`}
