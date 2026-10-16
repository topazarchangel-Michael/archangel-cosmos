/* Archangel Cosmos - Phase 2 "Archangel: Starborn": the Helion solar system layer.
   Orbital map, realistic procedural planet renders, ships, surveys, colonies, space resources, structures and missions. */
(function(){
'use strict';
var AC=window.AC,H=AC.H;function api(){return AC.api;}
function pay(G,c){for(var k in c)if((G.res[k]||0)<c[k])return false;for(k in c)G.res[k]-=c[k];return true;}
function disc(G,c){var f=(AC.host&&AC.host.has(G,'starward')?0.8:1)*(G.races&&G.races.aeth&&G.races.aeth.ally?0.85:1),o={};for(var k in c)o[k]=Math.ceil(c[k]*f);return o;}

/* ---------- system data ---------- */
var BODIES=[
 {id:'cherub',n:'Cherub',type:'lava',orbit:70,size:7,period:60,res:'Topazium & Quantum Matter',atm:'#ff9a50'},
 {id:'elysia',n:'Elysia',type:'terran',orbit:120,size:11,period:200,home:true,atm:'#8fd0ff'},
 {id:'seraph',n:'Seraph',type:'moon',parent:'elysia',orbit:22,size:4,period:30,res:'Helium-3'},
 {id:'thronos',n:'Thronos',type:'desert',orbit:170,size:9,period:320,res:'Iron, Titanium',atm:'#ffd9a0'},
 {id:'halo',n:'Halo Belt',type:'belt',orbit:215,size:5,period:420,res:'Iron, Titanium, Topazium'},
 {id:'dominion',n:'Dominion',type:'gas',orbit:280,size:22,period:700,res:'Stellar Gas',atm:'#ffcf8a',ring:true},
 {id:'virtue',n:'Virtue',type:'ice',parent:'dominion',orbit:36,size:5,period:40,res:'Helium-3, Water'},
 {id:'power',n:'Power',type:'volcanic',parent:'dominion',orbit:50,size:5,period:55,res:'Quantum Matter'},
 {id:'principality',n:'Principality',type:'icegiant',orbit:345,size:15,period:1000,res:'Dark Energy, Helium-3',atm:'#9ff0ff'}
];
var BB={};BODIES.forEach(function(b,i){b.ph=i*1.7;BB[b.id]=b;});
var STRUCT=[
 {id:'habitat',n:'Orbital Habitat',on:'*',cost:{credits:8000,metal:60},d:'+50,000 colony housing.'},
 {id:'shipyard',n:'Orbital Shipyard',on:['moon','terran'],cost:{credits:12000,metal:100,goods:40},d:'Builds Colony Arks and Freighters.'},
 {id:'he3x',n:'Helium-3 Extractor',on:['moon','ice','icegiant'],cost:{credits:6000,metal:50},prod:{he3:4},d:'+4 Helium-3/day.'},
 {id:'harvester',n:'Gas Harvester',on:['gas','icegiant'],cost:{credits:9000,metal:80,titanium:20},prod:{gas:6},d:'+6 Stellar Gas/day.'},
 {id:'rig',n:'Asteroid Mining Rig',on:['belt','lava','desert'],cost:{credits:7000,metal:60},prod:{iron:40,titanium:6,topazium:1},d:'+40 Iron, +6 Titanium, +1 Topazium/day.'},
 {id:'qforge',n:'Quantum Forge',on:['volcanic','lava'],cost:{credits:14000,titanium:60,crystal:20},prod:{qmatter:2},cons:{gas:3},d:'3 Stellar Gas -> 2 Quantum Matter/day.'},
 {id:'relay',n:'Starlight Relay',on:'*',cost:{credits:5000,crystal:10},prod:{light:2,research:5},d:'+2 Light, +5 Research/day.'},
 {id:'darktap',n:'Dark Energy Tap',on:['icegiant'],cost:{credits:20000,qmatter:10,titanium:80},prod:{darke:1},cons:{he3:2},d:'2 Helium-3 -> 1 Dark Energy/day.'},
 {id:'fusion',n:'He-3 Fusion Plant',on:'*',cost:{credits:10000,metal:80},prod:{energy:200},cons:{he3:1},d:'1 Helium-3 -> 200 Energy/day (sent to Elysia).'}
];
var SB={};STRUCT.forEach(function(s){SB[s.id]=s;});
var SHIPS=[
 {id:'scout',n:'Seraph Scout',cost:{credits:3000,goods:20},d:'Surveys a world.'},
 {id:'ark',n:'Colony Ark',cost:{credits:20000,metal:150,goods:60,titanium:40},yard:true,d:'Founds a colony.'},
 {id:'freighter',n:'Freighter',cost:{credits:6000,metal:50},yard:true,d:'Runs a trade route to a colony: +250 ₵/day, colony output +10%.'}
];

/* ---------- missions (Phase 2) ---------- */
function S(G){return G.star||{};}
function colonies(G){return Object.keys(S(G).col||{});}
function spacePop(G){var p=0;colonies(G).forEach(function(c){p+=G.star.col[c].pop;});return p;}
[
 {id:'S01',n:'Starborn Begins',d:'Establish the Seraph moon colony (complete Genesis).',check:function(G){return !!S(G).unlocked;},reward:{credits:10000}},
 {id:'S02',n:'Orbital Shipyard',d:'Build an Orbital Shipyard at Seraph.',check:function(G){return colonies(G).some(function(c){return G.star.col[c].st.indexOf('shipyard')>=0;});},reward:{metal:100}},
 {id:'S03',n:'Wings of the Host',d:'Build a Scout ship.',check:function(G){return (S(G).built||{}).scout>0;},reward:{research:30}},
 {id:'S04',n:'Cartographer',d:'Survey 3 worlds.',check:function(G){return Object.keys(S(G).surveyed||{}).length>=3;},reward:{credits:8000}},
 {id:'S05',n:'New Horizons',d:'Colonise a second world beyond Seraph.',check:function(G){return colonies(G).length>=2;},reward:{light:50,credits:10000}},
 {id:'S06',n:'Fusion Age',d:'Gather 100 Helium-3 (lifetime).',check:function(G){return (G.made.he3||0)>=100;},reward:{credits:12000}},
 {id:'S07',n:'Giant Harvest',d:'Harvest 200 Stellar Gas (lifetime).',check:function(G){return (G.made.gas||0)>=200;},reward:{research:60}},
 {id:'S08',n:'Quantum Forge',d:'Forge 20 Quantum Matter (lifetime).',check:function(G){return (G.made.qmatter||0)>=20;},reward:{credits:20000}},
 {id:'S09',n:'Trade Lanes',d:'Establish a freighter trade route.',check:function(G){return colonies(G).some(function(c){return G.star.col[c].route;});},reward:{credits:10000}},
 {id:'S10',n:'Five Worlds',d:'Hold colonies on 5 worlds.',check:function(G){return colonies(G).length>=5;},reward:{light:150}},
 {id:'S11',n:'Million Souls',d:'Reach 1,000,000 total population (Elysia + colonies).',check:function(G){return G.pop+spacePop(G)>=1e6;},reward:{credits:50000}},
 {id:'S12',n:'System Governor',d:'Tap 10 Dark Energy from Principality.',check:function(G){return (G.made.darke||0)>=10;},reward:{light:300}}
].forEach(function(m){m.phase='starborn';var c=m.check;m.check=function(G){return !!(G.star&&G.star.unlocked)&&c(G);};AC.MISSIONS.push(m);});

/* ---------- state ---------- */
H.migrate.push(function(G){if(!G.star)G.star={unlocked:false,col:{},surveyed:{},ships:{scout:0,ark:0,freighter:0},built:{},fleet:[],sel:'elysia'};});
function owns(){return !AC.store||AC.store.owns('starborn');}
function unlock(G){if(G.star.unlocked||!G.space.colony)return;
 if(!owns()){if(!G.star.lockNote){G.star.lockNote=1;api().toast('Starborn expansion is locked. See the Store to unlock it.');}return;}
 G.star.unlocked=true;G.star.surveyed.elysia=G.star.surveyed.seraph=1;G.star.col.seraph={pop:10000,st:[],route:false};
 api().toast('Phase 2 unlocked: Archangel: Starborn! Open the Space view.','success');api().say('The Helion system lies open before us, Governor. Build an Orbital Shipyard at Seraph, then send Scouts to survey the worlds.');}
var lastTick=0;
H.tick.push(function(G,add){lastTick=performance.now();unlock(G);var st=G.star;if(!st.unlocked)return;
 // fleet travel
 st.fleet=st.fleet.filter(function(f){if(--f.eta>0)return true;var b=BB[f.to];
  if(f.type==='scout'){st.surveyed[f.to]=1;st.ships.scout++;api().toast('Survey complete: '+b.n+' ('+(b.res||'home')+').','notify');}
  else if(f.type==='ark'){st.col[f.to]={pop:5000,st:[],route:false};api().toast('Colony founded on '+b.n+'!','success');}
  else if(f.type==='freighter'){if(st.col[f.to])st.col[f.to].route=true;api().toast('Trade route opened to '+b.n+'.','notify');}
  return false;});
 // colonies
 Object.keys(st.col).forEach(function(id){var c=st.col[id],cap=20000+c.st.filter(function(x){return x==='habitat';}).length*50000,m=c.route?1.1:1;
  c.pop=Math.min(cap,c.pop*1.01+50);add('credits',c.pop/1000*1.2+(c.route?250:0));c.idle=[];
  c.st.forEach(function(sid,j){var s=SB[sid],ok=true,k;if(s.cons)for(k in s.cons)if((G.res[k]||0)<s.cons[k])ok=false;if(!ok){c.idle.push(j);return;}
   for(k in s.cons)add(k,-s.cons[k]);for(k in s.prod)add(k,s.prod[k]*m);});});
});

/* ---------- actions ---------- */
function hasYard(G){return colonies(G).some(function(c){return G.star.col[c].st.indexOf('shipyard')>=0;});}
function dist(a,b){var A=BB[a],B=BB[b];var ra=A.parent?BB[A.parent].orbit:A.orbit,rb=B.parent?BB[B.parent].orbit:B.orbit;return Math.abs(ra-rb)/40;}
function travel(from,to){return Math.max(2,Math.round(3+dist(from,to)*3));}
H.act.ship=function(G,id){var s=SHIPS.find(function(x){return x.id===id;});if(!G.counts.spaceport)return api().toast('A Spaceport on Elysia is required.');
 if(s.yard&&!hasYard(G))return api().toast('Requires an Orbital Shipyard.');if(!pay(G,disc(G,s.cost)))return api().toast('Not enough resources.');
 G.star.ships[id]++;G.star.built[id]=(G.star.built[id]||0)+1;if(AC.audio)AC.audio.sfx('build');api().toast(s.n+' constructed.');};
H.act.survey=function(G,b){if(G.star.surveyed[b])return;if(G.star.ships.scout<1)return api().toast('Build a Scout first.');if(G.star.fleet.some(function(f){return f.to===b&&f.type==='scout';}))return;
 G.star.ships.scout--;G.star.fleet.push({type:'scout',from:'elysia',to:b,eta:travel('elysia',b),tot:travel('elysia',b)});if(AC.audio)AC.audio.sfx('launch');api().toast('Scout launched to '+BB[b].n+'.');};
H.act.colonise=function(G,b){if(!G.star.surveyed[b])return api().toast('Survey it first.');if(G.star.col[b])return;if(G.star.ships.ark<1)return api().toast('Build a Colony Ark first.');
 if(G.star.fleet.some(function(f){return f.to===b&&f.type==='ark';}))return;G.star.ships.ark--;var t=travel('elysia',b);G.star.fleet.push({type:'ark',from:'elysia',to:b,eta:t,tot:t});if(AC.audio)AC.audio.sfx('launch');api().toast('Colony Ark departs for '+BB[b].n+'.');};
H.act.route=function(G,b){var c=G.star.col[b];if(!c||c.route)return;if(G.star.ships.freighter<1)return api().toast('Build a Freighter first.');G.star.ships.freighter--;var t=travel('elysia',b);G.star.fleet.push({type:'freighter',from:'elysia',to:b,eta:t,tot:t});api().toast('Freighter dispatched to '+BB[b].n+'.');};
H.act.sbuild=function(G,arg){var p=arg.split(':'),c=G.star.col[p[0]],s=SB[p[1]],b=BB[p[0]];if(!c)return;if(c.st.length>=4)return api().toast('This colony has no free slots (max 4).');
 if(s.on!=='*'&&s.on.indexOf(b.type)<0)return api().toast(s.n+' cannot be built on a '+b.type+' world.');if(!pay(G,disc(G,s.cost)))return api().toast('Not enough resources.');c.st.push(s.id);if(AC.audio)AC.audio.sfx('build');api().toast(s.n+' built on '+b.n+'.');};
H.act.selBody=function(G,b){G.star.sel=b;};
H.act.toggleSpace=function(G){toggle();};

/* ---------- procedural planet textures + sphere renderer ---------- */
var TEX={},mk=function(w,h){return AC.render.mk(w,h);},vn=function(x,y,s,p){return AC.render.vnoise(x,y,s,p);};
var PAL={terran:null,moon:[[90,90,96],[200,200,205]],desert:[[150,90,50],[240,200,140]],lava:[[40,15,10],[255,120,30]],ice:[[150,190,220],[250,255,255]],
 volcanic:[[50,30,30],[230,110,50]],gas:[[160,100,50],[250,225,180]],icegiant:[[40,120,170],[180,240,255]],belt:[[110,100,90],[200,180,150]]};
function lerp(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function texture(b){if(TEX[b.id])return TEX[b.id];var W=AC.settings.q==='high'?256:128,Hh=W/2,c=mk(W,Hh),x=c.getContext('2d'),img=x.createImageData(W,Hh),seed=b.id.length*31+b.orbit;
 for(var y=0;y<Hh;y++)for(var X=0;X<W;X++){var u=X/W*8,v=y/Hh*4,n=0,a=1,t=0;for(var o=0;o<5;o++){var f=1<<o;n+=a*vn(u*f,v*f,seed+o,8*f);t+=a;a*=0.5;}n/=t;var col,lat=Math.abs(y/Hh-0.5)*2;
  if(b.type==='terran'){if(lat>0.86)col=[245,250,255];else if(n<0.5)col=lerp([10,40,110],[30,90,170],n/0.5);else if(n<0.53)col=[220,205,150];else col=n>0.68?lerp([110,100,90],[240,240,240],(n-0.68)*3):lerp([70,140,60],[40,90,40],(n-0.53)*6);}
  else if(b.type==='gas'||b.type==='icegiant'){var band=Math.sin(v*(b.type==='gas'?9:5)+n*5)*0.5+0.5;col=lerp(PAL[b.type][0],PAL[b.type][1],band*0.8+n*0.2);
   if(b.type==='gas'){var dx=X/W-0.3,dy=y/Hh-0.62;if(dx*dx*4+dy*dy*30<0.02)col=[200,90,60];}}
  else{var p=PAL[b.type];col=lerp(p[0],p[1],n);if(b.type==='lava'||b.type==='volcanic'){if(Math.abs(n-0.5)<0.025)col=[255,180,60];}
   if(b.type==='moon'||b.type==='ice'){var cr=vn(u*6,v*6,seed+9,48);if(cr>0.78)col=lerp(col,[60,60,70],0.5);}}
  var i=(y*W+X)*4;img.data[i]=col[0];img.data[i+1]=col[1];img.data[i+2]=col[2];img.data[i+3]=255;}
 x.putImageData(img,0,0);var cl=null;
 if(b.type==='terran'){cl=mk(W,Hh);var cx=cl.getContext('2d'),ci=cx.createImageData(W,Hh);for(y=0;y<Hh;y++)for(X=0;X<W;X++){var q=vn(X/W*12,y/Hh*6,99,12)*0.6+vn(X/W*30,y/Hh*15,98,30)*0.4;var k2=(y*W+X)*4;ci.data[k2]=ci.data[k2+1]=ci.data[k2+2]=255;ci.data[k2+3]=Math.max(0,(q-0.5)*3)*230;}cx.putImageData(ci,0,0);}
 TEX[b.id]={c:c,d:img.data,W:W,H:Hh,cl:cl?cl.getContext('2d').getImageData(0,0,W,Hh).data:null};return TEX[b.id];}
var sphereCache={};
function sphere(b,r,rot,lx,ly,lights){r=Math.max(3,Math.round(r));var key=b.id+r,sc=sphereCache[key];if(!sc){sc={c:mk(r*2+2,r*2+2)};sc.x=sc.c.getContext('2d');sc.img=sc.x.createImageData(r*2+2,r*2+2);sphereCache[key]=sc;}
 var T=texture(b),D=sc.img.data,w=r*2+2,ll=Math.hypot(lx,ly,0.35),Lx=lx/ll,Ly=ly/ll,Lz=0.35/ll,atm=b.atm?hex(b.atm):null;
 for(var y=0;y<w;y++)for(var x=0;x<w;x++){var i=(y*w+x)*4,nx=(x-r-0.5)/r,ny=(y-r-0.5)/r,d2=nx*nx+ny*ny;
  if(d2>1){D[i+3]=0;continue;}var nz=Math.sqrt(1-d2),lon=Math.atan2(nx,nz)+rot,lat=Math.asin(ny),u=((lon/6.2832)%1+1)%1,v=lat/3.1416+0.5,
   tx=(u*T.W)|0,ty=Math.min(T.H-1,(v*T.H)|0),ti=(ty*T.W+tx)*4,lam=nx*Lx+ny*Ly+nz*Lz,lit=Math.max(0,lam)*1.05+0.04,R=T.d[ti],G2=T.d[ti+1],B=T.d[ti+2];
  if(T.cl){var cu=(((lon+rot*0.3)/6.2832)%1+1)%1,ci=(ty*T.W+((cu*T.W)|0))*4,ca=T.cl[ci+3]/255;R+=(255-R)*ca;G2+=(255-G2)*ca;B+=(255-B)*ca;}
  // specular on oceans
  var spec=0;if(b.type==='terran'&&B>R+40&&lam>0){var hz=lam*nz;spec=Math.pow(Math.max(0,hz),24)*140;}
  R=R*lit+spec;G2=G2*lit+spec;B=B*lit+spec;
  if(lights&&lam<0.05&&AC.art.hash(tx,ty,4)<0.06&&T.d[ti+1]>T.d[ti+2]&&T.d[ti+1]>T.d[ti]){R=255;G2=220;B=140;}
  if(atm){var rim=Math.pow(1-nz,3)*Math.max(0.15,lam+0.3);R+=atm[0]*rim;G2+=atm[1]*rim;B+=atm[2]*rim;}
  var edge=Math.min(1,(1-Math.sqrt(d2))*r*1.5);D[i]=R;D[i+1]=G2;D[i+2]=B;D[i+3]=255*edge;}
 sc.x.putImageData(sc.img,0,0);return sc.c;}
function hex(h){return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)];}

/* ---------- orbital map ---------- */
var on=false,cv=null,ctx=null,zoom=1,pos={},bg=null,frameN=0;
function active(){return on;}
function toggle(){var G=api().state();if(!G)return;if(!on&&!(G.star&&G.star.unlocked)){api().toast(owns()?'Complete Genesis (found the Moon colony) to unlock the Starborn space view.':'Starborn expansion is locked. See the Store.');return;}
 on=!on;document.body.classList.toggle('space',on);var b=document.getElementById('btnSpaceView');if(b)b.textContent=on?'🌍':'🪐';if(on){AC.H.act.tab&&AC.H.act.tab('space');}api().render();}
function where(b,G,now){var t=G.day+Math.min(1,(now-lastTick)/1000),a=b.ph+t*6.2832/b.period,p={x:Math.cos(a)*b.orbit,y:Math.sin(a)*b.orbit*0.55};
 if(b.parent){var q=where(BB[b.parent],G,now);p={x:q.x+Math.cos(a)*b.orbit,y:q.y+Math.sin(a)*b.orbit*0.55};}return p;}
function frame(now){cv=cv||document.getElementById('map');ctx=ctx||cv.getContext('2d');var G=api().state(),w=cv.width,h=cv.height,t=now/1000,hi=AC.settings.q==='high';frameN++;
 ctx.setTransform(1,0,0,1,0,0);if(!bg){bg=mk(512,512);var bx=bg.getContext('2d');bx.fillStyle='#010208';bx.fillRect(0,0,512,512);for(var i=0;i<500;i++){bx.globalAlpha=Math.random();bx.fillStyle=Math.random()<0.2?'#bcd4ff':'#fff';var s=Math.random()*1.5+0.2;bx.fillRect(Math.random()*512,Math.random()*512,s,s);}
  [['#5a3fb0',120,140],['#1f5fa0',380,360]].forEach(function(n){var g=bx.createRadialGradient(n[1],n[2],5,n[1],n[2],200);g.addColorStop(0,n[0]);g.addColorStop(1,'rgba(0,0,0,0)');bx.globalAlpha=0.18;bx.fillStyle=g;bx.fillRect(0,0,512,512);});bx.globalAlpha=1;}
 ctx.fillStyle=ctx.createPattern(bg,'repeat');ctx.fillRect(0,0,w,h);
 var sc=Math.min(w/760,h/440)*zoom,cx=w/2,cy=h/2;ctx.setTransform(sc,0,0,sc,cx,cy);
 // orbits
 ctx.lineWidth=1/sc;BODIES.forEach(function(b){if(b.parent)return;ctx.strokeStyle=b.type==='belt'?'rgba(200,180,140,.12)':'rgba(160,190,255,.22)';ctx.beginPath();ctx.ellipse(0,0,b.orbit,b.orbit*0.55,0,0,6.283);ctx.stroke();});
 // belt
 ctx.fillStyle='rgba(200,180,150,.7)';for(i=0;i<(hi?260:110);i++){var a=i*2.399+t*0.01,rr=BB.halo.orbit+Math.sin(i*7.1)*10;ctx.fillRect(Math.cos(a)*rr,Math.sin(a)*rr*0.55,1.2/sc+0.6,1.2/sc+0.6);}
 // sun Helion
 var pulse=1+0.04*Math.sin(t*2);[[90,'rgba(255,190,90,0.08)'],[50,'rgba(255,220,140,0.25)'],[26,'rgba(255,240,200,0.9)']].forEach(function(l){var g=ctx.createRadialGradient(0,0,0,0,0,l[0]*pulse);g.addColorStop(0,l[1]);g.addColorStop(1,'rgba(255,200,100,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,l[0]*pulse,0,6.283);ctx.fill();});
 ctx.fillStyle='#fff8e0';ctx.beginPath();ctx.arc(0,0,13,0,6.283);ctx.fill();
 // bodies sorted by depth (y)
 var list=BODIES.filter(function(b){return b.type!=='belt';}).map(function(b){var p=where(b,G,now);pos[b.id]=p;return {b:b,p:p};});pos.halo={x:BB.halo.orbit*Math.cos(t*0.01),y:BB.halo.orbit*0.55*Math.sin(t*0.01)};
 list.sort(function(a,b){return a.p.y-b.p.y;});
 var upd=hi?(frameN%2===0):(frameN%12===0);
 list.forEach(function(o){var b=o.b,p=o.p,r=b.size*(b.home?1.15:1),pr=Math.max(3,r*sc),lx=-p.x,ly=-p.y/0.55,img,key=b.id+'_img';
  if(upd||!o.b._img||o.b._r!==Math.round(pr)){o.b._img=sphere(b,pr,t*6.2832/(b.type==='gas'?40:b.type==='terran'?60:90),lx,ly,b.home);o.b._r=Math.round(pr);}
  if(b.ring){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-0.25);ctx.strokeStyle='rgba(230,200,150,.55)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,r*1.9,r*0.5,0,Math.PI,6.283);ctx.stroke();ctx.restore();}
  ctx.drawImage(b._img,p.x-r-1/sc,p.y-r-1/sc,(pr*2+2)/sc,(pr*2+2)/sc);
  if(b.ring){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-0.25);ctx.strokeStyle='rgba(240,215,170,.75)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,r*1.9,r*0.5,0,0,Math.PI);ctx.stroke();ctx.restore();}
  var col=G.star.col[b.id],sel=G.star.sel===b.id;
  if(col||sel){ctx.strokeStyle=sel?'rgba(255,225,130,.95)':'rgba(140,255,170,.7)';ctx.lineWidth=1.5/sc;ctx.beginPath();ctx.arc(p.x,p.y,r+4,0,6.283);ctx.stroke();}
  ctx.font=(11/sc)+'px Georgia';ctx.textAlign='center';ctx.fillStyle=G.star.surveyed[b.id]?'#fff3c8':'rgba(200,210,255,.6)';ctx.fillText(b.n+(col?' ✦':''),p.x,p.y+r+12/sc);});
 if(G.star.sel==='halo'){ctx.strokeStyle='rgba(255,225,130,.9)';ctx.lineWidth=1.5/sc;ctx.beginPath();ctx.ellipse(0,0,BB.halo.orbit,BB.halo.orbit*.55,0,0,6.283);ctx.stroke();}
 ctx.font=(11/sc)+'px Georgia';ctx.fillStyle='#e8d8b0';ctx.fillText('Halo Belt'+(G.star.col.halo?' ✦':''),pos.halo.x,pos.halo.y-8/sc);
 // fleets
 G.star.fleet.forEach(function(f){var a=pos[f.from]||pos.elysia,b=pos[f.to],k=1-(f.eta-Math.min(1,(now-lastTick)/1000))/f.tot;if(!a||!b)return;var x=a.x+(b.x-a.x)*k,y=a.y+(b.y-a.y)*k;
  ctx.strokeStyle='rgba(255,230,150,.25)';ctx.setLineDash([3/sc,4/sc]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
  var g=ctx.createRadialGradient(x,y,0,x,y,6);g.addColorStop(0,'#fff');g.addColorStop(1,'rgba(255,220,120,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,6,0,6.283);ctx.fill();});
 // big render of selected body in side panel
 var pv=document.getElementById('planetView');if(pv&&(upd||!pv._b||pv._b!==G.star.sel)){var sb=BB[G.star.sel];if(sb&&sb.type!=='belt'){var px=pv.getContext('2d');px.clearRect(0,0,pv.width,pv.height);
   var R=pv.width*0.36,img=sphere({id:sb.id+'_big',type:sb.type,orbit:sb.orbit,atm:sb.atm,home:sb.home},R,t*0.1,-1,-0.4,sb.home);px.drawImage(img,pv.width/2-R-1,pv.height/2-R-1);pv._b=G.star.sel;}}
}
function click(e){var G=api().state(),r=cv.getBoundingClientRect(),w=cv.width,h=cv.height,sx=(e.clientX-r.left)*w/r.width,sy=(e.clientY-r.top)*h/r.height,sc=Math.min(w/760,h/440)*zoom,x=(sx-w/2)/sc,y=(sy-h/2)/sc,best=null,bd=1e9;
 BODIES.forEach(function(b){var p=pos[b.id];if(!p)return;var d=Math.hypot(p.x-x,p.y-y)-b.size;if(d<bd){bd=d;best=b.id;}});if(bd<18){G.star.sel=best;if(AC.audio)AC.audio.sfx('click');if(AC.H.act.tab)AC.H.act.tab('space');api().render();}}
function wheel(e){zoom=Math.max(0.6,Math.min(3,zoom*(e.deltaY<0?1.12:1/1.12)));}

/* ---------- panel ---------- */
H.panel.space=function(G){var st=G.star,cs=api().costStr,fmt=api().fmt;
 if(!st.unlocked)return '<h3>Archangel: Starborn</h3>'+(owns()?'<p>Complete Genesis by founding the Moon colony (mission M19) to open the Helion solar system.</p>':'<p>The Starborn expansion is locked. <button data-act="openStore">Open Store</button></p>');
 var h='<button data-act="toggleSpace">'+(on?'🌍 Return to Elysia':'🪐 Open Solar System view')+'</button><h3>Helion System <small>· Rank: System Governor (in training)</small></h3>';
 h+='<div class="row"><span>Space resources</span><span>'+['he3','gas','qmatter','topazium','darke'].map(function(k){return '<span class="cost">'+AC.art.ICONS[k]+fmt(G.res[k]||0)+'</span>';}).join(' ')+'</span></div>';
 h+='<div class="row"><span>Colony population</span><b>'+fmt(spacePop(G))+'</b></div>';
 h+='<h3>Ships</h3>'+SHIPS.map(function(s){return '<div class="row"><span>'+s.n+' <b>×'+st.ships[s.id]+'</b><br><small>'+s.d+' '+cs(disc(G,s.cost))+'</small></span><button data-act="ship" data-arg="'+s.id+'">Build</button></div>';}).join('');
 if(st.fleet.length)h+='<p class="small">In flight: '+st.fleet.map(function(f){return f.type+' → '+BB[f.to].n+' ('+f.eta+'d)';}).join(', ')+'</p>';
 var b=BB[st.sel]||BB.elysia,c=st.col[b.id];
 h+='<h3>'+b.n+'</h3><canvas id="planetView" width="200" height="160"></canvas><p class="small">Type: '+b.type+(b.res?' · Resources: '+b.res:'')+'</p>';
 h+='<div class="small">Select a world by clicking it in the Solar System view: '+BODIES.map(function(x){return '<button class="mini" data-act="selBody" data-arg="'+x.id+'">'+x.n+'</button>';}).join('')+'</div>';
 if(b.home)h+='<p>Your homeworld. Ships launch from the Elysia Spaceport.</p>';
 else if(!st.surveyed[b.id])h+='<button data-act="survey" data-arg="'+b.id+'">Send Scout to survey</button>';
 else if(!c)h+='<button data-act="colonise" data-arg="'+b.id+'">Send Colony Ark</button>';
 else{h+='<div class="row"><span>Colony pop <b>'+fmt(c.pop)+'</b></span><span>'+(c.route?'Trade route ✔':'<button data-act="route" data-arg="'+b.id+'">Send Freighter</button>')+'</span></div><p class="small">Structures ('+c.st.length+'/4): '+(c.st.map(function(s,j){return SB[s].n+((c.idle||[]).indexOf(j)>=0?' (idle)':'');}).join(', ')||'none')+'</p>';
  STRUCT.forEach(function(s){if(s.on!=='*'&&s.on.indexOf(b.type)<0)return;h+='<div class="card"><span class="t">'+s.n+'</span> '+cs(disc(G,s.cost))+'<br><span class="e">'+s.d+'</span><br><button data-act="sbuild" data-arg="'+b.id+':'+s.id+'">Build</button></div>';});}
 return h;};
H.advise.push(function(G){var st=G.star;if(!st||!st.unlocked)return null;if(!hasYard(G))return 'Build an Orbital Shipyard at Seraph (Space tab) so we can construct Colony Arks.';
 if(Object.keys(st.surveyed).length<3)return 'Send Scouts to survey nearby worlds. Thronos and the Halo Belt are rich in metals.';
 if(colonies(G).length<2)return 'A Colony Ark could settle a surveyed world. Dominion\'s moons hold Helium-3 and Quantum Matter.';return null;});
H.render=function(G){var hud=document.getElementById('hud');if(G.star&&G.star.unlocked&&hud){var s='';['he3','gas','qmatter','topazium','darke'].forEach(function(k){var d=(G.net||{})[k]||0;s+='<span title="'+AC.RES[k].n+'">'+AC.art.ICONS[k]+'<b>'+api().fmt(G.res[k]||0)+'</b> <small style="color:'+(d<0?'#f88':'#8f8')+'">'+(d>=0?'+':'')+api().fmt(d)+'</small></span>';});hud.insertAdjacentHTML('beforeend',s);}};
AC.space={active:active,toggle:toggle,frame:frame,click:click,wheel:wheel,BODIES:BODIES,sphere:sphere,spacePop:spacePop};
})();
