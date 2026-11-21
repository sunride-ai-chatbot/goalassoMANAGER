/* ---- pre-season friendlies, the league cup and the national cup (BEGINNER_JS, after train.js) ----
   A season was a league and, for a few clubs, Europe. A real one has more matches in it:
   · friendlies before the first round (b.pre): two, against clubs of about his level from abroad. Nothing counts — no table, no board,
     no money, no experience — except what a match always does to players: whoever plays has had minutes, and somebody may get hurt.
     They can be skipped.
   · the Toto Cup (b.cups.toto; Israel's two top tiers, each with its own): the clubs of his league, knockout, early in the season, the
     first evening before the league begins. With fourteen clubs the two strongest sit the first evening out.
   · the national cup (b.cups.state; גביע המדינה, and its counterpart in every other country): up to thirty-two clubs of the country's
     leagues, knockout, from a third of the way into the season to its last weeks.
   A cup is drawn from the catalogue, by club key: only the club the coach is drawn against is built (a club is nine kilobytes of the
   save), and a tie he has no part in is decided by the two strengths and a dice. His own tie is a match like any other, played before
   the league round of its evening (Bextra, which also carries the friendlies and Europe). A level tie goes to penalties; a final is on
   neutral ground. Nothing here runs while a screen is drawn. */
const BCUP_NAME={il:'גביע המדינה',en:'הגביע האנגלי',es:'גביע המלך',it:'הגביע האיטלקי',de:'הגביע הגרמני',fr:'הגביע הצרפתי',nl:'הגביע ההולנדי',pt:'גביע פורטוגל',be:'הגביע הבלגי'};
const BCUP_STAGES=['שלב 32 האחרונות','שמינית הגמר','רבע הגמר','חצי הגמר','הגמר'],BCUP_AT={state:[.30,.46,.58,.74,.93],toto:[0,0,.11,.23,.35]},BCUP_PRIZE={state:[200000,300000,500000,1000000,3000000],toto:[0,100000,150000,250000,800000]},BCUP_KINDS=['toto','state'];
function BcupEntry(key){for(const co of Bcat())for(const l of co.leagues){const x=l.clubs.find(c=>c.key===key);if(x)return x}return null}
function BcupName(key){const c=BclubByKey(key);if(c)return c.name;const x=BcupEntry(key);return x?x.name:''}
function BcupStr(key){const c=BclubByKey(key);if(c)return strength(c);const x=BcupEntry(key);return x?x.str:50}
function BcupPairs(keys){const s=shuffle(keys.slice()),out=[];for(let i=0;i+1<s.length;i+=2)out.push([s[i],s[i+1]]);return out}
/* the club he is drawn against has to exist before its evening comes */
function BcupReady(K){const mine=me().bkey,t=K.ties.find(t=>t.includes(mine));if(!t)return;const o=t[0]===mine?t[1]:t[0];if(!BclubByKey(o)){const x=BcupEntry(o);if(x)BaddClub(x)}}
function BcupNew(kind,name,keys){const b=Bstate(),n=b.schedule.length,P=2**Math.ceil(Math.log2(keys.length)),st=Math.round(Math.log2(P)),at=BCUP_AT[kind].slice(-st).map(f=>clamp(Math.round(n*f),0,n-1));for(let i=1;i<at.length;i++)if(at[i]<=at[i-1])at[i]=Math.min(n-1,at[i-1]+1);
  const bye=keys.slice().sort((x,y)=>BcupStr(y)-BcupStr(x)).slice(0,P-keys.length);
  return {kind,name,season:b.season,stage:0,names:BCUP_STAGES.slice(-st),at,prize:BCUP_PRIZE[kind].slice(-st),alive:keys.slice(),bye,ties:BcupPairs(keys.filter(k=>!bye.includes(k))),res:[],out:false,won:false,champion:null}}
/* drawn when a season begins (Bseason). `late` is a career saved before all this: it gets the cups whose first evening is still ahead. */
function BcupsDraw(late){const b=Bstate();if(!late){b.cups={toto:null,state:null};b.pre=null}else b.cups=b.cups||{toto:null,state:null};if(window.__noExtras||b.daily||b.out||!me()||!b.schedule||!b.schedule.length)return;
  const l=BcatLeague(b.leagueId);if(!l||l.cup)return;const co=Bcat().find(c=>c.leagues.includes(l)),mine=me().bkey;if(!co||!mine)return;const take=K=>(!late||K.at[0]>b.round)?(BcupReady(K),K):null;
  if(!b.cups.state){const all=co.leagues.filter(x=>!x.cup).flatMap(x=>x.clubs.map(c=>({k:c.key,t:x.tier,s:c.str}))).sort((x,y)=>x.t-y.t||y.s-x.s).map(x=>x.k),size=Math.min(32,2**Math.floor(Math.log2(Math.max(1,all.length))));
    if(size>=8){const keys=all.slice(0,size);if(!keys.includes(mine))keys[size-1]=mine;b.cups.state=take(BcupNew('state',BCUP_NAME[co.id]||'הגביע',keys))}}
  if(!b.cups.toto&&co.id==='il'&&l.tier<=2){const keys=b.league.map(id=>club(id)&&club(id).bkey).filter(Boolean);if(keys.length>=8&&keys.includes(mine))b.cups.toto=take(BcupNew('toto','גביע הטוטו',keys))}
  if(!late)BpreDraw()}
/* two friendlies before the first round: clubs from abroad of about his level, among those the game has already built */
function BpreDraw(){const b=Bstate(),c=me(),s=strength(c),pool=G.clubs.filter(x=>x.id!==c.id&&!b.league.includes(x.id)&&x.country!==c.country&&x.players&&x.players.length>=14).map(x=>({x,d:Math.abs(strength(x)-s)})).sort((p,q)=>p.d-q.d).slice(0,8).map(p=>p.x);
  const pk=shuffle(pool).slice(0,2);b.pre=pk.length?{season:b.season,skip:false,list:pk.map((x,i)=>({id:x.id,home:i===0,res:null}))}:null}
/* a career from before, and a club he joined in mid-season: the cups are read for the club he has now */
function BcupsEnsure(){const b=Bstate();if(!b||b.daily)return;if(!b.cups)BcupsDraw(true);else for(const k of BCUP_KINDS){const K=b.cups[k];if(K&&!K.out&&K.stage<K.names.length)BcupReady(K)}}
function BcupsRekey(){const b=Bstate(),mine=me().bkey;if(!b.cups)return;b.pre=null;for(const k of BCUP_KINDS){const K=b.cups[k];if(!K)continue;const live=K.stage<K.names.length;K.won=!live&&K.champion===mine;K.out=live?!K.alive.includes(mine):!K.won;if(live&&!K.out)BcupReady(K)}}

/* ---- the next match that is not a league round: a friendly, a cup tie, a European night. It only reads. ---- */
function Bextra(){const b=Bstate(),c=me();if(!b||!c||b.out||b.daily||!b.schedule||!b.schedule[b.round])return null;const mine=c.bkey;
  if(b.pre&&b.pre.season===b.season&&b.round===0&&!b.pre.skip){const f=b.pre.list.find(x=>!x.res&&club(x.id));if(f)return {kind:'pre',pair:f.home?[c.id,f.id]:[f.id,c.id],title:'משחק הכנה',tag:'טרום עונה',ko:false,neutral:false,final:false}}
  for(const k of BCUP_KINDS){const K=b.cups&&b.cups[k];if(!K||K.out||K.stage>=K.names.length||b.round<K.at[K.stage])continue;const t=K.ties.find(t=>t.includes(mine)),h=t&&BclubByKey(t[0]),a=t&&BclubByKey(t[1]);if(!h||!a)continue;
    const fin=K.stage===K.names.length-1;return {kind:k,K,pair:[h.id,a.id],title:K.name+', '+K.names[K.stage],tag:K.name,ko:true,neutral:fin,final:fin}}
  const cl=BclTie();return cl?{kind:'cl',pair:cl,title:'ליגת האלופות, '+BCL_STAGES[b.cl.stage],tag:'אירופה',ko:true,neutral:b.cl.stage===3,final:b.cl.stage===3}:null}
/* the words over a match that is being played, from the match itself */
function BextraLabel(M){const b=Bstate(),x=M&&M.bX;if(!x)return '';if(x.kind==='pre')return 'משחק הכנה';const K=b.cups&&b.cups[x.kind];return K?K.name+' · '+(K.names[x.stage]||''):'גביע'}

/* ---- a tie nobody watches: the two strengths, the home ground and a dice ---- */
function BcupQuick(h,a,neutral){const d=BcupStr(h)-BcupStr(a)+(neutral?0:1.5),po=l=>{let k=0,p=Math.exp(-l),s=p;const u=Math.random();while(u>s&&k<8){k++;p*=l/k;s+=p}return k},gh=po(clamp(1.35+d*.07,.25,3.6)),ga=po(clamp(1.2-d*.07,.2,3.4));
  return {h,a,gh,ga,pens:gh===ga?true:null,w:gh>ga?h:ga>gh?a:Math.random()<clamp(.5+d*.02,.2,.8)?h:a}}
/* an evening is closed: the coach's match as it was played, every other tie by the dice, then the draw of the next round */
function BcupClose(K,M){const mine=me().bkey,st=K.stage,fin=st===K.names.length-1,row=[],next=st===0?K.bye.slice():[];
  for(const [h,a] of K.ties){const ch=BclubByKey(h),ca=BclubByKey(a);let r;
    if(M&&ch&&ca&&M.h===ch.id&&M.a===ca.id)r={h,a,gh:M.gh,ga:M.ga,pens:M.gh===M.ga?(M.penScore||true):null,w:M.gh>M.ga||(M.gh===M.ga&&M.pens==='h')?h:a};else{r=BcupQuick(h,a,fin);try{BfitQuick(ch);BfitQuick(ca)}catch(e){}}row.push(r);next.push(r.w)}
  K.res.push(row);K.alive=next;K.stage=st+1;if(!next.includes(mine))K.out=true;if(fin){K.champion=next[0];K.won=next[0]===mine;if(!K.won)K.out=true;K.ties=[]}else{K.ties=BcupPairs(next);if(!K.out)BcupReady(K)}}
/* evenings he has no part in (knocked out, or sitting one out) are played without him, so every cup gets its winner */
function BcupsNight(){const b=Bstate(),mine=me()&&me().bkey;if(!b||!b.cups||!mine)return;for(const k of BCUP_KINDS){const K=b.cups[k];if(!K)continue;let guard=0;
  while(K.stage<K.names.length&&b.round>=K.at[K.stage]&&guard++<8){const t=!K.out&&K.ties.find(t=>t.includes(mine));if(t&&BclubByKey(t[0])&&BclubByKey(t[1]))break;BcupClose(K,null)}}}

/* ---- after the whistle ---- */
function BextraFinish(M){return M.bX.kind==='pre'?BpreFinish(M):BcupFinish(M)}
function BresultBoard(M){return `<h2 class="bresult-board"><span>${kitSVG(club(M.h),'lg')}<strong>${esc(club(M.h).name)}</strong></span>${scoreSides(M.gh,M.ga,{label:club(M.h).name+' '+M.gh+', '+club(M.a).name+' '+M.ga})}<span>${kitSVG(club(M.a),'lg')}<strong>${esc(club(M.a).name)}</strong></span></h2>`}
function BpreFinish(M){const b=Bstate(),c=me(),home=M.h===c.id,f=b.pre&&b.pre.list.find(x=>!x.res&&x.id===(home?M.a:M.h));document.querySelector('.bdialog')?.remove();if(f)f.res={gf:home?M.gh:M.ga,ga:home?M.ga:M.gh};try{BdepthAfter(M)}catch(e){console.warn('depth',e)}
  /* minutes are minutes: whoever played is no longer waiting for a match, and nobody is counted as left out of one that counts for nothing */
  try{const on=new Set([...(M.xi[c.id]||[]).map(e=>e.pid),...((M.used&&M.used[c.id])||[])]);for(const p of c.players)if(on.has(p.id)){p.bOut=0;p.morale=clamp((p.morale??65)+1,10,100)}}catch(e){}
  const left=b.pre?b.pre.list.filter(x=>!x.res).length:0;Btab='home';Bwrite();Brender();
  Bdialog(`<div class="bresult"><span class="beyebrow">משחק הכנה · התוצאה לא נספרת</span>${BresultBoard(M)}<p class="bcl-verdict">${left?(left===1?'נשאר עוד משחק הכנה אחד לפני פתיחת העונה.':`נשארו עוד <bdi>${left}</bdi> משחקי הכנה לפני פתיחת העונה.`):'ההכנות הסתיימו. העונה מתחילה.'}</p>${BmatchFactsHTML(M)}${BratingsHTML(M)}<div class="bresult-foot">${Bbutton('ממשיכים','data-bclose')}</div></div>`)}
function BpaperCup(K,M,st,won,final){const c=me(),home=M.h===c.id,opp=club(home?M.a:M.h),score=`${M.gh}:${M.ga}`,pens=M.gh===M.ga,tail=`${score}${pens?' (פנדלים)':''} מול ${opp.name}`;
  if(final&&won)Bpaper('גביע',`${c.name} זכתה ב${K.name}!`,`${tail} בגמר`,`${c.name} מניפה את ${K.name}. ${pick(['האוהדים חוגגים עד הבוקר.','תואר שייזכר במועדון שנים.'])}`,{type:'cup',comp:K.name,club:c.name,clubId:c.id,score,opp:opp.name,pens});
  else if(!won)Bpaper('גביע',final?`${c.name} הפסידה בגמר ${K.name}`:`${c.name} הודחה מ${K.name}`,`${tail} ${BstIn(K.names[st])}`,`${final?'כל כך קרוב.':'המסע בגביע נגמר.'} ${pick(['עכשיו כל הכוח לליגה.','המאמן: "נחזור חזקים יותר".'])}`,null,final);
  else Bpaper('גביע',`${c.name} עלתה ${BstTo(K.names[st+1])} ב${K.name}`,tail,`${c.name} ממשיכה בגביע. ${pick(['ההגרלה כבר ידועה.','החלום ממשיך.'])}`,null,false)}
function BcupFinish(M){const b=Bstate(),K=b.cups[M.bX.kind],st=K.stage,c=me(),home=M.h===c.id,final=st===K.names.length-1,cash=[];document.querySelector('.bdialog')?.remove();
  if(home&&!final){const crowd=Math.min(c.cap,Math.round((c.baseDemand||c.cap*.75)*(K.kind==='state'?1.05:.6))),sum=crowd*(c.ticket||80);Bledger(`הכנסה מכרטיסים · ${K.name} · ${crowd.toLocaleString('he')} אוהדים`,sum);cash.push(['כרטיסים',sum])}
  BcupClose(K,M);BmoraleAfter(M);try{BdepthAfter(M)}catch(e){console.warn('depth',e)}const won=!K.out;try{BpaperCup(K,M,st,won,final)}catch(e){console.warn('paper',e)}
  if(won){if(K.prize[st]){Bledger(final?`פרס הזכייה ב${K.name}`:`פרס ${K.name} · עלייה ${BstTo(K.names[st+1])}`,K.prize[st]);cash.push([final?'פרס הזכייה':'פרס העלייה',K.prize[st]])}b.board=clamp((b.board==null?55:b.board)+(final?8:2),0,100);if(final)(b.honours=b.honours||[]).push({season:b.season,what:K.name,club:c.name})}
  BcupsNight();BclNight();Btab='home';let gain=null;try{gain=BxpMatch(M)}catch(e){console.warn('engage',e)}Bwrite();Brender();
  const pens=M.gh===M.ga?`<p class="bcl-pens">${won?'ניצחון':'הפסד'} בפנדלים${M.penScore?` <bdi>${M.penScore[home?0:1]}:${M.penScore[home?1:0]}</bdi>`:''}</p>`:'';
  const show=()=>Bdialog(`<div class="bresult"><span class="beyebrow">${esc(K.name)} · ${K.names[st]}</span>${BresultBoard(M)}${pens}<p class="bcl-verdict">${final&&won?`${esc(K.name)} שלכם!`:won?`עליתם ${BstTo(K.names[st+1])}.`:`המסע ב${esc(K.name)} הסתיים העונה. הליגה ממשיכה.`}</p>${cash.length?`<div class="bcl-cash"><p><span>נכנס לקופה הערב</span><strong>${Bmoney(cash.reduce((s,x)=>s+x[1],0))}</strong></p><ul>${cash.map(([t,v])=>`<li><span>${t}</span><b>${Bmoney(v)}</b></li>`).join('')}</ul></div>`:''}${BxpStripHTML(gain)}${BmatchFactsHTML(M)}${BratingsHTML(M)}<div class="bresult-foot">${BresultFoot()}</div></div>`);
  /* a cup is lifted before anybody reads a score */
  if(final&&won&&typeof openMoment==='function'){try{openMoment({id:'b-cup-'+K.kind+'-'+b.season,kind:'cup',comp:K.name,club:G.me,clubName:c.name,season:npSeasonOf({s:b.season}),shown:true},{onClose:show});if(document.getElementById('reveal'))return}catch(e){console.warn('moment',e);try{closeReveal(true)}catch(x){}}}show()}

/* ---- on the screens ---- */
function BcupLine(K){const b=Bstate(),mine=me().bkey;if(K.won)return 'הגביע שלכם!';
  if(K.out){const lost=K.res.findIndex(row=>row.some(r=>(r.h===mine||r.a===mine)&&r.w!==mine));return (lost<0?'המועדון לא משתתף העונה.':`${lost===K.names.length-1?'הפסדתם':'הודחתם'} ${BstIn(K.names[lost])}.`)+(K.champion?` הזוכה: ${esc(BcupName(K.champion))}.`:'')}
  if(K.stage>=K.names.length)return '';const t=K.ties.find(t=>t.includes(mine)),at=K.at[K.stage],when=at<=b.round?'':at===0?' · לפני פתיחת הליגה':` · אחרי מחזור <bdi>${at}</bdi>`;
  return t?`${K.names[K.stage]}: ${esc(BcupName(t[0]))} מול ${esc(BcupName(t[1]))}${when}`:`${K.names[K.stage]}: עליתם בלי לשחק${when}`}
function BcupsCard(){const b=Bstate(),rows=[];if(!b||b.out||b.daily)return '';
  if(b.pre&&b.pre.season===b.season&&b.round===0&&!b.pre.skip&&b.pre.list.some(x=>!x.res))rows.push(`<div class="bcups-row"><strong>משחקי הכנה</strong><p>${b.pre.list.map(x=>{const o=club(x.id);return o?(x.res?`<s>${esc(o.name)}</s> <bdi dir="ltr">${x.res.gf}:${x.res.ga}</bdi>`:esc(o.name)+(x.home?' (בית)':' (חוץ)')):''}).filter(Boolean).join(' · ')}</p><p class="bcl-stake">התוצאות לא נספרות. הזדמנות לנסות הרכב ולתת דקות לכולם.</p><button type="button" class="blink" data-action="skip-pre">לדלג ישר לעונה</button></div>`);
  for(const k of BCUP_KINDS){const K=b.cups&&b.cups[k];if(!K)continue;const live=!K.out&&!K.won&&K.stage<K.names.length,pz=live&&K.prize[K.stage];rows.push(`<div class="bcups-row${K.won?' won':K.out?' gone':''}"><strong>${esc(K.name)}</strong><p>${BcupLine(K)}</p>${pz?`<p class="bcl-stake">${K.stage===K.names.length-1?'הזכייה':'העלייה'} שווה <b>${Bmoney(pz)}</b></p>`:''}</div>`)}
  return rows.length?`<section class="bpanel bcl bcups"><div class="bcl-head"><span class="bstar" aria-hidden="true">★</span><div><span class="beyebrow">הגביעים</span><h2>עוד משחקים העונה</h2></div></div>${rows.join('')}</section>`:''}
function BcupTieHTML(r){const mine=me().bkey,hn=BcupName(r.h),an=BcupName(r.a);return `<li class="${r.h===mine||r.a===mine?'mine':''}"><span class="${r.w===r.h?'w':''}">${esc(hn)}</span>${r.gh==null?'<em>–</em>':scoreSides(r.gh,r.ga,{label:hn+' '+r.gh+', '+an+' '+r.ga})}<span class="${r.w===r.a?'w':''}">${esc(an)}</span>${r.pens?`<small>${esc(BcupName(r.w))} בפנדלים</small>`:''}</li>`}
/* under the league table: the last evening that was played and the draw that waits */
function BcupsLeagueHTML(){const b=Bstate();if(!b||!b.cups)return '';return BCUP_KINDS.map(k=>{const K=b.cups[k];if(!K)return '';const last=K.res.length?K.res[K.res.length-1]:null,open=K.stage<K.names.length&&K.ties.length;
  return `<section class="bpanel bcl"><div class="bcl-head"><span class="bstar" aria-hidden="true">★</span><div><span class="beyebrow">${esc(K.name)}</span><h2>${K.champion?'הזוכה: '+esc(BcupName(K.champion)):K.names[K.stage]}</h2><p>${BcupLine(K)}</p></div></div>${open?`<h3>${K.names[K.stage]} · ההגרלה</h3><ul class="bcl-ties">${K.ties.map(([h,a])=>BcupTieHTML({h,a})).join('')}</ul>${K.stage===0&&K.bye.length?`<p class="bmuted">עולות בלי לשחק: ${K.bye.map(x=>esc(BcupName(x))).join(', ')}.</p>`:''}`:''}${last?`<h3>${K.names[K.res.length-1]} · התוצאות</h3><ul class="bcl-ties">${last.map(BcupTieHTML).join('')}</ul>`:''}</section>`}).join('')}
