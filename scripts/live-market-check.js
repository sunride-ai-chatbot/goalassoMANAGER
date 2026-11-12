// Phone-size (iPhone 13) check of the deployed game: the transfer market (Real Madrid and Liverpool full squads with faces,
// profiles with photo credit, price sorts, nationality filter, live suggestions, Israeli legionnaires) and live play
// (shouts, a first-person penalty, the career card, the quick tournament).
// Usage: node scripts/live-market-check.js <page URL> <output dir>   (used by .github/workflows/live-check.yml)
const { chromium, devices } = require('playwright');
const BASE=process.argv[2]||'http://127.0.0.1:8765/index.html', OUT=(process.argv[3]||'/tmp/mc')+'/';
require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--no-sandbox']});
 const ctx=await b.newContext({...devices['iPhone 13'],locale:'he-IL'});const page=await ctx.newPage();const errs=[];
 page.on('pageerror',e=>errs.push(String(e).slice(0,200)));page.on('requestfailed',r=>{if(/facepacks/.test(r.url()))errs.push('REQFAIL '+r.url())});
 await page.addInitScript(()=>{window.__ilmNoSplash=1;window.__ilmUnlock=1});
 await page.goto(BASE,{waitUntil:'load'});await page.evaluate(()=>window.ILM.ready);
 for(const s of ['[data-pick="hbs"]','#signBtn','[data-sponsor="0"]','[data-board="none"]']){await page.click(s).catch(()=>{});await page.waitForTimeout(200)}
 await page.evaluate(()=>{document.querySelector('.npm-x')?.click();window.ILM.G.paperPop=[];window.ILM.G.motion='off'});
 const R={};
 const settle=async()=>{await page.evaluate(()=>document.getElementById('toast')?.classList.remove('show'));await page.waitForFunction(()=>![...document.querySelectorAll('.pp')].some(g=>g.getAttribute('data-pp-state')==='loading'),null,{timeout:20000}).catch(()=>errs.push('faces still loading'));await page.waitForTimeout(300)};
 const faces=()=>page.evaluate(()=>{const rows=[...document.querySelectorAll('[data-wrow]')];return {rows:rows.length,nfs:document.querySelectorAll('.pl.nfs').length,
   withFace:rows.filter(r=>r.querySelector('.pp[data-pp-state="ready"] .pp-photo')).length,
   wrongFace:rows.filter(r=>{const g=r.querySelector('.pp[data-visual-id]');if(!g)return false;const f=findWorldPlayer(+r.dataset.wrow)||{p:null};return f.p&&g.getAttribute('data-visual-id')!==playerVisualId(f.p)}).length,
   names:rows.map(r=>r.querySelector('.name b')?.textContent+(r.querySelector('.pp[data-pp-state="ready"]')?' ✓':' –'))}});
 // open market → world
 await page.click('nav [data-v="market"], [data-view="market"]').catch(async()=>{await page.evaluate(()=>{G.view='market';render()})});
 await page.evaluate(()=>{G.view='market';render()});await page.click('[data-mtab="world"]');
 for(const [lg,club,tag] of [['laliga','ריאל מדריד','real-madrid'],['epl','ליברפול','liverpool']]){
  await page.click(`[data-wl="${lg}"]`);const id=await page.evaluate(([lg,club])=>G.world[lg].clubs.find(c=>c.name===club).id,[lg,club]);
  await page.click(`[data-wc="${id}"]`);await settle();R[tag]=await faces();
  await page.evaluate(()=>document.querySelector('.squad-note')?.scrollIntoView({block:'start'}));await page.waitForTimeout(200);
  await page.screenshot({path:OUT+`${tag}-top.png`});
  await page.evaluate(()=>{const l=document.querySelector('[data-wrow]');window.scrollTo(0,l.getBoundingClientRect().top+window.scrollY-170)});await page.waitForTimeout(300);await page.screenshot({path:OUT+`${tag}-list.png`});await page.screenshot({path:OUT+`${tag}-full.png`,fullPage:true});
  // profile of a starred core player and of a buyable one
  const pids=await page.evaluate(()=>{const rows=[...document.querySelectorAll('[data-wrow]')];const ok=r=>r.querySelector('.pp[data-pp-state="ready"]');return [rows.find(r=>r.classList.contains('nfs')&&ok(r))?.dataset.wrow,rows.find(r=>!r.classList.contains('nfs')&&ok(r))?.dataset.wrow]});
  R[tag].profiles=[];for(const pid of pids){if(!pid)continue;await page.click(`[data-wrow="${pid}"] .name`);await page.waitForTimeout(1500);
   R[tag].profiles.push(await page.evaluate(()=>({name:document.querySelector('#modal h3')?.textContent,face:!!document.querySelector('#modal .pp[data-pp-state="ready"] .pp-photo'),credit:document.querySelector('#modal .pp-credit')?.textContent.trim(),nfs:document.querySelector('#modal .nfs-note')?.textContent||null,offer:document.querySelector('#modal [data-startneg]')?'offer':'blocked'})));
   const m=await page.$('#modal .card, #modal');if(m)await m.screenshot({path:OUT+`${tag}-profile-${R[tag].profiles.length}.png`});await page.evaluate(()=>closeModal())}
  await page.click('[data-fclear="club"]').catch(()=>{});
 }
 // price sorts & nationality (EPL, all clubs): open the filter panel first
 await page.evaluate(()=>{const d=document.querySelector('[data-mfold]');if(d&&!d.open){d.open=true;marketFiltersOpen=true}});
const shotList=async n=>{await settle();await page.evaluate(()=>{const l=document.querySelector('[data-wrow]');window.scrollTo(0,l.getBoundingClientRect().top+window.scrollY-420)});await page.waitForTimeout(250);await page.screenshot({path:OUT+n})};
 await page.click('[data-ws="price-asc"]');await shotList('sort-low-to-high.png');R.sortAsc=await page.evaluate(()=>{const v=[...document.querySelectorAll('[data-wrow]')].map(el=>marketValue(findWorldPlayer(+el.dataset.wrow).p));return v.every((x,i)=>!i||v[i-1]<=x)});
 await page.click('[data-ws="price-desc"]');await shotList('sort-high-to-low.png');R.sortDesc=await page.evaluate(()=>{const v=[...document.querySelectorAll('[data-wrow]')].map(el=>marketValue(findWorldPlayer(+el.dataset.wrow).p));return v.every((x,i)=>!i||v[i-1]>=x)});
 await page.evaluate(()=>{const d=document.querySelector('[data-mfold]');if(d&&!d.open){d.open=true;marketFiltersOpen=true}});await page.selectOption('#worldNatSel','ברזיל');await settle();R.nat=await page.evaluate(()=>({rows:document.querySelectorAll('[data-wrow]').length,allBrazil:[...document.querySelectorAll('[data-wrow]')].every(el=>findWorldPlayer(+el.dataset.wrow).p.nat==='ברזיל'),chips:document.querySelector('.mchips')?.textContent}));
 await page.evaluate(()=>document.querySelector('.mfilters').scrollIntoView({block:'start'}));await page.screenshot({path:OUT+'nationality-brazil.png'});
 await page.evaluate(()=>clearMarketFilter('all'));
 // suggestions (Hebrew, English)
 for(const [q,tag] of [['גל','he'],['Glo','en']]){await page.fill('#marketNameInput','');await page.type('#marketNameInput',q,{delay:60});await page.waitForTimeout(500);
  R['suggest-'+tag]=await page.evaluate(()=>[...document.querySelectorAll('#marketSuggest .msug')].map(b=>b.querySelector('b').textContent));
  await page.evaluate(()=>document.querySelector('.msearch').scrollIntoView({block:'start'}));await page.waitForTimeout(800);await page.screenshot({path:OUT+`suggest-${tag}.png`})}
 await page.click('#marketSuggest .msug');await page.waitForTimeout(1200);R.suggestPick=await page.evaluate(()=>document.querySelector('#modal h3')?.textContent);await page.screenshot({path:OUT+'suggest-picked.png'});await page.evaluate(()=>closeModal());
 // Israeli legionnaires
 await page.click('[data-mtab="buy"]');await page.click('[data-mcat="legionnaires"]');await settle();
 R.legionnaires=await page.evaluate(()=>[...document.querySelectorAll('[data-wrow]')].map(el=>{const f=findWorldPlayer(+el.dataset.wrow);return f?`${fullName(f.p)} | ${f.c.name} | ${f.p.nat}${el.querySelector('.pp[data-pp-state="ready"]')?' | face':''}`:'?'}));
 R.foreignAtIsraeliClubShown=await page.evaluate(()=>{const ids=new Set([...document.querySelectorAll('[data-wrow]')].map(el=>+el.dataset.wrow));return G.clubs.flatMap(c=>c.players).filter(p=>p.foreign&&ids.has(p.id)).map(fullName)});
 await page.evaluate(()=>{const l=document.querySelector('.mchips');window.scrollTo(0,l.getBoundingClientRect().top+window.scrollY-160)});await page.waitForTimeout(300);await page.screenshot({path:OUT+'legionnaires.png'});
 // live play and the screens between matches (shouts, highlights, a first-person penalty, career card, quick tournament):
 // recorded under R.play; a failure here is reported, it never hides the market results above
 R.play={};try{const P=R.play;
  await page.evaluate(()=>{closeModal();G.view='home';render()});await page.waitForTimeout(400);
  Object.assign(P,await page.evaluate(()=>({save:SAVE_VERSION,careerCard:!!document.querySelector('.car-home'),blitzEntry:!!document.querySelector('[data-blitz-open]'),achievements:achDefs().length})));
  // every penalty of this match is the script's own: the engine decides any other one by itself, so the overlay opens only
  // when asked ('mine' = we kick, 'opp' = we keep goal) and never over the screenshot of the shout bar.
  // The game keeps the 3D penalty view for browsers with a graphics chip; this runner draws in software, so the check asks
  // for the 3D view explicitly (G.pen3d) and records what the game would have chosen by itself (gpu3d)
  P.gpu3d=await page.evaluate(()=>{G.motion='full';delete G.pen3d;return pen3dOK()});
  await page.evaluate(()=>{G.motion='full';G.pen3d=true;G.sound=false;G.pressMode='off';G.replay=false;window.__step=stepMinute;window.__force=null;window.__forced=[];
    stepMinute=function(M,ui){const f=window.__force;if(f&&ui&&ui.pen&&ui.pen()){window.__force=null;const c=f==='mine'?me():club(M.h===G.me?M.a:M.h);M.m++;M.pendingPen={team:c.id,pid:penTaker(M,c).id,m:M.m};window.__forced.push(M.m);return}
      return window.__step(M)};
    autoLineups();G.live=createMatch(me(),G.clubs.find(c=>c.id!==G.me),{kind:'friendly',label:'בדיקה חיה'});G.live.live=true;G.live.fresh=true;startLive(G.live)});
  await page.waitForSelector('.live-view');await page.evaluate(()=>document.querySelector('#kickBtn')?.click());
  // play on to the sixth minute: an injury opens the substitution dialog and waits for the manager, as it should
  const keepPlaying=async(test,what)=>{const t0=Date.now();for(;;){const s=await page.evaluate(()=>{const sk=document.querySelector('#modal [data-skip]');if(sk)sk.click();return {m:G.live?G.live.m:-1,btn:document.getElementById('ctrlBtn')?.textContent,pen:!!document.querySelector('#penGame')}});
    if(await test(s))return s;if(Date.now()-t0>60000)throw new Error('live match: '+what+' (minute '+s.m+', button '+s.btn+')');await page.waitForTimeout(400)}};
  await keepPlaying(s=>s.m>=6,'the clock did not reach the sixth minute');
  Object.assign(P,await page.evaluate(()=>({shoutButtons:document.querySelectorAll('[data-shout]').length,shoutReady:[...document.querySelectorAll('[data-shout]')].every(b=>!b.disabled),speeds:[...document.querySelectorAll('[data-spx]')].map(b=>b.dataset.spx).join(',')})));
  P.carrier=await page.evaluate(()=>{const st=typeof PX!=='undefined'&&PX.cur&&PX.cur.ready?PX.cur:null;return st&&st.car?st.car.d.name:null});   // the player on the ball (WebGL pitch), when one has it at this moment
  await page.evaluate(()=>document.querySelector('[data-shout="press"]').click());P.shout=await page.evaluate(()=>G.live.shout&&G.live.shout[G.me]&&G.live.shout[G.me].k);
  await page.evaluate(()=>document.getElementById('main').scrollTo(0,0));await page.screenshot({path:OUT+'live-shouts.png'});
  // a penalty through the overlay. Our kick waits ten seconds for the manager, so the picture (the sight on the goal) comes
  // first; a keeper has about two seconds before the ball is struck, so there the dive comes first
  const penalty=async(side,shot,act)=>{await page.evaluate(s=>{window.__force=s},side);
    await keepPlaying(()=>page.evaluate(()=>typeof PG!=='undefined'&&!!PG&&!!PG.stage&&!!PG.auto),'the penalty overlay did not open ('+side+')');
    const r=await page.evaluate(()=>({view:PG.stage.kind,mode:PG.go?'keep':'kick',arrows:document.querySelectorAll('.pg-dirs [data-dir]').length,title:document.querySelector('#penGame .pg-title')?.textContent}));
    if(side==='mine'){await page.waitForTimeout(500);await page.screenshot({path:OUT+shot});await page.evaluate(act)}
    else{await page.evaluate(act);await page.waitForTimeout(150);await page.screenshot({path:OUT+shot})}
    await page.waitForFunction(()=>!document.querySelector('#penGame'),null,{timeout:40000});
    r.result=await page.evaluate(()=>{const m=window.__forced[window.__forced.length-1];return G.live.ev.filter(e=>(e.t==='pen'||e.t==='penmiss')&&e.m===m).map(e=>e.t+':'+(e.how||'')).join(',')});return r};
  const kick=await penalty('mine','penalty.png',()=>{if(PG&&PG.auto)PG.auto()});P.penaltyView=kick.view;P.penalty=kick.result;P.penaltyMode=kick.mode;
  // a renderer under ten frames a second is moved to the flat picture for later kicks: recorded, then undone so the keeper's 3D view is seen too
  P.slow3d=await page.evaluate(()=>{const s=pen3dBad;pen3dBad=false;return s});
  P.keeper=await penalty('opp','penalty-keep.png',()=>{if(PG&&PG.go)PG.go('L')});
  await page.evaluate(()=>{stepMinute=window.__step;if(liveTimer){clearInterval(liveTimer);liveTimer=null}penClose();G.live=null;delete G.pen3d;G.motion='off';G.view='home';render()});
  await page.evaluate(()=>document.querySelector('[data-blitz-open]').click());await page.waitForSelector('.bz-hero');await page.click('[data-bz-form="4-3-3"]');
  for(let i=0;i<11;i++){await page.waitForSelector('[data-bz-pick]');if(i===5){await settle();await page.screenshot({path:OUT+'blitz-draft.png'})}await page.evaluate(k=>document.querySelector(`[data-bz-pick="${k}"]`).click(),i%3)}
  await page.waitForSelector('[data-bz="play"]');await settle();await page.screenshot({path:OUT+'blitz-cup.png'});
  P.blitz=await page.evaluate(()=>({squad:me().players.length,invented:me().players.filter(inventedPlayer).length,rating:+blitzRating(BLITZ.picks).toFixed(1),bonus:blitzBonus(BLITZ.picks),opponent:BLITZ.opp.name,sandbox:SANDBOX}));
  await page.evaluate(()=>blitzExit());P.backInCareer=await page.evaluate(()=>!SANDBOX&&!G.blitz&&me().id==='hbs');
 }catch(e){R.play.error=String(e&&e.message||e).slice(0,300)}
 // The beginner mode (beginner.html beside the page): each number of the live score on its own team's side, the name of the
 // player on the ball, ratings of both sides after the final whistle
 R.beginner={};try{const B=R.beginner;const bp=await ctx.newPage();bp.on('pageerror',e=>errs.push('beginner: '+String(e).slice(0,200)));await bp.addInitScript(()=>{window.__ilmNoSplash=1});
  const u=new URL(BASE);u.pathname=u.pathname.replace(/[^/]*$/,'')+'beginner.html';await bp.goto(u.href,{waitUntil:'load',timeout:90000});await bp.waitForFunction(()=>typeof Bcreate==='function'&&document.querySelectorAll('[data-start]').length>10,null,{timeout:60000});
  await bp.evaluate(()=>{Bcreate('mta');Bplay()});await bp.waitForSelector('#bscore .sd-h');
  await bp.waitForFunction(()=>Bpitch&&Bpitch.carLab&&Bpitch.carLab.style.display!=='none'&&Bpitch.carNow,null,{timeout:30000});
  B.carrier=await bp.evaluate(()=>({label:Bpitch.carLab.textContent,name:Bpitch.carNow.name,size:Math.round(Bpitch.carLab.getBoundingClientRect().height)}));await bp.evaluate(()=>scrollTo(0,0));await bp.screenshot({path:OUT+'beginner-live.png'});
  Object.assign(B,await bp.evaluate(()=>{const live=Bstate().live,M=live.M;live.paused=true;M.gh=2;M.ga=0;BpaintBroadcast();const x=s=>{const r=document.querySelector(s).getBoundingClientRect();return Math.round(r.left+r.width/2)};const t=[...document.querySelectorAll('.bscoreboard>div strong')];
   const o={home:t[0].textContent,homeX:x('.bscoreboard>div:first-child strong'),awayX:x('.bscoreboard>div:last-child strong'),homeGoalsX:x('#bscore .sd-h'),awayGoalsX:x('#bscore .sd-a')};o.scoreOnOwnSide=(o.homeX>o.awayX)===(o.homeGoalsX>o.awayGoalsX);M.gh=0;M.ga=0;live.paused=false;BpaintBroadcast();return o}));
  await bp.evaluate(()=>document.querySelector('[data-blive="skip"]').click());await bp.waitForSelector('.bresult .bratings');await bp.waitForTimeout(300);await bp.screenshot({path:OUT+'beginner-ratings.png'});
  B.ratings=await bp.evaluate(()=>({teams:[...document.querySelectorAll('.bratings-cols h4')].map(h=>h.textContent),rows:[...document.querySelectorAll('.bratings-cols>div')].map(d=>d.querySelectorAll('li').length),star:document.querySelector('.bratings-star strong')?.textContent||null}));await bp.close();
 }catch(e){R.beginner.error=String(e&&e.message||e).slice(0,300)}
 R.versionFile=await page.evaluate(()=>fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null));   // what an open page would be told about the server's build
 R.errors=errs;R.url=BASE;R.at=new Date().toISOString();R.build=await page.evaluate(()=>document.querySelector('meta[name="goalasso-build"]')?.content||null);require('fs').writeFileSync(OUT+'report.json',JSON.stringify(R,null,1));console.log(JSON.stringify(R,null,1));await b.close()})().catch(e=>{console.error(e);process.exit(1)});
