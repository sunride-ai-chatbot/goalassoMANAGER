/* ====================== RENDER ====================== */
function kitInner(t){return `<path d="M12 6 L16 4 Q20 8 24 4 L28 6 L36 11 L32 18 L29 16 L29 36 L11 36 L11 16 L8 18 L4 11 Z" fill="${t.c1}" stroke="rgba(0,0,0,.4)" stroke-width="1"/><path d="M4 11 L12 6 L11 16 L8 18 Z" fill="${t.c2}" opacity=".85"/><path d="M36 11 L28 6 L29 16 L32 18 Z" fill="${t.c2}" opacity=".85"/><path d="M16 4 Q20 8 24 4 L26 6 Q20 12 14 6 Z" fill="${t.c2}"/><path d="M12 6 L16 4 Q20 8 24 4 L28 6 L36 11 L32 18 L29 16 L29 36 L11 36 L11 16 L8 18 L4 11 Z" fill="url(#kg)" opacity=".35"/>${kitSponsor(t)}`}
function sponsorName(c){return (c&&c.sponsor&&c.sponsor.name)||''}
function sponsorLogoHTML(ref,cls){const b=sponsorBrand(ref);if(!b)return '';return `<span class="sponsor-logo ${cls||''}" style="--sponsor-bg:${b.logoBg}"><img src="${b.logo}" alt="${esc(b.name)}" width="240" height="88" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>${esc(b.name)}</span></span>`}
function sponsorLogoSVG(ref,x,y,w,h,cls){const b=sponsorBrand(ref);if(!b)return '';return `<g class="${cls||'sponsor-mark'}"><title>${esc(b.name)}</title><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h*.12}" fill="${b.logoBg}"/><image href="${b.logo}" x="${x+w*.04}" y="${y+h*.08}" width="${w*.92}" height="${h*.84}" preserveAspectRatio="xMidYMid meet"/></g>`}
function kitSponsor(t,y,fs){const n=sponsorName(t);if(!n)return '';y=y||21.2;fs=fs||3.7;const logo=sponsorLogoSVG(t.sponsor,12,y-4,16,6);if(logo)return logo;const est=n.length*fs*.56;return `<text x="20" y="${y}" text-anchor="middle" font-size="${fs}" font-weight="800" font-family="Heebo, Arial, sans-serif" fill="${inkFor(t.c1||'#888')}" direction="rtl"${est>15?' textLength="15" lengthAdjust="spacingAndGlyphs"':''}>${esc(n)}</text>`}
function kitSVG(t,cls){return `<svg class="kit ${cls||''}" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="kg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient></defs>${kitInner(t)}</svg>`}
function tierClass(o){return o>=75?'t-gold':o>=65?'t-silver':'t-bronze'}
const TIER_G={'t-gold':['#fbea9a','#e2b43a','#9a6d14','#2b1d05'],'t-silver':['#f2f5fa','#b9c2d0','#6e7a92','#1f2733'],'t-bronze':['#efc49c','#b8784a','#64381c','#2b1407']};
const POSB={GK:'GK',DF:'DEF',MF:'MID',FW:'ATT'};
const ATTR_HE={GK:['רפלקסים','תפיסה','מיקום','בעיטה','מהירות','פיזי'],OUT:['קצב','בעיטה','מסירה','דריבל','הגנה','פיזי']};
const ATTR_CLR=['#3b82f6','#eab308','#22c55e','#f97316','#ef4444','#06b6d4'];
function attrBars(p,hidden){const at=attrs(p);const labels=ATTR_HE[p.pos==='GK'?'GK':'OUT'];return `<div class="attrs">${labels.map((l,i)=>{const v=hidden?50:at[i];const pct=Math.round(v/96*100);const c=ATTR_CLR[i];return `<div class="arow"><span class="anum" style="color:${hidden?'var(--muted)':c}">${hidden?'?':at[i]}</span><div class="abar"><i style="width:${pct}%;background:${c}${hidden?'44':''}"></i></div><span class="albl">${esc(l)}</span></div>`}).join('')}</div>`}
const ATTR_OFF={FW:[4,8,-2,4,-18,0],MF:[0,-2,6,4,-4,0],DF:[-2,-14,-2,-6,8,6],GK:[6,4,2,-12,-10,2]};
function attrs(p){let h=(p.id*2654435761)>>>0;const out=[];const off=ATTR_OFF[p.pos]||ATTR_OFF.MF;for(let i=0;i<6;i++){h=(h^(h<<13))>>>0;h=(h^(h>>>17))>>>0;h=(h^(h<<5))>>>0;const noise=(h%11)-5;out.push(clamp(p.ovr+off[i]+noise+((p.ab&&p.ab[i])||0),30,96))}return out}
function playerCardSVG(p,c,opts){
  opts=opts||{};const t=opts.hidden?'t-silver':tierClass(p.ovr);const [g1,g2,g3,ink]=TIER_G[t];const id='pc'+p.id+(opts.k||'');
  const name=esc(opts.full?fullName(p):(p.last||p.first));
  const big=!!opts.big;const H=big?90:100;
  return `<svg class="pc" viewBox="0 0 100 ${H}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g1}"/><stop offset=".55" stop-color="${g2}"/><stop offset="1" stop-color="${g3}"/></linearGradient><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="kg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient></defs>
  <path d="M8 4 H92 Q96 4 96 8 V${H-22} L50 ${H-4} L4 ${H-22} V8 Q4 4 8 4 Z" fill="url(#${id})" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>
  <path d="M8 4 H92 Q96 4 96 8 V${H-22} L50 ${H-4} L4 ${H-22} V8 Q4 4 8 4 Z" fill="url(#${id}s)"/>
  <text x="81" y="26" text-anchor="middle" font-size="${opts.hidden?18:big?21:20}" fill="${ink}">${opts.hidden?'?':p.ovr}</text>
  <text x="81" y="35" text-anchor="middle" font-size="8" fill="${ink}" opacity=".85">${p.pos}</text>
  <svg x="12" y="7" width="60" height="66" viewBox="0 0 240 264" overflow="hidden">${portraitGroup(p,c||playerClub(p)||{},id+'f',{bg:false})}</svg>
  ${big?`<text x="50" y="${H-18}" text-anchor="middle" font-size="10" fill="${ink}" class="nm">${name}</text>`:
  `<text x="50" y="76" text-anchor="middle" font-size="7.5" fill="${ink}" opacity=".85" class="at">${esc(p.nat||'')}</text>`}
  </svg>`;
}
function ovrClass(o){return o>=74?'g':o>=64?'y':o<56?'r':''}
function stars(t){return '★'.repeat(4-t.tier)+'☆'.repeat(t.tier-1)}
function playerRow(p,extra,cls,sub){
  const tags=[];if(G&&G.me&&me().captain===p.id)tags.push(`<span class="tag cap">C</span>`);if(p.inj)tags.push(`<span class="tag bad">פצוע ${p.inj} ש'</span>`);if(!p.inj&&(p.fit??100)<65)tags.push(`<span class="tag warn">עייף ${Math.round(p.fit)}%</span>`);if(p.unhappy)tags.push(`<span class="tag bad">לא מרוצה</span>`);if(p.listed)tags.push(`<span class="tag warn">למכירה</span>`);if(p.susp)tags.push(`<span class="tag warn">מורחק ${p.susp}</span>`);if(p.contract!=null&&p.contract<=1&&!sub)tags.push(`<span class="tag warn">חוזה מסתיים</span>`);if(p.foreign)tags.push(`<span class="tag">${esc(p.nat)}</span>`);
  const known=isKnown(p);const shown=shownOvr(p);
  return `<div class="pl ${cls||''} ${known?tierClass(p.ovr):'t-unk'}" data-pid="${p.id}">${playerPortraitHTML(p,null,'row'+p.id)}<span class="ovr num ${known?'':'unk'}">${shown}</span><span class="pos ${p.pos}">${POSB[p.pos]}</span><div class="name"><b>${esc(fullName(p))}</b><small>${sub||`<span class="it">גיל ${p.age}</span><span class="it">${NIS(p.value)}</span><span class="it">שערים <b class="num">${p.goals}</b></span>`}</small></div>${tags.join('')}${extra||''}</div>`;
}
function windowInfo(){if(!G||!G.cal)return null;const open=WINDOW(G.wk);let rounds=0,weeks=0;let found=false;
  let at=G.cal.length;for(let i=G.wk;i<G.cal.length;i++){if(WINDOW(i)!==open){found=true;at=i;break}weeks++;if(G.cal[i].t==='league')rounds++}
  const summer=!open&&found&&!G.cal.slice(at).some(e=>e.t==='league');
  if(open)return {open,rounds,weeks,txt:!found?'חלון ההעברות פתוח':rounds<=1?'חלון ההעברות נסגר אחרי המחזור הקרוב':`חלון ההעברות נסגר בעוד ${rounds} מחזורים`};
  return {open,rounds,weeks,txt:!found?'החלון ייפתח שוב בקיץ':summer?`חלון הקיץ נפתח בסוף העונה, בעוד ${rounds} ${rounds===1?'מחזור':'מחזורים'}`:rounds<=0?'חלון ההעברות נפתח בשבוע הבא':`חלון ההעברות נפתח בעוד ${rounds} ${rounds===1?'מחזור':'מחזורים'}`}}
function renderTop(){const c=me();try{const wi=windowInfo();const b=$('topWin');if(b&&wi){b.textContent=wi.txt;b.className='winchip '+(wi.open?'open':'closed')+(wi.open&&wi.rounds<=2?' soon':'');b.onclick=()=>{if(G.phase==='play'){G.view='market';render()}}}}catch(e){}$('topKitWrap').innerHTML=kitSVG(c);$('topName').textContent=c.name;$('topMoney').textContent=NIS(c.money);$('topWeek').textContent=`${Math.min(G.wk+1,G.cal.length)}/${G.cal.length}`;$('topPos').textContent=myPos()}
const NAV=[['home','בית','<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>'],['lineup','הרכב','<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/><circle cx="12" cy="12" r="2.5"/></svg>'],['squad','סגל','<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'],['market','העברות','<svg viewBox="0 0 24 24"><path d="M4 7h12l-3-3M20 17H8l3 3"/></svg>'],['club','מועדון','<svg viewBox="0 0 24 24"><path d="M3 21V9l9-6 9 6v12M9 21v-6h6v6"/></svg>'],['table','טבלאות','<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'],['money','כספים','<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h3.5a1.5 1.5 0 0 1 0 3H11a1.5 1.5 0 0 0 0 3h3.5"/></svg>']];
function renderNav(){$('nav').innerHTML=NAV.map(([id,l,s])=>`<button class="${G.view===id?'on':''}" data-view="${id}">${s}${l}</button>`).join('');$('nav').onclick=e=>{const b=e.target.closest('button');if(b&&G.phase==='play'){G.view=b.dataset.view;render()}}}

function render(){
  closeModal();setTimeout(()=>{try{AdSvc.observe()}catch(e){}},50);if(G&&G.paperPop&&G.paperPop.length&&G.phase==='play')setTimeout(()=>{if(G&&G.view==='home'&&!liveTimer)showPaperPop()},80);
  if(!G){renderStart();return}
  if(G.live&&!G.live.settled){startLive(G.live);return}
  if(typeof MP!=='undefined'&&MP.watching&&!MP.watching.done&&document.querySelector('.live-view'))return;   // multiplayer playback on screen
  if(typeof AUD!=='undefined'&&AUD.matchOn)crowdStop(1.2);   // any other screen: the stadium fades out
  $('top').classList.remove('hide');renderTop();
  if(G.phase!=='play'){$('nav').classList.add('hide');const v={contract:viewContract,sponsor:viewSponsor,board:viewBoard,seasonEnd:viewSeasonEnd,fired:viewFired}[G.phase];$('main').innerHTML=`<div class="view">${v()}</div>`;bind();return}
  $('nav').classList.remove('hide');renderNav();
  const v={home:viewHome,lineup:viewLineup,squad:()=>viewSquad()+(squadTab==='youth'?'':loansOutCardHTML()),market:viewMarket,club:viewClub,table:viewTable,money:viewMoney}[G.view]||viewHome;
  $('main').innerHTML=`<div class="view">${v()}</div>`;bind();
  setTimeout(maybeShowQueued,150);
}
function slotsCardHTML(){const rows=[];for(let n=1;n<=SLOTS;n++){const m=slotMeta(n);const cur=curSlot()===n;rows.push(`<div class="slot ${cur?'cur':''}"><button class="slot-pick" data-slotsel="${n}" aria-pressed="${cur}"><b>משבצת ${n}</b><small>${m?`${esc(m.club||'')}${m.season?' · '+esc(m.season):''}${m.wk!=null?' · שבוע '+(m.wk+1):''}${m.t?' · '+new Date(m.t).toLocaleDateString('he-IL'):''}`:'פנויה'}</small></button>${m?`<button class="btn sm" data-slotload="${n}">המשך</button><button class="btn sm sec" data-slotdel="${n}" aria-label="מחק">🗑</button>`:''}</div>`)}
  return `<div class="card"><div class="row between"><h3 class="sec">קריירות</h3><span class="muted tiny">עד ${SLOTS} קריירות במקביל</span></div><div class="slots">${rows.join('')}</div><div class="muted tiny" style="margin-top:6px">משחק כאורח: הקריירות נשמרות בדפדפן הזה. כדי להמשיך במכשיר אחר, שמור בענן (דורש חשבון claude.ai). קריירה חדשה תיפתח במשבצת המסומנת.</div></div>`}
const START_OPEN=5;
function renderStart(){
  $('top').classList.add('hide');$('nav').classList.add('hide');
  const defs=Object.keys(META).map(id=>{const raw=RAW.find(r=>r.id===id);const fb=FALLBACK[id];return {id,name:raw?.name_he||fb.name,stadium:raw?.stadium_he||fb.stadium,cap:raw?.capacity||fb.cap,c1:raw?.colors?.[0]||fb.colors[0],c2:raw?.colors?.[1]||fb.colors[1],n:raw?raw.players.filter(p=>!p.ft_only).length:0,real:!!raw}});
  const strOf=t=>{const raw=RAW.find(r=>r.id===t.id);if(!raw)return 60;const v=raw.players.filter(p=>p.value_m!=null&&!p.ft_only).map(p=>ratingFromValue(p.value_m,p.age)).sort((a,b)=>b-a).slice(0,14);return v.length?Math.round(v.reduce((x,y)=>x+y,0)/v.length):60};
  const ranked=defs.map(t=>({id:t.id,o:strOf(t)})).sort((a,b)=>b.o-a.o);const openIds=new Set(window.__ilmUnlock?ranked.map(x=>x.id):ranked.slice(-START_OPEN).map(x=>x.id));
  $('main').innerHTML=`<div class="view"><div class="hero-top"><span class="brandlogo" role="img" aria-label="GOALASSO מאמן כדורגל"></span><h1>בחר את <span>המועדון שלך</span></h1><p>עונת 2026/27 · מאמן חדש מתחיל מלמטה: מועדון מהליגה הלאומית או מתחתית ליגת העל.<br>הצלחה תביא הצעות ממועדונים גדולים יותר.</p></div>
  <div class="row" style="justify-content:center"><input type="text" id="mgrName" placeholder="שם המנג'ר" maxlength="24" style="width:220px"></div>
  <div class="row between" style="margin:4px 2px 0"><h3 class="sec">ליגת העל · פתוחים לך</h3><span class="muted tiny">תחתית הטבלה</span></div>
  <div class="grid">${ranked.filter(r=>openIds.has(r.id)).reverse().map(r=>defs.find(t=>t.id===r.id)).map(t=>`<button class="teamcard" data-pick="${t.id}" style="--c1:${t.c1};--c2:${t.c2}">${kitSVG(t,'lg')}<b>${esc(t.name)}</b><span class="ov num">${strOf(t)}</span><small>${esc(t.stadium)} · ${t.cap.toLocaleString('he')}</small><small>${t.real?`${t.n} שחקנים`:'סגל מדומה'}</small></button>`).join('')}</div>
  <div class="card" style="margin-top:4px"><div class="row between"><h3 class="sec">ליגה לאומית · 16 מועדונים</h3><button class="btn sm sec" id="toggleLeumit">הסתר</button></div><div class="muted small" style="margin-top:4px">התחל מלמטה: תקציב קטן, סגלים מדומים, ויעד אחד: לעלות לליגת העל.</div>
  <div class="grid" id="leumitGrid" style="margin-top:10px">${LEUMIT16.map(t=>`<button class="teamcard" data-pick="${t.id}" style="--c1:${t.c1};--c2:${t.c2}">${kitSVG(t,'lg')}<b>${esc(t.name)}</b><span class="ov num">${t.str}</span><small>${esc(t.stadium)} · ${t.cap.toLocaleString('he')}</small><small>ליגה לאומית</small></button>`).join('')}</div></div>
  ${ranked.some(r=>!openIds.has(r.id))?`<div class="card"><div class="row between"><h3 class="sec">נעולים בתחילת הקריירה</h3><span class="muted tiny">${ranked.filter(r=>!openIds.has(r.id)).length} מועדונים</span></div><div class="muted small" style="margin-top:4px">המועדונים הגדולים לא לוקחים מאמן בלי רזומה. תוצאות טובות מעלות את המוניטין שלך, ואז מגיעות הצעות עבודה באמצע העונה או בסופה.</div><div class="lockrow">${ranked.filter(r=>!openIds.has(r.id)).map(r=>defs.find(t=>t.id===r.id)).map(t=>`<button class="lockchip" data-locked="${t.id}" aria-disabled="true">${kitSVG(t)}<span>${esc((META[t.id]&&META[t.id].short)||t.name)}</span><svg class="lk" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></button>`).join('')}</div></div>`:''}
  ${migrationNoticeHTML()}${mpStartHTML()}${slotsCardHTML()}${cloudBoxHTML()}
  <p class="muted tiny" style="text-align:center">GOALASSO מאמן כדורגל · גרסה 2.6 · סגלים ישראליים: וואלה ספורט / footballtransfers · 41 מועדונים אירופיים עם סגלים אמיתיים (footballtransfers) · דירוגים נגזרים משווי השוק</p></div>`;
  $('main').onclick=e=>{const mpb=e.target.closest('[data-mpa]');if(mpb)return mpUiAction(mpb.dataset.mpa,mpb);if(e.target.closest('#cloudLoad'))return cloudLoad();const lx=e.target.closest('[data-legacyexport]');if(lx)return exportLegacy(+lx.dataset.legacyexport);const ll=e.target.closest('[data-legacyload]');if(ll)return loadLegacy(+ll.dataset.legacyload);if(e.target.closest('#migrationRetry'))return retryMigration();if(e.target.closest('#toggleLeumit')){const g=$('leumitGrid');g.classList.toggle('hide');e.target.closest('#toggleLeumit').textContent=g.classList.contains('hide')?'הצג':'הסתר';return}const sl=e.target.closest('[data-slotload]');if(sl){const n=+sl.dataset.slotload;setCurSlot(n);G=null;Promise.resolve(load(n)).then(ok=>{if(ok){cloud.meta=null;cloudRefreshMeta()}else toast('הטעינה נכשלה');render()});return}const sd=e.target.closest('[data-slotdel]');if(sd){const n=+sd.dataset.slotdel;openModal(`<h3 class="sec">למחוק את משבצת ${n}?</h3><p class="small muted">הקריירה במשבצת הזו תימחק מהדפדפן. שמירה בענן, אם יש, לא נמחקת כאן.</p><div class="actions"><button class="btn danger" id="slotDelGo">מחק</button><button class="btn sec" data-close>ביטול</button></div>`,ev=>{if(ev.target.closest('#slotDelGo')){deleteSlot(n);closeModal();render()}});return}const ss=e.target.closest('[data-slotsel]');if(ss){setCurSlot(+ss.dataset.slotsel);cloud.meta=null;cloudRefreshMeta();render();return}
    const lk=e.target.closest('[data-locked]');if(lk)return toast('מועדון גדול לא לוקח מאמן בלי רזומה. התחל בליגה הלאומית או בתחתית ליגת העל, והצעות יגיעו.');const b=e.target.closest('[data-pick]');if(b){const n=curSlot();const go=()=>{newGame(b.dataset.pick,$('mgrName')?$('mgrName').value.trim():'');G.slot=n;ensureCareerIdentity(G);save({force:true});render()};if(slotMeta(n)){openModal(`<h3 class="sec">משבצת ${n} תפוסה</h3><p class="small">קריירה חדשה תחליף את השמירה במשבצת ${n}. אפשר לבחור משבצת אחרת למעלה.</p><div class="actions"><button class="btn danger" id="ovGo">החלף</button><button class="btn sec" data-close>ביטול</button></div>`,ev=>{if(ev.target.closest('#ovGo')){closeModal();go()}});return}go()}};
}

/* ---------- phases ---------- */
function viewContract(){
  const c=me();const w=G.manager.wage;
  return `<div class="card contract"><h2 style="font-size:24px;color:var(--accent)">חוזה העסקה</h2>
  <div class="row">${kitSVG(c,'lg')}<div><h3 class="sec">${esc(c.name)}</h3><div class="muted small">${c.nick?esc(c.nick)+' · ':''}${c.founded?'נוסדה '+c.founded+' · ':''}${esc(c.stadium)}, ${c.cap.toLocaleString('he')} מקומות</div><div class="muted small">מקום ${c.prestige} בדירוג היוקרה · שווי סגל ${NIS(c.squadValue)}</div></div></div>
  <dl class="kv"><dt>המנג'ר</dt><dd>${esc(G.manager.name)}</dd><dt>תקופת החוזה</dt><dd>2 עונות</dd><dt>שכר</dt><dd class="num"><b>${NIS(w)}</b> לשבוע (${NIS(w*46)} לעונה)</dd><dt>בונוס עמידה ביעד</dt><dd class="num">${NIS(w*12)}</dd><dt>תקציב העברות</dt><dd class="num">${NIS(c.money)}</dd><dt>יעד ההנהלה</dt><dd><b>${esc(G.board.expectText)}</b></dd><dt>הבעלים</dt><dd>${ownerOf(c).he}</dd>${c.euro?`<dt>אירופה העונה</dt><dd>${COMP_HE[c.euro.comp]} (${STAGE_HE[c.euro.stage]})</dd>`:''}</dl>
  <div class="muted small">ההנהלה מודדת אותך לפי היעד. אמון ההנהלה מתחיל ב-55 מתוך 100; הבעלים ה${ownerOf(c).he} מפטר מתחת ל-${ownerOf(c).fire}. ${esc(ownerOf(c).desc)}</div>
  <div class="sig">${esc(G.manager.name)}</div>
  <div class="actions"><button class="btn big" id="signBtn">חתום על החוזה</button></div></div>`;
}
function viewSponsor(){
  const c=me();if(!G.sponsorOffers||G.sponsorOffers.some(o=>o.catalogVersion!==1))G.sponsorOffers=sponsorOffers(c);
  return `<div class="card"><h2 style="font-size:22px;color:var(--accent)">הצעות חסות לעונת ${seasonLabel()}</h2><div class="muted small" style="margin-top:4px">50 מפרסמים במאגר. ההצעות מותאמות לגודל המועדון ומוצגות בסכום שנתי. המועדון שלך: ${esc(c.name)}.</div></div>
  ${G.sponsorOffers.map((o,i)=>`<div class="offer">${sponsorLogoHTML(o)}<div class="row between"><h3 class="sec"><bdi>${esc(o.name)}</bdi></h3><span class="tag info">${esc(o.kind)}</span></div><div class="sum num">${NIS(o.annual)} <span class="muted small">לשנה · ${o.years} ${o.years>1?'עונות':'עונה'}</span></div><div class="muted small">${esc(o.desc)}</div>${o.bonusTitle?`<div class="small">בונוס אליפות <b class="num">${NIS(o.bonusTitle)}</b> · בונוס אירופה <b class="num">${NIS(o.bonusEuro)}</b></div>`:''}<button class="btn" data-sponsor="${i}">חתום</button></div>`).join('')}`;
}
function viewSeasonEnd(){
  const s=G.summary;if(G.celebrate||s.up){setTimeout(()=>{confetti(5000);SFX.win()},50);G.celebrate=null}
  return `<div class="card"><h2 style="font-size:24px;color:var(--accent)">סיכום עונת ${s.season}</h2>
  <dl class="kv" style="margin-top:10px"><dt>המיקום שלך</dt><dd class="num"><b>${s.pos}</b></dd><dt>יעד ההנהלה</dt><dd>${s.met?'<span class="tag good">הושג</span>':'<span class="tag bad">לא הושג</span>'}</dd><dt>${s.div==='leumit'?'אלופת הלאומית':'אלופה'}</dt><dd>${esc(s.champ)}</dd><dt>זוכת הגביע</dt><dd>${esc(s.cup)}</dd>${s.toto&&s.toto!=='—'?`<dt>גביע הטוטו</dt><dd>${esc(s.toto)}</dd>`:''}<dt>ירדו ליגה</dt><dd>${s.rel.map(esc).join(', ')}</dd>${s.promoted?`<dt>עלו</dt><dd>${s.promoted.map(esc).join(', ')}</dd>`:''}${s.up?'<dt>🎉</dt><dd><b>עלית לליגת העל!</b></dd>':''}${s.down?'<dt>😞</dt><dd><b>ירדת לליגה הלאומית</b></dd>':''}<dt>אירופה</dt><dd>${esc(s.euro)}</dd><dt>פרס ליגה</dt><dd class="num">${NIS(s.prize)}</dd><dt>בונוס אישי</dt><dd class="num">${NIS(s.bonus)}</dd><dt>אמון ההנהלה</dt><dd class="num">${s.conf}/100</dd></dl>
  ${s.contractOver?`<div class="small" style="margin-top:10px">${s.conf>=40?'החוזה הסתיים וההנהלה מציעה הארכה בשנתיים.':'החוזה הסתיים וההנהלה לא מאריכה אותו.'}</div>`:''}
  <div class="actions" style="margin-top:12px"><button class="btn big" id="nextSeasonBtn">לעונת ${(()=>{const y=2026+G.season-1;return `${y}/${String(y+1).slice(2)}`})()}</button></div></div>`;
}
function viewFired(){
  return `<div class="card"><h2 style="font-size:24px;color:var(--bad)">פוטרת</h2><p class="small">ההנהלה איבדה את האמון. יש הצעות עבודה על השולחן:</p>
  <div class="list">${G.jobOffers.map(id=>{const c=club(id);return `<div class="pl" style="cursor:pointer" data-job="${id}">${kitSVG(c)}<div class="name"><b>${esc(c.name)}</b><small>מקום ${c.prestige} ביוקרה · תקציב ${NIS(c.money)}</small></div><span class="btn sm">קבל</span></div>`}).join('')}</div>
  <div class="actions" style="margin-top:10px"><button class="btn danger" id="resetBtn">פרוש ותתחיל משחק חדש</button></div></div>`;
}

/* ---------- main views ---------- */
function eventCard(){
  const c=me();const ev=currentEvent();if(!ev)return `<div class="card"><h2>העונה הסתיימה</h2></div>`;
  const nm=myNextMatch();
  let title,body='';
  if(ev.t==='break'){title=`פגרת נבחרות · ${ev.m}`;body=`<div class="muted small">אין משחק השבוע. פצועים מחלימים, הצעירים מתאמנים.</div>`}
  else if(!nm){title={league:'מחזור '+ev.n,cup:CUP_HE[ev.s],euro:`שבוע אירופי · ${STAGE_HE[ev.stage]}`}[ev.t];body=`<div class="muted small">${ev.t==='cup'?'הקבוצה שלך כבר לא בגביע':'הקבוצה שלך לא משחקת השבוע'} — שבוע אימונים.</div>`}
  else{
    title=nm.label;
    const h=nm.h,a=nm.a;const opp=a?(h.id===G.me?a:h):null;
    const oppName=a?esc(a.name):nm.kind==='euro'?'יריבה אירופית':nm.kind==='friendly'?'יריבה לידידות':'יריבה מהגביע';const subOf=x=>x?(COUNTRY_OF(x)?`${esc(COUNTRY_OF(x))} · כוח ${Math.round(strength(x))}`:`כוח ${Math.round(strength(x))}`):'&nbsp;';const oppSub=subOf(a);
    const venue=a?(nm.neutral?'מגרש ניטרלי':h.id===G.me?esc(c.stadium):`${esc(h.stadium||h.name)}${COUNTRY_OF(h)?' · '+esc(h.city||h.country):''}`):'ההגרלה טרם נערכה';const legNote=nm.firstLeg?` · המשחק הראשון: ${nm.firstLeg[0]}:${nm.firstLeg[1]}`:'';
    body=`<div class="board" style="margin-top:10px"><div class="teams"><div class="tm" style="--c1:${h.c1}">${kitSVG(h,'lg')}<b>${esc(h.name)}</b><small class="muted tiny">${subOf(h)}</small></div><div class="sc"><div class="big num" style="font-size:26px;color:var(--muted)">VS</div><div class="clock" style="font-size:12px">${a?(nm.neutral?'ניטרלי':h.id===G.me?'בית':'חוץ'):'הגרלה'}</div></div><div class="tm" style="--c1:${a?a.c1:'#334'}">${a?kitSVG(a,'lg'):'<span class="kit lg" style="display:grid;place-items:center;font-size:28px;color:var(--muted)">?</span>'}<b>${oppName}</b><small class="muted tiny">${oppSub}</small></div></div><div class="lbl">${venue}${legNote}</div></div>`;
  }
  const actNegs=(G.negs||[]).filter(n=>n.stage==='club'||n.stage==='player').length;const windowTag=(WINDOW(G.wk)?'<span class="tag good">חלון העברות פתוח</span>':'<span class="tag">חלון סגור</span>')+(actNegs?` <span class="tag info">${actNegs} במו"מ</span>`:'');
  return `<div class="card${nm?' ev-hero':''}"><div class="row between wrap"><h2 class="ev-title">${esc(title)}</h2><div>${windowTag} ${c.euro&&c.euro.stage!=='out'?`<span class="tag info">${COMP_HE[c.euro.comp]}</span>`:''}</div></div>
  <div class="muted tiny">שבוע ${G.wk+1} מתוך ${G.cal.length} · עונת ${seasonLabel()}</div>${body}
  <div class="actions" style="margin-top:8px">${mpIsOn()?'<button class="btn sec" id="toLineupBtn">הרכב וטקטיקה</button>':nm?'<button class="btn big" id="toLineupBtn">לבחירת הרכב ולמשחק</button>':'<button class="btn big" id="playBtn">המשך לשבוע הבא</button><button class="btn sec" id="simNext" style="flex:0 0 auto">עד המשחק הבא</button>'}</div></div>${mpIsOn()?mpCardHTML():''}`;
}
function viewHome(){
  const c=me();const xi=bestXI(c);const inj=c.players.filter(p=>p.inj||p.susp);const last=G.results.filter(r=>r.h===G.me||r.a===G.me).slice(-5).reverse();
  let html=eventCard();
  html+=jobOfferCard();html+=storyCardHTML();
  if(G.wk===0&&!G.campDone)html+=`<div class="card hero"><h3 class="sec">מחנה אימונים לפני העונה</h3><div class="small muted" style="margin:6px 0 10px">בחירה אחת לעונה. משפיע על הכושר הגופני, המורל ועל הסיכוי לפציעות בחודש הראשון.</div><div class="list">${[['aut','מחנה באוסטריה','₪1.5M · כושר גופני מלא, מורל +5, פחות פציעות בחודש הראשון',1.5e6],['cyp','מחנה בקפריסין','₪700K · מורל +3, כושר +',7e5],['home','מתאמנים בבית','חינם · בלי בונוסים, הכסף נשאר לשוק',0]].map(([k,t,d])=>`<button class="pl" style="display:block;text-align:right;cursor:pointer" data-camp="${k}"><b>${t}</b><div class="muted tiny" style="margin-top:3px">${d}</div></button>`).join('')}</div></div>`;
  try{html+=goalsCardHTML()}catch(e){}
  const edition=(G.paper||[]).filter(x=>x.s===G.season&&x.wk>=G.wk-1).slice(0,3);const fallback=(G.paper||[]).slice(0,1);
  if(edition.length||fallback.length)html+=paperHTML(edition.length?edition:fallback,{max:3});
  if(G.offers.length)html+=`<div class="card"><h3 class="sec">הצעות לשחקנים שלך</h3><div class="list" style="margin-top:8px">${G.offers.map((o,i)=>{const p=c.players.find(x=>x.id===o.pid);if(!p)return '';return `<div class="pl"><span class="pos ${p.pos}">${POSB[p.pos]}</span><div class="name"><b>${esc(fullName(p))}</b><small>${esc(club(o.from).short)}${club(o.from).lg?' ('+WORLD_LEAGUES[club(o.from).lg].flag+' '+esc(WORLD_LEAGUES[club(o.from).lg].name)+')':''} מציעה <b class="num">${NIS(o.fee)}</b> (שווי ${NIS(p.value)})</small></div><button class="btn sm" data-accept="${i}">קבל</button><button class="btn sm sec" data-counter="${i}" ${o.countered?'disabled':''}>+15%</button><button class="btn sm sec" data-reject="${i}">דחה</button></div>`}).join('')}</div></div>`;
  const lp=lineupPlayers(c);const probs=lineupProblems(c);
  html+=`<div class="card"><div class="row between"><h3 class="sec">ההרכב · ${esc(c.formation)}</h3><button class="btn sm sec" id="toLineupBtn2">ערוך הרכב</button></div>
  <div class="muted small" style="margin:6px 0 4px">דירוג ממוצע <b class="num">${Math.round(strength(c))}</b> · זרים ${lp.filter(p=>p&&p.foreign).length}/${MAX_FOREIGN_XI}${inj.length?` · לא זמינים: ${inj.map(p=>esc(p.last||p.first)).join(', ')}`:''}</div>
  ${probs.length?`<div class="small" style="color:var(--warn)">⚠ ${probs.slice(0,2).map(esc).join(' · ')} (יתוקן אוטומטית לפני המשחק)</div>`:''}
  ${miniPitch(c)}</div>`;
  if(last.length)html+=`<div class="card"><h3 class="sec">תוצאות אחרונות</h3>${last.map(fxRow).join('')}</div>`;
  html+=`<div class="card"><h3 class="sec">חדשות</h3><div class="list" style="margin-top:8px">${G.news.slice(0,8).map(n=>`<div class="pl home-news"><span class="muted">ש${n.wk+1}</span> · ${esc(n.t)}</div>`).join('')||'<div class="muted">אין חדשות</div>'}</div></div>`;
  return html;
}





