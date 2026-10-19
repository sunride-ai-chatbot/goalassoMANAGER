// Legacy suites are smoke checks; reliability.test.js adds business assertions.
const {execFile}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const files=fs.readdirSync(__dirname).filter(f=>f.endsWith('.test.js')).sort();
let next=0,failed=0;
async function worker(){while(next<files.length){const file=files[next++];await new Promise(resolve=>{
 execFile(process.execPath,[path.join(__dirname,file)],{encoding:'utf8',timeout:600000,maxBuffer:8*1024*1024},(error,stdout,stderr)=>{
  const reported=[...stdout.matchAll(/(?:errors|errs)\s*\[([^\]]*)\]/g)].some(m=>m[1].trim());
  const bad=!!error||reported||/Error: Uncaught \[/.test(stderr);
  if(bad){failed++;console.error('FAIL '+file+'\n'+(error?error.message+'\n':'')+stdout+stderr)}
  else console.log('ok   '+file);
  resolve();
 });
})}}
Promise.all(Array.from({length:3},worker)).then(()=>{console.log(failed?`${failed} suite(s) failed`:`all ${files.length} suites passed (legacy smoke checks + regression assertions)`);process.exitCode=failed?1:0});
