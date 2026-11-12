// Real names where the game used to invent them: the clubs that come up from Liga Alef field their registered squads, and
// academy prospects / squad top-ups of a club with a youth side in the data carry the names of that side. Names only come
// from the source: no ids, links or photos ship, a prospect never borrows another player's portrait, a name is used once.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const html=fs.readFileSync(path.join(root,'ligat-haal-manager.html'),'utf8');
const w=new JSDOM(html,{url:'https://alef.test/',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
const $=s=>w.document.querySelector(s);const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));
(async()=>{
 try{
  // ---- what ships: names and clubs, nothing that points at a person's page or picture; masked names never
  for(const bad of ['ImageServer','player_id=','players/player','*****'])assert.ok(!html.includes(bad),'the build must not contain '+bad);
  for(const f of fs.readdirSync(path.join(root,'data','euro')).filter(f=>f.startsWith('a_'))){const d=JSON.parse(fs.readFileSync(path.join(root,'data','euro',f),'utf8'));
    assert.deepEqual(d.generated,['pos','value_m'],f+' says which fields are the game\'s');assert.ok(d.players.length>=14,f);assert.ok(d.players.every(p=>p.he&&p.he.split(' ').length>=2&&['GK','DF','MF','FW'].includes(p.pos)&&p.age===null&&p.value_m>=.04&&p.value_m<=.16&&Object.keys(p).sort().join()==='age,en,he,nat,pos,value_m'),f+' player fields');
    assert.ok(d.players.filter(p=>p.pos==='GK').length>=2,f+' has keepers');assert.equal(new Set(d.players.map(p=>p.he)).size,d.players.length,f+' no name twice')}
  const yc=JSON.parse(fs.readFileSync(path.join(root,'data','config','youth-squads.json'),'utf8'));for(const [club,v] of Object.entries(yc.clubs)){assert.deepEqual(Object.keys(v).sort(),['ifa_team','players','team'],club);assert.ok(v.players.every(n=>typeof n==='string'&&n.split(' ').length>=2),club+' holds names only')}

  await w.ILM.ready;for(const s of ['[data-pick="mhf"]','#signBtn','[data-sponsor="0"]','[data-board="none"]'])$(s).click();
  w.eval("G.pressMode='off';G.motion='off';G.sound=false;G.paperPopOff=true;G.paperPop=[]");
  // ---- the data in the game
  const pool=run('ALEF_POOL.map(a=>({name:a[0],lg:a[4],n:(RAW_EURO[a[0]]||[]).length}))');assert.ok(pool.length>=30,'both districts, got '+pool.length);assert.ok(pool.every(a=>a.n>=14),'every club in the pool has a squad to field');
  assert.ok(pool.some(a=>a.lg==='alef_north')&&pool.some(a=>a.lg==='alef_south'));assert.equal(run('Object.keys(RAW_YOUTH).length'),19);
  assert.ok(run("Object.keys(RAW_YOUTH).every(n=>[...G.clubs,...G.leumit].some(c=>c.name===n)||ALEF_POOL.some(a=>a[0]===n))"),'every youth side belongs to a club of the game');

  // ---- a new career: prospects of a club with a youth side are its real players
  const yo=run(`[...G.clubs,...G.leumit].filter(c=>RAW_YOUTH[c.name]).map(c=>({name:c.name,n:c.youth.length,gen:c.youth.filter(generatedPlayer).length,own:c.youth.filter(y=>y.real&&y.visualId===null).every(y=>RAW_YOUTH[c.name].includes(fullName(y))),young:c.youth.every(y=>y.age<=20),face:c.youth.filter(y=>y.real&&y.visualId===null&&playerVisual(y)).length,inv:c.youth.filter(y=>y.real&&inventedPlayer(y)).length}))`);
  assert.ok(yo.length>=15,'clubs with a youth side in a new career: '+yo.length);for(const c of yo){assert.equal(c.gen,0,c.name+' has no generated prospect');assert.ok(c.own,c.name+' prospects come from its own youth side');assert.equal(c.face,0);assert.equal(c.inv,0);assert.ok(c.young)}
  assert.ok(run("me().youth.every(y=>y.real)"),'also the manager\'s own academy');
  assert.equal(run(`(()=>{const seen=new Set();let dup=0;for(const c of [...G.clubs,...G.leumit])for(const y of c.youth){if(!(y.real&&y.visualId===null))continue;const k=nameKey(fullName(y));if(seen.has(k))dup++;seen.add(k)}return dup})()`),0,'no prospect twice');
  const other=run(`[...G.clubs,...G.leumit].filter(c=>!RAW_YOUTH[c.name]).map(c=>c.youth.filter(generatedPlayer).length)`);assert.ok(other.length&&other.every(n=>n>0),'a club without a youth side in the data keeps generated prospects');
  // a name is given once, never while somebody of that name is in the game, and never brings another player's portrait
  const rules=run(`(()=>{const faceName=Object.keys(PLAYER_VISUALS.names).find(n=>!namesInGame().has(nameKey(n)))||Object.keys(PLAYER_VISUALS.names)[0];const inGame=fullName(me().players[0]);
    RAW_YOUTH['__t']=[faceName];RAW_YOUTH['__u']=[inGame];const a=makeYouth(1)[0],b=makeYouth(1)[0],c=makeYouth(1)[0];const taken=new Set();
    const o={first:giveRealName(a,{name:'__t'},taken),named:fullName(a)===faceName,real:a.real,gen:a.gen,face:!!playerVisual(a),again:giveRealName(b,{name:'__t'},taken),bGen:generatedPlayer(b),clash:giveRealName(c,{name:'__u'}),used:G.yused['__t']};
    delete RAW_YOUTH['__t'];delete RAW_YOUTH['__u'];delete G.yused['__t'];delete G.yused['__u'];return o})()`);
  assert.deepEqual(rules,{first:true,named:true,real:true,face:false,again:false,bGen:true,clash:false,used:[0]},'once per career, no clash, no borrowed face');

  // ---- a club from Liga Alef: the real squad
  const al=run(`(()=>{const c=alefClub();return {inPool:ALEF_POOL.some(a=>a[0]===c.name),n:c.players.length,data:RAW_EURO[c.name].length,real:c.players.every(p=>p.real&&!inventedPlayer(p)&&!generatedPlayer(p)),rs:c.realSquad,gk:c.players.filter(p=>p.pos==='GK').length,str:strength(c),isr:c.players.every(p=>p.nat==='ישראל'&&!p.foreign),face:c.players.filter(p=>playerVisual(p)).length,short:c.short,names:c.players.every(p=>RAW_EURO[c.name].some(r=>r.he===fullName(p))),ages:c.players.every(p=>p.age>=18&&p.age<=34)}})()`);
  assert.ok(al.inPool);assert.equal(al.n,al.data,'the whole registered squad, nobody added');assert.ok(al.real);assert.ok(al.rs);assert.ok(al.gk>=2);assert.ok(al.isr);assert.equal(al.face,0,'no portrait is guessed for them');assert.ok(al.names);assert.ok(al.ages);
  assert.ok(al.str>=49&&al.str<=57,'about the level of the bottom of the Leumit, got '+al.str);assert.ok(!/^(הפועל|מכבי|מ\.ס\.|מ\.כ\.) /.test(al.short),'short name: '+al.short);

  // ---- the end of a season: two real clubs come up, intake and top-ups use real names while the list lasts
  const before=run('G.leumit.map(c=>c.name)');
  w.eval("(()=>{const x=G.clubs.find(c=>c.id==='hta');x.players=x.players.slice(0,15).filter(p=>p.pos!=='GK');x.youth.forEach(y=>y.age=20);const z=G.clubs.find(c=>c.id==='bsk');z.players=z.players.slice(0,16)})()");w.eval('endSeason()');
  const up=run(`G.leumit.filter(c=>!${JSON.stringify(before)}.includes(c.name)&&ALEF_POOL.some(a=>a[0]===c.name)).map(c=>({name:c.name,real:c.players.every(p=>p.real),rs:c.realSquad,n:c.players.length}))`);
  assert.equal(up.length,2,'two clubs from Liga Alef');assert.ok(up.every(c=>c.real&&c.rs&&c.n>=14),JSON.stringify(up));assert.equal(run('G.leumit.length'),16);
  const hta=run(`(()=>{const x=G.clubs.find(c=>c.id==='hta'),L=RAW_YOUTH[x.name];const added=x.players.filter(p=>p.real&&!p.en&&p.visualId===null&&L.includes(fullName(p)));return {n:x.players.length,gk:x.players.filter(p=>p.pos==='GK').length,added:added.length,ages:added.every(p=>p.age>=18&&p.age<=20),youth:x.youth.length,youthOwn:x.youth.filter(y=>L.includes(fullName(y))).length,used:G.yused[x.name].length,list:L.length,uniq:new Set(G.yused[x.name]).size}})()`);
  assert.ok(hta.n>=20&&hta.gk>=2);assert.ok(hta.added>=1,'top-ups are graduates of the club\'s youth side');assert.ok(hta.ages);assert.equal(hta.youth,7);assert.ok(hta.youthOwn>=1);assert.equal(hta.used,hta.uniq,'an index is never used twice');assert.ok(hta.used<=hta.list);
  assert.equal(run(`(()=>{const m=new Map();let dup=0;for(const c of [...G.clubs,...G.leumit])for(const p of [...c.players,...c.youth]){if(!(p.real&&!p.en&&p.visualId===null))continue;const k=nameKey(fullName(p));if(m.has(k))dup++;m.set(k,1)}return dup})()`),0,'no youth name twice after the season');
  assert.ok(run("G.clubs.concat(G.leumit).find(c=>c.id==='bsk').players.some(generatedPlayer)"),'a club with no youth side in the data is topped up by the generator, as before');

  // ---- an older career (v13): the Alef club that came up gets its registered squad, other academies get real names,
  //      the manager's own club is left exactly as it was
  const old=w.eval(`(()=>{const g=JSON.parse(JSON.stringify(G));g.v=13;delete g.yused;const strip=p=>{delete p.gen;return p};
    const nm=ALEF_POOL.find(a=>!g.clubs.concat(g.leumit).some(x=>x.name===a[0]))[0];window.__alef=nm;const c=g.leumit.find(x=>x.id!==g.me&&LEUMIT16.some(d=>d.name===x.name));c.name=nm;c.short=nm;c.realSquad=false;c.str=52;c.players=makeSquad(52).map(strip);c.youth=makeYouth(7).map(strip);
    const t=g.clubs.find(x=>x.id==='mta');t.youth=makeYouth(7).map(strip);const m=g.clubs.concat(g.leumit).find(x=>x.id===g.me);m.youth=makeYouth(7).map(strip);window.__mine={y:m.youth.map(p=>p.first+' '+p.last),p:m.players.map(p=>p.id)};return JSON.stringify(g)})()`);
  w.eval(`installCareer(${JSON.stringify(old)},2)`);await w.ILM.whenSaved();
  const mig=run(`(()=>{const c=G.leumit.find(x=>x.name===window.__alef),t=G.clubs.find(x=>x.id==='mta'),m=me();return {v:G.v,from:G.migratedFrom,alefReal:c.players.every(p=>p.real),alefN:c.players.length,data:RAW_EURO[c.name].length,rs:c.realSquad,mtaGen:t.youth.filter(generatedPlayer).length,mtaOwn:t.youth.every(y=>RAW_YOUTH[t.name].includes(fullName(y))),mineY:m.youth.map(p=>p.first+' '+p.last),mineP:m.players.map(p=>p.id)}})()`);
  assert.equal(mig.v,14);assert.equal(mig.from,13);assert.ok(mig.alefReal&&mig.rs);assert.equal(mig.alefN,mig.data);assert.equal(mig.mtaGen,0);assert.ok(mig.mtaOwn);
  const mine=run('window.__mine');assert.deepEqual(mig.mineY,mine.y,'the manager\'s own prospects keep their names');assert.deepEqual(mig.mineP,mine.p,'and his squad is untouched');
  // the sources screen says what is real and what the game decided
  w.eval("G.view='datainfo'");const info=w.eval('viewDataInfo()');assert.match(info,/ליגה א׳ ונוער/);assert.match(info,/עמדה, גיל, דירוג ושווי/);

  assert.deepEqual(errors,[]);console.log('alef + youth: shipped data, real prospects, one use per name, no borrowed portrait, real promoted squads, season end, v14 migration; errors',errors);
 }catch(e){console.error(e);console.log('errors',[String(e&&e.message||e)].concat(errors));process.exitCode=1}
 finally{w.close()}
})();
