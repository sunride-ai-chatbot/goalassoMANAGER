const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('beginner.html','utf8'),errors=[];
function boot(seed={}){const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});return new JSDOM(html,{url:'https://goalasso.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};for(const [k,v] of Object.entries(seed))w.localStorage.setItem(k,v)}}).window}
const w=boot({'ilm2':'PRO_CAREER_UNCHANGED'});let restored;
try{
 w.eval("Bcreate('mta');Bplay();BstopBroadcast();const M=Bstate().live.M;M.done=true;M.m=90;M.gh=M.h===G.me?3:0;M.ga=M.a===G.me?3:0;");
 const proto=w.Storage.prototype,real=proto.setItem;
 proto.setItem=function(k,v){if(k.endsWith('.backup'))throw new w.DOMException('full','QuotaExceededError');return real.call(this,k,v)};
 w.eval('Btick(true)');assert.equal(w.eval('me().pts'),3);assert.equal(w.eval('me().P'),1);assert.equal(w.eval('Bstate().round'),1);
 const saved=w.localStorage.getItem('goalasso.beginner.v1');assert.equal(JSON.parse(saved).G.clubs.find(c=>c.id==='mta').pts,3,'backup quota must not lose the primary result');
 const rev=w.eval('BsaveRev');proto.setItem=function(k,v){if(k==='goalasso.beginner.v1')throw new w.DOMException('full','QuotaExceededError');return real.call(this,k,v)};
 assert.equal(w.eval('Bwrite()'),false);assert.equal(w.eval('BsaveRev'),rev,'failed write must not poison revision');assert.equal(w.localStorage.getItem('goalasso.beginner.v1'),saved);
 proto.setItem=real;assert.equal(w.eval('Bwrite()'),true,'retry works after space is available');
 const latest=w.localStorage.getItem('goalasso.beginner.v1');restored=boot({'goalasso.beginner.v1':latest,'ilm2':'PRO_CAREER_UNCHANGED'});
 assert.equal(restored.eval('me().pts'),3);assert.equal(restored.eval('me().P'),1);assert.equal(restored.eval('Bstate().round'),1);assert.equal(restored.localStorage.getItem('ilm2'),'PRO_CAREER_UNCHANGED');restored.close();restored=null;
 restored=boot({'goalasso.beginner.v1':'{broken','goalasso.beginner.v1.backup':latest});assert.equal(restored.eval('me().pts'),3);assert.equal(restored.eval('Bwrite()'),true,'backup recovery can save again');
 assert.deepEqual(errors,[]);console.log('beginner persistence: win, backup quota, primary failure/retry, fresh reopen and recovery passed; errors []');
}finally{w.close();restored?.close()}
