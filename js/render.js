/* Archangel Cosmos - renderer: settings, zoom/pan/pinch view, terrain lighting (hillshade "normal map"),
   water reflections, clouds, day/night cycle, atmosphere. Plain Canvas 2D, no libraries. */
(function(){
'use strict';
var AC=window.AC, KEY='archangelCosmos.settings';
var S={quality:'auto',music:0.45,sfx:0.7,muted:false,daynight:true};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
function resolve(){var q=S.quality;if(q==='auto')q=(Math.min(screen.width,screen.height)>=700&&!matchMedia('(pointer:coarse)').matches)?'high':'low';S.q=q;S.res=q==='high'?2:1;}
resolve();
AC.settings=S;AC.saveSettings=function(){resolve();try{localStorage.setItem(KEY,JSON.stringify({quality:S.quality,music:S.music,sfx:S.sfx,muted:S.muted,daynight:S.daynight}));}catch(e){}};
function mk(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
var hsh=function(a,b,c){return AC.art.hash(a,b,c);};

/* ---------- view: zoom & pan ---------- */
var cv,WW,WH,V={z:1,ox:0,oy:0,fit:1},dpr=1,ptrs={},drag=null,dragged=false,moveT=0;
function resize(){if(!cv)return;var p=cv.parentElement,w=p.clientWidth||300,h=p.clientHeight||200;dpr=Math.min(window.devicePixelRatio||1,S.q==='high'?2:1.25);
 var old=V.fit;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);cv.style.width=w+'px';cv.style.height=h+'px';
 V.fit=Math.min(cv.width/WW,cv.height/WH);if(!old||V.z<V.fit||V.z===old){V.z=V.fit;V.ox=(cv.width-WW*V.z)/2;V.oy=(cv.height-WH*V.z)/2;}clamp();}
function clamp(){V.z=Math.max(V.fit,Math.min(V.fit*6,V.z));var mw=WW*V.z,mh=WH*V.z;
 V.ox=mw<=cv.width?(cv.width-mw)/2:Math.min(0,Math.max(cv.width-mw,V.ox));V.oy=mh<=cv.height?(cv.height-mh)/2:Math.min(0,Math.max(cv.height-mh,V.oy));moveT=performance.now();}
function zoomAt(f,sx,sy){var wx=(sx-V.ox)/V.z,wy=(sy-V.oy)/V.z;V.z*=f;clamp();V.ox=sx-wx*V.z;V.oy=sy-wy*V.z;clamp();}
function devPt(cx,cy){var r=cv.getBoundingClientRect();return {x:(cx-r.left)*cv.width/r.width,y:(cy-r.top)*cv.height/r.height};}
function attach(c,w,h){cv=c;WW=w;WH=h;resize();addEventListener('resize',resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(c.parentElement);
 c.addEventListener('wheel',function(e){e.preventDefault();if(AC.space&&AC.space.active())return AC.space.wheel(e);var p=devPt(e.clientX,e.clientY);zoomAt(e.deltaY<0?1.15:1/1.15,p.x,p.y);},{passive:false});
 c.addEventListener('pointerdown',function(e){ptrs[e.pointerId]={x:e.clientX,y:e.clientY};dragged=false;drag={x:e.clientX,y:e.clientY,ox:V.ox,oy:V.oy,pd:null};});
 c.addEventListener('pointermove',function(e){if(!ptrs[e.pointerId])return;ptrs[e.pointerId]={x:e.clientX,y:e.clientY};var ids=Object.keys(ptrs);
  if(ids.length===2){var a=ptrs[ids[0]],b=ptrs[ids[1]],d=Math.hypot(a.x-b.x,a.y-b.y),m=devPt((a.x+b.x)/2,(a.y+b.y)/2);
   if(drag.pd){zoomAt(d/drag.pd,m.x,m.y);}drag.pd=d;dragged=true;return;}
  if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)dragged=true;
  if(dragged&&!(AC.space&&AC.space.active())){var k=cv.width/cv.getBoundingClientRect().width;V.ox=drag.ox+dx*k;V.oy=drag.oy+dy*k;clamp();}});
 function up(e){delete ptrs[e.pointerId];if(!Object.keys(ptrs).length)drag=null;else if(drag)drag.pd=null;}
 c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);c.addEventListener('pointerleave',up);}
function toWorld(cx,cy){var p=devPt(cx,cy);return {x:(p.x-V.ox)/V.z,y:(p.y-V.oy)/V.z};}

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
 sx.putImageData(img,0,0);
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
 ctx.setTransform(V.z,0,0,V.z,V.ox,V.oy);
 // atmosphere glow around the world
 ctx.shadowColor='rgba(120,180,255,.8)';ctx.shadowBlur=40*V.z;ctx.fillStyle='#123a86';ctx.fillRect(0,0,wW,wH);ctx.shadowBlur=0;
 ctx.drawImage(layers.terrain,0,0,wW,wH);
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
 ctx.drawImage(layers.build,0,0,wW,wH);
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
 if(hover!=null&&hover>=0){var hx=(hover%W)*TS,hy=((hover/W)|0)*TS;ctx.strokeStyle=ok===false?'rgba(255,80,80,.95)':ok?'rgba(255,225,130,.95)':'rgba(255,255,255,.6)';ctx.lineWidth=2/Math.max(1,V.z/V.fit);ctx.strokeRect(hx+1.5,hy+1.5,TS-3,TS-3);}
 // screen-space atmosphere vignette
 ctx.setTransform(1,0,0,1,0,0);var vg=ctx.createRadialGradient(cv.width/2,cv.height/2,Math.min(cv.width,cv.height)*0.35,cv.width/2,cv.height/2,Math.max(cv.width,cv.height)*0.75);
 vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(40,70,160,0.35)');ctx.fillStyle=vg;ctx.fillRect(0,0,cv.width,cv.height);
 L.tod=tt;return busy;}

AC.render={attach:attach,prepare:prepare,draw:draw,toWorld:toWorld,resize:resize,needTerrain:false,
 zoom:function(f){zoomAt(f,cv.width/2,cv.height/2);},fitView:function(){V.z=V.fit;clamp();},view:V,
 wasDrag:function(){return dragged;},moving:function(){return performance.now()-moveT<200;},
 timeLabel:function(){var h=Math.floor(((L.tod||0)*24+6)%24);return (h<10?'0':'')+h+':00';},vnoise:vnoise,mk:mk};
})();
