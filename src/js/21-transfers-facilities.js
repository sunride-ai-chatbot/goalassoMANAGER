/* ====================== TRANSFERS / FACILITIES ====================== */
function askingPrice(p){return Math.round(p.value*1.15/1e4)*1e4}
function buyPlayer(fromId,pid){
  const from=club(fromId),c=me();if(!from||from===c)return;const p=from.players.find(x=>x.id===pid);if(!p||p.loan)return;
  if(!WINDOW(G.wk))return toast('חלון ההעברות סגור');
  if(c.players.length>=30)return toast('הסגל מלא (30 שחקנים)');
  if(from.league&&from.players.length<=17)return toast(`${from.short} מסרבת למכור, הסגל שלה קטן מדי`);
  const price=askingPrice(p);if(c.money<price)return toast('אין מספיק תקציב');
  c.money-=price;from.money+=price;from.players=from.players.filter(x=>x!==p);p.form=0;p.contract=3;p.wage=Math.round(playerWage(p)*1.15/500)*500;finalize(p);c.players.push(p);addLog(`רכישת ${fullName(p)}`,-price);
  news(`${fullName(p)} הצטרף מ${from.short} תמורת ${NIS(price)}.`);p.morale=72;p.fit=100;signingStory(p,c,from,price);autoLineups();save();recordSigning(p,c,'perm',{from:from.short,fee:price});render();
}
function sellPlayer(pid){
  const c=me();const p=c.players.find(x=>x.id===pid);if(!p)return;if(p.loan)return toast('שחקן מושאל, אי אפשר למכור');
  if(!WINDOW(G.wk))return toast('חלון ההעברות סגור');
  if(c.players.length<=16)return toast('אי אפשר לרדת מתחת ל-16 שחקנים');
  const fee=Math.round(p.value*.8/1e4)*1e4;const buyer=pick([...G.clubs,...(p.ovr<64?G.leumit:[])].filter(x=>x.id!==G.me&&x.players.length<28&&Number.isFinite(x.money)&&x.money>=fee));if(!buyer)return toast('אין כרגע קבוצה שיכולה לממן את הרכישה');p.contract=Math.max(p.contract,2);
  c.players=c.players.filter(x=>x!==p);if(c.lineup)c.lineup=c.lineup.map(id=>id===p.id?null:id);if(c.captain===p.id)c.captain=null;let net=fee;if(p.sellon){const cut=Math.round(fee*p.sellon.pct/100);net-=cut;addLog(`${p.sellon.pct}% ל${p.sellon.to}`,-cut);p.sellon=null}c.money+=net;buyer.players.push(p);buyer.money-=fee;addLog(`מכירת ${fullName(p)}`,fee);
  news(`${fullName(p)} נמכר ל${buyer.short} תמורת ${NIS(fee)}.`);saleStory(p,c,buyer,fee);toast('נמכר');closeModal();autoLineups();save();render();
}
function promoteYouth(pid){const c=me();const y=c.youth.find(x=>x.id===pid);if(!y)return;if(c.players.length>=30)return toast('הסגל מלא');c.youth=c.youth.filter(x=>x!==y);y.contract=3;y.wage=playerWage(y);c.players.push(y);news(`${fullName(y)} (${y.age}) הועלה מהנוער לקבוצה הבוגרת בחוזה ל-3 שנים.`);y.morale=78;if(y.pot>=76)paper('מועדון',`כישרון חדש: ${fullName(y)} הועלה לבוגרים`,`${POSHE[y.pos]} בן ${y.age} עם פוטנציאל גבוה`,`באקדמיה של ${c.name} מדברים עליו כבר שנתיים. ${pick(['המנג\'ר רוצה לתת לו דקות כבר העונה.','האוהדים מסמנים אותו כעתיד.','הסקאוטים מאירופה כבר שאלו עליו.'])}`);toast('הועלה לבוגרים');save();render()}
function signFreeAgent(pid){const c=me();const p=G.freeAgents.find(x=>x.id===pid);if(!p)return;
  if(!WINDOW(G.wk))return toast('חלון ההעברות סגור');if(c.players.length>=30)return toast('הסגל מלא');
  const d=contractDemand(p);if(c.money<d.bonus)return toast('אין מספיק תקציב לבונוס החתימה');
  c.money-=d.bonus;p.wage=d.wage;p.contract=Math.max(1,d.years);p.form=0;finalize(p);G.freeAgents=G.freeAgents.filter(x=>x!==p);c.players.push(p);addLog(`בונוס חתימה ${fullName(p)}`,-d.bonus);
  news(`${fullName(p)} חתם כשחקן חופשי ל-${p.contract} שנים, ${NIS(p.wage)} לשבוע.`);p.morale=70;p.fit=85;signingStory(p,c,null,0);autoLineups();save();recordSigning(p,c,'free');render()}
function renewContract(pid){const c=me();const p=c.players.find(x=>x.id===pid);if(!p)return;const d=contractDemand(p);
  if(c.money<d.bonus)return toast('אין מספיק תקציב לבונוס החתימה');if(p.contract>=5)return toast('החוזה כבר ארוך מספיק');
  c.money-=d.bonus;p.wage=d.wage;p.contract=Math.min(5,(p.contract||0)+d.years);finalize(p);addLog(`הארכת חוזה ${fullName(p)}`,-d.bonus);news(`${fullName(p)} האריך חוזה עד ${contractYear(p)} (${NIS(p.wage)} לשבוע).`);p.morale=clamp((p.morale??65)+10,10,100);if(c.players.slice().sort((a,b)=>b.value-a.value).slice(0,5).includes(p))paper('מועדון',`${fullName(p)} נשאר ב${c.name} עד ${contractYear(p)}`,`שכר חדש: ${NIS(p.wage)} לשבוע`,`${fullName(p)} חתם על הארכת חוזה. ${pick(['במועדון רואים בו עמוד תווך לשנים הבאות.','ההנהלה הרגיעה את האוהדים שחששו ממכירה.','הסוכן שלו: "הוא רוצה להישאר ולנצח כאן".'])}`);toast('החוזה הוארך');closeModal();save();render()}
function upgradeAcademy(){const c=me();const cost=ACAD_COST[c.academy];if(c.academy>=5)return toast('האקדמיה ברמה המקסימלית');if(c.money<cost)return toast('אין מספיק תקציב');c.money-=cost;c.academy++;addLog('שדרוג אקדמיית הנוער',-cost);toast('האקדמיה שודרגה לרמה '+c.academy);save();render()}
function scoutYouth(){const c=me();const cost=1.5e6;if(c.money<cost)return toast('אין מספיק תקציב');if(c.youth.length>=10)return toast('מחלקת הנוער מלאה');c.money-=cost;const y=makeYouth(1)[0];y.pot=clamp(y.pot+c.academy*2,50,94);c.youth.push(y);addLog('סקאוטינג נוער',-cost);toast(`הסקאוט הביא את ${fullName(y)}`);save();render()}
function startStadium(add){const c=me();if(c.build)return toast('יש כבר פרויקט בבנייה');if(c.cap+add>45000)return toast('הקיבולת המקסימלית היא 45,000');const cost=add*9000;if(c.money<cost)return toast('אין מספיק תקציב');c.money-=cost;c.build={type:'stadium',add,weeks:add<=2000?6:add<=5000?10:16};addLog(`הרחבת אצטדיון (+${add.toLocaleString('he')})`,-cost);news(`התחילו עבודות הרחבה ב${c.stadium}: ${c.build.weeks} שבועות, בינתיים 70% מהקיבולת זמינה.`);paper('מועדון',`${c.name} מרחיבה את ${c.stadium}`,`${add.toLocaleString('he')} מקומות נוספים בעלות ${NIS(cost)}`,`העבודות יימשכו ${c.build.weeks} שבועות ובמהלכן יהיו פתוחים רק 70% מהיציעים. ${pick(['ההנהלה: "הביקוש לכרטיסים מצדיק את ההשקעה".','האוהדים מבקשים גם יציע עומד.','העירייה אישרה את התוכניות בלי התנגדויות.'])}`);save();render()}
function startTraining(){const c=me();if(c.build)return toast('יש כבר פרויקט בבנייה');if(c.training>=5)return toast('מגרש האימונים ברמה המקסימלית');const cost=TRAIN_COST[c.training];if(c.money<cost)return toast('אין מספיק תקציב');c.money-=cost;c.build={type:'training',level:c.training+1,weeks:5};addLog('שדרוג מגרש אימונים',-cost);news(`שדרוג מגרש האימונים לרמה ${c.training+1} יימשך 5 שבועות.`);save();render()}
function setFormation(f){const c=me();c.formation=f;c.lineup=null;ensureLineup(c);save();render()}
function setMentality(m){me().mentality=m;save();render()}
function autoPick(){const c=me();c.lineup=autoLineupFor(c);lineupSel=null;save();render()}
function chooseSponsor(i){const c=me();const o=G.sponsorOffers[i];c.sponsor={...o};news(`${c.name} חתמה עם ${o.name} על חסות של ${NIS(o.annual)} לעונה (${o.years} ${o.years>1?'עונות':'עונה'}).`);sponsorStory(c,o);G.sponsorOffers=null;G.phase='board';G.view='home';save();render()}

