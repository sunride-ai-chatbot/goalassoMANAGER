// Pure sampling of an already decided engine event. No simulation or random calls.
export const CLIP_DURATION=5.6;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>({x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t)});
const SHOOT=3.3,CONTACT=4.1;
export function eventFrame(clip,time){
  const t=clamp(time,0,CLIP_DURATION),path=clip.path,shot=path[path.length-2],end=path.at(-1);
  let ball;
  if(t<SHOOT){
    const progress=t/SHOOT*(path.length-2),i=Math.min(path.length-2,Math.floor(progress));
    ball={...mix(path[i],path[Math.min(i+1,path.length-2)],progress-i),y:.145+Math.sin((progress-i)*Math.PI)*.15};
  }else if(t<CONTACT){const u=(t-SHOOT)/(CONTACT-SHOOT);ball={...mix(shot,end,u),y:.145+Math.sin(u*Math.PI)*.9};}
  else if(clip.outcome==='save'||clip.outcome==='post'){
    const u=clamp((t-CONTACT)/1.2);ball={...mix(end,{x:end.x-5*clip.direction,z:end.z+(end.z>=0?4:-4)},u),y:.145+Math.sin(u*Math.PI)*.7};
  }else{ball={...end,y:.145};}
  const players=clip.players.map(p=>{
    const attacking=p.team===clip.team,isShooter=p.pid===clip.shooter&&attacking,isKeeper=p.pid===clip.keeper&&!attacking;
    let from={x:p.x,z:p.z},to={x:clamp(p.x+clip.direction*(attacking?9:3),-51,51),z:p.z*.82};
    // Shooter arrives at the exact recorded shooting spot, never at a demo fixture.
    if(isShooter){from={x:shot.x-3*clip.direction,z:shot.z+.6};to={x:shot.x-.47*clip.direction,z:shot.z};}
    if(isKeeper){from={x:clip.direction*50.3,z:0};to={x:end.x-.3*clip.direction,z:clamp(end.z,-3.5,3.5)};}
    const u=isKeeper?clamp((t-SHOOT)/.8):clamp(t/SHOOT),pos=mix(from,to,u);
    return {...p,...pos,angle:Math.atan2(to.x-from.x,to.z-from.z),speed:u>0&&u<1?Math.hypot(to.x-from.x,to.z-from.z)/(isKeeper?.8:SHOOT):0,
      keeper:p.slot==='GK',kick:isShooter?Math.max(0,1-Math.abs(t-SHOOT)/.3):0,
      dive:isKeeper?clamp((t-SHOOT)/.7)*(1-clamp((t-4.7)/.9)):0,
      celebrate:attacking&&clip.outcome==='goal'&&t>=CONTACT?clamp((t-CONTACT)/.5):0};
  });
  return {players,ball,ended:t>=CLIP_DURATION,contact:t>=CONTACT,netTime:clip.outcome==='goal'?t-CONTACT:-1};
}
export function idleFrame(snapshot){
  const flip=snapshot.minute>45?-1:1;
  return {players:snapshot.players.map(p=>({...p,x:p.x*flip,z:p.z*flip,angle:(p.side?-1:1)*flip*Math.PI/2,speed:0,kick:0,dive:0,celebrate:0,keeper:p.slot==='GK'})),ball:{x:0,y:.145,z:0},netTime:-1};
}
