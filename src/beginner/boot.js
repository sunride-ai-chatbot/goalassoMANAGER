/* The beginner page starts here: every other file of src/beginner is declared above (see BEGINNER_JS in src/build.py). */
Bload();if(G?.beginner?.live)G.beginner.live.paused=true;Brender();/* the recorded stadium is decoded after the first tap, as in the full game: without it the crowd is only the
   synthesized fallback */
document.addEventListener('pointerdown',function unlock(){try{if(typeof audPreload==='function')audPreload()}catch(e){}document.removeEventListener('pointerdown',unlock)},{once:true});try{updateWatch()}catch(e){}try{pcupFromLink()}catch(e){}try{BdailyFromLink()}catch(e){}window.BEGINNER={get state(){return G},create:Bcreate,render:Brender,play:Bplay,save:Bwrite};

if(!window.__ilmNoSplash&&!Rooms.arrival())showSplash();
Rooms.boot();League.boot();
