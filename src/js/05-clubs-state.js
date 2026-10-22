/* ====================== CLUB BUILD ====================== */
function buildClub(id){
  const raw=RAW.find(r=>r.id===id);const fb=FALLBACK[id];const meta=META[id];
  const c={id,name:raw?.name_he||fb.name,short:meta.short,city:meta.city,stadium:raw?.stadium_he||fb.stadium,cap:raw?.capacity||fb.cap,
    c1:raw?.colors?.[0]||fb.colors[0],c2:raw?.colors?.[1]||fb.colors[1],founded:raw?.founded||null,coach:raw?.coach_he||'',nick:raw?.nickname_he||'',
    league:true,players:[],youth:[],formation:'4-3-3',P:0,W:0,D:0,L:0,GF:0,GA:0,pts:0,group:null,euro:null,sponsor:null,build:null,ticket:80,realSquad:!!raw};
  if(raw&&raw.players.length>=14){
    const matched=raw.players.filter(p=>p.value_m!=null).map(p=>ratingFromValue(p.value_m,p.age));
    const median=matched.length?matched.sort((a,b)=>a-b)[Math.floor(matched.length/2)]:60;
    for(const r of raw.players){
      if(r.ft_only&&(r.age==null||r.age>21))continue;
      const p=fromRaw(r,median);
      if(r.ft_only&&p.age<=19){p.pot=Math.max(p.pot,p.ovr+8);c.youth.push(p)}else c.players.push(p);
    }
    for(const pos of POS){const min={GK:2,DF:6,MF:6,FW:3}[pos];while(c.players.filter(p=>p.pos===pos).length<min)c.players.push(makePlayer(pos,median-4))}
  }else{c.players=makeSquad({mta:70,hta:69,mhf:69,hbs:70,bje:67,hhf:64,hje:63,mnt:64,mpt:61,bsk:61,hpt:61,hrg:59,iks:59,itb:59}[id]||60)}
  while(c.youth.length<7)c.youth.push(...makeYouth(1));
  return c;
}
function buildLeumit(def){return {...def,league:false,players:makeSquad(55),youth:makeYouth(7),formation:'4-4-2',P:0,W:0,D:0,L:0,GF:0,GA:0,pts:0,group:null,euro:null,sponsor:null,build:null,ticket:50,academy:1,training:1,money:2e6,tier:4,prestige:0,realSquad:false}}
function euroOpp(comp,stage,strong){const [lo,hi]=EURO_STR[comp][stage];return clubFromDef(pickEuroClub(lo,hi,strong),'e')}
function friendlyOpp(c){const str=clamp(Math.round(strength(c)+rnd(-6,4)),48,80);const def=pickEuroClub(str-4,str+4,false);const o=clubFromDef(def,'f');o.stadium=o.stadium||'מחנה אימונים';return o}

/* ====================== GAME STATE ====================== */
let G=null;
const club=id=>{const k=id||G.me;return G.clubs.find(c=>c.id===k)||G.pseudo[k]||G.leumit.find(c=>c.id===k)||(G.world&&wclub(k))};
const me=()=>club();
const leagueClubs=()=>G.clubs.filter(c=>c.league);

function newGame(teamId,managerName){
  uid=1;
  const clubs=Object.keys(META).map(buildClub);clubs.forEach(c=>c.div='top');
  const leumit=LEUMIT16.map(buildLeumitClub);
  G={me:teamId,season:1,wk:0,clubs,leumit,pseudo:{},cal:[],fixtures:[],results:[],news:[],offers:[],freeAgents:[],paper:[],world:{},scouts:[],scoutMarket:[],reports:[],negs:[],payables:[],view:'home',phase:'contract',live:null,
     manager:{name:managerName||'המנג\'ר',wage:0,bank:0,seasonsLeft:2,history:[],trust:60},board:{conf:55,expectRank:9,expectText:''},cup:null,cupWinner:null,champion:null,log:[]};
  computePrestige();
  clubs.forEach(c=>{c.money=Math.round(clamp(c.squadValue*.3,3e6,50e6)/1e5)*1e5;c.training=c.tier===1?3:c.tier===2?2:1;c.academy=c.training;c.ticket=c.tier===1?90:c.tier===2?70:55;c.fans=(c.tier===1?70:c.tier===2?55:42)+ri(-4,4);c.focus='bal';c.intensity='mid';c.attRecord=null;c.scouting=1;
    const s=EURO_SEEDS[c.id];c.euro=s?{comp:s[0],stage:s[1],lp:null,tie:null,prize:0,history:[]}:null;
    if(c.id!==teamId)c.sponsor=sponsorOffers(c)[0]});
  for(let i=0;i<8;i++){const p=makePlayer(pick(['DF','MF','MF','FW','GK']),58);p.age=ri(26,33);p.contract=0;finalize(p);G.freeAgents.push(p)}
  startSeasonStructures();
  setContractTerms();migrateM2();ensureStaff();seedChem();
  save();
}
function computePrestige(){
  G.clubs.forEach(c=>{c.squadValue=c.players.slice().sort((a,b)=>b.value-a.value).slice(0,18).reduce((t,p)=>t+p.value,0)});
  const order=G.clubs.slice().sort((a,b)=>b.squadValue-a.squadValue);
  order.forEach((c,i)=>{c.prestige=i+1;c.tier=i<4?1:i<8?2:3});
  if(G.leumit)computeLeumitPrestige();
}
function startSeasonStructures(){
  G.fixtures=buildSeason();G.cal=buildCalendar();G.results=[];G.wk=0;
  for(const x of [...G.clubs,...(G.leumit||[])])for(const p of x.players)p.ovr0=p.ovr;
  buildLeumitSeason();buildToto();
  // State Cup: 14 league clubs + 2 Leumit clubs (my club always in)
  const myL=me()&&!me().league?[me()]:[];const leu=[...myL,...shuffle(G.leumit.filter(c=>!myL.includes(c))).slice(0,2-myL.length)];
  G.cup={stage:'R16',alive:[...leagueClubs().map(c=>c.id),...leu.map(c=>c.id)],results:[]};G.cupWinner=null;G.champion=null;
  G.clubs.forEach(c=>Object.assign(c,{P:0,W:0,D:0,L:0,GF:0,GA:0,pts:c.ptsPen?-c.ptsPen:0,group:null,xi:null,ptsPen:null}));
  G.leumit.forEach(c=>Object.assign(c,{P:0,W:0,D:0,L:0,GF:0,GA:0,pts:c.ptsPen?-c.ptsPen:0,group:null,xi:null,ptsPen:null}));
  autoLineups();ensureDraws();
}
function wageBill(c){return c.players.reduce((t,p)=>t+p.wage,0)}
function ensureWageCap(){const c=me();if(c&&G.board&&!(G.board.wageCapS===G.season&&G.board.wageCapClub===c.id)){G.board.wageCap=Math.round(wageBill(c)*1.15/1e4)*1e4;G.board.wageCapS=G.season;G.board.wageCapClub=c.id}return G.board.wageCap}
function setContractTerms(){
  const c=me();const r=c.prestige;
  let rank,text;
  if(!c.league){const lr=c.lrank||8;[rank,text]=lr<=3?[2,'עלייה לליגת העל']:lr<=8?[8,'פלייאוף העלייה']:[14,'הישארות בליגה הלאומית']}
  else [rank,text]=r===1?[1,'אליפות']:r===2?[2,'אליפות או סגנות']:r<=4?[3,'אחד משלושת המקומות הראשונים']:r<=6?[6,'פלייאוף עליון']:r<=9?[9,'אמצע הטבלה בלי מאבקי הישארות']:[12,'הישארות בליגה'];
  G.board.expectRank=rank;G.board.expectText=text;
  G.manager.wage=Math.round(clamp(c.squadValue*.0009,c.league?20000:9000,140000)/1000)*1000;
}
function roundRobin(ids){const n=ids.length,a=ids.slice(),rounds=[];for(let r=0;r<n-1;r++){const rr=[];for(let i=0;i<n/2;i++){const h=a[i],w=a[n-1-i];rr.push((r+i)%2?[w,h]:[h,w])}rounds.push(rr);a.splice(1,0,a.pop())}return rounds}
function buildSeason(){const ids=shuffle(leagueClubs().map(t=>t.id));const first=roundRobin(ids);const second=first.map(r=>r.map(([h,a])=>[a,h]));return [...first,...second]}
function buildPlayoff(){
  const st=standingsOf('top');const top=st.slice(0,6).map(c=>c.id),bot=st.slice(6).map(c=>c.id);
  const t1=roundRobin(top),t2=t1.map(r=>r.map(([h,a])=>[a,h]));const topR=[...t1,...t2];const botR=roundRobin(bot);
  const rounds=[];for(let i=0;i<10;i++)rounds.push([...(topR[i]||[]),...(botR[i]||[])]);
  leagueClubs().forEach(c=>c.group=top.includes(c.id)?'top':'bot');
  G.fixtures.push(...rounds);
}
function buildCalendar(){
  const ev=[];const E=(stage,leg)=>ev.push({t:'euro',stage,leg});const L=n=>ev.push({t:'league',n});const B=m=>ev.push({t:'break',m});const C=s=>ev.push({t:'cup',s});
  E('Q2',1);E('Q2',2);E('Q3',1);E('Q3',2);E('PO',1);E('PO',2);
  L(1);L(2);L(3);B('ספטמבר');L(4);E('LP',1);L(5);L(6);E('LP',2);L(7);B('אוקטובר');L(8);E('LP',3);L(9);L(10);E('LP',4);L(11);B('נובמבר');L(12);E('LP',5);L(13);C('R16');L(14);E('LP',6);L(15);L(16);E('LP',7);L(17);E('LP',8);L(18);L(19);C('QF');L(20);E('KOPO',1);L(21);E('KOPO',2);L(22);L(23);E('R16',1);L(24);E('R16',2);L(25);B('מרץ');L(26);L(27);E('QF',1);L(28);E('QF',2);C('SF');L(29);L(30);E('SF',1);L(31);E('SF',2);L(32);L(33);L(34);L(35);E('F',1);L(36);C('F');
  return ev;
}
function standings(){return standingsOf(myDiv())}
function myPos(){return standings().findIndex(c=>c.id===G.me)+1}
function leagueRoundPlayed(){return me().P}

/* ====================== SPONSORS ====================== */
function sponsorBase(c){return Math.round(clamp(c.squadValue*.12*(.75+(c.fans??55)/200),1.5e6,25e6)/1e5)*1e5}
function sponsorOffers(c){
  const brands=pickSponsorBrands(c,3,new Set((c.ads||[]).map(a=>a.brand)));
  return brands.map((brand,i)=>{const b=sponsorBudget(c,brand),round=v=>Math.round(v/1000)*1000;
    const terms=[{kind:'קבוע',annual:round(b),years:1,bonusTitle:0,bonusEuro:0,desc:'סכום שנתי מובטח, בלי בונוסים'},
      {kind:'ביצועים',annual:round(b*.8),years:1,bonusTitle:round(b*.35),bonusEuro:round(b*.2),desc:'סכום שנתי בסיסי ובונוסים על הישגים'},
      {kind:'ארוך טווח',annual:round(b*.95),years:2,bonusTitle:round(b*.15),bonusEuro:round(b*.1),desc:'חוזה לשנתיים; הסכום המוצג הוא לכל שנה'}][i];
    return {brandId:brand.id,name:brand.name,catalogVersion:1,...terms}});
}

// Shared career sponsorship catalog: identical selection rules for every difficulty.
// Existing signed contracts retain their names, amounts and expiry dates.
function sponsorBrand(ref){if(!ref)return null;const name=typeof ref==='string'?ref:(ref.name||ref.brand);
  return name?SPONSOR_CATALOG.find(b=>b.name===name)||null:SPONSOR_CATALOG.find(b=>b.id===ref.brandId)||null}
function sponsorClubLevel(c){return c.div==='leumit'||c.tier>=3?'local':c.tier===2?'regional':'national'}
function sponsorEligible(b,c){const level=sponsorClubLevel(c);return b.priority||b.level===level||(level==='national'&&b.level==='regional')}
function pickSponsorBrands(c,count,excluded){excluded=excluded||new Set();const recent=c.sponsorSeen||[];
  const byRecency=(a,b)=>{const rank=x=>{const i=recent.indexOf(x.id);return i<0?-1:i};return rank(a)-rank(b)};
  const pool=SPONSOR_CATALOG.filter(b=>sponsorEligible(b,c)&&!excluded.has(b.name));
  const preferred=shuffle(pool.filter(b=>b.priority)).sort(byRecency),others=shuffle(pool.filter(b=>!b.priority)).sort(byRecency);
  const chosen=preferred.slice(0,Math.min(2,count));
  for(const b of [...others,...preferred]){if(chosen.length>=count)break;if(!chosen.includes(b))chosen.push(b)}
  c.sponsorSeen=[...recent.filter(id=>!chosen.some(b=>b.id===id)),...chosen.map(b=>b.id)].slice(-20);
  return chosen;
}
function sponsorBudget(c,brand){const level=brand.priority?sponsorClubLevel(c):brand.level;
  const limits={local:[180000,1500000],regional:[1500000,8000000],national:[3000000,28000000]}[level];
  const raw=Number.isFinite(c.squadValue)?sponsorBase(c):limits[0];
  return Math.round(clamp(raw,limits[0],limits[1])/1000)*1000;
}
function sponsorLevelLabel(b){return {local:'עסק מקומי',regional:'מותג אזורי',national:'מותג גדול',partner:'מותג שותף'}[b.level]||''}

