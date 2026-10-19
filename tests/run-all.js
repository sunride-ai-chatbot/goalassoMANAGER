// Runs every *.test.js headless suite (jsdom) against the built ligat-haal-manager.html.
const {execFileSync}=require('child_process');const fs=require('fs');const path=require('path');
const files=fs.readdirSync(__dirname).filter(f=>f.endsWith('.test.js')).sort();let failed=0;
for(const f of files){try{const out=execFileSync(process.execPath,[path.join(__dirname,f)],{encoding:'utf8',timeout:600000,stdio:['ignore','pipe','pipe']});const last=out.trim().split('\n').slice(-1)[0];const bad=/errors \[(?!\])|errs \[(?!\])/.test(last);if(bad)failed++;console.log((bad?'FAIL ':'ok   ')+f+'  '+last.slice(0,120))}catch(e){failed++;console.log('FAIL '+f+'  '+String(e.message).split('\n')[0])}}
console.log(failed?`${failed} suite(s) failed`:'all suites passed');process.exit(failed?1:0);
