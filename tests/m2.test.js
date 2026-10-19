const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
const q=s=>w.document.querySelector(s);
click(q('[data-pick="hbs"]'));click($('signBtn'));click(q('[data-sponsor="0"]'));click(q('[data-board="none"]'));
const G=w.ILM.G,c=w.ILM.me();G.pressMode='off';c.money=60e6;
console.log('sponsor names ok',!/שופרסל|אל-על|ביטוח ישיר/.test(JSON.stringify(G.clubs.map(x=>x.sponsor&&x.sponsor.name))),'mental',JSON.stringify(G.mental),'ovr0 set',c.players.every(p=>p.ovr0===p.ovr));
const week=()=>{G.view='home';w.ILM.render();const t=$('toLineupBtn');if(t){click(t);click($('skipBtn'))}else click($('playBtn'))};
// injure someone manually via the helper path
const p=c.players.find(x=>x.pos==='MF');w.eval(`setInjury(ILM.me().players.find(x=>x.id===${p.id}),8)`);
G.view='club';w.ILM.render();click(q('[data-ctab="med"]'));
console.log('med tab',!!q('.med'),'injT',p.injT,'rehab btn',!!q(`[data-rehab="${p.id}"]`));
const m0=c.money;click(q(`[data-rehab="${p.id}"]`));console.log('after rehab inj',p.inj,'(was 8) cost',m0-c.money,'fragile',p.fragile,'btn gone',!q(`[data-rehab="${p.id}"]`));
w.eval(`rehab(${p.id})`);console.log('second rehab blocked inj',p.inj);
// staff
click(q('[data-ctab="staff"]'));const m1=c.money;click($('wsBtn'));console.log('workshop cost',m1-c.money,'boost',G.mentalBoost,'btn disabled now',$('wsBtn').disabled);
const m2=c.money;w.eval('setupWorkshop()');console.log('repeat workshop charged',m2-c.money);
click($('mentalBtn'));console.log('mental left',G.mental.left,'weekly',G.mental.weekly);w.eval('signMental()');console.log('stack blocked left',G.mental.left);
// commercial
click(q('[data-ctab="com"]'));const offs=G.adOffers.map(o=>o.id);console.log('ad offers',offs.length,G.adOffers.map(o=>o.brand+' '+o.bonus.he).join(' | '));
const m3=c.money;const up=G.adOffers[0].upfront;click(q(`[data-adok="${offs[0]}"]`));console.log('accepted upfront',c.money-m3,'==',up,'ads',c.ads.length);
const m4=c.money;w.eval(`acceptAd(${offs[0]})`);console.log('repeat redemption delta',c.money-m4,'ads',c.ads.length);
click(q('[data-ctab="data"]'));console.log('data tab',q('#main').textContent.includes('footballtransfers.com'),q('#main').textContent.includes('17.10.2026'));
// play weeks
const ad=c.ads[0];const left0=ad.left;for(let i=0;i<6;i++)week();
console.log('ad left',left0,'->',ad.left,'paid',ad.paid,'ledger',c.adLedger.length,c.adLedger.slice(0,3).map(x=>x.kind+' '+x.amt).join(' | '));
console.log('mental left after 6',G.mental.left,'sharp sample',c.players.slice(0,6).map(p=>Math.round(p.sharp)).join(','));
console.log('injured p now',p.inj);
// dossier
G.view='squad';w.ILM.render();click(q(`[data-pid="${c.players[0].id}"]`));console.log('dossier radar',!!q('#modal .radar'),'stats',q('#modal .dos-stats')&&q('#modal .dos-stats').textContent.slice(0,80),'hist table',!!q('#modal .htbl'));
click(q('#modal [data-close]'));
// world player dossier
console.log('errors',errors);
