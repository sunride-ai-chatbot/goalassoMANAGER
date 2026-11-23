import {shirtTrack as goalTrack} from './goal-track.js';
import {shirtTrack as missTrack} from './miss-track.js';
import * as T from './vendor/three.js';
// The shared photographed motion has a fixed crop and ground calibration for every aim.
// Name, number and kit belong to the current roster player, never to the source plate.
export function filmedTaker(scene){
 const group=new T.Group();group.rotation.y=-Math.PI/2;group.visible=false;scene.add(group);
 const shirtColor=new T.Color(),shortsColor=new T.Color();
 const material=new T.MeshBasicMaterial({transparent:true,alphaTest:.12,toneMapped:false,side:T.DoubleSide});
 const actor=new T.Mesh(new T.PlaneGeometry(1,1),material);group.add(actor);
 material.onBeforeCompile=shader=>{
  shader.uniforms.shirtColor={value:shirtColor};shader.uniforms.shortsColor={value:shortsColor};
  shader.fragmentShader='uniform vec3 shirtColor;uniform vec3 shortsColor;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 cloth=diffuseColor.rgb;
   float yellow=smoothstep(.035,.14,min(cloth.r,cloth.g)-cloth.b)*smoothstep(.47,.69,cloth.g/max(cloth.r,.001));
   float blue=smoothstep(.02,.10,cloth.b-max(cloth.r,cloth.g));
   diffuseColor.rgb=mix(cloth,shirtColor*clamp(cloth.g/.66,.12,1.4),yellow);
   diffuseColor.rgb=mix(diffuseColor.rgb,shortsColor*clamp(cloth.b/.36,.1,1.4),blue);`);
 };
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=320;const ink=new T.CanvasTexture(canvas);ink.colorSpace=T.SRGBColorSpace;
 const label=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:ink,transparent:true,depthWrite:false,toneMapped:false}));group.add(label);
 let data=null,pages=[],dead=false,identity={};const reactions={};
 for(const [name,track] of Object.entries({goal:goalTrack,miss:missTrack})){
  const rows=Math.ceil(track.length/12);const texture=new T.TextureLoader().load(new URL('../taker/'+name+'.png',import.meta.url).href,()=>{reactions[name].ready=true});
  texture.colorSpace=T.SRGBColorSpace;texture.repeat.set(1/12,1/rows);reactions[name]={texture,track,rows,ready:false};
 }
 const api={group,contact:2.35,duration:3.95,identify(o){identity=o;shirtColor.set(o.kit||'#ead03f');shortsColor.set(o.trim||'#204987');
  const c=canvas.getContext('2d');c.clearRect(0,0,384,320);c.fillStyle=shirtColor.getHSL({}).l>.36?'#152139':'#fffdf2';c.textAlign='center';c.textBaseline='top';
  let size=72;do{c.font='bold '+size+'px Arial';if(c.measureText(o.name||'').width<=370)break;size-=2}while(size>24);
  c.fillText(o.name||'',192,5,374);c.font='bold 218px Arial';c.fillText(String(o.number??9),192,96,372);ink.needsUpdate=true;
 },pose(time,x,z,reaction,elapsed){if(dead)return;
 const take=reactions[reaction];if(take?.ready){group.visible=true;const h=3.15,w=h*208/376,i=Math.min(take.track.length-1,Math.max(0,Math.floor(elapsed*16)));
  material.map=take.texture;take.texture.offset.set(i%12/12,1-(Math.floor(i/12)+1)/take.rows);actor.scale.set(w,h,1);group.position.set(x,h*(.86-.5),0);
  const [sx,sy]=take.track[i];label.position.set((sx/208-.5)*w,(.5-sy/376)*h,.008);label.scale.set(.54,.40,1);label.rotation.z=0;return;
 }
 if(!data)return;group.visible=true;
  const i=Math.min(data.frames-1,Math.max(0,Math.floor(time*data.fps))),p=pages.findLast(p=>p.start<=i),f=i-p.start;
  p.texture.offset.set(f%p.cols/p.cols,1-(Math.floor(f/p.cols)+1)/p.rows);material.map=p.texture;
  const h=data.worldHeight,w=h*data.width/data.height;actor.scale.set(w,h,1);
  group.position.set(x,h*(data.floors[i]-.5),-(data.contactX-.5)*w);
  const q=data.labels[i];label.position.set((q.x-.5)*w,(.5-q.y)*h,.008);label.scale.set(q.width*w,q.height*h,1);label.rotation.z=q.angle*Math.PI/180;
 },dispose(){dead=true;pages.forEach(p=>p.texture.dispose());Object.values(reactions).forEach(r=>r.texture.dispose())}};
 fetch(new URL('../motions/clips.json?v=production9',import.meta.url)).then(r=>{if(!r.ok)throw Error('motion');return r.json()}).then(async all=>{
  const d=all.highL;const loaded=await Promise.all(d.pages.map(async p=>{const filename=p.url.split('/').pop();const texture=await new T.TextureLoader().loadAsync(new URL('../motions/'+filename,import.meta.url).href);texture.colorSpace=T.SRGBColorSpace;texture.repeat.set(1/p.cols,1/p.rows);texture.generateMipmaps=false;texture.minFilter=texture.magFilter=T.LinearFilter;return {...p,texture}}));
  if(dead){loaded.forEach(p=>p.texture.dispose());return}pages=loaded;data=d;api.contact=d.contact;api.duration=d.frames/d.fps;api.identify(identity);
 }).catch(e=>console.error('Photographed taker unavailable',e));
 return api;
}
