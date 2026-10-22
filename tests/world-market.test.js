// World market: full real squads (core players listed but not for sale), faces for careers saved before the European
// packs existed, Israeli legionnaires, live name suggestions (Hebrew/English), nationality filter and both price sorts.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const E=JSON.parse(fs.readFileSync(path.join(root,'data/visuals/euro-players.json')));
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'ligat-haal-manager.html'),'utf8'),{url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true})}}).window;
const d=w.document;
const rows=()=>[...d.querySelectorAll('[data-wrow]')];const closeAll=()=>w.eval('closeMarketSuggest()');
async function main(){try{
 for(const s of ['[data-pick="hbs"]','#signBtn','[data-sponsor="0"]','[data-board="none"]'])d.querySelector(s).click();
 w.eval("G.pressMode='off';G.motion='off';G.paperPop=[]");
 const squad=k=>JSON.parse(fs.readFileSync(path.join(root,'data/euro',k+'.json'))).players;
 // full squads
 for(const [lg,club,key] of [['laliga','ריאל מדריד','real_madrid'],['epl','ליברפול','liverpool']]){
  const info=JSON.parse(w.eval(`(()=>{ensureWorldLeague('${lg}');const c=G.world['${lg}'].clubs.find(c=>c.name==='${club}');return JSON.stringify({n:c.players.length,nfs:c.players.filter(p=>p.nfs).length,en:c.players.map(p=>p.en).sort(),fake:c.players.filter(p=>!p.real).length,faces:c.players.filter(p=>playerVisual(p)).map(p=>[p.en,playerVisualId(p)])})})()`));
  assert.deepEqual(info.en,squad(key).map(p=>p.en).sort(),club+' shows the complete data/euro squad');
  assert.equal(info.nfs,11);assert.equal(info.fake,0,'no invented players at a real club');
  const want=E.players.filter(p=>p.key===key);for(const [en,vid] of info.faces){const e=want.find(p=>p.en===en);assert.ok(e,en);assert.equal(vid,e.visualId,'right face for '+en)}
  assert.ok(info.faces.length>=16,club+' faces: '+info.faces.length);
 }
 // the world tab renders the whole squad, with not-for-sale players marked and their offer blocked
 w.eval("G.view='market';marketTab='world';worldLg='laliga';render()");
 d.querySelector(`[data-wc="${w.eval("G.world.laliga.clubs.find(c=>c.name==='ריאל מדריד').id")}"]`).click();
 assert.equal(rows().length,26);assert.equal(d.querySelectorAll('.pl.nfs').length,11);
 assert.match(d.querySelector('.squad-note').textContent,/סגל מלא: 26 שחקנים/);
 const star=w.eval("G.world.laliga.clubs.find(c=>c.name==='ריאל מדריד').players.find(p=>p.nfs).id");
 // a core player is not for sale: a market-value offer is refused outright, an exceptional one (≈2.5× value, tier 1) opens talks
 const r=JSON.parse(w.eval(`(()=>{G.wk=0;me().money=5e9;startNegotiation(${star});closeModal();const n=G.negs.find(n=>n.pid===${star});const p=findWorldPlayer(${star}).p;const mv=marketValue(p);
  submitClubOffer(n.id,mv,1,0);const s1=n.stage;submitClubOffer(n.id,n.ask,1,0);return JSON.stringify({nfs:n.nfs,ask:n.ask,mv,s1,s2:n.stage,log:n.log})})()`));
 assert.ok(r.nfs);assert.ok(r.ask>=r.mv*2,'core asking price is exceptional (≥2× even with the cash-need discount): '+r.ask+' vs '+r.mv);assert.equal(r.s1,'club','market value is refused');assert.equal(r.s2,'player','the exceptional offer convinces the club');
 w.eval("G.negs=[]");
 d.querySelector('[data-wav="buy"]').click();assert.equal(rows().length,15);assert.ok(d.querySelector('.mchips').textContent.includes('זמינים לרכישה'));
 d.querySelector('[data-fclear="all"]').click();
 // price sort, both directions
 const vals=()=>w.eval("[...document.querySelectorAll('[data-wrow]')].map(el=>marketValue(findWorldPlayer(+el.dataset.wrow).p))");
 d.querySelector('[data-ws="price-asc"]').click();let v=vals();assert.deepEqual(v,v.slice().sort((a,b)=>a-b));
 d.querySelector('[data-ws="price-desc"]').click();v=vals();assert.deepEqual(v,v.slice().sort((a,b)=>b-a));
 // nationality filter
 const sel=d.getElementById('worldNatSel');assert.ok(sel.options.length>5);const nat=[...sel.options].find(o=>o.value==='ספרד').value;
 sel.value=nat;sel.dispatchEvent(new w.Event('change',{bubbles:true}));assert.ok(rows().length>0);
 assert.ok(w.eval("[...document.querySelectorAll('[data-wrow]')].every(el=>findWorldPlayer(+el.dataset.wrow).p.nat==='ספרד')"));
 assert.match(d.querySelector('.mchips').textContent,/לאום: ספרד/);
 // live suggestions after two letters, Hebrew and English, selectable
 const input=()=>d.getElementById('marketNameInput');
 for(const q of ['גל','Gl','glou','גלוך']){input().value=q;input().dispatchEvent(new w.Event('input',{bubbles:true}));
  const box=d.getElementById('marketSuggest');assert.equal(box.hidden,false,q);assert.ok([...box.querySelectorAll('.msug')].some(b=>b.textContent.includes('אוסקר גלוך')),'suggests Gloukh for '+q)}
 input().value='g';input().dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(d.getElementById('marketSuggest').hidden,true,'nothing before two letters');
 input().value='Vinicius';input().dispatchEvent(new w.Event('input',{bubbles:true}));assert.ok(d.querySelector('.msug').textContent.includes('Vinícius'),'accents are ignored');
 input().value='גלוך';input().dispatchEvent(new w.Event('input',{bubbles:true}));
 input().dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));d.getElementById('marketNameSearch').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.match(d.querySelector('#modal').textContent,/אוסקר גלוך/,'choosing a suggestion opens the player');w.eval('closeModal()');
 // the typed letters are highlighted inside the suggestion
 input().value='glou';input().dispatchEvent(new w.Event('input',{bubbles:true}));assert.match(d.querySelector('.msug bdi').innerHTML,/<mark>Glou<\/mark>kh/);
 input().value='גלוך';input().dispatchEvent(new w.Event('input',{bubbles:true}));assert.match(d.querySelector('.msug b').innerHTML,/<mark>גלוך<\/mark>/);closeAll();
 // empty state names every active filter and offers a reset
 w.eval("worldNat='ברזיל';marketSearch='Gloukh';render()");assert.ok(d.querySelector('.market-empty'));assert.ok(d.querySelector('[data-fclear="nat"]'));assert.ok(d.querySelector('[data-fclear="all"]'));
 d.querySelector('[data-fclear="all"]').click();assert.ok(rows().length>100);assert.equal(d.querySelector('.mchips'),null);
 // Israeli legionnaires
 w.eval("marketTab='buy';render()");d.querySelector('[data-mcat="legionnaires"]').click();
 const leg=rows().map(el=>el.textContent);assert.ok(leg.some(t=>t.includes('אוסקר גלוך')&&t.includes('אייאקס')));
 assert.ok(w.eval("[...document.querySelectorAll('[data-wrow]')].every(el=>{const f=findWorldPlayer(+el.dataset.wrow);return f&&f.c.world&&f.p.real&&f.p.nat==='ישראל'})"));
  // a bought European player keeps his face in my squad list, profile and lineup figure
 const buy=w.eval("(()=>{const c=G.world.laliga.clubs.find(c=>c.name==='ריאל מדריד');const p=c.players.find(p=>!p.nfs&&playerVisual(p));const vid=playerVisualId(p);me().money=1e9;G.wk=0;const n={offer:{fee:1e6,inst:1,sellon:0},poffer:{wage:5e4,years:2,role:'rotation',bonus:0},log:[],loan:null};completeTransfer(n,p,c);return JSON.stringify({id:p.id,vid,en:p.en})})()");
 const bt=JSON.parse(buy);assert.equal(w.eval(`playerVisualId(me().players.find(p=>p.id===${bt.id}))`),bt.vid,'face survives the transfer');
 w.eval("G.view='squad';squadTab='all';render()");assert.ok(d.querySelector(`[data-pid="${bt.id}"] .pp[data-visual-id="${bt.vid}"]`),'face in my squad list');
 assert.match(w.eval(`cinematicPlayerHTML(me(),me().players.find(p=>p.id===${bt.id}),'t')`),new RegExp(bt.vid),'face on the lineup figure');
 w.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,url)))});w.eval(`loadFacePack(PLAYER_VISUALS.faces['${bt.vid}'].pack)`);await Promise.all(w.eval('[...facePackRequests.values()]'));
 w.eval(`playerModal(${bt.id})`);assert.ok(d.querySelector(`#modal .pp[data-visual-id="${bt.vid}"]`),'face in the profile');assert.match(d.querySelector('#modal').textContent,/ויקישיתוף/);w.eval('closeModal()');
 // careers saved before the European packs: 7-player lists and visualId:null are repaired by the v9 migration
 w.eval(`(()=>{const c=G.world.epl.clubs.find(c=>c.name==='ליברפול');c.players=c.players.slice(0,7);c.players.push(makeWorldPlayer('epl',WORLD_LEAGUES.epl.clubs[0],'mid',87));delete c.squadV;for(const p of c.players){p.visualId=null;delete p.from;delete p.nfs}})()`);
 const legacy=w.eval('JSON.stringify(Object.assign({},G,{v:8}))');w.eval(`installCareer(${JSON.stringify(legacy)},2)`);
 const after=JSON.parse(w.eval("JSON.stringify((()=>{const c=G.world.epl.clubs.find(c=>c.name==='ליברפול');return {n:c.players.length,fake:c.players.filter(p=>!p.real).length,faces:c.players.filter(p=>playerVisual(p)).length,v:G.v}})())"));
 assert.equal(after.n,squad('liverpool').length);assert.equal(after.fake,0);assert.ok(after.faces>=16);assert.equal(after.v,w.eval('SAVE_VERSION'));
 assert.deepEqual(errors,[]);console.log('world market: full squads, not-for-sale core, faces after migration, legionnaires, suggestions, nationality and price sorts passed; errors []');
}finally{await new Promise(r=>setImmediate(r));w.close()}}
main().catch(e=>{console.error(e);process.exitCode=1});
