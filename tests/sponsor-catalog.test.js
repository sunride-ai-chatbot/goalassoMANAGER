const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/sponsors/catalog.json'),'utf8'));
assert.equal(catalog.length,50);assert.equal(new Set(catalog.map(b=>b.id)).size,50);assert.equal(new Set(catalog.map(b=>b.name)).size,50);
assert.equal(catalog.filter(b=>b.priority).length,6);
assert.ok(catalog.find(b=>b.id==='friedrich-bauer'));assert.ok(catalog.find(b=>b.id==='friedrich-bauer-helmets'));
for(const b of catalog)assert.ok(fs.statSync(path.join(root,b.logo)).size>0,b.logo);
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'ligat-haal-manager.html'),'utf8'),{url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true})}}).window;
const run=code=>JSON.parse(w.eval('JSON.stringify('+code+')'));
async function main(){try{
 for(const sel of ['[data-pick="mta"]','#signBtn','[data-sponsor="0"]','[data-board="none"]'])w.document.querySelector(sel).click();
 w.eval("G.pressMode='off';G.paperPop=[]");
 const coverage=run(`(()=>{const c={tier:4,div:'leumit',squadValue:3000000,fans:40},seen=new Set();let invalid=false,priority=true;for(let i=0;i<50;i++){const offers=sponsorOffers(c);if(new Set(offers.map(o=>o.name)).size!==3)invalid=true;for(const o of offers){const b=sponsorBrand(o);seen.add(b.id);if(!b.priority&&b.level!=='local')invalid=true;if(o.annual>1500000||o.annual<=0)invalid=true}priority=priority&&offers.slice(0,2).every(o=>sponsorBrand(o).priority)}return {seen:seen.size,invalid,priority}})()`);
 assert.equal(coverage.invalid,false);assert.equal(coverage.priority,true);assert.equal(coverage.seen,26);
 assert.ok(w.eval("sponsorBudget({tier:1,squadValue:200e6,fans:90},SPONSOR_CATALOG[0])>sponsorBudget({tier:4,div:'leumit',squadValue:3e6,fans:40},SPONSOR_CATALOG[0])"));
 // Upgrading an old career refreshes unsigned offers, without paying or changing active contracts.
 w.eval("me().sponsor={name:'ספונסר ותיק',annual:987654,years:2};me().ads=[{id:999,brand:'קמפיין ותיק',weekly:700,upfront:1200,bonus:{kind:'win',he:'לכל ניצחון',amt:100},weeks:10,left:7,paid:2100}];G.adOffers=[{id:3,brand:'ישן',s:G.season,exp:G.wk+3}]");
 const before=run('({money:me().money,sp:me().sponsor,ads:me().ads})');
 w.eval('ensureAdOffers()');
 assert.deepEqual(run('({money:me().money,sp:me().sponsor,ads:me().ads})'),before);
 assert.ok(w.eval('G.adOffers.every(o=>o.catalogVersion===1)'));
 // One annual contract is paid once in weekly installments; repeating acceptance does not double-pay.
 w.eval('me().ads=[];G.adOffers=[];ensureAdOffers()');
 const offer=run('G.adOffers[0]'),money=w.eval('me().money');
 assert.equal(offer.weeks,46);w.eval(`acceptAd(${offer.id});acceptAd(${offer.id})`);
 assert.equal(w.eval('me().money'),money+offer.upfront);assert.equal(w.eval('me().ads.length'),1);
 w.eval('for(let i=0;i<46;i++)adsWeekly(me())');
 assert.equal(w.eval('me().money'),money+offer.upfront+offer.weekly*46);assert.equal(w.eval('me().ads.length'),0);
 // A new logo follows the current contract, while legacy contracts keep readable text.
 w.eval("me().sponsor={name:'Friedrich Bauer HELMETS'};G.view='club';clubTab='com';render()");
 assert.equal(w.document.querySelectorAll('.sponsor-brand').length,50);
 assert.ok(w.document.querySelector('img[src="assets/sponsors/friedrich-bauer-helmets.png"]'));
 assert.ok(w.document.body.textContent.includes('לשנה'));
 assert.ok(!w.eval('viewCommercial()').includes('/שבוע'));
 assert.ok(w.eval("kitSponsor(me()).includes('friedrich-bauer-helmets.png')"));
 w.eval("me().sponsor={name:'Friedrich Bauer'}");assert.ok(w.eval("kitSponsor(me()).includes('friedrich-bauer.png')"));
 w.eval("me().sponsor={name:'ספונסר ותיק'}");assert.ok(w.eval("kitSponsor(me()).includes('ספונסר ותיק')"));
 assert.deepEqual(errors,[]);console.log('50 brands, priority, small clubs, rotation, legacy contracts, annual payments and logos passed; errors []');
 }finally{await new Promise(r=>setImmediate(r));w.close()}}
main().catch(e=>{console.error(e);process.exitCode=1});
