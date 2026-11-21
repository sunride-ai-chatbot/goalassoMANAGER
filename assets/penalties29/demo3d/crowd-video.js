import * as T from './vendor/three.js';
// Same-origin, silent video. The existing crowd audio remains user-controlled.
export function createCrowdVideo(scene){
 const video=document.createElement('video');
 video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='auto';
 video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');
 video.src=new URL('../video/kahal-duo-loop.mp4',import.meta.url).href;
 const poster=new T.TextureLoader().load(new URL('../video/kahal-poster.jpg',import.meta.url).href);
 poster.colorSpace=T.SRGBColorSpace;
 const texture=new T.VideoTexture(video);texture.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshBasicMaterial({map:poster,toneMapped:false,fog:false,side:T.DoubleSide});
 const geometry=new T.PlaneGeometry(48,48*416/752);
 const wall=new T.Mesh(geometry,material);wall.rotation.y=-Math.PI/2;wall.position.set(58,48*416/752/2-2,0);scene.add(wall);
 let disposed=false;
 const ready=()=>{if(!disposed&&video.readyState>=2){material.map=texture;material.needsUpdate=true;}};
 const error=()=>{if(!disposed){material.map=poster;material.needsUpdate=true;}};
 const play=()=>{if(disposed||document.hidden)return;const p=video.play();if(p?.catch)p.catch(()=>{});};
 const visibility=()=>{if(document.hidden)video.pause();else play();};
 video.addEventListener('playing',ready);video.addEventListener('error',error);
 document.addEventListener('visibilitychange',visibility);
 document.addEventListener('pointerdown',play);
 document.addEventListener('keydown',play);
 play();
 return {dispose(){if(disposed)return;disposed=true;video.pause();video.removeEventListener('playing',ready);video.removeEventListener('error',error);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('pointerdown',play);document.removeEventListener('keydown',play);video.removeAttribute('src');video.load();scene.remove(wall);geometry.dispose();material.dispose();poster.dispose();texture.dispose();}};
}
