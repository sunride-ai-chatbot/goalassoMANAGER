/* ===================== SHARED LEAGUE — the squad, the market, trades =====================
   Everything here is a request. Buying sends a player's key and the server answers with the price it charged;
   a line-up is saved as a list of keys and is worth nothing until a match is locked with it; a trade is an offer
   the other manager accepts, and the server moves both sides together or neither.

   The catalogue is the game's own data (lgCatalog), so the lists, the search and the faces are instant and in
   Hebrew; which of those players are still free is the server's news (`taken`). */
const LG_POS_ORDER={GK:0,DF:1,MF:2,FW:3};
const LG_MENT_HE={att:'התקפי',bal:'מאוזן',def:'הגנתי'};
const LG_TAC_HE={press:'לחץ',width:'רוחב',tempo:'קצב',style:'סגנון'};
function lgT(key){return (LG.state&&LG.state.training&&LG.state.training[key])||0}
function lgOwnerOf(key){const r=(LG.state.squads||[]).find(x=>x.player===key);return r?r.owner:null}
function lgGroundOf(key){const m=lgMember(lgOwnerOf(key));return m?m.ground||0:0}
/* a player as the league sees him now: trained, on his owner's ground */
function lgPlayer(key){const e=lgEntry(key);return e?lgMakePlayer(e,lgT(key),lgGroundOf(key)):null}
/* A face. In a list the photograph is fetched only when its row comes into view: the pictures ship as one pack
   per club (a hundred to four hundred KB), and a market screen of forty players of forty clubs would otherwise
   download fifteen megabytes to draw itself. Until then — and where there is no free photograph of the man at all —
   the row shows the designed monogram. */
function lgFace(p,kit,o){o=o||{};kit=kit||{c1:'#1a2231',c2:'#c6f24e'};const f=playerVisual(p),id='lg'+(o.k||'')+p.id;
  if(o.lazy&&f&&!facePackCache.has(f.pack)){const q={id:p.id,first:p.first,last:p.last,pos:p.pos,visualId:null};
    return `<span class="lg-face${o.cls?' '+o.cls:''}" data-want="${esc(f.pack)}" data-pkey="${esc(p.lgKey)}" data-fid="${esc(id)}" data-c1="${esc(kit.c1)}" data-c2="${esc(kit.c2)}" style="${faceFrameStyle(q)}">${playerPortraitHTML(q,kit,id)}</span>`}
  return `<span class="lg-face${o.cls?' '+o.cls:''}" style="${faceFrameStyle(p)}">${playerPortraitHTML(p,kit,id)}</span>`}
function lgFacesWatch(){if(!LG.root||typeof IntersectionObserver==='undefined')return;
  if(!LG.io)LG.io=new IntersectionObserver(es=>{for(const en of es){if(!en.isIntersecting)continue;LG.io.unobserve(en.target);lgFaceLoad(en.target.dataset.want)}},{rootMargin:'160px'});
  LG.root.querySelectorAll('.lg-face[data-want]').forEach(el=>LG.io.observe(el))}
function lgFaceLoad(pack){if(!pack)return;
  const fill=()=>{if(!facePackCache.has(pack)||!LG.root)return;LG.root.querySelectorAll('.lg-face[data-want]').forEach(el=>{if(el.dataset.want!==pack)return;const e=lgEntry(el.dataset.pkey);el.removeAttribute('data-want');if(!e)return;
    const p=lgMakePlayer(e,0,0);el.setAttribute('style',faceFrameStyle(p));el.innerHTML=playerPortraitHTML(p,{c1:el.dataset.c1,c2:el.dataset.c2},el.dataset.fid)})};
  if(facePackCache.has(pack))return fill();loadFacePack(pack);const rq=facePackRequests.get(pack);if(rq)rq.then(fill,()=>{})}
/* my club, built exactly as a match would build it */
function lgMyClub(){if(LG.clubCache)return LG.clubCache;const s=LG.state,me=lgMe();
  return LG.clubCache=lgBuildClub({team:me.team,kit:me.kit,crest:me.crest,ground:me.ground,setup:LG.setup,squad:(s.squad||[]).map(x=>({p:x.player,t:lgT(x.player)}))},'lgme')}
function lgLineupKeys(){const c=lgMyClub();return c.lineup.map(id=>{const p=c.players.find(x=>x.id===id);return p?p.lgKey:null})}
function lgSetupSave(){LG.clubCache=null;const su=LG.setup,body={formation:su.formation,mentality:su.mentality,tac:su.tac,lineup:su.lineup};const seq=LG.saveSeq=(LG.saveSeq||0)+1,gen=LG.gen;
  lgPaint();lgMsg('שומר…');
  lgRpc('lg_setup',{p_league:lgSaved(),p_setup:body}).then(()=>{if(gen===LG.gen&&seq===LG.saveSeq){if(LG.state)LG.state.setup=body;lgMsg('ההרכב נשמר.')}},x=>{if(gen===LG.gen)lgMsg(lgErr(x))})}

function lgPRowHTML(p,o){o=o||{};const kit=o.kit;const gain=p.lgGain?`<i class="p-gain" title="מאימונים">+${p.lgGain}</i>`:'';
  return `<li class="lg-p${o.cls?' '+o.cls:''}" data-lg="sheet" data-v="${esc(p.lgKey)}" role="button" tabindex="0">
   ${o.slot?`<span class="p-slot pos-${o.slot}">${POSHE[o.slot]}</span>`:''}${lgFace(p,kit,{lazy:true,k:o.k})}
   <span class="p-main"><b>${esc(fullName(p))}</b><small>${o.slot&&o.slot!==p.pos?`<em>לא בעמדה שלו</em> · `:''}${POSHE[p.pos]} · בן <bdi>${p.age}</bdi>${o.from?` · ${esc(p.from)}`:''}</small></span>
   ${o.right||''}<span class="p-ovr"><bdi>${p.ovr}</bdi>${gain}</span></li>`}

/* ---- the squad ---- */
function lgSquadHTML(){const s=LG.state,me=lgMe();
  if(!(s.squad||[]).length)return `<div class="lg-empty"><h3>עוד אין לך שחקנים</h3><p>כל מנהל בונה סגל של 14 עד 22 שחקנים אמיתיים מתוך המאגר המשותף, עם אותו תקציב.</p><div class="lg-actions"><button type="button" class="btn" data-lg="autofill">בנה לי סגל</button><button type="button" class="btn sec" data-lg="tab" data-v="market">לרכש</button></div><p class="lg-note">"בנה לי סגל" בוחר 16 שחקנים מאוזנים בתקציב שלך ומשאיר שישית ממנו בקופה. אפשר להחליף כל אחד מהם אחר כך.</p></div>`;
  const c=lgMyClub(),su=LG.setup,slots=slotsFor(c.formation),kit={c1:c.c1,c2:c.c2};
  const xi=c.lineup.map(id=>c.players.find(p=>p.id===id)||null),inXI=new Set(c.lineup.filter(Boolean));
  const bench=c.players.filter(p=>!inXI.has(p.id)).sort((a,b)=>(LG_POS_ORDER[a.pos]-LG_POS_ORDER[b.pos])||(b.ovr-a.ovr));
  const on=xi.filter(Boolean),avg=on.length?(on.reduce((t,p)=>t+p.ovr,0)/on.length).toFixed(1):'—',left=Math.max(0,3-(s.trained||0)),season=s.phase==='season';
  const G_COST=[1e6,2e6,4e6,7e6,12e6];
  return `<div class="lg-card lg-setup"><div class="lg-rowhead"><h3>מערך וגישה</h3><span class="lg-avg">דירוג ההרכב <b><bdi>${avg}</bdi></b></span></div>
    <div class="lg-part"><span>מערך</span>${Object.keys(FORMATIONS).map(f=>`<button type="button" class="lg-chip${c.formation===f?' on':''}" data-lg="formation" data-v="${f}"><bdi dir="ltr">${f}</bdi></button>`).join('')}</div>
    <div class="lg-part"><span>גישה</span>${Object.keys(LG_MENT_HE).map(m=>`<button type="button" class="lg-chip${su.mentality===m?' on':''}" data-lg="ment" data-v="${m}">${LG_MENT_HE[m]}</button>`).join('')}</div>
    <div class="lg-tacs">${Object.keys(LG_TAC_HE).map(k=>`<label>${LG_TAC_HE[k]}<select data-lg-input="tac" data-k="${k}">${Object.keys(TAC[k]).map(v=>`<option value="${v}"${su.tac[k]===v?' selected':''}>${TAC[k][v]}</option>`).join('')}</select></label>`).join('')}</div></div>
   <div class="lg-card"><div class="lg-rowhead"><h3>ההרכב</h3><button type="button" class="lg-mini" data-lg="auto-xi">${su.lineup?'הרכב אוטומטי':'אוטומטי ✓'}</button></div>
    <ul class="lg-plist">${slots.map((pos,i)=>xi[i]?lgPRowHTML(xi[i],{slot:pos,kit,k:'x'}):`<li class="lg-p empty"><span class="p-slot pos-${pos}">${POSHE[pos]}</span><span class="p-main"><b>מקום ריק</b><small>ישובץ אוטומטית במשחק</small></span></li>`).join('')}</ul>
    <p class="lg-note">נגיעה בשחקן פותחת את הכרטיס שלו: החלפה, אימון ומכירה.</p></div>
   <div class="lg-card"><h3>ספסל · <bdi>${bench.length}</bdi></h3>${bench.length?`<ul class="lg-plist">${bench.map(p=>lgPRowHTML(p,{kit,k:'b'})).join('')}</ul>`:'<p class="lg-note">אין שחקנים על הספסל. סגל רחב יותר נותן חילופים במשחק.</p>'}</div>
   <div class="lg-card"><h3>אימונים</h3>
    ${season?`<p class="lg-train-left"><b><bdi>${left}</bdi></b> ${left===1?'אימון נשאר':'אימונים נשארו'} במחזור הזה</p>`:'<p class="lg-note">אימונים נפתחים עם תחילת העונה: שלושה בכל מחזור, לכל מנהל.</p>'}
    <p class="lg-note">אימון מוסיף נקודת דירוג לשחקן צעיר ופחות למבוגר, ולעולם לא מעבר לתקרה שלו. מי מקבל אותם — זה כל העניין.</p>
    <div class="lg-ground"><span>מגרש אימונים · רמה <b><bdi>${me.ground||0}</bdi></b> מתוך <bdi>5</bdi></span>${(me.ground||0)<5?`<button type="button" class="btn sec" data-lg="ground">שדרג · ${lgCash(G_COST[me.ground||0])}</button>`:'<span class="lg-note">הרמה הגבוהה ביותר</span>'}</div>
    <p class="lg-note">כל רמה מוסיפה <bdi>15%</bdi> לכל אימון של הקבוצה.</p></div>
   ${c.missing?`<p class="lg-note">${c.missing} שחקנים בסגל אינם מוכרים לגרסה הזאת של המשחק. רענן את הדף.</p>`:''}${lgSheetHTML()}`}

/* ---- the player's card ---- */
function lgSheetHTML(){const sh=LG.sheet;if(!sh)return '';const s=LG.state,key=sh.key,e=lgEntry(key);if(!e)return '';
  const owner=lgOwnerOf(key),mineP=owner===s.me,p=lgPlayer(key)||lgMakePlayer(e,0,0),st=lgStats(e,lgT(key),lgGroundOf(key)),me=lgMe();
  let acts='';
  if(mineP){const c=lgMyClub(),cp=c.players.find(x=>x.lgKey===key),inXI=cp&&c.lineup.includes(cp.id),left=Math.max(0,3-(s.trained||0)),room=st.pot-st.ovr;
    const others=c.players.filter(x=>x.lgKey!==key&&c.lineup.includes(x.id)!==inXI).sort((a,b)=>((b.pos===p.pos?100:0)+b.ovr)-((a.pos===p.pos?100:0)+a.ovr));
    acts=`${s.phase==='season'?(room>0?`<button type="button" class="btn" data-lg="train" data-v="${esc(key)}" ${left?'':'disabled'}>אמן אותו · ${left?`נשארו <bdi>${left}</bdi> במחזור`:'אין אימונים במחזור הזה'}</button>`:'<p class="lg-note">הגיע לתקרה שלו: אימון נוסף לא יוסיף.</p>'):''}
     <h4>${inXI?'החלף אותו בשחקן מהספסל':'הכנס אותו להרכב במקום'}</h4>
     ${others.length?`<div class="lg-swaps">${others.map(o=>`<button type="button" class="lg-swap" data-lg="swap" data-v="${esc(o.lgKey)}"><b>${esc(fullName(o))}</b><small>${POSHE[o.pos]}</small><i><bdi>${o.ovr}</bdi></i></button>`).join('')}</div>`:'<p class="lg-note">אין עם מי להחליף.</p>'}
     <button type="button" class="btn sec lg-wide" data-lg="sell" data-v="${esc(key)}">${LG.confirm==='sell:'+key?'לחץ שוב לאישור המכירה':`מכור חזרה למאגר · ${lgCash(Math.floor(e.v*.7))}`}</button><p class="lg-note">מכירה למאגר מחזירה <bdi>70%</bdi> מהמחיר. לקבל יותר אפשר רק ממנהל אחר, בעסקה.</p>`}
  else if(!owner){const full=me.squad>=22,poor=e.v>me.money;
    acts=`<button type="button" class="btn big lg-wide" data-lg="buy" data-v="${esc(key)}" ${full||poor?'disabled':''}>החתם · ${lgCash(e.v)}</button>${full?'<p class="lg-note">הסגל מלא (22). מכור שחקן כדי לפנות מקום.</p>':poor?`<p class="lg-note">חסרים לך ${lgCash(e.v-me.money)}.</p>`:`<p class="lg-note">יישארו לך ${lgCash(me.money-e.v)}.</p>`}`}
  else{const m=lgMember(owner);acts=`<p class="lg-note">שייך ל${esc(m?m.team:'מנהל אחר')}. אפשר להציע עליו עסקה.</p><button type="button" class="btn sec lg-wide" data-lg="offer-for" data-v="${esc(key)}">הצע עסקה</button>`}
  return `<div class="lg-sheet-bg" data-lg="sheet-close"></div><aside class="lg-sheet" role="dialog" aria-label="${esc(e.he)}">
   <button type="button" class="lg-close" data-lg="sheet-close" aria-label="סגור">×</button>
   <div class="lg-sheet-head">${lgFace(p,null,{cls:'big',k:'s'})}<div><h3>${esc(e.he)}</h3><p>${POSHE[e.pos]} · בן <bdi>${st.age}</bdi> · ${esc(e.club)}</p><p class="lg-sheet-en"><bdi dir="ltr">${esc(e.en)}</bdi></p></div><span class="p-ovr big"><bdi>${st.ovr}</bdi></span></div>
   <dl class="lg-facts"><div><dt>שווי</dt><dd>${lgCash(e.v)}</dd></div><div><dt>תקרה</dt><dd><bdi>${st.pot}</bdi></dd></div><div><dt>אימונים</dt><dd><bdi>${lgT(key)}</bdi>${st.gain?` · <bdi dir="ltr">+${st.gain}</bdi>`:''}</dd></div></dl>
   ${portraitCreditHTML(p)}${acts}</aside>`}

/* ---- the market ---- */
function lgMarketRows(){const s=LG.state,mk=LG.mk,taken=new Set(s.taken||[]),me=lgMe(),q=searchNorm(mk.q);
  const C=lgCatalog();if(!C.normed){for(const e of C.list){e.n=searchNorm(e.he+' '+e.en+' '+e.club);e.o=lgStats(e,0,0).ovr}C.normed=true}
  if(mk.face&&!C.faced){for(const e of C.list)e.f=!!playerVisual(lgMakePlayer(e,0,0));C.faced=true}
  let list=C.list.filter(e=>!taken.has(e.key)&&(!mk.pos||e.pos===mk.pos)&&(!mk.mine||e.v<=me.money)&&(!mk.face||e.f)&&(!q||e.n.includes(q)));
  list.sort(mk.sort==='c'?(a,b)=>a.v-b.v:mk.sort==='o'?(a,b)=>(b.o-a.o)||(a.v-b.v):(a,b)=>b.v-a.v);return list}
function lgMarketListHTML(){const me=lgMe(),list=lgMarketRows(),n=LG.mk.n;
  if(!list.length)return '<p class="lg-note">אין שחקן פנוי שמתאים לחיפוש הזה.</p>';
  return `<ul class="lg-plist">${list.slice(0,n).map(e=>{const p=lgMakePlayer(e,lgT(e.key),0);const can=e.v<=me.money&&me.squad<22;
    return lgPRowHTML(p,{lazy:true,from:true,k:'m',right:`<span class="p-price${can?'':' far'}">${lgCash(e.v)}</span>`})}).join('')}</ul>
   ${list.length>n?`<button type="button" class="btn sec lg-wide" data-lg="mk-more">הצג עוד · <bdi>${list.length-n}</bdi> נוספים</button>`:''}`}
function lgMarketHTML(){const s=LG.state,me=lgMe(),mk=LG.mk;
  if(!s.pool)return '<div class="lg-empty"><h3>הרכש עוד לא נפתח</h3><p>רשימת המחירים של השחקנים עדיין לא הותקנה בשרת. בלי מחיר מהשרת אף אחד לא יכול לקנות אף אחד — וזה הצד הבטוח.</p></div>';
  return `<div class="lg-mkhead"><div><b>${lgCash(me.money)}</b><small>בקופה</small></div><div><b><bdi>${me.squad}</bdi><i>/22</i></b><small>בסגל · מינימום 14</small></div><button type="button" class="btn sec" data-lg="autofill" ${me.squad>=16?'disabled':''}>בנה לי סגל</button></div>
   <div class="lg-filters"><input id="lg-q" type="search" placeholder="חיפוש שחקן או מועדון" value="${esc(mk.q)}" data-lg-input="q" autocomplete="off" enterkeyhint="search">
    <div class="lg-part">${[['','הכול'],['GK','שוערים'],['DF','הגנה'],['MF','קישור'],['FW','התקפה']].map(([v,l])=>`<button type="button" class="lg-chip${mk.pos===v?' on':''}" data-lg="mk-pos" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="lg-part">${[['v','היקרים קודם'],['o','הטובים קודם'],['c','הזולים קודם']].map(([v,l])=>`<button type="button" class="lg-chip${mk.sort===v?' on':''}" data-lg="mk-sort" data-v="${v}">${l}</button>`).join('')}<button type="button" class="lg-chip${mk.mine?' on':''}" data-lg="mk-mine">רק מה שבתקציב שלי</button><button type="button" class="lg-chip${mk.face?' on':''}" data-lg="mk-face">רק עם תמונה</button></div></div>
   <div id="lg-mklist">${lgMarketListHTML()}</div>${lgSheetHTML()}`}

/* ---- trades ---- */
function lgNames(keys){return (keys||[]).map(k=>{const e=lgEntry(k);return e?esc(e.he):esc(k)}).join(', ')}
function lgOfferTextHTML(o,mine){const cashIn=o.cash,parts=[];
  /* cash is what the one who offers adds; a negative sum is what he asks for */
  const gives=[lgNames(o.give),cashIn>0?lgCash(cashIn):''].filter(Boolean).join(' + '),wants=[lgNames(o.want),cashIn<0?lgCash(-cashIn):''].filter(Boolean).join(' + ');
  parts.push(`<span><em>${mine?'אתה נותן':'נותן'}</em> ${gives||'כלום'}</span>`);parts.push(`<span><em>${mine?'אתה מקבל':'מבקש'}</em> ${wants||'כלום'}</span>`);return parts.join('')}
function lgTradesHTML(){const s=LG.state,me=lgMe(),inbox=(s.offers||[]).filter(o=>o.to===s.me),sent=(s.offers||[]).filter(o=>o.from===s.me),others=s.members.filter(m=>!m.mine),of=LG.offer;
  let build='';
  if(!others.length)build='<p class="lg-note">כשיצטרפו מנהלים נוספים אפשר יהיה להציע להם עסקאות.</p>';
  else if(!of)build=`<p class="lg-note">בחר מנהל כדי לבנות הצעה: שחקנים תמורת שחקנים, עם כסף או בלי. השרת מעביר את שני הצדדים יחד או אף אחד מהם.</p><div class="lg-part">${others.map(m=>`<button type="button" class="lg-chip lg-mgr" data-lg="offer-to" data-v="${m.id}"><span class="t-crest">${lgCrestOf(m)}</span>${esc(m.team)}</button>`).join('')}</div>`;
  else{const to=lgMember(of.to)||{team:'?'},his=(s.squads||[]).filter(x=>x.owner===of.to).map(x=>lgPlayer(x.player)).filter(Boolean).sort((a,b)=>b.ovr-a.ovr),my=lgMyClub().players.slice().sort((a,b)=>b.ovr-a.ovr);
    const pick=(p,set,act)=>`<button type="button" class="lg-pick${set.has(p.lgKey)?' on':''}" data-lg="${act}" data-v="${esc(p.lgKey)}" aria-pressed="${set.has(p.lgKey)}"><b>${esc(fullName(p))}</b><small>${POSHE[p.pos]} · ${lgCash(p.lgValue)}</small><i><bdi>${p.ovr}</bdi></i></button>`;
    build=`<div class="lg-rowhead"><h4>הצעה ל${esc(to.team)}</h4><button type="button" class="lg-mini" data-lg="offer-cancel">בטל</button></div>
     <h5>אני רוצה ממנו · <bdi>${of.want.size}</bdi></h5><div class="lg-picks">${his.length?his.map(p=>pick(p,of.want,'offer-want')).join(''):'<p class="lg-note">אין לו עדיין שחקנים.</p>'}</div>
     <h5>אני נותן · <bdi>${of.give.size}</bdi></h5><div class="lg-picks">${my.length?my.map(p=>pick(p,of.give,'offer-give')).join(''):'<p class="lg-note">אין לך עדיין שחקנים.</p>'}</div>
     <label>כסף שאני מוסיף, במיליונים (מספר שלילי = אני מבקש כסף)<input id="lg-cashin" type="number" inputmode="decimal" step="0.1" value="${of.cash||''}" placeholder="0" data-lg-input="cash" dir="ltr"></label>
     <button type="button" class="btn lg-wide" data-lg="offer-send" ${of.want.size||of.give.size||of.cash?'':'disabled'}>שלח הצעה</button>`}
  return `<div class="lg-card"><h3>הצעות שקיבלת</h3>${inbox.length?inbox.map(o=>{const m=lgMember(o.from)||{team:'?'};return `<div class="lg-offer"><strong>${esc(m.team)}</strong>${lgOfferTextHTML(o,false)}<div class="lg-actions"><button type="button" class="btn" data-lg="offer-yes" data-v="${o.id}">קבל</button><button type="button" class="btn sec" data-lg="offer-no" data-v="${o.id}">דחה</button></div></div>`}).join(''):'<p class="lg-note">אין הצעות ממתינות.</p>'}</div>
   ${sent.length?`<div class="lg-card"><h3>הצעות ששלחת</h3>${sent.map(o=>{const m=lgMember(o.to)||{team:'?'};return `<div class="lg-offer"><strong>אל ${esc(m.team)}</strong>${lgOfferTextHTML(o,true)}<div class="lg-actions"><button type="button" class="btn sec" data-lg="offer-no" data-v="${o.id}">משוך את ההצעה</button></div></div>`}).join('')}</div>`:''}
   <div class="lg-card"><h3>הצעה חדשה</h3>${build}</div>${lgSheetHTML()}`}

/* ---- actions ---- */
(function(){const Q=(name,fn)=>{fn.quick=true;LG_ACT[name]=fn},keep=()=>{LG.keepScroll=true;lgPaint()};
  Q('sheet',btn=>{LG.sheet={key:btn.dataset.v};LG.confirm=null;keep()});
  Q('sheet-close',()=>{LG.sheet=null;LG.confirm=null;keep()});
  Q('formation',btn=>{LG.setup.formation=btn.dataset.v;LG.setup.lineup=null;lgSetupSave()});
  Q('ment',btn=>{LG.setup.mentality=btn.dataset.v;LG.keepScroll=true;lgSetupSave()});
  Q('auto-xi',()=>{LG.setup.lineup=null;LG.keepScroll=true;lgSetupSave()});
  Q('swap',btn=>{const c=lgMyClub(),a=LG.sheet&&LG.sheet.key,b=btn.dataset.v,keys=lgLineupKeys();const ia=keys.indexOf(a),ib=keys.indexOf(b);
    if(ia>=0&&ib<0)keys[ia]=b;else if(ib>=0&&ia<0)keys[ib]=a;else return;LG.setup.lineup=keys;LG.sheet=null;LG.keepScroll=true;lgSetupSave()});
  Q('mk-pos',btn=>{LG.mk.pos=btn.dataset.v;LG.mk.n=30;lgPaint()});
  Q('mk-sort',btn=>{LG.mk.sort=btn.dataset.v;LG.mk.n=30;lgPaint()});
  Q('mk-mine',()=>{LG.mk.mine=!LG.mk.mine;LG.mk.n=30;lgPaint()});
  Q('mk-face',()=>{LG.mk.face=!LG.mk.face;LG.mk.n=30;lgPaint()});
  Q('mk-more',()=>{LG.mk.n+=30;keep()});
  Q('offer-to',btn=>{LG.offer={to:btn.dataset.v,give:new Set(),want:new Set(),cash:0};lgPaint()});
  Q('offer-for',btn=>{const key=btn.dataset.v;LG.offer={to:lgOwnerOf(key),give:new Set(),want:new Set([key]),cash:0};LG.sheet=null;LG.view='trades';lgPaint()});
  Q('offer-cancel',()=>{LG.offer=null;lgPaint()});
  Q('offer-want',btn=>{const s=LG.offer.want,k=btn.dataset.v;s.has(k)?s.delete(k):s.size<8&&s.add(k);keep()});
  Q('offer-give',btn=>{const s=LG.offer.give,k=btn.dataset.v;s.has(k)?s.delete(k):s.size<8&&s.add(k);keep()});
  LG_ACT['input:q']=el=>{LG.mk.q=el.value;LG.mk.n=30;const box=document.getElementById('lg-mklist');if(box){box.innerHTML=lgMarketListHTML();lgFacesWatch()}};
  LG_ACT['input:tac']=el=>{LG.setup.tac[el.dataset.k]=el.value;LG.keepScroll=true;lgSetupSave()};
  LG_ACT['input:cash']=el=>{if(LG.offer){LG.offer.cash=+el.value||0;const b=LG.root.querySelector('[data-lg="offer-send"]');if(b)b.disabled=!(LG.offer.want.size||LG.offer.give.size||LG.offer.cash)}};
  const L=()=>lgSaved();
  LG_ACT.buy=async(btn,gen)=>{const key=btn.dataset.v,e=lgEntry(key);const r=await lgRpc('lg_buy',{p_league:L(),p_player:key});if(gen!==LG.gen)return;LG.sheet=null;LG.keepScroll=true;await lgReload();lgMsg(`${e?e.he:key} חתם · ${lgMoney(r.paid)}. נשארו ${lgMoney(r.money)}.`)};
  LG_ACT.sell=async(btn,gen)=>{const key=btn.dataset.v;if(LG.confirm!=='sell:'+key){LG.confirm='sell:'+key;LG.keepScroll=true;lgPaint();return}
    LG.confirm=null;const e=lgEntry(key);const r=await lgRpc('lg_sell',{p_league:L(),p_player:key});if(gen!==LG.gen)return;LG.sheet=null;
    if(LG.setup.lineup&&LG.setup.lineup.includes(key)){LG.setup.lineup=LG.setup.lineup.map(k=>k===key?null:k);try{await lgRpc('lg_setup',{p_league:L(),p_setup:LG.setup})}catch(x){}}
    await lgReload();lgMsg(`${e?e.he:key} נמכר · ${lgMoney(r.back)} חזרו לקופה.`)};
  LG_ACT.autofill=async(btn,gen)=>{const r=await lgRpc('lg_autofill',{p_league:L()});if(gen!==LG.gen)return;LG.view='squad';await lgReload();lgMsg(r.bought?`נבנה סגל: ${r.bought} שחקנים חתמו. נשארו ${lgMoney(r.money)}.`:'הסגל כבר מלא מספיק.')};
  LG_ACT.train=async(btn,gen)=>{const key=btn.dataset.v,e=lgEntry(key),before=lgStats(e,lgT(key),lgGroundOf(key)).ovr;await lgRpc('lg_train',{p_league:L(),p_player:key});if(gen!==LG.gen)return;LG.keepScroll=true;await lgReload();
    const after=lgStats(e,lgT(key),lgGroundOf(key)).ovr;lgMsg(after>before?`${e.he} השתפר: ${before} ← ${after}.`:`${e.he} התאמן. השיפור יגיע באימון הבא.`)};
  LG_ACT.ground=async(btn,gen)=>{const r=await lgRpc('lg_ground',{p_league:L()});if(gen!==LG.gen)return;LG.keepScroll=true;await lgReload();lgMsg(`מגרש האימונים עלה לרמה ${r.ground} · ${lgMoney(r.charged)}.`)};
  LG_ACT['offer-send']=async(btn,gen)=>{const o=LG.offer;if(!o)return;await lgRpc('lg_offer',{p_league:L(),p_to:o.to,p_give:[...o.give],p_want:[...o.want],p_cash:Math.round((+o.cash||0)*1e6)});if(gen!==LG.gen)return;LG.offer=null;await lgReload();lgMsg('ההצעה נשלחה.')};
  LG_ACT['offer-yes']=async(btn,gen)=>{await lgRpc('lg_respond',{p_offer:btn.dataset.v,p_accept:true});if(gen!==LG.gen)return;await lgReload();lgMsg('העסקה בוצעה.')};
  LG_ACT['offer-no']=async(btn,gen)=>{await lgRpc('lg_respond',{p_offer:btn.dataset.v,p_accept:false});if(gen!==LG.gen)return;await lgReload();lgMsg('ההצעה נסגרה.')};
})();
