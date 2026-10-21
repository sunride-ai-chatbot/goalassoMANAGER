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
let uid=1;

