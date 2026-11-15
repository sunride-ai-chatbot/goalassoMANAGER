/* ===================== SHARED LEAGUE — the app: lobby, identity, the board =====================
   Several managers in one league, each building a club out of one shared pool of real players. The server owns
   the money, the squads, the fixtures and the results (supabase/migrations/..._shared_league*.sql): a phone asks
   and shows. Nothing a manager can change in this page changes a price, a balance or a score.

   The league is its own full-screen app over the game, with tabs: the board (table, the evening's matches),
   the squad (line-up, training), the market, trades and the club. This file is the shell and everything up to
   the board; 35g-league-squad.js is the squad, the market and trades, 35h-league-match.js the match itself.

   The identity lives in this browser: an anonymous session is taken quietly, exactly as the invitation rooms do. */
const LG={client:null,root:null,gen:0,busy:false,poll:null,state:null,view:'lobby',draft:null,setup:null,sheet:null,offer:null,match:null,
  mk:{q:'',pos:'',sort:'v',mine:false,n:30},confirm:null};
const LG_KEY='goalasso.league.id';
const LG_TABS=[['home','הליגה'],['squad','הסגל'],['market','רכש'],['trades','עסקאות'],['club','המועדון']];
const LG_ERR={login_required:'צריך להתחבר לשירות לפני פתיחת ליגה.',invalid_name:'שם הליגה צריך להיות בין תו אחד ל־60.',invalid_team:'שם המועדון צריך להיות בין תו אחד ל־40.',invalid_capacity:'מספר המנהלים צריך להיות בין 2 ל־8.',
  too_many_leagues:'יש לך כבר עשר ליגות פתוחות. סגור אחת לפני שתפתח חדשה.',invitation_expired:'ההזמנה פגה או אינה תקינה.',league_started:'הליגה כבר יצאה לדרך.',team_taken:'מישהו בליגה כבר לקח את השם הזה.',league_full:'הליגה מלאה.',
  not_a_member:'אין לחשבון הזה גישה לליגה.',invalid_crest:'הסמל אינו תקין.',invalid_kit:'המדים אינם תקינים.',no_money:'אין מספיק כסף בקופה.',unknown_player:'השחקן אינו ברשימת המחירים של השרת.',player_taken:'מנהל אחר כבר החתים את השחקן הזה.',
  squad_full:'הסגל מלא: 22 שחקנים לכל היותר.',squad_too_small:'אי אפשר לרדת מתחת ל־14 שחקנים במהלך העונה.',not_yours:'השחקן הזה אינו שלך.',not_his:'השחקן הזה כבר אינו אצל המנהל השני.',no_such_manager:'המנהל הזה אינו בליגה.',empty_offer:'הצעה צריכה לכלול שחקן או כסף.',
  offer_too_big:'עד שמונה שחקנים מכל צד בהצעה אחת.',no_such_offer:'ההצעה כבר אינה פתוחה.',offer_stale:'אחד השחקנים בהצעה כבר עבר הלאה. ההצעה בוטלה.',host_only:'רק המארח יכול לעשות את זה.',not_enough_managers:'צריך לפחות שני מנהלים כדי להתחיל עונה.',
  pool_empty:'רשימת המחירים של השחקנים עדיין לא הותקנה בשרת.',no_season:'העונה לא פעילה כרגע.',no_sessions_left:'שלושת האימונים של המחזור הזה כבר נוצלו.',ground_max:'מגרש האימונים כבר ברמה הגבוהה ביותר.',not_your_match:'המשחק הזה אינו שלך.',
  not_this_round:'המשחק הזה אינו במחזור הנוכחי.',not_in_play:'המשחק הזה אינו פתוח כרגע.',penalty_open:'יש פנדל שעדיין לא הוכרע.',invalid_result:'התוצאה אינה תקינה.',season_running:'העונה עדיין רצה.',invalid_setup:'ההרכב אינו תקין.',pen_mismatch:'הפנדל אינו תואם את המשחק.'};
/* A league whose SQL has not been installed in the project answers with PostgREST's own English sentence about a
   missing function, which tells a player nothing. It is the one failure that is not his fault and not a bug in
   the page, so it says what it is. */
function lgErr(e){const m=String(e&&e.message||e);if(/schema cache|does not exist|42883|PGRST202/i.test(m))return 'החלק הזה של שירות הליגה עדיין לא הותקן בפרויקט.';return LG_ERR[m]||m}
const lgApi=async()=>LG.client||(LG.client=await (window.__lgClientFactory?window.__lgClientFactory():mpClient()));
async function lgRpc(name,args){const c=await lgApi(),r=await c.rpc(name,args);if(r.error)throw r.error;return r.data}
const lgSaved=()=>{try{return localStorage.getItem(LG_KEY)||''}catch(e){return ''}};
const lgRemember=id=>{try{id?localStorage.setItem(LG_KEY,id):localStorage.removeItem(LG_KEY)}catch(e){}};
const lgInvited=()=>{try{return new URL(location.href).searchParams.get('league')||''}catch(e){return ''}};
const lgLinkFor=inv=>{try{const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('league',inv);return u.href}catch(e){return '?league='+inv}};
function lgClearInvite(){try{const u=new URL(location.href);u.searchParams.delete('league');history.replaceState(null,'',u.href)}catch(e){}}
const lgMoney=n=>{n=+n||0;const s=n<0?'-':'';n=Math.abs(n);return s+'₪'+(n>=1e6?(Math.round(n/1e5)/10)+'M':n>=1e3?Math.round(n/1e3)+'K':String(n))};   /* plain, for a status line */
const lgCash=n=>`<bdi dir="ltr">${lgMoney(n)}</bdi>`;   /* a sum inside Hebrew keeps its own direction */
const lgMe=()=>(LG.state&&LG.state.members||[]).find(m=>m.mine)||null;
const lgMember=id=>(LG.state&&LG.state.members||[]).find(m=>m.id===id)||null;
const lgV2=()=>!!(LG.state&&LG.state.me);   /* the season functions are installed (the second migration) */
const lgCrestOf=(m,o)=>crestSVG((m&&m.crest&&m.crest.shape)?m.crest:Object.assign(crestDefault(lgHashN(m&&m.team)),{tier:(m&&m.crest&&m.crest.tier)||'free'}),Object.assign({name:''},o||{}));
const lgKitOf=(m,o)=>clubKitSVG(Object.assign({},kitDefault(lgHashN(m&&m.team)),m&&m.kit||{}),o||{});
function lgMsg(s){const el=document.getElementById('lg-status');if(el)el.textContent=s||''}
function lgBody(html){const el=document.getElementById('lg-body');if(el){el.innerHTML=html}}

const League={entry:()=>`<button type="button" class="btn lg-entry" data-lg-open>${lgSaved()?'לליגה שלי':'ליגה משותפת · כמה מנהלים'}</button>`,
 intro:()=>`<section class="card lg-intro"><h3>ליגה משותפת</h3><p>עד שמונה מנהלים, מאגר שחקנים אחד. כל אחד בונה מועדון משלו: שם, סמל, מדים וסגל — ומי שחתם על שחקן, הוא שלו.</p>${League.entry()}</section>`,
 /* only an invitation opens the league by itself; a manager who already has one finds it behind its button */
 open:()=>lgOpen(),close:()=>lgClose(),boot(){if(lgInvited())void lgOpen()},get state(){return LG.state}};

function lgClose(){LG.gen++;clearTimeout(LG.poll);LG.poll=null;clearInterval(LG.kickTimer);LG.kickTimer=null;LG.kick=null;try{lgMatchStop()}catch(e){}if(LG.root)LG.root.remove();LG.root=null;LG.busy=false;LG.draft=null;LG.sheet=null;LG.offer=null;LG.confirm=null}
async function lgOpen(){lgClose();const gen=LG.gen;
  LG.root=document.createElement('div');LG.root.className='lg-overlay';
  LG.root.innerHTML='<section class="lg-dialog" role="dialog" aria-modal="true" aria-label="ליגה משותפת"><header class="lg-top"><button type="button" class="lg-close" data-lg="close" aria-label="סגור">×</button><div class="lg-title"><h2 id="lg-name-h">ליגה משותפת</h2><small id="lg-sub"></small></div><div class="lg-cash" id="lg-cash"></div></header><div id="lg-body">מתחבר לשירות…</div><p id="lg-status" role="status" aria-live="polite"></p><nav class="lg-tabs" id="lg-tabs" hidden></nav></section>';
  document.body.appendChild(LG.root);
  try{
   if(!mpAvailable()&&!window.__lgClientFactory){lgBody('<p>שירות הרשת לא מוגדר בבנייה הזו.</p>');return}
   const c=await lgApi(),s=await c.auth.getSession();if(gen!==LG.gen)return;
   if(s.error)throw s.error;
   if(!s.data?.session){if(!c.auth.signInAnonymously){lgBody('<p>הדפדפן הזה לא הצליח לפתוח חיבור לשירות.</p>');return}
    lgMsg('נכנס…');const r=await c.auth.signInAnonymously();if(gen!==LG.gen)return;
    if(r.error){lgBody('<p>לא הצלחנו לפתוח חיבור לשירות. נסה שוב מאוחר יותר.</p>');lgMsg(lgErr(r.error));return}lgMsg('')}
   await lgEnter(gen)}
  catch(e){lgMsg(lgErr(e))}}
async function lgEnter(gen){
  if(lgSaved()){try{await lgLoad();if(gen!==LG.gen)return;LG.view='home';lgPaint();lgSchedule(gen);return}
   catch(e){if(/not_a_member|invitation_expired/.test(String(e.message||e)))lgRemember('');else lgMsg(lgErr(e))}}
  LG.state=null;await lgLobby(gen)}
/* everything the league shows comes from this one call */
async function lgLoad(){const s=await lgRpc('lg_get',{p_league:lgSaved()});LG.state=s;LG.setup=lgCleanSetup(s.setup);LG.clubCache=null;try{lgKickSync()}catch(e){}return s}
async function lgReload(){const gen=LG.gen;await lgLoad();if(gen===LG.gen)lgPaint()}
function lgSchedule(gen){clearTimeout(LG.poll);LG.poll=setTimeout(async()=>{if(gen!==LG.gen)return;
  /* only the screens that show other people's news refresh by themselves; a screen being typed into is left alone */
  if(['home','trades'].includes(LG.view)&&!LG.busy&&!LG.confirm&&!LG.kick&&!(LG.offer&&LG.view==='trades')){try{await lgLoad();if(gen!==LG.gen)return;lgPaint()}catch(e){}}
  lgSchedule(gen)},15000)}

/* ---- lobby ---- */
const lgCreateHTML=()=>`<div class="lg-create"><label>שם הליגה<input id="lg-name" maxlength="60" placeholder="ליגת החברים"></label><label>שם המועדון שלך<input id="lg-team2" maxlength="40" placeholder="הפועל הצפון"></label><label>כמה מנהלים<select id="lg-cap">${[2,3,4,5,6,7,8].map(n=>`<option value="${n}"${n===4?' selected':''}>${n}</option>`).join('')}</select></label><button type="button" class="btn" data-lg="create">פתח ליגה וקבל קישור הזמנה</button></div>`;
async function lgLobby(gen){LG.view='lobby';lgChrome();const inv=lgInvited();let card='';
  if(inv){try{const p=await lgRpc('lg_preview_invitation',{p_invitation:inv});if(gen!==LG.gen)return;
    card=`<div class="lg-invite"><strong>${esc(p.league)}</strong><span>הזמנה מ${esc(p.team||'המארח')} · <bdi>${p.members}</bdi> מתוך <bdi>${p.capacity}</bdi> מנהלים</span>${p.full?'<em>הליגה כבר מלאה או יצאה לדרך.</em>':''}</div>`;
    if(!p.full){lgBody(`${card}<label>שם המועדון שלך<input id="lg-team" maxlength="40" placeholder="הפועל הצפון"></label><button type="button" class="btn" data-lg="join">הצטרף לליגה</button><p class="lg-or">או פתח ליגה משלך</p>${lgCreateHTML()}`);return}}
   catch(e){card=`<div class="lg-invite"><em>${esc(lgErr(e))}</em></div>`}}
  lgBody(card+lgCreateHTML())}

/* ---- the frame: title, the purse, the tabs ---- */
function lgChrome(){const s=LG.state,me=lgMe(),tabs=document.getElementById('lg-tabs'),sub=document.getElementById('lg-sub'),cashEl=document.getElementById('lg-cash'),h=document.getElementById('lg-name-h');if(!tabs)return;
  const inApp=lgV2()&&LG_TABS.some(t=>t[0]===LG.view);
  h.textContent=s?s.name:'ליגה משותפת';
  sub.innerHTML=s?(s.phase==='build'?`בונים סגלים · <bdi>${s.members.length}</bdi> מתוך <bdi>${s.capacity}</bdi> מנהלים`:s.phase==='done'?`עונה <bdi>${s.season}</bdi> הסתיימה`:`עונה <bdi>${s.season}</bdi> · מחזור <bdi>${s.round}</bdi> מתוך <bdi>${lgRounds()}</bdi>`):'';
  cashEl.innerHTML=me?lgCash(me.money):'';
  tabs.hidden=!inApp;LG.root.classList.toggle('lg-inmatch',LG.view==='match');
  const inbox=s&&s.offers?s.offers.filter(o=>o.to===s.me).length:0;
  tabs.innerHTML=inApp?LG_TABS.map(([k,l])=>`<button type="button" class="lg-tab${LG.view===k?' on':''}" data-lg="tab" data-v="${k}"${LG.view===k?' aria-current="page"':''}>${l}${k==='trades'&&inbox?`<i class="lg-dot" aria-label="${inbox} הצעות ממתינות">${inbox}</i>`:''}</button>`).join(''):''}
const lgRounds=()=>{const f=LG.state&&LG.state.fixtures||[];return f.length?Math.max(...f.map(x=>x.round)):0};
function lgPaint(){if(!LG.root||!LG.state)return;lgChrome();const v=LG.view;const body=document.getElementById('lg-body');const y=body?body.scrollTop:0;
  if(v==='home')lgBody(lgHomeHTML());else if(v==='identity')lgIdentityPaint();else if(v==='club')lgBody(lgClubHTML());
  else if(v==='squad')lgBody(lgSquadHTML());else if(v==='market')lgBody(lgMarketHTML());else if(v==='trades')lgBody(lgTradesHTML());
  else if(v==='match')lgMatchPaint();
  if(body&&LG.keepScroll){body.scrollTop=y}LG.keepScroll=false;try{lgFacesWatch()}catch(e){}}

/* ---- the board ---- */
function lgMembersHTML(){const s=LG.state;return `<ul class="lg-members">${s.members.map(m=>`<li class="${m.mine?'is-me':''}">
    <span class="lg-crest">${lgCrestOf(m,{label:'סמל '+m.team})}</span><span class="lg-kit">${lgKitOf(m)}</span>
    <span class="lg-who"><strong>${esc(m.team)}</strong><small>${m.host?'מארח · ':''}<bdi>${m.squad}</bdi> שחקנים</small></span>
    <span class="lg-money">${lgCash(m.money)}</span></li>`).join('')}</ul>`}
function lgShareHTML(){const s=LG.state;return s.invitation?`<div class="lg-share"><label>קישור הזמנה<input id="lg-link" readonly dir="ltr" value="${esc(lgLinkFor(s.invitation))}"></label><button type="button" class="btn sec" data-lg="copy">העתק</button></div>`:''}
/* what the league is waiting for, so a board is never a dead end */
function lgNextHTML(){const s=LG.state,me=lgMe(),need=s.capacity-s.members.length,named=!!(me&&me.crest&&me.crest.shape),short=me?Math.max(0,14-me.squad):0;
  const steps=[];
  if(!lgV2())steps.push('המשך העונה — רכש, מחזורים וטבלה — מחכה להתקנה בשרת. עד אז אפשר להזמין מנהלים ולעצב את המועדון.');
  else if(!s.pool)steps.push('רשימת המחירים של השחקנים עדיין לא הותקנה בשרת, ולכן אי אפשר לקנות שחקנים.');
  if(!named)steps.push('עצב את המועדון: שם, סמל ומדים — בלשונית "המועדון"');
  if(lgV2()&&s.pool&&short)steps.push(`חסרים לך <bdi>${short}</bdi> שחקנים לסגל של 14 — בלשונית "רכש", או בלחיצה אחת על "בנה לי סגל"`);
  if(need>0)steps.push(`יש מקום לעוד <bdi>${need}</bdi> ${need===1?'מנהל':'מנהלים'} · שלח להם את קישור ההזמנה`);
  if(lgV2()&&s.members.length>=2)steps.push(s.host?'כשכולם מוכנים — התחל את העונה. מי שלא סיים לקנות יקבל סגל חוקי אוטומטית.':'המארח מתחיל את העונה כשכולם מוכנים.');
  return `<div class="lg-next"><h4>מה עכשיו</h4><ul>${steps.map(x=>`<li>${x}</li>`).join('')}</ul></div>`}
function lgTableHTML(){const s=LG.state;if(!s.table||!s.table.length)return '';
  return `<div class="lg-card"><h3>הטבלה</h3><table class="lg-table"><thead><tr><th></th><th class="t-team">קבוצה</th><th>מש'</th><th>נ'</th><th>ת'</th><th>ה'</th><th>שערים</th><th>נק'</th></tr></thead><tbody>${s.table.map(r=>{const m=lgMember(r.id)||{team:'?'};
    return `<tr class="${m.mine?'is-me':''}"><td><bdi>${r.pos}</bdi></td><td class="t-team"><span><span class="t-crest">${lgCrestOf(m)}</span><b>${esc(m.team)}</b></span></td><td><bdi>${r.p}</bdi></td><td><bdi>${r.w}</bdi></td><td><bdi>${r.d}</bdi></td><td><bdi>${r.l}</bdi></td><td><bdi dir="ltr">${r.gf}:${r.ga}</bdi></td><td><b><bdi>${r.pts}</bdi></b></td></tr>`}).join('')}</tbody></table></div>`}
function lgFixtureRowHTML(f){const s=LG.state,h=lgMember(f.home)||{team:'?'},a=lgMember(f.away)||{team:'?'},mine=f.home===s.me||f.away===s.me;
  const mid=f.played?scoreSides(f.hg,f.ag,{label:`${h.team} ${f.hg}, ${a.team} ${f.ag}`}):`<span class="lg-vs">${f.answers&&f.answers.length?'ממתין לאישור':'טרם שוחק'}</span>`;
  return `<li class="lg-fx${mine?' is-me':''}${f.played?' done':''}"><span class="fx-t fx-h"><b>${esc(h.team)}</b><span class="t-crest">${lgCrestOf(h)}</span></span><span class="fx-mid">${mid}</span><span class="fx-t fx-a"><span class="t-crest">${lgCrestOf(a)}</span><b>${esc(a.team)}</b></span>${f.played&&mine?`<button type="button" class="lg-mini" data-lg="play" data-v="${f.id}">צפה שוב</button>`:''}</li>`}
function lgRoundHTML(){const s=LG.state,fx=s.fixtures.filter(f=>f.round===s.round),mine=fx.find(f=>f.home===s.me||f.away===s.me);let hero;
  if(!mine)hero=`<div class="lg-hero free"><small>מחזור <bdi>${s.round}</bdi></small><h3>ערב חופשי</h3><p>אין לך משחק במחזור הזה. זה ערב טוב לאימונים ולרכש.</p></div>`;
  else{const home=mine.home===s.me,opp=lgMember(home?mine.away:mine.home)||{team:'?'},me=lgMe(),did=(mine.answers||[]).includes(s.me),he=(mine.answers||[]).some(x=>x!==s.me);
    hero=`<div class="lg-hero"><small>מחזור <bdi>${s.round}</bdi> · ${home?'משחק בית':'משחק חוץ'}</small>
     <div class="lg-duel"><div><span class="d-crest">${lgCrestOf(me)}</span><b>${esc(me.team)}</b></div><i>נגד</i><div><span class="d-crest">${lgCrestOf(opp)}</span><b>${esc(opp.team)}</b></div></div>
     ${did?`<p>שיחקת את המשחק. הוא ייכנס לטבלה כש${esc(opp.team)} תשחק אותו אצלה, או כשהמארח יסגור את המחזור.</p><button type="button" class="btn sec" data-lg="play" data-v="${mine.id}">צפה שוב</button>`
        :`<p>${he?`${esc(opp.team)} כבר שיחקה. המשחק שלך יציג את אותו משחק בדיוק ויאשר את התוצאה.`:'ההרכב שבלשונית "הסגל" הוא שיעלה. אם היריב מחובר, פנדלים הם דו־קרב ביניכם.'}</p><button type="button" class="btn big" data-lg="play" data-v="${mine.id}">לשריקת הפתיחה</button>`}</div>`}
  const open=fx.filter(f=>!f.played).length;
  return `${hero}${lgKickHTML()}<div class="lg-card"><h3>משחקי המחזור</h3><ul class="lg-fxs">${fx.map(lgFixtureRowHTML).join('')}</ul>
   ${s.host&&open?`<button type="button" class="btn sec lg-wide" data-lg="close-round">${LG.confirm==='close-round'?'לחץ שוב לאישור: סגור את המחזור':'סגור את המחזור'}</button><p class="lg-note">סגירה קובעת את מה שנשאר פתוח: משחק שרק מנהל אחד שיחק נשאר כפי ששוחק, ומשחק שאף אחד לא שיחק נרשם <bdi dir="ltr">0:0</bdi>.</p>`:''}</div>`}
function lgAllFixturesHTML(){const s=LG.state,n=lgRounds();if(!n)return '';let out='';
  for(let r=1;r<=n;r++){if(r===s.round&&s.phase==='season')continue;const fx=s.fixtures.filter(f=>f.round===r);if(!fx.length)continue;out+=`<h4>מחזור <bdi>${r}</bdi></h4><ul class="lg-fxs">${fx.map(lgFixtureRowHTML).join('')}</ul>`}
  return out?`<details class="lg-card lg-all"><summary>כל המחזורים</summary>${out}</details>`:''}
const LG_PRIZES=[20e6,16e6,12e6,8e6,4e6];
function lgDoneHTML(){const s=LG.state,t=s.table||[],champ=lgMember(t[0]&&t[0].id)||{team:'?'};
  return `<div class="lg-champ"><span class="c-crest">${lgCrestOf(champ,{name:champ.team})}</span><small>אלופת עונה <bdi>${s.season}</bdi></small><h3>${esc(champ.team)}</h3>${champ.mine?'<p>האליפות שלך.</p>':''}</div>
   <div class="lg-card"><h3>כספי הפרסים</h3><ul class="lg-prizes">${t.map((r,i)=>{const m=lgMember(r.id)||{team:'?'};return `<li class="${m.mine?'is-me':''}"><span><bdi>${r.pos}</bdi>. ${esc(m.team)}</span><b>${LG_PRIZES[i]?lgCash(LG_PRIZES[i]):'—'}</b></li>`}).join('')}</ul><p class="lg-note">הפרסים כבר בקופות, ונכנסים איתכם לעונה הבאה יחד עם הסגלים ומה שהשחקנים למדו באימונים.</p></div>
   ${s.host?`<button type="button" class="btn big lg-wide" data-lg="next-season">פתח עונה חדשה</button>`:'<p class="lg-note">המארח פותח את העונה הבאה.</p>'}`}
function lgHomeHTML(){const s=LG.state;
  if(s.phase==='season'&&lgV2())return lgRoundHTML()+lgTableHTML()+lgAllFixturesHTML();
  if(s.phase==='done'&&lgV2())return lgDoneHTML()+lgTableHTML()+lgAllFixturesHTML();
  const can=lgV2()&&s.host&&s.members.length>=2&&s.pool>0;
  return `${lgShareHTML()}${lgMembersHTML()}${lgNextHTML()}
   ${lgV2()&&s.host?`<button type="button" class="btn big lg-wide" data-lg="start" ${can?'':'disabled'}>${LG.confirm==='start'?'לחץ שוב לאישור: התחל את העונה':'התחל את העונה'}</button>`:''}
   ${!lgV2()?'<div class="lg-actions"><button type="button" class="btn" data-lg="identity">המועדון שלי · שם, סמל ומדים</button></div><button type="button" class="lg-leave" data-lg="leave">צא מהליגה בטלפון הזה</button>':''}`}

/* ---- the club: identity, the account, the way out ---- */
const LG_REASON={start:'תקציב פתיחה',buy:'רכישה',sell:'מכירה',trade:'עסקה',result:'תוצאת משחק',prize:'פרס עונה',kit:'מדים',crest:'סמל',training:'מגרש אימונים'};
function lgClubHTML(){const s=LG.state,me=lgMe();
  return `<div class="lg-clubhead"><span class="c-crest">${lgCrestOf(me,{name:me.team,label:'הסמל של '+me.team})}</span><span class="c-kit">${lgKitOf(me,{no:9})}</span><div><h3>${esc(me.team)}</h3><p>${lgCash(me.money)} בקופה · <bdi>${me.squad}</bdi> שחקנים</p></div></div>
   <div class="lg-actions"><button type="button" class="btn" data-lg="identity">שם, סמל ומדים</button></div>
   ${lgShareHTML()}
   <div class="lg-card"><h3>החשבון</h3>${(s.ledger||[]).length?`<ul class="lg-ledger">${s.ledger.map(g=>`<li><span>${LG_REASON[g.reason]||esc(g.reason)}${g.note&&lgEntry(g.note)?' · '+esc(lgEntry(g.note).he):''}</span><b class="${g.amount<0?'neg':'pos'}">${lgCash(g.amount)}</b></li>`).join('')}</ul>`:'<p class="lg-note">כל תנועה בקופה נרשמת כאן.</p>'}</div>
   <div class="lg-card"><h3>חברי הליגה</h3>${lgMembersHTML()}</div>
   <button type="button" class="lg-leave" data-lg="leave">צא מהליגה בטלפון הזה</button>`}

/* ---- identity ---- */
const CREST_SHAPE_HE={shield:'מגן',kite:'חוד',block:'מלבן',disc:'עיגול'};
const CREST_DIV_HE={solid:'אחיד',half:'חצוי',pale:'פס אמצעי',quarter:'רבעים',bend:'אלכסון',chevron:'שברון',stripes:'פסים'};
const CREST_EMBLEM_HE={ball:'כדור',star:'כוכב',crown:'כתר',anchor:'עוגן',bolt:'ברק',flame:'להבה',tower:'מגדל',bridge:'גשר',wave:'גל',lion:'אריה'};
const KIT_PATTERN_HE={stripes:'פסים',hoops:'טבעות',sash:'אלכסון',halves:'חצוי',sleeves:'שרוולים'};
/* The ready-made crests. Six to begin with, and one press opens the whole wall at once: asking for six more at a
   time made choosing a crest a queue. The list is the same list every time for a club (its seed is the name the
   manager came in with), the first six of it are the short one, and no crest appears twice. */
const LG_CRESTS_ALL=72;
const lgSameCrest=(a,b)=>!!a&&!!b&&['shape','div','emblem','c1','c2'].every(k=>a[k]===b[k]);
function lgCrestChoices(d){const me=lgMe(),seed=lgHashN(me?me.team:d.team);if(!LG.crests||LG.crests.seed!==seed){const out=[];
   /* every part is drawn from its own bits of a hash, and the shapes simply take turns: a generator that reads the low
      bits of one running number gave a wall of seventy discs in three colours */
   for(let i=0;out.length<LG_CRESTS_ALL&&i<LG_CRESTS_ALL*6;i++){const h=lgHashN(seed+':'+i),p=CREST_PALETTES[(h>>>3)%CREST_PALETTES.length];
    const c={shape:CREST_SHAPES[(i+seed)%CREST_SHAPES.length],div:CREST_DIVS[(h>>>9)%CREST_DIVS.length],c1:p[0],c2:p[1],ink:p[2],emblem:CREST_EMBLEMS[(h>>>15)%CREST_EMBLEMS.length],tier:'free'};
    if(!out.some(o=>lgSameCrest(o,c)))out.push(c)}
   LG.crests={seed,list:out}}
  return d.all?LG.crests.list:LG.crests.list.slice(0,6)}
function lgIdentityPaint(){const me=lgMe();if(!me)return;const hash=lgHashN;
  const d=LG.draft=LG.draft||{team:me.team,crest:Object.assign({},crestDefault(hash(me.team)),me.crest||{}),kit:Object.assign({},kitDefault(hash(me.team)),me.kit||{})};
  const charge=Math.max(0,crestTierCost(d.crest.tier)-crestTierCost((me.crest||{}).tier||'free'))+Math.max(0,kitTierCost(d.kit.tier)-kitTierCost((me.kit||{}).tier||'plain'));
  const opts=lgCrestChoices(d);
  lgBody(`<div class="lg-id">
   <div class="lg-preview">${crestSVG(d.crest,{name:d.team,label:'תצוגה מקדימה של הסמל'})}${clubKitSVG(d.kit,{no:9})}</div>
   <label>שם המועדון<input id="lg-team3" maxlength="40" value="${esc(d.team)}" data-lg-input="team"></label>
   <fieldset><legend>הסמל</legend>
    <div class="lg-tiers">${[['free','מוכן',0],['custom','לפי בחירה',1e6],['premium','מוזהב',2e6]].map(([t,l,c])=>`<button type="button" class="lg-tier${d.crest.tier===t?' on':''}" data-lg="ctier" data-v="${t}">${l}<small>${c?lgCash(c):'חינם'}</small></button>`).join('')}</div>
    ${d.crest.tier==='free'
      ?`<div class="lg-opts${d.all?' all':''}">${opts.map((o,i)=>`<button type="button" class="lg-opt${lgSameCrest(o,d.crest)?' on':''}" data-lg="cpick" data-v="${i}">${crestSVG(Object.assign({},o,{tier:'free'}),{name:'',label:'אפשרות '+(i+1)})}</button>`).join('')}</div><button type="button" class="btn sec" data-lg="croll">${d.all?'הצג פחות':`כל הסמלים · <bdi>${LG_CRESTS_ALL}</bdi>`}</button>`
      :`<div class="lg-parts">
        <div class="lg-part"><span>צורה</span>${CREST_SHAPES.map(v=>`<button type="button" class="lg-chip${d.crest.shape===v?' on':''}" data-lg="cset" data-k="shape" data-v="${v}">${CREST_SHAPE_HE[v]}</button>`).join('')}</div>
        <div class="lg-part"><span>חלוקה</span>${CREST_DIVS.map(v=>`<button type="button" class="lg-chip${d.crest.div===v?' on':''}" data-lg="cset" data-k="div" data-v="${v}">${CREST_DIV_HE[v]}</button>`).join('')}</div>
        <div class="lg-part"><span>סמל</span>${CREST_EMBLEMS.map(v=>`<button type="button" class="lg-chip ic${d.crest.emblem===v?' on':''}" data-lg="cset" data-k="emblem" data-v="${v}" aria-label="${CREST_EMBLEM_HE[v]}"><svg viewBox="-22 -22 44 44" aria-hidden="true"><g fill="currentColor" stroke="currentColor">${crestEmblem(v)}</g></svg></button>`).join('')}</div>
        <div class="lg-part"><span>צבעים</span>${CREST_PALETTES.map((p,i)=>`<button type="button" class="lg-chip sw${d.crest.c1===p[0]&&d.crest.c2===p[1]?' on':''}" data-lg="cpal" data-v="${i}" aria-label="ערכת צבעים ${i+1}"><i style="background:${p[0]}"></i><i style="background:${p[1]}"></i></button>`).join('')}</div>
       </div>`}
   </fieldset>
   <fieldset><legend>המדים</legend>
    <div class="lg-tiers">${[['plain','חלק',0],['pattern','עם דוגמה',5e5],['premium','מוזהב',2e6]].map(([t,l,c])=>`<button type="button" class="lg-tier${d.kit.tier===t?' on':''}" data-lg="ktier" data-v="${t}">${l}<small>${c?lgCash(c):'חינם'}</small></button>`).join('')}</div>
    ${d.kit.tier==='plain'?'':`<div class="lg-part">${KIT_PATTERNS.filter(p=>p!=='solid').map(v=>`<button type="button" class="lg-chip${d.kit.pattern===v?' on':''}" data-lg="kset" data-k="pattern" data-v="${v}">${KIT_PATTERN_HE[v]}</button>`).join('')}</div>`}
    <div class="lg-part"><span>צבעים</span>${CREST_PALETTES.map((p,i)=>`<button type="button" class="lg-chip sw${d.kit.c1===p[0]&&d.kit.c2===p[1]?' on':''}" data-lg="kpal" data-v="${i}" aria-label="ערכת צבעים ${i+1}"><i style="background:${p[0]}"></i><i style="background:${p[1]}"></i></button>`).join('')}</div>
   </fieldset>
   <p class="lg-charge">${charge?`השינוי יחויב ב־${lgCash(charge)} מתוך ${lgCash(me.money)}. דרגה נקנית פעם אחת ואינה מוחזרת.`:'ללא עלות.'}</p>
   <div class="lg-actions"><button type="button" class="btn" data-lg="save">שמור</button><button type="button" class="btn sec" data-lg="back">חזרה</button></div>
  </div>`)}

/* ---- one listener for the whole league ----
   Quick actions repaint and return; anything that talks to the server goes through the busy gate at the bottom. */
const LG_ACT={};   /* filled by the other league files: name → async (btn, gen) */
document.addEventListener('click',async e=>{
  if(e.target.closest('[data-lg-open]')){void lgOpen();return}
  const btn=e.target.closest('[data-lg]');if(!btn||!LG.root||!LG.root.contains(btn))return;
  const a=btn.dataset.lg,v=btn.dataset.v,k=btn.dataset.k,gen=LG.gen,d=LG.draft;
  if(a==='close'){lgClose();return}
  if(a==='tab'){LG.view=v;LG.sheet=null;LG.confirm=null;lgMsg('');lgPaint();const b=document.getElementById('lg-body');if(b)b.scrollTop=0;return}
  if(a==='back'){LG.draft=null;LG.view=lgV2()?'club':'home';lgPaint();return}
  if(a==='identity'){LG.view='identity';lgPaint();return}
  if(a==='copy'){const i=document.getElementById('lg-link');try{await navigator.clipboard.writeText(i.value);lgMsg('הקישור הועתק. שלח אותו לחברים.')}catch(x){i.select();lgMsg('סמן והעתק את הקישור.')}return}
  if(a==='croll'){d.all=!d.all;LG.keepScroll=true;lgPaint();return}
  if(a==='cpick'){Object.assign(d.crest,lgCrestChoices(d)[+v],{tier:'free'});LG.keepScroll=true;lgPaint();return}
  if(a==='cset'){d.crest[k]=v;lgPaint();return}
  if(a==='kset'){d.kit[k]=v;lgPaint();return}
  if(a==='cpal'){const p=CREST_PALETTES[+v];d.crest.c1=p[0];d.crest.c2=p[1];d.crest.ink=p[2];lgPaint();return}
  if(a==='kpal'){const p=CREST_PALETTES[+v];d.kit.c1=p[0];d.kit.c2=p[1];lgPaint();return}
  if(a==='ctier'){d.crest.tier=v;lgPaint();return}
  if(a==='ktier'){d.kit.tier=v;if(v!=='plain'&&(!d.kit.pattern||d.kit.pattern==='solid'))d.kit.pattern='stripes';lgPaint();return}
  if(a==='leave'){lgRemember('');LG.state=null;LG.draft=null;await lgLobby(gen);lgMsg('יצאת מהליגה בטלפון הזה. קישור ההזמנה עדיין פותח אותה.');return}
  /* the two buttons that cannot be taken back ask once more, in place */
  if((a==='start'||a==='close-round')&&LG.confirm!==a){LG.confirm=a;lgPaint();return}
  if(LG_ACT[a]&&LG_ACT[a].quick){LG_ACT[a](btn,gen);return}
  if(LG.busy)return;LG.busy=true;btn.disabled=true;
  try{
   if(a==='create'){const name=document.getElementById('lg-name').value.trim(),team=document.getElementById('lg-team2').value.trim(),cap=+document.getElementById('lg-cap').value;
    const r=await lgRpc('lg_create',{p_name:name,p_team:team,p_capacity:cap});if(gen!==LG.gen)return;
    lgRemember(r.id);lgClearInvite();await lgEnter(gen);lgMsg('הליגה נפתחה. שלח את קישור ההזמנה.')}
   else if(a==='join'){const team=document.getElementById('lg-team').value.trim();
    const r=await lgRpc('lg_join',{p_invitation:lgInvited(),p_team:team});if(gen!==LG.gen)return;
    lgRemember(r.id);lgClearInvite();await lgEnter(gen);lgMsg('הצטרפת לליגה.')}
   else if(a==='save'){const team=(document.getElementById('lg-team3').value||'').trim();
    const r=await lgRpc('lg_set_identity',{p_league:lgSaved(),p_team:team,p_crest:d.crest,p_kit:d.kit});if(gen!==LG.gen)return;
    LG.draft=null;LG.view=lgV2()?'club':'home';await lgReload();lgMsg(r.charged?`נשמר. חויבת ב־${lgMoney(r.charged)}.`:'נשמר.')}
   else if(a==='start'){LG.confirm=null;await lgRpc('lg_start',{p_league:lgSaved()});if(gen!==LG.gen)return;await lgReload();lgMsg('העונה התחילה. בהצלחה.')}
   else if(a==='close-round'){LG.confirm=null;await lgRpc('lg_round_close',{p_league:lgSaved()});if(gen!==LG.gen)return;await lgReload();lgMsg('המחזור נסגר.')}
   else if(a==='next-season'){await lgRpc('lg_next_season',{p_league:lgSaved()});if(gen!==LG.gen)return;await lgReload();lgMsg('עונה חדשה יצאה לדרך.')}
   else if(LG_ACT[a])await LG_ACT[a](btn,gen)}
  catch(x){if(gen===LG.gen){LG.confirm=null;lgMsg(lgErr(x))}}
  finally{if(gen===LG.gen){LG.busy=false;if(btn.isConnected)btn.disabled=false}}});
document.addEventListener('input',e=>{if(!LG.root)return;const el=e.target.closest('[data-lg-input]');if(!el)return;const k=el.dataset.lgInput;
  if(k==='team'&&LG.draft){LG.draft.team=el.value;const p=LG.root.querySelector('.lg-preview');if(p)p.innerHTML=crestSVG(LG.draft.crest,{name:LG.draft.team})+clubKitSVG(LG.draft.kit,{no:9});return}
  if(LG_ACT['input:'+k])LG_ACT['input:'+k](el)});
document.addEventListener('keydown',e=>{if(!LG.root)return;
  /* a row that opens a card is a button to the keyboard as well */
  if((e.key==='Enter'||e.key===' ')&&e.target&&e.target.matches&&e.target.matches('[data-lg][role="button"]')){e.preventDefault();e.target.click();return}
  if(e.key==='Escape'&&!(typeof PG!=='undefined'&&PG)){if(LG.sheet){LG.sheet=null;lgPaint()}else if(LG.view!=='match')lgClose()}});
