import {shirtTrack as goalTrack} from './goal-track.js';
import {shirtTrack as missTrack} from './miss-track.js';
import {soleRow} from './boot-track.js';
import * as T from './vendor/three.js';
import {shirtTrack} from './shirt-track.js?v=17';
export function filmedTaker(scene){
 const group=new T.Group();
 const rows=Math.ceil(shirtTrack.length/15);
 const atlas=new T.TextureLoader().load(new URL('../taker/pendel24.png',import.meta.url).href,()=>{group.visible=true});
 atlas.colorSpace=T.SRGBColorSpace;
 atlas.repeat.set(1/15,1/rows);
 const reactions={};
 for(const [name,track] of Object.entries({goal:goalTrack,miss:missTrack})){
   const rows=Math.ceil(track.length/12);
   const texture=new T.TextureLoader().load(new URL('../taker/'+name+'.png',import.meta.url).href,()=>{reactions[name].ready=true});
   texture.colorSpace=T.SRGBColorSpace;
   texture.repeat.set(1/12,1/rows);
   reactions[name]={texture,track,rows,ready:false};
 }
 const height=3.15,width=height*208/376;
 const actor=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:atlas,transparent:true,alphaTest:.12,toneMapped:false}));
 const shirtColor=new T.Color(), shortsColor=new T.Color();
 actor.material.onBeforeCompile=shader=>{
   shader.uniforms.shirtColor={value:shirtColor};
   shader.uniforms.shortsColor={value:shortsColor};
   shader.fragmentShader='uniform vec3 shirtColor; uniform vec3 shortsColor;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
     vec3 cloth=diffuseColor.rgb;
     float yellow=smoothstep(.035,.14,min(cloth.r,cloth.g)-cloth.b)*smoothstep(.47,.69,cloth.g/max(cloth.r,.001));
     float blue=smoothstep(.02,.10,cloth.b-max(cloth.r,cloth.g));
     diffuseColor.rgb=mix(cloth,shirtColor*clamp(cloth.g/.66,.12,1.4),yellow);
     diffuseColor.rgb=mix(diffuseColor.rgb,shortsColor*clamp(cloth.b/.36,.1,1.4),blue);`);
 };
 actor.castShadow=true;
 actor.material.shadowSide=T.DoubleSide;
 group.add(actor);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=160;
 const ink=new T.CanvasTexture(canvas);
 const label=new T.Mesh(new T.PlaneGeometry(.42,.29),new T.MeshBasicMaterial({map:ink,transparent:true,depthWrite:false,toneMapped:false}));
 group.add(label);group.rotation.y=-Math.PI/2;group.visible=false;scene.add(group);
 return {group,identify(o){
 shirtColor.set(o.kit||'#ead03f');shortsColor.set(o.trim||'#204987');
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,160);ctx.fillStyle=shirtColor.getHSL({}).l>.36?'#152139':'#fffdf2';ctx.textAlign='center';ctx.font='bold 31px Arial';ctx.fillText(o.name||'',128,37,246);ctx.font='bold 117px Arial';if(o.number!=null)ctx.fillText(String(o.number),128,152);ink.needsUpdate=true;
 },pose(time,x,z,reaction,elapsed){
 const take=reactions[reaction];
 const active=take?.ready;
 const texture=active?take.texture:atlas;
 const track=active?take.track:shirtTrack;
 const cols=active?12:15;
 const rowCount=active?take.rows:rows;
 const i=Math.min(track.length-1,Math.floor(active?elapsed*16:time*24));
 actor.material.map=texture;
 texture.offset.set(i%cols/cols,1-(Math.floor(i/cols)+1)/rowCount);
 const floor=active?.86:Math.max(.78,(soleRow[i]+1)/376);
 group.position.set(x,height*(floor-.5),z);
 const [sx,sy]=track[i];
 label.position.set((sx/208-.5)*width,(.5-sy/376)*height,.007);
 }};
}
