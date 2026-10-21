/* ====================== 2.5D STADIUM (projected SVG, no 3D libs) ======================
   Pitch coords: x 0→105 (home goal at x=0 in the first half), y 0→68 (0 = far touchline). Everything on the pitch is
   projected through prj(); sprites are upright so they read as players, the pitch itself is a trapezoid.      */
const P25={cx:80,top:25,depth:57,wide:1.42,sMin:.6,W:160,H:100};
function prjS(y){const t=clamp(y/68,-.3,1.3);return P25.sMin+(1-P25.sMin)*t}
function prj(x,y){const t=clamp(y/68,-.3,1.3);const s=prjS(y);return [P25.cx+(x-52.5)*P25.wide*s,P25.top+P25.depth*(t*(.62+.38*t))]}
function pp(x,y){const [X,Y]=prj(x,y);return X.toFixed(2)+','+Y.toFixed(2)}
function ppoly(pts){return pts.map(([x,y])=>pp(x,y)).join(' ')}
function parcPts(cx,cy,r,a0,a1,n){const o=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;o.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}return o}
function motionLevel(){if(G&&G.motion)return G.motion;return (window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)?'low':'full'}
function goalSVG(x,dir){ // dir: +1 goal opens towards +x (left goal), -1 right goal
  const hz=y=>2.44*P25.wide*prjS(y)*.92;const y1=30.34,y2=37.66,back=x-dir*1.9;
  const [bx1,by1]=prj(x,y1),[bx2,by2]=prj(x,y2),[nx1,ny1]=prj(back,y1),[nx2,ny2]=prj(back,y2);
  const t1=by1-hz(y1),t2=by2-hz(y2),nt1=ny1-hz(y1)*.9,nt2=ny2-hz(y2)*.9;
  const net=[];for(let i=1;i<6;i++){const f=i/6;net.push(`<line x1="${(nx1+(nx2-nx1)*f).toFixed(2)}" y1="${(nt1+(nt2-nt1)*f).toFixed(2)}" x2="${(nx1+(nx2-nx1)*f).toFixed(2)}" y2="${(ny1+(ny2-ny1)*f).toFixed(2)}"/>`)}
  for(let i=1;i<4;i++){const f=i/4;net.push(`<line x1="${nx1.toFixed(2)}" y1="${(nt1+(ny1-nt1)*f).toFixed(2)}" x2="${nx2.toFixed(2)}" y2="${(nt2+(ny2-nt2)*f).toFixed(2)}"/>`)}
  return `<g class="goal"><polygon points="${bx1.toFixed(2)},${t1.toFixed(2)} ${nx1.toFixed(2)},${nt1.toFixed(2)} ${nx2.toFixed(2)},${nt2.toFixed(2)} ${bx2.toFixed(2)},${t2.toFixed(2)}" fill="rgba(255,255,255,.08)"/><polygon points="${nx1.toFixed(2)},${nt1.toFixed(2)} ${nx2.toFixed(2)},${nt2.toFixed(2)} ${nx2.toFixed(2)},${ny2.toFixed(2)} ${nx1.toFixed(2)},${ny1.toFixed(2)}" fill="rgba(255,255,255,.1)"/><g stroke="rgba(255,255,255,.35)" stroke-width=".18">${net.join('')}</g>
  <g stroke="#f4f6ff" stroke-width=".55" stroke-linecap="round" fill="none"><line x1="${bx1.toFixed(2)}" y1="${by1.toFixed(2)}" x2="${bx1.toFixed(2)}" y2="${t1.toFixed(2)}"/><line x1="${bx2.toFixed(2)}" y1="${by2.toFixed(2)}" x2="${bx2.toFixed(2)}" y2="${t2.toFixed(2)}"/><line x1="${bx1.toFixed(2)}" y1="${t1.toFixed(2)}" x2="${bx2.toFixed(2)}" y2="${t2.toFixed(2)}"/><line x1="${bx1.toFixed(2)}" y1="${t1.toFixed(2)}" x2="${nx1.toFixed(2)}" y2="${nt1.toFixed(2)}" stroke-width=".35"/><line x1="${bx2.toFixed(2)}" y1="${t2.toFixed(2)}" x2="${nx2.toFixed(2)}" y2="${nt2.toFixed(2)}" stroke-width=".35"/></g></g>`}
/* static stadium backdrop: painted once on a canvas (crowd in club colours, away end, near stand, dugouts, skyline,
   floodlights) and placed behind the pitch as an image; falls back to an SVG pattern where canvas is unavailable */
const _stadCache={},_stadCanv={};
function stadiumBitmap(h,a,cap){const key=h.id+'|'+a.id+'|'+(cap||0);if(_stadCache[key]!==undefined)return _stadCache[key];let url=null;
  try{const K=8,W=P25.W*K,H=P25.H*K;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext&&cv.getContext('2d');if(!g)throw 0;
    let seed=(String(h.id+a.id).split('').reduce((t,c)=>t*31+c.charCodeAt(0),7)>>>0)||1;const R=()=>{seed^=seed<<13;seed>>>=0;seed^=seed>>>17;seed^=seed<<5;seed>>>=0;return seed/4294967296};
    const X=(x,y)=>prj(x,y)[0]*K,Y=(x,y)=>prj(x,y)[1]*K;
    // sky + skyline
    let gr=g.createLinearGradient(0,0,0,H*.35);gr.addColorStop(0,'#03060f');gr.addColorStop(1,'#0e1830');g.fillStyle=gr;g.fillRect(0,0,W,H);
    for(let x=0;x<W;){const bw=(14+R()*40),bh=(20+R()*70);g.fillStyle='#070c1b';g.fillRect(x,8*K-bh,bw,bh+40);g.fillStyle='rgba(255,214,140,.55)';for(let wy=8*K-bh+6;wy<8*K;wy+=9)for(let wx=x+4;wx<x+bw-4;wx+=8)if(R()<.28)g.fillRect(wx,wy,3,4);x+=bw+2+R()*6}
    // stand silhouettes
    const fl=[X(-6,-3),Y(-6,-3)],fr=[X(111,-3),Y(111,-3)],nl=[X(-6,72),Y(-6,72)],nr=[X(111,72),Y(111,72)];
    const tierTop=6.5*K;
    const poly=(pts,fill)=>{g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const q of pts.slice(1))g.lineTo(q[0],q[1]);g.closePath();g.fillStyle=fill;g.fill()};
    poly([[0,tierTop],[W,tierTop],[fr[0],fr[1]],[fl[0],fl[1]]],'#151c31');
    poly([[0,tierTop],[fl[0],fl[1]],[nl[0],nl[1]],[0,nl[1]]],'#121a2e');
    poly([[W,tierTop],[fr[0],fr[1]],[nr[0],nr[1]],[W,nr[1]]],'#121a2e');
    poly([[0,nl[1]],[nl[0],nl[1]],[nr[0],nr[1]],[W,nr[1]],[W,H],[0,H]],'#0d1324');
    // crowd: per-fan head + torso, colours by section; empty seats shown when attendance is low
    const fill=clamp(cap||.85,.25,1);
    const home=[h.c1,h.c1,h.c2||'#fff',h.c1,'#ffffff'],away=[a.c1,a.c2||'#fff',a.c1],neutral=['#3a4560','#55607a','#2c3550','#6b7690','#a8743c'];
    const inPoly=(pts,x,y)=>{let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i],[xj,yj]=pts[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c};
    const crowd=(pts,ymin,ymax,awayTest,sizeAt)=>{for(let y=ymin;y<ymax;){const sz=sizeAt(y);for(let x=-sz;x<W+sz;x+=sz*(1.05+R()*.25)){const jx=x+R()*sz*.4,jy=y+R()*sz*.3;if(!inPoly(pts,jx,jy))continue;
        if(R()>fill){g.fillStyle='#1d2640';g.fillRect(jx-sz*.32,jy-sz*.1,sz*.64,sz*.5);continue}
        const pal=awayTest(jx,jy)?away:(R()<.82?home:neutral);const c=pal[(R()*pal.length)|0];
        g.fillStyle=c;g.globalAlpha=.78+R()*.22;g.fillRect(jx-sz*.34,jy,sz*.68,sz*.62);g.fillStyle=R()<.5?'#c49a7a':'#8a6248';g.beginPath();g.arc(jx,jy-sz*.12,sz*.24,0,6.283);g.fill();
        if(R()<.025){g.fillStyle=pal[0];g.fillRect(jx,jy-sz*1.5,sz*1.4,sz*.9);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(jx,jy-sz*1.5,sz*.15,sz*1.9)}g.globalAlpha=1}
        y+=sz*.78}};
    const farStand=[[0,tierTop],[W,tierTop],[fr[0],fr[1]-3*K],[fl[0],fl[1]-3*K]];
    crowd(farStand,tierTop+2,fl[1]-3*K,(x)=>x<W*.2,y=>4+(y-tierTop)/(fl[1]-tierTop)*4);
    crowd([[0,tierTop],[fl[0],fl[1]-2*K],[nl[0],nl[1]],[0,nl[1]]],tierTop+2,nl[1],()=>true,y=>5+(y-tierTop)/(nl[1]-tierTop)*7);
    crowd([[W,tierTop],[fr[0],fr[1]-2*K],[nr[0],nr[1]],[W,nr[1]]],tierTop+2,nr[1],()=>false,y=>5+(y-tierTop)/(nr[1]-tierTop)*7);
    // near stand: backs of heads, larger
    crowd([[0,nl[1]+2*K],[W,nr[1]+2*K],[W,H],[0,H]],nl[1]+2*K,H+10,(x)=>x<W*.12,y=>12+(y-nl[1])/(H-nl[1])*10);
    // stand roofs / tier lines
    g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,tierTop-2,W,4);g.fillStyle='rgba(255,255,255,.05)';for(let i=1;i<4;i++){const yy=tierTop+(fl[1]-tierTop)*i/4;g.fillRect(0,yy,W,1.5)}
    // pitch surround (track/grass margin) + advertising hoarding shadow handled in SVG; dugouts on the near side
    const dug=(x0,x1)=>{const y0=Y(x0,71.5);const xa=X(x0,71.5),xb=X(x1,71.5);const hgt=4.2*K;g.fillStyle='rgba(180,215,255,.22)';g.beginPath();g.moveTo(xa,y0);g.lineTo(xb,y0);g.lineTo(xb-6,y0-hgt);g.quadraticCurveTo((xa+xb)/2,y0-hgt*1.35,xa+6,y0-hgt);g.closePath();g.fill();g.strokeStyle='rgba(220,235,255,.55)';g.lineWidth=2;g.stroke();
      g.fillStyle='#0b1020';g.fillRect(xa+4,y0-hgt*.55,xb-xa-8,hgt*.55);for(let i=0;i<7;i++){g.fillStyle=i%3?'#1c2540':'#2a344f';const px=xa+10+i*(xb-xa-20)/6;g.beginPath();g.arc(px,y0-hgt*.45,K*.55,0,6.283);g.fill()}};
    dug(30,44);dug(61,75);
    // floodlights: masts + glow + light cones
    for(const [mx,my] of [[12*K,1.5*K],[W-12*K,1.5*K],[W*.38,.8*K],[W*.62,.8*K]]){g.strokeStyle='#59627d';g.lineWidth=K*.35;g.beginPath();g.moveTo(mx,my);g.lineTo(mx+(mx<W/2?3*K:-3*K),tierTop+3*K);g.stroke();
      g.fillStyle='#fffbe8';for(let i=0;i<6;i++)g.fillRect(mx-3*K+i*K,my-.6*K,.7*K,1.1*K);const rg=g.createRadialGradient(mx,my,0,mx,my,16*K);rg.addColorStop(0,'rgba(255,248,220,.75)');rg.addColorStop(.2,'rgba(255,240,190,.22)');rg.addColorStop(1,'rgba(255,240,190,0)');g.fillStyle=rg;g.beginPath();g.arc(mx,my,16*K,0,6.283);g.fill()}
    // atmospheric haze over the stands
    gr=g.createLinearGradient(0,tierTop,0,H);gr.addColorStop(0,'rgba(140,170,255,.06)');gr.addColorStop(.5,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=gr;g.fillRect(0,0,W,H);
    _stadCanv[key]=cv;url=cv.toDataURL('image/jpeg',.82)}catch(e){url=null}
  _stadCache[key]=url;return url}
function standSVG(h,a,cap){const url=stadiumBitmap(h,a,cap);
  if(url)return `<defs><radialGradient id="pitchLight" cx=".5" cy=".5" r=".65"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".75" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient></defs><image href="${url}" x="0" y="0" width="${P25.W}" height="${P25.H}" preserveAspectRatio="none"/>`;
  const crowd=(id,c1,c2)=>`<pattern id="${id}" width="2.4" height="1.9" patternUnits="userSpaceOnUse"><rect width="2.4" height="1.9" fill="#1a2238"/><circle cx=".6" cy=".5" r=".42" fill="${c1}" opacity=".75"/><circle cx="1.8" cy=".5" r=".42" fill="#55607a"/><circle cx="1.2" cy="1.45" r=".42" fill="${c2}" opacity=".6"/></pattern>`;
  const [fl,ft]=prj(-6,-3),[fr]=prj(111,-3),[nl,nt]=prj(-6,72),[nr]=prj(111,72);
  return `<defs>${crowd('crH',h.c1,h.c2||'#fff')}${crowd('crA',a.c1,a.c2||'#fff')}<radialGradient id="pitchLight" cx=".5" cy=".5" r=".65"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".75" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient></defs>
  <rect width="${P25.W}" height="${P25.H}" fill="#0b1226"/><polygon points="0,6 160,6 ${fr.toFixed(1)},${ft.toFixed(1)} ${fl.toFixed(1)},${ft.toFixed(1)}" fill="url(#crH)"/><polygon points="0,6 ${fl.toFixed(1)},${ft.toFixed(1)} ${nl.toFixed(1)},${nt.toFixed(1)} 0,${nt.toFixed(1)}" fill="url(#crA)"/><polygon points="160,6 ${fr.toFixed(1)},${ft.toFixed(1)} ${nr.toFixed(1)},${nt.toFixed(1)} 160,${nt.toFixed(1)}" fill="url(#crH)"/><rect y="${(nt+2).toFixed(1)}" width="160" height="20" fill="url(#crH)"/><rect width="${P25.W}" height="${P25.H}" fill="rgba(5,9,26,.25)"/>`}
function logoURL(){if(logoURL.v!==undefined)return logoURL.v;let v='';try{const m=getComputedStyle(document.documentElement).getPropertyValue('--logo').match(/url\(["']?([^"')]+)["']?\)/);v=m?m[1]:''}catch(e){}logoURL.v=v;return v}
function boardSlots(h,a){const hs=sponsorName(h)||(h.naming&&h.naming.brand)||h.name,as=sponsorName(a)||a.name;const dad=AdSvc.pick('boards');const side=dad?'פרסומת (הדגמה): '+dad.creative.text:(h.naming&&h.naming.brand)||hs;
  return [{t:hs,c:'#8fe3ff',w:1},{t:as,c:'#ffd34d',w:1},{logo:true,w:1.55},{t:side,c:'#8fe3ff',w:1},{t:hs,c:'#ffd34d',w:1}]}
function boardsSVG(h,a){const [fl,ft]=prj(-3,-2.2),[fr]=prj(108,-2.2);const sl=boardSlots(h,a);const tot=sl.reduce((t,x)=>t+x.w,0);const unit=(fr-fl)/tot;const top=ft-3.4;let x=fl;const L=logoURL();
  const parts=sl.map(b=>{const w=b.w*unit,x0=x;x+=w;if(b.logo)return `<g class="premium"><rect x="${(x0+.3).toFixed(2)}" y="${(top-.5).toFixed(2)}" width="${(w-.6).toFixed(2)}" height="4.1" rx=".4" fill="#07080c" stroke="#d9b45a" stroke-width=".35"/>${L?`<image href="${L}" x="${(x0+.9).toFixed(2)}" y="${(top-.25).toFixed(2)}" width="${(w-1.8).toFixed(2)}" height="3.6" preserveAspectRatio="xMidYMid meet"/>`:`<text x="${(x0+w/2).toFixed(2)}" y="${(ft-1).toFixed(2)}" text-anchor="middle" font-size="2.3" font-weight="900" fill="#e9c46a">GOALASSO</text>`}</g>`;
    return `<text x="${(x0+w/2).toFixed(2)}" y="${(ft-1.1).toFixed(2)}" text-anchor="middle" font-size="2.1" font-weight="700" fill="${b.c}" opacity=".9" direction="rtl"${esc(b.t).length*1.15>w-1?` textLength="${(w-1.2).toFixed(1)}" lengthAdjust="spacingAndGlyphs"`:''}>${esc(b.t)}</text>`}).join('');
  return `<g class="boards"><polygon points="${fl.toFixed(1)},${top.toFixed(1)} ${fr.toFixed(1)},${top.toFixed(1)} ${fr.toFixed(1)},${ft.toFixed(1)} ${fl.toFixed(1)},${ft.toFixed(1)}" fill="#0d1428" stroke="#2a3a66" stroke-width=".2"/>${parts}</g>`}
function centreLogoSVG(){const L=logoURL();if(!L)return '';const [cx,cy]=prj(52.5,34);const s=prjS(34);const w=15*s,h=w*240/547;return `<image href="${L}" x="${(cx-w/2).toFixed(2)}" y="${(cy-h*.28).toFixed(2)}" width="${w.toFixed(2)}" height="${(h*.56).toFixed(2)}" preserveAspectRatio="none" opacity=".26" style="mix-blend-mode:screen"/>`}
function pitch2dHTML(h,a,cap){return usePixi()?PX.html(cap):pitch2dSVG(h,a,cap)}
function pitch2dSVG(h,a,cap){
  const stripes=[`<polygon points="${ppoly([[-5,-3],[110,-3],[110,72],[-5,72]])}" fill="#24602f"/>`];for(let i=0;i<14;i++){const x0=i*7.5,x1=x0+7.5;stripes.push(`<polygon points="${ppoly([[x0,0],[x1,0],[x1,68],[x0,68]])}" fill="${i%2?'#348a4a':'#2c773e'}"/>`)}for(let j=0;j<6;j++){if(j%2)continue;stripes.push(`<polygon points="${ppoly([[0,j*11.33],[105,j*11.33],[105,(j+1)*11.33],[0,(j+1)*11.33]])}" fill="rgba(255,255,255,.035)"/>`)}
  const L=`<g fill="none" stroke="rgba(255,255,255,.72)" stroke-width=".32" stroke-linejoin="round">
   <polygon points="${ppoly([[0,0],[105,0],[105,68],[0,68]])}"/><polyline points="${ppoly([[52.5,0],[52.5,68]])}"/><polygon points="${ppoly(parcPts(52.5,34,9.15,0,Math.PI*2,40))}"/>
   <polygon points="${ppoly([[0,13.85],[16.5,13.85],[16.5,54.15],[0,54.15]])}"/><polygon points="${ppoly([[105,13.85],[88.5,13.85],[88.5,54.15],[105,54.15]])}"/>
   <polygon points="${ppoly([[0,24.85],[5.5,24.85],[5.5,43.15],[0,43.15]])}"/><polygon points="${ppoly([[105,24.85],[99.5,24.85],[99.5,43.15],[105,43.15]])}"/>
   <polyline points="${ppoly(parcPts(11,34,9.15,-.93,.93,14))}"/><polyline points="${ppoly(parcPts(94,34,9.15,Math.PI-.93,Math.PI+.93,14))}"/></g>
   <circle cx="${prj(11,34)[0].toFixed(2)}" cy="${prj(11,34)[1].toFixed(2)}" r=".35" fill="rgba(255,255,255,.8)"/><circle cx="${prj(94,34)[0].toFixed(2)}" cy="${prj(94,34)[1].toFixed(2)}" r=".35" fill="rgba(255,255,255,.8)"/><circle cx="${prj(52.5,34)[0].toFixed(2)}" cy="${prj(52.5,34)[1].toFixed(2)}" r=".35" fill="rgba(255,255,255,.8)"/>`;
  return `<div class="arena" id="arena"><svg viewBox="0 0 ${P25.W} ${P25.H}" preserveAspectRatio="xMidYMid meet" id="p2d" aria-hidden="true">${standSVG(h,a,cap)}${boardsSVG(h,a)}
   <g id="p2dPitch">${stripes.join('')}<polygon points="${ppoly([[0,0],[105,0],[105,68],[0,68]])}" fill="url(#pitchLight)"/>${centreLogoSVG()}${L}</g>
   ${goalSVG(0,1)}${goalSVG(105,-1)}
   <g id="p2dShadows"></g><g id="p2dPaths"></g><g id="p2dTok"></g><g id="p2dFx"></g><rect id="p2dFlash" x="0" y="0" width="${P25.W}" height="${P25.H}" fill="#fff" opacity="0" pointer-events="none"/></svg>
   <div class="arena-over" id="arenaOver"></div></div>`}
function pitchPositions(c,M,homeSide){const lay=slotLayout(c.formation||'4-3-3');const xs=M.xi[c.id];
  return xs.map((e,i)=>{const li=Math.min(i,lay.length-1);const depth=(100-lay[li].y)/100;const lat=lay[li].x/100;const x=homeSide?4+depth*46:101-depth*46;const y=homeSide?6+lat*56:62-lat*56;return {x,y,pid:e.pid}})}
function hexRGB(h){h=String(h||'#888').replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16)||0;return [(n>>16)&255,(n>>8)&255,n&255]}
function colDist(a,b){const x=hexRGB(a),y=hexRGB(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2])}
/* kit clash: if both teams wear similar colours the away side switches to its second kit (or a neutral one) */
function matchColors(h,a){const strokeOf=c=>c==='#ffffff'?'#111':c;const hf=h.c1,hs=strokeOf(h.c2);let af=a.c1,as=strokeOf(a.c2);
  if(colDist(hf,af)<110){if(a.c2&&a.c2!=='#ffffff'&&colDist(hf,a.c2)>=110){af=a.c2;as=a.c1}else{const lum=hexRGB(hf).reduce((s,v)=>s+v,0)/3;af=lum>140?'#1b1b1b':'#ffffff';as=lum>140?'#fff':'#111'}}
  return {h:{fill:hf,stroke:hs,shorts:hs},a:{fill:af,stroke:as,shorts:as}}}
function tokenSVG(col,gk,num,shorts){const bodyFill=gk?col.stroke:col.fill,bodyStroke=gk?col.fill:col.stroke;const sh=shorts||bodyStroke;return `<ellipse class="sh" cx="0" cy=".3" rx="2.2" ry=".7" fill="rgba(0,0,0,.42)"/><path d="M-1.15,0 L-.95,-1.5 M1.15,0 L.95,-1.5" stroke="${bodyFill}" stroke-width=".75" stroke-linecap="round"/><path d="M-1.15,-.05 L-.85,-.6 M1.15,-.05 L.85,-.6" stroke="#f3f3f3" stroke-width=".8"/><rect x="-1.45" y="-2.75" width="2.9" height="1.45" rx=".35" fill="${sh}"/><path d="M-1.6,-5.4 Q0,-5.95 1.6,-5.4 L2.35,-4.5 L1.7,-3.95 L1.45,-4.3 L1.45,-2.6 L-1.45,-2.6 L-1.45,-4.3 L-1.7,-3.95 L-2.35,-4.5 Z" fill="${bodyFill}" stroke="rgba(0,0,0,.35)" stroke-width=".18"/><circle cx="0" cy="-6.35" r=".95" fill="#c99a78"/><path d="M-.95,-6.5 Q0,-7.6 .95,-6.5 Q.5,-7 0,-7 Q-.5,-7 -.95,-6.5Z" fill="#2a1d14"/><text class="no" x="0" y="-3.05" text-anchor="middle" font-size="1.75" font-weight="700" fill="${bodyStroke}">${num||''}</text><text class="lab" x="0" y="2.8" text-anchor="middle" font-size="2.5" fill="#fff" stroke="rgba(0,0,0,.75)" stroke-width=".4" paint-order="stroke" style="display:none"></text><ellipse class="ring" cx="0" cy=".3" rx="2.8" ry="1" fill="none" stroke="#27f0a6" stroke-width=".35" style="display:none"/>`}
function initPitch2d(M,h,a){if($('pxHost'))return PX.init(M,h,a);return initPitch2dSVG(M,h,a)}
function initPitch2dSVG(M,h,a){const svg=$('p2d');if(!svg)return null;const cols=matchColors(h,a);
  const st={h:[],a:[],ball:{x:52.5,y:34,tx:52.5,ty:34,z:0},poss:h.id,flash:0,flip:false,seq:null,hold:false,heat:{[h.id]:Array(60).fill(0),[a.id]:Array(60).fill(0)},frame:0,labels:{},cols,hid:h.id,aid:a.id,showPaths:false,entrance:motionLevel()==='full'};
  const tok=svg.querySelector('#p2dTok');tok.innerHTML='';
  const mk=(c,homeSide,col)=>{const pos=pitchPositions(c,M,homeSide);return pos.map((p,i)=>{const el=document.createElementNS('http://www.w3.org/2000/svg','g');el.setAttribute('class','p25');el.dataset.pid=p.pid;el.dataset.team=c.id;const pl=c.players.find(x=>x.id===p.pid);el.innerHTML=tokenSVG(col,i===0,pl&&pl.no||(i+1),col.shorts);tok.appendChild(el);
    const sx=st.entrance?52.5+(homeSide?-3:3)*(i+1):p.x,sy=st.entrance?74+i*.4:p.y;return {el,bx:p.x,by:p.y,x:sx,y:sy,pid:p.pid,team:c.id,lab:el.querySelector('.lab'),ring:el.querySelector('.ring'),name:pl?(pl.last||pl.first):''}})};
  st.h=mk(h,true,cols.h);st.a=mk(a,false,cols.a);
  const fx=svg.querySelector('#p2dFx');st.fx=fx;st.paths=svg.querySelector('#p2dPaths');st.flashEl=svg.querySelector('#p2dFlash');
  const bg=document.createElementNS('http://www.w3.org/2000/svg','g');bg.innerHTML=`<ellipse class="bsh" cx="0" cy="0" rx="1" ry=".4" fill="rgba(0,0,0,.4)"/><circle class="b" cx="0" cy="0" r=".95" fill="#fff" stroke="#222" stroke-width=".22"/><path class="b2" d="M-.5,-.2 L.1,-.6 L.5,.1 L-.1,.55 Z" fill="#222" opacity=".55"/>`;tok.appendChild(bg);st.ballEl=bg;st.ballSh=bg.querySelector('.bsh');st.ballBody=bg.querySelector('.b');st.ballMark=bg.querySelector('.b2');
  svg.onclick=e=>{const t=e.target.closest('.p25');if(!t||!st.onTap)return;st.onTap(+t.dataset.pid,t.dataset.team)};
  return st}
function toPitch(e,st,attackRight){return attackRight?{x:e.x,y:e.y}:{x:105-e.x,y:68-e.y}}
function pitchMinute(st,M,h,a,events){if(!st)return;if(st.px)return PX.minute(st,M,h,a,events);
  const flip=M.m>45;if(flip!==st.flip){st.flip=flip}
  const lastPoss=M.poss[h.id]+M.poss[a.id];const homeHas=Math.random()<(M.poss[h.id]/Math.max(1,lastPoss));st.poss=homeHas?h.id:a.id;
  const homeRight=!flip;const attRight=homeHas?homeRight:!homeRight;
  if(!st.seq){st.ball.tx=attRight?rnd(45,95):rnd(10,60);st.ball.ty=rnd(8,60)}
  for(const e of events){const mineRight=(e.team===h.id)===homeRight;
    if(e.path&&(e.t==='shot'||e.t==='goal'||e.t==='pen'||e.t==='penmiss')){const pts=e.path.map(([x,y])=>mineRight?[x,y]:[105-x,68-y]);st.seq={pts,i:0,t:0,ev:e,team:e.team,done:false};st.ball.x=pts[0][0];st.ball.y=pts[0][1];if(e.pid)st.labels[e.pid]=performance.now()+2600;if(e.asst)st.labels[e.asst]=performance.now()+2600;if(e.gk)st.labels[e.gk]=performance.now()+2600;
      if(st.showPaths||e.t==='goal'||e.t==='pen')drawPath(st,pts,e,(e.team===G.me)?'#27f0a6':'#ffd34d',e.t==='goal'||e.t==='pen'?5200:3200)}
    if(e.t==='goal'||e.t==='pen'||e.t==='own'){st.flash=30;flashText(st,52.5,-6,'שער!',e.team===G.me?'#27f0a6':'#ffd34d',9);crowdPulse(st,e.team===G.me?'me':'')}
    else if(e.t==='penmiss'){flashText(st,52.5,-6,'פנדל הוחמץ','#ff5c6c',6)}
    else if(e.t==='shot'&&e.sub==='post'){flashText(st,52.5,-6,'קורה!','#fff',6)}
    else if(e.t==='shot'&&e.sub==='save'&&!e.quiet){flashText(st,52.5,-6,'הצלה!','#5cb8ff',6)}
    else if(e.t==='corner'){const r=mineRight;st.ball.tx=r?104:1;st.ball.ty=Math.random()<.5?1:67}
    else if(e.t==='var'){flashText(st,52.5,-6,'VAR','#fff',7)}
    else if(e.t==='red'||e.t==='yellow'){if(e.pid)st.labels[e.pid]=performance.now()+2200}}
  const sync=(arr,c,homeSide)=>{const pos=pitchPositions(c,M,homeSide);const alive=new Set(M.xi[c.id].map(e=>e.pid));
    arr.forEach(d=>{if(!alive.has(d.pid)){d.el.style.display='none';return}});
    pos.forEach(p=>{let d=arr.find(x=>x.pid===p.pid);if(!d){const col=c.id===st.hid?st.cols.h:st.cols.a;const el=document.createElementNS('http://www.w3.org/2000/svg','g');el.setAttribute('class','p25');el.dataset.pid=p.pid;el.dataset.team=c.id;const pl=c.players.find(x=>x.id===p.pid);el.innerHTML=tokenSVG(col,false,pl&&pl.no||'',col.shorts);st.ballEl.parentNode.insertBefore(el,st.ballEl);d={el,bx:p.x,by:p.y,x:52.5,y:74,pid:p.pid,team:c.id,lab:el.querySelector('.lab'),ring:el.querySelector('.ring'),name:pl?(pl.last||pl.first):''};arr.push(d);st.labels[p.pid]=performance.now()+2600}d.bx=p.x;d.by=p.y;d.el.style.display=''})};
  sync(st.h,h,homeRight);sync(st.a,a,!homeRight);
}
function drawPath(st,pts,e,color,ms){if(!st.paths)return;const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.innerHTML=`<polyline points="${ppoly(pts)}" fill="none" stroke="${color}" stroke-width=".45" stroke-dasharray="1.2 .8" opacity=".9"/>${pts.slice(0,-1).map(([x,y])=>`<circle cx="${prj(x,y)[0].toFixed(2)}" cy="${prj(x,y)[1].toFixed(2)}" r=".6" fill="${color}"/>`).join('')}<text x="${prj(pts[pts.length-2][0],pts[pts.length-2][1])[0].toFixed(1)}" y="${(prj(pts[pts.length-2][0],pts[pts.length-2][1])[1]-3.2).toFixed(1)}" text-anchor="middle" font-size="2.4" fill="#fff" stroke="rgba(0,0,0,.7)" stroke-width=".3" paint-order="stroke">xG ${e.xg!=null?e.xg.toFixed(2):''}</text>`;st.paths.appendChild(g);setTimeout(()=>g.remove(),ms||3000)}
function flashText(st,x,y,txt,color,size){if(!st.fx)return;const [X,Y]=prj(x,y);const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',X);t.setAttribute('y',Y);t.setAttribute('text-anchor','middle');t.setAttribute('font-size',size||6);t.setAttribute('font-weight','700');t.setAttribute('fill',color);t.setAttribute('stroke','rgba(0,0,0,.75)');t.setAttribute('stroke-width','.45');t.setAttribute('paint-order','stroke');t.setAttribute('class','ftxt');t.textContent=txt;st.fx.appendChild(t);setTimeout(()=>t.remove(),1500)}
function crowdPulse(st,cls){const ar=$('arena');if(!ar)return;ar.classList.remove('pulse','pulse-me');void ar.offsetWidth;ar.classList.add(cls==='me'?'pulse-me':'pulse');setTimeout(()=>ar.classList.remove('pulse','pulse-me'),1600)}
function placeTok(d,now,st){const [X,Y]=prj(d.x,d.y);const s=prjS(d.y);d.el.setAttribute('transform',`translate(${X.toFixed(2)} ${Y.toFixed(2)}) scale(${s.toFixed(3)})`);
  const until=st.labels[d.pid];const show=until&&until>now;if(show!==d.showing){d.showing=show;d.lab.style.display=show?'':'none';d.ring.style.display=show?'':'none';if(show)d.lab.textContent=d.name}}
function pitchFrame(st){if(!st)return;if(st.px)return PX.frame(st);const now=performance.now();st.frame++;const b=st.ball;
  if(st.snap){if(st.seq){const e=st.seq.pts[st.seq.pts.length-1];b.x=e[0];b.y=e[1];st.seq=null}else{b.x=b.tx;b.y=b.ty}b.z=0}
  else if(st.seq&&!st.hold){const q=st.seq;const p0=q.pts[q.i],p1=q.pts[q.i+1];if(!p1){st.seq=null;b.tx=b.x;b.ty=b.y}else{const len=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]);const last=q.i===q.pts.length-2;const spd=(last?2.6:1.5)/Math.max(6,len);q.t+=spd;const t=Math.min(1,q.t);b.x=p0[0]+(p1[0]-p0[0])*t;b.y=p0[1]+(p1[1]-p0[1])*t;b.z=len>14&&!last?Math.sin(t*Math.PI)*Math.min(4,len*.16):(last?Math.sin(t*Math.PI)*.8:0);b.tx=b.x;b.ty=b.y;
      const mover=q.team===st.hid?st.h:st.a;const shooter=mover.find(d=>d.pid===q.ev.pid);if(shooter){shooter.tx=q.pts[q.pts.length-2][0];shooter.ty=q.pts[q.pts.length-2][1]}
      const opp=q.team===st.hid?st.a:st.h;const gk=opp[0];if(gk&&last){const e=q.pts[q.pts.length-1];gk.tx=gk.bx+(e[0]-gk.bx)*.35;gk.ty=clamp(e[1],28,40)}
      if(q.t>=1){q.i++;q.t=0;if(q.i>=q.pts.length-1){st.seq=null;b.z=0}}}}
  else if(!st.hold){b.x+=(b.tx-b.x)*.1;b.y+=(b.ty-b.y)*.1;b.z*=.85}
  const [BX,BY]=prj(b.x,b.y);const bs=prjS(b.y);st.ballEl.setAttribute('transform',`translate(${BX.toFixed(2)} ${BY.toFixed(2)}) scale(${bs.toFixed(3)})`);st.ballBody.setAttribute('cy',(-.95-b.z).toFixed(2));st.ballMark.setAttribute('transform',`translate(0 ${(-.95-b.z).toFixed(2)}) rotate(${(st.frame*9)%360})`);st.ballSh.setAttribute('rx',(1+b.z*.15).toFixed(2));st.ballSh.setAttribute('opacity',(.4-b.z*.05).toFixed(2));
  const move=(arr)=>{for(const d of arr){if(d.el.style.display==='none')continue;let tx,ty;if(d.tx!=null){tx=d.tx;ty=d.ty;if(Math.hypot(tx-d.x,ty-d.y)<.6){d.tx=null}}else{const pull=st.entranceDone===false?0:.22;tx=d.bx+(b.x-d.bx)*pull;ty=d.by+(b.y-d.by)*pull}const k=st.snap?1:st.hold?.03:.085;d.x+=(tx-d.x)*k;d.y+=(ty-d.y)*k;placeTok(d,now,st)}};move(st.h);move(st.a);
  if(st.frame%6===0){for(const arr of [st.h,st.a]){const grid=st.heat[arr===st.h?st.hid:st.aid];for(const d of arr){if(d.el.style.display==='none')continue;const gx=clamp(Math.floor(d.x/10.5),0,9),gy=clamp(Math.floor(d.y/11.4),0,5);grid[gy*10+gx]++}}}
  if(st.frame%4===0){const all=[...st.h,...st.a].filter(d=>d.el.style.display!=='none').sort((p,q)=>p.y-q.y);const par=st.ballEl.parentNode;let changed=false;for(let i=0;i<all.length;i++){if(par.children[i]!==all[i].el){changed=true;break}}if(changed){for(const d of all)par.appendChild(d.el);par.appendChild(st.ballEl)}else if(par.lastChild!==st.ballEl)par.appendChild(st.ballEl)}
  if(st.flash>0){st.flash--;st.flashEl.setAttribute('opacity',(st.flash>24?(st.flash-24)/6*.5:0).toFixed(2))}
}
/* goal replay: freezes the sim, redraws the recorded ball path with a travelling ball, then releases */
function playReplay(st,e,h,done){if(st&&st.px)return PX.replay(st,e,h,done);if(!st||!e.path||motionLevel()!=='full'||(G&&G.replay===false)){done&&done();return}
  st.hold=true;const over=$('arenaOver');const homeRight=!(e.m>45);const mineRight=(e.team===h.id)===homeRight;const pts=e.path.map(([x,y])=>mineRight?[x,y]:[105-x,68-y]);
  if(over)over.innerHTML=`<div class="rp-tag"><span class="dot"></span><b>שידור חוזר</b><span><bdi>${esc(e.name)}</bdi> <bdi dir="ltr">${fm(e.m)}</bdi>${e.asstName?` · בישול <bdi>${esc(e.asstName)}</bdi>`:''}</span><bdi dir="ltr" class="xg">xG ${e.xg!=null?e.xg.toFixed(2):'—'}</bdi></div>`;
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.innerHTML=`<polyline points="${ppoly(pts)}" fill="none" stroke="#fff" stroke-width=".5" stroke-dasharray="1.4 .9" opacity=".85"/><g class="rpBall"><ellipse cx="0" cy="0" rx="1" ry=".4" fill="rgba(0,0,0,.4)"/><circle cx="0" cy="-.95" r=".95" fill="#ffd34d" stroke="#222" stroke-width=".22"/></g>`;st.paths.appendChild(g);const ball=g.querySelector('.rpBall');
  const segs=[];let total=0;for(let i=0;i<pts.length-1;i++){const l=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);segs.push(l);total+=l}
  const dur=1900,t0=performance.now();const scale=1.22;const svg=$('p2d');const [fx,fy]=prj(pts[pts.length-2][0],pts[pts.length-2][1]);const pitch=svg&&svg.querySelector('#p2dPitch');
  const zoomG=[svg.querySelector('#p2dPitch'),svg.querySelector('#p2dTok'),svg.querySelector('#p2dPaths'),svg.querySelector('#p2dShadows'),...svg.querySelectorAll('.goal')];const tf=`translate(${(fx-fx*scale).toFixed(2)} ${(fy-fy*scale).toFixed(2)}) scale(${scale})`;zoomG.forEach(x=>x&&x.setAttribute('transform',tf));
  (function fr(now){const u=Math.min(1,(now-t0)/dur);let d=u*total,i=0;while(i<segs.length-1&&d>segs[i]){d-=segs[i];i++}const f=segs[i]?d/segs[i]:1;const x=pts[i][0]+(pts[i+1][0]-pts[i][0])*f,y=pts[i][1]+(pts[i+1][1]-pts[i][1])*f;const [X,Y]=prj(x,y);const z=segs[i]>14&&i<segs.length-1?Math.sin(f*Math.PI)*Math.min(4,segs[i]*.16):0;ball.setAttribute('transform',`translate(${X.toFixed(2)} ${(Y-z).toFixed(2)}) scale(${prjS(y).toFixed(3)})`);
    if(u<1)requestAnimationFrame(fr);else setTimeout(()=>{g.remove();zoomG.forEach(x=>x&&x.removeAttribute('transform'));if(over)over.innerHTML='';st.hold=false;done&&done()},700)})(t0);
}
