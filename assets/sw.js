// GOALASSO service worker: shows the notifications the open game asks for and brings the game forward when one is
// tapped. It caches nothing and handles no requests, so it can never serve an old build.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',e=>{e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs)if('focus' in c)return c.focus();if(self.clients.openWindow)return self.clients.openWindow('./')}))});
