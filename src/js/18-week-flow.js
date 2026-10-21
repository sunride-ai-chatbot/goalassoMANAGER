/* ====================== WEEK FLOW ====================== */
function currentEvent(){return G.cal[G.wk]}
function cupNext(c,ev){if(G.cup.stage!==ev.s||!G.cup.alive.includes(G.me))return null;const d=G.cup.draw&&G.cup.draw.stage===ev.s?G.cup.draw.pairs.find(p=>p.includes(G.me)):null;if(d&&club(d[0])&&club(d[1]))return {kind:'cup',h:club(d[0]),a:club(d[1]),neutral:ev.s==='F',label:CUP_HE[ev.s]};return {kind:'cup',h:c,a:null,label:CUP_HE[ev.s]}}
function myNextMatch(){
  const ev=currentEvent();if(!ev)return null;const c=me();
  if(ev.t==='league'||(ev.t==='cup'&&!c.league&&G.lsched[G.wk])){if(!c.league){const lr=G.lsched[G.wk];const fx=lr?G.lfx[lr-1]:null;if(!fx)return ev.t==='cup'?null:null;const m=fx.find(([h,a])=>h===G.me||a===G.me);if(m)return {kind:'league',h:club(m[0]),a:club(m[1]),label:leumitRoundLabel(lr)+(lr>30?(c.group==='top'?' עליון':' תחתון'):'')};if(ev.t==='cup')return cupNext(c,ev);return null}
    const fx=G.fixtures[ev.n-1];if(!fx)return null;const m=fx.find(([h,a])=>h===G.me||a===G.me);return m?{kind:'league',h:club(m[0]),a:club(m[1]),label:`מחזור ${ev.n}${ev.n>26?(c.group==='top'?' · פלייאוף עליון':' · פלייאוף תחתון'):''}`}:null}
  if(ev.t==='cup')return cupNext(c,ev);
  if(ev.t==='euro'){const E=c.euro;if(E&&E.stage===ev.stage&&(ev.stage!=='LP'||ev.leg<=LP_MATCHES[E.comp])){const label=`${COMP_HE[E.comp]} · ${STAGE_HE[ev.stage]}${ev.stage==='LP'?` מחזור ${ev.leg}`:ev.leg?` משחק ${ev.leg}`:''}`;let opp=null,homeNow=true,neutral=false;
      if(ev.stage==='LP'){opp=E.lpOpps?club(E.lpOpps[ev.leg-1]):null;homeNow=ev.leg%2===1}else if(ev.stage==='F'){opp=E.tie?club(E.tie.opp):null;neutral=true}else if(E.tie&&!E.tie.final){opp=club(E.tie.opp);homeNow=ev.leg===1?E.tie.home1:!E.tie.home1}
      return opp?{kind:'euro',h:homeNow?c:opp,a:homeNow?opp:c,neutral,firstLeg:ev.leg===2&&E.tie&&E.tie.g1?E.tie.g1:null,label}:{kind:'euro',h:c,a:null,label}}
    if(['Q2','Q3','PO'].includes(ev.stage)){if(c.league&&G.toto&&!G.toto.winner){const tr=ev.stage==='Q2'?(ev.leg===1?1:2):ev.stage==='Q3'?(ev.leg===1?3:4):(ev.leg===1?'SF':'F');if(typeof tr==='number'){const lbl=`גביע הטוטו · בית ${totoGroupOf(c.id)} · מחזור ${tr}`;const sch=G.toto.sched&&G.toto.sched[tr];if(sch){if(G.toto.round>=tr)return null;const m=sch.find(p=>p.includes(c.id));return m?{kind:'toto',h:club(m[0]),a:club(m[1]),label:lbl}:null}return {kind:'toto',h:c,a:null,label:lbl}}if(tr==='SF'&&!G.toto.results.some(r=>r.r==='SF')){if(G.toto.semis){const m=G.toto.semis.find(p=>p.includes(c.id));return m?{kind:'toto',h:club(m[0]),a:club(m[1]),label:'גביע הטוטו · חצי הגמר'}:null}const a=totoStandings('A'),b=totoStandings('B');const inSF=[a[0],a[1],b[0],b[1]].some(x=>x&&x.id===c.id);return inSF?{kind:'toto',h:c,a:null,label:'גביע הטוטו · חצי הגמר'}:null}if(tr==='F'&&G.toto.finalists&&G.toto.finalists.includes(c.id)&&!G.toto.results.some(r=>r.r==='F')){const f=G.toto.finalists;return f.length>=2?{kind:'toto',h:club(f[0]),a:club(f[1]),neutral:true,label:'גביע הטוטו · הגמר'}:{kind:'toto',h:c,a:null,label:'גביע הטוטו · הגמר'}}return null}
      if(ev.leg===1){const fo=c.nextFriendly&&c.nextFriendly.wk===G.wk?club(c.nextFriendly.opp):null;return {kind:'friendly',h:c,a:fo||null,label:'משחק ידידות'}}}return null}
  return null;
}
function advanceWeek(){
  const ev=currentEvent();if(!ev)return null;
  ensureDraws();autoLineups();let my=null;
  if(ev.t==='league'){
    const fx=G.fixtures[ev.n-1];
    for(const [hid,aid] of fx){const h=club(hid),a=club(aid);const M=createMatch(h,a,{kind:'league',round:ev.n,label:`מחזור ${ev.n}`});if(hid===G.me||aid===G.me)my=M;else{runInstant(M);settle(M)}}
  }else if(ev.t==='cup')my=playCupWeek(ev.s);
  const lr=G.lsched&&G.lsched[G.wk];
  if(lr&&G.lfx[lr-1]){for(const [hid,aid] of G.lfx[lr-1]){const h=club(hid),a=club(aid);if(!h||!a)continue;const M=createMatch(h,a,{kind:'league',round:lr,leumit:true,label:leumitRoundLabel(lr)});if((hid===G.me||aid===G.me)&&!my)my=M;else{runInstant(M);settle(M)}}}
  else if(ev.t==='euro')my=playEuroWeek(ev);
  else if(ev.t==='break')intlBreak(ev);
  G.live=my||null;
  if(my)my.live=true;
  if(!my)finishWeek();
  return my;
}
function afterMyMatch(M){if(!M||M.settled)return;M.settled=true;settle(M);G.live=null;try{localStorage.removeItem('ilm2_livefl')}catch(e){}finishWeek()}
function finishWeek(){
  const ev=currentEvent();
  if(ev.t==='cup')finishCupStage();
  if(ev.t==='league'&&ev.n===26)buildPlayoff();
  if(G.lsched&&G.lsched[G.wk]===30&&!G.lsplit)buildLeumitPlayoff();
  if(G.lsched&&G.lsched[G.wk]===37){const lst=standingsOf('leumit');G.lchampion=lst[0].id;news(`${lst[0].name} אלופת הליגה הלאומית!`)}
  if(ev.t==='league'&&ev.n===36){G.champion=standingsOf('top')[0].id;news(`${club(G.champion).name} היא אלופת המדינה לעונת ${seasonLabel()}!`);if(G.champion===G.me){G.celebrate='אלופת המדינה!';recordMoment('champ','ליגת העל')}}
  if(me().campShield>0)me().campShield--;
  weeklyEconomy();weeklyDevelopment();try{loansOutWeekly()}catch(e){console.warn('loans',e)}weeklyM2();weeklyStaff();weeklySquadLife();try{storyTick();challengesTick()}catch(e){console.warn('story',e)}weeklyProjects();weeklyTransfersAI();weeklyOffers();fansDecay();scoutTick();processNegotiationsWeekly();payablesWeekly();checkPromises();midSeasonBoard(ev);maybeJobOffer(ev);if(G.jobOffer&&G.wk-G.jobOffer.wk>=2){G.jobOffer=null;news('הצעת העבודה פגה.')}
  if(ev.t==='league'&&ev.n%4===0){potm();const pos=myPos();G.board.conf=clamp(G.board.conf+(pos<=G.board.expectRank?2:pos<=G.board.expectRank+1?0:-2),0,100)}
  const fired=G.wk>14&&G.board.conf<fireThreshold()&&G.phase==='play';
  G.wk++;
  if(fired){fireManager();return}
  if(G.wk>=G.cal.length)endSeason();else ensureDraws();
  save();cloudAutoTick();
}
function intlBreak(ev){
  for(const c of G.clubs){for(const p of c.players){if(p.inj)continue;const called=(!p.foreign&&p.ovr>=71)||(p.foreign&&p.ovr>=69);if(called&&Math.random()<.06){setInjury(p,ri(1,3));if(c.id===G.me)news(`${fullName(p)} חזר פצוע מהפגרת הנבחרת: ${p.injT} (${p.inj} שבועות).`)}}}
  news(`פגרת נבחרות (${ev.m}). השחקנים נחים ומתאמנים.`);
  ntBreak(ev.m);
}
function addLog(what,amt){G.log.unshift({wk:G.wk,s:G.season,what,amt});G.log=G.log.slice(0,80)}
/* Single source of truth for the fixed weekly cash flow. Rows marked club:true apply to every club in weeklyEconomy;
   the rest (manager, bank, naming, staff, ads) are paid elsewhere and only appear in the finance view (full:true). */
function weeklyBreakdown(c,full){
  const rows=[];const R=(label,amt,club)=>{if(amt)rows.push({label,amt,club:!!club})};
  const wages=c.players.reduce((t,p)=>t+p.wage,0)+(c.youth||[]).reduce((t,p)=>t+Math.round(p.wage*.3),0);
  const tv=c.tier===4?55000:180000+(c.tier===1?80000:c.tier===2?30000:0);
  const sp=c.sponsor?Math.round(c.sponsor.annual/46):0;
  const support=c.tier===4?120000:c.tier===3?40000:0;
  const maint=Math.round(c.cap*(c.tier===4?1:3));const ops=c.tier===1?480000:c.tier===2?260000:c.tier===3?150000:70000;
  const merch=Math.round((c.fans??50)*(c.tier===1?1600:c.tier===2?900:c.tier===3?500:220));
  R('שכר שחקנים',-wages,true);R('זכויות שידור',tv,true);if(sp)R(`ספונסר ${c.sponsor.name}`,sp,true);R('תמיכת בעלים ועירייה',support,true);
  R('תחזוקת אצטדיון',-maint,true);R('תפעול המועדון (צוות, נסיעות, נוער)',-ops,true);R('חנות המועדון ומנויים',merch,true);
  if(full&&c.id===G.me){
    R('שכר המנג\'ר',-(G.manager&&G.manager.wage||0));
    if(G.staff)for(const r in G.staff){const st=G.staff[r];if(st&&!st.base&&st.wage)R(`שכר ${STAFF_ROLES[r].he}`,-st.wage)}
    if(G.bank&&G.bank.left>0)R('החזר הלוואה',-G.bank.weekly);
    if(c.naming)R('זכויות שם האצטדיון',Math.round(c.naming.annual/46));
    for(const a of (c.ads||[]))if(a.left>0)R(`פרסום ${a.brand}`,a.weekly);
  }
  return rows;
}
function weeklyNet(c){return weeklyBreakdown(c,true).reduce((t,r)=>t+r.amt,0)}
function weeklyEconomy(){
  for(const c of [...G.clubs,...G.leumit]){
    if(!c.sponsor&&c.id!==G.me){try{c.sponsor=sponsorOffers(c)[0]}catch(e){}}
    const rows=weeklyBreakdown(c).filter(r=>r.club);
    for(const r of rows)c.money+=r.amt;
    if(c.id===G.me){if(c.money<0){G.board.conf=clamp(G.board.conf-1,0,100);if(!G.debtWarned){G.debtWarned=true;news('הקופה במינוס. ההנהלה דורשת לאזן את התקציב.')}}else G.debtWarned=false;c.money-=G.manager.wage;G.manager.bank+=G.manager.wage;for(const r of rows)addLog(r.label,r.amt);addLog('שכר המנג\'ר',-G.manager.wage)}
  }
  bankWeekly();namingWeekly();
}
function devMult(c){return 1+.25*((c.training||1)-1)}
function weeklyDevelopment(){
  for(const c of [...G.clubs,...G.leumit]){
    const dm=devMult(c);const {focus}=trainCfg(c);c._fx=c.id===G.me?applyTrainingWeek(c):null;
    recoverWeekly(c);
    for(const p of c.players){
      if(p.inj){p.inj-=((c._fx?c._fx.n('rec')>0:focus==='rec')&&Math.random()<.35)?2:1;if(p.inj<0)p.inj=0}
      if(p.age<=24&&p.ovr<p.pot&&Math.random()<.07*dm*devFactor(c,p)*(c.id===G.me&&p.pos==='GK'?1+.15*staffD('gk'):1)*(c.id===G.me?devPlanMult(c,p):1))p.ovr++;
      else if(p.age>=31&&Math.random()<(p.age>=34?.07:.035))p.ovr--;
      finalize(p);
    }
    for(const y of c.youth){if(y.ovr<y.pot&&Math.random()<(.11*(c.academy||1)*.6+.04*dm)*(c._fx?c._fx.youth:focus==='youth'?1.6:1)*(c.id===G.me?1+.12*staffD('youth'):1))y.ovr++;finalize(y)}
    trainingInjuries(c);moraleWeekly(c);delete c._fx;
  }
}
function weeklyProjects(){
  for(const c of G.clubs){if(!c.build)continue;c.build.weeks--;
    if(c.build.weeks<=0){if(c.build.type==='stadium'){c.cap+=c.build.add;if(c.id===G.me){news(`הרחבת ${c.stadium} הושלמה: הקיבולת עכשיו ${c.cap.toLocaleString('he')} מקומות.`);paper('מועדון',`${c.stadium} החדש: ${c.cap.toLocaleString('he')} מקומות`,'העבודות הסתיימו והיציעים נפתחו',`היציע החדש ייחנך במשחק הבית הקרוב. ${pick(['המועדון מצפה לקהל שיא.','מחירי המנויים לא ישתנו, לפי ההנהלה.'])}`)}}
      else if(c.build.type==='training'){c.training=c.build.level;if(c.id===G.me)news(`מגרש האימונים שודרג לרמה ${c.training}.`)}
      c.build=null}}
}
