/* ====================== אלוף הפנדלים: penalties only ======================
   A button outside every career: pick a club and take penalties. Three ways to play, all on the penalty overlay of
   36f-penalty.js (the close-up from behind the taker):
     cpu   a shoot-out against the computer: the sight when we kick, the eight arrows when we keep goal (penShootout)
     seat  two people on one phone: the kicker picks one of the eight directions, hands the phone over, the keeper picks
     net   two phones, a room code: the same duel, each player's choice travels over a Supabase Realtime broadcast channel
   A duel kick is decided by pcupResolve(kick direction, dive direction, finisher, keeper, random source): pure, so both
   phones reach the same result from the same seed. Online choices are exchanged commit-first (a hash of direction+nonce,
   then the reveal), so neither side can wait for the other's choice; the seed is made of both nonces.
   Like the quick tournament it runs on a throw-away state: G is swapped for a newGame() state flagged G.pcup, SANDBOX
   blocks every save, pcupClose() restores G and uid. Only the record (PCUP_KEY) is kept. A browser cannot open a
   Bluetooth link to another phone or find one on the same network by itself, so "same room" is the one-phone mode. */
const PCUP_KEY='goalasso_pcup_v1';let PCUP=null;
function pcupRec(){const base={played:0,wins:0,streak:0,best:0,duels:0};try{return Object.assign(base,JSON.parse(localStorage.getItem(PCUP_KEY)||'{}'))}catch(e){return base}}
function pcupSave(r){try{localStorage.setItem(PCUP_KEY,JSON.stringify(r))}catch(e){}}
function pcupEntryHTML(kind){const r=pcupRec();if(kind==='b')return `<section class="bpanel pc-entry pc-entry-b"><div><h2>אלוף הפנדלים</h2><p>רק פנדלים: מול המחשב, שניים על טלפון אחד או מול חבר אונליין.${r.played?` <bdi>${r.wins}</bdi> ניצחונות מ־<bdi>${r.played}</bdi>.`:''}</p></div><button type="button" class="bbtn secondary" data-pcup-open>לפנדלים</button></section>`;return `<div class="card bz-entry pc-entry"><div><h3 class="sec">אלוף הפנדלים</h3><div class="muted small">רק פנדלים: מול המחשב, שניים על טלפון אחד או מול חבר אונליין.${r.played?` <bdi>${r.wins}</bdi> ניצחונות מ־<bdi>${r.played}</bdi>, רצף שיא <bdi>${r.best}</bdi>.`:''}</div></div><button type="button" class="btn" data-pcup-open>שחק</button></div>`}
/* ---- rules of a duel kick ---- */
function pcupRng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
function pcupHash(s){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (h2>>>0).toString(16).padStart(8,'0')+(h1>>>0).toString(16).padStart(8,'0')}
/* the kicker chose an area, the keeper a direction: where the ball really goes (a better finisher scatters less) and how it ends */
function pcupResolve(kd,gd,sk,gk,rnd){const q=clamp((sk-50)/45,0,1),c=PEN_DIRS[kd]||PEN_DIRS.D,g=()=>(rnd()+rnd()+rnd()+rnd()-2)*1.732;
  const x=+(c[0]+g()*(.52-.22*q)).toFixed(2),y=+clamp(c[1]+g()*(.34-.12*q),.1,3).toFixed(2),f=penFrame(x,y),roll=rnd();
  if(f!=='in')return {out:'miss',how:f,x,y};const z=penZone(x,y),d=gd||'D';if(penDirCol(d)!==penDirCol(z))return {out:'goal',how:'goal',x,y};
  const p=clamp([.84,.4,.1][Math.abs(penDirRow(d)-penDirRow(z))]+(gk-70)*.006-(sk-70)*.007,.04,.95);return roll<p?{out:'miss',how:'save',x,y}:{out:'goal',how:'goal',x,y}}
/* ---- the throw-away state ---- */
function pcupTeams(){if(PCUP&&PCUP.teams)return PCUP.teams;const out=G.clubs.map(c=>({key:'i:'+c.id,name:c.name,short:c.short||c.name,c1:c.c1,c2:c.c2,str:Math.round(strength(c))}));
  try{for(const d of blitzClubDefs().slice().sort((a,b)=>b[6]-a[6]).slice(0,24))out.push({key:'e:'+d[0],name:d[0],short:d[0],c1:d[4],c2:d[5],str:Math.round(d[6])})}catch(e){}if(PCUP)PCUP.teams=out;return out}
/* one club object per key; twin = the same club a second time (both players chose it), under its own id */
function pcupClub(key,twin){key=String(key||'');const ck=key+(twin?'#2':'');const cache=PCUP.clubs||(PCUP.clubs={});if(cache[ck])return cache[ck];let c=null;
  if(key.slice(0,2)==='i:'){c=G.clubs.find(x=>x.id===key.slice(2))||null;if(c&&twin){c=JSON.parse(JSON.stringify(c));c.id+='_2';G.pseudo[c.id]=c}}
  else if(key.slice(0,2)==='e:'){const d=blitzClubDefs().find(x=>x[0]===key.slice(2));c=d?clubFromDef(d,'b'):null}
  if(c)cache[ck]=c;return c}
/* the five who kick (best finishers of the best eleven first) and the keeper; oi/gi = their places in the squad list, which is the same on every phone */
function pcupSide(c){const xi=bestXI(c);const ord=xi.filter(p=>p.pos!=='GK').sort((p,q)=>penShootSkill(q)-penShootSkill(p));const gk=xi.find(p=>p.pos==='GK')||c.players.find(p=>p.pos==='GK')||null;
  return {c,ord,gk,sk:ord.map(p=>Math.round(penShootSkill(p))),gkS:Math.round(penKeepSkill(gk)),oi:ord.map(p=>c.players.indexOf(p)),gi:c.players.indexOf(gk)}}
function pcupSideFrom(c,d){const mine=pcupSide(c);if(!d||!Array.isArray(d.sk)||!Array.isArray(d.oi))return mine;const ord=d.oi.map(i=>c.players[i]).filter(Boolean);if(ord.length===d.sk.length&&ord.length){mine.ord=ord;mine.gk=c.players[d.gi]||mine.gk}
  mine.sk=mine.ord.map((p,i)=>clamp(+d.sk[i]||70,30,99));mine.gkS=clamp(+d.gk||70,30,99);return mine}
function pcupMatch(a,b){a.lineup=autoLineupFor(a);G.me=a.id;return createMatch(a,b,{kind:'friendly',neutral:true,ko:true,label:'אלוף הפנדלים'})}
function pcupOpen(){if(PCUP)return;if(typeof BLITZ!=='undefined'&&BLITZ)return toast('סיים קודם את טורניר הבזק');if(G&&((G.live&&!G.live.settled)||(G.beginner&&G.beginner.live)))return toast('סיים קודם את המשחק הפעיל');if(G&&G.mp&&typeof mpIsOn==='function'&&mpIsOn())return toast('אלוף הפנדלים לא זמין בזמן משחק רשת');
  const keep={G,uid,sandbox:SANDBOX};const go=()=>{SANDBOX=true;try{newGame(Object.keys(META)[0],'')}catch(e){G=keep.G;uid=keep.uid;SANDBOX=keep.sandbox;console.warn('pcup',e);return toast('לא הצלחנו לפתוח את אלוף הפנדלים')}
    const src=keep.G||{};Object.assign(G,{pcup:true,phase:'play',sound:src.sound,vol:src.vol,motion:src.motion,haptic:src.haptic,pen3d:src.pen3d,penGame:true,paperPopOff:true,paperPop:[]});
    PCUP={keep,stage:'team',my:null,net:null};const root=document.createElement('div');root.id='pcup';root.className='pcup';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','אלוף הפנדלים');document.body.appendChild(root);
    root.addEventListener('click',pcupClick);root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!PG)pcupClose()});try{hideSplash()}catch(e){}const code=pcupLinkCode();if(code){PCUP.join=code}pcupPaint()};
  if(keep.G&&!keep.G.beginner&&typeof save==='function'&&!SANDBOX)return Promise.resolve(save()).then(go,go);go()}
function pcupClose(){if(!PCUP)return;const P=PCUP;try{penClose()}catch(e){}pcupNetStop();const r=document.getElementById('pcup');if(r)r.remove();G=P.keep.G;uid=P.keep.uid;SANDBOX=P.keep.sandbox;PCUP=null;
  try{render()}catch(e){document.querySelectorAll('.pc-entry').forEach(el=>{el.outerHTML=pcupEntryHTML()})}}
/* the penalty overlay has no way out in a career; here every picture gets one */
function pcupExitBtn(onExit){const top=PG&&PG.root.querySelector('.pg-top');if(!top)return;const b=document.createElement('button');b.type='button';b.className='pc-quit';b.textContent='יציאה';b.onclick=()=>{onExit&&onExit();penClose();if(PCUP){PCUP.stage='mode';pcupPaint()}};top.appendChild(b)}
/* ---- screens ---- */
function pcupPaint(){const root=document.getElementById('pcup');if(!root||!PCUP)return;const P=PCUP,r=pcupRec(),T=pcupTeams();const grid=attr=>`<div class="pc-grid">${T.map(t=>`<button type="button" class="pc-team" ${attr}="${esc(t.key)}">${kitSVG(t,'lg')}<strong>${esc(t.name)}</strong></button>`).join('')}</div>`;
  let body='';
  if(P.stage==='team')body=`<h2>בחר קבוצה</h2>${P.join?`<p class="pc-note">הוזמנת לדו־קרב <bdi dir="ltr">${esc(P.join)}</bdi>. בחר קבוצה ונכנסים.</p>`:''}${grid('data-pc-team')}`;
  else if(P.stage==='mode')body=`<div class="pc-mine">${kitSVG(P.my,'lg')}<div><strong>${esc(P.my.name)}</strong><button type="button" class="pc-link" data-pc-go="team">החלף קבוצה</button></div></div>
    <button type="button" class="pc-mode" data-pc-mode="cpu"><b>אימון מול המחשב</b><small>דו־קרב של חמש בעיטות לכל צד. אתה בועט, ואתה גם בשער.</small></button>
    <button type="button" class="pc-mode" data-pc-mode="seat"><b>שניים על טלפון אחד</b><small>אחד בועט, מעביר את הטלפון, והשני בשער. עובד בלי אינטרנט.</small></button>
    <button type="button" class="pc-mode" data-pc-mode="net"><b>אונליין מול חבר</b><small>פותחים חדר, שולחים קוד, וכל אחד משחק מהטלפון שלו.</small></button>
    <p class="pc-note">משחק דרך בלוטות׳ או חיפוש טלפון באותה רשת לא אפשריים בדפדפן. באותו חדר משחקים על טלפון אחד, ובכל מקום אחר עם קוד.</p>`;
  else if(P.stage==='seat')body=`<h2>מי היריבה?</h2><p class="pc-note">${esc(P.my.name)} של השחקן הראשון. בחר את הקבוצה של השחקן השני.</p>${grid('data-pc-opp')}<button type="button" class="pc-link" data-pc-go="mode">חזרה</button>`;
  else if(P.stage==='net'){const n=P.net||{};body=`<h2>אונליין מול חבר</h2>${n.err?`<p class="pc-err" role="alert">${esc(n.err)}</p>`:''}
    ${n.code&&n.host?`<p class="pc-note">שלח לחבר את הקוד. המשחק מתחיל כשהוא נכנס.</p><div class="pc-code" dir="ltr">${esc(n.code)}</div><button type="button" class="btn" data-pc-share>שתף קישור</button><p class="pc-wait" role="status">${n.state==='open'?'ממתין לחבר…':'מתחבר…'}</p>`
     :n.code?`<p class="pc-wait" role="status">מתחבר לחדר <bdi dir="ltr">${esc(n.code)}</bdi>…</p>`
     :`<button type="button" class="pc-mode" data-pc-net="host"><b>פתח חדר</b><small>תקבל קוד לשלוח לחבר.</small></button><form class="pc-join" data-pc-joinform><label for="pcCode">יש לך קוד?</label><div><input id="pcCode" inputmode="latin" autocapitalize="characters" autocomplete="off" maxlength="6" dir="ltr" placeholder="ABC123" value="${esc(P.join||'')}"><button type="submit" class="btn">הצטרף</button></div></form>`}
    <button type="button" class="pc-link" data-pc-go="mode">חזרה</button>`}
  root.innerHTML=`<header class="pc-top"><button type="button" class="pc-x" data-pc-x aria-label="סגור">×</button><h1>אלוף הפנדלים</h1><p>${r.played?`<bdi>${r.wins}</bdi> ניצחונות מ־<bdi>${r.played}</bdi> · רצף <bdi>${r.streak}</bdi> · שיא <bdi>${r.best}</bdi>`:'רק אתה, הכדור והשוער.'}</p></header><div class="pc-body">${body}</div>`}
function pcupClick(e){const P=PCUP;if(!P)return;const t=e.target.closest('button,[data-pc-team],[data-pc-opp]');if(!t)return;
  if(t.dataset.pcX!=null)return pcupClose();if(t.dataset.pcGo){pcupNetStop();P.stage=t.dataset.pcGo;return pcupPaint()}
  if(t.dataset.pcTeam){P.my=pcupTeams().find(x=>x.key===t.dataset.pcTeam);if(P.join){P.stage='net';pcupPaint();return pcupNetStart(false,P.join)}P.stage='mode';return pcupPaint()}
  if(t.dataset.pcMode==='cpu')return pcupCpu();if(t.dataset.pcMode==='seat'){P.stage='seat';return pcupPaint()}if(t.dataset.pcMode==='net'){P.stage='net';P.net=null;return pcupPaint()}
  if(t.dataset.pcOpp)return pcupSeat(t.dataset.pcOpp);if(t.dataset.pcNet==='host')return pcupNetStart(true,pcupNewCode());
  if(t.dataset.pcShare!=null){const u=new URL(location.href);u.search='';u.searchParams.set('pen',P.net.code);const url=u.href;if(navigator.share)navigator.share({title:'אלוף הפנדלים',text:'דו־קרב פנדלים: '+P.net.code,url}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>toast('הקישור הועתק'),()=>{});return}}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-pcup-open]')){e.preventDefault();pcupOpen()}});
document.addEventListener('submit',e=>{if(PCUP&&e.target.matches&&e.target.matches('[data-pc-joinform]')){e.preventDefault();const v=(e.target.querySelector('input').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(v.length<4)return toast('הקוד קצר מדי');pcupNetStart(false,v)}});
function pcupResult(won,line){const r=pcupRec();r.played++;if(won){r.wins++;r.streak++;r.best=Math.max(r.best,r.streak)}else r.streak=0;pcupSave(r);if(PCUP){PCUP.stage='mode';pcupPaint()}}
/* ---- against the computer: the shoot-out of the full game ---- */
function pcupCpu(){const P=PCUP,a=pcupClub(P.my.key);const pool=pcupTeams().filter(t=>t.key!==P.my.key);const near=pool.filter(t=>Math.abs(t.str-P.my.str)<=5);const b=pcupClub(pick(near.length?near:pool).key);if(!a||!b)return toast('לא הצלחנו לבנות את הקבוצות');
  const M=pcupMatch(a,b);penShootout(M,a,b,res=>{pcupResult(res.win==='h')});pcupExitBtn()}
/* ---- a duel between two people ----
   D: {A,B: pcupSide + owner label, first:'a'|'b', choose(k,side,ctx) → Promise<{kd,gd,seed}>, mine: 'a'|'b'|null (which side this phone plays), end(win)} */
function pcupDuel(D){const A=D.A,B=D.B;const root=penOverlay({title:'אלוף הפנדלים',meta:`<bdi>${esc(A.c.short||A.c.name)}</bdi> נגד <bdi>${esc(B.c.short||B.c.name)}</bdi>`});const pg=PG;const S={a:[],b:[]};let side=D.first,k=0,over=false;PCUP.duel={S,stop:()=>{over=true}};
  const sum=x=>x.reduce((t,v)=>t+v,0);const dots=key=>{const n=Math.max(5,S[key].length+(S.a.length+S.b.length>=10&&S.a.length===S.b.length?1:0));let o='';for(let i=0;i<n;i++)o+=`<i class="${S[key][i]==null?'':S[key][i]?'in':'no'}"></i>`;return o};
  const paint=()=>{const el=root.querySelector('#pgSo');if(el)el.innerHTML=`<div class="pg-so-row${side==='a'?' on':''}"><b>${esc(A.c.short||A.c.name)}</b><span>${dots('a')}</span><strong>${sum(S.a)}</strong></div><div class="pg-so-row${side==='b'?' on':''}"><b>${esc(B.c.short||B.c.name)}</b><span>${dots('b')}</span><strong>${sum(S.b)}</strong></div>`};
  const alive=()=>!over&&PG===pg&&!!PCUP;
  const finish=(win,why)=>{if(!alive())return;over=true;const won=D.mine?win===D.mine:null;const W=win==='a'?A:B;
    penPanel(`<div class="pg-end ${why?'':won===false?'bad':'good'}"><small>אלוף הפנדלים</small><h2${why?' style="font-size:34px;line-height:1.1"':''}>${why?esc(why):won==null?esc(W.c.short||W.c.name)+' ניצחה':won?'ניצחת!':'הפסדת'}</h2><div class="pg-endsc"><bdi>${esc(A.c.short||A.c.name)}</bdi> <b dir="ltr">${sum(S.a)}:${sum(S.b)}</b> <bdi>${esc(B.c.short||B.c.name)}</bdi></div><button type="button" class="btn big" id="pgDone">המשך</button></div>`);
    root.querySelector('#pgBot').innerHTML='';side=null;paint();if(won!==false&&!why){try{SFX.win()}catch(e){}confetti(2200);buzz('win')}
    root.querySelector('#pgDone').onclick=()=>{penClose();D.end(win,won,!!why)}};
  D.abort=why=>finish(sum(S.a)>=sum(S.b)?'a':'b',why);
  const next=()=>{if(!alive())return;const w=penShootoutDone(S.a,S.b);if(w)return finish(w==='h'?'a':'b');paint();const T=side==='a'?A:B,O=side==='a'?B:A,i=S[side].length%Math.max(1,T.ord.length),tk=T.ord[i];
    const host=penClear(),view=root.querySelector('#pgView'),bot=root.querySelector('#pgBot');host.insertAdjacentHTML('beforeend','<div class="pg-load">השופט מניח את הכדור על הנקודה…</div>');
    bot.innerHTML=`<div class="pg-who">${penFaceHTML(tk,T.c,'pc'+tk.id)}<div><b>${esc(fullName(tk))}</b><small>בועט עבור ${esc(T.c.short||T.c.name)} · בשער ${esc(O.gk?fullName(O.gk):'השוער')}</small></div></div><div class="pg-hint" id="pgHint"></div><div class="pg-timer" aria-hidden="true"><i id="pgTime"></i></div>`;
    const kickNo=k++;penMakeStage(view,'kick',{...penKits(T.c,O.c,A.c.id),number:tk.no||9}).then(st=>{if(!alive()||!host.isConnected){try{st.kind==='2d'&&st.dispose()}catch(e){}return}
      PG.stage=st;const ld=host.querySelector('.pg-load');if(ld)ld.remove();
      D.choose(kickNo,side,{host,st,root,taker:tk,T,O,alive}).then(c=>{if(!alive()||!c)return;host.querySelectorAll('.pc-turn').forEach(x=>x.remove());const r=pcupResolve(c.kd,c.gd,T.sk[i]==null?70:T.sk[i],O.gkS,pcupRng(c.seed));try{SFX.whistle()}catch(e){}buzz('kick');
        st.shoot({x:r.x,y:r.y,how:r.how,dive:c.gd||'C'},penOnce(()=>{if(!alive())return;const mode=D.mine?(D.mine===side?'kick':'keep'):'kick';const fl=penFlash(host,mode,r.how);S[side].push(r.out==='goal'?1:0);side=side==='a'?'b':'a';paint();setTimeout(()=>{fl.remove();next()},penQuick()?0:1300)},penQuick()?0:3400))})})};
  pcupExitBtn(()=>{over=true;D.quit&&D.quit()});penPreload();paint();next();return D}
/* eight arrows over the stage; resolves with the direction tapped, or with fallback() when the time is up */
function pcupAsk(ctx,o){return new Promise(res=>{const {host,st,root}=ctx;const hint=root.querySelector('#pgHint'),tEl=root.querySelector('#pgTime');if(hint)hint.textContent=o.label;const turn=document.createElement('div');turn.className='pc-turn';turn.setAttribute('role','status');turn.textContent=o.label;host.appendChild(turn);let done=false,raf=0;const ck=penClock(performance.now());
  const ARW={U:0,UR:45,R:90,DR:135,D:180,DL:225,L:270,UL:315};const pad=document.createElement('div');pad.className='pg-dirs';pad.innerHTML=Object.keys(PEN_ARROW).map(d=>`<button type="button" data-dir="${d}" aria-label="${d}"><svg viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(${ARW[d]}deg)"><path d="M12 5l7 8h-4.4v6h-5.2v-6H5z"/></svg></button>`).join('');host.appendChild(pad);
  const fin=d=>{if(done)return;done=true;cancelAnimationFrame(raf);pad.remove();if(o.after)turn.textContent=o.after;else turn.remove();if(tEl)tEl.style.transform='scaleX(0)';if(hint)hint.textContent=o.after||'';res(d)};PCUP.pick=d=>fin(d);
  pad.addEventListener('click',e=>{const b=e.target.closest('[data-dir]');if(b){buzz('tap');fin(b.dataset.dir)}});
  (function loop(){if(done)return;if(!ctx.alive()){done=true;pad.remove();turn.remove();return res(null)}const left=1-ck.tick(performance.now())/(o.ms||12000);if(tEl)tEl.style.transform=`scaleX(${Math.max(0,left).toFixed(3)})`;for(const b of pad.children){const c=PEN_ARROW[b.dataset.dir];const [px,py]=st.toScreen(c[0],c[1]);b.style.transform=`translate(${px.toFixed(1)}px,${py.toFixed(1)}px)`}if(left<=0)return fin(o.fallback());raf=requestAnimationFrame(loop)})()})}
const pcupAnyDir=()=>pick(Object.keys(PEN_DIRS));
/* one phone: a curtain before each choice so the other player does not see it */
function pcupSeat(oppKey){const P=PCUP,a=pcupClub(P.my.key),b=pcupClub(oppKey,oppKey===P.my.key);if(!a||!b)return toast('לא הצלחנו לבנות את הקבוצות');G.me=a.id;const A=pcupSide(a),B=pcupSide(b);
  const curtain=(ctx,who,what)=>new Promise(res=>{const d=document.createElement('div');d.className='pg-panel pc-curtain';d.innerHTML=`<div class="pg-end"><small>${esc(what)}</small><h2>${esc(who)}</h2><p>רק מי שתורו מסתכל על המסך.</p><button type="button" class="btn big" id="pcReady">אני מוכן</button></div>`;ctx.host.appendChild(d);PCUP.ready=()=>{d.remove();res()};d.querySelector('#pcReady').onclick=PCUP.ready});
  pcupDuel({A,B,first:Math.random()<.5?'a':'b',mine:null,end:()=>{const r=pcupRec();r.duels++;pcupSave(r);if(PCUP){PCUP.stage='mode';pcupPaint()}},
    choose:async(k,side,ctx)=>{const T=ctx.T,O=ctx.O;await curtain(ctx,'הבועט: '+(T.c.short||T.c.name),'העבר את הטלפון לבועט');if(!ctx.alive())return null;const kd=await pcupAsk(ctx,{label:'בחר לאן לבעוט',after:'',fallback:pcupAnyDir});if(kd==null||!ctx.alive())return null;
      await curtain(ctx,'השוער: '+(O.c.short||O.c.name),'העבר את הטלפון לשוער');if(!ctx.alive())return null;const gd=await pcupAsk(ctx,{label:'בחר לאן לזנק',after:'',fallback:()=>'D'});if(gd==null)return null;return {kd,gd,seed:(Math.random()*4294967296)>>>0}}})}
/* ---- two phones ----
   Messages (all carry v:1): guest → hi{team}; host → start{a,b,first} (keys and the skills both phones must use);
   every kick: c{k,h} (commit), then r{k,d,n} (reveal) once the other side's commit is in. Unanswered messages are sent again. */
function pcupNewCode(){const abc='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=abc[Math.floor(Math.random()*abc.length)];return s}
function pcupLinkCode(){try{const c=new URLSearchParams(location.search).get('pen');return c?c.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6):''}catch(e){return ''}}
async function pcupChannel(code,onMsg){if(window.__pcupNet)return window.__pcupNet(code,onMsg);const cl=await mpClient();const ch=cl.channel('pcup:'+code,{config:{broadcast:{self:false}}});ch.on('broadcast',{event:'m'},e=>onMsg(e.payload));
  await new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('timeout')),12000);ch.subscribe(st=>{if(st==='SUBSCRIBED'){clearTimeout(t);res()}else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'){clearTimeout(t);rej(new Error(st))}})});
  return {send:p=>{try{ch.send({type:'broadcast',event:'m',payload:p})}catch(e){}},close:()=>{try{cl.removeChannel(ch)}catch(e){}}}}
function pcupNetStop(){const n=PCUP&&PCUP.net;if(!n)return;clearInterval(n.tick);try{n.ch&&n.send({t:'bye'})}catch(e){}try{n.ch&&n.ch.close()}catch(e){}PCUP.net=null}
function pcupNetStart(host,code){const P=PCUP;pcupNetStop();const n=P.net={host,code,state:'connecting',kicks:{},last:Date.now(),id:pcupHash(String(Math.random())+Date.now()).slice(0,10),peer:null};P.join='';P.stage='net';pcupPaint();
  n.send=m=>{if(n.ch)n.ch.send(Object.assign({v:1,f:n.id},m))};
  const fail=msg=>{if(PCUP!==P||P.net!==n)return;clearInterval(n.tick);try{n.ch&&n.ch.close()}catch(e){}n.ch=null;if(n.duel){P.net=null;return n.duel.abort(msg)}P.net={err:msg};pcupPaint()};
  const kickOf=k=>n.kicks[k]||(n.kicks[k]={});const wire=S=>({key:S.key,sk:S.sk,gk:S.gkS,oi:S.oi,gi:S.gi});
  const onMsg=m=>{if(PCUP!==P||P.net!==n||!m||m.v!==1||!m.f||m.f===n.id)return;
    if(m.t==='hi'&&host){if(n.peer&&m.f!==n.peer)return n.send({t:'full',to:m.f});n.last=Date.now();if(n.start)return n.send(n.start);
      const key=String(m.team||''),mine=pcupClub(P.my.key),theirs=pcupClub(key,key===P.my.key);if(!mine||!theirs)return n.send({t:'full',to:m.f,why:'team'});
      n.peer=m.f;G.me=mine.id;const A=pcupSide(mine),B=pcupSide(theirs);A.key=P.my.key;B.key=key;n.start={t:'start',to:m.f,a:wire(A),b:wire(B),first:Math.random()<.5?'a':'b'};n.send(n.start);return begin(A,B,n.start.first,'a')}
    if(m.t==='full'&&!host&&m.to===n.id&&!n.duel)return fail(m.why==='team'?'הגרסאות של שני הטלפונים שונות. עדכנו את המשחק ונסו שוב.':'החדר הזה כבר מלא');
    if(m.t==='start'&&!host){if(m.to!==n.id||n.duel||!m.a||!m.b)return;const ca=pcupClub(m.a.key),cb=pcupClub(m.b.key,m.a.key===m.b.key);if(!ca||!cb)return fail('הגרסאות של שני הטלפונים שונות. עדכנו את המשחק ונסו שוב.');
      n.peer=m.f;n.last=Date.now();G.me=cb.id;return begin(pcupSideFrom(ca,m.a),pcupSideFrom(cb,m.b),m.first==='b'?'b':'a','b')}
    if(m.f!==n.peer)return;n.last=Date.now();
    if(m.t==='bye')return fail('היריב עזב את המשחק');
    if(m.t==='c'){const K=kickOf(+m.k);if(!K.theirH)K.theirH=String(m.h);return step(+m.k)}
    if(m.t==='r'){const K=kickOf(+m.k);if(!K.their&&K.theirH){if(!PEN_DIRS[m.d]||pcupHash(m.d+':'+m.n)!==K.theirH)return fail('הנתונים מהטלפון השני לא תואמים. המשחק הופסק.');K.their={d:m.d,n:String(m.n)}}return step(+m.k)}};
  /* a kick moves on as far as it can: my reveal goes out once the other commit is in, the result once both reveals are known */
  const step=k=>{const K=kickOf(k);if(!K.mine)return;if(K.theirH&&!K.sentR){K.sentR=true;n.send({t:'r',k,d:K.mine.d,n:K.mine.n})}
    if(K.their&&K.sentR&&K.res){const km=K.kickerMine,res=K.res;K.res=null;const kd=km?K.mine.d:K.their.d,gd=km?K.their.d:K.mine.d,nk=km?K.mine.n:K.their.n,ng=km?K.their.n:K.mine.n;res({kd,gd,seed:parseInt(pcupHash(nk+'|'+ng+'|'+k).slice(0,8),16)})}};
  const begin=(A,B,first,mine)=>{n.state='play';n.duel=pcupDuel({A,B,first,mine,quit:()=>pcupNetStop(),end:(win,won,aborted)=>{pcupNetStop();if(!aborted&&won!=null)pcupResult(won);else if(PCUP){PCUP.stage='mode';pcupPaint()}},
    choose:async(k,side,ctx)=>{const km=side===mine;const d=await pcupAsk(ctx,{label:km?'אתה בועט: בחר לאן':'אתה בשער: בחר לאן לזנק',after:'ממתין ליריב…',fallback:km?pcupAnyDir:()=>'D'});if(d==null||!ctx.alive()||P.net!==n)return null;
      const K=kickOf(k);K.mine={d,n:pcupHash(String(Math.random())+Date.now()+k)};K.kickerMine=km;n.send({t:'c',k,h:pcupHash(d+':'+K.mine.n)});return new Promise(res=>{K.res=res;step(k)})}})};
  pcupChannel(code,onMsg).then(ch=>{if(PCUP!==P||P.net!==n){try{ch.close()}catch(e){}return}n.ch=ch;n.state='open';n.last=Date.now();pcupPaint();
    n.tick=setInterval(()=>{if(PCUP!==P||P.net!==n)return clearInterval(n.tick);if(!n.duel){if(!host)n.send({t:'hi',team:P.my.key});else if(Date.now()-n.last>600000)fail('אף אחד לא הצטרף לחדר');return}
      if(Date.now()-n.last>30000)return fail('אין תשובה מהיריב. בדקו את החיבור ונסו שוב.');let sent=false;const ks=Object.keys(n.kicks).map(Number).sort((a,b)=>b-a);
      /* say again whatever the other phone may have missed: the open kick, and the reveal of the kick before it */
      for(const k of ks.slice(0,2)){const K=n.kicks[k];if(!K.mine)continue;sent=true;if(K.res)n.send({t:'c',k,h:pcupHash(K.mine.d+':'+K.mine.n)});if(K.sentR)n.send({t:'r',k,d:K.mine.d,n:K.mine.n})}
      if(!sent)n.send({t:'p'})},1200);
    if(!host)n.send({t:'hi',team:P.my.key})},e=>{console.warn('pcup net',e);fail(typeof mpAvailable==='function'&&!mpAvailable()&&!window.__pcupNet?'משחק אונליין לא מוגדר בגרסה הזו':navigator.onLine===false?'אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.':'שירות המשחק ברשת לא זמין כרגע. בינתיים אפשר לשחק שניים על טלפון אחד.')})}
/* opened from a shared link (?pen=CODE): straight to the team choice of that duel */
function pcupFromLink(){if(!pcupLinkCode()||PCUP)return;const go=()=>setTimeout(()=>{try{pcupOpen()}catch(e){console.warn(e)}},400);const rd=window.ILM&&window.ILM.ready;   /* the full game loads its career first: the lobby must keep the real one */
  if(rd&&rd.then)rd.then(go,go);else go()}
