/* ====================== LIGA LEUMIT (16 real clubs), TOTO CUP, NATIONAL TEAM, HISTORY, LOANS, ECONOMY ====================== */
const LEUMIT16=[
 {id:'l_ash',name:'מ.ס. אשדוד',short:'אשדוד',city:'אשדוד',stadium:'אצטדיון י"א אשדוד',cap:7800,c1:'#f5d000',c2:'#d81e1e',str:58},
 {id:'l_byh',name:'בני יהודה',short:'בני יהודה',city:'תל אביב',stadium:'בלומפילד',cap:29400,c1:'#f97316',c2:'#111111',str:57},
 {id:'l_rsl',name:'הפועל ראשון לציון',short:'ראשל"צ',city:'ראשון לציון',stadium:'אצטדיון ראשון לציון',cap:6000,c1:'#5bc2e7',c2:'#ffffff',str:56},
 {id:'l_kym',name:'מ.ס. קריית ים',short:'קריית ים',city:'קריית ים',stadium:'אצטדיון קריית ים',cap:3000,c1:'#1d4ed8',c2:'#ffffff',str:54},
 {id:'l_afu',name:'הפועל עפולה',short:'עפולה',city:'עפולה',stadium:'אצטדיון עפולה',cap:5000,c1:'#d81e1e',c2:'#ffffff',str:54},
 {id:'l_kfs',name:'הפועל כפר שלם',short:'כפר שלם',city:'תל אביב',stadium:'אצטדיון הדר יוסף',cap:4000,c1:'#f5d000',c2:'#1d4ed8',str:54},
 {id:'l_raa',name:'הפועל רעננה',short:'רעננה',city:'רעננה',stadium:'אצטדיון רעננה',cap:5800,c1:'#1d4ed8',c2:'#ffffff',str:55},
 {id:'l_kfq',name:'מ.ס. כפר קאסם',short:'כפר קאסם',city:'כפר קאסם',stadium:'אצטדיון כפר קאסם',cap:3000,c1:'#1f8a3a',c2:'#ffffff',str:54},
 {id:'l_rei',name:'מכבי בני ריינה',short:'בני ריינה',city:'ריינה',stadium:'אצטדיון בראל',cap:5200,c1:'#111111',c2:'#f5d000',str:56},
 {id:'l_mod',name:'עירוני מודיעין',short:'מודיעין',city:'מודיעין',stadium:'אצטדיון מודיעין',cap:6000,c1:'#f97316',c2:'#1d4ed8',str:53},
 {id:'l_kgt',name:'מכבי קריית גת',short:'קריית גת',city:'קריית גת',stadium:'אצטדיון קריית גת',cap:4000,c1:'#f5d000',c2:'#1d4ed8',str:53},
 {id:'l_ahi',name:'מכבי אחי נצרת',short:'אחי נצרת',city:'נצרת',stadium:'אצטדיון עילוט',cap:4500,c1:'#f5d000',c2:'#1d4ed8',str:54},
 {id:'l_hrz',name:'מכבי הרצליה',short:'הרצליה',city:'הרצליה',stadium:'אצטדיון הרצליה',cap:6000,c1:'#f5d000',c2:'#1d4ed8',str:54},
 {id:'l_ksa',name:'הפועל כפר סבא',short:'כפר סבא',city:'כפר סבא',stadium:'אצטדיון לויטה',cap:5800,c1:'#1f8a3a',c2:'#ffffff',str:55},
 {id:'l_jfa',name:'מכבי יפו',short:'מכבי יפו',city:'תל אביב-יפו',stadium:'בלומפילד',cap:29400,c1:'#f97316',c2:'#1d4ed8',str:53},
 {id:'l_ako',name:'הפועל עכו',short:'עכו',city:'עכו',stadium:'אצטדיון עכו',cap:5000,c1:'#1d4ed8',c2:'#ffffff',str:53},
];
const ALEF_POOL=[['הפועל אום אל-פחם','אום אל-פחם','#1f8a3a','#ffffff'],['מ.ס. טירה','טירה','#1d4ed8','#ffffff'],['הפועל נוף הגליל','נוף הגליל','#d81e1e','#ffffff'],['שמשון תל אביב','תל אביב','#1d4ed8','#ffffff'],['הפועל הרצליה','הרצליה','#d81e1e','#ffffff'],['מכבי כפר כנא','כפר כנא','#f5d000','#1d4ed8'],['הפועל בית שאן','בית שאן','#d81e1e','#ffffff'],['עירוני נשר','נשר','#1d4ed8','#ffffff'],['הפועל מרמורק','רחובות','#d81e1e','#ffffff'],['בית"ר תל אביב רמלה','רמלה','#f5d000','#111111'],['הפועל ניר רמת השרון','רמת השרון','#d81e1e','#ffffff'],['מכבי שעריים','רחובות','#1d4ed8','#f5d000']];
function buildLeumitClub(def){const c={...def,league:false,div:'leumit',players:makeSquad(def.str||55),youth:makeYouth(7),formation:'4-4-2',P:0,W:0,D:0,L:0,GF:0,GA:0,pts:0,group:null,euro:null,sponsor:null,build:null,ticket:45,academy:1,training:1,money:Math.round(rnd(1.5e6,4e6)/1e5)*1e5,tier:4,prestige:0,realSquad:false,fans:40+ri(-5,8),focus:'bal',intensity:'mid',scouting:1};return c}
function alefClub(){const d=pick(ALEF_POOL.filter(x=>!G.leumit.some(c=>c.name===x[0])&&!G.clubs.some(c=>c.name===x[0]))||ALEF_POOL);return buildLeumitClub({id:'l'+(uid++),name:d[0],short:d[0].replace(/^(הפועל|מכבי|מ\.ס\.|עירוני|בית"ר) /,''),city:d[1],stadium:'אצטדיון '+d[1],cap:3500,c1:d[2],c2:d[3],str:52})}
function leumitClubs(){return G.leumit}
function myDiv(){const c=me();return c&&c.league?'top':'leumit'}
function divClubs(div){return div==='leumit'?G.leumit:leagueClubs()}
function standingsOf(div){return divClubs(div).slice().sort((a,b)=>b.pts-a.pts||(b.GF-b.GA)-(a.GF-a.GA)||b.GF-a.GF||a.name.localeCompare(b.name))}
function computeLeumitPrestige(){G.leumit.forEach(c=>{c.squadValue=c.players.slice().sort((a,b)=>b.value-a.value).slice(0,18).reduce((t,p)=>t+p.value,0);c.tier=4});const order=G.leumit.slice().sort((a,b)=>b.squadValue-a.squadValue);order.forEach((c,i)=>{c.prestige=15+i;c.lrank=i+1})}
function buildLeumitSeason(){const ids=shuffle(G.leumit.map(c=>c.id));const first=roundRobin(ids);const second=first.map(r=>r.map(([h,a])=>[a,h]));G.lfx=[...first,...second];G.lsched={};let r=1;G.cal.forEach((ev,i)=>{if(ev.t==='league'&&r<=36){G.lsched[i]=r++}});const last=G.cal.findIndex(ev=>ev.t==='cup'&&ev.s==='F');if(last>=0&&r===37)G.lsched[last]=37;G.lsplit=false}
function buildLeumitPlayoff(){const st=standingsOf('leumit');const top=st.slice(0,8).map(c=>c.id),bot=st.slice(8).map(c=>c.id);const t=roundRobin(top),b=roundRobin(bot);for(let i=0;i<7;i++)G.lfx.push([...(t[i]||[]),...(b[i]||[])]);G.leumit.forEach(c=>c.group=top.includes(c.id)?'top':'bot');G.lsplit=true}
function leumitRoundLabel(r){return r<=30?`לאומית · מחזור ${r}`:`לאומית · פלייאוף ${r-30}`}

/* ---- TOTO CUP ---- */
function buildToto(){const ids=shuffle(leagueClubs().map(c=>c.id));const A=ids.slice(0,7),B=ids.slice(7);const table={};ids.forEach(id=>table[id]={P:0,W:0,D:0,L:0,GF:0,GA:0,pts:0});G.toto={groups:{A,B},table,round:0,semis:null,finalists:null,winner:null,results:[]}}
function totoGroupOf(id){if(!G.toto)return null;return G.toto.groups.A.includes(id)?'A':G.toto.groups.B.includes(id)?'B':null}
function totoStandings(g){return G.toto.groups[g].map(id=>({id,...G.toto.table[id]})).sort((a,b)=>b.pts-a.pts||(b.GF-b.GA)-(a.GF-a.GA)||b.GF-a.GF)}
function playTotoWeek(stage,euroPlaying){
  if(!G.toto||G.toto.winner)return null;const busy=new Set(euroPlaying.map(c=>c.id));let my=null;const pairs=[];
  if(typeof stage==='number'){if(G.toto.round>=stage)return null;G.toto.round=stage;const sch=G.toto.sched&&G.toto.sched[stage];if(sch){for(const [h,a] of sch)pairs.push([h,a,`גביע הטוטו · בית ${totoGroupOf(h)} · מחזור ${stage}`])}else{for(const g of ['A','B']){const ids=shuffle(G.toto.groups[g]);for(let i=0;i+1<ids.length;i+=2)pairs.push([ids[i],ids[i+1],`גביע הטוטו · בית ${g} · מחזור ${stage}`])}}}
  else if(stage==='SF'){if(G.toto.results.some(r=>r.r==='SF'))return null;if(!G.toto.semis){const a=totoStandings('A'),b=totoStandings('B');if(a.length<2||b.length<2)return null;G.toto.semis=[[a[0].id,b[1].id],[b[0].id,a[1].id]]}G.toto.finalists=G.toto.finalists||[];for(const [x,y] of G.toto.semis)pairs.push([x,y,'גביע הטוטו · חצי הגמר'])}
  else if(stage==='F'){if(G.toto.results.some(r=>r.r==='F'))return null;if(!G.toto.finalists||G.toto.finalists.length<2)return null;pairs.push([G.toto.finalists[0],G.toto.finalists[1],'גביע הטוטו · הגמר'])}
  for(const [hid,aid,label] of pairs){const h=club(hid),a=club(aid);const M=createMatch(h,a,{kind:'toto',stage,label,neutral:stage==='F'});
    for(const c of [h,a])if(busy.has(c.id)){M.boost[c.id]=(M.boost[c.id]||0)-5}
    if((hid===G.me||aid===G.me)&&!busy.has(G.me))my=M;else{runInstant(M);if(stage!=='SF'&&stage!=='F'){}settle(M)}}
  return my;
}
function settleToto(M,h,a,rec){const T=G.toto;if(!T)return;const st=M.ctx.stage;
  if(typeof st==='number'){const upd=(c,f,ag)=>{const t=T.table[c.id];if(!t)return;t.P++;t.GF+=f;t.GA+=ag;if(f>ag){t.W++;t.pts+=3}else if(f===ag){t.D++;t.pts++}else t.L++};upd(h,M.gh,M.ga);upd(a,M.ga,M.gh);T.results.push({r:st,h:h.id,a:a.id,gh:M.gh,ga:M.ga});return}
  let winner;if(M.gh!==M.ga)winner=M.gh>M.ga?h:a;else{if(!M.pens)decidePens(M);rec.pens=M.pens;winner=M.pens==='h'?h:a}
  T.results.push({r:st,h:h.id,a:a.id,gh:M.gh,ga:M.ga,pens:M.pens});
  if(st==='SF'){T.finalists.push(winner.id)}
  else if(st==='F'){T.winner=winner.id;winner.money+=600000;winner.fans=clamp((winner.fans||50)+3,10,100);if(winner.id===G.me){addLog('פרס גביע הטוטו',600000);G.board.conf=clamp(G.board.conf+4,0,100)}news(`${winner.name} זכתה בגביע הטוטו!`);paperMajor('גביע',`${winner.name} זכתה בגביע הטוטו`,`${M.gh}:${M.ga}${M.pens?' בפנדלים':''} מול ${(winner===h?a:h).short}`,`התואר הראשון של העונה הולך ל${winner.short}. ${pick(['קופה קטנה, אבל ביטחון גדול לקראת הליגה.','המנג\'ר: "זה רק מתאבן".'])}`,winner.id)}
}
function viewToto(){const T=G.toto;if(!T)return `<div class="card"><div class="muted">גביע הטוטו ייערך לפני העונה הבאה.</div></div>`;
  const grp=g=>`<h3 class="sec" style="margin-top:10px">בית ${g}</h3><div class="scroll"><table class="tbl"><tr><th>קבוצה</th><th class="c">מש</th><th class="c">שערים</th><th class="c">נק</th></tr>${totoStandings(g).map((r,i)=>`<tr class="${r.id===G.me?'me':''} ${i<2?'top6':''}"><td><span class="row" style="gap:6px">${kitSVG(club(r.id),'sm')}${esc(club(r.id).short)}</span></td><td class="c num">${r.P}</td><td class="c num">${r.GF}:${r.GA}</td><td class="c num"><b>${r.pts}</b></td></tr>`).join('')}</table></div>`;
  const ko=T.results.filter(r=>r.r==='SF'||r.r==='F');
  return `<div class="card"><div class="row between"><h3 class="sec">גביע הטוטו ${seasonLabel()}</h3>${T.winner?`<span class="tag good">זוכה: ${esc(club(T.winner).short)}</span>`:`<span class="tag">מחזור ${T.round}/4</span>`}</div><div class="muted small" style="margin-top:4px">14 מועדוני ליגת העל בשני בתים, 4 מחזורים בקיץ. שתי הראשונות בכל בית לחצי הגמר. מועדונים שמשחקים באירופה באותו שבוע מציבים הרכב משני.</div>${grp('A')}${grp('B')}
  ${ko.length?`<h3 class="sec" style="margin-top:10px">שלב הנוקאאוט</h3>${ko.map(r=>`<div class="fx ${r.h===G.me||r.a===G.me?'me':''}"><span class="a">${esc(club(r.h).short)}</span><span class="s num">${r.gh}:${r.ga}${r.pens?'<small> פ</small>':''}</span><span class="h">${esc(club(r.a).short)} <span class="tag">${r.r==='F'?'גמר':'חצי גמר'}</span></span></div>`).join('')}`:''}</div>`}

/* ---- NATIONAL TEAM ---- */
const NT_GROUP=[{n:'איטליה',s:83},{n:'נורווגיה',s:78},{n:'ישראל',s:0},{n:'אסטוניה',s:57},{n:'מולדובה',s:52}];
function ntStrength(){const all=[...G.clubs,...G.leumit].flatMap(c=>c.players).filter(p=>!p.foreign&&p.nat!=='זר').sort(byOvr).slice(0,16);const avg=all.length?all.reduce((t,p)=>t+p.ovr,0)/all.length:64;return Math.round(avg+3)}
function ntSquad(){return [...G.clubs,...G.leumit].flatMap(c=>c.players.map(p=>({p,c}))).filter(x=>!x.p.foreign&&x.p.nat!=='זר'&&!x.p.inj).sort((a,b)=>b.p.ovr-a.p.ovr).slice(0,23)}
function ensureNT(){if(G.nt&&G.nt.season===G.season)return;const teams=NT_GROUP.map(t=>t.n);const rr=roundRobin(teams);const fixtures=[...rr,...rr.map(r=>r.map(([h,a])=>[a,h]))];G.nt={season:G.season,table:Object.fromEntries(teams.map(n=>[n,{P:0,W:0,D:0,L:0,GF:0,GA:0,pts:0}])),fixtures,played:0,results:[],scorers:{}}}
function ntBreak(evName){ensureNT();const NT=G.nt;const sq=ntSquad();const myCalled=sq.filter(x=>x.c.id===G.me);
  if(myCalled.length)news(`זומנו לנבחרת ישראל: ${myCalled.map(x=>fullName(x.p)).join(', ')}.`);
  for(const {p} of sq){p.caps=(p.caps||0)+2;p.morale=clamp((p.morale??65)+2,10,100)}
  const isr=ntStrength();const sOf=n=>n==='ישראל'?isr:NT_GROUP.find(t=>t.n===n).s;
  for(let k=0;k<2&&NT.played<NT.fixtures.length;k++){const round=NT.fixtures[NT.played++];
    for(const [h,a] of round){const sh=sOf(h),sa=sOf(a);const lh=Math.max(.2,1.3+(sh-sa)*.06+.2),la=Math.max(.2,1.3-(sh-sa)*.06);let gh=0,ga=0;for(let m=0;m<90;m++){if(Math.random()<lh/90)gh++;if(Math.random()<la/90)ga++}
      const upd=(n,f,ag)=>{const t=NT.table[n];t.P++;t.GF+=f;t.GA+=ag;if(f>ag){t.W++;t.pts+=3}else if(f===ag){t.D++;t.pts++}else t.L++};upd(h,gh,ga);upd(a,ga,gh);
      const rec={h,a,gh,ga,scorers:[]};
      if(h==='ישראל'||a==='ישראל'){const g=h==='ישראל'?gh:ga;for(let i=0;i<g;i++){const sc=pick(sq.filter(x=>x.p.pos!=='GK'));if(sc){sc.p.intGoals=(sc.p.intGoals||0)+1;NT.scorers[fullName(sc.p)]=(NT.scorers[fullName(sc.p)]||0)+1;rec.scorers.push(fullName(sc.p));if(sc.c.id===G.me){sc.p.morale=clamp(sc.p.morale+4,10,100);news(`${fullName(sc.p)} כבש לנבחרת ישראל מול ${h==='ישראל'?a:h}!`)}}}
        const opp=h==='ישראל'?a:h;const won=(h==='ישראל'?gh>ga:ga>gh);const draw=gh===ga;
        news(`נבחרת ישראל: ${h} ${gh}:${ga} ${a} (מוקדמות יורו).`);
        if(won||rec.scorers.some(n=>myCalled.some(x=>fullName(x.p)===n)))paper('נבחרת',won?`ישראל ניצחה את ${opp} ${h==='ישראל'?gh+':'+ga:ga+':'+gh}`:`ערב של ${rec.scorers[0]} במדי הנבחרת`,`${rec.scorers.length?'כובשים: '+rec.scorers.join(', '):'משחק ללא שערים ישראליים'}`,`${won?'ניצחון חשוב במוקדמות יורו. ':draw?'תיקו במוקדמות. ':'הפסד במוקדמות. '}${myCalled.length?`מ${me().short} שיחקו: ${myCalled.map(x=>fullName(x.p)).join(', ')}.`:''}`)}
      NT.results.push(rec)}}
}
function viewNT(){ensureNT();const NT=G.nt;const st=Object.entries(NT.table).sort((a,b)=>b[1].pts-a[1].pts||(b[1].GF-b[1].GA)-(a[1].GF-a[1].GA));const sq=ntSquad();
  return `<div class="card"><div class="row between"><h3 class="sec">נבחרת ישראל · מוקדמות יורו</h3><span class="tag info">כוח ${ntStrength()}</span></div><div class="scroll"><table class="tbl" style="margin-top:8px"><tr><th class="c">#</th><th>נבחרת</th><th class="c">מש</th><th class="c">נצ</th><th class="c">תי</th><th class="c">הפ</th><th class="c">שערים</th><th class="c">נק</th></tr>${st.map(([n,t],i)=>`<tr class="${n==='ישראל'?'me':''} ${i<2?'top6':''}"><td class="c num">${i+1}</td><td>${esc(n)}</td><td class="c num">${t.P}</td><td class="c num">${t.W}</td><td class="c num">${t.D}</td><td class="c num">${t.L}</td><td class="c num">${t.GF}:${t.GA}</td><td class="c num"><b>${t.pts}</b></td></tr>`).join('')}</table></div><div class="muted tiny" style="margin-top:6px">שתי הראשונות עולות ליורו. המשחקים נערכים בפגרות הנבחרת (4 בעונה, 2 משחקים בכל פגרה).</div></div>
  <div class="card"><h3 class="sec">הסגל הנוכחי (23 הישראלים הטובים)</h3><div class="list" style="margin-top:8px">${sq.map(({p,c})=>playerRow(p,'',c.id===G.me?'starter':'',`<span class="it">${kitSVG(c,'sm')} ${esc(c.short)}</span><span class="it">הופעות ${p.caps||0}</span><span class="it">שערים ${p.intGoals||0}</span>`).replace('data-pid','data-ntrow')).join('')}</div></div>
  ${NT.results.length?`<div class="card"><h3 class="sec">תוצאות</h3>${NT.results.slice().reverse().map(r=>`<div class="fx ${r.h==='ישראל'||r.a==='ישראל'?'me':''}"><span class="a">${esc(r.h)}</span><span class="s num">${r.gh}:${r.ga}</span><span class="h">${esc(r.a)}${r.scorers.length?` <span class="muted tiny">${esc(r.scorers.join(', '))}</span>`:''}</span></div>`).join('')}</div>`:''}`}

/* ---- HISTORY ---- */
function recordSeason(data){G.hist=G.hist||[];G.hist.unshift(data);G.hist=G.hist.slice(0,30)}
function honours(id){const h=G.hist||[];return {titles:h.filter(x=>x.champId===id).length,cups:h.filter(x=>x.cupId===id).length,totos:h.filter(x=>x.totoId===id).length,leumit:h.filter(x=>x.lchampId===id).length}}
function viewHistory(){const c=me();const h=G.hist||[];const hon=honours(c.id);const mine=G.results.filter(r=>r.h===G.me||r.a===G.me&&r.kind!=='friendly');
  const myRes=G.results.filter(r=>(r.h===G.me||r.a===G.me)&&r.kind!=='friendly').map(r=>({r,gf:r.h===G.me?r.gh:r.ga,ga:r.h===G.me?r.ga:r.gh}));
  const best=myRes.slice().sort((a,b)=>(b.gf-b.ga)-(a.gf-a.ga))[0],worst=myRes.slice().sort((a,b)=>(a.gf-a.ga)-(b.gf-b.ga))[0];
  const topScorer=c.players.slice().sort((a,b)=>(b.career||0)-(a.career||0))[0];
  return `<div class="card"><h3 class="sec">ארון הגביעים של ${esc(c.name)}</h3><div class="row wrap" style="margin-top:8px;gap:8px"><span class="tag good">🏆 אליפויות: ${hon.titles}</span><span class="tag good">🏆 גביע המדינה: ${hon.cups}</span><span class="tag">גביע הטוטו: ${hon.totos}</span>${hon.leumit?`<span class="tag">אליפות לאומית: ${hon.leumit}</span>`:''}</div>
  <dl class="kv" style="margin-top:10px"><dt>הניצחון הגדול העונה</dt><dd>${best&&best.gf>best.ga?`${esc(best.r.hn)} ${best.r.gh}:${best.r.ga} ${esc(best.r.an)}`:'—'}</dd><dt>ההפסד הקשה העונה</dt><dd>${worst&&worst.gf<worst.ga?`${esc(worst.r.hn)} ${worst.r.gh}:${worst.r.ga} ${esc(worst.r.an)}`:'—'}</dd><dt>שיא קהל</dt><dd>${c.attRecord?`${c.attRecord.n.toLocaleString('he')} מול ${esc(c.attRecord.opp)}`:'—'}</dd><dt>כובש הבית (קריירה במשחק)</dt><dd>${topScorer&&topScorer.career?`${esc(fullName(topScorer))} · ${topScorer.career}`:'—'}</dd></dl></div>
  <div class="card"><h3 class="sec">הקריירה של ${esc(G.manager.name)}</h3><div class="small" style="margin-top:6px">${G.manager.history.map(x=>`${x.season}: ${esc(x.club)} · מקום ${x.pos}${x.div==='leumit'?' (לאומית)':''}${x.champ?' · 🏆 אליפות':''}${x.cup?' · 🏆 גביע':''}${x.toto?' · 🏆 טוטו':''}${x.up?' · ⬆️ עלייה':''}${x.resigned?' · התפטר':x.left?' · עזב באמצע':''}`).join('<br>')||'העונה הראשונה'}</div><dl class="kv" style="margin-top:8px"><dt>חשבון בנק</dt><dd class="num">${NIS(G.manager.bank)}</dd><dt>אמון חדר ההלבשה</dt><dd class="num">${trust()}/100</dd></dl></div>
  <div class="card"><h3 class="sec">ספר העונות</h3>${h.length?`<div class="scroll"><table class="tbl" style="margin-top:8px"><tr><th>עונה</th><th>אלופה</th><th>גביע</th><th>טוטו</th><th>מלך שערים</th><th>אני</th></tr>${h.map(x=>`<tr><td>${x.season}</td><td>${esc(x.champ)}</td><td>${esc(x.cup)}</td><td>${esc(x.toto||'—')}</td><td>${x.topScorer?esc(x.topScorer.name)+' ('+x.topScorer.goals+')':'—'}</td><td>${esc(x.myClub)} · ${x.myPos}${x.myDiv==='leumit'?' (לאומית)':''}</td></tr>`).join('')}</table></div>`:'<div class="muted small" style="margin-top:6px">העונה הראשונה עדיין רצה.</div>'}</div>`}

/* ---- LOANS (players) ---- */
function loanFee(p){return Math.max(1000,Math.round(marketValue(p)*.1/1000)*1000)}
function requestLoan(nid){const n=negById(nid);if(!n||n.stage!=='club')return;const f=sellerClub(n.pid);if(!f)return;
  n.loanRequest=true;n.loanAsked=true;n.loanAsk=loanFee(f.p);n.offer={fee:n.loanAsk,inst:1,sellon:0};
  n.log.push(`מסלול השאלה לעונה: דמי השאלה מבוקשים ${NIS(n.loanAsk)}, בנפרד מהשכר. זו אינה הצעת רכישה.`);save()}
function submitLoanOffer(nid,fee){const n=negById(nid);if(!n||n.stage!=='club'||!n.loanRequest||n.loanRefused)return;
  if(!WINDOW(G.wk))return;const f=sellerClub(n.pid);if(!f){n.stage='dead';n.log.push('השחקן כבר לא זמין');save();return}const {p,c:sc}=f;const c=me();
  if(!Number.isFinite(fee)||fee<0)return;fee=Math.round(fee/1000)*1000;
  if(c.money<fee){n.log.push(`דמי השאלה: ${NIS(fee)}. אין מספיק תקציב.`);save();return}
  n.offer={fee,inst:1,sellon:0};n.rounds++;
  if(n.loanAvailable==null)n.loanAvailable=Math.random()<(n.key?.2:.8);
  if(!n.loanAvailable){n.loanRefused=true;n.log.push(`${sc.short}: "לא מסכימים להשאלה של השחקן." לא נשלחה הצעת רכישה. ניתן לבחור במפורש לעבור לרכישה.`);save();return}
  n.loanAsk=n.loanAsk||loanFee(p);
  if(fee<n.loanAsk*.85){n.loanCounter=n.loanAsk;n.patience--;n.log.push(`${sc.short}: "דמי ההשאלה המבוקשים הם ${NIS(n.loanAsk)} לעונה, לא מחיר רכישה."`);if(n.patience<=0){n.stage='dead';n.log.push('המשא ומתן על ההשאלה הסתיים.')}save();return}
  n.loan={fee,buy:Math.round(marketValue(p)*1.1/1e5)*1e5};n.stage='player';n.pdemand=playerDemand(p,c,sc);n.pdemand.years=1;n.pdemand.bonus=0;n.poffer={wage:n.pdemand.wage,years:1,role:n.pdemand.role,bonus:0};n.ppatience=2;
  n.log.push(`${sc.short} מסכימה להשאיל אותו לעונה תמורת ${NIS(fee)}. אופציית רכישה: ${NIS(n.loan.buy)} — אינה לתשלום עכשיו. עכשיו מסכמים שכר עם השחקן.`);save()}
function exerciseBuy(pid){const c=me();const p=c.players.find(x=>x.id===pid);if(!p||!p.loan)return;if(!WINDOW(G.wk))return toast('אפשר להפעיל אופציה רק בחלון פתוח');if(c.money<p.loan.buy)return toast('אין מספיק תקציב');
  c.money-=p.loan.buy;addLog(`הפעלת אופציית רכישה: ${fullName(p)}`,-p.loan.buy);news(`${fullName(p)} נרכש סופית מ${p.loan.fromName} תמורת ${NIS(p.loan.buy)}.`);const fromN=p.loan.fromName,buyFee=p.loan.buy;p.loan=null;p.contract=3;p.morale=clamp(p.morale+6,10,100);closeModal();save();recordSigning(p,c,'perm',{from:fromN,fee:buyFee});render()}
function returnLoans(){const c=me();for(const p of c.players.slice()){if(!p.loan)continue;const from=club(p.loan.from);c.players=c.players.filter(x=>x!==p);if(from){p.kn=2;p.lg=from.lg;if(from.lg){p.vmult=WORLD_LEAGUES[from.lg].vmult;p.wmult=WORLD_LEAGUES[from.lg].wmult}p.loan=null;p.contract=2;from.players.push(p)}news(`${fullName(p)} חזר מההשאלה ל${p.loan?p.loan.fromName:from?from.short:'המועדון שלו'}.`)}}

/* ---- BANK LOAN, BUDGET CONTROL, NAMING RIGHTS ---- */
function takeBankLoan(amount){const c=me();const max=Math.round(clamp(c.squadValue*.3,5e6,40e6));if(G.bank&&G.bank.left>0)return toast('יש כבר הלוואה פעילה');if(amount>max)return toast(`הבנק מאשר עד ${NIS(max)}`);
  const total=Math.round(amount*1.16);const weeks=92;G.bank={principal:amount,total,weekly:Math.round(total/weeks),left:weeks};c.money+=amount;addLog('הלוואה בנקאית',amount);G.board.conf=clamp(G.board.conf-Math.round(amount/5e6),0,100);news(`נלקחה הלוואה של ${NIS(amount)} (ריבית 8% לעונה, החזר על פני שתי עונות).`);paper('כספים',`${c.name} לקחה הלוואה של ${NIS(amount)}`,'ההחזר: '+NIS(G.bank.weekly)+' לשבוע במשך שתי עונות',`בהנהלה מסבירים שהכסף מיועד לחיזוק הסגל. ${pick(['בקרת התקציבים תעקוב.','האוהדים חוששים ממינוף יתר.','הבעלים חתם ערבות אישית.'])}`);save();render()}
function bankWeekly(){if(!G.bank||G.bank.left<=0)return;const c=me();c.money-=G.bank.weekly;G.bank.left--;addLog('החזר הלוואה',-G.bank.weekly);if(G.bank.left<=0){news('ההלוואה הבנקאית נפרעה במלואה.');G.bank=null}}
function budgetControl(){const c=me();if(c.money<-3e6){c.ptsPen=3;paper('ליגה',`בקרת התקציבים: ${c.name} תפתח את העונה עם 3- נקודות`,`גירעון של ${NIS(-c.money)} בסיום העונה`,`הרשות לבקרת תקציבים החליטה על הפחתת נקודות. ${pick(['במועדון שוקלים ערעור.','הבעלים הבטיח להזרים כסף.','האוהדים זועמים על ההנהלה.'])}`);news('בקרת התקציבים: 3- נקודות בעונה הבאה בגלל הגירעון.');G.board.conf=clamp(G.board.conf-8,0,100)}}
function namingOffer(c){return Math.round(c.cap*(c.ticket||70)*.9/1e5)*1e5}
function sellNaming(){const c=me();if(c.naming)return toast('יש כבר חוזה שם לאצטדיון');const sp=pickSponsorBrands(c,1,new Set([c.sponsor&&c.sponsor.name,...(c.ads||[]).map(a=>a.brand)]))[0].name;const amt=namingOffer(c);c.naming={name:sp,annual:amt,years:3,orig:c.stadium};c.stadium=`אצטדיון ${sp}`;c.fans=clamp(c.fans-3,10,100);news(`האצטדיון ייקרא "אצטדיון ${sp}" בשלוש העונות הבאות, ${NIS(amt)} לעונה.`);paper('כספים',`${c.orig||c.naming.orig} הופך ל"אצטדיון ${sp}"`,`זכויות השם נמכרו ב-${NIS(amt)} לעונה`,`האוהדים הוותיקים לא אוהבים את השינוי, אבל הכסף ייכנס לקופה כל שבוע. ${pick(['"נמשיך לקרוא לו בשם הישן", אומרים ביציע.','ההנהלה: "ככה עושים בכל אירופה".'])}`);save();render()}
function namingWeekly(){const c=me();if(!c.naming)return;const w=Math.round(c.naming.annual/46);c.money+=w;addLog('זכויות שם האצטדיון',w)}
function namingSeasonEnd(){for(const c of G.clubs){if(!c.naming)continue;c.naming.years--;if(c.naming.years<=0){c.stadium=c.naming.orig;c.naming=null;if(c.id===G.me)news('חוזה השם של האצטדיון הסתיים, השם המקורי חזר.')}}}

