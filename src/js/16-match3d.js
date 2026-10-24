/* Optional presentation only. Never pass G/M/player objects to the renderer.
   The event cursor and playback state live here, outside career persistence. */
const Match3D = (() => {
  const freeze = value => {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  };
  function snapshot(M, h, a) {
    const colors = matchColors(h, a);
    return freeze({minute:M.m, home:M.h, away:M.a, score:[M.gh,M.ga],
      players:[h,a].flatMap((c,side) => {
        // Group by actual playing slot: substituted players are appended to M.xi.
        const xi = [...M.xi[c.id]].sort((x,y) => ['GK','DF','MF','FW'].indexOf(x.slot)-['GK','DF','MF','FW'].indexOf(y.slot));
        const cols = side ? colors.a : colors.h;
        return xi.map((e,i) => {
          const p = c.players.find(p => p.id === e.pid);
          const group = xi.filter(x => x.slot === e.slot), n = group.indexOf(e);
          const depth = {GK:4,DF:22,MF:36,FW:47}[e.slot] || 30;
          const x = side ? 105-depth : depth, y = e.slot === 'GK' ? 34 : 10+48*(n+1)/(group.length+1);
          return {pid:e.pid,team:c.id,side,slot:e.slot,name:p?fullName(p):'',number:p?.no||i+1,
            x:x-52.5,z:y-34,kit:cols.fill,trim:cols.stroke};
        });
      })});
  }
  function adapt(e, index, before, after) {
    if (!e || !Number.isFinite(e.m)) return null;
    const outcome = e.t === 'goal' || e.t === 'pen' ? 'goal' : e.t === 'shot' ? ({save:'save',off:'miss',post:'post'})[e.sub] : null;
    if (!outcome || ![after.home,after.away].includes(e.team) || !Array.isArray(e.path) || e.path.length < 2 || e.path.length > 8) return null;
    if (!e.path.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0]>=0 && p[0]<=108 && p[1]>=0 && p[1]<=68)) return null;
    const roster = before || after, shooter = roster.players.find(p => p.pid === e.pid && p.team === e.team);
    if (!shooter) return null; // Old/incomplete events remain in the existing commentary.
    const direction = (e.team === after.home ? 1 : -1) * (e.m > 45 ? -1 : 1);
    const flip = e.m > 45 ? -1 : 1;
    return freeze({id:index,minute:e.m,outcome,team:e.team,shooter:e.pid,
      keeper:e.gk ?? roster.players.find(p => p.team !== e.team && p.slot === 'GK')?.pid ?? null,
      name:shooter.name,keeperName:e.sub==='save'?e.name:'',direction,score:[...after.score],
      path:e.path.map(([x,y]) => ({x:(x-52.5)*direction,z:(y-34)*direction})),
      players:roster.players.map(p => ({...p,x:p.x*flip,z:p.z*flip}))});
  }
  let active = null;
  function stop() { if (active) active.dispose(); active = null; }
  function mount(M,h,a,options={}) {
    stop();
    const root = document.getElementById('match3d');
    if (!root) return null;
    const toggle=root.querySelector('[data-m3-toggle]'), panel=root.querySelector('[data-m3-panel]'), status=root.querySelector('[data-m3-status]');
    // Network recordings do not yet retain the authoritative starting XI/slots.
    // Do not illustrate them using the current squad reconstructed by mpPlayback.
    if (M.playback) {
      toggle.disabled=true;
      status.textContent='תלת־ממד זמין כרגע במשחקי קריירה מקומיים';
      return null;
    }
    const arena=()=>document.getElementById('arena');
    let view=null, enabled=false, dead=false, token=0, cursor=M.ev.length, before=null, latest=snapshot(M,h,a), paused=false;
    const safe = action => { try { return action(); } catch(e) { fallback(); } };
    const release = () => { token++; enabled=false; safeDestroy(); panel.hidden=true; if(arena())arena().hidden=false; toggle.setAttribute('aria-pressed','false'); toggle.textContent='תלת־ממד ניסיוני'; };
    const safeDestroy = () => { const old=view; view=null; try { old?.dispose(); } catch(e) {} };
    const fallback = () => { release(); status.textContent='התלת־ממד לא זמין כרגע. המשחק ממשיך בתצוגה הרגילה.'; };
    toggle.onclick=async()=>{
      if(enabled){release();status.textContent='תצוגה רגילה';return;}
      enabled=true;const id=++token;cursor=M.ev.length;before=null;
      status.textContent='טוען את המגרש…';toggle.textContent='חזרה לתצוגה רגילה';toggle.setAttribute('aria-pressed','true');
      // Loading never holds the match. The token also makes late imports harmless.
      try {
        const module=await import('./assets/demo3d/live.js');
        if(dead||!enabled||id!==token||!root.isConnected)return;
        panel.hidden=false;
        view=module.createLiveView(panel,{onError:fallback});
        if(dead||!enabled){safeDestroy();return;}
        latest=snapshot(M,h,a);view.sync(latest);view.setPaused(paused);cursor=M.ev.length;
        if(arena())arena().hidden=true;
        status.textContent='המחשה של אירועי המשחק · תנועה משוערת, דמויות כלליות';
      } catch(e) { if(!dead&&id===token)fallback(); }
    };
    const api={
      get enabled(){return !!view&&enabled;},
      get busy(){return !!safe(()=>view?.busy);},
      beforeStep(){before=view?snapshot(M,h,a):null;},
      update(){
        if(dead)return;
        if(!root.isConnected){api.dispose();return;}
        if(!view){cursor=M.ev.length;before=null;return;}
        latest=snapshot(M,h,a);
        const clips=[];
        while(cursor<M.ev.length){const i=cursor++;const clip=adapt(M.ev[i],i,before||latest,latest);if(clip)clips.push(clip);}
        before=null;safe(()=>{view.sync(latest);view.enqueue(clips);});
      },
      setPaused(value){paused=!!value;safe(()=>view?.setPaused(paused));},
      dispose(){if(dead)return;dead=true;release();toggle.onclick=null;if(active===api)active=null;},
      get diagnostics(){return safe(()=>view?.diagnostics)||null;}
    };
    active=api;return api;
  }
  function html(){return `<section id="match3d" class="match3d" aria-label="תצוגת משחק"><div class="m3-switch"><button type="button" data-m3-toggle aria-pressed="false">תלת־ממד ניסיוני</button><span data-m3-status role="status">המחשת מצבים מהמשחק</span></div><div data-m3-panel hidden></div></section>`;}
  window.addEventListener('pagehide',stop);
  return {snapshot,adapt,mount,stop,html,get active(){return active;}};
})();
