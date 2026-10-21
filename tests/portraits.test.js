const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/visuals/players.json')));
const audit=JSON.parse(fs.readFileSync(path.join(root,'data/visuals/portrait-audit.json')));
// canonical frame read from the WebP header: RIFF....WEBPVP8X, alpha flag, canvas width/height (24-bit, minus one)
function webpInfo(b){assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');assert.equal(b.toString('ascii',12,16),'VP8X');return {alpha:!!(b[20]&0x10),w:1+b.readUIntLE(24,3),h:1+b.readUIntLE(27,3)}}
const vc=new VirtualConsole(),errors=[];
vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'ligat-haal-manager.html'),'utf8'),{url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true})}}).window;
async function main(){try{
 assert.equal(manifest.players.length,388);
 assert.equal(Object.keys(manifest.faces).length,385); // Three duplicate records share one person's identity.
 for(const [key,f] of Object.entries(manifest.faces)){
  const a=audit[key];assert.ok(a,'every identity has an audit entry: '+key);assert.ok(['ok','unresolved'].includes(a.status),key);
  const pack=JSON.parse(fs.readFileSync(path.join(root,'assets/facepacks',f.pack+'.json')));assert.equal(pack.schema,2);assert.deepEqual(pack.frame,[240,300]);
  if(a.status!=='ok'){assert.equal(pack.images[key],undefined,'unresolved portraits ship no image: '+key);assert.ok(a.reason,key);continue}
  assert.match(pack.images[key],/^data:image\/webp;base64,/);const bytes=Buffer.from(pack.images[key].split(',')[1],'base64');
  assert.ok(bytes.length>1000,key);assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),a.sha256);
  const info=webpInfo(bytes);assert.equal(info.w,240,key);assert.equal(info.h,300,key);assert.ok(info.alpha,key);
  assert.ok(a.hairTop>=0.04,'whole head inside the frame: '+key);assert.match(a.skin||'',/^#[0-9a-f]{6}$/,key);
 }
 const unresolved=Object.entries(audit).filter(([,a])=>a.status!=='ok').map(([k])=>k);
 w.eval("newGame('mta','בדיקת פנים')");
 assert.equal(w.eval('RAW.flatMap(c=>c.players).filter(r=>!playerVisualId(fromRaw(r,65))).length'),0);
 // a European namesake never borrows an Israeli face (Celtic's Jota vs Hapoel Ramat Gan's Jota), new or from an old save
 assert.equal(w.eval("playerVisualId(fromRawEuro({he:\"ז'וטה\",en:'Jota',pos:'FW',age:27,nat:'Portugal',value_m:8},70))"),null);
 assert.equal(w.eval("playerVisualId({id:1,first:\"ז'וטה\",last:'',real:true,en:'Jota'})"),null);
 // unresolved faces keep their identity but render the designed fallback, never another face
 for(const k of unresolved)assert.equal(w.eval(`playerVisual({visualId:'${k}'})`),null);
 const malika=w.eval("me().players.find(p=>fullName(p)==='אופק מליקה')");
 assert.ok(malika);assert.equal(malika.visualId,'ifa-143447');
 const dor=w.eval("me().players.find(p=>fullName(p)==='דור פרץ')");
 assert.equal(dor.visualId,'ifa-59512');assert.notEqual(malika.visualId,dor.visualId);
 // Imported v7 saves have no visual field. Match verified real names or original roster IDs.
 delete malika.visualId;delete dor.visualId;
 assert.equal(w.eval('playerVisualId(me().players.find(p=>fullName(p)===\'אופק מליקה\'))'),'ifa-143447');
 assert.equal(w.eval('playerVisualId(me().players.find(p=>fullName(p)===\'דור פרץ\'))'),'ifa-59512');
 assert.equal(w.eval("(()=>{const p=makePlayer('MF',60,false);p.first='דור';p.last='פרץ';return playerVisualId(p)})()"),null);
 assert.equal(w.eval("playerVisualId({id:999999,first:'דור',last:'פרץ',real:false})"),null);
 // The actual purchase flow moves the same visual identity and picks up the buyer's kit/contract.
 w.eval("G.me='hbs';G.phase='play';G.wk=0;me().money=1e9;me().sponsor={name:'בדיקת חסות'};G.pressMode='off';G.paperPop=[]");
 const before=w.eval("club('mta').players.find(p=>fullName(p)==='דור פרץ').visualId");
 w.eval("buyPlayer('mta',club('mta').players.find(p=>fullName(p)==='דור פרץ').id);closeReveal(true)");
 assert.equal(w.eval("me().players.find(p=>fullName(p)==='דור פרץ').visualId"),before);
 const html=w.eval("cinematicPlayerHTML(me(),me().players.find(p=>fullName(p)==='דור פרץ'),'transfer')");
 assert.match(html,/ifa-59512/);assert.match(html,/class="pp"/);assert.match(html,/בדיקת חסות/);
 assert.equal(w.eval("playerClub(me().players.find(p=>fullName(p)==='דור פרץ')).id"),'hbs');
 w.eval("save();G=null;load()");
 assert.equal(w.eval("me().players.find(p=>fullName(p)==='דור פרץ').visualId"),before);
 w.eval("G.view='lineup';G.paperPop=[];render()");w.document.querySelector('#autoBtn').click();
 for(const node of w.document.querySelectorAll('.cine-sub'))assert.ok(node.querySelector('.player-portrait'));
 // Real on-demand loader: one request per pack and correct photos after DOM insertion.
 const requests=[];w.fetch=async url=>{requests.push(url);return {ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,url)))}};
 w.eval('render()');await Promise.all(w.eval('[...facePackRequests.values()]'));
 assert.equal(new Set(requests).size,requests.length);
 assert.ok(requests.length>0&&requests.length<14);
 assert.ok(w.document.querySelectorAll('.pp-photo').length>10);
 for(const g of w.document.querySelectorAll('.pp[data-visual-id]')){assert.equal(g.getAttribute('data-pp-state'),'ready');const img=g.querySelector('.pp-photo');assert.match(img.getAttribute('href'),/^data:image\/webp;base64,/);
  const want=JSON.parse(fs.readFileSync(path.join(root,'assets/facepacks',g.getAttribute('data-pack')+'.json'))).images[g.getAttribute('data-visual-id')];assert.equal(img.getAttribute('href'),want,'the right photo for the right player')}
 const count=requests.length;w.eval('render()');await Promise.resolve();assert.equal(requests.length,count);
 // A failed pack is recoverable and never disables lineup selection.
 w.eval('facePackCache.clear()');w.fetch=async()=>{throw new Error('offline')};
 w.eval('render()');await Promise.all(w.eval('[...facePackRequests.values()]'));
 assert.ok(w.document.querySelector('#autoBtn'));assert.ok(w.eval('facePackFailures.size')>0);
 const states=[...w.document.querySelectorAll('.pp[data-visual-id]')].map(g=>g.getAttribute('data-pp-state'));assert.ok(states.length&&states.every(s=>s==='failed'),'failed packs show the fallback');
 for(const g of w.document.querySelectorAll('.pp'))assert.ok(g.querySelector('.pp-fb'),'every portrait carries its fallback');
 assert.deepEqual(errors,[]);console.log('official portraits, legacy identities, generated players, transfers and saves passed; errors []');
}finally{await new Promise(resolve=>setImmediate(resolve));w.close()}}
main().catch(e=>{console.error(e);process.exitCode=1});
