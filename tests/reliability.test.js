// Assertions are intentional: wrong business results must fail the process.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
const windows=[];
function boot(store={}){const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});const d=new JSDOM(html,{url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true});for(const [k,v] of Object.entries(store))w.localStorage.setItem(k,v)}});windows.push(d.window);assert.deepEqual(errors,[]);return d.window}
function fresh(){const w=boot();for(const sel of ['[data-pick="mnt"]','#signBtn','[data-sponsor="0"]','[data-board="none"]']){assert.ok(w.document.querySelector(sel),sel);w.document.querySelector(sel).click()}w.eval("G.pressMode='off';G.motion='off';G.renderer='svg';G.paperPop=[];save()");return w}
function state(w){return JSON.parse(w.eval('JSON.stringify(G)'))}
function data(w){return Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]))}
async function main(){try{
 const w=fresh();const saved=w.localStorage.getItem('ilm2');
 // Storage exhaustion must be visible and must not claim a new savedAt.
 w.eval("window.originalSet=Storage.prototype.setItem;window.oldStamp=G.savedAt;me().money+=123;Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError')}");
 assert.equal(w.eval('save()'),false);assert.equal(w.eval('G.savedAt===window.oldStamp'),true);assert.equal(w.localStorage.getItem('ilm2'),saved);assert.ok(w.document.getElementById('saveWarning'));
 w.eval('Storage.prototype.setItem=window.originalSet');assert.equal(w.eval('save()'),true);assert.equal(w.document.getElementById('saveWarning'),null);assert.equal(w.localStorage.getItem('ilm2_backup'),saved);
 // Invalid imports never replace current state or storage.
 const valid=w.localStorage.getItem('ilm2');const money=w.ILM.me().money;
 assert.equal(w.eval(`installCareer('{"clubs":[],"me":"mnt"}',1)`),false);assert.equal(w.localStorage.getItem('ilm2'),valid);assert.equal(w.ILM.me().money,money);
 // Migration failures propagate, roll back in-memory data, and preserve the source.
 w.__legacy=JSON.parse(valid);w.__legacy.v=4;
 w.eval("window.oldMigration=MIGRATIONS[0][2];MIGRATIONS[0][2]=()=>{throw new Error('migration failure')}");
 assert.equal(w.eval('installCareer(JSON.stringify(window.__legacy),1)'),false);assert.equal(w.localStorage.getItem('ilm2'),valid);assert.equal(w.ILM.me().money,money);
 w.eval('MIGRATIONS[0][2]=window.oldMigration');assert.equal(w.eval('installCareer(JSON.stringify(window.__legacy),1)'),true);assert.equal(state(w).v,w.eval('SAVE_VERSION'));
 // A stale incoming offer cannot overdraw its buyer or move a player.
 w.eval("window.buyer=G.clubs.find(c=>c.id!==G.me);window.target=me().players.find(p=>!p.loan);window.buyer.players=window.buyer.players.slice(0,20);window.buyer.money=1;G.offers=[{pid:window.target.id,from:window.buyer.id,fee:1000000,wk:G.wk}]");
 w.eval('acceptOffer(0)');assert.equal(w.eval('window.buyer.money'),1);assert.equal(w.eval('me().players.includes(window.target)'),true);assert.equal(w.eval('G.offers.length'),1);
 w.eval('window.buyer.money=2000000;acceptOffer(0)');assert.equal(w.eval('window.buyer.money'),1000000);assert.equal(w.eval('window.buyer.players.includes(window.target)'),true);assert.equal(w.eval('me().players.includes(window.target)'),false);
 // Selling to a market with no solvent domestic buyers must leave the squad intact.
 w.eval("for(const c of [...G.clubs,...G.leumit])if(c.id!==G.me)c.money=0;window.squadSize=me().players.length;window.sellId=me().players.find(p=>!p.loan).id;sellPlayer(window.sellId)");assert.equal(w.eval('me().players.length===window.squadSize'),true);
 // Interrupted match retains all fixtures, statistics, and the exact minute.
 const m=fresh();m.eval("autoLineups();G.live=createMatch(me(),G.clubs.find(c=>c.id!==G.me),{kind:'friendly',label:'בדיקה'});G.live.live=true;for(let i=0;i<45;i++)stepMinute(G.live);G.live.half=true;G.live.awaitingHalf=true;save()");
 const before=state(m);const restored=boot(data(m));assert.equal(restored.ILM.G.live.m,45);assert.equal(restored.ILM.G.live.gh,before.live.gh);assert.equal(restored.ILM.G.live.ga,before.live.ga);assert.equal(restored.ILM.G.wk,before.wk);assert.equal(restored.ILM.G.results.length,before.results.length);assert.equal(restored.document.getElementById('ctrlBtn').textContent,'מחצית שנייה');
 const r=restored;
 // Halftime talk may only apply once, including across reload.
 r.document.querySelector('[data-ht="calm"]').click();assert.equal(r.ILM.G.live.halfTalk,'calm');const boost=r.ILM.G.live.boost[r.ILM.G.me];
 const again=boot(data(r));assert.equal(again.ILM.G.live.boost[again.ILM.G.me],boost);assert.equal(again.document.querySelector('[data-ht]'),null);
 // Invalid substitutes must not mutate the starting XI.
 assert.equal(r.eval('doSub(G.live,me(),999999999,bench(G.live,me())[0].id)'),false);
 const xi=r.eval('JSON.stringify(G.live.xi[G.me])');assert.equal(r.eval('doSub(G.live,me(),G.live.xi[G.me][0].pid,G.live.xi[G.me][1].pid)'),false);assert.equal(r.eval('JSON.stringify(G.live.xi[G.me])'),xi);
 // Legal substitutions persist; substituted players cannot return.
 r.eval('window.outId=G.live.xi[G.me][1].pid;window.inId=bench(G.live,me())[0].id');assert.equal(r.eval('doSub(G.live,me(),window.outId,window.inId)'),true);assert.equal(r.eval('doSub(G.live,me(),window.inId,window.outId)'),false);r.eval('save()');const afterSub=boot(data(r));assert.equal(afterSub.eval('G.live.used[G.me].includes('+r.outId+')'),true);
 // A failed load leaves the current in-memory career intact.
 const active=r.ILM.G;r.localStorage.setItem('ilm2_s2','{"clubs":[]}');assert.equal(r.eval('load(2)'),false);assert.equal(r.ILM.G,active);
 // Refuse future schema versions without downgrading them.
 const future=state(w);future.v=999;w.__future=JSON.stringify(future);const disk=w.localStorage.getItem('ilm2');assert.equal(w.eval('installCareer(window.__future,1)'),false);assert.equal(w.localStorage.getItem('ilm2'),disk);
 // Backups can recover an unreadable primary save from the startup warning.
 const recoveryStore=data(w);recoveryStore.ilm2='{broken';const recovered=boot(recoveryStore);assert.equal(recovered.ILM.G,null);assert.ok(recovered.document.getElementById('saveWarning'));recovered.eval('recoverBackup()');assert.ok(recovered.ILM.G);assert.equal(recovered.document.getElementById('saveWarning'),null);
 // Completed, unsettled games retain their penalty result and player-of-match across reload.
 r.eval('runInstant(G.live);G.live.ctx.kind="cup";G.live.ctx.stage="F";G.live.gh=1;G.live.ga=1;G.live.pens="h";G.live.finishPrepared=true;save()');
 const full=boot(data(r));assert.equal(full.ILM.G.live.pens,'h');assert.equal(full.document.getElementById('ctrlBtn').textContent,'סיכום המשחק');const star=JSON.stringify(full.ILM.G.live.motmLive);const full2=boot(data(full));assert.equal(full2.ILM.G.live.pens,'h');assert.equal(JSON.stringify(full2.ILM.G.live.motmLive),star);
 console.log('reliability assertions passed; errors []');
}finally{await new Promise(resolve=>setImmediate(resolve));for(const w of windows)w.close()}}
main().catch(e=>{console.error(e);process.exitCode=1});
