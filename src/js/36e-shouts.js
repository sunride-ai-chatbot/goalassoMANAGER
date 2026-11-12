/* ====================== TOUCHLINE SHOUTS + HAPTICS (live screen) ======================
   The manager's voice fills during play (a full charge every 12 match minutes). A shout spends it and changes the next
   six minutes of the match: the effect and its price are in 07-engine.js (shoutAdj / shoutTick). Presentation only here. */
const SHOUTS=[
  {k:'press',he:'לחץ!',tip:'יותר מצבים, שורף כוח',line:'הקבוצה עולה ללחוץ גבוה'},
  {k:'all',he:'כולם קדימה',tip:'הכול או כלום',line:'כולם עולים להתקפה, מאחור נשאר חשוף'},
  {k:'calm',he:'תירגעו',tip:'סוגרים מאחור',line:'הקבוצה מורידה הילוך ומתארגנת'},
  {k:'hold',he:'תחזיקו בכדור',tip:'מעבירים זמן, נחים',line:'מחזיקים בכדור והשעון רץ'}];
function shoutBarHTML(){return `<div class="shouts" id="shoutBar" role="group" aria-label="פקודות מהקווים"><div class="sh-head"><span>הקול שלך</span><div class="sh-meter" aria-hidden="true"><i id="voiceFill"></i></div></div><div class="sh-row">${SHOUTS.map(s=>`<button type="button" class="sh-btn" data-shout="${s.k}" disabled><b>${s.he}</b><small>${s.tip}</small></button>`).join('')}</div></div>`}
/* how long the highlights speed stays on a minute, by what happened in it (shared by the full game and the beginner mode) */
function hlHoldMs(evs){let ms=0;for(const e of evs){if(e.quiet)continue;const k=e.t==='goal'||e.t==='pen'||e.t==='own'?2600:e.t==='penmiss'||e.t==='red'?2000:e.t==='shot'&&(e.sub==='save'||e.sub==='post')?1500:e.t==='inj'||e.t==='var'?1200:e.t==='yellow'?500:e.t==='sub'?400:0;if(k>ms)ms=k}return ms}
function shoutMount(M,o){const bar=$('shoutBar');if(!bar)return null;
  const paint=()=>{const v=clamp(M.voice||0,0,100),act=shoutOf(M,G.me),ready=v>=100&&!o.busy();
    const f=$('voiceFill');if(f)f.style.width=v+'%';bar.classList.toggle('ready',ready);
    bar.querySelectorAll('[data-shout]').forEach(b=>{const on=!!act&&act.k===b.dataset.shout;b.disabled=!ready;b.classList.toggle('on',on);if(on)b.dataset.left=String(Math.max(0,act.until-M.m));else delete b.dataset.left})};
  bar.onclick=e=>{const b=e.target.closest('[data-shout]');if(!b||b.disabled||(M.voice||0)<100||o.busy())return;const s=SHOUTS.find(x=>x.k===b.dataset.shout);if(!s)return;
    shoutStart(M,G.me,s.k);M.voice=0;buzz('tap');o.addLine('note',`📣 ${fm(M.m)} ${s.he} · ${s.line}`);paint();(o.save||save)()};
  paint();return paint}
/* a goal of ours while "לחץ!" or "כולם קדימה" is running: say so (and count it for the career book) */
function shoutCredit(M,e,addLine){const s=shoutOf(M,G.me);if(!s||e.team!==G.me||(s.k!=='press'&&s.k!=='all'))return;M.shoutGoals=(M.shoutGoals||0)+1;addLine('note',`📣 הצעקה עבדה: שער בזמן "${SHOUTS.find(x=>x.k===s.k).he}"`)}

/* ---- haptics: a short vibration on the moments that matter (Android browsers; iOS Safari has no vibration API) ---- */
const BUZZ={tap:12,goal:[70,50,140],conceded:35,card:60,kick:25,save:[40,30,90],win:[60,60,60,60,220],open:[20,40,20]};
function buzz(k){try{if(typeof G==='undefined'||!G||G.haptic===false||typeof navigator==='undefined'||!navigator.vibrate)return false;return navigator.vibrate(BUZZ[k]||12)}catch(e){return false}}
