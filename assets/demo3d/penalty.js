import * as T from './vendor/three.js';
import {buildWorld,animateNet} from './world.js';
import {makeRosterPlayer,posePlayer,makeBall} from './actors.js';

// First-person penalty view for src/js/36f-penalty.js. Presentation only: it is told where the ball goes and how the
// kick ends, and draws it. No game globals, no persistence, no random outcome.
// Goal coordinates (as in the game code): x metres from the middle of the goal, y metres above the grass.
//   kick view   the camera is the taker's eyes, three metres behind the ball; x positive is to his right
//   keeper view the camera is the keeper's eyes on the line; x positive is to his right as well
const GX=52.5,SPOT=41.5,KEEP_X=52.2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=u=>1-Math.pow(1-u,2);

export function createPenaltyView(host,opts){
  const wrap=document.createElement('div');wrap.className='pg-3d';host.prepend(wrap);
  const gloves=document.createElement('div');gloves.className='pg-gloves3d';gloves.hidden=true;
  gloves.innerHTML=`<svg viewBox="0 0 360 150" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g class="gl l"><path d="M74 150c-6-22-4-44 6-54 8-8 20-6 22 4l2-14c2-10 16-10 17 0l1 12c3-9 15-8 16 2l2 26c4 10 2 22-4 30z" fill="#f1f1e6" stroke="#10151d" stroke-width="2.5" stroke-linejoin="round"/><path class="cuff" d="M82 142h48" stroke-width="7" stroke-linecap="round"/></g><g class="gl r"><path d="M286 150c6-22 4-44-6-54-8-8-20-6-22 4l-2-14c-2-10-16-10-17 0l-1 12c-3-9-15-8-16 2l-2 26c-4 10-2 22 4 30z" fill="#f1f1e6" stroke="#10151d" stroke-width="2.5" stroke-linejoin="round"/><path class="cuff" d="M278 142h-48" stroke-width="7" stroke-linecap="round"/></g></svg>`;
  host.append(gloves);
  let renderer,world,ball,observer,raf=0,disposed=false,mode=opts.mode,keeper=null,taker=null,extras=[],clock=0,last=0;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(56,1,.1,320),ray=new T.Raycaster(),v3=new T.Vector3(),v2=new T.Vector2();
  // what is being played right now: {t, dur, step(u,t), done} — one at a time, queued by the game one call after another
  let act=null,netT=-1,netZ=0;
  // can this device draw the scene? After half a second of warm-up, 1.2 seconds of frames are timed; under ten frames a
  // second the game is told once (opts.onSlow) and plays later kicks on its flat picture. Time in the background is not counted.
  const perf={t:0,n:0,from:0,skip:false,done:false};const onVis=()=>{perf.skip=true};document.addEventListener('visibilitychange',onVis);
  function measure(now,gap){if(!perf.from){perf.from=now;return}if(now-perf.from<500)return;
    if(perf.skip||document.hidden||gap>5000){perf.skip=false;return}
    perf.t+=gap;perf.n++;if(perf.t<1200)return;perf.done=true;document.removeEventListener('visibilitychange',onVis);
    if(perf.n*1000/perf.t<10){try{opts.onSlow&&opts.onSlow()}catch(e){}}}
  const K={z:0,dive:0,side:0,lift:0,sway:true};          // keeper pose
  const B={x:SPOT,y:.145,z:0};                           // ball
  const R={x:SPOT-3,z:.8,speed:0,kick:0,cele:0,phase:0}; // taker (keeper view)
  function disposeObject(object){const geometries=new Set(),materials=new Set(),textures=new Set();
    object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.skeleton)o.skeleton.dispose();for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v)}});
    textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
  function drop(a){if(!a)return;scene.remove(a.group,a.shadow);disposeObject(a.group);disposeObject(a.shadow)}
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer?.disconnect();document.removeEventListener('visibilitychange',onVis);const a=act;act=null;disposeObject(scene);renderer?.dispose();wrap.remove();gloves.remove();if(a&&a.done)a.done()}
  function fail(){dispose();try{opts.onError&&opts.onError()}catch(e){}}
  function cast(o){
    drop(keeper);drop(taker);extras.forEach(drop);extras=[];
    keeper=makeRosterPlayer(scene,{slot:'GK',side:1,number:1,kit:o.gkKit||'#f2b233',trim:'#10151d',pid:'k',team:'k'},0);
    taker=makeRosterPlayer(scene,{slot:'FW',side:0,number:o.number||9,kit:o.kit||'#c6f24e',trim:o.trim||'#10151d',pid:'t',team:'t'},1);
    // the others wait on the edge of the area
    [[-8.6,0],[-5.2,1],[-2.4,0],[2.9,1],[5.6,0],[9.1,1]].forEach(([z,s],i)=>{const a=makeRosterPlayer(scene,{slot:'MF',side:s,number:4+i,kit:s?o.oppKit||'#e9edf2':o.kit||'#c6f24e',trim:(s?o.oppTrim:o.trim)||'#10151d',pid:'x'+i,team:'x'},i+2);posePlayer(a,{x:35.2-(i%2)*.7,z,angle:Math.PI/2,speed:0,kick:0,dive:0,celebrate:0,keeper:false},0);extras.push(a)});
    gloves.querySelectorAll('.cuff').forEach(c=>c.setAttribute('stroke',o.gkKit||'#f2b233'));
  }
  function frameCamera(){
    if(mode==='kick'){camera.fov=56;camera.position.set(SPOT-3.2,1.62,0);camera.lookAt(GX,.55,0)}
    else{camera.fov=44;camera.position.set(GX-.25,1.7,0);camera.lookAt(SPOT,.7,0)}
    camera.updateProjectionMatrix();
  }
  function resize(){if(disposed)return;const w=wrap.clientWidth,h=wrap.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;
    // a narrow portrait stage: keep the whole goal mouth in the picture
    if(mode==='kick'){const need=2*Math.atan(4.6/(GX-(SPOT-3.2)));const hf=2*Math.atan(Math.tan(T.MathUtils.degToRad(28))*camera.aspect);camera.fov=hf<need?T.MathUtils.radToDeg(2*Math.atan(Math.tan(need/2)/camera.aspect)):camera.aspect>1.3?50:56}
    camera.updateProjectionMatrix();draw()}
  function poseKeeper(t){
    const b=keeper.bones,n=keeper.names;const sway=K.sway?Math.sin(t*2.6)*.38:0;
    posePlayer(keeper,{x:KEEP_X,z:K.z+sway,angle:-Math.PI/2,speed:0,kick:0,dive:0,celebrate:0,keeper:true},t);
    if(K.dive>0){const d=K.dive,s=K.side||1;  // facing the taker, his left hand is on the camera's right: the lean follows the side he goes to
      b[n.hips].rotation.z=-s*d*1.2;b[n.hips].position.y=.9-.3*d+K.lift*d;b[n.Larm].rotation.z=s>0?-1.5*d:2.1*d;b[n.Rarm].rotation.z=s>0?-2.1*d:1.5*d;b[n.Lfore].rotation.x=-.15;b[n.Rfore].rotation.x=-.15;b[n.Lthigh].rotation.x=-.25;b[n.Rthigh].rotation.x=.15}
    keeper.group.visible=mode==='kick';keeper.shadow.visible=mode==='kick';
  }
  function draw(){
    if(disposed||document.hidden)return;
    poseKeeper(clock);
    const show=mode==='keep';taker.group.visible=show;taker.shadow.visible=show;
    if(show)posePlayer(taker,{x:R.x,z:R.z,angle:Math.PI/2,speed:R.speed,kick:R.kick,dive:0,celebrate:R.cele,keeper:false,phase:R.speed?R.phase:undefined},clock);
    ball.ball.position.set(B.x,B.y,B.z);ball.ball.rotation.set(clock*5,0,-clock*8);ball.shadow.position.set(B.x,.028,B.z);ball.shadow.material.opacity=.38/(1+B.y);
    if(netT>=0)animateNet(world.goals[1],netT,netZ);
    renderer.render(scene,camera);
  }
  function frame(now){raf=0;if(disposed)return;try{
    if(!perf.done)measure(now,now-last);
    const dt=Math.min(.05,(now-last)/1000||0);last=now;clock+=dt;if(netT>=0)netT+=dt;
    if(act){act.t+=dt;const u=clamp(act.t/act.dur);act.step(u,act.t);if(u>=1){const a=act;act=null;a.done&&a.done()}}
    draw()}catch(e){return fail()}
    if(!disposed)raf=requestAnimationFrame(frame)}
  function play(dur,step,done){act={t:0,dur:Math.max(.001,dur),step,done}}
  const api={kind:'3d',get mode(){return mode},
    toScreen(x,y){v3.set(GX,y,x).project(camera);return [(v3.x*.5+.5)*wrap.clientWidth,(-v3.y*.5+.5)*wrap.clientHeight]},
    fromScreen(px,py){v2.set(px/Math.max(1,wrap.clientWidth)*2-1,-(py/Math.max(1,wrap.clientHeight)*2-1));ray.setFromCamera(v2,camera);const o=ray.ray.origin,d=ray.ray.direction;if(d.x<=1e-4)return [0,3];const t=(GX-o.x)/d.x;return [o.z+d.z*t,o.y+d.y*t]},
    // kick view: the ball leaves the spot for (x,y); the keeper goes to `dive`
    shoot(r,done){
      const dv=r.dive==='L'?-1:r.dive==='R'?1:0,reach=r.how==='save';K.sway=false;K.side=dv;K.lift=reach?clamp((r.y-.9)/1.6)*.55:.12;
      const kz=dv*(reach?clamp(Math.abs(r.x)-.35,.7,3.0):1.9),tx=r.how==='goal'?GX+.9:GX-.05,from={x:B.x,y:B.y,z:B.z};
      play(.52,u=>{const e=u;B.x=from.x+(tx-from.x)*e;B.z=from.z+(r.x-from.z)*e;B.y=from.y+(r.y-from.y)*e+Math.sin(u*Math.PI)*.35;
        const k=clamp((u-.12)/.7);K.z=kz*ease(k);K.dive=dv?ease(k):0},()=>{
        const p={x:B.x,y:B.y,z:B.z};
        if(r.how==='goal'){netT=0;netZ=r.x;play(.7,u=>{B.x=p.x+.55*u;B.y=Math.max(.145,p.y-(p.y-.145)*u*u);B.z=p.z},done)}
        else if(r.how==='save'){const s=r.x>=0?1:-1;play(.6,u=>{B.x=p.x-2.6*u;B.z=p.z+s*3.2*u;B.y=Math.max(.145,p.y+1.1*Math.sin(u*Math.PI)-(p.y-.145)*u)},done)}
        else if(r.how==='post'){const s=r.x>=0?-1:1;play(.65,u=>{B.x=p.x-4.5*u;B.z=p.z+s*1.8*u;B.y=Math.max(.145,p.y+.6*Math.sin(u*Math.PI)-(p.y-.145)*u)},done)}
        else play(.5,u=>{B.x=p.x+9*u;B.z=p.z+(p.z)*.7*u;B.y=p.y+1.6*u},done)})},
    // keeper view
    runUp(ms,done){const d=Math.max(.001,ms/1000);play(d,u=>{R.x=SPOT-3+(2.55)*u;R.z=.8-.68*u;R.speed=u<.92?4.2:0;R.phase=u*9;R.kick=clamp((u-.86)/.14)},()=>{R.speed=0;R.kick=1;done&&done()})},
    gloves(side){gloves.dataset.side=side},
    incoming(r,done){const tz=-r.x,from={x:SPOT,y:.145,z:0},tx=GX-.45;
      play(Math.max(.001,(r.ms||650)/1000),u=>{const e=u;B.x=from.x+(tx-from.x)*e;B.z=from.z+(tz-from.z)*e;B.y=from.y+(r.y-from.y)*e+Math.sin(u*Math.PI)*.3;R.kick=clamp(1-u*3)},()=>{
        const how=r.how(),p={x:B.x,y:B.y,z:B.z};
        if(how==='save'){const s=tz>=0?1:-1;play(.55,u=>{B.x=p.x-3.4*u;B.z=p.z+s*2.6*u;B.y=Math.max(.145,p.y+.9*Math.sin(u*Math.PI)-(p.y-.145)*u)},done)}
        else if(how==='post'){const s=tz>=0?-1:1;play(.6,u=>{B.x=p.x-4*u;B.z=p.z+s*1.6*u;B.y=Math.max(.145,p.y+.5*Math.sin(u*Math.PI)-(p.y-.145)*u)},done)}
        else if(how==='goal'){netT=0;netZ=tz;play(.45,u=>{B.x=p.x+1.6*u;B.y=Math.max(.145,p.y-(p.y-.145)*u);R.cele=u},done)}
        else play(.45,u=>{B.x=p.x+6*u;B.z=p.z+p.z*.5*u;B.y=p.y+1.2*u},done)})},
    // a new kick in the same stadium
    reset(m,o){if(disposed)throw new Error('disposed');mode=m;act=null;netT=-1;clock=0;animateNet(world.goals[1],-1,0);Object.assign(K,{z:0,dive:0,side:0,lift:0,sway:true});Object.assign(B,{x:SPOT,y:.145,z:0});Object.assign(R,{x:SPOT-3,z:.8,speed:0,kick:0,cele:0,phase:0});
      cast(o||opts);gloves.hidden=m!=='keep';delete gloves.dataset.side;frameCamera();resize()},
    dispose};
  try{
    renderer=new T.WebGLRenderer({antialias:true,powerPreference:'default'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.type=T.PCFSoftShadowMap;
    const phone=innerWidth<=900;renderer.setPixelRatio(Math.min(devicePixelRatio||1,phone?1.25:1.5));renderer.shadowMap.enabled=!phone;wrap.append(renderer.domElement);
    world=buildWorld(scene,renderer);ball=makeBall(scene);
    // an evening kick-off: the sky and the haze go dark, the pitch stays floodlit
    scene.background=new T.Color(0x0a101c);scene.fog=new T.Fog(0x0a101c,95,230);
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!disposed)fail()});
    api.reset(mode,opts);
    observer=new ResizeObserver(()=>{try{resize()}catch(e){fail()}});observer.observe(wrap);
    last=performance.now();raf=requestAnimationFrame(frame);
  }catch(e){dispose();throw e}
  return api;
}
