// Phone-size (iPhone 13) check of the real transfer market UI: Real Madrid and Liverpool full squads with faces, profiles
// with photo credit, price sorts, nationality filter, live suggestions (Hebrew/English) and Israeli legionnaires.
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
 await page.click('[data-ws="price-asc"]');R.sortAsc=await page.evaluate(()=>{const v=[...document.querySelectorAll('[data-wrow]')].map(el=>marketValue(findWorldPlayer(+el.dataset.wrow).p));return v.every((x,i)=>!i||v[i-1]<=x)});
 await page.click('[data-ws="price-desc"]');R.sortDesc=await page.evaluate(()=>{const v=[...document.querySelectorAll('[data-wrow]')].map(el=>marketValue(findWorldPlayer(+el.dataset.wrow).p));return v.every((x,i)=>!i||v[i-1]>=x)});
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
 R.errors=errs;R.url=BASE;R.at=new Date().toISOString();R.build=await page.evaluate(()=>document.querySelector('meta[name="goalasso-build"]')?.content||null);require('fs').writeFileSync(OUT+'report.json',JSON.stringify(R,null,1));console.log(JSON.stringify(R,null,1));await b.close()})().catch(e=>{console.error(e);process.exit(1)});
