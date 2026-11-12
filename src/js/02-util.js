/* ====================== helpers ====================== */
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
/* amounts are LTR runs inside RTL text, so the minus sign and the ₪ stay in place: wrapped in LRI…PDI isolates */
const NIS=n=>{const s=n<0?'-':'';n=Math.abs(n);return '\u2066'+s+'₪'+(n>=1e6?(n/1e6).toFixed(n>=1e7?0:1)+'M':n>=1e3?(n/1e3).toFixed(0)+'K':n.toFixed(0))+'\u2069'};
const $=id=>(typeof document!=='undefined'&&document)?document.getElementById(id):null;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const byOvr=(a,b)=>b.ovr-a.ovr;
const fullName=p=>p.first+(p.last&&p.last!==p.first?' '+p.last:'');
/* A score between two teams that stand side by side: each number sits beside its own team (the home side is first, so on
   the right of this right-to-left screen). One left-to-right text "1 : 0" puts the home side's goals next to the visitors.
   scoreSidesSet updates the numbers in place and returns the side whose number went up ('h' | 'a' | ''). */
const scoreSides=(gh,ga,o)=>{o=o||{};return `<span class="sides${o.cls?' '+o.cls:''}"${o.id?` id="${o.id}"`:''} dir="rtl"${o.label?` role="img" aria-label="${esc(o.label)}"`:''}><bdi class="sd-h">${gh}</bdi><i aria-hidden="true">:</i><bdi class="sd-a">${ga}</bdi></span>`};
const scoreSidesSet=(el,gh,ga,label)=>{if(!el)return '';let up='';for(const [k,v,s] of [['.sd-h',gh,'h'],['.sd-a',ga,'a']]){const d=el.querySelector(k);if(!d||d.textContent===String(v))continue;if(+d.textContent<v)up=s;d.textContent=v;if(up===s){d.classList.remove('pop');void d.offsetWidth;d.classList.add('pop')}}
  if(label){el.setAttribute('role','img');el.setAttribute('aria-label',label)}return up};
let uid=1;

