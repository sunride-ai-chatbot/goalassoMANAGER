const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:false});
w.requestAnimationFrame=cb=>setTimeout(()=>cb(Date.now()),16);w.cancelAnimationFrame=id=>clearTimeout(id);
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
const change=(el,v)=>{el.value=v;el.dispatchEvent(new w.Event('change',{bubbles:true}))};
click(w.document.querySelector('[data-pick="mhf"]'));click($('signBtn'));click(w.document.querySelector('[data-sponsor="0"]'));click(w.document.querySelector('[data-board="none"]'));
const G=w.ILM.G,c=w.ILM.me();G.pressMode='off';G.speed=0.45;
// go to a league week (skip euro/friendly weeks) 
for(let i=0;i<8;i++){const ev=G.cal[G.wk];if(ev.t==='league')break;G.view='home';w.ILM.render();if($('toLineupBtn')){click($('toLineupBtn'));click($('skipBtn'))}else click($('playBtn'))}
G.view='lineup';w.ILM.render();
console.log('tactics selects',w.document.querySelectorAll('[data-tac]').length,'analysis',!!w.document.querySelector('.analysis'),w.document.querySelector('.analysis')?.textContent.slice(0,120));
change(w.document.querySelector('[data-tac="press"]'),'high');change(w.document.querySelector('[data-tac="style"]'),'counter');console.log('tac',JSON.stringify(c.tac));
click(w.document.querySelector('[data-slot="9"]'));const rs=w.document.querySelector('[data-role]');console.log('role select for',rs&&rs.dataset.role,'options',rs&&rs.options.length);if(rs){change(rs,rs.options[1].value);console.log('role set',c.players.find(p=>p.id===+rs.dataset.role).roleT,'token rl',w.document.querySelector('[data-slot="9"] .rl')?.textContent)}
click($('playBtn'));
console.log('pitch2d',!!$('p2d'),'players drawn',w.document.querySelectorAll('#p2dTok g.tok').length,'goals drawn',w.document.querySelectorAll('.goal').length,'bug',!!w.document.querySelector('.bug'),'live mentality buttons',w.document.querySelectorAll('[data-lm]').length,'intro',!!$('kickBtn'));if($('kickBtn'))click($('kickBtn'));
setTimeout(()=>{click(w.document.querySelector('[data-lm="att"]'));console.log('liveMent',JSON.stringify(G.live.liveMent),'clock',$('clock').textContent);
 setTimeout(()=>{if($('ctrlBtn').textContent==='מחצית שנייה')click($('ctrlBtn'));setTimeout(()=>{const LM=G.live;console.log('done',LM&&LM.done,'m',LM&&LM.m,'stats',$('stats').textContent.replace(/\s+/g,' ').slice(0,80));
   const kinds=[...new Set(LM.ev.map(e=>e.t+(e.sub?':'+e.sub:'')))];console.log('event kinds',kinds.join(','));console.log('tadj',JSON.stringify(LM.tadj));
   const toks=[...w.document.querySelectorAll('#p2dTok g.tok')];console.log('tok transforms',toks.slice(0,3).map(t=>t.getAttribute('transform')).join(' | '),'heat sum',LM.heat&&Object.values(LM.heat).map(g=>g.reduce((a,b)=>a+b,0)).join('/'));
   console.log('ctrl',$('ctrlBtn').textContent,'errors',errors);process.exit(0)},60*333+800)},1200)},800);
