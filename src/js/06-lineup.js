/* ====================== LINEUPS & STRENGTH ====================== */
function available(c){return c.players.filter(p=>!p.inj&&!p.susp)}
function bestXI(c,formation){
  const counts=FORMATIONS[formation||c.formation]||FORMATIONS['4-3-3'];const xi=[];const av=available(c);
  POS.forEach((pos,i)=>{const pool=av.filter(p=>p.pos===pos).sort(byEff);xi.push(...pool.slice(0,counts[i]))});
  if(xi.length<11){const rest=av.filter(p=>!xi.includes(p)).sort(byEff);xi.push(...rest.slice(0,11-xi.length))}
  let guard=0;
  while(xi.filter(p=>p.foreign).length>MAX_FOREIGN_XI&&guard++<12){
    const f=xi.filter(p=>p.foreign).sort((a,b)=>a.ovr-b.ovr)[0];
    const rep=av.filter(p=>!p.foreign&&!xi.includes(p)).sort((a,b)=>((b.pos===f.pos?100:0)+b.ovr)-((a.pos===f.pos?100:0)+a.ovr))[0];
    if(!rep)break;xi[xi.indexOf(f)]=rep;
  }
  return xi;
}
function strength(c){const xi=c.id===G.me?lineupPlayers(c).filter(Boolean):bestXI(c);if(!xi.length)return 40;return xi.reduce((t,p)=>t+p.ovr+p.form,0)/xi.length-(11-xi.length)*4+trainBonus(c)}
/* ---- manual lineup (slots follow the formation) ---- */
function slotsFor(formation){const counts=FORMATIONS[formation]||FORMATIONS['4-3-3'];const out=[];POS.forEach((pos,i)=>{for(let k=0;k<counts[i];k++)out.push(pos)});return out}
function slotLayout(formation){const counts=FORMATIONS[formation]||FORMATIONS['4-3-3'];const pts=[];const row=(n,y,pad)=>{for(let i=0;i<n;i++)pts.push({x:pad+(100-2*pad)*(i+.5)/n,y})};
  row(1,91,50);row(counts[1],73,counts[1]>=5?8:12);
  if(counts[2]>=5){const a=Math.floor(counts[2]/2);row(a,58,22);row(counts[2]-a,40,14)}else row(counts[2],49,counts[2]>=4?12:18);
  row(counts[3],counts[3]===1?20:23,counts[3]===1?50:counts[3]===2?30:16);return pts}
function lineupPlayers(c){ensureLineup(c);return c.lineup.map(id=>id==null?null:c.players.find(p=>p.id===id)||null)}
function ensureLineup(c){const slots=slotsFor(c.formation);if(!c.lineup||c.lineup.length!==slots.length)c.lineup=bestXI(c).length?autoLineupFor(c):slots.map(()=>null);ensureCaptain(c)}
function ensureCaptain(c){if(c.captain&&c.players.some(p=>p.id===c.captain))return;const inXI=new Set((c.lineup||[]).filter(Boolean));let pool=c.players.filter(p=>inXI.has(p.id)&&!p.inj);if(!pool.length)pool=c.players.filter(p=>!p.inj);const best=(pool.length?pool:c.players).slice().sort((a,b)=>(b.ovr+b.age*.6+b.apps*.05)-(a.ovr+a.age*.6+a.apps*.05))[0];c.captain=best?best.id:null}
function isCaptain(c,p){return !!p&&c.captain===p.id}
function setCaptain(pid){const c=me();const p=c.players.find(x=>x.id===pid);if(!p)return;c.captain=pid;news(`${fullName(p)} מונה לקפטן הקבוצה.`);p.morale=clamp((p.morale??65)+5,10,100);toast(`${p.last||p.first} הוא הקפטן`);closeModal();save();render()}
function autoLineupFor(c){const slots=slotsFor(c.formation);const av=available(c);const used=new Set();const out=slots.map(()=>null);
  slots.forEach((pos,i)=>{const p=av.filter(x=>x.pos===pos&&!used.has(x.id)).sort(byEff)[0];if(p){out[i]=p.id;used.add(p.id)}});
  slots.forEach((pos,i)=>{if(out[i]==null){const p=av.filter(x=>!used.has(x.id)).sort(byEff)[0];if(p){out[i]=p.id;used.add(p.id)}}});
  let guard=0;while(out.filter(id=>{const p=c.players.find(x=>x.id===id);return p&&p.foreign}).length>MAX_FOREIGN_XI&&guard++<12){
    const fIdx=out.map((id,i)=>({p:c.players.find(x=>x.id===id),i})).filter(x=>x.p&&x.p.foreign).sort((a,b)=>a.p.ovr-b.p.ovr)[0];
    const rep=av.filter(x=>!x.foreign&&!used.has(x.id)).sort((a,b)=>((b.pos===slots[fIdx.i]?100:0)+b.ovr)-((a.pos===slots[fIdx.i]?100:0)+a.ovr))[0];if(!rep)break;used.delete(fIdx.p.id);out[fIdx.i]=rep.id;used.add(rep.id)}
  return out}
function lineupProblems(c){const slots=slotsFor(c.formation);const ps=lineupPlayers(c);const problems=[];
  if(ps.some(p=>!p))problems.push('יש מקום ריק בהרכב');
  ps.forEach((p,i)=>{if(!p)return;if(p.inj)problems.push(`${fullName(p)} פצוע`);else if(p.susp)problems.push(`${fullName(p)} מורחק`);if(slots[i]==='GK'&&p.pos!=='GK')problems.push(`${fullName(p)} בשער בלי להיות שוער`)});
  const f=ps.filter(p=>p&&p.foreign).length;if(f>MAX_FOREIGN_XI)problems.push(`${f} זרים בהרכב (מותר ${MAX_FOREIGN_XI})`);
  const ids=ps.filter(Boolean).map(p=>p.id);if(new Set(ids).size!==ids.length)problems.push('שחקן מופיע פעמיים');
  return problems}
function fixedLineup(c){const slots=slotsFor(c.formation);const ps=lineupPlayers(c);const av=available(c);const used=new Set(ps.filter(p=>p&&!p.inj&&!p.susp).map(p=>p.id));
  const out=ps.map((p,i)=>{if(p&&!p.inj&&!p.susp&&!(slots[i]==='GK'&&p.pos!=='GK'))return p;const r=av.filter(x=>!used.has(x.id)).sort((a,b)=>((b.pos===slots[i]?100:0)+b.ovr)-((a.pos===slots[i]?100:0)+a.ovr))[0];if(r){used.add(r.id);return r}return null});
  let guard=0;while(out.filter(p=>p&&p.foreign).length>MAX_FOREIGN_XI&&guard++<12){const i=out.map((p,i)=>({p,i})).filter(x=>x.p&&x.p.foreign).sort((a,b)=>a.p.ovr-b.p.ovr)[0].i;const r=av.filter(x=>!x.foreign&&!used.has(x.id)).sort(byOvr)[0];if(!r)break;used.delete(out[i].id);out[i]=r;used.add(r.id)}
  return out.map((p,i)=>p?{pid:p.id,slot:slots[i]}:null).filter(Boolean)}
function autoLineups(){[...G.clubs,...G.leumit].forEach(c=>c.xi=bestXI(c).map(p=>p.id));const c=me();if(c)ensureLineup(c)}

