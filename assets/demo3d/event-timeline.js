// Pure sampling of an already decided engine event. No simulation or random calls.
export const CLIP_DURATION=5.6;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>({x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t)});
const SHOOT=3.3,CONTACT=4.1;
export function eventFrame(clip,time){
  const t=clamp(time,0,CLIP_DURATION),path=clip.path,shot=path[path.length-2],end=path.at(-1);
  // The final pass starts at path[n-3]. With a recorded assist that is where the passer stands; without one (or on a
  // two-point path) the shooter is the only named player of the move.
  const n=path.length,passAt=Math.max(0,n-3),passer=clip.assist!=null&&n>=3?clip.assist:null,pass=path[passAt];
  const tPass=SHOOT*passAt/Math.max(1,n-2),run=t<SHOOT?t/SHOOT*(n-2):n-2;
  let ball;
  if(t<SHOOT){
    const progress=t/SHOOT*(path.length-2),i=Math.min(path.length-2,Math.floor(progress));
    ball={...mix(path[i],path[Math.min(i+1,path.length-2)],progress-i),y:.145+Math.sin((progress-i)*Math.PI)*.15};
  }else if(t<CONTACT){const u=(t-SHOOT)/(CONTACT-SHOOT);ball={...mix(shot,end,u),y:.145+Math.sin(u*Math.PI)*.9};}
  else if(clip.outcome==='save'||clip.outcome==='post'){
    const u=clamp((t-CONTACT)/1.2);ball={...mix(end,{x:end.x-5*clip.direction,z:end.z+(end.z>=0?4:-4)},u),y:.145+Math.sin(u*Math.PI)*.7};
  }else{ball={...end,y:.145};}
  const players=clip.players.map(p=>{
    const attacking=p.team===clip.team,isShooter=p.pid===clip.shooter&&attacking,isKeeper=p.pid===clip.keeper&&!attacking,isPasser=passer!=null&&p.pid===passer&&attacking&&!isShooter;
    let from={x:p.x,z:p.z},to={x:clamp(p.x+clip.direction*(attacking?9:3),-51,51),z:p.z*.82};
    // Shooter arrives at the exact recorded shooting spot, never at a demo fixture.
    if(isShooter){from={x:shot.x-3*clip.direction,z:shot.z+.6};to={x:shot.x-.47*clip.direction,z:shot.z};}
    if(isKeeper){from={x:clip.direction*50.3,z:0};to={x:end.x-.3*clip.direction,z:clamp(end.z,-3.5,3.5)};}
    let u=isKeeper?clamp((t-SHOOT)/.8):clamp(t/SHOOT),span=isKeeper?.8:SHOOT;
    // The passer meets the ball where the final pass starts, plays it and follows the move.
    if(isPasser){const spot={x:pass.x-.45*clip.direction,z:pass.z};
      if(t<tPass||tPass===0&&t===0){from={x:spot.x-2.4*clip.direction,z:spot.z+.5};to=spot;u=tPass?clamp(t/tPass):1;span=tPass||1;}
      else{from=spot;to={x:clamp(spot.x+5*clip.direction,-51,51),z:spot.z};u=clamp((t-tPass)/(CLIP_DURATION-tPass));span=CLIP_DURATION-tPass;}}
    const pos=mix(from,to,u);
    return {...p,...pos,angle:Math.atan2(to.x-from.x,to.z-from.z),speed:u>0&&u<1?Math.hypot(to.x-from.x,to.z-from.z)/span:0,
      keeper:p.slot==='GK',kick:isShooter?Math.max(0,1-Math.abs(t-SHOOT)/.3):0,
      dive:isKeeper?clamp((t-SHOOT)/.7)*(1-clamp((t-4.7)/.9)):0,
      celebrate:attacking&&clip.outcome==='goal'&&t>=CONTACT?clamp((t-CONTACT)/.5):0};
  });
  // Who has the ball: the passer while the final ball is at his feet, then the shooter (the pass is on its way to him)
  // through the shot; after it the scorer keeps his name, a keeper who saved gets his, and a miss belongs to nobody.
  let holder=null;const shooter={pid:clip.shooter,team:clip.team};
  if(t>=CONTACT){if(clip.outcome==='goal')holder=shooter;else if(clip.outcome==='save'&&clip.keeper!=null&&t<CONTACT+1.3){const k=clip.players.find(p=>p.pid===clip.keeper&&p.team!==clip.team);if(k)holder={pid:k.pid,team:k.team};}}
  else if(passer!=null&&run<passAt+.12){if(run>passAt-.6)holder={pid:passer,team:clip.team};}
  else if(run>=passAt)holder=shooter;
  return {players,ball,holder,ended:t>=CLIP_DURATION,contact:t>=CONTACT,netTime:clip.outcome==='goal'?t-CONTACT:-1};
}
export function idleFrame(snapshot){
  const flip=snapshot.minute>45?-1:1;
  return {players:snapshot.players.map(p=>({...p,x:p.x*flip,z:p.z*flip,angle:(p.side?-1:1)*flip*Math.PI/2,speed:0,kick:0,dive:0,celebrate:0,keeper:p.slot==='GK'})),ball:{x:0,y:.145,z:0},holder:null,netTime:-1};
}
