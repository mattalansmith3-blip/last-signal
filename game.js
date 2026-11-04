'use strict';
const $=s=>document.querySelector(s);
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const wpick=w=>{let s=w.reduce((a,b)=>a+b,0),r=Math.random()*s;for(let i=0;i<w.length;i++){r-=w[i];if(r<0)return i}return w.length-1};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const IMG=id=>'img/'+id+'.webp';
let G=null, META=JSON.parse(localStorage.getItem('ls_meta')||'{"pts":0,"runs":0,"best":0,"wins":0,"journal":[]}');
let uid=1;
const saveMeta=()=>localStorage.setItem('ls_meta',JSON.stringify(META));
const save=()=>{if(G&&!G.over)localStorage.setItem('ls_run',JSON.stringify(G));};
function mk(id,r){const d=ITEMS[id];if(r==null)r=d.t;const it={id,r,u:uid++};if(d.a)it.q=Math.round(R(d.q[0],d.q[1])*(1+r*.25));return it;}
function st(it,k){const d=ITEMS[it.id];const v=d[k]||0;if(k==='dmg'||k==='ar')return Math.round(v*RMUL[it.r]);if(k==='cap')return v?v+(d.s==='back'?it.r*2:0):0;return v;}
function iname(it){const d=ITEMS[it.id];return (d.s&&it.r>d.t?['','Sturdy ','Tuned ','Elite ','Legendary '][it.r]:'')+d.n}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),1600)}
const night=()=>G.hour>=20||G.hour<6;
// ---------- player stats
function eq(s){return G.eq[s]}
function armor(){return ['head','body','legs'].reduce((a,s)=>a+(eq(s)?st(eq(s),'ar'):0),0)}
function stealth(){let v=['head','body','legs'].reduce((a,s)=>a+(eq(s)?st(eq(s),'st'):0),0);if(night()&&!(eq('head')&&ITEMS[eq('head').id].nv))v-=3;if(night()&&eq('head')&&ITEMS[eq('head').id].nv)v+=2;return v}
function capacity(){return 4+(eq('back')?st(eq('back'),'cap'):0)+(eq('legs')?st(eq('legs'),'cap'):0)}
function ammoOf(t){return G.inv.filter(i=>i.id===t).reduce((a,i)=>a+i.q,0)}
function useAmmo(t,n){for(const i of G.inv)if(i.id===t&&n>0){const k=Math.min(i.q,n);i.q-=k;n-=k}G.inv=G.inv.filter(i=>!ITEMS[i.id].a||i.q>0)}
function invCount(){return G.inv.filter(i=>!ITEMS[i.id].p).length}
// ---------- world gen
function genLoot(ct,loc,depth){const c=CT[ct];const n=R(c.k[0],c.k[1]);const out=[];const L=LOC[loc];
 for(let i=0;i<n;i++){const cap=[2,3,4,4][L.d];let r=wpick(c.w.map((w,j)=>j>cap?0:w*(j<=1?1:j===2?1+depth*.1:j===3?.35+depth*.13:(L.d<3?.15:.3)+depth*.08)));if(r<0)r=0;
  const cat=Math.random()<.55?pick(L.bias):pick(['food','heal','melee','ammo','body','head','legs','back','secondary','primary','tool','food','ammo']);
  let pool=Object.keys(ITEMS).filter(k=>{const d=ITEMS[k];if(d.p)return false;const cc=d.s||d.u||(d.a?'ammo':'');return cc===cat||(cat==='bomb'&&d.u==='bomb')});
  if(cat==='tool'&&Math.random()<.3)pool=['molotov'];
  let ok=pool.filter(k=>ITEMS[k].t<=r);if(!ok.length){ok=pool;}
  const best=ok.filter(k=>ITEMS[k].t>=r-1);const id=pick(best.length?best:ok);
  out.push(mk(id,Math.max(r,ITEMS[id].t)));}
 return out}
function newRun(kit){uid=1;const K=KITS[kit];
 G={day:1,hour:8,hp:100,hun:10,noise:0,signal:0,at:'suburbs',kills:0,searched:0,started:Date.now(),eq:{},inv:[],locs:{},hordes:[],installed:0,log:[],kit};
 for(const id of K.items){const it=mk(id);const d=ITEMS[id];if(d.s&&!G.eq[d.s])G.eq[d.s]=it;else G.inv.push(it)}
 const partIds=['circuit','tube','coil','battery','walkie'];
 for(const k in LOC){const L=LOC[k];const rooms=L.rooms.map((nm,i)=>{const depth=i+L.d;const nc=L.tower?R(1,2):R(1,3);const spots=[];
   for(let j=0;j<nc;j++){const ct=i===L.rooms.length-1&&j===0?(Math.random()<.5?'safe':'chest'):pick(i<2?['crate','crate','lockbox']:['crate','lockbox','lockbox','safe','chest']);spots.push({ct,open:0,loot:genLoot(ct,k,depth)})}
   const nz=k==='suburbs'&&i===0?0:R(i<2?(L.d?1:0):1,Math.min(4,1+Math.floor((i+L.d)/1.6)));
   return {n:nm,spots,z:Array.from({length:nz},()=>mkZ(pick(L.z),L.d)),clock:R(4,7)}});
  if(!L.tower){for(let p=0;p<2;p++){const ri=R(Math.min(2,rooms.length-1),rooms.length-1);const sp=rooms[ri].spots;pick(sp).loot.push(mk(partIds[(Object.keys(LOC).indexOf(k)*2+p)%5],3))}}
  G.locs[k]={rooms,cur:0,visited:k==='suburbs'}}
 // starter: guarantee first room of suburbs is a crate with food and a weapon
 G.locs.suburbs.rooms[0].spots=[{ct:'crate',open:0,loot:[mk('bar'),mk('bat',1),mk('cap'),mk('water')]}];
 G.hordes=[{e:3,p:.5},{e:6,p:.5},{e:9,p:.5}];
 META.runs++;saveMeta();save();showMap();addLog('Day one of the rest of your life. No alarm, no commute, no inbox. The old radio crackles: "...Echo Hill tower... twelve parts... and we can all go somewhere nice..."','gold');}
function mkZ(t,dd){const d=dd!=null?dd:(G&&G.at?LOC[G.at].d:0);return {t,hp:Math.round(ZT[t].hp*(1+d*.25+(G?G.day*.05:0))),aw:0}}
function addLog(t,c){G.log.push([t,c||'']);if(G.log.length>60)G.log.shift()}
// ---------- time
function passTime(h,quiet){for(let i=0;i<h;i++){G.hour++;if(G.hour>=24){G.hour=0;G.day++;toast('Day '+G.day)}G.hun=clamp(G.hun+(quiet?2:3),0,100);G.noise=clamp(G.noise-8,0,100);if(G.hun>=85){G.hp-=3}}
 if(G.hp<=0)return die('Starvation took you on day '+G.day+'.');}
// ---------- render helpers
function hud(){return `<div class="hud">
 <div class="meter"><img src="${IMG('medkit')}"><div class="bar red"><i style="width:calc((100% - 10px)*${G.hp/100})"></i></div><span>${Math.max(0,Math.round(G.hp))}</span></div>
 <div class="meter"><img src="${IMG('can')}"><div class="bar"><i style="width:calc((100% - 10px)*${G.hun/100})"></i></div><span>${G.hun>=70?'<b style=color:#c0392b>'+Math.round(G.hun)+'</b>':Math.round(G.hun)}</span></div>
 <div class="meter"><img class="glow" src="${IMG('noise')}"><div class="bar vio"><i style="width:calc((100% - 10px)*${G.noise/100})"></i></div></div>
 <div class="meter"><img class="glow" src="${IMG('signal')}"><span style="color:#ffd08a">${G.installed}/12</span></div>
 <div class="sp"></div><div class="day">Day ${G.day} · ${String(G.hour).padStart(2,'0')}:00${night()?' ☾':''}</div></div>`}
function ov(html,cls){const o=$('#ov');o.innerHTML=`<div class="panel ${cls||'dlg'}">${html}</div>`;o.classList.add('on');}
function closeOv(){$('#ov').classList.remove('on');$('#ov').innerHTML=''}
// ---------- title
function showTitle(){const has=localStorage.getItem('ls_run');
 const kits=KITS.map((k,i)=>`<button class="btn ${i===0?'':''}" data-kit="${i}" ${META.pts>=k.need?'':'disabled'}>${k.n}<small>${META.pts>=k.need?k.items.slice(0,3).map(x=>ITEMS[x].n).join(', '):'Unlock at '+k.need+' journal pts'}</small></button>`).join('');
 $('#app').innerHTML=`<div class="screen" id="title"><h1>LAST SIGNAL</h1><div class="sub">The world ended. So did rent, rush hour and Monday meetings.<br>The tower on Echo Hill can still reach the others out there. Find twelve radio parts and send the signal.</div>
 <div class="menu">${has?'<button class="btn hot" id="cont">Continue Run</button>':''}<button class="btn ${has?'':'hot'}" id="new">New Run</button></div>
 <div class="legacy">Journal: ${META.pts} pts · Runs ${META.runs} · Best signal ${META.best}/12 · Rescues ${META.wins}</div></div>`;
 if(has)$('#cont').onclick=()=>{G=JSON.parse(has);uid=1e6;showMap()};
 $('#new').onclick=()=>ov(`<h2>Choose your start</h2><p>Each death writes to your journal and unlocks better starts.</p><div class="row">${kits}</div><div class="row"><button class="btn" id="x">Back</button></div>`);
 $('#ov').onclick=e=>{const k=e.target.closest('[data-kit]');if(k&&!k.disabled){closeOv();newRun(+k.dataset.kit)}if(e.target.id==='x')closeOv()};}
// ---------- map
function adj(a){return EDGES.map((e,i)=>[e,i]).filter(([e])=>e[0]===a||e[1]===a).map(([e,i])=>({to:e[0]===a?e[1]:e[0],h:e[2],i}))}
function locDone(k){const l=G.locs[k];return l.rooms.every(r=>!r.z.length&&r.spots.every(s=>s.open))}
function showMap(){closeOv();$('#ov').onclick=null;G.scr='map';save();
 const ad=adj(G.at).map(a=>a.to);
 let nodes='';for(const k in LOC){const L=LOC[k];const cls=(k===G.at?'here':'')+(ad.includes(k)?' reach':'')+(locDone(k)&&!L.tower?' done':'');
  nodes+=`<div class="node ${cls}" data-n="${k}" style="left:${L.x}%;top:${L.y}%"><img class="glow" src="${IMG('pin')}"><span>${L.n}${G.locs[k].visited?'':' ?'}</span></div>`}
 let hz='';for(const h of G.hordes){const e=EDGES[h.e];const a=LOC[e[0]],b=LOC[e[1]];hz+=`<img class="horde" src="${IMG('horde')}" style="left:${a.x+(b.x-a.x)*h.p}%;top:${a.y-4+(b.y-a.y)*h.p}%">`}
 $('#app').innerHTML=`<div class="screen">${hud()}<div id="mapwrap"><div id="map">${nodes}${hz}</div></div>
 <div class="mapbar"><button class="btn hot" id="enter">Enter ${LOC[G.at].n}</button><button class="btn" id="gear">Gear</button><button class="btn" id="rest">Rest 6h</button><button class="btn" id="menu">Menu</button></div></div>`;
 const here=$('.node.here');if(here){const w=$('#mapwrap');w.scrollLeft=here.offsetLeft-w.clientWidth/2}
 $('#map').onclick=e=>{const n=e.target.closest('.node');if(n)nodeInfo(n.dataset.n)};
 $('#enter').onclick=()=>enterLoc();$('#gear').onclick=()=>showGear();$('#rest').onclick=rest;
 $('#menu').onclick=()=>ov(`<h2>Paused</h2><p>Your run is saved automatically.</p><div class="row"><button class="btn" id="q">Title Screen</button><button class="btn" id="ab">Abandon Run</button><button class="btn hot" id="r">Resume</button></div>`);
 $('#ov').onclick=e=>{if(e.target.id==='r')closeOv();if(e.target.id==='q'){closeOv();showTitle()}if(e.target.id==='ab'){closeOv();die('You walked into the dark and did not come back.')}};}
function rest(){passTime(6,1);if(G.over)return;G.hp=clamp(G.hp+18,0,100);addLog('You nap in a sunbeam behind a barricade. Nobody schedules a meeting. +18 HP.','good');if(Math.random()<.2+G.noise/200){const d=R(6,14);G.hp-=d;addLog(`A sleepwalker of the worst kind found your hideout. -${d} HP.`,'bad');if(G.hp<=0)return die('Overrun while sleeping on day '+G.day+'.')}
 if(Math.random()<.25){shiftHordes(1);}toast('Rested · +18 HP');showMap()}
function nodeInfo(k){const L=LOC[k],l=G.locs[k];const a=adj(G.at).find(x=>x.to===k);
 const parts=L.tower?'Install radio parts here':(l.visited?`${l.rooms.filter(r=>r.spots.some(s=>!s.open)).length} rooms with loot left`:'Unexplored');
 const hord=a&&G.hordes.some(h=>h.e===a.i);const dz=['Low','Moderate','High','Deadly'][L.d];
 ov(`<h2>${L.n}</h2><img src="img/bg_${L.bg}.jpg" style="width:100%;max-height:30vh;object-fit:cover;border-radius:4px;margin-top:6px"><p>Danger: ${dz} · ${parts}${hord?'<br><b style="color:#c0392b">A horde is on this road.</b>':''}</p>
 <div class="row">${k===G.at?'<button class="btn hot" id="go2">Enter</button>':a?`<button class="btn hot" id="go">Travel<small>${a.h}h · +${a.h*3} hunger</small></button>`:'<p>No direct road from here.</p>'}<button class="btn" id="x">Close</button></div>`);
 $('#ov').onclick=e=>{if(e.target.closest('#go'))travel(a);if(e.target.closest('#go2'))enterLoc();if(e.target.id==='x')closeOv()}}
function shiftHordes(toward){for(const h of G.hordes){const e=EDGES[h.e];const ends=[e[0],e[1]];let nb=[];for(const en of ends)nb.push(...adj(en).map(x=>x.i));nb=nb.filter(i=>i!==h.e);
  if(toward&&G.noise>30){const near=adj(G.at).map(x=>x.i);const c=nb.filter(i=>near.includes(i));if(c.length&&Math.random()<.7){h.e=pick(c);h.p=R(3,7)/10;continue}}
  if(Math.random()<.6){h.e=pick(nb);h.p=R(3,7)/10}}}
function travel(a){closeOv();shiftHordes(1);const amb=G.hordes.find(h=>h.e===a.i);passTime(a.h);if(G.over)return;G.at=a.to;G.locs[a.to].visited=1;addLog(`You stroll to ${LOC[a.to].n}. Zero traffic.`);
 if(amb){G.amb={hi:G.hordes.indexOf(amb),z:Array.from({length:R(2,3)+(G.day>3?1:0)},()=>Object.assign(mkZ(pick(['walker','walker','runner','crawler'])),{aw:1}))};enterAmbush()}else{save();showMap();}}
// ---------- encounter
let wsel='melee';
function curRoom(){if(G.amb)return {n:'Ambush on the Road',spots:[],z:G.amb.z,clock:99,amb:1};const l=G.locs[G.at];return l.rooms[l.cur]}
function enterAmbush(){G.scr='enc';addLog('Uh-oh. A crowd shambles out of the tall grass. Not the fun kind of crowd.','bad');renderEnc()}
function enterLoc(){closeOv();const l=G.locs[G.at];l.visited=1;if(l.cur>=l.rooms.length)l.cur=l.rooms.length-1;G.scr='enc';addLog(`You slip into ${LOC[G.at].n}: ${curRoom().n}.`);
 if(night())for(const r of l.rooms)if(r.z.length&&Math.random()<.4&&!r._n){r.z.push(mkZ(pick(LOC[G.at].z)));r._n=1}renderEnc()}
function weapons(){const w=[];if(eq('melee'))w.push(['melee',eq('melee')]);else w.push(['melee',{id:'fists',r:0}]);if(eq('secondary'))w.push(['secondary',eq('secondary')]);if(eq('primary'))w.push(['primary',eq('primary')]);return w}
function wStats(slot){const it=slot==='melee'&&!eq('melee')?null:eq(slot);if(!it)return {dmg:5,acc:70,nz:1,burst:1,am:null,n:'Fists'};const d=ITEMS[it.id];return {dmg:st(it,'dmg'),acc:(d.am?74:66)+(d.acc||0)+it.r*3,nz:d.nz,burst:d.burst||1,am:d.am,n:iname(it)}}
function odds(z,slot){const w=wStats(slot);const sneak=!z.aw&&!w.am?2:1;const hp=z.hp;let p=0;const acc=clamp(w.acc+(z.aw?0:12),5,97)/100;
 // monte-ish analytic: each burst hit dmg*U(0.8,1.2)
 const need=hp/(w.dmg*sneak);let ph=0;for(let b=1;b<=w.burst;b++){const comb=binom(w.burst,b)*Math.pow(acc,b)*Math.pow(1-acc,w.burst-b);const per=need/b;const pk=per<=.8?1:per>=1.2?0:(1.2-per)/.4;ph+=comb*pk}return Math.round(ph*100)}
function binom(n,k){let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r}
function incoming(room){const ar=armor();return room.z.filter(z=>z.aw).reduce((a,z)=>a+ZT[z.t].hit/100*Math.max(1,ZT[z.t].dmg-ar*.3),0)}
function sneakOdds(room){const l=G.locs[G.at];const last=!G.amb&&l.cur>=l.rooms.length-1;if(G.amb)return clamp(45+stealth()*5-room.z.length*8,5,90);return clamp(80+stealth()*6-room.z.filter(z=>z.aw).length*28-room.z.filter(z=>!z.aw).length*8,5,95)}
function renderEnc(fx){const room=curRoom();const L=LOC[G.at];const l=G.locs[G.at];
 if(!weapons().some(w=>w[0]===wsel))wsel='melee';
 const zs=room.z.map((z,i)=>`<div class="z ${z.aw?'aw':''} ${fx&&fx.hit===i?'hit':''}" data-z="${i}"><b>${ZT[z.t].n}<br>${Math.max(0,Math.round(z.hp))} hp${z.aw?'':' · unaware'}</b><img src="${IMG(ZT[z.t].img)}"></div>`).join('');
 const sp=room.spots.map((s,i)=>`<img class="spot ${s.open?'open':'pulse'}" data-s="${i}" src="${IMG(s.ct+(s.open?'_open':''))}">`).join('');
 const t0=room.z[0];const ws=weapons().map(([s,it])=>{const w=wStats(s);return `<button data-w="${s}" class="${wsel===s?'on':''}"><img src="${it.id==='fists'?IMG('bandage'):IMG(it.id)}"><span>${w.n}<br>${w.am?ammoOf(w.am)+' rds':'quiet'}</span></button>`}).join('');
 const k=t0?odds(t0,wsel):0;const inc=incoming(room);
 const last=G.amb||l.cur>=l.rooms.length-1;const clear=!room.z.length;
 const logs=G.log.slice(-14).map(([t,c])=>`<p class="${c}">${t}</p>`).join('');
 const ammoOk=!wStats(wsel).am||ammoOf(wStats(wsel).am)>0;
 $('#app').innerHTML=`<div class="screen" id="enc">${hud()}<div class="scene" style="background-image:linear-gradient(#3a230f55,#0000 25%,#0000 75%,#3a230f66),url(img/bg_${G.amb?'road':L.bg}.jpg)">
 <div class="roomtitle">${G.amb?'Ambush!':L.n}<small>${room.n}${G.amb?'':' · room '+(l.cur+1)+'/'+l.rooms.length}${room.z.length&&!G.amb?' · more arrive in '+room.clock+' turns':''}</small></div>
 <div class="spots">${sp}</div><div class="zs">${zs}</div></div>
 <div class="side panel"><div class="log" id="log">${logs}</div>
 ${room.z.length?`<div class="wsel">${ws}</div><div style="font-size:12px;text-align:center">Kill chance <b style="color:#b8650f">${ammoOk?k:0}%</b>${t0&&k<50?' (~'+Math.ceil(t0.hp/(wStats(wsel).dmg*wStats(wsel).burst*(!t0.aw&&!wStats(wsel).am?2:1)))+' hits)':''} · Expected damage/turn <b style="color:#c0392b">${inc.toFixed(1)}</b> · Sneak <b>${sneakOdds(room)}%</b></div>`:''}
 <div class="acts">
 ${room.z.length?`<button class="btn hot" id="fight" ${ammoOk?'':'disabled'}>Fight<small>${t0?ZT[t0.t].n:''}</small></button>`:''}
 ${room.spots.some(s=>!s.open)?`<button class="btn ${room.z.length?'':'hot'}" id="search">Search<small>${room.spots.filter(s=>!s.open).length} container(s)</small></button>`:''}
 ${G.amb?`<button class="btn" id="run">Run<small>${sneakOdds(room)}% clean</small></button>`:(!last?(clear?`<button class="btn ${room.spots.some(s=>!s.open)?'':'hot'}" id="next">Next Room<small>${l.rooms[l.cur+1].n}</small></button>`:`<button class="btn" id="sneak">Sneak Past<small>${sneakOdds(room)}%</small></button>`):'')}
 ${L.tower&&!G.amb&&clear&&last?`<button class="btn hot" id="install">${G.installed>=12?'Broadcast':'Install Parts'}<small>${G.inv.filter(i=>ITEMS[i.id].p).length} in pack</small></button>`:''}
 ${!G.amb&&l.cur>0&&clear?`<button class="btn" id="back">Prev Room</button>`:''}
 <button class="btn" id="items">Use Item</button><button class="btn" id="gear">Gear</button>
 ${G.amb?'':`<button class="btn" id="leave">Leave<small>to map</small></button>`}
 </div></div></div>`;
 const lg=$('#log');lg.scrollTop=lg.scrollHeight;
 const on=(id,f)=>{const e=$('#'+id);if(e)e.onclick=f};
 on('fight',fight);on('search',()=>search(room.spots.findIndex(s=>!s.open)));on('next',()=>{l.cur++;addLog('You move on: '+curRoom().n+'.');save();renderEnc()});on('back',()=>{l.cur--;renderEnc()});
 on('sneak',sneak);on('leave',leave);on('items',useMenu);on('gear',()=>showGear());on('run',runAway);on('install',install);
 document.querySelectorAll('.wsel button').forEach(b=>b.onclick=()=>{wsel=b.dataset.w;renderEnc()});
 document.querySelectorAll('.spot').forEach(b=>b.onclick=()=>{const s=room.spots[+b.dataset.s];if(!s.open)search(+b.dataset.s)});
 save();}
function endTurn(room,nz){if(G.over)return;G.noise=clamp(G.noise+nz,0,100);
 for(const z of room.z){if(!z.aw&&Math.random()*100<12+nz*1.5+G.noise*.15){z.aw=1;addLog(`The ${ZT[z.t].n.toLowerCase()} notices you!`,'bad')}}
 const ar=armor();for(const z of room.z)if(z.aw){const T=ZT[z.t];if(Math.random()*100<T.hit){const d=Math.max(1,Math.round(T.dmg*(1.0+LOC[G.at].d*.2+G.day*.03)*(.8+Math.random()*.4)-ar*.3));G.hp-=d;addLog(`${T.n} hits you for ${d}.`,'bad')}else addLog(`${T.n} grabs at you and misses.`)}
 G.hun=clamp(G.hun+.7,0,100);G.tt=(G.tt||0)+1;if(G.tt>=6){G.tt=0;G.hour++;if(G.hour>=24){G.hour=0;G.day++}G.noise=clamp(G.noise-4,0,100)}
 if(!room.amb&&!room.wave&&(room.z.length||room.spots.some(s=>!s.open))){room.clock-=1+(nz>15?1:0);if(room.clock<=0){room.clock=R(4,7);const L=LOC[G.at];const t=pick(L.z);room.z.push(Object.assign(mkZ(t),{aw:G.noise>30?1:0}));addLog(`A ${ZT[t].n.toLowerCase()} shuffles in${G.noise>30?', drawn by the noise':''}.`,'bad')}}
 if(G.hp<=0)return die(`Killed by the dead in ${G.amb?'a roadside ambush':LOC[G.at].n} on day ${G.day}.`);}
function fight(){const room=curRoom();const z=room.z[0];if(!z)return;const w=wStats(wsel);
 if(w.am){if(ammoOf(w.am)<1)return toast('No ammo');}
 let dealt=0;const sneakA=!z.aw&&!w.am;for(let b=0;b<w.burst;b++){if(w.am){if(ammoOf(w.am)<1)break;useAmmo(w.am,1)}if(Math.random()*100<clamp(w.acc+(z.aw?0:12),5,97)){dealt+=w.dmg*(.8+Math.random()*.4)*(sneakA?2:1)}}
 dealt=Math.round(dealt);z.hp-=dealt;
 if(dealt)addLog(`${sneakA?'Sneak attack! ':''}You hit the ${ZT[z.t].n.toLowerCase()} for ${dealt}.`);else addLog('You miss.','bad');
 for(const o of room.z)if(w.nz>15&&Math.random()<.7)o.aw=1; z.aw=1;
 let killed=false;if(z.hp<=0){room.z.shift();G.kills++;killed=true;addLog(`The ${ZT[z.t].n.toLowerCase()} drops.`,'good')}
 endTurn(room,w.nz);if(G.over)return;
 if(room.amb&&!room.z.length){addLog('You clear the road. The birds start singing again.','good');clearAmb();return renderEnc2map()}
 renderEnc({hit:killed?-1:0})}
function clearAmb(){const h=G.hordes[G.amb.hi];if(h){h.e=R(0,EDGES.length-1);h.p=.5}G.amb=null;save()}
function renderEnc2map(){toast('Survived the ambush');showMap()}
function runAway(){const room=curRoom();if(Math.random()*100<sneakOdds(room)){addLog('You break through the horde and run.','good')}else{const ar=armor();let d=0;for(const z of room.z)d+=Math.max(1,ZT[z.t].dmg-ar*.3);d=Math.round(d);G.hp-=d;addLog(`They claw at you as you run. -${d} HP.`,'bad');if(G.hp<=0)return die('Dragged down on the open road on day '+G.day+'.')}
 G.amb=null;save();showMap()}
function sneak(){const room=curRoom();const l=G.locs[G.at];if(Math.random()*100<sneakOdds(room)){addLog('You tiptoe past. Years of dodging your manager pay off.','good');l.cur++;G.noise=clamp(G.noise+2,0,100);save();renderEnc()}else{for(const z of room.z)z.aw=1;addLog('A board creaks. They turn toward you!','bad');endTurn(room,6);if(!G.over)renderEnc()}}
function leave(){const room=curRoom();if(room.z.some(z=>z.aw)){const ar=armor();for(const z of room.z)if(z.aw&&Math.random()<.5){const d=Math.max(1,ZT[z.t].dmg-Math.round(ar*.3));G.hp-=d;addLog(`${ZT[z.t].n} catches you on the way out. -${d}`,'bad')}if(G.hp<=0)return die('Cut off while retreating from '+LOC[G.at].n+'.')}
 if(G.final&&G.at==='tower'){G.final=0;const rr=curRoom();rr.z=[];rr.wave=0;addLog('You abandon the broadcast. You can try again.','bad')}passTime(1);if(G.over)return;addLog('You head back outside. Lovely weather, at least.');showMap()}
function useMenu(){const us=G.inv.filter(i=>ITEMS[i.id].u&&ITEMS[i.id].u!=='tool');if(!us.length)return toast('Nothing usable');
 ov(`<h2>Use Item</h2><div class="grid" style="justify-content:center;margin:8px auto">${us.map(i=>`<div class="cell r${i.r}" data-u="${i.u}"><img src="${IMG(i.id)}"></div>`).join('')}</div><p id="uinfo">Tap an item. Using one takes a turn in a fight.</p><div class="row"><button class="btn" id="x">Close</button></div>`);
 $('#ov').onclick=e=>{const c=e.target.closest('[data-u]');if(c){useItem(+c.dataset.u);}if(e.target.id==='x')closeOv()}}
function useItem(u,fromGear){const it=G.inv.find(i=>i.u===u);if(!it)return;const d=ITEMS[it.id];const room=G.scr==='enc'?curRoom():null;
 if(d.u==='food'){G.hun=clamp(G.hun-Math.round(d.v*RMUL[it.r]),0,100);if(d.hp)G.hp=clamp(G.hp+d.hp,0,100);addLog(`You eat: ${d.n}.`,'good')}
 else if(d.u==='heal'){G.hp=clamp(G.hp+Math.round(d.v*RMUL[it.r]),0,100);addLog(`You use ${d.n}.`,'good')}
 else if(d.u==='bomb'){if(!room||!room.z.length)return toast('Save it for a fight');const n=room.z.length;G.kills+=n;room.z=[];addLog(`The molotov engulfs ${n} of them!`,'gold');G.noise=clamp(G.noise+30,0,100)}
 else return;G.inv=G.inv.filter(i=>i!==it);closeOv();
 if(room&&room.z.length){endTurn(room,0);if(G.over)return}
 if(room&&room.amb&&!room.z.length){clearAmb();return renderEnc2map()}
 if(fromGear)return showGear();G.scr==='enc'?renderEnc():showMap()}
// ---------- containers
function search(i){const room=curRoom();const s=room.spots[i];if(!s||s.open)return;const C=CT[s.ct];let nz=C.nz,turns=1,how='';
 if(C.lock){const tool=G.inv.find(x=>x.id===C.lock);const pry=eq('melee')&&ITEMS[eq('melee').id].pry;
  if(tool){G.inv=G.inv.filter(x=>x!==tool);how=s.ct==='safe'?'The keycard blinks green.':'The lock clicks open.'}
  else if(s.ct==='lockbox'&&pry){nz+=14;turns=1;how='You pry it open with a screech of metal.'}
  else{nz+=s.ct==='safe'?20:14;turns=s.ct==='safe'?3:2;how=s.ct==='safe'?'No keycard. You hammer at the hinges for a long time.':'You bash the lock off.'}}
 if(how)addLog(how,turns>1?'bad':'');
 for(let t=0;t<turns;t++){endTurn(room,Math.round(nz/turns));if(G.over)return}
 s.open=1;G.searched++;reveal(s,room)}
function reveal(s,room){const C=CT[s.ct];const loot=s.loot;
 ov(`<div class="cbox"><img id="cimg" class="sh" src="${IMG(s.ct)}"><h3>${C.n}</h3><div class="info" id="rinfo">Opening...</div></div>
 <div><div class="grid" id="rgrid">${Array.from({length:Math.max(8,loot.length)},(_,i)=>`<div class="cell ${i<loot.length?'unk':''}" data-i="${i}"></div>`).join('')}</div>
 <div class="row"><button class="btn hot" id="takeall" disabled>Take All</button><button class="btn" id="done" disabled>Done</button></div><div style="font-size:12px;text-align:center" id="cap"></div></div>`,'reveal');
 const tok=Math.random();$('#ov').dataset.tok=tok;const alive=()=>$('#ov').dataset.tok==tok&&$('#takeall');
 let sel=null;
 const capTxt=()=>{$('#cap').textContent=`Backpack ${invCount()}/${capacity()}`};capTxt();
 setTimeout(()=>{const im=$('#cimg');if(!im||!alive())return;im.src=IMG(s.ct+'_open');im.className='op';let k=0;
  const step=()=>{if(!alive())return;const c=document.querySelector(`#rgrid [data-i="${k}"]`);if(!c||k>=loot.length){$('#takeall').disabled=false;$('#done').disabled=false;$('#rinfo').innerHTML='Tap an item to inspect it.';return}
   const it=loot[k];c.className=`cell pop r${it.r}`;c.innerHTML=`<img src="${IMG(it.id)}">${it.q?`<span class="q">${it.q}</span>`:''}`;
   if(ITEMS[it.id].p){toast('RADIO PART FOUND!');}else if(it.r>=3)toast(RAR[it.r]+'!');
   k++;setTimeout(step,it.r>=3?650:380)};step()},700);
 const refresh=()=>{const g=$('#rgrid');g.innerHTML=Array.from({length:Math.max(8,loot.length)},(_,i)=>{const it=loot[i];return it?`<div class="cell r${it.r}" data-i="${i}"><img src="${IMG(it.id)}">${it.q?`<span class="q">${it.q}</span>`:''}</div>`:'<div class="cell"></div>'}).join('');capTxt();if(sel!=null)info(sel)};
 const info=i=>{const it=loot[i];if(!it){$('#rinfo').innerHTML='';return}sel=i;const d=ITEMS[it.id];$('#rinfo').innerHTML=`<b class="c${it.r}">${iname(it)}</b><br><span class="c${it.r}">${RAR[it.r]}</span> · ${desc(it)}${cmp(it)}<div class="row" style="justify-content:flex-start">${d.s?'<button class="btn hot" id="req">Equip</button>':''}<button class="btn" id="rtake">Take</button></div>`};
 const take=i=>{const it=loot[i];if(!it)return false;const d=ITEMS[it.id];
  if(d.a){const ex=G.inv.find(x=>x.id===it.id);if(ex){ex.q+=it.q;loot.splice(i,1);return true}}
  if(!d.p&&invCount()>=capacity()){toast('Backpack full');return false}G.inv.push(it);loot.splice(i,1);if(d.p)addLog(`Got a radio part: ${d.n}!`,'gold');return true};
 $('#ov').onclick=e=>{const c=e.target.closest('#rgrid [data-i]');if(c&&!c.classList.contains('unk')&&loot[+c.dataset.i]){info(+c.dataset.i);return}
  if(e.target.closest('#rtake')){take(sel);sel=null;refresh();$('#rinfo').innerHTML='';}
  if(e.target.closest('#req')){const it=loot[sel];const sl=ITEMS[it.id].s;const old=G.eq[sl];G.eq[sl]=it;loot.splice(sel,1);if(old){loot.push(old)}addLog(`Equipped ${iname(it)}.`,'good');sel=null;refresh();$('#rinfo').innerHTML='Equipped. Your old item is back in the box.'}
  if(e.target.closest('#takeall')){for(let i=loot.length-1;i>=0;i--){/*parts first*/}const order=loot.map((x,i)=>i).sort((a,b)=>(ITEMS[loot[b].id].p?9:loot[b].r)-(ITEMS[loot[a].id].p?9:loot[a].r));const tk=order.map(i=>loot[i]);for(const it of tk){const i=loot.indexOf(it);if(!take(i))break}sel=null;refresh();$('#rinfo').innerHTML=loot.length?'Some items left behind.':'Box emptied.'}
  if(e.target.closest('#done')){closeOv();save();if(G.scr==='enc')renderEnc()}};}
function desc(it){const d=ITEMS[it.id];if(d.dmg)return `Damage ${st(it,'dmg')}${d.burst?' ×'+d.burst:''} · Noise ${d.nz}${d.am?' · uses '+ITEMS[d.am].n:''}`;if(d.s==='back')return `Carry +${st(it,'cap')} slots`;if(d.s)return `Armor ${st(it,'ar')}${d.st?' · Stealth '+(d.st>0?'+':'')+d.st:''}${d.cap?' · +'+d.cap+' slots':''}${d.nv?' · Sees in the dark':''}`;if(d.u==='food')return `Hunger -${Math.round(d.v*RMUL[it.r])}`;if(d.u==='heal')return `Heals ${Math.round(d.v*RMUL[it.r])}`;if(d.u==='bomb')return 'Burns every zombie in a room. Very loud.';if(d.a)return `${it.q} rounds`;if(it.id==='lockpick')return 'Opens one lockbox quietly';if(it.id==='keycard')return 'Opens one safe instantly';if(d.p)return 'Radio part. Bring it to Echo Hill.';return ''}
function cmp(it){const d=ITEMS[it.id];if(!d.s)return '';const o=G.eq[d.s];if(!o)return ' <span class="c1">(empty slot)</span>';const k=d.dmg?'dmg':d.s==='back'?'cap':'ar';const dv=st(it,k)-st(o,k);return ` <span class="${dv>0?'c1':dv<0?'c0':''}">(${dv>=0?'+':''}${dv} vs ${iname(o)})</span>`}
// ---------- gear
function showGear(){const pos={head:[4,0],body:[4,78],legs:[4,156],melee:[4,234],back:[184,0],primary:[184,78],secondary:[184,156]};
 const doll=Object.entries(pos).map(([s,[x,y]])=>{const it=G.eq[s];return `<div class="cell ${it?'r'+it.r:''}" data-eq="${s}" style="left:${x}px;top:${y}px">${it?`<img src="${IMG(it.id)}">`:''}<span class="lab">${s.toUpperCase()}</span></div>`}).join('');
 const cap=capacity();const inv=Array.from({length:Math.max(cap,G.inv.length)},(_,i)=>{const it=G.inv[i];return it?`<div class="cell r${it.r}" data-iv="${i}"><img src="${IMG(it.id)}">${it.q?`<span class="q">${it.q}</span>`:''}</div>`:'<div class="cell"></div>'}).join('');
 const parts=G.inv.filter(i=>ITEMS[i.id].p).length;
 ov(`<div class="doll">${doll}</div><div class="inv"><h2>Survivor</h2><div class="stats"><span>Health ${Math.round(G.hp)}</span><span>Armor ${armor()}</span><span>Stealth ${stealth()>=0?'+':''}${stealth()}</span><span>Melee ${wStats('melee').dmg} dmg</span><span>Pack ${G.inv.length}/${cap}</span><span>Parts carried ${parts} · installed ${G.installed}</span><span>Kills ${G.kills}</span><span>Ammo 9mm ${ammoOf('ammo9')} · shells ${ammoOf('shells')} · rifle ${ammoOf('ammo762')}</span></div>
 <div class="grid">${inv}</div><div class="info" id="ginfo">Tap gear or an item.</div><div class="row"><button class="btn hot" id="x">Close</button></div></div>`,'gear');
 $('#ov').onclick=e=>{const c=e.target.closest('[data-eq],[data-iv]');if(c){gInfo(c.dataset.eq,c.dataset.iv!=null?+c.dataset.iv:null);return}
  if(e.target.closest('#x')){closeOv();G.scr==='enc'?renderEnc():showMap()}
  const a=e.target.closest('[data-act]');if(a)gAct(a.dataset.act,a.dataset.k)}}
function gInfo(s,i){let it,h='';if(s){it=G.eq[s];if(!it)return $('#ginfo').innerHTML='Empty '+s+' slot. Find gear in containers.';h=`<button class="btn" data-act="uneq" data-k="${s}">Unequip</button>`}else{it=G.inv[i];const d=ITEMS[it.id];if(d.s)h+=`<button class="btn hot" data-act="eq" data-k="${i}">Equip</button>`;if(d.u==='food'||d.u==='heal')h+=`<button class="btn hot" data-act="use" data-k="${it.u}">Use</button>`;h+=`<button class="btn" data-act="drop" data-k="${i}">Drop</button>`}
 $('#ginfo').innerHTML=`<b class="c${it.r}">${iname(it)}</b> <span class="c${it.r}">${RAR[it.r]}</span><br>${desc(it)}${s?'':cmp(it)}<div class="row" style="justify-content:flex-start">${h}</div>`}
function gAct(a,k){if(a==='uneq'){if(G.inv.length>=capacity()-(k==='back'?st(G.eq.back,'cap'):0))return toast('No room in pack');G.inv.push(G.eq[k]);delete G.eq[k]}
 if(a==='eq'){const it=G.inv[+k];const sl=ITEMS[it.id].s;const o=G.eq[sl];G.eq[sl]=it;G.inv.splice(+k,1);if(o)G.inv.push(o);toast('Equipped '+iname(it))}
 if(a==='drop'){if(ITEMS[G.inv[+k].id].p&&!confirm('Drop a radio part?'))return;G.inv.splice(+k,1)}
 if(a==='use')return useItem(+k,1);save();showGear()}
// ---------- tower
function install(){const ps=G.inv.filter(i=>ITEMS[i.id].p);if(G.installed>=12)return broadcast();if(!ps.length)return toast('No radio parts in your pack');
 G.installed+=ps.length;G.inv=G.inv.filter(i=>!ITEMS[i.id].p);META.best=Math.max(META.best,G.installed);saveMeta();addLog(`You wire ${ps.length} part(s) into the transmitter. Signal ${G.installed}/12.`,'gold');toast(`Signal ${G.installed}/12`);
 if(G.installed>=12)addLog('The transmitter hums to life. Broadcasting will draw every shambler on the hill. Be ready.','gold');save();renderEnc()}
function broadcast(){const l=G.locs.tower;const room=l.rooms[l.cur];G.final=(G.final||0);
 ov(`<h2>Broadcast?</h2><p>You will have to hold the shack against waves of the dead until the rescue chopper answers. Make sure you're armed and healed.</p><div class="row"><button class="btn hot" id="b">Send the Signal</button><button class="btn" id="x">Not yet</button></div>`);
 $('#ov').onclick=e=>{if(e.target.id==='x')closeOv();if(e.target.id==='b'){closeOv();G.final=1;wave()}}}
function wave(){const l=G.locs.tower;const room=l.rooms[l.cur];if(G.final>4)return win();addLog(`WAVE ${G.final}/4 — they come up through the wildflowers.`,'bad');room.z=Array.from({length:1+Math.ceil(G.final/1.5)},()=>Object.assign(mkZ(pick(['walker','runner','crawler','walker'])),{aw:1}));room.clock=99;room.wave=1;renderEnc()}
const _fight=fight;fight=function(){_fight();const l=G.locs.tower;if(G.final&&G.at==='tower'&&!G.over){const room=l.rooms[l.cur];if(!room.z.length){G.final++;G.final>4?win():(G.hp=clamp(G.hp+12,0,100),toast("Wave cleared · +12 HP"),wave())}}};
// ---------- end
function die(why){G.over=1;const pts=G.installed*2+G.day+Math.floor(G.kills/5)+Math.floor(G.searched/6);META.pts+=pts;META.journal.unshift(`Day ${G.day}: ${why}`);META.journal=META.journal.slice(0,6);saveMeta();localStorage.removeItem('ls_run');
 ov(`<h2 style="color:#c0392b">YOU DIED</h2><p>${why}</p><p>Signal ${G.installed}/12 · Kills ${G.kills} · Containers ${G.searched}</p><p class="gold">+${pts} journal points (total ${META.pts})</p><p style="font-size:12px">${KITS.filter(k=>k.need<=META.pts).map(k=>k.n).join(' · ')} starts unlocked</p><div class="row"><button class="btn hot" id="t">Continue</button></div>`);$('#ov').onclick=e=>{if(e.target.id==='t'){closeOv();showTitle()}}}
function win(){G.over=1;const mins=Math.round((Date.now()-G.started)/60000);META.wins++;META.pts+=40;META.best=12;saveMeta();localStorage.removeItem('ls_run');
 ov(`<h2 style="color:#b8650f">SOMEONE HEARD YOU</h2><img src="img/bg_title.jpg" style="width:100%;max-height:34vh;object-fit:cover;border-radius:4px"><p>A voice answers. Then rotor blades over Echo Hill. You made it on day ${G.day}, and nobody even asked for a timesheet.</p><p>Kills ${G.kills} · Containers ${G.searched} · ${mins} min</p><p>+40 journal points</p><div class="row"><button class="btn hot" id="t">Title</button></div>`);$('#ov').onclick=e=>{if(e.target.id==='t'){closeOv();showTitle()}}}
window.__G=()=>G;
showTitle();
