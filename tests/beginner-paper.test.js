// The newspaper in a beginner career: a front page for the coach's own news (appointed, a player signs, a player is
// sold, a sponsor, resignation, a new job), never over a dialog, one after another when several wait, an archive
// behind the home screen's tile, and routs that go to the archive without opening by themselves.
const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'beginner.html'),'utf8'),{url:'https://paper.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,storageQuota:3e7,virtualConsole:vc,
  beforeParse(w){w.__ilmNoSplash=1;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{};}}).window;
const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];const run=code=>JSON.parse(w.eval(`JSON.stringify(${code})`));
const tick=(ms=160)=>new Promise(r=>setTimeout(r,ms));const page=()=>$('#npModal');const closePaper=async()=>{$('#npModal .npm-bar [data-npclose]').click();await tick()};
(async()=>{
 try{
  // ---- appointed: the first thing a new coach sees is his own front page, and nothing of the full game's opening
  w.eval("Bcreate('mta',{name:'דני רופא'})");
  assert.deepEqual(run('G.paper.map(s=>s.ev&&s.ev.type)'),['appoint'],'only this career\'s stories');assert.equal(page(),null,'not in the same breath as the screen');
  await tick();assert.ok(page(),'the front page opens by itself');assert.match($('#npModal .np-hl').textContent,/דני רופא מונה למאמן מכבי תל אביב/);assert.match($('#npModal .np-ribbon').textContent,/מינוי חדש/);
  assert.match($('#npModal .np-facts').textContent,/החוזה/);assert.match($('#npModal .np-facts').textContent,/היעד/);assert.equal($('#npModal [data-npoff]'),null,'no switch that belongs to the full game');
  await closePaper();assert.equal(page(),null);assert.equal(run('Bstate().paperPop.length'),0);await tick();assert.equal(page(),null,'a story opens once');

  // ---- a signing: the paper waits for the welcome dialog, then shows the player
  const pick=run("(()=>{const o=G.clubs.filter(x=>x.id!==G.me).flatMap(c=>c.players.map(p=>({p,c}))).filter(x=>playerVisual(x.p)).sort((a,b)=>Bvalue(a.p)-Bvalue(b.p))[0];me().money=5e8;return {id:o.p.id,name:fullName(o.p),club:o.c.name,fee:Math.round(Bvalue(o.p))}})()");
  w.eval(`Bsign(${pick.id},${pick.fee},false)`);assert.ok($('.bdialog .bsigning'),'the welcome');await tick();assert.equal(page(),null,'never over a dialog');
  $('[data-action="signed"]').click();await tick();assert.ok(page());assert.ok($('#npModal .np-hl').textContent.includes(pick.name+' חתם במכבי תל אביב'));assert.match($('#npModal .np-ribbon').textContent,/רכש חדש/);
  assert.ok($('#npModal .np-face'),'his own face on the stage');assert.ok($('#npModal .np-sub').textContent.includes(pick.club));await closePaper();
  assert.equal(run('G.paper[0].ev.type'),'sign');assert.equal(run('G.paper[0].ev.pid'),pick.id);

  // ---- a sale: after its own dialog
  const buyer=run("G.clubs.find(x=>x.id!==G.me&&x.players.length<30).id");w.eval(`G.clubs.find(x=>x.id==='${buyer}').money=1e9;Bstate().saleOffer={pid:${pick.id},buyer:'${buyer}',fee:1234000};`);
  assert.equal(w.eval('BconfirmSale()'),true);await tick();assert.equal(page(),null);$('.bdialog [data-bclose]').click();await tick();
  assert.ok(page());assert.ok($('#npModal .np-hl').textContent.includes(pick.name+' עוזב את מכבי תל אביב'));assert.match($('#npModal .np-ribbon').textContent,/יוצא מהמועדון/);await closePaper();

  // ---- two stories at once: one after the other, with a button for the next
  w.eval("BpaperSponsor('חברת הדוגמה',900000);BpaperOffer({name:'מועדון הדוגמה',until:9});Brender()");await tick();
  assert.match($('#npModal .np-hl').textContent,/חתמה עם חברת הדוגמה/);assert.match($('#npModal [data-npnext]').textContent,/1/);$('#npModal [data-npnext]').click();await tick(40);
  assert.match($('#npModal .np-hl').textContent,/מועדון הדוגמה רוצה את דני רופא/);assert.equal($('#npModal [data-npnext]'),null);await closePaper();assert.equal(page(),null);

  // ---- a rout is news for the archive, not a front page that opens by itself
  const n0=run('G.paper.length');const opp=run("G.clubs.find(x=>x.id!==G.me).id");
  w.eval(`BpaperResult({h:G.me,a:'${opp}',gh:4,ga:0,ev:[]});BpaperResult({h:G.me,a:'${opp}',gh:1,ga:0,ev:[]});BpaperResult({h:'${opp}',a:G.me,gh:5,ga:1,ev:[]});Brender()`);await tick();
  assert.equal(run('G.paper.length'),n0+2,'a narrow win is not a story');assert.match(run('G.paper[0].h'),/ערב שחור/);assert.equal(page(),null);

  // ---- the archive behind the tile
  w.eval("Btab='home';Brender()");assert.ok($('[data-action="paper"]'),'the tile on the home screen');$('[data-action="paper"]').click();
  assert.equal($$('.bdialog .bpaper-row').length,run('G.paper.length'));$$('.bdialog .bpaper-row')[run('G.paper.length')-1].click();
  assert.equal($('.bdialog'),null);assert.ok(page());assert.match($('#npModal .np-hl').textContent,/מונה למאמן/,'the oldest story is the appointment');await closePaper();

  // ---- not during a match
  w.eval("BpaperSponsor('חברה שנייה',500000);Bstate().live={};BpaperFlush()");assert.equal(page(),null);w.eval("Bstate().live=null;Bstate().paperPop=[]");

  // ---- he resigns, and signs somewhere else
  w.eval("Bleave('resigned')");assert.ok($('.bout'));await tick();assert.ok(page());assert.match($('#npModal .np-hl').textContent,/דני רופא התפטר ממכבי תל אביב/);assert.match($('#npModal .np-ribbon').textContent,/סוף דרך/);
  assert.match($('#npModal .np-facts').textContent,/המאזן/);await closePaper();
  w.eval("Bleave('fired')");await tick();assert.match($('#npModal .np-hl').textContent,/מכבי תל אביב נפרדת מדני רופא/);await closePaper();
  const job=$('.bout [data-bjob]');const to=job.closest('.boffer').querySelector('strong').textContent;job.click();await tick();
  assert.ok(page());assert.ok($('#npModal .np-hl').textContent.includes('דני רופא מונה למאמן '+to));assert.match($('#npModal .np-text').textContent,/אחרי התקופה שלו במכבי תל אביב/);await closePaper();

  // ---- the champion at the end of a season
  w.eval("(()=>{const b=Bstate();while(b.round<b.schedule.length&&!b.out){b.board=70;BfinishRound();document.querySelector('.bdialog')?.remove()}Bstandings().forEach((c,i)=>c.pts=100-i);me().pts=500;b.paperPop=[];Bsummary()})()");
  assert.equal(run('G.paper[0].ev.type'),'champ');assert.equal(run('G.paper[0].team'),run('G.me'));w.eval('Bsummary()');assert.equal(run("G.paper.filter(s=>s.ev&&s.ev.type==='champ'&&s.s===Bstate().season).length"),1,'once a season');
  assert.ok(run('G.paper.length')<=40);assert.deepEqual(errors,[]);
  console.log('beginner paper: appointment, signing after its dialog, sale, a queue of two, routs to the archive, the archive tile, no paper in a match, resignation, dismissal, a new job, the champion; errors []');
 }catch(e){console.error(e);process.exitCode=1}finally{w.close()}
})();
