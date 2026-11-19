/* ====================== SPLASH / TITLE SCREEN ====================== */
function latestSlot(){let best=null;for(let n=1;n<=SLOTS;n++){const m=slotMeta(n);if(m&&(!best||(m.t||0)>(best.m.t||0)))best={n,m}}return best}
function emptySlot(){const c=curSlot();if(!slotMeta(c)&&!G)return c;for(let n=1;n<=SLOTS;n++)if(!slotMeta(n))return n;return 0}
function splashMetaLine(m){if(!m)return '';const bits=[m.club,m.season,m.wk!=null?'שבוע '+(m.wk+1):''].filter(Boolean);return bits.map(esc).join(' · ')}
/* The full game: regular / network. The beginner page is the entry page of everything: a career (a new coach writes his name
   here, a returning one continues) and "משחק רשת", which opens the two ways to play with friends — a penalty duel on two
   phones or a shared league; when this phone is already in a league, that button says which ("המשך ליגת …", from
   League.saved()). The league had a large button of its own on the page as well and the owner took it out: it is one press
   away. Network play lives here and nowhere else: the league screen and the home screen of a career used to carry a card for each. */
let SP_NET=false;
function renderSplash(){const ui=$('spUI');if(!ui)return;const beg=!!window.BEGINNER,fresh=beg&&!(G&&G.beginner);let lg=null;try{lg=beg&&typeof League!=='undefined'&&League.saved?League.saved():null}catch(e){}
 ui.innerHTML=beg?`${fresh?`<label class="sp-name" for="spName"><span>שם המאמן</span><input id="spName" maxlength="24" autocomplete="name" enterkeyhint="go" placeholder="איך קוראים לך?"></label><div class="sp-err" id="spErr" role="alert"></div>`:''}<button type="button" class="sp-btn sp-new" id="spRegular">${fresh?'התחל קריירה':'המשך קריירה'}</button><button type="button" class="sp-btn sp-cont" id="spNetwork" aria-expanded="${SP_NET}" aria-controls="spNet">משחק רשת</button><div class="sp-net" id="spNet"${SP_NET?'':' hidden'}><button type="button" class="sp-sub" id="spPens"><b>פנדלים</b><small>דו־קרב מול חבר, כל אחד בטלפון שלו</small></button><button type="button" class="sp-sub${lg?' has':''}" id="spLg"><b>ליגה משותפת</b><small>${lg?(lg.name?`המשך ליגת <bdi>${esc(lg.name)}</bdi>`:'המשך לליגה שלי'):'<bdi>2</bdi> עד <bdi>8</bdi> חברים בליגה אחת'}</small></button></div><div class="sp-tag">${fresh?'הקבוצה שלך. הדרך שלך.':'הקריירה שלך מחכה לך'}</div><a class="sp-link" href="index.html">למשחק הפרו</a>`
  :`<button type="button" class="sp-btn sp-new" id="spRegular">משחק רגיל</button><button type="button" class="sp-btn sp-cont" id="spNetwork">משחק רשת</button><div class="sp-tag">${G?'הקריירה שלך מחכה לך':'הקבוצה שלך. הדרך שלך.'}</div>`;
}
const INTRO={mp4:'assets/launch.mp4',poster:'assets/launch-poster.jpg'};let INTRO_R=null;
function playIntro(sp){endIntro(true);const card=sp.querySelector('.sp-card');if(!card)return;
 const box=document.createElement('div');box.className='sp-launch';
 box.innerHTML=`<video muted loop playsinline preload="metadata" poster="${INTRO.poster}" aria-hidden="true" src="${INTRO.mp4}"></video>`;
 card.prepend(box);const v=box.querySelector('video');v.muted=true;INTRO_R={box,v};
 if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){const p=v.play();p?.catch(()=>{});}
}
function endIntro(){const r=INTRO_R;if(!r)return;INTRO_R=null;r.v.pause();r.v.removeAttribute('src');r.v.load();r.box.remove()}
let SP_HIDE=0;
function showSplash(){const sp=$('splash');if(!sp)return;clearTimeout(SP_HIDE);sp.classList.remove('hide','out');document.body.style.overflow='hidden';renderSplash();playIntro(sp);
 sp.onclick=e=>{if(e.target.closest('#spNetwork')){if(window.BEGINNER){SP_NET=!SP_NET;const b=$('spNetwork'),n=$('spNet');if(b)b.setAttribute('aria-expanded',String(SP_NET));if(n){n.hidden=!SP_NET;if(SP_NET)$('spPens')?.focus({preventScroll:true})}return}hideSplash();void Rooms.open();return}
 if(e.target.closest('#spPens')){hideSplash();pcupOpen({only:'net',back:true});return}
 if(e.target.closest('#spLg')){hideSplash();void League.open({back:true});return}
 if(e.target.closest('#spRegular')){if(window.BEGINNER){if(typeof BsplashGo==='function'&&!BsplashGo())return;hideSplash();return}if(G){hideSplash();return}if(cloud.ready&&cloud.meta){hideSplash();return cloudLoad()}splashNew()}};
 sp.onkeydown=e=>{if(e.key==='Enter'&&e.target.id==='spName'){e.preventDefault();$('spRegular')?.click()}};
 $('spRegular')?.focus({preventScroll:true});
}
document.addEventListener('visibilitychange',()=>{const r=INTRO_R;if(!r)return;if(document.hidden)r.v.pause();else if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)r.v.play()?.catch(()=>{})});
function hideSplash(){const sp=$('splash');if(!sp||sp.classList.contains('hide'))return;endIntro(true);sp.classList.add('out');document.body.style.overflow='';clearTimeout(SP_HIDE);SP_HIDE=setTimeout(()=>{sp.classList.add('hide')},460);SFX&&SFX.tap&&SFX.tap()}
function splashOpen(){const sp=$('splash');return !!(sp&&!sp.classList.contains('hide')&&!sp.classList.contains('out'))}
function startFreshIn(n){setCurSlot(n);G=null;cloud.meta=null;try{cloudRefreshMeta()}catch(e){}hideSplash();render();window.scrollTo(0,0)}
function splashNew(){if(!G&&!latestSlot())return startFreshIn(curSlot());const free=emptySlot();if(free)return startFreshIn(free);
  const rows=[];for(let n=1;n<=SLOTS;n++){const m=slotMeta(n);rows.push(`<button class="slot-pick" data-spover="${n}" style="width:100%;margin-top:6px"><b>משבצת ${n}</b><small>${splashMetaLine(m)}${m&&m.t?' · '+new Date(m.t).toLocaleDateString('he-IL'):''}</small></button>`)}
  const d=openModal(`<h3 class="sec">כל המשבצות תפוסות</h3><p class="small">בחר איזו קריירה להחליף. הקריירה שתבחר תימחק ולא ניתן לשחזר אותה.</p>${rows.join('')}<div class="actions"><button class="btn sec" data-close>ביטול</button></div>`,e=>{const ow=e.target.closest('[data-spover]');if(ow){const n=+ow.dataset.spover;closeModal();startFreshIn(n)}});
  const md=document.querySelector('.modal-bg,.modal');if(md)md.style.zIndex=90}

