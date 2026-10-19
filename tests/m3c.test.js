const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};const q=s=>w.document.querySelector(s);
const change=(el,v)=>{el.value=v;el.dispatchEvent(new w.Event('change',{bubbles:true}))};
click(q('[data-pick="mta"]'));click($('signBtn'));click(q('[data-sponsor="0"]'));click(q('[data-board="none"]'));
const G=w.ILM.G,c=w.ILM.me();G.pressMode='off';c.money=80e6;
console.log('chem pairs',Object.keys(c.chem).length,'joined init',c.players.every(p=>p.joined));
const week=()=>{G.view='home';w.ILM.render();const t=$('toLineupBtn');if(t){click(t);click($('skipBtn'))}else click($('playBtn'))};
// lineup chem card
for(let i=0;i<6;i++){G.view='home';w.ILM.render();if($('toLineupBtn')){click($('toLineupBtn'));break}click($('playBtn'))}
const cc=[...w.document.querySelectorAll('.card')].find(x=>x.textContent.includes('כימיה בהרכב'));console.log('chem card',cc&&cc.textContent.replace(/\s+/g,' ').slice(0,160));
// dev plan on a young player
const y=c.players.filter(p=>p.age<=22).sort((a,b)=>b.pot-a.pot)[0];G.view='squad';w.ILM.render();click(q(`[data-pid="${y.id}"]`));
console.log('devplan card',!!q('#modal [data-dplan]'));change(q(`#modal [data-dplan="${y.id}:focus"]`),'0');change(q(`#modal [data-dplan="${y.id}:retrain"]`),y.pos==='DF'?'MF':'DF');
const ment=q(`#modal [data-dplan="${y.id}:mentor"]`);if(ment&&ment.options.length>1)change(ment,ment.options[1].value);
console.log('dplan',JSON.stringify(y.dplan),'mult',w.eval(`devPlanMult(ILM.me(),ILM.me().players.find(p=>p.id===${y.id}))`));
click(q('#modal [data-close]'));
// simulate a foreign signing arriving
const f=w.eval(`(()=>{const pl=makeEuroPlayer?null:null;return null})()`);
const newP=JSON.parse(JSON.stringify(c.players.find(p=>p.foreign)||c.players[0]));newP.id=99999;newP.nat='ברזיל';newP.foreign=true;delete newP.joined;delete newP.adapt;c.players.push(newP);
// a departure of a top player
const star=c.players.slice().sort((a,b)=>b.ovr-a.ovr)[0];
week();console.log('arrival adapt',c.players.find(p=>p.id===99999).adapt);
const mor0=c.players.map(p=>p.morale);c.players.splice(c.players.indexOf(star),1);week();
console.log('departure news',G.news.slice(0,6).map(n=>n.t).filter(t=>t.includes('העזיבה')).join(' | ').slice(0,200));
for(let i=0;i<12;i++)week();
console.log('after 14 wks: adapt',c.players.find(p=>p.id===99999)&&c.players.find(p=>p.id===99999).adapt,'focus prog',y.dplan.fprog&&y.dplan.fprog.toFixed(1),'ab',JSON.stringify(y.ab),'retrain',y.dplan.rprog&&y.dplan.rprog.toFixed(1),'pos2',y.pos2);
console.log('chem now for new',Object.entries(c.chem).filter(([k])=>k.includes('99999')).length);
console.log('errors',errors);
