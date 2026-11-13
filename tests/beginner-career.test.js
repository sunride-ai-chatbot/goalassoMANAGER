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
  const cat=run('Bcat().map(c=>({id:c.id,name:c.name,leagues:c.leagues.map(l=>({id:l.id,name:l.name,n:l.clubs.length,keys:l.clubs.map(x=>x.key)}))}))');
  assert.deepEqual(cat[0].leagues.map(l=>l.name),['ליגת העל','ליגה לאומית','ליגה א׳ צפון','ליגה א׳ דרום'],'Israel: four leagues');assert.deepEqual(cat[0].leagues.map(l=>l.n),[14,16,17,18]);
  const names=cat.flatMap(c=>c.leagues.map(l=>l.name));for(const n of ['פרמייר ליג','צ׳מפיונשיפ','לה ליגה','לה ליגה 2','סרייה א׳','בונדסליגה','ליג 1'])assert.ok(names.includes(n),'league on offer: '+n);
  assert.ok(cat.every(c=>c.leagues.every(l=>l.n>=6)));const allKeys=cat.flatMap(c=>c.leagues.flatMap(l=>l.keys));assert.equal(new Set(allKeys).size,allKeys.length,'a club belongs to one league');
  assert.ok(run("Bcat().every(c=>c.leagues.every(l=>l.clubs.every(x=>x.key.startsWith('w:')||x.key.startsWith('a:')?RAW_EURO[x.name]&&RAW_EURO[x.name].length>=14:true)))"),'every club on offer has a real squad');

  // ---- the opening: name, league, club, contract
  assert.ok($('#bstart #bcoach'),'step one asks for the name');assert.equal($$('.bclub').length,0,'no wall of clubs before a league is chosen');
  submit('[data-bnameform]');assert.match($('.bstart-err').textContent,/שתי אותיות/,'a name is required');assert.ok($('#bcoach'));
  type('#bcoach','  דני רופא ');submit('[data-bnameform]');assert.equal(w.eval('Bstart.step'),'league');assert.match($('#bstart h1').textContent,/דני רופא/);assert.ok($('.bpick-page'),'the league choice is its own screen in front of the stadium');assert.equal($('.bopening'),null);
  assert.equal($$('[data-bcountry] .bflag').length,cat.length,'a flag beside every country');const modes=$$('.bmodes .bmode');assert.equal(modes.length,2);assert.match(modes[0].textContent,/ליגת האלופות/);assert.ok(modes[0].disabled,'the Champions League is announced, not yet open');assert.match(modes[0].textContent,/בקרוב/);assert.ok(modes[1].hasAttribute('data-room-open'),'network play is the last option');
  assert.equal($$('[data-bcountry]').length,cat.length);$('[data-bcountry="it"]').click();assert.equal(w.eval('Bstart.step'),'club','a country with one league goes straight to its clubs');assert.equal($$('.bclub').length,cat.find(c=>c.id==='it').leagues[0].n);
  $('[data-bstep="league"]').click();$('[data-bcountry="il"]').click();assert.equal($$('[data-bleague]').length,4);assert.equal($('[data-bcountry="il"]').getAttribute('aria-expanded'),'true');
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

  assert.equal(w.localStorage.getItem('ilm2'),'PRO_SENTINEL','the full game\'s career is never touched');
  // ---- the title screen of the beginner page: the name is written there, network play is not, a small link leads to the full game
  const t=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://career.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,beforeParse(x){x.matchMedia=()=>({matches:true});x.scrollTo=()=>{};x.HTMLMediaElement.prototype.play=()=>Promise.resolve();x.HTMLMediaElement.prototype.pause=()=>{};x.HTMLMediaElement.prototype.load=()=>{}}}).window;
  const T=s=>t.document.querySelector(s);assert.ok(!T('#splash').classList.contains('hide'),'the title screen is up');assert.ok(T('#spName'),'the name box');assert.equal(T('#spNetwork'),null,'no network button on the title screen');assert.equal(T('.sp-link').getAttribute('href'),'./');assert.match(T('.sp-link').textContent,/פרו/);
  T('#spRegular').click();assert.ok(!T('#splash').classList.contains('out'),'without a name the title screen stays');assert.match(T('#spErr').textContent,/שתי אותיות/);assert.equal(T('#spName').getAttribute('aria-invalid'),'true');
  T('#spName').value='נועה';T('#spRegular').click();assert.ok(T('#splash').classList.contains('out'));assert.equal(t.eval('Bstart.step'),'league');assert.match(T('#bstart h1').textContent,/נועה/);
  t.eval("Bcreate('mta',{name:'נועה'});showSplash()");assert.equal(T('#spName'),null,'a returning coach is not asked again');assert.match(T('#spRegular').textContent,/המשך קריירה/);T('#spRegular').click();assert.ok(T('#splash').classList.contains('out'));t.close();
  assert.deepEqual(errors,[]);console.log('beginner career: leagues, opening steps and contract, board, dismissal, resignation, offers before and during a season, older careers; errors',errors);
 }catch(e){console.error(e);console.log('errors',[String(e&&e.message||e)].concat(errors));process.exitCode=1}
 finally{w.close()}
})();
