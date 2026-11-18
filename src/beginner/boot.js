/* The beginner page starts here: every other file of src/beginner is declared above (see BEGINNER_JS in src/build.py). */
try{const s=localStorage.getItem('goalasso.beginner.sort');if(s==='ovr'||s==='desc')Bsort=s}catch(e){}   /* the market opens in the order he last chose */
Bload();if(G?.beginner?.live)G.beginner.live.paused=true;Brender();/* the recorded stadium is decoded after the first tap, as in the full game: without it the crowd is only the
   synthesized fallback */
document.addEventListener('pointerdown',function unlock(){try{if(typeof audPreload==='function')audPreload()}catch(e){}document.removeEventListener('pointerdown',unlock)},{once:true});try{updateWatch()}catch(e){}try{pcupFromLink()}catch(e){}try{BdailyFromLink()}catch(e){}window.BEGINNER={get state(){return G},create:Bcreate,render:Brender,play:Bplay,save:Bwrite};

if(!window.__ilmNoSplash&&!Rooms.arrival())showSplash();
Rooms.boot();League.boot();
/* The bottom bar and the keyboard (phones). While a name is being typed the bar is put away: it has no business above a
   keyboard. And when the keyboard has gone, the page is made to measure the screen again — a home-screen app on an iPhone
   can stay laid out for the height it had with the keyboard up, which leaves a bar that is fixed to the bottom floating in
   the middle of the list. Three small things, none of which can be seen when nothing is wrong: the class, a scroll to
   where the page already is, and --bnav-fix, the distance from the page's idea of the bottom to the screen's (never
   negative, never while typing or zoomed). */
(function(){const vv=window.visualViewport,root=document.documentElement;
  const typing=()=>{const a=document.activeElement;return !!(a&&(a.tagName==='TEXTAREA'||(a.tagName==='INPUT'&&!/^(button|checkbox|radio|range|submit|file|color)$/i.test(a.type||'text'))))};
  const pin=()=>{let d=0;try{if(vv&&!typing()&&Math.abs((vv.scale||1)-1)<.01){d=Math.round(vv.offsetTop+vv.height-window.innerHeight);if(d<4||d>700)d=0}}catch(e){d=0}root.style.setProperty('--bnav-fix',d+'px')};
  const settle=()=>{const t=typing();document.body.classList.toggle('bkb',t);if(!t){try{const y=window.scrollY||0;window.scrollTo(0,y+1);window.scrollTo(0,y)}catch(e){}}pin()};
  document.addEventListener('focusin',()=>{document.body.classList.toggle('bkb',typing())});
  document.addEventListener('focusout',e=>{const t=e.target;if(!t||!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||''))return;setTimeout(settle,60);setTimeout(settle,450)});   /* only after a field: a scroll that a button started is left alone */
  if(vv){vv.addEventListener('resize',()=>{pin();setTimeout(pin,320)});vv.addEventListener('scroll',pin)}
  window.BnavSettle=settle;
})();

