/* Archangel Cosmos - vehicles, transport, city services and military.
   Structures (harbours, naval yards, barracks, war factories, walls/towers, airports, rail stations, bus depots, police, fire, schools),
   unit training with timers and upkeep, defence against raids, trade and exploration uses, and animated traffic, boats, trains,
   aircraft, armies and launching spaceships drawn in 2.5D, 3D and street view. */
(function(){
'use strict';
var AC=window.AC,H=AC.H;function api(){return AC.api;}
var LAND=['plains','forest','desert','arctic','volcanic','crystal'],FLAT=['plains','forest','desert'];
[
 {id:'harbour',n:'Harbour & Port',cat:'Transport',code:'HB',col:'#5fa8ff',on:LAND,near:'water',cost:{credits:6000,metal:40},prod:{food:60,credits:150},cons:{energy:4},d:'Coastal port. Builds fishing boats, cargo ships and ferries. +60 Food, +150 Credits/day.'},
 {id:'station',n:'Rail Station',cat:'Transport',code:'RS',col:'#c9a36a',on:FLAT,cost:{credits:8000,metal:60},prod:{credits:200},cons:{energy:5},d:'Two or more stations are linked by railway. Trains carry goods and passengers.'},
 {id:'depot',n:'Transit Depot',cat:'Transport',code:'TD',col:'#ffd040',on:FLAT,cost:{credits:3000,metal:15},happy:2,cons:{energy:2},d:'City buses. +Happiness.'},
 {id:'airport',n:'Skyport Airport',cat:'Transport',code:'AP',col:'#cfe0ff',on:FLAT,cost:{credits:20000,metal:150,goods:40},prod:{credits:300},cons:{energy:15},d:'Airliners, helicopters and angelic flyers. +300 Credits/day.'},
 {id:'police',n:'Guardian Police',cat:'Services',code:'PO',col:'#5d7cff',on:FLAT,cost:{credits:2500},happy:2,cons:{energy:2},d:'Keeps the peace. +Happiness, +2 defence.'},
 {id:'fire',n:'Fire Station',cat:'Services',code:'FS',col:'#ff5a40',on:FLAT,cost:{credits:2500},happy:1,cons:{energy:2},d:'Fire engines put out fires before they spread.'},
 {id:'school',n:'School',cat:'Services',code:'SC',col:'#ffe08a',on:FLAT,cost:{credits:3500},prod:{research:1.5},happy:1,growth:0.001,cons:{energy:2},d:'+1.5 Research/day, +Happiness, +growth.'},
 {id:'barracks',n:'Legion Barracks',cat:'Military',code:'BK',col:'#c0503a',on:FLAT,cost:{credits:5000,metal:30},cons:{food:30},d:'Trains soldier legions and Angelic Legions.'},
 {id:'warfactory',n:'War Factory',cat:'Military',code:'WF',col:'#7a8a5a',on:FLAT,cost:{credits:12000,metal:100,goods:20},cons:{energy:12},d:'Builds tank squadrons.'},
 {id:'navalyard',n:'Naval Shipyard',cat:'Military',code:'NY',col:'#7a9ab8',on:LAND,near:'water',cost:{credits:15000,metal:120,goods:30},cons:{energy:10},d:'Builds navy warships. Must be next to water.'},
 {id:'tower',n:'Watchtower',cat:'Military',code:'WT',col:'#d8ccae',on:LAND,cost:{credits:1500,metal:10},d:'+8 defence against raids.'},
 {id:'wall',n:'Defence Wall',cat:'Military',code:'',col:'#bdb39a',on:LAND,cost:{credits:300,iron:20},d:'+3 defence per segment. Segments connect.'}
].forEach(function(b){AC.BUILDINGS.push(b);});
/* ---------- 2.5D sprites ---------- */
(function(){var A=AC.art,S=A.SPR,h=A.SH;if(!S||!h)return;var G='#e8c25a',GD='#a77d22',BL='#5d9cff',BD='#2b5fb8',GL='#a8e0ff';
 S.harbour=function(x){h.shadow(x,13);x.fillStyle='#8a7050';x.fillRect(3,20,26,4);for(var i=0;i<5;i++)x.fillRect(4+i*6,24,1.5,5);h.box(x,6,11,11,9);h.tri(x,5,12,11.5,7,18,12,BL);x.strokeStyle='#e04040';x.lineWidth=1.6;x.beginPath();x.moveTo(23,20);x.lineTo(23,4);x.lineTo(29,4);x.stroke();x.fillStyle='#d84';x.fillRect(19,15,4,5);x.fillStyle='#48c';x.fillRect(24,15,4,5);};
 S.station=function(x){h.shadow(x,14);h.box(x,4,13,24,12);h.dome(x,16,13,7,'#fff3c0',GD);for(var i=0;i<4;i++)h.win(x,6+i*6,17,3,5);x.fillStyle='#555';x.fillRect(2,26,28,2);x.fillStyle='#a87';for(i=0;i<7;i++)x.fillRect(3+i*4,25,1.4,4);};
 S.depot=function(x){h.shadow(x,13);h.box(x,4,14,24,12);x.fillStyle='#333';x.fillRect(7,19,6,7);x.fillRect(15,19,6,7);x.fillStyle='#ffc820';x.fillRect(5,11,22,3);x.fillStyle='#ffd040';x.fillRect(22,20,7,5);};
 S.airport=function(x){h.shadow(x,14);x.fillStyle='#666';x.fillRect(2,22,28,5);x.fillStyle='#fff';for(var i=0;i<5;i++)x.fillRect(4+i*6,24,3,1);h.box(x,4,13,14,9,GL,'#6aa8d8');h.box(x,21,6,4,16);x.fillStyle=GL;x.fillRect(19.5,4,7,3);x.fillStyle=G;x.fillRect(19.5,3.4,7,0.8);};
 S.police=function(x){h.shadow(x,12);h.box(x,6,12,20,15);x.fillStyle=BD;x.fillRect(6,12,20,3);h.win(x,9,17,3,3);h.win(x,20,17,3,3);x.fillStyle=G;h.star(x,16,20,3,G);x.fillStyle='#f33';x.fillRect(13,8,3,3);x.fillStyle='#38f';x.fillRect(16,8,3,3);};
 S.fire=function(x){h.shadow(x,12);h.box(x,5,12,22,15,'#f6e6e0','#d8b8b0');x.fillStyle='#c8301c';x.fillRect(5,11,22,3);x.fillStyle='#822';x.fillRect(8,18,7,9);x.fillRect(17,18,7,9);x.fillStyle='#d8301c';x.fillRect(24,4,3,10);};
 S.school=function(x){h.shadow(x,13);h.box(x,5,14,22,13);h.tri(x,4,15,16,7,28,15,'#d86a4a');for(var i=0;i<4;i++)h.win(x,7+i*5,18,3,3);x.fillStyle=G;x.fillRect(14.5,21,3,6);x.fillStyle='#c33';x.fillRect(16,2,5,3);x.fillStyle='#333';x.fillRect(15.5,2,0.8,6);};
 S.barracks=function(x){h.shadow(x,14);h.box(x,4,15,24,11,'#e8dcc0','#b8a888');x.fillStyle='#8a3020';x.fillRect(4,13,24,3);for(var i=0;i<5;i++)h.win(x,6+i*4.5,19,2,2.5,'#553');x.fillStyle='#c0503a';x.fillRect(22,3,6,4);x.fillStyle='#333';x.fillRect(21.5,3,0.8,11);};
 S.warfactory=function(x){h.shadow(x,14);h.box(x,3,13,26,13,'#b8bca8','#7a806a');x.fillStyle='#556040';for(var i=0;i<3;i++)h.tri(x,3+i*8.6,13,7.3+i*8.6,9,11.6+i*8.6,13,'#6a7450');x.fillStyle='#333';x.fillRect(11,18,10,8);x.fillStyle='#4a5a30';x.fillRect(24,20,6,4);};
 S.navalyard=function(x){h.shadow(x,14);x.fillStyle='#6a7a8a';x.fillRect(2,20,28,6);x.fillStyle='#8a9aa8';x.beginPath();x.moveTo(5,20);x.lineTo(27,20);x.lineTo(24,15);x.lineTo(8,15);x.fill();x.fillStyle='#556';x.fillRect(13,10,6,5);x.strokeStyle='#e8b23a';x.lineWidth=1.4;x.beginPath();x.moveTo(28,26);x.lineTo(28,3);x.lineTo(18,3);x.stroke();};
 S.tower=function(x){h.shadow(x,8);h.box(x,12,8,8,19,'#e8dcc0','#b0a080');x.fillStyle='#b0a080';for(var i=0;i<4;i++)x.fillRect(11+i*2.8,5,1.8,3);x.fillStyle=G;x.fillRect(15.5,0,1,6);x.fillStyle='#c0503a';x.fillRect(16.5,0,4,2.5);};
 S.wall=function(x){x.fillStyle='rgba(0,0,0,.3)';x.fillRect(2,22,28,4);h.box(x,2,14,28,9,'#e0d6bc','#a89878');x.fillStyle='#a89878';for(var i=0;i<7;i++)x.fillRect(2+i*4,11,2.4,3);};
})();
/* ---------- 3D meshes ---------- */
if(AC.v3d&&AC.v3d.R){var B='box',C='cyl',K='cone',D='dome',Sp='sph',Tor='tor',R=AC.v3d.R;
 R.harbour=[[B,'trunk',.9,.06,.35,0,0,.25],[B,'marble',.4,.3,.35,-.2,0,-.15],[K,'blue',.32,.15,.3,-.2,.3,-.15,4],[B,'lava',.15,.15,.12,.15,.06,.25],[B,'blue',.15,.15,.12,.32,.06,.25],[B,'gold',.03,.6,.03,.38,0,-.3],[B,'gold',.3,.03,.03,.25,.6,-.3]];
 R.station=[[B,'marble',.8,.3,.4,0,0,-.1],[D,'gold',.2,.2,.2,0,.3,-.1],[B,'glass',.82,.06,.42,0,.15,-.1],[B,'dark',.95,.02,.12,0,0,.3]];
 R.depot=[[B,'marble',.8,.28,.6,0,0,0],[B,'dark',.2,.2,.02,-.2,0,.3],[B,'dark',.2,.2,.02,.15,0,.3],[B,'gold',.82,.04,.62,0,.28,0]];
 R.airport=[[B,'dark',.95,.02,.3,0,0,.28],[B,'glass',.55,.22,.35,-.15,0,-.15],[C,'marble',.06,.75,.06,.3,0,-.2],[C,'glass',.12,.1,.12,.3,.75,-.2]];
 R.police=[[B,'marble',.6,.35,.5,0,0,0],[B,'blue',.62,.06,.52,0,.35,0],[B,'lava',.06,.06,.06,-.05,.41,0],[B,'blue',.06,.06,.06,.05,.41,0]];
 R.fire=[[B,'marble',.65,.35,.5,0,0,0],[B,'lava',.67,.06,.52,0,.29,0],[B,'lava',.12,.6,.12,.25,0,-.15]];
 R.school=[[B,'marble',.7,.3,.45,0,0,0],[K,'lava',.45,.18,.3,0,.3,0,4],[C,'trunk',.01,.4,.01,.3,0,.25]];
 R.barracks=[[B,'marble2',.85,.28,.5,0,0,0],[B,'lava',.87,.05,.52,0,.28,0],[B,'dark',.85,.01,.3,0,0,.38],[C,'trunk',.01,.6,.01,.38,0,.2]];
 R.warfactory=[[B,'rock',.9,.35,.6,0,0,0],[B,'dark',.3,.25,.02,0,0,.3],[C,'rock',.06,.5,.06,-.3,.35,-.2]];
 R.navalyard=[[B,'steel',.9,.08,.5,0,0,.1],[B,'steel',.5,.15,.18,0,.08,.1],[B,'gold',.03,.8,.03,.4,0,-.3],[B,'gold',.45,.03,.03,.2,.8,-.3]];
 R.tower=[[C,'marble2',.13,.75,.13,0,0,0,8],[C,'marble2',.17,.08,.17,0,.75,0,8],[K,'lava',.15,.2,.15,0,.83,0,8]];
 R.wall=[[B,'marble2',.9,.25,.18,0,0,0],[B,'marble2',.18,.25,.9,0,0,0]];}
/* ---------- units ---------- */
var UNITS=[
 {id:'fishing',n:'Fishing boat',at:'harbour',cost:{credits:1500},days:3,up:{credits:20},prod:{food:40},d:'+40 Food/day.'},
 {id:'cargo',n:'Cargo ship',at:'harbour',cost:{credits:6000,metal:20},days:6,up:{credits:60},prod:{credits:450},d:'Sea trade: +450 Credits/day.'},
 {id:'ferry',n:'Ferry',at:'harbour',cost:{credits:3000},days:4,up:{credits:30},prod:{credits:120},happy:0.5,d:'Passengers: +120 Credits/day, +happiness.'},
 {id:'warship',n:'Navy warship',at:'navalyard',cost:{credits:20000,metal:120},days:10,up:{credits:200},def:40,dom:'sea',d:'Defence 40 (x2 vs sea raids).'},
 {id:'soldier',n:'Soldier legion',at:'barracks',cost:{credits:2000,food:200},days:3,up:{credits:20,food:20},def:8,dom:'land',cap:10,d:'Defence 8.'},
 {id:'angelic',n:'Angelic Legion',at:'barracks',cost:{credits:5000,light:30},days:6,up:{credits:40,light:0.5},def:20,dom:'air',d:'Winged warriors. Defence 20.'},
 {id:'tank',n:'Tank squadron',at:'warfactory',cost:{credits:8000,metal:60},days:6,up:{credits:80,energy:4},def:25,dom:'land',d:'Defence 25 (x2 vs land raids).'},
 {id:'plane',n:'Airliner',at:'airport',cost:{credits:10000,metal:40},days:6,up:{credits:80},prod:{credits:500},d:'Air trade: +500 Credits/day.'},
 {id:'heli',n:'Helicopter',at:'airport',cost:{credits:6000,metal:20},days:4,up:{credits:50},def:8,explore:1,dom:'air',d:'Defence 8, explores for ruins and relics.'},
 {id:'flyer',n:'Angelic flyer',at:'airport',cost:{credits:4000,light:20},days:4,up:{light:0.3},def:10,explore:1,dom:'air',d:'Defence 10, explores.'},
 {id:'bus',n:'City bus',at:'depot',cost:{credits:800},days:2,up:{credits:10},happy:0.3,cap:8,d:'+Happiness.'},
 {id:'train',n:'Train',at:'station',cost:{credits:5000,metal:30},days:5,up:{credits:40},prod:{credits:250,goods:1},needs2:1,d:'+250 Credits, +1 Goods/day. Needs 2 stations.'},
 {id:'policecar',n:'Police car',at:'police',cost:{credits:600},days:2,up:{credits:10},happy:0.3,def:2,d:'+Happiness, +2 defence.'},
 {id:'fireengine',n:'Fire engine',at:'fire',cost:{credits:800},days:2,up:{credits:10},fire:1,d:'Puts out fires.'},
 {id:'shuttle',n:'Space shuttle',at:'spaceport',cost:{credits:15000,metal:50},days:6,up:{credits:100},prod:{research:2},d:'+2 Research/day.'},
 {id:'fighter',n:'Star fighter',at:'spaceport',cost:{credits:12000,titanium:20},days:6,up:{credits:100},def:20,dom:'space',d:'Defence 20 (x2 vs void raids).'},
 {id:'scruiser',n:'Star cruiser',at:'spaceport',cost:{credits:40000,titanium:80},days:12,up:{credits:300},def:60,dom:'space',d:'Defence 60.'},
 {id:'carrier',n:'Star carrier',at:'spaceport',cost:{credits:90000,titanium:200,goods:50},days:20,up:{credits:600},def:120,dom:'space',cap:2,d:'Defence 120. Launches fighters.'}];
var UB={};UNITS.forEach(function(u){UB[u.id]=u;});
H.migrate.push(function(G){if(!G.mil)G.mil={u:{},q:[],nextRaid:70+((Math.random()*20)|0),wins:0,losses:0,log:[]};});
function cnt(G,b){return G.counts[b]||0;}
function cap(G,u){return cnt(G,u.at)*(u.cap||6);}
function have(G,id){return (G.mil.u[id]||0)+G.mil.q.filter(function(q){return q.u===id;}).length;}
function defence(G,dom){var d=cnt(G,'tower')*8+cnt(G,'wall')*3+cnt(G,'police')*2;for(var id in G.mil.u){var u=UB[id];if(u&&u.def)d+=u.def*G.mil.u[id]*(dom&&u.dom===dom?2:1);}return Math.round(d);}
function upkeep(G){var o={};for(var id in G.mil.u){var u=UB[id];for(var k in u.up)o[k]=(o[k]||0)+u.up[k]*G.mil.u[id];}return o;}
var RAIDS=[{n:'Sea raiders',dom:'sea'},{n:'Void reavers',dom:'space'},{n:'Rogue marauders',dom:'land'},{n:'Shadow wyrms',dom:'air'}];
H.tick.push(function(G,add){var M=G.mil;
 M.q=M.q.filter(function(q){if(--q.left>0)return true;M.u[q.u]=(M.u[q.u]||0)+1;api().toast(UB[q.u].n+' ready for service.');if(AC.audio)AC.audio.sfx('success');return false;});
 for(var id in M.u){var u=UB[id],n=M.u[id];if(!u||!n)continue;var ok=true;for(var k in u.up)if((G.res[k]||0)<u.up[k]*n)ok=false;
  if(!ok){if(Math.random()<0.05){M.u[id]--;api().toast('A '+u.n+' was decommissioned: upkeep unpaid.','alert');}continue;}for(k in u.up)add(k,-u.up[k]*n);
  if(u.prod&&(!u.needs2||cnt(G,'station')>=2))for(k in u.prod)add(k,u.prod[k]*n);if(u.explore&&Math.random()<0.004*n){var rw=[{credits:3000},{research:25},{crystal:10},{light:15}][(Math.random()*4)|0];for(k in rw)add(k,rw[k]);api().toast(u.n+' scouts discovered ancient relics: +'+Object.keys(rw).map(function(k){return rw[k]+' '+AC.RES[k].n;}).join(', '),'success');}}
 // fires: city services matter
 if(G.day>40&&Math.random()<0.006*(1+G.pop/400000)){var fe=(M.u.fireengine||0)+cnt(G,'fire');var bl=G.tiles.map(function(c,i){return i;}).filter(function(i){var c=G.tiles[i];return c.b&&c.b!=='road'&&c.b!=='wall'&&!c.con;});if(bl.length){var i=bl[(Math.random()*bl.length)|0];
  if(fe>0&&Math.random()<0.6+fe*0.1)api().toast('🔥 Fire at a '+api().BY[G.tiles[i].b].n+'! Fire engines put it out.');else{G.tiles[i].idle=true;add('credits',-Math.min(G.res.credits,2000));api().toast('🔥 Fire damaged a '+api().BY[G.tiles[i].b].n+'. Build a Fire Station.','alert');}}}
 // raids
 if(G.day>=M.nextRaid){var r=RAIDS[(Math.random()*RAIDS.length)|0],str=Math.round(15+G.day/8+(G.star&&G.star.unlocked?30:0)+(G.gal&&G.gal.unlocked?60:0)),def=defence(G,r.dom)*(0.75+Math.random()*0.5);M.nextRaid=G.day+30+((Math.random()*20)|0);
  if(def>=str){M.wins++;add('credits',2000+str*50);add('light',5);api().toast('⚔ '+r.n+' (strength '+str+') attacked and were repelled by your forces (defence '+Math.round(def)+')! Spoils +'+(2000+str*50)+' ₵.','success');if(AC.chron)AC.chron(G,'war','The forces of Elysia repelled '+r.n.toLowerCase()+'.');}
  else{M.losses++;var lost={credits:Math.round(G.res.credits*0.08),goods:Math.round((G.res.goods||0)*0.15),food:Math.round((G.res.food||0)*0.1)};for(var k2 in lost)add(k2,-lost[k2]);api().toast('⚠ '+r.n+' (strength '+str+') overwhelmed your defences ('+Math.round(def)+') and plundered '+api().fmt(lost.credits)+' ₵ and supplies. Train forces in the Forces tab.','error');}
  M.log.unshift({day:G.day,n:r.n,str:str,def:Math.round(def)});M.log=M.log.slice(0,6);}
 if(G.day===M.nextRaid-5)api().toast('⚠ Scouts report '+'raiders gathering: a raid is expected in 5 days. Defence: '+defence(G)+'.','alert');
});
H.happy.push(function(G){var s=0;for(var id in G.mil.u){var u=UB[id];if(u&&u.happy)s+=u.happy*G.mil.u[id];}return Math.min(10,s);});
H.act.train=function(G,id){var u=UB[id];if(!cnt(G,u.at))return api().toast('Build a '+api().BY[u.at].n+' first.');if(have(G,id)>=cap(G,u))return api().toast('Capacity reached: build another '+api().BY[u.at].n+'.');
 for(var k in u.cost)if((G.res[k]||0)<u.cost[k])return api().toast('Not enough resources.');for(k in u.cost)G.res[k]-=u.cost[k];G.mil.q.push({u:id,left:u.days,tot:u.days});if(AC.audio)AC.audio.sfx('build');api().toast('Training '+u.n+' ('+u.days+' days).');};
H.act.rushUnit=function(G,i){var q=G.mil.q[+i];if(!q)return;var c=Math.max(3,q.left*3);if((G.res.light||0)<c)return api().toast('Needs '+c+' Celestial Light.');G.res.light-=c;q.left=1;api().toast('Training will finish tomorrow.');};
H.act.disband=function(G,id){if(G.mil.u[id]>0){G.mil.u[id]--;api().toast(UB[id].n+' disbanded.');}};
H.panel.forces=function(G){var M=G.mil,cs=api().costStr,fmt=api().fmt,up=upkeep(G),h='<h3>Forces & transport</h3>';
 h+='<div class="row"><span>Defence power <b>'+defence(G)+'</b></span><span>Raids repelled '+M.wins+' · lost '+M.losses+'</span></div><div class="row"><span>Next raid expected around day <b>'+M.nextRaid+'</b> (in '+Math.max(0,M.nextRaid-G.day)+' days)</span></div>';
 h+='<p class="small">Upkeep/day: '+(Object.keys(up).length?cs(up):'none')+'</p>';
 if(M.q.length){h+='<h3>Training</h3>';M.q.forEach(function(q,i){var p=Math.round((1-q.left/q.tot)*100);h+='<div class="card con"><span class="t">'+UB[q.u].n+'</span> <small>'+q.left+' days</small><div class="pbar"><i style="width:'+p+'%"></i></div><button class="mini" data-act="rushUnit" data-arg="'+i+'">✦ Speed up ('+Math.max(3,q.left*3)+' Light)</button></div>';});}
 var groups={};UNITS.forEach(function(u){(groups[u.at]=groups[u.at]||[]).push(u);});
 Object.keys(groups).forEach(function(b){var n=cnt(G,b);h+='<h3>'+api().BY[b].n+' <small>×'+n+'</small></h3>';if(!n)h+='<p class="small">Build a '+api().BY[b].n+' to unlock: '+groups[b].map(function(u){return u.n;}).join(', ')+'.</p>';
  else groups[b].forEach(function(u){var o=M.u[u.id]||0;h+='<div class="card"><span class="t">'+u.n+'</span> <small>×'+o+' / '+cap(G,u)+' · ⏱'+u.days+'d</small><br><span class="e">'+u.d+' Upkeep '+cs(u.up)+'</span><br>'+cs(u.cost)+' <button class="mini" data-act="train" data-arg="'+u.id+'">Train</button>'+(o?'<button class="mini" data-act="disband" data-arg="'+u.id+'">Disband</button>':'')+'</div>';});});
 if(M.log.length)h+='<h3>Battle log</h3>'+M.log.map(function(l){return '<div class="small">Day '+l.day+': '+l.n+' (str '+l.str+') vs defence '+l.def+' → '+(l.def>=l.str?'victory':'defeat')+'</div>';}).join('');return h;};
H.advise.push(function(G){if(G.day>50&&defence(G)<15+G.day/8&&G.mil.nextRaid-G.day<15)return 'Raiders approach in '+(G.mil.nextRaid-G.day)+' days and our defence is only '+defence(G)+'. Build Barracks or Watchtowers and train legions (Forces tab).';return null;});
[{id:'V01',n:'Set Sail',d:'Build a Harbour and a fishing boat.',check:function(G){return (G.mil.u.fishing||0)>0;},reward:{credits:3000}},
 {id:'V02',n:'Rolling Stock',d:'Link 2 Rail Stations and run a train.',check:function(G){return (G.mil.u.train||0)>0&&cnt(G,'station')>=2;},reward:{goods:30}},
 {id:'V03',n:'Guardians of Elysia',d:'Reach 60 defence power.',check:function(G){return defence(G)>=60;},reward:{light:30}},
 {id:'V04',n:'First Victory',d:'Repel a raid.',check:function(G){return G.mil.wins>0;},reward:{credits:10000}},
 {id:'V05',n:'Wings over Elysia',d:'Fly an airliner or angelic flyer.',check:function(G){return (G.mil.u.plane||0)+(G.mil.u.flyer||0)>0;},reward:{research:30}},
 {id:'V06',n:'Fleet in Orbit',d:'Commission a star fighter, cruiser or carrier.',check:function(G){return (G.mil.u.fighter||0)+(G.mil.u.scruiser||0)+(G.mil.u.carrier||0)>0;},reward:{titanium:50}}].forEach(function(m){m.phase='genesis';var c=m.check;m.check=function(G){return !!G.mil&&c(G);};AC.MISSIONS.push(m);});
if(AC.advisor&&AC.advisor.KB)AC.advisor.KB.push({k:['army','military','soldier','soldiers','legion','tank','tanks','navy','warship','defence','defense','raid','raids','barracks','wall','tower'],a:'Raids arrive every 30 to 50 days. Defend with Watchtowers, Walls and Police, plus units trained in the Forces tab: Legion Barracks (soldiers, Angelic Legions), War Factory (tanks), Naval Shipyard (warships) and Spaceport (fighters, cruisers, carriers). Units matching the raid type count double. Every unit has daily upkeep.'},
 {k:['boat','boats','ship','ships','harbour','harbor','port','ferry','cargo','fishing','plane','planes','airport','helicopter','train','trains','rail','bus','buses','car','cars','traffic','vehicle','vehicles','transport','fire','police','school'],a:'Transport: a Harbour (on the coast) builds fishing boats (+food), cargo ships (trade income) and ferries. An Airport builds airliners, helicopters and angelic flyers (they explore for relics). Two Rail Stations link by railway for trains. A Transit Depot runs buses. Police, Fire Stations and Schools keep the city happy, safe and learning. Cars fill your roads as your population grows.'});

/* ---------- animated vehicles: shared simulation (tile units) ---------- */
var sig=null,S={hosp:[],W:48,H:32,roads:[],harb:[],stations:[],air:[],bar:[],war:[],port:[],power:[],lines:[],rails:[]},paths={};
function rnd(a){var s=a*9301+49297;return function(){s=(s*9301+49297)%233280;return s/233280;};}
function prep(G){var W=api().W,Hh=api().H,s='';for(var i=0;i<G.tiles.length;i++){var b=G.tiles[i].b;if(b&&!G.tiles[i].con)s+=i+b[0]+b[1];}if(s===sig)return;sig=s;paths={};
 var by=function(id){var o=[];G.tiles.forEach(function(c,i){if(c.b===id&&!c.con)o.push(i);});return o;};S.roads=by('road');S.harb=by('harbour').concat(by('navalyard'));S.stations=by('station');S.air=by('airport');S.bar=by('barracks');S.war=by('warfactory');S.port=by('spaceport');S.hosp=by('hospital');
 S.power=by('power').concat(by('solar'),by('geo'));var bl=[];G.tiles.forEach(function(c,i){if(c.b&&c.b!=='road'&&c.b!=='wall'&&!c.con&&S.power.indexOf(i)<0)bl.push(i);});
 S.lines=[];S.power.forEach(function(p){bl.map(function(b){return [b,Math.hypot(b%W-p%W,((b/W)|0)-((p/W)|0))];}).sort(function(a,b){return a[1]-b[1];}).slice(0,3).forEach(function(b){if(b[1]<9)S.lines.push([p,b[0]]);});});
 S.rails=[];var st=S.stations.slice().sort(function(a,b){return a%W-b%W;});for(i=1;i<st.length;i++)S.rails.push([st[i-1],st[i]]);S.W=W;S.H=Hh;}
function cx(i){return i%S.W+0.5;}function cy(i){return ((i/S.W)|0)+0.5;}
function isWater(G,x,y){var tx=Math.floor(x),ty=Math.floor(y);if(tx<0||ty<0||tx>=S.W||ty>=S.H)return true;var t=G.tiles[ty*S.W+tx].t;return (t==='ocean'||t==='shallow')&&!G.tiles[ty*S.W+tx].b;}
function walk(G,start,n,ok,seed){var r=rnd(seed),p=[start],cur=start,prev=-1;for(var s=0;s<n;s++){var nb=[1,-1,S.W,-S.W].map(function(d){return cur+d;}).filter(function(j){return j>=0&&j<G.tiles.length&&Math.abs(j%S.W-cur%S.W)<=1&&j!==prev&&ok(j);});if(!nb.length)break;prev=cur;cur=nb[(r()*nb.length)|0];p.push(cur);}return p;}
function along(p,f){/* ping-pong along tile path, f in [0,1) */var L=p.length-1;if(L<1)return {x:cx(p[0]),y:cy(p[0]),h:0};var u=f*2*L,k;if(u>L){u=2*L-u;k=-1;}else k=1;var a=Math.min(L-1,Math.floor(u)),t=u-a,x0=cx(p[a]),y0=cy(p[a]),x1=cx(p[a+1]),y1=cy(p[a+1]);
 var hd=Math.atan2((y1-y0)*k,(x1-x0)*k);var off=0.13;return {x:x0+(x1-x0)*t-Math.sin(hd)*off*k*k,y:y0+(y1-y0)*t+Math.cos(hd)*off*k*k,h:hd};}
function getPath(key,mk){return paths[key]||(paths[key]=mk());}
function vehicles(G,t,qual){prep(G);var out=[],M=G.mil,u=M.u,lim=qual==='low'?40:qual==='med'?90:160;
 var roadOk=function(j){return G.tiles[j].b==='road';};
 // cars scale with population, buses/police/fire from units
 var nCars=Math.min(S.roads.length,Math.round(G.pop/12000)),types=[];for(var i=0;i<nCars;i++)types.push('car');for(i=0;i<Math.min(8,u.bus||0)*2;i++)types.push('bus');for(i=0;i<Math.min(6,u.policecar||0);i++)types.push('police');for(i=0;i<Math.min(4,u.fireengine||0);i++)types.push('fireengine');
 types.slice(0,Math.round(lim*0.45)).forEach(function(k,i){if(!S.roads.length)return;var st=S.roads[(i*7919)%S.roads.length],p=getPath('r'+i+st,function(){return walk(G,st,10,roadOk,i+1);});if(p.length<2)return;var sp=k==='car'?0.012:0.008,a=along(p,((t*sp*(1+(i%5)*0.15))+i*0.137)%1);out.push({k:k,x:a.x,y:a.y,z:0.02,h:a.h,i:i});});
 // boats from harbours/naval yards
 S.harb.forEach(function(hb,j){var isNavy=G.tiles[hb].b==='navalyard',list=[];if(isNavy){for(i=0;i<Math.min(6,u.warship||0);i++)list.push('warship');}else{for(i=0;i<Math.min(6,u.fishing||0);i++)list.push('fishing');for(i=0;i<Math.min(4,u.cargo||0);i++)list.push('cargo');for(i=0;i<Math.min(3,u.ferry||0);i++)list.push('ferry');if(!list.length)list.push('sail');}
  var start=[1,-1,S.W,-S.W].map(function(d){return hb+d;}).find(function(x){return x>=0&&x<G.tiles.length&&isWater(G,cx(x)-0.5,cy(x)-0.5);});if(start==null)return;
  list.forEach(function(k,i){var p=getPath('b'+hb+k+i,function(){return walk(G,start,k==='cargo'?40:k==='warship'?24:14,function(x){return isWater(G,cx(x)-0.5,cy(x)-0.5);},hb+i*31+k.length);});var sp=k==='cargo'?0.006:0.009,a=along(p,((t*sp)+i*0.21)%1);out.push({k:k,x:a.x,y:a.y,z:0,h:a.h,i:i});});});
 // trains along the railway
 if(S.rails.length&&(u.train||0)>0){for(i=0;i<Math.min(3,u.train);i++){var seg=S.rails[i%S.rails.length],a0=seg[0],b0=seg[1],f=((t*0.03)+i*0.33)%1,ff=f<0.5?f*2:2-f*2,x=cx(a0)+(cx(b0)-cx(a0))*ff,y=cy(a0)+(cy(b0)-cy(a0))*ff,hd=Math.atan2(cy(b0)-cy(a0),cx(b0)-cx(a0))+(f<0.5?0:Math.PI);
  for(var c=0;c<4;c++)out.push({k:c?'traincar':'train',x:x-Math.cos(hd)*c*0.3,y:y-Math.sin(hd)*c*0.3,z:0.03,h:hd,i:i});}}
 // aircraft
 S.air.forEach(function(ap,j){var n=Math.min(4,u.plane||0)||1;for(i=0;i<n;i++){var a=t*0.08+i*1.6+j,R=7+i*2;out.push({k:'plane',x:cx(ap)+Math.cos(a)*R,y:cy(ap)+Math.sin(a)*R*0.7,z:1.8+i*0.3,h:a+Math.PI/2,i:i});}
  for(i=0;i<Math.min(3,u.heli||0);i++){var b=t*0.4+i*2.1;out.push({k:'heli',x:cx(ap)+Math.cos(b)*2.2,y:cy(ap)+Math.sin(b)*2.2,z:0.9,h:b+Math.PI/2,i:i});}
  for(i=0;i<Math.min(4,u.flyer||0);i++){var c2=t*0.3+i*1.5;out.push({k:'flyer',x:cx(ap)+Math.cos(c2)*3.5+Math.sin(t+i)*0.5,y:cy(ap)+Math.sin(c2)*3,z:0.7+Math.sin(t*2+i)*0.1,h:c2+Math.PI/2,i:i});}});
 S.hosp.slice(0,1).forEach(function(hp){if(!S.air.length&&(u.heli||0)===0)return;var b=t*0.25;out.push({k:'heli',x:cx(hp)+Math.cos(b)*1.2,y:cy(hp)+Math.sin(b)*1.2,z:0.7,h:b+Math.PI/2,i:9});});
 // armies drilling near barracks, tanks near war factories, angelic legions hovering
 S.bar.forEach(function(bk,j){var n=Math.min(4,u.soldier||0);for(i=0;i<n;i++){var a=t*0.15+i*1.57,px=cx(bk)+Math.cos(a)*1.1,py=cy(bk)+Math.sin(a)*1.1,hd=a+Math.PI/2;for(var r=0;r<3;r++)for(var cI=0;cI<3;cI++)out.push({k:'soldier',x:px+(cI-1)*0.07*Math.cos(hd+Math.PI/2)-r*0.07*Math.cos(hd),y:py+(cI-1)*0.07*Math.sin(hd+Math.PI/2)-r*0.07*Math.sin(hd),z:0.02,h:hd,i:i*9+r*3+cI});}
  for(i=0;i<Math.min(4,u.angelic||0);i++){var b2=t*0.5+i*1.57;out.push({k:'angel',x:cx(bk)+Math.cos(b2)*0.8,y:cy(bk)+Math.sin(b2)*0.8,z:0.5+Math.sin(t*3+i)*0.08,h:b2+Math.PI/2,i:i});}});
 S.war.forEach(function(wf){for(i=0;i<Math.min(4,u.tank||0);i++){var a=t*0.08+i*1.57;out.push({k:'tank',x:cx(wf)+Math.cos(a)*1.4,y:cy(wf)+Math.sin(a)*1.0,z:0.02,h:a+Math.PI/2,i:i});}});
 // spaceships launching from the spaceport and patrolling in orbit
 S.port.forEach(function(sp){var ships=[];['shuttle','fighter','scruiser','carrier'].forEach(function(k){for(i=0;i<Math.min(k==='fighter'?4:2,u[k]||0);i++)ships.push(k);});
  ships.forEach(function(k,i){var per=k==='carrier'?40:k==='scruiser'?30:20,f=((t+i*7)%per)/per;if(k==='fighter'&&f>0.35){var a=t*0.5+i*1.6;out.push({k:k,x:cx(sp)+Math.cos(a)*4,y:cy(sp)+Math.sin(a)*3,z:4+Math.sin(a*2),h:a+Math.PI/2,i:i});return;}
   var alt=f<0.1?0.05:Math.pow((f-0.1)/0.9,2)*25;out.push({k:k,x:cx(sp)+(f>0.1?(f-0.1)*3:0),y:cy(sp),z:alt,h:0,up:1,flame:f>0.08,i:i});});});
 return out.slice(0,lim);}
/* ---------- 2.5D drawing ---------- */
var COLS=['#e04848','#4888e0','#f0f0f0','#f0c040','#40a060','#303040','#a060d0'];
function draw2d(ctx,G,toScreen,Z,iso,T,t,inView){if(Z<0.9)return;var qual=AC.settings.q==='high'?'high':AC.settings.q==='low'?'low':'med',V=vehicles(G,t,qual);
 // power lines & railways
 ctx.save();S.lines.forEach(function(l){var a=toScreen(cx(l[0])*T,cy(l[0])*T),b=toScreen(cx(l[1])*T,cy(l[1])*T);ctx.setTransform(1,0,0,1,0,0);ctx.strokeStyle='rgba(40,40,40,.55)';ctx.lineWidth=Math.max(0.6,Z*0.35);ctx.beginPath();var lift=7*Z;ctx.moveTo(a.x,a.y-lift);ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-lift*0.55,b.x,b.y-lift);ctx.stroke();ctx.fillStyle='#665';ctx.fillRect(a.x-Z*0.5,a.y-lift,Z,lift);});
 S.rails.forEach(function(r){var a=toScreen(cx(r[0])*T,cy(r[0])*T),b=toScreen(cx(r[1])*T,cy(r[1])*T);ctx.setTransform(1,0,0,1,0,0);ctx.strokeStyle='#5a4a3a';ctx.lineWidth=Math.max(2,Z*3.5);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#c8c8d0';ctx.lineWidth=Math.max(0.5,Z*0.8);ctx.setLineDash([Z*2,Z*1.2]);ctx.stroke();ctx.setLineDash([]);});ctx.restore();
 V.forEach(function(v){if(inView&&!inView(v.x,v.y))return;var p=toScreen(v.x*T,v.y*T),q=toScreen((v.x+Math.cos(v.h)*0.1)*T,(v.y+Math.sin(v.h)*0.1)*T),ang=Math.atan2(q.y-p.y,q.x-p.x),alt=v.z*T*Z*0.9,s=Z;
  if(v.z>0.3){ctx.setTransform(s,0,0,s,p.x,p.y);ctx.rotate(ang);ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(0,0,v.k==='plane'?6:3,v.k==='plane'?5:2,0,0,7);ctx.fill();}
  ctx.setTransform(s,0,0,s,p.x,p.y-alt);if(!v.up)ctx.rotate(ang);var k=v.k,c=COLS[v.i%COLS.length];
  if(k==='car'){ctx.fillStyle=c;ctx.fillRect(-3,-1.5,6,3);ctx.fillStyle='rgba(180,220,255,.9)';ctx.fillRect(0.5,-1.2,1.4,2.4);}
  else if(k==='bus'){ctx.fillStyle='#f5c518';ctx.fillRect(-5,-1.8,10,3.6);ctx.fillStyle='#9cd0ff';for(var w=-4;w<4;w+=2)ctx.fillRect(w,-1.8,1.2,0.8);}
  else if(k==='police'||k==='fireengine'){ctx.fillStyle=k==='police'?'#f0f0f8':'#d8281c';ctx.fillRect(-3.5,-1.6,7,3.2);ctx.fillStyle=(t*4|0)%2?'#ff3030':'#3070ff';ctx.fillRect(-0.6,-1.6,1.2,3.2);}
  else if(k==='sail'||k==='fishing'){ctx.fillStyle='#8a5a30';ctx.beginPath();ctx.ellipse(0,0,4,1.6,0,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-1,-1,2.5,2);ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(-9,-1.5);ctx.moveTo(-4,0);ctx.lineTo(-9,1.5);ctx.stroke();}
  else if(k==='cargo'){ctx.fillStyle='#38424e';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(7,-2.6);ctx.lineTo(-9,-2.6);ctx.lineTo(-9,2.6);ctx.lineTo(7,2.6);ctx.fill();for(var b=0;b<5;b++){ctx.fillStyle=COLS[(b+v.i)%COLS.length];ctx.fillRect(-6+b*2.6,-2,2.2,4);}ctx.fillStyle='#fff';ctx.fillRect(-9,-1.8,2,3.6);}
  else if(k==='ferry'){ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,0,6,2.4,0,0,7);ctx.fill();ctx.fillStyle='#4a8ad8';ctx.fillRect(-3,-1.4,6,2.8);}
  else if(k==='warship'){ctx.fillStyle='#7a8898';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(5,-2.4);ctx.lineTo(-8,-2.2);ctx.lineTo(-8,2.2);ctx.lineTo(5,2.4);ctx.fill();ctx.fillStyle='#4a5868';ctx.fillRect(-3,-1.4,4,2.8);ctx.strokeStyle='#333';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(8,0);ctx.stroke();}
  else if(k==='train'||k==='traincar'){ctx.fillStyle=k==='train'?'#c02828':'#e8e0d0';ctx.fillRect(-4.4,-1.8,8.8,3.6);ctx.fillStyle='#ffd76a';ctx.fillRect(-4.4,-0.3,8.8,0.6);}
  else if(k==='plane'){ctx.fillStyle='#f4f4f8';ctx.fillRect(-6,-0.9,12,1.8);ctx.beginPath();ctx.moveTo(1,0);ctx.lineTo(-2,-6);ctx.lineTo(-3,-6);ctx.lineTo(-1,0);ctx.lineTo(-3,6);ctx.lineTo(-2,6);ctx.fill();ctx.fillRect(-6,-2.5,1.5,5);ctx.fillStyle='#e8c25a';ctx.fillRect(4,-0.9,1,1.8);}
  else if(k==='heli'){ctx.fillStyle='#d8302c';ctx.beginPath();ctx.ellipse(0,0,2.6,1.6,0,0,7);ctx.fill();ctx.fillRect(-5,-0.4,3,0.8);ctx.strokeStyle='rgba(30,30,30,.7)';ctx.lineWidth=0.6;var ra=t*25;ctx.beginPath();ctx.moveTo(Math.cos(ra)*5,Math.sin(ra)*5);ctx.lineTo(-Math.cos(ra)*5,-Math.sin(ra)*5);ctx.stroke();}
  else if(k==='flyer'||k==='angel'){var fl=Math.sin(t*12+v.i)*2;ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(0,-1);ctx.lineTo(-3,-3-fl);ctx.lineTo(-1,0);ctx.lineTo(-3,3+fl);ctx.lineTo(0,1);ctx.fill();ctx.fillStyle=k==='angel'?'#e8c25a':'#fff6d0';ctx.beginPath();ctx.arc(1,0,1,0,7);ctx.fill();}
  else if(k==='soldier'){ctx.fillStyle='#8a2a20';ctx.fillRect(-0.7,-0.7,1.4,1.4);ctx.fillStyle='#e8c25a';ctx.fillRect(0.2,-0.3,0.6,0.6);}
  else if(k==='tank'){ctx.fillStyle='#4a5a30';ctx.fillRect(-3.4,-2,6.8,4);ctx.fillStyle='#2a3418';ctx.fillRect(-3.4,-2.4,6.8,0.8);ctx.fillRect(-3.4,1.6,6.8,0.8);ctx.fillStyle='#5a6a3a';ctx.beginPath();ctx.arc(0,0,1.5,0,7);ctx.fill();ctx.fillRect(0,-0.4,5,0.8);}
  else{var big=k==='carrier'?2.2:k==='scruiser'?1.6:k==='fighter'?0.7:1;if(v.up){ctx.fillStyle='#eef';ctx.fillRect(-1.2*big,-6*big,2.4*big,6*big);ctx.fillStyle='#e8c25a';ctx.beginPath();ctx.moveTo(-1.2*big,-6*big);ctx.lineTo(0,-8.5*big);ctx.lineTo(1.2*big,-6*big);ctx.fill();if(v.flame){ctx.fillStyle='rgba(255,170,60,.9)';ctx.beginPath();ctx.moveTo(-1*big,0);ctx.lineTo(0,(4+Math.random()*2)*big);ctx.lineTo(1*big,0);ctx.fill();}}
   else{ctx.fillStyle='#cfd8f0';ctx.beginPath();ctx.moveTo(4*big,0);ctx.lineTo(-3*big,-3*big);ctx.lineTo(-2*big,0);ctx.lineTo(-3*big,3*big);ctx.fill();ctx.fillStyle='rgba(120,200,255,.9)';ctx.fillRect(-3.5*big,-0.5,1.2,1);}}});
 ctx.setTransform(1,0,0,1,0,0);}
/* ---------- 3D drawing ---------- */
var pools={},T3=null,lineObj=null,lineSig='';
function tmpl(k){var T=T3,g=new T.Group(),M=function(c,e){return new T.MeshStandardMaterial({color:c,roughness:0.5,metalness:0.2,emissive:e||0});},bx=function(m,w,h,d,x,y,z){var o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x||0,(y||0)+h/2,z||0);o.castShadow=true;g.add(o);return o;};
 var mats=tmpl.m||(tmpl.m={glass:M(0x9cd0ff),dark:M(0x303038),white:M(0xf4f4f8),red:M(0xd8281c),yellow:M(0xf5c518),hull:M(0x38424e),navy:M(0x7a8898),wood:M(0x8a5a30),olive:M(0x4a5a30),gold:M(0xe8c25a),robe:M(0xfbf7ec),legion:M(0x8a2a20),flame:new T.MeshBasicMaterial({color:0xffa040})});
 if(k==='car'){var cm=M(COLS[(Math.random()*COLS.length)|0]);bx(cm,.12,.035,.06,0,.01);bx(mats.glass,.06,.025,.05,-.005,.045);}
 else if(k==='bus'){bx(mats.yellow,.24,.06,.07,0,.01);bx(mats.glass,.22,.02,.072,0,.045);}
 else if(k==='police'||k==='fireengine'){bx(k==='police'?mats.white:mats.red,.13,.04,.065,0,.01);bx(mats.glass,.04,.015,.04,0,.05).material=new T.MeshBasicMaterial({color:0x4060ff});}
 else if(k==='sail'||k==='fishing'){bx(mats.wood,.25,.05,.09,0,-.02);bx(mats.white,.06,.05,.06,-.04,.03);bx(mats.dark,.008,.18,.008,.04,.03);}
 else if(k==='cargo'){bx(mats.hull,.6,.07,.14,0,-.03);for(var i=0;i<5;i++)bx(M(COLS[i]),.09,.05,.12,-.2+i*.1,.04);bx(mats.white,.06,.12,.12,-.27,.04);}
 else if(k==='ferry'){bx(mats.white,.35,.06,.12,0,-.02);bx(M(0x4a8ad8),.24,.05,.1,0,.04);bx(mats.white,.16,.04,.08,0,.09);}
 else if(k==='warship'){bx(mats.navy,.5,.06,.12,0,-.02);bx(mats.navy,.14,.1,.08,-.05,.04);bx(mats.dark,.12,.015,.015,.12,.07);bx(mats.dark,.008,.12,.008,-.05,.14);}
 else if(k==='train'||k==='traincar'){bx(k==='train'?mats.red:mats.white,.27,.07,.08,0,0);bx(mats.gold,.27,.01,.082,0,.035);}
 else if(k==='plane'){bx(mats.white,.36,.045,.045,0,0);bx(mats.white,.08,.01,.4,.02,.015);bx(mats.white,.04,.07,.01,-.16,.03);bx(mats.white,.04,.01,.12,-.16,.03);}
 else if(k==='heli'){bx(mats.red,.1,.05,.05,0,0);bx(mats.red,.12,.015,.015,-.1,.02);var rot=bx(mats.dark,.26,.004,.015,0,.06);g.userData.rot=rot;}
 else if(k==='flyer'||k==='angel'){var b=new T.Mesh(new T.ConeGeometry(.012,.05,6),k==='angel'?mats.gold:mats.robe);b.rotation.z=-Math.PI/2;g.add(b);var wl=bx(mats.white,.03,.002,.07,-.005,0);g.userData.wing=wl;}
 else if(k==='soldier'){var s=new T.Mesh(new T.ConeGeometry(.012,.045,5),mats.legion);s.position.y=.022;s.castShadow=true;g.add(s);}
 else if(k==='tank'){bx(mats.olive,.14,.04,.08,0,0);var tu=new T.Mesh(new T.CylinderGeometry(.025,.025,.025,8),mats.olive);tu.position.y=.052;g.add(tu);bx(mats.olive,.09,.01,.01,.06,.05);}
 else{var big=k==='carrier'?2.2:k==='scruiser'?1.6:k==='fighter'?0.7:1,c=new T.Mesh(new T.CylinderGeometry(.03*big,.035*big,.2*big,10),mats.white);c.position.y=.1*big;g.add(c);var n=new T.Mesh(new T.ConeGeometry(.03*big,.08*big,10),mats.gold);n.position.y=.24*big;g.add(n);
  var fl=new T.Mesh(new T.ConeGeometry(.025*big,.12*big,8),mats.flame);fl.rotation.x=Math.PI;fl.position.y=-.06*big;g.add(fl);g.userData.flame=fl;g.userData.space=1;}
 return g;}
function draw3d(t,street){var C=AC.v3d.ctx(),T=C.T;if(!T)return;T3=T;var G=api().state(),qual=AC.settings.q==='high'?'high':AC.settings.q==='low'?'low':'med',V=vehicles(G,t,qual),used={};
 if(!pools._root){pools._root=new T.Group();C.scene.add(pools._root);}if(pools._root.parent!==C.scene)C.scene.add(pools._root);
 V.forEach(function(v){var arr=pools[v.k]||(pools[v.k]=[]),n=used[v.k]||0;used[v.k]=n+1;var o=arr[n];if(!o){o=tmpl(v.k);arr.push(o);pools._root.add(o);}o.visible=true;
  var gx=v.x-C.W/2,gz=v.y-C.H/2,gy=v.z>0.3||v.up?v.z*0.6+0.05:(v.k==='sail'||v.k==='fishing'||v.k==='cargo'||v.k==='ferry'||v.k==='warship'?0.0:Math.max(0.05,C.hAt(v.x,v.y))+v.z);
  o.position.set(gx,gy,gz);if(o.userData.space){o.rotation.set(0,0,v.up?0:-Math.PI/2);if(!v.up)o.rotation.y=-v.h;o.userData.flame.visible=!!v.flame||!v.up;}else o.rotation.set(0,-v.h,0);
  if(o.userData.rot)o.userData.rot.rotation.y=t*25;if(o.userData.wing)o.userData.wing.rotation.x=Math.sin(t*12+v.i)*0.6;});
 Object.keys(pools).forEach(function(k){if(k==='_root')return;for(var i=used[k]||0;i<pools[k].length;i++)pools[k][i].visible=false;});
 // power lines and railways (rebuilt when the city changes)
 if(lineSig!==sig){lineSig=sig;if(lineObj)C.scene.remove(lineObj);lineObj=new T.Group();var pts=[],P=function(i,y){return new T.Vector3(cx(i)-C.W/2,Math.max(0.05,C.hAt(cx(i),cy(i)))+y,cy(i)-C.H/2);};
  S.lines.forEach(function(l){var a=P(l[0],0.3),b=P(l[1],0.3),m=a.clone().lerp(b,0.5);m.y-=0.06;pts.push(a,m,m,b);[a,b].forEach(function(q){var pole=new T.Mesh(new T.BoxGeometry(0.02,0.3,0.02),tmpl.m?tmpl.m.dark:new T.MeshBasicMaterial({color:0x333333}));pole.position.set(q.x,q.y-0.15,q.z);lineObj.add(pole);});});
  if(pts.length)lineObj.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0x222222})));
  S.rails.forEach(function(r){var a=P(r[0],0.012),b=P(r[1],0.012),len=a.distanceTo(b),m=new T.Mesh(new T.BoxGeometry(len,0.02,0.1),new T.MeshStandardMaterial({color:0x5a4a3a,roughness:1}));m.position.copy(a.clone().lerp(b,0.5));m.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);m.receiveShadow=true;lineObj.add(m);});
  C.scene.add(lineObj);}}
AC.mil={UNITS:UNITS,defence:defence,vehicles:vehicles,draw2d:draw2d,draw3d:draw3d,upkeep:upkeep};
})();
