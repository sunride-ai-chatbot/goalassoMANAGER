const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message)});
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'..','ligat-haal-manager.html'),'utf8'),{url:'https://goalasso.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.__ilmNoSplash=1;w.__ilmUnlock=1;w.matchMedia=()=>({matches:true})}});
const w=dom.window,$=s=>w.document.querySelector(s),click=s=>{assert.ok($(s),s);$(s).click()};
async function main(){try{
 for(const s of ['[data-pick="mnt"]','#signBtn','[data-sponsor="0"]','[data-board="none"]'])click(s);
 w.eval("G.pressMode='off';G.motion='off';G.paperPop=[];me().money=50000000;window.target=G.clubs.find(c=>c.id==='mta').players.find(p=>fullName(p)==='דור פרץ');startNegotiation(window.target.id);window.n=G.negs[0]");
 assert.ok(w.target,'Dor Peretz exists');
 click('#askLoan');
 const fee=w.n.loanAsk,value=w.eval('marketValue(window.target)');
 assert.ok(fee>=value*.09&&fee<=value*.11,'Loan quote is about 10% of value');
 assert.equal(+$('#fee').value,fee);assert.equal($('#inst'),null);assert.equal($('#sellon'),null);
 assert.match($('#sendClub').textContent,/השאלה/);
 // A low-budget attempt remains a loan and does not spend anything.
 w.eval('me().money=1');click('#sendClub');assert.equal(w.n.stage,'club');assert.equal(w.n.loanRequest,true);assert.equal(w.ILM.me().money,1);
 w.eval('me().money=50000000;window.n.loanAvailable=true');
 // A low loan offer gets a loan counter, never the full sale asking price.
 $('#fee').value='0';click('#sendClub');assert.equal(w.n.stage,'club');assert.equal(w.n.loanCounter,fee);assert.match($('#useCounter').parentElement.textContent,/המועדון/);
 click('#useCounter');click('#sendClub');assert.equal(w.n.stage,'player');assert.equal(w.n.offer.fee,fee);assert.equal(w.n.offer.sellon,0);assert.equal(w.n.offer.inst,1);
 assert.equal($('#years').options.length,1);assert.equal(w.n.pdemand.bonus,0);
 $('#wage').value=w.n.pdemand.wage*2;click('#sendPlayer');assert.equal(w.n.stage,'review');
 assert.match($('#modal').textContent,/דמי השאלה לעונה/);assert.match($('#modal').textContent,/אופציית רכישה \(לא לתשלום עכשיו\)/);
 const before=w.ILM.me().money,agent=Math.round(fee*.05/1e4)*1e4,buy=w.n.loan.buy;
 click('#confirmSign');assert.equal(w.n.stage,'done');assert.equal(before-w.ILM.me().money,fee+agent,'Only loan fee and agent fee charged now');
 assert.equal(w.target.loan.buy,buy);assert.equal(w.target.contract,1);assert.ok(w.ILM.me().players.includes(w.target));assert.ok(!(w.ILM.G.payables||[]).length);
 // Refusal persists in the loan flow; purchase requires an explicit click.
 w.eval("closeModal();me().players=me().players.slice(0,24);window.other=G.clubs.find(c=>c.id==='mta').players.find(p=>marketValue(p)<=25e6);startNegotiation(window.other.id);window.n2=G.negs[0]");
 click('#askLoan');w.n2.loanAvailable=false;click('#sendClub');assert.equal(w.n2.loanRefused,true);assert.equal(w.n2.loanRequest,true);assert.equal($('#sendClub').disabled,true);assert.equal($('#inst'),null);
 w.eval('closeModal();negModal(window.n2.id)');assert.equal($('#sendClub').disabled,true);assert.match($('#modal').textContent,/לא נשלחה הצעת רכישה/);
 click('#switchPurchase');assert.equal(w.n2.loanRequest,false);assert.ok($('#inst'));assert.match($('#sendClub').textContent,/רכישה/);
 // Old saved negotiations with a loan request reopen in the loan flow.
 w.eval('window.n2.loanAsked=true;delete window.n2.loanRequest;closeModal();negModal(window.n2.id)');assert.equal(w.n2.loanRequest,true);assert.equal($('#inst'),null);
 assert.deepEqual(errors,[]);console.log('loan pricing, counters, refusal, legacy state and actual budget debit passed');
}finally{await new Promise(resolve=>setImmediate(resolve));w.close()}}
main().catch(e=>{console.error(e);process.exitCode=1});
