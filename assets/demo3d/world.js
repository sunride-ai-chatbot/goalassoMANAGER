import * as T from './vendor/three.js';
export const up=new T.Vector3(0,1,0);
const mat=(color,more={})=>new T.MeshStandardMaterial({color,roughness:.9,...more});
function box(scene,w,h,d,x,y,z,m){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.receiveShadow=true;scene.add(o);return o}
function line(scene,points,color=0xe2eade,opacity=1){const g=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));const l=new T.Line(g,new T.LineBasicMaterial({color,transparent:opacity<1,opacity}));scene.add(l);return l}
function tube(scene,a,b,r,material){const av=new T.Vector3(...a),bv=new T.Vector3(...b);const m=new T.Mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),8),material);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(up,bv.sub(av).normalize());scene.add(m);return m}
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}
function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
export function buildWorld(scene,renderer){
 /* A floodlit evening, which is the art direction of everything else in the game — the crests, the trophy moments,
    the photographed stand behind these terraces. The scene used to be lit as a bright afternoon while the penalty
    view darkened only the sky behind it, so the pitch glowed like noon under a black sky. The light itself is the
    fix: one cold bank high over the near touchline casting the shadows, a dimmer bank from the far corner so no
    face goes black, and a warm bounce off the stands. */
 scene.background=new T.Color(0x070c15);scene.fog=new T.Fog(0x0a111c,95,240);
 scene.add(new T.HemisphereLight(0x3a5a7a,0x101a14,.8));
 const sun=new T.DirectionalLight(0xe9f1ff,1.8);sun.position.set(-34,76,34);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:35,bottom:-35,near:1,far:150});sun.shadow.bias=-.00015;sun.shadow.normalBias=.025;sun.shadow.radius=2;sun.target.position.set(28,0,0);scene.add(sun,sun.target);
 const fill=new T.DirectionalLight(0xc3d6f5,.6);fill.position.set(44,58,-42);scene.add(fill);
 const warm=new T.DirectionalLight(0xffd6a2,.3);warm.position.set(0,16,-72);scene.add(warm);
 const grass=canvasTexture(2048,1024,(c,w,h)=>{const rand=seeded(821);c.fillStyle='#33602c';c.fillRect(0,0,w,h);for(let i=0;i<20;i++){c.fillStyle=i%2?'#3a6a31':'#2a5226';c.fillRect(i*w/20,0,w/20,h)}for(let i=0;i<210000;i++){const v=rand();c.fillStyle=v>.5?'rgba(190,204,120,.05)':'rgba(7,37,14,.06)';c.fillRect(rand()*w,rand()*h,rand()*2+1,rand()*3+1)}
 // Lines are painted into the grass so they stay crisp without z-fighting.
 const sx=w/112,sz=h/75;c.strokeStyle='#e5ead8';c.lineWidth=1.8;c.lineJoin='round';const X=x=>w/2+x*sx,Z=z=>h/2+z*sz;
 const rect=(x,z,dx,dz)=>c.strokeRect(X(x),Z(z),dx*sx,dz*sz);rect(-52.5,-34,105,68);c.beginPath();c.moveTo(X(0),Z(-34));c.lineTo(X(0),Z(34));c.stroke();c.beginPath();c.ellipse(X(0),Z(0),9.15*sx,9.15*sz,0,0,Math.PI*2);c.stroke();
 for(const side of [-1,1]){rect(side===1?36:-52.5,-20.16,16.5,40.32);rect(side===1?47:-52.5,-9.16,5.5,18.32);c.beginPath();const a=Math.acos(5.5/9.15);c.ellipse(X(side*41.5),Z(0),9.15*sx,9.15*sz,0,side===1?Math.PI-a:-a,side===1?Math.PI+a:a);c.stroke()}
 });grass.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
 const pitch=new T.Mesh(new T.PlaneGeometry(112,75),mat(0xffffff,{map:grass}));pitch.rotation.x=-Math.PI/2;pitch.receiveShadow=true;scene.add(pitch);
 /* The three spots are geometry, not paint: at 18 pixels to the metre a painted spot is six pixels across, and the
    penalty camera — a metre behind the ball, looking straight down at it — magnified that into a grey puddle. */
 {const spotMat=mat(0xd9e0d0);for(const x of [-41.5,0,41.5]){const s=new T.Mesh(new T.CircleGeometry(.11,20),spotMat);s.rotation.x=-Math.PI/2;s.position.set(x,.012,0);scene.add(s)}}
 box(scene,155,.15,120,0,-.13,0,mat(0x3a5c36));
 const concrete=mat(0x35444c),ledge=mat(0x647078),dark=mat(0x1e303a),rail=mat(0xa5adb0,{metalness:.5});
 // Four terraced stands, all in world space; no background image.
 for(let row=0;row<16;row++){const d=42+row*1.23,y=1.4+row*.69;for(const z of [-d,d])box(scene,126,.75,1.3,0,y,z,concrete);for(const x of [-60-row*1.23,60+row*1.23])box(scene,1.3,.75,82,x,y,0,concrete)}
 for(const z of [-62.5,62.5]){box(scene,133,2.5,1,0,13.3,z,dark);box(scene,133,.25,22,0,17,z>0?57:-57,dark);for(let x=-64;x<=64;x+=16){tube(scene,[x,0,z],[x,17,z],.18,rail);tube(scene,[x,17,z],[x,17,z>0?45:-45],.11,rail)}}
 for(const x of [-81,81]){box(scene,1,2.5,84,x,13.3,0,dark);box(scene,20,.25,84,x>0?76:-76,17,0,dark)}
 for(const sx of [-1,1])for(const sz of [-1,1]){for(let row=0;row<16;row++){const corner=box(scene,12,.75,1.5,sx*(59+row*.87),1.4+row*.69,sz*(41+row*.87),concrete);corner.rotation.y=-sx*sz*Math.PI/4;}box(scene,22,.25,22,sx*72,17,sz*54,dark);}
 /* Instanced crowd: two batched meshes for thousands of spectators. Density is the whole thing — at 0.84 metres
    apart a spectator is an object you can count, and a grid of countable objects behind a goal reads as a field
    of cones however well each one is shaped. Shoulder to shoulder (about half a metre, which is what a seat
    actually is) they stop being objects and become a crowd, with a little jitter so the eye finds no column. */
 const random=seeded(32),people=[],STEP=.52;
 for(let row=0;row<18;row++){const y=2.23+row*.69,jx=()=>(random()-.5)*.16;
  for(const sign of [-1,1]){
   for(let col=0;col<236;col++){if(col%59<3||random()<.035)continue;people.push([(col-118)*STEP+jx(),y,sign*(42+row*1.23)+jx(),sign===1?Math.PI:0])}
   for(let col=0;col<148;col++){if(col%49<3||random()<.04)continue;people.push([sign*(60+row*1.23)+jx(),y,(col-74)*STEP+jx(),sign>0?-Math.PI/2:Math.PI/2])}}
 }
 for(const sx of [-1,1])for(const sz of [-1,1])for(let row=0;row<18;row++)for(let col=0;col<20;col++)people.push([sx*(55.4+row*.87+col*.42),2.23+row*.69,sz*(44.6+row*.87-col*.42),Math.atan2(-sx,-sz)]);
 /* A spectator is a cut-out, not a solid. Every shape the geometry could afford — a cone, then a cylinder with
    a ball on it — gives every person in the ground the same silhouette, and fifteen thousand identical
    silhouettes read as a field of bottles whatever colour they are. Eight drawn poses on one texture (standing,
    an arm up, both arms up, arms folded, leaning, a scarf held overhead, a flag, hands on the rail) cost one
    draw call, pick themselves per instance from a single float attribute, and give the stand the broken,
    uneven outline a crowd actually has. Cut out with alphaTest rather than blended, so rows still occlude. */
 const POSES=8,CW=64,CH=80;
 const atlas=canvasTexture(CW*POSES,CH,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#fff';c.strokeStyle='#fff';c.lineCap='round';c.lineJoin='round';
  const torso=(o,wid,lean)=>{const x=o+CW/2+lean;c.beginPath();c.moveTo(x-wid,CH);c.lineTo(x-wid,CH*.34);c.quadraticCurveTo(x-wid,CH*.12,x-wid*.42,CH*.1);c.lineTo(x+wid*.42,CH*.1);c.quadraticCurveTo(x+wid,CH*.12,x+wid,CH*.34);c.lineTo(x+wid,CH);c.closePath();c.fill();return x};
  const arm=(x,y,dx,dy,wid)=>{c.lineWidth=wid;c.beginPath();c.moveTo(x,y);c.lineTo(x+dx,y+dy);c.stroke()};
  for(let p=0;p<POSES;p++){const o=p*CW;
   if(p===0){torso(o,17,0)}
   else if(p===1){const x=torso(o,16,0);arm(x+13,CH*.26,9,-26,8)}
   else if(p===2){const x=torso(o,16,0);arm(x+12,CH*.26,10,-30,8);arm(x-12,CH*.26,-10,-30,8)}
   else if(p===3){const x=torso(o,20,0);arm(x-14,CH*.3,9,10,9);arm(x+14,CH*.3,-9,10,9)}
   else if(p===4){torso(o,15,5)}
   else if(p===5){const x=torso(o,16,0);arm(x+12,CH*.26,8,-26,8);arm(x-12,CH*.26,-8,-26,8);c.lineWidth=7;c.beginPath();c.moveTo(x-22,CH*.08);c.lineTo(x+22,CH*.08);c.stroke()}
   else if(p===6){const x=torso(o,16,0);arm(x+12,CH*.26,7,-24,8);c.lineWidth=4;c.beginPath();c.moveTo(x+19,CH*.05);c.lineTo(x+19,CH*.34);c.stroke()}
   else {const x=torso(o,18,-4);arm(x-13,CH*.3,-7,13,9)}}
 });
 atlas.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
 /* Unlit, and the palette carries the night instead. A flat cut-out stands vertical and faces the pitch, so a
    floodlight almost directly above it grazes the surface and leaves it black; the solid bodies it replaced
    were curved and caught that light from somewhere. What a spectator is worth is decided here. */
 const bodyMat=new T.MeshBasicMaterial({map:atlas,alphaTest:.5,side:T.DoubleSide,fog:true});
 /* No `vertexColors`: three.js defines USE_COLOR from that flag alone and the shader then multiplies by a
    `color` attribute the geometry does not have, which reads as zero and paints every spectator black.
    `setColorAt` works through USE_INSTANCING_COLOR on its own. */
 const bodies=new T.InstancedMesh(new T.PlaneGeometry(.86,1.02),bodyMat,people.length),
       heads=new T.InstancedMesh(new T.IcosahedronGeometry(.125,0),mat(0xffffff),people.length),dummy=new T.Object3D();
 const shirts=[0x43191f,0x4e262d,0x7b7d76,0x5f6159,0x1d2b3a,0x414b52,0x2b3640];const skins=[0x8e6749,0x9c7f62,0x624032,0xa08871,0x412d22];
 {const cell=new Float32Array(people.length);for(let i=0;i<people.length;i++)cell[i]=Math.floor(random()*POSES);
  bodies.geometry.setAttribute('aCell',new T.InstancedBufferAttribute(cell,1));}
 people.forEach(([x,y,z,rot],i)=>{dummy.position.set(x,y+.07,z);dummy.rotation.y=rot;dummy.scale.set(.94+random()*.16,.92+random()*.18,1);dummy.updateMatrix();bodies.setMatrixAt(i,dummy.matrix);bodies.setColorAt(i,new T.Color(shirts[Math.floor(random()*shirts.length)]));dummy.position.y+=.47;dummy.scale.setScalar(1);dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);heads.setColorAt(i,new T.Color(skins[Math.floor(random()*skins.length)]).multiplyScalar(1-Math.min(1,Math.max(0,(y-2.2)/12.5))*.5))});scene.add(bodies,heads);
 /* The stand is alive: every spectator sways on his own phase, and on a goal he leaps. It runs in the vertex shader,
    so thousands of them cost nothing per frame; the scene only advances `crowd.time` and sets `crowd.cheer`. */
 const crowd={uniforms:{uTime:{value:0},uCheer:{value:0}},
  set time(v){this.uniforms.uTime.value=v},get time(){return this.uniforms.uTime.value},
  set cheer(v){this.uniforms.uCheer.value=Math.max(0,Math.min(1,v))},get cheer(){return this.uniforms.uCheer.value},
  decay(dt){this.cheer=this.cheer*Math.pow(.12,dt)}};
 {const phase=new Float32Array(people.length);for(let i=0;i<people.length;i++)phase[i]=random()*Math.PI*2;
  for(const m of [bodies,heads]){m.geometry.setAttribute('aPhase',new T.InstancedBufferAttribute(phase,1));
   m.material.onBeforeCompile=sh=>{sh.uniforms.uTime=crowd.uniforms.uTime;sh.uniforms.uCheer=crowd.uniforms.uCheer;
    // the cut-out picks its pose from the atlas here, which is why the bodies carry an `aCell` attribute
    const pose=m===bodies?'attribute float aCell;\n':'';
    let v='attribute float aPhase;uniform float uTime;uniform float uCheer;\n'+pose+sh.vertexShader.replace('#include <begin_vertex>',
     '#include <begin_vertex>\n transformed.y += sin(uTime*1.7+aPhase)*0.045 + max(0.0,sin(uTime*7.5+aPhase*3.0))*uCheer*0.75;');
    if(m===bodies)v=v.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = vMapUv*vec2(1.0/8.0,1.0) + vec2(aCell/8.0,0.0);\n#endif');
    sh.vertexShader=v};
   m.material.needsUpdate=true}}
 const adtex=canvasTexture(2048,128,(c,w,h)=>{c.fillStyle='#102631';c.fillRect(0,0,w,h);c.font='italic 900 65px Arial';c.textBaseline='middle';c.fillStyle='#75efbd';c.fillText('GOALASSO',55,66);c.fillStyle='#e5f2f4';c.font='700 49px Arial';c.fillText('SUNRIDE',650,66);c.fillText('THE BEAUTIFUL GAME',1120,66);for(let x=0;x<w;x+=512){c.fillStyle='#75efbd';c.fillRect(x,h-8,200,6)}});adtex.wrapS=T.RepeatWrapping;adtex.repeat.x=3;adtex.anisotropy=4;
 const admat=mat(0xffffff,{map:adtex,emissive:0x2c5f4c,emissiveIntensity:.6});   /* lit boards: at night they are the brightest line on the ground */for(const z of [-37.6,37.6])box(scene,112,1.25,.2,0,.65,z,admat);for(const x of [-56.5,56.5])box(scene,.2,1.25,72,x,.65,0,admat);
 // Corner flags and dugouts.
 for(const x of [-52.5,52.5])for(const z of [-34,34]){tube(scene,[x,0,z],[x,1.55,z],.025,mat(0xffffff));const flag=new T.Mesh(new T.PlaneGeometry(.5,.35),mat(0xe4ce55,{side:T.DoubleSide}));flag.position.set(x+.25,1.38,z);scene.add(flag)}
 for(const x of [-14,14]){box(scene,10,2.6,.15,x,1.3,40,dark);box(scene,10,.15,3,x,2.65,39,dark);for(let n=0;n<9;n++)box(scene,.7,.5,.7,x-4+n, .5,39,mat(0x962a3f))}
 /* The four pylons carry the evening: each lamp gets a soft additive halo, which is the one thing that tells the
    eye a stadium is floodlit rather than merely dark. One small texture, four quads, no post-processing. */
 const halo=canvasTexture(128,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,246,219,.95)');g.addColorStop(.35,'rgba(255,240,200,.35)');g.addColorStop(1,'rgba(255,236,190,0)');c.fillStyle=g;c.fillRect(0,0,w,h)});
 const halomat=new T.SpriteMaterial({map:halo,blending:T.AdditiveBlending,depthWrite:false,fog:false,transparent:true});
 for(const x of [-59,59])for(const z of [-40,40]){tube(scene,[x,0,z],[x,25,z],.18,rail);const bank=box(scene,5,1.6,.5,x,25,z,dark);for(let n=0;n<6;n++)box(scene,.6,.55,.12,x-2+n*.8,25.1,z+(z>0?-.3:.3),new T.MeshBasicMaterial({color:0xfff1cc}));
  const sp=new T.Sprite(halomat);sp.position.set(x,25.1,z+(z>0?-.6:.6));sp.scale.set(16,11,1);sp.renderOrder=2;scene.add(sp)}
 /* A photographed night stand stands behind the terraces: the instanced spectators in front of it keep the motion,
    the picture gives the depth that rows of cylinders never will. It is one texture on four planes, and if the file
    is missing nothing waits for it — the stadium is simply as dark as it was. */
 try{
  const tex=new T.TextureLoader().load('assets/stand-crowd.webp');
  tex.colorSpace=T.SRGBColorSpace!==undefined?T.SRGBColorSpace:tex.colorSpace;
  const far=new T.MeshBasicMaterial({map:tex,fog:false});
  const wall=(w,x,z,ry)=>{const m=new T.Mesh(new T.PlaneGeometry(w,34),far);m.position.set(x,14,z);m.rotation.y=ry;m.renderOrder=-1;scene.add(m)};
  wall(170,0,-63.5,0);wall(170,0,63.5,Math.PI);wall(110,-82.5,0,Math.PI/2);wall(110,82.5,0,-Math.PI/2);
 }catch(e){}
 crowd.dress=(a,b)=>{const col=new T.Color();const hex=x=>{try{return new T.Color(x).getHex()}catch(e){return null}};
   const A=hex(a),B=hex(b);if(A==null&&B==null)return;
   /* A stand at night is mostly coats and shadow with the club's colour running through it. Painting every
      spectator the full kit colour was what turned the terraces into rows of bright traffic cones: roughly a
      third wear the colour, dimmed hard, the rest wear the dark palette, and a few catch the floodlight.
      The higher rows are darker, which is both true — the floodlights point at the pitch, not at row 18 —
      and the thing that gives a wall of eight thousand instances any depth at all. */
   const pale=new T.Color(0xcdd3cb);
   const mix=(base,i,y)=>{const r=((i*2654435761)%1000)/1000;
     if(base!=null&&r<.34){col.setHex(base).multiplyScalar(.26+r*.44)}
     else col.setHex(shirts[(i*7+i%5)%shirts.length]).multiplyScalar(.62+r*.4);
     if((i*2246822519)%17===0)col.lerp(pale,.34);
     return col.multiplyScalar(1-Math.min(1,Math.max(0,(y-2.2)/12.5))*.5)};
   people.forEach(([x,y],i)=>bodies.setColorAt(i,mix(x<0?A:B,i,y)));   /* split down the middle of every stand, as a segregated ground is */
   bodies.instanceColor&&(bodies.instanceColor.needsUpdate=true)};
 const goals=[makeGoal(scene,-1),makeGoal(scene,1)];return{sun,goals,crowdCount:people.length,crowd};
}
function makeGoal(scene,side){const g=new T.Group();g.position.x=side*52.5;g.scale.x=side;scene.add(g);const post=mat(0xf5f5e8,{roughness:.45});for(const z of [-3.66,3.66]){tube(g,[0,0,z],[0,2.44,z],.065,post);tube(g,[0,2.44,z],[2.1,1.9,z],.035,post);tube(g,[2.1,1.9,z],[2.1,0,z],.035,post)}tube(g,[0,2.44,-3.66],[0,2.44,3.66],.065,post);
 const pos=[];const push=(a,b)=>pos.push(...a,...b);for(let z=-3.66;z<=3.67;z+=.22){push([2.1,0,z],[2.1,1.9,z]);push([0,2.44,z],[2.1,1.9,z])}for(let y=0;y<=1.91;y+=.2)push([2.1,y,-3.66],[2.1,y,3.66]);for(const z of [-3.66,3.66]){for(let x=0;x<=2.11;x+=.21)push([x,0,z],[x,2.44-x*.257,z]);for(let y=0;y<=2.4;y+=.2)push([0,y,z],[2.1,Math.min(y,1.9),z])}for(let x=0;x<=2.11;x+=.21)push([x,2.44-x*.257,-3.66],[x,2.44-x*.257,3.66]);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));const net=new T.LineSegments(geo,new T.LineBasicMaterial({color:0xe2e9e4,transparent:true,opacity:.52}));g.add(net);const base=Float32Array.from(pos);return {net,base,group:g};}
export function animateNet(goal,t,hitZ){const a=goal.net.geometry.attributes.position;for(let i=0;i<a.count;i++){const j=i*3,x=goal.base[j],y=goal.base[j+1],z=goal.base[j+2];const wave=t>0&&t<3?Math.sin(t*18-Math.abs(z-hitZ)*2)*Math.exp(-t*2)*Math.exp(-Math.abs(z-hitZ)*.8)*.32:0;a.setXYZ(i,x+(x>1.8?wave:0),y,z)}a.needsUpdate=true;}
