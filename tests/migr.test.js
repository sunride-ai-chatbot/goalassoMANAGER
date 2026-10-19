const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};const q=s=>w.document.querySelector(s);
click(q('[data-pick="mhf"]'));click($('signBtn'));click(q('[data-sponsor="0"]'));click(q('[data-board="none"]'));
let G=w.ILM.G;G.pressMode='off';
const week=()=>{G=w.ILM.G;G.view='home';w.ILM.render();const t=$('toLineupBtn');if(t){click(t);click($('skipBtn'))}else click($('playBtn'))};
for(let i=0;i<3;i++)week();
// make it look like a v1.3 save
G=w.ILM.G;delete G.mental;delete G.adOffers;delete G.adRenew;delete G.injSeq;G.me&&(w.ILM.me().sponsor.name='שופרסל-מקס');
for(const c of [...G.clubs,...G.leumit]){delete c.ads;delete c.adLedger;for(const p of c.players){for(const k of ['sharp','injT','injTot','injId','rehabDone','fragile','mins','assists','passes','saves','cs','xg','rsum','rn','shots','sot','hist','ovr0','no','capps','cmins','cassists'])delete p[k]}}
w.ILM.me().players[3].inj=4;
G.results.forEach(r=>{delete r.ps;delete r.pm;delete r.passes});
w.localStorage.setItem('ilm2',JSON.stringify(G));
w.eval('G=null;load();render()');G=w.ILM.G;const c=w.ILM.me();
console.log('migrated sponsor',c.sponsor.name,'mental',JSON.stringify(G.mental),'ads',JSON.stringify(c.ads),'injT on old injury',c.players[3].injT,c.players[3].injTot);
for(const v of ['home','squad','club','table','money','market']){G.view=v;w.ILM.render()}
for(const t of ['med','staff','com','data']){G.view='club';w.ILM.render();click(q(`[data-ctab="${t}"]`))}
G.view='table';w.ILM.render();const rr=q('[data-tt="results"]');if(rr){click(rr);const row=q('[data-rep]');console.log('old results clickable rows',w.document.querySelectorAll('[data-rep]').length)}
G.view='squad';w.ILM.render();click(q('[data-pid]'));console.log('dossier on migrated',!!q('#modal .radar'));click(q('#modal [data-close]'));
for(let i=0;i<4;i++)week();
console.log('after play: sharp',Math.round(c.players[0].sharp),'mins',c.players[0].mins,'wk',G.wk,'errors',errors);
