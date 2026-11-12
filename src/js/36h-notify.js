/* ====================== NOTIFICATIONS (opt-in, per device) ======================
   Only for things that really happened while the game sits in a background tab or as an installed home-screen app:
   the other manager in a network game is ready, the week was played, a friend joined the room. Nothing is scheduled and
   no server pushes anything: when the game is closed, nothing arrives. The choice is kept in localStorage
   (goalasso_notify), asked only when the player switches it on in the settings.
   sw.js (assets/sw.js, served beside the page) shows the notification and brings the game forward when it is tapped;
   it caches nothing and handles no requests. */
let swReg=null;
function notifySupported(){return typeof window!=='undefined'&&typeof Notification!=='undefined'}
function notifyPref(){try{return localStorage.getItem('goalasso_notify')==='1'}catch(e){return false}}
function notifyState(){if(!notifySupported())return 'unsupported';if(Notification.permission==='denied')return 'denied';return Notification.permission==='granted'&&notifyPref()?'on':'off'}
function notifyRegister(){if(swReg)return Promise.resolve(swReg);if(typeof navigator==='undefined'||!navigator.serviceWorker||typeof location==='undefined'||!/^https?:$/.test(location.protocol))return Promise.resolve(null);
  return navigator.serviceWorker.register('sw.js').then(r=>{swReg=r;return r}).catch(()=>null)}
function notifySet(on){const done=()=>{if(G&&!G.blitz)render()};try{localStorage.setItem('goalasso_notify',on?'1':'0')}catch(e){}
  if(!on||!notifySupported())return done();
  let ask;try{ask=Notification.permission==='granted'?Promise.resolve('granted'):Promise.resolve(Notification.requestPermission())}catch(e){ask=Promise.resolve('denied')}
  ask.then(p=>{if(p==='granted'){notifyRegister();toast('התראות יגיעו כשהמשחק פתוח ברקע')}else{try{localStorage.setItem('goalasso_notify','0')}catch(e){}toast('הדפדפן לא אישר התראות')}done()},done)}
function notify(title,body,tag){try{if(notifyState()!=='on'||typeof document==='undefined'||!document.hidden)return false;
  const opt={body,tag:tag||'goalasso',icon:'assets/icons/goalasso-180-v1.png',badge:'assets/icons/goalasso-32-v1.png',lang:'he',dir:'rtl'};
  notifyRegister().then(r=>{if(r&&r.showNotification)return r.showNotification(title,opt);new Notification(title,opt)}).catch(()=>{try{new Notification(title,opt)}catch(e){}});return true}catch(e){return false}}
/* network game (35b): the other manager became ready while it is still my turn */
function mpNotifyReady(wasReady,other,meReady){if(other&&other.ready&&!wasReady&&!meReady)notify('היריב מוכן',`${other.name||'המאמן השני'} סיים להתכונן. נשאר רק לסגור את ההרכב שלך.`,'mp-ready')}
/* invitation friendlies (35c): a friend joined, became ready, or the match was played */
function roomNotify(prev,st){if(!prev||!st)return;const n=(st.members||[]).length,pn=(prev.members||[]).length;
  if(n>pn)return notify('חבר הצטרף לחדר','אפשר לסמן שאתם מוכנים ולהתחיל.','room');if(st.result&&!prev.result)return notify('משחק הרשת שוחק','התוצאה מחכה לך.','room');
  const o=(st.members||[]).find(m=>!m.mine),po=(prev.members||[]).find(m=>!m.mine);if(o&&o.ready&&po&&!po.ready)notify('החבר מוכן','מחכים רק לך.','room')}
try{if(typeof window!=='undefined')window.addEventListener('load',()=>{if(notifyState()==='on')notifyRegister()})}catch(e){}
