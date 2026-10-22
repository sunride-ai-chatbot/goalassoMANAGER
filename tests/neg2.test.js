// negotiation edge cases: installments & payables, EPL key player refusal, counter flow, window close kills negs
const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
const change=(el,v)=>{el.value=v;el.dispatchEvent(new w.Event('change',{bubbles:true}))};
click(w.document.querySelector('[data-pick="hbs"]'));click($('signBtn'));click(w.document.querySelector('[data-sponsor="0"]'));click(w.document.querySelector('[data-board="none"]'));
const G=w.ILM.G,c=w.ILM.me();c.money=120e6;
G.view='market';w.ILM.render();click(w.document.querySelector('[data-mtab="world"]'));click(w.document.querySelector('[data-wl="epl"]'));
// pick a key EPL vet
const key=G.world.epl.clubs[0].players.find(p=>p.key&&!p.nfs)||G.world.epl.clubs[0].players.find(p=>!p.nfs); // the core (p.nfs) is listed but not for sale
click(w.document.querySelector(`[data-wrow="${key.id}"]`));click(w.document.querySelector('[data-startneg]'));
let n=G.negs[0];console.log('EPL key player ask',w.ILM.NIS(n.ask),'key',n.key,'value',w.ILM.NIS(key.value*key.vmult));
change($('fee'),n.ask);click($('sendClub'));console.log('full ask on key EPL:',n.stage,'|',n.log.slice(-1)[0]);
click(w.document.querySelector('[data-close]'));
// installments on a championship player
click(w.document.querySelector('[data-wl="champ"]'));const cp=G.world.champ.clubs[0].players.find(p=>!p.key);
click(w.document.querySelector(`[data-wrow="${cp.id}"]`));click(w.document.querySelector('[data-startneg]'));n=G.negs[0];
change($('fee'),Math.round(n.ask*0.8));change($('inst'),'3');click($('sendClub'));console.log('80% in 3 inst:',n.stage,'|',n.log.slice(-1)[0],'counter',n.counter);
if(n.stage==='club'){change($('fee'),n.counter||n.ask);change($('inst'),'3');click($('sendClub'));console.log('counter accepted?',n.stage,'|',n.log.slice(-1)[0])}
if(n.stage==='player'){change($('wage'),n.pdemand.wage*0.6);click($('sendPlayer'));if($('confirmSign'))click($('confirmSign'));console.log('lowball wage:',n.stage,'|',n.log.slice(-1)[0],'pcounter',n.pcounter);
 if(n.stage==='player'){change($('wage'),Math.max(n.pcounter||0,n.pdemand.wage*1.2));change($('role'),'starter');click($('sendPlayer'));if($('confirmSign'))click($('confirmSign'));console.log('improved:',n.stage,'|',n.log.slice(-1)[0])}}
console.log('payables',JSON.stringify(G.payables),'money',w.ILM.NIS(c.money));
// open a neg then advance past window close (summer window ends after league round 6 => week index 12)
click(w.document.querySelector('[data-close]'));G.view='market';w.ILM.render();click(w.document.querySelector('[data-mtab="world"]'));click(w.document.querySelector('[data-wl="balkan"]'));
const bp=G.world.balkan.clubs[1].players[2];click(w.document.querySelector(`[data-wrow="${bp.id}"]`));click(w.document.querySelector('[data-startneg]'));click(w.document.querySelector('[data-close]'));
for(let i=0;i<14;i++){G.view='home';w.ILM.render();if($('toLineupBtn')){click($('toLineupBtn'));click($('skipBtn'))}else click($('playBtn'))}
const pend=G.negs.find(x=>x.pid===bp.id);console.log('after window close:',pend&&pend.stage,pend&&pend.log.slice(-1)[0],'wk',G.wk,'window open?',w.ILM.G.cal[G.wk]);
console.log('payables left',G.payables.length,'money',w.ILM.NIS(c.money));
G.view='money';w.ILM.render();console.log('money view has payables card',w.document.body.textContent.includes('תשלומים עתידיים'));
console.log('errors',errors);
