/* ====================== WEEKLY TRAINING PLAN ======================
   Five sessions a week. The plan is applied once, when the week is processed: changing it repeatedly does nothing extra. */
const SESS={tech:{he:'טכניקה',load:2,desc:'התפתחות כללית של השחקנים'},att:{he:'התקפה',load:2,desc:'חלוצים וקשרים מתפתחים מהר יותר'},def:{he:'הגנה',load:2,desc:'מגנים ושוערים מתפתחים מהר יותר'},
  tac:{he:'טקטיקה',load:1.5,desc:'היכרות טקטית: בונוס כוח במשחקים'},fit:{he:'כושר',load:3,desc:'מאגר כושר: פחות שחיקה ופציעות בהמשך, עייפות השבוע'},rec:{he:'התאוששות',load:.5,desc:'כושר גופני חוזר מהר, פצועים חוזרים מהר'},
  prep:{he:'הכנה ליריבה',load:1,desc:'בונוס למשחק הבא בלבד'},youth:{he:'שילוב נוער',load:1,desc:'הנוער מתפתח מהר יותר'},off:{he:'מנוחה',load:0,desc:'מורל והתאוששות, בלי התפתחות'}};
const DAYS=['ראשון','שני','שלישי','רביעי','חמישי'];
const PLAN_PRESETS={bal:{he:'מאוזן',d:['tech','tac','fit','prep','rec']},dev:{he:'פיתוח',d:['tech','att','def','tech','rec']},big:{he:'לפני משחק גדול',d:['tac','tac','rec','prep','off']},fit:{he:'בניית כושר',d:['fit','tech','fit','tac','rec']},rec:{he:'שבוע עמוס',d:['rec','tac','rec','prep','off']},youth:{he:'נוער',d:['youth','tech','youth','tac','rec']}};
function planOf(c){if(!c.plan||c.plan.length!==5)c.plan=PLAN_PRESETS.bal.d.slice();if(c.tacFam==null)c.tacFam=60;if(c.cond==null)c.cond=60;return c.plan}
function planFx(c){const d=planOf(c);const n=k=>d.filter(x=>x===k).length;const load=d.reduce((t,k)=>t+(SESS[k]?SESS[k].load:0),0);
  return {load,n,dev:clamp(.78+.16*n('tech')+.06*(n('att')+n('def'))+.04*n('tac')+(load>9?.06:0),.5,1.6),att:n('att'),def:n('def'),
    rec:-(load-6)*1.6+4*n('rec')+3*n('off'),inj:clamp(Math.pow(Math.max(.3,load/7),1.7),.25,3.2),tac:5*n('tac')-4,cond:5*n('fit')-3,prep:n('prep')>0,youth:1+.3*n('youth'),morale:n('off')-(load>10?1:0)}}
function planIntensity(load){return load<=5?'low':load<=9?'mid':'high'}
function applyTrainingWeek(c){const fx=planFx(c);c.intensity=planIntensity(fx.load);
  c.tacFam=clamp(c.tacFam+fx.tac,10,100);c.cond=clamp(c.cond+fx.cond,10,100);c.prepLeft=fx.prep?1:0;
  if(fx.morale)for(const p of c.players)p.morale=clamp((p.morale??65)+fx.morale,0,100);
  c.trainRep={wk:G.wk,s:G.season,load:fx.load,tac:c.tacFam,cond:c.cond};return fx}
function trainBonus(c){if(!c||c.id!==G.me||c.tacFam==null)return 0;return (c.tacFam-60)/40*1.5+(c.prepLeft?1.2:0)}
function riskWord(m){return m<.6?'נמוך':m<1.1?'רגיל':m<1.8?'גבוה':'גבוה מאוד'}
function trainingPlanHTML(c){const d=planOf(c);const fx=planFx(c);const loadN=Math.round(clamp(fx.load/15*10,0,10));
  return `<div class="card"><div class="row between wrap"><h3 class="sec">תוכנית אימונים שבועית</h3><span class="tag ${fx.load>10?'bad':fx.load>8?'warn':'good'}">עומס ${fx.load.toFixed(1)}</span></div>
  <div class="muted tiny" style="margin:4px 0 8px">התוכנית מופעלת פעם אחת בסוף כל שבוע. שינוי שלה לא נותן בונוס מיידי.</div>
  <div class="tabs" style="flex-wrap:wrap">${Object.entries(PLAN_PRESETS).map(([k,v])=>`<button data-plpre="${k}" class="${d.join()===v.d.join()?'on':''}">${v.he}</button>`).join('')}</div>
  <div class="trd">${d.map((k,i)=>`<label class="trrow"><span class="trday">${DAYS[i]}</span><select data-plday="${i}">${Object.entries(SESS).map(([sk,s])=>`<option value="${sk}" ${sk===k?'selected':''}>${s.he}</option>`).join('')}</select><span class="muted tiny trdesc">${esc(SESS[k].desc)}</span></label>`).join('')}</div>
  <div class="trfx"><div><small>עומס השבוע</small>${meter10(100-loadN*10,'fit').replace(/כושר [0-9]+%/g,'עומס')}</div><div><small>סיכון פציעה</small><b>${riskWord(fx.inj)}</b></div><div><small>קצב התפתחות</small><b class="num"><bdi dir="ltr">x${fx.dev.toFixed(2)}</bdi></b></div><div><small>כושר גופני בשבוע</small><b class="num"><bdi dir="ltr">${fx.rec>=0?'+':''}${Math.round(fx.rec)}</bdi></b></div></div>
  <div class="trbars"><div><small>היכרות טקטית</small><div class="bar"><i style="width:${Math.round(c.tacFam)}%"></i></div><span class="num tiny">${Math.round(c.tacFam)}</span></div><div><small>מאגר כושר</small><div class="bar"><i style="width:${Math.round(c.cond)}%"></i></div><span class="num tiny">${Math.round(c.cond)}</span></div></div>
  <div class="muted tiny" style="margin-top:6px">היכרות טקטית גבוהה מוסיפה עד 1.5 נקודות כוח במשחקים, ונמוכה מורידה. החלפת מערך מורידה אותה. "הכנה ליריבה" מוסיפה 1.2 למשחק הבא בלבד.${c.trainRep?` · שבוע אחרון: עומס ${c.trainRep.load.toFixed(1)}`:''}</div></div>`}

