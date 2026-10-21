/* ====================== CUP ====================== */
function settleCup(M,h,a,rec){
  let winner;if(M.gh!==M.ga)winner=M.gh>M.ga?h:a;else{if(!M.pens)decidePens(M);rec.pens=M.pens;winner=M.pens==='h'?h:a}
  const loser=winner===h?a:h;
  G.cup.results.push({stage:G.cup.stage,h:h.id,a:a.id,gh:M.gh,ga:M.ga,pens:M.pens,w:winner.id});
  G.cup.next.push(winner.id);
  const prize={R16:3e5,QF:5e5,SF:1e6,F:3e6}[G.cup.stage];winner.money+=prize;if(winner.id===G.me)addLog('פרס גביע המדינה',prize);
  if(G.cup.stage==='F'){G.cupWinner=winner.id;news(`${winner.name} זכתה בגביע המדינה! (${M.gh}:${M.ga}${M.pens?' בפנדלים':''} מול ${loser.short})`)}
  else if(loser.id===G.me)news(`הודחנו מגביע המדינה ב${CUP_HE[G.cup.stage]} מול ${loser===h?a.short:h.short}.`);
}
function playCupWeek(stage){
  if(G.cup.stage!==stage||G.cup.alive.length<2)return null;
  const pairs=(G.cup.draw&&G.cup.draw.stage===stage&&G.cup.draw.pairs.length)?G.cup.draw.pairs:(()=>{const ids=shuffle(G.cup.alive);const out=[];for(let i=0;i+1<ids.length;i+=2)out.push([ids[i],ids[i+1]]);return out})();G.cup.next=[];let my=null;
  for(const [hid,aid] of pairs){
    const h=club(hid),a=club(aid);if(!h||!a)continue;const neutral=stage==='F';
    const ctx={kind:'cup',stage,neutral,label:CUP_HE[stage]};
    const M=createMatch(h,a,ctx);
    if(h.id===G.me||a.id===G.me){my=M}else{runInstant(M);settle(M)}
  }
  G.cup.pendingStage=stage;
  if(!my)finishCupStage();
  return my;
}
function finishCupStage(){
  if(!G.cup.pendingStage)return;
  G.cup.alive=G.cup.next;G.cup.next=[];
  G.cup.stage={R16:'QF',QF:'SF',SF:'F',F:'done'}[G.cup.pendingStage];G.cup.pendingStage=null;G.cup.draw=null;ensureCupDraw();
}

/* ====================== EUROPE ====================== */
const NEXT_STAGE={Q2:'Q3',Q3:'PO',PO:'LP',KOPO:'R16',R16:'QF',QF:'SF',SF:'F'};
function euroDropLadder(comp,stage){
  if(comp==='CL'){if(stage==='Q2')return['EL','Q3'];if(stage==='Q3')return['EL','PO'];if(stage==='PO')return['EL','LP']}
  if(comp==='EL'){if(stage==='Q3')return['ECL','PO'];if(stage==='PO')return['ECL','LP']}
  return null;
}
function euroClubsAt(ev){return G.clubs.filter(c=>c.euro&&c.euro.stage===ev.stage&&(ev.stage!=='LP'||ev.leg<=LP_MATCHES[c.euro.comp]))}
function playEuroWeek(ev){
  let my=null;const playing=euroClubsAt(ev);
  for(const c of playing){
    const E=c.euro;let M;
    if(ev.stage==='LP'){
      if(!E.lp)E.lp={P:0,W:0,D:0,L:0,GF:0,GA:0,pts:0};
      const opp=(E.lpOpps&&club(E.lpOpps[ev.leg-1]))||euroOpp(E.comp,'LP');const home=ev.leg%2===1;
      M=createMatch(home?c:opp,home?opp:c,{kind:'euro',comp:E.comp,stage:'LP',md:ev.leg,label:`${COMP_HE[E.comp]} · שלב הליגה, מחזור ${ev.leg}`});
    }else if(ev.stage==='F'){
      const opp=(E.tie&&E.tie.final&&club(E.tie.opp))||euroOpp(E.comp,'F',true);M=createMatch(c,opp,{kind:'euro',comp:E.comp,stage:'F',neutral:true,label:`${COMP_HE[E.comp]} · הגמר`});
    }else{
      if(ev.leg===1&&(!E.tie||E.tie.final)){E.tie={opp:euroOpp(E.comp,ev.stage).id,home1:Math.random()<.5,g1:null};}
      if(!E.tie)continue;
      const opp=club(E.tie.opp);const homeNow=ev.leg===1?E.tie.home1:!E.tie.home1;
      M=createMatch(homeNow?c:opp,homeNow?opp:c,{kind:'euro',comp:E.comp,stage:ev.stage,leg:ev.leg,label:`${COMP_HE[E.comp]} · ${STAGE_HE[ev.stage]}, משחק ${ev.leg===1?'ראשון':'שני'}`});
    }
    if(c.id===G.me){my=M}else{runInstant(M);settle(M)}
  }
  // Toto Cup for top-division clubs in the pre-season weeks; friendlies for Leumit clubs
  if(['Q2','Q3','PO'].includes(ev.stage)){
    const tr=ev.stage==='Q2'?(ev.leg===1?1:2):ev.stage==='Q3'?(ev.leg===1?3:4):(ev.leg===1?'SF':'F');
    const tm=playTotoWeek(tr,playing);if(tm&&!my)my=tm;
    if(ev.leg===1){for(const c of G.leumit){const opp=(c.nextFriendly&&c.nextFriendly.wk===G.wk&&club(c.nextFriendly.opp))||friendlyOpp(c);c.nextFriendly=null;const M=createMatch(c,opp,{kind:'friendly',label:'משחק ידידות (הכנה לעונה)'});if(c.id===G.me&&!my)my=M;else{runInstant(M);settle(M)}}}
  }
  return my;
}
function settleEuro(M,h,a,rec){
  const c=h.euro&&!h.pseudo?h:a;const E=c.euro;if(!E)return;const opp=c===h?a:h;const gf=c===h?M.gh:M.ga,ga=c===h?M.ga:M.gh;
  const P=PRIZE[E.comp];const stage=M.ctx.stage;
  if(stage==='LP'){
    E.lp.P++;E.lp.GF+=gf;E.lp.GA+=ga;if(gf>ga){E.lp.W++;E.lp.pts+=3;c.money+=P.win;E.prize+=P.win}else if(gf===ga){E.lp.D++;E.lp.pts++;c.money+=P.draw;E.prize+=P.draw}else E.lp.L++;
    if(c.id===G.me)addLog('פרס אופ"א על תוצאה',gf>ga?P.win:gf===ga?P.draw:0);
    if(E.lp.P>=LP_MATCHES[E.comp]){
      const pts=E.lp.pts;const hi=E.comp==='ECL'?12:16,lo=E.comp==='ECL'?7:9;
      if(pts>=hi){E.stage='R16';c.money+=P.R16;E.prize+=P.R16;news(`${c.name} סיימה את שלב הליגה ב${COMP_HE[E.comp]} בשמונה הראשונות ועלתה ישירות לשמינית הגמר!`)}
      else if(pts>=lo){E.stage='KOPO';news(`${c.name} סיימה את שלב הליגה ב${COMP_HE[E.comp]} ותשחק בפלייאוף הנוקאאוט.`)}
      else{E.stage='out';E.history.push(`${COMP_HE[E.comp]}: הודחה בשלב הליגה`);news(`${c.name} סיימה את דרכה ב${COMP_HE[E.comp]} בשלב הליגה (${pts} נק').`)}
    }
    return;
  }
  if(stage==='F'){
    let won=gf>ga;if(gf===ga){if(!M.pens)decidePens(M);rec.pens=M.pens;won=M.pens==='h'}
    if(won){E.stage='W';c.money+=P.W;E.prize+=P.W;E.history.push(`${COMP_HE[E.comp]}: זכייה!`);news(`${c.name} זכתה ב${COMP_HE[E.comp]}!!!`)}
    else{E.stage='out';E.history.push(`${COMP_HE[E.comp]}: הפסד בגמר`);news(`${c.name} הפסידה בגמר ${COMP_HE[E.comp]} מול ${opp.short}.`)}
    return;
  }
  // two-legged tie
  if(M.ctx.leg===1){E.tie.g1=[gf,ga];return}
  const agg=[E.tie.g1[0]+gf,E.tie.g1[1]+ga];let won=agg[0]>agg[1];
  if(agg[0]===agg[1]){if(!M.pens)decidePens(M);rec.pens=M.pens;won=(c===h)===(M.pens==='h')}
  rec.agg=agg;E.tie=null;
  if(won){
    const nxt=NEXT_STAGE[stage];E.stage=nxt;
    if(nxt==='LP'){c.money+=P.LP;E.prize+=P.LP;if(c.id===G.me)addLog(`כסף השתתפות ${COMP_HE[E.comp]}`,P.LP);news(`${c.name} העפילה לשלב הליגה של ${COMP_HE[E.comp]} (${agg[0]}:${agg[1]} במצטבר)! מענק: ${NIS(P.LP)}`)}
    else{const pr=P[nxt]||0;c.money+=pr;E.prize+=pr;news(`${c.name} עלתה ל${STAGE_HE[nxt]} ב${COMP_HE[E.comp]} (${agg[0]}:${agg[1]} במצטבר).`)}
  }else{
    const pr=P[stage]||0;c.money+=pr;E.prize+=pr;
    const drop=euroDropLadder(E.comp,stage);
    if(drop){E.history.push(`${COMP_HE[E.comp]}: הודחה ב${STAGE_HE[stage]}`);E.comp=drop[0];E.stage=drop[1];if(drop[1]==='LP'){c.money+=PRIZE[drop[0]].LP;E.prize+=PRIZE[drop[0]].LP}
      news(`${c.name} הודחה ב${STAGE_HE[stage]} (${agg[0]}:${agg[1]}) ועוברת ל${COMP_HE[drop[0]]} (${STAGE_HE[drop[1]]}).`)}
    else{E.stage='out';E.history.push(`${COMP_HE[E.comp]}: הודחה ב${STAGE_HE[stage]}`);news(`${c.name} הודחה מ${COMP_HE[E.comp]} ב${STAGE_HE[stage]} (${agg[0]}:${agg[1]} במצטבר).`)}
  }
}

/* ====================== DRAWS: opponents are known in advance ====================== */
const TWO_LEG=new Set(['Q2','Q3','PO','KOPO','R16','QF','SF']);
const COUNTRY_OF=c=>c&&c.country&&c.country!=='ישראל'?c.country:'';
function ensureDraws(){try{ensureEuroTies();ensureCupDraw();ensureTotoDraw();ensureFriendlyDraw()}catch(e){console.warn('draws',e)}}
function ensureEuroTies(){
  for(const c of G.clubs){const E=c.euro;if(!E||!c.league)continue;
    if(TWO_LEG.has(E.stage)&&!E.tie){const opp=euroOpp(E.comp,E.stage);E.tie={opp:opp.id,home1:Math.random()<.5,g1:null};
      const where=E.tie.home1?'המשחק הראשון בבית':'המשחק הראשון בחוץ';
      news(`הגרלת ${STAGE_HE[E.stage]} ב${COMP_HE[E.comp]}: ${c.name} תפגוש את ${opp.name} (${opp.country}). ${where}.`);
      if(c.id===G.me)paper('הגרלה',`${c.name} תפגוש את ${opp.name} ב${STAGE_HE[E.stage]}`,`${COMP_HE[E.comp]} · ${opp.country} · ${where}`,`${opp.name} מ${opp.city} (${opp.country}) היא היריבה. כוח מוערך ${Math.round(strength(opp))} לעומת ${Math.round(strength(c))} של ${c.short}. ${pick(['במועדון מדברים על הגרלה סבירה.','היריבה לא פשוטה, אבל אפשרית.','המנג\'ר: "נכבד אותם, אבל לא נפחד".','האוהדים כבר בודקים טיסות.'])}`,c.id)}
    if(E.stage==='LP'&&!E.lpOpps){E.lpOpps=[];for(let i=0;i<LP_MATCHES[E.comp];i++)E.lpOpps.push(euroOpp(E.comp,'LP').id);
      const names=E.lpOpps.map((id,i)=>`${club(id).name} (${i%2===0?'בית':'חוץ'})`);
      news(`הגרלת שלב הליגה ב${COMP_HE[E.comp]}: היריבות של ${c.name}: ${names.join(', ')}.`);
      if(c.id===G.me)paper('הגרלה',`${c.name} הגרילה: ${E.lpOpps.slice(0,3).map(id=>club(id).short).join(', ')} ועוד`,`${COMP_HE[E.comp]} · שלב הליגה · ${E.lpOpps.length} משחקים`,`הלו"ז המלא: ${names.join(' · ')}. ${pick(['קיץ אירופי אמיתי.','הקופה כבר מריחה כסף.','ההנהלה מבטיחה אצטדיון מלא.'])}`,c.id)}
    if(E.stage==='F'&&!(E.tie&&E.tie.final)){const opp=euroOpp(E.comp,'F',true);E.tie={opp:opp.id,final:true,g1:null};news(`הגמר של ${COMP_HE[E.comp]}: ${c.name} מול ${opp.name}!`);if(c.id===G.me)paper('הגרלה',`${c.name} בגמר ${COMP_HE[E.comp]} מול ${opp.name}`,`מגרש ניטרלי`,`היריבה בגמר: ${opp.name} (${opp.country}), כוח ${Math.round(strength(opp))}. ${pick(['המדינה עוצרת נשימה.','כרטיסים אזלו תוך שעה.'])}`,c.id)}
  }
}
function ensureCupDraw(){const C=G.cup;if(!C||!C.stage||C.stage==='done'||!C.alive||C.alive.length<2)return;if(C.draw&&C.draw.stage===C.stage)return;
  const ids=shuffle(C.alive.slice());const pairs=[];for(let i=0;i+1<ids.length;i+=2)pairs.push([ids[i],ids[i+1]]);C.draw={stage:C.stage,pairs};
  const mine=pairs.find(p=>p.includes(G.me));const txt=pairs.map(([h,a])=>`${club(h).short} – ${club(a).short}`).join(' · ');
  news(`הגרלת ${CUP_HE[C.stage]}: ${txt}.`);
  if(mine){const home=mine[0]===G.me;const opp=club(home?mine[1]:mine[0]);const where=C.stage==='F'?'במגרש ניטרלי':home?'בבית':'בחוץ';paper('הגרלה',`${me().name} תפגוש את ${opp.name} ב${CUP_HE[C.stage]}`,`גביע המדינה · ${where}`,`ההגרלה המלאה: ${txt}. ${pick(['הגרלה נוחה יחסית.','זה לא יהיה קל.','מועדון שכבר הפתיע אותנו בעבר.','האוהדים רוצים את הגביע הזה.'])}`,G.me)}
}
function totoScheduleFor(ids){const rr=roundRobin([...ids,null]);return rr.map(r=>r.filter(([h,a])=>h!=null&&a!=null)).slice(0,4)}
function ensureTotoDraw(){const T=G.toto;if(!T||T.winner)return;
  if(!T.sched){T.sched={};const sa=totoScheduleFor(T.groups.A),sb=totoScheduleFor(T.groups.B);for(let r=1;r<=4;r++)T.sched[r]=[...sa[r-1],...sb[r-1]]}
  if(T.round>=4&&!T.semis&&!T.results.some(r=>r.r==='SF')){const a=totoStandings('A'),b=totoStandings('B');if(a.length>=2&&b.length>=2){T.semis=[[a[0].id,b[1].id],[b[0].id,a[1].id]];T.finalists=T.finalists||[];news(`חצאי הגמר של גביע הטוטו: ${club(a[0].id).short} – ${club(b[1].id).short}, ${club(b[0].id).short} – ${club(a[1].id).short}.`)}}
}
function ensureFriendlyDraw(){const c=me();if(!c||c.league)return;const ev=G.cal&&G.cal[G.wk];if(!ev||ev.t!=='euro'||ev.leg!==1||!['Q2','Q3','PO'].includes(ev.stage))return;
  if(c.nextFriendly&&c.nextFriendly.wk===G.wk&&club(c.nextFriendly.opp))return;
  const opp=friendlyOpp(c);c.nextFriendly={wk:G.wk,opp:opp.id};news(`משחק ידידות נקבע: ${c.name} מול ${opp.name} (${opp.country}).`)}

