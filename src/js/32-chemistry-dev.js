/* ====================== CHEMISTRY · ADAPTATION · DEPARTURES ====================== */
const UNIT_HE={def:'הגנה',mid:'קישור',att:'התקפה'};
function unitOf(pos){return pos==='GK'||pos==='DF'?'def':pos==='MF'?'mid':'att'}
function pairKey(a,b){return a<b?a+'-'+b:b+'-'+a}
function seedChem(){if(!G)return;const c=me();if(!c||c.chem)return;c.chem={};const ps=c.players;for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){if(unitOf(ps[i].pos)===unitOf(ps[j].pos)||Math.random()<.4)c.chem[pairKey(ps[i].id,ps[j].id)]=ri(500,1100)}
  for(const p of ps){p.joined=p.joined||{s:G.season,wk:G.wk,init:true}}c.lastIds=ps.map(p=>p.id)}
function chemAfterMatch(M,c,R){if(!c.chem)c.chem={};const xs=[...M.xi[c.id].map(e=>e.pid),...M.used[c.id]];const mins=pid=>(R&&R[pid]?R[pid].min:0);
  for(let i=0;i<xs.length;i++)for(let j=i+1;j<xs.length;j++){const m=Math.min(mins(xs[i]),mins(xs[j]));if(m<15)continue;const k=pairKey(xs[i],xs[j]);c.chem[k]=Math.min(2000,(c.chem[k]||0)+m)}}
function unitChem(c,ids){const ps=ids.map(id=>c.players.find(p=>p.id===id)).filter(Boolean);const out={};for(const u of ['def','mid','att']){const g=ps.filter(p=>unitOf(p.pos)===u);let sum=0,n=0,weak=null;
    for(let i=0;i<g.length;i++)for(let j=i+1;j<g.length;j++){const v=Math.min(1,((c.chem||{})[pairKey(g[i].id,g[j].id)]||0)/900);sum+=v;n++;if(!weak||v<weak.v)weak={v,a:g[i],b:g[j],m:(c.chem||{})[pairKey(g[i].id,g[j].id)]||0}}
    out[u]={v:n?sum/n:.6,weak}}return out}
function chemBonus(c,M){if(!c.chem)return 0;const U=unitChem(c,M.xi[c.id].map(e=>e.pid));const avg=(U.def.v*1.2+U.mid.v+U.att.v*.8)/3;return (avg-.55)*.9}
function chemCardHTML(c){const ids=(c.lineup||[]).filter(Boolean);if(ids.length<8)return '';const U=unitChem(c,ids);const ad=ids.map(id=>c.players.find(p=>p.id===id)).filter(p=>p&&p.adapt!=null&&p.adapt<100);
  const bar=u=>{const v=Math.round(U[u].v*100);return `<div class="arow2"><span class="nm">${UNIT_HE[u]}</span><div class="bar" style="flex:1"><i style="width:${v}%;background:${v>=70?'var(--good)':v>=45?'var(--warn)':'var(--bad)'}"></i></div><b class="num small">${v}</b></div>`};
  const weakest=['def','mid','att'].map(u=>U[u].weak&&{u,...U[u].weak}).filter(Boolean).sort((a,b)=>a.v-b.v)[0];const bonus=chemBonus(c,{xi:{[c.id]:ids.map(pid=>({pid}))}});
  return `<div class="analyst"><div class="row between"><b>🤝 כימיה בהרכב</b><span class="tag ${bonus>=0?'good':'warn'}">${bonus>=0?'‎+':''}${bonus.toFixed(2)} לחוזק</span></div>${bar('def')}${bar('mid')}${bar('att')}
   ${weakest&&weakest.v<.5?`<div class="tiny" style="margin-top:4px;color:var(--warn)">הצמד החלש: ${esc(weakest.a.last||weakest.a.first)} ו${esc(weakest.b.last||weakest.b.first)} שיחקו יחד ${Math.round(weakest.m)} דקות בלבד.</div>`:''}
   ${ad.length?`<div class="tiny" style="margin-top:4px">🌍 בהסתגלות: ${ad.map(p=>`${esc(p.last||p.first)} ${Math.round(p.adapt)}%`).join(', ')}</div>`:''}
   <div class="muted tiny" style="margin-top:4px">הכימיה נבנית מדקות משחק משותפות של שחקנים באותו קו (900 דקות = הבנה מלאה). שחקנים חדשים מתחילים מאפס.</div></div>`}
function weeklySquadLife(){const c=me();if(!c)return;if(!c.chem)seedChem();const ids=new Set(c.players.map(p=>p.id));
  // arrivals
  for(const p of c.players){if(p.joined)continue;p.joined={s:G.season,wk:G.wk};const fromAbroad=p.foreign&&p.nat!=='ישראל';if(fromAbroad){const mate=c.players.some(q=>q!==p&&q.nat===p.nat);p.adapt=mate?60:40;news(`${fullName(p)} מתחיל להסתגל לחיים בישראל${mate?' (יש בסגל שחקן מאותה מדינה, וזה יעזור)':''}.`)}}
  for(const p of c.players){if(p.adapt!=null&&p.adapt<100){const capP=c.players.find(x=>x.id===c.captain);p.adapt=Math.min(100,p.adapt+4+(capP&&capP.pers==='leader'?2:0)+(mentalActive()?1:0)+(p.pers==='professional'?1:0));if(p.adapt>=100)news(`${fullName(p)} השלים את ההסתגלות למועדון.`)}}
  // departures
  const prev=c.lastIds||[];const gone=prev.filter(id=>!ids.has(id));if(gone.length&&c.departed){}
  for(const id of gone){const info=(c.rosterInfo||{})[id];if(!info||info.retired)continue;const top5=info.rank<=5;const infl=top5||info.leader||info.captain;if(!infl)continue;
    let hit=[];for(const p of c.players){const m=(c.chem||{})[pairKey(p.id,id)]||0;let d=-1;if(m>=900)d-=3;if(p.nat===info.nat&&info.nat!=='ישראל')d-=2;if(p.pers==='loyal')d-=1;if(p.pers==='mercenary'||p.pers==='professional')d+=1;p.morale=clamp((p.morale??65)+d,10,100);if(d<=-3)hit.push(p.last||p.first)}
    news(`העזיבה של ${info.name} מורגשת בחדר ההלבשה${info.leader?' (מנהיג)':info.captain?' (הקפטן)':''}. ${hit.length?'הכי מושפעים: '+hit.slice(0,3).join(', ')+'.':''}`)}
  const sorted=c.players.slice().sort(byOvr);c.rosterInfo={};sorted.forEach((p,i)=>c.rosterInfo[p.id]={name:fullName(p),rank:i+1,leader:p.pers==='leader',captain:c.captain===p.id,nat:p.nat,retired:false});c.lastIds=c.players.map(p=>p.id);
  devPlansWeekly(c)}
/* ====================== DEVELOPMENT PLANS & MENTORING ====================== */
function devFactors(c,p){const sh=(p.sharp??70)/100;const coach=1+.1*((c.training||1)-1)+.05*staffD('asst');const {intensity}=trainCfg(c);const load=intensity==='high'?1.2:intensity==='low'?.8:1;const pers=p.pers==='professional'?1.15:p.pers==='ambitious'?1.1:p.pers==='temperamental'?.9:1;
  const age=p.age<=21?1.3:p.age<=24?1.1:p.age<=28?.8:p.age<=31?.55:.35;const room=p.pot>p.ovr?1:.6;return {sh,coach,load,pers,age,room,F:sh*coach*load*pers*age*room}}
function mentorOf(c,p){const id=p.dplan&&p.dplan.mentor;return id?c.players.find(x=>x.id===id):null}
function devPlanMult(c,p){const m=mentorOf(c,p);if(!m||m.inj)return 1;return 1.15+(m.pers==='leader'||m.pers==='professional'?.05:0)}
function devPlansWeekly(c){for(const p of c.players){const d=p.dplan;if(!d)continue;const {F}=devFactors(c,p);
    if(d.focus!=null){d.fprog=(d.fprog||0)+6*F;if(d.fprog>=100){d.fprog=0;p.ab=p.ab||[0,0,0,0,0,0];if(p.ab[d.focus]<6){p.ab[d.focus]++;news(`${fullName(p)} השתפר ב${ATTR_HE[p.pos==='GK'?'GK':'OUT'][d.focus]} (תוכנית פיתוח).`)}else{d.focus=null;news(`${fullName(p)} הגיע לתקרת השיפור הממוקד.`)}}}
    if(d.retrain){d.rprog=(d.rprog||0)+3*F*(p.age>=30?.6:1);if(d.rprog>=100){p.pos2=d.retrain;news(`${fullName(p)} סיים הסבה ל${POSHE[d.retrain]}: עכשיו הוא יכול לשחק שם כמעט בלי פגיעה.`);d.retrain=null;d.rprog=0}}
    if(d.spec){const played=(p.sharp??70)>=60;if(roleOf(p)===d.spec&&played){d.sprog=(d.sprog||0)+7*F;if(d.sprog>=100){p.roleM=d.spec;news(`${fullName(p)} התמחה בתפקיד ${ROLES[p.pos][d.spec]}.`);d.spec=null;d.sprog=0}}}
    const m=mentorOf(c,p);if(m){if(!c.players.includes(m)){d.mentor=null;continue}if(m.pers==='professional'&&(p.pers==='temperamental'||p.pers==='mercenary')&&Math.random()<.015){p.pers='professional';news(`${fullName(p)} אימץ את הגישה המקצוענית של החונך שלו, ${fullName(m)}.`)}if(G.wk%4===0)m.morale=clamp((m.morale??65)+1,10,100)}}}
function setDevPlan(pid,field,val){const c=me();const p=c.players.find(x=>x.id===pid);if(!p)return;p.dplan=p.dplan||{};
  if(field==='focus'){p.dplan.focus=val===''?null:+val;p.dplan.fprog=0}
  if(field==='retrain'){if(val&&p.pos==='GK'!==(val==='GK'))return toast('הסבה מ/אל שוער לא אפשרית');p.dplan.retrain=val||null;p.dplan.rprog=0}
  if(field==='spec'){p.dplan.spec=val||null;p.dplan.sprog=0;if(val&&p.roleT!==val)toast('שים לב: ההתמחות מתקדמת רק כשהוא משחק בתפקיד הזה (טקטיקה ← תפקידים)')}
  if(field==='mentor'){const m=val?c.players.find(x=>x.id===+val):null;if(m&&c.players.some(x=>x!==p&&x.dplan&&x.dplan.mentor===m.id))return toast('החונך כבר מלווה שחקן אחר');p.dplan.mentor=m?m.id:null;if(m)news(`${fullName(m)} ילווה את ${fullName(p)} כחונך.`)}
  save();closeModal();playerModal(pid)}
function devPlanHTML(c,p){const d=p.dplan||{};const fx=devFactors(c,p);const labels=ATTR_HE[p.pos==='GK'?'GK':'OUT'];const mentors=c.players.filter(m=>m!==p&&m.age>=28&&!c.players.some(x=>x!==p&&x.dplan&&x.dplan.mentor===m.id));const mt=mentorOf(c,p);
  const pr=(v,l)=>`<div class="arow2"><span class="nm tiny">${l}</span><div class="bar" style="flex:1"><i style="width:${Math.round(v||0)}%;background:var(--info)"></i></div><b class="num small">${Math.round(v||0)}%</b></div>`;
  return `<div class="card in" style="margin-top:8px"><h3 class="sec" style="font-size:15px">תוכנית פיתוח אישית</h3>
   <div class="dpg"><label class="tiny">מיקוד במאפיין<select data-dplan="${p.id}:focus"><option value="">ללא</option>${labels.map((l,i)=>`<option value="${i}" ${d.focus===i?'selected':''}>${l}${p.ab&&p.ab[i]?` (‎+${p.ab[i]})`:''}</option>`).join('')}</select></label>
   <label class="tiny">הסבת עמדה<select data-dplan="${p.id}:retrain"><option value="">ללא</option>${POS.filter(x=>x!==p.pos&&x!==p.pos2).map(x=>`<option value="${x}" ${d.retrain===x?'selected':''}>${POSHE[x]}</option>`).join('')}</select></label>
   <label class="tiny">התמחות בתפקיד<select data-dplan="${p.id}:spec"><option value="">ללא</option>${Object.entries(ROLES[p.pos]||{}).filter(([k])=>k!==p.roleM).map(([k,l])=>`<option value="${k}" ${d.spec===k?'selected':''}>${l}</option>`).join('')}</select></label>
   ${p.age<=23?`<label class="tiny">חונך ותיק<select data-dplan="${p.id}:mentor"><option value="">ללא</option>${[...(mt?[mt]:[]),...mentors.filter(m=>m!==mt)].map(m=>`<option value="${m.id}" ${mt&&mt.id===m.id?'selected':''}>${esc(fullName(m))} (${m.age}, ${PERS[m.pers||'professional'].he})</option>`).join('')}</select></label>`:''}</div>
   ${d.focus!=null?pr(d.fprog,'מיקוד: '+labels[d.focus]):''}${d.retrain?pr(d.rprog,'הסבה ל'+POSHE[d.retrain]):''}${d.spec?pr(d.sprog,'התמחות: '+ROLES[p.pos][d.spec]):''}
   ${p.pos2?`<div class="tiny">✓ עמדה משנית: ${POSHE[p.pos2]}</div>`:''}${p.roleM?`<div class="tiny">✓ מומחה בתפקיד: ${ROLES[p.pos][p.roleM]}</div>`:''}${mt?`<div class="tiny">👥 חונך: ${esc(fullName(mt))} · קצב התפתחות ‎+${Math.round((devPlanMult(c,p)-1)*100)}%</div>`:''}
   <div class="muted tiny" style="margin-top:4px">קצב ההתקדמות השבועי: <b>${(fx.F*100).toFixed(0)}%</b> = חדות משחק ${Math.round(fx.sh*100)}% × אימון ${fx.coach.toFixed(2)} × עומס ${fx.load} × אישיות ${fx.pers} × גיל ${fx.age} × מרחב לפוטנציאל ${fx.room}. אי אפשר לקנות שיפור: הוא תלוי בדקות משחק, באיכות האימון ובשחקן עצמו.</div></div>`}
