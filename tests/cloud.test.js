// cloud save round-trip with a fake claude.use db + sim/export tests
const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const store={};
const mkDoc=path=>({get:async()=>({exists:path in store,data:()=>store[path]}),set:async d=>{store[path]=d},collection:sub=>({doc:id=>mkDoc(path+'/'+sub+'/'+id)})});
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.claude={use:async n=>n==='db'?{doc:mkDoc}:n==='user'?{id:async()=>'u1'}:n==='downloads'?{save:async({filename,data})=>{w.__dl={filename,len:data.length}}}:null};w.CompressionStream=globalThis.CompressionStream;w.DecompressionStream=globalThis.DecompressionStream;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.Response=Response;}});
const w=dom.window;w.matchMedia=()=>({matches:true});const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
setTimeout(async()=>{
 console.log('cloud box on start:',$('cloudBox')&&$('cloudBox').textContent.slice(0,40));
 click(w.document.querySelector('[data-pick="mnt"]'));click($('signBtn'));click(w.document.querySelector('[data-sponsor="0"]'));click(w.document.querySelector('[data-board="none"]'));
 const G=w.ILM.G;G.pressMode='off';
 w.ILM.G.view='money';w.ILM.render();console.log('settings card',!!$('exportBtn'),'cloud save btn',!!$('cloudSave'));
 click($('cloudSave'));await new Promise(r=>setTimeout(r,800));
 console.log('stored keys',Object.keys(store).length,'meta',JSON.stringify(store['data/users/u1/save']).slice(0,120));
 // mutate, then load from cloud
 const wk0=G.wk;click($('simNext'));console.log('after simNext wk',w.ILM.G.wk,'next match',!!w.ILM.myNextMatch());
 w.ILM.G.view='money';w.ILM.render();click($('cloudLoad'));await new Promise(r=>setTimeout(r,800));
 console.log('after cloud load wk',w.ILM.G.wk,'(expected',wk0,')','club',w.ILM.me().name);
 click($('exportBtn'));await new Promise(r=>setTimeout(r,200));console.log('export',JSON.stringify(w.__dl));
 w.ILM.G.view='money';w.ILM.render();click($('simSeason'));click($('simGo'));console.log('after simSeason phase',w.ILM.G.phase,'summary pos',w.ILM.G.summary&&w.ILM.G.summary.pos);
 console.log('errors',errors);process.exit(0)},300);
