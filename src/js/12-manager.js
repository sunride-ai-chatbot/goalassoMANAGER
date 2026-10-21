/* ====================== MANAGER LAYER: personalities, player talks, press conferences, board, job offers, team talks ====================== */
const PERS={
 professional:{he:'מקצוען',icon:'🎯',desc:'יציב, לא מתרגש מכלום. עובד קשה גם כשהוא על הספסל.'},
 ambitious:{he:'שאפתן',icon:'🚀',desc:'רוצה לשחק באירופה ובמועדון גדול. מאבד סבלנות בלי הישגים.'},
 loyal:{he:'נאמן',icon:'🛡️',desc:'קשור למועדון ולאוהדים. קשה להוציא אותו ודורש פחות.'},
 mercenary:{he:'שכיר חרב',icon:'💰',desc:'הכסף מדבר. יבוא לכל מקום שישלם, ויעזוב כשישלמו יותר.'},
 temperamental:{he:'חם מזג',icon:'🔥',desc:'מורל שמתנדנד, מגיב קשה לביקורת, אבל יכול להדליק את הקבוצה.'},
 leader:{he:'מנהיג',icon:'🧭',desc:'מחזיק את חדר ההלבשה. קפטן טבעי שמרים את כולם.'},
};
function assignPers(p){if(p.pers)return p;const h=(p.id*40503+ (p.age||25)*7)>>>0;const r=h%100;
  p.pers=r<28?'professional':r<46?'ambitious':r<60?'loyal':r<74?'mercenary':r<90?'temperamental':'leader';
  if(p.pers==='leader'&&(p.age||25)<26)p.pers='professional';if(p.pers==='loyal'&&p.foreign&&Math.random()<.5)p.pers='professional';return p}
function persMoraleMult(p){return p.pers==='temperamental'?1.5:p.pers==='professional'?.6:1}
function persWageMult(p){return p.pers==='mercenary'?1.2:p.pers==='loyal'?.9:p.pers==='ambitious'?1.08:1}
const OWNERS={investor:{he:'משקיע',desc:'מזרים כסף כשמבקשים, אבל מצפה לתוצאות מיד.',inject:1.6,fire:14},
 patient:{he:'סבלני',desc:'נותן זמן לבנות. לא יזרים הון, אבל גם לא ימהר לפטר.',inject:.9,fire:8},
 impatient:{he:'חסר סבלנות',desc:'שלושה הפסדים והוא כבר מחפש מחליף.',inject:1.1,fire:18},
 frugal:{he:'חסכן',desc:'כל שקל נספר. תקציב קטן, יעדים צנועים.',inject:.5,fire:11}};
function ownerOf(c){if(!c.owner){const h=[...c.id].reduce((t,ch)=>t+ch.charCodeAt(0),0);c.owner=['investor','patient','impatient','frugal'][h%4]}return OWNERS[c.owner]}
function fireThreshold(){return ownerOf(me()).fire}

/* ---- manager trust & promises ---- */
function trust(){return G.manager.trust??60}
function addTrust(d){G.manager.trust=clamp(trust()+d,10,100)}
function checkPromises(){const c=me();for(const p of c.players){if(!p.promise)continue;p.promise.left--;
  const started=c.lineup&&c.lineup.includes(p.id);if(started)p.promise.starts++;
  if(p.promise.left<=0){const ok=p.promise.starts>=p.promise.need;if(ok){p.morale=clamp(p.morale+6,10,100);addTrust(3);news(`${fullName(p)}: ההבטחה לדקות משחק קוימה, המורל עלה.`)}else{p.morale=clamp(p.morale-14*persMoraleMult(p),10,100);addTrust(-6);news(`${fullName(p)} מרגיש שהבטחת לו דקות ולא קיימת. האמון בך נפגע.`);if(p.pers==='temperamental')paper('מועדון',`${fullName(p)} זועם: "הבטיחו לי ולא קיימו"`,'השחקן תוקף את המנג\'ר בראיון',`בסביבת ${fullName(p)} אומרים שהוא מרגיש מרומה אחרי שהובטחו לו דקות משחק. במועדון מנסים להרגיע.`)}p.promise=null}}}

/* ---- player talks ---- */
const TALKS=[
 {id:'promise',t:'"אתה חשוב לי. תקבל דקות בשבועות הקרובים."',hint:'מרים מורל מיד, אבל אם לא ישחק 3 מתוך 6 המשחקים הבאים, הוא יפגע והאמון בך יירד.'},
 {id:'reassure',t:'"תירגע, העבודה באימונים תדבר."',hint:'שיחה שקטה. מקצוענים אוהבים, חמי מזג פחות.'},
 {id:'push',t:'"אני מצפה ממך להרבה יותר."',hint:'ביקורת. עלולה להדליק שחקן שנרדם או לפוצץ חם מזג.'},
 {id:'list',t:'"אתה ברשימת ההעברות. נמצא לך מועדון."',hint:'הצעות יגיעו מהר יותר. המורל יורד אבל הוא מפסיק להתלונן.'},
 {id:'unlist',t:'"הורדתי אותך מרשימת ההעברות. אני סומך עליך."',hint:'מחזיר שחקן לסגל ברוח טובה.'},
];
function talkOptions(p){return TALKS.filter(t=>t.id==='unlist'?p.listed:t.id==='list'?!p.listed:true)}
function doTalk(pid,kind){const c=me();const p=c.players.find(x=>x.id===pid);if(!p)return;if(p.talkWk!=null&&p.talkS===G.season&&G.wk-p.talkWk<3)return toast('דיברת איתו לאחרונה. תן לזה לשקוע.');
  p.talkWk=G.wk;p.talkS=G.season;const tr=trust();let msg='';const m=persMoraleMult(p);
  if(kind==='promise'){const d=Math.round((8+(tr-60)/8)*(p.pers==='ambitious'||p.pers==='mercenary'?1.3:1));p.morale=clamp(p.morale+d,10,100);p.promise={left:6,need:3,starts:0};p.unhappy=false;msg=p.pers==='temperamental'&&tr<50?'"שמעתי את זה כבר. נראה."':'"זה מה שרציתי לשמוע."'}
  else if(kind==='reassure'){const d=p.pers==='professional'?8:p.pers==='temperamental'?-3:4;p.morale=clamp(p.morale+d,10,100);msg=d>0?'"בסדר, אני ממשיך לעבוד."':'"קל להגיד כשלא אתה על הספסל."'}
  else if(kind==='push'){if(p.pers==='temperamental'){p.morale=clamp(p.morale-8,10,100);msg='"אתה לא יודע מה אתה מדבר!"';if(Math.random()<.35)paper('מועדון',`עימות בין ${G.manager.name} ל${fullName(p)}`,'צעקות באימון, השחקן עזב את המגרש מוקדם',`לפי עדויות, השיחה בין המנג'ר לשחקן התלהטה. ${pick(['בהנהלה דורשים להרגיע את הרוחות.','הסוכן של השחקן כבר בדק אפשרויות.','חברים לקבוצה ניסו להפריד.'])}`)}
    else if(p.pers==='professional'){p.morale=clamp(p.morale+2,10,100);p.form=clamp(p.form+.6,-4,4);msg='"צודק. אני אתקן."'}
    else{p.morale=clamp(p.morale-3,10,100);p.form=clamp(p.form+.4,-4,4);msg='"אני אוכיח לך."'}}
  else if(kind==='list'){p.listed=true;p.unhappy=false;p.morale=clamp(p.morale-(p.pers==='loyal'?10:4),10,100);msg=p.pers==='loyal'?'"אחרי כל מה שנתתי למועדון..."':'"לפחות עכשיו אני יודע איפה אני עומד."'}
  else if(kind==='unlist'){p.listed=false;p.morale=clamp(p.morale+6,10,100);msg='"תודה על האמון."'}
  if(p.pers==='leader'&&kind!=='push'){c.players.forEach(x=>{if(x!==p)x.morale=clamp(x.morale+1,10,100)})}
  closeModal();toast(`${p.last||p.first}: ${msg}`);save();render()}
function talkModal(pid){const c=me();const p=c.players.find(x=>x.id===pid);if(!p)return;const P=PERS[p.pers||'professional'];
  openModal(`<h3 class="sec">שיחה עם ${esc(fullName(p))}</h3><div class="small muted" style="margin:4px 0 8px">${P.icon} ${P.he}: ${esc(P.desc)} · מורל ${moraleWord(p.morale)} (${Math.round(p.morale)}) · האמון שלך בחדר ההלבשה: ${trust()}/100</div>
  <div class="list">${talkOptions(p).map(t=>`<button class="pl" style="display:block;text-align:right;cursor:pointer" data-talk="${t.id}"><b>${esc(t.t)}</b><div class="muted tiny" style="margin-top:3px">${esc(t.hint)}</div></button>`).join('')}</div>
  <div class="actions" style="margin-top:10px"><button class="btn sec" data-close>לא עכשיו</button></div>`,e=>{const b=e.target.closest('[data-talk]');if(b)doTalk(pid,b.dataset.talk)})}

/* ---- press conferences ---- */
const REPORTERS=['יואב רוזנברג, "הספורט היומי"','מירב שחר, רדיו 99 ספורט','אבי דנינו, ערוץ הכדורגל','נועה בר-לב, אתר הדרבי','שמעון אוחיון, "זמן כדורגל"'];
function pressMode(){return G.pressMode||'big'}
function isBigMatch(M){const h=club(M.h),a=club(M.a);const opp=h.id===G.me?a:h;const ev=currentEvent()||{};
  return isDerby(h.id,a.id)||M.ctx.kind==='euro'||(M.ctx.kind==='toto'&&M.ctx.stage==='F')||(M.ctx.kind==='cup'&&['QF','SF','F'].includes(M.ctx.stage))||opp.tier===1||(ev.t==='league'&&ev.n>=30)||G.board.conf<30}
function teamMorale(d,filter){me().players.forEach(p=>{if(!filter||filter(p))p.morale=clamp(p.morale+d*persMoraleMult(p),10,100)})}
function pressQuestionsPre(M){
  const c=me();const h=club(M.h),a=club(M.a);const opp=h.id===G.me?a:h;const qs=[];const derby=derbyLabel(h.id,a.id);const stronger=strength(c)>strength(opp)+3;
  const quote=(t)=>()=>paper('מסיבת עיתונאים',`${G.manager.name}: "${t}"`,`לקראת ${M.ctx.label} מול ${opp.short}`,`המנג'ר של ${c.name} דיבר עם העיתונאים לפני המשחק. ${pick(['האווירה במועדון טובה.','השאלות עסקו בעיקר בהרכב.','העיתונאים ניסו להוציא ממנו הצהרה.'])}`);
  if(derby)qs.push({q:`${derby} מחר. איך מתמודדים עם הלחץ?`,a:[
    {t:'האוהדים ראויים לניצחון. נילחם על כל כדור.',fx:()=>{teamMorale(2);me().fans=clamp(me().fans+2,10,100);quote('האוהדים ראויים לניצחון')()},r:'האוהדים אהבו. הקבוצה נדלקה.'},
    {t:'זה עוד משחק של שלוש נקודות.',fx:()=>{me().fans=clamp(me().fans-1,10,100);quote('זה עוד משחק')()},r:'האוהדים הרימו גבה.'},
    {t:`הלחץ כולו על ${opp.short}. אנחנו משוחררים.`,fx:()=>{teamMorale(1);G.nextBoost={team:opp.id,v:.5};quote('הלחץ כולו על '+opp.short)()},r:`${opp.short} תלו את הציטוט על קיר חדר ההלבשה.`}]});
  qs.push({q:`${opp.name} ${stronger?'נחשבת לאאוטסיידרית מולכם':'מגיעה כפייבוריטית'}. מה הציפיות?`,a:[
    {t:'באנו לנצח. אין תוצאה אחרת.',fx:()=>{teamMorale(stronger?1:2);if(!stronger)G.nextBoost={team:opp.id,v:.4};quote('באנו לנצח')()},r:stronger?'ציפייה טבעית.':'הצהרה נועזת. היריבה שמעה.'},
    {t:'נכבד את היריבה ונעשה את שלנו.',fx:()=>{teamMorale(1);quote('נכבד את היריבה')()},r:'תשובה מקצועית.'},
    {t:`${opp.short} הפייבוריטית, אין לנו מה להפסיד.`,fx:()=>{if(stronger){teamMorale(-2);G.board.conf=clamp(G.board.conf-1,0,100)}else teamMorale(1);quote(opp.short+' הפייבוריטית')()},r:stronger?'ההנהלה לא אהבה את הצניעות המזויפת.':'הלחץ ירד מהשחקנים.'}]});
  const un=c.players.find(p=>p.unhappy);if(un)qs.push({q:`מדווחים ש${fullName(un)} לא מרוצה ומבקש לעזוב. מה המצב?`,a:[
    {t:'הוא חשוב לנו והדלת שלי פתוחה.',fx:()=>{un.morale=clamp(un.morale+6,10,100);quote(fullName(un)+' חשוב לנו')()},r:`${un.last||un.first} שמע והעריך.`},
    {t:'מי שלא רוצה להיות פה, שילך.',fx:()=>{un.morale=clamp(un.morale-8,10,100);G.board.conf=clamp(G.board.conf+1,0,100);teamMorale(-1,p=>p.pers==='temperamental');teamMorale(1,p=>p.pers==='professional');quote('מי שלא רוצה להיות פה, שילך')()},r:'ההנהלה אהבה את הסמכותיות. חדר ההלבשה חלוק.'},
    {t:'אני לא מתייחס לשמועות.',fx:()=>{quote('לא מתייחס לשמועות')()},r:'השאלה נותרה באוויר.'}]});
  const lastOffer=(G.offers||[])[0];if(lastOffer){const p=c.players.find(x=>x.id===lastOffer.pid);const from=club(lastOffer.from);if(p&&from)qs.push({q:`${from.name} מתעניינת ב${fullName(p)}. הוא למכירה?`,a:[
    {t:'הוא לא למכירה. נקודה.',fx:()=>{p.morale=clamp(p.morale+4,10,100);if(lastOffer.fee>p.value*1.4)G.board.conf=clamp(G.board.conf-1,0,100);quote(fullName(p)+' לא למכירה')()},r:'השחקן מרוצה. ההנהלה פחות, אם ההצעה טובה.'},
    {t:'לכל שחקן יש מחיר.',fx:()=>{p.morale=clamp(p.morale-4,10,100);lastOffer.fee=Math.round(lastOffer.fee*1.05/1e5)*1e5;quote('לכל שחקן יש מחיר')()},r:'השחקן נפגע קצת, הקונה הבין שיש סיכוי.'},
    {t:'נשקול רק הצעות רציניות.',fx:()=>{quote('רק הצעות רציניות')()},r:'תשובה דיפלומטית.'}]})}
  if(G.board.conf<35)qs.push({q:'הכיסא שלך רועד. אתה מרגיש את זה?',a:[
    {t:'אני מתמקד בעבודה.',fx:()=>{quote('מתמקד בעבודה')()},r:'תשובה שקטה.'},
    {t:'יש לי גיבוי מלא מההנהלה.',fx:()=>{G.board.conf=clamp(G.board.conf-3,0,100);quote('יש לי גיבוי מלא')()},r:'בהנהלה לא אהבו שמדברים בשמם.'},
    {t:'אני לוקח אחריות מלאה על התוצאות.',fx:()=>{G.board.conf=clamp(G.board.conf+2,0,100);teamMorale(1);quote('לוקח אחריות מלאה')()},r:'ההנהלה והשחקנים העריכו.'}]});
  const young=c.players.filter(p=>p.age<=20&&!c.lineup.includes(p.id)&&!p.inj).sort(byOvr)[0];if(young&&Math.random()<.5)qs.push({q:`${fullName(young)} (${young.age}) מרשים באימונים. יקבל הזדמנות?`,a:[
    {t:'הוא ישחק מחר.',fx:()=>{young.morale=clamp(young.morale+8,10,100);young.promise={left:1,need:1,starts:0};quote(fullName(young)+' ישחק מחר')()},r:'הבטחה פומבית. עכשיו תקיים אותה.'},
    {t:'בזמן הנכון. הוא בדרך.',fx:()=>{young.morale=clamp(young.morale+2,10,100);quote('בזמן הנכון')()},r:'סבלנות.'},
    {t:'הוא עדיין לא מוכן.',fx:()=>{young.morale=clamp(young.morale-5,10,100);quote(fullName(young)+' לא מוכן')()},r:'הצעיר קרא את זה בעיתון.'}]});
  return qs;
}
function pressQuestionsPost(M){
  const c=me();const h=club(M.h),a=club(M.a);const mineHome=h.id===G.me;const opp=mineHome?a:h;const gf=mineHome?M.gh:M.ga,ga=mineHome?M.ga:M.gh;const qs=[];
  const quote=(t)=>()=>paper('מסיבת עיתונאים',`${G.manager.name}: "${t}"`,`אחרי ${h.short} ${M.gh}:${M.ga} ${a.short}`,`המנג'ר של ${c.name} במסיבת העיתונאים שאחרי המשחק. ${pick(['האולם היה מלא.','השאלות היו קשות.','הוא ענה בקצרה.'])}`);
  const motm=M.motm&&M.motm.team===G.me?c.players.find(p=>p.id===M.motm.pid):null;const red=M.ev.find(e=>e.t==='red'&&e.team===G.me);
  if(gf>ga&&gf-ga>=2)qs.push({q:'ניצחון מרשים. מה הסוד?',a:[
    {t:'השחקנים. הכל בזכותם.',fx:()=>{teamMorale(3);quote('הכל בזכות השחקנים')()},r:'חדר ההלבשה שמח.'},
    {t:'התוכנית הטקטית עבדה בדיוק כמו שתכננתי.',fx:()=>{G.board.conf=clamp(G.board.conf+1,0,100);teamMorale(-1,p=>p.pers==='leader'||p.pers==='temperamental');quote('התוכנית עבדה')()},r:'ההנהלה התרשמה. כמה שחקנים הרימו גבה.'},
    {t:'רק שלוש נקודות. לא מתרגשים.',fx:()=>{teamMorale(1);me().fans=clamp(me().fans-1,10,100);quote('לא מתרגשים')()},r:'רגליים על הקרקע.'}]});
  if(gf<ga)qs.push({q:'מה השתבש הערב?',a:[
    {t:'אני אחראי. זה עליי.',fx:()=>{G.board.conf=clamp(G.board.conf+1,0,100);teamMorale(2);quote('זה עליי')()},r:'השחקנים העריכו שלקחת את זה על עצמך.'},
    {t:'השחקנים לא נתנו הכל.',fx:()=>{teamMorale(-4);me().fans=clamp(me().fans+1,10,100);quote('השחקנים לא נתנו הכל')()},r:'חדר ההלבשה רתח. האוהדים הסכימו.'},
    {t:'השופט גנב לנו את המשחק.',fx:()=>{me().fans=clamp(me().fans+2,10,100);G.board.conf=clamp(G.board.conf-1,0,100);if(Math.random()<.35){me().money-=20000;addLog('קנס מההתאחדות על התבטאות',-20000);news('קיבלת קנס של ₪20K על ביקורת על השופט.')}quote('השופט גנב לנו את המשחק')()},r:'האוהדים מחאו כפיים. ההתאחדות פחות.'}]});
  if(motm)qs.push({q:`${fullName(motm)} היה מצוין הערב.`,a:[
    {t:'כוכב, אבל הקבוצה מעל הכל.',fx:()=>{motm.morale=clamp(motm.morale+3,10,100);teamMorale(1);quote(fullName(motm)+' כוכב, אבל הקבוצה מעל הכל')()},r:'איזון נכון.'},
    {t:'הוא השחקן הטוב בליגה.',fx:()=>{motm.morale=clamp(motm.morale+6,10,100);teamMorale(-1,p=>p!==motm&&p.pos===motm.pos);motm.hype=(motm.hype||0)+1;quote(fullName(motm)+' הטוב בליגה')()},r:'הוא ירצה חוזה חדש. המתחרים לעמדה קינאו.'},
    {t:'הוא עשה את העבודה שלו.',fx:()=>{motm.morale=clamp(motm.morale-2*persMoraleMult(motm),10,100);quote('עשה את העבודה')()},r:'קצת קר.'}]});
  if(red)qs.push({q:`ההרחקה של ${red.name} הכריעה?`,a:[
    {t:'הוא יודע שטעה, סגרנו את זה בפנים.',fx:()=>{quote('סגרנו את זה בפנים')()},r:'מקצועי.'},
    {t:'זו הייתה הרחקה מופרכת.',fx:()=>{me().fans=clamp(me().fans+1,10,100);const p=c.players.find(x=>x.id===red.pid);if(p)p.morale=clamp(p.morale+3,10,100);quote('הרחקה מופרכת')()},r:'השחקן הודה לך. השופטים רשמו.'},
    {t:'הוא פגע בקבוצה. יהיה קנס.',fx:()=>{const p=c.players.find(x=>x.id===red.pid);if(p){p.morale=clamp(p.morale-6*persMoraleMult(p),10,100);me().money+=15000}teamMorale(1,p=>p.pers==='professional');quote('יהיה קנס')()},r:'משמעת. חם המזג זעם.'}]});
  if(gf>ga&&(M.ctx.kind==='euro'||isDerby(h.id,a.id)))qs.push({q:'ערב גדול למועדון!',a:[
    {t:'זה בשביל האוהדים.',fx:()=>{me().fans=clamp(me().fans+3,10,100);quote('זה בשביל האוהדים')()},r:'הקהל שר את שמך.'},
    {t:'אנחנו רק בהתחלה.',fx:()=>{teamMorale(2);quote('רק בהתחלה')()},r:'הקבוצה רעבה.'},
    {t:'תראו מה קורה כשמאמינים בנו.',fx:()=>{G.board.conf=clamp(G.board.conf+1,0,100);quote('כשמאמינים בנו')()},r:'עקיצה קטנה להנהלה.'}]});
  if(gf<ga&&mineHome&&opp.tier===3&&c.tier<=2)qs.push({q:'האוהדים שרקו בסיום. יש לך מסר אליהם?',a:[
    {t:'אני מבין אותם. נתקן.',fx:()=>{me().fans=clamp(me().fans+2,10,100);quote('מבין אותם, נתקן')()},r:'כבוד הדדי.'},
    {t:'הם צריכים לתמוך, לא לשרוק.',fx:()=>{me().fans=clamp(me().fans-4,10,100);quote('צריכים לתמוך, לא לשרוק')()},r:'הפורומים בוערים.'},
    {t:'שרקו? לא שמתי לב.',fx:()=>{me().fans=clamp(me().fans-1,10,100);quote('לא שמתי לב')()},r:'ציניות לא עובדת פה.'}]});
  return qs;
}
function runPress(kind,M,done){
  const mode=pressMode();if(mode==='off'||M.ctx.kind==='friendly')return done();
  const big=isBigMatch(M);if(mode==='big'&&!big&&Math.random()>.3)return done();
  const qs=shuffle(kind==='pre'?pressQuestionsPre(M):pressQuestionsPost(M)).slice(0,big?2:1);if(!qs.length)return done();
  let i=0;const d=openModal('',e=>{const b=e.target.closest('[data-ans]');if(b){const q=qs[i];const ans=q.a[+b.dataset.ans];ans.fx();d.querySelector('.card').innerHTML=`<div class="press"><span class="tag info">${kind==='pre'?'מסיבת עיתונאים · לפני המשחק':'מסיבת עיתונאים · אחרי המשחק'}</span><div class="press-q">${esc(q.q)}</div><div class="press-you">"${esc(ans.t)}"</div><div class="small" style="margin-top:8px;color:var(--accent)">${esc(ans.r)}</div><div class="actions" style="margin-top:12px"><button class="btn" id="pressNext">${i<qs.length-1?'השאלה הבאה':'סיום'}</button></div></div>`;save();return}
    if(e.target.closest('#pressNext')){i++;if(i>=qs.length){closeModal();done()}else draw()}});d.dataset.lock='1';
  function draw(){const q=qs[i];d.querySelector('.card').innerHTML=`<div class="press"><div class="row between"><span class="tag info">${kind==='pre'?'מסיבת עיתונאים · לפני המשחק':'מסיבת עיתונאים · אחרי המשחק'}</span><span class="muted tiny">${i+1}/${qs.length}</span></div><div class="muted tiny" style="margin-top:8px">${esc(pick(REPORTERS))}:</div><div class="press-q">${esc(q.q)}</div><div class="list" style="margin-top:10px">${q.a.map((a,k)=>`<button class="pl" style="display:block;text-align:right;cursor:pointer" data-ans="${k}"><b>"${esc(a.t)}"</b></button>`).join('')}</div></div>`}
  draw();
}

/* ---- half-time team talk ---- */
function halfTimeTalk(M,tick){const h=club(M.h),a=club(M.a);const mineHome=h.id===G.me;const gf=mineHome?M.gh:M.ga,ga=mineHome?M.ga:M.gh;
  const box=document.createElement('div');box.className='tt';box.innerHTML=`<div class="muted tiny">שיחת מחצית בחדר ההלבשה:</div><div class="row wrap" style="gap:6px;margin-top:4px"><button class="btn sm sec" data-ht="praise">כל הכבוד, תמשיכו ככה</button><button class="btn sm sec" data-ht="angry">אני מצפה להרבה יותר!</button><button class="btn sm sec" data-ht="calm">תירגעו, תשחקו את המשחק שלכם</button></div>`;
  tick.appendChild(box);tick.scrollTop=tick.scrollHeight;
  box.onclick=e=>{const b=e.target.closest("[data-ht]");if(!b)return;e.stopPropagation();if(M.halfTalk)return;const k=b.dataset.ht;let v=0,txt='';const lead=gf-ga;const hot=me().players.filter(p=>me().lineup.includes(p.id)&&p.pers==='temperamental').length;
    if(k==='praise'){v=lead>0?.4:lead===0?.1:-.3;txt=lead>0?'השחקנים יצאו בביטחון.':lead===0?'שביעות רצון מוקדמת.':'הקבוצה יצאה רגועה מדי.'}
    else if(k==='angry'){if(lead<=0){const backfire=Math.random()<.2+hot*.08;v=backfire?-.4:.7;txt=backfire?'כמה שחקנים נסגרו. חדר ההלבשה שקט מדי.':'הקבוצה יצאה עם אש בעיניים!'}else{v=-.5;txt='השחקנים לא הבינו את הכעס.'}}
    else{v=.2+(M.ev.some(e=>e.m>=40&&e.m<=45&&e.t==='goal'&&e.team!==G.me)?.3:0);txt='הראש חזר למקום.'}
    M.boost=M.boost||{};M.boost[G.me]=(M.boost[G.me]||0)+v;M.halfTalk=k;save();box.innerHTML=`<div class="tiny" style="color:var(--accent)">${txt}</div>`;}
}

/* ---- board meeting & ultimatums ---- */
function boardMeetingOptions(){const c=me();const O=ownerOf(c);const base=Math.round(clamp(c.squadValue*.12,2e6,20e6)/1e5)*1e5;
  return [
   {id:'money',t:'"אני צריך תקציב העברות גדול יותר."',d:`הבעלים ${O.he} יזרים כ-${NIS(Math.round(base*O.inject/1e5)*1e5)}, אבל היעד יעלה בדרגה.`,fx:()=>{const inj=Math.round(base*O.inject/1e5)*1e5;c.money+=inj;addLog('הזרמת בעלים',inj);G.board.expectRank=Math.max(1,G.board.expectRank-(G.board.expectRank>6?3:1));G.board.expectText=expectTextFor(G.board.expectRank);return `הבעלים הזרים ${NIS(inj)}. היעד החדש: ${G.board.expectText}.`}},
   {id:'patience',t:'"זו עונת בנייה. תנו לי זמן."',d:'היעד יירד בדרגה ואמון ההנהלה יעלה, אבל 10% מהתקציב יוקפאו.',fx:()=>{const cut=Math.round(c.money*.1);c.money-=cut;addLog('הקפאת תקציב לפי בקשת המנג\'ר',-cut);G.board.expectRank=Math.min(12,G.board.expectRank+(G.board.expectRank<6?3:1));G.board.expectText=expectTextFor(G.board.expectRank);G.board.conf=clamp(G.board.conf+5,0,100);return `ההנהלה הסכימה. היעד החדש: ${G.board.expectText}.`}},
   {id:'infra',t:'"תשקיעו בתשתיות, לא בשחקנים."',d:'שדרוג חינם של מגרש האימונים או האקדמיה (הנמוך מביניהם).',fx:()=>{if((c.training||1)<=(c.academy||1)&&c.training<5){c.training++;return `מגרש האימונים שודרג לרמה ${c.training} על חשבון הבעלים.`}else if(c.academy<5){c.academy++;return `האקדמיה שודרגה לרמה ${c.academy} על חשבון הבעלים.`}c.money+=2e6;return 'הכל כבר ברמה המקסימלית, קיבלת ₪2M במקום.'}},
   {id:'none',t:'"אנחנו מסודרים. נעבוד עם מה שיש."',d:'ההנהלה מעריכה צניעות: אמון +3.',fx:()=>{G.board.conf=clamp(G.board.conf+3,0,100);return 'ההנהלה רשמה לעצמה שאתה איש של ביצועים.'}},
  ]}
function expectTextFor(r){return r<=1?'אליפות':r<=2?'אליפות או סגנות':r<=3?'אחד משלושת המקומות הראשונים':r<=6?'פלייאוף עליון':r<=9?'אמצע הטבלה בלי מאבקי הישארות':'הישארות בליגה'}
function viewBoard(){const c=me();const O=ownerOf(c);const opts=boardMeetingOptions();
  return `<div class="card hero"><h2 style="font-size:24px;color:var(--gold)">ישיבת תקציב · עונת ${seasonLabel()}</h2><div class="small" style="margin-top:6px">הבעלים: <b>${O.he}</b>. ${esc(O.desc)}</div>
  <dl class="kv" style="margin-top:10px"><dt>תקציב נוכחי</dt><dd class="num">${NIS(c.money)}</dd><dt>שכר שבועי</dt><dd class="num">${NIS(c.players.reduce((t,p)=>t+p.wage,0))}</dd><dt>יעד ההנהלה</dt><dd>${esc(G.board.expectText)}</dd><dt>אמון</dt><dd class="num">${G.board.conf}/100</dd><dt>סף פיטורים</dt><dd class="num">אמון מתחת ל-${O.fire}</dd></dl>
  <div class="small muted" style="margin-top:8px">מה אתה מבקש מההנהלה לעונה הקרובה? בחירה אחת.</div></div>
  <div class="list">${opts.map(o=>`<button class="pl" style="display:block;text-align:right;cursor:pointer" data-board="${o.id}"><b>${esc(o.t)}</b><div class="muted tiny" style="margin-top:3px">${esc(o.d)}</div></button>`).join('')}</div>`}
function chooseBoard(id){const o=boardMeetingOptions().find(x=>x.id===id);if(!o)return;const msg=o.fx();news(`ישיבת תקציב: ${msg}`);G.phase='play';G.view='home';toast(msg);save();render()}
function midSeasonBoard(ev){if(ev.t!=='league')return;const pos=myPos();const c=me();
  if(ev.n===13&&pos>G.board.expectRank+3&&!G.board.ultimatum){G.board.ultimatum=true;news(`ההנהלה: "אנחנו במקום ${pos} והיעד היה ${G.board.expectText}. עד מחזור 20 אנחנו רוצים לראות שיפור."`);paperMajor('מועדון',`ההנהלה של ${c.name} מציבה אולטימטום ל${G.manager.name}`,`"שיפור עד מחזור 20, או שנסיק מסקנות"`,`בישיבת הנהלה סוערת הוצגו הנתונים: מקום ${pos} בטבלה מול יעד של ${G.board.expectText}. ${pick(['הבעלים לא היה נוכח, אבל הודיע שהוא עוקב.','המנג\'ר ביקש סבלנות וקיבל שבעה מחזורים.'])}`)}
  if(ev.n===20&&G.board.ultimatum){if(pos>G.board.expectRank+3){G.board.conf=clamp(G.board.conf-15,0,100);news('האולטימטום לא עמד במבחן. אמון ההנהלה צנח.')}else{G.board.conf=clamp(G.board.conf+8,0,100);news('עמדת באולטימטום של ההנהלה. האמון חזר.')}G.board.ultimatum=false}
  if(ev.n===36&&pos<=G.board.expectRank){G.board.conf=clamp(G.board.conf+5,0,100)}}

/* ---- job offers mid-season ---- */
function jobLadderOK(x){const r=(G.manager&&G.manager.rep)||40;const p=x.prestige||14;return r>=70||(r>=56&&p>=4)||(r>=42&&p>=7)||p>=10}
function maybeJobOffer(ev){if(ev.t!=='league'||ev.n%4!==2||G.jobOffer)return;const c=me();const pos=myPos();
  if(G.board.conf<65||pos>G.board.expectRank)return;if(Math.random()>.18)return;
  ensureRep();const cands=(!c.league||c.div==='leumit')?G.clubs.filter(x=>x.league&&x.prestige>=10&&jobLadderOK(x)):G.clubs.filter(x=>x.id!==G.me&&x.league&&x.prestige<c.prestige&&jobLadderOK(x));if(!cands.length)return;const to=pick(cands);
  G.jobOffer={club:to.id,wage:Math.round(G.manager.wage*rnd(1.25,1.6)/1000)*1000,wk:G.wk};news(`${to.name} פנתה אליך עם הצעת עבודה: ${NIS(G.jobOffer.wage)} לשבוע.`);
  paper('מועדון',`${to.name} רוצה את ${G.manager.name}`,`ההנהלה של ${to.short} מחפשת מנג'ר אחרי תקופה חלשה`,`לפי הדיווח, ${to.name} מציעה חוזה משופר ל${G.manager.name}, שמוביל את ${c.name} לעונה מוצלחת. ${pick(['ב'+c.short+' עדיין לא הגיבו.','האוהדים של '+c.short+' מבקשים ממנו להישאר.','ההחלטה צפויה בימים הקרובים.'])}`)}
function jobOfferCard(){const o=G.jobOffer;if(!o)return '';const to=club(o.club);if(!to)return '';
  return `<div class="card hero"><div class="row between wrap"><h3 class="sec">הצעת עבודה מ${esc(to.name)}</h3><span class="tag info">תקפה 2 שבועות</span></div><div class="row" style="margin-top:8px">${kitSVG(to,'lg')}<div class="small">שכר <b class="num">${NIS(o.wage)}</b> לשבוע (היום ${NIS(G.manager.wage)}) · מקום ${to.prestige} ביוקרה · תקציב ${NIS(to.money)} · יעד צפוי: ${esc(expectTextFor(to.prestige<=1?1:to.prestige<=2?2:to.prestige<=4?3:to.prestige<=6?6:to.prestige<=9?9:12))}</div></div>
  <div class="actions" style="margin-top:10px"><button class="btn" data-job-accept>קבל ועבור ל${esc(to.short)}</button><button class="btn sec" data-job-decline>הישאר ב${esc(me().short)}</button></div></div>`}
function acceptJob(skip){const o=G.jobOffer;if(!o)return;if(!skip){const to0=club(o.club);return interviewModal(to0,ans=>{acceptJob(true);applyInterview(ans);save();render()})}const old=me();const to=club(o.club);G.jobOffer=null;
  paperMajor('מועדון',`${G.manager.name} עוזב את ${old.name} לטובת ${to.name}`,'מהפך באמצע העונה',`המנג'ר קיבל את ההצעה המשופרת. ב${old.short} זועמים על העיתוי. ${pick(['האוהדים קראו לו "בוגד".','ההנהלה איחלה הצלחה בשיניים חשוקות.'])}`,to.id,{type:'appoint',manager:G.manager.name,club:to.name,clubId:to.id,years:null,goal:null});
  old.fans=clamp(old.fans-5,10,100);G.manager.history.push({season:seasonLabel(),club:old.name,pos:myPos(),cup:false,left:true});
  G.me=to.id;G.manager.seasonsLeft=2;G.manager.wage=o.wage;G.board.conf=55;G.board.ultimatum=false;setContractTerms();if(!to.sponsor)to.sponsor=sponsorOffers(to)[0];to.lineup=null;ensureLineup(to);
  news(`${G.manager.name} מונה למנג'ר של ${to.name} באמצע העונה.`);G.view='home';autoLineups();save();render()}
function declineJob(){const o=G.jobOffer;if(!o)return;const to=club(o.club);G.jobOffer=null;me().fans=clamp(me().fans+2,10,100);G.board.conf=clamp(G.board.conf+3,0,100);addTrust(2);news(`דחית את ההצעה של ${to.short}. האוהדים וההנהלה העריכו את הנאמנות.`);save();render()}

