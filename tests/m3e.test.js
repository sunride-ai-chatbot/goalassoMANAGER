const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};const q=s=>w.document.querySelector(s);
click(q('[data-pick="hje"]'));click($('signBtn'));click(q('[data-sponsor="0"]'));click(q('[data-board="none"]'));
const G=w.ILM.G,c=w.ILM.me();G.pressMode='off';c.money=60e6;
// open a negotiation on a domestic player to attract a rival
const target=G.clubs.filter(x=>x.id!==G.me).flatMap(x=>x.players).filter(p=>p.ovr>=66&&p.ovr<=70)[0];
w.eval(`startNegotiation(${target.id})`);w.eval('closeModal()');const neg=G.negs[0];
const m0=Object.fromEntries([...G.clubs,...G.leumit].map(x=>[x.id,x.money]));
let rivalSeen=false;
for(let i=0;i<70&&G.phase==='play';i++){G.view='home';w.ILM.render();const t=$('toLineupBtn');if(t){click(t);click($('skipBtn'))}else click($('playBtn'));if(neg.rival&&!rivalSeen){rivalSeen=true;console.log('RIVAL wk',G.wk,JSON.stringify(neg.rival),'log:',neg.log.slice(-1)[0])}}
console.log('phase',G.phase,'neg stage',neg.stage,neg.log.slice(-1)[0]);
console.log('tlog',G.tlog.length,'big',G.tlog.filter(t=>t.big).length);console.log(G.tlog.slice(0,8).map(t=>'w'+t.wk+' '+t.txt).join('\n'));
const all=[...G.clubs,...G.leumit].filter(x=>x.id!==G.me);console.log('squad sizes',Math.min(...all.map(x=>x.players.length)),'-',Math.max(...all.map(x=>x.players.length)),'negative money clubs',all.filter(x=>x.money<0).map(x=>x.short+' '+Math.round(x.money/1e6)+'M').join(', ')||'none');
console.log('coach changes',all.filter(x=>x.coachHist).map(x=>x.short+': '+x.coachHist.map(h=>h.name).join('>')+'>'+x.coach).join(' | ')||'none');
console.log('errors',errors);
