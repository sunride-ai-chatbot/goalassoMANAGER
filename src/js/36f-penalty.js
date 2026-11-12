/* ====================== PENALTIES: the manager takes them himself ======================
   A small skill game on top of the match engine. The engine only learns the outcome: penResolve() for a penalty during a
   match, M.pens / M.penScore for a shoot-out. Nothing here touches money, squads or the save format.

   Goal coordinates: x metres from the middle of the goal (posts at ±3.66), y metres above the grass (bar at 2.44).
   Kicking (עיני הבועט): press, steer the sight to a spot and release. The sight sways: little for a good finisher, a lot
   for a defender, more on tired legs and under pressure. Corners beat the keeper but the frame is close.
   Keeping (עיני השוער): swipe to the side the ball goes. Moving before the kick is a guess; moving right after it, inside
   the keeper's reaction window, is a read. Standing still covers the middle. */
const PEN_G={hw:3.66,h:2.44};const PEN_TIME=10000;
function penShootSkill(p){const at=attrs(p);return p.pos==='GK'?clamp(at[3],35,80):clamp(at[1]*.75+at[3]*.25,35,96)}
function penKeepSkill(p){if(!p)return 45;const at=attrs(p);return p.pos==='GK'?clamp(at[0]*.6+at[2]*.4,35,96):40}
function penWobble(skill,energy,pressure){return +(clamp(.66-(skill-55)*.0115,.16,.78)*(energy<70?1.2:1)*(pressure?1.12:1)).toFixed(3)}
function penReactMs(gk){return Math.round(clamp(340+(gk-60)*5,300,520))}
function penFrame(x,y){const ax=Math.abs(x);if(ax>PEN_G.hw+.09||y>PEN_G.h+.09)return 'off';if(ax>PEN_G.hw-.05||y>PEN_G.h-.05)return 'post';return 'in'}
/* the kick's own clock counts only what the player was shown: a slow frame, or a tab that was away, adds a tenth of a second at most */
function penClock(now){let last=now,ms=0;return {tick(n){ms+=Math.min(100,Math.max(0,n-last));last=n;return ms},get ms(){return ms}}}
function penSide(x){return x<-.9?'L':x>.9?'R':'C'}
/* how hard a ball is to reach: 0 straight at the keeper, 1 the top corner */
function penCorner(x,y){const ax=Math.abs(x);return clamp((ax-1.1)/2.5,0,1)*.62+clamp(y/PEN_G.h,0,1)*.38*(ax>.9?1:.4)}
function penSaveP(x,y,gk,bonus){return clamp(.97-penCorner(x,y)*1.06+(gk-70)*.006+(bonus||0),.03,.96)}
/* an AI keeper: sometimes he reads the taker, otherwise he picks a side */
function penKeeperGuess(x,gk){const read=clamp(.12+(gk-65)*.006,.05,.3);if(Math.random()<read)return penSide(x);const r=Math.random();return r<.42?'L':r<.84?'R':'C'}
function penKickOutcome(x,y,gk){const dive=penKeeperGuess(x,gk);const f=penFrame(x,y);if(f!=='in')return {out:'miss',how:f,dive};
  if(dive===penSide(x)&&Math.random()<penSaveP(x,y,gk))return {out:'miss',how:'save',dive};return {out:'goal',how:'goal',dive}}
/* an AI taker: better finishers find the corners */
function penAiShot(skill){const r=Math.random();const side=r<.43?-1:r<.86?1:0;const q=clamp((skill-50)/45,0,1);
  const x=side===0?gauss()*.45:side*clamp(1.5+q*1.3+gauss()*.7,.95,4.2);const y=clamp(.25+Math.abs(gauss())*(.85+q*.4),.1,3);return {x:+x.toFixed(2),y:+y.toFixed(2)}}
/* the user in goal: side he went to ('L'|'C'|'R', as he sees it), and when: 'early' (a guess), 'react' (a read) or 'late' */
function penKeepOutcome(x,y,side,timing,gk){const f=penFrame(x,y);if(f!=='in')return {out:'miss',how:f};
  if(timing==='late'||(side||'C')!==penSide(x))return {out:'goal',how:'goal'};
  return Math.random()<penSaveP(x,y,gk,timing==='early'?.06:0)?{out:'miss',how:'save'}:{out:'goal',how:'goal'}}
/* a shoot-out is over when the side behind cannot catch up inside the first five, or after an equal number of kicks from the sixth on */
function penShootoutDone(h,a){const nh=h.length,na=a.length,sh=h.reduce((t,v)=>t+v,0),sa=a.reduce((t,v)=>t+v,0);
  if(nh<=5&&na<=5){if(sh>sa+(5-na))return 'h';if(sa>sh+(5-nh))return 'a';if(nh===5&&na===5&&sh!==sa)return sh>sa?'h':'a';return null}
  return nh===na&&sh!==sa?(sh>sa?'h':'a'):null}
function penOrder(M,c){return xiPlayers(M,c).map(x=>x.p).sort((p,q)=>penShootSkill(q)-penShootSkill(p))}
/* players decide it themselves: the same odds decidePens uses, with a believable score line */
function penAutoShootout(M,h,a){decidePens(M);const w=M.pens;const [x,y]=pick([[5,4],[4,3],[5,3],[4,2],[3,2],[6,5]]);return {win:w,score:w==='h'?[x,y]:[y,x],auto:true}}

/* ---- the picture: two renderers behind one interface ------------------------------------------------------------
   toScreen(x,y) → [px,py] inside the stage · fromScreen(px,py) → [x,y] in goal metres
   kick view   shoot({x,y,how,dive},done)
   keeper view runUp(ms,done) · incoming({x,y,ms,how:()=>…},done) · gloves(side)   (x positive = the keeper's right)
   The 3D one (assets/demo3d/penalty.js, the stadium of the 3D highlights) is tried first on capable devices; the SVG one
   below is the fallback, and what runs when motion is reduced. */
let pen3dMod=null,pen3dBad=false;
/* the 3D picture needs a graphics chip: a browser that would draw it in software gets the flat picture from the start
   (G.pen3d===true, set by the live check, takes the 3D view whatever draws it; G.pen3d===false never does) */
function pen3dOK(){try{if(pen3dBad||typeof WebGLRenderingContext==='undefined'||motionLevel()!=='full'||(G&&G.pen3d===false))return false;
  const any=!!(G&&G.pen3d===true),k=any?'any':'gl';
  if(pen3dOK[k]==null){const c=document.createElement('canvas'),o=any?undefined:{failIfMajorPerformanceCaveat:true};pen3dOK[k]=!!(c.getContext('webgl2',o)||c.getContext('webgl',o))}return pen3dOK[k]}catch(e){return false}}
function penPreload(){if(!pen3dOK()||pen3dMod)return;try{pen3dMod=import('./assets/demo3d/penalty.js').catch(()=>{pen3dBad=true;pen3dMod=null;return null})}catch(e){pen3dBad=true}}
function penMakeStage(host,mode,o){const flat=()=>penStage2d(host,mode,o);const pg=PG;
  if(pg&&pg.view3d&&pen3dBad){try{pg.view3d.dispose()}catch(e){}pg.view3d=null}   /* the device proved too slow for it during the last kick */
  if(pg&&pg.view3d){try{pg.view3d.reset(mode,o);return Promise.resolve(pg.view3d)}catch(e){pen3dBad=true;try{pg.view3d.dispose()}catch(e2){}pg.view3d=null}}
  if(!pen3dOK())return Promise.resolve(flat());
  penPreload();if(!pen3dMod)return Promise.resolve(flat());
  return new Promise(res=>{let settled=false;const fin=st=>{if(settled){try{st&&st.kind==='3d'&&st.dispose()}catch(e){}return}settled=true;res(st)};
    const t=setTimeout(()=>fin(flat()),3200);
    pen3dMod.then(mod=>{if(settled)return;if(!mod||!host.isConnected||PG!==pg){clearTimeout(t);return fin(flat())}
      let st=null;try{st=mod.createPenaltyView(host,{mode,kit:o.kit,trim:o.trim,gkKit:o.gkKit,oppKit:o.oppKit,oppTrim:o.oppTrim,number:o.number,onError:()=>{pen3dBad=true},onSlow:()=>{pen3dBad=true}})}catch(e){pen3dBad=true;st=null}
      clearTimeout(t);if(st&&pg)pg.view3d=st;fin(st||flat())}).catch(()=>{clearTimeout(t);fin(flat())})})}
function penAnim(ms,step,done){if(ms<=0){step(1);done&&done();return}const t0=performance.now();(function fr(){const u=Math.min(1,(performance.now()-t0)/ms);step(u);if(u<1)requestAnimationFrame(fr);else done&&done()})()}
function penQuick(){return typeof revealReduced==='function'&&revealReduced()}
function penStage2d(host,mode,o){const S=34.15,GX=180,GY=215;const kit=o.kit||'#c6f24e',gk=o.gkKit||'#f2b233',ink=inkFor(kit);
  /* a phone stage is a tall portrait: show the middle 300 units and fill it; a wide stage shows the whole scene */
  const hr=host.getBoundingClientRect();const wide=!!(hr.width&&hr.height&&hr.width/hr.height>.82);const VX=wide?0:30,VW=wide?360:300;const vb=`viewBox="${VX} 0 ${VW} 460" preserveAspectRatio="xMidYMid ${wide?'meet':'slice'}"`;
  const crowd=(y0,y1,n,seed)=>{let s=seed,out='';const rnd2=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};for(let i=0;i<n;i++){const x=rnd2()*360,y=y0+rnd2()*(y1-y0);out+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.1+rnd2()*.9).toFixed(1)}" fill="${['#d9c58a','#8fa3b8','#e7e3d6','#5f7186','#c6f24e'][Math.floor(rnd2()*5)]}" opacity="${(.25+rnd2()*.5).toFixed(2)}"/>`}return out};
  const defs=`<defs><linearGradient id="pgGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c5a2c"/><stop offset="1" stop-color="#2f8a3f"/></linearGradient><linearGradient id="pgStand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070c"/><stop offset="1" stop-color="#141c2a"/></linearGradient><radialGradient id="pgLight" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#fff6d8" stop-opacity=".5"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient><radialGradient id="pgBallG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9bdc4"/></radialGradient></defs>`;
  const ballG=(id,r)=>`<g id="${id}"><ellipse class="pg-bsh" cx="0" cy="${r*.9}" rx="${r}" ry="${r*.32}" fill="rgba(0,0,0,.4)"/><circle r="${r}" fill="url(#pgBallG)" stroke="#1b2330" stroke-width="${(r*.07).toFixed(2)}"/><path d="M0 ${-r*.45}l${r*.4} ${r*.3}-${r*.16} ${r*.5}h-${r*.48}l-${r*.16}-${r*.5}z" fill="#1b2330"/></g>`;
  let html;
  if(mode==='kick'){
    const net=[];for(let i=0;i<=12;i++){const x=GX-125+i*250/12,xb=GX-104+i*208/12;net.push(`<path d="M${x.toFixed(1)} 132L${xb.toFixed(1)} 148V215"/>`)}for(let j=1;j<=5;j++){const y=148+j*67/6;net.push(`<path d="M${GX-104} ${y.toFixed(1)}H${GX+104}"/>`)}
    html=`<svg class="pg-svg" ${vb} aria-hidden="true">${defs}
      <rect width="360" height="460" fill="url(#pgStand)"/>${crowd(4,122,260,7)}<rect width="360" height="170" fill="url(#pgLight)"/>
      <rect y="124" width="360" height="26" fill="#0c1420"/><g font-family="Karantina,Heebo,sans-serif" font-weight="700" font-size="17" fill="#c6f24e" opacity=".85"><text x="46" y="143">GOALASSO</text><text x="252" y="143">GOALASSO</text></g>
      <rect y="150" width="360" height="310" fill="url(#pgGrass)"/>
      <g fill="#fff" opacity=".045"><path d="M150 150h60l110 310H40z"/><path d="M0 150h60L-150 460H-320z"/><path d="M300 150h60l320 310H510z"/></g>
      <g fill="none" stroke="rgba(255,255,255,.72)" stroke-width="2.2"><path d="M0 215H360"/><path d="M${GX-94} 215L${GX-170} 318H${GX+170}L${GX+94} 215"/></g>
      <ellipse cx="180" cy="414" rx="16" ry="5" fill="rgba(255,255,255,.75)"/>
      <g class="pg-net" id="pgNet" fill="none" stroke="rgba(235,240,245,.34)" stroke-width="1">${net.join('')}<rect x="${GX-104}" y="148" width="208" height="67"/></g>
      <g fill="none" stroke="#f4f4ee" stroke-width="5" stroke-linecap="round"><path d="M${GX-125} 215V132H${GX+125}V215"/></g>
      <g id="pgKeeper" transform="translate(${GX} ${GY})"><g class="pg-kbody"><ellipse cx="0" cy="1" rx="15" ry="3.5" fill="rgba(0,0,0,.35)"/><path d="M-6 0v-24h5v24zM1 0v-24h5v24z" fill="#10151d"/><rect x="-9" y="-30" width="18" height="9" rx="3" fill="#10151d"/><rect x="-10" y="-52" width="20" height="24" rx="5" fill="${gk}"/><path d="M-10 -49l-13 -9M10 -49l13 -9" stroke="${gk}" stroke-width="6" stroke-linecap="round"/><circle cx="-24" cy="-59" r="4.4" fill="#f1f1e6"/><circle cx="24" cy="-59" r="4.4" fill="#f1f1e6"/><circle cx="0" cy="-58" r="6.2" fill="#c9966f"/><path d="M-6 -60a6.2 6.2 0 0 1 12 0z" fill="#2b2019"/></g></g>
      <g id="pgBallW" transform="translate(180 404)">${ballG('pgBall',17)}</g>
      <circle id="pgRip" cx="0" cy="0" r="0" fill="none" stroke="#fff" stroke-width="2" opacity="0"/></svg>`;
  }else{
    html=`<svg class="pg-svg" ${vb} aria-hidden="true">${defs}
      <rect width="360" height="460" fill="url(#pgStand)"/>${crowd(30,150,300,11)}<rect width="360" height="190" fill="url(#pgLight)"/>
      <rect y="152" width="360" height="16" fill="#0c1420"/>
      <rect y="168" width="360" height="292" fill="url(#pgGrass)"/>
      <g fill="#fff" opacity=".045"><rect y="182" width="360" height="12"/><rect y="212" width="360" height="20"/><rect y="262" width="360" height="34"/><rect y="340" width="360" height="60"/></g>
      <g fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><path d="M40 214H320"/><path d="M40 214L-70 460M320 214L430 460"/><path d="M128 214a54 16 0 0 1 104 0"/></g>
      <ellipse cx="180" cy="270" rx="5" ry="1.8" fill="rgba(255,255,255,.8)"/>
      <g id="pgTaker" transform="translate(180 262)"><g class="pg-kbody"><ellipse cx="0" cy="1" rx="11" ry="2.6" fill="rgba(0,0,0,.35)"/><path d="M-5 0v-20h4v20zM1 0v-20h4v20z" fill="${ink==='#ffffff'?'#e9edf2':'#141a22'}"/><rect x="-8" y="-25" width="16" height="8" rx="2.5" fill="${o.trim||'#10151d'}"/><rect x="-8.5" y="-44" width="17" height="21" rx="4.5" fill="${kit}"/><path d="M-8 -41l-6 13M8 -41l6 13" stroke="${kit}" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="-49" r="5.2" fill="#c9966f"/><path d="M-5 -51a5.2 5.2 0 0 1 10 0z" fill="#2b2019"/></g></g>
      <g id="pgBallW" transform="translate(180 268)">${ballG('pgBall',4.6)}</g>
      <g fill="none" stroke="rgba(235,240,245,.2)" stroke-width="1.2"><path d="M46 40L10 0M314 40L350 0"/></g>
      <g fill="none" stroke="#f4f4ee" stroke-width="12" stroke-linecap="square"><path d="M40 470V40H320V470"/></g><g fill="none" stroke="rgba(0,0,0,.25)" stroke-width="3"><path d="M47 470V47H313V470"/></g>
      <g id="pgGloves"><g class="pg-glove l" id="pgGL" transform="translate(104 428)"><path d="M-30 30c-6-22-4-44 6-54 8-8 20-6 22 4l2-14c2-10 16-10 17 0l1 12c3-9 15-8 16 2l2 26c4 10 2 22-4 30z" fill="#f1f1e6" stroke="#10151d" stroke-width="2.5" stroke-linejoin="round"/><path d="M-22 22h48" stroke="${gk}" stroke-width="7" stroke-linecap="round"/></g>
      <g class="pg-glove r" id="pgGR" transform="translate(256 428)"><path d="M30 30c6-22 4-44-6-54-8-8-20-6-22 4l-2-14c-2-10-16-10-17 0l-1 12c-3-9-15-8-16 2l-2 26c-4 10-2 22 4 30z" fill="#f1f1e6" stroke="#10151d" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 22h-48" stroke="${gk}" stroke-width="7" stroke-linecap="round"/></g></g></svg>`;
  }
  host.insertAdjacentHTML('beforeend',html);const svg=host.querySelector('.pg-svg');const q=id=>svg.querySelector('#'+id);
  const box=()=>{const r=svg.getBoundingClientRect();const sc=(wide?Math.min(r.width/VW,r.height/460):Math.max(r.width/VW,r.height/460))||1;return {sc,ox:((r.width||VW)-VW*sc)/2-VX*sc,oy:((r.height||460)-460*sc)/2}};
  const fast=penQuick();const D=ms=>fast?0:ms;
  const ballW=q('pgBallW');const setBall=(x,y,s)=>ballW.setAttribute('transform',`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
  const st={kind:'2d',mode,dispose(){svg.remove()}};
  if(mode==='kick'){
    const keeper=q('pgKeeper');const kb=keeper.querySelector('.pg-kbody');kb.classList.add('sway');
    st.toScreen=(x,y)=>{const b=box();return [b.ox+(GX+x*S)*b.sc,b.oy+(GY-y*S)*b.sc]};
    st.fromScreen=(px,py)=>{const b=box();return [((px-b.ox)/b.sc-GX)/S,(GY-(py-b.oy)/b.sc)/S]};
    st.shoot=(r,done)=>{const tx=GX+r.x*S,ty=GY-r.y*S;kb.classList.remove('sway');
      const dv=r.dive==='L'?-1:r.dive==='R'?1:0;const reach=r.how==='save';const kx=dv*(reach?clamp(Math.abs(r.x)*S-8,26,112):62),ky=dv?-(reach?clamp(r.y*S-26,0,52):14):0;const rot=dv*(reach?clamp(52+Math.abs(r.x)*8,52,82):64);
      penAnim(D(330),u=>{const e=1-Math.pow(1-u,2);keeper.setAttribute('transform',`translate(${(GX+kx*e).toFixed(1)} ${(GY+ky*e).toFixed(1)}) rotate(${(rot*e).toFixed(1)} 0 -30)`)});
      penAnim(D(430),u=>{const e=u;setBall(180+(tx-180)*e,404+(ty-404)*e-Math.sin(u*Math.PI)*16,1-.64*e)},()=>{
        if(r.how==='goal'){const rip=q('pgRip');rip.setAttribute('cx',tx);rip.setAttribute('cy',ty);q('pgNet').classList.add('hit');penAnim(D(420),u=>{rip.setAttribute('r',(6+u*34).toFixed(1));rip.setAttribute('opacity',(.8*(1-u)).toFixed(2));setBall(tx,ty+(GY-8-ty)*u*u,.36-.06*u)},done)}
        else if(r.how==='save'){const ex=tx+(r.x>=0?70:-70),ey=ty-30;penAnim(D(420),u=>setBall(tx+(ex-tx)*u,ty+(ey-ty)*u+u*u*70,.36+.1*u),done)}
        else if(r.how==='post'){const ex=tx+(r.x>=0?-60:60);penAnim(D(480),u=>setBall(tx+(ex-tx)*u,ty+(300-ty)*u*u-Math.sin(u*Math.PI)*30,.36+.3*u),done)}
        else{const ex=tx+(tx-180)*.5,ey=ty-(404-ty)*.28;penAnim(D(360),u=>setBall(tx+(ex-tx)*u,ty+(ey-ty)*u,.36-.14*u),done)}})};
  }else{
    const taker=q('pgTaker'),gl=q('pgGL'),gr=q('pgGR');const EX=x=>180+x*46,EY=y=>400-y*130;
    st.toScreen=(x,y)=>{const b=box();return [b.ox+EX(x)*b.sc,b.oy+EY(y)*b.sc]};
    st.fromScreen=(px,py)=>{const b=box();return [((px-b.ox)/b.sc-180)/46,(400-(py-b.oy)/b.sc)/130]};
    st.runUp=(ms,done)=>penAnim(D(ms),u=>{taker.setAttribute('transform',`translate(${(180-10*(1-u)).toFixed(1)} ${(262-14*(1-u)).toFixed(1)}) scale(${(.86+.14*u).toFixed(3)})`)},done);
    st.gloves=side=>{const dx=side==='L'?-78:side==='R'?78:0,dy=side==='C'?-150:-120;penAnim(D(170),u=>{gl.setAttribute('transform',`translate(${(104+dx*u+(side==='C'?46*u:0)).toFixed(1)} ${(428+dy*u).toFixed(1)}) rotate(${(side==='L'?-24:side==='R'?10:0)*u})`);gr.setAttribute('transform',`translate(${(256+dx*u-(side==='C'?46*u:0)).toFixed(1)} ${(428+dy*u).toFixed(1)}) rotate(${(side==='R'?24:side==='L'?-10:0)*u})`)})};
    st.incoming=(r,done)=>{const tx=EX(r.x),ty=EY(r.y);
      penAnim(D(r.ms||650),u=>{const e=Math.pow(u,2.1);setBall(180+(tx-180)*e,268+(ty-268)*e-Math.sin(u*Math.PI)*10,1+8.6*e)},()=>{const how=r.how();
        if(how==='save'){penAnim(D(380),u=>setBall(tx+(tx>=180?60:-60)*u,ty+90*u*u-30*u,9.6-3*u),done)}
        else if(how==='post'){penAnim(D(380),u=>setBall(tx+(tx>=180?-80:80)*u,ty+60*u,9.6-5*u),done)}
        else penAnim(D(260),u=>{setBall(tx+(tx-180)*.25*u,ty-10*u,9.6+7*u);ballW.setAttribute('opacity',(1-u).toFixed(2))},done)})};
  }
  return st}

/* ---- the overlay ---- */
let PG=null;
/* both sides as the match itself draws them (the away side changes kit when the colours clash); the keeper wears a colour neither side does */
function penKits(tc,kc,homeId){let t={fill:tc.c1,stroke:tc.c2||'#10151d'},k={fill:'#e9edf2',stroke:'#10151d'};
  if(kc){const tHome=homeId!==kc.id;const mc=tHome?matchColors(tc,kc):matchColors(kc,tc);t=tHome?mc.h:mc.a;k=tHome?mc.a:mc.h}
  const gkKit=['#f2b233','#39c3d6','#b06cf0'].find(c=>colDist(c,t.fill)>120&&colDist(c,k.fill)>120)||'#f2b233';
  return {kit:t.fill,trim:t.stroke,oppKit:k.fill,oppTrim:k.stroke,gkKit}}
function penFaceHTML(p,c,key){return `<span class="pg-face" style="${faceFrameStyle(p)}">${playerPortraitHTML(p,c,key)}</span>`}
function penOverlay(o){penClose();const root=document.createElement('div');root.id='penGame';root.className='pg';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',o.title);
  root.innerHTML=`<div class="pg-top"><div class="pg-title">${esc(o.title)}</div><div class="pg-meta">${o.meta||''}</div><div class="pg-so" id="pgSo"></div></div><div class="pg-stage" id="pgStage" tabindex="0"><div class="pg-view" id="pgView"></div></div><div class="pg-bot" id="pgBot"></div>`;
  document.body.appendChild(root);PG={root,o};return root}
function penClose(){if(PG){const pg=PG;PG=null;try{pg.off&&pg.off()}catch(e){}try{pg.stage&&pg.stage.dispose&&pg.stage.dispose()}catch(e){}try{pg.view3d&&pg.view3d.dispose()}catch(e){}if(pg.root)pg.root.remove()}}
/* clear what the last kick left on the stage (the sight, the result word, a text panel); the picture itself stays */
function penClear(){if(!PG)return null;const host=PG.root.querySelector('#pgStage');try{PG.off&&PG.off()}catch(e){}PG.off=null;if(PG.stage&&PG.stage.kind==='2d'){try{PG.stage.dispose()}catch(e){}}PG.stage=null;
  for(const el of [...host.children])if(el.id!=='pgView')el.remove();return host}
function penPanel(html){const host=penClear();if(!host)return null;const d=document.createElement('div');d.className='pg-panel';d.innerHTML=html;host.appendChild(d);return d}
function penOnce(fn,ms){let done=false;const go=()=>{if(done)return;done=true;fn()};if(ms)setTimeout(go,ms);return go}
const PEN_WORD={kick:{goal:'שער!',save:'נהדף',post:'קורה!',off:'החוצה'},keep:{goal:'שער',save:'הצלה!',post:'קורה!',off:'החוצה!'}};
function penFlash(host,mode,how){const good=mode==='kick'?how==='goal':how!=='goal';const el=document.createElement('div');el.className='pg-flash '+(good?'good':'bad');el.textContent=PEN_WORD[mode][how];host.appendChild(el);buzz(good?(how==='goal'?'goal':'save'):'conceded');return el}
/* One kick inside an open overlay. o: {mode:'kick'|'keep', taker:{p,c}, keeper:{p,c}|null, energy, pressure, sfx}
   cb({out:'goal'|'miss', how:'goal'|'save'|'post'|'off', auto}) */
function penKick(o,cb){const root=PG&&PG.root;if(!root){cb({out:Math.random()<.76?'goal':'miss',how:null,auto:true});return}
  const host=penClear(),view=root.querySelector('#pgView'),bot=root.querySelector('#pgBot');host.insertAdjacentHTML('beforeend','<div class="pg-load">השופט מניח את הכדור על הנקודה…</div>');
  const kick=o.mode==='kick';const tp=o.taker.p,kp=o.keeper&&o.keeper.p;const skill=penShootSkill(tp),gk=penKeepSkill(kp);const myP=kick?tp:kp,myC=kick?o.taker.c:(o.keeper&&o.keeper.c);
  bot.innerHTML=`<div class="pg-who">${myP?penFaceHTML(myP,myC,'pg'+myP.id+(kick?'k':'g')):''}<div><b>${esc(myP?fullName(myP):'')}</b><small>${kick?`בעיטה <bdi>${Math.round(skill)}</bdi> · מול ${esc(kp?fullName(kp):'השוער')}`:`רפלקסים <bdi>${Math.round(gk)}</bdi> · בועט ${esc(fullName(tp))}`}</small></div></div>
    <button type="button" class="pg-skip" id="pgAuto">${kick?'שיבעט לבד':'שיעמוד לבד'}</button><div class="pg-hint" id="pgHint">${kick?'לחץ, כוון אל הפינה ושחרר':'החלק לצד שאליו הכדור הולך'}</div><div class="pg-timer" aria-hidden="true"><i id="pgTime"></i></div>`;
  /* a kick belongs to the overlay and the turn it was started in: once either is gone (the overlay was closed, the next
     kick began) nothing of it may run any more */
  let over=false;const token=PG.tok=(PG.tok||0)+1;const alive=()=>!!PG&&PG.root===root&&PG.tok===token;const finish=r=>{if(over||!alive())return;over=true;cb(r)};
  const end=(r,stage)=>{if(!alive())return;const fl=penFlash(host,o.mode,r.how);if(o.sfx){try{if(r.how==='goal')(kick?SFX.goal(true):(CROWD.goal(false)||SFX.groan()));else kick?SFX.groan():CROWD.chance()}catch(e){}}
    setTimeout(()=>{fl.remove();finish(r)},penQuick()?0:1150)};
  penMakeStage(view,o.mode,{...penKits(o.taker.c,o.keeper&&o.keeper.c,o.home),number:tp.no||9}).then(st=>{
    if(!alive()||!host.isConnected){try{st.kind==='2d'&&st.dispose()}catch(e){}return}
    PG.stage=st;const ld=host.querySelector('.pg-load');if(ld)ld.remove();try{SFX.whistle()}catch(e){}
    const ac=new AbortController();const on=(el,ev,fn)=>el.addEventListener(ev,fn,{signal:ac.signal,passive:false});
    const rect=()=>host.getBoundingClientRect();const tEl=root.querySelector('#pgTime');let raf=0,dead=false;const stop=()=>{dead=true;cancelAnimationFrame(raf);ac.abort()};PG.off=()=>{dead=true;cancelAnimationFrame(raf);ac.abort()};
    on(root.querySelector('#pgAuto'),'click',()=>PG.auto&&PG.auto());
    if(kick){
      const wob=penWobble(skill,o.energy==null?100:o.energy,o.pressure);const aimEl=document.createElement('div');aimEl.className='pg-aim';host.appendChild(aimEl);
      let aim={x:0,y:1.15},touched=false,down=false,fired=false;const ck=penClock(performance.now());
      const cur=()=>{const t=ck.ms/1000;return {x:aim.x+Math.sin(t*5.3)*wob+Math.sin(t*9.1+1)*wob*.35,y:Math.max(.05,aim.y+Math.sin(t*4.1+.7)*wob*.55)}};
      const place=()=>{const c=cur();const [px,py]=st.toScreen(c.x,c.y);aimEl.style.transform=`translate(${px.toFixed(1)}px,${py.toFixed(1)}px)`;aimEl.classList.toggle('out',penFrame(c.x,c.y)!=='in')};
      const fire=auto=>{if(fired||!alive())return;fired=true;stop();aimEl.remove();let x,y;
        if(auto&&!touched){const s=penAiShot(skill);x=s.x;y=s.y}else{const c=cur();x=c.x+gauss()*wob*.3;y=Math.max(.05,c.y+gauss()*wob*.24)}
        const r=penKickOutcome(x,y,gk);buzz('kick');try{tone(120,.09,'sine',.25)}catch(e){}st.shoot({x,y,how:r.how,dive:r.dive},penOnce(()=>end({out:r.out,how:r.how,x,y,auto:!!auto&&!touched},st),penQuick()?0:2600))};
      const setAim=ev=>{const r=rect();const touch=ev.pointerType==='touch';const [x,y]=st.fromScreen(ev.clientX-r.left,ev.clientY-r.top-(touch?56:0));aim={x:clamp(x,-4.5,4.5),y:clamp(y,.12,3.1)};touched=true};
      on(host,'pointerdown',ev=>{ev.preventDefault();down=true;try{host.setPointerCapture(ev.pointerId)}catch(e){}setAim(ev);place()});
      on(host,'pointermove',ev=>{if(down){ev.preventDefault();setAim(ev)}});
      on(host,'pointerup',ev=>{if(down){down=false;setAim(ev);fire(false)}});on(host,'pointercancel',()=>{down=false});
      on(host,'keydown',ev=>{const k=ev.key;if(k==='ArrowLeft'){aim.x=clamp(aim.x-.35,-4.5,4.5);touched=true}else if(k==='ArrowRight'){aim.x=clamp(aim.x+.35,-4.5,4.5);touched=true}else if(k==='ArrowUp'){aim.y=clamp(aim.y+.25,.12,3.1);touched=true}else if(k==='ArrowDown'){aim.y=clamp(aim.y-.25,.12,3.1);touched=true}else if(k==='Enter'||k===' '){touched=true;fire(false)}else return;ev.preventDefault()});
      PG.auto=()=>fire(true);PG.fire=(x,y)=>{aim={x,y};touched=true;fire(false)};PG.aim=()=>aim;
      (function loop(){if(dead||!alive())return;const left=1-ck.tick(performance.now())/PEN_TIME;if(tEl)tEl.style.transform=`scaleX(${Math.max(0,left).toFixed(3)})`;place();if(left<=0)return fire(true);raf=requestAnimationFrame(loop)})();
      try{host.focus({preventScroll:true})}catch(e){}
    }else{
      const s0=penAiShot(skill);const shot={x:-s0.x,y:s0.y};const win=penReactMs(gk);let tStrike=0,commit=null,result=null,down=null,autoStay=false;
      const decide=()=>{if(result)return;const timing=!commit?'late':commit.t<tStrike||!tStrike?'early':commit.t-tStrike<=win?'react':'late';const side=commit?commit.side:'C';
        result=penKeepOutcome(shot.x,shot.y,side,commit?timing:'react',gk);result.side=side;result.timing=commit?timing:'stay'};
      const go=side=>{if(commit||result||!alive())return;commit={side,t:performance.now()};st.gloves(side);buzz('tap');if(tStrike)decide()};
      on(host,'pointerdown',ev=>{ev.preventDefault();down={x:ev.clientX,y:ev.clientY}});
      on(host,'pointermove',ev=>{if(!down||commit)return;const dx=ev.clientX-down.x;if(Math.abs(dx)>24)go(dx<0?'L':'R');else if(down.y-ev.clientY>34)go('C')});
      on(host,'pointerup',ev=>{if(!down)return;const d=down;down=null;if(commit)return;const dx=ev.clientX-d.x;if(Math.abs(dx)>24)return go(dx<0?'L':'R');const r=rect();const f=(ev.clientX-r.left)/Math.max(1,r.width);go(f<.36?'L':f>.64?'R':'C')});
      on(host,'keydown',ev=>{if(ev.key==='ArrowLeft')go('L');else if(ev.key==='ArrowRight')go('R');else if(ev.key==='ArrowUp'||ev.key===' ')go('C');else return;ev.preventDefault()});
      PG.auto=()=>{autoStay=true;root.querySelector('#pgAuto').disabled=true};PG.go=go;PG.shot=shot;
      const wait=penQuick()?0:900+Math.random()*1000;if(tEl)tEl.parentNode.classList.add('idle');
      setTimeout(()=>{if(dead||!alive())return;st.runUp(penQuick()?0:820,penOnce(()=>{if(dead||!alive())return;tStrike=performance.now();buzz('kick');try{tone(120,.09,'sine',.25)}catch(e){}
        if(autoStay&&!commit){const g=penKeeperGuess(shot.x,gk);commit={side:g,t:tStrike-1};st.gloves(g)}
        if(commit)decide();else setTimeout(()=>{if(!dead)decide()},penQuick()?0:win);
        st.incoming({x:shot.x,y:shot.y,ms:650,how:()=>{decide();return result.how}},penOnce(()=>{if(!alive())return;decide();stop();end({out:result.out,how:result.how,side:result.side,timing:result.timing,auto:autoStay},st)},penQuick()?0:2800))},penQuick()?0:2200))},wait);
      try{host.focus({preventScroll:true})}catch(e){}
    }})}
/* a penalty during a live match: for our club the manager kicks, against it he keeps goal */
function penMatchKick(M,c,p,cb){const h=club(M.h),a=club(M.a);const opp=c.id===M.h?a:h;const mine=c.id===G.me;const gkx=xiPlayers(M,opp).find(x=>x.p.pos==='GK');
  const e=M.xi[c.id].find(x=>x.pid===p.id);const en=e?liveEnergy(M,c,p,e,M.m):100;
  penOverlay({title:mine?`פנדל ל${c.short||c.name}!`:`פנדל ל${c.short||c.name}`,meta:`<bdi dir="ltr">${fm(M.m)}</bdi> · <bdi>${esc(h.short)}</bdi> <bdi dir="ltr">${M.gh}:${M.ga}</bdi> <bdi>${esc(a.short)}</bdi>`});const pg=PG;
  penKick({mode:mine?'kick':'keep',taker:{p,c},keeper:gkx?{p:gkx.p,c:opp}:null,home:M.h,energy:en,pressure:M.m>=85},r=>{if(!r.auto){if(mine&&r.out==='goal')M.penMine=(M.penMine||0)+1;if(!mine&&r.how==='save')M.penSaved=(M.penSaved||0)+1}
    setTimeout(()=>{if(PG!==pg)return;penClose();cb(r.out,r.how||(r.out==='goal'?null:(Math.random()<.5?'save':'off')))},penQuick()?0:250)})}
/* a shoot-out at the end of a knockout tie */
function penShootout(M,h,a,done){const meH=h.id===G.me;const my=meH?h:a,op=meH?a:h;const ord={h:penOrder(M,h),a:penOrder(M,a)};const gkOf=c=>{const x=xiPlayers(M,c).find(x=>x.p.pos==='GK');return x?{p:x.p,c}:null};
  const root=penOverlay({title:'דו־קרב פנדלים',meta:`<bdi>${esc(h.short)}</bdi> <bdi dir="ltr">${M.gh}:${M.ga}</bdi> <bdi>${esc(a.short)}</bdi> · ${esc(M.ctx.label||'')}`});
  const S={h:[],a:[]};let side=Math.random()<.5?'h':'a';const first=side;
  const dots=k=>{const n=Math.max(5,S[k].length+(S.h.length+S.a.length>=10&&S.h.length===S.a.length?1:0));let o='';for(let i=0;i<n;i++)o+=`<i class="${S[k][i]==null?'':S[k][i]?'in':'no'}"></i>`;return o};
  const paint=()=>{const el=root.querySelector('#pgSo');if(el)el.innerHTML=`<div class="pg-so-row${side==='h'?' on':''}"><b>${esc(h.short)}</b><span>${dots('h')}</span><strong>${S.h.reduce((t,v)=>t+v,0)}</strong></div><div class="pg-so-row${side==='a'?' on':''}"><b>${esc(a.short)}</b><span>${dots('a')}</span><strong>${S.a.reduce((t,v)=>t+v,0)}</strong></div>`};
  const finish=(win,auto)=>{const sc=[S.h.reduce((t,v)=>t+v,0),S.a.reduce((t,v)=>t+v,0)];const won=(win==='h')===meH;
    penPanel(`<div class="pg-end ${won?'good':'bad'}"><small>${esc(M.ctx.label||'')}</small><h2>${won?'ניצחת בפנדלים!':'הפסד בפנדלים'}</h2><div class="pg-endsc"><bdi>${esc(h.short)}</bdi> <b dir="ltr">${sc[0]}:${sc[1]}</b> <bdi>${esc(a.short)}</bdi></div><button type="button" class="btn big" id="pgDone">המשך</button></div>`);
    root.querySelector('#pgBot').innerHTML='';side=null;paint();if(won){try{SFX.win()}catch(e){}confetti(2600);buzz('win')}
    root.querySelector('#pgDone').onclick=()=>{penClose();done({win,score:sc,auto:!!auto})}};
  const autoRest=()=>{let w=penShootoutDone(S.h,S.a),g=0;while(!w&&g++<60){const c=side==='h'?h:a,o=side==='h'?a:h;const tk=ord[side][S[side].length%ord[side].length];const gk=gkOf(o);const s=penAiShot(penShootSkill(tk));S[side].push(penKickOutcome(s.x,s.y,penKeepSkill(gk&&gk.p)).out==='goal'?1:0);side=side==='h'?'a':'h';w=penShootoutDone(S.h,S.a)}finish(w||'h',true)};
  const next=()=>{const w=penShootoutDone(S.h,S.a);if(w)return finish(w);paint();const c=side==='h'?h:a,o=side==='h'?a:h;const tk=ord[side][S[side].length%ord[side].length];const mine=c.id===G.me;
    const e=M.xi[c.id].find(x=>x.pid===tk.id);
    penKick({mode:mine?'kick':'keep',taker:{p:tk,c},keeper:gkOf(o),home:h.id,energy:e?liveEnergy(M,c,tk,e,M.m):100,pressure:S.h.length+S.a.length>=8,sfx:true},r=>{if(!PG||PG.root!==root)return;S[side].push(r.out==='goal'?1:0);if(mine&&r.out==='goal'&&!r.auto)M.penMine=(M.penMine||0)+1;if(!mine&&r.how==='save'&&!r.auto)M.penSaved=(M.penSaved||0)+1;side=side==='h'?'a':'h';paint();setTimeout(next,penQuick()?0:500)})};
  PG.skipAll=autoRest;
  penPanel(`<div class="pg-end"><small>${esc(M.ctx.label||'')}</small><h2>הולכים לפנדלים</h2><p>חמש בעיטות לכל קבוצה. ${esc((first==='h'?h:a).short)} בועטת ראשונה.<br>כשאתה בועט: כוון ושחרר. כשהם בועטים: אתה בשער.</p><button type="button" class="btn big" id="pgGo">אני לוקח את זה</button><button type="button" class="btn sec" id="pgLet">שהשחקנים יחליטו</button></div>`);paint();
  root.querySelector('#pgGo').onclick=()=>{penPreload();next()};root.querySelector('#pgLet').onclick=()=>autoRest()}
