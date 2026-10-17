/* Archangel Cosmos - Phase 3 "Galactic Empires": galaxy map, FTL travel, rival empires, territory & sectors,
   fleets, galactic trade, galactic structures and missions. Single-player simulation. */
(function(){
'use strict';
var AC=window.AC,H=AC.H;function api(){return AC.api;}
function pay(G,c){for(var k in c)if((G.res[k]||0)<c[k])return false;for(k in c)G.res[k]-=c[k];return true;}
AC.RES.essence={n:'Stellar Essence',icon:'E'};AC.RES.cores={n:'Celestial Core Fragments',icon:'C'};AC.RES.influence={n:'Galactic Influence',icon:'I'};
if(AC.art&&AC.art.ICONS){var sv=function(b){return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">'+b+'</svg>';};
 AC.art.ICONS.essence=sv('<circle cx="12" cy="12" r="8" fill="#ffb0e0"/><circle cx="12" cy="12" r="4" fill="#fff"/><circle cx="12" cy="12" r="10.5" fill="none" stroke="#ff7ac8" opacity=".6"/>');
 AC.art.ICONS.cores=sv('<path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z" fill="#ffe08a" stroke="#c08a10"/><circle cx="12" cy="11" r="2.4" fill="#5ff0ff"/>');
 AC.art.ICONS.influence=sv('<path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.5-.8z" fill="#c9a0ff" stroke="#7a4ee0"/>');}

var FACTIONS=[
 {id:'player',n:'Archangel Dominion',col:'#ffd76a'},
 {id:'lum',n:'Lumarian Concord',col:'#fff3a8',race:'lum'},
 {id:'aeth',n:'Aethari Archive',col:'#7fd8ff',race:'aeth'},
 {id:'titan',n:'Titanborn Holds',col:'#ff9a5a',race:'titan'},
 {id:'cel',n:'Celestian Assembly',col:'#d9a8ff',race:'cel'},
 {id:'void',n:'Void Sovereignty',col:'#ff4a6a',hostile:true},
 {id:'iron',n:'Iron Syndicate',col:'#a0a8b8',rival:true}
];
var FB={};FACTIONS.forEach(function(f){FB[f.id]=f;});
var GSECT=[{id:'core',n:'Throne Core'},{id:'orion',n:'Seraphic Arm'},{id:'cygnus',n:'Cherubim Reach'},{id:'perseus',n:'Dominion Spiral'},{id:'rim',n:'Outer Rim'}];
var SHIPS=[{id:'frigate',n:'Seraph Frigate',pow:10,cost:{credits:15000,metal:120,qmatter:2}},{id:'cruiser',n:'Throne Cruiser',pow:45,cost:{credits:60000,titanium:200,qmatter:10,darke:2}},
 {id:'colony',n:'Colony Fleet',pow:2,cost:{credits:40000,metal:300,goods:120,he3:40}},{id:'convoy',n:'Trade Convoy',pow:1,cost:{credits:20000,metal:100,goods:40}}];
var GSTRUCT=[{id:'forge',n:'Stellar Forge',cost:{credits:30000,qmatter:10},prod:{essence:3},d:'+3 Stellar Essence/day.'},
 {id:'coreex',n:'Core Extractor',cost:{credits:45000,darke:3,titanium:150},prod:{cores:1},d:'+1 Celestial Core Fragment/day.'},
 {id:'starbase',n:'Starbase',cost:{credits:25000,metal:300},def:40,d:'+40 defence.'},
 {id:'cathedral',n:'Celestial Cathedral',cost:{credits:35000,crystal:60},prod:{light:6,influence:1},d:'+6 Light, +1 Influence/day.'},
 {id:'gate',n:'FTL Gate',cost:{credits:50000,qmatter:20,essence:20},d:'Fleets from/to here travel 2x faster.'},
 {id:'market',n:'Galactic Exchange',cost:{credits:40000,goods:200},prod:{credits:1500},d:'+1,500 Credits/day.'}];
var GS={};GSTRUCT.forEach(function(s){GS[s.id]=s;});var SHB={};SHIPS.forEach(function(s){SHB[s.id]=s;});

/* ---------- generation ---------- */
var SYL=['Ar','Sera','Thal','Ophi','El','Zad','Ur','Mira','Cael','Hesp','Lum','Vor','Ith','Aur','Nyx','Sol','Bel','Tor','Quel','Ra'];
var SUF=['ion','eth','aris','os','ara','iel','enth','orum','is','ae'];
function gen(seed){var r=(function(s){return function(){s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};})(seed||1),sys=[],N=26;
 for(var i=0;i<N;i++){var arm=i%3,t=(i/N)*2.6+0.25,a=t*2.4+arm*2.094+(r()-.5)*0.5,rad=60+t*120+(r()-.5)*30;if(i===0){a=0;rad=40;}
  sys.push({id:i,n:i===0?'Helion':SYL[(r()*SYL.length)|0]+SUF[(r()*SUF.length)|0],x:Math.cos(a)*rad,y:Math.sin(a)*rad*0.62,star:['yellow','blue','red giant','white dwarf','binary','neutron'][(r()*6)|0],
   owner:null,def:10+((r()*30)|0),res:['essence','cores','darke','qmatter','credits'][(r()*5)|0],rich:1+((r()*3)|0),explored:false,st:[],sector:GSECT[Math.min(4,Math.floor(rad/60))].id});}
 sys[0].owner='player';sys[0].explored=true;sys[0].sector='core';
 var claim=function(f,n){var c=sys.filter(function(s){return !s.owner;}).sort(function(a,b){return Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y);});for(var k=0;k<n&&c[k];k++){c[k].owner=f.id;c[k].def+=20;}};
 var homes=[[180,40],[-120,150],[60,-200],[-220,-60],[260,-140],[-40,230]];FACTIONS.slice(1).forEach(function(f,j){claim({id:f.id,x:homes[j][0],y:homes[j][1]},2+(f.hostile?1:0));});
 var lanes=[];sys.forEach(function(a){var nb=sys.filter(function(b){return b!==a;}).sort(function(p,q){return Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(q.x-a.x,q.y-a.y);}).slice(0,3);
  nb.forEach(function(b){if(!lanes.some(function(l){return (l[0]===a.id&&l[1]===b.id)||(l[0]===b.id&&l[1]===a.id);}))lanes.push([a.id,b.id]);});});
 return {sys:sys,lanes:lanes};}

/* ---------- state & unlock ---------- */
H.migrate.push(function(G){if(!G.gal){var g=gen((G.seed||1)%100000+7);G.gal={unlocked:false,sys:g.sys,lanes:g.lanes,fleets:[],ships:{frigate:0,cruiser:0,colony:0,convoy:0},sel:0,stance:{},routes:[],sectors:{},log:[]};
 FACTIONS.forEach(function(f){if(f.id!=='player')G.gal.stance[f.id]=f.hostile?-60:f.rival?-20:0;});}});
function owns(){return !AC.store||AC.store.owns('empires');}
function ready(G){var st=G.star;if(!st||!st.unlocked)return false;var cols=Object.keys(st.col||{}).length;return !!(G.missions.S05&&cols>=3&&(G.made.darke||0)>=1)||!!G.gal.forceUnlock;}
function mine(G){return G.gal.sys.filter(function(s){return s.owner==='player';});}
function adj(G,id){return G.gal.lanes.filter(function(l){return l[0]===id||l[1]===id;}).map(function(l){return l[0]===id?l[1]:l[0];});}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function stance(G,f){var F=FB[f];var base=G.gal.stance[f]||0;if(F.race&&G.races&&G.races[F.race])base+=G.races[F.race].rel*0.5;return Math.max(-100,Math.min(100,base));}
var lastTick=0;
H.tick.push(function(G,add){lastTick=performance.now();var g=G.gal;
 if(!g.unlocked&&ready(G)){if(!owns()){if(!g.lockNote){g.lockNote=1;api().toast('Galactic Empires expansion is locked. See the Store.');}}else{g.unlocked=true;add('influence',10);api().toast('Phase 3 unlocked: Galactic Empires! The Aethari open the wormhole gates. Open the Galaxy view (🌌).','success');
  api().say('Governor, the Aethari have shared wormhole engineering. Helion is but one star among many. Build Seraph Frigates and a Colony Fleet, explore the hyperlanes and claim new systems.');if(AC.chron)AC.chron(G,'era','The Wormhole Gates opened and the Archangel Dominion stepped into the wider galaxy.');}}
 if(!g.unlocked)return;
 // owned system production
 mine(G).forEach(function(s){var gov=g.sectors[s.sector],m=gov?1.15:1;if(s.id!==0){var base={};base[s.res]=s.res==='credits'?400*s.rich:s.rich*(s.res==='cores'?0.3:1);for(var k in base)add(k,base[k]*m);add('influence',0.1);}
  s.st.forEach(function(id){var st=GS[id];for(var k in st.prod||{})add(k,st.prod[k]*m);});});
 // trade routes
 g.routes=g.routes.filter(function(r){var s=g.sys[r];if(!s.owner||s.owner==='player'||stance(G,s.owner)<-30){api().toast('A trade route to '+s.n+' was lost.','alert');return false;}add('credits',800+s.rich*300);add('essence',0.5);if(G.races&&FB[s.owner].race){G.races[FB[s.owner].race].rel+=0.05;}return true;});
 // fleets in transit
 g.fleets=g.fleets.filter(function(f){if(--f.eta>0)return true;arrive(G,f,add);return false;});
 // rivals act every 8 days
 if(G.day%8===0)FACTIONS.forEach(function(f){if(f.id==='player'||Math.random()>0.5)return;var own=g.sys.filter(function(s){return s.owner===f.id;});if(!own.length)return;
  var from=own[(Math.random()*own.length)|0],targets=adj(G,from.id).map(function(i){return g.sys[i];}).filter(function(s){return s.owner!==f.id;});if(!targets.length)return;var t=targets[(Math.random()*targets.length)|0];
  if(!t.owner){t.owner=f.id;t.def=15+((Math.random()*20)|0);if(t.explored)api().toast(f.n+' claimed '+t.n+'.');}
  else if(t.owner==='player'&&stance(G,f.id)<-30){var defp=t.def+t.st.filter(function(x){return x==='starbase';}).length*40,atk=20+Math.random()*40+(f.hostile?20:0);
   if(atk>defp){t.owner=f.id;t.st=[];api().toast('⚠ '+f.n+' seized '+t.n+'! Build Starbases and fleets to defend.','alert');if(AC.chron)AC.chron(G,'war',f.n+' seized the system of '+t.n+'.');}else{t.def=Math.max(5,t.def-5);api().toast(f.n+' raided '+t.n+' but the defences held.','alert');}}});
 if(mine(G).length>=10&&!g.emperor){g.emperor=true;api().toast('You are proclaimed Galactic Emperor by the Royal Heavenly Host!','success');if(AC.chron)AC.chron(G,'era','The Grand Royal Council proclaimed the Governor Galactic Emperor.');}
});
function arrive(G,f,add){var g=G.gal,s=g.sys[f.to],A=api();s.explored=true;
 if(f.mission==='explore'){A.toast('Fleet explored '+s.n+' ('+s.star+' star, rich in '+AC.RES[s.res].n+').');}
 else if(f.mission==='claim'){if(!s.owner){s.owner='player';s.def=20;A.toast('Colony established at '+s.n+'!','success');if(AC.chron)AC.chron(G,'colony','Settlers of the Dominion founded a colony at '+s.n+'.');}else A.toast(s.n+' is already held by the '+FB[s.owner].n+'. Colony fleet returns.');if(s.owner!=='player')g.ships.colony++;}
 else if(f.mission==='attack'){if(s.owner&&s.owner!=='player'){var def=s.def+s.st.filter(function(x){return x==='starbase';}).length*40,pow=f.pow*(0.8+Math.random()*0.4);
  if(pow>def){var old=FB[s.owner].n;g.stance[s.owner]=(g.stance[s.owner]||0)-25;if(FB[s.owner].race&&G.races)G.races[FB[s.owner].race].rel-=25;s.owner='player';s.def=15;A.toast('Victory! '+s.n+' taken from the '+old+'.','success');if(AC.chron)AC.chron(G,'war','The fleets of the Dominion took '+s.n+' from the '+old+'.');g.wins=(g.wins||0)+1;
   var lost=Math.round(f.ships.frigate*0.3);g.ships.frigate+=f.ships.frigate-lost;g.ships.cruiser+=f.ships.cruiser;}
  else{A.toast('Defeat at '+s.n+'. The fleet was destroyed.','error');s.def=Math.max(5,s.def-Math.round(pow/3));}}else{g.ships.frigate+=f.ships.frigate;g.ships.cruiser+=f.ships.cruiser;}}
 else if(f.mission==='trade'){if(s.owner&&s.owner!=='player'&&stance(G,s.owner)>=-30){if(g.routes.indexOf(s.id)<0)g.routes.push(s.id);A.toast('Galactic trade route opened with '+s.n+' ('+FB[s.owner].n+').');}else{A.toast('Trade convoy refused at '+s.n+'.');g.ships.convoy++;}}}
function travel(G,from,to){var a=G.gal.sys[from],b=G.gal.sys[to],d=dist(a,b),gate=(a.st.indexOf('gate')>=0?2:1)*(b.st.indexOf('gate')>=0?1.5:1);return Math.max(2,Math.round(d/25/gate));}
function nearestOwned(G,to){var t=G.gal.sys[to],best=null,bd=1e9;mine(G).forEach(function(s){var d=dist(s,t);if(d<bd){bd=d;best=s;}});return best;}

/* ---------- actions ---------- */
H.act.gship=function(G,id){var s=SHB[id];if(!pay(G,s.cost))return api().toast('Not enough resources.');G.gal.ships[id]++;if(AC.audio)AC.audio.sfx('build');api().toast(s.n+' commissioned.');};
function send(G,mission,to,ships){var from=nearestOwned(G,to);if(!from)return api().toast('You hold no systems to launch from.');var eta=travel(G,from.id,to),pow=0;for(var k in ships)pow+=SHB[k].pow*ships[k];
 G.gal.fleets.push({mission:mission,from:from.id,to:to,eta:eta,tot:eta,ships:ships,pow:pow});if(AC.audio)AC.audio.sfx('launch');api().toast('Fleet departs '+from.n+' → '+G.gal.sys[to].n+' ('+eta+' days, '+mission+').');}
H.act.gexplore=function(G,to){to=+to;var g=G.gal;if(g.ships.frigate<1&&g.ships.convoy<1)return api().toast('Build a Seraph Frigate first.');var k=g.ships.frigate?'frigate':'convoy',o={};o[k]=1;g.ships[k]--;send(G,'explore',to,o);g.ships[k]++;};
H.act.gclaim=function(G,to){to=+to;var g=G.gal,s=g.sys[to];if(!s.explored)return api().toast('Explore it first.');if(s.owner)return api().toast('Already claimed.');if(g.ships.colony<1)return api().toast('Build a Colony Fleet first.');g.ships.colony--;send(G,'claim',to,{colony:1});};
H.act.gattack=function(G,to){to=+to;var g=G.gal,s=g.sys[to];if(!s.owner||s.owner==='player')return;if(g.ships.frigate+g.ships.cruiser<1)return api().toast('You need warships.');var o={frigate:g.ships.frigate,cruiser:g.ships.cruiser};g.ships.frigate=0;g.ships.cruiser=0;send(G,'attack',to,o);};
H.act.gtrade=function(G,to){to=+to;var g=G.gal,s=g.sys[to];if(!s.owner||s.owner==='player')return api().toast('Trade routes connect to other empires\' systems.');if(stance(G,s.owner)<-30)return api().toast('The '+FB[s.owner].n+' refuse to trade with you.');if(g.ships.convoy<1)return api().toast('Build a Trade Convoy first.');g.ships.convoy--;send(G,'trade',to,{convoy:1});};
H.act.gbuild=function(G,arg){var p=arg.split(':'),s=G.gal.sys[+p[0]],st=GS[p[1]];if(s.owner!=='player')return;if(s.st.length>=4)return api().toast('Max 4 galactic structures per system.');if(s.st.indexOf(st.id)>=0&&st.id!=='starbase')return api().toast('Already built here.');if(!pay(G,st.cost))return api().toast('Not enough resources.');s.st.push(st.id);if(AC.audio)AC.audio.sfx('build');api().toast(st.n+' built at '+s.n+'.');};
H.act.gsel=function(G,id){G.gal.sel=+id;};
H.act.gdiplo=function(G,f){if(G.res.influence<5)return api().toast('Needs 5 Galactic Influence.');G.res.influence-=5;G.gal.stance[f]=(G.gal.stance[f]||0)+15;api().toast('Envoys sent to the '+FB[f].n+' (+15 stance).');};
H.act.gsector=function(G,arg){var p=arg.split(':');if(!p[1])return;if(G.council.favor<10&&G.gal.sectors[p[0]])return api().toast('Needs 10 Council Favour to reassign.');if(G.gal.sectors[p[0]])G.council.favor-=10;G.gal.sectors[p[0]]=p[1];api().toast('Sector governor appointed by the Royal Heavenly Host.');};
H.act.toggleGalaxy=function(){toggle();};

/* ---------- missions ---------- */
[
 {id:'G01',n:'Beyond Helion',d:'Unlock Galactic Empires (3 colonies, mission S05, first Dark Energy).',check:function(G){return G.gal.unlocked;},reward:{influence:20}},
 {id:'G02',n:'First Frigate',d:'Commission a Seraph Frigate.',check:function(G){return G.gal.ships.frigate>0||G.gal.fleets.length>0;},reward:{credits:20000}},
 {id:'G03',n:'Star Charts',d:'Explore 5 star systems.',check:function(G){return G.gal.sys.filter(function(s){return s.explored;}).length>=5;},reward:{essence:20}},
 {id:'G04',n:'A Second Star',d:'Claim a second star system.',check:function(G){return mine(G).length>=2;},reward:{credits:50000}},
 {id:'G05',n:'Galactic Trade',d:'Open a galactic trade route.',check:function(G){return G.gal.routes.length>0;},reward:{influence:15}},
 {id:'G06',n:'Stellar Forge',d:'Build a Stellar Forge.',check:function(G){return mine(G).some(function(s){return s.st.indexOf('forge')>=0;});},reward:{cores:3}},
 {id:'G07',n:'Royal Sectors',d:'Appoint a governor to a galactic sector.',check:function(G){return Object.keys(G.gal.sectors).length>0;},reward:{influence:10}},
 {id:'G08',n:'Shield of Heaven',d:'Build a Starbase.',check:function(G){return mine(G).some(function(s){return s.st.indexOf('starbase')>=0;});},reward:{credits:30000}},
 {id:'G09',n:'Five Stars',d:'Hold 5 star systems.',check:function(G){return mine(G).length>=5;},reward:{light:300}},
 {id:'G10',n:'Victory in the Void',d:'Win a battle and take a system.',check:function(G){return (G.gal.wins||0)>0;},reward:{influence:30}},
 {id:'G11',n:'Core of Creation',d:'Gather 20 Celestial Core Fragments.',check:function(G){return (G.made.cores||0)>=20;},reward:{credits:200000}},
 {id:'G12',n:'Galactic Emperor',d:'Hold 10 star systems.',check:function(G){return mine(G).length>=10;},reward:{light:1000}}
].forEach(function(m){m.phase='empires';var c=m.check;m.check=function(G){return !!(G.gal&&(G.gal.unlocked||m.id==='G01'))&&c(G);};AC.MISSIONS.push(m);});

/* ---------- galaxy map rendering ---------- */
var on=false,cv,ctx,zoom=1,bg=null,panX=0,panY=0;
function active(){return on;}
function toggle(){var G=api().state();if(!G)return;if(!on&&!G.gal.unlocked)return api().toast(owns()?'Galactic Empires unlocks after Starborn milestones: 3 colonies, mission S05 and your first Dark Energy.':'Galactic Empires expansion is locked. See the Store.');
 on=!on;if(on&&AC.space&&AC.space.active())AC.space.toggle();document.body.classList.toggle('galaxy',on);if(on&&H.act.tab)H.act.tab('galaxy');api().render();}
function background(w,h){var c=AC.render.mk(1024,640),x=c.getContext('2d');x.fillStyle='#010108';x.fillRect(0,0,1024,640);var cx=512,cy=320;
 for(var i=0;i<9000;i++){var arm=i%3,t=Math.random(),a=t*6+arm*2.094+(Math.random()-.5)*0.6,r=t*300+Math.random()*20;x.globalAlpha=0.15+Math.random()*0.5;x.fillStyle=Math.random()<0.3?'#ffd9a8':Math.random()<0.5?'#bcd4ff':'#fff';x.fillRect(cx+Math.cos(a)*r*1.3,cy+Math.sin(a)*r*0.8,Math.random()*1.4+0.3,Math.random()*1.4+0.3);}
 var g=x.createRadialGradient(cx,cy,0,cx,cy,140);g.addColorStop(0,'rgba(255,230,180,.7)');g.addColorStop(1,'rgba(255,200,150,0)');x.globalAlpha=1;x.fillStyle=g;x.fillRect(0,0,1024,640);return c;}
function frame(now){cv=cv||document.getElementById('map');ctx=ctx||cv.getContext('2d');var G=api().state(),g=G.gal,w=cv.width,h=cv.height,t=now/1000;
 ctx.setTransform(1,0,0,1,0,0);bg=bg||background();ctx.fillStyle='#010108';ctx.fillRect(0,0,w,h);var sc=Math.min(w/820,h/560)*zoom;
 ctx.save();ctx.translate(w/2+panX,h/2+panY);ctx.rotate(t*0.004);ctx.drawImage(bg,-512*sc*0.9,-320*sc*0.9,1024*sc*0.9,640*sc*0.9);ctx.restore();
 ctx.setTransform(sc,0,0,sc,w/2+panX,h/2+panY);
 // territory glow
 g.sys.forEach(function(s){if(!s.owner)return;var gr=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,38);gr.addColorStop(0,hexA(FB[s.owner].col,0.28));gr.addColorStop(1,hexA(FB[s.owner].col,0));ctx.fillStyle=gr;ctx.beginPath();ctx.arc(s.x,s.y,38,0,6.283);ctx.fill();});
 ctx.lineWidth=1/sc;g.lanes.forEach(function(l){var a=g.sys[l[0]],b=g.sys[l[1]];ctx.strokeStyle=(a.owner==='player'&&b.owner==='player')?'rgba(255,215,106,.6)':'rgba(140,170,255,.22)';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();});
 g.routes.forEach(function(r){var s=g.sys[r],h0=g.sys[0];ctx.strokeStyle='rgba(120,255,170,.6)';ctx.setLineDash([4/sc,4/sc]);ctx.lineDashOffset=-t*20/sc;ctx.beginPath();ctx.moveTo(h0.x,h0.y);ctx.lineTo(s.x,s.y);ctx.stroke();ctx.setLineDash([]);});
 g.sys.forEach(function(s){var col={yellow:'#fff1b0',blue:'#a8c8ff','red giant':'#ff9a7a','white dwarf':'#ffffff',binary:'#ffe0a0',neutron:'#9ff0ff'}[s.star],r=s.star==='red giant'?5:s.star==='white dwarf'?2.5:3.5,p=1+0.15*Math.sin(t*2+s.id);
  var gr=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,r*4*p);gr.addColorStop(0,col);gr.addColorStop(0.3,hexA(col,0.4));gr.addColorStop(1,hexA(col,0));ctx.fillStyle=gr;ctx.beginPath();ctx.arc(s.x,s.y,r*4*p,0,6.283);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,r*0.6,0,6.283);ctx.fill();
  if(s.owner){ctx.strokeStyle=FB[s.owner].col;ctx.lineWidth=1.6/sc;ctx.beginPath();ctx.arc(s.x,s.y,r+5,0,6.283);ctx.stroke();}
  if(g.sel===s.id){ctx.strokeStyle='#fff';ctx.lineWidth=1.2/sc;ctx.setLineDash([3/sc,3/sc]);ctx.beginPath();ctx.arc(s.x,s.y,r+10+Math.sin(t*3),0,6.283);ctx.stroke();ctx.setLineDash([]);}
  ctx.font=(10/sc)+'px Georgia';ctx.textAlign='center';ctx.fillStyle=s.explored||s.owner==='player'?'#f3e6c0':'rgba(180,190,230,.5)';ctx.fillText(s.explored?s.n:'Unknown',s.x,s.y+r+15/sc);});
 g.fleets.forEach(function(f){var a=g.sys[f.from],b=g.sys[f.to],k=1-(f.eta-Math.min(1,(now-lastTick)/1000))/f.tot,x=a.x+(b.x-a.x)*k,y=a.y+(b.y-a.y)*k;
  ctx.strokeStyle=f.mission==='attack'?'rgba(255,90,90,.5)':'rgba(255,230,150,.35)';ctx.setLineDash([2/sc,3/sc]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));ctx.fillStyle=f.mission==='attack'?'#ff8080':'#fff3c0';ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(-4,-3);ctx.lineTo(-2,0);ctx.lineTo(-4,3);ctx.fill();ctx.restore();});
}
function hexA(h,a){var c=h.length===4?h.replace(/#(.)(.)(.)/,'#$1$1$2$2$3$3'):h;return 'rgba('+parseInt(c.substr(1,2),16)+','+parseInt(c.substr(3,2),16)+','+parseInt(c.substr(5,2),16)+','+a+')';}
function click(e){var G=api().state(),r=cv.getBoundingClientRect(),w=cv.width,h=cv.height,sc=Math.min(w/820,h/560)*zoom,x=((e.clientX-r.left)*w/r.width-w/2-panX)/sc,y=((e.clientY-r.top)*h/r.height-h/2-panY)/sc,best=null,bd=1e9;
 G.gal.sys.forEach(function(s){var d=Math.hypot(s.x-x,s.y-y);if(d<bd){bd=d;best=s.id;}});if(bd<20){G.gal.sel=best;if(AC.audio)AC.audio.sfx('click');if(H.act.tab)H.act.tab('galaxy');api().render();}}
function wheel(e){zoom=Math.max(0.7,Math.min(4,zoom*(e.deltaY<0?1.12:1/1.12)));}

/* ---------- panel ---------- */
H.panel.galaxy=function(G){var g=G.gal,cs=api().costStr,fmt=api().fmt;
 if(!g.unlocked)return '<h3>Galactic Empires</h3><p>'+(owns()?'Unlocks after Starborn milestones: colonies on 3 worlds, mission S05 (New Horizons) and your first Dark Energy from Principality.':'The Galactic Empires expansion is locked. <button data-act="openStore">Open Store</button>')+'</p>';
 var h='<button data-act="toggleGalaxy">'+(on?'🌍 Return to Elysia':'🌌 Open Galaxy map')+'</button><h3>Galactic Empires <small>· '+(g.emperor?'Galactic Emperor':'Sector Commander')+'</small></h3>';
 h+='<div class="row"><span>Systems held <b>'+mine(G).length+'</b>/'+g.sys.length+'</span><span>'+['essence','cores','influence'].map(function(k){return '<span class="cost">'+AC.art.ICONS[k]+fmt(G.res[k]||0)+'</span>';}).join(' ')+'</span></div>';
 h+='<h3>Fleets</h3>'+SHIPS.map(function(s){return '<div class="row"><span>'+s.n+' <b>×'+g.ships[s.id]+'</b> <small>power '+s.pow+'</small><br><small>'+cs(s.cost)+'</small></span><button data-act="gship" data-arg="'+s.id+'">Build</button></div>';}).join('');
 if(g.fleets.length)h+='<p class="small">In FTL transit: '+g.fleets.map(function(f){return f.mission+' → '+g.sys[f.to].n+' ('+f.eta+'d)';}).join(', ')+'</p>';
 var s=g.sys[g.sel],own=s.owner?FB[s.owner]:null;
 h+='<h3>'+(s.explored?s.n:'Unknown system')+'</h3><p class="small">'+(s.explored?s.star+' star · rich in '+AC.RES[s.res].n+' (x'+s.rich+') · sector '+GSECT.find(function(x){return x.id===s.sector;}).n+' · defence '+s.def:'Unexplored. Send a frigate to chart it.')+'<br>Owner: '+(own?'<b style="color:'+own.col+'">'+own.n+'</b>':'none')+'</p>';
 h+='<button data-act="gexplore" data-arg="'+s.id+'">Explore</button>';
 if(!s.owner)h+='<button data-act="gclaim" data-arg="'+s.id+'">Send Colony Fleet</button>';
 if(s.owner&&s.owner!=='player')h+='<button data-act="gtrade" data-arg="'+s.id+'">Trade Convoy</button><button data-act="gattack" data-arg="'+s.id+'">Attack with all warships</button>';
 if(s.owner==='player'){h+='<p class="small">Structures: '+(s.st.map(function(x){return GS[x].n;}).join(', ')||'none')+'</p>';GSTRUCT.forEach(function(st){h+='<div class="card"><span class="t">'+st.n+'</span> '+cs(st.cost)+'<br><span class="e">'+st.d+'</span><br><button data-act="gbuild" data-arg="'+s.id+':'+st.id+'">Build</button></div>';});}
 h+='<h3>Empires & factions</h3>';FACTIONS.slice(1).forEach(function(f){var st=Math.round(stance(G,f.id)),n=g.sys.filter(function(x){return x.owner===f.id;}).length;
  h+='<div class="row"><span style="color:'+f.col+'">'+f.n+'</span><span><small>'+n+' systems · stance '+st+(st<-30?' (hostile)':st>40?' (friendly)':'')+'</small> <button data-act="gdiplo" data-arg="'+f.id+'">Envoy (5 Infl.)</button></span></div>';});
 h+='<h3>Galactic sectors</h3><p class="small">The Royal Heavenly Host appoints a Royal House per sector: +15% output from your systems there.</p>';
 GSECT.forEach(function(x){h+='<div class="row"><span>'+x.n+'</span><select data-gsector="'+x.id+'"><option value="">— none —</option>'+AC.HOUSES.map(function(o){return '<option value="'+o.id+'"'+(g.sectors[x.id]===o.id?' selected':'')+'>'+o.n+'</option>';}).join('')+'</select></div>';});
 h+='<p class="small">Select a system by clicking it on the galaxy map, or: '+g.sys.filter(function(x){return x.explored||x.owner==='player';}).map(function(x){return '<button class="mini" data-act="gsel" data-arg="'+x.id+'">'+x.n+'</button>';}).join('')+'</p>';
 return h;};
H.init.push(function(){var side=document.getElementById('side');if(side._galBound)return;side._galBound=1;side.addEventListener('change',function(e){var s=e.target.closest('[data-gsector]');if(!s)return;H.act.gsector(api().state(),s.dataset.gsector+':'+s.value);api().render();});});
H.advise.push(function(G){var g=G.gal;if(!g||!g.unlocked)return null;if(!g.ships.frigate&&!g.fleets.length)return 'Commission a Seraph Frigate to explore the hyperlanes (Galaxy tab).';if(mine(G).length<2)return 'Build a Colony Fleet and claim an unowned explored system.';
 var threat=FACTIONS.find(function(f){return stance(G,f.id)<-30&&mine(G).some(function(s){return adj(G,s.id).some(function(i){return g.sys[i].owner===f.id;});});});if(threat)return 'The '+threat.n+' border our systems. Build Starbases or send envoys.';return null;});
AC.galaxy={active:active,toggle:toggle,frame:frame,click:click,wheel:wheel,FACTIONS:FACTIONS,mine:mine,stance:stance,ready:ready};
})();
