/* ====================== SETTLEMENT ====================== */
function settle(M){if(G&&(M.h===G.me||M.a===G.me)){const mc=me();if(mc)mc.prepLeft=0}
  const h=club(M.h),a=club(M.a);const ctx=M.ctx;const mine=h.id===G.me||a.id===G.me;
  const R=M.ratings||matchRatings(M,h,a);
  for(const c of [h,a]){const played=new Set([...M.xi[c.id].map(e=>e.pid),...M.used[c.id]]);c.players.forEach(p=>{if(played.has(p.id)){p.apps++;const s=R[p.id];if(s)p.sharp=clamp((p.sharp??70)+(s.min>=60?14:s.min>=20?8:3),0,100);if(s){p.mins=(p.mins||0)+s.min;p.shots=(p.shots||0)+s.sh;p.sot=(p.sot||0)+s.sot;p.assists=(p.assists||0)+s.a;p.passes=(p.passes||0)+s.ps;p.saves=(p.saves||0)+s.sv;p.cs=(p.cs||0)+(s.cs||0);p.xg=+((p.xg||0)+s.xg).toFixed(2);if(s.min>=10){p.rsum=+((p.rsum||0)+s.r).toFixed(1);p.rn=(p.rn||0)+1}if(ctx.kind!=='friendly'){p.cmins=(p.cmins||0)+s.min;p.capps=(p.capps||0)+1;p.cassists=(p.cassists||0)+s.a}}}});}
  for(const e of M.ev){if(e.t==='goal'||e.t==='pen'){const p=club(e.team).players.find(x=>x.id===e.pid);if(p){p.goals++;if(ctx.kind!=='friendly')p.career=(p.career||0)+1}}
    if(e.t==='yellow'&&ctx.kind==='league'){const p=club(e.team).players.find(x=>x.id===e.pid);if(p){p.yellow++;if(p.yellow%3===0){p.susp=Math.max(p.susp,1);e.ban=true}}}
    if(e.t==='red'){const p=club(e.team).players.find(x=>x.id===e.pid);if(p)p.susp=Math.max(p.susp,ctx.kind==='league'?2:1)}}
  const formUpd=(c,f,ag)=>c.players.forEach(p=>p.form=clamp(p.form+(f>ag?.35:f===ag?0:-.35)+rnd(-.4,.4),-4,4));
  formUpd(h,M.gh,M.ga);formUpd(a,M.ga,M.gh);
  M.motm=M.motmLive||manOfMatch(M,h,a);if(M.motm){const mp=club(M.motm.team).players.find(x=>x.id===M.motm.pid);if(mp)mp.motm=(mp.motm||0)+1}
  matchFatigue(M);fansUpdate(h,M.gh,M.ga,a,ctx.kind,ctx.stage,true);fansUpdate(a,M.ga,M.gh,h,ctx.kind,ctx.stage,false);
  moraleAfterMatch(M,h,M.gh,M.ga);moraleAfterMatch(M,a,M.ga,M.gh);
  const rec={wk:G.wk,season:G.season,kind:ctx.kind,label:ctx.label,h:h.id,a:a.id,hn:h.short,an:a.short,gh:M.gh,ga:M.ga,pens:M.pens,att:M.att,motm:M.motm,ev:mine?M.ev.map(e=>({...e})):M.ev.filter(e=>e.t==='goal'||e.t==='pen'||e.t==='own'||e.t==='red').map(e=>({m:e.m,t:e.t,team:e.team,pid:e.pid,name:e.name}))};
  if(mine){rec.plan=M.plan||null;rec.oppSwitch=M.oppSwitch||null;rec.anConf=M.anConf||null;rec.shots={[h.id]:M.shots[h.id],[a.id]:M.shots[a.id]};rec.sot=M.sot;rec.corners=M.corners;rec.poss={[h.id]:M.poss[h.id],[a.id]:M.poss[a.id]};rec.passes=M.passes;rec.pm=M.pm;rec.seed=M.seed;rec.xi={[h.id]:M.xi[h.id].map(e=>e.pid).concat(M.used[h.id]),[a.id]:M.xi[a.id].map(e=>e.pid).concat(M.used[a.id])};rec.ps={};for(const c of [h,a]){rec.ps[c.id]={};for(const pid in R){if(c.players.some(p=>p.id==pid)){const s=R[pid];rec.ps[c.id][pid]={min:s.min,g:s.g,a:s.a,sh:s.sh,sot:s.sot,sv:s.sv,ps:s.ps,cs:s.cs||0,r:s.r,xg:+s.xg.toFixed(2),pos:(c.players.find(p=>p.id==pid)||{}).pos,name:fullName(c.players.find(p=>p.id==pid))}}}}}
  // gate income from the real attendance
  if(h.league&&!ctx.neutral&&ctx.kind!=='friendly'){const price=(h.ticket||baseTicket(h))*(ctx.kind==='euro'?1.5:1);const inc=Math.round(M.att*price);h.money+=inc;rec.income=inc;if(h.id===G.me)addLog(`הכנסות כרטיסים (${M.att.toLocaleString('he')} צופים)`,inc);
    if(!h.attRecord||M.att>h.attRecord.n){const first=!h.attRecord;h.attRecord={n:M.att,opp:a.short,wk:G.wk,season:G.season};if(h.id===G.me&&!first&&M.att>=h.cap*.9)paper('קהל',`שיא קהל ב${h.stadium}: ${M.att.toLocaleString('he')} צופים`,`${h.short} מול ${a.short}, ${ctx.label}`,`היציעים היו מלאים${M.att>=h.cap*.98?' עד אפס מקום':''}. ${pick(['ההנהלה שוקלת להרחיב את האצטדיון.','המכירה המוקדמת הסתיימה כבר באמצע השבוע.','האווירה הייתה חשמלית.'])} ההכנסה מהמשחק: ${NIS(inc)}.`,h.id)}}
  if(ctx.kind==='friendly'){const inc=Math.round(h.cap*.2*40);if(h.league){h.money+=inc;if(h.id===G.me)addLog('הכנסות ממשחק ידידות',inc)}}
  if(ctx.kind==='league'){
    const upd=(c,f,ag)=>{c.P++;c.GF+=f;c.GA+=ag;if(f>ag){c.W++;c.pts+=3}else if(f===ag){c.D++;c.pts++}else c.L++};
    upd(h,M.gh,M.ga);upd(a,M.ga,M.gh);
    for(const c of [h,a])c.players.forEach(p=>{if(p.susp>0&&!M.xi[c.id].some(e=>e.pid===p.id)&&!M.used[c.id].includes(p.id))p.susp--});
  }
  if(ctx.kind==='cup')settleCup(M,h,a,rec);
  if(ctx.kind==='toto')settleToto(M,h,a,rec);
  if(ctx.kind==='euro')settleEuro(M,h,a,rec);
  G.results.push(rec);
  if(mine){try{chemAfterMatch(M,club(G.me),R);storyOnMatch(M)}catch(e){}boardAfterMatch(M,h,a);resultStory(M,h,a);try{adBonuses(M,h,a)}catch(e){}}
  return rec;
}
function gateIncome(h,a,kind){
  const pos=standings().findIndex(x=>x.id===h.id);
  let fill=(h.tier===1?.42:h.tier===2?.35:.3)+(13-pos)/50+(a.tier===1?.14:0)+(a.pseudo?.1:0)+rnd(-.07,.07);
  let ticket=h.ticket;
  if(kind==='euro'){fill+=.25;ticket*=1.6}if(kind==='cup'){fill-=.08}
  const cap=effectiveCap(h);
  return Math.round(cap*clamp(fill,.15,1)*ticket);
}
function effectiveCap(c){return c.build&&c.build.type==='stadium'?Math.round(c.cap*.7):c.cap}
function boardAfterMatch(M,h,a){
  const mineHome=h.id===G.me;const my=mineHome?h:a,opp=mineHome?a:h;const gf=mineHome?M.gh:M.ga,ga=mineHome?M.ga:M.gh;
  const stronger=strength(opp)>strength(my)+2;let d=0;
  if(M.ctx.kind==='friendly')d=0;
  else if(gf>ga)d=stronger?3:2;else if(gf===ga)d=stronger?1:-1;else d=stronger?-1:-2;
  if(M.ctx.kind==='euro'&&gf>ga)d+=1;
  if(M.ctx.kind==='cup'&&gf<ga)d-=1;
  G.board.conf=clamp(G.board.conf+d,0,100);
}

