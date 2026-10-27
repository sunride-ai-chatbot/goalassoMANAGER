const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8'),{url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true})}}).window;
async function main(){try{
 for(const sel of ['[data-pick="mta"]','#signBtn'])w.document.querySelector(sel).click();
 assert.equal(w.eval("sponsorName(me())"),'');
 assert.equal(w.eval("cinematicPlayerHTML(me(),me().players[0],'test').includes('kit-contract-sponsor')"),false);
 w.document.querySelector('[data-sponsor="0"]').click();w.document.querySelector('[data-board="none"]').click();
 w.eval("G.pressMode='off';G.paperPop=[];G.view='lineup';render()");
 const brand=w.eval('me().sponsor.name');
 assert.ok(brand);assert.ok(w.document.querySelector('.cine-sponsor').textContent.includes(brand),'shirt sponsor named under the lineup');
 // stadium-photo lineup: eleven round portraits with a club-colour name plate on the arena picture
 assert.ok(w.document.querySelector('.stad-pitch.arena .arena-bg img'));
 assert.equal(w.document.querySelectorAll('.stad .t3.rt .rt-face .player-portrait').length,11);
 for(const n of w.document.querySelectorAll('.stad .rt-ovr'))assert.match(n.textContent,/^\d{2}$/);
 // pre-match presentation: my page, then the opponent's probable XI, then kick-off
 w.__ilmPrematch=1;w.document.querySelector('#playBtn').click();assert.ok(w.document.querySelector('#prematch .pm-page'));assert.equal(w.document.querySelectorAll('#prematch .t3.rt').length,11);
 w.document.querySelector('#pmNext').click();assert.ok(w.document.querySelector('#pmGo'));assert.equal(w.document.querySelectorAll('#prematch .t3.rt').length,11);
 w.document.querySelector('#prematch').remove();w.__ilmPrematch=0;w.eval("G.view='lineup';render()");
 assert.equal(w.document.querySelectorAll('#formSel').length,1);
 assert.equal(w.document.querySelectorAll('.stad [data-slot]').length,11);
 w.document.querySelector('#autoBtn').click();
 const keeper=w.eval('lineupPlayers(me())[0].id');
 const replacement=w.eval("me().players.find(p=>p.pos==='GK'&&p.id!==lineupPlayers(me())[0].id&&!p.inj&&!p.susp).id");
 w.document.querySelector('.stad [data-slot="0"]').click();
 assert.equal(w.document.querySelector('.stad [data-slot="0"]').getAttribute('aria-pressed'),'true');
 w.document.querySelector('.cine-sub[data-bench="'+replacement+'"]').click();
 assert.equal(w.eval('lineupPlayers(me())[0].id'),replacement);
 assert.ok(w.document.querySelector('.cine-sub[data-bench="'+keeper+'"]'));
 // Every formation keeps 11 operable positions and unique SVG filter IDs.
 for(const f of w.eval('Object.keys(FORMATIONS)')){
  const select=w.document.querySelector('#formSel');select.value=f;select.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.equal(w.document.querySelectorAll('.stad [data-slot]').length,11);
  const ids=[...w.document.querySelectorAll('.cinematic-lineup [id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
 }
 // Updated and expired contracts must not leave a baked-in sponsor on clothes.
 w.eval("me().sponsor.name='מותג חדש';render()");
 assert.ok(w.document.querySelector('.cine-sponsor').textContent.includes('מותג חדש'));
 assert.equal(w.eval("cinematicPlayerHTML(me(),me().players[0],'t2').includes('מותג חדש')"),true,'the kit figure still carries the contract sponsor');
 w.eval("me().sponsor=null;render()");assert.equal(w.document.querySelectorAll('.cine-sponsor').length,0);assert.equal(w.document.querySelectorAll('.kit-contract-sponsor').length,0);
 assert.deepEqual(errors,[]);console.log('cinematic lineup, substitution, formations and sponsor lifecycle passed; errors []');
}finally{await new Promise(resolve=>setImmediate(resolve));w.close()}}
main().catch(e=>{console.error(e);process.exitCode=1});
