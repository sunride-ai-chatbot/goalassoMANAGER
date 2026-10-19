const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});
const $=id=>w.document.getElementById(id);const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));const q=s=>w.document.querySelector(s);
click(q('[data-pick="hje"]'));click($('signBtn'));click(q('[data-sponsor="0"]'));click(q('[data-board="none"]'));
const G=w.ILM.G;
for(const c of [...G.clubs.slice(0,3),...G.clubs.slice(-2),...G.leumit.slice(0,4)]){const wages=c.players.reduce((t,p)=>t+p.wage,0)+c.youth.reduce((t,p)=>t+Math.round(p.wage*.3),0);const tv=c.tier===4?55000:180000+(c.tier===1?80000:c.tier===2?30000:0);const sp=c.sponsor?Math.round(c.sponsor.annual/46):0;const maint=Math.round(c.cap*3);const ops=c.tier===1?480000:c.tier===2?260000:c.tier===3?150000:70000;const merch=Math.round((c.fans??50)*(c.tier===1?1600:c.tier===2?900:c.tier===3?500:220));
 console.log(c.short.padEnd(10),'tier',c.tier,'money',Math.round(c.money/1e6)+'M','wages',Math.round(wages/1e3)+'K','tv',tv/1e3,'sp',Math.round(sp/1e3),'merch',Math.round(merch/1e3),'maint',Math.round(maint/1e3),'ops',ops/1e3,'NET/wk',Math.round((tv+sp+merch-wages-maint-ops)/1e3)+'K','cap',c.cap,'sponsor?',!!c.sponsor)}
