/* Archangel Cosmos - renderer: settings, zoom/pan/pinch view, terrain lighting (hillshade "normal map"),
   water reflections, clouds, day/night cycle, atmosphere. Plain Canvas 2D, no libraries. */
(function(){
'use strict';
var AC=window.AC, KEY='archangelCosmos.settings';
var S={quality:'auto',music:0.45,sfx:0.7,muted:false,daynight:true,view:'iso',r3d:'auto'};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
function resolve(){var q=S.quality;if(q==='auto')q=(Math.min(screen.width,screen.height)>=700&&!matchMedia('(pointer:coarse)').matches)?'high':'low';S.q=q;S.res=q==='high'?2:1;}
resolve();
AC.settings=S;AC.saveSettings=function(){resolve();try{localStorage.setItem(KEY,JSON.stringify({quality:S.quality,music:S.music,sfx:S.sfx,muted:S.muted,daynight:S.daynight,view:S.view,r3d:S.r3d}));}catch(e){}};
function mk(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
var hsh=function(a,b,c){return AC.art.hash(a,b,c);};

/* ---------- view: zoom & pan, top-down or isometric 2.5D ---------- */
var cv,WW,WH,V={z:1,ox:0,oy:0,fit:1,max:8,mode:S.view||'iso'},dpr=1,ptrs={},drag=null,dragged=false,moveT=0,inited=false;
var ISO=[0.7071,0.35355,-0.7071,0.35355];
function M(){return V.mode==='iso'?ISO:[1,0,0,1];}
function proj(x,y){var m=M();return {x:m[0]*x+m[2]*y,y:m[1]*x+m[3]*y};}
function bbox(){var p=[proj(0,0),proj(WW,0),proj(0,WH),proj(WW,WH)];return {x0:Math.min.apply(0,p.map(function(q){return q.x;})),x1:Math.max.apply(0,p.map(function(q){return q.x;})),y0:Math.min.apply(0,p.map(function(q){return q.y;})),y1:Math.max.apply(0,p.map(function(q){return q.y;}))};}
function phone(){return Math.min(innerWidth,innerHeight)<700;}
function resize(){if(!cv)return;var p=cv.parentElement,w=p.clientWidth||300,h=p.clientHeight||200,c=center();dpr=Math.min(window.devicePixelRatio||1,S.q==='high'?2:1.5);
 cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);cv.style.width=w+'px';cv.style.height=h+'px';var B=bbox();
 V.fit=Math.min(cv.width/(B.x1-B.x0),cv.height/(B.y1-B.y0))*0.98;V.max=Math.max(V.fit*4,cv.width/(3*32));
 if(!inited){inited=true;V.z=V.fit;V.ox=(cv.width-(B.x0+B.x1)*V.z)/2;V.oy=(cv.height-(B.y0+B.y1)*V.z)/2;}else if(c)lookAt(c.x,c.y);clamp();}
function center(){if(!cv||!cv.width)return null;var m=M(),u=(cv.width/2-V.ox)/V.z,v=(cv.height/2-V.oy)/V.z,det=m[0]*m[3]-m[1]*m[2];return {x:(m[3]*u-m[2]*v)/det,y:(-m[1]*u+m[0]*v)/det};}
function lookAt(x,y){var p=proj(x,y);V.ox=cv.width/2-p.x*V.z;V.oy=cv.height/2-p.y*V.z;}
function clamp(){V.z=Math.max(V.fit,Math.min(V.max,V.z));var B=bbox(),pad=40*dpr;
 function ax(o,lo,hi,size){var a=lo*V.z,b=hi*V.z;if(b-a<=size)return (size-a-b)/2;return Math.min(-a+pad,Math.max(size-b-pad,o));}
 V.ox=ax(V.ox,B.x0,B.x1,cv.width);V.oy=ax(V.oy,B.y0,B.y1,cv.height);moveT=performance.now();}
function zoomAt(f,sx,sy){var m=M(),u=(sx-V.ox)/V.z,v=(sy-V.oy)/V.z;V.z*=f;V.z=Math.max(V.fit,Math.min(V.max,V.z));V.ox=sx-u*V.z;V.oy=sy-v*V.z;clamp();}
function moving(){return performance.now()-moveT<200;}
function devPt(cx,cy){var r=cv.getBoundingClientRect();return {x:(cx-r.left)*cv.width/r.width,y:(cy-r.top)*cv.height/r.height};}
function focus(wx,wy,tiles){if(!cv)return;tiles=tiles||(phone()?7:12);V.z=Math.max(V.fit,Math.min(V.max,cv.width/(tiles*32*(V.mode==='iso'?1.41:1))));lookAt(wx,wy);clamp();}
function setMode(m){var c=center();V.mode=m;S.view=m;AC.saveSettings();resize();if(c){lookAt(c.x,c.y);clamp();}}
function attach(c,w,h){cv=c;WW=w;WH=h;resize();addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(c.parentElement);
 c.addEventListener('wheel',function(e){e.preventDefault();if(AC.galaxy&&AC.galaxy.active())return AC.galaxy.wheel(e);if(AC.space&&AC.space.active())return AC.space.wheel(e);var p=devPt(e.clientX,e.clientY);zoomAt(e.deltaY<0?1.15:1/1.15,p.x,p.y);},{passive:false});
 c.addEventListener('pointerdown',function(e){ptrs[e.pointerId]={x:e.clientX,y:e.clientY};dragged=false;drag={x:e.clientX,y:e.clientY,ox:V.ox,oy:V.oy,pd:null};});
 c.addEventListener('pointermove',function(e){if(!ptrs[e.pointerId])return;ptrs[e.pointerId]={x:e.clientX,y:e.clientY};var ids=Object.keys(ptrs);
  if(ids.length===2){var a=ptrs[ids[0]],b=ptrs[ids[1]],d=Math.hypot(a.x-b.x,a.y-b.y),m=devPt((a.x+b.x)/2,(a.y+b.y)/2);
   if(drag.pd){zoomAt(d/drag.pd,m.x,m.y);}drag.pd=d;dragged=true;return;}
  if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)dragged=true;
  if(dragged&&!(AC.space&&AC.space.active())){var k=cv.width/cv.getBoundingClientRect().width;V.ox=drag.ox+dx*k;V.oy=drag.oy+dy*k;clamp();}});
 function up(e){delete ptrs[e.pointerId];if(!Object.keys(ptrs).length)drag=null;else if(drag)drag.pd=null;}
 c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);c.addEventListener('pointerleave',up);}
function toWorld(cx,cy){var p=devPt(cx,cy),m=M(),u=(p.x-V.ox)/V.z,v=(p.y-V.oy)/V.z,det=m[0]*m[3]-m[1]*m[2];return {x:(m[3]*u-m[2]*v)/det,y:(-m[1]*u+m[0]*v)/det};}
function toScreen(x,y){var q=proj(x,y);return {x:q.x*V.z+V.ox,y:q.y*V.z+V.oy};}

/* ---------- baked lighting + textures ---------- */
var L={};
function vnoise(x,y,seed,per){var x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
 function g(a,b){if(per){a=((a%per)+per)%per;b=((b%per)+per)%per;}return hsh(a,b,seed);}
 var a=g(x0,y0),b=g(x0+1,y0),c=g(x0,y0+1),d=g(x0+1,y0+1);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;}
var HT={ocean:0,shallow:.12,plains:.32,forest:.38,desert:.3,mountain:.95,arctic:.45,volcanic:.55,crystal:.4};
function prepare(G,W,H,terrain){
 var K=6,w=W*K,h=H*K,hm=new Float32Array(w*h),tl=G.tiles,seed=G.seed%9973;
 // heightmap: bilinear tile heights + fractal detail
 for(var y=0;y<h;y++)for(var x=0;x<w;x++){var tx=x/K-0.5,ty=y/K-0.5,x0=Math.max(0,Math.min(W-1,Math.floor(tx))),y0=Math.max(0,Math.min(H-1,Math.floor(ty))),x1=Math.min(W-1,x0+1),y1=Math.min(H-1,y0+1),fx=Math.max(0,Math.min(1,tx-x0)),fy=Math.max(0,Math.min(1,ty-y0));
  var e=HT[tl[y0*W+x0].t]*(1-fx)*(1-fy)+HT[tl[y0*W+x1].t]*fx*(1-fy)+HT[tl[y1*W+x0].t]*(1-fx)*fy+HT[tl[y1*W+x1].t]*fx*fy;
  var n=vnoise(x/5,y/5,seed)*0.5+vnoise(x/2.2,y/2.2,seed+1)*0.25+vnoise(x/1.1,y/1.1,seed+2)*0.12;hm[y*w+x]=e+n*(0.15+e*0.5);}
 // normals -> lambert shade, encoded as overlay grey (128 = neutral)
 var sc=mk(w,h),sx=sc.getContext('2d'),img=sx.createImageData(w,h),lx=-0.6,ly=-0.6,lz=0.55;
 for(y=0;y<h;y++)for(x=0;x<w;x++){var i=y*w+x,dx=(hm[y*w+Math.min(w-1,x+1)]-hm[y*w+Math.max(0,x-1)])*3,dy=(hm[Math.min(h-1,y+1)*w+x]-hm[Math.max(0,y-1)*w+x])*3,
   nl=Math.hypot(dx,dy,1),d=(-dx*lx-dy*ly+lz)/nl/Math.hypot(lx,ly,lz),v=128+(d-0.55)*210,water=hm[i]<0.2;
   if(water)v=128+(v-128)*0.25;img.data[i*4]=img.data[i*4+1]=img.data[i*4+2]=Math.max(0,Math.min(255,v));img.data[i*4+3]=255;}
 sx.putImageData(img,0,0);L.shade=sc;L.gen=(L.gen||0)+1;
 var tx2=terrain.getContext('2d');tx2.save();tx2.setTransform(1,0,0,1,0,0);tx2.imageSmoothingEnabled=true;tx2.globalCompositeOperation='overlay';tx2.globalAlpha=0.85;tx2.drawImage(sc,0,0,terrain.width,terrain.height);
 // ambient occlusion-ish vignette at low altitude coast
 tx2.restore();
 // water mask (smoothed) for reflections
 var m=mk(W*4,H*4),mx=m.getContext('2d'),s1=mk(W,H),s1x=s1.getContext('2d');
 tl.forEach(function(c,i){s1x.fillStyle=(c.t==='ocean'||c.t==='shallow')?'#fff':'rgba(0,0,0,0)';s1x.fillRect(i%W,(i/W)|0,1,1);});
 mx.imageSmoothingEnabled=true;mx.drawImage(s1,0,0,W*4,H*4);L.mask=m;
 L.fx=mk(W*4,H*4);
 if(!L.cloud)L.cloud=clouds();
 if(!L.stars)L.stars=starfield();
 L.W=W;L.H=H;L.lights=[];}
function clouds(){var N=256,c=mk(N,N),x=c.getContext('2d'),img=x.createImageData(N,N);
 for(var y=0;y<N;y++)for(var X=0;X<N;X++){var v=0,a=1,t=0;for(var o=0;o<5;o++){var f=4<<o;v+=a*vnoise(X/N*f,y/N*f,77+o,f);t+=a;a*=0.5;}v/=t;
  var al=Math.max(0,Math.min(1,(v-0.52)*4));var i=(y*N+X)*4;img.data[i]=img.data[i+1]=255;img.data[i+2]=255;img.data[i+3]=al*235;}
 x.putImageData(img,0,0);var sh=mk(N,N),s=sh.getContext('2d');s.drawImage(c,0,0);s.globalCompositeOperation='source-in';s.fillStyle='#0a1430';s.fillRect(0,0,N,N);return {c:c,sh:sh,N:N};}
function starfield(){var c=mk(512,512),x=c.getContext('2d');x.fillStyle='#02030c';x.fillRect(0,0,512,512);for(var i=0;i<380;i++){x.globalAlpha=0.2+hsh(i,1,9)*0.8;x.fillStyle=hsh(i,2,9)<0.2?'#cfe0ff':'#fff';var s=hsh(i,3,9)*1.6+0.3;x.fillRect(hsh(i,4,9)*512,hsh(i,5,9)*512,s,s);}
 x.globalAlpha=0.12;var g=x.createRadialGradient(150,330,10,150,330,220);g.addColorStop(0,'#8f6bff');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,512,512);x.globalAlpha=1;return c;}

/* ---------- high-resolution terrain chunks (rendered at the current zoom level) ---------- */
var CH={},chOrder=[];
function lvl(){var l=V.z*(V.mode==='iso'?1:1),q=1;while(q<l&&q<(S.q==='high'?8:4))q*=2;return q;}
function visible(W,H){var a=[toWorld0(0,0),toWorld0(cv.width,0),toWorld0(0,cv.height),toWorld0(cv.width,cv.height)],T=32;
 return {x0:Math.max(0,Math.floor(Math.min.apply(0,a.map(function(p){return p.x;}))/T)-1),x1:Math.min(W-1,Math.ceil(Math.max.apply(0,a.map(function(p){return p.x;}))/T)+1),
  y0:Math.max(0,Math.floor(Math.min.apply(0,a.map(function(p){return p.y;}))/T)-1),y1:Math.min(H-1,Math.ceil(Math.max.apply(0,a.map(function(p){return p.y;}))/T)+2)};}
function toWorld0(sx,sy){var m=M(),u=(sx-V.ox)/V.z,v=(sy-V.oy)/V.z,det=m[0]*m[3]-m[1]*m[2];return {x:(m[3]*u-m[2]*v)/det,y:(-m[1]*u+m[0]*v)/det};}
function chunks(ctx,G,W,H,vis){var q=lvl();if(q<=(S.res||1))return;var cs=Math.max(2,16/q),made=0,budget=S.q==='high'?3:1,T=32;
 for(var cy=Math.floor(vis.y0/cs);cy<=Math.floor(vis.y1/cs);cy++)for(var cx=Math.floor(vis.x0/cs);cx<=Math.floor(vis.x1/cs);cx++){var k=L.gen+':'+q+':'+cx+':'+cy,c=CH[k];
  if(!c&&made<budget&&!moving()){made++;var w=Math.min(cs,W-cx*cs),h=Math.min(cs,H-cy*cs);c=AC.art.terrainRegion(G,W,H,cx*cs,cy*cs,w,h,q);var x=c.getContext('2d');
   x.setTransform(q,0,0,q,-cx*cs*T*q,-cy*cs*T*q);x.globalCompositeOperation='overlay';x.globalAlpha=0.85;x.drawImage(L.shade,0,0,W*T,H*T);CH[k]=c;chOrder.push(k);c._w=w;c._h=h;
   while(chOrder.length>(S.q==='high'?140:50))delete CH[chOrder.shift()];}
  if(c)ctx.drawImage(c,cx*cs*T,cy*cs*T,c._w*T,c._h*T);}
 if(made)moveT=Math.max(moveT,performance.now()-150);}
/* ---------- buildings, roads, ruins and walking figures drawn per frame (crisp at any zoom) ---------- */
/* building, or construction site with scaffolding + countdown bar */
function drawB(ctx,c,q,x,y,w,h,t){var spr=AC.art.sprite(c.b,q);if(!c.con)return ctx.drawImage(spr,x,y,w,h);
 var f=c.con.tot?1-c.con.left/c.con.tot:1,sw=spr.width,sh=spr.height,rf=0.12+0.88*f;
 ctx.globalAlpha=0.22;ctx.drawImage(spr,x,y,w,h);ctx.globalAlpha=1;ctx.drawImage(spr,0,sh*(1-rf),sw,sh*rf,x,y+h*(1-rf),w,h*rf);
 var x0=x+w*0.14,x1=x+w*0.86,y0=y+h*0.2,y1=y+h*0.95;ctx.strokeStyle='rgba(150,105,50,.95)';ctx.lineWidth=Math.max(0.5,w/40);ctx.beginPath();
 for(var k=0;k<=3;k++){var xx=x0+(x1-x0)*k/3;ctx.moveTo(xx,y0);ctx.lineTo(xx,y1);}for(k=0;k<=3;k++){var yy=y0+(y1-y0)*k/3;ctx.moveTo(x0,yy);ctx.lineTo(x1,yy);}
 ctx.moveTo(x0,y1);ctx.lineTo(x1,y0);ctx.stroke();
 // crane
 ctx.strokeStyle='#e8b23a';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1,y-h*0.05);ctx.lineTo(x0-w*0.05,y-h*0.05);ctx.moveTo(x0+w*0.1+Math.sin(t)*w*0.1,y-h*0.05);ctx.lineTo(x0+w*0.1+Math.sin(t)*w*0.1,y0);ctx.stroke();
 var bw=w*0.8,bx=x+w*0.1,by=y-h*0.2,bh=Math.max(2.5,h/9);ctx.fillStyle='rgba(10,12,40,.85)';ctx.fillRect(bx-1,by-1,bw+2,bh+2);ctx.fillStyle='#ffd76a';ctx.fillRect(bx,by,bw*f,bh);
 ctx.font='bold '+Math.max(4,h/6)+'px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.8)';ctx.lineWidth=Math.max(0.6,h/40);ctx.strokeText('⏱ '+c.con.left+'d',x+w/2,by-bh*0.3);ctx.fillText('⏱ '+c.con.left+'d',x+w/2,by-bh*0.3);}
function objects(ctx,G,W,H,layers,vis,now){var T=32,iso=V.mode==='iso',m=M(),Z=V.z,t=now/1000,q=Math.min(8,lvl()*(iso?2:1)),inV=function(i){var x=i%W,y=(i/W)|0;return x>=vis.x0&&x<=vis.x1&&y>=vis.y0&&y<=vis.y1;};
 ctx.setTransform(m[0]*Z,m[1]*Z,m[2]*Z,m[3]*Z,V.ox,V.oy);
 // roads on the ground
 ctx.lineCap='round';layers.roads.forEach(function(i){if(!inV(i))return;var xi=i%W,yi=(i/W)|0,cx=xi*T+16,cy=yi*T+16,links=[[1,0],[-1,0],[0,1],[0,-1]].filter(function(d){var nx=xi+d[0],ny=yi+d[1];return nx>=0&&ny>=0&&nx<W&&ny<H&&G.tiles[ny*W+nx].b;});
  [['#8a7a5a',10],['#ddd2b6',8]].forEach(function(st){ctx.strokeStyle=st[0];ctx.lineWidth=st[1];ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+0.01,cy);links.forEach(function(d){ctx.moveTo(cx,cy);ctx.lineTo(cx+d[0]*16,cy+d[1]*16);});ctx.stroke();});
  if(Z>2){ctx.strokeStyle='rgba(150,130,90,.5)';ctx.lineWidth=0.3;for(var k=-3;k<=3;k++){ctx.beginPath();links.forEach(function(d){var ex=d[0]?0:k,ey=d[1]?0:k;ctx.moveTo(cx+ex,cy+ey);ctx.lineTo(cx+d[0]*16+ex,cy+d[1]*16+ey);});ctx.stroke();}}
  ctx.strokeStyle='rgba(232,194,90,.85)';ctx.lineWidth=0.8;ctx.setLineDash([2,3]);ctx.beginPath();links.forEach(function(d){ctx.moveTo(cx,cy);ctx.lineTo(cx+d[0]*16,cy+d[1]*16);});ctx.stroke();ctx.setLineDash([]);});
 if(!iso){layers.bl.forEach(function(i){if(!inV(i))return;var X=(i%W)*T,Y=((i/W)|0)*T,id=G.tiles[i].b;ctx.save();ctx.translate(X,Y);ctx.transform(1,0,-0.7,0.35,19.6,18.2);ctx.globalAlpha=0.32;ctx.drawImage(AC.art.shadowSpr(id),0,0,T,T);ctx.restore();});}
 // upright objects sorted back-to-front
 var list=layers.bl.concat(layers.ruins).filter(inV);list.sort(function(a,b){return ((a%W)+((a/W)|0))-((b%W)+((b/W)|0));});
 var S2=iso?1.25:1;
 list.forEach(function(i){var c=G.tiles[i],X=(i%W)*T,Y=((i/W)|0)*T;
  if(iso){var p=toScreen(X+16,Y+16);ctx.setTransform(Z,0,0,Z,p.x,p.y);ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(4,2,15,6,0,0,7);ctx.fill();
   if(c.b)drawB(ctx,c,q,-16*S2,-27*S2,T*S2,T*S2,t);else{ctx.translate(-16*S2,-27*S2);ctx.scale(S2,S2);AC.art.ruin(ctx,0,0);}}
  else{ctx.setTransform(Z,0,0,Z,V.ox+X*Z,V.oy+Y*Z);if(c.b)drawB(ctx,c,q,0,0,T,T,t);else AC.art.ruin(ctx,0,0);}});
 // tiny Angelic Human figures walking the roads and around buildings (close zoom)
 if(Z>=1.6){var walk=[];layers.roads.forEach(function(i){if(inV(i))walk.push(i);});var n=0;
  walk.forEach(function(i){for(var w=0;w<2;w++){var h=AC.art.hash(i,w,21),ph=(t*0.12*(0.6+h)+h*7)%1,horiz=AC.art.hash(i,w,22)<0.5,dir=AC.art.hash(i,w,23)<0.5?1:-1,o=(AC.art.hash(i,w,24)-0.5)*5;
   var wx=(i%W)*T+(horiz?(dir>0?ph:1-ph)*T:16+o),wy=((i/W)|0)*T+(horiz?16+o:(dir>0?ph:1-ph)*T);figure(ctx,wx,wy,t+h*9,h,iso,Z);n++;}});
  layers.bl.forEach(function(i){if(!inV(i))return;var h=AC.art.hash(i,3,25);if(h>0.7)return;var a=t*0.3*(h+0.4)+h*6,wx=(i%W)*T+16+Math.cos(a)*15,wy=((i/W)|0)*T+16+Math.sin(a)*13;figure(ctx,wx,wy,t+h*5,h,iso,Z);});}
}
function figure(ctx,wx,wy,t,h,iso,Z){var p=toScreen(wx,wy),s=Z*0.9;ctx.setTransform(s,0,0,s,p.x,p.y);var bob=Math.abs(Math.sin(t*6))*0.4;
 ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,0.3,1.4,0.5,0,0,7);ctx.fill();
 if(h<0.35){ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.ellipse(-1.3,-2.6-bob,1.2,0.6,0.6,0,7);ctx.ellipse(1.3,-2.6-bob,1.2,0.6,-0.6,0,7);ctx.fill();}
 ctx.fillStyle=h<0.5?'#fbf7ec':h<0.75?'#cfe0ff':'#f3dca0';ctx.beginPath();ctx.moveTo(-1.1,0);ctx.lineTo(-0.6,-3-bob);ctx.lineTo(0.6,-3-bob);ctx.lineTo(1.1,0);ctx.fill();
 ctx.fillStyle=['#f1cfae','#c58c63','#8a5a3c','#f6dcc0'][(h*4)|0];ctx.beginPath();ctx.arc(0,-3.7-bob,0.75,0,7);ctx.fill();
 ctx.strokeStyle='rgba(255,220,110,.95)';ctx.lineWidth=0.25;ctx.beginPath();ctx.ellipse(0,-4.7-bob,0.75,0.25,0,0,7);ctx.stroke();}
/* ---------- time of day ---------- */
var DAYLEN=160; // seconds per visual day
function tod(now){return S.daynight?((now/1000/DAYLEN)+0.3)%1:0.35;}
function lightLevel(t){return Math.max(0,Math.min(1,0.5+0.9*Math.sin((t-0.25)*6.2832+1.5708)*-1*-1));}
function sun(t){var s=Math.sin(t*6.2832);return Math.max(0,Math.min(1,0.45+s*0.9));} // t=.25 noon, .75 midnight

/* ---------- main draw ---------- */
function draw(ctx,G,W,H,layers,now,hover,ok){
 var TS=AC.art.TS,wW=W*TS,wH=H*TS,t=now/1000,hi=S.q==='high',day=sun(tod(now)),night=1-day;
 ctx.setTransform(1,0,0,1,0,0);
 // space backdrop beyond the map
 ctx.fillStyle=ctx.createPattern(L.stars,'repeat');ctx.fillRect(0,0,cv.width,cv.height);
 var m=M(),Z=V.z;ctx.setTransform(m[0]*Z,m[1]*Z,m[2]*Z,m[3]*Z,V.ox,V.oy);var vis=visible(W,H);
 // atmosphere glow around the world
 ctx.shadowColor='rgba(120,180,255,.8)';ctx.shadowBlur=40*V.z;ctx.fillStyle='#123a86';ctx.fillRect(0,0,wW,wH);ctx.shadowBlur=0;
 ctx.drawImage(layers.terrain,0,0,wW,wH);
 chunks(ctx,G,W,H,vis);
 var th=AC.store&&AC.store.theme();if(th){ctx.globalCompositeOperation=th.op;ctx.fillStyle=th.tint;ctx.fillRect(0,0,wW,wH);ctx.globalCompositeOperation='source-over';}
 // realistic water: sky + cloud reflections + moving sun glints, masked to water
 var f=L.fx,fx=f.getContext('2d'),fw=f.width,fh=f.height;fx.globalCompositeOperation='source-over';fx.clearRect(0,0,fw,fh);
 var sky=fx.createLinearGradient(0,0,0,fh);sky.addColorStop(0,'rgba('+(day>0.2?'190,225,255':'40,60,140')+','+(0.18+0.1*day)+')');sky.addColorStop(1,'rgba(20,60,140,0.05)');fx.fillStyle=sky;fx.fillRect(0,0,fw,fh);
 if(hi&&L.cloud){fx.save();fx.globalAlpha=0.22;fx.scale(1,-1);var off=(t*3)%256;fx.fillStyle=fx.createPattern(L.cloud.c,'repeat');fx.translate(-off,-fh+off*0.3);fx.fillRect(off,fh-off*0.3-fh,fw+256,fh*2);fx.restore();}
 fx.fillStyle='rgba(255,250,225,'+(0.35*day+0.1)+')';
 var nG=hi?260:110;for(var k=0;k<nG;k++){var px=hsh(k,1,3)*fw,py=hsh(k,2,3)*fh,ph=Math.sin(t*(1.2+hsh(k,4,3))+k);if(ph<0.6)continue;fx.globalAlpha=(ph-0.6)*2.4;fx.fillRect((px+t*4)%fw,py+Math.sin(t+k)*1.5,2.2,0.6);}
 fx.globalAlpha=1;
 if(night>0.3){var mg=fx.createRadialGradient(fw*0.7,fh*0.3,1,fw*0.7,fh*0.3,fw*0.25);mg.addColorStop(0,'rgba(200,220,255,'+(0.25*night)+')');mg.addColorStop(1,'rgba(200,220,255,0)');fx.fillStyle=mg;fx.fillRect(0,0,fw,fh);}
 fx.globalCompositeOperation='destination-in';fx.drawImage(L.mask,0,0);
 ctx.drawImage(f,0,0,wW,wH);
 // shimmer strokes
 ctx.fillStyle='#fff';for(k=0;k<layers.water.length;k+=hi?1:3){var i=layers.water[k],p2=hsh(i,5)*6.28,a=Math.sin(t*1.6+p2);if(a<0.6)continue;ctx.globalAlpha=(a-0.6)*0.8;ctx.fillRect((i%W)*TS+6+hsh(i,6)*18,((i/W)|0)*TS+8+hsh(i,8)*16+Math.sin(t+p2)*2,6,1);}
 ctx.globalAlpha=1;
 objects(ctx,G,W,H,layers,vis,now);ctx.setTransform(m[0]*Z,m[1]*Z,m[2]*Z,m[3]*Z,V.ox,V.oy);
 // clouds + their shadows drifting
 if(hi||S.quality==='high'){var C=L.cloud,sc=3,o1=(t*6)%(C.N*sc),o2=(t*2.5)%(C.N*sc);ctx.save();ctx.beginPath();ctx.rect(0,0,wW,wH);ctx.clip();ctx.scale(sc,sc);
  ctx.globalAlpha=0.28;ctx.fillStyle=ctx.createPattern(C.sh,'repeat');ctx.translate(o1/sc+8,o2/sc+6);ctx.fillRect(-o1/sc-8-C.N,-o2/sc-6-C.N,wW/sc+2*C.N,wH/sc+2*C.N);
  ctx.translate(-8,-6);ctx.globalAlpha=0.36*(0.4+0.6*day)+0.06;ctx.fillStyle=ctx.createPattern(C.c,'repeat');ctx.fillRect(-o1/sc-C.N,-o2/sc-C.N,wW/sc+2*C.N,wH/sc+2*C.N);ctx.restore();ctx.globalAlpha=1;}
 // day/night grade
 var tt=tod(now),dusk=Math.max(0,1-Math.abs(((tt-0.0+1)%1)-0)*8)+Math.max(0,1-Math.abs(tt-0.5)*8);
 if(night>0.02){ctx.globalCompositeOperation='multiply';ctx.fillStyle='rgba('+Math.round(255-200*night)+','+Math.round(255-185*night)+','+Math.round(255-120*night)+',1)';ctx.fillRect(0,0,wW,wH);ctx.globalCompositeOperation='source-over';}
 if(dusk>0.02){ctx.globalCompositeOperation='soft-light';ctx.fillStyle='rgba(255,140,60,'+(0.45*Math.min(1,dusk))+')';ctx.fillRect(0,0,wW,wH);ctx.globalCompositeOperation='source-over';}
 // Celestial Light glows and city lights at night
 ctx.globalCompositeOperation='lighter';var gs=AC.art.glowSpr;
 for(k=0;k<layers.glow.length;k++){var g=layers.glow[k],pp=0.55+0.45*Math.sin(t*2+g.i);ctx.globalAlpha=Math.min(1,(0.45+0.5*night)*g.s*pp);var sz=60+20*g.s;ctx.drawImage(gs,(g.i%W+.5)*TS-sz/2,(((g.i/W)|0)+.3)*TS-sz/2,sz,sz);}
 if(night>0.25){G.tiles.forEach(function(c,i){if(!c.b||c.b==='road')return;var X=(i%W)*TS,Y=((i/W)|0)*TS;ctx.globalAlpha=(night-0.25)*0.9;ctx.drawImage(gs,X-4,Y-2,40,36);
  ctx.fillStyle='#ffe9a8';for(var q=0;q<3;q++)if(hsh(i,q,5)<0.8)ctx.fillRect(X+9+q*5,Y+14+hsh(i,q,6)*6,1.6,1.6);});}
 for(k=0;k<layers.sparkle.length;k++){var s2=layers.sparkle[k],qv=Math.sin(t*3+hsh(s2,9)*6.28);if(qv<0.8)continue;ctx.globalAlpha=(qv-0.8)*5;AC.art.star(ctx,(s2%W)*TS+8+hsh(s2,10)*16,((s2/W)|0)*TS+6+hsh(s2,11)*10,3,'#fff');}
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 for(k=0;k<layers.idle.length;k++){i=layers.idle[k];ctx.strokeStyle='rgba(255,60,60,'+(0.5+0.4*Math.sin(t*5))+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc((i%W+.5)*TS,(((i/W)|0)+.5)*TS,14,0,7);ctx.stroke();}
 var busy=AC.art.fxStep(ctx,now);
 if(hover!=null&&hover>=0){var hx=(hover%W)*TS,hy=((hover/W)|0)*TS;ctx.strokeStyle=ok===false?'rgba(255,80,80,.95)':ok?'rgba(255,225,130,.95)':'rgba(255,255,255,.6)';ctx.lineWidth=2.5/Math.max(1,V.z);ctx.strokeRect(hx+1.5,hy+1.5,TS-3,TS-3);}
 // screen-space atmosphere vignette
 ctx.setTransform(1,0,0,1,0,0);var vg=ctx.createRadialGradient(cv.width/2,cv.height/2,Math.min(cv.width,cv.height)*0.35,cv.width/2,cv.height/2,Math.max(cv.width,cv.height)*0.75);
 vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(40,70,160,0.35)');ctx.fillStyle=vg;ctx.fillRect(0,0,cv.width,cv.height);
 L.tod=tt;return busy;}

AC.render={focus:focus,setMode:setMode,mode:function(){return V.mode;},toScreen:toScreen,attach:attach,prepare:prepare,draw:draw,toWorld:toWorld,resize:resize,needTerrain:false,
 zoom:function(f){zoomAt(f,cv.width/2,cv.height/2);},fitView:function(){V.z=V.fit;clamp();},view:V,
 wasDrag:function(){return dragged;},moving:function(){return performance.now()-moveT<200;},
 timeLabel:function(){var h=Math.floor(((L.tod||0)*24+6)%24);return (h<10?'0':'')+h+':00';},vnoise:vnoise,mk:mk};
})();
