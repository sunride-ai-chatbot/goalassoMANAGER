const {JSDOM}=require('jsdom');const assert=require('node:assert/strict');
const fs=require('fs');let html=fs.readFileSync(require('path').join(__dirname,'..','ligat-haal-manager.html'),'utf8');
html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html.replace(/<link[^>]*>/g,'')+'</body></html>';
async function run(pick){
  const dom=new JSDOM('<script>window.__ilmUnlock=1;window.__ilmNoSplash=1</script>'+html,{url:'https://simulation.test/',runScripts:'dangerously',pretendToBeVisual:true});
  const w=dom.window;w.matchMedia=()=>({matches:true});
  const errors=[];w.addEventListener('error',e=>errors.push(e.message));
  const $=id=>w.document.getElementById(id);
  const click=el=>{if(!el)return false;el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));return true};
  if(pick.startsWith('l_'))click($('toggleLeumit'));
  click(w.document.querySelector(`[data-pick="${pick}"]`));
  click($('signBtn'));click(w.document.querySelector('[data-sponsor="0"]'));click(w.document.querySelector('[data-board="none"]'));
  const G=w.ILM.G;G.pressMode='off';
  function simSeason(){
    for(let i=0;i<200;i++){
      if(G.phase==='seasonEnd')return true;
      G.view='home';w.ILM.render();
      const t=$('toLineupBtn');
      if(t){click(t);click($('skipBtn'))}
      else if(!click($('playBtn')))return false;
    }
    return G.phase==='seasonEnd';
  }
  const s1pos=G.summary&&G.summary.pos;
  if(!simSeason()){console.log(`${pick}: S1 STUCK phase=${G.phase} wk=${G.wk}`);await new Promise(resolve=>setImmediate(resolve));dom.window.close();return}
  const pos1=G.summary.pos;
  click($('nextSeasonBtn'));
  if(G.phase==='sponsor')click(w.document.querySelector('[data-sponsor="0"]'));
  if(G.phase==='board')click(w.document.querySelector('[data-board="none"]'));
  if(G.phase==='fired'){
    // take first job offer
    click(w.document.querySelector('[data-job]'));for(let k=0;k<2;k++){const a=w.document.querySelector('[data-ia]');if(a)click(a)}
    console.log(`${pick}: FIRED after S1, took new job`);
  }
  if(!simSeason()){console.log(`${pick}: S2 STUCK phase=${G.phase} wk=${G.wk} s1pos=${pos1}`);await new Promise(resolve=>setImmediate(resolve));dom.window.close();return}
  const pos2=G.summary.pos;
  const hp=w.ILM.me().players.filter(p=>p.hist&&p.hist.length).sort((a,b)=>b.hist.length-a.hist.length)[0];if(pick==='mta')console.log('hist sample',hp&&hp.last,JSON.stringify(hp&&hp.hist));
  console.log(`${pick}: S1pos=${pos1} S2pos=${pos2} div=${G.div} hist=${(G.hist||[]).length} err=${errors.length}`);
  assert.deepEqual(errors,[]);
  await new Promise(resolve=>setImmediate(resolve));dom.window.close();
}
(async()=>{for(const club of ['mta','hje','hbs','mhf'])await run(club);console.log('errors []')})().catch(e=>{console.error(e);process.exitCode=1});
