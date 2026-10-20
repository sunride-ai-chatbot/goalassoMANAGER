const {JSDOM}=require('jsdom');const assert=require('node:assert/strict');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{url:'https://press.test/',runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
click(w.document.querySelector('[data-pick="hta"]'));click($('signBtn'));click(w.document.querySelector('[data-sponsor="0"]'));click(w.document.querySelector('[data-board="patience"]'));
const G=w.ILM.G;console.log('after board: expect',G.board.expectText,'conf',G.board.conf,'owner',w.ILM.me().owner);
G.pressMode='all';G.speed=0.45;G.motion='off';G.renderer='svg';
// skip to week index 2 (Q3 leg1 -> HTA in ECL Q2 so plays weeks 0,1); let's just go until a non-friendly match with instant
let played=0;
for(let i=0;i<3;i++){G.view='home';w.ILM.render();if($('toLineupBtn')){click($('toLineupBtn'));click($('autoBtn'));click($('skipBtn'));let g=0;while($('modal')&&g++<6){const a=w.document.querySelector('[data-ans]');if(a){console.log('Q:',w.document.querySelector('.press-q').textContent.slice(0,60));click(a);console.log('  ->',w.document.querySelector('#modal .press-you')?.textContent.slice(0,50),'|',w.document.querySelector('#modal .small')?.textContent.slice(0,50))}const nx=$('pressNext');if(nx)click(nx)}}else click($('playBtn'))}
// now live with pre-press
G.view='home';w.ILM.render();if($('toLineupBtn'))click($('toLineupBtn'));
// Re-select available players after earlier matches can create injuries/suspensions.
if($('autoBtn'))click($('autoBtn'));
click($('playBtn'));let g=0;while($("modal")&&!$("ticker")&&g++<12){const a=w.document.querySelector('[data-ans]');if(a){console.log('PRE Q:',w.document.querySelector('.press-q').textContent.slice(0,60));click(a)}const nx=$('pressNext');if(nx)click(nx)}
assert.ok(G.live,'press fixture must start with a legal XI');
console.log('live started',!!$('ticker'),'nextBoost consumed',G.nextBoost,'boost in match',JSON.stringify(G.live&&G.live.boost));
async function waitFor(test){const until=Date.now()+30000;while(!test()){const injurySkip=w.document.querySelector('[data-skip]');if(injurySkip)click(injurySkip);if($('ctrlBtn')?.textContent==='המשך')click($('ctrlBtn'));if(Date.now()>until)throw new Error('match did not progress');await new Promise(r=>setTimeout(r,20))}}
(async()=>{await waitFor(()=>G.live.half||G.live.done);if(!G.live.done)click($('ctrlBtn'));await waitFor(()=>G.live.done);click($('ctrlBtn'));const rn=$('reportNext');console.log('report modal',!!rn,'has shotmap',!!w.document.querySelector('.shotmap'),'ratings rows',w.document.querySelectorAll('.rrow').length);if(rn)click(rn);let g=0;while($('modal')&&g++<6){const a=w.document.querySelector('[data-ans]');if(a){console.log('POST Q:',w.document.querySelector('.press-q').textContent.slice(0,60));click(a)}const nx=$('pressNext');if(nx)click(nx)}
 console.log('paper quotes',G.paper.filter(x=>x.kind==='מסיבת עיתונאים').map(x=>x.h).join(' | '));
 G.view='club';w.ILM.render();console.log('dressing room card',w.document.body.textContent.includes('חדר ההלבשה'),'owner line',w.document.body.textContent.includes('הבעלים'));
 // job offer simulate
 G.board.conf=80;G.jobOffer={club:'hbs',wage:120000,wk:G.wk};G.view='home';w.ILM.render();console.log('job card',!!w.document.querySelector('[data-job-accept]'));click(w.document.querySelector('[data-job-decline]'));console.log('declined, conf',G.board.conf,'offer',G.jobOffer);
 assert.deepEqual(errors,[]);assert.equal(G.jobOffer,null);console.log('errors',errors);process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
