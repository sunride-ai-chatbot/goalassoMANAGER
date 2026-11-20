/* GOALASSO START — the envelope, the career book and the haggle.
   Like everything in this mode: a career changes from an event (a match that ended, a button), never while a screen is drawn; there is no
   clock, nothing that is lost for not coming back, and the only money is the game's own. */

/* ---------- the envelope ----------
   After about one competitive match in three (never two in a row, never more than four without, and the second match of a career always
   brings the first) something arrives that nobody asked for. It is one real thing in this career, applied when it arrives — a closed page
   loses nothing — and the envelope on the home page only reveals it. Six kinds are the full game's, fitted to this one; five are new here:
   a report on the next opponent, the owner's bonus for winning the next match, a reserve who asks for minutes (a promise the coach may
   give and then has to keep), a suspension or an injury cut short, and season-ticket holders who stay. */
const BENV_REP=.6;
const BenvSum=(pct,min)=>Math.max(min,Math.round(Bsum()*pct/10000)*10000);
function BenvNextOp(){const c=me();let pair=null;try{const x=Bextra();pair=x&&x.kind!=='pre'?x.pair:Bnext()}catch(e){}const id=pair&&pair.find(i=>i!==c.id);return id!=null?club(id):null}
const BenvKid=c=>c.players.filter(p=>p.age<=22&&p.ovr<(p.pot||99)&&!p.inj).sort((a,b)=>(b.pot||0)-(a.pot||0)||a.age-b.age)[0]||null;
const BenvAsker=c=>available(c).filter(p=>!c.lineup.includes(p.id)&&(p.bOut||0)>=2&&(p.morale??65)<62&&p.pos!=='GK').sort((a,b)=>b.ovr-a.ovr)[0]||null;
const BENV={
  cash:{w:3,make:()=>{const v=BenvSum(.02,100000);Bledger('תרומה של אוהד ותיק',v);return {from:'איש עסקים מהעיר',title:'תרומה לקופה',body:'אוהד ותיק עם עסק מצליח ראה את המשחק האחרון והחליט לעזור. בלי תנאים ובלי שלט על החולצה.',fx:['לקופה: '+Bmoney(v)]}}},
  mood:{w:3,ok:(b,c)=>c.players.some(p=>(p.morale??65)<80),make:(b,c)=>{for(const p of c.players)p.morale=clamp((p.morale??65)+4,10,100);return {from:'קפטן הקבוצה',title:'ערב גיבוש',body:'השחקנים ארגנו ארוחה משותפת אחרי המשחק. מי שהיה שם אומר שמזמן לא צחקו ככה בחדר ההלבשה.',fx:['מורל לכל הסגל: ‎+4']}}},
  board:{w:2,ok:b=>!!b.contract&&(b.board==null?55:b.board)<88,make:b=>{b.board=clamp((b.board==null?55:b.board)+5,0,100);return {from:'יושב הראש',title:'מילה טובה מלמעלה',body:'היו״ר שלח פתק קצר: ״רואים את העבודה שלך. תמשיך כך.״ זה לא קורה הרבה.',fx:['אמון ההנהלה: ‎+5']}}},
  rest:{w:3,ok:(b,c)=>BfitOn()&&c.players.filter(p=>BfitOf(p)<85).length>=3,make:(b,c)=>{for(const p of c.players)p.fit=clamp(Math.round((p.fit??100)+10),0,100);return {from:'המחלקה הרפואית',title:'יום התאוששות מלא',body:'הפיזיותרפיסטים פינו יום שלם לאמבטיות קרח, עיסויים ושינה. הרגליים ירגישו את זה.',fx:['כושר לכל הסגל: ‎+10']}}},
  talent:{w:2,ok:(b,c)=>!!BenvKid(c),make:(b,c)=>{const p=BenvKid(c),was=p.ovr;BtrainGain(p,BTRAIN_STEP);return {from:'מאמן הנוער',title:'קפיצה באימונים',body:`${fullName(p)} נשאר אחרי כל אימון החודש. מי שראה אותו אומר שזה כבר שחקן אחר.`,fx:[`${fullName(p)}: דירוג ${was} ← ${p.ovr}`]}}},
  fans:{w:2,make:b=>{b.boost=b.boost||{};b.boost.gate=(b.boost.gate||0)+1;return {from:'מערכת העיתון',title:'כתבה גדולה על המועדון',body:'כפולת עמודים במוסף הספורט, עם תמונה שלך בשער. בקופות כבר מרגישים את זה.',fx:['קהל במשחק הבית הבא: ‎+30%']}}},
  /* ---- new in this mode ---- */
  report:{w:3,ok:b=>!!BenvNextOp()&&!(b.boost&&b.boost.rep),make:b=>{const op=BenvNextOp();b.boost=b.boost||{};b.boost.rep=BENV_REP;return {from:'חבר ותיק מהמקצוע',title:'דו״ח על היריבה הבאה',body:`מאמן שעבד פעם ב${op.name} שלח לך שלושה עמודים: איך הם יוצאים מהגנה, מי מאבד כדורים ואיפה הם נפתחים. השחקנים כבר קיבלו עותק.`,fx:[`מול ${op.name}: ‎+${BENV_REP} לכוח הקבוצה`]}}},
  bonus:{w:3,ok:b=>!b.env.bet&&!!BenvNextOp(),make:b=>{const v=BenvSum(.03,150000),op=BenvNextOp();b.env.bet={v,op:op.name};return {from:'בעלי המועדון',title:'אתגר הבעלים',body:`״תביא לי ניצחון מול ${op.name}, ואני מכניס יד לכיס.״ הוא לא מבקש כלום אם זה לא יקרה.`,fx:['ניצחון במשחק הבא: '+Bmoney(v)]}}},
  promise:{w:3,ok:(b,c)=>!b.env.pr&&!!BenvAsker(c),make:(b,c)=>{const p=BenvAsker(c);return {from:fullName(p),title:'מבקש הזדמנות',body:`${fullName(p)} דפק על הדלת: ״המאמן, אני מתאמן הכי קשה שאני יכול. תן לי דקות במשחק הבא ואני אוכיח.״`,ask:{pid:p.id,name:fullName(p)},fx:['אם תבטיח ויקבל דקות: המורל שלו יזנק','אם תבטיח ולא תקיים: הוא ייפגע']}}},
  back:{w:3,ok:(b,c)=>c.players.some(p=>p.susp>0||p.inj>=2),make:(b,c)=>{const s=c.players.filter(p=>p.susp>0).sort((a,b)=>b.ovr-a.ovr)[0];
      if(s){s.susp=0;try{BensureXI(c)}catch(e){}return {from:'ועדת המשמעת',title:'הערעור התקבל',body:`המועדון ערער על ההרחקה של ${fullName(s)}, והוועדה קיבלה את הטענות. הוא כשיר כבר למשחק הבא.`,fx:[`${fullName(s)}: ההרחקה בוטלה`]}}
      const p=c.players.filter(p=>p.inj>=2).sort((a,b)=>b.ovr-a.ovr)[0];p.inj-=1;return {from:'רופא הקבוצה',title:'חוזר מוקדם מהצפוי',body:`הבדיקה של ${fullName(p)} יצאה טובה מהתחזית. הרופא מאשר לו לחזור משחק אחד מוקדם יותר.`,fx:[`${fullName(p)}: ${p.inj===1?'חוזר בעוד משחק אחד':'חוזר בעוד '+p.inj+' משחקים'}`]}}},
  members:{w:2,ok:(b,c)=>(c.baseDemand||c.cap*.75)<c.cap*.96,make:(b,c)=>{c.baseDemand=Math.min(c.cap,Math.round((c.baseDemand||c.cap*.75)*1.04));return {from:'מחלקת המנויים',title:'מנויים חדשים',body:'מבצע המנויים של אמצע העונה הצליח יותר מהצפוי. אלה אוהדים שיבואו לכל משחק בית, לא רק לגדולים.',fx:['קהל קבוע בכל משחק בית: ‎+4%']}}}};
/* a competitive match of the coach's club has ended: what was at stake is settled, and the match is counted */
function BenvSettle(M){const b=Bstate(),c=me();if(!b||b.daily||b.out||window.__noEnv||(M.bX&&M.bX.kind==='pre'))return;const e=b.env=b.env||{n:0,all:0};e.due=1;e.note=[];
  const home=M.h===c.id,gf=home?M.gh:M.ga,ga=home?M.ga:M.gh,won=gf>ga||(M.pens&&(M.pens==='h')===home);
  if(e.bet){if(won){Bledger('בונוס ניצחון מהבעלים',e.bet.v);e.note.push(`הבעלים עמדו במילה: ${Bmoney(e.bet.v)} נכנסו לקופה.`)}else e.note.push('האתגר של הבעלים לא הושג הפעם, והבונוס נשאר אצלם.');e.bet=null}
  if(e.pr){const p=c.players.find(x=>x.id===e.pr.pid),on=new Set([...((M.xi&&M.xi[c.id])||[]).map(x=>x.pid),...((M.used&&M.used[c.id])||[])]);
    if(p){if(on.has(p.id)){p.morale=clamp((p.morale??65)+12,10,100);e.note.push(`${fullName(p)} קיבל את הדקות שהובטחו לו, והמורל שלו זינק.`)}else if(!p.inj&&!p.susp){p.morale=clamp((p.morale??65)-10,10,100);e.note.push(`${fullName(p)} נשאר בחוץ למרות ההבטחה, והוא נפגע.`)}else e.note.push(`${fullName(p)} לא היה כשיר, וההבטחה נדחתה.`)}e.pr=null}}
/* …and now and then an envelope. Called once the round or the tie is closed, so "the next match" is the next one. */
function BenvTurn(){const b=Bstate(),c=me();if(!b||b.daily||b.out||window.__noEnv)return null;const e=b.env;if(!e||!e.due)return null;e.due=0;e.n=(e.n||0)+1;e.all=(e.all||0)+1;
  if(e.got&&!e.got.read)return null;const want=window.__envKind,first=!e.cnt&&e.all>=2;if(!(want||first||e.n>=4||(e.n>=2&&Math.random()<.42)))return null;
  const pool=Object.keys(BENV).filter(k=>want?k===want:(k!==e.prev&&(!BENV[k].ok||BENV[k].ok(b,c))));if(!pool.length)return null;
  let r=Math.random()*pool.reduce((s,k)=>s+BENV[k].w,0),k=pool[0];for(const x of pool){r-=BENV[x].w;if(r<=0){k=x;break}}
  const g=BENV[k].make(b,c);g.k=k;e.got=g;e.n=0;e.prev=k;e.cnt=(e.cnt||0)+1;return g}
function BenvAnswer(yes){const b=Bstate(),e=b&&b.env,g=e&&e.got;if(!g||!g.ask||g.ans)return false;const p=me().players.find(x=>x.id===g.ask.pid);g.ans=yes?'y':'n';
  if(p){if(yes)e.pr={pid:p.id,name:fullName(p)};else p.morale=clamp((p.morale??65)-3,10,100)}Bwrite();return true}
function BenvBannerHTML(){const b=Bstate(),e=b&&b.env;if(!e)return '';const g=e.got&&!e.got.read?e.got:null,L=[];
  for(const t of e.note||[])L.push(esc(t));if(e.bet)L.push(`אתגר הבעלים: ניצחון מול ${esc(e.bet.op)} שווה <b>${Bmoney(e.bet.v)}</b>.`);if(e.pr)L.push(`הבטחת ל${esc(e.pr.name)} דקות במשחק הבא.`);if(b.boost&&b.boost.rep)L.push(`דו״ח היריבה בידיים: <bdi>+${b.boost.rep}</bdi> לכוח במשחק הבא.`);
  return `${g?`<button type="button" class="benv-banner" data-env-open><span class="benv-ic" aria-hidden="true"><i></i></span><span><strong>הגיעה מעטפה</strong><small>מאת: ${esc(g.from)}</small></span><b>פתח</b></button>`:''}${L.length?`<ul class="benv-live">${L.map(t=>`<li>${t}</li>`).join('')}</ul>`:''}`}
function BenvOpen(){const b=Bstate(),g=b&&b.env&&b.env.got;if(!g||g.read)return;document.getElementById('envelope')?.remove();const root=document.createElement('div');root.id='envelope';root.className='env benv';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','מעטפה: '+g.from);
  const acts=()=>g.ask&&!g.ans?`<button type="button" class="bbtn" data-env-yes>מבטיח לו דקות</button><button type="button" class="bbtn secondary" data-env-no>לא עכשיו</button>`:`<button type="button" class="bbtn" data-env-ok>${g.ask?'סגור':'יפה'}</button>`;
  root.innerHTML=`<div class="env-box"><div class="env-from">הגיעה מעטפה</div><button type="button" class="env-seal" id="envSeal" aria-label="פתח את המעטפה"><span class="env-flap"></span><span class="env-wax">G</span><span class="env-to">${esc(g.from)}</span></button><div class="env-tap">הקש לפתיחה</div><div class="env-letter" id="envLetter" hidden><div class="env-who">${esc(g.from)}</div><h3>${esc(g.title)}</h3><p>${esc(g.body)}</p>${g.fx&&g.fx.length?`<ul class="env-fx">${g.fx.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:''}<p class="benv-said" id="envSaid" hidden></p><div class="actions benv-acts" id="envActs">${acts()}</div></div></div>`;
  document.body.appendChild(root);const open=()=>{root.classList.add('open');root.querySelector('#envLetter').hidden=false;try{buzz('open')}catch(e){}};
  root.onclick=ev=>{const t=ev.target;if(t.closest('#envSeal'))return open();
    if(t.closest('[data-env-yes]')||t.closest('[data-env-no]')){const yes=!!t.closest('[data-env-yes]');BenvAnswer(yes);const s=root.querySelector('#envSaid');s.hidden=false;s.textContent=yes?`הבטחת. ${g.ask.name} צריך לעלות למגרש במשחק הבא: בהרכב או כמחליף.`:`${g.ask.name} הנהן ויצא. הוא קצת מאוכזב.`;root.querySelector('#envActs').innerHTML=acts();return}
    if(t.closest('[data-env-ok]')){g.read=1;root.remove();Bwrite();Brender()}};
  let still=false;try{still=revealReduced()}catch(e){}if(still)open()}

/* ---------- the career book ----------
   The coach's panel had six numbers. The book is the whole road: what was won, the records, achievements with their way there, and every
   season. It counts from the day it opens (b.book); a career from before starts with what the game already knew — matches, wins and goals —
   and whatever it had already reached is entered as reached, without a prize: twenty achievements at once would be noise, not a reward. */
const BACH=[
  ['w1','ניצחון ראשון','נצח משחק רשמי',(b,k)=>[k.n.w,1],30],['w10','עשרה ניצחונות','',(b,k)=>[k.n.w,10],60],['w50','חמישים ניצחונות','',(b,k)=>[k.n.w,50],150],['w100','מאה ניצחונות','',(b,k)=>[k.n.w,100],300],
  ['g50','חמישים שערים','שערים של הקבוצות שלך',(b,k)=>[k.n.gf,50],60],['g200','מאתיים שערים','',(b,k)=>[k.n.gf,200],200],
  ['cs10','חומה','עשרה משחקים בלי לספוג',(b,k)=>[k.n.cs,10],80],
  ['run5','רצף ניצחונות','חמישה ניצחונות ברצף',(b,k)=>[(k.rec.run&&k.rec.run.v)||0,5],120],['unb10','בלתי מנוצחים','עשרה משחקים ברצף בלי הפסד',(b,k)=>[(k.rec.unb&&k.rec.unb.v)||0,10],150],
  ['big4','תבוסה','ניצחון בהפרש של ארבעה שערים',(b,k)=>[(k.rec.win&&k.rec.win.d)||0,4],80],['hero3','שלושער','שחקן שלך כובש שלושה במשחק אחד',(b,k)=>[(k.rec.hero&&k.rec.hero.v)||0,3],80],
  ['up1','הפתעה','נצח קבוצה חזקה ממך בבירור',(b,k)=>[k.n.up||0,1],60],['up5','קוטל ענקים','חמש הפתעות כאלה',(b,k)=>[k.n.up||0,5],150],
  ['riv1','יום של כבוד','נצח בדרבי או במשחק יריבות',(b,k)=>[k.n.riv||0,1],60],['cup1','לילה של גביע','נצח משחק גביע',(b,k)=>[k.n.cupw||0,1],40],['eu1','לילה אירופי','נצח משחק בליגת האלופות',(b,k)=>[k.n.eu||0,1],80],
  ['t1','תואר ראשון','אליפות או גביע',b=>[(b.honours||[]).length,1],300],['t3','ארון מתמלא','שלושה תארים',b=>[(b.honours||[]).length,3],600],
  ['s3','ותיק','שלוש עונות על הקווים',(b,k)=>[k.hist.length,3],120],['sign5','בונה סגל','חמש החתמות',b=>[(b.ct&&b.ct.signs)||0,5],60],['hag3','סוחר','שלוש קניות מתחת למחיר המבוקש',(b,k)=>[k.n.hag||0,3],80],
  ['tr30','מגרש האימונים','שלושים אימונים',b=>[(b.ct&&b.ct.train)||0,30],80],['st3','לא לבד','שלושה אנשי צוות',b=>[Object.values(b.staff||{}).filter(Boolean).length,3],80],['lv10','מאמן מנוסה','הגע לרמה 10',b=>[b.lvl||1,10],100]];
function BbookEnsure(){const b=Bstate();if(!b||b.daily)return null;if(b.book)return b.book;const ct=b.ct||{},old=(ct.played||0)>0;
  const k=b.book={n:{m:ct.played||0,w:ct.wins||0,d:0,l:0,gf:ct.goals||0,ga:0,cs:0},cur:{w:(b.st&&b.st.w)||0,u:0},rec:{},ach:{},fresh:[],hist:[]};
  if(old)for(const [id,,,fn] of BACH){const [v,t]=fn(b,k);if(v>=t)k.ach[id]=0}return k}
function BbookCheck(){const b=Bstate(),k=b&&b.book;if(!k||b.daily||window.__noBook)return [];const got=[];for(const [id,name,,fn,xp] of BACH){if(k.ach[id]!=null)continue;const [v,t]=fn(b,k);if(v>=t){k.ach[id]=b.season;k.fresh.push(id);got.push(name);try{BxpAdd(xp)}catch(e){}}}return got}
function BbookAfter(M){const k=BbookEnsure(),b=Bstate(),c=me();if(!k||(M.bX&&M.bX.kind==='pre'))return;const home=M.h===c.id,gf=home?M.gh:M.ga,ga=home?M.ga:M.gh,op=club(home?M.a:M.h),pk=M.pens?((M.pens==='h')===home?1:-1):0,w=gf>ga||pk>0,l=gf<ga||pk<0,n=k.n,R=k.rec,tag={s:b.season,op:op?op.name:''};
  n.m++;n.gf+=gf;n.ga+=ga;if(w)n.w++;else if(l)n.l++;else n.d++;if(!ga)n.cs++;k.cur.w=w?(k.cur.w||0)+1:0;k.cur.u=l?0:(k.cur.u||0)+1;
  if(w&&gf-ga>((R.win&&R.win.d)||0))R.win={d:gf-ga,gf,ga,...tag};if(gf>((R.goals&&R.goals.v)||0))R.goals={v:gf,ga,...tag};
  if(k.cur.w>((R.run&&R.run.v)||0))R.run={v:k.cur.w,s:b.season};if(k.cur.u>((R.unb&&R.unb.v)||0))R.unb={v:k.cur.u,s:b.season};
  const by={};for(const e of M.ev)if((e.t==='goal'||e.t==='pen')&&e.team===c.id&&e.pid)by[e.pid]=[(by[e.pid]?by[e.pid][0]:0)+1,e.name];
  for(const pid in by)if(by[pid][0]>=2&&by[pid][0]>((R.hero&&R.hero.v)||0))R.hero={v:by[pid][0],name:by[pid][1],...tag};
  if(w&&op){try{if(strength(op)-strength(c)>=5)n.up=(n.up||0)+1}catch(e){}try{if(isDerby(c,op))n.riv=(n.riv||0)+1}catch(e){}}
  if(w&&M.bCL!=null)n.eu=(n.eu||0)+1;if(w&&M.bX)n.cupw=(n.cupw||0)+1;BbookCheck()}
/* a season that is over, or a club that is left in the middle of one, is a line of the book */
function BbookSeason(){const k=BbookEnsure(),b=Bstate(),c=me();if(!k||!c||!c.P)return;if(k.hist.some(h=>h.s===b.season&&h.club===c.name))return;let place=0;try{place=Bstandings().findIndex(x=>x.id===c.id)+1}catch(e){}
  const row={s:b.season,club:c.name,lg:BleagueName(),place,of:b.league.length,pts:c.pts,w:c.W,d:c.D,l:c.L,gf:c.GF,ga:c.GA};if(b.round<b.schedule.length)row.part=1;k.hist.push(row);if(k.hist.length>40)k.hist.shift();
  if(!row.part){const R=k.rec;if(!R.pts||row.pts>R.pts.v)R.pts={v:row.pts,s:row.s,club:row.club};}BbookCheck()}
const BbookFresh=()=>{const b=Bstate();return (b&&b.book&&b.book.fresh.length)||0};
function BbookView(){const b=Bstate(),ct=b.ct||{},k=b.book||{n:{m:ct.played||0,w:ct.wins||0,d:0,l:0,gf:ct.goals||0,ga:0,cs:0},cur:{},rec:{},ach:{},fresh:[],hist:[]},n=k.n,R=k.rec,hon=b.honours||[];
  const cell=(v,t)=>`<div><b><bdi>${v}</bdi></b><small>${t}</small></div>`,rec=(t,v,sub)=>`<li><span>${t}</span><b><bdi>${v}</bdi></b>${sub?`<small>${sub}</small>`:''}</li>`,ses=s=>`עונה <bdi>${s}</bdi>`;
  const recs=[R.win&&rec('הניצחון הגדול ביותר',Math.max(R.win.gf,R.win.ga)+':'+Math.min(R.win.gf,R.win.ga),`מול ${esc(R.win.op)} · ${ses(R.win.s)}`),R.goals&&rec('הכי הרבה שערים במשחק',R.goals.v,`מול ${esc(R.goals.op)} · ${ses(R.goals.s)}`),R.hero&&rec('הכי הרבה שערים של שחקן במשחק',R.hero.v,`${esc(R.hero.name)} מול ${esc(R.hero.op)} · ${ses(R.hero.s)}`),R.run&&R.run.v>1&&rec('רצף הניצחונות הארוך',R.run.v,ses(R.run.s)),R.unb&&R.unb.v>1&&rec('הכי הרבה משחקים בלי הפסד',R.unb.v,ses(R.unb.s)),R.pts&&rec('הכי הרבה נקודות בעונה',R.pts.v,`${esc(R.pts.club)} · ${ses(R.pts.s)}`)].filter(Boolean);
  const done=BACH.filter(a=>k.ach[a[0]]!=null).length,ach=BACH.map(([id,name,text,fn,xp])=>{const [v,t]=fn(b,k),ok=k.ach[id]!=null,fresh=k.fresh.includes(id);return {ok,fresh,html:`<li class="bach${ok?' done':''}${fresh?' fresh':''}"><span class="bach-mark" aria-hidden="true">${ok?'✓':''}</span><span class="bach-body"><strong>${name}${fresh?' <em>חדש</em>':''}</strong>${text?`<small>${text}</small>`:''}${ok?'':`<span class="bach-bar"><i style="width:${Math.min(100,Math.round(v/t*100))}%"></i></span>`}</span><b class="bach-n">${ok?(k.ach[id]?ses(k.ach[id]):'הושג'):`<bdi>${Math.min(v,t)}/${t}</bdi>`}</b>${ok?'':`<small class="bach-xp"><bdi>+${xp}</bdi> XP</small>`}</li>`}}).sort((x,y)=>(y.fresh-x.fresh)||(x.ok-y.ok)).map(x=>x.html).join('');
  return `${Bheader('הדרך שלך','ספר הקריירה',`${esc(b.coach||'המאמן')} · רמה <bdi>${b.lvl||1}</bdi> · ${BxpTitle(b.lvl||1)}`)}
  <section class="bpanel bbook"><h2>הקריירה במספרים</h2><div class="acareer-grid bbook-grid">${cell(n.m,'משחקים')}${cell(n.w,'ניצחונות')}${cell(n.gf,'שערי זכות')}${cell(n.cs,'בלי ספיגה')}${cell(n.m?Math.round(n.w/n.m*100)+'%':'–','אחוז ניצחונות')}${cell(hon.length,'תארים')}</div></section>
  <section class="bpanel bbook"><h2>ארון הגביעים</h2>${hon.length?`<ul class="bbook-cab">${hon.slice().reverse().map(h=>`<li>${Bui('trophy')}<span><strong>${esc(h.what)}</strong><small>${esc(h.club||'')} · ${ses(h.season)}</small></span></li>`).join('')}</ul>`:'<p class="bmuted">הארון מחכה לגביע הראשון. אליפות, גביע או לילה אירופי גדול ייכנסו לכאן.</p>'}</section>
  <section class="bpanel bbook"><h2>שיאים</h2>${recs.length?`<ul class="bbook-rec">${recs.join('')}</ul>`:'<p class="bmuted">השיאים נרשמים ממשחק למשחק. המשחק הרשמי הבא פותח את הרשימה.</p>'}</section>
  <section class="bpanel bbook"><h2>הישגים <span class="bmuted"><bdi>${done}</bdi> מתוך <bdi>${BACH.length}</bdi></span></h2><p class="bmuted">כל הישג שווה נקודות ניסיון, ונקודות ניסיון מעלות רמה ופותחות חבילה.</p><ul class="bach-list">${ach}</ul></section>
  <section class="bpanel bbook"><h2>העונות שלך</h2>${k.hist.length?`<div class="bbook-tbl"><table><thead><tr><th>עונה</th><th>מועדון</th><th>מקום</th><th>נק׳</th><th>מאזן</th><th>שערים</th></tr></thead><tbody>${k.hist.slice().reverse().map(h=>`<tr><td><bdi>${h.s}</bdi></td><td>${esc(h.club)}<small>${esc(h.lg||'')}${h.part?' · עזבת באמצע':''}</small></td><td><bdi>${h.place||'–'}</bdi></td><td><bdi>${h.pts}</bdi></td><td><bdi>${h.w}-${h.d}-${h.l}</bdi></td><td><bdi>${h.gf}:${h.ga}</bdi></td></tr>`).join('')}</tbody></table></div>`:'<p class="bmuted">כל עונה שתסיים תירשם כאן: המועדון, המקום בטבלה והמאזן.</p>'}</section>`}

/* ---------- the haggle ----------
   A price was a wall: under the asking price the club named it and that was all. It now comes down when it is pressed — to a floor the
   coach cannot see (a first-team player gives less than a fringe one, a scout on the staff moves it, and every player is a little
   different) — and it has patience for three offers. An offer the club can live with is taken; one under the floor moves its price a
   step toward the floor and costs patience; an offer that is not serious costs two and moves nothing. When the patience is gone the club
   leaves the table until the next match has been played. */
let Bneg=null;
function BnegFloor(p,ask,core){const h=((p.id*2654435761+(Bstate().season||1)*97)>>>0)%7,f=(core?.93:.86)-.02*BstaffLv('scout')+(h-3)/100;return Math.round(ask*f/10000)*10000}
function BnegOffNow(p){const b=Bstate();return !!(b&&b.negOff&&b.negOff[p.id]===b.season+':'+b.round)}
function BnegPips(n){return `<span class="bneg-pips" role="img" aria-label="נשארו ${n} הצעות">${[1,2,3].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`}
function Bhaggle(p,c,fee,ask,core,reply){const b=Bstate();
  if(BtipFor(p)){Bcounter=ask;reply.innerHTML=`<p>המחיר המיוחד מהסקאוט הוא ${Bmoney(ask)}, וזה כבר אחרי ההנחה.</p>${Bbutton('השתמש במחיר הזה','data-action="counter"','secondary')}`;return false}
  if(!Bneg||Bneg.pid!==p.id||Bneg.ask!==ask)Bneg={pid:p.id,ask,dem:ask,left:3};const N=Bneg,floor=BnegFloor(p,ask,core);
  if(fee>=N.dem||fee>=floor){N.won=fee;try{const k=BbookEnsure();if(k&&fee<ask){k.n.hag=(k.n.hag||0)+1;BbookCheck()}}catch(e){}return true}
  const low=fee<ask*.6;N.left-=low?2:1;
  if(N.left<=0){const off={};for(const id in b.negOff||{})if(b.negOff[id]===b.season+':'+b.round)off[id]=b.negOff[id];off[p.id]=b.season+':'+b.round;b.negOff=off;Bneg=null;Bcounter=null;Bwrite();reply.innerHTML=`<p class="bnegative">${esc(c.name)} קמו מהשולחן. אפשר לחזור אליהם אחרי המשחק הבא.</p>`;return false}
  if(!low)N.dem=Math.max(floor,Math.round((N.dem*.55+floor*.45)/10000)*10000);Bcounter=N.dem;
  reply.innerHTML=`<p>${low?'הצעה כזאת לא רצינית בעיניהם, והם לא זזו.':N.dem<ask?'הם ירדו קצת, אבל זה עדיין לא מספיק להם.':'זה לא מספיק להם.'} המחיר שלהם עכשיו: <strong>${Bmoney(N.dem)}</strong>.</p><p class="bneg-pat">הסבלנות שלהם: ${BnegPips(N.left)} ${N.left===1?'הצעה אחרונה':'עוד '+N.left+' הצעות'}</p>${Bbutton('קבל את המחיר שלהם','data-action="counter"','secondary')}<div class="bneg-chips" aria-label="הצעה מהירה">${[3,6,10].map(d=>`<button type="button" class="bchip" data-neg-cut="${d}"><bdi>−${d}%</bdi></button>`).join('')}</div>`;return false}
const BnegHintHTML=(p,c)=>BnegOffNow(p)?`<p class="bnote bad">${esc(c.name)} קמו מהשולחן בשיחה הקודמת. אפשר לחזור אליהם אחרי המשחק הבא.</p>`:'<p>שווי השוק הוא הערכה, והמועדון מבקש יותר, במיוחד על שחקן חשוב. <strong>אפשר להתמקח:</strong> הצע פחות ותראה כמה הם מוכנים לרדת. יש להם סבלנות לשלוש הצעות.</p>';

document.addEventListener('click',e=>{const t=e.target&&e.target.closest?e.target:null;if(!t||!G||!G.beginner)return;let el;
  if(t.closest('[data-env-open]')){BenvOpen();return}
  if((el=t.closest('[data-neg-cut]'))&&Bneg){const inp=document.getElementById('boffer');if(inp){const v=Math.round(Bneg.dem*(1-(+el.dataset.negCut)/100)/10000)*10000;inp.value=v;const f=Bfind(Bselected),fc=document.getElementById('bfirstcost');if(f&&fc)fc.innerHTML=Bmoney(v+Byear(f.p))}return}
  if((el=t.closest('[data-tab="book"]'))){const b=Bstate();if(b&&b.book&&b.book.fresh.length){b.book.fresh=[];Bwrite()}}});
