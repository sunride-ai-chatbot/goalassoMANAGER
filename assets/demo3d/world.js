import * as T from './vendor/three.js';
export const up=new T.Vector3(0,1,0);
const mat=(color,more={})=>new T.MeshStandardMaterial({color,roughness:.9,...more});
function box(scene,w,h,d,x,y,z,m){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.receiveShadow=true;scene.add(o);return o}
function line(scene,points,color=0xe2eade,opacity=1){const g=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));const l=new T.Line(g,new T.LineBasicMaterial({color,transparent:opacity<1,opacity}));scene.add(l);return l}
function tube(scene,a,b,r,material){const av=new T.Vector3(...a),bv=new T.Vector3(...b);const m=new T.Mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),8),material);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(up,bv.sub(av).normalize());scene.add(m);return m}
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}
function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
export function buildWorld(scene,renderer){
 scene.background=new T.Color(0x9ab8c9);scene.fog=new T.Fog(0xa0baca,110,250);
 scene.add(new T.HemisphereLight(0xd5edff,0x536244,1.5));const sun=new T.DirectionalLight(0xffefd3,2.6);sun.position.set(-28,65,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:35,bottom:-35,near:1,far:140});sun.shadow.bias=-.00015;sun.shadow.normalBias=.025;sun.shadow.radius=2;sun.target.position.set(28,0,0);scene.add(sun,sun.target);
 const grass=canvasTexture(2048,1024,(c,w,h)=>{const rand=seeded(821);c.fillStyle='#477a37';c.fillRect(0,0,w,h);for(let i=0;i<20;i++){c.fillStyle=i%2?'#486f35':'#3c622e';c.fillRect(i*w/20,0,w/20,h)}for(let i=0;i<210000;i++){const v=rand();c.fillStyle=v>.5?'rgba(190,204,120,.05)':'rgba(7,37,14,.06)';c.fillRect(rand()*w,rand()*h,rand()*2+1,rand()*3+1)}
 // Lines are painted into the grass so they stay crisp without z-fighting.
 const sx=w/112,sz=h/75;c.strokeStyle='#e5ead8';c.lineWidth=1.8;c.lineJoin='round';const X=x=>w/2+x*sx,Z=z=>h/2+z*sz;
 const rect=(x,z,dx,dz)=>c.strokeRect(X(x),Z(z),dx*sx,dz*sz);rect(-52.5,-34,105,68);c.beginPath();c.moveTo(X(0),Z(-34));c.lineTo(X(0),Z(34));c.stroke();c.beginPath();c.ellipse(X(0),Z(0),9.15*sx,9.15*sz,0,0,Math.PI*2);c.stroke();
 for(const side of [-1,1]){rect(side===1?36:-52.5,-20.16,16.5,40.32);rect(side===1?47:-52.5,-9.16,5.5,18.32);c.beginPath();c.ellipse(X(side*41.5),Z(0),.17*sx,.17*sz,0,0,Math.PI*2);c.fillStyle='#e5ead8';c.fill();c.beginPath();const a=Math.acos(5.5/9.15);c.ellipse(X(side*41.5),Z(0),9.15*sx,9.15*sz,0,side===1?Math.PI-a:-a,side===1?Math.PI+a:a);c.stroke()}
 c.beginPath();c.ellipse(X(0),Z(0),.17*sx,.17*sz,0,0,Math.PI*2);c.fill();});grass.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
 const pitch=new T.Mesh(new T.PlaneGeometry(112,75),mat(0xffffff,{map:grass}));pitch.rotation.x=-Math.PI/2;pitch.receiveShadow=true;scene.add(pitch);
 box(scene,155,.15,120,0,-.13,0,mat(0x3a5c36));
 const concrete=mat(0x35444c),ledge=mat(0x647078),dark=mat(0x1e303a),rail=mat(0xa5adb0,{metalness:.5});
 // Four terraced stands, all in world space; no background image.
 for(let row=0;row<16;row++){const d=42+row*1.23,y=1.4+row*.69;for(const z of [-d,d])box(scene,126,.75,1.3,0,y,z,concrete);for(const x of [-60-row*1.23,60+row*1.23])box(scene,1.3,.75,82,x,y,0,concrete)}
 for(const z of [-62.5,62.5]){box(scene,133,2.5,1,0,13.3,z,dark);box(scene,133,.25,22,0,17,z>0?57:-57,dark);for(let x=-64;x<=64;x+=16){tube(scene,[x,0,z],[x,17,z],.18,rail);tube(scene,[x,17,z],[x,17,z>0?45:-45],.11,rail)}}
 for(const x of [-81,81]){box(scene,1,2.5,84,x,13.3,0,dark);box(scene,20,.25,84,x>0?76:-76,17,0,dark)}
 for(const sx of [-1,1])for(const sz of [-1,1]){for(let row=0;row<16;row++){const corner=box(scene,12,.75,1.5,sx*(59+row*.87),1.4+row*.69,sz*(41+row*.87),concrete);corner.rotation.y=-sx*sz*Math.PI/4;}box(scene,22,.25,22,sx*72,17,sz*54,dark);}
 // Instanced crowd: two batched meshes for thousands of spectators.
 const random=seeded(32),people=[];for(let row=0;row<15;row++){
  for(const sign of [-1,1]){for(let col=0;col<145;col++){if(col%36<3||random()<.08)continue;people.push([(col-72)*.84,2+row*.69,sign*(42+row*1.23),sign===1?Math.PI:0])}
  for(let col=0;col<90;col++){if(col%30<3||random()<.1)continue;people.push([sign*(60+row*1.23),2+row*.69,(col-45)*.85,sign>0?-Math.PI/2:Math.PI/2])}}
 }
 for(const sx of [-1,1])for(const sz of [-1,1])for(let row=0;row<15;row++)for(let col=0;col<13;col++)people.push([sx*(55.4+row*.87+col*.6),2+row*.69,sz*(44.6+row*.87-col*.6),Math.atan2(-sx,-sz)]);
 const bodies=new T.InstancedMesh(new T.CylinderGeometry(.18,.23,.55,5),mat(0xffffff),people.length),heads=new T.InstancedMesh(new T.OctahedronGeometry(.13,0),mat(0xffffff),people.length),dummy=new T.Object3D();const shirts=[0xb82034,0xcd3646,0xe3e4dc,0xddddcf,0x182c41,0x73838a,0x304555];const skins=[0xc28f65,0xdfb38c,0x87583d,0xe1c1a0,0x593e2e];
 people.forEach(([x,y,z,rot],i)=>{dummy.position.set(x,y,z);dummy.rotation.y=rot;dummy.scale.set(1,random()*.18+.9,1);dummy.updateMatrix();bodies.setMatrixAt(i,dummy.matrix);bodies.setColorAt(i,new T.Color(shirts[Math.floor(random()*shirts.length)]));dummy.position.y+=.42;dummy.scale.setScalar(1);dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);heads.setColorAt(i,new T.Color(skins[Math.floor(random()*skins.length)]))});scene.add(bodies,heads);
 const adtex=canvasTexture(2048,128,(c,w,h)=>{c.fillStyle='#102631';c.fillRect(0,0,w,h);c.font='italic 900 65px Arial';c.textBaseline='middle';c.fillStyle='#75efbd';c.fillText('GOALASSO',55,66);c.fillStyle='#e5f2f4';c.font='700 49px Arial';c.fillText('SUNRIDE',650,66);c.fillText('THE BEAUTIFUL GAME',1120,66);for(let x=0;x<w;x+=512){c.fillStyle='#75efbd';c.fillRect(x,h-8,200,6)}});adtex.wrapS=T.RepeatWrapping;adtex.repeat.x=3;adtex.anisotropy=4;
 const admat=mat(0xffffff,{map:adtex,emissive:0x18342b,emissiveIntensity:.2});for(const z of [-37.6,37.6])box(scene,112,1.25,.2,0,.65,z,admat);for(const x of [-56.5,56.5])box(scene,.2,1.25,72,x,.65,0,admat);
 // Corner flags and dugouts.
 for(const x of [-52.5,52.5])for(const z of [-34,34]){tube(scene,[x,0,z],[x,1.55,z],.025,mat(0xffffff));const flag=new T.Mesh(new T.PlaneGeometry(.5,.35),mat(0xe4ce55,{side:T.DoubleSide}));flag.position.set(x+.25,1.38,z);scene.add(flag)}
 for(const x of [-14,14]){box(scene,10,2.6,.15,x,1.3,40,dark);box(scene,10,.15,3,x,2.65,39,dark);for(let n=0;n<9;n++)box(scene,.7,.5,.7,x-4+n, .5,39,mat(0x962a3f))}
 for(const x of [-59,59])for(const z of [-40,40]){tube(scene,[x,0,z],[x,25,z],.18,rail);const bank=box(scene,5,1.6,.5,x,25,z,dark);for(let n=0;n<6;n++)box(scene,.6,.55,.12,x-2+n*.8,25.1,z+(z>0?-.3:.3),new T.MeshBasicMaterial({color:0xfff1cc}))}
 const goals=[makeGoal(scene,-1),makeGoal(scene,1)];return{sun,goals,crowdCount:people.length};
}
function makeGoal(scene,side){const g=new T.Group();g.position.x=side*52.5;g.scale.x=side;scene.add(g);const post=mat(0xf5f5e8,{roughness:.45});for(const z of [-3.66,3.66]){tube(g,[0,0,z],[0,2.44,z],.065,post);tube(g,[0,2.44,z],[2.1,1.9,z],.035,post);tube(g,[2.1,1.9,z],[2.1,0,z],.035,post)}tube(g,[0,2.44,-3.66],[0,2.44,3.66],.065,post);
 const pos=[];const push=(a,b)=>pos.push(...a,...b);for(let z=-3.66;z<=3.67;z+=.22){push([2.1,0,z],[2.1,1.9,z]);push([0,2.44,z],[2.1,1.9,z])}for(let y=0;y<=1.91;y+=.2)push([2.1,y,-3.66],[2.1,y,3.66]);for(const z of [-3.66,3.66]){for(let x=0;x<=2.11;x+=.21)push([x,0,z],[x,2.44-x*.257,z]);for(let y=0;y<=2.4;y+=.2)push([0,y,z],[2.1,Math.min(y,1.9),z])}for(let x=0;x<=2.11;x+=.21)push([x,2.44-x*.257,-3.66],[x,2.44-x*.257,3.66]);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));const net=new T.LineSegments(geo,new T.LineBasicMaterial({color:0xe2e9e4,transparent:true,opacity:.52}));g.add(net);const base=Float32Array.from(pos);return {net,base,group:g};}
export function animateNet(goal,t,hitZ){const a=goal.net.geometry.attributes.position;for(let i=0;i<a.count;i++){const j=i*3,x=goal.base[j],y=goal.base[j+1],z=goal.base[j+2];const wave=t>0&&t<3?Math.sin(t*18-Math.abs(z-hitZ)*2)*Math.exp(-t*2)*Math.exp(-Math.abs(z-hitZ)*.8)*.32:0;a.setXYZ(i,x+(x>1.8?wave:0),y,z)}a.needsUpdate=true;}
