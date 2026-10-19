const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://once.test/'});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));const q=s=>w.document.querySelector(s);
click(q('[data-pick="mta"]'));click($('signBtn'));click(q('[data-sponsor="0"]'));click(q('[data-board="none"]'));const G=w.ILM.G;G.pressMode='off';
for(let i=0;i<6;i++){G.view='home';w.ILM.render();if($('toLineupBtn')){click($('toLineupBtn'));break}click($('playBtn'))}
w.eval('save()');const before=w.localStorage.getItem('ilm2');const resBefore=G.results.length;
click($('playBtn'));console.log('live',!!G.live,'flag',w.localStorage.getItem('ilm2_livefl'));
w.eval('save()');console.log('save during live blocked',w.localStorage.getItem('ilm2')===before);
const M=G.live;w.eval('runInstant(G.live)');w.eval('afterMyMatch(ILM.G.live||null)');
const M2=M;w.ILM.G.live=null;w.eval(`(()=>{})()`);
// call afterMyMatch twice on same match object
w.__M=M;w.eval('afterMyMatch(window.__M);afterMyMatch(window.__M)');
const mine=w.ILM.G.results.filter(r=>(r.h===G.me||r.a===G.me)&&r.wk===M.ctx&&0);
console.log('my results for that match',w.ILM.G.results.filter(r=>r.h===M.h&&r.a===M.a&&r.wk===w.ILM.G.wk-1).length,'flag cleared',w.localStorage.getItem('ilm2_livefl'));
console.log('errors',errors);process.exit(0);
