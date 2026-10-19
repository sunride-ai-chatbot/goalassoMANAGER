const jsd=require('jsdom');const {JSDOM}=jsd;const fs=require('fs');
let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmNoSplash=1;window.__ilmUnlock=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const vc=new jsd.VirtualConsole();const errs=[];vc.on('jsdomError',e=>{if(!/Not implemented/.test(e.message))errs.push(e.message)});
const dom=new JSDOM(html,{virtualConsole:vc,runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{};
w.addEventListener('error',e=>errs.push(e.message));
setTimeout(()=>{const d=w.document;const run=c=>w.eval(c);
 d.querySelector('[data-pick="hpt"]').click();d.querySelector('#signBtn').click();d.querySelector('[data-sponsor="1"]').click();d.querySelector('[data-board="money"]').click();
 const out={};
 out.loan=run(`(()=>{G.paperPopOff=true;G.paperPop=[];try{closeFrontPage(true)}catch(e){};G.wk=0;const c=me();const p=c.players.slice().filter(x=>x.pos!=='GK').sort((a,b)=>a.ovr-b.ovr)[0];const opts=loanOutCandidates(p);const m0=c.money;doLoanOut(p.id,opts[0]);const to=club(opts[0].c.id);
   return {pid:p.id,name:fullName(p),to:to.short,role:opts[0].role,share:opts[0].share,inMine:c.players.some(x=>x.id===p.id),inTo:to.players.some(x=>x.id===p.id),list:G.loansOut.length,fee:c.money-m0,news:G.news[0]&&G.news[0].t||G.news[0]}})()`);
 out.guard=run(`(()=>{const f=sellerClub(${out.loan.pid});return f===null})()`);
 out.train0=run(`(()=>{const c=me();c.plan=['fit','fit','fit','fit','fit'];const fx=planFx(c);return {load:fx.load,inj:+fx.inj.toFixed(2),dev:+fx.dev.toFixed(2),rec:fx.rec,tac:c.tacFam,cond:c.cond}})()`);
 // exploit: change plan many times, render — no effect until week processes
 out.exploit=run(`(()=>{const c=me();const ovr=c.players.map(p=>p.ovr).join();for(let i=0;i<50;i++){c.plan=PLAN_PRESETS[['dev','bal','fit'][i%3]].d.slice();render()}return ovr===c.players.map(p=>p.ovr).join()&&c.tacFam===60})()`);
 run(`me().plan=['fit','fit','tac','tac','prep']`);
 let weeks=0;const t0=Date.now();
 while(weeks<40&&run(`G.phase==='play'`)){run(`try{closeFrontPage(true)}catch(e){};G.paperPop=[];simOneWeek()`);weeks++;if(weeks===3)out.after3=run(`(()=>{const c=me();const f=loanedOut()[0];return {tac:c.tacFam,cond:c.cond,prep:c.prepLeft,int:c.intensity,str:+strength(c).toFixed(2),bonus:+trainBonus(c).toFixed(2),loanStill:!!f,loanClub:f&&f.c.short,apps:f&&(f.p.apps-f.p.loanOut.apps0),wageLog:(me().log||G.log||[]).slice?0:0}})()`)}
 out.mid=run(`(()=>{const f=loanedOut()[0];return f?{apps:(f.p.apps||0)-f.p.loanOut.apps0,ovr:f.p.ovr,ovr0:f.p.loanOut.ovr0,inj:f.p.inj,morale:f.p.morale}:'gone'})()`);
 out.loanNews=run(`G.news.filter(n=>/השאלה/.test(typeof n==='string'?n:n.t||'')).slice(0,4).map(n=>typeof n==='string'?n:n.t)`);
 // run to season end
 let guard=0;while(guard++<80&&run(`G.phase==='play'`)){run(`try{closeFrontPage(true)}catch(e){};G.paperPop=[];simOneWeek()`)}
 out.end=run(`(()=>{const c=me();return {phase:G.phase,back:c.players.some(p=>p.id===${out.loan.pid}),loansOut:(G.loansOut||[]).length,flag:!!(c.players.find(p=>p.id===${out.loan.pid})||{}).loanOut}})()`);
 out.backNews=run(`G.news.map(n=>typeof n==="string"?n:n.t).filter(t=>t&&t.includes(${JSON.stringify(out.loan.name)})).slice(0,5)`);out.tlog=run(`(G.tlog||[]).map(x=>typeof x==="string"?x:x.t).filter(t=>t&&t.includes(${JSON.stringify(out.loan.name)})).slice(0,5)`);
 console.log(JSON.stringify(out,null,1),'weeks',weeks,'errs',errs.slice(0,5));process.exit(0)},800);
