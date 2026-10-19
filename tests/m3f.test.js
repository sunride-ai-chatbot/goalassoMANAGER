const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};const q=s=>w.document.querySelector(s);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
click(q('[data-pick="mta"]'));click($('signBtn'));
console.log('paperPop after appointment',(w.ILM.G.paperPop||[]).length,(w.ILM.G.paperPop||[]).map(x=>x.h).join(' | '));
click(q('[data-sponsor="0"]'));click(q('[data-board="none"]'));const G=w.ILM.G,c=w.ILM.me();G.pressMode='off';
await wait(200);console.log('pop modal shown',!!q('#modal .papercard'),q('#modal .pp-hl')&&q('#modal .pp-hl').textContent,'| foot',q('#modal .pp-foot')&&q('#modal .pp-foot').textContent);
while(q('[data-ppclose]')){click(q('[data-ppclose]'));await wait(120)}
console.log('rep',G.manager.rep,'goals card',!!w.document.body.textContent.match(/יעדים/));
click(q('[data-chal="cs5"]'));click(q('[data-chal="streak3"]'));console.log('challenges',JSON.stringify(G.chal[G.season]));
// force a prospect story
const y=c.players.filter(p=>p.age<=21).sort((a,b)=>b.pot-a.pot)[0];y.pot=Math.max(y.pot,y.ovr+9);c.lineup=(c.lineup||[]).map(id=>id===y.id?null:id);y.sharp=50;
w.eval(`storyAdd({type:'prospect',pid:${y.id},stage:'ask',ask:true})`);G.view='home';w.ILM.render();console.log('story card',!!q('[data-story]'),q('.story .small')&&q('.story .small').textContent.slice(0,70));
click(q('[data-story$=":promise"]'));console.log('promise set',JSON.stringify(y.promise),'stage',G.stories[0].stage);
// play some weeks starting him
for(let i=0;i<10;i++){G.view='home';w.ILM.render();while(q('[data-ppclose]'))click(q('[data-ppclose]'));const t=$('toLineupBtn');if(t){click(t);if(!c.lineup.includes(y.id)){const slot=c.lineup.findIndex((id,k)=>{const p=c.players.find(x=>x.id===id);return p&&p.pos===y.pos});if(slot>=0)c.lineup[slot]=y.id}click($('skipBtn'))}else click($('playBtn'))}
console.log('story after',JSON.stringify(G.stories.map(s=>({t:s.type,st:s.stage,done:!!s.done,ask:!!s.ask,offer:s.offer&&s.offer.fee}))));
console.log('stories spawned',G.stories.map(s=>s.type).join(','),'challenge prog',JSON.stringify(w.eval("challengeProgress('cs5')")),JSON.stringify(w.eval("challengeProgress('streak3')")));
// derby hero hook exists
console.log('paper pops queued total',(G.paperPop||[]).length,'paper count',G.paper.length);
// resign flow + interview
G.view='club';w.ILM.render();click($('resignBtn'));click($('resignGo'));console.log('phase',G.phase,'offers',G.jobOffers.length,'rep',G.manager.rep);
w.ILM.render();click(q('[data-job]'));console.log('interview open',!!q('#modal [data-ia]'),q('#modal p')&&q('#modal p').textContent.slice(0,60));click(q('#modal [data-ia="amb"]'));click(q('#modal [data-ia="youth"]'));
console.log('after interview phase',G.phase,'club',w.ILM.me().short,'expect',G.board.expectText,'wage',G.manager.wage,'history',JSON.stringify(G.manager.history.slice(-1)));
console.log('errors',errors);process.exit(0)})();
