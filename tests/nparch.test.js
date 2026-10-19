const jsd=require('jsdom');const {JSDOM}=jsd;
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmNoSplash=1;window.__ilmUnlock=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
function mk(store){const vc=new jsd.VirtualConsole();const dom=new JSDOM(html,{virtualConsole:vc,runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){if(store)for(const k in store)w.localStorage.setItem(k,store[k])}});const w=dom.window;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{};return w}
const out={};const w=mk();
setTimeout(()=>{const d=w.document;const run=c=>w.eval(c);
 d.querySelector('[data-pick="hpt"]').click();d.querySelector('#signBtn').click();d.querySelector('[data-sponsor="1"]').click();d.querySelector('[data-board="money"]').click();
 setTimeout(()=>{out.popup=run(`({open:!!document.getElementById('npModal'),ribbon:(document.querySelector('.np-ribbon')||{}).textContent,role:(document.getElementById('npModal')||{getAttribute(){}}).getAttribute('role')})`);
  run(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);out.esc=run(`!document.getElementById('npModal')`);
  out.sale=run(`(()=>{G.wk=0;const p=me().players.slice().sort((a,b)=>a.ovr-b.ovr)[0];const nm=fullName(p);sellPlayer(p.id);const st=G.paper.find(x=>x.ev&&x.ev.type==='sale');return {nm,ev:st&&st.ev}})()`);
  const store={};for(let i=0;i<w.localStorage.length;i++){const k=w.localStorage.key(i);store[k]=w.localStorage.getItem(k)}
  const w2=mk(store);setTimeout(()=>{out.persist=w2.eval(`(()=>{const st=G.paper.find(x=>x.ev&&x.ev.type==='sale');const ap=G.paper.find(x=>x.ev&&x.ev.type==='appoint');return {sale:!!st,player:st&&st.ev.player,appoint:!!ap,sponsor:!!G.paper.find(x=>x.ev&&x.ev.type==='sponsor')}})()`);
   out.archive=w2.eval(`(()=>{closeFrontPage&&closeFrontPage(true);G.view='table';tableTab='paper';render();const el=document.querySelector('[data-npopen]');if(!el)return 'no archive';el.click();const m=document.getElementById('npModal');const r={open:!!m,hl:m&&m.querySelector('.np-hl').textContent,lazy:!!document.querySelector('.paper img')};closeFrontPage();return r})()`);
   out.demoNoSave=w2.eval(`(()=>{const n=G.paper.length,m=me().money;paperDemo('cup');closeFrontPage();paperDemo('champ');closeFrontPage();return G.paper.length===n&&me().money===m})()`);
   console.log(JSON.stringify(out,null,1));process.exit(0)},800)},900)},700);
