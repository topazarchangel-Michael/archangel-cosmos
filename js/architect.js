/* Archangel Cosmos - Phase 4 "Universe Architect" (create stars, planets, systems and galaxies; terraform; seed life; place races)
   and Phase 5 "Archangel Cosmos" (multiverse: create universes with cosmic constants, Celestial Ascension endgame, ending/credits, endless sandbox).
   3D creation view uses the vendored three.js (2D canvas fallback without WebGL). */
(function(){
'use strict';
var AC=window.AC,H=AC.H;function api(){return AC.api;}
function pay(G,c){var m=G.cos&&G.cos.sandbox?0.5:1;for(var k in c)if((G.res[k]||0)<c[k]*m)return false;for(k in c)G.res[k]-=c[k]*m;return true;}
function sv(b){return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">'+b+'</svg>';}
AC.RES.creation={n:'Creation Energy',icon:'✧'};AC.RES.aether={n:'Aether Weave',icon:'≈'};AC.RES.omni={n:'Omniversal Light',icon:'☼'};
if(AC.art&&AC.art.ICONS){AC.art.ICONS.creation=sv('<path d="M12 1l2.2 8.8L23 12l-8.8 2.2L12 23l-2.2-8.8L1 12l8.8-2.2z" fill="#9ff0ff" stroke="#3ab0e0"/>');
 AC.art.ICONS.aether=sv('<path d="M2 8c4-4 6 4 10 0s6 4 10 0M2 14c4-4 6 4 10 0s6 4 10 0" fill="none" stroke="#d6a8ff" stroke-width="2.2"/>');
 AC.art.ICONS.omni=sv('<circle cx="12" cy="12" r="5" fill="#fff6c8"/><g stroke="#ffd76a" stroke-width="2">'+[0,45,90,135,180,225,270,315].map(function(a){var r=a*Math.PI/180;return '<line x1="'+(12+Math.cos(r)*7)+'" y1="'+(12+Math.sin(r)*7)+'" x2="'+(12+Math.cos(r)*11)+'" y2="'+(12+Math.sin(r)*11)+'"/>';}).join('')+'</g>');}

/* ---------- creation catalogue ---------- */
var STARS={yellow:{n:'Yellow sun',c:0xfff1c0,e:1,col:'#fff1c0'},blue:{n:'Blue giant',c:0xa8c8ff,e:2.2,col:'#a8c8ff'},red:{n:'Red dwarf',c:0xff8a60,e:0.6,col:'#ff8a60'},white:{n:'White star',c:0xffffff,e:1.4,col:'#ffffff'},binary:{n:'Binary suns',c:0xffe0a0,e:1.8,col:'#ffe0a0'},angelic:{n:'Angelic star',c:0xffe9ff,e:2.6,col:'#ffd0ff',req:'cos'}};
var SIZES={small:{n:'Small (moon-like)',r:0.6,m:0.6},medium:{n:'Medium (Elysia-like)',r:1,m:1},large:{n:'Super-Earth',r:1.35,m:1.5},giant:{n:'Gas giant',r:1.9,m:1.2}};
var ATM={none:{n:'None',h:-30,col:null},thin:{n:'Thin',h:-10,col:'#9ec8ff'},breathable:{n:'Breathable',h:25,col:'#7fb8ff'},dense:{n:'Dense',h:0,col:'#ffd9a0'},toxic:{n:'Toxic',h:-25,col:'#b8e070'},radiant:{n:'Radiant (angelic)',h:30,col:'#ffd0ff'}};
var TERR={ocean:{n:'Ocean world',pal:['#0a2a66','#1550a8','#2f7fd0','#4fa8e8','#e8d7a2'],sea:0.75,h:10},temperate:{n:'Temperate',pal:['#123d7a','#2a6fc0','#e6d49a','#5fa845','#3f8a45','#8d8478','#f2f7fb'],sea:0.5,h:20},
 desert:{n:'Desert',pal:['#7a4a20','#c08a4a','#e6cf8a','#f0dca0','#b07040'],sea:0.08,h:-5},ice:{n:'Ice world',pal:['#5a7a9a','#a8c8e8','#e8f2fb','#ffffff'],sea:0.2,h:-10},volcanic:{n:'Volcanic',pal:['#1a0a08','#3a1a14','#5a2e2a','#ff6a20','#ffb040'],sea:0.15,h:-20},
 crystal:{n:'Crystal',pal:['#2a1a5a','#6a4ac0','#b69af0','#e8d8ff','#ffffff'],sea:0.3,h:5},garden:{n:'Celestial garden',pal:['#1a4a8a','#4aa0e0','#f0e6b0','#8ad070','#5ac060','#ffd0f0','#ffffff'],sea:0.4,h:30,req:'cos'}};
var LIFE=['none','microbial','flora','fauna','sapient'],LIFEN={none:'No life',microbial:'Microbial life',flora:'Flora',fauna:'Fauna',sapient:'Sapient civilisation'};
var RACEOPT=[['','— none —'],['angelic','Angelic Humans'],['lum','Lumarians'],['aeth','Aethari'],['titan','Titanborn'],['cel','Celestians']];
var SYLL=['Ely','Ser','Aur','Cael','Ith','Mir','Oph','Thal','Zeph','Lum','Sol','Vael','Ari','Nym','Or'],END=['sia','aph','ora','os','iel','ara','enth','ion','is','une'];
function nm(r){return SYLL[(r*15)|0]+END[((r*977)%1*10)|0];}
function habit(w){var a=ATM[w.atm],t=TERR[w.terrain],s=STARS[w.star],h=30+a.h+t.h+(w.size==='giant'?-40:w.size==='small'?-10:0)+(s.e>2?-5:0)+w.terra;return Math.max(0,Math.min(100,Math.round(h)));}
function worldCost(d){var s=SIZES[d.size];var c={creation:Math.round(40*s.m),cores:Math.round(2*s.m),essence:10};if(d.life!=='none')c.creation+=LIFE.indexOf(d.life)*20;if(d.race)c.light=200;if(d.star==='angelic'||d.terrain==='garden')c.omni=5;return c;}

/* ---------- state ---------- */
H.migrate.push(function(G){if(!G.arch)G.arch={unlocked:false,worlds:[],systems:[],galaxies:[],sel:null,mode:'planet',draft:{name:'',star:'yellow',size:'medium',atm:'breathable',terrain:'temperate',life:'none',race:'',moons:1,rings:false},seq:1};
 if(!G.cos)G.cos={unlocked:false,universes:[],sel:0,stage:0,ended:false,sandbox:false,draft:{name:'',gravity:50,light:50,entropy:50,harmony:50}};});
function owns(id){return !AC.store||AC.store.owns(id);}
function ready4(G){return !!G.arch.force||!!(G.gal&&G.gal.unlocked&&AC.galaxy.mine(G).length>=6&&(G.made.cores||0)>=10);}
function ready5(G){var sap=G.arch.worlds.filter(function(w){return w.life==='sapient';}).length;return !!G.cos.force||!!(G.arch.unlocked&&G.arch.galaxies.length>=1&&sap>=3);}
/* cosmic constants: lore says creation is most stable when gravity, light and entropy sit in harmony near the Archangel ratios */
var IDEAL={gravity:62,light:70,entropy:35};
function stability(u){var c=u.c,d=Math.abs(c.gravity-IDEAL.gravity)+Math.abs(c.light-IDEAL.light)+Math.abs(c.entropy-IDEAL.entropy);return Math.max(0,Math.min(100,Math.round(100-d*0.9+(c.harmony-50)*0.4)));}
var STAGES=[{n:'Angelic Ascension',d:'Attune Elysia to the Throne: 2,000 Celestial Light.',cost:{light:2000},favor:30},
 {n:'Universe Engineering',d:'Stabilise a universe above 80% stability.',test:function(G){return G.cos.universes.some(function(u){return stability(u)>=80;});},cost:{omni:50},favor:40},
 {n:'Reality Architecture',d:'Hold 3 universes with life.',test:function(G){return G.cos.universes.filter(function(u){return u.life>=20;}).length>=3;},cost:{omni:150,aether:100},favor:50},
 {n:'Choir of the Host',d:'The Grand Royal Council must sing assent (60 Favour).',cost:{omni:250},favor:60},
 {n:'Seraphic Transfiguration',d:'Gather 500 Omniversal Light and 50,000 Creation Energy... no, 500 Creation Energy.',cost:{omni:500,creation:500},favor:70},
 {n:'Archangel Prime',d:'Ascend. Become the Archangel Prime, guardian of the Cosmos.',cost:{omni:1000},favor:80}];
STAGES[4].d='Gather 500 Omniversal Light and 500 Creation Energy for the transfiguration.';
var lastT=0;
H.tick.push(function(G,add){var A=G.arch,C=G.cos;lastT=performance.now();
 if(!A.unlocked&&ready4(G)){if(!owns('architect')){if(!A.lockNote){A.lockNote=1;api().toast('Universe Architect expansion is locked. See the Store.');}}
  else{A.unlocked=true;add('creation',100);api().toast('Phase 4 unlocked: Universe Architect! You may now shape stars and worlds. Open the Creation view (🌠).','success');api().say('Governor... no. Architect. The Royal Heavenly Host grants you the Loom of Creation. Design a world in the Architect tab: choose its star, size, sky and lands, then seed life.');if(AC.chron)AC.chron(G,'era','The Host bestowed the Loom of Creation, and the Governor became a Universe Architect.');}}
 if(A.unlocked){add('creation',2+A.galaxies.length*3+(G.gal?AC.galaxy.mine(G).length*0.2:0));
  A.worlds.forEach(function(w){var h=habit(w);if(w.terraforming&&w.terra<60){w.terra+=1;if(w.terra%10===0)api().toast(w.n+' terraforming: habitability '+habit(w)+'%.');if(habit(w)>=90||w.terra>=60)w.terraforming=false;}
   var li=LIFE.indexOf(w.life);if(li>0&&li<4&&h>=30+li*15&&Math.random()<0.02*(h/100)){w.life=LIFE[li+1];api().toast('Life evolves on '+w.n+': '+LIFEN[w.life]+'!','success');if(AC.chron)AC.chron(G,'life',LIFEN[w.life]+' arose on the created world of '+w.n+'.');}
   if(w.life==='sapient'||w.race){add('light',1);add('credits',300);add('influence',0.05);}if(w.life!=='none')add('creation',0.3);});
  A.galaxies.forEach(function(g){add('aether',0.5+g.stars/200);});}
 if(!C.unlocked&&A.unlocked&&ready5(G)){if(!owns('cosmos')){if(!C.lockNote){C.lockNote=1;api().toast('Archangel Cosmos expansion is locked. See the Store.');}}
  else{C.unlocked=true;add('omni',20);api().toast('Phase 5 unlocked: Archangel Cosmos! Beyond the universe lies the multiverse.','success');api().say('The veil parts. Beyond our universe drift countless others, Architect. In the Cosmos tab you may kindle new universes and tune their cosmic constants. Ascension awaits.');if(AC.chron)AC.chron(G,'era','The veil between universes parted, and the Architect gazed upon the Cosmos.');}}
 if(C.unlocked){C.universes.forEach(function(u){var s=stability(u);u.age++;if(s>=50)u.life=Math.min(100,u.life+s/400);else u.life=Math.max(0,u.life-0.2);add('omni',0.05+s/600+u.life/300);add('aether',0.1);});}
});

/* ---------- actions ---------- */
function draftFromForm(G){var d=G.arch.draft;['star','size','atm','terrain','life','race'].forEach(function(k){var e=document.getElementById('ad_'+k);if(e)d[k]=e.value;});var n=document.getElementById('ad_name');if(n)d.name=n.value.trim().slice(0,24);var m=document.getElementById('ad_moons');if(m)d.moons=+m.value;var r=document.getElementById('ad_rings');if(r)d.rings=r.checked;}
H.act.archDraft=function(G){draftFromForm(G);};
H.act.createWorld=function(G){var A=G.arch,d=A.draft;draftFromForm(G);if((STARS[d.star].req||TERR[d.terrain].req)&&!G.cos.unlocked)return api().toast('Angelic stars and Celestial gardens need Phase 5.');
 if(d.race&&d.race!=='angelic'&&!(G.races&&G.races[d.race]&&G.races[d.race].met))return api().toast('You can only place races you have met.');
 var c=worldCost(d);if(!pay(G,c))return api().toast('Not enough resources: '+Object.keys(c).map(function(k){return c[k]+' '+AC.RES[k].n;}).join(', '));
 var r=Math.random(),w={id:A.seq++,n:d.name||nm(r),star:d.star,size:d.size,atm:d.atm,terrain:d.terrain,life:d.life,race:d.race,moons:d.moons|0,rings:!!d.rings||d.size==='giant',terra:0,seed:(r*1e6)|0,sys:null,day:G.day};
 A.worlds.push(w);A.sel=w.id;A.mode='planet';if(AC.audio)AC.audio.sfx('success');api().toast('You spoke, and '+w.n+' came into being. Habitability '+habit(w)+'%.','success');
 if(AC.chron)AC.chron(G,'creation','The Architect created the world of '+w.n+', a '+TERR[w.terrain].n.toLowerCase()+' beneath a '+STARS[w.star].n.toLowerCase()+(w.race?', and settled it with '+RACEOPT.find(function(x){return x[0]===w.race;})[1]:'')+'.');texCache={};d.name='';};
H.act.terraform=function(G,id){var w=G.arch.worlds.find(function(x){return x.id===+id;});if(!w)return;if(w.terraforming)return;if(!pay(G,{creation:30,aether:5}))return api().toast('Terraforming needs 30 Creation Energy and 5 Aether Weave.');w.terraforming=true;api().toast('Terraforming begun on '+w.n+'.');};
H.act.seedLife=function(G,id){var w=G.arch.worlds.find(function(x){return x.id===+id;});if(!w||w.life!=='none')return;if(habit(w)<20)return api().toast('Too hostile for life. Terraform first.');if(!pay(G,{creation:25}))return api().toast('Needs 25 Creation Energy.');w.life='microbial';api().toast('Life seeded on '+w.n+'.','success');};
H.act.placeRace=function(G,arg){var p=arg.split(':'),w=G.arch.worlds.find(function(x){return x.id===+p[0];});var sel=document.getElementById('pr_'+p[0]);var race=sel?sel.value:p[1];if(!w||!race)return;if(habit(w)<40)return api().toast('Habitability must be 40%+ to settle a race.');if(!pay(G,{light:200,creation:20}))return api().toast('Needs 200 Light and 20 Creation Energy.');w.race=race;if(w.life!=='sapient')w.life='sapient';api().toast(RACEOPT.find(function(x){return x[0]===race;})[1]+' settle on '+w.n+'.','success');};
H.act.archSel=function(G,arg){var p=arg.split(':');G.arch.mode=p[0];G.arch.sel=+p[1];if(!on)toggle();};
H.act.createSystem=function(G){var A=G.arch,free=A.worlds.filter(function(w){return w.sys==null;});if(free.length<2)return api().toast('Create at least 2 unassigned worlds to bind into a star system.');if(!pay(G,{creation:80,essence:20}))return api().toast('Needs 80 Creation Energy and 20 Stellar Essence.');
 var s={id:A.seq++,n:nm(Math.random())+' System',star:free[0].star,worlds:free.slice(0,6).map(function(w){return w.id;})};free.slice(0,6).forEach(function(w){w.sys=s.id;});A.systems.push(s);A.mode='system';A.sel=s.id;api().toast('The '+s.n+' is bound together.','success');if(AC.chron)AC.chron(G,'creation','The Architect bound '+s.worlds.length+' worlds into the '+s.n+'.');};
H.act.createGalaxy=function(G){var A=G.arch,free=A.systems.filter(function(s){return s.gal==null;});if(free.length<2)return api().toast('A galaxy needs 2 unassigned star systems.');if(!pay(G,{creation:300,cores:10,aether:20}))return api().toast('Needs 300 Creation Energy, 10 Core Fragments, 20 Aether Weave.');
 var gx={id:A.seq++,n:nm(Math.random())+' Galaxy',arms:2+((Math.random()*4)|0),hue:Math.random(),stars:2e9+Math.round(Math.random()*4e11),systems:free.map(function(s){return s.id;})};free.forEach(function(s){s.gal=gx.id;});A.galaxies.push(gx);A.mode='galaxy';A.sel=gx.id;api().toast('A new galaxy spirals into being: '+gx.n+'!','success');if(AC.chron)AC.chron(G,'creation','The '+gx.n+' was woven from '+free.length+' star systems.');};
H.act.createUniverse=function(G){var C=G.cos,d=C.draft;['gravity','light','entropy','harmony'].forEach(function(k){var e=document.getElementById('uc_'+k);if(e)d[k]=+e.value;});var n=document.getElementById('uc_name');d.name=n?n.value.trim().slice(0,24):'';
 if(!pay(G,{omni:20+C.universes.length*15,creation:200}))return api().toast('Kindling a universe needs '+(20+C.universes.length*15)+' Omniversal Light and 200 Creation Energy.');
 var u={id:Date.now()%1e7,n:d.name||'Universe '+['Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta','Iota','Kappa'][C.universes.length%10]+(C.universes.length>=10?' '+C.universes.length:''),c:{gravity:d.gravity,light:d.light,entropy:d.entropy,harmony:d.harmony},age:0,life:0};
 C.universes.push(u);C.sel=C.universes.length-1;G.arch.mode='multiverse';api().toast(u.n+' is born! Stability '+stability(u)+'%.','success');if(AC.chron)AC.chron(G,'creation','A new universe, '+u.n+', was kindled in the Cosmos.');};
H.act.tune=function(G,i){var u=G.cos.universes[+i];if(!u)return;if(!pay(G,{omni:5}))return api().toast('Tuning costs 5 Omniversal Light.');['gravity','light','entropy','harmony'].forEach(function(k){var e=document.getElementById('ut_'+k+'_'+i);if(e)u.c[k]=+e.value;});api().toast(u.n+' retuned. Stability '+stability(u)+'%.');};
H.act.ascend=function(G){var C=G.cos,st=STAGES[C.stage];if(!st)return;if(st.test&&!st.test(G))return api().toast('Requirement not met: '+st.d);if(G.council.favor<st.favor)return api().toast('The Royal Heavenly Host must lend '+st.favor+' Favour (you have '+Math.floor(G.council.favor)+').');
 if(!pay(G,st.cost))return api().toast('Not enough resources for '+st.n+'.');G.council.favor-=st.favor/2;C.stage++;api().toast('Ascension: '+st.n+' achieved!','success');if(api().checkMissions)api().checkMissions();if(AC.chron)AC.chron(G,'era','The Architect attained '+st.n+'.');if(C.stage>=STAGES.length){C.ended=true;if(AC.chron)AC.chron(G,'era','The Governor of Elysia ascended as Archangel Prime, guardian of the Cosmos.');setTimeout(function(){ending(G);},400);}};
H.act.credits=function(G){ending(G);};
H.act.toggleArch=function(){toggle();};
function ending(G){var w=document.createElement('div');w.id='ending';var cs=['ARCHANGEL COSMOS','','A game designed by','Michael Manning','','Built with Grok Bot','','Royal Heavenly Host','The Grand Royal Council','The Houses of the Archangels','','Peoples of the Cosmos','Angelic Humans · Lumarians · Aethari','Titanborn · Celestians','','Rendering: three.js (MIT licence)','Music & sound: synthesised with the Web Audio API','','Your Chronicle','Day '+G.day+' · '+api().fmt(G.pop)+' souls on Elysia',(G.arch.worlds.length+' worlds created · '+G.cos.universes.length+' universes kindled'),'','Thank you for playing.','','The Cosmos is endless.'];
 w.innerHTML='<div class="end-glow"></div><div class="end-title">You have ascended as<br><b>Archangel Prime</b></div><p class="end-lore">The light of Elysia now shines across every universe you kindled. The Royal Heavenly Host bows, the races sing, and the Throne of Creation is yours to guard forever.</p><div class="credits"><div class="roll">'+cs.map(function(l){return '<div>'+(l||'&nbsp;')+'</div>';}).join('')+'</div></div><button id="endSandbox">Continue in endless sandbox</button>';
 document.body.appendChild(w);if(AC.audio)AC.audio.sfx('success');document.getElementById('endSandbox').onclick=function(){G.cos.sandbox=true;w.remove();api().toast('Endless sandbox: creation costs are halved. Keep building forever.','success');api().render();};}

/* ---------- missions ---------- */
[{id:'U01',n:'The Loom of Creation',d:'Unlock Universe Architect (hold 6 star systems, gather 10 Core Fragments).',check:function(G){return G.arch.unlocked;},reward:{creation:50}},
 {id:'U02',n:'Let There Be a World',d:'Create your first world.',check:function(G){return G.arch.worlds.length>=1;},reward:{creation:40}},
 {id:'U03',n:'Breath of Life',d:'Seed life on a created world.',check:function(G){return G.arch.worlds.some(function(w){return w.life!=='none';});},reward:{light:200}},
 {id:'U04',n:'Terraformer',d:'Terraform a world to 70% habitability.',check:function(G){return G.arch.worlds.some(function(w){return habit(w)>=70&&w.terra>0;});},reward:{aether:20}},
 {id:'U05',n:'A New People',d:'Settle a race on a created world.',check:function(G){return G.arch.worlds.some(function(w){return !!w.race;});},reward:{influence:30}},
 {id:'U06',n:'System Lord',d:'Bind worlds into a star system.',check:function(G){return G.arch.systems.length>=1;},reward:{creation:150}},
 {id:'U07',n:'Galaxy Architect',d:'Weave a galaxy.',check:function(G){return G.arch.galaxies.length>=1;},reward:{aether:50}},
 {id:'U08',n:'Garden of Minds',d:'Have 3 worlds with sapient life.',check:function(G){return G.arch.worlds.filter(function(w){return w.life==='sapient';}).length>=3;},reward:{credits:500000}},
 {id:'X01',n:'Beyond the Veil',d:'Unlock Archangel Cosmos (a galaxy and 3 sapient worlds).',check:function(G){return G.cos.unlocked;},reward:{omni:20}},
 {id:'X02',n:'Universe Creator',d:'Kindle your first universe.',check:function(G){return G.cos.universes.length>=1;},reward:{omni:20}},
 {id:'X03',n:'Fine-Tuned',d:'Reach 90% stability in a universe.',check:function(G){return G.cos.universes.some(function(u){return stability(u)>=90;});},reward:{aether:100}},
 {id:'X04',n:'Multiverse',d:'Hold 3 universes.',check:function(G){return G.cos.universes.length>=3;},reward:{omni:60}},
 {id:'X05',n:'The First Ascension',d:'Attain Angelic Ascension.',check:function(G){return G.cos.stage>=1;},reward:{light:1000}},
 {id:'X06',n:'Choir of the Host',d:'Reach the Choir of the Host stage.',check:function(G){return G.cos.stage>=4;},reward:{omni:100}},
 {id:'X07',n:'Archangel Prime',d:'Complete the Celestial Ascension.',check:function(G){return G.cos.stage>=STAGES.length;},reward:{omni:500}}
].forEach(function(m){m.phase=m.id[0]==='U'?'architect':'cosmos';var c=m.check;m.check=function(G){return !!(G.arch&&G.cos)&&(m.id==='U01'||m.phase==='architect'&&G.arch.unlocked||m.phase==='cosmos'&&G.cos.unlocked&&m.id!=='X01'||m.id==='X01')&&c(G);};AC.MISSIONS.push(m);});

/* ---------- 3D creation view ---------- */
var on=false,T,R,scene,cam,cvs,group,starL,texCache={},yaw=0,pitch=0.3,dist=6,drag=null,built='',t0=0;
function active(){return on;}
function webgl(){return AC.v3d&&AC.v3d.webgl();}
function toggle(){var G=api().state();if(!on&&!G.arch.unlocked)return api().toast(owns('architect')?'Universe Architect unlocks after Galactic Empires: hold 6 star systems and gather 10 Celestial Core Fragments.':'Universe Architect expansion is locked. See the Store.');
 if(!on){if(AC.street&&AC.street.active())AC.street.exit();if(AC.galaxy&&AC.galaxy.active())AC.galaxy.toggle();if(AC.space&&AC.space.active())AC.space.toggle();}
 on=!on;document.body.classList.toggle('arch',on);if(on){if(webgl())load(init);api().switchTab(G.cos.unlocked&&G.arch.mode==='multiverse'?'cosmos':'architect');}api().render();}
function load(cb){if(window.THREE)return cb();var s=document.createElement('script');s.src='js/vendor/three.min.js';s.onload=cb;document.head.appendChild(s);}
function init(){if(R)return;T=window.THREE;var wrap=document.getElementById('mapWrap');cvs=document.createElement('canvas');cvs.id='arch3d';wrap.appendChild(cvs);
 R=new T.WebGLRenderer({canvas:cvs,antialias:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.outputColorSpace=T.SRGBColorSpace;scene=new T.Scene();cam=new T.PerspectiveCamera(45,1,0.05,2000);
 scene.add(new T.AmbientLight(0x445577,0.9));starL=new T.PointLight(0xffffff,3,0,0);scene.add(starL);
 // starfield
 var g=new T.BufferGeometry(),n=3000,p=new Float32Array(n*3),c=new Float32Array(n*3);for(var i=0;i<n;i++){var v=new T.Vector3().randomDirection().multiplyScalar(400+Math.random()*400);p.set([v.x,v.y,v.z],i*3);var k=0.6+Math.random()*0.4;c.set([k,k,k*(0.9+Math.random()*0.2)],i*3);}
 g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('color',new T.BufferAttribute(c,3));scene.add(new T.Points(g,new T.PointsMaterial({size:1.6,vertexColors:true,sizeAttenuation:false})));
 group=new T.Group();scene.add(group);
 cvs.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,yaw:yaw,pitch:pitch};cvs.setPointerCapture(e.pointerId);});
 cvs.addEventListener('pointermove',function(e){if(!drag)return;yaw=drag.yaw-(e.clientX-drag.x)*0.006;pitch=Math.max(-1.3,Math.min(1.3,drag.pitch+(e.clientY-drag.y)*0.005));});
 cvs.addEventListener('pointerup',function(){drag=null;});cvs.addEventListener('wheel',function(e){e.preventDefault();dist=Math.max(1.5,Math.min(400,dist*(e.deltaY<0?0.9:1.1)));},{passive:false});size();addEventListener('resize',size);}
function size(){if(!R)return;var p=cvs.parentElement,w=p.clientWidth||300,h=p.clientHeight||200;R.setSize(w,h,false);cvs.style.width=w+'px';cvs.style.height=h+'px';cam.aspect=w/h;cam.updateProjectionMatrix();}
function hash(x,y,s){var h=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return h-Math.floor(h);}
function vn(x,y,s){var xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return hash(xi,yi,s)*(1-u)*(1-v)+hash(xi+1,yi,s)*u*(1-v)+hash(xi,yi+1,s)*(1-u)*v+hash(xi+1,yi+1,s)*u*v;}
function planetTex(w){var key=w.id+':'+w.terrain+':'+w.terra+':'+w.life;if(texCache[key])return texCache[key];var W=256,Hh=128,c=document.createElement('canvas');c.width=W;c.height=Hh;var x=c.getContext('2d'),img=x.createImageData(W,Hh),d=img.data,t=TERR[w.terrain],pal=t.pal.map(function(h){return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)];}),s=w.seed%1000,sea=w.terrain==='ocean'?0.68:Math.max(0.02,t.sea-w.terra/300),gas=w.size==='giant';
 for(var j=0;j<Hh;j++)for(var i=0;i<W;i++){var lon=i/W*6.283,lat=(j/Hh-0.5)*3.1416,cx=Math.cos(lat)*Math.cos(lon),cy=Math.sin(lat),cz=Math.cos(lat)*Math.sin(lon),h=0,a=1,f=1.5;
  if(gas){h=0.5+0.5*Math.sin(cy*14+vn(cx*3+s,cz*3,s)*3);}else for(var o=0;o<5;o++){h+=a*vn(cx*f+s+cz*0.7*f,cy*f+cz*f*0.6,s+o);a*=0.5;f*=2.1;}if(!gas)h/=1.9;
  var col,ice=Math.abs(cy)>0.88-w.terra/400&&w.terrain!=='volcanic';if(gas){var k=Math.floor(h*(pal.length-0.01));col=pal[k];}else if(h<sea){col=pal[h<sea*0.7?0:1];}else{var q=(h-sea)/(1-sea),k2=Math.min(pal.length-1,2+Math.floor(q*(pal.length-2)*1.2));col=pal[k2];if(w.life!=='none'&&w.life!=='microbial'&&q<0.5&&w.terrain!=='volcanic'&&w.terrain!=='ocean'){col=[col[0]*0.6+40,col[1]*0.7+70,col[2]*0.6+30];}}
  if(ice)col=[240,246,252];var p=(j*W+i)*4,sh=0.85+vn(i*0.2,j*0.2,9)*0.3;d[p]=Math.min(255,col[0]*sh);d[p+1]=Math.min(255,col[1]*sh);d[p+2]=Math.min(255,col[2]*sh);d[p+3]=255;}
 x.putImageData(img,0,0);if(w.life==='sapient'){x.fillStyle='rgba(255,230,150,.0)';}var tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;texCache[key]=tex;return tex;}
function cloudTex(){if(texCache.clouds)return texCache.clouds;var c=document.createElement('canvas');c.width=256;c.height=128;var x=c.getContext('2d'),img=x.createImageData(256,128);for(var j=0;j<128;j++)for(var i=0;i<256;i++){var v=vn(i/18,j/12,3)*0.6+vn(i/7,j/5,4)*0.4,a=Math.max(0,(v-0.55)*3);var p=(j*256+i)*4;img.data[p]=img.data[p+1]=img.data[p+2]=255;img.data[p+3]=a*255;}x.putImageData(img,0,0);return texCache.clouds=new T.CanvasTexture(c);}
function glowMat(col,op){return new T.ShaderMaterial({uniforms:{c:{value:new T.Color(col)},o:{value:op||1}},vertexShader:'varying vec3 n;varying vec3 v;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform vec3 c;uniform float o;varying vec3 n;varying vec3 v;void main(){float i=pow(1.-abs(dot(n,v)),2.5);gl_FragColor=vec4(c,i*o);}',transparent:true,blending:T.AdditiveBlending,side:T.BackSide,depthWrite:false});}
function planetMesh(w,scale){var g=new T.Group(),r=SIZES[w.size].r*(scale||1);var m=new T.Mesh(new T.SphereGeometry(r,64,32),new T.MeshStandardMaterial({map:planetTex(w),roughness:0.85,metalness:0}));g.add(m);g.userData.spin=m;
 var a=ATM[w.atm];if(a.col){var gl=new T.Mesh(new T.SphereGeometry(r*1.12,48,24),glowMat(a.col,1.2));g.add(gl);if(w.size!=='giant'&&w.atm!=='thin'){var cl=new T.Mesh(new T.SphereGeometry(r*1.015,48,24),new T.MeshStandardMaterial({map:cloudTex(),transparent:true,depthWrite:false,opacity:w.atm==='dense'?0.95:0.7}));g.add(cl);g.userData.clouds=cl;}}
 if(w.rings){var rg=new T.Mesh(new T.RingGeometry(r*1.4,r*2.3,96),new T.MeshStandardMaterial({color:0xe8d8b0,side:T.DoubleSide,transparent:true,opacity:0.55}));rg.rotation.x=-1.25;g.add(rg);}
 for(var i=0;i<w.moons;i++){var mo=new T.Mesh(new T.SphereGeometry(r*0.18,24,12),new T.MeshStandardMaterial({color:0xbbb6aa,roughness:1}));mo.userData.orbit={r:r*(2.2+i*0.7),s:0.3/(i+1),o:i*2};g.add(mo);(g.userData.moons=g.userData.moons||[]).push(mo);}
 if(w.life==='sapient'||w.race){var lights=new T.Mesh(new T.SphereGeometry(r*1.003,48,24),new T.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0.12,blending:T.AdditiveBlending,depthWrite:false}));g.add(lights);}return g;}
function starMesh(type,r){var s=STARS[type],g=new T.Group();g.add(new T.Mesh(new T.SphereGeometry(r,32,16),new T.MeshBasicMaterial({color:s.c})));var gl=new T.Mesh(new T.SphereGeometry(r*2.2,32,16),glowMat(s.col,1.6));gl.material.side=T.FrontSide;
 gl.material.fragmentShader='uniform vec3 c;uniform float o;varying vec3 n;varying vec3 v;void main(){float i=pow(abs(dot(n,v)),3.);gl_FragColor=vec4(c,i*o);}';g.add(gl);if(type==='binary'){var b=new T.Mesh(new T.SphereGeometry(r*0.6,24,12),new T.MeshBasicMaterial({color:0xffb070}));b.position.x=r*2.5;g.add(b);g.userData.bin=b;}return g;}
function galaxyPoints(gx,R0,n){var g=new T.BufferGeometry(),p=new Float32Array(n*3),c=new Float32Array(n*3),col=new T.Color();for(var i=0;i<n;i++){var arm=i%gx.arms,t=Math.pow(Math.random(),0.7),a=t*7+arm*6.283/gx.arms+(Math.random()-.5)*0.5/(t+0.2),r=t*R0;
  p.set([Math.cos(a)*r+(Math.random()-.5)*R0*0.06,(Math.random()-.5)*R0*0.05*(1-t),Math.sin(a)*r+(Math.random()-.5)*R0*0.06],i*3);col.setHSL((gx.hue+t*0.25)%1,0.6,0.55+(1-t)*0.35);c.set([col.r,col.g,col.b],i*3);}
 g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('color',new T.BufferAttribute(c,3));return new T.Points(g,new T.PointsMaterial({size:R0/90,vertexColors:true,transparent:true,opacity:0.9,blending:T.AdditiveBlending,depthWrite:false}));}
function rebuild(G){while(group.children.length)group.remove(group.children[0]);var A=G.arch,mode=A.mode;scene.background=new T.Color(0x02030c);starL.position.set(0,0,0);
 if(mode==='multiverse'&&G.cos.unlocked){G.cos.universes.forEach(function(u,i){var a=i/Math.max(1,G.cos.universes.length)*6.283,s=stability(u),gx={arms:2+(u.c.harmony/25|0),hue:u.c.light/120};var b=new T.Group();b.add(new T.Mesh(new T.SphereGeometry(4.5,32,16),glowMat(new T.Color().setHSL(u.c.light/120,0.7,0.6),0.8+s/100)));
   var pts=galaxyPoints(gx,4,1500);b.add(pts);b.position.set(Math.cos(a)*16,Math.sin(i*1.7)*3,Math.sin(a)*14);b.userData.u=u;group.add(b);});
  if(!G.cos.universes.length){var em=new T.Mesh(new T.SphereGeometry(5,32,16),glowMat('#ffd76a',1));group.add(em);}starL.position.set(0,30,30);dist=Math.max(dist,48);return;}
 if(mode==='galaxy'){var gx=A.galaxies.find(function(x){return x.id===A.sel;})||A.galaxies[0];if(gx){group.add(galaxyPoints(gx,20,14000));var core=new T.Mesh(new T.SphereGeometry(1.4,24,12),glowMat('#fff0c8',2));core.material.side=T.FrontSide;core.material.fragmentShader='uniform vec3 c;uniform float o;varying vec3 n;varying vec3 v;void main(){float i=pow(abs(dot(n,v)),2.);gl_FragColor=vec4(c,i*o);}';group.add(core);dist=Math.max(dist,30);}return;}
 if(mode==='system'){var sy=A.systems.find(function(x){return x.id===A.sel;})||A.systems[0];if(sy){group.add(starMesh(sy.star,1.2));starL.color.setHex(STARS[sy.star].c);sy.worlds.forEach(function(id,i){var w=A.worlds.find(function(x){return x.id===id;});if(!w)return;var pm=planetMesh(w,0.45);pm.userData.orbit={r:4+i*2.6,s:0.25/(1+i*0.6),o:i*1.9};group.add(pm);
   var ring=new T.Mesh(new T.RingGeometry(4+i*2.6-0.01,4+i*2.6+0.01,128),new T.MeshBasicMaterial({color:0x8899cc,transparent:true,opacity:0.3,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;group.add(ring);});dist=Math.max(dist,22);}return;}
 var w=A.worlds.find(function(x){return x.id===A.sel;})||A.worlds[A.worlds.length-1];if(!w){var d=A.draft;w={id:0,n:'preview',star:d.star,size:d.size,atm:d.atm,terrain:d.terrain,life:d.life,moons:d.moons,rings:d.rings||d.size==='giant',terra:0,seed:4242};}
 var pm=planetMesh(w,1);group.add(pm);var st=starMesh(w.star,0.8);st.position.set(-38,10,22);group.add(st);starL.position.copy(st.position);starL.color.setHex(STARS[w.star].c);if(dist>12)dist=6;}
function frame(now){var G=api().state();if(!R){if(!webgl())return frame2d(now,G);return;}var t=now/1000,A=G.arch;
 var sig=A.mode+':'+A.sel+':'+A.worlds.length+':'+A.systems.length+':'+A.galaxies.length+':'+G.cos.universes.length+':'+JSON.stringify(A.draft)+':'+A.worlds.map(function(w){return w.terra+w.life+w.race;}).join(',');if(sig!==built){built=sig;rebuild(G);}
 group.children.forEach(function(o){var u=o.userData;if(u.spin)u.spin.rotation.y=t*0.08;if(u.clouds)u.clouds.rotation.y=t*0.11;if(u.orbit){o.position.set(Math.cos(t*u.orbit.s+u.orbit.o)*u.orbit.r,0,Math.sin(t*u.orbit.s+u.orbit.o)*u.orbit.r);if(u.spin)u.spin.rotation.y=t*0.3;}
  (u.moons||[]).forEach(function(m){var q=m.userData.orbit;m.position.set(Math.cos(t*q.s+q.o)*q.r,Math.sin(t*q.s+q.o)*q.r*0.2,Math.sin(t*q.s+q.o)*q.r);});if(o.isPoints)o.rotation.y=t*0.02;if(u.u)o.rotation.y=t*0.05;if(u.bin)u.bin.position.set(Math.cos(t)*2,0,Math.sin(t)*2);});
 if(!drag)yaw+=0.0015;cam.position.set(Math.sin(yaw)*Math.cos(pitch)*dist,Math.sin(pitch)*dist,Math.cos(yaw)*Math.cos(pitch)*dist);cam.lookAt(0,0,0);R.render(scene,cam);}
function frame2d(now,G){var cv=document.getElementById('map'),x=cv.getContext('2d'),w=cv.width,h=cv.height,t=now/1000;x.setTransform(1,0,0,1,0,0);x.fillStyle='#02030c';x.fillRect(0,0,w,h);
 var W0=G.arch.worlds[G.arch.worlds.length-1],r=Math.min(w,h)*0.3,g=x.createRadialGradient(w/2-r*0.4,h/2-r*0.4,r*0.1,w/2,h/2,r);var pal=W0?TERR[W0.terrain].pal:TERR.temperate.pal;g.addColorStop(0,pal[3]||pal[2]);g.addColorStop(0.7,pal[1]);g.addColorStop(1,'#000');
 x.fillStyle=g;x.beginPath();x.arc(w/2,h/2,r,0,6.283);x.fill();x.fillStyle='#fff';x.font='16px Georgia';x.textAlign='center';x.fillText(W0?W0.n:'Design a world in the Architect tab',w/2,h/2+r+30);}

/* ---------- panels ---------- */
function opt(o,cur,lock){return Object.keys(o).map(function(k){return '<option value="'+k+'"'+(k===cur?' selected':'')+'>'+o[k].n+(o[k].req&&lock?' (Phase 5)':'')+'</option>';}).join('');}
H.panel.architect=function(G){var A=G.arch,cs=api().costStr,fmt=api().fmt;
 if(!A.unlocked)return '<h3>Universe Architect</h3><p>'+(owns('architect')?'Unlocks after Galactic Empires: hold 6 star systems and gather 10 Celestial Core Fragments.':'The Universe Architect expansion is locked. <button data-act="openStore">Open Store</button>')+'</p>';
 var d=A.draft,lock=!G.cos.unlocked,h='<button data-act="toggleArch">'+(on?'🌍 Return to Elysia':'🌠 Open Creation view')+'</button><h3>Universe Architect <small>· '+(G.cos.unlocked?'Universe Creator':A.galaxies.length?'Galaxy Architect':'System Lord')+'</small></h3>';
 h+='<div class="row"><span>'+['creation','aether','cores','essence'].map(function(k){return '<span class="cost">'+AC.art.ICONS[k]+fmt(G.res[k]||0)+'</span>';}).join(' ')+'</span></div>';
 h+='<h3>Creation tool</h3><div class="create">'+
  '<label>Name <input id="ad_name" placeholder="(random)" value="'+(d.name||'').replace(/"/g,'')+'" maxlength="24"></label>'+
  '<label>Star <select id="ad_star" data-arch="1">'+opt(STARS,d.star,lock)+'</select></label><label>Size <select id="ad_size" data-arch="1">'+opt(SIZES,d.size)+'</select></label>'+
  '<label>Atmosphere <select id="ad_atm" data-arch="1">'+opt(ATM,d.atm)+'</select></label><label>Terrain <select id="ad_terrain" data-arch="1">'+opt(TERR,d.terrain,lock)+'</select></label>'+
  '<label>Seed life <select id="ad_life" data-arch="1">'+LIFE.slice(0,4).map(function(l){return '<option value="'+l+'"'+(l===d.life?' selected':'')+'>'+LIFEN[l]+'</option>';}).join('')+'</select></label>'+
  '<label>Place race <select id="ad_race" data-arch="1">'+RACEOPT.map(function(r){var ok=!r[0]||r[0]==='angelic'||(G.races&&G.races[r[0]]&&G.races[r[0]].met);return '<option value="'+r[0]+'"'+(r[0]===d.race?' selected':'')+(ok?'':' disabled')+'>'+r[1]+'</option>';}).join('')+'</select></label>'+
  '<label>Moons <select id="ad_moons" data-arch="1">'+[0,1,2,3].map(function(n){return '<option'+(n===d.moons?' selected':'')+'>'+n+'</option>';}).join('')+'</select></label><label><input type="checkbox" id="ad_rings" data-arch="1"'+(d.rings?' checked':'')+'> Rings</label></div>';
 var pw={id:0,star:d.star,size:d.size,atm:d.atm,terrain:d.terrain,terra:0};h+='<p class="small">Predicted habitability <b>'+habit(pw)+'%</b> · cost '+cs(worldCost(d))+'</p><button data-act="createWorld">✧ Create world</button>';
 h+='<h3>Your worlds ('+A.worlds.length+')</h3>';A.worlds.slice().reverse().forEach(function(w){var hb=habit(w);h+='<div class="card'+(A.sel===w.id&&A.mode==='planet'?' sel':'')+'"><span class="t">'+w.n+'</span> <small>'+STARS[w.star].n+' · '+SIZES[w.size].n+' · '+ATM[w.atm].n+' · '+TERR[w.terrain].n+'</small><br>'+
  '<span class="e">Habitability '+hb+'% · '+LIFEN[w.life]+(w.race?' · '+RACEOPT.find(function(x){return x[0]===w.race;})[1]:'')+(w.terraforming?' · terraforming…':'')+'</span><br><button class="mini" data-act="archSel" data-arg="planet:'+w.id+'">View</button>'+
  (hb<90&&!w.terraforming?'<button class="mini" data-act="terraform" data-arg="'+w.id+'">Terraform (30✧ 5≈)</button>':'')+(w.life==='none'?'<button class="mini" data-act="seedLife" data-arg="'+w.id+'">Seed life</button>':'')+
  (!w.race?'<select id="pr_'+w.id+'">'+RACEOPT.slice(1).filter(function(r){return r[0]==='angelic'||(G.races&&G.races[r[0]]&&G.races[r[0]].met);}).map(function(r){return '<option value="'+r[0]+'">'+r[1]+'</option>';}).join('')+'</select><button class="mini" data-act="placeRace" data-arg="'+w.id+'">Settle race</button>':'')+'</div>';});
 h+='<h3>Star systems ('+A.systems.length+')</h3><button data-act="createSystem">Bind 2–6 free worlds into a system (80✧ 20 Essence)</button>'+A.systems.map(function(s){return '<button class="mini" data-act="archSel" data-arg="system:'+s.id+'">'+s.n+' ('+s.worlds.length+')</button>';}).join('');
 h+='<h3>Galaxies ('+A.galaxies.length+')</h3><button data-act="createGalaxy">Weave a galaxy from 2+ free systems (300✧ 10 Cores 20≈)</button>'+A.galaxies.map(function(g){return '<button class="mini" data-act="archSel" data-arg="galaxy:'+g.id+'">'+g.n+' ('+g.arms+' arms)</button>';}).join('');
 return h;};
H.panel.cosmos=function(G){var C=G.cos,fmt=api().fmt;
 if(!C.unlocked)return '<h3>Archangel Cosmos</h3><p>'+(owns('cosmos')?'Unlocks after Universe Architect: weave a galaxy and raise 3 worlds with sapient life.':'The Archangel Cosmos expansion is locked. <button data-act="openStore">Open Store</button>')+'</p>';
 var d=C.draft,sl=function(id,k,v){return '<label>'+k[0].toUpperCase()+k.slice(1)+' <input type="range" min="0" max="100" id="'+id+'" value="'+v+'"></label>';};
 var h='<button data-act="archSel" data-arg="multiverse:0">🌌 View the multiverse</button>'+(on?'<button data-act="toggleArch">🌍 Return to Elysia</button>':'')+'<h3>Archangel Cosmos <small>· '+(C.ended?'Archangel Prime':'Universe Creator')+(C.sandbox?' · Endless sandbox':'')+'</small></h3>';
 h+='<div class="row"><span>'+['omni','aether','creation'].map(function(k){return '<span class="cost">'+AC.art.ICONS[k]+fmt(G.res[k]||0)+'</span>';}).join(' ')+'</span><span>Host favour '+Math.floor(G.council.favor)+'</span></div>';
 h+='<h3>Kindle a universe</h3><p class="small">Cosmic constants shape a universe. The Aethari archives say creation is most stable when gravity, light and entropy stand in the Archangel ratios. Experiment!</p><div class="create"><label>Name <input id="uc_name" maxlength="24" placeholder="(auto)"></label>'+sl('uc_gravity','gravity',d.gravity)+sl('uc_light','light',d.light)+sl('uc_entropy','entropy',d.entropy)+sl('uc_harmony','harmony',d.harmony)+'</div>';
 h+='<button data-act="createUniverse">☼ Kindle universe ('+(20+C.universes.length*15)+' ☼, 200 ✧)</button>';
 h+='<h3>Your multiverse ('+C.universes.length+')</h3>';C.universes.forEach(function(u,i){var s=stability(u);h+='<div class="card"><span class="t">'+u.n+'</span> <small>age '+fmt(u.age)+' aeons</small><br><span class="e">Stability <b style="color:'+(s>=80?'#7f7':s>=50?'#ffd':'#f88')+'">'+s+'%</b> · life '+Math.round(u.life)+'%</span>'+
  '<details><summary class="small">Tune constants (5 ☼)</summary><div class="create">'+['gravity','light','entropy','harmony'].map(function(k){return sl('ut_'+k+'_'+i,k,u.c[k]);}).join('')+'</div><button class="mini" data-act="tune" data-arg="'+i+'">Apply</button></details></div>';});
 h+='<h3>Celestial Ascension</h3><div class="asc">'+STAGES.map(function(s,i){return '<div class="card'+(i<C.stage?' done':i===C.stage?' sel':' locked')+'"><span class="t">'+(i<C.stage?'✓ ':'')+(i+1)+'. '+s.n+'</span><br><span class="e">'+s.d+' Host favour '+s.favor+'.</span>'+(i===C.stage?'<br>'+api().costStr(s.cost)+' <button data-act="ascend">Ascend</button>':'')+'</div>';}).join('')+'</div>';
 if(C.ended)h+='<p>You are Archangel Prime. The Cosmos is yours to shape forever.</p><button data-act="credits">Watch the ending again</button>';return h;};
H.init.push(function(){var side=document.getElementById('side');if(side._archBound)return;side._archBound=1;side.addEventListener('change',function(e){if(e.target.dataset&&e.target.dataset.arch){var G=api().state();draftFromForm(G);G.arch.mode='planet';G.arch.sel=null;api().render();}});});
H.advise.push(function(G){if(G.arch&&G.arch.unlocked&&!G.arch.worlds.length)return 'Architect, open the Architect tab and create your first world.';if(G.cos&&G.cos.unlocked&&!G.cos.universes.length)return 'Kindle your first universe in the Cosmos tab.';return null;});
if(AC.advisor&&AC.advisor.KB){AC.advisor.KB.push({k:['architect','creation','create','world','planet','terraform','terraforming','galaxy','phase 4','star'],a:'Phase 4 Universe Architect unlocks when you hold 6 star systems and have gathered 10 Celestial Core Fragments. In the Architect tab, pick a star, size, atmosphere and terrain, seed life and place races, then create the world. Terraform hostile worlds, bind worlds into systems and weave systems into galaxies. Creation Energy powers it all.'},
 {k:['cosmos','universe','universes','multiverse','constants','gravity','entropy','phase 5'],a:'Phase 5 Archangel Cosmos unlocks after you weave a galaxy and raise 3 sapient worlds. Kindle universes and tune their gravity, light, entropy and harmony. Ancient lore hints that gravity around 60, light near 70 and entropy near 35 are most stable. Stable universes grow life and yield Omniversal Light.'},
 {k:['ascension','ascend','prime','ending','endgame','credits','sandbox','win'],a:'Celestial Ascension has six stages: Angelic Ascension, Universe Engineering, Reality Architecture, Choir of the Host, Seraphic Transfiguration and Archangel Prime. Each needs Omniversal Light and the favour of the Royal Heavenly Host. Completing it shows the ending and credits, then you can keep playing in an endless sandbox with halved creation costs.'});}
AC.arch={active:active,toggle:toggle,frame:frame,habit:habit,stability:stability,STAGES:STAGES,ready4:ready4,ready5:ready5};

/* ---------- dev/test: jump to phase (only with ?dev=1) ---------- */
var DEV=/[?&]dev=1/.test(location.search);
function jump(n){var G=api().state();if(!G)return;var add=function(o){for(var k in o)G.res[k]=(G.res[k]||0)+o[k];};
 add({credits:5e6,food:5e4,water:5e4,energy:5e4,iron:5e4,metal:2e4,goods:1e4,research:5000,light:5000,titanium:5000,crystal:2000});if(!G.counts.capital){G.counts.capital=1;}
 if(n>=2){G.space.colony=true;G.missions.M19=true;}
 if(n>=3){add({he3:2000,gas:2000,qmatter:2000,darke:500,topazium:500});G.gal.forceUnlock=true;}
 if(n>=4){add({essence:2000,cores:500,influence:500});G.arch.force=true;}
 if(n>=5){add({creation:5000,aether:2000,omni:1000});G.cos.force=true;G.council.favor=100;}
 for(var i=0;i<3;i++)api().tick();api().toast('[dev] Jumped to Phase '+n+'.');api().render();}
if(DEV)H.panel.menuDev=true;
AC.dev={enabled:DEV,jump:jump};
H.init.push(function(){if(!DEV||document.getElementById('devBox'))return;var box=document.getElementById('settingsBox');if(!box)return;var d=document.createElement('div');d.id='devBox';d.className='card';
 d.innerHTML='<b>Developer / testing</b> <small>(visible only with ?dev=1)</small><br>Jump to phase: '+[2,3,4,5].map(function(n){return '<button class="mini" data-jump="'+n+'">'+n+'</button>';}).join('');box.parentNode.insertBefore(d,box.nextSibling);
 d.addEventListener('click',function(e){var b=e.target.closest('[data-jump]');if(b)jump(+b.dataset.jump);});});
})();
