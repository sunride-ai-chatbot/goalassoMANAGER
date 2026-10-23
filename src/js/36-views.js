/* ---- 3D lineup: stadium photo pitch, FIFA-style cards, fitness + morale meters ---- */
const STADIUM_IMG={webp:'lineup-stadium.webp',jpg:'lineup-stadium.jpg',w:941,h:1672,px0:12.86,px1:87.14,py0:10.29,py1:83.25};
function meter10(v,kind){const n=Math.round(clamp(v,0,100)/10);const lab=kind==='fit'?`כושר ${Math.round(v)}%`:`מורל ${moraleWord(v)} (${Math.round(v)})`;
  const icon=kind==='fit'?`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.2 1.5 3.5 9h3.6l-1 5.5L12.5 7H8.8z" fill="currentColor"/></svg>`
    :(()=>{const mood=v>=70?'M5 9.6q3 2.6 6 0':v>=45?'M5.2 10.4h5.6':'M5 11.2q3-2.6 6 0';return `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="5.8" cy="6.4" r="1" fill="currentColor"/><circle cx="10.2" cy="6.4" r="1" fill="currentColor"/><path d="${mood}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`})();
  const hue=Math.round(clamp(v,0,100)*1.2);
  return `<span class="m10" role="img" aria-label="${lab}" title="${lab}"><i class="m10i" style="color:hsl(${hue} 85% 55%)">${icon}</i><span class="m10b">${Array.from({length:10},(_,i)=>`<b class="${i<n?'on':''}" style="--h:${i*12}"></b>`).join('')}</span></span>`}
function fifaCardHTML(p,c){const t=tierClass(p.ovr);const known=isKnown(p);const ovr=known?p.ovr:shownOvr(p);
  return `<div class="fc ${t}${known?'':' unk'}"><div class="fc-face"><div class="fc-top"><b class="fc-ovr">${ovr}</b><span class="fc-pos">${POSB[p.pos]}</span></div><div class="fc-kit">${shirtSVG(c,p.no,'fc'+p.id)}</div><div class="fc-name">${esc(p.last||p.first)}</div></div><span class="fc-shine"></span></div>`}
// A shared projection keeps the graphic and all interactive slots aligned.
function lineupProject(x,y){const t=clamp(y/100,0,1);return [50+(x-50)*(.76+.24*t),17+76*t]}
function lineupSceneSVG(c){
 const pt=(x,y)=>lineupProject(x,y).map(v=>(v*10).toFixed(1)).join(',');
 const poly=points=>points.map(([x,y])=>pt(x,y)).join(' ');
 const box=(x,y,w,h)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
 const ellipse=(cx,cy,rx,ry)=>poly(Array.from({length:65},(_,i)=>{const a=i*Math.PI/32;return [cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]}));
 const stripes=Array.from({length:12},(_,i)=>`<polygon points="${box(5,i*100/12,90,100/12)}" fill="${i%2?'#23794e':'#1b6944'}"/>`).join('');
 const rows=Array.from({length:8},(_,i)=>`<path d="M${55+i*9} ${56+i*11}H${945-i*9}" stroke="#7a99a2" stroke-opacity=".18" stroke-width="3"/>`).join('');
 return `<svg class="stad-scene" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><defs>
 <linearGradient id="luNight" x2="0" y2="1"><stop stop-color="#172b42"/><stop offset="1" stop-color="#050d16"/></linearGradient>
 <radialGradient id="luGlow"><stop stop-color="#e0ffff" stop-opacity=".65"/><stop offset="1" stop-color="#c6faff" stop-opacity="0"/></radialGradient>
 <radialGradient id="luTurf"><stop stop-color="#8ae89b" stop-opacity=".18"/><stop offset="1" stop-color="#001d18" stop-opacity=".55"/></radialGradient>
 <pattern id="luCrowd" width="19" height="14" patternUnits="userSpaceOnUse"><rect width="19" height="14" fill="#182a36"/><circle cx="4" cy="5" r="2" fill="${esc(c.c1)}"/><circle cx="13" cy="10" r="2.3" fill="#bbd1cc" opacity=".65"/><path d="M2 9h5m4 5h5" stroke="#6d8b9b" stroke-width="3"/></pattern>
 </defs><rect width="1000" height="1000" fill="url(#luNight)"/>
 <path d="M35 38H965L911 145H89Z M20 65L95 160 30 936 0 970Z M980 65L905 160 970 936 1000 970Z" fill="url(#luCrowd)"/>
 ${rows}<path d="M40 34H960M90 148H910" stroke="#89a5b2" stroke-opacity=".4" stroke-width="4"/>
 <polygon points="${box(1,-3,98,107)}" fill="#102e2b"/><polygon points="${box(4,1,92,101)}" fill="#000" opacity=".45" transform="translate(0 8)"/>
 ${stripes}<polygon points="${box(5,0,90,100)}" fill="url(#luTurf)"/>
 <g fill="none" stroke="#d5f8df" stroke-opacity=".62" stroke-width="2"><polygon points="${box(5,0,90,100)}"/><polyline points="${poly([[5,50],[95,50]])}"/><polygon points="${ellipse(50,50,13,9)}"/><polygon points="${box(24,0,52,16)}"/><polygon points="${box(38,0,24,6)}"/><polygon points="${box(24,84,52,16)}"/><polygon points="${box(38,94,24,6)}"/></g>
 <g fill="#e3ffee"><circle cx="500" cy="550" r="3"/></g>
 <g fill="#bce4de22" stroke="#d7f5ef" stroke-width="2"><path d="M450 168v-18h100v18M450 150l-7 16h114l-7-16"/><path d="M433 930v22h134v-22M433 952l-8-17h150l-8 17"/></g>
 <g stroke="#b6ebff" stroke-width="5"><path d="M48 46h130M822 46h130"/></g><ellipse cx="115" cy="48" rx="160" ry="105" fill="url(#luGlow)"/><ellipse cx="885" cy="48" rx="160" ry="105" fill="url(#luGlow)"/>
 <path d="M60 50L390 600 550 900 175 50M940 50L610 600 450 900 825 50" fill="#c8faff" opacity=".025"/>
 <path d="M0 985Q500 945 1000 985" stroke="${esc(c.c1)}" stroke-width="18" opacity=".65"/><path d="M0 972Q500 932 1000 972" stroke="#8aa5b5" stroke-width="3" opacity=".5"/>
 </svg>`}
// Stable identity belongs to the player. Kit and contract belong to the current club.
// Portrait crops are measured source-photo coordinates, not generated likenesses.
let legacyVisualIds=null;
function legacyVisualMap(){if(legacyVisualIds)return legacyVisualIds;const out={};let id=1;
 for(const cid of Object.keys(META)){const raw=RAW.find(r=>r.id===cid);if(!raw)continue;const counts={GK:0,DF:0,MF:0,FW:0};let youth=0;
  for(const r of raw.players){if(r.ft_only&&(r.age==null||r.age>21))continue;out[id++]=r.he;if(r.ft_only&&r.age<=19)youth++;else counts[r.pos]++}
  for(const pos of POS)id+=Math.max(0,({GK:2,DF:6,MF:6,FW:3})[pos]-counts[pos]);id+=Math.max(0,7-youth)}
 return legacyVisualIds=out}
function playerVisualId(p){if(!p)return null;
 // European squad players carry an `en` field (fromRawEuro) and are never matched by Hebrew name: Celtic's ז'וטה is not
 // Hapoel Ramat Gan's ז'וטה. Their face comes from the club + English name map; careers saved before the European packs
 // existed stored visualId:null, so a missing or stale id is resolved again instead of being trusted.
 if(Object.prototype.hasOwnProperty.call(p,'en')&&p.en){if(p.visualId&&PLAYER_VISUALS.faces[p.visualId])return p.visualId;
  const k=euroVisualIdFor(p);if(k)p.visualId=k;return k}
 if(Object.prototype.hasOwnProperty.call(p,'visualId'))return PLAYER_VISUALS.faces[p.visualId]?p.visualId:null;
 const name=fullName(p);const key=(p.real||legacyVisualMap()[p.id]===name)?PLAYER_VISUALS.names[name]:null;
 p.visualId=key||null;return p.visualId}
/* Portraits: every face is a canonical 240×300 transparent cut-out produced offline by scripts/build-portraits.py
   (eye line at 36%, same face size for everyone, the whole head always inside the frame, torso fading out at the
   bottom). The game never crops or rescales a face at runtime: every surface shows the same frame, either complete
   (lineup figure, 0 0 240 300) or its top 264 px (cards, lists, bench, live chips). Faces marked unresolved in the
   audit, generated players and failed downloads all show the same designed fallback: club kit + monogram. */
function playerVisual(p){const f=PLAYER_VISUALS.faces[playerVisualId(p)];return f&&f.status==='ok'?f:null}
const facePackCache=new Map(),facePackRequests=new Map(),facePackFailures=new Map(),facePackCredits=new Map();
function portraitState(f,key){if(!f)return 'none';if(facePackCache.get(f.pack)?.[key])return 'ready';return facePackFailures.has(f.pack)?'failed':'loading'}
function loadFacePack(pack){if(facePackCache.has(pack)||facePackRequests.has(pack)||typeof fetch!=='function'||Date.now()-(facePackFailures.get(pack)||0)<10000)return;
 const settle=(images)=>{if(typeof document==='undefined'||!document)return;document.querySelectorAll('.pp[data-pack="'+pack+'"]').forEach(g=>{const key=g.getAttribute('data-visual-id');const src=images&&images[key];const img=g.querySelector('.pp-photo');
   if(src&&img){img.setAttribute('href',src);g.setAttribute('data-pp-state','ready')}else g.setAttribute('data-pp-state','failed')})};
 const request=fetch('assets/facepacks/'+encodeURIComponent(pack)+'.json').then(r=>{if(!r.ok)throw new Error('portrait_pack');return r.json()}).then(data=>{
  if(data.schema!==2||!data.images||typeof data.images!=='object')throw new Error('portrait_format');
  const images={};for(const [key,value] of Object.entries(data.images)){if(PLAYER_VISUALS.faces[key]?.pack===pack&&typeof value==='string'&&/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(value))images[key]=value}
  facePackCache.set(pack,images);facePackFailures.delete(pack);settle(images);
  const cr={};for(const [k,v] of Object.entries(data.credits||{}))if(images[k]&&v&&typeof v==='object')cr[k]={a:String(v.a||'').slice(0,120),l:String(v.l||'').slice(0,40),u:/^https:\/\/commons\.wikimedia\.org\//.test(v.u||'')?v.u:''};
  facePackCredits.set(pack,cr);if(typeof document!=='undefined'&&document)document.querySelectorAll('.pp-credit[data-pack="'+pack+'"]').forEach(el=>{el.outerHTML=portraitCreditHTML(null,el.getAttribute('data-visual-id'),pack)});
 }).catch(()=>{facePackFailures.set(pack,Date.now());settle(null)}).finally(()=>facePackRequests.delete(pack));facePackRequests.set(pack,request)}
/* photo credit line (Wikimedia Commons, CC BY / BY-SA need visible attribution); empty for federation photos */
function portraitCreditHTML(p,vk,pack){if(p){const f=playerVisual(p);if(!f)return '';vk=playerVisualId(p);pack=f.pack}if(!pack||!/^eu-/.test(pack))return '';
 const c=facePackCredits.get(pack)?.[vk];if(!c){loadFacePack(pack);return `<div class="pp-credit muted tiny" data-pack="${esc(pack)}" data-visual-id="${esc(vk)}"></div>`}
 return `<div class="pp-credit muted tiny" style="margin-top:4px">תמונה: <bdi>${esc(c.a)}</bdi> · <bdi>${esc(c.l)}</bdi> · ויקישיתוף${c.u?` · <a href="${esc(c.u)}" target="_blank" rel="noopener noreferrer">מקור</a>`:''}</div>`}
function portraitInitials(p){const a=String(p.first||'').trim(),b=String(p.last||'').trim();return (a.slice(0,1)+(b&&b!==a?b.slice(0,1):'')).trim()||'?'}
function portraitColors(p,c){c=c||{};const kit=p.pos==='GK'?'#159263':(c.c1||'#26384a');const trim=c.c2||'#d2deed';return {kit,trim:colDist(kit,trim)<60?inkFor(kit):trim}}
/* the portrait group, in canonical frame units (240 wide); `h` = visible height (264 for busts, 300 for the full frame) */
function portraitGroup(p,c,id,o){o=o||{};const f=playerVisual(p),key=playerVisualId(p);const src=f?facePackCache.get(f.pack)?.[key]:null;if(f&&!src)loadFacePack(f.pack);
 const {kit,trim}=portraitColors(p,c);const ink=inkFor(kit);const h=o.h||264;
 const bg=o.bg===false?'':`<defs><radialGradient id="${id}bg" cx="50%" cy="34%" r="72%"><stop offset="0" stop-color="${esc(kit)}" stop-opacity=".62"/><stop offset="1" stop-color="${esc(kit)}" stop-opacity=".08"/></radialGradient></defs><rect width="240" height="${h}" fill="#0b1520"/><rect width="240" height="${h}" fill="url(#${id}bg)"/>`;
 const fb=`<g class="pp-fb"><path d="M14 ${h}V${h-30}Q20 ${h-66} 80 ${h-80}L120 ${h-58}L160 ${h-80}Q220 ${h-66} 226 ${h-30}V${h}Z" fill="${esc(kit)}"/><path d="M80 ${h-80}L120 ${h-58}L160 ${h-80}" fill="none" stroke="${esc(trim)}" stroke-width="9" stroke-linejoin="round"/><circle cx="120" cy="${h*.4}" r="${h*.22}" fill="${esc(kit)}" stroke="${esc(trim)}" stroke-width="7"/><text x="120" y="${h*.4}" dy=".36em" text-anchor="middle" font-family="Heebo,Arial,sans-serif" font-weight="800" font-size="${h*.2}" fill="${ink}">${esc(portraitInitials(p))}</text></g>`;
 const kitG=f&&!f.bust?`<g class="pp-kit"><path d="M108 150H132V196H108Z" fill="${esc(f.skin||'#c99a7c')}"/><path d="M14 ${h}V${h-26}Q22 ${h-62} 84 ${h-74}L120 ${h-52}L156 ${h-74}Q218 ${h-62} 226 ${h-26}V${h}Z" fill="${esc(kit)}"/><path d="M84 ${h-74}L120 ${h-52}L156 ${h-74}" fill="none" stroke="${esc(trim)}" stroke-width="8" stroke-linejoin="round"/></g>`:'';
 const photo=f?`<image class="pp-photo" ${src?`href="${src}"`:''} x="0" y="0" width="240" height="300" preserveAspectRatio="xMidYMin meet" onerror="var g=this.closest('.pp');if(g)g.setAttribute('data-pp-state','failed')"/>`:'';
 return `<g class="pp" data-pp-state="${portraitState(f,key)}"${f?` data-pack="${esc(f.pack)}" data-visual-id="${esc(key)}"`:''}>${bg}${kitG}${photo}${fb}</g>`}
function playerPortraitHTML(p,c,key){c=c||playerClub(p)||{c1:'#26384a',c2:'#d2deed'};const id='pp'+String(key||p.id).replace(/[^a-zA-Z0-9]/g,'');
 return `<span class="player-portrait" aria-hidden="true" data-portrait="${playerVisual(p)?playerVisualId(p):'fallback'}"><svg viewBox="0 0 240 264" preserveAspectRatio="xMidYMin slice">${portraitGroup(p,c,id)}</svg></span>`}
function playerClub(p){if(!G)return null;return [...G.clubs,...G.leumit,...Object.values(G.pseudo||{}),...Object.values(G.world||{}).flatMap(l=>l.clubs||[])].find(c=>c.players.includes(p)||(c.youth||[]).includes(p))||null}
/* Lineup figure: illustrated kit body (club colours + sponsor) with the player's real head. The cut-out is placed by the
   canonical frame (eye line, chin) and clipped just below the chin, so hair and ears are always complete. */
const CINE_HEAD={x:262,y:-115,w:500,h:625},CINE_NECK='M120 -260H904V238H560V266H464V238H120Z';
function cinematicPlayerHTML(c,p,key){const f=playerVisual(p),gk=p.pos==='GK',color=gk?'#159263':c.c1;const rgb=hexRGB(color);const id='cineKit'+String(key).replace(/[^a-zA-Z0-9]/g,'');const brand=sponsorName(c);const vk=playerVisualId(p);const skin=(f&&f.skin)||['#c5987b','#98694e','#d4ac91','#77533e'][p.id%4];
 const tone=hexRGB(skin).map(v=>v/255);const jersey='M440 229Q512 283 586 229L658 270Q700 290 712 340L734 452L654 469L635 390L642 579L658 720Q512 735 367 721L390 579L379 392L369 470L289 456L307 354Q316 298 355 275Z';
 const src=f?facePackCache.get(f.pack)?.[vk]:null;if(f&&!src)loadFacePack(f.pack);const {trim}=portraitColors(p,c);
 const head=`<g class="pp" data-pp-state="${portraitState(f,vk)}"${f?` data-pack="${esc(f.pack)}" data-visual-id="${esc(vk)}"`:''}>${f?`<g clip-path="url(#${id}neck)"><image class="pp-photo" ${src?`href="${src}"`:''} x="${CINE_HEAD.x}" y="${CINE_HEAD.y}" width="${CINE_HEAD.w}" height="${CINE_HEAD.h}" preserveAspectRatio="xMidYMin meet" onerror="var g=this.closest('.pp');if(g)g.setAttribute('data-pp-state','failed')"/></g>`:''}<g class="pp-fb"><circle cx="512" cy="118" r="104" fill="${esc(color)}" stroke="${esc(trim)}" stroke-width="16"/><text x="512" y="118" dy=".36em" text-anchor="middle" font-family="Heebo,Arial,sans-serif" font-weight="800" font-size="92" fill="${inkFor(color)}">${esc(portraitInitials(p))}</text></g></g>`;
 return `<span class="player-figure" aria-hidden="true" data-player-visual="${f?vk:'fallback'}"><svg viewBox="0 0 1024 1536"><defs><clipPath id="${id}neck"><path d="${CINE_NECK}"/></clipPath><clipPath id="${id}clip"><path d="${jersey}"/></clipPath><clipPath id="${id}skin"><path d="M284 450L370 468L327 680L309 716L321 790L289 866L227 827L238 746Z M655 467L737 449L780 746L783 827L726 860L696 784L706 713L688 675Z M352 925L487 940L435 1054L345 1045Z M551 940L674 926L680 1046L596 1054Z"/></clipPath><filter id="${id}skinTint" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${tone[0]*.6} ${tone[0]*1.1} ${tone[0]*.3} 0 0 ${tone[1]*.6} ${tone[1]*1.1} ${tone[1]*.3} 0 0 ${tone[2]*.6} ${tone[2]*1.1} ${tone[2]*.3} 0 0 0 0 0 1 0"/></filter><clipPath id="${id}body"><rect x="0" y="250" width="1024" height="1286"/></clipPath><filter id="${id}tint" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${rgb[0]/255} 0 0 0 0 0 ${rgb[1]/255} 0 0 0 0 0 ${rgb[2]/255} 0 0 0 0 0 1 0"/></filter></defs>${head}<image href="assets/cinematic-player.webp" width="1024" height="1536" clip-path="url(#${id}body)"/><image href="assets/cinematic-player.webp" width="1024" height="1536" clip-path="url(#${id}clip)" filter="url(#${id}tint)"/><image href="assets/cinematic-player.webp" width="1024" height="1536" clip-path="url(#${id}skin)" filter="url(#${id}skinTint)"/><g clip-path="url(#${id}clip)" opacity=".85"><path d="M440 229Q512 283 586 229" fill="none" stroke="${esc(c.c2||'#17233b')}" stroke-width="23"/><path d="M309 438L374 452M651 452L722 438" stroke="${esc(c.c2||'#17233b')}" stroke-width="17"/></g><path d="M578 354l20 -9 20 9v24l-20 14-20-14z" fill="${esc(c.c2||'#16273b')}" opacity=".85"/>${brand?(sponsorLogoSVG(c.sponsor,392,450,240,66,'kit-contract-sponsor')||`<text class="kit-contract-sponsor" x="512" y="490" text-anchor="middle" direction="rtl" fill="${inkFor(color)}" font-family="Heebo,Arial,sans-serif" font-weight="900" font-size="37" textLength="225" lengthAdjust="spacingAndGlyphs">${esc(brand)}</text>`):''}</svg></span>`}
function token3dHTML(c,p,slot,i,o){const cls=['t3'];if(!p)cls.push('empty');if(o.sel)cls.push('sel');if(p&&(p.inj||p.susp))cls.push('bad');if(p&&p.pos!==slot)cls.push('oop');
 const X=50+(o.x-50)*1.02,Y=34+o.y*.58;
 return `<button type="button" class="${cls.join(' ')}" style="left:${X.toFixed(2)}%;top:${Y.toFixed(2)}%;z-index:${Math.round(Y)}" data-slot="${i}" aria-pressed="${!!o.sel}" aria-label="${p?esc(fullName(p))+', '+POSHE[p.pos]+', דירוג '+p.ovr+', כושר '+Math.round(p.fit??100)+'%':'מקום ריק, '+POSHE[slot]}"><span class="t3-in">${p?cinematicPlayerHTML(c,p,'slot'+i):'<span class="cine-empty">+</span>'}${p&&isCaptain(c,p)?'<span class="capb">C</span>':''}<span class="t3-nm"><span class="t3-nmt">${p?esc(p.last||p.first):POSHE[slot]}</span>${p?`<bdi class="cine-rating">${p.ovr}</bdi>`:''}</span></span></button>`}
function stadiumFieldHTML(c,slots,lay,ps,selSlot){return `<section class="stad" aria-label="מגרש בחירת הרכב"><div class="stad-pitch"><header class="cine-header"><span class="cine-brand"><svg viewBox="0 0 40 30" aria-hidden="true"><path d="M4 9l8 6L20 2l8 13 8-6-4 18H8z"/></svg>GOALASSO</span><h2>ההרכב שלך</h2><p>${esc(c.name)} · ${esc(c.stadium||'אצטדיון הבית')}</p><div class="cine-tools"><label><span class="hide">מערך</span><select id="formSel" aria-label="מערך">${Object.keys(FORMATIONS).map(f=>`<option ${f===c.formation?'selected':''}>${f}</option>`).join('')}</select></label><button type="button" id="cineTacticsBtn">טקטיקה ⚙</button></div></header>${slots.map((sl,i)=>token3dHTML(c,ps[i],sl,i,{x:lay[i].x,y:lay[i].y,sel:selSlot===i})).join('')}</div></section>`}
let lineupSel=null;
function pitchLines(){return `<svg class="lines" viewBox="0 0 100 133" preserveAspectRatio="none"><g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".7"><rect x="3" y="3" width="94" height="127" rx="1"/><line x1="3" y1="66.5" x2="97" y2="66.5"/><circle cx="50" cy="66.5" r="10"/><circle cx="50" cy="66.5" r=".9" fill="rgba(255,255,255,.6)"/><rect x="22" y="3" width="56" height="20"/><rect x="36" y="3" width="28" height="7"/><rect x="22" y="110" width="56" height="20"/><rect x="36" y="123" width="28" height="7"/><path d="M38 23 a12 12 0 0 0 24 0"/><path d="M38 110 a12 12 0 0 1 24 0"/></g></svg>`}
function tokenHTML(c,p,slot,i,opts){const cls=['tok'];if(!p)cls.push('empty');if(opts&&opts.sel)cls.push('sel');if(p&&(p.inj||p.susp))cls.push('bad');if(p&&p.pos!==slot)cls.push('oop');
  return `<div class="${cls.join(' ')}" style="left:${opts.x}%;top:${opts.y}%" data-slot="${i}" tabindex="0" role="button" aria-label="${p?esc(fullName(p)):'מקום ריק'}">${p?playerCardSVG(p,c,{k:'t'+i}):emptyCardSVG(slot)}${p&&isCaptain(c,p)?'<span class="capb">C</span>':''}<span class="nm">${p?esc(p.last||p.first):slot}</span>${p?`<span class="rl">${esc(ROLES[p.pos][roleOf(p)]||'')}</span>`:''}${p?`<span class="fitb ${fitClass(p.fit??100)}" style="--w:${Math.round(p.fit??100)}%" title="כושר גופני ${Math.round(p.fit??100)}%"></span>`:''}</div>`}
function emptyCardSVG(slot){return `<svg class="pc" viewBox="0 0 100 100" aria-hidden="true"><path d="M8 4 H92 Q96 4 96 8 V78 L50 96 L4 78 V8 Q4 4 8 4 Z" fill="rgba(10,17,32,.55)" stroke="rgba(255,255,255,.5)" stroke-dasharray="4 3" stroke-width="1.2"/><text x="50" y="52" text-anchor="middle" font-size="18" fill="#fff" opacity=".85">${slot}</text><text x="50" y="72" text-anchor="middle" font-size="9" fill="#fff" opacity=".7" class="nm">+</text></svg>`}
function miniPitch(c){const slots=slotsFor(c.formation);const lay=slotLayout(c.formation);const ps=lineupPlayers(c);
  return `<div class="field mini home-pitch">${pitchLines()}${slots.map((sl,i)=>tokenHTML(c,ps[i],sl,i,{x:lay[i].x,y:lay[i].y})).join('')}</div>`}
function viewLineup(){
  const c=me();ensureLineup(c);const slots=slotsFor(c.formation);const lay=slotLayout(c.formation);const ps=lineupPlayers(c);const probs=lineupProblems(c);
  const inXI=new Set(ps.filter(Boolean).map(p=>p.id));const benchAll=c.players.filter(p=>!inXI.has(p.id)).sort((a,b)=>POS.indexOf(a.pos)-POS.indexOf(b.pos)||b.ovr-a.ovr);
  const benchOk=benchAll.filter(p=>!p.inj&&!p.susp),benchOut=benchAll.filter(p=>p.inj||p.susp);
  const nm=myNextMatch();const selSlot=lineupSel&&lineupSel.slot!=null?lineupSel.slot:null;const selPid=lineupSel&&lineupSel.pid!=null?lineupSel.pid:null;
  const foreign=ps.filter(p=>p&&p.foreign).length;
  const hint=selSlot!=null?'עכשיו בחר שחקן מהספסל שייכנס במקומו, או עמדה אחרת כדי להחליף ביניהם':selPid!=null?'עכשיו לחץ על עמדה במגרש כדי להכניס אותו':'לחץ על שחקן במגרש או בספסל כדי להתחיל חילוף';
  const selP=selSlot!=null?ps[selSlot]:null;const capP=c.players.find(x=>x.id===c.captain);
  const opp=nm&&nm.a?(nm.h.id===G.me?nm.a:nm.h):null;
  const quickBench=benchAll;
  let html=`<div class="cinematic-lineup">
  ${stadiumFieldHTML(c,slots,lay,ps,selSlot)}
  <section class="cine-dock" aria-label="ספסל מחליפים"><h3>ספסל מחליפים · ${quickBench.length}</h3><p class="cine-hint" role="status">${selSlot!=null?`<strong>${ps[selSlot]?esc(fullName(ps[selSlot])):POSHE[slots[selSlot]]}</strong> נבחר · בחר מחליף`:selPid!=null?'בחר עמדה במגרש לשחקן שבחרת':'לחץ על שחקן במגרש ובחר לו מחליף'}</p><div class="cine-bench">${quickBench.map(p=>`<button type="button" class="cine-sub ${selPid===p.id?'sel':''}" data-bench="${p.id}" ${p.inj||p.susp?'disabled':''} aria-pressed="${selPid===p.id}" aria-label="${esc(fullName(p))}, ${POSHE[p.pos]}, דירוג ${p.ovr}${p.inj?', פצוע':p.susp?', מורחק':''}"><bdi class="cine-sub-rating">${p.ovr}</bdi><bdi class="cine-sub-pos">${POSB[p.pos]}</bdi><span class="cine-portrait">${playerPortraitHTML(p,c,'bench'+p.id)}</span><span class="cine-sub-name">${esc(fullName(p))}${p.inj?' · פצוע':p.susp?' · מורחק':''}</span></button>`).join('')||'<span class="muted small">כל השחקנים בהרכב</span>'}</div></section>
  <div class="cine-actions">${nm?'<button class="btn" id="playBtn">למשחק</button>':''}<button class="btn sec" id="autoBtn">הרכב אוטומטי</button></div>
  ${probs.length?`<div class="cine-status">${probs.map(esc).join(' · ')}</div>`:''}
  ${sponsorName(c)?`<div class="cine-sponsor">${sponsorLogoHTML(c.sponsor,'compact')}ספונסר החולצה <b>${esc(sponsorName(c))}</b></div>`:''}
  <details class="cine-details" id="cineTactics" ${selP?'open':''}><summary>טקטיקה והכנה למשחק</summary>
  <div class="card"><div class="row between wrap"><h2 style="font-size:21px">הכנה למשחק</h2>${nm?`<span class="tag info">${esc(nm.label)}</span>`:'<span class="tag">אין משחק השבוע</span>'}</div>
  ${nm&&nm.a?`<div class="muted small" style="margin-top:4px">${nm.h.id===G.me?`בית מול ${esc(nm.a.name)} (כוח ${Math.round(strength(nm.a))})`:`חוץ מול ${esc(nm.h.name)} (כוח ${Math.round(strength(nm.h))})`}</div>`:''}
  <div class="row wrap" style="margin-top:10px;gap:8px">
  <div class="mt" style="flex:1;min-width:180px"><button data-mt="def" class="${c.mentality==='def'?'on':''}">הגנתי</button><button data-mt="bal" class="${!c.mentality||c.mentality==='bal'?'on':''}">מאוזן</button><button data-mt="att" class="${c.mentality==='att'?'on':''}">התקפי</button></div></div>
  ${(()=>{const t=tacOf(c);const sel=(k)=>`<label class="small tacl">${{press:'לחץ',width:'רוחב',tempo:'קצב',style:'סגנון'}[k]}<select data-tac="${k}">${Object.keys(TAC[k]).map(v=>`<option value="${v}" ${t[k]===v?'selected':''}>${TAC[k][v]}</option>`).join('')}</select></label>`;
    return `<div class="tacs">${['press','width','tempo','style'].map(sel).join('')}</div><div class="muted tiny" style="margin-top:4px">${esc(TAC_DESC.press[t.press])} ${esc(TAC_DESC.style[t.style])}</div>`})()}
  ${selP?`<div class="row wrap" style="margin-top:8px;gap:8px"><span class="small">תפקיד ל${esc(selP.last||selP.first)}:</span><select data-role="${selP.id}">${Object.keys(ROLES[selP.pos]).map(r=>`<option value="${r}" ${roleOf(selP)===r?'selected':''}>${ROLES[selP.pos][r]}</option>`).join('')}</select><span class="tiny ${roleFit(selP)>=0?'muted':''}" style="${roleFit(selP)<0?'color:var(--warn)':''}">${roleFit(selP)>=.3?'מתאים מצוין':roleFit(selP)>=0?'מתאים':'לא מתאים לפרופיל שלו'}</span></div>`:''}
  <div class="muted small" style="margin:8px 0 2px">דירוג <b class="num">${Math.round(strength(c))}</b> · זרים <b class="num" style="color:${foreign>MAX_FOREIGN_XI?'var(--bad)':'inherit'}">${foreign}/${MAX_FOREIGN_XI}</b> · ${esc(hint)}</div>
  ${probs.length?`<div class="small" style="color:var(--warn)">⚠ ${probs.map(esc).join(' · ')}</div>`:''}
  <div class="row between wrap" style="margin-top:6px"><span class="small"><span class="tag cap">C</span> קפטן: <b>${capP?esc(fullName(capP)):'—'}</b>${capP&&!inXI.has(capP.id)?' <span class="muted tiny">(לא בהרכב)</span>':''}</span>${selP&&!isCaptain(c,selP)?`<button class="btn sm sec" data-captain="${selP.id}">מנה את ${esc(selP.last||selP.first)} לקפטן</button>`:''}</div>

  <div class="actions" style="margin-top:10px"><button class="btn sec" id="clearBtn">רוקן הרכב</button>${nm?'<button class="btn sec" id="skipBtn">תוצאה מיידית</button>':''}</div>
  ${opp?analystReportHTML(c,opp,nm):''}${chemCardHTML(c)}</div></details>
  <details class="cine-details"><summary>הסגל המלא · כושר ותפקידים</summary>
    <div class="card"><div class="row between"><h3 class="sec">ספסל · ${benchOk.length}</h3>${selSlot!=null?`<span class="tag info">מחפשים ${POSHE[slots[selSlot]]}</span>`:''}</div>
  ${(selSlot!=null?[slots[selSlot],...POS.filter(x=>x!==slots[selSlot])]:POS).map(pos=>{const grp=benchOk.filter(p=>p.pos===pos);if(!grp.length)return '';const hot=selSlot!=null&&slots[selSlot]===pos;return `<div class="muted tiny" style="margin:8px 0 4px;${hot?'color:var(--accent)':''}">${POSHE[pos]} (${grp.length})</div><div class="list">${grp.map(p=>playerRow(p,'',(selPid===p.id?'sel ':''),`<span class="it">גיל ${p.age}</span><span class="it">גופני <b class="num">${Math.round(p.fit??100)}%</b></span><span class="it">מורל ${moraleWord(p.morale??65)}</span>`).replace('data-pid','data-bench')).join('')}</div>`}).join('')||'<div class="muted small">כל השחקנים בהרכב</div>'}
  ${benchOut.length?`<div class="muted tiny" style="margin:10px 0 4px">לא זמינים (${benchOut.length})</div><div class="list">${benchOut.map(p=>playerRow(p,'','dim',`${POSHE[p.pos]} · ${p.inj?`פצוע, חוזר בעוד ${p.inj} ש'`:`מורחק ${p.susp} מש'`}`).replace('data-pid','data-bench')).join('')}</div>`:''}</div></details></div>`;
  return html;
}
function lineupTapSlot(i){const c=me();ensureLineup(c);
  if(lineupSel&&lineupSel.slot===i){lineupSel=null}
  else if(lineupSel&&lineupSel.slot!=null){const j=lineupSel.slot;[c.lineup[i],c.lineup[j]]=[c.lineup[j],c.lineup[i]];lineupSel=null}
  else if(lineupSel&&lineupSel.pid!=null){c.lineup[i]=lineupSel.pid;lineupSel=null}
  else lineupSel={slot:i};
  save();render()}
function lineupTapBench(pid){const c=me();ensureLineup(c);const p=c.players.find(x=>x.id===pid);if(!p)return;
  if(lineupSel&&lineupSel.pid===pid){lineupSel=null}
  else if(lineupSel&&lineupSel.slot!=null){if(p.inj||p.susp){toast(p.inj?'השחקן פצוע':'השחקן מורחק');return}c.lineup[lineupSel.slot]=pid;lineupSel=null}
  else{if(p.inj||p.susp){toast(p.inj?'השחקן פצוע, לא יכול לשחק':'השחקן מורחק למשחק הזה');return}lineupSel={pid}}
  save();render()}
let squadTab='all',squadSort='pos';
function viewSquad(){
  const c=me();
  if(squadTab==='youth')return viewYouth();
  let ps=c.players.slice();if(squadTab!=='all')ps=ps.filter(p=>p.pos===squadTab);
  ps.sort(squadSort==='pos'?(a,b)=>POS.indexOf(a.pos)-POS.indexOf(b.pos)||b.ovr-a.ovr:squadSort==='age'?(a,b)=>a.age-b.age:(a,b)=>b.value-a.value);
  const xi=new Set(bestXI(c).map(p=>p.id));
  return `<div class="card"><div class="row between"><h3 class="sec">הסגל · ${c.players.length} שחקנים</h3><span class="muted small">שכר/שבוע ${NIS(c.players.reduce((t,p)=>t+p.wage,0))}</span></div>
  <div class="tabs" style="margin-top:10px"><button data-st="all" class="${squadTab==='all'?'on':''}">הכל</button>${POS.map(p=>`<button data-st="${p}" class="${squadTab===p?'on':''}">${POSHE[p]}</button>`).join('')}<button data-st="youth">נוער (${c.youth.length})</button></div>
  <div class="tabs" style="margin-top:6px"><span class="muted tiny" style="align-self:center">מיון:</span><button data-ss="pos" class="${squadSort==='pos'?'on':''}">עמדה</button><button data-ss="value" class="${squadSort==='value'?'on':''}">שווי</button><button data-ss="age" class="${squadSort==='age'?'on':''}">גיל</button></div></div>
  <div class="list">${ps.map((p,i)=>{const hdr=squadSort==='pos'&&squadTab==='all'&&(i===0||ps[i-1].pos!==p.pos)?`<div class="grp"><span class="pos ${p.pos}">${POSB[p.pos]}</span> ${POSHE[p.pos]} · ${ps.filter(x=>x.pos===p.pos).length}</div>`:'';const fit=Math.round(p.fit??100),sh=Math.round(p.sharp??70);const r=p.rn?(p.rsum/p.rn).toFixed(1):'—';
    return hdr+playerRow(p,'',xi.has(p.id)?'starter':'',`<span class="it">${esc((ROLES[p.pos]||{})[roleOf(p)]||'')}</span><span class="it">גיל ${p.age}</span><span class="it">כושר <span class="num" style="color:var(--${fitClass(fit)});font-weight:700">${fit}%</span></span><span class="it">חדות <span class="num" style="font-weight:700">${sh}</span></span><span class="it">${p.apps||0} הופ' · ציון ${r}</span>${p.adapt!=null&&p.adapt<100?`<span class="it">🌍 ${Math.round(p.adapt)}%</span>`:''}`)}).join('')}</div><p class="muted tiny" style="text-align:center">לחיצה על שחקן: פרטים ומכירה · מסגרת ירוקה = בהרכב · עד ${MAX_FOREIGN_XI} זרים בהרכב</p>`;
}
function viewYouth(){
  const c=me();const cost=ACAD_COST[c.academy];
  return `<div class="card"><div class="tabs"><button data-st="all">בוגרים</button><button data-st="youth" class="on">נוער (${c.youth.length})</button></div>
  <div class="row between" style="margin-top:10px"><h3 class="sec">מחלקת הנוער</h3><span class="tag good">אקדמיה ${c.academy}/5</span></div>
  <div class="muted small" style="margin:6px 0 10px">הצעירים מתקדמים לעבר הפוטנציאל שלהם כל שבוע. אקדמיה ומגרש אימונים טובים מאיצים את הצמיחה.</div>
  <div class="actions"><button class="btn sec" id="upAcad" ${c.academy>=5?'disabled':''}>${c.academy>=5?'רמה מקסימלית':`שדרג אקדמיה · ${NIS(cost)}`}</button><button class="btn sec" id="scout">סקאוט חדש · ${NIS(1.5e6)}</button></div></div>
  <div class="list">${c.youth.slice().sort((a,b)=>b.pot-a.pot).map(y=>`<div class="pl"><span class="pos ${y.pos}">${POSB[y.pos]}</span><div class="name"><b>${esc(fullName(y))}</b><small>גיל ${y.age} · פוטנציאל <b class="num">${y.pot}</b>${y.real?'':''}</small><div class="bar" style="margin-top:4px"><i style="width:${Math.round(y.ovr/y.pot*100)}%"></i></div></div><span class="ovr num ${ovrClass(y.ovr)}">${y.ovr}</span><button class="btn sm" data-promote="${y.id}">העלה</button></div>`).join('')}</div>`;
}
let marketPos='all',marketSort='ovr',marketTab='buy',marketCategory='all',marketSearch='';
let marketPrice='all',marketPriceMin='',marketPriceMax='';
const MARKET_PRICE_LIMITS=[500000,1000000,3000000,5000000,10000000,20000000];
function filterMarketPrices(pool,valueOf){
  const min=marketPrice==='custom'&&marketPriceMin!==''?Number(marketPriceMin):0;
  const max=marketPrice==='budget'?Math.max(0,me().money):marketPrice==='custom'?(marketPriceMax===''?Infinity:Number(marketPriceMax)):marketPrice==='all'?Infinity:Number(marketPrice);
  return pool.filter(({p})=>{const value=valueOf(p);return value>=min&&value<=max});
}
function marketPriceControls(count,limit,noCount){
  const options=[['all','כל המחירים'],['budget',`שווי עד התקציב שלי (${NIS(Math.max(0,me().money))})`],...MARKET_PRICE_LIMITS.map(n=>[String(n),`עד ${NIS(n)}`]),['custom','טווח מחירים לבחירתי']];
  return `<div class="market-price-filter"><div class="price-select"><label for="marketPrice">סינון לפי מחיר</label><select id="marketPrice" aria-describedby="marketPriceNote">${options.map(([v,t])=>`<option value="${v}" ${marketPrice===v?'selected':''}>${esc(t)}</option>`).join('')}</select>${marketPrice!=='all'?'<button type="button" class="btn sm sec" data-price-reset>נקה סינון מחיר</button>':''}</div>
  ${marketPrice==='custom'?`<form id="marketPriceRange" class="price-range"><label for="marketPriceMin">ממחיר (₪)<input id="marketPriceMin" type="number" inputmode="numeric" min="0" step="1" placeholder="ללא מינימום" value="${marketPriceMin}"></label><label for="marketPriceMax">עד מחיר (₪)<input id="marketPriceMax" type="number" inputmode="numeric" min="0" step="1" placeholder="ללא מקסימום" value="${marketPriceMax}"></label><button type="submit" class="btn">סנן</button><div id="marketPriceError" class="price-error" role="alert"></div></form>`:''}
  <div id="marketPriceNote" class="muted tiny price-note">לפי שווי השחקן המוצג; מחיר העסקה נקבע במשא ומתן.</div>
  ${noCount?'':`<div class="market-results" role="status" aria-live="polite">${count>limit?`מוצגים ${limit} מתוך ${count} שחקנים בסינון`:`${count} שחקנים בסינון`}</div>`}</div>`;
}
/* Israeli legionnaire = a real player whose squad data (data/euro) lists Israeli nationality, playing for a club outside
   Israel. Nationality is never inferred from a name, and generated transfer-list players are not counted. Foreign
   players at Israeli clubs are not legionnaires. */
function isIsraeliNat(p){return !!p&&playerNats(p).some(n=>['israel','israeli','ישראל','ישראלי','ישראלית'].includes(String(n).trim().toLocaleLowerCase()))}
function isMarketLegionnaire(p,club){return !!p&&!!club&&!!club.world&&!!p.real&&!!p.en&&isIsraeliNat(p)}
function legionnairePool(){ensureAllWorldLeagues();return worldClubs().flatMap(cl=>cl.players.filter(p=>isMarketLegionnaire(p,cl)).map(p=>({p,c:cl,cl})))}
function marketPriceEmpty(){return `<div class="card market-empty"><p>אין שחקנים שמתאימים לחיפוש ולמסננים שבחרת.</p><div class="actions">${marketSearch?'<button type="button" class="btn sec" data-market-search-reset>נקה חיפוש</button>':''}${marketCategory!=='all'&&marketTab==='buy'?'<button type="button" class="btn sec" data-mcat="all">הצג את כל השחקנים</button>':''}${(marketTab==='world'?worldNat:marketNat)!=='all'?'<button type="button" class="btn sec" data-fclear="nat">כל הלאומים</button>':''}${marketPrice!=='all'?'<button type="button" class="btn sec" data-price-reset>נקה סינון מחיר</button>':''}</div></div>`}
function applyMarketPriceRange(){
  const min=$('marketPriceMin').value,max=$('marketPriceMax').value;
  if((min!==''&&(!Number.isFinite(Number(min))||Number(min)<0))||(max!==''&&(!Number.isFinite(Number(max))||Number(max)<0))){$('marketPriceError').textContent='יש להזין סכומים תקינים של אפס ומעלה.';return}
  if(min!==''&&max!==''&&Number(min)>Number(max)){$('marketPriceError').textContent='מחיר המקסימום חייב להיות גדול או שווה למחיר המינימום.';$('marketPriceMax').focus();return}
  marketPriceMin=min===''?'':String(Number(min));marketPriceMax=max===''?'':String(Number(max));render();
}
function viewFreeAgents(){
  const c=me();const open=WINDOW(G.wk);const fa=(G.freeAgents||[]).slice().sort(byOvr);
  return `<div class="card">${marketTabs('free')}
  <div class="muted small" style="margin-top:8px">שחקנים בלי מועדון. אין דמי העברה, רק בונוס חתימה ושכר. ${open?'':'אפשר לחתום רק כשהחלון פתוח.'}</div></div>
  <div class="list">${fa.map(p=>{const d=contractDemand(p);return playerRow(p,`<button class="btn sm" data-sign="${p.id}" ${open&&c.money>=d.bonus?'':'disabled'}>חתום</button>`,'',`${POSHE[p.pos]} · ${p.age} · דורש <b class="num">${NIS(d.wage)}</b>/שבוע ל-${d.years} שנים · בונוס ${NIS(d.bonus)}`)}).join('')||'<div class="muted small" style="text-align:center">אין שחקנים חופשיים כרגע</div>'}</div>`;
}
/* ---- market: live name suggestions, nationality filter, active-filter chips (shared by the Israel and world tabs) ---- */
let marketNat='all',worldNat='all',worldAvail='all',marketFiltersOpen=typeof matchMedia==='function'?matchMedia('(min-width: 700px)').matches:true;
const HEB_FINAL={'ך':'כ','ם':'מ','ן':'נ','ף':'פ','ץ':'צ'};
function searchNorm(x){return String(x||'').normalize('NFD').replace(/[̀-֑ͯ-ׇ]/g,'').toLowerCase().replace(/ø/g,'o').replace(/ł/g,'l').replace(/ß/g,'ss').replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/đ/g,'d').replace(/ı/g,'i').replace(/[ךםןףץ]/g,ch=>HEB_FINAL[ch]).replace(/["'׳״`’]/g,'').replace(/[-.]/g,' ').replace(/\s+/g,' ').trim()}
/* highlight the typed letters inside a name: normalise character by character so accents, apostrophes and Hebrew final
   letters do not shift the match position */
function hlName(text,q){text=String(text||'');q=searchNorm(q);if(!q)return esc(text);const map=[];let norm='';
  for(let i=0;i<text.length;i++){const n=searchNorm(text[i]);for(const ch of n){norm+=ch;map.push(i)}if(text[i]===' '&&!norm.endsWith(' ')){norm+=' ';map.push(i)}}
  const at=norm.indexOf(q);if(at<0)return esc(text);const from=map[at],to=map[Math.min(at+q.length-1,map.length-1)]+1;
  return esc(text.slice(0,from))+'<mark>'+esc(text.slice(from,to))+'</mark>'+esc(text.slice(to))}
function playerNats(p){return [p.nat,p.nat2].filter(Boolean)}
function hasNat(p,nat){return playerNats(p).includes(nat)}
function marketSearchPool(){ensureAllWorldLeagues();const out=[];for(const c of [...G.clubs,...G.leumit]){if(c.id===G.me)continue;for(const p of c.players)if(!p.loanOut)out.push({p,c})}for(const c of worldClubs())for(const p of c.players)out.push({p,c});return out}
function matchRank(hay,q){if(!hay)return 9;if(hay.startsWith(q))return 0;if((' '+hay).includes(' '+q))return 1;return hay.includes(q)?2:9}
function searchPlayers(text,limit){const q=searchNorm(text);if(q.length<2)return [];const res=[];
  for(const x of marketSearchPool()){const p=x.p;const r=Math.min(matchRank(searchNorm(fullName(p)),q),matchRank(searchNorm(p.en),q),matchRank(searchNorm((p.first||'')+' '+(p.last||'')),q));if(r<9)res.push({...x,r})}
  res.sort((a,b)=>a.r-b.r||(b.p.real?1:0)-(a.p.real?1:0)||(b.p.rv||b.p.value)-(a.p.rv||a.p.value));return limit?res.slice(0,limit):res}
function marketSearchHTML(){return `<form id="marketNameSearch" class="msearch" role="search" autocomplete="off"><label class="small" for="marketNameInput">חיפוש שחקן לפי שם <span class="muted tiny">(עברית או אנגלית, מ-2 אותיות)</span></label>
  <div class="msearch-row"><input id="marketNameInput" type="search" value="${esc(marketSearch)}" placeholder="למשל: גלוך / Gloukh" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="marketSuggest" enterkeyhint="search"><button class="btn sm" type="submit">חפש</button>${marketSearch?'<button class="btn sm sec" type="button" data-market-search-reset>נקה</button>':''}</div>
  <div id="marketSuggest" class="msuggest" role="listbox" aria-label="הצעות לשחקנים" hidden></div></form>`}
let suggestIdx=-1,suggestItems=[];
function updateMarketSuggest(input){const box=$('marketSuggest');if(!box)return;const v=input.value;suggestItems=searchPlayers(v,8);suggestIdx=-1;
  if(searchNorm(v).length<2){box.hidden=true;box.innerHTML='';input.setAttribute('aria-expanded','false');return}
  box.innerHTML=suggestItems.length?suggestItems.map((x,i)=>{const L=x.c.world?WORLD_LEAGUES[x.c.lg]:null;return `<button type="button" role="option" id="msug${i}" class="msug" data-msug="${x.p.id}" aria-selected="false"><span class="msug-face">${playerPortraitHTML(x.p,x.c,'sg'+x.p.id)}</span><span class="msug-txt"><b>${hlName(fullName(x.p),v)}</b>${x.p.en?` <bdi class="muted" dir="ltr">${hlName(x.p.en,v)}</bdi>`:''}<small class="muted">${esc(x.c.short||x.c.name)} · ${L?`${L.flag} ${esc(L.name)}`:'ישראל'} · ${POSHE[x.p.pos]}${x.p.nfs?' · המועדון מעדיף להשאיר':''}</small></span></button>`}).join(''):'<div class="msug-none muted small">לא נמצאו שחקנים בשם הזה</div>';
  box.hidden=false;input.setAttribute('aria-expanded','true')}
function closeMarketSuggest(){const box=$('marketSuggest');if(box){box.hidden=true}const i=$('marketNameInput');if(i)i.setAttribute('aria-expanded','false');suggestIdx=-1}
function moveSuggest(d){const box=$('marketSuggest');if(!box||box.hidden||!suggestItems.length)return;suggestIdx=(suggestIdx+d+suggestItems.length)%suggestItems.length;
  box.querySelectorAll('.msug').forEach((b,i)=>{b.setAttribute('aria-selected',i===suggestIdx?'true':'false');b.classList.toggle('on',i===suggestIdx)});$('marketNameInput').setAttribute('aria-activedescendant','msug'+suggestIdx);const el=$('msug'+suggestIdx);if(el&&el.scrollIntoView)el.scrollIntoView({block:'nearest'})}
function pickSuggest(pid){const x=suggestItems.find(s=>s.p.id===pid);closeMarketSuggest();const i=$('marketNameInput');if(i&&x)i.value=fullName(x.p);playerModalAny(pid)}
function natOptionsHTML(id,pool,cur){const n={};for(const {p} of pool)for(const k of (playerNats(p).length?playerNats(p):['—']))n[k]=(n[k]||0)+1;const keys=Object.keys(n).sort((a,b)=>n[b]-n[a]||a.localeCompare(b,'he'));
  return `<label class="small mnat" for="${id}">לאום<select id="${id}"><option value="all">כל הלאומים (${pool.length})</option>${keys.map(k=>`<option value="${esc(k)}" ${cur===k?'selected':''}>${esc(k)} (${n[k]})</option>`).join('')}${cur!=='all'&&!n[cur]?`<option value="${esc(cur)}" selected>${esc(cur)} (0)</option>`:''}</select></label>`}
function priceChipLabel(){return marketPrice==='budget'?'מחיר: עד התקציב':marketPrice==='custom'?`מחיר: ${marketPriceMin!==''?NIS(+marketPriceMin):'0'}–${marketPriceMax!==''?NIS(+marketPriceMax):'∞'}`:`מחיר: עד ${NIS(+marketPrice)}`}
function activeChips(list){if(!list.length)return '';return `<div class="mchips" aria-label="מסננים פעילים"><span class="muted tiny">מסננים פעילים:</span>${list.map(([label,key])=>`<button type="button" class="mchip" data-fclear="${key}" aria-label="הסר: ${esc(label)}">${esc(label)} <span aria-hidden="true">✕</span></button>`).join('')}${list.length>1?'<button type="button" class="mchip all" data-fclear="all">נקה הכל</button>':''}</div>`}
function clearMarketFilter(k){const world=marketTab==='world';const all=k==='all';
  if(all||k==='search')marketSearch='';if(all||k==='price'){marketPrice='all';marketPriceMin='';marketPriceMax=''}
  if(world){if(all||k==='nat')worldNat='all';if(all||k==='pos')worldPos='all';if(all||k==='age')mktAge='all';if(all||k==='club')worldClubId=null;if(all||k==='avail')worldAvail='all'}
  else{if(all||k==='nat')marketNat='all';if(all||k==='pos')marketPos='all';if(all||k==='cat')marketCategory='all'}
  render()}
function viewMarket(){
  if(marketTab==='free')return viewFreeAgents();
  if(marketTab==='world')return viewWorld();
  if(marketTab==='scout')return viewScouting();
  if(marketTab==='negs')return viewNegs();
  const c=me();const open=WINDOW(G.wk);const leg=marketCategory==='legionnaires';
  let pool=leg?legionnairePool():[...G.clubs,...G.leumit].filter(x=>x.id!==G.me).flatMap(x=>x.players.map(p=>({p,c:x})));
  const valueOf=leg?marketValue:(p=>p.value),priceOf=leg?marketValue:askingPrice;
  if(marketPos!=='all')pool=pool.filter(x=>x.p.pos===marketPos);
  if(marketSearch){const q=searchNorm(marketSearch);pool=pool.filter(({p})=>[fullName(p),p.en,(p.first||'')+' '+(p.last||'')].some(h=>matchRank(searchNorm(h),q)<9))}
  pool=filterMarketPrices(pool,valueOf);
  const natHTML=natOptionsHTML('marketNatSel',pool,marketNat);
  if(marketNat!=='all')pool=pool.filter(x=>hasNat(x.p,marketNat));
  pool.sort((a,b)=>{
    if(marketSort==='ovr')return b.p.ovr-a.p.ovr;
    if(marketSort==='age')return a.p.age-b.p.age;
    const d=priceOf(a.p)-priceOf(b.p);
    return (marketSort==='price-desc'?-d:d)||fullName(a.p).localeCompare(fullName(b.p),'he');
  });
  const chips=activeChips([...(leg?[['ליגיונרים ישראלים','cat']]:[]),...(marketSearch?[[`שם: ${marketSearch}`,'search']]:[]),...(marketPos!=='all'?[[`עמדה: ${POSHE[marketPos]}`,'pos']]:[]),...(marketNat!=='all'?[[`לאום: ${marketNat}`,'nat']]:[]),...(marketPrice!=='all'?[[priceChipLabel(),'price']]:[])]);
  const nextOpen=(()=>{for(let w=G.wk+1;w<G.cal.length;w++)if(WINDOW(w))return w+1;return null})();
  return `<div class="card">${marketTabs('buy')}<div class="row between"><h3 class="sec">שוק ההעברות · ${leg?'ליגיונרים ישראלים':'ליגת העל'}</h3>${open?'<span class="tag good">פתוח</span>':`<span class="tag bad">סגור${nextOpen?' · נפתח בשבוע '+nextOpen:''}</span>`}</div>
  <div class="muted small" style="margin-top:6px">תקציב <b>${NIS(c.money)}</b> · החלון פתוח בקיץ (עד מחזור 6) ובחורף (מחזורים 17–19). לחיצה על שחקן פותחת פרטים ומשא ומתן. מכירה מתוך מסך הסגל. סגל: ${c.players.length}/30</div>
  ${marketSearchHTML()}
  <div class="tabs" style="margin-top:8px"><button data-mcat="all" class="${!leg?'on':''}">ליגת העל והלאומית</button><button data-mcat="legionnaires" class="${leg?'on':''}">ליגיונרים ישראלים</button></div>
  ${leg?'<div class="muted small" style="margin-top:6px">שחקנים בעלי אזרחות ישראלית שמשחקים במועדונים מחוץ לישראל (לפי נתוני הלאום של הסגלים).</div>':''}
  <details class="mfold" data-mfold ${marketFiltersOpen?'open':''}><summary>סינון ומיון <span class="muted tiny">(עמדה, לאום, מחיר)</span></summary>
  <div class="tabs" style="margin-top:8px"><span class="muted tiny" style="align-self:center">עמדה:</span><button data-mp="all" class="${marketPos==='all'?'on':''}">הכל</button>${POS.map(p=>`<button data-mp="${p}" class="${marketPos===p?'on':''}">${POSHE[p]}</button>`).join('')}</div>
  <div class="mfilters">${natHTML}</div>
  <div class="tabs" style="margin-top:6px"><span class="muted tiny" style="align-self:center">מיון:</span><button data-ms="ovr" class="${marketSort==='ovr'?'on':''}">דירוג</button><button data-ms="price-asc" class="${marketSort==='price-asc'?'on':''}">מחיר: נמוך לגבוה</button><button data-ms="price-desc" class="${marketSort==='price-desc'?'on':''}">מחיר: גבוה לנמוך</button><button data-ms="age" class="${marketSort==='age'?'on':''}">גיל</button></div>
  ${marketPriceControls(pool.length,50,true)}</details><div class="market-results" role="status" aria-live="polite">${pool.length>50?`מוצגים 50 מתוך ${pool.length} שחקנים בסינון`:`${pool.length} שחקנים בסינון`}</div>${chips}</div>
  ${(G.tlog||[]).length&&!leg?`<div class="card"><h3 class="sec">חדשות העברות</h3>${G.tlog.filter(t=>t.s===G.season).slice(0,8).map(t=>`<div class="small tl ${t.big?'big':''}"><span class="muted tiny">שבוע ${t.wk+1}</span> ${esc(t.txt)}</div>`).join('')}</div>`:''}
  <div class="list">${pool.slice(0,50).map(({p,c:x})=>{if(leg)return worldRow(p,x,open,true);const n=(G.negs||[]).find(z=>z.pid===p.id&&(z.stage==='club'||z.stage==='player'));return playerRow(p,n?`<button class="btn sm" data-neg="${n.id}">במו"מ</button>`:`<button class="btn sm sec" data-wview="${p.id}">פרטים</button>`,'',`<span class="it">${kitSVG(x,'sm')} ${esc(x.short)}</span><span class="it">גיל ${p.age}</span><span class="it">חוזה עד ${contractYear(p)}</span><span class="it">שווי <b class="num">${NIS(p.value)}</b></span>`).replace('data-pid','data-wrow')}).join('')||marketPriceEmpty()}</div>`;
}
let clubTab='main';
function viewClub(){const tabs=`<div class="tabs ctabs">${[['main','כללי'],['med','רפואה'],['staff','צוות'],['com','מסחרי'],['data','מקורות']].map(([k,l])=>`<button data-ctab="${k}" class="${clubTab===k?'on':''}">${l}${k==='med'&&me().players.some(p=>p.inj>0)?` <span class="dotb">${me().players.filter(p=>p.inj>0).length}</span>`:''}</button>`).join('')}</div>`;
  if(clubTab==='med')return tabs+viewMedical();if(clubTab==='staff')return tabs+viewStaff();if(clubTab==='com')return tabs+viewCommercial();if(clubTab==='data')return tabs+viewDataInfo();if(clubTab==='ads')return tabs+viewAdsAdmin();
  return tabs+viewClubMain()}
function viewClubMain(){
  const c=me();const b=c.build;const conf=G.board.conf;
  const proj=b?`<div class="tag warn">בבנייה: ${b.type==='stadium'?`הרחבה +${b.add.toLocaleString('he')}`:`מגרש אימונים רמה ${b.level}`} · עוד ${b.weeks} שבועות</div>`:'';
  return `<div class="card"><div class="row">${kitSVG(c,'lg')}<div><h2 style="font-size:22px">${esc(c.name)}</h2><div class="muted small">${c.nick?esc(c.nick)+' · ':''}${c.founded?'נוסדה '+c.founded+' · ':''}${esc(c.city)}${c.coach?' · מאמן: '+esc(c.coach):''}</div><div class="muted small">יוקרה: מקום ${c.prestige} · שווי סגל ${NIS(c.squadValue)}</div></div></div></div>
  <div class="card"><div class="row between"><h3 class="sec">ההנהלה והמנג'ר</h3><span class="tag ${conf>=60?'good':conf>=30?'warn':'bad'}">אמון ${conf}/100</span></div><div class="bar conf" style="margin:8px 0"><i style="width:${conf}%"></i></div>
  <dl class="kv"><dt>הבעלים</dt><dd>${ownerOf(c).he} · פיטורים מתחת ל-${ownerOf(c).fire}</dd><dt>יעד העונה</dt><dd>${esc(G.board.expectText)}${G.board.ultimatum?' · <span class="tag bad">אולטימטום עד מחזור 20</span>':''}</dd><dt>חוזה</dt><dd>${G.manager.seasonsLeft} עונות · ${NIS(G.manager.wage)}/שבוע</dd><dt>חשבון המנג'ר</dt><dd class="num">${NIS(G.manager.bank)}</dd><dt>אמון חדר ההלבשה בך</dt><dd class="num">${trust()}/100</dd><dt>מוניטין</dt><dd class="num">${(ensureRep(),G.manager.rep)} · ${repWord(G.manager.rep)}</dd></dl><div class="actions" style="margin-top:8px"><button class="btn sm sec" id="resignBtn">התפטרות</button></div>
  <div class="row between wrap" style="margin-top:10px"><span class="small">מסיבות עיתונאים</span><div class="mt" style="flex:1;min-width:200px"><button data-press="all" class="${pressMode()==='all'?'on':''}">כל משחק</button><button data-press="big" class="${pressMode()==='big'?'on':''}">רק חשובים</button><button data-press="off" class="${pressMode()==='off'?'on':''}">כבוי</button></div></div></div>
  ${(()=>{const ps=c.players;const avg=ps.reduce((t,p)=>t+(p.morale??65),0)/Math.max(1,ps.length);const by=k=>ps.filter(p=>p.pers===k);const leaders=by('leader');const hot=by('temperamental');const unhappy=ps.filter(p=>p.unhappy);const listed=ps.filter(p=>p.listed);
    return `<div class="card"><div class="row between"><h3 class="sec">חדר ההלבשה</h3><span class="tag ${avg>=70?'good':avg>=50?'warn':'bad'}">מורל ${moraleWord(avg)} (${Math.round(avg)})</span></div>
    <dl class="kv" style="margin-top:8px"><dt>🧭 מנהיגים</dt><dd>${leaders.map(p=>esc(p.last||p.first)).join(', ')||'אין'}</dd><dt>🔥 חמי מזג</dt><dd>${hot.map(p=>esc(p.last||p.first)).join(', ')||'אין'}</dd><dt>💰 שכירי חרב</dt><dd>${by('mercenary').length}</dd><dt>🚀 שאפתנים</dt><dd>${by('ambitious').length}</dd><dt>לא מרוצים</dt><dd>${unhappy.map(p=>esc(p.last||p.first)).join(', ')||'אין'}</dd><dt>ברשימת ההעברות</dt><dd>${listed.map(p=>esc(p.last||p.first)).join(', ')||'אין'}</dd></dl>
    <div class="muted tiny" style="margin-top:6px">לחיצה על שחקן בסגל → "שיחה" כדי להבטיח דקות, להרגיע, לבקר או להעמיד למכירה. מנהיג בתור קפטן נותן בונוס כפול.</div></div>`})()}
  <div class="card"><div class="row between wrap"><h3 class="sec">${esc(c.stadium)}</h3>${proj}</div>
  <dl class="kv" style="margin-top:8px"><dt>קיבולת</dt><dd class="num">${c.cap.toLocaleString('he')}${b&&b.type==='stadium'?` (זמין ${effectiveCap(c).toLocaleString('he')})`:''}</dd><dt>מחיר כרטיס</dt><dd class="num">₪${c.ticket}</dd><dt>תחזוקה</dt><dd class="num">${NIS(c.cap*3)}/שבוע</dd></dl>
  <div class="muted small" style="margin:8px 0">הרחבה עולה ₪9,000 למקום. בזמן העבודות רק 70% מהיציעים פתוחים. מקסימום 45,000.</div>
  <div class="actions">${[2000,5000,10000].map(n=>`<button class="btn sec sm" data-stad="${n}" ${b||c.cap+n>45000?'disabled':''}>+${n.toLocaleString('he')} · ${NIS(n*9000)}</button>`).join('')}</div></div>
  ${adBox('training')}${trainingPlanHTML(c)}<div class="card"><h3 class="sec">מצב הסגל</h3><dl class="kv" style="margin-top:10px"><dt>כושר גופני ממוצע</dt><dd class="num">${Math.round(c.players.reduce((t,p)=>t+(p.fit??100),0)/Math.max(1,c.players.length))}%</dd><dt>מורל הקבוצה</dt><dd>${moraleWord(c.players.reduce((t,p)=>t+(p.morale??65),0)/Math.max(1,c.players.length))} (${Math.round(c.players.reduce((t,p)=>t+(p.morale??65),0)/Math.max(1,c.players.length))})</dd><dt>לא מרוצים</dt><dd>${c.players.filter(p=>p.unhappy).map(p=>esc(p.last||p.first)).join(', ')||'אין'}</dd></dl></div>
  <div class="card"><div class="row between"><h3 class="sec">אוהדים וכרטיסים</h3><span class="tag ${(c.fans??50)>=65?'good':(c.fans??50)>=45?'warn':'bad'}">אהדה ${Math.round(c.fans??50)}/100</span></div><div class="bar" style="margin:8px 0"><i style="width:${Math.round(c.fans??50)}%"></i></div>
  <div class="muted small">ניצחונות, דרבים, גביע ואירופה מביאים קהל; הפסדים בבית מרחיקים אותו. מחיר כרטיס גבוה מהרגיל מקטין את הקהל.</div>
  <div class="row between wrap" style="margin-top:8px"><label class="small">מחיר כרטיס <select id="ticketSel">${[40,50,60,70,80,90,100,120,140,160,180,200].map(v=>`<option value="${v}" ${(c.ticket||baseTicket(c))===v?'selected':''}>₪${v}</option>`).join('')}</select></label><span class="muted tiny">מקובל במועדון כזה: ₪${baseTicket(c)}</span></div>
  <dl class="kv" style="margin-top:8px"><dt>קהל צפוי מול יריבה רגילה</dt><dd class="num">${(()=>{const o=G.clubs.find(x=>x.id!==c.id&&x.tier===3)||G.clubs.find(x=>x.id!==c.id);return o?attendanceFor(c,o,'league').toLocaleString('he'):'—'})()}</dd><dt>קהל צפוי מול קבוצה גדולה</dt><dd class="num">${(()=>{const o=G.clubs.find(x=>x.id!==c.id&&x.tier===1)||G.clubs.find(x=>x.id!==c.id);return o?attendanceFor(c,o,'league').toLocaleString('he'):'—'})()}</dd><dt>שיא העונה</dt><dd class="num">${c.attRecord?`${c.attRecord.n.toLocaleString('he')} (מול ${esc(c.attRecord.opp)})`:'—'}</dd></dl></div>
  <div class="card"><div class="row between"><h3 class="sec">מגרש אימונים</h3><span class="tag good">רמה ${c.training}/5</span></div>
  <div class="muted small" style="margin:6px 0">כל רמה מאיצה את ההתפתחות של כל השחקנים ב-25% ומקצרת פציעות ב-8%. שדרוג נמשך 5 שבועות.</div>
  <div class="actions"><button class="btn sec" data-train ${b||c.training>=5?'disabled':''}>${c.training>=5?'רמה מקסימלית':`שדרג לרמה ${c.training+1} · ${NIS(TRAIN_COST[c.training])}`}</button></div></div>
  <div class="card"><div class="row between"><h3 class="sec">אקדמיית הנוער</h3><span class="tag good">רמה ${c.academy}/5</span></div><div class="actions" style="margin-top:8px"><button class="btn sec" id="upAcad" ${c.academy>=5?'disabled':''}>${c.academy>=5?'רמה מקסימלית':`שדרג · ${NIS(ACAD_COST[c.academy])}`}</button><button class="btn sec" data-st="youth" id="goYouth">למחלקת הנוער</button></div></div>
  <div class="card"><h3 class="sec">ספונסר חולצה</h3>${sponsorLogoHTML(c.sponsor)}${c.sponsor?`<dl class="kv" style="margin-top:8px"><dt>${esc(c.sponsor.name)}</dt><dd class="num">${NIS(c.sponsor.annual)}/עונה</dd><dt>נותרו</dt><dd>${c.sponsor.years} ${c.sponsor.years>1?'עונות':'עונה'}</dd>${c.sponsor.bonusTitle?`<dt>בונוס אליפות</dt><dd class="num">${NIS(c.sponsor.bonusTitle)}</dd><dt>בונוס אירופה</dt><dd class="num">${NIS(c.sponsor.bonusEuro)}</dd>`:''}</dl>`:'<div class="muted small">אין ספונסר</div>'}</div>`;
}
let tableTab='league';
function viewTable(){
  const tabs=`<div class="tabs"><button data-tt="league" class="${tableTab==='league'?'on':''}">ליגה</button><button data-tt="cup" class="${tableTab==='cup'?'on':''}">גביע המדינה</button><button data-tt="euro" class="${tableTab==='euro'?'on':''}">אירופה</button><button data-tt="scorers" class="${tableTab==='scorers'?'on':''}">מלך השערים</button><button data-tt="results" class="${tableTab==='results'?'on':''}">תוצאות</button><button data-tt="cal" class="${tableTab==='cal'?'on':''}">לוח</button><button data-tt="paper" class="${tableTab==='paper'?'on':''}">עיתון</button><button data-tt="leumit" class="${tableTab==='leumit'?'on':''}">לאומית</button><button data-tt="toto" class="${tableTab==='toto'?'on':''}">טוטו</button><button data-tt="nt" class="${tableTab==='nt'?'on':''}">נבחרת</button><button data-tt="hist" class="${tableTab==='hist'?'on':''}">היסטוריה</button></div>`;
  if(tableTab==='toto')return tabs+viewToto();
  if(tableTab==='nt')return tabs+viewNT();
  if(tableTab==='hist')return tabs+viewHistory();
  if(tableTab==='leumit'||(tableTab==='league'&&myDiv()==='leumit'))return tabs+leagueTableHTML('leumit');
  if(tableTab==='paper'){const ps=G.paper||[];return tabs+(ps.length?paperHTML(ps,{max:8}):'<div class="card"><div class="muted">עוד לא יצאה מהדורה.</div></div>')}
  if(tableTab==='cal')return tabs+viewCalendar();
  if(tableTab==='cup')return tabs+viewCup();
  if(tableTab==='euro')return tabs+viewEuro();
  if(tableTab==='results'){const rs=G.results.slice(-40).reverse();return tabs+`<div class="card"><h3 class="sec">תוצאות אחרונות בכל המסגרות</h3>${rs.map(fxRow).join('')||'<div class="muted">אין עדיין</div>'}</div>`}
  if(tableTab==='scorers'){const sc=G.clubs.flatMap(c=>c.players.map(p=>({p,c}))).filter(x=>x.p.goals>0).sort((a,b)=>b.p.goals-a.p.goals).slice(0,15);
    return tabs+`<div class="card"><h3 class="sec">מלך השערים (כל המסגרות)</h3>${sc.map(({p,c},i)=>`<div class="fx"><span class="a">${i+1}. ${esc(fullName(p))}</span><span class="s num">${p.goals}</span><span class="h muted">${esc(c.short)}</span></div>`).join('')||'<div class="muted">אין עדיין</div>'}</div>`}
  return tabs+leagueTableHTML('top');
}
function leagueTableHTML(div){
  const st=standingsOf(div);const leumit=div==='leumit';const stage=leumit?!!G.lsplit:(leagueClubs()[0]&&leagueClubs()[0].P>26);
  const formOf=c=>G.results.filter(r=>r.kind==='league'&&(r.h===c.id||r.a===c.id)).slice(-5).map(r=>{const gf=r.h===c.id?r.gh:r.ga,ga=r.h===c.id?r.ga:r.gh;return gf>ga?'W':gf===ga?'D':'L'});
  const n=st.length;const rows=st.map((c,i)=>`<tr class="${c.id===G.me?'me':''} ${leumit?(i<2?'top6':''):(!stage&&i<6?'top6':'')} ${i>=n-2?'rel':''}"><td class="c"><span class="pos-pill num">${i+1}</span></td><td><span class="row" style="gap:6px">${kitSVG(c,'sm')}${esc(c.short)}</span></td><td class="c num">${c.P}</td><td class="c num">${c.W}</td><td class="c num">${c.D}</td><td class="c num">${c.L}</td><td class="c num">${c.GF}:${c.GA}</td><td class="c num"><b>${c.pts}</b></td><td class="c"><span class="form">${formOf(c).map(x=>`<i class="${x}"></i>`).join('')}</span></td></tr>`).join('');
  return `<div class="card"><h3 class="sec">${leumit?'ליגה לאומית':'ליגת העל'} · ${stage?'פלייאוף':'ליגה סדירה'} · עונת ${seasonLabel()}</h3><div class="scroll"><table class="tbl" style="margin-top:8px"><tr><th class="c">#</th><th>קבוצה</th><th class="c">מש</th><th class="c">נצ</th><th class="c">תי</th><th class="c">הפ</th><th class="c">שערים</th><th class="c">נק</th><th class="c">כושר</th></tr>${rows}</table></div>
  <div class="muted tiny" style="margin-top:8px">${leumit?'ירוק = עלייה לליגת העל · אדום = ירידה לליגה א\' · אחרי 30 מחזורים: פלייאוף עליון (8) ותחתון (8)':(stage?'':'ירוק = פלייאוף עליון · ')+'אדום = ירידה · אלופה → ליגת האלופות, זוכת הגביע → הליגה האירופית, 2 הבאות → קונפרנס ליג'}</div></div>`;
}
function viewCalendar(){
  const c=me();const rows=[];
  for(let w=G.wk;w<Math.min(G.cal.length,G.wk+16);w++){const ev=G.cal[w];let label='',opp='';
    if(ev.t==='league'){if(!c.league){const lr=G.lsched[w];label=lr?leumitRoundLabel(lr):'שבוע חופשי';const fx=lr?G.lfx[lr-1]:null;const m=fx&&fx.find(([h,a])=>h===G.me||a===G.me);if(m)opp=m[0]===G.me?`בית מול ${esc(club(m[1]).short)}`:`חוץ מול ${esc(club(m[0]).short)}`;else if(lr>30)opp='ייקבע אחרי מחזור 30'}else{label=`מחזור ${ev.n}`;const fx=G.fixtures[ev.n-1];const m=fx&&fx.find(([h,a])=>h===G.me||a===G.me);if(m)opp=m[0]===G.me?`בית מול ${esc(club(m[1]).short)}`:`חוץ מול ${esc(club(m[0]).short)}`;else if(ev.n>26)opp='ייקבע אחרי מחזור 26'}}
    else if(ev.t==='cup'){label=CUP_HE[ev.s];opp=G.cup.alive.includes(G.me)&&['R16','QF','SF','F'].indexOf(ev.s)>=['R16','QF','SF','F','done'].indexOf(G.cup.stage)?'אם נעבור את השלב הקודם':'לא בגביע'}
    else if(ev.t==='euro'){label=`אירופה · ${STAGE_HE[ev.stage]}${ev.stage==='LP'?' '+ev.leg:ev.leg?' · משחק '+ev.leg:''}`;opp=c.euro&&c.euro.stage!=='out'?(c.euro.stage===ev.stage?'משחק שלנו':'תלוי בהתקדמות'):(['Q2','Q3','PO'].includes(ev.stage)&&ev.leg===1?'ידידות':'')}
    else{label=`פגרת נבחרות · ${ev.m}`}
    rows.push(`<div class="fx ${w===G.wk?'me':''}"><span class="a">שבוע ${w+1}</span><span class="s" style="font-size:13px;font-family:var(--body)">${label}</span><span class="h muted">${opp}</span></div>`)}
  return `<div class="card"><h3 class="sec">לוח המשחקים · 16 השבועות הבאים</h3>${rows.join('')}</div>`;
}
function viewCup(){
  const cup=G.cup;const stages=['R16','QF','SF','F'];
  const block=s=>{const rs=cup.results.filter(r=>r.stage===s);if(!rs.length)return '';return `<h3 style="margin-top:8px">${CUP_HE[s]}</h3>${rs.map(r=>`<div class="fx ${r.h===G.me||r.a===G.me?'me':''}"><span class="a">${esc(club(r.h).short)}</span><span class="s num">${r.gh}:${r.ga}${r.pens?'<small> פ</small>':''}</span><span class="h">${esc(club(r.a).short)}</span></div>`).join('')}`};
  return `<div class="card"><div class="row between"><h3 class="sec">גביע המדינה ${seasonLabel()}</h3><span class="tag ${cup.alive.includes(G.me)?'good':'bad'}">${cup.stage==='done'?`זוכה: ${esc(club(G.cupWinner)?.short)}`:cup.alive.includes(G.me)?'בחיים':'הודחנו'}</span></div>
  <div class="muted small" style="margin-top:4px">16 קבוצות: 14 מליגת העל ו-2 מהליגה הלאומית. משחק אחד בכל שלב, הגמר במגרש ניטרלי.</div>
  ${stages.map(block).join('')}
  ${cup.stage!=='done'?`<div class="muted small" style="margin-top:8px">בשלב ${CUP_HE[cup.stage]||''}: ${cup.alive.map(id=>esc(club(id).short)).join(', ')}</div>`:''}</div>`;
}
function viewEuro(){
  const cs=G.clubs.filter(c=>c.euro);
  if(!cs.length)return `<div class="card"><div class="muted">אין נציגות ישראליות באירופה העונה.</div></div>`;
  return cs.map(c=>{const E=c.euro;const lp=E.lp;const rs=G.results.filter(r=>r.kind==='euro'&&(r.h===c.id||r.a===c.id)).slice(-10);
    return `<div class="card"><div class="row between"><div class="row">${kitSVG(c)}<h3 class="sec">${esc(c.name)}</h3></div><span class="tag ${E.stage==='out'?'bad':'info'}">${COMP_HE[E.comp]} · ${STAGE_HE[E.stage]}</span></div>
    ${lp?`<div class="small" style="margin-top:6px">שלב הליגה: ${lp.P} משחקים, ${lp.W} נצ' ${lp.D} תיקו ${lp.L} הפ', ${lp.GF}:${lp.GA}, <b class="num">${lp.pts} נק'</b> (8 הראשונות: ${E.comp==='ECL'?12:16}+ נק', פלייאוף: ${E.comp==='ECL'?7:9}+)</div>`:''}
    <div class="small muted">כספי אופ"א העונה: ${NIS(E.prize)}${E.history.length?' · '+E.history.map(esc).join(' · '):''}</div>
    ${rs.map(r=>`<div class="fx"><span class="a">${esc(r.hn)}</span><span class="s num">${r.gh}:${r.ga}${r.agg?`<small> (${r.agg[0]}:${r.agg[1]})</small>`:''}${r.pens?'<small> פ</small>':''}</span><span class="h">${esc(r.an)}</span></div>`).join('')}</div>`}).join('');
}
function viewMoney(){
  const c=me();const wages=c.players.reduce((t,p)=>t+p.wage,0);const sv=c.squadValue;
  const wkLog=G.log.filter(l=>l.s===G.season).slice(0,30);
  return `<div class="card"><h3 class="sec">כספים</h3><dl class="kv" style="margin-top:10px"><dt>תקציב</dt><dd class="num"><b>${NIS(c.money)}</b></dd>${weeklyBreakdown(c,true).map(r=>`<dt>${esc(r.label)}</dt><dd class="num" style="color:${r.amt<0?'var(--bad)':'var(--good)'}">${NIS(r.amt)}</dd>`).join('')}<dt>שווי הסגל</dt><dd class="num">${NIS(sv)}</dd><dt>מאזן שבועי קבוע</dt><dd class="num" style="color:${weeklyNet(c)<0?'var(--bad)':'var(--good)'}"><b>${NIS(weeklyNet(c))}</b></dd></dl>
  <div class="muted small" style="margin-top:10px">הכנסות: כרטיסים במשחקי בית (אירופה שווה פי 1.6), זכויות שידור, ספונסר, פרסי ליגה/גביע/אופ"א, מכירות. הוצאות: שכר, תחזוקה, רכישות, בנייה, שכר המנג'ר.</div></div>
  ${(G.payables||[]).length?`<div class="card"><h3 class="sec">תשלומים עתידיים על העברות</h3>${G.payables.map(x=>`<div class="fx"><span class="a">${esc(x.label)}</span><span class="s num">${NIS(x.amount)}</span><span class="h muted tiny">עונה ${x.s} · שבוע ${x.wk+1}</span></div>`).join('')}</div>`:''}
  <div class="card"><h3 class="sec">קהל במשחקי הבית האחרונים</h3>${G.results.filter(r=>r.h===G.me&&r.att).slice(-6).reverse().map(r=>`<div class="fx"><span class="a">${esc(r.an)} <span class="muted tiny">${esc(r.label||'')}</span></span><span class="s num">${r.att.toLocaleString('he')}</span><span class="h num muted">${NIS(r.income||0)}</span></div>`).join('')||'<div class="muted small">עוד לא היה משחק בית</div>'}</div>
  <div class="card"><h3 class="sec">יומן תנועות</h3><div class="list" style="margin-top:8px">${wkLog.map(l=>`<div class="fx"><span class="a">ש${l.wk+1} · ${esc(l.what)}</span><span class="s num" style="color:${l.amt<0?'var(--bad)':'var(--good)'}">${NIS(l.amt)}</span><span></span></div>`).join('')||'<div class="muted">ריק</div>'}</div></div>
  ${settingsCardHTML()}${cloudBoxHTML()}
  <div class="card"><div class="row between"><h3 class="sec">בנק</h3>${G.bank?`<span class="tag warn">הלוואה: ${NIS(G.bank.weekly)}/שבוע · ${G.bank.left} שבועות</span>`:'<span class="tag">אין הלוואה</span>'}</div><div class="muted small" style="margin:6px 0">הלוואה בריבית 8% לעונה, מוחזרת ב-92 תשלומים שבועיים. ההנהלה לא אוהבת מינוף (אמון יורד). גירעון של יותר מ-₪3M בסוף העונה = 3- נקודות מבקרת התקציבים.</div><div class="actions">${[5e6,10e6,20e6].map(a=>`<button class="btn sec sm" data-bank="${a}" ${G.bank?'disabled':''}>${NIS(a)}</button>`).join('')}</div></div>
  <div class="card"><div class="row between"><h3 class="sec">זכויות שם האצטדיון</h3>${c.naming?`<span class="tag good">${esc(c.naming.name)} · ${c.naming.years} עונות</span>`:''}</div>${c.naming?`<div class="small" style="margin-top:6px">${NIS(c.naming.annual)} לעונה. השם המקורי (${esc(c.naming.orig)}) יחזור בסוף החוזה.</div>`:`<div class="small muted" style="margin:6px 0">מכירת שם האצטדיון לשלוש עונות תכניס כ-${NIS(namingOffer(c))} לעונה. האוהדים לא יאהבו את זה (אהדה 3-).</div><div class="actions"><button class="btn sec" id="sellNaming">מכור את שם האצטדיון</button></div>`}</div>
  <div class="card"><h3 class="sec">קריירה</h3><div class="small" style="margin-top:6px">${G.manager.history.map(h=>`${h.season}: ${esc(h.club)} · מקום ${h.pos}${h.cup?' · גביע':''}`).join('<br>')||'העונה הראשונה'}</div><div class="actions" style="margin-top:10px"><button class="btn danger" id="resetBtn">התחל משחק חדש</button></div></div>`;
}

function bind(){
  const m=$('main');
  m.onclick=e=>{
    const t=e.target;if(!t.closest('.msearch'))closeMarketSuggest();
    const id=t.id||t.closest('button')?.id;
    if(id==='playBtn'){const nm=myNextMatch();if(nm&&G.view==='lineup'){const M0={h:nm.h.id,a:(nm.a||nm.h).id,ctx:{kind:nm.kind,stage:currentEvent()&&currentEvent().s||currentEvent().stage}};return runPress('pre',M0,()=>startLive())}return startLive()}
    if(id==='skipBtn')return playInstant();
    const bo=t.closest('[data-board]');if(bo)return chooseBoard(bo.dataset.board);
    const cp2=t.closest('[data-camp]');if(cp2){const c=me();const k=cp2.dataset.camp;const cost=k==='aut'?1.5e6:k==='cyp'?7e5:0;if(c.money<cost)return toast('אין מספיק תקציב');c.money-=cost;if(cost)addLog('מחנה אימונים',-cost);c.players.forEach(p=>{p.fit=100;p.morale=clamp(p.morale+(k==='aut'?5:k==='cyp'?3:0),10,100)});if(k==='aut')c.campShield=6;G.campDone=true;news(k==='home'?'הקבוצה התאמנה בבית לפני העונה.':`הקבוצה חזרה ממחנה האימונים ב${k==='aut'?'אוסטריה':'קפריסין'}.`);if(k!=='home')paper('מועדון',`${c.name} ${k==='aut'?'באוסטריה':'בקפריסין'}: מחנה אימונים לפני העונה`,'שבוע של אימונים כפולים ומשחקי הכנה',`${pick(['המנג\'ר מרוצה מהכושר של השחקנים.','הרכש החדש השתלב מהר.','האווירה בקבוצה מצוינת.'])}`);save();return render()}
    if(t.closest('[data-job-accept]'))return acceptJob();if(t.closest('[data-job-decline]'))return declineJob();
    const pm=t.closest('[data-press]');if(pm){G.pressMode=pm.dataset.press;save();return render()}
    if(id==='toLineupBtn'||id==='toLineupBtn2'){G.view='lineup';lineupSel=null;return render()}
    if(id==='autoBtn')return autoPick();
    const cp=t.closest('[data-captain]');if(cp)return setCaptain(+cp.dataset.captain);
    if(id==='clearBtn'){const c=me();c.lineup=slotsFor(c.formation).map(()=>null);lineupSel=null;save();return render()}
    const mtb=t.closest('[data-mt]');if(mtb)return setMentality(mtb.dataset.mt);
    const mtab=t.closest('[data-mtab]');if(mtab){marketTab=mtab.dataset.mtab;return render()}
    const sg=t.closest('[data-sign]');if(sg){const p=(G.freeAgents||[]).find(x=>x.id===+sg.dataset.sign);if(!p)return;const d0=contractDemand(p);const after=wageBill(me())+d0.wage;const cap=ensureWageCap();return openModal(`<h3 class="sec">סיכום לפני חתימה · ${esc(fullName(p))}</h3><dl class="kv"><dt>דמי העברה</dt><dd>אין (שחקן חופשי)</dd><dt>בונוס חתימה</dt><dd class="num">${NIS(d0.bonus)}</dd><dt>שכר</dt><dd class="num">${NIS(d0.wage)}/שבוע · ${d0.years} שנים</dd><dt>תקציב שכר</dt><dd class="num" style="color:${after>cap?'var(--bad)':'inherit'}">${NIS(after)} / ${NIS(cap)}</dd></dl>${after>cap?'<div class="small" style="color:var(--bad)">חריגה מתקציב השכר: אמון ההנהלה ‎-3.</div>':''}<div class="actions" style="margin-top:10px"><button class="btn" id="faGo">אשר וחתום</button><button class="btn sec" data-close>ביטול</button></div>`,e=>{if(e.target.closest('#faGo')){closeModal();if(after>cap){G.board.conf=clamp(G.board.conf-3,0,100)}signFreeAgent(p.id)}})}
    if(G.view==='lineup'){const sl=t.closest('[data-slot]');if(sl)return lineupTapSlot(+sl.dataset.slot);const bn=t.closest('[data-bench]');if(bn)return lineupTapBench(+bn.dataset.bench)}
    if(id==='upAcad')return upgradeAcademy();
    if(id==='scout')return scoutYouth();
    if(id==='resetBtn')return confirmReset();
    if(id==='cineTacticsBtn'){const d=$('cineTactics');d.open=!d.open;if(d.open)d.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});return}
    if(id==='signBtn'){const c=me();paperMajor('מועדון',`${G.manager.name} חתם ב${c.name}`,`חוזה לשתי עונות · היעד: ${G.board.expectText}`,`${c.name} הציגה היום את המנג'ר החדש. ${pick(['"באתי כדי לנצח", אמר בטקס החתימה.','ההנהלה מבטיחה גיבוי בחלון ההעברות.','האוהדים הגיעו בהמוניהם למעמד החתימה.'])} השכר: ${NIS(G.manager.wage)} לשבוע.`,c.id,{type:'appoint',manager:G.manager.name,club:c.name,clubId:c.id,years:2,goal:G.board.expectText});G.phase='sponsor';save();return render()}
    if(id==='nextSeasonBtn')return proceedAfterSummary();
    if(id==='goYouth'){squadTab='youth';G.view='squad';return render()}
    const sp=t.closest('[data-sponsor]');if(sp)return chooseSponsor(+sp.dataset.sponsor);
    const job=t.closest('[data-job]');if(job)return takeJob(job.dataset.job);
    const st=t.closest('[data-st]');if(st){squadTab=st.dataset.st;if(G.view!=='squad')G.view='squad';return render()}
    const ss=t.closest('[data-ss]');if(ss){squadSort=ss.dataset.ss;return render()}
    const mp=t.closest('[data-mp]');if(mp){marketPos=mp.dataset.mp;return render()}
    const mc=t.closest('[data-mcat]');if(mc){marketCategory=mc.dataset.mcat;marketNat='all';return render()}
    const fc=t.closest('[data-fclear]');if(fc)return clearMarketFilter(fc.dataset.fclear);
    const sgx=t.closest('[data-msug]');if(sgx)return pickSuggest(+sgx.dataset.msug);
    const wav=t.closest('[data-wav]');if(wav){worldAvail=wav.dataset.wav;return render()}
    if(t.closest('[data-market-search-reset]')){marketSearch='';return render()}
    const ms=t.closest('[data-ms]');if(ms){marketSort=ms.dataset.ms;return render()}
    if(t.closest('[data-price-reset]')){marketPrice='all';marketPriceMin='';marketPriceMax='';return render()}
    const tt=t.closest('[data-tt]');if(tt){tableTab=tt.dataset.tt;return render()}
    const buy=t.closest('[data-buy]');if(buy){const [c,p]=buy.dataset.buy.split(':');return buyPlayer(c,+p)}
    const wl=t.closest('[data-wl]');if(wl){worldLg=wl.dataset.wl;worldClubId=null;ensureWorldLeague(worldLg);if(worldNat!=='all'&&!G.world[worldLg].clubs.some(cl=>cl.players.some(p=>p.nat===worldNat)))worldNat='all';return render()}
    const wc=t.closest('[data-wc]');if(wc){worldClubId=wc.dataset.wc==='all'?null:wc.dataset.wc;return render()}
    const wp=t.closest('[data-wp]');if(wp){worldPos=wp.dataset.wp;return render()}
    const wa=t.closest('[data-wa]');if(wa){mktAge=wa.dataset.wa;return render()}
    const ws=t.closest('[data-ws]');if(ws){worldSort=ws.dataset.ws;return render()}
    const wv=t.closest('[data-wview]');if(wv)return playerModalAny(+wv.dataset.wview);
    const ng=t.closest('[data-neg]');if(ng)return negModal(+ng.dataset.neg);
    const pl=t.closest('[data-plan]');if(pl){const [k,o]=pl.dataset.plan.split(':');return setPlan(k,o)}
    const so=t.closest('[data-staffopen]');if(so){G.staffOpen=G.staffOpen===so.dataset.staffopen?null:so.dataset.staffopen;return render()}
    const shh=t.closest('[data-staffhire]');if(shh){const [r,i]=shh.dataset.staffhire.split(':');return hireStaff(r,+i)}
    const sr=t.closest('[data-staffrefresh]');if(sr)return refreshStaffMarket(sr.dataset.staffrefresh);
    const sn=t.closest('[data-staffrenew]');if(sn)return renewStaff(sn.dataset.staffrenew);
    const sy=t.closest('[data-story]');if(sy){const [i,k]=sy.dataset.story.split(':');return storyChoose(+i,k)}
    const ch=t.closest('[data-chal]');if(ch){G.chal=G.chal||{};const S=G.chal[G.season]||(G.chal[G.season]={picked:[],done:[]});if(S.picked.length<3&&!S.picked.includes(ch.dataset.chal))S.picked.push(ch.dataset.chal);save();return render()}
    if(id==='resignBtn')return resignJob();
    const ct=t.closest('[data-ctab]');if(ct){clubTab=ct.dataset.ctab;return render()}
    if(id==='wsBtn')return setupWorkshop();if(id==='mentalBtn')return signMental();if(id==='mentalCancel')return cancelMental();
    const rh=t.closest('[data-rehab]');if(rh)return rehab(+rh.dataset.rehab);
    const ao=t.closest('[data-adok]');if(ao)return acceptAd(+ao.dataset.adok);const an=t.closest('[data-adno]');if(an)return declineAd(+an.dataset.adno);const ar=t.closest('[data-adrenew]');if(ar)return renewAd(+ar.dataset.adrenew);
    const rp=t.closest('[data-rep]');if(rp){const r=G.results[+rp.dataset.rep];if(r)return matchReportModal(r)}
    const wr=t.closest('[data-wrow]');if(wr)return playerModalAny(+wr.dataset.wrow);
    const sh=t.closest('[data-shire]');if(sh)return hireScout(+sh.dataset.shire);
    const sf=t.closest('[data-sfire]');if(sf)return fireScout(+sf.dataset.sfire);
    if(id==='upScout')return upgradeScouting();
    const bk=t.closest('[data-bank]');if(bk)return takeBankLoan(+bk.dataset.bank);
    const snd=t.closest('[data-snd]');if(snd){G.sound=snd.dataset.snd==='1';if(G.sound)SFX.click();save();return render()}
    const spd=t.closest('[data-spd]');if(spd){G.speed=+spd.dataset.spd;save();return render()}const rcl=t.closest('[data-recall]');if(rcl)return recallLoan(+rcl.dataset.recall);const ppre=t.closest('[data-plpre]');if(ppre){const mc=me();mc.plan=PLAN_PRESETS[ppre.dataset.plpre].d.slice();save();return render()}const dm=t.closest('[data-demo]');if(dm)return revealDemo(dm.dataset.demo);const pd=t.closest('[data-npdemo]');if(pd)return paperDemo(pd.dataset.npdemo);const npo=t.closest('[data-npopen]');if(npo&&+npo.dataset.npopen>=0)return openArchiveStory(+npo.dataset.npopen);const rd=t.closest('[data-rend]');if(rd){G.renderer=rd.dataset.rend;if(G.renderer!=='svg')loadPixi().then(()=>render());save();return render()}const mo=t.closest('[data-motion]');if(mo){G.motion=mo.dataset.motion;save();return render()}const ppo=t.closest('[data-ppon]');if(ppo){G.paperPopOff=ppo.dataset.ppon==='0';save();return render()}
    if(id==='switchCareer'){save();G=null;render();return}
    if(id==='adsAdmin'){G.view='club';clubTab='ads';return render()}
    const ad1=t.closest('[data-adsdemo]');if(ad1){G.adsDemo=ad1.dataset.adsdemo==='1';save();return render()}
    const ad2=t.closest('[data-adcons]');if(ad2){AdSvc.setConsent(ad2.dataset.adcons==='1');return render()}
    const ad3=t.closest('[data-adpause]');if(ad3){AdSvc.togglePause(ad3.dataset.adpause);return render()}
    const ad4=t.closest('[data-adclick]');if(ad4&&!t.closest('[data-adpause]')){AdSvc.click(ad4.dataset.adclick);toast('פרסומת להדגמה בלבד: אין יעד אמיתי');return}
    if(id==='deleteAll')return openModal(`<h3 class="sec">מחיקת כל הנתונים</h3><p class="small">כל הקריירות במכשיר הזה${cloud.ready?' וכל השמירות שלך בענן':''} יימחקו לצמיתות. אי אפשר לבטל.</p><div class="actions"><button class="btn danger" id="delAllGo">מחק הכל</button><button class="btn sec" data-close>ביטול</button></div>`,ev=>{if(ev.target.closest('#delAllGo')){closeModal();deleteAllData()}});
    if(id==='exportBtn')return exportSave();if(id==='photoCreditsBtn')return showPhotoCredits();if(id==='simNext')return simUntilMyMatch();if(id==='simSeason')return simSeason();
    if(id==='retrySave'){Promise.resolve(save()).then(ok=>toast(ok?'נשמר במכשיר':'השמירה נכשלה'));return}if(id==='recoverBackup')return openModal('<h3>לשחזר את הגיבוי הקודם?</h3><p>ההתקדמות הנוכחית תוחלף בגיבוי.</p><button class="btn" id="recoverGo">שחזר</button><button class="btn sec" data-close>ביטול</button>',e=>{if(e.target.closest('#recoverGo'))recoverBackup()});if(id==='cloudSave')return cloudSave();if(id==='cloudLoad')return cloudLoad();if(id==='cloudAuto'){G.autoCloud=!G.autoCloud;save();if(G.autoCloud)cloudSave(true);return render()}
    if(id==='sellNaming')return sellNaming();
    if(id==='refreshScouts'){const c=me();if(c.money<50000)return toast('אין מספיק תקציב');c.money-=50000;refreshScoutMarket();save();return render()}
    const pr=t.closest('[data-promote]');if(pr)return promoteYouth(+pr.dataset.promote);
    const ac=t.closest('[data-accept]');if(ac)return acceptOffer(+ac.dataset.accept);
    const rj=t.closest('[data-reject]');if(rj)return rejectOffer(+rj.dataset.reject);
    const co=t.closest('[data-counter]');if(co)return counterOffer(+co.dataset.counter);
    const fo=t.closest('[data-focus]');if(fo){me().focus=fo.dataset.focus;save();return render()}
    const it=t.closest('[data-int]');if(it){me().intensity=it.dataset.int;save();return render()}
    const sd=t.closest('[data-stad]');if(sd)return startStadium(+sd.dataset.stad);
    if(t.closest('[data-train]'))return startTraining();
    if(G.view==='squad'&&squadTab!=='youth'){const row=t.closest('[data-pid]');if(row)return playerModal(+row.dataset.pid)}
  };
  m.onsubmit=e=>{if(e.target.id==='marketPriceRange'){e.preventDefault();applyMarketPriceRange()}else if(e.target.id==='marketNameSearch'){e.preventDefault();if(suggestIdx>=0&&suggestItems[suggestIdx])return pickSuggest(suggestItems[suggestIdx].p.id);marketSearch=$('marketNameInput').value.trim();render()}};
  if(!m.__mfold){m.__mfold=1;m.addEventListener('toggle',e=>{if(e.target.matches&&e.target.matches('[data-mfold]'))marketFiltersOpen=e.target.open},true)}
  m.oninput=e=>{if(e.target.id==='marketNameInput')updateMarketSuggest(e.target);const vs=e.target.closest&&e.target.closest('[data-vol]');if(vs){G.vol=G.vol||{};G.vol[vs.dataset.vol]=+vs.value;audApplyVol();if(vs.dataset.vol==='sfx')SFX.click()}};
  m.onchange=e=>{const t=e.target;if(t.closest&&t.closest('[data-vol]')){save();return}if(t.id==='marketNatSel'){marketNat=t.value;return render()}if(t.id==='worldNatSel'){worldNat=t.value;return render()}if(t.id==='marketPrice'){if(['all','budget','custom',...MARKET_PRICE_LIMITS.map(String)].includes(t.value)){marketPrice=t.value;render()}return}const dp=t.closest&&t.closest('[data-dplan]');if(dp){const [pid,f]=dp.dataset.dplan.split(':');return setDevPlan(+pid,f,t.value)}if(t.id==='importFile'&&t.files&&t.files[0])return importSave(t.files[0]);const tc=t.closest('[data-tac]');if(tc){const c=me();c.tac=Object.assign({},tacOf(c),{[tc.dataset.tac]:tc.value});save();return render()}const rl=t.closest('[data-role]');if(rl){const p=me().players.find(x=>x.id===+rl.dataset.role);if(p){p.roleT=rl.value;save();render()}return}const sr=t.closest('[data-sregion]');if(sr)return setScoutRegion(+sr.dataset.sregion,sr.value);const sb=t.closest('[data-sbrief]');if(sb){const [id,key]=sb.dataset.sbrief.split(':');return setScoutBrief(+id,key,sb.value)}if(t.id==='formSel'){const mc=me();if(mc&&t.value!==mc.formation)mc.tacFam=Math.max(10,(mc.tacFam??60)-15);return setFormation(t.value)}const pd=t.closest&&t.closest('[data-plday]');if(pd){const mc=me();planOf(mc)[+pd.dataset.plday]=t.value;save();return render()}if(t.id==='ticketSel'){me().ticket=+t.value;save();return render()}};
  m.onkeydown=e=>{if(e.target.id==='marketNameInput'){if(e.key==='ArrowDown'){e.preventDefault();return moveSuggest(1)}if(e.key==='ArrowUp'){e.preventDefault();return moveSuggest(-1)}if(e.key==='Escape'){return closeMarketSuggest()}}if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[data-slot]')){e.preventDefault();e.target.click()}};
}
function playerModal(pid){
  const c=me();const p=c.players.find(x=>x.id===pid);if(!p)return;
  openModal(`<div class="pc-big">${playerCardSVG(p,c,{big:true,full:true,k:'m'})}</div>${portraitCreditHTML(p)}<div style="text-align:center;margin-top:6px"><h3 class="sec">${esc(fullName(p))}</h3><div class="muted small">${POSHE[p.pos]} · גיל ${p.age} · ${esc(p.nat)}${p.real?'':' · נתונים משוערים'}</div><div class="small" style="margin-top:4px">${PERS[p.pers||'professional'].icon} ${PERS[p.pers||'professional'].he}${p.listed?' · <span class="tag warn">ברשימת ההעברות</span>':''}${p.promise?' · <span class="tag info">הובטחו דקות</span>':''}</div></div>
  ${attrBars(p,false)}${dossierHTML(p,c,true)}
  <dl class="kv" style="margin-top:12px"><dt>פוטנציאל</dt><dd class="num">${p.pot}</dd><dt>שווי</dt><dd class="num">${NIS(p.value)}</dd><dt>שכר לשבוע</dt><dd class="num">${NIS(p.wage)}</dd><dt>כושר</dt><dd class="num"><bdi dir="ltr">${p.form>0?'+':''}${p.form.toFixed(1)}</bdi></dd><dt>הופעות / שערים</dt><dd class="num">${p.apps} / ${p.goals}</dd><dt>צהובים</dt><dd class="num">${p.yellow}</dd><dt>חוזה</dt><dd>עד קיץ ${contractYear(p)} (${p.contract} ${p.contract===1?'עונה':'עונות'})</dd>${p.role?`<dt>הובטח לו</dt><dd>${ROLE_HE[p.role]}</dd>`:''}${p.sellon?`<dt>סעיף מכירה</dt><dd>${p.sellon.pct}% ל${esc(p.sellon.to)}</dd>`:''}${p.loan?`<dt>השאלה</dt><dd>מ${esc(p.loan.fromName)} עד סוף העונה · אופציה ${NIS(p.loan.buy)}</dd>`:''}${p.caps?`<dt>נבחרת</dt><dd class="num">${p.caps} הופעות · ${p.intGoals||0} שערים</dd>`:''}${p.inj?`<dt>פציעה</dt><dd>עוד ${p.inj} שבועות</dd>`:''}${p.susp?`<dt>הרחקה</dt><dd>${p.susp} משחקים</dd>`:''}</dl>
  ${(()=>{const d=contractDemand(p);return `<div class="small" style="margin-top:10px;padding:8px 10px;border-radius:8px;background:var(--bg2)">הארכת חוזה: ${fullName(p).split(' ')[0]} דורש <b class="num">${NIS(d.wage)}</b> לשבוע ל-${d.years} ${d.years>1?'שנים':'שנה'} נוספות ובונוס חתימה של <b class="num">${NIS(d.bonus)}</b>.${p.contract<=1?' <span style="color:var(--warn)">בלי הארכה הוא יעזוב בקיץ כשחקן חופשי.</span>':''}</div>`})()}
  <div class="actions" style="margin-top:12px">${p.loan?`<button class="btn" data-buyopt="${p.id}">קנה · ${NIS(p.loan.buy)}</button>`:''}<button class="btn sec" data-talk-open="${p.id}">שיחה</button><button class="btn sec" data-captain="${p.id}" ${isCaptain(c,p)?'disabled':''}>${isCaptain(c,p)?'הקפטן':'מנה לקפטן'}</button><button class="btn" data-renew="${p.id}" ${p.contract>=5?'disabled':''}>הארך חוזה</button>${p.loan?'':`<button class="btn sec" data-loanout="${p.id}" ${WINDOW(G.wk)?'':'disabled'}>השאל</button>`}<button class="btn danger" data-sell="${p.id}" ${WINDOW(G.wk)?'':'disabled'}>מכור · ${NIS(Math.round(p.value*.8/1e4)*1e4)}</button><button class="btn sec" data-close>סגור</button></div>`);
}
function openModal(inner,onclick){const d=document.createElement('div');d.className='modal';d.id='modal';d.innerHTML=`<div class="card">${inner}</div>`;document.body.appendChild(d);
  d.onchange=e=>{const dp=e.target.closest&&e.target.closest('[data-dplan]');if(dp){const [pid,f]=dp.dataset.dplan.split(':');setDevPlan(+pid,f,e.target.value)}};
  d.onclick=e=>{if(e.target===d&&!d.dataset.lock)return closeModal();if(e.target.closest('[data-close]'))return closeModal();const s=e.target.closest('[data-sell]');if(s)return sellPlayer(+s.dataset.sell);const lo=e.target.closest('[data-loanout]');if(lo)return loanOutModal(+lo.dataset.loanout);const rn=e.target.closest('[data-renew]');if(rn)return renewContract(+rn.dataset.renew);const cpb=e.target.closest('[data-captain]');if(cpb)return setCaptain(+cpb.dataset.captain);const tk=e.target.closest('[data-talk-open]');if(tk){closeModal();return talkModal(+tk.dataset.talkOpen)}const bo2=e.target.closest('[data-buyopt]');if(bo2)return exerciseBuy(+bo2.dataset.buyopt);const sn=e.target.closest('[data-startneg]');if(sn)return startNegotiation(+sn.dataset.startneg);const qs=e.target.closest('[data-qscout]');if(qs)return quickScout(+qs.dataset.qscout);const ngm=e.target.closest('[data-neg]');if(ngm){closeModal();return negModal(+ngm.dataset.neg)}const nr=e.target.closest('[data-newgame]');if(nr){closeModal();deleteSlot(curSlot());G=null;render();return}if(onclick)onclick(e)};return d}
function closeModal(){const d=$('modal');if(d)d.remove()}
function confirmReset(){openModal(`<h3 class="sec">להתחיל משחק חדש?</h3><p class="muted">השמירה הנוכחית תימחק.</p><div class="actions"><button class="btn danger" data-newgame>כן, מחק והתחל</button><button class="btn sec" data-close>ביטול</button></div>`)}

