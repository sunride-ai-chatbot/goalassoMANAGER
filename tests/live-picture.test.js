// What the live match shows: each number of the score beside its own team, the name of the player on the ball (2D pitch and
// 3D highlights) and the player ratings of both sides after the final whistle.
const assert=require('node:assert/strict');const fs=require('fs');const {JSDOM,VirtualConsole}=require('jsdom');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync('beginner.html','utf8'),{url:'https://goalasso.test/beginner.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.matchMedia=()=>({matches:false});w.scrollTo=()=>{}}}).window;
const run=s=>JSON.parse(w.eval(`JSON.stringify(${s})`));const $=s=>w.document.querySelector(s);
async function main(){
  // ---- the score element: home first in the markup, so on the right of a right-to-left row
  const box=w.document.createElement('div');box.innerHTML=w.eval("scoreSides(2,0,{id:'t',label:'א 2, ב 0'})");const el=box.firstChild;
  assert.equal(el.getAttribute('dir'),'rtl');assert.deepEqual([...el.children].map(c=>c.className+'='+c.textContent),['sd-h=2','=:','sd-a=0']);assert.equal(el.getAttribute('aria-label'),'א 2, ב 0');
  w.document.body.append(box);assert.equal(w.eval("scoreSidesSet(document.getElementById('t'),2,1,'x')"),'a','the side that scored is reported');
  assert.equal(el.querySelector('.sd-a').textContent,'1');assert.ok(el.querySelector('.sd-a').classList.contains('pop'));assert.ok(!el.querySelector('.sd-h').classList.contains('pop'));
  assert.equal(w.eval("scoreSidesSet(document.getElementById('t'),2,1)"),'','nothing changed, nothing pulses');box.remove();

  // ---- beginner live board: the home side's goals sit in the home side's half of the board
  w.eval("Bcreate('mta');Bplay();Bstate().live.paused=true");
  const M0=run("({h:Bstate().live.M.h,a:Bstate().live.M.a,hn:club(Bstate().live.M.h).name,an:club(Bstate().live.M.a).name})");
  w.eval("(()=>{const M=Bstate().live.M;M.gh=2;M.ga=0;BpaintBroadcast()})()");
  const board=$('.bscoreboard');assert.equal(board.children[0].querySelector('strong').textContent,M0.hn,'home block first');assert.equal(board.children[2].querySelector('strong').textContent,M0.an);
  const sc=$('#bscore');assert.deepEqual([sc.children[0].className,sc.children[0].textContent,sc.children[2].className,sc.children[2].textContent],['sd-h pop','2','sd-a','0'],'home number first, like the home block');
  assert.equal(sc.getAttribute('aria-label'),`${M0.hn} 2, ${M0.an} 0`);
  w.eval("(()=>{const M=Bstate().live.M;M.gh=0;M.ga=0;BpaintBroadcast()})()");

  // ---- who has the ball (SVG pitch)
  const calls=run(`(()=>{const st=Bpitch;let n=0;const old=Math.random;Math.random=()=>{n++;return old()};try{st.poss=st.hid;carryMinute(st,true,1000)}finally{Math.random=old}return n})()`);
  assert.equal(calls,2,'the picture takes the same two random numbers per minute as before');
  const car=run("(()=>{const st=Bpitch,c=st.car;return {team:c.team,poss:st.poss,keeper:tokKeeper(c.d),name:c.d.name,pid:c.pid}})()");
  assert.equal(car.team,car.poss);assert.equal(car.keeper,false,'an outfield player carries it');assert.ok(car.name);
  // the ball travels to his feet and his name is the label; he heads for the area of the move
  const feet=run(`(()=>{const st=Bpitch;for(let i=0;i<90;i++)pitchFrame(st);const d=st.car.d;return {dist:Math.hypot(st.ball.x-d.x,st.ball.y-d.y),label:st.carLab&&st.carLab.style.display!=='none'?st.carLab.textContent:null,now:st.carNow===d,run:Math.hypot(d.x-d.bx,d.y-d.by)}})()`);
  assert.ok(feet.dist<2.5,'ball at the carrier\'s feet, got '+feet.dist);assert.equal(feet.label,car.name);assert.ok(feet.now);assert.ok(feet.run>1,'the carrier moves with the ball');
  // too soon: the ball does not change hands inside CARRY_MIN; later the other side's nearest man takes it
  const hold=run(`(()=>{const st=Bpitch,first=st.car.pid;st.poss=st.aid;carryMinute(st,false,1000+CARRY_MIN-50);const kept=st.car.pid===first;carryMinute(st,false,1000+CARRY_MIN+50);const b=st.ball,arr=st.a.filter(d=>tokOn(d)&&!tokKeeper(d));const near=arr.reduce((m,d)=>Math.hypot(d.x-b.x,d.y-b.y)<Math.hypot(m.x-b.x,m.y-b.y)?d:m);return {kept,team:st.car.team,aid:st.aid,nearest:st.car.d===near}})()`);
  assert.ok(hold.kept,'a name stays long enough to read');assert.equal(hold.team,hold.aid);assert.ok(hold.nearest);
  // same side keeps the ball: over many minutes it is passed between team-mates, never to the keeper
  const passes=run(`(()=>{const st=Bpitch;const seen=new Set();let t=5000,keeper=0;for(let i=0;i<60;i++){t+=CARRY_MIN+10;st.poss=st.aid;carryMinute(st,false,t);seen.add(st.car.pid);if(tokKeeper(st.car.d))keeper++}return {n:seen.size,keeper}})()`);
  assert.ok(passes.n>=4,'several players get the ball, got '+passes.n);assert.equal(passes.keeper,0);
  // a shot or a corner takes the ball away from him; a held or replaying picture names nobody
  const lost=run(`(()=>{const st=Bpitch,M=Bstate().live.M,h=club(M.h),a=club(M.a);const out={};
    st.car={d:st.h[5],pid:st.h[5].pid,team:st.hid,t0:0};pitchMinute(st,M,h,a,[{t:'corner',team:M.h,m:M.m}]);out.corner=st.car;
    st.car={d:st.h[5],pid:st.h[5].pid,team:st.hid,t0:performance.now()};st.hold=true;pitchFrame(st);out.hold=st.carNow;out.holdLabel=st.carLab.style.display;st.hold=false;pitchFrame(st);out.back=st.carNow===st.h[5];
    pitchMinute(st,M,h,a,[{t:'shot',sub:'off',team:M.h,m:M.m,pid:st.h[9].pid,path:[[60,30],[88,34],[106,45]]}]);out.shot=st.car;out.seq=!!st.seq;pitchFrame(st);out.duringShot=st.carNow;st.seq=null;return out})()`);
  assert.equal(lost.corner,null);assert.equal(lost.hold,null);assert.equal(lost.holdLabel,'none');assert.ok(lost.back);assert.equal(lost.shot,null);assert.ok(lost.seq);assert.equal(lost.duringShot,null);
  // labels of event players are readable at any depth: a constant size on screen, not the token's perspective size
  const lab=run(`(()=>{const st=Bpitch;const d=st.h[3];st.labels[d.pid]=performance.now()+5000;pitchFrame(st);return {fs:+d.lab.getAttribute('font-size'),s:prjS(d.y),want:LAB_FS,shown:d.lab.style.display!=='none'}})()`);
  assert.ok(lab.shown);assert.ok(Math.abs(lab.fs*lab.s-lab.want)<.05,'label size on screen');

  // ---- 3D highlights: the passer has the ball until he plays it, then the shooter; a save names the keeper
  const tl=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('assets/demo3d/event-timeline.js','utf8')).toString('base64'));
  const clip=run(`(()=>{const M=Bstate().live.M,h=club(M.h),a=club(M.a);const snap=Match3D.snapshot(M,h,a);const sh=M.xi[M.h][9].pid,as=M.xi[M.h][7].pid;
    const e={m:20,t:'goal',team:M.h,pid:sh,asst:as,name:'x',path:[[40,30],[65,22],[91,33],[105.5,35]]};
    return {clip:Match3D.adapt(e,0,snap,snap),noAssist:Match3D.adapt({...e,asst:null,t:'shot',sub:'save',gk:M.xi[M.a][0].pid},1,snap,snap),self:Match3D.adapt({...e,asst:sh},2,snap,snap),ghost:Match3D.adapt({...e,asst:987654},3,snap,snap),sh,as,gk:M.xi[M.a][0].pid,short:snap.players.every(p=>typeof p.short==='string'&&p.short.length>0&&p.name.includes(p.short))}})()`);
  assert.ok(clip.short,'every player carries a short name for the tag');assert.equal(clip.clip.assist,clip.as);assert.equal(clip.self.assist,null,'a scorer does not assist himself');assert.equal(clip.ghost.assist,null,'an assist by somebody off the pitch is ignored');
  const hold3=t=>tl.eventFrame(clip.clip,t).holder,SH=3.3;
  assert.equal(hold3(0),null,'before the ball reaches the passer nobody is named');assert.equal(hold3(SH*.5-.2).pid,clip.as);assert.equal(hold3(SH*.5+.3).pid,clip.sh);assert.equal(hold3(SH).pid,clip.sh);assert.equal(hold3(5).pid,clip.sh,'the scorer keeps his name');
  const fp=tl.eventFrame(clip.clip,SH*.5),passer=fp.players.find(p=>p.pid===clip.as);assert.ok(Math.hypot(passer.x-fp.ball.x,passer.z-fp.ball.z)<1.2,'the passer stands where the final pass starts');
  let prev=null;for(let t=0;t<=tl.CLIP_DURATION;t+=.02){const p=tl.eventFrame(clip.clip,t).players.find(p=>p.pid===clip.as);for(const k of ['x','z','angle','speed'])assert.ok(Number.isFinite(p[k]));if(prev)assert.ok(Math.hypot(p.x-prev.x,p.z-prev.z)<.6,'the passer never jumps');prev=p}
  const s3=t=>tl.eventFrame(clip.noAssist,t).holder;assert.equal(s3(.5),null);assert.equal(s3(2).pid,clip.sh);assert.equal(s3(4.3).pid,clip.gk,'the keeper who saved');assert.equal(s3(5.55),null);
  assert.equal(tl.idleFrame(Object.assign({minute:1},{players:clip.clip.players})).holder,null);

  // ---- ratings of both sides after the final whistle
  w.document.querySelector('[data-blive="skip"]').click();
  const dlg=$('.bresult');assert.ok(dlg,'result dialog');const cols=[...dlg.querySelectorAll('.bratings-cols>div')];assert.equal(cols.length,2);
  assert.equal(cols[0].querySelector('h4').textContent,M0.hn,'home side first, like the board');assert.equal(cols[1].querySelector('h4').textContent,M0.an);
  for(const c of cols){const rows=[...c.querySelectorAll('li')];assert.ok(rows.length>=11&&rows.length<=16,'everyone who played, got '+rows.length);for(const r of rows){const v=+r.querySelector('.brate').textContent;assert.ok(v>=3&&v<=10);assert.ok(r.querySelector('span').textContent.trim().length>0)}}
  assert.equal(dlg.querySelectorAll('li.bstar').length,1,'one man of the match');const best=Math.max(...[...dlg.querySelectorAll('.brate')].map(b=>+b.textContent));assert.equal(+dlg.querySelector('li.bstar .brate').textContent,best);
  const rb=dlg.querySelector('.bresult-board');assert.equal(rb.children[0].querySelector('strong').textContent,M0.hn);assert.equal(rb.querySelector('.sd-h').textContent,String(run('Bstate().last.gh')));assert.equal(rb.querySelector('.sd-a').textContent,String(run('Bstate().last.ga')));
  assert.ok(dlg.querySelector('.bresult-foot [data-bclose]'),'the way on is always in view');
  // scorers, assists and cards stand with the score, each side's under its own half of the board
  const facts=run(`(()=>{const M={h:'${M0.h}',a:'${M0.a}',ev:[{t:'goal',team:'${M0.h}',name:'כובש',asstName:'מבשל',m:12},{t:'pen',team:'${M0.a}',name:'בועט',m:30},{t:'own',team:'${M0.h}',name:'מגן',m:44},{t:'yellow',team:'${M0.a}',name:'קשוח',m:50},{t:'red',team:'${M0.h}',name:'מורחק',m:80},{t:'shot',team:'${M0.h}',name:'x',m:81}]};const d=document.createElement('div');d.innerHTML=BmatchFactsHTML(M);return [...d.querySelectorAll('ul')].map(u=>[...u.querySelectorAll('li')].map(li=>li.textContent.replace(/\\s+/g,' ').trim()))})()`);
  assert.equal(facts.length,2);assert.equal(facts[0].length,3);assert.ok(/כובש 12′.*בישול: מבשל/.test(facts[0][0]));assert.ok(/מגן 44′ · שער עצמי/.test(facts[0][1]));assert.ok(/🟥.*מורחק 80′.*כרטיס אדום/.test(facts[0][2]));
  assert.ok(/בועט 30′ · פנדל/.test(facts[1][0]));assert.ok(/🟨.*קשוח 50′.*כרטיס צהוב/.test(facts[1][1]));assert.ok(dlg.querySelector('.bfacts'),'shown with the result');
  // real players only: a career saved with generated free agents loads without them, a real free agent stays
  const fa=run(`(()=>{const gen=makePlayer('FW',70,false,false);const real=G.clubs.find(c=>c.id!==G.me).players[3];G.freeAgents=[{...gen,real:false},{...real,id:uid++}];Bwrite();G=null;Bload();return {n:G.freeAgents.length,invented:G.freeAgents.filter(inventedPlayer).length,label:(Btab='market',Bcategory='free',Bquery='',Bpos='all',Brender(),document.querySelector('#main').textContent.includes('בדוי'))}})()`);
  assert.deepEqual(fa,{n:1,invented:0,label:false});
  w.document.querySelector('.bdialog').remove();

  // ---- the foreign-player limit holds for substitutions too (Israeli clubs): a foreigner may come on only for a foreigner
  const fr=run(`(()=>{Bplay();Bstate().live.paused=true;const M=Bstate().live.M,c=me();const xi=M.xi[c.id].map(e=>c.players.find(p=>p.id===e.pid));
    xi.forEach((p,i)=>{p.foreign=i>0&&i<=MAX_FOREIGN_XI});const b=bench(M,c);b.forEach((p,i)=>{p.foreign=i<2});const isr=xi.find(p=>!p.foreign&&p.pos!=='GK'),fo=xi.find(p=>p.foreign);
    const out={limited:foreignLimited(c),on:foreignOnPitch(M,c),blocked:subBreaksForeign(M,c,isr.id,b[0]),swapOk:!subBreaksForeign(M,c,fo.id,b[0]),localOk:!subBreaksForeign(M,c,isr.id,b[2])};
    out.refused=doSub(M,c,isr.id,b[0].id)===false;out.still=foreignOnPitch(M,c);
    BsubOut=isr.id;BsubIn=undefined;BsubDialog();out.disabled=[...document.querySelectorAll('[data-bsub-in]')].filter(x=>x.disabled).map(x=>+x.dataset.bsubIn);out.want=b.filter(p=>p.foreign).map(p=>p.id);document.querySelector('.bdialog').remove();
    for(let k=0;k<400;k++){const m2=createMatch(c,G.clubs.find(x=>x.id!==c.id),{kind:'friendly'});while(!m2.done)stepMinute(m2);out.max=Math.max(out.max||0,foreignOnPitch(m2,c));if(k>25)break}
    out.accepted=doSub(M,c,fo.id,b[0].id)!==false;out.after=foreignOnPitch(M,c);const eu={country:'אירופה'};out.euro=foreignLimited(eu);return out})()`);
  assert.ok(fr.limited);assert.equal(fr.on,6);assert.ok(fr.blocked,'a seventh foreigner is refused');assert.ok(fr.swapOk);assert.ok(fr.localOk);assert.ok(fr.refused);assert.equal(fr.still,6);
  assert.deepEqual(fr.disabled.sort(),fr.want.sort(),'the dialog shows which substitutes cannot come on');assert.ok(fr.max<=6,'the computer\'s own substitutions keep the limit, got '+fr.max);assert.ok(fr.accepted);assert.equal(fr.after,6);assert.equal(fr.euro,false);
  assert.deepEqual(errors,[]);
  console.log('live picture: score sides, ball carrier and his name (2D), name tag timeline (3D), scorers and cards, ratings of both sides, real free agents only, foreign limit on substitutions passed; errors []');
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>w.close());
