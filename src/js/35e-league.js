/* ===================== SHARED LEAGUE — lobby and identity =====================
   Several managers in one league, each building a club out of one shared pool of real players. The server owns
   the money and the pool (`supabase/migrations/..._shared_league.sql`): the client never sends a price, only
   which player it wants, so a changed page cannot buy a star for a shekel.

   This file is the lobby and the identity: create a league, invite by link, join, name the club, draw its crest
   and its kit. The market, the fixtures and the season come next; nothing here plays a match.

   The identity lives in this browser: an anonymous session is taken quietly (the server only ever asks that the
   caller has an id of its own and never reads an address), exactly as the invitation rooms do. */
const League=(()=>{
 let client=null,modal=null,generation=0,busy=false,poll=null,state=null,draft=null,view='lobby';
 const KEY='goalasso.league.id';
 const api=async()=>client||(client=await (window.__lgClientFactory?window.__lgClientFactory():mpClient()));
 async function rpc(name,args){const c=await api(),r=await c.rpc(name,args);if(r.error)throw r.error;return r.data}
 const saved=()=>{try{return localStorage.getItem(KEY)||''}catch(e){return ''}};
 const remember=id=>{try{id?localStorage.setItem(KEY,id):localStorage.removeItem(KEY)}catch(e){}};
 const invited=()=>{try{return new URL(location.href).searchParams.get('league')||''}catch(e){return ''}};
 const linkFor=inv=>{try{const u=new URL(location.href);u.search='';u.searchParams.set('league',inv);return u.href}catch(e){return '?league='+inv}};
 function clearInvite(){try{const u=new URL(location.href);u.searchParams.delete('league');history.replaceState(null,'',u.href)}catch(e){}}
 const money=n=>'₪'+Math.round((+n||0)/1e5)/10+'M';   /* plain, for a status line */
 const cash=n=>`<bdi dir="ltr">${money(n)}</bdi>`;   /* a sum inside Hebrew keeps its own direction */
 const ERR={login_required:'צריך להתחבר לשירות לפני פתיחת ליגה.',invalid_name:'שם הליגה צריך להיות בין תו אחד ל־60.',invalid_team:'שם המועדון צריך להיות בין תו אחד ל־40.',invalid_capacity:'מספר המנהלים צריך להיות בין 2 ל־8.',too_many_leagues:'יש לך כבר עשר ליגות פתוחות. סגור אחת לפני שתפתח חדשה.',invitation_expired:'ההזמנה פגה או אינה תקינה.',league_started:'הליגה כבר יצאה לדרך ואי אפשר להצטרף אליה.',team_taken:'מישהו בליגה כבר לקח את השם הזה.',league_full:'הליגה מלאה.',not_a_member:'אין לחשבון הזה גישה לליגה.',invalid_crest:'הסמל אינו תקין.',invalid_kit:'המדים אינם תקינים.',no_money:'אין מספיק כסף בקופה.'};
 const err=e=>ERR[String(e&&e.message||e)]||String(e&&e.message||e);
 const mine=()=>(state&&state.members||[]).find(m=>m.mine)||null;

 const entry=()=>'<button type="button" class="btn lg-entry" data-lg-open>ליגה משותפת · כמה מנהלים</button>';
 const intro=()=>`<section class="card lg-intro"><h3>ליגה משותפת</h3><p>עד שמונה מנהלים, מאגר שחקנים אחד. כל אחד בונה מועדון משלו: שם, סמל, מדים וסגל — ומי שחתם על שחקן, הוא שלו.</p>${entry()}</section>`;
 function boot(){if(invited()||saved())void open()}

 function close(){generation++;clearTimeout(poll);poll=null;modal?.remove();modal=null;busy=false;draft=null}
 function message(s){const el=document.getElementById('lg-status');if(el)el.textContent=s||''}
 function paint(html){const el=document.getElementById('lg-body');if(el)el.innerHTML=html}

 async function open(){close();const gen=generation;
  modal=document.createElement('div');modal.className='lg-overlay';
  modal.innerHTML='<section class="lg-dialog" role="dialog" aria-modal="true" aria-label="ליגה משותפת"><button type="button" class="lg-close" data-lg="close" aria-label="סגור">×</button><h2>ליגה משותפת</h2><div id="lg-body">מתחבר לשירות…</div><p id="lg-status" role="status" aria-live="polite"></p></section>';
  document.body.appendChild(modal);
  try{
   if(!mpAvailable()&&!window.__lgClientFactory){paint('<p>שירות הרשת לא מוגדר בבנייה הזו.</p>');return}
   const c=await api(),s=await c.auth.getSession();if(gen!==generation)return;
   if(s.error)throw s.error;
   if(!s.data?.session){if(!c.auth.signInAnonymously){paint('<p>הדפדפן הזה לא הצליח לפתוח חיבור לשירות.</p>');return}
    message('נכנס…');const r=await c.auth.signInAnonymously();if(gen!==generation)return;
    if(r.error){paint('<p>לא הצלחנו לפתוח חיבור לשירות. נסה שוב מאוחר יותר.</p>');message(err(r.error));return}message('')}
   await refresh(gen)}
  catch(e){message(err(e))}}

 async function refresh(gen){
  if(saved()){try{state=await rpc('lg_get',{p_league:saved()});if(gen!==generation)return;render();schedule(gen);return}
   catch(e){if(/not_a_member|invitation_expired/.test(String(e.message||e)))remember('');else{message(err(e))}}}
  state=null;await lobby(gen)}
 function schedule(gen){clearTimeout(poll);poll=setTimeout(async()=>{if(gen!==generation||view!=='board')return schedule(gen);
  try{state=await rpc('lg_get',{p_league:saved()});if(gen!==generation)return;render()}catch(e){}schedule(gen)},20000)}

 /* ---- lobby ---- */
 async function lobby(gen){view='lobby';const inv=invited();let card='';
  if(inv){try{const p=await rpc('lg_preview_invitation',{p_invitation:inv});if(gen!==generation)return;
    card=`<div class="lg-invite"><strong>${esc(p.league)}</strong><span>הזמנה מ${esc(p.team||'המארח')} · <bdi>${p.members}</bdi> מתוך <bdi>${p.capacity}</bdi> מנהלים</span>${p.full?'<em>הליגה כבר מלאה או יצאה לדרך.</em>':''}</div>`;
    if(!p.full){paint(`${card}<label>שם המועדון שלך<input id="lg-team" maxlength="40" placeholder="הפועל הצפון"></label><button type="button" class="btn" data-lg="join">הצטרף לליגה</button><p class="lg-or">או פתח ליגה משלך</p>${createHTML()}`);return}}
   catch(e){card=`<div class="lg-invite"><em>${esc(err(e))}</em></div>`}}
  paint(card+createHTML())}
 const createHTML=()=>`<div class="lg-create"><label>שם הליגה<input id="lg-name" maxlength="60" placeholder="ליגת החברים"></label><label>שם המועדון שלך<input id="lg-team2" maxlength="40" placeholder="הפועל הצפון"></label><label>כמה מנהלים<select id="lg-cap">${[2,3,4,5,6,7,8].map(n=>`<option value="${n}"${n===4?' selected':''}>${n}</option>`).join('')}</select></label><button type="button" class="btn" data-lg="create">פתח ליגה וקבל קישור הזמנה</button></div>`;

 /* ---- the board ---- */
 function render(){if(!state)return;view='board';
  const me=mine(),link=state.invitation?linkFor(state.invitation):'';
  paint(`<div class="lg-head"><strong>${esc(state.name)}</strong><span><bdi>${state.members.length}</bdi> מתוך <bdi>${state.capacity}</bdi> מנהלים · ${state.phase==='build'?'בונים סגלים':'עונה '+state.season}</span></div>
  ${link?`<div class="lg-share"><label>קישור הזמנה<input id="lg-link" readonly dir="ltr" value="${esc(link)}"></label><button type="button" class="btn sec" data-lg="copy">העתק</button></div>`:''}
  <ul class="lg-members">${state.members.map(m=>`<li class="${m.mine?'is-me':''}">
    <span class="lg-crest">${crestSVG(m.crest||crestDefault(hash(m.team)),{name:'',label:'סמל '+m.team})}</span>
    <span class="lg-kit">${clubKitSVG(m.kit||kitDefault(hash(m.team)))}</span>
    <span class="lg-who"><strong>${esc(m.team)}</strong><small>${m.host?'מארח · ':''}<bdi>${m.squad}</bdi> שחקנים</small></span>
    <span class="lg-money">${cash(m.money)}</span></li>`).join('')}</ul>
  <div class="lg-actions"><button type="button" class="btn" data-lg="identity">המועדון שלי · שם, סמל ומדים</button><button type="button" class="btn sec" data-lg="leave">צא מהליגה בטלפון הזה</button></div>
  <p class="small">הקופה והמאגר מנוהלים בשרת. שחקן שנחתם שייך למנהל אחד בלבד בליגה.</p>`)}
 const hash=s=>{let h=2166136261;for(const ch of String(s||''))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h>>>0};

 /* ---- identity ---- */
 function identity(){const me=mine();if(!me)return;view='identity';
  draft=draft||{team:me.team,crest:Object.assign({},me.crest||crestDefault(hash(me.team))),kit:Object.assign({},me.kit||kitDefault(hash(me.team)))};
  const charge=Math.max(0,crestTierCost(draft.crest.tier)-crestTierCost((me.crest||{}).tier||'free'))
              +Math.max(0,kitTierCost(draft.kit.tier)-kitTierCost((me.kit||{}).tier||'plain'));
  const opts=crestOptions(hash(draft.team)+ (draft.roll||0)*7,6);
  paint(`<div class="lg-id">
   <div class="lg-preview">${crestSVG(draft.crest,{name:draft.team,label:'תצוגה מקדימה של הסמל'})}${clubKitSVG(draft.kit,{no:9})}</div>
   <label>שם המועדון<input id="lg-team3" maxlength="40" value="${esc(draft.team)}" data-lg-input="team"></label>
   <fieldset><legend>הסמל</legend>
    <div class="lg-tiers">${[['free','מוכן',0],['custom','לפי בחירה',1e6],['premium','מוזהב',2e6]].map(([t,l,c])=>`<button type="button" class="lg-tier${draft.crest.tier===t?' on':''}" data-lg="ctier" data-v="${t}">${l}${c?`<small>${cash(c)}</small>`:'<small>חינם</small>'}</button>`).join('')}</div>
    ${draft.crest.tier==='free'
      ?`<div class="lg-opts">${opts.map((o,i)=>`<button type="button" class="lg-opt" data-lg="cpick" data-v="${i}">${crestSVG(Object.assign({},o,{tier:'free'}),{name:'',label:'אפשרות '+(i+1)})}</button>`).join('')}</div><button type="button" class="btn sec" data-lg="croll">הצע סמלים אחרים</button>`
      :`<div class="lg-parts">
        <div class="lg-part"><span>צורה</span>${CREST_SHAPES.map(v=>`<button type="button" class="lg-chip${draft.crest.shape===v?' on':''}" data-lg="cset" data-k="shape" data-v="${v}">${CREST_SHAPE_HE[v]}</button>`).join('')}</div>
        <div class="lg-part"><span>חלוקה</span>${CREST_DIVS.map(v=>`<button type="button" class="lg-chip${draft.crest.div===v?' on':''}" data-lg="cset" data-k="div" data-v="${v}">${CREST_DIV_HE[v]}</button>`).join('')}</div>
        <div class="lg-part"><span>סמל</span>${CREST_EMBLEMS.map(v=>`<button type="button" class="lg-chip ic${draft.crest.emblem===v?' on':''}" data-lg="cset" data-k="emblem" data-v="${v}" aria-label="${CREST_EMBLEM_HE[v]}"><svg viewBox="-22 -22 44 44" aria-hidden="true"><g fill="currentColor" stroke="currentColor">${crestEmblem(v)}</g></svg></button>`).join('')}</div>
        <div class="lg-part"><span>צבעים</span>${CREST_PALETTES.map((p,i)=>`<button type="button" class="lg-chip sw${draft.crest.c1===p[0]&&draft.crest.c2===p[1]?' on':''}" data-lg="cpal" data-v="${i}" aria-label="ערכת צבעים ${i+1}"><i style="background:${p[0]}"></i><i style="background:${p[1]}"></i></button>`).join('')}</div>
       </div>`}
   </fieldset>
   <fieldset><legend>המדים</legend>
    <div class="lg-tiers">${[['plain','חלק',0],['pattern','עם דוגמה',5e5],['premium','מוזהב',2e6]].map(([t,l,c])=>`<button type="button" class="lg-tier${draft.kit.tier===t?' on':''}" data-lg="ktier" data-v="${t}">${l}<small>${c?cash(c):'חינם'}</small></button>`).join('')}</div>
    ${draft.kit.tier==='plain'?'':`<div class="lg-part">${KIT_PATTERNS.filter(p=>p!=='solid').map(v=>`<button type="button" class="lg-chip${draft.kit.pattern===v?' on':''}" data-lg="kset" data-k="pattern" data-v="${v}">${KIT_PATTERN_HE[v]}</button>`).join('')}</div>`}
    <div class="lg-part"><span>צבעים</span>${CREST_PALETTES.map((p,i)=>`<button type="button" class="lg-chip sw${draft.kit.c1===p[0]&&draft.kit.c2===p[1]?' on':''}" data-lg="kpal" data-v="${i}" aria-label="ערכת צבעים ${i+1}"><i style="background:${p[0]}"></i><i style="background:${p[1]}"></i></button>`).join('')}</div>
   </fieldset>
   <p class="lg-charge">${charge?`השינוי יחויב ב־${cash(charge)} מתוך ${cash(me.money)}. דרגה נקנית פעם אחת ואינה מוחזרת.`:'ללא עלות.'}</p>
   <div class="lg-actions"><button type="button" class="btn" data-lg="save">שמור</button><button type="button" class="btn sec" data-lg="back">חזרה</button></div>
  </div>`)}
 const CREST_SHAPE_HE={shield:'מגן',kite:'חוד',block:'מלבן',disc:'עיגול'};
 const CREST_DIV_HE={solid:'אחיד',half:'חצוי',pale:'פס אמצעי',quarter:'רבעים',bend:'אלכסון',chevron:'שברון',stripes:'פסים'};
 const CREST_EMBLEM_HE={ball:'כדור',star:'כוכב',crown:'כתר',anchor:'עוגן',bolt:'ברק',flame:'להבה',tower:'מגדל',bridge:'גשר',wave:'גל',lion:'אריה'};
 const KIT_PATTERN_HE={stripes:'פסים',hoops:'טבעות',sash:'אלכסון',halves:'חצוי',sleeves:'שרוולים'};

 /* ---- one listener for the whole screen ---- */
 document.addEventListener('click',async e=>{
  if(e.target.closest('[data-lg-open]')){void open();return}
  const btn=e.target.closest('[data-lg]');if(!btn||!modal)return;
  const a=btn.dataset.lg,v=btn.dataset.v,k=btn.dataset.k,gen=generation;
  if(a==='close'){close();return}
  if(a==='back'){draft=null;render();return}
  if(a==='identity'){identity();return}
  if(a==='copy'){const i=document.getElementById('lg-link');try{await navigator.clipboard.writeText(i.value);message('הקישור הועתק. שלח אותו לחברים.')}catch(x){i.select();message('סמן והעתק את הקישור.')}return}
  if(a==='croll'){draft.roll=(draft.roll||0)+1;identity();return}
  if(a==='cpick'){Object.assign(draft.crest,crestOptions(hash(draft.team)+(draft.roll||0)*7,6)[+v],{tier:'free'});identity();return}
  if(a==='cset'){draft.crest[k]=v;identity();return}
  if(a==='kset'){draft.kit[k]=v;identity();return}
  if(a==='cpal'){const p=CREST_PALETTES[+v];draft.crest.c1=p[0];draft.crest.c2=p[1];draft.crest.ink=p[2];identity();return}
  if(a==='kpal'){const p=CREST_PALETTES[+v];draft.kit.c1=p[0];draft.kit.c2=p[1];identity();return}
  if(a==='ctier'){draft.crest.tier=v;identity();return}
  if(a==='ktier'){draft.kit.tier=v;if(v!=='plain'&&draft.kit.pattern==='solid')draft.kit.pattern='stripes';identity();return}
  if(a==='leave'){remember('');state=null;draft=null;await lobby(gen);message('יצאת מהליגה בטלפון הזה. הקישור עדיין פותח אותה.');return}
  if(busy)return;busy=true;btn.disabled=true;
  try{
   if(a==='create'){const name=document.getElementById('lg-name').value.trim(),team=document.getElementById('lg-team2').value.trim(),cap=+document.getElementById('lg-cap').value;
    const r=await rpc('lg_create',{p_name:name,p_team:team,p_capacity:cap});if(gen!==generation)return;
    remember(r.id);clearInvite();await refresh(gen);message('הליגה נפתחה. שלח את קישור ההזמנה.')}
   else if(a==='join'){const team=document.getElementById('lg-team').value.trim();
    const r=await rpc('lg_join',{p_invitation:invited(),p_team:team});if(gen!==generation)return;
    remember(r.id);clearInvite();await refresh(gen);message('הצטרפת לליגה.')}
   else if(a==='save'){const team=(document.getElementById('lg-team3').value||'').trim();
    const r=await rpc('lg_set_identity',{p_league:saved(),p_team:team,p_crest:draft.crest,p_kit:draft.kit});if(gen!==generation)return;
    draft=null;state=await rpc('lg_get',{p_league:saved()});render();
    message(r.charged?`נשמר. חויבת ב־${money(r.charged)}.`:'נשמר.')}}
  catch(x){message(err(x))}
  finally{busy=false;if(btn.isConnected)btn.disabled=false}});
 document.addEventListener('input',e=>{const el=e.target.closest('[data-lg-input="team"]');if(!el||!draft)return;draft.team=el.value;
  const p=document.querySelector('.lg-preview');if(p)p.innerHTML=crestSVG(draft.crest,{name:draft.team})+clubKitSVG(draft.kit,{no:9})});

 return {entry,intro,open,close,boot,get state(){return state}}
})();
