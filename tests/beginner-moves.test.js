// Beginner career: promotion and relegation. The champion of the second division used to start the next season in the
// second division. Covers the ladder of each country, a title that takes the club up (and what it says on the way: the
// championship plate, the summary, the paper), going down, a league whose rivals change, a job taken at a club that has
// just gone down, careers saved before any of this (a champion who was left behind), and a new career beside an old one.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});vc.on('warn',(...a)=>{if(/moves|paper|engage/.test(String(a[0])))errors.push('warn: '+a.map(String).join(' '))});
const w=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://moves.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__ilmNoSplash=1;w.__noWindow=1;w.__noEnv=1;w.__noBook=1;w.__noHalf=1;w.__noInjStop=1;w.__noExtras=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));
const il=()=>run("Bcat().find(c=>c.id==='il').leagues.map(l=>({id:l.id,n:l.clubs.length,keys:l.clubs.map(x=>x.key)}))");
/* a season: the first one is played to its last round, the others two rounds and then the calendar is turned to the end (a round costs a third of a second here; what is tested is what happens after the last one). Europe is another suite's subject: no ties here. Then the table the test wants: `place` for the coach's club (1 = champion, 0 = last, null = as played) */
const mark=m=>{if(process.env.MARK)fs.writeSync(2,m+'\n')};
const season=(place,whole)=>{mark('season '+place+' '+w.eval('Bstate().leagueId+" s"+Bstate().season'));w.eval(`(()=>{const b=Bstate();G.penGame=false;b.out=null;b.cl=null;while(b.round<${whole?'b.schedule.length':2}){b.board=70;BfinishRound();document.querySelector('.bdialog')?.remove();try{closeReveal(true)}catch(e){}}
  b.round=b.schedule.length;G.wk=b.round;
  b.out=null;b.offer=null;b.board=70;const t=Bstandings().filter(c=>c.id!==G.me);t.forEach((c,i)=>{c.pts=60-i*2});${place===1?'me().pts=99':place===0?'me().pts=1':place==null?'':`me().pts=${61-place*2}`};b.paperPop=[];try{closeFrontPage(true)}catch(e){}Btab='home';Brender()})()`);mark(' played')};
const quiet=()=>w.eval("(()=>{Bstate().paperPop=[];try{closeFrontPage(true)}catch(e){}try{closeReveal(true)}catch(e){}document.querySelector('.bdialog')?.remove()})()");
const whole=()=>{const k=il().flatMap(l=>l.keys);assert.equal(new Set(k).size,k.length,'a club is in one league');assert.equal(k.length,65,'nobody is lost between the leagues');const [a,b,n,s]=il();assert.equal(a.n,14);assert.equal(b.n,16);assert.ok(n.n>=14&&n.n<=20&&s.n>=14&&s.n<=20,'the districts stay a playable size: '+n.n+'/'+s.n)};
(async()=>{
 try{
  // ---- the ladder
  const z=id=>run(`(z=>({up:z.up,down:z.down,upTo:z.upTo&&z.upTo.id,downTo:z.downTo&&z.downTo.map(l=>l.id)}))(BprZones(BcatLeague('${id}')))`);
  assert.deepEqual(z('il1'),{up:0,down:2,upTo:null,downTo:['il2']});assert.deepEqual(z('il2'),{up:2,down:2,upTo:'il1',downTo:['il3n','il3s']});assert.deepEqual(z('il3n'),{up:1,down:0,upTo:'il2',downTo:null});assert.deepEqual(z('il3s'),{up:1,down:0,upTo:'il2',downTo:null});
  assert.deepEqual(z('en1'),{up:0,down:2,upTo:null,downTo:['en2']});assert.equal(z('en2').up,2);assert.deepEqual(z('it1'),{up:0,down:0,upTo:null,downTo:null});assert.deepEqual(z('cl1'),{up:0,down:0,upTo:null,downTo:null},'a cup has no ladder');
  // where clubs go down, no board asks for less than staying up
  const weak=run("(l=>BcontractFor(l.clubs.slice().sort((a,b)=>a.str-b.str)[0],l))(BcatLeague('il1'))");assert.equal(weak.goal,12);assert.equal(weak.zone,'stay');assert.match(run("BgoalText({goal:12,zone:'stay'})"),/להישאר בליגה/);
  assert.equal(run("(l=>BcontractFor(l.clubs.slice().sort((a,b)=>a.str-b.str)[0],l))(BcatLeague('it1')).zone"),null,'no league below, no red line');

  // ---- a champion of the second division
  w.eval("Bcreate('l:l_ksa',{name:'דני רופא',league:'il2'})");quiet();const base=il();assert.equal(run('Bstate().leagueId'),'il2');assert.equal(run('Bstate().prV'),1);
  w.eval("Btab='league';Brender()");assert.equal($$('.bleague-table tr.bz-up').length,2,'the table marks the two places that go up');assert.equal($$('.bleague-table tr.bz-down').length,2);assert.match($('.bzones').textContent,/שני המקומות הראשונים עולים לליגת העל/);assert.match($('.bzones').textContent,/יורדים לליגה א׳$/);
  season(1,true);assert.equal(run('Bplace()'),1);const before=run('me().money');
  /* (the league screen looks up a portrait for each leading scorer and keeps the answer on the player, so it is drawn once before the picture is taken) */
  const snap=()=>w.eval("JSON.stringify(G)"),same=(what)=>{w.eval("Btab='league';Brender();Btab='home';Brender()");const a=snap();w.eval("Brender();Btab='league';Brender();Btab='home';Brender()");assert.equal(snap()===a,true,what)};same('drawing a screen decides nothing');
  $('[data-action="season"]').click();assert.ok($('#reveal.mo'),'the title moment');assert.equal($('.bdialog'),null);
  assert.ok($('#reveal .mo-dish .mo-disc'),'the championship plate is on the picture');assert.equal($('#reveal .mo-band text').textContent,'הפועל כפר סבא','with the champion\'s name on it');assert.ok($('#reveal .mo-boss svg'),'and its shirt');
  assert.match($('#reveal .mo-shout').textContent,/אלופים/);assert.match($('#reveal .mo-plate').textContent,/אלופת ליגה לאומית/);assert.match($('#reveal .mo-note').textContent,/עולים לליגת העל/,'the moment says where the title leads');
  assert.deepEqual(run('Bstate().honours.map(h=>h.what)'),['אליפות ליגה לאומית'],'a league title is an honour');
  $('#moClose').click();assert.ok($('.bdialog .bpr.up'),'the summary says it too');assert.match($('.bdialog .bpr.up').textContent,/עולים ליגה.*הפועל כפר סבא בליגת העל/);assert.match($('.bdialog .bpr-others').textContent,/עולות גם: .+יורדות: .+/);
  const plan=run('Bstate().pr');assert.equal(plan.season,1);assert.equal(plan.moves.filter(m=>m.from==='il2'&&m.up).length,2);assert.equal(plan.moves.filter(m=>m.from==='il1'&&!m.up).length,2);assert.equal(plan.moves.filter(m=>m.from==='il2'&&!m.up).length,2);assert.equal(plan.moves.filter(m=>m.to==='il2'&&m.up).length,2,'one champion from each district');
  assert.deepEqual(plan.moves.filter(m=>m.to==='il2'&&m.up).map(m=>m.from).sort(),['il3n','il3s']);assert.deepEqual(il(),base,'nothing moves before the season turns');
  {w.eval("document.querySelector('.bdialog')?.remove();Bsummary()");assert.equal(run('Bstate().pr.moves.map(m=>m.key).join()'),plan.moves.map(m=>m.key).join(),'the plan is made once')}
  $('[data-action="newseason"]').click();const b1=run('Bstate()');
  assert.equal(b1.leagueId,'il1','the champion plays in the top division');assert.equal(b1.season,2);assert.equal(b1.round,0);assert.equal(b1.league.length,14);assert.ok(b1.league.includes(run('G.me')));assert.equal(b1.schedule.length,26);assert.equal(b1.prV,2);assert.equal(b1.pr,null);
  assert.equal(run('BleagueName()'),'ליגת העל');assert.equal(run("BcatFind(me().bkey).l.id"),'il1');assert.ok(run('BmyStr()')>=58,'a club of the top division is rated as one');
  assert.equal(b1.contract.goal,12);assert.equal(b1.contract.zone,'stay','the board asks a promoted club to stay up');
  assert.ok(b1.ledger.some(x=>x.season===2&&/מענק עלייה לליגת העל/.test(x.label)&&x.amount===2000000),'a promotion grant, in the new season\'s books');assert.equal(run('me().money'),before+2000000);
  assert.match(run("G.paper.find(s=>s.ev&&s.ev.type==='promo').h"),/הפועל כפר סבא עולה לליגת העל/);   /* (found by its kind: a club may bid for his top scorer the same summer, and that story is newer) */assert.ok(b1.paperPop.some(s=>s.ev&&s.ev.type==='promo'),'and the paper opens with it');
  whole();const after=il();const gone=base[0].keys.filter(k=>!after[0].keys.includes(k));assert.equal(gone.length,2);assert.ok(gone.every(k=>after[1].keys.includes(k)),'the two that went down are in Leumit');assert.ok(after[0].keys.includes('l:l_ksa'));
  assert.ok(run("Bcat().find(c=>c.id==='il').leagues[1].clubs.filter(x=>x.was==='il1').every(x=>x.str<=59)"),'a relegated club is not rated above its new league');
  assert.ok(run("Bstate().league.every(id=>club(id)&&club(id).players.length>=14)"),'every club of the new league has a squad');
  quiet();w.eval("Btab='league';Brender()");assert.equal($$('.bleague-table tr').length,15);assert.equal($$('.bleague-table tr.bz-down').length,2);assert.equal($$('.bleague-table tr.bz-up').length,0);assert.equal($$('.bleague-table tr.bz-cl').length,3);assert.match($('.bzones-new').textContent,/הפועל כפר סבא \(עלתה\)/);
  same('renders leave the career as it was');
  // ---- the market after going up: his country, one league at a time, his own first
  w.eval("Btab='market';Bcategory='league';Bsort='asc';Bquery='';Bpos='all';Brender()");assert.deepEqual($$('.btabs .bbtn').map(x=>x.textContent),['ישראל','בכל הליגות','שחקנים חופשיים'],'the first tab is the country, not "my league"');
  const chips=()=>$$('.bchip').map(x=>({id:x.dataset.bhomeleague,on:x.getAttribute('aria-pressed')==='true',t:x.textContent}));assert.deepEqual(chips().map(c=>c.id),['il1','il2','il3n','il3s']);assert.deepEqual(chips().filter(c=>c.on).map(c=>c.id),['il1'],'it opens on the league he plays in now');assert.match(chips()[0].t,/ליגת העל.*הליגה שלי/);
  const leaguesOf=()=>run("[...new Set(BmarketPool().map(x=>BcatFind(x.c.bkey).l.id))]");assert.deepEqual(leaguesOf(),['il1'],'and lists that league only: no club of the one he left');assert.ok(run('BmarketPool().length')>=100);assert.ok(run('BmarketPool().every(x=>x.c.id!==G.me)'));
  same('the market only reads');
  w.eval("Btab='market';Brender()");$('[data-bhomeleague="il2"]').click();assert.deepEqual(chips().filter(c=>c.on).map(c=>c.id),['il2']);assert.deepEqual(leaguesOf(),['il2']);assert.match($('#bresults').previousElementSibling.textContent,/ליגה לאומית/);
  {const n=run('G.clubs.length');$('[data-bhomeleague="il3n"]').click();assert.deepEqual(leaguesOf(),['il3n']);assert.ok(run('G.clubs.length')>n,'a league\'s clubs are built when he chooses it');const a=snap();w.eval('Brender();Brender()');assert.equal(snap()===a,true,'and not by drawing the list')}
  $('[data-bhomeleague="il1"]').click();assert.deepEqual(leaguesOf(),['il1']);
  // best first
  assert.deepEqual([...$('#bsort').options].map(o=>o.value),['ovr','desc','asc']);assert.match($('#bsort').options[0].textContent,/דירוג גבוה/);$('#bsort').value='ovr';$('#bsort').dispatchEvent(new w.Event('change',{bubbles:true}));
  {const o=run('BmarketPool().map(x=>x.p.ovr)');assert.ok(o.every((v,i)=>!i||o[i-1]>=v),'sorted by rating, best first');assert.equal(o[0],run("Math.max(...Bstate().league.filter(id=>id!==G.me).flatMap(id=>club(id).players.map(p=>p.ovr)))"),'the best player of the league leads the list');assert.equal(w.localStorage.getItem('goalasso.beginner.sort'),'ovr','the order is remembered')}
  w.eval("Bsort='asc'");
  // what can be spent: the sponsor's signed money counts, so a promoted club can act
  const bud=()=>run('({money:me().money,commit:Bcommitment(),budget:Bbudget(),sp:me().sponsor?me().sponsor.annual*Bremaining():0})');
  {const b0=bud();assert.equal(b0.sp,0);assert.equal(b0.budget,b0.money-b0.commit);w.eval("Btab='market';Brender()");assert.ok($('.bbudget'),'the market says what can be spent');assert.match($('.bbudget').textContent,/עוד לא בחרת חסות/);assert.ok($('.bbudget [data-tab="finance"]'));
   w.eval("Btab='finance';Brender()");$('[data-sponsor-b]').click();quiet();const b1=bud();assert.ok(b1.sp>0);assert.equal(b1.budget,Math.round(b1.money+b1.sp-b1.commit),'cash + what the sponsor still owes − wages and costs to the end of the season');assert.ok(b1.budget>b0.budget)}
  w.eval("Btab='market';Bcategory='league';Bsort='ovr';Brender()");if(run('Bbudget()')<=0){assert.ok($('.bbudget.low'),'a season in the red leaves nothing to spend, and the market says so');assert.equal($$('.bafford').length,0)}
  w.eval("me().money+=7000000;Brender()");assert.equal($('.bbudget.low'),null);assert.equal($('.bbudget [data-tab=\"finance\"]'),null);   /* (the test's club lost money in the season it played without a sponsor: it is given some, to have a market to look at) */
  {const t=run("BmarketPool().map(x=>({id:x.p.id,buy:BcanPay(BtipPrice(x.p,x.c),x.p),loan:BcanPay(Math.round(Bvalue(x.p)*.08),x.p)}))"),cards=$$('#bresults .bplayer');assert.equal(cards.length,t.length);
   t.forEach((x,i)=>{const tag=cards[i].querySelector('.bafford');assert.equal(tag?tag.className.replace('bafford ',''):'',x.buy?'buy':x.loan?'loan':'','card '+i)});assert.ok(t.some(x=>x.buy),'somebody is within the budget');assert.ok(t.some(x=>!x.buy&&x.loan),'and somebody only on loan');
   // a signing over the budget is refused, one within it goes through
   const over=t.find(x=>!x.buy&&!x.loan)||t.find(x=>!x.buy),ok=t.find(x=>x.buy);const m0=run('me().money'),n0=run('me().players.length');
   w.eval(`Bsign(${over.id},BtipPrice(Bfind(${over.id}).p,Bfind(${over.id}).c),false)`);assert.equal(run('me().players.length'),n0,'not beyond the budget');assert.equal(run('me().money'),m0);
   w.eval(`Bdetail(${over.id})`);$('[data-action="offer"]').click();if(!$('#breply').textContent)w.eval('void 0');w.eval("(()=>{const c=document.querySelector('[data-action=\"counter\"]');if(c){c.click();document.querySelector('[data-action=\"offer\"]').click()}})()");assert.match($('#breply').textContent,/התקציב הפנוי לרכש הוא/,'and he is told what the budget is');quiet();
   const fee=run(`BtipPrice(Bfind(${ok.id}).p,Bfind(${ok.id}).c)`),b2=bud();w.eval(`Bsign(${ok.id},${fee},false)`);quiet();assert.equal(run('me().players.length'),n0+1);assert.equal(run('me().money'),m0-fee);assert.ok(run('Bbudget()')>=0,'the budget never goes under');assert.ok(run('Bbudget()')<b2.budget-fee+1)}
  w.eval("Bsort='asc';Btab='home';Brender()");quiet();
  // the save still fits, and comes back as it was
  assert.ok(w.eval('Bwrite()'));assert.ok(w.localStorage.getItem('goalasso.beginner.v1').length<4.5e6,'the save fits a phone');w.eval('Bload();Brender()');assert.equal(run('Bstate().leagueId'),'il1');assert.deepEqual(il(),after);

  // ---- last in the top division: down again, back where the club began
  season(0);assert.equal(run('Bplace()'),14);$('[data-action="season"]').click();assert.equal($('#reveal'),null,'no trophy for the last place');assert.ok($('.bdialog .bpr.down'));assert.match($('.bdialog .bpr.down').textContent,/יורדים ליגה.*בליגה לאומית/);
  assert.ok($('.bdialog [data-action="newseason"]'),'two places under the goal: the board gives another season');$('[data-action="newseason"]').click();
  assert.equal(run('Bstate().leagueId'),'il2');assert.equal(run('Bstate().league.length'),16);assert.ok(run('Bstate().league.includes(G.me)'));assert.equal(run("Bstate().moves['l:l_ksa']||null"),null,'home again: nothing left to remember');assert.equal(run('Bstate().contract.zone'),null);
  assert.match(run("G.paper.find(s=>s.ev&&s.ev.type==='releg').h"),/יורדת לליגה לאומית/);whole();quiet();

  // ---- mid-table: the club stays, two of its rivals change
  season(5);const l0=run('Bstate().league.slice()'),tail=run('Bstandings().slice(-2).map(c=>c.id)'),head=run('Bstandings().slice(0,2).map(c=>c.id)');$('[data-action="season"]').click();assert.equal($('.bdialog .bpr'),null);assert.match($('.bdialog .bpr-others').textContent,/עולות: .+יורדות: .+/);
  $('[data-action="newseason"]').click();const l1=run('Bstate().league.slice()');assert.equal(run('Bstate().leagueId'),'il2');assert.equal(l1.length,16);for(const id of [...tail,...head])assert.ok(!l1.includes(id),'the first two and the last two left');assert.equal(l1.filter(id=>!l0.includes(id)).length,4,'four new rivals');whole();quiet();

  // ---- a job at the turn of a season, at a club that has just gone down
  w.eval("Bcreate('mta',{name:'רון',league:'il1'})");quiet();assert.equal(run('Bstate().moves||null'),null,'a new career starts from the world as it is');assert.deepEqual(il(),base);assert.equal(run("BcatFind('l:l_ksa').l.id"),'il2');
  season(3);$('[data-action="season"]').click();const down=run("Bstate().pr.moves.find(m=>m.from==='il1'&&!m.up)");assert.ok(down);w.eval(`document.querySelector('.bdialog')?.remove();BtakeJob({key:${JSON.stringify(down.key)},league:'il1'})`);
  assert.equal(run('me().bkey'),down.key);assert.equal(run('Bstate().leagueId'),'il2','he follows the club to the league it is in now');assert.equal(run('Bstate().league.length'),16);assert.ok(run('Bstate().league.includes(G.me)'));assert.equal(run('Bstate().season'),2);assert.equal(run('Bstate().prV'),2);whole();quiet();

  // ---- a career from before: the champion who was left in his league
  const old=(round)=>{w.eval("Bcreate('l:l_ksa',{name:'ותיק',league:'il2'})");quiet();season(1);w.eval(`(()=>{const b=Bstate();BpaperSeason();b.feted=b.season;b.season=2;G.season=2;Bseason();delete b.prV;delete b.pr;b.paperPop=[];for(let i=0;i<${round};i++){BfinishRound();document.querySelector('.bdialog')?.remove()}b.paperPop=[];b.out=null;Bwrite()})()`)};
  old(0);assert.equal(run('Bstate().leagueId'),'il2');w.eval('Bload();Brender()');assert.equal(run('Bstate().leagueId'),'il1','before the first round he simply goes up');assert.equal(run('Bstate().league.length'),14);assert.ok(run('Bstate().league.includes(G.me)'));assert.equal(run('Bstate().round'),0);assert.equal(run('Bstate().prV'),2);
  assert.match(w.eval('Bnotice'),/עלתה לליגת העל/);assert.ok(run("Bstate().ledger.some(x=>/מענק עלייה/.test(x.label))"));assert.equal(run('Bstate().contract.zone'),'stay');whole();assert.ok(run("Bstate().prLast.moves.filter(m=>m.up).length===2&&Bstate().prLast.moves.filter(m=>!m.up).length===2"));quiet();
  w.eval('Bwrite();Bload();Brender()');assert.equal(run('Bstate().leagueId'),'il1','and only once');assert.equal(run("Bstate().ledger.filter(x=>/מענק עלייה/.test(x.label)).length"),1);
  // once he has played, he is asked
  old(2);w.eval('Bload();Btab="home";Brender()');assert.equal(run('Bstate().leagueId'),'il2');assert.equal(run('Bstate().round'),2);assert.ok(run('Bstate().prOwed'));assert.ok($('.bpr-owed'),'the home page says a promotion is owed');assert.match($('.bpr-owed').textContent,/מגיעה לכם עלייה לליגת העל/);
  same('the banner only reads');
  $('[data-action="pr-up"]').click();assert.ok($('.bdialog [data-action="pr-up"][data-sure]'),'going up now starts the season again, so it is confirmed');assert.equal(run('Bstate().leagueId'),'il2');$('.bdialog [data-bclose]').click();assert.ok(run('Bstate().prOwed'));
  $('[data-action="pr-up"]').click();$('.bdialog [data-action="pr-up"][data-sure]').click();assert.equal(run('Bstate().leagueId'),'il1');assert.equal(run('Bstate().round'),0);assert.equal(run('Bstate().prOwed'),null);assert.equal($('.bpr-owed'),null);whole();quiet();
  old(2);w.eval('Bload();Btab="home";Brender()');$('[data-action="pr-keep"]').click();assert.equal(run('Bstate().prOwed'),null);assert.equal(run('Bstate().leagueId'),'il2','he may also finish the season where he is');assert.equal($('.bpr-owed'),null);w.eval('Bwrite();Bload();Brender()');assert.equal($('.bpr-owed'),null,'and is not asked again');
  // a club that was not at the top is owed nothing
  w.eval("Bcreate('l:l_ksa',{name:'שקט',league:'il2'})");quiet();season(6);w.eval("(()=>{const b=Bstate();BpaperSeason();b.season=2;G.season=2;Bseason();delete b.prV;delete b.pr;b.paperPop=[];Bwrite();Bload();Brender()})()");assert.equal(run('Bstate().leagueId'),'il2');assert.equal(run('Bstate().prOwed'),null);assert.equal(run('Bstate().prV'),2);

  // ---- Liga Alef: the champion of a district goes up to Leumit
  const alef=run("BcatLeague('il3n').clubs[0].key");w.eval(`Bcreate(${JSON.stringify(alef)},{name:'צפוני',league:'il3n'})`);quiet();assert.equal(run('Bstate().leagueId'),'il3n');season(1);$('[data-action="season"]').click();$('#moClose').click();assert.match($('.bdialog .bpr.up').textContent,/בליגה לאומית/);$('[data-action="newseason"]').click();
  assert.equal(run('Bstate().leagueId'),'il2');assert.equal(run('Bstate().league.length'),16);assert.ok(run('Bstate().league.includes(G.me)'));assert.ok(run("Bstate().ledger.some(x=>/מענק עלייה לליגה לאומית/.test(x.label)&&x.amount===600000)"));whole();quiet();

  // ---- another country: the Championship's winner plays in the Premier League
  const en=()=>run("Bcat().find(c=>c.id==='en').leagues.map(l=>l.clubs.length)"),en0=en(),ch=run("BcatLeague('en2').clubs[3].key");w.eval(`Bcreate(${JSON.stringify(ch)},{name:'ג׳ון',league:'en2'})`);quiet();season(1);$('[data-action="season"]').click();$('#moClose').click();$('[data-action="newseason"]').click();
  assert.equal(run('Bstate().leagueId'),'en1');assert.deepEqual(en(),en0);assert.ok(run('Bstate().league.includes(G.me)'));assert.deepEqual(il(),base,'and Israel is as it was: only the coach\'s country moves');quiet();

  // ---- the paper knows the two new stories
  assert.equal(run("npImage({ev:{type:'promo'}}).k"),'champ');assert.equal(run("NP_RIBBON.promo"),'עולים ליגה');assert.equal(run("NP_RIBBON.releg"),'יורדים ליגה');
 }catch(e){errors.push(e.stack||String(e))}
 console.log('beginner moves: the ladder, a champion goes up (plate, summary, paper, grant, goal), going down, new rivals, a job at a relegated club, a champion left behind by an older build, Liga Alef, another country; errors',JSON.stringify(errors,null,1).slice(0,6000));
 process.exit(errors.length?1:0);
})();
