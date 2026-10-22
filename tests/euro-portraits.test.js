// European real squads: every player is either mapped to one verified, freely licensed Commons portrait (with its
// credit shipped in the pack) or recorded on the designed fallback with a reason. The game resolves faces by club +
// English name only, so a namesake in another club or league never borrows a face.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const E=read('data/visuals/euro-players.json'),audit=read('data/visuals/portrait-audit.json'),israeli=read('data/visuals/players.json');
const FREE=/^(CC0|Public domain|PD|CC BY(-SA)? [0-9.]+( [a-z]+)?)$/i;
function webpInfo(b){assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');return {w:1+b.readUIntLE(24,3),h:1+b.readUIntLE(27,3),alpha:!!(b[20]&0x10)}}
const vc=new VirtualConsole(),errors=[];
vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'ligat-haal-manager.html'),'utf8'),{url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true})}}).window;
async function main(){try{
 const clubs=fs.readdirSync(path.join(root,'data/euro')).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
 let ok=0;const packs={};
 for(const key of clubs){
  const squad=read('data/euro/'+key+'.json');
  const mapped=E.players.filter(p=>p.key===key),fb=E.unresolved.filter(p=>p.key===key);
  // every real player is accounted for exactly once, by the exact name in the project
  const names=squad.players.map(p=>p.en).sort();
  assert.deepEqual([...mapped,...fb].map(p=>p.en).sort(),names,'all players of '+key+' are mapped or on fallback');
  for(const p of [...mapped,...fb])assert.equal(p.club,squad.name_he,key);
  for(const p of fb)assert.ok(p.reason&&p.reason.length>10,'fallback reason: '+key+' '+p.en);
  for(const p of mapped){
   assert.match(p.visualId,/^wd-Q[0-9]+$/);assert.equal(p.visualId,'wd-'+p.qid);
   const f=E.faces[p.visualId];assert.ok(f,p.en);assert.equal(f.pack.replace(/^eu-/,''),f.pack.slice(3));
   const s=f.source;assert.match(s.page,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/,p.en);
   assert.match(s.license||'',FREE,'reusable licence: '+p.en+' '+s.license);assert.ok(s.author,'author: '+p.en);
   const a=audit[p.visualId];assert.ok(a,'audit: '+p.en);
   const pack=packs[f.pack]=packs[f.pack]||read('assets/facepacks/'+f.pack+'.json');
   assert.equal(pack.schema,2);assert.deepEqual(pack.frame,[240,300]);
   if(a.status!=='ok'){assert.equal(pack.images[p.visualId],undefined);assert.ok(a.reason);continue}
   const bytes=Buffer.from(pack.images[p.visualId].split(',')[1],'base64');
   assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256,p.en);
   const info=webpInfo(bytes);assert.equal(info.w,240);assert.equal(info.h,300);assert.ok(info.alpha);
   assert.ok(a.hairTop>=0.04,'whole head inside the frame: '+p.en);
   const c=pack.credits&&pack.credits[p.visualId];assert.ok(c&&c.a&&c.l&&c.u===s.page,'credit shipped with the face: '+p.en);ok++;
  }
 }
 // European faces never share an id with Israeli identities
 for(const k of Object.keys(E.faces))assert.equal(israeli.faces[k],undefined,k);
 assert.ok(ok>500,'European portraits shipped: '+ok);
 // in game: club + English name resolves the face; the same name elsewhere does not
 const sample=E.players.find(p=>audit[p.visualId]&&audit[p.visualId].status==='ok');
 const raw=read('data/euro/'+sample.key+'.json').players.find(r=>r.en===sample.en);
 assert.equal(w.eval(`playerVisualId(fromRawEuro(${JSON.stringify(raw)},70,${JSON.stringify(sample.club)}))`),sample.visualId);
 assert.equal(w.eval(`playerVisualId(fromRawEuro({he:'בדיקה',en:'Nobody Realname',pos:'MF',age:25,nat:'Spain',value_m:5},70,${JSON.stringify(sample.club)}))`),null);
 const fbp=E.unresolved[0];const fraw=read('data/euro/'+fbp.key+'.json').players.find(r=>r.en===fbp.en);
 assert.equal(w.eval(`playerVisual(fromRawEuro(${JSON.stringify(fraw)},70,${JSON.stringify(fbp.club)}))`),null,'fallback players render the designed fallback');
 // the profile shows the photo credit once the pack is loaded
 w.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,url)))});
 w.eval(`loadFacePack(${JSON.stringify(E.faces[sample.visualId].pack)})`);await Promise.all(w.eval('[...facePackRequests.values()]'));
 const html=w.eval(`portraitCreditHTML(fromRawEuro(${JSON.stringify(raw)},70,${JSON.stringify(sample.club)}))`);
 assert.match(html,/commons\.wikimedia\.org/);assert.match(html,/pp-credit/);
 assert.deepEqual(errors,[]);console.log(`european portraits: ${ok} faces with credits, ${E.unresolved.length} on fallback with reasons; errors []`);
}finally{await new Promise(r=>setImmediate(r));w.close()}}
main().catch(e=>{console.error(e);process.exitCode=1});
