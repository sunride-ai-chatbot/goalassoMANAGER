/* ====================== TACTICS: press/width/tempo/style, player roles, matchups, 2D live pitch ====================== */
const TAC={press:{high:'פרסינג גבוה',mid:'לחץ בינוני',low:'בלוק נמוך'},width:{wide:'משחק רחב',normal:'רוחב רגיל',narrow:'צפוף במרכז'},tempo:{fast:'קצב גבוה',normal:'קצב רגיל',slow:'קצב איטי'},style:{possession:'החזקת כדור',balanced:'מאוזן',direct:'ישיר',counter:'התקפות מתפרצות'}};
const TAC_DESC={press:{high:'לוחצים גבוה: יותר כדורים גנובים ומצבים, אבל שוחק ומסוכן מול קבוצות עם מסירה טובה.',mid:'לחץ מאוזן.',low:'בלוק נמוך: קשה להבקיע לנו, אבל גם אנחנו יוצרים פחות. משתלב עם התפרצויות.'},width:{wide:'רוחב: מנצל אגפים מהירים, חושף את המרכז.',normal:'רוחב רגיל.',narrow:'צפיפות: סוגרים את המרכז, פחות הצלפות.'},tempo:{fast:'קצב גבוה: משחק פתוח לשני הכיוונים, שוחק.',normal:'קצב רגיל.',slow:'קצב איטי: שליטה, פחות מצבים לשני הצדדים.'},style:{possession:'החזקת כדור: צריך קישור איכותי. מנטרל התפרצויות של היריבה.',balanced:'ללא דגש.',direct:'ישיר: כדורים ארוכים לחלוץ מטרה, פחות החזקה.',counter:'התפרצויות: מחכים ומענישים, מעולה מול קבוצות שתוקפות.'}};
const ROLES={GK:{stop:'שוער קו',sweep:'שוער-מטאטא'},DF:{stopper:'בלם קשוח',ball:'בלם בונה',wingback:'מגן תוקף'},MF:{b2b:'בוקס-טו-בוקס',play:'פליימייקר',anchor:'עוגן הגנתי',winger:'כנף'},FW:{poach:'צייד שערים',target:'חלוץ מטרה',false9:'חלוץ מדומה'}};
const ROLE_DEF={GK:'stop',DF:'stopper',MF:'b2b',FW:'poach'};
const ROLE_NEED={sweep:[0,60],ball:[2,64],wingback:[0,66],play:[2,70],anchor:[4,66],winger:[0,68],target:[5,68],false9:[2,66],poach:[1,66],stopper:[4,62],b2b:[5,60],stop:[0,0]};
function roleOf(p){return p.roleT&&ROLES[p.pos]&&ROLES[p.pos][p.roleT]?p.roleT:ROLE_DEF[p.pos]}
function roleFit(p){const r=roleOf(p);const need=ROLE_NEED[r];if(!need||!need[1])return 0;const at=attrs(p);const v=at[need[0]];return clamp((v-need[1])/10,-.8,.6)}
function defaultTac(c){if(c.tac)return c.tac;const h=[...String(c.id)].reduce((t,ch)=>t+ch.charCodeAt(0),0);
  const t=c.tier===1?{press:'high',width:'wide',tempo:'fast',style:'possession'}:c.tier===2?{press:'mid',width:'normal',tempo:'normal',style:pick(['balanced','direct','possession'])}:{press:'low',width:'narrow',tempo:'slow',style:pick(['counter','direct','balanced'])};
  if(h%5===0)t.style='counter';if(h%7===0)t.press='mid';c.tac=t;return t}
function tacOf(c){return c.tac||defaultTac(c)}
function tacOfM(M,c){return (M&&M.tacOv&&M.tacOv[c.id])||tacOf(c)}
function avgAttr(M,c,pos,idx){const xs=xiPlayers(M,c).filter(x=>!pos||x.p.pos===pos);if(!xs.length)return 60;return xs.reduce((t,x)=>t+attrs(x.p)[idx],0)/xs.length}
function avgFit(M,c){const xs=xiPlayers(M,c);if(!xs.length)return 100;return xs.reduce((t,x)=>t+(x.p.fit??100),0)/xs.length}
/* returns {dh,da,poss,fatH,fatA,notes} = deltas to home/away expected goals per 90, possession shift, fatigue multipliers */
function tacticAdj(M,h,a){
  const th=tacOfM(M,h),ta=tacOfM(M,a);let dh=0,da=0,poss=0,fatH=1,fatA=1;const notes=[];
  const side=(c,o,t,to,isHome)=>{let own=0,opp=0,ps=0,fat=1;
    const mfPass=avgAttr(M,c,'MF',2),fwPace=avgAttr(M,c,'FW',0),fwPhys=avgAttr(M,c,'FW',5),dfDef=avgAttr(M,c,'DF',4),fit=avgFit(M,c);
    if(t.press==='high'){own+=.08;opp+=.03;fat*=1.3;if(to.style==='possession')own+=.06;if(to.style==='direct')own-=.03;if(fit<70){own-=.1;opp+=.06;if(isHome===(c.id===G.me))notes.push('הפרסינג נשבר: השחקנים עייפים מדי')}}
    if(t.press==='low'){opp-=.1;own-=.07;if(to.mentality==='att'||to.style==='possession')opp-=.03}
    if(t.width==='wide'){if(fwPace>=68)own+=.06;else own+=.01;opp+=.03}
    if(t.width==='narrow'){opp-=.04;own-=.03}
    if(t.tempo==='fast'){own+=.05;opp+=.04;fat*=1.15}
    if(t.tempo==='slow'){own-=.04;opp-=.04;ps+=.03;fat*=.9}
    if(t.style==='possession'){ps+=.08;if(mfPass>=68)own+=.05;else{own-=.04;opp+=.03}if(to.style==='counter')opp-=.04}
    if(t.style==='direct'){ps-=.06;if(fwPhys>=68)own+=.06;else own+=.01}
    if(t.style==='counter'){ps-=.05;if(to.mentality==='att'||to.press==='high')own+=.09;else own+=.01;if(fwPace>=68)own+=.03}
    if(dfDef>=70&&t.press==='low')opp-=.02;
    // roles
    for(const {p} of xiPlayers(M,c)){const r=roleOf(p);const f=roleFit(p)*.02+(p.roleM&&p.roleM===r?.015:0);if(r==='play')own+=.03+f;else if(r==='anchor')opp-=.03+f;else if(r==='target'){own+=(t.style==='direct'?.04:.01)+f}else if(r==='false9')own+=.02+f;else if(r==='winger'){own+=(t.width==='wide'?.03:.01)+f}else if(r==='wingback'){own+=.015+f;opp+=.01}else if(r==='ball'){ps+=.01;own+=f}else if(r==='sweep'){if(t.press==='high')opp-=.03;own+=f}else if(r==='poach')own+=f*.5;else own+=f*.5}
    return {own,opp,ps,fat}};
  const H=side(h,a,th,ta,true),A=side(a,h,ta,th,false);
  const pe=planEffect(M,h,a);if(pe){const T=pe.home?H:A;T.own+=pe.own;T.opp+=pe.opp;T.ps+=pe.ps;T.fat*=pe.fat}
  const so=staffOrg(M,h,a);H.own+=so.h;A.own+=so.a;
  dh=H.own+A.opp;da=A.own+H.opp;poss=H.ps-A.ps;fatH=H.fat;fatA=A.fat;
  return {dh,da,poss,fatH,fatA,notes};
}
function liveEnergy(M,c,p,e){const t=tacOf(c);const rate=(t&&t.press==='high'?1.25:t&&t.press==='low'?.85:1)*(t&&t.tempo==='fast'?1.1:1);const played=Math.max(0,M.m-(e?e.since:0));return Math.round(clamp((p.fit??100)-played*.16*rate-Math.max(0,played-60)*.35*rate,15,100))}
function liveMentality(M,c){return (M.liveMent&&M.liveMent[c.id])||c.mentality||'bal'}
function matchupText(c,o){const t=tacOf(c),to=tacOf(o);const tips=[];
  tips.push(`${o.short} משחקת ב${TAC.press[to.press]}, ${TAC.style[to.style]}, ${TAC.tempo[to.tempo]}.`);
  if(to.style==='possession')tips.push('מול החזקת כדור: פרסינג גבוה משתלם אם הקבוצה טרייה; אחרת בלוק נמוך והתפרצויות.');
  if(to.style==='counter')tips.push('הם מחכים להתפרצות: לא לתקוף בפזיזות. החזקת כדור ומנטליות מאוזנת מנטרלות אותם.');
  if(to.press==='high')tips.push('הם לוחצים גבוה: משחק ישיר לחלוץ מטרה עוקף את הלחץ, והם ייעפו במחצית השנייה.');
  if(to.press==='low')tips.push('הם נסגרים: צריך רוחב, כנפיים מהירות ופליימייקר שיפתח אותם. התפרצויות לא יעבדו.');
  if(to.width==='wide')tips.push('הם רחבים: צפיפות במרכז ומגנים תוקפים ינצלו את החללים מאחוריהם.');
  const bestO=o.players.slice().sort(byOvr)[0];if(bestO)tips.push(`השחקן המסוכן: ${fullName(bestO)} (${bestO.ovr}).`);
  return tips}

/* ---- 2D live pitch (SVG, horizontal) ---- */
