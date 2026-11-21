import * as T from './vendor/three.js';
const skinColors=[0xc99673,0x774b35,0xe3b796,0xa76b49,0x543b2c];
const hairColors=[0x211913,0x34241b,0x211b18,0x65442c,0x181714];
function createRig(team,number,variant,kit=null){
 // cloth, not plastic: a little less rough so the environment shows as a sheen along the forms
 const cloth=new T.MeshStandardMaterial({vertexColors:true,roughness:.88,metalness:0,envMapIntensity:.65});
 const bones=[],names={};const bone=(name,parent,x,y,z)=>{const b=new T.Bone();b.name=name;b.position.set(x,y,z);if(parent)parent.add(b);names[name]=bones.length;bones.push(b);return b};
 const root=bone('hips',null,0,.97,0),spine=bone('spine',root,0,.12,0),head=bone('head',spine,0,.57,0);
 for(const [label,s] of [['L',-1],['R',1]]){const arm=bone(label+'arm',spine,s*.186,.43,0),fore=bone(label+'fore',arm,0,-.29,0);bone(label+'hand',fore,0,-.25,0);const thigh=bone(label+'thigh',root,s*.105,-.01,0),shin=bone(label+'shin',thigh,0,-.43,0);bone(label+'foot',shin,0,-.43,0)}
 const P=[],N=[],C=[],I=[],W=[],ind=[];const col=new T.Color();
 function shape(geo,scale,pos,color,name){geo.scale(...scale);geo.translate(...pos);const p=geo.attributes.position,n=geo.attributes.normal,offset=P.length/3;col.setHex(color);for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i));C.push(col.r,col.g,col.b);I.push(names[name],0,0,0);W.push(1,0,0,0)}if(geo.index)for(const a of geo.index.array)ind.push(offset+a);else for(let i=0;i<p.count;i++)ind.push(offset+i);geo.dispose()}
 const ell=(size,pos,c,b)=>shape(new T.SphereGeometry(1,24,18),size,pos,c,b);
 const taper=(rt,rb,len,pos,c,b,scale=[1,1,1])=>shape(new T.CylinderGeometry(rt,rb,len,14),scale,pos,c,b);
 const skin=skinColors[variant%skinColors.length],hair=hairColors[variant%hairColors.length];const jersey=kit?new T.Color(kit.kit).getHex():team==='red'?0xbc1731:team==='white'?0xefeee8:team==='keeperRed'?0xe7b529:0x29a985;const trim=kit?new T.Color(kit.trim).getHex():team==='red'?0xf0e5ce:team==='white'?0x203e65:0x172b37;

 // Anatomical ring profiles, with skin weights blended around elbows and knees.
 // Each limb is a continuous surface; no stacked cylinders or exposed ball joints.
 function loft(rings,x,c,weights,fold=0){
  const pp=[],ii=[],segments=24;
  for(let j=0;j<rings.length;j++){const [y,rx,rz,zc=0]=rings[j];for(let k=0;k<=segments;k++){
   const a=k/segments*Math.PI*2,wrinkle=1+fold*Math.sin(a*7+y*65)*Math.sin(j*.7);
   pp.push(x+Math.cos(a)*rx*wrinkle,y,zc+Math.sin(a)*rz*wrinkle);
   if(j<rings.length-1&&k<segments){const n=j*(segments+1)+k;ii.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2)}
  }}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setIndex(ii);g.computeVertexNormals();
  const off=P.length/3,pa=g.attributes.position,na=g.attributes.normal;col.setHex(c);
  for(let i=0;i<pa.count;i++){const x0=pa.getX(i),y=pa.getY(i),z=pa.getZ(i),ww=weights(y);P.push(x0,y,z);N.push(na.getX(i),na.getY(i),na.getZ(i));
   const grain=1+fold*.3*Math.sin(x0*370+y*480+z*220);C.push(col.r*grain,col.g*grain,col.b*grain);I.push(names[ww[0]],names[ww[1]||ww[0]],0,0);W.push(ww[2]??1,1-(ww[2]??1),0,0)}
  for(const n of ii)ind.push(off+n);g.dispose();
 }
 const solid=n=>()=>[n,n,1],blend=(a,b,j,w)=>y=>[a,b,Math.max(0,Math.min(1,(y-j)/w+.5))];
 loft([[1.075,.15,.105],[1.12,.162,.114],[1.19,.154,.112],[1.28,.166,.115],[1.39,.202,.129],[1.47,.219,.125],[1.51,.205,.11],[1.55,.13,.077],[1.575,.065,.062]],0,jersey,solid('spine'),.025);
 taper(.065,.068,.075,[0,1.565,0],trim,'spine');taper(.06,.068,.105,[0,1.64,0],skin,'head');
 // Sculpted jaw, cheekbones, brow, ears, nose and close-cropped hair.
 loft([[1.67,.035,.045,.018],[1.70,.063,.073,.025],[1.74,.083,.084,.018],[1.79,.092,.095,.008],[1.84,.089,.096,0],[1.88,.08,.084,-.008],[1.915,.055,.06,-.01],[1.93,.002,.002,-.01]],0,skin,solid('head'));
 for(const side of [-1,1]){ell([.014,.027,.017],[side*.092,1.795,-.005],skin,'head');ell([.021,.006,.007],[side*.036,1.836,.087],hair,'head');ell([.014,.008,.004],[side*.036,1.82,.092],0xe5ded0,'head');ell([.006,.006,.004],[side*.034,1.82,.095],0x28241e,'head');ell([.028,.022,.015],[side*.05,1.777,.079],skin,'head')}
 ell([.016,.027,.018],[0,1.793,.097],skin,'head');ell([.024,.004,.006],[0,1.741,.094],0x855b4b,'head');
 shape(new T.SphereGeometry(1,24,16,0,Math.PI*2,0,Math.PI*.46),[.092,.102,.101],[0,1.838,-.004],hair,'head');
 shape(new T.BoxGeometry(.032,.044,.004),[1,1,1],[-.094,1.46,.126],trim,'spine');
 const shorts=kit?new T.Color(kit.trim).getHex():0x182d48;
 loft([[.88,.166,.116],[.97,.174,.12],[1.075,.152,.105]],0,shorts,solid('hips'),.02);
 for(const [l,sg] of [['L',-1],['R',1]]){
  const x=sg*.186,tx=sg*.105;
  loft([[1.282,.058,.06],[1.33,.068,.07],[1.42,.078,.074],[1.49,.08,.075],[1.535,.044,.04],[1.54,.004,.004]],x,jersey,solid(l+'arm'),.02);
  loft([[.99,.029,.028],[1.035,.035,.033],[1.11,.048,.039],[1.18,.043,.039],[1.225,.04,.038],[1.26,.05,.047],[1.30,.057,.055]],x,skin,blend(l+'arm',l+'fore',1.23,.11));
  ell([.032,.045,.021],[x,.958,.006],team.startsWith('keeper')?0xe5e5d7:skin,l+'hand');
  for(let f=0;f<4;f++)ell([.007,.027+(f===1?.005:0),.009],[x+(f-1.5)*.014,.917,.013],team.startsWith('keeper')?0xe5e5d7:skin,l+'hand');
  ell([.012,.025,.014],[x+sg*.034,.953,.013],team.startsWith('keeper')?0xe5e5d7:skin,l+'hand');
  loft([[.735,.093,.10],[.79,.101,.107],[.89,.108,.115],[.99,.103,.114]],tx,shorts,solid(l+'thigh'),.04);
  loft([[.145,.035,.038],[.24,.045,.048,-.009],[.34,.064,.059,-.014],[.41,.064,.056,-.012],[.48,.048,.051],[.53,.051,.058,.009],[.58,.061,.063],[.66,.08,.075],[.75,.091,.084]],tx,skin,blend(l+'thigh',l+'shin',.53,.13));
  loft([[.125,.036,.039],[.22,.044,.048,-.009],[.32,.063,.059,-.014],[.40,.066,.059,-.012],[.445,.061,.054]],tx,jersey,solid(l+'shin'),.012);
  taper(.063,.064,.026,[tx,.437,-.01],trim,l+'shin');
  ell([.052,.045,.124],[tx,.065,.06],variant%2?0xefeadb:0x1d252b,l+'foot');shape(new T.BoxGeometry(.10,.014,.2),[1,1,1],[tx,.025,.055],0x151d22,l+'foot');
  for(let j=0;j<4;j++)shape(new T.BoxGeometry(.065,.003,.005),[1,1,1],[tx,.108,.05+j*.014],0xb9bcb2,l+'foot');
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(P,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(N,3));geometry.setAttribute('color',new T.Float32BufferAttribute(C,3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(I,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(W,4));geometry.setIndex(ind);const mesh=new T.SkinnedMesh(geometry,cloth);mesh.add(root);mesh.bind(new T.Skeleton(bones));mesh.castShadow=true;mesh.frustumCulled=false;
 // Back numbers are attached to the spine and follow the player's movement.
 const cn=document.createElement('canvas');cn.width=512;cn.height=512;const cx=cn.getContext('2d');
 const jerseyInk=(new T.Color(kit?.kit||'#eeeeee').getHSL({}).l>.5)?'#152b4d':'#fff3dd';cx.fillStyle=jerseyInk;cx.textAlign='center';
 cx.font='700 49px Arial';cx.fillText(kit?.name||'GOAL-M',256,90,460);cx.font='900 310px Arial';cx.fillText(String(number),256,390);
 const tex=new T.CanvasTexture(cn);tex.colorSpace=T.SRGBColorSpace;const num=new T.Mesh(new T.PlaneGeometry(.30,.34),new T.MeshStandardMaterial({map:tex,transparent:true,roughness:.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));num.position.set(0,.27,-.132);num.rotation.y=Math.PI;spine.add(num);
 const group=new T.Group();group.add(mesh);const shadow=new T.Mesh(new T.CircleGeometry(.46,20),new T.MeshBasicMaterial({color:0x162416,transparent:true,opacity:.19,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;shadow.scale.set(1,.65,1);return {group,mesh,bones,names,shadow,number};
}
export function makePlayers(scene){const result=[];for(let team=0;team<2;team++)for(let i=0;i<11;i++){const a=createRig(i===0?(team===0?'keeperRed':'keeperWhite'):(team===0?'red':'white'),[1,2,4,5,3,6,8,11,10,9,7][i],i+team*3);a.team=team;a.index=i;scene.add(a.group,a.shadow);result.push(a)}return result}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function posePlayer(actor,state,t){const {bones:b,names:n}=actor;for(const bone of b)bone.rotation.set(0,0,0);actor.group.position.set(state.x,0,state.z);actor.group.rotation.y=state.angle;actor.shadow.position.set(state.x,.025,state.z);const speed=state.speed,run=clamp(speed/4.8,0,1),phase=state.phase??t*(7+run*4)+actor.index*.67;const cycle=Math.sin(phase);b[n.hips].position.y=.97+Math.abs(Math.cos(phase))*.045*run;b[n.spine].rotation.x=.10*run;b[n.spine].rotation.y=cycle*.09*run;b[n.head].rotation.y=-cycle*.035*run;
 for(const [side,s] of [['L',1],['R',-1]]){const swing=cycle*s;b[n[side+'thigh']].rotation.x=-swing*.70*run;b[n[side+'shin']].rotation.x=Math.max(0,-swing)*1.20*run+.04;b[n[side+'foot']].rotation.x=-Math.max(0,-swing)*.35*run;b[n[side+'arm']].rotation.x=swing*.54*run;b[n[side+'arm']].rotation.z=side==='L'?.10:-.10;b[n[side+'fore']].rotation.x=-.50-.4*run;}
 if(!state.keeper&&run<.05&&!state.kick){b[n.hips].position.y+=Math.sin(t*1.9)*.004;b[n.spine].rotation.x=.025+Math.sin(t*1.9)*.008;b[n.spine].rotation.y=Math.sin(t*.65)*.045;b[n.head].rotation.y=-Math.sin(t*.65)*.06;b[n.Lthigh].rotation.z=-.035;b[n.Rthigh].rotation.z=.035;}
 if(state.kick>0){const k=state.kick;b[n.Rthigh].rotation.x=-1.15*k;b[n.Rshin].rotation.x=.12*k;b[n.Rfoot].rotation.x=-.18*k;b[n.spine].rotation.x=.18*k;b[n.Larm].rotation.z=.7*k;b[n.Rarm].rotation.z=-.6*k;}
 /* A keeper waiting for a penalty does not stand to attention: he is low, his feet are apart, his weight is
    forward and his hands are away from his body. Standing straight was most of why he read as a doll. */
 if(state.keeper){b[n.Larm].rotation.z=.34;b[n.Rarm].rotation.z=-.34;b[n.Larm].rotation.x=-.1;b[n.Rarm].rotation.x=-.1;
  b[n.Lfore].rotation.x=-.42;b[n.Rfore].rotation.x=-.42;b[n.Lfore].rotation.z=-.22;b[n.Rfore].rotation.z=.22;
  b[n.Lthigh].rotation.x=-.4;b[n.Rthigh].rotation.x=-.4;b[n.Lthigh].rotation.z=-.13;b[n.Rthigh].rotation.z=.13;
  b[n.Lshin].rotation.x=.66;b[n.Rshin].rotation.x=.66;b[n.Lfoot].rotation.x=-.26;b[n.Rfoot].rotation.x=-.26;
  b[n.spine].rotation.x=.13;b[n.head].rotation.x=-.1;b[n.spine].rotation.y=Math.sin(t*1.1)*.055;b[n.hips].position.y=.84;
 if(state.dive>0){const d=state.dive;b[n.hips].rotation.z=d*1.25;b[n.hips].position.y=.9-.32*d;b[n.Larm].rotation.z=2.0*d;b[n.Rarm].rotation.z=1.4*d;b[n.Lfore].rotation.x=-.15;b[n.Rfore].rotation.x=-.15;b[n.Lthigh].rotation.x=-.28;b[n.Rthigh].rotation.x=.18;}}
 if(state.celebrate){const c=state.celebrate;b[n.Larm].rotation.z=2.3*c;b[n.Rarm].rotation.z=-2.3*c;b[n.Lfore].rotation.x=-.25;b[n.Rfore].rotation.x=-.25;b[n.hips].position.y+=Math.max(0,Math.sin(t*5))*.10*c;b[n.head].rotation.x=-.12*c;}
}
export function makeBall(scene){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#f4f3e8';c.fillRect(0,0,512,256);for(let row=0;row<4;row++)for(let col=0;col<8;col++){const x=col*64+(row%2)*32,y=row*64+32;c.beginPath();for(let n=0;n<5;n++){const a=n*Math.PI*2/5;c.lineTo(x+19*Math.cos(a),y+19*Math.sin(a))}c.closePath();c.fillStyle='#1a2633';c.fill();c.strokeStyle='#afb4ac';c.lineWidth=2;c.stroke()}const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const ball=new T.Mesh(new T.SphereGeometry(.145,20,14),new T.MeshStandardMaterial({map:tex,roughness:.65}));ball.castShadow=true;scene.add(ball);const mask=document.createElement('canvas');mask.width=mask.height=64;
 const brush=mask.getContext('2d'),fade=brush.createRadialGradient(32,32,0,32,32,32);
 fade.addColorStop(0,'rgba(12,18,13,1)');fade.addColorStop(.56,'rgba(12,18,13,.85)');fade.addColorStop(1,'rgba(12,18,13,0)');
 brush.fillStyle=fade;brush.fillRect(0,0,64,64);
 const shadow=new T.Mesh(new T.PlaneGeometry(.52,.42),new T.MeshBasicMaterial({map:new T.CanvasTexture(mask),transparent:true,depthWrite:false,toneMapped:false}));
 shadow.renderOrder=2;shadow.rotation.x=-Math.PI/2;scene.add(shadow);return {ball,shadow};}

// Real roster identity and kit colours; bodies remain original generic characters.
export function makeRosterPlayer(scene,p,index){
 const a=createRig(p.slot==='GK'?(p.side?'keeperWhite':'keeperRed'):(p.side?'white':'red'),p.number,index,p);
 a.pid=p.pid;a.teamId=p.team;a.index=index;scene.add(a.group,a.shadow);return a;
}


// Key poses authored for the penalty sequence. Times are normalized, contact is .62.
export function applyStrike(actor,u){
 const b=actor.bones,n=actor.names;
 const keys=[
 [0,0,.1,0,.02,.1,-.1,0],
 [.28,.52,1.25,-.14,.14,.48,-.36,-.12],
 [.48,.3,1.5,-.16,.18,.7,-.5,-.20],
 [.62,-.92,.18,-.11,.23,.8,-.65,.1],
 [.80,-1.45,.12,-.04,.30,.6,-.80,.25],
 [1,-.12,.12,0,.04,.12,-.12,0]];
 let k=0;while(k<keys.length-2&&u>keys[k+1][0])k++;
 const a=keys[k],c=keys[k+1],q=clamp((u-a[0])/(c[0]-a[0]),0,1),w=q*q*(3-2*q),v=i=>a[i]+(c[i]-a[i])*w;
 b[n.Rthigh].rotation.x=v(1);b[n.Rshin].rotation.x=v(2);b[n.Lthigh].rotation.x=v(3);b[n.Lshin].rotation.x=.14;
 b[n.spine].rotation.x=v(4);b[n.Larm].rotation.z=v(5);b[n.Rarm].rotation.z=v(6);b[n.spine].rotation.y=v(7);
 b[n.Rfoot].rotation.x=-.2;b[n.Lfore].rotation.x=-.45;b[n.Rfore].rotation.x=-.6;
 b[n.hips].position.y=.955;
}
