/* Archangel Cosmos - districts, street view and the playable Angelic Human avatar (three.js, ground-level, real scale).
   1 map tile ~ 40 m; the avatar is ~1.8 m tall. Desktop: WASD/arrows, mouse look (click to lock), Shift run, Space jump/glide (hold to fly), E interact.
   Phones: on-screen joystick, drag right side to look, buttons for run/fly/interact. */
(function(){
'use strict';
var AC=window.AC,H=AC.H;function api(){return AC.api;}
/* ---------- districts (Voronoi regions of the map, named by their dominant terrain) ---------- */
var DN={plains:['Seraph Meadows','Halo Fields','Cherub Vale','Dawnlight Commons','Gloria Plains'],forest:['Whispering Grove','Elderwood','Sylvan Choir','Verdant Halls'],desert:['Golden Dunes','Sunforge Expanse','Amber Reach'],
 mountain:['Throne Peaks','Skyspire Heights','Thunder Crown'],arctic:['Frostveil','Silver Tundra','Snowhalo'],volcanic:['Emberfall','Cinder Gate','Pyre Hollow'],crystal:['Crystal Sanctum','Prism Fields','Starshard Vale'],ocean:['Sapphire Sea','Azure Deep'],shallow:['Pearl Shallows','Lagoon of Grace']};
var cache={key:null,id:null,list:null};
function compute(G){var W=api().W,Hh=api().H;if(cache.key===G.tiles)return cache;var seeds=[],list=[],id=new Array(G.tiles.length),used={};
 for(var y=4;y<Hh;y+=9)for(var x=5;x<W;x+=10){var jx=Math.min(W-1,x+((AC.art.hash(x,y,90)*6)|0)-3),jy=Math.min(Hh-1,y+((AC.art.hash(x,y,91)*6)|0)-3);seeds.push([jx,jy]);}
 G.tiles.forEach(function(c,i){var x=i%W,y=(i/W)|0,b=0,bd=1e9;seeds.forEach(function(s,k){var d=(s[0]-x)*(s[0]-x)+(s[1]-y)*(s[1]-y);if(d<bd){bd=d;b=k;}});id[i]=b;});
 seeds.forEach(function(s,k){var tally={};G.tiles.forEach(function(c,i){if(id[i]===k)tally[c.t]=(tally[c.t]||0)+1;});var land=Object.keys(tally).filter(function(t){return t!=='ocean'&&t!=='shallow';}).sort(function(a,b){return tally[b]-tally[a];});
  var t=land.length&&tally[land[0]]>6?land[0]:'ocean',pool=DN[t],n=pool[k%pool.length];if(used[n])n=n+' '+['East','West','North','South','Outer'][(used[n]++)%5];else used[n]=1;list.push({n:n,t:t,x:s[0],y:s[1]});});
 cache={key:G.tiles,id:id,list:list};return cache;}
function capDist(G,i){var W=api().W,c=G.tiles.findIndex(function(t){return t.b==='capital';});if(c<0)return 99;return Math.max(Math.abs(c%W-i%W),Math.abs(((c/W)|0)-((i/W)|0)));}
function dname(i){var G=api().state();if(!G||i==null)return '';if(capDist(G,i)<=3)return 'Capital District';var d=compute(G);return d.list[d.id[i]].n;}
AC.districts={name:dname,list:function(){var G=api().state();return G?compute(G).list:[];}};

/* ---------- save data ---------- */
H.migrate.push(function(G){if(!G.player)G.player={x:null,z:null,yaw:0,robe:'#f4f0ff',wing:'#ffffff',halo:'#ffd76a',name:'Seraph'};});

/* ---------- avatar ---------- */
var on=false,T,V,av=null,P={x:0,y:0,z:0,vy:0,yaw:0,pitch:-0.15,fly:false},keys={},joy={x:0,y:0},look=null,run=false,flyBtn=false,last=0,curD='',banner,hud,mini,miniBg=null,flap=0,third=true;
var SC=0.045; // 1.8 m in tile units
function mkAvatar(){var g=new T.Group(),G=api().state(),pl=G.player,m=function(c,e){return new T.MeshStandardMaterial({color:c,roughness:0.5,metalness:0,emissive:e||0});};
 var robeM=m(pl.robe),skin=m('#f2d2b6'),haloM=new T.MeshStandardMaterial({color:pl.halo,emissive:pl.halo,emissiveIntensity:0.9,metalness:0.6,roughness:0.3}),wingM=new T.MeshStandardMaterial({color:pl.wing,roughness:0.6,side:T.DoubleSide,emissive:0x222233});
 var robe=new T.Mesh(new T.ConeGeometry(0.28,1.15,12).translate(0,0.58,0),robeM);g.add(robe);var torso=new T.Mesh(new T.CylinderGeometry(0.16,0.2,0.45,10).translate(0,1.3,0),robeM);g.add(torso);
 var head=new T.Mesh(new T.SphereGeometry(0.15,14,10).translate(0,1.68,0),skin);g.add(head);var hair=new T.Mesh(new T.SphereGeometry(0.155,12,8,0,6.3,0,1.4).translate(0,1.7,0),m('#e8c070'));g.add(hair);
 var halo=new T.Mesh(new T.TorusGeometry(0.15,0.022,8,24).rotateX(Math.PI/2).translate(0,1.98,0),haloM);g.add(halo);
 var wshape=new T.Shape();wshape.moveTo(0,0);wshape.bezierCurveTo(0.3,0.5,0.9,0.7,1.1,0.55);wshape.bezierCurveTo(0.9,0.3,0.8,0.1,0.95,-0.15);wshape.bezierCurveTo(0.6,-0.1,0.4,-0.5,0.5,-0.75);wshape.bezierCurveTo(0.2,-0.5,0.05,-0.2,0,0);
 var wg=new T.ShapeGeometry(wshape,8),wl=new T.Mesh(wg,wingM),wr=new T.Mesh(wg,wingM);wl.position.set(-0.05,1.35,-0.17);wr.position.set(0.05,1.35,-0.17);wr.scale.x=-1;var wL=new T.Group(),wR=new T.Group();wL.add(wl);wR.add(wr);wl.position.set(0,0,0);wr.position.set(0,0,0);
 wL.position.set(0.05,1.35,-0.17);wR.position.set(-0.05,1.35,-0.17);g.add(wL);g.add(wR);
 g.traverse(function(o){if(o.isMesh)o.castShadow=true;});g.scale.setScalar(SC);g.userData={wL:wL,wR:wR,robe:robeM,halo:haloM,wing:wingM};return g;}
function recolor(){if(!av)return;var pl=api().state().player;av.userData.robe.color.set(pl.robe);av.userData.halo.color.set(pl.halo);av.userData.halo.emissive.set(pl.halo);av.userData.wing.color.set(pl.wing);}
/* ---------- collision / terrain ---------- */
function tileAt(x,z){var W=V.W,Hh=V.H,tx=Math.floor(x+W/2),tz=Math.floor(z+Hh/2);if(tx<0||tz<0||tx>=W||tz>=Hh)return -1;return tz*W+tx;}
function ground(x,z){var G=api().state(),i=tileAt(x,z);var h=V.hAt(x+V.W/2,z+V.H/2);if(i>=0&&G.tiles[i].b)h=Math.max(h,0.05)+(G.tiles[i].b==='road'?0.03:0);return Math.max(h,-0.02);}
function blocked(x,z,y){var G=api().state(),i=tileAt(x,z);if(i<0)return true;var c=G.tiles[i];if(!P.fly&&y<0.05&&(c.t==='ocean'||c.t==='shallow')&&!c.b)return true;
 if(c.b&&c.b!=='road'&&c.b!=='farm'&&c.b!=='park'){var cx=Math.floor(x+V.W/2)+0.5-V.W/2,cz=Math.floor(z+V.H/2)+0.5-V.H/2;if(Math.abs(x-cx)<0.3&&Math.abs(z-cz)<0.3&&y<ground(x,z)+0.5)return true;}return false;}
/* ---------- enter / exit ---------- */
function enter(){if(!AC.v3d.webgl()){api().toast('Street view needs WebGL (3D graphics), which this device does not support. The 2.5D map still works.');return false;}
 if(!AC.v3d.active()){AC.v3d.setOn(true);var tries=0,iv=setInterval(function(){if(AC.v3d.active()||++tries>50){clearInterval(iv);if(AC.v3d.active())enter();}},100);return false;}
 if(AC.galaxy&&AC.galaxy.active())AC.galaxy.toggle();if(AC.space&&AC.space.active())AC.space.toggle();
 V=AC.v3d.ctx();T=V.T;if(!av){av=mkAvatar();V.scene.add(av);}av.visible=true;var G=api().state(),pl=G.player;
 if(pl.x==null){var c=G.tiles.findIndex(function(t){return t.b==='capital';});if(c<0)c=G.tiles.findIndex(function(t){return t.t==='plains';});pl.x=c%V.W+0.5-V.W/2+0.42;pl.z=((c/V.W)|0)+0.5-V.H/2+0.42;}
 P.x=pl.x;P.z=pl.z;P.yaw=pl.yaw||0;P.y=ground(P.x,P.z);P.vy=0;P.fly=false;on=true;curD='';document.body.classList.add('street');buildHud();last=performance.now();miniBg=null;return true;}
function exit(){on=false;document.body.classList.remove('street');if(av)av.visible=false;if(document.pointerLockElement)document.exitPointerLock();save();}
function save(){var G=api().state();if(G&&G.player){G.player.x=+P.x.toFixed(3);G.player.z=+P.z.toFixed(3);G.player.yaw=+P.yaw.toFixed(3);}}
/* ---------- update (called by view3d each frame) ---------- */
function update(now,camera){var dt=Math.min(0.1,(now-last)/1000);last=now;var G=api().state();
 var fx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x,fz=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y;
 var mag=Math.min(1,Math.hypot(fx,fz)),running=run||keys.ShiftLeft||keys.ShiftRight,sp=(P.fly?0.9:running?0.32:0.12)*mag;
 if(mag>0.05){var k=sp*dt/Math.max(1,Math.hypot(fx,fz)),sn=Math.sin(P.yaw),cs=Math.cos(P.yaw),nx=P.x+(-sn*fz+cs*fx)*k,nz=P.z+(-cs*fz-sn*fx)*k;
  if(!blocked(nx,P.z,P.y))P.x=nx;if(!blocked(P.x,nz,P.y))P.z=nz;}
 var gnd=ground(P.x,P.z),up=keys.Space||flyBtn;
 if(up){if(P.y<=gnd+0.002&&!P.fly){P.vy=0.09;}else if(P.vy<0.03||P.fly){P.fly=true;P.vy=Math.min(0.25,P.vy+dt*0.35);}}
 P.vy-=dt*(P.fly&&!up?0.06:0.3);if(P.fly&&!up)P.vy=Math.max(P.vy,-0.08);P.y+=P.vy*dt;var ceil=gnd+3;if(P.y>ceil){P.y=ceil;P.vy=0;}if(P.y<=gnd){P.y=gnd;P.vy=0;P.fly=false;}
 av.position.set(P.x,P.y,P.z);av.rotation.y=P.yaw+Math.PI;var moving=mag>0.05;flap+=dt*(P.fly?14:moving?4:1.5);var wa=P.fly?0.6+Math.sin(flap)*0.6:0.25+Math.sin(flap)*0.08;av.userData.wL.rotation.y=wa;av.userData.wR.rotation.y=-wa;
 av.children[0].rotation.z=moving&&!P.fly?Math.sin(flap*2)*0.05:0;
 // camera: third person (default) or first person
 var cp=Math.cos(P.pitch),dist=third?0.24:0;var hx=P.x,hy=P.y+SC*1.7,hz=P.z;
 if(third){camera.position.set(hx+Math.sin(P.yaw)*dist*cp,hy+0.04-Math.sin(P.pitch)*dist,hz+Math.cos(P.yaw)*dist*cp);var cg=ground(camera.position.x,camera.position.z)+0.02;if(camera.position.y<cg)camera.position.y=cg;camera.lookAt(hx,hy+0.01,hz);av.visible=true;}
 else{camera.position.set(hx,hy,hz);camera.lookAt(hx-Math.sin(P.yaw)*cp,hy+Math.sin(P.pitch),hz-Math.cos(P.yaw)*cp);av.visible=false;}
 camera.userData.fx=P.x;camera.userData.fz=P.z;
 var i=tileAt(P.x,P.z);if(i>=0){var dn=dname(i);if(dn!==curD){curD=dn;showBanner(dn);G.player.district=dn;}}
 if(((now/400)|0)!==((now/400-dt*2.5)|0))drawMini(G);if(G.day%5===0)save();
 var near=nearest();var hint=document.getElementById('stHint');if(hint)hint.textContent=near!=null?'E / Interact: '+api().BY[G.tiles[near].b].n+(G.tiles[near].con?' (under construction)':''):'';}
function nearest(){var G=api().state(),best=null,bd=0.9;for(var dx=-1;dx<=1;dx++)for(var dz=-1;dz<=1;dz++){var i=tileAt(P.x+dx,P.z+dz);if(i<0||!G.tiles[i].b||G.tiles[i].b==='road')continue;var cx=i%V.W+0.5-V.W/2,cz=((i/V.W)|0)+0.5-V.H/2,d=Math.hypot(cx-P.x,cz-P.z);if(d<bd){bd=d;best=i;}}return best;}
/* ---------- interaction ---------- */
var GO={market:'market',capital:'host',admin:'host',embassy:'host',lab:'research',academy:'research',qlab:'research',spaceport:'space'};
function interact(){var i=nearest(),G=api().state(),box=document.getElementById('stPanel');if(i==null){box.innerHTML='<p>Nothing nearby. Walk up to a building.</p><button data-x="close">Close</button>';box.style.display='block';return;}
 var c=G.tiles[i],b=api().BY[c.b],h='<h3>'+b.n+'</h3><p class="small">'+b.d+'</p><p class="small">District: '+dname(i)+'</p>';
 if(c.con)h+='<p>🏗 Under construction: <b>'+c.con.left+' days</b> left.</p><button data-x="rush" data-i="'+i+'">✦ Speed up ('+api().rushCost(c)+' Light)</button>';
 else{h+='<p class="small">'+(c.idle?'⚠ Idle: missing inputs.':'Operating normally.')+'</p>';if(GO[c.b])h+='<button data-x="go" data-t="'+GO[c.b]+'">Enter '+({market:'the Market',host:'the Council',research:'the Labs',space:'Mission Control'}[GO[c.b]])+'</button>';
  if(c.b==='market')h+='<button data-x="go" data-t="store">Visit the Cosmetics Shop</button>';if(c.b==='cathedral')h+='<button data-x="bless">Pray for a blessing</button>';}
 box.innerHTML=h+'<button data-x="close">Close</button>';box.style.display='block';if(AC.audio)AC.audio.sfx('click');}
function panelClick(e){var t=e.target.closest('[data-x]');if(!t)return;var G=api().state(),box=document.getElementById('stPanel');
 if(t.dataset.x==='close')box.style.display='none';else if(t.dataset.x==='rush'){api().rush(+t.dataset.i);interact();}
 else if(t.dataset.x==='go'){box.style.display='none';api().switchTab(t.dataset.t);if(innerWidth<800)exit();}
 else if(t.dataset.x==='bless'){if(G.lastBless===G.day)api().toast('The Cathedral already blessed you today.');else{G.lastBless=G.day;G.res.light+=5;api().toast('A warm light surrounds you. +5 Celestial Light.','success');}box.style.display='none';}
 else if(t.dataset.x==='custom'){var o=['robe','wing','halo'][+t.dataset.k],pal={robe:['#f4f0ff','#a8c8ff','#ffd6e8','#d9b8ff','#fff1b0'],wing:['#ffffff','#ffe9a8','#bfe0ff','#ffc8e0','#e0d0ff'],halo:['#ffd76a','#e0e8ff','#ff9ac8','#7ff0ff']}[o],cur=pal.indexOf(G.player[o]);G.player[o]=pal[(cur+1)%pal.length];recolor();}
 else if(t.dataset.x==='view'){third=!third;}else if(t.dataset.x==='exit')exit();}
function showBanner(n){banner=banner||document.getElementById('stBanner');banner.textContent=n;banner.classList.remove('show');void banner.offsetWidth;banner.classList.add('show');}
/* ---------- HUD, minimap, controls ---------- */
function buildHud(){if(hud)return;var w=document.getElementById('mapWrap');hud=document.createElement('div');hud.id='streetHud';
 hud.innerHTML='<div id="stBanner"></div><canvas id="stMini" width="150" height="100"></canvas><div id="stHint"></div><div id="stPanel"></div>'+
 '<div id="stBtns"><button data-x="view" title="First/third person">👁</button><button data-x="custom" data-k="0" title="Robe colour">👘</button><button data-x="custom" data-k="1" title="Wing colour">🪽</button><button data-x="custom" data-k="2" title="Halo colour">😇</button><button data-x="exit">Exit street view</button></div>'+
 '<div id="stJoy"><i></i></div><div id="stTouch"><button id="stRun">Run</button><button id="stFly">Fly</button><button id="stE">E</button></div>';w.appendChild(hud);
 hud.addEventListener('click',panelClick);mini=document.getElementById('stMini');
 var cv=V.cvs;cv.addEventListener('click',function(){if(on&&matchMedia('(pointer:fine)').matches&&cv.requestPointerLock)try{cv.requestPointerLock();}catch(e){}});
 document.addEventListener('mousemove',function(e){if(on&&document.pointerLockElement===cv){P.yaw-=e.movementX*0.0025;P.pitch=Math.max(-1.2,Math.min(0.9,P.pitch-e.movementY*0.0025));}});
 cv.addEventListener('pointerdown',function(e){if(!on||document.pointerLockElement===cv)return;look={id:e.pointerId,x:e.clientX,y:e.clientY};});
 cv.addEventListener('pointermove',function(e){if(!on||!look||look.id!==e.pointerId)return;P.yaw-=(e.clientX-look.x)*0.006;P.pitch=Math.max(-1.2,Math.min(0.9,P.pitch-(e.clientY-look.y)*0.005));look.x=e.clientX;look.y=e.clientY;});
 ['pointerup','pointercancel'].forEach(function(n){cv.addEventListener(n,function(e){if(look&&look.id===e.pointerId)look=null;});});
 var J=document.getElementById('stJoy'),knob=J.firstChild,jid=null;
 J.addEventListener('pointerdown',function(e){jid=e.pointerId;J.setPointerCapture(e.pointerId);mv(e);});J.addEventListener('pointermove',function(e){if(e.pointerId===jid)mv(e);});
 function mv(e){var r=J.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2),m=Math.hypot(x,y);if(m>1){x/=m;y/=m;}joy.x=x;joy.y=y;knob.style.transform='translate('+x*30+'px,'+y*30+'px)';}
 ['pointerup','pointercancel'].forEach(function(n){J.addEventListener(n,function(){jid=null;joy.x=joy.y=0;knob.style.transform='';});});
 var hold=function(id,f){var b=document.getElementById(id);b.addEventListener('pointerdown',function(e){e.preventDefault();f(true);});['pointerup','pointerleave','pointercancel'].forEach(function(n){b.addEventListener(n,function(){f(false);});});};
 hold('stRun',function(v){run=v;});hold('stFly',function(v){flyBtn=v;});document.getElementById('stE').onclick=interact;}
addEventListener('keydown',function(e){if(!on||/INPUT|SELECT|TEXTAREA/.test((e.target.tagName||'')))return;keys[e.code]=true;if(e.code==='KeyE')interact();if(e.code==='KeyV')third=!third;if(e.code==='Escape'&&!document.pointerLockElement)exit();if(/Arrow|Space/.test(e.code))e.preventDefault();});
addEventListener('keyup',function(e){keys[e.code]=false;});addEventListener('blur',function(){keys={};});
var TC={ocean:'#1d4a8a',shallow:'#3a8ac8',plains:'#7cbf55',forest:'#3f8a45',desert:'#e6cf8a',mountain:'#8d8478',arctic:'#f2f7fb',volcanic:'#5a2e2a',crystal:'#b69af0'};
function drawMini(G){if(!mini)return;var x=mini.getContext('2d'),W=V.W,Hh=V.H,s=Math.min(150/W,100/Hh);
 if(!miniBg){miniBg=document.createElement('canvas');miniBg.width=W;miniBg.height=Hh;var b=miniBg.getContext('2d');G.tiles.forEach(function(c,i){b.fillStyle=TC[c.t];b.fillRect(i%W,(i/W)|0,1,1);});}
 x.clearRect(0,0,150,100);x.imageSmoothingEnabled=false;x.drawImage(miniBg,0,0,W*s,Hh*s);G.tiles.forEach(function(c,i){if(c.b){x.fillStyle=c.con?'#ff9a3a':c.b==='road'?'#e8dcb8':'#fff';x.fillRect((i%W)*s,((i/W)|0)*s,s,s);}});
 var px=(P.x+W/2)*s,pz=(P.z+Hh/2)*s;x.save();x.translate(px,pz);x.rotate(-P.yaw);x.fillStyle='#ffd76a';x.strokeStyle='#000';x.beginPath();x.moveTo(0,-6);x.lineTo(4,4);x.lineTo(-4,4);x.closePath();x.fill();x.stroke();x.restore();
 x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,88,150,12);x.fillStyle='#fff';x.font='9px sans-serif';x.fillText(curD,3,97);}
H.act.street=function(){if(on)exit();else enter();};
AC.street={active:function(){return on;},enter:enter,exit:exit,update:update,P:P,keys:keys,district:function(){return curD;},teleport:function(i){P.x=i%V.W+0.5-V.W/2;P.z=((i/V.W)|0)+0.5-V.H/2;P.y=ground(P.x,P.z);},interact:interact,nearest:nearest};
})();
