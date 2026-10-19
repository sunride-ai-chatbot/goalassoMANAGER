// Level 4 test: Leumit career full season + top club toto/NT/history + loans
const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
function boot(pick){const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});const errors=[];w.addEventListener('error',e=>errors.push(e.message));
 const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
 if(pick.startsWith('l_')){click($('toggleLeumit'))}
 click(w.document.querySelector(`[data-pick="${pick}"]`));click($('signBtn'));click(w.document.querySelector('[data-sponsor="0"]'));click(w.document.querySelector('[data-board="none"]'));
 return {w,$,click,errors,G:w.ILM.G}}
// ---- Leumit career ----
{const {w,$,click,errors,G}=boot('l_ash');const c=w.ILM.me();G.pressMode='off';
 console.log('LEUMIT: me',c.name,'div',w.ILM.myDiv(),'expect',G.board.expectText,'wage',G.manager.wage,'leumit size',G.leumit.length,'cup alive includes me',G.cup.alive.includes(G.me),'lsched weeks',Object.keys(G.lsched).length);
 let played=0,labels=new Set();
 for(let i=0;i<70&&G.phase==='play';i++){G.board.conf=90;G.view='home';w.ILM.render();const nm=w.ILM.myNextMatch&&null;const t=$('toLineupBtn');if(t){click(t);const lbl=w.document.querySelector('.tag.info')?.textContent;labels.add((lbl||'').split('·')[0].trim());click($('skipBtn'));played++}else click($('playBtn'))}
 console.log('played',played,'phase',G.phase,'wk',G.wk,'labels',[...labels].slice(0,6).join(' | '));
 console.log('leumit table top3',w.ILM.standingsOf('leumit').slice(0,3).map(x=>x.short+' '+x.pts).join(', '),'my P',c.P,'pos',w.ILM.myPos(),'split',G.lsplit,'group',c.group,'lchamp',G.lchampion&&w.ILM.club(G.lchampion).short);
 console.log('summary',JSON.stringify(G.summary).slice(0,300));
 console.log('toto winner',G.toto&&G.toto.winner&&w.ILM.club(G.toto.winner).short,'nt played',G.nt&&G.nt.played,'hist',G.hist&&G.hist.length);
 if(G.phase==='seasonEnd'){click($('nextSeasonBtn'));if(G.phase==='sponsor'){click(w.document.querySelector('[data-sponsor="0"]'))}if(G.phase==='board')click(w.document.querySelector('[data-board="none"]'));console.log('season 2 phase',G.phase,'div now',w.ILM.myDiv(),'clubs',G.clubs.length,'leumit',G.leumit.length,'expect',G.board.expectText)}
 G.view='table';w.ILM.render();for(const tt of ['leumit','toto','nt','hist','league']){click(w.document.querySelector(`[data-tt="${tt}"]`));if(!w.document.querySelector('#main').textContent.trim())console.log('EMPTY',tt)}
 console.log('errors',errors.slice(0,3));}
// ---- top club: loans, bank, naming, toto live ----
{const {w,$,click,errors,G}=boot('bje');const c=w.ILM.me();G.pressMode='off';c.money=40e6;c.players.splice(26);
 G.view='market';w.ILM.render();click(w.document.querySelector('[data-mtab="world"]'));click(w.document.querySelector('[data-wl="portugal"]'));
 const pl=G.world.portugal.clubs[3].players.find(p=>!p.key);click(w.document.querySelector(`[data-wrow="${pl.id}"]`));click(w.document.querySelector('[data-startneg]'));
 click($('askLoan'));const n=G.negs[0];console.log('TOP: loan ask ->',n.stage,'|',n.log.slice(-1)[0]);
 if(n.stage==='player'){const wg=$('wage');wg.value=Math.round(n.pdemand.wage*1.3);click($('sendPlayer'));if($('confirmSign'))click($('confirmSign'));console.log('loan done?',n.stage,'player loan',JSON.stringify(c.players.find(p=>p.id===pl.id)?.loan))}
 click(w.document.querySelector('[data-close]'));
 G.view='money';w.ILM.render();click(w.document.querySelector('[data-bank="10000000"]'));console.log('bank',JSON.stringify(G.bank),'money',w.ILM.NIS(c.money));click($('sellNaming'));console.log('naming',c.stadium,c.naming&&c.naming.annual);
 // toto: first week BJE in ECL Q2 -> toto auto; check next match label
 G.view='home';w.ILM.render();console.log('event text',w.document.querySelector('#main').textContent.replace(/\s+/g,' ').slice(0,90));
 for(let i=0;i<6;i++){G.view='home';w.ILM.render();const t=$('toLineupBtn');if(t){click(t);click($('skipBtn'))}else click($('playBtn'))}
 console.log('toto round',G.toto.round,'my toto results',G.results.filter(r=>r.kind==='toto'&&(r.h===G.me||r.a===G.me)).map(r=>r.hn+' '+r.gh+':'+r.ga+' '+r.an).join(' | '),'semis',JSON.stringify(G.toto.semis));
 G.view='table';w.ILM.render();click(w.document.querySelector('[data-tt="toto"]'));console.log('toto view',w.document.querySelector('.card .row.between').textContent.slice(0,60));
 console.log('errors',errors.slice(0,3));}
