/* ====================== SHARED LEAGUE · the appointment ======================
   "We play at nine." A round has no clock of its own; the host may give it one (`lg_kickoff`). It is an appointment
   and not a gate: the match can be played before it and after it. What the time does is count down on every phone
   and remind five minutes before.

   Friends may sit in different countries. The moment is one instant; each phone shows it on its own clock, the
   picker shows what it is on everybody else's, and an instant that falls between midnight and seven in the morning
   for any manager is refused — here, so that the host sees whose night it is, and on the server, so that a changed
   page cannot set it anyway.

   The reminder has two forms, because a web page has no push server. A notification from the page itself arrives
   while the game is open or resting in the background (`notify`, 36h); a closed page cannot be woken. So the card
   also offers a calendar entry with its own five-minute alarm (`lgIcs`), which the phone rings whether the game is
   open or not, in whatever time zone the phone is in. */
const LG_NIGHT=7,LG_WARN=5*60e3,LG_WARNED='goalasso.league.warned';
Object.assign(LG_ERR,{bad_time:'השעה צריכה להיות בעתיד, ועד שבועיים מהיום.',night:'אצל אחד המנהלים זה אמצע הלילה. בחר שעה אחרת.',invalid_tz:'אזור הזמן של הטלפון לא זוהה.'});
const lgKickOK=()=>!!(LG.state&&('kickoff' in LG.state));
const lgTzMine=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){return ''}};
const lgTzOf=m=>m?(m.mine?lgTzMine()||m.tz:m.tz)||'':'';
function lgHourIn(t,tz){try{return +new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',hourCycle:'h23'}).format(new Date(t))%24}catch(e){return null}}
function lgClockIn(t,tz){try{return new Intl.DateTimeFormat('en-GB',Object.assign({hour:'2-digit',minute:'2-digit',hourCycle:'h23'},tz?{timeZone:tz}:{})).format(new Date(t))}catch(e){return ''}}
/* the managers for whom this instant is the night */
function lgAsleep(t){return ((LG.state&&LG.state.members)||[]).filter(m=>{const tz=lgTzOf(m);if(!tz)return false;const h=lgHourIn(t,tz);return h!=null&&h<LG_NIGHT})}
const lgDayKey=(t,tz)=>{try{return new Intl.DateTimeFormat('en-CA',Object.assign({year:'numeric',month:'2-digit',day:'2-digit'},tz?{timeZone:tz}:{})).format(new Date(t))}catch(e){return ''}};
function lgWhen(t,tz){const now=Date.now(),k=lgDayKey(t,tz),clock=`<bdi>${lgClockIn(t,tz)}</bdi>`;
  if(k===lgDayKey(now,tz))return `היום ב־${clock}`;if(k===lgDayKey(now+864e5,tz))return `מחר ב־${clock}`;
  let day='';try{day=new Intl.DateTimeFormat('he-IL',Object.assign({weekday:'long',day:'numeric',month:'numeric'},tz?{timeZone:tz}:{})).format(new Date(t))}catch(e){}
  return `${esc(day)} ב־${clock}`}
function lgCountText(ms){if(ms<=0)return 'משחקים עכשיו';const s=Math.ceil(ms/1000),d=Math.floor(s/86400),p=n=>String(n).padStart(2,'0');
  if(d>=2)return `בעוד ${d} ימים`;return `בעוד ${Math.floor(s/3600)}:${p(Math.floor(s%3600/60))}:${p(s%60)}`}
const lgKickAt=()=>{const k=lgKickOK()&&LG.state.phase==='season'&&LG.state.kickoff;const t=k?Date.parse(k):NaN;return isFinite(t)?t:0};
function lgMyOpp(){const s=LG.state,f=s&&(s.fixtures||[]).find(x=>x.round===s.round&&(x.home===s.me||x.away===s.me));return f?lgMember(f.home===s.me?f.away:f.home):null}

/* ---- the calendar entry: the reminder that needs neither this page nor a server ---- */
function lgIcs(){const s=LG.state,t=lgKickAt();if(!t)return '';const me=lgMe(),opp=lgMyOpp();
  const z=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,''),x=v=>String(v||'').replace(/[\\;,]/g,m=>'\\'+m).replace(/\r?\n/g,'\\n');
  let url='';try{url=location.origin+location.pathname}catch(e){}
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GOALASSO//League//HE','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
   `UID:${s.id}-s${s.season}r${s.round}@goalasso`,`DTSTAMP:${z(Date.now())}`,`DTSTART:${z(t)}`,`DTEND:${z(t+30*60e3)}`,
   `SUMMARY:${x('GOALASSO · '+(opp?`${me?me.team:''} נגד ${opp.team}`:s.name))}`,`DESCRIPTION:${x(`${s.name} · מחזור ${s.round}`)}`,url?`URL:${url}`:'',
   'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${x('עוד 5 דקות משחקים')}`,'TRIGGER:-PT5M','END:VALARM','END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n')+'\r\n'}

/* ---- the card on the board ---- */
function lgLocalInput(t){const d=new Date(t),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`}
function lgKickChips(){const now=Date.now(),at=(h,plus)=>{const d=new Date(now+(plus||0)*864e5);d.setHours(h,0,0,0);return d.getTime()},eve=at(21)>now+60e3?at(21):0;
  return [['בעוד 10 דקות',now+10*60e3],['בעוד חצי שעה',now+30*60e3],['בעוד שעה',now+60*60e3],eve?['הערב ב־21:00',eve]:null,['מחר ב־21:00',at(21,1)]].filter(Boolean)}
/* what the chosen instant is on everybody's clock, and whether it may be set */
function lgKickCheckHTML(){const k=LG.kick,t=k&&k.t;if(!t||!isFinite(t))return '<p class="lg-note">בחר שעה.</p>';
  if(t<Date.now()+60e3)return '<p class="lg-note k-bad">השעה הזו כבר עברה.</p>';
  const mine=lgTzMine(),asleep=lgAsleep(t),others=LG.state.members.filter(m=>!m.mine&&lgTzOf(m)&&lgClockIn(t,lgTzOf(m))!==lgClockIn(t,mine));
  return `<p class="k-pick"><span>${lgWhen(t)}</span> <small>${lgCountText(t-Date.now())}</small></p>
   ${others.length?`<ul class="k-zones">${others.map(m=>`<li class="${asleep.includes(m)?'k-bad':''}"><b>${esc(m.team)}</b><span>${lgWhen(t,lgTzOf(m))}</span></li>`).join('')}</ul>`:''}
   ${asleep.length?`<p class="lg-note k-bad">אצל ${asleep.map(m=>esc(m.team)).join(', ')} זה אמצע הלילה. בחר שעה אחרת.</p>`:''}
   <button type="button" class="btn lg-wide" data-lg="kick-set"${asleep.length?' disabled':''}>קבע את השעה</button>`}
function lgKickHTML(){const s=LG.state;if(!lgKickOK()||s.phase!=='season'||!s.fixtures.some(f=>f.round===s.round&&!f.played))return '';
  const t=lgKickAt();
  if(LG.kick&&s.host)return `<div class="lg-card lg-kick"><h3>מתי משחקים?</h3>
    <div class="lg-part">${lgKickChips().map(([l,v])=>`<button type="button" class="lg-chip${Math.abs(v-LG.kick.t)<30e3?' on':''}" data-lg="kick-chip" data-v="${v}">${l}</button>`).join('')}</div>
    <label>או שעה אחרת<input type="datetime-local" data-lg-input="kick" value="${LG.kick.t?lgLocalInput(LG.kick.t):''}" min="${lgLocalInput(Date.now())}"></label>
    <div id="lg-kick-check">${lgKickCheckHTML()}</div>
    <button type="button" class="btn sec lg-wide" data-lg="kick-cancel">חזרה</button>
    <p class="lg-note">השעה היא תיאום ולא נעילה: אפשר לשחק גם לפניה ואחריה. כל מנהל רואה אותה בשעון שלו.</p></div>`;
  if(!t)return s.host?`<div class="lg-card lg-kick"><h3>מתי משחקים?</h3><p class="lg-note">קבע שעה למחזור: כולם יראו ספירה לאחור ויקבלו תזכורת חמש דקות לפני.</p><button type="button" class="btn sec lg-wide" data-lg="kick-open">קבע שעת משחק</button></div>`:'';
  const on=notifyState()==='on',mine=lgTzMine(),others=s.members.filter(m=>!m.mine&&lgTzOf(m)&&lgClockIn(t,lgTzOf(m))!==lgClockIn(t,mine));
  return `<div class="lg-card lg-kick"><h3>שריקת הפתיחה</h3>
    <p class="k-pick"><span>${lgWhen(t)}</span> <b id="lg-count" class="k-count" aria-live="off">${lgCountText(t-Date.now())}</b></p>
    ${others.length?`<ul class="k-zones">${others.map(m=>`<li><b>${esc(m.team)}</b><span>${lgWhen(t,lgTzOf(m))}</span></li>`).join('')}</ul>`:''}
    <div class="lg-actions">${t>Date.now()?`<button type="button" class="btn${on?' sec':''}" data-lg="kick-remind"${on?' disabled':''}>${on?'התזכורת פעילה':'הזכר לי 5 דקות לפני'}</button><button type="button" class="btn sec" data-lg="kick-ics">הוסף ליומן</button>`:''}
     ${s.host?`<button type="button" class="btn sec" data-lg="kick-open">שנה שעה</button><button type="button" class="btn sec" data-lg="kick-clear">בטל שעה</button>`:''}</div>
    ${t>Date.now()?'<p class="lg-note">התזכורת מגיעה כשהמשחק פתוח או ברקע. כדי שהטלפון יצלצל גם כשהוא סגור, הוסף את המשחק ליומן.</p>':''}</div>`}

/* ---- the clock: one ticker while a league with an appointment is open ---- */
function lgWarned(k){try{return localStorage.getItem(LG_WARNED)===k}catch(e){return LG.warned===k}}
function lgWarn(k){LG.warned=k;try{localStorage.setItem(LG_WARNED,k)}catch(e){}}
function lgKickTick(){const t=lgKickAt();if(!t||!LG.root){clearInterval(LG.kickTimer);LG.kickTimer=null;return}
  const left=t-Date.now(),el=document.getElementById('lg-count');if(el)el.textContent=lgCountText(left);
  const s=LG.state,opp=lgMyOpp(),k=s.id+':'+s.kickoff,body=`${s.name} · מחזור ${s.round}${opp?' · נגד '+opp.team:''}`;
  if(left<=LG_WARN&&left>0&&!lgWarned(k+':5')&&!lgWarned(k+':0')){lgWarn(k+':5');const m=Math.max(1,Math.ceil(left/60e3)),title=m===1?'עוד דקה משחקים':`עוד ${m} דקות משחקים`;
   if(!notify(title,body,'lg-kick')){if(LG.view!=='match')lgMsg(title+'.');try{buzz('tap')}catch(e){}}}
  else if(left<=0&&left>-60e3&&!lgWarned(k+':0')){lgWarn(k+':0');if(!notify('משחקים עכשיו',body,'lg-kick')&&LG.view==='home')lgPaint()}}
/* called after every load of the league: tell the server this phone's time zone once, and keep the ticker alive */
function lgKickSync(){if(!lgKickOK())return;const me=lgMe(),tz=lgTzMine();
  if(me&&tz&&me.tz!==tz&&LG.tzSent!==tz){LG.tzSent=tz;lgRpc('lg_tz',{p_league:lgSaved(),p_tz:tz}).catch(()=>{})}
  if(lgKickAt()){if(!LG.kickTimer)LG.kickTimer=setInterval(lgKickTick,1000)}else{clearInterval(LG.kickTimer);LG.kickTimer=null}
  if(LG.kick&&!LG.state.host)LG.kick=null}

LG_ACT['kick-open']=Object.assign(()=>{const t=lgKickAt();LG.kick={t:t>Date.now()?t:0};LG.keepScroll=true;lgPaint()},{quick:true});
LG_ACT['kick-cancel']=Object.assign(()=>{LG.kick=null;LG.keepScroll=true;lgPaint()},{quick:true});
LG_ACT['kick-chip']=Object.assign(btn=>{if(!LG.kick)return;LG.kick.t=+btn.dataset.v;LG.keepScroll=true;lgPaint()},{quick:true});
LG_ACT['input:kick']=el=>{if(!LG.kick)return;const t=el.value?new Date(el.value).getTime():0;LG.kick.t=isFinite(t)?t:0;const c=document.getElementById('lg-kick-check');if(c)c.innerHTML=lgKickCheckHTML()};
LG_ACT['kick-set']=async(btn,gen)=>{const t=LG.kick&&LG.kick.t;if(!t)return;if(lgAsleep(t).length){lgMsg(LG_ERR.night);return}
  await lgRpc('lg_kickoff',{p_league:lgSaved(),p_at:new Date(t).toISOString()});if(gen!==LG.gen)return;LG.kick=null;LG.keepScroll=true;await lgReload();lgMsg('השעה נקבעה. כל המנהלים יראו אותה בשעון שלהם.')};
LG_ACT['kick-clear']=async(btn,gen)=>{await lgRpc('lg_kickoff',{p_league:lgSaved(),p_at:null});if(gen!==LG.gen)return;LG.keepScroll=true;await lgReload();lgMsg('השעה בוטלה.')};
LG_ACT['kick-remind']=Object.assign(()=>{const done=m=>{LG.keepScroll=true;lgPaint();lgMsg(m)};
  if(!notifySupported()){lgMsg('הדפדפן הזה לא מציג התראות. "הוסף ליומן" יזכיר לך בכל מקרה.');return}
  let ask;try{ask=Notification.permission==='granted'?Promise.resolve('granted'):Promise.resolve(Notification.requestPermission())}catch(e){ask=Promise.resolve('denied')}
  ask.then(p=>{if(p==='granted'){try{localStorage.setItem('goalasso_notify','1')}catch(e){}notifyRegister();done('תזכורת תגיע חמש דקות לפני, כל עוד המשחק פתוח או ברקע.')}
   else done('הדפדפן לא אישר התראות. "הוסף ליומן" יזכיר לך בכל מקרה.')},()=>done('הדפדפן לא אישר התראות.'))},{quick:true});
LG_ACT['kick-ics']=Object.assign(()=>{const ics=lgIcs();if(!ics)return;
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));a.download='goalasso-match.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>{try{URL.revokeObjectURL(a.href)}catch(e){}},4000);
   lgMsg('פתח את הקובץ כדי להוסיף את המשחק ליומן. ההתראה מוגדרת לחמש דקות לפני.')}
  catch(e){lgMsg('לא הצלחנו ליצור קובץ יומן בדפדפן הזה.')}},{quick:true});
