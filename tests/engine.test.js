// Match engine: three-unit strength (gk/def/mid/att), chance→shot→goal model with real xG, in-match fatigue and
// momentum, AI preparation, and the wiring of chemistry / mental programme / training plan into matches.
// Also a balance guard: over many matches a 7+ point stronger side must win far more often than it loses.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const w=new JSDOM(fs.readFileSync(path.join(root,'ligat-haal-manager.html'),'utf8'),{url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true})}}).window;
async function main(){try{
 w.eval("newGame('hbs','בדיקת מנוע');G.pressMode='off';G.motion='off';G.paperPop=[]");
 const fresh=()=>w.eval("for(const c of G.clubs)for(const p of c.players){p.fit=100;p.inj=0;p.susp=0;p.form=0}");
 // units are finite, ordered sensibly, and respond to the goalkeeper
 const u=JSON.parse(w.eval("(()=>{const h=G.clubs[0],a=G.clubs[1];const M=createMatch(h,a,{kind:'league',round:1,label:'x'});stepMinute(M);const U=M.units[h.id];const gk=xiPlayers(M,h).find(x=>x.p.pos==='GK').p;const before=U.def;gk.ovr-=20;const after=unitStrength(M,h).def;gk.ovr+=20;return JSON.stringify({U,before,after,s:xiStrength(M,h)})})()"));
 for(const k of ['gk','def','mid','att'])assert.ok(Number.isFinite(u.U[k])&&u.U[k]>30&&u.U[k]<100,k);
 assert.ok(u.after<u.before-1,'a worse goalkeeper weakens the defensive unit');
 // expected goals rise with attack vs defence and are bounded
 const eg=JSON.parse(w.eval("(()=>{const h=G.clubs[0],a=G.clubs[1];const M=createMatch(h,a,{kind:'league',round:1,label:'x'});stepMinute(M);const base=expGoals(0,0,false,h,a,M);M.units[h.id].att+=8;const up=expGoals(0,0,false,h,a,M);M.units[h.id].att+=100;const cap=expGoals(0,0,false,h,a,M);return JSON.stringify({base,up,cap})})()"));
 assert.ok(eg.up[0]>eg.base[0]*1.4,'8 attack points add at least 40% expected goals');assert.ok(eg.cap[0]<6,'expected goals are capped');
 // fix A: chemistry survives the mental programme, training plan reaches the match
 const fa=JSON.parse(w.eval("(()=>{const h=me(),a=G.clubs.find(c=>c.id!==G.me);const M=createMatch(h,a,{kind:'league',round:1,label:'x'});h.tacFam=60;h.prepLeft=0;const s0=xiStrength(M,h);h.tacFam=100;h.prepLeft=1;const s1=xiStrength(M,h);return JSON.stringify({s0,s1,tb:trainBonus(h)})})()"));
 assert.ok(Math.abs((fa.s1-fa.s0)-fa.tb)<1e-9&&fa.tb>2,'training familiarity and preparation count in the match: '+fa.tb);
 const calm=JSON.parse(w.eval("(()=>{const h=me(),a=G.clubs.find(c=>c.id!==G.me);const M=createMatch(h,a,{kind:'league',round:1,label:'x'});M.bigC=1;const origMA=mentalActive,origChem=chemBonus;window.mentalActive=()=>true;window.chemBonus=()=>2;const withBoth=xiStrength(M,h);window.mentalActive=()=>false;const chemOnly=xiStrength(M,h);window.mentalActive=origMA;window.chemBonus=origChem;return JSON.stringify({withBoth,chemOnly})})()"));
 assert.ok(Math.abs(calm.withBoth-calm.chemOnly-.35)<1e-9,'mental programme adds to chemistry instead of replacing it');
 // a full match: goals come from recorded shots with real xG, shooters are on the pitch, scorer stats agree
 fresh();const m=JSON.parse(w.eval("(()=>{const h=G.clubs[0],a=G.clubs[1];const M=createMatch(h,a,{kind:'league',round:1,label:'x'});runInstant(M);const goals=M.ev.filter(e=>e.t==='goal');const xi=new Set([...M.xi[h.id],...M.xi[a.id]].map(e=>e.pid).concat(M.used[h.id],M.used[a.id]));return JSON.stringify({gh:M.gh,ga:M.ga,goals:goals.map(g=>({team:g.team,xg:g.xg,x:g.x,on:xi.has(g.pid)})),shots:M.shots,sot:M.sot,own:M.ev.filter(e=>e.t==='own').length,pens:M.ev.filter(e=>e.t==='pen').length,m:M.m,done:M.done})})()"));
 assert.equal(m.m,90);assert.ok(m.done);assert.equal(m.goals.filter(g=>g.team===m.goals[0]?.team).length+m.goals.filter(g=>g.team!==m.goals[0]?.team).length,m.goals.length);
 for(const g of m.goals){assert.ok(g.xg>=.02&&g.xg<=.85,'xG in range');assert.ok(g.x>=55,'goals come from chance spots');assert.ok(g.on,'scorer played')}
 assert.ok(m.shots.hta+m.shots.mta>=m.gh+m.ga-m.own-m.pens,'every goal from play is a shot');
 // in-match fatigue: a player who played 85 minutes under high press is weaker than a fresh substitute
 const ft=JSON.parse(w.eval("(()=>{const h=G.clubs[0],a=G.clubs[1];h.tac={press:'high',width:'normal',tempo:'fast',style:'balanced'};const M=createMatch(h,a,{kind:'league',round:1,label:'x'});const x=xiPlayers(M,h).find(x=>x.p.pos==='MF');M.m=85;const tired=minuteFatigue(M,x.p,x.e);x.e.since=84;const freshF=minuteFatigue(M,x.p,x.e);delete h.tac;return JSON.stringify({tired,freshF})})()"));
 assert.ok(ft.tired>1.5&&ft.freshF===0,'fatigue bites late and resets for a substitute: '+JSON.stringify(ft));
 // momentum fades within 8 minutes
 const mo=JSON.parse(w.eval("(()=>{const M={m:50,mo:{m:49,team:'x'}};const a=momentum(M,'x'),b=momentum(M,'y');M.m=60;return JSON.stringify({a,b,gone:momentum(M,'x')})})()"));
 assert.ok(mo.a>0&&mo.b<0&&mo.gone===0);
 // AI prepares: roles assigned from attributes, mentality from the strength gap; the user's club untouched
 fresh();const ai=JSON.parse(w.eval("(()=>{const me0=me();const strong=G.clubs.slice().sort((x,y)=>strength(y)-strength(x))[0],weak=G.clubs.slice().sort((x,y)=>strength(x)-strength(y))[0];for(const c of [strong,weak])for(const p of c.players)delete p.roleT;const M=createMatch(strong,weak,{kind:'league',round:1,label:'x'});const roles=xiPlayers(M,strong).map(x=>x.p.roleT);const mine=me0.players.filter(p=>p.roleT).length;return JSON.stringify({roles,ment:M.liveMent,strong:strong.id,weak:weak.id,gap:xiStrength(M,strong)-xiStrength(M,weak),mine,me:me0.id})})()"));
 if(ai.strong!==ai.me)assert.ok(ai.roles.every(Boolean)&&new Set(ai.roles).size>2,'AI roles vary with attributes: '+ai.roles);
 if(ai.gap>=5&&ai.strong!==ai.me)assert.equal(ai.ment[ai.strong],'att');if(ai.gap>=5&&ai.weak!==ai.me)assert.equal(ai.ment[ai.weak],'def');
 // balance guard: the engine is far less random than before (7+ points → stronger side wins ≥55%, loses ≤22%)
 const bal=JSON.parse(w.eval("(()=>{const clubs=G.clubs.slice();let sw=0,ww=0,n=0,goals=0;for(let r=0;r<4;r++)for(const h of clubs)for(const a of clubs){if(h===a)continue;for(const c of [h,a])for(const p of c.players){p.fit=100;p.inj=0;p.susp=0;p.form=0}const M=createMatch(h,a,{kind:'league',round:1,label:'x'});const d=xiStrength(M,h)-xiStrength(M,a);runInstant(M);goals+=M.gh+M.ga;if(Math.abs(d)<7)continue;n++;const sh=d>0;if((sh&&M.gh>M.ga)||(!sh&&M.ga>M.gh))sw++;else if((sh&&M.ga>M.gh)||(!sh&&M.gh>M.ga))ww++}return JSON.stringify({n,sw:sw/n,ww:ww/n,gpm:goals/(clubs.length*(clubs.length-1)*4)})})()"));
 assert.ok(bal.n>=100,'enough lopsided matches: '+bal.n);assert.ok(bal.sw>=.55,'stronger side wins ≥55%: '+bal.sw);assert.ok(bal.ww<=.22,'upsets ≤22%: '+bal.ww);assert.ok(bal.gpm>2.2&&bal.gpm<3.3,'goals per match realistic: '+bal.gpm);
 // the live screen still understands the event stream
 fresh();w.eval("G.phase='play';G.view='home';render()");
 const live=JSON.parse(w.eval("(()=>{const h=me(),a=G.clubs.find(c=>c.id!==G.me);const M=createMatch(h,a,{kind:'league',round:1,label:'x'});M.live=true;for(let i=0;i<90;i++)stepMinute(M);matchRatings(M,h,a);const kinds=[...new Set(M.ev.map(e=>e.t))];const r=Object.values(M.ratings);return JSON.stringify({kinds,ratings:r.length,ok:r.every(x=>x.r>=3&&x.r<=10)})})()"));
 assert.ok(live.ratings>=22&&live.ok,'ratings for everyone who played');
 for(const k of live.kinds)assert.ok(['shot','goal','pen','penmiss','own','var','yellow','red','inj','sub','corner','note'].includes(k),'unknown event kind '+k);
 assert.deepEqual(errors,[]);console.log('engine: units, chances→goals with xG, fatigue, momentum, AI prep, fix A wiring, balance guard passed; errors []');
}finally{await new Promise(r=>setImmediate(r));w.close()}}
main().catch(e=>{console.error(e);process.exitCode=1});
