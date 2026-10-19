const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://slots.test/'});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing '+el);el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};const q=s=>w.document.querySelector(s);
const start=(team)=>{click(q(`[data-pick="${team}"]`));if(q('#ovGo'))click(q('#ovGo'));click($('signBtn'));click(q('[data-sponsor="0"]'));click(q('[data-board="none"]'));w.ILM.G.pressMode='off'};
start('mta');for(let i=0;i<3;i++){const G=w.ILM.G;G.view='home';w.ILM.render();while(q('[data-ppclose]'))click(q('[data-ppclose]'));const t=$('toLineupBtn');if(t){click(t);click($('skipBtn'))}else click($('playBtn'))}
console.log('slot1',JSON.stringify(w.eval('slotMeta(1)')),'v',w.ILM.G.v);
// switch career -> start screen -> choose slot 2 -> new game
w.ILM.G.view='club';w.ILM.render();click(q('[data-ctab="main"]'));w.ILM.G.view='money';w.ILM.render();
let sw=$('switchCareer');if(!sw){w.ILM.G.view='club';w.ILM.render();sw=$('switchCareer')}
click(sw);console.log('start screen slots',w.document.querySelectorAll('.slot').length);click(q('[data-slotsel="2"]'));start('hbs');
console.log('slot2',JSON.stringify(w.eval('slotMeta(2)')),'cur',w.eval('curSlot()'),'club',w.ILM.me().short);
// back to slot 1
w.eval('save();G=null;render()');click(q('[data-slotload="1"]'));console.log('loaded slot1 club',w.ILM.me().short,'wk',w.ILM.G.wk,'slot',w.ILM.G.slot);
// migration from old version: fake v4
const G=w.ILM.G;G.v=4;delete G.staff;w.eval('save()');w.localStorage.setItem('ilm2',JSON.stringify(Object.assign(JSON.parse(w.localStorage.getItem('ilm2')),{v:4})));w.eval('G=null;load(1);render()');console.log('migrated v',w.ILM.G.v,'from',w.ILM.G.migratedFrom,'staff',!!w.ILM.G.staff);
// delete all
w.eval('deleteAllData()');setTimeout(()=>{console.log('after delete keys',Object.keys(w.localStorage).filter(k=>k.startsWith('ilm2')),'G',w.ILM.G);console.log('errors',errors)},300);
