const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');

async function main(){
  const errors=[],vc=new VirtualConsole();
  vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
  const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'..','ligat-haal-manager.html'),'utf8'),{
    url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
    beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true});}
  });
  const w=dom.window,d=w.document;
  const click=s=>{const el=d.querySelector(s);assert.ok(el,s);el.click();};
  const change=(id,value)=>{const el=d.getElementById(id);assert.ok(el,id);el.value=String(value);el.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const ids=()=>Array.from(d.querySelectorAll('[data-wrow]'),el=>Number(el.dataset.wrow)).sort((a,b)=>a-b);
  const range=(min,max)=>{d.getElementById('marketPriceMin').value=min;d.getElementById('marketPriceMax').value=max;d.getElementById('marketPriceRange').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
  try{
    for(const s of ['[data-pick="mnt"]','#signBtn','[data-sponsor="0"]','[data-board="none"]'])click(s);
    w.eval("G.pressMode='off';G.motion='off';G.renderer='svg';G.paperPop=[]");
    const G=w.ILM.G,c=w.ILM.me(),seller=G.clubs.find(x=>x.id!==G.me),template={...seller.players[0]};
    c.money=6700000;
    for(const cl of [...G.clubs,...G.leumit])if(cl.id!==G.me)cl.players=[];
    // Affordable players come after the original 50-row limit, so filtering must precede it.
    seller.players=Array.from({length:60},(_,i)=>({...template,id:900000+i,value:20000000,ovr:90,pos:'FW'}));
    const prices=[500000,1000000,1500000,6700000,6710000,0];
    prices.forEach((value,i)=>seller.players.push({...template,id:900060+i,value,ovr:70,pos:i===1?'MF':'DF'}));
    G.view='market';w.ILM.render();
    assert.equal(ids().length,50);
    change('marketPrice',1000000);
    assert.deepEqual(ids(),[900060,900061,900065]);
    assert.match(d.querySelector('.market-results').textContent,/3 שחקנים/);
    click('[data-mp="MF"]');assert.deepEqual(ids(),[900061]);
    click('[data-ms="price-asc"]');assert.deepEqual(ids(),[900061]);
    click('[data-mp="all"]');
    // Current squads mark foreign players explicitly; older saves may have only nationality.
    seller.players.forEach(p=>{p.foreign=false;p.nat='ישראל'});
    seller.players[0].foreign=true;seller.players[0].nat='זר';
    delete seller.players[1].foreign;seller.players[1].nat='Brazil';
    click('[data-mcat="legionnaires"]');assert.deepEqual(ids(),[900000,900001]);
    click('[data-mcat="all"]');assert.equal(ids().length,50);
    change('marketPrice','budget');
    assert.deepEqual(ids(),[900060,900061,900062,900063,900065]);
    c.money=1000000;w.ILM.render();assert.deepEqual(ids(),[900060,900061,900065]);
    c.money=-100;w.ILM.render();assert.deepEqual(ids(),[900065]);
    c.money=6700000;
    change('marketPrice','custom');range('500000','1500000');
    assert.deepEqual(ids(),[900060,900061,900062]);
    range('1500000','500000');
    assert.ok(d.getElementById('marketPriceError').textContent);
    assert.deepEqual(ids(),[900060,900061,900062]);
    range('-1','500000');assert.ok(d.getElementById('marketPriceError').textContent);
    assert.deepEqual(ids(),[900060,900061,900062]);
    range('1000000','1000000');assert.deepEqual(ids(),[900061]);
    range('','500000');assert.deepEqual(ids(),[900060,900065]);
    range('6700000','');assert.ok(ids().includes(900063));assert.ok(!ids().includes(900062));
    range('0','0');assert.deepEqual(ids(),[900065]);
    range('1','2');assert.deepEqual(ids(),[]);assert.ok(d.querySelector('.market-empty [data-price-reset]'));
    click('.market-empty [data-price-reset]');assert.equal(ids().length,50);assert.equal(d.getElementById('marketPrice').value,'all');
    change('marketPrice','1000000');click('#nav [data-view="home"]');click('#nav [data-view="market"]');
    assert.equal(d.getElementById('marketPrice').value,'1000000');assert.deepEqual(ids(),[900060,900061,900065]);
    // World prices must include the league multiplier, matching the displayed market value.
    click('[data-mtab="world"]');
    const clubs=G.world.champ.clubs;for(const cl of clubs)cl.players=[];
    clubs[0].players=[
      {...template,id:910001,value:500000,vmult:2,kn:2,lg:'champ'},
      {...template,id:910002,value:750000,vmult:2,kn:2,lg:'champ'},
      {...template,id:910003,value:1500000,vmult:.5,kn:2,lg:'champ'}
    ];
    w.ILM.render();assert.deepEqual(ids(),[910001,910003]);
    click('[data-price-reset]');assert.deepEqual(ids(),[910001,910002,910003]);
    change('marketPrice','custom');range('','');assert.deepEqual(ids(),[910001,910002,910003]);
    assert.equal(c.money,6700000);
    await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(errors,[]);
    console.log('market price UI: presets, inclusive ranges, budget changes, position/sort, reset, navigation and world currency multipliers passed');
  }finally{await new Promise(resolve=>setImmediate(resolve));w.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
