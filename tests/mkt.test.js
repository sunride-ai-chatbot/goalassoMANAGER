const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing element');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
const change=(el,v)=>{el.value=v;el.dispatchEvent(new w.Event('change',{bubbles:true}))};
click(w.document.querySelector('[data-pick="mta"]'));click($('signBtn'));click(w.document.querySelector('[data-sponsor="0"]'));click(w.document.querySelector('[data-board="none"]'));
const G=w.ILM.G,c=w.ILM.me();c.money=60e6;c.players.splice(27);
// market tabs
G.view='market';w.ILM.render();
click(w.document.querySelector('[data-mtab="world"]'));console.log('world tab rows',w.document.querySelectorAll('[data-wrow]').length,'league',w.document.querySelector('h3.sec').textContent);
click(w.document.querySelector('[data-wl="africa"]'));console.log('africa rows',w.document.querySelectorAll('[data-wrow]').length,'sample',w.document.querySelector('[data-wrow] .name b').textContent,'| ovr shown:',w.document.querySelector('[data-wrow] .ovr').textContent);
// open a world player
const pid=+w.document.querySelector('[data-wrow]').dataset.wrow;click(w.document.querySelector('[data-wrow]'));console.log('modal',!!$('modal'),'has startneg',!!w.document.querySelector('[data-startneg]'),'card ?',w.document.querySelector('#modal .pc text').textContent);
// scouting: hire
click(w.document.querySelector('[data-close]'));click(w.document.querySelector('[data-mtab="scout"]'));console.log('scout candidates',w.document.querySelectorAll('[data-shire]').length);
click(w.document.querySelector('[data-shire]'));console.log('scouts',G.scouts.length,G.scouts[0].name,G.scouts[0].region);
change(w.document.querySelector('[data-sregion]'),'africa');console.log('region now',G.scouts[0].region);
// quick scout on the player
G.view='market';w.ILM.render();click(w.document.querySelector('[data-mtab="world"]'));click(w.document.querySelector('[data-wl="africa"]'));
click(w.document.querySelector(`[data-wrow="${pid}"]`));click(w.document.querySelector('[data-qscout]'));
const f=w.ILM.G.world.africa.clubs.flatMap(x=>x.players).find(p=>p.id===pid);console.log('after quick scout kn',f.kn,'rep',f.rep&&f.rep.txt.slice(0,40),'modal reopened',!!$('modal'));
// start negotiation
click(w.document.querySelector('[data-startneg]'));console.log('neg modal',!!$('modal'),'stage',G.negs[0].stage,'ask',G.negs[0].ask,'value',w.ILM.NIS(f.value*(f.vmult||1)));
// lowball
change($('fee'),Math.round(G.negs[0].ask*0.3));click($('sendClub'));console.log('after lowball:',G.negs[0].log.slice(-1)[0],'patience',G.negs[0].patience);
// near ask
change($('fee'),G.negs[0].ask);click($('sendClub'));console.log('after full:',G.negs[0].stage,G.negs[0].log.slice(-1)[0]);
if(G.negs[0].stage==='player'){
  console.log('demand',JSON.stringify(G.negs[0].pdemand),'interest shown',w.document.querySelector('#modal .kv dd').textContent);
  change($('wage'),Math.round(G.negs[0].pdemand.wage*1.3));click($('sendPlayer'));if($('confirmSign'))click($('confirmSign'));console.log('after player offer:',G.negs[0].stage,G.negs[0].log.slice(-1)[0]);
}
console.log('squad now',c.players.length,'money',w.ILM.NIS(c.money),'payables',G.payables.length);
// advance weeks: scout reports
for(let i=0;i<7;i++){G.view='home';w.ILM.render();if($('toLineupBtn')){click($('toLineupBtn'));click($('skipBtn'))}else click($('playBtn'))}
console.log('reports',G.reports.length,G.reports.slice(0,3).map(r=>r.by+':'+r.pid).join(' | '),'news',G.news.filter(n=>n.t.includes('סקאוט')).length);
G.view='market';w.ILM.render();click(w.document.querySelector('[data-mtab="scout"]'));console.log('report rows rendered',w.document.querySelectorAll('.card:last-of-type [data-wrow]').length);
click(w.document.querySelector('[data-mtab="negs"]'));console.log('negs view ok',w.document.querySelector('h3.sec').textContent);
// Israeli market via negotiation
click(w.document.querySelector('[data-mtab="buy"]'));const il=w.document.querySelector('[data-wrow]');console.log('il rows',w.document.querySelectorAll('[data-wrow]').length);click(il);console.log('il modal startneg',!!w.document.querySelector('[data-startneg]'));
console.log('offers from abroad in news:',G.news.filter(n=>n.t.includes('הגישה הצעה')).map(n=>n.t).slice(0,2));
console.log('save KB',Math.round(JSON.stringify(G).length/1024));
console.log('errors',errors);
