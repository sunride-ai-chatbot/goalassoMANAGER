/* ====================== SEASON END ====================== */
function endSeason(){
  const st=standingsOf('top');const champ=st[0],rel=st.slice(-2);const c=me();const pos=myPos();const inTop=!!c.league;
  const lst=standingsOf('leumit');const lchamp=lst[0];const promoted=lst.slice(0,2);const lrel=lst.slice(-2);
  const prize=i=>[12e6,8e6,6e6,4e6,3e6,2.5e6,2e6,2e6,1.8e6,1.8e6,1.6e6,1.6e6,1.2e6,1.2e6][i]||1e6;const lprize=i=>[1.5e6,1.2e6,.8e6,.6e6][i]||.4e6;
  st.forEach((x,i)=>x.money+=prize(i));lst.forEach((x,i)=>x.money+=lprize(i));addLog('פרס סיום עונה',inTop?prize(pos-1):lprize(pos-1));
  returnLoans();returnLoansOut();budgetControl();namingSeasonEnd();
  // sponsor bonuses
  for(const x of G.clubs){if(!x.sponsor)continue;let b=0;if(x.id===champ.id)b+=x.sponsor.bonusTitle;if(x.euro)b+=x.sponsor.bonusEuro;x.money+=b;if(x.id===G.me&&b)addLog('בונוס ספונסר',b);x.sponsor.years--;if(x.sponsor.years<=0)x.sponsor=null}
  // summary for me
  const met=pos<=G.board.expectRank;const bonus=met?G.manager.wage*12:0;G.manager.bank+=bonus;
  G.board.conf=clamp(G.board.conf+(met?15:pos<=G.board.expectRank+1?4:-8)+(G.cupWinner===G.me?8:0),0,100);
  G.manager.seasonsLeft--;
  const euroText=c.euro?(c.euro.history.length?c.euro.history.join(' · '):`${COMP_HE[c.euro.comp]}: ${STAGE_HE[c.euro.stage]}`):'לא שיחקה באירופה';
  G.summary={season:seasonLabel(),pos,div:inTop?'top':'leumit',champ:inTop?champ.name:lchamp.name,rel:(inTop?rel:lrel).map(x=>x.name),promoted:promoted.map(x=>x.name),cup:club(G.cupWinner)?.name||'—',toto:G.toto&&G.toto.winner?club(G.toto.winner).name:'—',met,bonus,euro:inTop?euroText:'ליגה לאומית',conf:G.board.conf,prize:inTop?prize(pos-1):lprize(pos-1),contractOver:G.manager.seasonsLeft<=0,up:!inTop&&promoted.some(x=>x.id===c.id),down:inTop&&rel.some(x=>x.id===c.id)};
  G.manager.history.push({season:seasonLabel(),club:c.name,pos,cup:G.cupWinner===G.me,div:inTop?'top':'leumit',champ:G.champion===G.me,toto:G.toto&&G.toto.winner===G.me,up:!inTop&&promoted.some(x=>x.id===c.id)});
  try{ensureRep();let dr=(G.board.expectRank-pos)*1.5;if(G.champion===G.me)dr+=8;if(G.cupWinner===G.me)dr+=5;if(G.toto&&G.toto.winner===G.me)dr+=3;if(!inTop&&promoted.some(x=>x.id===c.id))dr+=6;addRep(Math.round(clamp(dr,-10,15)),'סיכום עונה')}catch(e){}
  awardsStory();
  recordSeason({season:seasonLabel(),champ:champ.name,champId:champ.id,cup:club(G.cupWinner)?.name||'—',cupId:G.cupWinner,toto:G.toto&&G.toto.winner?club(G.toto.winner).name:null,totoId:G.toto&&G.toto.winner,lchamp:lchamp.name,lchampId:lchamp.id,topScorer:G.awards&&G.awards.top,poty:G.awards&&G.awards.poty&&G.awards.poty.name,myClub:c.name,myPos:pos,myDiv:inTop?'top':'leumit',relegated:rel.map(x=>x.name),promoted:promoted.map(x=>x.name)});
  if(!inTop&&promoted.some(x=>x.id===c.id)){paperMajor('ליגה',`${c.name} עולה לליגת העל!`,`סיום במקום ${pos} בליגה הלאומית`,`חגיגות גדולות ב${c.city}. ${pick(['המנג\'ר הובטח תקציב מוגדל לעונה הבאה.','האוהדים פלשו למגרש בשריקת הסיום.','הבעלים: "זה רק ההתחלה".'])}`);G.board.conf=clamp(G.board.conf+15,0,100)}
  paperMajor('ליגה',`${champ.name} אלופת המדינה ${seasonLabel()}`,`${club(G.cupWinner)?`גביע המדינה: ${club(G.cupWinner).name} · `:''}ירדו: ${rel.map(x=>x.short).join(', ')}`,`העונה הסתיימה. ${champ.name} סיימה במקום הראשון${st[1]?` לפני ${st[1].short}`:''}. ${c.id===champ.id?'חגיגות ענק בעיר!':`${c.name} סיימה במקום ${pos}.`}`,champ.id,{type:'champ',club:champ.name,clubId:champ.id,season:seasonLabel(),pts:champ.pts,second:st[1]?st[1].short:null});
  // next season Europe
  const euroNext={};const cupW=G.cupWinner&&club(G.cupWinner).league?G.cupWinner:null;
  euroNext[champ.id]=['CL','Q2'];
  if(cupW&&cupW!==champ.id)euroNext[cupW]=['EL','Q3'];else euroNext[st[1].id]=['EL','Q3'];
  let n=0;for(const x of st){if(euroNext[x.id])continue;euroNext[x.id]=['ECL','Q2'];if(++n>=2)break}
  // relegation / promotion between the two real divisions; Leumit bottom two replaced by Liga Alef clubs
  for(const r of rel){r.league=false;r.div='leumit';r.group=null;r.euro=null;if(!G.leumit.includes(r))G.leumit.push(r)}
  for(const x of lrel){G.leumit=G.leumit.filter(y=>y!==x);if(x.id===G.me){news(`${x.name} ירדה לליגה א'. ההנהלה נותנת לך עונה אחת לחזור.`);G.leumit.push(x)}}
  G.leumit=G.leumit.filter(x=>!promoted.includes(x));
  for(const p of promoted){p.league=true;p.div='top';p.group=null;p.money=Math.max(p.money||0,8e6);if(!G.clubs.includes(p))G.clubs.push(p)}
  G.clubs=G.clubs.filter(x=>x.league);
  while(G.leumit.length<16)G.leumit.push(alefClub());
  news(`סיכום עונת ${seasonLabel()}: אלופה ${champ.name}, זוכת הגביע ${club(G.cupWinner)?.short||'—'}, אלופת הלאומית ${lchamp.short}. ירדו: ${rel.map(x=>x.short).join(', ')}. עלו: ${promoted.map(x=>x.short).join(', ')}.`);
  // contracts: expiring players leave or renew
  G.freeAgents=(G.freeAgents||[]).filter(p=>p.age<34).slice(0,6);
  for(const x of [...G.clubs,...G.leumit]){
    for(const p of x.players.slice()){p.contract=(p.contract||1)-1;if(p.contract>0)continue;
      if(x.id===G.me){x.players=x.players.filter(q=>q!==p);if(p.age<34){G.freeAgents.push(p)}news(`${fullName(p)} סיים את החוזה ועזב את ${x.short} כשחקן חופשי.`)}
      else if(Math.random()<.75||x.players.length<=18){p.contract=ri(1,3);p.wage=playerWage(p)}
      else{x.players=x.players.filter(q=>q!==p);if(p.age<34)G.freeAgents.push(p)}}
    x.lineup=null;
  }
  for(let i=0;i<6;i++){const p=makePlayer(pick(['DF','MF','MF','FW','GK']),58);p.age=ri(26,33);p.contract=0;finalize(p);G.freeAgents.push(p)}
  // ageing & intake
  for(const x of [...G.clubs,...G.leumit]){
    x.players.forEach(p=>{if(p.apps>0){p.hist=p.hist||[];p.hist.unshift({s:seasonLabel(),club:x.short,apps:p.apps,mins:p.mins||0,g:p.goals,a:p.assists||0,cs:p.cs||0,sv:p.saves||0,motm:p.motm||0,r:p.rn?+(p.rsum/p.rn).toFixed(2):null});p.hist=p.hist.slice(0,12)}
      p.age++;p.yellow=0;p.goals=0;p.apps=0;p.form=0;p.inj=0;p.injT=null;p.susp=0;p.mins=0;p.shots=0;p.sot=0;p.assists=0;p.passes=0;p.saves=0;p.cs=0;p.xg=0;p.rsum=0;p.rn=0;p.motm=0;if((p.age>35&&Math.random()<.6)||p.retireAtEnd)p.retire=true});
    const retired=x.players.filter(p=>p.retire);if(x.id===G.me&&retired.length)news(`פרשו: ${retired.map(fullName).join(', ')}.`);
    x.players=x.players.filter(p=>!p.retire);x.youth.forEach(y=>y.age++);x.youth=x.youth.filter(y=>y.age<=20);
    while(x.youth.length<7){const y=makeYouth(1)[0];if(x.id===G.me&&staffD('youth')>0)y.pot=clamp(y.pot+staffD('youth')*2,40,92);x.youth.push(y)}
    while(x.players.filter(p=>p.pos==='GK').length<2)x.players.push(makePlayer('GK',x.tier===1?66:x.tier===4?54:60));
    while(x.players.length<20)x.players.push(makePlayer(pick(['DF','MF','FW']),x.tier===1?66:x.tier===2?62:x.tier===4?54:58));
    x.euro=euroNext[x.id]?{comp:euroNext[x.id][0],stage:euroNext[x.id][1],lp:null,tie:null,prize:0,history:[]}:null;
    if(x.id!==G.me&&!x.sponsor)x.sponsor=sponsorOffers(x)[0];
  }
  G.season++;G.pseudo={};G.offers=[];G.euroUsed={};G.negs=[];G.reports=[];G.board.ultimatum=false;G.jobOffer=null;G.nextBoost=null;G.campDone=false;
  for(const wc of worldClubs()){for(const p of wc.players){p.age++;p.contract=Math.max(1,(p.contract||2)-1);if(p.age<=24&&p.ovr<p.pot&&Math.random()<.6)p.ovr+=ri(1,3);else if(p.age>=31&&Math.random()<.5)p.ovr-=ri(1,2);delete p.rep;finalize(p)}wc.players=wc.players.filter(p=>p.age<36);while(wc.players.length<7)wc.players.push(makeWorldPlayer(wc.lg,WORLD_LEAGUES[wc.lg].clubs.find(d=>d[0]===wc.name)||[wc.name,wc.city,wc.c1,wc.c2,wc.str],pick(['young','mid','mid','vet']),wc.str))}
  computePrestige();startSeasonStructures();
  G.phase='seasonEnd';
}
function proceedAfterSummary(){
  const c=me();
  if(G.summary.contractOver){if(G.board.conf>=40){G.manager.seasonsLeft=2;G.manager.wage=Math.round(G.manager.wage*(1+(G.board.conf-50)/150)/1000)*1000;news(`ההנהלה האריכה את חוזה המנג'ר בשנתיים, שכר ${NIS(G.manager.wage)} לשבוע.`)}else{fireManager();return}}
  setContractTerms();
  G.phase=c.sponsor?'board':'sponsor';G.view='home';save();render();
}
function fireManager(){
  const c=me();try{addRep(-10)}catch(e){}news(`ההנהלה של ${c.name} החליטה להיפרד מהמנג'ר.`);paperMajor('מועדון',`${c.name} פיטרה את ${G.manager.name}`,'ההנהלה איבדה את האמון אחרי סדרת תוצאות גרועות',`ההחלטה התקבלה בישיבה סוערת. ${pick(['שמות של מחליפים כבר מתגלגלים.','האוהדים דרשו את הראש שלו כבר שבועות.','בהנהלה מודים שהציפיות היו גבוהות מדי.'])}`);
  const mine=c.prestige||7;let pool=shuffle(G.clubs.filter(x=>x.id!==G.me&&x.league&&(x.prestige||99)>=mine)).slice(0,3);if(pool.length<2)pool=shuffle(G.clubs.filter(x=>x.id!==G.me&&x.league)).slice(0,3);
  G.jobOffers=pool.map(x=>x.id);G.phase='fired';save();render();
}
function takeJob(id,skip){if(!skip){const to=club(id);return interviewModal(to,ans=>{takeJob(id,true);applyInterview(ans);save();render()})}const old=me();old.sponsor=old.sponsor||sponsorOffers(old)[0];G.me=id;G.manager.seasonsLeft=2;G.board.conf=50;setContractTerms();const c=me();if(!c.sponsor)c.sponsor=sponsorOffers(c)[0];news(`${G.manager.name} מונה למנג'ר של ${c.name}.`);paperMajor('מועדון',`${G.manager.name} הוא המנג'ר החדש של ${c.name}`,`חוזה לשתי עונות, יעד: ${G.board.expectText}`,`הוא נחת במועדון אחרי הפיטורים הקודמים ומבטיח ${pick(['כדורגל התקפי','יציבות','לתת הזדמנות לצעירים'])}. האוהדים מחכים לראות.`,c.id,{type:'appoint',manager:G.manager.name,club:c.name,clubId:c.id,years:2,goal:G.board.expectText||null});G.phase='play';G.view='home';autoLineups();save();render()}

