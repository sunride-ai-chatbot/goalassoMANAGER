const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('beginner.html','utf8'),errors=[],rooms=new Map();let count=0;
function client(user){return {auth:{getSession:async()=>({data:{session:{user:{id:user}}}})},rpc:async(name,a)=>{let r=rooms.get(a.p_room||a.p_invitation);if(name==='mp_create_room'){const id='00000000-0000-4000-8000-'+String(++count).padStart(12,'0');rooms.set(id,{id,host:user,members:[{user,snapshot:JSON.parse(JSON.stringify(a.p_snapshot)),ready:false}],result:null});return {data:{id,invitation:id}}}if(name==='mp_join_room'){r.members.push({user,snapshot:JSON.parse(JSON.stringify(a.p_snapshot)),ready:false});return {data:{id:r.id}}}if(name==='mp_friendly_ready')r.members.find(m=>m.user===user).ready=true;if(name==='mp_friendly_commit'){assert.equal(user,r.host);assert.ok(r.members.every(m=>m.ready));r.result=JSON.parse(JSON.stringify(a.p_result))}return {data:{host:r.host===user,members:r.members.map(m=>({...m,mine:m.user===user})),result:r.result}}}}}
function boot(user){const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});return new JSDOM(html,{url:'https://goalasso.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};w.__roomClientFactory=async()=>client(user)}}).window}
async function until(fn){for(let i=0;i<240;i++){if(fn())return;await new Promise(r=>setTimeout(r,25))}throw Error('network UI timed out')}
(async()=>{const h=boot('host'),g=boot('guest');try{
 h.eval("Bcreate('mta')");g.eval("Bcreate('bje')");assert.ok(h.document.querySelector('[data-room-open]'));
 await h.eval('Rooms.open()');h.document.querySelector('[data-room-action="create"]').click();await until(()=>h.eval('!!G.networkRoom'));
 await until(()=>h.document.querySelector('[data-room-action="share"]'));let shared=null,copied=null;
 Object.defineProperty(h.navigator,'share',{configurable:true,value:async data=>{shared=data}});
 h.document.querySelector('[data-room-action="share"]').click();await until(()=>shared);assert.ok(shared.url.includes('invite='));
 await new Promise(r=>setTimeout(r,0));Object.defineProperty(h.navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied=value}}});
 h.document.querySelector('[data-room-action="copy"]').click();await until(()=>copied);assert.equal(copied,shared.url);
 const id=h.eval('G.networkRoom.id');await g.eval('Rooms.open()');g.document.querySelector('#room-invite').value=id;g.document.querySelector('[data-room-action="join"]').click();await until(()=>g.eval('!!G.networkRoom'));
 await until(()=>h.document.querySelector('[data-room-action="ready"]')&&g.document.querySelector('[data-room-action="ready"]'));h.document.querySelector('[data-room-action="ready"]').click();g.document.querySelector('[data-room-action="ready"]').click();
 await until(()=>h.document.querySelector('[data-room-action="start"]')?.disabled===false);
 const before=h.eval('JSON.stringify(G)'),uid=h.eval('uid');h.document.querySelector('[data-room-action="start"]').click();await until(()=>!!rooms.get(id).result);
 assert.equal(h.eval('JSON.stringify(G)'),before,'simulation cannot change career, standings, injuries, money or squad');assert.equal(h.eval('uid'),uid);
 h.document.querySelector('[data-room-action="skip"]').click();await until(()=>g.document.querySelector('[data-room-action="watch"]'));g.document.querySelector('[data-room-action="watch"]').click();await until(()=>g.document.querySelector('[data-room-action="skip"]'));g.document.querySelector('[data-room-action="skip"]').click();
 assert.equal(h.document.querySelector('#room-score').textContent,g.document.querySelector('#room-score').textContent);assert.equal(h.eval('Bstate().round'),0);assert.equal(g.eval('Bstate().round'),0);
 assert.deepEqual(errors,[]);console.log('network rooms: two managers invite, ready, real engine result, same score and preserved careers; errors []');
}finally{h.eval('Rooms.close()');g.eval('Rooms.close()');h.close();g.close()}})().catch(e=>{console.error(e);process.exitCode=1});
