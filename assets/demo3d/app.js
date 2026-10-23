import * as T from './vendor/three.js';
import {buildWorld,animateNet} from './world.js';
import {makePlayers,posePlayer,makeBall} from './actors.js';
import {DURATION,frameState} from './match.js';
const $=id=>document.getElementById(id),host=$('canvas-host');
let renderer,scene,camera,actors,ball,world;
let time=0,playing=false,speed=1,scenario='goal',cameraMode=0,quality='auto',ready=false,last=performance.now(),fps=60,frames=0,perfStart=last,slowFrames=0,autoLow=false;
let dragYaw=0,zoom=1,dragLast=null,pinchDistance=0;const pointers=new Map();
const modes=['מצלמת שידור','מצלמת קו המגרש','מאחורי השער'];
const target=new T.Vector3(),camTarget=new T.Vector3(),camPosition=new T.Vector3();
function fail(message){$('loading').hidden=true;$('error').hidden=false;$('error-text').textContent=message;playing=false;}
function applyQuality(){const low=quality==='low'||(quality==='auto'&&autoLow);renderer.setPixelRatio(Math.min(devicePixelRatio||1,low?1:1.6));renderer.shadowMap.enabled=!low;renderer.shadowMap.needsUpdate=true;for(const a of actors)a.shadow.visible=true;resize();$('quality').textContent=quality==='auto'?'איכות: אוטומטית':quality==='high'?'איכות: גבוהה':'איכות: חסכונית';}
function resize(){if(!renderer)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw(true);}
function cameraAt(state,snap){const b=state.ball,portrait=camera.aspect<1;let focusX=T.MathUtils.clamp(b.x,10,43),focusZ=b.z*.38;let pos;
 if(cameraMode===0){target.set(focusX,0.8,focusZ);pos=new T.Vector3(focusX-12,portrait?13:18,focusZ+(portrait?24:31));camera.fov=portrait?48:43;}
 else if(cameraMode===1){target.set(b.x,1.1,b.z);pos=new T.Vector3(b.x-7,4.3,b.z+12);camera.fov=portrait?50:43;}
 else{target.set(37,1,0);pos=new T.Vector3(64,14,12);camera.fov=portrait?63:53;}
 const delta=pos.sub(target).multiplyScalar(zoom);delta.applyAxisAngle(new T.Vector3(0,1,0),dragYaw);camPosition.copy(target).add(delta);const blend=snap?1:.07;camera.position.lerp(camPosition,blend);camTarget.lerp(target,blend);camera.lookAt(camTarget);camera.updateProjectionMatrix();}
function ui(state){$('score').textContent=state.goal?'1 – 0':'0 – 0';const seconds=10+Math.floor(time);$('clock').textContent='63:'+String(seconds).padStart(2,'0');$('commentary').textContent=state.phase;$('phase-number').textContent=state.phaseNumber;$('elapsed').textContent='00:'+String(Math.floor(time)).padStart(2,'0');$('timeline').value=time;$('goal-banner').hidden=!state.outcomeVisible;$('outcome-title').textContent=scenario==='goal'?'שער!':'איזו הצלה!';$('outcome-note').textContent=scenario==='goal'?'מהלך קבוצתי. סיום מדויק.':'זינוק לפינה. הסכנה הורחקה.';$('play').innerHTML=playing?'❚❚ <span>עצירה</span>':time>=DURATION?'↺ <span>הפעל שוב</span>':'▶ <span>הפעל מהלך</span>';$('play').setAttribute('aria-label',playing?'עצור מהלך':'הפעל מהלך');}
function draw(snap=false){if(!ready)return;const state=frameState(time,scenario);actors.forEach((a,i)=>posePlayer(a,state.players[i],time));ball.ball.position.set(state.ball.x,state.ball.y,state.ball.z);ball.ball.rotation.set(time*6,0,-time*9);ball.shadow.position.set(state.ball.x,.028,state.ball.z);ball.shadow.material.opacity=.38/(1+state.ball.y);ball.shadow.scale.setScalar(1+state.ball.y*.25);animateNet(world.goals[1],scenario==='goal'?time-11.6:-1,-2.6);cameraAt(state,snap);renderer.render(scene,camera);ui(state);}
function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,.05);last=now;if(!ready||document.hidden)return;if(!playing)return;time=Math.min(DURATION,time+dt*speed);if(time===DURATION)playing=false;draw();frames++;if(now-perfStart>2000){fps=Math.round(frames*1000/(now-perfStart));frames=0;perfStart=now;if(playing&&fps<25)slowFrames++;else slowFrames=0;if(quality==='auto'&&slowFrames>=2&&!autoLow){autoLow=true;applyQuality()}$('performance').textContent='בדיקה בדפדפן הזה: '+fps+' FPS · '+(autoLow?'איכות חסכונית':'איכות גבוהה');window.GOALASSO_3D.stats={fps,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,pixelRatio:renderer.getPixelRatio(),quality:autoLow?'low':'high',players:actors.length};}}
try{
 renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;host.appendChild(renderer.domElement);
 scene=new T.Scene();camera=new T.PerspectiveCamera(47,1,.1,320);world=buildWorld(scene,renderer);actors=makePlayers(scene);ball=makeBall(scene);ready=true;applyQuality();draw(true);$('loading').hidden=true;
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('התצוגה הגרפית נעצרה. לחץ על ״נסה שוב״ כדי לטעון את המגרש מחדש.');});
 window.GOALASSO_3D={get state(){return {time,playing,speed,scenario,camera:cameraMode,ready,frame:frameState(time,scenario)}},stats:{},seek(t){time=Math.max(0,Math.min(DURATION,t));playing=false;draw(true)}};
 requestAnimationFrame(loop);
}catch(e){console.error(e);fail('לא ניתן להפעיל תלת־ממד בדפדפן הזה. נסה לפתוח ב־Safari או Chrome מעודכן.');}
$('play').onclick=()=>{if(!ready)return;if(time>=DURATION)time=0;playing=!playing;last=performance.now();perfStart=last;frames=0;draw();};
$('replay').onclick=()=>{time=0;playing=true;last=performance.now();perfStart=last;frames=0;draw(true)};
$('camera').onclick=()=>{cameraMode=(cameraMode+1)%3;dragYaw=0;zoom=1;$('view-label').textContent=modes[cameraMode];draw(true)};
$('speed').onclick=()=>{speed=({1:.5,.5:.25,.25:1})[speed];$('speed').innerHTML='×'+speed+' <span>מהירות</span>'};
$('timeline').oninput=e=>{time=+e.target.value;playing=false;draw(true)};
$('quality').onclick=()=>{quality=quality==='auto'?'high':quality==='high'?'low':'auto';applyQuality()};
for(const b of document.querySelectorAll('[data-scenario]'))b.onclick=()=>{scenario=b.dataset.scenario;time=0;playing=true;document.querySelectorAll('[data-scenario]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));draw(true)};
$('info').onclick=()=>{playing=false;draw();$('about').showModal()};document.querySelectorAll('.close,.close-about').forEach(b=>b.onclick=()=>$('about').close());
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('arena').requestFullscreen)await $('arena').requestFullscreen();else{$('hint').textContent='סובב את הטלפון למצב אופקי לתצוגה רחבה';$('hint').style.opacity=1}}catch(e){$('hint').textContent='סובב את הטלפון לתצוגה רחבה';$('hint').style.opacity=1}};
new ResizeObserver(resize).observe(host);
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;draw()}last=performance.now()});window.addEventListener('pagehide',()=>{playing=false});
host.addEventListener('pointerdown',e=>{host.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});dragLast={x:e.clientX,y:e.clientY};pinchDistance=0;$('hint').style.opacity=0});
host.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinchDistance)zoom=T.MathUtils.clamp(zoom*pinchDistance/d,.6,1.6);pinchDistance=d;}else if(dragLast){dragYaw+=(e.clientX-dragLast.x)*.006;zoom=T.MathUtils.clamp(zoom+(e.clientY-dragLast.y)*.002,.6,1.6)}dragLast={x:e.clientX,y:e.clientY};draw(true)});
for(const type of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(type,e=>{pointers.delete(e.pointerId);dragLast=null;pinchDistance=0});host.addEventListener('wheel',e=>{e.preventDefault();zoom=T.MathUtils.clamp(zoom+e.deltaY*.001,.6,1.6);draw(true)},{passive:false});
