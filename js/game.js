/* Archangel Cosmos - Phase 1 engine. Pure JS, no dependencies. */
(function(){
'use strict';
var W=48,H=32,TS=AC.art.TS,SAVE_KEY='archangelCosmos.save.v1';
AC.H=AC.H||{prod:[],tax:[],sell:[],happy:[],growth:[],tick:[],migrate:[],panel:{},act:{},advise:[]};
function hmul(n,a){var m=1;AC.H[n].forEach(function(f){m*=f.apply(null,a);});return m;}
function hsum(n,a){var m=0;AC.H[n].forEach(function(f){m+=f.apply(null,a);});return m;}
var slot=1;try{slot=+localStorage.getItem('archangelCosmos.slotSel')||1;}catch(e){}function skey(){return slot===1?SAVE_KEY:SAVE_KEY+'.slot'+slot;}
var G=null, sel=null, timer=null, speed=1, paused=false;
var BY={}; AC.BUILDINGS.forEach(function(b){BY[b.id]=b;});
var $=function(id){return document.getElementById(id);};
function fmt(n){n=Math.floor(n);var a=Math.abs(n);return a>=1e9?(n/1e9).toFixed(2)+'B':a>=1e6?(n/1e6).toFixed(2)+'M':a>=1e4?(n/1e3).toFixed(1)+'K':String(n);}

/* ---------- seeded RNG + value noise ---------- */
function rng(seed){var s=seed>>>0||1;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return ((s>>>0)%1e9)/1e9;};}
function noiseGrid(r,gw,gh){var g=[];for(var i=0;i<(gw+1)*(gh+1);i++)g.push(r());return g;}
function sample(g,gw,x,y){var x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
 var a=g[y0*(gw+1)+x0],b=g[y0*(gw+1)+x0+1],c=g[(y0+1)*(gw+1)+x0],d=g[(y0+1)*(gw+1)+x0+1];return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;}
function fbm(r,oct){var layers=[];for(var o=0;o<oct;o++){var gw=3<<o,gh=2<<o;layers.push({g:noiseGrid(r,gw,gh),gw:gw,gh:gh});}
 return function(x,y){var v=0,amp=1,tot=0;layers.forEach(function(L){v+=amp*sample(L.g,L.gw,x/W*L.gw*0.999,y/H*L.gh*0.999);tot+=amp;amp*=0.5;});return v/tot;};}

/* ---------- Phase 1 world generation: Planet Elysia ---------- */
function genPlanet(seed){
 var r=rng(seed),h=fbm(r,4),m=fbm(r,3),t=[];
 for(var y=0;y<H;y++)for(var x=0;x<W;x++){
  var dx=(x-W/2)/(W/2),dy=(y-H/2)/(H/2),e=h(x,y)-0.25*(dx*dx+dy*dy)+0.08,mo=m(x,y),lat=Math.abs(y-H/2)/(H/2),k;
  if(e<0.33)k='ocean';else if(e<0.38)k='shallow';else if(e>0.62)k='mountain';
  else if(lat>0.82)k='arctic';else if(mo>0.66&&e>0.5)k='volcanic';else if(mo<0.32)k='desert';
  else if(mo>0.58)k='forest';else k='plains';
  t.push({t:k,b:null,dep:false,ruin:false});
 }
 for(var i=0;i<W*H;i++){var c=t[i];
  if(c.t==='mountain'&&r()<0.25)c.dep=true;
  if((c.t==='plains'||c.t==='desert')&&r()<0.012)c.t='crystal';
  if(LAND.indexOf(c.t)>=0&&r()<0.006)c.ruin=true;}
 // guarantee crystal patch and ruins
 var land=t.map(function(c,i){return i;}).filter(function(i){return t[i].t==='plains'||t[i].t==='desert';});
 for(var j=0;j<3&&land.length;j++){t[land[Math.floor(r()*land.length)]].t='crystal';t[land[Math.floor(r()*land.length)]].ruin=true;}
 return t;
}

function newGame(seed){
 seed=seed||Math.floor(Math.random()*1e9);
 G={v:1,phase:'genesis',seed:seed,day:0,pop:100000,baseHousing:105000,tax:10,happy:60,
  res:{credits:20000,food:6000,water:6000,energy:60,iron:100,metal:0,goods:0,titanium:0,crystal:0,research:0,light:0},
  made:{},counts:{},tech:{},researching:null,missions:{},sold:0,ruinsFound:0,space:{sat:false,probe:false,colony:false},
  market:{},tiles:genPlanet(seed),net:{},log:[]};
 for(var k in AC.MARKET)G.market[k]=AC.MARKET[k].stock;migrate(G);
 say('Welcome, Governor. Scan of Elysia complete: 100,000 Angelic Humans landed safely. Resources detected: iron, food, water, energy. First, place the Capital Hall on flat land (plains, forest or desert).');
}

/* ---------- economy ---------- */
function price(k){var m=AC.MARKET[k];return m.base*Math.min(3,Math.max(0.3,Math.pow(m.stock/Math.max(1,G.market[k]),0.6)));}
function sellBonus(){return (1+0.1*Math.min(3,G.counts.market||0))*hmul('sell',[G]);}
function neighbors(i){var x=i%W,y=(i/W)|0,o=[];[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var nx=x+d[0],ny=y+d[1];if(nx>=0&&ny>=0&&nx<W&&ny<H)o.push(ny*W+nx);});return o;}
function roadBonus(i){var on=neighbors(i).some(function(n){return G.tiles[n].b==='road';});return on?(G.tech.transport?1.25:1.1):1;}

function tick(){
 if(!G)return;
 G.day++;var R=G.res,net={},hasCap=(G.counts.capital||0)>0;
 function add(k,v){R[k]=(R[k]||0)+v;net[k]=(net[k]||0)+v;if(v>0)G.made[k]=(G.made[k]||0)+v;}
 var list=[],done=[];G.tiles.forEach(function(c,i){if(c.con){if(--c.con.left<=0)done.push(i);return;}if(c.b&&c.b!=='road')list.push(i);});done.forEach(complete);
 // producers without inputs first, then converters
 list.sort(function(a,b){return (BY[G.tiles[a].b].cons?1:0)-(BY[G.tiles[b].b].cons?1:0);});
 var happyBonus=0,taxMult=0,growth=0,idle=0;
 list.forEach(function(i){var c=G.tiles[i],b=BY[c.b],ok=true,k;
  if(b.cons){for(k in b.cons)if((R[k]||0)<b.cons[k])ok=false;}
  c.idle=!ok;if(!ok){idle++;return;}
  for(k in b.cons)add(k,-b.cons[k]);
  var mult=roadBonus(i);
  for(k in b.prod){var v=b.prod[k]*mult*hmul('prod',[G,b,c,i,k]);
   if(b.id==='farm'&&G.tech.agriculture)v*=1.5;
   if(b.id==='mine'&&c.dep)v*=3;
   if(b.id==='solar'&&c.t==='desert')v*=1.5;
   if((b.id==='refinery'||b.id==='factory')&&G.tech.industry)v*=1.25;
   add(k,v);}
  happyBonus+=b.happy||0;taxMult+=b.tax||0;growth+=b.growth||0;});
 // population needs
 var food=G.pop*0.004,water=G.pop*0.003,short=0;
 add('food',-food);add('water',-water);
 if(R.food<0){R.food=0;short++;} if(R.water<0){R.water=0;short++;}
 if(R.energy<5&&idle>0)short+=0.5;
 R.energy=Math.min(R.energy,2000);
 // happiness and taxes
 G.happy=Math.max(0,Math.min(100,55+Math.min(35,happyBonus)+hsum('happy',[G])-(G.tax-10)*1.5-short*15));
 if(hasCap)add('credits',G.pop/1000*G.tax*0.25*taxMult*hmul('tax',[G])*(0.5+G.happy/120));
 // population
 var cap=housing(),hf=G.happy/60;
 if(short>=1)G.pop*=0.995;
 else if(G.pop<cap)G.pop=Math.min(cap,G.pop*(1+(0.004+growth+hsum('growth',[G]))*hf));
 else G.pop=Math.max(cap,G.pop*0.999);
 // research progress
 if(G.researching){var t=AC.RESEARCH.find(function(x){return x.id===G.researching;});
  if(R.research>=t.cost){R.research-=t.cost;G.tech[t.id]=true;G.researching=null;toast('Research complete: '+t.n);}}
 // market drift back toward normal supply (NPC demand/supply)
 for(var m in G.market)G.market[m]+=(AC.MARKET[m].stock-G.market[m])*0.02;
 AC.H.tick.forEach(function(f){f(G,add);});
 G.net=net;
 checkMissions();
 if(G.day%30===0)save(true);
 if(G.day%5===0)advise();
 render();
}
function housing(){var s=G.baseHousing;G.tiles.forEach(function(c){if(c.b&&!c.con&&BY[c.b].housing)s+=BY[c.b].housing;});return s;}

function checkMissions(){AC.MISSIONS.forEach(function(m){if(G.missions[m.id])return;if(m.check(G)){G.missions[m.id]=true;
 for(var k in m.reward)G.res[k]+=m.reward[k];toast('Mission complete: '+m.n+' (+'+Object.keys(m.reward).map(function(k){return fmt(m.reward[k])+' '+AC.RES[k].n;}).join(', ')+')');
 if(m.id==='M19')setTimeout(function(){toast('Genesis complete! Phase 2 Archangel: Starborn unlocked. Open the Space view (🪐 button).');if(AC.audio)AC.audio.sfx('success');},2600);}});}

/* ---------- actions ---------- */
function canAfford(cost){for(var k in cost)if((G.res[k]||0)<cost[k])return false;return true;}
function placeError(b,i){var c=G.tiles[i];
 if(b.req&&!G.tech[b.req])return 'Requires research: '+b.req;
 if(b.id!=='capital'&&b.id!=='road'&&!G.counts.capital)return 'Build the Capital Hall first.';
 if(c.b)return 'Tile already occupied.';
 if(b.on.indexOf(c.t)<0)return b.n+' cannot be built on '+AC.TERRAIN[c.t].n+'.';
 if(b.unique&&(G.counts[b.id]||G.tiles.some(function(t){return t.con&&t.b===b.id;})))return 'Only one '+b.n+' allowed.';
 if(b.near==='water'&&!neighbors(i).some(function(n){var t=G.tiles[n].t;return t==='ocean'||t==='shallow';}))return 'Must be next to water.';
 if(b.id==='outpost'&&!c.ruin)return 'Explorer Outposts must be built on ruins (◈).';
 if(!canAfford(b.cost))return 'Not enough resources.';
 return null;}
/* construction timers: days scale with building size (cost) */
function conDays(b){if(b.id==='road')return 0;var v=0;for(var k in b.cost)v+=b.cost[k]*(k==='credits'?1:30);return Math.max(2,Math.min(40,Math.round(Math.sqrt(v)/12)));}
function rushCost(c){return Math.max(5,Math.ceil(c.con.left*4));}
function complete(i){var c=G.tiles[i],id=c.b;if(!c.con)return;delete c.con;G.counts[id]=(G.counts[id]||0)+1;AC.art.place(i,W);fxBusy=true;if(AC.audio)AC.audio.sfx('success');
 if(id==='outpost'){G.tiles[i].ruin=false;G.ruinsFound++;var rw=[{credits:5000},{research:40},{crystal:15,light:20},{titanium:40}][G.ruinsFound%4];
  for(var k2 in rw)G.res[k2]+=rw[k2];toast('Ruins excavated! Ancient Aethari relics found: '+Object.keys(rw).map(function(k){return rw[k]+' '+AC.RES[k].n;}).join(', '));}
 else toast(BY[id].n+' construction complete!');checkMissions();}
function rush(i){var c=G.tiles[i];if(!c||!c.con)return;var n=rushCost(c);if((G.res.light||0)<n){toast('Speeding up needs '+n+' Celestial Light.');return;}G.res.light-=n;complete(i);render();}
function build(id,i){var b=BY[id],err=placeError(b,i);if(err){toast(err);return false;}
 for(var k in b.cost)G.res[k]-=b.cost[k];G.tiles[i].b=id;AC.art.place(i,W);fxBusy=true;if(AC.audio)AC.audio.sfx(id==='road'?'click':'build');
 var d=conDays(b);if(d>0&&!G.instantBuild){G.tiles[i].con={tot:d,left:d};toast(b.n+': construction started ('+d+' days).');}else{G.counts[id]=(G.counts[id]||0)+1;}
 if(id==='outpost'&&!G.tiles[i].con){G.tiles[i].con={tot:0,left:0};complete(i);}
 if(false){G.tiles[i].ruin=false;G.ruinsFound++;var rw=[{credits:5000},{research:40},{crystal:15,light:20},{titanium:40}][G.ruinsFound%4];
  for(var k2 in rw)G.res[k2]+=rw[k2];toast('Ruins excavated! Ancient Aethari relics found: '+Object.keys(rw).map(function(k){return rw[k]+' '+AC.RES[k].n;}).join(', '));}
 if(b.unique){sel=null;}
 checkMissions();render();return true;}
function demolish(i){var c=G.tiles[i];if(!c.b)return;var b=BY[c.b];if(c.con)delete c.con;else G.counts[c.b]--;c.b=null;
 for(var k in b.cost)G.res[k]+=Math.floor(b.cost[k]*0.5);toast(b.n+' demolished (50% refunded).');render();}
function trade(k,qty){ // qty>0 sell, <0 buy
 if(qty>0){if(G.res[k]<qty){toast('Not enough '+AC.RES[k].n);return;}if(!G.counts.capital){toast('Build the Capital Hall first.');return;}
  var gain=0;for(var i=0;i<qty;i+=10){gain+=price(k)*sellBonus()*Math.min(10,qty-i);G.market[k]+=Math.min(10,qty-i);}
  G.res[k]-=qty;G.res.credits+=gain;G.sold+=qty;}
 else{qty=-qty;var cost=0,s=G.market[k];for(var j=0;j<qty;j+=10){cost+=price(k)*1.2*Math.min(10,qty-j);G.market[k]-=Math.min(10,qty-j);}
  if(G.res.credits<cost){G.market[k]=s;toast('Not enough Credits');return;}G.res.credits-=cost;G.res[k]+=qty;}
 checkMissions();render();}
var SPACE=[
 {id:'sat',n:'Launch Satellite',cost:{credits:5000,goods:30},need:null,d:'Orbital survey network.'},
 {id:'probe',n:'Scan the Moon (probe)',cost:{credits:8000,goods:40,energy:100},need:'sat',d:'Map Seraph and find a colony site.'},
 {id:'colony',n:'Found Moon Colony',cost:{credits:40000,metal:200,goods:100,titanium:80,crystal:20},need:'probe',d:'Complete Genesis: establish humanity on Seraph.'}];
function launch(id){var s=SPACE.find(function(x){return x.id===id;});
 if(!G.counts.spaceport)return toast('Build a Spaceport first.');if(s.need&&!G.space[s.need])return toast('Complete the previous launch first.');
 if(G.space[id])return;if(!canAfford(s.cost))return toast('Not enough resources.');
 for(var k in s.cost)G.res[k]-=s.cost[k];G.space[id]=true;toast(s.n+' successful!');checkMissions();render();}

/* ---------- Archangel AI advisor (scripted, rule-based) ---------- */
function say(t){G.lastTip=t;var el=$('aiText');if(el)el.textContent=t;}
function advise(){var R=G.res,n=G.net,tips=[];
 function days(k){return n[k]<0?Math.floor(R[k]/-n[k]):Infinity;}
 if(!G.counts.capital)tips.push('Place the Capital Hall first: it collects taxes and unlocks construction.');
 if(days('food')<15)tips.push('Food production will run out in '+days('food')+' days. Build another Farm'+(G.tech.agriculture?'.':', and research Agriculture next.'));
 if(days('water')<15)tips.push('Water reserves last only '+days('water')+' more days. Build a Water Purifier beside the coast.');
 var idle=G.tiles.filter(function(c){return c.idle&&c.b;}).length;
 if(idle)tips.push(idle+' structure(s) are idle due to missing inputs (often Energy or Iron). Check your power grid.');
 if(G.pop>=housing()*0.97)tips.push('Housing is nearly full. Build Homes'+(G.tech.urban?' or Apartments':'')+' so the population can grow.');
 if(G.happy<45)tips.push('Morale is low ('+Math.round(G.happy)+'%). Lower taxes or build Parks and a Cathedral of Light.');
 if(!G.researching&&R.research>10)tips.push('Research points are idle. Choose a research path in the Research tab.');
 if(G.counts.capital&&!G.counts.lab)tips.push('A Research Centre will start your tech path toward Spaceflight.');
 if(G.counts.mine&&!G.counts.refinery)tips.push('Raw ore is cheap. A Refinery turns Iron into Refined Metal, which sells for far more.');
 if(G.counts.capital&&!G.counts.mine)tips.push('Iron deposits (dark dots on mountains) give triple yield. Place an Iron Mine there.');
 if(R.goods>50&&!G.counts.spaceport)tips.push('Industrial Goods are valuable. Sell some at the Market, but keep some for the Spaceport.');
 if(G.tiles.some(function(c){return c.ruin;})&&!G.ruinsFound)tips.push('I sense ancient ruins (◈) on the surface. An Explorer Outpost could uncover relics.');
 if(G.counts.spaceport&&!G.space.colony)tips.push('The Spaceport is ready. Open the Missions tab to launch toward the Moon.');
 var lore=['Lore: The Royal Heavenly Host once ruled a thousand worlds from the Throne of Topaz.','Lore: The Lumarians are beings of pure light, rumoured to watch from the nebulae.','Lore: Titanborn giants shaped mountains on the old worlds. Are Elysia\'s peaks their work?','Tip: Prices fall when you flood the market. Sell in smaller batches over time.','Tip: Buildings touching a Road produce +10% more.'];
 AC.H.advise.forEach(function(f){var x=f(G);if(x)tips.push(x);});
 if(!tips.length)tips.push(lore[G.day/5%lore.length|0]);
 say(tips[0]);}

/* ---------- rendering ---------- */
var cv,ctx;
var layers=null,terrFor=null,dirty=true,fxBusy=false,lastF=0;
function drawMap(){dirty=true;}
function rebuild(){if(terrFor!==G.tiles||!layers||AC.render.needTerrain){AC.render.needTerrain=false;terrFor=G.tiles;layers={terrain:AC.art.terrain(G,W,H)};AC.render.prepare(G,W,H,layers.terrain);}layers=AC.art.layersFor(G,W,H,layers.terrain);dirty=false;}
function loop(now){requestAnimationFrame(loop);
 if(!G||!ctx||document.hidden||!$('game').classList.contains('active'))return;
 if(now-lastF<(fxBusy||AC.render.moving()?16:(AC.settings.quality==='low'?66:33)))return;lastF=now; // ~25fps ambient, 60fps during effects
 if(dirty)rebuild();
 if(AC.arch&&AC.arch.active()){AC.arch.frame(now);return;}
 if(AC.galaxy&&AC.galaxy.active()){AC.galaxy.frame(now);return;}
 if(AC.space&&AC.space.active()){AC.space.frame(now);return;}
 if(AC.v3d&&AC.v3d.active()){AC.v3d.frame(now);return;}
 fxBusy=AC.render.draw(ctx,G,W,H,layers,now,hover,(hover!=null&&sel)?!placeError(BY[sel],hover):null);}
function hud(){var R=G.res,n=G.net,s='<span title="Day">'+IC.day+'<b>'+G.day+'</b></span><span title="Population / housing">'+IC.pop+'<b>'+fmt(G.pop)+'</b><small>/'+fmt(housing())+'</small></span><span title="Happiness">'+IC.happy+'<b>'+Math.round(G.happy)+'%</b></span>';
 ['credits','food','water','energy','iron','metal','goods','titanium','crystal','research','light'].forEach(function(k){
  var d=n[k]||0;s+='<span title="'+AC.RES[k].n+'">'+IC[k]+'<b>'+fmt(R[k])+'</b> <small style="color:'+(d<0?'#f88':'#8f8')+'">'+(d>=0?'+':'')+fmt(d)+'</small></span>';});
 $('hud').innerHTML=s;}
var ROADIMG='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 0v32M0 16h32" stroke="#8a7a5a" stroke-width="10"/><path d="M16 0v32M0 16h32" stroke="#d9cfb4" stroke-width="8"/><path d="M16 0v32M0 16h32" stroke="#e8c25a" stroke-dasharray="2 3"/></svg>');
var IC=AC.art.ICONS,thumbs={};function thumb(id){if(!thumbs[id])thumbs[id]=AC.art.sprite(id,2).toDataURL();return thumbs[id];}
function costStr(c){return Object.keys(c).map(function(k){return '<span class="cost" title="'+((AC.RES[k]||{}).n||k)+'">'+(IC[k]||'<b>'+((AC.RES[k]||{}).icon||k)+'</b>')+fmt(c[k])+'</span>';}).join(' ');}
var tab='build';
function panels(){
 if(tab==='build'){var h='<p class="small">Select a structure, then tap the map. Tap again to deselect. Tap a building with nothing selected to inspect it.</p>',cat='';
  var cons=[];G.tiles.forEach(function(c,i){if(c.con)cons.push(i);});
  if(cons.length){h+='<div class="small" style="color:#ffd76a">Under construction ('+cons.length+')</div>';cons.slice(0,8).forEach(function(i){var c=G.tiles[i],p=Math.round((1-c.con.left/c.con.tot)*100);
   h+='<div class="card con"><span class="t">'+BY[c.b].n+'</span> <small>'+c.con.left+' days left</small><div class="pbar"><i style="width:'+p+'%"></i></div><button class="mini" data-act="rush" data-arg="'+i+'">✦ Speed up ('+rushCost(c)+' Light)</button>'+(AC.store&&AC.store.CONFIG.PAID_SPEEDUP?'<button class="mini" data-act="paidRush" data-arg="'+i+'">⚡ Instant</button>':'')+'</div>';});}
  AC.BUILDINGS.forEach(function(b){if(b.cat!==cat){cat=b.cat;h+='<div class="small" style="margin-top:6px;color:#ffd76a">'+cat+'</div>';}
   var locked=b.req&&!G.tech[b.req];
   h+='<div class="card bcard'+(sel===b.id?' sel':'')+(locked?' locked':'')+'" data-b="'+b.id+'"><img class="thumb" alt="" src="'+(b.id==='road'?ROADIMG:thumb(b.id))+'"><span class="t">'+b.n+'</span> <small>('+(G.counts[b.id]||0)+')'+(conDays(b)?' · ⏱'+conDays(b)+'d':'')+'</small><br><span class="c">'+costStr(b.cost)+'</span> '+(locked?'🔒 '+b.req:'')+'<br><span class="e">'+b.d+'</span></div>';});
  $('tab-build').innerHTML=h;}
 if(tab==='market'){var m='<p class="small">Prices move with supply and demand. Selling floods the market and lowers the price; it recovers over time. Buying costs 20% more. Bonus from Trade Markets: x'+sellBonus().toFixed(1)+'</p>';
  for(var k in AC.MARKET){m+='<div class="row"><span>'+IC[k]+' '+AC.RES[k].n+'<br><small>'+fmt(G.res[k])+' owned · '+price(k).toFixed(1)+' ₵</small></span><span>'+
   '<button data-sell="'+k+'" data-q="10">Sell 10</button><button data-sell="'+k+'" data-q="100">Sell 100</button><button data-sell="'+k+'" data-q="-10">Buy 10</button></span></div>';}
  m+='<div class="row"><span>Tax rate: <b>'+G.tax+'%</b></span><span><button data-tax="-1">-</button><button data-tax="1">+</button></span></div><p class="small">TAC (TopazArchangelCoin) is a planned fictional in-game currency for later phases. There is no real cryptocurrency.</p>';
  $('tab-market').innerHTML=m;}
 if(tab==='missions'){var done=0,ms='';AC.MISSIONS.forEach(function(x){var d=G.missions[x.id];if(d)done++;
   ms+='<div class="card'+(d?' done':'')+'"><span class="t">'+x.id+' '+x.n+'</span><br>'+x.d+'<br><span class="e">Reward: '+costStr(x.reward)+'</span></div>';});
  var sp='<div class="small" style="color:#ffd76a">Spaceport launches</div>';SPACE.forEach(function(s){sp+='<div class="row"><span>'+s.n+(G.space[s.id]?' ✔':'')+'<br><small>'+costStr(s.cost)+'</small></span><button data-launch="'+s.id+'" '+(G.space[s.id]||!G.counts.spaceport?'disabled':'')+'>Launch</button></div>';});
  $('tab-missions').innerHTML='<p>Progress: <b>'+done+'/'+AC.MISSIONS.length+'</b></p>'+sp+ms;}
 if(tab==='research'){var r='<p class="small">Research Centres generate points. Choose a project; it completes when you have enough points.</p>';
  AC.RESEARCH.forEach(function(t){var st=G.tech[t.id]?'✔ Done':G.researching===t.id?'In progress ('+fmt(G.res.research)+'/'+t.cost+')':(t.req&&!G.tech[t.req])?'Needs '+t.req:'';
   r+='<div class="card'+(G.tech[t.id]?' done':'')+'" data-r="'+t.id+'"><span class="t">'+t.n+'</span> · '+t.cost+' 🔬<br><span class="e">'+t.d+'</span><br><small>'+st+'</small></div>';});
  $('tab-research').innerHTML=r;}}
function render(){if(!G)return;hud();drawMap();panels();if(AC.H.panel[tab]){var el=$('tab-'+tab),ae=document.activeElement;if(el&&!(ae&&(ae.tagName==='SELECT'||ae.tagName==='INPUT')&&el.contains(ae))){var st=el.scrollTop;el.innerHTML=AC.H.panel[tab](G);el.scrollTop=st;}}if(AC.H.render)AC.H.render(G);}
function toast(t,kind){if(AC.audio)AC.audio.sfx(kind||(/not enough|cannot|must|requires|first|failed|only one|occupied/i.test(t)?'error':'notify'));var el=$('toast');el.textContent=t;el.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(function(){el.style.display='none';},2500);}

/* ---------- save / load ---------- */
function migrate(g){g.v=g.v||1;AC.H.migrate.forEach(function(f){f(g);});g.v=2;return g;}
var saveFailNote=0;
function saveInd(ok,msg){var el=$('saveInd');if(!el)return;el.textContent=ok?'Saved ✓ '+new Date().toTimeString().slice(0,5):'⚠ Not saved';el.className=ok?'ok':'bad';el.title=msg||'';el.classList.add('flash');setTimeout(function(){el.classList.remove('flash');},900);}
function save(quiet,reason){if(!G)return false;G.saved=Date.now();var r=AC.saves.put(slot,G,reason||(quiet?'auto':'manual'));
 if(r.ok){saveInd(true,(r.idb?'IndexedDB':'')+(r.ls?' + local mirror':'')+' · '+Math.round(r.size/1024)+' KB');if(!quiet)toast('Game saved (slot '+slot+').','success');
  if(r.promise)r.promise.catch(function(e){if(!r.ls){saveInd(false,e.message);toast('⚠ Save failed: '+e.message+'. Use Menu → Export save to keep a backup file.','error');}});return true;}
 saveInd(false,r.err);if(!quiet||Date.now()-saveFailNote>60000){saveFailNote=Date.now();toast('⚠ Save failed: '+r.err+'. Use Menu → Export save to keep a backup file.','error');}return false;}
function loadJSON(json,from){var g=JSON.parse(json);G=migrate(g);terrFor=null;dirty=true;say(G.lastTip||'Welcome back, Governor.');render();toast('Game loaded (day '+G.day+(from&&from!=='main'?', from '+from:'')+').');return true;}
function load(){var s=AC.saves.get(slot);if(!s){toast('No save found in slot '+slot+'.');return false;}
 try{return loadJSON(s.json,s.from);}catch(e){console.warn('Load failed',e);for(var b=0;b<3;b++){var j=AC.saves.getBackup(slot,b);if(!j)continue;try{loadJSON(j,'backup '+(b+1));toast('The main save could not be read ('+e.message+'); restored backup '+(b+1)+'.','alert');return true;}catch(e2){}}
  toast('⚠ Load failed: '+e.message+'. Your save was NOT deleted. Try Menu → Import save or contact support.','error');return false;}}

/* ---------- screens & input ---------- */
function show(id){document.querySelectorAll('.screen').forEach(function(s){s.classList.toggle('active',s.id===id);});
 if(id==='game')startLoop();else stopLoop();}
function startLoop(){stopLoop();timer=setInterval(function(){if(!paused)for(var i=0;i<speed;i++)tick();},1000);}
function stopLoop(){if(timer)clearInterval(timer);timer=null;}
var hover=null;
function tileAt(e){var p=AC.render.toWorld(e.clientX,e.clientY),x=Math.floor(p.x/TS),y=Math.floor(p.y/TS);return (x>=0&&y>=0&&x<W&&y<H)?y*W+x:null;}
function info(i){var c=G.tiles[i],s=AC.TERRAIN[c.t].n+(c.dep?' · iron deposit':'')+(c.ruin?' · ancient ruins':'');if(c.b)s+=' · '+BY[c.b].n+(c.con?' (under construction, '+c.con.left+' days left)':c.idle?' (idle)':'');if(AC.districts)s+=' · '+AC.districts.name(i);$('tileInfo').textContent=s;}
var starData=null;
function stars(){var c=$('stars');c.width=innerWidth;c.height=innerHeight;var r=rng(7),n=Math.min(420,(c.width*c.height/3500)|0);starData=[];
 for(var i=0;i<n;i++)starData.push({x:r()*c.width,y:r()*c.height,s:r()*1.9+0.4,p:r()*6.28,v:0.5+r()*2,c:r()<0.15?'#bcd4ff':r()<0.3?'#ffe6a8':'#ffffff'});}
function titleLoop(now){requestAnimationFrame(titleLoop);if(document.hidden||!$('title').classList.contains('active'))return;
 var c=$('stars'),x=c.getContext('2d'),t=now/1000,w=c.width,h=c.height;x.clearRect(0,0,w,h);
 var g=x.createRadialGradient(w/2,h*0.3,10,w/2,h*0.3,Math.max(w,h)*0.45);g.addColorStop(0,'rgba(255,226,150,'+(0.28+0.06*Math.sin(t*0.8))+')');g.addColorStop(0.5,'rgba(140,110,255,.10)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(var i=0;i<starData.length;i++){var s=starData[i];x.globalAlpha=0.35+0.65*Math.abs(Math.sin(t*s.v+s.p));
  if(s.s>2.1)AC.art.star(x,s.x,s.y,s.s*2,s.c);else{x.fillStyle=s.c;x.fillRect(s.x,s.y,s.s,s.s);}}
 x.globalAlpha=1;
 var R=Math.min(w,h)*0.55,py=h+R*0.55,pg=x.createRadialGradient(w/2-R*0.3,py-R*0.6,R*0.1,w/2,py,R);pg.addColorStop(0,'#7fc8ff');pg.addColorStop(0.6,'#2a5fb8');pg.addColorStop(1,'#0b1a48');
 x.fillStyle=pg;x.beginPath();x.arc(w/2,py,R,0,6.283);x.fill();x.strokeStyle='rgba(180,220,255,.5)';x.lineWidth=3;x.shadowColor='#9fd2ff';x.shadowBlur=30;x.stroke();x.shadowBlur=0;}
function init(){
 cv=$('map');ctx=cv.getContext('2d');AC.render.attach(cv,W*TS,H*TS);stars();addEventListener('resize',stars);requestAnimationFrame(titleLoop);requestAnimationFrame(loop);document.querySelector('.title-box').insertAdjacentHTML('afterbegin',AC.art.EMBLEM);
 if(/^https?:/.test(location.protocol)){var ml=document.createElement('link');ml.rel='manifest';ml.href='manifest.json';document.head.appendChild(ml);if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(function(){});}
 $('phaseList').innerHTML=AC.PHASES.map(function(p){return '<li><b>Phase '+p.n+': '+p.name+'</b>'+(p.status==='live'?'<span class="live">PLAYABLE</span>':'<span class="soon">COMING SOON</span>')+'<br><small>Rank: '+p.title+'. '+p.desc+'</small></li>';}).join('');
 $('btnContinue').disabled=true;AC.saves.whenReady(updContinue);
 setupExtras();
 $('btnNew').onclick=function(){if(AC.saves.has(slot)&&!confirm('Start a new game? Your current save in slot '+slot+' will be overwritten at the next autosave (a backup is kept). Tip: use Continue to keep playing.'))return;var s=parseInt($('seedInput').value,10);newGame(isNaN(s)?0:s);show('game');render();focusCity();start3d();say(G.lastTip);};
 $('btnContinue').onclick=function(){if(load()){show('game');focusCity();start3d();}};
 $('btnRoadmap').onclick=function(){show('roadmap');};if(AC.H.init)AC.H.init.forEach(function(f){f();});$('btnHelp').onclick=function(){show('help');};
 document.querySelectorAll('.back').forEach(function(b){b.onclick=function(){show('title');};});
 $('tabs').onclick=function(e){var t=e.target.dataset.tab;if(!t)return;tab=t;document.querySelectorAll('#tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.tab===t);});
  document.querySelectorAll('.tab').forEach(function(d){d.classList.toggle('on',d.id==='tab-'+t);});render();};
 $('side').addEventListener('click',function(e){var el=e.target.closest('[data-b],[data-sell],[data-tax],[data-r],[data-launch],[data-act]');if(!el||!G)return;var d=el.dataset;if(AC.audio)AC.audio.sfx('click');
  if(d.act){var f=AC.H.act[d.act];if(f){f(G,d.arg,el);render();}return;}
  if(d.b){if(el.classList.contains('locked'))return toast('Research '+BY[d.b].req+' to unlock.');sel=sel===d.b?null:d.b;render();}
  if(d.sell)trade(d.sell,+d.q);
  if(d.tax){G.tax=Math.max(0,Math.min(30,G.tax+(+d.tax)));render();}
  if(d.r){var t=AC.RESEARCH.find(function(x){return x.id===d.r;});if(G.tech[t.id])return;if(t.req&&!G.tech[t.req])return toast('Requires '+t.req);G.researching=t.id;toast('Researching '+t.n);render();}
  if(d.launch)launch(d.launch);});
 cv.addEventListener('mousemove',function(e){if(AC.space&&AC.space.active())return;var i=tileAt(e);if(i!==hover){hover=i;if(i!=null)info(i);}});
 cv.addEventListener('click',function(e){if(AC.render.wasDrag())return;if(AC.galaxy&&AC.galaxy.active())return AC.galaxy.click(e);if(AC.space&&AC.space.active())return AC.space.click(e);tileClick(tileAt(e));});
 $('btnPause').onclick=function(){paused=!paused;this.textContent=paused?'Resume':'Pause';};
 $('btnSpeed').onclick=function(){speed=speed===1?2:speed===2?5:1;this.textContent='Speed x'+speed;};
 $('btnSave').onclick=function(){save();};$('btnLoad').onclick=function(){load();};
 $('btnTitle').onclick=function(){save(true);$('btnContinue').disabled=false;show('title');};
 $('btnReset').onclick=function(){if(confirm('Delete the saved game in slot '+slot+' and its backups? This cannot be undone.')){AC.saves.remove(slot);toast('Save deleted.');updContinue();}};
 // autosave: every 2 minutes of real time, and whenever the page is hidden/closed (phones kill background tabs)
 setInterval(function(){if(G&&$('game')&&$('game').classList.contains('active'))save(true,'auto');},120000);
 document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&G)save(true,'hide');});
 addEventListener('pagehide',function(){if(G)save(true,'hide');});addEventListener('beforeunload',function(){if(G)save(true,'hide');});
 $('btnExport').onclick=function(){if(!G)return toast('Start or continue a game first.');save(true);AC.saves.exportFile(G);toast('Save file downloaded. Keep it somewhere safe (e.g. email it to yourself).');};
 $('btnImport').onclick=function(){$('fileImport').click();};
 $('fileImport').onchange=function(){var f=this.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){try{var g=AC.saves.parseImport(rd.result);if(G&&!confirm('Replace the current game with the imported save (day '+g.day+')?'))return;loadJSON(JSON.stringify(g),'file');show('game');focusCity();save(false,'manual');}catch(e){toast('⚠ Import failed: '+e.message,'error');}};rd.readAsText(f);this.value='';};
 $('btnBackups').onclick=function(){var h='';for(var b=0;b<3;b++){var inf=AC.saves.info(slot,b);if(inf)h+='\n'+(b+1)+': day '+inf.day+', saved '+new Date(inf.t).toLocaleString();}if(!h)return toast('No backups yet for slot '+slot+'. Backups are made every few minutes as you play.');var n=prompt('Backups for slot '+slot+':'+h+'\n\nType 1, 2 or 3 to restore:');var b2=parseInt(n,10)-1;if(b2>=0&&b2<3){var j=AC.saves.getBackup(slot,b2);if(j){loadJSON(j,'backup '+(b2+1));show('game');save(true,'manual');}}};
}
function updContinue(){var b=$('btnContinue');if(!b)return;var inf=AC.saves.info(slot);b.disabled=!inf;b.textContent=inf?'Continue (slot '+slot+', day '+inf.day+')':'Continue';}
function start3d(){if(AC.v3d&&AC.v3d.wanted()&&!AC.v3d.active())AC.v3d.setOn(true);upd3d();}
function upd3d(){var b=$('btn3d');if(b)b.textContent=(AC.v3d&&(AC.v3d.active()||AC.v3d.wanted()))?'2.5D':'3D';}
function focusCity(){requestAnimationFrame(function(){if(!G)return;AC.render.resize();var i=G.tiles.findIndex(function(c){return c.b==='capital';});
 if(i<0){var best=-1,bd=1e9;G.tiles.forEach(function(c,j){if(c.t!=='plains')return;var d=Math.abs(j%W-W/2)+Math.abs((j/W|0)-H/2);if(d<bd){bd=d;best=j;}});i=best;}
 AC.render.focus((i%W+.5)*TS,((i/W|0)+.5)*TS);if(AC.v3d&&AC.v3d.ready())AC.v3d.focus(i);});}
function tileClick(i){if(i==null||!G)return;hover=i;info(i);
 if(sel)build(sel,i);else if(G.tiles[i].con){var cb=BY[G.tiles[i].b];if(confirm(cb.n+' is under construction: '+G.tiles[i].con.left+' days left.\n\nSpeed up now for '+rushCost(G.tiles[i])+' Celestial Light?'))rush(i);}else if(G.tiles[i].b){var b=BY[G.tiles[i].b];if(confirm(b.n+'\n'+b.d+'\n\nDemolish it for a 50% refund?'))demolish(i);}}
function switchTab(t){tab=t;document.querySelectorAll('#tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.tab===t);});document.querySelectorAll('.tab').forEach(function(d){d.classList.toggle('on',d.id==='tab-'+t);});render();}
AC.H.act.tab=function(a,b){switchTab(typeof a==='string'?a:b);};
function setupExtras(){var S=AC.settings;
 var m=$('settingsBox');m.innerHTML='<h3>Settings</h3><div class="row"><span>Graphics quality</span><select id="selQuality"><option value="auto">Auto</option><option value="high">High (desktop)</option><option value="low">Low (phones)</option></select></div>'+
  '<div class="row"><span>3D view (WebGL)</span><select id="sel3d"><option value="auto">Auto</option><option value="on">On</option><option value="off">Off (2.5D)</option></select></div>'+
  '<div class="row"><span>Day / night cycle</span><input type="checkbox" id="chkDay"></div>'+
  '<div class="row"><span>Music</span><input type="range" id="rngMusic" min="0" max="1" step="0.05"></div><div class="row"><span>Sound effects</span><input type="range" id="rngSfx" min="0" max="1" step="0.05"></div>'+
  '<div class="row"><span>Mute all</span><input type="checkbox" id="chkMute"></div><div class="row"><span>Save slot</span><select id="selSlot"></select></div>';
 $('selQuality').value=S.quality;$('chkDay').checked=S.daynight;$('rngMusic').value=S.music;$('rngSfx').value=S.sfx;$('chkMute').checked=S.muted;
 function slots(){var n=1+(AC.store?AC.store.extraSlots():0),h='';for(var i=1;i<=n;i++)h+='<option value="'+i+'">Slot '+i+(i>1?' (Founder)':'')+'</option>';$('selSlot').innerHTML=h;$('selSlot').value=slot;}slots();
 $('selQuality').onchange=function(){S.quality=this.value;AC.saveSettings();AC.render.resize();AC.render.needTerrain=true;dirty=true;toast('Graphics: '+S.q);};
 $('chkDay').onchange=function(){S.daynight=this.checked;AC.saveSettings();};
 $('rngMusic').oninput=function(){S.music=+this.value;AC.saveSettings();AC.audio.apply();};
 $('rngSfx').oninput=function(){S.sfx=+this.value;AC.saveSettings();AC.audio.apply();};
 $('chkMute').onchange=function(){S.muted=this.checked;AC.saveSettings();AC.audio.apply();$('btnMute').textContent=S.muted?'🔇':'🔊';};
 $('selSlot').onchange=function(){slot=+this.value;try{localStorage.setItem('archangelCosmos.slotSel',slot);}catch(e){}updContinue();toast('Using save slot '+slot+(AC.saves.has(slot)?' (day '+AC.saves.info(slot).day+')':' (empty)')+'.');};
 $('btnMute').textContent=S.muted?'🔇':'🔊';
 $('btnMute').onclick=function(){S.muted=!S.muted;AC.saveSettings();AC.audio.apply();this.textContent=S.muted?'🔇':'🔊';$('chkMute').checked=S.muted;};
 $('btnZoomIn').onclick=function(){AC.render.zoom(1.3);};$('btnZoomOut').onclick=function(){AC.render.zoom(1/1.3);};$('btnFit').onclick=function(){AC.render.fitView();};
 $('btnSpaceView').onclick=function(){if(AC.galaxy.active())AC.galaxy.toggle();AC.space.toggle();};$('btnGalaxy').onclick=function(){if(AC.street.active())AC.street.exit();if(AC.arch.active())AC.arch.toggle();AC.galaxy.toggle();};$('btnArch').onclick=function(){AC.arch.toggle();};$('btnStreet').onclick=function(){AC.H.act.street();};
 $('btn3d').onclick=function(){if(!AC.v3d.webgl())return toast('WebGL is not available on this device; using 2.5D.');var on=!AC.v3d.active();S.r3d=on?'on':'off';AC.saveSettings();$('sel3d').value=S.r3d;AC.v3d.setOn(on);setTimeout(upd3d,300);this.textContent=on?'2.5D':'3D';toast(on?'3D view (drag to rotate, right-drag/two fingers to pan)':'2.5D view');};
 $('sel3d').value=S.r3d||'auto';$('sel3d').onchange=function(){S.r3d=this.value;AC.saveSettings();AC.v3d.setOn(AC.v3d.wanted());setTimeout(upd3d,300);};
 $('side').addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='aiQ'){AC.H.act.ask(G);render();}});
 $('btnView').textContent=AC.render.mode()==='iso'?'▦':'◇';$('btnView').onclick=function(){AC.render.setMode(AC.render.mode()==='iso'?'top':'iso');this.textContent=AC.render.mode()==='iso'?'▦':'◇';toast(AC.render.mode()==='iso'?'Angled 2.5D view':'Top-down view');};
 $('btnCity').onclick=focusCity;
 setInterval(function(){var c=$('clock');if(c&&G)c.textContent=AC.space.active()?'Helion System':'Elysia '+AC.render.timeLabel();},1000);
 if(AC.store&&AC.store.owns('founder'))$('title').querySelector('.title-box').insertAdjacentHTML('beforeend','<p class="badge">✦ Founder ✦</p>');}
// Public hooks (used by tests and future phases)
AC.H.act.rush=function(g,i){rush(+i);};AC.api={checkMissions:function(){checkMissions();},conDays:conDays,complete:function(i){complete(i);},rush:rush,rushCost:rushCost,finishAll:function(){G.tiles.forEach(function(c,i){if(c.con)complete(i);});},tileClick:function(i){tileClick(i);},hoverTile:function(i){hover=i;if(i!=null)info(i);},canPlace:function(i){return sel?!placeError(BY[sel],i):null;},focusCity:focusCity,switchTab:switchTab,slot:function(n){if(n)slot=n;return slot;},migrate:function(g){return migrate(g);},toast:toast,say:say,render:render,fmt:fmt,canAfford:canAfford,costStr:function(c){return costStr(c);},BY:BY,housing:function(){return housing();},show:show,dirty:function(){dirty=true;},newGame:newGame,tick:tick,build:build,trade:trade,save:save,load:load,launch:launch,state:function(){return G;},setState:function(s){G=s;render();},W:W,H:H};
document.addEventListener('DOMContentLoaded',init);
})();
