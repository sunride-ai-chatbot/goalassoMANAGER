// The result committed by both phones must agree with the single chosen dive.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/js/36f-penalty.js','utf8');
const start=src.indexOf('function penPoweredSave('),end=src.indexOf('/* an AI keeper:',start);
const c=vm.createContext({clamp:(n,l,h)=>Math.max(l,Math.min(h,n)),penDirCol:d=>d.includes('L')?'L':d.includes('R')?'R':'C'});
vm.runInContext(src.slice(start,end),c);
const save=(x,y,side,power,roll=0,catchRoll=0)=>c.penPoweredSave(x,y,75,side,power,roll,catchRoll);
assert.equal(save(2.8,.26,'L',80).saved,false,'fast ball beats a wrong-side dive');
assert.equal(save(2.8,.26,'L',30).dive,'R','slow ball is read before the one chosen dive');
assert.equal(save(2.8,.26,'L',30).saved,true);
assert.equal(save(0,2.12,'L',30).dive,'C','a central slow shot requires staying central');
assert.equal(save(0,2.12,'L',30).saved,true);
assert.equal(save(0,.26,'C',30).catch,true);
assert.equal(save(0,.26,'C',30,0,.999).catch,false);
for(const side of ['L','C','R']){
 assert.equal(save(4.5,.3,side,30).saved,false);
 assert.equal(save(0,3.2,side,30).saved,false);
}
// Deterministic rolls used by network peers produce identical decisions.
assert.deepEqual(save(-2.8,1.2,'L',65,.42,.35),save(-2.8,1.2,'L',65,.42,.35));
const clip=JSON.parse(fs.readFileSync('assets/penalties29/motions/clips.json')).highL;
assert.equal(clip.labels.length,clip.frames);assert.equal(clip.floors.length,clip.frames);
assert.equal(clip.pages.reduce((n,p)=>n+p.frames,0),clip.frames);
for(const p of clip.pages){
 assert.ok(p.cols*clip.width<=4096&&p.rows*clip.height<=4096,'phone-safe texture dimensions');
 assert.ok(fs.statSync('assets/penalties29/motions/'+p.url.split('/').pop()).size>10000);
}
console.log('Penalty power: committed direction, weak-ball reads, catches/parries, network determinism and native texture pages passed.');
