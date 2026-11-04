'use strict';
const $=s=>document.querySelector(s);
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const wpick=w=>{let s=w.reduce((a,b)=>a+b,0),r=Math.random()*s;for(let i=0;i<w.length;i++){r-=w[i];if(r<0)return i}return w.length-1};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const IMG=id=>'img/'+id+'.webp';
const DEADLINE=21;
let G=null, META=JSON.parse(localStorage.getItem('ls_meta')||'{"pts":0,"runs":0,"best":0,"wins":0,"journal":[]}');META.tips=META.tips||{};META.hist=META.hist||[];
let uid=1;
const saveMeta=()=>localStorage.setItem('ls_meta',JSON.stringify(META));
const save=()=>{if(G&&!G.over){localStorage.setItem('ls_run',JSON.stringify(G));ach()}};
const isGear=it=>!!ITEMS[it.id].s;
function mk(id,r,depth){const d=ITEMS[id];if(r==null||!d.s)r=d.s?d.t:(d.p?3:0);const it={id,r,u:uid++};if(d.a||d.sc)it.q=Math.round(R(d.q[0],d.q[1])*(1+(depth||0)*.15));return it;}
function st(it,k){const d=ITEMS[it.id];const v=d[k]||0;if(k==='dmg'||k==='ar')return Math.round(v*RMUL[it.r]);if(k==='cap')return v?v+(d.s==='back'?it.r*2:0):0;return v;}
function iname(it){const d=ITEMS[it.id];return (d.s&&it.r>d.t?['','Sturdy ','Tuned ','Elite ','Legendary '][it.r]:'')+d.n}
function rlabel(it){const d=ITEMS[it.id];return d.s?RAR[it.r]:d.p?'Radio Part':d.a?'Ammo':d.u==='food'?'Food':d.u==='heal'?'Medicine':'Supply'}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),1600)}
const night=()=>G.hour>=20||G.hour<6;
function tip(id,t){if(META.tips[id])return;META.tips[id]=1;saveMeta();const c=document.createElement('div');c.className='coach';c.innerHTML=`<b>Tip</b> ${t}<small>tap to close</small>`;c.onclick=()=>c.remove();document.body.appendChild(c);setTimeout(()=>c.remove(),9000)}
// ---------- player stats
function eq(s){return G.eq[s]}
function armor(){return ['head','body','legs'].reduce((a,s)=>a+(eq(s)?st(eq(s),'ar'):0),0)}
function stealth(){let v=['head','body','legs'].reduce((a,s)=>a+(eq(s)?st(eq(s),'st'):0),0);const nv=eq('head')&&ITEMS[eq('head').id].nv;if(night())v+=nv?2:-3;return v}
function capacity(){return 4+(eq('back')?st(eq('back'),'cap'):0)+(eq('legs')?st(eq('legs'),'cap'):0)}
function ammoOf(t){return G.inv.filter(i=>i.id===t).reduce((a,i)=>a+i.q,0)}
function useAmmo(t,n){for(const i of G.inv)if(i.id===t&&n>0){const k=Math.min(i.q,n);i.q-=k;n-=k}G.inv=G.inv.filter(i=>!ITEMS[i.id].a||i.q>0)}
function invCount(){return G.inv.filter(i=>!ITEMS[i.id].p).length}
// ---------- item value / junk
function score(it){const d=ITEMS[it.id];if(d.dmg)return st(it,'dmg')*(d.burst||1)*(1+(d.acc||0)/100+it.r*.03)-(d.s==='melee'?d.nz*.4:0);return st(it,'ar')*3+(d.st||0)*2+st(it,'cap')*2}
function isUp(it){const d=ITEMS[it.id];if(!d.s)return false;const o=G.eq[d.s];return !o||(o!==it&&score(it)>score(o)+.01)}
function isJunk(it){const d=ITEMS[it.id];if(it.fav||d.p)return false;if(it.j)return true;if(!d.s||it.r>=3)return false;const o=G.eq[d.s];if(!o||o===it)return false;
 if(score(it)>score(o))return false;
 // a spare gun is never junk if it uses different ammo than equipped ones
 return true}
function scrapVal(it){const d=ITEMS[it.id];if(d.p)return 0;if(d.s)return 1+d.t+it.r*2;if(d.a)return Math.max(1,Math.floor(it.q/5));return 1}
function sellVal(it){const d=ITEMS[it.id];if(d.p)return 0;if(d.s)return 2+d.t+it.r*3;if(d.a)return Math.max(1,Math.floor(it.q/3));if(d.u==='heal')return 2+d.t*2;if(d.u==='tool')return 3+d.t*2;if(d.u==='bomb')return 4;return 1}
function scrapItems(list,where){let tot=0;for(const it of list){tot+=scrapVal(it);const a=where||G.inv;const i=a.indexOf(it);if(i>=0)a.splice(i,1)}G.scrap+=tot;return tot}
// ---------- world gen
const GEARCATS=['melee','body','head','legs','back','secondary','primary'];
function genLoot(ct,loc,depth){const c=CT[ct];const n=R(c.k[0],c.k[1]);const out=[];const L=LOC[loc];
 const cap=Math.min([1,2,3,4][L.d],ct==='crate'?2:4);
 for(let i=0;i<n;i++){
  if(Math.random()<.16){out.push(mk('scrap',0,depth));continue}
  let r=wpick(c.w.map((w,j)=>j>cap?0:w*(j<=1?1:j===2?1+depth*.08:j===3?.3+depth*.1:.12+depth*.05)));
  let cat=Math.random()<.55?pick(L.bias):pick(['food','heal','melee','ammo','body','head','legs','back','secondary','primary','tool','food','ammo']);
  if(cat==='tool'&&Math.random()<.3)cat='bomb';
  const catOf=d=>d.s||d.u||(d.a?'ammo':'');
  let pool=Object.keys(ITEMS).filter(k=>{const d=ITEMS[k];return !d.p&&!d.sc&&catOf(d)===cat});
  if(GEARCATS.includes(cat)){pool=pool.filter(k=>ITEMS[k].t<=r);if(!pool.length){pool=Object.keys(ITEMS).filter(k=>ITEMS[k].s&&ITEMS[k].t<=r)}
   const best=pool.filter(k=>ITEMS[k].t>=r-1);const id=pick(best.length?best:pool);out.push(mk(id,r))}
  else{pool=pool.filter(k=>ITEMS[k].t<=L.d+1);if(!pool.length)pool=['can'];out.push(mk(pick(pool),0,depth))}}
 return out}
const PARTS=['circuit','tube','coil','battery','walkie'];
function genRooms(k){const L=LOC[k];return L.rooms.map((nm,i)=>{const depth=i+L.d;const nc=L.tower?R(1,2):R(1,3);const spots=[];
   for(let j=0;j<nc;j++){const ct=i===L.rooms.length-1&&j===0?(Math.random()<.5?'safe':'chest'):pick(i<2?['crate','crate','lockbox']:['crate','lockbox','lockbox','safe','chest']);spots.push({ct,open:0,loot:genLoot(ct,k,depth)})}
   const nz=k==='suburbs'&&i===0?0:R(i<2?(L.d?1:0):1,Math.min(4,1+Math.floor((i+L.d)/1.6)));
   return {n:nm,spots,z:Array.from({length:nz},()=>mkZ(pick(L.z),L.d)),clock:R(5,8),sp:0}})}
function newRun(kit){uid=1;const K=KITS[kit];
 G={v:3,day:1,hour:8,hp:100,hun:10,noise:0,at:'suburbs',kills:0,searched:0,started:Date.now(),eq:{},inv:[],locs:{},hordes:[],installed:0,log:[],kit,scrap:0,cells:3,safe:{},wsel:'melee',tt:0};
 for(const id of K.items){const it=mk(id);const d=ITEMS[id];if(d.s&&!G.eq[d.s])G.eq[d.s]=it;else G.inv.push(it)}
 const keys=Object.keys(LOC);
 for(const k of keys){const L=LOC[k];const rooms=genRooms(k);
  if(!L.tower){for(let p=0;p<2;p++){const ri=R(Math.min(2,rooms.length-1),rooms.length-1);const sp=rooms[ri].spots;pick(sp).loot.push(mk(PARTS[(keys.indexOf(k)*2+p)%5]))}}
  G.locs[k]={rooms,cur:0,visited:k==='suburbs',parts:L.tower?0:2}}
 G.locs.suburbs.rooms[0].spots=[{ct:'crate',open:0,loot:[mk('bar'),mk('bat',1),mk('cap'),mk('water'),mk('scrap',0,0)]}];
 G.hordes=[{e:6,p:.5},{e:9,p:.5}];
 moveTrader(true);
 META.runs++;saveMeta();save();showMap();addLog('Day one of the rest of your life. No alarm, no commute, no inbox. The old radio crackles: "...Echo Hill tower... twelve parts... we listen until day '+DEADLINE+'..."','gold');renderLogOnly()}
function renderLogOnly(){}
function mkZ(t,dd){const d=dd!=null?dd:(G&&G.at?LOC[G.at].d:0);return {t,hp:Math.round(ZT[t].hp*(1+d*.15+(G?G.day*.035:0))),aw:0}}
function addLog(t,c){const l=G.log[G.log.length-1];if(l&&l[0]===t)return;G.log.push([t,c||'']);if(G.log.length>60)G.log.shift()}
// ---------- trader
function moveTrader(first){const opts=Object.keys(LOC).filter(k=>!LOC[k].tower&&(first?k==='gunstore':k!==(G.trader&&G.trader.at)));const at=first?'gunstore':pick(opts);
 const st=[{id:'bandage',p:3},{id:'medkit',p:9},{id:'can',p:2},{id:'ammo9',p:4},{id:'shells',p:4},{id:'ammo762',p:5},{id:'bolts',p:4},{id:'lockpick',p:5},{id:'keycard',p:9}];
 const stock=[];for(const s of st)if(Math.random()<.7)stock.push(Object.assign({},s));
 const gid=pick(Object.keys(ITEMS).filter(k=>ITEMS[k].s&&ITEMS[k].t<=2));const r=clamp(ITEMS[gid].t+R(1,2),0,3);stock.push({id:gid,r,p:8+r*5});
 stock.push({id:'rumor',p:6});
 G.trader={at,day:G.day+R(2,3),stock}}
function traderHere(){return G.trader&&G.trader.at===G.at}
// ---------- time
function passTime(h,quiet){for(let i=0;i<h;i++){G.hour++;if(G.hour>=24){G.hour=0;newDay()}G.hun=clamp(G.hun+(quiet?1.2:2),0,100);G.noise=clamp(G.noise-8,0,100);if(G.hun>=90){G.hp-=3}}
 if(G.hp<=0)return die('Starvation took you on day '+G.day+'.');if(G.day>DEADLINE&&!G.over)return die('Day '+DEADLINE+' passed. The far-off radio went quiet before you could answer.')}
function newDay(){G.day++;toast('Day '+G.day+' · '+(DEADLINE-G.day+1)+' days left');
 // the dead wander back into cleared rooms
 for(const k in G.locs){if(k==='tower')continue;for(const r of G.locs[k].rooms)if(!r.z.length&&Math.random()<.18)r.z.push(mkZ(pick(LOC[k].z),LOC[k].d))}
 if(G.day%4===0&&G.hordes.length<6){G.hordes.push({e:R(0,EDGES.length-1),p:.5});addLog('The radio warns of another horde on the move.','bad')}
 if(G.trader&&G.day>=G.trader.day){moveTrader();addLog(`Wandering trader Rosa packed up and moved to ${LOC[G.trader.at].n}.`)}}
function tick(){G.tt=(G.tt||0)+1;if(G.tt>=4){G.tt=0;G.hour++;if(G.hour>=24){G.hour=0;newDay()}G.noise=clamp(G.noise-4,0,100)}}
// ---------- render helpers
function hud(){const hc=G.hun>=70?'warn':'';return `<div class="hud">
 <div class="meter" title="Health"><img src="${IMG('medkit')}"><div class="bar red"><i style="width:calc((100% - 10px)*${G.hp/100})"></i></div><span>${Math.max(0,Math.round(G.hp))}</span></div>
 <div class="meter ${hc}" title="Hunger"><img src="${IMG('can')}"><div class="bar"><i style="width:calc((100% - 10px)*${(100-G.hun)/100})"></i></div><span>${G.hun>=70?'Hungry':'Fed'}</span></div>
 <div class="meter" title="Noise"><img src="${IMG('noise')}"><div class="bar vio"><i style="width:calc((100% - 10px)*${G.noise/100})"></i></div></div>
 <div class="meter"><img src="${IMG('signal')}"><span style="color:#ffd08a">${G.installed}/12</span></div>
 <div class="meter"><img src="${IMG('scrap')}"><span>${G.scrap}</span></div><div class="meter"><img src="${IMG('cells')}"><span>${G.cells}</span></div>
 <div class="sp"></div><div class="day">Day ${G.day}/${DEADLINE} · ${String(G.hour).padStart(2,'0')}:00${night()?' ☾':''}</div></div>`}
function ov(html,cls){const o=$('#ov');o.innerHTML=`<div class="panel ${cls||'dlg'}">${html}</div>`;o.classList.add('on');}
function closeOv(){$('#ov').classList.remove('on');$('#ov').innerHTML=''}
// ---------- title
function showTitle(){const has=localStorage.getItem('ls_run');
 const kits=KITS.map((k,i)=>`<button class="btn" data-kit="${i}" ${META.pts>=k.need?'':'disabled'}>${k.n}<small>${META.pts>=k.need?k.items.slice(0,3).map(x=>ITEMS[x].n).join(', '):'Unlock at '+k.need+' journal pts'}</small></button>`).join('');
 const hist=META.hist.slice(0,3).map(h=>`<div>${h}</div>`).join('');
 $('#app').innerHTML=`<div class="screen" id="title"><h1>LAST SIGNAL</h1><div class="sub">The world ended. So did rent, rush hour and Monday meetings.<br>The tower on Echo Hill can still reach the others. Find twelve radio parts and send the signal before day ${DEADLINE}.</div>
 <div class="menu">${has?'<button class="btn hot" id="cont">Continue Run</button>':''}<button class="btn ${has?'':'hot'}" id="new">New Run</button></div>
 <div class="legacy">Journal: ${META.pts} pts · Runs ${META.runs} · Best signal ${META.best}/12 · Rescues ${META.wins} · 🏆 ${Object.keys(META.ach||{}).length}/${Object.keys(ACH).length}${hist?'<div class="hist">'+hist+'</div>':''}</div></div>`;
 if(has)$('#cont').onclick=()=>{G=JSON.parse(has);uid=1e6+Date.now()%1e6;resume()};
 $('#new').onclick=()=>ov(`<h2>Choose your start</h2><p>Each run writes to your journal and unlocks better starts.</p><div class="row">${kits}</div><div class="row"><button class="btn" id="x">Back</button></div>`);
 $('#ov').onclick=e=>{const k=e.target.closest('[data-kit]');if(k&&!k.disabled){closeOv();newRun(+k.dataset.kit)}if(e.target.id==='x')closeOv()};}
function resume(){if(G.v!==3){G.scrap=G.scrap||0;G.cells=G.cells||3;G.safe=G.safe||{};G.v=3;if(!G.trader)moveTrader(true)}
 if(G.amb||G.scr==='enc')renderEnc();else showMap()}
// ---------- map
function adj(a){return EDGES.map((e,i)=>[e,i]).filter(([e])=>e[0]===a||e[1]===a).map(([e,i])=>({to:e[0]===a?e[1]:e[0],h:e[2],i}))}
function locLeft(k){const l=G.locs[k];return {box:l.rooms.reduce((a,r)=>a+r.spots.filter(s=>!s.open).length,0),dead:l.rooms.reduce((a,r)=>a+r.z.length,0)}}
function locDone(k){const x=locLeft(k);return !x.box&&!x.dead}
function danger(k){const L=LOC[k],l=G.locs[k];const zs=l.rooms.reduce((a,r)=>a+r.z.length,0);const atk=(L.d+1)*(1+G.day*.06)*(zs/ l.rooms.length+.6);const def=1+armor()/14+wStats(bestW()).dmg/28;const v=atk/def;return v<1.1?['Low','#2f7a2c']:v<1.9?['Moderate','#b8860b']:v<2.8?['High','#c0602b']:['Deadly','#b3321f']}
function bestW(){const ws=weapons().map(w=>w[0]).filter(s=>{const w=wStats(s);return !w.am||ammoOf(w.am)>0});return ws.sort((a,b)=>wStats(b).dmg*wStats(b).burst-wStats(a).dmg*wStats(a).burst)[0]||'melee'}
function showMap(){closeOv();$('#ov').onclick=null;G.scr='map';G.amb=null;save();
 const ad=adj(G.at).map(a=>a.to);
 let nodes='';for(const k in LOC){const L=LOC[k];const l=G.locs[k];const cls=(k===G.at?'here':'')+(ad.includes(k)?' reach':'')+(locDone(k)&&!L.tower?' done':'');const dg=danger(k);
  const pc=G.safe.radio&&!L.tower?` · ${l.parts} part${l.parts===1?'':'s'}`:'';
  nodes+=`<div class="node ${cls}" data-n="${k}" style="left:${L.x}%;top:${L.y}%">${k==='suburbs'?`<img class="safeh" src="${IMG('safehouse')}">`:`<img src="${IMG('pin')}">`}<span><i style="background:${dg[1]}"></i>${L.n}${l.visited?'':' ?'}${pc}</span></div>`}
 let roads='';for(const [i,e] of EDGES.entries()){const a=LOC[e[0]],b=LOC[e[1]];const h=G.hordes.some(x=>x.e===i);const act=e[0]===G.at||e[1]===G.at;
  roads+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${h?'hz':''} ${act?'act':''}"/>`}
 let lab='';for(const [i,e] of EDGES.entries()){const a=LOC[e[0]],b=LOC[e[1]];const h=G.hordes.some(x=>x.e===i);lab+=`<div class="rlab ${h?'hz':''}" style="left:${(a.x+b.x)/2}%;top:${(a.y+b.y)/2}%">${e[2]}h${h?' ⚠':''}</div>`}
 let hz='';for(const h of G.hordes){const e=EDGES[h.e];const a=LOC[e[0]],b=LOC[e[1]];hz+=`<img class="horde" src="${IMG('horde')}" style="left:${a.x+(b.x-a.x)*h.p}%;top:${a.y+(b.y-a.y)*h.p+5}%">`}
 const tr=G.trader?LOC[G.trader.at]:null;const trd=tr?`<img class="trd" src="${IMG('trader')}" style="left:${tr.x+4}%;top:${tr.y-2}%">`:'';
 $('#app').innerHTML=`<div class="screen">${hud()}<div id="mapwrap"><div id="map" class="${night()?'night':''}"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${roads}</svg>${lab}${nodes}${hz}${trd}</div></div>
 <div class="swipe">◀ drag map ▶</div>
 <div class="mapbar"><button class="btn hot" id="enter">Enter<small>${LOC[G.at].n}</small></button>${traderHere()?'<button class="btn hot2" id="trade">Trader<small>Rosa is here</small></button>':''}${G.at==='suburbs'?'<button class="btn" id="home">Safehouse<small>upgrade</small></button>':''}${G.inv.some(i=>ITEMS[i.id].u==='food')?`<button class="btn ${G.hun>=60?'hot':''}" id="eat">Eat<small>hunger ${Math.round(G.hun)}</small></button>`:''}<button class="btn" id="forage">Forage 2h<small>find food</small></button><button class="btn" id="gear">Gear</button><button class="btn" id="rest">Rest 6h<small>${G.hun>=75?'starving!':G.at==='suburbs'?'safe at home':'risky out here'}</small></button><button class="btn" id="menu">Menu</button></div></div>`;
 const here=$('.node.here');if(here){const w=$('#mapwrap');w.scrollLeft=here.offsetLeft-w.clientWidth/2}
 const w=$('#mapwrap');if(w.scrollWidth<=w.clientWidth+4)$('.swipe').remove();else w.addEventListener('scroll',()=>{const s=$('.swipe');if(s)s.remove()},{once:true});
 $('#map').onclick=e=>{const n=e.target.closest('.node');if(n)nodeInfo(n.dataset.n)};
 $('#enter').onclick=()=>enterLoc();$('#gear').onclick=()=>showGear();$('#rest').onclick=rest;$('#forage').onclick=forage;const eb=$('#eat');if(eb)eb.onclick=eatBest;
 if($('#trade'))$('#trade').onclick=showTrader;if($('#home'))$('#home').onclick=showSafe;
 $('#menu').onclick=()=>ov(`<h2>Paused</h2><p>Your run saves after every action.</p><div class="row"><button class="btn" id="q">Title Screen</button><button class="btn" id="ab">Abandon Run</button><button class="btn hot" id="r">Resume</button></div>`);
 $('#ov').onclick=e=>{if(e.target.id==='r')closeOv();if(e.target.id==='q'){closeOv();showTitle()}if(e.target.id==='ab'){closeOv();die('You walked into the sunset and did not come back.')}};
 tip('map','Pins glow when a road leads there. Dashed roads show travel hours; red roads have a horde. The dot by each name is danger <i>for your current gear</i>.')}
function rest(){const home=G.at==='suburbs';const starving=G.hun>=75&&!(home&&G.safe.garden);if(starving&&!G._rw){G._rw=1;return ov(`<h2>You're starving</h2><p>Sleeping hungry won't heal you, and starving costs health every hour. Eat something first, or buy food from the trader.</p><div class="row"><button class="btn" id="rs">Rest anyway</button><button class="btn hot" id="x">OK</button></div>`),$('#ov').onclick=e=>{if(e.target.id==='x')closeOv();if(e.target.closest('#rs')){closeOv();rest()}}}G._rw=0;passTime(6,1);if(G.over)return;const heal=starving?0:home?20+(G.safe.bed||0)*10:12;G.hp=clamp(G.hp+heal,0,100);
 if(home&&G.safe.garden){G.hun=clamp(G.hun-18,0,100)}
 addLog(night()?`You doze by candlelight${home?' in your own bed':' behind a barricade'}. +${heal} HP.`:`You nap in a sunbeam${home?' at home':' behind a barricade'}. Nobody schedules a meeting. +${heal} HP.`,'good');
 const risk=home?.06*(1-(G.safe.bar||0)*.45):.28+G.noise/200;
 if(Math.random()<risk){const h0=G.hp;const d=R(6,14)+G.day;G.hp-=d;addLog(`Something found your hideout. -${d} HP.`,'bad');if(G.hp<=0&&h0>=18){G.hp=R(2,6);addLog('You wake swinging and drive it off. Barely.','good')}if(G.hp<=0)return die('Overrun while sleeping on day '+G.day+'.')}
 if(Math.random()<.35)shiftHordes(1);toast('Rested · +'+heal+' HP');showMap()}
const ACH={kills:['First Blood',g=>g.kills>=1],k50:['Zombie Janitor',g=>g.kills>=50],part:['Spark of Hope',g=>g.installed>=1],half:['Halfway Home',g=>g.installed>=6],rich:['Scrap Baron',g=>g.scrap>=60],safe:['Homebody',g=>Object.keys(g.safe||{}).length>=2],leg:['Shiny!',g=>Object.values(g.eq).some(i=>i&&i.r>=4)]};
function ach(){if(!G)return;const m=META;m.ach=m.ach||{};for(const k in ACH)if(!m.ach[k]&&ACH[k][1](G)){m.ach[k]=1;saveMeta();toast('🏆 '+ACH[k][0])}}
function roomBg(n,d){return /Store|Food Court|Mall|Pharmacy/.test(n)?'bg_market.webp':/House|Garage|Basement|Office|Locker/.test(n)?'bg_house.webp':'bg_'+d+'.jpg'}
function eatBest(){const f=G.inv.filter(i=>ITEMS[i.id].u==='food').sort((a,b)=>Math.abs(ITEMS[a.id].v-G.hun)-Math.abs(ITEMS[b.id].v-G.hun))[0];if(!f)return;G.inv.splice(G.inv.indexOf(f),1);G.hun=clamp(G.hun-ITEMS[f.id].v,0,100);if(ITEMS[f.id].hp)G.hp=clamp(G.hp+ITEMS[f.id].hp,0,100);addLog(`You eat the ${ITEMS[f.id].n}.`,'good');save();showMap()}
function forage(){passTime(2);if(G.over)return;const r=Math.random();
 if(r<.62){const id=pick(['can','bar','bar','water','water']);if(invCount()<capacity()){G.inv.push(mk(id));addLog(`You forage the overgrown yards and find: ${ITEMS[id].n}.`,'good');toast('Found '+ITEMS[id].n)}else{G.hun=clamp(G.hun-ITEMS[id].v,0,100);addLog(`You find ${ITEMS[id].n} and eat it on the spot.`,'good')}}
 else if(r<.82){addLog('Nothing but dandelions. Pretty, though.')}
 else{const d=R(5,11)+G.day;G.hp-=d;addLog(`A lurker in the hedges takes a bite. -${d} HP.`,'bad');if(G.hp<=0)return die('Ambushed while foraging on day '+G.day+'.')}
 save();showMap()}
function nodeInfo(k){const L=LOC[k],l=G.locs[k];const a=adj(G.at).find(x=>x.to===k);const x=locLeft(k);
 const info=L.tower?'Install radio parts here':(l.visited?`${x.box} unopened container${x.box===1?'':'s'} · ${x.dead} dead inside`:'Unexplored');
 const hord=a&&G.hordes.some(h=>h.e===a.i);const dg=danger(k);
 ov(`<h2>${L.n}</h2><img src="img/bg_${L.bg}.jpg" style="width:100%;max-height:30vh;object-fit:cover;border-radius:4px;margin-top:6px"><p>Danger for you: <b style="color:${dg[1]}">${dg[0]}</b> · ${info}${G.trader&&G.trader.at===k?'<br>Rosa the trader is camped here.':''}${hord?'<br><b style="color:#c0392b">A horde is on this road. Expect a fight.</b>':''}</p>
 <div class="row">${k===G.at?'<button class="btn hot" id="go2">Enter</button>':a?`<button class="btn hot" id="go">Travel<small>${a.h}h · hunger +${a.h*2}</small></button>`:'<p>No direct road. Follow the dashed lines.</p>'}<button class="btn" id="x">Close</button></div>`);
 $('#ov').onclick=e=>{if(e.target.closest('#go'))travel(a);if(e.target.closest('#go2'))enterLoc();if(e.target.id==='x')closeOv()}}
function shiftHordes(toward){for(const h of G.hordes){const e=EDGES[h.e];let nb=[];for(const en of [e[0],e[1]])nb.push(...adj(en).map(x=>x.i));nb=nb.filter(i=>i!==h.e);
  if(toward&&G.noise>30){const near=adj(G.at).map(x=>x.i);const c=nb.filter(i=>near.includes(i));if(c.length&&Math.random()<.6){h.e=pick(c);h.p=R(3,7)/10;continue}}
  if(Math.random()<.6){h.e=pick(nb);h.p=R(3,7)/10}}}
function travel(a){closeOv();shiftHordes(1);const amb=G.hordes.find(h=>h.e===a.i);passTime(a.h);if(G.over)return;G.at=a.to;G.locs[a.to].visited=1;addLog(`You stroll to ${LOC[a.to].n}. Zero traffic.`);
 if(amb){G.amb={hi:G.hordes.indexOf(amb),z:Array.from({length:R(2,3)+(G.day>5?1:0)},()=>Object.assign(mkZ(pick(['walker','walker','runner','crawler'])),{aw:1}))};G.scr='enc';addLog('Uh-oh. A crowd shambles out of the tall grass. Not the fun kind of crowd.','bad');save();renderEnc()}else{save();showMap();}}
// ---------- encounter
function curRoom(){if(G.amb)return {n:'Ambush on the Road',spots:[],z:G.amb.z,clock:99,amb:1};const l=G.locs[G.at];return l.rooms[l.cur]}
function enterLoc(){closeOv();const l=G.locs[G.at];l.visited=1;if(l.cur>=l.rooms.length)l.cur=l.rooms.length-1;G.scr='enc';addLog(`You slip into ${LOC[G.at].n}: ${curRoom().n}.`);
 if(night())for(const r of l.rooms)if(r.z.length&&Math.random()<.4&&!r._n){r.z.push(mkZ(pick(LOC[G.at].z)));r._n=1}save();renderEnc();
 tip('enc','Unaware zombies take double damage from quiet weapons (sneak attack). Guns are loud and wake the room. Shove buys you a turn.')}
function weapons(){const w=[];if(eq('melee'))w.push(['melee',eq('melee')]);else w.push(['melee',{id:'fists',r:0}]);if(eq('secondary'))w.push(['secondary',eq('secondary')]);if(eq('primary'))w.push(['primary',eq('primary')]);return w}
function wStats(slot){const it=slot==='melee'&&!eq('melee')?null:eq(slot);if(!it)return {dmg:5,acc:70,nz:1,burst:1,am:null,n:'Fists'};const d=ITEMS[it.id];return {dmg:st(it,'dmg'),acc:(d.am?74:68)+(d.acc||0)+it.r*3,nz:d.nz,burst:d.burst||1,am:d.am,n:iname(it)}}
function hitPct(z,slot){return clamp(wStats(slot).acc+(z.aw?0:12),5,97)}
function hitsToKill(z,slot){const w=wStats(slot);const m=(!z.aw&&!w.am)?2:1;return Math.max(1,Math.ceil(z.hp/(w.dmg*m*w.burst)))}
function incoming(room){const ar=armor();return room.z.filter(z=>z.aw&&!z.stun).reduce((a,z)=>a+ZT[z.t].hit/100*Math.max(1,zdmg(z)-ar*.35),0)}
function zdmg(z){return ZT[z.t].dmg*(1+LOC[G.at].d*.15+G.day*.04)}
function sneakOdds(room){if(G.amb)return clamp(45+stealth()*5-room.z.length*8,5,90);return clamp(80+stealth()*6-room.z.filter(z=>z.aw).length*28-room.z.filter(z=>!z.aw).length*8,5,95)}
function renderEnc(fx){const room=curRoom();const L=LOC[G.at];const l=G.locs[G.at];
 if(!weapons().some(w=>w[0]===G.wsel))G.wsel='melee';
 const zs=room.z.map((z,i)=>`<div class="z ${z.aw?'aw':''} ${fx&&fx.hit===i?'hit':''}" data-z="${i}"><img src="${IMG(ZT[z.t].img)}"><b>${ZT[z.t].n} ${Math.max(0,Math.round(z.hp))}hp<br>${z.stun?'dazed':z.aw?'<i class=awk>aware</i>':'unaware'}</b></div>`).join('');
 const sp=room.spots.map((s,i)=>`<img class="spot ${s.open?(s.loot.length?'open left':'open'):'pulse'}" data-s="${i}" src="${IMG(s.ct+(s.open?'_open':''))}">`).join('');
 const t0=room.z[0];const ws=weapons().map(([s,it])=>{const w=wStats(s);return `<button data-w="${s}" class="${G.wsel===s?'on':''}"><img src="${it.id==='fists'?IMG('bandage'):IMG(it.id)}"><span>${w.n}<br>${w.am?ammoOf(w.am)+' '+(w.am==='bolts'?'bolts':'rds'):'quiet'}</span></button>`}).join('');
 const inc=incoming(room);const ws0=wStats(G.wsel);
 const last=G.amb||l.cur>=l.rooms.length-1;const clear=!room.z.length;
 const logs=G.log.slice(-14).map(([t,c])=>`<p class="${c}">${t}</p>`).join('');
 const ammoOk=!ws0.am||ammoOf(ws0.am)>0;const parts=G.inv.filter(i=>ITEMS[i.id].p).length;
 const odds=t0?`<div class="odds">Hit <b>${ammoOk?hitPct(t0,G.wsel):0}%</b> · ${Math.round(ws0.dmg*.8*((!t0.aw&&!ws0.am)?2:1))}–${Math.round(ws0.dmg*1.2*((!t0.aw&&!ws0.am)?2:1))}${ws0.burst>1?'×'+ws0.burst:''} dmg vs ${Math.round(t0.hp)}hp → <b>${hitsToKill(t0,G.wsel)} hit${hitsToKill(t0,G.wsel)>1?'s':''}</b><br>Incoming ~<b style="color:#c0392b">${inc.toFixed(1)}</b>/turn · Sneak <b>${sneakOdds(room)}%</b>${!t0.aw&&ws0.am?' · <span style="color:#b3321f">gunfire wakes the room</span>':''}</div>`:'';
 $('#app').innerHTML=`<div class="screen" id="enc">${hud()}<div class="scene" style="background-image:linear-gradient(#3a230f55,#0000 25%,#0000 75%,#3a230f66),url(img/${G.amb?'bg_road.jpg':roomBg(room.n,L.bg)});background-position:${G.amb?50:(l.cur*23)%100}% 50%">
 <div class="roomtitle">${G.amb?'Ambush!':L.n}<small>${room.n}${G.amb?'':' · room '+(l.cur+1)+'/'+l.rooms.length}${room.z.length&&!G.amb&&!room.wave?' · more arrive in '+room.clock+' turns':''}</small></div>
 <div class="spots">${sp}</div><div class="zs">${zs}</div></div>
 <div class="side panel"><div class="log" id="log">${logs}</div>
 ${room.z.length?`<div class="wsel">${ws}</div>${odds}`:''}
 <div class="acts">
 ${room.z.length?`<button class="btn hot" id="fight" ${ammoOk?'':'disabled'}>Fight<small>${ammoOk?ZT[t0.t].n:'no ammo'}</small></button><button class="btn" id="aim" ${ammoOk?'':'disabled'}>Aimed<small>−20% hit · ×1.8 dmg</small></button><button class="btn" id="shove">Shove<small>daze it, no damage</small></button>`:''}
 ${room.spots.some(s=>!s.open)?`<button class="btn ${room.z.length?'':'hot'}" id="search">Search<small>${room.spots.filter(s=>!s.open).length} container(s)</small></button>`:''}
 ${G.amb?`<button class="btn" id="run">Run<small>${sneakOdds(room)}% clean</small></button>`:(!last?(clear?`<button class="btn ${room.spots.some(s=>!s.open)?'':'hot'}" id="next">Next Room<small>${l.rooms[l.cur+1].n}</small></button>`:`<button class="btn" id="sneak">Sneak Past<small>${sneakOdds(room)}%</small></button>`):'')}
 ${L.tower&&!G.amb&&clear&&last?`<button class="btn hot" id="install" ${G.installed<12&&!parts?'disabled':''}>${G.installed>=12?'Broadcast':'Install Parts'}<small>${G.installed>=12?'hold the hill':parts+' in pack'}</small></button>`:''}
 ${!G.amb&&l.cur>0&&clear?`<button class="btn" id="back">Prev Room</button>`:''}
 <button class="btn" id="items">Use Item</button><button class="btn" id="gear">Gear</button>
 ${G.amb?'':`<button class="btn" id="leave">Leave<small>to map</small></button>`}
 </div></div></div>`;
 const lg=$('#log');lg.scrollTop=lg.scrollHeight;
 const on=(id,f)=>{const e=$('#'+id);if(e)e.onclick=f};
 on('fight',()=>fight());on('aim',()=>fight(1));on('shove',shove);on('search',()=>search(room.spots.findIndex(s=>!s.open)));on('next',()=>{l.cur++;addLog('You move on: '+curRoom().n+'.');save();renderEnc()});on('back',()=>{l.cur--;save();renderEnc()});
 on('sneak',sneak);on('leave',leave);on('items',useMenu);on('gear',()=>showGear());on('run',runAway);on('install',install);
 document.querySelectorAll('.wsel button').forEach(b=>b.onclick=()=>{G.wsel=b.dataset.w;save();renderEnc()});
 document.querySelectorAll('.spot').forEach(b=>b.onclick=()=>{const s=room.spots[+b.dataset.s];if(!s.open)search(+b.dataset.s);else if(s.loot.length)reveal(s,room,1)});
 save();}
function endTurn(room,nz){if(G.over)return;G.noise=clamp(G.noise+nz,0,100);
 for(const z of room.z){if(!z.aw&&Math.random()*100<10+nz*1.4+G.noise*.12){z.aw=1;addLog(`The ${ZT[z.t].n.toLowerCase()} notices you!`,'bad')}}
 const ar=armor();for(const z of room.z)if(z.aw){if(z.stun){z.stun=0;continue}const T=ZT[z.t];if(Math.random()*100<T.hit){const d=Math.max(1,Math.round(zdmg(z)*(.8+Math.random()*.4)-ar*.35));G.hp-=d;addLog(`${T.n} hits you for ${d}.`,'bad')}else addLog(`${T.n} grabs at you and misses.`)}
 G.hun=clamp(G.hun+.35,0,100);tick();
 if(!room.amb&&!room.wave&&(room.z.length||room.spots.some(s=>!s.open))&&(room.sp||0)<2){room.clock-=1+(nz>15?1:0);if(room.clock<=0){room.clock=R(5,8);room.sp=(room.sp||0)+1;const L=LOC[G.at];const t=pick(L.z);const loud=G.noise>45;room.z.push(Object.assign(mkZ(t),{aw:loud?1:0}));addLog(`A ${ZT[t].n.toLowerCase()} shuffles in${loud?', drawn by the noise':''}.`,'bad')}}
 if(G.hp<=0)return die(`Killed by the dead in ${G.amb?'a roadside ambush':LOC[G.at].n} on day ${G.day}.`);}
function fight(aim){const room=curRoom();const z=room.z[0];if(!z)return;const w=wStats(G.wsel);
 if(w.am&&ammoOf(w.am)<1)return toast('No ammo');
 let dealt=0;const sneakA=!z.aw&&!w.am;for(let b=0;b<w.burst;b++){if(w.am){if(ammoOf(w.am)<1)break;useAmmo(w.am,1)}if(Math.random()*100<hitPct(z,G.wsel)-(aim?20:0)){dealt+=w.dmg*(.8+Math.random()*.4)*(sneakA?2:1)*(aim?1.8:1)}}
 dealt=Math.round(dealt);z.hp-=dealt;
 if(dealt)addLog(`${sneakA?'Sneak attack! ':''}${aim?'Headshot! ':''}You hit the ${ZT[z.t].n.toLowerCase()} for ${dealt}.`);else addLog('You miss.','bad');
 for(const o of room.z)if(w.nz>15&&Math.random()<.7)o.aw=1; z.aw=1;
 let killed=false;if(z.hp<=0){room.z.shift();G.kills++;killed=true;addLog(`The ${ZT[z.t].n.toLowerCase()} drops.`,'good');if(Math.random()<.25){const s=R(1,2);G.scrap+=s;addLog(`You pocket ${s} scrap from its pockets.`)}if(Math.random()<.1){G.cells++;addLog('It had a battery in its jacket. +1 battery.','good')}ach('kills')}
 endTurn(room,w.nz);if(G.over)return;
 if(room.amb&&!room.z.length){addLog('You clear the road. The birds start singing again.','good');clearAmb();toast('Survived the ambush');return showMap()}
 if(G.final&&G.at==='tower'&&!room.z.length){G.final++;if(G.final>4)return win();G.hp=clamp(G.hp+12,0,100);toast('Wave cleared · +12 HP');return wave()}
 renderEnc({hit:killed?-1:0})}
function shove(){const room=curRoom();const z=room.z.find(z=>z.aw&&!z.stun)||room.z[0];if(!z)return;z.aw=1;z.stun=1;addLog(`You shove the ${ZT[z.t].n.toLowerCase()} into the wall. It staggers.`);endTurn(room,1);if(!G.over)renderEnc()}
function clearAmb(){const h=G.hordes[G.amb.hi];if(h){h.e=R(0,EDGES.length-1);h.p=.5}G.amb=null;save()}
function runAway(){const room=curRoom();if(Math.random()*100<sneakOdds(room)){addLog('You break through the horde and run.','good')}else{const ar=armor();let d=0;for(const z of room.z)d+=Math.max(1,zdmg(z)-ar*.35);d=Math.round(d);G.hp-=d;addLog(`They claw at you as you run. -${d} HP.`,'bad');if(G.hp<=0)return die('Dragged down on the open road on day '+G.day+'.')}
 G.amb=null;save();showMap()}
function sneak(){const room=curRoom();const l=G.locs[G.at];if(Math.random()*100<sneakOdds(room)){addLog('You tiptoe past. Years of dodging your manager pay off.','good');l.cur++;G.noise=clamp(G.noise+2,0,100);tick();save();renderEnc()}else{for(const z of room.z)z.aw=1;addLog('A board creaks. They turn toward you!','bad');endTurn(room,6);if(!G.over)renderEnc()}}
function leave(){const room=curRoom();if(room.z.some(z=>z.aw)){const ar=armor();const h0=G.hp;for(const z of room.z)if(z.aw&&!z.stun&&Math.random()<.5){const d=Math.max(1,Math.round(zdmg(z)-ar*.35));G.hp-=d;addLog(`${ZT[z.t].n} catches you on the way out. -${d}`,'bad')}if(G.hp<=0&&h0>=18){G.hp=R(1,4);addLog('You dive through a window and limp away. Alive!','good')}if(G.hp<=0)return die('Cut off while retreating from '+LOC[G.at].n+'.')}
 if(G.final&&G.at==='tower'){G.final=0;const rr=curRoom();rr.z=[];rr.wave=0;addLog('You abandon the broadcast. You can try again.','bad')}passTime(1);if(G.over)return;addLog('You head back outside. Lovely weather, at least.');showMap()}
function useMenu(){const us=G.inv.filter(i=>ITEMS[i.id].u&&ITEMS[i.id].u!=='tool');if(!us.length)return toast('Nothing usable');
 ov(`<h2>Use Item</h2><div class="grid" style="justify-content:center;margin:8px auto">${us.map(i=>`<div class="cell" data-u="${i.u}"><img src="${IMG(i.id)}"><span class="q">${desc(i).replace(/^(Hunger|Heals) /,'')}</span></div>`).join('')}</div><p id="uinfo">Tap to use. Using one takes a turn in a fight.</p><div class="row"><button class="btn" id="x">Close</button></div>`);
 $('#ov').onclick=e=>{const c=e.target.closest('[data-u]');if(c){useItem(+c.dataset.u);}if(e.target.id==='x')closeOv()}}
function useItem(u,fromGear){const it=G.inv.find(i=>i.u===u);if(!it)return;const d=ITEMS[it.id];const room=G.scr==='enc'?curRoom():null;
 if(d.u==='food'){G.hun=clamp(G.hun-d.v,0,100);if(d.hp)G.hp=clamp(G.hp+d.hp,0,100);addLog(`You eat: ${d.n}.`,'good')}
 else if(d.u==='heal'){G.hp=clamp(G.hp+d.v,0,100);addLog(`You use ${d.n}.`,'good')}
 else if(d.u==='bomb'){if(!room||!room.z.length)return toast('Save it for a fight');const n=room.z.length;G.kills+=n;room.z=[];addLog(`The molotov engulfs ${n} of them!`,'gold');G.noise=clamp(G.noise+30,0,100)}
 else return;G.inv=G.inv.filter(i=>i!==it);save();closeOv();
 if(room&&room.z.length){endTurn(room,0);if(G.over)return}
 if(room&&room.amb&&!room.z.length){clearAmb();toast('Survived the ambush');return showMap()}
 if(G.final&&G.at==='tower'&&room&&!room.z.length){G.final++;if(G.final>4)return win();return wave()}
 save();if(fromGear)return showGear();G.scr==='enc'?renderEnc():showMap()}
// ---------- containers
function search(i){const room=curRoom();const s=room.spots[i];if(!s||s.open)return;const C=CT[s.ct];let nz=C.nz,turns=1,how='';
 if(C.lock){const tool=G.inv.find(x=>x.id===C.lock);const pry=eq('melee')&&ITEMS[eq('melee').id].pry;
  if(tool){G.inv=G.inv.filter(x=>x!==tool);how=s.ct==='safe'?'The keycard blinks green.':'The lock clicks open.'}
  else if(s.ct==='lockbox'&&pry){nz+=12;how='You pry it open with a screech of metal.'}
  else{nz+=s.ct==='safe'?20:14;turns=s.ct==='safe'?3:2;how=s.ct==='safe'?'No keycard. You hammer at the hinges for a long time.':'You bash the lock off.'}}
 if(how)addLog(how,turns>1?'bad':'');
 for(let t=0;t<turns;t++){endTurn(room,Math.round(nz/turns));if(G.over)return}
 s.open=1;G.searched++;save();reveal(s,room)}
function badge(it){return (ITEMS[it.id].p?'<span class="bd part">PART</span>':isUp(it)?'<span class="bd up">▲</span>':isJunk(it)?'<span class="bd junk">JUNK</span>':'')+(it.fav?'<span class="bd fav">★</span>':'')}
function cellH(it,i,attr){return `<div class="cell r${isGear(it)?it.r:ITEMS[it.id].p?3:'x'}" ${attr}="${i}"><img src="${IMG(it.id)}">${it.q?`<span class="q">${it.q}</span>`:''}${badge(it)}</div>`}
function reveal(s,room,again){const C=CT[s.ct];const loot=s.loot;
 ov(`<div class="cbox"><img id="cimg" class="${again?'':'sh'}" src="${IMG(s.ct+(again?'_open':''))}"><h3>${C.n}</h3><div class="info" id="rinfo">${again?'Tap an item to inspect it.':'Opening...'}</div></div>
 <div><div class="grid" id="rgrid">${Array.from({length:Math.max(8,loot.length)},(_,i)=>`<div class="cell ${i<loot.length&&!again?'unk':''}" data-i="${i}"></div>`).join('')}</div>
 <div class="row"><button class="btn hot" id="takeall" disabled>Take All<small>skips junk</small></button><button class="btn" id="scrapj" disabled>Scrap Junk</button><button class="btn" id="done" disabled>Done</button></div><div style="font-size:12px;text-align:center" id="cap"></div></div>`,'reveal');
 const tok=Math.random();$('#ov').dataset.tok=tok;const alive=()=>$('#ov').dataset.tok==tok&&$('#takeall');
 let sel=null;
 const capTxt=()=>{const j=loot.filter(isJunk);$('#cap').innerHTML=`Backpack ${invCount()}/${capacity()} · Scrap ${G.scrap}`;const b=$('#scrapj');if(b){b.innerHTML=`Scrap Junk<small>${j.length?j.length+' item(s) · +'+j.reduce((a,x)=>a+scrapVal(x),0):'none'}</small>`;b.disabled=!j.length||$('#done').disabled}};
 const enable=()=>{$('#takeall').disabled=false;$('#done').disabled=false;$('#rinfo').innerHTML=loot.length?'Tap an item to inspect it.':'Empty.';refresh()};
 const refresh=()=>{const g=$('#rgrid');g.innerHTML=Array.from({length:Math.max(8,loot.length)},(_,i)=>{const it=loot[i];return it?cellH(it,i,'data-i'):'<div class="cell"></div>'}).join('');capTxt();if(sel!=null&&loot[sel])info(sel)};
 if(again){enable()}else setTimeout(()=>{const im=$('#cimg');if(!im||!alive())return;im.src=IMG(s.ct+'_open');im.className='op';let k=0;
  const step=()=>{if(!alive())return;const c=document.querySelector(`#rgrid [data-i="${k}"]`);if(!c||k>=loot.length){enable();return}
   const it=loot[k];c.outerHTML=cellH(it,k,'data-i').replace('class="cell','class="cell pop');
   if(ITEMS[it.id].p){toast('RADIO PART FOUND!');}else if(isGear(it)&&it.r>=3)toast(RAR[it.r]+'!');
   k++;setTimeout(step,isGear(it)&&it.r>=3?650:330)};step()},650);
 const info=i=>{const it=loot[i];if(!it){$('#rinfo').innerHTML='';return}sel=i;const d=ITEMS[it.id];$('#rinfo').innerHTML=`<b class="c${isGear(it)?it.r:0}">${iname(it)}</b><br><span class="c${isGear(it)?it.r:0}">${rlabel(it)}</span> · ${desc(it)}${cmp(it)}<div class="row" style="justify-content:flex-start">${d.s?'<button class="btn hot" id="req">Equip</button>':''}${d.sc?'':'<button class="btn" id="rtake">Take</button>'}${d.p||d.sc?'':`<button class="btn" id="rscr">Scrap<small>+${scrapVal(it)}</small></button>`}</div>`};
 const take=i=>{const it=loot[i];if(!it)return false;const d=ITEMS[it.id];
  if(d.sc){G.scrap+=it.q;loot.splice(i,1);return true}
  if(d.a){const ex=G.inv.find(x=>x.id===it.id);if(ex){ex.q+=it.q;loot.splice(i,1);return true}}
  if(!d.p&&invCount()>=capacity()){toast('Backpack full. Scrap something?');return false}G.inv.push(it);loot.splice(i,1);if(d.p){addLog(`Got a radio part: ${d.n}!`,'gold');G.locs[G.at]&&(G.locs[G.at].parts=Math.max(0,G.locs[G.at].parts-1))}return true};
 // scrap auto-collects
 const autoScrap=()=>{for(let i=loot.length-1;i>=0;i--)if(ITEMS[loot[i].id].sc){G.scrap+=loot[i].q;addLog(`+${loot[i].q} scrap.`);loot.splice(i,1)}};
 $('#ov').onclick=e=>{const c=e.target.closest('#rgrid [data-i]');if(c&&!c.classList.contains('unk')&&loot[+c.dataset.i]&&!$('#done').disabled){info(+c.dataset.i);return}
  if(e.target.closest('#rtake')){take(sel);sel=null;refresh();$('#rinfo').innerHTML='';save()}
  if(e.target.closest('#rscr')){const it=loot[sel];const v=scrapItems([it],loot);toast('+'+v+' scrap');sel=null;refresh();$('#rinfo').innerHTML='Scrapped.';save()}
  if(e.target.closest('#req')){const it=loot[sel];const sl=ITEMS[it.id].s;const old=G.eq[sl];if(sl==='back'&&old&&invCount()>4+st(it,'cap')+(eq('legs')?st(eq('legs'),'cap'):0))return toast('Too much in your pack for that bag');G.eq[sl]=it;loot.splice(sel,1);if(old){loot.push(old)}addLog(`Equipped ${iname(it)}.`,'good');sel=null;refresh();$('#rinfo').innerHTML='Equipped. Your old item is in the box.';save()}
  if(e.target.closest('#scrapj')){const j=loot.filter(isJunk);if(j.length){const v=scrapItems(j,loot);toast(`Scrapped ${j.length} · +${v} scrap`);sel=null;refresh();$('#rinfo').innerHTML='Junk scrapped.';save()}}
  if(e.target.closest('#takeall')){autoScrap();const order=loot.filter(x=>!isJunk(x)).sort((a,b)=>(ITEMS[b.id].p?9:b.r)-(ITEMS[a.id].p?9:a.r));for(const it of order){if(!take(loot.indexOf(it)))break}sel=null;refresh();$('#rinfo').innerHTML=loot.length?'Left in the box: '+(loot.filter(isJunk).length?'junk (scrap it?)':'no room in your pack'):'Box emptied.';save()}
  if(e.target.closest('#done')){autoScrap();closeOv();save();if(G.scr==='enc')renderEnc();if(invCount()>=capacity())tip('full','Pack full? Open Gear and tap <b>Scrap Junk</b>. Junk-tagged items turn into scrap for upgrades at the workbench.')}};}
function desc(it){const d=ITEMS[it.id];if(d.dmg)return `Damage ${st(it,'dmg')}${d.burst?' ×'+d.burst:''} · Noise ${d.nz}${d.am?' · uses '+ITEMS[d.am].n:' · quiet'}`;if(d.s==='back')return `Carry +${st(it,'cap')} slots`;if(d.s)return `Armor ${st(it,'ar')}${d.st?' · Stealth '+(d.st>0?'+':'')+d.st:''}${d.cap?' · +'+d.cap+' slots':''}${d.nv?' · Sees in the dark':''}`;if(d.u==='food')return `Hunger -${d.v}`;if(d.u==='heal')return `Heals ${d.v}`;if(d.u==='bomb')return 'Burns every zombie in a room. Very loud.';if(d.a)return `${it.q} ${it.id==='bolts'?'bolts':'rounds'}`;if(d.sc)return `${it.q} scrap for crafting`;if(it.id==='lockpick')return 'Opens one lockbox quietly';if(it.id==='keycard')return 'Opens one safe instantly';if(d.p)return 'Radio part. Bring it to Echo Hill.';return ''}
function cmp(it){const d=ITEMS[it.id];if(!d.s)return '';const o=G.eq[d.s];if(!o)return ' <span class="c1">(empty slot)</span>';if(o===it)return ' <span>(equipped)</span>';
 const parts=[];const f=(k,lab,inv)=>{const dv=st(it,k)-st(o,k);if(dv)parts.push(`<span class="${(inv?-dv:dv)>0?'c1':'c0'}">${dv>0?'+':''}${dv} ${lab}</span>`)};
 if(d.dmg){f('dmg','dmg');f('nz','noise',1)}else{f('ar','armor');f('st','stealth');f('cap','slots')}
 return `<br>vs ${iname(o)}: ${parts.length?parts.join(' · '):'same'}`}
// ---------- gear
let gsel=null;
function showGear(){gsel=gsel||null;const pos={head:[4,0],body:[4,78],legs:[4,156],melee:[4,234],back:[184,0],primary:[184,78],secondary:[184,156]};
 const doll=Object.entries(pos).map(([s,[x,y]])=>{const it=G.eq[s];return `<div class="cell ${it?'r'+it.r:''}" data-eq="${s}" style="left:${x}px;top:${y}px">${it?`<img src="${IMG(it.id)}">`:''}<span class="lab">${s.toUpperCase()}</span></div>`}).join('');
 const cap=capacity();const inv=Array.from({length:Math.max(cap,G.inv.length)},(_,i)=>{const it=G.inv[i];return it?cellH(it,i,'data-iv').replace('class="cell',`class="cell ${gsel&&gsel.has(it.u)?'sel':''}`):'<div class="cell"></div>'}).join('');
 const parts=G.inv.filter(i=>ITEMS[i.id].p).length;const junk=G.inv.filter(isJunk);const jv=junk.reduce((a,x)=>a+scrapVal(x),0);
 const selBar=gsel?`<div class="row tight"><button class="btn hot" data-act="sscrap">Scrap ${gsel.size}<small>+${G.inv.filter(i=>gsel.has(i.u)).reduce((a,x)=>a+scrapVal(x),0)} scrap</small></button>${traderHere()?`<button class="btn hot2" data-act="ssell">Sell ${gsel.size}<small>+${G.inv.filter(i=>gsel.has(i.u)).reduce((a,x)=>a+sellVal(x),0)} batteries</small></button>`:''}<button class="btn" data-act="scancel">Cancel</button></div>`:
 `<div class="row tight"><button class="btn ${junk.length?'hot':''}" data-act="sjunk" ${junk.length?'':'disabled'}>Scrap Junk<small>${junk.length} item(s) · +${jv}</small></button><button class="btn" data-act="smulti">Select<small>multi-scrap</small></button><button class="btn" data-act="sort">Sort</button><button class="btn" data-act="bench">Workbench<small>${G.scrap} scrap</small></button></div>`;
 ov(`<div class="doll">${doll}</div><div class="inv"><div class="ghead"><h2>Survivor</h2><button class="btn hot" id="x">Close</button></div><div class="stats"><span>Health ${Math.round(G.hp)}</span><span>Armor ${armor()}</span><span>Stealth ${stealth()>=0?'+':''}${stealth()}</span><span>Melee ${wStats('melee').dmg} dmg</span><span>Pack ${invCount()}/${cap}</span><span>Parts ${parts} carried · ${G.installed} installed</span><span>Scrap ${G.scrap} · Batteries ${G.cells}</span><span>9mm ${ammoOf('ammo9')} · shells ${ammoOf('shells')} · rifle ${ammoOf('ammo762')} · bolts ${ammoOf('bolts')}</span></div>
 ${selBar}<div class="grid">${inv}</div><div class="info" id="ginfo">${gsel?'Tap items to select them.':'Tap gear or an item. ▲ = upgrade · JUNK = worse than what you wear.'}</div></div>`,'gear');
 $('#ov').onclick=e=>{const a=e.target.closest('[data-act]');if(a)return gAct(a.dataset.act,a.dataset.k);
  const c=e.target.closest('[data-eq],[data-iv]');if(c){if(gsel&&c.dataset.iv!=null){const it=G.inv[+c.dataset.iv];if(!ITEMS[it.id].p){gsel.has(it.u)?gsel.delete(it.u):gsel.add(it.u)}return showGear()}gInfo(c.dataset.eq,c.dataset.iv!=null?+c.dataset.iv:null);return}
  if(e.target.closest('#x')){gsel=null;closeOv();G.scr==='enc'?renderEnc():showMap()}}}
function gInfo(s,i){let it,h='';if(s){it=G.eq[s];if(!it)return $('#ginfo').innerHTML='Empty '+s+' slot. Find gear in containers.';h=`<button class="btn" data-act="uneq" data-k="${s}">Unequip</button>`}else{it=G.inv[i];const d=ITEMS[it.id];if(d.s)h+=`<button class="btn hot" data-act="eq" data-k="${i}">Equip</button>`;if(d.u==='food'||d.u==='heal')h+=`<button class="btn hot" data-act="use" data-k="${it.u}">Use</button>`;
  if(!d.p){h+=`<button class="btn" data-act="scrap" data-k="${i}">Scrap<small>+${scrapVal(it)}</small></button>`;if(traderHere())h+=`<button class="btn hot2" data-act="sell" data-k="${i}">Sell<small>+${sellVal(it)} batt.</small></button>`;if(d.s)h+=`<button class="btn" data-act="junk" data-k="${i}">${isJunk(it)?'Not junk':'Mark junk'}</button>`;h+=`<button class="btn" data-act="fav" data-k="${i}">${it.fav?'Unlock ★':'Lock ★'}</button>`}}
 $('#ginfo').innerHTML=`<b class="c${isGear(it)?it.r:0}">${iname(it)}</b> <span class="c${isGear(it)?it.r:0}">${rlabel(it)}</span><br>${desc(it)}${s?'':cmp(it)}<div class="row" style="justify-content:flex-start">${h}</div>`}
function gAct(a,k){const it=k!=null&&!isNaN(+k)?G.inv[+k]:null;
 if(a==='uneq'){if(invCount()>=capacity()-(k==='back'?st(G.eq.back,'cap'):0))return toast('No room in pack');G.inv.push(G.eq[k]);delete G.eq[k]}
 if(a==='eq'){const sl=ITEMS[it.id].s;const o=G.eq[sl];if(sl==='back'&&invCount()-1+(o?1:0)>4+st(it,'cap')+(eq('legs')?st(eq('legs'),'cap'):0))return toast('Too much in your pack for that bag');G.eq[sl]=it;G.inv.splice(+k,1);if(o)G.inv.push(o);toast('Equipped '+iname(it))}
 if(a==='scrap'){const v=scrapItems([it]);toast('+'+v+' scrap')}
 if(a==='sell'){G.cells+=sellVal(it);G.inv.splice(+k,1);toast('Sold')}
 if(a==='junk'){if(isJunk(it)){it.j=0;it.nj=1}else{it.j=1}}
 if(a==='fav'){it.fav=it.fav?0:1;it.j=0}
 if(a==='use'){save();return useItem(+k,1)}
 if(a==='sjunk'){const j=G.inv.filter(isJunk);return ov(`<h2>Scrap ${j.length} junk item(s)?</h2><div class="grid" style="justify-content:center;margin:8px auto">${j.map((x,i)=>cellH(x,i,'data-n')).join('')}</div><p>You get <b>${j.reduce((a,x)=>a+scrapVal(x),0)} scrap</b>. Locked ★, equipped, Epic and Legendary items are never touched.</p><div class="row"><button class="btn hot" data-act="sjunk2">Scrap them</button><button class="btn" data-act="back">Cancel</button></div>`)}
 if(a==='sjunk2'){const j=G.inv.filter(isJunk);const v=scrapItems(j);toast(`Scrapped ${j.length} · +${v} scrap`);addLog(`You strip ${j.length} useless thing(s) for ${v} scrap.`)}
 if(a==='smulti')gsel=new Set();
 if(a==='scancel')gsel=null;
 if(a==='sscrap'){const l=G.inv.filter(i=>gsel.has(i.u));const v=scrapItems(l);toast(`+${v} scrap`);gsel=null}
 if(a==='ssell'){const l=G.inv.filter(i=>gsel.has(i.u));const v=l.reduce((a,x)=>a+sellVal(x),0);G.cells+=v;G.inv=G.inv.filter(i=>!gsel.has(i.u));toast(`+${v} batteries`);gsel=null}
 if(a==='sort'){const o=x=>ITEMS[x.id].p?0:ITEMS[x.id].s?1:ITEMS[x.id].u==='heal'?2:ITEMS[x.id].u==='food'?3:4;G.inv.sort((x,y)=>o(x)-o(y)||y.r-x.r)}
 if(a==='bench'){save();return showBench()}
 save();showGear()}
// ---------- workbench
function upCost(it){return [4,8,16,26][it.r]}
function showBench(){const slots=Object.keys(G.eq).filter(s=>G.eq[s]);
 const ups=slots.map(s=>{const it=G.eq[s];const c=it.r<4?upCost(it):0;return `<div class="brow"><div class="cell r${it.r}"><img src="${IMG(it.id)}"></div><div class="bt"><b class="c${it.r}">${iname(it)}</b><br><small>${desc(it)}</small></div>${it.r<4?`<button class="btn ${G.scrap>=c?'hot':''}" data-up="${s}" ${G.scrap>=c?'':'disabled'}>To ${RAR[it.r+1]}<small>${c} scrap</small></button>`:'<small>Maxed</small>'}</div>`}).join('');
 const cr=RECIPES.map((r,i)=>`<button class="btn ${G.scrap>=r.c?'':''}" data-cr="${i}" ${G.scrap>=r.c?'':'disabled'}><img src="${IMG(r.id)}" class="bi">${r.n}<small>${r.c} scrap</small></button>`).join('');
 ov(`<div class="bhead"><img src="${IMG('bench')}"><div><h2>Workbench</h2><p>Scrap: <b>${G.scrap}</b>. Upgrade worn gear one rarity at a time, or craft supplies.</p></div></div><div class="blist">${ups||'<p>Nothing equipped.</p>'}</div><h3>Craft</h3><div class="row">${cr}</div><div class="row"><button class="btn hot" id="bx">Back to Gear</button></div>`,'dlg bench');
 $('#ov').onclick=e=>{const u=e.target.closest('[data-up]');if(u){const it=G.eq[u.dataset.up];const c=upCost(it);if(G.scrap<c)return;G.scrap-=c;it.r++;toast(`${iname(it)}!`);addLog(`You rebuild your gear at the bench: ${iname(it)}.`,'gold');save();return showBench()}
  const c=e.target.closest('[data-cr]');if(c){const r=RECIPES[+c.dataset.cr];if(G.scrap<r.c)return;const d=ITEMS[r.id];if(d.a){const ex=G.inv.find(x=>x.id===r.id);if(ex)ex.q+=r.q;else{if(invCount()>=capacity())return toast('Backpack full');const n=mk(r.id);n.q=r.q;G.inv.push(n)}}else{if(invCount()>=capacity())return toast('Backpack full');G.inv.push(mk(r.id))}G.scrap-=r.c;toast('Crafted '+r.n);save();return showBench()}
  if(e.target.closest('#bx'))showGear()}}
// ---------- trader
function showTrader(){const T=G.trader;const items=T.stock.map((s,i)=>{const nm=s.id==='rumor'?'Rumor: where a radio part is':s.r!=null?iname({id:s.id,r:s.r}):ITEMS[s.id].n;return `<button class="btn" data-b="${i}" ${G.cells>=s.p?'':'disabled'}><img class="bi" src="${IMG(s.id==='rumor'?'signal':s.id)}">${nm}<small>${s.p} batteries</small></button>`}).join('');
 const junk=G.inv.filter(isJunk);const jv=junk.reduce((a,x)=>a+sellVal(x),0);
 ov(`<div class="bhead"><img src="${IMG('trader')}" class="tport"><div><h2>Rosa, wandering trader</h2><p>"Batteries, sugar. Everything costs batteries now." You have <b>${G.cells}</b>.</p><div class="row" style="justify-content:flex-start"><button class="btn hot2" id="sj" ${junk.length?'':'disabled'}>Sell all junk<small>${junk.length} item(s) · +${jv} batteries</small></button><button class="btn" id="sg">Sell from pack</button><button class="btn" id="ss" ${G.scrap>=5?'':'disabled'}>Trade 5 scrap<small>+1 battery</small></button></div></div></div><h3>For sale</h3><div class="row">${items||'<p>Sold out.</p>'}</div><div class="row"><button class="btn hot" id="tx">Leave</button></div>`,'dlg bench');
 $('#ov').onclick=e=>{if(e.target.closest('#sj')){const j=G.inv.filter(isJunk);const v=j.reduce((a,x)=>a+sellVal(x),0);G.inv=G.inv.filter(x=>!j.includes(x));G.cells+=v;toast(`+${v} batteries`);save();return showTrader()}
  if(e.target.closest('#sg'))return showGear();if(e.target.closest('#ss')&&G.scrap>=5){G.scrap-=5;G.cells++;save();return showTrader()}
  const b=e.target.closest('[data-b]');if(b){const s=T.stock[+b.dataset.b];if(G.cells<s.p)return;
   if(s.id==='rumor'){const c=Object.keys(G.locs).filter(k=>G.locs[k].parts>0);G.cells-=s.p;T.stock.splice(+b.dataset.b,1);const k=c.length?pick(c):null;addLog(k?`Rosa leans in: "Heard there's still a radio part in ${LOC[k].n}."`:'Rosa shrugs: "You found them all, hon."','gold');toast(k?'Part rumored at '+LOC[k].n:'No parts left');save();return showTrader()}
   const d=ITEMS[s.id];const it=mk(s.id,s.r);if(d.a){const ex=G.inv.find(x=>x.id===s.id);if(ex){ex.q+=it.q}else{if(invCount()>=capacity())return toast('Backpack full');G.inv.push(it)}}else{if(invCount()>=capacity())return toast('Backpack full');G.inv.push(it)}
   G.cells-=s.p;T.stock.splice(+b.dataset.b,1);toast('Bought '+iname(it));save();return showTrader()}
  if(e.target.closest('#tx')){closeOv();showMap()}};
 tip('trader','Rosa moves every couple of days. Junk sells for batteries; batteries buy medicine, ammo and rumors about radio parts.')}
// ---------- safehouse
function showSafe(){const rows=Object.entries(SAFE).map(([k,s])=>{const lv=G.safe[k]||0;const c=s.c[lv];return `<div class="brow"><div class="bt"><b>${s.n}${lv?' · level '+lv:''}</b><br><small>${s.d}</small></div>${c!=null?`<button class="btn ${G.scrap>=c?'hot':''}" data-sf="${k}" ${G.scrap>=c?'':'disabled'}>Build<small>${c} scrap</small></button>`:'<small>Built</small>'}</div>`}).join('');
 ov(`<div class="bhead"><img src="${IMG('safehouse')}"><div><h2>Your Safehouse</h2><p>Scrap: <b>${G.scrap}</b>. Resting here is safer than anywhere else.</p></div></div><div class="blist">${rows}</div><div class="row"><button class="btn hot" id="sx">Back</button></div>`,'dlg bench');
 $('#ov').onclick=e=>{const b=e.target.closest('[data-sf]');if(b){const k=b.dataset.sf;const c=SAFE[k].c[G.safe[k]||0];if(G.scrap<c)return;G.scrap-=c;G.safe[k]=(G.safe[k]||0)+1;toast(SAFE[k].n+' built');addLog(`You build: ${SAFE[k].n}. Home is getting cozy.`,'good');save();return showSafe()}if(e.target.closest('#sx'))showMap()}}
// ---------- tower
function install(){const ps=G.inv.filter(i=>ITEMS[i.id].p);if(G.installed>=12)return broadcast();if(!ps.length)return toast('No radio parts in your pack');
 G.installed+=ps.length;G.inv=G.inv.filter(i=>!ITEMS[i.id].p);META.best=Math.max(META.best,G.installed);saveMeta();addLog(`You wire ${ps.length} part(s) into the transmitter. Signal ${G.installed}/12.`,'gold');toast(`Signal ${G.installed}/12`);
 if(G.installed>=12)addLog('The transmitter hums to life. Broadcasting will draw every shambler on the hill. Be ready.','gold');save();renderEnc()}
function broadcast(){ov(`<h2>Broadcast?</h2><p>You will have to hold the shack against 4 waves of the dead until the rescue chopper answers. Make sure you're armed and healed.</p><div class="row"><button class="btn hot" id="b">Send the Signal</button><button class="btn" id="x">Not yet</button></div>`);
 $('#ov').onclick=e=>{if(e.target.id==='x')closeOv();if(e.target.closest('#b')){closeOv();G.final=1;wave()}}}
function wave(){const l=G.locs.tower;const room=l.rooms[l.cur];if(G.final>4)return win();addLog(`WAVE ${G.final}/4: they come up through the wildflowers.`,'bad');room.z=Array.from({length:1+Math.ceil(G.final/1.5)},()=>Object.assign(mkZ(pick(['walker','runner','crawler','walker'])),{aw:1}));room.clock=99;room.wave=1;save();renderEnc()}
// ---------- end
function die(why){G.over=1;const pts=G.installed*2+G.day+Math.floor(G.kills/5)+Math.floor(G.searched/6);const before=KITS.filter(k=>k.need<=META.pts).length;META.pts+=pts;const nu=KITS.filter(k=>k.need<=META.pts).slice(before);
 META.journal.unshift(`Day ${G.day}: ${why}`);META.journal=META.journal.slice(0,6);META.hist.unshift(`Died day ${G.day} · signal ${G.installed}/12 · ${G.kills} kills`);META.hist=META.hist.slice(0,5);saveMeta();localStorage.removeItem('ls_run');
 ov(`<h2 style="color:#c0392b">YOU DIED</h2><p>${why}</p><p>Signal ${G.installed}/12 · Kills ${G.kills} · Containers ${G.searched}</p><p class="gold">+${pts} journal points (total ${META.pts})</p>${nu.length?`<p class="gold">New start unlocked: ${nu.map(k=>k.n).join(', ')}!</p>`:`<p style="font-size:12px">${(KITS.find(k=>k.need>META.pts)||{n:''}).n?'Next start at '+KITS.find(k=>k.need>META.pts).need+' pts':''}</p>`}<div class="row"><button class="btn hot" id="t">Continue</button></div>`);$('#ov').onclick=e=>{if(e.target.id==='t'){closeOv();showTitle()}}}
function win(){G.over=1;const mins=Math.round((Date.now()-G.started)/60000);META.wins++;META.pts+=40;META.best=12;META.hist.unshift(`RESCUED day ${G.day} · ${G.kills} kills`);META.hist=META.hist.slice(0,5);saveMeta();localStorage.removeItem('ls_run');
 ov(`<h2 style="color:#b8650f">SOMEONE HEARD YOU</h2><img src="img/bg_title.jpg" style="width:100%;max-height:34vh;object-fit:cover;border-radius:4px"><p>A voice answers. Then rotor blades over Echo Hill. You made it on day ${G.day}, and nobody even asked for a timesheet.</p><p>Kills ${G.kills} · Containers ${G.searched} · ${mins} min</p><p>+40 journal points</p><div class="row"><button class="btn hot" id="t">Title</button></div>`);$('#ov').onclick=e=>{if(e.target.id==='t'){closeOv();showTitle()}}}
window.__G=()=>G;
showTitle();
