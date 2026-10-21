/* ====================== SPLASH / TITLE SCREEN ====================== */
function latestSlot(){let best=null;for(let n=1;n<=SLOTS;n++){const m=slotMeta(n);if(m&&(!best||(m.t||0)>(best.m.t||0)))best={n,m}}return best}
function emptySlot(){const c=curSlot();if(!slotMeta(c)&&!G)return c;for(let n=1;n<=SLOTS;n++)if(!slotMeta(n))return n;return 0}
function splashMetaLine(m){if(!m)return '';const bits=[m.club,m.season,m.wk!=null?'שבוע '+(m.wk+1):''].filter(Boolean);return bits.map(esc).join(' · ')}
function renderSplash(){const ui=$('spUI');if(!ui)return;const has=!!G;const m=has?slotMeta(G.slot||curSlot()):null;const cloudOnly=!has&&cloud.ready&&cloud.meta;const free=emptySlot();
  const chev='<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  ui.innerHTML=`<button class="sp-btn sp-new" id="spNew">${chev}התחל קריירה</button>
  ${has?`<button class="sp-btn sp-cont" id="spCont">המשך משחק<small>${splashMetaLine(m)||esc(me()?me().name:'')}</small></button>`:cloudOnly?`<button class="sp-btn sp-cont" id="spCloud">המשך מהענן<small>${splashMetaLine(cloud.meta)}</small></button>`:''}
  ${has&&free?`<div class="sp-note">קריירה חדשה תיפתח במשבצת ${free}, השמירה הקיימת לא תימחק</div>`:has&&!free?`<div class="sp-note">כל ${SLOTS} המשבצות תפוסות, תתבקש לבחור איזו להחליף</div>`:''}
  <div class="sp-tag">הקבוצה שלך. הדרך שלך.</div>`;
}

/* ---- launch intro video (with sound when the browser allows it) → still title screen with real buttons ---- */
const INTRO={mp4:'intro.mp4',webm:'intro.webm',poster:'intro-poster.jpg'};let INTRO_R=null;
function playIntro(sp){const card=sp.querySelector('.sp-card');if(!card||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))return;
  sp.classList.add('sp-introing');const box=document.createElement('div');box.className='sp-intro';
  box.innerHTML=`<video playsinline webkit-playsinline preload="auto" poster="${INTRO.poster}" aria-hidden="true"><source src="${INTRO.mp4}" type="video/mp4"><source src="${INTRO.webm}" type="video/webm"></video><span class="sp-ifade"></span>
   <button type="button" class="sp-isound" hidden aria-label="הפעל צליל"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>הפעל צליל</span></button>
   <button type="button" class="sp-iskip">דלג</button>`;
  card.appendChild(box);const v=box.querySelector('video');const snd=box.querySelector('.sp-isound');const R={box,v,sp,done:false,t:0};INTRO_R=R;
  const fallback=()=>endIntro();v.addEventListener('ended',fallback);box.querySelector('source:last-of-type').addEventListener('error',fallback);v.addEventListener('error',fallback);
  box.addEventListener('click',e=>{if(e.target.closest('.sp-iskip'))return endIntro();if(v.muted){v.muted=false;snd.hidden=true;try{v.currentTime=0;v.play()}catch(_){}}});
  R.t=setTimeout(()=>{if(!(v.currentTime>0))endIntro()},4000);
  v.muted=false;v.volume=1;const pr=v.play();if(pr&&pr.catch)pr.catch(()=>{v.muted=true;snd.hidden=false;const p2=v.play();if(p2&&p2.catch)p2.catch(fallback)})}
function endIntro(instant){const R=INTRO_R;if(!R||R.done)return;R.done=true;INTRO_R=null;clearTimeout(R.t);try{R.v.pause()}catch(e){}
  R.sp.classList.remove('sp-introing');const go=()=>{try{R.v.removeAttribute('src');R.v.querySelectorAll('source').forEach(x=>x.remove());R.v.load()}catch(e){}R.box.remove()};
  if(instant)return go();R.box.classList.add('out');setTimeout(go,650);setTimeout(()=>{const b=$('spCont')||$('spNew');try{b&&b.focus({preventScroll:true})}catch(e){}},700)}
function showSplash(){const sp=$('splash');if(!sp)return;sp.classList.remove('hide','out');document.body.style.overflow='hidden';renderSplash();playIntro(sp);
  sp.onclick=e=>{const t=e.target;if(t.closest('#spCont'))return hideSplash();if(t.closest('#spCloud')){hideSplash();return cloudLoad()}if(t.closest('#spNew'))return splashNew();const ow=t.closest('[data-spover]');if(ow){const n=+ow.dataset.spover;closeModal();return startFreshIn(n)}}}
function hideSplash(){const sp=$('splash');if(!sp||sp.classList.contains('hide'))return;endIntro(true);sp.classList.add('out');document.body.style.overflow='';setTimeout(()=>{sp.classList.add('hide')},460);SFX&&SFX.tap&&SFX.tap()}
function splashOpen(){const sp=$('splash');return !!(sp&&!sp.classList.contains('hide')&&!sp.classList.contains('out'))}
function startFreshIn(n){setCurSlot(n);G=null;cloud.meta=null;try{cloudRefreshMeta()}catch(e){}hideSplash();render();window.scrollTo(0,0)}
function splashNew(){if(!G&&!latestSlot())return startFreshIn(curSlot());const free=emptySlot();if(free)return startFreshIn(free);
  const rows=[];for(let n=1;n<=SLOTS;n++){const m=slotMeta(n);rows.push(`<button class="slot-pick" data-spover="${n}" style="width:100%;margin-top:6px"><b>משבצת ${n}</b><small>${splashMetaLine(m)}${m&&m.t?' · '+new Date(m.t).toLocaleDateString('he-IL'):''}</small></button>`)}
  const d=openModal(`<h3 class="sec">כל המשבצות תפוסות</h3><p class="small">בחר איזו קריירה להחליף. הקריירה שתבחר תימחק ולא ניתן לשחזר אותה.</p>${rows.join('')}<div class="actions"><button class="btn sec" data-close>ביטול</button></div>`,e=>{const ow=e.target.closest('[data-spover]');if(ow){const n=+ow.dataset.spover;closeModal();startFreshIn(n)}});
  const md=document.querySelector('.modal-bg,.modal');if(md)md.style.zIndex=90}

