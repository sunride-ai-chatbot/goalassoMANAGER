// Beginner career: the opening (coach's name → league → club → contract), the leagues on offer, the board's confidence,
// dismissal, resignation, offers before and during a season, and careers saved before any of this existed.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://career.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__ilmNoSplash=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{};w.localStorage.setItem('ilm2','PRO_SENTINEL')}}).window;
const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));
const LEUM=[];const type=(sel,v)=>{const el=$(sel);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}))};const submit=sel=>$(sel).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const playTo=(n,keep)=>w.eval(`(()=>{const b=Bstate();while(b.round<${n}&&!b.out){${keep==null?'':`b.board=${keep};`}BfinishRound();document.querySelector('.bdialog')?.remove()}})()`);
(async()=>{
 try{
  // ---- the leagues on offer
  LEUM.push(...run('LEUMIT16.map(d=>d.name)'));
  const cat=run('Bcat().filter(c=>!c.cup).map(c=>({id:c.id,name:c.name,leagues:c.leagues.map(l=>({id:l.id,name:l.name,n:l.clubs.length,keys:l.clubs.map(x=>x.key)}))}))');
  assert.deepEqual(cat[0].leagues.map(l=>l.name),['ליגת העל','ליגה לאומית','ליגה א׳ צפון','ליגה א׳ דרום'],'Israel: four leagues');assert.deepEqual(cat[0].leagues.map(l=>l.n),[14,16,17,18]);
  const names=cat.flatMap(c=>c.leagues.map(l=>l.name));for(const n of ['פרמייר ליג','צ׳מפיונשיפ','לה ליגה','לה ליגה 2','סרייה א׳','בונדסליגה','ליג 1'])assert.ok(names.includes(n),'league on offer: '+n);
  assert.ok(cat.every(c=>c.leagues.every(l=>l.n>=6)));const allKeys=cat.flatMap(c=>c.leagues.flatMap(l=>l.keys));assert.equal(new Set(allKeys).size,allKeys.length,'a club belongs to one league');
  assert.ok(run("Bcat().every(c=>c.leagues.every(l=>l.clubs.every(x=>x.key.startsWith('w:')||x.key.startsWith('a:')?RAW_EURO[x.name]&&RAW_EURO[x.name].length>=14:true)))"),'every club on offer has a real squad');

  // ---- the opening: name, league, club, contract
  assert.ok($('#bstart #bcoach'),'step one asks for the name');assert.equal($$('.bclub').length,0,'no wall of clubs before a league is chosen');
  submit('[data-bnameform]');assert.match($('.bstart-err').textContent,/שתי אותיות/,'a name is required');assert.ok($('#bcoach'));
  type('#bcoach','  דני רופא ');submit('[data-bnameform]');assert.equal(w.eval('Bstart.step'),'league');assert.match($('#bstart h1').textContent,/דני רופא/);assert.ok($('.bpick-page'),'the league choice is its own screen in front of the stadium');assert.equal($('.bopening'),null);
  assert.equal($$('[data-bcountry] .bflag').length,cat.length,'a flag beside every country');const modes=$$('.bmodes .bmode');assert.equal(modes.length,2);assert.match(modes[0].textContent,/ליגת האלופות/);assert.equal(modes[0].dataset.bleague,'cl1','the Champions League is a league to choose');assert.ok(!modes[0].disabled);assert.ok(modes[1].hasAttribute('data-room-open'),'network play is the last option');
  assert.equal($$('[data-bcountry]').length,cat.length);$('[data-bcountry="it"]').click();assert.equal(w.eval('Bstart.step'),'club','a country with one league goes straight to its clubs');assert.equal($$('.bclub').length,cat.find(c=>c.id==='it').leagues[0].n);
  $('[data-bstep="league"]').click();$('[data-bcountry="il"]').click();assert.equal($$('.bleagues [data-bleague]').length,4);assert.equal($('[data-bcountry="il"]').getAttribute('aria-expanded'),'true');
  // search by name finds a club in its league
  type('#bclubsearch','ליברפול');assert.equal(w.document.activeElement.id,'bclubsearch','typing keeps the field');const hit=$$('.bclub').find(b=>/ליברפול/.test(b.textContent));assert.ok(hit&&/פרמייר ליג/.test(hit.textContent));type('#bclubsearch','');
  $('[data-bleague="il3n"]').click();const clubs=$$('.bclub');assert.equal(clubs.length,17);assert.match($('#bstart h1').textContent,/ליגה א׳ צפון/);assert.ok($('#bstart h1 .bflag'));
  const pick=clubs[clubs.length-1];const pickName=pick.querySelector('strong').textContent;pick.click();
  const dlg=$('.bdialog .bcontract');assert.ok(dlg,'the contract');assert.match(dlg.textContent,new RegExp(pickName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.match(dlg.textContent,/דני רופא/);assert.match(dlg.textContent,/ליגה א׳ צפון/);assert.match(dlg.textContent,/היעד של ההנהלה/);
  assert.equal(w.eval('G'),null,'nothing starts before the signature');$('[data-bsign]').click();
  const st=run('({me:me().name,key:me().bkey,lg:Bstate().leagueId,n:Bstate().league.length,coach:Bstate().coach,k:Bstate().contract,board:Bstate().board,real:Bstate().league.every(id=>club(id).players.length>=14&&club(id).players.every(p=>p.real)),rounds:Bstate().schedule.length,clubs:G.clubs.length,size:localStorage.getItem(BK).length,mgr:G.manager.name})');
  assert.equal(st.me,pickName);assert.ok(st.key.startsWith('a:'));assert.equal(st.lg,'il3n');assert.equal(st.n,17);assert.equal(st.coach,'דני רופא');assert.equal(st.mgr,'דני רופא');assert.equal(st.board,55);assert.ok(st.real,'the whole league plays with its registered squads');
  assert.equal(st.k.years,2);assert.ok(st.k.goal>=1&&st.k.goal<=16&&st.k.wage>0);assert.equal(st.rounds,34,'17 clubs: 34 rounds, one resting each round');assert.ok(st.size<2.6e6,'the save stays small: '+st.size);
  assert.ok($('.bcareer'),'the home screen shows coach, contract and board');assert.equal($('.btop [data-room-open]'),null);const homeBtns=$$('#main section');assert.ok(homeBtns[homeBtns.length-1].querySelector('[data-room-open]'),'network play is the last thing on the home screen');
  assert.ok(!w.document.body.classList.contains('btips-off')&&$$('.blearn').length>0,'tips for the first two rounds');assert.match($('.bcareer').textContent,/דני רופא/);assert.match($('.bcareer').textContent,/אמון ההנהלה/);
  w.eval("Btab='league';Brender()");assert.equal($$('.bleague-table tbody tr').length,17);
  // the market: any league can be searched, not only the coach's own
  w.eval("Btab='market';Bcategory='europe';Bmleague='all';Brender()");const sel=$('#bmleague');assert.ok(sel,'a league to choose');assert.equal(sel.querySelectorAll('option').length,1+cat.reduce((n,c)=>n+c.leagues.length,0));assert.equal(sel.querySelectorAll('optgroup').length,cat.length);
  const nBefore=run('G.clubs.length');sel.value='il2';sel.dispatchEvent(new w.Event('change',{bubbles:true}));const mk=run("BmarketPool().map(({p,c})=>c.name)");assert.ok(mk.length>=100,'players of the Leumit clubs: '+mk.length);assert.ok(mk.every(n=>LEUM.includes(n)),'only that league');assert.equal(run('G.clubs.length'),nBefore+16,'its clubs are built when somebody looks there');
  $('#bmleague').value='es1';$('#bmleague').dispatchEvent(new w.Event('change',{bubbles:true}));assert.ok(run("BmarketPool().length")>20);assert.ok(run("BmarketPool().every(({c})=>c.country==='ספרד')"));w.eval("Bmleague='all';Bcategory='league'");w.eval("Btab='home';Brender()");

  // ---- results move the board; a board without patience dismisses the coach, and clubs a step down call
  playTo(2);assert.ok(w.document.body.classList.contains('btips-off'),'after two rounds the beginner tips are put away');$('[data-action="tips"]').click();assert.ok(!w.document.body.classList.contains('btips-off'),'and can be brought back');$('[data-action="tips"]').click();assert.ok(w.document.body.classList.contains('btips-off'));
  playTo(4);assert.equal(run('!!Bstate().out'),false,'nobody is dismissed in the first weeks');
  w.eval('Bstate().board=3');playTo(7);assert.equal(run('!!Bstate().out'),false,'not before the eighth round');
  w.eval('Bstate().board=3;me().pts=-30');playTo(12,3);const out=run('Bstate().out');assert.ok(out&&out.why==='fired','dismissed: '+JSON.stringify(out&&out.why));assert.ok(out.offers.length>=2,'there is always somewhere to go');assert.equal(out.from,pickName);
  assert.ok($('.bout'),'the screen of offers');assert.equal($$('.bout [data-bjob]').length,out.offers.length);assert.equal($('.bnav'),null,'no club to run while out of work');
  const o1=out.offers[0];const before=run('({season:Bstate().season,old:G.me})');$(`.bout [data-bjob="${o1.key.replace(/"/g,'\\"')}"]`).click();
  const job=run('({me:me().name,key:me().bkey,lg:Bstate().leagueId,season:Bstate().season,round:Bstate().round,out:Bstate().out,board:Bstate().board,k:Bstate().contract,zero:Bstate().league.every(id=>club(id).P===0),inLeague:Bstate().league.includes(G.me),jobs:Bstate().jobs.length,xi:me().lineup.filter(Boolean).length,money:me().money>0})');
  assert.equal(job.key,o1.key);assert.equal(job.lg,o1.league);assert.equal(job.season,before.season+1,'a new season at the new club');assert.equal(job.round,0);assert.equal(job.out,null);assert.equal(job.board,55);assert.ok(job.zero&&job.inLeague);assert.equal(job.jobs,2);assert.equal(job.xi,11);assert.ok(job.money);assert.equal(job.k.since,job.season);
  assert.ok($('.bnav')&&$('.bcareer'));

  // ---- resignation
  $('[data-action="resign"]').click();assert.match($('.bdialog').textContent,/אי אפשר לבטל/);$('.bdialog [data-bclose]').click();assert.equal(run('!!Bstate().out'),false,'changing one\'s mind keeps the job');
  $('[data-action="resign"]').click();$('[data-action="resign-yes"]').click();assert.equal(run('Bstate().out.why'),'resigned');assert.ok(run('Bstate().out.offers.length')>=2);
  // take a club of a league with stronger sides above it, for the offer that comes next
  w.eval("(()=>{const l=BcatLeague('es1');const x=l.clubs[l.clubs.length-1];Bstate().out.offers=[BjobOffer({key:x.key,league:l.id})];Brender()})()");$('.bout [data-bjob]').click();assert.equal(run('Bstate().leagueId'),'es1');assert.equal(run('Bstate().league.length'),12);

  // ---- an offer during the season comes from the same league and the coach joins its table as it stands
  const half=run('Math.round(Bstate().schedule.length/2)');playTo(half-1,40);assert.equal(run('Bstate().offer'),null,'no offer while the board is lukewarm');
  w.eval('me().pts=999;Bstate().board=90;Bstate().offerAt=null');playTo(half,90);const off=run('Bstate().offer');assert.ok(off,'a bigger club calls at mid-season when the board is happy and the goal is met');assert.equal(off.league,'es1');assert.ok(off.until>half);
  assert.ok(run(`BcatFind(${JSON.stringify(off.key)}).x.str`)>run('BmyStr()'),'it is a step up');assert.ok($('.bcareer .boffer'),'the offer is on the home screen');
  const tbl=run('Bstandings().map(c=>c.id+":"+c.P+":"+c.pts)');const oldClub=run('G.me');$('.bcareer [data-bjob]').click();
  const mid=run('({key:me().bkey,season:Bstate().season,round:Bstate().round,offer:Bstate().offer,P:me().P,board:Bstate().board,since:Bstate().contract.since,table:Bstandings().map(c=>c.id+":"+c.P+":"+c.pts)})');
  assert.equal(mid.key,off.key);assert.equal(mid.round,half,'the season goes on');assert.equal(mid.offer,null);assert.ok(mid.P>=half-1,'he takes over the club with its matches played');assert.deepEqual(mid.table,tbl,'the table is the one being played');assert.notEqual(run('G.me'),oldClub);
  // an offer can be declined, and it lapses by itself
  w.eval("Bstate().offer=Object.assign(BjobOffers(0,200,1,true)[0],{until:Bstate().round+1});Brender()");$('[data-action="decline"]').click();assert.equal(run('Bstate().offer'),null);
  w.eval("Bstate().offer=Object.assign(BjobOffers(0,200,1,true)[0],{until:Bstate().round+1});Bstate().board=50");playTo(half+1,50);assert.equal(run('Bstate().offer'),null,'an unanswered offer lapses');

  // ---- the end of a season: the goal decides
  const total=run('Bstate().schedule.length');w.eval('me().pts=999');playTo(total,70);w.eval('me().pts=999;Bsummary()');
  assert.match($('.bdialog .bverdict').textContent,/עמדת ביעד/);assert.ok($('.bdialog [data-action="newseason"]'));assert.ok($$('.bdialog [data-bjob]').length<=2);
  const s0=run('({season:Bstate().season,since:Bstate().contract.since})');$('.bdialog [data-action="newseason"]').click();assert.equal(run('Bstate().season'),s0.season+1);assert.equal(run('Bstate().contract.since'),s0.since,'the contract goes on');assert.equal(run('Bstate().round'),0);
  // second season of the contract, goal met: a new contract
  w.eval('me().pts=999');playTo(total,70);w.eval('me().pts=999;Bsummary()');assert.ok(run('Bstate().verdict.renew'),'the contract ran out and the board renews it');assert.match($('.bdialog [data-action="newseason"]').textContent,/חותם/);
  $('.bdialog [data-action="newseason"]').click();assert.equal(run('Bstate().contract.since'),run('Bstate().season'),'a fresh contract');
  // far below the goal: the board lets him go at the end
  w.eval('me().pts=-999');playTo(total,60);w.eval('me().pts=-999;Bstate().board=20;Bsummary()');assert.match($('.bdialog .bverdict').textContent,/להיפרד/);assert.equal($('.bdialog [data-action="newseason"]'),null);
  $('.bdialog [data-action="released"]').click();assert.equal(run('Bstate().out.why'),'fired');$('.bout [data-bjob]').click();assert.equal(run('Bstate().round'),0);assert.equal(run('!!Bstate().out'),false);

  // ---- saving and loading keep the career; a career from before contracts gets one when its league is on the list
  w.eval('Bwrite()');const saved=w.localStorage.getItem(w.eval('BK'));w.eval('G=null;Bload();Brender()');assert.equal(run('Bstate().coach'),'דני רופא');assert.ok($('.bcareer'));
  w.eval(`(()=>{const d=JSON.parse(${JSON.stringify(saved)});const b=d.G.beginner;for(const c of d.G.clubs)delete c.bkey;for(const k of ['contract','board','leagueId','coach','jobs','offer','out','verdict'])delete b[k];
    const top=d.G.clubs.filter(c=>META[c.id]);d.G.me='mhf';b.league=top.map(c=>c.id);b.round=0;localStorage.setItem(BK,JSON.stringify(d));G=null;Bload();Bseason();Brender()})()`);
  const old=run('({lg:Bstate().leagueId,k:!!Bstate().contract,key:me().bkey,keys:G.clubs.filter(c=>!c.bkey).length})');assert.equal(old.lg,'il1');assert.ok(old.k,'an older career in a listed league gets a contract');assert.equal(old.key,'mhf');
  w.eval(`(()=>{const d=JSON.parse(localStorage.getItem(BK));const b=d.G.beginner;for(const c of d.G.clubs)delete c.bkey;for(const k of ['contract','board','leagueId','coach','jobs'])delete b[k];b.league=b.league.slice(0,6);localStorage.setItem(BK,JSON.stringify(d));G=null;Bload();Bseason();Brender()})()`);
  assert.equal(run('Bstate().leagueId||null'),null);assert.equal(run('!!Bstate().contract'),false);assert.equal($('.bcareer'),null,'a training league that is not on the list plays on as before, without a board');
  playTo(3);assert.equal(run('Bstate().round'),3);assert.equal(run('!!Bstate().out'),false);

  // ---- the Champions League: the strongest clubs of the continent as one league
  const cl=run("(()=>{const l=BcatLeague('cl1');return {n:l.clubs.length,min:Math.min(...l.clubs.map(x=>x.str)),keys:l.clubs.map(x=>x.key),home:l.clubs.map(x=>BcatFind(x.key).l.id),per:Object.values(l.clubs.reduce((m,x)=>(m[BcatFind(x.key).country.id]=(m[BcatFind(x.key).country.id]||0)+1,m),{})),rest:Math.max(...Bcat().filter(c=>!c.cup&&c.id!=='il').flatMap(c=>c.leagues.filter(l=>l.tier===1).flatMap(l=>l.clubs)).filter(x=>!l.clubs.includes(x)).map(x=>x.str))}})()");
  assert.equal(cl.n,16);assert.ok(cl.home.every(id=>id!=='cl1'&&/1$/.test(id)),'every club of it is found in its own top division first');assert.ok(Math.max(...cl.per)<=4,'at most four clubs of one country');assert.ok(cl.per.length>=5,'five countries or more');assert.equal(new Set(cl.keys).size,16);
  w.eval("document.querySelector('.bdialog')?.remove();localStorage.removeItem(BK);G=null;Bstart={step:'league',name:'קרלו',country:null,league:null,club:null,q:'',err:''};Brender()");
  $('.bmodes [data-bleague="cl1"]').click();assert.equal(w.eval('Bstart.step'),'club');assert.equal($$('.bclub').length,16);assert.match($('#bstart h1').textContent,/ליגת האלופות/);assert.ok($('#bstart h1 .bstar'));
  $$('.bclub')[7].click();assert.match($('.bcontract').textContent,/ליגת האלופות/);$('[data-bsign]').click();
  const clc=run("({id:Bstate().leagueId,n:Bstate().league.length,rounds:Bstate().schedule.length,name:BleagueName(),keys:Bstate().league.map(id=>club(id).bkey).sort(),goal:Bstate().contract.goal,pool:BjobPool(0,200).map(o=>o.league),same:BjobPool(0,200,true).map(o=>o.league)})");
  assert.equal(clc.id,'cl1');assert.equal(clc.n,16);assert.equal(clc.rounds,30,'home and away against everyone');assert.equal(clc.name,'ליגת האלופות');assert.deepEqual(clc.keys,cl.keys.slice().sort());assert.ok(clc.goal>=1&&clc.goal<=15);
  assert.ok(clc.pool.length>50&&!clc.pool.includes('cl1'),'offers from outside come from the countries\' leagues');assert.ok(clc.same.length===15&&clc.same.every(x=>x==='cl1'),'inside it a bigger club of the same league may call');
  playTo(3,60);assert.equal(run('Bstate().round'),3);assert.ok(run('Bstandings().length')===16);w.eval('Bwrite()');assert.equal(run('Bstate().leagueId'),'cl1');

  // ---- the Champions League inside a career: a top-division club that qualified plays it beside the league
  assert.equal(run('Bstate().cl||null'),null,'a career in the Champions League as a league has no second one inside it');
  const fresh=(key,lg)=>w.eval(`(()=>{document.querySelector('.bdialog')?.remove();localStorage.removeItem(BK);localStorage.removeItem(BK+'.backup');G=null;BsaveRev=0;Bcreate(${JSON.stringify(key)},{name:'פפ',league:${JSON.stringify(lg)}});G.penGame=false})()`);
  const clPlay=res=>w.eval(`(()=>{document.querySelector('.bdialog')?.remove();Bplay();const M=Bstate().live.M,home=M.h===G.me,r=${JSON.stringify(res)};M.m=90;M.done=true;M.gh=home?r[0]:r[1];M.ga=home?r[1]:r[0];Btick(true)})()`);
  const es=run("BcatLeague('es1').clubs.slice().sort((a,b)=>b.str-a.str).map(x=>x.key)");fresh(es[0],'es1');
  let k=run('Bstate().cl');assert.ok(k,'the strongest club of a top division starts in it');assert.equal(k.ids.length,16);assert.equal(new Set(k.ids).size,16);assert.equal(k.ties.length,8);assert.ok(k.ids.includes(run('G.me')));
  assert.ok(k.at.every((x,i)=>x>=1&&x<run('Bstate().schedule.length')&&(i===0||x>k.at[i-1])),'four evenings spread over the season, the final before the last round');
  const lands=run("Bstate().cl.ids.map(id=>BcatFind(club(id).bkey).country.id)"),cnt=lands.reduce((m,x)=>(m[x]=(m[x]||0)+1,m),{});assert.equal(cnt.es,run("BclPlaces(BcatLeague('es1'))"),'the league sends the head of its table');assert.ok(Object.entries(cnt).every(([c,n])=>c==='es'||n<=4));assert.ok(run("Bstate().cl.ids.every(id=>club(id).players.length>=14&&club(id).players.every(p=>!inventedPlayer(p)))"),'real squads only');
  assert.equal(run('BclTie()'),null,'no evening before its round');assert.match($('.bcl').textContent,/שמינית הגמר/);assert.match($('.bcl').textContent,new RegExp('אחרי מחזור\\s*'+k.at[0]));
  playTo(k.at[0],70);w.eval('Brender()');const tie=run('BclTie()');assert.ok(tie&&tie.includes(run('G.me')),'the evening has come');assert.match($('.bhero').textContent,/ליגת האלופות, שמינית הגמר/);
  $('[data-action="prematch"]').click();assert.match($('.bdialog').textContent,/ליגת האלופות · שמינית הגמר/);assert.match($('.bdialog').textContent,/בתיקו פנדלים/);
  const round0=run('Bstate().round'),money0=run('me().money');w.eval("document.querySelector('.bdialog')?.remove();Bplay()");assert.equal(run('Bstate().live.M.bCL'),0);assert.equal(run('Bstate().live.M.ctx.ko'),true);assert.match($('.btop .bpill').textContent,/ליגת האלופות · שמינית הגמר/);
  w.eval("(()=>{const M=Bstate().live.M,home=M.h===G.me;M.m=90;M.done=true;M.gh=1;M.ga=1;const real=decidePens;decidePens=m=>{m.pens=home?'h':'a'};try{Btick(true)}finally{decidePens=real}})()");
  k=run('Bstate().cl');assert.equal(run('Bstate().live||null'),null);assert.equal(k.stage,1);assert.equal(k.out,false);assert.equal(k.res[0].length,8);assert.ok(k.res[0].every(r=>r.w===r.h||r.w===r.a));assert.equal(k.alive.length,8);assert.equal(k.ties.length,4);
  assert.equal(run('Bstate().round'),round0,'an evening is not a league round');assert.match($('.bdialog').textContent,/ניצחון בפנדלים/);assert.match($('.bdialog').textContent,/עליתם לרבע הגמר/);assert.ok(run('me().money')>money0,'prize money');assert.ok(run("Bstate().ledger.some(x=>/פרס ליגת האלופות/.test(x.label))"));
  const mineRow=k.res[0].find(r=>r.h===run('G.me')||r.a===run('G.me'));assert.ok(mineRow.pens&&mineRow.gh===1&&mineRow.ga===1&&mineRow.w===run('G.me'));
  w.eval("document.querySelector('.bdialog')?.remove();Btab='league';Brender()");assert.match($('.bcl').textContent,/רבע הגמר/);assert.equal($$('.bcl-ties li').length,12,'the played round and the draw of the next');assert.ok($$('.bcl-ties .sides').length>=8);w.eval("Btab='home';Brender()");
  // all the way: quarter-final, semi-final, final
  for(const st of [1,2,3]){playTo(k.at[st],70);assert.ok(run('BclTie()'),'evening '+st);clPlay([2,0]);k=run('Bstate().cl');assert.equal(k.stage,st+1)}
  assert.ok(k.won&&!k.out);assert.equal(k.champion,run('G.me'));assert.match($('.bdialog').textContent,/אלופי אירופה/);assert.deepEqual(run('Bstate().honours.map(h=>h.what)'),['ליגת האלופות']);assert.equal(k.res[3].length,1);assert.equal(run('BclTie()'),null);
  w.eval("document.querySelector('.bdialog')?.remove();Brender()");assert.match($('.bcl').textContent,/הגביע שלכם/);
  // knocked out: the competition goes on without the coach and still gets its champion
  fresh(es[0],'es1');k=run('Bstate().cl');playTo(k.at[0],70);clPlay([0,1]);k=run('Bstate().cl');assert.ok(k.out);assert.equal(k.stage,1);assert.match($('.bdialog').textContent,/המסע באירופה הסתיים/);assert.equal(run('BclTie()'),null);
  playTo(run('Bstate().schedule.length'),70);k=run('Bstate().cl');assert.equal(k.stage,4);assert.ok(k.champion&&k.champion!==run('G.me'));assert.deepEqual(k.res.map(r=>r.length),[8,4,2,1]);w.eval('Brender()');assert.match($('.bcl').textContent,/הודחתם בשמינית הגמר/);assert.match($('.bcl').textContent,/האלופה/);
  // the table decides who plays it next season
  const q=run("BclPlaces(BcatLeague('es1'))");w.eval("(()=>{const t=Bstandings();t.forEach((c,i)=>c.pts=200-i);me().pts=1})()");w.eval("Bsummary()");assert.equal($('.bcl-next'),null);
  w.eval("document.querySelector('.bdialog')?.remove();Bstate().board=70;Bstate().verdict=null;Bsummary();document.querySelector('[data-action=\"newseason\"]')?.click()");
  if(run('!Bstate().out')&&run('Bstate().season')===2){assert.equal(run('Bstate().clq.keys.length'),q);assert.equal(run('Bstate().cl||null'),null,'outside the places of the table: no Champions League this season')}
  w.eval("(()=>{const b=Bstate();while(b.round<b.schedule.length)BfinishRound();document.querySelector('.bdialog')?.remove();Bstandings().forEach((c,i)=>c.pts=100-i);me().pts=500;b.board=80;b.verdict=null;Bsummary()})()");assert.match($('.bcl-next').textContent,/בליגת האלופות/);
  $('[data-action="newseason"]').click();assert.ok(run('Bstate().cl&&Bstate().cl.ids.includes(G.me)'),'the champion plays it');assert.equal(run('Bstate().cl.season'),run('Bstate().season'));
  // a weak club of the same league, a second-tier club: none
  fresh(es[es.length-1],'es1');assert.equal(run('Bstate().cl||null'),null);assert.equal($('.bcl'),null);fresh(run("BcatLeague('il2').clubs[0].key"),'il2');assert.equal(run('Bstate().cl||null'),null);
  // Israel's top division sends its head too
  fresh('mta','il1');assert.ok(run('Bstate().cl&&Bstate().cl.ids.includes(G.me)'));assert.equal(run("Bstate().cl.ids.filter(id=>club(id).country==='ישראל').length"),run("BclPlaces(BcatLeague('il1'))"));

  assert.equal(w.localStorage.getItem('ilm2'),'PRO_SENTINEL','the full game\'s career is never touched');
  // ---- the title screen of the beginner page: the name is written there, network play is not, a small link leads to the full game
  const t=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://career.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,beforeParse(x){x.matchMedia=()=>({matches:true});x.scrollTo=()=>{};x.HTMLMediaElement.prototype.play=()=>Promise.resolve();x.HTMLMediaElement.prototype.pause=()=>{};x.HTMLMediaElement.prototype.load=()=>{}}}).window;
  const T=s=>t.document.querySelector(s);assert.ok(!T('#splash').classList.contains('hide'),'the title screen is up');assert.ok(T('#spName'),'the name box');assert.equal(T('#spNetwork'),null,'no network button on the title screen');assert.equal(T('.sp-link').getAttribute('href'),'./');assert.match(T('.sp-link').textContent,/פרו/);
  T('#spRegular').click();assert.ok(!T('#splash').classList.contains('out'),'without a name the title screen stays');assert.match(T('#spErr').textContent,/שתי אותיות/);assert.equal(T('#spName').getAttribute('aria-invalid'),'true');
  T('#spName').value='נועה';T('#spRegular').click();assert.ok(T('#splash').classList.contains('out'));assert.equal(t.eval('Bstart.step'),'league');assert.match(T('#bstart h1').textContent,/נועה/);
  t.eval("Bcreate('mta',{name:'נועה'});showSplash()");assert.equal(T('#spName'),null,'a returning coach is not asked again');assert.match(T('#spRegular').textContent,/המשך קריירה/);T('#spRegular').click();assert.ok(T('#splash').classList.contains('out'));t.close();
  assert.deepEqual(errors,[]);console.log('beginner career: leagues, opening steps and contract, board, dismissal, resignation, offers before and during a season, the Champions League as a league and inside a career, older careers; errors',errors);
 }catch(e){console.error(e);console.log('errors',[String(e&&e.message||e)].concat(errors));process.exitCode=1}
 finally{w.close()}
})();
