/* ===================== SHARED LEAGUE — the catalogue and the match =====================
   Two phones have to play the same match. The engine (07-engine.js) is arithmetic over two squads and a stream
   of random numbers, so the whole of this file is about making those three things identical on both phones:

   the squads    are not sent by either manager. The server locks them (lg_fixture_lock) as a list of player
                 keys, and each phone builds the same players from the data it was built with: rating from the
                 price, age and potential from the key, attributes from an id that is a hash of the key.
   the numbers   come from a generator seeded by the server, installed as Math.random only while the engine runs
                 and taken away again, so nothing the screen draws in the meantime can shift the stream.
   the state     is a throw-away G that owes nothing to the career on this phone (or to there being one).

   A penalty stops the engine. The two managers choose through the server (lg_pen), the choices come back
   together, and the match is simply run again from the first minute with one more answered penalty in the log —
   it takes a few milliseconds, and a match that is always replayed from its log can be reopened on any phone at
   any time and come out the same.

   LG_SIM_SRC is a hash of the engine's source files, filled in by the build. With a hash of the player data it
   makes lgSimId(): two phones with different ids would simulate different matches, and are told so. */
const LG_SIM_SRC='__SIM_SRC__';
const LG_DIRS=['UL','U','UR','L','R','DL','D','DR'];
function lgRng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
function lgHashN(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0}
function lgDigest(s){let h1=0xdeadbeef,h2=0x41c6ce57;s=String(s);for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (h2>>>0).toString(16).padStart(8,'0')+(h1>>>0).toString(16).padStart(8,'0')}

/* ---- the catalogue: every real player the game ships, under the key the server's price list uses ----
   The key is the club's Hebrew name, a slash and the player's English name (scripts/build-league-pool.py). The
   same key listed twice keeps the dearer valuation, as the price list does. */
let LG_CAT=null;
function lgCatalog(){if(LG_CAT)return LG_CAT;const map=new Map();
  const add=(club,r,il)=>{if(!r||!r.en||!r.he||!(r.value_m>0))return;const key=club+'/'+r.en;if(key.length>80)return;const v=Math.round(r.value_m*1e6);const old=map.get(key);if(old&&old.v>=v)return;
    map.set(key,{key,club,he:r.he,en:r.en,pos:POS.includes(r.pos)?r.pos:'MF',age:Number.isInteger(r.age)&&r.age>=14&&r.age<=60?r.age:null,v,nat:r.nat||'',il})};
  for(const c of RAW||[])for(const r of c.players||[])add(c.name_he,r,true);
  for(const club in RAW_EURO||{})for(const r of RAW_EURO[club])add(club,r,false);
  const list=[...map.values()].sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
  let h=2166136261;for(const e of list){const s=e.key+'|'+e.v+'|'+(e.age??'')+'|'+e.pos+';';for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)}
  LG_CAT={list,map,hash:(h>>>0).toString(16).padStart(8,'0')};return LG_CAT}
function lgEntry(key){return lgCatalog().map.get(key)||null}
function lgSimId(){return LG_SIM_SRC.slice(0,12)+'.'+lgCatalog().hash}

/* ---- a player ----
   Rated by the one rule the game already has for real market values (euroRating), from the catalogue's value
   alone — not shifted by the club he comes from, because in a league where everybody pays the same price for him
   he has to be the same player for everybody. Age (where the data has none) and potential come from the key.
   Training adds whole points, more for the young, more on a better ground, never past his potential. */
function lgTrainRate(age){return age<=21?1:age<=25?.7:age<=29?.45:.25}
function lgStats(e,t,ground){const r=lgRng(lgHashN('p:'+e.key));const a0=19+Math.floor(r()*10),b=r(),age=e.age??a0;
  const ovr0=euroRating(e.v/1e6,age);
  const pot=age<=20?clamp(ovr0+8+Math.floor(b*9),ovr0,94):age<=23?clamp(ovr0+3+Math.floor(b*7),ovr0,92):age<=26?clamp(ovr0+Math.floor(b*4),ovr0,90):ovr0;
  const gain=Math.max(0,Math.min(pot-ovr0,Math.floor((t||0)*lgTrainRate(age)*(1+.15*(ground||0)))));
  return {age,ovr0,pot,gain,ovr:ovr0+gain}}
function lgPlayerId(key){return 1000000+lgHashN('id:'+key)%8000000}
function lgMakePlayer(e,t,ground){const s=lgStats(e,t,ground);const [first,last]=splitName(e.he);
  const p={id:lgPlayerId(e.key),first,last,pos:e.pos,age:s.age,nat:NAT_HE[e.nat]||e.nat||'',foreign:false,ovr:s.ovr,pot:s.pot,form:0,yellow:0,inj:0,susp:0,goals:0,apps:0,
    contract:3,morale:65,fit:100,sharp:70,real:true,en:e.en,from:e.club,lgKey:e.key,lgBase:s.ovr0,lgGain:s.gain,lgValue:e.v,
    visualId:e.il?(PLAYER_VISUALS.names[e.he]||null):(euroVisualId(e.club,e.en)||null)};
  assignPers(p);p.roleT=aiRoleFor(p);p.value=e.v;p.wage=0;return p}

/* ---- a club, from one side of a lock: {team, kit, crest, ground, setup, squad:[{p:key,t:sessions}]} ---- */
const LG_TAC0={press:'mid',width:'normal',tempo:'normal',style:'balanced'};
function lgCleanSetup(su){su=su&&typeof su==='object'?su:{};const tac={};for(const k of Object.keys(LG_TAC0))tac[k]=su.tac&&TAC[k][su.tac[k]]?su.tac[k]:LG_TAC0[k];
  return {formation:FORMATIONS[su.formation]?su.formation:'4-3-3',mentality:['att','bal','def'].includes(su.mentality)?su.mentality:'bal',tac,lineup:Array.isArray(su.lineup)?su.lineup.slice(0,11).map(x=>typeof x==='string'?x:null):null}}
function lgBuildClub(side,id){side=side||{};const kit=Object.assign({},kitDefault(lgHashN(side.team||id)),side.kit||{}),su=lgCleanSetup(side.setup);
  const used=new Set(),players=[];
  for(const row of (side.squad||[]).slice().sort((a,b)=>a.p<b.p?-1:a.p>b.p?1:0)){const e=lgEntry(row.p);if(!e)continue;const p=lgMakePlayer(e,+row.t||0,+side.ground||0);while(used.has(p.id))p.id++;used.add(p.id);players.push(p)}
  const c={id,name:side.team||'',short:side.team||'',c1:kit.c1,c2:kit.c2,country:'ליגה משותפת',players,youth:[],formation:su.formation,mentality:su.mentality,tac:su.tac,
    lineup:null,captain:null,training:1,focus:'bal',tier:2,stadium:'',lgKit:kit,lgCrest:side.crest||null,missing:(side.squad||[]).length-players.length};
  ensureNumbers(c);
  if(su.lineup){const by=new Map(players.map(p=>[p.lgKey,p.id])),seen=new Set();const slots=slotsFor(c.formation);
    c.lineup=slots.map((_,i)=>{const pid=by.get(su.lineup[i]);if(pid==null||seen.has(pid))return null;seen.add(pid);return pid})}
  else c.lineup=autoLineupFor(c);
  ensureCaptain(c);return c}

/* ---- the throw-away state the engine runs in. Identical on every phone: nothing of the local career is in it. ---- */
function lgSandbox(clubs,fn){const keep={G,uid,sb:SANDBOX,cap:MP.capture,capd:MP.captured,rand:Math.random};
  try{SANDBOX=true;uid=9000000;
    G={me:clubs[0].id,season:1,wk:1,clubs,leumit:[],pseudo:{},world:{},cal:[],fixtures:[],results:[],news:[],paper:[],freeAgents:[],staff:null,mental:null,mentalBoost:0,nextBoost:null,injSeq:0,live:null,mp:null,phase:'play',lgSim:true,manager:{name:''}};
    MP.capture=new Set(clubs.map(c=>c.id));MP.captured=[];
    return fn()}
  finally{G=keep.G;uid=keep.uid;SANDBOX=keep.sb;MP.capture=keep.cap;MP.captured=keep.capd;Math.random=keep.rand}}

/* ---- the match ----
   fx: {seed, lock:{home,away}, pens:[{t:'h'|'a', k, d, n, ak, ad, done}]}  (what lg_fixture_lock / lg_fixture_state return)
   →  {state:'done', rec}                       the whole match, with rec.digest
      {state:'pen',  rec, pen:{idx,side,m,…}}   stopped at a penalty the log has no answer for; rec is the match so far
      {state:'bad',  why}                       the log does not fit this match (a penalty for the other side) */
function lgSimulate(fx){const lock=fx&&fx.lock;if(!lock||!lock.home||!lock.away)return {state:'bad',why:'no_lock'};
  const h=lgBuildClub(lock.home,'lgh'),a=lgBuildClub(lock.away,'lga');const pens=fx.pens||[];
  return lgSandbox([h,a],()=>{const main=lgRng((+fx.seed||1)>>>0);Math.random=main;
    const M=createMatch(h,a,{kind:'league',label:'ליגה משותפת'});M.plan=null;M.anConf=null;M.live=false;
    const side=id=>id===h.id?'h':'a';
    const xi0={h:M.xi.lgh.map(e=>e.pid),a:M.xi.lga.map(e=>e.pid)};const shots=[];let idx=0,stop=null,bad=null;
    const ui={pen:()=>true};
    while(!M.done&&!stop&&!bad){stepMinute(M,ui);
      if(M.pendingPen){const pp=M.pendingPen;M.pendingPen=null;const c=pp.team===h.id?h:a,o=c===h?a:h,tk=c.players.find(p=>p.id===pp.pid);const gkx=xiPlayers(M,o).find(x=>x.p.pos==='GK');const gk=gkx?gkx.p:null;
        const info={idx,side:side(c.id),m:M.m,taker:tk?fullName(tk):'',takerId:tk?tk.id:null,keeper:gk?fullName(gk):'',keeperId:gk?gk.id:null};const e=pens[idx];
        if(!e||!e.done){stop=info;M.pendingPen=pp;break}
        if(e.t!==info.side){bad='pen_mismatch';break}
        /* The choices decide where the ball and the keeper go, and the server's own number for this kick (e.n, drawn
           when both choices were in) decides the rest: how far the ball strays and whether a keeper who guessed
           right holds it. Nothing of that can be worked out beforehand from the fixture's seed, and the match's
           main stream is the same whether a penalty was scored or saved by a hair. */
        const pr=lgRng(lgHashN('pen:'+fx.seed+':'+idx+':'+(e.n==null?'':e.n)));
        const kd=LG_DIRS.includes(e.k)?e.k:'D',gd=LG_DIRS.includes(e.d)?e.d:'D';
        const r=pcupResolve(kd,gd,tk?penShootSkill(tk):60,penKeepSkill(gk),pr);
        penResolve(M,c,tk,r.out,r.how);shots.push(Object.assign(info,{kd,gd,x:r.x,y:r.y,how:r.how,out:r.out,autoK:!!e.ak,autoD:!!e.ad}));idx++}}
    if(bad)return {state:'bad',why:bad};
    const name=(c,pid)=>{const p=c.players.find(x=>x.id===pid);return p?fullName(p):''};
    const ev=M.ev.map(e=>{const o={m:e.m,t:e.t,team:side(e.team),name:e.name||''};if(e.sub)o.sub=e.sub;if(e.asstName)o.asst=e.asstName;if(e.out)o.out=e.out;if(e.how)o.how=e.how;if(e.quiet)o.quiet=1;if(e.t==='own')o.og=side(e.ogteam);if(e.weeks)o.weeks=e.weeks;if(e.shooter)o.shooter=e.shooter;if(e.ok!=null)o.ok=e.ok;return o});
    const rec={gh:M.gh,ga:M.ga,m:M.m,ev,pens:shots,
      home:{team:h.name,kit:h.lgKit,crest:h.lgCrest,formation:h.formation,mentality:h.mentality},away:{team:a.name,kit:a.lgKit,crest:a.lgCrest,formation:a.formation,mentality:a.mentality},
      xi:{h:xi0.h.map(pid=>{const p=h.players.find(x=>x.id===pid);return {key:p.lgKey,name:fullName(p),pos:p.pos,ovr:p.ovr,no:p.no}}),a:xi0.a.map(pid=>{const p=a.players.find(x=>x.id===pid);return {key:p.lgKey,name:fullName(p),pos:p.pos,ovr:p.ovr,no:p.no}})},
      shots:{h:M.shots.lgh,a:M.shots.lga},sot:{h:(M.sot||{}).lgh||0,a:(M.sot||{}).lga||0},corners:{h:(M.corners||{}).lgh||0,a:(M.corners||{}).lga||0},
      poss:{h:Math.round(M.poss.lgh/Math.max(1,M.poss.lgh+M.poss.lga)*100)},missing:{h:h.missing,a:a.missing}};
    rec.poss.a=100-rec.poss.h;
    if(stop)return {state:'pen',pen:stop,rec};
    const R=matchRatings(M,h,a),best=manOfMatch(M,h,a);
    rec.ratings={h:[],a:[]};for(const c of [h,a])for(const p of c.players){const s=R[p.id];if(s)rec.ratings[side(c.id)].push({key:p.lgKey,name:fullName(p),pos:p.pos,r:s.r,g:s.g,a:s.a,min:s.min})}
    rec.ratings.h.sort((x,y)=>y.r-x.r);rec.ratings.a.sort((x,y)=>y.r-x.r);
    rec.motm=best?{name:best.name,team:side(best.team),r:best.r}:null;
    rec.xg={h:+M.ev.filter(e=>e.team===h.id&&e.xg&&['goal','pen','shot','penmiss'].includes(e.t)).reduce((t,e)=>t+e.xg,0).toFixed(2),a:+M.ev.filter(e=>e.team===a.id&&e.xg&&['goal','pen','shot','penmiss'].includes(e.t)).reduce((t,e)=>t+e.xg,0).toFixed(2)};
    /* what the two phones have to agree on: the score and every event of the match, in order */
    rec.digest=lgDigest(JSON.stringify([rec.gh,rec.ga,ev.map(e=>[e.m,e.t,e.team,e.name,e.sub||'',e.how||'']),shots.map(s=>[s.idx,s.side,s.kd,s.gd,s.out])]));
    return {state:'done',rec}})}
