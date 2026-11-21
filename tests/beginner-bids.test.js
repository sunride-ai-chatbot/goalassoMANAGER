// Beginner career: bigger clubs bid for a player of the coach's who stands out. Nobody ever asked about one before: the
// league's top scorer could spend five seasons in the second division. Covers who is asked about (the league's leading
// scorers and providers), who asks (the league above; in a top division the bigger clubs of his own), the offer on the home
// page (sell, ask for more once, refuse), the two windows of a season, the summer bid for last season's top scorer, and
// the players nobody may bid for (on loan, or when the squad cannot spare one).
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});vc.on('warn',(...a)=>{if(/bids|paper|moves/.test(String(a[0])))errors.push('warn: '+a.map(String).join(' '))});
const w=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://bids.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__ilmNoSplash=1;w.__noWindow=1;w.__noEnv=1;w.__noBook=1;w.__noHalf=1;w.__noInjStop=1;w.__noExtras=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{}}}).window;
const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));
const quiet=()=>w.eval("(()=>{Bstate().paperPop=[];try{closeFrontPage(true)}catch(e){}try{closeReveal(true)}catch(e){}document.querySelector('.bdialog')?.remove()})()");
/* a career, with one of his forwards made the league's leading scorer (or provider) */
const fresh=(key,lg)=>{w.eval(`Bcreate(${JSON.stringify(key)},{name:'דני',league:'${lg}'})`);quiet();w.eval("G.penGame=false;Bstate().cl=null")};
const lead=(field,n,which)=>run(`(()=>{const c=me(),p=c.players.filter(p=>p.pos==='FW').sort((a,b)=>b.ovr-a.ovr)[${which||0}];BensureStats();Bstate().playerStats[p.id]={pid:p.id,name:fullName(p),clubId:c.id,goals:${field==='goals'?n:0},assists:${field==='assists'?n:0}};return {id:p.id,name:fullName(p),value:Bvalue(p),wage:Byear(p)}})()`);
const toRound=r=>w.eval(`(()=>{const b=Bstate();b.round=${r};G.wk=b.round;b.board=70;BfinishRound();document.querySelector('.bdialog')?.remove();b.out=null})()`);
(async()=>{
 try{
  // ---- the second division: the league's top scorer, and a club of the league above
  fresh('l:l_ksa','il2');const n=run('Bstate().schedule.length'),s1=Math.round(n*.4),s2=Math.round(n*.72);assert.equal(run('Bstate().bid||null'),null);
  const st=lead('goals',25);toRound(s1-2);assert.equal(run('Bstate().bid||null'),null,'no offer between the windows');
  toRound(s1-1);const bid=run('Bstate().bid');assert.ok(bid,'an offer at the first window');assert.equal(bid.pid,st.id);assert.equal(bid.why,'goals');assert.equal(bid.rank,1);assert.equal(bid.until,s1+3);assert.equal(bid.s,1);
  assert.equal(run(`BcatFind(club(${JSON.stringify(bid.buyer)}).bkey).l.id`),'il1','a club of the top division asks');assert.ok(bid.fee>=Math.round(st.value*1.55),'well above his market value: '+bid.fee+' / '+st.value);assert.equal(bid.fee%50000,0);
  {const story=run("G.paper.find(s=>s.ev&&s.ev.type==='bid')||null");assert.ok(story,'a story in the paper');assert.match(story.h,/רוצה את/);assert.equal(story.ev.pid,st.id)}   /* (a club may ask for the coach himself in the same round: that story has no player) */assert.ok(run("Bstate().paperPop.some(s=>s.ev&&s.ev.type==='bid')"),'the paper opens with it');assert.equal(run("npImage({ev:{type:'bid'}}).k"),'stage');assert.equal(run('NP_RIBBON.bid'),'הצעה על השולחן');
  quiet();w.eval("Btab='home';Brender()");const card=$('.bbid');assert.ok(card,'the offer is on the home page');assert.match(card.textContent,/מלך השערים של הליגה העונה/);assert.match(card.textContent,new RegExp(st.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.deepEqual($$('.bbid-acts .bbtn').map(b=>b.dataset.action),['bid-sell','bid-more','bid-no']);
  {w.eval("Btab='league';Brender();Btab='home';Brender()");const a=w.eval('JSON.stringify(G)');w.eval("Brender();Btab='league';Brender();Btab='home';Brender()");assert.equal(w.eval('JSON.stringify(G)')===a,true,'the card only reads')}
  // asking for more: once; the league's top scorer is always worth it
  $('[data-action="bid-more"]').click();const more=run('Bstate().bid');assert.equal(more.asked,true);assert.equal(more.fee,Math.round(bid.fee*1.15/50000)*50000);assert.equal($('[data-action="bid-more"]'),null,'asked once');assert.ok($('.bbid'),'and the offer is still there');
  // selling: confirmed first
  $('[data-action="bid-sell"]').click();assert.ok($('.bdialog [data-action="bid-sell"][data-sure]'));assert.equal(run('me().players.some(p=>p.id==='+st.id+')'),true,'nothing sold by one tap');const n0=run('me().players.length'),m1=run('me().money');
  $('.bdialog [data-action="bid-sell"][data-sure]').click();assert.equal(run('me().players.some(p=>p.id==='+st.id+')'),false);assert.equal(run('me().players.length'),n0-1);assert.equal(run(`club(${JSON.stringify(bid.buyer)}).players.some(p=>p.id===${st.id})`),true,'he plays for the buyer now');
  assert.equal(run('me().money'),m1+more.fee,'the fee is in the bank');assert.ok(run(`Bstate().ledger.some(x=>/^מכירת /.test(x.label)&&x.amount===${more.fee})`));assert.equal(run('Bstate().bid||null'),null);assert.equal(run('me().lineup.filter(Boolean).length'),11,'the eleven is whole again');
  assert.match($('.bdialog').textContent,/המכירה הושלמה/);assert.equal(run("G.paper.find(s=>s.ev&&(s.ev.type==='sale'||s.ev.type==='bid')).ev.type"),'sale');quiet();w.eval('Brender()');assert.equal($('.bbid'),null);

  // ---- refusing: he stays, and is not asked about again this season; another player may be
  fresh('l:l_ksa','il2');const a1=lead('goals',25);toRound(s1-1);assert.equal(run('Bstate().bid.pid'),a1.id);quiet();w.eval("Btab='home';Brender()");$('[data-action="bid-no"]').click();assert.equal(run('Bstate().bid||null'),null);assert.equal($('.bbid'),null);assert.equal(run('me().players.some(p=>p.id==='+a1.id+')'),true);
  const a2=lead('assists',20,1);toRound(s2-1);const b2=run('Bstate().bid');assert.ok(b2,'the second window');assert.equal(b2.pid,a2.id,'somebody else: the one he refused is left alone');assert.equal(b2.why,'assists');quiet();w.eval("Btab='home';Brender()");assert.match($('.bbid').textContent,/מלך הבישולים/);
  // an offer runs out
  toRound(s2);toRound(s2+1);assert.ok(run('Bstate().bid'),'still on the table');toRound(s2+2);assert.equal(run('Bstate().bid||null'),null,'three rounds and it is gone');assert.equal(run('me().players.some(p=>p.id==='+a2.id+')'),true);

  // ---- the summer: last season's top scorer
  fresh('l:l_ksa','il2');const a3=lead('goals',30);w.eval("(()=>{const b=Bstate();b.round=b.schedule.length;G.wk=b.round;const t=Bstandings();t.forEach((c,i)=>c.pts=60-i*2);me().pts=51;b.board=70;b.bidAt='1:1';Btab='home';Brender();document.querySelector('[data-action=\"season\"]').click();document.querySelector('[data-action=\"newseason\"]').click()})()");
  const b3=run('Bstate().bid');assert.ok(b3,'an offer when the season turns');assert.equal(b3.pid,a3.id);assert.equal(b3.last,true);assert.equal(b3.s,2);assert.equal(b3.until,3);quiet();w.eval("Btab='home';Brender()");assert.match($('.bbid').textContent,/מלך השערים של הליגה בעונה שעברה/);assert.equal(run('Bstate().bidAt'),null,'and the new season has its own windows');

  // ---- nobody is taken from a squad that cannot spare him, and a borrowed player is not his to sell
  fresh('l:l_ksa','il2');const a4=lead('goals',25);w.eval("me().players=me().players.slice().sort((a,b)=>(a.id==="+a4.id+"?-1:0)-(b.id==="+a4.id+"?-1:0)||(a.pos==='GK'?-1:0)-(b.pos==='GK'?-1:0)).slice(0,14);autoLineupFor(me())");toRound(s1-1);assert.equal(run('Bstate().bid||null'),null,'fourteen players: no offer');
  fresh('l:l_ksa','il2');const a5=lead('goals',25);w.eval(`Bstate().loans.push({pid:${a5.id},club:Bstate().league.find(id=>id!==G.me)})`);toRound(s1-1);assert.equal(run('Bstate().bid||null'),null,'a player on loan belongs to somebody else');

  // ---- a top division: the bigger clubs of his own league ask
  fresh('hrg','il1');const a6=lead('goals',25);const n1=run('Bstate().schedule.length');toRound(Math.round(n1*.4)-1);const b6=run('Bstate().bid');assert.ok(b6);assert.ok(run('Bstate().league').includes(b6.buyer),'a club of his own league');assert.ok(run(`BcatFind(club(${JSON.stringify(b6.buyer)}).bkey).x.str`)>run('BmyStr()'),'and a bigger one');
  // a new job leaves the offer behind
  w.eval("BtakeJob({key:'mta',league:'il1'})");quiet();assert.equal(run('Bstate().bid||null'),null);
 }catch(e){errors.push(e.stack||String(e))}
 console.log('beginner bids: the top scorer and the league above, the card (sell with a confirmation, ask for more once, refuse), the second window, expiry, the summer bid, squads that cannot spare a player, loans, a top division; errors',JSON.stringify(errors,null,1).slice(0,6000));
 process.exit(errors.length?1:0);
})();
