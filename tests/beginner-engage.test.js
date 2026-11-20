// A reason for one more match in the beginner career: experience and levels, a pack for every level (three cards face
// up, one is chosen), three missions, what the next match is about, the paper of the round, the signing and trophy
// moments of the full game, and the daily challenge (the same for everybody, one attempt, never touching the career).
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const html=fs.readFileSync(path.join(root,'beginner.html'),'utf8');
const open=(url,store)=>new JSDOM(html,{url,runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__ilmNoSplash=1;w.__noEnv=1;w.__noBook=1;w.__noHalf=1;w.__noBids=1;w.__noInjStop=1;w.__noExtras=1;w.__dailyDate='2026-11-16';w.matchMedia=()=>({matches:true});w.scrollTo=()=>{};if(store)for(const [k,v] of Object.entries(store))w.localStorage.setItem(k,v)}}).window;
const w=open('https://engage.test/beginner.html');
const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));
const tick=(ms=160)=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 try{
  // ---- a new coach: level 1, the same three first missions for everybody, and a screen that only reads
  w.eval("Bcreate('mta',{name:'דני רופא',league:'il1'});Bstate().paperPop=[];G.penGame=false");await tick();w.eval('closeFrontPage(true)');
  assert.deepEqual(run('[Bstate().lvl,Bstate().xp,Bstate().packs]'),[1,0,[]]);assert.deepEqual(run('Bstate().ms.map(m=>m.k)'),['win','scorer','sponsor']);
  assert.match($('.btop .axp').textContent,/רמה\s*1/);assert.equal($$('.amis-row').length,3);assert.equal($('.amis-claim'),null);assert.ok($('.amis-go[data-bms-go="finance"]'),'the club mission leads to its screen');
  const snap=()=>w.eval("JSON.stringify([Bstate().lvl,Bstate().xp,Bstate().ms,Bstate().ct,Bstate().packs,Bstate().st,me().players.map(p=>p.no)])");
  {const a=snap();w.eval('Brender();Brender()');assert.equal(snap(),a,'drawing the home screen changes nothing')}
  assert.deepEqual(run('[1,2,3,4,8,9].map(BxpNeed)'),[40,80,120,160,300,300]);assert.deepEqual(run('[2,3,4,5,10].map(BpackTier)'),['s','b','s','g','g']);

  // ---- the first match: experience for what happened in it, a level, a pack, two missions done
  const opp=run("Bnext().find(id=>id!==G.me)"),striker=run('Bstate().ms[1].d.pid');
  const M=(gh,ga,ev,home=true)=>`({h:${home?'G.me':JSON.stringify(opp)},a:${home?JSON.stringify(opp):'G.me'},gh:${gh},ga:${ga},ev:${JSON.stringify(ev)},ps:{},ratings:true})`;
  const g=(m,pid,mine=true,t='goal')=>({t,m,pid,team:mine?'ME':opp,name:mine?'שלנו':'שלהם'});const fix=s=>s.replace(/"ME"/g,'G.me');
  const gain=run(fix(`BxpMatch(${M(2,0,[g(10,striker),g(60,striker)])})`));
  assert.deepEqual(gain.rows.map(r=>r.x),[40,40,6,10],'first match, win, two goals, clean sheet');assert.equal(gain.total,96);assert.deepEqual(gain.ups,[{lvl:2,pack:'s'}]);
  assert.deepEqual(run('[Bstate().lvl,Bstate().xp,Bstate().packs,Bstate().st.w,Bstate().hist]'),[2,56,['s'],1,['W']]);
  assert.deepEqual(run('Bstate().ms.map(m=>m.done)'),[true,true,false]);assert.deepEqual(run("['played','wins','goals','clean'].map(k=>Bstate().ct[k])"),[1,1,2,1]);
  w.eval('Brender()');assert.equal($$('.amis-claim').length,2);assert.ok($('.apk-cta.s'),'a pack waits on the home screen');assert.match($('.apk-cta').textContent,/חבילת כסף/);
  // a second match pays no first-match bonus; a defeat still pays for playing
  assert.deepEqual(run(fix(`BxpMatch(${M(0,1,[g(50,1,false)])})`)).rows.map(r=>r.x),[10]);assert.equal(run('Bstate().st.w'),0);

  // ---- collecting a mission: experience, and another mission of the same kind of thing takes its place
  const xp0=run('Bstate().xpAll');$('.amis-claim[data-bms="0"]').click();assert.equal(run('Bstate().xpAll'),xp0+40);
  assert.equal(run("BMS_DEF[Bstate().ms[0].k].role"),'m');assert.notEqual(run('Bstate().ms[0].k'),'win');assert.equal(run('Bstate().ms[0].done'),false);assert.match($('#aflash').textContent,/40|רמה/);
  w.eval("me().sponsor=null;document.querySelector('.amis-go').click()");assert.equal(run('Btab'),'finance');$('[data-sponsor-b]').click();assert.equal(run('Bstate().ms[2].done'),true,'choosing a sponsor finishes the mission that pointed there');

  // ---- a pack: sealed, three different cards face up, one is selected, read and taken
  w.eval("Btab='home';Brender()");const packs0=run('Bstate().packs.length');$('.apk-cta').click();
  assert.ok($('#bpack.apk.sealed'));assert.equal(run('Bstate().packOpen.step'),'sealed');assert.equal(run('Bstate().packs.length'),packs0-1);
  $('#bpack [data-bpk="later"]').click();assert.equal($('#bpack'),null);assert.equal(run('Bstate().packs.length'),packs0,'not now: the pack goes back unopened');
  w.eval('BpackOpen()');$('#bpack .apk-pack').click();const cards=run('Bstate().packOpen.cards');
  assert.equal(cards.length,3);assert.equal(new Set(cards.map(c=>c.k)).size,3,'three different cards');assert.equal($$('#bpack .apk-card').length,3);assert.equal($('#bpack [data-bpk="take"]'),null,'nothing is taken before a card is chosen');
  // closing the page in the middle neither loses the pack nor deals it again
  {const saved=w.localStorage.getItem('goalasso.beginner.v1');const w2=open('https://engage.test/beginner.html',{'goalasso.beginner.v1':saved});await tick(60);
   assert.deepEqual(JSON.parse(w2.eval('JSON.stringify(Bstate().packOpen.cards)')),cards);w2.eval('BpackOpen()');assert.equal(w2.document.querySelectorAll('#bpack .apk-card').length,3);w2.close()}
  // every kind of card does what it says (applied on a copy of the state so the real pick below stays clean)
  {const r=run(`(()=>{const b=Bstate(),c=me(),out={};const y=c.players.filter(p=>p.age<=23&&p.ovr<(p.pot||p.ovr))[0];
     const m0=c.money;BpackApply({k:'cash',v:70000});out.cash=c.money-m0;out.ledger=b.ledger[b.ledger.length-1].amount;
     const t0=c.players.map(p=>p.bTraining||0);BpackApply({k:'camp',v:3});out.camp=c.players.every((p,i)=>(p.bTraining||0)===t0[i]+3);
     BpackApply({k:'gate',v:2});out.gate=b.boost.gate;if(y){const o=y.ovr;BpackApply({k:'talent',pid:y.id,v:1});out.talent=y.ovr-o}
     c.players[0].inj=3;BpackApply({k:'physio'});out.inj=c.players[0].inj;const bd=b.board;BpackApply({k:'board',v:6});out.board=b.board-bd;return out})()`);
   assert.equal(r.cash,70000);assert.equal(r.ledger,70000);assert.equal(r.camp,true);assert.equal(r.gate,2);if(r.talent!=null)assert.equal(r.talent,1);assert.equal(r.inj,0);assert.ok(r.board>=0&&r.board<=6)}
  $$('#bpack .apk-card')[1].click();assert.equal($$('#bpack .apk-card')[1].getAttribute('aria-pressed'),'true');assert.ok($('#bpack .apk-note').textContent.length>8,'what the card gives is spelled out');
  const n0=run('Bstate().ct.packs||0');$('#bpack [data-bpk="take"]').click();assert.equal(run('Bstate().packOpen.pick'),1);assert.equal(run('Bstate().ct.packs'),n0+1);assert.ok($('#bpack .apk-card.on'));assert.equal($$('#bpack .apk-card.off').length,2);
  $$('#bpack .apk-card')[0].click();assert.equal(run('Bstate().packOpen.pick'),1,'one card a pack');($('#bpack [data-bpk="done"]')||$('#bpack [data-bpk="next"]')).click();w.eval("while(Bstate().packOpen){BpackStep('later');if(Bstate().packOpen)BpackStep('done')}");assert.equal(run('Bstate().packOpen'),null);

  // ---- a scout's tip: one real player of another club at a lower asking price, while it holds
  {const t=run(`(()=>{const c=me();c.money=9e8;const k=G.clubs.find(x=>x.id!==c.id&&x.players.length>16),p=k.players.slice().sort((a,b)=>a.ovr-b.ovr)[2];Bstate().tip={pid:p.id,pct:35,until:Bstate().round+4,s:Bstate().season};return {id:p.id,ask:BtipAsk(p,k),price:BtipPrice(p,k)}})()`);
   assert.ok(t.price<t.ask&&t.price>=t.ask*.6,'about a third off');w.eval(`Bdetail(${t.id})`);assert.ok($('.bdialog .atip'),'the offer screen says so');assert.equal(+$('#boffer').value,t.price);
   $('[data-action="offer"]').click();assert.ok($('[data-sign]'),'the club accepts the reduced price');assert.equal(+$('[data-sign]').dataset.fee,t.price);
   $('[data-sign]').click();assert.equal(run('Bstate().tip'),null,'a tip is used once');assert.ok($('#reveal'));$('#rvClose').click();await tick();w.eval('closeFrontPage(true)');
   assert.equal(run(`(()=>{Bstate().tip={pid:1,pct:35,until:Bstate().round-1,s:Bstate().season};return BtipFor({id:1})})()`),null,'and it runs out')}

  // ---- what the next match is about: read from the state, at most two lines
  {const s=run(`(()=>{const b=Bstate();b.cl=null;b.round=5;b.st.w=3;b.board=20;for(const id of b.league){const c=club(id);c.P=5;c.pts=id===G.me?15:6}return Bstakes().map(x=>x.k)})()`);assert.ok(s.length&&s.length<=2);assert.ok(s.includes('top'));
   w.eval("Btab='home';Brender()");assert.ok($$('.astakes li').length>=1);w.eval("Bstate().round=1;Bstate().board=55;Brender()")}
  // ---- a derby is two clubs of ONE city. Beitar against Be'er Sheva was once announced as one, "the match the whole city is waiting for"
  {const d=run(`(()=>{const b=Bstate(),keep=[G.me,b.schedule[b.round],b.cl];b.cl=null;
     const st=(a,o)=>{G.me=a;b.schedule[b.round]=[[a,o]];return Bstakes().filter(x=>x.k==='derby').map(x=>[x.t,x.h])[0]||null};
     const out={list:DERBIES.map(([a,o,l])=>[club(a).name,club(o).name,l]),bs:[derbyLabel('bje','hbs'),isDerby('hbs','bje'),st('bje','hbs')],city:st('bje','hje'),rival:st('hbs','mta'),classic:st('mta','mhf'),win:[['bje','hje'],['mta','mhf'],['hbs','mta']].map(p=>derbyWords(...p).win)};
     G.me=keep[0];b.schedule[b.round]=keep[1];b.cl=keep[2];return out})()`);
   assert.deepEqual(d.bs,[null,false,null],'two cities, and no rivalry anybody names');
   let cities=0;for(const [a,o,l] of d.list)if(l.startsWith('דרבי ')){const city=l.slice(5);cities++;assert.ok(a.endsWith(city)&&o.endsWith(city),l+': '+a+', '+o)}else assert.ok(!l.includes('דרבי'),l);assert.ok(cities>=4);
   assert.equal(d.city[0],'דרבי');assert.match(d.city[1],/דרבי ירושלים.*כל העיר/);
   assert.equal(d.rival[0],'יריבות');assert.doesNotMatch(d.rival[1],/דרבי|העיר/);assert.equal(d.classic[0],'קלאסיקו');assert.doesNotMatch(d.classic[1],/דרבי|העיר/);
   assert.deepEqual(d.win,['ניצחון בדרבי','ניצחון בקלאסיקו','ניצחון על יריבה גדולה'])}

  // ---- a round: every result kept, a match report written from the match, and the edition around it
  w.eval("G.paper=[];Bstate().paperPop=[]");$('.aorb').click();w.eval("if(document.querySelector('.bdialog [data-action=\"play\"]'))document.querySelector('.bdialog [data-action=\"play\"]').click();BstopBroadcast();while(Bstate().live)Btick(true)");
  const rnd=run('Bstate().rnd');assert.equal(rnd.res.length,run('Bstate().schedule[0].length'),'all the results of the round');assert.equal(Object.keys(rnd.prev).length,run('Bstate().league.length'));assert.equal(rnd.seen,false);
  assert.equal(run('G.paper[0].ev.type'),'match');assert.equal(run('G.paper[0].wk'),rnd.r);assert.ok($('.bdialog .axps'),'experience under the result');assert.ok($('.bdialog [data-action="edition"]'));assert.equal($('#npModal'),null,'a report does not open by itself');
  w.eval("document.querySelector('.bdialog').remove();Btab='home';Brender()");assert.match($('.atile[data-action="paper"]').textContent,/חדש/);$('.atile[data-action="paper"]').click();
  assert.ok($('#npModal .np-score'),'the full-time plate');assert.equal($$('#npModal .np-res li').length,rnd.res.length);assert.ok($('#npModal .np-res li.me'));assert.ok($$('#npModal .np-tab tbody tr.me').length===1);assert.match($('#npModal .np-meta').textContent,/מהדורת המחזור/);assert.match($('#npModal .np-meta').textContent,/מחזור/);
  assert.ok($('#npModal .np-next'));assert.equal(run('Bstate().rnd.seen'),true);w.eval('closeFrontPage(true);Brender()');assert.doesNotMatch($('.atile[data-action="paper"]').textContent,/חדש/);
  w.eval('BpaperArchive()');assert.ok($('.bdialog .bedition-card'),'the edition leads the archive');w.eval("document.querySelector('.bdialog').remove()");
  // the headline follows the match, not only the score
  {const H=(gh,ga,ev,home=true)=>run(fix(`BeditionStory(${M(gh,ga,ev,home)},3).h`));
   assert.match(H(3,0,[g(5,7),g(40,7),g(77,7)]),/^שלושער ל/);
   // the word counts the goals: four and five are not a hat-trick (a paper led with "hat-trick" over a list of five minutes)
   assert.match(H(4,0,[g(5,7),g(40,7),g(77,7),g(80,7)]),/^רביעייה ל/);assert.match(H(6,1,[g(12,7),g(20,7),g(30,7),g(44,7),g(60,7),g(70,8),g(80,1,false)]),/^חמישייה ל.*6:1/);assert.match(H(6,0,[5,10,15,20,25,30].map(m=>g(m,7))),/^6 שערים ל/);
   assert.match(H(7,0,[g(1,8),g(2,8),g(3,8),g(10,7),g(20,7),g(30,7),g(40,7)]),/^רביעייה ל/,'the man with the most leads');assert.deepEqual([2,3,4,5,6,1].map(n=>w.eval(`goalsWord(${n})`)),['צמד','שלושער','רביעייה','חמישייה','6 שערים','']);assert.match(H(2,1,[g(10,1,false),g(50,7),g(70,8)]),/מהפך/);assert.match(H(1,0,[g(88,7)]),/דקה 88/);
   assert.match(H(0,0,[]),/תיקו מאופס/);assert.match(H(1,2,[g(10,7),g(50,1,false),g(60,1,false)]),/הובילה/);assert.match(H(0,4,[g(1,1,false),g(2,1,false),g(3,1,false),g(4,1,false)]),/ערב שחור/);assert.match(H(1,1,[g(10,1,false),g(89,7)]),/מציל נקודה/);
   const st=run(fix(`BeditionStory(${M(2,1,[g(10,1,false),g(50,7),g(70,8)])},3)`));assert.equal(st.ev.res,'W');assert.deepEqual([st.ev.gh,st.ev.ga],[2,1]);assert.match(st.body,/דק׳ 50/)}
  // the report calls a derby a derby and a rivalry between two cities by the rival's name (the coach here is Maccabi Tel Aviv)
  {const Hd=(o,gh,ga)=>run(`BeditionStory({h:G.me,a:${JSON.stringify(o)},gh:${gh},ga:${ga},ev:[],ps:{},ratings:true},3).h`);
   assert.match(Hd('hta',1,0),/^דרבי תל אביב: .*חוגגת/);assert.match(Hd('hta',0,1),/^דרבי תל אביב: ערב קשה/);assert.match(Hd('mhf',1,0),/^הקלאסיקו הישראלי: /);
   assert.match(Hd('hbs',1,0),/גברה על היריבה הגדולה הפועל באר שבע/);assert.match(Hd('hbs',0,1),/ערב קשה.*היריבה הגדולה/);assert.doesNotMatch(Hd('hbs',1,0)+Hd('hbs',0,1)+Hd('bje',1,0),/דרבי/)}
  // an evening of fans: the next home gate pays more, and the evenings run out
  {const r=run(`(()=>{const b=Bstate(),c=me();b.boost.gate=1;let n=0;while(n++<6&&b.boost.gate>0){const pair=Bnext();if(!pair){BfinishRound();continue}const home=pair[0]===c.id;BfinishRound();document.querySelector('.bdialog')?.remove();if(home)return b.ledger.filter(x=>/ערב אוהדים/.test(x.label)).length}return -1})()`);assert.equal(r,1);assert.equal(run('Bstate().boost.gate'),0)}

  // ---- the moments of the full game: a title is celebrated once, before the season's numbers
  {w.eval("(()=>{const b=Bstate();b.cl=null;b.round=b.schedule.length;for(const id of b.league){const c=club(id);c.pts=id===G.me?99:1}Btab='home';Brender()})()");$('[data-action="season"]').click();
   assert.ok($('#reveal.mo'),'the trophy moment');assert.equal($('.bdialog'),null);assert.match($('#reveal .mo-plate').textContent,/אלופת ליגת העל/);$('#moClose').click();assert.ok($('.bdialog'),'then the summary');
   w.eval("document.querySelector('.bdialog').remove()");$('[data-action="season"]').click();assert.equal($('#reveal'),null,'once a season');w.eval("document.querySelector('.bdialog')?.remove();Bstate().round=3;Brender()")}

  // ---- the daily challenge: the plan is the date and nothing else
  const plan=run("(()=>{const p=BdailyPlan('2026-11-16');return {form:p.form,keys:p.offers.map(t=>t.map(x=>x.key)),ovr:p.offers.map(t=>t.map(x=>x.ovr)),pos:p.offers.map(t=>t.map(x=>x.pos)),slots:p.slots,opps:p.opps.map(d=>[d[0],d[6]]),bench:p.bench.length}})()");
  assert.equal(plan.keys.length,11);assert.ok(plan.keys.every(t=>t.length===3));assert.equal(new Set(plan.keys.flat()).size,33,'nobody is offered twice');assert.ok(plan.pos.every((t,i)=>t.every(p=>p===plan.slots[i])),'every offer plays in its place');
  assert.equal(plan.opps.length,4);assert.ok(plan.opps[3][1]>plan.opps[0][1],'the path gets harder');assert.equal(new Set(plan.opps.map(o=>o[0])).size,4);assert.equal(plan.bench,5);
  {const w2=open('https://engage.test/beginner.html');const again=JSON.parse(w2.eval("JSON.stringify((()=>{const p=BdailyPlan('2026-11-16');return [p.form,p.offers.map(t=>t.map(x=>x.key)),p.opps.map(d=>d[0])]})())"));
   assert.deepEqual(again,[plan.form,plan.keys,plan.opps.map(o=>o[0])],'another phone gets the same day');const other=JSON.parse(w2.eval("JSON.stringify(BdailyPlan('2026-11-17').offers.map(t=>t.map(x=>x.key)))"));assert.notDeepEqual(other,plan.keys,'tomorrow is another challenge');w2.close()}
  // it runs on a throw-away state: the career in storage is not touched until the coach is back
  const career=()=>w.localStorage.getItem('goalasso.beginner.v1');const xpAll0=run('Bstate().xpAll'),clubName=run('me().name');
  assert.ok($('.adl-entry [data-bdaily-open]'),'the card on the home screen');$('.adl-entry [data-bdaily-open]').click();let saved=career();   /* the career is saved on the way in, and then left alone */
  assert.equal(run('SANDBOX'),true);assert.equal(run('G.beginner.daily'),true);assert.equal(run('me().name'),'נבחרת היום');assert.ok($('.adaily .adl-hero'));assert.equal($$('.adl-path li').length,4);
  $('[data-bdaily="start"]').click();assert.equal($$('.adl-offer').length,3);assert.equal($$('.adl-offer .afut').length,3);
  $$('.adl-offer')[0].click();$$('.adl-offer')[1].click();assert.equal(run('BDAILY.picks.length'),2);assert.equal(run('Bwrite()'),true);assert.equal(career(),saved,'nothing of the challenge is written over the career');
  // leaving in the middle and coming back the same day resumes the draft
  $('[data-bdaily="exit"]').click();assert.equal(run('BDAILY'),null);assert.equal(run('me().name'),clubName);assert.equal(run('SANDBOX'),false);assert.equal(run('Bstate().xpAll'),xpAll0,'an unfinished challenge pays nothing');
  assert.match($('.adl-entry').textContent,/בחרת\s*2/);$('.adl-entry [data-bdaily-open]').click();saved=career();assert.equal(run('BDAILY.picks.length'),2);assert.deepEqual(run('BDAILY.picks.map(p=>p.bkey)'),[plan.keys[0][0],plan.keys[1][1]]);
  w.eval("while(BDAILY.st.stage==='draft')BdailyPick(0)");assert.equal(run('BDAILY.picks.length'),11);assert.equal(run('me().players.length'),16);assert.equal(run('BDAILY.st.stage'),'cup');assert.equal(run('BDAILY.opp.name'),plan.opps[0][0]);
  assert.ok($('.amatch [data-bdaily="play"]'));$('[data-bdaily="play"]').click();assert.ok(run('!!Bstate().live'));assert.equal(run('Bstate().live.M.bDaily'),0);assert.match($('.bbroadcast .bpill').textContent,/האתגר היומי/);
  $('[data-bdaily-open]')||0;assert.equal(run("(()=>{BdailyClose();return !!BDAILY})()"),true,'no way out in the middle of a match');
  // play it to the end, whatever the end is
  w.eval("(()=>{let n=0;while(BDAILY.st.stage==='cup'&&n++<8){if(!Bstate().live)BdailyPlay();BstopBroadcast();while(Bstate().live)Btick(true)}})()");
  const end=run('BDAILY.st');assert.ok(end.stage==='won'||end.stage==='out');assert.ok(end.res.length>=1&&end.res.length<=4);assert.equal(end.res.filter(r=>!r.won).length,end.stage==='won'?0:1,'one defeat ends it');
  assert.deepEqual([end.rec.played,end.rec.streak,end.rec.last],[1,1,'2026-11-16']);assert.equal(career(),saved);assert.ok($('.adl-hero.'+end.stage));assert.ok($('[data-bdaily="share"]'));
  const text=run('BdailyShareText(BDAILY.st)');assert.match(text,/האתגר היומי 16\.11/);assert.match(text,/goal-m\.com\/\?daily/);assert.equal((text.match(/🟩|🟥|⬜/gu)||[]).length,4);assert.match(text,end.stage==='won'?/זכיתי בגביע/:/נעצרתי/);
  // back in the career: paid once, counted for the mission, and the day is spent
  const wins=end.res.filter(r=>r.won).length,pay=20+wins*20+(end.stage==='won'?60:0);$('[data-bdaily="exit"]').click();
  assert.equal(run('me().name'),clubName);assert.equal(run('Bstate().xpAll'),xpAll0+pay);assert.equal(run('Bstate().ct.daily'),1);assert.notEqual(career(),saved,'now the career is saved, with the experience');
  assert.equal(run('BdailyDoneToday()'),true);assert.match($('.adl-entry').textContent,/האתגר הבא בעוד/);$('.adl-entry [data-bdaily-open]').click();assert.ok($('.adl-hero.'+end.stage),'one attempt a day');assert.equal($('[data-bdaily="start"]'),null);
  $('[data-bdaily="exit"]').click();assert.equal(run('Bstate().xpAll'),xpAll0+pay,'and it is not paid twice');
  // tomorrow
  w.__dailyDate='2026-11-17';assert.equal(run('BdailyDoneToday()'),false);assert.equal(run('BdailyStore().stage'),null);assert.equal(run('BdailyStore().rec.played'),1);w.eval('Brender()');assert.match($('.adl-entry .bbtn').textContent,/שחק/);
  // the link opens it, with or without a career
  {const w3=open('https://engage.test/beginner.html?daily');assert.equal(w3.eval('BdailyLink()'),true);await tick(700);assert.equal(w3.eval('!!BDAILY'),true);assert.ok(w3.document.querySelector('.adaily'));
   w3.document.querySelector('[data-bdaily="exit"]').click();assert.equal(w3.eval('!!BDAILY'),false);assert.equal(w3.localStorage.getItem('goalasso.beginner.v1'),null,'no career is made by a visit');assert.ok(w3.document.querySelector('.adl-entry'),'the start screen offers it too');w3.close()}
  assert.equal(run('BdailyLink()'),false);

  // ---- a career saved before all this gets its level and missions when it is loaded
  {const d=JSON.parse(career());for(const k of ['lvl','xp','xpAll','packs','ct','st','hist','boost','ms','vs','rnd','gain','tip'])delete d.G.beginner[k];
   const w4=open('https://engage.test/beginner.html',{'goalasso.beginner.v1':JSON.stringify(d)});await tick(60);const b=JSON.parse(w4.eval('JSON.stringify([Bstate().lvl,Bstate().xp,Bstate().ms.length,Bstate().packs])'));assert.deepEqual(b,[1,0,3,[]]);
   assert.ok(w4.document.querySelector('.amis'));assert.equal(w4.localStorage.getItem('goalasso.beginner.v1'),JSON.stringify(d),'loading does not write');w4.close()}
  // ---- five more missions (a comeback, a win by three, a hat-trick, three different scorers, a rating point won in training) and what feeds them
  {const ct=()=>run("['comeback','big','hat','spread'].map(k=>Bstate().ct[k]||0)"),d=(gh,ga,ev,home=true)=>{const a=ct();w.eval(fix(`BxpMatch(${M(gh,ga,ev,home)})`));return ct().map((x,i)=>x-a[i])};
   assert.deepEqual(d(2,1,[g(10,1,false),g(50,7),g(70,8)]),[1,0,0,0],'behind, and won');assert.deepEqual(d(1,1,[g(10,1,false),g(80,7)]),[1,0,0,0],'behind, and a point');
   assert.deepEqual(d(1,2,[g(10,1,false),g(50,7),g(70,1,false)]),[0,0,0,0],'behind and beaten is no comeback');assert.deepEqual(d(1,1,[g(5,3,true,'own'),g(60,7)]),[1,0,0,0],'an own goal puts him behind too');
   assert.deepEqual(d(3,0,[g(10,7),g(50,7),g(70,7)]),[0,1,1,0],'three by one man, and by three goals');assert.deepEqual(d(3,2,[g(10,7),g(20,8),g(30,9),g(40,1,false),g(50,1,false)]),[0,0,0,1],'three different scorers');
   assert.deepEqual(d(2,1,[g(10,1,false),g(20,1,false),g(30,7)],false),[0,0,0,0],'away and beaten 2:1, the sides read the right way round');assert.deepEqual(d(1,2,[g(10,1,false),g(20,7),g(30,8)],false),[1,0,0,0],'away, behind, and won');
   assert.deepEqual(['comeback','big','hat','spread','grow'].map(k=>run(`BMS_DEF.${k}.role`)),['m','m','p','p','c']);assert.match(run('BMS_DEF.hat.text({n:1})'),/שלושער/);assert.match(run('BMS_DEF.comeback.text({n:1})'),/חזור מפיגור/);assert.equal(run('BMS_DEF.grow.go'),'training');
   assert.equal(run('BMS_DEF.hat.ok()'),run('BmsTopHalf()'),'the ones that need goals are offered to the stronger half of the league');
   // given, finished by the match, worth a gold pack
   w.eval("Bstate().ms[1]=Object.assign({k:'hat',p:0,done:false,from:Bstate().ct.hat||0},BMS_DEF.hat.make())");assert.deepEqual(run('[Bstate().ms[1].xp,Bstate().ms[1].pack,Bstate().ms[1].d.s===Bstate().season]'),[180,'g',true]);
   w.eval('Brender()');assert.match($('.amis').textContent,/שלושער/);w.eval(fix(`BxpMatch(${M(2,0,[g(10,7),g(50,7)])})`));assert.equal(run('Bstate().ms[1].done'),false,'two are not three');w.eval(fix(`BxpMatch(${M(4,0,[g(10,7),g(50,7),g(60,7),g(70,7)])})`));assert.equal(run('Bstate().ms[1].done'),true);
   // not done by the end of its season: it makes room (nothing can be swapped by hand)
   w.eval("Bstate().ms[0]=Object.assign({k:'comeback',p:0,done:false,from:Bstate().ct.comeback||0},BMS_DEF.comeback.make());BmsFill()");assert.equal(run('Bstate().ms[0].k'),'comeback','it stays through its season');
   w.eval('Bstate().season++;BmsFill()');assert.notEqual(run('Bstate().ms[0].k'),'comeback');assert.equal(run("BMS_DEF[Bstate().ms[0].k].role"),'m');assert.equal(run('Bstate().ms[1].k'),'hat','a finished one waits to be collected');w.eval('Bstate().season--');
   // a rating point won on the training ground
   const gr=run("(()=>{const c=me(),b=Bstate(),p=c.players.find(p=>p.pos==='FW'&&!p.inj);p.pot=p.ovr+3;p.bTraining=7;b.tr=null;b.live=null;const a=b.ct.grow||0,o=p.ovr;const r=BtrainSolo(p.id);return {up:b.ct.grow-a,ovr:p.ovr-o,ok:!!r}})()");assert.deepEqual(gr,{up:1,ovr:1,ok:true})}
  assert.deepEqual(errors,[]);
  console.log('beginner engage: levels and experience, packs (choose one of three), missions, stakes, the round edition and its headlines, signing and trophy moments, the daily challenge (same plan, sandbox, one attempt, share, link), older careers; errors []');
 }catch(e){console.error(e);errors.push(String(e&&e.message||e));console.log('beginner engage errors',JSON.stringify(errors.slice(0,3)));process.exitCode=1}
 finally{await new Promise(r=>setImmediate(r));w.close()}
})();
