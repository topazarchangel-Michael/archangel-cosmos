/* Archangel Cosmos - procedural art: terrain, building sprites, animated effects, icons. No external assets. */
(function(){
'use strict';
var AC=window.AC, TS=32;
var GOLD='#e8c25a',GOLD_D='#a77d22',MARBLE='#f6f2e6',MARBLE_D='#cfc6ae',BLUE='#5d9cff',BLUE_D='#2b5fb8',GLASS='#a8e0ff';
function hsh(x,y,k){var n=(x*374761393+y*668265263+(k||0)*1442695041)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
function mk(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}

/* ---------- terrain ---------- */
var TCOL={ocean:['#2a62b8','#123274'],shallow:['#4aa3e0','#2a73c0'],plains:['#97d06c','#5f9a42'],forest:['#4a9a4e','#25622d'],
 desert:['#f5e2a0','#d2b066'],mountain:['#aea294','#6a6054'],arctic:['#ffffff','#c9def0'],volcanic:['#74403a','#341816'],crystal:['#d2b8ff','#8a62d8']};
var ORDER=['plains','desert','forest','arctic','crystal','volcanic','mountain'];
function isWater(t){return t==='ocean'||t==='shallow';}
function terrain(G,W,H){
 var c=mk(W*TS,H*TS),x=c.getContext('2d'),t=G.tiles;
 // 1. smooth water depth: tiny map upscaled with smoothing
 var s=mk(W,H),sx=s.getContext('2d');
 for(var i=0;i<W*H;i++){sx.fillStyle=t[i].t==='ocean'?'#123a86':t[i].t==='shallow'?'#2f80cc':'#4fb4e8';sx.fillRect(i%W,(i/W)|0,1,1);}
 x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(s,0,0,W*TS,H*TS);
 function circ(i,r,fill){var cx=(i%W+0.5)*TS,cy=(((i/W)|0)+0.5)*TS;x.fillStyle=fill;x.beginPath();x.arc(cx,cy,r,0,6.2832);x.fill();}
 var coast=[];for(i=0;i<W*H;i++)if(!isWater(t[i].t)){var xi=i%W,yi=(i/W)|0;
  for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){var nx=xi+dx,ny=yi+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&isWater(t[ny*W+nx].t)){coast.push(i);dy=dx=2;}}}
 // 2. foam halo, 3. beach, 4. land by priority as overlapping discs = organic borders
 coast.forEach(function(i){circ(i,TS*1.0,'rgba(220,245,255,0.35)');});
 coast.forEach(function(i){circ(i,TS*0.86,'#ecd9a0');});
 ORDER.forEach(function(k){for(var i=0;i<W*H;i++)if(t[i].t===k){var cx=(i%W+0.5)*TS,cy=(((i/W)|0)+0.5)*TS,g=x.createRadialGradient(cx-8,cy-8,2,cx,cy,TS*0.8);
  g.addColorStop(0,TCOL[k][0]);g.addColorStop(1,TCOL[k][1]);x.fillStyle=g;x.beginPath();x.arc(cx,cy,TS*(coast.indexOf(i)>=0?0.74:0.78),0,6.2832);x.fill();}});
 // 5. noise texture
 var n=mk(64,64),nx2=n.getContext('2d');for(i=0;i<900;i++){nx2.fillStyle=hsh(i,1)<0.5?'rgba(255,255,255,.10)':'rgba(0,0,0,.10)';nx2.fillRect(hsh(i,2)*64,hsh(i,3)*64,1+hsh(i,4)*2,1+hsh(i,4)*2);}
 x.fillStyle=x.createPattern(n,'repeat');x.fillRect(0,0,c.width,c.height);
 // 6. details
 for(i=0;i<W*H;i++)detail(x,t[i],(i%W)*TS,((i/W)|0)*TS,i);
 return c;}
function detail(x,c,X,Y,i){var r=function(k){return hsh(i,k,7);};
 switch(c.t){
 case 'plains':for(var k=0;k<5;k++){var px=X+4+r(k)*24,py=Y+6+r(k+9)*22;x.strokeStyle='rgba(40,90,30,.55)';x.lineWidth=1;x.beginPath();x.moveTo(px,py);x.lineTo(px-1.5,py-4);x.moveTo(px,py);x.lineTo(px+1.5,py-4);x.stroke();}
  if(r(20)<0.35){x.fillStyle=r(21)<0.5?'#fff6c8':'#ffd76a';x.beginPath();x.arc(X+6+r(22)*20,Y+6+r(23)*20,1.4,0,7);x.fill();}break;
 case 'forest':for(k=0;k<4;k++){var tx=X+7+r(k)*18,ty=Y+9+r(k+5)*16,rr=4+r(k+8)*2.5;
  x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.ellipse(tx+2,ty+rr*0.8,rr,rr*0.45,0,0,7);x.fill();
  var g=x.createRadialGradient(tx-rr/3,ty-rr/3,1,tx,ty,rr);g.addColorStop(0,'#7cc86a');g.addColorStop(1,'#1d5226');x.fillStyle=g;x.beginPath();x.arc(tx,ty,rr,0,7);x.fill();}break;
 case 'desert':x.lineWidth=1.2;for(k=0;k<2;k++){var dy=Y+10+k*11+r(k)*4;x.strokeStyle='rgba(255,250,220,.7)';x.beginPath();x.moveTo(X+3,dy);x.quadraticCurveTo(X+16,dy-6,X+29,dy);x.stroke();
  x.strokeStyle='rgba(160,120,50,.45)';x.beginPath();x.moveTo(X+5,dy+2);x.quadraticCurveTo(X+16,dy-3,X+27,dy+2);x.stroke();}break;
 case 'mountain':{var mx=X+16+(r(1)-.5)*6,top=Y+3+r(2)*4;
  x.fillStyle='#8c8274';x.beginPath();x.moveTo(X+2,Y+29);x.lineTo(mx,top);x.lineTo(X+30,Y+29);x.fill();
  x.fillStyle='#5c5348';x.beginPath();x.moveTo(mx,top);x.lineTo(X+30,Y+29);x.lineTo(mx+2,Y+29);x.fill();
  x.fillStyle='#fbfdff';x.beginPath();x.moveTo(mx,top);x.lineTo(mx-5,top+8);x.lineTo(mx-1,top+6);x.lineTo(mx+2,top+9);x.lineTo(mx+5,top+7);x.fill();
  if(c.dep){for(k=0;k<4;k++){var ox=X+7+r(k+30)*16,oy=Y+18+r(k+40)*8;x.fillStyle='#3b2a1c';x.beginPath();x.arc(ox,oy,2.4,0,7);x.fill();x.fillStyle='#ffcf7a';x.fillRect(ox-1,oy-1.5,1.2,1.2);}}}break;
 case 'arctic':x.strokeStyle='rgba(120,170,220,.55)';x.lineWidth=1;x.beginPath();x.moveTo(X+4+r(1)*8,Y+6);x.lineTo(X+14,Y+16);x.lineTo(X+10+r(2)*14,Y+28);x.stroke();break;
 case 'volcanic':x.strokeStyle='#ff7a2a';x.shadowColor='#ff5500';x.shadowBlur=4;x.lineWidth=1.4;x.beginPath();x.moveTo(X+3,Y+8+r(1)*10);x.lineTo(X+13,Y+15);x.lineTo(X+18,Y+9+r(2)*8);x.lineTo(X+29,Y+20);x.stroke();x.shadowBlur=0;break;
 case 'crystal':for(k=0;k<3;k++){var cx=X+7+k*8+r(k)*3,cb=Y+26,h=10+r(k+3)*9;var g2=x.createLinearGradient(cx,cb-h,cx,cb);g2.addColorStop(0,'#fff');g2.addColorStop(1,'#7a4ee0');
  x.fillStyle=g2;x.beginPath();x.moveTo(cx-3,cb);x.lineTo(cx-2.5,cb-h+3);x.lineTo(cx,cb-h);x.lineTo(cx+2.5,cb-h+3);x.lineTo(cx+3,cb);x.fill();}break;
 case 'ocean':if(r(1)<0.3){x.strokeStyle='rgba(255,255,255,.18)';x.lineWidth=1;x.beginPath();x.arc(X+16,Y+20,6,3.6,5.8);x.stroke();}break;
 }}

/* ---------- building sprites (drawn once, cached) ---------- */
function grad(x,y0,y1,a,b){var g=x.createLinearGradient(0,y0,0,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
function shadow(x,w){x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.ellipse(17,28,w||12,3.5,0,0,7);x.fill();}
function box(x,X,Y,w,h,a,b,line){x.fillStyle=grad(x,Y,Y+h,a||MARBLE,b||MARBLE_D);x.fillRect(X,Y,w,h);x.strokeStyle=line||'rgba(120,95,40,.8)';x.lineWidth=0.8;x.strokeRect(X+.4,Y+.4,w-.8,h-.8);}
function dome(x,cx,cy,r,a,b){var g=x.createRadialGradient(cx-r/3,cy-r/2,1,cx,cy,r);g.addColorStop(0,a);g.addColorStop(1,b);x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,Math.PI,0);x.closePath();x.fill();}
function tri(x,x0,y0,x1,y1,x2,y2,f){x.fillStyle=f;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.lineTo(x2,y2);x.closePath();x.fill();}
function cols(x,X,Y,w,h,n){x.fillStyle='#fffdf5';for(var i=0;i<n;i++){x.fillRect(X+i*(w/(n-1))-0.8,Y,1.6,h);}}
function win(x,X,Y,w,h,c){x.fillStyle=c||GLASS;x.fillRect(X,Y,w,h);}
function star(x,cx,cy,r,c){x.fillStyle=c||'#fff6c0';x.beginPath();for(var i=0;i<8;i++){var a=i*Math.PI/4,rr=i%2?r*0.4:r;x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}x.fill();}
function gear(x,cx,cy,r){x.fillStyle=GOLD;x.beginPath();for(var i=0;i<16;i++){var a=i*Math.PI/8,rr=i%2?r:r*0.75;x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}x.fill();x.fillStyle=GOLD_D;x.beginPath();x.arc(cx,cy,r*0.3,0,7);x.fill();}
var SPR={
 capital:function(x){shadow(x,14);box(x,5,17,22,10);cols(x,7,18,18,8,5);box(x,4,15,24,3,GOLD,GOLD_D);dome(x,16,15,7,'#fff3c0',GOLD_D);x.fillStyle=GOLD;x.fillRect(15.3,3,1.4,6);star(x,16,3,3);},
 admin:function(x){shadow(x);box(x,7,10,18,17);for(var r=0;r<3;r++)for(var c=0;c<3;c++)win(x,9.5+c*5,12.5+r*4.5,3,2.5);box(x,6,8,20,2.5,GOLD,GOLD_D);x.fillStyle=GOLD_D;x.fillRect(24,1,0.9,8);x.fillStyle=BLUE;x.fillRect(25,1,5,3);},
 embassy:function(x){shadow(x,13);box(x,6,16,20,11);cols(x,8,17,16,9,4);dome(x,16,16,8,'#cfe4ff',BLUE_D);x.fillStyle=GOLD_D;x.fillRect(4,6,0.9,10);x.fillRect(27,6,0.9,10);x.fillStyle='#c39cff';x.fillRect(5,6,4,3);x.fillStyle=GOLD;x.fillRect(28,6,4,3);},
 home:function(x){shadow(x,10);box(x,9,16,14,11);tri(x,7,17,16,8,25,17,grad(x,8,17,'#8fc0ff',BLUE_D));x.fillStyle=GOLD;x.fillRect(14.5,21,3,6);win(x,10.5,19,2.6,2.6);win(x,19,19,2.6,2.6);},
 apart:function(x){shadow(x,12);box(x,6,8,9,19);box(x,17,4,9,23);for(var r=0;r<5;r++){win(x,8,10+r*3.2,2,1.8);win(x,11.5,10+r*3.2,2,1.8);}for(r=0;r<6;r++){win(x,19,6.5+r*3.2,2,1.8);win(x,22.5,6.5+r*3.2,2,1.8);}x.fillStyle=GOLD;x.fillRect(6,7,9,1.3);x.fillRect(17,3,9,1.3);},
 arcology:function(x){shadow(x,11);x.fillStyle=grad(x,2,27,'#e6f6ff','#4f8ee0');x.beginPath();x.moveTo(8,27);x.lineTo(13,4);x.lineTo(19,4);x.lineTo(24,27);x.fill();x.strokeStyle=GOLD;x.lineWidth=1.2;for(var r=0;r<4;r++){var y=9+r*5;x.beginPath();x.moveTo(12.2-r*1.1,y);x.lineTo(19.8+r*1.1,y);x.stroke();}x.strokeStyle='rgba(255,236,160,.9)';x.beginPath();x.ellipse(16,3,5,1.6,0,0,7);x.stroke();},
 farm:function(x){x.save();x.translate(16,18);x.rotate(-0.12);for(var r=0;r<5;r++){x.fillStyle=r%2?'#e9cf5c':'#7cc24c';x.fillRect(-13,-9+r*3.6,22,3.2);}x.restore();box(x,21,14,8,8,'#fff','#d8d0bc');tri(x,20,15,25,10,30,15,'#5b8fd8');},
 water:function(x){shadow(x);box(x,7,12,18,15);x.fillStyle=grad(x,8,14,'#bfe8ff','#3c8fe0');x.beginPath();x.ellipse(16,12,9,3.2,0,0,7);x.fill();x.fillStyle=BLUE;x.beginPath();x.moveTo(16,15.5);x.quadraticCurveTo(20,21,16,23);x.quadraticCurveTo(12,21,16,15.5);x.fill();x.fillStyle=GOLD;x.fillRect(7,18,18,1);},
 power:function(x){shadow(x,13);box(x,4,18,12,9);for(var i=0;i<2;i++){var cx=19+i*7;x.fillStyle=grad(x,8,27,'#ffffff','#bdb5a0');x.beginPath();x.moveTo(cx-4,27);x.quadraticCurveTo(cx-1.6,17,cx-3,9);x.lineTo(cx+3,9);x.quadraticCurveTo(cx+1.6,17,cx+4,27);x.fill();}tri(x,9,19,7,23,10,23,'#ffd23a');tri(x,10,21,8,26,12,21,'#ffd23a');x.fillStyle='rgba(255,255,255,.7)';x.beginPath();x.arc(19,7,2.5,0,7);x.arc(26,5,3,0,7);x.fill();},
 solar:function(x){shadow(x,13);x.fillStyle=GOLD_D;x.fillRect(15,20,2,7);x.save();x.transform(1,0,-0.45,1,0,0);x.fillStyle=GOLD;x.fillRect(10,8,22,13);x.fillStyle=grad(x,9,20,'#9fd2ff','#1d3f9e');x.fillRect(11,9,20,11);x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=0.6;for(var i=1;i<4;i++){x.beginPath();x.moveTo(11+i*5,9);x.lineTo(11+i*5,20);x.stroke();}x.beginPath();x.moveTo(11,14.5);x.lineTo(31,14.5);x.stroke();x.restore();},
 geo:function(x){shadow(x);box(x,8,17,16,10,'#e8e2d4','#9a917e');var g=x.createRadialGradient(16,17,1,16,17,6);g.addColorStop(0,'#fff2a0');g.addColorStop(1,'rgba(255,90,0,0)');x.fillStyle=g;x.beginPath();x.arc(16,17,6,0,7);x.fill();x.fillStyle='rgba(255,255,255,.75)';x.beginPath();x.arc(15,9,3,0,7);x.arc(18,5,3.5,0,7);x.arc(13,4,2.5,0,7);x.fill();},
 mine:function(x){shadow(x,13);x.fillStyle=grad(x,8,27,'#b5aa9a','#6d6355');x.beginPath();x.moveTo(3,27);x.lineTo(12,9);x.lineTo(22,7);x.lineTo(29,27);x.fill();x.fillStyle='#1d1610';x.beginPath();x.arc(16,23,5.5,Math.PI,0);x.lineTo(21.5,27);x.lineTo(10.5,27);x.fill();x.strokeStyle=GOLD;x.lineWidth=1.3;x.beginPath();x.arc(16,23,6.2,Math.PI,0);x.stroke();x.fillStyle=GOLD;x.fillRect(22,23,6,3);x.fillStyle='#333';x.beginPath();x.arc(23.5,26.5,1,0,7);x.arc(26.5,26.5,1,0,7);x.fill();},
 timine:function(x){shadow(x,12);x.strokeStyle='#7f9ab8';x.lineWidth=1.4;x.beginPath();x.moveTo(9,27);x.lineTo(16,4);x.lineTo(23,27);x.moveTo(11,20);x.lineTo(21,20);x.moveTo(13,13);x.lineTo(19,13);x.stroke();x.fillStyle=GOLD;x.fillRect(14.5,3,3,3);x.fillStyle=grad(x,20,28,'#e0f4ff','#5f8fc0');x.beginPath();x.moveTo(26,20);x.lineTo(29,24);x.lineTo(26,28);x.lineTo(23,24);x.fill();},
 crystal:function(x){shadow(x,12);x.strokeStyle=GOLD;x.lineWidth=1.5;x.strokeRect(7,9,18,18);var g=x.createLinearGradient(16,6,16,26);g.addColorStop(0,'#fff');g.addColorStop(1,'#8a52f0');x.fillStyle=g;x.beginPath();x.moveTo(16,5);x.lineTo(21,14);x.lineTo(16,26);x.lineTo(11,14);x.fill();},
 refinery:function(x){shadow(x,13);box(x,5,15,18,12,'#ece5d4','#a99f88');x.fillStyle='#8b8170';x.fillRect(22,5,4,22);x.fillStyle=GOLD;x.fillRect(21.5,5,5,1.5);var g=x.createRadialGradient(13,22,1,13,22,5);g.addColorStop(0,'#ffe68a');g.addColorStop(1,'#ff5a00');x.fillStyle=g;x.fillRect(10,19,6,6);x.fillStyle='rgba(220,220,230,.75)';x.beginPath();x.arc(25,3,2.5,0,7);x.arc(28,1,2,0,7);x.fill();},
 factory:function(x){shadow(x,14);x.fillStyle=grad(x,10,27,MARBLE,MARBLE_D);x.beginPath();x.moveTo(4,27);x.lineTo(4,14);for(var i=0;i<3;i++){x.lineTo(4+i*8,10);x.lineTo(12+i*8,14);}x.lineTo(28,27);x.fill();for(i=0;i<3;i++)win(x,5+i*8,11.5,2,2.5,BLUE);gear(x,16,21,5);},
 market:function(x){shadow(x,14);for(var i=0;i<2;i++){var X=4+i*13;box(x,X,17,11,10,'#fff','#d9cfb6');for(var s=0;s<4;s++){x.fillStyle=s%2?'#fff':GOLD;x.fillRect(X-1+s*3.2,12,3.2,5);}}x.fillStyle=GOLD;x.beginPath();x.arc(10,23,2,0,7);x.arc(23,23,2,0,7);x.fill();},
 lab:function(x){shadow(x,12);box(x,7,17,18,10);dome(x,16,17,8,'#ffffff','#a8b8d0');x.fillStyle=BLUE_D;x.fillRect(15,9.5,2.5,7);x.strokeStyle=GOLD;x.lineWidth=1.6;x.beginPath();x.moveTo(17,12);x.lineTo(24,6);x.stroke();win(x,10,20,3,3);win(x,19,20,3,3);},
 academy:function(x){shadow(x,14);box(x,5,15,22,12);cols(x,7,16,18,10,6);tri(x,4,15,16,7,28,15,grad(x,7,15,'#fff6d0',GOLD));x.fillStyle=GOLD;x.fillRect(4,26,24,1.5);star(x,16,11.5,2,'#fff');},
 qlab:function(x){shadow(x,11);box(x,8,21,16,6);var g=x.createRadialGradient(14,10,1,16,13,8);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#7fe8ff');g.addColorStop(1,'#1e60c0');x.fillStyle=g;x.beginPath();x.arc(16,13,7,0,7);x.fill();x.strokeStyle=GOLD;x.lineWidth=1;x.beginPath();x.ellipse(16,13,11,3,0.4,0,7);x.stroke();x.beginPath();x.ellipse(16,13,11,3,-0.4,0,7);x.stroke();},
 park:function(x){x.fillStyle='rgba(60,140,60,.6)';x.beginPath();x.arc(16,17,12,0,7);x.fill();[[9,12],[23,12],[10,23],[23,23]].forEach(function(p){var g=x.createRadialGradient(p[0]-1,p[1]-1,0,p[0],p[1],4);g.addColorStop(0,'#9fe07a');g.addColorStop(1,'#2a7030');x.fillStyle=g;x.beginPath();x.arc(p[0],p[1],4,0,7);x.fill();});x.fillStyle=MARBLE;x.beginPath();x.arc(16,17,4.5,0,7);x.fill();x.fillStyle='#6fc0ff';x.beginPath();x.arc(16,17,3,0,7);x.fill();x.fillStyle='#fff';x.fillRect(15.4,11,1.2,6);},
 hospital:function(x){shadow(x,13);box(x,6,12,20,15);x.fillStyle=BLUE;x.fillRect(14,15,4,10);x.fillRect(11,18,10,4);x.fillStyle=GOLD;x.beginPath();x.moveTo(16,10);x.quadraticCurveTo(8,4,4,9);x.quadraticCurveTo(10,8,16,12);x.quadraticCurveTo(22,8,28,9);x.quadraticCurveTo(24,4,16,10);x.fill();},
 cathedral:function(x){shadow(x,13);box(x,7,15,18,12);tri(x,13,15,16,1,19,15,grad(x,1,15,'#ffffff',GOLD));tri(x,6,15,8.5,8,11,15,MARBLE_D);tri(x,21,15,23.5,8,26,15,MARBLE_D);x.fillStyle=grad(x,17,25,'#bfe0ff','#3a62d8');x.beginPath();x.arc(16,20,3,Math.PI,0);x.lineTo(19,26);x.lineTo(13,26);x.fill();star(x,16,1.5,2.5);},
 road:null,
 spaceport:function(x){x.fillStyle=grad(x,14,30,'#d8dde8','#8890a4');x.beginPath();x.ellipse(16,24,13,5,0,0,7);x.fill();x.strokeStyle=GOLD;x.lineWidth=1;x.beginPath();x.ellipse(16,24,10,3.6,0,0,7);x.stroke();x.fillStyle=grad(x,2,24,'#ffffff','#c8ccd8');x.beginPath();x.moveTo(16,1);x.quadraticCurveTo(21,8,20,22);x.lineTo(12,22);x.quadraticCurveTo(11,8,16,1);x.fill();x.fillStyle=BLUE;x.beginPath();x.arc(16,10,2,0,7);x.fill();tri(x,12,16,8,23,12,22,GOLD);tri(x,20,16,24,23,20,22,GOLD);},
 outpost:function(x){shadow(x,10);tri(x,7,26,15,10,23,26,grad(x,10,26,'#f2deb0','#b08a4e'));tri(x,13,26,15,19,17,26,'#4a3420');x.fillStyle=GOLD_D;x.fillRect(22,6,0.9,20);x.fillStyle=BLUE;x.fillRect(23,6,6,3.5);x.fillStyle='#ffd76a';x.beginPath();x.arc(26,20,1.8,0,7);x.fill();}
};
var cache={};
function sprite(id,scale){var key=id+'@'+(scale||1);if(cache[key])return cache[key];var s=scale||1,c=mk(TS*s,TS*s),x=c.getContext('2d');x.scale(s,s);if(SPR[id])SPR[id](x);cache[key]=c;return c;}
function ruin(x,X,Y){x.fillStyle='rgba(0,0,0,.3)';x.beginPath();x.ellipse(X+16,Y+26,11,3,0,0,7);x.fill();x.fillStyle=grad(x,Y+10,Y+27,'#ece3c8','#9f9478');x.fillRect(X+7,Y+14,3,12);x.fillRect(X+14,Y+9,3,17);x.fillRect(X+21,Y+18,3,8);x.fillRect(X+6,Y+24,20,3);x.fillStyle=GOLD;x.fillRect(X+13,Y+8,5,1.6);}
function buildings(G,W,H){var c=mk(W*TS,H*TS),x=c.getContext('2d'),t=G.tiles;
 // roads: stone paths linking neighbours
 for(var i=0;i<W*H;i++)if(t[i].b==='road'){var X=(i%W)*TS,Y=((i/W)|0)*TS,cx=X+16,cy=Y+16,xi=i%W,yi=(i/W)|0;
  var links=[[1,0],[-1,0],[0,1],[0,-1]].filter(function(d){var nx=xi+d[0],ny=yi+d[1];return nx>=0&&ny>=0&&nx<W&&ny<H&&t[ny*W+nx].b;});
  x.lineCap='round';[['#8a7a5a',9],['#d9cfb4',7]].forEach(function(st){x.strokeStyle=st[0];x.lineWidth=st[1];x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+0.01,cy);links.forEach(function(d){x.moveTo(cx,cy);x.lineTo(cx+d[0]*16,cy+d[1]*16);});x.stroke();});
  x.strokeStyle='rgba(232,194,90,.8)';x.lineWidth=1;x.setLineDash([2,3]);x.beginPath();links.forEach(function(d){x.moveTo(cx,cy);x.lineTo(cx+d[0]*16,cy+d[1]*16);});x.stroke();x.setLineDash([]);}
 for(i=0;i<W*H;i++){var X2=(i%W)*TS,Y2=((i/W)|0)*TS;if(t[i].ruin&&!t[i].b)ruin(x,X2,Y2);if(t[i].b&&t[i].b!=='road')x.drawImage(sprite(t[i].b),X2,Y2);}
 return c;}

/* ---------- animated layer ---------- */
var GLOW={capital:1,embassy:.7,academy:.6,park:.4,cathedral:1.2,arcology:.8,qlab:.9,spaceport:.5};
var glowSpr=(function(){var c=mk(96,96),x=c.getContext('2d'),g=x.createRadialGradient(48,48,2,48,48,48);g.addColorStop(0,'rgba(255,240,170,.85)');g.addColorStop(.4,'rgba(255,215,106,.35)');g.addColorStop(1,'rgba(255,215,106,0)');x.fillStyle=g;x.fillRect(0,0,96,96);return c;})();
var fx=[];
function place(i,W){fx.push({x:(i%W+.5)*TS,y:(((i/W)|0)+.5)*TS,t0:performance.now(),p:Array.from({length:14},function(_,k){return {a:k/14*6.283+Math.random()*.3,v:14+Math.random()*16};})});}
function frame(ctx,G,W,H,layers,now,hover,hoverOk){
 ctx.drawImage(layers.terrain,0,0);
 // water shimmer
 var t=now/1000;ctx.fillStyle='#ffffff';
 for(var k=0;k<layers.water.length;k+=2){var i=layers.water[k],ph=hsh(i,5)*6.28,a=Math.sin(t*1.6+ph);if(a<0.55)continue;
  ctx.globalAlpha=(a-0.55)*0.9;ctx.fillRect((i%W)*TS+6+hsh(i,6)*18,((i/W)|0)*TS+8+hsh(i,8)*16+Math.sin(t+ph)*2,6,1.2);}
 ctx.globalAlpha=1;
 // volcanic / crystal sparkle
 ctx.drawImage(layers.build,0,0);
 // Celestial Light glow
 ctx.globalCompositeOperation='lighter';
 for(k=0;k<layers.glow.length;k++){var g=layers.glow[k],p=0.55+0.45*Math.sin(t*2+g.i);ctx.globalAlpha=0.5*g.s*p;var sz=60+20*g.s;ctx.drawImage(glowSpr,(g.i%W+.5)*TS-sz/2,(((g.i/W)|0)+.3)*TS-sz/2,sz,sz);}
 for(k=0;k<layers.sparkle.length;k++){var s=layers.sparkle[k],q=Math.sin(t*3+hsh(s,9)*6.28);if(q<0.8)continue;ctx.globalAlpha=(q-0.8)*5;star(ctx,(s%W)*TS+8+hsh(s,10)*16,((s/W)|0)*TS+6+hsh(s,11)*10,3,'#fff');}
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 // idle warning
 for(k=0;k<layers.idle.length;k++){i=layers.idle[k];ctx.strokeStyle='rgba(255,60,60,'+(0.5+0.4*Math.sin(t*5))+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc((i%W+.5)*TS,(((i/W)|0)+.5)*TS,14,0,7);ctx.stroke();}
 // placement effects
 fx=fx.filter(function(f){var e=(now-f.t0)/900;if(e>1)return false;ctx.globalAlpha=1-e;ctx.strokeStyle='#ffe9a0';ctx.lineWidth=3*(1-e)+0.5;ctx.beginPath();ctx.arc(f.x,f.y,6+e*26,0,7);ctx.stroke();
  f.p.forEach(function(p){star(ctx,f.x+Math.cos(p.a)*p.v*e*1.6,f.y+Math.sin(p.a)*p.v*e*1.6-e*10,2.5*(1-e)+0.5,'#fff6c0');});ctx.globalAlpha=1;return true;});
 if(hover!=null&&hover>=0){var hx=(hover%W)*TS,hy=((hover/W)|0)*TS;ctx.strokeStyle=hoverOk===false?'rgba(255,80,80,.95)':hoverOk?'rgba(255,225,130,.95)':'rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=8;ctx.strokeRect(hx+1.5,hy+1.5,TS-3,TS-3);ctx.shadowBlur=0;}
 return fx.length>0;}
function layersFor(G,W,H,terr){var L={terrain:terr,build:buildings(G,W,H),water:[],glow:[],sparkle:[],idle:[]};
 G.tiles.forEach(function(c,i){if(isWater(c.t)&&hsh(i,3)<0.6)L.water.push(i);if(c.b&&GLOW[c.b])L.glow.push({i:i,s:GLOW[c.b]});if(!c.b&&(c.t==='crystal'||(c.t==='arctic'&&hsh(i,4)<.3)))L.sparkle.push(i);if(c.b&&c.idle)L.idle.push(i);});return L;}

/* ---------- icons (inline SVG) ---------- */
function svg(body,vb){return '<svg class="ic" viewBox="'+(vb||'0 0 24 24')+'" aria-hidden="true">'+body+'</svg>';}
var ICONS={
 credits:svg('<circle cx="12" cy="12" r="9" fill="#e8c25a" stroke="#8a6416" stroke-width="1.5"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#fff3c0" stroke-width="1.5"/>'),
 food:svg('<path d="M12 21V8" stroke="#c9a53a" stroke-width="1.8"/><g fill="#f0d264"><ellipse cx="9" cy="10" rx="2" ry="3.4" transform="rotate(-25 9 10)"/><ellipse cx="15" cy="10" rx="2" ry="3.4" transform="rotate(25 15 10)"/><ellipse cx="9" cy="15" rx="2" ry="3.4" transform="rotate(-25 9 15)"/><ellipse cx="15" cy="15" rx="2" ry="3.4" transform="rotate(25 15 15)"/><ellipse cx="12" cy="5" rx="2" ry="3.4"/></g>'),
 water:svg('<path d="M12 3C8 9 6 12 6 15a6 6 0 0 0 12 0c0-3-2-6-6-12z" fill="#5db4ff" stroke="#2b6fc0" stroke-width="1.2"/><path d="M9 15a3 3 0 0 0 3 3" stroke="#fff" stroke-width="1.4" fill="none"/>'),
 energy:svg('<path d="M13 2L5 14h6l-1 8 8-12h-6z" fill="#ffd23a" stroke="#b07a00" stroke-width="1.2"/>'),
 iron:svg('<path d="M4 16l4-8 8-2 4 8-6 6z" fill="#8c8274" stroke="#4a4036" stroke-width="1.2"/><circle cx="10" cy="12" r="1.5" fill="#ffcf7a"/>'),
 metal:svg('<path d="M3 15l5-5h13l-5 5z" fill="#d8dde8"/><path d="M3 15h13v4H3z" fill="#9aa2b4"/><path d="M16 15l5-5v4l-5 5z" fill="#6c7488"/>'),
 goods:svg('<g transform="translate(12 12)"><path fill="#e8c25a" stroke="#8a6416" d="M-2-9h4l1 3 3-1 2 3-2 2 1 3-3 1v-.1l-1 3h-4l-1-3-3 1-2-3 2-2-1-3 3-1z"/><circle r="3" fill="#8a6416"/></g>'),
 titanium:svg('<path d="M12 2l7 10-7 10-7-10z" fill="#bfe0ff" stroke="#4f7fb0" stroke-width="1.2"/><path d="M12 2v20M5 12h14" stroke="#fff" stroke-width=".8" opacity=".7"/>'),
 crystal:svg('<path d="M8 21l-2-9 3-7 3 7zM16 21l2-9-3-6-3 6zM12 21l-2-8 2-10 2 10z" fill="#b48cff" stroke="#6a3fd0" stroke-width=".9"/>'),
 research:svg('<circle cx="12" cy="12" r="2.4" fill="#7fe8ff"/><g fill="none" stroke="#7fe8ff" stroke-width="1.3"><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-60 12 12)"/></g>'),
 light:svg('<circle cx="12" cy="12" r="10" fill="#ffe9a0" opacity=".25"/><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="#fff3c0" stroke="#e8c25a"/>'),
 pop:svg('<circle cx="12" cy="8" r="3.4" fill="#fff6dc"/><path d="M6 20c0-4 2.6-6.5 6-6.5s6 2.5 6 6.5z" fill="#fff6dc"/><path d="M2 9c3 0 6 2 7.5 5M22 9c-3 0-6 2-7.5 5" stroke="#e8c25a" stroke-width="1.6" fill="none"/><ellipse cx="12" cy="3.6" rx="3.6" ry="1" fill="none" stroke="#ffd76a"/>'),
 happy:svg('<circle cx="12" cy="12" r="9" fill="#ffd76a" stroke="#a77d22"/><circle cx="9" cy="10" r="1.2" fill="#5a3d00"/><circle cx="15" cy="10" r="1.2" fill="#5a3d00"/><path d="M8 14q4 4 8 0" stroke="#5a3d00" stroke-width="1.4" fill="none"/>'),
 day:svg('<circle cx="12" cy="12" r="5" fill="#ffe08a"/><g stroke="#ffe08a" stroke-width="1.6"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></g>')
};
var EMBLEM='<svg viewBox="0 0 200 120" class="emblem" aria-hidden="true"><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#e8c25a"/></linearGradient><radialGradient id="hg"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>'+
 '<circle cx="100" cy="62" r="46" fill="url(#hg)"/><ellipse cx="100" cy="22" rx="20" ry="5" fill="none" stroke="#ffd76a" stroke-width="3"/>'+
 '<path d="M96 60C70 30 40 28 8 38c22 4 34 10 44 18-16-2-28 0-38 6 20 0 34 4 44 10-12 0-20 3-26 8 24-2 46 0 64-8z" fill="url(#wg)"/>'+
 '<path d="M104 60c26-30 56-32 88-22-22 4-34 10-44 18 16-2 28 0 38 6-20 0-34 4-44 10 12 0 20 3 26 8-24-2-46 0-64-8z" fill="url(#wg)"/>'+
 '<circle cx="100" cy="64" r="15" fill="#3b6fd8" stroke="#ffd76a" stroke-width="3"/><path d="M100 52l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#fff"/></svg>';

AC.art={TS:TS,terrain:terrain,layersFor:layersFor,frame:frame,place:place,sprite:sprite,ICONS:ICONS,EMBLEM:EMBLEM,star:star,hash:hsh};
})();
