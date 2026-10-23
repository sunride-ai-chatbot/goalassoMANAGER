// A deterministic presentation fixture, not a football AI or a career result.
// Coordinates are metres: length along X, height Y, width Z. All views sample
// the same timeline; pause, seek, replay and frame rate cannot change the play.
export const DURATION=19;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const red=[[-48,0],[-12,-22],[-17,-7],[-16,10],[-9,24],[0,-9],[8,5],[18,-21],[17,14],[29,3],[29,25]];
const white=[[50.3,0],[37,-17],[39,-5],[40,8],[33,24],[26,-10],[26,7],[16,-22],[17,14],[5,4],[8,25]];
const special={
 '0:6':[[0,8,5],[2,12,4],[4,15,3],[8,26,5],[11,33,4],[15,39,1],[19,39,1]],
 '0:7':[[0,18,-21],[3.4,22,-17],[7,33,-10],[9,36,-7],[12,41,-6],[16,43,-3],[19,43,-3]],
 '0:9':[[0,29,3],[4,31,3],[7,34,2],[8.5,37,1],[10.8,41,-1],[12,42,-1],[16,45,3],[19,45,3]],
 '1:1':[[0,37,-17],[4,32,-17],[7,34,-13],[10,39,-8],[13,43,-5],[19,43,-5]],
 '1:2':[[0,39,-5],[6,36,-4],[8.5,37.5,-2],[10.8,40,-3],[13,44,-3],[19,44,-3]],
 '1:3':[[0,40,8],[7,39,5],[10.8,43,2],[13,46,1],[19,46,1]],
 '1:6':[[0,26,7],[5,27,4],[8,31,3],[11,36,2],[15,38,2],[19,38,2]]
};
function track(team,index){const key=team+':'+index;if(special[key])return special[key];const p=(team?white:red)[index];if(index===0)return[[0,...p],[19,...p]];return [[0,...p],[7,p[0]+(team?2:8),p[1]*.8],[12,p[0]+(team?5:13),p[1]*.7],[19,p[0]+(team?5:13),p[1]*.7]]}
function point(points,t){let i=0;while(i<points.length-2&&points[i+1][0]<t)i++;const a=points[i],b=points[i+1],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+2)],u=clamp((t-a[0])/(b[0]-a[0])),d=b[0]-a[0];const herm=(k)=>{const m0=(b[k]-prev[k])/(b[0]-prev[0]),m1=(next[k]-a[k])/(next[0]-a[0]);return (2*u**3-3*u*u+1)*a[k]+(u**3-2*u*u+u)*d*m0+(-2*u**3+3*u*u)*b[k]+(u**3-u*u)*d*m1};return {x:herm(1),z:herm(2)}}
export function playerState(team,index,t,scenario='goal'){
 t=clamp(t,0,DURATION);const path=track(team,index),p=point(path,t),prev=point(path,Math.max(0,t-.03)),next=point(path,Math.min(DURATION,t+.03));const dx=next.x-prev.x,dz=next.z-prev.z;let angle=Math.atan2(dx,dz),speed=Math.hypot(dx,dz)/.06;if(speed<.02)angle=team?-Math.PI/2:Math.PI/2;
 let kick=0;for(const [who,contact] of [[6,2],[7,7],[9,10.8]])if(team===0&&index===who){const delta=t-contact;if(delta>-.23&&delta<.34){kick=Math.sin(clamp((delta+.23)/.57)*Math.PI);angle=who===6?Math.atan2(10,-21):who===7?Math.atan2(4,11):Math.atan2(12,-1.4)}}
 const state={...p,angle,speed,kick,keeper:index===0,celebrate:0,dive:0};
 if(team===1&&index===0){const d=smooth(clamp((t-10.9)/.65));state.x=lerp(50.3,scenario==='goal'?51.2:50.4,d);state.z=lerp(0,scenario==='goal'?-1.4:-1.1,d);state.angle=-Math.PI/2;state.dive=d*(1-smooth(clamp((t-14)/2)));state.speed=0;}
 if(team===0&&scenario==='goal'&&t>12&&(index===9||index===7||index===6))state.celebrate=smooth(clamp((t-12)/.7));return state;
}
function foot(index,t){const p=playerState(0,index,t),f=.47;return {x:p.x+Math.sin(p.angle)*f,z:p.z+Math.cos(p.angle)*f,y:.145+Math.abs(Math.sin(t*10))*.055}}
function flight(a,b,t,start,end,arc=.12){const u=clamp((t-start)/(end-start));return {x:lerp(a.x,b.x,u),z:lerp(a.z,b.z,u),y:lerp(a.y,b.y,u)+Math.sin(u*Math.PI)*arc}}
export function ballState(t,scenario='goal'){
 if(t<2)return foot(6,t);
 if(t<3.4)return flight(foot(6,2),foot(7,3.4),t,2,3.4,.13);
 if(t<7)return foot(7,t);
 if(t<8.5)return flight(foot(7,7),foot(9,8.5),t,7,8.5,.23);
 if(t<10.8)return foot(9,t);
 if(scenario==='save'){
  const contact={x:50.5,z:-1.7,y:.95};if(t<11.4)return flight(foot(9,10.8),contact,t,10.8,11.4,.18);
  if(t<13.1)return flight(contact,{x:46.7,z:-7.5,y:.145},t,11.4,13.1,1.1);
  return{x:46.7-(t-13.1)*.33,z:-7.5-(t-13.1)*.3,y:.145+Math.abs(Math.sin((t-13.1)*7))*.18*Math.exp(-(t-13.1))};
 }
 if(t<11.6)return flight(foot(9,10.8),{x:54.15,z:-2.6,y:1.05},t,10.8,11.6,.25);
 const u=clamp((t-11.6)/1.6);return{x:54.15-u*.75,z:-2.6+u*.15,y:.145+.86*Math.abs(Math.cos(u*Math.PI*1.5))*Math.exp(-u*4)};
}
export function frameState(t,scenario='goal'){
 const players=[];for(let team=0;team<2;team++)for(let i=0;i<11;i++)players.push(playerState(team,i,t,scenario));
 const phases=t<2?['המהלך מתחיל בקישור','01 / 05']:t<7?['מסירה לאגף. פותחים את ההגנה.','02 / 05']:t<8.5?['כדור פנימה אל החלוץ','03 / 05']:t<10.8?['נגיעה קדימה — והכנה לבעיטה','04 / 05']:t<11.6?['בעיטה לפינה!','05 / 05']:scenario==='goal'?['שער! מהלך קבוצתי מושלם.','05 / 05']:['השוער הודף את הכדור!','05 / 05'];
 return{players,ball:ballState(t,scenario),phase:phases[0],phaseNumber:phases[1],goal:scenario==='goal'&&t>=11.6,outcomeVisible:t>=12&&t<15.4,ended:t>=DURATION};
}
