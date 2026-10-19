const {JSDOM}=require('jsdom');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{runScripts:'dangerously',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:true});
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
const $=id=>w.document.getElementById(id);const click=el=>{if(!el)throw new Error('missing');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};const q=s=>w.document.querySelector(s);
click(q('[data-pick="mhf"]'));click($('signBtn'));click(q('[data-sponsor="0"]'));click(q('[data-board="none"]'));
const G=w.ILM.G,c=w.ILM.me();G.pressMode='off';c.money=80e6;
console.log('staff',Object.entries(G.staff).map(([k,v])=>k+':'+v.q+(v.base?'b':'')).join(' '));
// staff hire
G.view='club';w.ILM.render();click(q('[data-ctab="staff"]'));click(q('[data-staffopen="anl"]'));const cands=G.staffMarket.anl.list;console.log('anl candidates',cands.map(x=>x.q+'★ '+x.wage+' '+x.spec).join(' | '),'fit text',q('.ment .tiny[style*="info"]')&&q('.ment .tiny[style*="info"]').textContent.slice(0,80));
const best=cands.slice().sort((a,b)=>b.q-a.q)[0];click(q(`[data-staffhire="anl:${best.id}"]`));console.log('hired anl',G.staff.anl.q,G.staff.anl.name,'wage',G.staff.anl.wage);
// go to a league match lineup
let rep=null,plays=0;
for(let i=0;i<14&&plays<4;i++){G.view='home';w.ILM.render();const t=$('toLineupBtn');if(t){click(t);const an=q('.analyst');if(an&&!rep){rep=an.textContent.replace(/\s+/g,' ').slice(0,260);console.log('REPORT:',rep)}
   const pb=q('[data-plan^="mark"]')||q('[data-plan^="press"]');if(pb){click(pb);console.log('plan set',JSON.stringify(G.plan&&{k:G.plan.kind,t:G.plan.targetName,conf:G.plan.conf}),'on class',!!q('.plan.on'))}
   click($('skipBtn'));plays++;const r=G.results.filter(r=>r.h===G.me||r.a===G.me).slice(-1)[0];console.log('rec plan',r.plan&&r.plan.kind,'switch',r.oppSwitch,'conf',r.anConf);
   const html=w.eval('matchReportHTML(G.results.filter(r=>r.h===G.me||r.a===G.me).slice(-1)[0])');const m=html.match(/התוכנית:[^<]*<\/h3><span class="tag [a-z]+">([^<]*)<\/span>(.*?)<\/div><\/div>/);console.log('verdict',m?m[1]+' | '+m[2].replace(/<[^>]+>/g,' ').slice(0,140):'(none)')}
 else click($('playBtn'))}
console.log('errors',errors);
