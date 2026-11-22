function Bdefs(){return [...Object.keys(META).map(id=>({key:id,name:RAW.find(r=>r.id===id)?.name_he||FALLBACK[id].name,country:'ישראל',c1:RAW.find(r=>r.id===id)?.colors?.[0]||'#254baf',c2:'#fff'})),...EURO_CLUBS.map((d,i)=>({key:'eu'+i,name:d[0],country:d[1],c1:d[4],c2:d[5]}))]}

function BcatBase(){if(BcatBase.c)return BcatBase.c;const base=Bdefs().map(d=>Object.assign({},d,{str:d.key.startsWith('eu')?EURO_CLUBS[+d.key.slice(2)][6]:(LSTR[d.key]||60)}));const il=base.filter(d=>d.country==='ישראל'),eu=base.filter(d=>d.country!=='ישראל');
  const W=(k,withCountry)=>{const L=WORLD_LEAGUES[k];const out=[];if(!L)return out;for(const c of L.clubs){const e=eu.find(x=>x.name===c[0]);if(e)out.push(e);else if(RAW_EURO[c[0]]&&RAW_EURO[c[0]].length>=14)out.push({key:'w:'+k+':'+c[0],name:c[0],country:c[6]||L.country,c1:c[2],c2:c[3],str:c[4],def:[c[0],c[6]||L.country,c[1],'',c[2],c[3],c[4]]})}
    if(withCountry)for(const e of eu)if(e.country===withCountry&&!out.includes(e))out.push(e);return out.sort((a,b)=>b.str-a.str)};
  const alef=lg=>(typeof RAW_ALEF!=='undefined'?RAW_ALEF:[]).filter(a=>a[4]===lg).map(a=>({key:'a:'+a[0],name:a[0],country:'ישראל',city:a[1],c1:a[2],c2:a[3],str:52}));
  const C=[{id:'il',name:'ישראל',leagues:[{id:'il1',name:'ליגת העל',tier:1,clubs:il},{id:'il2',name:'ליגה לאומית',tier:2,clubs:LEUMIT16.map(d=>({key:'l:'+d.id,name:d.name,country:'ישראל',c1:d.c1,c2:d.c2,str:d.str||55}))},{id:'il3n',name:'ליגה א׳ צפון',tier:3,clubs:alef('alef_north')},{id:'il3s',name:'ליגה א׳ דרום',tier:3,clubs:alef('alef_south')}]},
    {id:'en',name:'אנגליה',leagues:[{id:'en1',name:'פרמייר ליג',tier:1,clubs:W('epl','אנגליה')},{id:'en2',name:'צ׳מפיונשיפ',tier:2,clubs:W('champ')}]},
    {id:'es',name:'ספרד',leagues:[{id:'es1',name:'לה ליגה',tier:1,clubs:W('laliga','ספרד')},{id:'es2',name:'לה ליגה 2',tier:2,clubs:W('segunda')}]},
    {id:'it',name:'איטליה',leagues:[{id:'it1',name:'סרייה א׳',tier:1,clubs:W('seriea','איטליה')}]},
    {id:'de',name:'גרמניה',leagues:[{id:'de1',name:'בונדסליגה',tier:1,clubs:W('bundes','גרמניה')}]},
    {id:'fr',name:'צרפת',leagues:[{id:'fr1',name:'ליג 1',tier:1,clubs:W('ligue1','צרפת')}]},
    {id:'nl',name:'הולנד',leagues:[{id:'nl1',name:'ארדיוויזי',tier:1,clubs:W('eredivisie','הולנד')}]},
    {id:'pt',name:'פורטוגל',leagues:[{id:'pt1',name:'ליגת פורטוגל',tier:1,clubs:W('portugal','פורטוגל')}]},
    {id:'be',name:'בלגיה',leagues:[{id:'be1',name:'ליגת בלגיה',tier:1,clubs:W('belgium','בלגיה')}]}];
  for(const c of C)c.leagues=c.leagues.filter(l=>l.clubs.length>=6);BcatBase.c=C.filter(c=>c.leagues.length);
  /* the Champions League as a league of its own: the strongest clubs of the continent, at most four of one country. It stands
     last, so a club is always found in its own country's league first (BcatFind) */
  const per={},best=[];for(const {x,c} of BcatBase.c.flatMap(c=>c.leagues.filter(l=>l.tier===1).flatMap(l=>l.clubs.map(x=>({x,c})))).sort((a,b)=>b.x.str-a.x.str)){if(best.length>=BCL_N)break;if(best.includes(x)||(per[c.id]||0)>=4)continue;per[c.id]=(per[c.id]||0)+1;best.push(x)}
  if(best.length>=8)BcatBase.c.push({id:'cl',name:'אירופה',cup:true,leagues:[{id:'cl1',name:'ליגת האלופות',tier:0,cup:true,clubs:best}]});return BcatBase.c}

const BCL_N=16;

const LSTR={mta:70,hta:69,mhf:69,hbs:70,bje:67,hhf:64,hje:63,mnt:64,mpt:61,bsk:61,hpt:61,hrg:59,iks:59,itb:59};

function Bflag(id){const R=(x,y,w,h,f)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`,V=(a,b,c)=>R(0,0,12,24,a)+R(12,0,12,24,b)+R(24,0,12,24,c),H=(a,b,c)=>R(0,0,36,8,a)+R(0,8,36,8,b)+R(0,16,36,8,c);
  const F={il:R(0,0,36,24,'#fff')+R(0,3,36,3.4,'#0038b8')+R(0,17.6,36,3.4,'#0038b8')+'<path d="M18 7.6l3.5 6h-7zM18 16.4l-3.5-6h7z" fill="none" stroke="#0038b8" stroke-width="1.1"/>',
    en:R(0,0,36,24,'#fff')+R(15,0,6,24,'#ce1124')+R(0,9,36,6,'#ce1124'),es:R(0,0,36,24,'#aa151b')+R(0,6,36,12,'#f1bf00'),it:V('#009246','#fff','#ce2b37'),de:H('#111','#dd0000','#ffce00'),fr:V('#0055a4','#fff','#ef4135'),
    nl:H('#ae1c28','#fff','#21468b'),pt:R(0,0,14.4,24,'#046a38')+R(14.4,0,21.6,24,'#da291c')+'<circle cx="14.4" cy="12" r="4.4" fill="#ffe900" stroke="#fff" stroke-width=".6"/>',be:V('#111','#fae042','#ed2939')};
  return `<svg class="bflag" viewBox="0 0 36 24" aria-hidden="true">${F[id]||R(0,0,36,24,'#33475b')}</svg>`}