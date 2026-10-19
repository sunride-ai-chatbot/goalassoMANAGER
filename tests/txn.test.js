const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmNoSplash=1;window.__ilmUnlock=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
function mk(store){const vc=new (require('jsdom').VirtualConsole)();const dom=new JSDOM(html,{virtualConsole:vc,runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/',beforeParse(w){if(store)for(const k in store)w.localStorage.setItem(k,store[k])}});const w=dom.window;w.matchMedia=()=>({matches:false});return w}
const errs=[];const out={};
const w=mk();w.addEventListener('error',e=>errs.push(e.message));
setTimeout(()=>{const d=w.document;const run=c=>w.eval(c);
 d.querySelector('[data-pick="hpt"]').click();d.querySelector('#signBtn').click();d.querySelector('[data-sponsor="1"]').click();d.querySelector('[data-board="money"]').click();
 // demo first: must not change money/squad/signings
 out.demo=run(`(()=>{const m0=me().money,n0=me().players.length;revealDemo('perm');const r=!!document.getElementById('reveal');const txt=document.getElementById('reveal').textContent;closeReveal(true);revealDemo('loan');closeReveal(true);revealDemo('free');closeReveal(true);revealDemo('cup');closeReveal(true);return {open:r,hasDemoBadge:txt.includes('הדגמה'),money:me().money===m0,squad:me().players.length===n0,signings:(G.signings||[]).length}})()`);
 // real purchase
 out.buy=run(`(()=>{G.wk=0;const from=G.clubs.find(c=>c.id!==G.me&&c.league&&c.players.length>18);const p=from.players.slice().sort((a,b)=>a.value-b.value)[0];me().money+=askingPrice(p)*2;const m0=me().money;buyPlayer(from.id,p.id);
   const stored=JSON.parse(localStorage.getItem('ilm2'));const tx=stored.signings&&stored.signings[0];return {pid:p.id,charged:m0-me().money===askingPrice(p),storedTx:tx&&{kind:tx.kind,name:tx.name,from:tx.from,fee:tx.fee,years:tx.years,shown:tx.shown,id:tx.id},inSquad:me().players.some(x=>x.id===p.id)}})()`);
 setTimeout(()=>{out.afterOpen=run(`(()=>{const r=document.getElementById('reveal');const st=JSON.parse(localStorage.getItem('ilm2'));return {open:!!r,cls:r&&r.className,shownPersisted:st.signings[0].shown,video:!!(r&&r.querySelector('video')),head:r&&r.querySelector('.rv-l3 .rv-head').textContent}})()`);
  // double-call record → no duplicate
  out.dupe=run(`(()=>{const p=me().players.find(x=>x.id===${out.buy.pid});return {again:recordSigning(p,me(),'perm',{})===null,count:G.signings.length}})()`);
  console.log(JSON.stringify(out));run(`document.getElementById('rvSkip').click()`);
  out.final=run(`(()=>{const r=document.getElementById('reveal');return {cls:r.className,btns:[...r.querySelectorAll('.rv-actions button')].map(b=>b.textContent)}})()`);
  run(`document.getElementById('rvLineup').click()`);
  out.lineup=run(`({view:G.view,sel:JSON.stringify(lineupSel),open:!!document.getElementById('reveal'),listenersCleared:PX_REVEAL===null})`);
  const store={};for(let i=0;i<w.localStorage.length;i++){const k=w.localStorage.key(i);store[k]=w.localStorage.getItem(k)}
  const w2=mk(store);setTimeout(()=>{out.reload={open:!!w2.document.getElementById('reveal'),signings:w2.eval('G.signings.length')};
   // free agent + loan record shapes
   out.free=w2.eval(`(()=>{G.wk=0;const p=G.freeAgents[0];me().money+=5e6;signFreeAgent(p.id);const t=G.signings[G.signings.length-1];return {kind:t.kind,years:t.years,fee:t.fee,from:t.from}})()`);
   setTimeout(()=>{out.freeRevealText=(w2.document.querySelector('#reveal .rv-card')||{}).textContent;console.log(JSON.stringify(out,null,1));console.log('errs',errs);process.exit(0)},600)},700)},500)},700);
