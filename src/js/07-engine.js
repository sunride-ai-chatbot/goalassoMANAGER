/* ====================== MATCH ENGINE (minute by minute) ====================== */
/* a club run by a person: the user, or (on the multiplayer host while it simulates a week) the other human's club */
function isHumanClub(id){return id===G.me||!!(typeof MP!=='undefined'&&MP.capture&&MP.capture.has(id))}
function createMatch(h,a,ctx){
  const mk=c=>isHumanClub(c.id)?fixedLineup(c).map(e=>({pid:e.pid,slot:e.slot,since:0,yel:0})):bestXI(c).map(p=>({pid:p.id,slot:p.pos,since:0,yel:0}));
  const att=(h.league&&!ctx.neutral&&ctx.kind!=='friendly')?attendanceFor(h,a,ctx.kind,ctx.stage):(ctx.neutral?Math.round(28000*rnd(.7,1)):0);
  const boost={};if(G.mentalBoost&&(h.id===G.me||a.id===G.me)){boost[G.me]=(boost[G.me]||0)+G.mentalBoost;G.mentalBoost=0}if(G.nextBoost&&(G.nextBoost.team===h.id||G.nextBoost.team===a.id)&&(h.id===G.me||a.id===G.me)){boost[G.nextBoost.team]=G.nextBoost.v;G.nextBoost=null}
  const M0={h:h.id,a:a.id,ctx,m:0,gh:0,ga:0,ev:[],xi:{[h.id]:mk(h),[a.id]:mk(a)},subs:{[h.id]:0,[a.id]:0},used:{[h.id]:[],[a.id]:[]},mins:{[h.id]:{},[a.id]:{}},shots:{[h.id]:0,[a.id]:0},poss:{[h.id]:0,[a.id]:0},passes:{[h.id]:0,[a.id]:0},pm:[],ps:{[h.id]:{},[a.id]:{}},seed:(Math.random()*1e9)|0,att,boost,done:false,half:false,pens:null};
  if(h.id===G.me||a.id===G.me){try{attachPlan(M0,h,a)}catch(err){}}
  aiPrepare(M0,h,a);
  return M0;
}
/* AI clubs prepare like a coach would: roles from attributes (a quick winger, a passing playmaker, a tall target man)
   and a mentality from the strength gap and the venue. The user's club is untouched. */
function aiRoleFor(p){const at=attrs(p);if(p.pos==='FW')return at[5]>=at[0]+6?'target':at[3]>=at[1]+4?'false9':'poach';
  if(p.pos==='MF')return at[2]>=at[4]+10&&at[2]>=66?'play':at[0]>=68&&at[3]>=66?'winger':at[4]>=at[2]+4?'anchor':'b2b';
  if(p.pos==='DF')return at[0]>=68&&at[3]>=62?'wingback':at[2]>=at[4]-2?'ball':'stopper';return at[0]>=62?'sweep':'stop'}
function aiPrepare(M,h,a){for(const c of [h,a]){if(isHumanClub(c.id))continue;for(const {p} of xiPlayers(M,c))if(!p.roleT)p.roleT=aiRoleFor(p);}
  const sh=xiStrength(M,h),sa=xiStrength(M,a);M.liveMent=M.liveMent||{};
  for(const [c,me0,op,home] of [[h,sh,sa,true],[a,sa,sh,false]]){if(isHumanClub(c.id))continue;const d=me0-op+(home?1.5:-1.5);
    M.liveMent[c.id]=d>=5?'att':d<=-5?'def':(c.mentality||'bal')}}
function xiPlayers(M,c){return M.xi[c.id].map(e=>({p:c.players.find(x=>x.id===e.pid),e})).filter(x=>x.p)}
function slotPenalty(p,slot){if(!slot||slot===p.pos)return 0;if(p.pos2&&slot===p.pos2)return 1;if(slot==='GK'||p.pos==='GK')return 18;if((slot==='DF'&&p.pos==='FW')||(slot==='FW'&&p.pos==='DF'))return 7;return 4}
function xiStrength(M,c){const xs=xiPlayers(M,c);if(!xs.length)return 35;const s=xs.reduce((t,{p,e})=>t+effOvr(p)-slotPenalty(p,e.slot)-minuteFatigue(M,p,e),0)/xs.length;const capP=c.captain&&xs.find(x=>x.p.id===c.captain);const cap=capP?(capP.p.pers==='leader'?1.2:.6):0;const boost=(M.boost&&M.boost[c.id])||0;let calm=0;if(isHumanClub(c.id)){calm+=chemBonus(c,M)}
  // mental programme: a bonus in big matches, on top of chemistry (it used to replace it)
  if(c.id===G.me&&mentalActive()){if(M.bigC==null){try{M.bigC=isBigMatch(M)?1:0}catch(e){M.bigC=0}}calm+=M.bigC*.35}
  // training plan: tactical familiarity and opponent preparation reach the match (they were display-only before)
  const train=trainBonus(c);
  return s+cap+boost+calm+train-(11-xs.length)*5}
function mentalityAdj(c,M){const m=M?liveMentality(M,c):(c&&c.mentality);return m==='att'?[.14,.14]:m==='def'?[-.1,-.15]:[0,0]}
/* Three units instead of one flat average. Each XI player contributes his effective rating (minus out-of-position and
   late-game fatigue) to defence / midfield / attack by slot; the goalkeeper is a defensive unit of his own. The team-wide
   extras from xiStrength (captain, boosts, chemistry, training) apply to every unit. */
function unitStrength(M,c){const xs=xiPlayers(M,c);const base={gk:40,def:40,mid:40,att:40};if(!xs.length)return base;
  const eff=({p,e})=>effOvr(p)-slotPenalty(p,e.slot)-minuteFatigue(M,p,e);
  const by={GK:[],DF:[],MF:[],FW:[]};for(const x of xs)by[x.e.slot||x.p.pos]?.push(eff(x));
  const avg=(arr,fb)=>arr.length?arr.reduce((t,v)=>t+v,0)/arr.length:fb;
  const extra=xiStrength(M,c)-avg(xs.map(eff),40);   // captain, boost, chemistry, training, missing-player penalty
  const gk=avg(by.GK,30),df=avg(by.DF,45),mf=avg(by.MF,45),fw=avg(by.FW,45);
  // the roles blur the units a little: wing-backs attack, box-to-box and anchors defend
  const ro=xs.reduce((t,{p,e})=>{const r=roleOf(p);if(r==='wingback')t.att+=.6;if(r==='anchor'||r==='b2b')t.def+=.5;if(r==='play'||r==='winger')t.att+=.5;return t},{att:0,def:0});
  return {gk:gk+extra,def:df*.72+mf*.18+gk*.10+extra+ro.def*.3,mid:mf*.7+df*.15+fw*.15+extra,att:fw*.68+mf*.32+extra+ro.att*.3}}
/* In-match fatigue uses the same energy curve the live screen shows (liveEnergy): press and tempo burn energy, a player
   below 82 energy loses rating linearly (−6 at 42), and a substitute comes on fresh. */
function minuteFatigue(M,p,e){const c=club(M.h).players.includes(p)?club(M.h):club(M.a);const en=liveEnergy(M,c,p,e,M.m);return en>=82?0:(82-en)/40*6}
/* momentum: the side that just scored (or conceded) plays with a short swing, fading over ~8 minutes */
function momentum(M,cid){const mo=M.mo;if(!mo||M.m-mo.m>8)return 0;const k=(1-(M.m-mo.m)/8)*.12;return mo.team===cid?k:-k*.5}
/* Expected goals per 90 for home and away: attack against the opposing defence, scaled by midfield control. One rating
   point of net advantage is worth ~0.085 goals (was 0.06 on the flat average), and the curve is convex so big gaps
   produce the lopsided results real football does. */
function expGoals(sh,sa,neutral,h,a,M){const U=M&&M.units;const ha=neutral?0:.22;const mh=mentalityAdj(h,M),ma=mentalityAdj(a,M);const t=M&&M.tadj||{dh:0,da:0};
  const xg=(att,def,midEdge,base)=>{const d=att-def;const k=d>=0?.08:.07;return Math.max(.12,base*Math.exp(clamp(d,-14,14)*k/1.25)*(1+clamp(midEdge,-10,10)*.016))};
  if(!U)return [Math.max(.2,1.25+(sh-sa)*.085+ha+mh[0]+ma[1]+t.dh),Math.max(.18,1.25-(sh-sa)*.085-.04+ma[0]+mh[1]+t.da)];
  const uh=U[h.id],ua=U[a.id];const mid=uh.mid-ua.mid;
  return [Math.max(.12,xg(uh.att,ua.def,mid,1.02)+ha+mh[0]+ma[1]+t.dh+momentum(M,h.id)),Math.max(.12,xg(ua.att,uh.def,-mid,1.02)-.04+ma[0]+mh[1]+t.da+momentum(M,a.id))]}
function scorerFrom(M,c){const xs=xiPlayers(M,c);if(!xs.length)return null;const mk=M.plan&&M.plan.kind==='mark'&&M.plan.target?M.plan.target:null;const w=xs.map(({p})=>{const r=roleOf(p);let b=p.pos==='FW'?6:p.pos==='MF'?3:p.pos==='DF'?1:.05;if(r==='poach')b*=1.5;if(r==='target')b*=1.15;if(r==='false9')b*=.75;if(r==='winger')b*=1.3;if(r==='b2b')b*=1.2;if(r==='anchor')b*=.5;if(r==='wingback')b*=1.4;if(mk&&p.id===mk)b*=1-.5*(M.plan.mult||1);return b});let r=Math.random()*w.reduce((x,y)=>x+y,0);for(let i=0;i<xs.length;i++){r-=w[i];if(r<=0)return xs[i].p}return xs[0].p}
function penTaker(M,c){const xs=xiPlayers(M,c);if(!xs.length)return null;const fw=xs.filter(x=>x.p.pos==='FW').sort((a,b)=>b.p.ovr-a.p.ovr)[0]||xs.filter(x=>x.p.pos==='MF').sort((a,b)=>b.p.ovr-a.p.ovr)[0]||xs[0];return fw.p}
function fm(m){return '\u2066'+m+"'\u2069"}
function injuryWeeks(c){const r=Math.random();let w=r<.4?1:r<.7?ri(2,3):r<.9?ri(4,8):ri(9,16);w=Math.max(1,Math.round(w*(1-.08*((c.training||1)-1))*(c.id===G.me?1-.06*staffD('phys'):1)));return w}
const INJ_TYPES=[['שריר ירך אחורי',1,3],['קרסול',1,4],['ברך',3,12],['מפשעה',2,4],['שריר התאומים',1,3],['כתף',2,6],['גב תחתון',1,3],['שבר במסרק כף הרגל',6,10],['רצועה צולבת',16,16],['זעזוע מוח',1,2],['מתיחה',1,2]];
function setInjury(p,w){p.inj=w;p.injTot=w;p.injT=injuryType(w);G.injSeq=(G.injSeq||0)+1;p.injId=G.injSeq;p.rehabDone=false;p.injWk=G.wk;p.injS=G.season}
function injuryType(weeks){const c=INJ_TYPES.filter(t=>weeks>=t[1]&&weeks<=t[2]);return (c.length?pick(c):INJ_TYPES[weeks>8?8:0])[0]}
/* ---- match event geometry: attacking frame, x 0→105 towards the opponent's goal, y 0→68 ---- */
function shotSpot(kind){if(kind==='pen')return {x:94,y:34};const d=kind==='goal'?rnd(5,17):kind==='save'?rnd(7,22):kind==='post'?rnd(7,20):rnd(9,28);const ang=rnd(-1.1,1.1);return {x:+clamp(105-d*Math.cos(ang),55,104).toFixed(1),y:+clamp(34+d*Math.sin(ang),3,65).toFixed(1)}}
function chanceSpot(kind){const d=kind==='long'?rnd(16,28):kind==='box'?rnd(6,14):kind==='cross'?rnd(5,12):rnd(7,20);const ang=kind==='cross'?rnd(-1.2,1.2):rnd(-.9,.9);return {x:+clamp(105-d*Math.cos(ang),55,104).toFixed(1),y:+clamp(34+d*Math.sin(ang),3,65).toFixed(1)}}
function xgOf(x,y){const dx=Math.max(.5,105-x),dy=y-34;const d=Math.hypot(dx,dy);const ang=Math.atan2(7.32*dx,dx*dx+dy*dy-13.4);const v=.95*Math.exp(-d/8.5)*(.35+.65*Math.min(1,ang/.9));return +clamp(v,.02,.85).toFixed(2)}
function buildPath(spot,outcome){const pts=[];const n=ri(2,4);let x=rnd(30,62),y=rnd(10,58);pts.push([+x.toFixed(1),+y.toFixed(1)]);for(let i=1;i<n;i++){x=x+(spot.x-x)*rnd(.35,.7);y=y+(spot.y-y)*rnd(.2,.8)+rnd(-8,8);pts.push([+clamp(x,20,104).toFixed(1),+clamp(y,2,66).toFixed(1)])}pts.push([spot.x,spot.y]);
  const end=outcome==='goal'||outcome==='pen'?[105.5,rnd(30.5,37.5)]:outcome==='save'?[104.3,rnd(30,38)]:outcome==='post'?[105,Math.random()<.5?30.4:37.6]:[106,Math.random()<.5?rnd(22,29):rnd(39,46)];pts.push([+end[0].toFixed(1),+end[1].toFixed(1)]);return pts}
function assistFrom(M,c,scorer){const xs=xiPlayers(M,c).filter(x=>x.p.id!==scorer.id);if(!xs.length||Math.random()<.22)return null;const w=xs.map(({p})=>{const r=roleOf(p);let b=p.pos==='MF'?4:p.pos==='FW'?3:p.pos==='DF'?1:.1;if(r==='play'||r==='winger'||r==='wingback')b*=1.6;if(r==='false9')b*=1.4;return b});let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<xs.length;i++){r-=w[i];if(r<=0)return xs[i].p}return xs[0].p}
function pstat(M,cid,pid){M.ps=M.ps||{};const t=M.ps[cid]||(M.ps[cid]={});return t[pid]||(t[pid]={sh:0,sot:0,g:0,a:0,sv:0,ps:0,min:0,y:0,red:0,xg:0})}
function shotEvent(M,c,opp,kind,shooter){const spot=shotSpot(kind);const ev={m:M.m,t:'shot',sub:kind,team:c.id,pid:shooter?shooter.id:null,name:shooter?fullName(shooter):'',x:spot.x,y:spot.y,xg:xgOf(spot.x,spot.y),path:buildPath(spot,kind)};
  if(shooter){const s=pstat(M,c.id,shooter.id);s.sh++;s.xg+=ev.xg;if(kind==='save')s.sot++}
  if(kind==='save'){const gk=xiPlayers(M,opp).find(x=>x.p.pos==='GK');if(gk){ev.gk=gk.p.id;ev.shooter=ev.name;ev.name=fullName(gk.p);pstat(M,opp.id,gk.p.id).sv++}if(Math.random()<.6)ev.quiet=true}
  if(kind==='off')ev.quiet=true;
  return ev}
function goalEvent(M,c,p,kind){const spot=shotSpot(kind==='pen'?'pen':'goal');const ev={m:M.m,t:kind,team:c.id,pid:p.id,name:fullName(p),x:spot.x,y:spot.y,xg:kind==='pen'?.76:xgOf(spot.x,spot.y),path:buildPath(spot,kind),corner:M.ev.some(e=>e.t==='corner'&&e.m===M.m&&e.team===c.id)};
  const s=pstat(M,c.id,p.id);s.sh++;s.sot++;s.g++;s.xg+=ev.xg;
  if(kind==='goal'){const as=assistFrom(M,c,p);if(as){ev.asst=as.id;ev.asstName=fullName(as);pstat(M,c.id,as.id).a++}}
  return ev}
function markOut(M,c,e){if(M.mins&&e)M.mins[c.id][e.pid]=Math.max(0,M.m-e.since)}
/* per-player minutes / passes / clean sheets / ratings, derived from the recorded event stream */
function matchRatings(M,h,a){
  const out={};const avg=(xiStrength(M,h)+xiStrength(M,a))/2;
  for(const c of [h,a]){const gf=c===h?M.gh:M.ga,ga=c===h?M.ga:M.gh;const opp=c===h?a:h;const res=gf>ga?.45:gf===ga?.05:-.35;
    const played=[...M.xi[c.id].map(e=>({pid:e.pid,min:Math.max(0,M.m-e.since)})),...M.used[c.id].map(pid=>({pid,min:(M.mins[c.id]||{})[pid]||0}))];
    const totalMin=played.reduce((t,x)=>t+x.min,0)||1;const teamPasses=M.passes?M.passes[c.id]||0:0;
    const yel=new Set(M.ev.filter(e=>e.t==='yellow'&&e.team===c.id).map(e=>e.pid)),red=new Set(M.ev.filter(e=>e.t==='red'&&e.team===c.id).map(e=>e.pid));
    for(const {pid,min} of played){const p=c.players.find(x=>x.id===pid);if(!p)continue;const s=pstat(M,c.id,pid);s.min=min;
      const pw=p.pos==='MF'?1.35:p.pos==='DF'?1.1:p.pos==='FW'?.8:.55;s.ps=Math.round(teamPasses*(min/totalMin)*pw*11/ (M.xi[c.id].length||11)*.95);
      if(yel.has(pid))s.y=1;if(red.has(pid))s.red=1;
      const cs=ga===0&&min>=60&&(p.pos==='GK'||p.pos==='DF');s.cs=cs?1:0;
      let r=6.1+(effOvr(p)-avg)*.045+s.g*1.0+s.a*.55+(p.pos==='GK'?s.sv*.18:0)+(cs?.5:0)+res+s.sot*.12-(p.pos==='GK'?ga*.25:0)-s.y*.25-s.red*1.6+rnd(-.35,.35);
      if(min<20)r=6+(r-6)*.5;s.r=+clamp(r,3,10).toFixed(1);out[pid]=s}}
  M.ratings=out;return out}
function stepMinute(M){
  if(M.playback)return mpPlaybackStep(M); /* multiplayer: replay a recorded match, no simulation */
  const h=club(M.h),a=club(M.a);M.m++;
  if(M.m===1||M.m%15===0||M.tadjDirty){M.tadj=tacticAdj(M,h,a);M.tadjDirty=false;if(M.tadj.notes.length&&M.live&&!M.tadjNoted){M.tadjNoted=true;M.ev.push({m:M.m,t:'note',team:G.me,txt:M.tadj.notes[0]})}}
  const sh=xiStrength(M,h),sa=xiStrength(M,a);M.units={[h.id]:unitStrength(M,h),[a.id]:unitStrength(M,a)};const [lh,la]=expGoals(sh,sa,M.ctx.neutral,h,a,M);
  const homeHas=Math.random()<.5+(sh-sa)*.015+(mentalityAdj(h,M)[0]-mentalityAdj(a,M)[0])*.4+(M.tadj?M.tadj.poss:0);if(homeHas)M.poss[h.id]++;else M.poss[a.id]++;
  M.pm=M.pm||[];M.pm.push(homeHas?1:0);M.passes=M.passes||{[h.id]:0,[a.id]:0};const tt=tacOf(homeHas?h:a);M.passes[homeHas?h.id:a.id]+=ri(5,11)+(tt&&tt.tempo==='slow'?2:0)-(tt&&tt.style==='direct'?2:0);
  M.sot=M.sot||{[h.id]:0,[a.id]:0};M.corners=M.corners||{[h.id]:0,[a.id]:0};
  /* Chances. Every minute each side may create a chance (rate ∝ expected goals). The chance gets a location from the
     playing style, a shooter weighted by position/role, and an outcome decided by his finishing against the keeper:
     goal / saved / post / off. The team's expected goals stay what expGoals says on average, so balance is unchanged,
     but a better finisher or keeper now moves the result, and the xG shown in the report is the real one. */
  const chance=(c,l)=>{const opp=c===h?a:h;const t=tacOfM(M,c);
    if(Math.random()>=l*3.6/90)return false;
    const shooter=scorerFrom(M,c);if(!shooter)return false;
    const kind=t&&t.style==='direct'?'long':t&&t.style==='possession'?'box':t&&t.width==='wide'?'cross':'open';
    const spot=chanceSpot(kind);const xg=xgOf(spot.x,spot.y);
    const at=attrs(shooter);const gkx=xiPlayers(M,opp).find(x=>x.p.pos==='GK');const gk=gkx?effOvr(gkx.p):40;
    // finishing vs keeper: ±12 points swing conversion by ~±35% of the base xG
    const skill=clamp(1+(at[1]-66)*.02-(gk-66)*.02,.6,1.4);
    const meanXg={long:.045,box:.26,cross:.31,open:.165}[kind];   // mean xG of that spot distribution (measured)
    const pGoal=clamp(xg/meanXg*skill,0,3.2)*(1/3.6)*.83;   // chance rate l·3.6/90; ×.83 corrects the clamp bias so goals average l/90 (measured)
    M.shots[c.id]++;const r3=Math.random();
    if(r3<pGoal){if(Math.random()<.07){M.ev.push({m:M.m,t:'var',team:c.id,name:fullName(shooter),ok:false});return true}
      if(c===h)M.gh++;else M.ga++;M.mo={m:M.m,team:c.id};M.sot[c.id]++;if(Math.random()<.1)M.ev.push({m:M.m,t:'var',team:c.id,name:fullName(shooter),ok:true});
      const ev=goalEvent(M,c,shooter,'goal');ev.x=spot.x;ev.y=spot.y;ev.xg=xg;ev.path=buildPath(spot,'goal');M.ev.push(ev);return true}
    const onT=r3<pGoal+.36*(1+(at[1]-70)*.01);
    if(onT){M.sot[c.id]++;const ev=shotEvent(M,c,opp,'save',shooter);ev.x=spot.x;ev.y=spot.y;ev.xg=xg;ev.path=buildPath(spot,'save');M.ev.push(ev)}
    else if(Math.random()<.12){const ev=shotEvent(M,c,opp,'post',shooter);ev.x=spot.x;ev.y=spot.y;ev.xg=xg;M.ev.push(ev)}
    else{const ev=shotEvent(M,c,opp,'off',shooter);ev.x=spot.x;ev.y=spot.y;ev.xg=xg;M.ev.push(ev)}
    return true};
  for(const [c,l] of [[h,lh],[a,la]]){chance(c,l);
    if(Math.random()<(l*5.2)/90){M.corners[c.id]++;if(M.live&&Math.random()<.25)M.ev.push({m:M.m,t:'corner',team:c.id})}}
  const r=Math.random();
  if(false){}
  else{const r2=Math.random();
    if(r2<lh*.0025){const p=penTaker(M,h);if(p){M.shots[h.id]++;if(Math.random()<.76){M.gh++;M.sot[h.id]++;M.ev.push(goalEvent(M,h,p,'pen'))}else{const s=pstat(M,h.id,p.id);s.sh++;M.ev.push({m:M.m,t:'penmiss',team:h.id,pid:p.id,name:fullName(p),x:94,y:34,xg:.76,path:buildPath({x:94,y:34},Math.random()<.5?'save':'off')})}}}
    else if(r2<(lh+la)*.0025){const p=penTaker(M,a);if(p){M.shots[a.id]++;if(Math.random()<.76){M.ga++;M.sot[a.id]++;M.ev.push(goalEvent(M,a,p,'pen'))}else{const s=pstat(M,a.id,p.id);s.sh++;M.ev.push({m:M.m,t:'penmiss',team:a.id,pid:p.id,name:fullName(p),x:94,y:34,xg:.76,path:buildPath({x:94,y:34},Math.random()<.5?'save':'off')})}}}
    else if(r2<(lh+la)*.0025+.0006){const og=Math.random()<.5?h:a;const other=og===h?a:h;const ds=xiPlayers(M,og).filter(x=>x.p.pos==='DF'||x.p.pos==='GK');const x=ds.length?pick(ds):null;if(x){if(og===h)M.ga++;else M.gh++;M.ev.push({m:M.m,t:'own',team:other.id,ogteam:og.id,pid:x.p.id,name:fullName(x.p),x:rnd(96,103),y:rnd(26,42),xg:.1})}}}
  for(const c of [h,a]){
    const xs=xiPlayers(M,c);if(!xs.length)continue;
    if(Math.random()<.016){const x=pick(xs);x.e.yel++;if(x.e.yel>=2){markOut(M,c,x.e);M.xi[c.id]=M.xi[c.id].filter(e=>e!==x.e);x.p.susp=Math.max(x.p.susp,1);M.ev.push({m:M.m,t:'red',team:c.id,pid:x.p.id,name:fullName(x.p)})}else M.ev.push({m:M.m,t:'yellow',team:c.id,pid:x.p.id,name:fullName(x.p)})}
    else if(Math.random()<.0022*(c.focus==='fit'?.75:1)*(c.campShield>0?.6:1)){const w=xs.map(x=>1+(100-(x.p.fit??100))/50+Math.max(0,82-liveEnergy(M,c,x.p,x.e,M.m))/40);let rr=Math.random()*w.reduce((p,q)=>p+q,0);let x=xs[0];for(let i=0;i<xs.length;i++){rr-=w[i];if(rr<=0){x=xs[i];break}}setInjury(x.p,injuryWeeks(c));markOut(M,c,x.e);M.xi[c.id]=M.xi[c.id].filter(e=>e!==x.e);M.ev.push({m:M.m,t:'inj',team:c.id,pid:x.p.id,name:fullName(x.p),weeks:x.p.inj,injT:x.p.injT,needSub:true});
      if(c.id!==G.me||!M.live)autoSub(M,c,x.p.pos)}
    if(c.id!==G.me||!M.live){ if([58,66,74,82].includes(M.m)&&Math.random()<.55)autoSub(M,c);
      if(M.m%5===0&&M.m>=45){const my=c===h?M.gh:M.ga,op=c===h?M.ga:M.gh;M.liveMent=M.liveMent||{};const cur=M.liveMent[c.id]||c.mentality||'bal';let want=cur;
        if(my<op&&M.m>=60)want='att';else if(my<op-1&&M.m>=45)want='att';else if(my>op&&M.m>=75)want='def';else if(my===op&&M.m>=85&&c.tier!==1)want='def';
        if(want!==cur){M.liveMent[c.id]=want;M.tadjDirty=true}} }
  }
  if(M.m>=90){M.done=true}
}
function bench(M,c){const inXI=new Set(M.xi[c.id].map(e=>e.pid));const used=new Set(M.used[c.id]);return available(c).filter(p=>!inXI.has(p.id)&&!used.has(p.id))}
function autoSub(M,c,pos){
  if(M.subs[c.id]>=MAX_SUBS)return;
  const b=bench(M,c);if(!b.length)return;
  const xs=xiPlayers(M,c);
  let out=null;
  if(M.xi[c.id].length<11){out=null}
  else{const cand=xs.filter(x=>x.p.pos!=='GK').sort((x,y)=>(effOvr(x.p)-minuteFatigue(M,x.p,x.e))-(effOvr(y.p)-minuteFatigue(M,y.p,y.e)));out=cand[0]||null}
  const wantPos=pos||out?.p.pos;const inP=b.sort((x,y)=>((y.pos===wantPos?50:0)+effOvr(y))-((x.pos===wantPos?50:0)+effOvr(x)))[0];
  if(!inP)return;if(out&&effOvr(inP)<effOvr(out.p)-4&&!pos)return;
  doSub(M,c,out?out.p.id:null,inP.id);
}
function doSub(M,c,outId,inId){
  if(M.done||M.subs[c.id]>=MAX_SUBS)return false;
  const inP=bench(M,c).find(p=>p.id===inId);if(!inP||outId&&!M.xi[c.id].some(e=>e.pid===outId)||!outId&&M.xi[c.id].length>=11)return false;
  let slot=inP.pos;if(outId){const oe=M.xi[c.id].find(e=>e.pid===outId);if(oe&&oe.slot)slot=oe.slot;if(oe&&M.mins)M.mins[c.id][outId]=M.m-oe.since;M.xi[c.id]=M.xi[c.id].filter(e=>e.pid!==outId);M.used[c.id].push(outId)}
  if(M.xi[c.id].length>=11)return false;
  M.xi[c.id].push({pid:inId,slot,since:M.m,yel:0});M.subs[c.id]++;
  const outP=outId?c.players.find(p=>p.id===outId):null;
  M.ev.push({m:M.m,t:'sub',team:c.id,name:fullName(inP),out:outP?fullName(outP):null,outPid:outId||null});
  return true;
}
function runInstant(M){while(!M.done)stepMinute(M);if(typeof MP!=='undefined'&&MP.capture&&(MP.capture.has(M.h)||MP.capture.has(M.a)))MP.captured.push(M);return M}
function decidePens(M){const h=club(M.h),a=club(M.a);const sh=xiStrength(M,h),sa=xiStrength(M,a);M.pens=Math.random()<.5+(sh-sa)*.02?'h':'a'}

