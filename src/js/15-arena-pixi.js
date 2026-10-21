/* ====================== PIXI RENDERER (WebGL · lazy-loaded · falls back to the SVG arena) ======================
   Same contract as the SVG arena state (h/a arrays with x,y,bx,by,tx,ty · ball · labels · heat · hold · snap · flip ·
   onTap · ballEl.isConnected), so startLive drives either one. Pitch geometry = the P25 projection × PXK px.          */
const PIXI_URL='https://cdn.jsdelivr.net/npm/pixi.js@8.21.0/dist/pixi.min.js';
let pixiState='idle',pixiLoadP=null;
function loadPixi(){if(window.PIXI&&window.PIXI.Application){pixiState='ready';return Promise.resolve(true)}if(pixiState==='loading'&&pixiLoadP)return pixiLoadP;if(pixiState==='failed')return Promise.resolve(false);
  pixiState='loading';pixiLoadP=new Promise(res=>{try{const s=document.createElement('script');s.src=PIXI_URL;s.async=true;s.crossOrigin='anonymous';s.onload=()=>{pixiState=window.PIXI&&window.PIXI.Application?'ready':'failed';res(pixiState==='ready')};s.onerror=()=>{pixiState='failed';res(false)};document.head.appendChild(s)}catch(e){pixiState='failed';res(false)}});return pixiLoadP}
function usePixi(){return !!(G&&G.renderer!=='svg'&&pixiState==='ready'&&window.PIXI&&motionLevel()!=='off')}
const PXK=8,PXW=P25.W*PXK,PXH=P25.H*PXK;
function pxP(x,y){const q=prj(x,y);return [q[0]*PXK,q[1]*PXK]}
function shadeHex(hex,f){const [r,g,b]=hexRGB(hex);const m=v=>Math.round(clamp(f<0?v*(1+f):v+(255-v)*f,0,255));return '#'+[m(r),m(g),m(b)].map(v=>v.toString(16).padStart(2,'0')).join('')}
/* ---- player figure frames: 0–7 run cycle, 8 idle, 9 celebrate, 10 dive, 11 kick (drawn facing +x) ---- */
const PXF={W:64,H:128,N:12};
function pxDrawFig(g,pose,ph,k){
  let legA,legB,bendA,bendB,armA,armB,bob=0;
  if(pose==='run'){legA=Math.sin(ph)*.62;legB=-legA;bendA=.2+.8*Math.max(0,-Math.cos(ph));bendB=.2+.8*Math.max(0,Math.cos(ph));armA=-Math.sin(ph)*.8;armB=-armA;bob=-Math.abs(Math.sin(ph))*3}
  else if(pose==='cele'){legA=.2;legB=-.2;bendA=bendB=.15;armA=Math.PI-.4;armB=-(Math.PI-.55);bob=-4}
  else if(pose==='dive'){legA=.5;legB=-.15;bendA=.2;bendB=.4;armA=2.1;armB=1.75}
  else if(pose==='kick'){legA=1.1;legB=-.35;bendA=.05;bendB=.55;armA=-1;armB=1}
  else{legA=.07;legB=-.07;bendA=bendB=.12;armA=.14;armB=-.12}
  const hipY=84+bob,shY=52+bob;g.lineCap='round';g.lineJoin='round';
  const pt=(x,y,a,len)=>[x+Math.sin(a)*len,y+Math.cos(a)*len];
  const leg=(a,b,back)=>{const [kx,ky]=pt(0,hipY,a,21);const [fx,fy]=pt(kx,ky,a-b,21);
    g.strokeStyle=back?shadeHex(k.skin,-.2):k.skin;g.lineWidth=8.5;g.beginPath();g.moveTo(0,hipY);g.lineTo(kx,ky);g.stroke();
    g.strokeStyle=back?shadeHex(k.socks,-.25):k.socks;g.lineWidth=8;g.beginPath();g.moveTo(kx,ky);g.lineTo(fx,fy);g.stroke();
    g.fillStyle='#121318';g.beginPath();g.ellipse(fx+3.5,fy+1.5,6.5,3.6,0,0,Math.PI*2);g.fill()};
  const arm=(a,back)=>{const [ex,ey]=pt(0,shY+2,a,15);const [hx,hy]=pt(ex,ey,a+(Math.abs(a)>1.6?-.3:.65),14);
    g.strokeStyle=back?shadeHex(k.shirt,-.25):k.shirt;g.lineWidth=9;g.beginPath();g.moveTo(0,shY+2);g.lineTo(ex,ey);g.stroke();
    g.strokeStyle=k.gk?(back?shadeHex(k.shirt,-.25):k.shirt):(back?shadeHex(k.skin,-.2):k.skin);g.lineWidth=7;g.beginPath();g.moveTo(ex,ey);g.lineTo(hx,hy);g.stroke();
    g.fillStyle=k.gk?(back?shadeHex(k.glove,-.2):k.glove):(back?shadeHex(k.skin,-.2):k.skin);g.beginPath();g.arc(hx,hy,k.gk?5:3.8,0,Math.PI*2);g.fill()};
  leg(legB,bendB,true);arm(armB,true);leg(legA,bendA,false);
  g.fillStyle=k.shorts;g.beginPath();g.moveTo(-12,hipY-9);g.lineTo(12,hipY-9);g.lineTo(13,hipY+8);g.lineTo(-13,hipY+8);g.closePath();g.fill();
  const grd=g.createLinearGradient(-13,0,13,0);grd.addColorStop(0,shadeHex(k.shirt,-.22));grd.addColorStop(.45,k.shirt);grd.addColorStop(1,shadeHex(k.shirt,.12));
  g.fillStyle=grd;g.beginPath();g.moveTo(-13,shY);g.quadraticCurveTo(0,shY-5,13,shY);g.lineTo(12.5,hipY-6);g.lineTo(-12.5,hipY-6);g.closePath();g.fill();
  g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1.4;g.stroke();
  if(k.stripe){g.fillStyle=k.stripe;g.fillRect(-13,shY+1,26,3)}
  g.fillStyle=k.ink;g.textAlign='center';g.textBaseline='middle';if(k.spons){g.font='800 7px Heebo, Arial, sans-serif';try{g.direction='rtl'}catch(e){}g.fillText(k.spons,0,shY+9,22);g.font='800 11px Heebo, Arial, sans-serif';g.fillText(String(k.num||''),0,shY+22)}else{g.font='800 14px Heebo, Arial, sans-serif';g.fillText(String(k.num||''),0,shY+15)}
  g.fillStyle=shadeHex(k.skin,-.1);g.fillRect(-3,shY-12,6,8);
  g.fillStyle=k.skin;g.beginPath();g.arc(0,shY-21,10,0,Math.PI*2);g.fill();g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=1.2;g.stroke();
  g.fillStyle=k.hair;g.beginPath();g.arc(0,shY-23,10.4,Math.PI*1.02,Math.PI*1.98);g.closePath();g.fill();g.beginPath();g.ellipse(-2,shY-29,9,4.5,0,0,Math.PI*2);g.fill();
  g.fillStyle='rgba(0,0,0,.55)';g.beginPath();g.arc(5,shY-21,1.4,0,Math.PI*2);g.fill();
  arm(armA,false)}
function pxFigCanvas(k){const cv=document.createElement('canvas');cv.width=PXF.W*PXF.N;cv.height=PXF.H;const g=cv.getContext('2d');
  for(let i=0;i<PXF.N;i++){g.save();g.translate(i*PXF.W+32,0);const pose=i<8?'run':i===8?'idle':i===9?'cele':i===10?'dive':'kick';pxDrawFig(g,pose,i/8*Math.PI*2,k);g.restore()}return cv}
function pxSoftDot(r,stops){const cv=document.createElement('canvas');cv.width=cv.height=r*2;const g=cv.getContext('2d');const gr=g.createRadialGradient(r,r,0,r,r,r);for(const [o,c] of stops)gr.addColorStop(o,c);g.fillStyle=gr;g.fillRect(0,0,r*2,r*2);return cv}
const PX={cur:null};
PX.html=(cap)=>{PX.cap=cap;return `<div class="arena pxarena" id="arena"><div id="pxHost" class="pxhost"></div><div class="arena-over" id="arenaOver"></div></div>`};
PX.kitFor=(c,col,p,gk,isHome,cols)=>{let seed=(p.id*2654435761)>>>0;const R=()=>{seed^=seed<<13;seed>>>=0;seed^=seed>>>17;seed^=seed<<5;seed>>>=0;return seed/4294967296};
  const skins=['#f1c7a5','#e2b08b','#c99467','#a8714c','#7a4b2f','#5a3622'],hairs=['#1b1410','#2e1d12','#4a3020','#7a5230','#c9a46a','#0e0e10'];
  if(gk){const used=[cols.h.fill,cols.a.fill];let sh=isHome?'#7c3aed':'#f97316';if(used.some(u=>colDist(u,sh)<120))sh=isHome?'#0ea5e9':'#111827';return {shirt:sh,shorts:'#15171c',socks:sh,ink:'#ffffff',skin:skins[(R()*skins.length)|0],hair:hairs[(R()*hairs.length)|0],num:p.no,gk:true,glove:'#e8f04a',spons:sponsorName(c)}}
  const ink=colDist(col.fill,'#ffffff')<120?'#111827':col.stroke==='#111'||col.stroke==='#111111'?'#111111':colDist(col.fill,col.stroke)<90?'#ffffff':col.stroke;
  return {shirt:col.fill,shorts:col.shorts||col.stroke,socks:col.fill,ink,skin:skins[(R()*skins.length)|0],hair:hairs[(R()*hairs.length)|0],num:p.no,spons:sponsorName(c)}};
PX.init=(M,h,a)=>{const host=$('pxHost');if(!host)return null;if(PX.cur)PX.destroy(PX.cur);
  const cols=matchColors(h,a);const st={px:true,host,h:[],a:[],ball:{x:52.5,y:34,tx:52.5,ty:34,z:0},poss:h.id,flash:0,flip:false,seq:null,hold:false,heat:{[h.id]:Array(60).fill(0),[a.id]:Array(60).fill(0)},frame:0,labels:{},cols,hid:h.id,aid:a.id,showPaths:false,entrance:motionLevel()==='full',cam:{x:PXW/2,y:PXH*.56,z:1.1},M,hc:h,ac:a,cards:{},fx:[],last:performance.now(),ready:false,celeb:null,dive:null,kick:null,pending:null,crowdJump:0,shake:0};
  st.ballEl={get isConnected(){const c=host.isConnected;if(!c&&st.app)PX.destroy(st);return c}};PX.cur=st;
  const mk=(c,homeSide,col)=>pitchPositions(c,M,homeSide).map((p,i)=>{const pl=c.players.find(x=>x.id===p.pid);const sx=st.entrance?52.5+(homeSide?-3:3)*(i+1):p.x,sy=st.entrance?74+i*.4:p.y;return {pid:p.pid,team:c.id,bx:p.x,by:p.y,x:sx,y:sy,ph:Math.random()*8,face:homeSide?1:-1,pl,gk:pl&&pl.pos==='GK',home:homeSide,col,name:pl?(pl.last||pl.first):'',sprite:null,show:true}});
  st.h=mk(h,true,cols.h);st.a=mk(a,false,cols.a);
  PX.boot(st).catch(err=>{console.warn('pixi failed, falling back',err);PX.fallback(st)});return st};
PX.fallback=(st)=>{try{if(st.app)st.app.destroy({removeView:true},{children:true})}catch(e){}st.app=null;pixiState='failed';const ar=$('arena');if(!ar||!st.M)return;const tmp=document.createElement('div');tmp.innerHTML=pitch2dSVG(st.hc,st.ac,PX.cap);ar.replaceWith(tmp.firstElementChild);const leg=initPitch2dSVG(st.M,st.hc,st.ac);if(leg){const keep={onTap:st.onTap,snap:st.snap,entranceDone:st.entranceDone,flip:st.flip,labels:st.labels,heat:st.heat};for(const k in st)delete st[k];Object.assign(st,leg,keep)}};
PX.boot=async(st)=>{const P=window.PIXI;const app=new P.Application();const dispW=Math.max(320,st.host.clientWidth||900);const res=clamp(dispW*(window.devicePixelRatio||1)/PXW,.5,st.snap?1:2);
  await app.init({width:PXW,height:PXH,background:'#050913',antialias:true,resolution:res,autoDensity:false,autoStart:false,preference:'webgl'});
  if(!st.host.isConnected){app.destroy({removeView:true},{children:true});return}
  st.app=app;st.P=P;st.host.appendChild(app.canvas);app.canvas.style.width='100%';app.canvas.style.height='auto';app.canvas.style.display='block';app.canvas.setAttribute('aria-hidden','true');
  st.dispScale=()=>Math.max(.2,(st.host.clientWidth||dispW)/PXW);
  const cam=new P.Container();app.stage.addChild(cam);st.camC=cam;
  // stadium backdrop (same painter as the SVG arena)
  stadiumBitmap(st.hc,st.ac,PX.cap);const sc=_stadCanv[st.hc.id+'|'+st.ac.id+'|'+(PX.cap||0)];
  if(sc){const bg=new P.Sprite(P.Texture.from(sc));bg.width=PXW;bg.height=PXH;cam.addChild(bg)}else{const bg=new P.Graphics();bg.rect(0,0,PXW,PXH).fill('#0b1226');cam.addChild(bg)}
  // living crowd
  const crowd=new P.Container();cam.addChild(crowd);st.crowd=[];
  if(!st.snap){const [fl,ft]=pxP(-6,-3),[fr]=pxP(111,-3),[nl,nt]=pxP(-6,72),[nr]=pxP(111,72);const tierTop=6.5*PXK;
    const inPoly=(pts,x,y)=>{let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i],[xj,yj]=pts[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c};
    const far=[[0,tierTop],[PXW,tierTop],[fr,ft-3*PXK],[fl,ft-3*PXK]],left=[[0,tierTop],[fl,ft-2*PXK],[nl,nt],[0,nt]],right=[[PXW,tierTop],[fr,ft-2*PXK],[nr,nt],[PXW,nt]];
    const hc=[st.hc.c1,st.hc.c2||'#ffffff'],ac=[st.ac.c1,st.ac.c2||'#ffffff'];let n=0,guard=0;
    while(n<1100&&guard++<9000){const x=Math.random()*PXW,y=tierTop+Math.random()*(nt-tierTop);const inF=inPoly(far,x,y),inL=inPoly(left,x,y),inR=inPoly(right,x,y);if(!inF&&!inL&&!inR)continue;
      const away=inL||(inF&&x<PXW*.2);const pal=away?ac:hc;const s=new P.Sprite(P.Texture.WHITE);const sz=2.4+(y-tierTop)/(nt-tierTop)*3.4;s.width=sz;s.height=sz*1.3;s.tint=pal[(Math.random()*pal.length)|0];s.alpha=.55+Math.random()*.4;s.x=x;s.y=y;crowd.addChild(s);st.crowd.push({s,y,ph:Math.random()*6.28,team:away?st.ac.id:st.hc.id,amp:.3+Math.random()*.7});n++}}
  // camera flashes + floodlight bloom
  const dotT=P.Texture.from(pxSoftDot(24,[[0,'rgba(255,255,255,1)'],[.35,'rgba(255,255,255,.5)'],[1,'rgba(255,255,255,0)']]));
  st.flashes=[];if(!st.snap)for(let i=0;i<46;i++){const s=new P.Sprite(dotT);s.anchor.set(.5);s.blendMode='add';s.scale.set(.18+Math.random()*.15);s.alpha=0;s.x=Math.random()*PXW;s.y=7*PXK+Math.random()*24*PXK;cam.addChild(s);st.flashes.push({s,t:0})}
  const bloomT=P.Texture.from(pxSoftDot(128,[[0,'rgba(255,248,220,.95)'],[.18,'rgba(255,240,190,.35)'],[1,'rgba(255,240,190,0)']]));st.blooms=[];
  for(const [x,y,s] of [[12*PXK,1.5*PXK,1.5],[PXW-12*PXK,1.5*PXK,1.5],[PXW*.38,.8*PXK,1.1],[PXW*.62,.8*PXK,1.1]]){const b=new P.Sprite(bloomT);b.anchor.set(.5);b.blendMode='add';b.x=x;b.y=y;b.scale.set(s);b.alpha=.8;cam.addChild(b);st.blooms.push({b,ph:Math.random()*6})}
  // ad boards along the far touchline: club sponsors + the premium GOALASSO centre board
  const logoImg=await new Promise(res=>{const u=logoURL();if(!u)return res(null);const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src=u});
  { const [bl,bt]=pxP(-3,-2.2),[br]=pxP(108,-2.2);const bw=Math.round(br-bl),bh=Math.round(3.4*PXK);const cv=document.createElement('canvas');cv.width=bw*2;cv.height=(bh+8)*2;const g=cv.getContext('2d');g.scale(2,2);g.translate(0,8);g.fillStyle='#0d1428';g.fillRect(0,0,bw,bh);g.strokeStyle='#2a3a66';g.strokeRect(0,0,bw,bh);
    const sl=boardSlots(st.hc,st.ac);const tot=sl.reduce((t,x)=>t+x.w,0);let x=0;g.textAlign='center';g.textBaseline='middle';try{g.direction='rtl'}catch(e){}
    for(const b of sl){const w=bw*b.w/tot;
      if(b.logo){const pad=3;g.fillStyle='#07080c';g.fillRect(x+pad,-6,w-pad*2,bh+10);g.strokeStyle='#d9b45a';g.lineWidth=2;g.strokeRect(x+pad,-6,w-pad*2,bh+10);
        const gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,'rgba(217,180,90,0)');gr.addColorStop(.5,'rgba(217,180,90,.22)');gr.addColorStop(1,'rgba(217,180,90,0)');g.fillStyle=gr;g.fillRect(x+pad,-6,w-pad*2,bh+10);
        if(logoImg){const ih=bh+4,iw=ih*logoImg.width/logoImg.height,dw=Math.min(iw,w-14),dh=dw*logoImg.height/logoImg.width;g.drawImage(logoImg,x+(w-dw)/2,-4+(bh+6-dh)/2,dw,dh)}else{g.fillStyle='#e9c46a';g.font='900 '+Math.round(bh*.6)+'px Heebo, Arial, sans-serif';g.fillText('GOALASSO',x+w/2,bh/2+1)}}
      else{g.fillStyle=b.c;g.font='700 '+Math.round(bh*.55)+'px Heebo, Arial, sans-serif';g.fillText(b.t,x+w/2,bh/2+1,w-10)}
      x+=w}
    const bs=new P.Sprite(P.Texture.from(cv));bs.x=bl;bs.y=bt-bh-8;bs.width=bw;bs.height=bh+8;cam.addChild(bs)}
  // pitch
  const pitch=new P.Graphics();const poly=pts=>pts.flatMap(([x,y])=>pxP(x,y));
  pitch.poly(poly([[-5,-3],[110,-3],[110,72],[-5,72]])).fill('#24602f');
  for(let i=0;i<14;i++){const x0=i*7.5,x1=x0+7.5;pitch.poly(poly([[x0,0],[x1,0],[x1,68],[x0,68]])).fill(i%2?'#348a4a':'#2c773e')}
  for(let j=0;j<6;j+=2)pitch.poly(poly([[0,j*11.33],[105,j*11.33],[105,(j+1)*11.33],[0,(j+1)*11.33]])).fill({color:'#ffffff',alpha:.035});
  const line=(pts,close)=>{pitch.poly(poly(pts),!!close).stroke({width:2.2,color:0xffffff,alpha:.78})};
  line([[0,0],[105,0],[105,68],[0,68]],true);line([[52.5,0],[52.5,68]]);line(parcPts(52.5,34,9.15,0,Math.PI*2,48),true);
  line([[0,13.85],[16.5,13.85],[16.5,54.15],[0,54.15]]);line([[105,13.85],[88.5,13.85],[88.5,54.15],[105,54.15]]);line([[0,24.85],[5.5,24.85],[5.5,43.15],[0,43.15]]);line([[105,24.85],[99.5,24.85],[99.5,43.15],[105,43.15]]);
  line(parcPts(11,34,9.15,-.93,.93,16));line(parcPts(94,34,9.15,Math.PI-.93,Math.PI+.93,16));
  for(const [x,y] of [[11,34],[94,34],[52.5,34]]){const [X,Y]=pxP(x,y);pitch.ellipse(X,Y,3,2).fill({color:0xffffff,alpha:.85})}
  cam.addChild(pitch);
  if(logoImg){const ls=new P.Sprite(P.Texture.from(logoImg));ls.anchor.set(.5);const [lx,ly]=pxP(52.5,34);const sc=15*prjS(34)*PXK/logoImg.width;ls.x=lx;ls.y=ly;ls.scale.set(sc,sc*.56);ls.alpha=.24;cam.addChild(ls)}
  const lightT=P.Texture.from(pxSoftDot(256,[[0,'rgba(255,255,255,.16)'],[.7,'rgba(255,255,255,0)'],[1,'rgba(255,255,255,0)']]));const pl=new P.Sprite(lightT);pl.anchor.set(.5);const [lcx,lcy]=pxP(52.5,30);pl.x=lcx;pl.y=lcy;pl.width=PXW*1.1;pl.height=PXH*.7;pl.blendMode='add';cam.addChild(pl);
  st.pathsC=new P.Container();cam.addChild(st.pathsC);
  st.shadowC=new P.Container();cam.addChild(st.shadowC);
  st.ents=new P.Container();st.ents.sortableChildren=true;cam.addChild(st.ents);
  st.fxC=new P.Container();cam.addChild(st.fxC);
  const shT=P.Texture.from(pxSoftDot(32,[[0,'rgba(0,0,0,.62)'],[.6,'rgba(0,0,0,.35)'],[1,'rgba(0,0,0,0)']]));st.shT=shT;
  // goals: posts, bar, net (depth-sorted with the players)
  const goal=(x0,dir)=>{const gg=new P.Graphics();const GH=s=>2.44/1.8*52*s*.95;const y1=30.34,y2=37.66,back=x0-dir*2;const [bx1,by1]=pxP(x0,y1),[bx2,by2]=pxP(x0,y2),[nx1,ny1]=pxP(back,y1),[nx2,ny2]=pxP(back,y2);const h1=GH(prjS(y1)),h2=GH(prjS(y2));
    gg.poly([bx1,by1-h1,nx1,ny1-h1*.85,nx2,ny2-h2*.85,bx2,by2-h2]).fill({color:0xffffff,alpha:.06});gg.poly([nx1,ny1-h1*.85,nx2,ny2-h2*.85,nx2,ny2,nx1,ny1]).fill({color:0xffffff,alpha:.08});
    for(let i=1;i<8;i++){const f=i/8;gg.moveTo(nx1+(nx2-nx1)*f,ny1-h1*.85+((ny2-h2*.85)-(ny1-h1*.85))*f).lineTo(nx1+(nx2-nx1)*f,ny1+(ny2-ny1)*f)}for(let i=1;i<5;i++){const f=i/5;gg.moveTo(nx1,ny1-h1*.85*(1-f)).lineTo(nx2,ny2-h2*.85*(1-f))}gg.stroke({width:1,color:0xffffff,alpha:.35});
    gg.moveTo(bx1,by1).lineTo(bx1,by1-h1).lineTo(bx2,by2-h2).lineTo(bx2,by2).stroke({width:4,color:0xf4f6ff});gg.moveTo(bx1,by1-h1).lineTo(nx1,ny1-h1*.85).moveTo(bx2,by2-h2).lineTo(nx2,ny2-h2*.85).moveTo(nx1,ny1).lineTo(nx1,ny1-h1*.85).moveTo(nx2,ny2).lineTo(nx2,ny2-h2*.85).stroke({width:2,color:0xdfe4f2,alpha:.9});
    gg.zIndex=by2+1;st.ents.addChild(gg);return gg};st.goals=[goal(0,1),goal(105,-1)];
  // players
  for(const d of [...st.h,...st.a])PX.addPlayer(st,d);
  // ball
  const ball=new P.Graphics();ball.circle(0,0,6).fill('#ffffff').stroke({width:1.4,color:0x222222});ball.poly([-2.5,-1,0,-3.3,2.6,-1,1.6,2.4,-1.6,2.4]).fill({color:0x222222,alpha:.75});st.ballG=ball;st.ents.addChild(ball);
  const bsh=new P.Sprite(shT);bsh.anchor.set(.5);st.ballSh=bsh;st.shadowC.addChild(bsh);
  // screen-space overlays
  const vig=new P.Sprite(P.Texture.from(pxSoftDot(256,[[0,'rgba(0,0,0,0)'],[.62,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.55)']])));vig.width=PXW*1.3;vig.height=PXH*1.5;vig.anchor.set(.5);vig.x=PXW/2;vig.y=PXH/2;app.stage.addChild(vig);
  st.flashG=new P.Graphics();st.flashG.rect(0,0,PXW,PXH).fill('#ffffff');st.flashG.alpha=0;app.stage.addChild(st.flashG);
  st.uiC=new P.Container();app.stage.addChild(st.uiC);
  app.canvas.addEventListener('click',ev=>{if(!st.onTap)return;const r=app.canvas.getBoundingClientRect();const sx=(ev.clientX-r.left)/r.width*PXW,sy=(ev.clientY-r.top)/r.height*PXH;const c=st.camC;const wx=(sx-c.position.x)/c.scale.x+c.pivot.x,wy=(sy-c.position.y)/c.scale.y+c.pivot.y;let best=null,bd=1e9;for(const d of [...st.h,...st.a]){if(!d.show||!d.sprite)continue;const [X,Y]=pxP(d.x,d.y);const s=prjS(d.y);const dy=wy-(Y-26*s);const dd=Math.hypot(wx-X,dy);if(dd<bd){bd=dd;best=d}}if(best&&bd<46)st.onTap(best.pid,best.team)});
  st.ready=true;PX.frame(st)};
PX.addPlayer=(st,d)=>{const P=st.P;const c=d.team===st.hid?st.hc:st.ac;const pl=d.pl||c.players.find(x=>x.id===d.pid);if(!pl)return;const kit=PX.kitFor(c,d.col,pl,pl.pos==='GK',d.team===st.hid,st.cols);
  const base=P.Texture.from(pxFigCanvas(kit));d.frames=[];for(let i=0;i<PXF.N;i++)d.frames.push(new P.Texture({source:base.source,frame:new P.Rectangle(i*PXF.W,0,PXF.W,PXF.H)}));
  const cont=new P.Container();const spr=new P.Sprite(d.frames[8]);spr.anchor.set(.5,.985);cont.addChild(spr);d.cont=cont;d.sprite=spr;st.ents.addChild(cont);
  const sh=new P.Sprite(st.shT);sh.anchor.set(.5);d.sh=sh;st.shadowC.addChild(sh);d.gk=pl.pos==='GK';d.name=pl.last||pl.first||''};
PX.label=(st,d,txt,color)=>{const P=st.P;if(!d.lab){const t=new P.Text({text:txt,style:{fontFamily:'Heebo, Arial, sans-serif',fontSize:24,fontWeight:'800',fill:color||'#ffffff',stroke:{color:'#050913',width:5},align:'center'}});t.anchor.set(.5,1);d.lab=t;st.uiC.addChild(t)}else{if(d.lab.text!==txt)d.lab.text=txt;if(color)d.lab.style.fill=color}return d.lab};
PX.toast=(st,txt,color)=>{if(!st.ready)return;const P=st.P;const ds=st.dispScale();const t=new P.Text({text:txt,style:{fontFamily:'Secular One, Heebo, Arial, sans-serif',fontSize:Math.round(clamp(30/ds,48,150)),fill:color||'#ffffff',stroke:{color:'#050913',width:Math.round(clamp(6/ds,8,22))},align:'center'}});t.anchor.set(.5);t.x=PXW/2;t.y=PXH*.32;t.alpha=0;st.uiC.addChild(t);st.fx.push({t,born:performance.now(),life:1500,kind:'pop'})};
PX.path=(st,pts,e,color,ms)=>{if(!st.ready)return;const P=st.P;const g=new P.Graphics();const sp=pts.map(([x,y])=>pxP(x,y));for(let i=0;i<sp.length-1;i++){const [x1,y1]=sp[i],[x2,y2]=sp[i+1];const L=Math.hypot(x2-x1,y2-y1);const n=Math.max(1,Math.floor(L/14));for(let k=0;k<n;k++){const f0=k/n,f1=(k+.55)/n;g.moveTo(x1+(x2-x1)*f0,y1+(y2-y1)*f0).lineTo(x1+(x2-x1)*f1,y1+(y2-y1)*f1)}}g.stroke({width:3.2,color,alpha:.95});for(const [x,y] of sp.slice(0,-1))g.circle(x,y,4).fill(color);
  if(e&&e.xg!=null&&e.rp){const [lx,ly]=sp[sp.length-2]||sp[0];const t=new P.Text({text:'xG '+e.xg.toFixed(2),style:{fontFamily:'Heebo, Arial, sans-serif',fontSize:20,fontWeight:'800',fill:'#ffffff',stroke:{color:'#050913',width:4}}});t.anchor.set(.5,1);t.x=lx;t.y=ly-14;g.addChild(t)}
  st.pathsC.addChild(g);st.fx.push({g,born:performance.now(),life:ms||3200,kind:'path'})};
PX.minute=(st,M,h,a,events)=>{
  const flip=M.m>45;st.flip=flip;const homeRight=!flip;
  const tot=M.poss[h.id]+M.poss[a.id];const homeHas=Math.random()<(M.poss[h.id]/Math.max(1,tot));st.poss=homeHas?h.id:a.id;const attRight=homeHas?homeRight:!homeRight;
  if(!st.seq&&!st.celeb){st.ball.tx=attRight?rnd(45,95):rnd(10,60);st.ball.ty=rnd(8,60)}
  const now=performance.now();
  for(const e of events){const mineRight=(e.team===h.id)===homeRight;
    if(e.path&&(e.t==='shot'||e.t==='goal'||e.t==='pen'||e.t==='penmiss')){const pts=e.path.map(([x,y])=>mineRight?[x,y]:[105-x,68-y]);st.seq={pts,i:0,t:0,ev:e,team:e.team};st.ball.x=pts[0][0];st.ball.y=pts[0][1];
      for(const id of [e.pid,e.asst,e.gk])if(id)st.labels[id]=now+2800;
      if(st.showPaths||e.t==='goal'||e.t==='pen')PX.path(st,pts,e,e.team===G.me?0x27f0a6:0xffd34d,e.t==='goal'||e.t==='pen'?5200:3200);
      if(e.sub==='save'&&e.gk){const end=pts[pts.length-1];st.dive={pid:e.gk,dir:end[1]>34?1:-1,until:now+1400,at:now+650}}}
    if(e.t==='goal'||e.t==='pen'||e.t==='own'){st.flash=1;st.shake=1;st.crowdJump=now+4200;st.crowdTeam=e.t==='own'?e.team:e.team;crowdPulse(st,e.team===G.me?'me':'');PX.toast(st,'שער',e.team===G.me?'#27f0a6':'#ffd34d');
      const scorerSide=(e.team===h.id)===homeRight;const sc=[...st.h,...st.a].find(d=>d.pid===e.pid&&d.team===e.team);const cy=sc&&sc.y<34?1.5:66.5;st.celeb={team:e.team,pid:e.pid,corner:[scorerSide?103.5:1.5,cy],until:now+2600+1400};st.hold=true}
    else if(e.t==='penmiss')PX.toast(st,'פנדל הוחמץ','#ff5c6c');
    else if(e.t==='shot'&&e.sub==='post')PX.toast(st,'קורה','#ffffff');
    else if(e.t==='shot'&&e.sub==='save'&&!e.quiet)PX.toast(st,'הצלה','#5cb8ff');
    else if(e.t==='corner'){st.ball.tx=mineRight?104:1;st.ball.ty=Math.random()<.5?1:67}
    else if(e.t==='var')PX.toast(st,'VAR','#ffffff');
    else if(e.t==='yellow'||e.t==='red'){if(e.pid){st.labels[e.pid]=now+2400;st.cards[e.pid]={c:e.t==='red'?0xe11d48:0xfacc15,until:now+2600}}}}
  const sync=(arr,c,homeSide)=>{const pos=pitchPositions(c,M,homeSide);const alive=new Set(M.xi[c.id].map(e=>e.pid));
    for(const d of arr){if(!alive.has(d.pid)&&d.show){d.show=false;if(d.cont)d.cont.visible=false;if(d.sh)d.sh.visible=false;if(d.lab)d.lab.visible=false}}
    for(const p of pos){let d=arr.find(x=>x.pid===p.pid);if(!d){const pl=c.players.find(x=>x.id===p.pid);d={pid:p.pid,team:c.id,bx:p.x,by:p.y,x:52.5,y:72,ph:0,face:homeSide?1:-1,pl,home:homeSide,col:c.id===st.hid?st.cols.h:st.cols.a,show:true,name:pl?(pl.last||pl.first):''};arr.push(d);if(st.ready)PX.addPlayer(st,d);st.labels[p.pid]=performance.now()+2800}d.bx=p.x;d.by=p.y;d.home=homeSide}};
  sync(st.h,h,homeRight);sync(st.a,a,!homeRight)};
PX.replay=(st,e,h,done)=>{st.pending={e,h,done};if(!st.celeb)PX.startReplay(st)};
PX.startReplay=(st)=>{const R=st.pending;st.pending=null;if(!R)return;const {e,h,done}=R;
  if(!e.path||motionLevel()!=='full'||(G&&G.replay===false)||!st.ready){st.hold=false;done&&done();return}
  const homeRight=!(e.m>45);const mineRight=(e.team===h.id)===homeRight;const pts=e.path.map(([x,y])=>mineRight?[x,y]:[105-x,68-y]);
  const over=$('arenaOver');if(over)over.innerHTML=`<div class="rp-tag"><span class="dot"></span><b>שידור חוזר</b><span><bdi>${esc(e.name)}</bdi> <bdi dir="ltr">${e.m}'</bdi>${e.asstName?` · בישול <bdi>${esc(e.asstName)}</bdi>`:''}</span><bdi dir="ltr" class="xg">xG ${e.xg!=null?e.xg.toFixed(2):'—'}</bdi></div>`;
  const segs=[];let total=0;for(let i=0;i<pts.length-1;i++){const l=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);segs.push(l);total+=l}
  const shooter=[...st.h,...st.a].find(d=>d.pid===e.pid&&d.team===e.team);const gkD=[...st.h,...st.a].find(d=>d.gk&&d.team!==e.team&&d.show);
  if(shooter){shooter.rx=pts[0][0];shooter.ry=pts[0][1]}
  st.rp={pts,segs,total,t0:performance.now(),dur:2600,shooter,gk:gkD,done:()=>{if(over)over.innerHTML='';st.rp=null;st.hold=false;done&&done()}};PX.path(st,pts,{xg:e.xg,rp:1},0xffffff,3400)};
PX.destroy=(st)=>{try{if(st.app){st.app.destroy({removeView:true},{children:true,texture:true,textureSource:true})}}catch(e){}st.app=null;st.ready=false;if(PX.cur===st)PX.cur=null};
PX.frame=(st)=>{if(!st||!st.ready||!st.app)return;if(!st.host.isConnected){PX.destroy(st);return}
  const now=performance.now();const dt=Math.min(64,now-st.last);st.last=now;const k=dt/16.7;st.frame++;const b=st.ball;const all=[...st.h,...st.a];
  // celebration → replay hand-off
  if(st.celeb&&now>st.celeb.until){st.celeb=null;if(st.pending)PX.startReplay(st);else st.hold=false}
  // ball
  if(st.rp){const R=st.rp;const u=Math.min(1,(now-R.t0)/R.dur);const ease=u<.75?u/.75*.82:.82+(u-.75)/.25*.18;let dd=ease*R.total,i=0;while(i<R.segs.length-1&&dd>R.segs[i]){dd-=R.segs[i];i++}const f=R.segs[i]?Math.min(1,dd/R.segs[i]):1;const p0=R.pts[i],p1=R.pts[i+1]||p0;b.x=p0[0]+(p1[0]-p0[0])*f;b.y=p0[1]+(p1[1]-p0[1])*f;b.z=R.segs[i]>14&&i<R.segs.length-1?Math.sin(f*Math.PI)*Math.min(4,R.segs[i]*.16):(i===R.segs.length-1?Math.sin(f*Math.PI)*.8:0);if(R.shooter&&u<.35){R.shooter.tx=R.pts[Math.max(0,R.pts.length-2)][0];R.shooter.ty=R.pts[Math.max(0,R.pts.length-2)][1]}if(u>=1&&!R.ending){R.ending=true;setTimeout(R.done,650)}}
  else if(st.snap){if(st.seq){const e=st.seq.pts[st.seq.pts.length-1];b.x=e[0];b.y=e[1];st.seq=null}else{b.x=b.tx;b.y=b.ty}b.z=0}
  else if(st.seq&&!st.celeb){const q=st.seq;const p0=q.pts[q.i],p1=q.pts[q.i+1];if(!p1){st.seq=null;b.tx=b.x;b.ty=b.y}else{const len=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]);const last=q.i===q.pts.length-2;q.t+=(last?2.6:1.5)/Math.max(6,len)*k;const t=Math.min(1,q.t);b.x=p0[0]+(p1[0]-p0[0])*t;b.y=p0[1]+(p1[1]-p0[1])*t;b.z=len>14&&!last?Math.sin(t*Math.PI)*Math.min(4,len*.16):(last?Math.sin(t*Math.PI)*.8:0);b.tx=b.x;b.ty=b.y;
      const mover=q.team===st.hid?st.h:st.a;const sh=mover.find(d=>d.pid===q.ev.pid);if(sh){sh.tx=q.pts[q.pts.length-2][0];sh.ty=q.pts[q.pts.length-2][1];if(last&&t<.25)st.kick={pid:sh.pid,until:now+260}}
      const opp=q.team===st.hid?st.a:st.h;const gk=opp.find(d=>d.gk&&d.show)||opp[0];if(gk&&last){const e=q.pts[q.pts.length-1];gk.tx=gk.bx+(e[0]-gk.bx)*.35;gk.ty=clamp(e[1],28,40)}
      if(q.t>=1){q.i++;q.t=0;if(q.i>=q.pts.length-1){st.seq=null;b.z=0}}}}
  else if(st.celeb){const sc=all.find(d=>d.pid===st.celeb.pid&&d.team===st.celeb.team);const gx=st.celeb.corner[0]>52?105:0;b.x+=(gx+(gx?-.8:.8)-b.x)*.1*k;b.y+=(34-b.y)*.1*k;b.z*=.8}
  else if(!st.hold){b.x+=(b.tx-b.x)*.1*k;b.y+=(b.ty-b.y)*.1*k;b.z*=Math.pow(.85,k)}
  // players
  const C=st.celeb;
  for(const d of all){if(!d.show||!d.cont)continue;let tx,ty,pose=null;
    if(st.rp){if(st.rp.shooter===d&&d.rx!=null){d.tx=st.rp.pts[Math.max(0,st.rp.pts.length-2)][0];d.ty=st.rp.pts[Math.max(0,st.rp.pts.length-2)][1]}}
    if(C&&d.team===C.team){const sc=all.find(x=>x.pid===C.pid&&x.team===C.team);if(d===sc){tx=C.corner[0];ty=C.corner[1]}else if(sc&&Math.hypot(d.x-sc.x,d.y-sc.y)<30&&!d.gk){const ang=(d.pid%7)/7*Math.PI*2;tx=sc.x+Math.cos(ang)*2.2;ty=sc.y+Math.sin(ang)*1.6}else{tx=d.bx;ty=d.by}if(Math.hypot((tx??d.x)-d.x,(ty??d.y)-d.y)<1.6)pose='cele'}
    else if(C){tx=d.bx;ty=d.by}
    else if(d.tx!=null){tx=d.tx;ty=d.ty;if(Math.hypot(tx-d.x,ty-d.y)<.6)d.tx=null}
    else{const pull=st.entranceDone===false?0:.22;const w=st.entranceDone===false?0:Math.sin(now*.0007+d.pid)*1.1;tx=d.bx+(b.x-d.bx)*pull+w;ty=d.by+(b.y-d.by)*pull+Math.cos(now*.0006+d.pid*1.7)*.8}
    const kk=st.snap?1:(st.hold&&!C&&!st.rp?.03:.075)*k;const ox=d.x,oy=d.y;d.x+=(tx-d.x)*Math.min(1,kk);d.y+=(ty-d.y)*Math.min(1,kk);
    const sp=Math.hypot(d.x-ox,d.y-oy)/Math.max(.2,k);if(Math.abs(d.x-ox)>.004)d.face=d.x>ox?1:-1;
    if(st.dive&&st.dive.pid===d.pid&&now>st.dive.at&&now<st.dive.until)pose='dive';if(st.kick&&st.kick.pid===d.pid&&now<st.kick.until)pose='kick';
    let fi;if(pose==='cele')fi=9;else if(pose==='dive')fi=10;else if(pose==='kick')fi=11;else if(sp>.012&&!st.snap){d.ph=(d.ph+sp*5.2*k)%8;fi=Math.floor(d.ph)}else fi=8;
    const tex=d.frames&&d.frames[fi];if(tex&&d.sprite.texture!==tex)d.sprite.texture=tex;
    const [X,Y]=pxP(d.x,d.y);const s=prjS(d.y);const SC=(st.dispScale()<.45?.6:.5)*s;d.cont.x=X;d.cont.y=Y;d.cont.zIndex=Y;d.sprite.scale.set(SC*d.face,SC);
    d.sprite.rotation=pose==='dive'?(st.dive.dir>0?1:-1)*1.15*(d.home===(d.x<52.5)?1:1):0;if(pose==='dive'){d.sprite.y=-14*s}else d.sprite.y=0;
    if(pose==='cele'){d.sprite.y=-Math.abs(Math.sin(now*.012+d.pid))*9*s}
    d.sh.x=X;d.sh.y=Y;d.sh.width=34*s;d.sh.height=11*s;
    const lt=st.labels[d.pid];const show=lt&&lt>now;const card=st.cards[d.pid]&&st.cards[d.pid].until>now?st.cards[d.pid]:null;
    if(show||card){const ds=st.dispScale();const lab=PX.label(st,d,d.name,card?(card.c===0xe11d48?'#ff8fa3':'#fde68a'):'#ffffff');lab.visible=true;const c=st.camC;const sx=(X-c.pivot.x)*c.scale.x+c.position.x,sy=(Y-62*s-c.pivot.y)*c.scale.y+c.position.y;lab.x=sx;lab.y=sy;lab.scale.set(clamp(.7/ds,1,3.2)*.6)}else if(d.lab)d.lab.visible=false}
  // ball draw
  { const [BX,BY]=pxP(b.x,b.y);const s=prjS(b.y);st.ballG.x=BX;st.ballG.y=BY-(7+b.z*PXK*.9)*s;st.ballG.scale.set(s*.95);st.ballG.rotation+=.12*k*(st.seq?1:.3);st.ballG.zIndex=BY+.5;st.ballSh.x=BX;st.ballSh.y=BY;st.ballSh.width=(16+b.z*2)*s;st.ballSh.height=(6+b.z*.6)*s;st.ballSh.alpha=Math.max(.25,.8-b.z*.12)}
  // heat sampling (same grid as the SVG arena)
  if(st.frame%6===0&&!st.rp&&!st.celeb){for(const arr of [st.h,st.a]){const grid=st.heat[arr===st.h?st.hid:st.aid];for(const d of arr){if(!d.show)continue;const gx=clamp(Math.floor(d.x/10.5),0,9),gy=clamp(Math.floor(d.y/11.4),0,5);grid[gy*10+gx]++}}}
  // camera: broadcast pan, zoom on chances, celebration and replay
  let fz=1.12,[fx,fy]=pxP(b.x,clamp(b.y,14,54));fy=Math.max(fy,PXH*.5);
  if(st.seq){fz=1.42;[fx,fy]=pxP(b.x,b.y)}
  if(C){const sc=all.find(x=>x.pid===C.pid&&x.team===C.team);if(sc){fz=1.6;[fx,fy]=pxP(sc.x,sc.y);fy-=20}}
  if(st.rp){const e=st.rp.pts[st.rp.pts.length-2]||st.rp.pts[0];fz=1.75;[fx,fy]=pxP((e[0]+b.x)/2,(e[1]+b.y)/2)}
  if(st.entranceDone===false){fz=1.25;[fx,fy]=pxP(52.5,60)}
  if(st.snap){fz=1.05;[fx,fy]=pxP(52.5,34)}
  const cm=st.cam;const ck=st.snap?1:Math.min(1,(st.rp||C?.08:.045)*k);cm.z+=(fz-cm.z)*ck;cm.x+=(fx-cm.x)*ck;cm.y+=(fy-cm.y)*ck;
  const hw=PXW/(2*cm.z),hh=PXH/(2*cm.z);const cx=clamp(cm.x,hw,PXW-hw),cy=clamp(cm.y,hh,PXH-hh);
  let shx=0,shy=0;if(st.shake>0){shx=(Math.random()-.5)*14*st.shake;shy=(Math.random()-.5)*10*st.shake;st.shake=Math.max(0,st.shake-.035*k)}
  st.camC.pivot.set(cx+shx,cy+shy);st.camC.position.set(PXW/2,PXH/2);st.camC.scale.set(cm.z);
  // crowd life, camera flashes, floodlights
  if(!st.snap){const jump=now<st.crowdJump;for(const c of st.crowd){let y=c.y+Math.sin(now*.003*c.amp+c.ph)*.5;if(jump&&c.team===st.crowdTeam)y-=Math.abs(Math.sin(now*.018+c.ph))*5.5;else if(jump)y+=.6;c.s.y=y}
    const rate=now<st.crowdJump?.18:.012;for(const f of st.flashes){if(f.t>0){f.t-=dt;f.s.alpha=Math.max(0,f.t/90)}else if(Math.random()<rate*k){f.t=90;f.s.x=Math.random()*PXW;f.s.y=7*PXK+Math.random()*24*PXK}else f.s.alpha=0}
    for(const bl of st.blooms){bl.b.alpha=.72+Math.sin(now*.0011+bl.ph)*.06}}
  if(st.flash>0){st.flashG.alpha=Math.max(0,st.flash)*.45;st.flash-=.05*k}else st.flashG.alpha=0;
  // transient fx
  st.fx=st.fx.filter(f=>{const u=(now-f.born)/f.life;if(u>=1){(f.t||f.g).destroy({children:true});return false}if(f.kind==='pop'){const s=u<.15?u/.15:1;f.t.scale.set(.6+.4*s);f.t.alpha=u<.15?u/.15:u>.75?(1-u)/.25:1}else if(f.kind==='path'){f.g.alpha=u>.8?(1-u)/.2:1}return true});
  st.app.render()};

