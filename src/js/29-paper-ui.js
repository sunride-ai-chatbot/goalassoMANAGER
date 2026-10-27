/* ====================== NEWSPAPER POP-UP (fictional in-game journalism) ====================== */
function paperIllu(st){const t=club(st.team)||me();const k=st.kind;const icon=/אליפ|זכתה|עולה|גביע/.test(st.h)&&!/הדחה/.test(st.h)?'trophy':k==='העברות'?'pen':k==='כספים'||k==='מסחרי'?'deal':/פיטר|אולטימטום|שחור|הדחה/.test(st.h)?'storm':'portrait';
  const art={trophy:`<path d="M38 18h24v10a12 12 0 0 1-24 0z" fill="#3a352c"/><path d="M38 21h-7a7 7 0 0 0 7 9M62 21h7a7 7 0 0 1-7 9" fill="none" stroke="#3a352c" stroke-width="2.2"/><rect x="46" y="40" width="8" height="8" fill="#3a352c"/><rect x="39" y="48" width="22" height="5" rx="1" fill="#3a352c"/>`,
   pen:`<rect x="24" y="30" width="44" height="30" rx="2" fill="#efe5cf" stroke="#3a352c" stroke-width="1.5"/><path d="M30 40h30M30 46h22M30 52h14" stroke="#7a705f" stroke-width="1.4"/><path d="M58 52l18-22 4 3-18 22-5 2z" fill="#3a352c"/>`,
   deal:`<path d="M20 44l14-10 10 4 10-6 14 4 12 10-10 8-12-6-10 8-12-4z" fill="#3a352c"/><circle cx="50" cy="26" r="7" fill="none" stroke="#3a352c" stroke-width="2"/><text x="50" y="30" text-anchor="middle" font-size="9" fill="#3a352c">₪</text>`,
   storm:`<path d="M28 34a10 10 0 0 1 19-5 9 9 0 0 1 17 4 7 7 0 0 1-1 14H31a7 7 0 0 1-3-13z" fill="#3a352c"/><path d="M48 50l-5 9h6l-4 9" fill="none" stroke="#3a352c" stroke-width="2.2"/>`,
   portrait:`<circle cx="50" cy="28" r="9" fill="#3a352c"/><path d="M32 60a18 16 0 0 1 36 0z" fill="#3a352c"/>`}[icon];
  return `<svg viewBox="0 0 100 70" class="pp-illu"><defs><pattern id="ht" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".7" fill="#8f856f" opacity=".45"/></pattern></defs><rect width="100" height="70" fill="#e4d9bf"/><rect width="100" height="70" fill="url(#ht)"/><g transform="translate(0 0)">${art}</g><g transform="translate(74 6) scale(.42)">${kitInner(t).replace('url(#kg)','none')}</g></svg>`}
function paperQuote(st){const m=st.body&&st.body.match(/"([^"]{8,90})"/);if(m)return m[1];const k=st.kind;const pool=k==='העברות'?['אני כאן כדי לנצח תארים.','זה מועדון עם קהל מטורף, לא יכולתי לסרב.','הגיע הזמן לאתגר חדש.']:k==='כספים'||k==='מסחרי'?['זו שותפות ארוכת טווח.','אנחנו גאים להיות חלק מהדרך.']:/פיטר|אולטימטום|שחור/.test(st.h)?['ננתח מה השתבש ונתקן.','אני לוקח אחריות מלאה.']:['זה רק ההתחלה.','עבודה קשה משתלמת.'];return pick(pool)}
/* ====================== NEWSPAPER · front-page component ======================
   Stories are stored at publication time with structured `ev` data (names, clubs, terms as they were then), so the
   archive never rewrites history. Presentation only: opening or closing a paper never touches the event itself. */
const NP_IMG={manager:['np-manager',900,600],stage:['np-stage',400,267],champ:['np-champ',900,600],cup:['np-cup',900,600],ashdod:['np-ashdod',863,561]};
const NP_RIBBON={loanOut:'יוצא בהשאלה',appoint:'מינוי חדש',sign:'רכש חדש',loan:'רכש חדש · השאלה',sale:'יוצא מהמועדון',sponsor:'עסקים וספורט',champ:'לילה של אלופים',cup:'לילה של גביע'};
function npSeasonOf(st){const y=2026+(st.s||1)-1;return `${y}/${String(y+1).slice(2)}`}
function npTypeOf(st){if(st.ev&&st.ev.type)return st.ev.type;const h=st.h||'';if(/אלופת המדינה/.test(h))return 'champ';if(/זכתה בגביע|זכתה ב.*גביע/.test(h))return 'cup';return null}
function npImage(st){const t=npTypeOf(st),ev=st.ev||{};
  if(t==='champ')return {k:'champ',cap:'חגיגות האליפות · אילוסטרציה'};if(t==='cup')return {k:'cup',cap:'הגביע מונף · אילוסטרציה'};
  if(t==='appoint')return ev.clubId==='l_ash'?{k:'ashdod',cap:'רגע החתימה · אילוסטרציה'}:{k:'manager',cap:'בדרך אל הדשא · אילוסטרציה'};
  if(t==='sign'||t==='loan'||t==='sale'||t==='loanOut')return {k:'stage',shirt:true,cap:t==='sale'||t==='loanOut'?'רגע הפרידה · אילוסטרציה':'במת ההצגה · אילוסטרציה'};
  if(t==='sponsor')return {k:'stage',board:ev.sponsor,cap:'מעמד ההכרזה · אילוסטרציה'};
  const k=st.kind;if(k==='העברות'||k==='כספים'||k==='מסחרי')return {k:'stage',cap:'אילוסטרציה'};return {k:'manager',cap:'אילוסטרציה'}}
function npShirtFor(st){const ev=st.ev||{};const id=ev.type==='sale'?ev.buyerId:ev.type==='loanOut'?ev.toId:(ev.clubId||st.team);const c=club(id);return c||null}
function npPlayerOf(ev){if(!ev||ev.pid==null||!G)return null;const all=[...G.clubs,...G.leumit,...Object.values(G.pseudo||{}),...Object.values(G.world||{}).flatMap(l=>l.clubs||[])];for(const c of all){const p=[...c.players,...(c.youth||[])].find(x=>x.id===ev.pid);if(p)return {p,c}}return null}
function npFaceHTML(st){const ev=st.ev||{};let hit=npPlayerOf(ev);
  // a sold / loaned-out player may no longer exist in any club: the story keeps his own visual id, never another's
  if(!hit&&ev.vid&&PLAYER_VISUALS.faces[ev.vid])hit={p:{id:ev.pid,first:ev.player||'',last:'',pos:ev.pos||'MF',visualId:ev.vid},c:null};
  if(!hit||!playerVisual(hit.p))return '';const c=npShirtFor(st)||hit.c||club(st.team)||me();const id='npf'+String(ev.pid)+Math.random().toString(36).slice(2,5);
  return `<div class="np-face"><svg viewBox="0 0 240 300" aria-hidden="true">${portraitGroup(hit.p,c,id,{bg:false,h:300})}</svg></div>`}
function npFigure(st,lazy){const im=npImage(st);const [f,w,h]=NP_IMG[im.k];const ev=st.ev||{};const face=im.shirt?npFaceHTML(st):'';const c=im.shirt&&!face?npShirtFor(st):null;
  return `<figure class="np-fig"><div class="np-ph"><picture><source srcset="${f}.webp" type="image/webp"><img src="${f}.jpg" width="${w}" height="${h}" alt="" ${lazy?'loading="lazy" ':''}decoding="async" onerror="this.closest('.np-ph').classList.add('np-noimg')"></picture>
   ${face}${c?`<div class="np-shirt">${shirtSVG(c,ev.type==='sale'?null:ev.no,'np'+Math.random().toString(36).slice(2,6))}</div>`:''}${im.board?`<div class="np-board">${sponsorLogoHTML(im.board)||`<bdi>${esc(im.board)}</bdi>`}</div>`:''}</div>
   <figcaption><b>${esc(im.cap.split(' · ')[0])}:</b> ${esc(im.cap.split(' · ')[1]||'')}</figcaption></figure>`}
const yrs=n=>n==null?null:`${n} ${n>1?'עונות':'עונה'}`;
function npFacts(st){const ev=st.ev||{},t=npTypeOf(st);const c=club(st.team)||null;const F=[];const add=(l,v)=>{if(v!=null&&v!=='')F.push([l,v])};
  if(t==='appoint'){add('החוזה',yrs(ev.years));add('המועדון',ev.club);add('היעד',ev.goal)}
  else if(t==='sign'){add('עמדה',ev.pos&&POSHE[ev.pos]);add(ev.free?'סוג העסקה':'דמי העברה',ev.free?'שחקן חופשי':(ev.fee!=null?NIS(ev.fee):null));add('החוזה',yrs(ev.years))}
  else if(t==='loan'){add('מועדון האם',ev.parent);add('משך',ev.until?`עד סוף ${ev.until}`:null);if(ev.buy)add('אופציית רכישה',NIS(ev.buy));else add('מועדון קולט',ev.club)}
  else if(t==='loanOut'){add('המועדון המקבל',ev.to);add('עד',ev.until?`סוף ${ev.until}`:null);add('עמדה',ev.pos&&POSHE[ev.pos])}
  else if(t==='sale'){add('הקונה',ev.buyer);add('הסכום',ev.fee!=null?NIS(ev.fee):null);add('גיל',ev.age!=null?String(ev.age):null)}
  else if(t==='sponsor'){add('נותן החסות',ev.sponsor);add('לעונה',ev.annual!=null?NIS(ev.annual):null);add('משך',yrs(ev.years))}
  else if(t==='champ'){add('העונה',ev.season);add('נקודות',ev.pts!=null?String(ev.pts):null);add('סגנית',ev.second)}
  else if(t==='cup'){add('המפעל',ev.comp);add('תוצאת הגמר',ev.score?`${ev.score}${ev.pens?' (פנדלים)':''}`:null);add('היריבה',ev.opp)}
  if(F.length<3){add('המועדון',c?(c.short||c.name):null);add('המדור',st.kind);add('העונה',npSeasonOf(st))}
  const seen=new Set();return F.filter(([l])=>!seen.has(l)&&seen.add(l)).slice(0,3)}
function npTeaser(st,live){if(live){try{const nx=myNextMatch();if(nx)return `המשחק הבא: ${nx.h.id===G.me?'נגד '+nx.a.short:'ב'+nx.h.short}`}catch(e){}}
  const t=npTypeOf(st);return {appoint:'האתגר הבא: בניית הסגל',sign:'האתגר הבא: מקום בהרכב',loan:'האתגר הבא: להוכיח את עצמו',sale:'האתגר הבא: למלא את החסר',sponsor:'האתגר הבא: להחזיר על ההשקעה',champ:'האתגר הבא: להגן על התואר',cup:'האתגר הבא: עוד תואר'}[t]||'עוד בעיתון: הכתבות של השבוע'}
function npSplit(text){const parts=String(text||'').split(/(?<=[.!?״"])\s+/).filter(Boolean);if(parts.length<2)return [text||'',''];const half=Math.ceil(parts.length/2);return [parts.slice(0,half).join(' '),parts.slice(half).join(' ')]}
function npQuote(st){const m=st.body&&st.body.match(/"([^"]{8,90})"/);if(m)return m[1];return st.q||null}
function frontPageHTML(st,o){o=o||{};const t=npTypeOf(st);const c=club(st.team);const [b1,b2]=npSplit(st.body);const q=npQuote(st)||(st.ev&&st.ev.q)||null;
  const ribbon=NP_RIBBON[t]||st.kind;const by=st.by||'מאת הכתב הספורטיבי';
  return `<article class="np" dir="rtl" aria-labelledby="npH">
   <header class="np-head"><div class="np-brand"><span class="np-logo" dir="ltr"><b>GOAL</b><i>ASSO</i></span><small>מהדורת המועדון</small></div>
    <div class="np-title">${PAPER_NAME}</div>
    <div class="np-meta"><span>עונת <bdi dir="ltr">${npSeasonOf(st)}</bdi> · שבוע ${st.wk+1}</span><span class="np-red" aria-hidden="true"></span><span>${esc(o.label||(st.demo?'הדגמה':'מהדורה מיוחדת'))}</span></div></header>
   <div class="np-ribbon">${esc(ribbon)}</div>
   <h2 class="np-hl" id="npH">${esc(st.h)}</h2>${st.sub?`<p class="np-sub">${esc(st.sub)}</p>`:''}
   ${npFigure(st,o.lazy)}
   <div class="np-cols ${b2?'':'one'}"><div class="np-text"><p class="np-by">${esc(by)}</p><p>${esc(b1)}</p>${b2?`<p>${esc(b2)}</p>`:''}</div>${q?`<blockquote class="np-q"><p>"${esc(q)}"</p><footer>מתוך הסיקור הבדיוני של המשחק</footer></blockquote>`:''}</div>
   <dl class="np-facts">${npFacts(st).map(([l,v])=>`<div><dt>${esc(l)}</dt><dd><bdi>${esc(v)}</bdi></dd></div>`).join('')}</dl>
   <div class="np-banner"><span>${esc(npTeaser(st,!st.demo&&o.live))}</span><svg viewBox="0 0 40 20" aria-hidden="true"><path d="M22 3l-7 7 7 7M34 3l-7 7 7 7" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
   <footer class="np-foot">חדשות מתוך עולם המשחק</footer></article>`}
/* ---- modal: own dialog (focus, Escape, scroll lock, safe areas). Never mutates the story's event. ---- */
let NPM=null;
/* the masthead is one word-pair that must never clip: shrink it until it fits the column (fallback fonts are wider than Karantina) */
function fitMasthead(root){const el=root&&root.querySelector('.np-title');if(!el)return;el.style.fontSize='';let fs=parseFloat(getComputedStyle(el).fontSize)||48;let guard=0;while(el.scrollWidth>el.clientWidth+1&&fs>22&&guard++<14){fs*=.93;el.style.fontSize=fs.toFixed(1)+'px'}}
function openFrontPage(st,opts){opts=opts||{};closeFrontPage(true);const prevFocus=document.activeElement;const sy=window.scrollY;
  const root=document.createElement('div');root.id='npModal';root.className='npm';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','npH');
  const nextN=opts.queue?G.paperPop.length:0;
  root.innerHTML=`<div class="npm-scroll"><button class="npm-x" type="button" data-npclose aria-label="סגור">✕</button>${frontPageHTML(st,{live:opts.live,lazy:false})}</div>
   <div class="npm-bar">${nextN?`<button class="btn" type="button" data-npnext>לכתבה הבאה (${nextN})</button>`:''}<button class="btn ${nextN?'sec':''}" type="button" data-npclose>סגור</button>${opts.queue?`<button class="btn sec" type="button" data-npoff>בלי פופ-אפים של עיתון</button>`:''}</div>`;
  document.body.appendChild(root);const lockPrev=document.body.style.overflow;document.body.style.overflow='hidden';fitMasthead(root);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>fitMasthead(root));
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();closeFrontPage()}else if(e.key==='Tab'){const f=[...root.querySelectorAll('button')];if(!f.length)return;const i=f.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus()}}};
  const onClick=e=>{const t=e.target;if(t===root||t.closest('[data-npclose]'))return closeFrontPage();if(t.closest('[data-npnext]')){closeFrontPage(true);return showPaperPop()}if(t.closest('[data-npoff]')){G.paperPopOff=true;G.paperPop=[];save();closeFrontPage();toast('אפשר להפעיל שוב בהגדרות')}};
  document.addEventListener('keydown',onKey);root.addEventListener('click',onClick);
  NPM={root,onKey,onClick,prevFocus,lockPrev,sy};setTimeout(()=>{const b=root.querySelector('.npm-bar .btn');try{b&&b.focus({preventScroll:true})}catch(e){}},30)}
function closeFrontPage(silent){const m=NPM;NPM=null;if(!m)return;document.removeEventListener('keydown',m.onKey);m.root.removeEventListener('click',m.onClick);m.root.remove();document.body.style.overflow=m.lockPrev||'';try{window.scrollTo(0,m.sy)}catch(e){}if(!silent){try{m.prevFocus&&m.prevFocus.focus&&m.prevFocus.focus({preventScroll:true})}catch(e){}}}
function showPaperPop(){if(!G||!G.paperPop||!G.paperPop.length||$('modal')||revealOpen||NPM)return;const st=G.paperPop.shift();save();openFrontPage(st,{queue:true,live:true})}
function openArchiveStory(i){const st=(G.paper||[])[i];if(st)openFrontPage(st,{live:false})}
/* ---- previews: demo data only, nothing saved ---- */
function paperDemo(type){if(!G)return;const c=me();const base={wk:G.wk,s:G.season,team:c.id,demo:true};const other=G.clubs.find(x=>x.id!==G.me&&x.league)||c;const p=c.players.slice().sort((a,b)=>b.ovr-a.ovr)[0];
  const D={
   appoint:{kind:'מועדון',h:`${G.manager.name} חתם ב${c.name}`,sub:`חוזה לשתי עונות. המטרה: ${G.board.expectText}`,body:`${c.name} הציגה היום את המנג'ר החדש. ההנהלה הציבה יעד ברור: ${G.board.expectText}. העבודה מתחילה כבר באימון הקרוב.`,ev:{type:'appoint',manager:G.manager.name,club:c.name,clubId:c.id,years:2,goal:G.board.expectText},q:'באתי לבנות קבוצה שאנשים יתגאו בה'},
   perm:{kind:'העברות',h:`${fullName(p)} חתם ב${c.name}`,sub:`${c.short} שילמה ${NIS(askingPrice(p))} ל${other.short}; חוזה ל-3 עונות`,body:`${fullName(p)}, ${POSHE[p.pos]} בן ${p.age}, הוא הרכש החדש של ${c.name}. הוא צפוי להתחרות על מקום בהרכב כבר במחזור הקרוב.`,ev:{type:'sign',pid:p.id,vid:playerVisualId(p)||null,player:fullName(p),pos:p.pos,age:p.age,no:p.no||null,club:c.name,clubId:c.id,from:other.short,fee:askingPrice(p),years:3}},
   loan:{kind:'העברות',h:`${fullName(p)} בהשאלה ל${c.name}`,sub:`מ${other.short}, לעונה אחת`,body:`${c.name} סגרה השאלה של ${fullName(p)} (${POSHE[p.pos]}, ${p.age}). המנג'ר מאמין שהוא ייכנס להרכב מיד.`,ev:{type:'loan',pid:p.id,vid:playerVisualId(p)||null,player:fullName(p),pos:p.pos,age:p.age,no:p.no||null,club:c.name,clubId:c.id,parent:other.short,until:seasonLabel(),buy:null}},
   sponsor:{kind:'כספים',h:`${c.name} חתמה עם ${SPONSORS[0]}`,sub:`חסות חולצה של ${NIS(1200000)} לעונה ל-2 עונות`,body:`הלוגו של ${SPONSORS[0]} יופיע על חולצת ${c.name} כבר במשחק הבא. במועדון מסבירים שהכסף יופנה לשכר השחקנים ולתשתיות.`,ev:{type:'sponsor',sponsor:SPONSORS[0],club:c.name,clubId:c.id,annual:1200000,years:2}},
   champ:{kind:'ליגה',h:`${c.name} אלופת המדינה ${seasonLabel()}`,sub:'העונה הסתיימה במקום הראשון',body:`${c.name} סיימה את העונה במקום הראשון. חגיגות ענק בעיר.`,ev:{type:'champ',club:c.name,clubId:c.id,season:seasonLabel(),pts:78,second:other.short}},
   cup:{kind:'גביע',h:`${c.name} זכתה בגביע המדינה!`,sub:`2:1 מול ${other.short}`,body:`חגיגות ענק בעיר אחרי השריקה. ${c.name} מניפה את הגביע.`,ev:{type:'cup',comp:'גביע המדינה',club:c.name,clubId:c.id,score:'2:1',opp:other.short,pens:false}}};
  const d=D[type];if(!d)return;openFrontPage({...base,...d},{live:false})}
