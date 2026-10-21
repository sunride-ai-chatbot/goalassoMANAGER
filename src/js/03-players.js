/* ====================== PLAYER MODEL ====================== */
function ratingFromValue(v,age){let o=66+5*Math.log2(Math.max(v,.05));if(age!=null&&age<21)o+=2;return clamp(Math.round(o),46,86)}
function potentialFor(ovr,age){if(age<=20)return clamp(ovr+ri(8,16),ovr,92);if(age<=23)return clamp(ovr+ri(3,9),ovr,90);if(age<=26)return clamp(ovr+ri(0,3),ovr,88);return ovr}
function playerValue(p){const f=p.age<23?1.25:p.age<29?1:p.age<32?.75:p.age<34?.5:.3;return Math.round(4e6*Math.pow(2,(p.ovr-66)/5)*f/10000)*10000}
function playerWage(p){return Math.round(9000*Math.pow(2,(p.ovr-58)/6)/500)*500}
function finalize(p){if(p.id&&!p.pers)assignPers(p);p.value=playerValue(p);if(p.contract!=null&&p.contract<=1)p.value=Math.round(p.value*.65/1e4)*1e4;if(p.wage==null)p.wage=playerWage(p);return p}
function initialContract(age){return age<=23?ri(2,4):age<=29?ri(1,3):ri(1,2)}
function contractYear(p){return 2026+G.season-1+(p.contract||0)}
function contractDemand(p){const base=playerWage(p);const mult=(1+(p.age<=25?.35:p.age<=30?.2:.05)+(p.form>1?.1:0)+(p.ovr>=p.pot-2?0:.05)+(p.hype||0)*.08)*(p.pers?persWageMult(p):1);return {wage:Math.round(base*mult/500)*500,years:p.age<=25?3:p.age<=30?2:1,bonus:Math.round(base*mult*8/1e4)*1e4}}
function splitName(he){const parts=he.trim().split(/\s+/);if(parts.length===1)return[parts[0],''];return[parts[0],parts.slice(1).join(' ')]}
function fromRaw(r,median){
  const age=r.age??ri(19,29);
  let ovr=r.value_m!=null?ratingFromValue(r.value_m,age):clamp(Math.round(median-3+gauss()*3),46,80);
  if(r.ft_only)ovr=clamp(ovr-3,44,80);
  const [first,last]=splitName(r.he);
  const nat=r.nat||'Israel';
  return finalize({id:uid++,first,last,visualId:PLAYER_VISUALS.names[r.he]||null,pos:r.pos,age,nat:NAT_HE[nat]||nat,foreign:nat!=='Israel',ovr,pot:potentialFor(ovr,age),form:0,yellow:0,inj:0,susp:0,goals:0,apps:0,contract:initialContract(age),morale:ri(58,74),fit:100,real:!r.unmatched&&!r.ft_only});
}
function makePlayer(pos,base,youth,forceForeign){
  const foreign=forceForeign??(!youth&&Math.random()<.22);
  const nm=foreign?pick(FOREIGN):[pick(FIRST),pick(LAST)];
  const age=youth?ri(15,18):ri(18,34);
  const ovr=clamp(Math.round(base+gauss()*5+(age<21?-6:age>32?-3:0)),youth?32:44,88);
  const pot=youth?clamp(Math.round(ovr+rnd(14,40)),50,92):potentialFor(ovr,age);
  return finalize({id:uid++,first:nm[0],last:nm[1],visualId:null,pos,age,nat:foreign?'זר':'ישראל',foreign,ovr,pot,form:0,yellow:0,inj:0,susp:0,goals:0,apps:0,contract:youth?3:initialContract(age),morale:ri(58,74),fit:100,real:false});
}
function makeSquad(base){const sq=[];const plan={GK:3,DF:8,MF:8,FW:5};for(const pos of POS)for(let i=0;i<plan[pos];i++)sq.push(makePlayer(pos,base));return sq}
function makeYouth(n){const out=[];for(let i=0;i<n;i++)out.push(makePlayer(pick(['GK','DF','DF','MF','MF','FW']),45,true));return out}

