const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
click(w.document.querySelector('[data-pick="hbs"]'));click($('signBtn'));click(w.document.querySelector('[data-sponsor="0"]'));click(w.document.querySelector('[data-board="none"]'));
const G=w.ILM.G;
for(let i=0;i<22;i++){G.view='home';w.ILM.render();if($('toLineupBtn')){click($('toLineupBtn'));click($('skipBtn'))}else click($('playBtn'))}
const eu=G.results.filter(r=>r.kind==='euro'||r.kind==='friendly');
console.log('euro/friendly results:',eu.map(r=>`${r.hn} ${r.gh}:${r.ga} ${r.an}`).join(' | '));
const opp=Object.values(G.pseudo)[0];console.log('sample club:',opp.name,opp.country,opp.stadium,'players:',opp.players.slice(0,5).map(p=>p.first+' '+p.last+' ('+p.nat+') '+p.ovr).join(', '));
console.log('used clubs',Object.keys(G.euroUsed).length,'ticker order fix present',html.includes('tick.scrollTop=tick.scrollHeight'));
console.log('errors',errors);
