/* Archangel Cosmos - true 3D Elysia view (WebGL via vendored three.js r158, MIT licence in js/vendor/three-LICENSE.txt).
   Loaded on demand. Falls back to the 2.5D canvas view when WebGL is unavailable or 3D is switched off. */
(function(){
'use strict';
var AC=window.AC,S=AC.settings,T=null,on=false,loading=false,failed=false;
var renderer,scene,camera,sun,hemi,terrainMesh,water,waterGeo,bgroup,roadGroup,treeMesh,crystalMesh,people,hoverMesh,cvs,heights,W,H,G0=null,built={},spawn={},lastSig='';
var cam={tx:0,tz:0,dist:14,yaw:0.6,pitch:0.85},ptr={},drag=null,dragged=false,hover=null;
function webgl(){try{var c=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl')));}catch(e){return false;}}
function wanted(){var m=S.r3d||'auto';if(m==='off'||!webgl())return false;if(m==='on')return true;return S.q==='high';}
function load(cb){if(window.THREE)return cb();if(loading)return;loading=true;var s=document.createElement('script');s.src='js/vendor/three.min.js';s.onload=function(){loading=false;cb();};s.onerror=function(){loading=false;failed=true;};document.head.appendChild(s);}
var HT={ocean:-0.7,shallow:-0.25,plains:0.12,forest:0.2,desert:0.16,mountain:1.5,arctic:0.35,volcanic:0.55,crystal:0.22};
var COL={ocean:0x1d4a8a,shallow:0x3a8ac8,plains:0x7cbf55,forest:0x3f8a45,desert:0xe6cf8a,mountain:0x8d8478,arctic:0xf2f7fb,volcanic:0x5a2e2a,crystal:0xb69af0};
function hsh(a,b,c){return AC.art.hash(a,b,c);}
function tileH(G,x,y){x=Math.max(0,Math.min(W-1,x));y=Math.max(0,Math.min(H-1,y));var c=G.tiles[y*W+x];var h=HT[c.t];if(c.t==='mountain')h+=hsh(x,y,31)*1.3;return h;}
function hAt(G,fx,fy){var x0=Math.floor(fx-0.5),y0=Math.floor(fy-0.5),tx=fx-0.5-x0,ty=fy-0.5-y0;
 return tileH(G,x0,y0)*(1-tx)*(1-ty)+tileH(G,x0+1,y0)*tx*(1-ty)+tileH(G,x0,y0+1)*(1-tx)*ty+tileH(G,x0+1,y0+1)*tx*ty;}
function surface(G,x,y){var c=G.tiles[y*W+x];var h=hAt(G,x+0.5,y+0.5);return c.b?Math.max(0.05,h):h;}
function init(){T=window.THREE;var wrap=document.getElementById('mapWrap');cvs=document.createElement('canvas');cvs.id='map3d';wrap.insertBefore(cvs,wrap.firstChild.nextSibling);
 renderer=new T.WebGLRenderer({canvas:cvs,antialias:S.q==='high',powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,S.q==='high'?2:1.25));
 renderer.shadowMap.enabled=S.q==='high';renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
 scene=new T.Scene();scene.fog=new T.Fog(0x9fc8ff,30,90);camera=new T.PerspectiveCamera(45,1,0.1,300);
 hemi=new T.HemisphereLight(0xcfe6ff,0x40502a,0.9);scene.add(hemi);
 sun=new T.DirectionalLight(0xfff1d0,2.2);sun.castShadow=true;var sz=S.q==='high'?2048:1024;sun.shadow.mapSize.set(sz,sz);var sc=sun.shadow.camera;sc.left=-30;sc.right=30;sc.top=30;sc.bottom=-30;sc.near=1;sc.far=120;sun.shadow.bias=-0.0008;scene.add(sun);scene.add(sun.target);
 var m=new T.Mesh(new T.RingGeometry(0.42,0.5,4,1,Math.PI/4),new T.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:0.9,depthTest:false}));m.rotation.x=-Math.PI/2;m.renderOrder=9;hoverMesh=m;scene.add(m);
 cvs.addEventListener('pointerdown',function(e){ptr[e.pointerId]={x:e.clientX,y:e.clientY};dragged=false;drag={x:e.clientX,y:e.clientY,b:e.button,pd:null,yaw:cam.yaw,pitch:cam.pitch,tx:cam.tx,tz:cam.tz};cvs.setPointerCapture&&cvs.setPointerCapture(e.pointerId);});
 cvs.addEventListener('pointermove',function(e){if(!ptr[e.pointerId]){var i=pick(e);if(i!==hover){hover=i;if(AC.api.hoverTile)AC.api.hoverTile(i);}return;}ptr[e.pointerId]={x:e.clientX,y:e.clientY};var ids=Object.keys(ptr);
  if(ids.length===2){var a=ptr[ids[0]],b=ptr[ids[1]],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;if(drag.pd){cam.dist=Math.max(4,Math.min(60,cam.dist*drag.pd/d));pan(mx-drag.mx,my-drag.my);}drag.pd=d;drag.mx=mx;drag.my=my;dragged=true;return;}
  var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)dragged=true;if(!dragged)return;
  if(drag.b===2||e.shiftKey||drag.b===1){cam.tx=drag.tx;cam.tz=drag.tz;pan(dx,dy);}else{cam.yaw=drag.yaw-dx*0.006;cam.pitch=Math.max(0.25,Math.min(1.45,drag.pitch+dy*0.005));}});
 function up(e){delete ptr[e.pointerId];if(!Object.keys(ptr).length)drag=null;else if(drag)drag.pd=null;}
 cvs.addEventListener('pointerup',up);cvs.addEventListener('pointercancel',up);cvs.addEventListener('contextmenu',function(e){e.preventDefault();});
 cvs.addEventListener('wheel',function(e){e.preventDefault();cam.dist=Math.max(4,Math.min(60,cam.dist*(e.deltaY<0?0.88:1.14)));},{passive:false});
 cvs.addEventListener('click',function(e){if(dragged)return;var i=pick(e);if(i!=null&&AC.api.tileClick)AC.api.tileClick(i);});
 addEventListener('resize',size);if(window.ResizeObserver)new ResizeObserver(size).observe(wrap);size();}
function pan(dx,dy){var k=cam.dist/600,c=Math.cos(cam.yaw),s=Math.sin(cam.yaw);cam.tx+=-c*dx*k-s*dy*k;cam.tz+=s*dx*k-c*dy*k;cam.tx=Math.max(-W/2,Math.min(W/2,cam.tx));cam.tz=Math.max(-H/2,Math.min(H/2,cam.tz));}
function size(){if(!renderer)return;var p=cvs.parentElement,w=p.clientWidth||300,h=p.clientHeight||200;renderer.setSize(w,h,false);cvs.style.width=w+'px';cvs.style.height=h+'px';camera.aspect=w/h;camera.updateProjectionMatrix();}
var ray=null,ndc=null;
function pick(e){if(!terrainMesh)return null;ray=ray||new T.Raycaster();ndc=ndc||new T.Vector2();var r=cvs.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
 var hit=ray.intersectObject(terrainMesh)[0];if(!hit){var pl=new T.Plane(new T.Vector3(0,1,0),0),pt=new T.Vector3();if(!ray.ray.intersectPlane(pl,pt))return null;hit={point:pt};}
 var x=Math.floor(hit.point.x+W/2),y=Math.floor(hit.point.z+H/2);return (x>=0&&y>=0&&x<W&&y<H)?y*W+x:null;}

/* ---------- materials ---------- */
var MAT={};
function mats(){T=window.THREE;var s=function(c,r,m,e){return new T.MeshStandardMaterial({color:c,roughness:r,metalness:m||0,emissive:e||0x000000});};
 MAT={marble:s(0xf4efe2,0.45),marble2:s(0xd9d0bb,0.55),gold:s(0xe8c25a,0.28,0.85),blue:s(0x5d8fe0,0.45,0.1),glass:s(0xa8e0ff,0.1,0.3,0x000000),dark:s(0x3a3430,0.9),green:s(0x5fb84a,0.8),
  field:s(0xd8c25a,0.9),crop:s(0x6fbf4a,0.9),rock:s(0x8a8070,0.95),lava:s(0xff6a20,0.6,0,0xff4400),purple:s(0xb48cff,0.25,0.2,0x3a1a80),steel:s(0x9ab0c8,0.4,0.7),water:s(0x5db4ff,0.15,0.2),
  trunk:s(0x6a4a2a,0.9),leaf:s(0x3d8f3f,0.8),leaf2:s(0x2f7a38,0.8),road:s(0xd8ccae,0.95),robe:s(0xfbf7ec,0.6)};}

/* ---------- procedural building meshes: [shape, material, sx,sy,sz, x,y,z] in tile units (base at y=0) ---------- */
var B='box',C='cyl',K='cone',D='dome',Sp='sph',Tor='tor';
var R={
 capital:[[B,'marble2',.86,.08,.86,0,0,0],[B,'marble',.7,.3,.5,0,.08,0],[C,'marble',.03,.28,.03,-.3,.08,.22,6],[C,'marble',.03,.28,.03,-.1,.08,.22,6],[C,'marble',.03,.28,.03,.1,.08,.22,6],[C,'marble',.03,.28,.03,.3,.08,.22,6],[B,'gold',.74,.04,.54,0,.38,0],[D,'gold',.22,.22,.22,0,.42,0],[C,'gold',.015,.2,.015,0,.62,0],[Sp,'gold',.04,.04,.04,0,.84,0]],
 admin:[[B,'marble',.6,.55,.5,0,0,0],[B,'glass',.62,.06,.52,0,.2,0],[B,'glass',.62,.06,.52,0,.36,0],[B,'gold',.64,.04,.54,0,.55,0],[C,'gold',.01,.3,.01,.25,.59,.2]],
 embassy:[[C,'marble',.32,.25,.32,0,0,0,16],[D,'blue',.3,.3,.3,0,.25,0],[C,'gold',.01,.45,.01,-.36,0,.3],[C,'gold',.01,.45,.01,.36,0,.3],[B,'purple',.12,.08,.01,-.3,.38,.3],[B,'gold',.12,.08,.01,.42,.38,.3]],
 home:[[B,'marble',.5,.3,.45,0,0,0],[K,'blue',.42,.25,.42,0,.3,0,4],[B,'gold',.1,.16,.02,0,0,.23],[B,'glass',.08,.08,.02,-.15,.12,.23],[B,'glass',.08,.08,.02,.15,.12,.23]],
 apart:[[B,'marble',.3,.9,.3,-.18,0,0],[B,'marble',.3,1.2,.3,.18,0,-.05],[B,'glass',.31,.04,.31,-.18,.3,0],[B,'glass',.31,.04,.31,-.18,.6,0],[B,'glass',.31,.04,.31,.18,.4,-.05],[B,'glass',.31,.04,.31,.18,.8,-.05],[B,'gold',.32,.03,.32,.18,1.2,-.05]],
 arcology:[[C,'glass',.3,2.2,.42,0,0,0,12],[Tor,'gold',.36,.02,.36,0,.5,0],[Tor,'gold',.3,.02,.3,0,1.1,0],[Tor,'gold',.24,.02,.24,0,1.7,0],[Tor,'gold',.2,.02,.2,0,2.35,0]],
 farm:[[B,'field',.9,.03,.9,0,0,0],[B,'crop',.9,.05,.12,0,.03,-.3],[B,'crop',.9,.05,.12,0,.03,0],[B,'crop',.9,.05,.12,0,.03,.3],[B,'marble',.22,.2,.2,.3,.05,.3],[K,'blue',.18,.14,.18,.3,.25,.3,4]],
 water:[[C,'marble',.32,.35,.32,0,0,0,16],[C,'water',.28,.02,.28,0,.35,0,16],[B,'gold',.66,.03,.66,0,0,0],[C,'steel',.04,.04,.4,.32,.1,0]],
 power:[[B,'marble',.35,.3,.4,-.25,0,0],[C,'marble',.17,.6,.22,.15,0,-.15,16],[C,'marble',.17,.6,.22,.2,0,.22,16],[B,'gold',.1,.1,.02,-.25,.18,.21]],
 solar:[[B,'gold',.04,.25,.04,0,0,0],[B,'blue',.8,.03,.55,0,.3,0,0,-.4],[B,'gold',.84,.02,.59,0,.29,0,0,-.4]],
 geo:[[B,'marble2',.6,.2,.6,0,0,0],[C,'lava',.15,.05,.15,0,.2,0],[Sp,'robe',.18,.14,.18,.05,.6,0],[Sp,'robe',.14,.1,.14,-.08,.85,.05]],
 mine:[[K,'rock',.45,.55,.45,0,0,0,7],[B,'dark',.25,.22,.1,0,0,.33],[B,'gold',.3,.04,.12,0,.22,.33],[B,'gold',.16,.08,.1,.3,0,.38]],
 timine:[[K,'steel',.25,1,.25,0,0,0,4],[B,'gold',.12,.12,.12,0,.95,0],[B,'steel',.5,.06,.06,0,.35,0],[Sp,'water',.08,.12,.08,.32,.1,.3]],
 crystal:[[B,'gold',.7,.04,.7,0,0,0],[B,'gold',.04,.7,.04,-.33,0,-.33],[B,'gold',.04,.7,.04,.33,0,-.33],[B,'gold',.04,.7,.04,-.33,0,.33],[B,'gold',.04,.7,.04,.33,0,.33],[Sp,'purple',.14,.32,.14,0,.38,0,4]],
 refinery:[[B,'marble2',.6,.32,.5,-.1,0,0],[C,'rock',.07,.9,.07,.28,0,-.1],[B,'lava',.15,.12,.02,-.1,.05,.26],[B,'gold',.16,.03,.16,.28,.9,-.1]],
 factory:[[B,'marble',.8,.3,.6,0,0,0],[B,'blue',.8,.08,.18,0,.3,-.18,0,0,.6],[B,'blue',.8,.08,.18,0,.3,.1,0,0,.6],[Tor,'gold',.12,.03,.12,.3,.15,.31]],
 market:[[B,'marble',.35,.25,.35,-.22,0,0],[B,'marble',.35,.25,.35,.22,0,0],[K,'gold',.3,.15,.3,-.22,.25,0,4],[K,'robe',.3,.15,.3,.22,.25,0,4]],
 lab:[[C,'marble',.34,.25,.34,0,0,0,16],[D,'robe',.32,.32,.32,0,.25,0],[C,'gold',.03,.35,.03,.15,.45,.0,6,0,0,-.8]],
 academy:[[B,'marble',.8,.32,.55,0,0,0],[C,'marble',.03,.3,.03,-.3,0,.3],[C,'marble',.03,.3,.03,0,0,.3],[C,'marble',.03,.3,.03,.3,0,.3],[K,'gold',.48,.18,.32,0,.32,0,4],[Sp,'robe',.04,.04,.04,0,.52,0]],
 qlab:[[B,'marble',.5,.15,.5,0,0,0],[Sp,'glass',.25,.25,.25,0,.48,0],[Tor,'gold',.36,.015,.36,0,.48,0,0,.5],[Tor,'gold',.36,.015,.36,0,.48,0,0,-.5]],
 park:[[C,'green',.45,.03,.45,0,0,0,20],[C,'marble',.14,.08,.14,0,.03,0,16],[C,'water',.11,.02,.11,0,.11,0,16],[C,'robe',.015,.25,.015,0,.11,0]],
 hospital:[[B,'marble',.65,.4,.5,0,0,0],[B,'blue',.06,.2,.02,0,.12,.26],[B,'blue',.2,.06,.02,0,.19,.26],[B,'gold',.5,.04,.03,0,.42,.2]],
 cathedral:[[B,'marble',.5,.45,.7,0,0,0],[K,'marble',.14,1.1,.14,0,.45,-.2,4],[K,'gold',.1,.35,.1,0,1.5,-.2,4],[K,'marble2',.08,.4,.08,-.22,.45,.25,4],[K,'marble2',.08,.4,.08,.22,.45,.25,4],[C,'glass',.1,.02,.1,0,.3,.36]],
 spaceport:[[C,'steel',.48,.06,.48,0,0,0,24],[Tor,'gold',.4,.02,.4,0,.06,0],[C,'robe',.08,.7,.1,0,.06,0,12],[K,'robe',.08,.22,.08,0,.76,0,12],[B,'gold',.02,.15,.12,.09,.06,0],[B,'gold',.02,.15,.12,-.09,.06,0]],
 outpost:[[K,'field',.3,.4,.3,0,0,0,4],[C,'gold',.01,.6,.01,.3,0,.2],[B,'blue',.15,.09,.01,.38,.48,.2]]
};
var GEO={};
function geo(sh,seg){var k=sh+(seg||'');if(GEO[k])return GEO[k];var g;
 if(sh===B)g=new T.BoxGeometry(1,1,1).translate(0,0.5,0);else if(sh===C)g=new T.CylinderGeometry(1,1,1,seg||12).translate(0,0.5,0);
 else if(sh===K)g=new T.ConeGeometry(1,1,seg||12).translate(0,0.5,0);else if(sh===D)g=new T.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2);
 else if(sh===Sp)g=new T.SphereGeometry(1,seg||12,seg?2:8);else g=new T.TorusGeometry(1,1,6,24).rotateX(Math.PI/2);return GEO[k]=g;}
function buildMesh(id){var parts=R[id]||R.home,g=new T.Group();parts.forEach(function(p){var sh=p[0],m=new T.Mesh(geo(sh,p[8]),MAT[p[1]]);
 if(sh===Tor){m.scale.set(p[2],p[2],p[2]);m.geometry=geo(sh+'t');if(!GEO[sh+'t']){GEO[sh+'t']=new T.TorusGeometry(1,0.06,6,28).rotateX(Math.PI/2);m.geometry=GEO[sh+'t'];}}
 else if(sh===C||sh===K||sh===D||sh===Sp)m.scale.set(p[2],p[3],p[4]);else m.scale.set(p[2],p[3],p[4]);
 m.position.set(p[5],p[6],p[7]);if(p[9])m.rotation.z=p[9];if(p[10])m.rotation.x=p[10];if(p[11])m.rotation.x=p[11];if(id==='solar'&&sh===B&&p[3]<.05)m.rotation.x=-0.5;
 m.castShadow=m.receiveShadow=true;g.add(m);});return g;}

/* ---------- world ---------- */
function buildWorld(G){
 if(scene&&terrainMesh){scene.remove(terrainMesh);scene.remove(water);if(treeMesh)scene.remove(treeMesh);if(crystalMesh)scene.remove(crystalMesh);if(bgroup)scene.remove(bgroup);if(roadGroup)scene.remove(roadGroup);if(people)scene.remove(people);}
 W=AC.api.W;H=AC.api.H;G0=G;built={};lastSig='';var seg=S.q==='high'?4:2,gw=W*seg,gh=H*seg,g=new T.PlaneGeometry(W,H,gw,gh);g.rotateX(-Math.PI/2);
 var pos=g.attributes.position,cols=new Float32Array(pos.count*3),c=new T.Color(),c2=new T.Color();
 for(var i=0;i<pos.count;i++){var x=pos.getX(i)+W/2,z=pos.getZ(i)+H/2,tx=Math.max(0,Math.min(W-1,Math.floor(x))),ty=Math.max(0,Math.min(H-1,Math.floor(z))),t=G.tiles[ty*W+tx],h=hAt(G,x,z);
  var n=AC.render.vnoise(x*3,z*3,7)*0.5+AC.render.vnoise(x*9,z*9,8)*0.25;h+=(n-0.35)*(t.t==='mountain'?0.9:0.12);if(t.b)h=Math.max(h,0.05);pos.setY(i,h);
  c.setHex(COL[t.t]);if(t.t==='mountain'&&h>1.9)c.lerp(c2.setHex(0xffffff),Math.min(1,(h-1.9)*1.5));if(h>-0.05&&h<0.08&&t.t!=='mountain')c.lerp(c2.setHex(0xe9d7a2),0.6);
  c.multiplyScalar(0.85+n*0.35);cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b;}
 g.setAttribute('color',new T.BufferAttribute(cols,3));g.computeVertexNormals();
 terrainMesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:0.92,flatShading:false}));terrainMesh.receiveShadow=true;terrainMesh.castShadow=S.q==='high';scene.add(terrainMesh);
 waterGeo=new T.PlaneGeometry(W+40,H+40,Math.round((W+40)/2),Math.round((H+40)/2));waterGeo.rotateX(-Math.PI/2);waterGeo.userData.base=Float32Array.from(waterGeo.attributes.position.array);
 water=new T.Mesh(waterGeo,new T.MeshPhongMaterial({color:0x2a6fc0,specular:0xffffff,shininess:90,transparent:true,opacity:0.82}));water.position.y=-0.02;water.receiveShadow=true;scene.add(water);
 // trees & crystals (instanced)
 var trees=[],crys=[];G.tiles.forEach(function(t,i){var x=i%W,y=(i/W)|0;if(t.b)return;var n=t.t==='forest'?5:t.t==='plains'&&hsh(x,y,3)<0.15?1:0;
  for(var k=0;k<n;k++)trees.push([x+0.15+hsh(i,k,41)*0.7,y+0.15+hsh(i,k,42)*0.7,0.6+hsh(i,k,43)*0.6]);if(t.t==='crystal')for(k=0;k<3;k++)crys.push([x+0.2+hsh(i,k,44)*0.6,y+0.2+hsh(i,k,45)*0.6,0.5+hsh(i,k,46)]);});
 var tg=new T.ConeGeometry(0.16,0.55,7).translate(0,0.45,0),tr=new T.CylinderGeometry(0.03,0.04,0.2,5).translate(0,0.1,0),merged=mergeTree(tg,tr);
 treeMesh=new T.InstancedMesh(merged,new T.MeshStandardMaterial({vertexColors:true,roughness:0.85}),trees.length||1);var m4=new T.Matrix4(),q=new T.Quaternion(),sv=new T.Vector3(),pv=new T.Vector3();
 trees.forEach(function(t,i){pv.set(t[0]-W/2,hAt(G,t[0],t[1])-0.02,t[1]-H/2);sv.set(t[2],t[2]*(0.8+hsh(i,1,47)*0.6),t[2]);q.setFromAxisAngle(new T.Vector3(0,1,0),hsh(i,2,48)*6);m4.compose(pv,q,sv);treeMesh.setMatrixAt(i,m4);});
 treeMesh.count=trees.length;treeMesh.castShadow=true;treeMesh.receiveShadow=true;scene.add(treeMesh);
 crystalMesh=new T.InstancedMesh(new T.OctahedronGeometry(0.12).scale(0.6,1.8,0.6).translate(0,0.18,0),MAT.purple,crys.length||1);
 crys.forEach(function(t,i){pv.set(t[0]-W/2,hAt(G,t[0],t[1]),t[1]-H/2);sv.set(t[2],t[2],t[2]);q.setFromAxisAngle(new T.Vector3(0,0,1),(hsh(i,3,49)-0.5)*0.5);m4.compose(pv,q,sv);crystalMesh.setMatrixAt(i,m4);});crystalMesh.count=crys.length;crystalMesh.castShadow=true;scene.add(crystalMesh);
 bgroup=new T.Group();scene.add(bgroup);roadGroup=new T.Group();scene.add(roadGroup);
 people=new T.InstancedMesh(new T.ConeGeometry(0.035,0.14,6).translate(0,0.07,0),MAT.robe,300);people.count=0;people.castShadow=true;scene.add(people);
 var cap=G.tiles.findIndex(function(t){return t.b==='capital';});if(cap<0)cap=G.tiles.findIndex(function(t,i){return t.t==='plains'&&Math.abs(i%W-W/2)<6&&Math.abs((i/W|0)-H/2)<5;});
 if(cap>=0){cam.tx=cap%W+0.5-W/2;cam.tz=((cap/W)|0)+0.5-H/2;}cam.dist=S.q==='high'?13:10;}
function mergeTree(cone,trunk){var g=new T.BufferGeometry(),a=cone.toNonIndexed(),b=trunk.toNonIndexed(),pa=a.attributes.position.array,pb=b.attributes.position.array,na=a.attributes.normal.array,nb=b.attributes.normal.array;
 var p=new Float32Array(pa.length+pb.length),n=new Float32Array(na.length+nb.length),c=new Float32Array(p.length);p.set(pa);p.set(pb,pa.length);n.set(na);n.set(nb,na.length);
 for(var i=0;i<pa.length;i+=3){c[i]=0.22;c[i+1]=0.55;c[i+2]=0.24;}for(;i<p.length;i+=3){c[i]=0.42;c[i+1]=0.29;c[i+2]=0.16;}
 g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(n,3));g.setAttribute('color',new T.BufferAttribute(c,3));return g;}
function sync(G){var sig='';for(var i=0;i<G.tiles.length;i++){var b=G.tiles[i].b;if(b)sig+=i+b;}if(sig===lastSig)return;lastSig=sig;
 var now=performance.now();G.tiles.forEach(function(t,i){var cur=built[i];if(cur&&cur.id===t.b)return;if(cur){(cur.road?roadGroup:bgroup).remove(cur.o);delete built[i];}
  if(!t.b)return;var x=i%W,y=(i/W)|0,h=surface(G,x,y),o;
  if(t.b==='road'){o=new T.Group();var mk=function(dx,dz){var len=0.5,m=new T.Mesh(geo(B),MAT.road);m.scale.set(dx?len:0.32,0.03,dz?len:0.32);m.position.set(dx*0.25,0,dz*0.25);m.receiveShadow=true;o.add(m);};
   mk(0,0);[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var nx=x+d[0],ny=y+d[1];if(nx>=0&&ny>=0&&nx<W&&ny<H&&G.tiles[ny*W+nx].b)mk(d[0],d[1]);});o.position.set(x+0.5-W/2,h,y+0.5-H/2);roadGroup.add(o);built[i]={id:t.b,o:o,road:1};return;}
  o=buildMesh(t.b);o.position.set(x+0.5-W/2,h,y+0.5-H/2);o.rotation.y=Math.round(hsh(i,1,50)*4)*Math.PI/2*0+(hsh(i,1,50)<0.5?0:Math.PI/2)*0;bgroup.add(o);built[i]={id:t.b,o:o};if(G0&&G0.day>0)spawn[i]=now;});
 // neighbouring roads must reconnect
 G.tiles.forEach(function(t,i){if(t.b==='road'&&built[i]&&!built[i].fresh){}});
 Object.keys(built).forEach(function(i){if(built[i].road){roadGroup.remove(built[i].o);delete built[i];}});G.tiles.forEach(function(t,i){if(t.b==='road'){lastSig='';}});
 if(!lastSig){lastSig=sig;G.tiles.forEach(function(t,i){if(t.b!=='road')return;var x=i%W,y=(i/W)|0,h=surface(G,x,y),o=new T.Group();var mk=function(dx,dz){var m=new T.Mesh(geo(B),MAT.road);m.scale.set(dx?0.5:0.32,0.03,dz?0.5:0.32);m.position.set(dx*0.25,0,dz*0.25);m.receiveShadow=true;o.add(m);};
  mk(0,0);[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var nx=x+d[0],ny=y+d[1];if(nx>=0&&ny>=0&&nx<W&&ny<H&&G.tiles[ny*W+nx].b)mk(d[0],d[1]);});o.position.set(x+0.5-W/2,h,y+0.5-H/2);roadGroup.add(o);built[i]={id:'road',o:o,road:1};});}}
function tod(now){return S.daynight?((now/1000/160)+0.3)%1:0.35;}
var m4b=null,qb=null,sb=null,pb=null,last=0;
function frame(now){var G=AC.api.state();if(!G)return;if(G.tiles!==(G0&&G0.tiles)){buildWorld(G);}sync(G);
 var t=now/1000,td=tod(now),el=Math.sin(td*6.2832),day=Math.max(0,Math.min(1,0.45+el*0.9)),night=1-day;
 // camera
 var cx=cam.tx+Math.sin(cam.yaw)*Math.cos(cam.pitch)*cam.dist,cz=cam.tz+Math.cos(cam.yaw)*Math.cos(cam.pitch)*cam.dist,cy=Math.sin(cam.pitch)*cam.dist+0.3;camera.position.set(cx,cy,cz);camera.lookAt(cam.tx,0.2,cam.tz);
 // sun & sky
 var az=td*6.2832;sun.position.set(cam.tx+Math.cos(az)*30,Math.max(4,el*40),cam.tz+Math.sin(az)*12+10);sun.target.position.set(cam.tx,0,cam.tz);sun.intensity=0.25+2.2*day;
 sun.color.setRGB(1,0.8+0.2*day,0.6+0.4*day);hemi.intensity=0.25+0.75*day;var sky=new T.Color(0x0b1235).lerp(new T.Color(0x9fc8ff),day);if(day<0.6&&day>0.15)sky.lerp(new T.Color(0xffa070),0.35*(1-Math.abs(day-0.4)*4));
 scene.background=sky;scene.fog.color.copy(sky);
 MAT.glass.emissive.setRGB(1,0.85,0.5);MAT.glass.emissiveIntensity=night*0.9;MAT.gold.emissive.setRGB(0.4,0.3,0.05);MAT.gold.emissiveIntensity=0.15+night*0.4;
 // water waves (low-res, every other frame on low)
 if(S.q==='high'||((now/50)|0)%2){var p=waterGeo.attributes.position,b=waterGeo.userData.base;for(var i=0;i<p.count;i++){var x=b[i*3],z=b[i*3+2];p.array[i*3+1]=Math.sin(x*1.3+t*1.4)*0.025+Math.cos(z*1.7+t*1.1)*0.02;}p.needsUpdate=true;waterGeo.computeVertexNormals();}
 // placement animation
 Object.keys(spawn).forEach(function(i){var e=(now-spawn[i])/600,o=built[i]&&built[i].o;if(!o||e>1){if(o)o.scale.set(1,1,1);delete spawn[i];return;}var s=e<1?(1-Math.pow(1-e,3))*1.08:1;o.scale.set(1,s,1);});
 // walking figures
 m4b=m4b||new T.Matrix4();qb=qb||new T.Quaternion();sb=sb||new T.Vector3(1,1,1);pb=pb||new T.Vector3();var n=0;
 if(cam.dist<30)Object.keys(built).forEach(function(k){if(n>=300)return;var i=+k,x=i%W,y=(i/W)|0,road=built[k].road;for(var w=0;w<(road?2:1);w++){var h=hsh(i,w,60);if(!road&&h>0.6)continue;
   var ph=(t*0.12*(0.6+h)+h*7)%1,fx,fz;if(road){var hor=hsh(i,w,61)<0.5;fx=x+(hor?ph:0.5+(h-0.5)*0.2);fz=y+(hor?0.5+(h-0.5)*0.2:ph);}else{var a=t*0.3*(h+0.4)+h*6;fx=x+0.5+Math.cos(a)*0.55;fz=y+0.5+Math.sin(a)*0.5;}
   pb.set(fx-W/2,hAt(G,fx,fz)+0.03+Math.abs(Math.sin(t*6+h*9))*0.01,fz-H/2);m4b.compose(pb,qb,sb);people.setMatrixAt(n++,m4b);}});
 people.count=n;people.instanceMatrix.needsUpdate=true;
 if(hover!=null){var hx=hover%W,hy=(hover/W)|0;hoverMesh.visible=true;hoverMesh.position.set(hx+0.5-W/2,surface(G,hx,hy)+0.06,hy+0.5-H/2);hoverMesh.material.color.setHex(AC.api.canPlace&&AC.api.canPlace(hover)===false?0xff5050:0xffe08a);}else hoverMesh.visible=false;
 renderer.render(scene,camera);}
function setOn(v){if(v&&failed){AC.api.toast('3D could not start; using the 2.5D view.');v=false;}
 if(v&&!window.THREE){load(function(){try{mats();init();on=true;document.body.classList.add('v3d');}catch(e){failed=true;on=false;console.warn('3D init failed',e);}});return;}
 if(v&&!renderer){try{mats();init();}catch(e){failed=true;return;}}
 on=v;document.body.classList.toggle('v3d',on);if(on)size();}
AC.v3d={active:function(){return on&&!!renderer;},frame:frame,setOn:setOn,wanted:wanted,webgl:webgl,pick:pick,cam:cam,
 focus:function(i){cam.tx=i%W+0.5-W/2;cam.tz=((i/W)|0)+0.5-H/2;cam.dist=S.q==='high'?13:10;},wasDrag:function(){return dragged;},ready:function(){return !!renderer;},
 info:function(){return renderer?{calls:renderer.info.render.calls,tris:renderer.info.render.triangles,meshes:bgroup?bgroup.children.length:0}:null;}};
})();
