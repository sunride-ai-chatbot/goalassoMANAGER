const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));const q=s=>w.document.querySelector(s);
click(q('[data-pick="hje"]'));click($('signBtn'));click(q('[data-sponsor="0"]'));click(q('[data-board="none"]'));
const G=w.ILM.G;G.pressMode='off';
// pick a target whose position some rich rival needs
let target=null;for(const x of G.clubs){if(x.id===G.me)continue;const need=w.eval(`aiNeed(club('${x.id}'))`);}
const needs=G.clubs.filter(x=>x.id!==G.me).map(x=>({x,need:w.eval(`aiNeed(club('${x.id}'))`)}));
for(const {x,need} of needs){const seller=G.clubs.find(s=>s!==x&&s.id!==G.me&&s.players.some(p=>p.pos===need.pos&&p.ovr>=60&&w.eval(`marketValue(sellerClub(${s.players.find(p=>p.pos===need.pos&&p.ovr>=60).id}).p)`)*1.5<x.money));if(seller){target=seller.players.find(p=>p.pos===need.pos&&p.ovr>=60);console.log('rival candidate',x.short,'needs',need.pos,'money',Math.round(x.money/1e6)+'M','target',target.last,'from',seller.short);break}}
w.eval(`startNegotiation(${target.id});closeModal()`);const n=G.negs[0];const ask0=n.ask;
const R=w.Math.random;w.Math.random=()=>0.01;w.eval('rivalBids()');w.Math.random=R;
console.log('rival',JSON.stringify(n.rival),'ask',ask0,'->',n.ask,'log',n.log.slice(-1)[0]);
// lowball now rejected? submit below rival fee
w.eval(`submitClubOffer(${n.id},${Math.round(n.rival.fee*0.9)},1,0)`);console.log('offer 90% of rival ->',n.stage,n.log.slice(-1)[0]);
// two weeks later the rival closes if we don't
G.wk+=2;w.eval('rivalBids()');console.log('after 2 wks stage',n.stage,'|',n.log.slice(-1)[0],'| player now at',w.eval(`(()=>{const f=sellerClub(${target.id});return f?f.c.short:'?'})()`));
console.log('errors',errors);
