import * as T from './vendor/three.js';
import {buildWorld,animateNet} from './world.js';
import {makeRosterPlayer,posePlayer,makeBall} from './actors.js';
import {CLIP_DURATION,eventFrame,idleFrame} from './event-timeline.js';

// The only inputs are frozen presentation DTOs. No game globals or persistence.
export function createLiveView(host,{onError}){
  host.innerHTML=`<div class="m3-stage" role="img" aria-label="המחשת אירועי המשחק בתלת־ממד"></div>
    <p class="m3-caption" aria-live="polite">ממתין למצב הבא במשחק</p>
    <div class="m3-controls"><button data-action="camera">מצלמת שידור</button><button data-action="replay" disabled>שידור חוזר</button><button data-action="skip">דלג על ההמחשה</button><button data-action="quality">איכות: אוטומטית</button><button data-action="fullscreen">מסך מלא</button></div>
    <small class="m3-perf">סובב את הטלפון לתצוגה רחבה · גרור כדי לסובב מצלמה</small>`;
  const stage=host.querySelector('.m3-stage'),caption=host.querySelector('.m3-caption'),perf=host.querySelector('.m3-perf'),replay=host.querySelector('[data-action="replay"]');
  let renderer,world,ball,observer,disposed=false,paused=false,raf=0,lastTime=0,clip=null,lastClip=null,snapshot=null,time=0,queue=[],actors=new Map(),cameraMode=0,yaw=0,zoom=1,drag=null;
  let quality='auto',low=innerWidth<=900,frames=0,windowMs=0,slowWindows=0,activeMs=0;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,1,.1,320),target=new T.Vector3();
  const stats={fps:null,frames:0,quality:low?'low':'high',drawCalls:0,triangles:0,players:0};
  const events=new AbortController();
  function disposeObject(object){
    const geometries=new Set(),materials=new Set(),textures=new Set();
    object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.skeleton)o.skeleton.dispose();if(o.shadow?.dispose)o.shadow.dispose();for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
    textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  }
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);raf=0;queue=[];clip=null;observer?.disconnect();events.abort();disposeObject(scene);renderer?.dispose();host.replaceChildren();actors.clear();}
  function fail(){dispose();onError();}
  function guarded(action){try{return action();}catch(e){fail();}}
  function reconcile(players){
    const keys=new Set(players.map(p=>p.team+':'+p.pid));
    for(const [key,a] of actors)if(!keys.has(key)){scene.remove(a.group,a.shadow);disposeObject(a.group);disposeObject(a.shadow);actors.delete(key);}
    players.forEach((p,i)=>{const key=p.team+':'+p.pid;if(!actors.has(key))actors.set(key,makeRosterPlayer(scene,p,i));});
    stats.players=actors.size;
  }
  function draw(){
    if(disposed||!snapshot||document.hidden)return;
    const state=clip?eventFrame(clip,time):idleFrame(snapshot);reconcile(state.players);
    state.players.forEach(p=>posePlayer(actors.get(p.team+':'+p.pid),p,time));
    ball.ball.position.set(state.ball.x,state.ball.y,state.ball.z);ball.ball.rotation.set(time*6,0,-time*9);
    ball.shadow.position.set(state.ball.x,.028,state.ball.z);ball.shadow.material.opacity=.38/(1+state.ball.y);
    for(let i=0;i<2;i++)animateNet(world.goals[i],clip&&i===(clip.direction>0?1:0)?state.netTime:-1,clip?.path.at(-1).z||0);
    const b=state.ball,d=clip?.direction||1,portrait=camera.aspect<1;
    target.set(T.MathUtils.clamp(b.x,-43,43),.8,b.z*.45);
    let offset=cameraMode===0?new T.Vector3(-12*d,portrait?24:21,portrait?43:35):cameraMode===1?new T.Vector3(-9*d,5,15):new T.Vector3(22*d,12,18);
    offset.multiplyScalar(zoom).applyAxisAngle(new T.Vector3(0,1,0),yaw);camera.position.copy(target).add(offset);camera.lookAt(target);
    renderer.render(scene,camera);stats.frames++;stats.drawCalls=renderer.info.render.calls;stats.triangles=renderer.info.render.triangles;
  }
  function resize(){if(disposed)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw();}
  function applyQuality(){const reduced=quality==='low'||(quality==='auto'&&low);renderer.setPixelRatio(Math.min(devicePixelRatio||1,reduced?1:1.5));renderer.shadowMap.enabled=!reduced;stats.quality=reduced?'low':'high';resize();}
  function setCaption(replaying=false){if(!clip)return;const labels={goal:'שער',save:'הדיפה',miss:'מחוץ למסגרת',post:'קורה'};caption.textContent=`${replaying?'שידור חוזר · ':''}${clip.minute}′ · ${labels[clip.outcome]} · ${clip.name}${clip.outcome==='save'&&clip.keeperName?' · השוער: '+clip.keeperName:''}`;}
  function next(){clip=queue.shift()||null;time=0;activeMs=0;if(clip){lastClip=clip;replay.disabled=true;setCaption();}else{replay.disabled=!lastClip;caption.textContent='ממתין למצב הבא · התוצאה בלוח המשחק';}draw();}
  function schedule(){if(!disposed&&!raf&&clip&&!paused&&!document.hidden){lastTime=performance.now();raf=requestAnimationFrame(frame);}}
  function frame(now){raf=0;if(disposed||paused||document.hidden)return;guarded(()=>{
    const elapsed=now-lastTime;lastTime=now;activeMs+=elapsed;
    // Recover from a stalled renderer without ever advancing the simulation here.
    if(activeMs>20000){fail();return;}
    time=Math.min(CLIP_DURATION,time+Math.min(elapsed/1000,.1));draw();frames++;windowMs+=elapsed;
    if(windowMs>=2000){stats.fps=Math.round(frames*1000/windowMs);slowWindows=stats.fps<25?slowWindows+1:0;frames=0;windowMs=0;
      if(quality==='auto'&&!low&&slowWindows>=2){low=true;applyQuality();}
      perf.textContent=`${stats.fps} FPS בדפדפן הזה · ${stats.quality==='low'?'איכות חסכונית':'איכות גבוהה'}`;
    }
    if(time>=CLIP_DURATION)next();
    if(!disposed&&clip&&!paused&&!document.hidden)raf=requestAnimationFrame(frame);
  });}
  function setPaused(value){paused=!!value;cancelAnimationFrame(raf);raf=0;lastTime=performance.now();frames=0;windowMs=0;schedule();}
  try{
    renderer=new T.WebGLRenderer({antialias:false,powerPreference:'default'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.append(renderer.domElement);
    world=buildWorld(scene,renderer);ball=makeBall(scene);applyQuality();
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!disposed)fail();},{signal:events.signal});
    observer=new ResizeObserver(()=>guarded(resize));observer.observe(stage);
    host.addEventListener('click',e=>guarded(()=>{
      const action=e.target.closest('button')?.dataset.action;
      if(action==='camera'){cameraMode=(cameraMode+1)%3;yaw=0;zoom=1;e.target.textContent=['מצלמת שידור','קו המגרש','מאחורי המהלך'][cameraMode];draw();}
      if(action==='replay'&&lastClip&&!clip){clip=lastClip;time=0;activeMs=0;replay.disabled=true;setCaption(true);draw();schedule();}
      if(action==='skip'){queue=[];clip=null;cancelAnimationFrame(raf);raf=0;next();}
      if(action==='quality'){quality=quality==='auto'?'low':quality==='low'?'high':'auto';e.target.textContent='איכות: '+({auto:'אוטומטית',low:'חסכונית',high:'גבוהה'})[quality];applyQuality();}
      // Include the existing pause/substitution controls in fullscreen.
      if(action==='fullscreen'){const surface=document.documentElement;const promise=document.fullscreenElement?document.exitFullscreen?.():surface?.requestFullscreen?.();if(promise)promise.catch(()=>{perf.textContent='סובב את הטלפון לתצוגה רחבה';});else perf.textContent='סובב את הטלפון לתצוגה רחבה';}
    }),{signal:events.signal});
    stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY};},{signal:events.signal});
    stage.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.006;zoom=T.MathUtils.clamp(zoom+(e.clientY-drag.y)*.003,.7,1.6);drag={x:e.clientX,y:e.clientY};guarded(draw);},{signal:events.signal});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,()=>{drag=null;},{signal:events.signal});
    document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;frames=0;windowMs=0;schedule();},{signal:events.signal});
  }catch(e){dispose();throw e;}
  return {
    get busy(){return !disposed&&(!!clip||queue.length>0);},
    get diagnostics(){return {...stats,eventId:clip?.id??null,time,queued:queue.length,disposed};},
    sync(value){snapshot=value;if(!clip)guarded(draw);},
    enqueue(clips){if(disposed)return;if(queue.length+clips.length>32){fail();return;}queue.push(...clips);if(!clip)guarded(next);schedule();},
    setPaused,dispose
  };
}
